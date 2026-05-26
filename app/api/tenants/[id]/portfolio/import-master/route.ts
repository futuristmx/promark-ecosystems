import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  requirePermission,
  isErrorResponse,
  getSessionUserId,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';

/**
 * POST /api/tenants/[id]/portfolio/import-master
 *
 * Accepts a CSV file via FormData and auto-detects the entity type from column
 * headers. Delegates to the appropriate import logic (holdings → companies →
 * brands → holders → contracts → licenses).
 *
 * Supports a "master" CSV that contains a `tipo_entidad` column — each row is
 * routed to the correct entity. If no `tipo_entidad` column exists, the type is
 * inferred from header names.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;

  const { id: tenantId } = await params;

  const permError = await requirePermission({
    userId: getSessionUserId(session),
    userType: getSessionUserType(session),
    role: getSessionRole(session),
    module: 'corporate_structure',
    action: 'CREATE',
  });
  if (permError) return permError;

  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado.' }, { status: 404 });
  }

  let text: string;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo CSV requerido.' }, { status: 400 });
    }
    text = await file.text();
  } catch {
    return NextResponse.json({ error: 'Error leyendo el archivo.' }, { status: 400 });
  }

  const rows = parseCSV(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV vacío o sin datos.' }, { status: 400 });
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()));

  // Detect entity type from headers
  const type = detectType(headers);
  if (!type) {
    return NextResponse.json(
      {
        error:
          'No se pudo determinar el tipo de entidad. Asegúrate de que el CSV tenga columnas reconocidas (nombre, empresa, marca, licenciatario, titulo, etc.).',
      },
      { status: 400 },
    );
  }

  const results: ImportResults = { created: 0, updated: 0, skipped: 0, errors: [] };

  switch (type) {
    case 'holdings':
      await importHoldings(tenantId, headers, dataRows, results);
      break;
    case 'companies':
      await importCompanies(tenantId, headers, dataRows, results);
      break;
    case 'brands':
      await importBrands(tenantId, headers, dataRows, results);
      break;
    case 'holders':
      await importHolders(tenantId, headers, dataRows, results);
      break;
    case 'contracts':
      await importContracts(tenantId, headers, dataRows, results);
      break;
    case 'licenses':
      await importLicenses(tenantId, headers, dataRows, results);
      break;
  }

  return NextResponse.json({
    type,
    total: dataRows.length,
    created: results.created,
    updated: results.updated,
    skipped: results.skipped,
    errors: results.errors.slice(0, 50), // cap to avoid huge payloads
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

interface ImportResults {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function detectType(headers: string[]): string | null {
  const h = new Set(headers);
  // Order matters — more specific first
  if (h.has('licenciatario') && h.has('marca')) return 'licenses';
  if (h.has('titulo') && (h.has('tipo') || h.has('fecha_inicio'))) return 'contracts';
  if (h.has('empresa') && h.has('nombre')) return 'brands';
  if (h.has('holding') && h.has('razon_social')) return 'companies';
  if (h.has('razon_social') && h.has('nombre') && !h.has('empresa')) return 'holdings';
  if (h.has('curp') || h.has('nacionalidad') || (h.has('tipo') && h.has('rfc') && !h.has('empresa'))) return 'holders';
  if (h.has('nombre') && h.has('razon_social')) return 'holdings';
  if (h.has('nombre')) return 'holders';
  return null;
}

function col(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx >= 0 ? (row[idx]?.trim() ?? '') : '';
}

// ── Holdings ────────────────────────────────────────────────────────────────

async function importHoldings(
  tenantId: string,
  headers: string[],
  rows: string[][],
  r: ImportResults,
) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const id = col(headers, row, 'id');
      const name = col(headers, row, 'nombre');
      const legal_name = col(headers, row, 'razon_social');
      if (!name || !legal_name) { r.errors.push(`Fila ${i + 2}: nombre y razon_social requeridos.`); r.skipped++; continue; }
      const data = {
        name,
        legal_name,
        rfc: col(headers, row, 'rfc') || undefined,
        country: col(headers, row, 'pais') || undefined,
        notes: col(headers, row, 'notas') || undefined,
      };
      if (id) { await prisma.holding.update({ where: { id }, data }); r.updated++; }
      else { await prisma.holding.create({ data: { tenant_id: tenantId, ...data } }); r.created++; }
    } catch (e) { r.errors.push(`Fila ${i + 2}: ${(e as Error).message}`); }
  }
}

// ── Companies ───────────────────────────────────────────────────────────────

async function importCompanies(
  tenantId: string,
  headers: string[],
  rows: string[][],
  r: ImportResults,
) {
  const holdings = await prisma.holding.findMany({ where: { tenant_id: tenantId }, select: { id: true, name: true } });
  const holdingMap = new Map(holdings.map((h) => [h.name.toLowerCase(), h.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const id = col(headers, row, 'id');
      const name = col(headers, row, 'nombre');
      const legal_name = col(headers, row, 'razon_social');
      const holdingName = col(headers, row, 'holding');
      if (!name || !legal_name) { r.errors.push(`Fila ${i + 2}: nombre y razon_social requeridos.`); r.skipped++; continue; }
      const holdingId = holdingMap.get(holdingName.toLowerCase());
      if (!id && !holdingId) { r.errors.push(`Fila ${i + 2}: Holding "${holdingName}" no encontrado.`); r.skipped++; continue; }
      const extra = {
        rfc: col(headers, row, 'rfc') || undefined,
        company_type: (col(headers, row, 'tipo') || 'SUBSIDIARY').toUpperCase() as import('@prisma/client').CompanyType,
        country: col(headers, row, 'pais') || undefined,
        state: col(headers, row, 'estado_entidad') || undefined,
      };
      if (id) { await prisma.company.update({ where: { id }, data: { name, legal_name, ...extra } }); r.updated++; }
      else { await prisma.company.create({ data: { tenant_id: tenantId, holding_id: holdingId!, name, legal_name, ...extra } }); r.created++; }
    } catch (e) { r.errors.push(`Fila ${i + 2}: ${(e as Error).message}`); }
  }
}

// ── Brands ──────────────────────────────────────────────────────────────────

async function importBrands(
  tenantId: string,
  headers: string[],
  rows: string[][],
  r: ImportResults,
) {
  const companies = await prisma.company.findMany({ where: { tenant_id: tenantId }, select: { id: true, name: true } });
  const companyMap = new Map(companies.map((c) => [c.name.toLowerCase(), c.id]));

  const VALID_LEGAL = new Set(['APPLIED','PUBLISHED','REGISTERED','RENEWED','EXPIRED','CANCELLED','OPPOSED','IN_LITIGATION']);
  const VALID_TYPE = new Set(['WORDMARK','FIGURATIVE','MIXED','THREE_D','SOUND','HOLOGRAM','TRADE_DRESS']);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const id = col(headers, row, 'id');
      const name = col(headers, row, 'nombre');
      const companyName = col(headers, row, 'empresa');
      if (!name) { r.errors.push(`Fila ${i + 2}: nombre requerido.`); r.skipped++; continue; }
      const companyId = companyMap.get(companyName.toLowerCase());
      if (!id && !companyId) { r.errors.push(`Fila ${i + 2}: Empresa "${companyName}" no encontrada.`); r.skipped++; continue; }
      const brandTypeRaw = (col(headers, row, 'tipo') || 'WORDMARK').toUpperCase();
      const legalRaw = (col(headers, row, 'estado_legal') || 'APPLIED').toUpperCase();
      const brand_type = VALID_TYPE.has(brandTypeRaw) ? brandTypeRaw : 'WORDMARK';
      const legal_status = VALID_LEGAL.has(legalRaw) ? legalRaw : 'APPLIED';
      const regNum = col(headers, row, 'numero_registro') || undefined;
      const expStr = col(headers, row, 'fecha_vencimiento');
      const expiration_date = expStr ? new Date(expStr) : undefined;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (id) {
        await prisma.brand.update({
          where: { id },
          data: { name, slug, brand_type: brand_type as import('@prisma/client').BrandType, legal_status: legal_status as import('@prisma/client').LegalStatus, registration_number: regNum, expiration_date },
        });
        r.updated++;
      } else {
        await prisma.brand.create({
          data: { tenant_id: tenantId, company_id: companyId!, name, slug, brand_type: brand_type as import('@prisma/client').BrandType, legal_status: legal_status as import('@prisma/client').LegalStatus, registration_number: regNum, expiration_date },
        });
        r.created++;
      }
    } catch (e) { r.errors.push(`Fila ${i + 2}: ${(e as Error).message}`); }
  }
}

// ── Holders ─────────────────────────────────────────────────────────────────

async function importHolders(
  tenantId: string,
  headers: string[],
  rows: string[][],
  r: ImportResults,
) {
  const VALID_HTYPE = new Set(['INDIVIDUAL', 'CORPORATION']);
  const VALID_HSTATUS = new Set(['ACTIVE', 'INACTIVE']);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const id = col(headers, row, 'id');
      const name = col(headers, row, 'nombre');
      if (!name) { r.errors.push(`Fila ${i + 2}: nombre requerido.`); r.skipped++; continue; }
      const htRaw = (col(headers, row, 'tipo') || 'INDIVIDUAL').toUpperCase();
      const holder_type = VALID_HTYPE.has(htRaw) ? htRaw : 'INDIVIDUAL';
      const statusRaw = (col(headers, row, 'estado') || 'ACTIVE').toUpperCase();
      const status = VALID_HSTATUS.has(statusRaw) ? statusRaw : 'ACTIVE';
      const data = {
        name,
        holder_type: holder_type as import('@prisma/client').HolderType,
        rfc: col(headers, row, 'rfc') || undefined,
        curp: col(headers, row, 'curp') || undefined,
        nationality: col(headers, row, 'nacionalidad') || undefined,
        notes: col(headers, row, 'notas') || undefined,
        status: status as import('@prisma/client').HolderStatus,
      };
      if (id) { await prisma.holder.update({ where: { id }, data }); r.updated++; }
      else { await prisma.holder.create({ data: { tenant_id: tenantId, ...data } }); r.created++; }
    } catch (e) { r.errors.push(`Fila ${i + 2}: ${(e as Error).message}`); }
  }
}

// ── Contracts ───────────────────────────────────────────────────────────────

async function importContracts(
  tenantId: string,
  headers: string[],
  rows: string[][],
  r: ImportResults,
) {
  const VALID_CTYPE = new Set(['LICENSE_INTERNAL','LICENSE_EXTERNAL','COEXISTENCE','ASSIGNMENT','FRANCHISE','DISTRIBUTION']);
  const VALID_CSTATUS = new Set(['DRAFT','ACTIVE','EXPIRED','TERMINATED','RENEWED','UNDER_REVIEW']);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const id = col(headers, row, 'id');
      const title = col(headers, row, 'titulo');
      if (!title) { r.errors.push(`Fila ${i + 2}: titulo requerido.`); r.skipped++; continue; }
      const ctRaw = (col(headers, row, 'tipo') || 'LICENSE_INTERNAL').toUpperCase();
      const contract_type = VALID_CTYPE.has(ctRaw) ? ctRaw : 'LICENSE_INTERNAL';
      const csRaw = (col(headers, row, 'estado') || 'DRAFT').toUpperCase();
      const status = VALID_CSTATUS.has(csRaw) ? csRaw : 'DRAFT';
      const effStr = col(headers, row, 'fecha_inicio');
      const expStr = col(headers, row, 'fecha_vencimiento');
      const data = {
        title,
        contract_type: contract_type as import('@prisma/client').ContractType,
        status: status as import('@prisma/client').ContractStatus,
        effective_date: effStr ? new Date(effStr) : undefined,
        expiration_date: expStr ? new Date(expStr) : undefined,
        governing_law: col(headers, row, 'ley_aplicable') || undefined,
        notes: col(headers, row, 'notas') || undefined,
      };
      if (id) { await prisma.contract.update({ where: { id }, data }); r.updated++; }
      else { await prisma.contract.create({ data: { tenant_id: tenantId, ...data } }); r.created++; }
    } catch (e) { r.errors.push(`Fila ${i + 2}: ${(e as Error).message}`); }
  }
}

// ── Licenses ────────────────────────────────────────────────────────────────

async function importLicenses(
  tenantId: string,
  headers: string[],
  rows: string[][],
  r: ImportResults,
) {
  const brands = await prisma.brand.findMany({ where: { tenant_id: tenantId }, select: { id: true, name: true } });
  const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
  const VALID_LTYPE = new Set(['EXCLUSIVE', 'NON_EXCLUSIVE', 'SUBLICENSE']);
  const VALID_LSTATUS = new Set(['DRAFT','ACTIVE','EXPIRED','TERMINATED','SUSPENDED']);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const id = col(headers, row, 'id');
      const licensee_name = col(headers, row, 'licenciatario');
      const brandName = col(headers, row, 'marca');
      if (!licensee_name) { r.errors.push(`Fila ${i + 2}: licenciatario requerido.`); r.skipped++; continue; }
      const brandId = brandMap.get(brandName.toLowerCase());
      if (!id && !brandId) { r.errors.push(`Fila ${i + 2}: Marca "${brandName}" no encontrada.`); r.skipped++; continue; }
      const ltRaw = (col(headers, row, 'tipo') || 'NON_EXCLUSIVE').toUpperCase();
      const license_type = VALID_LTYPE.has(ltRaw) ? ltRaw : 'NON_EXCLUSIVE';
      const lsRaw = (col(headers, row, 'estado') || 'DRAFT').toUpperCase();
      const status = VALID_LSTATUS.has(lsRaw) ? lsRaw : 'DRAFT';
      const effStr = col(headers, row, 'fecha_inicio');
      const expStr = col(headers, row, 'fecha_vencimiento');
      const terrStr = col(headers, row, 'territorio');
      const territory = terrStr ? terrStr.split(';').map((t) => t.trim()).filter(Boolean) : [];
      const data = {
        licensee_name,
        license_type: license_type as import('@prisma/client').LicenseType,
        status: status as import('@prisma/client').LicenseStatus,
        licensee_rfc: col(headers, row, 'rfc_licenciatario') || undefined,
        territory,
        effective_date: effStr ? new Date(effStr) : undefined,
        expiration_date: expStr ? new Date(expStr) : undefined,
        notes: col(headers, row, 'notas') || undefined,
      };
      if (id) { await prisma.license.update({ where: { id }, data }); r.updated++; }
      else { await prisma.license.create({ data: { tenant_id: tenantId, brand_id: brandId!, ...data } }); r.created++; }
    } catch (e) { r.errors.push(`Fila ${i + 2}: ${(e as Error).message}`); }
  }
}

// ── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { current.push(field); field = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        current.push(field); field = '';
        lines.push(current); current = [];
        if (ch === '\r') i++;
      } else { field += ch; }
    }
  }
  if (field || current.length) { current.push(field); lines.push(current); }
  return lines;
}

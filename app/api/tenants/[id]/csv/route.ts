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

// ─── GET /api/tenants/[id]/csv?type=brands|holdings|companies ───────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;

  const { id: tenantId } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'brands';

  const permError = await requirePermission({
    userId: getSessionUserId(session),
    userType: getSessionUserType(session),
    role: getSessionRole(session),
    module: type === 'brands' ? 'brands' : 'corporate_structure',
    action: 'READ',
  });
  if (permError) return permError;

  let csv = '';
  const now = new Date().toISOString().slice(0, 10);

  if (type === 'brands') {
    const brands = await prisma.brand.findMany({
      where: { tenant_id: tenantId },
      include: { company: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    csv = 'id,nombre,empresa,tipo,estado_legal,numero_registro,fecha_vencimiento,declaracion_de_uso\n';
    for (const b of brands) {
      csv += [
        b.id, esc(b.name), esc(b.company.name), b.brand_type, b.legal_status,
        b.registration_number ?? '',
        b.expiration_date?.toISOString().slice(0, 10) ?? '',
        b.use_declaration_date?.toISOString().slice(0, 10) ?? '',
      ].join(',') + '\n';
    }
  } else if (type === 'holdings') {
    const holdings = await prisma.holding.findMany({
      where: { tenant_id: tenantId },
      orderBy: { name: 'asc' },
    });
    csv = 'id,nombre,razon_social,rfc,pais,estado,notas\n';
    for (const h of holdings) {
      csv += [
        h.id, esc(h.name), esc(h.legal_name), h.rfc ?? '', h.country ?? '',
        h.status, esc(h.notes ?? ''),
      ].join(',') + '\n';
    }
  } else if (type === 'companies') {
    const companies = await prisma.company.findMany({
      where: { tenant_id: tenantId },
      include: { holding: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    csv = 'id,nombre,razon_social,holding,tipo,rfc,pais,estado_entidad,estado\n';
    for (const c of companies) {
      csv += [
        c.id, esc(c.name), esc(c.legal_name), esc(c.holding.name),
        c.company_type, c.rfc ?? '', c.country ?? '', c.state ?? '', c.status,
      ].join(',') + '\n';
    }
  } else if (type === 'holders') {
    const holders = await prisma.holder.findMany({
      where: { tenant_id: tenantId },
      orderBy: { name: 'asc' },
    });
    csv = 'id,nombre,tipo,rfc,curp,nacionalidad,estado,notas\n';
    for (const h of holders) {
      csv += [h.id, esc(h.name), h.holder_type, h.rfc ?? '', h.curp ?? '', h.nationality ?? '', h.status, esc(h.notes ?? '')].join(',') + '\n';
    }
  } else if (type === 'contracts') {
    const contracts = await prisma.contract.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      include: { contract_brands: { include: { brand: { select: { name: true } } } } },
      orderBy: { title: 'asc' },
    });
    csv = 'id,titulo,tipo,estado,fecha_inicio,fecha_vencimiento,ley_aplicable,notas\n';
    for (const c of contracts) {
      csv += [c.id, esc(c.title), c.contract_type, c.status, c.effective_date?.toISOString().slice(0, 10) ?? '', c.expiration_date?.toISOString().slice(0, 10) ?? '', esc(c.governing_law ?? ''), esc(c.notes ?? '')].join(',') + '\n';
    }
  } else if (type === 'licenses') {
    const licenses = await prisma.license.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      include: { brand: { select: { name: true } } },
      orderBy: { licensee_name: 'asc' },
    });
    csv = 'id,marca,tipo,licenciatario,rfc_licenciatario,territorio,fecha_inicio,fecha_vencimiento,estado,notas\n';
    for (const l of licenses) {
      csv += [l.id, esc(l.brand.name), l.license_type, esc(l.licensee_name), l.licensee_rfc ?? '', esc(l.territory.join(';')), l.effective_date?.toISOString().slice(0, 10) ?? '', l.expiration_date?.toISOString().slice(0, 10) ?? '', l.status, esc(l.notes ?? '')].join(',') + '\n';
    }
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}_${now}.csv"`,
    },
  });
}

function esc(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ─── POST /api/tenants/[id]/csv?type=brands|holdings|companies ──────────────
// Import CSV: create or update records
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;

  const { id: tenantId } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'brands';

  const permError = await requirePermission({
    userId: getSessionUserId(session),
    userType: getSessionUserType(session),
    role: getSessionRole(session),
    module: type === 'brands' ? 'brands' : 'corporate_structure',
    action: 'CREATE',
  });
  if (permError) return permError;

  const text = await request.text();
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV vacío o sin datos.' }, { status: 400 });
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()));

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  if (type === 'holdings') {
    const nameIdx = headers.indexOf('nombre');
    const legalIdx = headers.indexOf('razon_social');
    const idIdx = headers.indexOf('id');
    if (nameIdx < 0 || legalIdx < 0) {
      return NextResponse.json({ error: 'Columnas requeridas: nombre, razon_social' }, { status: 400 });
    }
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const id = idIdx >= 0 ? row[idIdx]?.trim() : '';
        const data = {
          name: row[nameIdx].trim(),
          legal_name: row[legalIdx].trim(),
          rfc: row[headers.indexOf('rfc')]?.trim() || undefined,
          country: row[headers.indexOf('pais')]?.trim() || undefined,
          notes: row[headers.indexOf('notas')]?.trim() || undefined,
        };
        if (id) {
          await prisma.holding.update({ where: { id }, data });
          updated++;
        } else {
          await prisma.holding.create({ data: { tenant_id: tenantId, ...data } });
          created++;
        }
      } catch (e) {
        errors.push(`Fila ${i + 2}: ${(e as Error).message}`);
      }
    }
  } else if (type === 'companies') {
    const nameIdx = headers.indexOf('nombre');
    const legalIdx = headers.indexOf('razon_social');
    const holdingIdx = headers.indexOf('holding');
    const idIdx = headers.indexOf('id');
    if (nameIdx < 0 || legalIdx < 0) {
      return NextResponse.json({ error: 'Columnas requeridas: nombre, razon_social' }, { status: 400 });
    }
    // Pre-fetch holdings map
    const holdings = await prisma.holding.findMany({ where: { tenant_id: tenantId }, select: { id: true, name: true } });
    const holdingMap = new Map(holdings.map((h) => [h.name.toLowerCase(), h.id]));

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const id = idIdx >= 0 ? row[idIdx]?.trim() : '';
        const holdingName = holdingIdx >= 0 ? row[holdingIdx]?.trim() : '';
        const holdingId = holdingMap.get(holdingName.toLowerCase());
        if (!id && !holdingId) {
          errors.push(`Fila ${i + 2}: Holding "${holdingName}" no encontrado.`);
          continue;
        }
        const name = row[nameIdx].trim();
        const legal_name = row[legalIdx].trim();
        const extra = {
          rfc: row[headers.indexOf('rfc')]?.trim() || undefined,
          company_type: (row[headers.indexOf('tipo')]?.trim() || 'SUBSIDIARY') as import('@prisma/client').CompanyType,
          country: row[headers.indexOf('pais')]?.trim() || undefined,
          state: row[headers.indexOf('estado_entidad')]?.trim() || undefined,
        };
        if (id) {
          await prisma.company.update({ where: { id }, data: { name, legal_name, ...extra } });
          updated++;
        } else {
          await prisma.company.create({ data: { tenant_id: tenantId, holding_id: holdingId!, name, legal_name, ...extra } });
          created++;
        }
      } catch (e) {
        errors.push(`Fila ${i + 2}: ${(e as Error).message}`);
      }
    }
  } else if (type === 'brands') {
    const nameIdx = headers.indexOf('nombre');
    const companyIdx = headers.indexOf('empresa');
    const idIdx = headers.indexOf('id');
    if (nameIdx < 0 || companyIdx < 0) {
      return NextResponse.json({ error: 'Columnas requeridas: nombre, empresa' }, { status: 400 });
    }
    // Pre-fetch companies map
    const companies = await prisma.company.findMany({ where: { tenant_id: tenantId }, select: { id: true, name: true } });
    const companyMap = new Map(companies.map((c) => [c.name.toLowerCase(), c.id]));

    const VALID_LEGAL: Set<string> = new Set(['APPLIED','PUBLISHED','REGISTERED','RENEWED','EXPIRED','CANCELLED','OPPOSED','IN_LITIGATION']);
    const VALID_TYPE: Set<string> = new Set(['WORDMARK','FIGURATIVE','MIXED','THREE_D','SOUND','OLFACTORY','HOLOGRAM','TRADE_DRESS','COMMERCIAL_NOTICE','TRADE_NAME','CERTIFICATION_MARK','COLLECTIVE_MARK','APPELLATION_OF_ORIGIN','GEOGRAPHICAL_INDICATION']);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const id = idIdx >= 0 ? row[idIdx]?.trim() : '';
        const name = row[nameIdx]?.trim();
        const companyName = row[companyIdx]?.trim() ?? '';
        const companyId = companyMap.get(companyName.toLowerCase());

        if (!name) { errors.push(`Fila ${i + 2}: nombre requerido.`); continue; }
        if (!id && !companyId) { errors.push(`Fila ${i + 2}: Empresa "${companyName}" no encontrada.`); continue; }

        const brandTypeRaw = (row[headers.indexOf('tipo')]?.trim() || 'WORDMARK').toUpperCase();
        const legalRaw = (row[headers.indexOf('estado_legal')]?.trim() || 'APPLIED').toUpperCase();
        const brand_type = VALID_TYPE.has(brandTypeRaw) ? brandTypeRaw : 'WORDMARK';
        const legal_status = VALID_LEGAL.has(legalRaw) ? legalRaw : 'APPLIED';
        const regNum = row[headers.indexOf('numero_registro')]?.trim() || undefined;
        const expStr = row[headers.indexOf('fecha_vencimiento')]?.trim();
        const expiration_date = expStr ? new Date(expStr) : undefined;
        const useDeclIdx = headers.indexOf('declaracion_de_uso');
        const useDeclStr = useDeclIdx >= 0 ? row[useDeclIdx]?.trim() : '';
        const use_declaration_date = useDeclStr ? new Date(useDeclStr) : undefined;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        if (id) {
          await prisma.brand.update({
            where: { id },
            data: { name, slug, brand_type: brand_type as import('@prisma/client').BrandType, legal_status: legal_status as import('@prisma/client').LegalStatus, registration_number: regNum, expiration_date, use_declaration_date },
          });
          updated++;
        } else {
          await prisma.brand.create({
            data: { tenant_id: tenantId, company_id: companyId!, name, slug, brand_type: brand_type as import('@prisma/client').BrandType, legal_status: legal_status as import('@prisma/client').LegalStatus, registration_number: regNum, expiration_date, use_declaration_date },
          });
          created++;
        }
      } catch (e) {
        errors.push(`Fila ${i + 2}: ${(e as Error).message}`);
      }
    }
  } else if (type === 'holders') {
    const nameIdx = headers.indexOf('nombre');
    const idIdx = headers.indexOf('id');
    if (nameIdx < 0) {
      return NextResponse.json({ error: 'Columna requerida: nombre' }, { status: 400 });
    }
    const VALID_HTYPE = new Set(['INDIVIDUAL', 'CORPORATION']);
    const VALID_HSTATUS = new Set(['ACTIVE', 'INACTIVE']);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const id = idIdx >= 0 ? row[idIdx]?.trim() : '';
        const name = row[nameIdx]?.trim();
        if (!name) { errors.push(`Fila ${i + 2}: nombre requerido.`); continue; }
        const htRaw = (row[headers.indexOf('tipo')]?.trim() || 'INDIVIDUAL').toUpperCase();
        const holder_type = VALID_HTYPE.has(htRaw) ? htRaw : 'INDIVIDUAL';
        const statusRaw = (row[headers.indexOf('estado')]?.trim() || 'ACTIVE').toUpperCase();
        const status = VALID_HSTATUS.has(statusRaw) ? statusRaw : 'ACTIVE';
        const data = {
          name,
          holder_type: holder_type as import('@prisma/client').HolderType,
          rfc: row[headers.indexOf('rfc')]?.trim() || undefined,
          curp: row[headers.indexOf('curp')]?.trim() || undefined,
          nationality: row[headers.indexOf('nacionalidad')]?.trim() || undefined,
          notes: row[headers.indexOf('notas')]?.trim() || undefined,
          status: status as import('@prisma/client').HolderStatus,
        };
        if (id) { await prisma.holder.update({ where: { id }, data }); updated++; }
        else { await prisma.holder.create({ data: { tenant_id: tenantId, ...data } }); created++; }
      } catch (e) { errors.push(`Fila ${i + 2}: ${(e as Error).message}`); }
    }
  } else if (type === 'contracts') {
    const titleIdx = headers.indexOf('titulo');
    const idIdx = headers.indexOf('id');
    if (titleIdx < 0) {
      return NextResponse.json({ error: 'Columna requerida: titulo' }, { status: 400 });
    }
    const VALID_CTYPE = new Set(['LICENSE_INTERNAL','LICENSE_EXTERNAL','COEXISTENCE','ASSIGNMENT','FRANCHISE','DISTRIBUTION']);
    const VALID_CSTATUS = new Set(['DRAFT','ACTIVE','EXPIRED','TERMINATED','RENEWED','UNDER_REVIEW']);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const id = idIdx >= 0 ? row[idIdx]?.trim() : '';
        const title = row[titleIdx]?.trim();
        if (!title) { errors.push(`Fila ${i + 2}: titulo requerido.`); continue; }
        const ctRaw = (row[headers.indexOf('tipo')]?.trim() || 'LICENSE_INTERNAL').toUpperCase();
        const contract_type = VALID_CTYPE.has(ctRaw) ? ctRaw : 'LICENSE_INTERNAL';
        const csRaw = (row[headers.indexOf('estado')]?.trim() || 'DRAFT').toUpperCase();
        const status = VALID_CSTATUS.has(csRaw) ? csRaw : 'DRAFT';
        const effStr = row[headers.indexOf('fecha_inicio')]?.trim();
        const expStr = row[headers.indexOf('fecha_vencimiento')]?.trim();
        const data = {
          title,
          contract_type: contract_type as import('@prisma/client').ContractType,
          status: status as import('@prisma/client').ContractStatus,
          effective_date: effStr ? new Date(effStr) : undefined,
          expiration_date: expStr ? new Date(expStr) : undefined,
          governing_law: row[headers.indexOf('ley_aplicable')]?.trim() || undefined,
          notes: row[headers.indexOf('notas')]?.trim() || undefined,
        };
        if (id) { await prisma.contract.update({ where: { id }, data }); updated++; }
        else { await prisma.contract.create({ data: { tenant_id: tenantId, ...data } }); created++; }
      } catch (e) { errors.push(`Fila ${i + 2}: ${(e as Error).message}`); }
    }
  } else if (type === 'licenses') {
    const licenseeIdx = headers.indexOf('licenciatario');
    const brandIdx = headers.indexOf('marca');
    const idIdx = headers.indexOf('id');
    if (licenseeIdx < 0 || brandIdx < 0) {
      return NextResponse.json({ error: 'Columnas requeridas: marca, licenciatario' }, { status: 400 });
    }
    const brands = await prisma.brand.findMany({ where: { tenant_id: tenantId }, select: { id: true, name: true } });
    const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
    const VALID_LTYPE = new Set(['EXCLUSIVE', 'NON_EXCLUSIVE', 'SUBLICENSE']);
    const VALID_LSTATUS = new Set(['DRAFT','ACTIVE','EXPIRED','TERMINATED','SUSPENDED']);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const id = idIdx >= 0 ? row[idIdx]?.trim() : '';
        const licensee_name = row[licenseeIdx]?.trim();
        const brandName = row[brandIdx]?.trim() ?? '';
        const brandId = brandMap.get(brandName.toLowerCase());
        if (!licensee_name) { errors.push(`Fila ${i + 2}: licenciatario requerido.`); continue; }
        if (!id && !brandId) { errors.push(`Fila ${i + 2}: Marca "${brandName}" no encontrada.`); continue; }
        const ltRaw = (row[headers.indexOf('tipo')]?.trim() || 'NON_EXCLUSIVE').toUpperCase();
        const license_type = VALID_LTYPE.has(ltRaw) ? ltRaw : 'NON_EXCLUSIVE';
        const lsRaw = (row[headers.indexOf('estado')]?.trim() || 'DRAFT').toUpperCase();
        const status = VALID_LSTATUS.has(lsRaw) ? lsRaw : 'DRAFT';
        const effStr = row[headers.indexOf('fecha_inicio')]?.trim();
        const expStr = row[headers.indexOf('fecha_vencimiento')]?.trim();
        const terrStr = row[headers.indexOf('territorio')]?.trim();
        const territory = terrStr ? terrStr.split(';').map((t) => t.trim()).filter(Boolean) : [];
        const data = {
          licensee_name,
          license_type: license_type as import('@prisma/client').LicenseType,
          status: status as import('@prisma/client').LicenseStatus,
          licensee_rfc: row[headers.indexOf('rfc_licenciatario')]?.trim() || undefined,
          territory,
          effective_date: effStr ? new Date(effStr) : undefined,
          expiration_date: expStr ? new Date(expStr) : undefined,
          notes: row[headers.indexOf('notas')]?.trim() || undefined,
        };
        if (id) { await prisma.license.update({ where: { id }, data }); updated++; }
        else { await prisma.license.create({ data: { tenant_id: tenantId, brand_id: brandId!, ...data } }); created++; }
      } catch (e) { errors.push(`Fila ${i + 2}: ${(e as Error).message}`); }
    }
  } else {
    return NextResponse.json({ error: 'Tipo no soportado.' }, { status: 400 });
  }

  return NextResponse.json({ created, updated, errors });
}

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

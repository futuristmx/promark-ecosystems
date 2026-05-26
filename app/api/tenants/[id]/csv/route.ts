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
    csv = 'id,nombre,empresa,tipo,estado_legal,numero_registro,fecha_vencimiento\n';
    for (const b of brands) {
      csv += [
        b.id, esc(b.name), esc(b.company.name), b.brand_type, b.legal_status,
        b.registration_number ?? '', b.expiration_date?.toISOString().slice(0, 10) ?? '',
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
  } else {
    return NextResponse.json({ error: 'Import de marcas no soportado aún via CSV. Use la interfaz.' }, { status: 400 });
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

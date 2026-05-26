import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requirePromarkApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

function esc(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * GET /api/tenants/csv
 * Export all tenants as CSV. SUPERADMIN only.
 */
export async function GET(request: Request) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      created_at: true,
      _count: { select: { brands: true, contracts: true } },
    },
  });

  let csv = 'nombre,slug,estado,marcas,contratos,creado\n';
  for (const t of tenants) {
    csv +=
      [
        esc(t.name),
        t.slug,
        t.status,
        t._count.brands,
        t._count.contracts,
        t.created_at.toISOString().slice(0, 10),
      ].join(',') + '\n';
  }

  const now = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clientes_${now}.csv"`,
    },
  });
}

/**
 * POST /api/tenants/csv
 * Import tenants from CSV. SUPERADMIN only.
 * Required columns: nombre, slug
 * Optional: estado (defaults to ACTIVE)
 */
export async function POST(request: Request) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const text = await request.text();
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV vacío o sin datos.' }, { status: 400 });
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf('nombre');
  const slugIdx = headers.indexOf('slug');

  if (nameIdx < 0 || slugIdx < 0) {
    return NextResponse.json(
      { error: 'Columnas requeridas: nombre, slug' },
      { status: 400 }
    );
  }

  const statusIdx = headers.indexOf('estado');
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()));

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    try {
      const name = row[nameIdx]?.trim();
      const slug = row[slugIdx]?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      const status = statusIdx >= 0 ? (row[statusIdx]?.trim().toUpperCase() || 'ACTIVE') : 'ACTIVE';

      if (!name || !slug) {
        errors.push(`Fila ${i + 2}: nombre y slug son requeridos.`);
        continue;
      }
      if (slug.length < 3) {
        errors.push(`Fila ${i + 2}: slug "${slug}" muy corto (mín. 3 chars).`);
        continue;
      }

      const existing = await prisma.tenant.findUnique({ where: { slug } });
      if (existing) {
        errors.push(`Fila ${i + 2}: slug "${slug}" ya existe.`);
        continue;
      }

      await prisma.tenant.create({
        data: {
          name,
          slug,
          status: status === 'SUSPENDED' ? 'SUSPENDED' : status === 'ONBOARDING' ? 'ONBOARDING' : 'ACTIVE',
        },
      });
      created++;
    } catch (e) {
      errors.push(`Fila ${i + 2}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ created, errors });
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

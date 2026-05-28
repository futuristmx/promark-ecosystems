import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import { requireClientApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';
import { buildExcelBuffer } from '@/lib/exports/excel';
import { buildPdfBuffer } from '@/lib/exports/pdf';
import { BRAND_STATUS_LABELS, BRAND_TYPE_LABELS } from '@/lib/i18n/status-labels';

/**
 * GET /api/client/[tenant-slug]/brands/export?format=xlsx|pdf
 *
 * Exporta el catálogo de marcas del tenant filtrado por permisos del rol.
 * Replica el filtering del listado /brands.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ 'tenant-slug': string }> }
) {
  try {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.tenant_slug !== tenantSlug) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get('format') || 'xlsx').toLowerCase();
  if (format !== 'xlsx' && format !== 'pdf') {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true },
  });
  if (!tenant) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  // Filtros opcionales (?status=, ?type=, ?class=, ?company=)
  const where: Prisma.BrandWhereInput = { tenant_id: tenant.id };
  const statusFilter = url.searchParams.get('status');
  const typeFilter = url.searchParams.get('type');
  const classFilter = url.searchParams.get('class');
  const companyFilter = url.searchParams.get('company');
  if (statusFilter) (where as Record<string, unknown>).legal_status = statusFilter;
  if (typeFilter) (where as Record<string, unknown>).brand_type = typeFilter;
  if (companyFilter) (where as Record<string, unknown>).company_id = companyFilter;
  if (classFilter) {
    const n = parseInt(classFilter, 10);
    if (!Number.isNaN(n)) {
      (where as Record<string, unknown>).classes = { some: { class_number: n } };
    }
  }

  // LEGAL_REP: solo marcas asignadas por holder
  if (session.role === 'CLIENT_LEGAL_REP') {
    const assignments = await prisma.userClientHolder.findMany({
      where: { user_client_id: session.user_id, tenant_id: tenant.id, removed_at: null },
      select: { holder_id: true },
    });
    const holderIds = assignments.map((a) => a.holder_id);
    if (holderIds.length === 0) {
      return NextResponse.json({ error: 'Sin marcas asignadas' }, { status: 200 });
    }
    const brandHolders = await prisma.brandHolder.findMany({
      where: { holder_id: { in: holderIds } },
      select: { brand_id: true },
    });
    where.id = { in: brandHolders.map((bh) => bh.brand_id) };
  }

  const brands = await prisma.brand.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      name: true,
      legal_status: true,
      brand_type: true,
      registration_number: true,
      application_date: true,
      registration_date: true,
      expiration_date: true,
      company: { select: { name: true } },
      classes: { select: { class_number: true } },
    },
  });

  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  const rows = brands.map((b) => ({
    name: b.name,
    company: b.company.name,
    status: BRAND_STATUS_LABELS[b.legal_status] ?? b.legal_status,
    type: BRAND_TYPE_LABELS[b.brand_type] ?? b.brand_type,
    registration_number: b.registration_number ?? '—',
    classes: b.classes.map((c) => c.class_number).join(', ') || '—',
    application_date: fmtDate(b.application_date),
    registration_date: fmtDate(b.registration_date),
    expiration_date: fmtDate(b.expiration_date),
  }));

  const todayLabel = new Date().toLocaleDateString('es-MX');
  const filenameBase = `catalogo-marcas-${tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}`;

  if (format === 'xlsx') {
    const buffer = await buildExcelBuffer(
      'Catálogo de Marcas',
      [
        { header: 'Marca', key: 'name', width: 24 },
        { header: 'Empresa', key: 'company', width: 28 },
        { header: 'Estado', key: 'status', width: 14 },
        { header: 'Tipo', key: 'type', width: 14 },
        { header: 'No. Registro', key: 'registration_number', width: 14 },
        { header: 'Clases IMPI', key: 'classes', width: 16 },
        { header: 'Solicitud', key: 'application_date', width: 12 },
        { header: 'Registro', key: 'registration_date', width: 12 },
        { header: 'Expiración', key: 'expiration_date', width: 12 },
      ],
      rows,
      { title: `${tenant.name} — Catálogo de Marcas (${todayLabel})` }
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  // PDF
  const buffer = await buildPdfBuffer({
    title: 'Catálogo de Marcas',
    subtitle: `${rows.length} marcas registradas`,
    tenantName: tenant.name,
    columns: [
      { header: 'Marca', key: 'name', width: 100 },
      { header: 'Empresa', key: 'company', width: 130 },
      { header: 'Estado', key: 'status', width: 70 },
      { header: 'Tipo', key: 'type', width: 60 },
      { header: 'No. Registro', key: 'registration_number', width: 80 },
      { header: 'Clases', key: 'classes', width: 60 },
      { header: 'Expiración', key: 'expiration_date', width: 80 },
    ],
    rows,
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
    },
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[brands/export] failed:', err);
    return NextResponse.json({ error: `Error generando descarga: ${message}` }, { status: 500 });
  }
}

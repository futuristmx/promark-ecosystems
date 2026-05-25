import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import { requireClientApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';
import { buildExcelBuffer } from '@/lib/exports/excel';
import { buildPdfBuffer } from '@/lib/exports/pdf';
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS } from '@/lib/i18n/status-labels';

/**
 * GET /api/client/[tenant-slug]/contracts/export?format=xlsx|pdf
 *
 * Exporta los contratos visibles para el cliente autenticado.
 * VIEWER bloqueado. show_contracts feature flag respetada.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ 'tenant-slug': string }> }
) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.tenant_slug !== tenantSlug) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  if (session.role === 'CLIENT_VIEWER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get('format') || 'xlsx').toLowerCase();
  if (format !== 'xlsx' && format !== 'pdf') {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, config: true },
  });
  if (!tenant) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const cfg = tenant.config as { features?: { show_contracts?: boolean } } | null;
  if (!cfg?.features?.show_contracts) {
    return NextResponse.json({ error: 'No habilitado' }, { status: 404 });
  }

  const where: Prisma.ContractWhereInput = {
    tenant_id: tenant.id,
    deleted_at: null,
    status: 'ACTIVE',
  };

  if (session.role === 'CLIENT_LEGAL_REP') {
    const assignments = await prisma.userClientHolder.findMany({
      where: { user_client_id: session.user_id, tenant_id: tenant.id, removed_at: null },
      select: { holder_id: true },
    });
    const holderIds = assignments.map((a) => a.holder_id);
    if (holderIds.length === 0) {
      return NextResponse.json({ error: 'Sin asignación' }, { status: 200 });
    }
    const brandHolders = await prisma.brandHolder.findMany({
      where: { holder_id: { in: holderIds } },
      select: { brand_id: true },
    });
    where.contract_brands = { some: { brand_id: { in: brandHolders.map((b) => b.brand_id) } } };
  }

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { effective_date: 'desc' },
    select: {
      title: true,
      contract_type: true,
      status: true,
      effective_date: true,
      expiration_date: true,
      contract_brands: { select: { brand: { select: { name: true } } } },
    },
  });

  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  const rows = contracts.map((c) => ({
    title: c.title,
    type: CONTRACT_TYPE_LABELS[c.contract_type] ?? c.contract_type,
    status: CONTRACT_STATUS_LABELS[c.status] ?? c.status,
    brands: c.contract_brands.map((cb) => cb.brand.name).join(', ') || '—',
    effective_date: fmtDate(c.effective_date),
    expiration_date: fmtDate(c.expiration_date),
  }));

  const todayLabel = new Date().toLocaleDateString('es-MX');
  const filenameBase = `contratos-${tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}`;

  if (format === 'xlsx') {
    const buffer = await buildExcelBuffer(
      'Contratos',
      [
        { header: 'Título', key: 'title', width: 36 },
        { header: 'Tipo', key: 'type', width: 18 },
        { header: 'Estado', key: 'status', width: 14 },
        { header: 'Marcas vinculadas', key: 'brands', width: 32 },
        { header: 'Vigencia desde', key: 'effective_date', width: 14 },
        { header: 'Vencimiento', key: 'expiration_date', width: 14 },
      ],
      rows,
      { title: `${tenant.name} — Contratos vigentes (${todayLabel})` }
    );
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  const buffer = await buildPdfBuffer({
    title: 'Contratos vigentes',
    subtitle: `${rows.length} contrato${rows.length !== 1 ? 's' : ''}`,
    tenantName: tenant.name,
    columns: [
      { header: 'Título', key: 'title', width: 180 },
      { header: 'Tipo', key: 'type', width: 100 },
      { header: 'Estado', key: 'status', width: 70 },
      { header: 'Marcas vinculadas', key: 'brands', width: 180 },
      { header: 'Vence', key: 'expiration_date', width: 80 },
    ],
    rows,
  });
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
    },
  });
}

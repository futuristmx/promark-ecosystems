import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import { requireClientApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';
import { buildExcelBuffer } from '@/lib/exports/excel';
import { buildPdfBuffer } from '@/lib/exports/pdf';
import { ALERT_ENTITY_TYPE_LABELS } from '@/lib/i18n/status-labels';

/**
 * GET /api/client/[tenant-slug]/alerts/export?format=xlsx|pdf
 *
 * Exporta las alertas PENDING del tenant. VIEWER bloqueado.
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
    select: { id: true, name: true },
  });
  if (!tenant) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const where: Prisma.AlertWhereInput = {
    tenant_id: tenant.id,
    status: 'PENDING',
  };

  // LEGAL_REP: solo alertas de marcas de sus holders
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
    where.OR = [{ entity_type: 'BRAND', entity_id: { in: brandHolders.map((b) => b.brand_id) } }];
  }

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: { expiry_date: 'asc' },
    select: {
      entity_type: true,
      entity_name: true,
      alert_type: true,
      expiry_date: true,
      created_at: true,
    },
  });

  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  const today = new Date();
  const daysFromNow = (d: Date) =>
    Math.ceil((new Date(d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const rows = alerts.map((a) => {
    const days = daysFromNow(a.expiry_date);
    return {
      entity_type: ALERT_ENTITY_TYPE_LABELS[a.entity_type] ?? a.entity_type,
      entity_name: a.entity_name,
      expiry: fmtDate(a.expiry_date),
      countdown: days < 0 ? `Vencido hace ${Math.abs(days)} días` : `En ${days} días`,
      detected_at: fmtDate(a.created_at),
    };
  });

  const todayLabel = today.toLocaleDateString('es-MX');
  const filenameBase = `alertas-${tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${today.toISOString().slice(0, 10)}`;

  if (format === 'xlsx') {
    const buffer = await buildExcelBuffer(
      'Alertas',
      [
        { header: 'Tipo', key: 'entity_type', width: 14 },
        { header: 'Entidad', key: 'entity_name', width: 32 },
        { header: 'Vencimiento', key: 'expiry', width: 14 },
        { header: 'Plazo', key: 'countdown', width: 20 },
        { header: 'Detectada', key: 'detected_at', width: 14 },
      ],
      rows,
      { title: `${tenant.name} — Alertas pendientes (${todayLabel})` }
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
    title: 'Alertas pendientes',
    subtitle: `${rows.length} alerta${rows.length !== 1 ? 's' : ''} sin descartar`,
    tenantName: tenant.name,
    columns: [
      { header: 'Tipo', key: 'entity_type', width: 80 },
      { header: 'Entidad', key: 'entity_name', width: 220 },
      { header: 'Vencimiento', key: 'expiry', width: 100 },
      { header: 'Plazo', key: 'countdown', width: 140 },
      { header: 'Detectada', key: 'detected_at', width: 100 },
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

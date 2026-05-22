import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requireClientApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ 'tenant-slug': string; 'contract-id': string }> }
) {
  const { 'tenant-slug': tenantSlug, 'contract-id': contractId } = await params;
  const session = await requireClientApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.tenant_slug !== tenantSlug || session.role === 'CLIENT_VIEWER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug }, select: { id: true, config: true },
  });
  if (!tenant) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const cfg = tenant.config as { features?: { show_contracts?: boolean } } | null;
  if (!cfg?.features?.show_contracts) {
    return NextResponse.json({ error: 'No habilitado' }, { status: 404 });
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenant.id, deleted_at: null, status: 'ACTIVE' },
    include: {
      contract_brands: { include: { brand: { select: { id: true, name: true } } } },
    },
  });
  if (!contract) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  if (session.role === 'CLIENT_LEGAL_REP') {
    const assignments = await prisma.userClientHolder.findMany({
      where: { user_client_id: session.user_id, tenant_id: tenant.id, removed_at: null },
      select: { holder_id: true },
    });
    const holderIds = assignments.map((a) => a.holder_id);
    const bh = await prisma.brandHolder.findMany({
      where: { holder_id: { in: holderIds } },
      select: { brand_id: true },
    });
    const allowedBrandIds = new Set(bh.map((b) => b.brand_id));
    const hasAccess = contract.contract_brands.some((cb) => allowedBrandIds.has(cb.brand_id));
    if (!hasAccess) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  return NextResponse.json({ contract });
}

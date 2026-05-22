import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import { requireClientApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

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

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug }, select: { id: true, config: true },
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
    if (holderIds.length === 0) return NextResponse.json({ contracts: [] });
    const brandHolders = await prisma.brandHolder.findMany({
      where: { holder_id: { in: holderIds } },
      select: { brand_id: true },
    });
    const brandIds = brandHolders.map((b) => b.brand_id);
    where.contract_brands = { some: { brand_id: { in: brandIds } } };
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      contract_brands: { include: { brand: { select: { id: true, name: true } } } },
    },
    orderBy: { expiration_date: 'asc' },
  });
  return NextResponse.json({ contracts });
}

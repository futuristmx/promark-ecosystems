import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import {
  brandIdsForLegalRep,
  computeTenantAggregates,
} from '@/lib/dashboard/tenant-aggregates';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ 'tenant-slug': string }> }
) {
  try {
    const { 'tenant-slug': tenantSlug } = await params;
    const session = await requireClientSession(tenantSlug);

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const hrefPrefix = `/brand-ecosystem/${tenantSlug}`;

    if (session.role === 'CLIENT_VIEWER') {
      const [brandsCount, alertsCount] = await Promise.all([
        prisma.brand.count({ where: { tenant_id: tenant.id } }),
        prisma.alert.count({
          where: { tenant_id: tenant.id, status: 'PENDING' },
        }),
      ]);
      return NextResponse.json({ role: 'CLIENT_VIEWER', brandsCount, alertsCount });
    }

    if (session.role === 'CLIENT_LEGAL_REP') {
      const brandIds = await brandIdsForLegalRep(session.user_id, tenant.id);
      const data = await computeTenantAggregates({
        tenantId: tenant.id,
        brandIdsFilter: brandIds,
        hrefPrefix,
      });
      return NextResponse.json({ role: 'CLIENT_LEGAL_REP', ...data });
    }

    // CLIENT_ADMIN
    const data = await computeTenantAggregates({
      tenantId: tenant.id,
      hrefPrefix,
    });
    return NextResponse.json({ role: 'CLIENT_ADMIN', ...data });
  } catch (err) {
    console.error('[GET /api/client/[tenant-slug]/dashboard]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

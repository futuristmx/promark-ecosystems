import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { getPromarkSession } from '@/lib/auth/promark';

// GET /api/dashboard — Promark cross-tenant overview (SUPERADMIN/LAWYER only)
export async function GET() {
  try {
    const session = await getPromarkSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (session.role !== 'SUPERADMIN' && session.role !== 'LAWYER') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    const [
      totalTenants,
      totalBrands,
      totalActiveContracts,
      pendingAlerts,
      topTenantsRaw,
      recentBrandHistory,
      recentContractHistory,
    ] = await Promise.all([
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.brand.count(),
      prisma.contract.count({ where: { status: 'ACTIVE', deleted_at: null } }),
      prisma.alert.count({
        where: { status: 'PENDING', expiry_date: { lte: in30Days } },
      }),
      prisma.brand.groupBy({
        by: ['tenant_id'],
        _count: { _all: true },
        orderBy: { _count: { tenant_id: 'desc' } },
        take: 5,
      }),
      prisma.brandHistory.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          brand: { select: { id: true, name: true, tenant_id: true } },
          performed_by: { select: { full_name: true } },
        },
      }),
      prisma.contractHistory.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          contract: { select: { id: true, title: true, tenant_id: true } },
        },
      }),
    ]);

    const topTenantIds = topTenantsRaw.map((t) => t.tenant_id);
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: topTenantIds } },
      select: { id: true, name: true, slug: true },
    });
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));

    const topTenants = topTenantsRaw
      .map((t) => ({
        tenant_id: t.tenant_id,
        name: tenantMap.get(t.tenant_id)?.name ?? 'Sin nombre',
        slug: tenantMap.get(t.tenant_id)?.slug ?? '',
        count: t._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    type Activity = {
      id: string;
      actorName: string;
      actionLabel: string;
      entityType: string;
      entityId: string;
      entityLabel: string;
      href: string;
      createdAt: string;
    };

    const activity: Activity[] = [
      ...recentBrandHistory.map((h) => ({
        id: `bh-${h.id}`,
        actorName: h.performed_by?.full_name ?? 'Sistema',
        actionLabel: h.event_type,
        entityType: 'BRAND',
        entityId: h.brand_id,
        entityLabel: h.brand.name,
        href: `/tenants/${h.brand.tenant_id}/brands/${h.brand_id}`,
        createdAt: h.created_at.toISOString(),
      })),
      ...recentContractHistory.map((h) => ({
        id: `ch-${h.id}`,
        actorName: 'Sistema',
        actionLabel: h.change_type,
        entityType: 'CONTRACT',
        entityId: h.contract_id,
        entityLabel: h.contract.title,
        href: `/tenants/${h.contract.tenant_id}/contratos/${h.contract_id}`,
        createdAt: h.created_at.toISOString(),
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);

    return NextResponse.json({
      totals: {
        tenants: totalTenants,
        brands: totalBrands,
        activeContracts: totalActiveContracts,
        pendingAlerts: pendingAlerts,
      },
      topTenants,
      recentActivity: activity,
    });
  } catch (err) {
    console.error('[GET /api/dashboard]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

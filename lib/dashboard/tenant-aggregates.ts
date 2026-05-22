import prisma from '@/lib/prisma/client';

export interface TenantAggregates {
  totals: {
    brands: number;
    expiringSoon: number;
    expired: number;
    activeContracts: number;
    criticalAlerts: number;
  };
  statusDistribution: Array<{ label: string; value: number; status: string }>;
  impiClasses: Array<{ class_number: number; count: number }>;
  expirationsByMonth: Array<{ month: string; count: number }>;
  recentActivity: Array<{
    id: string;
    actorName: string;
    actionLabel: string;
    entityType: string;
    entityId: string;
    entityLabel: string;
    href: string;
    createdAt: string;
  }>;
}

export interface AggregateOptions {
  tenantId: string;
  brandIdsFilter?: string[]; // for CLIENT_LEGAL_REP scoping
  hrefPrefix?: string; // e.g. /tenants/[id] or /brand-ecosystem/[slug]
}

const LEGAL_STATUS_LABELS_ES: Record<string, string> = {
  APPLIED: 'Solicitada',
  PUBLISHED: 'Publicada',
  REGISTERED: 'Registrada',
  RENEWED: 'Renovada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  OPPOSED: 'Opuesta',
  IN_LITIGATION: 'En litigio',
};

export async function computeTenantAggregates(
  opts: AggregateOptions
): Promise<TenantAggregates> {
  const { tenantId, brandIdsFilter, hrefPrefix = `/tenants/${opts.tenantId}` } = opts;

  const now = new Date();
  const in90Days = new Date(now);
  in90Days.setDate(in90Days.getDate() + 90);
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const in24Months = new Date(now);
  in24Months.setMonth(in24Months.getMonth() + 24);

  const brandWhere: { tenant_id: string; id?: { in: string[] } } = {
    tenant_id: tenantId,
  };
  if (brandIdsFilter) {
    brandWhere.id = { in: brandIdsFilter };
  }

  const [
    totalBrands,
    expiringSoon,
    expired,
    activeContracts,
    criticalAlerts,
    statusGroups,
    classRows,
    expirationRows,
    recentBrandHistory,
    recentContractHistory,
  ] = await Promise.all([
    prisma.brand.count({ where: brandWhere }),
    prisma.brand.count({
      where: {
        ...brandWhere,
        expiration_date: { gte: now, lte: in90Days },
      },
    }),
    prisma.brand.count({
      where: {
        ...brandWhere,
        OR: [
          { expiration_date: { lt: now } },
          { legal_status: 'EXPIRED' },
        ],
      },
    }),
    prisma.contract.count({
      where: { tenant_id: tenantId, status: 'ACTIVE', deleted_at: null },
    }),
    prisma.alert.count({
      where: {
        tenant_id: tenantId,
        status: 'PENDING',
        expiry_date: { lte: in30Days },
      },
    }),
    prisma.brand.groupBy({
      by: ['legal_status'],
      where: brandWhere,
      _count: { _all: true },
    }),
    prisma.brandClass.groupBy({
      by: ['class_number'],
      where: {
        brand: brandWhere,
      },
      _count: { _all: true },
      orderBy: { _count: { class_number: 'desc' } },
      take: 10,
    }),
    prisma.brand.findMany({
      where: {
        ...brandWhere,
        expiration_date: { gte: now, lte: in24Months },
      },
      select: { expiration_date: true },
    }),
    prisma.brandHistory.findMany({
      where: brandIdsFilter
        ? { brand_id: { in: brandIdsFilter }, brand: { tenant_id: tenantId } }
        : { brand: { tenant_id: tenantId } },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        brand: { select: { id: true, name: true } },
        performed_by: { select: { full_name: true } },
      },
    }),
    prisma.contractHistory.findMany({
      where: { contract: { tenant_id: tenantId, deleted_at: null } },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        contract: { select: { id: true, title: true } },
      },
    }),
  ]);

  const statusDistribution = statusGroups.map((g) => ({
    status: g.legal_status,
    label: LEGAL_STATUS_LABELS_ES[g.legal_status] ?? g.legal_status,
    value: g._count._all,
  }));

  const impiClasses = classRows.map((r) => ({
    class_number: r.class_number,
    count: r._count._all,
  }));

  // Group expirations by YYYY-MM
  const monthMap = new Map<string, number>();
  for (const row of expirationRows) {
    if (!row.expiration_date) continue;
    const d = row.expiration_date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }
  // Fill all 24 months for chart continuity
  const expirationsByMonth: Array<{ month: string; count: number }> = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    expirationsByMonth.push({ month: key, count: monthMap.get(key) ?? 0 });
  }

  const activity = [
    ...recentBrandHistory.map((h) => ({
      id: `bh-${h.id}`,
      actorName: h.performed_by?.full_name ?? 'Sistema',
      actionLabel: h.event_type,
      entityType: 'BRAND',
      entityId: h.brand_id,
      entityLabel: h.brand.name,
      href: `${hrefPrefix}/brands/${h.brand_id}`,
      createdAt: h.created_at.toISOString(),
    })),
    ...recentContractHistory.map((h) => ({
      id: `ch-${h.id}`,
      actorName: 'Sistema',
      actionLabel: h.change_type,
      entityType: 'CONTRACT',
      entityId: h.contract_id,
      entityLabel: h.contract.title,
      href: `${hrefPrefix}/contratos/${h.contract_id}`,
      createdAt: h.created_at.toISOString(),
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  return {
    totals: {
      brands: totalBrands,
      expiringSoon,
      expired,
      activeContracts,
      criticalAlerts,
    },
    statusDistribution,
    impiClasses,
    expirationsByMonth,
    recentActivity: activity,
  };
}

export async function brandIdsForLegalRep(
  userClientId: string,
  tenantId: string
): Promise<string[]> {
  // UserClientHolder → Holder → BrandHolder → Brand
  const assignments = await prisma.userClientHolder.findMany({
    where: { user_client_id: userClientId, tenant_id: tenantId, removed_at: null },
    select: { holder_id: true },
  });
  const holderIds = assignments.map((a) => a.holder_id);
  if (holderIds.length === 0) return [];
  const brandHolders = await prisma.brandHolder.findMany({
    where: { holder_id: { in: holderIds } },
    select: { brand_id: true },
    distinct: ['brand_id'],
  });
  return brandHolders.map((b) => b.brand_id);
}

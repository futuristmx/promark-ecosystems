import Link from 'next/link';
import { Users, Tag, Scroll, Bell } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { PageTitle, KpiCard, KpiGrid, DsCard, EmptyState } from '@/components/ds';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StatusDonut } from '@/components/dashboard/charts/status-donut';
import { TopTenantsBar } from '@/components/dashboard/charts/top-tenants-bar';

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

const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#3b82f6',
  PUBLISHED: '#0ea5e9',
  REGISTERED: '#22c55e',
  RENEWED: '#10b981',
  EXPIRED: '#ef4444',
  CANCELLED: '#94a3b8',
  OPPOSED: '#f59e0b',
  IN_LITIGATION: '#a855f7',
};

export default async function DashboardPage() {
  const session = await requirePromarkAuth();

  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const [
    totalTenants,
    totalBrands,
    activeContracts,
    pendingAlerts,
    topTenantsRaw,
    statusGroups,
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
    prisma.brand.groupBy({
      by: ['legal_status'],
      _count: { _all: true },
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
      where: { contract: { deleted_at: null } },
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
    select: { id: true, name: true },
  });
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));
  const topTenants = topTenantsRaw
    .map((t) => ({
      tenant_id: t.tenant_id,
      name: tenantMap.get(t.tenant_id) ?? 'Sin nombre',
      count: t._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const statusDistribution = statusGroups.map((g) => ({
    label: LEGAL_STATUS_LABELS_ES[g.legal_status] ?? g.legal_status,
    value: g._count._all,
    color: STATUS_COLORS[g.legal_status] ?? '#64748b',
  }));

  const activity = [
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

  const allEmpty =
    totalTenants === 0 &&
    totalBrands === 0 &&
    activeContracts === 0 &&
    pendingAlerts === 0;

  if (allEmpty) {
    return (
      <div>
        <PageTitle
          eyebrow="Panel ejecutivo"
          title={`Bienvenido, ${session.full_name}`}
          subtitle="Vista general de todos los clientes"
        />
        <EmptyState
          icon={<Users className="size-6" />}
          title="Sin datos disponibles aún"
          description="Comienza creando tu primer cliente para registrar marcas, contratos y alertas."
          action={
            <Link
              href="/tenants/new"
              className="ds-btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium"
            >
              + Crear primer cliente
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        eyebrow="Panel ejecutivo"
        title={`Bienvenido, ${session.full_name}`}
        subtitle="Vista general de todos los clientes"
      />

      <KpiGrid>
        <KpiCard
          label="Clientes activos"
          value={totalTenants}
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="Total de marcas"
          value={totalBrands}
          icon={<Tag className="size-4" />}
        />
        <KpiCard
          label="Contratos vigentes"
          value={activeContracts}
          icon={<Scroll className="size-4" />}
        />
        <KpiCard
          label="Alertas críticas"
          value={pendingAlerts}
          icon={<Bell className="size-4" />}
          tone={pendingAlerts > 0 ? 'danger' : 'default'}
        />
      </KpiGrid>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DsCard variant="standard">
          <StatusDonut
            data={statusDistribution}
            title="Distribución por estado legal"
          />
        </DsCard>
        <DsCard variant="standard">
          <TopTenantsBar data={topTenants} />
        </DsCard>
      </div>

      <RecentActivity
        items={activity}
        hint={`Últimos ${activity.length} eventos`}
      />
    </div>
  );
}

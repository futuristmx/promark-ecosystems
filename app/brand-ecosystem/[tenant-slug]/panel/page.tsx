import { notFound } from 'next/navigation';
import { Tag, Bell, Clock, AlertTriangle, Scroll } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import {
  brandIdsForLegalRep,
  computeTenantAggregates,
} from '@/lib/dashboard/tenant-aggregates';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { StatusDonut } from '@/components/dashboard/charts/status-donut';
import { VigencyTimeline } from '@/components/dashboard/charts/vigency-timeline';
import { RecentActivity } from '@/components/dashboard/recent-activity';

const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#8FB6C7',
  PUBLISHED: '#355B6F',
  REGISTERED: '#0F2E3D',
  RENEWED: '#1C3F55',
  EXPIRED: '#B42318',
  CANCELLED: '#C8C4B9',
  OPPOSED: '#D39A2B',
  IN_LITIGATION: '#0B1F2A',
};

interface ClientPanelPageProps {
  params: Promise<{ 'tenant-slug': string }>;
}

export default async function ClientPanelPage({ params }: ClientPanelPageProps) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientSession(tenantSlug);

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true },
  });
  if (!tenant) notFound();

  const hrefPrefix = `/brand-ecosystem/${tenantSlug}`;

  if (session.role === 'CLIENT_VIEWER') {
    const brandIds = await brandIdsForLegalRep(session.user_id, tenant.id);
    const [brandsCount, alertsCount] = brandIds.length
      ? await Promise.all([
          prisma.brand.count({
            where: { tenant_id: tenant.id, id: { in: brandIds } },
          }),
          prisma.alert.count({
            where: {
              tenant_id: tenant.id,
              status: 'PENDING',
              entity_type: 'BRAND',
              entity_id: { in: brandIds },
            },
          }),
        ])
      : [0, 0];

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Panel — {tenant.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Resumen de tus marcas asignadas
        </p>
        <div className="mt-6">
          <KpiGrid className="md:grid-cols-2 lg:grid-cols-2">
            <KpiCard
              label="Mis marcas"
              value={brandsCount}
              icon={<Tag className="h-4 w-4" />}
            />
            <KpiCard
              label="Mis alertas"
              value={alertsCount}
              icon={<Bell className="h-4 w-4" />}
              tone={alertsCount > 0 ? 'danger' : 'default'}
            />
          </KpiGrid>
        </div>
      </div>
    );
  }

  const brandIdsFilter =
    session.role === 'CLIENT_LEGAL_REP'
      ? await brandIdsForLegalRep(session.user_id, tenant.id)
      : undefined;

  const aggregates = await computeTenantAggregates({
    tenantId: tenant.id,
    brandIdsFilter,
    hrefPrefix,
  });

  const donutData = aggregates.statusDistribution.map((s) => ({
    label: s.label,
    value: s.value,
    color: STATUS_COLORS[s.status] ?? '#64748b',
  }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Panel — {tenant.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {session.role === 'CLIENT_LEGAL_REP'
            ? 'Indicadores de las marcas a tu cargo'
            : 'Indicadores del ecosistema de marcas'}
        </p>
      </div>

      <KpiGrid>
        <KpiCard
          label="Total marcas"
          value={aggregates.totals.brands}
          icon={<Tag className="h-4 w-4" />}
        />
        <KpiCard
          label="Marcas por vencer"
          value={aggregates.totals.expiringSoon}
          icon={<Clock className="h-4 w-4" />}
          tone="warning"
        />
        <KpiCard
          label="Marcas vencidas"
          value={aggregates.totals.expired}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="danger"
        />
        <KpiCard
          label="Contratos vigentes"
          value={aggregates.totals.activeContracts}
          icon={<Scroll className="h-4 w-4" />}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusDonut data={donutData} title="Distribución por estado legal" />
        <VigencyTimeline
          data={aggregates.expirationsByMonth}
          title="Vencimientos próximos (24 meses)"
        />
      </div>

      <RecentActivity items={aggregates.recentActivity} />
    </div>
  );
}

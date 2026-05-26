import { notFound } from 'next/navigation';
import { Tag, Bell, Scroll } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import {
  brandIdsForLegalRep,
  computeTenantAggregates,
} from '@/lib/dashboard/tenant-aggregates';
import { KpiCard, KpiGrid, DsCard } from '@/components/ds';
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
      <div className="space-y-10 p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--tenant-primary, #D39A2B)' }}>
              Panel de consulta
            </p>
            <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>
              {tenant.name}
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
              Resumen de tus marcas asignadas
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ background: '#2F6B4F' }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: '#2F6B4F' }} />
            </span>
            <span className="text-[11px] font-semibold" style={{ color: '#2F6B4F' }}>Portafolio sincronizado</span>
          </div>
        </div>
        <KpiGrid className="md:grid-cols-2 lg:grid-cols-2">
          <KpiCard
            label="Mis marcas"
            value={brandsCount}
            icon={<Tag className="size-4" />}
          />
          <KpiCard
            label="Mis alertas"
            value={alertsCount}
            icon={<Bell className="size-4" />}
            tone={alertsCount > 0 ? 'danger' : 'default'}
          />
        </KpiGrid>
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
    <div className="space-y-10 p-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--tenant-primary, #D39A2B)' }}>
            Panel ejecutivo
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>
            {tenant.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
            {session.role === 'CLIENT_LEGAL_REP'
              ? 'Indicadores de las marcas a tu cargo'
              : 'Indicadores del ecosistema de marcas'}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ background: '#2F6B4F' }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: '#2F6B4F' }} />
          </span>
          <span className="text-[11px] font-semibold" style={{ color: '#2F6B4F' }}>Portafolio sincronizado</span>
        </div>
      </div>

      <KpiGrid className="md:grid-cols-2 lg:grid-cols-2">
        <KpiCard
          label="Total marcas"
          value={aggregates.totals.brands}
          icon={<Tag className="size-4" />}
          href={`${hrefPrefix}/brands`}
        />
        <KpiCard
          label="Contratos vigentes"
          value={aggregates.totals.activeContracts}
          icon={<Scroll className="size-4" />}
          href={`${hrefPrefix}/contratos`}
        />
      </KpiGrid>

      <DsCard variant="standard">
        <StatusDonut data={donutData} title="Distribución por estado legal" />
      </DsCard>

      <DsCard variant="standard">
        <VigencyTimeline
          data={aggregates.expirationsByMonth}
          title="Vencimientos próximos (24 meses)"
        />
      </DsCard>

      <RecentActivity items={aggregates.recentActivity} />
    </div>
  );
}

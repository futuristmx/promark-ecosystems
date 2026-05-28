'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tag, Clock, AlertTriangle, Scroll, Bell, Network, Building2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KpiCard, KpiGrid, DsCard } from '@/components/ds';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StatusDonut } from '@/components/dashboard/charts/status-donut';
import { VigencyTimeline } from '@/components/dashboard/charts/vigency-timeline';
import { ImpiClassBar } from '@/components/dashboard/charts/impi-class-bar';
import { TenantGraph } from '@/components/dashboard/graph/tenant-graph';
import type { TenantAggregates } from '@/lib/dashboard/tenant-aggregates';
import type { GraphPayload } from '@/lib/dashboard/tenant-graph';

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

interface BrandNode {
  id: string;
  name: string;
  legal_status: string;
}
interface CompanyNode {
  id: string;
  name: string;
  brands: BrandNode[];
}
interface HoldingNode {
  id: string;
  name: string;
  companies: CompanyNode[];
}

interface TenantPanelViewProps {
  tenantId: string;
  aggregates: TenantAggregates;
  graph: GraphPayload;
  tree: HoldingNode[];
}

export function TenantPanelView({
  tenantId,
  aggregates,
  graph,
  tree,
}: TenantPanelViewProps) {
  const donutData = aggregates.statusDistribution.map((s) => ({
    label: s.label,
    value: s.value,
    color: STATUS_COLORS[s.status] ?? '#64748b',
  }));

  const [impiFilter, setImpiFilter] = useState<'top10' | 'all'>('top10');

  const filteredImpiData =
    impiFilter === 'top10'
      ? aggregates.impiClasses.slice(0, 10)
      : aggregates.impiClasses;

  return (
    <div className="space-y-12">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Vista general</TabsTrigger>
          <TabsTrigger value="graph">Vista de grafo</TabsTrigger>
          <TabsTrigger value="tree">Vista de árbol</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-12 pt-6">
          {/* Hero KPI — protagonista: total marcas */}
          <Link
            href={`/tenants/${tenantId}/portfolio`}
            className="group block overflow-hidden rounded-2xl border transition-all"
            style={{
              borderColor: '#C9A14A',
              background:
                'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 55%, #355B6F 100%)',
              boxShadow:
                '0 12px 32px rgba(15,46,61,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between gap-6 p-6 md:p-7">
              <div className="flex items-center gap-5">
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(211,154,43,0.25), rgba(211,154,43,0.08))',
                    border: '1px solid rgba(211,154,43,0.35)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  <Tag className="size-7" style={{ color: '#F5C97A' }} />
                </div>
                <div>
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: 'rgba(245,201,122,0.85)' }}
                  >
                    Total de marcas
                  </p>
                  <p
                    className="mt-1 text-5xl font-bold tabular-nums leading-none md:text-6xl"
                    style={{ color: '#FBF6EC', letterSpacing: '-0.02em' }}
                  >
                    {aggregates.totals.brands}
                  </p>
                  <p
                    className="mt-2 text-xs"
                    style={{ color: 'rgba(251,246,236,0.7)' }}
                  >
                    Portafolio activo bajo gestión
                  </p>
                </div>
              </div>
              <div
                className="hidden items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all group-hover:translate-x-0.5 md:inline-flex"
                style={{
                  background: 'rgba(245,201,122,0.14)',
                  color: '#F5C97A',
                  border: '1px solid rgba(245,201,122,0.25)',
                }}
              >
                Ver portafolio →
              </div>
            </div>
          </Link>

          <KpiGrid>
            <KpiCard
              label="Por vencer (90d)"
              value={aggregates.totals.expiringSoon}
              icon={<Clock className="size-4" />}
              tone="warning"
              href={`/tenants/${tenantId}/portfolio`}
            />
            <KpiCard
              label="Vencidas"
              value={aggregates.totals.expired}
              icon={<AlertTriangle className="size-4" />}
              tone="danger"
              href={`/tenants/${tenantId}/portfolio`}
            />
            <KpiCard
              label="Contratos vigentes"
              value={aggregates.totals.activeContracts}
              icon={<Scroll className="size-4" />}
              href={`/tenants/${tenantId}/portfolio`}
            />
            <KpiCard
              label="Alertas próximas (30d)"
              value={aggregates.totals.criticalAlerts}
              icon={<Bell className="size-4" />}
              tone={aggregates.totals.criticalAlerts > 0 ? 'danger' : 'default'}
              href={`/tenants/${tenantId}/alertas`}
            />
            <KpiCard
              label="Holdings"
              value={aggregates.totals.holdings}
              icon={<Network className="size-4" />}
              href={`/tenants/${tenantId}/structure`}
            />
            <KpiCard
              label="Empresas"
              value={aggregates.totals.companies}
              icon={<Building2 className="size-4" />}
              href={`/tenants/${tenantId}/structure`}
            />
          </KpiGrid>

          <DsCard variant="standard">
            <StatusDonut data={donutData} title="Distribución por estado legal" />
          </DsCard>
        </TabsContent>

        <TabsContent value="graph" className="pt-4">
          <TenantGraph nodes={graph.nodes} edges={graph.edges} />
        </TabsContent>

        <TabsContent value="tree" className="pt-4">
          <div className="rounded-xl border p-6" style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}>
            {tree.length === 0 ? (
              <p className="text-sm" style={{ color: '#C8C4B9' }}>
                Sin estructura corporativa registrada.
              </p>
            ) : (
              <ul className="space-y-2">
                {tree.map((h) => (
                  <li key={h.id}>
                    <details open className="group">
                      <summary className="cursor-pointer rounded px-2 py-1 text-sm font-semibold transition-colors" style={{ color: '#0F2E3D' }}>
                        Holding: {h.name}{' '}
                        <span className="text-xs font-normal" style={{ color: '#355B6F' }}>
                          ({h.companies.length} empresa
                          {h.companies.length === 1 ? '' : 's'})
                        </span>
                      </summary>
                      <ul className="ml-5 mt-1 space-y-1 border-l pl-4" style={{ borderColor: '#E2DED6' }}>
                        {h.companies.map((c) => (
                          <li key={c.id}>
                            <details className="group">
                              <summary className="cursor-pointer rounded px-2 py-1 text-sm font-medium transition-colors" style={{ color: '#1C3F55' }}>
                                Empresa: {c.name}{' '}
                                <span className="text-xs font-normal" style={{ color: '#355B6F' }}>
                                  ({c.brands.length} marca
                                  {c.brands.length === 1 ? '' : 's'})
                                </span>
                              </summary>
                              <ul className="ml-5 mt-1 space-y-0.5 border-l pl-4" style={{ borderColor: '#E2DED6' }}>
                                {c.brands.map((b) => (
                                  <li
                                    key={b.id}
                                    className="px-2 py-0.5 text-sm"
                                    style={{ color: '#355B6F' }}
                                  >
                                    <span className="font-medium">{b.name}</span>{' '}
                                    <span className="text-xs" style={{ color: '#C8C4B9' }}>
                                      —{' '}
                                      {LEGAL_STATUS_LABELS_ES[b.legal_status] ??
                                        b.legal_status}
                                    </span>
                                  </li>
                                ))}
                                {c.brands.length === 0 && (
                                  <li className="px-2 py-0.5 text-xs" style={{ color: '#C8C4B9' }}>
                                    Sin marcas
                                  </li>
                                )}
                              </ul>
                            </details>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Always-visible sections — persist across tab changes */}
      <DsCard variant="standard">
        <VigencyTimeline
          data={aggregates.expirationsByMonth}
          title="Vencimientos próximos (24 meses)"
        />
      </DsCard>

      <DsCard variant="standard">
        {/* IMPI filter bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
            Marcas por clase IMPI
          </h3>
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: '#F1EDE3' }}>
            {([['top10', 'Top 10'], ['all', 'Todas']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setImpiFilter(key)}
                className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
                style={
                  impiFilter === key
                    ? { background: '#0F2E3D', color: '#ffffff' }
                    : { color: '#355B6F' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ImpiClassBar data={filteredImpiData} title="" />
      </DsCard>

      <RecentActivity items={aggregates.recentActivity} />
    </div>
  );
}

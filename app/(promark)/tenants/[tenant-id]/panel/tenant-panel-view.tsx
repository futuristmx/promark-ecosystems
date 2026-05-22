'use client';

import { Tag, Clock, AlertTriangle, Scroll, Bell } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StatusDonut } from '@/components/dashboard/charts/status-donut';
import { VigencyTimeline } from '@/components/dashboard/charts/vigency-timeline';
import { ImpiClassBar } from '@/components/dashboard/charts/impi-class-bar';
import { TenantGraph } from '@/components/dashboard/graph/tenant-graph';
import type { TenantAggregates } from '@/lib/dashboard/tenant-aggregates';
import type { GraphPayload } from '@/lib/dashboard/tenant-graph';

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
  void tenantId;
  const donutData = aggregates.statusDistribution.map((s) => ({
    label: s.label,
    value: s.value,
    color: STATUS_COLORS[s.status] ?? '#64748b',
  }));

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Vista general</TabsTrigger>
        <TabsTrigger value="graph">Vista de grafo</TabsTrigger>
        <TabsTrigger value="tree">Vista de árbol</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 pt-4">
        <KpiGrid className="lg:grid-cols-5">
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
          <KpiCard
            label="Alertas críticas"
            value={aggregates.totals.criticalAlerts}
            icon={<Bell className="h-4 w-4" />}
            tone={aggregates.totals.criticalAlerts > 0 ? 'danger' : 'default'}
          />
        </KpiGrid>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <StatusDonut data={donutData} title="Distribución por estado legal" />
          <VigencyTimeline
            data={aggregates.expirationsByMonth}
            title="Vencimientos próximos (24 meses)"
          />
        </div>

        <ImpiClassBar data={aggregates.impiClasses} />

        <RecentActivity items={aggregates.recentActivity} />
      </TabsContent>

      <TabsContent value="graph" className="pt-4">
        <TenantGraph nodes={graph.nodes} edges={graph.edges} />
      </TabsContent>

      <TabsContent value="tree" className="pt-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          {tree.length === 0 ? (
            <p className="text-sm text-slate-400">
              Sin estructura corporativa registrada.
            </p>
          ) : (
            <ul className="space-y-2">
              {tree.map((h) => (
                <li key={h.id}>
                  <details open className="group">
                    <summary className="cursor-pointer rounded px-2 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                      Holding: {h.name}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        ({h.companies.length} empresa
                        {h.companies.length === 1 ? '' : 's'})
                      </span>
                    </summary>
                    <ul className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-4">
                      {h.companies.map((c) => (
                        <li key={c.id}>
                          <details className="group">
                            <summary className="cursor-pointer rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50">
                              Empresa: {c.name}{' '}
                              <span className="text-xs font-normal text-slate-400">
                                ({c.brands.length} marca
                                {c.brands.length === 1 ? '' : 's'})
                              </span>
                            </summary>
                            <ul className="ml-5 mt-1 space-y-0.5 border-l border-slate-200 pl-4">
                              {c.brands.map((b) => (
                                <li
                                  key={b.id}
                                  className="px-2 py-0.5 text-sm text-slate-600"
                                >
                                  <span className="font-medium">{b.name}</span>{' '}
                                  <span className="text-xs text-slate-400">
                                    —{' '}
                                    {LEGAL_STATUS_LABELS_ES[b.legal_status] ??
                                      b.legal_status}
                                  </span>
                                </li>
                              ))}
                              {c.brands.length === 0 && (
                                <li className="px-2 py-0.5 text-xs text-slate-400">
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
  );
}

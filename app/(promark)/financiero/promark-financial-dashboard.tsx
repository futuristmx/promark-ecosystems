'use client';

import { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  Users,
  Briefcase,
  Loader2,
  Save,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KpiCard, KpiGrid } from '@/components/ds';
import type { BillingConcept, ProjectionBucket } from './page';

interface Props {
  activeTenants: number;
  totalBrands: number;
  inProgressBrands: number;
  totalContracts: number;
  totalLicenses: number;
  projection: ProjectionBucket[];
  billingConcepts: BillingConcept[];
}

// Mapeo concepto → cómo se calcula el ingreso proyectado por bucket
function revenueForBucket(b: ProjectionBucket, byKey: Map<string, number>): number {
  const rate = (k: string) => byKey.get(k) ?? 0;
  return (
    b.brands * rate('brand_renewal') +
    b.useDeclarations * rate('use_declaration') +
    b.contracts * rate('contract_renewal') +
    b.licenses * rate('license_renewal')
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  OPERATIVO: 'Operativo (por evento)',
  RECURRENTE: 'Recurrente (por cliente)',
  EVENTUAL: 'Eventual',
};

const CATEGORY_TONE: Record<string, { bg: string; color: string }> = {
  OPERATIVO: { bg: 'rgba(53,91,111,0.10)', color: '#355B6F' },
  RECURRENTE: { bg: 'rgba(47,107,79,0.10)', color: '#2F6B4F' },
  EVENTUAL: { bg: 'rgba(211,154,43,0.12)', color: '#7A5A14' },
};

export function PromarkFinancialDashboard({
  activeTenants,
  totalBrands,
  inProgressBrands,
  totalContracts,
  totalLicenses,
  projection,
  billingConcepts,
}: Props) {
  const [concepts, setConcepts] = useState<BillingConcept[]>(billingConcepts);
  const [chartMetric, setChartMetric] = useState<'eventos' | 'ingresos'>('ingresos');
  const [chartWindow, setChartWindow] = useState<'90d' | '180d' | '365d'>('90d');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const ratesByKey = useMemo(
    () => new Map(concepts.map((c) => [c.key, c.amount])),
    [concepts],
  );

  // Filtrar proyección por ventana
  const visibleProjection = useMemo(() => {
    const maxDays = parseInt(chartWindow.replace('d', ''), 10);
    return projection.filter((p) => p.days <= maxDays);
  }, [projection, chartWindow]);

  const chartData = visibleProjection.map((b) => ({
    period: `${b.days} días`,
    eventos: b.brands + b.useDeclarations + b.contracts + b.licenses,
    ingresos: revenueForBucket(b, ratesByKey),
  }));

  // Totales en ventana 90d (KPI principal)
  const bucket90 = projection.find((p) => p.days === 90) ?? projection[0];
  const totalEvents90 =
    (bucket90?.brands ?? 0) +
    (bucket90?.useDeclarations ?? 0) +
    (bucket90?.contracts ?? 0) +
    (bucket90?.licenses ?? 0);
  const revenue90 = bucket90 ? revenueForBucket(bucket90, ratesByKey) : 0;

  // Ingresos recurrentes mensuales = activeTenants * servicio_mensual + (anual / 12)
  const monthlyRecurring = useMemo(() => {
    const monthly = ratesByKey.get('monthly_service') ?? 0;
    const annual = ratesByKey.get('annual_audit') ?? 0;
    return activeTenants * (monthly + annual / 12);
  }, [activeTenants, ratesByKey]);

  const formatCurrency = (val: number) =>
    `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val)} MXN`;

  async function saveAmount(key: string, amount: number) {
    setSavingKey(key);
    setMessage(null);
    try {
      const res = await fetch('/api/promark/billing-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Error al guardar' });
      } else {
        setMessage({ type: 'success', text: 'Tarifa actualizada' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList>
        <TabsTrigger value="dashboard">
          <TrendingUp className="mr-1.5 size-3.5" />
          Proyección
        </TabsTrigger>
        <TabsTrigger value="config">
          <Settings className="mr-1.5 size-3.5" />
          Conceptos y tarifas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-8 pt-6">
        <KpiGrid>
          <KpiCard
            label="Clientes activos"
            value={activeTenants}
            icon={<Users className="size-4" />}
          />
          <KpiCard
            label="Eventos facturables (90d)"
            value={totalEvents90}
            icon={<Calendar className="size-4" />}
            tone={totalEvents90 > 10 ? 'warning' : 'default'}
          />
          <KpiCard
            label="Ingresos proyectados (90d)"
            value={formatCurrency(revenue90)}
            icon={<DollarSign className="size-4" />}
          />
          <KpiCard
            label="Recurrente mensual"
            value={formatCurrency(monthlyRecurring)}
            icon={<TrendingUp className="size-4" />}
          />
        </KpiGrid>

        {/* Breakdown por categoría (eventos) */}
        <div
          className="grid gap-4 rounded-2xl border p-5 md:grid-cols-4"
          style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
        >
          <BreakdownStat
            label="Renovaciones de marca"
            value={bucket90?.brands ?? 0}
            sub={formatCurrency((bucket90?.brands ?? 0) * (ratesByKey.get('brand_renewal') ?? 0))}
            icon={<Briefcase className="size-4" style={{ color: '#355B6F' }} />}
          />
          <BreakdownStat
            label="Declaraciones de uso"
            value={bucket90?.useDeclarations ?? 0}
            sub={formatCurrency((bucket90?.useDeclarations ?? 0) * (ratesByKey.get('use_declaration') ?? 0))}
            icon={<Calendar className="size-4" style={{ color: '#355B6F' }} />}
          />
          <BreakdownStat
            label="Renov. de contratos"
            value={bucket90?.contracts ?? 0}
            sub={formatCurrency((bucket90?.contracts ?? 0) * (ratesByKey.get('contract_renewal') ?? 0))}
            icon={<Briefcase className="size-4" style={{ color: '#355B6F' }} />}
          />
          <BreakdownStat
            label="Renov. de licencias"
            value={bucket90?.licenses ?? 0}
            sub={formatCurrency((bucket90?.licenses ?? 0) * (ratesByKey.get('license_renewal') ?? 0))}
            icon={<Briefcase className="size-4" style={{ color: '#355B6F' }} />}
          />
        </div>

        {/* Pipeline: marcas en trámite */}
        <div className="grid gap-4 md:grid-cols-3">
          <Stat
            label="Marcas en trámite (pipeline)"
            value={inProgressBrands}
            hint={`Potencial: ${formatCurrency(inProgressBrands * (ratesByKey.get('new_registration') ?? 0))} si concluyen`}
          />
          <Stat label="Contratos vigentes" value={totalContracts} hint="A monitorear renovación" />
          <Stat label="Licencias vigentes" value={totalLicenses} hint="A monitorear vencimiento" />
        </div>

        {/* Gráfica — MISMO ESTILO que la versión anterior */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(28,63,85,0.85) 0%, rgba(11,31,42,1) 60%, #07151D 100%)',
            border: '1px solid rgba(143,182,199,0.18)',
            boxShadow: '0 20px 60px rgba(11,31,42,0.18)',
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-3 px-6 pt-6 pb-2">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: '#8FB6C7' }}
              >
                Proyección financiera global
              </p>
              <h3
                className="mt-1 text-xl font-bold tracking-tight"
                style={{ color: '#FBF6EC' }}
              >
                Eventos e ingresos por ventana de tiempo
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="inline-flex rounded-lg p-0.5"
                style={{ background: 'rgba(251,246,236,0.06)' }}
              >
                {(['eventos', 'ingresos'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChartMetric(m)}
                    className="rounded-md px-3 py-1 text-xs font-medium transition-all"
                    style={
                      chartMetric === m
                        ? { background: '#D39A2B', color: '#0B1F2A' }
                        : { color: 'rgba(251,246,236,0.6)' }
                    }
                  >
                    {m === 'eventos' ? 'Eventos' : 'Ingresos'}
                  </button>
                ))}
              </div>
              <div
                className="inline-flex rounded-lg p-0.5"
                style={{ background: 'rgba(251,246,236,0.06)' }}
              >
                {(['90d', '180d', '365d'] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setChartWindow(w)}
                    className="rounded-md px-2.5 py-1 text-xs font-medium transition-all"
                    style={
                      chartWindow === w
                        ? { background: 'rgba(143,182,199,0.25)', color: '#FBF6EC' }
                        : { color: 'rgba(251,246,236,0.6)' }
                    }
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-80 px-3 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, bottom: 5, left: 10 }}>
                <defs>
                  <linearGradient id="areaPrimaryPmk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8FB6C7" stopOpacity={0.9} />
                    <stop offset="55%" stopColor="#D39A2B" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#D39A2B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="strokePrimaryPmk" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8FB6C7" />
                    <stop offset="50%" stopColor="#E8C36A" />
                    <stop offset="100%" stopColor="#D39A2B" />
                  </linearGradient>
                  <filter id="glowPmk" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="2 6"
                  stroke="rgba(143,182,199,0.15)"
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  tick={{ fill: 'rgba(251,246,236,0.7)', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: 'rgba(143,182,199,0.2)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(251,246,236,0.45)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    chartMetric === 'ingresos'
                      ? `$${(Number(v) / 1000).toFixed(0)}k`
                      : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(11,31,42,0.95)',
                    border: '1px solid rgba(143,182,199,0.3)',
                    borderRadius: 12,
                    color: '#FBF6EC',
                    fontSize: 12,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: '#8FB6C7', fontWeight: 600 }}
                  formatter={
                    ((value: number) => [
                      chartMetric === 'ingresos'
                        ? formatCurrency(Number(value))
                        : `${value} evento${Number(value) === 1 ? '' : 's'}`,
                      chartMetric === 'ingresos' ? 'Ingresos proyectados' : 'Eventos facturables',
                    ]) as never
                  }
                  isAnimationActive={false}
                  cursor={{ stroke: 'rgba(211,154,43,0.5)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="url(#strokePrimaryPmk)"
                  strokeWidth={3}
                  fill="url(#areaPrimaryPmk)"
                  fillOpacity={1}
                  dot={{
                    r: 5,
                    fill: '#D39A2B',
                    stroke: '#FBF6EC',
                    strokeWidth: 2,
                    filter: 'url(#glowPmk)',
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#FBF6EC',
                    stroke: '#D39A2B',
                    strokeWidth: 3,
                    filter: 'url(#glowPmk)',
                  }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="config" className="space-y-4 pt-6">
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
        >
          <h3 className="text-base font-bold" style={{ color: '#0F2E3D' }}>
            Conceptos facturables
          </h3>
          <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
            Edita el monto de cada concepto. Los cambios se aplican inmediatamente al cálculo de proyección.
          </p>

          {message && (
            <div
              className="mt-3 rounded-lg px-3 py-2 text-xs"
              style={
                message.type === 'success'
                  ? { background: 'rgba(47,107,79,0.10)', color: '#2F6B4F' }
                  : { background: 'rgba(180,35,24,0.08)', color: '#B42318' }
              }
            >
              {message.text}
            </div>
          )}

          <div className="mt-5 space-y-2">
            {concepts.map((c) => {
              const cat = CATEGORY_TONE[c.category] ?? CATEGORY_TONE.OPERATIVO;
              return (
                <div
                  key={c.key}
                  className="flex flex-wrap items-center gap-3 rounded-xl border p-4"
                  style={{ borderColor: '#E2DED6', background: '#FFFFFF' }}
                >
                  <div className="min-w-[220px] flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: cat.bg, color: cat.color }}
                      >
                        {CATEGORY_LABELS[c.category] ?? c.category}
                      </span>
                      <p className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                        {c.label}
                      </p>
                    </div>
                    {c.description && (
                      <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
                        {c.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: '#355B6F' }}>
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={c.amount}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setConcepts((prev) =>
                          prev.map((p) => (p.key === c.key ? { ...p, amount: v } : p)),
                        );
                      }}
                      className="w-32 rounded-lg border px-3 py-2 text-right text-sm font-semibold tabular-nums focus:outline-none"
                      style={{ borderColor: '#E2DED6', color: '#0F2E3D' }}
                    />
                    <span className="text-[10px] font-semibold" style={{ color: '#8FB6C7' }}>
                      {c.currency}
                    </span>
                    <button
                      type="button"
                      onClick={() => saveAmount(c.key, c.amount)}
                      disabled={savingKey === c.key}
                      className="ml-2 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                        color: '#FBF6EC',
                      }}
                    >
                      {savingKey === c.key ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Save className="size-3" />
                      )}
                      Guardar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function BreakdownStat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#355B6F' }}>
          {label}
        </p>
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: '#0F2E3D' }}>
        {value}
      </p>
      <p className="text-[11px] font-medium" style={{ color: '#355B6F' }}>
        {sub}
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#355B6F' }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: '#0F2E3D' }}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px]" style={{ color: '#355B6F' }}>
        {hint}
      </p>
    </div>
  );
}

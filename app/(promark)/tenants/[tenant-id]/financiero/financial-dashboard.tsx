'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Settings } from 'lucide-react';
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

interface FinancialDashboardProps {
  tenantId: string;
  renewals30: number;
  renewals60: number;
  renewals90: number;
  totalBrands: number;
}

export function FinancialDashboard({
  tenantId,
  renewals30,
  renewals60,
  renewals90,
  totalBrands,
}: FinancialDashboardProps) {
  const [renewalCost, setRenewalCost] = useState<number>(5000);
  const [declarationCost, setDeclarationCost] = useState<number>(2500);
  const [chartMetric, setChartMetric] = useState<'renovaciones' | 'costo'>('renovaciones');
  const [chartWindow, setChartWindow] = useState<'90d' | '60d' | '30d'>('90d');

  // tenantId reserved for future server actions
  void tenantId;

  const fullData = [
    { period: '0-30 días', renovaciones: renewals30, costo: renewals30 * renewalCost },
    { period: '31-60 días', renovaciones: renewals60, costo: renewals60 * renewalCost },
    { period: '61-90 días', renovaciones: renewals90, costo: renewals90 * renewalCost },
  ];
  const chartData =
    chartWindow === '30d'
      ? fullData.slice(0, 1)
      : chartWindow === '60d'
        ? fullData.slice(0, 2)
        : fullData;

  const totalRenewals = renewals30 + renewals60 + renewals90;
  const totalCost = totalRenewals * renewalCost;

  // A8: incluir sufijo "MXN" para que la moneda sea explícita (no ambigua vs USD).
  const formatCurrency = (val: number) =>
    `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val)} MXN`;

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList>
        <TabsTrigger value="dashboard">
          <TrendingUp className="mr-1.5 size-3.5" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="config">
          <Settings className="mr-1.5 size-3.5" />
          Valores monetarios
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-8 pt-6">
        <KpiGrid>
          <KpiCard
            label="Renovaciones próximas (90d)"
            value={totalRenewals}
            icon={<Calendar className="size-4" />}
            tone={totalRenewals > 5 ? 'warning' : 'default'}
          />
          <KpiCard
            label="Costo estimado (90d)"
            value={formatCurrency(totalCost)}
            icon={<DollarSign className="size-4" />}
            tone="default"
          />
          <KpiCard
            label="Costo por renovación"
            value={formatCurrency(renewalCost)}
            icon={<DollarSign className="size-4" />}
          />
          <KpiCard
            label="Total marcas"
            value={totalBrands}
            icon={<TrendingUp className="size-4" />}
          />
        </KpiGrid>

        {/* Gráfica moderna estilo data-viz futurista */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(28,63,85,0.85) 0%, rgba(11,31,42,1) 60%, #07151D 100%)',
            border: '1px solid rgba(143,182,199,0.18)',
            boxShadow: '0 20px 60px rgba(11,31,42,0.18)',
          }}
        >
          {/* Header con filtros */}
          <div className="flex flex-wrap items-end justify-between gap-3 px-6 pt-6 pb-2">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: '#8FB6C7' }}
              >
                Proyección financiera
              </p>
              <h3
                className="mt-1 text-xl font-bold tracking-tight"
                style={{ color: '#FBF6EC' }}
              >
                Renovaciones por periodo
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Métrica */}
              <div
                className="inline-flex rounded-lg p-0.5"
                style={{ background: 'rgba(251,246,236,0.06)' }}
              >
                {(['renovaciones', 'costo'] as const).map((m) => (
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
                    {m === 'renovaciones' ? 'Cantidad' : 'Costo'}
                  </button>
                ))}
              </div>
              {/* Ventana */}
              <div
                className="inline-flex rounded-lg p-0.5"
                style={{ background: 'rgba(251,246,236,0.06)' }}
              >
                {(['30d', '60d', '90d'] as const).map((w) => (
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
                  <linearGradient id="areaPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8FB6C7" stopOpacity={0.9} />
                    <stop offset="55%" stopColor="#D39A2B" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#D39A2B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="strokePrimary" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8FB6C7" />
                    <stop offset="50%" stopColor="#E8C36A" />
                    <stop offset="100%" stopColor="#D39A2B" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
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
                    chartMetric === 'costo'
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any) => [
                    chartMetric === 'costo'
                      ? formatCurrency(Number(value))
                      : `${value} marca${Number(value) === 1 ? '' : 's'}`,
                    chartMetric === 'costo' ? 'Costo estimado' : 'Renovaciones',
                  ]) as never}
                  isAnimationActive={false}
                  cursor={{ stroke: 'rgba(211,154,43,0.5)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="url(#strokePrimary)"
                  strokeWidth={3}
                  fill="url(#areaPrimary)"
                  fillOpacity={1}
                  dot={{
                    r: 5,
                    fill: '#D39A2B',
                    stroke: '#FBF6EC',
                    strokeWidth: 2,
                    filter: 'url(#glow)',
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#FBF6EC',
                    stroke: '#D39A2B',
                    strokeWidth: 3,
                    filter: 'url(#glow)',
                  }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="config" className="pt-6">
        <div
          className="rounded-2xl border p-6"
          style={{
            background: 'linear-gradient(135deg, #B5C4CC 0%, #E6EEF2 100%)',
            borderColor: 'rgba(15,46,61,0.08)',
          }}
        >
          <h3 className="mb-2 text-base font-bold" style={{ color: '#0F2E3D' }}>
            Configuración de valores monetarios
          </h3>
          <p className="mb-6 text-xs" style={{ color: '#0F2E3D', opacity: 0.75 }}>
            Estos valores se usan para calcular estimaciones financieras. Se guardan localmente en esta sesión.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: '#0F2E3D' }}>
                Costo por renovación (MXN)
              </label>
              <input
                type="number"
                value={renewalCost}
                onChange={(e) => setRenewalCost(Number(e.target.value) || 0)}
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ background: '#FBF6EC', borderColor: 'rgba(15,46,61,0.12)', color: '#0F2E3D' }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: '#0F2E3D' }}>
                Costo por declaración de uso (MXN)
              </label>
              <input
                type="number"
                value={declarationCost}
                onChange={(e) => setDeclarationCost(Number(e.target.value) || 0)}
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ background: '#FBF6EC', borderColor: 'rgba(15,46,61,0.12)', color: '#0F2E3D' }}
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

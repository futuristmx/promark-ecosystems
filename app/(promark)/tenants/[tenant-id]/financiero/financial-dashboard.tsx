'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KpiCard, KpiGrid, DsCard } from '@/components/ds';

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

  // tenantId reserved for future server actions
  void tenantId;

  const chartData = [
    { period: '0-30 días', renovaciones: renewals30, costo: renewals30 * renewalCost },
    { period: '31-60 días', renovaciones: renewals60, costo: renewals60 * renewalCost },
    { period: '61-90 días', renovaciones: renewals90, costo: renewals90 * renewalCost },
  ];

  const totalRenewals = renewals30 + renewals60 + renewals90;
  const totalCost = totalRenewals * renewalCost;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

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

        <DsCard variant="standard">
          <h3
            className="mb-4 text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#355B6F' }}
          >
            Renovaciones por periodo
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DED6" />
                <XAxis dataKey="period" tick={{ fill: '#355B6F', fontSize: 12 }} />
                <YAxis tick={{ fill: '#C8C4B9', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#FBF6EC',
                    border: '1px solid #E2DED6',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'costo' ? formatCurrency(value) : value,
                    name === 'costo' ? 'Costo estimado' : 'Renovaciones',
                  ]}
                  isAnimationActive={false}
                />
                <Bar dataKey="renovaciones" fill="#0F2E3D" radius={[6, 6, 0, 0]} />
                <Bar dataKey="costo" fill="#D39A2B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DsCard>
      </TabsContent>

      <TabsContent value="config" className="pt-6">
        <DsCard variant="standard">
          <h3 className="mb-6 text-sm font-bold" style={{ color: '#0F2E3D' }}>
            Configuración de valores monetarios
          </h3>
          <p className="mb-6 text-xs" style={{ color: '#355B6F' }}>
            Estos valores se usan para calcular estimaciones financieras. Se guardan localmente en esta sesión.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>
                Costo por renovación (MXN)
              </label>
              <input
                type="number"
                value={renewalCost}
                onChange={(e) => setRenewalCost(Number(e.target.value) || 0)}
                className="w-full rounded-xl border px-4 py-3 text-sm"
                style={{ background: '#FBF6EC', borderColor: '#E2DED6', color: '#0F2E3D' }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>
                Costo por declaración de uso (MXN)
              </label>
              <input
                type="number"
                value={declarationCost}
                onChange={(e) => setDeclarationCost(Number(e.target.value) || 0)}
                className="w-full rounded-xl border px-4 py-3 text-sm"
                style={{ background: '#FBF6EC', borderColor: '#E2DED6', color: '#0F2E3D' }}
              />
            </div>
          </div>
        </DsCard>
      </TabsContent>
    </Tabs>
  );
}

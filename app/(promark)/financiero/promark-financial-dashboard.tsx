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
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
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
import { SmartFilterBar, type ActiveFilters } from '@/components/portfolio/smart-filter-bar';
import type { BillingConcept, ProjectionBucket, TenantSummary } from './page';

interface Props {
  activeTenants: number;
  totalBrands: number;
  inProgressBrands: number;
  totalContracts: number;
  totalLicenses: number;
  projection: ProjectionBucket[];
  billingConcepts: BillingConcept[];
  tenantSummaries: TenantSummary[];
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

// Mapeo concepto → cómo se calcula el ingreso por bucket
// Si solo ciertos conceptos están filtrados, ignorar los demás.
function revenueForBucket(
  b: ProjectionBucket,
  byKey: Map<string, number>,
  enabledKeys: Set<string> | null,
): number {
  const rate = (k: string) => (enabledKeys && !enabledKeys.has(k) ? 0 : (byKey.get(k) ?? 0));
  return (
    b.brands * rate('brand_renewal') +
    b.useDeclarations * rate('use_declaration') +
    b.contracts * rate('contract_renewal') +
    b.licenses * rate('license_renewal')
  );
}

function scaleBucket(b: ProjectionBucket, fraction: number): ProjectionBucket {
  return {
    ...b,
    brands: Math.round(b.brands * fraction),
    contracts: Math.round(b.contracts * fraction),
    licenses: Math.round(b.licenses * fraction),
    useDeclarations: Math.round(b.useDeclarations * fraction),
  };
}

export function PromarkFinancialDashboard({
  activeTenants,
  inProgressBrands,
  totalContracts,
  totalLicenses,
  projection,
  billingConcepts,
  tenantSummaries,
}: Props) {
  const [concepts, setConcepts] = useState<BillingConcept[]>(billingConcepts);
  const [chartMetric, setChartMetric] = useState<'eventos' | 'ingresos'>('ingresos');
  const [chartWindow, setChartWindow] = useState<'90d' | '180d' | '365d'>('90d');
  const [chartFilters, setChartFilters] = useState<ActiveFilters>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ label: string; description: string; category: string }>({
    label: '',
    description: '',
    category: 'OPERATIVO',
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDraft, setNewDraft] = useState({
    label: '',
    description: '',
    amount: 0,
    category: 'OPERATIVO',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const ratesByKey = useMemo(
    () => new Map(concepts.map((c) => [c.key, c.amount])),
    [concepts],
  );

  // ─────────── Filtros de la gráfica ───────────
  const enabledConceptKeys = useMemo(() => {
    const selected = chartFilters.concepts ?? [];
    if (selected.length === 0) return null; // null = todos
    return new Set(selected);
  }, [chartFilters.concepts]);

  const enabledCategorySet = useMemo(() => {
    const selected = chartFilters.category ?? [];
    if (selected.length === 0) return null;
    return new Set(selected);
  }, [chartFilters.category]);

  // Si hay filtro de categoría, derivamos las keys habilitadas
  const finalEnabledKeys = useMemo(() => {
    if (!enabledCategorySet && !enabledConceptKeys) return null;
    const fromCategory = enabledCategorySet
      ? new Set(concepts.filter((c) => enabledCategorySet.has(c.category)).map((c) => c.key))
      : null;
    if (!fromCategory) return enabledConceptKeys;
    if (!enabledConceptKeys) return fromCategory;
    // Intersección
    return new Set([...enabledConceptKeys].filter((k) => fromCategory.has(k)));
  }, [enabledCategorySet, enabledConceptKeys, concepts]);

  // Si hay filtro de tenant, escalamos los buckets globales proporcionalmente
  const tenantFraction = useMemo(() => {
    const selectedTenants = chartFilters.tenants ?? [];
    if (selectedTenants.length === 0) return 1;
    const totalBrands365 = tenantSummaries.reduce((s, t) => s + t.brands, 0);
    const selBrands365 = tenantSummaries
      .filter((t) => selectedTenants.includes(t.id))
      .reduce((s, t) => s + t.brands, 0);
    if (totalBrands365 === 0) return 0;
    return selBrands365 / totalBrands365;
  }, [chartFilters.tenants, tenantSummaries]);

  const visibleProjection = useMemo(() => {
    const maxDays = parseInt(chartWindow.replace('d', ''), 10);
    return projection
      .filter((p) => p.days <= maxDays)
      .map((p) => scaleBucket(p, tenantFraction));
  }, [projection, chartWindow, tenantFraction]);

  const chartData = visibleProjection.map((b) => ({
    period: `${b.days} días`,
    eventos: b.brands + b.useDeclarations + b.contracts + b.licenses,
    ingresos: revenueForBucket(b, ratesByKey, finalEnabledKeys),
  }));

  const bucket90Scaled = scaleBucket(
    projection.find((p) => p.days === 90) ?? projection[0],
    tenantFraction,
  );
  const totalEvents90 =
    bucket90Scaled.brands +
    bucket90Scaled.useDeclarations +
    bucket90Scaled.contracts +
    bucket90Scaled.licenses;
  const revenue90 = revenueForBucket(bucket90Scaled, ratesByKey, finalEnabledKeys);

  const monthlyRecurring = useMemo(() => {
    const fraction = (chartFilters.tenants ?? []).length === 0
      ? 1
      : (chartFilters.tenants?.length ?? 0) / Math.max(1, tenantSummaries.length);
    const monthly = ratesByKey.get('monthly_service') ?? 0;
    const annual = ratesByKey.get('annual_audit') ?? 0;
    const effectiveTenants = activeTenants * fraction;
    return effectiveTenants * (monthly + annual / 12);
  }, [activeTenants, ratesByKey, chartFilters.tenants, tenantSummaries.length]);

  const formatCurrency = (val: number) =>
    `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val)} MXN`;

  // ─────────── CRUD ───────────
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
      if (!res.ok) setMessage({ type: 'error', text: data.error ?? 'Error al guardar' });
      else setMessage({ type: 'success', text: 'Tarifa actualizada' });
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSavingKey(null);
    }
  }

  async function saveEdit(key: string) {
    setSavingKey(key);
    setMessage(null);
    try {
      const res = await fetch('/api/promark/billing-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          label: editDraft.label,
          description: editDraft.description,
          category: editDraft.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Error al guardar' });
      } else {
        setConcepts((prev) =>
          prev.map((c) =>
            c.key === key
              ? {
                  ...c,
                  label: editDraft.label,
                  description: editDraft.description || null,
                  category: editDraft.category,
                }
              : c,
          ),
        );
        setEditingKey(null);
        setMessage({ type: 'success', text: 'Concepto actualizado' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSavingKey(null);
    }
  }

  async function deleteConcept(key: string, label: string) {
    if (!confirm(`¿Eliminar el concepto "${label}"? Esta acción no se puede deshacer.`)) return;
    setDeletingKey(key);
    setMessage(null);
    try {
      const res = await fetch(`/api/promark/billing-config?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Error al eliminar' });
      } else {
        setConcepts((prev) => prev.filter((c) => c.key !== key));
        setMessage({ type: 'success', text: 'Concepto eliminado' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setDeletingKey(null);
    }
  }

  async function createConcept() {
    if (!newDraft.label.trim()) {
      setMessage({ type: 'error', text: 'Nombre requerido' });
      return;
    }
    setSavingKey('__new__');
    setMessage(null);
    try {
      const res = await fetch('/api/promark/billing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDraft),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Error al crear' });
      } else {
        setConcepts((prev) => [...prev, data.config]);
        setShowNewForm(false);
        setNewDraft({ label: '', description: '', amount: 0, category: 'OPERATIVO' });
        setMessage({ type: 'success', text: 'Concepto creado' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSavingKey(null);
    }
  }

  // ─────────── Render ───────────
  const filterFields = useMemo(
    () => [
      {
        key: 'category',
        label: 'Categoría',
        options: ['OPERATIVO', 'RECURRENTE', 'EVENTUAL'].map((cat) => ({
          value: cat,
          label: CATEGORY_LABELS[cat] ?? cat,
          count: concepts.filter((c) => c.category === cat).length,
        })),
      },
      {
        key: 'concepts',
        label: 'Conceptos',
        options: concepts.map((c) => ({
          value: c.key,
          label: c.label,
          count: undefined,
        })),
      },
      {
        key: 'tenants',
        label: 'Clientes',
        options: tenantSummaries.map((t) => ({
          value: t.id,
          label: t.name,
          count: t.brands + t.contracts + t.licenses + t.useDeclarations,
        })),
      },
    ],
    [concepts, tenantSummaries],
  );

  const totalShown = chartData.reduce(
    (s, d) => s + (chartMetric === 'ingresos' ? d.ingresos : d.eventos),
    0,
  );

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
        {/* HERO — los 2 KPIs más importantes */}
        <div className="grid gap-4 md:grid-cols-2">
          <HeroKpi
            eyebrow="Ingresos proyectados · 90 días"
            value={formatCurrency(revenue90)}
            sub="Eventos facturables proyectados al cierre del trimestre"
            icon={<DollarSign className="size-6" style={{ color: '#F5C97A' }} />}
          />
          <HeroKpi
            eyebrow="Recurrente mensual"
            value={formatCurrency(monthlyRecurring)}
            sub="Iguala mensual base + porción anual de auditorías"
            icon={<TrendingUp className="size-6" style={{ color: '#F5C97A' }} />}
          />
        </div>

        {/* Fact strip secundario */}
        <div
          className="flex flex-wrap items-center justify-around gap-6 rounded-2xl border-[1.5px] px-6 py-4"
          style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
        >
          <FactStat
            icon={<Users className="size-4" style={{ color: '#355B6F' }} />}
            label="Clientes activos"
            value={String(activeTenants)}
          />
          <div className="h-8 w-px" style={{ background: '#E2DED6' }} />
          <FactStat
            icon={<Calendar className="size-4" style={{ color: '#355B6F' }} />}
            label="Eventos facturables (90d)"
            value={String(totalEvents90)}
            tone={totalEvents90 > 10 ? 'warning' : 'default'}
          />
        </div>

        {/* Breakdown por categoría (eventos) — refleja filtros */}
        <div
          className="grid gap-4 rounded-2xl p-5 md:grid-cols-4"
          style={{ background: '#F1EDE3' }}
        >
          <BreakdownStat
            label="Renovaciones de marca"
            value={bucket90Scaled.brands}
            sub={formatCurrency(
              bucket90Scaled.brands *
                (finalEnabledKeys && !finalEnabledKeys.has('brand_renewal')
                  ? 0
                  : (ratesByKey.get('brand_renewal') ?? 0)),
            )}
            icon={<Briefcase className="size-4" style={{ color: '#355B6F' }} />}
          />
          <BreakdownStat
            label="Declaraciones de uso"
            value={bucket90Scaled.useDeclarations}
            sub={formatCurrency(
              bucket90Scaled.useDeclarations *
                (finalEnabledKeys && !finalEnabledKeys.has('use_declaration')
                  ? 0
                  : (ratesByKey.get('use_declaration') ?? 0)),
            )}
            icon={<Calendar className="size-4" style={{ color: '#355B6F' }} />}
          />
          <BreakdownStat
            label="Renov. de contratos"
            value={bucket90Scaled.contracts}
            sub={formatCurrency(
              bucket90Scaled.contracts *
                (finalEnabledKeys && !finalEnabledKeys.has('contract_renewal')
                  ? 0
                  : (ratesByKey.get('contract_renewal') ?? 0)),
            )}
            icon={<Briefcase className="size-4" style={{ color: '#355B6F' }} />}
          />
          <BreakdownStat
            label="Renov. de licencias"
            value={bucket90Scaled.licenses}
            sub={formatCurrency(
              bucket90Scaled.licenses *
                (finalEnabledKeys && !finalEnabledKeys.has('license_renewal')
                  ? 0
                  : (ratesByKey.get('license_renewal') ?? 0)),
            )}
            icon={<Briefcase className="size-4" style={{ color: '#355B6F' }} />}
          />
        </div>

        {/* Pipeline */}
        <div className="grid gap-4 md:grid-cols-3">
          <Stat
            label="Marcas en trámite (pipeline)"
            value={inProgressBrands}
            hint={`Potencial: ${formatCurrency(inProgressBrands * (ratesByKey.get('new_registration') ?? 0))} si concluyen`}
          />
          <Stat label="Contratos vigentes" value={totalContracts} hint="A monitorear renovación" />
          <Stat label="Licencias vigentes" value={totalLicenses} hint="A monitorear vencimiento" />
        </div>

        {/* Filtros inteligentes para la gráfica */}
        <SmartFilterBar
          hideSearch
          fields={filterFields}
          active={chartFilters}
          onActiveChange={setChartFilters}
          totalResults={Math.round(totalShown)}
          totalUnfiltered={Math.round(
            visibleProjection.reduce(
              (s, b) =>
                s +
                (chartMetric === 'ingresos'
                  ? revenueForBucket(b, ratesByKey, null)
                  : b.brands + b.useDeclarations + b.contracts + b.licenses),
              0,
            ),
          )}
          rightSlot={
            <div className="flex items-center gap-2">
              <div
                className="inline-flex rounded-lg border-[1.5px] p-0.5"
                style={{ borderColor: '#355B6F', background: '#FBF6EC' }}
              >
                {(['eventos', 'ingresos'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChartMetric(m)}
                    className="rounded-md px-3 py-1 text-xs font-bold transition-all"
                    style={
                      chartMetric === m
                        ? { background: '#0F2E3D', color: '#FBF6EC' }
                        : { color: '#355B6F' }
                    }
                  >
                    {m === 'eventos' ? 'Eventos' : 'Ingresos'}
                  </button>
                ))}
              </div>
              <div
                className="inline-flex rounded-lg border-[1.5px] p-0.5"
                style={{ borderColor: '#355B6F', background: '#FBF6EC' }}
              >
                {(['90d', '180d', '365d'] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setChartWindow(w)}
                    className="rounded-md px-2.5 py-1 text-xs font-bold transition-all"
                    style={
                      chartWindow === w
                        ? { background: '#0F2E3D', color: '#FBF6EC' }
                        : { color: '#355B6F' }
                    }
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        {/* Gráfica — MISMO ESTILO premium */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(28,63,85,0.85) 0%, rgba(11,31,42,1) 60%, #07151D 100%)',
            border: '1px solid rgba(143,182,199,0.18)',
            boxShadow: '0 20px 60px rgba(11,31,42,0.18)',
          }}
        >
          <div className="px-6 pt-6 pb-2">
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
          className="rounded-2xl border-[1.5px] p-5"
          style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold" style={{ color: '#0F2E3D' }}>
                Conceptos facturables
              </h3>
              <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
                Crea, edita o elimina conceptos. Los cambios se aplican inmediatamente al cálculo de proyección.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewForm((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all"
              style={{
                background: showNewForm ? '#FBF6EC' : 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                color: showNewForm ? '#0F2E3D' : '#FBF6EC',
                border: showNewForm ? '1.5px solid #355B6F' : 'none',
                boxShadow: showNewForm ? 'none' : '0 2px 8px rgba(15,46,61,0.2)',
              }}
            >
              {showNewForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {showNewForm ? 'Cancelar' : 'Nuevo concepto'}
            </button>
          </div>

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

          {showNewForm && (
            <div
              className="mt-4 rounded-xl border-[1.5px] p-4"
              style={{ borderColor: 'rgba(211,154,43,0.4)', background: 'rgba(211,154,43,0.06)' }}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_180px_160px_auto]">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={newDraft.label}
                    onChange={(e) => setNewDraft({ ...newDraft, label: e.target.value })}
                    placeholder="Ej. Estudio de viabilidad"
                    className="mt-1 w-full rounded-lg border-[1.5px] px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                    Categoría
                  </label>
                  <select
                    value={newDraft.category}
                    onChange={(e) => setNewDraft({ ...newDraft, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border-[1.5px] px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
                  >
                    <option value="OPERATIVO">Operativo</option>
                    <option value="RECURRENTE">Recurrente</option>
                    <option value="EVENTUAL">Eventual</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                    Monto MXN
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={newDraft.amount}
                    onChange={(e) => setNewDraft({ ...newDraft, amount: Number(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border-[1.5px] px-3 py-2 text-right text-sm font-semibold tabular-nums focus:outline-none"
                    style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={createConcept}
                    disabled={savingKey === '__new__'}
                    className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #D39A2B 0%, #E0A847 100%)',
                      color: '#0F2E3D',
                    }}
                  >
                    {savingKey === '__new__' ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    Crear
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={newDraft.description}
                  onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })}
                  placeholder="Detalle del concepto"
                  className="mt-1 w-full rounded-lg border-[1.5px] px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2">
            {concepts.map((c) => {
              const cat = CATEGORY_TONE[c.category] ?? CATEGORY_TONE.OPERATIVO;
              const isEditing = editingKey === c.key;

              if (isEditing) {
                return (
                  <div
                    key={c.key}
                    className="rounded-xl border-[1.5px] p-4"
                    style={{ borderColor: '#D39A2B', background: 'rgba(211,154,43,0.05)' }}
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={editDraft.label}
                          onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                          className="mt-1 w-full rounded-lg border-[1.5px] px-3 py-2 text-sm focus:outline-none"
                          style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                          Categoría
                        </label>
                        <select
                          value={editDraft.category}
                          onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                          className="mt-1 w-full rounded-lg border-[1.5px] px-3 py-2 text-sm focus:outline-none"
                          style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
                        >
                          <option value="OPERATIVO">Operativo</option>
                          <option value="RECURRENTE">Recurrente</option>
                          <option value="EVENTUAL">Eventual</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={editDraft.description}
                        onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                        className="mt-1 w-full rounded-lg border-[1.5px] px-3 py-2 text-sm focus:outline-none"
                        style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingKey(null)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ color: '#355B6F' }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(c.key)}
                        disabled={savingKey === c.key}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                          color: '#FBF6EC',
                        }}
                      >
                        {savingKey === c.key ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={c.key}
                  className="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] p-4"
                  style={{ borderColor: '#E2DED6', background: '#FFFFFF' }}
                >
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                    <span className="text-xs font-semibold" style={{ color: '#355B6F' }}>$</span>
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
                      className="w-32 rounded-lg border-[1.5px] px-3 py-2 text-right text-sm font-semibold tabular-nums focus:outline-none"
                      style={{ borderColor: '#E2DED6', color: '#0F2E3D' }}
                    />
                    <span className="text-[10px] font-semibold" style={{ color: '#8FB6C7' }}>
                      {c.currency}
                    </span>
                    <button
                      type="button"
                      onClick={() => saveAmount(c.key, c.amount)}
                      disabled={savingKey === c.key}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                        color: '#FBF6EC',
                      }}
                      title="Guardar monto"
                    >
                      {savingKey === c.key ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Save className="size-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingKey(c.key);
                        setEditDraft({
                          label: c.label,
                          description: c.description ?? '',
                          category: c.category,
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded-lg p-2 text-xs font-semibold transition-colors hover:bg-black/5"
                      style={{ color: '#355B6F' }}
                      title="Editar nombre/descripción/categoría"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteConcept(c.key, c.label)}
                      disabled={deletingKey === c.key}
                      className="inline-flex items-center gap-1 rounded-lg p-2 text-xs font-semibold transition-colors hover:bg-black/5 disabled:opacity-50"
                      style={{ color: '#B42318' }}
                      title="Eliminar concepto"
                    >
                      {deletingKey === c.key ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
            {concepts.length === 0 && (
              <div
                className="rounded-xl border-[1.5px] border-dashed py-8 text-center text-sm"
                style={{ borderColor: '#E2DED6', color: '#355B6F' }}
              >
                Sin conceptos. Crea el primero con el botón &quot;Nuevo concepto&quot;.
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function HeroKpi({
  eyebrow,
  value,
  sub,
  icon,
}: {
  eyebrow: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border-[1.5px] p-5"
      style={{
        borderColor: '#0F2E3D',
        background: 'linear-gradient(135deg, #FBF6EC 0%, #F1EDE3 100%)',
        boxShadow: '0 4px 14px rgba(15,46,61,0.08)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border"
          style={{
            background: 'linear-gradient(135deg, rgba(245,201,122,0.18), rgba(245,201,122,0.04))',
            borderColor: 'rgba(211,154,43,0.35)',
          }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: '#7A5A14' }}
          >
            {eyebrow}
          </p>
          <p
            className="mt-1 text-4xl font-bold tabular-nums leading-none"
            style={{ color: '#0F2E3D', letterSpacing: '-0.02em' }}
          >
            {value}
          </p>
          <p className="mt-2 text-xs" style={{ color: '#355B6F' }}>
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
}

function FactStat({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'warning';
}) {
  const valueColor = tone === 'warning' ? '#A87614' : '#0F2E3D';
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'rgba(15,46,61,0.06)' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: '#355B6F' }}>
          {label}
        </p>
        <p className="text-xl font-bold tabular-nums leading-none" style={{ color: valueColor }}>
          {value}
        </p>
      </div>
    </div>
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
      className="rounded-xl px-4 py-3"
      style={{ background: '#F1EDE3' }}
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

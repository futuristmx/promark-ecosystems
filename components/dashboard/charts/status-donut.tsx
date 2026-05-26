'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, ShieldAlert, Send } from 'lucide-react';

export interface StatusDonutDatum {
  label: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  data: StatusDonutDatum[];
  title?: string;
  subtitle?: string;
}

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#0B1F2A',
  border: 'none',
  borderRadius: 10,
  padding: '8px 14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  color: '#FBF6EC',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
};

/* ---------- Insight helpers ---------- */

function computeInsights(data: StatusDonutDatum[], total: number) {
  const active = data
    .filter((d) =>
      ['Registrada', 'Renovada', 'Registered', 'Renewed'].includes(d.label),
    )
    .reduce((s, d) => s + d.value, 0);

  const expired = data
    .filter((d) => ['Vencida', 'Expired'].includes(d.label))
    .reduce((s, d) => s + d.value, 0);

  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

  const riskLevel: 'BAJO' | 'MEDIO' | 'ALTO' =
    expired === 0 ? 'BAJO' : expired <= 2 ? 'MEDIO' : 'ALTO';

  const riskColors = {
    BAJO: { bg: '#DDEAF2', text: '#1C3F55' },
    MEDIO: { bg: '#FEF3C7', text: '#92400E' },
    ALTO: { bg: '#FEE2E2', text: '#B42318' },
  };

  const mainInsight =
    activePct >= 70
      ? `El ${activePct}% del portafolio se encuentra activo (registrado o renovado).`
      : activePct >= 40
        ? `El ${activePct}% del portafolio está activo. Hay oportunidad de fortalecer registros.`
        : `Solo el ${activePct}% del portafolio está activo. Se requiere revisión urgente.`;

  const riskDesc =
    expired === 0
      ? 'No hay marcas vencidas.'
      : expired === 1
        ? '1 marca vencida requiere atención.'
        : `${expired} marcas vencidas requieren atención.`;

  const action =
    expired > 0
      ? 'Revisar las marcas vencidas para evitar riesgos de pérdida de derechos.'
      : 'Mantener el monitoreo periódico del portafolio marcario.';

  const summary =
    active > total / 2
      ? 'La mayoría del portafolio se concentra en marcas activas o renovadas.'
      : 'El portafolio tiene una distribución diversa entre estados legales.';

  return { mainInsight, riskLevel, riskColors, riskDesc, action, summary };
}

/* ---------- Component ---------- */

export function StatusDonut({
  data,
  title = 'Distribución por estado legal',
  subtitle = 'Estado general del portafolio marcario',
}: StatusDonutProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const statusCount = data.filter((d) => d.value > 0).length;
  const insights = computeInsights(data, total);

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h3
          className="text-base font-bold uppercase tracking-wide"
          style={{ color: '#0F2E3D', letterSpacing: '0.04em' }}
        >
          {title}
        </h3>
        <p className="mt-0.5 text-sm" style={{ color: '#355B6F' }}>
          {subtitle}
        </p>
      </div>

      {total === 0 ? (
        <div
          className="flex h-72 items-center justify-center text-sm"
          style={{ color: '#C8C4B9' }}
        >
          Sin datos
        </div>
      ) : (
        <>
          {/* Donut + Table row */}
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
            {/* Donut */}
            <div className="relative h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {data.map((entry, idx) => (
                      <linearGradient
                        key={idx}
                        id={`donut-grad-${idx}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.75} />
                      </linearGradient>
                    ))}
                    <filter id="donut-shadow">
                      <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.08" />
                    </filter>
                  </defs>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="label"
                    isAnimationActive={false}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={100}
                    paddingAngle={2}
                    cornerRadius={4}
                    stroke="none"
                    style={{ filter: 'url(#donut-shadow)' }}
                  >
                    {data.map((_, idx) => (
                      <Cell key={idx} fill={`url(#donut-grad-${idx})`} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
                      String(name),
                    ]}
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: '#DDEAF2', fontSize: 12 }}
                    cursor={false}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-4xl font-bold tracking-tight"
                  style={{ color: '#1A1E23' }}
                >
                  {total}
                </span>
                <span
                  className="mt-0.5 text-xs font-medium"
                  style={{ color: '#355B6F' }}
                >
                  Marcas analizadas
                </span>
              </div>
            </div>

            {/* Table */}
            <div
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2DED6' }}>
                    <th
                      className="px-4 py-2.5 text-left font-semibold"
                      style={{ color: '#0F2E3D' }}
                    >
                      Estado
                    </th>
                    <th
                      className="px-4 py-2.5 text-right font-semibold"
                      style={{ color: '#0F2E3D' }}
                    >
                      Marcas
                    </th>
                    <th
                      className="px-4 py-2.5 text-right font-semibold"
                      style={{ color: '#0F2E3D' }}
                    >
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter((d) => d.value > 0)
                    .sort((a, b) => b.value - a.value)
                    .map((d) => (
                      <tr
                        key={d.label}
                        style={{ borderBottom: '1px solid #E2DED6' }}
                      >
                        <td className="flex items-center gap-2 px-4 py-2.5">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: d.color }}
                          />
                          <span style={{ color: '#1A1E23' }}>{d.label}</span>
                        </td>
                        <td
                          className="px-4 py-2.5 text-right font-medium"
                          style={{ color: '#1A1E23' }}
                        >
                          {d.value}
                        </td>
                        <td
                          className="px-4 py-2.5 text-right"
                          style={{ color: '#355B6F' }}
                        >
                          {Math.round((d.value / total) * 100)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(226,222,214,0.3)' }}>
                    <td
                      className="px-4 py-2.5 font-bold"
                      style={{ color: '#0F2E3D' }}
                    >
                      Total
                    </td>
                    <td
                      className="px-4 py-2.5 text-right font-bold"
                      style={{ color: '#0F2E3D' }}
                    >
                      {total}
                    </td>
                    <td
                      className="px-4 py-2.5 text-right font-bold"
                      style={{ color: '#0F2E3D' }}
                    >
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary insight */}
          <div
            className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(221,234,242,0.35)', border: '1px solid #E2DED6' }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(143,182,199,0.25)' }}
            >
              <TrendingUp className="h-4 w-4" style={{ color: '#355B6F' }} />
            </span>
            <span className="text-sm" style={{ color: '#1A1E23' }}>
              {insights.summary}
            </span>
          </div>

          {/* Insight cards */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Insight principal */}
            <div
              className="rounded-xl px-4 py-3.5"
              style={{ background: '#FBF6EC', border: '1px solid #E2DED6' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: 'rgba(15,46,61,0.1)' }}
                >
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: '#0F2E3D' }} />
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: '#0F2E3D' }}
                >
                  Insight principal
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#355B6F' }}>
                {insights.mainInsight}
              </p>
            </div>

            {/* Riesgo legal */}
            <div
              className="rounded-xl px-4 py-3.5"
              style={{ background: '#FBF6EC', border: '1px solid #E2DED6' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: 'rgba(180,35,24,0.1)' }}
                >
                  <ShieldAlert className="h-3.5 w-3.5" style={{ color: '#B42318' }} />
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: '#B42318' }}
                >
                  Riesgo legal
                </span>
              </div>
              <span
                className="mb-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: insights.riskColors[insights.riskLevel].bg,
                  color: insights.riskColors[insights.riskLevel].text,
                }}
              >
                {insights.riskLevel}
              </span>
              <p className="text-xs leading-relaxed" style={{ color: '#355B6F' }}>
                {insights.riskDesc}
              </p>
            </div>

            {/* Acción sugerida */}
            <div
              className="rounded-xl px-4 py-3.5"
              style={{ background: '#FBF6EC', border: '1px solid #E2DED6' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: 'rgba(28,63,85,0.1)' }}
                >
                  <Send className="h-3.5 w-3.5" style={{ color: '#1C3F55' }} />
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: '#1C3F55' }}
                >
                  Acción sugerida
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#355B6F' }}>
                {insights.action}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

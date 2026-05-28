'use client';

import { useMemo, useState } from 'react';

interface MonthData {
  month: string; // YYYY-MM
  count: number;
}

interface Props {
  data: MonthData[];
  title?: string;
}

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function formatMonth(key: string): { short: string; full: string } {
  const [yearStr, monthStr] = key.split('-');
  const m = parseInt(monthStr, 10) - 1;
  const y = parseInt(yearStr, 10);
  return {
    short: MONTH_NAMES[m] ?? key,
    full: `${MONTH_NAMES[m] ?? key} ${y}`,
  };
}

/**
 * AlluvialVigency
 * Visualización tipo "alluvial / flujo" para vencimientos próximos.
 * Conecta un anchor (Hoy) hacia barras por mes con curvas bezier de grosor
 * proporcional al count, con gradientes premium.
 */
export function AlluvialVigency({ data, title = 'Flujo de vencimientos (24 meses)' }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Take 24 months and split into "buckets" by urgency for color
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);

  // Layout
  const W = 920;
  const H = 280;
  const padX = 40;
  const padTop = 20;
  const padBot = 60;
  const anchorX = padX + 30;
  const flowAreaW = W - anchorX - padX;
  const colW = flowAreaW / data.length;
  const baselineY = H - padBot;
  const maxBarH = baselineY - padTop;

  // Color by month proximity (urgency gradient)
  function urgencyColor(monthIdx: number): { from: string; to: string } {
    if (monthIdx < 3) return { from: '#B42318', to: '#D96B5C' }; // 0-3 months: rojo
    if (monthIdx < 6) return { from: '#D39A2B', to: '#E8B560' }; // 3-6: ámbar
    if (monthIdx < 12) return { from: '#355B6F', to: '#5C8195' }; // 6-12: azul
    return { from: '#0F2E3D', to: '#355B6F' }; // 12-24: azul profundo
  }

  // Compute bezier paths from anchor to each column
  const flows = useMemo(() => {
    return data.map((d, i) => {
      const x = anchorX + i * colW + colW / 2;
      const h = (d.count / max) * maxBarH;
      const barTop = baselineY - h;
      // Ribbon control points
      const ax = anchorX;
      const ay = padTop + maxBarH / 2;
      const ribbonThickness = (d.count / max) * 70 + 4;
      const color = urgencyColor(i);

      // Two bezier curves forming a ribbon
      const c1x = ax + (x - ax) * 0.5;
      const path =
        `M ${ax} ${ay - ribbonThickness / 2} ` +
        `C ${c1x} ${ay - ribbonThickness / 2}, ${c1x} ${barTop}, ${x - colW / 2 + 4} ${barTop} ` +
        `L ${x + colW / 2 - 4} ${barTop} ` +
        `C ${c1x} ${barTop}, ${c1x} ${ay + ribbonThickness / 2}, ${ax} ${ay + ribbonThickness / 2} ` +
        `Z`;

      return {
        path,
        x,
        h,
        barTop,
        ribbonThickness,
        color,
        data: d,
        idx: i,
      };
    });
  }, [data, max, anchorX, colW, maxBarH, baselineY, padTop]);

  if (total === 0) {
    return (
      <div className="space-y-3">
        {title && (
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#0F2E3D' }}>
            {title}
          </h3>
        )}
        <div
          className="rounded-2xl border border-dashed py-16 text-center"
          style={{ borderColor: '#E2DED6', color: '#355B6F' }}
        >
          <p className="text-sm">Sin vencimientos en los próximos 24 meses.</p>
          <p className="mt-1 text-xs" style={{ color: '#C8C4B9' }}>
            Tu portafolio luce sano en el horizonte cercano.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#0F2E3D' }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: '#355B6F' }}>
            {total} vencimiento{total !== 1 && 's'} próximos
          </p>
        </div>
      )}

      <div
        className="overflow-hidden rounded-2xl border p-2"
        style={{
          borderColor: '#E2DED6',
          background:
            'radial-gradient(ellipse at top, #F1EDE3 0%, #FBF6EC 70%)',
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ maxHeight: 320 }}
        >
          <defs>
            {flows.map((f) => (
              <linearGradient
                key={`grad-${f.idx}`}
                id={`flow-${f.idx}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={f.color.from} stopOpacity="0.85" />
                <stop offset="100%" stopColor={f.color.to} stopOpacity="0.55" />
              </linearGradient>
            ))}
            {flows.map((f) => (
              <linearGradient
                key={`bar-${f.idx}`}
                id={`bar-${f.idx}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={f.color.from} stopOpacity="0.95" />
                <stop offset="100%" stopColor={f.color.to} stopOpacity="0.7" />
              </linearGradient>
            ))}
          </defs>

          {/* Anchor "Hoy" */}
          <g>
            <line
              x1={anchorX}
              y1={padTop}
              x2={anchorX}
              y2={baselineY}
              stroke="#355B6F"
              strokeWidth="2"
              strokeOpacity="0.4"
              strokeDasharray="3 3"
            />
            <circle cx={anchorX} cy={padTop + maxBarH / 2} r="6" fill="#0F2E3D" />
            <circle cx={anchorX} cy={padTop + maxBarH / 2} r="3" fill="#F5C97A" />
            <text
              x={anchorX - 6}
              y={padTop - 6}
              textAnchor="end"
              fontSize="11"
              fontWeight="700"
              fill="#0F2E3D"
              letterSpacing="0.04em"
            >
              HOY
            </text>
          </g>

          {/* Baseline */}
          <line
            x1={anchorX}
            y1={baselineY}
            x2={W - padX}
            y2={baselineY}
            stroke="#C8C4B9"
            strokeWidth="1"
          />

          {/* Flows */}
          {flows.map((f) => {
            const isHover = hoverIdx === f.idx;
            const empty = f.data.count === 0;
            if (empty) return null;
            return (
              <g
                key={f.idx}
                onMouseEnter={() => setHoverIdx(f.idx)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={f.path}
                  fill={`url(#flow-${f.idx})`}
                  opacity={hoverIdx === null || isHover ? 1 : 0.35}
                  style={{ transition: 'opacity 200ms' }}
                />
                {/* Bar at end */}
                <rect
                  x={f.x - colW / 2 + 4}
                  y={f.barTop}
                  width={colW - 8}
                  height={f.h}
                  rx="3"
                  fill={`url(#bar-${f.idx})`}
                  opacity={hoverIdx === null || isHover ? 1 : 0.35}
                  style={{ transition: 'opacity 200ms' }}
                />
                {/* Count label */}
                {isHover && (
                  <text
                    x={f.x}
                    y={f.barTop - 6}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#0F2E3D"
                  >
                    {f.data.count}
                  </text>
                )}
              </g>
            );
          })}

          {/* Month labels */}
          {data.map((d, i) => {
            const x = anchorX + i * colW + colW / 2;
            const m = formatMonth(d.month);
            const showLabel = i % 2 === 0 || hoverIdx === i; // every other month
            return (
              <g key={`lbl-${i}`}>
                {showLabel && (
                  <text
                    x={x}
                    y={baselineY + 14}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill={hoverIdx === i ? '#0F2E3D' : '#355B6F'}
                  >
                    {m.short}
                  </text>
                )}
                {i === 0 || (i > 0 && data[i - 1].month.split('-')[0] !== d.month.split('-')[0]) ? (
                  <text
                    x={x}
                    y={baselineY + 28}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#0F2E3D"
                    opacity="0.55"
                  >
                    {d.month.split('-')[0]}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* Tooltip / legend */}
        <div className="flex items-center justify-between gap-4 px-3 pb-1 pt-2">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold" style={{ color: '#355B6F' }}>
            <LegendDot color="#B42318" label="0–3 meses · crítico" />
            <LegendDot color="#D39A2B" label="3–6 meses · planear" />
            <LegendDot color="#355B6F" label="6–12 meses · estable" />
            <LegendDot color="#0F2E3D" label="12–24 meses · horizonte" />
          </div>
          {hoverIdx !== null && data[hoverIdx] && (
            <div
              className="rounded-lg px-3 py-1.5 text-xs"
              style={{ background: '#0F2E3D', color: '#FBF6EC' }}
            >
              <strong>{formatMonth(data[hoverIdx].month).full}:</strong>{' '}
              {data[hoverIdx].count} marca{data[hoverIdx].count !== 1 && 's'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}aa)`,
          boxShadow: `0 0 0 2px ${color}22`,
        }}
      />
      {label}
    </span>
  );
}

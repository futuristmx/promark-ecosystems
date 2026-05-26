'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export interface StatusDonutDatum {
  label: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  data: StatusDonutDatum[];
  title?: string;
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

export function StatusDonut({ data, title }: StatusDonutProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div>
      {title && (
        <h3
          className="mb-1 text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#355B6F' }}
        >
          {title}
        </h3>
      )}
      <div className="relative h-72">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: '#C8C4B9' }}>
            Sin datos
          </div>
        ) : (
          <>
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
                  cy="45%"
                  innerRadius={64}
                  outerRadius={96}
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
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
                  formatter={(value: string) => (
                    <span style={{ color: '#355B6F' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-12">
              <span className="text-4xl font-bold tracking-tight" style={{ color: '#1A1E23' }}>
                {total}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#C8C4B9' }}>
                Total marcas
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

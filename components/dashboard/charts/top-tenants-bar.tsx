'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface TopTenantsBarProps {
  data: Array<{ name: string; count: number; tenant_id: string }>;
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
  fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
};

export function TopTenantsBar({
  data,
  title = 'Top 5 clientes por marcas',
}: TopTenantsBarProps) {
  return (
    <div>
      <h3
        className="mb-1 text-xs font-semibold uppercase tracking-wider"
        style={{ color: '#355B6F' }}
      >
        {title}
      </h3>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: '#C8C4B9' }}>
            Sin datos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.slice(0, 5)}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <defs>
                <linearGradient id="bar-grad-tenants" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0F2E3D" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1C3F55" stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#C8C4B9' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#355B6F', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                formatter={(value) => [String(value), 'Marcas']}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#DDEAF2', fontSize: 12 }}
                cursor={{ fill: 'rgba(226, 222, 214, 0.3)', radius: 6 }}
              />
              <Bar
                dataKey="count"
                isAnimationActive={false}
                fill="url(#bar-grad-tenants)"
                radius={[0, 6, 6, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

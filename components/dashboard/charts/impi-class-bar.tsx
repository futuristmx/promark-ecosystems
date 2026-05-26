'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ImpiClassBarProps {
  data: Array<{ class_number: number; count: number }>;
  title?: string;
}

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#0B1F2A',
  border: 'none',
  borderRadius: 10,
  padding: '8px 14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  color: '#F1F5F9',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
};

export function ImpiClassBar({ data, title = 'Marcas por clase IMPI' }: ImpiClassBarProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: `Clase ${d.class_number}`,
  }));

  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
        {title}
      </h3>
      <div className="h-72">
        {formatted.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: '#C8C4B9' }}>
            Sin clases registradas
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formatted}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <defs>
                <linearGradient id="bar-grad-impi" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0F2E3D" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#355B6F" stopOpacity={1} />
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
                dataKey="label"
                tick={{ fontSize: 11, fill: '#355B6F', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                formatter={(value) => [String(value), 'Marcas']}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#E2E8F0', fontSize: 12 }}
                cursor={{ fill: 'rgba(226,222,214,0.25)', radius: 6 }}
              />
              <Bar
                dataKey="count"
                isAnimationActive={false}
                fill="url(#bar-grad-impi)"
                radius={[0, 6, 6, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

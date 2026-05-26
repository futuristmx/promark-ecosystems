'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface VigencyTimelineProps {
  data: Array<{ month: string; count: number }>;
  title?: string;
}

const ES_MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function formatMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  return `${ES_MONTHS_SHORT[monthIdx] ?? m} ${y.slice(2)}`;
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

export function VigencyTimeline({ data, title }: VigencyTimelineProps) {
  const formatted = data.map((d) => ({ ...d, label: formatMonth(d.month) }));
  const isEmpty = data.every((d) => d.count === 0);
  const maxCount = Math.max(...data.map((d) => d.count), 0);

  return (
    <div>
      {title && (
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
      )}
      <div className="h-72">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Sin vencimientos próximos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="bar-grad-vigency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1C3F55" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1C3F55" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              {/* Subtle horizontal reference lines instead of CartesianGrid */}
              {maxCount > 0 && (
                <>
                  <ReferenceLine y={Math.ceil(maxCount / 2)} stroke="#E2E8F0" strokeDasharray="4 4" />
                  <ReferenceLine y={maxCount} stroke="#E2E8F0" strokeDasharray="4 4" />
                </>
              )}
              <XAxis
                dataKey="label"
                interval={2}
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                formatter={(value) => [String(value), 'Vencimientos']}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#E2E8F0', fontSize: 12 }}
                cursor={{ fill: '#F1F5F9', radius: 4 }}
              />
              <Bar
                dataKey="count"
                isAnimationActive={false}
                fill="url(#bar-grad-vigency)"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

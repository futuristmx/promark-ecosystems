'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export function VigencyTimeline({ data, title }: VigencyTimelineProps) {
  const formatted = data.map((d) => ({ ...d, label: formatMonth(d.month) }));
  const isEmpty = data.every((d) => d.count === 0);

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-700">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="h-72">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Sin vencimientos próximos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                interval={1}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip
                formatter={(value) => [String(value), 'Vencimientos']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

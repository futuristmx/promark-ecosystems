'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface StatusDonutDatum {
  label: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  data: StatusDonutDatum[];
  title?: string;
}

export function StatusDonut({ data, title }: StatusDonutProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-700">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="relative h-72">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Sin datos
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [String(value), 'Marcas']}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-9">
              <span className="text-3xl font-bold text-slate-900">{total}</span>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Total
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

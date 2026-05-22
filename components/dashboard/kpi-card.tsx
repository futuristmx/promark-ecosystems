import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  delta?: { value: number; label: string };
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

const toneBorders: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'border-l-slate-300',
  warning: 'border-l-amber-500',
  danger: 'border-l-red-500',
  success: 'border-l-emerald-500',
};

const toneIconBg: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-600',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  success: 'bg-emerald-100 text-emerald-700',
};

export function KpiCard({
  label,
  value,
  icon,
  delta,
  tone = 'default',
}: KpiCardProps) {
  return (
    <Card className={cn('border-l-4', toneBorders[tone])}>
      <CardContent className="flex items-start justify-between gap-3 pt-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {delta && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                delta.value > 0 ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {delta.value > 0 ? '+' : ''}
              {delta.value}% {delta.label}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              toneIconBg[tone]
            )}
          >
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

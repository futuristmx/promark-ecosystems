import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: {
    text: string;
    tone?: 'positive' | 'negative' | 'neutral';
  };
  icon?: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  className?: string;
}

/**
 * KPI Card del design system. Para grids de métricas en dashboards.
 *
 * Layout: label uppercase pequeño → valor grande → delta opcional.
 * `tone` colorea el valor numérico para semaforización rápida.
 */
export function KpiCard({
  label,
  value,
  delta,
  icon,
  tone = 'default',
  className,
}: KpiCardProps) {
  const valueColor = {
    default: 'text-slate-900',
    warning: 'text-[#EA580C]',
    danger: 'text-[#DC2626]',
    success: 'text-[#16A34A]',
  }[tone];

  const deltaColor = {
    positive: 'text-[#16A34A]',
    negative: 'text-[#DC2626]',
    neutral: 'text-slate-500',
  }[delta?.tone ?? 'neutral'];

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/60 bg-[#EDEFF3] p-5 transition-colors hover:bg-[#E4E8EE]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          {label}
        </p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className={cn('mt-2 text-3xl font-bold tracking-tight', valueColor)}>
        {value}
      </p>
      {delta && (
        <p className={cn('mt-1 text-xs', deltaColor)}>{delta.text}</p>
      )}
    </div>
  );
}

interface KpiGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Grid responsive para KPI cards. 2 cols mobile, 3 tablet, 5 2xl.
 * Resuelve F11 del audit (labels truncadas en lg:grid-cols-5).
 */
export function KpiGrid({ children, className }: KpiGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-5',
        className
      )}
    >
      {children}
    </div>
  );
}

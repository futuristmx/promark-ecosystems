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

const VALUE_COLOR: Record<string, string> = {
  default: '#1A1E23',
  warning: '#D39A2B',
  danger: '#B42318',
  success: '#2F6B4F',
};

const DELTA_COLOR: Record<string, string> = {
  positive: '#2F6B4F',
  negative: '#B42318',
  neutral: '#355B6F',
};

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
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-colors',
        className
      )}
      style={{
        borderColor: '#E2DED6',
        background: '#F1EDE3',
      }}
    >
      <div className="flex items-start justify-between">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: '#355B6F' }}
        >
          {label}
        </p>
        {icon && <span style={{ color: '#C8C4B9' }}>{icon}</span>}
      </div>
      <p
        className="mt-2 text-3xl font-bold tracking-tight"
        style={{ color: VALUE_COLOR[tone] }}
      >
        {value}
      </p>
      {delta && (
        <p
          className="mt-1 text-xs"
          style={{ color: DELTA_COLOR[delta.tone ?? 'neutral'] }}
        >
          {delta.text}
        </p>
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

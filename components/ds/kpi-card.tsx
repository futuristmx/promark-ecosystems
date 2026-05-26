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
 * KPI Card premium — flat, sin borde visible, layout sofisticado.
 *
 * Diseño: label uppercase arriba-izq, icon arriba-derecho,
 * valor grande abajo-izq. Sin outline, fondo sutil.
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
      className={cn('rounded-xl p-6', className)}
      style={{
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
        className="mt-4 text-4xl font-bold tracking-tight"
        style={{ color: VALUE_COLOR[tone] }}
      >
        {value}
      </p>
      {delta && (
        <p
          className="mt-1.5 text-xs"
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
 * Grid responsive para KPI cards. 2 cols mobile, 3 tablet, 4 desktop.
 */
export function KpiGrid({ children, className }: KpiGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

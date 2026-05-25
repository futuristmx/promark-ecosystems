import { cn } from '@/lib/utils';

export type StatusTone =
  | 'active'
  | 'progress'
  | 'success'
  | 'warning'
  | 'error'
  | 'muted'
  | 'info';

interface StatusBadgeProps {
  tone?: StatusTone;
  label: string;
  /** Si true, muestra el dot del color del status antes del label */
  withDot?: boolean;
  className?: string;
}

/**
 * Badge de estado con tone semántico. Reemplaza usos sueltos de
 * <Badge variant="..."> que no respetaban la paleta del DS.
 */
export function StatusBadge({
  tone = 'muted',
  label,
  withDot = true,
  className,
}: StatusBadgeProps) {
  const toneStyles: Record<StatusTone, { bg: string; border: string; color: string }> = {
    active:   { bg: 'rgba(0, 102, 255, 0.08)',  border: 'rgba(0, 102, 255, 0.22)',  color: '#0066FF' },
    progress: { bg: 'rgba(44, 52, 69, 0.08)',   border: 'rgba(44, 52, 69, 0.22)',   color: '#2C3445' },
    success:  { bg: 'rgba(22, 163, 74, 0.08)',  border: 'rgba(22, 163, 74, 0.22)',  color: '#16A34A' },
    warning:  { bg: 'rgba(234, 88, 12, 0.08)',  border: 'rgba(234, 88, 12, 0.22)',  color: '#EA580C' },
    error:    { bg: 'rgba(220, 38, 38, 0.08)',  border: 'rgba(220, 38, 38, 0.22)',  color: '#DC2626' },
    info:     { bg: 'rgba(2, 132, 199, 0.08)',  border: 'rgba(2, 132, 199, 0.22)',  color: '#0284C7' },
    muted:    { bg: 'rgba(136, 146, 160, 0.10)', border: 'rgba(136, 146, 160, 0.22)', color: '#4E576A' },
  };

  const style = toneStyles[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        className
      )}
      style={{
        background: style.bg,
        borderColor: style.border,
        color: style.color,
      }}
    >
      {withDot && (
        <span
          className="size-1.5 rounded-full"
          style={{ background: style.color }}
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}

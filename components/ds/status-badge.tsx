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
    active:   { bg: 'rgba(28, 63, 85, 0.08)',    border: 'rgba(28, 63, 85, 0.22)',    color: '#1C3F55' },
    progress: { bg: 'rgba(15, 46, 61, 0.08)',     border: 'rgba(15, 46, 61, 0.22)',    color: '#0F2E3D' },
    success:  { bg: 'rgba(47, 107, 79, 0.08)',    border: 'rgba(47, 107, 79, 0.22)',   color: '#2F6B4F' },
    warning:  { bg: 'rgba(211, 154, 43, 0.08)',   border: 'rgba(211, 154, 43, 0.22)',  color: '#D39A2B' },
    error:    { bg: 'rgba(180, 35, 24, 0.08)',    border: 'rgba(180, 35, 24, 0.22)',   color: '#B42318' },
    info:     { bg: 'rgba(221, 234, 242, 0.50)',  border: 'rgba(28, 63, 85, 0.18)',    color: '#1C3F55' },
    muted:    { bg: 'rgba(200, 196, 185, 0.10)',  border: 'rgba(200, 196, 185, 0.22)', color: '#355B6F' },
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

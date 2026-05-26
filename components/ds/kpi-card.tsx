import Link from 'next/link';
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
  href?: string;
  className?: string;
}

/* ── Tone-based accent gradients (left bar + subtle bg wash) ── */
const TONE_ACCENT: Record<string, { bar: string; bg: string; value: string }> = {
  default: {
    bar: 'linear-gradient(180deg, #0F2E3D 0%, #1C3F55 60%, rgba(28,63,85,0.15) 100%)',
    bg: 'linear-gradient(135deg, rgba(15,46,61,0.04) 0%, rgba(28,63,85,0.02) 100%)',
    value: '#0F2E3D',
  },
  warning: {
    bar: 'linear-gradient(180deg, #D39A2B 0%, #E8B84A 60%, rgba(232,184,74,0.15) 100%)',
    bg: 'linear-gradient(135deg, rgba(211,154,43,0.06) 0%, rgba(232,184,74,0.02) 100%)',
    value: '#D39A2B',
  },
  danger: {
    bar: 'linear-gradient(180deg, #B42318 0%, #D04A3E 60%, rgba(208,74,62,0.15) 100%)',
    bg: 'linear-gradient(135deg, rgba(180,35,24,0.05) 0%, rgba(208,74,62,0.02) 100%)',
    value: '#B42318',
  },
  success: {
    bar: 'linear-gradient(180deg, #2F6B4F 0%, #3D8A66 60%, rgba(61,138,102,0.15) 100%)',
    bg: 'linear-gradient(135deg, rgba(47,107,79,0.05) 0%, rgba(61,138,102,0.02) 100%)',
    value: '#2F6B4F',
  },
};

const DELTA_COLOR: Record<string, string> = {
  positive: '#2F6B4F',
  negative: '#B42318',
  neutral: '#355B6F',
};

/**
 * KPI Card premium — Impact-inspired design.
 *
 * Layout: colored accent bar (left) + structured content.
 * Subtle gradient wash per tone. Large value bottom-left, label top, icon top-right.
 */
export function KpiCard({
  label,
  value,
  delta,
  icon,
  tone = 'default',
  href,
  className,
}: KpiCardProps) {
  const accent = TONE_ACCENT[tone] ?? TONE_ACCENT.default;

  const inner = (
    <div
      className={cn(
        'group relative flex w-full overflow-hidden rounded-xl transition-shadow',
        href && 'cursor-pointer hover:shadow-md',
        className
      )}
      style={{ background: '#F1EDE3' }}
    >
      {/* Accent bar */}
      <div
        className="w-1 shrink-0"
        style={{ background: accent.bar }}
      />
      {/* Content area with subtle gradient wash */}
      <div
        className="flex flex-1 flex-col justify-between p-5"
        style={{ backgroundImage: accent.bg }}
      >
        {/* Top row: label + icon */}
        <div className="flex items-start justify-between">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em] leading-tight"
            style={{ color: '#355B6F' }}
          >
            {label}
          </p>
          {icon && (
            <span
              className="flex size-8 items-center justify-center rounded-lg"
              style={{ background: 'rgba(200,196,185,0.25)', color: '#8FB6C7' }}
            >
              {icon}
            </span>
          )}
        </div>
        {/* Value */}
        <p
          className="mt-5 text-[2.5rem] font-extrabold leading-none tracking-tight"
          style={{ color: accent.value }}
        >
          {value}
        </p>
        {/* Delta / trend */}
        {delta && (
          <p
            className="mt-2 text-xs font-medium"
            style={{ color: DELTA_COLOR[delta.tone ?? 'neutral'] }}
          >
            {delta.text}
          </p>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

interface KpiGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Grid responsive para KPI cards. 2 cols mobile, 4 desktop.
 * Equal height cards via stretch.
 */
export function KpiGrid({ children, className }: KpiGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 xl:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { StatusTone } from './status-badge';

export interface TimelineEvent {
  id: string;
  /** ISO timestamp */
  timestamp: string;
  /** Short title del evento */
  title: string;
  /** Descripción / detalle */
  description?: string;
  /** Quién o qué causó el evento */
  actor?: string;
  /** Tono del dot (semáforo) */
  tone?: StatusTone;
  /** Icon opcional dentro del dot */
  icon?: React.ReactNode;
  /** Si el evento es clickeable, href de destino */
  href?: string;
  /** Etiqueta visible (eg "Marca", "Contrato") */
  category?: string;
}

interface DsTimelineProps {
  events: TimelineEvent[];
  /** Si está cargando, muestra skeleton */
  loading?: boolean;
  /** Mensaje cuando no hay eventos */
  emptyMessage?: string;
  className?: string;
}

const TONE_COLOR: Record<StatusTone, string> = {
  active: '#0066FF',
  progress: '#2C3445',
  success: '#16A34A',
  warning: '#EA580C',
  error: '#DC2626',
  info: '#0284C7',
  muted: '#8892A0',
};

/**
 * Timeline vertical premium para historiales.
 *
 * Cada evento es un nodo con:
 * - Dot izquierdo con tone color
 * - Línea conectora vertical
 * - Card derecha con title + description + actor + timestamp
 *
 * Apto para BrandHistory, ContractHistory, AuditLog, etc.
 * Si pasas `href`, toda la card se vuelve clickeable.
 */
export function DsTimeline({
  events,
  loading = false,
  emptyMessage = 'Sin actividad registrada.',
  className,
}: DsTimelineProps) {
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="size-2 mt-2 rounded-full bg-slate-300" />
            <div className="flex-1 h-16 animate-pulse rounded-xl bg-[#EDEFF3]" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-dashed border-slate-300/80 bg-white py-12 text-center text-sm text-slate-500',
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol className={cn('relative space-y-0', className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const dotColor = TONE_COLOR[event.tone ?? 'muted'];
        const content = (
          <div className="flex-1 rounded-xl border border-slate-200/60 bg-white px-4 py-3 transition-colors group-hover:border-slate-300 group-hover:bg-[#EDEFF3]/40">
            <div className="flex flex-wrap items-center gap-2">
              {event.category && (
                <span
                  className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    borderColor: `${dotColor}33`,
                    background: `${dotColor}10`,
                    color: dotColor,
                  }}
                >
                  {event.category}
                </span>
              )}
              <p className="text-sm font-semibold text-slate-900">
                {event.title}
              </p>
            </div>
            {event.description && (
              <p className="mt-1 text-xs text-slate-500">{event.description}</p>
            )}
            <p className="mt-1.5 text-[11px] text-slate-400">
              {formatRelativeTime(event.timestamp)}
              {event.actor && <> · {event.actor}</>}
            </p>
          </div>
        );

        return (
          <li
            key={event.id}
            className="group relative flex gap-4 pb-4 last:pb-0"
          >
            {/* Connector line */}
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[7px] top-5 h-full w-px bg-slate-200/80"
              />
            )}
            {/* Dot */}
            <span
              className="relative z-10 mt-2 flex size-4 shrink-0 items-center justify-center rounded-full"
              style={{ background: dotColor }}
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-white"
              />
              {event.icon && (
                <span className="absolute inset-0 flex items-center justify-center text-white">
                  {event.icon}
                </span>
              )}
            </span>
            {/* Content */}
            {event.href ? (
              <Link href={event.href} className="flex-1">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} día${days === 1 ? '' : 's'}`;
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

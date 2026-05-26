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
  active: '#1C3F55',
  progress: '#0F2E3D',
  success: '#2F6B4F',
  warning: '#D39A2B',
  error: '#B42318',
  info: '#1C3F55',
  muted: '#C8C4B9',
};

/**
 * Timeline vertical premium para historiales.
 *
 * Diseño compacto: dot + línea conectora + contenido inline.
 * Sin cards envolventes — info fluye directamente.
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
            <div className="size-2 mt-2 rounded-full" style={{ background: '#C8C4B9' }} />
            <div className="flex-1 h-10 animate-pulse rounded-lg" style={{ background: '#F1EDE3' }} />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed py-10 text-center text-sm',
          className
        )}
        style={{ borderColor: '#E2DED6', background: '#F1EDE3', color: '#355B6F' }}
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
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              {event.category && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    background: `${dotColor}14`,
                    color: dotColor,
                  }}
                >
                  {event.category}
                </span>
              )}
              <span className="text-sm font-medium" style={{ color: '#1A1E23' }}>
                {event.title}
              </span>
            </div>
            {event.description && (
              <p className="mt-0.5 text-xs" style={{ color: '#355B6F' }}>{event.description}</p>
            )}
            <p className="mt-1 text-[11px]" style={{ color: '#C8C4B9' }}>
              {formatRelativeTime(event.timestamp)}
              {event.actor && <> · {event.actor}</>}
            </p>
          </div>
        );

        return (
          <li
            key={event.id}
            className="group relative flex gap-3 pb-5 last:pb-0"
            style={!isLast ? { borderLeft: 'none' } : undefined}
          >
            {/* Connector line */}
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[5px] top-4 h-full w-px"
                style={{ background: '#E2DED6' }}
              />
            )}
            {/* Dot */}
            <span
              className="relative z-10 mt-1.5 flex size-3 shrink-0 items-center justify-center rounded-full"
              style={{ background: dotColor }}
            >
              <span aria-hidden className="size-1 rounded-full bg-white" />
            </span>
            {/* Content */}
            {event.href ? (
              <Link href={event.href} className="flex-1 hover:opacity-80 transition-opacity">
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

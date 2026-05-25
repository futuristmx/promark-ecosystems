import Link from 'next/link';
import { Tag, ScrollText, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BRAND_CHANGE_TYPE_LABELS } from '@/lib/i18n/status-labels';
import { CONTRACT_CHANGE_TYPE_LABELS } from '@/lib/i18n/status-labels';

interface ActivityEvent {
  id: string;
  timestamp: string;
  actorType: string;
  entityType: 'BRAND' | 'CONTRACT';
  entityId: string;
  entityName: string;
  action: string;
  summary: string | null;
  href: string;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Hace unos segundos';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} día${days === 1 ? '' : 's'}`;
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function actionLabel(entityType: string, action: string): string {
  if (entityType === 'BRAND') {
    return (
      BRAND_CHANGE_TYPE_LABELS[action] ?? action.toLowerCase().replace(/_/g, ' ')
    );
  }
  return (
    CONTRACT_CHANGE_TYPE_LABELS[action] ?? action.toLowerCase().replace(/_/g, ' ')
  );
}

export function ActivityList({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <Activity className="mb-3 size-8 text-slate-300" />
        <p className="text-sm text-slate-500">
          Sin actividad registrada en este rango.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <ul className="divide-y divide-slate-200">
        {events.map((event) => {
          const Icon = event.entityType === 'BRAND' ? Tag : ScrollText;
          return (
            <li key={event.id}>
              <Link
                href={event.href}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {event.entityType === 'BRAND' ? 'Marca' : 'Contrato'}
                    </Badge>
                    <span className="text-sm font-medium text-slate-900">
                      {actionLabel(event.entityType, event.action)}:
                    </span>
                    <span className="truncate text-sm text-blue-700">
                      {event.entityName}
                    </span>
                  </div>
                  {event.summary && (
                    <p className="mt-1 text-xs text-slate-500">
                      {event.summary}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatRelative(event.timestamp)} ·{' '}
                    {event.actorType === 'PROMARK' ? 'Promark' : 'Cliente'}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

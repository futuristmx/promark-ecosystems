import { DsTimeline, type TimelineEvent } from '@/components/ds';
import {
  BRAND_CHANGE_TYPE_LABELS,
  CONTRACT_CHANGE_TYPE_LABELS,
} from '@/lib/i18n/status-labels';

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

function actionLabel(entityType: string, action: string): string {
  if (entityType === 'BRAND') {
    return BRAND_CHANGE_TYPE_LABELS[action] ?? action.toLowerCase().replace(/_/g, ' ');
  }
  return CONTRACT_CHANGE_TYPE_LABELS[action] ?? action.toLowerCase().replace(/_/g, ' ');
}

function eventTone(action: string): TimelineEvent['tone'] {
  if (action === 'CREATED' || action === 'REGISTERED') return 'success';
  if (action === 'EXPIRED' || action === 'TERMINATED') return 'error';
  if (action === 'UPDATED' || action === 'STATUS_CHANGED') return 'active';
  if (action === 'RENEWED') return 'success';
  return 'muted';
}

export function ActivityList({ events }: { events: ActivityEvent[] }) {
  const timelineEvents: TimelineEvent[] = events.map((event) => ({
    id: event.id,
    timestamp: event.timestamp,
    title: `${actionLabel(event.entityType, event.action)}: ${event.entityName}`,
    description: event.summary ?? undefined,
    actor: event.actorType === 'PROMARK' ? 'Promark' : 'Cliente',
    category: event.entityType === 'BRAND' ? 'Marca' : 'Contrato',
    tone: eventTone(event.action),
    href: event.href,
  }));

  return (
    <DsTimeline
      events={timelineEvents}
      emptyMessage="Sin actividad registrada en este rango."
    />
  );
}

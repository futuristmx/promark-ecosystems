'use client';

import { DsTimeline, SectionHeader, type TimelineEvent } from '@/components/ds';

export interface ActivityItem {
  id: string;
  actorName: string;
  actionLabel: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  href: string;
  createdAt: string;
}

interface RecentActivityProps {
  items: ActivityItem[];
  title?: string;
  /** Hint visible al lado del título */
  hint?: string;
}

const ENTITY_LABEL: Record<string, string> = {
  BRAND: 'Marca',
  CONTRACT: 'Contrato',
  LICENSE: 'Licencia',
  DOCUMENT: 'Documento',
};

const ACTION_LABEL: Record<string, string> = {
  REGISTRATION: 'Registró',
  RENEWAL: 'Renovó',
  TRANSFER: 'Transfirió',
  OPPOSITION: 'Opuso',
  CANCELLATION: 'Canceló',
  STATUS_CHANGE: 'Cambió estado',
  MODIFICATION: 'Modificó',
  LITIGATION_START: 'Inició litigio',
  LITIGATION_END: 'Terminó litigio',
  ASSIGNMENT: 'Asignó',
  LICENSE_GRANT: 'Otorgó licencia',
  CREATED: 'Creó',
  UPDATED: 'Actualizó',
  TERMINATED: 'Terminó',
  RENEWED: 'Renovó',
  EXPIRED: 'Expiró',
  BRAND_LINKED: 'Vinculó marca',
  BRAND_UNLINKED: 'Desvinculó marca',
  LICENSE_DERIVED: 'Derivó licencia',
  DOCUMENT_ATTACHED: 'Adjuntó documento',
};

function actionTone(action: string): TimelineEvent['tone'] {
  if (action === 'CREATED' || action === 'REGISTRATION' || action === 'RENEWED' || action === 'RENEWAL') {
    return 'success';
  }
  if (action === 'EXPIRED' || action === 'TERMINATED' || action === 'CANCELLATION') {
    return 'error';
  }
  if (action === 'UPDATED' || action === 'MODIFICATION' || action === 'STATUS_CHANGE') {
    return 'active';
  }
  if (action === 'LITIGATION_START' || action === 'OPPOSITION') {
    return 'warning';
  }
  return 'muted';
}

export function RecentActivity({
  items,
  title = 'Actividad reciente',
  hint,
}: RecentActivityProps) {
  const timelineEvents: TimelineEvent[] = items.map((item) => ({
    id: item.id,
    timestamp: item.createdAt,
    title: `${ACTION_LABEL[item.actionLabel] ?? item.actionLabel}: ${item.entityLabel}`,
    actor: item.actorName,
    category: ENTITY_LABEL[item.entityType] ?? item.entityType,
    tone: actionTone(item.actionLabel),
    href: item.href,
  }));

  return (
    <div>
      <SectionHeader title={title} hint={hint} className="mt-0 mb-4" />
      <DsTimeline
        events={timelineEvents}
        emptyMessage="Sin actividad reciente."
      />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
}

const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' });

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
  return rtf.format(Math.round(diffMonth / 12), 'year');
}

const ENTITY_LABEL: Record<string, string> = {
  BRAND: 'Marca',
  CONTRACT: 'Contrato',
};

const ACTION_LABEL: Record<string, string> = {
  REGISTRATION: 'Registró',
  RENEWAL: 'Renovó',
  TRANSFER: 'Transfirió',
  OPPOSITION: 'Opuso',
  CANCELLATION: 'Canceló',
  STATUS_CHANGE: 'Actualizó estado',
  MODIFICATION: 'Modificó',
  LITIGATION_START: 'Inició litigio',
  LITIGATION_END: 'Terminó litigio',
  ASSIGNMENT: 'Asignó',
  LICENSE_GRANT: 'Otorgó licencia',
  CREATED: 'Creó',
  UPDATED: 'Actualizó',
  TERMINATED: 'Terminó',
  RENEWED: 'Renovó',
  BRAND_LINKED: 'Vinculó marca',
  BRAND_UNLINKED: 'Desvinculó marca',
  LICENSE_DERIVED: 'Derivó licencia',
  DOCUMENT_ATTACHED: 'Adjuntó documento',
};

export function RecentActivity({
  items,
  title = 'Actividad reciente',
}: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-700">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {items.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            Sin actividad reciente
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="px-6 py-3">
                <Link href={item.href} className="group block">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{item.actorName}</span>{' '}
                    <span className="text-slate-500">
                      {ACTION_LABEL[item.actionLabel] ?? item.actionLabel}
                    </span>{' '}
                    <span className="text-slate-400">
                      ({ENTITY_LABEL[item.entityType] ?? item.entityType})
                    </span>{' '}
                    <span className="font-medium text-blue-600 group-hover:underline">
                      {item.entityLabel}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {relativeTime(item.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

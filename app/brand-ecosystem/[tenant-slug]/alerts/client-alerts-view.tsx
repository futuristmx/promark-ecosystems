'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { ALERT_ENTITY_TYPE_LABELS } from '@/lib/i18n/status-labels';
import { useToast } from '@/components/ds';

interface ClientAlert {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  alert_type: string;
  expiry_date: string;
  status: string;
  /** Comentario configurado por Promark para este tipo de alerta. */
  comment?: string | null;
}

interface ClientAlertsViewProps {
  tenantId: string;
  alerts: ClientAlert[];
}

function daysDelta(expiry: string): number {
  return Math.ceil(
    (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function urgencyStyle(days: number) {
  if (days < 0)
    return {
      label: `Vencido hace ${Math.abs(days)} d`,
      bg: 'rgba(180,35,24,0.08)',
      color: '#B42318',
      border: 'rgba(180,35,24,0.2)',
    };
  if (days <= 30)
    return {
      label: days === 0 ? 'Vence hoy' : `Vence en ${days} d`,
      bg: 'rgba(180,35,24,0.08)',
      color: '#B42318',
      border: 'rgba(180,35,24,0.2)',
    };
  if (days <= 90)
    return {
      label: `Vence en ${days} d`,
      bg: 'rgba(211,154,43,0.1)',
      color: '#D39A2B',
      border: 'rgba(211,154,43,0.25)',
    };
  return {
    label: `Vence en ${days} d`,
    bg: 'rgba(143,182,199,0.12)',
    color: '#355B6F',
    border: 'rgba(143,182,199,0.3)',
  };
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  DISMISSED: { label: 'Descartado', bg: 'rgba(200,196,185,0.2)', color: '#355B6F' },
  RESOLVED: { label: 'Resuelto', bg: 'rgba(47,107,79,0.08)', color: '#2F6B4F' },
  SENT: { label: 'Enviado', bg: 'rgba(53,91,111,0.1)', color: '#355B6F' },
  PENDING: { label: 'Pendiente', bg: 'rgba(211,154,43,0.1)', color: '#D39A2B' },
};

/* ------- A5: dedup by entity_id + alert_type ------- */
function dedupAlerts(alerts: ClientAlert[]): Array<ClientAlert & { count: number }> {
  const map = new Map<string, ClientAlert & { count: number }>();
  for (const a of alerts) {
    const key = `${a.entity_id}-${a.alert_type}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      // mantener la fecha más próxima
      if (new Date(a.expiry_date) < new Date(existing.expiry_date)) {
        existing.expiry_date = a.expiry_date;
      }
    } else {
      map.set(key, { ...a, count: 1 });
    }
  }
  return Array.from(map.values());
}

export function ClientAlertsView({ tenantId, alerts: initial }: ClientAlertsViewProps) {
  const [alerts, setAlerts] = useState(initial);
  const toast = useToast();

  async function handleDismiss(alertId: string) {
    const res = await fetch(`/api/tenants/${tenantId}/alerts/${alertId}/dismiss`, {
      method: 'PUT',
    });
    if (res.ok) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'DISMISSED' } : a))
      );
      toast.success('Alerta descartada');
    } else {
      toast.error('No se pudo descartar', 'Intenta de nuevo.');
    }
  }

  const groups = useMemo(() => {
    const pending = dedupAlerts(alerts.filter((a) => a.status === 'PENDING'));
    const other = alerts.filter((a) => a.status !== 'PENDING');

    // B7: agrupar pendientes por urgencia
    const urgent: typeof pending = [];
    const upcoming: typeof pending = [];
    const informative: typeof pending = [];

    for (const a of pending) {
      const d = daysDelta(a.expiry_date);
      if (d <= 30) urgent.push(a);
      else if (d <= 90) upcoming.push(a);
      else informative.push(a);
    }

    return { urgent, upcoming, informative, other };
  }, [alerts]);

  if (alerts.length === 0) {
    return (
      <div
        className="rounded-2xl border py-16 text-center"
        style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
      >
        <AlertTriangle className="mx-auto h-8 w-8" style={{ color: '#C8C4B9' }} />
        <p className="mt-3 text-sm" style={{ color: '#355B6F' }}>
          No tienes alertas activas en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.urgent.length > 0 && (
        <UrgencySection
          title="Urgentes"
          subtitle="Vencen en 30 días o menos"
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="#B42318"
          alerts={groups.urgent}
          onDismiss={handleDismiss}
        />
      )}
      {groups.upcoming.length > 0 && (
        <UrgencySection
          title="Próximas"
          subtitle="Vencen entre 30 y 90 días"
          icon={<Clock className="h-4 w-4" />}
          accent="#D39A2B"
          alerts={groups.upcoming}
          onDismiss={handleDismiss}
        />
      )}
      {groups.informative.length > 0 && (
        <UrgencySection
          title="Informativas"
          subtitle="Vencen en más de 90 días"
          icon={<Calendar className="h-4 w-4" />}
          accent="#355B6F"
          alerts={groups.informative}
          onDismiss={handleDismiss}
        />
      )}

      {groups.other.length > 0 && (
        <div
          className="space-y-2 rounded-2xl border p-6"
          style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
        >
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
            Alertas pasadas
          </p>
          {groups.other.map((alert) => {
            const badge = STATUS_BADGE[alert.status] ?? STATUS_BADGE.PENDING;
            return (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-[rgba(226,222,214,0.35)]"
                style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
              >
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#0F2E3D' }}>{alert.entity_name}</p>
                  <p className="text-xs" style={{ color: '#355B6F' }}>{ALERT_ENTITY_TYPE_LABELS[alert.entity_type] ?? alert.entity_type}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UrgencySection({
  title,
  subtitle,
  icon,
  accent,
  alerts,
  onDismiss,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  alerts: Array<ClientAlert & { count: number }>;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}1f`, color: accent }}
        >
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
            {title}{' '}
            <span className="ml-1 text-xs font-medium" style={{ color: '#355B6F' }}>
              ({alerts.length})
            </span>
          </h3>
          <p className="text-[11px]" style={{ color: '#355B6F' }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => {
          const days = daysDelta(alert.expiry_date);
          const u = urgencyStyle(days);
          return (
            <div
              key={alert.id}
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-[rgba(226,222,214,0.35)]"
              style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
            >
              <span
                className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: u.bg, color: u.color, border: `1px solid ${u.border}` }}
              >
                {u.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0F2E3D' }}>
                    {alert.entity_name}
                  </p>
                  {alert.count > 1 && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: 'rgba(15,46,61,0.08)', color: '#0F2E3D' }}
                      title={`${alert.count} alertas idénticas agrupadas`}
                    >
                      ×{alert.count}
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: '#355B6F' }}>
                  {ALERT_ENTITY_TYPE_LABELS[alert.entity_type] ?? alert.entity_type}
                </p>
                {alert.comment && (
                  <p
                    className="mt-1.5 rounded-md px-2 py-1 text-[11px] italic"
                    style={{ background: 'rgba(211,154,43,0.08)', color: '#7a5d18' }}
                  >
                    💬 {alert.comment}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#F1EDE3]"
                style={{ borderColor: '#E2DED6', color: '#355B6F', background: '#FBF6EC' }}
              >
                Descartar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

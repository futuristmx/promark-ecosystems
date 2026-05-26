'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ALERT_ENTITY_TYPE_LABELS } from '@/lib/i18n/status-labels';

interface ClientAlert {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  alert_type: string;
  expiry_date: string;
  status: string;
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

function urgency(days: number): { label: string; bg: string; color: string; border: string } {
  if (days < 0) return { label: `Vencido hace ${Math.abs(days)} días`, bg: 'rgba(180,35,24,0.08)', color: '#B42318', border: 'rgba(180,35,24,0.2)' };
  if (days === 0) return { label: 'Vence hoy', bg: 'rgba(180,35,24,0.08)', color: '#B42318', border: 'rgba(180,35,24,0.2)' };
  if (days <= 30) return { label: `Vence en ${days} días`, bg: 'rgba(180,35,24,0.08)', color: '#B42318', border: 'rgba(180,35,24,0.2)' };
  if (days <= 90) return { label: `Vence en ${days} días`, bg: 'rgba(211,154,43,0.1)', color: '#D39A2B', border: 'rgba(211,154,43,0.25)' };
  return { label: `Vence en ${days} días`, bg: 'rgba(143,182,199,0.12)', color: '#355B6F', border: 'rgba(143,182,199,0.3)' };
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  DISMISSED: { label: 'Descartado', bg: 'rgba(200,196,185,0.2)', color: '#C8C4B9' },
  RESOLVED: { label: 'Resuelto', bg: 'rgba(47,107,79,0.08)', color: '#2F6B4F' },
  SENT: { label: 'Enviado', bg: 'rgba(53,91,111,0.1)', color: '#355B6F' },
  PENDING: { label: 'Pendiente', bg: 'rgba(211,154,43,0.1)', color: '#D39A2B' },
};

export function ClientAlertsView({ tenantId, alerts: initial }: ClientAlertsViewProps) {
  const [alerts, setAlerts] = useState(initial);

  async function handleDismiss(alertId: string) {
    const res = await fetch(`/api/tenants/${tenantId}/alerts/${alertId}/dismiss`, {
      method: 'PUT',
    });
    if (res.ok) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'DISMISSED' } : a))
      );
    }
  }

  const pending = alerts.filter((a) => a.status === 'PENDING');
  const other = alerts.filter((a) => a.status !== 'PENDING');

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
      {pending.length > 0 && (
        <div
          className="space-y-2 rounded-2xl border p-6"
          style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
        >
          {pending.map((alert) => {
            const days = daysDelta(alert.expiry_date);
            const u = urgency(days);
            return (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-xl border p-4 transition-colors"
                style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(226,222,214,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FBF6EC';
                }}
              >
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ background: u.bg, color: u.color, border: `1px solid ${u.border}` }}
                >
                  {u.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0F2E3D' }}>
                    {alert.entity_name}
                  </p>
                  <p className="text-xs" style={{ color: '#355B6F' }}>{ALERT_ENTITY_TYPE_LABELS[alert.entity_type] ?? alert.entity_type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDismiss(alert.id)}
                  className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ borderColor: '#E2DED6', color: '#355B6F', background: '#FBF6EC' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F1EDE3';
                    e.currentTarget.style.borderColor = '#C8C4B9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FBF6EC';
                    e.currentTarget.style.borderColor = '#E2DED6';
                  }}
                >
                  Descartar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {other.length > 0 && (
        <div
          className="space-y-2 rounded-2xl border p-6"
          style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
        >
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#C8C4B9' }}>
            Alertas pasadas
          </p>
          {other.map((alert) => {
            const badge = STATUS_BADGE[alert.status] ?? STATUS_BADGE.PENDING;
            return (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-xl border p-4 transition-colors"
                style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(226,222,214,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FBF6EC';
                }}
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

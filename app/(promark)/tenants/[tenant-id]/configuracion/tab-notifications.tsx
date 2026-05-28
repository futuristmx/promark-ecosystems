'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Clock } from 'lucide-react';
import { HelpTip } from '@/components/ds';
import {
  ClientAlertsConfigEditor,
  type ClientAlertsConfig,
} from './client-alerts-config';

interface Props {
  tenantId: string;
  initialNotifications: {
    notify_email: string;
    expiry_alert_days: number;
    email_alerts_enabled: boolean;
  };
  initialClientAlerts: ClientAlertsConfig;
}

export function NotificationsTab({ tenantId, initialNotifications, initialClientAlerts }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [clientAlerts, setClientAlerts] = useState<ClientAlertsConfig>(initialClientAlerts);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            notifications: {
              // Si el toggle está apagado, nunca enviamos email — guardamos null
              // explícito para evitar fugas si quedó un mail en el state local.
              notify_email: notifications.email_alerts_enabled
                ? (notifications.notify_email || null)
                : null,
              expiry_alert_days: notifications.expiry_alert_days,
              email_alerts_enabled: notifications.email_alerts_enabled,
            },
            client_alerts: clientAlerts,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Error al guardar.');
        return;
      }
      setSuccess('Configuración de notificaciones actualizada.');
      router.refresh();
    } catch {
      setError('Error de red.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave}>
      {error && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(180,35,24,0.06)', border: '1px solid rgba(180,35,24,0.15)', color: '#B42318' }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(47,107,79,0.08)', border: '1px solid rgba(47,107,79,0.2)', color: '#2F6B4F' }}
        >
          {success}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          {/* Visibilidad de alertas en el portal cliente */}
          <ClientAlertsConfigEditor
            value={clientAlerts}
            onChange={setClientAlerts}
          />

          {/* Email destinatario interno (a Promark, NO al cliente).
            Apagado por defecto por seguridad — el SUPERADMIN debe encender
            explícitamente el envío y registrar el destinatario. */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: notifications.email_alerts_enabled
                      ? 'rgba(47,107,79,0.1)'
                      : 'rgba(200,196,185,0.3)',
                    color: notifications.email_alerts_enabled ? '#2F6B4F' : '#C8C4B9',
                  }}
                >
                  <Mail className="size-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                      Email destinatario de alertas
                    </h3>
                    <HelpTip>
                      Por defecto apagado por seguridad. Enciende solo si
                      quieres que Promark reciba correos de las alertas
                      generadas. Independiente de las alertas mostradas en el
                      portal del cliente.
                    </HelpTip>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
                    {notifications.email_alerts_enabled
                      ? 'Las alertas se enviarán a la dirección configurada.'
                      : 'Sin envío de correos. Las alertas solo viven en la base de datos.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications.email_alerts_enabled}
                aria-label="Activar envío de alertas por email"
                onClick={() =>
                  setNotifications({
                    ...notifications,
                    email_alerts_enabled: !notifications.email_alerts_enabled,
                  })
                }
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none"
                style={{
                  background: notifications.email_alerts_enabled ? '#2F6B4F' : '#C8C4B9',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
                }}
              >
                <span
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
                  style={{
                    transform: notifications.email_alerts_enabled
                      ? 'translateX(22px)'
                      : 'translateX(2px)',
                  }}
                />
              </button>
            </div>

            {notifications.email_alerts_enabled && (
              <div className="mt-4">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                  Dirección de correo
                </label>
                <input
                  type="email"
                  value={notifications.notify_email}
                  onChange={(e) => setNotifications({ ...notifications, notify_email: e.target.value })}
                  placeholder="legal@tucliente.com"
                  className="w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
                  style={{ background: '#FBF6EC', borderColor: '#E2DED6', color: '#1A1E23' }}
                />
              </div>
            )}
          </div>

          {/* Días default de anticipación (lado interno) */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <Clock className="size-4" style={{ color: '#0F2E3D' }} />
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                Días de anticipación (interno)
              </h3>
              <HelpTip>
                Días por defecto para la generación interna de alertas en
                Promark. Los días específicos por tipo de alerta del cliente
                se configuran arriba.
              </HelpTip>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              Días por defecto para alertas internas. Cada tipo de alerta
              visible al cliente tiene su propio valor configurable arriba.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={365}
                value={notifications.expiry_alert_days}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    expiry_alert_days: Number(e.target.value) || 90,
                  })
                }
                className="w-24 rounded-xl border px-4 py-3 text-sm focus:outline-none"
                style={{ background: '#FBF6EC', borderColor: '#E2DED6', color: '#1A1E23' }}
              />
              <span className="text-sm" style={{ color: '#355B6F' }}>días antes del vencimiento</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl border p-6"
            style={{
              borderColor: '#E2DED6',
              background: 'linear-gradient(135deg, #F1EDE3 0%, #FBF6EC 100%)',
            }}
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Cómo funcionan las alertas
            </h4>
            <div className="mt-4 space-y-3 text-xs leading-relaxed" style={{ color: '#355B6F' }}>
              <p>
                El sistema revisa diariamente las fechas de vencimiento de
                marcas, contratos, licencias y documentos.
              </p>
              <p>
                <strong style={{ color: '#0F2E3D' }}>Portal cliente:</strong>{' '}
                el cliente ve solo los tipos de alerta marcados arriba.
                Nunca se le envía correo desde este panel.
              </p>
              <p>
                <strong style={{ color: '#0F2E3D' }}>Lado Promark:</strong>{' '}
                las alertas internas siempre se generan y, si hay email
                configurado, se envían por correo a Promark.
              </p>
              <p>
                Los comentarios (general y por tipo) aparecen junto a la
                alerta cuando el cliente la ve en su portal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="mt-10 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-6 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #D39A2B 0%, #E8B84A 100%)',
            color: '#0B1F2A',
            boxShadow: '0 4px 14px rgba(211,154,43,0.3)',
          }}
        >
          {saving ? 'Guardando…' : 'Guardar notificaciones'}
        </button>
      </div>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Clock } from 'lucide-react';

interface Props {
  tenantId: string;
  initialNotifications: {
    notify_email: string;
    expiry_alert_days: number;
  };
}

export function NotificationsTab({ tenantId, initialNotifications }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
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
              notify_email: notifications.notify_email || null,
              expiry_alert_days: notifications.expiry_alert_days,
            },
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
          {/* Email */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <Mail className="size-4" style={{ color: '#0F2E3D' }} />
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                Email destinatario de alertas
              </h3>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              Las alertas de vencimiento se envían a esta dirección. Si está vacío, las alertas
              se crean en la base de datos pero no se envían por email.
            </p>
            <input
              type="email"
              value={notifications.notify_email}
              onChange={(e) => setNotifications({ ...notifications, notify_email: e.target.value })}
              placeholder="legal@tucliente.com"
              className="mt-4 w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
              style={{ background: '#FBF6EC', borderColor: '#E2DED6', color: '#1A1E23' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#D39A2B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E2DED6';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Days */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <Clock className="size-4" style={{ color: '#0F2E3D' }} />
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                Días de anticipación
              </h3>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              Cuántos días antes del vencimiento se generan las alertas.
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
                className="w-24 rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
                style={{ background: '#FBF6EC', borderColor: '#E2DED6', color: '#1A1E23' }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#D39A2B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2DED6';
                  e.currentTarget.style.boxShadow = 'none';
                }}
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
                El sistema revisa diariamente las fechas de vencimiento de marcas y contratos.
              </p>
              <p>
                Cuando una marca está a{' '}
                <strong style={{ color: '#0F2E3D' }}>{notifications.expiry_alert_days} días</strong>{' '}
                de vencer, se crea una alerta visible en el panel del cliente.
              </p>
              <p>
                Si hay un email configurado, además se envía una notificación
                por correo con los detalles de la marca próxima a vencer.
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
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(211,154,43,0.4)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(211,154,43,0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {saving ? 'Guardando…' : 'Guardar notificaciones'}
        </button>
      </div>
    </form>
  );
}

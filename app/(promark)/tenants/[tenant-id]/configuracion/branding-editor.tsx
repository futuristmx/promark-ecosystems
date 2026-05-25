'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Tag, Bell, FileText, ExternalLink } from 'lucide-react';

interface BrandingState {
  primary_color: string;
  company_display_name: string;
  logo_url: string | null;
  favicon_url: string | null;
}

interface NotificationsState {
  notify_email: string;
  expiry_alert_days: number;
}

interface Props {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  initialBranding: BrandingState;
  initialNotifications: NotificationsState;
}

export function BrandingEditor({
  tenantId,
  tenantName,
  tenantSlug,
  initialBranding,
  initialNotifications,
}: Props) {
  const router = useRouter();
  const [branding, setBranding] = useState<BrandingState>(initialBranding);
  const [notifications, setNotifications] = useState<NotificationsState>(initialNotifications);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      setError('El logo no puede pesar más de 200 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // CLAUDE.md: base64 Data URL en JSONB (sin Supabase Storage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranding((b) => ({ ...b, logo_url: reader.result as string }));
      setError('');
    };
    reader.readAsDataURL(file);
  }

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
            branding,
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
      setSuccess('Configuración guardada. Nueva versión registrada.');
      router.refresh();
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  const displayInitial =
    (branding.company_display_name || tenantName).slice(0, 1).toUpperCase() || 'P';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Branding</h2>
          <p className="mt-1 text-xs text-slate-500">
            Cómo se ve el portal del cliente.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombre del portal
              </label>
              <input
                type="text"
                value={branding.company_display_name}
                onChange={(e) =>
                  setBranding({ ...branding, company_display_name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Aparece en el encabezado del portal del cliente.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Color primario
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) =>
                    setBranding({ ...branding, primary_color: e.target.value })
                  }
                  className="h-10 w-16 cursor-pointer rounded-md border border-slate-300"
                />
                <input
                  type="text"
                  value={branding.primary_color}
                  onChange={(e) =>
                    setBranding({ ...branding, primary_color: e.target.value })
                  }
                  pattern="#[0-9a-fA-F]{6}"
                  className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Logo del portal{' '}
                <span className="font-normal text-slate-400">(opcional, máx 200 KB)</span>
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoChange}
                className="text-sm text-slate-600"
              />
              {branding.logo_url && (
                <div className="mt-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={branding.logo_url}
                    alt="Logo actual"
                    className="h-10 w-10 rounded-md border border-slate-200 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setBranding({ ...branding, logo_url: null })}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Quitar logo
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Notificaciones</h2>
          <p className="mt-1 text-xs text-slate-500">
            Configuración del cron de alertas y destinatarios.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email destinatario de alertas
              </label>
              <input
                type="email"
                value={notifications.notify_email}
                onChange={(e) =>
                  setNotifications({ ...notifications, notify_email: e.target.value })
                }
                placeholder="legal@tucliente.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Si está vacío, las alertas se crean en DB pero no se envían por email.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Días de anticipación para alertas
              </label>
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
                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* Live preview */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">
            Vista previa del portal
          </h2>
          <a
            href={`/brand-ecosystem/${tenantSlug}/panel`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            Abrir portal
            <ExternalLink className="size-3" />
          </a>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Mini sidebar preview */}
          <div className="flex">
            <aside className="flex w-44 flex-col gap-3 border-r border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                {branding.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.logo_url}
                    alt=""
                    className="h-7 w-7 rounded-md object-contain"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    {displayInitial}
                  </div>
                )}
                <span className="truncate text-xs font-semibold">
                  {branding.company_display_name || tenantName}
                </span>
              </div>
              {[
                { Icon: LayoutDashboard, label: 'Panel', active: true },
                { Icon: Tag, label: 'Marcas', active: false },
                { Icon: Bell, label: 'Alertas', active: false },
                { Icon: FileText, label: 'Documentos', active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs"
                  style={
                    item.active
                      ? {
                          backgroundColor: `${branding.primary_color}15`,
                          color: branding.primary_color,
                        }
                      : { color: '#64748b' }
                  }
                >
                  <item.Icon className="size-3.5" />
                  {item.label}
                </div>
              ))}
            </aside>
            <div className="flex-1 bg-slate-50 p-4">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: branding.primary_color }}
              >
                Panel
              </p>
              <h3 className="mt-1 text-sm font-bold text-slate-900">
                {branding.company_display_name || tenantName}
              </h3>
              <div className="mt-3 inline-block rounded-md px-2 py-1 text-[10px] font-medium text-white"
                style={{ backgroundColor: branding.primary_color }}>
                Indicador
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          La vista previa es una aproximación. El portal real respeta exactamente
          el color primario y logo configurados.
        </p>
      </div>
    </div>
  );
}

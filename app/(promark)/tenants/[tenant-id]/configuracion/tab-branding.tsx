'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, LayoutDashboard, Tag, Bell, FileText } from 'lucide-react';
import { HelpTip } from '@/components/ds';

interface BrandingState {
  primary_color: string;
  company_display_name: string;
  logo_url: string | null;
  favicon_url: string | null;
}

interface Props {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  initialBranding: BrandingState;
}

const INPUT_STYLE: React.CSSProperties = {
  background: '#FBF6EC',
  borderColor: '#E2DED6',
  color: '#1A1E23',
};

function focusRing(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#D39A2B';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.12)';
}
function blurRing(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#E2DED6';
  e.currentTarget.style.boxShadow = 'none';
}

export function BrandingTab({ tenantId, tenantName, tenantSlug, initialBranding }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [branding, setBranding] = useState<BrandingState>(initialBranding);
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
        body: JSON.stringify({ config: { branding } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Error al guardar.');
        return;
      }
      setSuccess('Branding actualizado correctamente.');
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
    <form onSubmit={handleSave}>
      {/* Alerts */}
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
        {/* Form - 3 cols */}
        <div className="space-y-8 lg:col-span-3">
          {/* Company name */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                Nombre del portal
              </h3>
              <HelpTip>
                Nombre comercial que aparece en el header del portal del cliente,
                el login y los correos. Por defecto usa el nombre fiscal del cliente.
              </HelpTip>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              Aparece en el encabezado y sidebar del portal del cliente.
            </p>
            <input
              type="text"
              value={branding.company_display_name}
              onChange={(e) => setBranding({ ...branding, company_display_name: e.target.value })}
              className="mt-4 w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
              style={INPUT_STYLE}
              onFocus={focusRing}
              onBlur={blurRing}
            />
          </div>

          {/* Color */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                Color primario
              </h3>
              <HelpTip>
                Color de acento del portal del cliente: stripe de selección en
                el sidebar, botones primarios, foco de inputs y chips de marca.
              </HelpTip>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              Define el acento visual del portal del cliente.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2"
                style={{ borderColor: '#E2DED6' }}
              >
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  className="absolute -inset-2 h-16 w-16 cursor-pointer border-0"
                />
              </div>
              <input
                type="text"
                value={branding.primary_color}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                pattern="#[0-9a-fA-F]{6}"
                className="w-32 rounded-xl border px-4 py-3 font-mono text-sm transition-all focus:outline-none"
                style={INPUT_STYLE}
                onFocus={focusRing}
                onBlur={blurRing}
              />
              {/* Color preview chips */}
              <div className="flex gap-2">
                <span
                  className="h-8 w-8 rounded-lg"
                  style={{ background: branding.primary_color, opacity: 0.2 }}
                />
                <span
                  className="h-8 w-8 rounded-lg"
                  style={{ background: branding.primary_color, opacity: 0.5 }}
                />
                <span
                  className="h-8 w-8 rounded-lg"
                  style={{ background: branding.primary_color }}
                />
              </div>
            </div>
          </div>

          {/* Logo upload */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                Logo del portal
              </h3>
              <HelpTip>
                Logo que aparece en el header y footer del sidebar del portal,
                en el PDF exportado y en el header del login. Recomendado: PNG
                con fondo transparente, alto 80px.
              </HelpTip>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              PNG, JPG o SVG. Máximo 200 KB. Se muestra en el sidebar del portal.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleLogoChange}
              className="hidden"
            />

            {branding.logo_url ? (
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 p-2"
                  style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={branding.logo_url}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ background: 'rgba(15,46,61,0.08)', color: '#0F2E3D' }}
                  >
                    Cambiar logo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranding({ ...branding, logo_url: null })}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ color: '#B42318' }}
                  >
                    <X className="size-3" />
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 transition-colors"
                style={{ borderColor: '#E2DED6', color: '#355B6F' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D39A2B';
                  e.currentTarget.style.background = 'rgba(211,154,43,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2DED6';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Upload className="size-6" style={{ color: '#C8C4B9' }} />
                <span className="text-sm font-medium">
                  Haz clic para subir un logo
                </span>
                <span className="text-xs" style={{ color: '#C8C4B9' }}>
                  PNG, JPG o SVG · máx 200 KB
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Preview - 2 cols */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <h4
              className="mb-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#355B6F' }}
            >
              Vista previa del portal
            </h4>
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                borderColor: '#E2DED6',
                boxShadow: '0 8px 30px rgba(15,46,61,0.08)',
              }}
            >
              {/* Mini sidebar */}
              <div className="flex">
                <aside
                  className="flex w-44 flex-col gap-2 border-r p-3"
                  style={{
                    borderColor: '#E2DED6',
                    background: '#F1EDE3',
                  }}
                >
                  <div
                    className="flex items-center gap-2 border-b pb-3"
                    style={{ borderColor: '#E2DED6' }}
                  >
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
                    <span
                      className="truncate text-xs font-semibold"
                      style={{ color: '#1A1E23' }}
                    >
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
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
                      style={
                        item.active
                          ? {
                              backgroundColor: `${branding.primary_color}15`,
                              color: branding.primary_color,
                              fontWeight: 600,
                            }
                          : { color: '#355B6F' }
                      }
                    >
                      <item.Icon className="size-3.5" />
                      {item.label}
                    </div>
                  ))}
                </aside>
                <div className="flex-1 p-4" style={{ background: '#FBF6EC' }}>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: branding.primary_color }}
                  >
                    Panel
                  </p>
                  <h3 className="mt-1 text-sm font-bold" style={{ color: '#1A1E23' }}>
                    {branding.company_display_name || tenantName}
                  </h3>
                  <div
                    className="mt-3 inline-block rounded-md px-2.5 py-1 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    Indicador
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px]" style={{ color: '#C8C4B9' }}>
              Vista aproximada. El portal real usa exactamente estos valores.
            </p>

            <p className="mt-2 text-[11px]" style={{ color: '#355B6F' }}>
              URL del portal:{' '}
              <code
                className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                style={{ background: 'rgba(15,46,61,0.06)' }}
              >
                /brand-ecosystem/{tenantSlug}
              </code>
            </p>
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
          {saving ? 'Guardando…' : 'Guardar branding'}
        </button>
      </div>
    </form>
  );
}

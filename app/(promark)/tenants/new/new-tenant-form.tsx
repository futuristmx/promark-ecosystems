'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, X, Image as ImageIcon, FileSpreadsheet,
  Paintbrush, Link2, Bell, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';

/* ─── Types ─── */
interface BrandingState {
  primary_color: string;
  company_display_name: string;
  logo_url: string | null;
  favicon_url: string | null;
}

interface NotificationsState {
  expiry_alert_days: number;
  notify_email: string;
}

interface FeaturesState {
  show_brand_history: boolean;
  show_contracts: boolean;
  show_graph_view: boolean;
  show_documents: boolean;
  allow_document_download: boolean;
}

/* ─── Shared styles ─── */
const CARD_STYLE: React.CSSProperties = { borderColor: '#E2DED6', background: '#F1EDE3' };
const INPUT_STYLE: React.CSSProperties = { background: '#FBF6EC', borderColor: '#E2DED6', color: '#1A1E23' };

function focusRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#D39A2B';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.12)';
}
function blurRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#E2DED6';
  e.currentTarget.style.boxShadow = 'none';
}

/* ─── Drag & Drop Zone ─── */
function DropZone({
  accept,
  maxSizeKb,
  icon,
  label,
  hint,
  file,
  preview,
  onFile,
  onClear,
}: {
  accept: string;
  maxSizeKb: number;
  icon: React.ReactNode;
  label: string;
  hint: string;
  file: File | null;
  preview?: string | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  if (file || preview) {
    return (
      <div className="mt-4 flex items-center gap-4">
        {preview ? (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 p-2"
            style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="h-full w-full object-contain" />
          </div>
        ) : (
          <div
            className="flex h-16 items-center gap-3 rounded-2xl border px-4"
            style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
          >
            <FileSpreadsheet className="size-5 shrink-0" style={{ color: '#2F6B4F' }} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" style={{ color: '#0F2E3D' }}>
                {file?.name}
              </p>
              <p className="text-xs" style={{ color: '#8FB6C7' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: 'rgba(15,46,61,0.08)', color: '#0F2E3D' }}
          >
            Cambiar
          </button>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ color: '#B42318' }}
          >
            <X className="size-3" /> Quitar
          </button>
        </div>
        <input ref={ref} type="file" accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} className="hidden" />
      </div>
    );
  }

  return (
    <>
      <input ref={ref} type="file" accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} className="hidden" />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 transition-all"
        style={{
          borderColor: dragging ? '#D39A2B' : '#E2DED6',
          background: dragging ? 'rgba(211,154,43,0.04)' : 'transparent',
          color: '#355B6F',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D39A2B'; e.currentTarget.style.background = 'rgba(211,154,43,0.04)'; }}
        onMouseLeave={(e) => { if (!dragging) { e.currentTarget.style.borderColor = '#E2DED6'; e.currentTarget.style.background = 'transparent'; } }}
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs" style={{ color: '#C8C4B9' }}>{hint}</span>
      </button>
    </>
  );
}

/* ─── Toggle switch ─── */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors" style={{ background: checked ? 'rgba(47,107,79,0.06)' : 'transparent' }}>
      <span className="text-sm" style={{ color: '#1A1E23' }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ background: checked ? '#2F6B4F' : '#C8C4B9' }}
      >
        <span
          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </button>
    </label>
  );
}

/* ─── Main form ─── */
export function NewTenantForm() {
  const router = useRouter();

  // Core
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  // Branding
  const [branding, setBranding] = useState<BrandingState>({
    primary_color: '#D39A2B',
    company_display_name: '',
    logo_url: null,
    favicon_url: null,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationsState>({
    expiry_alert_days: 90,
    notify_email: '',
  });

  // Features
  const [features, setFeatures] = useState<FeaturesState>({
    show_brand_history: true,
    show_contracts: true,
    show_graph_view: true,
    show_documents: true,
    allow_document_download: false,
  });

  // CSV master
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvProcessing, setCsvProcessing] = useState(false);
  const [csvResult, setCsvResult] = useState<{ created?: number; errors?: string[] } | null>(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync display name with name
  const effectiveName = branding.company_display_name || name;

  function handleLogoFile(file: File) {
    if (file.size > 500 * 1024) {
      setError('El logo no puede pesar más de 500 KB.');
      return;
    }
    setLogoFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setBranding((b) => ({ ...b, logo_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function handleCsvFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Solo se aceptan archivos .csv');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El CSV no puede pesar más de 5 MB.');
      return;
    }
    setCsvFile(file);
    setCsvResult(null);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create tenant
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          config: {
            branding: {
              primary_color: branding.primary_color,
              company_display_name: (branding.company_display_name || name).trim(),
              logo_url: branding.logo_url,
              favicon_url: branding.favicon_url,
            },
            features,
            notifications: {
              expiry_alert_days: notifications.expiry_alert_days,
              notify_email: notifications.notify_email || null,
            },
            localization: { language: 'es', timezone: 'America/Mexico_City' },
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Error al crear el cliente.');
        setLoading(false);
        return;
      }

      const { tenant } = await res.json();

      // 2. If CSV file, import it
      if (csvFile) {
        setCsvProcessing(true);
        try {
          const formData = new FormData();
          formData.append('file', csvFile);
          const csvRes = await fetch(`/api/tenants/${tenant.id}/portfolio/import-master`, {
            method: 'POST',
            body: formData,
          });
          if (csvRes.ok) {
            const result = await csvRes.json();
            setCsvResult(result);
          }
        } catch {
          // Non-blocking — tenant created successfully
        } finally {
          setCsvProcessing(false);
        }
      }

      router.push(`/tenants/${tenant.id}/panel`);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const displayInitial = (effectiveName || 'P').slice(0, 1).toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error alert */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(180,35,24,0.06)', border: '1px solid rgba(180,35,24,0.15)', color: '#B42318' }}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ─── SECTION 1: Identidad ─── */}
      <div className="rounded-2xl border p-6" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(15,46,61,0.08)' }}>
            <Paintbrush className="size-3.5" style={{ color: '#0F2E3D' }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>Identidad del cliente</h3>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Form fields */}
          <div className="space-y-5 lg:col-span-3">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#0F2E3D' }}>
                Razón social <span style={{ color: '#B42318' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Grupo Industrial S.A. de C.V."
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
                style={INPUT_STYLE}
                onFocus={focusRing}
                onBlur={blurRing}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#0F2E3D' }}>
                Slug del portal <span className="text-xs font-normal" style={{ color: '#C8C4B9' }}>(opcional)</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="Se autogenera del nombre"
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
                style={INPUT_STYLE}
                onFocus={focusRing}
                onBlur={blurRing}
              />
              <p className="mt-1.5 text-xs" style={{ color: '#8FB6C7' }}>
                URL: /brand-ecosystem/<strong style={{ color: '#355B6F' }}>{slug || 'auto'}</strong>/...
              </p>
            </div>

            {/* Display name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#0F2E3D' }}>
                Nombre en portal <span className="text-xs font-normal" style={{ color: '#C8C4B9' }}>(opcional)</span>
              </label>
              <input
                type="text"
                value={branding.company_display_name}
                onChange={(e) => setBranding({ ...branding, company_display_name: e.target.value })}
                placeholder={name || 'Igual a razón social'}
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
                style={INPUT_STYLE}
                onFocus={focusRing}
                onBlur={blurRing}
              />
            </div>

            {/* Color */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#0F2E3D' }}>
                Color primario
              </label>
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2" style={{ borderColor: '#E2DED6' }}>
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
                <div className="flex gap-2">
                  <span className="h-8 w-8 rounded-lg" style={{ background: branding.primary_color, opacity: 0.2 }} />
                  <span className="h-8 w-8 rounded-lg" style={{ background: branding.primary_color, opacity: 0.5 }} />
                  <span className="h-8 w-8 rounded-lg" style={{ background: branding.primary_color }} />
                </div>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="lg:col-span-2">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#8FB6C7' }}>
              Vista previa
            </p>
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: '#E2DED6', boxShadow: '0 8px 30px rgba(15,46,61,0.08)' }}>
              <div className="flex">
                <aside className="flex w-36 flex-col gap-1.5 border-r p-2.5" style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}>
                  <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: '#E2DED6' }}>
                    {branding.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={branding.logo_url} alt="" className="h-6 w-6 rounded object-contain" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white" style={{ backgroundColor: branding.primary_color }}>
                        {displayInitial}
                      </div>
                    )}
                    <span className="truncate text-[10px] font-semibold" style={{ color: '#1A1E23' }}>
                      {effectiveName || 'Cliente'}
                    </span>
                  </div>
                  {['Panel', 'Marcas', 'Alertas'].map((item, i) => (
                    <div
                      key={item}
                      className="rounded-md px-2 py-1 text-[10px]"
                      style={i === 0 ? { backgroundColor: `${branding.primary_color}15`, color: branding.primary_color, fontWeight: 600 } : { color: '#355B6F' }}
                    >
                      {item}
                    </div>
                  ))}
                </aside>
                <div className="flex-1 p-3" style={{ background: '#FBF6EC' }}>
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: branding.primary_color }}>Panel</p>
                  <h3 className="mt-0.5 text-xs font-bold" style={{ color: '#1A1E23' }}>{effectiveName || 'Cliente'}</h3>
                  <div className="mt-2 inline-block rounded px-2 py-0.5 text-[9px] font-semibold text-white" style={{ backgroundColor: branding.primary_color }}>
                    Indicador
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: Logo ─── */}
      <div className="rounded-2xl border p-6" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(15,46,61,0.08)' }}>
            <ImageIcon className="size-3.5" style={{ color: '#0F2E3D' }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>Logo del cliente</h3>
        </div>
        <p className="text-xs" style={{ color: '#355B6F' }}>
          Se muestra en el sidebar del portal. PNG, JPG o SVG, máximo 500 KB.
        </p>
        <DropZone
          accept="image/png,image/jpeg,image/svg+xml"
          maxSizeKb={500}
          icon={<Upload className="size-6" style={{ color: '#C8C4B9' }} />}
          label="Arrastra el logo aquí o haz clic para seleccionar"
          hint="PNG, JPG o SVG · máx 500 KB"
          file={logoFile}
          preview={branding.logo_url}
          onFile={handleLogoFile}
          onClear={() => { setLogoFile(null); setBranding((b) => ({ ...b, logo_url: null })); }}
        />
      </div>

      {/* ─── SECTION 3: CSV Master ─── */}
      <div className="rounded-2xl border p-6" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(47,107,79,0.08)' }}>
            <FileSpreadsheet className="size-3.5" style={{ color: '#2F6B4F' }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>Carga masiva inicial</h3>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'rgba(211,154,43,0.1)', color: '#D39A2B' }}>Opcional</span>
        </div>
        <p className="text-xs" style={{ color: '#355B6F' }}>
          Sube un CSV con la plantilla master para importar holdings, empresas, marcas, titulares, contratos y licencias de una sola vez.
          Se procesará automáticamente después de crear el cliente.
        </p>

        <DropZone
          accept=".csv,text/csv"
          maxSizeKb={5120}
          icon={<FileSpreadsheet className="size-6" style={{ color: '#C8C4B9' }} />}
          label="Arrastra el CSV master aquí o haz clic"
          hint="Formato .csv · máx 5 MB · Descarga la plantilla desde Portafolio"
          file={csvFile}
          onFile={handleCsvFile}
          onClear={() => { setCsvFile(null); setCsvResult(null); }}
        />

        {csvProcessing && (
          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#355B6F' }}>
            <Loader2 className="size-3.5 animate-spin" /> Procesando CSV...
          </div>
        )}
        {csvResult && (
          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#2F6B4F' }}>
            <CheckCircle2 className="size-3.5" /> {csvResult.created ?? 0} registros importados
            {csvResult.errors && csvResult.errors.length > 0 && (
              <span style={{ color: '#B42318' }}> · {csvResult.errors.length} errores</span>
            )}
          </div>
        )}

        {/* Template hint */}
        <div className="mt-4 rounded-xl px-4 py-3" style={{ background: 'rgba(221,234,242,0.3)', border: '1px solid rgba(28,63,85,0.1)' }}>
          <p className="text-[11px] font-medium" style={{ color: '#1C3F55' }}>
            Columnas esperadas del CSV master:
          </p>
          <p className="mt-1 font-mono text-[10px]" style={{ color: '#355B6F' }}>
            holding, empresa, marca, tipo_marca, estado_legal, no_registro, fecha_vencimiento, titular, logo_url, clase_impi, contrato_titulo, contrato_tipo, licencia_tipo, licenciatario
          </p>
        </div>
      </div>

      {/* ─── SECTION 4: Advanced config (collapsed) ─── */}
      <div className="rounded-2xl border" style={CARD_STYLE}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between p-6 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(53,91,111,0.08)' }}>
              <Bell className="size-3.5" style={{ color: '#355B6F' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>Configuración avanzada</h3>
              <p className="text-xs" style={{ color: '#8FB6C7' }}>Notificaciones, módulos del portal y permisos</p>
            </div>
          </div>
          {showAdvanced ? <ChevronUp className="size-5" style={{ color: '#C8C4B9' }} /> : <ChevronDown className="size-5" style={{ color: '#C8C4B9' }} />}
        </button>

        {showAdvanced && (
          <div className="space-y-6 border-t px-6 pb-6 pt-5" style={{ borderColor: '#E2DED6' }}>
            {/* Notifications */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                Notificaciones
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: '#0F2E3D' }}>
                    Días antes de expiración
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={notifications.expiry_alert_days}
                    onChange={(e) => setNotifications({ ...notifications, expiry_alert_days: Number(e.target.value) })}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none"
                    style={INPUT_STYLE}
                    onFocus={focusRing as never}
                    onBlur={blurRing as never}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: '#0F2E3D' }}>
                    Email de notificación
                  </label>
                  <input
                    type="email"
                    value={notifications.notify_email}
                    onChange={(e) => setNotifications({ ...notifications, notify_email: e.target.value })}
                    placeholder="admin@empresa.com"
                    className="w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none"
                    style={INPUT_STYLE}
                    onFocus={focusRing as never}
                    onBlur={blurRing as never}
                  />
                </div>
              </div>
            </div>

            {/* Features toggles */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                Módulos del portal
              </p>
              <div className="space-y-1 rounded-xl border p-2" style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}>
                <Toggle checked={features.show_contracts} onChange={(v) => setFeatures({ ...features, show_contracts: v })} label="Contratos" />
                <Toggle checked={features.show_documents} onChange={(v) => setFeatures({ ...features, show_documents: v })} label="Documentos" />
                <Toggle checked={features.show_brand_history} onChange={(v) => setFeatures({ ...features, show_brand_history: v })} label="Historial de marca" />
                <Toggle checked={features.show_graph_view} onChange={(v) => setFeatures({ ...features, show_graph_view: v })} label="Vista de grafo" />
                <Toggle checked={features.allow_document_download} onChange={(v) => setFeatures({ ...features, allow_document_download: v })} label="Permitir descarga de documentos" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Actions ─── */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs" style={{ color: '#C8C4B9' }}>
          Todo se puede editar después en Configuración.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/tenants')}
            className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors"
            style={{ borderColor: '#E2DED6', color: '#355B6F' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E2DED6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D39A2B 0%, #E8B84A 100%)',
              color: '#0B1F2A',
              boxShadow: '0 4px 14px rgba(211,154,43,0.3)',
            }}
            onMouseEnter={(e) => {
              if (!loading) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(211,154,43,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(211,154,43,0.3)'; e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Creando…</span>
            ) : (
              'Crear cliente'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

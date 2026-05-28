'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { BRAND_TYPE_LABELS, BRAND_TYPE_ORDER } from '@/lib/i18n/status-labels';
import { useToast } from '@/components/ds';

interface DownloadsViewProps {
  tenantSlug: string;
  companies: Array<{ id: string; name: string }>;
  availableClasses: number[];
  brandsCount: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'APPLIED', label: 'Solicitada' },
  { value: 'PUBLISHED', label: 'Publicada' },
  { value: 'REGISTERED', label: 'Registrada' },
  { value: 'RENEWED', label: 'Renovada' },
  { value: 'EXPIRED', label: 'Expirada' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'OPPOSED', label: 'Opuesta' },
  { value: 'IN_LITIGATION', label: 'En litigio' },
];

export function DownloadsView({
  tenantSlug,
  companies,
  availableClasses,
  brandsCount,
}: DownloadsViewProps) {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [classNum, setClassNum] = useState('');
  const [company, setCompany] = useState('');
  const [downloading, setDownloading] = useState<'xlsx' | 'pdf' | null>(null);

  const filtersActive = !!(status || type || classNum || company);

  async function handleDownload(format: 'xlsx' | 'pdf') {
    setDownloading(format);
    try {
      const params = new URLSearchParams({ format });
      if (status) params.set('status', status);
      if (type) params.set('type', type);
      if (classNum) params.set('class', classNum);
      if (company) params.set('company', company);

      const res = await fetch(
        `/api/client/${tenantSlug}/brands/export?${params.toString()}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        // Surfaceamos el error real del servidor para diagnosticar.
        let detail = `status ${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) detail = data.error;
        } catch {
          /* respuesta no era JSON; quedarse con el status */
        }
        toast.error('No se pudo generar la descarga', detail);
        return;
      }
      // El endpoint también puede devolver 200 JSON cuando no hay marcas
      // asignadas (caso LEGAL_REP). Detecta y muestra el error.
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        toast.error('Sin resultados', data.error ?? 'No hay marcas que descargar.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Descarga ${format.toUpperCase()} lista`);
    } catch {
      toast.error('Error de red');
    } finally {
      setDownloading(null);
    }
  }

  const selectStyle: React.CSSProperties = {
    height: '2.5rem',
    borderRadius: '0.75rem',
    border: '1px solid #E2DED6',
    background: '#FBF6EC',
    padding: '0 0.75rem',
    fontSize: '0.875rem',
    color: '#0F2E3D',
    outline: 'none',
    width: '100%',
  };

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: 'var(--tenant-primary, #D39A2B)' }}
        >
          Exportaciones
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>
          Descargas
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
          Genera reportes del catálogo de marcas. Aplica filtros antes de descargar para acotar el resultado.
          <span className="ml-1" style={{ color: '#C8C4B9' }}>
            ({brandsCount} marca{brandsCount !== 1 ? 's' : ''} en total)
          </span>
        </p>
      </div>

      {/* Filtros */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Filter className="size-4" style={{ color: '#355B6F' }} />
          <h2 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>Filtros</h2>
          {filtersActive && (
            <button
              type="button"
              onClick={() => { setStatus(''); setType(''); setClassNum(''); setCompany(''); }}
              className="ml-auto text-xs font-medium underline"
              style={{ color: '#355B6F' }}
            >
              Limpiar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Estado legal
            </label>
            <select style={selectStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Tipo de marca (IMPI)
            </label>
            <select style={selectStyle} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todos los tipos</option>
              {BRAND_TYPE_ORDER.map((t) => (
                <option key={t} value={t}>{BRAND_TYPE_LABELS[t] ?? t}</option>
              ))}
            </select>
          </div>
          {availableClasses.length > 0 && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                Clase de Niza
              </label>
              <select style={selectStyle} value={classNum} onChange={(e) => setClassNum(e.target.value)}>
                <option value="">Todas las clases</option>
                {availableClasses.map((n) => (
                  <option key={n} value={String(n)}>Clase {n}</option>
                ))}
              </select>
            </div>
          )}
          {companies.length > 1 && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                Empresa titular
              </label>
              <select style={selectStyle} value={company} onChange={(e) => setCompany(e.target.value)}>
                <option value="">Todas las empresas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Acciones de descarga */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DownloadCard
          icon={<FileSpreadsheet className="size-6" />}
          title="Excel (XLSX)"
          description="Hoja de cálculo con todas las columnas del catálogo. Ideal para análisis y reportes internos."
          format="xlsx"
          accent="#2F6B4F"
          loading={downloading === 'xlsx'}
          onDownload={() => handleDownload('xlsx')}
        />
        <DownloadCard
          icon={<FileText className="size-6" />}
          title="PDF"
          description="Documento listo para imprimir o compartir con clientes y socios. Formato profesional."
          format="pdf"
          accent="#B42318"
          loading={downloading === 'pdf'}
          onDownload={() => handleDownload('pdf')}
        />
      </div>
    </div>
  );
}

function DownloadCard({
  icon,
  title,
  description,
  accent,
  loading,
  onDownload,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  format: 'xlsx' | 'pdf';
  accent: string;
  loading: boolean;
  onDownload: () => void;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl border p-6 transition-all"
      style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex size-12 items-center justify-center rounded-xl"
          style={{ background: `${accent}15`, color: accent }}
        >
          {icon}
        </span>
        <h3 className="text-base font-bold" style={{ color: '#0F2E3D' }}>
          {title}
        </h3>
      </div>
      <p className="flex-1 text-sm" style={{ color: '#355B6F' }}>
        {description}
      </p>
      <button
        type="button"
        onClick={onDownload}
        disabled={loading}
        className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
        style={{ background: accent, color: '#FBF6EC' }}
      >
        <Download className="size-4" />
        {loading ? 'Generando…' : 'Descargar'}
      </button>
    </div>
  );
}

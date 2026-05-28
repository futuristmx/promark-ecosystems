'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Info, Scroll, Award, Megaphone, BarChart3, Stamp, FolderArchive } from 'lucide-react';
import { ALERT_ENTITY_TYPE_LABELS } from '@/lib/i18n/status-labels';

interface DocItem {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  document_category: string;
  description: string | null;
  entity_type: string;
  entity_id: string;
  uploaded_at: string;
  expires_at: string | null;
  version_number: number;
}

interface CategoryDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'ALL', label: 'Todos', icon: FolderArchive, description: 'Vista completa del repositorio' },
  { key: 'CONTRACT', label: 'Contratos', icon: Scroll, description: 'Contratos de licencia, cesión, distribución y franquicia' },
  { key: 'CERTIFICATE', label: 'Certificados', icon: Award, description: 'Títulos de registro IMPI y constancias oficiales' },
  { key: 'RENEWAL', label: 'Renovaciones', icon: Stamp, description: 'Solicitudes y comprobantes de renovación' },
  { key: 'POWER_OF_ATTORNEY', label: 'Poderes', icon: Stamp, description: 'Poderes notariales para representación' },
  { key: 'COMMUNICATION', label: 'Comunicaciones', icon: Megaphone, description: 'Notificaciones IMPI, oficios y correspondencia' },
  { key: 'REPORT', label: 'Reportes', icon: BarChart3, description: 'Reportes ejecutivos y auditorías' },
  { key: 'OTHER', label: 'Otros', icon: FolderArchive, description: 'Documentos sin categoría específica' },
];

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClientDocumentsView({
  tenantSlug,
  allowDownload,
}: {
  tenantSlug: string;
  allowDownload: boolean;
}) {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/client/${tenantSlug}/documents`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { documents: [] }))
      .then((d) => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDocuments(d.documents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, [tenantSlug]);

  // Count per category for tab badges
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: documents.length };
    for (const doc of documents) {
      c[doc.document_category] = (c[doc.document_category] ?? 0) + 1;
    }
    return c;
  }, [documents]);

  const visibleCategories = useMemo(
    () => CATEGORIES.filter((cat) => cat.key === 'ALL' || (counts[cat.key] ?? 0) > 0),
    [counts],
  );

  const filteredDocs = useMemo(() => {
    if (activeTab === 'ALL') return documents;
    return documents.filter((d) => d.document_category === activeTab);
  }, [documents, activeTab]);

  const totalCount = documents.length;
  const hasDocs = totalCount > 0;
  const activeCat = CATEGORIES.find((c) => c.key === activeTab) ?? CATEGORIES[0];

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Page header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--tenant-primary, #D39A2B)' }}>
          Repositorio
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>Documentos</h1>
      </div>

      {/* Info card — premium, azul hielo */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          borderColor: 'rgba(143,182,199,0.5)',
          background: 'linear-gradient(135deg, #DDEAF2 0%, #F1EDE3 100%)',
        }}
      >
        <div className="flex items-start gap-4 p-5">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #355B6F 0%, #0F2E3D 100%)',
              boxShadow: '0 2px 8px rgba(15,46,61,0.18)',
            }}
          >
            {hasDocs ? (
              <FolderArchive className="size-5" style={{ color: '#FBF6EC' }} />
            ) : (
              <Info className="size-5" style={{ color: '#FBF6EC' }} />
            )}
          </div>
          <div className="flex-1">
            {loading ? (
              <p className="text-sm" style={{ color: '#355B6F' }}>
                Cargando repositorio…
              </p>
            ) : hasDocs ? (
              <>
                <p className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                  Tu repositorio tiene {totalCount} documento{totalCount !== 1 && 's'} disponible{totalCount !== 1 && 's'}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: '#355B6F' }}>
                  Organizados por tipo. Selecciona una pestaña para filtrar.
                  {allowDownload && ' Puedes descargar cada documento cuando lo necesites.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                  Aún no tienes documentos cargados
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: '#355B6F' }}>
                  Cuando tu equipo legal cargue contratos, certificados, comunicaciones u otros documentos relacionados con tus marcas, aparecerán aquí organizados por tipo.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {hasDocs && (
        <>
          {/* Category tabs */}
          <div
            className="flex flex-wrap items-center gap-1 rounded-2xl border p-1"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            {visibleCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.key;
              const count = counts[cat.key] ?? 0;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveTab(cat.key)}
                  className="group relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                          color: '#FBF6EC',
                          boxShadow: '0 2px 6px rgba(15,46,61,0.25)',
                        }
                      : { color: '#355B6F' }
                  }
                  title={cat.description}
                >
                  <Icon className="size-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className="rounded-full px-1.5 text-[10px] font-bold"
                    style={{
                      background: isActive ? 'rgba(245,201,122,0.25)' : 'rgba(15,46,61,0.08)',
                      color: isActive ? '#F5C97A' : '#355B6F',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab description */}
          <p className="text-xs italic" style={{ color: '#355B6F' }}>
            {activeCat.description}
          </p>

          {/* Documents table */}
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F1EDE3', borderBottom: '1px solid #E2DED6' }}>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Archivo</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Vinculado a</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Subido</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Vence</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Tamaño</th>
                  {allowDownload && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc, i) => (
                  <tr
                    key={doc.id}
                    className="transition-colors"
                    style={{ borderBottom: i < filteredDocs.length - 1 ? '1px solid #E2DED6' : undefined }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(226,222,214,0.35)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0" style={{ color: '#355B6F' }} />
                        <div className="min-w-0">
                          <p className="truncate font-medium" style={{ color: '#0F2E3D' }}>{doc.file_name}</p>
                          {doc.description && (
                            <p className="truncate text-xs" style={{ color: '#355B6F' }}>{doc.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#355B6F' }}>
                      {ALERT_ENTITY_TYPE_LABELS[doc.entity_type] ?? doc.entity_type}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#355B6F' }}>
                      {new Date(doc.uploaded_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#355B6F' }}>
                      {doc.expires_at
                        ? new Date(doc.expires_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#C8C4B9' }}>{formatBytes(doc.file_size)}</td>
                    {allowDownload && (
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/api/client/${tenantSlug}/documents/${doc.id}/download`}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
                          style={{ background: 'rgba(15,46,61,0.06)', color: '#0F2E3D' }}
                          title="Descargar documento"
                        >
                          <Download className="size-3.5" />
                          Descargar
                        </a>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDocs.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: '#355B6F' }}>
                  Sin documentos en esta categoría.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

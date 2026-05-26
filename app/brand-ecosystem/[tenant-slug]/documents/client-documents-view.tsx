'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
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

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT: 'Contrato',
  CERTIFICATE: 'Certificado',
  RENEWAL: 'Renovación',
  POWER_OF_ATTORNEY: 'Poder',
  COMMUNICATION: 'Comunicación',
  REPORT: 'Reporte',
  OTHER: 'Otro',
};

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

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#8FB6C7' }}>
          Repositorio
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>Documentos</h1>
        <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
          {documents.length} documento{documents.length !== 1 && 's'} disponible
          {documents.length !== 1 && 's'}
        </p>
      </div>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
      >
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: '#C8C4B9' }}>
            Cargando…
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 size-10" style={{ color: '#C8C4B9' }} aria-hidden />
            <p className="text-sm" style={{ color: '#355B6F' }}>
              Sin documentos disponibles.
            </p>
            <p className="mt-1 text-xs" style={{ color: '#C8C4B9' }}>
              Cuando tu equipo legal cargue contratos, certificados o
              comunicaciones, aparecerán aquí.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F1EDE3', borderBottom: '1px solid #E2DED6' }}>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>Archivo</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>Categoría</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>Vinculado a</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>Subido</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>Vence</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>Tamaño</th>
                {allowDownload && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => (
                <tr
                  key={doc.id}
                  className="transition-colors"
                  style={{
                    borderBottom: i < documents.length - 1 ? '1px solid #E2DED6' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(226,222,214,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0" style={{ color: '#8FB6C7' }} />
                      <div className="min-w-0">
                        <p className="truncate font-medium" style={{ color: '#0F2E3D' }}>
                          {doc.file_name}
                        </p>
                        {doc.description && (
                          <p className="truncate text-xs" style={{ color: '#8FB6C7' }}>
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ background: 'rgba(143,182,199,0.12)', color: '#355B6F' }}
                    >
                      {CATEGORY_LABELS[doc.document_category] ?? doc.document_category}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#355B6F' }}>
                    {ALERT_ENTITY_TYPE_LABELS[doc.entity_type] ?? doc.entity_type}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#355B6F' }}>
                    {new Date(doc.uploaded_at).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#355B6F' }}>
                    {doc.expires_at
                      ? new Date(doc.expires_at).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#C8C4B9' }}>
                    {formatBytes(doc.file_size)}
                  </td>
                  {allowDownload && (
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/client/${tenantSlug}/documents/${doc.id}/download`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                        style={{ color: '#355B6F' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(226,222,214,0.5)';
                          e.currentTarget.style.color = '#0F2E3D';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#355B6F';
                        }}
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
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    <div className="px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Documentos</h1>
      <p className="mb-6 text-sm text-slate-500">
        {documents.length} documento{documents.length !== 1 && 's'} disponible
        {documents.length !== 1 && 's'}
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Cargando…
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 size-10 text-slate-300" aria-hidden />
            <p className="text-sm text-slate-500">
              Sin documentos disponibles.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Cuando tu equipo legal cargue contratos, certificados o
              comunicaciones, aparecerán aquí.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Archivo</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Vinculado a</th>
                <th className="px-4 py-3">Subido</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3">Tamaño</th>
                {allowDownload && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {doc.file_name}
                        </p>
                        {doc.description && (
                          <p className="truncate text-xs text-slate-500">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[doc.document_category] ?? doc.document_category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {ALERT_ENTITY_TYPE_LABELS[doc.entity_type] ?? doc.entity_type}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(doc.uploaded_at).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {doc.expires_at
                      ? new Date(doc.expires_at).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatBytes(doc.file_size)}
                  </td>
                  {allowDownload && (
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/client/${tenantSlug}/documents/${doc.id}/download`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
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

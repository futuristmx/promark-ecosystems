'use client';

import { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CsvToolbarProps {
  /** API endpoint for GET (export) and POST (import) */
  endpoint: string;
  /** CSV template columns for the download template */
  templateColumns: string[];
  /** Optional example row for the template */
  templateExample?: string[];
  /** Label for the entity type (e.g. "clientes", "marcas") */
  entityLabel?: string;
  /** Callback after successful import */
  onImportSuccess?: () => void;
  className?: string;
}

/**
 * CsvToolbar — Barra premium reutilizable para import/export CSV.
 *
 * Funciones:
 * - Descargar plantilla CSV vacía
 * - Exportar datos actuales como CSV
 * - Importar CSV con feedback de resultados
 *
 * Diseñada como widget secundario que se integra debajo de PageTitle.
 */
export function CsvToolbar({
  endpoint,
  templateColumns,
  templateExample,
  entityLabel = 'registros',
  onImportSuccess,
  className,
}: CsvToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  function downloadTemplate() {
    let csv = templateColumns.join(',') + '\n';
    if (templateExample) {
      csv += templateExample.join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${entityLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    window.open(endpoint, '_blank');
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ type: 'error', text: data.error ?? 'Error al importar.' });
      } else {
        const parts: string[] = [];
        if (data.created > 0) parts.push(`${data.created} creados`);
        if (data.updated > 0) parts.push(`${data.updated} actualizados`);
        if (data.errors?.length > 0) parts.push(`${data.errors.length} errores`);
        setResult({
          type: data.errors?.length > 0 ? 'error' : 'success',
          text: parts.join(' · ') || 'Importación completada.',
        });
        if (data.created > 0 || data.updated > 0) {
          onImportSuccess?.();
        }
      }
    } catch {
      setResult({ type: 'error', text: 'Error de red.' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className={className}>
      <div
        className="flex flex-wrap items-center gap-2 rounded-xl px-4 py-2.5"
        style={{ background: '#F1EDE3' }}
      >
        <FileSpreadsheet className="size-4" style={{ color: '#355B6F' }} />
        <span
          className="mr-1 text-xs font-medium"
          style={{ color: '#355B6F' }}
        >
          CSV
        </span>

        <div className="h-4 w-px" style={{ background: '#E2DED6' }} />

        {/* Template download */}
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{ color: '#0F2E3D' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(226,222,214,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Download className="size-3.5" />
          Plantilla
        </button>

        {/* Export */}
        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{ color: '#0F2E3D' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(226,222,214,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Download className="size-3.5" />
          Exportar
        </button>

        <div className="h-4 w-px" style={{ background: '#E2DED6' }} />

        {/* Import */}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImport}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          style={{ color: '#0F2E3D' }}
          onMouseEnter={(e) => {
            if (!importing) e.currentTarget.style.background = 'rgba(226,222,214,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {importing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          {importing ? 'Importando…' : 'Importar'}
        </button>

        {/* Result badge */}
        {result && (
          <>
            <div className="h-4 w-px" style={{ background: '#E2DED6' }} />
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
              style={
                result.type === 'success'
                  ? { background: 'rgba(47,107,79,0.08)', color: '#2F6B4F' }
                  : { background: 'rgba(180,35,24,0.06)', color: '#B42318' }
              }
            >
              {result.type === 'success' ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <AlertCircle className="size-3.5" />
              )}
              {result.text}
              <button
                type="button"
                onClick={() => setResult(null)}
                className="ml-1 opacity-50 hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

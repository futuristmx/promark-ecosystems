'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

interface ExportMenuProps {
  /** Base URL of the export endpoint, without ?format=... */
  endpoint: string;
  /** Visible label of the button */
  label?: string;
  /** Filename hint shown in the dropdown */
  hint?: string;
}

/**
 * Compact "Exportar" dropdown for table-based pages.
 * Triggers a download for Excel (xlsx) or PDF.
 */
export function ExportMenu({
  endpoint,
  label = 'Exportar',
  hint,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function download(format: 'xlsx' | 'pdf') {
    setDownloading(format);
    try {
      const res = await fetch(`${endpoint}?format=${format}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        alert('No se pudo generar la exportación.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Filename comes from Content-Disposition; browsers respect it.
      a.download = '';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      alert('Error de red al descargar.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <Download className="size-4" />
        {label}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {hint && (
              <p className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                {hint}
              </p>
            )}
            <button
              type="button"
              onClick={() => download('xlsx')}
              disabled={downloading !== null}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <span>Excel (.xlsx)</span>
              {downloading === 'xlsx' && (
                <span className="text-xs text-slate-400">…</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => download('pdf')}
              disabled={downloading !== null}
              className="flex w-full items-center justify-between border-t border-slate-100 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <span>PDF (.pdf)</span>
              {downloading === 'pdf' && (
                <span className="text-xs text-slate-400">…</span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

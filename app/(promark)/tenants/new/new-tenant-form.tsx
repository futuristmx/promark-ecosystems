'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewTenantForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3E6AE1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          config: {
            branding: {
              primary_color: primaryColor,
              company_display_name: name.trim(),
            },
            features: {
              show_brand_history: true,
              show_contracts: true,
              show_graph_view: true,
              show_documents: true,
              allow_document_download: false,
            },
            notifications: { expiry_alert_days: 90, notify_email: null },
            localization: { language: 'es', timezone: 'America/Mexico_City' },
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Error al crear el cliente.');
        return;
      }

      const tenant = await res.json();
      router.push(`/tenants/${tenant.id}/panel`);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          Razón social <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Grupo Industrial S.A. de C.V."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium text-slate-700">
          Slug del portal <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="Se autogenera del nombre si lo dejas vacio"
          pattern="[a-z0-9-]+"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          URL del portal: /brand-ecosystem/<strong>{slug || 'auto'}</strong>/...
        </p>
      </div>

      <div>
        <label htmlFor="color" className="mb-1 block text-sm font-medium text-slate-700">
          Color primario
        </label>
        <div className="flex items-center gap-3">
          <input
            id="color"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded-md border border-slate-300"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            pattern="#[0-9a-fA-F]{6}"
            className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.push('/tenants')}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creando…' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}

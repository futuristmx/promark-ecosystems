'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function ActivityFilters({ basePath }: { basePath: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname || basePath}?${params.toString()}`);
  }

  const entity = searchParams.get('entity') ?? 'ALL';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Tipo
        </label>
        <select
          value={entity}
          onChange={(e) => update('entity', e.target.value === 'ALL' ? '' : e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="ALL">Todos</option>
          <option value="BRAND">Marcas</option>
          <option value="CONTRACT">Contratos</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Desde
        </label>
        <input
          type="date"
          value={from}
          onChange={(e) => update('from', e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Hasta
        </label>
        <input
          type="date"
          value={to}
          onChange={(e) => update('to', e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      {(from || to || entity !== 'ALL') && (
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}

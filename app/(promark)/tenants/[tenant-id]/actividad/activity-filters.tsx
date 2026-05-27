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

  function applyPreset(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', from.toISOString().slice(0, 10));
    params.set('to', to.toISOString().slice(0, 10));
    router.push(`${pathname || basePath}?${params.toString()}`);
  }

  const entity = searchParams.get('entity') ?? 'ALL';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const inputStyle: React.CSSProperties = {
    background: '#FBF6EC',
    borderColor: '#E2DED6',
    color: '#0F2E3D',
  };

  return (
    <div
      className="space-y-3 rounded-2xl border p-4"
      style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
    >
      {/* A9: presets rápidos */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold" style={{ color: '#355B6F' }}>
          Rangos rápidos:
        </span>
        {[
          { label: 'Últimos 7 d', days: 7 },
          { label: 'Últimos 30 d', days: 30 },
          { label: 'Últimos 90 d', days: 90 },
        ].map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => applyPreset(preset.days)}
            className="rounded-lg border px-2.5 py-1 font-medium transition-colors hover:bg-[#E2DED6]"
            style={{ borderColor: '#E2DED6', color: '#355B6F', background: '#FBF6EC' }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
            Tipo
          </label>
          <select
            value={entity}
            onChange={(e) => update('entity', e.target.value === 'ALL' ? '' : e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="ALL">Todos</option>
            <option value="BRAND">Marcas</option>
            <option value="CONTRACT">Contratos</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
            Desde
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => update('from', e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
            Hasta
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => update('to', e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        {(from || to || entity !== 'ALL') && (
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#E2DED6]"
            style={{ borderColor: '#E2DED6', color: '#355B6F', background: '#FBF6EC' }}
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';
import { BRAND_TYPE_LABELS, BRAND_TYPE_ORDER } from '@/lib/i18n/status-labels';

interface BrandFiltersProps {
  companies: Array<{ id: string; name: string }>;
  basePath: string;
  /** Clases de Niza con marcas en este tenant (para popular el filtro de clase). */
  availableClasses?: number[];
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

const VIGENCY_OPTIONS = [
  { value: '', label: 'Toda vigencia' },
  { value: 'green', label: 'Vigente (>90 días)' },
  { value: 'yellow', label: 'Por vencer (31-90 días)' },
  { value: 'orange', label: 'Urgente (1-30 días)' },
  { value: 'red', label: 'Expirada' },
];

const selectStyle: React.CSSProperties = {
  height: '2.25rem',
  borderRadius: '0.75rem',
  border: '1px solid #E2DED6',
  background: '#FBF6EC',
  padding: '0 0.625rem',
  fontSize: '0.8125rem',
  color: '#355B6F',
  outline: 'none',
};

export function BrandFilters({ companies, basePath, availableClasses = [] }: BrandFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') ?? '';
  const currentCompany = searchParams.get('company') ?? '';
  const currentStatus = searchParams.get('status') ?? '';
  const currentVigency = searchParams.get('vigency') ?? '';
  const currentType = searchParams.get('type') ?? '';
  const currentClass = searchParams.get('class') ?? '';

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, searchParams, basePath]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: '#C8C4B9' }} />
        <input
          placeholder="Buscar marca..."
          className="h-9 w-56 rounded-xl border pl-9 pr-3 text-sm transition-all focus:outline-none"
          style={{
            background: '#FBF6EC',
            borderColor: '#E2DED6',
            color: '#0F2E3D',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#D39A2B';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E2DED6';
            e.currentTarget.style.boxShadow = 'none';
          }}
          defaultValue={currentSearch}
          onChange={(e) => {
            const target = e.target as HTMLInputElement;
            updateParams('search', target.value);
          }}
        />
      </div>

      {/* Company filter */}
      {companies.length > 1 && (
        <select
          style={selectStyle}
          value={currentCompany}
          onChange={(e) => updateParams('company', e.target.value)}
        >
          <option value="">Todas las empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {/* Status filter */}
      <select
        style={selectStyle}
        value={currentStatus}
        onChange={(e) => updateParams('status', e.target.value)}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Vigency filter */}
      <select
        style={selectStyle}
        value={currentVigency}
        onChange={(e) => updateParams('vigency', e.target.value)}
      >
        {VIGENCY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Tipo de marca filter (IMPI) */}
      <select
        style={selectStyle}
        value={currentType}
        onChange={(e) => updateParams('type', e.target.value)}
      >
        <option value="">Todos los tipos</option>
        {BRAND_TYPE_ORDER.map((t) => (
          <option key={t} value={t}>
            {BRAND_TYPE_LABELS[t] ?? t}
          </option>
        ))}
      </select>

      {/* Clase de Niza filter */}
      {availableClasses.length > 0 && (
        <select
          style={selectStyle}
          value={currentClass}
          onChange={(e) => updateParams('class', e.target.value)}
        >
          <option value="">Todas las clases</option>
          {availableClasses.map((n) => (
            <option key={n} value={String(n)}>
              Clase {n}
            </option>
          ))}
        </select>
      )}

      {/* Limpiar filtros (visible cuando hay alguno aplicado) */}
      {(currentSearch || currentCompany || currentStatus || currentVigency || currentType || currentClass) && (
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="h-9 rounded-xl border px-3 text-xs font-medium transition-colors hover:bg-[#F1EDE3]"
          style={{ borderColor: '#E2DED6', color: '#355B6F', background: '#FBF6EC' }}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

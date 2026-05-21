'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface BrandFiltersProps {
  companies: Array<{ id: string; name: string }>;
  basePath: string;
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
  { value: 'green', label: 'Vigente (>90 dias)' },
  { value: 'yellow', label: 'Por vencer (31-90 dias)' },
  { value: 'orange', label: 'Urgente (1-30 dias)' },
  { value: 'red', label: 'Expirada' },
];

export function BrandFilters({ companies, basePath }: BrandFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') ?? '';
  const currentCompany = searchParams.get('company') ?? '';
  const currentStatus = searchParams.get('status') ?? '';
  const currentVigency = searchParams.get('vigency') ?? '';

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
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar marca..."
          className="h-8 w-56 pl-8 text-sm"
          defaultValue={currentSearch}
          onChange={(e) => {
            // Debounce is handled by the server re-fetch
            const target = e.target as HTMLInputElement;
            updateParams('search', target.value);
          }}
        />
      </div>

      {/* Company filter */}
      {companies.length > 1 && (
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-slate-700 outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
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
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-slate-700 outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
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
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-slate-700 outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        value={currentVigency}
        onChange={(e) => updateParams('vigency', e.target.value)}
      >
        {VIGENCY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

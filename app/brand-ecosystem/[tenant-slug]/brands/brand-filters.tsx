'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Filter, ChevronDown, X, Building2, Shield, Clock, Tag as TagIcon, Hash } from 'lucide-react';
import { BRAND_TYPE_LABELS, BRAND_TYPE_ORDER } from '@/lib/i18n/status-labels';

interface BrandFiltersProps {
  companies: Array<{ id: string; name: string }>;
  basePath: string;
  availableClasses?: number[];
}

const STATUS_OPTIONS = [
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
  { value: 'green', label: 'Vigente (>90 días)' },
  { value: 'yellow', label: 'Por vencer (31–90 días)' },
  { value: 'orange', label: 'Urgente (1–30 días)' },
  { value: 'red', label: 'Expirada' },
];

interface DropdownProps {
  label: string;
  tooltip?: string;
  icon: React.ReactNode;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  allLabel: string;
}

function Dropdown({ label, tooltip, icon, value, options, onChange, allLabel }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const hasValue = !!value;

  return (
    <div ref={ref} className="relative group">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-xl border-[1.5px] px-3 py-2 text-xs font-semibold transition-all"
        style={{
          borderColor: hasValue ? '#D39A2B' : '#355B6F',
          background: hasValue ? 'rgba(211,154,43,0.10)' : '#FBF6EC',
          color: hasValue ? '#7A5A14' : '#0F2E3D',
          boxShadow: hasValue ? '0 0 0 3px rgba(211,154,43,0.12)' : 'none',
        }}
      >
        <span style={{ color: hasValue ? '#7A5A14' : '#355B6F' }}>{icon}</span>
        <span>{selected?.label ?? label}</span>
        <ChevronDown
          className="size-3.5 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {tooltip && (
        <div
          className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium opacity-0 shadow transition-opacity group-hover:opacity-100"
          style={{ background: '#0F2E3D', color: '#FBF6EC' }}
        >
          {tooltip}
        </div>
      )}
      {open && (
        <div
          className="absolute left-0 top-full z-40 mt-1.5 max-h-72 w-56 overflow-auto rounded-xl border-[1.5px] shadow-xl"
          style={{
            borderColor: '#355B6F',
            background: '#FBF6EC',
            boxShadow: '0 12px 32px rgba(15,46,61,0.18)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-xs font-semibold transition-colors hover:bg-black/5"
            style={{ color: !hasValue ? '#0F2E3D' : '#355B6F' }}
          >
            {allLabel}
          </button>
          <div className="border-t" style={{ borderColor: '#E2DED6' }} />
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-black/5"
              style={{
                background: opt.value === value ? 'rgba(211,154,43,0.10)' : 'transparent',
                color: opt.value === value ? '#7A5A14' : '#0F2E3D',
                fontWeight: opt.value === value ? 700 : 500,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, searchParams, basePath]
  );

  const hasAnyFilter =
    currentSearch || currentCompany || currentStatus || currentVigency || currentType || currentClass;

  return (
    <div
      className="rounded-2xl border-[1.5px] p-3"
      style={{
        borderColor: '#355B6F',
        background: 'linear-gradient(135deg, #FBF6EC 0%, #F1EDE3 100%)',
        boxShadow: '0 4px 12px rgba(15,46,61,0.06)',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Filter className="size-4" style={{ color: '#0F2E3D' }} />
        <p
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: '#0F2E3D' }}
        >
          Filtros inteligentes
        </p>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
            style={{ background: 'rgba(180,35,24,0.10)', color: '#B42318' }}
          >
            <X className="size-3" />
            Limpiar todo
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Search — high contrast */}
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2"
            style={{ color: '#355B6F' }}
          />
          <input
            placeholder="Buscar marca…"
            className="h-9 w-60 rounded-xl border-[1.5px] pl-9 pr-3 text-sm font-medium transition-all focus:outline-none"
            style={{
              background: '#FFFFFF',
              borderColor: currentSearch ? '#D39A2B' : '#355B6F',
              color: '#0F2E3D',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#D39A2B';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.18)';
            }}
            onBlur={(e) => {
              if (!currentSearch) e.currentTarget.style.borderColor = '#355B6F';
              e.currentTarget.style.boxShadow = 'none';
            }}
            defaultValue={currentSearch}
            onChange={(e) => updateParams('search', e.target.value)}
          />
          <span
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium opacity-0 shadow transition-opacity group-focus-within:opacity-100"
            style={{ background: '#0F2E3D', color: '#FBF6EC' }}
          >
            Busca por nombre de marca
          </span>
        </div>

        {companies.length > 1 && (
          <Dropdown
            label="Empresa"
            tooltip="Filtra por empresa titular"
            icon={<Building2 className="size-3.5" />}
            value={currentCompany}
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(v) => updateParams('company', v)}
            allLabel="Todas las empresas"
          />
        )}

        <Dropdown
          label="Estado"
          tooltip="Estatus legal frente al IMPI"
          icon={<Shield className="size-3.5" />}
          value={currentStatus}
          options={STATUS_OPTIONS}
          onChange={(v) => updateParams('status', v)}
          allLabel="Todos los estados"
        />

        <Dropdown
          label="Vigencia"
          tooltip="Días hasta el próximo vencimiento"
          icon={<Clock className="size-3.5" />}
          value={currentVigency}
          options={VIGENCY_OPTIONS}
          onChange={(v) => updateParams('vigency', v)}
          allLabel="Toda vigencia"
        />

        <Dropdown
          label="Tipo"
          tooltip="Tipo de signo distintivo según el catálogo IMPI"
          icon={<TagIcon className="size-3.5" />}
          value={currentType}
          options={BRAND_TYPE_ORDER.map((t) => ({
            value: t,
            label: BRAND_TYPE_LABELS[t] ?? t,
          }))}
          onChange={(v) => updateParams('type', v)}
          allLabel="Todos los tipos"
        />

        {availableClasses.length > 0 && (
          <Dropdown
            label="Clase"
            tooltip="Clases de Niza asignadas a la marca"
            icon={<Hash className="size-3.5" />}
            value={currentClass}
            options={availableClasses.map((n) => ({
              value: String(n),
              label: `Clase ${n}`,
            }))}
            onChange={(v) => updateParams('class', v)}
            allLabel="Todas las clases"
          />
        )}
      </div>
    </div>
  );
}

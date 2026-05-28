'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, X, Filter, Sparkles } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterField {
  key: string;
  label: string;
  options: FilterOption[];
}

export type ActiveFilters = Record<string, string[]>;

interface Props {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  fields: FilterField[];
  active: ActiveFilters;
  onActiveChange: (next: ActiveFilters) => void;
  totalResults: number;
  totalUnfiltered: number;
  rightSlot?: React.ReactNode;
}

/**
 * SmartFilterBar — Premium floating/sticky filter bar.
 *
 * Features:
 * - Sticky positioning with subtle backdrop-blur shadow on scroll
 * - Free-text search (left)
 * - Multi-select dropdown chips per filter field
 * - Active filter pills with quick-remove
 * - Reset-all button
 * - Live result counter
 */
export function SmartFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  fields,
  active,
  onActiveChange,
  totalResults,
  totalUnfiltered,
  rightSlot,
}: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toggleValue(key: string, value: string) {
    const current = active[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const updated = { ...active };
    if (next.length === 0) {
      delete updated[key];
    } else {
      updated[key] = next;
    }
    onActiveChange(updated);
  }

  function clearField(key: string) {
    const updated = { ...active };
    delete updated[key];
    onActiveChange(updated);
  }

  function clearAll() {
    onActiveChange({});
    onSearchChange('');
  }

  const activeCount = Object.values(active).reduce((sum, arr) => sum + arr.length, 0);
  const hasFilters = activeCount > 0 || searchValue.trim().length > 0;

  return (
    <div
      ref={wrapperRef}
      className="sticky top-2 z-30 rounded-2xl border transition-all"
      style={{
        background: scrolled ? 'rgba(251,246,236,0.92)' : '#FBF6EC',
        borderColor: '#E2DED6',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        boxShadow: scrolled
          ? '0 8px 24px rgba(15,46,61,0.08), 0 2px 6px rgba(15,46,61,0.04)'
          : '0 1px 2px rgba(15,46,61,0.04)',
      }}
    >
      {/* Top row: search + chips + actions */}
      <div className="flex flex-wrap items-center gap-2 p-2.5">
        {/* Search */}
        <div className="relative flex min-w-[220px] flex-1 items-center">
          <Search
            className="absolute left-3 size-4"
            style={{ color: '#8FB6C7' }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border bg-transparent py-2 pl-9 pr-3 text-sm focus:outline-none"
            style={{
              borderColor: '#E2DED6',
              color: '#1A1E23',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#D39A2B';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E2DED6';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 rounded p-0.5"
              style={{ color: '#355B6F' }}
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        {fields.map((field) => {
          const isOpen = openKey === field.key;
          const selected = active[field.key] ?? [];
          const hasSelection = selected.length > 0;
          return (
            <div key={field.key} className="relative">
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : field.key)}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all"
                style={{
                  borderColor: hasSelection ? '#D39A2B' : '#E2DED6',
                  background: hasSelection ? 'rgba(211,154,43,0.08)' : '#FFFFFF',
                  color: hasSelection ? '#7A5A14' : '#355B6F',
                }}
              >
                <Filter className="size-3.5" />
                {field.label}
                {hasSelection && (
                  <span
                    className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{ background: '#D39A2B', color: '#FBF6EC' }}
                  >
                    {selected.length}
                  </span>
                )}
                <ChevronDown
                  className="size-3.5 transition-transform"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {isOpen && (
                <div
                  className="absolute left-0 top-full z-40 mt-1.5 max-h-72 w-64 overflow-auto rounded-xl border shadow-xl"
                  style={{
                    borderColor: '#E2DED6',
                    background: '#FBF6EC',
                    boxShadow: '0 12px 32px rgba(15,46,61,0.14)',
                  }}
                >
                  <div
                    className="flex items-center justify-between border-b px-3 py-2"
                    style={{ borderColor: '#E2DED6' }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: '#355B6F' }}
                    >
                      {field.label}
                    </p>
                    {hasSelection && (
                      <button
                        type="button"
                        onClick={() => clearField(field.key)}
                        className="text-[10px] font-medium"
                        style={{ color: '#B42318' }}
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="py-1">
                    {field.options.length === 0 ? (
                      <p className="px-3 py-3 text-center text-xs" style={{ color: '#C8C4B9' }}>
                        Sin opciones
                      </p>
                    ) : (
                      field.options.map((opt) => {
                        const checked = selected.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleValue(field.key, opt.value)}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-black/[0.03]"
                            style={{ color: '#0F2E3D' }}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                                style={{
                                  borderColor: checked ? '#0F2E3D' : '#C8C4B9',
                                  background: checked ? '#0F2E3D' : 'transparent',
                                }}
                              >
                                {checked && (
                                  <svg
                                    viewBox="0 0 12 12"
                                    className="size-3"
                                    style={{ color: '#FBF6EC' }}
                                  >
                                    <path
                                      d="M2 6l2.5 2.5L10 3"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="none"
                                    />
                                  </svg>
                                )}
                              </span>
                              <span className="truncate">{opt.label}</span>
                            </span>
                            {opt.count !== undefined && (
                              <span
                                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                  background: '#E2DED6',
                                  color: '#355B6F',
                                }}
                              >
                                {opt.count}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Reset all */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors"
            style={{ color: '#B42318' }}
          >
            <X className="size-3.5" />
            Limpiar todo
          </button>
        )}

        {/* Result counter */}
        <div
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
          style={{
            background: hasFilters ? 'rgba(211,154,43,0.10)' : 'rgba(15,46,61,0.06)',
            color: hasFilters ? '#7A5A14' : '#355B6F',
          }}
        >
          <Sparkles className="size-3" />
          {totalResults === totalUnfiltered
            ? `${totalResults} resultado${totalResults === 1 ? '' : 's'}`
            : `${totalResults} de ${totalUnfiltered}`}
        </div>

        {rightSlot}
      </div>

      {/* Active filter pills */}
      {activeCount > 0 && (
        <div
          className="flex flex-wrap items-center gap-1.5 border-t px-2.5 py-2"
          style={{ borderColor: '#E2DED6' }}
        >
          {fields.flatMap((field) =>
            (active[field.key] ?? []).map((val) => {
              const opt = field.options.find((o) => o.value === val);
              return (
                <span
                  key={`${field.key}:${val}`}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    background: 'rgba(211,154,43,0.14)',
                    color: '#7A5A14',
                  }}
                >
                  <span className="opacity-70">{field.label}:</span>
                  {opt?.label ?? val}
                  <button
                    type="button"
                    onClick={() => toggleValue(field.key, val)}
                    className="rounded p-0.5 hover:bg-black/5"
                    aria-label="Quitar filtro"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/** Build option counts from a dataset. */
export function buildOptions<T>(
  items: T[],
  getValue: (item: T) => string | null | undefined,
  labelMap?: Record<string, string>
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const v = getValue(item);
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: labelMap?.[value] ?? value,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Compute vigency bucket for a date. */
export function vigencyBucket(date: string | null | undefined): string | null {
  if (!date) return 'NO_DATE';
  const d = new Date(date);
  const now = new Date();
  const in90 = new Date();
  in90.setDate(in90.getDate() + 90);
  if (d < now) return 'EXPIRED';
  if (d <= in90) return 'EXPIRING_SOON';
  return 'VIGENT';
}

export const VIGENCY_LABELS: Record<string, string> = {
  VIGENT: 'Vigente',
  EXPIRING_SOON: 'Por vencer (90d)',
  EXPIRED: 'Vencida',
  NO_DATE: 'Sin fecha',
};

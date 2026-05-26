'use client';

import { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from './empty-state';

export interface DsColumn<T> {
  /** Identificador estable de la columna (también la key del row data) */
  key: string;
  /** Header visible */
  header: string;
  /** Ancho en px o % opcional */
  width?: string | number;
  /** Si la columna es sortable */
  sortable?: boolean;
  /** Render custom de la celda */
  cell?: (row: T) => React.ReactNode;
  /** Alineación */
  align?: 'left' | 'right' | 'center';
}

export interface DsRowAction<T> {
  label: string;
  onClick?: (row: T) => void;
  href?: (row: T) => string;
  destructive?: boolean;
  /** Lucide icon element for this action */
  icon?: React.ReactNode;
  /** Show as inline quick-action icon instead of inside the overflow menu */
  quickAction?: boolean;
}

interface DsDataTableProps<T> {
  columns: DsColumn<T>[];
  rows: T[];
  /** Función que retorna el ID único del row para React keys + click */
  getRowId: (row: T) => string;
  /** Si está cargando, muestra skeleton */
  loading?: boolean;
  /** Empty state cuando rows.length === 0 */
  empty?: {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
  };
  /** Acciones por row (menú ...) */
  rowActions?: DsRowAction<T>[];
  /** Callback al clicar un row (excluyendo cells de actions) */
  onRowClick?: (row: T) => void;
  className?: string;
}

/**
 * DataTable premium del DS. Wrapper sobre shadcn Table que integra:
 *
 * - Sort por columna (client-side)
 * - Row actions vía dropdown menu (`...`)
 * - Empty state con EmptyState component
 * - Loading skeleton
 * - Click en row con callback
 * - Estilo light premium consistente con DsCard
 *
 * Para datos server-side con paginación, manejar el state externamente
 * (sort key/dir como props controlled).
 */
export function DsDataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  empty,
  rowActions,
  onRowClick,
  className,
}: DsDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortable) return rows;
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, columns, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  if (loading) {
    return (
      <div
        className={cn('overflow-hidden rounded-2xl border', className)}
        style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
      >
        <div className="space-y-3 p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg"
              style={{ background: 'rgba(255,255,255,0.6)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0 && empty) {
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
        icon={empty.icon}
        action={empty.action}
      />
    );
  }

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border',
        className
      )}
      style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
    >
      <table className="min-w-full">
        <thead
          className="border-b"
          style={{ borderColor: '#E2DED6', background: 'rgba(255,255,255,0.5)' }}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, color: '#355B6F' }}
                className={cn(
                  'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  !col.align && 'text-left',
                  col.sortable && 'cursor-pointer select-none'
                )}
                onClick={() => col.sortable && toggleSort(col.key)}
                onMouseEnter={(e) => { if (col.sortable) e.currentTarget.style.color = '#1A1E23'; }}
                onMouseLeave={(e) => { if (col.sortable) e.currentTarget.style.color = '#355B6F'; }}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span style={{ color: '#C8C4B9' }}>
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3" />
                      )}
                    </span>
                  )}
                </span>
              </th>
            ))}
            {rowActions && rowActions.length > 0 && (
              <th className="w-12 px-2 py-3" aria-label="Acciones" />
            )}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: 'rgba(226,222,214,0.5)' }}>
          {sortedRows.map((row) => {
            const id = getRowId(row);
            return (
              <tr
                key={id}
                className={cn(
                  'group transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                style={onRowClick ? {} : undefined}
                onMouseEnter={(e) => { if (onRowClick) e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={(e) => { if (onRowClick) e.currentTarget.style.background = ''; }}
                onClick={(e) => {
                  // No disparar onRowClick si el click fue en el dropdown
                  if ((e.target as HTMLElement).closest('[data-table-action]')) return;
                  onRowClick?.(row);
                }}
              >
                {columns.map((col) => {
                  const value = col.cell
                    ? col.cell(row)
                    : String(
                        (row as Record<string, unknown>)[col.key] ?? '—'
                      );
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}
                      style={{ color: '#1A1E23' }}
                    >
                      {value}
                    </td>
                  );
                })}
                {rowActions && rowActions.length > 0 && (() => {
                  const quickActions = rowActions.filter((a) => a.quickAction);
                  const overflowActions = rowActions.filter((a) => !a.quickAction);
                  return (
                    <td className="px-2 py-3 text-right" data-table-action>
                      <div className="inline-flex items-center gap-0.5">
                        {quickActions.map((action) => (
                          <div key={action.label} className="group/tip relative">
                            <button
                              type="button"
                              className="inline-flex size-7 items-center justify-center rounded-md transition-colors"
                              style={{ color: '#C8C4B9' }}
                              onMouseEnter={(e) => {
                                if (action.destructive) {
                                  e.currentTarget.style.color = '#B42318';
                                  e.currentTarget.style.background = 'rgba(180,35,24,0.06)';
                                } else {
                                  e.currentTarget.style.color = '#1A1E23';
                                  e.currentTarget.style.background = '#E2DED6';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#C8C4B9';
                                e.currentTarget.style.background = '';
                              }}
                              onClick={() => {
                                if (action.href) {
                                  window.location.href = action.href(row);
                                } else {
                                  action.onClick?.(row);
                                }
                              }}
                            >
                              {action.icon ?? <span className="text-xs">{action.label[0]}</span>}
                            </button>
                            <span
                              className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium opacity-0 transition-opacity group-hover/tip:opacity-100"
                              style={{ background: '#0B1F2A', color: '#FBF6EC' }}
                            >
                              {action.label}
                            </span>
                          </div>
                        ))}
                        {overflowActions.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="inline-flex size-7 items-center justify-center rounded-md transition-colors"
                              style={{ color: '#C8C4B9' }}
                              aria-label="Más acciones"
                            >
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {overflowActions.map((action) => (
                                <DropdownMenuItem
                                  key={action.label}
                                  variant={action.destructive ? 'destructive' : 'default'}
                                  onClick={() => {
                                    if (action.href) {
                                      window.location.href = action.href(row);
                                    } else {
                                      action.onClick?.(row);
                                    }
                                  }}
                                >
                                  {action.icon && <span className="mr-2">{action.icon}</span>}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </td>
                  );
                })()}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

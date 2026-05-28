'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGrid, List, BarChart3, Settings, Tag, Bell, Trash2 } from 'lucide-react';
import { DsDataTable, StatusBadge, useToast } from '@/components/ds';
import type { StatusTone, DsColumn } from '@/components/ds';
import { TENANT_STATUS_LABELS } from '@/lib/i18n/status-labels';

const STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  SUSPENDED: 'error',
  ONBOARDING: 'warning',
};

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  logoUrl: string | null;
  brandCount: number;
  alertCount: number;
}

interface TenantsViewProps {
  tenants: TenantRow[];
  isSuperAdmin: boolean;
}

type ViewMode = 'cards' | 'list';

export function TenantsView({ tenants, isSuperAdmin }: TenantsViewProps) {
  const [view, setView] = useState<ViewMode>('cards');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(tenants.map((t) => t.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const names = tenants.filter((t) => ids.includes(t.id)).map((t) => t.name);
    const preview = names.slice(0, 5).join(', ') + (names.length > 5 ? `… (+${names.length - 5})` : '');
    if (
      !confirm(
        `¿Eliminar ${ids.length} cliente${ids.length === 1 ? '' : 's'}?\n\n${preview}\n\n⚠️ Esto borrará TODOS sus holdings, empresas, marcas, contratos, alertas y datos asociados. La acción no se puede deshacer.`
      )
    )
      return;

    setDeleting(true);
    try {
      const res = await fetch('/api/tenants/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error('No se pudo eliminar', d.error ?? 'Intenta de nuevo.');
        return;
      }
      const data = await res.json();
      toast.success(`${data.deleted} cliente${data.deleted === 1 ? '' : 's'} eliminado${data.deleted === 1 ? '' : 's'}`);
      clearSelection();
      router.refresh();
    } catch {
      toast.error('Error de red');
    } finally {
      setDeleting(false);
    }
  }

  async function deleteSingle(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?\n\n⚠️ Esto borrará TODOS sus holdings, empresas, marcas, contratos, alertas y datos asociados. La acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error('No se pudo eliminar', d.error ?? 'Intenta de nuevo.');
        return;
      }
      toast.success(`"${name}" eliminado`);
      router.refresh();
    } catch {
      toast.error('Error de red');
    } finally {
      setDeleting(false);
    }
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <div>
      {/* Top bar: bulk actions + view toggle */}
      <div className="mb-4 flex items-center justify-between gap-3">
        {/* Bulk actions */}
        {isSuperAdmin && hasSelection ? (
          <div
            className="inline-flex items-center gap-3 rounded-lg border px-3 py-1.5 text-sm"
            style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
          >
            <span style={{ color: '#0F2E3D' }}>
              <strong>{selectedIds.size}</strong> seleccionado{selectedIds.size === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs underline transition-colors"
              style={{ color: '#355B6F' }}
            >
              Limpiar
            </button>
            <span style={{ color: '#C8C4B9' }}>|</span>
            <button
              type="button"
              onClick={bulkDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
              style={{ background: '#B42318', color: '#FFFFFF' }}
            >
              <Trash2 className="size-3.5" />
              {deleting ? 'Eliminando…' : `Eliminar ${selectedIds.size}`}
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* View toggle */}
        <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: '#C8C4B9' }}>
          <button
            onClick={() => setView('cards')}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: view === 'cards' ? '#0F2E3D' : 'transparent',
              color: view === 'cards' ? '#FFFFFF' : '#355B6F',
            }}
            title="Vista de tarjetas"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: view === 'list' ? '#0F2E3D' : 'transparent',
              color: view === 'list' ? '#FFFFFF' : '#355B6F',
            }}
            title="Vista de lista"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {view === 'cards' ? (
        <CardsView
          tenants={tenants}
          isSuperAdmin={isSuperAdmin}
          selectedIds={selectedIds}
          onToggle={toggleSelect}
          onDelete={deleteSingle}
        />
      ) : (
        <ListView
          tenants={tenants}
          isSuperAdmin={isSuperAdmin}
          selectedIds={selectedIds}
          onToggle={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onDelete={deleteSingle}
        />
      )}
    </div>
  );
}

/* ---------- Cards View ---------- */

interface CardsViewProps {
  tenants: TenantRow[];
  isSuperAdmin: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

function CardsView({ tenants, isSuperAdmin, selectedIds, onToggle, onDelete }: CardsViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tenants.map((t) => {
        const isSelected = selectedIds.has(t.id);
        return (
          <div key={t.id} className="relative">
            {isSuperAdmin && (
              <label
                className="absolute left-3 top-3 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-colors"
                style={{
                  borderColor: isSelected ? '#0F2E3D' : '#C8C4B9',
                  background: isSelected ? '#0F2E3D' : '#FFFFFF',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => onToggle(t.id)}
                  aria-label={`Seleccionar ${t.name}`}
                />
                {isSelected && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </label>
            )}

            <Link
              href={`/tenants/${t.id}/panel`}
              className="group block rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md"
              style={{
                borderColor: isSelected ? '#0F2E3D' : '#E8E6E1',
                paddingLeft: isSuperAdmin ? '2.25rem' : '1.25rem',
              }}
            >
              {/* Logo or initial */}
              <div className="mb-4 flex items-center gap-3">
                {t.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.logoUrl}
                    alt={t.name}
                    className="size-10 rounded-lg object-contain"
                  />
                ) : (
                  <div
                    className="flex size-10 items-center justify-center rounded-lg text-lg font-bold text-white"
                    style={{ backgroundColor: '#355B6F' }}
                  >
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3
                    className="truncate text-sm font-semibold group-hover:underline"
                    style={{ color: '#0F2E3D' }}
                  >
                    {t.name}
                  </h3>
                  <p className="truncate font-mono text-xs" style={{ color: '#355B6F' }}>
                    {t.slug}
                  </p>
                </div>
              </div>

              {/* Status + date */}
              <div className="flex items-center justify-between">
                <StatusBadge
                  tone={STATUS_TONE[t.status] ?? 'muted'}
                  label={TENANT_STATUS_LABELS[t.status] ?? t.status}
                />
                <span className="text-xs" style={{ color: '#C8C4B9' }}>
                  {new Date(t.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* A3: micro-KPIs */}
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1" style={{ color: '#355B6F' }}>
                  <Tag className="size-3.5" />
                  <strong style={{ color: '#0F2E3D' }}>{t.brandCount}</strong>
                  {t.brandCount === 1 ? ' marca' : ' marcas'}
                </span>
                <span
                  className="inline-flex items-center gap-1"
                  style={{ color: t.alertCount > 0 ? '#B42318' : '#355B6F' }}
                >
                  <Bell className="size-3.5" />
                  <strong>{t.alertCount}</strong>
                  {t.alertCount === 1 ? ' alerta' : ' alertas'}
                </span>
              </div>

              {/* Quick actions */}
              <div
                className="mt-3 flex gap-1 border-t pt-3"
                style={{ borderColor: '#E8E6E1' }}
                onClick={(e) => e.preventDefault()}
              >
                <Link
                  href={`/tenants/${t.id}/panel`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
                  style={{ color: '#355B6F', backgroundColor: '#F5F4F1' }}
                  title="Panel general"
                >
                  <BarChart3 className="size-3.5" />
                  Panel
                </Link>
                {isSuperAdmin && (
                  <>
                    <Link
                      href={`/tenants/${t.id}/configuracion`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
                      style={{ color: '#355B6F', backgroundColor: '#F5F4F1' }}
                      title="Configurar cliente"
                    >
                      <Settings className="size-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(t.id, t.name);
                      }}
                      className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
                      style={{ color: '#B42318', backgroundColor: 'rgba(180,35,24,0.06)' }}
                      title="Eliminar cliente"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- List View (DsDataTable) ---------- */

interface ListViewProps {
  tenants: TenantRow[];
  isSuperAdmin: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: (id: string, name: string) => void;
}

function ListView({ tenants, isSuperAdmin, selectedIds, onToggle, onSelectAll, onClearSelection, onDelete }: ListViewProps) {
  const allSelected = tenants.length > 0 && selectedIds.size === tenants.length;

  const columns: DsColumn<TenantRow>[] = [];

  if (isSuperAdmin) {
    columns.push({
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => (allSelected ? onClearSelection() : onSelectAll())}
          aria-label="Seleccionar todos"
          className="size-4 cursor-pointer accent-[#0F2E3D]"
        />
      ),
      cell: (t) => (
        <input
          type="checkbox"
          checked={selectedIds.has(t.id)}
          onChange={() => onToggle(t.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Seleccionar ${t.name}`}
          className="size-4 cursor-pointer accent-[#0F2E3D]"
        />
      ),
    });
  }

  columns.push(
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          {t.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.logoUrl}
              alt={t.name}
              className="size-7 rounded object-contain"
            />
          ) : (
            <div
              className="flex size-7 items-center justify-center rounded text-xs font-bold text-white"
              style={{ backgroundColor: '#355B6F' }}
            >
              {t.name.charAt(0).toUpperCase()}
            </div>
          )}
          <strong style={{ color: '#0F2E3D' }}>{t.name}</strong>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      headerTooltip: 'Identificador unico del cliente en URLs y configuraciones internas',
      cell: (t) => (
        <span className="font-mono text-xs" style={{ color: '#355B6F' }}>{t.slug}</span>
      ),
    },
    {
      key: 'brandCount',
      header: 'Marcas',
      sortable: true,
      cell: (t) => (
        <span style={{ color: '#0F2E3D' }} className="font-medium">{t.brandCount}</span>
      ),
    },
    {
      key: 'alertCount',
      header: 'Alertas',
      sortable: true,
      cell: (t) => (
        <span
          className="font-medium"
          style={{ color: t.alertCount > 0 ? '#B42318' : '#355B6F' }}
        >
          {t.alertCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (t) => (
        <StatusBadge
          tone={STATUS_TONE[t.status] ?? 'muted'}
          label={TENANT_STATUS_LABELS[t.status] ?? t.status}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Creado',
      sortable: true,
      cell: (t) =>
        new Date(t.created_at).toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    }
  );

  const rowActions = [
    {
      label: 'Panel',
      icon: <BarChart3 className="size-4" /> as React.ReactNode,
      href: (t: TenantRow) => `/tenants/${t.id}/panel`,
      quickAction: true,
    },
    ...(isSuperAdmin
      ? [
          {
            label: 'Configurar',
            icon: <Settings className="size-4" /> as React.ReactNode,
            href: (t: TenantRow) => `/tenants/${t.id}/configuracion`,
            quickAction: true,
          },
          {
            label: 'Eliminar',
            icon: <Trash2 className="size-4" /> as React.ReactNode,
            onClick: (t: TenantRow) => onDelete(t.id, t.name),
            destructive: true,
          },
        ]
      : []),
  ];

  return (
    <DsDataTable<TenantRow>
      columns={columns}
      rows={tenants}
      getRowId={(t) => t.id}
      rowActions={rowActions}
    />
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGrid, List, BarChart3, Settings } from 'lucide-react';
import { DsDataTable, StatusBadge } from '@/components/ds';
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
}

interface TenantsViewProps {
  tenants: TenantRow[];
  isSuperAdmin: boolean;
}

type ViewMode = 'cards' | 'list';

export function TenantsView({ tenants, isSuperAdmin }: TenantsViewProps) {
  const [view, setView] = useState<ViewMode>('cards');
  const router = useRouter();

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 flex justify-end">
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
        <CardsView tenants={tenants} isSuperAdmin={isSuperAdmin} />
      ) : (
        <ListView tenants={tenants} isSuperAdmin={isSuperAdmin} />
      )}
    </div>
  );
}

/* ---------- Cards View ---------- */

function CardsView({ tenants, isSuperAdmin }: TenantsViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tenants.map((t) => (
        <Link
          key={t.id}
          href={`/tenants/${t.id}/panel`}
          className="group rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md"
          style={{ borderColor: '#E8E6E1' }}
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
              <p className="truncate font-mono text-xs" style={{ color: '#8FB6C7' }}>
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
              <Link
                href={`/tenants/${t.id}/configuracion`}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
                style={{ color: '#355B6F', backgroundColor: '#F5F4F1' }}
                title="Configurar cliente"
              >
                <Settings className="size-3.5" />
              </Link>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------- List View (DsDataTable) ---------- */

function ListView({ tenants, isSuperAdmin }: TenantsViewProps) {
  const columns: DsColumn<TenantRow>[] = [
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
        <span className="font-mono text-xs" style={{ color: '#8FB6C7' }}>{t.slug}</span>
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
    },
  ];

  return (
    <DsDataTable<TenantRow>
      columns={columns}
      rows={tenants}
      getRowId={(t) => t.id}
      rowActions={[
        {
          label: 'Panel',
          icon: <BarChart3 className="size-4" />,
          href: (t) => `/tenants/${t.id}/panel`,
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
            ]
          : []),
      ]}
    />
  );
}

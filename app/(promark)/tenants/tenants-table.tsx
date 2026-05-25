'use client';

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
  created_at: string; // ISO desde el server (Date no se serializa cross-boundary)
}

interface TenantsTableProps {
  tenants: TenantRow[];
  isSuperAdmin: boolean;
}

export function TenantsTable({ tenants, isSuperAdmin }: TenantsTableProps) {
  const columns: DsColumn<TenantRow>[] = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      cell: (t) => <strong className="text-slate-900">{t.name}</strong>,
    },
    {
      key: 'slug',
      header: 'Slug',
      cell: (t) => (
        <span className="font-mono text-xs text-slate-500">{t.slug}</span>
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
        { label: 'Gestionar', href: (t) => `/tenants/${t.id}/structure` },
        { label: 'Ver panel', href: (t) => `/tenants/${t.id}/panel` },
        ...(isSuperAdmin
          ? [
              {
                label: 'Configurar',
                href: (t: TenantRow) => `/tenants/${t.id}/configuracion`,
              },
            ]
          : []),
      ]}
    />
  );
}

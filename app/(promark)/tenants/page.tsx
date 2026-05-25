import Link from 'next/link';
import { requirePromarkAuth } from '@/lib/auth/promark';
import prisma from '@/lib/prisma/client';
import { Plus, Building2 } from 'lucide-react';
import { TENANT_STATUS_LABELS } from '@/lib/i18n/status-labels';
import {
  PageTitle,
  StatusBadge,
  EmptyState,
  DsDataTable,
} from '@/components/ds';
import type { StatusTone, DsColumn } from '@/components/ds';

const STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  SUSPENDED: 'error',
  ONBOARDING: 'warning',
};

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: Date;
}

export default async function TenantsPage() {
  const user = await requirePromarkAuth();

  const tenants = await prisma.tenant.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      created_at: true,
    },
  });

  const columns: DsColumn<TenantRow>[] = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      cell: (t) => (
        <strong className="text-slate-900">{t.name}</strong>
      ),
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
        t.created_at.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
  ];

  return (
    <div>
      <PageTitle
        eyebrow="Workspace"
        title="Clientes"
        subtitle="Gestiona los tenants y sus configuraciones."
        actions={
          user.role === 'SUPERADMIN' ? (
            <Link
              href="/tenants/new"
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <Plus className="size-4" />
              Nuevo cliente
            </Link>
          ) : null
        }
      />

      {tenants.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="No hay clientes registrados"
          description="Crea tu primer cliente para empezar a gestionar su cartera de marcas."
          action={
            user.role === 'SUPERADMIN' ? (
              <Link
                href="/tenants/new"
                className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
              >
                <Plus className="size-4" />
                Crear cliente
              </Link>
            ) : null
          }
        />
      ) : (
        <DsDataTable<TenantRow>
          columns={columns}
          rows={tenants}
          getRowId={(t) => t.id}
          rowActions={[
            {
              label: 'Gestionar',
              href: (t) => `/tenants/${t.id}/structure`,
            },
            {
              label: 'Ver panel',
              href: (t) => `/tenants/${t.id}/panel`,
            },
            ...(user.role === 'SUPERADMIN'
              ? [
                  {
                    label: 'Configurar',
                    href: (t: TenantRow) => `/tenants/${t.id}/configuracion`,
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
}

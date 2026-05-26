import Link from 'next/link';
import { requirePromarkAuth } from '@/lib/auth/promark';
import prisma from '@/lib/prisma/client';
import { Plus, Building2 } from 'lucide-react';
import { PageTitle, EmptyState, CsvToolbar } from '@/components/ds';
import { TenantsTable } from './tenants-table';

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

  const tenantRows = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    status: t.status,
    created_at: t.created_at.toISOString(),
  }));

  const isSuperAdmin = user.role === 'SUPERADMIN';

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Workspace"
        title="Clientes"
        subtitle="Gestiona los clientes y sus configuraciones."
        actions={
          isSuperAdmin ? (
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

      {isSuperAdmin && (
        <CsvToolbar
          endpoint="/api/tenants/csv"
          templateColumns={['nombre', 'slug', 'estado']}
          templateExample={['Mi Empresa S.A.', 'mi-empresa', 'ACTIVE']}
          entityLabel="clientes"
        />
      )}

      {tenantRows.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="No hay clientes registrados"
          description="Crea tu primer cliente para empezar a gestionar su cartera de marcas."
          action={
            isSuperAdmin ? (
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
        <TenantsTable
          tenants={tenantRows}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}

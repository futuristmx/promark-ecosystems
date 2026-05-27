import Link from 'next/link';
import { requirePromarkAuth } from '@/lib/auth/promark';
import prisma from '@/lib/prisma/client';
import { Plus, Building2 } from 'lucide-react';
import { PageTitle, EmptyState, CsvToolbar } from '@/components/ds';
import { TenantsView } from './tenants-view';

export default async function TenantsPage() {
  const user = await requirePromarkAuth();

  const tenants = await prisma.tenant.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      config: true,
      created_at: true,
    },
  });

  // A3: enriquecer cards con micro-KPIs (marcas, alertas pendientes)
  const tenantIds = tenants.map((t) => t.id);
  const [brandCounts, alertCounts] = await Promise.all([
    prisma.brand.groupBy({
      by: ['tenant_id'],
      where: { tenant_id: { in: tenantIds } },
      _count: { _all: true },
    }),
    prisma.alert.groupBy({
      by: ['tenant_id'],
      where: { tenant_id: { in: tenantIds }, status: 'PENDING' },
      _count: { _all: true },
    }),
  ]);

  const brandMap = new Map(brandCounts.map((b) => [b.tenant_id, b._count._all]));
  const alertMap = new Map(alertCounts.map((a) => [a.tenant_id, a._count._all]));

  const tenantRows = tenants.map((t) => {
    const cfg = t.config as { branding?: { logo_url?: string } } | null;
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      created_at: t.created_at.toISOString(),
      logoUrl: cfg?.branding?.logo_url ?? null,
      brandCount: brandMap.get(t.id) ?? 0,
      alertCount: alertMap.get(t.id) ?? 0,
    };
  });

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
        <TenantsView
          tenants={tenantRows}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}

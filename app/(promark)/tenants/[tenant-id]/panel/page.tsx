import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { computeTenantAggregates } from '@/lib/dashboard/tenant-aggregates';
import { computeTenantGraph } from '@/lib/dashboard/tenant-graph';
import { Breadcrumb } from '@/components/breadcrumb';
import { PageTitle } from '@/components/ds';
import { TenantPanelView } from './tenant-panel-view';

interface PanelPageProps {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function TenantPanelPage({ params }: PanelPageProps) {
  await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, config: true },
  });
  if (!tenant) notFound();
  const cfg = (tenant.config ?? {}) as { branding?: { primary_color?: string } };
  const primaryColor = cfg.branding?.primary_color ?? '#0F2E3D';

  const [aggregates, graph, holdings] = await Promise.all([
    computeTenantAggregates({
      tenantId,
      hrefPrefix: `/tenants/${tenantId}`,
    }),
    computeTenantGraph(tenantId),
    prisma.holding.findMany({
      where: { tenant_id: tenantId },
      orderBy: { name: 'asc' },
      include: {
        companies: {
          orderBy: { name: 'asc' },
          include: {
            brands: {
              orderBy: { name: 'asc' },
              select: { id: true, name: true, legal_status: true },
            },
          },
        },
      },
    }),
  ]);

  const treeData = holdings.map((h) => ({
    id: h.id,
    name: h.name,
    companies: h.companies.map((c) => ({
      id: c.id,
      name: c.name,
      brands: c.brands.map((b) => ({
        id: b.id,
        name: b.name,
        legal_status: b.legal_status as string,
      })),
    })),
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          { label: tenant.name, href: `/tenants/${tenantId}/panel` },
          { label: 'Vista general' },
        ]}
      />

      <PageTitle
        eyebrow="Cliente"
        title={tenant.name}
        subtitle="Indicadores, grafo relacional y estructura del cliente"
      />


      <TenantPanelView
        tenantId={tenantId}
        aggregates={aggregates}
        graph={graph}
        tree={treeData}
        primaryColor={primaryColor}
      />
    </div>
  );
}

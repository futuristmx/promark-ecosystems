import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { PageTitle } from '@/components/ds';
import { Breadcrumb } from '@/components/breadcrumb';
import { PromarkFinancialDashboard } from './promark-financial-dashboard';

export interface BillingConcept {
  key: string;
  label: string;
  description: string | null;
  amount: number;
  currency: string;
  category: string;
  order: number;
}

export interface ProjectionBucket {
  label: string;
  days: number;
  brands: number;
  contracts: number;
  licenses: number;
  useDeclarations: number;
}

export default async function PromarkFinancialPage() {
  const session = await requirePromarkAuth();
  const { assertPromarkPermission } = await import('@/lib/auth/promark-permissions');
  await assertPromarkPermission(session.role, 'view_financiero');

  const now = new Date();
  const buckets = [30, 60, 90, 180, 365] as const;
  const dateFor = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  // Agregaciones GLOBALES (no filtramos por tenant_id)
  const [
    activeTenants,
    totalBrands,
    inProgress,
    totalContracts,
    totalLicenses,
    configs,
    ...bucketResults
  ] = await Promise.all([
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.brand.count(),
    prisma.brand.count({ where: { legal_status: 'IN_PROGRESS' } }),
    prisma.contract.count({ where: { status: 'ACTIVE', deleted_at: null } }),
    prisma.license.count({ where: { status: 'ACTIVE' } }),
    prisma.promarkBillingConfig.findMany({ orderBy: { order: 'asc' } }),
    // Por cada bucket: brands renewable + contracts expiring + licenses expiring + use declarations
    ...buckets.flatMap((d) => [
      prisma.brand.count({
        where: {
          expiration_date: { gte: now, lte: dateFor(d) },
          legal_status: { in: ['REGISTERED', 'RENEWED'] },
        },
      }),
      prisma.contract.count({
        where: {
          expiration_date: { gte: now, lte: dateFor(d) },
          status: 'ACTIVE',
          deleted_at: null,
        },
      }),
      prisma.license.count({
        where: {
          expiration_date: { gte: now, lte: dateFor(d) },
          status: 'ACTIVE',
        },
      }),
      // Use declarations: brands con use_declaration_date en el bucket
      prisma.brand.count({
        where: {
          use_declaration_date: { gte: now, lte: dateFor(d) },
          legal_status: { in: ['REGISTERED', 'RENEWED'] },
        },
      }),
    ]),
  ]);

  // Reconstruir buckets (4 valores por bucket)
  const projection: ProjectionBucket[] = buckets.map((d, i) => ({
    label: `${d}d`,
    days: d,
    brands: bucketResults[i * 4] as number,
    contracts: bucketResults[i * 4 + 1] as number,
    licenses: bucketResults[i * 4 + 2] as number,
    useDeclarations: bucketResults[i * 4 + 3] as number,
  }));

  const billingConcepts: BillingConcept[] = configs.map((c) => ({
    key: c.key,
    label: c.label,
    description: c.description,
    amount: c.amount.toNumber(),
    currency: c.currency,
    category: c.category,
    order: c.order,
  }));

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Financiero' }]} />
      <PageTitle
        eyebrow="Módulo financiero · Promark"
        title="Proyección Financiera"
        subtitle={`Ingresos proyectados agregando ${activeTenants} cliente${activeTenants !== 1 ? 's' : ''} activo${activeTenants !== 1 ? 's' : ''}.`}
      />
      <PromarkFinancialDashboard
        activeTenants={activeTenants}
        totalBrands={totalBrands}
        inProgressBrands={inProgress}
        totalContracts={totalContracts}
        totalLicenses={totalLicenses}
        projection={projection}
        billingConcepts={billingConcepts}
      />
    </div>
  );
}

import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { PageTitle } from '@/components/ds';
import { Breadcrumb } from '@/components/breadcrumb';
import { FinancialDashboard } from './financial-dashboard';

interface Props {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function FinancialPage({ params }: Props) {
  await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });
  if (!tenant) notFound();

  const now = new Date();
  const in30 = new Date(now); in30.setDate(in30.getDate() + 30);
  const in60 = new Date(now); in60.setDate(in60.getDate() + 60);
  const in90 = new Date(now); in90.setDate(in90.getDate() + 90);

  const [renewals30, renewals60, renewals90, totalBrands] = await Promise.all([
    prisma.brand.count({
      where: { tenant_id: tenantId, expiration_date: { gte: now, lte: in30 }, legal_status: { in: ['REGISTERED', 'RENEWED'] } },
    }),
    prisma.brand.count({
      where: { tenant_id: tenantId, expiration_date: { gt: in30, lte: in60 }, legal_status: { in: ['REGISTERED', 'RENEWED'] } },
    }),
    prisma.brand.count({
      where: { tenant_id: tenantId, expiration_date: { gt: in60, lte: in90 }, legal_status: { in: ['REGISTERED', 'RENEWED'] } },
    }),
    prisma.brand.count({ where: { tenant_id: tenantId } }),
  ]);

  return (
    <div className="space-y-8">
      <Breadcrumb items={[
        { label: 'Clientes', href: '/tenants' },
        { label: tenant.name, href: `/tenants/${tenantId}/panel` },
        { label: 'Financiero' },
      ]} />
      <PageTitle
        eyebrow="Módulo financiero"
        title="Panorama Financiero"
        subtitle={`Proyección de renovaciones y costos para ${tenant.name}.`}
      />
      <FinancialDashboard
        tenantId={tenantId}
        renewals30={renewals30}
        renewals60={renewals60}
        renewals90={renewals90}
        totalBrands={totalBrands}
      />
    </div>
  );
}

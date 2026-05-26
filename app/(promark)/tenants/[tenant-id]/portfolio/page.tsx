import { requirePromarkAuth } from '@/lib/auth/promark';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { Breadcrumb } from '@/components/breadcrumb';
import { PageTitle } from '@/components/ds';
import { PortfolioTabs } from './portfolio-tabs';

interface Props {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function PortfolioPage({ params }: Props) {
  const session = await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });
  if (!tenant) notFound();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          { label: tenant.name, href: `/tenants/${tenantId}/panel` },
          { label: 'Portafolio' },
        ]}
      />
      <PageTitle
        eyebrow={tenant.name}
        title="Portafolio"
        subtitle="Marcas, titulares, contratos y licencias del cliente."
      />
      <PortfolioTabs tenantId={tenantId} userRole={session.role} />
    </div>
  );
}

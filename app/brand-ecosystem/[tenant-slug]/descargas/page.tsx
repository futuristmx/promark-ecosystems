import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { DownloadsView } from './downloads-view';

interface Props {
  params: Promise<{ 'tenant-slug': string }>;
}

export default async function DescargasPage({ params }: Props) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientSession(tenantSlug);

  const [companies, classesInTenant, brandsCount] = await Promise.all([
    prisma.company.findMany({
      where: { tenant_id: session.tenant_id, status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.brandClass.groupBy({
      by: ['class_number'],
      where: { brand: { tenant_id: session.tenant_id } },
      orderBy: { class_number: 'asc' },
    }),
    prisma.brand.count({ where: { tenant_id: session.tenant_id } }),
  ]);

  return (
    <DownloadsView
      tenantSlug={tenantSlug}
      companies={companies}
      availableClasses={classesInTenant.map((c) => c.class_number)}
      brandsCount={brandsCount}
    />
  );
}

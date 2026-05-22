import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { ClientContractsView } from './client-contracts-view';

interface Props {
  params: Promise<{ 'tenant-slug': string }>;
}

export default async function ClientContractsPage({ params }: Props) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientSession(tenantSlug);

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, config: true },
  });
  if (!tenant) notFound();
  const cfg = tenant.config as { features?: { show_contracts?: boolean } } | null;
  if (!cfg?.features?.show_contracts) notFound();
  if (session.role === 'CLIENT_VIEWER') notFound();

  return <ClientContractsView tenantSlug={tenantSlug} />;
}

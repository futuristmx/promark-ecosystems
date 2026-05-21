import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ 'tenant-id': string }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, status: true },
  });

  if (!tenant) {
    notFound();
  }

  return <>{children}</>;
}

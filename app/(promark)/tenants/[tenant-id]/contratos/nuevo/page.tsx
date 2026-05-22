import { requirePromarkAuth } from '@/lib/auth/promark';
import prisma from '@/lib/prisma/client';
import { ContractFormView } from '../contract-form-view';

interface Props {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function NewContractPage({ params }: Props) {
  await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;
  const brands = await prisma.brand.findMany({
    where: { tenant_id: tenantId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return <ContractFormView tenantId={tenantId} brands={brands} />;
}

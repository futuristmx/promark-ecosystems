import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { ContractDetailView } from './contract-detail-view';

interface Props {
  params: Promise<{ 'tenant-id': string; 'contract-id': string }>;
}

export default async function ContractDetailPage({ params }: Props) {
  const session = await requirePromarkAuth();
  const { 'tenant-id': tenantId, 'contract-id': contractId } = await params;
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenantId, deleted_at: null },
    include: {
      contract_brands: { include: { brand: { select: { id: true, name: true } } } },
    },
  });
  if (!contract) notFound();
  const brands = await prisma.brand.findMany({
    where: { tenant_id: tenantId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return (
    <ContractDetailView
      tenantId={tenantId}
      userRole={session.role}
      contract={JSON.parse(JSON.stringify(contract))}
      availableBrands={brands}
    />
  );
}

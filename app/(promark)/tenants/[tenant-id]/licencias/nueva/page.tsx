import { requirePromarkAuth } from '@/lib/auth/promark';
import prisma from '@/lib/prisma/client';
import { LicenseFormView } from '../license-form-view';

interface Props {
  params: Promise<{ 'tenant-id': string }>;
  searchParams: Promise<{ contract_id?: string }>;
}

export default async function NewLicensePage({ params, searchParams }: Props) {
  await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;
  const { contract_id } = await searchParams;
  const brands = await prisma.brand.findMany({
    where: { tenant_id: tenantId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  const contracts = await prisma.contract.findMany({
    where: { tenant_id: tenantId, deleted_at: null },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });
  return (
    <LicenseFormView
      tenantId={tenantId}
      brands={brands}
      contracts={contracts}
      initialContractId={contract_id ?? null}
    />
  );
}

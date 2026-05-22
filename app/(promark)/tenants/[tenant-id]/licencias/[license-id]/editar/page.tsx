import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { LicenseFormView } from '../../license-form-view';

interface Props {
  params: Promise<{ 'tenant-id': string; 'license-id': string }>;
}

export default async function EditLicensePage({ params }: Props) {
  await requirePromarkAuth();
  const { 'tenant-id': tenantId, 'license-id': licenseId } = await params;
  const license = await prisma.license.findFirst({
    where: { id: licenseId, tenant_id: tenantId, deleted_at: null },
  });
  if (!license) notFound();
  const brands = await prisma.brand.findMany({
    where: { tenant_id: tenantId }, select: { id: true, name: true }, orderBy: { name: 'asc' },
  });
  const contracts = await prisma.contract.findMany({
    where: { tenant_id: tenantId, deleted_at: null }, select: { id: true, title: true }, orderBy: { title: 'asc' },
  });
  return (
    <LicenseFormView
      tenantId={tenantId}
      brands={brands}
      contracts={contracts}
      initialContractId={null}
      license={JSON.parse(JSON.stringify(license))}
    />
  );
}

import { redirect } from 'next/navigation';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { PageTitle } from '@/components/ds';
import { NewTenantForm } from './new-tenant-form';

export default async function NewTenantPage() {
  const user = await requirePromarkAuth();
  const { assertPromarkPermission } = await import('@/lib/auth/promark-permissions');
  await assertPromarkPermission(user.role, 'manage_tenants', '/tenants');

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        eyebrow="Workspace"
        title="Nuevo cliente"
        subtitle="Crea un nuevo tenant con su branding inicial. El slug se autogenera del nombre si lo dejas vacío. Después podrás configurar usuarios, holdings y módulos activos."
      />
      <NewTenantForm />
    </div>
  );
}

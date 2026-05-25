import { redirect } from 'next/navigation';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { NewTenantForm } from './new-tenant-form';

export default async function NewTenantPage() {
  const user = await requirePromarkAuth();
  if (user.role !== 'SUPERADMIN') {
    redirect('/tenants');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Nuevo cliente</h1>
      <p className="mb-6 text-sm text-slate-500">
        Crea un nuevo tenant con su branding inicial. El slug se autogenera del
        nombre si lo dejas vacío. Después podrás configurar usuarios, holdings
        y módulos activos.
      </p>
      <NewTenantForm />
    </div>
  );
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyClientJWT } from '@/lib/auth/client-pin';
import { ClientLoginForm } from './login-form';

export default async function ClientLoginPage({
  params,
}: {
  params: Promise<{ 'tenant-slug': string }>;
}) {
  const { 'tenant-slug': tenantSlug } = await params;

  // F5: si ya hay sesión válida para este tenant, ir directo al panel.
  // Sin esto, el usuario veía sidebar autenticado + form de login simultáneamente.
  const cookieStore = await cookies();
  const token = cookieStore.get('promark-client-token')?.value;
  if (token) {
    try {
      const payload = await verifyClientJWT(token);
      if (payload.tenant_slug === tenantSlug) {
        redirect(`/brand-ecosystem/${tenantSlug}/panel`);
      }
    } catch {
      // Token inválido o expirado — cae al formulario normalmente.
    }
  }

  return <ClientLoginForm tenantSlug={tenantSlug} />;
}

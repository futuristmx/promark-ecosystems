import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { verifyClientJWT } from '@/lib/auth/client-pin';
import { ClientLoginForm } from './login-form';

export default async function ClientLoginPage({
  params,
}: {
  params: Promise<{ 'tenant-slug': string }>;
}) {
  const { 'tenant-slug': tenantSlug } = await params;

  // F5: si ya hay sesión válida para este tenant, ir directo al panel.
  const cookieStore = await cookies();
  const token = cookieStore.get('promark-client-token')?.value;
  if (token) {
    try {
      const payload = await verifyClientJWT(token);
      if (payload.tenant_slug === tenantSlug) {
        redirect(`/brand-ecosystem/${tenantSlug}/panel`);
      }
    } catch {
      // Token inválido — cae al formulario.
    }
  }

  // B1: cargar nombre y branding del tenant para personalizar el login.
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { name: true, config: true },
  });
  if (!tenant) notFound();

  const cfg = tenant.config as {
    branding?: { primary_color?: string; logo_url?: string };
  } | null;
  const primaryColor = cfg?.branding?.primary_color ?? null;
  const logo = cfg?.branding?.logo_url ?? null;

  return (
    <ClientLoginForm
      tenantSlug={tenantSlug}
      tenantName={tenant.name}
      primaryColor={primaryColor}
      logo={logo}
    />
  );
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyClientJWT } from '@/lib/auth/client-pin';
import prisma from '@/lib/prisma/client';

export default async function PortalPage({
  params,
}: {
  params: Promise<{ 'tenant-slug': string }>;
}) {
  const { 'tenant-slug': tenantSlug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('promark-client-token')?.value;

  if (!token) {
    redirect(`/brand-ecosystem/${tenantSlug}/login`);
  }

  let payload;
  try {
    payload = await verifyClientJWT(token);
  } catch {
    redirect(`/brand-ecosystem/${tenantSlug}/login`);
  }

  // Ensure token belongs to this tenant
  if (payload.tenant_slug !== tenantSlug) {
    redirect(`/brand-ecosystem/${tenantSlug}/login`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { name: true },
  });

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Bienvenido al portal de {tenant?.name ?? tenantSlug}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Hola, has iniciado sesion como{' '}
          <span className="font-medium text-slate-700">{payload.role}</span>.
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8">
          <p className="text-sm text-slate-400">
            Modulos disponibles proximamente
          </p>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { headers } from 'next/headers';

/**
 * 404 branded para el portal cliente. Reemplaza la pantalla negra inglesa
 * default de Next que se mostraba cuando una página llamaba notFound() o
 * el usuario pegaba una URL inválida bajo /brand-ecosystem/[slug]/...
 *
 * Nota: este not-found.tsx se renderiza DENTRO del layout del tenant, así
 * que conserva sidebar + branding del cliente. El componente solo provee
 * el contenido del main area.
 */
export default async function TenantNotFound() {
  // Extraer el tenant slug del URL para construir un link de regreso.
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('referer') || '';
  const match = pathname.match(/\/brand-ecosystem\/([^/?#]+)/);
  const tenantSlug = match?.[1] ?? null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="max-w-md">
        <p className="text-6xl font-bold text-slate-200">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          La página que intentas abrir no existe, fue movida, o tu rol no
          tiene acceso a ella. Si crees que es un error, contacta al
          administrador de tu portal.
        </p>
        {tenantSlug && (
          <Link
            href={`/brand-ecosystem/${tenantSlug}/panel`}
            className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Volver al panel
          </Link>
        )}
      </div>
    </div>
  );
}

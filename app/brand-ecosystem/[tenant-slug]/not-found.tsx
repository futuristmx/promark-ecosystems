import Link from 'next/link';
import { headers } from 'next/headers';

/**
 * 404 branded para el portal cliente. Se renderiza DENTRO del layout del
 * tenant, así que conserva sidebar + branding del cliente.
 */
export default async function TenantNotFound() {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('referer') || '';
  const match = pathname.match(/\/brand-ecosystem\/([^/?#]+)/);
  const tenantSlug = match?.[1] ?? null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="max-w-md">
        <p className="text-6xl font-bold" style={{ color: '#E2DED6' }}>404</p>
        <h1 className="mt-4 text-2xl font-bold" style={{ color: '#0F2E3D' }}>
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm" style={{ color: '#355B6F' }}>
          La página que intentas abrir no existe, fue movida, o tu rol no
          tiene acceso a ella. Si crees que es un error, contacta al
          administrador de tu portal.
        </p>
        {tenantSlug && (
          <Link
            href={`/brand-ecosystem/${tenantSlug}/panel`}
            className="mt-6 inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
              color: '#FBF6EC',
              boxShadow: '0 2px 8px rgba(15,46,61,0.2)',
            }}
          >
            Volver al panel
          </Link>
        )}
      </div>
    </div>
  );
}

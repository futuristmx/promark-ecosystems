import Link from 'next/link';

/**
 * 404 global branded en español. Reemplaza la pantalla negra inglesa
 * default de Next para URLs inválidas fuera del portal cliente.
 */
export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-20 text-center">
      <div className="max-w-md">
        <p className="text-7xl font-bold text-slate-200">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          La URL que ingresaste no existe en Promark®. Verifica el enlace o
          regresa al panel principal.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

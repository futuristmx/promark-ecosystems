import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function TenantNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900">Cliente no encontrado</h1>
        <p className="mt-2 text-sm text-slate-500">
          El cliente que buscas no existe o fue eliminado.
        </p>
        <Link
          href="/tenants"
          className="mt-4 inline-flex items-center rounded-md bg-[#3E6AE1] px-4 py-2 text-sm font-medium text-white hover:bg-[#3458bd]"
        >
          Volver a clientes
        </Link>
      </div>
    </div>
  );
}

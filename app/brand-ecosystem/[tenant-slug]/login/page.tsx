'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientLoginPage({
  params,
}: {
  params: Promise<{ 'tenant-slug': string }>;
}) {
  const { 'tenant-slug': tenantSlug } = use(params);
  const router = useRouter();

  const [cardId, setCardId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/client-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardId,
          pin,
          tenant_slug: tenantSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const messages: Record<string, string> = {
          TENANT_NOT_FOUND: 'Portal no encontrado.',
          USER_NOT_FOUND: 'ID de tarjeta no reconocido.',
          ACCOUNT_LOCKED:
            'Cuenta bloqueada temporalmente. Intenta de nuevo mas tarde.',
          INVALID_PIN: 'PIN incorrecto.',
          USER_INACTIVE: 'Tu cuenta esta inactiva. Contacta al administrador.',
        };
        setError(messages[data.error] ?? 'Error de autenticacion.');
        return;
      }

      // Store JWT in cookie (set via response, but also manually for immediate use)
      document.cookie = `promark-client-token=${data.token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`;

      router.push(`/brand-ecosystem/${tenantSlug}/portal`);
      router.refresh();
    } catch {
      setError('Ocurrio un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            Portal de Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa con tu tarjeta y PIN
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="card-id"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              ID de Tarjeta
            </label>
            <input
              id="card-id"
              type="text"
              required
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: CARD-001"
            />
          </div>

          <div>
            <label
              htmlFor="pin"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              PIN (4-6 dígitos)
            </label>
            <input
              id="pin"
              type="password"
              required
              inputMode="numeric"
              minLength={4}
              maxLength={6}
              pattern="[0-9]{4,6}"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.3em] text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="----"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

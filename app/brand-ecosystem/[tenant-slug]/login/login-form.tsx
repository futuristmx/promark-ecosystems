'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ClientLoginForm({ tenantSlug }: { tenantSlug: string }) {
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
            'Cuenta bloqueada temporalmente. Intenta de nuevo más tarde.',
          INVALID_PIN: 'PIN incorrecto.',
          USER_INACTIVE: 'Tu cuenta está inactiva. Contacta al administrador.',
        };
        setError(messages[data.error] ?? 'Error de autenticación.');
        return;
      }

      // Store JWT in cookie (set via response, but also manually for immediate use)
      document.cookie = `promark-client-token=${data.token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`;

      // G2: redirect direct to /panel (dashboard), not /portal redirect chain.
      router.push(`/brand-ecosystem/${tenantSlug}/panel`);
      router.refresh();
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#FBF6EC',
    borderColor: '#E2DED6',
    color: '#1A1E23',
  };

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = '#D39A2B';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.12)';
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = '#E2DED6';
    e.currentTarget.style.boxShadow = 'none';
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0B1F2A 0%, #0F2E3D 40%, #1C3F55 100%)',
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(211,154,43,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-3xl border px-8 pb-10 pt-12"
          style={{
            background: 'linear-gradient(180deg, rgba(251,246,236,0.97) 0%, rgba(241,237,227,0.97) 100%)',
            borderColor: 'rgba(226,222,214,0.6)',
            boxShadow:
              '0 25px 50px -12px rgba(11,31,42,0.4), 0 0 80px rgba(211,154,43,0.06)',
          }}
        >
          {/* Logo */}
          <div className="mb-10 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/promark-icon.svg"
              alt="Promark"
              className="mb-4 h-16 w-16"
            />
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: '#0F2E3D' }}
            >
              Portal de Clientes
            </h1>
            <p
              className="mt-1 text-xs font-medium"
              style={{ color: '#355B6F' }}
            >
              Ingresa con tu tarjeta y PIN
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'rgba(180,35,24,0.06)',
                border: '1px solid rgba(180,35,24,0.15)',
                color: '#B42318',
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="card-id"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#355B6F' }}
              >
                ID de Tarjeta
              </label>
              <input
                id="card-id"
                type="text"
                required
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Ej: CARD-001"
              />
            </div>

            <div>
              <label
                htmlFor="pin"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#355B6F' }}
              >
                PIN (4–6 dígitos)
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
                className="w-full rounded-xl border px-4 py-3 text-center text-lg tracking-[0.3em] transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="• • • •"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl px-4 py-3.5 text-sm font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #D39A2B 0%, #E8B84A 100%)',
                color: '#0B1F2A',
                boxShadow: '0 4px 14px rgba(211,154,43,0.3)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(211,154,43,0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(211,154,43,0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          className="mt-8 text-center text-[11px] tracking-wide"
          style={{ color: 'rgba(251,246,236,0.4)' }}
        >
          © {new Date().getFullYear()} Promark® · Inteligencia Marcaria
        </p>
      </div>
    </div>
  );
}

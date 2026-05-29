'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ClientLoginFormProps {
  tenantSlug: string;
  tenantName: string;
  primaryColor?: string | null;
  logo?: string | null;
}

export function ClientLoginForm({
  tenantSlug,
  tenantName,
  primaryColor,
  logo,
}: ClientLoginFormProps) {
  const router = useRouter();

  const [cardId, setCardId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const accent = primaryColor || '#D39A2B';

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
        setAttempts((prev) => prev + 1);
        return;
      }

      // El cookie HttpOnly + Secure ya fue seteado por el endpoint /api/auth/client-pin.
      // No tocamos document.cookie (XSS vector si fuera readable).

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
    e.currentTarget.style.borderColor = accent;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}1f`;
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
          {/* B1: Logo + identidad del tenant */}
          <div className="mb-10 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo || '/promark-icon.svg'}
              alt={tenantName}
              className="mb-4 h-16 w-16 rounded-xl object-contain"
              style={logo ? { background: '#FBF6EC', padding: 4 } : undefined}
            />
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: accent }}
            >
              Portal de Clientes
            </p>
            <h1
              className="mt-1 text-xl font-bold tracking-tight"
              style={{ color: '#0F2E3D' }}
            >
              {tenantName}
            </h1>
            <p
              className="mt-2 text-xs font-medium"
              style={{ color: '#355B6F' }}
            >
              Ingresa con tu tarjeta y PIN
            </p>
          </div>

          {/* Error + indicador de intentos */}
          {error && (
            <div
              className="mb-6 rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'rgba(180,35,24,0.06)',
                border: '1px solid rgba(180,35,24,0.15)',
                color: '#B42318',
              }}
            >
              <div className="font-medium">{error}</div>
              {attempts >= 2 && attempts < 5 && (
                <div className="mt-1 text-[11px]" style={{ opacity: 0.75 }}>
                  {attempts}/5 intentos. La cuenta se bloqueará temporalmente al 5º error.
                </div>
              )}
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
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}DD 100%)`,
                color: '#0B1F2A',
                boxShadow: `0 4px 14px ${accent}4D`,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = `0 6px 20px ${accent}66`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 14px ${accent}4D`;
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

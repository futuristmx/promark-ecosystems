'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('message') === 'session_expired';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
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
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#0F2E3D' }}
            >
              Promark®
            </h1>
            <p
              className="mt-1 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: '#355B6F' }}
            >
              Inteligencia Marcaria
            </p>
          </div>

          {/* Session expired */}
          {sessionExpired && !error && (
            <div
              className="mb-6 rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'rgba(211,154,43,0.1)',
                border: '1px solid rgba(211,154,43,0.25)',
                color: '#92400E',
              }}
            >
              Tu sesión expiró, inicia sesión nuevamente.
            </div>
          )}

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
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#355B6F' }}
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
                style={{
                  background: '#FBF6EC',
                  borderColor: '#E2DED6',
                  color: '#1A1E23',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#D39A2B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2DED6';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#355B6F' }}
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none"
                style={{
                  background: '#FBF6EC',
                  borderColor: '#E2DED6',
                  color: '#1A1E23',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#D39A2B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,154,43,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2DED6';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="••••••••"
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
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0B1F2A 0%, #0F2E3D 40%, #1C3F55 100%)' }}
        />
      }
    >
      <LoginForm />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, AlertTriangle, Copy, Check } from 'lucide-react';
import { HelpTip, useToast } from '@/components/ds';

interface Props {
  tenantId: string;
  tenantName: string;
  currentSlug: string;
}

export function PortalTab({ tenantId, tenantName, currentSlug }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [slug, setSlug] = useState(currentSlug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const slugChanged = slug !== currentSlug;
  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!slugChanged || !slugValid) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Error al guardar.');
        return;
      }
      setSuccess('URL del portal actualizada. Los enlaces anteriores dejarán de funcionar.');
      router.refresh();
    } catch {
      setError('Error de red.');
    } finally {
      setSaving(false);
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <form onSubmit={handleSave}>
      {error && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(180,35,24,0.06)', border: '1px solid rgba(180,35,24,0.15)', color: '#B42318' }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(47,107,79,0.08)', border: '1px solid rgba(47,107,79,0.2)', color: '#2F6B4F' }}
        >
          {success}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          {/* Slug editor */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <Globe className="size-4" style={{ color: '#0F2E3D' }} />
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                URL del portal
              </h3>
              <HelpTip>
                El slug forma parte de la URL pública del portal. Cambiarlo
                invalida los enlaces anteriores y las sesiones activas.
              </HelpTip>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              El slug define la dirección web del portal del cliente.
            </p>

            <div className="mt-4">
              <div
                className="flex items-center overflow-hidden rounded-xl border"
                style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
              >
                <span
                  className="shrink-0 px-3 py-3 text-xs font-medium"
                  style={{ color: '#C8C4B9', background: 'rgba(226,222,214,0.4)' }}
                >
                  /brand-ecosystem/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '')
                        .replace(/--+/g, '-')
                    )
                  }
                  className="w-full border-0 bg-transparent px-3 py-3 font-mono text-sm focus:outline-none"
                  style={{ color: '#1A1E23' }}
                />
              </div>

              {slug && !slugValid && (
                <p className="mt-2 text-xs" style={{ color: '#B42318' }}>
                  Mínimo 3 caracteres. Solo letras minúsculas, números y guiones.
                </p>
              )}
            </div>

            {/* Live URL preview */}
            <div className="mt-4">
              <p className="text-[11px] font-medium" style={{ color: '#355B6F' }}>
                URL completa del portal:
              </p>
              <div className="mt-1 flex items-stretch gap-2">
                <code
                  className="flex-1 rounded-lg px-3 py-2 text-xs"
                  style={{ background: 'rgba(15,46,61,0.05)', color: '#0F2E3D' }}
                >
                  {baseUrl}/brand-ecosystem/<strong>{slug || '...'}</strong>/login
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${baseUrl}/brand-ecosystem/${slug}/login`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    toast.success('URL copiada al portapapeles');
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all"
                  style={{
                    borderColor: copied ? 'rgba(47,107,79,0.3)' : '#E2DED6',
                    background: copied ? 'rgba(47,107,79,0.08)' : '#FBF6EC',
                    color: copied ? '#2F6B4F' : '#355B6F',
                  }}
                  title="Copiar URL"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          {/* Warning */}
          {slugChanged && slugValid && (
            <div
              className="flex items-start gap-3 rounded-2xl border p-5"
              style={{
                borderColor: 'rgba(211,154,43,0.3)',
                background: 'rgba(211,154,43,0.06)',
              }}
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0" style={{ color: '#D39A2B' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#0F2E3D' }}>
                  Cambio de URL
                </p>
                <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
                  Al cambiar el slug, todos los enlaces existentes del portal de {tenantName} dejarán
                  de funcionar. Los clientes que tengan la URL guardada necesitarán el nuevo enlace.
                  Las sesiones activas se invalidarán.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl border p-6"
            style={{
              borderColor: '#E2DED6',
              background: 'linear-gradient(135deg, #F1EDE3 0%, #FBF6EC 100%)',
            }}
          >
            <h4
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#355B6F' }}
            >
              Información
            </h4>
            <div className="mt-4 space-y-3 text-xs" style={{ color: '#355B6F' }}>
              <p>
                <strong style={{ color: '#0F2E3D' }}>Slug actual:</strong>{' '}
                <code className="rounded px-1 py-0.5 font-mono" style={{ background: 'rgba(15,46,61,0.06)' }}>
                  {currentSlug}
                </code>
              </p>
              <p>
                <strong style={{ color: '#0F2E3D' }}>Cliente:</strong> {tenantName}
              </p>
              <p>
                El slug aparece en la URL del portal, la página de login y
                todos los enlaces que compartas con el cliente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      {slugChanged && slugValid && (
        <div className="mt-10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl px-6 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D39A2B 0%, #E8B84A 100%)',
              color: '#0B1F2A',
              boxShadow: '0 4px 14px rgba(211,154,43,0.3)',
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(211,154,43,0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(211,154,43,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {saving ? 'Guardando…' : 'Actualizar URL del portal'}
          </button>
        </div>
      )}
    </form>
  );
}

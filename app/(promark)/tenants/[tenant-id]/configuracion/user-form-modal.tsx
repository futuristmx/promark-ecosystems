'use client';

import { useState } from 'react';
import { X, Loader2, UserPlus, Save, Eye, EyeOff } from 'lucide-react';

export interface ClientUserDraft {
  id?: string;
  full_name: string;
  email: string;
  role: 'CLIENT_ADMIN' | 'CLIENT_VIEWER' | 'CLIENT_LEGAL_REP';
  status?: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
  card_id?: string;
}

interface Props {
  tenantId: string;
  mode: 'create' | 'edit';
  initial?: ClientUserDraft;
  roleLabels: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}

const STATUSES: Array<{ value: 'ACTIVE' | 'INACTIVE' | 'REVOKED'; label: string }> = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'REVOKED', label: 'Revocado' },
];

export function UserFormModal({
  tenantId,
  mode,
  initial,
  roleLabels,
  onClose,
  onSaved,
}: Props) {
  const [fullName, setFullName] = useState(initial?.full_name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [userRole, setUserRole] = useState<ClientUserDraft['role']>(
    initial?.role ?? 'CLIENT_VIEWER'
  );
  const [status, setStatus] = useState<NonNullable<ClientUserDraft['status']>>(
    initial?.status ?? 'ACTIVE'
  );
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url =
        mode === 'create'
          ? `/api/tenants/${tenantId}/users`
          : `/api/tenants/${tenantId}/users/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const body =
        mode === 'create'
          ? { full_name: fullName, email, role: userRole, initialPin: pin }
          : { full_name: fullName, email, role: userRole, status };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar.');
      } else {
        onSaved();
        onClose();
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,46,61,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl"
        style={{ background: '#FBF6EC', borderColor: '#E2DED6' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: '#E2DED6' }}
        >
          <div className="flex items-center gap-2">
            {mode === 'create' ? (
              <UserPlus className="size-4" style={{ color: '#0F2E3D' }} />
            ) : (
              <Save className="size-4" style={{ color: '#0F2E3D' }} />
            )}
            <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
              {mode === 'create' ? 'Nuevo usuario del portal' : 'Editar usuario'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 transition-colors hover:bg-black/5"
            style={{ color: '#355B6F' }}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <Field label="Nombre completo">
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#1A1E23' }}
            />
          </Field>

          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#1A1E23' }}
            />
          </Field>

          <Field label="Rol">
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as ClientUserDraft['role'])}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#1A1E23' }}
            >
              <option value="CLIENT_ADMIN">{roleLabels.CLIENT_ADMIN ?? 'Administrador'}</option>
              <option value="CLIENT_VIEWER">{roleLabels.CLIENT_VIEWER ?? 'Visor'}</option>
              <option value="CLIENT_LEGAL_REP">
                {roleLabels.CLIENT_LEGAL_REP ?? 'Rep. Legal'}
              </option>
            </select>
          </Field>

          {mode === 'edit' && (
            <Field label="Estado">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#1A1E23' }}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {mode === 'create' && (
            <Field label="PIN inicial (mín. 4)">
              <div className="relative">
                <input
                  required
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  minLength={4}
                  className="w-full rounded-lg border px-3 py-2 pr-9 text-sm focus:outline-none"
                  style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#1A1E23' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: '#355B6F' }}
                >
                  {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
          )}

          {mode === 'edit' && initial?.card_id && (
            <p className="text-[11px]" style={{ color: '#355B6F' }}>
              ID de tarjeta: <span className="font-mono">{initial.card_id}</span> (no se puede
              cambiar)
            </p>
          )}

          {error && (
            <div
              className="rounded-lg border px-3 py-2 text-xs"
              style={{
                borderColor: 'rgba(180,35,24,0.25)',
                background: 'rgba(180,35,24,0.06)',
                color: '#B42318',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#355B6F' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                color: '#FBF6EC',
              }}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: '#355B6F' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

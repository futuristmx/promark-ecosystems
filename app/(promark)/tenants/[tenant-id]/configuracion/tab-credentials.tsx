'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, User, Copy, Check, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { HelpTip } from '@/components/ds';
import { RolesPermissionsEditor, type RoleOverrides } from './roles-permissions-editor';
import { UserFormModal, type ClientUserDraft } from './user-form-modal';

interface ClientUser {
  id: string;
  full_name: string;
  email: string;
  card_id: string;
  role: string;
  status: string;
  pin_generated_at: string | null;
}

interface Props {
  tenantId: string;
  tenantName: string;
  clientUsers: ClientUser[];
  roleOverrides: RoleOverrides;
}

const ROLE_LABEL_DEFAULT: Record<string, string> = {
  CLIENT_ADMIN: 'Administrador',
  CLIENT_VIEWER: 'Visor',
  CLIENT_LEGAL_REP: 'Rep. Legal',
};

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  ACTIVE: { text: 'Activo', color: '#2F6B4F', bg: 'rgba(47,107,79,0.1)' },
  INACTIVE: { text: 'Inactivo', color: '#B42318', bg: 'rgba(180,35,24,0.08)' },
  LOCKED: { text: 'Bloqueado', color: '#D39A2B', bg: 'rgba(211,154,43,0.1)' },
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors"
      style={{
        color: copied ? '#2F6B4F' : '#0F2E3D',
        background: copied ? 'rgba(47,107,79,0.10)' : 'rgba(15,46,61,0.08)',
      }}
      title="Copiar"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

export function CredentialsTab({ tenantId, tenantName, clientUsers, roleOverrides }: Props) {
  const ROLE_LABEL: Record<string, string> = {
    CLIENT_ADMIN: roleOverrides.CLIENT_ADMIN?.label || ROLE_LABEL_DEFAULT.CLIENT_ADMIN,
    CLIENT_VIEWER: roleOverrides.CLIENT_VIEWER?.label || ROLE_LABEL_DEFAULT.CLIENT_VIEWER,
    CLIENT_LEGAL_REP: roleOverrides.CLIENT_LEGAL_REP?.label || ROLE_LABEL_DEFAULT.CLIENT_LEGAL_REP,
  };
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    clientUsers.find((u) => u.role === 'CLIENT_ADMIN')?.id ?? clientUsers[0]?.id ?? null,
  );
  const [pin, setPin] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; initial?: ClientUserDraft } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`¿Eliminar a "${userName}" del portal? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Error al eliminar.' });
      } else {
        setMessage({ type: 'success', text: 'Usuario eliminado.' });
        router.refresh();
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setDeletingId(null);
    }
  }

  const selectedUser = clientUsers.find((u) => u.id === selectedUserId);

  async function handleReset() {
    if (pin.length < 4 || !selectedUserId) {
      setMessage({ type: 'error', text: 'El PIN debe tener al menos 4 caracteres.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin: pin, userId: selectedUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Error al resetear PIN.' });
      } else {
        setMessage({
          type: 'success',
          text: `PIN actualizado para ${data.name ?? selectedUser?.full_name ?? tenantName}.`,
        });
        setPin('');
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-5">
      {/* User list - 3 cols */}
      <div className="space-y-6 lg:col-span-3">
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
        >
          <div className="flex items-center gap-2">
            <User className="size-4" style={{ color: '#0F2E3D' }} />
            <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
              Usuarios del portal
            </h3>
            <HelpTip>
              Cada usuario tiene un ID de tarjeta (login) y un PIN (contraseña).
              Selecciona uno para resetear su PIN, o usa los iconos para editar/eliminar.
            </HelpTip>
            <button
              type="button"
              onClick={() => setModal({ mode: 'create' })}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                color: '#FBF6EC',
                boxShadow: '0 2px 6px rgba(15,46,61,0.18)',
              }}
            >
              <UserPlus className="size-3.5" />
              Nuevo usuario
            </button>
          </div>
          <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
            Selecciona un usuario para administrar su acceso.
          </p>

          {clientUsers.length === 0 ? (
            <p className="mt-6 text-center text-sm" style={{ color: '#C8C4B9' }}>
              No hay usuarios configurados para este portal.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {clientUsers.map((user) => {
                const isSelected = user.id === selectedUserId;
                const status = STATUS_LABEL[user.status] ?? STATUS_LABEL.ACTIVE;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setPin('');
                      setMessage(null);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all"
                    style={{
                      borderColor: isSelected ? '#D39A2B' : '#E2DED6',
                      background: isSelected ? 'rgba(211,154,43,0.06)' : '#FBF6EC',
                      boxShadow: isSelected ? '0 0 0 3px rgba(211,154,43,0.1)' : 'none',
                    }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, #0F2E3D, #1C3F55)'
                          : '#E2DED6',
                        color: isSelected ? '#FBF6EC' : '#355B6F',
                      }}
                    >
                      {user.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: '#1A1E23' }}>
                        {user.full_name}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs" style={{ color: '#355B6F' }}>
                        <span className="font-mono">{user.card_id}</span>
                        <CopyBtn text={user.card_id} />
                        <span style={{ color: '#C8C4B9' }}>·</span>
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: 'rgba(15,46,61,0.08)', color: '#0F2E3D' }}
                      >
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.text}
                      </span>
                    </div>
                    <div className="ml-1 flex shrink-0 items-center gap-0.5">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({
                            mode: 'edit',
                            initial: {
                              id: user.id,
                              full_name: user.full_name,
                              email: user.email,
                              role: user.role as ClientUserDraft['role'],
                              status: user.status as ClientUserDraft['status'],
                              card_id: user.card_id,
                            },
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setModal({
                              mode: 'edit',
                              initial: {
                                id: user.id,
                                full_name: user.full_name,
                                email: user.email,
                                role: user.role as ClientUserDraft['role'],
                                status: user.status as ClientUserDraft['status'],
                                card_id: user.card_id,
                              },
                            });
                          }
                        }}
                        className="cursor-pointer rounded-md p-1.5 transition-colors hover:bg-black/5"
                        style={{ color: '#355B6F' }}
                        title="Editar usuario"
                      >
                        <Pencil className="size-3.5" />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(user.id, user.full_name);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(user.id, user.full_name);
                          }
                        }}
                        className="cursor-pointer rounded-md p-1.5 transition-colors hover:bg-black/5"
                        style={{
                          color: deletingId === user.id ? '#C8C4B9' : '#B42318',
                          pointerEvents: deletingId === user.id ? 'none' : 'auto',
                        }}
                        title="Eliminar usuario"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PIN reset */}
        {selectedUser && (
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4" style={{ color: '#0F2E3D' }} />
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                Resetear PIN de {selectedUser.full_name}
              </h3>
              <HelpTip>
                Genera un PIN nuevo y reemplaza al actual. El PIN previo
                queda inutilizado. Compártelo por canal seguro con el usuario.
              </HelpTip>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              Establece un nuevo PIN de acceso. El usuario deberá usar este nuevo PIN para ingresar.
            </p>

            {/* Copyable credentials */}
            <div
              className="mt-4 flex items-center gap-4 rounded-xl px-4 py-3"
              style={{ background: '#FBF6EC', border: '1px solid #E2DED6' }}
            >
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>ID de tarjeta</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-sm font-bold" style={{ color: '#0F2E3D' }}>
                  {selectedUser.card_id}
                  <CopyBtn text={selectedUser.card_id} />
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="Nuevo PIN (mín. 4 caracteres)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 pr-10 text-sm transition-all focus:outline-none"
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
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#C8C4B9' }}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleReset}
                disabled={saving || pin.length < 4}
                className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                  color: '#FBF6EC',
                  boxShadow: '0 2px 8px rgba(15,46,61,0.2)',
                }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {saving ? 'Guardando…' : 'Resetear PIN'}
              </button>
            </div>

            {message && (
              <div
                className="mt-4 rounded-xl px-4 py-3 text-xs"
                style={
                  message.type === 'success'
                    ? { background: 'rgba(47,107,79,0.08)', border: '1px solid rgba(47,107,79,0.2)', color: '#2F6B4F' }
                    : { background: 'rgba(180,35,24,0.06)', border: '1px solid rgba(180,35,24,0.15)', color: '#B42318' }
                }
              >
                {message.text}
              </div>
            )}

            {selectedUser.pin_generated_at && (
              <p className="mt-3 text-[11px]" style={{ color: '#C8C4B9' }}>
                Último cambio de PIN:{' '}
                {new Date(selectedUser.pin_generated_at).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Info panel — Editable Roles & Permisos, filtrado al rol del
        usuario seleccionado para no mostrar las 3 secciones a la vez. */}
      <div className="lg:col-span-2">
        <RolesPermissionsEditor
          tenantId={tenantId}
          initialOverrides={roleOverrides}
          focusedRole={selectedUser?.role ?? null}
        />
      </div>

      {modal && (
        <UserFormModal
          tenantId={tenantId}
          mode={modal.mode}
          initial={modal.initial}
          roleLabels={ROLE_LABEL}
          onClose={() => setModal(null)}
          onSaved={() => {
            router.refresh();
            setMessage({
              type: 'success',
              text: modal.mode === 'create' ? 'Usuario creado.' : 'Usuario actualizado.',
            });
          }}
        />
      )}
    </div>
  );
}

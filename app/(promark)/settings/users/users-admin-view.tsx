'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, KeyRound, UserCheck, UserX, Camera } from 'lucide-react';
import { DsDataTable, StatusBadge, useToast } from '@/components/ds';
import type { DsColumn } from '@/components/ds';

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Administrador',
  LAWYER: 'Abogado',
  BRAND_ANALYST: 'Analista de Marcas',
  ASSISTANT: 'Asistente',
};

const ROLES = ['SUPERADMIN', 'LAWYER', 'BRAND_ANALYST', 'ASSISTANT'] as const;

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  avatar: { dataUrl?: string; url?: string } | string | null;
  last_login: string | null;
  created_at: string;
}

interface UsersAdminViewProps {
  users: UserRow[];
  currentUserId: string;
  /** Labels custom por rol provenientes de promark_role_configs. Sobrescriben los defaults. */
  customRoleLabels?: Record<string, string | null>;
}

function extractAvatarSrc(avatar: UserRow['avatar']): string | null {
  if (!avatar) return null;
  if (typeof avatar === 'string') return avatar;
  if (typeof avatar === 'object') {
    return avatar.dataUrl ?? avatar.url ?? null;
  }
  return null;
}

export function UsersAdminView({ users, currentUserId, customRoleLabels = {} }: UsersAdminViewProps) {
  const labelFor = (role: string): string =>
    customRoleLabels[role] || ROLE_LABELS[role] || role;
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [resetting, setResetting] = useState<UserRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleStatus(u: UserRow) {
    if (u.id === currentUserId) {
      toast.error('No puedes desactivarte a ti mismo');
      return;
    }
    const next = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await fetch(`/api/promark/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      toast.success(next === 'ACTIVE' ? `"${u.full_name}" activado` : `"${u.full_name}" desactivado`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error('No se pudo cambiar el estado', d.error ?? 'Intenta de nuevo.');
    }
  }

  async function deleteUser(u: UserRow) {
    if (u.id === currentUserId) {
      toast.error('No puedes eliminarte a ti mismo');
      return;
    }
    if (!confirm(`¿Eliminar al usuario "${u.full_name}" (${u.email})?\n\nEsta acción borra también su acceso al sistema y no se puede deshacer.`)) {
      return;
    }
    const res = await fetch(`/api/promark/users/${u.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success(`"${u.full_name}" eliminado`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error('No se pudo eliminar', d.error ?? 'Intenta de nuevo.');
    }
  }

  const columns: DsColumn<UserRow>[] = [
    {
      key: 'avatar',
      header: '',
      width: '56px',
      cell: (u) => {
        const src = extractAvatarSrc(u.avatar);
        if (src) {
          // eslint-disable-next-line @next/next/no-img-element
          return <img src={src} alt={u.full_name} className="size-9 rounded-full object-cover" />;
        }
        const initials = u.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div
            className="flex size-9 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: '#0F2E3D', color: '#FBF6EC' }}
          >
            {initials}
          </div>
        );
      },
    },
    {
      key: 'full_name',
      header: 'Nombre',
      sortable: true,
      cell: (u) => (
        <div>
          <p className="font-semibold" style={{ color: '#0F2E3D' }}>
            {u.full_name}
            {u.id === currentUserId && (
              <span className="ml-2 text-[10px] font-medium" style={{ color: '#355B6F' }}>(tú)</span>
            )}
          </p>
          <p className="font-mono text-xs" style={{ color: '#355B6F' }}>{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      cell: (u) => (
        <span style={{ color: '#0F2E3D' }} className="text-sm font-medium">
          {labelFor(u.role)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (u) => (
        <StatusBadge
          tone={u.status === 'ACTIVE' ? 'success' : 'muted'}
          label={u.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
        />
      ),
    },
    {
      key: 'last_login',
      header: 'Último acceso',
      sortable: true,
      cell: (u) =>
        u.last_login
          ? new Date(u.last_login).toLocaleString('es-MX', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })
          : <span style={{ color: '#C8C4B9' }}>Nunca</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
        >
          <Plus className="size-4" /> Nuevo usuario
        </button>
      </div>

      <DsDataTable<UserRow>
        columns={columns}
        rows={users}
        getRowId={(u) => u.id}
        rowActions={[
          {
            label: 'Editar',
            icon: <Pencil className="size-4" />,
            onClick: (u) => setEditing(u),
            quickAction: true,
          },
          {
            label: 'Resetear contraseña',
            icon: <KeyRound className="size-4" />,
            onClick: (u) => setResetting(u),
          },
          {
            label: 'Activar/Desactivar',
            icon: <UserCheck className="size-4" />,
            onClick: (u) => toggleStatus(u),
          },
          {
            label: 'Eliminar',
            icon: <Trash2 className="size-4" />,
            onClick: (u) => deleteUser(u),
            destructive: true,
          },
        ]}
      />

      {creating && (
        <UserFormSheet
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
          busy={busy}
          setBusy={setBusy}
        />
      )}
      {editing && (
        <UserFormSheet
          mode="edit"
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
          busy={busy}
          setBusy={setBusy}
        />
      )}
      {resetting && (
        <ResetPasswordSheet
          user={resetting}
          onClose={() => setResetting(null)}
          busy={busy}
          setBusy={setBusy}
        />
      )}
    </div>
  );
}

/* --------------- Form Sheet (create + edit) --------------- */

function UserFormSheet({
  mode,
  user,
  onClose,
  onSaved,
  busy,
  setBusy,
}: {
  mode: 'create' | 'edit';
  user?: UserRow;
  onClose: () => void;
  onSaved: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const toast = useToast();
  const [email, setEmail] = useState(user?.email ?? '');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [role, setRole] = useState(user?.role ?? 'ASSISTANT');
  const [status, setStatus] = useState(user?.status ?? 'ACTIVE');
  const [password, setPassword] = useState('');
  const [avatarData, setAvatarData] = useState<string | null>(extractAvatarSrc(user?.avatar ?? null));

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo imágenes');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagen muy grande', 'Máximo 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarData(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (mode === 'create') {
      if (!email || !email.includes('@')) return toast.error('Email inválido');
      if (!fullName.trim() || fullName.trim().length < 2) return toast.error('Nombre requerido');
      if (!password || password.length < 8) return toast.error('Contraseña mínima 8 caracteres');
      setBusy(true);
      const res = await fetch('/api/promark/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role,
          password,
          avatar: avatarData ? { dataUrl: avatarData } : null,
        }),
      });
      setBusy(false);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return toast.error('No se pudo crear', d.error ?? 'Intenta de nuevo.');
      }
      toast.success(`Usuario "${fullName}" creado`);
      onSaved();
    } else if (user) {
      setBusy(true);
      const res = await fetch(`/api/promark/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          role,
          status,
          avatar: avatarData ? { dataUrl: avatarData } : null,
        }),
      });
      setBusy(false);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return toast.error('No se pudo guardar', d.error ?? 'Intenta de nuevo.');
      }
      toast.success(`"${fullName}" actualizado`);
      onSaved();
    }
  }

  return (
    <SheetOverlay onClose={onClose}>
      <div className="flex flex-col gap-4 p-6">
        <h2 className="text-lg font-bold" style={{ color: '#0F2E3D' }}>
          {mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          {avatarData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarData} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <div
              className="flex size-16 items-center justify-center rounded-full text-lg font-bold"
              style={{ background: '#0F2E3D', color: '#FBF6EC' }}
            >
              {(fullName || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: '#E2DED6', color: '#355B6F' }}>
            <Camera className="size-3.5" />
            {avatarData ? 'Cambiar foto' : 'Subir foto'}
            <input type="file" accept="image/*" className="sr-only" onChange={handleAvatar} />
          </label>
        </div>

        <Field label="Nombre completo *">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
          />
        </Field>

        <Field label="Email *">
          <input
            type="email"
            value={email}
            disabled={mode === 'edit'}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
            style={{ borderColor: '#E2DED6', background: mode === 'edit' ? '#F1EDE3' : '#FBF6EC' }}
          />
          {mode === 'edit' && (
            <p className="mt-1 text-[10px]" style={{ color: '#355B6F' }}>
              El email es inmutable para preservar la integridad del historial.
            </p>
          )}
        </Field>

        <Field label="Rol *">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </Field>

        {mode === 'create' && (
          <Field label="Contraseña inicial *">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
            />
            <p className="mt-1 text-[10px]" style={{ color: '#355B6F' }}>
              Compártela con el usuario por un canal seguro. El usuario podrá cambiarla desde /settings/profile.
            </p>
          </Field>
        )}

        {mode === 'edit' && (
          <Field label="Estado">
            <div className="flex gap-2">
              {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
                  style={{
                    borderColor: status === s ? '#0F2E3D' : '#E2DED6',
                    background: status === s ? '#0F2E3D' : '#FBF6EC',
                    color: status === s ? '#FBF6EC' : '#355B6F',
                  }}
                >
                  {s === 'ACTIVE' ? <>Activo</> : <>Inactivo</>}
                </button>
              ))}
            </div>
          </Field>
        )}

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: '#E2DED6', color: '#355B6F' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'Guardando…' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </SheetOverlay>
  );
}

/* --------------- Reset Password Sheet --------------- */

function ResetPasswordSheet({
  user,
  onClose,
  busy,
  setBusy,
}: {
  user: UserRow;
  onClose: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const toast = useToast();
  const [password, setPassword] = useState('');

  async function handleSubmit() {
    if (!password || password.length < 8) {
      return toast.error('Contraseña mínima 8 caracteres');
    }
    setBusy(true);
    const res = await fetch(`/api/promark/users/${user.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return toast.error('No se pudo resetear', d.error ?? 'Intenta de nuevo.');
    }
    toast.success('Contraseña actualizada', `Compártela con ${user.full_name} por un canal seguro.`);
    onClose();
  }

  return (
    <SheetOverlay onClose={onClose}>
      <div className="flex flex-col gap-4 p-6">
        <h2 className="text-lg font-bold" style={{ color: '#0F2E3D' }}>
          Resetear contraseña
        </h2>
        <p className="text-sm" style={{ color: '#355B6F' }}>
          Para <strong style={{ color: '#0F2E3D' }}>{user.full_name}</strong> ({user.email}).
        </p>
        <Field label="Nueva contraseña *">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
            style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
          />
        </Field>
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: '#E2DED6', color: '#355B6F' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'Aplicando…' : 'Resetear contraseña'}
          </button>
        </div>
      </div>
    </SheetOverlay>
  );
}

/* --------------- Helpers --------------- */

function SheetOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ background: 'rgba(11,31,42,0.45)' }}
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-[#FBF6EC] shadow-2xl"
        style={{ borderLeft: '1px solid #E2DED6' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

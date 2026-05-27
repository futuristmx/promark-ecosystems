'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Save, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ds';

interface ProfileFormProps {
  profile: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    avatar: { dataUrl: string } | null;
    status: string;
    created_at: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Administrador',
  LAWYER: 'Abogado',
  BRAND_ANALYST: 'Analista de Marcas',
  ASSISTANT: 'Asistente',
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile.full_name);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar?.dataUrl ?? null
  );
  const [avatarData, setAvatarData] = useState<string | null>(null); // new upload
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Tipo de archivo no permitido', 'Solo se permiten imágenes.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagen muy grande', 'El máximo permitido es 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarData(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (fullName.trim() !== profile.full_name) {
        body.full_name = fullName.trim();
      }
      if (avatarData !== null) {
        body.avatar = avatarData;
      }
      if (Object.keys(body).length === 0) {
        toast.info('Sin cambios', 'No hay nada nuevo que guardar.');
        return;
      }
      const res = await fetch('/api/promark/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error('No se pudo guardar', data.error ?? 'Intenta de nuevo.');
        return;
      }
      toast.success('Perfil actualizado');
      setAvatarData(null);
      router.refresh();
    } catch {
      toast.error('Error de red', 'Revisa tu conexión.');
    } finally {
      setSaving(false);
    }
  }

  const initials = fullName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 transition-colors hover:border-[#0066FF]"
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-slate-400">{initials}</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div>
          <p className="text-sm font-medium text-slate-700">Foto de perfil</p>
          <p className="text-xs text-slate-400">JPG, PNG. Máximo 2MB.</p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-slate-700">
          Nombre completo
        </label>
        <input
          id="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
        />
      </div>

      {/* Read-only fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {profile.email}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {ROLE_LABELS[profile.role] ?? profile.role}
          </p>
        </div>
      </div>

      {/* Change password */}
      <ChangePasswordSection />

      {/* Actions */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      toast.error('Contraseña muy corta', 'Usa al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/promark/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error('No se pudo cambiar', data.error ?? 'Intenta de nuevo.');
        return;
      }
      toast.success('Contraseña actualizada');
      setNewPassword('');
      setConfirm('');
    } catch {
      toast.error('Error de red');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-slate-200 pt-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <KeyRound className="h-4 w-4" />
        Cambiar contraseña
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new-pw" className="mb-1 block text-sm font-medium text-slate-700">
            Nueva contraseña
          </label>
          <input
            id="new-pw"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
          />
        </div>
        <div>
          <label htmlFor="confirm-pw" className="mb-1 block text-sm font-medium text-slate-700">
            Confirmar contraseña
          </label>
          <input
            id="confirm-pw"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleChangePassword}
          disabled={saving || !newPassword || !confirm}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {saving ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  );
}

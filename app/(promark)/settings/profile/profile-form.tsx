'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Save, Loader2 } from 'lucide-react';

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Solo se permiten imágenes.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen debe ser menor a 2MB.' });
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
    setMessage(null);
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
        setMessage({ type: 'error', text: 'No hay cambios para guardar.' });
        return;
      }
      const res = await fetch('/api/promark/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: data.error ?? 'Error al guardar.' });
        return;
      }
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
      setAvatarData(null);
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'Error de red.' });
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
    <div className="space-y-6">
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

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

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

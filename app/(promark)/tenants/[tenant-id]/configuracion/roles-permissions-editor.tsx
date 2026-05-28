'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Save } from 'lucide-react';
import { HelpTip, useToast } from '@/components/ds';

const ROLE_KEYS = ['CLIENT_ADMIN', 'CLIENT_LEGAL_REP', 'CLIENT_VIEWER'] as const;
type RoleKey = (typeof ROLE_KEYS)[number];

const DEFAULT_LABELS: Record<RoleKey, string> = {
  CLIENT_ADMIN: 'Administrador',
  CLIENT_LEGAL_REP: 'Rep. Legal',
  CLIENT_VIEWER: 'Visor',
};

const PERMISSION_KEYS = [
  'view_brands',
  'view_contracts',
  'view_alerts',
  'view_documents',
  'view_holders',
  'download_documents',
] as const;
type PermissionKey = (typeof PERMISSION_KEYS)[number];

const PERMISSION_LABELS: Record<PermissionKey, { label: string; desc: string }> = {
  view_brands:        { label: 'Ver marcas',          desc: 'Catálogo de marcas registradas' },
  view_contracts:     { label: 'Ver contratos',       desc: 'Licencias, cesiones y acuerdos vinculados' },
  view_alerts:        { label: 'Ver alertas',         desc: 'Vencimientos por vencer y eventos detectados' },
  view_documents:     { label: 'Ver documentos',      desc: 'Repositorio de archivos del cliente' },
  view_holders:       { label: 'Ver titulares',       desc: 'Personas/empresas que detentan los derechos' },
  download_documents: { label: 'Descargar documentos', desc: 'Permite bajar archivos a su computadora' },
};

export interface RoleOverride {
  label?: string;
  permissions?: Partial<Record<PermissionKey, boolean>>;
}

export type RoleOverrides = Partial<Record<RoleKey, RoleOverride>>;

const DEFAULT_PERMISSIONS: Record<RoleKey, Record<PermissionKey, boolean>> = {
  CLIENT_ADMIN: {
    view_brands: true, view_contracts: true, view_alerts: true,
    view_documents: true, view_holders: true, download_documents: true,
  },
  CLIENT_LEGAL_REP: {
    view_brands: true, view_contracts: true, view_alerts: true,
    view_documents: true, view_holders: false, download_documents: true,
  },
  CLIENT_VIEWER: {
    view_brands: true, view_contracts: false, view_alerts: false,
    view_documents: true, view_holders: false, download_documents: false,
  },
};

interface Props {
  tenantId: string;
  initialOverrides: RoleOverrides;
}

export function RolesPermissionsEditor({ tenantId, initialOverrides }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [overrides, setOverrides] = useState<RoleOverrides>(initialOverrides);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function getLabel(role: RoleKey): string {
    return overrides[role]?.label ?? DEFAULT_LABELS[role];
  }
  function getPermission(role: RoleKey, perm: PermissionKey): boolean {
    const v = overrides[role]?.permissions?.[perm];
    return v === undefined ? DEFAULT_PERMISSIONS[role][perm] : v;
  }

  function setLabel(role: RoleKey, value: string) {
    setDirty(true);
    setOverrides((prev) => ({
      ...prev,
      [role]: { ...prev[role], label: value },
    }));
  }
  function togglePermission(role: RoleKey, perm: PermissionKey) {
    setDirty(true);
    setOverrides((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        permissions: {
          ...prev[role]?.permissions,
          [perm]: !getPermission(role, perm),
        },
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { role_overrides: overrides } }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error('No se pudo guardar', d.error ?? 'Intenta de nuevo.');
        return;
      }
      toast.success('Roles y permisos actualizados');
      setDirty(false);
      router.refresh();
    } catch {
      toast.error('Error de red');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        borderColor: '#E2DED6',
        background: 'linear-gradient(135deg, #F1EDE3 0%, #FBF6EC 100%)',
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="size-4" style={{ color: '#0F2E3D' }} />
        <h4 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
          Roles & permisos
        </h4>
        <HelpTip>
          Personaliza el nombre visible de cada rol y selecciona qué módulos
          del portal puede ver. Aplica solo a este cliente.
        </HelpTip>
      </div>

      <div className="space-y-5">
        {ROLE_KEYS.map((role) => (
          <div
            key={role}
            className="rounded-xl border p-4"
            style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
          >
            <div className="mb-3">
              <label className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                {DEFAULT_LABELS[role]}
              </label>
              <input
                type="text"
                value={getLabel(role)}
                onChange={(e) => setLabel(role, e.target.value)}
                placeholder={DEFAULT_LABELS[role]}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
              />
            </div>

            <div className="space-y-2">
              {PERMISSION_KEYS.map((perm) => {
                const checked = getPermission(role, perm);
                return (
                  <label
                    key={perm}
                    className="flex cursor-pointer items-start gap-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(role, perm)}
                      className="mt-0.5 size-4 cursor-pointer accent-[#0F2E3D]"
                    />
                    <div className="flex-1">
                      <p className="text-[12px] font-medium" style={{ color: '#0F2E3D' }}>
                        {PERMISSION_LABELS[perm].label}
                      </p>
                      <p className="text-[10px]" style={{ color: '#355B6F' }}>
                        {PERMISSION_LABELS[perm].desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={!dirty || saving}
        onClick={handleSave}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: '#0F2E3D', color: '#FBF6EC' }}
      >
        <Save className="size-3.5" />
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>

      <p className="mt-3 text-[10px] leading-relaxed" style={{ color: '#355B6F' }}>
        <strong>Sobre el PIN:</strong> Los PINs se guardan como hash bcrypt
        (irreversible). No es posible mostrar el PIN actual. Para entregar
        credenciales a un usuario, reséteale un PIN nuevo y compártelo de
        forma segura.
      </p>
    </div>
  );
}

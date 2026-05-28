'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Save } from 'lucide-react';
import { HelpTip, useToast } from '@/components/ds';

const ROLES = ['SUPERADMIN', 'LAWYER', 'BRAND_ANALYST', 'ASSISTANT'] as const;
type Role = (typeof ROLES)[number];

const DEFAULT_LABELS: Record<Role, string> = {
  SUPERADMIN: 'Super Administrador',
  LAWYER: 'Abogado',
  BRAND_ANALYST: 'Analista de Marcas',
  ASSISTANT: 'Asistente',
};

const PERMISSIONS = [
  'view_clients',
  'view_brands',
  'view_contracts',
  'view_alerts',
  'view_financiero',
  'view_activity',
  'export_data',
  'manage_users',
  'manage_tenants',
] as const;
type Permission = (typeof PERMISSIONS)[number];

const PERMISSION_META: Record<Permission, { label: string; desc: string }> = {
  view_clients:    { label: 'Ver clientes',        desc: 'Acceso al listado y panel de cada cliente.' },
  view_brands:     { label: 'Ver marcas',          desc: 'Catálogo de marcas, ediciones e historial.' },
  view_contracts:  { label: 'Ver contratos',       desc: 'Contratos y licencias en portafolios.' },
  view_alerts:     { label: 'Ver alertas',         desc: 'Panel de alertas y reglas de vencimiento.' },
  view_financiero: { label: 'Ver financiero',      desc: 'Proyección de renovaciones y costos.' },
  view_activity:   { label: 'Ver actividad',       desc: 'Bitácora de eventos por cliente.' },
  export_data:     { label: 'Exportar (PDF/Excel)', desc: 'Descargar reportes y catálogos.' },
  manage_users:    { label: 'Administrar usuarios Promark', desc: 'Crear, editar y eliminar empleados del staff.' },
  manage_tenants:  { label: 'Administrar clientes',         desc: 'Crear, editar, eliminar tenants y branding.' },
};

const DEFAULT_PERMS: Record<Role, Record<Permission, boolean>> = {
  SUPERADMIN: {
    view_clients: true, view_brands: true, view_contracts: true, view_alerts: true,
    view_financiero: true, view_activity: true, export_data: true,
    manage_users: true, manage_tenants: true,
  },
  LAWYER: {
    view_clients: true, view_brands: true, view_contracts: true, view_alerts: true,
    view_financiero: true, view_activity: true, export_data: true,
    manage_users: false, manage_tenants: false,
  },
  BRAND_ANALYST: {
    view_clients: true, view_brands: true, view_contracts: false, view_alerts: true,
    view_financiero: false, view_activity: true, export_data: true,
    manage_users: false, manage_tenants: false,
  },
  ASSISTANT: {
    view_clients: true, view_brands: true, view_contracts: false, view_alerts: false,
    view_financiero: false, view_activity: false, export_data: false,
    manage_users: false, manage_tenants: false,
  },
};

export interface PromarkRoleConfigItem {
  role: string;
  label: string | null;
  permissions: Record<string, boolean>;
}

interface Props {
  initial: PromarkRoleConfigItem[];
}

export function PromarkRolesEditor({ initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState<Record<Role, PromarkRoleConfigItem>>(() => {
    const map = new Map(initial.map((c) => [c.role, c]));
    return ROLES.reduce(
      (acc, r) => {
        acc[r] = (map.get(r) as PromarkRoleConfigItem) ?? { role: r, label: null, permissions: {} };
        return acc;
      },
      {} as Record<Role, PromarkRoleConfigItem>
    );
  });
  const [savingRole, setSavingRole] = useState<Role | null>(null);

  function getLabel(role: Role): string {
    return configs[role].label ?? DEFAULT_LABELS[role];
  }
  function getPerm(role: Role, perm: Permission): boolean {
    const v = configs[role].permissions[perm];
    return v === undefined ? DEFAULT_PERMS[role][perm] : v;
  }

  async function saveRole(role: Role) {
    setSavingRole(role);
    try {
      const res = await fetch('/api/promark/role-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          label: configs[role].label ?? DEFAULT_LABELS[role],
          permissions: configs[role].permissions,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error('No se pudo guardar', d.error ?? 'Intenta de nuevo.');
        return;
      }
      toast.success(`Rol "${getLabel(role)}" actualizado`);
      router.refresh();
    } catch {
      toast.error('Error de red');
    } finally {
      setSavingRole(null);
    }
  }

  return (
    <div
      className="rounded-2xl border"
      style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4" style={{ color: '#0F2E3D' }} />
          <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
            Roles & permisos del staff Promark
          </h3>
          <HelpTip>
            Renombra los 4 roles del staff y selecciona qué módulos puede ver
            cada uno. Aplica a nivel global de la plataforma.
          </HelpTip>
        </div>
        <span className="text-xs font-medium" style={{ color: '#355B6F' }}>
          {open ? 'Ocultar' : 'Configurar'}
        </span>
      </button>

      {open && (
        <div className="grid gap-4 border-t p-6 sm:grid-cols-2" style={{ borderColor: '#E2DED6' }}>
          {ROLES.map((role) => (
            <div
              key={role}
              className="rounded-xl border p-4"
              style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
            >
              <label className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                {DEFAULT_LABELS[role]}
              </label>
              <input
                type="text"
                value={configs[role].label ?? ''}
                onChange={(e) =>
                  setConfigs({
                    ...configs,
                    [role]: { ...configs[role], label: e.target.value },
                  })
                }
                placeholder={DEFAULT_LABELS[role]}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
              />

              <div className="mt-3 space-y-1.5">
                {PERMISSIONS.map((perm) => {
                  const checked = getPerm(role, perm);
                  return (
                    <label key={perm} className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setConfigs({
                            ...configs,
                            [role]: {
                              ...configs[role],
                              permissions: { ...configs[role].permissions, [perm]: !checked },
                            },
                          })
                        }
                        className="mt-0.5 size-4 cursor-pointer accent-[#0F2E3D]"
                      />
                      <div className="flex-1">
                        <p className="text-[12px] font-medium" style={{ color: '#0F2E3D' }}>
                          {PERMISSION_META[perm].label}
                        </p>
                        <p className="text-[10px]" style={{ color: '#355B6F' }}>
                          {PERMISSION_META[perm].desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={savingRole === role}
                onClick={() => saveRole(role)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: '#0F2E3D', color: '#FBF6EC' }}
              >
                <Save className="size-3.5" />
                {savingRole === role ? 'Guardando…' : `Guardar ${getLabel(role)}`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

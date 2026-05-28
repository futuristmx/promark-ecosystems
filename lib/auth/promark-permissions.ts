import 'server-only';
import prisma from '@/lib/prisma/client';

/**
 * Sistema de permisos del staff Promark.
 *
 * SUPERADMIN configura cada permiso por rol en /settings/users
 * (UI: PromarkRolesEditor → tabla PromarkRoleConfig).
 *
 * Si un rol no tiene config persistida, se aplican los defaults definidos
 * aquí. Esto mantiene compatibilidad con cualquier rol antes de que el
 * SUPERADMIN entre a configurar.
 *
 * SUPERADMIN siempre tiene TODOS los permisos en true, independientemente
 * de la config — para evitar el riesgo de auto-lockout.
 */

export const PROMARK_PERMISSIONS = [
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

export type PromarkPermission = (typeof PROMARK_PERMISSIONS)[number];

type Role = 'SUPERADMIN' | 'LAWYER' | 'BRAND_ANALYST' | 'ASSISTANT';

const DEFAULT_PERMS: Record<Role, Record<PromarkPermission, boolean>> = {
  SUPERADMIN: {
    view_clients: true,  view_brands: true,  view_contracts: true,
    view_alerts: true,   view_financiero: true, view_activity: true,
    export_data: true,   manage_users: true, manage_tenants: true,
  },
  LAWYER: {
    view_clients: true,  view_brands: true,  view_contracts: true,
    view_alerts: true,   view_financiero: true, view_activity: true,
    export_data: true,   manage_users: false, manage_tenants: false,
  },
  BRAND_ANALYST: {
    view_clients: true,  view_brands: true,  view_contracts: false,
    view_alerts: true,   view_financiero: false, view_activity: true,
    export_data: true,   manage_users: false, manage_tenants: false,
  },
  ASSISTANT: {
    view_clients: true,  view_brands: true,  view_contracts: false,
    view_alerts: false,  view_financiero: false, view_activity: false,
    export_data: false,  manage_users: false, manage_tenants: false,
  },
};

export type PromarkPermissionsMap = Record<PromarkPermission, boolean>;

/**
 * Devuelve el mapa de permisos efectivos para el rol del usuario.
 * - Lee la config persistida en PromarkRoleConfig.
 * - Hace merge sobre los defaults del rol (defaults son fallback).
 * - SUPERADMIN siempre tiene todos los permisos en true.
 */
export async function getPromarkPermissions(role: string): Promise<PromarkPermissionsMap> {
  if (role === 'SUPERADMIN') {
    return DEFAULT_PERMS.SUPERADMIN;
  }

  const defaults = (DEFAULT_PERMS[role as Role] ?? DEFAULT_PERMS.ASSISTANT);

  const cfg = await prisma.promarkRoleConfig.findUnique({
    where: { role },
    select: { permissions: true },
  });

  const overrides = (cfg?.permissions ?? {}) as Partial<Record<PromarkPermission, boolean>>;

  const merged: PromarkPermissionsMap = { ...defaults };
  for (const k of PROMARK_PERMISSIONS) {
    if (typeof overrides[k] === 'boolean') {
      merged[k] = overrides[k] as boolean;
    }
  }
  return merged;
}

/**
 * Helper para páginas server-side: si el usuario no tiene el permiso, redirige.
 * Uso:
 *   const session = await requirePromarkAuth();
 *   await assertPromarkPermission(session.role, 'view_financiero');
 */
export async function assertPromarkPermission(
  role: string,
  permission: PromarkPermission,
  redirectTo: string = '/dashboard'
): Promise<void> {
  const perms = await getPromarkPermissions(role);
  if (!perms[permission]) {
    const { redirect } = await import('next/navigation');
    redirect(redirectTo);
  }
}

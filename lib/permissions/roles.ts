import prisma from '@/lib/prisma/client';
import type { PermissionAction, UserTypeEnum } from '@prisma/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PermissionCheckParams {
  userId: string;
  userType: UserTypeEnum;
  role: string;
  module: string;
  action: PermissionAction;
}

export interface PermissionCheckResult {
  allowed: boolean;
  source: 'override' | 'role' | 'default';
}

export interface UserPermission {
  module: string;
  action: PermissionAction;
  allowed: boolean;
  source: 'override' | 'role';
}

// ─── Permission Checking ─────────────────────────────────────────────────────

export async function checkPermission(
  params: PermissionCheckParams
): Promise<PermissionCheckResult> {
  const { userId, userType, role, module, action } = params;

  // 1. Check PermissionOverride first (non-expired)
  const override = await prisma.permissionOverride.findFirst({
    where: {
      user_id: userId,
      user_type: userType,
      module,
      action,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    },
    orderBy: { created_at: 'desc' },
  });

  if (override) {
    return { allowed: override.granted, source: 'override' };
  }

  // 2. Fall back to RolePermission
  const rolePermission = await prisma.rolePermission.findUnique({
    where: {
      role_user_type_module_action: {
        role,
        user_type: userType,
        module,
        action,
      },
    },
  });

  if (rolePermission) {
    return { allowed: rolePermission.allowed, source: 'role' };
  }

  // 3. Default: denied
  return { allowed: false, source: 'default' };
}

// ─── Get All User Permissions ────────────────────────────────────────────────

export async function getUserPermissions(
  userId: string,
  userType: UserTypeEnum,
  role: string
): Promise<UserPermission[]> {
  // Get all role-based permissions
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role, user_type: userType },
  });

  // Get all active overrides for the user
  const overrides = await prisma.permissionOverride.findMany({
    where: {
      user_id: userId,
      user_type: userType,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    },
    orderBy: { created_at: 'desc' },
  });

  // Build merged permission map: key = "module:action"
  const permissionMap = new Map<string, UserPermission>();

  // Add role permissions first
  for (const rp of rolePermissions) {
    const key = `${rp.module}:${rp.action}`;
    permissionMap.set(key, {
      module: rp.module,
      action: rp.action,
      allowed: rp.allowed,
      source: 'role',
    });
  }

  // Overrides take precedence
  for (const ov of overrides) {
    const key = `${ov.module}:${ov.action}`;
    permissionMap.set(key, {
      module: ov.module,
      action: ov.action,
      allowed: ov.granted,
      source: 'override',
    });
  }

  return Array.from(permissionMap.values());
}

// ─── Helper: Convert permissions to flat boolean map ─────────────────────────

export function permissionsToMap(
  permissions: UserPermission[]
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const p of permissions) {
    map[`${p.module}:${p.action}`] = p.allowed;
  }
  return map;
}

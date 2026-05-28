import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requirePromarkApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

const PROMARK_ROLES = ['SUPERADMIN', 'LAWYER', 'BRAND_ANALYST', 'ASSISTANT'] as const;
type PromarkRole = (typeof PROMARK_ROLES)[number];

/**
 * GET /api/promark/role-config
 * Lista la configuración de los 4 roles del staff Promark. SUPERADMIN only.
 */
export async function GET(request: Request) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo SUPERADMIN' }, { status: 403 });
  }

  const configs = await prisma.promarkRoleConfig.findMany();
  const byRole = new Map(configs.map((c) => [c.role, c]));

  const result = PROMARK_ROLES.map((r) => ({
    role: r,
    label: byRole.get(r)?.label ?? null,
    permissions: (byRole.get(r)?.permissions ?? {}) as Record<string, boolean>,
  }));

  return NextResponse.json({ roles: result });
}

/**
 * PATCH /api/promark/role-config
 * Body: { role: PromarkRole, label?: string, permissions?: Record<string, boolean> }
 *
 * Upsert por rol — shallow merge de permissions.
 */
export async function PATCH(request: Request) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo SUPERADMIN' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const role = body?.role;
  if (!role || !PROMARK_ROLES.includes(role as PromarkRole)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
  }

  const existing = await prisma.promarkRoleConfig.findUnique({ where: { role } });
  const currentPerms = (existing?.permissions ?? {}) as Record<string, boolean>;
  const nextPerms: Record<string, boolean> = {
    ...currentPerms,
    ...((body?.permissions ?? {}) as Record<string, boolean>),
  };

  const config = await prisma.promarkRoleConfig.upsert({
    where: { role },
    update: {
      label: typeof body?.label === 'string' ? body.label.trim() || null : existing?.label,
      permissions: nextPerms,
    },
    create: {
      role,
      label: typeof body?.label === 'string' ? body.label.trim() || null : null,
      permissions: nextPerms,
    },
  });

  return NextResponse.json({ config });
}

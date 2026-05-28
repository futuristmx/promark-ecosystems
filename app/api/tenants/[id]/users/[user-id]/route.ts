import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';

const VALID_ROLES = ['CLIENT_ADMIN', 'CLIENT_VIEWER', 'CLIENT_LEGAL_REP'] as const;
const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'REVOKED'] as const;

async function guard(request: Request) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return { error: session as Response };
  const userType = getSessionUserType(session);
  const role = getSessionRole(session);
  if (userType !== 'PROMARK' || role !== 'SUPERADMIN') {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { ok: true as const };
}

/**
 * PATCH /api/tenants/[id]/users/[user-id]
 * Edita un usuario del portal cliente: full_name, email, role, status.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; 'user-id': string }> }
) {
  const g = await guard(request);
  if (g.error) return g.error;

  const { id: tenantId, 'user-id': userId } = await params;
  const body = await request.json();
  const { full_name, email, role: userRole, status } = body ?? {};

  const data: Record<string, string> = {};
  if (full_name !== undefined) {
    if (typeof full_name !== 'string' || full_name.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre inválido.' }, { status: 400 });
    }
    data.full_name = full_name.trim();
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }
    data.email = email.toLowerCase().trim();
  }
  if (userRole !== undefined) {
    if (!VALID_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 });
    }
    data.role = userRole;
  }
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }
    data.status = status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Sin cambios.' }, { status: 400 });
  }

  // Verificar pertenencia al tenant
  const existing = await prisma.userClient.findFirst({
    where: { id: userId, tenant_id: tenantId },
    select: { id: true, email: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  }

  // Si cambia el email, verificar unicidad por tenant
  if (data.email && data.email !== existing.email) {
    const dup = await prisma.userClient.findFirst({
      where: { tenant_id: tenantId, email: data.email, NOT: { id: userId } },
    });
    if (dup) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email en este portal.' },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.userClient.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      full_name: true,
      email: true,
      card_id: true,
      role: true,
      status: true,
      pin_generated_at: true,
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}

/**
 * DELETE /api/tenants/[id]/users/[user-id]
 * Elimina un usuario del portal cliente (hard delete — sus asignaciones de holder
 * en cascada se eliminan por la relación, y el card_id queda libre).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; 'user-id': string }> }
) {
  const g = await guard(request);
  if (g.error) return g.error;

  const { id: tenantId, 'user-id': userId } = await params;

  const existing = await prisma.userClient.findFirst({
    where: { id: userId, tenant_id: tenantId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  }

  // Asegurar que no se quede el tenant sin admins
  const adminCount = await prisma.userClient.count({
    where: { tenant_id: tenantId, role: 'CLIENT_ADMIN', NOT: { id: userId } },
  });
  const target = await prisma.userClient.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (target?.role === 'CLIENT_ADMIN' && adminCount === 0) {
    return NextResponse.json(
      { error: 'No puedes eliminar al último administrador del portal.' },
      { status: 400 }
    );
  }

  await prisma.userClientHolder.deleteMany({ where: { user_client_id: userId } });
  await prisma.userClient.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}

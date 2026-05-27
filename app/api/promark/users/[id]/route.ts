import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requirePromarkApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { PromarkRole, UserStatus } from '@prisma/client';

const VALID_ROLES: PromarkRole[] = ['SUPERADMIN', 'LAWYER', 'BRAND_ANALYST', 'ASSISTANT'];
const VALID_STATUS: UserStatus[] = ['ACTIVE', 'INACTIVE'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/promark/users/[id]
 * Actualiza full_name, role, status, avatar. Email es inmutable.
 * Solo SUPERADMIN.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo SUPERADMIN' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body?.full_name === 'string' && body.full_name.trim().length >= 2) {
    data.full_name = body.full_name.trim();
  }
  if (typeof body?.role === 'string' && VALID_ROLES.includes(body.role as PromarkRole)) {
    // No permitir que el último SUPERADMIN se degrade a sí mismo.
    if (id === session.id && body.role !== 'SUPERADMIN') {
      const supercount = await prisma.userPromark.count({
        where: { role: 'SUPERADMIN', status: 'ACTIVE' },
      });
      if (supercount <= 1) {
        return NextResponse.json(
          { error: 'No puedes degradar el último SUPERADMIN activo' },
          { status: 409 }
        );
      }
    }
    data.role = body.role;
  }
  if (typeof body?.status === 'string' && VALID_STATUS.includes(body.status as UserStatus)) {
    if (id === session.id && body.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'No puedes desactivarte a ti mismo' },
        { status: 409 }
      );
    }
    data.status = body.status;
  }
  if (body?.avatar !== undefined) {
    data.avatar = body.avatar;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const user = await prisma.userPromark.update({
    where: { id },
    data,
    select: {
      id: true, email: true, full_name: true, role: true, status: true,
      avatar: true, last_login: true, created_at: true,
    },
  });

  return NextResponse.json({ user });
}

/**
 * DELETE /api/promark/users/[id]
 * Borra el usuario del staff Y de Supabase Auth.
 * Solo SUPERADMIN. No puedes borrarte a ti mismo.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo SUPERADMIN' }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.id) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 409 });
  }

  const user = await prisma.userPromark.findUnique({
    where: { id },
    select: { id: true, supabase_auth_id: true, role: true, status: true, full_name: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  // No permitir eliminar al último SUPERADMIN activo
  if (user.role === 'SUPERADMIN' && user.status === 'ACTIVE') {
    const supercount = await prisma.userPromark.count({
      where: { role: 'SUPERADMIN', status: 'ACTIVE' },
    });
    if (supercount <= 1) {
      return NextResponse.json(
        { error: 'No puedes eliminar el último SUPERADMIN activo' },
        { status: 409 }
      );
    }
  }

  await prisma.userPromark.delete({ where: { id } });
  const supabase = getSupabaseAdmin();
  await supabase.auth.admin.deleteUser(user.supabase_auth_id).catch(() => {
    /* el usuario en BD ya fue borrado; loggear pero no fallar */
  });

  return NextResponse.json({ deleted: { id, name: user.full_name } });
}

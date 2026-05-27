import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requirePromarkApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { PromarkRole, UserStatus } from '@prisma/client';

const VALID_ROLES: PromarkRole[] = ['SUPERADMIN', 'LAWYER', 'BRAND_ANALYST', 'ASSISTANT'];

/**
 * GET /api/promark/users
 * Lista todos los usuarios del staff Promark. Solo SUPERADMIN.
 */
export async function GET(request: Request) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo SUPERADMIN' }, { status: 403 });
  }

  const users = await prisma.userPromark.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      status: true,
      avatar: true,
      last_login: true,
      created_at: true,
    },
  });

  return NextResponse.json({ users });
}

/**
 * POST /api/promark/users
 * Crea usuario en Supabase Auth + UserPromark con la liga al auth_id.
 * Body: { email, full_name, role, password, avatar? }
 */
export async function POST(request: Request) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo SUPERADMIN' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email: string | undefined = body?.email?.toString().trim().toLowerCase();
  const full_name: string | undefined = body?.full_name?.toString().trim();
  const role: string | undefined = body?.role;
  const password: string | undefined = body?.password;
  const avatar: unknown = body?.avatar ?? null;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }
  if (!full_name || full_name.length < 2) {
    return NextResponse.json({ error: 'Nombre completo requerido' }, { status: 400 });
  }
  if (!role || !VALID_ROLES.includes(role as PromarkRole)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  // Conflict: email ya existe
  const existing = await prisma.userPromark.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
  }

  // 1. Crear en Supabase Auth
  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (authError || !authData.user) {
    return NextResponse.json(
      { error: `Error creando usuario en Auth: ${authError?.message ?? 'desconocido'}` },
      { status: 500 }
    );
  }

  // 2. Crear en UserPromark
  try {
    const user = await prisma.userPromark.create({
      data: {
        email,
        full_name,
        role: role as PromarkRole,
        avatar: avatar as never,
        supabase_auth_id: authData.user.id,
      },
      select: {
        id: true, email: true, full_name: true, role: true, status: true,
        avatar: true, last_login: true, created_at: true,
      },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    // Rollback en Supabase Auth si Prisma falla
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
    return NextResponse.json(
      { error: `Error guardando usuario: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

// Helper exported para que el route handler de [id] revalide el rol.
export { VALID_ROLES };
export type { PromarkRole, UserStatus };

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requirePromarkApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/promark/users/[id]/reset-password
 * Body: { password: string }
 *
 * El SUPERADMIN asigna una contraseña nueva al usuario. Útil cuando alguien
 * olvida su contraseña y no quiere usar el flujo de recovery por email.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo SUPERADMIN' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const password: string | undefined = body?.password;
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: 'La contraseña debe tener al menos 8 caracteres' },
      { status: 400 }
    );
  }

  const user = await prisma.userPromark.findUnique({
    where: { id },
    select: { supabase_auth_id: true, email: true, full_name: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.auth.admin.updateUserById(user.supabase_auth_id, {
    password,
  });
  if (error) {
    return NextResponse.json(
      { error: `Error reseteando contraseña: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    user: { id, email: user.email, full_name: user.full_name },
  });
}

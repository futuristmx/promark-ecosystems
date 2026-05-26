import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';

/**
 * POST /api/tenants/[id]/reset-password
 * Superadmin resets the client user's password for a given tenant.
 * Body: { newPassword: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;

  // Only superadmins can reset client passwords
  const userType = getSessionUserType(session);
  const role = getSessionRole(session);
  if (userType !== 'PROMARK' || role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: tenantId } = await params;
  const { newPassword } = await request.json();

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return NextResponse.json(
      { error: 'La contraseña debe tener al menos 6 caracteres.' },
      { status: 400 }
    );
  }

  // Find the client user linked to this tenant
  const clientUser = await prisma.user.findFirst({
    where: { tenant_id: tenantId, user_type: 'CLIENT' },
    select: { id: true, auth_id: true, email: true },
  });

  if (!clientUser || !clientUser.auth_id) {
    return NextResponse.json(
      { error: 'No se encontró usuario cliente para este tenant.' },
      { status: 404 }
    );
  }

  // Use Supabase admin to update the user's password
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.admin.updateUserById(clientUser.auth_id, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, email: clientUser.email });
}

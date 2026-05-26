import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { hashPin } from '@/lib/auth/client-pin';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';

/**
 * POST /api/tenants/[id]/reset-password
 * Superadmin resets a client user's PIN for a given tenant.
 * Body: { userId: string, newPin: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;

  const userType = getSessionUserType(session);
  const role = getSessionRole(session);
  if (userType !== 'PROMARK' || role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: tenantId } = await params;
  const { userId, newPin } = await request.json();

  if (!newPin || typeof newPin !== 'string' || newPin.length < 4) {
    return NextResponse.json(
      { error: 'El PIN debe tener al menos 4 caracteres.' },
      { status: 400 }
    );
  }

  // If userId provided, reset that specific user; otherwise reset the first ADMIN client
  let targetUser;
  if (userId) {
    targetUser = await prisma.userClient.findFirst({
      where: { id: userId, tenant_id: tenantId },
      select: { id: true, full_name: true, email: true },
    });
  } else {
    targetUser = await prisma.userClient.findFirst({
      where: { tenant_id: tenantId, role: 'CLIENT_ADMIN' },
      select: { id: true, full_name: true, email: true },
    });
  }

  if (!targetUser) {
    return NextResponse.json(
      { error: 'No se encontró usuario cliente para este tenant.' },
      { status: 404 }
    );
  }

  const pin_hash = await hashPin(newPin);

  await prisma.userClient.update({
    where: { id: targetUser.id },
    data: { pin_hash, pin_generated_at: new Date() },
  });

  return NextResponse.json({ ok: true, email: targetUser.email, name: targetUser.full_name });
}

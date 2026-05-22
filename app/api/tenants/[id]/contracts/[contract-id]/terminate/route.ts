import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requireApiAuth, isErrorResponse, getSessionUserId } from '@/lib/auth/api-helpers';

const PROMARK_TERMINATE = new Set(['SUPERADMIN', 'LAWYER']);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; 'contract-id': string }> }
) {
  const { id: tenantId, 'contract-id': contractId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType !== 'PROMARK' || !PROMARK_TERMINATE.has(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const existing = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenantId, deleted_at: null },
  });
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const reason = body?.reason ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.contract.update({
      where: { id: contractId },
      data: { status: 'TERMINATED', terminated_at: new Date() },
    });
    await tx.contractHistory.create({
      data: {
        contract_id: contractId,
        change_type: 'TERMINATED',
        changed_by_user_id: getSessionUserId(session),
        changed_by_user_type: 'PROMARK',
        summary: reason ? `Contrato terminado: ${reason}` : 'Contrato terminado',
        previous_value: { status: existing.status },
        new_value: { status: 'TERMINATED' },
      },
    });
    return u;
  });

  return NextResponse.json({ contract: updated });
}

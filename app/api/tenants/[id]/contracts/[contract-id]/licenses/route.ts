import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requireApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; 'contract-id': string }> }
) {
  const { id: tenantId, 'contract-id': contractId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType === 'CLIENT' && session.tenant_id !== tenantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const licenses = await prisma.license.findMany({
    where: { tenant_id: tenantId, contract_id: contractId, deleted_at: null },
    include: { brand: { select: { id: true, name: true } } },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json({ licenses });
}

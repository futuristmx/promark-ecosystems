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

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenantId },
    select: { id: true },
  });
  if (!contract) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  if (session.userType === 'CLIENT' && session.tenant_id !== tenantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const history = await prisma.contractHistory.findMany({
    where: { contract_id: contractId },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json({ history });
}

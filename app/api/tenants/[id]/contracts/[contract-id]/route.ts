import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserId,
} from '@/lib/auth/api-helpers';

const PROMARK_UPDATE = new Set(['SUPERADMIN', 'LAWYER']);

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

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenantId, deleted_at: null },
    include: {
      contract_brands: {
        include: { brand: { select: { id: true, name: true } } },
      },
      licenses: {
        where: { deleted_at: null },
        include: { brand: { select: { id: true, name: true } } },
      },
    },
  });
  if (!contract) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ contract });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; 'contract-id': string }> }
) {
  const { id: tenantId, 'contract-id': contractId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType !== 'PROMARK' || !PROMARK_UPDATE.has(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const existing = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenantId, deleted_at: null },
  });
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  const fields = [
    'contract_type', 'title', 'description', 'parties', 'renewal_terms',
    'status', 'financial_terms', 'governing_law', 'notes',
  ];
  for (const f of fields) if (f in body) data[f] = body[f];
  if ('effective_date' in body) data.effective_date = body.effective_date ? new Date(body.effective_date) : null;
  if ('expiration_date' in body) data.expiration_date = body.expiration_date ? new Date(body.expiration_date) : null;

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.contract.update({ where: { id: contractId }, data });
    await tx.contractHistory.create({
      data: {
        contract_id: contractId,
        change_type: 'UPDATED',
        changed_by_user_id: getSessionUserId(session),
        changed_by_user_type: 'PROMARK',
        summary: 'Contrato actualizado',
        previous_value: { status: existing.status, title: existing.title },
        new_value: data as object,
      },
    });
    return u;
  });

  return NextResponse.json({ contract: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; 'contract-id': string }> }
) {
  const { id: tenantId, 'contract-id': contractId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType !== 'PROMARK' || !PROMARK_UPDATE.has(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const existing = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenantId, deleted_at: null },
  });
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.contract.update({ where: { id: contractId }, data: { deleted_at: new Date() } });
    await tx.contractHistory.create({
      data: {
        contract_id: contractId,
        change_type: 'UPDATED',
        changed_by_user_id: getSessionUserId(session),
        changed_by_user_type: 'PROMARK',
        summary: 'Contrato eliminado (soft delete)',
      },
    });
  });
  return NextResponse.json({ ok: true });
}

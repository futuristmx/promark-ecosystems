import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requireApiAuth, isErrorResponse, getSessionUserId } from '@/lib/auth/api-helpers';

const PROMARK_WRITE = new Set(['SUPERADMIN', 'LAWYER']);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; 'contract-id': string }> }
) {
  const { id: tenantId, 'contract-id': contractId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType !== 'PROMARK' || !PROMARK_WRITE.has(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenantId, deleted_at: null },
  });
  if (!contract) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const body = await request.json();
  const brandId = body?.brand_id;
  const scope = body?.scope ?? null;
  if (!brandId) return NextResponse.json({ error: 'brand_id requerido' }, { status: 400 });

  const brand = await prisma.brand.findFirst({ where: { id: brandId, tenant_id: tenantId } });
  if (!brand) return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });

  const link = await prisma.$transaction(async (tx) => {
    const cb = await tx.contractBrand.create({
      data: { contract_id: contractId, brand_id: brandId, scope },
    });
    await tx.contractHistory.create({
      data: {
        contract_id: contractId,
        change_type: 'BRAND_LINKED',
        changed_by_user_id: getSessionUserId(session),
        changed_by_user_type: 'PROMARK',
        summary: `Marca vinculada: ${brand.name}`,
        new_value: { brand_id: brandId, brand_name: brand.name },
      },
    });
    return cb;
  });
  return NextResponse.json({ contract_brand: link }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; 'contract-id': string }> }
) {
  const { id: tenantId, 'contract-id': contractId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType !== 'PROMARK' || !PROMARK_WRITE.has(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brand_id');
  if (!brandId) return NextResponse.json({ error: 'brand_id requerido' }, { status: 400 });

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenantId, deleted_at: null },
  });
  if (!contract) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const brand = await prisma.brand.findFirst({ where: { id: brandId } });

  await prisma.$transaction(async (tx) => {
    await tx.contractBrand.deleteMany({ where: { contract_id: contractId, brand_id: brandId } });
    await tx.contractHistory.create({
      data: {
        contract_id: contractId,
        change_type: 'BRAND_UNLINKED',
        changed_by_user_id: getSessionUserId(session),
        changed_by_user_type: 'PROMARK',
        summary: `Marca desvinculada: ${brand?.name ?? brandId}`,
        previous_value: { brand_id: brandId, brand_name: brand?.name ?? null },
      },
    });
  });
  return NextResponse.json({ ok: true });
}

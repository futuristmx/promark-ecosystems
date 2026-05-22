import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserId,
  getSessionRole,
} from '@/lib/auth/api-helpers';

const PROMARK_WRITE_ROLES = new Set(['SUPERADMIN', 'LAWYER', 'BRAND_ANALYST']);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;

  if (session.userType === 'CLIENT' && session.tenant_id !== tenantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const brandId = searchParams.get('brand_id');
  const vigency = searchParams.get('vigency');
  const search = searchParams.get('search');

  const where: Prisma.ContractWhereInput = {
    tenant_id: tenantId,
    deleted_at: null,
  };

  if (type) where.contract_type = type as Prisma.EnumContractTypeFilter['equals'];
  if (status) where.status = status as Prisma.EnumContractStatusFilter['equals'];
  if (brandId) where.contract_brands = { some: { brand_id: brandId } };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 86400000);
  if (vigency === 'vigentes') {
    where.expiration_date = { gt: in90 };
    where.status = 'ACTIVE';
  } else if (vigency === 'por_vencer') {
    where.expiration_date = { gte: now, lte: in90 };
  } else if (vigency === 'vencidos') {
    where.expiration_date = { lt: now };
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      contract_brands: {
        include: { brand: { select: { id: true, name: true } } },
      },
      _count: { select: { licenses: { where: { deleted_at: null } } } },
    },
    orderBy: { created_at: 'desc' },
  });

  const userRole = getSessionRole(session);
  return NextResponse.json({ contracts, userRole });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;

  if (session.userType !== 'PROMARK' || !PROMARK_WRITE_ROLES.has(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const {
    contract_type,
    title,
    description,
    parties,
    effective_date,
    expiration_date,
    renewal_terms,
    status,
    financial_terms,
    governing_law,
    notes,
    brand_ids,
  } = body ?? {};

  if (!contract_type || !title) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const contract = await tx.contract.create({
      data: {
        tenant_id: tenantId,
        contract_type,
        title,
        description: description ?? null,
        parties: parties ?? undefined,
        effective_date: effective_date ? new Date(effective_date) : null,
        expiration_date: expiration_date ? new Date(expiration_date) : null,
        renewal_terms: renewal_terms ?? null,
        status: status ?? 'DRAFT',
        financial_terms: financial_terms ?? undefined,
        governing_law: governing_law ?? null,
        notes: notes ?? null,
      },
    });

    if (Array.isArray(brand_ids) && brand_ids.length > 0) {
      for (const bid of brand_ids) {
        await tx.contractBrand.create({
          data: { contract_id: contract.id, brand_id: bid },
        });
      }
    }

    await tx.contractHistory.create({
      data: {
        contract_id: contract.id,
        change_type: 'CREATED',
        changed_by_user_id: getSessionUserId(session),
        changed_by_user_type: 'PROMARK',
        summary: `Contrato "${contract.title}" creado`,
        new_value: { contract_type, title, status: contract.status },
      },
    });

    return contract;
  });

  return NextResponse.json({ contract: result }, { status: 201 });
}

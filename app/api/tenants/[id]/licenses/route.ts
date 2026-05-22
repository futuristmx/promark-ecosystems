import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserId,
  getSessionRole,
} from '@/lib/auth/api-helpers';

const PROMARK_CREATE = new Set(['SUPERADMIN', 'LAWYER', 'BRAND_ANALYST']);

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
  const contractId = searchParams.get('contract_id');
  const vigency = searchParams.get('vigency');
  const search = searchParams.get('search');

  const where: Prisma.LicenseWhereInput = { tenant_id: tenantId, deleted_at: null };
  if (type) where.license_type = type as Prisma.EnumLicenseTypeFilter['equals'];
  if (status) where.status = status as Prisma.EnumLicenseStatusFilter['equals'];
  if (brandId) where.brand_id = brandId;
  if (contractId) where.contract_id = contractId;
  if (search) {
    where.OR = [
      { licensee_name: { contains: search, mode: 'insensitive' } },
      { licensee_rfc: { contains: search, mode: 'insensitive' } },
    ];
  }
  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 86400000);
  if (vigency === 'vigentes') where.expiration_date = { gt: in90 };
  else if (vigency === 'por_vencer') where.expiration_date = { gte: now, lte: in90 };
  else if (vigency === 'vencidos') where.expiration_date = { lt: now };

  const licenses = await prisma.license.findMany({
    where,
    include: {
      brand: { select: { id: true, name: true } },
      contract: { select: { id: true, title: true } },
    },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json({ licenses, userRole: getSessionRole(session) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType !== 'PROMARK' || !PROMARK_CREATE.has(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const {
    contract_id, brand_id, license_type, licensee_name, licensee_rfc,
    territory, permitted_uses, prohibited_uses, effective_date, expiration_date,
    status, royalty_rate, royalty_terms, notes,
  } = body ?? {};

  if (!brand_id || !license_type || !licensee_name) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
  }

  const brand = await prisma.brand.findFirst({ where: { id: brand_id, tenant_id: tenantId } });
  if (!brand) return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });

  if (contract_id) {
    const c = await prisma.contract.findFirst({
      where: { id: contract_id, tenant_id: tenantId, deleted_at: null },
    });
    if (!c) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const license = await tx.license.create({
      data: {
        tenant_id: tenantId,
        contract_id: contract_id ?? null,
        brand_id,
        license_type,
        licensee_name,
        licensee_rfc: licensee_rfc ?? null,
        territory: Array.isArray(territory) ? territory : [],
        permitted_uses: permitted_uses ?? null,
        prohibited_uses: prohibited_uses ?? null,
        effective_date: effective_date ? new Date(effective_date) : null,
        expiration_date: expiration_date ? new Date(expiration_date) : null,
        status: status ?? 'DRAFT',
        royalty_rate: royalty_rate ?? null,
        royalty_terms: royalty_terms ?? null,
        notes: notes ?? null,
      },
    });

    if (contract_id) {
      await tx.contractHistory.create({
        data: {
          contract_id,
          change_type: 'LICENSE_DERIVED',
          changed_by_user_id: getSessionUserId(session),
          changed_by_user_type: 'PROMARK',
          summary: `Licencia derivada: ${licensee_name}`,
          new_value: { license_id: license.id, licensee_name, brand_id },
        },
      });
    }
    return license;
  });

  return NextResponse.json({ license: result }, { status: 201 });
}

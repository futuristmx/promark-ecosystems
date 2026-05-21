import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { Prisma } from '@prisma/client';
import {
  requireApiAuth,
  requirePermission,
  isErrorResponse,
  getSessionUserId,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';
import {
  createHolderSchema,
  validateWithSchema,
} from '@/lib/validations/brand.schema';

// ─── GET /api/tenants/[id]/holders ──────────────────────────────────────────
// List holders for a tenant. Optional ?search filter.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    if (session.userType === 'CLIENT' && session.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden: Tenant mismatch' }, { status: 403 });
    }

    const permError = await requirePermission({
      userId: getSessionUserId(session),
      userType: getSessionUserType(session),
      role: getSessionRole(session),
      module: 'brand_catalog',
      action: 'READ',
    });
    if (permError) return permError;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const where: Prisma.HolderWhereInput = { tenant_id: tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rfc: { contains: search, mode: 'insensitive' } },
        { curp: { contains: search, mode: 'insensitive' } },
      ];
    }

    const holders = await prisma.holder.findMany({
      where,
      include: {
        _count: { select: { brand_holders: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ holders });
  } catch (error) {
    console.error('Holders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/tenants/[id]/holders ─────────────────────────────────────────
// Create a new holder

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    if (session.userType === 'CLIENT' && session.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden: Tenant mismatch' }, { status: 403 });
    }

    const permError = await requirePermission({
      userId: getSessionUserId(session),
      userType: getSessionUserType(session),
      role: getSessionRole(session),
      module: 'brand_catalog',
      action: 'CREATE',
    });
    if (permError) return permError;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateWithSchema(createHolderSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.data!;

    const holder = await prisma.holder.create({
      data: {
        tenant_id: tenantId,
        name: data.name,
        holder_type: data.holder_type,
        rfc: data.rfc ?? undefined,
        curp: data.curp ?? undefined,
        nationality: data.nationality ?? undefined,
        address: data.address === null
          ? Prisma.JsonNull
          : data.address !== undefined
            ? (data.address as Prisma.InputJsonValue)
            : undefined,
        contact_info: data.contact_info === null
          ? Prisma.JsonNull
          : data.contact_info !== undefined
            ? (data.contact_info as Prisma.InputJsonValue)
            : undefined,
        notes: data.notes ?? undefined,
      },
    });

    return NextResponse.json({ holder }, { status: 201 });
  } catch (error) {
    console.error('Holders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

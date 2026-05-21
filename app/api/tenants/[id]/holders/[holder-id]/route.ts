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
  updateHolderSchema,
  validateWithSchema,
} from '@/lib/validations/brand.schema';

interface RouteParams {
  params: Promise<{ id: string; 'holder-id': string }>;
}

// ─── GET /api/tenants/[id]/holders/[holder-id] ──────────────────────────────
// Get holder detail with linked brands

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: tenantId, 'holder-id': holderId } = await params;

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

    const holder = await prisma.holder.findFirst({
      where: { id: holderId, tenant_id: tenantId },
      include: {
        brand_holders: {
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                legal_status: true,
                brand_type: true,
                registration_number: true,
                expiration_date: true,
                company: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!holder) {
      return NextResponse.json({ error: 'Holder not found' }, { status: 404 });
    }

    return NextResponse.json({ holder });
  } catch (error) {
    console.error('Holder GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/tenants/[id]/holders/[holder-id] ──────────────────────────────
// Update a holder

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: tenantId, 'holder-id': holderId } = await params;

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
      action: 'UPDATE',
    });
    if (permError) return permError;

    const existing = await prisma.holder.findFirst({
      where: { id: holderId, tenant_id: tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Holder not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateWithSchema(updateHolderSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.data!;

    // Build update data with proper JSON field handling for Prisma
    const updateData: Prisma.HolderUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.holder_type !== undefined && { holder_type: data.holder_type }),
      ...(data.rfc !== undefined && { rfc: data.rfc }),
      ...(data.curp !== undefined && { curp: data.curp }),
      ...(data.nationality !== undefined && { nationality: data.nationality }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };

    // Handle JSON fields explicitly for Prisma null semantics
    if (data.address !== undefined) {
      updateData.address = data.address === null
        ? Prisma.JsonNull
        : (data.address as Prisma.InputJsonValue);
    }
    if (data.contact_info !== undefined) {
      updateData.contact_info = data.contact_info === null
        ? Prisma.JsonNull
        : (data.contact_info as Prisma.InputJsonValue);
    }

    const holder = await prisma.holder.update({
      where: { id: holderId },
      data: updateData,
    });

    return NextResponse.json({ holder });
  } catch (error) {
    console.error('Holder PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

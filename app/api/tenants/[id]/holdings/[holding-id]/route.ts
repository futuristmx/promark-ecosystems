import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  requirePermission,
  isErrorResponse,
  getSessionUserId,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';
import {
  updateHoldingSchema,
  validateWithSchema,
} from '@/lib/validations/brand.schema';

interface RouteParams {
  params: Promise<{ id: string; 'holding-id': string }>;
}

// ─── GET /api/tenants/[id]/holdings/[holding-id] ────────────────────────────
// Get holding detail

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: tenantId, 'holding-id': holdingId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    if (session.userType === 'CLIENT' && session.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden: Tenant mismatch' }, { status: 403 });
    }

    const permError = await requirePermission({
      userId: getSessionUserId(session),
      userType: getSessionUserType(session),
      role: getSessionRole(session),
      module: 'corporate_structure',
      action: 'READ',
    });
    if (permError) return permError;

    const holding = await prisma.holding.findFirst({
      where: { id: holdingId, tenant_id: tenantId },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            legal_name: true,
            company_type: true,
            status: true,
            _count: { select: { brands: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!holding) {
      return NextResponse.json({ error: 'Holding not found' }, { status: 404 });
    }

    return NextResponse.json({ holding });
  } catch (error) {
    console.error('Holding GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/tenants/[id]/holdings/[holding-id] ────────────────────────────
// Update a holding

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: tenantId, 'holding-id': holdingId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    if (session.userType === 'CLIENT' && session.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden: Tenant mismatch' }, { status: 403 });
    }

    const permError = await requirePermission({
      userId: getSessionUserId(session),
      userType: getSessionUserType(session),
      role: getSessionRole(session),
      module: 'corporate_structure',
      action: 'UPDATE',
    });
    if (permError) return permError;

    // Verify holding exists and belongs to tenant
    const existing = await prisma.holding.findFirst({
      where: { id: holdingId, tenant_id: tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Holding not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateWithSchema(updateHoldingSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const holding = await prisma.holding.update({
      where: { id: holdingId },
      data: validation.data!,
    });

    return NextResponse.json({ holding });
  } catch (error) {
    console.error('Holding PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

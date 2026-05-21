import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  requirePermission,
  isErrorResponse,
  getSessionUserId,
  getSessionUserType,
  getSessionRole,
  type ApiSession,
} from '@/lib/auth/api-helpers';
import {
  createHoldingSchema,
  validateWithSchema,
} from '@/lib/validations/brand.schema';

// ─── GET /api/tenants/[id]/holdings ─────────────────────────────────────────
// List all holdings for a tenant

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    // Verify tenant access for client users
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

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const holdings = await prisma.holding.findMany({
      where: { tenant_id: tenantId },
      include: {
        _count: { select: { companies: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ holdings });
  } catch (error) {
    console.error('Holdings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/tenants/[id]/holdings ────────────────────────────────────────
// Create a new holding

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
      module: 'corporate_structure',
      action: 'CREATE',
    });
    if (permError) return permError;

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateWithSchema(createHoldingSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const holding = await prisma.holding.create({
      data: {
        tenant_id: tenantId,
        ...validation.data!,
      },
    });

    return NextResponse.json({ holding }, { status: 201 });
  } catch (error) {
    console.error('Holdings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

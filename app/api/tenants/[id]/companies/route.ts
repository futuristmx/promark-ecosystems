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
  createCompanySchema,
  validateWithSchema,
} from '@/lib/validations/brand.schema';

// ─── GET /api/tenants/[id]/companies ────────────────────────────────────────
// List companies for a tenant. Optional ?holding_id filter.

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
      module: 'corporate_structure',
      action: 'READ',
    });
    if (permError) return permError;

    const { searchParams } = new URL(request.url);
    const holdingId = searchParams.get('holding_id');

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const where: { tenant_id: string; holding_id?: string } = { tenant_id: tenantId };
    if (holdingId) {
      where.holding_id = holdingId;
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        holding: { select: { id: true, name: true } },
        _count: { select: { brands: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Companies GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/tenants/[id]/companies ───────────────────────────────────────
// Create a new company

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

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateWithSchema(createCompanySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.data!;

    // Verify holding belongs to tenant
    const holding = await prisma.holding.findFirst({
      where: { id: data.holding_id, tenant_id: tenantId },
    });
    if (!holding) {
      return NextResponse.json(
        { error: 'Holding not found in this tenant' },
        { status: 400 }
      );
    }

    // Verify parent_company belongs to tenant if provided
    if (data.parent_company_id) {
      const parentCompany = await prisma.company.findFirst({
        where: { id: data.parent_company_id, tenant_id: tenantId },
      });
      if (!parentCompany) {
        return NextResponse.json(
          { error: 'Parent company not found in this tenant' },
          { status: 400 }
        );
      }
    }

    const company = await prisma.company.create({
      data: {
        tenant_id: tenantId,
        name: data.name,
        legal_name: data.legal_name,
        rfc: data.rfc ?? undefined,
        company_type: data.company_type,
        holding_id: data.holding_id,
        parent_company_id: data.parent_company_id ?? undefined,
        country: data.country,
        state: data.state ?? undefined,
        notes: data.notes ?? undefined,
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error('Companies POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

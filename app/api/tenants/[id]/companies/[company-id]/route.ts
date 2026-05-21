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
  updateCompanySchema,
  validateWithSchema,
} from '@/lib/validations/brand.schema';

interface RouteParams {
  params: Promise<{ id: string; 'company-id': string }>;
}

// ─── GET /api/tenants/[id]/companies/[company-id] ───────────────────────────
// Get company detail with brands count

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: tenantId, 'company-id': companyId } = await params;

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

    const company = await prisma.company.findFirst({
      where: { id: companyId, tenant_id: tenantId },
      include: {
        holding: { select: { id: true, name: true, legal_name: true } },
        parent_company: { select: { id: true, name: true } },
        subsidiaries: { select: { id: true, name: true, company_type: true, status: true } },
        _count: { select: { brands: true } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Company GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/tenants/[id]/companies/[company-id] ───────────────────────────
// Update a company

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: tenantId, 'company-id': companyId } = await params;

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

    const existing = await prisma.company.findFirst({
      where: { id: companyId, tenant_id: tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateWithSchema(updateCompanySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.data!;

    // Verify holding belongs to tenant if changing
    if (data.holding_id) {
      const holding = await prisma.holding.findFirst({
        where: { id: data.holding_id, tenant_id: tenantId },
      });
      if (!holding) {
        return NextResponse.json(
          { error: 'Holding not found in this tenant' },
          { status: 400 }
        );
      }
    }

    // Verify parent_company belongs to tenant if changing
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
      // Prevent circular reference
      if (data.parent_company_id === companyId) {
        return NextResponse.json(
          { error: 'Company cannot be its own parent' },
          { status: 400 }
        );
      }
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data,
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Company PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

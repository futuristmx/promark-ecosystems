import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import {
  requireApiAuth,
  requirePermission,
  isErrorResponse,
  getSessionUserId,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';
import {
  createBrandSchema,
  validateWithSchema,
} from '@/lib/validations/brand.schema';

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── GET /api/tenants/[id]/brands ───────────────────────────────────────────
// List brands with filters: ?company_id, ?legal_status, ?search, ?vigency

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
    const companyId = searchParams.get('company_id');
    const legalStatus = searchParams.get('legal_status');
    const search = searchParams.get('search');
    const vigency = searchParams.get('vigency');

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Build where clause
    const where: Prisma.BrandWhereInput = { tenant_id: tenantId };

    if (companyId) {
      where.company_id = companyId;
    }

    if (legalStatus) {
      where.legal_status = legalStatus as Prisma.EnumLegalStatusFilter['equals'];
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { registration_number: { contains: search, mode: 'insensitive' } },
        { application_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Vigency filter
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    if (vigency === 'active') {
      where.expiration_date = { gt: ninetyDaysFromNow };
    } else if (vigency === 'expiring') {
      where.expiration_date = { gte: now, lte: ninetyDaysFromNow };
    } else if (vigency === 'expired') {
      where.OR = [
        { expiration_date: { lt: now } },
        { legal_status: { in: ['EXPIRED', 'CANCELLED'] } },
      ];
    }

    const brands = await prisma.brand.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        classes: { select: { id: true, class_number: true, status: true } },
        _count: { select: { holders: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Brands GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/tenants/[id]/brands ──────────────────────────────────────────
// Create a new brand + BrandHistory entry

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
    const validation = validateWithSchema(createBrandSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.data!;

    // Verify company belongs to tenant
    const company = await prisma.company.findFirst({
      where: { id: data.company_id, tenant_id: tenantId },
    });
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found in this tenant' },
        { status: 400 }
      );
    }

    const { classes, ...brandData } = data;
    const slug = generateSlug(data.name);

    // Create brand with classes and history in a transaction
    const brand = await prisma.$transaction(async (tx) => {
      const newBrand = await tx.brand.create({
        data: {
          tenant_id: tenantId,
          company_id: brandData.company_id,
          name: brandData.name,
          slug,
          registration_number: brandData.registration_number ?? undefined,
          application_number: brandData.application_number ?? undefined,
          application_date: brandData.application_date ?? undefined,
          registration_date: brandData.registration_date ?? undefined,
          expiration_date: brandData.expiration_date ?? undefined,
          renewal_date: brandData.renewal_date ?? undefined,
          legal_status: brandData.legal_status ?? 'APPLIED',
          brand_type: brandData.brand_type ?? 'WORDMARK',
          description: brandData.description ?? undefined,
          disclaimers: brandData.disclaimers ?? undefined,
        },
        include: {
          company: { select: { id: true, name: true } },
        },
      });

      // Create brand classes if provided
      if (classes && classes.length > 0) {
        await tx.brandClass.createMany({
          data: classes.map((c) => ({
            brand_id: newBrand.id,
            class_number: c.class_number,
            class_description: c.class_description ?? undefined,
            specification: c.specification ?? undefined,
          })),
        });
      }

      // Create BrandHistory entry for registration
      await tx.brandHistory.create({
        data: {
          brand_id: newBrand.id,
          event_type: 'REGISTRATION',
          event_date: new Date(),
          new_state: {
            name: newBrand.name,
            legal_status: newBrand.legal_status,
            brand_type: newBrand.brand_type,
            company_id: newBrand.company_id,
            registration_number: newBrand.registration_number,
            application_number: newBrand.application_number,
          },
          actor_type: session.userType === 'PROMARK' ? 'PROMARK' : 'CLIENT',
          actor_id: getSessionUserId(session),
          actor_role: getSessionRole(session),
          change_type: 'CREATE',
          visible_to_client: true,
        },
      });

      return newBrand;
    });

    // Fetch the brand with classes for response
    const fullBrand = await prisma.brand.findUnique({
      where: { id: brand.id },
      include: {
        company: { select: { id: true, name: true } },
        classes: true,
      },
    });

    return NextResponse.json({ brand: fullBrand }, { status: 201 });
  } catch (error) {
    console.error('Brands POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

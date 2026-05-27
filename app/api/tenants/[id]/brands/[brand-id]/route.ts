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
  updateBrandSchema,
  validateWithSchema,
} from '@/lib/validations/brand.schema';

interface RouteParams {
  params: Promise<{ id: string; 'brand-id': string }>;
}

// ─── GET /api/tenants/[id]/brands/[brand-id] ────────────────────────────────
// Full detail: brand + classes + history (last 10) + holders + contracts

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: tenantId, 'brand-id': brandId } = await params;

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

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, tenant_id: tenantId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            legal_name: true,
            holding: { select: { id: true, name: true } },
          },
        },
        classes: {
          orderBy: { class_number: 'asc' },
        },
        history: {
          orderBy: { event_date: 'desc' },
          take: 10,
          select: {
            id: true,
            event_type: true,
            event_date: true,
            description: true,
            change_type: true,
            actor_type: true,
            visible_to_client: true,
            previous_state: true,
            new_state: true,
            created_at: true,
          },
        },
        holders: {
          include: {
            holder: {
              select: {
                id: true,
                name: true,
                holder_type: true,
                rfc: true,
                status: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        contract_brands: {
          include: {
            contract: {
              select: {
                id: true,
                title: true,
                contract_type: true,
                status: true,
                effective_date: true,
                expiration_date: true,
              },
            },
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Filter history for client users — only show visible entries
    if (session.userType === 'CLIENT') {
      brand.history = brand.history.filter((h) => h.visible_to_client);
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Brand GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/tenants/[id]/brands/[brand-id] ────────────────────────────────
// Update a brand + create BrandHistory with previous_state/new_state

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: tenantId, 'brand-id': brandId } = await params;

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

    // Fetch existing brand for previous_state
    const existing = await prisma.brand.findFirst({
      where: { id: brandId, tenant_id: tenantId },
      include: { classes: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateWithSchema(updateBrandSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.data!;

    // Verify company belongs to tenant if changing
    if (data.company_id) {
      const company = await prisma.company.findFirst({
        where: { id: data.company_id, tenant_id: tenantId },
      });
      if (!company) {
        return NextResponse.json(
          { error: 'Company not found in this tenant' },
          { status: 400 }
        );
      }
    }

    const { classes, ...brandUpdateData } = data;

    // Capture previous state
    const previousState = {
      name: existing.name,
      legal_status: existing.legal_status,
      brand_type: existing.brand_type,
      company_id: existing.company_id,
      registration_number: existing.registration_number,
      application_number: existing.application_number,
      expiration_date: existing.expiration_date,
      renewal_date: existing.renewal_date,
      use_declaration_date: existing.use_declaration_date,
      description: existing.description,
      disclaimers: existing.disclaimers,
    };

    // Determine event type
    const eventType =
      brandUpdateData.legal_status && brandUpdateData.legal_status !== existing.legal_status
        ? 'STATUS_CHANGE'
        : 'MODIFICATION';

    const updatedBrand = await prisma.$transaction(async (tx) => {
      // Update brand
      const brand = await tx.brand.update({
        where: { id: brandId },
        data: brandUpdateData,
      });

      // Update classes if provided — delete existing and recreate
      if (classes !== undefined) {
        await tx.brandClass.deleteMany({ where: { brand_id: brandId } });
        if (classes && classes.length > 0) {
          await tx.brandClass.createMany({
            data: classes.map((c) => ({
              brand_id: brandId,
              class_number: c.class_number,
              class_description: c.class_description ?? undefined,
              specification: c.specification ?? undefined,
            })),
          });
        }
      }

      // Create BrandHistory entry
      const newState = {
        name: brand.name,
        legal_status: brand.legal_status,
        brand_type: brand.brand_type,
        company_id: brand.company_id,
        registration_number: brand.registration_number,
        application_number: brand.application_number,
        expiration_date: brand.expiration_date,
        renewal_date: brand.renewal_date,
        use_declaration_date: brand.use_declaration_date,
        description: brand.description,
        disclaimers: brand.disclaimers,
      };

      await tx.brandHistory.create({
        data: {
          brand_id: brandId,
          event_type: eventType,
          event_date: new Date(),
          previous_state: previousState,
          new_state: newState,
          actor_type: session.userType === 'PROMARK' ? 'PROMARK' : 'CLIENT',
          actor_id: getSessionUserId(session),
          actor_role: getSessionRole(session),
          change_type: 'UPDATE',
          visible_to_client: true,
        },
      });

      return brand;
    });

    // Fetch full brand for response
    const fullBrand = await prisma.brand.findUnique({
      where: { id: updatedBrand.id },
      include: {
        company: { select: { id: true, name: true } },
        classes: { orderBy: { class_number: 'asc' } },
      },
    });

    return NextResponse.json({ brand: fullBrand });
  } catch (error) {
    console.error('Brand PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/tenants/[id]/brands/[brand-id] ─────────────────────────────
// Soft delete: set legal_status to CANCELLED + create BrandHistory entry
// NOTE: A future migration will add a `deleted_at` field. For now we use
// legal_status = CANCELLED as the soft-delete mechanism.

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: tenantId, 'brand-id': brandId } = await params;

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
      action: 'DELETE',
    });
    if (permError) return permError;

    const existing = await prisma.brand.findFirst({
      where: { id: brandId, tenant_id: tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (existing.legal_status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Brand is already cancelled' },
        { status: 400 }
      );
    }

    const previousState = {
      name: existing.name,
      legal_status: existing.legal_status,
      brand_type: existing.brand_type,
      company_id: existing.company_id,
    };

    await prisma.$transaction(async (tx) => {
      // Soft delete: set legal_status to CANCELLED
      await tx.brand.update({
        where: { id: brandId },
        data: { legal_status: 'CANCELLED' },
      });

      // Create BrandHistory entry for cancellation
      await tx.brandHistory.create({
        data: {
          brand_id: brandId,
          event_type: 'CANCELLATION',
          event_date: new Date(),
          previous_state: previousState,
          new_state: { ...previousState, legal_status: 'CANCELLED' },
          description: 'Brand cancelled (soft delete)',
          actor_type: session.userType === 'PROMARK' ? 'PROMARK' : 'CLIENT',
          actor_id: getSessionUserId(session),
          actor_role: getSessionRole(session),
          change_type: 'DELETE',
          visible_to_client: true,
        },
      });
    });

    return NextResponse.json({ message: 'Brand cancelled successfully' });
  } catch (error) {
    console.error('Brand DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

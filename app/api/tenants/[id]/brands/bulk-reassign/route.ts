import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserId,
  getSessionRole,
} from '@/lib/auth/api-helpers';

interface BulkReassignBody {
  brandIds?: unknown;
  target?: { type?: unknown; id?: unknown };
}

type TargetType = 'company' | 'holding' | 'holder';

const ALLOWED_TARGET_TYPES: ReadonlyArray<TargetType> = ['company', 'holding', 'holder'];

// ─── POST /api/tenants/[id]/brands/bulk-reassign ────────────────────────────
// Bulk-reassign multiple brands to a new Company, Holding, or Holder.
// Auth: requires Promark SUPERADMIN or LAWYER role (staff portfolio management).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    // Staff-only operation: Promark SUPERADMIN or LAWYER.
    if (session.userType !== 'PROMARK') {
      return NextResponse.json({ error: 'Forbidden: staff-only' }, { status: 403 });
    }
    const role = getSessionRole(session);
    if (role !== 'SUPERADMIN' && role !== 'LAWYER') {
      return NextResponse.json(
        { error: 'Forbidden: requires SUPERADMIN or LAWYER role' },
        { status: 403 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = (await request.json()) as BulkReassignBody;
    const rawBrandIds = body.brandIds;
    const target = body.target;

    if (!Array.isArray(rawBrandIds) || rawBrandIds.length === 0) {
      return NextResponse.json(
        { error: 'brandIds must be a non-empty array' },
        { status: 400 }
      );
    }
    if (!rawBrandIds.every((b): b is string => typeof b === 'string')) {
      return NextResponse.json({ error: 'brandIds must be strings' }, { status: 400 });
    }
    // Idempotency: de-duplicate brandIds.
    const brandIds = Array.from(new Set(rawBrandIds));

    if (
      !target ||
      typeof target.type !== 'string' ||
      typeof target.id !== 'string' ||
      !ALLOWED_TARGET_TYPES.includes(target.type as TargetType)
    ) {
      return NextResponse.json(
        { error: 'target.type must be one of company|holding|holder and target.id must be a string' },
        { status: 400 }
      );
    }
    const targetType = target.type as TargetType;
    const targetId = target.id;

    // Validate brandIds belong to the tenant.
    const ownedBrands = await prisma.brand.findMany({
      where: { id: { in: brandIds }, tenant_id: tenantId },
      select: { id: true, company_id: true, name: true },
    });
    const ownedIds = new Set(ownedBrands.map((b) => b.id));
    const invalid = brandIds.filter((id) => !ownedIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: 'Some brandIds do not belong to this tenant', invalid },
        { status: 400 }
      );
    }
    if (ownedBrands.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, errors: [] });
    }

    const errors: { brandId: string; reason: string }[] = [];
    const actorId = getSessionUserId(session);
    const actorRole = role;

    let updated = 0;

    if (targetType === 'company') {
      const company = await prisma.company.findFirst({
        where: { id: targetId, tenant_id: tenantId },
        select: { id: true, name: true, holding_id: true },
      });
      if (!company) {
        return NextResponse.json(
          { error: 'Target company not found in tenant' },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        for (const brand of ownedBrands) {
          if (brand.company_id === company.id) {
            // Idempotent skip — already in this company.
            continue;
          }
          await tx.brand.update({
            where: { id: brand.id },
            data: { company_id: company.id },
          });
          await tx.brandHistory.create({
            data: {
              brand_id: brand.id,
              event_type: 'TRANSFER',
              event_date: new Date(),
              previous_state: { company_id: brand.company_id },
              new_state: { company_id: company.id },
              description: `Marca reasignada a empresa "${company.name}"`,
              actor_type: 'PROMARK',
              actor_id: actorId,
              actor_role: actorRole,
              change_type: 'UPDATED',
              visible_to_client: true,
              performed_by_id: actorId,
            },
          });
          updated++;
        }
      });
    } else if (targetType === 'holding') {
      const holding = await prisma.holding.findFirst({
        where: { id: targetId, tenant_id: tenantId },
        select: { id: true, name: true },
      });
      if (!holding) {
        return NextResponse.json(
          { error: 'Target holding not found in tenant' },
          { status: 404 }
        );
      }

      // Resolve the first existing company in the holding, or create a default one.
      let defaultCompany = await prisma.company.findFirst({
        where: { holding_id: holding.id, tenant_id: tenantId },
        orderBy: { created_at: 'asc' },
        select: { id: true, name: true },
      });

      if (!defaultCompany) {
        const created = await prisma.company.create({
          data: {
            tenant_id: tenantId,
            holding_id: holding.id,
            name: `${holding.name} - Default`,
            legal_name: `${holding.name} - Default`,
            company_type: 'PARENT',
          },
          select: { id: true, name: true },
        });
        defaultCompany = created;
      }

      await prisma.$transaction(async (tx) => {
        for (const brand of ownedBrands) {
          if (brand.company_id === defaultCompany!.id) {
            continue;
          }
          await tx.brand.update({
            where: { id: brand.id },
            data: { company_id: defaultCompany!.id },
          });
          await tx.brandHistory.create({
            data: {
              brand_id: brand.id,
              event_type: 'TRANSFER',
              event_date: new Date(),
              previous_state: { company_id: brand.company_id },
              new_state: { company_id: defaultCompany!.id, holding_id: holding.id },
              description: `Marca movida al holding "${holding.name}" (empresa "${defaultCompany!.name}")`,
              actor_type: 'PROMARK',
              actor_id: actorId,
              actor_role: actorRole,
              change_type: 'UPDATED',
              visible_to_client: true,
              performed_by_id: actorId,
            },
          });
          updated++;
        }
      });
    } else {
      // targetType === 'holder'
      const holder = await prisma.holder.findFirst({
        where: { id: targetId, tenant_id: tenantId },
        select: { id: true, name: true },
      });
      if (!holder) {
        return NextResponse.json(
          { error: 'Target holder not found in tenant' },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        for (const brand of ownedBrands) {
          const existing = await tx.brandHolder.findMany({
            where: { brand_id: brand.id },
            select: { id: true, holder_id: true },
          });

          const alreadyOnlyHolder =
            existing.length === 1 && existing[0].holder_id === holder.id;
          if (alreadyOnlyHolder) {
            // Idempotent skip.
            continue;
          }

          // Safety: never leave a brand orphaned. If the only existing holder
          // is the target itself we just continue; otherwise we replace all.
          // (Removing all + adding one keeps at least one holder, so this is safe.)

          if (existing.length > 0) {
            await tx.brandHolder.deleteMany({ where: { brand_id: brand.id } });
          }

          await tx.brandHolder.create({
            data: {
              brand_id: brand.id,
              holder_id: holder.id,
              role: 'OWNER',
              start_date: new Date(),
            },
          });

          await tx.brandHistory.create({
            data: {
              brand_id: brand.id,
              event_type: 'ASSIGNMENT',
              event_date: new Date(),
              previous_state: { holder_ids: existing.map((e) => e.holder_id) },
              new_state: { holder_ids: [holder.id] },
              description: `Titular asignado: "${holder.name}"`,
              actor_type: 'PROMARK',
              actor_id: actorId,
              actor_role: actorRole,
              change_type: 'UPDATED',
              visible_to_client: true,
              performed_by_id: actorId,
            },
          });
          updated++;
        }
      });
    }

    return NextResponse.json({ ok: true, updated, errors });
  } catch (error) {
    console.error('Brands bulk-reassign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

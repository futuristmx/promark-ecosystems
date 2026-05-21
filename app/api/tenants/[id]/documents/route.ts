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

// ─── GET /api/tenants/[id]/documents ───────────────────────────────────────
// List active documents (latest version only by default)
// Query: entityType, entityId, includeDeleted

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
      module: 'documents',
      action: 'READ',
    });
    if (permError) return permError;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const where: Prisma.DocumentWhereInput = {
      tenant_id: tenantId,
      is_latest_version: true,
    };
    if (!includeDeleted) where.deleted_at = null;
    if (entityType) where.entity_type = entityType;
    if (entityId) where.entity_id = entityId;

    // CLIENT_LEGAL_REP: only see documents for brands they're assigned to
    if (session.userType === 'CLIENT' && getSessionRole(session) === 'CLIENT_LEGAL_REP') {
      const assignments = await prisma.userClientHolder.findMany({
        where: {
          user_client_id: getSessionUserId(session),
          tenant_id: tenantId,
          removed_at: null,
        },
        select: { holder_id: true },
      });
      const holderIds = assignments.map((a) => a.holder_id);

      if (holderIds.length === 0) {
        return NextResponse.json({ documents: [] });
      }

      const brandHolders = await prisma.brandHolder.findMany({
        where: { holder_id: { in: holderIds } },
        select: { brand_id: true },
      });
      const brandIds = brandHolders.map((bh) => bh.brand_id);

      where.OR = [
        { entity_type: 'BRAND', entity_id: { in: brandIds } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploaded_at: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

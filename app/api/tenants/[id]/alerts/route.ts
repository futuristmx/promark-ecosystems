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

// ─── GET /api/tenants/[id]/alerts ──────────────────────────────────────────
// List alerts. Query: status, entityType, page, limit

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
      module: 'brand_audit',
      action: 'READ',
    });
    if (permError) return permError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '20', 10), 1),
      100
    );

    const where: Prisma.AlertWhereInput = { tenant_id: tenantId };
    if (status) where.status = status;
    if (entityType) where.entity_type = entityType;

    // CLIENT_LEGAL_REP: only see alerts for brands they're assigned to
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
        return NextResponse.json({ alerts: [], total: 0, page, limit });
      }
      const brandHolders = await prisma.brandHolder.findMany({
        where: { holder_id: { in: holderIds } },
        select: { brand_id: true },
      });
      const brandIds = brandHolders.map((bh) => bh.brand_id);
      where.OR = [{ entity_type: 'BRAND', entity_id: { in: brandIds } }];
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: [{ status: 'asc' }, { expiry_date: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.alert.count({ where }),
    ]);

    return NextResponse.json({ alerts, total, page, limit });
  } catch (error) {
    console.error('Alerts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

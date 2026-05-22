import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserId,
  getSessionRole,
} from '@/lib/auth/api-helpers';

// ─── PUT /api/tenants/[id]/alerts/[alert-id]/resolve ───────────────────────
// Resolve an alert (the underlying issue has been fixed).
// Allowed roles: SUPERADMIN, LAWYER, BRAND_ANALYST (promark only)

const ALLOWED_ROLES = ['SUPERADMIN', 'LAWYER', 'BRAND_ANALYST'];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; 'alert-id': string }> }
) {
  try {
    const { id: tenantId, 'alert-id': alertId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    // Resolve is promark-only
    if (session.userType !== 'PROMARK') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const role = getSessionRole(session);
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient role' },
        { status: 403 }
      );
    }

    const alert = await prisma.alert.findFirst({
      where: { id: alertId, tenant_id: tenantId },
    });
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolved_at: new Date(),
        resolved_by: getSessionUserId(session),
      },
    });

    return NextResponse.json({ alert: updated });
  } catch (error) {
    console.error('Alert resolve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionRole,
} from '@/lib/auth/api-helpers';

// ─── GET /api/tenants/[id]/alert-rules ─────────────────────────────────────

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

    // Only promark staff and CLIENT_ADMIN can read alert rules
    const role = getSessionRole(session);
    const allowed = session.userType === 'PROMARK' || role === 'CLIENT_ADMIN';
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rules = await prisma.alertRule.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ entity_type: 'asc' }, { trigger_days: 'desc' }],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('AlertRules GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

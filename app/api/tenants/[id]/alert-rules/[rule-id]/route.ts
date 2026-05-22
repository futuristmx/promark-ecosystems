import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionRole,
} from '@/lib/auth/api-helpers';

// ─── PUT /api/tenants/[id]/alert-rules/[rule-id] ───────────────────────────
// Activate/deactivate or modify a rule. SUPERADMIN only.

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; 'rule-id': string }> }
) {
  try {
    const { id: tenantId, 'rule-id': ruleId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    if (session.userType !== 'PROMARK' || getSessionRole(session) !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: SUPERADMIN only' },
        { status: 403 }
      );
    }

    const rule = await prisma.alertRule.findFirst({
      where: { id: ruleId, tenant_id: tenantId },
    });
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ['is_active', 'trigger_days', 'notify_email', 'notify_in_app', 'name'];
    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) data[key] = body[key];
    }

    const updated = await prisma.alertRule.update({
      where: { id: ruleId },
      data,
    });

    return NextResponse.json({ rule: updated });
  } catch (error) {
    console.error('AlertRule PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

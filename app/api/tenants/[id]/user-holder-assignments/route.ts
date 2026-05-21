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

// ─── GET /api/tenants/[id]/user-holder-assignments ─────────────────────────
// List all user-holder assignments for this tenant

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    const permError = await requirePermission({
      userId: getSessionUserId(session),
      userType: getSessionUserType(session),
      role: getSessionRole(session),
      module: 'user_admin',
      action: 'READ',
    });
    if (permError) return permError;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const holderId = searchParams.get('holder_id');

    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      removed_at: null,
    };

    if (userId) where.user_client_id = userId;
    if (holderId) where.holder_id = holderId;

    const assignments = await prisma.userClientHolder.findMany({
      where,
      include: {
        user_client: {
          select: { id: true, full_name: true, email: true, card_id: true, role: true },
        },
        holder: {
          select: { id: true, name: true, holder_type: true },
        },
      },
      orderBy: { assigned_at: 'desc' },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('UserHolderAssignments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/tenants/[id]/user-holder-assignments ────────────────────────
// Assign a holder to a client user

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    const permError = await requirePermission({
      userId: getSessionUserId(session),
      userType: getSessionUserType(session),
      role: getSessionRole(session),
      module: 'user_admin',
      action: 'CREATE',
    });
    if (permError) return permError;

    const body = await request.json();
    const { user_client_id, holder_id } = body;

    if (!user_client_id || !holder_id) {
      return NextResponse.json(
        { error: 'user_client_id and holder_id are required' },
        { status: 400 }
      );
    }

    // Verify user belongs to tenant
    const user = await prisma.userClient.findFirst({
      where: { id: user_client_id, tenant_id: tenantId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in this tenant' },
        { status: 404 }
      );
    }

    // Verify holder belongs to tenant
    const holder = await prisma.holder.findFirst({
      where: { id: holder_id, tenant_id: tenantId },
    });
    if (!holder) {
      return NextResponse.json(
        { error: 'Holder not found in this tenant' },
        { status: 404 }
      );
    }

    // Check for existing active assignment
    const existing = await prisma.userClientHolder.findFirst({
      where: {
        user_client_id,
        holder_id,
        removed_at: null,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Assignment already exists' },
        { status: 409 }
      );
    }

    const assignment = await prisma.userClientHolder.create({
      data: {
        user_client_id,
        holder_id,
        tenant_id: tenantId,
        assigned_by: getSessionUserId(session),
      },
      include: {
        user_client: {
          select: { id: true, full_name: true, email: true, card_id: true, role: true },
        },
        holder: {
          select: { id: true, name: true, holder_type: true },
        },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('UserHolderAssignments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/tenants/[id]/user-holder-assignments ──────────────────────
// Soft-remove an assignment (set removed_at)

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const session = await requireApiAuth(request);
    if (isErrorResponse(session)) return session;

    const permError = await requirePermission({
      userId: getSessionUserId(session),
      userType: getSessionUserType(session),
      role: getSessionRole(session),
      module: 'user_admin',
      action: 'DELETE',
    });
    if (permError) return permError;

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment id is required as query param' },
        { status: 400 }
      );
    }

    const assignment = await prisma.userClientHolder.findFirst({
      where: { id: assignmentId, tenant_id: tenantId, removed_at: null },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    await prisma.userClientHolder.update({
      where: { id: assignmentId },
      data: { removed_at: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('UserHolderAssignments DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

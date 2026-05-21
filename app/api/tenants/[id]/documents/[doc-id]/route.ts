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
  uploadDocument,
  getSignedUrl,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  type EntityType,
} from '@/lib/storage/documents';

export const runtime = 'nodejs';

// ─── GET /api/tenants/[id]/documents/[doc-id] ──────────────────────────────
// Return document with a signed URL (valid 1 hour).

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; 'doc-id': string }> }
) {
  try {
    const { id: tenantId, 'doc-id': docId } = await params;

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

    const document = await prisma.document.findFirst({
      where: { id: docId, tenant_id: tenantId, deleted_at: null },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // LEGAL_REP guard
    if (session.userType === 'CLIENT' && getSessionRole(session) === 'CLIENT_LEGAL_REP') {
      if (document.entity_type === 'BRAND') {
        const assignments = await prisma.userClientHolder.findMany({
          where: {
            user_client_id: getSessionUserId(session),
            tenant_id: tenantId,
            removed_at: null,
          },
          select: { holder_id: true },
        });
        const holderIds = assignments.map((a) => a.holder_id);
        const allowed = await prisma.brandHolder.findFirst({
          where: { brand_id: document.entity_id, holder_id: { in: holderIds } },
          select: { id: true },
        });
        if (!allowed) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const signedUrl = await getSignedUrl(document.storage_path);

    return NextResponse.json({ document: { ...document, signed_url: signedUrl } });
  } catch (error) {
    console.error('Document GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/tenants/[id]/documents/[doc-id] ──────────────────────────────
// Create a new version: mark previous as not-latest, upload new file.
// Body: multipart/form-data with file, optional description, optional expiresAt.

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; 'doc-id': string }> }
) {
  try {
    const { id: tenantId, 'doc-id': docId } = await params;

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
      action: 'UPDATE',
    });
    if (permError) return permError;

    const existing = await prisma.document.findFirst({
      where: {
        id: docId,
        tenant_id: tenantId,
        deleted_at: null,
        is_latest_version: true,
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found or not the latest version' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const description = (formData.get('description') as string | null) ?? null;
    const expiresAtRaw = formData.get('expiresAt') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_SIZE} bytes)` },
        { status: 413 }
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 415 }
      );
    }

    const upload = await uploadDocument({
      tenantId,
      entityType: existing.entity_type as EntityType,
      entityId: existing.entity_id,
      file,
    });

    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
    const userId = getSessionUserId(session);

    const newVersion = await prisma.$transaction(async (tx) => {
      await tx.document.update({
        where: { id: existing.id },
        data: { is_latest_version: false },
      });

      return tx.document.create({
        data: {
          tenant_id: tenantId,
          entity_type: existing.entity_type,
          entity_id: existing.entity_id,
          file_name: upload.file_name,
          file_type: upload.file_type,
          file_size: upload.file_size,
          storage_path: upload.storage_path,
          storage_url: upload.storage_url,
          description: description ?? existing.description,
          uploaded_by: existing.uploaded_by,
          last_edited_by: userId,
          last_edited_at: new Date(),
          version_number: existing.version_number + 1,
          previous_version_id: existing.id,
          is_latest_version: true,
          expires_at: expiresAt ?? existing.expires_at,
        },
      });
    });

    if (existing.entity_type === 'BRAND') {
      await prisma.brandHistory.create({
        data: {
          brand_id: existing.entity_id,
          event_type: 'MODIFICATION',
          event_date: new Date(),
          description: `Nueva versión de documento: ${upload.file_name} (v${newVersion.version_number})`,
          actor_type: session.userType === 'PROMARK' ? 'PROMARK' : 'CLIENT',
          actor_id: userId,
          actor_role: getSessionRole(session),
          change_type: 'DOCUMENT_VERSION',
          visible_to_client: true,
        },
      });
    }

    const signedUrl = await getSignedUrl(upload.storage_path);

    return NextResponse.json({
      document: { ...newVersion, signed_url: signedUrl },
    });
  } catch (error) {
    console.error('Document PUT error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── DELETE /api/tenants/[id]/documents/[doc-id] ───────────────────────────
// Soft delete: deleted_at = now(). Keep file in Storage.

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; 'doc-id': string }> }
) {
  try {
    const { id: tenantId, 'doc-id': docId } = await params;

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
      action: 'DELETE',
    });
    if (permError) return permError;

    const existing = await prisma.document.findFirst({
      where: { id: docId, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.document.update({
      where: { id: docId },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

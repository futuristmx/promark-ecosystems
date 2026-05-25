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

// ─── POST /api/tenants/[id]/documents/upload ───────────────────────────────
// Multipart upload, creates Document row + uploads to Supabase Storage.

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
      module: 'documents',
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const entityType = formData.get('entityType') as string | null;
    const entityId = formData.get('entityId') as string | null;
    const description = (formData.get('description') as string | null) ?? undefined;
    const expiresAtRaw = formData.get('expiresAt') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (!entityType || !['BRAND', 'COMPANY', 'CONTRACT'].includes(entityType)) {
      return NextResponse.json(
        { error: 'entityType must be BRAND, COMPANY, or CONTRACT' },
        { status: 400 }
      );
    }
    if (!entityId) {
      return NextResponse.json({ error: 'entityId is required' }, { status: 400 });
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

    // Verify entity belongs to tenant
    if (entityType === 'BRAND') {
      const brand = await prisma.brand.findFirst({
        where: { id: entityId, tenant_id: tenantId },
        select: { id: true, name: true },
      });
      if (!brand) {
        return NextResponse.json(
          { error: 'Brand not found in this tenant' },
          { status: 404 }
        );
      }
    } else if (entityType === 'COMPANY') {
      const company = await prisma.company.findFirst({
        where: { id: entityId, tenant_id: tenantId },
        select: { id: true },
      });
      if (!company) {
        return NextResponse.json(
          { error: 'Company not found in this tenant' },
          { status: 404 }
        );
      }
    }

    const upload = await uploadDocument({
      tenantId,
      entityType: entityType as EntityType,
      entityId,
      file,
    });

    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
    const uploadedBy = getSessionUserId(session);

    // F4 — Versionado real: si ya existe un Document con el mismo
    // (tenant, entity, file_name) marcado is_latest_version=true, se demota
    // y se crea uno nuevo con version_number+1 y previous_version_id.
    // Todo en una transacción para evitar dos "latest" simultáneos.
    const document = await prisma.$transaction(async (tx) => {
      const previousLatest = await tx.document.findFirst({
        where: {
          tenant_id: tenantId,
          entity_type: entityType,
          entity_id: entityId,
          file_name: upload.file_name,
          is_latest_version: true,
          deleted_at: null,
        },
        select: { id: true, version_number: true },
        orderBy: { version_number: 'desc' },
      });

      let nextVersion = 1;
      let previousVersionId: string | null = null;
      if (previousLatest) {
        nextVersion = previousLatest.version_number + 1;
        previousVersionId = previousLatest.id;
        await tx.document.update({
          where: { id: previousLatest.id },
          data: { is_latest_version: false },
        });
      }

      return tx.document.create({
        data: {
          tenant_id: tenantId,
          entity_type: entityType,
          entity_id: entityId,
          file_name: upload.file_name,
          file_type: upload.file_type,
          file_size: upload.file_size,
          storage_path: upload.storage_path,
          storage_url: upload.storage_url,
          description: description ?? null,
          uploaded_by: uploadedBy,
          expires_at: expiresAt ?? undefined,
          version_number: nextVersion,
          is_latest_version: true,
          previous_version_id: previousVersionId,
        },
      });
    });

    // Log BrandHistory if entity is a BRAND
    if (entityType === 'BRAND') {
      await prisma.brandHistory.create({
        data: {
          brand_id: entityId,
          event_type: 'MODIFICATION',
          event_date: new Date(),
          description: `Documento adjuntado: ${upload.file_name}`,
          actor_type: session.userType === 'PROMARK' ? 'PROMARK' : 'CLIENT',
          actor_id: uploadedBy,
          actor_role: getSessionRole(session),
          change_type: 'DOCUMENT_UPLOAD',
          visible_to_client: true,
        },
      });
    }

    const signedUrl = await getSignedUrl(upload.storage_path);

    return NextResponse.json(
      { document: { ...document, signed_url: signedUrl } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Documents POST error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

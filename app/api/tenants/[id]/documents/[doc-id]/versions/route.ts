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

// ─── GET /api/tenants/[id]/documents/[doc-id]/versions ─────────────────────
// Return the full version history of a document (newest first).

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

    // Client portal does not get version history
    if (session.userType === 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const permError = await requirePermission({
      userId: getSessionUserId(session),
      userType: getSessionUserType(session),
      role: getSessionRole(session),
      module: 'documents',
      action: 'READ',
    });
    if (permError) return permError;

    // Get the target document
    const doc = await prisma.document.findFirst({
      where: { id: docId, tenant_id: tenantId },
      select: { entity_type: true, entity_id: true },
    });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Find all versions: the chain of documents for this entity that share
    // a common version lineage. We collect them by walking the previous_version_id
    // chain forward and backward from the target document id.
    const allDocs = await prisma.document.findMany({
      where: {
        tenant_id: tenantId,
        entity_type: doc.entity_type,
        entity_id: doc.entity_id,
      },
      orderBy: { version_number: 'desc' },
    });

    // Build chain by traversing from docId
    const byId = new Map(allDocs.map((d) => [d.id, d]));
    const chain: typeof allDocs = [];
    const seen = new Set<string>();

    // Walk backward to find root
    let cursor: typeof allDocs[number] | undefined = byId.get(docId);
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      chain.push(cursor);
      cursor = cursor.previous_version_id
        ? byId.get(cursor.previous_version_id)
        : undefined;
    }

    // Walk forward to find later versions
    const laterVersions = allDocs.filter(
      (d) => d.previous_version_id && seen.has(d.previous_version_id) && !seen.has(d.id)
    );
    for (const lv of laterVersions) {
      if (!seen.has(lv.id)) {
        seen.add(lv.id);
        chain.push(lv);
      }
    }

    chain.sort((a, b) => b.version_number - a.version_number);

    return NextResponse.json({ versions: chain });
  } catch (error) {
    console.error('Document versions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import { requireClientApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

/**
 * GET /api/client/[tenant-slug]/documents
 *
 * Lista documentos visibles para el cliente autenticado.
 * - Filtra por tenant + última versión + no borrados
 * - Si role === CLIENT_LEGAL_REP, restringe a documentos de marcas/contratos
 *   asociados a los holders asignados al usuario
 * - Si tenant.features.show_documents !== true, devuelve 404
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ 'tenant-slug': string }> }
) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.tenant_slug !== tenantSlug) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, config: true },
  });
  if (!tenant) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const cfg = tenant.config as { features?: { show_documents?: boolean } } | null;
  if (!cfg?.features?.show_documents) {
    return NextResponse.json({ error: 'No habilitado' }, { status: 404 });
  }

  const where: Prisma.DocumentWhereInput = {
    tenant_id: tenant.id,
    is_latest_version: true,
    deleted_at: null,
  };

  // LEGAL_REP: restringir a documentos asociados a marcas/contratos de sus holders
  if (session.role === 'CLIENT_LEGAL_REP') {
    const assignments = await prisma.userClientHolder.findMany({
      where: { user_client_id: session.user_id, tenant_id: tenant.id, removed_at: null },
      select: { holder_id: true },
    });
    const holderIds = assignments.map((a) => a.holder_id);
    if (holderIds.length === 0) return NextResponse.json({ documents: [] });

    const brandHolders = await prisma.brandHolder.findMany({
      where: { holder_id: { in: holderIds } },
      select: { brand_id: true },
    });
    const brandIds = brandHolders.map((b) => b.brand_id);

    const contracts = await prisma.contract.findMany({
      where: { tenant_id: tenant.id, contract_brands: { some: { brand_id: { in: brandIds } } } },
      select: { id: true },
    });
    const contractIds = contracts.map((c) => c.id);

    where.OR = [
      { entity_type: 'BRAND', entity_id: { in: brandIds } },
      { entity_type: 'CONTRACT', entity_id: { in: contractIds } },
    ];
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: { uploaded_at: 'desc' },
    take: 200,
    select: {
      id: true,
      file_name: true,
      file_type: true,
      file_size: true,
      document_category: true,
      description: true,
      entity_type: true,
      entity_id: true,
      uploaded_at: true,
      expires_at: true,
      version_number: true,
    },
  });

  return NextResponse.json({ documents });
}

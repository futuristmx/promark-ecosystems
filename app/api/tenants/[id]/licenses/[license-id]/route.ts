import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requireApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

const PROMARK_WRITE = new Set(['SUPERADMIN', 'LAWYER']);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; 'license-id': string }> }
) {
  const { id: tenantId, 'license-id': licenseId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType === 'CLIENT' && session.tenant_id !== tenantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const license = await prisma.license.findFirst({
    where: { id: licenseId, tenant_id: tenantId, deleted_at: null },
    include: {
      brand: { select: { id: true, name: true } },
      contract: { select: { id: true, title: true } },
    },
  });
  if (!license) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json({ license });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; 'license-id': string }> }
) {
  const { id: tenantId, 'license-id': licenseId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType !== 'PROMARK' || !PROMARK_WRITE.has(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const existing = await prisma.license.findFirst({
    where: { id: licenseId, tenant_id: tenantId, deleted_at: null },
  });
  if (!existing) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  const fields = [
    'license_type', 'licensee_name', 'licensee_rfc', 'territory',
    'permitted_uses', 'prohibited_uses', 'status', 'royalty_rate',
    'royalty_terms', 'notes',
  ];
  for (const f of fields) if (f in body) data[f] = body[f];
  if ('effective_date' in body) data.effective_date = body.effective_date ? new Date(body.effective_date) : null;
  if ('expiration_date' in body) data.expiration_date = body.expiration_date ? new Date(body.expiration_date) : null;

  const updated = await prisma.license.update({ where: { id: licenseId }, data });
  return NextResponse.json({ license: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; 'license-id': string }> }
) {
  const { id: tenantId, 'license-id': licenseId } = await params;
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.userType !== 'PROMARK' || !PROMARK_WRITE.has(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const existing = await prisma.license.findFirst({
    where: { id: licenseId, tenant_id: tenantId, deleted_at: null },
  });
  if (!existing) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  await prisma.license.update({ where: { id: licenseId }, data: { deleted_at: new Date() } });
  return NextResponse.json({ ok: true });
}

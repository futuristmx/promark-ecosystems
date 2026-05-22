import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { getPromarkSession } from '@/lib/auth/promark';
import { computeTenantGraph } from '@/lib/dashboard/tenant-graph';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const session = await getPromarkSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }
    const data = await computeTenantGraph(tenantId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/tenants/[id]/graph]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

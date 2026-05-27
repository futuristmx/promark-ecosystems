import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requirePromarkApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

/**
 * POST /api/tenants/bulk-delete
 * Body: { ids: string[] }
 *
 * Elimina múltiples tenants en una sola operación. Solo SUPERADMIN.
 * Hard delete con cascada (configurado en schema).
 */
export async function POST(request: Request) {
  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;

  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json(
      { error: 'Solo SUPERADMIN puede eliminar clientes' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Body debe incluir un array `ids` no vacío' },
      { status: 400 }
    );
  }
  if (!ids.every((id) => typeof id === 'string' && id.length > 0)) {
    return NextResponse.json(
      { error: 'Todos los `ids` deben ser strings no vacíos' },
      { status: 400 }
    );
  }

  const result = await prisma.tenant.deleteMany({
    where: { id: { in: ids as string[] } },
  });

  return NextResponse.json({ deleted: result.count });
}

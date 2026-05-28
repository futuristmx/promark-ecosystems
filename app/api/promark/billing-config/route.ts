import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';

/**
 * GET  /api/promark/billing-config — lee todos los conceptos de facturación
 * PATCH /api/promark/billing-config — actualiza un concepto (key + amount)
 *
 * Solo SUPERADMIN puede editar; cualquier rol promark con view_financiero puede leer.
 */

export async function GET(request: Request) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (getSessionUserType(session) !== 'PROMARK') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const configs = await prisma.promarkBillingConfig.findMany({
    orderBy: { order: 'asc' },
  });
  return NextResponse.json({
    configs: configs.map((c) => ({
      ...c,
      amount: c.amount.toNumber(),
    })),
  });
}

export async function PATCH(request: Request) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (
    getSessionUserType(session) !== 'PROMARK' ||
    getSessionRole(session) !== 'SUPERADMIN'
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { key, amount, label, description } = body ?? {};

  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'Key inválida' }, { status: 400 });
  }
  if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (amount !== undefined) data.amount = amount;
  if (label !== undefined) data.label = label;
  if (description !== undefined) data.description = description;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });
  }

  const updated = await prisma.promarkBillingConfig.update({
    where: { key },
    data,
  });

  return NextResponse.json({
    ok: true,
    config: { ...updated, amount: updated.amount.toNumber() },
  });
}

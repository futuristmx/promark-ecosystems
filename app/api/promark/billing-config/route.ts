import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';

/**
 * GET    /api/promark/billing-config — lee todos los conceptos de facturación
 * POST   /api/promark/billing-config — crea un concepto nuevo
 * PATCH  /api/promark/billing-config — actualiza un concepto (key + amount/label/desc/category)
 * DELETE /api/promark/billing-config?key=... — elimina un concepto
 *
 * Solo SUPERADMIN puede crear/editar/eliminar; cualquier rol promark puede leer.
 */

const VALID_CATEGORIES = ['OPERATIVO', 'RECURRENTE', 'EVENTUAL'] as const;

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

async function guardSuperadmin(request: Request) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return { error: session as Response };
  if (
    getSessionUserType(session) !== 'PROMARK' ||
    getSessionRole(session) !== 'SUPERADMIN'
  ) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true as const };
}

function slugifyKey(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '')
    .slice(0, 40);
}

export async function POST(request: Request) {
  const g = await guardSuperadmin(request);
  if (g.error) return g.error;

  const body = await request.json();
  const { label, description, amount, category, currency } = body ?? {};

  if (!label || typeof label !== 'string' || label.trim().length < 2) {
    return NextResponse.json({ error: 'Nombre inválido (mín. 2 caracteres)' }, { status: 400 });
  }
  if (typeof amount !== 'number' || amount < 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
  }
  const cat = category ?? 'OPERATIVO';
  if (!VALID_CATEGORIES.includes(cat)) {
    return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 });
  }

  // Generar key única
  const base = slugifyKey(label.trim()) || 'concepto';
  let key = base;
  let suffix = 1;
  while (await prisma.promarkBillingConfig.findUnique({ where: { key } })) {
    suffix += 1;
    key = `${base}_${suffix}`;
  }

  const lastOrder = await prisma.promarkBillingConfig.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const created = await prisma.promarkBillingConfig.create({
    data: {
      key,
      label: label.trim(),
      description: description?.trim() || null,
      amount,
      currency: currency || 'MXN',
      category: cat,
      order: (lastOrder?.order ?? 0) + 10,
    },
  });

  return NextResponse.json({
    ok: true,
    config: { ...created, amount: created.amount.toNumber() },
  });
}

export async function PATCH(request: Request) {
  const g = await guardSuperadmin(request);
  if (g.error) return g.error;

  const body = await request.json();
  const { key, amount, label, description, category } = body ?? {};

  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'Key inválida' }, { status: 400 });
  }
  if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
  }
  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (amount !== undefined) data.amount = amount;
  if (label !== undefined) data.label = label;
  if (description !== undefined) data.description = description || null;
  if (category !== undefined) data.category = category;

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

export async function DELETE(request: Request) {
  const g = await guardSuperadmin(request);
  if (g.error) return g.error;

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Key requerida' }, { status: 400 });
  }

  const existing = await prisma.promarkBillingConfig.findUnique({ where: { key } });
  if (!existing) {
    return NextResponse.json({ error: 'Concepto no encontrado' }, { status: 404 });
  }

  await prisma.promarkBillingConfig.delete({ where: { key } });
  return NextResponse.json({ ok: true });
}

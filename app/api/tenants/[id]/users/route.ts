import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { hashPin } from '@/lib/auth/client-pin';
import {
  requireApiAuth,
  isErrorResponse,
  getSessionUserType,
  getSessionRole,
} from '@/lib/auth/api-helpers';

const VALID_ROLES = ['CLIENT_ADMIN', 'CLIENT_VIEWER', 'CLIENT_LEGAL_REP'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

/** Generates a short, human-readable card_id like "GN-X7K2P". */
function generateCardId(tenantSlug: string): string {
  const prefix = tenantSlug
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 3)
    .toUpperCase();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I, O, 0, 1 para evitar confusión
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${suffix}`;
}

async function generateUniqueCardId(tenantSlug: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateCardId(tenantSlug);
    const exists = await prisma.userClient.findUnique({ where: { card_id: candidate } });
    if (!exists) return candidate;
  }
  throw new Error('No se pudo generar un card_id único.');
}

/**
 * POST /api/tenants/[id]/users
 * Crea un nuevo usuario del portal cliente para el tenant.
 * Body: { full_name, email, role, initialPin }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;

  const userType = getSessionUserType(session);
  const role = getSessionRole(session);
  if (userType !== 'PROMARK' || role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: tenantId } = await params;
  const body = await request.json();
  const { full_name, email, role: userRole, initialPin } = body ?? {};

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    return NextResponse.json({ error: 'Nombre inválido.' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  }
  if (!VALID_ROLES.includes(userRole)) {
    return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 });
  }
  if (!initialPin || typeof initialPin !== 'string' || initialPin.length < 4) {
    return NextResponse.json(
      { error: 'El PIN inicial debe tener al menos 4 caracteres.' },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado.' }, { status: 404 });
  }

  // Verificar email único dentro del tenant
  const existing = await prisma.userClient.findFirst({
    where: { tenant_id: tenantId, email: email.toLowerCase().trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe un usuario con ese email en este portal.' },
      { status: 409 }
    );
  }

  const card_id = await generateUniqueCardId(tenant.slug);
  const pin_hash = await hashPin(initialPin);

  const created = await prisma.userClient.create({
    data: {
      tenant_id: tenantId,
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      role: userRole as ValidRole,
      card_id,
      pin_hash,
      pin_generated_at: new Date(),
      status: 'ACTIVE',
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      card_id: true,
      role: true,
      status: true,
      pin_generated_at: true,
    },
  });

  return NextResponse.json({ ok: true, user: created });
}

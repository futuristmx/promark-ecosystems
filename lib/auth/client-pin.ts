import { hash, compare } from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import prisma from '@/lib/prisma/client';
import type { ClientRole } from '@prisma/client';

// ─── PIN Generation & Hashing ────────────────────────────────────────────────

export function generatePin(length = 6): string {
  const digits = '0123456789';
  let pin = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    pin += digits[array[i] % 10];
  }
  return pin;
}

export async function hashPin(pin: string): Promise<string> {
  return hash(pin, 12);
}

export async function verifyPin(pin: string, hashValue: string): Promise<boolean> {
  return compare(pin, hashValue);
}

// ─── Error Codes ─────────────────────────────────────────────────────────────

export type ClientAuthErrorCode =
  | 'TENANT_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'ACCOUNT_LOCKED'
  | 'INVALID_PIN'
  | 'USER_INACTIVE';

export interface ClientAuthError {
  success: false;
  error: ClientAuthErrorCode;
  message: string;
}

export interface ClientAuthSuccess {
  success: true;
  user: {
    id: string;
    full_name: string;
    email: string;
    role: ClientRole;
    tenant_id: string;
    tenant_slug: string;
    card_id: string;
  };
}

export type ClientAuthResult = ClientAuthSuccess | ClientAuthError;

// ─── Authentication ──────────────────────────────────────────────────────────

const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_PIN_ATTEMPTS = 5;

export async function authenticateClientUser(
  cardId: string,
  pin: string,
  tenantSlug: string
): Promise<ClientAuthResult> {
  // Find tenant by slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!tenant) {
    return { success: false, error: 'TENANT_NOT_FOUND', message: 'Tenant not found' };
  }

  // Find user by card_id within tenant
  const user = await prisma.userClient.findFirst({
    where: { card_id: cardId, tenant_id: tenant.id },
  });

  if (!user) {
    return { success: false, error: 'USER_NOT_FOUND', message: 'User not found' };
  }

  if (user.status !== 'ACTIVE') {
    return { success: false, error: 'USER_INACTIVE', message: 'User account is inactive' };
  }

  // Check if account is locked
  if (user.locked_at) {
    const lockExpiry = new Date(user.locked_at.getTime() + LOCK_DURATION_MS);
    if (new Date() < lockExpiry) {
      return { success: false, error: 'ACCOUNT_LOCKED', message: 'Account is temporarily locked. Try again later.' };
    }
    // Lock expired — reset
    await prisma.userClient.update({
      where: { id: user.id },
      data: { locked_at: null, pin_attempts: 0 },
    });
  }

  // Verify PIN
  const pinValid = await verifyPin(pin, user.pin_hash);

  if (!pinValid) {
    const newAttempts = user.pin_attempts + 1;
    const updateData: { pin_attempts: number; locked_at?: Date } = {
      pin_attempts: newAttempts,
    };

    if (newAttempts >= MAX_PIN_ATTEMPTS) {
      updateData.locked_at = new Date();
    }

    await prisma.userClient.update({
      where: { id: user.id },
      data: updateData,
    });

    return { success: false, error: 'INVALID_PIN', message: 'Invalid PIN' };
  }

  // Success — reset attempts and update last login
  await prisma.userClient.update({
    where: { id: user.id },
    data: { pin_attempts: 0, locked_at: null, last_login: new Date() },
  });

  return {
    success: true,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      tenant_id: tenant.id,
      tenant_slug: tenant.slug,
      card_id: user.card_id,
    },
  };
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export interface ClientJWTPayload extends JWTPayload {
  user_id: string;
  user_type: 'client';
  tenant_id: string;
  tenant_slug: string;
  role: ClientRole;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
}

export async function generateClientJWT(
  user: { id: string; role: ClientRole },
  tenant: { id: string; slug: string }
): Promise<string> {
  const secret = getJwtSecret();

  return new SignJWT({
    user_id: user.id,
    user_type: 'client' as const,
    tenant_id: tenant.id,
    tenant_slug: tenant.slug,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .setIssuer('promark')
    .sign(secret);
}

export async function verifyClientJWT(token: string): Promise<ClientJWTPayload> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { issuer: 'promark' });
  return payload as ClientJWTPayload;
}

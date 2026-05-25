import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma/client';
import { verifyClientJWT, type ClientJWTPayload } from '@/lib/auth/client-pin';
import { checkPermission, type PermissionCheckParams } from '@/lib/permissions/roles';
import type { PromarkRole } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PromarkApiSession {
  id: string;
  email: string;
  full_name: string;
  role: PromarkRole;
  supabase_auth_id: string;
  userType: 'PROMARK';
}

export interface ClientApiSession {
  user_id: string;
  user_type: 'client';
  tenant_id: string;
  tenant_slug: string;
  role: string;
  userType: 'CLIENT';
}

export type ApiSession = PromarkApiSession | ClientApiSession;

// ─── Promark Auth Helper ────────────────────────────────────────────────────

/**
 * Extract and validate Promark auth from request via Supabase session.
 * Returns the session or a NextResponse error.
 */
export async function requirePromarkApiAuth(
  _request: Request
): Promise<PromarkApiSession | NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promarkUser = await prisma.userPromark.findUnique({
      where: { supabase_auth_id: user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        supabase_auth_id: true,
      },
    });

    if (!promarkUser) {
      return NextResponse.json({ error: 'Unauthorized: Promark user not found' }, { status: 401 });
    }

    return { ...promarkUser, userType: 'PROMARK' as const };
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

// ─── Client Auth Helper ─────────────────────────────────────────────────────

/**
 * Extract and validate client JWT from Authorization header or cookie.
 * Returns the decoded payload or a NextResponse error.
 */
export async function requireClientApiAuth(
  request: Request
): Promise<ClientApiSession | NextResponse> {
  try {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // Fall back to cookie
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split(';').map((c) => {
            const [key, ...val] = c.trim().split('=');
            return [key, val.join('=')];
          })
        );
        // Cookie name must match what /api/auth/client-pin sets and
        // lib/auth/client-session.ts reads ('promark-client-token').
        token = cookies['promark-client-token'] || null;
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const payload: ClientJWTPayload = await verifyClientJWT(token);

    return {
      user_id: payload.user_id,
      user_type: payload.user_type,
      tenant_id: payload.tenant_id,
      tenant_slug: payload.tenant_slug,
      role: payload.role,
      userType: 'CLIENT' as const,
    };
  } catch {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }
}

// ─── Dual Auth Helper ───────────────────────────────────────────────────────

/**
 * Try Promark auth first, fall back to Client JWT auth.
 * Returns the session (either type) or a NextResponse error.
 */
export async function requireApiAuth(
  request: Request
): Promise<ApiSession | NextResponse> {
  // Try promark auth first (Supabase session)
  const promarkResult = await requirePromarkApiAuth(request);
  if (!(promarkResult instanceof NextResponse)) {
    return promarkResult;
  }

  // Fall back to client JWT
  const clientResult = await requireClientApiAuth(request);
  if (!(clientResult instanceof NextResponse)) {
    return clientResult;
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ─── Permission Helper ──────────────────────────────────────────────────────

/**
 * Check permission and return a 403 NextResponse if denied.
 * Returns null if allowed.
 */
export async function requirePermission(
  params: PermissionCheckParams
): Promise<NextResponse | null> {
  const result = await checkPermission(params);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }

  return null;
}

// ─── Response Helpers ───────────────────────────────────────────────────────

export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}

export function getSessionUserId(session: ApiSession): string {
  return session.userType === 'PROMARK' ? session.id : session.user_id;
}

export function getSessionUserType(session: ApiSession): 'PROMARK' | 'CLIENT' {
  return session.userType;
}

export function getSessionRole(session: ApiSession): string {
  return session.userType === 'PROMARK' ? session.role : session.role;
}

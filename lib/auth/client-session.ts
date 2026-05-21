import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyClientJWT, type ClientJWTPayload } from '@/lib/auth/client-pin';

/**
 * Verifies the client JWT from cookie and ensures the token belongs
 * to the given tenant. Redirects to login if anything fails.
 */
export async function requireClientSession(
  tenantSlug: string
): Promise<ClientJWTPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get('promark-client-token')?.value;

  if (!token) {
    redirect(`/brand-ecosystem/${tenantSlug}/login`);
  }

  try {
    const payload = await verifyClientJWT(token);
    if (payload.tenant_slug !== tenantSlug) {
      redirect(`/brand-ecosystem/${tenantSlug}/login`);
    }
    return payload;
  } catch {
    redirect(`/brand-ecosystem/${tenantSlug}/login`);
  }
}

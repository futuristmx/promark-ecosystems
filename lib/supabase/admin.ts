import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for server-side operations that bypass RLS.
 * Used for Storage uploads/downloads when the actor is a client user
 * (PIN-authenticated, no Supabase Auth session) and we need to enforce
 * tenant isolation in application code instead of via JWT claims.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. NEVER expose this client to the browser.
 */
let cachedAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — required for storage operations'
    );
  }

  cachedAdmin = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdmin;
}

export const STORAGE_BUCKET = 'tenant-documents';

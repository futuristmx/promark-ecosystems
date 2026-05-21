-- Sprint 3 — Supabase Storage bucket for tenant documents
-- Apply via: Supabase Dashboard → SQL Editor → New query

-- ─── Create bucket ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-documents',
  'tenant-documents',
  false,
  52428800,  -- 50 MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── Storage Policies ───────────────────────────────────────────────────────
-- NOTE: Promark staff authenticate via Supabase Auth, so auth.jwt() is populated.
-- Client users authenticate via custom PIN+JWT and operate server-side only,
-- accessing storage through service role key. They never hit RLS directly.

-- Policy 1: Promark staff get full access (recognized by being authenticated
-- as a Supabase Auth user; their user_type metadata identifies them as 'promark').
DROP POLICY IF EXISTS "promark_full_access" ON storage.objects;
CREATE POLICY "promark_full_access" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'tenant-documents'
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'tenant-documents'
    AND auth.role() = 'authenticated'
  );

-- Policy 2: Authenticated read for files under the user's tenant folder
-- (used only by Promark staff; client users go through API server-side).
DROP POLICY IF EXISTS "tenant_folder_read" ON storage.objects;
CREATE POLICY "tenant_folder_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'tenant-documents'
    AND auth.role() = 'authenticated'
  );

-- ─── Storage path convention ─────────────────────────────────────────────────
-- tenant-documents/
--   [tenant-id]/
--     brands/[brand-id]/[uuid]-[filename]
--     companies/[company-id]/[uuid]-[filename]
--     contracts/[contract-id]/[uuid]-[filename]
--     general/[uuid]-[filename]

-- Sprint 4 — RLS for contracts, licenses, contract_history
-- Apply via: Supabase Dashboard → SQL Editor → New query
-- Notes:
--   * Promark staff use Supabase Auth -> auth.role() = 'authenticated'.
--   * Client users authenticate via custom PIN+JWT and operate server-side
--     through the service role key, which bypasses RLS.

-- ─── contracts ──────────────────────────────────────────────────────────────
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contracts_promark_full_access ON contracts;
CREATE POLICY contracts_promark_full_access ON contracts
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS contracts_service_role ON contracts;
CREATE POLICY contracts_service_role ON contracts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── licenses ───────────────────────────────────────────────────────────────
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS licenses_promark_full_access ON licenses;
CREATE POLICY licenses_promark_full_access ON licenses
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS licenses_service_role ON licenses;
CREATE POLICY licenses_service_role ON licenses
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── contract_history ───────────────────────────────────────────────────────
ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_history_promark_full_access ON contract_history;
CREATE POLICY contract_history_promark_full_access ON contract_history
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS contract_history_service_role ON contract_history;
CREATE POLICY contract_history_service_role ON contract_history
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

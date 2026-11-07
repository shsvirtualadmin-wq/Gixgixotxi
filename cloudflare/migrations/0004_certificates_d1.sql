-- ============================================================================
-- BOARDLY — CERTIFICATES & ADMIN SIGNATURES MIGRATION (Cloudflare D1)
-- Migration: 0004_certificates_d1.sql
-- ============================================================================
-- Apply with:
--   npx wrangler d1 execute boardly-commons-d1 --remote --file=./cloudflare/migrations/0004_certificates_d1.sql
-- ============================================================================

-- 1. Add Certificate Theme & Finalisation Columns to captain_tests (Grand Line mocks)
ALTER TABLE captain_tests ADD COLUMN certificate_theme_id TEXT DEFAULT NULL;
ALTER TABLE captain_tests ADD COLUMN results_finalised INTEGER NOT NULL DEFAULT 0;
ALTER TABLE captain_tests ADD COLUMN finalised_at INTEGER DEFAULT NULL;
ALTER TABLE captain_tests ADD COLUMN mock_number INTEGER DEFAULT NULL;

-- 2. Admin Certificate Signatures (Versioned, stored in private R2)
CREATE TABLE IF NOT EXISTS certificate_signatures (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL,
  signatory_name TEXT NOT NULL,
  signatory_title TEXT NOT NULL,
  version INTEGER NOT NULL UNIQUE,
  uploaded_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_certificate_signatures_active
  ON certificate_signatures(active, version DESC);

-- 3. Issued Certificates (1st Position in Grand Line Mocks, stored in private R2)
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  student_uid TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL DEFAULT '',
  grand_line_id TEXT NOT NULL,
  grand_line_title TEXT NOT NULL,
  edition_label TEXT NOT NULL DEFAULT '',
  rank INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  participants_count INTEGER NOT NULL DEFAULT 1,
  serial TEXT NOT NULL UNIQUE,
  theme_id TEXT NOT NULL,
  signature_version INTEGER NOT NULL DEFAULT 0,
  issued_at INTEGER NOT NULL,
  pdf_r2_key TEXT NOT NULL,
  png_r2_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  UNIQUE(student_uid, grand_line_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_student_uid
  ON certificates(student_uid, issued_at DESC);

CREATE INDEX IF NOT EXISTS idx_certificates_grand_line_id
  ON certificates(grand_line_id, rank ASC);

CREATE INDEX IF NOT EXISTS idx_certificates_serial
  ON certificates(serial);

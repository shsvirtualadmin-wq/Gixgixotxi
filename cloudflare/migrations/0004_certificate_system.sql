-- ============================================================================
-- Migration 0004: Boardly Certificate System in Cloudflare D1 (Additive Only)
-- ============================================================================
-- Apply locally:
--   npx wrangler d1 execute boardly-posts-db --local --file=./cloudflare/migrations/0004_certificate_system.sql
-- Apply to remote production D1:
--   npx wrangler d1 execute boardly-posts-db --remote --file=./cloudflare/migrations/0004_certificate_system.sql
-- ============================================================================

-- 1. certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  serial TEXT NOT NULL UNIQUE,
  grand_line_id TEXT NOT NULL,
  mock_name TEXT NOT NULL,
  student_uid TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  score REAL NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 1,
  participants INTEGER NOT NULL DEFAULT 1,
  theme_id TEXT NOT NULL DEFAULT 'auto',
  signatory_name TEXT NOT NULL,
  signatory_title TEXT NOT NULL,
  signature_r2_key TEXT NOT NULL,
  pdf_r2_key TEXT,
  status TEXT NOT NULL DEFAULT 'valid',
  revoked_at TEXT,
  revoked_by TEXT,
  revocation_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(student_uid, grand_line_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_serial ON certificates(serial);
CREATE INDEX IF NOT EXISTS idx_certificates_student_uid ON certificates(student_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_grand_line ON certificates(grand_line_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);

-- 2. certificate_signatures table
CREATE TABLE IF NOT EXISTS certificate_signatures (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL,
  signatory_name TEXT NOT NULL,
  signatory_title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_certificate_signatures_active ON certificate_signatures(active);

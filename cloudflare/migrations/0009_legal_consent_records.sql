-- =============================================================================
-- Migration 0009: Legal Consent Records (Terms of Service & Privacy Policy)
-- Additive-only migration: creates `legal_consent_records` without modifying
-- any existing tables or user data.
-- =============================================================================

CREATE TABLE IF NOT EXISTS legal_consent_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'registered',
  document_version TEXT NOT NULL,
  action_context TEXT NOT NULL DEFAULT 'signup',
  ip_hash TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  accepted_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legal_consent_user_version
  ON legal_consent_records (user_id, document_version, accepted_at DESC);

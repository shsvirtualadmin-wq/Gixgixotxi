-- ============================================================================
-- Migration: 0005_email_verification_codes.sql
-- Purpose: Server-side 6-digit email verification codes (OTP) for login and
--          sign-up, session verification tracking, and rate limiting in D1.
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'signup')),
  code_hash TEXT NOT NULL,
  link_token_hash TEXT DEFAULT NULL,
  auth_time INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  ip_hash TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_evc_user_purpose_created
  ON email_verification_codes (user_id, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evc_link_token_hash
  ON email_verification_codes (link_token_hash);

CREATE TABLE IF NOT EXISTS email_verification_sessions (
  user_id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL DEFAULT '',
  email_verified INTEGER NOT NULL DEFAULT 0,
  verified_auth_time INTEGER NOT NULL DEFAULT 0,
  verified_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS email_verification_send_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'signup')),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evsl_email_created
  ON email_verification_send_logs (email_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evsl_ip_created
  ON email_verification_send_logs (ip_hash, created_at DESC);

-- Migration 0008: Email Verification at Sign Up & Optional Two-Step Verification (TOTP + Email 2FA)
-- Server-side enforcement in Cloudflare D1. Do not store plaintext secrets, OTPs, backup codes, or device tokens.

-- 1. User 2FA Configuration & Replay Protection
CREATE TABLE IF NOT EXISTS user_2fa (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  totp_enabled INTEGER NOT NULL DEFAULT 0,
  email_2fa_enabled INTEGER NOT NULL DEFAULT 0,
  encrypted_secret TEXT DEFAULT NULL,
  pending_encrypted_secret TEXT DEFAULT NULL,
  last_used_step INTEGER NOT NULL DEFAULT 0,
  recovery_requested_at INTEGER DEFAULT NULL,
  recovery_disable_at INTEGER DEFAULT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_2fa_recovery
  ON user_2fa (recovery_disable_at);

-- 2. One-Time Backup Codes (HMAC-SHA256 hashed only, 10 generated per setup/regeneration)
CREATE TABLE IF NOT EXISTS user_2fa_backup_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  used_at INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_2fa_backup_codes_user
  ON user_2fa_backup_codes (user_id, used);

-- 3. Trusted Devices ("Remember this device for 30 days", HttpOnly cookie token hash in D1)
CREATE TABLE IF NOT EXISTS trusted_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user
  ON trusted_devices (user_id, revoked, expires_at);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_token
  ON trusted_devices (token_hash, revoked);

-- 4. Short-Lived Pending 2FA Login Challenges (5-minute TTL after password / Google step)
CREATE TABLE IF NOT EXISTS pending_2fa_challenges (
  challenge_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  auth_time INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_2fa_challenges_user
  ON pending_2fa_challenges (user_id, verified, expires_at DESC);

-- 5. Security Audit Logs (2FA changes, backup code events, admin 2FA resets, failed attempt bursts)
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ip_hash TEXT NOT NULL DEFAULT '',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user
  ON security_audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event
  ON security_audit_logs (event_type, created_at DESC);

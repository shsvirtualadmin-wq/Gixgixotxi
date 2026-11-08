-- ============================================================================
-- Migration 0006: Guest Mode Accounts, Global Case-Insensitive Usernames,
-- Secure Guest Sessions, and Abuse / Rate-Limit Tracking in Cloudflare D1
-- ============================================================================

-- 1. Global Case-Insensitive Username Directory (shared across ALL users: guests + registered)
CREATE TABLE IF NOT EXISTS user_usernames (
  username_lower TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  normalized_lookalike TEXT NOT NULL,
  uid TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'registered', -- 'guest' | 'registered'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_usernames_lower ON user_usernames(username_lower);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_usernames_uid ON user_usernames(uid);
CREATE INDEX IF NOT EXISTS idx_user_usernames_lookalike ON user_usernames(normalized_lookalike);

-- 2. Guest & Unified Accounts Directory in D1 (stores guest accounts, progress, attempts, stats, and admin visibility)
CREATE TABLE IF NOT EXISTS guest_accounts (
  uid TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_lower TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  short_id TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'guest', -- 'guest' | 'registered'
  is_guest INTEGER NOT NULL DEFAULT 1,
  email TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free',
  role TEXT NOT NULL DEFAULT 'student',
  upgraded_to_uid TEXT DEFAULT NULL,
  upgraded_at INTEGER DEFAULT NULL,
  target_university TEXT DEFAULT 'General Prep',
  tests_completed INTEGER NOT NULL DEFAULT 0,
  total_questions_solved INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  stats_json TEXT NOT NULL DEFAULT '{}',
  attempts_json TEXT NOT NULL DEFAULT '[]',
  ip_hash TEXT DEFAULT '',
  device_id_hash TEXT DEFAULT '',
  is_suspended INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_accounts_username_lower ON guest_accounts(username_lower);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_type_active ON guest_accounts(account_type, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_created ON guest_accounts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_ip_created ON guest_accounts(ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_device_created ON guest_accounts(device_id_hash, created_at DESC);

-- 3. Secure Guest Sessions (stores HMAC-SHA256 hash of HttpOnly session token, never plain token)
CREATE TABLE IF NOT EXISTS guest_sessions (
  session_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  uid TEXT NOT NULL,
  ip_hash TEXT DEFAULT '',
  device_id_hash TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_sessions_token_hash ON guest_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_uid ON guest_sessions(uid, revoked, expires_at DESC);

-- 4. Guest Creation Rate Limits (per IP hash and per device ID hash)
CREATE TABLE IF NOT EXISTS guest_creation_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier_hash TEXT NOT NULL,
  identifier_type TEXT NOT NULL, -- 'ip' | 'device'
  uid TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guest_rate_limits_lookup
  ON guest_creation_rate_limits(identifier_hash, identifier_type, created_at DESC);

-- Boardly Security Center D1 Migration
-- Adds passkeys, webauthn_challenges, sessions, and security_events tables.

CREATE TABLE IF NOT EXISTS passkeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key_b64 TEXT NOT NULL,
  algorithm INTEGER NOT NULL DEFAULT -7,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT NOT NULL DEFAULT '[]',
  name TEXT NOT NULL DEFAULT 'Passkey',
  device_type TEXT NOT NULL DEFAULT 'platform',
  created_at INTEGER NOT NULL,
  last_used_at INTEGER DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_passkeys_user_created ON passkeys (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys (credential_id);

CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  challenge TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('register', 'authenticate')),
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user ON webauthn_challenges (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_label TEXT NOT NULL DEFAULT 'Unknown device',
  browser TEXT NOT NULL DEFAULT 'Browser',
  os TEXT NOT NULL DEFAULT 'Device',
  user_agent TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',
  location_hint TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  revoked_at INTEGER DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions (user_id, revoked_at, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  device_label TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created ON security_events (user_id, created_at DESC);

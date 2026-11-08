-- Migration 0007: Temporary Guest Lifecycle (Abandonment & Scheduled Purge) + Registered Username Login
-- Safe to run on existing D1 databases without modifying existing user data.

-- 1. Guest lifecycle columns on guest_accounts:
--    - status: 'active' | 'abandoned' | 'upgraded'
--    - abandoned_at: epoch ms when the guest confirmed logout
--    - purge_after: epoch ms when the abandoned guest's data should be permanently deleted (7-day grace period)
ALTER TABLE guest_accounts ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE guest_accounts ADD COLUMN abandoned_at INTEGER DEFAULT NULL;
ALTER TABLE guest_accounts ADD COLUMN purge_after INTEGER DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_guest_accounts_status_purge
  ON guest_accounts(status, purge_after);

CREATE INDEX IF NOT EXISTS idx_guest_accounts_last_active
  ON guest_accounts(is_guest, last_active_at);

-- 2. Store registered user's email on user_usernames (server-only lookup for username + password login)
ALTER TABLE user_usernames ADD COLUMN email TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_user_usernames_uid_type
  ON user_usernames(uid, account_type);

-- 3. Rate limiting table for login attempts (per IP and per identifier)
CREATE TABLE IF NOT EXISTS login_rate_limits (
  rate_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_start_ms INTEGER NOT NULL,
  blocked_until_ms INTEGER DEFAULT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_rate_limits_updated
  ON login_rate_limits(updated_at_ms);

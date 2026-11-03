-- ============================================================================
-- Migration 0003: Boardly Rewards System in Cloudflare D1 (Additive Only)
-- ============================================================================
-- Apply locally:
--   npx wrangler d1 execute boardly-posts-db --local --file=./cloudflare/migrations/0003_rewards_d1.sql
-- Apply to remote production D1:
--   npx wrangler d1 execute boardly-posts-db --remote --file=./cloudflare/migrations/0003_rewards_d1.sql
-- ============================================================================

-- 1. reward_settings: holds mode ("off" | "admin_only" | "everyone", default "off")
--    and config JSON (30-day ladder, milestones, referral settings, timezone Asia/Karachi, resetOnMiss false)
CREATE TABLE IF NOT EXISTS reward_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 2. reward_daily_claims: one claim per (uid, pkt_date) enforced by PRIMARY KEY
CREATE TABLE IF NOT EXISTS reward_daily_claims (
  uid TEXT NOT NULL,
  pkt_date TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  credit_status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (uid, pkt_date)
);

CREATE INDEX IF NOT EXISTS idx_reward_daily_claims_uid_created
  ON reward_daily_claims(uid, created_at DESC);

-- 3. reward_milestone_claims: one claim per (uid, milestone_id) enforced by PRIMARY KEY
CREATE TABLE IF NOT EXISTS reward_milestone_claims (
  uid TEXT NOT NULL,
  milestone_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  credit_status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (uid, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_reward_milestone_claims_uid
  ON reward_milestone_claims(uid);

-- 4. referral_codes: permanent unique BLD-XXXXXX code per user
CREATE TABLE IF NOT EXISTS referral_codes (
  uid TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code
  ON referral_codes(code);

-- 5. referrals: one inviter per invitee enforced by invitee_uid UNIQUE
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  inviter_uid TEXT NOT NULL,
  invitee_uid TEXT NOT NULL UNIQUE,
  inviter_code TEXT NOT NULL,
  invitee_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_confirmation',
  inviter_accepted INTEGER NOT NULL DEFAULT 0,
  invitee_accepted INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT NOT NULL DEFAULT '',
  flagged INTEGER NOT NULL DEFAULT 0,
  inviter_credit_status TEXT NOT NULL DEFAULT 'pending',
  invitee_credit_status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  paid_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_referrals_inviter_uid
  ON referrals(inviter_uid, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referrals_ip_hash_created
  ON referrals(ip_hash, created_at DESC);

-- Seed defaults: mode = "off" and default config JSON (never overwrites existing admin choices)
INSERT OR IGNORE INTO reward_settings (key, value)
VALUES ('mode', 'off');

INSERT OR IGNORE INTO reward_settings (key, value)
VALUES (
  'config',
  '{"timezone":"Asia/Karachi","resetOnMiss":false,"dailyLadder":[50,100,200,400,200,200,400,200,200,200,200,200,200,400,200,200,200,200,200,200,400,200,200,200,200,200,200,400,200,1000],"milestones":{"50":100,"100":250,"250":500,"500":1000},"referral":{"inviterReward":5000,"inviteeReward":1000,"minInviteeMcqs":20,"maxPaidPerInviterPerMonth":10,"pendingExpiryDays":14,"manualCodeWindowDays":7}}'
);

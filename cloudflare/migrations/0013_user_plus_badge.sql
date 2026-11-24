-- Migration 0013: Independent PLUS Badge preferences table
-- Completely separate from user_pro_badge (PRO badge).
-- Stores each Boardly Plus member's selected PLUS badge design (#01..#50, or NULL when unequipped)
-- and visibility preference (`plus_badge_visible`: 1 = visible, 0 = hidden).

CREATE TABLE IF NOT EXISTS user_plus_badge (
  user_id TEXT PRIMARY KEY,
  plus_badge_design INTEGER CHECK (plus_badge_design IS NULL OR (plus_badge_design >= 1 AND plus_badge_design <= 50)),
  plus_badge_visible INTEGER NOT NULL DEFAULT 1 CHECK (plus_badge_visible IN (0, 1)),
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_plus_badge_updated_at
  ON user_plus_badge(updated_at DESC);

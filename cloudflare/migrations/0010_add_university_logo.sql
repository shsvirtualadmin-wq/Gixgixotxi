-- =============================================================================
-- Migration: 0010_add_university_logo.sql
-- Purpose: Add optional logo_url column to universities and create
--          university_logo_assets metadata table for R2 object lifecycle tracking.
-- Target: Cloudflare D1 (SQLite)
-- =============================================================================

-- 1. Add optional logo_url column to existing universities table
ALTER TABLE universities ADD COLUMN logo_url TEXT;

-- 2. Create university_logo_assets table to track R2 keys for safe replace/remove cleanup
CREATE TABLE IF NOT EXISTS university_logo_assets (
  id TEXT PRIMARY KEY,
  university_id TEXT NOT NULL UNIQUE,
  r2_key TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/webp',
  file_size INTEGER NOT NULL DEFAULT 0,
  uploaded_by_uid TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

-- 3. Indexes for fast logo lookup and cleanup queries
CREATE INDEX IF NOT EXISTS idx_universities_logo_url ON universities(logo_url);
CREATE INDEX IF NOT EXISTS idx_university_logo_assets_uni_id ON university_logo_assets(university_id);

-- =============================================================================
-- ROLLBACK NOTE (SQLite / Cloudflare D1):
-- To roll back these changes safely in Cloudflare D1:
-- 1. Drop the logo assets table and indexes:
--    DROP INDEX IF EXISTS idx_university_logo_assets_uni_id;
--    DROP INDEX IF EXISTS idx_universities_logo_url;
--    DROP TABLE IF EXISTS university_logo_assets;
-- 2. Remove logo_url from universities:
--    In SQLite 3.35.0+ (supported by Cloudflare D1), drop the non-indexed column directly:
--    ALTER TABLE universities DROP COLUMN logo_url;
--    (On older SQLite builds without DROP COLUMN support, recreate the table
--    without logo_url, copy id/name/slug/short_code/description/is_active/
--    display_order/created_by_uid/created_at/updated_at into the new table,
--    drop the old table, and rename the new table back to universities.)
-- =============================================================================

-- =============================================================================
-- BOARDLY D1 MIGRATION: UNIVERSITY MCQ BANK (0001_university_mcqs.sql)
-- =============================================================================
-- Run locally:
--   npx wrangler d1 execute boardly-posts-db --local --file=./cloudflare/migrations/0001_university_mcqs.sql
-- Run in production:
--   npx wrangler d1 execute boardly-posts-db --remote --file=./cloudflare/migrations/0001_university_mcqs.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS universities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  mcq_count INTEGER NOT NULL DEFAULT 0,
  is_live INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_universities_sort ON universities(sort_order ASC, name ASC);
CREATE INDEX IF NOT EXISTS idx_universities_slug ON universities(slug);

CREATE TABLE IF NOT EXISTS mcqs (
  id TEXT PRIMARY KEY,
  university_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mcqs_university_id ON mcqs(university_id);
CREATE INDEX IF NOT EXISTS idx_mcqs_subject ON mcqs(subject);
CREATE INDEX IF NOT EXISTS idx_mcqs_topic ON mcqs(topic);
CREATE INDEX IF NOT EXISTS idx_mcqs_uni_sub_top ON mcqs(university_id, subject, topic);

CREATE TABLE IF NOT EXISTS mcq_reports (
  id TEXT PRIMARY KEY,
  mcq_id TEXT NOT NULL,
  university_id TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  question_preview TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT 'wrong_key',
  comment TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL DEFAULT '',
  user_email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mcq_reports_status ON mcq_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcq_reports_mcq_id ON mcq_reports(mcq_id);

-- Pre-seed Pakistani universities & entry tests (all start with mcq_count = 0, is_live = 0)
INSERT OR IGNORE INTO universities (id, name, slug, logo_url, sort_order, mcq_count, is_live, created_at) VALUES
  ('uni_fast_nuces', 'FAST-NUCES', 'fast-nuces', '', 1, 0, 0, datetime('now')),
  ('uni_nust_net', 'NUST (NET)', 'nust-net', '', 2, 0, 0, datetime('now')),
  ('uni_giki', 'GIKI', 'giki', '', 3, 0, 0, datetime('now')),
  ('uni_comsats', 'COMSATS', 'comsats', '', 4, 0, 0, datetime('now')),
  ('uni_lums_lcat', 'LUMS (LCAT)', 'lums-lcat', '', 5, 0, 0, datetime('now')),
  ('uni_iba_karachi', 'IBA Karachi', 'iba-karachi', '', 6, 0, 0, datetime('now')),
  ('uni_uet_ecat', 'UET (ECAT)', 'uet-ecat', '', 7, 0, 0, datetime('now')),
  ('uni_pieas', 'PIEAS', 'pieas', '', 8, 0, 0, datetime('now')),
  ('uni_air_university', 'Air University', 'air-university', '', 9, 0, 0, datetime('now')),
  ('uni_bahria_university', 'Bahria University', 'bahria-university', '', 10, 0, 0, datetime('now')),
  ('uni_ned_university', 'NED University', 'ned-university', '', 11, 0, 0, datetime('now')),
  ('uni_ecat', 'ECAT', 'ecat', '', 12, 0, 0, datetime('now')),
  ('uni_mdcat', 'MDCAT', 'mdcat', '', 13, 0, 0, datetime('now')),
  ('uni_nums', 'NUMS', 'nums', '', 14, 0, 0, datetime('now')),
  ('uni_etea', 'ETEA', 'etea', '', 15, 0, 0, datetime('now')),
  ('uni_nts_nat', 'NTS NAT', 'nts-nat', '', 16, 0, 0, datetime('now')),
  ('uni_usat_hec', 'USAT (HEC)', 'usat-hec', '', 17, 0, 0, datetime('now')),
  ('uni_aku', 'AKU', 'aku', '', 18, 0, 0, datetime('now'));

-- Remove any legacy Admin Bank subject-pool questions in D1 so the bank starts clean
DELETE FROM questions;
DELETE FROM questions_import_log;

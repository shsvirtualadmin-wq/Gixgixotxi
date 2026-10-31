-- ============================================================================
-- Migration 0002: University MCQ Permanent Isolation & Import Traceability
-- ============================================================================
-- Additive migration ONLY (no DROP TABLE, no INSERT OR REPLACE on universities
-- or mcqs). Enforces:
-- 1. Idempotent university seed via ON CONFLICT(slug) DO UPDATE SET name,
--    logo_url, sort_order only (never regenerating or altering universities.id).
-- 2. Immutable universities.id and universities.slug via BEFORE UPDATE trigger.
-- 3. Strict ON DELETE RESTRICT on universities when MCQs exist.
-- 4. Denormalized university_slug and import_batch_id on mcqs, plus triggers
--    ensuring mcqs.university_id and mcqs.university_slug always match.
-- 5. Dedicated imports table to trace every import batch and its locked target
--    university.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Ensure unique index on universities.slug exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_universities_slug_unique ON universities(slug);

-- 2. Idempotent seed of the 18 canonical Pakistani universities & entry tests
--    Updates display fields ONLY on slug conflict; NEVER modifies id.
INSERT INTO universities (id, name, slug, logo_url, sort_order, mcq_count, is_live, created_at) VALUES
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
  ('uni_aku', 'AKU', 'aku', '', 18, 0, 0, datetime('now'))
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  logo_url = CASE WHEN universities.logo_url = '' THEN excluded.logo_url ELSE universities.logo_url END,
  sort_order = excluded.sort_order;

-- 3. Add university_slug and import_batch_id columns to mcqs (additive)
ALTER TABLE mcqs ADD COLUMN university_slug TEXT NOT NULL DEFAULT '';
ALTER TABLE mcqs ADD COLUMN import_batch_id TEXT NOT NULL DEFAULT '';

-- 4. Backfill university_slug on all existing MCQs from their linked university
UPDATE mcqs
SET university_slug = COALESCE(
  (SELECT slug FROM universities WHERE universities.id = mcqs.university_id),
  university_slug
)
WHERE university_slug = '' OR university_slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_mcqs_university_slug ON mcqs(university_slug);
CREATE INDEX IF NOT EXISTS idx_mcqs_import_batch_id ON mcqs(import_batch_id);

-- 5. Create imports table for traceable import batches
CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  university_id TEXT NOT NULL,
  university_slug TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'csv',
  file_name TEXT NOT NULL DEFAULT '',
  row_count INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_imports_university_id ON imports(university_id, created_at DESC);

-- 6. Guardrail Triggers:
--    (a) Prevent changing universities.id or universities.slug once created
CREATE TRIGGER IF NOT EXISTS trg_universities_immutable_keys
BEFORE UPDATE ON universities
FOR EACH ROW
WHEN OLD.id != NEW.id OR OLD.slug != NEW.slug
BEGIN
  SELECT RAISE(ABORT, 'universities.id and universities.slug are immutable and cannot be changed.');
END;

--    (b) Enforce ON DELETE RESTRICT on universities when any MCQs exist
CREATE TRIGGER IF NOT EXISTS trg_universities_restrict_delete
BEFORE DELETE ON universities
FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM mcqs WHERE university_id = OLD.id)
BEGIN
  SELECT RAISE(ABORT, 'Cannot delete university with existing MCQs (ON DELETE RESTRICT).');
END;

--    (c) Enforce mcqs.university_id and mcqs.university_slug agreement on INSERT
CREATE TRIGGER IF NOT EXISTS trg_mcqs_validate_university_insert
BEFORE INSERT ON mcqs
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.university_id IS NULL OR TRIM(NEW.university_id) = '' THEN
      RAISE(ABORT, 'mcqs.university_id is required.')
    WHEN NOT EXISTS (SELECT 1 FROM universities WHERE id = NEW.university_id) THEN
      RAISE(ABORT, 'mcqs.university_id does not reference a valid university.')
    WHEN NEW.university_slug != '' AND NOT EXISTS (
      SELECT 1 FROM universities WHERE id = NEW.university_id AND slug = NEW.university_slug
    ) THEN
      RAISE(ABORT, 'mcqs.university_id and mcqs.university_slug mismatch.')
  END;
END;

--    (d) Enforce mcqs.university_id and mcqs.university_slug agreement on UPDATE
CREATE TRIGGER IF NOT EXISTS trg_mcqs_validate_university_update
BEFORE UPDATE ON mcqs
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.university_id IS NULL OR TRIM(NEW.university_id) = '' THEN
      RAISE(ABORT, 'mcqs.university_id is required.')
    WHEN NOT EXISTS (SELECT 1 FROM universities WHERE id = NEW.university_id) THEN
      RAISE(ABORT, 'mcqs.university_id does not reference a valid university.')
    WHEN NEW.university_slug != '' AND NOT EXISTS (
      SELECT 1 FROM universities WHERE id = NEW.university_id AND slug = NEW.university_slug
    ) THEN
      RAISE(ABORT, 'mcqs.university_id and mcqs.university_slug mismatch.')
  END;
END;

-- 7. Recalculate mcq_count and is_live from actual mcqs rows
UPDATE universities
SET
  mcq_count = (SELECT COUNT(*) FROM mcqs WHERE mcqs.university_id = universities.id),
  is_live = CASE WHEN (SELECT COUNT(*) FROM mcqs WHERE mcqs.university_id = universities.id) > 0 THEN 1 ELSE 0 END;

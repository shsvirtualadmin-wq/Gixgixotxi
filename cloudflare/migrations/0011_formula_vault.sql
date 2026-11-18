-- =============================================================================
-- Migration: 0011_formula_vault.sql
-- Purpose: Create Formula Vault (student) and Formula Bank (admin) tables
--          in Cloudflare D1 (categories, chapters, formulas, bookmarks,
--          formula_reports, import_logs) and required indexes.
-- Target: Cloudflare D1 (SQLite)
-- =============================================================================

-- 1. Formula Categories (e.g. Basic Maths, Advanced Maths, Physics, Chemistry, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  chapter_count INTEGER NOT NULL DEFAULT 0,
  formula_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live',
  guest_access INTEGER NOT NULL DEFAULT 1,
  search_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Formula Chapters (numbered chapters inside a category, with R2 PDF key)
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  chapter_no INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  subtopics TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  formula_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live',
  pdf_r2_key TEXT NOT NULL DEFAULT '',
  pdf_updated_at TEXT NOT NULL DEFAULT '',
  search_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 3. Formulas (numbered KaTeX formulas inside a chapter)
CREATE TABLE IF NOT EXISTS formulas (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  formula_no INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT '',
  formula_latex TEXT NOT NULL,
  plain_text TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'live',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_render_valid INTEGER NOT NULL DEFAULT 1,
  render_error TEXT NOT NULL DEFAULT '',
  search_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- 4. Student Formula Bookmarks (requires signed-in non-guest user)
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  formula_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, formula_id),
  FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE
);

-- 5. Student Formula Error Reports (reviewed by admins in Formula Bank -> Reports)
CREATE TABLE IF NOT EXISTS formula_reports (
  id TEXT PRIMARY KEY,
  formula_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  formula_latex_snapshot TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  resolved_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE
);

-- 6. Bulk Import Logs (stores R2 key of uploaded CSV/XLSX batch and chunk summary)
CREATE TABLE IF NOT EXISTS import_logs (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL DEFAULT '',
  admin_uid TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'csv',
  file_name TEXT NOT NULL DEFAULT '',
  csv_r2_key TEXT NOT NULL DEFAULT '',
  duplicate_strategy TEXT NOT NULL DEFAULT 'skip',
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  updated_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- =============================================================================
-- Indexes on category_id, chapter_id, status, sort_order, and search_text
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_categories_status_sort ON categories(status, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_categories_search_text ON categories(search_text);

CREATE INDEX IF NOT EXISTS idx_chapters_category_id ON chapters(category_id);
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);
CREATE INDEX IF NOT EXISTS idx_chapters_sort_order ON chapters(category_id, sort_order ASC, chapter_no ASC);
CREATE INDEX IF NOT EXISTS idx_chapters_search_text ON chapters(search_text);

CREATE INDEX IF NOT EXISTS idx_formulas_category_id ON formulas(category_id);
CREATE INDEX IF NOT EXISTS idx_formulas_chapter_id ON formulas(chapter_id);
CREATE INDEX IF NOT EXISTS idx_formulas_status ON formulas(status);
CREATE INDEX IF NOT EXISTS idx_formulas_sort_order ON formulas(chapter_id, sort_order ASC, formula_no ASC);
CREATE INDEX IF NOT EXISTS idx_formulas_search_text ON formulas(search_text);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_formula_id ON bookmarks(formula_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category_id ON bookmarks(category_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_chapter_id ON bookmarks(chapter_id);

CREATE INDEX IF NOT EXISTS idx_formula_reports_status ON formula_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_formula_reports_category_id ON formula_reports(category_id);
CREATE INDEX IF NOT EXISTS idx_formula_reports_chapter_id ON formula_reports(chapter_id);
CREATE INDEX IF NOT EXISTS idx_formula_reports_formula_id ON formula_reports(formula_id);

CREATE INDEX IF NOT EXISTS idx_import_logs_category_id ON import_logs(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_logs_chapter_id ON import_logs(chapter_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);

-- =============================================================================
-- Migration 0015: Cloudflare D1 Read Optimization Indexes (Strictly Additive)
-- =============================================================================
-- SAFETY GUARANTEE:
--   - Contains ONLY CREATE INDEX IF NOT EXISTS statements.
--   - Zero DROP, TRUNCATE, DELETE, UPDATE, or schema-breaking statements.
--   - Never modifies or resets any existing data.
--
-- Apply to remote production D1:
--   npx wrangler d1 execute boardly-posts-db --remote --file=./cloudflare/migrations/0015_d1_read_optimization_indexes.sql
-- Apply to local D1:
--   npx wrangler d1 execute boardly-posts-db --local --file=./cloudflare/migrations/0015_d1_read_optimization_indexes.sql
-- =============================================================================

-- ─── 1. University MCQs (mcqs) — Highest-volume table ───────────────────────
-- Composite covering / filter indexes supporting case-insensitive filters
-- (`col = ? COLLATE NOCASE`) and ordered pagination without full table scans.
CREATE INDEX IF NOT EXISTS idx_mcqs_uni_created
  ON mcqs(university_id, created_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS idx_mcqs_uni_sub_top_diff_nocase
  ON mcqs(
    university_id,
    subject COLLATE NOCASE,
    topic COLLATE NOCASE,
    difficulty COLLATE NOCASE,
    created_at DESC,
    id ASC
  );

CREATE INDEX IF NOT EXISTS idx_mcqs_sub_top_nocase
  ON mcqs(subject COLLATE NOCASE, topic COLLATE NOCASE, created_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS idx_mcqs_diff_nocase
  ON mcqs(difficulty COLLATE NOCASE, created_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS idx_mcqs_created_id
  ON mcqs(created_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS idx_mcqs_uni_slug_nocase
  ON mcqs(university_slug COLLATE NOCASE, created_at DESC, id ASC);

-- ─── 2. Universities lookup (slug / name case-insensitive + live filter) ────
CREATE INDEX IF NOT EXISTS idx_universities_slug_nocase
  ON universities(slug COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_universities_name_nocase
  ON universities(name COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_universities_live_sort
  ON universities(is_live, sort_order ASC, name ASC);

-- ─── 3. Question Bank (questions) ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_bank_sub_top_diff_status_nocase
  ON questions(
    bank_id,
    subject COLLATE NOCASE,
    topic COLLATE NOCASE,
    difficulty COLLATE NOCASE,
    status,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_questions_status_created
  ON questions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_bank_status_created
  ON questions(bank_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_sub_status_created_nocase
  ON questions(subject COLLATE NOCASE, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_review_status_created
  ON questions(needs_review, status, created_at DESC);

-- Covering index for /api/questions/health & /api/questions/stats GROUP BY
CREATE INDEX IF NOT EXISTS idx_questions_stats_cover
  ON questions(bank_id, subject, topic, difficulty, status, needs_review, correct_answer);

-- ─── 4. Commons Posts & Moderation (posts, post_reports) ────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_hidden_subject_nocase
  ON posts(is_hidden, subject COLLATE NOCASE, is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_hidden_target_nocase
  ON posts(is_hidden, target COLLATE NOCASE, is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_hidden_board_nocase
  ON posts(is_hidden, board COLLATE NOCASE, is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_hidden_class_created
  ON posts(is_hidden, class_level, is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_hidden_format_nocase
  ON posts(is_hidden, format COLLATE NOCASE, is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_hidden_type_created
  ON posts(is_hidden, type, is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_hidden_views
  ON posts(is_hidden, is_pinned DESC, views DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_moderation_queue
  ON posts(is_hidden, report_count, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_status_hidden_created
  ON posts(status, is_hidden, created_at DESC);

-- ─── 5. Formula Vault (formulas, chapters, categories, bookmarks) ───────────
CREATE INDEX IF NOT EXISTS idx_formulas_status_sort
  ON formulas(status, sort_order ASC, formula_no ASC);

CREATE INDEX IF NOT EXISTS idx_formulas_chapter_status_no_sort
  ON formulas(chapter_id, status, formula_no ASC, sort_order ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_formulas_category_status
  ON formulas(category_id, status);

CREATE INDEX IF NOT EXISTS idx_chapters_category_status_no_sort
  ON chapters(category_id, status, chapter_no ASC, sort_order ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_categories_slug_nocase
  ON categories(slug COLLATE NOCASE);

-- ─── 6. Roles, Announcements, Notifications, Reports ────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_roles_role_updated
  ON user_roles(role, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_updated
  ON user_roles(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_welcome
  ON announcements(is_welcome, is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mcq_reports_uni_status_created
  ON mcq_reports(university_id, status, created_at DESC);

-- ─── 7. Grand Line / Captain Tests, Attempts, Crews & Certificates ──────────
CREATE INDEX IF NOT EXISTS idx_captain_tests_created
  ON captain_tests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_captain_tests_crew_created
  ON captain_tests(crew_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_attempts_created
  ON test_attempts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_correct
  ON attempt_answers(attempt_id, is_correct);

CREATE INDEX IF NOT EXISTS idx_crews_status_members_created
  ON crews(status, member_count DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crews_code_nocase
  ON crews(code COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_certificates_status_issued
  ON certificates(status, issued_at DESC);

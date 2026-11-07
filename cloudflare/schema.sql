PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_roles (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'captain', 'admin', 'superadmin', 'bot')),
  custom_role TEXT DEFAULT NULL,
  is_posting_banned INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

CREATE TABLE IF NOT EXISTS crews (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  university TEXT NOT NULL DEFAULT '',
  captain_uid TEXT NOT NULL,
  captain_name TEXT NOT NULL,
  captain_email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crews_captain_uid ON crews(captain_uid);
CREATE INDEX IF NOT EXISTS idx_crews_status ON crews(status);
CREATE INDEX IF NOT EXISTS idx_crews_code ON crews(code);

CREATE TABLE IF NOT EXISTS crew_members (
  id TEXT PRIMARY KEY,
  crew_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL DEFAULT '',
  user_avatar TEXT DEFAULT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('captain', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  joined_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE CASCADE,
  UNIQUE(crew_id, user_uid)
);

CREATE INDEX IF NOT EXISTS idx_crew_members_crew_id ON crew_members(crew_id, status);
CREATE INDEX IF NOT EXISTS idx_crew_members_user_uid ON crew_members(user_uid);

CREATE TABLE IF NOT EXISTS captain_tests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 20,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'unpublished')),
  captain_uid TEXT NOT NULL,
  captain_name TEXT NOT NULL,
  crew_id TEXT DEFAULT NULL,
  crew_name TEXT NOT NULL DEFAULT '',
  attempts_count INTEGER NOT NULL DEFAULT 0,
  avg_score REAL NOT NULL DEFAULT 0,
  certificate_theme_id TEXT DEFAULT NULL,
  results_finalised INTEGER NOT NULL DEFAULT 0,
  finalised_at INTEGER DEFAULT NULL,
  mock_number INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_captain_tests_captain_uid ON captain_tests(captain_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_captain_tests_public ON captain_tests(visibility, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_captain_tests_subject ON captain_tests(subject, visibility, status);

CREATE TABLE IF NOT EXISTS test_questions (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]',
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (test_id) REFERENCES captain_tests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id, position ASC);

CREATE TABLE IF NOT EXISTS test_attempts (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  test_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  captain_uid TEXT NOT NULL,
  captain_name TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT DEFAULT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (test_id) REFERENCES captain_tests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id, percentage DESC, time_taken_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_uid ON test_attempts(user_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_attempts_captain_uid ON test_attempts(captain_uid, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_attempts_unique_user_test ON test_attempts(test_id, user_uid);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_index INTEGER NOT NULL DEFAULT -1,
  correct_index INTEGER NOT NULL DEFAULT 0,
  is_correct INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES captain_tests(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_test_id ON attempt_answers(test_id);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  bank_id TEXT NOT NULL DEFAULT 'legacy',
  subject TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'published',
  needs_review INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL DEFAULT '',
  source_path TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_bank_subj_topic_status ON questions(bank_id, subject, topic, status);
CREATE INDEX IF NOT EXISTS idx_questions_needs_review ON questions(needs_review);
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_bank_source_path ON questions(bank_id, source_path);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'notes',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT 'General',
  chapter TEXT NOT NULL DEFAULT 'General',
  target TEXT NOT NULL DEFAULT 'General',
  class_level TEXT NOT NULL DEFAULT '12',
  board TEXT NOT NULL DEFAULT 'Federal',
  format TEXT NOT NULL DEFAULT 'Text',
  tags_json TEXT NOT NULL DEFAULT '[]',
  files_json TEXT NOT NULL DEFAULT '[]',
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  anonymous_alias TEXT NOT NULL DEFAULT 'Anonymous Student',
  author_uid TEXT DEFAULT NULL,
  real_author_uid TEXT DEFAULT NULL,
  author_name TEXT NOT NULL DEFAULT 'Student',
  author_avatar TEXT DEFAULT NULL,
  author_frame TEXT DEFAULT NULL,
  author_equipped_avatar TEXT DEFAULT NULL,
  author_photo_url TEXT DEFAULT NULL,
  author_role TEXT NOT NULL DEFAULT 'student',
  author_custom_role TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  visibility TEXT NOT NULL DEFAULT 'public',
  is_hidden INTEGER NOT NULL DEFAULT 0,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_feed ON posts(status, visibility, is_hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_subject ON posts(subject, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  text TEXT NOT NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  author_uid TEXT DEFAULT NULL,
  real_author_uid TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Student',
  author_avatar TEXT DEFAULT NULL,
  author_frame TEXT DEFAULT NULL,
  author_equipped_avatar TEXT DEFAULT NULL,
  author_photo_url TEXT DEFAULT NULL,
  author_role TEXT NOT NULL DEFAULT 'student',
  author_custom_role TEXT DEFAULT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id, created_at ASC);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_uid)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'following_post',
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  link TEXT DEFAULT '/dashboard/commons',
  read INTEGER NOT NULL DEFAULT 0,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  author_id TEXT DEFAULT NULL,
  author_name TEXT DEFAULT NULL,
  author_avatar TEXT DEFAULT NULL,
  author_frame TEXT DEFAULT NULL,
  post_id TEXT DEFAULT NULL,
  post_type TEXT DEFAULT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bot_settings (
  id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  daily_post_limit INTEGER NOT NULL DEFAULT 6,
  posts_per_run INTEGER NOT NULL DEFAULT 2,
  comments_per_run INTEGER NOT NULL DEFAULT 2,
  likes_per_run INTEGER NOT NULL DEFAULT 4,
  active_bot_uids_json TEXT NOT NULL DEFAULT '[]',
  last_run_at INTEGER DEFAULT NULL,
  last_run_status TEXT DEFAULT NULL,
  last_run_summary_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS certificate_signatures (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL,
  signatory_name TEXT NOT NULL,
  signatory_title TEXT NOT NULL,
  version INTEGER NOT NULL UNIQUE,
  uploaded_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_certificate_signatures_active
  ON certificate_signatures(active, version DESC);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  student_uid TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL DEFAULT '',
  grand_line_id TEXT NOT NULL,
  grand_line_title TEXT NOT NULL,
  edition_label TEXT NOT NULL DEFAULT '',
  rank INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  participants_count INTEGER NOT NULL DEFAULT 1,
  serial TEXT NOT NULL UNIQUE,
  theme_id TEXT NOT NULL,
  signature_version INTEGER NOT NULL DEFAULT 0,
  issued_at INTEGER NOT NULL,
  pdf_r2_key TEXT NOT NULL,
  png_r2_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  UNIQUE(student_uid, grand_line_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_student_uid
  ON certificates(student_uid, issued_at DESC);

CREATE INDEX IF NOT EXISTS idx_certificates_grand_line_id
  ON certificates(grand_line_id, rank ASC);

CREATE INDEX IF NOT EXISTS idx_certificates_serial
  ON certificates(serial);


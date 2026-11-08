CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'notes',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT 'General',
  chapter TEXT NOT NULL DEFAULT 'General',
  target TEXT NOT NULL DEFAULT 'General',
  class_level TEXT NOT NULL DEFAULT '11',
  board TEXT NOT NULL DEFAULT 'Federal',
  format TEXT NOT NULL DEFAULT 'text',
  tags_json TEXT NOT NULL DEFAULT '[]',
  files_json TEXT NOT NULL DEFAULT '[]',
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  anonymous_alias TEXT NOT NULL DEFAULT 'Anonymous Student',
  author_uid TEXT,
  real_author_uid TEXT,
  author_name TEXT NOT NULL DEFAULT 'Anonymous Student',
  author_avatar TEXT,
  author_frame TEXT,
  author_equipped_avatar TEXT,
  author_photo_url TEXT,
  author_role TEXT NOT NULL DEFAULT 'student',
  author_custom_role TEXT,
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

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(is_hidden, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON posts(is_hidden, is_pinned DESC, upvotes DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_subject ON posts(is_hidden, subject, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(is_hidden, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_class_board ON posts(is_hidden, class_level, board, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_uid ON posts(author_uid, is_anonymous, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_real_author_uid ON posts(real_author_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_uid)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);

CREATE TABLE IF NOT EXISTS post_saves (
  post_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_uid)
);

CREATE INDEX IF NOT EXISTS idx_post_saves_user ON post_saves(user_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_saves_post ON post_saves(post_id);

CREATE TABLE IF NOT EXISTS follows (
  follower_uid TEXT NOT NULL,
  following_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (follower_uid, following_uid)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  text TEXT NOT NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  author_uid TEXT,
  real_author_uid TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Student',
  author_avatar TEXT,
  author_frame TEXT,
  author_equipped_avatar TEXT,
  author_photo_url TEXT,
  author_role TEXT NOT NULL DEFAULT 'student',
  author_custom_role TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_uid ON post_comments(real_author_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS post_reports (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  reporter_uid TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON post_reports(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS post_media (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size INTEGER NOT NULL DEFAULT 0,
  url TEXT NOT NULL,
  download_url TEXT NOT NULL,
  uploaded_by_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_media_r2_key ON post_media(r2_key);
CREATE INDEX IF NOT EXISTS idx_post_media_uploader ON post_media(uploaded_by_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS user_roles (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student',
  custom_role TEXT,
  is_posting_banned INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bot_accounts (
  uid TEXT PRIMARY KEY,
  placeholder_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  class_level TEXT NOT NULL DEFAULT '11',
  board TEXT NOT NULL DEFAULT 'Federal',
  equipped_avatar TEXT NOT NULL DEFAULT 'pfp_luffy',
  enabled INTEGER NOT NULL DEFAULT 1,
  post_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  last_run_at INTEGER,
  last_status TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bot_accounts_subject ON bot_accounts(subject, enabled);
CREATE INDEX IF NOT EXISTS idx_bot_accounts_last_run ON bot_accounts(enabled, last_run_at ASC);

CREATE TABLE IF NOT EXISTS bot_key_status (
  key_index INTEGER PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'available',
  cooldown_until INTEGER,
  last_used_at INTEGER,
  calls_today INTEGER NOT NULL DEFAULT 0,
  calls_total INTEGER NOT NULL DEFAULT 0,
  quota_date TEXT NOT NULL DEFAULT '',
  last_error TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bot_system_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);


CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  author_id TEXT NOT NULL DEFAULT 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  author_email TEXT NOT NULL DEFAULT 'shsvirtualadmin@gmail.com',
  author_name TEXT NOT NULL DEFAULT 'SHS Virtual Academy',
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_welcome INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created ON announcements(is_pinned DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS user_welcome_status (
  user_uid TEXT PRIMARY KEY,
  welcomed INTEGER NOT NULL DEFAULT 1,
  read INTEGER NOT NULL DEFAULT 0,
  welcomed_at INTEGER NOT NULL,
  read_at INTEGER
);

CREATE TABLE IF NOT EXISTS user_read_announcements (
  user_uid TEXT NOT NULL,
  announcement_id TEXT NOT NULL,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (user_uid, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_read_announcements_user ON user_read_announcements(user_uid, read_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'following_post',
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  link TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  author_id TEXT,
  author_name TEXT,
  author_avatar TEXT,
  author_frame TEXT,
  post_id TEXT,
  post_type TEXT,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON notifications(post_id);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  bank_id TEXT NOT NULL DEFAULT 'legacy',
  subject TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'General Concepts',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'published',
  needs_review INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL DEFAULT '',
  source_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_bank_subj_topic_status ON questions(bank_id, subject, topic, status);
CREATE INDEX IF NOT EXISTS idx_questions_needs_review ON questions(needs_review);
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_bank_source_path ON questions(bank_id, source_path);

CREATE TABLE IF NOT EXISTS questions_import_log (
  id TEXT PRIMARY KEY,
  bank_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  total_read INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  needs_review_count INTEGER NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL DEFAULT 'firestore',
  imported_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_import_log_bank_time ON questions_import_log(bank_id, imported_at DESC);

-- =============================================================================
-- UNIVERSITY-BASED ADMIN MCQ BANK (D1 ONLY)
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
  university_slug TEXT NOT NULL DEFAULT '',
  import_batch_id TEXT NOT NULL DEFAULT '',
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
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_mcqs_university_id ON mcqs(university_id);
CREATE INDEX IF NOT EXISTS idx_mcqs_university_slug ON mcqs(university_slug);
CREATE INDEX IF NOT EXISTS idx_mcqs_import_batch_id ON mcqs(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_mcqs_subject ON mcqs(subject);
CREATE INDEX IF NOT EXISTS idx_mcqs_topic ON mcqs(topic);
CREATE INDEX IF NOT EXISTS idx_mcqs_uni_sub_top ON mcqs(university_id, subject, topic);

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

UPDATE posts SET created_at = created_at * 1000, updated_at = created_at * 1000 WHERE created_at > 0 AND created_at < 10000000000;
UPDATE posts SET created_at = 1743465600000, updated_at = 1743465600000 WHERE id LIKE 'commons_anon_topic_%' AND created_at > 1743465600000;

-- =============================================================================
-- GRAND LINE CERTIFICATES & ADMIN SIGNATURES (D1 + PRIVATE R2)
-- =============================================================================
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

-- =============================================================================
-- GUEST MODE, GLOBAL CASE-INSENSITIVE USERNAMES & SESSIONS (Migration 0006)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_usernames (
  username_lower TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  normalized_lookalike TEXT NOT NULL,
  uid TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'registered',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_usernames_lower ON user_usernames(username_lower);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_usernames_uid ON user_usernames(uid);
CREATE INDEX IF NOT EXISTS idx_user_usernames_lookalike ON user_usernames(normalized_lookalike);

CREATE TABLE IF NOT EXISTS guest_accounts (
  uid TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_lower TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  short_id TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'guest',
  is_guest INTEGER NOT NULL DEFAULT 1,
  email TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free',
  role TEXT NOT NULL DEFAULT 'student',
  upgraded_to_uid TEXT DEFAULT NULL,
  upgraded_at INTEGER DEFAULT NULL,
  target_university TEXT DEFAULT 'General Prep',
  tests_completed INTEGER NOT NULL DEFAULT 0,
  total_questions_solved INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  stats_json TEXT NOT NULL DEFAULT '{}',
  attempts_json TEXT NOT NULL DEFAULT '[]',
  ip_hash TEXT DEFAULT '',
  device_id_hash TEXT DEFAULT '',
  is_suspended INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_accounts_username_lower ON guest_accounts(username_lower);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_type_active ON guest_accounts(account_type, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_created ON guest_accounts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_ip_created ON guest_accounts(ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_device_created ON guest_accounts(device_id_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS guest_sessions (
  session_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  uid TEXT NOT NULL,
  ip_hash TEXT DEFAULT '',
  device_id_hash TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_sessions_token_hash ON guest_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_uid ON guest_sessions(uid, revoked, expires_at DESC);

CREATE TABLE IF NOT EXISTS guest_creation_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier_hash TEXT NOT NULL,
  identifier_type TEXT NOT NULL,
  uid TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guest_rate_limits_lookup
  ON guest_creation_rate_limits(identifier_hash, identifier_type, created_at DESC);

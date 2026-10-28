-- ============================================================================
-- BOARDLY COMMONS — CLOUDFLARE D1 (SQLite) SCHEMA
-- All post data, likes, saves, comments, reports, and user role cache live in D1.
-- Firebase is used strictly for (1) Authentication and (2) MCQ Question Bank.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. POSTS TABLE
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
  anonymous_alias TEXT DEFAULT 'Anonymous Student',
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

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(is_hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON posts(is_hidden, upvotes DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_subject ON posts(is_hidden, subject, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(is_hidden, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_class_board ON posts(is_hidden, class_level, board, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_uid ON posts(author_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_real_author_uid ON posts(real_author_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_reports ON posts(report_count DESC, is_hidden);

-- 2. POST LIKES / UPVOTES TABLE
CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_uid),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_uid, created_at DESC);

-- 3. POST SAVES / BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS post_saves (
  post_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_uid),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_saves_user ON post_saves(user_uid, created_at DESC);

-- 4. POST COMMENTS TABLE
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
  author_role TEXT DEFAULT 'student',
  author_custom_role TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON post_comments(real_author_uid);

-- 5. POST REPORTS TABLE
CREATE TABLE IF NOT EXISTS post_reports (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  reporter_uid TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reports_post ON post_reports(post_id);

-- 6. USER ROLES CACHE TABLE (Zero-Firestore Role Checks on Worker)
CREATE TABLE IF NOT EXISTS user_roles (
  uid TEXT PRIMARY KEY,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  custom_role TEXT,
  is_posting_banned INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

-- 7. EDGE RATE LIMITS TABLE
CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start INTEGER NOT NULL
);

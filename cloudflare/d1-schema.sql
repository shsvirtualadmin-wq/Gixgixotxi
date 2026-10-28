-- ============================================================================
-- BOARDLY COMMONS — CLOUDFLARE D1 (SQLite) SCHEMA
-- Database: boardly-posts-db (e37a41ff-c73c-4ab7-9784-6e635205cdf7)
-- Binding:  DB
-- ============================================================================

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

-- 2. POST COMMENTS TABLE
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
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(real_author_uid, created_at DESC);

-- 3. POST LIKES TABLE
CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_uid)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_user_uid ON post_likes(user_uid, created_at DESC);

-- 4. POST SAVES (BOOKMARKS) TABLE
CREATE TABLE IF NOT EXISTS post_saves (
  post_id TEXT NOT NULL,
  user_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_uid)
);

CREATE INDEX IF NOT EXISTS idx_post_saves_user_uid ON post_saves(user_uid, created_at DESC);

-- 5. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS follows (
  follower_uid TEXT NOT NULL,
  following_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (follower_uid, following_uid)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_uid, created_at DESC);

-- 6. POST REPORTS TABLE
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

-- 7. POST MEDIA REFERENCES TABLE
CREATE TABLE IF NOT EXISTS post_media (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  uploaded_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_media_uploaded_by ON post_media(uploaded_by, created_at DESC);

-- 8. USER ROLES CACHE TABLE
CREATE TABLE IF NOT EXISTS user_roles (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student',
  custom_role TEXT,
  is_posting_banned INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

-- 9. RATE LIMITS TABLE
CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start INTEGER NOT NULL
);

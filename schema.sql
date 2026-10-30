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

INSERT OR IGNORE INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at) VALUES
  ('bot_math_01', 'bot.math01@bots.boardly.cfd', 'bot', 'Mathematics Bot', 0, 1743465600000),
  ('bot_math_02', 'bot.math02@bots.boardly.cfd', 'bot', 'Mathematics Bot', 0, 1743465600000),
  ('bot_phys_01', 'bot.phys01@bots.boardly.cfd', 'bot', 'Physics Bot', 0, 1743465600000),
  ('bot_phys_02', 'bot.phys02@bots.boardly.cfd', 'bot', 'Physics Bot', 0, 1743465600000),
  ('bot_chem_01', 'bot.chem01@bots.boardly.cfd', 'bot', 'Chemistry Bot', 0, 1743465600000),
  ('bot_chem_02', 'bot.chem02@bots.boardly.cfd', 'bot', 'Chemistry Bot', 0, 1743465600000),
  ('bot_bio_01', 'bot.bio01@bots.boardly.cfd', 'bot', 'Biology Bot', 0, 1743465600000),
  ('bot_bio_02', 'bot.bio02@bots.boardly.cfd', 'bot', 'Biology Bot', 0, 1743465600000),
  ('bot_eng_01', 'bot.eng01@bots.boardly.cfd', 'bot', 'English Bot', 0, 1743465600000),
  ('bot_eng_02', 'bot.eng02@bots.boardly.cfd', 'bot', 'English Bot', 0, 1743465600000),
  ('bot_cs_01', 'bot.cs01@bots.boardly.cfd', 'bot', 'Computer Science Bot', 0, 1743465600000),
  ('bot_cs_02', 'bot.cs02@bots.boardly.cfd', 'bot', 'Computer Science Bot', 0, 1743465600000);

INSERT OR IGNORE INTO bot_accounts (uid, placeholder_name, display_name, subject, class_level, board, equipped_avatar, enabled, post_count, comment_count, like_count, last_run_at, last_status, updated_at) VALUES
  ('bot_math_01', 'bot_mathematics_alpha', 'Ayaan Khan', 'Mathematics', '11', 'Federal', 'pfp_luffy', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_math_02', 'bot_mathematics_beta', 'Zoya Ahmed', 'Mathematics', '12', 'Sindh', 'pfp_nami', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_phys_01', 'bot_physics_alpha', 'Hamza Tariq', 'Physics', '11', 'Federal', 'pfp_zoro', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_phys_02', 'bot_physics_beta', 'Fatima Noor', 'Physics', '12', 'Sindh', 'pfp_robin', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_chem_01', 'bot_chemistry_alpha', 'Bilal Siddiqui', 'Chemistry', '11', 'Federal', 'pfp_sanji', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_chem_02', 'bot_chemistry_beta', 'Maham Raza', 'Chemistry', '12', 'Sindh', 'pfp_vivi', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_bio_01', 'bot_biology_alpha', 'Saad Malik', 'Biology', '11', 'Federal', 'pfp_chopper', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_bio_02', 'bot_biology_beta', 'Hira Qureshi', 'Biology', '12', 'Sindh', 'pfp_perona', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_eng_01', 'bot_english_alpha', 'Danyal Shah', 'English', '11', 'Federal', 'pfp_usopp', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_eng_02', 'bot_english_beta', 'Areesha Baig', 'English', '12', 'Sindh', 'pfp_hancock', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_cs_01', 'bot_computer_science_alpha', 'Usman Farooq', 'Computer Science', '11', 'Federal', 'pfp_franky', 1, 0, 0, 0, NULL, 'Ready', 1743465600000),
  ('bot_cs_02', 'bot_computer_science_beta', 'Sana Javed', 'Computer Science', '12', 'Sindh', 'pfp_brook', 1, 0, 0, 0, NULL, 'Ready', 1743465600000);

INSERT OR IGNORE INTO announcements (id, title, message, author_id, author_email, author_name, is_pinned, is_welcome, created_at, updated_at) VALUES
  ('welcome_to_boardly', 'Welcome to Boardly', 'Welcome to Boardly! Practice entrance and board exam MCQs, share and download verified notes and past papers in Boardly Commons, track your daily study streaks, and climb the Grand Line leaderboard. Click this notification anytime to review what is new — we are glad to have you onboard!', 'A5YMRimdHRcmeDWutxtUGt2e4hf2', 'shsvirtualadmin@gmail.com', 'SHS Virtual Academy', 1, 1, 1743465600000, 1743465600000);

UPDATE posts SET created_at = created_at * 1000, updated_at = created_at * 1000 WHERE created_at > 0 AND created_at < 10000000000;
UPDATE posts SET created_at = 1743465600000, updated_at = 1743465600000 WHERE id LIKE 'commons_anon_topic_%' AND created_at > 1743465600000;

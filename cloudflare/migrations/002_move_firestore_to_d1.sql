-- ============================================================================
-- Migration: 002_move_firestore_to_d1.sql
-- Database: boardly-posts-db (Binding: DB)
-- Purpose: Move all remaining Firestore collections to Cloudflare D1.
-- Rules: Non-destructive only (CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS).
--        Reuses existing tables: posts, post_comments, post_likes, post_media,
--        post_saves, post_reports, questions, notifications, announcements,
--        user_welcome_status, user_read_announcements, follows, user_roles,
--        captain_tests, test_questions, test_attempts, attempt_answers,
--        crews, crew_members, bot_settings, rate_limits.
-- ============================================================================

-- 1. USERS (Core user profile, plan, streaks, stats, referrals, settings)
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT 'Student',
  display_name TEXT NOT NULL DEFAULT 'Student',
  nickname TEXT DEFAULT NULL,
  username TEXT DEFAULT NULL,
  short_id TEXT DEFAULT NULL,
  photo_url TEXT DEFAULT NULL,
  avatar TEXT DEFAULT NULL,
  avatar_key TEXT DEFAULT NULL,
  avatar_variant TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL,
  banner TEXT DEFAULT NULL,
  frame TEXT DEFAULT NULL,
  nameplate TEXT DEFAULT NULL,
  effect_id TEXT DEFAULT NULL,
  bio TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  accent TEXT NOT NULL DEFAULT '#E11D48',
  role TEXT NOT NULL DEFAULT 'student',
  custom_role TEXT DEFAULT NULL,
  has_chosen_role INTEGER NOT NULL DEFAULT 0,
  plan TEXT NOT NULL DEFAULT 'free',
  is_premium INTEGER NOT NULL DEFAULT 0,
  premium_source TEXT DEFAULT NULL,
  plan_expires_at INTEGER DEFAULT NULL,
  premium_expires_at INTEGER DEFAULT NULL,
  academic_track TEXT DEFAULT NULL,
  university TEXT DEFAULT NULL,
  target_university TEXT DEFAULT NULL,
  target_exam TEXT DEFAULT NULL,
  test_date TEXT DEFAULT NULL,
  class_level TEXT NOT NULL DEFAULT '12',
  board TEXT NOT NULL DEFAULT 'Federal',
  subjects_json TEXT NOT NULL DEFAULT '[]',
  equipped_json TEXT NOT NULL DEFAULT '{}',
  badges_json TEXT NOT NULL DEFAULT '[]',
  redeemed_badges_json TEXT NOT NULL DEFAULT '[]',
  equipped_badges_json TEXT NOT NULL DEFAULT '[]',
  pinned_badges_json TEXT NOT NULL DEFAULT '[]',
  pinned_stamps_json TEXT NOT NULL DEFAULT '[]',
  seen_questions_json TEXT NOT NULL DEFAULT '{}',
  kobans INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  streak_freeze_active INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT DEFAULT NULL,
  total_questions_solved INTEGER NOT NULL DEFAULT 0,
  mcqs_solved INTEGER NOT NULL DEFAULT 0,
  score REAL NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0,
  tests_completed INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  crew_id TEXT DEFAULT NULL,
  crew_name TEXT DEFAULT NULL,
  is_crew_member INTEGER NOT NULL DEFAULT 0,
  crew_status TEXT DEFAULT NULL,
  crew_referral_code TEXT DEFAULT NULL,
  referrer_ambassador_uid TEXT DEFAULT NULL,
  referrer_ambassador_id TEXT DEFAULT NULL,
  referrer_code TEXT DEFAULT NULL,
  ambassador_bonus_weeks INTEGER NOT NULL DEFAULT 0,
  welcomed INTEGER NOT NULL DEFAULT 0,
  welcomed_at INTEGER DEFAULT NULL,
  profile_completed INTEGER NOT NULL DEFAULT 0,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  profile_completed_at INTEGER DEFAULT NULL,
  onboarding_completed_at INTEGER DEFAULT NULL,
  is_posting_banned INTEGER NOT NULL DEFAULT 0,
  suspended INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_short_id ON users(short_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_score ON users(score DESC);
CREATE INDEX IF NOT EXISTS idx_users_crew_referral_code ON users(crew_referral_code);

-- 2. PUBLIC PROFILES (Sanitized public-facing profile for leaderboards & profile views)
CREATE TABLE IF NOT EXISTS public_profiles (
  uid TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Student',
  nickname TEXT DEFAULT NULL,
  username TEXT DEFAULT NULL,
  student_id TEXT NOT NULL DEFAULT '00000',
  short_id TEXT NOT NULL DEFAULT '00000',
  role TEXT NOT NULL DEFAULT 'student',
  custom_role TEXT DEFAULT NULL,
  bio TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  accent TEXT NOT NULL DEFAULT '#E11D48',
  avatar TEXT DEFAULT NULL,
  avatar_key TEXT DEFAULT NULL,
  avatar_variant TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL,
  photo_url TEXT DEFAULT NULL,
  banner TEXT DEFAULT NULL,
  frame TEXT DEFAULT NULL,
  nameplate TEXT DEFAULT NULL,
  effect_id TEXT DEFAULT NULL,
  equipped_json TEXT NOT NULL DEFAULT '{}',
  badges_json TEXT NOT NULL DEFAULT '[]',
  pinned_badges_json TEXT NOT NULL DEFAULT '[]',
  pinned_stamps_json TEXT NOT NULL DEFAULT '[]',
  crew_id TEXT DEFAULT NULL,
  crew_name TEXT DEFAULT NULL,
  rank_title TEXT DEFAULT NULL,
  streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  mcqs INTEGER NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0,
  score REAL NOT NULL DEFAULT 0,
  tests_completed INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  stats_json TEXT NOT NULL DEFAULT '{}',
  member_since INTEGER NOT NULL DEFAULT 0,
  last_active_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_public_profiles_username ON public_profiles(username);
CREATE INDEX IF NOT EXISTS idx_public_profiles_short_id ON public_profiles(short_id);
CREATE INDEX IF NOT EXISTS idx_public_profiles_score ON public_profiles(score DESC);
CREATE INDEX IF NOT EXISTS idx_public_profiles_streak ON public_profiles(streak DESC);

-- 3. USERNAMES (Unique username registry)
CREATE TABLE IF NOT EXISTS usernames (
  username TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_usernames_uid ON usernames(uid);

-- 4. WALLETS & SHOP ECONOMY (Kobans, unlocked items, ledger, store items, price history, coupons)
CREATE TABLE IF NOT EXISTS wallets (
  uid TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  owned_json TEXT NOT NULL DEFAULT '[]',
  equipped_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_unlocked_items (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL DEFAULT '',
  price_paid INTEGER NOT NULL DEFAULT 0,
  unlocked_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(uid, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_unlocked_items_uid ON user_unlocked_items(uid, unlocked_at DESC);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'purchase',
  amount INTEGER NOT NULL DEFAULT 0,
  balance_after INTEGER NOT NULL DEFAULT 0,
  item_id TEXT DEFAULT NULL,
  item_name TEXT DEFAULT NULL,
  month_key TEXT DEFAULT NULL,
  reason TEXT NOT NULL DEFAULT '',
  admin_email TEXT DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_uid_time ON wallet_ledger(uid, created_at DESC);

CREATE TABLE IF NOT EXISTS store_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'avatar',
  type TEXT NOT NULL DEFAULT 'static',
  price_kobans INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  rarity TEXT DEFAULT 'common',
  description TEXT DEFAULT '',
  preview_color TEXT DEFAULT NULL,
  updated_by TEXT DEFAULT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category, active);

CREATE TABLE IF NOT EXISTS store_price_history (
  id TEXT PRIMARY KEY,
  changed_by TEXT NOT NULL,
  filter_summary TEXT NOT NULL DEFAULT '',
  affected_count INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'single',
  changes_sample_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_store_price_history_time ON store_price_history(created_at DESC);

CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  reward_type TEXT NOT NULL DEFAULT 'kobans',
  reward_value INTEGER NOT NULL DEFAULT 0,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  uid TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'kobans',
  reward_value INTEGER NOT NULL DEFAULT 0,
  redeemed_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(code, uid)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_uid ON coupon_redemptions(uid, redeemed_at DESC);

-- 5. KOBAN REQUESTS & PAYMENT REQUESTS
CREATE TABLE IF NOT EXISTS koban_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL DEFAULT 0,
  pkr_amount INTEGER NOT NULL DEFAULT 0,
  granted_amount INTEGER DEFAULT NULL,
  transaction_id TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT DEFAULT NULL,
  approved_by TEXT DEFAULT NULL,
  approved_at INTEGER DEFAULT NULL,
  rejected_by TEXT DEFAULT NULL,
  rejected_at INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_koban_requests_status ON koban_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_koban_requests_user ON koban_requests(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'pro',
  crew_id TEXT DEFAULT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  duration_months INTEGER NOT NULL DEFAULT 1,
  method TEXT NOT NULL DEFAULT '',
  transaction_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT DEFAULT NULL,
  approved_by TEXT DEFAULT NULL,
  approved_at INTEGER DEFAULT NULL,
  reviewed_by TEXT DEFAULT NULL,
  reviewed_at INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON payment_requests(user_id, created_at DESC);

-- 6. PRACTICE ATTEMPTS, DAILY USAGE, CHAPTER STATS & STREAKS
CREATE TABLE IF NOT EXISTS practice_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Practice Session',
  mode TEXT NOT NULL DEFAULT 'practice',
  subject TEXT NOT NULL DEFAULT 'general',
  chapter TEXT DEFAULT NULL,
  weighted_chapter TEXT DEFAULT NULL,
  university TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  questions_json TEXT NOT NULL DEFAULT '[]',
  user_answers_json TEXT NOT NULL DEFAULT '{}',
  flagged_json TEXT NOT NULL DEFAULT '[]',
  score REAL NOT NULL DEFAULT 0,
  max_marks REAL NOT NULL DEFAULT 0,
  earned_marks REAL NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  unanswered INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 600,
  timed INTEGER NOT NULL DEFAULT 1,
  started_at INTEGER DEFAULT NULL,
  ends_at INTEGER DEFAULT NULL,
  submitted_at INTEGER DEFAULT NULL,
  regraded_at INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user ON practice_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_status ON practice_attempts(user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS user_daily_usage (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  date_key TEXT NOT NULL,
  tests_started INTEGER NOT NULL DEFAULT 0,
  practice_attempts INTEGER NOT NULL DEFAULT 0,
  questions_solved INTEGER NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  ai_tutor_tokens INTEGER NOT NULL DEFAULT 0,
  arena_sessions INTEGER NOT NULL DEFAULT 0,
  subjects_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(uid, date_key)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_usage_uid ON user_daily_usage(uid, date_key DESC);

CREATE TABLE IF NOT EXISTS user_chapter_stats (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  chapter_slug TEXT NOT NULL,
  subject_slug TEXT NOT NULL DEFAULT 'general',
  correct INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(uid, chapter_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_chapter_stats_uid ON user_chapter_stats(uid);

CREATE TABLE IF NOT EXISTS user_streaks (
  uid TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  today_active INTEGER NOT NULL DEFAULT 0,
  today_pending INTEGER NOT NULL DEFAULT 1,
  active_days_count INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  last_active_pkt TEXT DEFAULT NULL,
  freeze_active INTEGER NOT NULL DEFAULT 0,
  freeze_used INTEGER NOT NULL DEFAULT 0,
  freeze_date TEXT DEFAULT NULL,
  history28_json TEXT NOT NULL DEFAULT '[]',
  last7_days_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL DEFAULT 0
);

-- 7. REFERRALS, CAPTAINS & APPLICATIONS
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_code TEXT NOT NULL DEFAULT '',
  referrer_uid TEXT NOT NULL DEFAULT '',
  referrer_short_id TEXT DEFAULT NULL,
  referred_uid TEXT NOT NULL,
  referred_email TEXT NOT NULL DEFAULT '',
  referred_name TEXT NOT NULL DEFAULT 'Student',
  referred_short_id TEXT DEFAULT NULL,
  track TEXT NOT NULL DEFAULT 'General Entrance',
  status TEXT NOT NULL DEFAULT 'activated',
  activated INTEGER NOT NULL DEFAULT 1,
  bonus_awarded INTEGER NOT NULL DEFAULT 1,
  signed_up_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_uid ON referrals(referrer_uid, signed_up_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_code ON referrals(referrer_code);

CREATE TABLE IF NOT EXISTS captains (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Captain',
  email TEXT NOT NULL DEFAULT '',
  university TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  referral_code TEXT NOT NULL DEFAULT '',
  captain_code TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 100,
  activated_referrals INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'Bronze',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_captains_points ON captains(points DESC);

CREATE TABLE IF NOT EXISTS captain_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT DEFAULT NULL,
  university TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  semester TEXT DEFAULT NULL,
  cgpa TEXT DEFAULT NULL,
  motivation TEXT NOT NULL DEFAULT '',
  experience TEXT DEFAULT NULL,
  social_links TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT DEFAULT NULL,
  approved_by TEXT DEFAULT NULL,
  approved_at INTEGER DEFAULT NULL,
  reviewed_by TEXT DEFAULT NULL,
  reviewed_at INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_captain_applications_status ON captain_applications(status, created_at DESC);

CREATE TABLE IF NOT EXISTS crew_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL DEFAULT '',
  target_exam TEXT DEFAULT NULL,
  promotion_plan TEXT DEFAULT NULL,
  why_join TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT DEFAULT NULL,
  approved_by TEXT DEFAULT NULL,
  approved_at INTEGER DEFAULT NULL,
  reviewed_by TEXT DEFAULT NULL,
  reviewed_at INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_crew_applications_status ON crew_applications(status, created_at DESC);

-- 8. NAME REQUESTS, REVIEWS, QUESTION REPORTS, SUPPORT TICKETS, CONFIG, STUDY BUDDY, AUDIT LOG
CREATE TABLE IF NOT EXISTS name_requests (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  requested_name TEXT NOT NULL,
  current_display_name TEXT DEFAULT NULL,
  user_email TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT DEFAULT NULL,
  reviewed_at INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_name_requests_status ON name_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS student_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Student',
  user_email TEXT DEFAULT NULL,
  university TEXT DEFAULT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT DEFAULT NULL,
  approved_at INTEGER DEFAULT NULL,
  reviewed_by TEXT DEFAULT NULL,
  reviewed_at INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_student_reviews_status ON student_reviews(status, created_at DESC);

CREATE TABLE IF NOT EXISTS question_reports (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'other',
  comment TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL,
  user_email TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_by TEXT DEFAULT NULL,
  resolved_at INTEGER DEFAULT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_question_reports_status ON question_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  uid TEXT DEFAULT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);

CREATE TABLE IF NOT EXISTS app_config (
  config_key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT DEFAULT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS study_buddy_presence (
  id TEXT PRIMARY KEY,
  crew_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Student',
  short_id TEXT NOT NULL DEFAULT '00000',
  subject TEXT NOT NULL DEFAULT 'Mathematics',
  status TEXT NOT NULL DEFAULT 'studying',
  timer_minutes INTEGER NOT NULL DEFAULT 25,
  started_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_study_buddy_presence_crew ON study_buddy_presence(crew_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS study_buddy_logs (
  id TEXT PRIMARY KEY,
  crew_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Student',
  action TEXT NOT NULL DEFAULT '',
  subject TEXT DEFAULT NULL,
  minutes INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_study_buddy_logs_crew ON study_buddy_logs(crew_id, created_at DESC);

CREATE TABLE IF NOT EXISTS study_buddy_messages (
  id TEXT PRIMARY KEY,
  crew_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Student',
  short_id TEXT DEFAULT NULL,
  text TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_study_buddy_messages_crew ON study_buddy_messages(crew_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  actor_uid TEXT NOT NULL,
  actor_email TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  target_uid TEXT DEFAULT NULL,
  target_email TEXT DEFAULT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_time ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON admin_audit_log(actor_uid, created_at DESC);

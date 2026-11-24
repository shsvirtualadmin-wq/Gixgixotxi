-- Migration 0014: Role / Track system & seed pkig as Superadmin
-- Ensures user_roles table exists and seeds username `pkig` as `superadmin`.

CREATE TABLE IF NOT EXISTS user_roles (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student',
  custom_role TEXT,
  is_posting_banned INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0
);

-- Promote any existing account with username `pkig` into user_roles as superadmin
INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
SELECT
  uid,
  COALESCE(email, ''),
  'superadmin',
  'Superadmin',
  0,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
FROM user_usernames
WHERE LOWER(username_lower) = 'pkig'
ON CONFLICT(uid) DO UPDATE SET
  role = 'superadmin',
  custom_role = 'Superadmin',
  updated_at = excluded.updated_at;

-- Sync user_usernames.role for username `pkig`
UPDATE user_usernames
SET role = 'superadmin',
    custom_role = 'Superadmin',
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE LOWER(username_lower) = 'pkig';

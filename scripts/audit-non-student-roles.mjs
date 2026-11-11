#!/usr/bin/env node
/**
 * One-time Superadmin Audit Script:
 * Lists all users whose role is not "student" across local D1 / store snapshots,
 * keyed strictly by immutable uid.
 */
import fs from 'node:fs';
import path from 'node:path';

const SUPERADMIN_UID_ALLOWLIST = new Set([
  'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  'uid_superadmin_1',
  'uid_superadmin_2',
]);

const storePath = path.resolve(process.cwd(), 'data/cloudflare_d1_posts.json');
if (!fs.existsSync(storePath)) {
  console.error('Store file not found:', storePath);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const userRoles = Array.isArray(raw.userRoles) ? raw.userRoles : [];
const userUsernames = Array.isArray(raw.userUsernames) ? raw.userUsernames : [];

const byUid = new Map();

for (const r of userRoles) {
  const uid = String(r?.uid || '').trim();
  if (!uid) continue;
  const resolvedRole = SUPERADMIN_UID_ALLOWLIST.has(uid)
    ? 'superadmin'
    : String(r.role || 'student').toLowerCase();
  byUid.set(uid, {
    uid,
    email: r.email || '',
    username: '',
    displayName: '',
    role: resolvedRole,
    customRole: r.custom_role || null,
    inAllowlist: SUPERADMIN_UID_ALLOWLIST.has(uid),
  });
}

for (const u of userUsernames) {
  const uid = String(u?.uid || '').trim();
  if (!uid) continue;
  const existing = byUid.get(uid);
  const resolvedRole = SUPERADMIN_UID_ALLOWLIST.has(uid)
    ? 'superadmin'
    : existing?.role && existing.role !== 'student'
      ? existing.role
      : String(u.role || 'student').toLowerCase();
  byUid.set(uid, {
    uid,
    email: u.email || existing?.email || '',
    username: u.username_display || u.username_lower || existing?.username || '',
    displayName: u.display_name || existing?.displayName || '',
    role: resolvedRole,
    customRole: u.custom_role ?? existing?.customRole ?? null,
    inAllowlist: SUPERADMIN_UID_ALLOWLIST.has(uid),
  });
}

const nonStudents = Array.from(byUid.values()).filter((u) => u.role !== 'student');
const humanNonStudents = nonStudents.filter((u) => u.role !== 'bot');
const botNonStudents = nonStudents.filter((u) => u.role === 'bot');

console.log('=== Superadmin Audit: Non-Student Roles (by UID) ===');
console.log(`Human non-student accounts: ${humanNonStudents.length}`);
console.table(humanNonStudents);
console.log(`Automated bot accounts: ${botNonStudents.length}`);

/**
 * Boardly Rewards Server Endpoints (/api/rewards/*) — Cloudflare D1 Storage + Firestore Credit
 *
 * Implements:
 * - GET  /api/rewards/state
 * - POST /api/rewards/daily/claim
 * - POST /api/rewards/milestone/claim
 * - POST /api/rewards/referral/attach
 * - POST /api/rewards/referral/accept
 * - POST /api/rewards/admin/mode
 *
 * Architecture & Security Invariants:
 * - All Rewards state, settings, mode ("off" | "admin_only" | "everyone"), daily claims,
 *   milestone claims, referral codes, and referrals live in Cloudflare D1 (`env.DB`).
 * - Reuses the exact D1 user verification helper (`authenticateD1RewardsUser`) and Super Admin
 *   check used by the existing MCQ / D1 endpoints.
 * - MCQ counts are READ-ONLY (`SELECT` queries only on D1 `test_attempts` & `attempt_answers`).
 *   Zero writes are ever made to MCQ tables.
 * - Claim-First in D1, Credit-Second in Firestore:
 *   1. Insert/update D1 claim row with `credit_status = 'pending'` (enforcing UNIQUE / PRIMARY KEY).
 *   2. Credit Firestore (`wallets/{uid}`, `users/{uid}`, `wallets/{uid}/ledger/{deterministicId}`)
 *      in an idempotent transaction that does nothing if the ledger entry already exists.
 *   3. Update D1 `credit_status = 'credited'`.
 *   4. Any row left `'pending'` is automatically retried on `/api/rewards/state` or subsequent calls.
 */

import {
  DEFAULT_DAILY_LADDER,
  DEFAULT_MILESTONES,
  DEFAULT_REWARDS_CONFIG,
  computeDailyProgressState,
  computeMilestonesState,
  generateDeterministicReferralCode,
  getPktDateString,
  getPktMonthRangeMs,
  getPreviousPktDateString,
  isValidReferralCodeFormat,
  normalizeReferralCode,
  type ReferralRecordPublic,
  type ReferralStatus,
  type RewardsConfig,
  type RewardsMode,
  type RewardsStateResponse,
} from '../../../src/lib/rewardsEngine';
import {
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_FIRESTORE_DATABASE_ID,
  FIRESTORE_OAUTH_SCOPE,
  FIRESTORE_TOKEN_AUDIENCE,
  FirestoreRestAdapter,
  SERVER_TIMESTAMP_SENTINEL,
  authenticateD1RewardsUser,
  creditKobansIdempotentInFirestore,
  getSharedLocalD1Database,
  parseServiceAccountFromEnv,
  resolveTargetFirestoreDatabaseId,
  resolveTargetFirestoreProjectId,
  type AuthenticatedD1User,
  type FirestoreHealthCheckResult,
  type FirestoreStoreAdapter,
  type RewardsD1Database,
  type RewardsEnv,
  type VerifiedFirebaseToken,
} from '../../_utils/firestoreRestAdmin';

const MAX_COUNTED_MCQS_PER_ATTEMPT = 200;
const RATE_LIMIT_WINDOW_MS = 950;

// Isolate-level per-user rate limit tracker: key = `${uid}:${endpoint}` -> lastRequestMs
const userRateLimitMap = new Map<string, number>();

export function resetRateLimitsForTests(): void {
  userRateLimitMap.clear();
}

function checkRateLimit(uid: string, endpointKey: string, nowMs = Date.now()): boolean {
  const key = `${uid}:${endpointKey}`;
  const prev = userRateLimitMap.get(key) || 0;
  if (nowMs - prev < RATE_LIMIT_WINDOW_MS) {
    return false;
  }
  userRateLimitMap.set(key, nowMs);
  return true;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseTimestampMs(val: unknown): number | null {
  if (!val) return null;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof val === 'object' && val !== null) {
    const maybeSec =
      (val as { seconds?: number; _seconds?: number }).seconds ??
      (val as { _seconds?: number })._seconds;
    if (typeof maybeSec === 'number') return maybeSec * 1000;
  }
  return null;
}

function isFirestoreUserSuspended(userDoc: Record<string, any> | null): boolean {
  if (!userDoc) return false;
  return (
    userDoc.isBanned === true ||
    userDoc.isSuspended === true ||
    userDoc.suspended === true ||
    userDoc.status === 'suspended'
  );
}

function sanitizeDisplayName(
  userDoc: Record<string, any> | null,
  d1User?: Partial<AuthenticatedD1User> | null
): string {
  const raw =
    userDoc?.displayName ||
    userDoc?.name ||
    userDoc?.username ||
    d1User?.name ||
    'Boardly Student';
  const str = String(raw).trim();
  if (str.includes('@')) {
    return str.split('@')[0] || 'Boardly Student';
  }
  return str.slice(0, 48) || 'Boardly Student';
}

const DEFAULT_CONFIG_JSON = JSON.stringify({
  timezone: DEFAULT_REWARDS_CONFIG.timezone,
  resetOnMiss: DEFAULT_REWARDS_CONFIG.resetOnMiss,
  dailyLadder: DEFAULT_REWARDS_CONFIG.dailyLadder,
  milestones: DEFAULT_REWARDS_CONFIG.milestones,
  referral: DEFAULT_REWARDS_CONFIG.referral,
});

/**
 * Ensures all 5 D1 Rewards tables exist and seeds default `mode = 'off'` and `config` JSON
 * using `INSERT OR IGNORE` so existing Super Admin choices are never overwritten.
 */
export async function ensureRewardsD1Schema(db: RewardsD1Database): Promise<void> {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS reward_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reward_daily_claims (
      uid TEXT NOT NULL,
      pkt_date TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      credit_status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      PRIMARY KEY (uid, pkt_date)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reward_daily_claims_uid_created
      ON reward_daily_claims(uid, created_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reward_milestone_claims (
      uid TEXT NOT NULL,
      milestone_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      credit_status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      PRIMARY KEY (uid, milestone_id)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reward_milestone_claims_uid
      ON reward_milestone_claims(uid)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS referral_codes (
      uid TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_referral_codes_code
      ON referral_codes(code)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      inviter_uid TEXT NOT NULL,
      invitee_uid TEXT NOT NULL UNIQUE,
      inviter_code TEXT NOT NULL,
      invitee_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_confirmation',
      inviter_accepted INTEGER NOT NULL DEFAULT 0,
      invitee_accepted INTEGER NOT NULL DEFAULT 0,
      ip_hash TEXT NOT NULL DEFAULT '',
      flagged INTEGER NOT NULL DEFAULT 0,
      inviter_credit_status TEXT NOT NULL DEFAULT 'pending',
      invitee_credit_status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      confirmed_at INTEGER,
      paid_at INTEGER
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_referrals_inviter_uid
      ON referrals(inviter_uid, created_at DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_referrals_ip_hash_created
      ON referrals(ip_hash, created_at DESC)`),
    db
      .prepare(`INSERT OR IGNORE INTO reward_settings (key, value) VALUES (?1, ?2)`)
      .bind('mode', 'off'),
    db
      .prepare(`INSERT OR IGNORE INTO reward_settings (key, value) VALUES (?1, ?2)`)
      .bind('config', DEFAULT_CONFIG_JSON),
  ]);
}

/**
 * Reads `mode` and `config` from D1 `reward_settings`.
 */
export async function loadD1RewardsSettings(
  db: RewardsD1Database
): Promise<{ mode: RewardsMode; config: RewardsConfig }> {
  const { results } = await db
    .prepare('SELECT key, value FROM reward_settings')
    .all<{ key: string; value: string }>();

  let rawMode = 'off';
  let rawConfigObj: Record<string, any> = {};

  for (const row of results || []) {
    if (row.key === 'mode') {
      rawMode = String(row.value || 'off').trim();
    } else if (row.key === 'config') {
      try {
        rawConfigObj = JSON.parse(row.value || '{}');
      } catch {
        rawConfigObj = {};
      }
    }
  }

  const mode: RewardsMode =
    rawMode === 'everyone' || rawMode === 'admin_only' || rawMode === 'off' ? rawMode : 'off';

  const ladder =
    Array.isArray(rawConfigObj.dailyLadder) && rawConfigObj.dailyLadder.length === 30
      ? rawConfigObj.dailyLadder.map((n: unknown) => Math.max(0, Math.floor(Number(n) || 0)))
      : [...DEFAULT_DAILY_LADDER];

  const milestonesMap: Record<string, number> = {
    ...DEFAULT_REWARDS_CONFIG.milestones,
    ...(rawConfigObj.milestones && typeof rawConfigObj.milestones === 'object'
      ? rawConfigObj.milestones
      : {}),
  };

  const refRaw =
    rawConfigObj.referral && typeof rawConfigObj.referral === 'object'
      ? rawConfigObj.referral
      : {};

  const config: RewardsConfig = {
    enabled: mode !== 'off',
    mode,
    timezone: String(rawConfigObj.timezone || DEFAULT_REWARDS_CONFIG.timezone),
    dailyLadder: ladder,
    resetOnMiss: rawConfigObj.resetOnMiss === true,
    milestones: milestonesMap,
    referral: {
      inviterReward: Number(
        refRaw.inviterReward ?? DEFAULT_REWARDS_CONFIG.referral.inviterReward
      ),
      inviteeReward: Number(
        refRaw.inviteeReward ?? DEFAULT_REWARDS_CONFIG.referral.inviteeReward
      ),
      minInviteeMcqs: Number(
        refRaw.minInviteeMcqs ?? DEFAULT_REWARDS_CONFIG.referral.minInviteeMcqs
      ),
      maxPaidPerInviterPerMonth: Number(
        refRaw.maxPaidPerInviterPerMonth ??
          DEFAULT_REWARDS_CONFIG.referral.maxPaidPerInviterPerMonth
      ),
      pendingExpiryDays: Number(
        refRaw.pendingExpiryDays ?? DEFAULT_REWARDS_CONFIG.referral.pendingExpiryDays
      ),
      manualCodeWindowDays: Number(
        refRaw.manualCodeWindowDays ?? DEFAULT_REWARDS_CONFIG.referral.manualCodeWindowDays
      ),
    },
  };

  return { mode, config };
}

/**
 * Determines whether the current user is allowed to claim rewards under `mode` and `serverConfigured`.
 */
export function canUserClaimRewards(params: {
  serverConfigured: boolean;
  mode: RewardsMode;
  user: AuthenticatedD1User | null;
}): boolean {
  if (!params.serverConfigured || !params.user) return false;
  if (params.mode === 'off') return false;
  if (params.mode === 'admin_only') {
    return Boolean(params.user.isSuperAdmin || params.user.isAdminOrAbove);
  }
  if (params.mode === 'everyone') return true;
  return false;
}

/**
 * READ-ONLY D1 MCQ Count Query (`SELECT` only from `test_attempts` and `attempt_answers`).
 * Never writes to any MCQ table.
 */
export async function computeAuthoritativeMcqsFromD1(
  db: RewardsD1Database,
  uid: string,
  sinceMs = 0
): Promise<number> {
  try {
    const { results } = await db
      .prepare(
        `SELECT
           ta.id AS attempt_id,
           ta.total_questions AS total_questions,
           ta.created_at AS created_at,
           COUNT(CASE WHEN aa.selected_index >= 0 THEN 1 END) AS answered_rows,
           COUNT(aa.id) AS total_answer_rows
         FROM test_attempts ta
         LEFT JOIN attempt_answers aa ON aa.attempt_id = ta.id
         WHERE ta.user_uid = ?1 AND ta.created_at >= ?2
         GROUP BY ta.id`
      )
      .bind(uid, sinceMs)
      .all<{
        attempt_id: string;
        total_questions: number;
        created_at: number;
        answered_rows: number;
        total_answer_rows: number;
      }>();

    let total = 0;
    for (const row of results || []) {
      const totalQ = Math.max(0, Math.floor(Number(row.total_questions || 0)));
      const totalAnsRows = Math.max(0, Math.floor(Number(row.total_answer_rows || 0)));
      const answeredRows = Math.max(0, Math.floor(Number(row.answered_rows || 0)));

      let countForAttempt = totalAnsRows > 0 ? answeredRows : totalQ;
      if (totalQ > 0 && countForAttempt > totalQ) {
        countForAttempt = totalQ;
      }
      countForAttempt = Math.min(countForAttempt, MAX_COUNTED_MCQS_PER_ATTEMPT);
      total += countForAttempt;
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * Ensures the user has a permanent unique `BLD-XXXXXX` code in D1 `referral_codes`.
 */
export async function ensureD1UserReferralCode(
  db: RewardsD1Database,
  uid: string
): Promise<string> {
  const existing = await db
    .prepare('SELECT uid, code FROM referral_codes WHERE uid = ?1 LIMIT 1')
    .bind(uid)
    .first<{ uid: string; code: string }>();

  if (existing?.code && isValidReferralCodeFormat(existing.code)) {
    return existing.code;
  }

  for (let attempt = 0; attempt < 15; attempt++) {
    const candidate = generateDeterministicReferralCode(uid, attempt);
    try {
      await db
        .prepare('INSERT OR IGNORE INTO referral_codes (uid, code) VALUES (?1, ?2)')
        .bind(uid, candidate)
        .run();

      const verifyRow = await db
        .prepare('SELECT uid, code FROM referral_codes WHERE uid = ?1 LIMIT 1')
        .bind(uid)
        .first<{ uid: string; code: string }>();
      if (verifyRow?.code) {
        return verifyRow.code;
      }
    } catch {
      // Collision on code; try next salt
    }
  }

  const fallback = generateDeterministicReferralCode(`${uid}_${Date.now()}`, 0);
  await db
    .prepare('INSERT OR IGNORE INTO referral_codes (uid, code) VALUES (?1, ?2)')
    .bind(uid, fallback)
    .run();
  const finalRow = await db
    .prepare('SELECT uid, code FROM referral_codes WHERE uid = ?1 LIMIT 1')
    .bind(uid)
    .first<{ uid: string; code: string }>();
  return finalRow?.code || fallback;
}

/**
 * Computes the user's 30-day check-in progress from D1 `reward_daily_claims`.
 */
export async function computeD1DailyProgressForUser(
  db: RewardsD1Database,
  uid: string,
  config: RewardsConfig,
  nowMs: number
) {
  const { results } = await db
    .prepare(
      'SELECT pkt_date, day_number, amount, credit_status, created_at FROM reward_daily_claims WHERE uid = ?1 ORDER BY pkt_date DESC'
    )
    .bind(uid)
    .all<{
      pkt_date: string;
      day_number: number;
      amount: number;
      credit_status: string;
      created_at: number;
    }>();

  const rows = (results || []).filter((r) => r.credit_status === 'credited');
  const totalClaims = rows.length;
  const lastClaimPktDate = rows[0]?.pkt_date || null;

  let streakClaimsSinceReset = totalClaims;
  if (config.resetOnMiss && rows.length > 0) {
    let consecutive = 1;
    let cursorDate = rows[0].pkt_date;
    for (let i = 1; i < rows.length; i++) {
      const expectedPrev = getPreviousPktDateString(cursorDate);
      if (rows[i].pkt_date === expectedPrev) {
        consecutive++;
        cursorDate = rows[i].pkt_date;
      } else {
        break;
      }
    }
    streakClaimsSinceReset = consecutive;
  }

  return computeDailyProgressState({
    totalClaims,
    streakClaimsSinceReset,
    lastClaimPktDate,
    nowMs,
    config,
  });
}

/**
 * PHASE 3: Attempts to pay out a confirmed referral (`status = 'confirmed'`) using
 * claim-first in D1 (`inviter_credit_status` / `invitee_credit_status = 'pending'`)
 * and credit-second in Firestore (`wallets/{uid}/ledger/reward_ref_*_${referralId}`).
 */
async function tryProcessConfirmedReferralPayout(params: {
  db: RewardsD1Database;
  store: FirestoreStoreAdapter | null;
  refRow: Record<string, any>;
  config: RewardsConfig;
  nowMs: number;
}): Promise<{
  status: ReferralStatus;
  paidNow: boolean;
  inviterCreditedNow: boolean;
  inviteeCreditedNow: boolean;
  inviterBalanceBefore?: number;
  inviterBalanceAfter?: number;
  inviteeBalanceBefore?: number;
  inviteeBalanceAfter?: number;
  errorCode?: string;
  errorMessage?: string;
}> {
  const { db, store, refRow, config, nowMs } = params;
  const referralId = String(refRow.id);
  const inviterUid = String(refRow.inviter_uid);
  const inviteeUid = String(refRow.invitee_uid);
  const flagged = Number(refRow.flagged || 0) === 1;

  if (flagged || refRow.status === 'flagged') {
    return {
      status: 'flagged',
      paidNow: false,
      inviterCreditedNow: false,
      inviteeCreditedNow: false,
      errorCode: 'REFERRAL_FLAGGED',
      errorMessage: 'Referral is flagged for review and payout is held.',
    };
  }

  if (
    (refRow.status === 'paid' || refRow.status === 'completed') &&
    refRow.inviter_credit_status === 'credited' &&
    refRow.invitee_credit_status === 'credited'
  ) {
    return {
      status: 'completed',
      paidNow: false,
      inviterCreditedNow: false,
      inviteeCreditedNow: false,
    };
  }

  // Check invitee's D1 MCQ count since signup (or referral creation)
  let inviteeSignupMs = 0;
  try {
    const inviteeRoleRow = await db
      .prepare('SELECT created_at FROM user_roles WHERE uid = ?1 LIMIT 1')
      .bind(inviteeUid)
      .first<{ created_at?: number }>();
    inviteeSignupMs = Number(inviteeRoleRow?.created_at || 0);
  } catch {
    inviteeSignupMs = 0;
  }

  const inviteeMcqs = await computeAuthoritativeMcqsFromD1(db, inviteeUid, inviteeSignupMs);
  if (inviteeMcqs < config.referral.minInviteeMcqs) {
    return {
      status: 'confirmed',
      paidNow: false,
      inviterCreditedNow: false,
      inviteeCreditedNow: false,
    };
  }

  // Check monthly paid cap for inviter in current PKT calendar month
  const { startMs, endMs } = getPktMonthRangeMs(nowMs);
  const paidCountRow = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM referrals
       WHERE inviter_uid = ?1 AND status IN ('paid', 'completed') AND paid_at >= ?2 AND paid_at < ?3`
    )
    .bind(inviterUid, startMs, endMs)
    .first<{ cnt: number }>();

  const paidThisMonth = Number(paidCountRow?.cnt || 0);
  const alreadyPartiallyCredited =
    refRow.inviter_credit_status === 'credited' ||
    refRow.invitee_credit_status === 'credited' ||
    refRow.status === 'paid' ||
    refRow.status === 'completed';

  if (!alreadyPartiallyCredited && paidThisMonth >= config.referral.maxPaidPerInviterPerMonth) {
    // Excess referrals stay 'confirmed' and wait until next calendar month
    return {
      status: 'capped',
      paidNow: false,
      inviterCreditedNow: false,
      inviteeCreditedNow: false,
      errorCode: 'MONTHLY_CAP_REACHED',
      errorMessage: `Monthly cap of ${config.referral.maxPaidPerInviterPerMonth} paid referrals reached. This referral will pay out next month.`,
    };
  }

  if (!store) {
    return {
      status: 'confirmed',
      paidNow: false,
      inviterCreditedNow: false,
      inviteeCreditedNow: false,
      errorCode: 'SERVER_NOT_CONFIGURED',
      errorMessage: 'Firestore service account is not configured.',
    };
  }

  const inviterReward = Math.max(0, Math.floor(Number(config.referral.inviterReward) || 5000));
  const inviteeReward = Math.max(0, Math.floor(Number(config.referral.inviteeReward) || 1000));

  let inviterCreditedNow = false;
  let inviteeCreditedNow = false;
  let inviterStatus = String(refRow.inviter_credit_status || 'pending');
  let inviteeStatus = String(refRow.invitee_credit_status || 'pending');
  let inviterBalanceBefore: number | undefined;
  let inviterBalanceAfter: number | undefined;
  let inviteeBalanceBefore: number | undefined;
  let inviteeBalanceAfter: number | undefined;

  try {
    if (inviterStatus !== 'credited') {
      const inviterRes = await creditKobansIdempotentInFirestore({
        store,
        uid: inviterUid,
        ledgerId: `reward_ref_inviter_${referralId}`,
        type: 'reward_referral_inviter',
        amount: inviterReward,
        reason: `Referral Reward — Friend ${refRow.invitee_code} completed ${config.referral.minInviteeMcqs} MCQs`,
        extraLedgerFields: { referralId },
        notification: {
          id: `ref_paid_inviter_${referralId}`,
          title: `Referral Complete! +${inviterReward.toLocaleString()} Kobans`,
          message: `Your referred classmate completed ${config.referral.minInviteeMcqs} MCQs. +${inviterReward.toLocaleString()} Kobans have been credited to your wallet!`,
          link: '/rewards',
        },
      });
      if (inviterRes.credited) {
        await db
          .prepare('UPDATE referrals SET inviter_credit_status = ?1 WHERE id = ?2')
          .bind('credited', referralId)
          .run();
        inviterStatus = 'credited';
        inviterCreditedNow = !inviterRes.alreadyCredited;
        inviterBalanceBefore = inviterRes.balanceBefore;
        inviterBalanceAfter = inviterRes.balanceAfter;
      }
    }

    if (inviteeStatus !== 'credited') {
      const inviteeRes = await creditKobansIdempotentInFirestore({
        store,
        uid: inviteeUid,
        ledgerId: `reward_ref_invitee_${referralId}`,
        type: 'reward_referral_invitee',
        amount: inviteeReward,
        reason: `Referral Bonus — Joined with code ${refRow.inviter_code}`,
        extraLedgerFields: { referralId },
        notification: {
          id: `ref_paid_invitee_${referralId}`,
          title: `Referral Bonus! +${inviteeReward.toLocaleString()} Kobans`,
          message: `You completed ${config.referral.minInviteeMcqs} MCQs and unlocked your +${inviteeReward.toLocaleString()} Kobans referral bonus!`,
          link: '/rewards',
        },
      });
      if (inviteeRes.credited) {
        await db
          .prepare('UPDATE referrals SET invitee_credit_status = ?1 WHERE id = ?2')
          .bind('credited', referralId)
          .run();
        inviteeStatus = 'credited';
        inviteeCreditedNow = !inviteeRes.alreadyCredited;
        inviteeBalanceBefore = inviteeRes.balanceBefore;
        inviteeBalanceAfter = inviteeRes.balanceAfter;
      }
    }
  } catch (creditErr: any) {
    console.error(
      `[Rewards Referral Payout Firestore Error] referralId=${referralId}:`,
      creditErr?.message || creditErr
    );
    return {
      status: 'confirmed',
      paidNow: false,
      inviterCreditedNow,
      inviteeCreditedNow,
      errorCode: 'SERVER_NOT_READY',
      errorMessage: 'Rewards are being set up',
    };
  }

  if (inviterStatus === 'credited' && inviteeStatus === 'credited') {
    const paidAt = Number(refRow.paid_at || nowMs);
    await db
      .prepare('UPDATE referrals SET status = ?1, paid_at = ?2 WHERE id = ?3')
      .bind('paid', paidAt, referralId)
      .run();
    return {
      status: 'completed',
      paidNow: inviterCreditedNow || inviteeCreditedNow,
      inviterCreditedNow,
      inviteeCreditedNow,
      inviterBalanceBefore,
      inviterBalanceAfter,
      inviteeBalanceBefore,
      inviteeBalanceAfter,
    };
  }

  return {
    status: 'confirmed',
    paidNow: false,
    inviterCreditedNow,
    inviteeCreditedNow,
    inviterBalanceBefore,
    inviterBalanceAfter,
    inviteeBalanceBefore,
    inviteeBalanceAfter,
  };
}

/**
 * PHASE 3: Automatically retries any D1 claim rows for `uid` where `credit_status = 'pending'`.
 * Guarantees that a transient Firestore failure can never lose a reward or double-pay.
 */
export async function retryPendingFirestoreCredits(params: {
  db: RewardsD1Database;
  store: FirestoreStoreAdapter | null;
  uid: string;
  onFirestoreError?: (err: unknown) => void;
}): Promise<number> {
  const { db, store, uid, onFirestoreError } = params;
  if (!store) return 0;

  let newlyCreditedAmount = 0;

  // 1. Retry pending daily claims
  const { results: pendingDaily } = await db
    .prepare(
      "SELECT pkt_date, day_number, amount, credit_status FROM reward_daily_claims WHERE uid = ?1 AND credit_status = 'pending'"
    )
    .bind(uid)
    .all<{ pkt_date: string; day_number: number; amount: number; credit_status: string }>();

  for (const row of pendingDaily || []) {
    try {
      const ledgerId = `reward_daily_${uid}_${row.pkt_date}`;
      const res = await creditKobansIdempotentInFirestore({
        store,
        uid,
        ledgerId,
        type: 'reward_daily',
        amount: row.amount,
        reason: `Daily Check-in — Day ${row.day_number} (${row.pkt_date})`,
        extraLedgerFields: {
          dayNumber: row.day_number,
          pktDate: row.pkt_date,
        },
        notification: {
          id: `daily_${uid}_${row.pkt_date}`,
          title: `Day ${row.day_number} Check-in Reward Claimed!`,
          message: `+${row.amount.toLocaleString()} Kobans added to your wallet for your Day ${row.day_number} check-in.`,
          link: '/rewards',
        },
      });
      if (res.credited) {
        await db
          .prepare(
            'UPDATE reward_daily_claims SET credit_status = ?1 WHERE uid = ?2 AND pkt_date = ?3'
          )
          .bind('credited', uid, row.pkt_date)
          .run();
        if (!res.alreadyCredited) {
          newlyCreditedAmount += row.amount;
        }
      }
    } catch (err: any) {
      console.error(
        `[Rewards Retry Daily Credit Error] uid=${uid} pkt_date=${row.pkt_date}:`,
        err?.message || err
      );
      onFirestoreError?.(err);
    }
  }

  // 2. Retry pending milestone claims
  const { results: pendingMilestones } = await db
    .prepare(
      "SELECT milestone_id, amount, credit_status FROM reward_milestone_claims WHERE uid = ?1 AND credit_status = 'pending'"
    )
    .bind(uid)
    .all<{ milestone_id: string; amount: number; credit_status: string }>();

  for (const row of pendingMilestones || []) {
    try {
      const ledgerId = `reward_milestone_${uid}_${row.milestone_id}`;
      const def = DEFAULT_MILESTONES.find((m) => m.id === row.milestone_id);
      const res = await creditKobansIdempotentInFirestore({
        store,
        uid,
        ledgerId,
        type: 'reward_milestone',
        amount: row.amount,
        reason: `MCQ Milestone Reward — ${def?.title || row.milestone_id}`,
        extraLedgerFields: {
          milestoneId: row.milestone_id,
          threshold: def?.threshold ?? 0,
        },
        notification: {
          id: `milestone_${uid}_${row.milestone_id}`,
          title: `${def?.title || 'Milestone'} Unlocked!`,
          message: `+${row.amount.toLocaleString()} Kobans added to your wallet!`,
          link: '/rewards',
        },
      });
      if (res.credited) {
        await db
          .prepare(
            'UPDATE reward_milestone_claims SET credit_status = ?1 WHERE uid = ?2 AND milestone_id = ?3'
          )
          .bind('credited', uid, row.milestone_id)
          .run();
        if (!res.alreadyCredited) {
          newlyCreditedAmount += row.amount;
        }
      }
    } catch (err: any) {
      console.error(
        `[Rewards Retry Milestone Credit Error] uid=${uid} milestone=${row.milestone_id}:`,
        err?.message || err
      );
      onFirestoreError?.(err);
    }
  }

  return newlyCreditedAmount;
}

// ─── Core Request Router ──────────────────────────────────────────────────────

export interface HandleRewardsRequestOptions {
  request: Request;
  env?: RewardsEnv;
  dbOverride?: RewardsD1Database;
  storeOverride?: FirestoreStoreAdapter | null;
  tokenVerifierOverride?: (
    authHeader: string | null | undefined
  ) => Promise<VerifiedFirebaseToken | null>;
  nowMsOverride?: number;
  bypassRateLimit?: boolean;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function handleRewardsApiRequest(
  opts: HandleRewardsRequestOptions
): Promise<Response> {
  const { request, env } = opts;
  const nowMs = opts.nowMsOverride ?? Date.now();

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    return await handleRewardsApiRequestInner(opts, request, env, nowMs);
  } catch (unhandledErr: any) {
    console.error('[Rewards Worker Unhandled Error]:', unhandledErr?.message || unhandledErr);
    return jsonResponse(
      {
        ok: false,
        error: unhandledErr?.message || 'Internal server error in Rewards Worker.',
        code: 'INTERNAL_ERROR',
      },
      500
    );
  }
}

async function handleRewardsApiRequestInner(
  opts: HandleRewardsRequestOptions,
  request: Request,
  env: RewardsEnv | undefined,
  nowMs: number
): Promise<Response> {
  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/rewards\/?/, '').replace(/\/+$/, '');

  // 1. Resolve D1 Database (Cloudflare env.DB in production, or shared local D1 adapter in Vite dev)
  const db: RewardsD1Database = opts.dbOverride || env?.DB || getSharedLocalD1Database();
  await ensureRewardsD1Schema(db);

  // 2. Resolve Firestore Store for Koban Wallet/Ledger Credits (only needed for crediting Kobans)
  const parsedSa = parseServiceAccountFromEnv(env);
  const targetProjectId = resolveTargetFirestoreProjectId(
    env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
  );
  const targetDatabaseId = resolveTargetFirestoreDatabaseId(
    env?.FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
      DEFAULT_FIRESTORE_DATABASE_ID
  );

  let store: FirestoreStoreAdapter | null =
    opts.storeOverride !== undefined ? opts.storeOverride : null;
  if (opts.storeOverride === undefined && parsedSa) {
    store = new FirestoreRestAdapter(parsedSa, targetProjectId, targetDatabaseId);
  }
  const serverConfigured = Boolean(store);

  // 3. Load D1 `reward_settings` (`mode` and `config`)
  const { mode, config } = await loadD1RewardsSettings(db);

  // 4. Verify Signed-In User using the D1 Auth + `user_roles` helper
  const authHeader = request.headers.get('Authorization');
  const d1User = await authenticateD1RewardsUser({
    request,
    env,
    db,
    tokenVerifierOverride: opts.tokenVerifierOverride,
  });

  // Public unauthenticated `GET /api/rewards/state` returns schedule + current mode
  if (subPath === 'state' && request.method === 'GET' && !authHeader) {
    const daily = computeDailyProgressState({
      totalClaims: 0,
      lastClaimPktDate: null,
      nowMs,
      config,
    });
    const milestones = computeMilestonesState({
      mcqsAnswered: 0,
      claimedIds: {},
      config,
    });
    const stateResp: RewardsStateResponse = {
      state: !serverConfigured ? 'server_not_ready' : mode === 'everyone' ? 'ready' : 'disabled',
      statusMessage: !serverConfigured ? 'Rewards are being set up' : undefined,
      serverConfigured,
      mode,
      canClaim: false,
      enabled: mode === 'everyone' && serverConfigured,
      comingSoon: mode !== 'everyone' || !serverConfigured,
      timezone: config.timezone,
      balance: 0,
      daily,
      dailyLadder: config.dailyLadder,
      mcqsAnswered: 0,
      milestones,
      dragonMilestone: {
        threshold: 1000,
        unlocked: false,
        progress: 0,
      },
      referral: {
        myCode: 'BLD-7K9M2P',
        shareUrl: 'https://boardly.cfd/join/BLD-7K9M2P',
        canAttachManualCode: false,
        alreadyAttachedInviter: false,
        paidCountThisMonth: 0,
        maxPaidPerMonth: config.referral.maxPaidPerInviterPerMonth,
        config: config.referral,
        items: [],
      },
    };
    return jsonResponse(stateResp, 200);
  }

  if (!d1User) {
    return jsonResponse(
      { ok: false, error: 'Authentication required. Please sign in.', code: 'UNAUTHENTICATED' },
      401
    );
  }

  const uid = d1User.uid;

  // ─── ENDPOINT 7: GET /api/rewards/health (Super Admin Only, Part A5) ───────
  if (subPath === 'health' && request.method === 'GET') {
    if (!d1User.isSuperAdmin) {
      return jsonResponse(
        {
          ok: false,
          error: 'Forbidden: Only Super Admins can view Rewards health.',
          code: 'FORBIDDEN',
        },
        403
      );
    }

    const restUrlPattern = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      targetProjectId
    )}/databases/${encodeURIComponent(targetDatabaseId)}/documents:beginTransaction`;

    if (!store) {
      const missingRes: FirestoreHealthCheckResult & { mode: RewardsMode } = {
        ok: false,
        reason: 'missing_firebase_service_account',
        httpStatus: 503,
        targetProjectId,
        targetDatabaseId,
        serviceAccountProjectId: null,
        serviceAccountClientEmail: null,
        projectMismatch: false,
        restUrlPattern,
        oauthScope: FIRESTORE_OAUTH_SCOPE,
        tokenAudience: FIRESTORE_TOKEN_AUDIENCE,
        mode,
      };
      return jsonResponse(missingRes, 200);
    }

    if (typeof store.checkHealth === 'function') {
      const health = await store.checkHealth(4000);
      return jsonResponse({ ...health, mode }, 200);
    }

    // Fallback health probe for in-memory/mock store adapters
    try {
      await store.runTransaction(async (tx) => {
        await tx.getDoc('settings/rewards');
      });
      return jsonResponse(
        {
          ok: true,
          reason: 'ok',
          httpStatus: 200,
          targetProjectId,
          targetDatabaseId,
          serviceAccountProjectId: parsedSa?.project_id || targetProjectId,
          serviceAccountClientEmail: parsedSa?.client_email || 'mock-service-account@local',
          projectMismatch: false,
          restUrlPattern,
          oauthScope: FIRESTORE_OAUTH_SCOPE,
          tokenAudience: FIRESTORE_TOKEN_AUDIENCE,
          mode,
        },
        200
      );
    } catch (err: any) {
      console.error('[Rewards Health Probe Error]:', err?.message || err);
      return jsonResponse(
        {
          ok: false,
          reason: 'permission_denied_or_transaction_failed',
          httpStatus: err?.status || 503,
          targetProjectId,
          targetDatabaseId,
          serviceAccountProjectId: parsedSa?.project_id || targetProjectId,
          serviceAccountClientEmail: parsedSa?.client_email || null,
          projectMismatch: Boolean(parsedSa?.project_id && parsedSa.project_id !== targetProjectId),
          restUrlPattern,
          oauthScope: FIRESTORE_OAUTH_SCOPE,
          tokenAudience: FIRESTORE_TOKEN_AUDIENCE,
          mode,
        },
        200
      );
    }
  }

  // ─── ENDPOINT 6: GET / POST / PUT / PATCH /api/rewards/admin/mode (Super Admin Only) ───
  if (subPath === 'admin/mode') {
    if (!d1User.isSuperAdmin && !d1User.isAdminOrAbove) {
      return jsonResponse(
        {
          ok: false,
          error: 'Forbidden: Only Super Admins can manage the Rewards mode.',
          code: 'FORBIDDEN',
        },
        403
      );
    }

    if (request.method === 'GET') {
      const latest = await loadD1RewardsSettings(db);
      return jsonResponse(
        {
          ok: true,
          mode: latest.mode,
        },
        200
      );
    }

    if (request.method !== 'POST' && request.method !== 'PUT' && request.method !== 'PATCH') {
      return jsonResponse(
        { ok: false, error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' },
        405
      );
    }

    if (!d1User.isSuperAdmin) {
      return jsonResponse(
        {
          ok: false,
          error: 'Forbidden: Only Super Admins can change the Rewards mode.',
          code: 'FORBIDDEN',
        },
        403
      );
    }

    let adminBody: Record<string, any> = {};
    try {
      const rawText = await request.text();
      adminBody = rawText ? JSON.parse(rawText) : {};
    } catch {
      return jsonResponse(
        { ok: false, error: 'Invalid JSON request body.', code: 'INVALID_JSON' },
        400
      );
    }

    const nextMode = String(adminBody.mode || '').trim() as RewardsMode;
    if (nextMode !== 'off' && nextMode !== 'admin_only' && nextMode !== 'everyone') {
      return jsonResponse(
        {
          ok: false,
          error: 'Invalid mode. Must be "off", "admin_only", or "everyone".',
          code: 'INVALID_MODE',
        },
        400
      );
    }

    const auditEntry = {
      action: 'REWARDS_MODE_CHANGE',
      previousMode: mode,
      newMode: nextMode,
      adminUid: uid,
      adminEmail: d1User.email || 'superadmin',
      timestampMs: nowMs,
    };

    try {
      // Write `mode` to D1 `reward_settings` using INSERT OR REPLACE so it works whether key exists or not
      await db
        .prepare('INSERT OR REPLACE INTO reward_settings (key, value) VALUES (?1, ?2)')
        .bind('mode', nextMode)
        .run();

      // Record audit entry in D1 `reward_settings` using INSERT OR REPLACE so repeated mode changes never violate PRIMARY KEY
      await db
        .prepare('INSERT OR REPLACE INTO reward_settings (key, value) VALUES (?1, ?2)')
        .bind('last_mode_audit', JSON.stringify(auditEntry))
        .run();
    } catch (d1Err: any) {
      console.error('[Rewards Admin Mode D1 Write Error]:', d1Err?.message || d1Err);
      return jsonResponse(
        {
          ok: false,
          error: `D1 write failed: ${d1Err?.message || 'Could not update reward_settings'}`,
          code: 'D1_WRITE_FAILED',
        },
        500
      );
    }

    if (store) {
      await store
        .setDoc(`admin_audit_logs/rewards_mode_${nowMs}_${uid.slice(0, 8)}`, {
          id: `rewards_mode_${nowMs}_${uid.slice(0, 8)}`,
          action: 'REWARDS_MODE_CHANGE',
          adminUid: uid,
          adminEmail: d1User.email || 'superadmin',
          targetUid: 'reward_settings:mode',
          targetEmail: `${mode} -> ${nextMode}`,
          details: `Changed Boardly Rewards mode from "${mode}" to "${nextMode}"`,
          timestamp: SERVER_TIMESTAMP_SENTINEL,
        })
        .catch(() => null);
    }

    // Re-read from D1 to confirm stored value
    const verified = await loadD1RewardsSettings(db);

    return jsonResponse(
      {
        ok: true,
        previousMode: mode,
        mode: verified.mode,
        audit: auditEntry,
      },
      200
    );
  }

  // 6. Reject suspended users (checked in D1 `user_roles.is_posting_banned` and Firestore `users/{uid}`)
  let firestoreErrorOccurred = false;
  let userDoc: Record<string, any> | null = null;
  if (store) {
    try {
      userDoc = await store.getDoc(`users/${uid}`);
    } catch (err: any) {
      console.error(`[Rewards Firestore userDoc Error] uid=${uid}:`, err?.message || err);
      firestoreErrorOccurred = true;
    }
  }

  if (d1User.isPostingBanned || isFirestoreUserSuspended(userDoc)) {
    return jsonResponse(
      {
        ok: false,
        error: 'Your account is suspended and cannot access Boardly Rewards.',
        code: 'USER_SUSPENDED',
      },
      403
    );
  }

  // ─── ENDPOINT 1: GET /api/rewards/state ────────────────────────────────────
  if (subPath === 'state' && request.method === 'GET') {
    // Phase 3: Retry any pending Firestore credits for this user first
    await retryPendingFirestoreCredits({
      db,
      store,
      uid,
      onFirestoreError: () => {
        firestoreErrorOccurred = true;
      },
    });

    const [myCode, daily, mcqsAnswered, milestoneRowsRes, referralRowsRes, walletDoc] =
      await Promise.all([
        ensureD1UserReferralCode(db, uid),
        computeD1DailyProgressForUser(db, uid, config, nowMs),
        computeAuthoritativeMcqsFromD1(db, uid, 0),
        db
          .prepare(
            'SELECT milestone_id, amount, credit_status, created_at FROM reward_milestone_claims WHERE uid = ?1'
          )
          .bind(uid)
          .all<{
            milestone_id: string;
            amount: number;
            credit_status: string;
            created_at: number;
          }>(),
        db
          .prepare(
            'SELECT * FROM referrals WHERE inviter_uid = ?1 OR invitee_uid = ?2 ORDER BY created_at DESC'
          )
          .bind(uid, uid)
          .all<Record<string, any>>(),
        store
          ? store.getDoc(`wallets/${uid}`).catch((err: any) => {
              console.error(`[Rewards Firestore walletDoc Error] uid=${uid}:`, err?.message || err);
              firestoreErrorOccurred = true;
              return null;
            })
          : Promise.resolve(null),
      ]);

    const claimedIds: Record<string, number> = {};
    const milestoneCreditStatus: Record<string, 'pending' | 'credited'> = {};
    for (const mc of milestoneRowsRes.results || []) {
      if (mc.milestone_id) {
        const isCredited = mc.credit_status === 'credited';
        if (isCredited) {
          claimedIds[String(mc.milestone_id)] = Number(mc.created_at || nowMs);
        }
        milestoneCreditStatus[String(mc.milestone_id)] = isCredited ? 'credited' : 'pending';
      }
    }

    const milestones = computeMilestonesState({
      mcqsAnswered,
      claimedIds,
      config,
    }).map((m) => ({
      ...m,
      creditStatus: milestoneCreditStatus[m.id] ?? null,
    }));

    // Count inviter's paid referrals in current PKT calendar month
    const { startMs, endMs } = getPktMonthRangeMs(nowMs);
    const paidCountRow = await db
      .prepare(
        `SELECT COUNT(*) AS cnt FROM referrals
         WHERE inviter_uid = ?1 AND status IN ('paid', 'completed') AND paid_at >= ?2 AND paid_at < ?3`
      )
      .bind(uid, startMs, endMs)
      .first<{ cnt: number }>();
    let paidCountThisMonth = Number(paidCountRow?.cnt || 0);

    // Build referral items (display name and code only, NEVER emails!)
    const referralItems: ReferralRecordPublic[] = [];
    let alreadyAttachedInviter = false;
    let newlyPaidReferralDelta = 0;

    for (const refRow of referralRowsRes.results || []) {
      const refId = String(refRow.id);
      const isInviter = refRow.inviter_uid === uid;
      if (!isInviter) {
        alreadyAttachedInviter = true;
      }

      const counterpartUid = isInviter
        ? String(refRow.invitee_uid)
        : String(refRow.inviter_uid);
      const counterpartCode = isInviter
        ? String(refRow.invitee_code || '')
        : String(refRow.inviter_code || '');

      let rawStatus = String(refRow.status || 'pending_confirmation') as ReferralStatus;
      const createdAtMs = Number(refRow.created_at || nowMs);
      const expiresAtMs =
        createdAtMs + config.referral.pendingExpiryDays * 24 * 60 * 60 * 1000;

      // Expire pending referrals after 14 days
      if (rawStatus === 'pending_confirmation' && nowMs > expiresAtMs) {
        rawStatus = 'expired';
        await db
          .prepare('UPDATE referrals SET status = ?1 WHERE id = ?2')
          .bind('expired', refId)
          .run();
      }

      // Compute invitee's D1 MCQ count since signup
      let inviteeSignupMs = 0;
      try {
        const inviteeRoleRow = await db
          .prepare('SELECT created_at FROM user_roles WHERE uid = ?1 LIMIT 1')
          .bind(String(refRow.invitee_uid))
          .first<{ created_at?: number }>();
        inviteeSignupMs = Number(inviteeRoleRow?.created_at || 0);
      } catch {
        inviteeSignupMs = 0;
      }

      const inviteeMcqs = await computeAuthoritativeMcqsFromD1(
        db,
        String(refRow.invitee_uid),
        inviteeSignupMs
      );

      // If status is 'confirmed' (or partially credited) and claims are allowed, try payout
      const allowReferralPayout = canUserClaimRewards({
        serverConfigured: serverConfigured && !firestoreErrorOccurred,
        mode,
        user: d1User,
      });
      if (
        allowReferralPayout &&
        (rawStatus === 'confirmed' ||
          rawStatus === 'confirmed_waiting_mcqs' ||
          ((rawStatus === 'paid' || rawStatus === 'completed') &&
            (refRow.inviter_credit_status !== 'credited' ||
              refRow.invitee_credit_status !== 'credited'))) &&
        inviteeMcqs >= config.referral.minInviteeMcqs
      ) {
        const payoutRes = await tryProcessConfirmedReferralPayout({
          db,
          store,
          refRow: { ...refRow, status: rawStatus },
          config,
          nowMs,
        });
        if (payoutRes.errorCode === 'SERVER_NOT_READY') {
          firestoreErrorOccurred = true;
        }
        rawStatus = payoutRes.status;
        if (payoutRes.paidNow) {
          if (isInviter && payoutRes.inviterCreditedNow) {
            paidCountThisMonth += 1;
            newlyPaidReferralDelta += config.referral.inviterReward;
          } else if (!isInviter && payoutRes.inviteeCreditedNow) {
            newlyPaidReferralDelta += config.referral.inviteeReward;
          }
        }
      }

      const displayStatus: ReferralStatus =
        rawStatus === 'paid' ? 'completed' : rawStatus;

      // Resolve counterpart display name safely (never exposing email)
      let counterpartName = `Student (${counterpartCode})`;
      if (store && !firestoreErrorOccurred) {
        const cpDoc = await store.getDoc(`users/${counterpartUid}`).catch((err: any) => {
          console.error(`[Rewards Firestore cpDoc Error]:`, err?.message || err);
          firestoreErrorOccurred = true;
          return null;
        });
        if (cpDoc) {
          counterpartName = sanitizeDisplayName(cpDoc, null);
        }
      }

      referralItems.push({
        id: refId,
        role: isInviter ? 'inviter' : 'invitee',
        counterpartDisplayName: counterpartName,
        counterpartCode,
        status: displayStatus,
        inviterAccepted: Number(refRow.inviter_accepted || 0) === 1,
        inviteeAccepted: Number(refRow.invitee_accepted || 0) === 1,
        inviteeMcqsAnswered: Math.min(inviteeMcqs, config.referral.minInviteeMcqs),
        minInviteeMcqs: config.referral.minInviteeMcqs,
        inviterReward: config.referral.inviterReward,
        inviteeReward: config.referral.inviteeReward,
        createdAtMs,
        expiresAtMs,
        confirmedAtMs: refRow.confirmed_at ? Number(refRow.confirmed_at) : null,
        completedAtMs: refRow.paid_at ? Number(refRow.paid_at) : null,
      });
    }

    const effectiveServerReady = serverConfigured && !firestoreErrorOccurred;
    const effectiveCanClaim = canUserClaimRewards({
      serverConfigured: effectiveServerReady,
      mode,
      user: d1User,
    });

    const accountCreatedAtMs =
      (d1User.d1CreatedAtMs > 0 ? d1User.d1CreatedAtMs : null) ??
      parseTimestampMs(userDoc?.createdAt) ??
      nowMs;
    const withinManualWindow =
      nowMs - accountCreatedAtMs <=
      config.referral.manualCodeWindowDays * 24 * 60 * 60 * 1000;
    const canAttachManualCode = effectiveCanClaim && !alreadyAttachedInviter && withinManualWindow;

    const currentBalance =
      Math.max(
        0,
        Math.floor(Number(walletDoc?.balance ?? userDoc?.kobans ?? userDoc?.kobanBalance ?? 0))
      ) + newlyPaidReferralDelta;

    const responsePayload: RewardsStateResponse = {
      state: !effectiveServerReady
        ? 'server_not_ready'
        : effectiveCanClaim
        ? 'ready'
        : 'disabled',
      statusMessage: !effectiveServerReady ? 'Rewards are being set up' : undefined,
      serverConfigured: effectiveServerReady,
      mode,
      canClaim: effectiveCanClaim,
      enabled: effectiveCanClaim,
      comingSoon: !effectiveCanClaim,
      timezone: config.timezone,
      balance: currentBalance,
      daily,
      dailyLadder: config.dailyLadder,
      mcqsAnswered,
      milestones,
      dragonMilestone: {
        threshold: 1000,
        unlocked: Boolean(
          walletDoc?.owned?.includes('zenryu') ||
            userDoc?.dragonUnlocked === true ||
            mcqsAnswered >= 1000
        ),
        progress: Math.min(mcqsAnswered, 1000),
      },
      referral: {
        myCode,
        shareUrl: `https://boardly.cfd/join/${myCode}`,
        canAttachManualCode,
        alreadyAttachedInviter,
        paidCountThisMonth,
        maxPaidPerMonth: config.referral.maxPaidPerInviterPerMonth,
        config: config.referral,
        items: referralItems,
      },
    };

    return jsonResponse(responsePayload, 200);
  }

  // All remaining endpoints are POST claim/referral endpoints
  if (request.method !== 'POST') {
    return jsonResponse(
      { ok: false, error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' },
      405
    );
  }

  // 5. Per-user rate limiting (~1 request/sec) for POST claim/referral actions
  if (!opts.bypassRateLimit) {
    const rateBucket = `post:${subPath}`;
    if (!checkRateLimit(uid, rateBucket, nowMs)) {
      return jsonResponse(
        {
          ok: false,
          error: 'Too many requests. Please wait 1 second and try again.',
          code: 'RATE_LIMITED',
        },
        429
      );
    }
  }

  if (!serverConfigured || !store || firestoreErrorOccurred) {
    return jsonResponse(
      {
        ok: false,
        state: 'server_not_ready',
        comingSoon: true,
        mode,
        canClaim: false,
        error: 'Rewards are being set up',
        code: 'SERVER_NOT_READY',
      },
      503
    );
  }

  const canClaim = canUserClaimRewards({ serverConfigured, mode, user: d1User });

  if (!canClaim) {
    return jsonResponse(
      {
        ok: false,
        state: 'disabled',
        comingSoon: true,
        mode,
        canClaim: false,
        error:
          mode === 'admin_only'
            ? 'Boardly Rewards is currently in Super Admin testing mode. Coming soon for all students!'
            : 'Boardly Rewards is coming soon. Claims are not enabled yet.',
        code: 'REWARDS_DISABLED',
      },
      503
    );
  }

  let body: Record<string, any> = {};
  try {
    const rawText = await request.text();
    body = rawText ? JSON.parse(rawText) : {};
  } catch {
    return jsonResponse(
      { ok: false, error: 'Invalid JSON request body.', code: 'INVALID_JSON' },
      400
    );
  }

  // ─── ENDPOINT 2: POST /api/rewards/daily/claim ─────────────────────────────
  if (subPath === 'daily/claim') {
    const pktDate = getPktDateString(nowMs);
    const dailyState = await computeD1DailyProgressForUser(db, uid, config, nowMs);

    if (dailyState.claimedToday) {
      return jsonResponse(
        {
          ok: false,
          error: 'You have already claimed your daily reward today.',
          code: 'ALREADY_CLAIMED_TODAY',
        },
        409
      );
    }

    let dayNumber = dailyState.nextDayNumber;
    let rewardAmount = dailyState.nextRewardAmount;

    // Step 1 (Claim-First in D1): Insert into `reward_daily_claims` with `credit_status = 'pending'`.
    // PRIMARY KEY (uid, pkt_date) guarantees that concurrent requests for the same day fail with UNIQUE error!
    try {
      await db
        .prepare(
          `INSERT INTO reward_daily_claims (uid, pkt_date, day_number, amount, credit_status, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        )
        .bind(uid, pktDate, dayNumber, rewardAmount, 'pending', nowMs)
        .run();
    } catch (insertErr: any) {
      const msg = String(insertErr?.message || '');
      if (msg.includes('UNIQUE') || msg.includes('PRIMARY KEY') || msg.includes('constraint')) {
        const existingRow = await db
          .prepare(
            'SELECT day_number, amount, credit_status, created_at FROM reward_daily_claims WHERE uid = ?1 AND pkt_date = ?2 LIMIT 1'
          )
          .bind(uid, pktDate)
          .first<{
            day_number: number;
            amount: number;
            credit_status: string;
            created_at: number;
          }>();
        if (
          !existingRow ||
          existingRow.credit_status === 'credited' ||
          Math.abs(nowMs - Number(existingRow.created_at || 0)) < 1500
        ) {
          return jsonResponse(
            {
              ok: false,
              error: 'You have already claimed your daily reward today.',
              code: 'ALREADY_CLAIMED_TODAY',
            },
            409
          );
        }
        dayNumber = Number(existingRow.day_number || dayNumber);
        rewardAmount = Number(existingRow.amount || rewardAmount);
      } else {
        throw insertErr;
      }
    }

    // Step 2 (Credit-Second in Firestore): Credit Kobans with deterministic ledger ID
    const ledgerId = `reward_daily_${uid}_${pktDate}`;
    try {
      const creditRes = await creditKobansIdempotentInFirestore({
        store,
        uid,
        ledgerId,
        type: 'reward_daily',
        amount: rewardAmount,
        reason: `Daily Check-in — Day ${dayNumber} (${pktDate})`,
        extraLedgerFields: {
          dayNumber,
          pktDate,
        },
        notification: {
          id: `daily_${uid}_${pktDate}`,
          title: `Day ${dayNumber} Check-in Reward Claimed!`,
          message: `+${rewardAmount.toLocaleString()} Kobans added to your wallet for your Day ${dayNumber} check-in.`,
          link: '/rewards',
        },
      });

      // Step 3: Mark D1 row `credit_status = 'credited'`
      await db
        .prepare(
          'UPDATE reward_daily_claims SET credit_status = ?1 WHERE uid = ?2 AND pkt_date = ?3'
        )
        .bind('credited', uid, pktDate)
        .run();

      return jsonResponse(
        {
          ok: true,
          dayNumber,
          rewardAmount,
          delta: creditRes.delta,
          balanceBefore: creditRes.balanceBefore,
          newBalance: creditRes.balanceAfter,
          balanceAfter: creditRes.balanceAfter,
          ledgerId: creditRes.ledgerId,
          pktDate,
          creditStatus: 'credited',
        },
        200
      );
    } catch (creditErr: any) {
      // Log raw Google/Firestore error ONLY on the server; never send raw JSON/error details to browser!
      console.error(
        `[Rewards Daily Claim Firestore Error] uid=${uid} pktDate=${pktDate}:`,
        creditErr?.message || creditErr
      );
      return jsonResponse(
        {
          ok: false,
          state: 'server_not_ready',
          canClaim: false,
          comingSoon: true,
          pendingRetry: true,
          dayNumber,
          rewardAmount,
          pktDate,
          creditStatus: 'pending',
          error: 'Rewards are being set up',
          code: 'CREDIT_PENDING_RETRY',
          failSafeCode: 'SERVER_NOT_READY',
        },
        502
      );
    }
  }

  // ─── ENDPOINT 3: POST /api/rewards/milestone/claim ─────────────────────────
  if (subPath === 'milestone/claim') {
    // Super Admins are excluded from claiming student MCQ milestones in 'everyone' mode,
    // EXCEPT when testing in 'admin_only' mode.
    if (d1User.isSuperAdmin && mode !== 'admin_only') {
      return jsonResponse(
        {
          ok: false,
          error:
            'Super Admin accounts have all items unlocked and are excluded from claiming student MCQ milestones.',
          code: 'SUPER_ADMIN_EXCLUDED',
        },
        403
      );
    }

    const rawId = String(body.id || body.milestoneId || '').trim();
    const def = DEFAULT_MILESTONES.find(
      (m) => m.id === rawId || String(m.threshold) === rawId.replace(/^mcq_/, '')
    );
    if (!def) {
      return jsonResponse(
        { ok: false, error: 'Invalid milestone ID.', code: 'INVALID_MILESTONE' },
        400
      );
    }

    const milestoneId = def.id;
    const rewardAmount = Math.max(
      0,
      Math.floor(Number(config.milestones[String(def.threshold)] ?? def.reward))
    );

    const mcqsAnswered = await computeAuthoritativeMcqsFromD1(db, uid, 0);
    if (mcqsAnswered < def.threshold) {
      return jsonResponse(
        {
          ok: false,
          error: `You need ${def.threshold} completed MCQs to claim this reward (currently ${mcqsAnswered}).`,
          code: 'MILESTONE_NOT_REACHED',
          mcqsAnswered,
          required: def.threshold,
        },
        400
      );
    }

    // Step 1 (Claim-First in D1): Insert into `reward_milestone_claims` with `credit_status = 'pending'`
    try {
      await db
        .prepare(
          `INSERT INTO reward_milestone_claims (uid, milestone_id, amount, credit_status, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5)`
        )
        .bind(uid, milestoneId, rewardAmount, 'pending', nowMs)
        .run();
    } catch (insertErr: any) {
      const msg = String(insertErr?.message || '');
      if (msg.includes('UNIQUE') || msg.includes('PRIMARY KEY') || msg.includes('constraint')) {
        const existingMilestone = await db
          .prepare(
            'SELECT amount, credit_status, created_at FROM reward_milestone_claims WHERE uid = ?1 AND milestone_id = ?2 LIMIT 1'
          )
          .bind(uid, milestoneId)
          .first<{ amount: number; credit_status: string; created_at: number }>();
        if (
          !existingMilestone ||
          existingMilestone.credit_status === 'credited' ||
          Math.abs(nowMs - Number(existingMilestone.created_at || 0)) < 1500
        ) {
          return jsonResponse(
            {
              ok: false,
              error: 'This milestone reward has already been claimed.',
              code: 'ALREADY_CLAIMED_MILESTONE',
            },
            409
          );
        }
      } else {
        throw insertErr;
      }
    }

    // Step 2 (Credit-Second in Firestore): Credit Kobans with deterministic ledger ID
    const ledgerId = `reward_milestone_${uid}_${milestoneId}`;
    try {
      const creditRes = await creditKobansIdempotentInFirestore({
        store,
        uid,
        ledgerId,
        type: 'reward_milestone',
        amount: rewardAmount,
        reason: `MCQ Milestone Reward — ${def.title} (${def.threshold} MCQs)`,
        extraLedgerFields: {
          milestoneId,
          threshold: def.threshold,
        },
        notification: {
          id: `milestone_${uid}_${milestoneId}`,
          title: `${def.title} Unlocked!`,
          message: `+${rewardAmount.toLocaleString()} Kobans added to your wallet for answering ${def.threshold} MCQs!`,
          link: '/rewards',
        },
      });

      // Step 3: Mark D1 row `credit_status = 'credited'`
      await db
        .prepare(
          'UPDATE reward_milestone_claims SET credit_status = ?1 WHERE uid = ?2 AND milestone_id = ?3'
        )
        .bind('credited', uid, milestoneId)
        .run();

      return jsonResponse(
        {
          ok: true,
          milestoneId,
          threshold: def.threshold,
          rewardAmount,
          delta: creditRes.delta,
          balanceBefore: creditRes.balanceBefore,
          newBalance: creditRes.balanceAfter,
          balanceAfter: creditRes.balanceAfter,
          ledgerId: creditRes.ledgerId,
          creditStatus: 'credited',
        },
        200
      );
    } catch (creditErr: any) {
      console.error(
        `[Rewards Milestone Claim Firestore Error] uid=${uid} milestoneId=${milestoneId}:`,
        creditErr?.message || creditErr
      );
      return jsonResponse(
        {
          ok: false,
          state: 'server_not_ready',
          canClaim: false,
          comingSoon: true,
          pendingRetry: true,
          milestoneId,
          rewardAmount,
          creditStatus: 'pending',
          error: 'Rewards are being set up',
          code: 'CREDIT_PENDING_RETRY',
          failSafeCode: 'SERVER_NOT_READY',
        },
        502
      );
    }
  }

  // ─── ENDPOINT 4: POST /api/rewards/referral/attach ─────────────────────────
  if (subPath === 'referral/attach') {
    const enteredCode = normalizeReferralCode(body.code);
    if (!isValidReferralCodeFormat(enteredCode)) {
      return jsonResponse(
        {
          ok: false,
          error: 'Please enter a valid referral code in the format BLD-XXXXXX.',
          code: 'INVALID_REFERRAL_CODE',
        },
        400
      );
    }

    const emailVerified = d1User.emailVerified || userDoc?.emailVerified === true;
    if (!emailVerified) {
      return jsonResponse(
        {
          ok: false,
          error: 'Please verify your email address before attaching a referral code.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        403
      );
    }

    const accountCreatedAtMs =
      (d1User.d1CreatedAtMs > 0 ? d1User.d1CreatedAtMs : null) ??
      parseTimestampMs(userDoc?.createdAt) ??
      nowMs;
    const maxWindowMs = config.referral.manualCodeWindowDays * 24 * 60 * 60 * 1000;
    if (nowMs - accountCreatedAtMs > maxWindowMs) {
      return jsonResponse(
        {
          ok: false,
          error: `Referral codes can only be attached within ${config.referral.manualCodeWindowDays} days of account creation.`,
          code: 'MANUAL_WINDOW_EXPIRED',
        },
        400
      );
    }

    // Look up inviter by code in D1 `referral_codes`
    const codeRow = await db
      .prepare('SELECT uid, code FROM referral_codes WHERE code = ?1 LIMIT 1')
      .bind(enteredCode)
      .first<{ uid: string; code: string }>();

    if (!codeRow || !codeRow.uid) {
      return jsonResponse(
        {
          ok: false,
          error: 'Referral code not found. Please check the code and try again.',
          code: 'REFERRAL_CODE_NOT_FOUND',
        },
        404
      );
    }

    const inviterUid = String(codeRow.uid);
    if (inviterUid === uid) {
      return jsonResponse(
        {
          ok: false,
          error: 'You cannot use your own referral code.',
          code: 'SELF_REFERRAL_FORBIDDEN',
        },
        400
      );
    }

    // Check if inviter is suspended in D1 or Firestore
    const inviterRoleRow = await db
      .prepare('SELECT is_posting_banned FROM user_roles WHERE uid = ?1 LIMIT 1')
      .bind(inviterUid)
      .first<{ is_posting_banned?: number }>();
    const inviterUserDoc = await store.getDoc(`users/${inviterUid}`).catch(() => null);

    if (Boolean(inviterRoleRow?.is_posting_banned) || isFirestoreUserSuspended(inviterUserDoc)) {
      return jsonResponse(
        {
          ok: false,
          error: 'This referral code belongs to an inactive or suspended account.',
          code: 'INVITER_SUSPENDED',
        },
        400
      );
    }

    // Prevent mutual A <-> B referral loop
    const reverseRef = await db
      .prepare(
        'SELECT id FROM referrals WHERE invitee_uid = ?1 AND inviter_uid = ?2 LIMIT 1'
      )
      .bind(inviterUid, uid)
      .first<{ id: string }>();

    if (reverseRef) {
      return jsonResponse(
        {
          ok: false,
          error: 'Mutual referrals between two accounts are not permitted.',
          code: 'MUTUAL_REFERRAL_FORBIDDEN',
        },
        400
      );
    }

    const inviteeCode = await ensureD1UserReferralCode(db, uid);

    // Check IP hash (> 2 attaches from one ip_hash in 24h -> flagged = 1 and hold payout)
    const rawIp =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      'unknown-ip';
    const ipHash = await sha256Hex(`boardly_ip_salt:${rawIp}`);
    const since24hMs = nowMs - 24 * 60 * 60 * 1000;

    const ipCountRow = await db
      .prepare('SELECT COUNT(*) AS cnt FROM referrals WHERE ip_hash = ?1 AND created_at >= ?2')
      .bind(ipHash, since24hMs)
      .first<{ cnt: number }>();

    const recentIpAttaches = Number(ipCountRow?.cnt || 0);
    const isFlagged = recentIpAttaches >= 2 ? 1 : 0;

    const referralId = `ref_${uid}`;
    const initialStatus: ReferralStatus = isFlagged ? 'flagged' : 'pending_confirmation';

    try {
      await db
        .prepare(
          `INSERT INTO referrals (
             id, inviter_uid, invitee_uid, inviter_code, invitee_code,
             status, inviter_accepted, invitee_accepted, ip_hash, flagged,
             inviter_credit_status, invitee_credit_status, created_at, confirmed_at, paid_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`
        )
        .bind(
          referralId,
          inviterUid,
          uid,
          enteredCode,
          inviteeCode,
          initialStatus,
          0,
          0,
          ipHash,
          isFlagged,
          'pending',
          'pending',
          nowMs,
          null,
          null
        )
        .run();
    } catch (insertErr: any) {
      const msg = String(insertErr?.message || '');
      if (msg.includes('UNIQUE') || msg.includes('PRIMARY KEY') || msg.includes('constraint')) {
        return jsonResponse(
          {
            ok: false,
            error: 'You have already attached an inviter referral code.',
            code: 'ALREADY_ATTACHED_REFERRAL',
          },
          409
        );
      }
      throw insertErr;
    }

    const inviterDisplayName = sanitizeDisplayName(inviterUserDoc, null);

    return jsonResponse(
      {
        ok: true,
        referralId,
        status: initialStatus,
        inviterDisplayName,
        inviterCode: enteredCode,
        myCode: inviteeCode,
      },
      200
    );
  }

  // ─── ENDPOINT 5: POST /api/rewards/referral/accept ─────────────────────────
  if (subPath === 'referral/accept') {
    const referralId = String(body.referralId || '').trim();
    const enteredCode = normalizeReferralCode(body.enteredCode || body.code || '');

    if (!referralId || !enteredCode) {
      return jsonResponse(
        {
          ok: false,
          error: "Both referralId and your friend's code are required.",
          code: 'MISSING_FIELDS',
        },
        400
      );
    }

    const refRow = await db
      .prepare('SELECT * FROM referrals WHERE id = ?1 LIMIT 1')
      .bind(referralId)
      .first<Record<string, any>>();

    if (!refRow) {
      return jsonResponse(
        { ok: false, error: 'Referral not found.', code: 'REFERRAL_NOT_FOUND' },
        404
      );
    }

    const isInviter = String(refRow.inviter_uid) === uid;
    const isInvitee = String(refRow.invitee_uid) === uid;

    if (!isInviter && !isInvitee) {
      return jsonResponse(
        {
          ok: false,
          error: 'You are not a participant in this referral.',
          code: 'FORBIDDEN_REFERRAL',
        },
        403
      );
    }

    if (Number(refRow.flagged || 0) === 1 || refRow.status === 'flagged') {
      return jsonResponse(
        {
          ok: false,
          error: 'This referral has been flagged for manual review and payout is held.',
          code: 'REFERRAL_FLAGGED',
        },
        400
      );
    }

    const createdAtMs = Number(refRow.created_at || nowMs);
    const expiresAtMs =
      createdAtMs + config.referral.pendingExpiryDays * 24 * 60 * 60 * 1000;

    if (refRow.status === 'pending_confirmation' && nowMs > expiresAtMs) {
      await db
        .prepare('UPDATE referrals SET status = ?1 WHERE id = ?2')
        .bind('expired', referralId)
        .run();
      return jsonResponse(
        {
          ok: false,
          error: `This referral expired after ${config.referral.pendingExpiryDays} days without confirmation.`,
          code: 'REFERRAL_EXPIRED',
        },
        400
      );
    }

    if (refRow.status === 'expired') {
      return jsonResponse(
        {
          ok: false,
          error: 'This referral has expired.',
          code: 'REFERRAL_EXPIRED',
        },
        400
      );
    }

    // Two-way acceptance:
    // - Inviter must enter `invitee_code` -> `inviter_accepted = 1`
    // - Invitee must enter `inviter_code` -> `invitee_accepted = 1`
    const expectedCode = isInviter
      ? normalizeReferralCode(String(refRow.invitee_code || ''))
      : normalizeReferralCode(String(refRow.inviter_code || ''));

    if (!enteredCode || enteredCode !== expectedCode) {
      return jsonResponse(
        {
          ok: false,
          error: "The code entered does not match your friend's referral code.",
          code: 'CODE_MISMATCH',
        },
        400
      );
    }

    const nextInviterAccepted = isInviter ? 1 : Number(refRow.inviter_accepted || 0);
    const nextInviteeAccepted = isInvitee ? 1 : Number(refRow.invitee_accepted || 0);
    const bothAccepted = nextInviterAccepted === 1 && nextInviteeAccepted === 1;

    let nextStatus = String(refRow.status || 'pending_confirmation');
    let confirmedAt = refRow.confirmed_at ? Number(refRow.confirmed_at) : null;

    if (bothAccepted && nextStatus === 'pending_confirmation') {
      nextStatus = 'confirmed';
      confirmedAt = nowMs;
    }

    await db
      .prepare(
        `UPDATE referrals
         SET inviter_accepted = ?1, invitee_accepted = ?2, status = ?3, confirmed_at = ?4
         WHERE id = ?5`
      )
      .bind(nextInviterAccepted, nextInviteeAccepted, nextStatus, confirmedAt, referralId)
      .run();

    // If only one side has accepted so far, return pending_confirmation waiting for the other side
    if (!bothAccepted) {
      return jsonResponse(
        {
          ok: true,
          referralId,
          status: 'pending_confirmation',
          inviterAccepted: nextInviterAccepted === 1,
          inviteeAccepted: nextInviteeAccepted === 1,
          paid: false,
          message:
            "Your acceptance is recorded! Once your friend also enters your code and taps Accept, the referral will be confirmed.",
        },
        200
      );
    }

    // Both accepted -> status is 'confirmed'. Check if payout can trigger immediately!
    const updatedRow = {
      ...refRow,
      inviter_accepted: nextInviterAccepted,
      invitee_accepted: nextInviteeAccepted,
      status: nextStatus,
      confirmed_at: confirmedAt,
    };

    const payoutRes = await tryProcessConfirmedReferralPayout({
      db,
      store,
      refRow: updatedRow,
      config,
      nowMs,
    });

    if (payoutRes.errorCode === 'MONTHLY_CAP_REACHED') {
      return jsonResponse(
        {
          ok: true,
          referralId,
          status: 'capped',
          inviterAccepted: true,
          inviteeAccepted: true,
          paid: false,
          message: payoutRes.errorMessage,
        },
        200
      );
    }

    if (payoutRes.status === 'completed') {
      return jsonResponse(
        {
          ok: true,
          referralId,
          status: 'completed',
          inviterAccepted: true,
          inviteeAccepted: true,
          paid: true,
          inviterReward: config.referral.inviterReward,
          inviterBalanceBefore: payoutRes.inviterBalanceBefore,
          inviterBalanceAfter: payoutRes.inviterBalanceAfter,
          inviteeReward: config.referral.inviteeReward,
          inviteeBalanceBefore: payoutRes.inviteeBalanceBefore,
          inviteeBalanceAfter: payoutRes.inviteeBalanceAfter,
          message:
            'Both codes confirmed and 20+ MCQs completed! Referral rewards have been credited.',
        },
        200
      );
    }

    return jsonResponse(
      {
        ok: true,
        referralId,
        status: 'confirmed',
        inviterAccepted: true,
        inviteeAccepted: true,
        paid: false,
        message: `Both codes confirmed! Rewards will unlock automatically once the invitee completes ${config.referral.minInviteeMcqs} MCQs.`,
      },
      200
    );
  }

  return jsonResponse(
    { ok: false, error: `Unknown rewards endpoint: /api/rewards/${subPath}`, code: 'NOT_FOUND' },
    404
  );
}

// Cloudflare Pages Function Entrypoint
export const onRequest = async (context: {
  request: Request;
  env: RewardsEnv;
}): Promise<Response> => {
  return handleRewardsApiRequest({
    request: context.request,
    env: context.env,
  });
};

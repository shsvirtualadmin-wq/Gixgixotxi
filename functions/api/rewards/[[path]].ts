/**
 * Boardly Rewards Server Endpoints (/api/rewards/*)
 *
 * Implements:
 * - GET  /api/rewards/state
 * - POST /api/rewards/daily/claim
 * - POST /api/rewards/milestone/claim
 * - POST /api/rewards/referral/attach
 * - POST /api/rewards/referral/accept
 *
 * Security invariants:
 * - Verifies Firebase ID token on every authenticated call.
 * - Rejects suspended users.
 * - Rate-limits each user (~1 request/sec).
 * - Reads `config/rewards` from Firestore on the server; never trusts client amounts/days/counts.
 * - All Kobans credits happen server-side only inside a Firestore transaction, writing to
 *   `wallets/{uid}.balance` (and mirroring `users/{uid}.kobans` / `kobanBalance`) and
 *   `wallets/{uid}/ledger/{entryId}` with types:
 *     `reward_daily`, `reward_milestone`, `reward_referral_inviter`, `reward_referral_invitee`.
 * - Until `FIREBASE_SERVICE_ACCOUNT` is configured, endpoints return HTTP 503 and UI shows "Coming soon".
 */

import {
  DEFAULT_DAILY_LADDER,
  DEFAULT_MILESTONES,
  DEFAULT_REWARDS_CONFIG,
  buildDailyClaimDocId,
  buildMilestoneClaimDocId,
  computeDailyProgressState,
  computeMilestonesState,
  evaluateReferralResolution,
  generateDeterministicReferralCode,
  getPktDateString,
  getPktMonthString,
  isValidReferralCodeFormat,
  normalizeReferralCode,
  type ReferralRecordPublic,
  type ReferralStatus,
  type RewardsConfig,
  type RewardsStateResponse,
} from '../../../src/lib/rewardsEngine';
import {
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_FIRESTORE_DATABASE_ID,
  FirestoreRestAdapter,
  SERVER_TIMESTAMP_SENTINEL,
  parseServiceAccountFromEnv,
  verifyFirebaseIdToken,
  type FirestoreStoreAdapter,
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
    const maybeSec = (val as { seconds?: number; _seconds?: number }).seconds ??
      (val as { _seconds?: number })._seconds;
    if (typeof maybeSec === 'number') return maybeSec * 1000;
  }
  return null;
}

function isUserSuspended(userDoc: Record<string, any> | null): boolean {
  if (!userDoc) return false;
  return (
    userDoc.isBanned === true ||
    userDoc.isSuspended === true ||
    userDoc.suspended === true ||
    userDoc.status === 'suspended'
  );
}

function sanitizeDisplayName(userDoc: Record<string, any> | null, token?: VerifiedFirebaseToken | null): string {
  const raw =
    userDoc?.displayName ||
    userDoc?.name ||
    userDoc?.username ||
    token?.name ||
    'Boardly Student';
  const str = String(raw).trim();
  // Never expose an email address as a display name
  if (str.includes('@')) {
    return str.split('@')[0] || 'Boardly Student';
  }
  return str.slice(0, 48) || 'Boardly Student';
}

function buildDefaultUnconfiguredState(nowMs = Date.now()): RewardsStateResponse {
  const daily = computeDailyProgressState({
    totalClaims: 0,
    lastClaimPktDate: null,
    nowMs,
    config: DEFAULT_REWARDS_CONFIG,
  });
  const milestones = computeMilestonesState({
    mcqsAnswered: 0,
    claimedIds: {},
    config: DEFAULT_REWARDS_CONFIG,
  });
  return {
    serverConfigured: false,
    enabled: false,
    comingSoon: true,
    timezone: DEFAULT_REWARDS_CONFIG.timezone,
    balance: 0,
    daily,
    dailyLadder: [...DEFAULT_DAILY_LADDER],
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
      maxPaidPerMonth: DEFAULT_REWARDS_CONFIG.referral.maxPaidPerInviterPerMonth,
      config: DEFAULT_REWARDS_CONFIG.referral,
      items: [],
    },
  };
}

/**
 * Loads `config/rewards` from Firestore, seeding it with `DEFAULT_REWARDS_CONFIG`
 * if it does not exist yet.
 */
export async function loadOrSeedRewardsConfig(
  store: FirestoreStoreAdapter
): Promise<RewardsConfig> {
  const existing = await store.getDoc('config/rewards');
  if (!existing) {
    try {
      await store.setDoc('config/rewards', {
        ...DEFAULT_REWARDS_CONFIG,
        updatedAt: SERVER_TIMESTAMP_SENTINEL,
      });
    } catch {
      // Non-fatal if concurrent seed
    }
    return { ...DEFAULT_REWARDS_CONFIG };
  }

  const ladder =
    Array.isArray(existing.dailyLadder) && existing.dailyLadder.length === 30
      ? existing.dailyLadder.map((n: unknown) => Math.max(0, Math.floor(Number(n) || 0)))
      : [...DEFAULT_DAILY_LADDER];

  const milestonesMap: Record<string, number> = {
    ...DEFAULT_REWARDS_CONFIG.milestones,
    ...(existing.milestones && typeof existing.milestones === 'object' ? existing.milestones : {}),
  };

  const refRaw = existing.referral && typeof existing.referral === 'object' ? existing.referral : {};

  return {
    enabled: existing.enabled === true,
    timezone: String(existing.timezone || DEFAULT_REWARDS_CONFIG.timezone),
    dailyLadder: ladder,
    resetOnMiss: existing.resetOnMiss === true,
    milestones: milestonesMap,
    referral: {
      inviterReward: Number(refRaw.inviterReward ?? DEFAULT_REWARDS_CONFIG.referral.inviterReward),
      inviteeReward: Number(refRaw.inviteeReward ?? DEFAULT_REWARDS_CONFIG.referral.inviteeReward),
      minInviteeMcqs: Number(refRaw.minInviteeMcqs ?? DEFAULT_REWARDS_CONFIG.referral.minInviteeMcqs),
      maxPaidPerInviterPerMonth: Number(
        refRaw.maxPaidPerInviterPerMonth ?? DEFAULT_REWARDS_CONFIG.referral.maxPaidPerInviterPerMonth
      ),
      pendingExpiryDays: Number(
        refRaw.pendingExpiryDays ?? DEFAULT_REWARDS_CONFIG.referral.pendingExpiryDays
      ),
      manualCodeWindowDays: Number(
        refRaw.manualCodeWindowDays ?? DEFAULT_REWARDS_CONFIG.referral.manualCodeWindowDays
      ),
    },
  };
}

/**
 * Computes the authoritative MCQs answered count for `uid` from completed `attempts` documents.
 */
export async function computeAuthoritativeMcqsAnswered(
  store: FirestoreStoreAdapter,
  uid: string
): Promise<number> {
  const attempts = await store.queryByField('attempts', 'userId', 'EQUAL', uid, 500);
  let totalAnswered = 0;
  const seenIds = new Set<string>();

  for (const att of attempts) {
    const docId = String(att._id || att.id || '');
    if (docId) {
      if (seenIds.has(docId)) continue;
      seenIds.add(docId);
    }
    if (att.status && att.status !== 'completed') continue;

    const correct = Math.max(0, Math.floor(Number(att.correctAnswers ?? 0)));
    const wrong = Math.max(0, Math.floor(Number(att.wrongAnswers ?? 0)));
    const totalQ = Math.max(0, Math.floor(Number(att.totalQuestions ?? 0)));
    const unanswered = Math.max(0, Math.floor(Number(att.unanswered ?? 0)));

    let answered = correct + wrong;
    if (answered === 0 && totalQ > 0 && totalQ >= unanswered) {
      answered = totalQ - unanswered;
    }
    if (totalQ > 0 && answered > totalQ) {
      answered = totalQ;
    }
    answered = Math.min(answered, MAX_COUNTED_MCQS_PER_ATTEMPT);
    totalAnswered += answered;
  }

  return totalAnswered;
}

/**
 * Ensures the user has a unique permanent `BLD-XXXXXX` referral code stored in
 * `reward_user_state/{uid}` and indexed in `reward_referral_codes/{code}`.
 */
export async function ensureUserReferralCode(
  store: FirestoreStoreAdapter,
  uid: string,
  displayName: string
): Promise<string> {
  const userState = await store.getDoc(`reward_user_state/${uid}`);
  if (userState?.referralCode && isValidReferralCodeFormat(String(userState.referralCode))) {
    const existingCode = String(userState.referralCode);
    const codeDoc = await store.getDoc(`reward_referral_codes/${existingCode}`);
    if (!codeDoc) {
      await store.setDoc(`reward_referral_codes/${existingCode}`, {
        code: existingCode,
        uid,
        displayName,
        createdAt: SERVER_TIMESTAMP_SENTINEL,
      });
    }
    return existingCode;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateDeterministicReferralCode(uid, attempt);
    const existingOwner = await store.getDoc(`reward_referral_codes/${candidate}`);
    if (!existingOwner || existingOwner.uid === uid) {
      await store.setDoc(`reward_referral_codes/${candidate}`, {
        code: candidate,
        uid,
        displayName,
        createdAt: SERVER_TIMESTAMP_SENTINEL,
      });
      await store.setDoc(
        `reward_user_state/${uid}`,
        {
          uid,
          referralCode: candidate,
          updatedAt: SERVER_TIMESTAMP_SENTINEL,
        },
        true
      );
      return candidate;
    }
  }

  const fallback = generateDeterministicReferralCode(`${uid}_${Date.now()}`, 0);
  await store.setDoc(`reward_referral_codes/${fallback}`, {
    code: fallback,
    uid,
    displayName,
    createdAt: SERVER_TIMESTAMP_SENTINEL,
  });
  await store.setDoc(
    `reward_user_state/${uid}`,
    {
      uid,
      referralCode: fallback,
      updatedAt: SERVER_TIMESTAMP_SENTINEL,
    },
    true
  );
  return fallback;
}

/**
 * Executes an atomic referral payout inside a Firestore transaction when a confirmed
 * referral's invitee has answered >= minInviteeMcqs.
 */
async function tryCompleteConfirmedReferralInTx(params: {
  store: FirestoreStoreAdapter;
  referralId: string;
  config: RewardsConfig;
  nowMs: number;
}): Promise<{ completed: boolean; status: ReferralStatus; errorCode?: string; errorMessage?: string }> {
  const { store, referralId, config, nowMs } = params;
  const pktMonth = getPktMonthString(nowMs);

  return store.runTransaction(async (tx) => {
    const refDoc = await tx.getDoc(`reward_referrals/${referralId}`);
    if (!refDoc) {
      return {
        completed: false,
        status: 'expired' as ReferralStatus,
        errorCode: 'REFERRAL_NOT_FOUND',
        errorMessage: 'Referral record not found.',
      };
    }

    if (refDoc.payoutCompleted === true || refDoc.status === 'completed') {
      return { completed: true, status: 'completed' as ReferralStatus };
    }

    if (refDoc.isFlagged === true || refDoc.status === 'flagged') {
      return {
        completed: false,
        status: 'flagged' as ReferralStatus,
        errorCode: 'REFERRAL_FLAGGED',
        errorMessage: 'Referral is flagged for review.',
      };
    }

    const inviterUid = String(refDoc.inviterUid);
    const inviteeUid = String(refDoc.inviteeUid);
    const monthDocPath = `reward_inviter_months/${inviterUid}_${pktMonth}`;
    const monthDoc = await tx.getDoc(monthDocPath);
    const paidCountThisMonth = Math.max(0, Math.floor(Number(monthDoc?.paidCount ?? 0)));

    if (paidCountThisMonth >= config.referral.maxPaidPerInviterPerMonth) {
      tx.setDoc(
        `reward_referrals/${referralId}`,
        {
          status: 'capped',
          updatedAtMs: nowMs,
          updatedAt: SERVER_TIMESTAMP_SENTINEL,
        },
        true
      );
      return {
        completed: false,
        status: 'capped' as ReferralStatus,
        errorCode: 'MONTHLY_CAP_REACHED',
        errorMessage: `Monthly cap of ${config.referral.maxPaidPerInviterPerMonth} paid referrals reached.`,
      };
    }

    // Read inviter & invitee wallets and profiles inside the transaction
    const [inviterWallet, inviterUser, inviteeWallet, inviteeUser] = await Promise.all([
      tx.getDoc(`wallets/${inviterUid}`),
      tx.getDoc(`users/${inviterUid}`),
      tx.getDoc(`wallets/${inviteeUid}`),
      tx.getDoc(`users/${inviteeUid}`),
    ]);

    const inviterReward = Math.max(0, Math.floor(Number(config.referral.inviterReward) || 5000));
    const inviteeReward = Math.max(0, Math.floor(Number(config.referral.inviteeReward) || 1000));

    const inviterCurrentBalance = Math.max(
      0,
      Math.floor(
        Number(inviterWallet?.balance ?? inviterUser?.kobans ?? inviterUser?.kobanBalance ?? 0)
      )
    );
    const inviteeCurrentBalance = Math.max(
      0,
      Math.floor(
        Number(inviteeWallet?.balance ?? inviteeUser?.kobans ?? inviteeUser?.kobanBalance ?? 0)
      )
    );

    const inviterNewBalance = inviterCurrentBalance + inviterReward;
    const inviteeNewBalance = inviteeCurrentBalance + inviteeReward;

    const inviterLedgerId = `reward_ref_inviter_${referralId}`;
    const inviteeLedgerId = `reward_ref_invitee_${referralId}`;

    // Deterministic ledger create (fails transaction if already credited)
    tx.createDoc(`wallets/${inviterUid}/ledger/${inviterLedgerId}`, {
      id: inviterLedgerId,
      type: 'reward_referral_inviter',
      amount: inviterReward,
      balanceAfter: inviterNewBalance,
      reason: `Referral Reward — Invited ${String(refDoc.inviteeDisplayName || 'Friend')}`,
      referralId,
      timestamp: SERVER_TIMESTAMP_SENTINEL,
    });

    tx.createDoc(`wallets/${inviteeUid}/ledger/${inviteeLedgerId}`, {
      id: inviteeLedgerId,
      type: 'reward_referral_invitee',
      amount: inviteeReward,
      balanceAfter: inviteeNewBalance,
      reason: `Referral Bonus — Joined via ${String(refDoc.inviterDisplayName || 'Friend')}`,
      referralId,
      timestamp: SERVER_TIMESTAMP_SENTINEL,
    });

    // Credit inviter wallet + user profile
    tx.setDoc(
      `wallets/${inviterUid}`,
      {
        balance: inviterNewBalance,
        owned: Array.isArray(inviterWallet?.owned) ? inviterWallet.owned : [],
        equipped: inviterWallet?.equipped || {
          effect: null,
          frame: null,
          nameplate: null,
          avatar: null,
          banner: null,
        },
        updatedAt: SERVER_TIMESTAMP_SENTINEL,
      },
      true
    );
    tx.setDoc(
      `users/${inviterUid}`,
      {
        kobans: inviterNewBalance,
        kobanBalance: inviterNewBalance,
        updatedAt: SERVER_TIMESTAMP_SENTINEL,
      },
      true
    );

    // Credit invitee wallet + user profile
    tx.setDoc(
      `wallets/${inviteeUid}`,
      {
        balance: inviteeNewBalance,
        owned: Array.isArray(inviteeWallet?.owned) ? inviteeWallet.owned : [],
        equipped: inviteeWallet?.equipped || {
          effect: null,
          frame: null,
          nameplate: null,
          avatar: null,
          banner: null,
        },
        updatedAt: SERVER_TIMESTAMP_SENTINEL,
      },
      true
    );
    tx.setDoc(
      `users/${inviteeUid}`,
      {
        kobans: inviteeNewBalance,
        kobanBalance: inviteeNewBalance,
        updatedAt: SERVER_TIMESTAMP_SENTINEL,
      },
      true
    );

    // Mark referral completed & increment monthly counter
    tx.setDoc(
      `reward_referrals/${referralId}`,
      {
        status: 'completed',
        payoutCompleted: true,
        completedAtMs: nowMs,
        updatedAtMs: nowMs,
        updatedAt: SERVER_TIMESTAMP_SENTINEL,
      },
      true
    );

    tx.setDoc(
      monthDocPath,
      {
        inviterUid,
        pktMonth,
        paidCount: paidCountThisMonth + 1,
        updatedAt: SERVER_TIMESTAMP_SENTINEL,
      },
      true
    );

    // Create in-app notifications for both users
    tx.setDoc(`notifications/ref_paid_inviter_${referralId}`, {
      userId: inviterUid,
      type: 'system',
      title: `Referral Complete! +${inviterReward.toLocaleString()} Kobans`,
      message: `${String(refDoc.inviteeDisplayName || 'Your friend')} completed ${config.referral.minInviteeMcqs} MCQs. +${inviterReward.toLocaleString()} Kobans have been added to your wallet!`,
      link: '/rewards',
      read: false,
      createdAt: SERVER_TIMESTAMP_SENTINEL,
    });

    tx.setDoc(`notifications/ref_paid_invitee_${referralId}`, {
      userId: inviteeUid,
      type: 'system',
      title: `Referral Bonus! +${inviteeReward.toLocaleString()} Kobans`,
      message: `You completed ${config.referral.minInviteeMcqs} MCQs and unlocked your +${inviteeReward.toLocaleString()} Kobans referral bonus!`,
      link: '/rewards',
      read: false,
      createdAt: SERVER_TIMESTAMP_SENTINEL,
    });

    return { completed: true, status: 'completed' as ReferralStatus };
  });
}

// ─── Core Request Router (Injectable Store & Token Verifier for Testing) ─────

export interface HandleRewardsRequestOptions {
  request: Request;
  env?: RewardsEnv;
  storeOverride?: FirestoreStoreAdapter;
  tokenVerifierOverride?: (authHeader: string | null | undefined) => Promise<VerifiedFirebaseToken | null>;
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/rewards\/?/, '').replace(/\/+$/, '');

  // 1. Resolve Firestore store (or return 503 if FIREBASE_SERVICE_ACCOUNT is not configured)
  let store: FirestoreStoreAdapter | null = opts.storeOverride || null;
  if (!store) {
    const sa = parseServiceAccountFromEnv(env);
    if (!sa) {
      const defaultState = buildDefaultUnconfiguredState(nowMs);
      return jsonResponse(
        {
          ...defaultState,
          ok: false,
          error: 'Rewards service is coming soon (FIREBASE_SERVICE_ACCOUNT not configured).',
          code: 'SERVER_NOT_CONFIGURED',
        },
        503
      );
    }
    const projectId =
      env?.FIREBASE_PROJECT_ID ||
      env?.VITE_FIREBASE_PROJECT_ID ||
      sa.project_id ||
      DEFAULT_FIREBASE_PROJECT_ID;
    const databaseId =
      env?.FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
      DEFAULT_FIRESTORE_DATABASE_ID;
    store = new FirestoreRestAdapter(sa, projectId, databaseId);
  }

  // 2. Verify Firebase ID Token
  const authHeader = request.headers.get('Authorization');
  const projectId =
    env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const verifyFn =
    opts.tokenVerifierOverride || ((hdr) => verifyFirebaseIdToken(hdr, projectId));

  const verifiedToken = await verifyFn(authHeader);

  // For GET /api/rewards/state without an Authorization header, return public schedule/config
  if (subPath === 'state' && request.method === 'GET' && !authHeader) {
    const config = await loadOrSeedRewardsConfig(store);
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
      serverConfigured: true,
      enabled: config.enabled,
      comingSoon: !config.enabled,
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

  if (!verifiedToken || !verifiedToken.uid) {
    return jsonResponse(
      { ok: false, error: 'Authentication required. Please sign in.', code: 'UNAUTHENTICATED' },
      401
    );
  }

  const uid = verifiedToken.uid;

  // 3. Per-user rate limiting (~1 request/sec)
  if (!opts.bypassRateLimit) {
    const rateBucket = request.method === 'GET' ? `get:${subPath}` : `post:${subPath}`;
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

  // 4. Load user profile & reject suspended users
  const [userDoc, config] = await Promise.all([
    store.getDoc(`users/${uid}`),
    loadOrSeedRewardsConfig(store),
  ]);

  if (isUserSuspended(userDoc)) {
    return jsonResponse(
      {
        ok: false,
        error: 'Your account is suspended and cannot access Boardly Rewards.',
        code: 'USER_SUSPENDED',
      },
      403
    );
  }

  const displayName = sanitizeDisplayName(userDoc, verifiedToken);

  // ─── ENDPOINT 1: GET /api/rewards/state ────────────────────────────────────
  if (subPath === 'state' && request.method === 'GET') {
    const [walletDoc, userStateDoc, mcqsAnswered, milestoneClaimsDocs, asInviterDocs, asInviteeDocs] =
      await Promise.all([
        store.getDoc(`wallets/${uid}`),
        store.getDoc(`reward_user_state/${uid}`),
        computeAuthoritativeMcqsAnswered(store, uid),
        store.queryByField('reward_milestone_claims', 'uid', 'EQUAL', uid, 20),
        store.queryByField('reward_referrals', 'inviterUid', 'EQUAL', uid, 50),
        store.queryByField('reward_referrals', 'inviteeUid', 'EQUAL', uid, 10),
      ]);

    const myCode = await ensureUserReferralCode(store, uid, displayName);
    const pktMonth = getPktMonthString(nowMs);
    const monthDoc = await store.getDoc(`reward_inviter_months/${uid}_${pktMonth}`);
    let paidCountThisMonth = Math.max(0, Math.floor(Number(monthDoc?.paidCount ?? 0)));

    const claimedIds: Record<string, number> = {};
    for (const mc of milestoneClaimsDocs) {
      if (mc.milestoneId) {
        claimedIds[String(mc.milestoneId)] = Number(mc.claimedAtMs || nowMs);
      }
    }

    const daily = computeDailyProgressState({
      totalClaims: Number(userStateDoc?.totalClaims ?? 0),
      streakClaimsSinceReset: Number(
        userStateDoc?.streakClaimsSinceReset ?? userStateDoc?.totalClaims ?? 0
      ),
      lastClaimPktDate: userStateDoc?.lastClaimPktDate || null,
      nowMs,
      config,
    });

    const milestones = computeMilestonesState({
      mcqsAnswered,
      claimedIds,
      config,
    });

    // Build sanitized referral items (never expose other users' emails!)
    const referralItems: ReferralRecordPublic[] = [];
    const allRefs = [...asInviterDocs, ...asInviteeDocs];
    const seenRefIds = new Set<string>();
    let autoCompletedBalanceDelta = 0;

    for (const refDoc of allRefs) {
      const refId = String(refDoc._id || refDoc.id || '');
      if (!refId || seenRefIds.has(refId)) continue;
      seenRefIds.add(refId);

      const isInviter = refDoc.inviterUid === uid;
      let status = (refDoc.status || 'pending_confirmation') as ReferralStatus;
      const createdAtMs = Number(refDoc.createdAtMs || nowMs);
      const expiresAtMs =
        Number(refDoc.expiresAtMs) ||
        createdAtMs + config.referral.pendingExpiryDays * 24 * 60 * 60 * 1000;

      if (status === 'pending_confirmation' && nowMs > expiresAtMs) {
        status = 'expired';
      }

      const inviteeMcqs = isInviter
        ? await computeAuthoritativeMcqsAnswered(store, String(refDoc.inviteeUid))
        : mcqsAnswered;

      // Auto-complete if confirmed_waiting_mcqs and invitee now has >= minInviteeMcqs
      if (
        config.enabled &&
        status === 'confirmed_waiting_mcqs' &&
        inviteeMcqs >= config.referral.minInviteeMcqs
      ) {
        const res = await tryCompleteConfirmedReferralInTx({
          store,
          referralId: refId,
          config,
          nowMs,
        });
        status = res.status;
        if (res.completed) {
          if (isInviter) {
            paidCountThisMonth += 1;
            autoCompletedBalanceDelta += config.referral.inviterReward;
          } else {
            autoCompletedBalanceDelta += config.referral.inviteeReward;
          }
        }
      }

      referralItems.push({
        id: refId,
        role: isInviter ? 'inviter' : 'invitee',
        counterpartDisplayName: isInviter
          ? sanitizeDisplayName({ displayName: refDoc.inviteeDisplayName })
          : sanitizeDisplayName({ displayName: refDoc.inviterDisplayName }),
        status,
        inviteeMcqsAnswered: Math.min(inviteeMcqs, config.referral.minInviteeMcqs),
        minInviteeMcqs: config.referral.minInviteeMcqs,
        inviterReward: config.referral.inviterReward,
        inviteeReward: config.referral.inviteeReward,
        createdAtMs,
        expiresAtMs,
        confirmedAtMs: refDoc.confirmedAtMs ? Number(refDoc.confirmedAtMs) : null,
        completedAtMs: refDoc.completedAtMs ? Number(refDoc.completedAtMs) : null,
      });
    }

    referralItems.sort((a, b) => b.createdAtMs - a.createdAtMs);

    const alreadyAttachedInviter =
      Boolean(userStateDoc?.attachedReferralId) || asInviteeDocs.length > 0;
    const createdAtMs = parseTimestampMs(userDoc?.createdAt) ?? nowMs;
    const withinManualWindow =
      nowMs - createdAtMs <= config.referral.manualCodeWindowDays * 24 * 60 * 60 * 1000;
    const canAttachManualCode = !alreadyAttachedInviter && withinManualWindow;

    const currentBalance =
      Math.max(
        0,
        Math.floor(Number(walletDoc?.balance ?? userDoc?.kobans ?? userDoc?.kobanBalance ?? 0))
      ) + autoCompletedBalanceDelta;

    const responsePayload: RewardsStateResponse = {
      serverConfigured: true,
      enabled: config.enabled,
      comingSoon: !config.enabled,
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

  // All mutating POST endpoints require `config.enabled === true`
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' }, 405);
  }

  if (!config.enabled) {
    return jsonResponse(
      {
        ok: false,
        comingSoon: true,
        enabled: false,
        error: 'Boardly Rewards is coming soon. Claims are not enabled yet.',
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
    return jsonResponse({ ok: false, error: 'Invalid JSON request body.', code: 'INVALID_JSON' }, 400);
  }

  // ─── ENDPOINT 2: POST /api/rewards/daily/claim ─────────────────────────────
  if (subPath === 'daily/claim') {
    const pktDate = getPktDateString(nowMs);
    const claimDocId = buildDailyClaimDocId(uid, pktDate);

    try {
      const txResult = await store.runTransaction(async (tx) => {
        const existingClaim = await tx.getDoc(`reward_daily_claims/${claimDocId}`);
        if (existingClaim) {
          const err = new Error('You have already claimed your daily reward today.') as Error & {
            code?: string;
            status?: number;
          };
          err.code = 'ALREADY_CLAIMED_TODAY';
          err.status = 409;
          throw err;
        }

        const [userStateDoc, walletDoc, txUserDoc] = await Promise.all([
          tx.getDoc(`reward_user_state/${uid}`),
          tx.getDoc(`wallets/${uid}`),
          tx.getDoc(`users/${uid}`),
        ]);

        const dailyState = computeDailyProgressState({
          totalClaims: Number(userStateDoc?.totalClaims ?? 0),
          streakClaimsSinceReset: Number(
            userStateDoc?.streakClaimsSinceReset ?? userStateDoc?.totalClaims ?? 0
          ),
          lastClaimPktDate: userStateDoc?.lastClaimPktDate || null,
          nowMs,
          config,
        });

        if (dailyState.claimedToday) {
          const err = new Error('You have already claimed your daily reward today.') as Error & {
            code?: string;
            status?: number;
          };
          err.code = 'ALREADY_CLAIMED_TODAY';
          err.status = 409;
          throw err;
        }

        const dayNumber = dailyState.nextDayNumber;
        const rewardAmount = dailyState.nextRewardAmount;

        const currentBalance = Math.max(
          0,
          Math.floor(
            Number(walletDoc?.balance ?? txUserDoc?.kobans ?? txUserDoc?.kobanBalance ?? 0)
          )
        );
        const newBalance = currentBalance + rewardAmount;
        const ledgerId = `reward_daily_${claimDocId}`;

        // 1. Deterministic daily claim doc with `exists: false` precondition
        tx.createDoc(`reward_daily_claims/${claimDocId}`, {
          id: claimDocId,
          uid,
          pktDate,
          dayNumber,
          amount: rewardAmount,
          balanceAfter: newBalance,
          claimedAtMs: nowMs,
          timestamp: SERVER_TIMESTAMP_SENTINEL,
        });

        // 2. Ledger entry using exact app ledger shape
        tx.createDoc(`wallets/${uid}/ledger/${ledgerId}`, {
          id: ledgerId,
          type: 'reward_daily',
          amount: rewardAmount,
          balanceAfter: newBalance,
          reason: `Daily Check-in — Day ${dayNumber} (${pktDate})`,
          dayNumber,
          pktDate,
          timestamp: SERVER_TIMESTAMP_SENTINEL,
        });

        // 3. Increment balance in wallets/{uid} + mirror to users/{uid}
        tx.setDoc(
          `wallets/${uid}`,
          {
            balance: newBalance,
            owned: Array.isArray(walletDoc?.owned) ? walletDoc.owned : [],
            equipped: walletDoc?.equipped || {
              effect: null,
              frame: null,
              nameplate: null,
              avatar: null,
              banner: null,
            },
            updatedAt: SERVER_TIMESTAMP_SENTINEL,
          },
          true
        );

        tx.setDoc(
          `users/${uid}`,
          {
            kobans: newBalance,
            kobanBalance: newBalance,
            updatedAt: SERVER_TIMESTAMP_SENTINEL,
          },
          true
        );

        // 4. Update user check-in progress state
        const newTotalClaims = dailyState.totalClaims + 1;
        const newStreakClaims = dailyState.effectiveCycleClaims + 1;
        tx.setDoc(
          `reward_user_state/${uid}`,
          {
            uid,
            totalClaims: newTotalClaims,
            streakClaimsSinceReset: newStreakClaims,
            lastClaimPktDate: pktDate,
            updatedAt: SERVER_TIMESTAMP_SENTINEL,
          },
          true
        );

        const updatedDaily = computeDailyProgressState({
          totalClaims: newTotalClaims,
          streakClaimsSinceReset: newStreakClaims,
          lastClaimPktDate: pktDate,
          nowMs,
          config,
        });

        return {
          dayNumber,
          rewardAmount,
          newBalance,
          pktDate,
          daily: updatedDaily,
        };
      });

      return jsonResponse(
        {
          ok: true,
          ...txResult,
        },
        200
      );
    } catch (err: any) {
      const status =
        err?.code === 'ALREADY_CLAIMED_TODAY' || err?.status === 409 || err?.status === 400
          ? 409
          : 500;
      return jsonResponse(
        {
          ok: false,
          error:
            status === 409
              ? 'Already claimed for today (PKT).'
              : err?.message || 'Failed to claim daily reward.',
          code: status === 409 ? 'ALREADY_CLAIMED_TODAY' : 'CLAIM_FAILED',
        },
        status
      );
    }
  }

  // ─── ENDPOINT 3: POST /api/rewards/milestone/claim ─────────────────────────
  if (subPath === 'milestone/claim') {
    const requestedId = String(body.id || '').trim();
    const def = DEFAULT_MILESTONES.find(
      (m) => m.id === requestedId || String(m.threshold) === requestedId
    );
    if (!def) {
      return jsonResponse(
        { ok: false, error: 'Invalid milestone ID.', code: 'INVALID_MILESTONE' },
        400
      );
    }

    const mcqsAnswered = await computeAuthoritativeMcqsAnswered(store, uid);
    if (mcqsAnswered < def.threshold) {
      return jsonResponse(
        {
          ok: false,
          error: `You need ${def.threshold} completed MCQs to claim this milestone (currently ${mcqsAnswered}).`,
          code: 'MILESTONE_NOT_REACHED',
          mcqsAnswered,
          threshold: def.threshold,
        },
        400
      );
    }

    const customReward = Number(config.milestones[String(def.threshold)] ?? def.reward);
    const rewardAmount =
      Number.isFinite(customReward) && customReward > 0 ? Math.floor(customReward) : def.reward;
    const claimDocId = buildMilestoneClaimDocId(uid, def.id);

    try {
      const txResult = await store.runTransaction(async (tx) => {
        const existingClaim = await tx.getDoc(`reward_milestone_claims/${claimDocId}`);
        if (existingClaim) {
          const err = new Error('Milestone already claimed.') as Error & {
            code?: string;
            status?: number;
          };
          err.code = 'ALREADY_CLAIMED_MILESTONE';
          err.status = 409;
          throw err;
        }

        const [walletDoc, txUserDoc] = await Promise.all([
          tx.getDoc(`wallets/${uid}`),
          tx.getDoc(`users/${uid}`),
        ]);

        const currentBalance = Math.max(
          0,
          Math.floor(
            Number(walletDoc?.balance ?? txUserDoc?.kobans ?? txUserDoc?.kobanBalance ?? 0)
          )
        );
        const newBalance = currentBalance + rewardAmount;
        const ledgerId = `reward_milestone_${claimDocId}`;

        tx.createDoc(`reward_milestone_claims/${claimDocId}`, {
          id: claimDocId,
          uid,
          milestoneId: def.id,
          threshold: def.threshold,
          amount: rewardAmount,
          balanceAfter: newBalance,
          mcqsAnsweredAtClaim: mcqsAnswered,
          claimedAtMs: nowMs,
          timestamp: SERVER_TIMESTAMP_SENTINEL,
        });

        tx.createDoc(`wallets/${uid}/ledger/${ledgerId}`, {
          id: ledgerId,
          type: 'reward_milestone',
          amount: rewardAmount,
          balanceAfter: newBalance,
          reason: `MCQ Milestone — ${def.threshold} MCQs Answered`,
          milestoneId: def.id,
          threshold: def.threshold,
          timestamp: SERVER_TIMESTAMP_SENTINEL,
        });

        tx.setDoc(
          `wallets/${uid}`,
          {
            balance: newBalance,
            owned: Array.isArray(walletDoc?.owned) ? walletDoc.owned : [],
            equipped: walletDoc?.equipped || {
              effect: null,
              frame: null,
              nameplate: null,
              avatar: null,
              banner: null,
            },
            updatedAt: SERVER_TIMESTAMP_SENTINEL,
          },
          true
        );

        tx.setDoc(
          `users/${uid}`,
          {
            kobans: newBalance,
            kobanBalance: newBalance,
            updatedAt: SERVER_TIMESTAMP_SENTINEL,
          },
          true
        );

        return {
          milestoneId: def.id,
          threshold: def.threshold,
          rewardAmount,
          newBalance,
        };
      });

      return jsonResponse({ ok: true, ...txResult }, 200);
    } catch (err: any) {
      const status =
        err?.code === 'ALREADY_CLAIMED_MILESTONE' || err?.status === 409 ? 409 : 500;
      return jsonResponse(
        {
          ok: false,
          error:
            status === 409
              ? 'This milestone has already been claimed.'
              : err?.message || 'Failed to claim milestone reward.',
          code: status === 409 ? 'ALREADY_CLAIMED_MILESTONE' : 'CLAIM_FAILED',
        },
        status
      );
    }
  }

  // ─── ENDPOINT 4: POST /api/rewards/referral/attach ─────────────────────────
  if (subPath === 'referral/attach') {
    const normalizedCode = normalizeReferralCode(body.code);
    if (!isValidReferralCodeFormat(normalizedCode)) {
      return jsonResponse(
        {
          ok: false,
          error: 'Please enter a valid referral code in the format BLD-XXXXXX.',
          code: 'INVALID_CODE_FORMAT',
        },
        400
      );
    }

    // Invitee must have a verified email
    const emailVerified =
      verifiedToken.emailVerified === true ||
      userDoc?.emailVerified === true ||
      userDoc?.verified === true;
    if (!emailVerified) {
      return jsonResponse(
        {
          ok: false,
          error: 'Please verify your email address before attaching a referral code.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        400
      );
    }

    // Check 7-day manual attach window from account creation
    const inviteeCreatedAtMs = parseTimestampMs(userDoc?.createdAt);
    if (
      inviteeCreatedAtMs &&
      nowMs - inviteeCreatedAtMs > config.referral.manualCodeWindowDays * 24 * 60 * 60 * 1000
    ) {
      return jsonResponse(
        {
          ok: false,
          error: `Referral codes can only be attached within ${config.referral.manualCodeWindowDays} days of signup.`,
          code: 'ATTACH_WINDOW_EXPIRED',
        },
        400
      );
    }

    // Look up inviter by code
    const codeDoc = await store.getDoc(`reward_referral_codes/${normalizedCode}`);
    if (!codeDoc || !codeDoc.uid) {
      return jsonResponse(
        {
          ok: false,
          error: 'No student account found with that referral code.',
          code: 'CODE_NOT_FOUND',
        },
        404
      );
    }

    const inviterUid = String(codeDoc.uid);
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

    // Check mutual referral (if invitee previously invited inviter)
    const reverseRef = await store.getDoc(`reward_referrals/${uid}_${inviterUid}`);
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

    // Inviter account must be at least 24 hours old
    const inviterUserDoc = await store.getDoc(`users/${inviterUid}`);
    if (isUserSuspended(inviterUserDoc)) {
      return jsonResponse(
        {
          ok: false,
          error: 'That inviter account is not eligible for referrals.',
          code: 'INVITER_INELIGIBLE',
        },
        400
      );
    }

    const inviterCreatedAtMs = parseTimestampMs(inviterUserDoc?.createdAt);
    if (inviterCreatedAtMs && nowMs - inviterCreatedAtMs < 24 * 60 * 60 * 1000) {
      return jsonResponse(
        {
          ok: false,
          error: 'Inviter accounts must be at least 24 hours old before referring friends.',
          code: 'INVITER_TOO_NEW',
        },
        400
      );
    }

    // Ensure invitee has their own permanent code so the inviter can confirm it in Step 2
    const inviteeOwnCode = await ensureUserReferralCode(store, uid, displayName);
    const inviterDisplayName = sanitizeDisplayName(inviterUserDoc);

    // Check IP velocity (> 2 referral attaches from same IP hash in 24h -> flag)
    const rawIp =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      'unknown-ip';
    const ipHash = await sha256Hex(`boardly_ref_ip:${rawIp}`);
    const pktDate = getPktDateString(nowMs);
    const ipKey = `${ipHash}_${pktDate}`;

    const referralId = `${inviterUid}_${uid}`;
    const expiresAtMs = nowMs + config.referral.pendingExpiryDays * 24 * 60 * 60 * 1000;

    try {
      const attachResult = await store.runTransaction(async (tx) => {
        const inviteeState = await tx.getDoc(`reward_user_state/${uid}`);
        if (inviteeState?.attachedReferralId) {
          const err = new Error('You have already attached a referral code.') as Error & {
            code?: string;
            status?: number;
          };
          err.code = 'ALREADY_ATTACHED';
          err.status = 409;
          throw err;
        }

        const existingRef = await tx.getDoc(`reward_referrals/${referralId}`);
        if (existingRef) {
          const err = new Error('This referral is already attached.') as Error & {
            code?: string;
            status?: number;
          };
          err.code = 'ALREADY_ATTACHED';
          err.status = 409;
          throw err;
        }

        const ipDoc = await tx.getDoc(`reward_ip_attaches/${ipKey}`);
        const prevIpCount = Math.max(0, Math.floor(Number(ipDoc?.count ?? 0)));
        const newIpCount = prevIpCount + 1;
        const isFlagged = newIpCount > 2;
        const initialStatus: ReferralStatus = isFlagged ? 'flagged' : 'pending_confirmation';

        tx.createDoc(`reward_referrals/${referralId}`, {
          id: referralId,
          inviterUid,
          inviteeUid: uid,
          inviterDisplayName,
          inviteeDisplayName: displayName,
          inviterCode: normalizedCode,
          inviteeCode: inviteeOwnCode,
          status: initialStatus,
          isFlagged,
          payoutCompleted: false,
          createdAtMs: nowMs,
          expiresAtMs,
          updatedAtMs: nowMs,
          createdAt: SERVER_TIMESTAMP_SENTINEL,
        });

        tx.setDoc(
          `reward_user_state/${uid}`,
          {
            uid,
            attachedReferralId: referralId,
            attachedInviterCode: normalizedCode,
            updatedAt: SERVER_TIMESTAMP_SENTINEL,
          },
          true
        );

        tx.setDoc(
          `reward_ip_attaches/${ipKey}`,
          {
            ipHash,
            pktDate,
            count: newIpCount,
            updatedAt: SERVER_TIMESTAMP_SENTINEL,
          },
          true
        );

        // Send in-app notification to inviter
        tx.setDoc(`notifications/ref_attach_${referralId}`, {
          userId: inviterUid,
          type: 'system',
          title: 'New Referral Pending Confirmation!',
          message: `${displayName} attached your referral code (${normalizedCode}). Ask them for their code and confirm it on the Boardly Rewards page!`,
          link: '/rewards',
          read: false,
          createdAt: SERVER_TIMESTAMP_SENTINEL,
        });

        return {
          referralId,
          status: initialStatus,
          inviterDisplayName,
          inviteeCode: inviteeOwnCode,
        };
      });

      return jsonResponse({ ok: true, ...attachResult }, 200);
    } catch (err: any) {
      const status = err?.code === 'ALREADY_ATTACHED' || err?.status === 409 ? 409 : 500;
      return jsonResponse(
        {
          ok: false,
          error:
            status === 409
              ? 'You have already attached an inviter referral code.'
              : err?.message || 'Failed to attach referral code.',
          code: status === 409 ? 'ALREADY_ATTACHED' : 'ATTACH_FAILED',
        },
        status
      );
    }
  }

  // ─── ENDPOINT 5: POST /api/rewards/referral/accept ─────────────────────────
  if (subPath === 'referral/accept') {
    const referralId = String(body.referralId || '').trim();
    const enteredCode = normalizeReferralCode(body.enteredCode);

    if (!referralId) {
      return jsonResponse(
        { ok: false, error: 'Missing referralId.', code: 'MISSING_REFERRAL_ID' },
        400
      );
    }

    const refDoc = await store.getDoc(`reward_referrals/${referralId}`);
    if (!refDoc || refDoc.inviterUid !== uid) {
      return jsonResponse(
        { ok: false, error: 'Referral not found.', code: 'REFERRAL_NOT_FOUND' },
        404
      );
    }

    const inviteeUid = String(refDoc.inviteeUid);
    const pktMonth = getPktMonthString(nowMs);
    const [inviteeMcqsAnswered, monthDoc] = await Promise.all([
      computeAuthoritativeMcqsAnswered(store, inviteeUid),
      store.getDoc(`reward_inviter_months/${uid}_${pktMonth}`),
    ]);

    const inviterPaidCountThisMonth = Math.max(0, Math.floor(Number(monthDoc?.paidCount ?? 0)));

    const resolution = evaluateReferralResolution({
      currentStatus: (refDoc.status || 'pending_confirmation') as ReferralStatus,
      createdAtMs: Number(refDoc.createdAtMs || nowMs),
      nowMs,
      enteredCode,
      expectedInviteeCode: String(refDoc.inviteeCode || ''),
      inviteeMcqsAnswered,
      inviterPaidCountThisMonth,
      isFlagged: refDoc.isFlagged === true,
      config: config.referral,
    });

    if (resolution.errorCode) {
      if (resolution.nextStatus !== refDoc.status) {
        await store.setDoc(
          `reward_referrals/${referralId}`,
          {
            status: resolution.nextStatus,
            updatedAtMs: nowMs,
            updatedAt: SERVER_TIMESTAMP_SENTINEL,
          },
          true
        );
      }
      return jsonResponse(
        {
          ok: false,
          error: resolution.errorMessage || 'Unable to confirm referral.',
          code: resolution.errorCode,
          status: resolution.nextStatus,
        },
        400
      );
    }

    // If invitee hasn't completed 20 MCQs yet, transition to confirmed_waiting_mcqs
    if (resolution.nextStatus === 'confirmed_waiting_mcqs') {
      await store.setDoc(
        `reward_referrals/${referralId}`,
        {
          status: 'confirmed_waiting_mcqs',
          confirmedAtMs: nowMs,
          updatedAtMs: nowMs,
          updatedAt: SERVER_TIMESTAMP_SENTINEL,
        },
        true
      );
      return jsonResponse(
        {
          ok: true,
          referralId,
          status: 'confirmed_waiting_mcqs',
          paid: false,
          inviteeMcqsAnswered,
          minInviteeMcqs: config.referral.minInviteeMcqs,
          message: `Code confirmed! Rewards will be credited automatically once your friend completes ${config.referral.minInviteeMcqs} MCQs (currently ${inviteeMcqsAnswered}/${config.referral.minInviteeMcqs}).`,
        },
        200
      );
    }

    // Both confirmed and >= 20 MCQs -> execute atomic payout transaction!
    const payoutRes = await tryCompleteConfirmedReferralInTx({
      store,
      referralId,
      config,
      nowMs,
    });

    if (!payoutRes.completed) {
      return jsonResponse(
        {
          ok: false,
          error: payoutRes.errorMessage || 'Could not complete referral payout.',
          code: payoutRes.errorCode || 'PAYOUT_FAILED',
          status: payoutRes.status,
        },
        400
      );
    }

    return jsonResponse(
      {
        ok: true,
        referralId,
        status: 'completed',
        paid: true,
        inviterReward: config.referral.inviterReward,
        inviteeReward: config.referral.inviteeReward,
      },
      200
    );
  }

  return jsonResponse({ ok: false, error: 'Unknown rewards endpoint.', code: 'NOT_FOUND' }, 404);
}

// Cloudflare Pages Function entrypoint for `/functions/api/rewards/[[path]].ts`
export async function onRequest(context: {
  request: Request;
  env?: RewardsEnv;
}): Promise<Response> {
  return handleRewardsApiRequest({
    request: context.request,
    env: context.env,
  });
}

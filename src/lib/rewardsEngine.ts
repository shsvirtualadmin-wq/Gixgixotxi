/**
 * Boardly Rewards — Pure Domain Logic, Schedule, Timezone (PKT UTC+5),
 * Milestones, and Referral State Machine.
 *
 * Used by both server endpoints (/functions/api/rewards/*) and unit tests.
 */

export const REWARDS_TIMEZONE = 'Asia/Karachi';
export const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC+5 (Pakistan Standard Time has no DST)

/** Unambiguous uppercase alphanumeric alphabet (excludes 0, O, 1, I) */
export const REFERRAL_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * 30-day check-in schedule:
 * Day 1 = 50, Day 2 = 100, Day 3 = 200, Day 4 = 400,
 * Days 5–29 = 200 each except Days 7, 14, 21, 28 = 400,
 * Day 30 = 1000.
 * Total per 30-day cycle = 7,550 Kobans.
 */
export const DEFAULT_DAILY_LADDER: readonly number[] = [
  50,   // Day 1
  100,  // Day 2
  200,  // Day 3
  400,  // Day 4 (chest)
  200,  // Day 5
  200,  // Day 6
  400,  // Day 7 (chest)
  200,  // Day 8
  200,  // Day 9
  200,  // Day 10
  200,  // Day 11
  200,  // Day 12
  200,  // Day 13
  400,  // Day 14 (chest)
  200,  // Day 15
  200,  // Day 16
  200,  // Day 17
  200,  // Day 18
  200,  // Day 19
  200,  // Day 20
  400,  // Day 21 (chest)
  200,  // Day 22
  200,  // Day 23
  200,  // Day 24
  200,  // Day 25
  200,  // Day 26
  200,  // Day 27
  400,  // Day 28 (chest)
  200,  // Day 29
  1000, // Day 30 (grand chest)
] as const;

export const CHEST_DAYS: ReadonlySet<number> = new Set([4, 7, 14, 21, 28, 30]);

export interface MilestoneDefinition {
  id: string;
  threshold: number;
  reward: number;
  title: string;
  subtitle: string;
}

export const DEFAULT_MILESTONES: readonly MilestoneDefinition[] = [
  {
    id: 'mcq_50',
    threshold: 50,
    reward: 100,
    title: 'First 50 MCQs',
    subtitle: 'Answer 50 practice MCQs across any subject or university track',
  },
  {
    id: 'mcq_100',
    threshold: 100,
    reward: 250,
    title: 'Century Scholar',
    subtitle: 'Answer 100 practice MCQs with verified completions',
  },
  {
    id: 'mcq_250',
    threshold: 250,
    reward: 500,
    title: 'Quarter-Thousand Grinder',
    subtitle: 'Answer 250 practice MCQs to sharpen exam speed',
  },
  {
    id: 'mcq_500',
    threshold: 500,
    reward: 1000,
    title: 'Half-Thousand Master',
    subtitle: 'Answer 500 practice MCQs on your path to the Dragon',
  },
] as const;

export interface ReferralConfig {
  inviterReward: number;
  inviteeReward: number;
  minInviteeMcqs: number;
  maxPaidPerInviterPerMonth: number;
  pendingExpiryDays: number;
  manualCodeWindowDays: number;
}

export interface RewardsConfig {
  enabled: boolean;
  timezone: string;
  dailyLadder: number[];
  resetOnMiss: boolean;
  milestones: Record<string, number>;
  referral: ReferralConfig;
}

export const DEFAULT_REWARDS_CONFIG: RewardsConfig = {
  enabled: false,
  timezone: REWARDS_TIMEZONE,
  dailyLadder: [...DEFAULT_DAILY_LADDER],
  resetOnMiss: false,
  milestones: {
    '50': 100,
    '100': 250,
    '250': 500,
    '500': 1000,
  },
  referral: {
    inviterReward: 5000,
    inviteeReward: 1000,
    minInviteeMcqs: 20,
    maxPaidPerInviterPerMonth: 10,
    pendingExpiryDays: 14,
    manualCodeWindowDays: 7,
  },
};

export type RewardLedgerEntryType =
  | 'reward_daily'
  | 'reward_milestone'
  | 'reward_referral_inviter'
  | 'reward_referral_invitee';

export type ReferralStatus =
  | 'pending_confirmation'
  | 'confirmed_waiting_mcqs'
  | 'completed'
  | 'expired'
  | 'capped'
  | 'flagged';

export interface ReferralRecordPublic {
  id: string;
  role: 'inviter' | 'invitee';
  counterpartDisplayName: string;
  counterpartCode?: string;
  status: ReferralStatus;
  inviteeMcqsAnswered: number;
  minInviteeMcqs: number;
  inviterReward: number;
  inviteeReward: number;
  createdAtMs: number;
  expiresAtMs: number;
  confirmedAtMs?: number | null;
  completedAtMs?: number | null;
}

export interface DailyProgressState {
  totalClaims: number;
  effectiveCycleClaims: number;
  completedDaysInCycle: number;
  nextDayNumber: number; // 1..30
  nextRewardAmount: number;
  claimedToday: boolean;
  lastClaimPktDate: string | null;
  currentPktDate: string;
  secondsUntilNextPktMidnight: number;
  cycleTotalKobans: number;
  wasResetForMiss: boolean;
}

export interface MilestoneItemState {
  id: string;
  threshold: number;
  reward: number;
  title: string;
  subtitle: string;
  claimed: boolean;
  claimedAtMs?: number | null;
  eligible: boolean;
  progress: number;
}

export interface RewardsStateResponse {
  serverConfigured: boolean;
  enabled: boolean;
  comingSoon: boolean;
  timezone: string;
  balance: number;
  daily: DailyProgressState;
  dailyLadder: number[];
  mcqsAnswered: number;
  milestones: MilestoneItemState[];
  dragonMilestone: {
    threshold: 1000;
    unlocked: boolean;
    progress: number;
  };
  referral: {
    myCode: string;
    shareUrl: string;
    canAttachManualCode: boolean;
    alreadyAttachedInviter: boolean;
    paidCountThisMonth: number;
    maxPaidPerMonth: number;
    config: ReferralConfig;
    items: ReferralRecordPublic[];
  };
}

/**
 * Returns YYYY-MM-DD in Asia/Karachi (UTC+5).
 */
export function getPktDateString(nowMs: number = Date.now()): string {
  const pktMs = nowMs + PKT_OFFSET_MS;
  const d = new Date(pktMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns YYYY-MM in Asia/Karachi (UTC+5) for monthly cap tracking.
 */
export function getPktMonthString(nowMs: number = Date.now()): string {
  return getPktDateString(nowMs).slice(0, 7);
}

/**
 * Returns the previous calendar day YYYY-MM-DD in Asia/Karachi (UTC+5).
 */
export function getPreviousPktDateString(pktDateStr: string): string {
  const [y, m, d] = pktDateStr.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  const prevMs = utcMidnight - 24 * 60 * 60 * 1000;
  const prev = new Date(prevMs);
  const py = prev.getUTCFullYear();
  const pm = String(prev.getUTCMonth() + 1).padStart(2, '0');
  const pd = String(prev.getUTCDate()).padStart(2, '0');
  return `${py}-${pm}-${pd}`;
}

/**
 * Returns integer seconds remaining until the next 00:00:00 PKT (UTC+5).
 */
export function getSecondsUntilNextPktMidnight(nowMs: number = Date.now()): number {
  const pktMs = nowMs + PKT_OFFSET_MS;
  const d = new Date(pktMs);
  const nextMidnightPktUtcMs = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  const diffMs = Math.max(0, nextMidnightPktUtcMs - pktMs);
  return Math.max(1, Math.ceil(diffMs / 1000));
}

/**
 * Deterministic document ID for daily check-in claim: `${uid}_${pktDate}`
 */
export function buildDailyClaimDocId(uid: string, pktDate: string): string {
  return `${uid}_${pktDate}`;
}

/**
 * Deterministic document ID for milestone claim: `${uid}_${milestoneId}`
 */
export function buildMilestoneClaimDocId(uid: string, milestoneId: string): string {
  return `${uid}_${milestoneId}`;
}

/**
 * Computes the user's 30-day check-in state on the server.
 */
export function computeDailyProgressState(params: {
  totalClaims: number;
  streakClaimsSinceReset?: number;
  lastClaimPktDate: string | null;
  nowMs?: number;
  config?: Partial<RewardsConfig>;
}): DailyProgressState {
  const nowMs = params.nowMs ?? Date.now();
  const ladder =
    Array.isArray(params.config?.dailyLadder) && params.config!.dailyLadder.length === 30
      ? params.config!.dailyLadder
      : [...DEFAULT_DAILY_LADDER];
  const resetOnMiss = Boolean(params.config?.resetOnMiss ?? DEFAULT_REWARDS_CONFIG.resetOnMiss);

  const currentPktDate = getPktDateString(nowMs);
  const yesterdayPktDate = getPreviousPktDateString(currentPktDate);
  const lastClaimPktDate = params.lastClaimPktDate || null;
  const claimedToday = lastClaimPktDate === currentPktDate;

  const rawTotalClaims = Math.max(0, Math.floor(Number(params.totalClaims) || 0));
  const rawStreakClaims = Math.max(
    0,
    Math.floor(Number(params.streakClaimsSinceReset ?? rawTotalClaims) || 0)
  );

  let effectiveCycleClaims = resetOnMiss ? rawStreakClaims : rawTotalClaims;
  let wasResetForMiss = false;

  if (
    resetOnMiss &&
    lastClaimPktDate &&
    lastClaimPktDate !== currentPktDate &&
    lastClaimPktDate !== yesterdayPktDate
  ) {
    effectiveCycleClaims = 0;
    wasResetForMiss = true;
  }

  const nextDayNumber = (effectiveCycleClaims % 30) + 1;
  const completedDaysInCycle = claimedToday
    ? ((effectiveCycleClaims - 1 + 30) % 30) + 1
    : effectiveCycleClaims % 30;
  const nextRewardAmount = ladder[nextDayNumber - 1] ?? 200;
  const cycleTotalKobans = ladder.reduce((acc, v) => acc + Number(v || 0), 0);

  return {
    totalClaims: rawTotalClaims,
    effectiveCycleClaims,
    completedDaysInCycle,
    nextDayNumber,
    nextRewardAmount,
    claimedToday,
    lastClaimPktDate,
    currentPktDate,
    secondsUntilNextPktMidnight: getSecondsUntilNextPktMidnight(nowMs),
    cycleTotalKobans,
    wasResetForMiss,
  };
}

/**
 * Normalizes any user-entered referral code to uppercase `BLD-XXXXXX`.
 * Accepts `BLD-XXXXXX`, `bld-xxxxxx`, or bare 6-char `XXXXXX`.
 */
export function normalizeReferralCode(raw: string | null | undefined): string {
  const cleaned = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('BLD-')) {
    return cleaned;
  }
  if (cleaned.startsWith('BLD') && cleaned.length === 9) {
    return `BLD-${cleaned.slice(3)}`;
  }
  if (/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(cleaned)) {
    return `BLD-${cleaned}`;
  }
  return cleaned;
}

/**
 * Validates that a normalized code matches `BLD-XXXXXX` using unambiguous characters.
 */
export function isValidReferralCodeFormat(code: string): boolean {
  return /^BLD-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code);
}

/**
 * Generates a deterministic unambiguous referral code `BLD-XXXXXX` from a UID + salt
 * (so each user gets a permanent, collision-resistant code without ambiguous chars).
 */
export function generateDeterministicReferralCode(uid: string, attempt = 0): string {
  const input = `boardly_ref_v1:${uid}:${attempt}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= ch + i * 31;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  const chars: string[] = [];
  let seedA = h1 >>> 0;
  let seedB = h2 >>> 0;
  for (let i = 0; i < 6; i++) {
    const combined = ((seedA >>> (i * 4)) ^ (seedB >>> ((5 - i) * 3)) ^ (i * 97)) >>> 0;
    const idx = combined % REFERRAL_ALPHABET.length;
    chars.push(REFERRAL_ALPHABET[idx]);
    seedA = Math.imul(seedA ^ idx, 1664525) + 1013904223;
    seedB = Math.imul(seedB ^ (idx + 7), 22695477) + 1;
  }
  return `BLD-${chars.join('')}`;
}

/**
 * Resolves the milestone list and each milestone's progress/eligibility.
 */
export function computeMilestonesState(params: {
  mcqsAnswered: number;
  claimedIds: Record<string, number>; // milestoneId -> claimedAtMs
  config?: Partial<RewardsConfig>;
}): MilestoneItemState[] {
  const mcqs = Math.max(0, Math.floor(Number(params.mcqsAnswered) || 0));
  const configMilestones = params.config?.milestones || DEFAULT_REWARDS_CONFIG.milestones;

  return DEFAULT_MILESTONES.map((def) => {
    const customReward = Number(configMilestones[String(def.threshold)] ?? def.reward);
    const reward = Number.isFinite(customReward) && customReward > 0 ? customReward : def.reward;
    const claimedAtMs = params.claimedIds[def.id] ?? null;
    const claimed = Boolean(claimedAtMs);
    const progress = Math.min(mcqs, def.threshold);
    const eligible = !claimed && mcqs >= def.threshold;

    return {
      id: def.id,
      threshold: def.threshold,
      reward,
      title: def.title,
      subtitle: def.subtitle,
      claimed,
      claimedAtMs,
      eligible,
      progress,
    };
  });
}

/**
 * Evaluates referral status transitions (expiry, waiting on MCQs, monthly cap, completion).
 */
export function evaluateReferralResolution(params: {
  currentStatus: ReferralStatus;
  createdAtMs: number;
  nowMs?: number;
  enteredCode?: string;
  expectedInviteeCode: string;
  inviteeMcqsAnswered: number;
  inviterPaidCountThisMonth: number;
  isFlagged?: boolean;
  config?: ReferralConfig;
}): {
  nextStatus: ReferralStatus;
  shouldPay: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  const nowMs = params.nowMs ?? Date.now();
  const cfg = params.config || DEFAULT_REWARDS_CONFIG.referral;

  if (params.isFlagged || params.currentStatus === 'flagged') {
    return {
      nextStatus: 'flagged',
      shouldPay: false,
      errorCode: 'REFERRAL_FLAGGED',
      errorMessage: 'This referral has been flagged for manual review.',
    };
  }

  if (params.currentStatus === 'completed') {
    return {
      nextStatus: 'completed',
      shouldPay: false,
    };
  }

  if (params.currentStatus === 'capped') {
    return {
      nextStatus: 'capped',
      shouldPay: false,
      errorCode: 'MONTHLY_CAP_REACHED',
      errorMessage: 'Monthly referral reward limit reached for this inviter.',
    };
  }

  const expiryMs = params.createdAtMs + cfg.pendingExpiryDays * 24 * 60 * 60 * 1000;
  if (nowMs > expiryMs && params.currentStatus === 'pending_confirmation') {
    return {
      nextStatus: 'expired',
      shouldPay: false,
      errorCode: 'REFERRAL_EXPIRED',
      errorMessage: `This referral expired after ${cfg.pendingExpiryDays} days without confirmation.`,
    };
  }

  if (params.currentStatus === 'expired') {
    return {
      nextStatus: 'expired',
      shouldPay: false,
      errorCode: 'REFERRAL_EXPIRED',
      errorMessage: 'This referral has expired.',
    };
  }

  // If currently pending_confirmation, verify the invitee's code entered by the inviter
  if (params.currentStatus === 'pending_confirmation') {
    const normalizedEntered = normalizeReferralCode(params.enteredCode);
    const normalizedExpected = normalizeReferralCode(params.expectedInviteeCode);
    if (!normalizedEntered || normalizedEntered !== normalizedExpected) {
      return {
        nextStatus: 'pending_confirmation',
        shouldPay: false,
        errorCode: 'CODE_MISMATCH',
        errorMessage: "The code entered does not match your friend's referral code.",
      };
    }
  }

  // Code matches (or was already in confirmed_waiting_mcqs)
  if (params.inviteeMcqsAnswered < cfg.minInviteeMcqs) {
    return {
      nextStatus: 'confirmed_waiting_mcqs',
      shouldPay: false,
    };
  }

  // Invitee has answered >= minInviteeMcqs; check inviter's monthly paid cap
  if (params.inviterPaidCountThisMonth >= cfg.maxPaidPerInviterPerMonth) {
    return {
      nextStatus: 'capped',
      shouldPay: false,
      errorCode: 'MONTHLY_CAP_REACHED',
      errorMessage: `Monthly cap of ${cfg.maxPaidPerInviterPerMonth} paid referrals reached.`,
    };
  }

  return {
    nextStatus: 'completed',
    shouldPay: true,
  };
}

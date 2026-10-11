import { PRICING_PLANS, normalizePlan, PlanKey } from '../config/pricing';

export type PlanType = 'free' | 'pro' | 'premium' | 'starter' | 'steady_climb' | 'all_access';

export interface PlanLimitConfig {
  id: 'free' | 'pro' | 'premium';
  name: 'Free' | 'Pro' | 'Premium';
  badge: string;
  testsPerDay: number; // 999999 represents unlimited
  boardyPerDay: number;
  description: string;
  priceMonthlyPkr: number;
}

export const PLAN_LIMITS: Record<string, PlanLimitConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    badge: 'Standard',
    testsPerDay: PRICING_PLANS.free.limits.testsPerDay,
    boardyPerDay: PRICING_PLANS.free.limits.boardyPerDay,
    description: '2 practice tests and 3 Boardy AI questions daily. Foundation drills for FSC and Entry Tests.',
    priceMonthlyPkr: PRICING_PLANS.free.basePrice,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    badge: 'Popular',
    testsPerDay: PRICING_PLANS.pro.limits.testsPerDay,
    boardyPerDay: PRICING_PLANS.pro.limits.boardyPerDay,
    description: '10 tests and 7 Boardy AI questions daily. Full chapter question banks and university past paper formats.',
    priceMonthlyPkr: PRICING_PLANS.pro.basePrice,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    badge: 'Unlimited Tests',
    testsPerDay: PRICING_PLANS.premium.limits.testsPerDay,
    boardyPerDay: PRICING_PLANS.premium.limits.boardyPerDay,
    description: 'Unlimited practice tests and 15 Boardy AI questions daily. Merit Meter simulations and national mock sessions.',
    priceMonthlyPkr: PRICING_PLANS.premium.basePrice,
  },
};

// Legacy compatibility aliases
PLAN_LIMITS['starter'] = PLAN_LIMITS.free;
PLAN_LIMITS['steady_climb'] = PLAN_LIMITS.pro;
PLAN_LIMITS['all_access'] = PLAN_LIMITS.premium;

/**
 * Normalizes legacy plan names ('starter', 'steady_climb', 'all_access') to the strict 'free' | 'pro' | 'premium' paradigm.
 */
export function normalizePlanId(plan?: string | null): PlanType {
  return normalizePlan(plan);
}

export function getPlanConfig(plan?: string | null): PlanLimitConfig {
  const normalized = normalizePlanId(plan);
  return PLAN_LIMITS[normalized] || PLAN_LIMITS.free;
}

/**
 * Returns upgrade prompt configuration:
 * - Free sees "Upgrade to Pro"
 * - Pro sees "Upgrade to Premium"
 * - Premium and Admin see no upgrade prompt (returns null)
 */
export function getUpgradePrompt(plan?: string | null, isAdmin?: boolean): { targetPlan: PlanType; label: string } | null {
  if (isAdmin) return null;
  const current = normalizePlanId(plan);
  if (current === 'free') {
    return { targetPlan: 'pro', label: 'Upgrade to Pro' };
  }
  if (current === 'pro') {
    return { targetPlan: 'premium', label: 'Upgrade to Premium' };
  }
  return null;
}

export function getKarachiTodayString(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function getTimeUntilKarachiMidnight(): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  progressPercent: number;
  formattedCountdown: string;
} {
  const now = new Date();
  const karachiDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
  const karachiDate = new Date(karachiDateString);
  const nextMidnight = new Date(karachiDate);
  nextMidnight.setHours(24, 0, 0, 0);

  const diffMs = Math.max(0, nextMidnight.getTime() - karachiDate.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  const totalDayMinutes = 24 * 60;
  const elapsedMinutes = totalDayMinutes - diffMinutes;
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMinutes / totalDayMinutes) * 100)));

  return {
    hours,
    minutes,
    totalMinutes: diffMinutes,
    progressPercent,
    formattedCountdown: `${hours}h ${minutes}m`,
  };
}

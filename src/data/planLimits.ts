export type PlanType = 'starter' | 'steady_climb' | 'all_access';

export interface PlanLimitConfig {
  id: PlanType;
  name: string;
  badge: string;
  testsPerDay: number; // 999 represents unlimited
  boardyPerDay: number;
  description: string;
  priceMonthlyPkr: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimitConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    badge: 'Free Forever',
    testsPerDay: 2,
    boardyPerDay: 3,
    description: '2 tests and 3 Boardy questions every day. Perfect for daily consistency.',
    priceMonthlyPkr: 0,
  },
  steady_climb: {
    id: 'steady_climb',
    name: 'Steady Climb',
    badge: 'Most Popular',
    testsPerDay: 10,
    boardyPerDay: 7,
    description: 'Steady Climb opens every chapter and gives you 10 tests and 7 Boardy questions a day.',
    priceMonthlyPkr: 2499,
  },
  all_access: {
    id: 'all_access',
    name: 'All Access',
    badge: 'Pro Prep',
    testsPerDay: 999, // Unlimited
    boardyPerDay: 15,
    description: 'Unlimited practice tests, all university full mocks, and 15 Boardy questions daily.',
    priceMonthlyPkr: 3999,
  },
};

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

  // 24 hours = 1440 minutes. Elapsed today = 1440 - diffMinutes
  const elapsedMinutes = 1440 - diffMinutes;
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMinutes / 1440) * 100)));

  return {
    hours,
    minutes,
    totalMinutes: diffMinutes,
    progressPercent,
    formattedCountdown: `${hours} h ${minutes} min`,
  };
}

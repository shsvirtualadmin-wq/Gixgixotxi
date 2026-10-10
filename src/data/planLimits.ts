export type PlanType = 'starter' | 'steady_climb' | 'all_access' | 'free' | 'pro' | 'premium';

export interface PlanLimitConfig {
  id: string;
  name: 'Free' | 'Pro' | 'Premium';
  badge: string;
  testsPerDay: number; // 999 represents unlimited
  boardyPerDay: number;
  description: string;
  priceMonthlyPkr: number;
}

export const PLAN_LIMITS: Record<string, PlanLimitConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    badge: 'Starter',
    testsPerDay: 3,
    boardyPerDay: 5,
    description: '3 tests and Boardy AI access every day (150 chats/month). Perfect for consistency.',
    priceMonthlyPkr: 0,
  },
  starter: {
    id: 'starter',
    name: 'Free',
    badge: 'Starter',
    testsPerDay: 3,
    boardyPerDay: 5,
    description: '3 tests and Boardy AI access every day (150 chats/month). Perfect for consistency.',
    priceMonthlyPkr: 0,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    badge: 'Most Popular',
    testsPerDay: 25,
    boardyPerDay: 50,
    description: 'Pro opens every chapter with 25 tests/day and 1500 Boardy chats/month.',
    priceMonthlyPkr: 2499,
  },
  steady_climb: {
    id: 'steady_climb',
    name: 'Pro',
    badge: 'Most Popular',
    testsPerDay: 25,
    boardyPerDay: 50,
    description: 'Pro opens every chapter with 25 tests/day and 1500 Boardy chats/month.',
    priceMonthlyPkr: 2499,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    badge: 'Top Rank',
    testsPerDay: 999,
    boardyPerDay: 999,
    description: 'Unlimited practice tests, grand national mocks, and unlimited Boardy AI.',
    priceMonthlyPkr: 3999,
  },
  all_access: {
    id: 'all_access',
    name: 'Premium',
    badge: 'Top Rank',
    testsPerDay: 999,
    boardyPerDay: 999,
    description: 'Unlimited practice tests, grand national mocks, and unlimited Boardy AI.',
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

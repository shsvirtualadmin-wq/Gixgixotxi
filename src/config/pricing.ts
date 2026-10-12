export type PlanKey = 'free' | 'pro' | 'premium';

export interface PricingDuration {
  months: number;
  discountPct: number;
  label: string;
  badge?: string;
}

export interface PlanConfig {
  id: PlanKey;
  name: string;
  tagline: string;
  basePrice: number; // PKR per month
  limits: {
    testsPerDay: number; // 999999 = unlimited
    boardyPerDay: number;
    chaptersUnlocked: string;
    universityMocks: string;
    meritMeter: boolean;
    pdfDownloads: boolean;
    supportLevel: string;
  };
  features: Array<{ text: string; included: boolean }>;
}

export const PRICING_DURATIONS: PricingDuration[] = [
  { months: 1, discountPct: 0, label: 'Monthly' },
  { months: 3, discountPct: 10, label: '3 Months' },
  { months: 6, discountPct: 20, label: '6 Months', badge: 'Best Value' },
  { months: 12, discountPct: 30, label: '12 Months' },
];

export const PRICING_PLANS: Record<PlanKey, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Starter Access',
    tagline: 'Foundation drills and daily practice for all aspirants.',
    basePrice: 0,
    limits: {
      testsPerDay: 2,
      boardyPerDay: 3,
      chaptersUnlocked: 'Chapter 1 only',
      universityMocks: 'Sample diagnostic',
      meritMeter: false,
      pdfDownloads: false,
      supportLevel: 'Community FAQ',
    },
    features: [
      { text: '2 practice tests / day', included: true },
      { text: '3 Boardy AI chats / day', included: true },
      { text: 'Chapter 1 foundation drills', included: true },
      { text: 'Standard question explanations', included: true },
      { text: 'All syllabus chapters unlocked', included: false },
      { text: 'Full-length university mocks', included: false },
      { text: 'Merit Meter admission predictor', included: false },
      { text: 'Downloadable PDF worksheets', included: false },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Most Popular for serious FSC & Entry Test preparation.',
    basePrice: 199,
    limits: {
      testsPerDay: 10,
      boardyPerDay: 7,
      chaptersUnlocked: 'All syllabus chapters',
      universityMocks: '3 mocks / month',
      meritMeter: false,
      pdfDownloads: true,
      supportLevel: 'Email support',
    },
    features: [
      { text: '10 practice tests / day', included: true },
      { text: '7 Boardy AI chats / day', included: true },
      { text: 'All syllabus chapters unlocked', included: true },
      { text: 'Step-by-step AI solution breakdowns', included: true },
      { text: 'Full chapter question banks', included: true },
      { text: 'Performance analytics & streak tracking', included: true },
      { text: 'Unlimited university mock exams', included: false },
      { text: 'Merit Meter admission predictor', included: false },
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    tagline: 'Maximum Edge with complete entry test dominance.',
    basePrice: 399,
    limits: {
      testsPerDay: 999999, // Unlimited
      boardyPerDay: 15,
      chaptersUnlocked: 'All chapters + past paper vaults',
      universityMocks: 'Unlimited national mocks',
      meritMeter: true,
      pdfDownloads: true,
      supportLevel: 'Priority 24/7 WhatsApp',
    },
    features: [
      { text: 'Unlimited practice tests / day', included: true },
      { text: '15 Boardy AI chats / day', included: true },
      { text: 'All chapters & past paper vaults', included: true },
      { text: 'Unlimited university mocks (MDCAT, NUST, FAST)', included: true },
      { text: 'Merit Meter admission chance predictor', included: true },
      { text: 'Step-by-step AI solution breakdowns', included: true },
      { text: 'Downloadable PDF test papers & keys', included: true },
      { text: 'Priority 24/7 WhatsApp academic support', included: true },
    ],
  },
};

/**
 * Calculates pricing metrics given a base price and duration:
 * total          = Math.round(basePrice * months * (1 - discountPct / 100))
 * effectiveMonth = Math.round(total / months)
 * originalTotal  = basePrice * months (shown struck-through)
 */
export function calculatePlanPricing(basePrice: number, duration: PricingDuration) {
  if (basePrice === 0) {
    return {
      total: 0,
      effectiveMonth: 0,
      originalTotal: 0,
      discountPct: 0,
      savingsAmount: 0,
    };
  }

  const originalTotal = basePrice * duration.months;
  const total = Math.round(basePrice * duration.months * (1 - duration.discountPct / 100));
  const effectiveMonth = Math.round(total / duration.months);
  const savingsAmount = Math.max(0, originalTotal - total);

  return {
    total,
    effectiveMonth,
    originalTotal,
    discountPct: duration.discountPct,
    savingsAmount,
  };
}

/**
 * Normalizes any string representation of a plan to 'free' | 'pro' | 'premium'
 */
export function normalizePlan(plan?: string | null): PlanKey {
  if (!plan) return 'free';
  const clean = plan.toLowerCase().trim();
  if (clean === 'premium' || clean === 'all_access') return 'premium';
  if (clean === 'pro' || clean === 'steady_climb') return 'pro';
  return 'free';
}

/**
 * Manual Local Payment methods configuration (single source of truth)
 */
export const MANUAL_PAYMENT_CONFIG = {
  jazzcash: {
    id: 'jazzcash',
    name: 'JazzCash',
    accountNumber: '+923058969050',
    accountTitle: 'haseena bibi',
    badgeColor: 'text-rose-600',
  },
  easypaisa: {
    id: 'easypaisa',
    name: 'Easypaisa',
    accountNumber: '+923335292094',
    accountTitle: 'Sadia Fatima',
    badgeColor: 'text-emerald-600',
  },
  support: {
    whatsappNumber: '+923058969050',
    whatsappLink: 'https://wa.me/923058969050',
    directSupportLink: 'https://wa.me/923058969050',
    communityLink: 'https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4',
    supportEmail: 'support@boardly.cfd',
  },
};

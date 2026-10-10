export type BillingDuration = 'monthly' | 'quarterly' | 'eight_months' | 'yearly';

export interface DurationOption {
  id: BillingDuration;
  label: string;
  badge?: string;
  durationMonths: number;
}

export interface PlanPricing {
  pricePkr: number;
  originalPricePkr?: number;
  savingsTag?: string;
  billingPeriodLabel: string;
  buttonLabel: string;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  tooltip?: string;
}

export interface PlanTier {
  id: 'free' | 'pro' | 'premium';
  name: string;
  badge?: string;
  highlighted?: boolean;
  tagline: string;
  description: string;
  priceNote?: string;
  pricing: Record<BillingDuration, PlanPricing>;
  features: PlanFeature[];
}

export interface ComparisonFeatureRow {
  name: string;
  category: string;
  freeValue: string | boolean;
  proValue: string | boolean;
  premiumValue: string | boolean;
  highlight?: boolean;
}

export interface FaqItem {
  id: string;
  category?: string;
  question: string;
  answer: string;
}

export const BILLING_DURATIONS: DurationOption[] = [
  { id: 'monthly', label: 'Monthly', durationMonths: 1 },
  { id: 'quarterly', label: '3 Months', durationMonths: 3 },
  { id: 'eight_months', label: '8 Months', badge: 'Best Value', durationMonths: 8 },
  { id: 'yearly', label: '12 Months', durationMonths: 12 },
];

export const MARKETING_PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Foundational Exam Practice',
    description: 'Essential topic drills and core questions for students testing the waters.',
    priceNote: '0 forever, no card needed',
    pricing: {
      monthly: {
        pricePkr: 0,
        billingPeriodLabel: 'forever',
        buttonLabel: 'Start for Free',
      },
      quarterly: {
        pricePkr: 0,
        billingPeriodLabel: 'forever',
        buttonLabel: 'Start for Free',
      },
      eight_months: {
        pricePkr: 0,
        billingPeriodLabel: 'forever',
        buttonLabel: 'Start for Free',
      },
      yearly: {
        pricePkr: 0,
        billingPeriodLabel: 'forever',
        buttonLabel: 'Start for Free',
      },
    },
    features: [
      { name: 'Limited tests (up to 3 daily mock drills)', included: true },
      { name: 'Smaller starter question bank', included: true },
      { name: '150 Boardy chats/month', included: true },
      { name: '7-day analytics and history', included: true },
      { name: 'Community support forum', included: true },
      { name: 'Full board-aligned question bank', included: false },
      { name: 'Weak-area diagnostic hints', included: false },
      { name: 'Adaptive test difficulty', included: false },
      { name: 'Downloadable PDF practice sets', included: false },
      { name: 'Subject-wise diagnostic reports', included: false },
      { name: 'Full-length board mock papers', included: false },
      { name: 'Dedicated priority support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    highlighted: true,
    badge: 'Most Popular',
    tagline: 'Boardy, your 24/7 study buddy.',
    description: 'Unrestricted question access with deeper Boardy explanations and targeted weak-area feedback.',
    pricing: {
      monthly: {
        pricePkr: 199,
        billingPeriodLabel: 'per month',
        buttonLabel: 'Upgrade to Pro',
      },
      quarterly: {
        pricePkr: 499,
        originalPricePkr: 597,
        savingsTag: 'Save 17%',
        billingPeriodLabel: 'for 3 months',
        buttonLabel: 'Choose Pro 3-Month',
      },
      eight_months: {
        pricePkr: 1199,
        originalPricePkr: 1592,
        savingsTag: 'Get 2 months free',
        billingPeriodLabel: 'for 8 months',
        buttonLabel: 'Choose Pro 8-Month',
      },
      yearly: {
        pricePkr: 1999,
        originalPricePkr: 2388,
        savingsTag: 'Get 2 months free',
        billingPeriodLabel: 'for 12 months',
        buttonLabel: 'Choose Pro Annual',
      },
    },
    features: [
      { name: 'More tests (up to 25 daily custom drills)', included: true },
      { name: 'Full question bank (Matric, FSC, entry exams)', included: true },
      { name: '1,500 Boardy chats/month', included: true },
      { name: '30-day analytics and progression curves', included: true },
      { name: 'Weak-area hints and topic recommendations', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Adaptive dynamic tests', included: false },
      { name: 'Printable PDF tests with answer keys', included: false },
      { name: 'Comprehensive subject-wise rank reports', included: false },
      { name: 'Official timed board mock papers', included: false },
      { name: 'Dedicated WhatsApp academic coordinator', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'All Access',
    description: 'The complete prep ecosystem with adaptive testing, printable tests, and Boardy, your 24/7 study buddy.',
    pricing: {
      monthly: {
        pricePkr: 449,
        billingPeriodLabel: 'per month',
        buttonLabel: 'Get Premium Access',
      },
      quarterly: {
        pricePkr: 1119,
        originalPricePkr: 1347,
        savingsTag: 'Save 17%',
        billingPeriodLabel: 'for 3 months',
        buttonLabel: 'Choose Premium 3-Month',
      },
      eight_months: {
        pricePkr: 2699,
        originalPricePkr: 3592,
        savingsTag: 'Get 2 months free',
        billingPeriodLabel: 'for 8 months',
        buttonLabel: 'Choose Premium 8-Month',
      },
      yearly: {
        pricePkr: 3599,
        originalPricePkr: 5388,
        savingsTag: 'Get 4 months free',
        billingPeriodLabel: 'for 12 months',
        buttonLabel: 'Choose Premium Annual',
      },
    },
    features: [
      { name: 'Unlimited tests and custom timed drills', included: true },
      { name: 'Full question bank + national entrance exam banks', included: true },
      { name: 'Unlimited priority Boardy chats/month', included: true },
      { name: 'All-time analytics, retention & mastery graphs', included: true },
      { name: 'Smart weak-area detection and automatic remedial sets', included: true },
      { name: 'Adaptive tests that calibrate to your skill level', included: true },
      { name: 'PDF downloads with official OMR bubble sheets', included: true },
      { name: 'Subject-wise reports and comparative percentile ranks', included: true },
      { name: 'Timed full-length mock papers with official scoring formulas', included: true },
      { name: 'Dedicated priority support (WhatsApp & direct hotline)', included: true },
    ],
  },
];

export const COMPARISON_FEATURES: ComparisonFeatureRow[] = [
  {
    category: 'Test Practice & Drills',
    name: 'Daily practice drills',
    freeValue: '3 tests / day',
    proValue: '25 tests / day',
    premiumValue: 'Unlimited tests',
    highlight: true,
  },
  {
    category: 'Test Practice & Drills',
    name: 'Adaptive difficulty engine',
    freeValue: false,
    proValue: false,
    premiumValue: 'Included',
    highlight: true,
  },
  {
    category: 'Test Practice & Drills',
    name: 'Custom time limits & negative marking',
    freeValue: 'Standard',
    proValue: 'Customizable',
    premiumValue: 'Fully configurable',
  },
  {
    category: 'Question Bank & Content',
    name: 'Question bank breadth',
    freeValue: 'Core starter bank (~800 questions)',
    proValue: 'Complete bank (12,000+ questions)',
    premiumValue: 'Full vault + entrance tests (25,000+ questions)',
    highlight: true,
  },
  {
    category: 'Question Bank & Content',
    name: 'Step-by-step derivations & solutions',
    freeValue: 'Standard definitions',
    proValue: 'Step-by-step solutions',
    premiumValue: 'Exhaustive formulas & derivations',
  },
  {
    category: 'Question Bank & Content',
    name: 'Curriculum updates & syllabus top-ups',
    freeValue: 'Monthly',
    proValue: 'Weekly',
    premiumValue: 'Real-time (instant update rollouts)',
  },
  {
    category: 'Boardy & Remedials',
    name: 'Boardy chats/month',
    freeValue: '150 Boardy chats/month',
    proValue: '1,500 Boardy chats/month',
    premiumValue: 'Unlimited priority Boardy chats/month',
    highlight: true,
  },
  {
    category: 'Boardy & Remedials',
    name: 'Smart weak-area detection',
    freeValue: false,
    proValue: 'Basic chapter hints',
    premiumValue: 'Deep cognitive gap analysis',
    highlight: true,
  },
  {
    category: 'Analytics & Diagnostic Reports',
    name: 'Analytics history retention',
    freeValue: '7 days',
    proValue: '30 days',
    premiumValue: 'All-time permanent history',
  },
  {
    category: 'Analytics & Diagnostic Reports',
    name: 'Subject-wise diagnostic reports',
    freeValue: false,
    proValue: 'Summary overview',
    premiumValue: 'Detailed multi-parameter audit',
  },
  {
    category: 'Downloads & Official Mocks',
    name: 'Offline PDF exports & printable papers',
    freeValue: false,
    proValue: false,
    premiumValue: 'Unlimited PDF downloads with OMR sheets',
    highlight: true,
  },
  {
    category: 'Downloads & Official Mocks',
    name: 'Full board-format mock simulations',
    freeValue: false,
    proValue: 'Selected past papers',
    premiumValue: 'Complete official mock series',
  },
  {
    category: 'Support & Guidance',
    name: 'Customer support',
    freeValue: 'Community forums',
    proValue: 'Priority email (< 12 hr SLA)',
    premiumValue: 'Dedicated WhatsApp advisor (< 1 hr SLA)',
  },
];

export const PRICING_FAQS: FaqItem[] = [
  {
    id: 'plan-fit',
    question: 'Which plan is right for me?',
    answer:
      'If you are beginning your preparation or reviewing a single subject, the Free plan provides a solid orientation. Students preparing for FBISE, BISE Matric, or FSC midterm exams will benefit most from Pro, which unlocks the full question bank and weak-area alerts. If you are aiming for top medical or engineering colleges (MDCAT, ECAT, NUST, FAST) or need offline printable mock tests, Premium delivers uncapped practice, adaptive exams, and dedicated mentorship.',
  },
  {
    id: 'pro-vs-premium',
    question: 'What is the main difference between Pro and Premium?',
    answer:
      'Pro provides full question access and 30-day analytics, making it ideal for standard board exam preparation. Premium adds high-stakes advantages: unlimited adaptive testing, automatic remedial question generation targeting your specific mistakes, official PDF mock test downloads with OMR sheets, and direct priority support via WhatsApp.',
  },
  {
    id: 'is-free-really-free',
    question: 'Is Free really free forever?',
    answer:
      'Yes! There are no hidden fees, zero credit card requirements, and no mandatory trial countdowns. You can practice with the core starter question bank and chat with Boardy, your 24/7 study buddy, for fundamental doubts at no cost for as long as you wish.',
  },
  {
    id: 'duration-savings',
    question: 'Do longer plans cost less?',
    answer:
      'Significantly! When you choose the 3-Month package you save 17% compared to monthly renewal. The 8-Month and 12-Month packages provide the highest savings in Pakistan—giving you up to 2 to 4 months completely free so you stay covered across your entire academic session.',
  },
  {
    id: 'payment-methods',
    question: 'How do I pay in Pakistan?',
    answer:
      'We support all domestic payment options: JazzCash, Easypaisa, Nayapay, Sadapay, Raast instant transfers, and all major debit or credit cards (Visa, Mastercard, PayPak). You can also submit payment proof via bank transfer directly inside the portal for instant verification.',
  },
  {
    id: 'switch-upgrade',
    question: 'Can I switch or upgrade my plan later?',
    answer:
      'Yes. You can upgrade from Free to Pro or Pro to Premium at any time. When upgrading, any unused balance on your current plan is prorated and applied toward your new tier.',
  },
  {
    id: 'discounts',
    question: 'Are there referral or group discounts?',
    answer:
      'Yes! Through the Study Circles program, when you invite classmates or study groups of 3 or more students, everyone receives an additional 20% discount code. Campus Captains also distribute special seasonal promo vouchers during Boardly Blitz drills.',
  },
  {
    id: 'sub-expiry',
    question: 'What happens when my subscription ends?',
    answer:
      'Your account simply moves back to the Free tier. You never lose your test history, saved questions, or bookmarks. You can renew whenever you are ready without any penalty or data loss.',
  },
];

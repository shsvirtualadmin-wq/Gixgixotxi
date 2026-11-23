export const ADSENSE_CLIENT_ID = 'ca-pub-6994939022289204';

export type AdSlotId =
  | 'home_mid'
  | 'home_faq'
  | 'mcq_hub'
  | 'mcq_chapter_feed'
  | 'mcq_chapter_end'
  | 'formula_feed'
  | 'material_feed'
  | 'commons_feed'
  | 'grandline_mid'
  | 'result_below'
  | 'crew_mid'
  | 'features_mid'
  | 'store_rows'
  | 'sidebar_desktop';

export type AdSlotMode = 'google' | 'boardly' | 'auto';

export type AdPromoPlanTier = 'pro' | 'plus';

export interface BoardlyOffer {
  id: string;
  title: string;
  text: string;
  buttonLabel: string;
  link: string;
  active: boolean;
  startDate: string | null; // YYYY-MM-DD or ISO string
  endDate: string | null;   // YYYY-MM-DD or ISO string
}

export interface AdSlotConfig {
  id: AdSlotId;
  name: string;
  location: string;
  enabled: boolean;
  mode: AdSlotMode;
  googleSlotId: string;
  primaryOfferId: string;
  fallbackOfferId: string;
  isFeedSlot?: boolean;
  everyN?: number;
  firstAfter?: number;
  boardlyOnly?: boolean;
  desktopOnly?: boolean;
}

export interface AdPromoCodeConfig {
  code: string;
  percentOff: number;
  plans: AdPromoPlanTier[];
  active: boolean;
  endDate: string | null; // YYYY-MM-DD or null
}

export interface AdsConfigDoc {
  version: number;
  adsEnabled: boolean;
  publisherId: string;
  fallbackToBoardly: boolean;
  slots: Record<AdSlotId, AdSlotConfig>;
  offers: BoardlyOffer[];
  promoCode: AdPromoCodeConfig;
  updatedAt: string;
  updatedBy?: string;
}

export interface AdDailyStatRow {
  date: string; // YYYY-MM-DD
  slotId: string;
  offerId: string;
  impressions: number;
  clicks: number;
}

export const AD_SLOT_ORDER: AdSlotId[] = [
  'home_mid',
  'home_faq',
  'mcq_hub',
  'mcq_chapter_feed',
  'mcq_chapter_end',
  'formula_feed',
  'material_feed',
  'commons_feed',
  'grandline_mid',
  'result_below',
  'crew_mid',
  'features_mid',
  'store_rows',
  'sidebar_desktop',
];

export const DEFAULT_BOARDLY_OFFERS: BoardlyOffer[] = [
  {
    id: 'early',
    title: 'Early offer: 20% off Pro and Plus',
    text: 'Use code EARLY21 at checkout.',
    buttonLabel: 'Get Pro/Plus',
    link: '/pricing',
    active: true,
    startDate: null,
    endDate: null,
  },
  {
    id: 'sprint',
    title: 'Try a 10-minute timed sprint',
    text: 'Chapter drills in Cockpit. Free every day.',
    buttonLabel: 'Start a sprint',
    link: '/dashboard/practice',
    active: true,
    startDate: null,
    endDate: null,
  },
  {
    id: 'vault',
    title: 'Every formula, step by step',
    text: 'Formula Vault has full derivations. Free to read.',
    buttonLabel: 'Open Formula Vault',
    link: '/formulas',
    active: true,
    startDate: null,
    endDate: null,
  },
  {
    id: 'mentor',
    title: 'Stuck on a step? Ask AI Mentor',
    text: 'Pro gives you 50 AI Mentor credits a day.',
    buttonLabel: 'See Pro',
    link: '/pricing',
    active: true,
    startDate: null,
    endDate: null,
  },
  {
    id: 'notes',
    title: 'Share your notes, help a classmate',
    text: 'Upload to Study Material and Boardly Commons.',
    buttonLabel: 'Upload notes',
    link: '/commons',
    active: true,
    startDate: null,
    endDate: null,
  },
  {
    id: 'captain',
    title: 'Become a Nakama Captain',
    text: 'Publish Grand Line tests and earn a certificate.',
    buttonLabel: 'Apply now',
    link: '/captain/apply',
    active: true,
    startDate: null,
    endDate: null,
  },
  {
    id: 'weak',
    title: 'Find your weak chapters',
    text: 'Pro shows which chapters cost you marks.',
    buttonLabel: 'Unlock with Pro',
    link: '/pricing',
    active: true,
    startDate: null,
    endDate: null,
  },
  {
    id: 'squad',
    title: 'Study with up to 30 classmates',
    text: 'Make a Study Crew with a live leaderboard.',
    buttonLabel: 'Open Crew',
    link: '/crew',
    active: true,
    startDate: null,
    endDate: null,
  },
  {
    id: 'kobans',
    title: 'Pay for Pro with Kobans',
    text: 'Use the Kobans you have earned. No card needed.',
    buttonLabel: 'Check Kobans',
    link: '/kobans',
    active: true,
    startDate: null,
    endDate: null,
  },
];

export const DEFAULT_AD_SLOTS: Record<AdSlotId, AdSlotConfig> = {
  home_mid: {
    id: 'home_mid',
    name: 'Home Mid',
    location: 'Home, after "How Boardly Works", before FAQ',
    enabled: true,
    mode: 'boardly',
    googleSlotId: '',
    primaryOfferId: 'early',
    fallbackOfferId: 'early',
  },
  home_faq: {
    id: 'home_faq',
    name: 'Home After FAQ',
    location: 'Home, after FAQ, before footer',
    enabled: true,
    mode: 'auto',
    googleSlotId: '',
    primaryOfferId: 'squad',
    fallbackOfferId: 'squad',
  },
  mcq_hub: {
    id: 'mcq_hub',
    name: 'Subject MCQs Hub',
    location: 'Subject MCQs, after 2nd subject card',
    enabled: true,
    mode: 'auto',
    googleSlotId: '',
    primaryOfferId: 'notes',
    fallbackOfferId: 'notes',
  },
  mcq_chapter_feed: {
    id: 'mcq_chapter_feed',
    name: 'MCQ Chapter Feed',
    location: 'MCQ chapter, between question cards below explanation',
    enabled: true,
    mode: 'auto',
    googleSlotId: '',
    primaryOfferId: 'sprint',
    fallbackOfferId: 'sprint',
    isFeedSlot: true,
    everyN: 6,
  },
  mcq_chapter_end: {
    id: 'mcq_chapter_end',
    name: 'MCQ Chapter End',
    location: 'MCQ chapter, at the end',
    enabled: true,
    mode: 'boardly',
    googleSlotId: '',
    primaryOfferId: 'vault',
    fallbackOfferId: 'vault',
  },
  formula_feed: {
    id: 'formula_feed',
    name: 'Formula Vault Feed',
    location: 'Formula Vault, between formula cards',
    enabled: true,
    mode: 'boardly',
    googleSlotId: '',
    primaryOfferId: 'mentor',
    fallbackOfferId: 'mentor',
    isFeedSlot: true,
    everyN: 6,
  },
  material_feed: {
    id: 'material_feed',
    name: 'Study Material Feed',
    location: 'Study Material, after 4th note and every Nth after',
    enabled: true,
    mode: 'auto',
    googleSlotId: '',
    primaryOfferId: 'notes',
    fallbackOfferId: 'notes',
    isFeedSlot: true,
    firstAfter: 4,
    everyN: 5,
  },
  commons_feed: {
    id: 'commons_feed',
    name: 'Boardly Commons Feed',
    location: 'Boardly Commons feed, between posts',
    enabled: true,
    mode: 'auto',
    googleSlotId: '',
    primaryOfferId: 'kobans',
    fallbackOfferId: 'kobans',
    isFeedSlot: true,
    everyN: 5,
  },
  grandline_mid: {
    id: 'grandline_mid',
    name: 'Grand Line Mid',
    location: 'Grand Line, between Captain Tests and Test Leaderboard',
    enabled: true,
    mode: 'boardly',
    googleSlotId: '',
    primaryOfferId: 'captain',
    fallbackOfferId: 'captain',
  },
  result_below: {
    id: 'result_below',
    name: 'Test Result Below Score',
    location: 'Test result page, right below score summary',
    enabled: true,
    mode: 'boardly',
    googleSlotId: '',
    primaryOfferId: 'weak',
    fallbackOfferId: 'weak',
  },
  crew_mid: {
    id: 'crew_mid',
    name: 'Crew Page Mid',
    location: 'Crew page, between Squad Capabilities and Roles',
    enabled: true,
    mode: 'auto',
    googleSlotId: '',
    primaryOfferId: 'early',
    fallbackOfferId: 'early',
  },
  features_mid: {
    id: 'features_mid',
    name: 'Features Page Mid',
    location: 'Features page, after 2nd feature card',
    enabled: true,
    mode: 'boardly',
    googleSlotId: '',
    primaryOfferId: 'squad',
    fallbackOfferId: 'squad',
  },
  store_rows: {
    id: 'store_rows',
    name: 'Store Rows Divider',
    location: 'Store, full-width between item rows after row 4 (Boardly only)',
    enabled: true,
    mode: 'boardly',
    googleSlotId: '',
    primaryOfferId: 'kobans',
    fallbackOfferId: 'kobans',
    isFeedSlot: true,
    everyN: 4,
    boardlyOnly: true,
  },
  sidebar_desktop: {
    id: 'sidebar_desktop',
    name: 'Desktop Sticky Sidebar',
    location: 'Desktop only, sticky dashboard sidebar',
    enabled: true,
    mode: 'auto',
    googleSlotId: '',
    primaryOfferId: 'early',
    fallbackOfferId: 'early',
    desktopOnly: true,
  },
};

export const DEFAULT_AD_PROMO_CONFIG: AdPromoCodeConfig = {
  code: 'EARLY21',
  percentOff: 20,
  plans: ['pro', 'plus'],
  active: true,
  endDate: null,
};

export function createDefaultAdsConfig(): AdsConfigDoc {
  const slotsCopy = {} as Record<AdSlotId, AdSlotConfig>;
  for (const id of AD_SLOT_ORDER) {
    slotsCopy[id] = { ...DEFAULT_AD_SLOTS[id] };
  }
  return {
    version: 1,
    adsEnabled: true,
    publisherId: ADSENSE_CLIENT_ID,
    fallbackToBoardly: true,
    slots: slotsCopy,
    offers: DEFAULT_BOARDLY_OFFERS.map((o) => ({ ...o })),
    promoCode: {
      ...DEFAULT_AD_PROMO_CONFIG,
      plans: [...DEFAULT_AD_PROMO_CONFIG.plans],
    },
    updatedAt: new Date().toISOString(),
  };
}

export const DEFAULT_ADS_CONFIG: AdsConfigDoc = createDefaultAdsConfig();

export function sanitizeSafeOfferUrl(raw: unknown): string {
  const str = String(raw || '').trim();
  if (!str) return '/pricing';
  if (str.startsWith('/') && !str.startsWith('//')) {
    return str;
  }
  try {
    const parsed = new URL(str);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // Reject invalid URLs
  }
  return '/pricing';
}

export function sanitizePublisherId(raw: unknown): string {
  const clean = String(raw || '').trim();
  if (!clean) return '';
  if (/^ca-pub-\d{10,20}$/.test(clean)) return clean;
  if (/^pub-\d{10,20}$/.test(clean)) return `ca-${clean}`;
  return ADSENSE_CLIENT_ID;
}

export function sanitizeGoogleSlotId(raw: unknown): string {
  const clean = String(raw || '').trim();
  if (!clean) return '';
  return /^\d{4,20}$/.test(clean) ? clean : '';
}

function normalizeOptionalDate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // Accept YYYY-MM-DD or valid ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function isOfferActiveNow(offer: BoardlyOffer, nowMs: number = Date.now()): boolean {
  if (!offer || !offer.active) return false;
  if (offer.startDate) {
    const startMs = new Date(`${offer.startDate}T00:00:00.000Z`).getTime();
    if (!Number.isNaN(startMs) && nowMs < startMs) return false;
  }
  if (offer.endDate) {
    const endMs = new Date(`${offer.endDate}T23:59:59.999Z`).getTime();
    if (!Number.isNaN(endMs) && nowMs > endMs) return false;
  }
  return true;
}

export function normalizeAdsConfig(raw: any): AdsConfigDoc {
  const defaults = createDefaultAdsConfig();
  if (!raw || typeof raw !== 'object') return defaults;

  const rawAdsEnabled =
    typeof raw.adsEnabled === 'boolean'
      ? raw.adsEnabled
      : typeof raw.enabled === 'boolean'
      ? raw.enabled
      : undefined;
  const adsEnabled = typeof rawAdsEnabled === 'boolean' ? rawAdsEnabled : defaults.adsEnabled;

  const rawPublisherId =
    typeof raw.publisherId === 'string'
      ? raw.publisherId
      : typeof raw.adsenseClientId === 'string'
      ? raw.adsenseClientId
      : undefined;
  const publisherId =
    typeof rawPublisherId === 'string' && rawPublisherId.trim()
      ? sanitizePublisherId(rawPublisherId)
      : defaults.publisherId;

  const rawFallback =
    typeof raw.fallbackToBoardly === 'boolean'
      ? raw.fallbackToBoardly
      : typeof raw.fallback === 'boolean'
      ? raw.fallback
      : undefined;
  const fallbackToBoardly =
    typeof rawFallback === 'boolean' ? rawFallback : defaults.fallbackToBoardly;

  // Normalize offers (accept `offers` or legacy `boardlyOffers`)
  const rawOffers = Array.isArray(raw.offers)
    ? raw.offers
    : Array.isArray(raw.boardlyOffers)
    ? raw.boardlyOffers
    : null;
  const offers: BoardlyOffer[] = [];
  const seenOfferIds = new Set<string>();

  if (rawOffers && rawOffers.length > 0) {
    for (const item of rawOffers) {
      if (!item || typeof item !== 'object') continue;
      const rawId = String(item.id || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '');
      const id = rawId || `offer_${offers.length + 1}`;
      if (seenOfferIds.has(id)) continue;
      seenOfferIds.add(id);
      const title = String(item.title || '').trim().slice(0, 140);
      const text = String(item.text || item.description || '').trim().slice(0, 260);
      const buttonLabel = String(item.buttonLabel || item.ctaLabel || 'Learn more')
        .trim()
        .slice(0, 48);
      if (!title) continue;
      offers.push({
        id,
        title,
        text,
        buttonLabel,
        link: sanitizeSafeOfferUrl(item.link || item.url),
        active: typeof item.active === 'boolean' ? item.active : true,
        startDate: normalizeOptionalDate(item.startDate),
        endDate: normalizeOptionalDate(item.endDate),
      });
    }
  }

  const finalOffers = offers.length > 0 ? offers : defaults.offers;
  const validOfferIds = new Set(finalOffers.map((o) => o.id));
  const fallbackFirstOfferId = finalOffers[0]?.id || 'early';

  // Normalize slots (accept `slots` or legacy `adSlots`)
  const rawSlots =
    raw.slots && typeof raw.slots === 'object'
      ? raw.slots
      : raw.adSlots && typeof raw.adSlots === 'object'
      ? raw.adSlots
      : {};
  const slots = {} as Record<AdSlotId, AdSlotConfig>;

  for (const slotId of AD_SLOT_ORDER) {
    const def = defaults.slots[slotId];
    const incoming = rawSlots[slotId] && typeof rawSlots[slotId] === 'object' ? rawSlots[slotId] : {};
    const isBoardlyOnly = Boolean(def.boardlyOnly);

    const incomingMode = String(incoming.mode || def.mode).toLowerCase();
    let mode: AdSlotMode =
      incomingMode === 'google' || incomingMode === 'boardly' || incomingMode === 'auto'
        ? incomingMode
        : def.mode;
    if (isBoardlyOnly) {
      mode = 'boardly';
    }

    const primaryOfferId =
      typeof incoming.primaryOfferId === 'string' && validOfferIds.has(incoming.primaryOfferId)
        ? incoming.primaryOfferId
        : validOfferIds.has(def.primaryOfferId)
        ? def.primaryOfferId
        : fallbackFirstOfferId;

    const fallbackOfferId =
      typeof incoming.fallbackOfferId === 'string' && validOfferIds.has(incoming.fallbackOfferId)
        ? incoming.fallbackOfferId
        : validOfferIds.has(def.fallbackOfferId)
        ? def.fallbackOfferId
        : primaryOfferId;

    const parsedEveryN = Number(incoming.everyN);
    const everyN = def.isFeedSlot
      ? Number.isFinite(parsedEveryN) && parsedEveryN >= 2 && parsedEveryN <= 50
        ? Math.round(parsedEveryN)
        : def.everyN || 5
      : undefined;

    slots[slotId] = {
      ...def,
      enabled: typeof incoming.enabled === 'boolean' ? incoming.enabled : def.enabled,
      mode,
      googleSlotId: isBoardlyOnly ? '' : sanitizeGoogleSlotId(incoming.googleSlotId),
      primaryOfferId,
      fallbackOfferId,
      ...(def.isFeedSlot ? { everyN, firstAfter: def.firstAfter } : {}),
      boardlyOnly: def.boardlyOnly,
      desktopOnly: def.desktopOnly,
    };
  }

  // Normalize promo code (accept `promoCode` or legacy `promo`)
  const rawPromo =
    raw.promoCode && typeof raw.promoCode === 'object'
      ? raw.promoCode
      : raw.promo && typeof raw.promo === 'object'
      ? raw.promo
      : {};
  const cleanCode = String(rawPromo.code || defaults.promoCode.code)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 32);
  const rawPct = Number(rawPromo.percentOff);
  const percentOff = Number.isFinite(rawPct)
    ? Math.min(100, Math.max(1, Math.round(rawPct)))
    : defaults.promoCode.percentOff;
  const rawPlans = Array.isArray(rawPromo.plans) ? rawPromo.plans : defaults.promoCode.plans;
  const plans = Array.from(
    new Set(
      rawPlans
        .map((p: unknown) => String(p || '').toLowerCase())
        .filter((p): p is AdPromoPlanTier => p === 'pro' || p === 'plus')
    )
  );

  const promoCode: AdPromoCodeConfig = {
    code: cleanCode || defaults.promoCode.code,
    percentOff,
    plans: plans.length > 0 ? plans : ['pro', 'plus'],
    active: typeof rawPromo.active === 'boolean' ? rawPromo.active : defaults.promoCode.active,
    endDate: normalizeOptionalDate(rawPromo.endDate),
  };

  return {
    version: Number(raw.version) || 1,
    adsEnabled,
    publisherId,
    fallbackToBoardly,
    slots,
    offers: finalOffers,
    promoCode,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : undefined,
  };
}

/**
 * Central route blocklist where NO ads or Boardly offers may ever appear.
 * Enforced in AdSlot, PromoBanner, and DashboardShell/Sidebar.
 */
export function isAdBlockedRoute(pathnameRaw: string): boolean {
  const path = String(pathnameRaw || '/')
    .toLowerCase()
    .replace(/\/+$/, '') || '/';

  // 1. Exact or prefix-blocked routes
  const blockedPrefixes = [
    '/pricing',
    '/plan',
    '/plans',
    '/dashboard/plan',
    '/dashboard/plans',
    '/wallet',
    '/checkout',
    '/contact',
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/onboarding',
    '/verify-email',
    '/profile',
    '/u',
    '/dashboard/profile',
    '/settings',
    '/dashboard/settings',
    '/captains',
    '/nakama-captains',
    '/captain',
    '/dashboard/captain',
    '/dashboard/ambassador',
    '/rewards',
    '/dashboard/rewards',
    '/privacy',
    '/terms',
    '/faq',
    '/admin',
    '/superadmin',
    '/404',
    '/not-found',
    '/gone',
  ];

  for (const prefix of blockedPrefixes) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return true;
    }
  }

  // 2. Active test runners (allow /test/:id/result and /results/:id where result_below belongs)
  if (/^\/test\/[^/]+$/.test(path)) {
    return true;
  }
  if (/^\/(grand-line\/)?tests?\/[^/]+\/(run|redo|retake)$/.test(path)) {
    return true;
  }

  return false;
}

/**
 * Legacy compatibility map pointing to the canonical slot IDs.
 */
export const AD_SLOTS = {
  home_mid: 'home_mid',
  home_faq: 'home_faq',
  mcq_hub: 'mcq_hub',
  mcq_chapter_feed: 'mcq_chapter_feed',
  mcq_chapter_end: 'mcq_chapter_end',
  formula_feed: 'formula_feed',
  material_feed: 'material_feed',
  commons_feed: 'commons_feed',
  grandline_mid: 'grandline_mid',
  result_below: 'result_below',
  crew_mid: 'crew_mid',
  features_mid: 'features_mid',
  store_rows: 'store_rows',
  sidebar_desktop: 'sidebar_desktop',
} as const;

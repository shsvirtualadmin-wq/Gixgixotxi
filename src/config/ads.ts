export const ADSENSE_CLIENT_ID = 'ca-pub-6994939022289204';

/**
 * Google AdSense slot IDs for Boardly.
 * Paste real ad unit slot IDs here once AdSense approves the site.
 * Leave empty strings ("") to render a layout-reserving dashed placeholder.
 */
export const AD_SLOTS = {
  /** Home page: between hero and exam/features sections */
  homeHeroBelow: '',
  /** Quiz / MCQ practice page: below the question card & options (never during timed exams) */
  quizBelowQuestion: '',
  /** Results page: below the score summary */
  resultsBelowSummary: '',
  /** Desktop-only sticky sidebar slot */
  desktopSidebar: '',
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;

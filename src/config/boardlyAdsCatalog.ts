import type { StudentIllustrationId } from '@/components/ads/StudentIllustration';

export type BoardlyAdAccent =
  | 'purple-pink'
  | 'indigo-blue'
  | 'magenta-orange'
  | 'teal-purple';

export interface BoardlyCatalogAd {
  id: string;
  chip: string;
  headline: string;
  /** Short ticker headline for the top yellow announcement strip */
  shortHeadline: string;
  description: string;
  ctaLabel: string;
  link: string;
  accent: BoardlyAdAccent;
  illustrationId: StudentIllustrationId;
  /** Optional seal text for large poster carousel slides */
  posterSeal?: string;
  /** Only eligible while EARLY21 promo is active in admin ads config */
  requiresPromoActive?: boolean;
  /** Curated strong poster candidates for the hero poster carousel */
  posterEligible?: boolean;
  /** Optional photo URL if real student photos with permission are supplied later */
  imageUrl?: string;
}

export const BOARDLY_AD_ACCENTS: Record<
  BoardlyAdAccent,
  { background: string; shadow: string; ctaText: string }
> = {
  'purple-pink': {
    background: 'linear-gradient(135deg, #5b14b8 0%, #8a2be2 52%, #d6247a 100%)',
    shadow:
      '0 12px 32px -8px rgba(138, 43, 226, 0.48), 0 4px 16px -4px rgba(214, 36, 122, 0.28)',
    ctaText: '#5b14b8',
  },
  'indigo-blue': {
    background: 'linear-gradient(135deg, #2b1d8f 0%, #4338ca 52%, #0284c7 100%)',
    shadow:
      '0 12px 32px -8px rgba(67, 56, 202, 0.48), 0 4px 16px -4px rgba(2, 132, 199, 0.28)',
    ctaText: '#2b1d8f',
  },
  'magenta-orange': {
    background: 'linear-gradient(135deg, #9d174d 0%, #d6247a 52%, #ea580c 100%)',
    shadow:
      '0 12px 32px -8px rgba(214, 36, 122, 0.48), 0 4px 16px -4px rgba(234, 88, 12, 0.28)',
    ctaText: '#9d174d',
  },
  'teal-purple': {
    background: 'linear-gradient(135deg, #0f766e 0%, #5b21b6 54%, #9333ea 100%)',
    shadow:
      '0 12px 32px -8px rgba(91, 33, 182, 0.46), 0 4px 16px -4px rgba(15, 118, 110, 0.26)',
    ctaText: '#4c1d95',
  },
};

/**
 * 50 factual, rotating Boardly-owned ads covering ONLY real Boardly features,
 * supported universities, paper patterns, and tools. No invented numbers or fake timers.
 */
export const BOARDLY_ADS_CATALOG: BoardlyCatalogAd[] = [
  // ── STUDY CREW & SQUAD SYNERGY (1–5) ──
  {
    id: 'crew_30_classmates',
    chip: 'STUDY CREW',
    headline: 'Study with up to 30 classmates in one Squad',
    shortHeadline: 'Form a Study Crew with up to 30 classmates & a live leaderboard',
    description: 'Create a Study Crew, track daily practice together, and compete on a live leaderboard.',
    ctaLabel: 'Open Study Crew',
    link: '/crew',
    accent: 'purple-pink',
    illustrationId: 'crew-together',
    posterSeal: 'UP TO 30',
    posterEligible: true,
  },
  {
    id: 'crew_synergy_streaks',
    chip: 'SQUAD SYNERGY',
    headline: 'Keep shared study streaks alive with your Crew',
    shortHeadline: 'Squad Synergy: keep shared daily streaks alive together',
    description: 'Stay accountable every day with Squad Synergy, shared goals, and PKT midnight resets.',
    ctaLabel: 'Join a Crew',
    link: '/crew',
    accent: 'indigo-blue',
    illustrationId: 'crew-celebrate',
    posterSeal: 'SHARED STREAKS',
    posterEligible: true,
  },
  {
    id: 'crew_live_leaderboard',
    chip: 'LIVE LEADERBOARD',
    headline: 'Compare accuracy and solve speed with friends',
    shortHeadline: 'See live rankings with your classmates in Study Crew',
    description: 'See where you stand inside your Study Crew after every timed sprint and chapter drill.',
    ctaLabel: 'Explore Crew',
    link: '/crew',
    accent: 'teal-purple',
    illustrationId: 'boy-trophy',
  },
  {
    id: 'crew_shared_pass',
    chip: 'CREW PASS',
    headline: 'Unlock unlimited group practice with a Crew Pass',
    shortHeadline: 'Share unlimited practice perks across your Study Crew',
    description: 'Pool together with classmates for shared practice perks and unlimited test sessions.',
    ctaLabel: 'See Crew Options',
    link: '/crew',
    accent: 'magenta-orange',
    illustrationId: 'crew-together',
  },
  {
    id: 'crew_invite_link',
    chip: 'STUDY TOGETHER',
    headline: 'Invite classmates to your Squad with one link',
    shortHeadline: 'Invite your study group to Boardly Crew in seconds',
    description: 'Share your Crew invite code on WhatsApp and start drilling chapters side by side.',
    ctaLabel: 'Build Your Crew',
    link: '/crew',
    accent: 'purple-pink',
    illustrationId: 'girl-celebrating',
  },

  // ── MISTAKE DIAGNOSTICS & COMPLETE TEST (6–9) ──
  {
    id: 'mistake_diagnostics',
    chip: 'MISTAKE DIAGNOSTICS',
    headline: 'Spot the exact chapters costing you marks',
    shortHeadline: 'Mistake Diagnostics highlights your weak chapters automatically',
    description: 'Boardly tracks your chapter accuracy after every attempt so you revise what matters most.',
    ctaLabel: 'Check Your Accuracy',
    link: '/dashboard/practice',
    accent: 'magenta-orange',
    illustrationId: 'girl-laptop',
    posterSeal: 'SMART REVIEW',
    posterEligible: true,
  },
  {
    id: 'complete_test_mode',
    chip: 'COMPLETE TEST',
    headline: 'Simulate a full entrance exam from start to finish',
    shortHeadline: 'Run a full Complete Test with live timer & question palette',
    description: 'Practice full-length timed papers with question palette navigation and instant score reports.',
    ctaLabel: 'Start Complete Test',
    link: '/dashboard/practice',
    accent: 'indigo-blue',
    illustrationId: 'boy-laptop',
    posterSeal: 'FULL EXAM',
    posterEligible: true,
  },
  {
    id: 'review_mistakes_filter',
    chip: 'ERROR REVIEW',
    headline: 'Filter every wrong and flagged MCQ in one tap',
    shortHeadline: 'Review every mistake with step-by-step KaTeX derivations',
    description: 'Read step-by-step KaTeX derivations on your results screen right after submitting.',
    ctaLabel: 'Start Practicing',
    link: '/mcqs',
    accent: 'teal-purple',
    illustrationId: 'boy-notes',
  },
  {
    id: 'weak_chapters_drill',
    chip: 'WEAK CHAPTERS',
    headline: 'Turn weak chapters into your highest-scoring topics',
    shortHeadline: 'Drill your top weak chapters directly from the Cockpit',
    description: 'Launch focused chapter drills right from your Weak Chapters meter on the dashboard.',
    ctaLabel: 'Drill Weak Topics',
    link: '/dashboard/practice',
    accent: 'purple-pink',
    illustrationId: 'girl-books',
  },

  // ── SUPPORTED UNIVERSITIES & NATIONAL TESTS (10–24) ──
  {
    id: 'uni_nust_net',
    chip: 'NUST NET',
    headline: 'Practice NUST NET MCQs with real exam timing',
    shortHeadline: 'Prepare for NUST (NET) with authentic timed MCQ mocks',
    description: 'Drill Mathematics, Physics, Chemistry, Computer Science, and English in the NUST NET pattern.',
    ctaLabel: 'Practice NUST NET',
    link: '/dashboard/practice',
    accent: 'indigo-blue',
    illustrationId: 'boy-laptop',
    posterSeal: 'NUST NET',
    posterEligible: true,
  },
  {
    id: 'uni_fast_nuces',
    chip: 'FAST-NUCES',
    headline: 'Master FAST-NU negative marking before test day',
    shortHeadline: 'Practice FAST-NUCES mocks with authentic negative marking',
    description: 'Train with real FAST-NUCES penalty marking rules and timed sections so guesswork never hurts.',
    ctaLabel: 'Practice FAST-NU',
    link: '/dashboard/practice',
    accent: 'purple-pink',
    illustrationId: 'girl-laptop',
    posterSeal: 'FAST-NU',
    posterEligible: true,
  },
  {
    id: 'uni_giki',
    chip: 'GIKI ENTRY TEST',
    headline: 'Prepare for GIKI with structured MCQ drills',
    shortHeadline: 'GIKI Physics, Maths & English timed MCQ drills on Boardly',
    description: 'Work through Physics, Mathematics, and English questions with instant mathematical explanations.',
    ctaLabel: 'Start GIKI Prep',
    link: '/dashboard/practice',
    accent: 'teal-purple',
    illustrationId: 'boy-books',
  },
  {
    id: 'uni_uet_ecat',
    chip: 'UET · ECAT',
    headline: 'Train for UET ECAT with timed full-length mocks',
    shortHeadline: 'UET & ECAT timed mock tests with chapter-wise drills',
    description: 'Practice ECAT engineering subjects with instant answer keys and step-by-step derivations.',
    ctaLabel: 'Start ECAT Practice',
    link: '/dashboard/practice',
    accent: 'magenta-orange',
    illustrationId: 'boy-notes',
  },
  {
    id: 'uni_mdcat',
    chip: 'MDCAT PREP',
    headline: 'Prepare for MDCAT Biology, Chemistry & Physics',
    shortHeadline: 'Practice MDCAT Biology, Chemistry, Physics & English MCQs',
    description: 'Focused chapter drills, timed sprints, and clear explanations built for medical aspirants.',
    ctaLabel: 'Practice MDCAT',
    link: '/mcqs',
    accent: 'purple-pink',
    illustrationId: 'girl-books',
    posterSeal: 'MDCAT',
    posterEligible: true,
  },
  {
    id: 'uni_nums',
    chip: 'NUMS TRACK',
    headline: 'Build speed and accuracy for NUMS entrance tests',
    shortHeadline: 'Timed NUMS medical entrance practice on phone or desktop',
    description: 'Practice high-yield Biology, Chemistry, Physics, and English MCQs with instant feedback.',
    ctaLabel: 'Open NUMS Prep',
    link: '/dashboard/practice',
    accent: 'teal-purple',
    illustrationId: 'girl-phone',
  },
  {
    id: 'uni_lums_lcat',
    chip: 'LUMS LCAT',
    headline: 'Sharpen Quantitative & Verbal skills for LUMS LCAT',
    shortHeadline: 'Practice Quantitative & English reasoning for LUMS (LCAT)',
    description: 'Timed drills designed to keep your pacing sharp across every section of the exam.',
    ctaLabel: 'Practice LUMS LCAT',
    link: '/dashboard/practice',
    accent: 'indigo-blue',
    illustrationId: 'girl-laptop',
  },
  {
    id: 'uni_iba_karachi',
    chip: 'IBA KARACHI',
    headline: 'Practice Maths & English for IBA Karachi admissions',
    shortHeadline: 'IBA Karachi timed practice drills & instant answer review',
    description: 'Build consistent test-day speed with focused drills and detailed step-by-step solutions.',
    ctaLabel: 'Start IBA Prep',
    link: '/dashboard/practice',
    accent: 'magenta-orange',
    illustrationId: 'boy-phone',
  },
  {
    id: 'uni_aku',
    chip: 'AKU MEDICAL',
    headline: 'Train for AKU science and reasoning sections',
    shortHeadline: 'Prepare for AKU medical entrance tests on Boardly',
    description: 'Practice timed MCQs across Biology, Chemistry, Physics, and reasoning with clear derivations.',
    ctaLabel: 'Practice AKU Track',
    link: '/dashboard/practice',
    accent: 'teal-purple',
    illustrationId: 'girl-books',
  },
  {
    id: 'uni_comsats_pieas',
    chip: 'COMSATS & PIEAS',
    headline: 'Prep for COMSATS and PIEAS in one study cockpit',
    shortHeadline: 'Switch between COMSATS, PIEAS, NUST & FAST tracks anytime',
    description: 'Switch university test tracks anytime and practice subject-wise MCQs with instant grading.',
    ctaLabel: 'Explore Tracks',
    link: '/dashboard/practice',
    accent: 'indigo-blue',
    illustrationId: 'boy-books',
  },
  {
    id: 'uni_ned_karachi',
    chip: 'NED UNIVERSITY',
    headline: 'Practice NED University engineering test patterns',
    shortHeadline: 'NED University Physics, Maths, Chemistry & CS MCQ drills',
    description: 'Solve chapter-wise MCQs and timed tests for NED admissions right from your browser.',
    ctaLabel: 'Start NED Prep',
    link: '/dashboard/practice',
    accent: 'purple-pink',
    illustrationId: 'boy-laptop',
  },
  {
    id: 'uni_air_bahria',
    chip: 'AIR & BAHRIA',
    headline: 'Get test-ready for Air and Bahria University',
    shortHeadline: 'Air University & Bahria University MCQ practice on Boardly',
    description: 'Run daily timed sprints and track chapter-by-chapter accuracy for engineering and CS entry.',
    ctaLabel: 'Practice Now',
    link: '/dashboard/practice',
    accent: 'magenta-orange',
    illustrationId: 'girl-phone',
  },
  {
    id: 'uni_etea_nat_usat',
    chip: 'ETEA · NAT · USAT',
    headline: 'Prepare for ETEA, NTS NAT, and HEC USAT',
    shortHeadline: 'National test tracks: ETEA, NTS NAT & USAT (HEC)',
    description: 'Practice analytical, quantitative, verbal, and subject MCQs in one distraction-free runner.',
    ctaLabel: 'Open National Tracks',
    link: '/dashboard/practice',
    accent: 'teal-purple',
    illustrationId: 'boy-notes',
  },
  {
    id: 'uni_sat_ca_acca',
    chip: 'SAT · CA · ACCA',
    headline: 'Beyond boards: SAT, CA, and ACCA practice tracks',
    shortHeadline: 'Explore SAT, CA & ACCA practice tracks inside Boardly',
    description: 'Build test stamina with timed MCQ sessions, instant grading, and clean mobile navigation.',
    ctaLabel: 'Browse Tracks',
    link: '/dashboard/practice',
    accent: 'indigo-blue',
    illustrationId: 'girl-laptop',
  },
  {
    id: 'hssc_boards_pak',
    chip: 'CLASS 11 & 12',
    headline: 'HSSC-I & HSSC-II MCQs for all Pakistani boards',
    shortHeadline: 'Class 11 & 12 MCQs for FBISE, Punjab, Sindh, KPK & Balochistan',
    description: 'Covers FBISE, Punjab, Sindh, KPK, and Balochistan board chapters across 6 core subjects.',
    ctaLabel: 'Browse Subject MCQs',
    link: '/mcqs',
    accent: 'purple-pink',
    illustrationId: 'girl-books',
  },

  // ── PAPER PATTERNS, NEGATIVE MARKING & TIMED SPRINTS (25–28) ──
  {
    id: 'real_paper_patterns',
    chip: 'REAL PAPER PATTERNS',
    headline: 'Practice with authentic university subject splits',
    shortHeadline: 'Authentic subject weights, timers & exam rules per university',
    description: 'Every mock test follows the real question count, time limit, and marking scheme.',
    ctaLabel: 'See Test Cockpit',
    link: '/dashboard/practice',
    accent: 'indigo-blue',
    illustrationId: 'boy-laptop',
  },
  {
    id: 'negative_marking_sim',
    chip: 'NEGATIVE MARKING',
    headline: 'Train smart skipping with negative marking rules',
    shortHeadline: 'Practice real negative marking before your admission test',
    description: 'Learn when to answer and when to skip with live penalty-marking score breakdowns.',
    ctaLabel: 'Try a Timed Mock',
    link: '/dashboard/practice',
    accent: 'magenta-orange',
    illustrationId: 'boy-notes',
  },
  {
    id: 'ten_min_sprint',
    chip: 'TIMED SPRINT',
    headline: 'Try a quick 10-minute chapter sprint today',
    shortHeadline: 'Short on time? Run a focused chapter drill in minutes',
    description: 'Pick a subject, choose chapters, and build daily exam speed in a focused sprint.',
    ctaLabel: 'Start a Sprint',
    link: '/dashboard/practice',
    accent: 'teal-purple',
    illustrationId: 'girl-phone',
    posterSeal: 'DAILY SPRINT',
    posterEligible: true,
  },
  {
    id: 'katex_step_solutions',
    chip: 'KATEX DERIVATIONS',
    headline: 'Crisp mathematical derivations for every question',
    shortHeadline: 'Step-by-step KaTeX math & physics solutions—zero zooming',
    description: 'Read clean LaTeX equations and step-by-step explanations on any phone or laptop screen.',
    ctaLabel: 'Explore MCQs',
    link: '/mcqs',
    accent: 'purple-pink',
    illustrationId: 'girl-laptop',
  },

  // ── AI MENTOR (29–32) ──
  {
    id: 'ai_mentor_help',
    chip: 'AI MENTOR',
    headline: 'Stuck on a tough derivation? Ask AI Mentor',
    shortHeadline: 'Ask Boardly AI Mentor for step-by-step concept help',
    description: 'Get guided explanations, past-paper trap alerts, and formula walkthroughs whenever you need.',
    ctaLabel: 'Try AI Mentor',
    link: '/dashboard/ai',
    accent: 'purple-pink',
    illustrationId: 'girl-laptop',
    posterSeal: 'AI MENTOR',
    posterEligible: true,
  },
  {
    id: 'ai_mentor_photo_pdf',
    chip: 'PHOTO & PDF HELP',
    headline: 'Snap a question photo and get a guided solution',
    shortHeadline: 'Attach a question photo or PDF right inside AI Mentor',
    description: 'Upload a photo of your textbook problem or PDF note inside AI Mentor for clear steps.',
    ctaLabel: 'Open AI Mentor',
    link: '/dashboard/ai',
    accent: 'indigo-blue',
    illustrationId: 'boy-phone',
  },
  {
    id: 'ai_mentor_deep_max',
    chip: 'DEEP & MAX THINKING',
    headline: 'Unlock Deep & Max AI thinking for hard derivations',
    shortHeadline: 'Deep & Max AI thinking unlocked on Boardly Pro & Plus',
    description: 'Boardly Pro includes 50 AI Mentor credits/day and Boardly Plus gives 100 credits/day.',
    ctaLabel: 'Compare Pro & Plus',
    link: '/pricing',
    accent: 'magenta-orange',
    illustrationId: 'girl-celebrating',
  },
  {
    id: 'ai_mentor_free_daily',
    chip: 'FREE AI CREDITS',
    headline: 'Every free student gets daily AI Mentor credits',
    shortHeadline: 'Free daily AI Mentor credits reset every midnight PKT',
    description: 'Start asking study questions on Quick & Balanced depth free—credits refresh at midnight PKT.',
    ctaLabel: 'Ask a Question',
    link: '/dashboard/ai',
    accent: 'teal-purple',
    illustrationId: 'boy-notes',
  },

  // ── BOARDLY PRO, PLUS & EARLY OFFER (33–38) ──
  {
    id: 'early_offer_20_off',
    chip: 'EARLY OFFER',
    headline: '20% OFF Boardly Pro & Plus with code EARLY21',
    shortHeadline: 'Early Offer: Get 20% OFF Boardly Pro & Plus — Code: EARLY21',
    description: 'Unlimited mock tests, expanded AI Mentor credits, and ad-free studying. Use code EARLY21.',
    ctaLabel: 'Get Pro / Plus',
    link: '/pricing',
    accent: 'purple-pink',
    illustrationId: 'girl-celebrating',
    posterSeal: '20% OFF',
    requiresPromoActive: true,
    posterEligible: true,
  },
  {
    id: 'early_offer_checkout',
    chip: 'CODE: EARLY21',
    headline: 'Save 20% on Pro or Plus at checkout today',
    shortHeadline: 'Use promo code EARLY21 at checkout for 20% off Pro & Plus',
    description: 'Apply EARLY21 on monthly or annual passes—pay via JazzCash, Opay, or Kobans.',
    ctaLabel: 'Claim 20% Off',
    link: '/pricing',
    accent: 'magenta-orange',
    illustrationId: 'boy-trophy',
    posterSeal: 'EARLY21',
    requiresPromoActive: true,
  },
  {
    id: 'boardly_pro_unlimited',
    chip: 'BOARDLY PRO',
    headline: 'Unlimited practice tests and 50 AI credits every day',
    shortHeadline: 'Go Boardly Pro: unlimited mocks, 50 AI credits/day & ad-free',
    description: 'Remove daily test limits, unlock Deep & Max AI thinking, PDF exports, and ad-free study.',
    ctaLabel: 'Explore Boardly Pro',
    link: '/pricing',
    accent: 'purple-pink',
    illustrationId: 'boy-laptop',
    posterSeal: 'BOARDLY PRO',
    posterEligible: true,
  },
  {
    id: 'boardly_plus_power',
    chip: 'BOARDLY PLUS',
    headline: 'Boardly Plus: 100 AI Mentor credits/day & unlimited posts',
    shortHeadline: 'Boardly Plus: 2× Pro AI credits, unlimited posts & Plus badge',
    description: 'Everything in Pro plus double daily AI credits, unlimited Commons posts, and the Plus badge.',
    ctaLabel: 'See Boardly Plus',
    link: '/pricing',
    accent: 'indigo-blue',
    illustrationId: 'girl-trophy',
  },
  {
    id: 'local_payments_pk',
    chip: 'LOCAL PAYMENTS',
    headline: 'No credit card needed—pay with JazzCash or Opay',
    shortHeadline: '100% local Pakistani payments: JazzCash, Opay & Kobans',
    description: 'Upgrade smoothly using JazzCash, Opay, or the Kobans you earn by studying on Boardly.',
    ctaLabel: 'View Pricing',
    link: '/pricing',
    accent: 'teal-purple',
    illustrationId: 'boy-phone',
  },
  {
    id: 'ad_free_pro_plus',
    chip: 'AD-FREE STUDY',
    headline: 'Study completely ad-free on Boardly Pro & Plus',
    shortHeadline: 'Pro & Plus members can hide all ads anytime in Settings',
    description: 'Toggle ad-free mode in Settings and focus on pure practice with zero distractions.',
    ctaLabel: 'See Plans',
    link: '/pricing',
    accent: 'purple-pink',
    illustrationId: 'girl-books',
  },

  // ── BOARDLY COMMONS & STUDY MATERIAL (39–41) ──
  {
    id: 'commons_free_sharing',
    chip: 'BOARDLY COMMONS',
    headline: 'Share handwritten notes and solved papers for free',
    shortHeadline: 'Boardly Commons: share notes & past papers free with classmates',
    description: 'Upload notes, browse classmate study guides, and ask subject doubts in Boardly Commons.',
    ctaLabel: 'Open Commons',
    link: '/commons',
    accent: 'teal-purple',
    illustrationId: 'crew-together',
    posterSeal: 'FREE NOTES',
    posterEligible: true,
  },
  {
    id: 'study_material_library',
    chip: 'STUDY MATERIAL',
    headline: 'Browse subject notes and PDFs shared by students',
    shortHeadline: 'Explore free student-shared Study Material by subject',
    description: 'Find Physics, Chemistry, Biology, Maths, CS, and English notes organized by chapter.',
    ctaLabel: 'Browse Material',
    link: '/material',
    accent: 'indigo-blue',
    illustrationId: 'girl-books',
  },
  {
    id: 'commons_ask_doubts',
    chip: 'PEER LEARNING',
    headline: 'Post a tough question and learn with your peers',
    shortHeadline: 'Ask subject doubts and help classmates in Boardly Commons',
    description: 'Get perspectives from fellow HSSC, MDCAT, and ECAT students across Pakistan.',
    ctaLabel: 'Visit Commons',
    link: '/commons',
    accent: 'magenta-orange',
    illustrationId: 'crew-celebrate',
  },

  // ── NAKAMA CAPTAINS & GRAND LINE (42–44) ──
  {
    id: 'nakama_captains_apply',
    chip: 'NAKAMA CAPTAINS',
    headline: 'Become a Nakama Captain at your college or academy',
    shortHeadline: 'Lead your campus: apply to become a Nakama Captain',
    description: 'Publish public Grand Line tests, lead study squads, and earn an official certificate.',
    ctaLabel: 'Apply as Captain',
    link: '/captains',
    accent: 'magenta-orange',
    illustrationId: 'girl-trophy',
    posterSeal: 'CAMPUS LEAD',
    posterEligible: true,
  },
  {
    id: 'grand_line_public_tests',
    chip: 'GRAND LINE',
    headline: 'Take public tests published by Nakama Captains',
    shortHeadline: 'Compete in public Grand Line tests with live leaderboards',
    description: 'Join open tests created by student leaders across Pakistan and check your live rank.',
    ctaLabel: 'Browse Grand Line',
    link: '/grand-line',
    accent: 'purple-pink',
    illustrationId: 'boy-trophy',
  },
  {
    id: 'captain_certificates',
    chip: 'CERTIFICATES',
    headline: 'Earn verified Boardly certificates as you lead',
    shortHeadline: 'Earn official Nakama Captain certificates for community impact',
    description: 'Build your academic leadership portfolio by helping students prepare across Pakistan.',
    ctaLabel: 'Learn More',
    link: '/captains',
    accent: 'indigo-blue',
    illustrationId: 'girl-celebrating',
  },

  // ── KOBANS STORE & REWARDS (45–46) ──
  {
    id: 'kobans_store_cosmetics',
    chip: 'KOBANS STORE',
    headline: 'Customize your profile with frames, banners & effects',
    shortHeadline: 'Unlock animated banners, frames & nameplates in the Kobans Store',
    description: 'Earn Kobans by completing daily drills and unlock exclusive dot-matrix profile styles.',
    ctaLabel: 'Visit Store',
    link: '/store',
    accent: 'purple-pink',
    illustrationId: 'boy-trophy',
    posterSeal: 'KOBANS',
    posterEligible: true,
  },
  {
    id: 'kobans_redeem_pro',
    chip: 'EARN KOBANS',
    headline: 'Redeem your earned Kobans for Boardly Pro or Plus',
    shortHeadline: 'Use Kobans you earn studying to activate Pro or Plus—no card needed',
    description: 'Stay consistent with streaks and drills, earn Kobans, and spend them on passes or Store gear.',
    ctaLabel: 'Check Kobans',
    link: '/kobans',
    accent: 'teal-purple',
    illustrationId: 'girl-celebrating',
  },

  // ── FORMULA VAULT, PDF EXPORTS, STREAKS, MOBILE & FREE TIER (47–50) ──
  {
    id: 'formula_vault_derivations',
    chip: 'FORMULA VAULT',
    headline: 'Every Physics, Maths & Chemistry formula step by step',
    shortHeadline: 'Formula Vault: full KaTeX formula sheets & derivations, free to read',
    description: 'Revise key equations chapter by chapter with clear KaTeX formatting—free to browse.',
    ctaLabel: 'Open Formula Vault',
    link: '/formulas',
    accent: 'indigo-blue',
    illustrationId: 'boy-notes',
    posterSeal: 'FREE TO READ',
    posterEligible: true,
  },
  {
    id: 'pdf_exam_exports',
    chip: 'PDF DOWNLOADS',
    headline: 'Download printable A4 exam papers with answer keys',
    shortHeadline: 'Export full practice tests & chapter formula sheets as crisp A4 PDFs',
    description: 'Boardly Pro lets you export clean printable PDF test papers and answer key appendices.',
    ctaLabel: 'See Pro Features',
    link: '/pricing',
    accent: 'magenta-orange',
    illustrationId: 'boy-books',
  },
  {
    id: 'streak_badges_mobile',
    chip: 'STUDY ON PHONE',
    headline: 'Keep your daily streak alive from any smartphone',
    shortHeadline: 'Mobile-first exam runner & streak badges—study anywhere on your phone',
    description: 'Every MCQ runner, timer, KaTeX formula, and streak badge is built for smooth phone study.',
    ctaLabel: 'Start Studying',
    link: '/signup',
    accent: 'teal-purple',
    illustrationId: 'girl-phone',
  },
  {
    id: 'free_tier_forever',
    chip: 'FREE TO START',
    headline: 'Education for everyone: start practicing completely free',
    shortHeadline: 'Free tier: 3 daily tests, 5 AI credits/day & unlimited free note sharing',
    description: 'Get 3 daily practice tests, 5 AI Mentor credits/day, Formula Vault, and Study Crew free.',
    ctaLabel: 'Start Free Now',
    link: '/signup',
    accent: 'purple-pink',
    illustrationId: 'crew-celebrate',
    posterSeal: '100% FREE START',
    posterEligible: true,
  },
];

// ── SESSION SHUFFLE, NO-REPEAT, AND DISMISSAL ENGINE ──────────────────────

const DECK_STORAGE_KEY = 'boardly_ad_shuffle_deck_v2';
const LAST_SHOWN_STORAGE_KEY = 'boardly_ad_last_shown_v2';
const DISMISSED_STORAGE_KEY = 'boardly_ad_dismissed_v2';

// Per-page in-memory claim map so two slots on the SAME screen never show the same ad
const pageSlotClaims = new Map<string, Map<string, string>>();
const dismissListeners = new Set<() => void>();

function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function readStringArray(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeStringArray(key: string, values: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Ignore storage quota errors
  }
}

export function getDismissedAdIds(): Set<string> {
  return new Set(readStringArray(DISMISSED_STORAGE_KEY));
}

export function dismissAdForSession(adId: string): void {
  if (!adId) return;
  const current = getDismissedAdIds();
  if (!current.has(adId)) {
    current.add(adId);
    writeStringArray(DISMISSED_STORAGE_KEY, Array.from(current));
    dismissListeners.forEach((cb) => cb());
  }
}

export function subscribeDismissedAds(cb: () => void): () => void {
  dismissListeners.add(cb);
  return () => dismissListeners.delete(cb);
}

function getLastShownAdId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(LAST_SHOWN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setLastShownAdId(adId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(LAST_SHOWN_STORAGE_KEY, adId);
  } catch {
    // Ignore
  }
}

export function getEligibleCatalogAds(promoActive: boolean): BoardlyCatalogAd[] {
  const dismissed = getDismissedAdIds();
  const eligible = BOARDLY_ADS_CATALOG.filter((ad) => {
    if (ad.requiresPromoActive && !promoActive) return false;
    if (dismissed.has(ad.id)) return false;
    return true;
  });
  return eligible;
}

function drawNextFromShuffledDeck(
  eligible: BoardlyCatalogAd[],
  excludedIds: Set<string>
): BoardlyCatalogAd | null {
  if (eligible.length === 0) return null;

  const eligibleMap = new Map(eligible.map((a) => [a.id, a]));
  let deck = readStringArray(DECK_STORAGE_KEY).filter((id) => eligibleMap.has(id));

  if (deck.length === 0) {
    deck = fisherYatesShuffle(eligible.map((a) => a.id));
    const lastId = getLastShownAdId();
    // Avoid immediate repeat across deck wraparound
    if (lastId && deck.length > 1 && deck[0] === lastId) {
      const swapIdx = Math.floor(Math.random() * (deck.length - 1)) + 1;
      [deck[0], deck[swapIdx]] = [deck[swapIdx], deck[0]];
    }
  }

  const lastId = getLastShownAdId();
  let pickIndex = deck.findIndex((id) => !excludedIds.has(id) && id !== lastId);
  if (pickIndex === -1) {
    pickIndex = deck.findIndex((id) => !excludedIds.has(id));
  }

  let chosenId: string | null = null;
  if (pickIndex !== -1) {
    chosenId = deck[pickIndex];
    deck.splice(pickIndex, 1);
  } else {
    // Refill fresh shuffled deck excluding currently visible on-page ads
    const fresh = fisherYatesShuffle(
      eligible.map((a) => a.id).filter((id) => !excludedIds.has(id))
    );
    if (fresh.length > 0) {
      chosenId = fresh.shift()!;
      deck = fresh;
    } else {
      chosenId = eligible[0].id;
    }
  }

  writeStringArray(DECK_STORAGE_KEY, deck);
  if (chosenId) {
    setLastShownAdId(chosenId);
    return eligibleMap.get(chosenId) || null;
  }
  return null;
}

/**
 * Claims a unique rotating Boardly ad for a given `(pageKey, slotKey)`.
 * - Picks a fresh random ad from the 50-ad shuffled deck on each visit.
 * - Never shows the same ad twice in a row.
 * - Never shows the same ad twice on one screen.
 * - Respects session-only `✕` dismissals without breaking rotation.
 */
export function claimRotatingCatalogAd(
  pageKey: string,
  slotKey: string,
  promoActive: boolean
): BoardlyCatalogAd | null {
  const eligible = getEligibleCatalogAds(promoActive);
  if (eligible.length === 0) return null;

  const eligibleMap = new Map(eligible.map((a) => [a.id, a]));

  let pageMap = pageSlotClaims.get(pageKey);
  if (!pageMap) {
    pageMap = new Map<string, string>();
    pageSlotClaims.set(pageKey, pageMap);
  }

  // Keep existing claim if still eligible & not dismissed
  const existingId = pageMap.get(slotKey);
  if (existingId && eligibleMap.has(existingId)) {
    return eligibleMap.get(existingId)!;
  }

  const usedOnThisPage = new Set<string>();
  pageMap.forEach((claimedId, otherSlot) => {
    if (otherSlot !== slotKey) usedOnThisPage.add(claimedId);
  });

  const picked = drawNextFromShuffledDeck(eligible, usedOnThisPage);
  if (picked) {
    pageMap.set(slotKey, picked.id);
  }
  return picked;
}

export function releaseRotatingCatalogClaim(pageKey: string, slotKey: string): void {
  const pageMap = pageSlotClaims.get(pageKey);
  if (!pageMap) return;
  pageMap.delete(slotKey);
  if (pageMap.size === 0) {
    pageSlotClaims.delete(pageKey);
  }
}

/**
 * Selects `count` (4 to 5) distinct poster slides from the 50-ad catalog,
 * ensuring varied topics, accents, and student illustrations, with no duplicates on screen.
 */
export function getPosterSlides(
  pageKey: string,
  slotKey: string,
  promoActive: boolean,
  count = 5
): BoardlyCatalogAd[] {
  const eligible = getEligibleCatalogAds(promoActive);
  if (eligible.length === 0) return [];

  const pageMap = pageSlotClaims.get(pageKey);
  const usedOnPage = new Set<string>();
  pageMap?.forEach((claimedId, otherSlot) => {
    if (!otherSlot.startsWith(`${slotKey}::`)) usedOnPage.add(claimedId);
  });

  // Prioritize curated poster-eligible ads, then fill with shuffled catalog ads
  const preferred = fisherYatesShuffle(
    eligible.filter((a) => a.posterEligible && !usedOnPage.has(a.id))
  );
  const rest = fisherYatesShuffle(
    eligible.filter((a) => !a.posterEligible && !usedOnPage.has(a.id))
  );
  const pool = [...preferred, ...rest];

  // Ensure visual variety: pick across accents first
  const chosen: BoardlyCatalogAd[] = [];
  const usedIds = new Set<string>();
  const accentOrder: BoardlyAdAccent[] = [
    'purple-pink',
    'indigo-blue',
    'magenta-orange',
    'teal-purple',
  ];

  // If EARLY21 promo is active, lead or include it naturally in the shuffled poster set
  for (const accent of accentOrder) {
    if (chosen.length >= count) break;
    const match = pool.find((a) => a.accent === accent && !usedIds.has(a.id));
    if (match) {
      chosen.push(match);
      usedIds.add(match.id);
    }
  }

  for (const ad of pool) {
    if (chosen.length >= count) break;
    if (!usedIds.has(ad.id)) {
      chosen.push(ad);
      usedIds.add(ad.id);
    }
  }

  // Register claims so compact cards on the same screen don't repeat poster slides
  let pMap = pageSlotClaims.get(pageKey);
  if (!pMap) {
    pMap = new Map<string, string>();
    pageSlotClaims.set(pageKey, pMap);
  }
  chosen.forEach((ad, idx) => {
    pMap!.set(`${slotKey}::${idx}`, ad.id);
  });

  return chosen;
}

/**
 * Returns a shuffled subset of rotating ads for the top yellow scrolling announcement strip.
 */
export function getStripHeadlines(promoActive: boolean, count = 12): BoardlyCatalogAd[] {
  const eligible = getEligibleCatalogAds(promoActive);
  if (eligible.length === 0) return [];
  return fisherYatesShuffle(eligible).slice(0, Math.min(count, eligible.length));
}

/**
 * Maps legacy/admin offer IDs (early, sprint, vault, mentor, notes, captain, weak, squad, kobans)
 * to a consistent illustration and accent gradient for PromoBanner & /admin/ads preview.
 */
export function getVisualStyleForOfferId(
  offerId: string,
  title = ''
): { illustrationId: StudentIllustrationId; accent: BoardlyAdAccent } {
  const id = String(offerId || '').toLowerCase();
  const t = String(title || '').toLowerCase();

  if (id === 'early' || t.includes('early') || t.includes('20%')) {
    return { illustrationId: 'girl-celebrating', accent: 'purple-pink' };
  }
  if (id === 'sprint' || t.includes('sprint')) {
    return { illustrationId: 'girl-phone', accent: 'teal-purple' };
  }
  if (id === 'vault' || t.includes('formula')) {
    return { illustrationId: 'boy-notes', accent: 'indigo-blue' };
  }
  if (id === 'mentor' || t.includes('mentor') || t.includes('ai ')) {
    return { illustrationId: 'girl-laptop', accent: 'purple-pink' };
  }
  if (id === 'notes' || t.includes('notes') || t.includes('commons')) {
    return { illustrationId: 'crew-together', accent: 'teal-purple' };
  }
  if (id === 'captain' || t.includes('captain')) {
    return { illustrationId: 'girl-trophy', accent: 'magenta-orange' };
  }
  if (id === 'weak' || t.includes('weak')) {
    return { illustrationId: 'boy-laptop', accent: 'magenta-orange' };
  }
  if (id === 'squad' || t.includes('crew') || t.includes('classmate')) {
    return { illustrationId: 'crew-celebrate', accent: 'indigo-blue' };
  }
  if (id === 'kobans' || t.includes('koban')) {
    return { illustrationId: 'boy-trophy', accent: 'purple-pink' };
  }
  return { illustrationId: 'girl-books', accent: 'purple-pink' };
}

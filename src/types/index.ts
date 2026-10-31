export type Timestamp =
  | number
  | string
  | {
      seconds: number;
      nanoseconds?: number;
      toMillis?: () => number;
      toDate?: () => Date;
    };

export type UserRole = 'student' | 'crew' | 'captain' | 'ambassador' | 'admin' | 'superadmin';
export type UserPlan = 'free' | 'pro';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  name?: string | null;
  nickname?: string | null;
  username?: string | null;
  photoURL?: string | null;
  role: UserRole | string;
  customRole?: string | null;
  hasChosenRole?: boolean;
  plan: UserPlan;
  status?: string;
  isPremium?: boolean;
  planExpiresAt?: Timestamp | null;
  premiumExpiresAt?: Timestamp | null;
  premiumSource?: string | null;
  profileCompleted?: boolean;
  onboardingCompleted: boolean;
  targetExam?: string | null;
  targetUniversity?: string | null;
  targetTestDate?: string | null;
  academicTrack?: string;
  subjects?: string[];
  weakChapters?: string[];
  suspended?: boolean;
  isSuspended?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  streak?: number;
  isCrewMember?: boolean;
  crewId?: string | null;
  crewName?: string | null;
  crewStatus?: string;
  crewReferralCode?: string;
  shortId?: string;
  isCaptain?: boolean;
  isAmbassador?: boolean;
  referrerAmbassadorId?: string;
  referrerAmbassadorUid?: string;
  ambassadorBonusWeeks?: number;
  redeemedBadges?: string[];
  equippedBadges?: string[];
  streakFreezes?: number;
  streakFreezeActive?: boolean;
  avatarKey?: string | null;
  avatarVariant?: string | null;
  score?: number;
  totalQuestionsSolved?: number;
  testsCompleted?: number;
  testDate?: string;
  track?: string;
  onboardingComplete?: boolean;
  equipped?: EquippedCosmetics;
  rankTitle?: string;
  bio?: string;
  accent?: string;
  pinnedBadges?: string[];
  pinnedStamps?: string[];
}

export type CosmeticType = 'effect' | 'frame' | 'nameplate' | 'avatar' | 'banner';
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface EquippedCosmetics {
  effect?: string | null;
  frame?: string | null;
  nameplate?: string | null;
  avatar?: string | null;
  banner?: string | null;
}

/**
 * Public profile performance stats.
 */
export interface PublicProfileStats {
  streak: number;
  longestStreak: number;
  mcqs: number;
  accuracy: number;
  // Legacy / backwards compatibility aliases:
  score?: number;
  testsCompleted?: number;
  totalQuestionsSolved?: number;
  mcqsSolved?: number;
}

/**
 * Publicly readable student profile stored at `publicProfiles/{uid}`.
 * Strictly contains NO email, NO phone number, and NO financial/payment data.
 */
export interface PublicProfile {
  uid: string;
  displayName: string;
  nickname?: string | null;
  username?: string | null;
  customRole?: string | null;
  studentId: string;
  avatar: string | null;
  banner: string | null;
  frame: string | null;
  nameplate: string | null;
  effectId: string | null;
  badges: string[];
  bio: string; // max 160 characters
  status: string; // max 40 characters
  accent: string;
  memberSince: Timestamp | { seconds: number; nanoseconds?: number } | string | null;
  crewName: string | null;
  stats: PublicProfileStats;
  followersCount: number;
  followingCount: number;
  lastActiveAt: Timestamp | { seconds: number; nanoseconds?: number } | string | null;
  rankTitle?: string;
  pinnedBadges?: string[];
  pinnedStamps?: string[];

  // Optional legacy fields for backward compatibility
  shortId?: string;
  avatarKey?: string | null;
  avatarVariant?: string | null;
  avatarUrl?: string | null;
  photoURL?: string | null;
  crewId?: string | null;
  role?: UserRole | string;
  equipped?: EquippedCosmetics;
  equippedBadges?: string[];
  verifiedBadges?: {
    proUntil?: Timestamp | { seconds: number; nanoseconds?: number } | null;
    captain?: boolean;
    staff?: boolean;
  };
  publicStats?: PublicProfileStats;
  updatedAt?: Timestamp | { seconds: number; nanoseconds?: number } | string | null | unknown;
}

/**
 * Follow relationship stored in `follows/{followerId}_{targetId}`.
 * Strictly contains NO email or phone.
 */
export interface FollowDoc {
  followerId: string;
  targetId: string;
  createdAt: Timestamp | { seconds: number; nanoseconds?: number } | string | null | unknown;
}

export interface PlaceholderReview {
  id: string;
  name: string;
  role: string;
  city: string;
  rating: number;
  text: string;
  date: string;
  isPlaceholder: true;
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'draft' | 'reviewed' | 'published';

/**
 * Public question document stored in `questions/{id}`.
 * NEVER contains correct answer or explanation.
 */
export interface Question {
  id: string;
  subject: string; // slug, e.g. "mathematics"
  chapter: string; // slug, e.g. "integration-by-parts"
  difficulty: QuestionDifficulty;
  q: string; // string with KaTeX math ($...$, $$...$$, \ce{})
  options: [string, string, string, string]; // exactly 4 distinct strings
  tags: string[]; // e.g. ["nust", "fast", "mdcat"]
  source?: string;
  year?: number | string;
  status: QuestionStatus;
  active: boolean;
  rand: number; // uniform random 0 to 1 for index-assisted random selection
  schemaVersion: 1;
  contentHash: string;
  createdAt: Timestamp | { seconds: number; nanoseconds?: number } | string | null | unknown;
  updatedAt: Timestamp | { seconds: number; nanoseconds?: number } | string | null | unknown;
  createdBy: string;
  sourceId?: string;
  // Legacy optional fields for backward compatibility
  topic?: string;
  stem?: string;
  question?: string;
  text?: string;
  correct?: number;
  correctAnswer?: number;
  explain?: string;
  explanation?: string;
}

/**
 * Question document stored in dedicated subject pools (e.g. `questions_mathematics/{id}`).
 * Contains subject, topic/chapter, text, options, correct answer, explanation, difficulty, status.
 */
export interface SubjectPoolQuestion {
  id: string;
  subject: string;
  topic: string;
  chapter?: string;
  text: string;
  q?: string;
  question?: string;
  options: [string, string, string, string];
  correctAnswer: number;
  correct?: number;
  explanation: string;
  explain?: string;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  active?: boolean;
  rand?: number;
  contentHash?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number } | string | null | unknown;
  updatedAt?: Timestamp | { seconds: number; nanoseconds?: number } | string | null | unknown;
  createdBy?: string;
}

/**
 * Secret key document stored in `questionKeys/{id}` with restricted permissions.
 */
export interface QuestionKey {
  id: string;
  correct: number; // integer 0 to 3
  explain: string; // string with KaTeX math
  updatedAt: Timestamp | { seconds: number; nanoseconds?: number } | string | null | unknown;
}

/**
 * Student issue report stored in `questionReports/{id}`.
 */
export interface QuestionReport {
  id?: string;
  questionId: string;
  userId: string;
  userEmail?: string;
  reason: 'wrong_key' | 'broken_math' | 'unclear' | 'other' | string;
  comment?: string;
  createdAt: Timestamp | { seconds: number; nanoseconds?: number } | string | null | unknown;
  status: 'open' | 'resolved' | 'dismissed';
}

/**
 * Representation of a question inside an attempt.
 * Contains shuffled options and an optionMapping array to resolve answers without exposing keys early.
 */
export interface AttemptQuestion {
  id: string;
  q: string;
  options: [string, string, string, string] | string[];
  subject: string;
  chapter: string;
  difficulty: string;
  optionMapping?: number[]; // optionMapping[shuffledIndex] = originalIndex
  // Populated ONLY at submission or review mode from questionKeys:
  correct?: number;
  explain?: string;
  isUnavailable?: boolean; // Flagged if question was deleted from bank
  // Legacy aliases for backward compatibility with existing components
  stem?: string;
  correctIndex?: number;
  explanation?: string;
}

export interface AttemptDoc {
  id: string;
  userId: string;
  uid?: string;
  university?: string | null;
  subject?: string | null;
  chapter?: string | null;
  mode?: string;
  title?: string;
  blueprintId?: string | null;
  weightedChapter?: string | null;
  difficulty?: string | null;
  totalQuestions: number;
  timed: boolean;
  durationSeconds: number;
  endsAt?: Timestamp | { seconds: number; nanoseconds?: number } | null;
  status: 'preparing' | 'in_progress' | 'completed' | 'abandoned';
  createdAt?: Timestamp | { seconds: number };
  startedAt?: Timestamp | { seconds: number };
  submittedAt?: Timestamp | { seconds: number };
  questions?: AttemptQuestion[];
  userAnswers?: Record<string, number>;
  flagged?: number[];
  score?: number;
  maxMarks?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  unanswered?: number;
  percentage?: number;
  timeTakenSeconds?: number;
}

export interface OnboardingData {
  targetUniversity: string;
  targetTestDate: string;
  academicTrack: string;
  subjects: string[];
  weakChapters: string[];
  onboardingCompleted: true;
}

export interface ReferralDoc {
  referrerCode: string;
  referrerUid?: string;
  referredUserId: string;
  referredEmail: string;
  status: 'pending' | 'activated';
  activated: boolean;
  signedUpAt: Timestamp | number | string | null;
  emailVerified: boolean;
  firstTestCompleted: boolean;
}

export interface AuditLog {
  id?: string;
  adminEmail: string;
  action: string;
  targetUid?: string;
  targetEmail?: string;
  details?: Record<string, unknown> | string;
  timestamp: Timestamp | { seconds: number };
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userEmail?: string;
  displayName?: string;
  userName?: string;
  amount: number;
  plan: 'pro' | 'large_crew' | string;
  crewId?: string | null;
  crewName?: string | null;
  durationMonths?: number;
  method: 'easypaisa' | 'jazzcash' | 'sadapay' | 'nayapay' | 'bank' | string;
  transactionId: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | { seconds: number };
  approvedAt?: Timestamp | { seconds: number };
  approvedBy?: string;
  rejectionReason?: string;
}

export interface StudentReview {
  id: string;
  uid: string;
  authorName?: string;
  displayName?: string;
  email?: string;
  university?: string;
  rating: number; // 1..5
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | { seconds: number };
  approvedAt?: Timestamp | { seconds: number };
  approvedBy?: string;
}

export interface CaptainApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  city: string;
  semester?: string;
  socialLink?: string;
  motivation: string;
  expectedReach?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | { seconds: number };
  approvedAt?: Timestamp | { seconds: number };
  approvedBy?: string;
  rejectionReason?: string;
}

export interface CrewApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  city: string;
  instagram?: string;
  whatsapp?: string;
  whyCrew: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | { seconds: number };
  approvedAt?: Timestamp | { seconds: number };
  approvedBy?: string;
  rejectionReason?: string;
}

export interface WalletLedgerEntry {
  id: string;
  type: 'grant' | 'deduction' | 'purchase' | 'captain_allotment';
  amount: number;
  balanceAfter?: number;
  reason?: string;
  itemId?: string;
  itemName?: string;
  adminEmail?: string;
  monthKey?: string;
  timestamp: Timestamp | { seconds: number } | string | null | unknown;
}

export interface KobanRequest {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  amount: number;
  pkrAmount: number;
  transactionId: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  createdAt: Timestamp | { seconds: number } | string | null | unknown;
  approvedAt?: Timestamp | { seconds: number } | string | null | unknown;
  approvedBy?: string;
  grantedAmount?: number;
  rejectionReason?: string;
}

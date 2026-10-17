import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'crew' | 'captain' | 'admin' | 'superadmin';
export type UserPlan = 'free' | 'pro';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  name?: string | null;
  photoURL?: string | null;
  role: UserRole;
  plan: UserPlan;
  status?: string;
  isPremium?: boolean;
  planExpiresAt?: Timestamp | null;
  premiumExpiresAt?: Timestamp | null;
  premiumSource?: string | null;
  profileCompleted?: boolean;
  onboardingCompleted: boolean;
  targetExam?: string;
  targetUniversity?: string;
  targetTestDate?: string;
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
  streakFreezes?: number;
  streakFreezeActive?: boolean;
  avatarKey?: string | null;
  avatarVariant?: string | null;
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
  // Legacy optional fields for backward compatibility
  topic?: string;
  stem?: string;
  question?: string;
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
  signedUpAt: import('firebase/firestore').FieldValue;
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

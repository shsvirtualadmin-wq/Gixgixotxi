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

export interface Question {
  id: string;
  subject: string;
  chapter?: string;
  topic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  university?: string;
  year?: number;
  question?: string;
  q?: string;
  options: [string, string, string, string] | string[];
  correctAnswer?: 0 | 1 | 2 | 3 | number;
  correct?: 0 | 1 | 2 | 3 | number;
  explanation?: string;
  explain?: string;
  needsMathFix?: boolean;
  mathChecked?: boolean;
}

export interface AttemptQuestion {
  id: string;
  q: string;
  options: string[];
  correct: number;
  explain?: string;
  subject?: string;
  chapter?: string;
  difficulty?: string;
  university?: string;
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
  plan: 'pro';
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

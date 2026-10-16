import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'crew' | 'captain' | 'admin';
export type UserPlan = 'free' | 'pro';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
  plan: UserPlan;
  isPremium?: boolean;
  premiumExpiresAt?: Timestamp | null;
  premiumSource?: string | null;
  onboardingCompleted: boolean;
  targetUniversity?: string;
  targetTestDate?: string;
  academicTrack?: string;
  suspended?: boolean;
  isSuspended?: boolean;
  createdAt?: Timestamp;
  streak?: number;
  isCrewMember?: boolean;
  crewStatus?: string;
  crewReferralCode?: string;
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

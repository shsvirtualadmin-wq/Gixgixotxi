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
  chapter: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  university?: string;
  year?: number;
  question: string;
  options: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  explanation?: string;
  needsMathFix?: boolean;
  mathChecked?: boolean;
}

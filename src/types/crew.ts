export type CrewTier = 'free' | 'paid';
export type CrewJoinMode = 'direct' | 'request';

export interface CrewPaymentRecord {
  id: string;
  amount: number;
  method?: string;
  transactionId?: string;
  status: 'verified' | 'pending' | 'rejected';
  timestamp: string; // ISO
  verifiedBy?: string;
  verifiedAt?: string;
  cycleMonths: number;
  reason?: string;
}

export interface CrewJoinRequest {
  id: string;
  userId: string;
  userEmail?: string;
  displayName: string;
  avatarKey?: string;
  avatarVariant?: string;
  streak: number;
  score: number;
  requestedAt: string; // ISO
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface CrewMember {
  uid: string;
  displayName: string;
  email?: string;
  joinedAt: string;
  role: 'leader' | 'member';
  activeToday?: boolean;
  questionsSolved?: number;
  streak?: number;
  avatarKey?: string;
  avatarVariant?: string;
  isPro?: boolean;
}

export interface CrewDoc {
  id: string;
  name: string;
  code: string;
  bio?: string;
  avatarKey: string;
  avatarVariant: string;
  leaderId: string;
  leaderName: string;
  tier: CrewTier;
  paid_until?: string | null; // ISO
  payments?: CrewPaymentRecord[];
  joinMode: CrewJoinMode;
  minStreak: number;
  maxMembers: number; // 5 for free, can be customized for paid
  isClosed?: boolean;
  members: CrewMember[];
  memberUids: string[];
  requests?: CrewJoinRequest[];
  score: number;
  streak: number;
  currentQuestions: number;
  goalQuestions: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicCrewSummary {
  id: string;
  name: string;
  code: string;
  bio?: string;
  avatarKey: string;
  avatarVariant: string;
  rank: number;
  score: number;
  memberCount: number;
  maxMembers: number;
  tier: CrewTier;
  isPaidActive: boolean;
  paid_until?: string | null;
  joinMode: CrewJoinMode;
  minStreak: number;
  isClosed: boolean;
  leaderName: string;
  streak: number;
}

export type CrewEligibilityState =
  | 'eligible'
  | 'pending'
  | 'already_in_crew'
  | 'crew_full'
  | 'locked_streak'
  | 'closed';

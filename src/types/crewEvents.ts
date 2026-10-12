import { Question } from '../types';

export type CrewEventType =
  | 'Boardly Blitz'
  | 'Boardly Arena'
  | 'MDCAT Blitz'
  | 'NUST NET Sprint'
  | 'FAST-NU Mock'
  | 'ECAT Drill'
  | 'TCAT Challenge'
  | 'FBISE Subject Test';

export type CrewEventStatus = 'draft' | 'scheduled' | 'live' | 'ended';

export type CrewEventVisibility = 'public' | 'link_only';

export interface CrewEvent {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerEmail?: string;
  type: CrewEventType;
  title: string;
  subjects: string[];
  topics: string[];
  questionCount: number;
  durationMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Exam Standard';
  startTime: string; // ISO string
  endTime: string;   // ISO string
  visibility: CrewEventVisibility;
  description?: string;
  retakesAllowed: boolean;
  status: CrewEventStatus;
  questions: Question[];
  totalRegistrations: number;
  totalAttempts: number;
  averageScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicLeaderboardEntry {
  rank: number;
  displayName: string; // Display name or First name + initial, NEVER email/phone
  score: number;
  total: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: string;
}

export interface CrewEventAttempt {
  id: string;
  eventId: string;
  userId: string;
  displayName: string;
  score: number;
  total: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: string;
  userAnswers?: Record<number, any>;
}

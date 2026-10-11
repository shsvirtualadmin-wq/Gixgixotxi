// Boardly Events & Circles types and Mock/Persistent store
export type SessionType = 'blitz' | 'arena';
export type SessionStatus = 'upcoming' | 'live' | 'ended';

export interface EventSession {
  id: string;
  title: string;
  subject: string;
  type: SessionType;
  status: SessionStatus;
  startTime: string; // ISO string
  durationMinutes: number;
  totalQuestions: number;
  university?: string;
  category?: 'Engineering' | 'Business' | 'Medical' | 'All Universities';
  description?: string;
}

export interface SessionRegistration {
  id: string;
  sessionId: string;
  fullName: string;
  email: string;
  phone?: string;
  registeredAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  score: number;
  total: number;
  timeTakenSeconds: number; // in seconds
  percentage: number;
  isCurrentUser?: boolean;
}

export interface OrganizerApplication {
  id: string;
  fullName: string;
  email: string;
  status: 'pending' | 'verified';
  appliedAt: string;
}

// Initial Sessions Store
export const INITIAL_SESSIONS: EventSession[] = [
  {
    id: 'blitz-phy-01',
    title: 'Blitz #14: Electromagnetism & Induction Drill',
    subject: 'Physics',
    type: 'blitz',
    status: 'ended',
    startTime: '2026-10-08T18:00:00Z',
    durationMinutes: 40,
    totalQuestions: 40,
    description: '40 rapid-fire questions covering Faraday’s Law, Lenz’s Law, and mutual induction under authentic board timer constraints.'
  },
  {
    id: 'blitz-chem-02',
    title: 'Blitz #15: Organic Reaction Mechanisms & Polymers',
    subject: 'Chemistry',
    type: 'blitz',
    status: 'live',
    startTime: '2026-10-10T15:00:00Z',
    durationMinutes: 45,
    totalQuestions: 45,
    description: 'High-yield electrophilic additions, carbonyl chemistry, and elimination reactions with real-time ranking.'
  },
  {
    id: 'blitz-math-03',
    title: 'Blitz #16: Differential Equations & Integration Mastery',
    subject: 'Mathematics',
    type: 'blitz',
    status: 'upcoming',
    startTime: '2026-10-12T19:00:00Z',
    durationMinutes: 50,
    totalQuestions: 50,
    description: 'Integration by parts, definite integrals, and first-order differential equations.'
  },
  {
    id: 'arena-nust-net',
    title: 'NUST NET Full Grand Mock Tournament #3',
    subject: 'Full Syllabus (Math, Phy, Chem, Eng, IQ)',
    type: 'arena',
    status: 'ended',
    startTime: '2026-10-04T10:00:00Z',
    durationMinutes: 180,
    totalQuestions: 200,
    university: 'NUST',
    category: 'Engineering',
    description: 'Comprehensive 200-question computer-based mock following official NUST NET format.'
  },
  {
    id: 'arena-fast-nu',
    title: 'FAST-NUCES Grand Admission Mock',
    subject: 'Math & Analytical Reasoning',
    type: 'arena',
    status: 'upcoming',
    startTime: '2026-10-18T10:00:00Z',
    durationMinutes: 120,
    totalQuestions: 120,
    university: 'FAST',
    category: 'Engineering',
    description: 'Authentic speed-focused mock mirroring FAST negative marking and quantitative rigor.'
  },
  {
    id: 'arena-giki-eng',
    title: 'GIKI Engineering Grand Mock',
    subject: 'Mathematics & Physics Advanced',
    type: 'arena',
    status: 'upcoming',
    startTime: '2026-10-25T11:00:00Z',
    durationMinutes: 120,
    totalQuestions: 80,
    university: 'GIKI',
    category: 'Engineering',
    description: 'Deep analytical problems testing core physical insight and mathematical proofs.'
  },
  {
    id: 'arena-lums-lcat',
    title: 'LUMS LCAT & Scientific Aptitude Grand Mock',
    subject: 'Math, Reading & Scientific Reasoning',
    type: 'arena',
    status: 'upcoming',
    startTime: '2026-11-01T14:00:00Z',
    durationMinutes: 150,
    totalQuestions: 100,
    university: 'LUMS',
    category: 'Business',
    description: 'Rigorous aptitude evaluation mirroring the official LUMS test guidelines.'
  },
  {
    id: 'arena-iba-aptitude',
    title: 'IBA Karachi Entrance Mock Tournament',
    subject: 'Math & English Grammar / Vocab',
    type: 'arena',
    status: 'ended',
    startTime: '2026-09-28T14:00:00Z',
    durationMinutes: 110,
    totalQuestions: 90,
    university: 'IBA',
    category: 'Business',
    description: 'Cut-off specific simulated test with official sectional timings.'
  }
];

// Helper to generate fake demo participants (clearly demo: Student 01, Student 02, etc. Never real names)
export function getMockLeaderboard(sessionId: string): LeaderboardEntry[] {
  const session = INITIAL_SESSIONS.find(s => s.id === sessionId) || INITIAL_SESSIONS[0];
  const total = session.totalQuestions;

  const mockUsers = [
    { name: 'Student 01', rawScore: total, time: Math.round(session.durationMinutes * 60 * 0.58) },
    { name: 'Student 02', rawScore: total - 1, time: Math.round(session.durationMinutes * 60 * 0.62) },
    { name: 'Student 03', rawScore: total - 1, time: Math.round(session.durationMinutes * 60 * 0.69) },
    { name: 'Student 04', rawScore: total - 2, time: Math.round(session.durationMinutes * 60 * 0.71) },
    { name: 'Student 05', rawScore: total - 3, time: Math.round(session.durationMinutes * 60 * 0.74) },
    { name: 'Student 06', rawScore: total - 3, time: Math.round(session.durationMinutes * 60 * 0.78) },
    { name: 'Student 07', rawScore: total - 4, time: Math.round(session.durationMinutes * 60 * 0.81) },
    { name: 'Student 08', rawScore: total - 5, time: Math.round(session.durationMinutes * 60 * 0.84) },
    { name: 'Student 09', rawScore: total - 6, time: Math.round(session.durationMinutes * 60 * 0.86) },
    { name: 'Student 10', rawScore: total - 7, time: Math.round(session.durationMinutes * 60 * 0.89) },
    { name: 'Student 11', rawScore: total - 8, time: Math.round(session.durationMinutes * 60 * 0.91) },
    { name: 'Student 12', rawScore: total - 9, time: Math.round(session.durationMinutes * 60 * 0.93) },
  ];

  return mockUsers.map((u, idx) => ({
    rank: idx + 1,
    uid: `demo-usr-${idx + 1}`,
    displayName: u.name,
    score: u.rawScore,
    total,
    timeTakenSeconds: u.time,
    percentage: Math.round((u.rawScore / total) * 100),
  }));
}

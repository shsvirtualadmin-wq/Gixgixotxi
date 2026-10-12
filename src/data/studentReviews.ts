// PLACEHOLDER: Temporary student reviews until authentic live reviews are collected and approved.
// Kept as plain student statements only.
// Rules:
// - No university names
// - No marks, scores, percentages, ranks, or star ratings
// - Format: short quote + first name and initial + exam track (e.g. MDCAT, FSc, FBISE)

export interface StudentReviewItem {
  id: string;
  name: string; // "Hamza K.", "Ayesha M."
  track: string; // "MDCAT", "FSc Pre-Engineering", "FBISE Class 12", "Entry Tests"
  quote: string; // Plain statement about study experience
  // Legacy fields kept optional for backwards compatibility
  universityId?: string;
  universityName?: string;
  testType?: string;
  scoreOrAggregate?: string;
  rating?: number;
  verified?: boolean;
  date?: string;
  approved?: boolean;
}

export const REAL_STUDENT_REVIEWS: StudentReviewItem[] = [
  {
    id: 'ph-rev-1',
    name: 'Hamza K.',
    track: 'FSc Pre-Engineering',
    quote: 'Boardy broke down difficult math derivations step by step whenever I got stuck late at night.',
  },
  {
    id: 'ph-rev-2',
    name: 'Ayesha M.',
    track: 'MDCAT',
    quote: 'The Biology and Chemistry chapter breakdowns follow textbook lines closely, making revision straightforward.',
  },
  {
    id: 'ph-rev-3',
    name: 'Bilal S.',
    track: 'Entry Tests',
    quote: 'Timed practice sessions helped me improve my pacing and manage negative marking without second-guessing.',
  },
  {
    id: 'ph-rev-4',
    name: 'Fatima Z.',
    track: 'FBISE Class 12',
    quote: 'Finding chapter-wise MCQs aligned with the SLO syllabus saved me hours of searching through random files.',
  },
  {
    id: 'ph-rev-5',
    name: 'Daniyal T.',
    track: 'FSc Pre-Medical',
    quote: 'Being able to see immediate solution explanations right after an incorrect attempt cleared my doubts quickly.',
  },
  {
    id: 'ph-rev-6',
    name: 'Zainab R.',
    track: 'MDCAT',
    quote: 'The diagnostic tests pointed out the exact subtopics where I was losing marks so I could focus my study hours.',
  },
  {
    id: 'ph-rev-7',
    name: 'Usman A.',
    track: 'FSc Pre-Engineering',
    quote: 'The physics formulas and mechanics numericals are explained clearly with each intermediate step.',
  },
  {
    id: 'ph-rev-8',
    name: 'Maryam B.',
    track: 'FBISE Class 11',
    quote: 'Practicing on my phone during the commute helped me stay consistent with daily question targets.',
  },
  {
    id: 'ph-rev-9',
    name: 'Saad N.',
    track: 'Entry Tests',
    quote: 'The analytical reasoning and quantitative shortcut explanations made tough questions manageable.',
  },
  {
    id: 'ph-rev-10',
    name: 'Hira K.',
    track: 'MDCAT',
    quote: 'Clear textbook references for every question made it easy to cross-check concepts directly in my books.',
  },
];

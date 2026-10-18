export interface SubjectSplitItem {
  subject: string;
  count: number;
  name: string;
}

export interface UniversityCriteria {
  id: string;
  name: string;
  shortName: string;
  fullName: string;
  badge: string;
  totalQuestions: number;
  durationMinutes: number;
  negativeMarking: string;
  hasNegativeMarking: boolean;
  negativePenalty: number;
  correctReward: number;
  subjectsSplit: SubjectSplitItem[];
  description: string;
}

export const TARGET_UNIVERSITY_CRITERIA: UniversityCriteria[] = [
  {
    id: 'FAST-NUCES',
    name: 'FAST-NUCES',
    shortName: 'FAST',
    fullName: 'National University of Computer and Emerging Sciences',
    badge: 'CS & Engineering',
    totalQuestions: 120,
    durationMinutes: 120,
    negativeMarking: '−0.25 penalty per wrong answer',
    hasNegativeMarking: true,
    negativePenalty: -0.25,
    correctReward: 1.0,
    subjectsSplit: [
      { subject: 'mathematics', count: 50, name: 'Advanced Mathematics' },
      { subject: 'mathematics', count: 20, name: 'Basic Mathematics' },
      { subject: 'physics', count: 30, name: 'Physics' },
      { subject: 'english', count: 20, name: 'English Language' },
    ],
    description: '120 MCQs in 120 minutes with −0.25 negative marking. Heavy emphasis on calculus, vectors, and Newtonian physics.',
  },
  {
    id: 'NUST NET',
    name: 'NUST NET',
    shortName: 'NET',
    fullName: 'National University of Sciences & Technology',
    badge: 'National Entry Test',
    totalQuestions: 200,
    durationMinutes: 180,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    negativePenalty: 0.0,
    correctReward: 1.0,
    subjectsSplit: [
      { subject: 'mathematics', count: 80, name: 'Mathematics' },
      { subject: 'physics', count: 60, name: 'Physics' },
      { subject: 'chemistry', count: 30, name: 'Chemistry / CS' },
      { subject: 'english', count: 20, name: 'English' },
      { subject: 'analytical', count: 10, name: 'Intelligence & Logic' },
    ],
    description: '200 MCQs in 180 minutes without penalty. Speed is decisive: 54 seconds per question across full FSc syllabus.',
  },
  {
    id: 'GIKI',
    name: 'GIKI',
    shortName: 'GIKI',
    fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    badge: 'Engineering Admission',
    totalQuestions: 80,
    durationMinutes: 120,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    negativePenalty: 0.0,
    correctReward: 1.0,
    subjectsSplit: [
      { subject: 'mathematics', count: 40, name: 'Mathematics' },
      { subject: 'physics', count: 35, name: 'Physics' },
      { subject: 'english', count: 5, name: 'English' },
    ],
    description: '80 challenging questions in 120 minutes. Tests advanced multi-step derivations in physics mechanics and algebra.',
  },
  {
    id: 'LUMS',
    name: 'LUMS',
    shortName: 'LUMS',
    fullName: 'Lahore University of Management Sciences (SSE / LCAT)',
    badge: 'SSE & Business',
    totalQuestions: 60,
    durationMinutes: 90,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    negativePenalty: 0.0,
    correctReward: 1.0,
    subjectsSplit: [
      { subject: 'mathematics', count: 20, name: 'Mathematics' },
      { subject: 'physics', count: 20, name: 'Physics' },
      { subject: 'chemistry', count: 20, name: 'Chemistry / Biology' },
    ],
    description: '60 conceptual aptitude questions in 90 minutes. Focuses on data interpretation, problem solving, and analytical reasoning.',
  },
  {
    id: 'NED',
    name: 'NED',
    shortName: 'NED UET',
    fullName: 'NED University of Engineering & Technology, Karachi',
    badge: 'Sindh Engineering',
    totalQuestions: 100,
    durationMinutes: 120,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    negativePenalty: 0.0,
    correctReward: 1.0,
    subjectsSplit: [
      { subject: 'mathematics', count: 40, name: 'Mathematics' },
      { subject: 'physics', count: 30, name: 'Physics' },
      { subject: 'chemistry', count: 20, name: 'Chemistry / CS' },
      { subject: 'english', count: 10, name: 'English' },
    ],
    description: '100 MCQs in 120 minutes. Core engineering entrance format following Sindh Board intermediate textbook curriculum.',
  },
  {
    id: 'MDCAT',
    name: 'MDCAT',
    shortName: 'PMDC MDCAT',
    fullName: 'Medical and Dental College Admission Test (PM&DC)',
    badge: 'Medical & Dental',
    totalQuestions: 200,
    durationMinutes: 210,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    negativePenalty: 0.0,
    correctReward: 1.0,
    subjectsSplit: [
      { subject: 'biology', count: 68, name: 'Biology' },
      { subject: 'chemistry', count: 54, name: 'Chemistry' },
      { subject: 'physics', count: 54, name: 'Physics' },
      { subject: 'english', count: 18, name: 'English' },
      { subject: 'analytical', count: 6, name: 'Logical Reasoning' },
    ],
    description: '200 MCQs in 210 minutes (3.5 hours). Comprehensive medical entrance exam with 68 Biology and 54 Chemistry items.',
  },
  {
    id: 'ECAT',
    name: 'ECAT',
    shortName: 'UET ECAT',
    fullName: 'University of Engineering and Technology Punjab (UET ECAT)',
    badge: 'Punjab Engineering',
    totalQuestions: 100,
    durationMinutes: 100,
    negativeMarking: '−1.0 penalty per wrong answer (+4.0 correct)',
    hasNegativeMarking: true,
    negativePenalty: -1.0,
    correctReward: 4.0,
    subjectsSplit: [
      { subject: 'mathematics', count: 30, name: 'Mathematics' },
      { subject: 'physics', count: 30, name: 'Physics' },
      { subject: 'chemistry', count: 30, name: 'Chemistry / CS' },
      { subject: 'english', count: 10, name: 'English' },
    ],
    description: '100 MCQs in 100 minutes with high-stakes negative marking (+4 for correct, −1 for wrong). Max total marks 400.',
  },
  {
    id: 'Any',
    name: 'Any',
    shortName: 'General',
    fullName: 'Comprehensive Entrance Drill (All Universities)',
    badge: 'Mixed Practice',
    totalQuestions: 30,
    durationMinutes: 30,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    negativePenalty: 0.0,
    correctReward: 1.0,
    subjectsSplit: [
      { subject: 'mathematics', count: 10, name: 'Mathematics' },
      { subject: 'physics', count: 10, name: 'Physics' },
      { subject: 'chemistry', count: 10, name: 'Chemistry' },
    ],
    description: 'Balanced 30-minute diagnostic drill covering core STEM subjects across all entrance test formats.',
  },
];

export function getUniversityCriteria(uniNameOrId?: string | null): UniversityCriteria {
  if (!uniNameOrId) return TARGET_UNIVERSITY_CRITERIA[0];
  const query = uniNameOrId.trim().toLowerCase();

  const found = TARGET_UNIVERSITY_CRITERIA.find((c) => {
    const id = c.id.toLowerCase();
    const name = c.name.toLowerCase();
    const short = c.shortName.toLowerCase();
    return (
      query === id ||
      query === name ||
      query === short ||
      query.includes(id) ||
      id.includes(query) ||
      query.includes(short)
    );
  });

  return found || TARGET_UNIVERSITY_CRITERIA[0];
}

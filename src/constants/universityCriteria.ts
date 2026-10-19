export interface SectionCriteria {
  subject: string;
  name: string;
  count: number;
  correctMarks: number;
  negativePenalty: number;
  hasPenalty: boolean;
  badgeLabel: string;
}

export interface UniversityCriteria {
  id: string;
  name: string;
  shortName: string;
  fullName: string;
  badge: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarking: string;
  hasNegativeMarking: boolean;
  sections: SectionCriteria[];
  // Legacy alias for compatibility with code expecting subjectsSplit
  subjectsSplit: Array<{ subject: string; count: number; name: string }>;
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
    totalMarks: 120,
    durationMinutes: 120,
    negativeMarking: '−0.25 penalty per wrong answer',
    hasNegativeMarking: true,
    sections: [
      {
        subject: 'mathematics',
        name: 'Advanced Mathematics',
        count: 50,
        correctMarks: 1.0,
        negativePenalty: -0.25,
        hasPenalty: true,
        badgeLabel: '+1 / -0.25 NEGATIVE MARKING',
      },
      {
        subject: 'mathematics',
        name: 'Basic Mathematics',
        count: 20,
        correctMarks: 1.0,
        negativePenalty: -0.25,
        hasPenalty: true,
        badgeLabel: '+1 / -0.25 NEGATIVE MARKING',
      },
      {
        subject: 'physics',
        name: 'Physics',
        count: 30,
        correctMarks: 1.0,
        negativePenalty: -0.25,
        hasPenalty: true,
        badgeLabel: '+1 / -0.25 NEGATIVE MARKING',
      },
      {
        subject: 'english',
        name: 'English Language',
        count: 20,
        correctMarks: 1.0,
        negativePenalty: -0.25,
        hasPenalty: true,
        badgeLabel: '+1 / -0.25 NEGATIVE MARKING',
      },
    ],
    get subjectsSplit() {
      return this.sections.map((s) => ({ subject: s.subject, count: s.count, name: s.name }));
    },
    description: '120 questions, 120 marks in 120 minutes with −0.25 negative marking. Heavy emphasis on calculus, vectors, and Newtonian mechanics.',
  },
  {
    id: 'GIKI',
    name: 'GIKI',
    shortName: 'GIKI',
    fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    badge: 'Engineering Admission',
    totalQuestions: 80,
    totalMarks: 200,
    durationMinutes: 120,
    negativeMarking: '1 mark penalty per wrong answer in Math & Physics only',
    hasNegativeMarking: true,
    sections: [
      {
        subject: 'mathematics',
        name: 'Mathematics',
        count: 30,
        correctMarks: 3.0,
        negativePenalty: -1.0,
        hasPenalty: true,
        badgeLabel: '+3 / -1',
      },
      {
        subject: 'physics',
        name: 'Physics',
        count: 30,
        correctMarks: 3.0,
        negativePenalty: -1.0,
        hasPenalty: true,
        badgeLabel: '+3 / -1',
      },
      {
        subject: 'english',
        name: 'English',
        count: 20,
        correctMarks: 1.0,
        negativePenalty: 0.0,
        hasPenalty: false,
        badgeLabel: '+1 / 0 NO PENALTY',
      },
    ],
    get subjectsSplit() {
      return this.sections.map((s) => ({ subject: s.subject, count: s.count, name: s.name }));
    },
    description: '80 questions, 200 marks, 120 minutes. Math & Physics (30 Qs each, +3 / -1), English (20 Qs, +1 / 0 NO PENALTY).',
  },
  {
    id: 'NUST NET',
    name: 'NUST NET',
    shortName: 'NET',
    fullName: 'National University of Sciences & Technology',
    badge: 'National Entry Test',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 180,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    sections: [
      { subject: 'mathematics', name: 'Mathematics', count: 80, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'physics', name: 'Physics', count: 60, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'chemistry', name: 'Chemistry / CS', count: 30, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'english', name: 'English', count: 20, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'analytical', name: 'Intelligence & Logic', count: 10, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
    ],
    get subjectsSplit() {
      return this.sections.map((s) => ({ subject: s.subject, count: s.count, name: s.name }));
    },
    description: '200 questions, 200 marks in 180 minutes without penalty. Speed is decisive: 54 seconds per question across full intermediate syllabus.',
  },
  {
    id: 'LUMS',
    name: 'LUMS',
    shortName: 'LUMS',
    fullName: 'Lahore University of Management Sciences (SSE / LCAT)',
    badge: 'SSE & Business',
    totalQuestions: 60,
    totalMarks: 60,
    durationMinutes: 90,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    sections: [
      { subject: 'mathematics', name: 'Mathematics', count: 20, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'physics', name: 'Physics', count: 20, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'chemistry', name: 'Chemistry / Biology', count: 20, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
    ],
    get subjectsSplit() {
      return this.sections.map((s) => ({ subject: s.subject, count: s.count, name: s.name }));
    },
    description: '60 conceptual aptitude questions, 60 marks in 90 minutes. Focuses on data interpretation and problem solving.',
  },
  {
    id: 'NED',
    name: 'NED',
    shortName: 'NED UET',
    fullName: 'NED University of Engineering & Technology, Karachi',
    badge: 'Sindh Engineering',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 120,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    sections: [
      { subject: 'mathematics', name: 'Mathematics', count: 40, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'physics', name: 'Physics', count: 30, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'chemistry', name: 'Chemistry / CS', count: 20, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'english', name: 'English', count: 10, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
    ],
    get subjectsSplit() {
      return this.sections.map((s) => ({ subject: s.subject, count: s.count, name: s.name }));
    },
    description: '100 questions, 100 marks in 120 minutes without penalty following the Sindh Board intermediate curriculum.',
  },
  {
    id: 'MDCAT',
    name: 'MDCAT',
    shortName: 'PMDC MDCAT',
    fullName: 'Medical and Dental College Admission Test (PM&DC)',
    badge: 'Medical & Dental',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 210,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    sections: [
      { subject: 'biology', name: 'Biology', count: 68, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'chemistry', name: 'Chemistry', count: 54, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'physics', name: 'Physics', count: 54, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'english', name: 'English', count: 18, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'analytical', name: 'Logical Reasoning', count: 6, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
    ],
    get subjectsSplit() {
      return this.sections.map((s) => ({ subject: s.subject, count: s.count, name: s.name }));
    },
    description: '200 questions, 200 marks in 210 minutes (3.5 hours) with 68 Biology and 54 Chemistry items.',
  },
  {
    id: 'ECAT',
    name: 'ECAT',
    shortName: 'UET ECAT',
    fullName: 'University of Engineering and Technology Punjab (UET ECAT)',
    badge: 'Punjab Engineering',
    totalQuestions: 100,
    totalMarks: 400,
    durationMinutes: 100,
    negativeMarking: '−1.0 penalty per wrong answer (+4.0 correct)',
    hasNegativeMarking: true,
    sections: [
      { subject: 'mathematics', name: 'Mathematics', count: 30, correctMarks: 4.0, negativePenalty: -1.0, hasPenalty: true, badgeLabel: '+4 / -1 NEGATIVE MARKING' },
      { subject: 'physics', name: 'Physics', count: 30, correctMarks: 4.0, negativePenalty: -1.0, hasPenalty: true, badgeLabel: '+4 / -1 NEGATIVE MARKING' },
      { subject: 'chemistry', name: 'Chemistry / CS', count: 30, correctMarks: 4.0, negativePenalty: -1.0, hasPenalty: true, badgeLabel: '+4 / -1 NEGATIVE MARKING' },
      { subject: 'english', name: 'English', count: 10, correctMarks: 4.0, negativePenalty: -1.0, hasPenalty: true, badgeLabel: '+4 / -1 NEGATIVE MARKING' },
    ],
    get subjectsSplit() {
      return this.sections.map((s) => ({ subject: s.subject, count: s.count, name: s.name }));
    },
    description: '100 questions, 400 marks in 100 minutes with high-stakes negative marking (+4 correct, −1 wrong).',
  },
  {
    id: 'Any',
    name: 'Any',
    shortName: 'General',
    fullName: 'Comprehensive Entrance Drill (All Universities)',
    badge: 'Mixed Practice',
    totalQuestions: 30,
    totalMarks: 30,
    durationMinutes: 30,
    negativeMarking: 'No negative marking',
    hasNegativeMarking: false,
    sections: [
      { subject: 'mathematics', name: 'Mathematics', count: 10, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'physics', name: 'Physics', count: 10, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
      { subject: 'chemistry', name: 'Chemistry', count: 10, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1 / 0 NO PENALTY' },
    ],
    get subjectsSplit() {
      return this.sections.map((s) => ({ subject: s.subject, count: s.count, name: s.name }));
    },
    description: 'Balanced 30-minute diagnostic drill covering core intermediate STEM topics across all test formats.',
  },
  {
    id: 'Standard Sprint',
    name: '10-Minute Sprint',
    shortName: 'Sprint',
    fullName: '10-Minute Rapid Sprint',
    badge: 'Rapid Fire',
    totalQuestions: 10,
    totalMarks: 10,
    durationMinutes: 10,
    negativeMarking: 'No negative marking (+1.0 / 0.0)',
    hasNegativeMarking: false,
    sections: [
      { subject: 'mathematics', name: 'Mathematics', count: 10, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1.0 / 0.0 NO PENALTY' },
      { subject: 'physics', name: 'Physics', count: 10, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1.0 / 0.0 NO PENALTY' },
      { subject: 'chemistry', name: 'Chemistry', count: 10, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1.0 / 0.0 NO PENALTY' },
      { subject: 'english', name: 'English', count: 10, correctMarks: 1.0, negativePenalty: 0.0, hasPenalty: false, badgeLabel: '+1.0 / 0.0 NO PENALTY' },
    ],
    get subjectsSplit() {
      return this.sections.map((s) => ({ subject: s.subject, count: s.count, name: s.name }));
    },
    description: '10 rapid-fire questions in 10 minutes with Standard (+1.0 / 0.0) scoring.',
  },
];

export function getUniversityCriteria(uniNameOrId?: string | null): UniversityCriteria {
  if (!uniNameOrId) return TARGET_UNIVERSITY_CRITERIA[0];
  const query = uniNameOrId.trim().toLowerCase();

  if (query.includes('sprint')) {
    const sprintCrit = TARGET_UNIVERSITY_CRITERIA.find((c) => c.id === 'Standard Sprint');
    if (sprintCrit) return sprintCrit;
  }

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

export function getSectionCriteria(
  uniNameOrId?: string | null,
  subjectSlug?: string | null
): SectionCriteria {
  const criteria = getUniversityCriteria(uniNameOrId);
  if (!subjectSlug) {
    return criteria.sections[0] || {
      subject: 'general',
      name: 'General',
      count: 10,
      correctMarks: 1.0,
      negativePenalty: 0.0,
      hasPenalty: false,
      badgeLabel: '+1 / 0 NO PENALTY',
    };
  }

  const cleanSubject = subjectSlug.trim().toLowerCase();
  const matched = criteria.sections.find((s) => {
    const sub = s.subject.toLowerCase();
    const name = s.name.toLowerCase();
    return (
      cleanSubject === sub ||
      cleanSubject === name ||
      cleanSubject.includes(sub) ||
      sub.includes(cleanSubject) ||
      name.includes(cleanSubject)
    );
  });

  if (matched) return matched;

  // Fallback default
  return {
    subject: cleanSubject,
    name: formatSectionSubjectName(cleanSubject),
    count: 10,
    correctMarks: 1.0,
    negativePenalty: criteria.hasNegativeMarking ? -0.25 : 0.0,
    hasPenalty: criteria.hasNegativeMarking,
    badgeLabel: criteria.hasNegativeMarking ? '+1 / -0.25 NEGATIVE MARKING' : '+1 / 0 NO PENALTY',
  };
}

function formatSectionSubjectName(s: string): string {
  if (!s) return 'General';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getUniversityRulesSummary(uniNameOrId?: string | null): string {
  const c = getUniversityCriteria(uniNameOrId);
  if (c.id === 'GIKI') {
    return '80 Questions · 200 Marks · 120 Minutes | Math & Physics: +3 / -1 | English: +1 / 0 (No Penalty)';
  }
  if (c.id === 'FAST-NUCES') {
    return '120 Questions · 120 Marks · 120 Minutes | Marking: +1.0 Correct, −0.25 Penalty per wrong answer';
  }
  if (c.id === 'ECAT') {
    return '100 Questions · 400 Marks · 100 Minutes | Marking: +4.0 Correct, −1.0 Penalty per wrong answer';
  }
  if (c.id === 'NUST NET') {
    return '200 Questions · 200 Marks · 180 Minutes | Standard Marking: +1.0 / 0.0 (No Negative Marking)';
  }
  if (c.hasNegativeMarking) {
    return `${c.totalQuestions} Questions · ${c.totalMarks} Marks · ${c.durationMinutes} Minutes | ${c.negativeMarking}`;
  }
  return `${c.totalQuestions} Questions · ${c.totalMarks} Marks · ${c.durationMinutes} Minutes | Standard Marking (+1.0 / 0.0)`;
}

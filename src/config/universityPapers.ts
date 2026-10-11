import { Question } from '../types';
import { normalizeQuestionStem, deduplicateQuestions } from '../lib/shuffle';
import {
  TCAT_MATH_QUESTIONS,
  TCAT_PHYSICS_QUESTIONS,
  TCAT_CHEMISTRY_QUESTIONS,
  TCAT_CS_QUESTIONS,
  TCAT_ENGLISH_QUESTIONS,
} from '../data/tcatPrebuiltQuestions';
import { MDCAT_PREBUILT_QUESTIONS } from '../data/mdcatPrebuiltQuestions';
import { FAST_BASIC_MATH_QUESTIONS } from '../data/fastBasicMathQuestions';
import { FAST_IQ_ANALYTICAL_QUESTIONS } from '../data/fastIqAnalyticalQuestions';
import {
  APTITUDE_QUANT_QUESTIONS,
  APTITUDE_VERBAL_QUESTIONS,
  AKU_SCIENCE_REASONING_QUESTIONS,
  AKU_MATH_REASONING_QUESTIONS,
} from '../data/aptitudeAndReasoningQuestions';
import { NUMS_PSYCHOLOGICAL_QUESTIONS } from '../data/numsPsychologicalQuestions';

export interface PaperSectionBlueprint {
  subject: string;
  count: number;
  relatedSubjects?: string[];
}

export interface UniversityPaperConfig {
  id: string;
  universityId: string;
  shortName: string;
  fullName: string;
  testName: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarkingPercent: number; // e.g. 0 for none, 0.25 for 25%
  negativeMarkingText: string;
  marksPerQuestion: number;
  sections: PaperSectionBlueprint[];
}

/**
 * SINGLE SOURCE OF TRUTH for all University Paper formats.
 * Every card, onboarding screen, timer, test runner, and results screen reads from this config.
 */
export const UNIVERSITY_PAPER_CONFIGS: Record<string, UniversityPaperConfig> = {
  nust: {
    id: 'nust',
    universityId: 'nust',
    shortName: 'NUST',
    fullName: 'National University of Sciences & Technology',
    testName: 'NUST Entry Test (NET)',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 180,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Mathematics', count: 100, relatedSubjects: ['Basic Mathematics', 'Quantitative Reasoning'] },
      { subject: 'Physics', count: 60, relatedSubjects: ['Mathematics', 'Chemistry'] },
      { subject: 'English', count: 40, relatedSubjects: ['Verbal Reasoning', 'Analytical Reasoning'] },
    ],
  },
  fast: {
    id: 'fast',
    universityId: 'fast',
    shortName: 'FAST',
    fullName: 'FAST National University of Computer and Emerging Sciences',
    testName: 'FAST-NU Test',
    totalQuestions: 120,
    totalMarks: 100,
    durationMinutes: 120,
    negativeMarkingPercent: 0.25,
    negativeMarkingText: '25% negative marking (-0.25)',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Advanced Mathematics', count: 50, relatedSubjects: ['Mathematics', 'Basic Mathematics'] },
      { subject: 'Basic Mathematics', count: 20, relatedSubjects: ['Quantitative Reasoning', 'Mathematics'] },
      { subject: 'IQ & Analytical Reasoning', count: 20, relatedSubjects: ['Analytical Reasoning', 'Quantitative Reasoning'] },
      { subject: 'English', count: 30, relatedSubjects: ['Verbal Reasoning'] },
    ],
  },
  giki: {
    id: 'giki',
    universityId: 'giki',
    shortName: 'GIKI',
    fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    testName: 'GIKI Admission Test',
    totalQuestions: 80,
    totalMarks: 80,
    durationMinutes: 120,
    negativeMarkingPercent: 0.25,
    negativeMarkingText: '25% negative marking (-1 on wrong)',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Mathematics', count: 30, relatedSubjects: ['Basic Mathematics', 'Quantitative Reasoning'] },
      { subject: 'Physics', count: 30, relatedSubjects: ['Chemistry', 'Mathematics'] },
      { subject: 'English', count: 20, relatedSubjects: ['Verbal Reasoning'] },
    ],
  },
  iba: {
    id: 'iba',
    universityId: 'iba',
    shortName: 'IBA',
    fullName: 'Institute of Business Administration',
    testName: 'IBA Aptitude Test',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 100,
    negativeMarkingPercent: 0.25,
    negativeMarkingText: '25% negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'English', count: 50, relatedSubjects: ['Verbal Reasoning', 'Analytical Reasoning'] },
      { subject: 'Mathematics', count: 50, relatedSubjects: ['Quantitative Reasoning', 'Basic Mathematics'] },
    ],
  },
  lums: {
    id: 'lums',
    universityId: 'lums',
    shortName: 'LUMS',
    fullName: 'Lahore University of Management Sciences',
    testName: 'LCAT / SSE',
    totalQuestions: 90,
    totalMarks: 90,
    durationMinutes: 120,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Verbal Reasoning', count: 45, relatedSubjects: ['English'] },
      { subject: 'Quantitative Reasoning', count: 45, relatedSubjects: ['Basic Mathematics', 'Mathematics'] },
    ],
  },
  uet: {
    id: 'uet',
    universityId: 'uet',
    shortName: 'UET',
    fullName: 'University of Engineering and Technology',
    testName: 'ECAT / TCAT',
    totalQuestions: 100,
    totalMarks: 400,
    durationMinutes: 100,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 4,
    sections: [
      { subject: 'Mathematics', count: 30, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 30, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 30, relatedSubjects: ['Computer Science', 'Biology'] },
      { subject: 'English', count: 10, relatedSubjects: ['Verbal Reasoning'] },
    ],
  },
  ned: {
    id: 'ned',
    universityId: 'ned',
    shortName: 'NED',
    fullName: 'NED University of Engineering & Technology',
    testName: 'NED Entry Test',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 120,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Mathematics', count: 25, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 25, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 25, relatedSubjects: ['Computer Science'] },
      { subject: 'English', count: 25, relatedSubjects: ['Verbal Reasoning'] },
    ],
  },
  pieas: {
    id: 'pieas',
    universityId: 'pieas',
    shortName: 'PIEAS',
    fullName: 'Pakistan Institute of Engineering and Applied Sciences',
    testName: 'PIEAS Written Test',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 180,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Mathematics', count: 30, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 30, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 30, relatedSubjects: ['Computer Science'] },
      { subject: 'English', count: 10, relatedSubjects: ['Verbal Reasoning'] },
    ],
  },
  comsats: {
    id: 'comsats',
    universityId: 'comsats',
    shortName: 'COMSATS',
    fullName: 'COMSATS University Islamabad',
    testName: 'NTS NAT',
    totalQuestions: 90,
    totalMarks: 90,
    durationMinutes: 120,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'English', count: 20, relatedSubjects: ['Verbal Reasoning'] },
      { subject: 'Analytical Reasoning', count: 20, relatedSubjects: ['IQ & Analytical Reasoning'] },
      { subject: 'Quantitative Reasoning', count: 20, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 10, relatedSubjects: ['Mathematics'] },
      { subject: 'Chemistry', count: 10, relatedSubjects: ['Biology'] },
      { subject: 'Mathematics', count: 10, relatedSubjects: ['Basic Mathematics'] },
    ],
  },
  muet: {
    id: 'muet',
    universityId: 'muet',
    shortName: 'MUET',
    fullName: 'Mehran University of Engineering and Technology',
    testName: 'MUET Pre-Admission',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 100,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Mathematics', count: 25, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 25, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 25, relatedSubjects: ['Computer Science'] },
      { subject: 'English', count: 25, relatedSubjects: ['Verbal Reasoning'] },
    ],
  },
  nums: {
    id: 'nums',
    universityId: 'nums',
    shortName: 'NUMS',
    fullName: 'National University of Medical Sciences',
    testName: 'NUMS MDCAT',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 180,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Biology', count: 55, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 40, relatedSubjects: ['Physics', 'Biology'] },
      { subject: 'Physics', count: 40, relatedSubjects: ['Mathematics'] },
      { subject: 'English', count: 15, relatedSubjects: ['Verbal Reasoning'] },
      { subject: 'Psychological Assessment', count: 50, relatedSubjects: ['IQ & Analytical Reasoning', 'English'] },
    ],
  },
  uhs: {
    id: 'uhs',
    universityId: 'uhs',
    shortName: 'UHS',
    fullName: 'University of Health Sciences',
    testName: 'PMDC MDCAT',
    totalQuestions: 180,
    totalMarks: 180,
    durationMinutes: 180,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Biology', count: 68, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 54, relatedSubjects: ['Physics'] },
      { subject: 'Physics', count: 40, relatedSubjects: ['Mathematics'] },
      { subject: 'English', count: 12, relatedSubjects: ['Verbal Reasoning'] },
      { subject: 'Logical Reasoning', count: 6, relatedSubjects: ['Analytical Reasoning', 'IQ & Analytical Reasoning'] },
    ],
  },
  aku: {
    id: 'aku',
    universityId: 'aku',
    shortName: 'AKU',
    fullName: 'Aga Khan University Medical College',
    testName: 'AKU Entry Test',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 120,
    negativeMarkingPercent: 0.25,
    negativeMarkingText: '25% negative marking on Science',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Biology', count: 16, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 12, relatedSubjects: ['Physics'] },
      { subject: 'Physics', count: 12, relatedSubjects: ['Mathematics'] },
      { subject: 'Science Reasoning', count: 30, relatedSubjects: ['Biology', 'Physics'] },
      { subject: 'Mathematical Reasoning', count: 30, relatedSubjects: ['Basic Mathematics', 'Mathematics'] },
    ],
  },
  nutech: {
    id: 'nutech',
    universityId: 'nutech',
    shortName: 'NUTECH',
    fullName: 'National University of Technology',
    testName: 'NUAT Test',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 180,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Mathematics', count: 80, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 60, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 40, relatedSubjects: ['Computer Science', 'Physics'] },
      { subject: 'English', count: 20, relatedSubjects: ['Verbal Reasoning'] },
    ],
  },
  qau: {
    id: 'qau',
    universityId: 'qau',
    shortName: 'QAU',
    fullName: 'Quaid-i-Azam University',
    testName: 'QAU Entrance Exam',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 100,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Mathematics', count: 30, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 30, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 20, relatedSubjects: ['Biology'] },
      { subject: 'English', count: 20, relatedSubjects: ['Verbal Reasoning'] },
    ],
  },
  air: {
    id: 'air',
    universityId: 'air',
    shortName: 'Air University',
    fullName: 'Air University Islamabad',
    testName: 'AU Entry Test',
    totalQuestions: 90,
    totalMarks: 90,
    durationMinutes: 120,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'English', count: 20, relatedSubjects: ['Verbal Reasoning'] },
      { subject: 'Analytical Reasoning', count: 20, relatedSubjects: ['IQ & Analytical Reasoning'] },
      { subject: 'Quantitative Reasoning', count: 20, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 10, relatedSubjects: ['Mathematics'] },
      { subject: 'Chemistry', count: 10, relatedSubjects: ['Biology'] },
      { subject: 'Mathematics', count: 10, relatedSubjects: ['Basic Mathematics'] },
    ],
  },
  habib: {
    id: 'habib',
    universityId: 'habib',
    shortName: 'Habib',
    fullName: 'Habib University',
    testName: 'Habib Entrance Exam',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 120,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'English', count: 50, relatedSubjects: ['Verbal Reasoning'] },
      { subject: 'Mathematics', count: 50, relatedSubjects: ['Quantitative Reasoning', 'Basic Mathematics'] },
    ],
  },
  duhs: {
    id: 'duhs',
    universityId: 'duhs',
    shortName: 'DUHS',
    fullName: 'Dow University of Health Sciences',
    testName: 'MDCAT Sindh',
    totalQuestions: 180,
    totalMarks: 180,
    durationMinutes: 180,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Biology', count: 68, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 54, relatedSubjects: ['Physics'] },
      { subject: 'Physics', count: 40, relatedSubjects: ['Mathematics'] },
      { subject: 'English', count: 12, relatedSubjects: ['Verbal Reasoning'] },
      { subject: 'Logical Reasoning', count: 6, relatedSubjects: ['Analytical Reasoning'] },
    ],
  },
  kmu: {
    id: 'kmu',
    universityId: 'kmu',
    shortName: 'KMU',
    fullName: 'Khyber Medical University',
    testName: 'MDCAT KPK',
    totalQuestions: 180,
    totalMarks: 180,
    durationMinutes: 180,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Biology', count: 68, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 54, relatedSubjects: ['Physics'] },
      { subject: 'Physics', count: 40, relatedSubjects: ['Mathematics'] },
      { subject: 'English', count: 12, relatedSubjects: ['Verbal Reasoning'] },
      { subject: 'Logical Reasoning', count: 6, relatedSubjects: ['Analytical Reasoning'] },
    ],
  },
  szabmu: {
    id: 'szabmu',
    universityId: 'szabmu',
    shortName: 'SZABMU',
    fullName: 'Shaheed Zulfiqar Ali Bhutto Medical University',
    testName: 'MDCAT Federal',
    totalQuestions: 180,
    totalMarks: 180,
    durationMinutes: 180,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Biology', count: 68, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 54, relatedSubjects: ['Physics'] },
      { subject: 'Physics', count: 40, relatedSubjects: ['Mathematics'] },
      { subject: 'English', count: 12, relatedSubjects: ['Verbal Reasoning'] },
      { subject: 'Logical Reasoning', count: 6, relatedSubjects: ['Analytical Reasoning'] },
    ],
  },
  numl: {
    id: 'numl',
    universityId: 'numl',
    shortName: 'NUML',
    fullName: 'National University of Modern Languages',
    testName: 'NUML Admission Test',
    totalQuestions: 75,
    totalMarks: 75,
    durationMinutes: 60,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'English', count: 20, relatedSubjects: ['Verbal Reasoning'] },
      { subject: 'Physics', count: 20, relatedSubjects: ['Mathematics'] },
      { subject: 'Mathematics', count: 20, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Computer Science', count: 15, relatedSubjects: ['Chemistry'] },
    ],
  },
  hitec: {
    id: 'hitec',
    universityId: 'hitec',
    shortName: 'HITEC',
    fullName: 'HITEC University',
    testName: 'HITEC Entry Test',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 120,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Mathematics', count: 30, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 30, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 20, relatedSubjects: ['Computer Science'] },
      { subject: 'English', count: 20, relatedSubjects: ['Verbal Reasoning'] },
    ],
  },
};

/**
 * Standard aliases mapping
 */
const UNIVERSITY_KEY_ALIASES: Record<string, string> = {
  'fast-nu': 'fast',
  'fast nuces': 'fast',
  'fast-nuces': 'fast',
  'nuces': 'fast',
  'nust net': 'nust',
  'nust-net': 'nust',
  'net': 'nust',
  'uet lahore': 'uet',
  'uet taxila': 'uet',
  'ecat': 'uet',
  'tcat': 'uet',
  'hec usat': 'comsats',
  'nts nat': 'comsats',
  'nat': 'comsats',
};

/**
 * Helper to get the canonical university paper config by any id or alias.
 */
export function getUniversityPaperConfig(universityIdOrKey: string): UniversityPaperConfig {
  const normKey = (universityIdOrKey || '').trim().toLowerCase();
  const targetId = UNIVERSITY_KEY_ALIASES[normKey] || normKey;

  if (UNIVERSITY_PAPER_CONFIGS[targetId]) {
    return UNIVERSITY_PAPER_CONFIGS[targetId];
  }

  // Fallback for custom or unknown universities: standard 100 Q, 100 M, 100 Min pattern
  return {
    id: targetId || 'custom',
    universityId: targetId || 'custom',
    shortName: universityIdOrKey.toUpperCase() || 'Entry Test',
    fullName: `${universityIdOrKey} Entrance Examination`,
    testName: `${universityIdOrKey} Entry Test`,
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 100,
    negativeMarkingPercent: 0,
    negativeMarkingText: 'No negative marking',
    marksPerQuestion: 1,
    sections: [
      { subject: 'Mathematics', count: 30, relatedSubjects: ['Basic Mathematics'] },
      { subject: 'Physics', count: 30, relatedSubjects: ['Chemistry'] },
      { subject: 'Chemistry', count: 20, relatedSubjects: ['Computer Science', 'Biology'] },
      { subject: 'English', count: 20, relatedSubjects: ['Verbal Reasoning'] },
    ],
  };
}

/**
 * Returns raw question pool for a given subject name
 */
function getRawSubjectPool(subjectName: string): Question[] {
  const s = subjectName.trim().toLowerCase();

  if (s.includes('science reasoning')) {
    return AKU_SCIENCE_REASONING_QUESTIONS;
  }
  if (s.includes('math reasoning') || s.includes('mathematical reasoning')) {
    return [...AKU_MATH_REASONING_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS];
  }
  if (s.includes('psych')) {
    return NUMS_PSYCHOLOGICAL_QUESTIONS;
  }
  if (s.includes('iq') || s.includes('analytical')) {
    return FAST_IQ_ANALYTICAL_QUESTIONS;
  }
  if (s.includes('basic math') || s.includes('quantitative')) {
    return [...APTITUDE_QUANT_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS];
  }
  if (s.includes('adv') || s.includes('math')) {
    return TCAT_MATH_QUESTIONS;
  }
  if (s.includes('phys')) {
    return TCAT_PHYSICS_QUESTIONS;
  }
  if (s.includes('chem')) {
    return TCAT_CHEMISTRY_QUESTIONS;
  }
  if (s.includes('comp') || s.includes('cs')) {
    return TCAT_CS_QUESTIONS;
  }
  if (s.includes('bio')) {
    return MDCAT_PREBUILT_QUESTIONS['Biology'] || [];
  }
  if (s.includes('logic')) {
    return MDCAT_PREBUILT_QUESTIONS['Logical Reasoning'] || FAST_IQ_ANALYTICAL_QUESTIONS;
  }
  if (s.includes('verbal') || s.includes('eng')) {
    return [...APTITUDE_VERBAL_QUESTIONS, ...TCAT_ENGLISH_QUESTIONS];
  }

  return TCAT_MATH_QUESTIONS;
}

function shuffleOptionsAndFixCorrect(q: Question): Question {
  const correctText = q.options[q.correct];
  const shuffledOptions = [...q.options];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  const newCorrectIndex = shuffledOptions.indexOf(correctText);
  return {
    ...q,
    options: shuffledOptions,
    correct: newCorrectIndex >= 0 ? newCorrectIndex : q.correct,
  };
}

/**
 * Builds the official full exam for any university paper.
 * - Exactly the official number of questions from the paper config.
 * - Split by the section blueprint.
 * - No duplicates within a test.
 * - Prefers unseen questions, falling back to seen ones if needed.
 * - If bank shortfall exists, fills gap from closest related subject and logs clear warning.
 */
export function generateUniversityPaperExam(
  paperIdOrUniId: string,
  seenStemsInput?: Set<string> | string[]
): {
  config: UniversityPaperConfig;
  questions: Question[];
} {
  const config = getUniversityPaperConfig(paperIdOrUniId);
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const usedStems = new Set<string>();
  const allSelectedQuestions: Question[] = [];

  config.sections.forEach((section, sIdx) => {
    const targetCount = section.count;
    const pickedForSection: Question[] = [];

    const pickFromPool = (pool: Question[], subName: string) => {
      // Filter out stems already used in this exam
      const available = pool.filter((q) => {
        const stem = normalizeQuestionStem(q.q || q.question || '');
        return stem && !usedStems.has(stem);
      });

      // Split into unseen vs seen
      const unseen: Question[] = [];
      const seen: Question[] = [];

      for (const q of available) {
        const stem = normalizeQuestionStem(q.q || q.question || '');
        if (seenSet.has(stem)) {
          seen.push(q);
        } else {
          unseen.push(q);
        }
      }

      // Shuffle unseen
      const shuffledUnseen = [...unseen].sort(() => 0.5 - Math.random());
      const needed = targetCount - pickedForSection.length;
      const takeUnseen = shuffledUnseen.slice(0, needed);
      pickedForSection.push(...takeUnseen);
      takeUnseen.forEach(q => usedStems.add(normalizeQuestionStem(q.q || q.question || '')));

      // If still needed, fill from seen
      if (pickedForSection.length < targetCount) {
        const stillNeeded = targetCount - pickedForSection.length;
        const shuffledSeen = [...seen].sort(() => 0.5 - Math.random());
        const takeSeen = shuffledSeen.slice(0, stillNeeded);
        pickedForSection.push(...takeSeen);
        takeSeen.forEach(q => usedStems.add(normalizeQuestionStem(q.q || q.question || '')));
      }
    };

    // 1. Primary subject pool
    const primaryPool = getRawSubjectPool(section.subject);
    pickFromPool(primaryPool, section.subject);

    // 2. If shortfall remains, fallback to related subjects
    if (pickedForSection.length < targetCount) {
      const shortfall = targetCount - pickedForSection.length;
      const relatedCandidates = [
        ...(section.relatedSubjects || []),
        'Mathematics',
        'Physics',
        'English',
        'Chemistry',
        'Basic Mathematics',
      ];

      for (const fallbackSub of relatedCandidates) {
        if (pickedForSection.length >= targetCount) break;
        const fallbackPool = getRawSubjectPool(fallbackSub);
        const beforeCount = pickedForSection.length;
        pickFromPool(fallbackPool, fallbackSub);
        const added = pickedForSection.length - beforeCount;
        if (added > 0) {
          console.warn(
            `[University Paper Generator Warning] Paper: ${config.shortName}, Section: "${section.subject}" had shortfall of ${shortfall} MCQs. Filled ${added} questions from related subject "${fallbackSub}".`
          );
        }
      }
    }

    // Transform and add to final question list
    pickedForSection.forEach((rawQ, qIdx) => {
      const fixed = shuffleOptionsAndFixCorrect(rawQ);
      allSelectedQuestions.push({
        ...fixed,
        subject: section.subject,
        id: `${config.id}-${section.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${allSelectedQuestions.length + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      });
    });
  });

  return {
    config,
    questions: allSelectedQuestions,
  };
}

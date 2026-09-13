import { Question } from '../types';
import { normalizeQuestionStem, deduplicateQuestions } from '../lib/shuffle';
import { selectPrioritizedQuestions } from '../lib/seenQuestionsTracker';
import {
  TCAT_MATH_QUESTIONS,
  TCAT_PHYSICS_QUESTIONS,
  TCAT_CHEMISTRY_QUESTIONS,
  TCAT_CS_QUESTIONS,
  TCAT_ENGLISH_QUESTIONS
} from './tcatPrebuiltQuestions';
import { MDCAT_PREBUILT_QUESTIONS } from './mdcatPrebuiltQuestions';
import { NUMS_PSYCHOLOGICAL_QUESTIONS } from './numsPsychologicalQuestions';
import { FAST_BASIC_MATH_QUESTIONS } from './fastBasicMathQuestions';
import { FAST_IQ_ANALYTICAL_QUESTIONS } from './fastIqAnalyticalQuestions';
import {
  APTITUDE_QUANT_QUESTIONS,
  APTITUDE_VERBAL_QUESTIONS,
  AKU_SCIENCE_REASONING_QUESTIONS,
  AKU_MATH_REASONING_QUESTIONS
} from './aptitudeAndReasoningQuestions';

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

function selectUnique(
  pool: Question[],
  targetCount: number,
  subjectName: string,
  idPrefix: string,
  studentSeen?: Set<string>
): Question[] {
  if (!pool || pool.length === 0) return [];
  const seenSet = studentSeen || new Set<string>();
  const prioritized = selectPrioritizedQuestions(pool, seenSet, targetCount);
  const selected: Question[] = [];

  for (const raw of prioritized.selected) {
    const fixed = shuffleOptionsAndFixCorrect(raw);
    selected.push({
      ...fixed,
      subject: subjectName,
      id: `${idPrefix}-${subjectName.toLowerCase().replace(/\s+/g, '-')}-${selected.length + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    });
  }

  return deduplicateQuestions(selected);
}

/**
 * NUST NET (Engineering & Computing): 200 MCQs, 180 mins. No negative marking.
 * Mathematics (100), Physics (60), English (40)
 */
export function generateNetFullMockBank(seenStemsInput?: Set<string> | string[]): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const math = selectUnique(TCAT_MATH_QUESTIONS, 100, 'Mathematics', 'net-mock', seenSet);
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 60, 'Physics', 'net-mock', seenSet);
  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 40, 'English', 'net-mock', seenSet);

  return [...math, ...phys, ...eng];
}

/**
 * FAST-NU NAT (CS & Engineering): 120 MCQs, 120 mins. -0.25 negative marking.
 * Advanced Mathematics (50), Basic Mathematics (20), IQ & Analytical Reasoning (20), English (30)
 */
export function generateFastFullMockBank(seenStemsInput?: Set<string> | string[]): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const advMath = selectUnique(TCAT_MATH_QUESTIONS, 50, 'Advanced Mathematics', 'fast-mock', seenSet);
  const basicMath = selectUnique(FAST_BASIC_MATH_QUESTIONS, 20, 'Basic Mathematics', 'fast-mock', seenSet);
  const iq = selectUnique(FAST_IQ_ANALYTICAL_QUESTIONS, 20, 'IQ & Analytical Reasoning', 'fast-mock', seenSet);
  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 30, 'English', 'fast-mock', seenSet);

  return [...advMath, ...basicMath, ...iq, ...eng];
}

/**
 * UET Lahore ECAT: 100 MCQs, 100 mins. 4 marks per question = 400 marks. No negative marking.
 * Mathematics (30), Physics (30), Chemistry OR CS (30), English (10)
 */
export function generateEcatFullMockBank(
  electiveGroup: 'Pre-Engineering' | 'ICS' | string = 'Pre-Engineering',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const math = selectUnique(TCAT_MATH_QUESTIONS, 30, 'Mathematics', 'ecat-mock', seenSet);
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 30, 'Physics', 'ecat-mock', seenSet);

  const isCs = String(electiveGroup).toLowerCase().includes('cs') || String(electiveGroup).toLowerCase().includes('computer');
  const thirdSubject = isCs ? 'Computer Science' : 'Chemistry';
  const thirdPool = isCs ? TCAT_CS_QUESTIONS : TCAT_CHEMISTRY_QUESTIONS;
  const elective = selectUnique(thirdPool, 30, thirdSubject, 'ecat-mock', seenSet);

  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 10, 'English', 'ecat-mock', seenSet);

  return [...math, ...phys, ...elective, ...eng];
}

/**
 * UET Peshawar ETEA (Engineering): 100 MCQs, 100 mins. No negative marking.
 * Physics (40), Mathematics (35), English (15), Chemistry OR Computer Science (10)
 */
export function generateEteaFullMockBank(
  electiveGroup: 'Engineering (Chemistry)' | 'Engineering (Computer Science)' | string = 'Engineering (Chemistry)',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 40, 'Physics', 'etea-mock', seenSet);
  const math = selectUnique(TCAT_MATH_QUESTIONS, 35, 'Mathematics', 'etea-mock', seenSet);
  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 15, 'English', 'etea-mock', seenSet);

  const isCs = String(electiveGroup).toLowerCase().includes('cs') || String(electiveGroup).toLowerCase().includes('computer');
  const fourthSubject = isCs ? 'Computer Science' : 'Chemistry';
  const fourthPool = isCs ? TCAT_CS_QUESTIONS : TCAT_CHEMISTRY_QUESTIONS;
  const elective = selectUnique(fourthPool, 10, fourthSubject, 'etea-mock', seenSet);

  return [...phys, ...math, ...eng, ...elective];
}

/**
 * NUMS Entry Test: 200 MCQs total. No negative marking.
 * Part A: Biology 55, Chemistry 40, Physics 40, English 15 (150 MCQs = 95% weight)
 * Part B: Psychological Assessment 50 MCQs (5% weight)
 */
export function generateNumsFullMockBank(seenStemsInput?: Set<string> | string[]): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const bioPool = MDCAT_PREBUILT_QUESTIONS['Biology'] || [];
  const chemPool = MDCAT_PREBUILT_QUESTIONS['Chemistry'] || [];
  const physPool = MDCAT_PREBUILT_QUESTIONS['Physics'] || [];
  const engPool = MDCAT_PREBUILT_QUESTIONS['English'] || TCAT_ENGLISH_QUESTIONS;

  const bio = selectUnique(bioPool, 55, 'Biology', 'nums-mock', seenSet);
  const chem = selectUnique(chemPool, 40, 'Chemistry', 'nums-mock', seenSet);
  const phys = selectUnique(physPool, 40, 'Physics', 'nums-mock', seenSet);
  const eng = selectUnique(engPool, 15, 'English', 'nums-mock', seenSet);
  const psych = selectUnique(NUMS_PSYCHOLOGICAL_QUESTIONS, 50, 'Psychological Assessment', 'nums-mock', seenSet);

  return [...bio, ...chem, ...phys, ...eng, ...psych];
}

/**
 * GIKI Admission Test: 80 MCQs, 120 mins. No negative marking.
 * Mathematics (30), Physics (30), English (20)
 */
export function generateGikiFullMockBank(seenStemsInput?: Set<string> | string[]): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const math = selectUnique(TCAT_MATH_QUESTIONS, 30, 'Mathematics', 'giki-mock', seenSet);
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 30, 'Physics', 'giki-mock', seenSet);
  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 20, 'English', 'giki-mock', seenSet);

  return [...math, ...phys, ...eng];
}

/**
 * HEC USAT (Undergraduate Studies Admission Test): 100 MCQs, 100 mins. 50 passing.
 * Part 1: Verbal Reasoning (20), Quantitative Reasoning (25)
 * Part 2:
 *   USAT-E: Physics (30), Mathematics (25)
 *   USAT-CS: Physics (20), Computer Science (20), Mathematics (15)
 */
export function generateUsatFullMockBank(
  category: 'USAT-E' | 'USAT-CS' | string = 'USAT-E',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const verbal = selectUnique([...APTITUDE_VERBAL_QUESTIONS, ...TCAT_ENGLISH_QUESTIONS], 20, 'Verbal Reasoning', 'usat-mock', seenSet);
  const quant = selectUnique([...APTITUDE_QUANT_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS], 25, 'Quantitative Reasoning', 'usat-mock', seenSet);

  const isCs = String(category).toUpperCase().includes('CS');

  if (isCs) {
    const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 20, 'Physics', 'usat-mock', seenSet);
    const cs = selectUnique(TCAT_CS_QUESTIONS, 20, 'Computer Science', 'usat-mock', seenSet);
    const math = selectUnique(TCAT_MATH_QUESTIONS, 15, 'Mathematics', 'usat-mock', seenSet);
    return [...verbal, ...quant, ...phys, ...cs, ...math];
  } else {
    // USAT-E Pre-Engineering
    const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 30, 'Physics', 'usat-mock', seenSet);
    const math = selectUnique(TCAT_MATH_QUESTIONS, 25, 'Mathematics', 'usat-mock', seenSet);
    return [...verbal, ...quant, ...phys, ...math];
  }
}

/**
 * NED University: 100 MCQs, 120 mins, no negative marking.
 * Mathematics (25), Physics (25), Chemistry (25), English (25).
 */
export function generateNedFullMockBank(seenStemsInput?: Set<string> | string[]): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const math = selectUnique(TCAT_MATH_QUESTIONS, 25, 'Mathematics', 'ned-mock', seenSet);
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 25, 'Physics', 'ned-mock', seenSet);
  const chem = selectUnique(TCAT_CHEMISTRY_QUESTIONS, 25, 'Chemistry', 'ned-mock', seenSet);
  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 25, 'English', 'ned-mock', seenSet);

  return [...math, ...phys, ...chem, ...eng];
}

/**
 * PIEAS: 100 MCQs, 180 mins, no negative marking.
 * Pre-Engineering: English (10), Mathematics (30), Physics (30), Chemistry (30)
 * ICS: English (10), Mathematics (30), Physics (30), Computer Science (30)
 */
export function generatePieasFullMockBank(
  stream: 'Pre-Engineering' | 'ICS' | string = 'Pre-Engineering',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const isIcs = String(stream).toUpperCase().includes('ICS') || String(stream).toUpperCase().includes('COMPUTER');
  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 10, 'English', 'pieas-mock', seenSet);
  const math = selectUnique(TCAT_MATH_QUESTIONS, 30, 'Mathematics', 'pieas-mock', seenSet);
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 30, 'Physics', 'pieas-mock', seenSet);

  if (isIcs) {
    const cs = selectUnique(TCAT_CS_QUESTIONS, 30, 'Computer Science', 'pieas-mock', seenSet);
    return [...eng, ...math, ...phys, ...cs];
  }

  const chem = selectUnique(TCAT_CHEMISTRY_QUESTIONS, 30, 'Chemistry', 'pieas-mock', seenSet);
  return [...eng, ...math, ...phys, ...chem];
}

/**
 * NTS NAT (Shared Portal): 90 MCQs, 120 mins, no negative marking.
 * Common: English (20), Analytical Reasoning (20), Quantitative Reasoning (20).
 * Subject Knowledge (30):
 *   NAT-IE: Physics (10), Chemistry (10), Mathematics (10)
 *   NAT-IM: Physics (10), Chemistry (10), Biology (10)
 *   NAT-ICS: Physics (10), Computer Science (10), Mathematics (10)
 */
export function generateNatFullMockBank(
  stream: 'NAT-IE' | 'NAT-IM' | 'NAT-ICS' | string = 'NAT-IE',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const eng = selectUnique([...APTITUDE_VERBAL_QUESTIONS, ...TCAT_ENGLISH_QUESTIONS], 20, 'English', 'nat-mock', seenSet);
  const analytical = selectUnique(FAST_IQ_ANALYTICAL_QUESTIONS, 20, 'Analytical Reasoning', 'nat-mock', seenSet);
  const quant = selectUnique([...APTITUDE_QUANT_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS], 20, 'Quantitative Reasoning', 'nat-mock', seenSet);

  const upper = String(stream).toUpperCase();
  if (upper.includes('NAT-IM') || upper.includes('MEDICAL')) {
    const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 10, 'Physics', 'nat-mock', seenSet);
    const chem = selectUnique(TCAT_CHEMISTRY_QUESTIONS, 10, 'Chemistry', 'nat-mock', seenSet);
    const bio = selectUnique(MDCAT_PREBUILT_QUESTIONS['Biology'] || [], 10, 'Biology', 'nat-mock', seenSet);
    return [...eng, ...analytical, ...quant, ...phys, ...chem, ...bio];
  } else if (upper.includes('NAT-ICS') || upper.includes('CS') || upper.includes('COMPUTER')) {
    const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 10, 'Physics', 'nat-mock', seenSet);
    const cs = selectUnique(TCAT_CS_QUESTIONS, 10, 'Computer Science', 'nat-mock', seenSet);
    const math = selectUnique(TCAT_MATH_QUESTIONS, 10, 'Mathematics', 'nat-mock', seenSet);
    return [...eng, ...analytical, ...quant, ...phys, ...cs, ...math];
  } else {
    // NAT-IE Pre-Engineering
    const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 10, 'Physics', 'nat-mock', seenSet);
    const chem = selectUnique(TCAT_CHEMISTRY_QUESTIONS, 10, 'Chemistry', 'nat-mock', seenSet);
    const math = selectUnique(TCAT_MATH_QUESTIONS, 10, 'Mathematics', 'nat-mock', seenSet);
    return [...eng, ...analytical, ...quant, ...phys, ...chem, ...math];
  }
}

/**
 * IBA Karachi Aptitude Test: 90 MCQs, 165 mins. Negative marking default ON (-1).
 * English (45), Mathematics (45).
 */
export function generateIbaFullMockBank(seenStemsInput?: Set<string> | string[]): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const eng = selectUnique([...APTITUDE_VERBAL_QUESTIONS, ...TCAT_ENGLISH_QUESTIONS], 45, 'English', 'iba-mock', seenSet);
  const math = selectUnique([...APTITUDE_QUANT_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS, ...TCAT_MATH_QUESTIONS], 45, 'Mathematics', 'iba-mock', seenSet);

  return [...eng, ...math];
}

/**
 * Aga Khan University (AKU) Test: 100 Marks, 120 mins.
 * Science Achievement (40 marks, -0.25 negative marking): Biology (16), Chemistry (12), Physics (12)
 * Science Reasoning (30 marks, no negative marking)
 * Mathematical Reasoning (30 marks, no negative marking)
 */
export function generateAkuFullMockBank(seenStemsInput?: Set<string> | string[]): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const bio = selectUnique(MDCAT_PREBUILT_QUESTIONS['Biology'] || [], 16, 'Biology', 'aku-mock', seenSet);
  const chem = selectUnique(TCAT_CHEMISTRY_QUESTIONS, 12, 'Chemistry', 'aku-mock', seenSet);
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 12, 'Physics', 'aku-mock', seenSet);
  const sciReasoning = selectUnique(AKU_SCIENCE_REASONING_QUESTIONS, 30, 'Science Reasoning', 'aku-mock', seenSet);
  const mathReasoning = selectUnique([...AKU_MATH_REASONING_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS], 30, 'Mathematical Reasoning', 'aku-mock', seenSet);

  return [...bio, ...chem, ...phys, ...sciReasoning, ...mathReasoning];
}

/**
 * Mehran UET Jamshoro (MUET): 100 MCQs, 100 mins, no negative marking.
 * Pre-Eng: Math 25, Physics 25, Chemistry 25, English 25
 * ICS: Math 25, Physics 25, Computer Science 25, English 25
 * Pre-Med: Biology 25, Physics 25, Chemistry 25, English 25
 */
export function generateMuetFullMockBank(
  stream: 'Pre-Engineering' | 'ICS' | 'Pre-Medical' | string = 'Pre-Engineering',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const upper = String(stream).toUpperCase();
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 25, 'Physics', 'muet-mock', seenSet);
  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 25, 'English', 'muet-mock', seenSet);

  if (upper.includes('MEDICAL')) {
    const bio = selectUnique(MDCAT_PREBUILT_QUESTIONS['Biology'] || [], 25, 'Biology', 'muet-mock', seenSet);
    const chem = selectUnique(TCAT_CHEMISTRY_QUESTIONS, 25, 'Chemistry', 'muet-mock', seenSet);
    return [...bio, ...phys, ...chem, ...eng];
  } else if (upper.includes('ICS') || upper.includes('CS') || upper.includes('COMPUTER')) {
    const math = selectUnique(TCAT_MATH_QUESTIONS, 25, 'Mathematics', 'muet-mock', seenSet);
    const cs = selectUnique(TCAT_CS_QUESTIONS, 25, 'Computer Science', 'muet-mock', seenSet);
    return [...math, ...phys, ...cs, ...eng];
  } else {
    // Pre-Engineering
    const math = selectUnique(TCAT_MATH_QUESTIONS, 25, 'Mathematics', 'muet-mock', seenSet);
    const chem = selectUnique(TCAT_CHEMISTRY_QUESTIONS, 25, 'Chemistry', 'muet-mock', seenSet);
    return [...math, ...phys, ...chem, ...eng];
  }
}

/**
 * LUMS: Two test paths
 * Path 1: General LCAT: 90 MCQs, 160 mins. Verbal (45) + Quantitative (45)
 * Path 2: Scientific Aptitude Test (CS & SSE): 100 MCQs. Physics 25, Chemistry 25, Math 25, Biology 25.
 */
export function generateLumsFullMockBank(
  pathMode: 'LCAT' | 'SSE-Scientific' | string = 'LCAT',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const upper = String(pathMode).toUpperCase();
  if (upper.includes('SCIENTIFIC') || upper.includes('SSE')) {
    const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 25, 'Physics', 'lums-mock', seenSet);
    const chem = selectUnique(TCAT_CHEMISTRY_QUESTIONS, 25, 'Chemistry', 'lums-mock', seenSet);
    const math = selectUnique(TCAT_MATH_QUESTIONS, 25, 'Mathematics', 'lums-mock', seenSet);
    const bio = selectUnique(MDCAT_PREBUILT_QUESTIONS['Biology'] || [], 25, 'Biology', 'lums-mock', seenSet);
    return [...phys, ...chem, ...math, ...bio];
  }

  // Default: Undergraduate LCAT
  const verbal = selectUnique([...APTITUDE_VERBAL_QUESTIONS, ...TCAT_ENGLISH_QUESTIONS], 45, 'Verbal Reasoning', 'lums-mock', seenSet);
  const quant = selectUnique([...APTITUDE_QUANT_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS, ...TCAT_MATH_QUESTIONS], 45, 'Quantitative Reasoning', 'lums-mock', seenSet);
  return [...verbal, ...quant];
}

/**
 * NUML: 75 MCQs, 60 mins, min 50% passing threshold, no negative marking.
 * Eng (20), Physics (20), Math (20), CS or Chem/Bio (15).
 */
export function generateNumlFullMockBank(
  stream: 'Engineering & CS' | 'Pre-Medical' | string = 'Engineering & CS',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 20, 'English', 'numl-mock', seenSet);
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 20, 'Physics', 'numl-mock', seenSet);
  const math = selectUnique(TCAT_MATH_QUESTIONS, 20, 'Mathematics', 'numl-mock', seenSet);

  if (String(stream).toUpperCase().includes('MEDICAL')) {
    const bioChem = selectUnique([...MDCAT_PREBUILT_QUESTIONS['Biology'] || [], ...TCAT_CHEMISTRY_QUESTIONS], 15, 'Chemistry & Biology', 'numl-mock', seenSet);
    return [...eng, ...phys, ...math, ...bioChem];
  }

  const cs = selectUnique(TCAT_CS_QUESTIONS, 15, 'Computer Science', 'numl-mock', seenSet);
  return [...eng, ...phys, ...math, ...cs];
}

/**
 * HITEC University Taxila: 100 MCQs, 120 mins, 50% qualifying pass rate.
 * Mathematics (30), Physics (30), Chemistry/CS (20), English (20).
 */
export function generateHitecFullMockBank(
  stream: 'Engineering' | 'Computing' | string = 'Engineering',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const math = selectUnique(TCAT_MATH_QUESTIONS, 30, 'Mathematics', 'hitec-mock', seenSet);
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 30, 'Physics', 'hitec-mock', seenSet);
  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 20, 'English', 'hitec-mock', seenSet);

  if (String(stream).toUpperCase().includes('COMPUT') || String(stream).toUpperCase().includes('CS')) {
    const cs = selectUnique(TCAT_CS_QUESTIONS, 20, 'Computer Science', 'hitec-mock', seenSet);
    return [...math, ...phys, ...cs, ...eng];
  }

  const chem = selectUnique(TCAT_CHEMISTRY_QUESTIONS, 20, 'Chemistry', 'hitec-mock', seenSet);
  return [...math, ...phys, ...chem, ...eng];
}

/**
 * NUTECH (NUET): 200 MCQs, 180 mins, no negative marking.
 * Engineering: Math 40% (80), Physics 30% (60), Chem/CS 20% (40), English 10% (20).
 * Computing: Math 50% (100), Physics/CS 30% (60), English 20% (40).
 */
export function generateNutechFullMockBank(
  stream: 'Engineering' | 'Computing' | string = 'Engineering',
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  const isComputing = String(stream).toUpperCase().includes('COMPUT') || String(stream).toUpperCase().includes('CS');

  if (isComputing) {
    const math = selectUnique(TCAT_MATH_QUESTIONS, 100, 'Mathematics', 'nutech-mock', seenSet);
    const csPhys = selectUnique([...TCAT_CS_QUESTIONS, ...TCAT_PHYSICS_QUESTIONS], 60, 'Physics & CS', 'nutech-mock', seenSet);
    const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 40, 'English', 'nutech-mock', seenSet);
    return [...math, ...csPhys, ...eng];
  }

  const math = selectUnique(TCAT_MATH_QUESTIONS, 80, 'Mathematics', 'nutech-mock', seenSet);
  const phys = selectUnique(TCAT_PHYSICS_QUESTIONS, 60, 'Physics', 'nutech-mock', seenSet);
  const chemCs = selectUnique([...TCAT_CHEMISTRY_QUESTIONS, ...TCAT_CS_QUESTIONS], 40, 'Chemistry & CS', 'nutech-mock', seenSet);
  const eng = selectUnique(TCAT_ENGLISH_QUESTIONS, 20, 'English', 'nutech-mock', seenSet);
  return [...math, ...phys, ...chemCs, ...eng];
}

/**
 * Subject-level question retriever for practice tests across any of the entrance exams
 */
export function getEntranceExamQuestions(
  track: string,
  subject: string,
  count: number = 20,
  seenStemsInput?: Set<string> | string[]
): Question[] {
  const normSubject = subject.trim().toLowerCase();
  let pool: Question[] = [];

  if (normSubject.includes('science reasoning')) {
    pool = AKU_SCIENCE_REASONING_QUESTIONS;
  } else if (normSubject.includes('math reasoning') || normSubject.includes('mathematical reasoning')) {
    pool = [...AKU_MATH_REASONING_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS];
  } else if (normSubject.includes('psych')) {
    pool = NUMS_PSYCHOLOGICAL_QUESTIONS;
  } else if (normSubject.includes('iq') || normSubject.includes('analytical')) {
    pool = FAST_IQ_ANALYTICAL_QUESTIONS;
  } else if (normSubject.includes('basic math') || normSubject.includes('quantitative')) {
    pool = [...APTITUDE_QUANT_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS];
  } else if (normSubject.includes('adv') || normSubject.includes('math')) {
    pool = TCAT_MATH_QUESTIONS;
  } else if (normSubject.includes('phys')) {
    pool = TCAT_PHYSICS_QUESTIONS;
  } else if (normSubject.includes('chem')) {
    pool = TCAT_CHEMISTRY_QUESTIONS;
  } else if (normSubject.includes('comp') || normSubject.includes('cs')) {
    pool = TCAT_CS_QUESTIONS;
  } else if (normSubject.includes('bio')) {
    pool = MDCAT_PREBUILT_QUESTIONS['Biology'] || [];
  } else if (normSubject.includes('eng') || normSubject.includes('verbal')) {
    pool = [...APTITUDE_VERBAL_QUESTIONS, ...TCAT_ENGLISH_QUESTIONS];
  } else {
    pool = TCAT_MATH_QUESTIONS;
  }

  const seenSet = seenStemsInput instanceof Set
    ? seenStemsInput
    : new Set(Array.isArray(seenStemsInput) ? seenStemsInput.map(s => normalizeQuestionStem(s)) : []);

  return selectUnique(pool, count, subject, `${track.toLowerCase()}-practice`, seenSet);
}

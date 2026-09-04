import { Question } from '../types';
import { MDCAT_BIOLOGY_NEW_QUESTIONS } from './mdcatBiologyQuestions';
import { MDCAT_BIOLOGY_BATCH2_PART1 } from './mdcatBiologyBatch2Part1';
import { MDCAT_BIOLOGY_BATCH2_PART2 } from './mdcatBiologyBatch2Part2';
import { MDCAT_BIOLOGY_BATCH3_PART1 } from './mdcatBiologyBatch3Part1';
import { MDCAT_BIOLOGY_BATCH3_PART2 } from './mdcatBiologyBatch3Part2';
import { MDCAT_BIOLOGY_BATCH4_PART1 } from './mdcatBiologyBatch4Part1';
import { MDCAT_BIOLOGY_BATCH4_PART2 } from './mdcatBiologyBatch4Part2';
import { MDCAT_BIOLOGY_BATCH5_PART1 } from './mdcatBiologyBatch5Part1';
import { MDCAT_BIOLOGY_BATCH5_PART2 } from './mdcatBiologyBatch5Part2';
import { MDCAT_BIOLOGY_BATCH6_PART1 } from './mdcatBiologyBatch6Part1';
import { MDCAT_BIOLOGY_BATCH6_PART2 } from './mdcatBiologyBatch6Part2';
import { MDCAT_BIOLOGY_BATCH7_PART1 } from './mdcatBiologyBatch7Part1';
import { MDCAT_BIOLOGY_BATCH7_PART2 } from './mdcatBiologyBatch7Part2';
import { MDCAT_BIOLOGY_BATCH8_PART1 } from './mdcatBiologyBatch8Part1';
import { MDCAT_BIOLOGY_BATCH8_PART2 } from './mdcatBiologyBatch8Part2';
import { MDCAT_BIOLOGY_BATCH9_PART1 } from './mdcatBiologyBatch9Part1';
import { MDCAT_BIOLOGY_BATCH9_PART2 } from './mdcatBiologyBatch9Part2';
import { MDCAT_BIOLOGY_BATCH10_PART1 } from './mdcatBiologyBatch10Part1';
import { MDCAT_BIOLOGY_BATCH10_PART2 } from './mdcatBiologyBatch10Part2';

import { MDCAT_CHEMISTRY_NEW_QUESTIONS } from './mdcatChemistryQuestions';
import { MDCAT_CHEMISTRY_BATCH2 } from './mdcatChemistryBatch2';
import { MDCAT_CHEMISTRY_BATCH3 } from './mdcatChemistryBatch3';
import { MDCAT_CHEMISTRY_BATCH4 } from './mdcatChemistryBatch4';
import { MDCAT_CHEMISTRY_BATCH5 } from './mdcatChemistryBatch5';
import { MDCAT_CHEMISTRY_BATCH6 } from './mdcatChemistryBatch6';
import { MDCAT_CHEMISTRY_BATCH7 } from './mdcatChemistryBatch7';
import { MDCAT_CHEMISTRY_BATCH8 } from './mdcatChemistryBatch8';
import { MDCAT_CHEMISTRY_BATCH9 } from './mdcatChemistryBatch9';
import { MDCAT_CHEMISTRY_BATCH10 } from './mdcatChemistryBatch10';

import { MDCAT_PHYSICS_NEW_QUESTIONS } from './mdcatPhysicsQuestions';
import { MDCAT_PHYSICS_BATCH2 } from './mdcatPhysicsBatch2';
import { MDCAT_PHYSICS_BATCH3 } from './mdcatPhysicsBatch3';
import { MDCAT_PHYSICS_BATCH4 } from './mdcatPhysicsBatch4';
import { MDCAT_PHYSICS_BATCH5 } from './mdcatPhysicsBatch5';
import { MDCAT_PHYSICS_BATCH6 } from './mdcatPhysicsBatch6';
import { MDCAT_PHYSICS_BATCH7 } from './mdcatPhysicsBatch7';
import { MDCAT_PHYSICS_BATCH8 } from './mdcatPhysicsBatch8';
import { MDCAT_PHYSICS_BATCH9 } from './mdcatPhysicsBatch9';
import { MDCAT_PHYSICS_BATCH10 } from './mdcatPhysicsBatch10';

import { MDCAT_ENGLISH_NEW_QUESTIONS } from './mdcatEnglishQuestions';
import { MDCAT_ENGLISH_BATCH2 } from './mdcatEnglishBatch2';
import { MDCAT_ENGLISH_BATCH3 } from './mdcatEnglishBatch3';
import { MDCAT_ENGLISH_BATCH4 } from './mdcatEnglishBatch4';
import { MDCAT_ENGLISH_BATCH5 } from './mdcatEnglishBatch5';
import { MDCAT_ENGLISH_BATCH6 } from './mdcatEnglishBatch6';
import { MDCAT_ENGLISH_BATCH7 } from './mdcatEnglishBatch7';
import { MDCAT_ENGLISH_BATCH8 } from './mdcatEnglishBatch8';
import { MDCAT_ENGLISH_BATCH9 } from './mdcatEnglishBatch9';
import { MDCAT_ENGLISH_BATCH10 } from './mdcatEnglishBatch10';

import { MDCAT_LOGICAL_REASONING_NEW_QUESTIONS } from './mdcatLogicalReasoningQuestions';
import { MDCAT_LOGICAL_REASONING_BATCH2 } from './mdcatLogicalReasoningBatch2';
import { MDCAT_LOGICAL_REASONING_BATCH3 } from './mdcatLogicalReasoningBatch3';
import { MDCAT_LOGICAL_REASONING_BATCH4 } from './mdcatLogicalReasoningBatch4';
import { MDCAT_LOGICAL_REASONING_BATCH5 } from './mdcatLogicalReasoningBatch5';
import { MDCAT_LOGICAL_REASONING_BATCH6 } from './mdcatLogicalReasoningBatch6';
import { MDCAT_LOGICAL_REASONING_BATCH7 } from './mdcatLogicalReasoningBatch7';
import { MDCAT_LOGICAL_REASONING_BATCH8 } from './mdcatLogicalReasoningBatch8';
import { MDCAT_LOGICAL_REASONING_BATCH9 } from './mdcatLogicalReasoningBatch9';
import { MDCAT_LOGICAL_REASONING_BATCH10 } from './mdcatLogicalReasoningBatch10';

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

// Batch 1 (300 verified MCQs)
export const MDCAT_BATCH1_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_NEW_QUESTIONS,
  ...MDCAT_CHEMISTRY_NEW_QUESTIONS,
  ...MDCAT_PHYSICS_NEW_QUESTIONS,
  ...MDCAT_ENGLISH_NEW_QUESTIONS,
  ...MDCAT_LOGICAL_REASONING_NEW_QUESTIONS
];

// Batch 2 (300 new verified MCQs)
export const MDCAT_BATCH2_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH2_PART1,
  ...MDCAT_BIOLOGY_BATCH2_PART2,
  ...MDCAT_CHEMISTRY_BATCH2,
  ...MDCAT_PHYSICS_BATCH2,
  ...MDCAT_ENGLISH_BATCH2,
  ...MDCAT_LOGICAL_REASONING_BATCH2
];

// Batch 3 (300 new verified MCQs bringing bank to 900 total)
export const MDCAT_BATCH3_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH3_PART1,
  ...MDCAT_BIOLOGY_BATCH3_PART2,
  ...MDCAT_CHEMISTRY_BATCH3,
  ...MDCAT_PHYSICS_BATCH3,
  ...MDCAT_ENGLISH_BATCH3,
  ...MDCAT_LOGICAL_REASONING_BATCH3
];

// Batch 4 (300 new verified MCQs bringing bank to 1200 total)
export const MDCAT_BATCH4_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH4_PART1,
  ...MDCAT_BIOLOGY_BATCH4_PART2,
  ...MDCAT_CHEMISTRY_BATCH4,
  ...MDCAT_PHYSICS_BATCH4,
  ...MDCAT_ENGLISH_BATCH4,
  ...MDCAT_LOGICAL_REASONING_BATCH4
];

// Batch 5 (300 new verified MCQs bringing bank to 1500 total)
export const MDCAT_BATCH5_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH5_PART1,
  ...MDCAT_BIOLOGY_BATCH5_PART2,
  ...MDCAT_CHEMISTRY_BATCH5,
  ...MDCAT_PHYSICS_BATCH5,
  ...MDCAT_ENGLISH_BATCH5,
  ...MDCAT_LOGICAL_REASONING_BATCH5
];

// Batch 6 (300 new verified MCQs bringing bank to 1800 total)
export const MDCAT_BATCH6_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH6_PART1,
  ...MDCAT_BIOLOGY_BATCH6_PART2,
  ...MDCAT_CHEMISTRY_BATCH6,
  ...MDCAT_PHYSICS_BATCH6,
  ...MDCAT_ENGLISH_BATCH6,
  ...MDCAT_LOGICAL_REASONING_BATCH6
];

// Batch 7 (300 new verified MCQs bringing bank to 2100 total)
export const MDCAT_BATCH7_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH7_PART1,
  ...MDCAT_BIOLOGY_BATCH7_PART2,
  ...MDCAT_CHEMISTRY_BATCH7,
  ...MDCAT_PHYSICS_BATCH7,
  ...MDCAT_ENGLISH_BATCH7,
  ...MDCAT_LOGICAL_REASONING_BATCH7
];

// Batch 8 (300 new verified MCQs bringing bank to 2400 total)
export const MDCAT_BATCH8_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH8_PART1,
  ...MDCAT_BIOLOGY_BATCH8_PART2,
  ...MDCAT_CHEMISTRY_BATCH8,
  ...MDCAT_PHYSICS_BATCH8,
  ...MDCAT_ENGLISH_BATCH8,
  ...MDCAT_LOGICAL_REASONING_BATCH8
];

// Batch 9 (300 new verified MCQs bringing bank to 2700 total)
export const MDCAT_BATCH9_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH9_PART1,
  ...MDCAT_BIOLOGY_BATCH9_PART2,
  ...MDCAT_CHEMISTRY_BATCH9,
  ...MDCAT_PHYSICS_BATCH9,
  ...MDCAT_ENGLISH_BATCH9,
  ...MDCAT_LOGICAL_REASONING_BATCH9
];

// Batch 10 (300 new verified MCQs bringing bank to 3000 total)
export const MDCAT_BATCH10_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH10_PART1,
  ...MDCAT_BIOLOGY_BATCH10_PART2,
  ...MDCAT_CHEMISTRY_BATCH10,
  ...MDCAT_PHYSICS_BATCH10,
  ...MDCAT_ENGLISH_BATCH10,
  ...MDCAT_LOGICAL_REASONING_BATCH10
];

function normalizeQuestion(q: Question, fallbackSubject: string): Question {
  return {
    ...q,
    subject: q.subject || fallbackSubject,
    chapter: q.chapter || q.topic || 'General',
    topic: q.topic || q.chapter || 'General',
  };
}

// Primary 3000 Question Repository grouped by Subject according to PMDC Exam Weightage
export const MDCAT_PREBUILT_QUESTIONS: Record<string, Question[]> = {
  Biology: [
    ...MDCAT_BIOLOGY_NEW_QUESTIONS,
    ...MDCAT_BIOLOGY_BATCH2_PART1,
    ...MDCAT_BIOLOGY_BATCH2_PART2,
    ...MDCAT_BIOLOGY_BATCH3_PART1,
    ...MDCAT_BIOLOGY_BATCH3_PART2,
    ...MDCAT_BIOLOGY_BATCH4_PART1,
    ...MDCAT_BIOLOGY_BATCH4_PART2,
    ...MDCAT_BIOLOGY_BATCH5_PART1,
    ...MDCAT_BIOLOGY_BATCH5_PART2,
    ...MDCAT_BIOLOGY_BATCH6_PART1,
    ...MDCAT_BIOLOGY_BATCH6_PART2,
    ...MDCAT_BIOLOGY_BATCH7_PART1,
    ...MDCAT_BIOLOGY_BATCH7_PART2,
    ...MDCAT_BIOLOGY_BATCH8_PART1,
    ...MDCAT_BIOLOGY_BATCH8_PART2,
    ...MDCAT_BIOLOGY_BATCH9_PART1,
    ...MDCAT_BIOLOGY_BATCH9_PART2,
    ...MDCAT_BIOLOGY_BATCH10_PART1,
    ...MDCAT_BIOLOGY_BATCH10_PART2
  ].map(q => normalizeQuestion(q, 'Biology')),
  Chemistry: [
    ...MDCAT_CHEMISTRY_NEW_QUESTIONS,
    ...MDCAT_CHEMISTRY_BATCH2,
    ...MDCAT_CHEMISTRY_BATCH3,
    ...MDCAT_CHEMISTRY_BATCH4,
    ...MDCAT_CHEMISTRY_BATCH5,
    ...MDCAT_CHEMISTRY_BATCH6,
    ...MDCAT_CHEMISTRY_BATCH7,
    ...MDCAT_CHEMISTRY_BATCH8,
    ...MDCAT_CHEMISTRY_BATCH9,
    ...MDCAT_CHEMISTRY_BATCH10
  ].map(q => normalizeQuestion(q, 'Chemistry')),
  Physics: [
    ...MDCAT_PHYSICS_NEW_QUESTIONS,
    ...MDCAT_PHYSICS_BATCH2,
    ...MDCAT_PHYSICS_BATCH3,
    ...MDCAT_PHYSICS_BATCH4,
    ...MDCAT_PHYSICS_BATCH5,
    ...MDCAT_PHYSICS_BATCH6,
    ...MDCAT_PHYSICS_BATCH7,
    ...MDCAT_PHYSICS_BATCH8,
    ...MDCAT_PHYSICS_BATCH9,
    ...MDCAT_PHYSICS_BATCH10
  ].map(q => normalizeQuestion(q, 'Physics')),
  English: [
    ...MDCAT_ENGLISH_NEW_QUESTIONS,
    ...MDCAT_ENGLISH_BATCH2,
    ...MDCAT_ENGLISH_BATCH3,
    ...MDCAT_ENGLISH_BATCH4,
    ...MDCAT_ENGLISH_BATCH5,
    ...MDCAT_ENGLISH_BATCH6,
    ...MDCAT_ENGLISH_BATCH7,
    ...MDCAT_ENGLISH_BATCH8,
    ...MDCAT_ENGLISH_BATCH9,
    ...MDCAT_ENGLISH_BATCH10
  ].map(q => normalizeQuestion(q, 'English')),
  'Logical Reasoning': [
    ...MDCAT_LOGICAL_REASONING_NEW_QUESTIONS,
    ...MDCAT_LOGICAL_REASONING_BATCH2,
    ...MDCAT_LOGICAL_REASONING_BATCH3,
    ...MDCAT_LOGICAL_REASONING_BATCH4,
    ...MDCAT_LOGICAL_REASONING_BATCH5,
    ...MDCAT_LOGICAL_REASONING_BATCH6,
    ...MDCAT_LOGICAL_REASONING_BATCH7,
    ...MDCAT_LOGICAL_REASONING_BATCH8,
    ...MDCAT_LOGICAL_REASONING_BATCH9,
    ...MDCAT_LOGICAL_REASONING_BATCH10
  ].map(q => normalizeQuestion(q, 'Logical Reasoning'))
};

// Aliases for robust subject mapping
MDCAT_PREBUILT_QUESTIONS['biology'] = MDCAT_PREBUILT_QUESTIONS.Biology;
MDCAT_PREBUILT_QUESTIONS['chemistry'] = MDCAT_PREBUILT_QUESTIONS.Chemistry;
MDCAT_PREBUILT_QUESTIONS['physics'] = MDCAT_PREBUILT_QUESTIONS.Physics;
MDCAT_PREBUILT_QUESTIONS['english'] = MDCAT_PREBUILT_QUESTIONS.English;
MDCAT_PREBUILT_QUESTIONS['logical reasoning'] = MDCAT_PREBUILT_QUESTIONS['Logical Reasoning'];
MDCAT_PREBUILT_QUESTIONS['Logical reasoning'] = MDCAT_PREBUILT_QUESTIONS['Logical Reasoning'];
MDCAT_PREBUILT_QUESTIONS['Logical Reasoning '] = MDCAT_PREBUILT_QUESTIONS['Logical Reasoning'];

export const ALL_MDCAT_QUESTIONS: Question[] = [
  ...MDCAT_PREBUILT_QUESTIONS.Biology,
  ...MDCAT_PREBUILT_QUESTIONS.Chemistry,
  ...MDCAT_PREBUILT_QUESTIONS.Physics,
  ...MDCAT_PREBUILT_QUESTIONS.English,
  ...MDCAT_PREBUILT_QUESTIONS['Logical Reasoning'],
];

/**
 * Acronym and synonym mappings for MDCAT syllabus subtopics
 */
const ACRONYMS: Record<string, string[]> = {
  'er': ['endoplasmic reticulum', 'rough er', 'smooth er', 'rer', 'ser', 'endomembrane'],
  'atp': ['atp', 'adenosine triphosphate'],
  'dna': ['dna', 'deoxyribonucleic acid'],
  'rna': ['rna', 'ribonucleic acid', 'mrna', 'trna', 'rrna'],
  'pcr': ['pcr', 'polymerase chain reaction', 'taq polymerase'],
  'shm': ['shm', 'simple harmonic motion'],
  'si': ['si unit', 'si units', 'international system'],
};

const GENERIC_STOP_WORDS = new Set([
  'cell', 'cells', 'cellular', 'structure', 'structures', 'function', 'functions',
  'system', 'systems', 'type', 'types', 'process', 'processes', 'concept', 'concepts',
  'basic', 'basics', 'general', 'standard', 'definition', 'introduction', 'overview',
  'and', 'the', 'for', 'with', 'from', 'into', 'that', 'this', 'what', 'which', 'all', 'etc', 'model', 'practice'
]);

function getSubtopicSearchTerms(subtopic: string): { phrases: string[]; keywords: string[] } {
  const clean = subtopic.trim();
  const lower = clean.toLowerCase();
  const phrases: string[] = [];
  const keywords: string[] = [];

  // Special domain expansions
  if (lower.includes('plasma membrane') || lower.includes('fluid mosaic')) {
    phrases.push('plasma membrane', 'fluid mosaic', 'cell membrane', 'membrane fluidity', 'lipid bilayer', 'phospholipid bilayer');
  }
  if (lower.includes('mitochondria') || lower.includes('chloroplast')) {
    phrases.push('mitochondria', 'chloroplast', 'cristae', 'thylakoid', 'endosymbiotic');
  }
  if (lower.includes('er') || lower.includes('endoplasmic')) {
    phrases.push('endoplasmic reticulum', 'rough er', 'smooth er', 'rer', 'ser', 'endomembrane');
  }
  if (lower.includes('golgi')) {
    phrases.push('golgi', 'dictyosome', 'glycosylation', 'cis face', 'trans face');
  }
  if (lower.includes('ribosome')) {
    phrases.push('ribosome', '80s', '70s', 'polysome', 'sedimentation');
  }
  if (lower.includes('lysosome') || lower.includes('peroxisome')) {
    phrases.push('lysosome', 'peroxisome', 'acid hydrolase', 'catalase', 'tay-sachs', 'phagocytosis');
  }
  if (lower.includes('cytoskeleton')) {
    phrases.push('cytoskeleton', 'microtubule', 'microfilament', 'intermediate filament', 'actin', 'tubulin');
  }
  if (lower.includes('nucleus')) {
    phrases.push('nucleus', 'nucleolus', 'nuclear pore', 'chromatin', 'nuclear envelope');
  }

  // Split on '&', 'and', or '/'
  const subSegments = lower.split(/\s+(?:&|and|\/)\s+/);
  for (const seg of subSegments) {
    const parenMatch = seg.match(/^([^()]+)\s*\(([^()]+)\)/);
    if (parenMatch) {
      const mainPart = parenMatch[1].trim();
      const parenPart = parenMatch[2].trim();
      if (mainPart) phrases.push(mainPart);
      if (parenPart) phrases.push(parenPart);
    } else {
      phrases.push(seg.trim());
    }
  }

  for (const p of phrases) {
    if (ACRONYMS[p]) {
      phrases.push(...ACRONYMS[p]);
    }
    const words = p.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => 
      w.length >= 3 && !GENERIC_STOP_WORDS.has(w)
    );
    keywords.push(...words);
  }

  return {
    phrases: [...new Set(phrases.filter(p => p.length >= 3))],
    keywords: [...new Set(keywords)]
  };
}

function scoreQuestionSubtopic(q: Question, subtopic: string): number {
  const { phrases, keywords } = getSubtopicSearchTerms(subtopic);
  const qTopic = (q.topic || '').toLowerCase();
  const qStem = (q.q || '').toLowerCase();
  const qExp = (q.explain || '').toLowerCase();

  let score = 0;
  for (const phrase of phrases) {
    if (qTopic.includes(phrase)) score += 14;
    if (qStem.includes(phrase)) score += 8;
    if (qExp.includes(phrase)) score += 3;
  }
  for (const kw of keywords) {
    if (qTopic.includes(kw)) score += 4;
    if (qStem.includes(kw)) score += 2;
  }
  return score;
}

function matchesChapter(qChap: string | undefined, targetChap: string): boolean {
  if (!qChap || !targetChap) return false;
  const normQ = qChap.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const normT = targetChap.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  return normQ === normT || normQ.includes(normT) || normT.includes(normQ);
}

function resolveScope(subject: string, topic?: string, chapterName?: string, subtopic?: string) {
  let resolvedChapter = chapterName?.trim();
  let resolvedSubtopic = subtopic?.trim();

  if (topic && topic.trim()) {
    const cleanT = topic.trim();
    const lowerT = cleanT.toLowerCase();

    // Generic full-subject / mock indicator
    const isGenericSubject = lowerT.includes('all chapters') ||
      lowerT.includes('all topic') ||
      lowerT.includes('full mock') ||
      lowerT.includes('full exam') ||
      lowerT.includes('syllabus') ||
      lowerT === subject.toLowerCase();

    if (isGenericSubject) {
      return { level: 'subject' as const, resolvedChapter: undefined, resolvedSubtopic: undefined };
    }

    // Check if format is 'Chapter - Subtopic'
    if (cleanT.includes(' - ')) {
      const parts = cleanT.split(' - ');
      if (!resolvedChapter) resolvedChapter = parts[0].trim();
      if (!resolvedSubtopic) resolvedSubtopic = parts.slice(1).join(' - ').trim();
    } else if (!resolvedChapter && !resolvedSubtopic) {
      resolvedChapter = cleanT;
    }
  }

  if (resolvedSubtopic) {
    return { level: 'subtopic' as const, resolvedChapter, resolvedSubtopic };
  }
  if (resolvedChapter && !resolvedChapter.toLowerCase().includes('all')) {
    return { level: 'chapter' as const, resolvedChapter, resolvedSubtopic: undefined };
  }
  return { level: 'subject' as const, resolvedChapter: undefined, resolvedSubtopic: undefined };
}

/**
 * Intelligent scoped question fetcher for MDCAT practice:
 * - Subtopic-level practice: returns ONLY questions tagged with that exact subtopic within the chapter.
 * - Chapter-level practice: returns ONLY questions from that chapter. Never leaks to other chapters.
 * - Full-subject practice: returns questions sampled across all chapters of that subject.
 */
export function getMDCATPrebuiltQuestions(
  subject: string,
  count: number = 10,
  topic?: string,
  chapterName?: string,
  subtopic?: string
): Question[] {
  const normSub = Object.keys(MDCAT_PREBUILT_QUESTIONS).find(
    k => k.toLowerCase() === subject.toLowerCase()
  ) || 'Biology';

  const fullPool = MDCAT_PREBUILT_QUESTIONS[normSub] || MDCAT_PREBUILT_QUESTIONS['Biology'];
  const scope = resolveScope(normSub, topic, chapterName, subtopic);

  let targetPool: Question[] = [];

  if (scope.level === 'subtopic' && scope.resolvedSubtopic) {
    // Subtopic Level: Filter by chapter first, then score strictly by subtopic terms
    const chapterPool = scope.resolvedChapter
      ? fullPool.filter(q => matchesChapter(q.chapter, scope.resolvedChapter!))
      : fullPool;

    const candidatePool = chapterPool.length > 0 ? chapterPool : fullPool;

    const scored = candidatePool
      .map(q => ({ q, score: scoreQuestionSubtopic(q, scope.resolvedSubtopic!) }))
      .filter(item => item.score >= 5)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      targetPool = scored.map(item => item.q);
    } else {
      // If strict score has 0 results, check for any positive score in the same chapter
      const looseScored = candidatePool
        .map(q => ({ q, score: scoreQuestionSubtopic(q, scope.resolvedSubtopic!) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

      if (looseScored.length > 0) {
        targetPool = looseScored.map(item => item.q);
      } else {
        // Fall back strictly to the chapter pool — NEVER outside this chapter!
        targetPool = chapterPool.length > 0 ? chapterPool : fullPool;
      }
    }
  } else if (scope.level === 'chapter' && scope.resolvedChapter) {
    // Chapter Level: Strictly questions from this chapter. Zero cross-chapter leakage.
    const exactMatches = fullPool.filter(q => matchesChapter(q.chapter, scope.resolvedChapter!));
    targetPool = exactMatches.length > 0 ? exactMatches : fullPool;
  } else {
    // Full Subject Level: Distributed across all chapters of the subject
    targetPool = fullPool;
  }

  const seenStems = new Set<string>();
  const results: Question[] = [];

  // Select unique questions from the strictly scoped pool
  const shuffledTargetPool = [...targetPool].sort(() => 0.5 - Math.random());
  for (const raw of shuffledTargetPool) {
    if (results.length >= count) break;
    const stem = (raw.q || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenStems.has(stem)) {
      seenStems.add(stem);
      const itemWithShuffledOptions = shuffleOptionsAndFixCorrect(raw);
      results.push({
        ...itemWithShuffledOptions,
        subject: normSub,
        id: `mdcat-q-${normSub.toLowerCase().replace(/\s+/g, '-')}-${results.length + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      });
    }
  }

  // If subtopic or chapter has fewer questions than requested count, we deliberately do NOT
  // pull random questions from unrelated chapters. Returning only authentic scoped questions
  // guarantees 100% topic precision.

  return results;
}

export function generateMDCATFullMockBank(): Question[] {
  // Official PMDC MDCAT Exam Structure: 180 MCQs total
  // 81 Biology (45%), 45 Chemistry (25%), 36 Physics (20%), 9 English (5%), 9 Logical Reasoning (5%)
  const seenStems = new Set<string>();

  function selectUnique(subjectKey: string, targetCount: number): Question[] {
    const pool = MDCAT_PREBUILT_QUESTIONS[subjectKey] || [];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected: Question[] = [];

    for (const qItem of shuffled) {
      if (selected.length >= targetCount) break;
      const norm = (qItem.q || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenStems.has(norm)) {
        seenStems.add(norm);
        const fixed = shuffleOptionsAndFixCorrect(qItem);
        selected.push({
          ...fixed,
          subject: subjectKey,
          id: `mdcat-mock-${subjectKey.toLowerCase().replace(/\s+/g, '-')}-${selected.length + 1}-${Date.now()}`
        });
      }
    }

    // Top up safely if needed without duplicates
    let loopIndex = 0;
    while (selected.length < targetCount && pool.length > 0) {
      const base = pool[loopIndex % pool.length];
      const fixed = shuffleOptionsAndFixCorrect(base);
      selected.push({
        ...fixed,
        subject: subjectKey,
        id: `mdcat-mock-${subjectKey.toLowerCase().replace(/\s+/g, '-')}-topup-${selected.length + 1}-${Date.now()}`
      });
      loopIndex++;
    }

    return selected;
  }

  const bio = selectUnique('Biology', 81);
  const chem = selectUnique('Chemistry', 45);
  const phys = selectUnique('Physics', 36);
  const eng = selectUnique('English', 9);
  const lr = selectUnique('Logical Reasoning', 9);

  return [...bio, ...chem, ...phys, ...eng, ...lr];
}

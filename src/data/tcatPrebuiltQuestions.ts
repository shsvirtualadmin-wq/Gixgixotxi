import { Question } from '../types';
import { TCAT_MATH_QUESTIONS } from './tcatMathQuestions';
import { TCAT_PHYSICS_QUESTIONS } from './tcatPhysicsQuestions';
import { TCAT_CHEMISTRY_QUESTIONS } from './tcatChemistryQuestions';
import { TCAT_CS_QUESTIONS } from './tcatCsQuestions';
import { TCAT_BIOLOGY_QUESTIONS } from './tcatBiologyQuestions';
import { TCAT_STATISTICS_QUESTIONS } from './tcatStatisticsQuestions';
import { TCAT_ENGLISH_QUESTIONS } from './tcatEnglishQuestions';
import { TCAT_GROUPS } from './tcatSyllabus';

export { TCAT_MATH_QUESTIONS } from './tcatMathQuestions';
export { TCAT_PHYSICS_QUESTIONS } from './tcatPhysicsQuestions';
export { TCAT_CHEMISTRY_QUESTIONS } from './tcatChemistryQuestions';
export { TCAT_CS_QUESTIONS } from './tcatCsQuestions';
export { TCAT_BIOLOGY_QUESTIONS } from './tcatBiologyQuestions';
export { TCAT_STATISTICS_QUESTIONS } from './tcatStatisticsQuestions';
export { TCAT_ENGLISH_QUESTIONS } from './tcatEnglishQuestions';

/**
 * Shuffles options using Fisher-Yates and updates the correct index accordingly.
 */
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

export const TCAT_PREBUILT_QUESTIONS: Record<string, Question[]> = {
  Mathematics: TCAT_MATH_QUESTIONS,
  Physics: TCAT_PHYSICS_QUESTIONS,
  Chemistry: TCAT_CHEMISTRY_QUESTIONS,
  'Computer Science': TCAT_CS_QUESTIONS,
  Biology: TCAT_BIOLOGY_QUESTIONS,
  Statistics: TCAT_STATISTICS_QUESTIONS,
  English: TCAT_ENGLISH_QUESTIONS,
  // Alias mappings
  Math: TCAT_MATH_QUESTIONS,
  math: TCAT_MATH_QUESTIONS,
  mathematics: TCAT_MATH_QUESTIONS,
  physics: TCAT_PHYSICS_QUESTIONS,
  chemistry: TCAT_CHEMISTRY_QUESTIONS,
  english: TCAT_ENGLISH_QUESTIONS,
  cs: TCAT_CS_QUESTIONS,
  'computer science': TCAT_CS_QUESTIONS,
  computerscience: TCAT_CS_QUESTIONS,
  ComputerScience: TCAT_CS_QUESTIONS,
  CS: TCAT_CS_QUESTIONS,
  biology: TCAT_BIOLOGY_QUESTIONS,
  bio: TCAT_BIOLOGY_QUESTIONS,
  Bio: TCAT_BIOLOGY_QUESTIONS,
  statistics: TCAT_STATISTICS_QUESTIONS,
  stats: TCAT_STATISTICS_QUESTIONS,
  Stats: TCAT_STATISTICS_QUESTIONS,
};

export const ALL_TCAT_QUESTIONS: Question[] = [
  ...TCAT_MATH_QUESTIONS,
  ...TCAT_PHYSICS_QUESTIONS,
  ...TCAT_CHEMISTRY_QUESTIONS,
  ...TCAT_CS_QUESTIONS,
  ...TCAT_BIOLOGY_QUESTIONS,
  ...TCAT_STATISTICS_QUESTIONS,
  ...TCAT_ENGLISH_QUESTIONS,
];

/**
 * Returns prebuilt questions for a specific TCAT subject and optional chapter topic.
 */
export function getTCATPrebuiltQuestions(subject: string, count: number = 10, topic?: string): Question[] {
  const normSub = Object.keys(TCAT_PREBUILT_QUESTIONS).find(
    (k) => k.toLowerCase() === subject.toLowerCase()
  ) || 'Mathematics';

  let pool = TCAT_PREBUILT_QUESTIONS[normSub] || TCAT_PREBUILT_QUESTIONS['Mathematics'];

  if (topic && topic.trim().length > 0) {
    const cleanTopic = topic.toLowerCase().trim();
    const isGeneric = cleanTopic.includes('syllabus') || cleanTopic.includes('all topic') || cleanTopic.includes('all chapter') || cleanTopic.includes('full mock');
    if (!isGeneric) {
      const topicMatches = pool.filter(q => {
        const qTopic = (q.topic || '').toLowerCase();
        return qTopic.includes(cleanTopic) || cleanTopic.includes(qTopic);
      });
      if (topicMatches.length > 0) {
        pool = topicMatches;
      }
    }
  }

  const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
  const results: Question[] = [];

  for (let i = 0; i < count; i++) {
    const raw = shuffledPool[i % shuffledPool.length];
    const itemWithShuffledOptions = shuffleOptionsAndFixCorrect(raw);
    results.push({
      ...itemWithShuffledOptions,
      subject: normSub,
      id: `tcat-q-${normSub.toLowerCase().replace(/\s+/g, '-')}-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    });
  }

  return results;
}

/**
 * Generates a full-length 100-MCQ TCAT Mock Exam.
 * Allocation strictly matches official UET Taxila TCAT specifications for each track:
 * - Pre-Engineering: Mathematics (30), Physics (30), Chemistry (30), English (10)
 * - Pre-Medical: Biology (30), Physics (30), Chemistry (30), English (10)
 * - ICS Physics: Mathematics (30), Physics (30), Computer Science (30), English (10)
 * - ICS Statistics: Mathematics (30), Statistics (30), Computer Science (30), English (10)
 * - Statistics & Physics: Mathematics (30), Statistics (30), Physics (30), English (10)
 * Total: exactly 100 MCQs, zero duplicate questions within the test.
 */
export function generateTCATFullMockBank(groupSubjects?: string[] | string): Question[] {
  let sub1 = 'Mathematics';
  let sub2 = 'Physics';
  let sub3 = 'Chemistry';
  const sub4 = 'English';

  if (Array.isArray(groupSubjects) && groupSubjects.length > 0) {
    sub1 = groupSubjects[0] || 'Mathematics';
    sub2 = groupSubjects[1] || 'Physics';
    sub3 = groupSubjects[2] || 'Chemistry';
  } else if (typeof groupSubjects === 'string' && groupSubjects.trim()) {
    const rawGroup = groupSubjects.trim().toLowerCase();
    const matchedGroup = TCAT_GROUPS.find(
      (g) => g.id.toLowerCase() === rawGroup || g.title.toLowerCase().includes(rawGroup)
    );
    if (matchedGroup && matchedGroup.subjects && matchedGroup.subjects.length >= 3) {
      sub1 = matchedGroup.subjects[0];
      sub2 = matchedGroup.subjects[1];
      sub3 = matchedGroup.subjects[2];
    }
  }

  const seenStems = new Set<string>();

  function selectProportional(subjectKey: string, targetCount: number): Question[] {
    const pool = TCAT_PREBUILT_QUESTIONS[subjectKey] || TCAT_PREBUILT_QUESTIONS['Mathematics'] || [];
    if (pool.length === 0) return [];

    // Group questions by chapter topic for even representation
    const chapterMap = new Map<string, Question[]>();
    for (const q of pool) {
      const ch = q.topic || 'General';
      if (!chapterMap.has(ch)) {
        chapterMap.set(ch, []);
      }
      chapterMap.get(ch)!.push(q);
    }

    // Shuffle within each chapter
    for (const [, list] of chapterMap) {
      list.sort(() => 0.5 - Math.random());
    }

    const chapters = Array.from(chapterMap.keys()).sort(() => 0.5 - Math.random());
    const selected: Question[] = [];

    // Round-robin selection across chapters to guarantee all chapters are represented
    let chIdx = 0;
    let attempts = 0;
    const maxAttempts = pool.length * 3;

    while (selected.length < targetCount && attempts < maxAttempts) {
      attempts++;
      const currentChapter = chapters[chIdx % chapters.length];
      const chQuestions = chapterMap.get(currentChapter) || [];

      for (let i = 0; i < chQuestions.length; i++) {
        const candidate = chQuestions[i];
        const norm = candidate.q.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!seenStems.has(norm)) {
          seenStems.add(norm);
          chQuestions.splice(i, 1); // remove so it's not picked again
          const fixed = shuffleOptionsAndFixCorrect(candidate);
          selected.push({
            ...fixed,
            subject: subjectKey,
            id: `tcat-mock-${subjectKey.toLowerCase().replace(/\s+/g, '-')}-${selected.length + 1}-${Date.now()}`
          });
          break;
        }
      }
      chIdx++;
    }

    // Fallback top-up if needed
    let loopIndex = 0;
    while (selected.length < targetCount && pool.length > 0) {
      const base = pool[loopIndex % pool.length];
      const fixed = shuffleOptionsAndFixCorrect(base);
      selected.push({
        ...fixed,
        subject: subjectKey,
        id: `tcat-mock-${subjectKey.toLowerCase().replace(/\s+/g, '-')}-fill-${selected.length + 1}-${Date.now()}`
      });
      loopIndex++;
    }

    return selected;
  }

  const q1 = selectProportional(sub1, 30);
  const q2 = selectProportional(sub2, 30);
  const q3 = selectProportional(sub3, 30);
  const q4 = selectProportional(sub4, 10);

  return [...q1, ...q2, ...q3, ...q4];
}

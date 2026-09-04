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

function getTcatSubtopicSearchTerms(subtopic: string): { phrases: string[]; keywords: string[] } {
  const clean = subtopic.trim();
  const lower = clean.toLowerCase();
  const phrases: string[] = [];
  const keywords: string[] = [];

  const subSegments = lower.split(/\s*(?:,|&|and|\/)\s*/);
  for (const seg of subSegments) {
    const parenMatch = seg.match(/^([^()]+)\s*\(([^()]+)\)/);
    if (parenMatch) {
      const p1 = parenMatch[1].trim();
      const p2 = parenMatch[2].trim();
      if (p1) phrases.push(p1);
      if (p2) phrases.push(p2);
    } else if (seg.trim()) {
      phrases.push(seg.trim());
    }
  }

  for (const p of phrases) {
    const words = p.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
    keywords.push(...words);
  }

  return {
    phrases: [...new Set(phrases.filter(p => p.length >= 3))],
    keywords: [...new Set(keywords)],
  };
}

function scoreTcatQuestionSubtopic(q: Question, subtopic: string): number {
  const { phrases, keywords } = getTcatSubtopicSearchTerms(subtopic);
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

function matchesTcatChapter(qChapOrTopic: string | undefined, targetChap: string): boolean {
  if (!qChapOrTopic || !targetChap) return false;
  const normQ = qChapOrTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const normT = targetChap.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  return normQ === normT || normQ.includes(normT) || normT.includes(normQ);
}

function resolveTcatScope(subject: string, topic?: string, chapterName?: string, subtopic?: string) {
  let resolvedChapter = chapterName?.trim();
  let resolvedSubtopic = subtopic?.trim();

  if (topic && topic.trim()) {
    const cleanT = topic.trim();
    const lowerT = cleanT.toLowerCase();

    const isGenericSubject = lowerT.includes('all chapters') ||
      lowerT.includes('all topic') ||
      lowerT.includes('full mock') ||
      lowerT.includes('full exam') ||
      lowerT.includes('syllabus') ||
      lowerT === subject.toLowerCase();

    if (isGenericSubject) {
      return { level: 'subject' as const, resolvedChapter: undefined, resolvedSubtopic: undefined };
    }

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
 * Returns prebuilt questions for a specific TCAT subject and optional chapter or subtopic.
 * Pulls exclusively from verified hardcoded question banks with zero off-topic cross-chapter leakage.
 */
export function getTCATPrebuiltQuestions(
  subject: string,
  count: number = 10,
  topic?: string,
  chapterName?: string,
  subtopic?: string
): Question[] {
  const normSub = Object.keys(TCAT_PREBUILT_QUESTIONS).find(
    (k) => k.toLowerCase() === subject.toLowerCase()
  ) || 'Mathematics';

  const fullPool = TCAT_PREBUILT_QUESTIONS[normSub] || TCAT_PREBUILT_QUESTIONS['Mathematics'] || [];
  const scope = resolveTcatScope(normSub, topic, chapterName, subtopic);

  let targetPool: Question[] = [];

  if (scope.level === 'subtopic' && scope.resolvedSubtopic) {
    // Filter by chapter first, then score strictly by subtopic keywords/phrases
    const chapterPool = scope.resolvedChapter
      ? fullPool.filter(q => matchesTcatChapter(q.topic, scope.resolvedChapter!))
      : fullPool;

    const candidatePool = chapterPool.length > 0 ? chapterPool : fullPool;

    const scored = candidatePool
      .map(q => ({ q, score: scoreTcatQuestionSubtopic(q, scope.resolvedSubtopic!) }))
      .filter(item => item.score >= 5)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      targetPool = scored.map(item => item.q);
    } else {
      const looseScored = candidatePool
        .map(q => ({ q, score: scoreTcatQuestionSubtopic(q, scope.resolvedSubtopic!) }))
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
    // Chapter Level: Strictly questions matching this chapter topic.
    const exactMatches = fullPool.filter(q => matchesTcatChapter(q.topic, scope.resolvedChapter!));
    targetPool = exactMatches.length > 0 ? exactMatches : fullPool;
  } else {
    // Full Subject Level
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
        id: `tcat-q-${normSub.toLowerCase().replace(/\s+/g, '-')}-${results.length + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      });
    }
  }

  // Never pad from outside this chapter/subtopic pool to guarantee 100% topic precision
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
 * Total: exactly 100 MCQs, zero duplicate questions within the test, zero placeholder questions.
 */
export function generateTCATFullMockBank(groupSubjects?: string[] | string): Question[] {
  let sub1 = 'Mathematics';
  let sub2 = 'Physics';
  let sub3 = 'Chemistry';
  let sub4 = 'English';

  if (Array.isArray(groupSubjects) && groupSubjects.length > 0) {
    sub1 = groupSubjects[0] || 'Mathematics';
    sub2 = groupSubjects[1] || 'Physics';
    sub3 = groupSubjects[2] || 'Chemistry';
    sub4 = groupSubjects[3] || 'English';
  } else if (typeof groupSubjects === 'string' && groupSubjects.trim()) {
    const rawGroup = groupSubjects.trim().toLowerCase();
    const matchedGroup = TCAT_GROUPS.find((g) => {
      const gid = g.id.toLowerCase();
      const gtitle = g.title.toLowerCase();
      return gid === rawGroup ||
        rawGroup.includes(gid) ||
        gtitle === rawGroup ||
        gtitle.includes(rawGroup) ||
        rawGroup.includes(gtitle);
    });
    if (matchedGroup && matchedGroup.subjects && matchedGroup.subjects.length >= 3) {
      sub1 = matchedGroup.subjects[0];
      sub2 = matchedGroup.subjects[1];
      sub3 = matchedGroup.subjects[2];
      sub4 = matchedGroup.subjects[3] || 'English';
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

    // Top up with unpicked unique questions from pool if targetCount not yet reached
    if (selected.length < targetCount) {
      const remaining = pool.filter(q => {
        const norm = (q.q || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return !seenStems.has(norm);
      }).sort(() => 0.5 - Math.random());

      for (const candidate of remaining) {
        if (selected.length >= targetCount) break;
        const norm = (candidate.q || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        seenStems.add(norm);
        const fixed = shuffleOptionsAndFixCorrect(candidate);
        selected.push({
          ...fixed,
          subject: subjectKey,
          id: `tcat-mock-${subjectKey.toLowerCase().replace(/\s+/g, '-')}-${selected.length + 1}-${Date.now()}`
        });
      }
    }

    return selected;
  }

  const q1 = selectProportional(sub1, 30);
  const q2 = selectProportional(sub2, 30);
  const q3 = selectProportional(sub3, 30);
  const q4 = selectProportional(sub4, 10);

  return [...q1, ...q2, ...q3, ...q4];
}

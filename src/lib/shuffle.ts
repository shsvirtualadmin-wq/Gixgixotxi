import { Question } from '../types';

/**
 * Shuffles the options of an MCQ question while ensuring the `correct` index
 * is updated to point to the new position of the correct answer string.
 */
export function shuffleQuestionOptions<T extends { options: string[]; correct: number }>(q: T): T {
  if (!q || !Array.isArray(q.options) || q.options.length < 2) return q;

  const originalCorrectIdx = typeof q.correct === 'number' && q.correct >= 0 && q.correct < q.options.length ? q.correct : 0;
  const correctText = q.options[originalCorrectIdx];
  if (correctText === undefined) return q;

  // Create a copy of options array
  const shuffledOptions = [...q.options];

  // Fisher-Yates shuffle
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }

  // Find index of the correct answer in the newly shuffled array
  const newCorrectIndex = shuffledOptions.indexOf(correctText);

  return {
    ...q,
    options: shuffledOptions,
    correct: newCorrectIndex >= 0 ? newCorrectIndex : originalCorrectIdx,
  };
}

/**
 * Normalizes question text (stem) for strict duplicate detection.
 * Handles English, symbols, numbers, and non-ASCII (Urdu/Arabic) scripts.
 */
export function normalizeQuestionStem(text: string): string {
  if (!text) return '';
  const trimmed = text.toLowerCase().trim();
  const alphanumeric = trimmed.replace(/[^a-z0-9]/g, '');
  if (alphanumeric.length >= 5) {
    return alphanumeric;
  }
  // For Urdu/Arabic or short text, collapse whitespace and strip standard trailing punctuation
  return trimmed
    .replace(/\s+/g, ' ')
    .replace(/[?.!;:,\s؟۔\-_=+\/\\|'"*&^%$#@!~`]+/g, ' ')
    .trim();
}

/**
 * Checks if two questions are duplicates by comparing their stems and IDs.
 */
export function isDuplicateQuestion(q1: { q?: string; id?: string }, q2: { q?: string; id?: string }): boolean {
  if (!q1 || !q2) return false;
  if (q1.id && q2.id && q1.id === q2.id) return true;
  const stem1 = normalizeQuestionStem(q1.q || '');
  const stem2 = normalizeQuestionStem(q2.q || '');
  return stem1 !== '' && stem1 === stem2;
}

/**
 * Deduplicates an array of questions without replacement, strictly ensuring no repeated questions.
 */
export function deduplicateQuestions<T extends { q?: string; id?: string } = Question>(questions: T[]): T[] {
  if (!Array.isArray(questions)) return [];
  const seenStems = new Set<string>();
  const seenIds = new Set<string>();
  const result: T[] = [];

  for (const q of questions) {
    if (!q || !q.q) continue;
    const stem = normalizeQuestionStem(q.q);
    const id = q.id || '';

    if (id && seenIds.has(id)) continue;
    if (stem && seenStems.has(stem)) continue;

    if (id) seenIds.add(id);
    if (stem) seenStems.add(stem);
    result.push(q);
  }

  return result;
}

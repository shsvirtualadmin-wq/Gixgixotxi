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

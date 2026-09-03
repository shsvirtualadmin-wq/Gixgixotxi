import * as fs from 'fs';
import * as path from 'path';
import { Question } from '../src/types';
import { TCAT_MATH_QUESTIONS } from '../src/data/tcatMathQuestions';
import { TCAT_PHYSICS_QUESTIONS } from '../src/data/tcatPhysicsQuestions';
import { TCAT_CHEMISTRY_QUESTIONS } from '../src/data/tcatChemistryQuestions';
import { TCAT_CS_QUESTIONS } from '../src/data/tcatCsQuestions';
import { TCAT_BIOLOGY_QUESTIONS } from '../src/data/tcatBiologyQuestions';
import { TCAT_STATISTICS_QUESTIONS } from '../src/data/tcatStatisticsQuestions';
import { TCAT_ENGLISH_QUESTIONS } from '../src/data/tcatEnglishQuestions';

import { NEW_ENGLISH_QUESTIONS } from './newEnglishQuestions';
import { NEW_CS_QUESTIONS } from './newCsQuestions';
import { NEW_STATS_QUESTIONS } from './newStatsQuestions';
import { NEW_BIO_QUESTIONS } from './newBioQuestions';

console.log('=== Step 1: Loading existing 1500 questions ===');
const existingQuestions = [
  ...TCAT_MATH_QUESTIONS,
  ...TCAT_PHYSICS_QUESTIONS,
  ...TCAT_CHEMISTRY_QUESTIONS,
  ...TCAT_CS_QUESTIONS,
  ...TCAT_BIOLOGY_QUESTIONS,
  ...TCAT_STATISTICS_QUESTIONS,
  ...TCAT_ENGLISH_QUESTIONS,
];

console.log('Existing total count:', existingQuestions.length);
if (existingQuestions.length !== 1500) {
  throw new Error(`Expected 1500 existing questions, found ${existingQuestions.length}`);
}

const existingIds = new Set<string>();
const existingStems = new Set<string>();

function normalizeStem(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

for (const q of existingQuestions) {
  if (existingIds.has(q.id)) {
    throw new Error(`Duplicate existing ID: ${q.id}`);
  }
  existingIds.add(q.id);
  const norm = normalizeStem(q.q);
  existingStems.add(norm);
}

console.log('=== Step 2: Validating 300 new questions ===');
const newQuestions = [
  ...NEW_ENGLISH_QUESTIONS,
  ...NEW_CS_QUESTIONS,
  ...NEW_STATS_QUESTIONS,
  ...NEW_BIO_QUESTIONS,
];

console.log('New questions count:', newQuestions.length);
if (newQuestions.length !== 300) {
  throw new Error(`Expected 300 new questions, received ${newQuestions.length}`);
}

const newIds = new Set<string>();
const newStems = new Set<string>();
const diffCounts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
const subjectCounts: Record<string, number> = {};

for (const q of newQuestions) {
  // Check ID uniqueness
  if (existingIds.has(q.id)) {
    throw new Error(`New question ID ${q.id} already exists in existing bank!`);
  }
  if (newIds.has(q.id)) {
    throw new Error(`Duplicate ID in new batch: ${q.id}`);
  }
  newIds.add(q.id);

  // Check stem uniqueness
  const norm = normalizeStem(q.q);
  if (existingStems.has(norm)) {
    throw new Error(`Overlap detected with existing question stem: "${q.q}"`);
  }
  if (newStems.has(norm)) {
    throw new Error(`Duplicate question within new batch: "${q.q}"`);
  }
  newStems.add(norm);

  // Check options
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error(`Question ${q.id} does not have exactly 4 options!`);
  }
  for (let i = 0; i < 4; i++) {
    if (!q.options[i] || q.options[i].trim().length === 0) {
      throw new Error(`Question ${q.id} has empty option ${i}`);
    }
  }
  // Check option distinctness
  const optSet = new Set(q.options.map(o => o.trim().toLowerCase()));
  if (optSet.size !== 4) {
    throw new Error(`Question ${q.id} has duplicate options!`);
  }

  // Check correct index
  if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
    throw new Error(`Question ${q.id} has invalid correct index: ${q.correct}`);
  }

  // Check explanation
  if (!q.explain || q.explain.trim().length < 15) {
    throw new Error(`Question ${q.id} has insufficient explanation!`);
  }

  // Check difficulty
  if (!['Easy', 'Medium', 'Hard'].includes(q.difficulty)) {
    throw new Error(`Question ${q.id} has invalid difficulty: ${q.difficulty}`);
  }
  diffCounts[q.difficulty]++;

  // Subject tally
  subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
}

console.log('New question difficulties:', diffCounts);
if (diffCounts.Easy !== 100 || diffCounts.Medium !== 100 || diffCounts.Hard !== 100) {
  throw new Error(`Difficulties not balanced to 100/100/100: ${JSON.stringify(diffCounts)}`);
}

console.log('New question subject counts:', subjectCounts);

// Helper function to append to an existing question file
function appendQuestionsToFile(filePath: string, questionsToAppend: Question[]) {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');

  // Find the closing bracket `];`
  const lastBracketIndex = content.lastIndexOf('];');
  if (lastBracketIndex === -1) {
    throw new Error(`Could not find closing bracket in ${filePath}`);
  }

  const questionsFormatted = questionsToAppend.map(q => {
    return `  {\n    id: ${JSON.stringify(q.id)},\n    subject: ${JSON.stringify(q.subject)},\n    topic: ${JSON.stringify(q.topic)},\n    difficulty: ${JSON.stringify(q.difficulty)},\n    q: ${JSON.stringify(q.q)},\n    options: ${JSON.stringify(q.options, null, 6).replace(/\n/g, '\n    ')},\n    correct: ${q.correct},\n    explain: ${JSON.stringify(q.explain)}\n  }`;
  }).join(',\n');

  // Check if previous character before `];` is a comma or bracket
  const beforeBracket = content.slice(0, lastBracketIndex).trimEnd();
  const separator = beforeBracket.endsWith(',') ? '\n' : ',\n';

  const newContent = beforeBracket + separator + questionsFormatted + '\n];\n';
  fs.writeFileSync(fullPath, newContent, 'utf-8');
  console.log(`Successfully appended ${questionsToAppend.length} questions to ${filePath}`);
}

console.log('=== Step 3: Appending questions to existing files ===');
appendQuestionsToFile('./src/data/tcatEnglishQuestions.ts', NEW_ENGLISH_QUESTIONS);
appendQuestionsToFile('./src/data/tcatCsQuestions.ts', NEW_CS_QUESTIONS);
appendQuestionsToFile('./src/data/tcatStatisticsQuestions.ts', NEW_STATS_QUESTIONS);
appendQuestionsToFile('./src/data/tcatBiologyQuestions.ts', NEW_BIO_QUESTIONS);

console.log('Validation and append complete!');

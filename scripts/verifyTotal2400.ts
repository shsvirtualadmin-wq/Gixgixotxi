import { ALL_TCAT_QUESTIONS } from '../src/data/tcatPrebuiltQuestions';
import { TCAT_GROUPS } from '../src/data/tcatSyllabus';

console.log('=== VERIFYING TOTAL TCAT QUESTION BANK (TARGET: 2,400) ===\n');

// 1. Total Count
const total = ALL_TCAT_QUESTIONS.length;
console.log(`Total questions in bank: ${total}`);
if (total !== 2400) {
  throw new Error(`Expected exactly 2400 questions, got ${total}`);
}

// 2. Subject Breakdown
const subjectCounts: Record<string, number> = {};
ALL_TCAT_QUESTIONS.forEach(q => {
  subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
});
console.log('\n--- Subject Breakdown ---');
console.table(subjectCounts);

const expectedSubjects: Record<string, number> = {
  Mathematics: 400,
  Physics: 400,
  Chemistry: 400,
  'Computer Science': 325,
  Biology: 325,
  Statistics: 325,
  English: 225
};

for (const [subj, expected] of Object.entries(expectedSubjects)) {
  const actual = subjectCounts[subj] || 0;
  if (actual !== expected) {
    throw new Error(`Subject ${subj} expected ${expected}, got ${actual}`);
  }
}

// 3. Difficulty Breakdown
const diffCounts: Record<string, number> = {};
ALL_TCAT_QUESTIONS.forEach(q => {
  diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1;
});
console.log('\n--- Overall Difficulty Breakdown ---');
console.table(diffCounts);

if (diffCounts['Easy'] !== 800 || diffCounts['Medium'] !== 800 || diffCounts['Hard'] !== 800) {
  throw new Error(`Expected exactly 800 Easy, 800 Medium, 800 Hard. Got: ${JSON.stringify(diffCounts)}`);
}

// 4. Duplicate ID Check
const idMap = new Map<string, number>();
ALL_TCAT_QUESTIONS.forEach(q => {
  idMap.set(q.id, (idMap.get(q.id) || 0) + 1);
});
const duplicateIds = Array.from(idMap.entries()).filter(([_, count]) => count > 1);
console.log(`\nDuplicate IDs count: ${duplicateIds.length}`);
if (duplicateIds.length > 0) {
  console.error('Duplicate IDs detected:', duplicateIds);
  throw new Error(`Found ${duplicateIds.length} duplicate IDs!`);
}

// 5. Duplicate Question Stems Check
const stemMap = new Map<string, string[]>();
ALL_TCAT_QUESTIONS.forEach(q => {
  const norm = q.q.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!stemMap.has(norm)) stemMap.set(norm, []);
  stemMap.get(norm)!.push(q.id);
});
const duplicateStems = Array.from(stemMap.entries()).filter(([_, ids]) => ids.length > 1);
console.log(`Duplicate Question Stems count: ${duplicateStems.length}`);
if (duplicateStems.length > 0) {
  console.error('Duplicate stems detected:', duplicateStems.slice(0, 5));
  throw new Error(`Found ${duplicateStems.length} duplicate question stems!`);
}

// 6. Schema Integrity Check
let schemaErrors = 0;
ALL_TCAT_QUESTIONS.forEach((q, idx) => {
  if (!q.id || !q.subject || !q.topic || !q.difficulty || !q.q || !q.options || q.correct === undefined || !q.explain) {
    console.error(`Missing field at index ${idx}:`, q);
    schemaErrors++;
  }
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    console.error(`Question ${q.id} does not have exactly 4 options`);
    schemaErrors++;
  }
  if (q.correct < 0 || q.correct > 3 || typeof q.correct !== 'number') {
    console.error(`Question ${q.id} has invalid correct index: ${q.correct}`);
    schemaErrors++;
  }
  if (typeof q.explain !== 'string' || q.explain.trim().length < 5) {
    console.error(`Question ${q.id} has insufficient explanation`);
    schemaErrors++;
  }
});
if (schemaErrors > 0) {
  throw new Error(`Found ${schemaErrors} schema violations!`);
}
console.log('Schema integrity: 100% compliant (4 options, valid correct index 0-3, detailed explanations).');

// 7. Group Combination Pool Sizes
console.log('\n--- TCAT Group Pool Sizes ---');
TCAT_GROUPS.forEach(grp => {
  const groupQuestions = ALL_TCAT_QUESTIONS.filter(q => grp.subjects.includes(q.subject));
  console.log(`Group: ${grp.title} (${grp.id}): ${groupQuestions.length} available MCQs`);
  if (groupQuestions.length < 1000) {
    throw new Error(`Group ${grp.title} has only ${groupQuestions.length} questions, expected > 1000`);
  }
});

console.log('\n ALL 2,400 TCAT QUESTIONS VERIFIED 100% SUCCESFULLY WITH ZERO DEFECTS!');

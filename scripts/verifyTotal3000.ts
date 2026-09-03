import { ALL_TCAT_QUESTIONS, generateTCATFullMockBank } from '../src/data/tcatPrebuiltQuestions';
import { TCAT_GROUPS } from '../src/data/tcatSyllabus';

console.log('=== VERIFYING TOTAL TCAT QUESTION BANK (TARGET: 3,000) ===\n');

// 1. Total Count
const total = ALL_TCAT_QUESTIONS.length;
console.log(`Total questions in bank: ${total}`);
if (total !== 3000) {
  throw new Error(`Expected exactly 3000 questions, got ${total}`);
}

// 2. Subject Breakdown
const subjectCounts: Record<string, number> = {};
ALL_TCAT_QUESTIONS.forEach(q => {
  subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
});
console.log('\n--- Subject Breakdown ---');
console.table(subjectCounts);

const expectedSubjects: Record<string, number> = {
  Mathematics: 430,
  Physics: 430,
  Chemistry: 430,
  'Computer Science': 430,
  Biology: 430,
  Statistics: 430,
  English: 420
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
console.log('\n--- Difficulty Breakdown ---');
console.table(diffCounts);

if (diffCounts['Easy'] !== 1000 || diffCounts['Medium'] !== 1000 || diffCounts['Hard'] !== 1000) {
  throw new Error(`Expected balanced 1000/1000/1000 distribution, got: ${JSON.stringify(diffCounts)}`);
}

// 4. Duplicate Check
console.log('\n--- Duplicate Check ---');
const ids = new Set<string>();
const stems = new Map<string, string>();
let duplicateStems = 0;

ALL_TCAT_QUESTIONS.forEach(q => {
  if (ids.has(q.id)) {
    throw new Error(`Duplicate ID found: ${q.id}`);
  }
  ids.add(q.id);

  const norm = q.q.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (stems.has(norm)) {
    console.error(`Duplicate Stem: "${q.q}" in ${q.id} (matches ${stems.get(norm)})`);
    duplicateStems++;
  } else {
    stems.set(norm, q.id);
  }

  // Question structure check
  if (!q.options || q.options.length !== 4) {
    throw new Error(`Question ${q.id} does not have exactly 4 options`);
  }
  if (q.correct < 0 || q.correct > 3) {
    throw new Error(`Question ${q.id} has invalid correct answer index: ${q.correct}`);
  }
  if (!q.explain || q.explain.length < 10) {
    throw new Error(`Question ${q.id} has inadequate explanation`);
  }
});

if (duplicateStems > 0) {
  throw new Error(`Found ${duplicateStems} duplicate stems in the question bank`);
}
console.log('✓ All 3,000 question IDs are unique');
console.log('✓ All 3,000 question stems are distinct');

// 5. Mock Generator Tests
console.log('\n--- Mock Generation Verification ---');
for (const group of TCAT_GROUPS) {
  const mock = generateTCATFullMockBank(group.id);
  console.log(`Group: ${group.title} (${group.id}) -> Generated ${mock.length} questions`);
  if (mock.length !== 100) {
    throw new Error(`Expected 100 questions for group ${group.id}, got ${mock.length}`);
  }
  
  // Verify no placeholders in mock
  for (const q of mock) {
    if (q.q.includes('Select the correct core principle regarding') || q.options.some(o => o.includes('Option A') && o.includes('principle'))) {
      throw new Error(`Mock question contains placeholder template: ${q.id}`);
    }
  }
}
console.log('✓ All mock tests generate exactly 100 questions from authentic bank without placeholders');

console.log('\n========================================');
console.log('✓ SUCCESS: TCAT QUESTION BANK HAS REACHED 3,000 VERIFIED MCQS!');
console.log('========================================\n');

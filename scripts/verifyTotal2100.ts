import { ALL_TCAT_QUESTIONS, generateTCATFullMockBank } from '../src/data/tcatPrebuiltQuestions';
import { TCAT_GROUPS } from '../src/data/tcatSyllabus';

console.log('=== TCAT QUESTION BANK VERIFICATION ===');
console.log('Total MCQs in bank:', ALL_TCAT_QUESTIONS.length);

const subjectCounts: Record<string, number> = {};
ALL_TCAT_QUESTIONS.forEach(q => {
  subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
});
console.log('\nSubject Breakdown:');
Object.entries(subjectCounts).forEach(([subj, count]) => {
  console.log(`  - ${subj}: ${count}`);
});

const difficultyCounts: Record<string, number> = {};
ALL_TCAT_QUESTIONS.forEach(q => {
  difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
});
console.log('\nDifficulty Breakdown:');
Object.entries(difficultyCounts).forEach(([diff, count]) => {
  console.log(`  - ${diff}: ${count}`);
});

const idSet = new Set<string>();
let dupIds = 0;
ALL_TCAT_QUESTIONS.forEach(q => {
  if (idSet.has(q.id)) dupIds++;
  idSet.add(q.id);
});

const stemSet = new Set<string>();
let dupStems = 0;
ALL_TCAT_QUESTIONS.forEach(q => {
  const norm = q.q.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (stemSet.has(norm)) dupStems++;
  stemSet.add(norm);
});

console.log('\nUniqueness:');
console.log(`  - Duplicate IDs: ${dupIds}`);
console.log(`  - Duplicate Stems: ${dupStems}`);

console.log('\nTCAT Groups Available Question Pool:');
TCAT_GROUPS.forEach(g => {
  const pool = ALL_TCAT_QUESTIONS.filter(q => g.subjects.includes(q.subject));
  const mock = generateTCATFullMockBank(g.id);
  console.log(`  - ${g.title} (${g.id}): ${pool.length} available pool questions | Mock Bank: ${mock.length} questions`);
});

import { ALL_TCAT_QUESTIONS, generateTCATFullMockBank } from '../src/data/tcatPrebuiltQuestions';
import { TCAT_GROUPS } from '../src/data/tcatSyllabus';

console.log('=====================================================');
console.log('=== TCAT QUESTION BANK 1800 COMPREHENSIVE AUDIT ===');
console.log('=====================================================\n');

// 1. Total Count
console.log(`1. Total Questions in Bank: ${ALL_TCAT_QUESTIONS.length}`);
if (ALL_TCAT_QUESTIONS.length !== 1800) {
  throw new Error(`CRITICAL: Expected 1800 questions, but got ${ALL_TCAT_QUESTIONS.length}`);
}

// 2. ID & Stem Uniqueness
const ids = new Set<string>();
const stems = new Set<string>();
const duplicates: string[] = [];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

for (const q of ALL_TCAT_QUESTIONS) {
  if (ids.has(q.id)) {
    duplicates.push(`Duplicate ID: ${q.id}`);
  }
  ids.add(q.id);

  const n = norm(q.q);
  if (stems.has(n)) {
    duplicates.push(`Duplicate question stem: "${q.q}" (ID: ${q.id})`);
  }
  stems.add(n);

  // Validate structural integrity
  if (!q.options || q.options.length !== 4) {
    throw new Error(`Invalid options length for ${q.id}`);
  }
  for (const opt of q.options) {
    if (!opt || opt.trim().length === 0) {
      throw new Error(`Empty option for ${q.id}`);
    }
  }
  const uniqueOpts = new Set(q.options.map(o => o.trim()));
  if (uniqueOpts.size !== 4) {
    throw new Error(`Duplicate options in ${q.id}: ${JSON.stringify(q.options)}`);
  }
  if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
    throw new Error(`Invalid correct index for ${q.id}`);
  }
  if (!q.explain || q.explain.trim().length < 10) {
    throw new Error(`Missing explanation for ${q.id}`);
  }
}

if (duplicates.length > 0) {
  console.error('Duplicates detected:', duplicates);
  throw new Error(`Found ${duplicates.length} duplicate questions or IDs!`);
}
console.log(`2. All ${ids.size} IDs and question stems are 100% unique! No duplicates or overlaps.\n`);

// 3. Subject Distribution
const subjectCounts: Record<string, number> = {};
const subjectDiffCounts: Record<string, Record<string, number>> = {};
const subjectTopicCounts: Record<string, Record<string, number>> = {};
const overallDiff: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };

for (const q of ALL_TCAT_QUESTIONS) {
  subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
  overallDiff[q.difficulty] = (overallDiff[q.difficulty] || 0) + 1;

  if (!subjectDiffCounts[q.subject]) {
    subjectDiffCounts[q.subject] = { Easy: 0, Medium: 0, Hard: 0 };
  }
  subjectDiffCounts[q.subject][q.difficulty]++;

  if (!subjectTopicCounts[q.subject]) {
    subjectTopicCounts[q.subject] = {};
  }
  subjectTopicCounts[q.subject][q.topic] = (subjectTopicCounts[q.subject][q.topic] || 0) + 1;
}

console.log('3. Subject Distribution:');
for (const [subj, count] of Object.entries(subjectCounts)) {
  const diff = subjectDiffCounts[subj];
  console.log(`   - ${subj.padEnd(18)}: ${count.toString().padStart(4)} questions (Easy: ${diff.Easy}, Med: ${diff.Medium}, Hard: ${diff.Hard})`);
}

console.log('\n4. Overall Difficulty Distribution:');
console.log(`   - Easy:   ${overallDiff.Easy} (${((overallDiff.Easy / 1800) * 100).toFixed(1)}%)`);
console.log(`   - Medium: ${overallDiff.Medium} (${((overallDiff.Medium / 1800) * 100).toFixed(1)}%)`);
console.log(`   - Hard:   ${overallDiff.Hard} (${((overallDiff.Hard / 1800) * 100).toFixed(1)}%)`);

if (overallDiff.Easy !== 600 || overallDiff.Medium !== 600 || overallDiff.Hard !== 600) {
  throw new Error(`Difficulties not exactly 600/600/600! Got ${JSON.stringify(overallDiff)}`);
}

// 5. Chapter / Topic Counts per Subject
console.log('\n5. Chapter / Topic Distribution across all subjects:');
for (const [subj, topics] of Object.entries(subjectTopicCounts)) {
  console.log(`   * ${subj} (${Object.keys(topics).length} chapters):`);
  for (const [topic, count] of Object.entries(topics)) {
    console.log(`       · ${topic.padEnd(35)}: ${count} questions`);
  }
}

// 6. Test Mock Test Generation for all 5 TCAT Tracks
console.log('\n6. Testing Full 100-Question Mock Generation across All 5 TCAT Groups:');
for (const group of TCAT_GROUPS) {
  const mock = generateTCATFullMockBank(group.id);
  if (mock.length !== 100) {
    throw new Error(`Group ${group.title} generated ${mock.length} questions instead of 100!`);
  }

  // Check uniqueness within mock
  const mockIds = new Set(mock.map(q => q.id));
  if (mockIds.size !== 100) {
    throw new Error(`Group ${group.title} mock has duplicate questions!`);
  }

  // Check section breakdown
  const mockSubjCounts: Record<string, number> = {};
  for (const q of mock) {
    mockSubjCounts[q.subject] = (mockSubjCounts[q.subject] || 0) + 1;
  }

  const breakdownStr = Object.entries(mockSubjCounts).map(([s, c]) => `${s}: ${c}`).join(', ');
  console.log(`   ✔ [${group.id}] ${group.title.padEnd(35)}: 100/100 MCQs (${breakdownStr})`);
}

console.log('\n=====================================================');
console.log('=== AUDIT PASSED: ALL 1800 MCQs VERIFIED SUCCESSFULLY ===');
console.log('=====================================================');

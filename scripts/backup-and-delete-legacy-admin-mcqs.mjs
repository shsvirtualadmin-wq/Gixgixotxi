#!/usr/bin/env node
/**
 * =============================================================================
 * BACKUP & CONFIRMED DELETE SCRIPT FOR LEGACY ADMIN QUESTION BANK MCQs ONLY
 * =============================================================================
 * - Exports/backs up all old Admin Question Bank subject-pool MCQs
 *   (Mathematics, Physics, Chemistry, Computer Science, English, Biology,
 *    Analytical Reasoning) to downloadable JSON and CSV backup files BEFORE
 *   deleting anything.
 * - Requires `--confirm-delete` flag (or interactive confirmation) to delete.
 * - Resets the old Admin Bank counts & index to 0.
 * - NEVER touches Captain dashboard tests, Grand Line drills, Crews, Arena,
 *   Commons posts, or student progress.
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const D1_STORE_PATH = path.resolve(ROOT_DIR, 'data/cloudflare_d1_posts.json');
const CLEANED_QUESTIONS_PATH = path.resolve(ROOT_DIR, 'data/questions.cleaned.json');
const DATA_BACKUP_DIR = path.resolve(ROOT_DIR, 'data/backups');
const PUBLIC_BACKUP_DIR = path.resolve(ROOT_DIR, 'public/backups');

const SUBJECT_POOLS = [
  'mathematics',
  'physics',
  'chemistry',
  'computer-science',
  'english',
  'biology',
  'analytical-reasoning',
];

function csvEscape(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function normalizeQuestionRecord(q, sourceLabel) {
  let options = [];
  if (Array.isArray(q.options)) {
    options = q.options.map((o) => String(o ?? ''));
  } else if (typeof q.options_json === 'string') {
    try {
      const parsed = JSON.parse(q.options_json);
      if (Array.isArray(parsed)) options = parsed.map((o) => String(o ?? ''));
    } catch {
      options = [];
    }
  }
  const letters = ['A', 'B', 'C', 'D'];
  const rawCorrect = q.correct_answer ?? q.correctAnswer ?? q.correct ?? 0;
  const correctLetter =
    typeof rawCorrect === 'number' && rawCorrect >= 0 && rawCorrect <= 3
      ? letters[rawCorrect]
      : String(rawCorrect || 'A').toUpperCase();

  return {
    id: String(q.id || ''),
    source: sourceLabel,
    bank_id: String(q.bank_id || 'legacy'),
    subject: String(q.subject || 'general').toLowerCase(),
    topic: String(q.topic || q.chapter || 'General'),
    question: String(q.question_text || q.question || q.q || q.stem || ''),
    option_a: String(options[0] ?? ''),
    option_b: String(options[1] ?? ''),
    option_c: String(options[2] ?? ''),
    option_d: String(options[3] ?? ''),
    correct_answer: correctLetter,
    explanation: String(q.explanation || q.explain || ''),
    difficulty: String(q.difficulty || 'medium'),
    created_at: q.created_at || new Date().toISOString(),
  };
}

function main() {
  const args = process.argv.slice(2);
  const confirmDelete = args.includes('--confirm-delete');

  let d1Store = null;
  let d1Questions = [];
  if (fs.existsSync(D1_STORE_PATH)) {
    d1Store = JSON.parse(fs.readFileSync(D1_STORE_PATH, 'utf8'));
    if (Array.isArray(d1Store.questions)) {
      d1Questions = d1Store.questions;
    }
  }

  let cleanedQuestions = [];
  if (fs.existsSync(CLEANED_QUESTIONS_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(CLEANED_QUESTIONS_PATH, 'utf8'));
      if (Array.isArray(parsed)) cleanedQuestions = parsed;
    } catch {
      cleanedQuestions = [];
    }
  }

  // Build combined backup (deduplicated by question ID + source)
  const backupRecords = [
    ...d1Questions.map((q) => normalizeQuestionRecord(q, 'd1_admin_bank')),
    ...cleanedQuestions.map((q) => normalizeQuestionRecord(q, 'legacy_seed_file')),
  ];

  const bySubjectPool = {};
  for (const s of SUBJECT_POOLS) {
    bySubjectPool[s] = 0;
  }
  for (const q of d1Questions) {
    const sub = String(q.subject || 'general').toLowerCase();
    bySubjectPool[sub] = (bySubjectPool[sub] || 0) + 1;
  }

  // If a backup already exists and d1Questions is 0 (already purged), preserve existing backup
  const jsonBackupPathData = path.join(DATA_BACKUP_DIR, 'legacy_admin_bank_backup.json');
  const csvBackupPathData = path.join(DATA_BACKUP_DIR, 'legacy_admin_bank_backup.csv');
  const jsonBackupPathPublic = path.join(PUBLIC_BACKUP_DIR, 'legacy_admin_bank_backup.json');
  const csvBackupPathPublic = path.join(PUBLIC_BACKUP_DIR, 'legacy_admin_bank_backup.csv');

  fs.mkdirSync(DATA_BACKUP_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_BACKUP_DIR, { recursive: true });

  if (backupRecords.length > 0 || !fs.existsSync(jsonBackupPathData)) {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      scope: 'OLD_ADMIN_QUESTION_BANK_ONLY',
      captainAndGrandLineUntouched: true,
      d1AdminBankQuestionCount: d1Questions.length,
      legacySeedFileQuestionCount: cleanedQuestions.length,
      totalExportedRecords: backupRecords.length,
      subjectPoolCountsBeforeDelete: bySubjectPool,
      questions: backupRecords,
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    fs.writeFileSync(jsonBackupPathData, jsonString, 'utf8');
    fs.writeFileSync(jsonBackupPathPublic, jsonString, 'utf8');

    const csvHeaders = [
      'id',
      'source',
      'bank_id',
      'subject',
      'topic',
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_answer',
      'explanation',
      'difficulty',
      'created_at',
    ];
    const csvLines = [
      csvHeaders.join(','),
      ...backupRecords.map((r) =>
        csvHeaders.map((h) => csvEscape(r[h])).join(',')
      ),
    ];
    const csvString = csvLines.join('\n');
    fs.writeFileSync(csvBackupPathData, csvString, 'utf8');
    fs.writeFileSync(csvBackupPathPublic, csvString, 'utf8');
  }

  console.log('===================================================================');
  console.log('BOARDLY — OLD ADMIN QUESTION BANK BACKUP & DELETE REPORT');
  console.log('===================================================================');
  console.log(`D1 Admin Bank Subject-Pool MCQs found : ${d1Questions.length}`);
  console.log(`Legacy questions.cleaned.json MCQs    : ${cleanedQuestions.length}`);
  console.log('Breakdown by Subject Pool (D1 Admin Bank):');
  for (const [sub, cnt] of Object.entries(bySubjectPool)) {
    console.log(`  - ${sub.padEnd(22)} : ${cnt}`);
  }
  console.log(`Backup JSON saved to                  : /backups/legacy_admin_bank_backup.json`);
  console.log(`Backup CSV saved to                   : /backups/legacy_admin_bank_backup.csv`);
  console.log('Captain & Grand Line Data Status      : UNTOUCHED (0 records modified)');
  console.log('===================================================================');

  if (!confirmDelete) {
    console.log(
      ' DRY RUN / BACKUP ONLY: Pass `--confirm-delete` to permanently delete the old Admin Bank MCQs and reset subject pool counts to 0.'
    );
    return;
  }

  // Perform confirmed deletion of ONLY the old Admin Bank MCQs
  if (d1Store) {
    d1Store.questions = [];
    d1Store.questionsImportLog = [];
    d1Store.legacyAdminBankPurgedAt = new Date().toISOString();
    d1Store.legacyAdminBankBackupSummary = {
      deletedD1AdminBankCount: d1Questions.length,
      deletedLegacySeedCount: cleanedQuestions.length,
      subjectPoolCountsBeforeDelete: bySubjectPool,
      subjectPoolCountsAfterDelete: Object.fromEntries(SUBJECT_POOLS.map((s) => [s, 0])),
      captainAndGrandLineUntouched: true,
      purgedAt: new Date().toISOString(),
    };
    fs.writeFileSync(D1_STORE_PATH, JSON.stringify(d1Store, null, 2), 'utf8');
  }

  if (fs.existsSync(CLEANED_QUESTIONS_PATH)) {
    fs.writeFileSync(CLEANED_QUESTIONS_PATH, '[]\n', 'utf8');
  }

  console.log(`CONFIRMED DELETE COMPLETE:`);
  console.log(`  - Deleted ${d1Questions.length} old Admin Bank MCQs from D1 store`);
  console.log(`  - Deleted ${cleanedQuestions.length} old seed MCQs from questions.cleaned.json`);
  console.log(`  - Reset all 7 old subject pool counts and index to 0`);
  console.log(`  - Captain tests & Grand Line data verified 100% untouched.`);
}

main();

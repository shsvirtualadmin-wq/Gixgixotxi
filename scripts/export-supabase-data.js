#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '../functions/_utils/supabaseStub.js';

// Load environment variables from .env or .env.local if present
dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EXPORTS_DIR = path.join(ROOT_DIR, 'exports');

// Parse CLI arguments (e.g., --url=..., --key=..., --tables=...)
const args = process.argv.slice(2);
function getCliArg(name) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith(`--${name}=`)) {
      return arg.split('=')[1]?.trim();
    }
    if (arg === `--${name}` || arg === `-${name[0]}`) {
      return args[i + 1]?.trim();
    }
  }
  return null;
}

// 1. Resolve Supabase Configuration
const supabaseUrl =
  getCliArg('url') ||
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://wbvzbbnapowwmrjecdyt.supabase.co';

const serviceRoleKey =
  getCliArg('key') ||
  getCliArg('service-role-key') ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY;

const customTablesArg = getCliArg('tables');

console.log('='.repeat(76));
console.log('📦 SUPABASE TO FIREBASE MIGRATION EXPORTER');
console.log('='.repeat(76));
console.log(`Target Supabase URL: ${supabaseUrl}`);
console.log(`Service Role Key:   ${serviceRoleKey ? 'Configured (length: ' + serviceRoleKey.length + ')' : 'MISSING'}`);
console.log(`Exports Directory:  ${EXPORTS_DIR}`);
console.log('='.repeat(76) + '\n');

if (!serviceRoleKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is required to export data.');
  console.error('You can provide it via environment variable or CLI arguments:\n');
  console.error('Option 1: Environment Variables (Terminal)');
  console.error('  export SUPABASE_URL="https://your-project.supabase.co"');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"');
  console.error('  node scripts/export-supabase-data.js\n');
  console.error('Option 2: CLI Arguments');
  console.error('  node scripts/export-supabase-data.js --url="https://your-project.supabase.co" --key="your-service-role-key"\n');
  console.error('Option 3: In .env file');
  console.error('  SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key\n');
  process.exit(1);
}

// Ensure exports directory exists
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

// Initialize Supabase Admin client with service role key (bypassing RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Comprehensive list of all application database tables:
// 1. All active Boardly platform tables discovered in codebase schema
// 2. All common educational / LMS tables (teachers, attendance, fees, etc.)
const DEFAULT_TABLES = [
  // Core user, profile & progress tables
  'students',
  'profiles',
  'student_progress',
  'student_achievements',
  'achievements',
  'avatars',

  // Testing & MCQ performance tables
  'test_results',
  'mcq_attempts',
  'student_attempted_mcqs',
  'student_mcq_usage',
  'mcq_usage',

  // Question bank & curriculum tables
  'mcqs',
  'mcq_bank',
  'shared_mcq_cache',
  'shared_custom_topics',

  // AI & Study Buddy history
  'study_buddy_history',
  'study_buddy_usage',
  'ai_history',

  // Financial, billing & promotion tables
  'payment_requests',
  'promo_codes',
  'promo_redemptions',

  // Administrative & Content resources
  'admin_activity_logs',
  'resources',

  // Additional educational LMS tables (if present in user project)
  'teachers',
  'attendance',
  'fees',
  'grades',
  'notes',
  'announcements',
  'schedules',
  'chat_messages',
  'classes',
  'courses',
  'subjects',
  'enrollments',
  'assignments',
  'submissions',
];

const APPLICATION_TABLES = customTablesArg
  ? customTablesArg.split(',').map((t) => t.trim()).filter(Boolean)
  : DEFAULT_TABLES;

const summaryStats = [];

/**
 * Helper: Sleep with backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 1. Export auth.users via Supabase Admin API
 */
async function exportAuthUsers() {
  console.log('👤 [1/2] Exporting Supabase Auth Users (auth.users)...');
  const targetFile = 'auth_users.json';
  const outPath = path.join(EXPORTS_DIR, targetFile);

  const PAGE_SIZE = 1000;
  let page = 1;
  const allUsers = [];

  try {
    while (true) {
      process.stdout.write(`   Fetching auth.users page ${page} (up to ${PAGE_SIZE} users)... `);
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: PAGE_SIZE,
      });

      if (error) {
        throw error;
      }

      const users = data?.users || [];
      process.stdout.write(`received ${users.length} users\n`);

      if (users.length === 0) {
        break;
      }

      for (const u of users) {
        allUsers.push({
          id: u.id,
          email: u.email || null,
          raw_user_meta_data: u.raw_user_meta_data ?? u.user_metadata ?? {},
          created_at: u.created_at,
          confirmed_at: u.confirmed_at ?? u.email_confirmed_at,
          last_sign_in_at: u.last_sign_in_at,
          phone: u.phone,
          role: u.role,
        });
      }

      if (users.length < PAGE_SIZE) {
        break;
      }
      page++;
    }

    fs.writeFileSync(outPath, JSON.stringify(allUsers, null, 2), 'utf-8');
    const fileSizeBytes = fs.statSync(outPath).size;

    summaryStats.push({
      table: 'auth.users',
      status: allUsers.length > 0 ? 'SUCCESS' : 'EMPTY',
      rowCount: allUsers.length,
      fileName: targetFile,
      filePath: outPath,
      fileSizeKb: Math.round((fileSizeBytes / 1024) * 10) / 10,
    });

    console.log(`   ✅ Successfully exported ${allUsers.length} auth user(s) to ${targetFile} (${(fileSizeBytes / 1024).toFixed(1)} KB)\n`);
  } catch (err) {
    console.error(`   ❌ Failed to export auth.users: ${err?.message || err}\n`);
    summaryStats.push({
      table: 'auth.users',
      status: 'ERROR',
      rowCount: 0,
      fileName: targetFile,
      filePath: outPath,
      fileSizeKb: 0,
      message: err?.message || String(err),
    });
  }
}

/**
 * 2. Export an application table with pagination
 */
async function exportTable(tableName) {
  const targetFile = `${tableName}.json`;
  const outPath = path.join(EXPORTS_DIR, targetFile);

  try {
    // Probe table existence and total count
    const probe = await supabase.from(tableName).select('*', { count: 'exact', head: true });

    if (probe.error) {
      const msg = probe.error.message || '';
      // Check if table does not exist in schema
      if (
        probe.error.code === '42P01' ||
        probe.error.code === 'PGRST204' ||
        probe.error.code === 'PGRST200' ||
        msg.includes('does not exist') ||
        msg.includes('relation') ||
        msg.includes('Could not find the table') ||
        msg.includes('not found')
      ) {
        summaryStats.push({
          table: tableName,
          status: 'NOT_FOUND',
          rowCount: 0,
          fileName: targetFile,
          filePath: outPath,
          fileSizeKb: 0,
          message: 'Table does not exist in database',
        });
        return;
      }

      // Other error (e.g. permissions or syntax)
      throw probe.error;
    }

    const totalCount = probe.count ?? 0;
    process.stdout.write(`   Exporting table "${tableName}" (Total rows: ${totalCount})... `);

    if (totalCount === 0) {
      fs.writeFileSync(outPath, JSON.stringify([], null, 2), 'utf-8');
      process.stdout.write(`0 rows (empty table)\n`);
      summaryStats.push({
        table: tableName,
        status: 'EMPTY',
        rowCount: 0,
        fileName: targetFile,
        filePath: outPath,
        fileSizeKb: 0.1,
      });
      return;
    }

    // Paginate through all rows (1000 per request)
    const PAGE_SIZE = 1000;
    let from = 0;
    const allRows = [];

    while (from < totalCount || totalCount === 0) {
      const to = from + PAGE_SIZE - 1;
      let attempts = 0;
      let batchData = null;

      while (attempts < 3) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .range(from, to);

          if (error) throw error;
          batchData = data || [];
          break;
        } catch (fetchErr) {
          attempts++;
          if (attempts >= 3) throw fetchErr;
          await sleep(500 * attempts);
        }
      }

      if (!batchData || batchData.length === 0) {
        break;
      }

      allRows.push(...batchData);
      from += PAGE_SIZE;

      if (batchData.length < PAGE_SIZE) {
        break;
      }
    }

    fs.writeFileSync(outPath, JSON.stringify(allRows, null, 2), 'utf-8');
    const fileSizeBytes = fs.statSync(outPath).size;

    process.stdout.write(`Done! (${allRows.length} rows, ${(fileSizeBytes / 1024).toFixed(1)} KB)\n`);

    summaryStats.push({
      table: tableName,
      status: 'SUCCESS',
      rowCount: allRows.length,
      fileName: targetFile,
      filePath: outPath,
      fileSizeKb: Math.round((fileSizeBytes / 1024) * 10) / 10,
    });
  } catch (err) {
    process.stdout.write(`FAILED: ${err?.message || err}\n`);
    summaryStats.push({
      table: tableName,
      status: 'ERROR',
      rowCount: 0,
      fileName: targetFile,
      filePath: outPath,
      fileSizeKb: 0,
      message: err?.message || String(err),
    });
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();

  // 1. Export Auth Users
  await exportAuthUsers();

  // 2. Export Application Tables
  console.log(`📋 [2/2] Exporting Application Tables (${APPLICATION_TABLES.length} potential tables checked)...`);
  for (const table of APPLICATION_TABLES) {
    await exportTable(table);
  }

  // 3. Print Final Verification Summary Table
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(84));
  console.log('📊 SUPABASE EXPORT SUMMARY & ROW COUNT VERIFICATION');
  console.log('='.repeat(84));

  console.log(
    'Table Name'.padEnd(28) +
    'Status'.padEnd(14) +
    'Exported Rows'.padStart(14) +
    'File Size'.padStart(14) +
    '   Output File'
  );
  console.log('-'.repeat(84));

  let totalRows = 0;
  let activeTablesCount = 0;

  for (const s of summaryStats) {
    if (s.status === 'SUCCESS' || s.status === 'EMPTY') {
      activeTablesCount++;
      totalRows += s.rowCount;
      const statusLabel = s.status === 'EMPTY' ? 'EMPTY (0)' : '✅ OK';
      console.log(
        s.table.padEnd(28) +
        statusLabel.padEnd(14) +
        s.rowCount.toLocaleString().padStart(14) +
        `${s.fileSizeKb} KB`.padStart(14) +
        `   ./exports/${s.fileName}`
      );
    } else if (s.status === 'ERROR') {
      console.log(
        s.table.padEnd(28) +
        '❌ ERROR'.padEnd(14) +
        '0'.padStart(14) +
        '-'.padStart(14) +
        `   [${s.message || 'Failed'}]`
      );
    }
  }

  const notFoundList = summaryStats.filter((s) => s.status === 'NOT_FOUND').map((s) => s.table);

  console.log('='.repeat(84));
  console.log(`🎉 EXPORT COMPLETED in ${durationSec}s`);
  console.log(` • Total Exported Rows:   ${totalRows.toLocaleString()}`);
  console.log(` • Active Tables Found:   ${activeTablesCount}`);
  console.log(` • Destination Directory: ${EXPORTS_DIR}`);

  if (notFoundList.length > 0) {
    console.log(` • Inactive/Unused Tables (${notFoundList.length}): ${notFoundList.join(', ')}`);
  }
  console.log('='.repeat(84) + '\n');
}

main().catch((err) => {
  console.error('Fatal exporter error:', err);
  process.exit(1);
});

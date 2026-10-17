import fs from 'fs';
import path from 'path';

console.log('[check-firebase-config] Running Firebase project configuration validation...');

const EXPECTED_PROJECT_ID = 'gen-lang-client-0365509316';
const EXPECTED_AUTH_DOMAIN = 'auth.boardly.cfd';
const EXPECTED_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';
const EXPECTED_STORAGE_BUCKET = 'gen-lang-client-0365509316.firebasestorage.app';
const EXPECTED_DATABASE_ID = 'ai-studio-25287ca6-33a1-49f8-8867-70061120a712';

const errors = [];

// 1. Validate hardcoded constants in src/lib/firebaseConfig.ts directly
const firebaseConfigPath = path.resolve('src/lib/firebaseConfig.ts');
if (!fs.existsSync(firebaseConfigPath)) {
  errors.push('src/lib/firebaseConfig.ts not found.');
} else {
  const content = fs.readFileSync(firebaseConfigPath, 'utf8');

  if (!content.includes(`TARGET_PROJECT_ID = '${EXPECTED_PROJECT_ID}'`)) {
    errors.push(`src/lib/firebaseConfig.ts must export TARGET_PROJECT_ID = '${EXPECTED_PROJECT_ID}'`);
  }
  if (!content.includes(`TARGET_AUTH_DOMAIN = '${EXPECTED_AUTH_DOMAIN}'`)) {
    errors.push(`src/lib/firebaseConfig.ts must export TARGET_AUTH_DOMAIN = '${EXPECTED_AUTH_DOMAIN}'`);
  }
  if (!content.includes(`TARGET_API_KEY = '${EXPECTED_API_KEY}'`)) {
    errors.push(`src/lib/firebaseConfig.ts must export TARGET_API_KEY = '${EXPECTED_API_KEY}'`);
  }
  if (!content.includes(`TARGET_STORAGE_BUCKET = '${EXPECTED_STORAGE_BUCKET}'`)) {
    errors.push(`src/lib/firebaseConfig.ts must export TARGET_STORAGE_BUCKET = '${EXPECTED_STORAGE_BUCKET}'`);
  }
  if (!content.includes(`TARGET_DATABASE_ID = '${EXPECTED_DATABASE_ID}'`)) {
    errors.push(`src/lib/firebaseConfig.ts must export TARGET_DATABASE_ID = '${EXPECTED_DATABASE_ID}'`);
  }
}

// 2. Scan repository for forbidden leftover references to 'boardly-8c0cd'
const skipDirs = new Set(['node_modules', 'dist', '.git', 'data_backup']);
const scanExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.html']);

function scanPath(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.statSync(targetPath);

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      if (skipDirs.has(entry.name)) continue;
      scanPath(path.join(targetPath, entry.name));
    }
  } else if (stat.isFile()) {
    const filename = path.basename(targetPath);
    const ext = path.extname(targetPath);

    const isEnvFile = filename.startsWith('.env');
    const isScannable = scanExtensions.has(ext) || isEnvFile;

    if (!isScannable) return;

    if (
      filename === 'check-firebase-config.mjs' ||
      filename === 'PROJECT_RULES.md' ||
      filename === 'README.md' ||
      filename === 'DATA_AUDIT.md' ||
      filename === 'SPEC.md' ||
      filename === 'DECISIONS.md'
    ) {
      return;
    }

    const content = fs.readFileSync(targetPath, 'utf8');

    if (content.includes('boardly-8c0cd')) {
      errors.push(`Deprecated project ID "boardly-8c0cd" found in: ${targetPath}`);
    }
  }
}

scanPath(path.resolve('src'));
scanPath(path.resolve('scripts'));
scanPath(path.resolve('functions'));

if (errors.length > 0) {
  console.error('\n❌ FIREBASE CONFIG CHECK FAILED:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(`✅ [check-firebase-config] Firebase config constants verified for ${EXPECTED_PROJECT_ID} (${EXPECTED_DATABASE_ID})!`);
process.exit(0);

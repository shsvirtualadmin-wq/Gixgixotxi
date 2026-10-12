import fs from 'fs';
import path from 'path';

console.log('[check-firebase-config] Running permanent Firebase auth & project constants validation...');

const EXPECTED_PROJECT_ID = 'boardly-8c0cd';
const EXPECTED_AUTH_DOMAIN = 'auth.boardly.cfd';
const EXPECTED_API_KEY = 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';
const EXPECTED_STORAGE_BUCKET = 'boardly-8c0cd.firebasestorage.app';

const errors = [];

// 1. Validate hardcoded constants in src/lib/firebaseConfig.ts directly (independent of process.env)
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
}

// 2. Scan repository directories and .env files for forbidden keywords ("gen-lang-client" and "firebaseapp.com")
const skipDirs = new Set(['node_modules', 'dist', '.git', 'data_backup']);
const scanExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.toml', '.env']);

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

    // Scan source files, config files, and any .env* files
    const isEnvFile = filename.startsWith('.env');
    const isScannable = scanExtensions.has(ext) || isEnvFile || filename === 'wrangler.toml';

    if (!isScannable) return;

    // Skip this verification script itself and rules documentation that describe the rule
    if (
      filename === 'check-firebase-config.mjs' ||
      filename === 'PROJECT_RULES.md' ||
      filename === 'README.md'
    ) {
      return;
    }

    const content = fs.readFileSync(targetPath, 'utf8');

    // Forbidden reference to deprecated config
    if (content.includes('firebase-applet-config.json') && !filename.includes('firebase-applet-config.json')) {
      errors.push(`Forbidden reference to "firebase-applet-config.json" found in: ${targetPath}`);
    }

    // Forbidden string "gen-lang-client"
    if (content.includes('gen-lang-client')) {
      errors.push(`Forbidden string "gen-lang-client" found in: ${targetPath}`);
    }

    // Forbidden string "firebaseapp.com" in source files or env files
    if (
      content.includes('firebaseapp.com') &&
      !targetPath.endsWith('firebaseConfig.ts') &&
      !filename.includes('firebase-blueprint.json')
    ) {
      errors.push(`Forbidden string "firebaseapp.com" found in: ${targetPath}`);
    }
  }
}

// Scan src/, scripts/, functions/, and root directory
scanPath(path.resolve('src'));
scanPath(path.resolve('scripts'));
scanPath(path.resolve('functions'));

// Scan root config and env files
const rootFiles = fs.readdirSync(path.resolve('.'));
for (const file of rootFiles) {
  if (file.startsWith('.env') || file === 'vite.config.ts' || file === 'wrangler.toml') {
    scanPath(path.resolve(file));
  }
}

if (errors.length > 0) {
  console.error('\n❌ FIREBASE CONFIG CHECK FAILED:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  console.error('\nHalting build. See PROJECT_RULES.md for rules on protected auth configuration.\n');
  process.exit(1);
}

console.log(`✅ [check-firebase-config] All Firebase config constants verified!`);
console.log(`   - Project ID pinned to: ${EXPECTED_PROJECT_ID}`);
console.log(`   - Auth Domain pinned to: ${EXPECTED_AUTH_DOMAIN}`);
console.log(`   - Storage Bucket pinned to: ${EXPECTED_STORAGE_BUCKET}`);
console.log(`   - Web API Key validated: ${EXPECTED_API_KEY.slice(0, 8)}...`);
console.log(`   - No gen-lang-client or firebaseapp.com leaks found across repository\n`);
process.exit(0);

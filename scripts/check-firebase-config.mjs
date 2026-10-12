import fs from 'fs';
import path from 'path';

console.log('[check-firebase-config] Running permanent Firebase auth & project guardrails check...');

const EXPECTED_PROJECT_ID = 'boardly-8c0cd';
const EXPECTED_AUTH_DOMAIN = 'auth.boardly.cfd';

const errors = [];

// 1. Check environment variables if set in process.env
const envProjectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim();
const envAuthDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();

if (envProjectId && envProjectId !== EXPECTED_PROJECT_ID) {
  errors.push(`VITE_FIREBASE_PROJECT_ID is set to "${envProjectId}", but MUST be "${EXPECTED_PROJECT_ID}".`);
}

if (envAuthDomain && envAuthDomain !== EXPECTED_AUTH_DOMAIN) {
  errors.push(`VITE_FIREBASE_AUTH_DOMAIN is set to "${envAuthDomain}", but MUST be "${EXPECTED_AUTH_DOMAIN}".`);
}

// 2. Check for forbidden keywords in env vars
for (const [key, val] of Object.entries(process.env)) {
  if (typeof val === 'string') {
    if (val.includes('gen-lang-client')) {
      errors.push(`Forbidden string "gen-lang-client" found in process.env.${key} ("${val}").`);
    }
    if ((key.includes('AUTH_DOMAIN') || key.includes('FIREBASE')) && val.includes('firebaseapp.com')) {
      errors.push(`Forbidden string "firebaseapp.com" found in process.env.${key} ("${val}"). Must use ${EXPECTED_AUTH_DOMAIN}.`);
    }
  }
}

// 3. Scan src/ directory recursively for:
// - Imports or references to firebase-applet-config.json
// - Hardcoded gen-lang-client or firebaseapp.com
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.html'].includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('firebase-applet-config.json')) {
          errors.push(`Forbidden reference to "firebase-applet-config.json" found in: ${fullPath}`);
        }
        if (content.includes('gen-lang-client')) {
          errors.push(`Forbidden string "gen-lang-client" found in: ${fullPath}`);
        }
        if (fullPath.includes('/src/') && content.includes('firebaseapp.com') && !fullPath.includes('firebaseConfig.ts')) {
          errors.push(`Forbidden string "firebaseapp.com" found in: ${fullPath}`);
        }
      }
    }
  }
}

scanDirectory(path.resolve('src'));

// 4. Verify vite.config.ts defaults
const viteConfigPath = path.resolve('vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
  if (viteContent.includes('firebase-applet-config')) {
    errors.push('vite.config.ts contains forbidden reference to firebase-applet-config.');
  }
  if (viteContent.includes('gen-lang-client')) {
    errors.push('vite.config.ts contains forbidden string "gen-lang-client".');
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

console.log(`✅ [check-firebase-config] All Firebase config guardrails PASSED!`);
console.log(`   - Project ID pinned to: ${EXPECTED_PROJECT_ID}`);
console.log(`   - Auth Domain pinned to: ${EXPECTED_AUTH_DOMAIN}`);
console.log(`   - No gen-lang-client or firebaseapp.com leaks in src/\n`);
process.exit(0);

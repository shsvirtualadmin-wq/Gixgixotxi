/**
 * Admin batch script to pre-convert question bank mathematics into KaTeX format.
 * Run via: tsx scripts/preconvertMcqBank.ts
 */
import fs from 'fs';
import path from 'path';
import { PREBUILT_QUESTIONS } from '../src/data/prebuiltQuestions.js';
import { ALL_MDCAT_QUESTIONS } from '../src/data/mdcatPrebuiltQuestions.js';
import { ALL_TCAT_QUESTIONS } from '../src/data/tcatPrebuiltQuestions.js';
import { renderMath } from '../src/lib/boardyMath.js';

interface PreconvertedItem {
  id: string;
  qHtml: string;
  optionsHtml: string[];
  explainHtml: string;
}

async function runPreconversion() {
  console.log('==================================================');
  console.log('BOARDLY MCQ BANK KATEX BATCH PRE-CONVERTER');
  console.log('==================================================\n');

  const pool: any[] = [];

  // 1. Gather all core subject prebuilt questions
  Object.entries(PREBUILT_QUESTIONS || {}).forEach(([subject, qs]) => {
    if (Array.isArray(qs)) {
      qs.forEach((q) => pool.push({ ...q, subjectCategory: subject }));
    }
  });

  // 2. MDCAT & TCAT questions
  if (Array.isArray(ALL_MDCAT_QUESTIONS)) {
    ALL_MDCAT_QUESTIONS.forEach((q) => pool.push({ ...q, subjectCategory: 'MDCAT' }));
  }
  if (Array.isArray(ALL_TCAT_QUESTIONS)) {
    ALL_TCAT_QUESTIONS.forEach((q) => pool.push({ ...q, subjectCategory: 'TCAT' }));
  }

  console.log(`Discovered ${pool.length} questions across curriculum.`);

  const cacheDir = path.join(process.cwd(), 'src', 'data', 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const cacheFile = path.join(cacheDir, 'mcq_katex_preconverted.json');
  const cacheMap: Record<string, PreconvertedItem> = {};

  let convertedCount = 0;
  let fallbackCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < pool.length; i++) {
    const q = pool[i];
    if (!q || !q.id) continue;

    try {
      const qHtml = renderMath(q.q || q.question || '');
      const optionsHtml = (q.options || []).map((opt: string) => renderMath(opt || ''));
      const explainHtml = renderMath(q.explain || q.explanation || '');

      cacheMap[q.id] = {
        id: q.id,
        qHtml,
        optionsHtml,
        explainHtml,
      };
      convertedCount++;
    } catch (err) {
      fallbackCount++;
      console.warn(`[Preconvert Warning] Failed to render question ${q.id}:`, err);
    }

    if ((i + 1) % 500 === 0 || i === pool.length - 1) {
      console.log(`Processed ${i + 1}/${pool.length} questions (${Math.round(((i + 1) / pool.length) * 100)}%)...`);
    }
  }

  fs.writeFileSync(cacheFile, JSON.stringify(cacheMap, null, 2), 'utf8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n==================================================');
  console.log(`Pre-conversion completed in ${elapsed}s!`);
  console.log(`Successfully converted: ${convertedCount}`);
  console.log(`Fallbacks logged: ${fallbackCount}`);
  console.log(`Saved output to: ${cacheFile}`);
  console.log('==================================================');
}

runPreconversion().catch(console.error);

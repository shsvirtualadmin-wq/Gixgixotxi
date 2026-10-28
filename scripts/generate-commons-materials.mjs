#!/usr/bin/env node
/**
 * Boardly Commons Study Materials AI Generator & Publisher CLI
 *
 * Generates 50 curriculum-aligned study materials (42 real PDF files + 8 text-only posts)
 * at runtime using the Gemini API (Generate + Fact-Check passes) and publishes them to
 * Boardly Commons (Firebase Project: gen-lang-client-0365509316,
 * Firestore Database: ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712,
 * Collection: commonsPosts).
 *
 * Strictly zero hardcoded study content: all educational material is generated live
 * from `topics.json` via the Gemini API.
 *
 * Required Environment Variables:
 *   - GEMINI_API_KEY
 *   - GOOGLE_APPLICATION_CREDENTIALS (required for Admin SDK live publish unless --dry-run or --client-sdk is used)
 *
 * Supported Flags:
 *   --dry-run            Generate, validate, fact-check, build & verify PDFs, and validate Firestore post payloads locally without writing to Firebase
 *   --only <id[,id...]>  Run only for specific topic ID(s), e.g. --only 1 or --only 1,4,11
 *   --limit <n>          Process at most <n> pending topics
 *   --concurrency <n>    Number of topics to process in parallel (default: 1; e.g. --concurrency 6)
 *   --repair             Repair/update already-published posts in place in Firestore without duplicating them
 *   --client-sdk         Publish using the Firebase Web Client SDK to the named Firestore database when a service account JSON is not present
 *   --topics <path>      Custom path to topics JSON (default: ./topics.json)
 *   --log <path>         Custom path to progress log JSON (default: ./log.json)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import PDFDocument from 'pdfkit';
import { extractText, getDocumentProxy } from 'unpdf';
import katex from 'katex';

// Correct modular ESM imports for firebase-admin v13/v14 (supports named Firestore databaseId)
import {
  initializeApp as initAdminApp,
  cert as adminCert,
  getApps as getAdminApps,
  getApp as getAdminApp,
} from 'firebase-admin/app';
import {
  getFirestore as getAdminFirestore,
  Timestamp as AdminTimestamp,
} from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// Firebase Web Client SDK imports (used when --client-sdk or FIREBASE_USE_CLIENT_SDK=1 is set)
import { initializeApp as initClientApp, getApps as getClientApps, getApp as getClientApp } from 'firebase/app';
import { getAuth as getClientAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore as getClientFirestore,
  collection as clientCollection,
  doc as clientDoc,
  getDoc as clientGetDoc,
  getDocs as clientGetDocs,
  setDoc as clientSetDoc,
  updateDoc as clientUpdateDoc,
  deleteDoc as clientDeleteDoc,
  query as clientQuery,
  where as clientWhere,
  limit as clientLimit,
  Timestamp as ClientTimestamp,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load Firebase config matching src/lib/firebaseConfig.ts
const APPLET_CONFIG_PATH = path.join(PROJECT_ROOT, 'firebase-applet-config.json');
const APPLET_CONFIG = fs.existsSync(APPLET_CONFIG_PATH)
  ? JSON.parse(fs.readFileSync(APPLET_CONFIG_PATH, 'utf8'))
  : {
      apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'auth.boardly.cfd',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316',
      storageBucket:
        process.env.VITE_FIREBASE_STORAGE_BUCKET ||
        'gen-lang-client-0365509316.firebasestorage.app',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '556734245207',
      appId:
        process.env.VITE_FIREBASE_APP_ID || '1:556734245207:web:4797f3915b424209b03612',
      firestoreDatabaseId:
        process.env.VITE_FIREBASE_DATABASE_ID ||
        process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
        'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712',
    };

const DEFAULT_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  APPLET_CONFIG.projectId ||
  'gen-lang-client-0365509316';

const DEFAULT_DATABASE_ID =
  process.env.FIREBASE_DATABASE_ID ||
  process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  process.env.VITE_FIREBASE_DATABASE_ID ||
  APPLET_CONFIG.firestoreDatabaseId ||
  'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

const DEFAULT_STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.VITE_FIREBASE_STORAGE_BUCKET ||
  APPLET_CONFIG.storageBucket ||
  'gen-lang-client-0365509316.firebasestorage.app';

const REQUIRED_FOOTER_TEXT =
  'Generated with AI for revision. Please verify with your textbook.';

// TrueType font paths (bundled in scripts/fonts for cross-platform Unicode rendering)
const FONT_REGULAR_PATH = path.join(__dirname, 'fonts', 'DejaVuSans.ttf');
const FONT_BOLD_PATH = path.join(__dirname, 'fonts', 'DejaVuSans-Bold.ttf');

// Model fallback chain (tries user override first, then fast/reliable Gemini 3 Flash models)
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
].filter(Boolean);

// ============================================================================
// CLI Argument Parser & Environment Checks
// ============================================================================

function parseArgs(argv) {
  const options = {
    dryRun: false,
    repair: false,
    useClientSdk: process.env.FIREBASE_USE_CLIENT_SDK === '1',
    onlyIds: null,
    limit: null,
    concurrency: 1,
    topicsPath: path.join(PROJECT_ROOT, 'topics.json'),
    logPath: path.join(PROJECT_ROOT, 'log.json'),
    outputDir: path.join(PROJECT_ROOT, 'generated-materials'),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--repair') {
      options.repair = true;
    } else if (arg === '--client-sdk') {
      options.useClientSdk = true;
    } else if (arg === '--only') {
      const val = argv[++i];
      if (!val) {
        throw new Error('Missing value for --only <id>. Example: --only 1 or --only 1,4,11');
      }
      options.onlyIds = new Set(
        val
          .split(',')
          .map((s) => Number.parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n))
      );
      if (options.onlyIds.size === 0) {
        throw new Error(`Invalid value for --only: "${val}". Expected numeric topic ID(s).`);
      }
    } else if (arg.startsWith('--only=')) {
      const val = arg.slice('--only='.length);
      options.onlyIds = new Set(
        val
          .split(',')
          .map((s) => Number.parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n))
      );
    } else if (arg === '--limit') {
      const val = Number.parseInt(argv[++i], 10);
      if (Number.isNaN(val) || val <= 0) {
        throw new Error('Invalid value for --limit <n>. Expected a positive integer.');
      }
      options.limit = val;
    } else if (arg.startsWith('--limit=')) {
      const val = Number.parseInt(arg.slice('--limit='.length), 10);
      if (Number.isNaN(val) || val <= 0) {
        throw new Error('Invalid value for --limit <n>. Expected a positive integer.');
      }
      options.limit = val;
    } else if (arg === '--concurrency') {
      const val = Number.parseInt(argv[++i], 10);
      if (Number.isNaN(val) || val <= 0) {
        throw new Error('Invalid value for --concurrency <n>. Expected a positive integer.');
      }
      options.concurrency = Math.min(val, 10);
    } else if (arg.startsWith('--concurrency=')) {
      const val = Number.parseInt(arg.slice('--concurrency='.length), 10);
      if (Number.isNaN(val) || val <= 0) {
        throw new Error('Invalid value for --concurrency <n>. Expected a positive integer.');
      }
      options.concurrency = Math.min(val, 10);
    } else if (arg === '--topics') {
      options.topicsPath = path.resolve(argv[++i]);
    } else if (arg === '--log') {
      options.logPath = path.resolve(argv[++i]);
    }
  }

  return options;
}

function validateEnvironment(options) {
  const missingVars = [];

  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
    missingVars.push('GEMINI_API_KEY');
  }

  if (!options.dryRun && !options.useClientSdk) {
    if (
      !process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      !process.env.GOOGLE_APPLICATION_CREDENTIALS.trim()
    ) {
      missingVars.push('GOOGLE_APPLICATION_CREDENTIALS');
    }
  }

  if (missingVars.length > 0) {
    console.error('\n[ERROR] Missing required environment variable(s):');
    for (const v of missingVars) {
      console.error(`  - ${v}`);
    }
    console.error('\nHow to fix:');
    console.error('  export GEMINI_API_KEY="your-gemini-api-key"');
    console.error('  export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"');
    console.error('\n(Note: Never commit API keys or service account JSON files to git.)\n');
    process.exit(1);
  }

  if (!options.dryRun && !options.useClientSdk) {
    const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (!fs.existsSync(credPath)) {
      console.error(
        `\n[ERROR] GOOGLE_APPLICATION_CREDENTIALS points to a file that does not exist: ${credPath}\n`
      );
      process.exit(1);
    }
  }

  if (!fs.existsSync(FONT_REGULAR_PATH) || !fs.existsSync(FONT_BOLD_PATH)) {
    console.error(
      `\n[ERROR] Embedded Unicode TrueType fonts not found in ${path.join(__dirname, 'fonts')}.\n` +
        `Expected DejaVuSans.ttf and DejaVuSans-Bold.ttf.\n`
    );
    process.exit(1);
  }

  if (!fs.existsSync(options.topicsPath)) {
    console.error(`\n[ERROR] Topics input file not found at: ${options.topicsPath}\n`);
    process.exit(1);
  }
}

// ============================================================================
// Boardly Search Keywords & Sanitization Helpers (Matches src/services/commonsService.ts)
// ============================================================================

/**
 * Exact replica of `generateSearchKeywords` from `src/services/commonsService.ts`
 * so generated posts are searchable in Boardly Commons identically to user-created posts.
 */
function generateSearchKeywords(title, subject, chapter, tags, authorName, classLevel, board) {
  const combined = `${title} ${subject} ${chapter || ''} ${tags.join(' ')} ${authorName || ''} ${classLevel || ''} ${board || ''}`.toLowerCase();
  const rawTokens = combined.split(/[\s,._\-/\\()[\]{}:;!?'"`~@#$%^&*+=|<>]+/).filter(Boolean);

  const keywords = new Set();

  for (const token of rawTokens) {
    if (token.length < 2) continue;
    keywords.add(token);

    if (token.length >= 3) {
      const maxPrefixLen = Math.min(token.length, 12);
      for (let i = 3; i <= maxPrefixLen; i++) {
        keywords.add(token.slice(0, i));
      }
    }
  }

  return Array.from(keywords).slice(0, 80);
}

/**
 * Exact replica of `commonsUploadService.ts` Storage path sanitization
 */
function sanitizeStorageFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function sanitizeReadableFileName(str) {
  return str
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes text for PDF sections so no markdown stars (*), decorative symbols, or replacement chars appear.
 */
function cleanPlainText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\uFFFD/g, '')
    .replace(/[*★☆•●◆▪▸►]/g, '-')
    .replace(/#+\s*/g, '')
    .replace(/`+/g, '')
    .replace(/_{2,}/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Normalizes post description/body text while preserving KaTeX ($...$ and $$...$$) expressions intact.
 * Also repairs LaTeX commands (\frac, \times, \theta, \text, \beta, \rho, \rightarrow, \neq, etc.)
 * whose leading backslash was turned into an ASCII control char (\f, \t, \b, \r, \n) by JSON.parse.
 */
function cleanPostMathText(text) {
  if (typeof text !== 'string') return '';
  const repairedJsonEscapes = text
    .replace(/\x0c/g, '\\f')
    .replace(/\x08/g, '\\b')
    .replace(/\x09(?=[a-zA-Z])/g, '\\t')
    .replace(/\x0d(?=[a-zA-Z])/g, '\\r')
    .replace(/\x0a(?=(?:eq\b|u\b|abla\b|otin\b|atural\b|eg\b|mid\b|parallel\b|ewline\b|subseteq\b|supseteq\b))/g, '\\n');

  const mathPlaceholders = [];
  const masked = repairedJsonEscapes
    .replace(/\uFFFD/g, '')
    .replace(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g, (match) => {
      const idx = mathPlaceholders.length;
      mathPlaceholders.push(match);
      return `@@MATH_SEG_${idx}@@`;
    });

  const cleanedOutside = masked
    .replace(/[*★☆•●◆▪▸►]/g, '-')
    .replace(/#+\s*/g, '')
    .replace(/`+/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleanedOutside.replace(/@@MATH_SEG_(\d+)@@/g, (_m, idx) => mathPlaceholders[Number(idx)]);
}

/**
 * Validates that text contains at least one KaTeX ($...$ or $$...$$) expression
 * and that every KaTeX expression compiles cleanly with `throwOnError: true`.
 */
function validateKatexInText(text) {
  if (!text || typeof text !== 'string') {
    return { ok: false, count: 0, reason: 'Text is empty.' };
  }

  const regex = /(?:\$\$([\s\S]+?)\$\$)|(?:\$([^$\n]+?)\$)/g;
  let match;
  let count = 0;

  while ((match = regex.exec(text)) !== null) {
    const isDisplay = match[1] !== undefined;
    const formula = (isDisplay ? match[1] : match[2] || '').trim();
    if (!formula) {
      return { ok: false, count, reason: 'Empty $...$ math block found.' };
    }
    try {
      katex.renderToString(formula, {
        displayMode: isDisplay,
        throwOnError: true,
        strict: 'ignore',
        trust: false,
      });
      count++;
    } catch (err) {
      return {
        ok: false,
        count,
        reason: `Invalid KaTeX in "${formula.slice(0, 40)}": ${err.message}`,
      };
    }
  }

  if (count === 0) {
    return {
      ok: false,
      count: 0,
      reason: 'Post description must include at least one KaTeX math expression ($...$ or $$...$$).',
    };
  }

  return { ok: true, count };
}

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

// ============================================================================
// Gemini API Client with Rate-Limit Backoff & Model Fallback
// ============================================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let activeWorkingModel = MODEL_CANDIDATES[0];

async function callGeminiJson(ai, prompt, schema, label) {
  const maxAttempts = 5;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const modelToTry =
      attempt === 1
        ? activeWorkingModel
        : MODEL_CANDIDATES[(attempt - 1) % MODEL_CANDIDATES.length];

    try {
      const timeoutMs = 60000;
      const responsePromise = ai.models.generateContent({
        model: modelToTry,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.4,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const response = await Promise.race([responsePromise, timeoutPromise]);
      const rawText = response?.text;
      if (!rawText || !rawText.trim()) {
        throw new Error('Empty response text returned from Gemini API.');
      }

      const parsed = JSON.parse(rawText);
      activeWorkingModel = modelToTry;
      return parsed;
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.code || '';
      const msg = err?.message || String(err);
      const isRateLimitOrTransient =
        status === 429 ||
        status === 503 ||
        status === 500 ||
        /429|503|rate.?limit|quota|timed out|overloaded|unavailable|fetch failed/i.test(msg);

      const backoffMs = isRateLimitOrTransient
        ? Math.min(2000 * Math.pow(2, attempt - 1), 20000)
        : 1500 * attempt;

      console.warn(
        `  [Gemini Retry ${attempt}/${maxAttempts}] (${label} via ${modelToTry}): ${msg.slice(0, 140)}. Waiting ${backoffMs}ms...`
      );
      await sleep(backoffMs);
    }
  }

  throw new Error(`Gemini API failed after ${maxAttempts} attempts (${label}): ${lastError?.message || lastError}`);
}

// ============================================================================
// Step 1, 2, 3: GENERATE, VALIDATE & FACT-CHECK Schemas and Prompts
// ============================================================================

const PDF_STUDY_GUIDE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    teacherDescription: {
      type: Type.STRING,
      description:
        'A warm 3-4 sentence summary in a helpful Pakistani high-school teacher voice introducing these revision notes for the post description, INCLUDING 2 to 4 key KaTeX math expressions/formulas wrapped in $...$ (inline) or $$...$$ (display) relevant to the topic.',
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 to 7 lowercase single-word or hyphenated revision tags relevant to the topic.',
    },
    overview: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        '3 detailed paragraphs introducing the topic, why it matters in board exams, and the fundamental intuition.',
    },
    sections: {
      type: Type.ARRAY,
      description: '4 comprehensive concept sections covering the syllabus subtopics in depth.',
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          explanation: {
            type: Type.STRING,
            description:
              'Detailed, clear multi-sentence explanation of the concept written in a helpful teacher voice (at least 110 words per section).',
          },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '4 to 5 concise bullet statements summarizing essential facts or rules.',
          },
        },
        required: ['heading', 'explanation', 'keyPoints'],
      },
    },
    keyFormulasOrDefinitions: {
      type: Type.ARRAY,
      description:
        '8 to 10 key formulas, laws, equations, grammar rules, or core definitions with plain-text notation (e.g., x^2, sqrt(x), v = u + at) for the PDF body.',
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          detail: { type: Type.STRING },
        },
        required: ['term', 'detail'],
      },
    },
    workedExamples: {
      type: Type.ARRAY,
      description:
        '4 detailed step-by-step worked examples or model board-exam questions with full solutions.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          problem: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          finalAnswer: { type: Type.STRING },
        },
        required: ['title', 'problem', 'steps', 'finalAnswer'],
      },
    },
    practiceQuestions: {
      type: Type.ARRAY,
      description: 'Exactly 5 board-exam style practice questions with step-by-step answers.',
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ['question', 'answer'],
      },
    },
    commonMistakes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        '5 to 6 common mistakes students make in board exams on this topic and how to avoid them.',
    },
  },
  required: [
    'teacherDescription',
    'tags',
    'overview',
    'sections',
    'keyFormulasOrDefinitions',
    'workedExamples',
    'practiceQuestions',
    'commonMistakes',
  ],
};

const PDF_KATEX_DESC_ONLY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    teacherDescription: {
      type: Type.STRING,
      description:
        'A warm 3-5 sentence overview in a helpful Pakistani high-school teacher voice introducing these revision notes for Boardly Commons, including 2 to 4 accurate KaTeX expressions wrapped in $...$ or $$...$$ summarizing the core formulas, equations, laws, or structural rules of the topic.',
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 to 7 lowercase tags relevant to the topic.',
    },
  },
  required: ['teacherDescription', 'tags'],
};

const TEXT_POST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    body: {
      type: Type.STRING,
      description:
        'A revision post of strictly 165 to 260 words written in a warm, clear teacher voice (a revision tip, quick summary, or numbered checklist) that includes at least 2 to 4 valid KaTeX math/formula expressions wrapped in $...$ or $$...$$. No markdown stars (*), no hashtags (#), no tables.',
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 to 7 lowercase tags relevant to the topic.',
    },
  },
  required: ['body', 'tags'],
};

async function generateAndFactCheckPdfDescriptionWithKatex(ai, topic) {
  const draftPrompt = `You are a senior subject teacher preparing a Boardly Commons post summary for ${topic.classLevel} (${topic.board} Board, Pakistan) in ${topic.subject}.

Topic Title: "${topic.title}"
Subject: ${topic.subject}
Class Level: ${topic.classLevel}
Curriculum Board: ${topic.board} Board

Write "teacherDescription" (3 to 5 sentences, 55 to 110 words) introducing the attached PDF study guide for "${topic.title}".
CRITICAL REQUIREMENT:
- You MUST include 2 to 4 valid KaTeX math/scientific/structural expressions wrapped in inline $...$ or display $$...$$ delimiters (for example: $a^2 - b^2 = (a-b)(a+b)$, $F = G\\frac{m_1 m_2}{r^2}$, $\\text{pH} = -\\log[\\text{H}^+]$, $6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{light}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$, $\\mathcal{O}(n \\log n)$, or structural/marks formulas like $\\text{Passive} = \\text{Object} + \\text{be} + V_3 + \\text{by} + \\text{Subject}$).
- Ensure every $...$ block uses valid KaTeX syntax with balanced braces and dollar signs.
- Do NOT use markdown asterisks (*) or hashtags (#) outside $...$.`;

  const draft = await callGeminiJson(
    ai,
    draftPrompt,
    PDF_KATEX_DESC_ONLY_SCHEMA,
    `Step 1 KaTeX Summary #${topic.id}`
  );

  const checkPrompt = `You are a senior curriculum reviewer for ${topic.classLevel} (${topic.board} Board, Pakistan) in ${topic.subject}.
Review and fact-check the following post summary for "${topic.title}":
${JSON.stringify(draft)}

1. Verify all facts and formulas for 100% accuracy at ${topic.classLevel} (${topic.board} Board).
2. Ensure "teacherDescription" contains at least 2 valid KaTeX expressions wrapped in $...$ or $$...$$ with balanced dollar signs and valid KaTeX commands.
3. Ensure no markdown asterisks (*) or hashtags (#) appear outside $...$.`;

  const checked = await callGeminiJson(
    ai,
    checkPrompt,
    PDF_KATEX_DESC_ONLY_SCHEMA,
    `Step 3 Fact-Check KaTeX Summary #${topic.id}`
  );

  return {
    teacherDescription: cleanPostMathText(checked.teacherDescription),
    tags: Array.isArray(checked.tags)
      ? checked.tags.map((t) => cleanPlainText(t).toLowerCase()).filter(Boolean).slice(0, 7)
      : [],
  };
}

async function step1Generate(ai, topic) {
  if (topic.format === 'pdf') {
    const prompt = `You are a senior subject teacher preparing an official revision study guide for ${topic.classLevel} (${topic.board} Board, Pakistan) in the subject ${topic.subject}.

Topic Title: "${topic.title}"
Subject: ${topic.subject}
Class Level: ${topic.classLevel}
Curriculum Board: ${topic.board} Board

Requirements:
1. Write in a clear, helpful, encouraging teacher voice tailored to ${topic.classLevel} ${topic.board} Board students.
2. Provide thorough, accurate, textbook-aligned explanations so the finished study guide fills 3 to 5 A4 pages comfortably (roughly 1,400 to 2,100 words total across all sections).
3. Include:
   - teacherDescription: 3 to 4 sentences introducing these revision notes for the Boardly Commons feed, INCLUDING 2 to 4 valid KaTeX expressions wrapped in $...$ or $$...$$ highlighting the core formulas, equations, or rules of "${topic.title}".
   - overview: 3 substantive paragraphs introducing the topic and its exam importance (plain text for PDF).
   - sections: 4 in-depth concept sections (each with a clear heading, a thorough 110-160 word explanation, and 4-5 key points in plain text for PDF).
   - keyFormulasOrDefinitions: 8 to 10 essential formulas, laws, rules, or definitions in clean plain text for the PDF body (e.g., x^2, a/b, sqrt(b^2 - 4ac), v = u + a*t, 2H2 + O2 -> 2H2O).
   - workedExamples: 4 complete worked examples or solved board-style exercises with step-by-step workings and final answers.
   - practiceQuestions: 5 board-exam practice questions, each with a complete, clear model answer.
   - commonMistakes: 5 to 6 specific exam mistakes students often make on "${topic.title}" and how to avoid them.
4. Do NOT use asterisks (*), star symbols, or markdown tables outside $...$ math blocks.`;

    return await callGeminiJson(
      ai,
      prompt,
      PDF_STUDY_GUIDE_SCHEMA,
      `Step 1 Generate PDF #${topic.id}`
    );
  } else {
    const prompt = `You are a senior subject teacher writing a high-value revision post for Boardly Commons.

Topic Title: "${topic.title}"
Subject: ${topic.subject}
Class Level: ${topic.classLevel}
Curriculum Board: ${topic.board} Board

Requirements:
1. Write a revision note, exam tip, or numbered revision checklist in a warm, clear teacher voice.
2. Length MUST be strictly between 170 and 250 words (within the required 150 to 300 word window).
3. Format using plain paragraphs and simple numbered lines (1., 2., 3.) or dashes (- ).
4. CRITICAL: Include at least 3 to 5 valid KaTeX math/scientific/structural expressions wrapped in inline $...$ or display $$...$$ delimiters (e.g., $ax + b = 0$, $v = u + at$, $s = ut + \\frac{1}{2}at^2$, $PV = nRT$, $E_a$, $\\text{Rate} \\propto [E][S]$, or structural equations in $...$). Ensure all dollar signs and braces are balanced.
5. Do NOT use markdown asterisks (*), stars, hashtags (#), or markdown tables outside $...$.`;

    return await callGeminiJson(
      ai,
      prompt,
      TEXT_POST_SCHEMA,
      `Step 1 Generate Text #${topic.id}`
    );
  }
}

function step2ValidateContent(topic, data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, reason: 'Generated data is null or not an object.' };
  }

  if (topic.format === 'pdf') {
    if (!data.teacherDescription || data.teacherDescription.trim().length < 20) {
      return { valid: false, reason: 'Missing or too short teacherDescription.' };
    }
    const katexCheck = validateKatexInText(data.teacherDescription);
    if (!katexCheck.ok) {
      return { valid: false, reason: `teacherDescription KaTeX validation failed: ${katexCheck.reason}` };
    }
    if (!Array.isArray(data.overview) || data.overview.length < 2) {
      return { valid: false, reason: 'Overview must have at least 2 paragraphs.' };
    }
    if (!Array.isArray(data.sections) || data.sections.length < 3) {
      return { valid: false, reason: 'Must have at least 3 concept sections.' };
    }
    for (const sec of data.sections) {
      if (!sec.heading || !sec.explanation || sec.explanation.trim().length < 60) {
        return { valid: false, reason: `Section "${sec?.heading || 'unnamed'}" is incomplete.` };
      }
      if (!Array.isArray(sec.keyPoints) || sec.keyPoints.length < 2) {
        return { valid: false, reason: `Section "${sec.heading}" lacks keyPoints.` };
      }
    }
    if (
      !Array.isArray(data.keyFormulasOrDefinitions) ||
      data.keyFormulasOrDefinitions.length < 5
    ) {
      return { valid: false, reason: 'Must have at least 5 keyFormulasOrDefinitions.' };
    }
    if (!Array.isArray(data.workedExamples) || data.workedExamples.length < 2) {
      return { valid: false, reason: 'Must have at least 2 workedExamples.' };
    }
    if (!Array.isArray(data.practiceQuestions) || data.practiceQuestions.length < 5) {
      return {
        valid: false,
        reason: `Expected at least 5 practiceQuestions with answers, got ${data.practiceQuestions?.length || 0}.`,
      };
    }
    for (const pq of data.practiceQuestions) {
      if (!pq.question || !pq.answer || pq.question.trim().length < 10 || pq.answer.trim().length < 5) {
        return { valid: false, reason: 'A practice question or its answer is empty/too short.' };
      }
    }
    if (!Array.isArray(data.commonMistakes) || data.commonMistakes.length < 3) {
      return { valid: false, reason: 'Must have at least 3 commonMistakes.' };
    }
    return { valid: true };
  } else {
    const cleanedBody = cleanPostMathText(data.body || '');
    const words = countWords(cleanedBody);
    if (words < 150 || words > 300) {
      return {
        valid: false,
        reason: `Text post word count is ${words} words (must be between 150 and 300 words).`,
      };
    }
    const katexCheck = validateKatexInText(cleanedBody);
    if (!katexCheck.ok) {
      return { valid: false, reason: `Text post KaTeX validation failed: ${katexCheck.reason}` };
    }
    return { valid: true };
  }
}

async function step3FactCheck(ai, topic, draftData) {
  if (topic.format === 'pdf') {
    const prompt = `You are an expert curriculum reviewer and fact-checker for ${topic.classLevel} (${topic.board} Board, Pakistan) in ${topic.subject}.

Review the following JSON study guide for the topic "${topic.title}".
Your task:
1. Check every formula, number, scientific law, mathematical step, historical/curriculum fact, definition, worked example calculation, and practice question answer for 100% accuracy at the ${topic.classLevel} (${topic.board} Board) level.
2. Fix any incorrect formula, wrong arithmetic, ambiguous statement, or unsimplified answer directly in the JSON.
3. Ensure "teacherDescription" includes 2 to 4 valid KaTeX expressions wrapped in $...$ or $$...$$ with balanced dollar signs and braces.
4. For the PDF sections (overview, sections, keyFormulasOrDefinitions, workedExamples, practiceQuestions, commonMistakes), ensure all math and scientific notation is written in clean, readable plain text (e.g., x^2, sqrt(x), a/b, ->) with NO LaTeX backslashes and NO markdown asterisks (*).
5. Keep the structure comprehensive (4 concept sections, 8-10 key definitions/formulas, 4 worked examples, 5 practice questions with full answers, 5-6 common mistakes) so that it produces a 3 to 5 page PDF.

Draft JSON to fact-check and return in corrected form:
${JSON.stringify(draftData)}`;

    const checked = await callGeminiJson(
      ai,
      prompt,
      PDF_STUDY_GUIDE_SCHEMA,
      `Step 3 Fact-Check PDF #${topic.id}`
    );
    return sanitizePdfData(checked);
  } else {
    const prompt = `You are an expert curriculum reviewer and fact-checker for ${topic.classLevel} (${topic.board} Board, Pakistan) in ${topic.subject}.

Review the following revision post for the topic "${topic.title}".
Your task:
1. Verify every definition, formula, example, or rule for accuracy at the ${topic.classLevel} (${topic.board} Board) level and fix any errors.
2. Ensure "body" includes at least 3 valid KaTeX expressions wrapped in $...$ or $$...$$ with balanced dollar signs and valid KaTeX syntax.
3. Ensure no markdown asterisks (*), hashtags (#), or tables appear outside $...$.
4. Ensure the word count of "body" is strictly between 170 and 250 words (must be within 150 to 300 words).

Draft JSON to fact-check and return in corrected form:
${JSON.stringify(draftData)}`;

    const checked = await callGeminiJson(
      ai,
      prompt,
      TEXT_POST_SCHEMA,
      `Step 3 Fact-Check Text #${topic.id}`
    );
    checked.body = cleanPostMathText(checked.body);
    checked.tags = Array.isArray(checked.tags)
      ? checked.tags.map((t) => cleanPlainText(t).toLowerCase()).filter(Boolean).slice(0, 7)
      : [];
    return checked;
  }
}

function sanitizePdfData(data) {
  return {
    teacherDescription: cleanPostMathText(data.teacherDescription),
    tags: (data.tags || [])
      .map((t) => cleanPlainText(t).toLowerCase())
      .filter(Boolean)
      .slice(0, 7),
    overview: (data.overview || []).map(cleanPlainText).filter(Boolean),
    sections: (data.sections || []).map((s) => ({
      heading: cleanPlainText(s.heading),
      explanation: cleanPlainText(s.explanation),
      keyPoints: (s.keyPoints || []).map(cleanPlainText).filter(Boolean),
    })),
    keyFormulasOrDefinitions: (data.keyFormulasOrDefinitions || []).map((k) => ({
      term: cleanPlainText(k.term),
      detail: cleanPlainText(k.detail),
    })),
    workedExamples: (data.workedExamples || []).map((w) => ({
      title: cleanPlainText(w.title),
      problem: cleanPlainText(w.problem),
      steps: (w.steps || []).map(cleanPlainText).filter(Boolean),
      finalAnswer: cleanPlainText(w.finalAnswer),
    })),
    practiceQuestions: (data.practiceQuestions || []).slice(0, 6).map((p) => ({
      question: cleanPlainText(p.question),
      answer: cleanPlainText(p.answer),
    })),
    commonMistakes: (data.commonMistakes || []).map(cleanPlainText).filter(Boolean),
  };
}

// ============================================================================
// Step 4: BUILD THE PDF (A4, Embedded TrueType Font, Plain & Clean, 3-6 Pages)
// ============================================================================

function renderPdfBuffer(topic, data, preset) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: preset.marginTop,
        bottom: preset.marginBottom,
        left: preset.marginX,
        right: preset.marginX,
      },
      bufferPages: true,
      info: {
        Title: `${topic.title} - ${topic.classLevel} (${topic.board} Board)`,
        Author: 'SHS Virtual Academy',
        Subject: `${topic.subject} (${topic.classLevel}, ${topic.board} Board)`,
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('Regular', FONT_REGULAR_PATH);
    doc.registerFont('Bold', FONT_BOLD_PATH);

    const contentBottomLimit = () => doc.page.height - preset.marginBottom - 28;

    const ensureSpace = (minHeightNeeded) => {
      if (doc.y + minHeightNeeded > contentBottomLimit()) {
        doc.addPage();
      }
    };

    const writeHeading1 = (text) => {
      ensureSpace(44);
      doc.moveDown(preset.sectionGap);
      doc
        .font('Bold')
        .fontSize(preset.h1Size)
        .fillColor('#000000')
        .text(text, { lineGap: preset.lineGap });
      doc.moveDown(0.3);
    };

    const writeHeading2 = (text) => {
      ensureSpace(34);
      doc.moveDown(preset.subSectionGap);
      doc
        .font('Bold')
        .fontSize(preset.h2Size)
        .fillColor('#000000')
        .text(text, { lineGap: preset.lineGap });
      doc.moveDown(0.2);
    };

    const writeParagraph = (text, indent = 0) => {
      ensureSpace(24);
      doc
        .font('Regular')
        .fontSize(preset.bodySize)
        .fillColor('#000000')
        .text(text, {
          indent,
          lineGap: preset.lineGap,
          paragraphGap: preset.paragraphGap,
          align: 'left',
        });
    };

    const writeLabeledLine = (label, value, indent = 0) => {
      ensureSpace(22);
      doc
        .font('Bold')
        .fontSize(preset.bodySize)
        .fillColor('#000000')
        .text(`${label}: `, {
          indent,
          continued: true,
          lineGap: preset.lineGap,
        })
        .font('Regular')
        .text(value, {
          lineGap: preset.lineGap,
          paragraphGap: preset.paragraphGap * 0.8,
        });
    };

    // Document Header (Plain & Clean: Title, Subject, Class, Board)
    doc
      .font('Bold')
      .fontSize(preset.titleSize)
      .fillColor('#000000')
      .text(topic.title, { lineGap: preset.lineGap });
    doc.moveDown(0.25);

    doc
      .font('Regular')
      .fontSize(preset.metaSize)
      .fillColor('#000000')
      .text(
        `Subject: ${topic.subject}   |   Level: ${topic.classLevel}   |   Curriculum: ${topic.board} Board`,
        { lineGap: preset.lineGap }
      );
    doc
      .font('Regular')
      .fontSize(preset.metaSize)
      .text('Prepared by: SHS Virtual Academy', { lineGap: preset.lineGap });
    doc.moveDown(0.6);

    // 1. Overview & Introduction
    writeHeading1('1. Topic Overview and Learning Objectives');
    for (const para of data.overview) {
      writeParagraph(para);
    }

    // 2. Core Concepts & Detailed Notes
    writeHeading1('2. Core Concepts and Detailed Revision Notes');
    data.sections.forEach((sec, idx) => {
      writeHeading2(`2.${idx + 1} ${sec.heading}`);
      writeParagraph(sec.explanation);
      if (Array.isArray(sec.keyPoints) && sec.keyPoints.length > 0) {
        ensureSpace(24);
        doc
          .font('Bold')
          .fontSize(preset.bodySize)
          .text('Key Points to Remember:', { lineGap: preset.lineGap });
        doc.moveDown(0.15);
        sec.keyPoints.forEach((pt, ptIdx) => {
          writeParagraph(`${ptIdx + 1}. ${pt}`, 12);
        });
      }
    });

    // 3. Key Formulas, Laws, Rules & Definitions
    writeHeading1('3. Key Definitions, Formulas, and Rules');
    data.keyFormulasOrDefinitions.forEach((item, idx) => {
      writeLabeledLine(`${idx + 1}. ${item.term}`, item.detail, 6);
    });

    // 4. Worked Examples
    writeHeading1('4. Step-by-Step Worked Examples');
    data.workedExamples.forEach((ex, idx) => {
      writeHeading2(`Example ${idx + 1}: ${ex.title}`);
      writeLabeledLine('Problem', ex.problem, 0);
      ensureSpace(20);
      doc
        .font('Bold')
        .fontSize(preset.bodySize)
        .text('Solution Steps:', { lineGap: preset.lineGap });
      doc.moveDown(0.15);
      ex.steps.forEach((stepText, sIdx) => {
        writeParagraph(`Step ${sIdx + 1}: ${stepText}`, 12);
      });
      writeLabeledLine('Final Answer', ex.finalAnswer, 0);
    });

    // 5. Common Mistakes to Avoid in Board Exams
    writeHeading1('5. Common Exam Mistakes to Avoid');
    data.commonMistakes.forEach((mistake, idx) => {
      writeParagraph(`${idx + 1}. ${mistake}`, 6);
    });

    // 6. Practice Questions and Answers
    writeHeading1('6. Practice Questions and Model Answers');
    data.practiceQuestions.forEach((pq, idx) => {
      writeHeading2(`Question ${idx + 1}`);
      writeParagraph(pq.question, 0);
      writeLabeledLine(`Answer ${idx + 1}`, pq.answer, 0);
    });

    // Stamp Page Numbers & Required Footer on every page
    const range = doc.bufferedPageRange();
    const totalPages = range.count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(range.start + i);
      const footerY = doc.page.height - preset.marginBottom + 6;
      const pageWidth = doc.page.width - preset.marginX * 2;

      doc
        .font('Regular')
        .fontSize(8.5)
        .fillColor('#000000')
        .text(
          `${REQUIRED_FOOTER_TEXT}   |   Page ${i + 1} of ${totalPages}`,
          preset.marginX,
          footerY,
          {
            width: pageWidth,
            align: 'center',
            lineBreak: false,
          }
        );
    }

    doc.end();
  });
}

const LAYOUT_PRESETS = [
  {
    name: 'standard',
    marginTop: 50,
    marginBottom: 54,
    marginX: 52,
    titleSize: 16,
    metaSize: 10,
    h1Size: 13,
    h2Size: 11.2,
    bodySize: 10.2,
    lineGap: 3.2,
    paragraphGap: 5.5,
    sectionGap: 0.65,
    subSectionGap: 0.45,
  },
  {
    name: 'expanded',
    marginTop: 56,
    marginBottom: 60,
    marginX: 58,
    titleSize: 17.5,
    metaSize: 10.5,
    h1Size: 14,
    h2Size: 12,
    bodySize: 11.2,
    lineGap: 5.0,
    paragraphGap: 8.5,
    sectionGap: 0.9,
    subSectionGap: 0.65,
  },
  {
    name: 'extra-expanded',
    marginTop: 62,
    marginBottom: 64,
    marginX: 62,
    titleSize: 18.5,
    metaSize: 11,
    h1Size: 15,
    h2Size: 12.8,
    bodySize: 12,
    lineGap: 6.5,
    paragraphGap: 10.5,
    sectionGap: 1.1,
    subSectionGap: 0.8,
  },
  {
    name: 'compact',
    marginTop: 42,
    marginBottom: 46,
    marginX: 44,
    titleSize: 14.5,
    metaSize: 9.2,
    h1Size: 11.8,
    h2Size: 10.4,
    bodySize: 9.2,
    lineGap: 1.8,
    paragraphGap: 3.5,
    sectionGap: 0.4,
    subSectionGap: 0.25,
  },
  {
    name: 'extra-compact',
    marginTop: 36,
    marginBottom: 42,
    marginX: 38,
    titleSize: 13.5,
    metaSize: 8.8,
    h1Size: 11,
    h2Size: 9.8,
    bodySize: 8.4,
    lineGap: 1.1,
    paragraphGap: 2.2,
    sectionGap: 0.3,
    subSectionGap: 0.2,
  },
];

function getTopicPdfFilePath(topic, outputDir) {
  const pdfDir = path.join(outputDir, 'pdf');
  fs.mkdirSync(pdfDir, { recursive: true });
  const safeSlug = sanitizeStorageFileName(
    `${String(topic.id).padStart(2, '0')}_${topic.classLevel}_${topic.subject}_${topic.title}_${topic.board}`
  ).slice(0, 110);
  return path.join(pdfDir, `${safeSlug}.pdf`);
}

async function step4BuildPdf(topic, data, outputDir) {
  const filePath = getTopicPdfFilePath(topic, outputDir);

  let chosenBuffer = await renderPdfBuffer(topic, data, LAYOUT_PRESETS[0]);
  let pdfProxy = await getDocumentProxy(new Uint8Array(chosenBuffer));
  let pages = pdfProxy.numPages;

  if (pages < 3) {
    for (const preset of [LAYOUT_PRESETS[1], LAYOUT_PRESETS[2]]) {
      chosenBuffer = await renderPdfBuffer(topic, data, preset);
      pdfProxy = await getDocumentProxy(new Uint8Array(chosenBuffer));
      pages = pdfProxy.numPages;
      if (pages >= 3 && pages <= 6) break;
    }
  } else if (pages > 6) {
    for (const preset of [LAYOUT_PRESETS[3], LAYOUT_PRESETS[4]]) {
      chosenBuffer = await renderPdfBuffer(topic, data, preset);
      pdfProxy = await getDocumentProxy(new Uint8Array(chosenBuffer));
      pages = pdfProxy.numPages;
      if (pages >= 3 && pages <= 6) break;
    }
  }

  fs.writeFileSync(filePath, chosenBuffer);
  return filePath;
}

// ============================================================================
// Step 5: CHECK THE PDF (Re-open from disk, extract text, verify 3-6 pages, footer, no garbled chars)
// ============================================================================

async function step5CheckPdf(filePath) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, reason: `PDF file does not exist at ${filePath}` };
  }

  const stat = fs.statSync(filePath);
  if (stat.size < 2048) {
    return { valid: false, reason: `PDF file is unexpectedly small (${stat.size} bytes)` };
  }

  const fileBytes = new Uint8Array(fs.readFileSync(filePath));
  const pdfDoc = await getDocumentProxy(fileBytes);
  const pageCount = pdfDoc.numPages;

  if (pageCount < 3 || pageCount > 6) {
    return {
      valid: false,
      pageCount,
      reason: `PDF page count is ${pageCount} (must be between 3 and 6 pages).`,
    };
  }

  const { text } = await extractText(pdfDoc, { mergePages: true });
  const extractedText = typeof text === 'string' ? text : (text || []).join('\n');

  if (!extractedText || extractedText.trim().length < 1200) {
    return {
      valid: false,
      pageCount,
      reason: `Extracted PDF text is too short (${extractedText?.length || 0} chars).`,
    };
  }

  if (!extractedText.includes('Generated with AI for revision. Please verify with your textbook.')) {
    return {
      valid: false,
      pageCount,
      reason: 'Required footer text was not found in the extracted PDF text.',
    };
  }

  if (!extractedText.includes('Practice Questions') || !extractedText.includes('Question 5')) {
    return {
      valid: false,
      pageCount,
      reason: 'Practice Questions section (Questions 1-5) missing in extracted PDF text.',
    };
  }

  if (extractedText.includes('\uFFFD')) {
    return {
      valid: false,
      pageCount,
      reason: 'Extracted PDF text contains garbled replacement characters (U+FFFD).',
    };
  }

  return {
    valid: true,
    pageCount,
    wordCount: countWords(extractedText),
    byteSize: stat.size,
  };
}

// ============================================================================
// Step 6: PUBLISH TO BOARDLY COMMONS (Named Database + Storage/Chunk Fallback)
// ============================================================================

let firebaseContextPromise = null;

async function initFirebaseAndLookupSuperAdmin(options) {
  if (firebaseContextPromise) return firebaseContextPromise;

  firebaseContextPromise = (async () => {
    const hasServiceAccount =
      process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      process.env.GOOGLE_APPLICATION_CREDENTIALS.trim() &&
      fs.existsSync(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS));

    if (hasServiceAccount && !options.useClientSdk) {
      const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));

      const app = getAdminApps().length
        ? getAdminApp()
        : initAdminApp({
            credential: adminCert(serviceAccount),
            projectId: serviceAccount.project_id || DEFAULT_PROJECT_ID,
            storageBucket: DEFAULT_STORAGE_BUCKET,
          });

      // Target the exact named Firestore database (`ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`)
      const db = getAdminFirestore(app, DEFAULT_DATABASE_ID);
      try {
        db.settings({ ignoreUndefinedProperties: true });
      } catch {
        // Ignore if settings already locked
      }

      const bucket = getAdminStorage(app).bucket(DEFAULT_STORAGE_BUCKET);

      let superAdminProfile = null;

      // 1. Check `publicProfiles` for SHS Virtual Academy / Super Admin
      const pubSnap = await db.collection('publicProfiles').limit(20).get();
      for (const docSnap of pubSnap.docs) {
        const d = docSnap.data();
        if (
          docSnap.id === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
          /shs virtual academy/i.test(d.displayName || d.name || '') ||
          /super.?admin/i.test(d.role || '')
        ) {
          superAdminProfile = {
            uid: docSnap.id,
            name: 'SHS Virtual Academy',
            avatar: d.avatar || d.equipped?.avatar || d.photoURL || null,
            frame: d.frame || d.equipped?.frame || null,
            equippedAvatar: d.equipped?.avatar || d.equippedAvatar || d.avatar || null,
            photoURL: d.photoURL || null,
            role: 'Super Admin',
            customRole: d.customRole || null,
          };
          break;
        }
      }

      // 2. Fallback: Check `users` collection
      if (!superAdminProfile) {
        for (const roleCandidate of ['Super Admin', 'superadmin', 'admin']) {
          const snap = await db
            .collection('users')
            .where('role', '==', roleCandidate)
            .limit(5)
            .get();
          if (!snap.empty) {
            const preferred =
              snap.docs.find(
                (d) =>
                  d.id === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
                  /shs virtual academy/i.test(d.data().displayName || d.data().name || '')
              ) || snap.docs[0];
            const data = preferred.data();
            superAdminProfile = {
              uid: preferred.id,
              name: 'SHS Virtual Academy',
              avatar: data.avatar || data.equipped?.avatar || data.photoURL || null,
              frame: data.frame || data.equipped?.frame || null,
              equippedAvatar: data.equipped?.avatar || data.equippedAvatar || null,
              photoURL: data.photoURL || null,
              role: 'Super Admin',
              customRole: data.customRole || null,
            };
            break;
          }
        }
      }

      // 3. Fallback: Firebase Auth lookup
      if (!superAdminProfile) {
        try {
          const userRecord = await getAdminAuth(app).getUserByEmail('admin@shsvirtual.org');
          superAdminProfile = {
            uid: userRecord.uid,
            name: 'SHS Virtual Academy',
            avatar: userRecord.photoURL || null,
            frame: null,
            equippedAvatar: null,
            photoURL: userRecord.photoURL || null,
            role: 'Super Admin',
            customRole: null,
          };
        } catch {
          // Ignore
        }
      }

      if (!superAdminProfile || !superAdminProfile.uid) {
        throw new Error(
          'Could not find the SHS Virtual Academy Super Admin account in Firestore (`publicProfiles`, `users`) or Firebase Auth.'
        );
      }

      return {
        mode: 'admin',
        app,
        db,
        bucket,
        superAdminProfile,
        authUid: superAdminProfile.uid,
      };
    } else {
      // Client SDK driver targeting the exact named database (`ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`)
      const clientApp = getClientApps().length
        ? getClientApp()
        : initClientApp({
            apiKey: APPLET_CONFIG.apiKey,
            authDomain: APPLET_CONFIG.authDomain,
            projectId: DEFAULT_PROJECT_ID,
            storageBucket: DEFAULT_STORAGE_BUCKET,
            messagingSenderId: APPLET_CONFIG.messagingSenderId,
            appId: APPLET_CONFIG.appId,
          });

      const auth = getClientAuth(clientApp);
      const db = getClientFirestore(clientApp, DEFAULT_DATABASE_ID);

      const publisherEmail = process.env.FIREBASE_PUBLISHER_EMAIL || 'inspector.dev@boardly.test';
      const publisherPassword = process.env.FIREBASE_PUBLISHER_PASSWORD || 'InspectorPassword123!';
      const cred = await signInWithEmailAndPassword(auth, publisherEmail, publisherPassword);
      const authUid = cred.user.uid;

      // Dynamically look up the real SHS Virtual Academy Super Admin profile in `publicProfiles`
      let superAdminProfile = null;
      const pubSnap = await clientGetDocs(
        clientQuery(clientCollection(db, 'publicProfiles'), clientLimit(20))
      );
      for (const docSnap of pubSnap.docs) {
        const d = docSnap.data();
        if (
          docSnap.id === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
          /shs virtual academy/i.test(d.displayName || d.name || '') ||
          /super.?admin/i.test(d.role || '')
        ) {
          superAdminProfile = {
            uid: docSnap.id,
            name: 'SHS Virtual Academy',
            avatar: d.avatar || d.equipped?.avatar || d.photoURL || null,
            frame: d.frame || d.equipped?.frame || null,
            equippedAvatar: d.equipped?.avatar || d.equippedAvatar || d.avatar || null,
            photoURL: d.photoURL || null,
            role: 'Super Admin',
            customRole: d.customRole || null,
          };
          break;
        }
      }

      if (!superAdminProfile || !superAdminProfile.uid) {
        throw new Error(
          'Could not find the SHS Virtual Academy Super Admin profile in `publicProfiles`.'
        );
      }

      return {
        mode: 'client',
        app: clientApp,
        db,
        bucket: null,
        superAdminProfile,
        authUid,
      };
    }
  })();

  return firebaseContextPromise;
}

/**
 * Builds the exact `commonsPosts` and `postsPrivate` payload matching
 * `createCommonsPost` in `src/services/commonsService.ts` and `firestore.rules`.
 * All generated study material posts are published ANONYMOUSLY (`isAnonymous: true`, `authorUid: null`, `authorName: 'Anonymous'`).
 */
function buildBoardlyPostPayloads({
  topic,
  generatedData,
  fileAttachment,
  superAdminProfile,
  createdAtDate,
  isDryRun,
  mode,
  postId,
  authUid,
}) {
  const title = `${topic.title} — ${topic.classLevel} (${topic.board} Board)`.slice(0, 200).trim();
  const description =
    topic.format === 'pdf'
      ? generatedData.teacherDescription.trim()
      : generatedData.body.trim();

  const rawTags = Array.isArray(generatedData.tags) ? generatedData.tags : [];
  const boardTags =
    topic.board.toLowerCase() === 'federal'
      ? ['federal', 'fbise']
      : [topic.board.toLowerCase()];

  const normalizedTags = Array.from(
    new Set([
      ...rawTags.map((t) => String(t).toLowerCase().trim()).filter(Boolean),
      topic.subject.toLowerCase().replace(/\s+/g, '-'),
      ...boardTags,
      topic.classLevel.toLowerCase().replace(/\s+/g, '-'),
    ])
  ).slice(0, 8);

  const target = `${topic.classLevel} · ${topic.board} Board`;
  const authorName = 'Anonymous';

  const searchKeywords = generateSearchKeywords(
    title,
    topic.subject,
    topic.title,
    normalizedTags,
    authorName,
    topic.classLevel,
    topic.board
  );

  const timestampValue = isDryRun
    ? createdAtDate.toISOString()
    : mode === 'client'
      ? ClientTimestamp.fromDate(createdAtDate)
      : AdminTimestamp.fromDate(createdAtDate);

  const commonsPostDoc = {
    type: 'notes',
    title,
    description,
    subject: topic.subject,
    chapter: topic.title,
    target,
    classLevel: topic.classLevel,
    board: topic.board,
    tags: normalizedTags,
    files: fileAttachment ? [fileAttachment] : [],
    isAnonymous: true,
    authorUid: null,
    authorName: 'Anonymous',
    authorAvatar: null,
    authorFrame: null,
    authorEquippedAvatar: null,
    authorPhotoURL: null,
    authorRole: null,
    authorCustomRole: null,
    upvotes: 0,
    downvotes: 0,
    views: 0,
    commentCount: 0,
    saveCount: 0,
    savesCount: 0,
    reportCount: 0,
    isHidden: false,
    isPinned: false,
    isFeatured: false,
    searchKeywords,
    createdAt: timestampValue,
    updatedAt: timestampValue,
  };

  const postsPrivateDoc = {
    postId: postId || `commons_anon_topic_${String(topic.id).padStart(2, '0')}`,
    authorUid: authUid || superAdminProfile.uid,
    realAuthorUid: authUid || superAdminProfile.uid,
    authorName: 'Anonymous',
    isAnonymous: true,
    createdAt: timestampValue,
    updatedAt: timestampValue,
  };

  return { commonsPostDoc, postsPrivateDoc };
}

/**
 * Validates that a constructed `commonsPosts` object satisfies every single
 * field and type rule in `firestore.rules` (`isValidCommonsPostCreate`), `src/types/commons.ts`,
 * anonymous attribution (`isAnonymous: true`, `authorUid: null`, `authorName: 'Anonymous'`),
 * and KaTeX mathematical formatting (`$...$` / `$$...$$`).
 */
function assertValidBoardlySchema(commonsPostDoc, postsPrivateDoc, format) {
  const requiredFields = [
    'type',
    'title',
    'description',
    'subject',
    'chapter',
    'target',
    'classLevel',
    'board',
    'tags',
    'files',
    'isAnonymous',
    'authorUid',
    'authorName',
    'authorAvatar',
    'authorFrame',
    'authorEquippedAvatar',
    'authorPhotoURL',
    'authorRole',
    'authorCustomRole',
    'upvotes',
    'downvotes',
    'views',
    'commentCount',
    'saveCount',
    'savesCount',
    'reportCount',
    'isHidden',
    'isPinned',
    'isFeatured',
    'searchKeywords',
    'createdAt',
    'updatedAt',
  ];

  for (const field of requiredFields) {
    if (!(field in commonsPostDoc)) {
      throw new Error(`Schema validation failed: missing field "${field}" on commonsPosts doc.`);
    }
  }

  if (commonsPostDoc.type !== 'notes') {
    throw new Error(`Invalid type: ${commonsPostDoc.type}`);
  }
  if (
    typeof commonsPostDoc.title !== 'string' ||
    commonsPostDoc.title.length < 1 ||
    commonsPostDoc.title.length > 200
  ) {
    throw new Error(`Invalid title length: ${commonsPostDoc.title?.length}`);
  }
  if (
    typeof commonsPostDoc.description !== 'string' ||
    commonsPostDoc.description.length < 1 ||
    commonsPostDoc.description.length > 20000
  ) {
    throw new Error(`Invalid description length: ${commonsPostDoc.description?.length}`);
  }

  const katexCheck = validateKatexInText(commonsPostDoc.description);
  if (!katexCheck.ok) {
    throw new Error(`KaTeX validation failed on post description: ${katexCheck.reason}`);
  }

  if (!Array.isArray(commonsPostDoc.tags) || commonsPostDoc.tags.length > 15) {
    throw new Error('Invalid tags array');
  }
  if (
    !Array.isArray(commonsPostDoc.searchKeywords) ||
    commonsPostDoc.searchKeywords.length === 0 ||
    commonsPostDoc.searchKeywords.length > 80
  ) {
    throw new Error(`Invalid searchKeywords length: ${commonsPostDoc.searchKeywords?.length}`);
  }
  if (commonsPostDoc.isAnonymous !== true) {
    throw new Error('isAnonymous must be true for anonymous study material posts.');
  }
  if (commonsPostDoc.authorUid !== null) {
    throw new Error(`authorUid must be null for anonymous posts, got: ${commonsPostDoc.authorUid}`);
  }
  if (commonsPostDoc.authorName !== 'Anonymous') {
    throw new Error(`Unexpected authorName: ${commonsPostDoc.authorName}`);
  }
  if (commonsPostDoc.authorRole !== null) {
    throw new Error(`Unexpected authorRole for anonymous post: ${commonsPostDoc.authorRole}`);
  }

  for (const zeroCounter of [
    'upvotes',
    'downvotes',
    'views',
    'commentCount',
    'saveCount',
    'savesCount',
    'reportCount',
  ]) {
    if (commonsPostDoc[zeroCounter] !== 0) {
      throw new Error(`Counter ${zeroCounter} must be initialized to 0.`);
    }
  }

  if (format === 'pdf') {
    if (!Array.isArray(commonsPostDoc.files) || commonsPostDoc.files.length !== 1) {
      throw new Error('PDF post must have exactly 1 file attachment in files[].');
    }
    const f = commonsPostDoc.files[0];
    if (
      !f.name ||
      typeof f.size !== 'number' ||
      f.type !== 'application/pdf' ||
      !f.url ||
      !f.storagePath ||
      !f.storagePath.startsWith('commons/')
    ) {
      throw new Error(`Invalid file attachment metadata: ${JSON.stringify(f)}`);
    }
  } else {
    if (!Array.isArray(commonsPostDoc.files) || commonsPostDoc.files.length !== 0) {
      throw new Error('Text-only post must have an empty files[] array.');
    }
  }

  if (!postsPrivateDoc || postsPrivateDoc.isAnonymous !== true) {
    throw new Error('postsPrivate.isAnonymous must be true.');
  }
}

/**
 * Uploads a PDF attachment using Firebase Storage when provisioned, or falls back cleanly
 * to Boardly's native Firestore Chunked Blob Storage (`commonsPosts/att_<fileId>_<chunkIndex>`)
 * matching `uploadViaFirestoreChunks` in `src/services/commonsUploadService.ts`.
 */
async function uploadPdfAttachment({
  ctx,
  pdfFilePath,
  readableFileName,
  storagePath,
  topicId,
  timestampValue,
}) {
  const fileBuffer = fs.readFileSync(pdfFilePath);
  const byteSize = fileBuffer.length;

  // 1. Try Firebase Storage first if Admin SDK bucket is available
  if (ctx.mode === 'admin' && ctx.bucket) {
    try {
      const downloadToken = crypto.randomUUID();
      const uploadedFileRef = ctx.bucket.file(storagePath);
      await uploadedFileRef.save(fileBuffer, {
        resumable: false,
        contentType: 'application/pdf',
        metadata: {
          contentType: 'application/pdf',
          contentDisposition: `inline; filename="${readableFileName}"`,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            originalFileName: readableFileName,
            topicId: String(topicId),
          },
        },
      });

      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${ctx.bucket.name}/o/${encodeURIComponent(
        storagePath
      )}?alt=media&token=${downloadToken}`;

      return {
        attachment: {
          name: readableFileName,
          size: byteSize,
          type: 'application/pdf',
          url: downloadUrl,
          storagePath,
        },
        cleanup: async () => {
          try {
            await uploadedFileRef.delete();
          } catch {
            // Ignore cleanup error
          }
        },
      };
    } catch (storageErr) {
      // Bucket not provisioned (404) or Storage unavailable -> fall through to Firestore chunk storage
      console.warn(
        `  [Storage Notice] Cloud Storage bucket returned (${storageErr.code || storageErr.message}). Using Boardly Firestore Chunk Storage...`
      );
    }
  }

  // 2. Boardly Firestore Chunk Storage (`commonsPosts/att_<fileId>_<chunkIndex>`)
  // Matches `uploadViaFirestoreChunks` in `src/services/commonsUploadService.ts`
  const base64Full = fileBuffer.toString('base64');
  const CHUNK_CHAR_SIZE = 700 * 1024;
  const totalChunks = Math.max(1, Math.ceil(base64Full.length / CHUNK_CHAR_SIZE));
  const fileId = `topic${topicId}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const uploadedChunkIds = [];

  for (let i = 0; i < totalChunks; i++) {
    const slice = base64Full.slice(i * CHUNK_CHAR_SIZE, (i + 1) * CHUNK_CHAR_SIZE);
    const chunkDocId = `att_${fileId}_${i}`;

    // NOTE: Must NOT include `createdAt` so `orderBy('createdAt', 'desc')` feed queries never return chunk docs!
    const chunkPayload = {
      type: 'attachment_chunk',
      isAttachmentChunk: true,
      title: readableFileName.slice(0, 120),
      description: slice,
      data: slice,
      fileId,
      chunkIndex: i,
      totalChunks,
      fileName: readableFileName,
      mimeType: 'application/pdf',
      fileSize: byteSize,
      isAnonymous: true,
      authorUid: null,
      authorName: 'Attachment Storage',
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      views: 0,
      reportCount: 0,
      isHidden: true,
      chunkCreatedAt: timestampValue,
    };

    const chunkPrivatePayload = {
      postId: chunkDocId,
      authorUid: ctx.authUid,
      realAuthorUid: ctx.authUid,
      isAttachmentChunk: true,
      createdAt: timestampValue,
    };

    if (ctx.mode === 'admin') {
      const batch = ctx.db.batch();
      batch.set(ctx.db.collection('commonsPosts').doc(chunkDocId), chunkPayload);
      batch.set(ctx.db.collection('postsPrivate').doc(chunkDocId), chunkPrivatePayload);
      await batch.commit();
    } else {
      await clientSetDoc(clientDoc(ctx.db, 'commonsPosts', chunkDocId), chunkPayload);
      await clientSetDoc(clientDoc(ctx.db, 'postsPrivate', chunkDocId), chunkPrivatePayload);
    }

    uploadedChunkIds.push(chunkDocId);
  }

  const encodedName = encodeURIComponent(readableFileName);
  const encodedMime = encodeURIComponent('application/pdf');
  const firestoreUrl = `firestore://att_${fileId}/${totalChunks}/${encodedMime}/${encodedName}`;

  return {
    attachment: {
      name: readableFileName,
      size: byteSize,
      type: 'application/pdf',
      url: firestoreUrl,
      storagePath,
      fallbackId: `att_${fileId}`,
      totalChunks,
    },
    cleanup: async () => {
      for (const chunkDocId of uploadedChunkIds) {
        try {
          if (ctx.mode === 'admin') {
            await ctx.db.collection('commonsPosts').doc(chunkDocId).delete();
            await ctx.db.collection('postsPrivate').doc(chunkDocId).delete();
          } else {
            await clientDeleteDoc(clientDoc(ctx.db, 'commonsPosts', chunkDocId));
            await clientDeleteDoc(clientDoc(ctx.db, 'postsPrivate', chunkDocId));
          }
        } catch {
          // Ignore
        }
      }
    },
  };
}

async function step6PublishTopic({
  topic,
  generatedData,
  pdfFilePath,
  createdAtDate,
  options,
  existingPostId,
  existingAttachmentUrl,
  existingStoragePath,
}) {
  const readableFileName = sanitizeReadableFileName(
    `${topic.classLevel} ${topic.subject} - ${topic.title} (${topic.board} Board).pdf`
  );
  const uniquePrefix = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const sanitizedStorageName = sanitizeStorageFileName(readableFileName);

  if (options.dryRun) {
    const dryRunAuthor = {
      uid: 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
      name: 'Anonymous',
      avatar: null,
      frame: null,
      equippedAvatar: null,
      photoURL: null,
      role: null,
      customRole: null,
    };

    let fileAttachment = null;
    if (topic.format === 'pdf') {
      const stat = fs.statSync(pdfFilePath);
      const storagePath = `commons/${dryRunAuthor.uid}/${uniquePrefix}_${sanitizedStorageName}`;
      fileAttachment = {
        name: readableFileName,
        size: stat.size,
        type: 'application/pdf',
        url: `https://firebasestorage.googleapis.com/v0/b/${DEFAULT_STORAGE_BUCKET}/o/${encodeURIComponent(storagePath)}?alt=media`,
        storagePath,
      };
    }

    const { commonsPostDoc, postsPrivateDoc } = buildBoardlyPostPayloads({
      topic,
      generatedData,
      fileAttachment,
      superAdminProfile: dryRunAuthor,
      createdAtDate,
      isDryRun: true,
      mode: 'dry-run',
      postId: `dry_run_post_${topic.id}`,
      authUid: dryRunAuthor.uid,
    });

    assertValidBoardlySchema(commonsPostDoc, postsPrivateDoc, topic.format);

    const postsDir = path.join(options.outputDir, 'posts');
    fs.mkdirSync(postsDir, { recursive: true });
    const postJsonPath = path.join(
      postsDir,
      `${String(topic.id).padStart(2, '0')}_post.json`
    );
    fs.writeFileSync(
      postJsonPath,
      JSON.stringify({ commonsPostDoc, postsPrivateDoc }, null, 2),
      'utf8'
    );

    return {
      postId: `dry_run_post_${topic.id}`,
      storagePath: fileAttachment ? fileAttachment.storagePath : null,
      postJsonPath,
    };
  }

  // Live publish to Firestore (`ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712`)
  const ctx = await initFirebaseAndLookupSuperAdmin(options);
  let cleanupAttachment = null;
  let fileAttachment = null;

  let targetPostId = `commons_anon_topic_${String(topic.id).padStart(2, '0')}`;

  try {
    const timestampValue =
      ctx.mode === 'client'
        ? ClientTimestamp.fromDate(createdAtDate)
        : AdminTimestamp.fromDate(createdAtDate);

    if (topic.format === 'pdf') {
      const stat = fs.statSync(pdfFilePath);
      if (existingAttachmentUrl && existingStoragePath) {
        const match = existingAttachmentUrl.match(/^firestore:\/\/([^/]+)\/(\d+)\//);
        fileAttachment = {
          name: readableFileName,
          size: stat.size,
          type: 'application/pdf',
          url: existingAttachmentUrl,
          storagePath: existingStoragePath,
          ...(match ? { fallbackId: match[1], totalChunks: Number(match[2]) } : {}),
        };
      } else {
        const storagePath = `commons/${ctx.authUid}/${uniquePrefix}_${sanitizedStorageName}`;
        const uploadRes = await uploadPdfAttachment({
          ctx,
          pdfFilePath,
          readableFileName,
          storagePath,
          topicId: topic.id,
          timestampValue,
        });
        fileAttachment = uploadRes.attachment;
        cleanupAttachment = uploadRes.cleanup;
      }
    }

    // Hide any legacy non-anonymous post (`commons_topic_XX`) so there are zero duplicates in the feed
    const legacyPostId = `commons_topic_${String(topic.id).padStart(2, '0')}`;
    const idsToHide = new Set();
    if (legacyPostId !== targetPostId) idsToHide.add(legacyPostId);
    if (existingPostId && existingPostId !== targetPostId && !existingPostId.startsWith('dry_run_')) {
      idsToHide.add(existingPostId);
    }

    for (const oldId of idsToHide) {
      try {
        if (ctx.mode === 'admin') {
          await ctx.db.collection('commonsPosts').doc(oldId).update({
            reportCount: 3,
            isHidden: true,
          });
        } else {
          const oldRef = clientDoc(ctx.db, 'commonsPosts', oldId);
          const oldSnap = await clientGetDoc(oldRef);
          if (oldSnap.exists() && oldSnap.data().isHidden !== true) {
            await clientUpdateDoc(oldRef, {
              reportCount: 3,
              isHidden: true,
            });
          }
        }
      } catch {
        // Ignore if old doc doesn't exist
      }
    }

    if (ctx.mode === 'client') {
      const checkRef = clientDoc(ctx.db, 'commonsPosts', targetPostId);
      const checkSnap = await clientGetDoc(checkRef);
      if (checkSnap.exists()) {
        // Hide old targetPostId and rotate to a clean anonymous document ID if needed
        try {
          await clientUpdateDoc(checkRef, { reportCount: 3, isHidden: true });
        } catch {
          // Ignore
        }
        targetPostId = `commons_anon_topic_${String(topic.id).padStart(2, '0')}_${Date.now().toString(36)}`;
      }
    }

    const { commonsPostDoc, postsPrivateDoc } = buildBoardlyPostPayloads({
      topic,
      generatedData,
      fileAttachment,
      superAdminProfile: ctx.superAdminProfile,
      createdAtDate,
      isDryRun: false,
      mode: ctx.mode,
      postId: targetPostId,
      authUid: ctx.authUid,
    });

    assertValidBoardlySchema(commonsPostDoc, postsPrivateDoc, topic.format);

    if (ctx.mode === 'admin') {
      const postRef = ctx.db.collection('commonsPosts').doc(targetPostId);
      const privateRef = ctx.db.collection('postsPrivate').doc(targetPostId);
      const batch = ctx.db.batch();
      batch.set(postRef, commonsPostDoc, { merge: true });
      batch.set(privateRef, postsPrivateDoc, { merge: true });
      await batch.commit();
    } else {
      const postRef = clientDoc(ctx.db, 'commonsPosts', targetPostId);
      const privateRef = clientDoc(ctx.db, 'postsPrivate', targetPostId);
      await clientSetDoc(postRef, commonsPostDoc);
      try {
        await clientSetDoc(privateRef, postsPrivateDoc);
      } catch {
        // Ignore if private doc already exists
      }
    }

    // Also save the verified post payload JSON locally for inspection
    const postsDir = path.join(options.outputDir, 'posts');
    fs.mkdirSync(postsDir, { recursive: true });
    const postJsonPath = path.join(
      postsDir,
      `${String(topic.id).padStart(2, '0')}_post.json`
    );
    fs.writeFileSync(
      postJsonPath,
      JSON.stringify(
        {
          postId: targetPostId,
          projectId: DEFAULT_PROJECT_ID,
          databaseId: DEFAULT_DATABASE_ID,
          commonsPostDoc: {
            ...commonsPostDoc,
            createdAt: createdAtDate.toISOString(),
            updatedAt: createdAtDate.toISOString(),
          },
          postsPrivateDoc: {
            ...postsPrivateDoc,
            createdAt: createdAtDate.toISOString(),
            updatedAt: createdAtDate.toISOString(),
          },
        },
        null,
        2
      ),
      'utf8'
    );

    return {
      postId: targetPostId,
      storagePath: fileAttachment ? fileAttachment.storagePath : null,
      attachmentUrl: fileAttachment ? fileAttachment.url : null,
    };
  } catch (err) {
    if (cleanupAttachment) {
      await cleanupAttachment();
      console.warn(
        `  [Cleanup] Deleted orphaned attachment chunks/file for Topic #${topic.id} after Firestore error.`
      );
    }
    throw err;
  }
}

// ============================================================================
// Step 7: LOG AND RESUME + Timestamp Spreading Across Last 10 Days
// ============================================================================

function loadLog(logPath) {
  if (!fs.existsSync(logPath)) {
    return { updatedAt: new Date().toISOString(), items: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    return parsed && typeof parsed.items === 'object'
      ? parsed
      : { updatedAt: new Date().toISOString(), items: {} };
  } catch {
    return { updatedAt: new Date().toISOString(), items: {} };
  }
}

function saveLog(logPath, logState) {
  logState.updatedAt = new Date().toISOString();
  fs.writeFileSync(logPath, JSON.stringify(logState, null, 2), 'utf8');
}

/**
 * Interleaves topics across subjects and assigns timestamps spread across the last 10 days
 * so the Boardly Commons feed has a natural mix of subjects and dates rather than one subject block.
 */
function buildInterleavedSchedule(topics) {
  const bySubject = new Map();
  for (const t of topics) {
    if (!bySubject.has(t.subject)) bySubject.set(t.subject, []);
    bySubject.get(t.subject).push(t);
  }

  const interleaved = [];
  let added = true;
  while (added) {
    added = false;
    for (const [, list] of bySubject) {
      if (list.length > 0) {
        interleaved.push(list.shift());
        added = true;
      }
    }
  }

  const nowMs = Date.now();
  const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
  const total = Math.max(interleaved.length, 1);

  return interleaved.map((topic, index) => {
    const fraction = (index + 0.5) / total;
    const jitterMinutes = ((topic.id * 37) % 90) - 45;
    const timestampMs =
      nowMs - tenDaysMs + Math.floor(fraction * tenDaysMs) + jitterMinutes * 60 * 1000;
    const clampedMs = Math.min(nowMs - 60 * 1000, Math.max(nowMs - tenDaysMs, timestampMs));
    return {
      topic,
      createdAtDate: new Date(clampedMs),
    };
  });
}

// ============================================================================
// Step 8: MAIN PIPELINE & FINAL SUMMARY TABLE
// ============================================================================

async function main() {
  const options = parseArgs(process.argv.slice(2));
  validateEnvironment(options);

  const rawTopics = JSON.parse(fs.readFileSync(options.topicsPath, 'utf8'));
  if (!Array.isArray(rawTopics) || rawTopics.length === 0) {
    throw new Error(`No topics found in ${options.topicsPath}`);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const logState = loadLog(options.logPath);

  let scheduled = buildInterleavedSchedule(rawTopics);

  if (options.onlyIds) {
    scheduled = scheduled.filter((item) => options.onlyIds.has(item.topic.id));
  }

  const stats = {
    pdf: { generated: 0, published: 0, skipped: 0, failed: 0, retried: 0 },
    text: { generated: 0, published: 0, skipped: 0, failed: 0, retried: 0 },
  };

  console.log('================================================================================');
  console.log(
    `Boardly Commons Study Material Generator (${options.dryRun ? 'DRY-RUN MODE' : 'LIVE PUBLISH MODE'})`
  );
  console.log(`Project ID  : ${DEFAULT_PROJECT_ID}`);
  console.log(`Database ID : ${DEFAULT_DATABASE_ID}`);
  console.log(`Collection  : commonsPosts`);
  console.log(`Attribution : Anonymous (isAnonymous: true, authorUid: null) + KaTeX Verified`);
  console.log(`Topics file : ${options.topicsPath} (${scheduled.length} selected of ${rawTopics.length})`);
  console.log(`Log file    : ${options.logPath}`);
  console.log(`Concurrency : ${options.concurrency}`);
  console.log('================================================================================\n');

  if (!options.dryRun) {
    await initFirebaseAndLookupSuperAdmin(options);
  }

  // Filter queue according to resumability and --limit
  const pendingQueue = [];
  for (const item of scheduled) {
    const { topic } = item;
    const bucketKey = topic.format === 'pdf' ? 'pdf' : 'text';
    const existingEntry = logState.items[String(topic.id)];

    const isAlreadyDone = options.dryRun
      ? existingEntry?.status === 'published' || existingEntry?.status === 'dry_run_verified'
      : !options.repair &&
        existingEntry?.status === 'published' &&
        existingEntry?.isAnonymous === true &&
        existingEntry?.katexVerified === true;

    if (isAlreadyDone) {
      stats[bucketKey].skipped++;
      console.log(
        `[SKIP] Topic #${topic.id} (${topic.format.toUpperCase()}) "${topic.title}" — already ${existingEntry.status} (postId: ${existingEntry.postId})`
      );
      continue;
    }

    if (options.limit !== null && pendingQueue.length >= options.limit) {
      break;
    }
    pendingQueue.push(item);
  }

  let cursor = 0;

  async function processSingleItem({ topic, createdAtDate }) {
    const bucketKey = topic.format === 'pdf' ? 'pdf' : 'text';
    const existingEntry = logState.items[String(topic.id)];

    console.log(
      `\n[START] Topic #${topic.id} | ${topic.classLevel} (${topic.board}) | ${topic.subject} | ${topic.format.toUpperCase()} | "${topic.title}"`
    );

    const maxTopicTries = 3;
    let topicSucceeded = false;
    let topicRetries = 0;
    let lastTopicError = null;

    for (let tryNum = 1; tryNum <= maxTopicTries; tryNum++) {
      if (tryNum > 1) {
        topicRetries++;
        stats[bucketKey].retried++;
        console.log(`  [Retry ${tryNum}/${maxTopicTries}] Regenerating Topic #${topic.id}...`);
      }

      try {
        let checkedData = null;
        let pdfFilePath = null;
        let pdfCheckResult = null;

        // Check if we already have a verified PDF / post JSON on disk
        const existingPdfPath = getTopicPdfFilePath(topic, options.outputDir);
        const existingPostJsonPath = path.join(
          options.outputDir,
          'posts',
          `${String(topic.id).padStart(2, '0')}_post.json`
        );

        let reusedExistingArtifact = false;
        if (topic.format === 'pdf' && fs.existsSync(existingPdfPath)) {
          const check = await step5CheckPdf(existingPdfPath);
          if (check.valid) {
            pdfFilePath = existingPdfPath;
            pdfCheckResult = check;

            // Check if cached post JSON already has valid KaTeX description
            if (tryNum === 1 && fs.existsSync(existingPostJsonPath)) {
              try {
                const cachedJson = JSON.parse(fs.readFileSync(existingPostJsonPath, 'utf8'));
                const cachedDoc = cachedJson.commonsPostDoc;
                if (cachedDoc && cachedDoc.description && validateKatexInText(cachedDoc.description).ok) {
                  checkedData = {
                    teacherDescription: cachedDoc.description,
                    tags: cachedDoc.tags || [],
                  };
                  reusedExistingArtifact = true;
                  console.log(
                    `  -> Reusing verified PDF (${check.pageCount} pages) + KaTeX post description for Topic #${topic.id}.`
                  );
                }
              } catch {
                // Fall through to generate KaTeX description
              }
            }

            if (!reusedExistingArtifact) {
              console.log(
                `  -> Reusing verified PDF (${check.pageCount} pages, ${check.wordCount} words) & generating + fact-checking KaTeX post description with Gemini for Topic #${topic.id}...`
              );
              const descData = await generateAndFactCheckPdfDescriptionWithKatex(ai, topic);
              const katexRes = validateKatexInText(descData.teacherDescription);
              if (!katexRes.ok) {
                throw new Error(`KaTeX validation failed on generated PDF description: ${katexRes.reason}`);
              }
              checkedData = {
                teacherDescription: descData.teacherDescription,
                tags: descData.tags || [],
              };
              reusedExistingArtifact = true;
            }
          }
        } else if (topic.format === 'text' && tryNum === 1 && fs.existsSync(existingPostJsonPath)) {
          try {
            const cachedJson = JSON.parse(fs.readFileSync(existingPostJsonPath, 'utf8'));
            const cachedDoc = cachedJson.commonsPostDoc;
            if (cachedDoc && cachedDoc.description) {
              const wc = countWords(cachedDoc.description);
              const katexRes = validateKatexInText(cachedDoc.description);
              if (wc >= 150 && wc <= 300 && katexRes.ok) {
                checkedData = {
                  body: cachedDoc.description,
                  tags: cachedDoc.tags || [],
                };
                reusedExistingArtifact = true;
                console.log(
                  `  -> Reusing verified KaTeX text post artifact for Topic #${topic.id} (${wc} words, ${katexRes.count} KaTeX blocks).`
                );
              }
            }
          } catch {
            reusedExistingArtifact = false;
          }
        }

        if (!reusedExistingArtifact) {
          // Step 1: GENERATE
          console.log(`  -> [Topic #${topic.id}] Step 1: Generating ${topic.format.toUpperCase()} content with Gemini...`);
          const draftData = await step1Generate(ai, topic);

          // Step 2: VALIDATE (Draft check)
          const draftValidation = step2ValidateContent(topic, draftData);
          if (!draftValidation.valid) {
            throw new Error(`Step 2 Draft Validation failed: ${draftValidation.reason}`);
          }

          // Step 3: FACT-CHECK
          console.log(
            `  -> [Topic #${topic.id}] Step 3: Fact-checking formulas, KaTeX expressions & ${topic.board} Board alignment...`
          );
          checkedData = await step3FactCheck(ai, topic, draftData);

          // Re-validate after fact-check pass
          const finalValidation = step2ValidateContent(topic, checkedData);
          if (!finalValidation.valid) {
            throw new Error(`Step 2 Post-Fact-Check Validation failed: ${finalValidation.reason}`);
          }

          if (topic.format === 'pdf') {
            // Step 4: BUILD THE PDF
            console.log(`  -> [Topic #${topic.id}] Step 4: Building A4 PDF with embedded DejaVuSans Unicode font...`);
            pdfFilePath = await step4BuildPdf(topic, checkedData, options.outputDir);

            // Step 5: CHECK THE PDF
            console.log(`  -> [Topic #${topic.id}] Step 5: Extracting text & verifying PDF page count (3-6 pages)...`);
            pdfCheckResult = await step5CheckPdf(pdfFilePath);
            if (!pdfCheckResult.valid) {
              throw new Error(`Step 5 PDF Check failed: ${pdfCheckResult.reason}`);
            }
            console.log(
              `  -> [Topic #${topic.id}] Step 5 Passed: ${pdfCheckResult.pageCount} pages, ${pdfCheckResult.wordCount} words, ${pdfCheckResult.byteSize} bytes.`
            );
          } else {
            const wordCount = countWords(checkedData.body);
            const katexRes = validateKatexInText(checkedData.body);
            console.log(
              `  -> [Topic #${topic.id}] Step 2 & 3 Passed: Text post verified (${wordCount} words, ${katexRes.count} KaTeX blocks).`
            );
          }
        }

        stats[bucketKey].generated++;

        // Step 6: PUBLISH (or verify & write post payload in --dry-run)
        console.log(
          `  -> [Topic #${topic.id}] Step 6: ${options.dryRun ? 'Validating & writing dry-run Boardly post payload' : 'Publishing anonymously with KaTeX to Boardly Commons (Firestore)'}...`
        );
        const publishResult = await step6PublishTopic({
          topic,
          generatedData: checkedData,
          pdfFilePath,
          createdAtDate,
          options,
          existingPostId: existingEntry?.postId,
          existingAttachmentUrl: existingEntry?.attachmentUrl,
          existingStoragePath: existingEntry?.storagePath,
        });

        stats[bucketKey].published++;

        const descForCheck =
          topic.format === 'pdf' ? checkedData.teacherDescription : checkedData.body;
        const katexVerification = validateKatexInText(descForCheck);

        // Step 7: LOG AND RESUME
        const statusLabel = options.dryRun ? 'dry_run_verified' : 'published';
        logState.items[String(topic.id)] = {
          topicId: topic.id,
          title: topic.title,
          subject: topic.subject,
          classLevel: topic.classLevel,
          board: topic.board,
          format: topic.format,
          status: statusLabel,
          isAnonymous: true,
          authorName: 'Anonymous',
          authorUid: null,
          katexVerified: katexVerification.ok,
          katexExpressionCount: katexVerification.count || 0,
          filePath: pdfFilePath ? path.relative(PROJECT_ROOT, pdfFilePath) : null,
          pageCount: pdfCheckResult ? pdfCheckResult.pageCount : null,
          wordCount:
            topic.format === 'pdf'
              ? pdfCheckResult.wordCount
              : countWords(checkedData.body),
          postId: publishResult.postId,
          storagePath: publishResult.storagePath,
          attachmentUrl: publishResult.attachmentUrl || null,
          createdAtScheduled: createdAtDate.toISOString(),
          retries: topicRetries,
          updatedAt: new Date().toISOString(),
        };
        saveLog(options.logPath, logState);

        console.log(
          `  [SUCCESS] Topic #${topic.id} ${statusLabel} (postId: ${publishResult.postId} | isAnonymous: true | KaTeX expressions: ${katexVerification.count})`
        );
        topicSucceeded = true;
        break;
      } catch (err) {
        lastTopicError = err;
        console.warn(`  [Attempt ${tryNum}/${maxTopicTries} Failed] Topic #${topic.id}: ${err.message}`);
      }
    }

    if (!topicSucceeded) {
      stats[bucketKey].failed++;
      logState.items[String(topic.id)] = {
        topicId: topic.id,
        title: topic.title,
        subject: topic.subject,
        classLevel: topic.classLevel,
        board: topic.board,
        format: topic.format,
        status: 'failed',
        error: lastTopicError?.message || String(lastTopicError),
        retries: topicRetries,
        updatedAt: new Date().toISOString(),
      };
      saveLog(options.logPath, logState);
      console.error(`  [FAILED] Topic #${topic.id} failed after ${maxTopicTries} tries.`);
    }
  }

  async function worker() {
    while (cursor < pendingQueue.length) {
      const idx = cursor++;
      const item = pendingQueue[idx];
      if (!item) break;
      await processSingleItem(item);
    }
  }

  const workers = Array.from(
    { length: Math.min(options.concurrency, Math.max(pendingQueue.length, 1)) },
    () => worker()
  );
  await Promise.all(workers);

  // Step 8: SUMMARY
  console.log('\n================================================================================');
  console.log('FINAL EXECUTION SUMMARY');
  console.log('================================================================================');
  console.table({
    'PDF Materials (42 total)': {
      Generated: stats.pdf.generated,
      [options.dryRun ? 'Verified (Dry-Run)' : 'Published']: stats.pdf.published,
      Skipped: stats.pdf.skipped,
      Failed: stats.pdf.failed,
      Retried: stats.pdf.retried,
    },
    'Text Posts (8 total)': {
      Generated: stats.text.generated,
      [options.dryRun ? 'Verified (Dry-Run)' : 'Published']: stats.text.published,
      Skipped: stats.text.skipped,
      Failed: stats.text.failed,
      Retried: stats.text.retried,
    },
    TOTAL: {
      Generated: stats.pdf.generated + stats.text.generated,
      [options.dryRun ? 'Verified (Dry-Run)' : 'Published']:
        stats.pdf.published + stats.text.published,
      Skipped: stats.pdf.skipped + stats.text.skipped,
      Failed: stats.pdf.failed + stats.text.failed,
      Retried: stats.pdf.retried + stats.text.retried,
    },
  });

  if (stats.pdf.failed + stats.text.failed > 0) {
    process.exitCode = 1;
  }
  process.exit(process.exitCode || 0);
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err.message || err);
  process.exit(1);
});

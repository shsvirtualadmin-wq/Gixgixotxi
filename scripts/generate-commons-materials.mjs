#!/usr/bin/env node
/**
 * Boardly Commons Study Materials AI Generator & Publisher CLI
 *
 * Generates 50 curriculum-aligned study materials (42 real PDF files + 8 text-only posts)
 * at runtime using the Gemini API (Generate + Fact-Check passes) and publishes them to
 * Boardly Commons (Firebase Storage + Firestore).
 *
 * Strictly zero hardcoded study content: all educational material is generated live
 * from `topics.json` via the Gemini API.
 *
 * Required Environment Variables:
 *   - GEMINI_API_KEY
 *   - GOOGLE_APPLICATION_CREDENTIALS (required when publishing to Firebase; optional in --dry-run)
 *
 * Supported Flags:
 *   --dry-run            Generate, validate, fact-check, build & verify PDFs, and validate Firestore post payloads locally without writing to Firebase
 *   --only <id[,id...]>  Run only for specific topic ID(s), e.g. --only 1 or --only 1,4,11
 *   --limit <n>          Process at most <n> pending topics
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
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Boardly Firebase Configuration (matches src/lib/firebaseConfig.ts)
const DEFAULT_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'gen-lang-client-0365509316';
const DEFAULT_DATABASE_ID =
  process.env.FIREBASE_DATABASE_ID ||
  process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  process.env.VITE_FIREBASE_DATABASE_ID ||
  'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';
const DEFAULT_STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.VITE_FIREBASE_STORAGE_BUCKET ||
  'gen-lang-client-0365509316.firebasestorage.app';

const REQUIRED_FOOTER_TEXT =
  'Generated with AI for revision. Please verify with your textbook.';

// TrueType font paths (bundled in scripts/fonts for cross-platform Unicode rendering)
const FONT_REGULAR_PATH = path.join(__dirname, 'fonts', 'DejaVuSans.ttf');
const FONT_BOLD_PATH = path.join(__dirname, 'fonts', 'DejaVuSans-Bold.ttf');

// Model fallback chain (tries user override first, then fast/reliable Gemini models)
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
].filter(Boolean);

// ============================================================================
// CLI Argument Parser & Environment Checks
// ============================================================================

function parseArgs(argv) {
  const options = {
    dryRun: false,
    onlyIds: null,
    limit: null,
    topicsPath: path.join(PROJECT_ROOT, 'topics.json'),
    logPath: path.join(PROJECT_ROOT, 'log.json'),
    outputDir: path.join(PROJECT_ROOT, 'generated-materials'),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
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

  if (!options.dryRun) {
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

  if (!options.dryRun) {
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
 * Normalizes text so no markdown stars (*), decorative symbols, or replacement chars appear.
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
        'A short, warm 2-3 sentence summary in a helpful Pakistani high-school teacher voice introducing these revision notes for the post description.',
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
        '8 to 10 key formulas, laws, equations, grammar rules, or core definitions with plain-text notation (e.g., x^2, sqrt(x), v = u + at).',
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

const TEXT_POST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    body: {
      type: Type.STRING,
      description:
        'A plain-text revision post of strictly 165 to 260 words written in a warm, clear teacher voice (a revision tip, quick summary, or numbered checklist). No markdown stars (*), no hashtags (#), no tables.',
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 to 7 lowercase tags relevant to the topic.',
    },
  },
  required: ['body', 'tags'],
};

async function step1Generate(ai, topic) {
  if (topic.format === 'pdf') {
    const prompt = `You are a senior subject teacher at SHS Virtual Academy preparing an official revision study guide for ${topic.classLevel} (${topic.board} Board, Pakistan) in the subject ${topic.subject}.

Topic Title: "${topic.title}"
Subject: ${topic.subject}
Class Level: ${topic.classLevel}
Curriculum Board: ${topic.board} Board

Requirements:
1. Write in a clear, helpful, encouraging teacher voice tailored to ${topic.classLevel} ${topic.board} Board students.
2. Provide thorough, accurate, textbook-aligned explanations so the finished study guide fills 3 to 5 A4 pages comfortably (roughly 1,400 to 2,100 words total across all sections).
3. Include:
   - overview: 3 substantive paragraphs introducing the topic and its exam importance.
   - sections: 4 in-depth concept sections (each with a clear heading, a thorough 110-160 word explanation, and 4-5 key points).
   - keyFormulasOrDefinitions: 8 to 10 essential formulas, laws, rules, or definitions. Write all mathematical or chemical expressions in clean, readable plain text (for example: x^2, a/b, sqrt(b^2 - 4ac), v = u + a*t, 2H2 + O2 -> 2H2O, Delta H). Do NOT use LaTeX backslashes (like \\frac or \\sqrt) and do NOT use markdown asterisks (*).
   - workedExamples: 4 complete worked examples or solved board-style exercises with step-by-step workings and final answers.
   - practiceQuestions: 5 board-exam practice questions, each with a complete, clear model answer.
   - commonMistakes: 5 to 6 specific exam mistakes students often make on "${topic.title}" and how to avoid them.
4. Do NOT use asterisks (*), star symbols, or markdown tables anywhere in the text.`;

    return await callGeminiJson(
      ai,
      prompt,
      PDF_STUDY_GUIDE_SCHEMA,
      `Step 1 Generate PDF #${topic.id}`
    );
  } else {
    const prompt = `You are a senior subject teacher at SHS Virtual Academy writing a short, high-value revision post for Boardly Commons.

Topic Title: "${topic.title}"
Subject: ${topic.subject}
Class Level: ${topic.classLevel}
Curriculum Board: ${topic.board} Board

Requirements:
1. Write a plain-text revision note, exam tip, or numbered revision checklist in a warm, clear teacher voice.
2. Length MUST be strictly between 165 and 260 words (within the required 150 to 300 word window).
3. Format using plain paragraphs and simple numbered lines (1., 2., 3.) or dashes (- ).
4. Do NOT use asterisks (*), stars, hashtags (#), LaTeX backslashes, or markdown tables. Write any math or formulas in clean plain text (e.g., x^2, v = f * lambda).`;

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
    const cleanedBody = cleanPlainText(data.body || '');
    const words = countWords(cleanedBody);
    if (words < 150 || words > 300) {
      return {
        valid: false,
        reason: `Text post word count is ${words} words (must be between 150 and 300 words).`,
      };
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
3. Ensure all math and scientific notation is written in clean, readable plain text (e.g., x^2, sqrt(x), a/b, ->) with NO LaTeX backslashes and NO markdown asterisks (*).
4. Keep the structure comprehensive (4 concept sections, 8-10 key definitions/formulas, 4 worked examples, 5 practice questions with full answers, 5-6 common mistakes) so that it produces a 3 to 5 page PDF.

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

Review the following plain-text revision post for the topic "${topic.title}".
Your task:
1. Verify every definition, formula, example, or rule for accuracy at the ${topic.classLevel} (${topic.board} Board) level and fix any errors.
2. Ensure the body text is written in a clear, helpful teacher voice with plain headings/lines (no asterisks *, no hashtags #, no tables, no LaTeX backslashes).
3. Ensure the word count of "body" is strictly between 165 and 260 words (must be within 150 to 300 words). If it is shorter than 160 words or longer than 280 words, adjust the text so it falls cleanly around 200-230 words.

Draft JSON to fact-check and return in corrected form:
${JSON.stringify(draftData)}`;

    const checked = await callGeminiJson(
      ai,
      prompt,
      TEXT_POST_SCHEMA,
      `Step 3 Fact-Check Text #${topic.id}`
    );
    checked.body = cleanPlainText(checked.body);
    checked.tags = Array.isArray(checked.tags)
      ? checked.tags.map((t) => cleanPlainText(t).toLowerCase()).filter(Boolean).slice(0, 7)
      : [];
    return checked;
  }
}

function sanitizePdfData(data) {
  return {
    teacherDescription: cleanPlainText(data.teacherDescription),
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

/**
 * Renders the study guide into a PDF buffer with configurable typography presets
 * so that the resulting PDF is guaranteed to land cleanly between 3 and 6 pages.
 */
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
  // Standard balanced preset (targets ~4 pages)
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
  // Expanded spacing preset (if content was 2 pages, expands cleanly to 3-4 pages)
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
  // Extra-expanded preset (if still < 3 pages)
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
  // Compact preset (if > 6 pages, tightens cleanly into 4-5 pages)
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
  // Extra-compact preset (if still > 6 pages)
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

async function step4BuildPdf(topic, data, outputDir) {
  const pdfDir = path.join(outputDir, 'pdf');
  fs.mkdirSync(pdfDir, { recursive: true });

  const safeSlug = sanitizeStorageFileName(
    `${String(topic.id).padStart(2, '0')}_${topic.classLevel}_${topic.subject}_${topic.title}_${topic.board}`
  ).slice(0, 110);
  const filePath = path.join(pdfDir, `${safeSlug}.pdf`);

  // First try standard layout preset and inspect page count
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

async function step5CheckPdf(filePath, topic) {
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

  // Confirm required footer is present in extracted text
  if (!extractedText.includes('Generated with AI for revision. Please verify with your textbook.')) {
    return {
      valid: false,
      pageCount,
      reason: 'Required footer text was not found in the extracted PDF text.',
    };
  }

  // Confirm Practice Questions section is present
  if (!extractedText.includes('Practice Questions') || !extractedText.includes('Question 5')) {
    return {
      valid: false,
      pageCount,
      reason: 'Practice Questions section (Questions 1-5) missing in extracted PDF text.',
    };
  }

  // Confirm no Unicode replacement character (\uFFFD) or garbled control characters
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
// Step 6: PUBLISH TO BOARDLY COMMONS (Storage + Firestore, Atomic Cleanup)
// ============================================================================

let firebaseContext = null;

async function initFirebaseAndLookupSuperAdmin() {
  if (firebaseContext) return firebaseContext;

  const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));

  const app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || DEFAULT_PROJECT_ID,
        storageBucket: DEFAULT_STORAGE_BUCKET,
      });

  const db = admin.firestore(app);
  // Configure named database if supported by firebase-admin Firestore instance
  if (typeof db.settings === 'function' && DEFAULT_DATABASE_ID && DEFAULT_DATABASE_ID !== '(default)') {
    try {
      db.settings({ databaseId: DEFAULT_DATABASE_ID, ignoreUndefinedProperties: true });
    } catch {
      // Settings already locked on instance
    }
  }

  const bucket = admin.storage(app).bucket(DEFAULT_STORAGE_BUCKET);

  // Dynamically resolve the SHS Virtual Academy Super Admin account at runtime
  let superAdminProfile = null;

  // 1. Check `users` collection for role in ['Super Admin', 'superadmin', 'admin'] or email == 'shsvirtualadmin@gmail.com'
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
            d.data().email === 'shsvirtualadmin@gmail.com' ||
            /shs virtual academy/i.test(d.data().name || d.data().displayName || '')
        ) || snap.docs[0];
      const data = preferred.data();
      superAdminProfile = {
        uid: preferred.id,
        name: 'SHS Virtual Academy',
        avatar: data.avatar || data.photoURL || null,
        frame: data.frame || data.equippedFrame || null,
        equippedAvatar: data.equippedAvatar || null,
        photoURL: data.photoURL || null,
        role: 'Super Admin',
        customRole: data.customRole || null,
      };
      break;
    }
  }

  // 2. Fallback: look up in `publicProfiles`
  if (!superAdminProfile) {
    for (const roleCandidate of ['Super Admin', 'superadmin', 'admin']) {
      const snap = await db
        .collection('publicProfiles')
        .where('role', '==', roleCandidate)
        .limit(5)
        .get();
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        superAdminProfile = {
          uid: docSnap.id,
          name: 'SHS Virtual Academy',
          avatar: data.avatar || data.photoURL || null,
          frame: data.frame || data.equippedFrame || null,
          equippedAvatar: data.equippedAvatar || null,
          photoURL: data.photoURL || null,
          role: 'Super Admin',
          customRole: data.customRole || null,
        };
        break;
      }
    }
  }

  // 3. Fallback: look up in `admins` collection
  if (!superAdminProfile) {
    const adminsSnap = await db.collection('admins').limit(1).get();
    if (!adminsSnap.empty) {
      const adminUid = adminsSnap.docs[0].id;
      const userSnap = await db.collection('users').doc(adminUid).get();
      const data = userSnap.exists ? userSnap.data() : {};
      superAdminProfile = {
        uid: adminUid,
        name: 'SHS Virtual Academy',
        avatar: data?.avatar || data?.photoURL || null,
        frame: data?.frame || null,
        equippedAvatar: data?.equippedAvatar || null,
        photoURL: data?.photoURL || null,
        role: 'Super Admin',
        customRole: data?.customRole || null,
      };
    }
  }

  // 4. Fallback: Firebase Auth lookup by Super Admin email ('shsvirtualadmin@gmail.com')
  if (!superAdminProfile) {
    try {
      const userRecord = await admin.auth(app).getUserByEmail('shsvirtualadmin@gmail.com');
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
      // Ignore if auth user not found by email
    }
  }

  if (!superAdminProfile || !superAdminProfile.uid) {
    throw new Error(
      'Could not find the SHS Virtual Academy Super Admin account in Firestore (`users`, `publicProfiles`, `admins`) or Firebase Auth. Refusing to create fake users.'
    );
  }

  firebaseContext = { app, db, bucket, superAdminProfile };
  return firebaseContext;
}

/**
 * Builds the exact `commonsPosts` and `postsPrivate` payload matching
 * `createCommonsPost` in `src/services/commonsService.ts` and `firestore.rules`.
 */
function buildBoardlyPostPayloads({
  topic,
  generatedData,
  fileAttachment,
  superAdminProfile,
  createdAtDate,
  isDryRun,
}) {
  const title = `${topic.title} — ${topic.classLevel} (${topic.board} Board)`.slice(0, 200).trim();
  const description =
    topic.format === 'pdf'
      ? generatedData.teacherDescription.trim()
      : generatedData.body.trim();

  const rawTags = Array.isArray(generatedData.tags) ? generatedData.tags : [];
  const normalizedTags = Array.from(
    new Set([
      ...rawTags.map((t) => String(t).toLowerCase().trim()).filter(Boolean),
      topic.subject.toLowerCase().replace(/\s+/g, '-'),
      topic.board.toLowerCase(),
      topic.classLevel.toLowerCase().replace(/\s+/g, '-'),
    ])
  ).slice(0, 8);

  const target = `${topic.classLevel} · ${topic.board} Board`;
  const authorName = 'SHS Virtual Academy';

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
    : admin.firestore.Timestamp.fromDate(createdAtDate);

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
    isAnonymous: false,
    authorUid: superAdminProfile.uid,
    authorName,
    authorAvatar: superAdminProfile.avatar ?? null,
    authorFrame: superAdminProfile.frame ?? null,
    authorEquippedAvatar: superAdminProfile.equippedAvatar ?? null,
    authorPhotoURL: superAdminProfile.photoURL ?? null,
    authorRole: 'Super Admin',
    authorCustomRole: superAdminProfile.customRole ?? null,
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
    realAuthorUid: superAdminProfile.uid,
    createdAt: timestampValue,
    updatedAt: timestampValue,
  };

  return { commonsPostDoc, postsPrivateDoc };
}

/**
 * Validates that a constructed `commonsPosts` object satisfies every single
 * field and type rule in `firestore.rules` (`isValidCommonsPostCreate`) and `src/types/commons.ts`.
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
  if (commonsPostDoc.isAnonymous !== false) {
    throw new Error('isAnonymous must be false for SHS Virtual Academy posts.');
  }
  if (commonsPostDoc.authorName !== 'SHS Virtual Academy') {
    throw new Error(`Unexpected authorName: ${commonsPostDoc.authorName}`);
  }
  if (commonsPostDoc.authorRole !== 'Super Admin') {
    throw new Error(`Unexpected authorRole: ${commonsPostDoc.authorRole}`);
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
      !f.storagePath.startsWith(`commons/${commonsPostDoc.authorUid}/`)
    ) {
      throw new Error(`Invalid file attachment metadata: ${JSON.stringify(f)}`);
    }
  } else {
    if (!Array.isArray(commonsPostDoc.files) || commonsPostDoc.files.length !== 0) {
      throw new Error('Text-only post must have an empty files[] array.');
    }
  }

  if (!postsPrivateDoc || postsPrivateDoc.realAuthorUid !== commonsPostDoc.authorUid) {
    throw new Error('postsPrivate.realAuthorUid must match commonsPosts.authorUid.');
  }
}

async function step6PublishTopic({
  topic,
  generatedData,
  pdfFilePath,
  createdAtDate,
  options,
}) {
  const readableFileName = sanitizeReadableFileName(
    `${topic.classLevel} ${topic.subject} - ${topic.title} (${topic.board} Board).pdf`
  );
  const uniquePrefix = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const sanitizedStorageName = sanitizeStorageFileName(readableFileName);

  if (options.dryRun) {
    const dryRunAuthor = {
      uid: 'DRY_RUN_SUPER_ADMIN_UID',
      name: 'SHS Virtual Academy',
      avatar: null,
      frame: null,
      equippedAvatar: null,
      photoURL: null,
      role: 'Super Admin',
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

  // Live publish to Firebase Storage + Firestore
  const { db, bucket, superAdminProfile } = await initFirebaseAndLookupSuperAdmin();
  let uploadedFileRef = null;
  let fileAttachment = null;

  try {
    if (topic.format === 'pdf') {
      const stat = fs.statSync(pdfFilePath);
      const storagePath = `commons/${superAdminProfile.uid}/${uniquePrefix}_${sanitizedStorageName}`;
      const downloadToken = crypto.randomUUID();

      uploadedFileRef = bucket.file(storagePath);
      await uploadedFileRef.save(fs.readFileSync(pdfFilePath), {
        resumable: false,
        contentType: 'application/pdf',
        metadata: {
          contentType: 'application/pdf',
          contentDisposition: `inline; filename="${readableFileName}"`,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            originalFileName: readableFileName,
            topicId: String(topic.id),
          },
        },
      });

      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        storagePath
      )}?alt=media&token=${downloadToken}`;

      fileAttachment = {
        name: readableFileName,
        size: stat.size,
        type: 'application/pdf',
        url: downloadUrl,
        storagePath,
      };
    }

    const { commonsPostDoc, postsPrivateDoc } = buildBoardlyPostPayloads({
      topic,
      generatedData,
      fileAttachment,
      superAdminProfile,
      createdAtDate,
      isDryRun: false,
    });

    assertValidBoardlySchema(commonsPostDoc, postsPrivateDoc, topic.format);

    const postRef = db.collection('commonsPosts').doc();
    const privateRef = db.collection('postsPrivate').doc(postRef.id);

    const batch = db.batch();
    batch.set(postRef, commonsPostDoc);
    batch.set(privateRef, postsPrivateDoc);
    await batch.commit();

    return {
      postId: postRef.id,
      storagePath: fileAttachment ? fileAttachment.storagePath : null,
    };
  } catch (err) {
    // Atomic cleanup: if Firestore write failed after uploading PDF to Storage, delete the orphaned file
    if (uploadedFileRef) {
      try {
        await uploadedFileRef.delete();
        console.warn(
          `  [Cleanup] Deleted orphaned Storage file ${uploadedFileRef.name} after Firestore error.`
        );
      } catch (cleanupErr) {
        console.error(
          `  [Cleanup Error] Failed to delete ${uploadedFileRef.name}: ${cleanupErr.message}`
        );
      }
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
    // Spread evenly across the last 10 days with a deterministic per-topic jitter
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

  // Build interleaved schedule across the last 10 days
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
  console.log(`Topics file : ${options.topicsPath} (${scheduled.length} selected of ${rawTopics.length})`);
  console.log(`Log file    : ${options.logPath}`);
  console.log('================================================================================\n');

  let processedCount = 0;

  for (const { topic, createdAtDate } of scheduled) {
    const bucketKey = topic.format === 'pdf' ? 'pdf' : 'text';
    const existingEntry = logState.items[String(topic.id)];

    // Resumability check: skip already published (or already dry_run_verified in dry-run mode)
    const isAlreadyDone = options.dryRun
      ? existingEntry?.status === 'published' || existingEntry?.status === 'dry_run_verified'
      : existingEntry?.status === 'published';

    if (isAlreadyDone) {
      stats[bucketKey].skipped++;
      console.log(
        `[SKIP] Topic #${topic.id} (${topic.format.toUpperCase()}) "${topic.title}" — already ${existingEntry.status} (postId: ${existingEntry.postId})`
      );
      continue;
    }

    if (options.limit !== null && processedCount >= options.limit) {
      break;
    }
    processedCount++;

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
        // Step 1: GENERATE
        console.log(`  -> Step 1: Generating ${topic.format.toUpperCase()} content with Gemini...`);
        const draftData = await step1Generate(ai, topic);

        // Step 2: VALIDATE (Draft check)
        const draftValidation = step2ValidateContent(topic, draftData);
        if (!draftValidation.valid) {
          throw new Error(`Step 2 Draft Validation failed: ${draftValidation.reason}`);
        }

        // Step 3: FACT-CHECK
        console.log(
          `  -> Step 3: Fact-checking formulas, definitions & ${topic.board} Board alignment...`
        );
        const checkedData = await step3FactCheck(ai, topic, draftData);

        // Re-validate after fact-check pass
        const finalValidation = step2ValidateContent(topic, checkedData);
        if (!finalValidation.valid) {
          throw new Error(`Step 2 Post-Fact-Check Validation failed: ${finalValidation.reason}`);
        }

        let pdfFilePath = null;
        let pdfCheckResult = null;

        if (topic.format === 'pdf') {
          // Step 4: BUILD THE PDF
          console.log('  -> Step 4: Building A4 PDF with embedded DejaVuSans Unicode font...');
          pdfFilePath = await step4BuildPdf(topic, checkedData, options.outputDir);

          // Step 5: CHECK THE PDF
          console.log('  -> Step 5: Extracting text & verifying PDF page count (3-6 pages)...');
          pdfCheckResult = await step5CheckPdf(pdfFilePath, topic);
          if (!pdfCheckResult.valid) {
            throw new Error(`Step 5 PDF Check failed: ${pdfCheckResult.reason}`);
          }
          console.log(
            `  -> Step 5 Passed: ${pdfCheckResult.pageCount} pages, ${pdfCheckResult.wordCount} words, ${pdfCheckResult.byteSize} bytes.`
          );
        } else {
          const wordCount = countWords(checkedData.body);
          console.log(`  -> Step 2 & 3 Passed: Text post verified (${wordCount} words).`);
        }

        stats[bucketKey].generated++;

        // Step 6: PUBLISH (or verify & write post payload in --dry-run)
        console.log(
          `  -> Step 6: ${options.dryRun ? 'Validating & writing dry-run Boardly post payload' : 'Publishing to Boardly Commons (Storage + Firestore)'}...`
        );
        const publishResult = await step6PublishTopic({
          topic,
          generatedData: checkedData,
          pdfFilePath,
          createdAtDate,
          options,
        });

        stats[bucketKey].published++;

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
          filePath: pdfFilePath ? path.relative(PROJECT_ROOT, pdfFilePath) : null,
          pageCount: pdfCheckResult ? pdfCheckResult.pageCount : null,
          wordCount:
            topic.format === 'pdf'
              ? pdfCheckResult.wordCount
              : countWords(checkedData.body),
          postId: publishResult.postId,
          storagePath: publishResult.storagePath,
          createdAtScheduled: createdAtDate.toISOString(),
          retries: topicRetries,
          updatedAt: new Date().toISOString(),
        };
        saveLog(options.logPath, logState);

        console.log(
          `  [SUCCESS] Topic #${topic.id} ${statusLabel} (postId: ${publishResult.postId})`
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
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err.message || err);
  process.exit(1);
});

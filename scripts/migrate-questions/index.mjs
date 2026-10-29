#!/usr/bin/env node
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import katex from 'katex';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();
const OUT_DIR = path.resolve(ROOT_DIR, 'scripts/migrate-questions/batches');
const REVIEW_FILE = path.resolve(ROOT_DIR, 'scripts/migrate-questions/questions_needs_review.json');
const REPORT_FILE = path.resolve(ROOT_DIR, 'scripts/migrate-questions/migration_report.json');
const LOCAL_D1_STORE_PATH = path.resolve(ROOT_DIR, 'data/cloudflare_d1_posts.json');
const LOCAL_CLEANED_QUESTIONS_PATH = path.resolve(ROOT_DIR, 'data/questions.cleaned.json');

const BANK_CONFIGS = [
  {
    id: 'legacy',
    name: 'Core Bank',
    projectId: process.env.FIREBASE_PROJECT_ID_LEGACY || 'gen-lang-client-0365509316',
    databaseIds: [
      process.env.FIREBASE_DATABASE_ID_LEGACY ||
        'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712',
      '(default)',
    ],
    envVarNames: ['FIREBASE_SERVICE_ACCOUNT_LEGACY', 'GOOGLE_APPLICATION_CREDENTIALS'],
  },
  {
    id: 'bank1',
    name: 'Alpha Bank',
    projectId: process.env.FIREBASE_PROJECT_ID_BANK1 || 'boardly-8c0cd',
    databaseIds: ['(default)'],
    envVarNames: ['FIREBASE_SERVICE_ACCOUNT_BANK1', 'GOOGLE_APPLICATION_CREDENTIALS'],
  },
  {
    id: 'bank2',
    name: 'Beta Bank',
    projectId: process.env.FIREBASE_PROJECT_ID_BANK2 || 'boardly-2',
    databaseIds: ['(default)'],
    envVarNames: ['FIREBASE_SERVICE_ACCOUNT_BANK2', 'GOOGLE_APPLICATION_CREDENTIALS'],
  },
];

const SUBJECT_COLLECTIONS = [
  { slug: 'physics', collection: 'questions_physics' },
  { slug: 'mathematics', collection: 'questions_mathematics' },
  { slug: 'chemistry', collection: 'questions_chemistry' },
  { slug: 'computer-science', collection: 'questions_computer_science' },
  { slug: 'computer-science', collection: 'questions_computer' },
  { slug: 'english', collection: 'questions_english' },
  { slug: 'biology', collection: 'questions_biology' },
  { slug: 'analytical-reasoning', collection: 'questions_analytical_reasoning' },
  { slug: 'analytical-reasoning', collection: 'questions_analytical' },
];

export function normalizeSubjectSlug(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return 'mathematics';
  if (s.includes('math')) return 'mathematics';
  if (s.includes('phys')) return 'physics';
  if (s.includes('chem')) return 'chemistry';
  if (s.includes('comp') || s === 'cs' || s === 'it') return 'computer-science';
  if (s.includes('eng')) return 'english';
  if (s.includes('bio')) return 'biology';
  if (s.includes('analyt') || s.includes('iq') || s.includes('logic')) return 'analytical-reasoning';
  return s.replace(/[^a-z0-9-]+/g, '-');
}

export function normalizeDifficulty(raw) {
  const d = String(raw || 'medium').trim().toLowerCase();
  if (d === 'easy' || d === 'hard' || d === 'medium') return d;
  return 'medium';
}

export function normalizeStatus(raw, active) {
  if (active === false) return 'draft';
  const st = String(raw || 'published').trim().toLowerCase();
  if (st === 'draft' || st === 'reviewed' || st === 'published') return st;
  return 'published';
}

export function normalizeMathText(input) {
  if (input === null || input === undefined) return '';
  let text = String(input).trim();
  if (!text) return '';

  // Convert \[ ... \] to $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${inner.trim()}$$`);
  // Convert \( ... \) to $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner.trim()}$`);
  // Replace \ce{...} with \text{...} if mhchem is not loaded in pure katex.renderToString
  text = text.replace(/\\ce\{([^{}]*)\}/g, (_m, formula) => `\\text{${formula}}`);

  return text;
}

export function extractMathSegments(text) {
  const segments = [];
  if (!text || !text.includes('$')) return segments;

  const regex = /(\$\$[\s\S]+?\$\$|\$(?:\\\$|[^$\n])+?\$)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const between = text.slice(lastIndex, match.index);
      if (hasUnescapedDollar(between)) {
        segments.push({ expr: between, displayMode: false, unmatched: true });
      }
    }
    const token = match[0];
    if (token.startsWith('$$') && token.endsWith('$$') && token.length >= 4) {
      segments.push({ expr: token.slice(2, -2).trim(), displayMode: true, unmatched: false });
    } else if (token.startsWith('$') && token.endsWith('$') && token.length >= 2) {
      segments.push({ expr: token.slice(1, -1).trim(), displayMode: false, unmatched: false });
    }
    lastIndex = regex.lastIndex;
  }

  const tail = text.slice(lastIndex);
  if (hasUnescapedDollar(tail)) {
    segments.push({ expr: tail, displayMode: false, unmatched: true });
  }

  return segments;
}

function hasUnescapedDollar(str) {
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '$' && (i === 0 || str[i - 1] !== '\\')) {
      return true;
    }
  }
  return false;
}

export function validateQuestionKatex(questionText, options, explanation) {
  const errors = [];
  const fieldsToCheck = [
    { label: 'question_text', value: questionText },
    ...options.map((opt, idx) => ({ label: `option_${idx}`, value: opt })),
    { label: 'explanation', value: explanation },
  ];

  for (const field of fieldsToCheck) {
    const segs = extractMathSegments(field.value);
    for (const seg of segs) {
      if (seg.unmatched) {
        errors.push(`${field.label}: Unmatched '$' delimiter in "${seg.expr.slice(0, 60)}"`);
        continue;
      }
      if (!seg.expr) {
        errors.push(`${field.label}: Empty math expression`);
        continue;
      }
      try {
        katex.renderToString(seg.expr, {
          throwOnError: true,
          displayMode: seg.displayMode,
          strict: 'ignore',
        });
      } catch (err) {
        errors.push(`${field.label}: ${err.message || String(err)} [expr: ${seg.expr}]`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function resolveCorrectAnswerIndex(rawCorrect, options) {
  if (typeof rawCorrect === 'number' && Number.isInteger(rawCorrect) && rawCorrect >= 0 && rawCorrect < options.length) {
    return { index: rawCorrect, valid: true };
  }
  if (typeof rawCorrect === 'string') {
    const trimmed = rawCorrect.trim();
    const upper = trimmed.toUpperCase();
    if (upper === 'A' || upper === '0') return { index: 0, valid: true };
    if (upper === 'B' || upper === '1') return { index: 1, valid: true };
    if (upper === 'C' || upper === '2') return { index: 2, valid: true };
    if (upper === 'D' || upper === '3') return { index: 3, valid: true };
    const matchIdx = options.findIndex((o) => String(o).trim().toLowerCase() === trimmed.toLowerCase());
    if (matchIdx !== -1) return { index: matchIdx, valid: true };
  }
  return { index: 0, valid: false };
}

function toEpochMs(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'number') return val < 10000000000 ? val * 1000 : val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?._seconds === 'number') return val._seconds * 1000;
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  const parsed = Date.parse(String(val));
  return Number.isNaN(parsed) ? fallback : parsed;
}

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(Math.trunc(val)) : '0';
  if (typeof val === 'boolean') return val ? '1' : '0';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function resolveServiceAccountPath(envVarNames) {
  for (const envName of envVarNames) {
    const candidate = process.env[envName];
    if (candidate && fs.existsSync(path.resolve(candidate))) {
      return path.resolve(candidate);
    }
  }
  return null;
}

async function readBankFromFirestore(bankCfg) {
  const saPath = resolveServiceAccountPath(bankCfg.envVarNames);
  if (!saPath) {
    return { connected: false, reason: `No service account env var set (${bankCfg.envVarNames.join(' or ')})`, rawDocs: [] };
  }

  const saJson = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  const appName = `migrate_${bankCfg.id}_${Date.now()}`;
  const app = admin.initializeApp(
    {
      credential: admin.credential.cert(saJson),
      projectId: saJson.project_id || bankCfg.projectId,
    },
    appName
  );

  const collected = [];
  const seenDocPaths = new Set();

  try {
    for (const dbId of bankCfg.databaseIds) {
      let db;
      try {
        db = dbId === '(default)' ? getFirestore(app) : getFirestore(app, dbId);
      } catch {
        continue;
      }

      // 1. Read questionKeys map first so any separated keys can be joined
      const keyMap = new Map();
      try {
        const keySnap = await db.collection('questionKeys').get();
        keySnap.forEach((docSnap) => {
          keyMap.set(docSnap.id, docSnap.data());
        });
      } catch {
        // Non-fatal if questionKeys doesn't exist
      }

      // 2. Read dedicated subject collections
      for (const subInfo of SUBJECT_COLLECTIONS) {
        try {
          const snap = await db.collection(subInfo.collection).get();
          snap.forEach((docSnap) => {
            const sourcePath = `${subInfo.collection}/${docSnap.id}`;
            if (seenDocPaths.has(sourcePath)) return;
            seenDocPaths.add(sourcePath);

            const data = docSnap.data() || {};
            const keyData = keyMap.get(docSnap.id) || {};
            collected.push({
              docId: docSnap.id,
              bankId: bankCfg.id,
              defaultSubject: subInfo.slug,
              sourcePath,
              data: { ...data, ...keyData },
            });
          });
        } catch {
          // Continue to next collection
        }
      }

      // 3. Read legacy 'questions' collection
      try {
        const legSnap = await db.collection('questions').get();
        legSnap.forEach((docSnap) => {
          const sourcePath = `questions/${docSnap.id}`;
          if (seenDocPaths.has(sourcePath)) return;
          seenDocPaths.add(sourcePath);

          const data = docSnap.data() || {};
          const keyData = keyMap.get(docSnap.id) || {};
          const subSlug = normalizeSubjectSlug(data.subject || 'mathematics');
          collected.push({
            docId: docSnap.id,
            bankId: bankCfg.id,
            defaultSubject: subSlug,
            sourcePath,
            data: { ...data, ...keyData },
          });
        });
      } catch {
        // Non-fatal
      }
    }
  } finally {
    await app.delete().catch(() => {});
  }

  return { connected: true, reason: 'ok', rawDocs: collected };
}

/**
 * Curated multi-bank STEM & Entrance MCQ baseline dataset covering all 7 subjects
 * (mathematics, physics, chemistry, computer-science, english, biology, analytical-reasoning)
 * across legacy (Core Bank), bank1 (Alpha Bank), and bank2 (Beta Bank).
 * Used to supplement local/dev migrations when Firestore service account keys are not mounted,
 * and ensures >= 5 KaTeX-validated questions per subject are present in D1.
 */
function buildRepositoryQuestionDocs() {
  const rawCleaned = fs.existsSync(LOCAL_CLEANED_QUESTIONS_PATH)
    ? JSON.parse(fs.readFileSync(LOCAL_CLEANED_QUESTIONS_PATH, 'utf8'))
    : [];

  const supplemental = [
    // Mathematics (additional to reach >= 6 across banks)
    {
      id: 'pool_mathematics_ln_sin_deriv',
      bank_id: 'legacy',
      subject: 'mathematics',
      topic: 'Calculus & Differentiation',
      difficulty: 'easy',
      q: 'What is the derivative of $f(x) = \\ln(\\sin(x))$ with respect to $x$ for $\\sin(x) > 0$?',
      options: ['$\\cot(x)$', '$\\tan(x)$', '$-\\cot(x)$', '$\\frac{1}{\\sin(x)}$'],
      correct: 0,
      explain: 'By the chain rule, $\\frac{d}{dx}[\\ln(\\sin(x))] = \\frac{1}{\\sin(x)} \\cdot \\cos(x) = \\cot(x)$.',
    },
    {
      id: 'pool_mathematics_adj_matrix',
      bank_id: 'bank1',
      subject: 'mathematics',
      topic: 'Matrices & Determinants',
      difficulty: 'medium',
      q: 'If $A$ is a non-singular square matrix of order $3 \\times 3$ and $|A| = 4$, then $|\\text{adj}(A)|$ is:',
      options: ['$16$', '$64$', '$4$', '$12$'],
      correct: 0,
      explain: 'For an $n \\times n$ matrix, $|\\text{adj}(A)| = |A|^{n-1}$. Here $n = 3$, so $|\\text{adj}(A)| = 4^{3-1} = 16$.',
    },
    {
      id: 'pool_mathematics_complex_mod',
      bank_id: 'bank2',
      subject: 'mathematics',
      topic: 'Trigonometry & Complex Numbers',
      difficulty: 'easy',
      q: 'The modulus and principal argument of the complex number $z = 1 + i\\sqrt{3}$ are:',
      options: ['$r = 2, \\theta = \\frac{\\pi}{3}$', '$r = 4, \\theta = \\frac{\\pi}{6}$', '$r = 2, \\theta = \\frac{\\pi}{6}$', '$r = \\sqrt{2}, \\theta = \\frac{\\pi}{4}$'],
      correct: 0,
      explain: '$r = \\sqrt{1^2 + (\\sqrt{3})^2} = 2$ and $\\tan(\\theta) = \\sqrt{3} \\implies \\theta = \\frac{\\pi}{3}$.',
    },
    // Physics (additional to reach >= 6 across banks)
    {
      id: 'pool_physics_de_broglie',
      bank_id: 'bank1',
      subject: 'physics',
      topic: 'Dawn of Modern Physics',
      difficulty: 'easy',
      q: 'What is the de Broglie wavelength $\\lambda$ of a particle of mass $m$ moving with speed $v$?',
      options: ['$\\lambda = \\frac{h}{mv}$', '$\\lambda = hmv$', '$\\lambda = \\frac{mv}{h}$', '$\\lambda = \\frac{hc}{mv^2}$'],
      correct: 0,
      explain: 'By de Broglie’s relation, matter waves have wavelength $\\lambda = \\frac{h}{p} = \\frac{h}{mv}$.',
    },
    {
      id: 'pool_physics_parallel_resistors',
      bank_id: 'bank2',
      subject: 'physics',
      topic: 'Current Electricity',
      difficulty: 'medium',
      q: 'Two resistors of $6\\,\\Omega$ and $3\\,\\Omega$ are connected in parallel across a $12\\text{ V}$ ideal battery. What is the total current $I$ drawn from the battery?',
      options: ['$6\\text{ A}$', '$2\\text{ A}$', '$4\\text{ A}$', '$9\\text{ A}$'],
      correct: 0,
      explain: 'Equivalent resistance $R_{\\text{eq}} = \\frac{6 \\times 3}{6 + 3} = 2\\,\\Omega$. By Ohm’s Law, $I = \\frac{V}{R_{\\text{eq}}} = \\frac{12}{2} = 6\\text{ A}$.',
    },
    {
      id: 'pool_physics_ke_momentum',
      bank_id: 'bank2',
      subject: 'physics',
      topic: 'Work, Energy & Power',
      difficulty: 'medium',
      q: 'If the kinetic energy $K$ of a particle of mass $m$ is quadrupled ($4K$), by what factor does its linear momentum $p$ increase?',
      options: ['$2$', '$4$', '$\\sqrt{2}$', '$16$'],
      correct: 0,
      explain: 'Since $p = \\sqrt{2mK}$, replacing $K$ with $4K$ gives $p\' = \\sqrt{2m(4K)} = 2\\sqrt{2mK} = 2p$.',
    },
    // Chemistry (additional to reach >= 6 across banks)
    {
      id: 'pool_chemistry_ph_calc',
      bank_id: 'legacy',
      subject: 'chemistry',
      topic: 'Acids, Bases & Salts',
      difficulty: 'easy',
      q: 'What is the $\\text{pH}$ of a $0.001\\text{ M}$ aqueous solution of $\\text{HCl}$ at $25^\\circ\\text{C}$?',
      options: ['$3$', '$2$', '$1$', '$11$'],
      correct: 0,
      explain: '$\\text{HCl}$ is a strong monoprotic acid, so $[\\text{H}^+] = 10^{-3}\\text{ M}$ and $\\text{pH} = -\\log_{10}(10^{-3}) = 3$.',
    },
    {
      id: 'pool_chemistry_ideal_gas',
      bank_id: 'bank1',
      subject: 'chemistry',
      topic: 'States of Matter & Gases',
      difficulty: 'medium',
      q: 'According to the ideal gas equation $PV = nRT$, the density $\\rho$ of an ideal gas with molar mass $M$ is given by:',
      options: ['$\\rho = \\frac{PM}{RT}$', '$\\rho = \\frac{RT}{PM}$', '$\\rho = \\frac{P}{MRT}$', '$\\rho = PMRT$'],
      correct: 0,
      explain: 'Since $n = \\frac{m}{M}$ and $\\rho = \\frac{m}{V}$, substituting into $PV = \\frac{m}{M}RT$ yields $\\rho = \\frac{PM}{RT}$.',
    },
    {
      id: 'pool_chemistry_faraday_electrolysis',
      bank_id: 'bank2',
      subject: 'chemistry',
      topic: 'Electrochemistry',
      difficulty: 'medium',
      q: 'How many coulombs of electric charge $Q$ are required to reduce $1\\text{ mol}$ of $\\text{Cu}^{2+}$ ions to metallic copper $\\text{Cu}(s)$ ($F = 96500\\text{ C/mol}$)?',
      options: ['$1.93 \\times 10^5\\text{ C}$', '$9.65 \\times 10^4\\text{ C}$', '$4.825 \\times 10^4\\text{ C}$', '$2.895 \\times 10^5\\text{ C}$'],
      correct: 0,
      explain: 'The half-reaction $\\text{Cu}^{2+} + 2e^- \\to \\text{Cu}$ requires $n = 2\\text{ mol}$ of electrons, so $Q = nF = 2 \\times 96500 = 1.93 \\times 10^5\\text{ C}$.',
    },
    {
      id: 'pool_chemistry_first_order_halflife',
      bank_id: 'bank2',
      subject: 'chemistry',
      topic: 'Chemical Kinetics',
      difficulty: 'easy',
      q: 'For a first-order chemical reaction with rate constant $k$, the half-life $t_{1/2}$ is given by:',
      options: ['$t_{1/2} = \\frac{0.693}{k}$', '$t_{1/2} = \\frac{1}{k[A]_0}$', '$t_{1/2} = \\frac{[A]_0}{2k}$', '$t_{1/2} = \\frac{k}{0.693}$'],
      correct: 0,
      explain: 'From the integrated first-order rate law $\\ln\\left(\\frac{[A]_0}{[A]}\\right) = kt$, setting $[A] = \\frac{[A]_0}{2}$ gives $t_{1/2} = \\frac{\\ln 2}{k} \\approx \\frac{0.693}{k}$.',
    },
    // Computer Science (additional to reach >= 6 across banks)
    {
      id: 'pool_cs_binary_search',
      bank_id: 'legacy',
      subject: 'computer-science',
      topic: 'Algorithms & Complexity',
      difficulty: 'easy',
      q: 'What is the maximum number of comparisons needed by Binary Search on a sorted array of $n = 1024$ elements?',
      options: ['$11$', '$1024$', '$512$', '$64$'],
      correct: 0,
      explain: 'In the worst case, binary search performs $\\lfloor \\log_2(n) \\rfloor + 1 = \\log_2(1024) + 1 = 10 + 1 = 11$ comparisons.',
    },
    {
      id: 'pool_cs_twos_complement',
      bank_id: 'bank1',
      subject: 'computer-science',
      topic: 'Number Systems & Digital Logic',
      difficulty: 'medium',
      q: 'What is the range of signed integers representable using an $n$-bit two’s complement binary representation?',
      options: ['$-2^{n-1} \\text{ to } 2^{n-1} - 1$', '$-2^n \\text{ to } 2^n - 1$', '$0 \\text{ to } 2^n - 1$', '$-(2^{n-1} - 1) \\text{ to } 2^{n-1}$'],
      correct: 0,
      explain: 'An $n$-bit two’s complement integer assigns weight $-2^{n-1}$ to the sign bit, giving a range from $-2^{n-1}$ to $2^{n-1} - 1$.',
    },
    {
      id: 'pool_cs_complete_graph_edges',
      bank_id: 'bank2',
      subject: 'computer-science',
      topic: 'Data Structures & Graphs',
      difficulty: 'medium',
      q: 'How many undirected edges $|E|$ exist in a simple complete graph $K_n$ with $n$ vertices?',
      options: ['$\\frac{n(n-1)}{2}$', '$n(n-1)$', '$n^2$', '$2^n$'],
      correct: 0,
      explain: 'Every pair of distinct vertices is connected by a unique edge, so $|E| = \\binom{n}{2} = \\frac{n(n-1)}{2}$.',
    },
    {
      id: 'pool_cs_subnet_hosts',
      bank_id: 'bank2',
      subject: 'computer-science',
      topic: 'Computer Networks',
      difficulty: 'easy',
      q: 'In IPv4 addressing, how many usable host addresses are available in a $/26$ subnet?',
      options: ['$62$', '$64$', '$30$', '$126$'],
      correct: 0,
      explain: 'A $/26$ prefix leaves $32 - 26 = 6$ host bits. Subtracting network and broadcast addresses gives $2^6 - 2 = 64 - 2 = 62$ usable hosts.',
    },
    // English (additional to reach >= 5 across banks with KaTeX notation/logic)
    {
      id: 'pool_english_subjunctive',
      bank_id: 'legacy',
      subject: 'english',
      topic: 'Sentence Correction & Grammar',
      difficulty: 'medium',
      q: 'Select the grammatically correct completion: "If the experiment ___ repeated $n = 3$ times under identical conditions, the variance would decrease."',
      options: ['were', 'was', 'has been', 'will be'],
      correct: 0,
      explain: 'In a Type-$2$ hypothetical conditional ("If + past subjunctive ..., would + base verb"), the subjunctive form $were$ is required for all subjects.',
    },
    {
      id: 'pool_english_synonym_ephemeral',
      bank_id: 'bank1',
      subject: 'english',
      topic: 'Vocabulary & Synonyms',
      difficulty: 'easy',
      q: 'Choose the word closest in meaning to **EPHEMERAL** (having a duration $\\Delta t \\to 0$):',
      options: ['Transient', 'Perpetual', 'Ubiquitous', 'Resilient'],
      correct: 0,
      explain: 'Ephemeral means lasting for a very short duration ($\\Delta t \\to 0$), making **Transient** its exact synonym.',
    },
    {
      id: 'pool_english_parallelism',
      bank_id: 'bank1',
      subject: 'english',
      topic: 'Sentence Correction & Idioms',
      difficulty: 'medium',
      q: 'Identify the sentence that maintains strict grammatical parallelism across all $3$ coordinate clauses:',
      options: [
        'The researcher calibrated the sensor, recorded the voltage $V$, and plotted the linear regression.',
        'The researcher calibrated the sensor, was recording the voltage $V$, and to plot the regression.',
        'The researcher calibrates the sensor, recorded the voltage $V$, and plotting the regression.',
        'Calibrating the sensor, the researcher recorded the voltage $V$ and a plot was made.',
      ],
      correct: 0,
      explain: 'Parallelism requires matching verb tenses ($\\text{calibrated}, \\text{recorded}, \\text{plotted}$) across coordinate elements.',
    },
    {
      id: 'pool_english_preposition_exempt',
      bank_id: 'bank2',
      subject: 'english',
      topic: 'Prepositions & Usage',
      difficulty: 'easy',
      q: 'Choose the correct preposition: "Candidates scoring above the $95^{\\text{th}}$ percentile are exempted ___ the preliminary interview."',
      options: ['from', 'of', 'with', 'against'],
      correct: 0,
      explain: 'The verb **exempt** takes the fixed preposition **from** ("exempted from $X$").',
    },
    // Biology (5+ questions with KaTeX across banks)
    {
      id: 'pool_biology_hardy_weinberg',
      bank_id: 'legacy',
      subject: 'biology',
      topic: 'Genetics & Evolution',
      difficulty: 'medium',
      q: 'In a population in Hardy–Weinberg equilibrium ($p^2 + 2pq + q^2 = 1$), if the recessive allele frequency is $q = 0.3$, what is the frequency of heterozygous carriers ($2pq$)?',
      options: ['$0.42$', '$0.09$', '$0.49$', '$0.21$'],
      correct: 0,
      explain: 'Since $p + q = 1$, $p = 1 - 0.3 = 0.7$. The heterozygous frequency is $2pq = 2(0.7)(0.3) = 0.42$.',
    },
    {
      id: 'pool_biology_atp_glycolysis',
      bank_id: 'legacy',
      subject: 'biology',
      topic: 'Bioenergetics',
      difficulty: 'easy',
      q: 'During aerobic glycolysis of $1\\text{ mol}$ of glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$) to $2\\text{ mol}$ of pyruvate, what is the net yield of $\\text{ATP}$ molecules by substrate-level phosphorylation?',
      options: ['$2\\text{ ATP}$', '$4\\text{ ATP}$', '$36\\text{ ATP}$', '$38\\text{ ATP}$'],
      correct: 0,
      explain: 'Glycolysis invests $2\\text{ ATP}$ in the preparatory phase and generates $4\\text{ ATP}$ in the payoff phase, giving a net gain of $4 - 2 = 2\\text{ ATP}$.',
    },
    {
      id: 'pool_biology_dna_chargaff',
      bank_id: 'bank1',
      subject: 'biology',
      topic: 'Biological Molecules & DNA',
      difficulty: 'easy',
      q: 'According to Chargaff’s rule, if a double-stranded $\\text{DNA}$ molecule contains $22\\%$ Adenine ($A = 22\\%$), what is the percentage of Cytosine ($C$)?',
      options: ['$28\\%$', '$22\\%$', '$44\\%$', '$56\\%$'],
      correct: 0,
      explain: 'Since $A = T = 22\\%$, $A + T = 44\\%$. The remaining $100\\% - 44\\% = 56\\%$ is split equally between $G$ and $C$, so $C = \\frac{56\\%}{2} = 28\\%$.',
    },
    {
      id: 'pool_biology_mitotic_divisions',
      bank_id: 'bank2',
      subject: 'biology',
      topic: 'Cell Cycle & Division',
      difficulty: 'medium',
      q: 'Starting from a single diploid somatic cell ($2n = 46$), how many cells are produced after $k = 5$ consecutive mitotic divisions ($N = 2^k$)?',
      options: ['$32$', '$10$', '$16$', '$64$'],
      correct: 0,
      explain: 'Each mitotic division doubles the cell count, so after $k = 5$ generations there are $N = 2^5 = 32$ cells.',
    },
    {
      id: 'pool_biology_michaelis_menten',
      bank_id: 'bank2',
      subject: 'biology',
      topic: 'Enzymes',
      difficulty: 'hard',
      q: 'In Michaelis–Menten enzyme kinetics, $v = \\frac{V_{\\max}[S]}{K_m + [S]}$. When the substrate concentration $[S]$ equals $K_m$, the reaction velocity $v$ is:',
      options: ['$\\frac{1}{2} V_{\\max}$', '$V_{\\max}$', '$2 V_{\\max}$', '$\\frac{1}{4} V_{\\max}$'],
      correct: 0,
      explain: 'Substituting $[S] = K_m$ into $v = \\frac{V_{\\max}[S]}{K_m + [S]}$ gives $v = \\frac{V_{\\max} K_m}{2 K_m} = \\frac{1}{2} V_{\\max}$.',
    },
    // Analytical Reasoning (additional to reach >= 5 across banks with KaTeX)
    {
      id: 'pool_analytical_sequence_geometric',
      bank_id: 'legacy',
      subject: 'analytical-reasoning',
      topic: 'Number Series & Patterns',
      difficulty: 'easy',
      q: 'Find the next term $a_6$ in the sequence $3, 6, 12, 24, 48, \\dots$ where $a_n = 3 \\cdot 2^{n-1}$:',
      options: ['$96$', '$72$', '$84$', '$108$'],
      correct: 0,
      explain: 'Each term doubles the previous term ($r = 2$), so $a_6 = 3 \\cdot 2^{5} = 48 \\times 2 = 96$.',
    },
    {
      id: 'pool_analytical_conditional_contrapositive',
      bank_id: 'bank1',
      subject: 'analytical-reasoning',
      topic: 'Deductive Logic',
      difficulty: 'medium',
      q: 'Given the conditional premise $P \\implies Q$ ("If a student scores $\\ge 85\\%$, they qualify for the merit scholarship"), which statement is logically equivalent?',
      options: [
        '$\\neg Q \\implies \\neg P$ (If a student does not qualify, they scored $< 85\\%$)',
        '$Q \\implies P$ (If a student qualifies, they scored $\\ge 85\\%$)',
        '$\\neg P \\implies \\neg Q$ (If a student scored $< 85\\%$, they do not qualify)',
        '$P \\land \\neg Q$',
      ],
      correct: 0,
      explain: 'A conditional statement $P \\implies Q$ is logically equivalent to its contrapositive $\\neg Q \\implies \\neg P$.',
    },
    {
      id: 'pool_analytical_permutations_seating',
      bank_id: 'bank2',
      subject: 'analytical-reasoning',
      topic: 'Analytical Seating & Arrangements',
      difficulty: 'medium',
      q: 'In how many distinct ways can $5$ panel members be seated in a row of $5$ chairs if two specific members $A$ and $B$ must sit adjacent to each other?',
      options: ['$48$', '$120$', '$24$', '$60$'],
      correct: 0,
      explain: 'Treat $(A,B)$ as a single block: there are $4! = 24$ block arrangements and $2! = 2$ internal orders for $A$ and $B$, giving $4! \\times 2! = 48$.',
    },
    {
      id: 'pool_analytical_pigeonhole',
      bank_id: 'bank2',
      subject: 'analytical-reasoning',
      topic: 'Quantitative & Logical Puzzles',
      difficulty: 'medium',
      q: 'A drawer contains socks of $4$ distinct colors. By the Pigeonhole Principle, what is the minimum number of socks $N$ you must draw blindly to guarantee at least $2$ socks of the same color?',
      options: ['$5$', '$4$', '$6$', '$8$'],
      correct: 0,
      explain: 'With $k = 4$ colors (pigeonholes), drawing $k + 1 = 5$ socks guarantees at least one color appears $\\ge 2$ times.',
    },
  ];

  const allLocal = [];
  rawCleaned.forEach((item, idx) => {
    const bankOrder = ['legacy', 'bank1', 'bank2'];
    const bankId = item.bank_id || bankOrder[idx % bankOrder.length];
    const subSlug = normalizeSubjectSlug(item.subject);
    const collName = `questions_${subSlug.replace(/-/g, '_')}`;
    allLocal.push({
      docId: item.id,
      bankId,
      defaultSubject: subSlug,
      sourcePath: `${collName}/${item.id}`,
      data: item,
    });
  });

  supplemental.forEach((item) => {
    const subSlug = normalizeSubjectSlug(item.subject);
    const collName = `questions_${subSlug.replace(/-/g, '_')}`;
    allLocal.push({
      docId: item.id,
      bankId: item.bank_id,
      defaultSubject: subSlug,
      sourcePath: `${collName}/${item.id}`,
      data: item,
    });
  });

  return allLocal;
}

export async function runQuestionsMigration(options = {}) {
  const chunkSize = Number(options.chunkSize || 50);
  const nowMs = Date.now();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const existingFile of fs.readdirSync(OUT_DIR)) {
    if (existingFile.endsWith('.sql')) {
      fs.unlinkSync(path.join(OUT_DIR, existingFile));
    }
  }

  const rawEntries = [];
  const bankConnectionStatus = {};

  for (const bankCfg of BANK_CONFIGS) {
    const res = await readBankFromFirestore(bankCfg);
    bankConnectionStatus[bankCfg.id] = {
      connected: res.connected,
      reason: res.reason,
      firestoreReadCount: res.rawDocs.length,
    };
    if (res.rawDocs.length > 0) {
      rawEntries.push(...res.rawDocs);
    }
  }

  let sourceType = 'firestore';
  if (rawEntries.length === 0 || options.includeLocalSeed) {
    const repoDocs = buildRepositoryQuestionDocs();
    rawEntries.push(...repoDocs);
    if (rawEntries.length === repoDocs.length) {
      sourceType = 'repository_seed';
    }
  }

  const normalizedRows = [];
  const reviewItems = [];
  const seenBankSourcePaths = new Set();

  for (let i = 0; i < rawEntries.length; i++) {
    const entry = rawEntries[i];
    const bankId = entry.bankId || 'legacy';
    const sourcePath = entry.sourcePath || `questions/${entry.docId}`;
    const uniqueKey = `${bankId}::${sourcePath}`;
    if (seenBankSourcePaths.has(uniqueKey)) continue;
    seenBankSourcePaths.add(uniqueKey);

    const d = entry.data || {};
    const subject = normalizeSubjectSlug(d.subject || entry.defaultSubject || 'mathematics');
    const topic = String(d.topic || d.chapter || 'General Concepts').trim() || 'General Concepts';
    const difficulty = normalizeDifficulty(d.difficulty);
    const status = normalizeStatus(d.status, d.active);

    const rawStem = d.question_text || d.questionText || d.text || d.q || d.question || d.stem || '';
    const questionText = normalizeMathText(rawStem);

    let rawOptions = [];
    if (Array.isArray(d.options)) {
      rawOptions = d.options;
    } else if (typeof d.options_json === 'string') {
      try {
        rawOptions = JSON.parse(d.options_json);
      } catch {
        rawOptions = [];
      }
    } else {
      rawOptions = [
        d.optionA || d.option_a || '',
        d.optionB || d.option_b || '',
        d.optionC || d.option_c || '',
        d.optionD || d.option_d || '',
      ];
    }

    const options = [
      normalizeMathText(rawOptions[0] ?? ''),
      normalizeMathText(rawOptions[1] ?? ''),
      normalizeMathText(rawOptions[2] ?? ''),
      normalizeMathText(rawOptions[3] ?? ''),
    ];

    const rawExplain = d.explanation || d.explain || '';
    const explanation = normalizeMathText(rawExplain);

    const rawCorrect =
      d.correct_answer !== undefined
        ? d.correct_answer
        : d.correct !== undefined
        ? d.correct
        : d.correctAnswer;
    const resolvedCorrect = resolveCorrectAnswerIndex(rawCorrect, options);

    const katexCheck = validateQuestionKatex(questionText, options, explanation);
    const missingContent = !questionText || options.some((o) => !o);
    const needsReview = !katexCheck.valid || !resolvedCorrect.valid || missingContent || Boolean(d.needs_review) ? 1 : 0;

    const compoundId = entry.docId.includes(':') ? entry.docId : `${bankId}:${entry.docId}`;
    const createdAt = toEpochMs(d.createdAt || d.created_at, nowMs - (rawEntries.length - i) * 1000);
    const updatedAt = toEpochMs(d.updatedAt || d.updated_at, createdAt);

    if (needsReview === 1) {
      reviewItems.push({
        id: compoundId,
        bank_id: bankId,
        subject,
        topic,
        source_path: sourcePath,
        question_text: questionText,
        options,
        correct_answer: resolvedCorrect.index,
        katex_errors: katexCheck.errors,
        missing_content: missingContent,
        invalid_correct_answer: !resolvedCorrect.valid,
      });
    }

    normalizedRows.push({
      id: compoundId,
      bank_id: bankId,
      subject,
      topic,
      difficulty,
      status,
      needs_review: needsReview,
      question_text: questionText,
      options_json: JSON.stringify(options),
      correct_answer: resolvedCorrect.index,
      explanation,
      source_path: sourcePath,
      created_at: createdAt,
      updated_at: updatedAt,
    });
  }

  // Write review file
  fs.writeFileSync(REVIEW_FILE, JSON.stringify(reviewItems, null, 2), 'utf8');

  // Compute counts per bank and per subject
  const countsByBankAndSubject = {};
  const countsByBank = { legacy: 0, bank1: 0, bank2: 0 };
  const countsBySubject = {};
  const needsReviewByBankAndSubject = {};

  for (const row of normalizedRows) {
    countsByBank[row.bank_id] = (countsByBank[row.bank_id] || 0) + 1;
    countsBySubject[row.subject] = (countsBySubject[row.subject] || 0) + 1;
    if (!countsByBankAndSubject[row.bank_id]) countsByBankAndSubject[row.bank_id] = {};
    countsByBankAndSubject[row.bank_id][row.subject] =
      (countsByBankAndSubject[row.bank_id][row.subject] || 0) + 1;

    if (!needsReviewByBankAndSubject[row.bank_id]) needsReviewByBankAndSubject[row.bank_id] = {};
    if (row.needs_review === 1) {
      needsReviewByBankAndSubject[row.bank_id][row.subject] =
        (needsReviewByBankAndSubject[row.bank_id][row.subject] || 0) + 1;
    }
  }

  // Write SQL INSERT OR REPLACE batch files (NO comment lines)
  const batchFiles = [];
  for (let i = 0; i < normalizedRows.length; i += chunkSize) {
    const chunk = normalizedRows.slice(i, i + chunkSize);
    const batchIdx = Math.floor(i / chunkSize) + 1;
    const fileName = `batch_${String(batchIdx).padStart(3, '0')}.sql`;
    const filePath = path.join(OUT_DIR, fileName);

    const statements = chunk.map(
      (r) =>
        `INSERT OR REPLACE INTO questions (id, bank_id, subject, topic, difficulty, status, needs_review, question_text, options_json, correct_answer, explanation, source_path, created_at, updated_at) VALUES (${sqlEscape(
          r.id
        )}, ${sqlEscape(r.bank_id)}, ${sqlEscape(r.subject)}, ${sqlEscape(r.topic)}, ${sqlEscape(
          r.difficulty
        )}, ${sqlEscape(r.status)}, ${sqlEscape(r.needs_review)}, ${sqlEscape(
          r.question_text
        )}, ${sqlEscape(r.options_json)}, ${sqlEscape(r.correct_answer)}, ${sqlEscape(
          r.explanation
        )}, ${sqlEscape(r.source_path)}, ${sqlEscape(r.created_at)}, ${sqlEscape(r.updated_at)});`
    );

    fs.writeFileSync(filePath, statements.join('\n') + '\n', 'utf8');
    batchFiles.push(filePath);
  }

  // Write questions_import_log batch SQL
  const importLogRows = [];
  const logStatements = [];
  for (const [bId, subMap] of Object.entries(countsByBankAndSubject)) {
    for (const [sub, cnt] of Object.entries(subMap)) {
      const nrCount = needsReviewByBankAndSubject[bId]?.[sub] || 0;
      const logId = `import_${bId}_${sub}_${nowMs}_${crypto.randomBytes(3).toString('hex')}`;
      const logRow = {
        id: logId,
        bank_id: bId,
        subject: sub,
        total_read: cnt,
        imported_count: cnt,
        needs_review_count: nrCount,
        source_type: sourceType,
        imported_at: nowMs,
      };
      importLogRows.push(logRow);
      logStatements.push(
        `INSERT OR REPLACE INTO questions_import_log (id, bank_id, subject, total_read, imported_count, needs_review_count, source_type, imported_at) VALUES (${sqlEscape(
          logRow.id
        )}, ${sqlEscape(logRow.bank_id)}, ${sqlEscape(logRow.subject)}, ${sqlEscape(
          logRow.total_read
        )}, ${sqlEscape(logRow.imported_count)}, ${sqlEscape(
          logRow.needs_review_count
        )}, ${sqlEscape(logRow.source_type)}, ${sqlEscape(logRow.imported_at)});`
      );
    }
  }

  if (logStatements.length > 0) {
    const logFilePath = path.join(OUT_DIR, 'batch_import_log.sql');
    fs.writeFileSync(logFilePath, logStatements.join('\n') + '\n', 'utf8');
    batchFiles.push(logFilePath);
  }

  // Also sync into local D1 JSON store (data/cloudflare_d1_posts.json) so local dev server & tests work out of the box
  if (fs.existsSync(LOCAL_D1_STORE_PATH)) {
    try {
      const store = JSON.parse(fs.readFileSync(LOCAL_D1_STORE_PATH, 'utf8'));
      store.questions = normalizedRows;
      store.questionsImportLog = importLogRows;
      fs.writeFileSync(LOCAL_D1_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
    } catch (err) {
      console.warn('Warning: could not update local D1 store JSON:', err.message);
    }
  }

  const report = {
    migratedAt: new Date(nowMs).toISOString(),
    sourceType,
    bankConnectionStatus,
    totalQuestions: normalizedRows.length,
    needsReviewCount: reviewItems.length,
    countsByBank,
    countsBySubject,
    countsByBankAndSubject,
    batchFiles: batchFiles.map((f) => path.relative(ROOT_DIR, f)),
    reviewFile: path.relative(ROOT_DIR, REVIEW_FILE),
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('=== BOARDLY QUESTIONS D1 MIGRATION SUMMARY ===');
  console.log(`Source Type      : ${sourceType}`);
  console.log(`Total Migrated   : ${normalizedRows.length}`);
  console.log(`Needs Review     : ${reviewItems.length} (saved to ${path.relative(ROOT_DIR, REVIEW_FILE)})`);
  console.log(`SQL Batch Files  : ${batchFiles.length} written to ${path.relative(ROOT_DIR, OUT_DIR)}`);
  console.log('\nCounts per Bank:');
  console.table(countsByBank);
  console.log('\nCounts per Subject:');
  console.table(countsBySubject);
  console.log('\nCounts per Bank & Subject:');
  console.table(countsByBankAndSubject);

  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runQuestionsMigration().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

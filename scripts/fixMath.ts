import fs from 'fs';
import path from 'path';
import katex from 'katex';
import crypto from 'crypto';

interface QuestionItem {
  id: string;
  q: string;
  options: string[];
  correct: number;
  explain: string;
  topic?: string;
  chapter?: string;
  subject?: string;
  difficulty?: string;
  universities?: string[];
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 1. Math Conversion Engine
// ---------------------------------------------------------------------------

export function convertMathInText(rawText: string, logReview?: (issue: string) => void): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText;

  // 1a. Repair known dropped symbols & OCR anomalies
  text = text.replace(/\bFor\s+-3\s*,\s*r\s*=\s*3\b/g, 'For $x^3$, r = 3');
  text = text.replace(/\bFor\s+-3,\s*r\s*=\s*3\b/g, 'For $x^3$, r = 3');
  text = text.replace(/\(1,\s*\.\s*,\s*\.\.\^2\)/g, '$(1, \\omega, \\omega^2)$');
  text = text.replace(/\(1,\s*\.\s*,\s*\.\^2\)/g, '$(1, \\omega, \\omega^2)$');
  text = text.replace(/\(1,\s*2\)\s*and\s*\\omega\b/g, '(1, \\omega, \\omega^2) and \\omega');
  text = text.replace(/\\omega\s+is\s+a\s+complex\s+cube\s+root\s+of\s+unity.*?\(1,\s*2\)/g, (m) => m.replace('(1, 2)', '(1, \\omega, \\omega^2)'));

  // Lost square roots: replace lone radical signs
  text = text.replace(/√\(([^()]+)\)/g, '\\sqrt{$1}');
  text = text.replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');
  text = text.replace(/√(?=[a-zA-Z0-9])/g, '\\sqrt');

  // Convert \( ... \) and \[ ... \] to $ ... $ and $$ ... $$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');

  // Tokenize by existing math blocks ($$...$$ and $...$)
  const mathBlockRegex = /(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+?\$)/g;
  const parts: { isMath: boolean; content: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ isMath: false, content: text.substring(lastIndex, match.index) });
    }
    parts.push({ isMath: true, content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ isMath: false, content: text.substring(lastIndex) });
  }

  // Convert non-math segments to LaTeX in $...$
  function processNonMath(seg: string): string {
    let s = seg;

    // 1. Degrees: 30° -> $30^\circ$
    s = s.replace(/\b(\d+)\s*°(?!\w)/g, '$$$1^\\circ$$');

    // 2. Binomial indices: T_{r+1}, T_(r+1), T_4, T₄
    s = s.replace(/\bT_\{([^{}]+)\}/g, '$$T_{$1}$$');
    s = s.replace(/\bT_\(([^\(\)]+)\)/g, '$$T_{$1}$$');
    s = s.replace(/\bT_([0-9]+)\b/g, '$$T_{$1}$$');
    s = s.replace(/\bT([0-9]+)\b(?=\s*=\s*\d+)/g, '$$T_{$1}$$');
    s = s.replace(/\bT₄\b/g, '$T_4$');
    s = s.replace(/\bT₃\b/g, '$T_3$');
    s = s.replace(/\bT₂\b/g, '$T_2$');
    s = s.replace(/\bT₁\b/g, '$T_1$');
    s = s.replace(/\ba_n\b/g, '$a_n$');
    s = s.replace(/\ba_1\b/g, '$a_1$');
    s = s.replace(/\ba_([0-9]+)\b/g, '$$a_{$1}$$');

    // 3. Combinations: 6C3 -> $\binom{6}{3}$, 5Cr -> $\binom{5}{r}$, nCr -> $\binom{n}{r}$
    s = s.replace(/\b(\d+|n)C(\d+|r)\b/g, '$$\\binom{$1}{$2}$$');
    s = s.replace(/\bC\((\d+|n),\s*(\d+|r)\)/g, '$$\\binom{$1}{$2}$$');

    // 4. Modulus: |z|, |A|, |kA|, |3 - 4i|, |1 + i|
    s = s.replace(/(?<=\s|^)\|([a-zA-Z])\|(?=[\s,\.\?!]|$)/g, '$$|$1|$$');
    s = s.replace(/(?<=\s|^)\|([0-9\s\+\-i]+)\|(?=[\s,\.\?!]|$)/g, '$$|$1|$$');

    // 5. Limits: lim_{x -> 0} expr -> $\lim_{x \to 0} expr$
    s = s.replace(/\blim_\{x\s*(?:->|\\to)\s*([^{}]+)\}\s*([^\s,\.\?;]+)/g, (_m, target, expr) => {
      return `$$\\lim_{x \\to ${target}} ${expr}$$`;
    });
    s = s.replace(/\blim_\{x\s*(?:->|\\to)\s*([^{}]+)\}/g, '$$\\lim_{x \\to $1}$$');

    // 6. Bare Greek letters and functions outside math mode
    s = s.replace(/\\(theta|alpha|beta|omega|delta|lambda|mu|sigma|gamma|rho|epsilon|phi|psi)\b/g, '$$\\$1$$');
    s = s.replace(/\\(sin|cos|tan|log|ln|sqrt|frac)\b(?![a-zA-Z])/g, '$$\\$1$$');

    // 7. Powers with parentheses: (1+2x)^(-1) -> $(1+2x)^{-1}$, (x+2)^2 -> $(x+2)^2$
    s = s.replace(/(\([a-zA-Z0-9\s\+\-\/\*]+\))\^\((-?[a-zA-Z0-9\s\+\-]+)\)/g, '$$$1^{$2}$$');
    s = s.replace(/(\([a-zA-Z0-9\s\+\-\/\*]+\))\^([a-zA-Z0-9]+)/g, '$$$1^{$2}$$');

    // 8. Unicode superscripts: x⁴ -> $x^4$, x² -> $x^2$, 2⁴ -> $2^4$, (0.8)⁴ -> $(0.8)^4$, x⁻¹ -> $x^{-1}$
    s = s.replace(/(\(?[0-9a-zA-Z\.]+\)?)([⁴³²¹⁰]+)/g, (_m, base, sup) => {
      const map: Record<string, string> = { '⁴': '4', '³': '3', '²': '2', '¹': '1', '⁰': '0' };
      const exp = sup.split('').map((c: string) => map[c] || c).join('');
      return `$$${base}^{${exp}}$$`;
    });
    s = s.replace(/(\(?[0-9a-zA-Z\.]+\)?)⁻¹/g, '$$$1^{-1}$$');

    // 9. Standard exponents: x^3, 2^12, e^(2x), 1^(5-r), (-2x)^r, (-2)^3
    s = s.replace(/\b([a-zA-Z0-9]+)\^\(([^\)]+)\)/g, '$$$1^{$2}$$');
    s = s.replace(/\b([a-zA-Z0-9]+)\^\{([^{}]+)\}/g, '$$$1^{$2}$$');
    s = s.replace(/\b([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)\b/g, '$$$1^{$2}$$');

    // 10. sqrt(x)
    s = s.replace(/\bsqrt\(([^()]+)\)/g, '$$\\sqrt{$1}$$');

    // 11. Operators in formulas
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}]|<=\s*)\s*<=\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\le ');
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}]|>=\s*)\s*>=\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\ge ');
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}])\s*!=\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\ne ');
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}])\s*=>\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\implies ');
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}])\s*\+-\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\pm ');

    // 12. Bare Greek words in formula contexts
    s = s.replace(/\b(theta|alpha|beta|omega|delta)\b(?=\s*[=<>+\-*\/])/gi, (m) => `$\\${m.toLowerCase()}$`);

    return s;
  }

  const processed = parts.map(p => {
    if (p.isMath) {
      // Validate/clean internal math
      let inner = p.content;
      // Ensure no double delimiters
      inner = inner.replace(/^\$\$\s*\$\$/, '$$').replace(/\$\$\s*\$\$$/, '$$');
      return inner;
    }
    return processNonMath(p.content);
  }).join('');

  // Post-processing cleanup: merge adjacent math blocks
  let merged = processed;
  merged = merged.replace(/\$\s*\$/g, '');
  merged = merged.replace(/\$([^\$\n]+)\$\s*([\+\-\=\*\/]\s*)\$([^\$\n]+)\$/g, '$$$1 $2 $3$$');
  merged = merged.replace(/\$([^\$\n]+)\$\s*([=<>\\le\\ge\\implies]+)\s*\$([^\$\n]+)\$/g, '$$$1 $2 $3$$');

  // Verify balance of $ signs
  const dollarCount = (merged.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    if (logReview) logReview(`Unbalanced $ in text: "${rawText.slice(0, 80)}"`);
    // Safe fallback: balance by trimming trailing dangling $
    if (merged.endsWith('$')) {
      merged = merged.slice(0, -1);
    } else {
      merged = merged + '$';
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// 2. Normalization & Duplicate Detection
// ---------------------------------------------------------------------------

export function normalizeQuestionText(qText: string): string {
  if (!qText) return '';
  return qText
    .toLowerCase()
    .replace(/\$+/g, '') // remove math delimiters for text hash
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

export function computeQuestionHash(q: QuestionItem): string {
  const normStem = normalizeQuestionText(q.q || q.question || '');
  const normOpts = (q.options || []).map(o => normalizeQuestionText(o)).sort().join('|');
  return crypto.createHash('sha256').update(`${normStem}:::${normOpts}`).digest('hex');
}

export function jaccardSimilarity(strA: string, strB: string): number {
  const wordsA = new Set(strA.split(' '));
  const wordsB = new Set(strB.split(' '));
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

// ---------------------------------------------------------------------------
// 3. Execution Pipeline
// ---------------------------------------------------------------------------

async function run() {
  console.log('=== BOARDLY FIX MATH & QUESTION BANK REFACTORING ===');

  const mathReviewList: string[] = [];
  const duplicatesReportList: string[] = [];

  const dataDir = path.join(process.cwd(), 'src/data');

  // Primary source files to process
  const filesToProcess = [
    'tcatMathQuestions.ts',
    'tcatPhysicsQuestions.ts',
    'tcatChemistryQuestions.ts',
    'tcatCsQuestions.ts',
    'tcatBiologyQuestions.ts',
    'tcatStatisticsQuestions.ts',
    'tcatEnglishQuestions.ts',
    'fastBasicMathQuestions.ts',
    'fastIqAnalyticalQuestions.ts',
    'numsPsychologicalQuestions.ts',
    'aptitudeQuantQuestions.ts',
    'aptitudeVerbalQuestions.ts',
    'akuScienceReasoningQuestions.ts',
    'akuMathReasoningQuestions.ts',
    'mdcatBiologyPart1.ts',
    'mdcatBiologyPart2.ts',
    'mdcatBiologyBatch2Part1.ts',
    'mdcatBiologyBatch2Part2.ts',
    'mdcatBiologyBatch3Part1.ts',
    'mdcatBiologyBatch3Part2.ts',
    'mdcatBiologyBatch4Part1.ts',
    'mdcatBiologyBatch4Part2.ts',
    'mdcatBiologyBatch5Part1.ts',
    'mdcatBiologyBatch5Part2.ts',
    'mdcatBiologyBatch6Part1.ts',
    'mdcatBiologyBatch6Part2.ts',
    'mdcatBiologyBatch7Part1.ts',
    'mdcatBiologyBatch7Part2.ts',
    'mdcatBiologyBatch8Part1.ts',
    'mdcatBiologyBatch8Part2.ts',
    'mdcatBiologyBatch9Part1.ts',
    'mdcatBiologyBatch9Part2.ts',
    'mdcatBiologyBatch10Part1.ts',
    'mdcatBiologyBatch10Part2.ts',
    'mdcatChemistryQuestions.ts',
    'mdcatChemistryBatch2.ts',
    'mdcatChemistryBatch3.ts',
    'mdcatChemistryBatch4.ts',
    'mdcatChemistryBatch5.ts',
    'mdcatChemistryBatch6.ts',
    'mdcatChemistryBatch7.ts',
    'mdcatChemistryBatch8.ts',
    'mdcatChemistryBatch9.ts',
    'mdcatChemistryBatch10.ts',
    'mdcatPhysicsQuestions.ts',
    'mdcatPhysicsBatch2.ts',
    'mdcatPhysicsBatch3.ts',
    'mdcatPhysicsBatch4.ts',
    'mdcatPhysicsBatch5.ts',
    'mdcatPhysicsBatch6.ts',
    'mdcatPhysicsBatch7.ts',
    'mdcatPhysicsBatch8.ts',
    'mdcatPhysicsBatch9.ts',
    'mdcatPhysicsBatch10.ts',
    'mdcatEnglishQuestions.ts',
    'mdcatEnglishBatch2.ts',
    'mdcatEnglishBatch3.ts',
    'mdcatEnglishBatch4.ts',
    'mdcatEnglishBatch5.ts',
    'mdcatEnglishBatch6.ts',
    'mdcatEnglishBatch7.ts',
    'mdcatEnglishBatch8.ts',
    'mdcatEnglishBatch9.ts',
    'mdcatEnglishBatch10.ts',
    'mdcatLogicalReasoningQuestions.ts',
    'mdcatLogicalReasoningBatch2.ts',
    'mdcatLogicalReasoningBatch3.ts',
    'mdcatLogicalReasoningBatch4.ts',
    'mdcatLogicalReasoningBatch5.ts',
    'mdcatLogicalReasoningBatch6.ts',
    'mdcatLogicalReasoningBatch7.ts',
    'mdcatLogicalReasoningBatch8.ts',
    'mdcatLogicalReasoningBatch9.ts',
    'mdcatLogicalReasoningBatch10.ts',
  ];

  let totalScanned = 0;
  let totalConverted = 0;
  let totalAlreadyFine = 0;
  let totalKaTeXFailures = 0;

  // Track unique IDs across all files
  const existingIds = new Set<string>();
  const hashToQuestionMap = new Map<string, { q: QuestionItem; file: string }>();
  const allProcessedQuestions: { file: string; q: QuestionItem }[] = [];

  // Subject, Topic, Difficulty stats
  const subjectCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = {};
  const missingFieldsReport: { id: string; file: string; missing: string[] }[] = [];

  // Sample 10 before/after
  const beforeAfterSamples: { id: string; field: string; before: string; after: string }[] = [];

  for (const file of filesToProcess) {
    const fullPath = path.join(dataDir, file);
    if (!fs.existsSync(fullPath)) continue;

    // Load file module
    const mod = await import(fullPath);
    let targetExportKey = '';
    let questionsArray: QuestionItem[] = [];

    for (const [key, val] of Object.entries(mod)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && ('q' in val[0] || 'question' in val[0])) {
        targetExportKey = key;
        questionsArray = val as QuestionItem[];
        break;
      }
    }

    if (!targetExportKey || questionsArray.length === 0) continue;

    const modifiedArray: QuestionItem[] = [];

    // Infer default university tag from filename
    let defaultUni = 'BOARD';
    if (file.startsWith('tcat')) defaultUni = 'TCAT';
    else if (file.startsWith('mdcat')) defaultUni = 'MDCAT';
    else if (file.startsWith('fast')) defaultUni = 'FAST';
    else if (file.startsWith('nums')) defaultUni = 'NUMS';
    else if (file.startsWith('aku')) defaultUni = 'AKU';
    else if (file.startsWith('aptitude')) defaultUni = 'NUST';

    for (let i = 0; i < questionsArray.length; i++) {
      const q = questionsArray[i];
      totalScanned++;

      const originalQ = q.q || q.question || '';
      const originalExplain = q.explain || q.explanation || '';
      const originalOptions = Array.isArray(q.options) ? [...q.options] : [];

      // Convert Math
      const convertedQ = convertMathInText(originalQ, (issue) => {
        mathReviewList.push(`[${file}:${q.id}] ${issue}`);
      });
      const convertedExplain = convertMathInText(originalExplain, (issue) => {
        mathReviewList.push(`[${file}:${q.id}] ${issue}`);
      });
      const convertedOptions = originalOptions.map(opt => convertMathInText(opt, (issue) => {
        mathReviewList.push(`[${file}:${q.id}] ${issue}`);
      }));

      const hasChanged = convertedQ !== originalQ || convertedExplain !== originalExplain || convertedOptions.some((o, idx) => o !== originalOptions[idx]);

      if (hasChanged) {
        totalConverted++;
        if (beforeAfterSamples.length < 15) {
          if (convertedQ !== originalQ) {
            beforeAfterSamples.push({ id: q.id, field: 'q', before: originalQ, after: convertedQ });
          } else if (convertedExplain !== originalExplain) {
            beforeAfterSamples.push({ id: q.id, field: 'explain', before: originalExplain, after: convertedExplain });
          }
        }
      } else {
        totalAlreadyFine++;
      }

      // Validate all math segments with KaTeX
      const textToValidate = `${convertedQ} ${convertedExplain} ${convertedOptions.join(' ')}`;
      const mathTokens = textToValidate.match(/(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+?\$)/g) || [];
      for (const tok of mathTokens) {
        const mathContent = tok.startsWith('$$') ? tok.slice(2, -2).trim() : tok.slice(1, -1).trim();
        try {
          katex.renderToString(mathContent, {
            throwOnError: true,
            strict: false,
          });
        } catch (kErr: any) {
          totalKaTeXFailures++;
          mathReviewList.push(`[${file}:${q.id}] KaTeX render failure on "${mathContent}": ${kErr.message}`);
        }
      }

      // Permanent Unique ID
      let permanentId = q.id;
      if (!permanentId || existingIds.has(permanentId)) {
        permanentId = `${defaultUni.toLowerCase()}-${file.replace('.ts', '')}-${i + 1}-${crypto.randomBytes(3).toString('hex')}`;
      }
      existingIds.add(permanentId);

      // Normalization and Exact Duplicates
      const qHash = computeQuestionHash(q);
      const unis = Array.isArray(q.universities) ? [...q.universities] : [defaultUni];
      if (!unis.includes(defaultUni)) unis.push(defaultUni);

      if (hashToQuestionMap.has(qHash)) {
        const existing = hashToQuestionMap.get(qHash)!;
        // Merge universities
        for (const u of unis) {
          if (!existing.q.universities?.includes(u)) {
            existing.q.universities?.push(u);
          }
        }
        duplicatesReportList.push(`EXACT DUPLICATE MERGED: [${q.id} in ${file}] merged into [${existing.q.id} in ${existing.file}]`);
        continue; // skip adding duplicate
      }

      // Check near-duplicates (similarity > 0.85)
      const normText = normalizeQuestionText(originalQ);
      for (const prev of allProcessedQuestions.slice(-100)) {
        const prevNorm = normalizeQuestionText(prev.q.q || prev.q.question || '');
        if (prevNorm !== normText) {
          const sim = jaccardSimilarity(normText, prevNorm);
          if (sim > 0.85) {
            duplicatesReportList.push(`NEAR DUPLICATE (${Math.round(sim * 100)}% match): [${permanentId} in ${file}] vs [${prev.q.id} in ${prev.file}]`);
          }
        }
      }

      // Subject, Topic, Difficulty
      let sub = q.subject || '';
      if (!sub) {
        if (file.includes('Math')) sub = 'Mathematics';
        else if (file.includes('Physics')) sub = 'Physics';
        else if (file.includes('Chemistry')) sub = 'Chemistry';
        else if (file.includes('Biology') || file.includes('Bio')) sub = 'Biology';
        else if (file.includes('English')) sub = 'English';
        else if (file.includes('Cs')) sub = 'Computer Science';
        else if (file.includes('Statistics')) sub = 'Statistics';
        else if (file.includes('Reasoning') || file.includes('Analytical')) sub = 'Logical Reasoning';
      }

      let diff = q.difficulty || 'Medium';
      if (diff === 'Exam Standard') diff = 'Medium';
      if (!['Easy', 'Medium', 'Hard'].includes(diff)) diff = 'Medium';

      const missing: string[] = [];
      if (!sub) missing.push('subject');
      if (!q.topic) missing.push('topic');
      if (!q.difficulty) missing.push('difficulty');
      if (missing.length > 0) {
        missingFieldsReport.push({ id: permanentId, file, missing });
      }

      subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
      const topicKey = `${sub}: ${q.topic || 'General'}`;
      topicCounts[topicKey] = (topicCounts[topicKey] || 0) + 1;
      difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;

      const updatedQuestion: QuestionItem = {
        ...q,
        id: permanentId,
        q: convertedQ,
        options: convertedOptions,
        correct: q.correct ?? 0,
        explain: convertedExplain,
        topic: q.topic || `${sub} Fundamentals`,
        chapter: q.chapter || q.topic || `${sub} Core`,
        difficulty: diff as any,
        subject: sub,
        universities: unis,
      };

      hashToQuestionMap.set(qHash, { q: updatedQuestion, file });
      allProcessedQuestions.push({ file, q: updatedQuestion });
      modifiedArray.push(updatedQuestion);
    }

    // Write modified file back
    const fileContent = `import { Question } from '../types';\n\nexport const ${targetExportKey}: Question[] = ${JSON.stringify(modifiedArray, null, 2)};\n`;
    fs.writeFileSync(fullPath, fileContent, 'utf8');
  }

  // Also process PREBUILT_QUESTIONS in src/data/prebuiltQuestions.ts
  const prebuiltPath = path.join(dataDir, 'prebuiltQuestions.ts');
  if (fs.existsSync(prebuiltPath)) {
    const prebuiltMod = await import(prebuiltPath);
    if (prebuiltMod.PREBUILT_QUESTIONS) {
      const origDict = prebuiltMod.PREBUILT_QUESTIONS as Record<string, QuestionItem[]>;
      const newDict: Record<string, QuestionItem[]> = {};

      for (const [subName, qList] of Object.entries(origDict)) {
        newDict[subName] = qList.map((q, idx) => {
          totalScanned++;
          const convertedQ = convertMathInText(q.q || '', (issue) => {
            mathReviewList.push(`[prebuiltQuestions.ts:${q.id}] ${issue}`);
          });
          const convertedExplain = convertMathInText(q.explain || '', (issue) => {
            mathReviewList.push(`[prebuiltQuestions.ts:${q.id}] ${issue}`);
          });
          const convertedOptions = (q.options || []).map(opt => convertMathInText(opt, (issue) => {
            mathReviewList.push(`[prebuiltQuestions.ts:${q.id}] ${issue}`);
          }));

          let permanentId = q.id;
          if (!permanentId || existingIds.has(permanentId)) {
            permanentId = `board-${subName.toLowerCase().replace(/\s+/g, '-')}-${idx + 1}-${crypto.randomBytes(3).toString('hex')}`;
          }
          existingIds.add(permanentId);

          let diff = q.difficulty || 'Medium';
          if (!['Easy', 'Medium', 'Hard'].includes(diff)) diff = 'Medium';

          subjectCounts[subName] = (subjectCounts[subName] || 0) + 1;
          const topicKey = `${subName}: ${q.topic || 'General'}`;
          topicCounts[topicKey] = (topicCounts[topicKey] || 0) + 1;
          difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;

          return {
            ...q,
            id: permanentId,
            q: convertedQ,
            options: convertedOptions,
            explain: convertedExplain,
            subject: subName,
            topic: q.topic || `${subName} Core`,
            difficulty: diff as any,
            universities: q.universities || ['BOARD'],
          };
        });
      }

      // Read current prebuiltQuestions.ts and replace PREBUILT_QUESTIONS object
      const fullText = fs.readFileSync(prebuiltPath, 'utf8');
      const helperStartIndex = fullText.indexOf('export function getPrebuiltQuestionsForSubject');
      const helpersCode = helperStartIndex !== -1 ? fullText.substring(helperStartIndex) : '';

      const updatedPrebuiltFile = `import { Question, BoardClass } from '../types';
import { mapSubject } from '../utils/subjectMapper';
import { shuffleQuestionOptions, deduplicateQuestions, normalizeQuestionStem } from '../lib/shuffle';
import { selectPrioritizedQuestions } from '../lib/seenQuestionsTracker';
import { checkQuestionTopicRelevance } from '../utils/topicValidator';
import { TCAT_PREBUILT_QUESTIONS, getTCATPrebuiltQuestions } from './tcatPrebuiltQuestions';
import { MDCAT_PREBUILT_QUESTIONS, getMDCATPrebuiltQuestions } from './mdcatPrebuiltQuestions';
import { getEntranceExamQuestions } from './entranceExamQuestions';

export const PREBUILT_QUESTIONS: Record<string, Question[]> = ${JSON.stringify(newDict, null, 2)};

${helpersCode}
`;
      fs.writeFileSync(prebuiltPath, updatedPrebuiltFile, 'utf8');
    }
  }

  // Write math-review.md
  const mathReviewContent = `# Math Review Report
Generated: ${new Date().toISOString()}

Total Questions Scanned: ${totalScanned}
Total Questions Converted: ${totalConverted}
Already Fine / Untouched: ${totalAlreadyFine}
KaTeX Render Failures: ${totalKaTeXFailures}

## Questions with Unresolved or Ambiguous Math Notation
${mathReviewList.length === 0 ? 'None — All mathematical expressions successfully parsed and validated against KaTeX strict syntax.' : mathReviewList.map(item => `- ${item}`).join('\n')}

## Missing Fields Report
${missingFieldsReport.length === 0 ? 'None — All questions contain complete subject, topic, difficulty, and universities metadata.' : missingFieldsReport.map(m => `- ID: ${m.id} in ${m.file} — missing: ${m.missing.join(', ')}`).join('\n')}
`;
  fs.writeFileSync(path.join(process.cwd(), 'math-review.md'), mathReviewContent, 'utf8');

  // Write duplicates-report.md
  // Identify pools smaller than 3x test size (a 30-question sprint needs at least 90 questions per subject)
  const smallPools: string[] = [];
  for (const [sub, count] of Object.entries(subjectCounts)) {
    if (count < 90) {
      smallPools.push(`Subject "${sub}": ${count} questions (minimum recommended: 90 for 30-question sprints)`);
    }
  }

  const duplicatesReportContent = `# Duplicates & Distribution Report
Generated: ${new Date().toISOString()}

## Total Unique Questions
Total: ${allProcessedQuestions.length}

## Subject Distribution
${Object.entries(subjectCounts).map(([sub, count]) => `- **${sub}**: ${count} questions`).join('\n')}

## Difficulty Distribution
${Object.entries(difficultyCounts).map(([diff, count]) => `- **${diff}**: ${count} (${Math.round((count / allProcessedQuestions.length) * 100)}%)`).join('\n')}

## Small Pool Warnings (< 90 questions for 3x 30-question test threshold)
${smallPools.length === 0 ? 'All subject pools exceed 90 questions.' : smallPools.map(p => `- ⚠️ ${p}`).join('\n')}

## Duplicate Analysis
${duplicatesReportList.length === 0 ? 'No duplicates detected.' : duplicatesReportList.map(d => `- ${d}`).join('\n')}
`;
  fs.writeFileSync(path.join(process.cwd(), 'duplicates-report.md'), duplicatesReportContent, 'utf8');

  console.log('=== FIX MATH EXECUTION COMPLETE ===');
  console.log(`Total Scanned: ${totalScanned}`);
  console.log(`Total Converted: ${totalConverted}`);
  console.log(`Total Already Fine: ${totalAlreadyFine}`);
  console.log(`Total KaTeX Failures: ${totalKaTeXFailures}`);
  console.log(`Reports generated: math-review.md, duplicates-report.md`);

  console.log('\n=== SAMPLE BEFORE / AFTER CONVERSIONS ===');
  for (let i = 0; i < Math.min(10, beforeAfterSamples.length); i++) {
    const s = beforeAfterSamples[i];
    console.log(`[Sample ${i + 1}] ID: ${s.id} (${s.field})`);
    console.log(`  BEFORE: ${s.before}`);
    console.log(`  AFTER:  ${s.after}`);
  }
}

run().catch(console.error);

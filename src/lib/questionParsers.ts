import { validateMath } from '@/components/ui/MathText';
import { findSubjectSlug, findChapterSlug, slugify } from '@/constants/taxonomy';
import type { QuestionDifficulty } from '@/types';

export interface ParsedQuestionCandidate {
  id?: string;
  q: string;
  options: [string, string, string, string];
  correct: number | null; // null if undetected or invalid
  explain: string;
  subject: string;
  chapter: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  source?: string;
  year?: string | number;
  needsReview?: string[];
  errors?: string[];
}

/**
 * Parses letter ('A', 'B', 'C', 'D' or 1..4) into 0..3 index.
 */
export function parseAnswerLetter(raw?: string | null): number | null {
  if (!raw) return null;
  const clean = raw.trim().toUpperCase();
  if (clean === 'A' || clean === '1') return 0;
  if (clean === 'B' || clean === '2') return 1;
  if (clean === 'C' || clean === '3') return 2;
  if (clean === 'D' || clean === '4') return 3;
  return null;
}

/**
 * Extracts end answer key block like:
 * "Answer Key: 1-B, 2-C, 3-A, 4-D" or "1. B, 2. C"
 */
function extractAnswerKeyBlock(text: string): { cleanedText: string; answerKeyMap: Map<number, number> } {
  const answerKeyMap = new Map<number, number>();
  const keyBlockRegex = /(?:Answer\s*Key|Answers|Keys)\s*:\s*([\s\S]+)$/i;
  const match = text.match(keyBlockRegex);

  let cleanedText = text;
  if (match && match.index !== undefined) {
    cleanedText = text.substring(0, match.index).trim();
    const blockContent = match[1];
    // Matches "1-B", "1:B", "1. B", "1) B", "1 B"
    const pairRegex = /(\d+)\s*[-:.)\s]\s*([A-Da-d1-4])/g;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = pairRegex.exec(blockContent)) !== null) {
      const qNum = parseInt(pMatch[1], 10);
      const ansIdx = parseAnswerLetter(pMatch[2]);
      if (ansIdx !== null) {
        answerKeyMap.set(qNum, ansIdx);
      }
    }
  }

  return { cleanedText, answerKeyMap };
}

/**
 * Quick Paste parser:
 * Handles blank-line separated questions:
 *   Q: What is the derivative of $\sin(x)$?
 *   A) $\cos(x)$
 *   B) $-\cos(x)$
 *   C) $\tan(x)$
 *   D) $\sec^2(x)$
 *   Answer: A
 *   Explanation: Derivative of $\sin(x)$ is $\cos(x)$.
 *
 * Accepts options on separate lines or on single lines, various label styles (A., A), (A), a)),
 * numbered questions, and answer key blocks at the end.
 */
export function parseQuickPaste(
  rawText: string,
  defaults: {
    subject?: string;
    chapter?: string;
    difficulty?: QuestionDifficulty;
    source?: string;
  } = {}
): ParsedQuestionCandidate[] {
  if (!rawText || !rawText.trim()) return [];

  const { cleanedText, answerKeyMap } = extractAnswerKeyBlock(rawText.trim());

  // Split into chunks by double newline (blank line)
  const chunks = cleanedText
    .split(/\n\s*\n+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 5);

  const results: ParsedQuestionCandidate[] = [];

  chunks.forEach((chunk, chunkIdx) => {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let questionStem = '';
    const optionsFound: { label: string; text: string }[] = [];
    let detectedAnswer: number | null = null;
    let detectedExplanation = '';
    let questionNumber: number | null = null;

    // Detect question number in header (e.g. "1. ", "Q1: ", "Question 2:")
    const firstLine = lines[0];
    const qNumMatch = firstLine.match(/^(?:Q|Question)?\s*(\d+)[\s.:)-]/i);
    if (qNumMatch) {
      questionNumber = parseInt(qNumMatch[1], 10);
    }

    let i = 0;
    const stemLines: string[] = [];

    // Option start detector regex: A), A., (A), a), (a), a.
    const optionPrefixRegex = /^(?:\(?([A-Da-d])\)|([A-Da-d])\.)\s*(.*)/;
    const inlineOptionsRegex = /(?:^|\s+)(?:\(?([A-Da-d])\)|([A-Da-d])\.)\s+/g;

    while (i < lines.length) {
      const line = lines[i];

      // Check for Answer line
      const ansMatch = line.match(/^(?:Answer|Ans|Correct(?:\s*Answer)?|Key)\s*[:=-]\s*([A-Da-d1-4])/i);
      if (ansMatch) {
        detectedAnswer = parseAnswerLetter(ansMatch[1]);
        i++;
        continue;
      }

      // Check for Explanation line
      const expMatch = line.match(/^(?:Explanation|Explain|Solution|Notes?)\s*[:=-]\s*(.*)/i);
      if (expMatch) {
        const remainingExp = [expMatch[1], ...lines.slice(i + 1)].join(' ').trim();
        detectedExplanation = remainingExp;
        break; // Explanation is usually last
      }

      // Check if line starts an option
      const optMatch = line.match(optionPrefixRegex);
      if (optMatch) {
        const letter = (optMatch[1] || optMatch[2]).toUpperCase();
        let optionText = optMatch[3] || '';

        // Check if subsequent options are packed on the same line (e.g. A) foo B) bar C) baz)
        const parts = line.split(inlineOptionsRegex).filter(Boolean);
        if (parts.length >= 4) {
          // Multiple options on this single line
          for (let p = 0; p < parts.length - 1; p += 2) {
            const pLetter = parts[p].trim().toUpperCase();
            const pText = parts[p + 1].trim();
            if (['A', 'B', 'C', 'D'].includes(pLetter)) {
              optionsFound.push({ label: pLetter, text: pText });
            }
          }
        } else {
          optionsFound.push({ label: letter, text: optionText });
        }
        i++;
        continue;
      }

      // Otherwise, if options haven't started, append to stem
      if (optionsFound.length === 0) {
        // Strip question prefix like "Q1: ", "1. ", "Question: "
        const cleanStemLine = line.replace(/^(?:Q|Question)?\s*\d*[\s.:)-]\s*/i, '');
        stemLines.push(cleanStemLine);
      } else {
        // Multi-line option text
        if (optionsFound.length > 0) {
          optionsFound[optionsFound.length - 1].text += ' ' + line;
        }
      }

      i++;
    }

    questionStem = stemLines.join(' ').trim();

    // Check answer key block if not found inline
    if (detectedAnswer === null && questionNumber !== null && answerKeyMap.has(questionNumber)) {
      detectedAnswer = answerKeyMap.get(questionNumber)!;
    } else if (detectedAnswer === null && answerKeyMap.has(chunkIdx + 1)) {
      detectedAnswer = answerKeyMap.get(chunkIdx + 1)!;
    }

    // Build 4 options array in A, B, C, D order
    const finalOptions: [string, string, string, string] = ['', '', '', ''];
    optionsFound.forEach((opt, idx) => {
      const targetIdx = parseAnswerLetter(opt.label);
      if (targetIdx !== null && targetIdx >= 0 && targetIdx <= 3) {
        finalOptions[targetIdx] = opt.text.trim();
      } else if (idx < 4) {
        finalOptions[idx] = opt.text.trim();
      }
    });

    const needsReview: string[] = [];
    const errors: string[] = [];

    if (!questionStem || questionStem.length < 10) {
      errors.push('Question stem is too short (at least 10 characters required)');
      needsReview.push('Question stem too short');
    }

    if (finalOptions.some((o) => !o || o.trim().length === 0)) {
      errors.push('Missing one or more of the 4 options');
      needsReview.push('Incomplete options');
    }

    const uniqueOptions = new Set(finalOptions.map((o) => o.trim().toLowerCase()));
    if (uniqueOptions.size < 4 && finalOptions.every(Boolean)) {
      errors.push('Options must be 4 distinct choices');
      needsReview.push('Duplicate options');
    }

    if (detectedAnswer === null) {
      errors.push('No correct answer detected');
      needsReview.push('No answer detected');
    }

    // Math validation
    const mathVal = validateMath(questionStem + ' ' + finalOptions.join(' ') + ' ' + detectedExplanation);
    if (!mathVal.ok) {
      errors.push(...mathVal.errors);
      needsReview.push('Broken math formula');
    }

    const sub = defaults.subject || 'mathematics';
    const ch = defaults.chapter || 'general';

    results.push({
      q: questionStem,
      options: finalOptions,
      correct: detectedAnswer,
      explain: detectedExplanation || 'Standard academic solution.',
      subject: sub,
      chapter: ch,
      difficulty: defaults.difficulty || 'medium',
      tags: [sub, ch],
      source: defaults.source || 'Quick Paste',
      needsReview: needsReview.length > 0 ? needsReview : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  });

  return results;
}

/**
 * Standard CSV line tokenizer supporting quotes and commas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Robust CSV Parser:
 * Columns: question, a, b, c, d, answer, explanation, [subject], [chapter], [difficulty], [tags], [source]
 */
export function parseCsvText(
  csvText: string,
  defaults: {
    subject?: string;
    chapter?: string;
    difficulty?: QuestionDifficulty;
    source?: string;
  } = {}
): ParsedQuestionCandidate[] {
  if (!csvText || !csvText.trim()) return [];

  // Parse lines, taking care of multi-line quoted fields
  const rawLines = csvText.split('\n');
  const mergedLines: string[] = [];
  let accumulator = '';
  let quoteCount = 0;

  for (const line of rawLines) {
    for (const char of line) {
      if (char === '"') quoteCount++;
    }
    if (accumulator) accumulator += '\n' + line;
    else accumulator = line;

    if (quoteCount % 2 === 0) {
      if (accumulator.trim()) mergedLines.push(accumulator.trim());
      accumulator = '';
      quoteCount = 0;
    }
  }

  if (mergedLines.length <= 1) return [];

  // Header detection
  const header = parseCsvLine(mergedLines[0]).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''));
  const qIdx = header.findIndex((h) => ['question', 'q', 'stem'].includes(h));
  const aIdx = header.findIndex((h) => ['a', 'optiona', 'opt1'].includes(h));
  const bIdx = header.findIndex((h) => ['b', 'optionb', 'opt2'].includes(h));
  const cIdx = header.findIndex((h) => ['c', 'optionc', 'opt3'].includes(h));
  const dIdx = header.findIndex((h) => ['d', 'optiond', 'opt4'].includes(h));
  const ansIdx = header.findIndex((h) => ['answer', 'ans', 'correct', 'key'].includes(h));
  const expIdx = header.findIndex((h) => ['explanation', 'explain', 'solution'].includes(h));
  const subIdx = header.findIndex((h) => ['subject'].includes(h));
  const chIdx = header.findIndex((h) => ['chapter', 'topic'].includes(h));
  const diffIdx = header.findIndex((h) => ['difficulty', 'level'].includes(h));
  const tagsIdx = header.findIndex((h) => ['tags', 'tag'].includes(h));
  const srcIdx = header.findIndex((h) => ['source'].includes(h));

  const results: ParsedQuestionCandidate[] = [];

  for (let i = 1; i < mergedLines.length; i++) {
    const row = parseCsvLine(mergedLines[i]);
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const stem = qIdx !== -1 ? row[qIdx] : row[0] || '';
    const optA = aIdx !== -1 ? row[aIdx] : row[1] || '';
    const optB = bIdx !== -1 ? row[bIdx] : row[2] || '';
    const optC = cIdx !== -1 ? row[cIdx] : row[3] || '';
    const optD = dIdx !== -1 ? row[dIdx] : row[4] || '';
    const rawAnswer = ansIdx !== -1 ? row[ansIdx] : row[5] || '';
    const explanation = expIdx !== -1 ? row[expIdx] : row[6] || '';

    const rowSubject = (subIdx !== -1 && row[subIdx]) ? findSubjectSlug(row[subIdx]) || row[subIdx] : defaults.subject || 'mathematics';
    const rowChapter = (chIdx !== -1 && row[chIdx]) ? findChapterSlug(rowSubject, row[chIdx]) || slugify(row[chIdx]) : defaults.chapter || 'general';
    const rowDiff = (diffIdx !== -1 && ['easy', 'medium', 'hard'].includes(row[diffIdx]?.toLowerCase()))
      ? (row[diffIdx].toLowerCase() as QuestionDifficulty)
      : defaults.difficulty || 'medium';
    const rowTags = (tagsIdx !== -1 && row[tagsIdx]) ? row[tagsIdx].split(/[;,|]/).map((t) => t.trim()).filter(Boolean) : [rowSubject, rowChapter];
    const rowSource = (srcIdx !== -1 && row[srcIdx]) ? row[srcIdx] : defaults.source || 'CSV Import';

    const parsedCorrect = parseAnswerLetter(rawAnswer);
    const options: [string, string, string, string] = [optA.trim(), optB.trim(), optC.trim(), optD.trim()];

    const errors: string[] = [];
    const needsReview: string[] = [];

    if (!stem || stem.trim().length < 10) {
      errors.push('Question stem is too short');
      needsReview.push('Stem too short');
    }
    if (options.some((o) => !o)) {
      errors.push('Missing one or more of the 4 options');
      needsReview.push('Incomplete options');
    }
    if (parsedCorrect === null) {
      errors.push('Invalid or missing correct answer');
      needsReview.push('No answer detected');
    }

    const mathVal = validateMath(`${stem} ${options.join(' ')} ${explanation}`);
    if (!mathVal.ok) {
      errors.push(...mathVal.errors);
      needsReview.push('Broken math formula');
    }

    results.push({
      q: stem.trim(),
      options,
      correct: parsedCorrect,
      explain: explanation.trim() || 'Standard academic solution.',
      subject: rowSubject,
      chapter: rowChapter,
      difficulty: rowDiff,
      tags: rowTags,
      source: rowSource,
      needsReview: needsReview.length > 0 ? needsReview : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  return results;
}

/**
 * Converts Google Sheet URL into CSV export URL.
 * Example: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?gid=0#gid=0
 * -> https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv&gid=0
 */
export function convertGoogleSheetUrlToCsv(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;

  const sheetId = match[1];
  const gidMatch = url.match(/gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Generates sample CSV template string for admin download.
 */
export function generateCsvTemplate(): string {
  return `question,a,b,c,d,answer,explanation,subject,chapter,difficulty,tags,source
"Evaluate the integral $\\int x e^x dx$ using integration by parts.","$e^x(x - 1) + C$","$e^x(x + 1) + C$","$x e^x + C$","$e^x + C$",A,"Using $\\int u v' = u v - \\int u' v$ with $u=x, v'=e^x$, we obtain $x e^x - e^x + C = e^x(x - 1) + C$.",mathematics,integration-by-parts,medium,"nust;fast",FAST Past Papers 2024
"What is the IUPAC name for acetone?","Propanal","Propanone","Ethanal","Butanone",B,"Acetone consists of a 3-carbon chain with a carbonyl on C2: propan-2-one (propanone).",chemistry,aldehydes-and-ketones,easy,"mdcat;chemistry",PMDC Entrance Prep
"Which data structure operates on a First-In-First-Out (FIFO) basis?","Stack","Queue","Binary Search Tree","Hash Map",B,"A queue inserts elements at the rear and removes from the front (FIFO).",computer-science,data-structures-and-algorithms,easy,"fast;cs",FAST CS 2023`;
}

/**
 * Generates sample JSON template string for advanced JSON import.
 */
export function generateJsonTemplate(): string {
  return JSON.stringify(
    [
      {
        q: "What is the work done by a centripetal force on an object moving in a circle of radius $R$?",
        options: ["$F \\cdot 2\\pi R$", "$0\\text{ J}$", "$\\frac{1}{2}mv^2$", "$F \\cdot R$"],
        correct: 1,
        explain: "The centripetal force is always perpendicular to the displacement vector ($\\theta = 90^\\circ$). Thus, $W = F d \\cos(90^\\circ) = 0\\text{ J}$.",
        subject: "physics",
        chapter: "work-energy-and-power",
        difficulty: "easy",
        tags: ["nust", "physics", "mechanics"],
        source: "NUST NET Engineering 2024"
      },
      {
        q: "Find the limit: $\\lim_{x \\to 0} \\frac{\\sin(5x)}{x}$.",
        options: ["$0$", "$1$", "$5$", "Does not exist"],
        correct: 2,
        explain: "Using the standard limit $\\lim_{u \\to 0} \\frac{\\sin(u)}{u} = 1$: $\\lim_{x \\to 0} 5 \\cdot \\frac{\\sin(5x)}{5x} = 5(1) = 5$.",
        subject: "mathematics",
        chapter: "calculus-and-derivatives",
        difficulty: "easy",
        tags: ["fast", "nust", "math"],
        source: "FAST-NUCES Past Papers"
      }
    ],
    null,
    2
  );
}

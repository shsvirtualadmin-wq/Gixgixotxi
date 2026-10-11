import fs from 'fs';
import path from 'path';
import katex from 'katex';
import { normalizeBoardyMath, renderMath, convertLatexToReadableText } from '../src/lib/boardyMath.js';
import { TCAT_MATH_QUESTIONS } from '../src/data/tcatMathQuestions.js';
import { TCAT_PHYSICS_QUESTIONS } from '../src/data/tcatPhysicsQuestions.js';
import { TCAT_CHEMISTRY_QUESTIONS } from '../src/data/tcatChemistryQuestions.js';
import { TCAT_CS_QUESTIONS } from '../src/data/tcatCsQuestions.js';
import { TCAT_ENGLISH_QUESTIONS } from '../src/data/tcatEnglishQuestions.js';
import { TCAT_STATISTICS_QUESTIONS } from '../src/data/tcatStatisticsQuestions.js';
import { FAST_BASIC_MATH_QUESTIONS } from '../src/data/fastBasicMathQuestions.js';
import { FAST_IQ_ANALYTICAL_QUESTIONS } from '../src/data/fastIqAnalyticalQuestions.js';
import { APTITUDE_QUANT_QUESTIONS, APTITUDE_VERBAL_QUESTIONS, AKU_SCIENCE_REASONING_QUESTIONS, AKU_MATH_REASONING_QUESTIONS } from '../src/data/aptitudeAndReasoningQuestions.js';
import { NUMS_PSYCHOLOGICAL_QUESTIONS } from '../src/data/numsPsychologicalQuestions.js';
import { ALL_MDCAT_QUESTIONS } from '../src/data/mdcatPrebuiltQuestions.js';

interface ScannedQuestion {
  id: string;
  q: string;
  options: string[];
  correct: number;
  explain: string;
  topic?: string;
  chapter?: string;
  subject?: string;
  difficulty?: string;
  repairedFields?: string[];
  fallbackToPlainText?: boolean;
  status: 'valid' | 'auto-repaired' | 'plain-text-fallback' | 'broken';
}

function scanQuestions() {
  console.log('====================================================');
  console.log('BOARDLY QUESTION BANK MATHEMATICAL SCANNER');
  console.log('====================================================\n');

  const questionPools: { name: string; questions: any[] }[] = [
    { name: 'TCAT Math', questions: TCAT_MATH_QUESTIONS || [] },
    { name: 'TCAT Physics', questions: TCAT_PHYSICS_QUESTIONS || [] },
    { name: 'TCAT Chemistry', questions: TCAT_CHEMISTRY_QUESTIONS || [] },
    { name: 'TCAT CS', questions: TCAT_CS_QUESTIONS || [] },
    { name: 'TCAT English', questions: TCAT_ENGLISH_QUESTIONS || [] },
    { name: 'TCAT Statistics', questions: TCAT_STATISTICS_QUESTIONS || [] },
    { name: 'FAST Basic Math', questions: FAST_BASIC_MATH_QUESTIONS || [] },
    { name: 'FAST IQ & Analytical', questions: FAST_IQ_ANALYTICAL_QUESTIONS || [] },
    { name: 'Aptitude Quant', questions: APTITUDE_QUANT_QUESTIONS || [] },
    { name: 'Aptitude Verbal', questions: APTITUDE_VERBAL_QUESTIONS || [] },
    { name: 'AKU Science Reasoning', questions: AKU_SCIENCE_REASONING_QUESTIONS || [] },
    { name: 'AKU Math Reasoning', questions: AKU_MATH_REASONING_QUESTIONS || [] },
    { name: 'NUMS Psychological', questions: NUMS_PSYCHOLOGICAL_QUESTIONS || [] },
    { name: 'MDCAT Core Questions', questions: ALL_MDCAT_QUESTIONS || [] },
  ];

  // Optional: load past_papers.json if exists
  const pastPapersPath = path.join(process.cwd(), 'data', 'past_papers.json');
  if (fs.existsSync(pastPapersPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(pastPapersPath, 'utf8'));
      if (Array.isArray(data)) {
        questionPools.push({ name: 'Past Papers JSON', questions: data });
      }
    } catch {}
  }

  const allQuestionsMap = new Map<string, any>();
  for (const pool of questionPools) {
    if (Array.isArray(pool.questions)) {
      for (const q of pool.questions) {
        if (q && q.id) {
          if (!allQuestionsMap.has(q.id)) {
            allQuestionsMap.set(q.id, q);
          }
        }
      }
    }
  }

  const totalQuestions = allQuestionsMap.size;
  console.log(`Total unique questions found across question banks: ${totalQuestions}\n`);

  let autoRepairedCount = 0;
  let fallbackCount = 0;
  const brokenQuestionIds: string[] = [];
  const cleanedQuestions: ScannedQuestion[] = [];

  for (const [id, original] of allQuestionsMap.entries()) {
    const rawQ = original.q || original.question || '';
    const rawOptions: string[] = Array.isArray(original.options) ? [...original.options] : [];
    const rawExplain = original.explain || original.explanation || '';

    let wasRepaired = false;
    let fallbackNeeded = false;
    const repairedFields: string[] = [];

    // Test Question Stem
    const cleanedQ = normalizeBoardyMath(rawQ);
    if (cleanedQ !== rawQ) {
      wasRepaired = true;
      repairedFields.push('question');
    }
    const htmlQ = renderMath(rawQ);
    if (htmlQ.includes('katex-fallback')) {
      fallbackNeeded = true;
    }

    // Test Options
    const cleanedOptions: string[] = [];
    rawOptions.forEach((opt, idx) => {
      const cleanedOpt = normalizeBoardyMath(opt);
      if (cleanedOpt !== opt) {
        wasRepaired = true;
        repairedFields.push(`option_${idx}`);
      }
      cleanedOptions.push(cleanedOpt);
      const htmlOpt = renderMath(opt);
      if (htmlOpt.includes('katex-fallback')) {
        fallbackNeeded = true;
      }
    });

    // Test Explanation
    const cleanedExplain = normalizeBoardyMath(rawExplain);
    if (cleanedExplain !== rawExplain) {
      wasRepaired = true;
      repairedFields.push('explanation');
    }
    const htmlExp = renderMath(rawExplain);
    if (htmlExp.includes('katex-fallback')) {
      fallbackNeeded = true;
    }

    if (wasRepaired) autoRepairedCount++;
    if (fallbackNeeded) fallbackCount++;

    // Check if still broken after repair (e.g. contains raw unparsed LaTeX error tags)
    const isBroken = htmlQ.includes('katex-error') || cleanedOptions.some(o => renderMath(o).includes('katex-error'));
    if (isBroken) {
      brokenQuestionIds.push(id);
    }

    cleanedQuestions.push({
      id,
      q: cleanedQ,
      options: cleanedOptions,
      correct: original.correct ?? original.answer ?? 0,
      explain: cleanedExplain,
      topic: original.topic || '',
      chapter: original.chapter || '',
      subject: original.subject || '',
      difficulty: original.difficulty || 'Exam Standard',
      repairedFields,
      fallbackToPlainText: fallbackNeeded,
      status: isBroken ? 'broken' : fallbackNeeded ? 'plain-text-fallback' : wasRepaired ? 'auto-repaired' : 'valid',
    });
  }

  // Save cleaned questions to data/questions.cleaned.json
  const outDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'questions.cleaned.json');
  fs.writeFileSync(outPath, JSON.stringify(cleanedQuestions, null, 2), 'utf8');

  console.log('----------------------------------------------------');
  console.log(`Total questions scanned: ${totalQuestions}`);
  console.log(`Auto-repaired math/delimiters: ${autoRepairedCount}`);
  console.log(`Fell back to clean plain text: ${fallbackCount}`);
  console.log(`Still broken: ${brokenQuestionIds.length}`);
  if (brokenQuestionIds.length > 0) {
    console.log(`First ${Math.min(100, brokenQuestionIds.length)} broken question IDs:`);
    console.log(brokenQuestionIds.slice(0, 100).join(', '));
  } else {
    console.log('First 100 broken IDs: None — all questions rendered as clean KaTeX math or clean readable text.');
  }
  console.log(`\nCleaned questions exported to: ${outPath}`);
  console.log('----------------------------------------------------\n');
}

scanQuestions();

/**
 * Boardy AI Tutor Configuration
 * Primary model ID upgraded to the newest stable Gemini Flash model (gemini-3.8-flash)
 * Supports environment override via GEMINI_BOARDY_MODEL or VITE_GEMINI_MODEL.
 */

export const BOARDY_DEFAULT_MODEL = 'gemini-3.8-flash';
export const BOARDY_FALLBACK_MODEL = 'gemini-3.5-flash';

export function getBoardyModel(): string {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.GEMINI_BOARDY_MODEL) return process.env.GEMINI_BOARDY_MODEL;
    if (process.env.VITE_GEMINI_MODEL) return process.env.VITE_GEMINI_MODEL;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    if (metaEnv?.VITE_GEMINI_MODEL) return metaEnv.VITE_GEMINI_MODEL;
    if (metaEnv?.GEMINI_BOARDY_MODEL) return metaEnv.GEMINI_BOARDY_MODEL;
  }
  return BOARDY_DEFAULT_MODEL;
}

export type BoardyMode = 'deep-dive' | 'quick-take' | 'study-pal' | 'game-plan';

export interface BoardyModeInfo {
  id: BoardyMode;
  name: string;
  tagline: string;
  description: string;
}

export const BOARDY_MODES: BoardyModeInfo[] = [
  {
    id: 'deep-dive',
    name: 'Deep Dive',
    tagline: 'Step-by-step teaching',
    description: 'Thorough step-by-step teaching (use full step-by-step format for real questions).',
  },
  {
    id: 'quick-take',
    name: 'Quick Take',
    tagline: '3 sentences + answer',
    description: 'At most 3 sentences plus the final answer.',
  },
  {
    id: 'study-pal',
    name: 'Study Pal',
    tagline: 'Friendly & short',
    description: 'Friendly, encouraging, short messages.',
  },
  {
    id: 'game-plan',
    name: 'Game Plan',
    tagline: 'Exam strategy & tactics',
    description: 'Exam strategy, time per question, negative marking, elimination tricks, and target test.',
  },
];

export function buildBoardySystemPrompt(
  mode: BoardyMode = 'deep-dive',
  targetExam: string = '',
  studentName: string = 'Student'
): string {
  const examContext = targetExam ? targetExam.trim() : 'Pakistani Board & University Entrance Exams (NUST, FAST, MDCAT, GIKI, ECAT)';
  const name = studentName ? studentName.trim() : 'Student';

  const baseInstructions = `You are Boardy, the 24/7 AI test preparation partner for Boardly students in Pakistan.
Student's Name: ${name}
Target Test / Focus: ${examContext}

CRITICAL MATHEMATICAL & LATEX FORMATTING RULES:
- Use $...$ inline for math formulas and expressions.
- Use $$...$$ on their own separate lines for display math blocks.
- NEVER put math inside markdown code blocks or code fences (\`\`\` or \`).
- NEVER use \\( ... \\) or \\[ ... \\].
- NEVER write \\displaystyle outside of math delimiters.
- Ensure all fractions (\\frac), limits (\\lim), roots (\\sqrt), matrices (pmatrix), and integrals (\\int) are rendered in standard LaTeX with matching curly braces.

CORE PEDAGOGICAL RULES:
- Greeting Handling: If the student says "Hello", "Hi", "Assalam o Alaikum", or asks a casual greeting, respond warmly and naturally in 1-2 friendly sentences. Ask what concept, question, or past paper they want to tackle today. NEVER output generic math templates, problem outlines, or dummy step-by-step frameworks for simple greetings!
- No Generic Templates or Boilerplate: Get straight to the point. No empty fillers like "Here is a breakdown" or "As an AI tutor".
- Real Step-by-Step Only for Real Questions: Break explanations into numbered steps with concise exam tips and trick shortcuts ONLY when answering actual academic questions, numericals, MCQs, or conceptual queries.`;

  let modeSpecificInstruction = '';
  switch (mode) {
    case 'quick-take':
      modeSpecificInstruction = `ACTIVE MODE: Quick Take
- Give at most 3 sentences explaining the core takeaway or mechanism, followed immediately by the final answer or formula.
- Be concise, direct, and crystal clear. Do not provide extended derivations or unnecessary background.`;
      break;

    case 'study-pal':
      modeSpecificInstruction = `ACTIVE MODE: Study Pal
- Speak like a friendly, encouraging, supportive peer study partner.
- Keep responses short, warm, and positive (2 to 4 sentences).
- Celebrate small wins, remove intimidation from difficult concepts, and keep momentum high.`;
      break;

    case 'game-plan':
      modeSpecificInstruction = `ACTIVE MODE: Game Plan
- Focus entirely on competitive test strategy, time per question pacing, negative marking rules, and intelligent elimination tricks.
- Tailor strategy directly to the user's target test (${examContext}).
  * For FAST-NU: Emphasize 1 mark correct vs -0.25 negative marking penalty; only guess if 2 options can be safely eliminated; prioritize Basic Math speed.
  * For NUST NET: Emphasize NO negative marking; attempt every single MCQ; allocate 45-50s per Advance Maths question.
  * For MDCAT: Emphasize Biology accuracy and Chemistry rapid recall.
- Provide practical elimination heuristics (unit checks, edge cases like x=0 or x=1, symmetry).`;
      break;

    case 'deep-dive':
    default:
      modeSpecificInstruction = `ACTIVE MODE: Deep Dive
- Provide thorough step-by-step teaching with derivations, formula proofs, and deep conceptual clarity.
- Break the solution into sequential numbered steps with bold headers.
- Explain common exam traps and distractor options often set by examiners.`;
      break;
  }

  return `${baseInstructions}\n\n${modeSpecificInstruction}`;
}

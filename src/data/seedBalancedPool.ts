export interface BalancedSeedQuestion {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  university: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  q: string;
  question: string;
  options: [string, string, string, string];
  correct: number;
  correctAnswer: number;
  explain: string;
  explanation: string;
}

const CORE_SEED_Templates: Array<{
  subject: string;
  chapter: string;
  university: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  q: string;
  options: [string, string, string, string];
  correct: number;
  explain: string;
}> = [
  {
    subject: 'Mathematics',
    chapter: 'Functions and Limits',
    university: 'FAST-NUCES',
    difficulty: 'Medium',
    q: 'Evaluate $\\lim_{x \\to 0} \\frac{\\sin(5x)}{x}$.',
    options: ['0', '1', '5', '1/5'],
    correct: 2,
    explain: 'Using the standard limit $\\lim_{u \\to 0} \\frac{\\sin u}{u} = 1$, rewrite as $5 \\lim_{x \\to 0} \\frac{\\sin(5x)}{5x} = 5(1) = 5$.',
  },
  {
    subject: 'Mathematics',
    chapter: 'Differentiation',
    university: 'NUST NET',
    difficulty: 'Medium',
    q: 'If $f(x) = x^3 - 6x^2 + 9x + 2$, at which values of $x$ does $f(x)$ have stationary points?',
    options: ['$x = 1, 3$', '$x = -1, -3$', '$x = 0, 3$', '$x = 2, 3$'],
    correct: 0,
    explain: 'Set $f\'(x) = 3x^2 - 12x + 9 = 3(x-1)(x-3) = 0$, giving $x = 1$ and $x = 3$.',
  },
  {
    subject: 'Mathematics',
    chapter: 'Matrices and Determinants',
    university: 'GIKI',
    difficulty: 'Easy',
    q: 'For a $2 \\times 2$ matrix $A = \\begin{pmatrix} 4 & 2 \\\\ 3 & 2 \\end{pmatrix}$, what is $\\det(A)$?',
    options: ['2', '14', '-2', '8'],
    correct: 0,
    explain: '$\\det(A) = (4)(2) - (2)(3) = 8 - 6 = 2$.',
  },
  {
    subject: 'Physics',
    chapter: 'Kinematics',
    university: 'NUST NET',
    difficulty: 'Medium',
    q: 'A projectile is launched at $45^\\circ$ with initial speed $20\\text{ m/s}$ ($g = 10\\text{ m/s}^2$). What is its horizontal range?',
    options: ['20 m', '40 m', '60 m', '80 m'],
    correct: 1,
    explain: 'Range $R = \\frac{v_0^2 \\sin(2\\theta)}{g} = \\frac{400 \\sin(90^\\circ)}{10} = 40\\text{ m}$.',
  },
  {
    subject: 'Physics',
    chapter: 'Current Electricity',
    university: 'FAST-NUCES',
    difficulty: 'Easy',
    q: 'Two resistors of $6\\,\\Omega$ and $3\\,\\Omega$ are connected in parallel. Their equivalent resistance is:',
    options: ['$9\\,\\Omega$', '$2\\,\\Omega$', '$4.5\\,\\Omega$', '$1.5\\,\\Omega$'],
    correct: 1,
    explain: '$R_{eq} = \\frac{R_1 R_2}{R_1 + R_2} = \\frac{18}{9} = 2\\,\\Omega$.',
  },
  {
    subject: 'Physics',
    chapter: 'Work, Power and Energy',
    university: 'UET ECAT',
    difficulty: 'Medium',
    q: 'If the momentum of a body is doubled while its mass remains constant, its kinetic energy becomes:',
    options: ['Twice', 'Four times', 'Half', 'Eight times'],
    correct: 1,
    explain: 'Since $K = \\frac{p^2}{2m}$, doubling $p$ multiplies kinetic energy by $2^2 = 4$.',
  },
  {
    subject: 'Chemistry',
    chapter: 'Chemical Equilibrium',
    university: 'MDCAT',
    difficulty: 'Medium',
    q: 'For the exothermic Haber process $\\text{N}_2 + 3\\text{H}_2 \\rightleftharpoons 2\\text{NH}_3$, high yield of ammonia is favored by:',
    options: [
      'Low temperature and high pressure',
      'High temperature and low pressure',
      'High temperature and high pressure',
      'Low temperature and low pressure',
    ],
    correct: 0,
    explain: 'By Le Chatelier’s principle, fewer moles on the product side favor high pressure, and exothermic forward reaction favors lower temperature.',
  },
  {
    subject: 'Computer Science',
    chapter: 'Data Structures & Algorithms',
    university: 'FAST-NUCES',
    difficulty: 'Easy',
    q: 'What is the worst-case time complexity of binary search on a sorted array of $n$ elements?',
    options: ['$O(n)$', '$O(\\log n)$', '$O(n \\log n)$', '$O(1)$'],
    correct: 1,
    explain: 'Binary search halves the search space on each comparison, yielding $O(\\log n)$ worst-case complexity.',
  },
  {
    subject: 'English',
    chapter: 'Vocabulary & Grammar',
    university: 'LUMS',
    difficulty: 'Easy',
    q: 'Choose the grammatically correct sentence:',
    options: [
      'Neither of the candidates have submitted their form.',
      'Neither of the candidates has submitted his or her form.',
      'Neither of the candidates were present.',
      'Neither of the candidate has submitted the form.',
    ],
    correct: 1,
    explain: '"Neither of" takes a plural noun object ("candidates") and a singular verb ("has").',
  },
  {
    subject: 'Analytical',
    chapter: 'Logical Deduction',
    university: 'FAST-NUCES',
    difficulty: 'Medium',
    q: 'Find the next number in the sequence: $2, 6, 12, 20, 30, \\dots$',
    options: ['40', '42', '44', '36'],
    correct: 1,
    explain: 'The differences are $+4, +6, +8, +10$, so the next difference is $+12$, giving $30 + 12 = 42$.',
  },
];

export function generateBalancedPool(totalCount = 500): BalancedSeedQuestion[] {
  const result: BalancedSeedQuestion[] = [];
  for (let i = 0; i < totalCount; i++) {
    const tpl = CORE_SEED_Templates[i % CORE_SEED_Templates.length];
    const num = String(i + 1).padStart(3, '0');
    result.push({
      id: `seed_balanced_${num}`,
      subject: tpl.subject,
      chapter: tpl.chapter,
      topic: tpl.chapter,
      university: tpl.university,
      difficulty: tpl.difficulty,
      q: tpl.q,
      question: tpl.q,
      options: tpl.options,
      correct: tpl.correct,
      correctAnswer: tpl.correct,
      explain: tpl.explain,
      explanation: tpl.explain,
    });
  }
  return result;
}

export const BALANCED_MCQ_POOL: BalancedSeedQuestion[] = generateBalancedPool(50);
export const seedBalancedPool: BalancedSeedQuestion[] = BALANCED_MCQ_POOL;
export default BALANCED_MCQ_POOL;

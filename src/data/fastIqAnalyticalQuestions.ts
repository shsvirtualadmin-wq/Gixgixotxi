import { Question } from '../types';

export const FAST_IQ_ANALYTICAL_QUESTIONS: Question[] = [
  {
    id: 'fast-iq-1',
    q: 'Find the next number in the sequence: 4, 9, 19, 39, 79, ?',
    options: ['159', '149', '169', '158'],
    correct: 0,
    topic: 'Number Series',
    chapter: 'Analytical Reasoning',
    explain: 'Pattern is * 2 + 1: 4*2+1=9, 9*2+1=19, 19*2+1=39, 39*2+1=79, 79*2+1=159.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-2',
    q: 'Pointing to a photograph, a woman says: "He is the only son of my mother’s only daughter." How is the boy in the photograph related to the woman?',
    options: ['Son', 'Brother', 'Nephew', 'Grandson'],
    correct: 0,
    topic: 'Blood Relations',
    chapter: 'Logical Deduction',
    explain: '"My mother’s only daughter" refers to the woman herself (since she is a daughter). Thus, "only son of myself" is her son.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-3',
    q: 'A person walks 5 km North, turns right and walks 3 km, turns right again and walks 5 km. How far and in which direction is he from his starting point?',
    options: ['3 km East', '3 km West', '5 km East', '8 km North'],
    correct: 0,
    topic: 'Direction Sense',
    chapter: 'Spatial Reasoning',
    explain: 'Moving 5 km North then 5 km South cancels the vertical displacement. The horizontal displacement is 3 km to the East.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-4',
    q: 'In a certain code, "CLOUD" is written as "DMPVE". How is "SMILE" written in that code?',
    options: ['TNJMF', 'TNIMF', 'TNKMF', 'UMJMF'],
    correct: 0,
    topic: 'Coding-Decoding',
    chapter: 'Alphanumeric Reasoning',
    explain: 'Each letter is shifted forward by +1 position: S->T, M->N, I->J, L->M, E->F => TNJMF.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-5',
    q: 'Statements: 1. All apples are fruits. 2. All fruits are healthy.\nConclusion I: All apples are healthy.\nConclusion II: Some healthy items are apples.',
    options: [
      'Both Conclusion I and Conclusion II follow',
      'Only Conclusion I follows',
      'Only Conclusion II follows',
      'Neither conclusion follows'
    ],
    correct: 0,
    topic: 'Syllogism',
    chapter: 'Logical Deduction',
    explain: 'By categorical syllogism: Apples ⊆ Fruits ⊆ Healthy. Therefore, all apples are healthy (I) and by conversion, some healthy items are apples (II).',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-6',
    q: 'Find the odd one out among the given options: 27, 64, 125, 144, 216',
    options: ['144', '64', '125', '216'],
    correct: 0,
    topic: 'Classification & Odd One Out',
    chapter: 'Number Properties',
    explain: '27 = 3³, 64 = 4³, 125 = 5³, 216 = 6³ are all perfect cubes. 144 is 12² (a square, not a cube).',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-7',
    q: 'In a class row, Ali is 12th from the left end and 18th from the right end. How many total students are in the row?',
    options: ['29', '30', '31', '28'],
    correct: 0,
    topic: 'Order and Ranking',
    chapter: 'Linear Arrangement',
    explain: 'Total = (Position from Left) + (Position from Right) - 1 = 12 + 18 - 1 = 29.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-8',
    q: 'If PEN is coded as 35 (P=16, E=5, N=14), what is the code for BOOK (B=2, O=15, K=11)?',
    options: ['43', '41', '45', '39'],
    correct: 0,
    topic: 'Coding-Decoding',
    chapter: 'Alphabetical Values',
    explain: 'Sum of alphabetical positions: B(2) + O(15) + O(15) + K(11) = 2 + 15 + 15 + 11 = 43.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-9',
    q: 'Complete the letter series: B, E, H, K, N, ?',
    options: ['Q', 'P', 'R', 'S'],
    correct: 0,
    topic: 'Letter Series',
    chapter: 'Alphanumeric Reasoning',
    explain: 'Each letter advances by +3 positions: 2(B), 5(E), 8(H), 11(K), 14(N), 17(Q).',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-10',
    q: 'Architect : Building :: Sculptor : ?',
    options: ['Statue', 'Canvas', 'Chisel', 'Museum'],
    correct: 0,
    topic: 'Verbal Analogy',
    chapter: 'Analogical Reasoning',
    explain: 'An architect designs/creates a building; a sculptor creates a statue.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-11',
    q: 'Five people A, B, C, D, and E are sitting in a circle facing the center. A is to the immediate right of B. E is sitting between C and D. C is to the immediate right of A. Who is sitting to the immediate left of B?',
    options: ['D', 'C', 'E', 'A'],
    correct: 0,
    topic: 'Circular Seating Arrangement',
    chapter: 'Analytical Puzzles',
    explain: 'Order clockwise: B -> A -> C -> E -> D -> B. Immediate left of B is D.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-12',
    q: 'Look at the series: 2, 6, 12, 20, 30, 42, ?',
    options: ['56', '54', '52', '58'],
    correct: 0,
    topic: 'Number Series',
    chapter: 'Differences Series',
    explain: 'Differences between terms are +4, +6, +8, +10, +12. Next difference is +14: 42 + 14 = 56 (also n(n+1)).',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-13',
    q: 'Statement: "The city traffic authority has made helmet mandatory for all two-wheeler riders."\nAssumption I: Wearing a helmet significantly reduces fatal head injuries in accidents.\nAssumption II: Riders will obey traffic rules when enforced by law.',
    options: [
      'Both Assumption I and II are implicit',
      'Only Assumption I is implicit',
      'Only Assumption II is implicit',
      'Neither assumption is implicit'
    ],
    correct: 0,
    topic: 'Critical Reasoning & Assumptions',
    chapter: 'Logical Deduction',
    explain: 'Any policy mandate implicitly assumes that the intervention prevents harm (I) and that legal enforcement encourages compliance (II).',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-14',
    q: 'If South-East becomes North, and North-East becomes West, what will West become?',
    options: ['South-East', 'North-East', 'South-West', 'North-West'],
    correct: 0,
    topic: 'Direction Transformations',
    chapter: 'Spatial Orientation',
    explain: 'Directions are rotated 135 degrees counter-clockwise. Rotating West 135° counter-clockwise leads to South-East.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-15',
    q: 'In a code, "786" means "study hard now", "958" means "work hard pays", and "645" means "study and work". What digit stands for "now"?',
    options: ['7', '8', '6', '9'],
    correct: 0,
    topic: 'Fictitious Language Coding',
    chapter: 'Analytical Coding',
    explain: '"hard" is in 786 and 958 => common digit is 8. "study" is in 786 and 645 => common digit is 6. In 786, "now" remains => digit 7.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-16',
    q: 'Which diagram represents the relationship between: "Musicians, Instrumentalists, and Violinists"?',
    options: [
      'Violinists concentric inside Instrumentalists, inside Musicians',
      'Three intersecting circles',
      'Two separate circles inside a large circle',
      'Three completely disjoint circles'
    ],
    correct: 0,
    topic: 'Venn Diagram Logic',
    chapter: 'Set Logic',
    explain: 'All violinists are instrumentalists, and all instrumentalists are musicians. This forms three concentric subsets.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-17',
    q: 'If "+" means "×", "×" means "÷", "÷" means "-", and "-" means "+", what is 20 + 4 × 2 - 8 ÷ 4?',
    options: ['44', '48', '36', '40'],
    correct: 0,
    topic: 'Mathematical Operations Coding',
    chapter: 'Symbolic Logic',
    explain: 'Substitute symbols: 20 * 4 / 2 + 8 - 4 = 20 * 2 + 8 - 4 = 40 + 8 - 4 = 44.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-18',
    q: 'Pointing to a gentleman, Tariq said: "His only brother is the father of my daughter’s father." How is the gentleman related to Tariq?',
    options: ['Uncle', 'Father', 'Brother', 'Grandfather'],
    correct: 0,
    topic: 'Blood Relations',
    chapter: 'Logical Relations',
    explain: '"My daughter’s father" is Tariq himself. "Father of Tariq" is Tariq’s father. "His only brother is Tariq’s father" means the gentleman is Tariq’s uncle.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-19',
    q: 'Find the missing term in the sequence: A3P, C6N, E12L, G24J, ?',
    options: ['I48H', 'I36H', 'H48I', 'I48K'],
    correct: 0,
    topic: 'Alphanumeric Series',
    chapter: 'Pattern Recognition',
    explain: 'First letter +2: A, C, E, G -> I. Number * 2: 3, 6, 12, 24 -> 48. Third letter -2: P, N, L, J -> H. Result: I48H.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  },
  {
    id: 'fast-iq-20',
    q: 'If today is Thursday, what day of the week will it be after 65 days?',
    options: ['Sunday', 'Monday', 'Saturday', 'Friday'],
    correct: 0,
    topic: 'Calendar and Clock Logic',
    chapter: 'Quantitative Logic',
    explain: '65 days / 7 = 9 weeks + 2 odd days. Thursday + 2 days = Saturday? Wait: 65 mod 7 = 2 (7*9=63, remainder 2). Thursday + 2 = Saturday. Let\'s check: 65 = 7*9 + 2. Day after 63 days is Thursday, day 64 is Friday, day 65 is Saturday.',
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  }
];

// Fix option order for fast-iq-20
FAST_IQ_ANALYTICAL_QUESTIONS[19].options = ['Saturday', 'Sunday', 'Friday', 'Monday'];
FAST_IQ_ANALYTICAL_QUESTIONS[19].correct = 0;

// Add questions 21 to 105 with authentic logical deductions, series, coding, and analytical reasoning
const IQ_TEMPLATES = [
  {
    cat: 'Number Series Progression',
    gen: (idx: number) => {
      const step = 3 + (idx % 7);
      const start = 5 + (idx % 10);
      const t1 = start;
      const t2 = t1 + step;
      const t3 = t2 + step;
      const t4 = t3 + step;
      const t5 = t4 + step;
      return {
        q: `What is the next number in the arithmetic progression: ${t1}, ${t2}, ${t3}, ${t4}, ?`,
        correct: `${t5}`,
        distractors: [`${t5 + 2}`, `${t5 - 1}`, `${t5 + step}`],
        exp: `The common difference is +${step}. Next term = ${t4} + ${step} = ${t5}.`
      };
    }
  },
  {
    cat: 'Letter Pattern Reasoning',
    gen: (idx: number) => {
      const shift = 2 + (idx % 3);
      const baseChars = ['A', 'D', 'G', 'J', 'M'];
      const nextChar = String.fromCharCode(65 + ((idx * 3 + 12) % 26));
      return {
        q: `Identify the missing letter following the alphabetical progression pattern (step size ${shift}): A, ${String.fromCharCode(65 + shift)}, ${String.fromCharCode(65 + shift * 2)}, ?`,
        correct: `${String.fromCharCode(65 + shift * 3)}`,
        distractors: [
          `${String.fromCharCode(65 + shift * 3 + 1)}`,
          `${String.fromCharCode(65 + shift * 2 + 1)}`,
          `${String.fromCharCode(65 + shift * 3 - 1)}`
        ],
        exp: `The progression increments each character index by +${shift} positions in the English alphabet.`
      };
    }
  },
  {
    cat: 'Directional Logic',
    gen: (idx: number) => {
      const d1 = 4 + (idx % 5);
      const d2 = 3 + (idx % 4);
      return {
        q: `A traveler drives ${d1} km West, turns North and drives ${d2} km, then turns East and drives ${d1} km. How far is the traveler from the initial position?`,
        correct: `${d2} km North`,
        distractors: [`${d1} km North`, `${d1 + d2} km West`, `${d2} km South`],
        exp: `The West and East movements of ${d1} km cancel each other completely, leaving a net displacement of ${d2} km North.`
      };
    }
  },
  {
    cat: 'Order and Ranking',
    gen: (idx: number) => {
      const leftRank = 8 + (idx % 12);
      const rightRank = 14 + (idx % 15);
      const total = leftRank + rightRank - 1;
      return {
        q: `In an entrance examination rank list, a student is ranked ${leftRank}th from the top and ${rightRank}th from the bottom. How many total candidates were ranked?`,
        correct: `${total}`,
        distractors: [`${total + 1}`, `${total - 1}`, `${total + 2}`],
        exp: `Total candidates = Rank from top (${leftRank}) + Rank from bottom (${rightRank}) - 1 = ${total}.`
      };
    }
  },
  {
    cat: 'Logical Analogy',
    gen: (idx: number) => {
      const analogies = [
        { a: 'Thermodynamics', b: 'Heat', c: 'Optics', d: 'Light' },
        { a: 'Microscope', b: 'Cells', c: 'Telescope', d: 'Stars' },
        { a: 'Cardiologist', b: 'Heart', c: 'Neurologist', d: 'Brain' },
        { a: 'Author', b: 'Book', c: 'Composer', d: 'Symphony' },
        { a: 'Barometer', b: 'Pressure', c: 'Anemometer', d: 'Wind Speed' }
      ];
      const item = analogies[idx % analogies.length];
      return {
        q: `${item.a} : ${item.b} :: ${item.c} : ?`,
        correct: item.d,
        distractors: ['Atmosphere', 'Sound Waves', 'Equation', 'Velocity'],
        exp: `${item.a} is the scientific study or instrument for ${item.b}, just as ${item.c} corresponds directly to ${item.d}.`
      };
    }
  }
];

for (let i = 21; i <= 105; i++) {
  const template = IQ_TEMPLATES[(i - 21) % IQ_TEMPLATES.length];
  const item = template.gen(i);

  FAST_IQ_ANALYTICAL_QUESTIONS.push({
    id: `fast-iq-${i}`,
    q: item.q,
    options: [item.correct, ...item.distractors],
    correct: 0,
    topic: template.cat,
    chapter: 'FAST IQ & Analytical Reasoning',
    explain: item.exp,
    difficulty: 'Exam Standard',
    subject: 'IQ & Analytical Reasoning'
  });
}

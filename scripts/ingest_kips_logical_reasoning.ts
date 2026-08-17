import dotenv from 'dotenv';
dotenv.config();

export interface UserMCQFormat {
  exam_type: string;
  subject: string;
  chapter: string;
  subtopic: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  source: string;
}

export const kipsLogicalReasoningMCQs: UserMCQFormat[] = [
  // ==========================================
  // CHAPTER 1: LETTER & SYMBOL SERIES
  // ==========================================
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Number Series",
    question: "Complete the sequence: 2, 5, 10, 17, 26, ?",
    options: {
      A: "29",
      B: "31",
      C: "35",
      D: "37"
    },
    correct_option: "D",
    explanation: "The pattern follows adding consecutive odd numbers: +3, +5, +7, +9, +11. Thus, 26 + 11 = 37.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Number Series",
    question: "Find the missing term in the sequence: 7, 12, 19, 28, ?",
    options: {
      A: "39",
      B: "38",
      C: "40",
      D: "41"
    },
    correct_option: "A",
    explanation: "The difference between terms increases by 2 each step (+5, +7, +9, +11). So, 28 + 11 = 39.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Number Series",
    question: "What term continues the pattern: 0, 7, 15, 24, 34, ?",
    options: {
      A: "55",
      B: "45",
      C: "46",
      D: "50"
    },
    correct_option: "B",
    explanation: "The addition pattern increments by 1 at each step (+7, +8, +9, +10, +11). Therefore, 34 + 11 = 45.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Number Series",
    question: "Complete the series: 87, 102, 119, 138, 159, ?",
    options: {
      A: "184",
      B: "180",
      C: "182",
      D: "185"
    },
    correct_option: "C",
    explanation: "The differences between consecutive terms form an arithmetic progression of odd numbers (+15, +17, +19, +21, +23). Hence, 159 + 23 = 182.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Number Series",
    question: "Find the missing number: 8, 16, 32, 64, 128, ?",
    options: {
      A: "256",
      B: "384",
      C: "250",
      D: "192"
    },
    correct_option: "A",
    explanation: "Each term is obtained by multiplying the preceding term by 2 (geometric sequence with common ratio 2). So, 128 x 2 = 256.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Number Series",
    question: "Complete the sequence: 4, 7, 15, 29, 59, 117, ?",
    options: {
      A: "230",
      B: "233",
      C: "234",
      D: "235"
    },
    correct_option: "D",
    explanation: "The operations alternate between x2-1 and x2+1: 4x2-1=7, 7x2+1=15, 15x2-1=29, 29x2+1=59, 59x2-1=117, 117x2+1=235.",
    difficulty: "Hard",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Number Series",
    question: "Find the missing number in the squares series: 0, 3, 8, 15, ?",
    options: {
      A: "25",
      B: "24",
      C: "35",
      D: "36"
    },
    correct_option: "B",
    explanation: "The terms follow n^2 - 1 starting from n=1: 1^2-1=0, 2^2-1=3, 3^2-1=8, 4^2-1=15, 5^2-1=24.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Number Series",
    question: "Complete the cubes pattern: 7, 26, 63, 124, ?",
    options: {
      A: "216",
      B: "215",
      C: "248",
      D: "210"
    },
    correct_option: "B",
    explanation: "The formula is n^3 - 1 starting from n=2: 2^3-1=7, 3^3-1=26, 4^3-1=63, 5^3-1=124, 6^3-1=215.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },

  // Subtopic: Letter Series & Coding-Decoding
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Letter Series",
    question: "Find the next term in the letter series: A, C, F, J, ?",
    options: {
      A: "M",
      B: "N",
      C: "O",
      D: "P"
    },
    correct_option: "C",
    explanation: "The alphabetical positions jump by increasing values (+2, +3, +4, +5): A(1)+2=C(3), C(3)+3=F(6), F(6)+4=J(10), J(10)+5=O(15).",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Coding-Decoding",
    question: "In a certain code, TEACHER is written as VGCEJGT. How is CHILDREN written in that code?",
    options: {
      A: "EJKNEGTP",
      B: "EGKNFITP",
      C: "EJKNFGTO",
      D: "EJKNFTGP"
    },
    correct_option: "D",
    explanation: "Each letter is shifted forward by 2 positions (+2): C->E, H->J, I->K, L->N, D->F, R->T, E->G, N->P.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Coding-Decoding",
    question: "If ZEBRA is coded as 2652181, how is COBRA written in that code?",
    options: {
      A: "302181",
      B: "3152181",
      C: "31822151",
      D: "1182153"
    },
    correct_option: "B",
    explanation: "Each letter is replaced by its numerical position in the English alphabet: C=3, O=15, B=2, R=18, A=1 -> 3152181.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Coding-Decoding",
    question: "If 'bat' is called 'racket', 'racket' is called 'football', 'football' is called 'shuttle', and 'shuttle' is called 'ludo', what is cricket played with?",
    options: {
      A: "Racket",
      B: "Football",
      C: "Bat",
      D: "Shuttle"
    },
    correct_option: "A",
    explanation: "Cricket is played with a 'bat'. According to the artificial coding substitution rule, 'bat' is called 'racket'.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },

  // Subtopic: Symbol Series & Figure Logic
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Symbol Series",
    question: "Consider the alternating orientation series of letter 'E': [Segment 1: E faces right, then down, then right], [Segment 2: E faces down in all three steps]. To continue the pattern in Segment 3, which orientation must 'E' take?",
    options: {
      A: "Facing Left",
      B: "Facing Down",
      C: "Facing Up",
      D: "Facing Right"
    },
    correct_option: "C",
    explanation: "Following the periodic rule of alternating rotations across segments, the fourth segment requires 'E' to face upward consistently.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },

  // Subtopic: Odd Man Out
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Odd Man Out",
    question: "Choose the word which is least like the other words in the group: Zebra, Lion, Tiger, Horse",
    options: {
      A: "Zebra",
      B: "Lion",
      C: "Tiger",
      D: "Horse"
    },
    correct_option: "D",
    explanation: "Horse is a domesticated herbivore, whereas Zebra, Lion, and Tiger are wild species living in untamed natural habitats.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Odd Man Out",
    question: "Identify the odd one out among the given substances: Copper, Zinc, Brass, Aluminium",
    options: {
      A: "Copper",
      B: "Zinc",
      C: "Brass",
      D: "Aluminium"
    },
    correct_option: "C",
    explanation: "Brass is an alloy (copper + zinc), whereas Copper, Zinc, and Aluminium are pure metallic elements on the periodic table.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },

  // Subtopic: Word Analogy
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Word Analogy",
    question: "Complete the analogy: Food : Stomach :: Fuel : ?",
    options: {
      A: "Plane",
      B: "Truck",
      C: "Engine",
      D: "Automobile"
    },
    correct_option: "C",
    explanation: "Food is processed in the stomach to generate biological energy, just as fuel is processed in an engine to generate mechanical power.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Word Analogy",
    question: "Complete the analogy: Moon : Satellite :: Earth : ?",
    options: {
      A: "Sun",
      B: "Planet",
      C: "Solar System",
      D: "Asteroid"
    },
    correct_option: "B",
    explanation: "The Moon is classified as a natural satellite, just as Earth is classified as a planet.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },

  // Subtopic: Essential Part
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Essential Part",
    question: "Select the essential part without which a 'Champion' cannot exist:",
    options: {
      A: "Running",
      B: "Swimming",
      C: "Winning",
      D: "Speaking"
    },
    correct_option: "C",
    explanation: "A champion is defined by victory; therefore, 'winning' is the indispensable essential requirement.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Letter & Symbol Series",
    subtopic: "Essential Part",
    question: "Select the essential part without which a 'Book' cannot exist:",
    options: {
      A: "Fiction",
      B: "Pages",
      C: "Pictures",
      D: "Learning"
    },
    correct_option: "B",
    explanation: "Pages are the necessary physical medium composing a book. A book can exist without fiction or pictures.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },

  // ==========================================
  // CHAPTER 2: LOGICAL PROBLEMS (Syllogisms)
  // ==========================================
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Logical Problems",
    subtopic: "Syllogism",
    question: "Statements:\nSome kings are queens.\nAll queens are beautiful.\n\nConclusions:\n(i) All kings are beautiful.\n(ii) All queens are kings.\n\nWhich conclusion(s) logically follow?",
    options: {
      A: "Only (i) follows",
      B: "Only (ii) follows",
      C: "Both (i) and (ii) follow",
      D: "Neither (i) nor (ii) follows"
    },
    correct_option: "D",
    explanation: "Since 'some kings are queens' and 'all queens are beautiful', we can only infer that 'some kings are beautiful'. Neither 'all kings are beautiful' nor 'all queens are kings' is guaranteed.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Logical Problems",
    subtopic: "Syllogism",
    question: "Statements:\nAll pens are chalks.\nAll chairs are chalks.\n\nConclusions:\n(i) Some pens are chairs.\n(ii) Some chalks are pens.\n\nWhich conclusion(s) logically follow?",
    options: {
      A: "Only (i) follows",
      B: "Only (ii) follows",
      C: "Both (i) and (ii) follow",
      D: "Neither (i) nor (ii) follows"
    },
    correct_option: "B",
    explanation: "Since 'All pens are chalks', converting this Universal Affirmative statement yields 'Some chalks are pens' (Conclusion ii). No relationship is established between pens and chairs.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },

  // ==========================================
  // CHAPTER 3: LOGICAL DEDUCTIONS
  // ==========================================
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Logical Deductions",
    subtopic: "Linear Arrangements",
    question: "Five girls are sitting on a bench to be photographed. Sana is to the left of Rida and to the right of Beena. Maha is to the right of Rida. Iqra is between Rida and Maha. Who is sitting in the middle of the bench?",
    options: {
      A: "Beena",
      B: "Iqra",
      C: "Rida",
      D: "Sana"
    },
    correct_option: "C",
    explanation: "Arranging from left to right based on clues: Beena < Sana < Rida < Iqra < Maha. Position 3 (the exact middle) is Rida.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Logical Deductions",
    subtopic: "Direction Sense",
    question: "You go North, turn right, then turn right again, and then go to the left. In which direction are you heading now?",
    options: {
      A: "North",
      B: "South",
      C: "East",
      D: "West"
    },
    correct_option: "C",
    explanation: "Initial: North. Turn 1 (Right) -> East. Turn 2 (Right) -> South. Turn 3 (Left from South) -> East. You are now heading East.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Logical Deductions",
    subtopic: "Blood Relations",
    question: "A child was accompanying a woman. On being asked who the boy was, the woman said, 'His mother was the only daughter of my mother.' How is the boy related to the woman?",
    options: {
      A: "Son",
      B: "Brother",
      C: "Nephew",
      D: "None of these"
    },
    correct_option: "A",
    explanation: "'Only daughter of my mother' refers to the woman herself. Therefore, 'His mother' is the woman, making the boy her son.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },

  // ==========================================
  // CHAPTER 4: COURSE OF ACTION
  // ==========================================
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Course of Action",
    subtopic: "Course of Action",
    question: "Statement:\nThe officer incharge of a company had a hunch that some money was missing from the safe.\n\nSuggested Courses of Action:\n(i) He should get it recounted with the help of the staff and check it with the balance sheet.\n(ii) He should inform the police immediately.\n\nWhich course of action is most appropriate?",
    options: {
      A: "If only (i) is most appropriate",
      B: "If only (ii) is most appropriate",
      C: "If either (i) or (ii) is most appropriate",
      D: "If both (i) and (ii) are appropriate"
    },
    correct_option: "A",
    explanation: "Action (i) is logical and practical because internal verification must precede legal action when based solely on a hunch.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },

  // ==========================================
  // CHAPTER 5: CAUSE AND EFFECT
  // ==========================================
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Cause and Effect",
    subtopic: "Cause and Effect",
    question: "Statements:\n(i) For the past few months, Babar is behaving abnormally.\n(ii) Babar's father had taken him to a doctor yesterday.\n\nWhich statement is cause and which is effect?",
    options: {
      A: "Statement (i) is the cause and statement (ii) is its effect",
      B: "Statement (ii) is the cause and statement (i) is its effect",
      C: "Both statements are independent causes",
      D: "Both statements are effects of independent causes"
    },
    correct_option: "A",
    explanation: "Babar's abnormal behavior (i) directly caused his father to seek medical consultation for him (ii).",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },

  // ==========================================
  // CHAPTER 6: CRITICAL THINKING
  // ==========================================
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Critical Thinking",
    subtopic: "Assumptions",
    question: "Statement:\n'Please note that the company will provide accommodation to only outside candidates if selected.' - A condition in an employment advertisement.\n\nAssumptions:\n(i) The local candidates would have some other arrangement for their stay.\n(ii) The company plans to select only local candidates.\n\nWhich assumption is implicit?",
    options: {
      A: "Only assumption (i) is implicit",
      B: "Only assumption (ii) is implicit",
      C: "Both (i) and (ii) are implicit",
      D: "Neither (i) nor (ii) is implicit"
    },
    correct_option: "A",
    explanation: "Offering accommodation exclusively to non-local candidates implies the assumption that local candidates do not require company-provided housing.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },

  // ==========================================
  // CHAPTER 7: MISCELLANEOUS PROBLEMS
  // ==========================================
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Miscellaneous Problems",
    subtopic: "Age Questions",
    question: "A mother's age after 5 years will be twice the age of her daughter. The difference in their present ages is 19 years. What is the present age of the mother?",
    options: {
      A: "13 years",
      B: "33 years",
      C: "45 years",
      D: "42 years"
    },
    correct_option: "B",
    explanation: "Let daughter's age = x, mother's age = x + 19. In 5 years: (x + 19 + 5) = 2(x + 5) => x + 24 = 2x + 10 => x = 14. Mother's present age = 14 + 19 = 33 years.",
    difficulty: "Medium",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Miscellaneous Problems",
    subtopic: "Percentage",
    question: "If the price of petrol per liter increases from Rs. 260 to Rs. 325, what is the percentage increase?",
    options: {
      A: "15%",
      B: "25%",
      C: "30%",
      D: "20%"
    },
    correct_option: "B",
    explanation: "Increase = 325 - 260 = Rs. 65. Percentage Increase = (65 / 260) x 100% = 25%.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  },
  {
    exam_type: "MDCAT",
    subject: "Logical Reasoning",
    chapter: "Miscellaneous Problems",
    subtopic: "Profit and Loss",
    question: "A farmer bought a cow for Rs. 14,000 and sold it for Rs. 15,400. Find his profit percentage:",
    options: {
      A: "10%",
      B: "15%",
      C: "20%",
      D: "25%"
    },
    correct_option: "A",
    explanation: "Profit = Selling Price - Cost Price = 15,400 - 14,000 = Rs. 1,400. Profit % = (1,400 / 14,000) x 100% = 10%.",
    difficulty: "Easy",
    source: "KIPS MDCAT Smart Book"
  }
];

async function ingestLogicalReasoning() {
  console.log(`Ingesting ${kipsLogicalReasoningMCQs.length} Logical Reasoning MCQs into backend MCQ bank...`);

  for (const mcq of kipsLogicalReasoningMCQs) {
    const optionArray = [mcq.options.A, mcq.options.B, mcq.options.C, mcq.options.D];
    const correctIdx = mcq.correct_option === 'A' ? 0 : mcq.correct_option === 'B' ? 1 : mcq.correct_option === 'C' ? 2 : 3;

    const res = await fetch('http://localhost:3000/api/mcqs/batch-insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_type: mcq.exam_type,
        subject: mcq.subject,
        chapter: mcq.chapter,
        subtopic: mcq.subtopic,
        mcqs: [{
          question_text: mcq.question,
          options: optionArray,
          correct_option: correctIdx,
          explanation: mcq.explanation,
          difficulty: mcq.difficulty
        }]
      })
    });

    const json = await res.json();
    console.log(`Ingested [${mcq.subtopic}] -> ${mcq.question.substring(0, 30)}... Result:`, json.success);
  }
}

if (process.argv[1]?.endsWith('ingest_kips_logical_reasoning.ts')) {
  ingestLogicalReasoning().catch(console.error);
}

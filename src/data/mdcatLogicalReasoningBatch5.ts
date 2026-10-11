import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_BATCH5: Question[] = [
  {
    "id": "mdcat-b5-lr-1",
    "q": "Statement: \"Regular cardiovascular exercise lowers resting heart rate and reduces the risk of ischemic heart disease.\" Which of the following assumptions is implicit in this statement?",
    "options": [
      "A lower resting heart rate is generally correlated with improved cardiovascular health.",
      "Exercise is the only determinant of heart health.",
      "Individuals who do not exercise will inevitably suffer heart attacks.",
      "Heart disease cannot be caused by hereditary factors."
    ],
    "correct": 0,
    "topic": "Critical Thinking",
    "chapter": "Critical Thinking",
    "explain": "The statement establishes a link between exercise, lower resting heart rate, and reduced heart disease risk, which implicitly assumes that a lower resting heart rate reflects better cardiac fitness.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-2",
    "q": "Argument: \"City hospital introduced automated diagnostic software last month. Since then, total patient diagnostic turnaround time decreased by 30%. Therefore, all medical errors have been eradicated.\" Which of the following highlights the fundamental flaw in this argument?",
    "options": [
      "It confuses operational speed (turnaround time) with clinical diagnostic accuracy.",
      "It assumes diagnostic software requires human physicians to operate.",
      "It ignores the purchase price of the automated software.",
      "It overlooks outpatient consultation booking procedures."
    ],
    "correct": 0,
    "topic": "Critical Thinking",
    "chapter": "Critical Thinking",
    "explain": "Faster diagnostic turnaround time demonstrates high processing speed, but does not guarantee correctness or total absence of clinical errors.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-3",
    "q": "Statement: \"A recent study found that patients consuming dietary turmeric reported a 40% reduction in joint pain. A pharmaceuticals company concluded that daily synthetic curcumin supplements should immediately replace conventional arthritis therapies.\" Which of the following, if true, most seriously weakens the company's conclusion?",
    "options": [
      "Synthetic curcumin taken without whole-food lipid cofactors exhibits negligible gastrointestinal bioavailability compared to natural turmeric.",
      "Joint inflammation is known to fluctuate based on changes in ambient barometric pressure.",
      "Dietary turmeric has been consumed as a culinary spice in South Asia for centuries.",
      "Physical therapy also assists in reducing joint stiffness in elderly subjects."
    ],
    "correct": 0,
    "topic": "Critical Thinking",
    "chapter": "Critical Thinking",
    "explain": "If isolated synthetic curcumin lacks oral bioavailability without natural cofactors, the clinical benefits observed from dietary turmeric cannot be extrapolated to synthetic curcumin supplements.",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-4",
    "q": "Statements:\n1. All enzymes are organic catalysts.\n2. All organic catalysts are biological molecules.\nConclusions:\nI. All enzymes are biological molecules.\nII. Some biological molecules are enzymes.",
    "options": [
      "Both conclusion I and conclusion II follow.",
      "Only conclusion I follows.",
      "Only conclusion II follows.",
      "Neither conclusion I nor II follows."
    ],
    "correct": 0,
    "topic": "Logical Deduction",
    "chapter": "Logical Deduction",
    "explain": "Since Enzymes ⊆ Organic Catalysts ⊆ Biological Molecules, every enzyme is a biological molecule (I follows) and biological molecules include enzymes (II follows).",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-5",
    "q": "Statements:\n1. Some analgesics are anti-inflammatory drugs.\n2. No anti-inflammatory drugs are narcotics.\nConclusions:\nI. Some analgesics are not narcotics.\nII. No narcotics are analgesics.",
    "options": [
      "Only conclusion I follows.",
      "Only conclusion II follows.",
      "Both conclusion I and conclusion II follow.",
      "Neither conclusion follows."
    ],
    "correct": 0,
    "topic": "Logical Deduction",
    "chapter": "Logical Deduction",
    "explain": "The portion of analgesics that are anti-inflammatory drugs cannot be narcotics (since no anti-inflammatory is a narcotic). Hence, some analgesics are definitely not narcotics. Conclusion II is an overgeneralization because other analgesics (e.g. opioid analgesics) can be narcotics.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-6",
    "q": "Statements:\n1. All leukocytes are nucleated blood cells.\n2. Some nucleated blood cells produce antibodies.\n3. All antibody-producing cells are lymphocytes.\nConclusions:\nI. Some leukocytes are lymphocytes.\nII. All lymphocytes are leukocytes.\nIII. No non-nucleated cell produces antibodies.",
    "options": [
      "Only conclusions I and III follow.",
      "Only conclusion I follows.",
      "Only conclusion II follows.",
      "All conclusions I, II, and III follow."
    ],
    "correct": 0,
    "topic": "Logical Deduction",
    "chapter": "Logical Deduction",
    "explain": "From (2) and (3), some nucleated cells (which are leukocytes) produce antibodies and are lymphocytes, so some leukocytes are lymphocytes (I follows). Since antibody-producing cells are a subset of nucleated cells, non-nucleated cells cannot produce antibodies (III follows). II does not follow as non-blood lymphocytes or other forms are not addressed.",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-7",
    "q": "Five medical interns (A, B, C, D, E) are standing in a row during clinical ward rounds. B is between A and C. E is to the immediate right of C. D is to the immediate left of A. Who stands in the exact middle?",
    "options": [
      "B",
      "A",
      "C",
      "E"
    ],
    "correct": 0,
    "topic": "Logical Problems",
    "chapter": "Logical Problems",
    "explain": "Arranging from left to right: D is left of A, then A, then B (between A and C), then C, then E (to the right of C). The order is D - A - B - C - E. The middle person is B.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-8",
    "q": "Four surgical residents — Dr. Khan, Dr. Ali, Dr. Bilal, and Dr. Tariq — are scheduled on four consecutive duty nights (Monday through Thursday). Dr. Tariq is on duty before Dr. Khan. Dr. Ali is on duty on Wednesday. Dr. Bilal is on duty immediately after Dr. Khan. Which night is Dr. Tariq on duty?",
    "options": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday"
    ],
    "correct": 0,
    "topic": "Logical Problems",
    "chapter": "Logical Problems",
    "explain": "Dr. Ali is on Wednesday. The remaining days are Mon, Tue, Thu. Dr. Bilal is immediately after Dr. Khan, so Khan and Bilal must take adjacent days. The only adjacent days left are Monday and Tuesday (Khan on Mon, Bilal on Tue) or Tuesday and Thursday (not adjacent). Since Tariq must be before Khan, Tariq must be on Monday, Khan on Tuesday, Ali on Wednesday, and Bilal on Thursday. Checking: Tariq (Mon) < Khan (Tue) and Bilal (Thu) is after Khan. Thus Dr. Tariq is on Monday.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-9",
    "q": "Six researchers (P, Q, R, S, T, U) sit around a circular conference table facing the center. P is opposite S. Q is to the immediate left of P. T is to the immediate right of S. R is between P and T. Who is sitting to the immediate right of Q?",
    "options": [
      "U",
      "P",
      "R",
      "S"
    ],
    "correct": 0,
    "topic": "Logical Problems",
    "chapter": "Logical Problems",
    "explain": "Viewing clockwise from P (at 12 o'clock): To P's immediate left (clockwise) is Q (2 o'clock). Opposite P is S (6 o'clock). T is to immediate right of S (anticlockwise from S, so 4 o'clock). R is between P and T (clock position 2 is Q, so counter-clockwise from P is 10 o'clock: R is at 10, T at 8, S at 6). The remaining position between S and Q is U (at 4 o'clock). Facing center, looking at Q (at 2 o'clock), Q's right direction goes towards 4 o'clock, where U sits.",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-10",
    "q": "Identify the next term in the letter series: BDF, CFI, DHL, EJO, ?",
    "options": [
      "FLR",
      "FKQ",
      "GLR",
      "FMS"
    ],
    "correct": 0,
    "topic": "Letter and Symbol Series",
    "chapter": "Letter and Symbol Series",
    "explain": "First letter advances by +1: B(2)→C(3)→D(4)→E(5)→F(6). Second letter advances by +2: D(4)→F(6)→H(8)→J(10)→L(12). Third letter advances by +3: F(6)→I(9)→L(12)→O(15)→R(18). Hence the next term is FLR.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-11",
    "q": "Find the missing number in the alphanumeric pattern: Z24, X20, V16, T12, ?",
    "options": [
      "R8",
      "S8",
      "R10",
      "Q8"
    ],
    "correct": 0,
    "topic": "Letter and Symbol Series",
    "chapter": "Letter and Symbol Series",
    "explain": "Letters decrease by 2 in the alphabet: Z(26) - 2 = X(24) - 2 = V(22) - 2 = T(20) - 2 = R(18). Numbers decrease by 4: 24 - 4 = 20 - 4 = 16 - 4 = 12 - 4 = 8. The next term is R8.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-12",
    "q": "Problem Statement: \"A municipal hospital experiences frequent unnotified power grid failures, interrupting critical ICU ventilatory life support systems.\"\nCourses of Action:\nI. The hospital management should immediately install automated uninterrupted power supply (UPS) batteries with dedicated backup diesel generators.\nII. All ICU patients should be discharged immediately to their homes until municipal power is stabilized.",
    "options": [
      "Only course of Action I is appropriate.",
      "Only course of Action II is appropriate.",
      "Both courses of Action I and II are appropriate.",
      "Neither course of Action I nor II is appropriate."
    ],
    "correct": 0,
    "topic": "Course of Action",
    "chapter": "Course of Action",
    "explain": "Course I directly and safely solves the electrical vulnerability without endangering lives. Course II is absurd and life-threatening for ICU patients requiring continuous medical care.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-13",
    "q": "Problem Statement: \"A regional epidemic of water-borne acute gastroenteritis breaks out in a district due to contamination of the central municipal water reservoir.\"\nCourses of Action:\nI. Deploy emergency medical response camps with oral rehydration salts and intravenous fluids while initiating superchlorination and biological testing of the municipal water supply.\nII. Prohibit residents from boiling tap water at home to prevent thermal burn accidents.",
    "options": [
      "Only course of Action I is appropriate.",
      "Only course of Action II is appropriate.",
      "Both courses of Action I and II are appropriate.",
      "Neither course of Action I nor II is appropriate."
    ],
    "correct": 0,
    "topic": "Course of Action",
    "chapter": "Course of Action",
    "explain": "Action I delivers necessary therapeutic intervention and treats the root contamination source. Action II contradicts standard infection control, as boiling drinking water is essential during waterborne outbreaks.",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-14",
    "q": "Statements:\nI. The provincial government enacted stringent speed limits and installed high-definition speed cameras along major urban expressways.\nII. The total number of fatal vehicular collisions on urban expressways fell by 45% over the subsequent six months.",
    "options": [
      "Statement I is the cause and statement II is its effect.",
      "Statement II is the cause and statement I is its effect.",
      "Both statements are independent causes.",
      "Both statements are effects of independent causes."
    ],
    "correct": 0,
    "topic": "Cause and Effect",
    "chapter": "Cause and Effect",
    "explain": "Enforcing speed limits and installing cameras (Statement I) directly resulted in safer driving and a consequent reduction in fatal road collisions (Statement II).",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b5-lr-15",
    "q": "Statements:\nI. A severe drought in the agrarian belt destroyed over 60% of the staple wheat harvest.\nII. The prices of commercial livestock fodder surged dramatically over the same quarter.",
    "options": [
      "Both statements I and II are effects of a common cause (the severe regional drought).",
      "Statement I is the cause and statement II is its effect.",
      "Statement II is the cause and statement I is its effect.",
      "Both statements I and II are effects of entirely independent causes."
    ],
    "correct": 0,
    "topic": "Cause and Effect",
    "chapter": "Cause and Effect",
    "explain": "Both the crop devastation (I) and the shortage/price surge of agricultural fodder (II) are direct consequences of the same underlying climatic factor: the severe drought.",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  }
];

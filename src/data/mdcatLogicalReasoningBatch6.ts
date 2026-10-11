import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_BATCH6: Question[] = [
  {
    "id": "mdcat-b6-lr-1",
    "q": "Determine the next term in the alphanumeric sequence:\nB2D, E4G, H8J, K16M, ?",
    "options": [
      "N32P",
      "N24P",
      "M32O",
      "O32Q"
    ],
    "correct": 0,
    "topic": "Alphanumeric Series",
    "chapter": "Letter and Symbol Series",
    "explain": "First letter progresses by +3: B(2) -> E(5) -> H(8) -> K(11) -> N(14). Number doubles: 2 -> 4 -> 8 -> 16 -> 32. Last letter is first letter + 2 positions: D(4), G(7), J(10), M(13), P(16). Thus, the next term is N32P.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b6-lr-2",
    "q": "Find the missing number in the following mathematical series:\n7, 14, 28, 56, 112, ?",
    "options": [
      "224",
      "168",
      "196",
      "248"
    ],
    "correct": 0,
    "topic": "Number Series",
    "chapter": "Letter and Symbol Series",
    "explain": "Each successive term is multiplied by 2: 7 × 2 = 14, 14 × 2 = 28, 28 × 2 = 56, 56 × 2 = 112, 112 × 2 = 224.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b6-lr-3",
    "q": "Statement: \"A recent epidemiological study demonstrated that individuals who regularly consume green tea have a 25% lower incidence of cardiovascular disease than non-consumers. Therefore, drinking green tea directly prevents cardiac pathology.\"\nWhich of the following, if true, most seriously weakens the argument's conclusion?",
    "options": [
      "Individuals who drink green tea are also significantly more likely to exercise daily and follow a Mediterranean diet low in saturated fat.",
      "Green tea contains catechins that have shown antioxidant activity in in vitro cell cultures.",
      "Black tea consumers also exhibit slightly lower incidence of hypertension.",
      "Cardiovascular diseases are the leading cause of mortality in elderly populations."
    ],
    "correct": 0,
    "topic": "Critical Thinking - Weakening an Argument",
    "chapter": "Critical Thinking",
    "explain": "The author commits a correlation-versus-causation fallacy. Demonstrating a confounding third variable (regular exercise and healthy diet among green tea drinkers) provides an alternative explanation, severely weakening the claim of direct causality.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b6-lr-4",
    "q": "Given the premises:\n1. All surgeons are certified physicians.\n2. Some certified physicians are clinical researchers.\nWhich conclusion logically and validly follows beyond doubt?",
    "options": [
      "Some clinical researchers are certified physicians.",
      "All surgeons are clinical researchers.",
      "No surgeon is a clinical researcher.",
      "All clinical researchers are surgeons."
    ],
    "correct": 0,
    "topic": "Syllogisms and Deduction",
    "chapter": "Logical Deduction",
    "explain": "From premise 2 (\"Some certified physicians are clinical researchers\"), conversion of the particular affirmative proposition (Some A are B \\implies Some B are A) guarantees that \"Some clinical researchers are certified physicians\". No definitive conclusion can be drawn about surgeons and researchers.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b6-lr-5",
    "q": "Five medical interns—Ali, Bilal, Daniyal, Farhan, and Hamza—are seated in a single row facing North.\n- Daniyal sits exactly in the middle.\n- Ali sits to the immediate right of Daniyal.\n- Bilal is at one of the extreme ends.\n- Farhan is not adjacent to Daniyal.\nWho is seated at the opposite extreme end from Bilal?",
    "options": [
      "Farhan",
      "Ali",
      "Hamza",
      "Daniyal"
    ],
    "correct": 0,
    "topic": "Linear Arrangement",
    "chapter": "Logical Problems",
    "explain": "Seats are 1, 2, 3, 4, 5. Daniyal is in the middle (seat 3). Ali is to Daniyal's immediate right (seat 4). Bilal must be at an extreme end (either 1 or 5). Since seat 4 is Ali, Bilal must be at seat 1. That leaves seats 2 and 5 for Farhan and Hamza. Since Farhan is not adjacent to Daniyal (cannot be seat 2), Farhan must be at seat 5 (the other extreme end), and Hamza is at seat 2.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b6-lr-6",
    "q": "Pointing to a photograph of a woman, Dr. Asim says: \"Her mother is the only daughter of my maternal grandmother.\" How is the woman in the photograph related to Dr. Asim?",
    "options": [
      "Sister",
      "Mother",
      "Cousin",
      "Aunt"
    ],
    "correct": 0,
    "topic": "Blood Relations",
    "chapter": "Logical Problems",
    "explain": "Dr. Asim's maternal grandmother's only daughter is Dr. Asim's mother. The woman in the photo has this person as her mother. Therefore, the woman in the photo is the daughter of Dr. Asim's mother, making her Dr. Asim's sister.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b6-lr-7",
    "q": "Problem Statement: A sudden outbreak of waterborne gastroenteritis has been reported in a peri-urban community, affecting more than 300 residents within 48 hours.\nProposed Courses of Action:\nI. The municipal health department should immediately issue a boil-water advisory and distribute chlorine disinfection tablets.\nII. Mobile medical triage teams should be deployed to establish oral rehydration camps in the affected locality.\nIII. All municipal water supply pipelines to the city should be permanently excavated and abandoned.\nWhich courses of action should be logically pursued?",
    "options": [
      "Only I and II",
      "Only I",
      "Only II",
      "All I, II, and III"
    ],
    "correct": 0,
    "topic": "Course of Action",
    "chapter": "Course of Action",
    "explain": "Courses I and II are immediate, proportional, and effective public health emergency measures. Course III is an irrational, extreme, and disruptive overreaction.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b6-lr-8",
    "q": "Problem Statement: Several vials of a scheduled controlled opioid analgesic were discovered missing from a tertiary hospital's central pharmacy during inventory audit.\nProposed Courses of Action:\nI. An immediate internal inquiry committee should be formed and access logs / CCTV surveillance of the pharmacy vault audited.\nII. The entire hospital clinical staff of 2,000 employees should be summarily suspended without pay.\nWhich course of action is logically warranted?",
    "options": [
      "Only I",
      "Only II",
      "Both I and II",
      "Neither I nor II"
    ],
    "correct": 0,
    "topic": "Course of Action",
    "chapter": "Course of Action",
    "explain": "Course I is a systematic, evidence-based administrative protocol. Course II is disproportionate, punitive without evidence, and paralyzes hospital operation.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b6-lr-9",
    "q": "Statements:\nI. The provincial government mandated rigorous vaccination checks at all school entrance gates.\nII. The reported incidence of measles among school-aged children declined by 90% over the following academic year.\nWhat is the logical relationship between these two statements?",
    "options": [
      "Statement I is the cause and Statement II is its effect.",
      "Statement II is the cause and Statement I is its effect.",
      "Both statements are independent causes.",
      "Both statements are effects of an unrelated third cause."
    ],
    "correct": 0,
    "topic": "Cause and Effect",
    "chapter": "Cause and Effect",
    "explain": "Enforcing vaccination checks (Statement I) increases herd immunization rates, which directly causes the dramatic 90% reduction in disease incidence (Statement II).",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b6-lr-10",
    "q": "Statements:\nI. Unprecedented torrential monsoon rains flooded the municipal drainage network for five consecutive days.\nII. Stagnant floodwater pools accumulated in streets and open plots, creating extensive breeding grounds for Aedes mosquitoes.\nWhat is the logical relationship between these two statements?",
    "options": [
      "Statement I is the cause and Statement II is its effect.",
      "Statement II is the cause and Statement I is its effect.",
      "Both statements are effects of independent causes.",
      "Statement I is an indirect effect of Statement II."
    ],
    "correct": 0,
    "topic": "Cause and Effect",
    "chapter": "Cause and Effect",
    "explain": "Excessive torrential rainfall and drainage overflow (Statement I) directly resulted in stagnant pools accumulating across streets (Statement II). Statement I is the cause and Statement II is its effect.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "universities": [
      "MDCAT"
    ]
  }
];

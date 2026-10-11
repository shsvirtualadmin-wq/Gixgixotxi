import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_BATCH2: Question[] = [
  {
    "id": "mdcat-b2-lr-1",
    "q": "Statement: \"A study showed that towns with more hospitals also report higher annual mortality rates. Therefore, hospitals cause increased mortality.\" What is the critical logical flaw in this argument?",
    "options": [
      "Confusing correlation with causation and ignoring the confounding factor of population size and illness severity",
      "Assuming that hospital doctors are adequately trained",
      "Overestimating the accuracy of mortality records",
      "Failing to compare private clinics with public hospitals"
    ],
    "correct": 0,
    "topic": "Critical Thinking",
    "explain": "Larger cities with sicker populations naturally build more hospitals, and severely ill individuals go to hospitals where mortality is concentrated. Correlation does not imply causation.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "chapter": "Critical Thinking",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-2",
    "q": "Argument: \"All highly rated surgeons at the institute have performed over 500 successful operations. Dr. Tahir has performed 600 successful operations; therefore, he must be a highly rated surgeon.\" Which logical fallacy is committed here?",
    "options": [
      "Affirming the consequent (assuming a necessary condition is sufficient)",
      "Denying the antecedent",
      "Circular reasoning (begging the question)",
      "Ad hominem circumstantial"
    ],
    "correct": 0,
    "topic": "Critical Thinking",
    "explain": "The premise states: Highly rated -> 500+ operations. It does not state that having 500+ operations automatically guarantees a high rating. Dr. Tahir meeting the operation threshold is necessary, not sufficient.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "chapter": "Critical Thinking",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-3",
    "q": "Determine the next term in the alphanumeric sequence: B2D, D4G, F8J, H16M, ?",
    "options": [
      "J32P",
      "K32P",
      "J24O",
      "I32Q"
    ],
    "correct": 0,
    "topic": "Letter and Symbol Series",
    "explain": "First letters advance by +2 (B, D, F, H, J); middle numbers double (2, 4, 8, 16, 32); third letters advance by +3 (D, G, J, M, P). Next term is J32P.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "chapter": "Letter and Symbol Series",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-4",
    "q": "Find the missing number in the following sequence: 3, 7, 16, 35, 74, ?",
    "options": [
      "153",
      "148",
      "149",
      "156"
    ],
    "correct": 0,
    "topic": "Letter and Symbol Series",
    "explain": "Pattern: (3 × 2) + 1 = 7; (7 × 2) + 2 = 16; (16 × 2) + 3 = 35; (35 × 2) + 4 = 74; (74 × 2) + 5 = 148 + 5 = 153.",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "chapter": "Letter and Symbol Series",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-5",
    "q": "Premises:\n1. All cardiologists are medical specialists.\n2. No medical specialists are astrologers.\nWhich conclusion logically follows with absolute certainty?",
    "options": [
      "No cardiologists are astrologers.",
      "Some cardiologists are astrologers.",
      "All medical specialists are cardiologists.",
      "Some astrologers are medical doctors."
    ],
    "correct": 0,
    "topic": "Logical Deduction",
    "explain": "Since the entire set of cardiologists is subsumed within medical specialists, and the set of medical specialists shares zero intersection with astrologers, no cardiologist can be an astrologer.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "chapter": "Logical Deduction",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-6",
    "q": "Premises:\n1. Some neurologists are researchers.\n2. All researchers publish peer-reviewed papers.\n3. Some who publish peer-reviewed papers receive grant funding.\nWhich deduction is valid?",
    "options": [
      "Some neurologists publish peer-reviewed papers.",
      "All neurologists publish peer-reviewed papers.",
      "All researchers receive grant funding.",
      "No neurologists receive grant funding."
    ],
    "correct": 0,
    "topic": "Logical Deduction",
    "explain": "Since some neurologists belong to the set of researchers, and every researcher publishes papers, those particular neurologists must publish peer-reviewed papers.",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "chapter": "Logical Deduction",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-7",
    "q": "Five doctors—A, B, C, D, and E—are on call during weekdays (Monday to Friday). A is on call on Wednesday. B is on call immediately after C. D is on call on Monday. On which day is E on call?",
    "options": [
      "Tuesday",
      "Friday",
      "Thursday",
      "Monday"
    ],
    "correct": 0,
    "topic": "Logical Problems",
    "explain": "Days: Mon, Tue, Wed, Thu, Fri. D is on Mon and A is on Wed. Since B is immediately after C, C must be on Thu and B on Fri. The remaining day, Tuesday, must be assigned to E.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "chapter": "Logical Problems",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-8",
    "q": "In a medical clinic waiting room, Farah sits between Bilal and Hina. Tariq sits to the left of Bilal. Zain sits to the right of Hina. Who occupies the central position?",
    "options": [
      "Farah",
      "Bilal",
      "Hina",
      "Tariq"
    ],
    "correct": 0,
    "topic": "Logical Problems",
    "explain": "From left to right: Tariq, Bilal, Farah, Hina, Zain. Farah is in the exact middle (third of five positions).",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "chapter": "Logical Problems",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-9",
    "q": "Pointing to a photograph of a physician, Dr. Aslam said, \"His mother is the only daughter of my mother.\" How is Dr. Aslam related to the physician in the photograph, assuming Dr. Aslam is male and has only one sister?",
    "options": [
      "Maternal uncle",
      "Father",
      "Brother",
      "Grandfather"
    ],
    "correct": 0,
    "topic": "Logical Problems",
    "explain": "\"The only daughter of my mother\" refers to Dr. Aslam's sister. Since the physician's mother is Dr. Aslam's sister, Dr. Aslam is the physician's maternal uncle (mamoo).",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "chapter": "Logical Problems",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-10",
    "q": "Statement: A sharp spike in dengue fever cases has been reported across several urban districts following monsoon rains.\nCourses of Action:\nI. Municipal health authorities should immediately initiate larvicidal spraying in water-accumulating areas and public awareness drives.\nII. All outdoor activities across the province should be permanently banned indefinitely.\nWhich course of action logically follows?",
    "options": [
      "Only Course I follows",
      "Only Course II follows",
      "Both I and II follow",
      "Neither I nor II follows"
    ],
    "correct": 0,
    "topic": "Course of Action",
    "explain": "Course I directly addresses the root vector control and public prevention proportionately. Course II is an impractical, disproportionate overreaction that fails to address standing water vectors.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "chapter": "Course of Action",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-11",
    "q": "Statement: Routine hospital inspection revealed that a batch of essential insulin vials was stored above recommended cold-chain temperatures for over 48 hours.\nCourses of Action:\nI. Quarantine the compromised batch immediately and arrange an emergency replacement supply for patients.\nII. Conduct a quality assay and temperature log audit to identify the refrigeration failure point.\nWhich course of action logically follows?",
    "options": [
      "Both Course I and Course II follow",
      "Only Course I follows",
      "Only Course II follows",
      "Neither I nor II follows"
    ],
    "correct": 0,
    "topic": "Course of Action",
    "explain": "Course I prioritizes immediate patient safety by preventing degraded drug administration; Course II identifies systemic failure to prevent recurrence. Both are appropriate and necessary.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "chapter": "Course of Action",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-12",
    "q": "Statement: Medical students in rural health rotations report severe shortage of disposable personal protective equipment (PPE) during an influenza outbreak.\nCourses of Action:\nI. Immediately divert contingency stockpiles from regional medical warehouses to the rural health centers.\nII. Close all rural health centers and transfer all sick villagers to the provincial capital hospital.\nWhich course of action logically follows?",
    "options": [
      "Only Course I follows",
      "Only Course II follows",
      "Both I and II follow",
      "Neither I nor II follows"
    ],
    "correct": 0,
    "topic": "Course of Action",
    "explain": "Supplying PPE via contingency logistics resolves the supply deficit efficiently; shutting down rural clinics overwhelms tertiary centers and denies immediate care to rural communities.",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "chapter": "Course of Action",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-13",
    "q": "Statements:\nI. The city experienced severe industrial particulate smog over the last three weeks.\nII. Hospital admissions for acute asthma and bronchospasm surged by 45% during the same period.\nWhat is the relationship between the two statements?",
    "options": [
      "Statement I is the cause and Statement II is its effect.",
      "Statement II is the cause and Statement I is its effect.",
      "Both statements are independent causes.",
      "Both statements are effects of an unrelated common cause."
    ],
    "correct": 0,
    "topic": "Cause and Effect",
    "explain": "High concentrations of inhalable particulates irritate airways and provoke bronchospasm, directly causing the spike in respiratory emergency visits.",
    "difficulty": "Easy",
    "subject": "Logical Reasoning",
    "chapter": "Cause and Effect",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-14",
    "q": "Statements:\nI. The provincial government enacted mandatory iodization of all commercial table salt.\nII. The incidence of endemic goiter and congenital cretinism among newborns dropped precipitously over the following decade.\nWhat is the relationship between the statements?",
    "options": [
      "Statement I is the cause and Statement II is its effect.",
      "Statement II is the cause and Statement I is its effect.",
      "Both statements are independent effects.",
      "Statement I is an effect of an unrelated economic event."
    ],
    "correct": 0,
    "topic": "Cause and Effect",
    "explain": "Iodine is an essential substrate for thyroid hormone synthesis; universal salt iodization directly eradicates dietary iodine deficiency disorders like endemic goiter and cretinism.",
    "difficulty": "Medium",
    "subject": "Logical Reasoning",
    "chapter": "Cause and Effect",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b2-lr-15",
    "q": "Statements:\nI. Many urban residents adopted sedentary lifestyles and diets rich in refined carbohydrates.\nII. The national healthcare expenditure on managing Type 2 diabetes and hypertension escalated significantly.\nWhat is the relationship between the statements?",
    "options": [
      "Statement I is the primary cause and Statement II is its direct effect.",
      "Statement II is the cause and Statement I is its effect.",
      "Both statements are unrelated events.",
      "Statement II occurred before Statement I historically."
    ],
    "correct": 0,
    "topic": "Cause and Effect",
    "explain": "Sedentary habits combined with high-glycemic diets are well-established causative drivers of metabolic syndrome, obesity, and insulin resistance, leading directly to escalating long-term chronic disease management costs.",
    "difficulty": "Hard",
    "subject": "Logical Reasoning",
    "chapter": "Cause and Effect",
    "universities": [
      "MDCAT"
    ]
  }
];

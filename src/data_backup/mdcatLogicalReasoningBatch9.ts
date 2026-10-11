import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_BATCH9: Question[] = [
  // --- Critical Thinking (3 MCQs: 1 to 3) ---
  {
    id: 'mdcat-b9-lr-1',
    q: 'Argument: "A hospital observed that patients who consumed green tea daily had a 30% lower incidence of post-operative infections than patients who drank coffee. Therefore, bioactive catechins in green tea directly eradicate bacterial surgical pathogens."\n\nWhich of the following, if true, most seriously weakens the argument by demonstrating a confounding factor?',
    options: [
      'Patients who drank green tea were also significantly younger, exercised regularly, and strictly adhered to pre-operative antiseptic wash protocols',
      'Green tea contains trace amounts of caffeine and polyphenols',
      'Coffee drinkers reported higher satisfaction with hospital breakfast menus',
      'Green tea has been cultivated in Asia for over two millennia'
    ],
    correct: 0,
    topic: 'Critical Thinking - Identifying Confounders and Alternative Explanations',
    chapter: 'Critical Thinking',
    explain: 'The argument assumes a direct causal relationship between green tea consumption and lower infection rates (post hoc ergo propter hoc). Demonstrating that green tea drinkers had systematically different baseline health characteristics (younger age, antiseptic adherence) provides a compelling alternative explanation (confounding), weakening the causal claim.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b9-lr-2',
    q: 'Statement: "Every medical student at King Edward Medical University passed the pathology licensure exam on their first attempt. Zeeshan passed the pathology licensure exam on his first attempt."\n\nWhich conclusion is logically valid based strictly on the statements above?',
    options: [
      'It cannot be determined with certainty whether Zeeshan is a medical student at King Edward Medical University or another institution',
      'Zeeshan is definitively an enrolled student at King Edward Medical University',
      'Only students at King Edward Medical University are capable of passing the exam',
      'Zeeshan scored the highest percentile in the province'
    ],
    correct: 0,
    topic: 'Critical Thinking - Affirming the Consequent Fallacy',
    chapter: 'Critical Thinking',
    explain: 'This is the classic formal fallacy of affirming the consequent: If P (student at KEMU), then Q (passes exam). Given Q (Zeeshan passed), one cannot conclude P (he must be at KEMU), because students from many other universities might also have passed.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b9-lr-3',
    q: 'Argument: "To minimize burnout and medical errors, teaching hospitals must either eliminate 24-hour overnight resident shifts entirely or increase resident physician salaries by 50%."\n\nWhich logical fallacy does the author commit in this argument?',
    options: [
      'False dilemma (bifurcation / either-or fallacy)',
      'Ad hominem attack',
      'Appeal to unverified tradition',
      'Equivocation on medical terminology'
    ],
    correct: 0,
    topic: 'Critical Thinking - Identifying Fallacies (False Dilemma)',
    chapter: 'Critical Thinking',
    explain: 'The speaker presents only two stark choices (eliminating shifts vs. raising salaries) as the exclusive solutions to burnout, ignoring multiple other viable interventions (e.g., protected rest periods, auxiliary nursing support, capped shift handoffs). This is a false dilemma.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },

  // --- Letter and Symbol Series (3 MCQs: 4 to 6) ---
  {
    id: 'mdcat-b9-lr-4',
    q: 'Identify the next term in the alphanumeric pattern:\nB2D, E5H, H10L, K17P, ?',
    options: [
      'N26T',
      'N25S',
      'M26T',
      'O26U'
    ],
    correct: 0,
    topic: 'Letter and Symbol Series - Alphanumeric Sequence Patterns',
    chapter: 'Letter and Symbol Series',
    explain: 'First letter: B (+3) = E (+3) = H (+3) = K (+3) = N. Number sequence: 2 (+3) = 5 (+5) = 10 (+7) = 17 (+9) = 26 (or n² + 1: 1²+1=2, 2²+1=5, 3²+1=10, 4²+1=17, 5²+1=26). Third letter: D (4) (+4) = H (8) (+4) = L (12) (+4) = P (16) (+4) = T (20). Thus, the next term is N26T.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b9-lr-5',
    q: 'Find the missing number in the following numerical sequence:\n7, 11, 19, 35, 67, ?',
    options: [
      '131',
      '128',
      '135',
      '99'
    ],
    correct: 0,
    topic: 'Letter and Symbol Series - Geometric Difference Progression',
    chapter: 'Letter and Symbol Series',
    explain: 'Examine the differences between consecutive terms: 11 - 7 = 4 (2²); 19 - 11 = 8 (2³); 35 - 19 = 16 (2⁴); 67 - 35 = 32 (2⁵). The next difference must be 2⁶ = 64. Next number = 67 + 64 = 131. (Alternatively: 2x - 3: 7×2-3=11, 11×2-3=19, 19×2-3=35, 35×2-3=67, 67×2-3=131).',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b9-lr-6',
    q: 'Determine the missing letter cluster in the series:\nAZ, CX, EV, GT, ?',
    options: [
      'IR',
      'JQ',
      'HS',
      'KP'
    ],
    correct: 0,
    topic: 'Letter and Symbol Series - Alphabetical Opposites Series',
    chapter: 'Letter and Symbol Series',
    explain: 'First letter advances by +2: A (1) → C (3) → E (5) → G (7) → I (9). Second letter retreats by -2 from the end: Z (26) → X (24) → V (22) → T (20) → R (18). (They are reverse-alphabet pairs whose position sums equal 27: I(9) + R(18) = 27). Missing term is IR.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },

  // --- Logical Deduction (3 MCQs: 7 to 9) ---
  {
    id: 'mdcat-b9-lr-7',
    q: 'Premises:\n1. All analgesics are pharmaceutical compounds.\n2. Some pharmaceutical compounds cause mild sedation.\n3. All sedating substances require an auxiliary warning label.\n\nWhich of the following conclusions follows with absolute logical necessity?',
    options: [
      'Some pharmaceutical compounds require an auxiliary warning label.',
      'All analgesics require an auxiliary warning label.',
      'No analgesics cause mild sedation.',
      'All substances requiring an auxiliary warning label are analgesics.'
    ],
    correct: 0,
    topic: 'Logical Deduction - Syllogistic Deductions and Set Inclusions',
    chapter: 'Logical Deduction',
    explain: 'From Premise 2, there exist some pharmaceutical compounds that cause sedation (subset S). By Premise 3, all sedating substances require a warning label. Therefore, those specific pharmaceutical compounds in subset S must require an auxiliary warning label ("Some pharmaceutical compounds require an auxiliary warning label").',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b9-lr-8',
    q: 'Premises:\n- No antibiotic is effective against viral particles.\n- All bacteriophages are viral particles.\n\nConclusion:\nTherefore:',
    options: [
      'No antibiotic is effective against bacteriophages.',
      'Some antibiotics are effective against bacteriophages.',
      'All bacteriophages can be eliminated by standard penicillins.',
      'Bacteriophages are classified as broad-spectrum antibiotics.'
    ],
    correct: 0,
    topic: 'Logical Deduction - Categorical Syllogism (Universal Negative)',
    chapter: 'Logical Deduction',
    explain: 'Let A = Antibiotics, V = Effective against viral particles, B = Bacteriophages. Premise 1: No A is V (A ∩ V = ∅). Premise 2: All B are viral particles (B ⊆ V). Since no antibiotic is effective against any viral particle, no antibiotic can be effective against bacteriophages.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b9-lr-9',
    q: 'Consider the conditional proposition: "If a patient presents with diabetic ketoacidosis (P), then serum bicarbonate will be abnormally low (Q)."\n\nWhich of the following statements is logically equivalent to this conditional statement?',
    options: [
      'If serum bicarbonate is NOT abnormally low, then the patient does NOT present with diabetic ketoacidosis (Contrapositive: ~Q → ~P)',
      'If serum bicarbonate is abnormally low, then the patient presents with diabetic ketoacidosis (Converse: Q → P)',
      'If the patient does NOT present with diabetic ketoacidosis, then serum bicarbonate is NOT low (Inverse: ~P → ~Q)',
      'A patient never presents with diabetic ketoacidosis when bicarbonate is low'
    ],
    correct: 0,
    topic: 'Logical Deduction - Contrapositive Equivalence of Conditionals',
    chapter: 'Logical Deduction',
    explain: 'In formal propositional logic, a conditional statement (P → Q) is strictly equivalent only to its contrapositive (~Q → ~P). The converse (Q → P) and inverse (~P → ~Q) are logical fallacies that do not necessarily hold.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // --- Logical Problems (2 MCQs: 10 to 11) ---
  {
    id: 'mdcat-b9-lr-10',
    q: 'Five doctors (Ali, Bilal, Dawood, Farhan, and Haris) are assigned to on-call duty on five consecutive days from Monday to Friday, one doctor per day:\n1. Farhan must be assigned on Wednesday.\n2. Ali must be on duty on a day immediately before Bilal.\n3. Haris cannot be assigned on Monday or Friday.\n\nWho must be assigned to on-call duty on Monday?',
    options: [
      'Dawood',
      'Ali',
      'Bilal',
      'Haris'
    ],
    correct: 0,
    topic: 'Logical Problems - Linear Scheduling and Constraint Satisfaction',
    chapter: 'Logical Problems',
    explain: 'Days: Mon, Tue, Wed, Thu, Fri. Farhan is on Wednesday. Farhan splits the days into {Mon, Tue} and {Thu, Fri}. The pair (Ali, Bilal) must be consecutive (Ali immediately before Bilal). They can occupy either (Mon, Tue) or (Thu, Fri). Haris cannot be Mon or Fri. If (Ali, Bilal) were Mon-Tue, remaining days Thu-Fri must house Dawood and Haris; but Haris cannot be Fri, so Haris would be Thu and Dawood Fri. But then who is left? Wait: If Ali-Bilal are Thu-Fri, then Mon and Tue must house Dawood and Haris. Since Haris cannot be Mon, Haris MUST be Tue, which forces Dawood on Monday! Let\'s verify: Mon: Dawood, Tue: Haris, Wed: Farhan, Thu: Ali, Fri: Bilal. All constraints are satisfied: Farhan on Wed; Ali immediately before Bilal (Thu-Fri); Haris not Mon/Fri (Haris is Tue). Dawood must be on Monday.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b9-lr-11',
    q: 'In a clinical research lab, flask X is heavier than flask Y. Flask Z is lighter than flask W. Flask Y is heavier than flask W. Which flask is the lightest of all five flasks if flask V is heavier than flask X?',
    options: [
      'Flask Z',
      'Flask Y',
      'Flask W',
      'Flask V'
    ],
    correct: 0,
    topic: 'Logical Problems - Transitive Order of Inequalities',
    chapter: 'Logical Problems',
    explain: 'From the given statements: V > X; X > Y; Y > W; W > Z. Combining these inequalities into a single ordered chain gives: V > X > Y > W > Z. Therefore, Flask Z is conclusively the lightest of all.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },

  // --- Course of Action (2 MCQs: 12 to 13) ---
  {
    id: 'mdcat-b9-lr-12',
    q: 'Statement: "A metropolitan teaching hospital reports a sudden 40% increase in post-cesarean surgical site infections over the past three weeks."\n\nProposed Courses of Action:\nI. Immediately suspend all surgical procedures indefinitely and dismiss the entire surgical obstetrics staff.\nII. Convene the infection control committee to perform microbiological cultures of surgical suites, audit sterile autoclave processing, and review surgical scrub compliance.\nIII. Notify public health authorities and implement an immediate prophylactic antibiotic protocol audit.\n\nWhich course(s) of action logically follow(s)?',
    options: [
      'Only II and III follow',
      'Only I follows',
      'Only II follows',
      'All I, II, and III follow'
    ],
    correct: 0,
    topic: 'Course of Action - Rational Administrative and Clinical Decision Making',
    chapter: 'Course of Action',
    explain: 'Action I is disproportionate, reckless, and punishes staff before investigating the root cause, depriving emergency patients of surgical care. Actions II and III represent methodical, evidence-based hospital epidemiology to identify contamination vectors and review infection control protocols.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b9-lr-13',
    q: 'Statement: "During a seasonal monsoon flood, several rural communities experience an acute outbreak of severe watery diarrhea with rapid dehydration, suspected to be cholera."\n\nProposed Courses of Action:\nI. Rapidly deploy mobile medical units stocked with oral rehydration salts (ORS), IV Ringer\'s lactate, and water purification tablets to the affected flood zones.\nII. Advise residents to delay seeking care until floodwaters recede naturally after several weeks.\nIII. Issue boil-water advisories and establish temporary clean chlorination points in relief camps.\n\nWhich course(s) of action logically follow(s)?',
    options: [
      'Only I and III follow',
      'Only II follows',
      'Only I follows',
      'All I, II, and III follow'
    ],
    correct: 0,
    topic: 'Course of Action - Public Health Emergency Response',
    chapter: 'Course of Action',
    explain: 'Cholera causes lethal hypovolemic shock within hours if untreated. Action II is dangerous and would lead to high mortality. Actions I and III provide rapid life-saving rehydration and halt the waterborne transmission cycle.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },

  // --- Cause and Effect (2 MCQs: 14 to 15) ---
  {
    id: 'mdcat-b9-lr-14',
    q: 'Events:\nEvent A: The municipal health department conducted an aggressive door-to-door vector fogging campaign and eliminated stagnant water receptacles across the city.\nEvent B: The city recorded an 85% drop in confirmed dengue hemorrhagic fever hospitalizations over the subsequent two months.\n\nWhat is the logical relationship between Event A and Event B?',
    options: [
      'Event A is the direct cause and Event B is its effect',
      'Event B is the cause and Event A is its effect',
      'Both events are effects of independent unrelated causes',
      'Both events are independent random occurrences'
    ],
    correct: 0,
    topic: 'Cause and Effect - Vector Control and Disease Incidence',
    chapter: 'Cause and Effect',
    explain: 'Dengue virus is transmitted by Aedes aegypti mosquitoes, which breed in domestic stagnant water. Eradication of breeding sites and adult vector control (fogging) directly depresses the mosquito population, resulting in a documented reduction in human dengue cases. Event A is the cause, and Event B is its effect.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b9-lr-15',
    q: 'Events:\nEvent 1: Global crude oil and diesel prices rose by 45% due to geopolitical shipping disruptions.\nEvent 2: The regional wholesale price of fresh vegetables and dairy products in urban markets escalated sharply.\n\nWhat is the logical relationship between Event 1 and Event 2?',
    options: [
      'Event 1 is the principal cause and Event 2 is its direct economic effect',
      'Event 2 is the cause and Event 1 is the effect',
      'Both events are caused by an unexpected increase in agricultural crop yield',
      'There is no economic or causal relationship between fuel and food prices'
    ],
    correct: 0,
    topic: 'Cause and Effect - Macroeconomic Causality',
    chapter: 'Cause and Effect',
    explain: 'Transporting perishable produce from rural farms to urban markets relies on diesel-powered trucks and refrigerated transit. A steep increase in fuel costs raises transport and operational expenditures, driving up wholesale and retail food prices. Event 1 is the cause, and Event 2 is the effect.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  }
];

import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_BATCH8: Question[] = [
  // --- Critical Thinking (2 MCQs: 1 to 2) ---
  {
    id: 'mdcat-b8-lr-1',
    q: 'Statement: A municipal hospital administration observed that patient recovery times decreased by 25% following the installation of high-efficiency HEPA air filtration units in post-operative recovery wards. The hospital board concluded that airborne microbial counts were the sole determinant of recovery rates. Which of the following, if true, most seriously weakens the hospital board\'s conclusion?',
    options: [
      'Concurrent with the HEPA installation, the hospital implemented a mandatory computerized nurse-to-patient ratio reduction and an enhanced sterile dressing protocol',
      'The HEPA filtration units required monthly maintenance by certified technicians',
      'Airborne particle counts were verified to drop by 80% after installation',
      'Other hospitals in the same district have also considered installing HEPA filtration units'
    ],
    correct: 0,
    topic: 'Critical Thinking - Weakening an Argument',
    chapter: 'Critical Thinking',
    explain: 'The conclusion that HEPA units were the "sole determinant" is undermined by showing an alternative confounding explanation: the simultaneous introduction of better staffing ratios and sterile dressing protocols could account for the improved recovery times.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b8-lr-2',
    q: 'Statement: Studies demonstrate that regular physical exercise reduces the incidence of coronary heart disease. However, competitive marathon runners exhibit higher rates of transient myocardial fibrosis than moderate joggers. Which hypothesis best resolves this apparent paradox?',
    options: [
      'While moderate cardiovascular activity confers optimal cardiovascular conditioning, chronic extreme endurance exertion can exceed physiological remodeling limits and induce localized myocardial strain',
      'Marathon runners consume higher quantities of refined carbohydrates during training',
      'Coronary heart disease and myocardial fibrosis are completely identical pathological conditions',
      'Joggers rarely undergo diagnostic cardiac magnetic resonance imaging'
    ],
    correct: 0,
    topic: 'Critical Thinking - Resolving a Paradox',
    chapter: 'Critical Thinking',
    explain: 'The paradox between general benefits of exercise and the negative outcomes of ultra-endurance running is resolved by recognizing a non-linear dose-response curve (U-shaped or reverse J-shaped curve): moderate exercise is protective, whereas chronic extreme overexertion can lead to structural cardiac stress.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // --- Letter and Symbol Series (3 MCQs: 3 to 5) ---
  {
    id: 'mdcat-b8-lr-3',
    q: 'Find the missing term in the sequence: B2D, D4G, F8J, H16M, ?',
    options: ['J32P', 'J32O', 'I32P', 'K32Q'],
    correct: 0,
    topic: 'Alphanumeric Letter and Number Series',
    chapter: 'Letter and Symbol Series',
    explain: 'First letter advances by +2: B(2), D(4), F(6), H(8) -> J(10). Number doubles: 2, 4, 8, 16 -> 32. Third letter advances by +3: D(4), G(7), J(10), M(13) -> P(16). Thus, the next term is J32P.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b8-lr-4',
    q: 'What is the next term in the alphabetical letter pattern: Z, X, U, Q, L, ?',
    options: ['F', 'G', 'E', 'H'],
    correct: 0,
    topic: 'Decreasing Letter Series with Increasing Gaps',
    chapter: 'Letter and Symbol Series',
    explain: 'Positions from end/start: Z(26) - 2 = X(24); X(24) - 3 = U(21); U(21) - 4 = Q(17); Q(17) - 5 = L(12); L(12) - 6 = F(6). The next letter is F.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b8-lr-5',
    q: 'Determine the missing number in the following alternating sequence: 3, 7, 16, 35, 74, ?',
    options: ['153', '149', '148', '152'],
    correct: 0,
    topic: 'Mathematical Number Sequences',
    chapter: 'Letter and Symbol Series',
    explain: 'The pattern is ×2 + 1, ×2 + 2, ×2 + 3, ×2 + 4, ×2 + 5: 3 × 2 + 1 = 7; 7 × 2 + 2 = 16; 16 × 2 + 3 = 35; 35 × 2 + 4 = 74; 74 × 2 + 5 = 148 + 5 = 153.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // --- Logical Deduction (3 MCQs: 6 to 8) ---
  {
    id: 'mdcat-b8-lr-6',
    q: 'Premise 1: All cardiologists are licensed physicians. Premise 2: Some licensed physicians are medical researchers. Premise 3: Dr. Vance is a cardiologist. Which deduction MUST logically follow?',
    options: [
      'Dr. Vance is definitely a licensed physician.',
      'Dr. Vance is definitely a medical researcher.',
      'All medical researchers are cardiologists.',
      'No cardiologists conduct medical research.'
    ],
    correct: 0,
    topic: 'Syllogisms and Categorical Deductions',
    chapter: 'Logical Deduction',
    explain: 'Since all cardiologists are licensed physicians (Premise 1) and Dr. Vance is a cardiologist (Premise 3), Dr. Vance must be a licensed physician. Whether Dr. Vance conducts research is possible but not guaranteed by the premises.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b8-lr-7',
    q: 'Given: "If a patient tests positive for biomarker X, they must immediately undergo confirmatory biopsy Y." Which of the following is logically equivalent to this conditional statement (its contrapositive)?',
    options: [
      'If a patient does not undergo confirmatory biopsy Y, they did not test positive for biomarker X.',
      'If a patient undergoes confirmatory biopsy Y, they must have tested positive for biomarker X.',
      'If a patient does not test positive for biomarker X, they do not need confirmatory biopsy Y.',
      'Biomarker X is present only if biopsy Y is negative.'
    ],
    correct: 0,
    topic: 'Conditional Logic - Contrapositive Equivalence',
    chapter: 'Logical Deduction',
    explain: 'The conditional statement P -> Q is logically equivalent only to its contrapositive, ~Q -> ~P. Here: "Not undergoing biopsy Y (~Q) -> Not testing positive for biomarker X (~P)".',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b8-lr-8',
    q: 'Premise 1: No antibiotics are effective against acute viral infections. Premise 2: Some respiratory ailments are acute viral infections. Conclusion I: Some respiratory ailments cannot be treated with antibiotics. Conclusion II: All antibiotics can cure non-viral infections. Which conclusions follow?',
    options: [
      'Only Conclusion I follows logically.',
      'Only Conclusion II follows logically.',
      'Both Conclusion I and Conclusion II follow.',
      'Neither Conclusion I nor II follows.'
    ],
    correct: 0,
    topic: 'Deductive Reasoning - Categorical Syllogisms',
    chapter: 'Logical Deduction',
    explain: 'Since some respiratory ailments are acute viral infections, and no antibiotics work against acute viral infections, it follows that those specific respiratory ailments cannot be treated with antibiotics (Conclusion I follows). Premise 1 says nothing about whether antibiotics cure all non-viral infections (Conclusion II does not follow).',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // --- Logical Problems (2 MCQs: 9 to 10) ---
  {
    id: 'mdcat-b8-lr-9',
    q: 'Five medical students—Ali, Bilal, Danial, Fahad, and Hamza—are seated in a single row facing North. Ali is seated to the immediate left of Bilal. Danial is seated between Bilal and Fahad. Hamza is seated at the extreme right end. Who is seated at the extreme left end?',
    options: ['Ali', 'Bilal', 'Danial', 'Fahad'],
    correct: 0,
    topic: 'Linear Arrangement and Seating Order',
    chapter: 'Logical Problems',
    explain: 'From left to right: Ali is to the left of Bilal (A, B). Danial is between Bilal and Fahad (B, D, F). Hamza is at the extreme right (H). Ordering them: Ali - Bilal - Danial - Fahad - Hamza. Therefore, Ali is at the extreme left end.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b8-lr-10',
    q: 'Pointing to a photograph of a surgeon, Zainab said: "His father is the only son of my grandfather." How is Zainab related to the surgeon in the photograph (assuming monogamous single marriage lineages)?',
    options: ['Sister', 'Mother', 'Aunt', 'Daughter'],
    correct: 0,
    topic: 'Blood Relations - Family Tree Deductions',
    chapter: 'Logical Problems',
    explain: '"The only son of my grandfather" is Zainab\'s father. Therefore, the statement simplifies to: "His father is my father." This means the surgeon and Zainab share the same father. Zainab is the sister of the surgeon.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // --- Course of Action (2 MCQs: 11 to 12) ---
  {
    id: 'mdcat-b8-lr-11',
    q: 'Statement: During a routine hospital audit, it was discovered that a batch of intravenous saline solution was contaminated with endotoxins, though no patients have exhibited adverse reactions yet. Course of Action I: Immediately issue an emergency recall of the entire batch and quarantine all remaining bottles across all clinical wards. Course of Action II: Wait until a patient reports adverse pyrogenic symptoms before notifying the manufacturer. Which course(s) of action should be approved?',
    options: [
      'Only Course of Action I is appropriate and logical.',
      'Only Course of Action II is appropriate.',
      'Both Course of Action I and II should be approved.',
      'Neither Course of Action should be taken.'
    ],
    correct: 0,
    topic: 'Course of Action - Patient Safety and Clinical Ethics',
    chapter: 'Course of Action',
    explain: 'Medical safety requires proactive containment of known toxins to prevent life-threatening septic shock. Quarantining the batch immediately (Action I) prevents patient harm. Waiting for adverse reactions (Action II) violates basic medical ethics and safety protocols.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b8-lr-12',
    q: 'Statement: High rates of severe medical student burnout and clinical depression have been reported across public sector teaching hospitals. Course of Action I: Implement institutional mental health support services, enforce regulated working hour caps, and offer confidential counseling. Course of Action II: Cancel all clinical licensing examinations permanently to eliminate student stress entirely. Which course(s) of action is/are appropriate?',
    options: [
      'Only Course of Action I is logical and balanced.',
      'Only Course of Action II is logical.',
      'Both Courses I and II are appropriate.',
      'Neither Course is appropriate.'
    ],
    correct: 0,
    topic: 'Course of Action - Institutional Policy Solutions',
    chapter: 'Course of Action',
    explain: 'Course I addresses the root stressors (working hours, mental health stigma) constructively without compromising healthcare competence. Course II is an extreme and disproportionate measure that would destroy professional healthcare qualification standards.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },

  // --- Cause and Effect (3 MCQs: 13 to 15) ---
  {
    id: 'mdcat-b8-lr-13',
    q: 'Event A: The local government instituted a comprehensive childhood vaccination campaign against measles, achieving 98% coverage in the district. Event B: Hospital admissions for acute measles encephalitis in the district declined by 95% over the subsequent eighteen months. What is the relationship between Event A and Event B?',
    options: [
      'Event A is the direct cause and Event B is its effect.',
      'Event B is the cause and Event A is its effect.',
      'Events A and B are independent events with no causal link.',
      'Both Event A and Event B are independent effects of a common cause.'
    ],
    correct: 0,
    topic: 'Cause and Effect Relationships - Public Health Interventions',
    chapter: 'Cause and Effect',
    explain: 'Widespread vaccination against measles directly induces herd immunity, which directly prevents measles transmission and reduces complications such as encephalitis. Hence, Event A is the cause and Event B is the effect.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b8-lr-14',
    q: 'Event I: Ambient winter air particulate matter (PM2.5) concentrations spiked to severe hazardous levels across the city. Event II: Emergency room presentations for acute asthma exacerbations and chronic obstructive pulmonary flare-ups increased dramatically during the same week. What is the relationship?',
    options: [
      'Event I is the cause and Event II is the effect.',
      'Event II is the cause and Event I is the effect.',
      'Event I and Event II are unrelated coincidences.',
      'Event II is an indirect cause of Event I.'
    ],
    correct: 0,
    topic: 'Cause and Effect - Environmental Health',
    chapter: 'Cause and Effect',
    explain: 'Fine particulate matter PM2.5 penetrates deeply into the bronchial tree, causing direct mucosal irritation and airway hyperreactivity. The particulate spike (Event I) is the causal factor triggering the emergency hospital visits (Event II).',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b8-lr-15',
    q: 'Event I: The price of fresh organic fruits and leafy vegetables surged by 40% due to unseasonal regional floods. Event II: Sales of packaged high-sodium processed convenience foods in metropolitan supermarkets increased by 25%. Which statement best evaluates their causal link?',
    options: [
      'Event I is a major contributing cause and Event II is a consequential effect (economic substitution effect).',
      'Event II is the cause of Event I.',
      'Both events are completely independent and share no economic relationship.',
      'Event I is an effect of Event II.'
    ],
    correct: 0,
    topic: 'Cause and Effect - Economic Substitution Effects',
    chapter: 'Cause and Effect',
    explain: 'When essential fresh foods become acutely expensive or scarce due to floods (Event I), consumers frequently substitute their caloric intake with cheaper, accessible processed foods (Event II). Thus, Event I acts as a driving cause.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  }
];

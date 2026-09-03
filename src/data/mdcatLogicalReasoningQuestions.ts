import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_NEW_QUESTIONS: Question[] = [
  // --- Critical Thinking (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-new-lr-1',
    q: 'Statement: "Regular cardiovascular exercise lowers resting blood pressure and strengthens cardiac muscle efficiency."\nWhich of the following assumptions is implicitly embedded in this statement?',
    options: [
      'Cardiovascular exercise produces measurable physiological benefits for heart health.',
      'Individuals who do not exercise have chronically fatal cardiovascular disease.',
      'Medication is completely redundant if a patient exercises daily.',
      'Blood pressure cannot be lowered by any means other than physical workouts.'
    ],
    correct: 0,
    topic: 'Critical Thinking',
    explain: 'The statement asserts that exercise lowers blood pressure and strengthens cardiac muscle, which directly assumes that physical cardiovascular activity has a tangible, beneficial physiological impact on the heart.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-new-lr-2',
    q: 'Argument: "A hospital observed that patients who drank green tea experienced a 15% reduction in post-operative recovery duration compared to patients who did not. Therefore, the hospital director concluded that compounds in green tea directly accelerate tissue wound healing."\nWhich of the following, if true, most seriously weakens the director\'s conclusion?',
    options: [
      'Patients who chose green tea were significantly younger and followed stricter physical therapy regimens than other patients.',
      'Green tea contains trace polyphenols and catechins with documented antioxidant properties.',
      'Hospital tea supplies were purchased from certified organic tea gardens.',
      'Some nursing staff also consumed green tea during their break hours.'
    ],
    correct: 0,
    topic: 'Critical Thinking',
    explain: 'This points out a critical confounding variable: the green tea group was younger and adhered to physical therapy, so the observed faster recovery could be caused by age and therapy rather than green tea itself.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-new-lr-3',
    q: 'In an urban clinic, a study finds that patients living in neighborhoods with high air pollution have higher rates of respiratory disorders. However, Dr. Tariq asserts that air pollution alone is not proven as the sole causal factor for this disparity.\nWhich finding provides the strongest support for Dr. Tariq\'s reservation?',
    options: [
      'Neighborhoods with high air pollution also exhibit substantially higher smoking rates and lower access to preventative healthcare.',
      'Particulate matter PM2.5 is known to penetrate deep into pulmonary alveolar tissue.',
      'Wind currents disperse atmospheric particulates unevenly across urban zones.',
      'Rural areas with minimal industrial emissions record near-zero industrial smog.'
    ],
    correct: 0,
    topic: 'Critical Thinking',
    explain: 'Dr. Tariq argues that air pollution may not be the only cause. Showing that high-pollution neighborhoods also have higher smoking rates and lower healthcare access demonstrates alternative causal factors, supporting his critical reservation.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // --- Letter and Symbol Series (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-new-lr-4',
    q: 'Find the missing term in the sequential letter series:\nB, E, H, K, N, ?',
    options: ['Q', 'P', 'R', 'S'],
    correct: 0,
    topic: 'Letter and Symbol Series',
    explain: 'The letters advance by 3 positions in the English alphabet: B (2) + 3 = E (5); E (5) + 3 = H (8); H (8) + 3 = K (11); K (11) + 3 = N (14); N (14) + 3 = Q (17).',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-new-lr-5',
    q: 'Determine the missing element in the alphanumeric sequence:\nZ1A, X2C, V6E, T24G, ?',
    options: ['R120I', 'R96I', 'S120H', 'Q120I'],
    correct: 0,
    topic: 'Letter and Symbol Series',
    explain: 'First letter decreases by 2: Z -> X -> V -> T -> R. Middle numbers follow factorial progression: 1 * 2 = 2; 2 * 3 = 6; 6 * 4 = 24; 24 * 5 = 120. Last letter increases by 2: A -> C -> E -> G -> I. Thus, R120I.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-new-lr-6',
    q: 'Identify the next term in the complex symbolic series:\n[A#2], [C$4], [F%8], [J&16], ?',
    options: ['[O*32]', '[P*32]', '[N*32]', '[O*24]'],
    correct: 0,
    topic: 'Letter and Symbol Series',
    explain: 'Letter increments: A (+2) = C; C (+3) = F; F (+4) = J; J (+5) = O. Numeric values double: 2, 4, 8, 16, 32. Symbol transitions to the next standard symbol (*). Hence, [O*32].',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // --- Logical Deduction (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-new-lr-7',
    q: 'Statements:\n1. All cardiologists are medical specialists.\n2. All medical specialists are licensed physicians.\nConclusion:\nWhich statement must be logically true?',
    options: [
      'All cardiologists are licensed physicians.',
      'All licensed physicians are cardiologists.',
      'Some cardiologists are not licensed physicians.',
      'No medical specialists are cardiologists.'
    ],
    correct: 0,
    topic: 'Logical Deduction',
    explain: 'By transitive syllogism: Cardiologists ⊆ Medical Specialists ⊆ Licensed Physicians. Therefore, all cardiologists are necessarily licensed physicians.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-new-lr-8',
    q: 'Statements:\n1. Some antibiotics are bacteriostatic.\n2. All bacteriostatic agents inhibit bacterial ribosomal translation.\nConclusions:\nI. Some antibiotics inhibit bacterial ribosomal translation.\nII. All agents that inhibit bacterial ribosomal translation are antibiotics.\nWhich conclusion(s) logically follow?',
    options: [
      'Only Conclusion I follows',
      'Only Conclusion II follows',
      'Both Conclusions I and II follow',
      'Neither Conclusion I nor II follows'
    ],
    correct: 0,
    topic: 'Logical Deduction',
    explain: 'Since some antibiotics belong to the set of bacteriostatic agents, and all members of that set inhibit ribosomal translation, at least those particular antibiotics must inhibit ribosomal translation (Conclusion I). The converse (all inhibitors are antibiotics) is an invalid illicit conversion.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-new-lr-9',
    q: 'Given the premises:\n1. If a patient tests positive on Assay X, they are infected with Virus Y.\n2. Patient Z does not have Virus Y.\nWhat is the valid logical deduction?',
    options: [
      'Patient Z did not test positive on Assay X.',
      'Patient Z tested positive on Assay X.',
      'Assay X is defective for all tested patients.',
      'Patient Z carries immunity against Virus Y.'
    ],
    correct: 0,
    topic: 'Logical Deduction',
    explain: 'This represents Modus Tollens: P -> Q, not Q, therefore not P. Premise 1 is (Positive X -> Virus Y). Premise 2 is (Not Virus Y). Therefore, (Not Positive X), meaning Patient Z did not test positive on Assay X.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // --- Logical Problems (2 MCQs: 1 Easy, 1 Hard) ---
  {
    id: 'mdcat-new-lr-10',
    q: 'Four medical students — Fatima, Ali, Bilal, and Zainab — finished an anatomy quiz. Fatima scored higher than Ali. Bilal scored higher than Fatima. Zainab scored lower than Ali.\nWho obtained the highest score?',
    options: ['Bilal', 'Fatima', 'Ali', 'Zainab'],
    correct: 0,
    topic: 'Logical Problems',
    explain: 'From the conditions: Fatima > Ali, Bilal > Fatima, Ali > Zainab. Arranging in descending order gives: Bilal > Fatima > Ali > Zainab. Bilal has the highest score.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-new-lr-11',
    q: 'Six hospital departments — A, B, C, D, E, and F — are situated along a straight hallway with rooms numbered 1 to 6 in order.\n1. Room 1 is at the far west and Room 6 is at the far east.\n2. Department B is immediately between A and C.\n3. Department D is in Room 6.\n4. Department E is immediately adjacent to D.\n5. Room 1 is occupied by A.\nWhich department is in Room 3?',
    options: ['C', 'B', 'E', 'F'],
    correct: 0,
    topic: 'Logical Problems',
    explain: 'From given clues: Room 1 = A. Since B is between A and C, Room 2 must be B, and Room 3 must be C. Room 6 = D, Room 5 = E (adjacent to D), and Room 4 = F. Therefore, Room 3 is occupied by C.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // --- Course of Action (2 MCQs: 1 Easy, 1 Medium) ---
  {
    id: 'mdcat-new-lr-12',
    q: 'Situation: A sudden seasonal outbreak of dengue fever leads to acute platelet shortages in the regional blood transfusion bank.\nCourses of Action:\nI. Organize urgent public voluntary blood and platelet donation drives across university campuses.\nII. Mandate that all dengue patients immediately cease fluid intake.\nWhich course of action is appropriate?',
    options: [
      'Only Course I is appropriate',
      'Only Course II is appropriate',
      'Both Courses I and II are appropriate',
      'Neither Course I nor II is appropriate'
    ],
    correct: 0,
    topic: 'Course of Action',
    explain: 'Mobilizing voluntary donation drives directly addresses the acute platelet shortage. Mandating cessation of fluids is medically hazardous because adequate hydration is critical to manage dengue vascular leakage.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-new-lr-13',
    q: 'Situation: A public health audit reveals that several private clinics are disposing of used surgical needles and infectious biohazard waste into municipal trash bins.\nCourses of Action:\nI. The municipal healthcare regulatory authority should issue immediate fines, revoke non-compliant licenses, and inspect waste disposal protocols.\nII. All municipal trash bins in the city should be permanently removed.\nWhich course of action should be pursued?',
    options: [
      'Only Course I should be pursued',
      'Only Course II should be pursued',
      'Both Courses I and II should be pursued',
      'Neither Course I nor II should be pursued'
    ],
    correct: 0,
    topic: 'Course of Action',
    explain: 'Course I addresses the root violators through legal regulatory enforcement and rigorous protocol inspections. Course II is disproportionate and disruptive to civic sanitation, harming the entire city.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // --- Cause and Effect (2 MCQs: 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-new-lr-14',
    q: 'Statements:\nI. The municipal health department chlorinated and purified the primary municipal water reservoir.\nII. The incidence of waterborne gastroenteritis and cholera dropped by 70% in the district over the subsequent month.\nWhich relationship correctly describes these statements?',
    options: [
      'Statement I is the cause and Statement II is its effect.',
      'Statement II is the cause and Statement I is its effect.',
      'Both statements are independent causes.',
      'Both statements are effects of an unrelated common cause.'
    ],
    correct: 0,
    topic: 'Cause and Effect',
    explain: 'Chlorination and purification eliminate pathogenic microorganisms from the drinking water supply (the cause), directly leading to a sharp drop in waterborne gastrointestinal illnesses (the effect).',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-new-lr-15',
    q: 'Statements:\nI. A major heatwave struck the province with daily temperatures exceeding 45°C for two continuous weeks.\nII. Hospitals recorded a sharp surge in elderly patients presenting with acute dehydration and heat stroke.\nWhich relationship is correct?',
    options: [
      'Statement I is the cause and Statement II is its effect.',
      'Statement II is the cause and Statement I is its effect.',
      'Both statements are independent causes.',
      'Statement I and Statement II are unrelated coincidences.'
    ],
    correct: 0,
    topic: 'Cause and Effect',
    explain: 'The extreme, prolonged heatwave (ambient temperature > 45°C) caused thermoregulatory failure and fluid loss, directly causing the spike in emergency hospitalizations for dehydration and heat stroke among vulnerable elderly individuals.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  }
];

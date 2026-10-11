import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_BATCH4: Question[] = [
  // --- Cause and Effect (2 MCQs: 1 Easy, 1 Medium) ---
  {
    id: 'mdcat-b4-lr-1',
    q: 'Statements:\nI. A municipal water pipeline ruptured, contaminating the municipal supply in Sector 4.\nII. Clinics in Sector 4 reported a sharp surge in acute amoebic dysentery and gastroenteritis cases.\nWhat is the logical relationship between I and II?',
    options: [
      'Statement I is the cause and statement II is its effect',
      'Statement II is the cause and statement I is its effect',
      'Both statements are independent causes',
      'Both statements are effects of independent causes'
    ],
    correct: 0,
    topic: 'Cause and Effect',
    explain: 'The rupture and contamination of the municipal water supply (Statement I) directly caused the rapid outbreak of waterborne gastrointestinal infections (Statement II).',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b4-lr-2',
    q: 'Statements:\nI. The Ministry of Health placed stringent import quotas on medical-grade oxygen canisters.\nII. Private metropolitan hospitals launched aggressive on-site atmospheric pressure swing adsorption (PSA) oxygen generator plants.\nDetermine the relationship between the statements:',
    options: [
      'Statement I is the direct cause and Statement II is its immediate effect',
      'Statement II is the cause and Statement I is its effect',
      'Both statements are effects of an underlying common crisis',
      'Both statements are completely independent events'
    ],
    correct: 0,
    topic: 'Cause and Effect',
    explain: 'The restriction on imported cylinders (Statement I) motivated hospitals to establish independent on-site production capabilities (Statement II) to safeguard against clinical shortages.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // --- Course of Action (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-lr-3',
    q: 'Statement: A routine inspection revealed that 25% of the refrigeration units in a district pediatric vaccine repository were fluctuating above the mandatory cold-chain storage threshold (2°C–8°C).\nCourses of Action:\nI. The affected vaccine vials should be quarantined immediately for potency testing before administration.\nII. The malfunctioning cooling equipment should be recalibrated or replaced with backup generators.\nWhich course(s) of action should be taken?',
    options: [
      'Both I and II follow',
      'Only I follows',
      'Only II follows',
      'Neither I nor II follows'
    ],
    correct: 0,
    topic: 'Course of Action',
    explain: 'To prevent administering denatured biological vaccines, quarantining vials (I) is vital, and repairing or replacing compromised cold-chain refrigeration units (II) directly resolves the operational failure.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b4-lr-4',
    q: 'Statement: During a post-operative audit in a tertiary care hospital, a noticeable increase in surgical site infections (SSIs) caused by methicillin-resistant Staphylococcus aureus (MRSA) was detected in the orthopedic ward.\nCourses of Action:\nI. Temporarily pause elective joint arthroplasties in that ward while comprehensive environmental surface decontamination and air sterilization are conducted.\nII. Permanently dismiss all surgical residents and scrub nurses assigned to the ward without investigation.\nWhich action follows?',
    options: [
      'Only I follows',
      'Only II follows',
      'Both I and II follow',
      'Neither I nor II follows'
    ],
    correct: 0,
    topic: 'Course of Action',
    explain: 'Pausing elective procedures to sanitize facilities (I) is an evidence-based clinical precaution. Firing staff without an epidemiological root-cause analysis (II) is punitive, disproportionate, and unscientific.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b4-lr-5',
    q: 'Statement: An emerging aerosol-transmitted viral infection with a basic reproduction number (R0) of 3.2 has been identified among travelers arriving at an international airport terminal.\nCourses of Action:\nI. Deploy non-invasive thermal imaging screening and rapid RT-PCR testing protocols at arrivals for passengers arriving from endemic clusters.\nII. Require all passengers in contact with confirmed cases to undergo a verified 14-day monitored quarantine.\nIII. Impose an immediate nationwide total shutdown of all domestic electricity and water supplies.\nWhich course(s) of action is/are appropriate?',
    options: [
      'Only I and II follow',
      'Only I and III follow',
      'Only II and III follow',
      'All I, II, and III follow'
    ],
    correct: 0,
    topic: 'Course of Action',
    explain: 'Screening and rapid diagnostic protocols (I) combined with evidence-based contact quarantine (II) control outbreak propagation. Disrupting essential water and power infrastructure (III) is extreme, counterproductive, and life-threatening.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // --- Critical Thinking (2 MCQs: 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-lr-6',
    q: 'Argument: "Regular aerobic exercise reduces cardiovascular mortality. Therefore, anyone who runs 5 kilometers every day is completely immune to cardiac events." Which of the following highlights the primary logical flaw in this reasoning?',
    options: [
      'It conflates a statistical risk reduction with absolute personal invulnerability',
      'It assumes running is the only form of aerobic activity',
      'It ignores the dietary preferences of distance runners',
      'It attacks the character of sedentary individuals'
    ],
    correct: 0,
    topic: 'Critical Thinking',
    explain: 'The fallacy lies in extrapolating a population-level risk reduction into a claim of 100% absolute immunity, ignoring genetic, anatomical, and lifestyle factors.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b4-lr-7',
    q: 'Claim: A pharmaceutical company asserts that Drug X cured 92% of patients with chronic tension headaches. A critic notes that 90% of identical control patients given a saline placebo also reported symptom resolution within the same timeframe. Which statement best encapsulates the critic\'s objection?',
    options: [
      'The observed therapeutic benefit of Drug X is not significantly distinguishable from the placebo effect or natural resolution',
      'Drug X is actively toxic and should be withdrawn',
      'Saline placebo contains pharmacological pain-relieving agents',
      'The sample size of both groups was intentionally fabricated'
    ],
    correct: 0,
    topic: 'Critical Thinking',
    explain: 'If the placebo group achieved virtually the same cure rate (90% vs 92%), Drug X demonstrates negligible therapeutic superiority beyond placebo response or spontaneous recovery.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // --- Letter and Symbol Series (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-lr-8',
    q: 'Identify the next letter in the alphabetic progression: B, E, H, K, N, ?',
    options: [
      'Q',
      'P',
      'R',
      'S'
    ],
    correct: 0,
    topic: 'Letter and Symbol Series',
    explain: 'The pattern advances by +3 positions in the English alphabet: B (2) -> E (5) -> H (8) -> K (11) -> N (14) -> 14 + 3 = 17, which corresponds to Q.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b4-lr-9',
    q: 'Find the missing term in the alphanumeric sequence: Z1A, X2C, V6E, T24G, ?',
    options: [
      'R120I',
      'R100H',
      'S120I',
      'Q120J'
    ],
    correct: 0,
    topic: 'Letter and Symbol Series',
    explain: 'First letter decreases by 2: Z -> X -> V -> T -> R. Middle number multiplies sequentially: 1 * 2 = 2; 2 * 3 = 6; 6 * 4 = 24; 24 * 5 = 120. Last letter increases by 2: A -> C -> E -> G -> I. Thus, the missing term is R120I.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b4-lr-10',
    q: 'Determine the subsequent element in the dual-alternating series: C3, G7, E5, I9, G7, K11, ?',
    options: [
      'I9',
      'L12',
      'M13',
      'H8'
    ],
    correct: 0,
    topic: 'Letter and Symbol Series',
    explain: 'Odd positions: C3, E5, G7, ? -> each term increments letter and number by +2 (C=3, E=5, G=7, next is I=9). Even positions: G7, I9, K11 -> each increments by +2. The next term is position 7 (odd series), giving I9.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // --- Logical Deduction (2 MCQs: 1 Easy, 1 Hard) ---
  {
    id: 'mdcat-b4-lr-11',
    q: 'Premises:\n1. All pathogens are biological agents.\n2. All viruses are pathogens.\nConclusion: Which deduction must be validly true?',
    options: [
      'All viruses are biological agents',
      'All biological agents are viruses',
      'Some pathogens are not biological agents',
      'No viruses are biological agents'
    ],
    correct: 0,
    topic: 'Logical Deduction',
    explain: 'By categorical syllogism: If all A (viruses) are B (pathogens) and all B (pathogens) are C (biological agents), then transitively all A must be C (all viruses are biological agents).',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b4-lr-12',
    q: 'Premises:\n1. Some analgesics are non-steroidal anti-inflammatory drugs (NSAIDs).\n2. No NSAID is a pure opioid receptor agonist.\n3. All pure opioid receptor agonists are scheduled controlled substances.\nWhich deduction necessarily follows from these premises?',
    options: [
      'Some analgesics are not pure opioid receptor agonists',
      'All analgesics are scheduled controlled substances',
      'No NSAID is an analgesic',
      'All controlled substances are analgesics'
    ],
    correct: 0,
    topic: 'Logical Deduction',
    explain: 'Since some analgesics are NSAIDs (Premise 1) and no NSAID is an opioid agonist (Premise 2), those specific analgesics that are NSAIDs cannot be pure opioid receptor agonists. Thus, some analgesics are not opioid agonists.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // --- Logical Problems (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-lr-13',
    q: 'Five junior doctors (Dr. A, Dr. B, Dr. C, Dr. D, Dr. E) are scheduled for on-call duties from Monday to Friday, one per day.\n- Dr. C is on call on Wednesday.\n- Dr. A is scheduled immediately before Dr. C.\n- Dr. E is on duty on Friday.\n- Dr. B is scheduled before Dr. D.\nWho is on call on Monday?',
    options: [
      'Dr. B',
      'Dr. A',
      'Dr. D',
      'Dr. E'
    ],
    correct: 0,
    topic: 'Logical Problems',
    explain: 'Days: Mon, Tue, Wed, Thu, Fri. Wed = Dr. C. Immediately before C is Tue = Dr. A. Fri = Dr. E. Remaining days are Mon and Thu for Dr. B and Dr. D. Since B is scheduled before D, Mon = Dr. B and Thu = Dr. D.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b4-lr-14',
    q: 'In a medical ward, Bed 1 through Bed 4 are arranged in a row from West to East.\n- Patient W is not at either extreme end.\n- Patient X is in the bed immediately east of Patient Y.\n- Patient Z is in Bed 1 (westernmost).\nWhich patient occupies Bed 4 (easternmost)?',
    options: [
      'Patient X',
      'Patient W',
      'Patient Y',
      'Patient Z'
    ],
    correct: 0,
    topic: 'Logical Problems',
    explain: 'Bed 1 = Z. W is not at Bed 4 (extreme end), so W must be at Bed 2 or Bed 3. Patient X is immediately east of Patient Y, which requires two adjacent beds (Y then X). The only available adjacent pair is Bed 3 (Y) and Bed 4 (X). Thus Bed 2 = W, Bed 3 = Y, and Bed 4 = X.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b4-lr-15',
    q: 'Four researchers (P, Q, R, S) specialize in different disciplines: Genetics, Virology, Immunology, and Pharmacology. They sit around a circular table facing the center.\n- The Virologist sits directly opposite the Immunologist.\n- P sits immediately to the left of the Geneticist.\n- R is the Pharmacologist and sits directly opposite Q.\nWhat is S\'s medical research specialty?',
    options: [
      'Geneticist',
      'Virologist',
      'Immunologist',
      'Pharmacologist'
    ],
    correct: 0,
    topic: 'Logical Problems',
    explain: 'R is the Pharmacologist and sits opposite Q, so Q is not the Pharmacologist. The other pair sitting opposite each other must be the Virologist and the Immunologist. Therefore, the remaining two individuals (Q and someone else) must include the Geneticist. Since P and Q sit opposite R, Q is either Virologist or Immunologist; thus P and S are the other pair. P is left of the Geneticist, making S the Geneticist.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  }
];

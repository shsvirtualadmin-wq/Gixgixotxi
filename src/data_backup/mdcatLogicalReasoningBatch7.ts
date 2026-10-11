import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_BATCH7: Question[] = [
  // --- Cause and Effect (3 MCQs: 1 to 3) ---
  {
    id: 'mdcat-b7-lr-1',
    q: 'Read the two statements below and determine the logical relationship between them:\n\nStatement I: The municipal government repaired underground sewage leaks and deployed community water filtration units across the district.\nStatement II: There was an 85% drop in reported hospital admissions for acute bacterial gastroenteritis and cholera in the district within three weeks.\n\nWhich of the following is correct?',
    options: [
      'Statement I is the cause and Statement II is its direct effect.',
      'Statement II is the cause and Statement I is its effect.',
      'Both statements are independent causes.',
      'Both statements are effects of an unrelated third cause.'
    ],
    correct: 0,
    topic: 'Cause and Effect Analysis',
    chapter: 'Cause and Effect',
    explain: 'Eliminating contaminated water sources through infrastructure repairs and providing water filtration directly eradicates the primary vector for waterborne pathogens, resulting in the subsequent sharp drop in gastroenteritis admissions.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b7-lr-2',
    q: 'Examine the following two statements:\n\nStatement I: Heavy torrential monsoon rains submerged agricultural farmlands across the southern province for two consecutive weeks.\nStatement II: The retail market prices of staple fresh vegetables and onions in the provincial capital tripled during the same month.\n\nWhich option best describes their relationship?',
    options: [
      'Statement I is the cause and Statement II is its effect.',
      'Statement II is the cause and Statement I is its effect.',
      'Both statements are effects of independent causes.',
      'Both statements are independent causes.'
    ],
    correct: 0,
    topic: 'Environmental Cause and Economic Effect',
    chapter: 'Cause and Effect',
    explain: 'Prolonged inundation of farmland damages standing crops and disrupts harvest transport, creating an acute supply deficit that drives sharp price increases for perishable produce in urban markets.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b7-lr-3',
    q: 'Evaluate the two statements:\n\nStatement I: The national health ministry mandated rigorous thermal screenings and quarantine protocols at all international airports.\nStatement II: Global health agencies declared an emergency outbreak of a novel airborne respiratory contagion in several overseas countries.\n\nWhich of the following describes the relationship?',
    options: [
      'Statement II is the cause and Statement I is its effect.',
      'Statement I is the cause and Statement II is its effect.',
      'Both statements are effects of independent causes.',
      'Both statements are independent causes.'
    ],
    correct: 0,
    topic: 'Public Health Response and Causality',
    chapter: 'Cause and Effect',
    explain: 'The emergent international outbreak of an infectious airborne contagion (Statement II) prompted domestic health authorities to enact defensive border quarantine protocols and airport screenings (Statement I).',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // --- Course of Action (3 MCQs: 4 to 6) ---
  {
    id: 'mdcat-b7-lr-4',
    q: 'Statement: Routine microbiological testing of the central water reservoir supplying a tertiary care hospital reveals dangerous levels of Pseudomonas and coliform contamination.\n\nCourses of Action:\nI. Immediately switch all clinical wards to sterile bottled water and initiate comprehensive chlorine flushing and UV disinfection of the hospital plumbing system.\nII. Discharge all admitted surgical patients immediately without post-operative evaluation to avoid exposure.\n\nWhich course(s) of action logically follow?',
    options: ['Only Course I follows', 'Only Course II follows', 'Both Course I and II follow', 'Neither follows'],
    correct: 0,
    topic: 'Hospital Infection Control - Course of Action',
    chapter: 'Course of Action',
    explain: 'Course I provides immediate alternative safe water while remediating the contamination vector. Course II is reckless, unfeasible, and medically dangerous for vulnerable surgical patients.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b7-lr-5',
    q: 'Statement: A remote rural health clinic experiences frequent electrical grid failures, jeopardizing the temperature-sensitive cold chain required for pediatric vaccines.\n\nCourses of Action:\nI. Install dedicated solar-powered refrigeration units equipped with continuous digital temperature telemetry.\nII. Discontinue childhood vaccination schedules in the district indefinitely.\n\nWhich course(s) of action should be undertaken?',
    options: ['Only Course I follows', 'Only Course II follows', 'Both follow', 'Neither follows'],
    correct: 0,
    topic: 'Healthcare Logistics and Cold Chain Integrity',
    chapter: 'Course of Action',
    explain: 'Installing off-grid solar-powered vaccine refrigerators directly solves the cold chain instability. Halting essential pediatric immunizations would trigger preventable disease outbreaks and is completely unjustified.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b7-lr-6',
    q: 'Statement: Several batches of a commonly prescribed pediatric paracetamol suspension are discovered to be contaminated with toxic industrial diethylene glycol.\n\nCourses of Action:\nI. Issue an immediate nationwide recall of the affected batch numbers and alert pharmacies, pediatricians, and parents via urgent public broadcast.\nII. Initiate an immediate regulatory inspection and criminal audit of the pharmaceutical manufacturer\'s solvent sourcing and quality control protocols.\n\nWhich course(s) of action should the drug regulatory authority pursue?',
    options: ['Both Course I and Course II follow', 'Only Course I follows', 'Only Course II follows', 'Neither follows'],
    correct: 0,
    topic: 'Regulatory Decision Making - Public Safety',
    chapter: 'Course of Action',
    explain: 'Both actions are vital and complementary: Course I immediately halts patient consumption of the deadly toxin, while Course II investigates the supply chain failure and prevents future contaminated batches.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // --- Critical Thinking (3 MCQs: 7 to 9) ---
  {
    id: 'mdcat-b7-lr-7',
    q: 'Premise: "All healthcare workers must be vaccinated against Hepatitis B. Dr. Sarah is a cardiovascular surgeon at City Hospital."\n\nWhich of the following conclusions must be deductively TRUE based on the premise?',
    options: [
      'Dr. Sarah must be vaccinated against Hepatitis B.',
      'Dr. Sarah was vaccinated only after joining City Hospital.',
      'Surgeons are the only healthcare workers at City Hospital.',
      'All vaccinated individuals are cardiovascular surgeons.'
    ],
    correct: 0,
    topic: 'Deductive Syllogisms in Healthcare',
    chapter: 'Critical Thinking',
    explain: 'Since Dr. Sarah is a cardiovascular surgeon, she belongs to the set of healthcare workers. Because ALL healthcare workers must be vaccinated against Hepatitis B, Dr. Sarah must be vaccinated.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b7-lr-8',
    q: 'Argument: "A recent regional survey showed that cities with the highest number of hospitals also report the highest annual number of patient deaths. Therefore, building more hospitals causes increased mortality."\n\nWhat is the fundamental logical fallacy committed in this argument?',
    options: [
      'Confusing correlation with causation (ignoring confounding variables such as population size and severity of illness)',
      'Circular reasoning (begging the question)',
      'Ad hominem attack against hospital administrators',
      'Appeal to unverified popular authority'
    ],
    correct: 0,
    topic: 'Logical Fallacies - Cum Hoc Ergo Propter Hoc',
    chapter: 'Critical Thinking',
    explain: 'The argument mistakes correlation for causation. Larger cities naturally have both more hospitals and larger populations with critically ill patients seeking advanced tertiary care; the hospitals treat mortality rather than causing it.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b7-lr-9',
    q: 'Consider the statement: "If a patient has acute appendicitis, they will present with abdominal pain. Patient X has abdominal pain. Therefore, Patient X definitely has acute appendicitis."\n\nWhy is this diagnostic conclusion logically flawed?',
    options: [
      'It commits the formal fallacy of affirming the consequent (abdominal pain has numerous potential etiologies)',
      'It commits the fallacy of denying the antecedent',
      'It assumes appendicitis is non-inflammatory',
      'It relies on an invalid disjunctive syllogism'
    ],
    correct: 0,
    topic: 'Formal Logical Fallacy - Affirming the Consequent',
    chapter: 'Critical Thinking',
    explain: 'The conditional is "Appendicitis (P) -> Abdominal pain (Q)". Observing Q does not imply P, because abdominal pain can be caused by gastroenteritis, cholecystitis, nephrolithiasis, etc. Concluding P is affirming the consequent.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // --- Letter and Symbol Series (2 MCQs: 10 to 11) ---
  {
    id: 'mdcat-b7-lr-10',
    q: 'Find the next term in the alphanumeric pattern:\n\nB2D, E5G, H8J, K11M, ?',
    options: ['N14P', 'N13P', 'M14P', 'O14Q'],
    correct: 0,
    topic: 'Alphanumeric Series Pattern',
    chapter: 'Letter and Symbol Series',
    explain: 'First letter advances by +3 positions: B(2), E(5), H(8), K(11), N(14). Number increases by +3: 2, 5, 8, 11, 14. Last letter advances by +3 positions: D(4), G(7), J(10), M(13), P(16). Next term is N14P.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b7-lr-11',
    q: 'Determine the missing number in the following numerical progression:\n\n3, 7, 15, 31, 63, ?',
    options: ['127', '126', '125', '128'],
    correct: 0,
    topic: 'Mathematical Number Series',
    chapter: 'Letter and Symbol Series',
    explain: 'Each successive term follows the rule: next = (current × 2) + 1. Specifically: (3×2)+1 = 7; (7×2)+1 = 15; (15×2)+1 = 31; (31×2)+1 = 63; (63×2)+1 = 127. (Alternatively, the differences double: +4, +8, +16, +32, +64 => 63 + 64 = 127).',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },

  // --- Logical Deduction (2 MCQs: 12 to 13) ---
  {
    id: 'mdcat-b7-lr-12',
    q: 'Statements:\n1. All enzymes are organic proteins.\n2. All organic proteins are constructed of peptide-bonded amino acids.\n\nConclusions:\nI. All enzymes are constructed of peptide-bonded amino acids.\nII. All peptide-bonded molecules are enzymes.\n\nWhich conclusion(s) logically follow?',
    options: ['Only Conclusion I follows', 'Only Conclusion II follows', 'Both follow', 'Neither follows'],
    correct: 0,
    topic: 'Categorical Syllogisms',
    chapter: 'Logical Deduction',
    explain: 'By transitive property: Enzymes ⊆ Proteins ⊆ Amino acid chains. Therefore, all enzymes are composed of peptide-bonded amino acids (Conclusion I is valid). Non-enzyme proteins (e.g., collagen) exist, so Conclusion II is an invalid converse.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b7-lr-13',
    q: 'Statements:\n1. Some analgesics are non-steroidal anti-inflammatory drugs (NSAIDs).\n2. All NSAIDs can inhibit cyclooxygenase (COX) enzymes.\n\nConclusions:\nI. Some analgesics can inhibit cyclooxygenase (COX) enzymes.\nII. No analgesics can inhibit cyclooxygenase enzymes.\n\nWhich conclusion logically follows?',
    options: ['Only Conclusion I follows', 'Only Conclusion II follows', 'Both follow', 'Neither follows'],
    correct: 0,
    topic: 'Particular Syllogisms and Deduction',
    chapter: 'Logical Deduction',
    explain: 'Since some analgesics belong to the class of NSAIDs, and all members of NSAIDs inhibit COX enzymes, it necessarily follows that some analgesics inhibit COX enzymes (Conclusion I is logically true).',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },

  // --- Logical Problems (2 MCQs: 14 to 15) ---
  {
    id: 'mdcat-b7-lr-14',
    q: 'Five medical residents—A, B, C, D, and E—are scheduled for on-call night duty from Monday through Friday, exactly one per night:\n- C is on duty on Wednesday.\n- A is on duty on the day immediately preceding C.\n- D is on duty on the day immediately following C.\n- B is on duty before E.\n\nWho is on call on Friday?',
    options: ['E', 'B', 'D', 'A'],
    correct: 0,
    topic: 'Sequential Ordering Logic Problem',
    chapter: 'Logical Problems',
    explain: 'Schedule:\nMonday: ?\nTuesday: A (immediately before C)\nWednesday: C\nThursday: D (immediately after C)\nFriday: ?\nThe remaining days are Monday and Friday for B and E. Since B is before E, B must be Monday and E must be Friday.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b7-lr-15',
    q: 'In a medical research laboratory, four test tubes labeled W, X, Y, and Z contain solutions of different acidities (pH):\n- Solution W has a lower pH (more acidic) than Solution X.\n- Solution Y has a lower pH than Solution Z.\n- Solution X has a lower pH than Solution Y.\n\nWhich solution is the LEAST acidic (has the highest pH)?',
    options: ['Solution Z', 'Solution W', 'Solution X', 'Solution Y'],
    correct: 0,
    topic: 'Comparative Transitive Ordering',
    chapter: 'Logical Problems',
    explain: 'Order of acidity from highest to lowest (lowest pH to highest pH):\nW < X < Y < Z.\nThus, Solution W has the lowest pH (most acidic) and Solution Z has the highest pH (least acidic).',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  }
];

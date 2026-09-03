import { Question } from '../types';

export const MDCAT_LOGICAL_REASONING_BATCH3: Question[] = [
  // Cause and Effect (3 MCQs: 1 Easy, 1 Medium, 1 Hard)
  {
    id: 'mdcat-b3-lr-1',
    q: 'Statements:\nI. The municipal health authority initiated an extensive mosquito-fogging drive across the city.\nII. A sharp spike in dengue viral fever cases had been reported across urban neighborhoods during the preceding month.\nEvaluate the relationship:',
    options: [
      'Statement II is the cause and statement I is its effect',
      'Statement I is the cause and statement II is its effect',
      'Both statements are independent causes',
      'Both statements are effects of independent causes'
    ],
    correct: 0,
    topic: 'Cause and Effect',
    explain: 'The outbreak of dengue fever (Statement II) prompted the municipal authority to launch the mosquito eradication campaign (Statement I), making II the direct cause and I the effect.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b3-lr-2',
    q: 'Statements:\nI. Ground-level ozone and particulate matter (PM2.5) concentrations hit historic peaks across industrial zones.\nII. Outpatient clinics reported an unprecedented surge in acute pediatric bronchial asthma presentations.\nEvaluate the relationship:',
    options: [
      'Statement I is the cause and statement II is its effect',
      'Statement II is the cause and statement I is its effect',
      'Both statements are effects of independent causes',
      'Both statements are independent causes'
    ],
    correct: 0,
    topic: 'Cause and Effect',
    explain: 'Elevated airborne respiratory irritants like PM2.5 and ozone (Statement I) directly precipitate airway inflammation and acute asthma attacks in vulnerable pediatric populations (Statement II).',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b3-lr-3',
    q: 'Statements:\nI. Government subsidies on fresh citrus fruits and green leafy vegetables were increased by 40%.\nII. Commercial fisheries instituted an offshore closed fishing season to prevent pelagic fish stock depletion.\nEvaluate the relationship:',
    options: [
      'Both statements are effects of independent causes',
      'Statement I is the cause and statement II is its effect',
      'Statement II is the cause and statement I is its effect',
      'Both statements are effects of a common cause'
    ],
    correct: 0,
    topic: 'Cause and Effect',
    explain: 'Agricultural fruit subsidies address domestic dietary affordability, while marine fishery closures conserve wild fish populations; both actions stem from distinct, unrelated policy causes.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // Course of Action (2 MCQs: 1 Easy, 1 Hard)
  {
    id: 'mdcat-b3-lr-4',
    q: 'Statement: Contaminated drinking water from a cracked pipeline has led to an acute outbreak of gastroenteritis in District B.\nCourses of Action:\n1. The municipal water utility should isolate the compromised pipeline segment and provide emergency chlorinated tankered water.\n2. All water supply across the entire country should be terminated indefinitely.\nWhich course(s) of action logically follow(s)?',
    options: [
      'Only 1 follows',
      'Only 2 follows',
      'Either 1 or 2 follows',
      'Neither 1 nor 2 follows'
    ],
    correct: 0,
    topic: 'Course of Action',
    explain: 'Action 1 is a proportionate, direct remedial response to the localized problem. Action 2 is disproportionate and irrational nationwide disruption.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b3-lr-5',
    q: 'Statement: Several batches of an over-the-counter paracetamol suspension were found to contain sub-therapeutic active pharmaceutical ingredient concentrations due to manufacturing errors.\nCourses of Action:\n1. The national drug regulatory authority should immediately issue a mandatory recall of all affected lot numbers and inspect the manufacturing plant.\n2. The authority should ban all brands and formulations of paracetamol permanently.\nWhich course(s) of action logically follow(s)?',
    options: [
      'Only 1 follows',
      'Only 2 follows',
      'Both 1 and 2 follow',
      'Neither 1 nor 2 follows'
    ],
    correct: 0,
    topic: 'Course of Action',
    explain: 'Action 1 directly mitigates patient risk and targets the specific quality control failure. Action 2 is an extreme, unwarranted reaction that would eliminate a vital essential medicine entirely.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // Critical Thinking (3 MCQs: 1 Easy, 1 Medium, 1 Hard)
  {
    id: 'mdcat-b3-lr-6',
    q: 'An epidemiologist asserts: "Hospital-acquired infections are solely the consequence of inadequate hand hygiene compliance by attending medical staff." Which finding, if true, most seriously weakens this assertion?',
    options: [
      'A significant proportion of nosocomial pathogen transmission is aerosolized through poorly maintained central ventilation ducting',
      'Physicians wash their hands more frequently than medical interns',
      'Hand hygiene compliance rates improved by 15% after educational workshops',
      'Alcohol-based rub sanitizers inactivate 99.9% of bacterial vegetative cells'
    ],
    correct: 0,
    topic: 'Critical Thinking',
    explain: 'The statement claims inadequate hand hygiene is the SOLE consequence. Demonstrating airborne transmission via HVAC ducts proves other critical mechanisms cause hospital infections, decisively weakening the claim.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b3-lr-7',
    q: 'A study found that regular consumption of green tea correlates with lower cardiovascular disease incidence. The authors conclude: "Compounds in green tea directly protect coronary arteries from atherosclerosis." Which assumption underlies this conclusion?',
    options: [
      'The observed correlation is not primarily attributable to unmeasured confounding factors such as general healthy diet and regular physical exercise among tea drinkers',
      'Green tea contains higher amounts of caffeine than dark roasted coffee',
      'All individuals who drink green tea are completely immune to arterial plaque formation',
      'Coronary artery disease is exclusively driven by dietary intake'
    ],
    correct: 0,
    topic: 'Critical Thinking',
    explain: 'Inferring direct biochemical causation from an epidemiological observational correlation requires assuming that confounding lifestyle variables (exercise, diet) do not account for the health difference.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b3-lr-8',
    q: 'A pharmaceutical firm developed a new antihypertensive drug that reduces systolic blood pressure by 12 mmHg in animal models. The directors argue that launching this drug on the market will immediately reduce stroke mortality in hypertensive patients. Which argument represents the most vulnerable logical flaw in this rationale?',
    options: [
      'It prematurely assumes therapeutic efficacy in animal models translates directly to human clinical outcomes without human phase III trials',
      'It fails to define the exact chemical structure of blood pressure receptors',
      'It overlooks that animal models have different mammalian fur density than humans',
      'It ignores the pricing competition from non-pharmacological herbal supplements'
    ],
    correct: 0,
    topic: 'Critical Thinking',
    explain: 'Conflating physiological efficacy in animal models directly with proven clinical human mortality reduction without human randomized trials commits a significant logical leap in translational medicine.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // Letter and Symbol Series (2 MCQs: 1 Easy, 1 Medium)
  {
    id: 'mdcat-b3-lr-9',
    q: 'Look at this series: B2D, D4F, F8H, H16J, ? What comes next in the sequence?',
    options: ['J32L', 'J32K', 'I32L', 'K32M'],
    correct: 0,
    topic: 'Letter and Symbol Series',
    explain: 'First letter advances by 2 (B -> D -> F -> H -> J). Number doubles each step (2, 4, 8, 16 -> 32). Last letter advances by 2 (D -> F -> H -> J -> L). Result: J32L.',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b3-lr-10',
    q: 'What is the missing term in the sequence: Z1A, X4D, V9G, T16J, ?',
    options: ['R25M', 'S25M', 'R25N', 'Q25L'],
    correct: 0,
    topic: 'Letter and Symbol Series',
    explain: 'First letter moves backward by 2 (Z, X, V, T -> R). Middle number is consecutive squares (1², 2², 3², 4² -> 5² = 25). Last letter moves forward by 3 (A, D, G, J -> M). Thus, R25M.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },

  // Logical Deduction (3 MCQs: 1 Easy, 1 Medium, 1 Hard)
  {
    id: 'mdcat-b3-lr-11',
    q: 'Premises:\n1. All enzymes are biological catalysts.\n2. All biological catalysts are specialized proteins or catalytic RNAs.\nConclusion: All enzymes are specialized proteins or catalytic RNAs.\nThis deductive argument is:',
    options: ['Valid and sound', 'Invalid', 'Sound but invalid', 'A false syllogism'],
    correct: 0,
    topic: 'Logical Deduction',
    explain: 'The syllogism follows Barbara form (All A are B; All B are C; therefore, All A are C), which is logically valid and factually true (sound).',
    difficulty: 'Easy',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b3-lr-12',
    q: 'Premises:\n1. Some analgesics are non-steroidal anti-inflammatory drugs (NSAIDs).\n2. All NSAIDs inhibit cyclooxygenase enzymes.\nWhich conclusion necessarily follows?',
    options: [
      'Some analgesics inhibit cyclooxygenase enzymes',
      'All cyclooxygenase inhibitors are analgesics',
      'No analgesics inhibit cyclooxygenase enzymes',
      'All analgesics are NSAIDs'
    ],
    correct: 0,
    topic: 'Logical Deduction',
    explain: 'Since some analgesics are NSAIDs, and every NSAID inhibits cyclooxygenase enzymes, it is mathematically necessary that those specific analgesics inhibit cyclooxygenase enzymes.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b3-lr-13',
    q: 'Premises:\n1. If a virus has an RNA genome and uses reverse transcriptase, it belongs to retroviruses or hepadnaviruses.\n2. Virus X does not belong to retroviruses and does not belong to hepadnaviruses.\nWhat valid deduction must follow regarding Virus X?',
    options: [
      'Virus X does not both have an RNA genome and use reverse transcriptase',
      'Virus X definitely possesses a double-stranded DNA genome',
      'Virus X possesses no envelope glycoproteins',
      'Virus X cannot infect eukaryotic hosts'
    ],
    correct: 0,
    topic: 'Logical Deduction',
    explain: 'By Modus Tollens (contrapositive of P -> Q): If NOT Q, then NOT P. Therefore, it is false that Virus X has an RNA genome and uses reverse transcriptase.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  },

  // Logical Problems (2 MCQs: 1 Medium, 1 Hard)
  {
    id: 'mdcat-b3-lr-14',
    q: 'Five junior medical officers (P, Q, R, S, T) are scheduled for on-call duties from Monday to Friday, one per day. P must be on call on Wednesday. Q cannot take Friday. S is always on call immediately before P. What day is S on call?',
    options: ['Tuesday', 'Monday', 'Thursday', 'Friday'],
    correct: 0,
    topic: 'Logical Problems',
    explain: 'Since P is scheduled for Wednesday, and S must be on call immediately before P, S must be assigned to Tuesday.',
    difficulty: 'Medium',
    subject: 'Logical Reasoning'
  },
  {
    id: 'mdcat-b3-lr-15',
    q: 'Four surgical residents (W, X, Y, Z) each scrub into a different subspecialty: Orthopedics, Neurosurgery, Cardiology, or Pediatrics. W does not scrub into Cardiology or Pediatrics. X scrubs into Orthopedics. Y does not scrub into Cardiology. Who scrubs into Neurosurgery?',
    options: ['W', 'Y', 'Z', 'X'],
    correct: 0,
    topic: 'Logical Problems',
    explain: 'X = Orthopedics. Remaining are Neurosurgery, Cardiology, Pediatrics. W is not Cardiology or Pediatrics, so W must be Neurosurgery.',
    difficulty: 'Hard',
    subject: 'Logical Reasoning'
  }
];

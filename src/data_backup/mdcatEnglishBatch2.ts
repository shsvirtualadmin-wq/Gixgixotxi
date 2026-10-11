import { Question } from '../types';

export const MDCAT_ENGLISH_BATCH2: Question[] = [
  // --- Vocabulary (2 MCQs: 1 Easy, 1 Medium) ---
  {
    id: 'mdcat-b2-eng-1',
    q: 'Choose the option that is most nearly SYNONYMOUS in meaning to the capitalized word: "The surgeon\'s LUCID explanation of the procedure put the anxious patient at ease."',
    options: ['Clear and readily intelligible', 'Ambiguous and vague', 'Lengthy and tedious', 'Harsh and demanding'],
    correct: 0,
    topic: 'Vocabulary',
    explain: '"Lucid" means expressed clearly and easy to understand, rational, or transparent.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b2-eng-2',
    q: 'Choose the option that is most nearly OPPOSITE in meaning (antonym) to the capitalized word: "The minister was praised for his FRUGAL management of the public hospital budget."',
    options: ['Extravagant and wasteful', 'Economical and prudent', 'Cautious and reserved', 'Strict and disciplined'],
    correct: 0,
    topic: 'Vocabulary',
    explain: '"Frugal" means sparing or economical with regard to money or food. Its direct antonym is extravagant or wasteful.',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Grammar (2 MCQs: 1 Easy, 1 Hard) ---
  {
    id: 'mdcat-b2-eng-3',
    q: 'Choose the grammatically correct sentence complying with the rules of subject-verb agreement:',
    options: ['Neither the lead surgeon nor the resident doctors were available in the emergency ward.', 'Neither the lead surgeon nor the resident doctors was available in the emergency ward.', 'Neither the lead surgeon or the resident doctors were available in the emergency ward.', 'Neither the lead surgeon nor the resident doctors is available in the emergency ward.'],
    correct: 0,
    topic: 'Grammar',
    explain: 'When subjects are connected by "neither... nor", the verb agrees with the closer subject ("resident doctors" is plural, requiring the plural verb "were").',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b2-eng-4',
    q: 'Identify the sentence that correctly employs the subjunctive mood:',
    options: ['The medical board insisted that every physician submit his credentials before the audit.', 'The medical board insisted that every physician submits his credentials before the audit.', 'The medical board insisted that every physician submitted his credentials before the audit.', 'The medical board insisted that every physician must submit his credentials before the audit.'],
    correct: 0,
    topic: 'Grammar',
    explain: 'Verbs of demand, recommendation, or insistence ("insisted that...") require the base form (bare infinitive) of the verb in the subjunctive clause ("submit", not "submits" or "submitted").',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Sentence Completion (2 MCQs: 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-eng-5',
    q: 'Complete the sentence with the most logically coherent word pair: "Although the experimental therapy was initially met with _______ by the medical community, subsequent clinical trials yielded _______ evidence of its efficacy."',
    options: ['skepticism ... compelling', 'enthusiasm ... dubious', 'indifference ... negligible', 'acclaim ... refuting'],
    correct: 0,
    topic: 'Sentence Completion',
    explain: '"Although" signals a contrast between initial doubt ("skepticism") and subsequent positive proof ("compelling evidence").',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b2-eng-6',
    q: 'Choose the word that best completes the sentence: "Because the researcher\'s claims were not grounded in empirical data, her peers regarded them as purely _______."',
    options: ['conjectural', 'irrefutable', 'axiomatic', 'substantive'],
    correct: 0,
    topic: 'Sentence Completion',
    explain: '"Conjectural" means based on or involving conjecture; speculative without solid empirical proof.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Comprehension (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-eng-7',
    q: 'Read the short excerpt: "Antimicrobial resistance (AMR) represents one of the top global public health threats. Misuse and overuse of antimicrobials in humans and livestock are the main drivers in the development of drug-resistant pathogens." According to the passage, what is the principal catalyst for drug resistance?',
    options: ['The inappropriate and excessive consumption of antimicrobials', 'Natural mutations unrelated to antibiotic consumption', 'Poor hospital hygiene alone', 'Lack of vaccine production in developing nations'],
    correct: 0,
    topic: 'Comprehension',
    explain: 'The passage explicitly states that "Misuse and overuse of antimicrobials in humans and livestock are the main drivers."',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b2-eng-8',
    q: 'Read the excerpt: "While artificial intelligence algorithms can parse radiographic images with unprecedented rapidity, their outputs remain stochastic correlations rather than causal diagnoses. Clinical judgment, informed by holistic patient history and physical signs, remains irreplaceable." What is the author\'s main assertion regarding AI in healthcare?',
    options: ['AI serves as a powerful computational adjunct but cannot substitute for human clinical discernment.', 'AI should immediately replace diagnostic radiologists in clinical settings.', 'Stochastic algorithms are inherently flawed and should be banned from medicine.', 'Physical examination is no longer needed when radiographic AI is deployed.'],
    correct: 0,
    topic: 'Comprehension',
    explain: 'The author recognizes AI\'s speed but emphasizes that its statistical correlations cannot replace holistic human clinical judgment.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b2-eng-9',
    q: 'Read the excerpt: "The placebo effect underscores the profound psychoneuroimmunological nexus between subjective expectation and biological response. Far from being mere deception, sham interventions trigger measurable endogenous opioid and dopamine release." It can be inferred that the author views the placebo response as:',
    options: ['A genuine neurochemical phenomenon with physiological manifestations', 'An imaginary artifact caused by patient deception', 'An unethical practice with no therapeutic relevance', 'A purely psychological delusion without biological correlate'],
    correct: 0,
    topic: 'Comprehension',
    explain: 'The author notes that placebos trigger "measurable endogenous opioid and dopamine release," affirming it as a genuine physiological and neurochemical reality.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Analogy (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-eng-10',
    q: 'Identify the pair that exhibits the same relationship as the capitalized words: "STETHOSCOPE : PHYSICIAN ::"',
    options: ['Scalpel : Surgeon', 'Medicine : Pharmacist', 'Hospital : Nurse', 'Microscope : Bacteria'],
    correct: 0,
    topic: 'Analogy',
    explain: 'A stethoscope is an essential diagnostic tool used by a physician; a scalpel is an essential surgical tool used by a surgeon (Tool : Practitioner).',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b2-eng-11',
    q: 'Identify the pair that exhibits the same relationship as: "VACCINE : IMMUNITY ::"',
    options: ['Antiseptic : Disinfection', 'Pathogen : Infection', 'Antibiotic : Allergy', 'Fever : Diagnosis'],
    correct: 0,
    topic: 'Analogy',
    explain: 'A vaccine is an agent that produces immunity; an antiseptic is an agent that produces disinfection (Agent : Resulting state).',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b2-eng-12',
    q: 'Identify the pair that exhibits the same relationship as: "ANALGESIC : PAIN ::"',
    options: ['Sedative : Agitation', 'Stimulant : Energy', 'Decongestant : Breathing', 'Symptom : Disease'],
    correct: 0,
    topic: 'Analogy',
    explain: 'An analgesic alleviates or suppresses pain; a sedative alleviates or suppresses agitation/restlessness (Agent : Condition eliminated).',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Sentence Structure (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-eng-13',
    q: 'Identify the sentence that correctly resolves the dangling modifier:',
    options: ['Walking into the pathology laboratory, the researcher discovered that the centrifuge had malfunctioned.', 'Walking into the pathology laboratory, the centrifuge had malfunctioned.', 'Having walked into the pathology laboratory, a broken centrifuge was seen.', 'While walking into the pathology laboratory, the samples were found damaged.'],
    correct: 0,
    topic: 'Sentence Structure',
    explain: 'The participial phrase "Walking into..." must logically modify the subject that follows ("the researcher"). In the other options, the centrifuge or samples are nonsensically made to walk.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b2-eng-14',
    q: 'Choose the sentence that demonstrates correct parallel grammatical structure:',
    options: ['The resident was commended for diagnosing rare disorders, mentoring junior interns, and publishing clinical reports.', 'The resident was commended for diagnosing rare disorders, to mentor junior interns, and published clinical reports.', 'The resident was commended for diagnosing rare disorders, mentoring junior interns, and he published clinical reports.', 'The resident was commended to diagnose rare disorders, mentoring junior interns, and publication of clinical reports.'],
    correct: 0,
    topic: 'Sentence Structure',
    explain: 'All elements in the series must share the identical grammatical form: gerunds "diagnosing...", "mentoring...", and "publishing...".',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b2-eng-15',
    q: 'Which sentence correctly uses semicolons and transitional adverbs to link independent clauses without comma splices?',
    options: ['The patient\'s symptoms were atypical; however, the attending physician successfully identified the underlying etiology.', 'The patient\'s symptoms were atypical, however, the attending physician successfully identified the underlying etiology.', 'The patient\'s symptoms were atypical; however the attending physician successfully identified the underlying etiology.', 'The patient\'s symptoms were atypical, however; the attending physician successfully identified the underlying etiology.'],
    correct: 0,
    topic: 'Sentence Structure',
    explain: 'Joining two independent clauses with a conjunctive adverb ("however") requires a semicolon before the adverb and a comma immediately after it.',
    difficulty: 'Hard',
    subject: 'English'
  }
];

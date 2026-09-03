import { Question } from '../types';

export const MDCAT_ENGLISH_NEW_QUESTIONS: Question[] = [
  // --- Vocabulary (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-new-eng-1',
    q: 'Choose the word that is most nearly synonymous with "CANDID":',
    options: ['Frank and straightforward', 'Secretive and evasive', 'Polite but deceitful', 'Careless and hurried'],
    correct: 0,
    topic: 'Vocabulary',
    explain: '"Candid" means truthful, straightforward, and sincere. "Frank and straightforward" is the direct synonym, whereas "secretive and evasive" is an antonym.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-new-eng-2',
    q: 'Select the most appropriate antonym for the underlined word:\n"The surgeon operated with meticulous precision throughout the critical procedure."',
    options: ['Careless and slapdash', 'Painstaking and diligent', 'Methodical and scrupulous', 'Perceptive and sharp'],
    correct: 0,
    topic: 'Vocabulary',
    explain: '"Meticulous" means showing great attention to detail and being very thorough. Its direct antonym is "careless and slapdash", representing sloppy and neglectful work.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-new-eng-3',
    q: 'Choose the word that correctly replaces the phrase: "A medicine or treatment that cures all diseases or heals all ailments."',
    options: ['Panacea', 'Placebo', 'Palliative', 'Prophylactic'],
    correct: 0,
    topic: 'Vocabulary',
    explain: 'A "panacea" is a universal remedy or cure-all. A "placebo" is an inert substance used as a control, a "palliative" relieves symptoms without curing, and a "prophylactic" prevents disease.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Grammar (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-new-eng-4',
    q: 'Which sentence demonstrates proper subject-verb agreement with correlative conjunctions ("neither... nor")?',
    options: [
      'Neither the principal nor the teachers were in favor of postponing the exam.',
      'Neither the principal nor the teachers was in favor of postponing the exam.',
      'Neither the principal or the teachers were in favor of postponing the exam.',
      'Neither the principal nor the teachers has been in favor of postponing the exam.'
    ],
    correct: 0,
    topic: 'Grammar',
    explain: 'Under the rule of proximity for correlative conjunctions ("neither... nor"), the verb agrees in number with the closer subject ("teachers", which is plural), requiring "were".',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-new-eng-5',
    q: 'Complete the sentence with the correct subjunctive mood verb form:\n"The senior physician insisted that every intern _______ present during the emergency triage briefing."',
    options: ['be', 'is', 'was', 'are'],
    correct: 0,
    topic: 'Grammar',
    explain: 'Verbs of demand, recommendation, or insistence (e.g., "insist that", "recommend that") govern the mandative subjunctive mood, which takes the base form of the verb ("be"), regardless of the singular subject.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-new-eng-6',
    q: 'Which sentence correctly avoids a dangling modifier?',
    options: [
      'Having examined the patient thoroughly, the doctor ordered an immediate diagnostic scan.',
      'Having examined the patient thoroughly, an immediate diagnostic scan was ordered by the doctor.',
      'Examining the patient thoroughly, the emergency room was quiet and orderly.',
      'Having examined the patient thoroughly, the symptoms became clearer to the diagnostic team.'
    ],
    correct: 0,
    topic: 'Grammar',
    explain: 'The introductory participial phrase "Having examined the patient thoroughly" must logically modify the agent immediately following the comma ("the doctor"). In other choices, the modifier dangles by illogically modifying "scan", "emergency room", or "symptoms".',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Sentence Completion (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-new-eng-7',
    q: 'Choose the word that best completes the sentence:\n"The patient was advised to _______ from consuming sugary beverages to regulate blood glucose levels."',
    options: ['abstain', 'reconcile', 'indulge', 'adhere'],
    correct: 0,
    topic: 'Sentence Completion',
    explain: '"Abstain from" means to deliberately restrain oneself from indulging in or consuming something, which fits the medical recommendation.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-new-eng-8',
    q: 'Complete the sentence with the most logical pair of words:\n"Although the initial clinical trials yielded _______ results, prolonged investigation proved the therapeutic compound to be highly _______."',
    options: [
      'equivocal ... efficacious',
      'promising ... hazardous',
      'conclusive ... redundant',
      'futile ... toxic'
    ],
    correct: 0,
    topic: 'Sentence Completion',
    explain: 'The concession word "Although" indicates a contrast between initial uncertainty ("equivocal" meaning ambiguous/undecided) and subsequent positive success ("efficacious" meaning successful in producing an intended therapeutic result).',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-new-eng-9',
    q: 'Fill in the blank with the most precise academic term:\n"Because the epidemiologist found several critical confounding variables in the experimental setup, she considered the published statistical correlations to be _______."',
    options: ['spurious', 'irrefutable', 'axiomatic', 'salutary'],
    correct: 0,
    topic: 'Sentence Completion',
    explain: '"Spurious" means plausible on the surface but false, deceptive, or mathematically invalid due to confounding bias. "Axiomatic" means self-evident, and "salutary" means beneficial.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Comprehension (2 MCQs: 1 Easy, 1 Hard) ---
  {
    id: 'mdcat-new-eng-10',
    q: 'Read the short excerpt:\n"Inoculation primes the adaptive immune system by exposing it to an attenuated or inactivated pathogen, prompting the formation of memory lymphocytes without inducing full pathogenesis."\nWhat is the primary inference of this passage?',
    options: [
      'Vaccination confers immunological protection while minimizing disease risk.',
      'Pathogens are always eradicated before any antibodies can be synthesized.',
      'Inactivated vaccines produce much higher mortality than natural active infection.',
      'Memory lymphocytes only survive if active systemic disease occurs.'
    ],
    correct: 0,
    topic: 'Comprehension',
    explain: 'The passage explicitly explains that introducing attenuated pathogens generates immunological memory lymphocytes without producing full clinical pathogenesis, meaning it confers protective immunity with minimal risk of sickness.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-new-eng-11',
    q: 'Read the following statement:\n"The pervasive misuse of broad-spectrum antimicrobials in non-critical viral infections has accelerated horizontal gene transfer among nosocomial bacteria, severely undermining conventional prophylactic protocols."\nWhat can be logically deduced as the author\'s implicit warning?',
    options: [
      'Inappropriate antibiotic prescribing drives multi-drug bacterial resistance and jeopardizes hospital prevention standards.',
      'Broad-spectrum antibiotics are entirely ineffective against all fungal and bacterial infections.',
      'Horizontal gene transfer is exclusively observed when viral loads are eliminated.',
      'Nosocomial bacteria develop immunity only when prophylactics are discontinued.'
    ],
    correct: 0,
    topic: 'Comprehension',
    explain: 'The author notes that misusing antimicrobials for viral infections fuels horizontal resistance transfer among hospital bacteria, thus warning that excessive/inappropriate prescription creates drug-resistant hospital strains and compromises preventive care.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Analogy (2 MCQs: 1 Easy, 1 Medium) ---
  {
    id: 'mdcat-new-eng-12',
    q: 'Complete the analogy:\nSTETHOSCOPE : AUSCULTATION :: OPHTHALMOSCOPE : _______',
    options: ['Retinal examination', 'Bone density measurement', 'Blood pressure regulation', 'Audiometric assessment'],
    correct: 0,
    topic: 'Analogy',
    explain: 'A stethoscope is a diagnostic instrument used to perform auscultation (listening to sounds of the heart and lungs). Similarly, an ophthalmoscope is an optical instrument used to examine the interior of the eye, particularly the retina.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-new-eng-13',
    q: 'Identify the pair that shares the same relationship as:\nVIRULENT : HARMFUL ::',
    options: [
      'Lethargic : Sluggish',
      'Benign : Dangerous',
      'Volatile : Permanent',
      'Fragile : Indestructible'
    ],
    correct: 0,
    topic: 'Analogy',
    explain: '"Virulent" is synonymous with "harmful" (an intense degree of harm). "Lethargic" is synonymous with "sluggish", maintaining an exact degree-synonym relationship.',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Sentence Structure (2 MCQs: 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-new-eng-14',
    q: 'Identify the sentence that correctly employs parallel structure:',
    options: [
      'The physician advised the patient to exercise daily, to adhere to a balanced diet, and to monitor blood pressure regularly.',
      'The physician advised the patient to exercise daily, adhering to a balanced diet, and to monitor blood pressure regularly.',
      'The physician advised the patient to exercise daily, that he should diet, and monitoring his blood pressure.',
      'The physician advised the patient exercising daily, to adhere to a balanced diet, and monitoring blood pressure.'
    ],
    correct: 0,
    topic: 'Sentence Structure',
    explain: 'Parallel structure requires matching grammatical forms for items in a series. Option A coordinates three infinitive phrases ("to exercise...", "to adhere...", "and to monitor..."), ensuring strict parallelism.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-new-eng-15',
    q: 'Choose the sentence that correctly uses a semicolon and conjunctive adverb to link independent clauses:',
    options: [
      'The patient exhibited severe symptoms of acute appendicitis; nevertheless, the initial ultrasound imaging was inconclusive.',
      'The patient exhibited severe symptoms of acute appendicitis, nevertheless the initial ultrasound imaging was inconclusive.',
      'The patient exhibited severe symptoms of acute appendicitis; nevertheless the initial ultrasound imaging was inconclusive.',
      'The patient exhibited severe symptoms of acute appendicitis nevertheless, the initial ultrasound imaging was inconclusive.'
    ],
    correct: 0,
    topic: 'Sentence Structure',
    explain: 'When joining two independent clauses with a conjunctive adverb (like "nevertheless" or "however"), standard English grammar requires a semicolon before the conjunctive adverb and a comma immediately following it: [Independent Clause] ; nevertheless, [Independent Clause].',
    difficulty: 'Hard',
    subject: 'English'
  }
];

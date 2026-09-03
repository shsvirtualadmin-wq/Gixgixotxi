import { Question } from '../types';

export const MDCAT_ENGLISH_BATCH5: Question[] = [
  // --- Vocabulary (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-eng-1',
    q: 'Choose the correct synonym for the word "BENIGN":',
    options: ['Harmless', 'Malignant', 'Hostile', 'Contagious'],
    correct: 0,
    topic: 'Vocabulary',
    chapter: 'Vocabulary',
    explain: '"Benign" refers to a condition, tumor, or disposition that is gentle, harmless, and not life-threatening (antonym of malignant).',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b5-eng-2',
    q: 'Select the most appropriate antonym for "EPHEMERAL":',
    options: ['Permanent', 'Transient', 'Evancescent', 'Fleeting'],
    correct: 0,
    topic: 'Vocabulary',
    chapter: 'Vocabulary',
    explain: '"Ephemeral" means lasting for a very short time. Its direct antonym is "permanent" or "enduring".',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b5-eng-3',
    q: 'Choose the word closest in meaning to "OBDURATE":',
    options: ['Stubborn', 'Pliable', 'Deceptive', 'Sympathetic'],
    correct: 0,
    topic: 'Vocabulary',
    chapter: 'Vocabulary',
    explain: '"Obdurate" describes someone stubbornly refusing to change their opinion or course of action; unyielding.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Grammar (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-eng-4',
    q: 'Identify the sentence with correct subject-verb agreement:',
    options: [
      'Neither the professor nor the students were aware of the schedule change.',
      'Neither the professor nor the students was aware of the schedule change.',
      'Neither the professor nor the student were aware of the schedule change.',
      'Neither the students nor the professor were aware of the schedule change.'
    ],
    correct: 0,
    topic: 'Grammar',
    chapter: 'Grammar',
    explain: 'When subjects are connected by "neither... nor", the verb agrees in number with the subject closer to it ("students" is plural, so "were" is correct).',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b5-eng-5',
    q: 'Choose the correct form to complete the conditional sentence: "If she _______ more time, she would have completed the analytical experiment."',
    options: ['had had', 'had', 'would have had', 'has had'],
    correct: 0,
    topic: 'Grammar',
    chapter: 'Grammar',
    explain: 'In third conditional sentences expressing an unreal past situation, the if-clause uses the past perfect tense ("had had") and the main clause uses "would have + past participle".',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b5-eng-6',
    q: 'Select the sentence that uses the subjunctive mood correctly:',
    options: [
      'The physician insisted that the patient be kept under observation overnight.',
      'The physician insisted that the patient was kept under observation overnight.',
      'The physician insisted that the patient is kept under observation overnight.',
      'The physician insisted that the patient should had been kept under observation overnight.'
    ],
    correct: 0,
    topic: 'Grammar',
    chapter: 'Grammar',
    explain: 'Verbs of demand or recommendation such as "insist that" require the base form of the verb (subjunctive "be kept"), irrespective of subject number.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Sentence Structure (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-eng-7',
    q: 'Which of the following sentences correctly avoids a dangling modifier?',
    options: [
      'Walking through the hospital corridors, the surgeon heard an emergency code announced.',
      'Walking through the hospital corridors, an emergency code was heard by the surgeon.',
      'Walking through the hospital corridors, the announcement alarmed the surgeon.',
      'Walking through the hospital corridors, fear gripped the surgeon.'
    ],
    correct: 0,
    topic: 'Sentence Structure',
    chapter: 'Sentence Structure',
    explain: 'The introductory participial phrase "Walking through..." must immediately modify the agent performing the action, which is "the surgeon".',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b5-eng-8',
    q: 'Identify the sentence exhibiting correct parallel structure:',
    options: [
      'The clinical protocol involves sterilizing the instruments, administering the anesthetic, and monitoring vital signs.',
      'The clinical protocol involves sterilizing the instruments, to administer anesthetic, and vital signs monitoring.',
      'The clinical protocol involves to sterilize instruments, administering anesthetic, and monitor vitals.',
      'The clinical protocol involves sterilizing the instruments, anesthetic administration, and to monitor vitals.'
    ],
    correct: 0,
    topic: 'Sentence Structure',
    chapter: 'Sentence Structure',
    explain: 'Parallelism requires consistent grammatical forms across list items; here all three components are gerund phrases: "sterilizing...", "administering...", and "monitoring...".',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b5-eng-9',
    q: 'Which sentence correctly resolves the run-on error without creating a comma splice?',
    options: [
      'The experimental vaccine showed high efficacy; however, extensive clinical trials are still required.',
      'The experimental vaccine showed high efficacy, however, extensive clinical trials are still required.',
      'The experimental vaccine showed high efficacy however extensive clinical trials are still required.',
      'The experimental vaccine showed high efficacy; however extensive clinical trials are still required.'
    ],
    correct: 0,
    topic: 'Sentence Structure',
    chapter: 'Sentence Structure',
    explain: 'When joining two independent clauses with a conjunctive adverb like "however", use a semicolon before it and a comma immediately following it.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Sentence Completion (2 MCQs: 1 Easy, 1 Medium) ---
  {
    id: 'mdcat-b5-eng-10',
    q: 'Although the new treatment protocol was _______ by some initial skepticism, subsequent clinical data proved its _______ value.',
    options: [
      'met ... undeniable',
      'welcomed ... questionable',
      'dismissed ... negligible',
      'praised ... trivial'
    ],
    correct: 0,
    topic: 'Sentence Completion',
    chapter: 'Sentence Completion',
    explain: 'The contrast signaled by "Although" requires opposing tones: an initial skeptical reception ("met with skepticism") contrasted with verified positive value ("undeniable value").',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b5-eng-11',
    q: 'The researcher was so _______ in recording observations that even the most _______ discrepancies were meticulously documented.',
    options: [
      'scrupulous ... minute',
      'lax ... glaring',
      'negligent ... subtle',
      'hasty ... obvious'
    ],
    correct: 0,
    topic: 'Sentence Completion',
    chapter: 'Sentence Completion',
    explain: '"Scrupulous" (thorough, extremely attentive to detail) fits the context of recording even "minute" (tiny, subtle) discrepancies meticulously.',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Comprehension (2 MCQs: 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-eng-12',
    q: 'Read the statement: "While antibiotic stewardship programs have curtailed irrational antimicrobial prescriptions, the escalating emergence of multi-drug resistant strains necessitates the rapid development of novel bacteriophage therapeutics." What can be logically inferred?',
    options: [
      'Antibiotic stewardship alone is insufficient to halt the crisis of multi-drug resistance.',
      'Bacteriophage therapeutics have completely eradicated bacterial infections.',
      'Prescription control programs have had zero impact on antibiotic usage.',
      'Multi-drug resistant bacteria have ceased to mutate.'
    ],
    correct: 0,
    topic: 'Comprehension',
    chapter: 'Comprehension',
    explain: 'The statement asserts that despite curtailing irrational prescriptions, resistant strains continue to escalate, proving stewardship alone cannot fully resolve the problem.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b5-eng-13',
    q: 'Read the excerpt: "Epigenetic modifications do not alter the primary nucleotide sequence of DNA; rather, through chromatin remodeling and DNA methylation, they dictate the accessibility of transcriptional machinery to specific genetic loci." What is the central premise?',
    options: [
      'Gene expression can be regulated by chemical modifications without changing the underlying DNA code.',
      'Epigenetics permanently rewrites genomic sequences to cause phenotypic change.',
      'Chromatin remodeling eliminates the requirement for RNA polymerase.',
      'DNA methylation only occurs during post-translational protein modification.'
    ],
    correct: 0,
    topic: 'Comprehension',
    chapter: 'Comprehension',
    explain: 'The text explains that epigenetics regulates gene accessibility and expression through methylation and remodeling without mutating the nucleotide sequence.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Analogy (2 MCQs: 1 Easy, 1 Hard) ---
  {
    id: 'mdcat-b5-eng-14',
    q: 'Select the pair that expresses a relationship most similar to: RETINA : EYE',
    options: [
      'Cochlea : Ear',
      'Lens : Glasses',
      'Neuron : Reflex',
      'Valve : Blood'
    ],
    correct: 0,
    topic: 'Analogy',
    chapter: 'Analogy',
    explain: 'The retina is the sensory receptor structure of the eye responsible for photoreception. Similarly, the cochlea is the sensory receptor structure of the ear for audition.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b5-eng-15',
    q: 'Select the pair that best mirrors the relationship: OSCILLATE : PENDULUM',
    options: [
      'Precess : Gyroscope',
      'Accelerate : Brake',
      'Contract : Tendon',
      'Refract : Mirror'
    ],
    correct: 0,
    topic: 'Analogy',
    chapter: 'Analogy',
    explain: 'Oscillation is the characteristic, intrinsic cyclic physical motion executed by a pendulum. Similarly, precession is the characteristic rotational axis motion of a spinning gyroscope.',
    difficulty: 'Hard',
    subject: 'English'
  }
];

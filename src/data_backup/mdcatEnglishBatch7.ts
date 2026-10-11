import { Question } from '../types';

export const MDCAT_ENGLISH_BATCH7: Question[] = [
  // --- Analogy (3 MCQs: 1 to 3) ---
  {
    id: 'mdcat-b7-eng-1',
    q: 'Identify the pair that exhibits the same functional relationship as the given pair:\n\nSCALPEL : SURGEON ::',
    options: ['CHISEL : SCULPTOR', 'TELESCOPE : ASTRONOMY', 'PEN : PAPER', 'BRUSH : CANVAS'],
    correct: 0,
    topic: 'Tool and Professional Relationship',
    chapter: 'Analogy',
    explain: 'A scalpel is the primary precision instrument used by a surgeon; similarly, a chisel is the primary precision carving tool utilized by a sculptor (tool to user/artisan relationship).',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b7-eng-2',
    q: 'Identify the pair that best expresses a relationship similar to that expressed in the original pair:\n\nINSOMNIA : SLEEP ::',
    options: ['AMNESIA : MEMORY', 'APHASIA : HEARING', 'ANEMIA : MUSCLE', 'FEVER : CHILL'],
    correct: 0,
    topic: 'Pathological Lack/Deficiency Relationship',
    chapter: 'Analogy',
    explain: 'Insomnia is a pathological condition characterized by the inability to sleep; amnesia is a pathological neurological condition characterized by the loss or absence of memory.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b7-eng-3',
    q: 'Select the pair that illustrates the closest analogous relationship:\n\nMETICULOUS : CARELESS ::',
    options: ['GARRULOUS : TACITURN', 'BENEVOLENT : KIND', 'EPHEMERAL : TRANSIENT', 'UBIQUITOUS : OMNIPRESENT'],
    correct: 0,
    topic: 'Antonymous Personality Trait Analogy',
    chapter: 'Analogy',
    explain: 'Meticulous (extremely careful, paying close attention to detail) is an exact antonym of careless; garrulous (excessively talkative) is an exact antonym of taciturn (habitually silent or reserved).',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Comprehension (3 MCQs: 4 to 6) ---
  {
    id: 'mdcat-b7-eng-4',
    q: 'Read the following clinical excerpt and answer the question:\n\n"The proliferation of multi-drug-resistant (MDR) bacterial strains presents an escalating crisis in modern nosocomial medicine. Overuse of broad-spectrum empiric antibiotics exerts severe selective pressure, eliminating susceptible microbiota and allowing resilient mutants possessing plasmid-encoded beta-lactamases or efflux pumps to proliferate unchecked."\n\nAccording to the passage, what is the primary evolutionary driver promoting the rise of resistant bacteria in hospital environments?',
    options: [
      'Selective survival advantage conferred when broad-spectrum antimicrobial agents eradicate susceptible microbial flora',
      'Direct mutagenic alterations caused by hospital sterilizing detergents',
      'The spontaneous cessation of cellular transcription in host tissues',
      'Inadequate caloric nutrition among hospitalized immunocompromised patients'
    ],
    correct: 0,
    topic: 'Reading Comprehension - Main Idea and Inference',
    chapter: 'Comprehension',
    explain: 'The passage explicitly states that overuse of broad-spectrum empiric antibiotics exerts "severe selective pressure, eliminating susceptible microbiota and allowing resilient mutants... to proliferate unchecked."',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b7-eng-5',
    q: 'Read the text below:\n\n"Vaccine-induced herd immunity functions as an immunological shield for individuals who cannot be medically immunized, such as neonates or patients undergoing aggressive chemotherapy. When a critical threshold of the population acquires protective neutralizing antibodies, chains of infectious transmission are effectively severed."\n\nWhat can be logically inferred about the vulnerability of unvaccinated infants when overall community immunization rates fall below the critical threshold?',
    options: [
      'Their risk of contracting communicable infections rises because chains of disease transmission persist in the community',
      'They spontaneously develop innate cellular antibodies through respiratory exposure',
      'They become completely immune via passive maternal antibodies',
      'Their chemotherapy protocols must be immediately suspended'
    ],
    correct: 0,
    topic: 'Reading Comprehension - Logical Deduction',
    chapter: 'Comprehension',
    explain: 'Herd immunity protects unimmunized individuals by severing transmission chains. If community vaccination drops below the threshold, disease transmission chains persist, directly exposing vulnerable neonates.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b7-eng-6',
    q: 'In medical literature, what does the author imply by describing an anatomical feature as "vestigial"?',
    options: [
      'It has lost most or all of its ancestral functional significance through evolutionary reduction',
      'It is acutely inflamed and requires urgent surgical excision',
      'It is an artificially implanted synthetic biocompatible prosthetic',
      'It is hyperactive and secretes excessive endocrine hormones'
    ],
    correct: 0,
    topic: 'Contextual Terminology Comprehension',
    chapter: 'Comprehension',
    explain: 'In evolutionary biology and medicine, a vestigial organ (such as the coccyx or auricular muscles in humans) is an anatomical structure that has lost its ancestral utility and exists in an attenuated, rudimentary form.',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Grammar (3 MCQs: 7 to 9) ---
  {
    id: 'mdcat-b7-eng-7',
    q: 'Identify the grammatically correct sentence complying with subject-verb agreement rules:',
    options: [
      'Neither the attending physician nor the scrub nurses were aware of the power outage.',
      'Neither the attending physician nor the scrub nurses was aware of the power outage.',
      'Neither the scrub nurses nor the attending physician were aware of the power outage.',
      'Neither of the surgeons were present in the operating theater.'
    ],
    correct: 0,
    topic: 'Subject-Verb Agreement with Correlative Conjunctions',
    chapter: 'Grammar',
    explain: 'When subjects are joined by "neither... nor...", the verb agrees in number with the closer subject. In option A, "scrub nurses" (plural) is closer to the verb, so the plural verb "were" is grammatically correct.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b7-eng-8',
    q: 'Select the sentence that correctly utilizes the subjunctive mood to express a hypothetical contrary-to-fact condition:',
    options: [
      'If the resident were more attentive to the monitors, the ventricular arrhythmia would have been detected earlier.',
      'If the resident was more attentive to the monitors, the ventricular arrhythmia would be detected.',
      'If the resident is more attentive, the arrhythmia was detected.',
      'If the resident would be more attentive, the monitor had beeped.'
    ],
    correct: 0,
    topic: 'Subjunctive Mood and Conditional Clauses',
    chapter: 'Grammar',
    explain: 'In counterfactual conditional clauses expressing hypothetical or contrary-to-fact scenarios, the subjunctive past form "were" is used for all persons (e.g., "If he/she/it were...").',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b7-eng-9',
    q: 'Which of the following sentences exhibits correct use of parallel structure?',
    options: [
      'The clinician recommended administering intravenous fluids, monitoring arterial blood gases, and evaluating renal function.',
      'The clinician recommended administering intravenous fluids, to monitor arterial blood gases, and that renal function be evaluated.',
      'The clinician recommended intravenous fluids, monitoring arterial blood gases, and to evaluate renal function.',
      'The clinician recommended to administer fluids, monitoring gases, and evaluation of renal function.'
    ],
    correct: 0,
    topic: 'Parallelism and Grammatical Symmetry',
    chapter: 'Grammar',
    explain: 'Parallel structure requires grammatically identical forms in coordinate series. Option A maintains consistency with three parallel gerund phrases: "administering...", "monitoring...", and "evaluating...".',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Sentence Completion (2 MCQs: 10 to 11) ---
  {
    id: 'mdcat-b7-eng-10',
    q: 'Select the word that best completes the sentence logically and contextually:\n\n"Despite the initial ________ of the laboratory data, repeated spectroscopic trials demonstrated that the experimental compound was extraordinarily ________ in inhibiting viral replication."',
    options: ['ambiguity — potent', 'clarity — ineffective', 'certainty — toxic', 'precision — inert'],
    correct: 0,
    topic: 'Sentence Completion - Contrast and Logic',
    chapter: 'Sentence Completion',
    explain: 'The transitional word "Despite" signals contrast. "Ambiguity" (uncertainty/lack of clarity) contrasts logically with the compound being proven "potent" (highly effective) in repeated trials.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b7-eng-11',
    q: 'Fill in the blank with the most appropriate vocabulary word:\n\n"Because the pathologist\'s report was ________, offering comprehensive histological findings alongside unambiguous diagnostic margins, the oncology team proceeded with immediate targeted therapy."',
    options: ['lucid', 'nebulous', 'equivocal', 'convoluted'],
    correct: 0,
    topic: 'Sentence Completion - Precision and Tone',
    chapter: 'Sentence Completion',
    explain: '"Lucid" means clear, easily intelligible, and transparent. The context of "comprehensive findings alongside unambiguous margins" demands an adjective denoting absolute clarity.',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Sentence Structure (2 MCQs: 12 to 13) ---
  {
    id: 'mdcat-b7-eng-12',
    q: 'Identify the sentence that avoids the grammatical error of a dangling or misplaced modifier:',
    options: [
      'Having examined the patient thoroughly, Dr. Harris documented the abnormal heart murmur in the medical chart.',
      'Having examined the patient thoroughly, the abnormal heart murmur was documented by Dr. Harris.',
      'Examine the patient thoroughly, the medical chart was signed by Dr. Harris.',
      'Walking through the intensive care unit, the monitors beeped loudly at the surgeon.'
    ],
    correct: 0,
    topic: 'Dangling Modifiers and Sentence Structure',
    chapter: 'Sentence Structure',
    explain: 'In option A, the introductory participial modifier "Having examined the patient thoroughly" correctly modifies the immediate subject "Dr. Harris". In B, the modifier illogically modifies "the abnormal heart murmur".',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b7-eng-13',
    q: 'Which sentence correctly resolves a run-on sentence / comma splice between two independent clauses?',
    options: [
      'The electrocardiogram showed acute ST-segment elevation; therefore, the catheterization lab was immediately activated.',
      'The electrocardiogram showed acute ST-segment elevation, therefore, the catheterization lab was immediately activated.',
      'The electrocardiogram showed acute ST-segment elevation, the catheterization lab was immediately activated.',
      'The electrocardiogram showed acute ST-segment elevation but therefore the catheterization lab was activated.'
    ],
    correct: 0,
    topic: 'Independent Clauses and Conjunctive Adverbs',
    chapter: 'Sentence Structure',
    explain: 'Two independent clauses linked by a conjunctive adverb such as "therefore" must be joined by a semicolon preceding the adverb and a comma following it (; therefore,); using only a comma creates a comma splice error.',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Vocabulary (2 MCQs: 14 to 15) ---
  {
    id: 'mdcat-b7-eng-14',
    q: 'What is the most accurate synonym for the medical vocabulary word "PALLIATIVE"?',
    options: ['Alleviating symptoms without curing the underlying disease', 'Exacerbating chronic inflammation', 'Causing rapid tissue necrosis', 'Inherited genetically from parents'],
    correct: 0,
    topic: 'Medical Vocabulary - High-Yield Terms',
    chapter: 'Vocabulary',
    explain: '"Palliative" denotes medical treatment or care aimed at relieving pain and managing distressful symptoms to improve quality of life without addressing curative eradication of the condition.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b7-eng-15',
    q: 'Choose the word that is most nearly OPPOSITE in meaning (antonym) to "BENIGN":',
    options: ['Malignant', 'Innocuous', 'Harmless', 'Indolent'],
    correct: 0,
    topic: 'Antonyms - Clinical Vocabulary',
    chapter: 'Vocabulary',
    explain: '"Benign" refers to a condition or tumor that is non-cancerous, localized, and harmless. Its direct clinical antonym is "malignant", which describes invasive, aggressive, and life-threatening neoplastic disease.',
    difficulty: 'Easy',
    subject: 'English'
  }
];

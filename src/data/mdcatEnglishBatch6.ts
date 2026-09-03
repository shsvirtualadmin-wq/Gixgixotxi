import { Question } from '../types';

export const MDCAT_ENGLISH_BATCH6: Question[] = [
  // --- Vocabulary (3 MCQs: 1 to 3) ---
  {
    id: 'mdcat-b6-eng-1',
    q: 'Choose the word that is most nearly OPPOSITE in meaning (antonym) to "EPHEMERAL":',
    options: ['Perpetual', 'Transient', 'Evancescent', 'Fleeting'],
    correct: 0,
    topic: 'Antonyms',
    chapter: 'Vocabulary',
    explain: '"Ephemeral" means lasting for a very short time (transient, fleeting). The direct antonym is "perpetual" or "eternal", meaning enduring forever.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-2',
    q: 'Choose the word that is most nearly SIMILAR in meaning (synonym) to "UBIQUITOUS":',
    options: ['Omnipresent', 'Scarce', 'Anomalous', 'Concealed'],
    correct: 0,
    topic: 'Synonyms',
    chapter: 'Vocabulary',
    explain: '"Ubiquitous" means present, appearing, or found everywhere simultaneously. Its closest synonym is "omnipresent".',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-3',
    q: 'What is the precise definition of the clinical/scientific term "PANACEA"?',
    options: ['A universal remedy or solution for all diseases and difficulties', 'A chronic infectious autoimmune condition', 'An extreme state of physical exhaustion', 'A temporary surgical incision'],
    correct: 0,
    topic: 'Word Meaning in Context',
    chapter: 'Vocabulary',
    explain: 'A "panacea" (from Greek pan \'all\' + akos \'cure\') is a cure-all; a substance or solution believed or claimed to remedy all diseases or problems.',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Grammar (3 MCQs: 4 to 6) ---
  {
    id: 'mdcat-b6-eng-4',
    q: 'Identify the grammatically correct sentence involving conditional subjunctive mood:',
    options: [
      'If he were more conscientious, he would not make such careless calculation errors.',
      'If he was more conscientious, he would not make such careless calculation errors.',
      'If he is more conscientious, he would not make such careless calculation errors.',
      'If he were more conscientious, he will not make such careless calculation errors.'
    ],
    correct: 0,
    topic: 'Subjunctive Mood and Conditionals',
    chapter: 'Grammar',
    explain: 'In formal hypothetical / counterfactual conditional statements (second conditional), the past subjunctive "were" is used for all persons (including he/she/it), followed by the modal "would" + base verb.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-5',
    q: 'Which preposition correctly completes the sentence: "The physician was thoroughly conversant ______ all the recent protocols in neurosurgical intensive care."?',
    options: ['with', 'about', 'to', 'for'],
    correct: 0,
    topic: 'Appropriate Prepositions',
    chapter: 'Grammar',
    explain: 'The adjective "conversant" strictly collocates with the preposition "with" (to be conversant with something means familiar with or knowledgeable about it).',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-6',
    q: 'Choose the sentence with correct subject-verb agreement:',
    options: [
      'Neither the attending surgeon nor the scrub nurses were aware of the power outage.',
      'Neither the attending surgeon nor the scrub nurses was aware of the power outage.',
      'Neither the attending surgeon or the scrub nurses was aware of the power outage.',
      'Neither the attending surgeon nor the scrub nurses has been aware of the power outage.'
    ],
    correct: 0,
    topic: 'Subject-Verb Agreement',
    chapter: 'Grammar',
    explain: 'When compound subjects are joined by "neither... nor", the verb agrees in person and number with the closer subject. Here, "scrub nurses" is plural, requiring the plural verb "were".',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Sentence Structure (3 MCQs: 7 to 9) ---
  {
    id: 'mdcat-b6-eng-7',
    q: 'Identify the sentence that correctly avoids a dangling modifier:',
    options: [
      'Walking into the clinical laboratory, Dr. Harris noticed the broken centrifuge on the bench.',
      'Walking into the clinical laboratory, the broken centrifuge was noticed on the bench.',
      'Walking into the clinical laboratory, the bench held a broken centrifuge.',
      'Walking into the clinical laboratory, a broken centrifuge caught the eye.'
    ],
    correct: 0,
    topic: 'Dangling and Misplaced Modifiers',
    chapter: 'Sentence Structure',
    explain: 'The introductory participial phrase "Walking into the clinical laboratory" must logically modify the subject immediately following the comma. Dr. Harris was walking, not the centrifuge or the bench.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-8',
    q: 'Choose the sentence that correctly utilizes correlative conjunctions ("not only... but also") in balanced parallel form:',
    options: [
      'The clinical trial not only demonstrated significant efficacy but also documented minimal adverse reactions.',
      'The clinical trial not only demonstrated significant efficacy but also it documented minimal adverse reactions.',
      'The clinical trial demonstrated not only significant efficacy but also had documented minimal adverse reactions.',
      'Not only did the clinical trial demonstrate significant efficacy, but minimal adverse reactions were also documented.'
    ],
    correct: 0,
    topic: 'Correlative Conjunctions and Parallelism',
    chapter: 'Sentence Structure',
    explain: 'In the correct sentence, both parts of the correlative conjunction "not only... but also" are immediately followed by grammatically parallel verb phrases: "demonstrated significant efficacy" and "documented minimal adverse reactions".',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-9',
    q: 'Identify the grammatically correct sentence that correctly fixes a comma splice:',
    options: [
      'The patient exhibited severe acute distress; consequently, the triage nurse immediately summoned the emergency physician.',
      'The patient exhibited severe acute distress, consequently the triage nurse immediately summoned the emergency physician.',
      'The patient exhibited severe acute distress, the triage nurse immediately summoned the emergency physician.',
      'The patient exhibited severe acute distress: consequently, the triage nurse immediately summoned the emergency physician.'
    ],
    correct: 0,
    topic: 'Punctuation and Run-on Sentences',
    chapter: 'Sentence Structure',
    explain: 'Two independent clauses linked by a conjunctive adverb like "consequently" must be separated by a semicolon before the adverb and a comma immediately following it.',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Sentence Completion (4 MCQs: 10 to 13) ---
  {
    id: 'mdcat-b6-eng-10',
    q: 'Select the pair of words that best completes the sentence logically and grammatically:\n"Although the experimental chemotherapy initially seemed _______, subsequent longitudinal trials revealed that its therapeutic benefits were entirely _______."',
    options: [
      'promising ... illusory',
      'ineffective ... undeniable',
      'harmful ... catastrophic',
      'tedious ... profound'
    ],
    correct: 0,
    topic: 'Sentence Completion',
    chapter: 'Sentence Completion',
    explain: 'The contrast word "Although" signals an opposition between initial positive perception and disappointing reality. "Promising" followed by "illusory" (deceptive/nonexistent) fits the semantic contrast perfectly.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-11',
    q: 'Select the word that best completes the sentence:\n"Because the pathologist\'s report was remarkably _______, even the junior resident had no difficulty understanding the diagnosis."',
    options: ['lucid', 'opaque', 'convoluted', 'ambiguous'],
    correct: 0,
    topic: 'Sentence Completion',
    chapter: 'Sentence Completion',
    explain: 'The causal conjunction "Because" links ease of understanding to clarity. "Lucid" means completely clear, transparent, and easy to comprehend.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-12',
    q: 'Select the word that best completes the sentence:\n"The hospital administration took _______ measures to curb hospital-acquired infections, leaving no ward uninspected."',
    options: ['stringent', 'lax', 'negligent', 'cursory'],
    correct: 0,
    topic: 'Sentence Completion',
    chapter: 'Sentence Completion',
    explain: '"Stringent" means strict, rigorous, and demanding. The phrase "leaving no ward uninspected" reinforces thoroughness and strict enforcement.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-13',
    q: 'Select the pair of words that best completes the sentence:\n"Rather than being _______ by the unprecedented diagnostic challenge, the young physician was _______ to investigate the rare pathology further."',
    options: [
      'daunted ... motivated',
      'inspired ... discouraged',
      'appeased ... horrified',
      'confused ... repulsed'
    ],
    correct: 0,
    topic: 'Sentence Completion',
    chapter: 'Sentence Completion',
    explain: '"Rather than being [negative], she was [positive]". "Daunted" (intimidated) followed by "motivated" establishes the proper contrasting relationship.',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Comprehension (4 MCQs: 14 to 17) ---
  {
    id: 'mdcat-b6-eng-14',
    q: 'Read the passage and answer the question:\n"The emergence of multidrug-resistant pathogens represents one of the most perilous global health threats of our century. Overuse and misuse of broad-spectrum antimicrobials in clinical practice and veterinary agriculture have exerted intense selective pressure, accelerating the dissemination of plasmid-mediated resistance cassettes among bacterial populations."\nWhat is the primary factor identified by the author as driving antibiotic resistance?',
    options: [
      'Excessive and inappropriate utilization of antimicrobials exerting selective pressure',
      'Lack of adequate physical sterilization equipment in hospital surgical theaters',
      'Spontaneous viral recombination in human host cells',
      'The complete discontinuation of narrow-spectrum antibiotics'
    ],
    correct: 0,
    topic: 'Reading Comprehension - Main Idea',
    chapter: 'Comprehension',
    explain: 'The text explicitly identifies the "Overuse and misuse of broad-spectrum antimicrobials in clinical practice and veterinary agriculture" exerting selective pressure as the primary driver.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-15',
    q: 'Based on the passage in the previous question, the author\'s tone regarding multidrug resistance can best be described as:',
    options: ['Urgent and warning', 'Indifferent and detached', 'Facetious and lighthearted', 'Uncritically optimistic'],
    correct: 0,
    topic: 'Author Tone Analysis',
    chapter: 'Comprehension',
    explain: 'Terms such as "perilous global health threats", "intense selective pressure", and "accelerating dissemination" denote an urgent, cautionary tone.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-16',
    q: 'Read the short excerpt:\n"Immune checkpoint inhibitors have revolutionized modern oncology by uncoupling the molecular inhibitory pathways that tumors exploit to escape T-cell cytotoxicity. However, this immune liberation frequently engenders immune-related adverse events (irAEs), wherein normal host tissues become innocent victims of auto-reactive T-cell infiltration."\nWhat can be inferred regarding the adverse effects of immune checkpoint inhibitors?',
    options: [
      'The very mechanism that unleashes immune cells against tumors can also cause immune attacks on the patient\'s healthy organs',
      'Checkpoint inhibitors directly poison benign tissue cells via chemical lysis',
      'Checkpoint inhibitors completely prevent any autoimmune inflammation',
      'They fail because they permanently destroy all cytotoxic T lymphocytes'
    ],
    correct: 0,
    topic: 'Reading Comprehension - Inference',
    chapter: 'Comprehension',
    explain: 'The passage explains that liberating T-cells from inhibitory pathways allows them to attack tumors, but also causes auto-reactive T-cell infiltration of normal host tissues (irAEs).',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-17',
    q: 'In the sentence "The physician\'s diagnostic acumen was unassailable, honed through decades of clinical observation at the patient\'s bedside," the word "acumen" most nearly means:',
    options: ['Keen insight and sharp judgment', 'Hesitation and indecision', 'Physical manual dexterity', 'Academic credentials'],
    correct: 0,
    topic: 'Contextual Word Inference',
    chapter: 'Comprehension',
    explain: '"Acumen" denotes the ability to make good judgments and quick, accurate decisions (mental sharpness and insight).',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Analogy (3 MCQs: 18 to 20) ---
  {
    id: 'mdcat-b6-eng-18',
    q: 'Choose the pair of words that best expresses a relationship analogous to the capitalized pair:\nSTETHOSCOPE : AUSCULTATION ::',
    options: [
      'Ophthalmoscope : Fundoscopy',
      'Scalpel : Suture',
      'Thermometer : Hypertension',
      'Microscope : Palpation'
    ],
    correct: 0,
    topic: 'Verbal Analogies',
    chapter: 'Analogy',
    explain: 'A stethoscope is the specific diagnostic instrument used to perform auscultation (listening to bodily sounds). Similarly, an ophthalmoscope is the specific instrument used to perform fundoscopy (inspecting the ocular fundus).',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-19',
    q: 'Choose the pair of words that best expresses a relationship analogous to the capitalized pair:\nANTISEPTIC : INFECTION ::',
    options: [
      'Prophylactic : Disease',
      'Symptom : Cure',
      'Allergen : Immunity',
      'Toxin : Health'
    ],
    correct: 0,
    topic: 'Verbal Analogies',
    chapter: 'Analogy',
    explain: 'An antiseptic is an agent used to prevent or counter infection. Similarly, a prophylactic is an agent or measure taken to prevent disease.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b6-eng-20',
    q: 'Choose the pair of words that best expresses a relationship analogous to the capitalized pair:\nCARDIOLOGIST : MYOCARDIUM ::',
    options: [
      'Nephrologist : Glomerulus',
      'Pathologist : Fracture',
      'Pediatrician : Gerontology',
      'Neurologist : Appendix'
    ],
    correct: 0,
    topic: 'Verbal Analogies',
    chapter: 'Analogy',
    explain: 'A cardiologist specializes in the heart and its muscular tissue (myocardium). Similarly, a nephrologist specializes in the kidney and its filtration units (glomerulus).',
    difficulty: 'Medium',
    subject: 'English'
  }
];

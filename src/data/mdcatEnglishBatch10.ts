import { Question } from '../types';

export const MDCAT_ENGLISH_BATCH10: Question[] = [
  // --- Vocabulary (2 MCQs: 1 to 2) ---
  {
    id: 'mdcat-b10-eng-1',
    q: 'Choose the option that is most nearly synonymous with the capitalized word in context: "The physician\'s favorable PROGNOSIS brought immense relief to the patient\'s anxious family."',
    options: [
      'Forecast of the probable medical outcome',
      'Clinical identification of the disease etiology',
      'Immediate surgical intervention',
      'Prescription of broad-spectrum pharmaceuticals'
    ],
    correct: 0,
    topic: 'Vocabulary in Context - Medical Terminology (Prognosis)',
    chapter: 'Vocabulary',
    explain: '"Prognosis" refers to an expert medical forecast or prediction concerning the likely course and outcome of a disease or condition. "Diagnosis" is the identification of the nature of an illness.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b10-eng-2',
    q: 'Select the option that is most opposite in meaning (antonym) to the capitalized word: "Despite the grueling cross-examination, the witness remained entirely TACITURN."',
    options: [
      'Loquacious and talkative',
      'Reticent and reserved',
      'Belligerent and hostile',
      'Stoic and dispassionate'
    ],
    correct: 0,
    topic: 'Antonyms - Advanced Descriptive Adjectives (Taciturn)',
    chapter: 'Vocabulary',
    explain: '"Taciturn" describes a person who is habitually uncommunicative or reserved in speech. Its direct antonym is "loquacious", meaning excessively talkative or garrulous.',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Grammar (2 MCQs: 3 to 4) ---
  {
    id: 'mdcat-b10-eng-3',
    q: 'Choose the grammatically correct sentence complying with the mandative subjunctive mood:',
    options: [
      'The chief medical officer insisted that every surgical resident wear sterile scrubs before entering the theater.',
      'The chief medical officer insisted that every surgical resident wears sterile scrubs before entering the theater.',
      'The chief medical officer insisted that every surgical resident wore sterile scrubs before entering the theater.',
      'The chief medical officer insisted that every surgical resident must wear sterile scrubs before entering the theater.'
    ],
    correct: 0,
    topic: 'Subjunctive Mood - Mandative Subjunctive Base Verb Form',
    chapter: 'Grammar',
    explain: 'Verbs expressing demand, insistence, or mandate (insist, recommend, demand, require) followed by a "that" clause require the subjunctive mood, which employs the bare base form of the verb ("wear") regardless of subject number or person.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b10-eng-4',
    q: 'Select the sentence containing correct subject-verb agreement:',
    options: [
      'The attending surgeon, along with three scrub nurses and two perfusionists, has arrived in the trauma unit.',
      'The attending surgeon, along with three scrub nurses and two perfusionists, have arrived in the trauma unit.',
      'The attending surgeon, along with three scrub nurses and two perfusionists, were arrived in the trauma unit.',
      'The attending surgeon, along with three scrub nurses and two perfusionists, are arriving in the trauma unit.'
    ],
    correct: 0,
    topic: 'Subject-Verb Agreement - Intervening Parenthetical Phrases',
    chapter: 'Grammar',
    explain: 'Intervening parenthetical phrases introduced by "along with", "as well as", or "in addition to" do not change the grammatical number of the subject. The singular head noun "The attending surgeon" requires the singular verb "has arrived".',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Sentence Completion (3 MCQs: 5 to 7) ---
  {
    id: 'mdcat-b10-eng-5',
    q: 'Fill in the blank with the most appropriate word: "Because the initial clinical trial yielded ________ results with high inter-subject variability, the regulatory committee mandated a larger confirmatory phase III trial."',
    options: [
      'equivocal',
      'definitive',
      'unimpeachable',
      'salutary'
    ],
    correct: 0,
    topic: 'Sentence Completion - Contextual Word Choice (Equivocal)',
    chapter: 'Sentence Completion',
    explain: 'The clause "high inter-subject variability" and the mandate for a "confirmatory trial" indicate that the initial findings were ambiguous or open to multiple interpretations, matching the definition of "equivocal".',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b10-eng-6',
    q: 'Complete the sentence with the correct dependent preposition: "The patient\'s unexpected and rapid postoperative recovery was largely attributed ________ the timely administration of targeted monoclonal antibodies."',
    options: [
      'to',
      'with',
      'for',
      'by'
    ],
    correct: 0,
    topic: 'Sentence Completion - Preposition Collocations (Attribute to)',
    chapter: 'Sentence Completion',
    explain: 'The verb "attribute" strictly collocates with the preposition "to": to attribute [an event/outcome] to [a cause].',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b10-eng-7',
    q: 'Fill in the blank with the correct conditional verb phrase: "If the lab technician ________ the cryotubes at liquid nitrogen temperatures yesterday, the active cellular viability would not have plummeted."',
    options: [
      'had stored',
      'stored',
      'has stored',
      'would store'
    ],
    correct: 0,
    topic: 'Sentence Completion - Third Conditional Construction',
    chapter: 'Sentence Completion',
    explain: 'A third conditional expresses an unreal counterfactual in the past: "If + past perfect (had stored), ... would not have + past participle (would not have plummeted)".',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Comprehension (3 MCQs: 8 to 10) ---
  {
    id: 'mdcat-b10-eng-8',
    q: 'Read the passage: "The escalating global dissemination of carbapenem-resistant Enterobacteriaceae poses an existential challenge to modern clinical practice. Indiscriminate outpatient antibiotic over-prescription coupled with routine sub-therapeutic administration in industrial livestock has exerted relentless selective evolutionary pressure, driving horizontal plasmid-mediated gene transfer." Which statement best summarizes the central claim of the passage?',
    options: [
      'Anthropogenic misuse of antibiotics in outpatient healthcare and agriculture has accelerated the emergence and spread of resistant bacterial strains.',
      'Carbapenems are no longer synthesized due to high production expenses.',
      'Bacterial plasmid transfer is unaffected by antibiotic concentration in agricultural runoffs.',
      'Enterobacteriaceae infections are restricted exclusively to veterinary medicine.'
    ],
    correct: 0,
    topic: 'Reading Comprehension - Central Thesis Identification',
    chapter: 'Comprehension',
    explain: 'The author directly connects human over-prescription and livestock antibiotic feeding to selective pressure driving antimicrobial resistance through horizontal gene transfer.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b10-eng-9',
    q: 'Read the excerpt: "In double-blind placebo-controlled trials, the experimental PCSK9 inhibitor reduced major adverse cardiovascular events by 24% in patients with refractory familial hypercholesterolemia. Nevertheless, health economists highlighted that annual therapy costs exceeding $12,000 may entrench socioeconomic disparities in therapeutic access." What is the tone of the author in this passage?',
    options: [
      'Measured and objective, balancing validated clinical efficacy against socioeconomic access disparities',
      'Uncritically promotional of the pharmaceutical developer',
      'Derisive and openly contemptuous of clinical cardiology',
      'Ambivalent and indifferent to cardiovascular disease'
    ],
    correct: 0,
    topic: 'Reading Comprehension - Authorial Tone Analysis',
    chapter: 'Comprehension',
    explain: 'The author presents objective empirical trial outcomes while conscientiously raising valid economic and ethical concerns regarding cost and equity, exemplifying a measured and balanced tone.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b10-eng-10',
    q: 'Read the passage: "Unlike innate immune defenses that deploy rapid, non-specific phagocytic cascades within hours of pathogen entry, adaptive immunity demands antigen presentation, clonal selection, and somatic hypermutation. While this produces high-affinity immunological memory, it entails an obligatory latency phase of five to seven days before neutralizing antibody titers surge." What can be logically inferred about a person\'s first exposure to a novel viral pathogen?',
    options: [
      'Innate defenses must constrain viral replication during the initial days while adaptive responses mature.',
      'High-affinity neutralizing antibodies are secreted instantaneously upon viral entry.',
      'Phagocytic cells are completely inactive during the first week of infection.',
      'Somatic hypermutation occurs prior to initial exposure to the viral antigen.'
    ],
    correct: 0,
    topic: 'Reading Comprehension - Logical Inference from Expository Text',
    chapter: 'Comprehension',
    explain: 'Because adaptive immunity requires an obligatory 5 to 7 day latency phase before generating protective antibody titers, the host must rely on early innate immune defenses to curb viral spread during the initial phase.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Analogy (2 MCQs: 11 to 12) ---
  {
    id: 'mdcat-b10-eng-11',
    q: 'Select the pair that exhibits the same relationship as the given pair in capital letters: ANTIBIOTIC : BACTERIA ::',
    options: [
      'Antifungal : Fungus',
      'Analgesic : Infection',
      'Antipyretic : Microbe',
      'Antiseptic : Vaccine'
    ],
    correct: 0,
    topic: 'Analogies - Therapeutic Agent to Target Pathogen (Antifungal : Fungus)',
    chapter: 'Analogy',
    explain: 'An antibiotic is a pharmacological agent specifically designed to target and eliminate bacteria. Similarly, an antifungal is a pharmacological agent specifically designed to target and eliminate fungi.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b10-eng-12',
    q: 'Choose the pair of words that best expresses a relationship analogous to that in: STETHOSCOPE : AUSCULTATION ::',
    options: [
      'Sphygmomanometer : Blood pressure measurement',
      'Scalpel : Suture',
      'Thermometer : Anesthesia',
      'Microscope : Disinfection'
    ],
    correct: 0,
    topic: 'Analogies - Medical Instrument to Its Diagnostic Clinical Function',
    chapter: 'Analogy',
    explain: 'A stethoscope is a diagnostic instrument used specifically for auscultation (listening to internal body sounds). Analogously, a sphygmomanometer is an instrument used specifically for blood pressure measurement.',
    difficulty: 'Easy',
    subject: 'English'
  },

  // --- Sentence Structure (3 MCQs: 13 to 15) ---
  {
    id: 'mdcat-b10-eng-13',
    q: 'Identify the sentence that correctly avoids a dangling modifier error:',
    options: [
      'Having sterilized the surgical instruments, the scrub nurse arranged them carefully on the Mayo stand.',
      'Having sterilized the surgical instruments, the Mayo stand was carefully loaded by the scrub nurse.',
      'Having sterilized the surgical instruments, careful arrangement was carried out on the Mayo stand.',
      'Sterilizing the surgical instruments, the Mayo stand held all necessary scalpels.'
    ],
    correct: 0,
    topic: 'Sentence Structure - Dangling Participle Elimination',
    chapter: 'Sentence Structure',
    explain: 'In option A, the introductory participial phrase "Having sterilized the surgical instruments" correctly modifies the immediate subject "the scrub nurse", who logically performed the action. In option B, it illogically modifies "the Mayo stand".',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b10-eng-14',
    q: 'Which of the following sentences observes strict grammatical parallel structure?',
    options: [
      'The physician advised the patient to reduce sodium intake, exercise three times weekly, and monitor blood glucose levels.',
      'The physician advised the patient to reduce sodium intake, exercising three times weekly, and to monitor blood glucose levels.',
      'The physician advised the patient to reduce sodium intake, exercise three times weekly, and monitoring blood glucose levels.',
      'The physician advised the patient reduction of sodium intake, exercising regularly, and to monitor blood glucose.'
    ],
    correct: 0,
    topic: 'Sentence Structure - Parallel Infinitive Phrases in a Series',
    chapter: 'Sentence Structure',
    explain: 'Parallelism requires coordinating items of identical grammatical form. Option A correctly presents three base infinitives governed by "to": "reduce sodium intake", "[to] exercise three times weekly", and "[to] monitor blood glucose levels".',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b10-eng-15',
    q: 'Select the sentence that properly links two independent clauses with a conjunctive adverb without creating a comma splice or run-on sentence:',
    options: [
      'The rural clinic lacked a functional CT scanner; consequently, trauma patients were transported to the district teaching hospital.',
      'The rural clinic lacked a functional CT scanner, consequently trauma patients were transported to the district teaching hospital.',
      'The rural clinic lacked a functional CT scanner, trauma patients were transported to the district teaching hospital.',
      'The rural clinic lacked a functional CT scanner consequently, trauma patients were transported to the district teaching hospital.'
    ],
    correct: 0,
    topic: 'Sentence Structure - Semicolon and Conjunctive Adverb Mechanics',
    chapter: 'Sentence Structure',
    explain: 'When two independent clauses are joined by a conjunctive adverb (e.g., consequently, therefore, however), they must be separated by a semicolon preceding the adverb and a comma immediately following it: "; consequently, ". Using only a comma produces a comma splice.',
    difficulty: 'Medium',
    subject: 'English'
  }
];

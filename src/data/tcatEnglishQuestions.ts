import { Question } from '../types';

/**
 * TCAT English Question Bank (30 MCQs)
 * Covers all 5 official UET Taxila TCAT English syllabus chapters:
 * 1. Grammar (tenses, parts of speech, sentence structure) (6 MCQs: 2 Easy, 2 Medium, 2 Hard)
 * 2. Vocabulary and Synonyms/Antonyms (6 MCQs: 2 Easy, 2 Medium, 2 Hard)
 * 3. Sentence Correction (6 MCQs: 2 Easy, 2 Medium, 2 Hard)
 * 4. Comprehension Passages (6 MCQs: 2 Easy, 2 Medium, 2 Hard)
 * 5. Analogies (6 MCQs: 2 Easy, 2 Medium, 2 Hard)
 * Total: exactly 30 MCQs (10 Easy, 10 Medium, 10 Hard).
 * Every item has correct: 0 (shuffled at runtime), 4 distinct options, detailed factual explanation.
 */
export const TCAT_ENGLISH_QUESTIONS: Question[] = [
  // =========================================================================
  // CHAPTER 1: Grammar (tenses, parts of speech, sentence structure) (6 MCQs)
  // =========================================================================
  {
    id: 'tcat-eng-1',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Easy',
    q: 'Select the correct verb form: "Neither the professor nor his research students ______ present at the symposium yesterday."',
    options: [
      'were',
      'was',
      'is',
      'are'
    ],
    correct: 0,
    explain: 'When compound subjects are connected by "neither... nor", the verb agrees with the closer subject ("research students" is plural, past tense requires "were").'
  },
  {
    id: 'tcat-eng-2',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Easy',
    q: 'Identify the part of speech of the underlined word: "She spoke very _cautiously_ during the technical defense."',
    options: [
      'Adverb',
      'Adjective',
      'Preposition',
      'Conjunction'
    ],
    correct: 0,
    explain: '"Cautiously" modifies the verb "spoke", answering how she spoke; therefore, it functions as an adverb.'
  },
  {
    id: 'tcat-eng-3',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Medium',
    q: 'Choose the correct conditional sentence: "If the civil engineers ______ the structural stress calculations properly, the suspension bridge would not have failed."',
    options: [
      'had performed',
      'have performed',
      'performed',
      'would perform'
    ],
    correct: 0,
    explain: 'This is a third conditional (counterfactual past): the "if" clause takes the past perfect ("had performed") while the main clause uses "would have + past participle".'
  },
  {
    id: 'tcat-eng-4',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Medium',
    q: 'Which sentence correctly demonstrates the subjunctive mood for an urgent recommendation?',
    options: [
      'The director insisted that the software engineer submit the security audit report immediately.',
      'The director insisted that the software engineer submits the security audit report immediately.',
      'The director insisted that the software engineer will submit the audit report immediately.',
      'The director insisted that the software engineer submitted the report immediately.'
    ],
    correct: 0,
    explain: 'Verbs of demand/insistence trigger the present subjunctive mood, which requires the bare infinitive ("submit") regardless of a third-person singular subject.'
  },
  {
    id: 'tcat-eng-5',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Hard',
    q: 'Identify the sentence with the correct inversion structure after a negative adverbial opener:',
    options: [
      'Rarely had the automated production line encountered such severe thermal throttling.',
      'Rarely the automated production line had encountered such severe thermal throttling.',
      'Rarely did the automated production line had encountered such severe throttling.',
      'Rarely has the automated production line encountering such severe throttling.'
    ],
    correct: 0,
    explain: 'Negative adverbials at the start of a clause (rarely, seldom, scarcely, never) mandate subject-auxiliary inversion: "Rarely had [subject] encountered...".'
  },
  {
    id: 'tcat-eng-6',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Hard',
    q: 'Select the sentence that maintains flawless parallel grammatical structure:',
    options: [
      'The automated controller is responsible for calibrating hydraulic pressure, regulating fluid temperature, and monitoring system valves.',
      'The automated controller is responsible for calibrating hydraulic pressure, fluid temperature regulation, and to monitor system valves.',
      'The automated controller is responsible for calibrating hydraulic pressure, to regulate temperature, and monitoring valves.',
      'The automated controller is responsible for hydraulic calibration, regulating fluid, and valves monitoring.'
    ],
    correct: 0,
    explain: 'Parallelism requires items in a series to share the same grammatical form (three coordinate gerund phrases: "calibrating...", "regulating...", and "monitoring...").'
  },

  // ==============================================================
  // CHAPTER 2: Vocabulary and Synonyms/Antonyms (6 MCQs)
  // ==============================================================
  {
    id: 'tcat-eng-7',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Easy',
    q: 'What is the closest SYNONYM for the academic word "PRAGMATIC"?',
    options: [
      'Practical',
      'Theoretical',
      'Idealistic',
      'Dogmatic'
    ],
    correct: 0,
    explain: '"Pragmatic" means dealing with matters sensibly and realistically based on practical rather than theoretical considerations.'
  },
  {
    id: 'tcat-eng-8',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Easy',
    q: 'What is the exact ANTONYM of the word "SPURIOUS"?',
    options: [
      'Authentic',
      'Artificial',
      'Deceptive',
      'Counterfeit'
    ],
    correct: 0,
    explain: '"Spurious" means false, fake, or counterfeit; its direct antonym is "authentic" or genuine.'
  },
  {
    id: 'tcat-eng-9',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Medium',
    q: 'The industrial furnace emitted a "NOXIOUS" gas that forced an evacuation. What does "NOXIOUS" mean?',
    options: [
      'Harmful and toxic',
      'Pleasantly fragrant',
      'Completely inert',
      'Invisible and odorless'
    ],
    correct: 0,
    explain: '"Noxious" describes something harmful, poisonous, or very unpleasant (from Latin noxius, "injurious").'
  },
  {
    id: 'tcat-eng-10',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Medium',
    q: 'Choose the most precise ANTONYM for the word "METICULOUS":',
    options: [
      'Careless and sloppy',
      'Precise and painstaking',
      'Diligent',
      'Scrupulous'
    ],
    correct: 0,
    explain: '"Meticulous" means showing great attention to detail and precision; its direct antonym is "careless", "negligent", or "sloppy".'
  },
  {
    id: 'tcat-eng-11',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Hard',
    q: 'The lead scientist\'s arguments were praised for being "COGENT". What is the most accurate synonym for "COGENT"?',
    options: [
      'Compelling and persuasively clear',
      'Ambiguous and convoluted',
      'Tentative and unproven',
      'Redundant and verbose'
    ],
    correct: 0,
    explain: '"Cogent" means clear, logical, and powerfully convincing.'
  },
  {
    id: 'tcat-eng-12',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Hard',
    q: 'Select the exact ANTONYM for the word "EPHEMERAL":',
    options: [
      'Permanent and enduring',
      'Fleeting',
      'Transient',
      'Evanescent'
    ],
    correct: 0,
    explain: '"Ephemeral" means lasting for a very short time (transitory); its true antonym is "permanent", "perpetual", or "enduring".'
  },

  // ==========================================
  // CHAPTER 3: Sentence Correction (6 MCQs)
  // ==========================================
  {
    id: 'tcat-eng-13',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Easy',
    q: 'Identify the error in this sentence: "Each of the experimental algorithms have demonstrated optimal asymptotic runtime."',
    options: [
      '"have" should be replaced by "has"',
      '"experimental" should be "experiment"',
      '"optimal" should be "optimally"',
      '"runtime" should be "run-timely"'
    ],
    correct: 0,
    explain: 'The pronoun "Each" is singular and takes a singular verb: "Each of the experimental algorithms has demonstrated...".'
  },
  {
    id: 'tcat-eng-14',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Easy',
    q: 'Correct the error in comparison: "The computational efficiency of Algorithm A is significantly higher than Algorithm B."',
    options: [
      'than that of Algorithm B',
      'than those of Algorithm B',
      'then Algorithm B',
      'as compared to Algorithm B itself'
    ],
    correct: 0,
    explain: 'Illogical comparison: the sentence compares "computational efficiency" (a quality) to "Algorithm B" (an algorithm). It must compare to "that of Algorithm B".'
  },
  {
    id: 'tcat-eng-15',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Medium',
    q: 'Fix the dangling modifier in the following sentence: "Walking through the automated laboratory, the high-voltage generator suddenly exploded."',
    options: [
      'While the technician was walking through the automated laboratory, the high-voltage generator suddenly exploded.',
      'Walking through the automated laboratory, an explosion was heard by the generator.',
      'The high-voltage generator, walking through the laboratory, exploded suddenly.',
      'While walking through the automated laboratory, sudden explosions occurred in the generator.'
    ],
    correct: 0,
    explain: 'The generator was not walking through the laboratory. The introductory participial phrase must be supplied with its true subject ("the technician").'
  },
  {
    id: 'tcat-eng-16',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Medium',
    q: 'Which sentence correctly repairs the comma splice: "The server crashed due to overheating, the backup battery kicked in immediately."',
    options: [
      'The server crashed due to overheating; however, the backup battery kicked in immediately.',
      'The server crashed due to overheating, because the backup battery kicked in immediately.',
      'The server crashed due to overheating so the backup battery kicking in immediately.',
      'The server crashed due to overheating, nevertheless the backup battery kicked in immediately.'
    ],
    correct: 0,
    explain: 'Two independent clauses cannot be joined by a comma alone. They require a semicolon followed by a transitional adverb, or a coordinating conjunction.'
  },
  {
    id: 'tcat-eng-17',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Hard',
    q: 'Identify the sentence that correctly employs the correlative conjunction "not only... but also":',
    options: [
      'The newly engineered polymer is not only resistant to high temperatures but also impermeable to chemical solvents.',
      'The newly engineered polymer not only is resistant to high temperatures but also impermeable to chemical solvents.',
      'Not only the newly engineered polymer is resistant to heat, but it also resists chemical solvents.',
      'The newly engineered polymer is resistant not only to high temperatures but also resists chemical solvents.'
    ],
    correct: 0,
    explain: '"Not only" and "but also" must be followed by parallel grammatical structures (here, coordinate predicate adjectives: "resistant to..." and "impermeable to...").'
  },
  {
    id: 'tcat-eng-18',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Hard',
    q: 'Choose the grammatically immaculate version of the following complex sentence:',
    options: [
      'Whomever the admissions committee selects must demonstrate outstanding aptitude in quantitative analysis.',
      'Whoever the admissions committee selects must demonstrate outstanding aptitude in quantitative analysis.',
      'Whomever is selected by the committee must to demonstrate outstanding quantitative aptitude.',
      'Whomever the admissions committee select must demonstrate aptitude in quantitative analysis.'
    ],
    correct: 0,
    explain: '"Whomever" functions correctly as the direct object of the verb "selects" within the dependent clause ("the committee selects whomever"), which as a whole serves as the subject.'
  },

  // =============================================
  // CHAPTER 4: Comprehension Passages (6 MCQs)
  // =============================================
  {
    id: 'tcat-eng-19',
    subject: 'English',
    topic: 'Comprehension Passages',
    difficulty: 'Easy',
    q: 'Passage: "Autonomous navigation systems rely on Sensor Fusion, combining LiDAR, radar, and optical cameras to construct a real-time volumetric point cloud of the surrounding terrain."\n\nQuestion: What is the primary operational objective of Sensor Fusion described in the passage?',
    options: [
      'To build a real-time 3D volumetric model of the environment by synthesizing multiple sensor streams',
      'To eliminate the need for optical camera lenses in vehicles',
      'To replace radar frequencies with satellite communications',
      'To reduce battery power consumption by 50%'
    ],
    correct: 0,
    explain: 'The passage explicitly states that Sensor Fusion combines LiDAR, radar, and cameras to construct a real-time volumetric point cloud.'
  },
  {
    id: 'tcat-eng-20',
    subject: 'English',
    topic: 'Comprehension Passages',
    difficulty: 'Easy',
    q: 'Passage: "Thermodynamic efficiency in combined-cycle gas turbine plants routinely exceeds 60%, largely because waste heat exhausted from the Brayton gas cycle is captured by a heat-recovery steam generator to power a secondary Rankine steam turbine."\n\nQuestion: Why do combined-cycle power plants achieve elevated thermodynamic efficiency?',
    options: [
      'Waste exhaust heat from the gas cycle is recovered to drive a secondary steam turbine',
      'They operate without any friction or thermodynamic heat losses',
      'They burn nuclear isotopes rather than hydrocarbon gas fuels',
      'The Rankine steam turbine requires zero thermal input energy'
    ],
    correct: 0,
    explain: 'Combined-cycle plants achieve high efficiency by routing hot exhaust from the gas turbine into a heat-recovery steam generator that powers a steam turbine.'
  },
  {
    id: 'tcat-eng-21',
    subject: 'English',
    topic: 'Comprehension Passages',
    difficulty: 'Medium',
    q: 'Passage: "While graphene possesses extraordinary tensile strength and electrical conductivity, industrial scalability remains constrained by the propensity of exfoliated sheets to re-agglomerate into graphite via van der Waals attractions."\n\nQuestion: What is the primary bottleneck hindering widespread industrial commercialization of graphene?',
    options: [
      'Exfoliated graphene monolayers tend to clump back together due to intermolecular van der Waals forces',
      'Graphene becomes an electrical insulator at room temperature',
      'The material oxidizes violently when exposed to atmospheric nitrogen',
      'Its tensile strength degrades under mechanical loading'
    ],
    correct: 0,
    explain: 'The passage notes that the main scalability constraint is sheets re-agglomerating into graphite through van der Waals attractions.'
  },
  {
    id: 'tcat-eng-22',
    subject: 'English',
    topic: 'Comprehension Passages',
    difficulty: 'Medium',
    q: 'Passage: "The Hawthorne Effect posits that research subjects inevitably modify an aspect of their behavior in response to their awareness of being observed, complicating observational engineering studies."\n\nQuestion: What can be logically inferred regarding experimental design from this passage?',
    options: [
      'Direct observer surveillance can inadvertently distort baseline human performance data',
      'Subjects always perform worse when monitored by researchers',
      'Engineering experiments cannot utilize human test participants',
      'The Hawthorne Effect applies solely to electrical circuit testing'
    ],
    correct: 0,
    explain: 'The Hawthorne Effect implies that the mere awareness of being observed alters participant behavior, introducing observational bias.'
  },
  {
    id: 'tcat-eng-23',
    subject: 'English',
    topic: 'Comprehension Passages',
    difficulty: 'Hard',
    q: 'Passage: "Although artificial intelligence models excel at perceptual pattern matching across high-dimensional matrices, they lack grounded counterfactual reasoning—the capability to infer \'what would have happened had conditions been intentionally altered\'—which remains an indispensable hallmark of human scientific inquiry."\n\nQuestion: What fundamental distinction between AI models and human scientific cognition does the author underscore?',
    options: [
      'AI models perform statistical pattern correlation, whereas human cognition uniquely navigates causal and counterfactual inferences',
      'Human researchers cannot process high-dimensional numerical matrices',
      'AI systems will replace all human empirical hypothesis formulation within five years',
      'Counterfactual reasoning is fundamentally irrelevant to rigorous physical science'
    ],
    correct: 0,
    explain: 'The author explicitly contrasts AI\'s strength in perceptual pattern matching against humans\' capacity for grounded counterfactual and causal reasoning.'
  },
  {
    id: 'tcat-eng-24',
    subject: 'English',
    topic: 'Comprehension Passages',
    difficulty: 'Hard',
    q: 'Passage: "Technological determinism presumes that a society\'s technology drives the development of its social structure and cultural values. Critics counter that technological trajectory is not an autonomous juggernaut, but rather an artifact negotiated through political economy, institutional subsidies, and societal values."\n\nQuestion: What is the central thesis of the critics mentioned in the passage?',
    options: [
      'Technological innovation is socially constructed and directed by human institutions, not an inevitable autonomous force',
      'Social structures are exclusively determined by the speed of microprocessors',
      'Political institutions have no historical influence on scientific research funding',
      'Technology develops in complete isolation from cultural or economic interests'
    ],
    correct: 0,
    explain: 'Critics argue that technological trajectory is shaped and negotiated by human social, economic, and political institutions rather than acting as an unstoppable, independent force.'
  },

  // ===================================
  // CHAPTER 5: Analogies (6 MCQs)
  // ===================================
  {
    id: 'tcat-eng-25',
    subject: 'English',
    topic: 'Analogies',
    difficulty: 'Easy',
    q: 'THERMOMETER : TEMPERATURE :: BAROMETER : ______',
    options: [
      'Atmospheric Pressure',
      'Relative Humidity',
      'Wind Velocity',
      'Solar Radiation'
    ],
    correct: 0,
    explain: 'A thermometer is an instrument specifically designed to measure temperature; a barometer is an instrument designed to measure atmospheric pressure.'
  },
  {
    id: 'tcat-eng-26',
    subject: 'English',
    topic: 'Analogies',
    difficulty: 'Easy',
    q: 'CATALYST : REACTION :: ACCELERATOR : ______',
    options: [
      'Motion',
      'Inertia',
      'Equilibrium',
      'Viscosity'
    ],
    correct: 0,
    explain: 'A catalyst speeds up a chemical reaction; an accelerator speeds up physical motion.'
  },
  {
    id: 'tcat-eng-27',
    subject: 'English',
    topic: 'Analogies',
    difficulty: 'Medium',
    q: 'ENTROPY : DISORDER :: VISCOSITY : ______',
    options: [
      'Fluid Friction (Resistance to Flow)',
      'Specific Gravity',
      'Turbulent Velocity',
      'Surface Tension'
    ],
    correct: 0,
    explain: 'Entropy is a fundamental physical property quantifying microscopic disorder; viscosity is a physical property quantifying a fluid\'s internal resistance to flow.'
  },
  {
    id: 'tcat-eng-28',
    subject: 'English',
    topic: 'Analogies',
    difficulty: 'Medium',
    q: 'INSULATOR : CONDUCTION :: LUBRICANT : ______',
    options: [
      'Friction',
      'Combustion',
      'Gravity',
      'Pressure'
    ],
    correct: 0,
    explain: 'An insulator is employed to prevent or impede electrical/thermal conduction; a lubricant is employed to reduce or minimize mechanical friction.'
  },
  {
    id: 'tcat-eng-29',
    subject: 'English',
    topic: 'Analogies',
    difficulty: 'Hard',
    q: 'FISSION : SPLITTING :: ANABOLISM : ______',
    options: [
      'Synthesis (Building up)',
      'Degradation (Breaking down)',
      'Equilibrium',
      'Combustion'
    ],
    correct: 0,
    explain: 'Nuclear fission is defined by the splitting of atomic nuclei; anabolism is the metabolic pathway characterized by the synthesis and building up of complex molecules.'
  },
  {
    id: 'tcat-eng-30',
    subject: 'English',
    topic: 'Analogies',
    difficulty: 'Hard',
    q: 'METROLOGY : MEASUREMENT :: EPISTEMOLOGY : ______',
    options: [
      'Knowledge (and justified belief)',
      'Moral Conduct',
      'Atmospheric Weather',
      'Insect Anatomy'
    ],
    correct: 0,
    explain: 'Metrology is the scientific study and theory of measurement; Epistemology is the philosophical study and theory of knowledge and justified belief.'
  }
];

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
  },
  {
    id: "tcat-eng-31",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Choose the correct form to complete the sentence: \"Neither the professor nor the laboratory technicians ________ aware of the power surge.\"",
    options: [
          "was",
          "were",
          "is",
          "are"
    ],
    correct: 1,
    explain: "When two subjects are joined by \"neither... nor\", the verb agrees with the subject closer to it. \"Laboratory technicians\" is plural, so the plural past verb \"were\" is correct."
  },
  {
    id: "tcat-eng-32",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Identify the correct preposition: \"The experimental results obtained in the laboratory were consistent ________ the theoretical predictions.\"",
    options: [
          "to",
          "with",
          "for",
          "about"
    ],
    correct: 1,
    explain: "The adjective \"consistent\" collocates with the preposition \"with\" when expressing agreement or compatibility."
  },
  {
    id: "tcat-eng-33",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Select the appropriate verb tense: \"By the time the symposium commences tomorrow, the lead researcher ________ her keynote address.\"",
    options: [
          "will finish",
          "has finished",
          "will have finished",
          "had finished"
    ],
    correct: 2,
    explain: "Future perfect tense (\"will have finished\") is required to indicate an action that will be completed prior to a specific reference point in the future (\"by the time the symposium commences tomorrow\")."
  },
  {
    id: "tcat-eng-34",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Choose the correct subjunctive form: \"The safety board recommended that the chemical reactor ________ immediately inspected.\"",
    options: [
          "is",
          "be",
          "was",
          "should have been"
    ],
    correct: 1,
    explain: "In formal English, verbs expressing recommendation, demand, or necessity take the mandate subjunctive, which uses the base form of the verb (\"be\")."
  },
  {
    id: "tcat-eng-35",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Select the correct inverted structure: \"Hardly ________ the calibration protocol when the voltage regulator tripped.\"",
    options: [
          "we initiated",
          "had we initiated",
          "we had initiated",
          "did we initiated"
    ],
    correct: 1,
    explain: "Negative and limiting adverbs like \"hardly\", \"scarcely\", and \"barely\" trigger negative inversion (auxiliary + subject + main verb) when placed at the start of a clause."
  },
  {
    id: "tcat-eng-36",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Choose the correct relative pronoun: \"The research engineer, ________ algorithm reduced memory latency by half, received the departmental award.\"",
    options: [
          "who",
          "whom",
          "whose",
          "which"
    ],
    correct: 2,
    explain: "\"Whose\" is the possessive relative pronoun required to show that the algorithm belongs to or was developed by the research engineer."
  },
  {
    id: "tcat-eng-37",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Complete the third conditional structure correctly: \"Had the structural analysis revealed the micro-fractures earlier, the construction team ________ the foundation concrete.\"",
    options: [
          "would not pour",
          "would not have poured",
          "had not poured",
          "did not pour"
    ],
    correct: 1,
    explain: "The inverted third conditional clause (\"Had the analysis revealed...\") expresses an unreal past condition and takes \"would have + past participle\" in the main consequence clause."
  },
  {
    id: "tcat-eng-38",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Identify the grammatically correct cleft sentence: \"It was only after the liquid nitrogen coolant was added ________ the superconducting transition occurred.\"",
    options: [
          "when",
          "that",
          "then",
          "which"
    ],
    correct: 1,
    explain: "It-cleft sentences standardly pair with the complementizer \"that\" (\"It was only after... that...\") to focus the adverbial clause of time."
  },
  {
    id: "tcat-eng-39",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Choose the correct form: \"The dean objected to ________ the conference date without prior consultation with the faculty senate.\"",
    options: [
          "them postponing",
          "their postponing",
          "they postponing",
          "postpone of them"
    ],
    correct: 1,
    explain: "In formal standard English, a gerund (\"postponing\") is preceded by a possessive pronoun (\"their postponing\") rather than an objective pronoun (\"them\")."
  },
  {
    id: "tcat-eng-40",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Select the option that correctly demonstrates subject-verb agreement with collective and quantity nouns: \"Three-fourths of the contaminated soil ________ successfully remediated, while two miles of drainage pipeline ________ still under repair.\"",
    options: [
          "was, is",
          "were, are",
          "was, are",
          "were, is"
    ],
    correct: 0,
    explain: "\"Soil\" is an uncountable noun, so \"three-fourths of the soil\" takes the singular verb \"was\". \"Two miles\" represents a singular unit of measurement or project distance, taking the singular verb \"is\"."
  },
  {
    id: "tcat-eng-41",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the word that is most nearly SYNONYMOUS with \"PRAGMATIC\":",
    options: [
          "Theoretical",
          "Practical",
          "Dogmatic",
          "Visionary"
    ],
    correct: 1,
    explain: "\"Pragmatic\" means dealing with matters in a sensible, realistic, and practical way based on actual conditions rather than theoretical considerations."
  },
  {
    id: "tcat-eng-42",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Select the word that is most nearly ANTONYMOUS to \"SUPERFLUOUS\":",
    options: [
          "Redundant",
          "Essential",
          "Excessive",
          "Ornamental"
    ],
    correct: 1,
    explain: "\"Superfluous\" means exceeding what is necessary or required. Its direct antonym is \"essential\" or \"necessary\"."
  },
  {
    id: "tcat-eng-43",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the synonym for \"EPHEMERAL\":",
    options: [
          "Permanent",
          "Transitory",
          "Durable",
          "Eternal"
    ],
    correct: 1,
    explain: "\"Ephemeral\" describes something lasting for a very short time, transitory or fleeting."
  },
  {
    id: "tcat-eng-44",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the word most nearly OPPOSITE in meaning to \"PERNICIOUS\":",
    options: [
          "Noxious",
          "Deleterious",
          "Beneficial",
          "Invidious"
    ],
    correct: 2,
    explain: "\"Pernicious\" means having a harmful, destructive effect, especially in a gradual or subtle way. \"Beneficial\" is its antonym."
  },
  {
    id: "tcat-eng-45",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "The word \"ESOTERIC\" is best defined as:",
    options: [
          "Widely known and universally understood",
          "Intended for or likely to be understood by only a small group with specialized knowledge",
          "Pertaining to ancient historical artifacts",
          "Unusually harsh or grating in acoustic tone"
    ],
    correct: 1,
    explain: "\"Esoteric\" refers to specialized knowledge, concepts, or terms obscure to ordinary people and understood only by an enlightened inner circle."
  },
  {
    id: "tcat-eng-46",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the word that best completes the sentence: \"The lead investigator responded to the urgent query with remarkable ________, dispatching the emergency protocol within minutes.\"",
    options: [
          "lethargy",
          "alacrity",
          "indolence",
          "torpor"
    ],
    correct: 1,
    explain: "\"Alacrity\" means brisk and cheerful readiness, promptness, or eagerness in action."
  },
  {
    id: "tcat-eng-47",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the word most nearly SYNONYMOUS with \"INSCRUTABLE\":",
    options: [
          "Limpic",
          "Enigmatic",
          "Pellucid",
          "Manifest"
    ],
    correct: 1,
    explain: "\"Inscrutable\" means impossible to understand or interpret, mysterious, or enigmatic."
  },
  {
    id: "tcat-eng-48",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "What is the closest ANTONYM of \"EQUIVOCAL\"?",
    options: [
          "Ambiguous",
          "Unambiguous",
          "Oblique",
          "Vague"
    ],
    correct: 1,
    explain: "\"Equivocal\" means open to more than one interpretation, uncertain or questionable. Its direct opposite is \"unambiguous\" (clear and definitive)."
  },
  {
    id: "tcat-eng-49",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "A person who behaves with \"OBSEQUIOUS\" deferential subservience is best characterized as:",
    options: [
          "Insubordinate",
          "Sycophantic",
          "Recalcitrant",
          "Impetuous"
    ],
    correct: 1,
    explain: "\"Obsequious\" means obedient or attentive to an excessive or servile degree; a synonym is \"sycophantic\"."
  },
  {
    id: "tcat-eng-50",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the word that accurately replaces the italicized phrase: \"The author provided a *laconic* response that conveyed all essential information without wasted syllables.\"",
    options: [
          "Verbose",
          "Terse",
          "Garrulous",
          "Plethoric"
    ],
    correct: 1,
    explain: "\"Laconic\" means using very few words; concise or terse."
  },
  {
    id: "tcat-eng-51",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Identify the correct version that eliminates the run-on comma splice: \"The turbine failed during the test, it was operating beyond its rated RPM.\"",
    options: [
          "The turbine failed during the test, because it was operating beyond its rated RPM.",
          "The turbine failed during the test it was operating beyond its rated RPM.",
          "The turbine failed during the test, however it was operating beyond its rated RPM.",
          "The turbine failed during the test, while operating beyond its rated RPM it failed."
    ],
    correct: 0,
    explain: "Two independent clauses cannot be joined by just a comma. Adding the subordinating conjunction \"because\" correctly establishes the causal relationship and eliminates the comma splice."
  },
  {
    id: "tcat-eng-52",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Correct the faulty parallelism: \"The CAD technician was skilled in 3D modeling, drafting blueprints, and ________.\"",
    options: [
          "to assemble prototypes",
          "assembling prototypes",
          "prototype assembly was done by him",
          "can assemble prototypes"
    ],
    correct: 1,
    explain: "Parallel structure requires grammatical consistency across listed elements: \"3D modeling\", \"drafting blueprints\", and \"assembling prototypes\" (all gerund phrases)."
  },
  {
    id: "tcat-eng-53",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Select the option that fixes the misplaced modifier: \"Walking through the automated manufacturing plant, the robotic arms impressed the young apprentice.\"",
    options: [
          "Walking through the automated manufacturing plant, the young apprentice was impressed by the robotic arms.",
          "The robotic arms, walking through the automated manufacturing plant, impressed the young apprentice.",
          "Impressed by the robotic arms, the automated manufacturing plant was walked through by the apprentice.",
          "Walking through the automated manufacturing plant, an impression was made on the apprentice by the robotic arms."
    ],
    correct: 0,
    explain: "The introductory participial phrase \"Walking through...\" logically describes the young apprentice, not the robotic arms. Placing \"the young apprentice\" immediately after the comma resolves the dangling modifier."
  },
  {
    id: "tcat-eng-54",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Identify the sentence with correct pronoun-antecedent agreement:",
    options: [
          "Each of the engineering teams presented their findings to the executive panel.",
          "Each of the engineering teams presented its findings to the executive panel.",
          "Every student must bring their own scientific calculator to the examination hall.",
          "Neither of the generators had their fuel tank replenished."
    ],
    correct: 1,
    explain: "\"Each\" is an indefinite singular pronoun. Its referent (\"team\") takes the singular possessive pronoun \"its findings\" in formal standard English."
  },
  {
    id: "tcat-eng-55",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Choose the sentence that corrects the faulty comparison: \"The computational throughput of Quantum Processor Alpha is greater than Classical Supercomputer Beta.\"",
    options: [
          "The computational throughput of Quantum Processor Alpha is greater than Classical Supercomputer Beta.",
          "The computational throughput of Quantum Processor Alpha is greater than that of Classical Supercomputer Beta.",
          "The computational throughput of Quantum Processor Alpha is greater than those of Classical Supercomputer Beta.",
          "The computational throughput of Quantum Processor Alpha is greater as compared to Classical Supercomputer Beta."
    ],
    correct: 1,
    explain: "You cannot compare throughput directly to a supercomputer. The phrase \"that of\" is necessary to compare the throughput of one system to the throughput of the other."
  },
  {
    id: "tcat-eng-56",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Select the sentence free from redundancy and wordiness:",
    options: [
          "The reason why the experiment failed was on account of temperature fluctuations.",
          "The experiment failed due to unforeseen temperature fluctuations.",
          "The reason the experiment failed was because of unforeseen temperature fluctuations.",
          "Due to the fact that temperature fluctuated, that is why the experiment failed."
    ],
    correct: 1,
    explain: "\"The reason why... was on account of / because\" is redundant. \"The experiment failed due to unforeseen temperature fluctuations\" is concise and grammatically sound."
  },
  {
    id: "tcat-eng-57",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Select the option that corrects both the correlative conjunction and parallelism in the sentence: \"The developer neither wanted to rewrite the legacy codebase or migrating to a microservice architecture.\"",
    options: [
          "The developer neither wanted to rewrite the legacy codebase nor migrating to a microservice architecture.",
          "The developer wanted neither to rewrite the legacy codebase nor to migrate to a microservice architecture.",
          "The developer neither wanted rewriting the legacy codebase nor to migrate to a microservice architecture.",
          "The developer neither wanted to rewrite the legacy codebase or migrate to a microservice architecture."
    ],
    correct: 1,
    explain: "\"Neither... nor\" must join grammatically parallel elements: \"neither to rewrite... nor to migrate...\" balances two infinitive phrases."
  },
  {
    id: "tcat-eng-58",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Choose the best revision of the underlined part: \"The director insisted on *all employees being briefed by Friday, in addition to submit* their project logs.\"",
    options: [
          "all employees being briefed by Friday, in addition to submit",
          "briefing all employees by Friday and having them submit",
          "all employees being briefed by Friday, as well as submitting",
          "briefing all employees by Friday, in addition to their submission"
    ],
    correct: 1,
    explain: "The revision \"briefing all employees by Friday and having them submit their project logs\" creates a coherent, parallel coordinate structure governed by the preposition \"on\"."
  },
  {
    id: "tcat-eng-59",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the sentence that correctly employs the subjunctive mood after an expression of necessity: \"It is imperative that the supervisor *maintains strict vigilance during high-voltage energization*.\"",
    options: [
          "maintains strict vigilance during high-voltage energization",
          "maintain strict vigilance during high-voltage energization",
          "should be maintaining strict vigilance during high-voltage energization",
          "is maintaining strict vigilance during high-voltage energization"
    ],
    correct: 1,
    explain: "Clauses following \"imperative that\" require the present subjunctive verb form (\"maintain\" rather than the indicative \"maintains\")."
  },
  {
    id: "tcat-eng-60",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Select the sentence with accurate idiom and punctuation:",
    options: [
          "The chief engineer was oblivious about the warning sirens; consequently, evacuation was delayed.",
          "The chief engineer was oblivious to the warning sirens; consequently, evacuation was delayed.",
          "The chief engineer was oblivious of the warning sirens, consequently evacuation was delayed.",
          "The chief engineer was oblivious towards the warning sirens; consequently evacuation was delayed."
    ],
    correct: 1,
    explain: "The correct idiom is \"oblivious to\" (or \"of\", but standardly \"to\" sensory cues like sirens). The conjunctive adverb \"consequently\" joining two independent clauses requires a semicolon before and a comma after."
  },
  {
    id: "tcat-eng-61",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the excerpt: \"Quantum dots are nanoscale semiconductor particles whose optical and electronic properties differ significantly from larger particles due to quantum mechanical effects. When illuminated by UV light, an electron is excited to a higher energy level. As it decays back, it emits light whose wavelength is strictly determined by the physical radius of the dot.\"\n\nAccording to the passage, what directly governs the wavelength of emitted light in quantum dots?",
    options: [
          "The intensity of the incident UV light",
          "The physical radius of the quantum dot",
          "The ambient temperature of the semiconductor",
          "The rate of electron decay over time"
    ],
    correct: 1,
    explain: "The passage explicitly states that the emitted light's \"wavelength is strictly determined by the physical radius of the dot.\""
  },
  {
    id: "tcat-eng-62",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Based on the excerpt in Question 61, what is the primary consequence of decreasing the particle dimension to the nanoscale in semiconductors?",
    options: [
          "They lose all electrical conductivity permanently.",
          "Their optical and electronic properties diverge from bulk material due to quantum effects.",
          "They become entirely transparent to all ultraviolet radiation.",
          "Their electron decay rate drops to zero."
    ],
    correct: 1,
    explain: "The opening sentence states that their \"optical and electronic properties differ significantly from larger particles due to quantum mechanical effects.\""
  },
  {
    id: "tcat-eng-63",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the excerpt: \"Thermodynamic entropy serves as a macroscopic measure of molecular disorder, yet in Claude Shannon's information theory, entropy quantifies the fundamental uncertainty associated with a random variable. The greater the unpredictability of a transmitted message, the higher its Shannon entropy.\"\n\nIn Shannon's information theory, a message stream with high entropy implies that the message is:",
    options: [
          "Completely predictable and repetitive",
          "Highly unpredictable and informative",
          "Thermally hot and energetically unstable",
          "Subject to severe physical attenuation"
    ],
    correct: 1,
    explain: "Shannon entropy measures uncertainty; higher unpredictability correlates directly with higher Shannon entropy."
  },
  {
    id: "tcat-eng-64",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Read the excerpt: \"For decades, high-temperature superconductivity remained elusive in materials above 135 K at ambient pressure. Recent breakthroughs utilizing diamond anvil cells have demonstrated zero electrical resistance in hydrides like lanthanum hydride at temperatures approaching 250 K. However, this phenomenon necessitates static pressures exceeding one million atmospheres, rendering atmospheric technological applications currently infeasible.\"\n\nWhat is the primary technical obstacle preventing practical deployment of hydride superconductors in everyday consumer electronics?",
    options: [
          "The materials lose zero resistance when cooled below 250 K.",
          "They require astronomical hydrostatic pressures exceeding one million atmospheres.",
          "Hydrides react explosively with ambient air at room temperature.",
          "Diamond anvil cells cannot conduct electricity."
    ],
    correct: 1,
    explain: "The passage highlights that \"this phenomenon necessitates static pressures exceeding one million atmospheres, rendering atmospheric technological applications currently infeasible.\""
  },
  {
    id: "tcat-eng-65",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Referring to the superconductor passage above, the author's tone regarding current atmospheric deployment can best be characterized as:",
    options: [
          "Unconditionally optimistic",
          "Skeptical and dismissive",
          "Pragmatically restrained",
          "Indifferent and disinterested"
    ],
    correct: 2,
    explain: "The author recognizes the scientific breakthrough while objectively pointing out the engineering barrier (pressures of 1M atmospheres), demonstrating a pragmatically restrained, realistic attitude."
  },
  {
    id: "tcat-eng-66",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Read the excerpt: \"Alan Turing formulated the Halting Problem to determine whether a general algorithm exists that can decide whether an arbitrary computer program will eventually finish running or execute forever. By employing a clever diagonal proof analogous to Gödel's incompleteness theorem, Turing demonstrated that such a universal decision procedure is logically impossible.\"\n\nTuring's proof of the Halting Problem establishes that:",
    options: [
          "Computers will never have enough memory to run complex loops.",
          "Certain computational questions are fundamentally undecidable by any algorithm.",
          "All recursive programs inevitably produce infinite execution loops.",
          "Modern microprocessors cannot execute Gödelian formulas."
    ],
    correct: 1,
    explain: "Turing proved that a universal algorithm to decide program halting is logically impossible, proving the existence of fundamentally undecidable problems."
  },
  {
    id: "tcat-eng-67",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Read the excerpt: \"Epigenetic mechanisms alter gene expression without mutating the underlying DNA sequence. DNA methylation and histone acetylation modify the spatial accessibility of chromatin. When methyl groups attach to cytosine bases in CpG islands, chromatin condenses into heterochromatin, preventing transcription factors from binding and effectively silencing gene transcription.\"\n\nWhat structural modification directly leads to the silencing of gene transcription?",
    options: [
          "The deletion of cytosine bases from the nucleotide backbone",
          "The conversion of euchromatin into relaxed, uncoiled strands",
          "Chromatin condensation into heterochromatin following DNA methylation",
          "The enzymatic phosphorylation of RNA polymerase III"
    ],
    correct: 2,
    explain: "The passage states that methylation causes chromatin to condense into heterochromatin, which physically prevents transcription factor binding and silences transcription."
  },
  {
    id: "tcat-eng-68",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Read the excerpt: \"The Fermi Paradox juxtaposes the high statistical probability of extraterrestrial civilizations emerging in our galaxy with the total absence of empirical evidence for their existence. The 'Great Filter' hypothesis posits that an evolutionary barrier exists at some stage between prebiotic abiogenesis and interstellar space-faring civilization that is exceedingly difficult or impossible to surpass. If the filter lies ahead of humanity, our long-term survival prospects are grim; if it lies behind us (such as the emergence of eukaryotic cellular complexity), our species may indeed be extraordinarily rare.\"\n\nIt can be logically inferred that if astrobiologists discover fossilized complex multicellular life on Mars, it would suggest that:",
    options: [
          "The Great Filter is almost certainly behind us, securing humanity's future.",
          "The Great Filter likely lies in humanity's future, increasing the existential risk for our civilization.",
          "Interstellar travel violates the second law of thermodynamics.",
          "Abiogenesis is statistically impossible under natural environmental conditions."
    ],
    correct: 1,
    explain: "If complex life evolved independently on Mars, early biological transitions (abiogenesis, multicellularity) are not the Great Filter; therefore, the filter is much more likely to lie ahead of our technological stage."
  },
  {
    id: "tcat-eng-69",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Based on the Great Filter passage above, the emergence of eukaryotic cellular complexity is cited as a candidate for:",
    options: [
          "A technological barrier to faster-than-light communication",
          "An evolutionary hurdle that humanity may have already successfully traversed",
          "An inevitable byproduct of stellar nucleosynthesis",
          "A deterministic proof that intelligent extraterrestrial life exists nearby"
    ],
    correct: 1,
    explain: "The text notes: \"if it lies behind us (such as the emergence of eukaryotic cellular complexity), our species may indeed be extraordinarily rare.\""
  },
  {
    id: "tcat-eng-70",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "As used in the Fermi Paradox passage, the term \"juxtaposes\" most closely means:",
    options: [
          "Synthesizes into a harmonious mathematical proof",
          "Places in contrast to highlight the apparent contradiction",
          "Dismisses without rational consideration",
          "Quantifies using astronomical spectral analysis"
    ],
    correct: 1,
    explain: "\"Juxtaposes\" means placing two things close together with contrasting effect, highlighting the contradiction between high statistical probability and total absence of evidence."
  },
  {
    id: "tcat-eng-71",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "Choose the pair of words that best expresses a relationship similar to that expressed in the original pair:\nRESISTOR : CURRENT ::",
    options: [
          "Dam : Water flow",
          "Battery : Voltage",
          "Switch : Magnetism",
          "Conductor : Heat"
    ],
    correct: 0,
    explain: "A resistor impedes or limits the flow of electrical current, just as a dam impedes or regulates the flow of water."
  },
  {
    id: "tcat-eng-72",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "Choose the pair of words that best expresses a relationship similar to:\nSEISMOGRAPH : EARTHQUAKE ::",
    options: [
          "Barometer : Atmospheric pressure",
          "Thermometer : Humidity",
          "Anemometer : Earthquake",
          "Telescope : Gravity"
    ],
    correct: 0,
    explain: "A seismograph is a scientific instrument designed to measure earthquakes, just as a barometer measures atmospheric pressure."
  },
  {
    id: "tcat-eng-73",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "Choose the pair of words that best completes the relationship:\nCATALYST : REACTION ::",
    options: [
          "Inhibitor : Combustion",
          "Lubricant : Friction",
          "Promoter : Activity",
          "Fuel : Exhaust"
    ],
    correct: 2,
    explain: "A catalyst accelerates or facilitates a chemical reaction, just as a promoter enhances biological or functional activity (or facilitates progress)."
  },
  {
    id: "tcat-eng-74",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "Complete the analogy:\nPROLOGUE : NOVEL ::",
    options: [
          "Epilogue : Chapter",
          "Preamble : Constitution",
          "Index : Glossary",
          "Appendix : Title"
    ],
    correct: 1,
    explain: "A prologue is an introductory statement preceding a novel, just as a preamble is the introductory statement preceding a constitution."
  },
  {
    id: "tcat-eng-75",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "Select the pair that best mirrors the relationship:\nANODE : OXIDATION ::",
    options: [
          "Cathode : Reduction",
          "Electrolyte : Neutralization",
          "Battery : Resistance",
          "Ion : Precipitation"
    ],
    correct: 0,
    explain: "In electrochemical cells, oxidation occurs at the anode (An Ox), while reduction occurs at the cathode (Red Cat)."
  },
  {
    id: "tcat-eng-76",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "Select the matching analogy:\nMITOCHONDRIA : ATP ::",
    options: [
          "Ribosome : Lipid",
          "Chloroplast : Glucose",
          "Nucleus : Hemoglobin",
          "Lysosome : Glycogen"
    ],
    correct: 1,
    explain: "The mitochondrion synthesizes ATP as its primary biochemical product, just as the chloroplast synthesizes glucose through photosynthesis."
  },
  {
    id: "tcat-eng-77",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "Choose the best matching pair:\nALGORITHM : COMPUTER CODE ::",
    options: [
          "Recipe : Cooked dish",
          "Blueprint : Constructed building",
          "Engine : Fuel tank",
          "Equation : Unknown variable"
    ],
    correct: 1,
    explain: "An algorithm is the abstract structural design that is implemented as computer code, just as a blueprint is the structural design realized in a constructed building."
  },
  {
    id: "tcat-eng-78",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "Identify the analogous relationship:\nENTROPY : ORDER ::",
    options: [
          "Viscosity : Fluidity",
          "Inertia : Acceleration",
          "Density : Mass",
          "Conductivity : Voltage"
    ],
    correct: 0,
    explain: "Entropy is the measure of the absence of order (inversely related), just as viscosity is the resistance to flow, representing the absence or reduction of fluidity."
  },
  {
    id: "tcat-eng-79",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "Identify the matching pair:\nASYMPTOTIC : COINCIDENT ::",
    options: [
          "Transient : Permanent",
          "Parabolic : Elliptical",
          "Discrete : Continuous",
          "Convergent : Tangential"
    ],
    correct: 0,
    explain: "An asymptotic curve continuously approaches a boundary without ever touching or becoming coincident with it, contrasting an approach with actual arrival/permanence, analogous to transient (approaching and passing) versus permanent (fully abiding)."
  },
  {
    id: "tcat-eng-80",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "Select the pair that best expresses the relationship:\nVERACITY : DISSEMBLE ::",
    options: [
          "Integrity : Bribe",
          "Candor : Equivocate",
          "Bravery : Confront",
          "Tenacity : Persevere"
    ],
    correct: 1,
    explain: "Veracity (truthfulness) is the quality lacking when one dissembles (conceals truth), just as candor (frankness) is the quality lacking when one equivocates (speaks ambiguously to mislead)."
  }
];

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
  },
  {
    id: "tcat-eng-81",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Complete the sentence with the appropriate correlative conjunction: \"No sooner had the catalyst been introduced into the reaction chamber ______ the temperature rose sharply.\"",
    options: [
      "than",
      "when",
      "then",
      "that"
    ],
    correct: 0,
    explain: "The correlative structure \"no sooner\" is strictly followed by \"than\" (e.g., \"no sooner... than\"). \"Hardly/scarcely\" is paired with \"when\"."
  },
  {
    id: "tcat-eng-82",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Select the correct auxiliary verb: \"Each of the turbine blades ______ rigorously tested for micro-fractures prior to assembly.\"",
    options: [
      "was",
      "were",
      "have been",
      "are"
    ],
    correct: 0,
    explain: "The subject is the singular pronoun \"Each\" (modified by the prepositional phrase \"of the turbine blades\"). A singular subject requires the singular verb \"was\"."
  },
  {
    id: "tcat-eng-83",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Choose the correct form of the verb for the mandative subjunctive: \"The safety supervisor recommended that the nuclear reactor technician ______ the cooling valve immediately.\"",
    options: [
      "inspect",
      "inspects",
      "inspected",
      "would inspect"
    ],
    correct: 0,
    explain: "Verbs of recommendation, demand, or request (recommend, insist, mandate) trigger the mandative subjunctive mood, which takes the bare base form of the verb (\"inspect\")."
  },
  {
    id: "tcat-eng-84",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Identify the part of speech of the underlined word: \"The semiconductor layer displays _exceptional_ dielectric strength under extreme voltage.\"",
    options: [
      "Adjective",
      "Adverb",
      "Noun",
      "Participle preposition"
    ],
    correct: 0,
    explain: "\"Exceptional\" modifies the noun phrase \"dielectric strength\", functioning as an attributive adjective."
  },
  {
    id: "tcat-eng-85",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Select the correct tense: \"By December of this year, the robotics department ______ on the autonomous drone project for a decade.\"",
    options: [
      "will have been working",
      "has been working",
      "is working",
      "will work"
    ],
    correct: 0,
    explain: "The future perfect continuous tense (\"will have been working\") expresses an ongoing action that will continue up to a designated reference point in the future (\"By December\")."
  },
  {
    id: "tcat-eng-86",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Choose the correct conditional construction: \"Had the telemetry antenna been calibrated properly during pre-flight checks, signal attenuation ______.\"",
    options: [
      "would not have occurred",
      "will not occur",
      "would not occur",
      "did not occur"
    ],
    correct: 0,
    explain: "This is an inverted third conditional (expressing unreal past conditions: \"Had + past participle\"). The result clause requires \"would have + past participle\" (\"would not have occurred\")."
  },
  {
    id: "tcat-eng-87",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Select the sentence that contains a grammatically correct non-finite participial clause:",
    options: [
      "Having calibrated the laser interferometer, the physicist recorded the diffraction fringes.",
      "Having calibrated the laser interferometer, the diffraction fringes were recorded by the physicist.",
      "Calibrating the laser interferometer, the fringes appeared clearer to the spectrometer.",
      "To calibrate the laser interferometer, the recorded data was saved."
    ],
    correct: 0,
    explain: "In option A, the subject of the main clause (\"the physicist\") logically performed the action of the introductory participial clause (\"Having calibrated...\"), avoiding a dangling modifier."
  },
  {
    id: "tcat-eng-88",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Identify the sentence with correct parallel structure across correlative conjunctions:",
    options: [
      "The lead engineer intended not only to upgrade the firmware but also to redesign the heat sink.",
      "The lead engineer intended not only to upgrade the firmware but also redesigning the heat sink.",
      "The lead engineer not only intended to upgrade the firmware but also redesign the heat sink.",
      "The lead engineer intended to not only upgrade the firmware but also the heat sink was redesigned."
    ],
    correct: 0,
    explain: "Both elements joined by \"not only... but also\" must be grammatically parallel infinitival phrases (\"to upgrade...\" and \"to redesign...\")."
  },
  {
    id: "tcat-eng-89",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Choose the sentence that correctly employs the relative pronoun \"whom\":",
    options: [
      "The visiting professor whom the committee selected delivered a lecture on quantum chromodynamics.",
      "The visiting professor whom delivered the lecture was selected by the committee.",
      "The visiting professor whom was recognized by the board presented the paper.",
      "The visiting professor whom authored the textbook received the medal."
    ],
    correct: 0,
    explain: "\"Whom\" is the objective case pronoun functioning as the direct object of the verb \"selected\" (\"the committee selected him\"). In the other options, the pronoun serves as the subject and requires \"who\"."
  },
  {
    id: "tcat-eng-90",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Select the sentence demonstrating correct subject-verb agreement with a collective noun functioning as unified entity:",
    options: [
      "The adjudication panel has reached its unanimous verdict regarding the patent infringement.",
      "The adjudication panel have reached its unanimous verdict regarding the patent infringement.",
      "The adjudication panel are arguing among themselves regarding the patent infringement.",
      "The adjudication panel were unified in its decision regarding the patent infringement."
    ],
    correct: 0,
    explain: "When a collective noun (\"panel\") acts as a single unified body with a unanimous decision, it takes a singular verb (\"has reached\") and singular pronoun (\"its\")."
  },
  {
    id: "tcat-eng-91",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Identify the sentence with correct negative adverbial inversion:",
    options: [
      "Seldom have high-pressure steam turbines operated under such elevated thermal gradients without failure.",
      "Seldom high-pressure steam turbines have operated under such elevated thermal gradients without failure.",
      "Seldom operated high-pressure steam turbines under such elevated thermal gradients without failure.",
      "Seldom have operated high-pressure steam turbines under such elevated thermal gradients without failure."
    ],
    correct: 0,
    explain: "When a sentence opens with a negative or restrictive adverb like \"Seldom\", standard English syntax requires subject-auxiliary inversion: \"Seldom + auxiliary verb (have) + subject + main verb\"."
  },
  {
    id: "tcat-eng-92",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Select the option containing a grammatically valid absolute phrase:",
    options: [
      "The chamber pressure having dropped below the threshold, the automated relief valve closed instantly.",
      "Dropping below the threshold, the automated relief valve closed the chamber pressure instantly.",
      "Because of the chamber pressure dropped below the threshold, the automated relief valve closed.",
      "Having been dropped below the threshold, the technician closed the automated relief valve."
    ],
    correct: 0,
    explain: "An absolute phrase consists of a noun (\"The chamber pressure\") and a participle (\"having dropped...\"), possessing its own subject and modifying the entire independent clause."
  },
  {
    id: "tcat-eng-93",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Choose the grammatically accurate sentence featuring a cleft construction emphasizing the direct cause:",
    options: [
      "It was the sudden loss of coolant that precipitated the generator automatic shutdown.",
      "It was the sudden loss of coolant which it precipitated the generator automatic shutdown.",
      "There was the sudden loss of coolant that it precipitated the generator automatic shutdown.",
      "What was the sudden loss of coolant that precipitated the generator automatic shutdown."
    ],
    correct: 0,
    explain: "An \"it-cleft\" sentence takes the form: \"It + form of to be + emphasized element + that-clause\". Here, \"It was the sudden loss of coolant that precipitated...\" is perfectly constructed."
  },
  {
    id: "tcat-eng-94",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Identify the sentence that correctly maintains grammatical mood and aspect without tense contamination:",
    options: [
      "Were the structural girder to fracture under cyclic loading, the entire cantilever truss would collapse.",
      "Were the structural girder fracturing under cyclic loading, the entire cantilever truss will collapse.",
      "If the structural girder would fracture under cyclic loading, the entire cantilever truss would collapse.",
      "Were the structural girder fractured under cyclic loading, the entire cantilever truss will have collapsed."
    ],
    correct: 0,
    explain: "Inverted subjunctive conditional (\"Were + subject + to-infinitive\") pairs strictly with conditional modal auxiliary \"would + base verb\" in the apodosis (\"would collapse\")."
  },
  {
    id: "tcat-eng-95",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the word that is most nearly SYNONYMOUS with \"UBIQUITOUS\":",
    options: [
      "Omnipresent",
      "Sporadic",
      "Transient",
      "Obsolete"
    ],
    correct: 0,
    explain: "\"Ubiquitous\" means present, appearing, or found everywhere simultaneously; its closest synonym is \"omnipresent\"."
  },
  {
    id: "tcat-eng-96",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Select the word that is most nearly ANTONYMOUS to \"DILIGENT\":",
    options: [
      "Indolent",
      "Meticulous",
      "Tenacious",
      "Assiduous"
    ],
    correct: 0,
    explain: "\"Diligent\" means showing care and conscientiousness in work. Its direct antonym is \"indolent\" (lazy or idle)."
  },
  {
    id: "tcat-eng-97",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "What is the closest SYNONYM for the word \"LUCID\" in technical prose?",
    options: [
      "Intelligible",
      "Ambiguous",
      "Nebulous",
      "Convoluted"
    ],
    correct: 0,
    explain: "\"Lucid\" means clear, easily understood, and completely intelligible."
  },
  {
    id: "tcat-eng-98",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the word most nearly OPPOSITE in meaning to \"EXPEDITE\":",
    options: [
      "Hinder",
      "Accelerate",
      "Facilitate",
      "Dispatch"
    ],
    correct: 0,
    explain: "\"Expedite\" means to speed up or cause to happen sooner; its direct antonym is \"hinder\" (to delay or impede)."
  },
  {
    id: "tcat-eng-99",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Select the exact SYNONYM for \"CANDID\":",
    options: [
      "Frank",
      "Deceptive",
      "Evasive",
      "Guarded"
    ],
    correct: 0,
    explain: "\"Candid\" means truthful, straightforward, and frank in speech or manner."
  },
  {
    id: "tcat-eng-100",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "The materials scientist characterized the novel alloy as \"REFRACTORY\". In physical science, this means:",
    options: [
      "Resistant to heat, melting, and chemical decomposition",
      "Easily drawn into long conductive wires",
      "Transparent to electromagnetic radiation",
      "Subject to rapid spontaneous oxidation"
    ],
    correct: 0,
    explain: "\"Refractory\" materials retain their strength and chemical integrity at extremely high temperatures without melting or breaking down."
  },
  {
    id: "tcat-eng-101",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the most precise ANTONYM for the word \"AMELIORATE\":",
    options: [
      "Exacerbate",
      "Mitigate",
      "Alleviate",
      "Emulate"
    ],
    correct: 0,
    explain: "\"Ameliorate\" means to make something bad or unsatisfactory better. Its antonym is \"exacerbate\" (to make worse or more severe)."
  },
  {
    id: "tcat-eng-102",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the word that is most nearly SYNONYMOUS with \"RECALCITRANT\":",
    options: [
      "Intractable",
      "Compliant",
      "Submissive",
      "Amenable"
    ],
    correct: 0,
    explain: "\"Recalcitrant\" means stubbornly uncooperative or resistant to discipline, making \"intractable\" its closest synonym."
  },
  {
    id: "tcat-eng-103",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "What is the closest ANTONYM for \"TACITURN\"?",
    options: [
      "Loquacious",
      "Reticent",
      "Laconic",
      "Diffident"
    ],
    correct: 0,
    explain: "\"Taciturn\" describes a person who is habitually silent or uncommunicative. Its opposite is \"loquacious\" (talkative, garrulous)."
  },
  {
    id: "tcat-eng-104",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the word that is most nearly SYNONYMOUS with \"OBFUSCATE\":",
    options: [
      "Befog",
      "Elucidate",
      "Explicate",
      "Clarify"
    ],
    correct: 0,
    explain: "\"Obfuscate\" means to deliberately make something obscure, unclear, or bewildered. \"Befog\" (or confuse/darken) is synonymous."
  },
  {
    id: "tcat-eng-105",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the most accurate ANTONYM for \"CAPRICIOUS\":",
    options: [
      "Steadfast",
      "Whimsical",
      "Mercurial",
      "Fickle"
    ],
    correct: 0,
    explain: "\"Capricious\" denotes unpredictable, erratic, and impulsive changes of mood or behavior. \"Steadfast\" (firm, resolute, unwavering) is its opposite."
  },
  {
    id: "tcat-eng-106",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "The word \"PELLUCID\" in literary and optical contexts means:",
    options: [
      "Translucently clear in presentation or transmission of light",
      "Completely opaque to all wavelengths",
      "Dense and viscous in consistency",
      "Prone to fracturing along crystalline planes"
    ],
    correct: 0,
    explain: "\"Pellucid\" means translucently clear, easily understood, or permitting the free passage of light."
  },
  {
    id: "tcat-eng-107",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the closest ANTONYM for \"PROCLIVITY\":",
    options: [
      "Antipathy",
      "Predilection",
      "Propensity",
      "Affinity"
    ],
    correct: 0,
    explain: "\"Proclivity\" refers to a natural inclination or predisposition towards something. Its antonym is \"antipathy\" or aversion."
  },
  {
    id: "tcat-eng-108",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the word that correctly replaces the underlined phrase: \"The theoretical model was criticized for being _based on assumptions that cannot be verified or tested experimentally_.\"",
    options: [
      "Unfalsifiable",
      "Indubitable",
      "Empirical",
      "Incontrovertible"
    ],
    correct: 0,
    explain: "An assertion or hypothesis that cannot be proven false through empirical observation or testing is defined as \"unfalsifiable\" in epistemology."
  },
  {
    id: "tcat-eng-109",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Identify the sentence that correctly remedies the comma splice error:",
    options: [
      "The tensile strength of the titanium rod was tested; it exceeded all aerospace specifications.",
      "The tensile strength of the titanium rod was tested, it exceeded all aerospace specifications.",
      "The tensile strength of the titanium rod was tested, however it exceeded all aerospace specifications.",
      "The tensile strength of the titanium rod was tested it exceeded all aerospace specifications."
    ],
    correct: 0,
    explain: "Joining two independent clauses with only a comma creates a comma splice. A semicolon (or a coordinating conjunction with a comma) correctly separates them."
  },
  {
    id: "tcat-eng-110",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Correct the misplaced adverb in the following sentence: \"The automated system only detected three micro-faults during the twelve-hour diagnostic run.\"",
    options: [
      "The automated system detected only three micro-faults during the twelve-hour diagnostic run.",
      "Only the automated system detected three micro-faults during the twelve-hour diagnostic run.",
      "The automated system detected three micro-faults only during the twelve-hour diagnostic run.",
      "During the twelve-hour diagnostic run only the automated system detected three micro-faults."
    ],
    correct: 0,
    explain: "The limiting adverb \"only\" must immediately precede the quantity it modifies (\"three micro-faults\"), not the verb \"detected\"."
  },
  {
    id: "tcat-eng-111",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Select the sentence that eliminates grammatical disagreement in subject and verb:",
    options: [
      "A battery of electro-chemical tests was conducted by the quality assurance team.",
      "A battery of electro-chemical tests were conducted by the quality assurance team.",
      "A battery of electro-chemical tests have been conducted by the quality assurance team.",
      "A battery of electro-chemical tests are conducted by the quality assurance team."
    ],
    correct: 0,
    explain: "The head noun of the subject is the singular collective noun \"battery\", which requires the singular verb \"was conducted\"."
  },
  {
    id: "tcat-eng-112",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Identify the sentence that correctly uses the standard prepositional idiom:",
    options: [
      "The new solar inverter is capable of converting direct current with 98% efficiency.",
      "The new solar inverter is capable to convert direct current with 98% efficiency.",
      "The new solar inverter is capable in converting direct current with 98% efficiency.",
      "The new solar inverter is capable for converting direct current with 98% efficiency."
    ],
    correct: 0,
    explain: "The adjective \"capable\" is idiomatically followed by the preposition \"of\" + gerund (\"capable of converting\"), unlike \"able\", which takes an infinitive (\"able to convert\")."
  },
  {
    id: "tcat-eng-113",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Choose the sentence that corrects the faulty comparison: \"The thermal conductivity of diamond is substantially higher than copper.\"",
    options: [
      "The thermal conductivity of diamond is substantially higher than that of copper.",
      "The thermal conductivity of diamond is substantially higher than copper's conductivity is high.",
      "The thermal conductivity of diamond is substantially higher as compared to copper.",
      "The thermal conductivity of diamond is substantially higher than those of copper."
    ],
    correct: 0,
    explain: "A comparison must equate like entities: the \"thermal conductivity\" of diamond must be compared to \"that [the thermal conductivity] of copper\", not the metal itself."
  },
  {
    id: "tcat-eng-114",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Select the sentence that resolves the dangling modifier: \"Having analyzed the spectral telemetry data, an unexpected Doppler shift was discovered.\"",
    options: [
      "Having analyzed the spectral telemetry data, the astrophysicist discovered an unexpected Doppler shift.",
      "Having analyzed the spectral telemetry data, an unexpected Doppler shift appeared to the astrophysicist.",
      "While analyzing the spectral telemetry data, an unexpected Doppler shift was discovered.",
      "The spectral telemetry data having been analyzed, an unexpected Doppler shift was discovered by the team."
    ],
    correct: 0,
    explain: "The subject performing the action of analyzing must be the grammatical subject of the main clause (\"the astrophysicist\"), preventing the modifier from dangling."
  },
  {
    id: "tcat-eng-115",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "In formal academic discourse, which sentence correctly demonstrates pronoun-antecedent agreement with compound antecedents?",
    options: [
      "Neither the chief architect nor the project engineers surrendered their professional licenses.",
      "Neither the chief architect nor the project engineers surrendered his or her professional license.",
      "Neither the project engineers nor the chief architect surrendered their professional licenses.",
      "Neither the project engineers nor the chief architect surrendered their professional license."
    ],
    correct: 0,
    explain: "When subjects are linked by \"neither... nor\", the pronoun agrees with the closer antecedent. \"Project engineers\" is plural, requiring the plural pronoun \"their\"."
  },
  {
    id: "tcat-eng-116",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Choose the option that correctly adheres to the idiom governing \"prefer\":",
    options: [
      "The aerospace firm prefers composite carbon fiber to conventional aluminum alloys.",
      "The aerospace firm prefers composite carbon fiber than conventional aluminum alloys.",
      "The aerospace firm prefers composite carbon fiber rather than conventional aluminum alloys.",
      "The aerospace firm prefers composite carbon fiber over conventional aluminum alloys."
    ],
    correct: 0,
    explain: "In formal English idiom, the verb \"prefer\" takes the preposition \"to\" to express preference between two nouns: \"prefers X to Y\"."
  },
  {
    id: "tcat-eng-117",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Select the sentence that avoids faulty predication and illogical attribution:",
    options: [
      "The function of an automotive thermostat is to regulate coolant flow through the engine block.",
      "The function of an automotive thermostat is when it regulates coolant flow through the engine block.",
      "The function of an automotive thermostat is where it regulates coolant flow through the engine block.",
      "An automotive thermostat is because it regulates coolant flow through the engine block."
    ],
    correct: 0,
    explain: "Predications defining a \"function\" must complete the linking verb with an infinitive phrase (\"is to regulate\"), avoiding colloquial constructions like \"is when\" or \"is where\"."
  },
  {
    id: "tcat-eng-118",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the option that corrects both the correlative conjunction placement and grammatical parallelism:",
    options: [
      "The civil engineer evaluated the foundation not only for seismic resilience but also for hydrostatic resistance.",
      "The civil engineer not only evaluated the foundation for seismic resilience but also for hydrostatic resistance.",
      "The civil engineer evaluated the foundation not only for seismic resilience but also evaluated hydrostatic resistance.",
      "Not only did the civil engineer evaluate the foundation for seismic resilience, but also for hydrostatic resistance."
    ],
    correct: 0,
    explain: "\"Not only\" and \"but also\" must be followed by identical syntactic structures: \"for seismic resilience\" and \"for hydrostatic resistance\" (prepositional phrases)."
  },
  {
    id: "tcat-eng-119",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Select the revision that correctly resolves the faulty ellipsis in the comparative clause:",
    options: [
      "The prototype brushless motor generates as much torque as, if not more torque than, the commercial benchmark.",
      "The prototype brushless motor generates as much torque, if not more torque than, the commercial benchmark.",
      "The prototype brushless motor generates as much torque as, if not more than, the commercial benchmark.",
      "The prototype brushless motor generates as much torque than, if not more than, the commercial benchmark."
    ],
    correct: 0,
    explain: "The phrase \"as much torque as\" must be grammatically complete before introducing the parenthetical condition \"if not more torque than\". Omitting the second \"as\" is a faulty ellipsis."
  },
  {
    id: "tcat-eng-120",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Choose the sentence that correctly avoids pleonasm (unnecessary semantic redundancy) while retaining precise meaning:",
    options: [
      "The software team reverted to the previous version to prevent system deadlock.",
      "The software team reverted back to the previous version to prevent system deadlock.",
      "The software team reverted back to the earlier previous version to prevent system deadlock.",
      "The software team retroactively reverted back to the previous version to prevent system deadlock."
    ],
    correct: 0,
    explain: "\"Revert\" already contains the meaning of going back (\"re-\"); saying \"revert back\" is redundant. Option A is concise and grammatically immaculate."
  },
  {
    id: "tcat-eng-121",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the sentence with correct handling of joint vs. separate possessive nouns:",
    options: [
      "Watson and Crick's seminal paper revolutionized our understanding of nucleic acid architecture.",
      "Watson's and Crick's seminal paper revolutionized our understanding of nucleic acid architecture.",
      "Watson and Crick seminal paper revolutionized our understanding of nucleic acid architecture.",
      "Watson's and Crick seminal paper revolutionized our understanding of nucleic acid architecture."
    ],
    correct: 0,
    explain: "When two individuals jointly author or own a single item (\"seminal paper\"), the possessive apostrophe is added only to the second name (\"Watson and Crick's\")."
  },
  {
    id: "tcat-eng-122",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Select the sentence that accurately uses the subjunctive mood in an inverted hypothetical contrary-to-fact clause:",
    options: [
      "Had the cooling water pumps failed, the emergency shutdown mechanism would have scrammed the core within seconds.",
      "Had the cooling water pumps failed, the emergency shutdown mechanism had scrammed the core within seconds.",
      "Should the cooling water pumps have failed, the emergency shutdown mechanism would scram the core within seconds.",
      "If the cooling water pumps had failed, the emergency shutdown mechanism scrammed the core within seconds."
    ],
    correct: 0,
    explain: "The inverted past contrary-to-fact conditional (\"Had + subject + past participle\") correctly pairs with \"would have + past participle\" in the result clause."
  },
  {
    id: "tcat-eng-123",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the excerpt: \"Perovskite solar cells have emerged as a disruptive photovoltaic technology due to their high absorption coefficient and low fabrication cost via solution processing. However, commercial viability remains constrained by chemical degradation when exposed to moisture and ultraviolet radiation.\"\n\nWhat is the primary obstacle to commercializing perovskite solar cells?",
    options: [
      "Chemical instability in ambient environmental conditions (moisture and UV)",
      "Prohibitively expensive manufacturing equipment requirements",
      "Extremely poor absorption of incident solar photons",
      "Incompatibility with existing electrical grids"
    ],
    correct: 0,
    explain: "The passage explicitly states that commercial viability is constrained by \"chemical degradation when exposed to moisture and ultraviolet radiation\"."
  },
  {
    id: "tcat-eng-124",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Based on the excerpt in Question 123, what advantageous property do perovskite solar cells possess?",
    options: [
      "High optical absorption coefficient and economical solution processing",
      "Complete immunity to environmental degradation and thermal stress",
      "Mechanical flexibility exceeding that of any existing synthetic polymer",
      "Ability to generate electricity without absorbing photons"
    ],
    correct: 0,
    explain: "The excerpt highlights their \"high absorption coefficient and low fabrication cost via solution processing\"."
  },
  {
    id: "tcat-eng-125",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the excerpt: \"In digital communications, Shannon's Channel Capacity theorem establishes the maximum rate at which information can be transmitted error-free across a noisy channel of given bandwidth. Attempting to transmit at rates above this theoretical capacity inevitably introduces uncorrectable bit errors.\"\n\nWhat is the central implication of Shannon's theorem?",
    options: [
      "There is a fundamental mathematical upper limit to error-free transmission in noisy channels",
      "Bandwidth can be increased infinitely without altering channel noise",
      "Transmission errors can always be eliminated regardless of data rate",
      "Noisy channels cannot transmit digital signals under any circumstances"
    ],
    correct: 0,
    explain: "The passage asserts that Shannon's theorem sets the \"maximum rate at which information can be transmitted error-free\", beyond which errors are inevitable."
  },
  {
    id: "tcat-eng-126",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the excerpt: \"Metamaterials derive their anomalous electromagnetic properties—such as a negative refractive index—not from the chemical composition of their constituent atoms, but from the deliberate sub-wavelength geometric arrangement of their artificial inclusions.\"\n\nWhat is the fundamental source of a metamaterial's unique properties?",
    options: [
      "The engineered sub-wavelength geometric structure of its inclusions",
      "Rare earth chemical elements present in its crystalline matrix",
      "Spontaneous atomic decay of heavy radioactive isotopes",
      "Thermal excitation of free valence electrons"
    ],
    correct: 0,
    explain: "The text states that properties arise \"not from the chemical composition... but from the deliberate sub-wavelength geometric arrangement of their artificial inclusions\"."
  },
  {
    id: "tcat-eng-127",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "In the metamaterials passage above (Question 126), the word \"anomalous\" most nearly means:",
    options: [
      "Unconventional and deviating from standard physical behavior",
      "Chemically reactive and toxic",
      "Uniform and predictable",
      "Imperceptible to scientific instruments"
    ],
    correct: 0,
    explain: "\"Anomalous\" means deviating from what is standard, normal, or expected, referring here to unconventional phenomena like negative refraction."
  },
  {
    id: "tcat-eng-128",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Read the excerpt: \"In magnetic confinement fusion, the tokamak uses helical magnetic fields to confine high-temperature deuterium-tritium plasma. Maintaining the stability of this plasma requires mitigating magnetohydrodynamic (MHD) instabilities, which threaten to breach the vacuum vessel wall and quench the reaction.\"\n\nIt can be inferred from the passage that MHD instabilities:",
    options: [
      "Can cause plasma disruption and extinguish the thermonuclear fusion reaction",
      "Are essential for increasing the thermal energy of deuterium ions",
      "Strengthen the confining magnetic fields around the vacuum vessel",
      "Prevent neutrons from escaping the reactor chamber"
    ],
    correct: 0,
    explain: "The passage states that instabilities \"threaten to breach the vacuum vessel wall and quench the reaction\" (extinguishing it)."
  },
  {
    id: "tcat-eng-129",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Referring to the fusion passage above (Question 128), what does the author imply by the word \"quench\"?",
    options: [
      "Extinguish or terminate abruptly",
      "Cool down through liquid nitrogen injection",
      "Hydrate with heavy water",
      "Accelerate toward ignition"
    ],
    correct: 0,
    explain: "In physics and combustion contexts, to \"quench\" a reaction means to rapidly suppress, stifle, or extinguish it."
  },
  {
    id: "tcat-eng-130",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Read the excerpt: \"While silicon has dominated microelectronics for over half a century, its fundamental physical scaling limit—dictated by quantum mechanical tunneling through ultra-thin gate oxides—heralds the plateau of Moore's Law. Transition metal dichalcogenides (TMDs) offer single-atom-thick channels that effectively suppress such parasitic leakage currents.\"\n\nAccording to the passage, why are TMDs being explored as silicon successors?",
    options: [
      "Their atomic thinness mitigates quantum tunneling leakage currents at nanoscale gates",
      "They are far cheaper to extract from geological deposits than common silicon",
      "They operate without generating any thermal resistance or heat",
      "They completely eliminate the requirement for gate dielectric materials"
    ],
    correct: 0,
    explain: "The text notes that TMDs \"offer single-atom-thick channels that effectively suppress such parasitic leakage currents\" caused by quantum tunneling."
  },
  {
    id: "tcat-eng-131",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "In the passage regarding Moore's Law above (Question 130), the word \"parasitic\" describes currents that are:",
    options: [
      "Undesirable, wasteful leakage that undermines device performance",
      "Derived from living biological hosts",
      "Essential for supplying operational voltage to the gate",
      "Beneficial in enhancing transistor clock speed"
    ],
    correct: 0,
    explain: "In electronics, \"parasitic\" refers to unintended, harmful capacitive, inductive, or leakage effects that waste power and degrade efficiency."
  },
  {
    id: "tcat-eng-132",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Read the excerpt: \"Quantum key distribution (QKD) leverages the fundamental quantum principle that measuring an unknown quantum state inevitably disturbs it. Consequently, any eavesdropping adversary attempting to intercept photons transmitted across an optical fiber inevitably introduces detectable quantum bit error rates (QBER), alerting the communicating parties.\"\n\nWhat provides the fundamental security guarantee in QKD systems?",
    options: [
      "Laws of quantum mechanics that mandate measurement introduces disturbance",
      "Extremely complex mathematical factorization algorithms",
      "Physical isolation of fibers inside impenetrable concrete conduits",
      "Electromagnetic shielding that blocks all external radio signals"
    ],
    correct: 0,
    explain: "Security rests on the physical principle that \"measuring an unknown quantum state inevitably disturbs it\", creating detectable error rates."
  },
  {
    id: "tcat-eng-133",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Read the excerpt: \"Epistemological reductionism posits that complex biological systems can be comprehensively understood by analyzing their isolated molecular constituents. However, systems biologists counter that emergent properties—phenomena arising strictly from nonlinear interactions among networked elements—preclude complete explanatory reductionism.\"\n\nWhich statement best captures the philosophical conflict presented in the passage?",
    options: [
      "Whether macroscopic biological phenomena can be fully deduced from isolated molecular parts or require holistic system-level analysis",
      "Whether biological organisms obey standard thermodynamic conservation laws",
      "Whether empirical observation is superior to deductive mathematical modeling in genetics",
      "Whether molecular biology should be discarded in favor of evolutionary taxonomy"
    ],
    correct: 0,
    explain: "The passage contrasts reductionism (understanding systems via isolated parts) with systems biology (emergent properties requiring holistic, networked analysis)."
  },
  {
    id: "tcat-eng-134",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "In the systems biology passage above (Question 133), what does the term \"emergent properties\" denote?",
    options: [
      "Novel characteristics that manifest only at the collective level due to nonlinear element interactions",
      "Properties that disappear as an organism reaches developmental maturity",
      "Simple additive sums of the properties of isolated individual components",
      "Imperfections introduced by experimental measuring apparatus"
    ],
    correct: 0,
    explain: "Emergent properties are systemic attributes arising from interactions between system components that cannot be predicted simply by analyzing parts in isolation."
  },
  {
    id: "tcat-eng-135",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Read the excerpt: \"The anthropic cosmological principle observes that the physical constants of our universe—such as the fine-structure constant and cosmological constant—fall within an infinitesimally narrow range permitting the synthesis of carbon and the subsequent evolution of sentient observers. Proponents of the multiverse hypothesis contend that this apparent fine-tuning is merely an observer selection effect across an ensemble of universes.\"\n\nAccording to the multiverse proponent viewpoint described in the passage:",
    options: [
      "We inevitably observe finely tuned constants because observers can only exist in universes hospitable to life",
      "Our universe was deliberately engineered by conscious entities to foster carbon life",
      "The fine-structure constant changes value unpredictably over cosmological epochs",
      "Carbon-based life can flourish regardless of the values of fundamental physical constants"
    ],
    correct: 0,
    explain: "The multiverse hypothesis explains fine-tuning as an \"observer selection effect\" (we can only observe a universe whose constants permit observers to exist)."
  },
  {
    id: "tcat-eng-136",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "The author's tone in describing the anthropic principle and the multiverse hypothesis in Question 135 is best characterized as:",
    options: [
      "Objective and analytical",
      "Vehemently skeptical and dismissive",
      "Dogmatic and overtly promotional",
      "Ironical and satirical"
    ],
    correct: 0,
    explain: "The author presents the competing scientific and philosophical arguments dispassionately and neutrally, demonstrating an objective and analytical tone."
  },
  {
    id: "tcat-eng-137",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "Select the pair that best expresses a relationship similar to the original:\nTHERMAL : HEAT ::",
    options: [
      "Acoustic : Sound",
      "Optic : Friction",
      "Kinetic : Gravity",
      "Static : Motion"
    ],
    correct: 0,
    explain: "\"Thermal\" relates to heat, just as \"acoustic\" relates to sound (adjective indicating relationship to the respective physical phenomenon)."
  },
  {
    id: "tcat-eng-138",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "Choose the matching pair:\nHYGROMETER : HUMIDITY ::",
    options: [
      "Anemometer : Wind Speed",
      "Voltmeter : Resistance",
      "Calorimeter : Voltage",
      "Tachometer : Mass"
    ],
    correct: 0,
    explain: "A hygrometer is an instrument specifically designed to measure humidity, just as an anemometer measures wind speed."
  },
  {
    id: "tcat-eng-139",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "Complete the analogy:\nMALLEABLE : COMPRESSION ::",
    options: [
      "Ductile : Tension",
      "Brittle : Elasticity",
      "Porous : Density",
      "Fluid : Solidification"
    ],
    correct: 0,
    explain: "Malleability is the capacity of a material to deform plastically under compressive stress, while ductility is the ability to deform under tensile stress (tension)."
  },
  {
    id: "tcat-eng-140",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "Identify the analogous pair:\nCONCAVE : CONVEX ::",
    options: [
      "Divergent : Convergent",
      "Reflective : Refractive",
      "Opaque : Translucent",
      "Planar : Spherical"
    ],
    correct: 0,
    explain: "A concave lens/mirror acts as a diverging optical element, whereas a convex element acts as a converging element, establishing a complementary geometric and functional opposition."
  },
  {
    id: "tcat-eng-141",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "Select the best matching relationship:\nFUSE : OVERCURRENT ::",
    options: [
      "Shock Absorber : Mechanical Vibration",
      "Capacitor : Induction",
      "Transformer : Direct Current",
      "Resistor : Conductivity"
    ],
    correct: 0,
    explain: "A fuse mitigates and protects against harmful electrical overcurrent, just as a shock absorber mitigates harmful mechanical vibration."
  },
  {
    id: "tcat-eng-142",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "Complete the analogy:\nCATALYST : ACTIVATION ENERGY ::",
    options: [
      "Lubricant : Friction",
      "Turbine : Pressure",
      "Electrode : Resistance",
      "Insulator : Heat Transfer"
    ],
    correct: 0,
    explain: "A catalyst lowers the activation energy barrier of a chemical reaction, just as a lubricant reduces the frictional resistance between sliding surfaces."
  },
  {
    id: "tcat-eng-143",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "Select the matching pair:\nPRISM : DISPERSION ::",
    options: [
      "Diffraction Grating : Interference",
      "Polarizer : Absorption",
      "Convex Lens : Dispersion",
      "Mirror : Refraction"
    ],
    correct: 0,
    explain: "A prism decomposes polychromatic light into its spectrum via dispersion, just as a diffraction grating decomposes light via interference and diffraction."
  },
  {
    id: "tcat-eng-144",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "Choose the pair expressing the same relationship:\nVOLTAGE : CURRENT ::",
    options: [
      "Pressure Gradient : Fluid Flow Rate",
      "Resistance : Viscosity",
      "Capacitance : Velocity",
      "Inductance : Temperature"
    ],
    correct: 0,
    explain: "In fluid mechanics (Poiseuille's law) and electrical circuits (Ohm's law), voltage is the driving potential difference driving electric current, analogous to pressure gradient driving fluid flow rate."
  },
  {
    id: "tcat-eng-145",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "Identify the matching pair:\nOSMOSIS : CONCENTRATION GRADIENT ::",
    options: [
      "Conduction : Temperature Gradient",
      "Radiation : Vacuum",
      "Capillarity : Gravity",
      "Diffusion : Density"
    ],
    correct: 0,
    explain: "Osmosis is the net transport of solvent driven by a chemical potential/concentration gradient, just as thermal conduction is heat transfer driven by a temperature gradient (Fourier's law)."
  },
  {
    id: "tcat-eng-146",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "Select the pair that best mirrors the relationship:\nZENITH : NADIR ::",
    options: [
      "Apogee : Perigee",
      "Horizon : Meridian",
      "Equator : Solstice",
      "Azimuth : Elevation"
    ],
    correct: 0,
    explain: "\"Zenith\" (highest celestial point directly overhead) and \"nadir\" (lowest point directly below) are diametrically opposed celestial coordinates, identical to \"apogee\" (farthest orbital point) and \"perigee\" (closest orbital point)."
  },
  {
    id: "tcat-eng-147",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "Complete the analogy:\nSUPERFLUOUS : SURPLUS ::",
    options: [
      "Vacuous : Inanity",
      "Indigent : Wealth",
      "Tenacious : Reluctance",
      "Ephemeral : Permanence"
    ],
    correct: 0,
    explain: "Something \"superfluous\" is characterized by excess or surplus, just as something \"vacuous\" is characterized by emptiness or inanity."
  },
  {
    id: "tcat-eng-148",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "Choose the pair expressing the same relationship:\nTENACIOUS : YIELD ::",
    options: [
      "Impervious : Penetrate",
      "Malleable : Bend",
      "Audacious : Dare",
      "Voracious : Consume"
    ],
    correct: 0,
    explain: "A \"tenacious\" entity refuses to yield or surrender, just as an \"impervious\" barrier refuses to let substances penetrate it (quality defined by resistance to the action)."
  },
  {
    id: "tcat-eng-149",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "Select the matching pair:\nINERTIA : ACCELERATION ::",
    options: [
      "Capacitance : Voltage Change",
      "Conductance : Current Flow",
      "Friction : Heat",
      "Momentum : Velocity"
    ],
    correct: 0,
    explain: "Inertia is a body's intrinsic resistance to a change in velocity (acceleration), just as capacitance is an electrical element's resistance to sudden changes in voltage across it (i = C dv/dt)."
  },
  {
    id: "tcat-eng-150",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "Identify the analogous pair:\nMETASTABLE : PERTURBATION ::",
    options: [
      "Precarious : Disturbance",
      "Immutable : Change",
      "Static : Inertia",
      "Resilient : Fragility"
    ],
    correct: 0,
    explain: "A metastable state remains stable only until subjected to a slight perturbation that triggers transition to lower energy, analogous to a precarious position that collapses upon experiencing a minor disturbance."
  },
  {
    id: "tcat-eng-151",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Identify the part of speech of the capitalized word in the sentence: \"She spoke ELOQUENTLY during the international symposium.\"",
    options: ["Adverb","Adjective","Noun","Preposition"],
    correct: 0,
    explain: "\"Eloquently\" is an adverb modifying the verb \"spoke\", describing the manner in which the speech was delivered."
  },
  {
    id: "tcat-eng-152",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Fill in the blank with the appropriate preposition: \"The candidate was fully confident _____ her performance in the competitive entrance exam.\"",
    options: ["of","about","in","with"],
    correct: 0,
    explain: "The standard idiomatic adjective-preposition collocation is \"confident of\" (or \"confident in\" someone/something; here \"confident of her performance\" is the prescribed standard English usage)."
  },
  {
    id: "tcat-eng-153",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Select the correct tense form to complete the sentence: \"By the time the keynote speaker arrived, the auditorium _____ completely.\"",
    options: ["had filled","was filling","has filled","filled"],
    correct: 0,
    explain: "When two past actions are related chronologically, the earlier action is expressed in the past perfect tense (\"had filled\") relative to the simple past (\"arrived\")."
  },
  {
    id: "tcat-eng-154",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Choose the appropriate article to complete the sentence: \"He is _____ honorable gentleman who values academic integrity.\"",
    options: ["an","a","the","no article needed"],
    correct: 0,
    explain: "\"Honorable\" begins with a silent \"h\" and a vowel sound (/ˈɒn.ər.ə.bəl/), thus taking the indefinite article \"an\"."
  },
  {
    id: "tcat-eng-155",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "What is the grammatical function of the gerund phrase in the sentence: \"SWIMMING IN TURBULENT WATERS requires substantial endurance\"?",
    options: ["Subject of the sentence","Direct object","Subject complement","Object of a preposition"],
    correct: 0,
    explain: "The gerund phrase \"Swimming in turbulent waters\" acts as the noun subject governing the singular predicate \"requires\"."
  },
  {
    id: "tcat-eng-156",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Select the sentence displaying correct subject-verb agreement with correlative conjunctions:",
    options: ["Neither the principal investigator nor the research assistants were aware of the calibration error.","Neither the principal investigator nor the research assistants was aware of the calibration error.","Neither the research assistants nor the principal investigator were aware of the calibration error.","Neither the research assistants or the principal investigator was aware of the calibration error."],
    correct: 0,
    explain: "Under the rule of proximity for \"neither... nor\", the verb agrees in number with the closer subject (\"research assistants\" is plural, so \"were aware\" is correct)."
  },
  {
    id: "tcat-eng-157",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Convert the following direct speech into reported speech correctly: \"The professor said, 'Water boils at 100 degrees Celsius under standard atmospheric pressure.'\"",
    options: ["The professor said that water boils at 100 degrees Celsius under standard atmospheric pressure.","The professor said that water boiled at 100 degrees Celsius under standard atmospheric pressure.","The professor said that water had boiled at 100 degrees Celsius under standard atmospheric pressure.","The professor told that water would boil at 100 degrees Celsius under standard atmospheric pressure."],
    correct: 0,
    explain: "Universal scientific truths and general physical facts remain in the simple present tense even when the reporting verb is in the past tense."
  },
  {
    id: "tcat-eng-158",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Identify the sentence that correctly employs the subjunctive mood:",
    options: ["The committee recommended that the draft protocol be submitted for institutional review immediately.","The committee recommended that the draft protocol is submitted for institutional review immediately.","The committee recommended that the draft protocol was submitted for institutional review immediately.","The committee recommended that the draft protocol should had been submitted for institutional review immediately."],
    correct: 0,
    explain: "Verbs of demand, recommendation, or urgency require the mandative subjunctive form (base verb \"be submitted\"), without \"is\", \"was\", or modal auxiliaries."
  },
  {
    id: "tcat-eng-159",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Which sentence correctly uses an inversion construction after a negative restrictive adverbial?",
    options: ["Seldom have we witnessed such a profound paradigm shift in theoretical physics.","Seldom we have witnessed such a profound paradigm shift in theoretical physics.","Seldom we witnessed such a profound paradigm shift in theoretical physics.","Seldom had we witness such a profound paradigm shift in theoretical physics."],
    correct: 0,
    explain: "When a negative or restrictive adverbial (like \"seldom\", \"rarely\", \"scarcely\") is placed sentence-initially for emphasis, subject-auxiliary inversion is mandatory (\"have we witnessed\")."
  },
  {
    id: "tcat-eng-160",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Identify the type of dependent clause in the sentence: \"Although the experimental setup was intricate, the team gathered conclusive empirical data.\"",
    options: ["Adverbial clause of concession","Noun clause acting as subject","Adjectival relative clause","Restrictive appositive clause"],
    correct: 0,
    explain: "The subordinate clause introduced by \"although\" is an adverbial clause of concession indicating a contrasting condition to the main clause."
  },
  {
    id: "tcat-eng-161",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Analyze the syntactic structure of the capitalized clause: \"It is imperative THAT EVERY RESEARCHER COMPLY WITH LABORATORY BIO-SAFETY STANDARDS.\"",
    options: ["Substantive noun clause functioning as the delayed true subject of the sentence with mandative subjunctive verb","Adjectival relative clause modifying the dummy pronoun \"It\"","Adverbial clause of purpose with an indicative verb","Prepositional complement clause functioning as an adjunct"],
    correct: 0,
    explain: "\"It\" is an expletive (dummy) pronoun; the capitalized \"that\"-clause is a nominal content clause functioning as the extraposed real subject, employing the mandative subjunctive verb \"comply\"."
  },
  {
    id: "tcat-eng-162",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Choose the sentence that correctly utilizes an absolute phrase without dangling or syntactic detachment:",
    options: ["The empirical tests having yielded ambiguous outcomes, the laboratory scheduled an independent peer audit.","Having yielded ambiguous outcomes, an independent peer audit was scheduled by the laboratory.","The laboratory scheduled an audit, the tests were ambiguous.","The empirical tests having yielded ambiguous outcomes, it was decided to cancel the project."],
    correct: 0,
    explain: "\"The empirical tests having yielded ambiguous outcomes\" is a grammatically legitimate nominative absolute phrase containing its own subject (\"tests\") and participle (\"having yielded\"), modifying the entire independent clause."
  },
  {
    id: "tcat-eng-163",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Select the option that correctly represents the passive transformation of the ditransitive sentence: \"The panel awarded Dr. Alvi the lifetime achievement medal in biophysics.\"",
    options: ["Dr. Alvi was awarded the lifetime achievement medal in biophysics by the panel.","The lifetime achievement medal in biophysics was being awarded Dr. Alvi by the panel.","Dr. Alvi had been awarding the lifetime achievement medal in biophysics by the panel.","The lifetime achievement medal in biophysics was awarded of Dr. Alvi by the panel."],
    correct: 0,
    explain: "In transforming a ditransitive clause, making the indirect object (\"Dr. Alvi\") the passive subject gives: \"Dr. Alvi was awarded the lifetime achievement medal in biophysics by the panel.\""
  },
  {
    id: "tcat-eng-164",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Which sentence exhibits a non-finite catenative complementation pattern with an accusative and infinitive structure?",
    options: ["The senior engineer observed the turbine rotate at supersonic angular velocity.","The senior engineer was observing that the turbine rotates at supersonic velocity.","The rotation of the turbine at supersonic velocity was observed.","Having observed the turbine, the senior engineer recorded the velocity."],
    correct: 0,
    explain: "Verbs of perception like \"observe\", \"watch\", and \"hear\" take a bare infinitive complement after an accusative noun phrase (\"observed [the turbine] [rotate]\")."
  },
  {
    id: "tcat-eng-165",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Identify the sentence containing a correctly structured third conditional inverted construction (omission of \"if\"):",
    options: ["Had the cooling mechanism not malfunctioned, the secondary containment vessel would have remained intact.","Should the cooling mechanism not malfunction, the secondary containment vessel would remain intact.","Were the cooling mechanism not to malfunction, the secondary containment vessel would have remained intact.","Had not the cooling mechanism malfunctioned, the secondary containment vessel would remain intact."],
    correct: 0,
    explain: "Inverted third conditional clauses invert auxiliary \"had\" with the subject: \"Had the cooling mechanism not malfunctioned...\". Note that the contraction \"Hadn't\" or full \"Had [subject] not\" is required."
  },
  {
    id: "tcat-eng-166",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the most accurate SYNONYM for the word \"METICULOUS\":",
    options: ["Painstaking","Careless","Hastened","Indifferent"],
    correct: 0,
    explain: "\"Meticulous\" means showing great attention to detail; very careful and precise. \"Painstaking\" is its direct synonym."
  },
  {
    id: "tcat-eng-167",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the most accurate ANTONYM for the word \"LUCID\":",
    options: ["Obscure","Clear","Intelligible","Luminous"],
    correct: 0,
    explain: "\"Lucid\" means clear and easy to understand; its antonym is \"obscure\" (unclear or difficult to perceive)."
  },
  {
    id: "tcat-eng-168",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "What is the meaning of the word \"BENEVOLENT\" as used in academic discourse?",
    options: ["Well-meaning and kindly disposed toward others","Hostile and aggressive","Economically impoverished","Strictly neutral"],
    correct: 0,
    explain: "\"Benevolent\" derives from Latin roots meaning wishing well, characterized by kindness and charitable goodwill."
  },
  {
    id: "tcat-eng-169",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the most accurate SYNONYM for the word \"PRAGMATIC\":",
    options: ["Practical","Idealistic","Theoretical","Reckless"],
    correct: 0,
    explain: "\"Pragmatic\" means dealing with matters realistically based on practical rather than theoretical considerations."
  },
  {
    id: "tcat-eng-170",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the most accurate ANTONYM for the word \"CANDID\":",
    options: ["Deceitful","Frank","Outspoken","Sincere"],
    correct: 0,
    explain: "\"Candid\" means truthful and straightforward; its opposite is \"deceitful\" or disingenuous."
  },
  {
    id: "tcat-eng-171",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the most appropriate SYNONYM for the word \"EPHEMERAL\":",
    options: ["Transient","Eternal","Substantial","Pervasive"],
    correct: 0,
    explain: "\"Ephemeral\" means lasting for a very short time; \"transient\" conveys the exact same fleeting temporality."
  },
  {
    id: "tcat-eng-172",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the most appropriate ANTONYM for the word \"VORACIOUS\":",
    options: ["Abstemious","Rapacious","Insatiable","Gluttonous"],
    correct: 0,
    explain: "\"Voracious\" means possessing an insatiable appetite or eagerness. \"Abstemious\" describes moderate and sparing consumption, serving as its antonym."
  },
  {
    id: "tcat-eng-173",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Which word best completes the sentence: \"The speaker's arguments were so _____ that even the most skeptical members of the jury conceded the thesis\"?",
    options: ["Cogent","Flippant","Spurious","Vacuous"],
    correct: 0,
    explain: "\"Cogent\" means clear, logical, and powerfully convincing."
  },
  {
    id: "tcat-eng-174",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the most accurate SYNONYM for the word \"UBIQUITOUS\":",
    options: ["Omnipresent","Scant","Sporadic","Localized"],
    correct: 0,
    explain: "\"Ubiquitous\" means present, appearing, or found everywhere simultaneously; \"omnipresent\" is its direct synonym."
  },
  {
    id: "tcat-eng-175",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the most accurate ANTONYM for the word \"TENACIOUS\":",
    options: ["Yielding","Persistent","Steadfast","Unyielding"],
    correct: 0,
    explain: "\"Tenacious\" means holding firm or persistent; its antonym is \"yielding\" or compliant."
  },
  {
    id: "tcat-eng-176",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the most precise SYNONYM for the word \"TRUCULENT\":",
    options: ["Belligerent","Placid","Conciliatory","Magnanimous"],
    correct: 0,
    explain: "\"Truculent\" means aggressively defiant, eager to argue, or belligerent."
  },
  {
    id: "tcat-eng-177",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the most accurate ANTONYM for the word \"ESOTERIC\":",
    options: ["Exoteric","Abstruse","Arcane","Recondite"],
    correct: 0,
    explain: "\"Esoteric\" means intended for or understood by only an enlightened inner circle; its true etymological antonym is \"exoteric\" (suitable for or understood by the general public)."
  },
  {
    id: "tcat-eng-178",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "What is the contextual meaning of \"PUSILLANIMOUS\" in a philosophical treatise on moral courage?",
    options: ["Timid and lacking courage in the face of danger","Arrogantly assertive","Extravagantly generous","Intellectually versatile"],
    correct: 0,
    explain: "\"Pusillanimous\" comes from Latin \"pusillus\" (very small) + \"animus\" (mind/spirit), signifying cowardice, faint-heartedness, or lack of resolve."
  },
  {
    id: "tcat-eng-179",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Identify the word whose meaning is closest to \"INCHOATE\":",
    options: ["Rudimentary and just beginning to develop","Fully formed and articulated","Deceptive and fallacious","Obsolete and archaic"],
    correct: 0,
    explain: "\"Inchoate\" means only recently begun and not fully formed, organized, or developed; rudimentary."
  },
  {
    id: "tcat-eng-180",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the pair that represents an accurate ANTONYM relationship for \"EQUANIMITY\":",
    options: ["Agitation","Serenity","Composure","Imperturbability"],
    correct: 0,
    explain: "\"Equanimity\" denotes mental calmness and composure under psychological pressure; its antonym is \"agitation\" or disquiet."
  },
  {
    id: "tcat-eng-181",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Identify the sentence free from grammatical errors:",
    options: ["Each of the newly designed solar modules undergoes rigorous durability testing.","Each of the newly designed solar modules undergo rigorous durability testing.","Each of the newly designed solar modules are undergoing rigorous durability testing.","Each of the newly designed solar modules have undergone rigorous durability testing."],
    correct: 0,
    explain: "The pronoun \"each\" is singular and takes a singular verb (\"undergoes\"), irrespective of the plural prepositional complement (\"of the modules\")."
  },
  {
    id: "tcat-eng-182",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Choose the grammatically correct sentence:",
    options: ["Neither the professor nor her students were able to replicate the anomalous result.","Neither the professor nor her students was able to replicate the anomalous result.","Neither the professor or her students were able to replicate the anomalous result.","Neither the professor nor her students is able to replicate the anomalous result."],
    correct: 0,
    explain: "With \"neither... nor\", the verb agrees with the closer subject (\"students\" is plural, requiring \"were able\")."
  },
  {
    id: "tcat-eng-183",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Identify the sentence that correctly corrects the misplaced modifier: \"Walking into the laboratory, the smoke was seen by the technician.\"",
    options: ["Walking into the laboratory, the technician saw the smoke.","Walking into the laboratory, smoke was seeing by the technician.","The smoke saw the technician, walking into the laboratory.","While walking into the laboratory, the smoke became visible to the technician."],
    correct: 0,
    explain: "The dangling participle \"Walking into the laboratory\" logically modifies the person performing the action (\"the technician\"), who must immediately follow the introductory phrase."
  },
  {
    id: "tcat-eng-184",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Which sentence maintains correct comparative degree usage?",
    options: ["This algorithmic framework is more efficient than any other method currently deployed.","This algorithmic framework is more efficient than any method currently deployed.","This algorithmic framework is most efficient than any method currently deployed.","This algorithmic framework is more efficiently than any other method currently deployed."],
    correct: 0,
    explain: "When comparing an item to members of its own group, \"any other\" must be used to exclude the item itself from the comparison group."
  },
  {
    id: "tcat-eng-185",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Select the sentence that contains NO punctuation or comma-splice error:",
    options: ["The thermal sensors registered an abrupt spike; consequently, the automated shutdown triggered.","The thermal sensors registered an abrupt spike, consequently, the automated shutdown triggered.","The thermal sensors registered an abrupt spike consequently the automated shutdown triggered.","The thermal sensors registered an abrupt spike; consequently the automated shutdown triggered."],
    correct: 0,
    explain: "A conjunctive adverb (\"consequently\") joining two independent clauses must be preceded by a semicolon and followed by a comma."
  },
  {
    id: "tcat-eng-186",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Choose the sentence that exhibits correct parallel structure:",
    options: ["The aerospace program aims to improve propulsion efficiency, reduce fuel consumption, and enhance payload safety.","The aerospace program aims to improve propulsion efficiency, reducing fuel consumption, and to enhance payload safety.","The aerospace program aims at improving propulsion efficiency, reduction of fuel, and enhances payload safety.","The aerospace program aims to improve propulsion efficiency, to reduce fuel consumption, and enhancing payload safety."],
    correct: 0,
    explain: "Series items must share identical grammatical form: \"to improve..., reduce..., and enhance...\" (parallel base verbs governed by \"to\")."
  },
  {
    id: "tcat-eng-187",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Select the sentence that avoids faulty pronoun reference:",
    options: ["Although the software suite had numerous vulnerabilities, the cybersecurity team patched all of them before deployment.","Although the software suite had numerous vulnerabilities, the cybersecurity team patched it all before deployment.","When the software met with vulnerabilities, they patched them quickly.","In the software, it had vulnerabilities that the team patched."],
    correct: 0,
    explain: "\"Them\" unambiguously refers to the plural antecedent \"vulnerabilities\", avoiding the vague pronoun references seen in the other options."
  },
  {
    id: "tcat-eng-188",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Identify the sentence with correct idiom and prepositional usage:",
    options: ["The regulatory board insisted on compliance with the updated safety statutes.","The regulatory board insisted to comply with the updated safety statutes.","The regulatory board insisted for compliance on the updated safety statutes.","The regulatory board insisted at compliance of the updated safety statutes."],
    correct: 0,
    explain: "The verb \"insisted\" takes the preposition \"on\" (\"insisted on\"), and \"compliance\" collocates with \"with\" (\"compliance with safety statutes\")."
  },
  {
    id: "tcat-eng-189",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Choose the sentence that corrects the faulty comparison in: \"The computational power of modern quantum processors exceeds classical supercomputers.\"",
    options: ["The computational power of modern quantum processors exceeds that of classical supercomputers.","The computational power of modern quantum processors exceeds classical supercomputers themselves.","Modern quantum processors exceed computational power of classical supercomputers.","The computational power of modern quantum processors is exceeding than classical supercomputers."],
    correct: 0,
    explain: "A quality (\"computational power\") cannot be compared directly to an object (\"classical supercomputers\"). The demonstrative pronoun \"that of\" must be inserted to balance the comparison."
  },
  {
    id: "tcat-eng-190",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Which sentence correctly avoids redundancy (pleonasm)?",
    options: ["The research consortium decided to consolidate the disparate experimental datasets into a unified archive.","The research consortium decided to consolidate the disparate experimental datasets together into a unified archive.","The research consortium decided to merge together the disparate datasets into a unified archive.","The research consortium decided to consolidate and combine together the experimental datasets."],
    correct: 0,
    explain: "\"Consolidate\" inherently means combining into a single whole; adding \"together\" is redundant."
  },
  {
    id: "tcat-eng-191",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the sentence that correctly resolves all issues of case, agreement, and parallelism:",
    options: ["The provost invited whoever demonstrated scholarly rigor to apply for the prestigious postdoctoral fellowship.","The provost invited whomever demonstrated scholarly rigor to apply for the prestigious postdoctoral fellowship.","The provost invited whoever demonstrates scholarly rigor to have applied for the prestigious fellowship.","The provost invited whomever had demonstrated scholarly rigor for applying to the fellowship."],
    correct: 0,
    explain: "The pronoun serves as the subject of the subordinate noun clause (\"whoever demonstrated scholarly rigor\"), not the direct object of \"invited\". The entire clause functions as the direct object, so the nominative case \"whoever\" is strictly required."
  },
  {
    id: "tcat-eng-192",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Which sentence correctly avoids a dangling elliptical clause?",
    options: ["While conducting the spectroscopic assay, Dr. Tahir noted an unexpected fluorescence absorption peak.","While conducting the spectroscopic assay, an unexpected fluorescence absorption peak was noted.","While conducting the spectroscopic assay, the spectrum showed an absorption peak.","While in the spectroscopic assay, the absorption peak surprised Dr. Tahir."],
    correct: 0,
    explain: "In the elliptical clause \"While conducting...\", the implied subject must be identical to the grammatical subject of the main clause (\"Dr. Tahir\"). In passive constructions, the clause dangles."
  },
  {
    id: "tcat-eng-193",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Select the sentence that correctly employs the subjunctive and inversion without stylistic infelicity:",
    options: ["Were the tensile strain to exceed critical thresholds, under no circumstances should the structural load be increased.","Were the tensile strain to exceed critical thresholds, under no circumstances the structural load should be increased.","If the tensile strain would exceed critical thresholds, under no circumstances should the load be increased.","Had the tensile strain exceeded critical thresholds, under no circumstances the load should be increased."],
    correct: 0,
    explain: "The conditional uses correct inverted subjunctive (\"Were the tensile strain to exceed...\"), and the negative restrictive adjunct (\"under no circumstances\") correctly triggers subject-auxiliary inversion (\"should the structural load be increased\")."
  },
  {
    id: "tcat-eng-194",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Choose the sentence that correctly pairs correlatives and adheres strictly to parallelism:",
    options: ["The newly discovered catalyst not only accelerates reaction kinetics but also minimizes thermal dissipation.","The newly discovered catalyst not only accelerates reaction kinetics but it minimizes thermal dissipation also.","Not only the catalyst accelerates reaction kinetics, but also minimizes thermal dissipation.","The newly discovered catalyst accelerates not only reaction kinetics but also it minimizes thermal dissipation."],
    correct: 0,
    explain: "The correlative pair \"not only [verb phrase] but also [verb phrase]\" balances two parallel active verbs: \"accelerates reaction kinetics\" and \"minimizes thermal dissipation\"."
  },
  {
    id: "tcat-eng-195",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the sentence free from the error of faulty predication:",
    options: ["The rationale behind adopting graphene electrodes is that their high surface area enhances capacitive charge storage.","The rationale behind adopting graphene electrodes is because their high surface area enhances capacitive charge storage.","The reason behind adopting graphene electrodes is on account of their high surface area.","The rationale behind adopting graphene electrodes is due to high surface area."],
    correct: 0,
    explain: "\"The rationale/reason is that...\" is the grammatically correct predicate noun clause construction. \"The reason is because/due to\" is a classic error of faulty predication and tautology."
  },
  {
    id: "tcat-eng-196",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "According to the passage on thermodynamics, what must happen to the total entropy of an isolated system over time?",
    options: ["It must increase, approaching thermodynamic equilibrium","It decreases linearly as temperature drops","It remains strictly constant at all times","It fluctuates unpredictably without any net direction"],
    correct: 0,
    explain: "The passage explicitly states: \"The Second Law posits that the total entropy of an isolated system must increase over time, approaching a state of maximum thermodynamic equilibrium.\""
  },
  {
    id: "tcat-eng-197",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Based on the passage, what enables localized entropy decreases in biological systems?",
    options: ["A compensatory increase in the entropy of the surrounding universe","A complete suspension of the Second Law of Thermodynamics","The total absence of heat dissipation","The perpetual creation of new mass"],
    correct: 0,
    explain: "The passage states that localized entropy decreases occur \"strictly at the thermodynamic expense of increasing the entropy of the surrounding universe.\""
  },
  {
    id: "tcat-eng-198",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "What is the primary subject matter of the passage?",
    options: ["The fundamental constraints imposed by the Second Law of Thermodynamics on spontaneous processes","Methods for industrial synthesis of plastics","The historical biography of Rudolf Clausius","Techniques for measuring atmospheric pressure"],
    correct: 0,
    explain: "The text focuses entirely on how the Second Law of Thermodynamics and entropy govern spontaneous physical and biological transformations."
  },
  {
    id: "tcat-eng-199",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "The word \"spontaneous\" in the first sentence most nearly means:",
    options: ["Occurring naturally without continuous external intervention","Erratic and impulsive","Instantaneous and explosive","Artificially induced"],
    correct: 0,
    explain: "In thermodynamic context, \"spontaneous\" describes processes that occur without requiring continuous external energy input."
  },
  {
    id: "tcat-eng-200",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Which example of a localized entropy decrease is explicitly provided in the text?",
    options: ["The self-assembly of biological macromolecules","The expansion of an ideal gas","The melting of an iceberg","The combustion of hydrocarbons"],
    correct: 0,
    explain: "The author explicitly mentions \"the self-assembly of biological macromolecules\" as an example of localized entropy decrease."
  },
  {
    id: "tcat-eng-201",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "What fundamental shift in artificial intelligence methodology is outlined in the second passage?",
    options: ["From manually engineered heuristic rules to automated deep representation learning","From gradient optimization to mechanical calculating engines","From medical diagnostics to avionics exclusively","From statistical modeling to purely philosophical inquiry"],
    correct: 0,
    explain: "The opening line specifies the paradigm shift \"from hand-crafted heuristic rules toward deep representation learning.\""
  },
  {
    id: "tcat-eng-202",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Why does the author characterize deep neural networks as an \"epistemic black box\"?",
    options: ["Because millions of non-linear parameter interactions obscure the transparency and interpretability of their internal reasoning","Because they operate without any electricity or computational hardware","Because their source code is kept confidential by commercial entities","Because they can only process images of black boxes"],
    correct: 0,
    explain: "The text links the \"epistemic black box\" directly to \"the millions of non-linear parameter interactions\" that sacrifice interpretability."
  },
  {
    id: "tcat-eng-203",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "In the passage, the word \"efficacy\" is closest in meaning to:",
    options: ["Effectiveness","Theoretical elegance","Computational cost","Fragility"],
    correct: 0,
    explain: "\"Efficacy\" refers to the ability to produce a desired or intended result; effectiveness."
  },
  {
    id: "tcat-eng-204",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Which of the following can be inferred regarding safety-critical domains from the passage?",
    options: ["Lack of interpretability hinders the validation and trustworthy adoption of deep learning models in high-stakes fields","Diagnostic medicine has completely abandoned artificial intelligence","Heuristic systems are mathematically proven to be superior in accuracy","Gradient optimization is impossible in avionics"],
    correct: 0,
    explain: "The passage highlights that the black-box nature poses \"profound validation challenges in safety-critical domains such as automated avionics and diagnostic medicine.\""
  },
  {
    id: "tcat-eng-205",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "What is the author's primary tone in discussing deep representation learning?",
    options: ["Analytically balanced and cautious","Uncritically enthusiastic","Dismissive and hostile","Satirical and mocking"],
    correct: 0,
    explain: "The author acknowledges the remarkable empirical efficacy of deep learning while objectively weighing its severe interpretability and validation challenges."
  },
  {
    id: "tcat-eng-206",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "According to the third passage, how does general relativity relate conceptually to Newtonian mechanics?",
    options: ["It subsumes Newtonian mechanics as a valid asymptotic limiting case under weak gravity and low velocity","It entirely refutes all predictive calculations of Newtonian gravitation as historical fiction","It proves that Newtonian equations are mathematically incompatible with any physical reality","It replaces calculus with purely non-Euclidean geometric philosophy"],
    correct: 0,
    explain: "The author notes that relativity \"circumscribed its domain\" and that mature theories survive as \"limiting cases of more expansive frameworks\" via the correspondence principle."
  },
  {
    id: "tcat-eng-207",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "The phrase \"progressive conceptual subsumption\" implies that scientific progress occurs primarily through:",
    options: ["The incorporation and preservation of established models within broader, higher-level explanatory structures","The random destruction of previous scientific literature","Sudden political shifts in scientific funding","The strict rejection of all mathematical formalism"],
    correct: 0,
    explain: "Subsumption refers to integrating or absorbing existing valid concepts into a more comprehensive framework that accounts for a wider spectrum of phenomena."
  },
  {
    id: "tcat-eng-208",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "In the passage, the word \"circumscribed\" most accurately denotes:",
    options: ["Delineated boundaries around","Calculated the circumference of","Expanded without restraint","Totally invalidated"],
    correct: 0,
    explain: "\"Circumscribe\" means to draw a boundary around or define the specific limits of something."
  },
  {
    id: "tcat-eng-209",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Which philosophical view of scientific development does the author explicitly argue AGAINST?",
    options: ["The view that scientific revolutions represent wanton epistemic ruptures that discard all prior knowledge","The correspondence principle","The asymptotic convergence of physical equations","The existence of relativistic spacetime curvature"],
    correct: 0,
    explain: "The author states: \"scientific revolutions are characterized not by wanton epistemic rupture, but by progressive conceptual subsumption.\""
  },
  {
    id: "tcat-eng-210",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "What role does the \"correspondence principle\" play in the author's thesis?",
    options: ["It serves as the formal mathematical mechanism demonstrating how a new theory reduces to the old theory in familiar regimes","It mandates that scientists correspond via peer-reviewed postal journals","It proves that gravitational fields are fundamentally identical to electromagnetic waves","It demonstrates the impossibility of reconciling quantum mechanics with general relativity"],
    correct: 0,
    explain: "The passage explains that \"relativistic equations asymptotically reduce to their Newtonian counterparts via the correspondence principle.\""
  },
  {
    id: "tcat-eng-211",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "ANEMOMETER : WIND SPEED :: GALVANOMETER : ?",
    options: ["Electric current magnitude and direction","Atmospheric pressure","Luminous intensity","Chemical acidity"],
    correct: 0,
    explain: "An anemometer is an instrument measuring wind speed; a galvanometer is an instrument detecting and measuring small electric currents and their direction."
  },
  {
    id: "tcat-eng-212",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "TELESCOPE : ASTRONOMER :: MICROSCOPE : ?",
    options: ["Microbiologist","Geologist","Architect","Meteorologist"],
    correct: 0,
    explain: "A telescope is the quintessential optical tool used by an astronomer; a microscope is the quintessential tool used by a microbiologist."
  },
  {
    id: "tcat-eng-213",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "INHIBITOR : BIOCHEMICAL ENZYME :: BRAKE : ?",
    options: ["Mechanical vehicle motion","Chemical accelerator","Combustion chamber","Aerodynamic lift"],
    correct: 0,
    explain: "An enzyme inhibitor retards or halts enzymatic catalytic activity; a mechanical brake slows down or stops vehicle motion."
  },
  {
    id: "tcat-eng-214",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "AUTHOR : NOVEL :: COMPOSER : ?",
    options: ["Symphony","Sculpture","Blueprint","Editorial"],
    correct: 0,
    explain: "An author creates a novel; a composer creates a musical symphony."
  },
  {
    id: "tcat-eng-215",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "INSULATOR : ELECTRICITY :: CONDENSER : ?",
    options: ["Vapor","Light","Sound","Magnetism"],
    correct: 0,
    explain: "An insulator impedes or confines electricity; a condenser concentrates or liquefies vapor (device/process relationship)."
  },
  {
    id: "tcat-eng-216",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "IMPEDANCE : ALTERNATING CURRENT :: FRICTION : ?",
    options: ["Mechanical translation","Magnetic flux","Capacitive charge","Gravitational pull"],
    correct: 0,
    explain: "Electrical impedance opposes the flow of alternating current; mechanical friction opposes translational physical motion."
  },
  {
    id: "tcat-eng-217",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "EPILOGUE : NOVEL :: CODA : ?",
    options: ["Musical composition","Dramatic monologue","Legal statute","Architectural colonnade"],
    correct: 0,
    explain: "An epilogue is a concluding section that rounds out a literary novel; a coda is a concluding musical passage that resolves a composition."
  },
  {
    id: "tcat-eng-218",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "OSMOSIS : CONCENTRATION GRADIENT :: CURRENT : ?",
    options: ["Potential difference (Voltage)","Capacitance","Inductance","Frequency"],
    correct: 0,
    explain: "Osmotic solvent movement is driven down a chemical concentration gradient; electric current flow is driven by an electric potential difference (voltage gradient)."
  },
  {
    id: "tcat-eng-219",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "MUTATION : GENOME :: ERRATUM : ?",
    options: ["Book","Painting","Algorithm","Laboratory"],
    correct: 0,
    explain: "A mutation is an error or variation in a biological genome; an erratum is an error or misprint in a printed book."
  },
  {
    id: "tcat-eng-220",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "FRACTURE : BONE :: FISSURE : ?",
    options: ["Rock","Muscle","Cartilage","Liquid"],
    correct: 0,
    explain: "A fracture is a crack or structural break in a bone; a fissure is a crack or narrow split in a geological rock mass."
  },
  {
    id: "tcat-eng-221",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "SYLLOGISM : LOGIC :: EXPERIMENT : ?",
    options: ["Empiricism","Dogmatism","Metaphysics","Axiomatics"],
    correct: 0,
    explain: "A syllogism is the fundamental deductive structure of formal logic; an experiment is the fundamental operational instrument of scientific empiricism."
  },
  {
    id: "tcat-eng-222",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "PROLEGOMENON : TREATISE :: PREAMBLE : ?",
    options: ["Constitution","Litigation","Indictment","Affidavit"],
    correct: 0,
    explain: "A prolegomenon is a formal introductory discourse preceding a scholarly treatise; a preamble is an introductory statement declaring the intent and values of a constitution."
  },
  {
    id: "tcat-eng-223",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "APOCRYPHAL : CANONICITY :: SPURIOUS : ?",
    options: ["Authenticity","Preponderance","Equanimity","Opacity"],
    correct: 0,
    explain: "\"Apocryphal\" denotes lacking religious canonicity or verified authority; \"spurious\" denotes lacking genuine authenticity or validity."
  },
  {
    id: "tcat-eng-224",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "QUINTESSENTIAL : EMBODIMENT :: PARADIGMATIC : ?",
    options: ["Exemplar","Anomaly","Fallacy","Periphery"],
    correct: 0,
    explain: "\"Quintessential\" describes the purest embodiment of a quality; \"paradigmatic\" describes serving as a quintessential model or exemplar."
  },
  {
    id: "tcat-eng-225",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "HEURISTIC : DISCOVERY :: ALGORITHM : ?",
    options: ["Deterministic computation","Serendipitous accident","Philosophical conjecture","Ambiguous conjecture"],
    correct: 0,
    explain: "A heuristic is an exploratory practical method guiding open discovery; an algorithm is a rigorous, finite step-by-step rule ensuring deterministic computation."
  },
  {
    id: "tcat-eng-226",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Select the correct form of the verb: \"Neither the professor nor the students ______ able to solve the anomalous equation.\"",
    options: ["were","was","is","are being"],
    correct: 0,
    explain: "When compound subjects are joined by \"neither... nor\", the verb agrees with the closer subject (\"students\", which is plural, hence \"were\")."
  },
  {
    id: "tcat-eng-227",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Identify the part of speech of the word \"swiftly\" in: \"The mercury in the thermometer dropped swiftly after sunset.\"",
    options: ["Adverb","Adjective","Preposition","Conjunction"],
    correct: 0,
    explain: "\"Swiftly\" modifies the verb \"dropped\", indicating manner, making it an adverb."
  },
  {
    id: "tcat-eng-228",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Fill in the blank with the appropriate preposition: \"The research team congratulated him ______ his remarkable discovery in quantum cryptography.\"",
    options: ["on","for","about","at"],
    correct: 0,
    explain: "The verb \"congratulate\" idiomatically takes the preposition \"on\" (congratulate someone on something)."
  },
  {
    id: "tcat-eng-229",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Choose the sentence that correctly utilizes an apostrophe for plural possession:",
    options: ["The engineers' blueprints were submitted before the regulatory deadline.","The engineer's blueprints were submitted by all six departments.","The engineers blueprint's were submitted yesterday.","The engineer's were submitting blueprints."],
    correct: 0,
    explain: "For regular plural nouns ending in \"s\", plural possession is shown by adding an apostrophe after the \"s\" (engineers')."
  },
  {
    id: "tcat-eng-230",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Select the correct pronoun: \"Between you and ______, the experimental results contradict the initial hypothesis.\"",
    options: ["me","I","myself","mine"],
    correct: 0,
    explain: "\"Between\" is a preposition requiring objective case pronouns (\"you and me\", not \"you and I\")."
  },
  {
    id: "tcat-eng-231",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Identify the grammatical mood used in: \"If the algorithm were more efficient, runtime would decrease by an order of magnitude.\"",
    options: ["Subjunctive mood","Indicative mood","Imperative mood","Passive mood"],
    correct: 0,
    explain: "\"Were\" expresses a hypothetical, counterfactual condition contrary to fact, which is the past subjunctive mood."
  },
  {
    id: "tcat-eng-232",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Convert to indirect speech: The researcher said, \"Did you calibrate the spectrophotometer this morning?\"",
    options: ["The researcher asked if I had calibrated the spectrophotometer that morning.","The researcher asked if I calibrated the spectrophotometer this morning.","The researcher asked that whether I have calibrated the spectrophotometer that morning.","The researcher asked if had I calibrated the spectrophotometer that morning."],
    correct: 0,
    explain: "In reporting past simple questions, the tense shifts back to past perfect (\"had calibrated\"), \"this morning\" becomes \"that morning\", and word order becomes affirmative."
  },
  {
    id: "tcat-eng-233",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Which sentence correctly demonstrates the use of a relative restrictive clause?",
    options: ["The catalyst that was synthesized in our laboratory accelerated the reaction rate threefold.","The catalyst, that was synthesized in our laboratory, accelerated the reaction rate threefold.","The catalyst which synthesized in our laboratory accelerating the reaction rate threefold.","The catalyst, which was synthesized in our laboratory accelerated the reaction rate threefold."],
    correct: 0,
    explain: "Restrictive relative clauses use \"that\" without surrounding commas to identify specifically which catalyst is meant."
  },
  {
    id: "tcat-eng-234",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Choose the correct form to complete the sentence: \"Hardly ______ the data analysis when a sudden power surge rebooted the central mainframe.\"",
    options: ["had the analysts initiated","the analysts initiated","have the analysts initiated","did the analysts had initiated"],
    correct: 0,
    explain: "Negative adverbs like \"hardly\", \"scarcely\", or \"seldom\" at the start of a clause trigger subject-auxiliary inversion (\"Hardly had the analysts initiated... when...\")."
  },
  {
    id: "tcat-eng-235",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Identify the function of the underlined gerund phrase: \"<u>Optimizing matrix multiplication routines</u> required specialized GPU hardware.\"",
    options: ["Subject of the sentence","Direct object of the verb","Subject complement","Object of a preposition"],
    correct: 0,
    explain: "The gerund phrase \"Optimizing matrix multiplication routines\" serves as the grammatical subject of the main verb \"required\"."
  },
  {
    id: "tcat-eng-236",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "In formal syntax, which sentence correctly demonstrates the present subjunctive mandatory construction following a verb of demand?",
    options: ["The committee insisted that the chief architect submit the audited safety schematics immediately.","The committee insisted that the chief architect submits the audited safety schematics immediately.","The committee insisted that the chief architect will submit the audited safety schematics immediately.","The committee insisted that the chief architect should have submitted the audited safety schematics immediately."],
    correct: 0,
    explain: "Verbs of demand or requirement (insist, demand, recommend) take a mandative subjunctive clause with the base form of the verb (\"submit\", not \"submits\")."
  },
  {
    id: "tcat-eng-237",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Identify the structural type of the following sentence: \"Although the numerical simulation converged rapidly, anomalies emerged in the boundary layer calculations, so the aerospace team recalibrated the mesh.\"",
    options: ["Compound-complex sentence","Complex sentence","Compound sentence","Periodic simple sentence"],
    correct: 0,
    explain: "It contains one dependent clause (\"Although the numerical simulation converged rapidly\") and two independent clauses joined by coordinating conjunction \"so\", qualifying as compound-complex."
  },
  {
    id: "tcat-eng-238",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Which sentence correctly adheres to the syntactic rule of maintaining parallel structure with correlative conjunctions (\"not only... but also\")?",
    options: ["The proposed framework not only minimizes latency across nodes but also maximizes network throughput.","The proposed framework not only minimizes latency across nodes but throughput is also maximized.","The proposed framework minimizes not only latency across nodes but also maximizing network throughput.","Not only the proposed framework minimizes latency across nodes but also it maximizes throughput."],
    correct: 0,
    explain: "Both elements following \"not only\" and \"but also\" must be grammatically parallel: verb phrase (\"minimizes...\") followed by verb phrase (\"maximizes...\")."
  },
  {
    id: "tcat-eng-239",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Identify the error in tense sequence: \"Had Newton not formulated the laws of classical mechanics, subsequent astrophysicists ______ unable to compute planetary trajectories accurately.\"",
    options: ["would have been","will have been","had been","would be being"],
    correct: 0,
    explain: "In a third (past counterfactual) conditional (\"Had Newton not formulated...\"), the apodosis (result clause) requires \"would have + past participle\" (\"would have been\")."
  },
  {
    id: "tcat-eng-240",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Which of the following contains an absolute construction (nominative absolute)?",
    options: ["The thermal limits having been breached, the containment system automatically shut down the reactor.","Having breached the thermal limits, the automated system shut down the reactor.","Breaching thermal limits is dangerous for the nuclear reactor core.","The containment system shut down after breaching the thermal limits."],
    correct: 0,
    explain: "An absolute phrase consists of a noun (\"thermal limits\") and a participle (\"having been breached\") with no grammatical connection to the main clause, modifying the whole sentence."
  },
  {
    id: "tcat-eng-241",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the word closest in meaning (SYNONYM) to \"RIGID\":",
    options: ["Inflexible","Supple","Volatile","Porous"],
    correct: 0,
    explain: "\"Rigid\" means unable to be bent or not flexible; its direct synonym is \"inflexible\"."
  },
  {
    id: "tcat-eng-242",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the word most nearly OPPOSITE in meaning (ANTONYM) to \"CONVERGE\":",
    options: ["Diverge","Merge","Intersect","Concur"],
    correct: 0,
    explain: "\"Converge\" means to tend to meet at a point; its exact opposite is \"diverge\" (to move apart in different directions)."
  },
  {
    id: "tcat-eng-243",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the word closest in meaning (SYNONYM) to \"LUCID\":",
    options: ["Clear","Murky","Ambiguous","Tedious"],
    correct: 0,
    explain: "\"Lucid\" describes writing, thought, or perception that is expressed clearly and easy to understand."
  },
  {
    id: "tcat-eng-244",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the word most nearly OPPOSITE in meaning (ANTONYM) to \"PERPETUAL\":",
    options: ["Transitory","Incessant","Endless","Continuous"],
    correct: 0,
    explain: "\"Perpetual\" means never ending or changing; \"transitory\" means brief or lasting for only a short time."
  },
  {
    id: "tcat-eng-245",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the word closest in meaning (SYNONYM) to \"AMPLIFY\":",
    options: ["Magnify","Abbreviate","Subdue","Compress"],
    correct: 0,
    explain: "\"Amplify\" means to increase the volume, scope, or intensity of something; its synonym is \"magnify\"."
  },
  {
    id: "tcat-eng-246",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the word closest in meaning (SYNONYM) to \"PERFUNCTORY\":",
    options: ["Cursory and mechanical","Meticulous and thorough","Passionate and fervent","Aggressive and hostile"],
    correct: 0,
    explain: "\"Perfunctory\" denotes an action carried out with minimal effort, reflection, or interest; synonymous with cursory."
  },
  {
    id: "tcat-eng-247",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the word most nearly OPPOSITE in meaning (ANTONYM) to \"EPHEMERAL\":",
    options: ["Enduring","Transient","Fleeting","Evanescent"],
    correct: 0,
    explain: "\"Ephemeral\" means lasting for a very short time. Its direct antonym is \"enduring\" (permanent or long-lasting)."
  },
  {
    id: "tcat-eng-248",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the word closest in meaning (SYNONYM) to \"INEFFABLE\":",
    options: ["Indescribable","Incomprehensible","Flawed","Perceptible"],
    correct: 0,
    explain: "\"Ineffable\" means too great or extreme to be expressed or described in words; inexpressible or indescribable."
  },
  {
    id: "tcat-eng-249",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the word most nearly OPPOSITE in meaning (ANTONYM) to \"ZEALOUS\":",
    options: ["Apathetic","Ardent","Passionate","Militant"],
    correct: 0,
    explain: "\"Zealous\" means having or showing strong, energetic fervor; its antonym is \"apathetic\" (showing or feeling no enthusiasm or concern)."
  },
  {
    id: "tcat-eng-250",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the word closest in meaning (SYNONYM) to \"TACITURN\":",
    options: ["Reticent","Loquacious","Garrulous","Gregarious"],
    correct: 0,
    explain: "\"Taciturn\" refers to a person reserved or uncommunicative in speech; synonymous with \"reticent\"."
  },
  {
    id: "tcat-eng-251",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the word closest in meaning (SYNONYM) to \"OBDURATE\":",
    options: ["Intransigent","Malleable","Compliant","Tractable"],
    correct: 0,
    explain: "\"Obdurate\" describes someone stubbornly refusing to change their opinion or course of action; \"intransigent\" is its precise synonym."
  },
  {
    id: "tcat-eng-252",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the word most nearly OPPOSITE in meaning (ANTONYM) to \"ESOTERIC\":",
    options: ["Exoteric","Arcane","Abstruse","Recondite"],
    correct: 0,
    explain: "\"Esoteric\" refers to knowledge intended for or likely to be understood by only a specialized few; its formal opposite is \"exoteric\" (suitable for or communicated to the general public)."
  },
  {
    id: "tcat-eng-253",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the word closest in meaning (SYNONYM) to \"PUSILLANIMOUS\":",
    options: ["Craven","Audacious","Dauntless","Intrepid"],
    correct: 0,
    explain: "\"Pusillanimous\" means showing a lack of courage or resolution; timid. \"Craven\" is an exact synonym."
  },
  {
    id: "tcat-eng-254",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the word most nearly OPPOSITE in meaning (ANTONYM) to \"SYCOPHANTIC\":",
    options: ["Unyieldingly candid","Obsequious","Fawning","Toadying"],
    correct: 0,
    explain: "\"Sycophantic\" describes behaving in an obsequious way in order to gain advantage; its antonym is being \"unyieldingly candid\" or frank."
  },
  {
    id: "tcat-eng-255",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the word closest in meaning (SYNONYM) to \"PELLUCID\":",
    options: ["Translucently limpid and clear","Opaque and dense","Nebulous and vague","Turbid and agitated"],
    correct: 0,
    explain: "\"Pellucid\" means translucently clear in surface or easily understood in meaning and style; synonymous with limpid and transparent."
  },
  {
    id: "tcat-eng-256",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Choose the grammatically correct version of the sentence:",
    options: ["Each of the experimental trials yields consistent numerical data.","Each of the experimental trials yield consistent numerical data.","Each of the experimental trial yielding consistent numerical data.","Each of the experimental trials are yielding consistent numerical data."],
    correct: 0,
    explain: "\"Each\" is an indefinite singular pronoun requiring the singular verb \"yields\"."
  },
  {
    id: "tcat-eng-257",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Correct the error in comparison: \"The computational power of modern GPUs is much higher than CPUs.\"",
    options: ["The computational power of modern GPUs is much higher than that of CPUs.","The computational power of modern GPUs is much higher then CPUs.","The computational power of modern GPUs are much higher than CPUs.","The computational power of modern GPUs is more higher than CPUs."],
    correct: 0,
    explain: "To prevent an illogical comparison between \"computational power\" and \"CPUs\", the demonstrative pronoun \"that of\" must be inserted."
  },
  {
    id: "tcat-eng-258",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Select the sentence with proper punctuation:",
    options: ["The laboratory was stocked with beakers, pipettes, and burettes; however, the autoclave was malfunctioning.","The laboratory was stocked with beakers, pipettes, and burettes, however the autoclave was malfunctioning.","The laboratory was stocked with beakers, pipettes and burettes however, the autoclave was malfunctioning.","The laboratory was stocked with beakers pipettes and burettes; however the autoclave was malfunctioning."],
    correct: 0,
    explain: "Two independent clauses joined by the conjunctive adverb \"however\" require a semicolon before \"however\" and a comma after it."
  },
  {
    id: "tcat-eng-259",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Correct the pronoun agreement: \"Every researcher must submit their preliminary abstract by Friday.\"",
    options: ["Every researcher must submit his or her preliminary abstract by Friday.","Every researcher must submit their own preliminary abstracts by Friday.","Every researchers must submit his preliminary abstract by Friday.","Every researcher must submit them preliminary abstract by Friday."],
    correct: 0,
    explain: "In formal traditional grammar, \"Every researcher\" is singular and takes the singular pronoun phrase \"his or her\"."
  },
  {
    id: "tcat-eng-260",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Choose the sentence that corrects the double negative:",
    options: ["The sensors could scarcely register any ambient vibrations.","The sensors couldn't scarcely register any ambient vibrations.","The sensors couldn't register no ambient vibrations.","The sensors couldn't scarcely register no ambient vibrations."],
    correct: 0,
    explain: "\"Scarcely\" is already negative; combining it with \"could not\" or \"no\" forms an ungrammatical double negative."
  },
  {
    id: "tcat-eng-261",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Identify the sentence that resolves the dangling modifier: \"Running the simulation at peak load, the CPU overheated immediately.\"",
    options: ["When the engineer ran the simulation at peak load, the CPU overheated immediately.","Running the simulation at peak load, immediate overheating of the CPU occurred.","Running the simulation at peak load, overheating occurred in the CPU.","The CPU running the simulation at peak load overheated immediately."],
    correct: 0,
    explain: "The original sentence implies the CPU was \"running the simulation\". Adding the logical subject (\"When the engineer ran...\") eliminates the dangling modifier."
  },
  {
    id: "tcat-eng-262",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Choose the sentence that eliminates the misplaced modifier:",
    options: ["The technician examined the telescope with a defective optical lens.","With a defective optical lens, the technician examined the telescope.","The technician examined with a defective optical lens the telescope.","The telescope was examined by the technician who had a defective optical lens."],
    correct: 0,
    explain: "The prepositional phrase \"with a defective optical lens\" must directly follow the noun it modifies (\"the telescope\"), not the technician."
  },
  {
    id: "tcat-eng-263",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Correct the faulty parallelism: \"The software engineer is responsible for writing modular code, testing unit cases, and to deploy releases.\"",
    options: ["The software engineer is responsible for writing modular code, testing unit cases, and deploying releases.","The software engineer is responsible to write modular code, testing unit cases, and deploying releases.","The software engineer is responsible for writing modular code, to test unit cases, and deploying releases.","The software engineer is responsible for write modular code, test unit cases, and deploy releases."],
    correct: 0,
    explain: "All items in the series must match in grammatical form: gerunds (\"writing...\", \"testing...\", \"deploying...\")."
  },
  {
    id: "tcat-eng-264",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Identify the correct revision to eliminate wordiness and redundancy: \"The reason why the experiment failed was because of the fact that the reagents were expired.\"",
    options: ["The experiment failed because the reagents were expired.","The reason the experiment failed was on account of the fact that the reagents were expired.","The experiment failed due to the reason that the reagents were expired.","Owing to the fact that reagents were expired was why the experiment failed."],
    correct: 0,
    explain: "\"The reason why... was because of the fact that\" is verbose and redundant; \"The experiment failed because...\" is concise and idiomatic."
  },
  {
    id: "tcat-eng-265",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Correct the error in subject-verb agreement: \"A battery of spectrophotometric tests have demonstrated the compound's purity.\"",
    options: ["A battery of spectrophotometric tests has demonstrated the compound's purity.","A battery of spectrophotometric tests are demonstrating the compound's purity.","A battery of spectrophotometric tests were demonstrated the compound's purity.","A battery of spectrophotometric tests have been demonstrated the compound's purity."],
    correct: 0,
    explain: "The head noun of the subject is the singular collective noun \"battery\", which requires the singular verb \"has demonstrated\"."
  },
  {
    id: "tcat-eng-266",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Which version correctly fixes the comma splice: \"The semiconductor showed superconducting properties below 4 Kelvin, the findings were published in Nature.\"",
    options: ["The semiconductor showed superconducting properties below 4 Kelvin; consequently, the findings were published in Nature.","The semiconductor showed superconducting properties below 4 Kelvin, consequently, the findings were published in Nature.","The semiconductor showed superconducting properties below 4 Kelvin, and which findings were published in Nature.","The semiconductor showed superconducting properties below 4 Kelvin findings being published in Nature."],
    correct: 0,
    explain: "Joining two independent clauses with only a comma creates a comma splice. A semicolon followed by a conjunctive adverb and comma properly separates them."
  },
  {
    id: "tcat-eng-267",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the grammatically impeccable sentence involving subjunctive inversion:",
    options: ["Should any telemetry anomaly occur during the orbital burn, the guidance computer will abort the maneuver.","Should any telemetry anomaly occurs during the orbital burn, the guidance computer will abort the maneuver.","Should any telemetry anomaly will occur during the orbital burn, the guidance computer will abort the maneuver.","If any telemetry anomaly should occurred during the orbital burn, the guidance computer will abort the maneuver."],
    correct: 0,
    explain: "Inverted first conditional (\"Should + subject + bare infinitive\") correctly uses \"occur\" (bare infinitive) without third-person \"-s\"."
  },
  {
    id: "tcat-eng-268",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Choose the sentence that correctly employs the subjunctive verb form after \"it is imperative\":",
    options: ["It is imperative that every cryogenic tank be inspected for microscopic fractures before fueling.","It is imperative that every cryogenic tank is inspected for microscopic fractures before fueling.","It is imperative that every cryogenic tank will be inspected for microscopic fractures before fueling.","It is imperative that every cryogenic tank must be inspected for microscopic fractures before fueling."],
    correct: 0,
    explain: "Adjectives expressing necessity or urgency (imperative, crucial, vital) take a \"that\"-clause with the base subjunctive form (\"be inspected\")."
  },
  {
    id: "tcat-eng-269",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the sentence that correctly handles squinting modifiers: \"Developing models frequently exposes overlooked edge cases.\"",
    options: ["Frequently developing models exposes overlooked edge cases.","Developing models exposes overlooked edge cases frequently.","Developing models, that are done frequently, exposes overlooked edge cases.","Both A and B resolve the ambiguity depending on whether the frequency applies to development or exposure."],
    correct: 3,
    explain: "In \"Developing models frequently exposes...\", \"frequently\" could modify \"developing\" or \"exposes\". Moving \"frequently\" before \"developing\" (A) or to the end (B) resolves the squinting ambiguity."
  },
  {
    id: "tcat-eng-270",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Which sentence correctly maintains idiom and case with the gerund phrase: \"We objected to him/his using uncalibrated instruments\"?",
    options: ["We objected to his using uncalibrated instruments during the trial.","We objected to him using uncalibrated instruments during the trial.","We objected to he using uncalibrated instruments during the trial.","We objected to himself using uncalibrated instruments during the trial."],
    correct: 0,
    explain: "In formal standard English, a noun or pronoun preceding a gerund (\"using\") must be in the possessive case (\"his using\")."
  },
  {
    id: "tcat-eng-271",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the statement: \"Solar photovoltaic panels convert photons directly into electricity via the photoelectric effect, requiring neither moving mechanical components nor ongoing fuel combustion.\" What is an inherent mechanical characteristic of photovoltaic panels?",
    options: ["They contain no moving mechanical parts","They require continuous steam turbines","They generate electricity via internal combustion","They emit sulfur dioxide during operation"],
    correct: 0,
    explain: "The passage explicitly notes that solar panels require \"neither moving mechanical components nor ongoing fuel combustion\"."
  },
  {
    id: "tcat-eng-272",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the excerpt: \"The James Webb Space Telescope operates at the second Lagrange point (L2), approximately 1.5 million kilometers from Earth, shielded from solar irradiance by a five-layer sunshield.\" Where is the telescope situated relative to Earth?",
    options: ["At Lagrange point 2, about 1.5 million kilometers away","In low Earth orbit, 400 kilometers away","In geosynchronous orbit, 36,000 kilometers away","On the lunar surface"],
    correct: 0,
    explain: "The passage directly states that it operates at the second Lagrange point (L2), ~1.5 million kilometers from Earth."
  },
  {
    id: "tcat-eng-273",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the sentence: \"Bacterial resistance to antibiotics escalates primarily when treatments are prematurely discontinued, allowing marginally resistant microbes to survive and proliferate.\" What facilitates the emergence of resistant bacteria according to the text?",
    options: ["Premature cessation of prescribed antibiotic regimens","Overheating antibiotic storage vials","Using sterile syringes in clinics","Drinking purified filtered water"],
    correct: 0,
    explain: "The passage clearly attributes the escalation to treatments being \"prematurely discontinued\"."
  },
  {
    id: "tcat-eng-274",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the sentence: \"Deep learning models have achieved human parity in image recognition, yet they remain vulnerable to adversarial perturbations that are entirely imperceptible to the human eye.\" What vulnerability do deep learning models exhibit?",
    options: ["Susceptibility to imperceptible adversarial perturbations","Inability to process images with high resolution","Rapid degradation under direct sunlight","Complete inability to identify geometric shapes"],
    correct: 0,
    explain: "The text highlights that models \"remain vulnerable to adversarial perturbations that are entirely imperceptible to the human eye\"."
  },
  {
    id: "tcat-eng-275",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Read the excerpt: \"The synthesis of ammonia via the Haber-Bosch process consumes roughly 1-2% of global energy output, serving as the foundational chemical bedrock for synthetic nitrogenous agricultural fertilizers.\" What is the primary end-use of the synthesized ammonia?",
    options: ["Synthetic nitrogenous agricultural fertilizers","Automobile combustion fuel additives","Household refrigeration coolants","Aero-engine titanium alloys"],
    correct: 0,
    explain: "The passage explicitly states ammonia serves as the \"foundational chemical bedrock for synthetic nitrogenous agricultural fertilizers\"."
  },
  {
    id: "tcat-eng-276",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Read the passage: \"While classical computers store and process discrete binary bits constrained to either zero or one, quantum computers leverage coherent superpositions of basis states. This allows a quantum register of n qubits to simultaneously represent 2^n states, conferring super-polynomial speedups for specialized problems like integer factorization.\" What fundamental property enables quantum parallelism?",
    options: ["Coherent superposition allowing n qubits to simultaneously represent 2^n states","Faster clock frequencies exceeding 100 GHz","Elimination of all thermal dissipation","Use of binary logic gates in room-temperature silicon"],
    correct: 0,
    explain: "The passage directly attributes quantum computing's simultaneous state representation to \"coherent superpositions of basis states\"."
  },
  {
    id: "tcat-eng-277",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Based on the passage above, what can be inferred about the computational efficiency of quantum computers for general-purpose computing?",
    options: ["Their super-polynomial advantage is tailored to specialized problems rather than general everyday computation","They will replace all personal computer CPUs immediately","They process word documents and spreadsheets with 2^n times lower power","They do not require any input-output peripherals"],
    correct: 0,
    explain: "The passage specifies that quantum speedup is for \"specialized problems like integer factorization\", implying it is not universally applicable to all computing tasks."
  },
  {
    id: "tcat-eng-278",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Read the excerpt: \"Graphene, a single-atom-thick hexagonal honeycomb lattice of sp2-hybridized carbon atoms, exhibits an extraordinary tensile strength of 130 GPa alongside ballistic electron transport. However, the absence of an intrinsic electronic bandgap severely impedes its direct application in field-effect logic transistors.\" What physical characteristic hinders graphene's deployment in digital logic?",
    options: ["The absence of an intrinsic electronic bandgap","Low mechanical tensile strength","Slow electron mobility at ambient temperatures","Incompatibility with carbon lattices"],
    correct: 0,
    explain: "The author notes: \"the absence of an intrinsic electronic bandgap severely impedes its direct application in field-effect logic transistors\"."
  },
  {
    id: "tcat-eng-279",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "What is the tone of the author in the graphene passage above?",
    options: ["Objective and balanced","Cynical and dismissive","Unreservedly hyperbolic","Nostalgic and emotional"],
    correct: 0,
    explain: "The author praises graphene's remarkable virtues (tensile strength, mobility) while objectively pointing out its scientific limitation (lack of bandgap)."
  },
  {
    id: "tcat-eng-280",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Read the excerpt: \"Thermonuclear fusion offers the tantalizing prospect of baseload clean energy with zero carbon emissions and minimal long-lived radiological waste. Yet, confining a plasma heated to over 100 million degrees Celsius within magnetic magnetic bottles (tokamaks) demands overcoming catastrophic magnetohydrodynamic instabilities.\" What represents the chief engineering barrier to magnetic confinement fusion according to the text?",
    options: ["Magnetohydrodynamic plasma instabilities at extreme temperatures","Excessive emission of carbon dioxide gas","Shortage of seawater isotopes","Lack of theoretical mathematical models"],
    correct: 0,
    explain: "The excerpt explicitly names \"overcoming catastrophic magnetohydrodynamic instabilities\" at 100 million degrees as the challenge."
  },
  {
    id: "tcat-eng-281",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Read the passage: \"Karl Popper's demarcation criterion posits that for an empirical hypothesis to be rigorously scientific, it must be inherently falsifiable—capable of being decisively refuted by empirical observation. Pseudosciences, by contrast, immunize themselves against disconfirmation through ad hoc rationalizations that assimilate all conceivable experimental outcomes.\" According to Popperian epistemology, what renders a theory unscientific?",
    options: ["Its ability to accommodate any conceivable outcome via post hoc rationalization, avoiding refutability","Its reliance on quantitative mathematical formulation","Its publication in peer-reviewed conference proceedings","Its failure to be definitively verified by repeated observations"],
    correct: 0,
    explain: "Popper argued that theories that immunize themselves through ad hoc rationalizations to assimilate all outcomes lack falsifiability and are therefore unscientific."
  },
  {
    id: "tcat-eng-282",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "From the Popperian passage above, what can be logically deduced about the role of experimental disconfirmation in scientific progress?",
    options: ["A theory must be vulnerable to potential empirical disproof to hold genuine explanatory scientific validity","Observations are secondary to mathematical symmetry","A hypothesis cannot be considered valid unless all alternative theories are disproven simultaneously","Falsification proves that empirical sciences are fundamentally untruthful"],
    correct: 0,
    explain: "Under Popper's falsificationism, scientific validity requires that hypotheses must be empirically testable and potentially refutable."
  },
  {
    id: "tcat-eng-283",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Read the excerpt: \"The Jevons Paradox asserts that an increase in technological efficiency with which a resource is utilized tends to increase, rather than decrease, the overall rate of consumption of that resource. As energy efficiency lowers the effective price of energy services, real income expands and economic activity rebounds, eclipsing the per-unit savings.\" What counter-intuitive economic dynamic does the Jevons Paradox describe?",
    options: ["Efficiency gains lower marginal costs and drive rebound effects that amplify total resource consumption","Technological innovation inevitably depletes intellectual capital","Energy conservation policies cause immediate deflation in consumer goods","Resource scarcity induces linear decreases in industrial output"],
    correct: 0,
    explain: "The paradox highlights that heightened efficiency reduces unit cost, stimulating expanded economic demand that counteracts and eclipses initial savings."
  },
  {
    id: "tcat-eng-284",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Which term best summarizes the author's thesis in the Jevons Paradox text regarding energy conservation through pure efficiency gains?",
    options: ["Rebound effect leading to increased total consumption","Unconditional environmental preservation","Perpetual economic stagnation","Technological obsolescence"],
    correct: 0,
    explain: "The author explains the \"rebound effect\" where efficiency leads to lower unit cost and an eventual net surge in total resource consumption."
  },
  {
    id: "tcat-eng-285",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Read the excerpt: \"Thomas Kuhn asserted that normal science operates within an entrenched paradigm until anomalous empirical observations accumulate to an untenable threshold. When crisis ensues, a revolutionary paradigm shift reconfigures the foundational conceptual matrix of the scientific community.\" What triggers a Kuhn paradigm shift?",
    options: ["An accumulation of unexplained empirical anomalies exceeding the explanatory capacity of the existing paradigm","A consensus vote conducted by international scientific academies","The gradual decay of laboratory infrastructure over centuries","Governmental legislation mandating alternative research methodologies"],
    correct: 0,
    explain: "Kuhn posits that paradigm shifts occur when anomalies accumulate to an untenable threshold, precipitating a crisis in the prevailing paradigm."
  },
  {
    id: "tcat-eng-286",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "MICROSCOPE : MAGNIFY ::",
    options: ["Telescope : Observe","Thermometer : Heat","Barometer : Compress","Compass : Speed"],
    correct: 0,
    explain: "A microscope is an instrument whose primary function is to magnify; similarly, a telescope is an instrument designed to observe distant objects."
  },
  {
    id: "tcat-eng-287",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "VOLT : POTENTIAL ::",
    options: ["Ampere : Current","Joule : Temperature","Ohm : Capacitance","Watt : Resistance"],
    correct: 0,
    explain: "Volt is the SI unit of electric potential; Ampere is the SI unit of electric current."
  },
  {
    id: "tcat-eng-288",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "CATALYST : REACTION ::",
    options: ["Incentive : Productivity","Brake : Velocity","Obstacle : Speed","Rust : Metal"],
    correct: 0,
    explain: "A catalyst accelerates or facilitates a chemical reaction; an incentive accelerates or promotes human productivity."
  },
  {
    id: "tcat-eng-289",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "ARCHITECT : BLUEPRINT ::",
    options: ["Programmer : Source code","Surgeon : Scalpel","Painter : Canvas","Author : Library"],
    correct: 0,
    explain: "An architect designs and produces a blueprint as their primary specification plan; a programmer writes source code as their software blueprint."
  },
  {
    id: "tcat-eng-290",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "CHLOROPHYLL : PHOTOSYNTHESIS ::",
    options: ["Hemoglobin : Respiration","Stomata : Transpiration","Mitochondria : Digestion","Enzyme : Inhibition"],
    correct: 0,
    explain: "Chlorophyll is the pigment essential for absorbing light in photosynthesis; hemoglobin is the pigment essential for oxygen transport in respiration."
  },
  {
    id: "tcat-eng-291",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "SEISMOGRAPH : EARTHQUAKE ::",
    options: ["Galvanometer : Current","Anemometer : Humidity","Spectrometer : Mass","Altimeter : Volume"],
    correct: 0,
    explain: "A seismograph detects and measures seismic tremors of an earthquake; a galvanometer detects and measures electric current."
  },
  {
    id: "tcat-eng-292",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "ENTROPY : DISORDER ::",
    options: ["Enthalpy : Heat content","Inertia : Acceleration","Momentum : Rest","Viscosity : Fluidity"],
    correct: 0,
    explain: "Entropy is a thermodynamic state function quantifying disorder; enthalpy is a state function measuring total heat content."
  },
  {
    id: "tcat-eng-293",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "AORTA : ARTERY ::",
    options: ["Femur : Bone","Nephron : Kidney","Synapse : Neuron","Plasma : Platelet"],
    correct: 0,
    explain: "The aorta is the primary and largest example of an artery (part-to-class/type relation); the femur is an exemplary long bone."
  },
  {
    id: "tcat-eng-294",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "PRISM : REFRACTION ::",
    options: ["Mirror : Reflection","Lens : Dispersion","Diffraction : Grating","Laser : Diffusion"],
    correct: 0,
    explain: "A prism operates primarily through refraction; a mirror operates primarily through reflection."
  },
  {
    id: "tcat-eng-295",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "FRICTION : MOTION ::",
    options: ["Impedance : Current","Lubricant : Abrasion","Gravity : Mass","Acceleration : Velocity"],
    correct: 0,
    explain: "Friction opposes physical mechanical motion; electrical impedance opposes alternating current flow."
  },
  {
    id: "tcat-eng-296",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "INDURATE : HARDEN ::",
    options: ["Attenuate : Weaken","Aggravate : Soothe","Ameliorate : Worsen","Truncate : Extend"],
    correct: 0,
    explain: "\"Indurate\" means to make or grow hard; \"attenuate\" means to reduce the force, effect, or value of (weaken). They are synonymous verb pairs."
  },
  {
    id: "tcat-eng-297",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "ANACHRONISM : TIME ::",
    options: ["Incongruity : Context","Fallacy : Logic","Redundancy : Clarity","Paradox : Consistency"],
    correct: 0,
    explain: "An anachronism is a chronological inconsistency or misplacement in time; an incongruity is an inappropriate or mismatched placement within an environmental context."
  },
  {
    id: "tcat-eng-298",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "OSMOSIS : MEMBRANE ::",
    options: ["Filtration : Porous medium","Convection : Vacuum","Radiation : Conductor","Capillarity : Sphere"],
    correct: 0,
    explain: "Osmosis is fluid transport mediated across a semi-permeable membrane; filtration is fluid separation mediated across a porous medium."
  },
  {
    id: "tcat-eng-299",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "ISOMORPHISM : STRUCTURE ::",
    options: ["Homology : Origin","Analogy : Identity","Symmetry : Anomaly","Congruence : Diversity"],
    correct: 0,
    explain: "Isomorphism denotes equivalence or preservation of mathematical structure; homology denotes shared biological ancestry or evolutionary origin."
  },
  {
    id: "tcat-eng-300",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "ENTROPY : REVERSIBILITY ::",
    options: ["Inertia : Acceleration","Mass : Gravitation","Charge : Magnetism","Viscosity : Friction"],
    correct: 0,
    explain: "Greater entropy generation precludes thermodynamic reversibility (inverse relationship); higher inertia impedes acceleration under a given force."
  },
  {
    id: "tcat-eng-301",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Choose the correct preposition: \"The professor insisted _______ adhering strictly to the laboratory safety manual.\"",
    options: [
      "on",
      "in",
      "at",
      "with"
    ],
    correct: 0,
    explain: "The verb \"insist\" idiomatically takes the preposition \"on\" (or \"upon\") followed by a gerund or noun."
  },
  {
    id: "tcat-eng-302",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Identify the part of speech of the capitalized word: \"She spoke QUITE eloquently during the symposium.\"",
    options: [
      "Adverb",
      "Adjective",
      "Conjunction",
      "Preposition"
    ],
    correct: 0,
    explain: "\"Quite\" modifies the adverb \"eloquently\" indicating degree, making it an adverb of degree."
  },
  {
    id: "tcat-eng-303",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Select the sentence containing a demonstrative pronoun:",
    options: [
      "This is the most compelling argument presented today.",
      "This book belongs to the archive.",
      "She solved the problem by herself.",
      "Which topic did you select?"
    ],
    correct: 0,
    explain: "In \"This is the most compelling...\", \"This\" stands alone as the subject of the clause, acting as a demonstrative pronoun."
  },
  {
    id: "tcat-eng-304",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Complete the sentence with the appropriate auxiliary: \"Neither of the candidates _______ willing to compromise on the treaty clauses.\"",
    options: [
      "was",
      "were",
      "have been",
      "are being"
    ],
    correct: 0,
    explain: "\"Neither\" as a singular indefinite pronoun requires a singular verb: \"was\"."
  },
  {
    id: "tcat-eng-305",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Select the sentence that uses the correct past continuous tense:",
    options: [
      "The engineers were evaluating the thermal sensors when the alarm sounded.",
      "The engineers have evaluated the thermal sensors when the alarm sounded.",
      "The engineers evaluated the thermal sensors when the alarm was sounding.",
      "The engineers had evaluate the thermal sensors when the alarm sounded."
    ],
    correct: 0,
    explain: "\"Were evaluating\" correctly represents an ongoing past action interrupted by another event (\"alarm sounded\")."
  },
  {
    id: "tcat-eng-306",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Which conjunction pair correctly completes the correlative construction? \"She had _______ begun her address _______ the microphone malfunctioned.\"",
    options: [
      "hardly ... when",
      "hardly ... than",
      "no sooner ... when",
      "scarcely ... then"
    ],
    correct: 0,
    explain: "\"Hardly\" and \"scarcely\" pair with \"when\", whereas \"no sooner\" pairs with \"than\"."
  },
  {
    id: "tcat-eng-307",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Identify the sentence with the correct reflexive pronoun usage:",
    options: [
      "The delegators introduced themselves to the plenary council.",
      "The delegators introduced theirselves to the plenary council.",
      "The delegators introduced themself to the plenary council.",
      "The delegators introduced theyselves to the plenary council."
    ],
    correct: 0,
    explain: "\"Themselves\" is the standard plural reflexive pronoun for third person plural."
  },
  {
    id: "tcat-eng-308",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Easy",
    q: "Choose the correct comparative adjective form: \"Of the two structural designs, this cantilever beam is far _______.\"",
    options: [
      "sturdier",
      "sturdiest",
      "more sturdier",
      "most sturdy"
    ],
    correct: 0,
    explain: "When comparing exactly two items, the comparative form (\"sturdier\") must be used, not the superlative."
  },
  {
    id: "tcat-eng-309",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Complete with the correct conditional structure: \"If the firmware _______ updated before deployment, the memory corruption would not have occurred.\"",
    options: [
      "had been",
      "was",
      "would have been",
      "has been"
    ],
    correct: 0,
    explain: "Third conditional sentences referring to past unreal conditions require past perfect (\"had been\") in the if-clause."
  },
  {
    id: "tcat-eng-310",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Identify the function of the gerund phrase: \"DESIGNING AERODYNAMIC AIRFOILS requires advanced mathematical modeling.\"",
    options: [
      "Subject of the sentence",
      "Direct object",
      "Predicate nominative",
      "Object of a preposition"
    ],
    correct: 0,
    explain: "The gerund phrase \"Designing aerodynamic airfoils\" performs the role of the grammatical subject governing the verb \"requires\"."
  },
  {
    id: "tcat-eng-311",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Which sentence correctly demonstrates inverted sentence structure following a negative adverbial modifier?",
    options: [
      "Rarely have the researchers observed such anomalies under standard atmospheric conditions.",
      "Rarely the researchers have observed such anomalies under standard atmospheric conditions.",
      "Rarely did the researchers observed such anomalies under standard atmospheric conditions.",
      "Rarely have observed the researchers such anomalies under standard atmospheric conditions."
    ],
    correct: 0,
    explain: "When a negative adverb like \"rarely\" begins a sentence, subject-auxiliary inversion is mandatory: \"Rarely have the researchers observed...\"."
  },
  {
    id: "tcat-eng-312",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Identify the sentence containing an adjective clause (relative clause):",
    options: [
      "The alloy that was forged in the induction furnace resisted extreme shear stress.",
      "The alloy cracked because the cooling rate was excessively steep.",
      "After the technician calibrated the spectrometer, the readings stabilized.",
      "Knowing the precise tolerances was critical for the assembly team."
    ],
    correct: 0,
    explain: "\"That was forged in the induction furnace\" is a restrictive relative clause modifying the noun \"alloy\"."
  },
  {
    id: "tcat-eng-313",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Select the sentence that adheres strictly to the rules of subjunctive mood:",
    options: [
      "The audit committee recommended that the principal investigator submit all receipts by Friday.",
      "The audit committee recommended that the principal investigator submits all receipts by Friday.",
      "The audit committee recommended that the principal investigator must submit all receipts by Friday.",
      "The audit committee recommended that the principal investigator will submit all receipts by Friday."
    ],
    correct: 0,
    explain: "Mandative subjunctive clauses following verbs of recommendation use the base form of the verb (\"submit\") without third-person \"-s\"."
  },
  {
    id: "tcat-eng-314",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Choose the sentence with correct parallel structure across coordinated items:",
    options: [
      "The analyst was responsible for collecting the telemetry, verifying the calibration, and compiling the final report.",
      "The analyst was responsible for collecting the telemetry, to verify the calibration, and compilation of the report.",
      "The analyst was responsible for telemetry collection, verifying the calibration, and to compile the final report.",
      "The analyst was responsible to collect telemetry, verification of calibration, and compiling reports."
    ],
    correct: 0,
    explain: "All three coordinated elements use parallel gerund phrases: \"collecting...\", \"verifying...\", and \"compiling...\"."
  },
  {
    id: "tcat-eng-315",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "What is the grammatical classification of the capitalized phrase? \"THE CONTRACT HAVING BEEN SIGNED, the manufacturing operations commenced immediately.\"",
    options: [
      "Nominative absolute phrase",
      "Participial modifier modifying operations",
      "Gerund phrase as subject",
      "Appositive phrase"
    ],
    correct: 0,
    explain: "\"The contract having been signed\" is a nominative absolute consisting of a noun and participle with no grammatical connection to the main sentence subject."
  },
  {
    id: "tcat-eng-316",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Medium",
    q: "Choose the correct form of the pronoun: \"The committee nominated two representatives, namely, Dr. Tariq and _______.\"",
    options: [
      "me",
      "I",
      "myself",
      "mine"
    ],
    correct: 0,
    explain: "The pronoun is in apposition to the direct object \"representatives\", so the objective case pronoun \"me\" is grammatically required."
  },
  {
    id: "tcat-eng-317",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Which of the following sentences contains an intransitive verb in the main clause?",
    options: [
      "The pressure in the condensation chamber deteriorated rapidly after the valve failed.",
      "The technician calibrated the high-frequency oscilloscope.",
      "The chemical reaction released toxic sulfur dioxide vapors.",
      "The director awarded merit scholarships to top-ranking scholars."
    ],
    correct: 0,
    explain: "\"Deteriorated\" does not take a direct object in this clause, acting as a complete intransitive verb modified by the adverb \"rapidly\"."
  },
  {
    id: "tcat-eng-318",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Select the sentence that avoids a squinting modifier defect:",
    options: [
      "Practicing daily invariably improves a musician's interpretive nuance.",
      "Musicians who practice daily invariably will find their technique improving.",
      "Students who study often perform commendably on standardized tests.",
      "Athletes who train rigorously often enhance their cardiovascular endurance."
    ],
    correct: 0,
    explain: "In option A, the adverb \"invariably\" unequivocally modifies \"improves\", eliminating the two-way ambiguous attachment (\"squinting\") present in the other options."
  },
  {
    id: "tcat-eng-319",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Identify the sentence with an elliptical adverbial clause:",
    options: [
      "While working on the prototype, the lead engineer discovered a harmonic resonance anomaly.",
      "The lead engineer worked on the prototype until the late hours of the night.",
      "Because the prototype was defective, testing was suspended indefinitely.",
      "Although the prototype demonstrated high efficiency, it was excessively costly."
    ],
    correct: 0,
    explain: "\"While [he was] working on the prototype\" is an elliptical clause where the subject and form of the verb \"to be\" are omitted."
  },
  {
    id: "tcat-eng-320",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Identify the sentence demonstrating the correct use of a fused participle correction (possessive preceding a gerund):",
    options: [
      "The committee objected to their publishing the preliminary findings without external peer review.",
      "The committee objected to them publishing the preliminary findings without external peer review.",
      "The committee objected to they publishing the preliminary findings without external peer review.",
      "The committee objected to those publishing the preliminary findings without external peer review."
    ],
    correct: 0,
    explain: "Traditional formal grammar requires the possessive determiner (\"their\") before a gerund (\"publishing\") to avoid a fused participle."
  },
  {
    id: "tcat-eng-321",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Which sentence correctly demonstrates the subjunctive mood expressing a counterfactual condition in the present?",
    options: [
      "If the refractive index were higher, the dispersion angle would widen significantly.",
      "If the refractive index was higher, the dispersion angle would widen significantly.",
      "If the refractive index will be higher, the dispersion angle would widen significantly.",
      "If the refractive index would be higher, the dispersion angle widened significantly."
    ],
    correct: 0,
    explain: "Present unreal/counterfactual conditions require the subjunctive form \"were\" for all persons."
  },
  {
    id: "tcat-eng-322",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Determine the syntactic role of the clause in brackets: \"The hypothesis [that dark matter interacts weakly with baryonic particles] remains unproven.\"",
    options: [
      "Appositive noun clause modifying \"hypothesis\"",
      "Restrictive relative adjective clause modifying \"hypothesis\"",
      "Adverbial clause of condition",
      "Predicate noun clause"
    ],
    correct: 0,
    explain: "The clause explains the actual substance of \"hypothesis\" rather than modifying it via a relative pronoun, making it an appositive noun clause."
  },
  {
    id: "tcat-eng-323",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Which sentence correctly implements the negative inversion with \"not only ... but also\" at clause boundaries?",
    options: [
      "Not only did the thermal insulator withstand extreme heat, but it also prevented catastrophic structural degradation.",
      "Not only the thermal insulator withstood extreme heat, but also it prevented catastrophic structural degradation.",
      "Not only did the thermal insulator withstood extreme heat, but it also prevented catastrophic structural degradation.",
      "Not only had the thermal insulator withstand extreme heat, but also prevented catastrophic structural degradation."
    ],
    correct: 0,
    explain: "Fronting \"Not only\" requires do-support auxiliary inversion (\"did ... withstand\") followed by base verb and coordinated clause with \"but it also\"."
  },
  {
    id: "tcat-eng-324",
    subject: "English",
    topic: "Grammar (tenses, parts of speech, sentence structure)",
    difficulty: "Hard",
    q: "Identify the sentence that correctly employs the future perfect continuous tense:",
    options: [
      "By next October, the team will have been monitoring seismic vibrations for two consecutive decades.",
      "By next October, the team will be monitoring seismic vibrations for two consecutive decades.",
      "By next October, the team will have monitored seismic vibrations for two consecutive decades.",
      "By next October, the team had been monitoring seismic vibrations for two consecutive decades."
    ],
    correct: 0,
    explain: "\"Will have been monitoring\" represents an ongoing action that will continue up to a designated future milestone (\"By next October\")."
  },
  {
    id: "tcat-eng-325",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Select the closest synonym for the word \"PRAGMATIC\":",
    options: [
      "Practical",
      "Idealistic",
      "Theoretical",
      "Reckless"
    ],
    correct: 0,
    explain: "\"Pragmatic\" means dealing with matters sensibly and realistically based on practical considerations."
  },
  {
    id: "tcat-eng-326",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Select the closest antonym for the word \"TRANSIENT\":",
    options: [
      "Permanent",
      "Fleeting",
      "Ephemeral",
      "Nomadic"
    ],
    correct: 0,
    explain: "\"Transient\" describes something lasting only for a short time; its direct opposite is \"permanent\"."
  },
  {
    id: "tcat-eng-327",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the word that best fills the blank: \"The chemist noticed a _______ odor emanating from the synthetic polymer after thermal degradation.\"",
    options: [
      "pungent",
      "lucid",
      "docile",
      "placid"
    ],
    correct: 0,
    explain: "\"Pungent\" means having a sharp, stinging, or biting taste or smell."
  },
  {
    id: "tcat-eng-328",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Select the closest synonym for \"METICULOUS\":",
    options: [
      "Painstaking",
      "Hasty",
      "Careless",
      "Ambiguous"
    ],
    correct: 0,
    explain: "\"Meticulous\" indicates showing extreme care about minute details; \"painstaking\" is a direct synonym."
  },
  {
    id: "tcat-eng-329",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Select the closest antonym for \"CANDID\":",
    options: [
      "Deceitful",
      "Frank",
      "Outspoken",
      "Sincere"
    ],
    correct: 0,
    explain: "\"Candid\" means truthful and straightforward; its direct antonym is \"deceitful\"."
  },
  {
    id: "tcat-eng-330",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Choose the correct meaning of the underlined idiom: \"The breakthrough in room-temperature superconductors happened ONCE IN A BLUE MOON.\"",
    options: [
      "Extremely rarely",
      "Predictably",
      "Every calendar month",
      "During a lunar eclipse"
    ],
    correct: 0,
    explain: "The idiom \"once in a blue moon\" signifies an event that occurs very seldom or rarely."
  },
  {
    id: "tcat-eng-331",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Select the closest synonym for \"UBIQUITOUS\":",
    options: [
      "Omnipresent",
      "Rare",
      "Secluded",
      "Localized"
    ],
    correct: 0,
    explain: "\"Ubiquitous\" means present, appearing, or found everywhere simultaneously; \"omnipresent\" is an exact synonym."
  },
  {
    id: "tcat-eng-332",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Easy",
    q: "Select the closest antonym for \"FERVENT\":",
    options: [
      "Apathetic",
      "Ardent",
      "Enthusiastic",
      "Passionate"
    ],
    correct: 0,
    explain: "\"Fervent\" means having or displaying a passionate intensity; \"apathetic\" means showing no emotion or enthusiasm."
  },
  {
    id: "tcat-eng-333",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the closest synonym for the word \"PELLUCID\":",
    options: [
      "Limpid and clear",
      "Turbid and cloudy",
      "Opaque and dense",
      "Intricate and dense"
    ],
    correct: 0,
    explain: "\"Pellucid\" means translucently clear in meaning or optical clarity, synonymous with \"limpid\"."
  },
  {
    id: "tcat-eng-334",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the closest antonym for \"ESOTERIC\":",
    options: [
      "Exoteric",
      "Arcane",
      "Recondite",
      "Abstruse"
    ],
    correct: 0,
    explain: "\"Esoteric\" refers to knowledge intended for or understood by only a small group; \"exoteric\" means suitable for or communicated to the general public."
  },
  {
    id: "tcat-eng-335",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the word that best fits the sentence: \"The senator's speech was characterized by _______ rhetoric designed to appease both conservative and progressive factions without making concrete commitments.\"",
    options: [
      "equivocal",
      "trenchant",
      "uncompromising",
      "dogmatic"
    ],
    correct: 0,
    explain: "\"Equivocal\" describes language open to multiple interpretations or deliberately ambiguous."
  },
  {
    id: "tcat-eng-336",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the closest synonym for \"ANACHRONISTIC\":",
    options: [
      "Chronologically misplaced",
      "Futuristic",
      "Contemporary",
      "Synchronous"
    ],
    correct: 0,
    explain: "\"Anachronistic\" pertains to something belonging or appropriate to a period other than that in which it exists."
  },
  {
    id: "tcat-eng-337",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the closest antonym for \"LACONIC\":",
    options: [
      "Verbose",
      "Taciturn",
      "Concise",
      "Pithy"
    ],
    correct: 0,
    explain: "\"Laconic\" means using very few words; \"verbose\" means using far more words than necessary."
  },
  {
    id: "tcat-eng-338",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Choose the word that best completes the sentence: \"To prevent the catalyst from decomposing, the reaction mixture was maintained in an _______ state using argon gas.\"",
    options: [
      "inert",
      "volatile",
      "effervescent",
      "aqueous"
    ],
    correct: 0,
    explain: "\"Inert\" means chemically inactive or unreactive, typical of noble gases like argon protecting a catalyst."
  },
  {
    id: "tcat-eng-339",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the closest synonym for \"OBDURATE\":",
    options: [
      "Intransigent",
      "Compliant",
      "Malleable",
      "Tractable"
    ],
    correct: 0,
    explain: "\"Obdurate\" means stubbornly refusing to change one's opinion or course of action; \"intransigent\" is a direct synonym."
  },
  {
    id: "tcat-eng-340",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Medium",
    q: "Select the closest antonym for \"PROLIFIC\":",
    options: [
      "Barren",
      "Fecund",
      "Productive",
      "Copious"
    ],
    correct: 0,
    explain: "\"Prolific\" means producing much fruit or foliage or many works; \"barren\" represents complete lack of production."
  },
  {
    id: "tcat-eng-341",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the closest synonym for the word \"PUISSANT\":",
    options: [
      "Potent and formidable",
      "Feeble and frail",
      "Hesitant and meek",
      "Trivial and fleeting"
    ],
    correct: 0,
    explain: "\"Puissant\" is an elevated literary term meaning having great power or influence; formidable."
  },
  {
    id: "tcat-eng-342",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the closest antonym for \"SANGUINE\":",
    options: [
      "Morose and despondent",
      "Buoyant and optimistic",
      "Rubicund and flushed",
      "Audacious and bold"
    ],
    correct: 0,
    explain: "\"Sanguine\" describes a cheerfully optimistic or confident outlook; its antonym is \"morose\" or \"despondent\"."
  },
  {
    id: "tcat-eng-343",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the word that precisely conveys: \"A harsh, discordant mixture of sounds resulting from uncoordinated frequency interference.\"",
    options: [
      "Cacophony",
      "Euphony",
      "Symphony",
      "Monotony"
    ],
    correct: 0,
    explain: "\"Cacophony\" designates an inharmonious or harsh jarring sound; \"euphony\" is pleasant harmonized sound."
  },
  {
    id: "tcat-eng-344",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the closest synonym for \"RECALCITRANT\":",
    options: [
      "Refractory",
      "Amenable",
      "Submissive",
      "Pliable"
    ],
    correct: 0,
    explain: "\"Recalcitrant\" means resisting authority or discipline, stubbornly defiant; \"refractory\" is an exact synonym."
  },
  {
    id: "tcat-eng-345",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the closest antonym for \"INCHOATE\":",
    options: [
      "Fully developed and consummate",
      "Rudimentary and nascent",
      "Amorphous and chaotic",
      "Elementary and basic"
    ],
    correct: 0,
    explain: "\"Inchoate\" refers to something just begun and not fully formed or developed; its antonym is \"consummate\" or \"fully developed\"."
  },
  {
    id: "tcat-eng-346",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Choose the word that best fills the blank: \"The scholar exposed the logical _______ in the opposing thesis, demonstrating that the premises assumed the very conclusion they sought to prove.\"",
    options: [
      "fallacy",
      "aphorism",
      "truism",
      "panegyric"
    ],
    correct: 0,
    explain: "A \"fallacy\" is a mistaken belief or defect in reasoning, specifically circular reasoning (petitio principii) described here."
  },
  {
    id: "tcat-eng-347",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the closest synonym for \"PERSPICACIOUS\":",
    options: [
      "Acutely perceptive and discerning",
      "Visually impaired",
      "Willfully ignorant",
      "Excessively credulous"
    ],
    correct: 0,
    explain: "\"Perspicacious\" denotes having keen mental perception, acute discernment, and rapid understanding."
  },
  {
    id: "tcat-eng-348",
    subject: "English",
    topic: "Vocabulary and Synonyms/Antonyms",
    difficulty: "Hard",
    q: "Select the closest antonym for \"INSOUCIANT\":",
    options: [
      "Anxious and apprehensive",
      "Carefree and nonchalant",
      "Unconcerned and blithe",
      "Serene and untroubled"
    ],
    correct: 0,
    explain: "\"Insouciant\" means free from worry, concern, or anxiety; its antonym is \"anxious\" or \"apprehensive\"."
  },
  {
    id: "tcat-eng-349",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Identify the error in the sentence: \"Neither of the two turbine rotors (A) are (B) capable of operating (C) at supersonic speeds (D).\"",
    options: [
      "are (B)",
      "Neither of the two (A)",
      "capable of operating (C)",
      "at supersonic speeds (D)"
    ],
    correct: 0,
    explain: "\"Neither\" is singular and governs the singular verb \"is\", not the plural \"are\"."
  },
  {
    id: "tcat-eng-350",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Identify the correct replacement for the underlined segment: \"She had been studying for six hours WHEN SUDDENLY THE POWER CUT OFF.\"",
    options: [
      "when suddenly the power was cut off",
      "while suddenly the power cut off",
      "then suddenly the power cut off",
      "since suddenly the power was cutting off"
    ],
    correct: 0,
    explain: "\"When suddenly the power was cut off\" correctly uses the passive voice to reflect electrical disruption."
  },
  {
    id: "tcat-eng-351",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Select the sentence that maintains correct pronoun-antecedent agreement with the distributive pronoun \"each\":",
    options: [
      "Each of the researchers must submit his or her experimental protocol before testing begins.",
      "Each of the researchers must submit their experimental protocols before testing begins.",
      "Each of the researchers must submits his or her experimental protocol before testing begins.",
      "Each of the researchers have to submit their experimental protocol before testing begins."
    ],
    correct: 0,
    explain: "In formal standard English, the singular distributive pronoun \"Each\" is paired with singular pronouns (\"his or her\") and singular verb forms."
  },
  {
    id: "tcat-eng-352",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Identify the error: \"The manager, along with his assistants, (A) have arrived (B) at the venue (C) to inspect the machinery (D).\"",
    options: [
      "have arrived (B)",
      "The manager (A)",
      "at the venue (C)",
      "to inspect the machinery (D)"
    ],
    correct: 0,
    explain: "Parenthetical phrases like \"along with his assistants\" do not change the number of the subject \"manager\". The verb should be singular \"has arrived\"."
  },
  {
    id: "tcat-eng-353",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Choose the correct version: \"The weather was SO ADVERSE THAT THE FLIGHT WAS CANCELLED.\"",
    options: [
      "so adverse that the flight was cancelled",
      "too adverse that the flight was cancelled",
      "very adverse that the flight was cancelled",
      "such adverse that the flight was cancelled"
    ],
    correct: 0,
    explain: "The correlative construction indicating consequence with an adjective is \"so + [adjective] + that + [clause]\"."
  },
  {
    id: "tcat-eng-354",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Select the sentence that eliminates the double comparative error:",
    options: [
      "The modern carbon-fiber composite is much lighter than conventional aluminum alloys.",
      "The modern carbon-fiber composite is more lighter than conventional aluminum alloys.",
      "The modern carbon-fiber composite is most lighter than conventional aluminum alloys.",
      "The modern carbon-fiber composite is much more lighter than conventional aluminum alloys."
    ],
    correct: 0,
    explain: "\"Lighter\" is already comparative; modifying it with \"much\" is correct, whereas \"more lighter\" creates a double comparative."
  },
  {
    id: "tcat-eng-355",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Identify the segment with an error: \"One of the chief reasons (A) for structural failure (B) are the lack of (C) proper metallurgy checks (D).\"",
    options: [
      "are the lack of (C)",
      "One of the chief reasons (A)",
      "for structural failure (B)",
      "proper metallurgy checks (D)"
    ],
    correct: 0,
    explain: "The subject is \"One\", which requires the singular verb \"is\", not \"are\"."
  },
  {
    id: "tcat-eng-356",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Easy",
    q: "Choose the correct option: \"He is senior _______ all other research associates in the department.\"",
    options: [
      "to",
      "than",
      "from",
      "over"
    ],
    correct: 0,
    explain: "Latin comparatives ending in \"-ior\" (senior, junior, prior, superior, inferior) are followed by \"to\", not \"than\"."
  },
  {
    id: "tcat-eng-357",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Correct the dangling modifier: \"Having analyzed the spectral data for several days, THE HYPOTHESIS WAS REJECTED BY THE SCIENTISTS.\"",
    options: [
      "the scientists rejected the hypothesis",
      "the hypothesis had been rejected by the scientists",
      "rejection of the hypothesis was performed by the scientists",
      "the hypothesis was what the scientists rejected"
    ],
    correct: 0,
    explain: "The agent performing the action \"Having analyzed\" is \"the scientists\", who must immediately follow the introductory participial phrase."
  },
  {
    id: "tcat-eng-358",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Identify the segment with an error: \"The board members insisted (A) that the financial ledger (B) was inspected (C) by an external auditor (D).\"",
    options: [
      "was inspected (C)",
      "The board members insisted (A)",
      "that the financial ledger (B)",
      "by an external auditor (D)"
    ],
    correct: 0,
    explain: "Verbs of demand/insistence require the mandative subjunctive: \"be inspected\" instead of the indicative \"was inspected\"."
  },
  {
    id: "tcat-eng-359",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Select the sentence with correct parallel structure:",
    options: [
      "The program aims at improving literacy, reducing unemployment, and promoting vocational skills.",
      "The program aims at literacy improvement, to reduce unemployment, and promoting vocational skills.",
      "The program aims to improve literacy, reducing unemployment, and promotion of vocational skills.",
      "The program aims at improving literacy, reduction of unemployment, and to promote skills."
    ],
    correct: 0,
    explain: "All three gerund objects of the preposition \"at\" maintain consistent parallel morphology: \"improving...\", \"reducing...\", and \"promoting...\"."
  },
  {
    id: "tcat-eng-360",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Correct the faulty comparison: \"The computational efficiency of this graphics processor is higher than THAT OF ITS PREDECESSOR.\"",
    options: [
      "that of its predecessor",
      "its predecessor",
      "those of its predecessor",
      "what its predecessor was"
    ],
    correct: 0,
    explain: "To compare efficiency to efficiency rather than efficiency to a processor, the demonstrative pronoun \"that of\" must be used."
  },
  {
    id: "tcat-eng-361",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Identify the error: \"Scarcely had the rocket (A) left the launchpad (B) than the telemetry telemetry systems (C) registered a booster anomaly (D).\"",
    options: [
      "than the telemetry (C)",
      "Scarcely had the rocket (A)",
      "left the launchpad (B)",
      "registered a booster anomaly (D)"
    ],
    correct: 0,
    explain: "\"Scarcely\" must be paired with \"when\" (or \"before\"), not \"than\". (\"No sooner\" pairs with \"than\")."
  },
  {
    id: "tcat-eng-362",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Choose the correct replacement: \"The investigator inquired WHETHER OR NOT THE ENCRYPTION KEYS HAD BEEN COMPROMISED.\"",
    options: [
      "whether the encryption keys had been compromised",
      "if or not the encryption keys had been compromised",
      "that the encryption keys had been compromised",
      "whether if the encryption keys had been compromised"
    ],
    correct: 0,
    explain: "\"Whether\" introduces an indirect question cleanly; appending \"or not\" immediately is redundant in formal concise writing."
  },
  {
    id: "tcat-eng-363",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Identify the error: \"Between you and I, (A) the experimental findings (B) have failed to reproduce (C) the published baseline (D).\"",
    options: [
      "Between you and I, (A)",
      "the experimental findings (B)",
      "have failed to reproduce (C)",
      "the published baseline (D)"
    ],
    correct: 0,
    explain: "\"Between\" is a preposition requiring objective pronouns: \"Between you and me\", not \"Between you and I\"."
  },
  {
    id: "tcat-eng-364",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Medium",
    q: "Select the sentence that correctly resolves the comma splice:",
    options: [
      "The internal combustion engine overheated; consequently, the dyno test was aborted.",
      "The internal combustion engine overheated, consequently, the dyno test was aborted.",
      "The internal combustion engine overheated, the dyno test was aborted.",
      "The internal combustion engine overheated consequently the dyno test was aborted."
    ],
    correct: 0,
    explain: "Two independent clauses joined by a conjunctive adverb (\"consequently\") must be separated by a semicolon and followed by a comma."
  },
  {
    id: "tcat-eng-365",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the syntactically correct sentence resolving an ambiguous reference:",
    options: [
      "Although the server rack was equipped with redundant cooling fans, the heat sink still failed due to thermal throttling.",
      "Although the server rack was equipped with redundant cooling fans, it still failed due to thermal throttling.",
      "Because they were defective, the technicians replaced the microcontrollers.",
      "The supervisor told the intern that his calculation was completely erroneous."
    ],
    correct: 0,
    explain: "Option A replaces the ambiguous pronoun \"it\" with the specific noun phrase \"the heat sink\", resolving the referential ambiguity."
  },
  {
    id: "tcat-eng-366",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the segment with an error: \"The archivist was uncertain (A) as to whom (B) should be entrusted with (C) safeguarding the illuminated codex (D).\"",
    options: [
      "as to whom (B)",
      "The archivist was uncertain (A)",
      "should be entrusted with (C)",
      "safeguarding the illuminated codex (D)"
    ],
    correct: 0,
    explain: "\"Who\" is the grammatical subject of the clause \"who should be entrusted with...\"; the preposition \"as to\" governs the entire clause, not just the pronoun."
  },
  {
    id: "tcat-eng-367",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Choose the correct replacement: \"The velocity of gamma rays in vacuum IS IDENTICAL TO X-RAYS.\"",
    options: [
      "is identical to that of X-rays",
      "is identical to X-rays",
      "are identical to those of X-rays",
      "is identical with X-rays"
    ],
    correct: 0,
    explain: "To prevent an illogical comparison between a velocity and a type of electromagnetic wave, \"that of X-rays\" is required."
  },
  {
    id: "tcat-eng-368",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the grammatically unassailable construction involving correlative conjunctions:",
    options: [
      "The algorithm not only processes seismic waveforms with high precision but also generates real-time rupture maps.",
      "The algorithm processes not only seismic waveforms with high precision but also generates real-time rupture maps.",
      "Not only the algorithm processes seismic waveforms with high precision but also it generates real-time rupture maps.",
      "The algorithm not only processes seismic waveforms with high precision, it generates real-time rupture maps also."
    ],
    correct: 0,
    explain: "The parallel elements following \"not only\" and \"but also\" must be grammatically congruent verbs: \"processes...\" and \"generates...\"."
  },
  {
    id: "tcat-eng-369",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the error in tense sequence: \"The astrophysicist announced that the celestial object WHICH HAD COLLIDED WITH JUPITER WAS A COMET.\"",
    options: [
      "which had collided with Jupiter was a comet",
      "which collided with Jupiter had been a comet",
      "which had been collided with Jupiter was a comet",
      "which has collided with Jupiter is a comet"
    ],
    correct: 0,
    explain: "Option A correctly uses the past perfect (\"had collided\") to denote an event preceding the past announcement (\"announced\")."
  },
  {
    id: "tcat-eng-370",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Identify the sentence that correctly corrects a misplaced modifier:",
    options: [
      "Sitting atop the optical workbench, the laser interferometer provided ultra-stable interference fringes.",
      "Sitting atop the optical workbench, the interference fringes were captured by the laser interferometer.",
      "The laser interferometer captured fringes sitting atop the optical workbench.",
      "Sitting atop the optical workbench, ultra-stable fringes were provided by the laser interferometer."
    ],
    correct: 0,
    explain: "The modifier \"Sitting atop the optical workbench\" correctly modifies the immediate subject \"the laser interferometer\"."
  },
  {
    id: "tcat-eng-371",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Which sentence correctly avoids the fused participle and adheres to formal register?",
    options: [
      "The department chair was skeptical about our obtaining reproducible findings within the abbreviated funding window.",
      "The department chair was skeptical about us obtaining reproducible findings within the abbreviated funding window.",
      "The department chair was skeptical about we obtaining reproducible findings within the abbreviated funding window.",
      "The department chair was skeptical about them obtaining reproducible findings within the abbreviated funding window."
    ],
    correct: 0,
    explain: "The possessive pronoun \"our\" correctly precedes the gerund \"obtaining\", satisfying the formal rule against fused participles."
  },
  {
    id: "tcat-eng-372",
    subject: "English",
    topic: "Sentence Correction",
    difficulty: "Hard",
    q: "Select the sentence that properly uses the subjunctive condition contrary to fact with inverted syntax:",
    options: [
      "Were the cryostat to lose vacuum insulation, the superconducting coils would quench instantaneously.",
      "Was the cryostat to lose vacuum insulation, the superconducting coils would quench instantaneously.",
      "Should the cryostat lost vacuum insulation, the superconducting coils would quench instantaneously.",
      "Had the cryostat lose vacuum insulation, the superconducting coils would quench instantaneously."
    ],
    correct: 0,
    explain: "The inverted hypothetical conditional \"Were the cryostat to lose...\" correctly replaces \"If the cryostat were to lose...\" without the conjunction \"if\"."
  },
  {
    id: "tcat-eng-373",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Passage: \"Renewable energy technologies, notably solar photovoltaics and wind turbines, have undergone precipitous cost reductions over the past decade. Consequently, levelized electricity generation costs for grid-scale solar now rival or undercut fossil-fuel baseload power in most geographic markets.\"\n\nAccording to the passage, why has grid-scale solar become competitive with fossil fuels?",
    options: [
      "Because of precipitous cost reductions over the past decade",
      "Because fossil fuels have been outlawed globally",
      "Because solar energy requires no maintenance",
      "Because wind turbines produce baseload nuclear power"
    ],
    correct: 0,
    explain: "The text directly states that \"precipitous cost reductions over the past decade\" enabled solar generation costs to rival or undercut fossil fuels."
  },
  {
    id: "tcat-eng-374",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Passage: \"Photosynthesis converts solar photons into chemical bond energy in carbohydrates, releasing molecular oxygen as a byproduct. Without this fundamental bioenergetic process, Earth's aerobic organisms could not sustain their metabolic respiration.\"\n\nWhat is identified as a critical byproduct of photosynthesis?",
    options: [
      "Molecular oxygen",
      "Carbon dioxide",
      "Methane gas",
      "Nitrogen dioxide"
    ],
    correct: 0,
    explain: "The passage explicitly notes that photosynthesis releases \"molecular oxygen as a byproduct\"."
  },
  {
    id: "tcat-eng-375",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Passage: \"Urban heat islands occur when dense metropolitan areas experience substantially warmer ambient temperatures than surrounding rural landscapes. This effect stems primarily from the replacement of natural vegetation with asphalt and concrete, materials that absorb and retain significant solar radiation.\"\n\nWhat is the primary cause of urban heat islands according to the text?",
    options: [
      "Replacement of vegetation with heat-absorbing asphalt and concrete",
      "Lack of cloud cover over major metropolitan centers",
      "Excessive agricultural irrigation in rural zones",
      "Underground volcanic geothermal venting"
    ],
    correct: 0,
    explain: "The passage states the effect stems from replacing vegetation with asphalt and concrete which absorb and retain solar heat."
  },
  {
    id: "tcat-eng-376",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Passage: \"Water exhibits maximum density at approximately 4 degrees Celsius. As water cools below this temperature toward freezing, its molecular lattice expands, allowing ice to float atop aquatic ecosystems and insulating underlying aquatic fauna during harsh winters.\"\n\nWhy does ice float on liquid water according to the passage?",
    options: [
      "Its molecular lattice expands below 4°C, lowering its density",
      "Salt dissolved in freshwater pushes ice upward",
      "Surface tension repels solid crystals entirely",
      "Cold air exerts vacuum suction on the ice sheet"
    ],
    correct: 0,
    explain: "The passage explains that as water cools below 4°C its molecular lattice expands, reducing its density so it floats."
  },
  {
    id: "tcat-eng-377",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Passage: \"Antibiotic stewardship programs aim to optimize antimicrobial prescribing to treat infections effectively while minimizing toxicity and curbing the emergence of multidrug-resistant pathogens.\"\n\nWhat dual objective of antibiotic stewardship is emphasized?",
    options: [
      "Treating infections effectively while curbing drug resistance",
      "Maximizing pharmaceutical sales while eliminating surgery",
      "Synthesizing synthetic antivirals for livestock exclusively",
      "Replacing clinical diagnostics with algorithmic guesswork"
    ],
    correct: 0,
    explain: "The text highlights optimizing treatment while minimizing toxicity and curbing multidrug-resistant pathogens."
  },
  {
    id: "tcat-eng-378",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Passage: \"The human blood-brain barrier consists of tightly joined endothelial cells that shield neural parenchyma from systemic pathogens, neurotoxic metabolites, and fluctuating blood solutes, while selectively admitting glucose and essential amino acids via active transport.\"\n\nWhat is the primary physiological function of the blood-brain barrier?",
    options: [
      "Shield neural tissue from systemic pathogens and toxins while selectively admitting essential nutrients",
      "Pump oxygenated erythrocytes directly into cranial bone marrow",
      "Prevent glucose from crossing into cerebral circulation",
      "Produce cerebrospinal fluid within the lumbar vertebrae"
    ],
    correct: 0,
    explain: "The text explicitly states the barrier shields neural parenchyma from pathogens and toxins while admitting nutrients."
  },
  {
    id: "tcat-eng-379",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Passage: \"James Watt's revolutionary enhancement to the steam engine was the separate condenser. By avoiding the cyclical heating and cooling of the main cylinder, this breakthrough reduced fuel consumption by nearly 75 percent.\"\n\nWhat was Watt's key technological modification?",
    options: [
      "The separate condenser",
      "The electric turbine",
      "The hydraulic brake",
      "The internal combustion piston"
    ],
    correct: 0,
    explain: "The passage specifies that Watt's revolutionary enhancement was \"the separate condenser\"."
  },
  {
    id: "tcat-eng-380",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Easy",
    q: "Passage: \"Optical fiber communication transmits information via light pulses along flexible silica strands. Total internal reflection prevents light from escaping through the cladding, ensuring minimal signal attenuation over thousands of kilometers.\"\n\nWhat physical principle enables light to stay confined within optical fibers?",
    options: [
      "Total internal reflection",
      "Atmospheric refraction",
      "Diffraction scattering",
      "Polarization absorption"
    ],
    correct: 0,
    explain: "The passage explicitly cites \"Total internal reflection\" as the mechanism preventing light leakage."
  },
  {
    id: "tcat-eng-381",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Passage: \"Although machine learning algorithms demonstrate remarkable predictive fidelity across vast image repositories, their susceptibility to adversarial perturbations reveals an underlying brittleness. Minor, human-imperceptible pixel alterations can induce catastrophic misclassifications, indicating that current neural networks rely heavily on superficial statistical correlations rather than robust causal world models.\"\n\nWhat central weakness of machine learning models does the author identify?",
    options: [
      "Reliance on superficial statistical correlations rather than robust causal models",
      "Inability to process high-resolution photographic files",
      "Excessive latency during gradient descent calculations",
      "Total failure when applied to text-based linguistic inputs"
    ],
    correct: 0,
    explain: "The passage concludes that vulnerability to imperceptible perturbations proves neural networks rely on superficial statistical correlations rather than causal models."
  },
  {
    id: "tcat-eng-382",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Passage: \"In economic theory, the 'tragedy of the commons' posits that individuals acting independently and rationally according to self-interest will inevitably deplete a shared finite resource, even when it is clear that such depletion is contrary to the collective long-term interest. Garrett Hardin argued that neither unfettered market mechanisms nor appeals to conscience can halt this degradation without institutional oversight or privatized property rights.\"\n\nBased on Hardin's premise, how can the degradation of shared resources be prevented?",
    options: [
      "Through institutional oversight or defined property rights",
      "By relying entirely on individual moral conscience",
      "By deregulating market access to maximum capacity",
      "Through the total elimination of statutory laws"
    ],
    correct: 0,
    explain: "Hardin argued that preventing degradation requires \"institutional oversight or privatized property rights\", as appeals to conscience fail."
  },
  {
    id: "tcat-eng-383",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Passage: \"Cryogenic electron microscopy (cryo-EM) flash-freezes biomolecules in vitreous ice, circumventing the need for chemical crystallization. By preserving proteins in their near-native conformations, cryo-EM allows researchers to capture high-resolution structures of membrane proteins and dynamic multi-protein complexes that resisted X-ray diffraction for decades.\"\n\nWhat major methodological advantage does cryo-EM offer over X-ray crystallography?",
    options: [
      "It preserves biomolecules in near-native states without requiring crystallization",
      "It utilizes radioactive isotopes to illuminate atomic nuclei",
      "It generates structures exclusively at room temperature",
      "It functions without using high-energy electron beams"
    ],
    correct: 0,
    explain: "Cryo-EM preserves molecules in vitreous ice, circumventing the need for chemical crystallization required by X-ray diffraction."
  },
  {
    id: "tcat-eng-384",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Passage: \"The James Webb Space Telescope operates predominantly in the infrared spectrum to peer through dense interstellar dust clouds that obscure visible light. Furthermore, cosmological redshift stretches the radiation emitted by the earliest primordial galaxies into infrared wavelengths, making infrared observation essential for investigating cosmic dawn.\"\n\nWhy is infrared observation vital for studying primordial galaxies?",
    options: [
      "Cosmological redshift stretches their emitted light into infrared wavelengths",
      "Infrared sensors operate without cryogenic coolant",
      "Visible light cannot travel through empty vacuum",
      "Primordial stars emitted only microwave gamma rays"
    ],
    correct: 0,
    explain: "Cosmological redshift stretches radiation from early galaxies into the infrared, making infrared detection essential."
  },
  {
    id: "tcat-eng-385",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Passage: \"Semiconductor doping involves the deliberate introduction of trace impurity atoms into an intrinsic silicon crystal lattice. Introducing Group V pentavalent elements like phosphorus yields an abundance of mobile conduction electrons (n-type), whereas Group III trivalent elements like boron produce mobile positive charge carriers termed holes (p-type).\"\n\nWhat result is achieved by doping silicon with boron?",
    options: [
      "Creation of p-type semiconductor with mobile positive holes",
      "Creation of n-type semiconductor with excess conduction electrons",
      "Complete dielectric breakdown of the silicon lattice",
      "Instantaneous conversion into a high-temperature superconductor"
    ],
    correct: 0,
    explain: "Group III trivalent elements like boron produce mobile positive charge carriers termed holes (p-type)."
  },
  {
    id: "tcat-eng-386",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Passage: \"Thomas Kuhn asserted that science does not progress via smooth, cumulative increments, but rather through episodic paradigm shifts. Normal science operates within an established theoretical framework until mounting anomalies precipitate a crisis, compelling the scientific community to adopt an incommensurable new conceptual worldview.\"\n\nWhat triggers a scientific revolution in Kuhn's model?",
    options: [
      "The accumulation of theoretical anomalies that precipitate a crisis",
      "Routine incremental data collection in normal science",
      "Government funding mandates targeting specific laboratories",
      "The complete rejection of empirical verification"
    ],
    correct: 0,
    explain: "Kuhn argued that mounting anomalies disrupt normal science, precipitating a crisis that forces a paradigm shift."
  },
  {
    id: "tcat-eng-387",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Passage: \"Desalination via reverse osmosis forces seawater through a semipermeable polyamide membrane under hydrostatic pressures exceeding the natural osmotic pressure. While this process purifies saline water into potable effluent, disposing of the hyper-saline byproduct brine poses acute ecotoxicological threats to benthic marine organisms.\"\n\nWhat environmental hazard is directly associated with reverse osmosis desalination?",
    options: [
      "Ecotoxicological threats to benthic marine life from hyper-saline brine disposal",
      "Depletion of atmospheric nitrogen reserves",
      "Thermal pollution from radioactive coolant towers",
      "Uncontrolled proliferation of freshwater cyanobacteria in open oceans"
    ],
    correct: 0,
    explain: "The passage explicitly identifies the disposal of hyper-saline brine as an acute threat to benthic marine life."
  },
  {
    id: "tcat-eng-388",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Medium",
    q: "Passage: \"The Turing Test assesses whether a machine can exhibit conversational behavior indistinguishable from a human. Critics like John Searle, through his Chinese Room thought experiment, contend that syntactic symbol manipulation according to formal programming rules does not equate to semantic comprehension or genuine subjective consciousness.\"\n\nWhat fundamental distinction does Searle's Chinese Room argument illustrate?",
    options: [
      "Syntactic manipulation does not imply genuine semantic understanding",
      "Computers cannot execute algorithms faster than humans",
      "Natural language processing requires analog circuitry",
      "Human dialogue is entirely governed by formal Boolean logic"
    ],
    correct: 0,
    explain: "Searle argues that following formal syntactic rules to manipulate symbols is not equivalent to semantic comprehension."
  },
  {
    id: "tcat-eng-389",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Passage: \"The Epistemology of Karl Popper hinges on the criterion of falsifiability as the demarcation between empirical science and pseudo-science. Popper rejected the inductivist view that scientific theories are verified by accumulating corroborating instances, maintaining instead that scientific hypotheses are conjectures that can never be decisively verified, but can only be subjected to rigorous attempts at empirical refutation. An unfalsifiable claim, which no conceivable observational outcome can contradict, provides no empirical informational content regarding the physical world.\"\n\nWhich of the following statements most accurately synthesizes Popper's stance?",
    options: [
      "Scientific validity derives from vulnerability to empirical refutation rather than the accumulation of corroborating data",
      "Theories that resist all observational contradictions are the most empirically informative",
      "Inductive verification provides absolute epistemological certainty for natural laws",
      "A hypothesis must be conclusively proven before it qualifies as empirical science"
    ],
    correct: 0,
    explain: "Popper asserted that scientific claims are characterized by falsifiability (potential for refutation), rejecting inductivist verification."
  },
  {
    id: "tcat-eng-390",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Passage: \"In statistical mechanics, Maxwell's Demon represents a hypothetical micro-entity capable of sorting high-velocity particles from low-velocity particles between two isolated gas chambers without expending mechanical work, seemingly violating the Second Law of Thermodynamics. Rolf Landauer and Charles Bennett resolved this apparent paradox by proving that the thermodynamic cost does not reside in the observation or sorting per se, but in the inevitable erasure of information stored in the Demon's memory register, which dissipates a minimum entropy of k*ln(2) per bit into the environment.\"\n\nAccording to Landauer and Bennett's resolution, where does the thermodynamic entropy cost occur?",
    options: [
      "In the physical erasure of information from the memory register",
      "In the frictionless sliding of the partition door",
      "In the kinetic collisions between sorting gas molecules",
      "In the thermal radiation emitted by the Demon's visual sensors"
    ],
    correct: 0,
    explain: "Landauer's Principle proved that erasing information from memory registers has a fundamental thermodynamic cost that dissipates entropy, preserving the Second Law."
  },
  {
    id: "tcat-eng-391",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Passage: \"Ecological resilience differs fundamentally from ecological stability. While stability denotes an ecosystem's capacity to resist perturbation and return to a pre-existing equilibrium, resilience represents the magnitude of disturbance an ecosystem can absorb before undergoing an irreversible regime shift into an alternative stable state characterized by entirely altered biotic structures, trophic cascades, and feedback loops.\"\n\nIn the context of the passage, a 'regime shift' implies:",
    options: [
      "An irreversible transition into an alternative structural and functional stable state",
      "A rapid and complete recovery of the original equilibrium",
      "A transient seasonal fluctuation in biomass production",
      "The eradication of all microbial decomposers in topsoil"
    ],
    correct: 0,
    explain: "The passage defines a regime shift as an irreversible transition into an alternative stable state with altered structures and feedback loops."
  },
  {
    id: "tcat-eng-392",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Passage: \"The Fermi Paradox addresses the apparent contradiction between high probabilistic estimates for the existence of extraterrestrial civilizations (e.g., Drake Equation parameters) and the absence of empirical evidence or radio contact. Robin Hanson proposed the 'Great Filter' hypothesis, which posits that there exists at least one evolutionary barrier between prebiotic chemistry and interstellar colonization that is extraordinarily improbable to surpass. If the Filter lies in our evolutionary past (e.g., abiogenesis or eukaryogenesis), humanity's long-term survival prospects are favorable; if the Filter lies in our future (e.g., technological self-annihilation), our existential peril is immense.\"\n\nWhat can be logically inferred regarding humanity's outlook if abiogenesis is proven to be ubiquitous and trivially facile across the cosmos?",
    options: [
      "The Great Filter is more likely to lie in our evolutionary future, increasing existential risk",
      "Humanity has already surpassed the most improbable existential hurdle",
      "The Drake Equation must be discarded as fundamentally mathematically flawed",
      "Interstellar colonization is physically impossible according to general relativity"
    ],
    correct: 0,
    explain: "If early steps like abiogenesis are common, the barrier (Great Filter) must lie ahead of us, indicating a high probability of future technological self-annihilation."
  },
  {
    id: "tcat-eng-393",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Passage: \"Quantum entanglement describes quantum states of two or more particles whose physical properties are indivisibly correlated regardless of spatial separation. Einstein, Podolsky, and Rosen (EPR) argued that this phenomenon implied 'spooky action at a distance' and concluded quantum mechanics was incomplete, necessitating local hidden variables. However, John Bell formulated mathematical inequalities demonstrating that any local hidden-variable theory produces correlation bounds that quantum mechanics violates, a prediction definitively verified by Aspect and subsequent loophole-free experiments.\"\n\nWhat was the decisive outcome of experimental violations of Bell's inequalities?",
    options: [
      "The definitive refutation of local hidden-variable explanations for quantum correlations",
      "The mathematical proof that faster-than-light signals can transmit classical telegraphy",
      "The vindication of the classical determinism proposed by EPR",
      "The invalidation of quantum electrodynamics"
    ],
    correct: 0,
    explain: "Experimental violation of Bell's inequalities ruled out local realism (local hidden variables), confirming that quantum mechanics cannot be explained locally."
  },
  {
    id: "tcat-eng-394",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Passage: \"In neuroeconomics, the dual-process theory bifurcates cognitive processing into System 1 (fast, autonomous, associative, and emotionally driven) and System 2 (slow, deliberative, rule-governed, and cognitively taxing). Daniel Kahneman highlighted that while System 1 heuristics permit efficient decision-making under temporal constraints, they systematically induce cognitive biases—such as base-rate neglect and framing effects—that persist even when agents possess explicit statistical training.\"\n\nWhat insight does the passage convey regarding the persistence of cognitive biases?",
    options: [
      "They arise from autonomous System 1 heuristics and can persist despite formal statistical education",
      "They are eliminated permanently once an agent receives statistical instruction",
      "They stem entirely from deliberate System 2 computational failures",
      "They only manifest in emotionally volatile financial markets"
    ],
    correct: 0,
    explain: "The text notes that System 1 heuristics systematically induce biases that persist even when agents possess explicit statistical training."
  },
  {
    id: "tcat-eng-395",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Passage: \"CRISPR-Cas9 bacterial immunity was re-engineered by Doudna and Charpentier into a modular RNA-guided platform for precision genome editing. While double-strand breaks (DSBs) induced by Cas9 facilitate gene knockout via non-homologous end joining (NHEJ), they also risk unpredictable off-target indels and chromosomal translocations. Modern iterations, such as base editors and prime editors, avoid DSBs altogether by deploying catalytically impaired Cas9 nickases fused to deaminases or reverse transcriptases, achieving nucleotide transitions with substantially higher precision and diminished genotoxicity.\"\n\nWhy represent prime and base editors a significant technological advancement over classical Cas9 endonuclease?",
    options: [
      "They execute precise nucleotide alterations without inducing double-strand DNA breaks",
      "They operate without utilizing single-guide RNA sequences",
      "They exclusively target eukaryotic mitochondrial genomes",
      "They eliminate the requirement for protospacer adjacent motif (PAM) recognition"
    ],
    correct: 0,
    explain: "Prime and base editors avoid double-strand breaks by using nickases, substantially curtailing unpredictable off-target indels and genotoxicity."
  },
  {
    id: "tcat-eng-396",
    subject: "English",
    topic: "Comprehension Passages",
    difficulty: "Hard",
    q: "Passage: \"The Anthropocene epoch posits that human activities have become the dominant geomorphic and biogeochemical driver of Earth systems. Stratigraphers seeking a formal 'golden spike' (Global Boundary Stratotype Section and Point) for this epoch have debated whether to pinpoint the advent of Neolithic agriculture, the 18th-century industrial revolution, or the mid-20th-century 'Great Acceleration.' The latter proposal gains traction due to the globally synchronous deposition of artificial radionuclides—specifically plutonium-239 fallout from thermonuclear weapons testing—forming an indelible lithostratigraphic marker.\"\n\nWhy is the mid-20th century favored by many stratigraphers as the onset of the Anthropocene?",
    options: [
      "It deposited a globally synchronous radioactive stratigraphic marker from nuclear detonations",
      "It marks the initial emergence of urban agricultural settlements",
      "It witnessed the first extraction of fossil fuel petroleum",
      "It coincided with the complete stabilization of greenhouse gas concentrations"
    ],
    correct: 0,
    explain: "The mid-20th century Great Acceleration left a globally synchronous chemical and radioactive marker (plutonium-239) in sedimentary strata."
  },
  {
    id: "tcat-eng-397",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "THERMOMETER : TEMPERATURE ::",
    options: [
      "Barometer : Pressure",
      "Clock : Distance",
      "Compass : Mass",
      "Scale : Velocity"
    ],
    correct: 0,
    explain: "A thermometer is an instrument used to measure temperature; a barometer is an instrument used to measure atmospheric pressure."
  },
  {
    id: "tcat-eng-398",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "CARTOGRAPHER : MAP ::",
    options: [
      "Playwright : Script",
      "Sculptor : Museum",
      "Author : Library",
      "Musician : Concert hall"
    ],
    correct: 0,
    explain: "A cartographer designs and creates a map; a playwright writes a dramatic script."
  },
  {
    id: "tcat-eng-399",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "CARBURETOR : ENGINE ::",
    options: [
      "Heart : Circulatory system",
      "Lung : Skeleton",
      "Eye : Ear",
      "Brain : Spine"
    ],
    correct: 0,
    explain: "A carburetor supplies air-fuel mixture to an engine; a heart pumps vital blood through the circulatory system."
  },
  {
    id: "tcat-eng-400",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "SEISMOLOGIST : EARTHQUAKE ::",
    options: [
      "Meteorologist : Weather",
      "Astronomer : Microscope",
      "Botanist : Fossil",
      "Chemist : Telescope"
    ],
    correct: 0,
    explain: "A seismologist studies earthquakes; a meteorologist studies weather phenomena."
  },
  {
    id: "tcat-eng-401",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "INSULATOR : ELECTRICITY ::",
    options: [
      "Dam : Water",
      "Wire : Current",
      "Conduit : Fluid",
      "Battery : Charge"
    ],
    correct: 0,
    explain: "An insulator blocks or prevents the flow of electricity; a dam blocks or impedes the flow of water."
  },
  {
    id: "tcat-eng-402",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "ENZYME : SUBSTRATE ::",
    options: [
      "Key : Lock",
      "Hammer : Nail",
      "Engine : Chassis",
      "Wheel : Axle"
    ],
    correct: 0,
    explain: "An enzyme binds specifically to its designated substrate via an induced-fit lock-and-key complementary mechanism."
  },
  {
    id: "tcat-eng-403",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "TELESCOPE : ASTRONOMY ::",
    options: [
      "Microscope : Microbiology",
      "Stethoscope : Geology",
      "Thermometer : Botany",
      "Periscope : Meteorology"
    ],
    correct: 0,
    explain: "A telescope is the foundational optical instrument of astronomy; a microscope is the foundational optical instrument of microbiology."
  },
  {
    id: "tcat-eng-404",
    subject: "English",
    topic: "Analogies",
    difficulty: "Easy",
    q: "LUBRICANT : FRICTION ::",
    options: [
      "Analgesic : Pain",
      "Fuel : Fire",
      "Adhesive : Detachment",
      "Solvent : Concentration"
    ],
    correct: 0,
    explain: "A lubricant alleviates mechanical friction; an analgesic alleviates physical pain."
  },
  {
    id: "tcat-eng-405",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "ENTROPY : ORDER ::",
    options: [
      "Decay : Preservation",
      "Velocity : Acceleration",
      "Force : Mass",
      "Current : Voltage"
    ],
    correct: 0,
    explain: "Entropy represents the measure of disorder or the loss of structural order; decay represents the degradation of preservation."
  },
  {
    id: "tcat-eng-406",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "DISPARATE : HOMOGENEOUS ::",
    options: [
      "Ephemeral : Everlasting",
      "Inert : Unreactive",
      "Static : Motionless",
      "Lethargic : Sluggish"
    ],
    correct: 0,
    explain: "Disparate (fundamentally distinct) is the antonym of homogeneous (uniform throughout); ephemeral (transient) is the antonym of everlasting."
  },
  {
    id: "tcat-eng-407",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "SEDATIVE : DROWSINESS ::",
    options: [
      "Anesthetic : Numbness",
      "Stimulant : Fatigue",
      "Vaccine : Infection",
      "Diuretic : Dehydration"
    ],
    correct: 0,
    explain: "A sedative induces drowsiness as its intended pharmacological effect; an anesthetic induces numbness."
  },
  {
    id: "tcat-eng-408",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "MALLEABLE : METAL ::",
    options: [
      "Ductile : Copper",
      "Brittle : Rubber",
      "Viscous : Gas",
      "Porous : Diamond"
    ],
    correct: 0,
    explain: "Being malleable is a defining mechanical property of metal; being ductile (capable of being drawn into wires) is an inherent property of copper."
  },
  {
    id: "tcat-eng-409",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "DIFFRACTION GRATING : SPECTRUM ::",
    options: [
      "Centrifuge : Density fractions",
      "Voltmeter : Current",
      "Hydrometer : Pressure",
      "Calorimeter : Resistance"
    ],
    correct: 0,
    explain: "A diffraction grating separates composite light into its component spectral wavelengths; a centrifuge separates a mixture into distinct density fractions."
  },
  {
    id: "tcat-eng-410",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "OSCILLATION : PENDULUM ::",
    options: [
      "Rotation : Gyroscope",
      "Combustion : Spark",
      "Conduction : Vacuum",
      "Tension : Pulley"
    ],
    correct: 0,
    explain: "Oscillation is the characteristic mechanical movement of a pendulum; rotation is the characteristic movement of a gyroscope."
  },
  {
    id: "tcat-eng-411",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "FISSION : ATOM ::",
    options: [
      "Cleavage : Mineral",
      "Fusion : Element",
      "Decay : Molecule",
      "Radiation : Core"
    ],
    correct: 0,
    explain: "Fission is the splitting of an atomic nucleus; cleavage is the splitting or splitting along planes of a mineral."
  },
  {
    id: "tcat-eng-412",
    subject: "English",
    topic: "Analogies",
    difficulty: "Medium",
    q: "DIFFIDENCE : AUDACITY ::",
    options: [
      "Parsimony : Extravagance",
      "Bravery : Valour",
      "Arrogance : Hubris",
      "Candor : Honesty"
    ],
    correct: 0,
    explain: "Diffidence (shyness/timidity) is the direct antonym of audacity (boldness); parsimony (stinginess) is the antonym of extravagance."
  },
  {
    id: "tcat-eng-413",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "APOCRYPHAL : CANONICITY ::",
    options: [
      "Spurious : Authenticity",
      "Veracious : Truth",
      "Orthodox : Dogma",
      "Empirical : Science"
    ],
    correct: 0,
    explain: "An apocryphal work lacks canonicity (official acceptance); a spurious item lacks authenticity."
  },
  {
    id: "tcat-eng-414",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "FRACTURE : EMBRITTLEMENT ::",
    options: [
      "Collapse : Structural fatigue",
      "Corrosion : Passivation",
      "Quenching : Annealing",
      "Combustion : Quenching"
    ],
    correct: 0,
    explain: "A fracture occurs as a consequence of progressive embrittlement; a collapse occurs as a consequence of structural fatigue."
  },
  {
    id: "tcat-eng-415",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "EPHEMERAL : PERPETUITY ::",
    options: [
      "Inchoate : Completion",
      "Pervasive : Ubiquity",
      "Mutable : Volatility",
      "Dormant : Inactivity"
    ],
    correct: 0,
    explain: "Something ephemeral lacks perpetuity (endless duration); something inchoate lacks completion (finished form)."
  },
  {
    id: "tcat-eng-416",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "SYLLOGISM : LOGIC ::",
    options: [
      "Proof : Mathematics",
      "Hypothesis : Observation",
      "Rhetoric : Evidence",
      "Axiom : Empirical data"
    ],
    correct: 0,
    explain: "A syllogism is a structured formal deduction in logic; a proof is a structured formal deduction in mathematics."
  },
  {
    id: "tcat-eng-417",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "CALIBRATION : INSTRUMENT ::",
    options: [
      "Tuning : Resonator",
      "Degradation : Sensor",
      "Overheating : Circuit",
      "Friction : Bearing"
    ],
    correct: 0,
    explain: "Calibration adjusts an instrument to ensure measurement accuracy; tuning adjusts a resonator to its precise operating frequency."
  },
  {
    id: "tcat-eng-418",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "PROFLIGATE : SOLVENCY ::",
    options: [
      "Reckless : Safety",
      "Prudent : Frugality",
      "Stoic : Resilience",
      "Tenacious : Persistence"
    ],
    correct: 0,
    explain: "A profligate person acts without regard for financial solvency; a reckless person acts without regard for personal safety."
  },
  {
    id: "tcat-eng-419",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "VISCOSITY : FLUIDITY ::",
    options: [
      "Resistivity : Conductivity",
      "Velocity : Momentum",
      "Permeability : Magnetism",
      "Inertia : Mass"
    ],
    correct: 0,
    explain: "Viscosity is the physical property that opposes fluidity; electrical resistivity is the physical property that opposes conductivity."
  },
  {
    id: "tcat-eng-420",
    subject: "English",
    topic: "Analogies",
    difficulty: "Hard",
    q: "PANEGYRIC : EULOGIZE ::",
    options: [
      "Diatribe : Denounce",
      "Exegesis : Obfuscate",
      "Parody : Emulate",
      "Polemic : Conciliate"
    ],
    correct: 0,
    explain: "A panegyric is a formal discourse designed to eulogize; a diatribe is a bitter verbal attack designed to denounce."
  }
];

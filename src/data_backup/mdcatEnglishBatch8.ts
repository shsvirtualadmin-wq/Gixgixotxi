import { Question } from '../types';

export const MDCAT_ENGLISH_BATCH8: Question[] = [
  // --- Vocabulary (3 MCQs: 1 to 3) ---
  {
    id: 'mdcat-b8-eng-1',
    q: 'Select the most accurate synonym for the word "EPHEMERAL":',
    options: ['Transient', 'Enduring', 'Immense', 'Pernicious'],
    correct: 0,
    topic: 'Synonyms - Advanced Academic Vocabulary',
    chapter: 'Vocabulary',
    explain: '"Ephemeral" means lasting for a very short time, transitory or fleeting. "Transient" is an exact synonym. "Enduring" is an antonym.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b8-eng-2',
    q: 'Select the word that is most nearly OPPOSITE in meaning (antonym) to "UBIQUITOUS":',
    options: ['Scarce', 'Omnipresent', 'Pervasive', 'Prevalent'],
    correct: 0,
    topic: 'Antonyms - High-Yield Vocabulary',
    chapter: 'Vocabulary',
    explain: '"Ubiquitous" means present, appearing, or found everywhere (omnipresent). The direct antonym is "scarce" or "rare".',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b8-eng-3',
    q: 'Choose the word that best fits the definition: "A person who shows excessive or slavish admiration for someone influential in order to gain advantage; a sycophant."',
    options: ['Toady', 'Iconoclast', 'Misanthrope', 'Philanthropist'],
    correct: 0,
    topic: 'Contextual Word Definitions',
    chapter: 'Vocabulary',
    explain: 'A "toady" (or sycophant/flatterer) is someone who behaves obsequiously to someone important. An "iconoclast" attacks cherished beliefs, while a "misanthrope" dislikes humankind.',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Grammar (2 MCQs: 4 to 5) ---
  {
    id: 'mdcat-b8-eng-4',
    q: 'Identify the grammatically correct sentence adhering to standard subject-verb agreement with correlative conjunctions:',
    options: [
      'Neither the attending physician nor the scrub nurses were informed of the revised schedule.',
      'Neither the attending physician nor the scrub nurses was informed of the revised schedule.',
      'Neither the scrub nurses nor the attending physician were informed of the revised schedule.',
      'Neither of the doctors have arrived yet.'
    ],
    correct: 0,
    topic: 'Subject-Verb Agreement - Correlative Conjunctions',
    chapter: 'Grammar',
    explain: 'When subjects are connected by "neither... nor", the verb agrees with the nearer subject (rule of proximity). Since "scrub nurses" is plural, the plural verb "were" is required. In the third option, "attending physician" is singular, so "were" is ungrammatical.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b8-eng-5',
    q: 'Choose the sentence that correctly employs the subjunctive mood to express a hypothetical or counterfactual condition:',
    options: [
      'If she were the chief surgical resident, she would prioritize emergency triage protocols.',
      'If she was the chief surgical resident, she would prioritize emergency triage protocols.',
      'If she is the chief surgical resident, she will had prioritized protocols.',
      'If she would be the chief surgical resident, she prioritized protocols.'
    ],
    correct: 0,
    topic: 'Subjunctive Mood - Counterfactual Conditionals',
    chapter: 'Grammar',
    explain: 'In counterfactual (unreal) conditional clauses expressing wishes or hypotheses contrary to fact, the past subjunctive "were" is required for all persons, including singular third-person subjects ("If she were...").',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Sentence Completion (3 MCQs: 6 to 8) ---
  {
    id: 'mdcat-b8-eng-6',
    q: 'Complete the sentence: "Although Dr. Harris presented a __________ argument supported by empirical clinical trials, several members of the medical board remained __________ to adopt the radical surgical technique."',
    options: ['compelling ... reluctant', 'fallacious ... eager', 'tenuous ... hesitant', 'convoluted ... inclined'],
    correct: 0,
    topic: 'Sentence Completion - Contrast and Logic',
    chapter: 'Sentence Completion',
    explain: 'The contrast marker "Although" requires opposing ideas between the strength of the argument and the board\'s reaction. A "compelling" (convincing) argument contrasts with being "reluctant" (hesitant) to adopt it.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b8-eng-7',
    q: 'Complete the sentence: "The newly synthesized antiviral compound demonstrated remarkable __________, arresting viral replication without causing any detectable __________ to healthy somatic tissues."',
    options: ['efficacy ... toxicity', 'fragility ... enhancement', 'redundancy ... immunity', 'dormancy ... lethargy'],
    correct: 0,
    topic: 'Sentence Completion - Academic Context',
    chapter: 'Sentence Completion',
    explain: '"Efficacy" (ability to produce the desired result) fits the positive context of arresting viral replication, while "toxicity" (harmful damage) fits the harmlessness to host cells.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b8-eng-8',
    q: 'Complete the sentence: "Far from being __________, the epidemiological data revealed that the disease vector had already spread across multiple geographical corridors, rendering localized quarantine measures __________."',
    options: ['contained ... futile', 'widespread ... indispensable', 'lethal ... mandatory', 'sporadic ... omnipotent'],
    correct: 0,
    topic: 'Sentence Completion - Dual Blank Nuance',
    chapter: 'Sentence Completion',
    explain: '"Far from being contained" establishes that the disease was not restricted. Because it had spread widely across corridors, localized quarantines became "futile" (ineffective/pointless).',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Comprehension (2 MCQs: 9 to 10) ---
  {
    id: 'mdcat-b8-eng-9',
    q: 'Read the short clinical excerpt: "Antimicrobial resistance represents one of the foremost global public health crises of the modern era. The widespread overprescription of broad-spectrum antibiotics in clinical settings, coupled with routine sub-therapeutic administration in industrial livestock farming, exerts immense selective pressure on bacterial populations, accelerating the emergence of multi-drug resistant superbugs." According to the passage, what is the primary driver accelerating antimicrobial resistance?',
    options: [
      'Anthropogenic selective pressure resulting from overprescription in healthcare and sub-therapeutic agricultural usage',
      'The intrinsic failure of pharmaceutical companies to develop sterile vaccines',
      'Spontaneous viral mutations occurring exclusively in wild animal hosts',
      'Decreased sanitation infrastructure in advanced tertiary medical centers'
    ],
    correct: 0,
    topic: 'Reading Comprehension - Main Idea and Detail Extraction',
    chapter: 'Comprehension',
    explain: 'The passage directly attributes the acceleration of superbugs to human selective pressure: "overprescription of broad-spectrum antibiotics... coupled with routine sub-therapeutic administration in industrial livestock farming, exerts immense selective pressure".',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b8-eng-10',
    q: 'Read the excerpt: "The human blood-brain barrier (BBB) is a specialized multicellular vascular interface that tightly isolates neural tissue from circulating systemic toxins while permitting the selective transit of essential metabolic substrates via specialized transporter proteins." What can be logically inferred regarding pharmaceutical delivery to the central nervous system?',
    options: [
      'Therapeutic molecules designed to treat neurological disorders must either cross the BBB via specialized transporters or possess physicochemical traits enabling passive lipophilic diffusion',
      'Any water-soluble drug injected into systemic circulation automatically perfuses brain parenchyma',
      'The blood-brain barrier permits free non-specific paracellular diffusion of all hydrophilic macromolecules',
      'Systemic toxins readily cross into the cerebral cortex under normal physiological conditions'
    ],
    correct: 0,
    topic: 'Reading Comprehension - Logical Inference',
    chapter: 'Comprehension',
    explain: 'Because the BBB strictly restricts systemic toxins and paracellular diffusion, therapeutic agents intended to act within neural tissue must be engineered to utilize specific endogenous transporter mechanisms or cross lipophilic endothelial membranes.',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Analogy (3 MCQs: 11 to 13) ---
  {
    id: 'mdcat-b8-eng-11',
    q: 'Identify the pair of words that exhibits the same relationship as the given pair: AORTA : VESSEL ::',
    options: ['FEMUR : BONE', 'HEART : LUNG', 'NEURON : MUSCLE', 'ARTERY : VEIN'],
    correct: 0,
    topic: 'Analogies - Category / Type Relationship',
    chapter: 'Analogy',
    explain: 'An aorta is a specific anatomical example of a blood vessel (Item : Category). Similarly, the femur is a specific anatomical example of a bone.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b8-eng-12',
    q: 'Select the pair that shares the closest logical relationship: STETHOSCOPE : AUSCULTATION ::',
    options: ['MICROSCOPE : MAGNIFICATION', 'SCALPEL : BANDAGE', 'THERMOMETER : SURGERY', 'SYRINGE : DIAGNOSIS'],
    correct: 0,
    topic: 'Analogies - Tool to Its Primary Function',
    chapter: 'Analogy',
    explain: 'A stethoscope is a diagnostic medical instrument used specifically to perform auscultation (listening to internal body sounds). Similarly, a microscope is an instrument used specifically to achieve magnification.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b8-eng-13',
    q: 'Select the pair that best matches the relationship: INSULIN : GLUCOSE ::',
    options: ['CALCITONIN : CALCIUM', 'THYROXINE : IRON', 'PEPSIN : LIPID', 'HEMOGLOBIN : SODIUM'],
    correct: 0,
    topic: 'Analogies - Hormone to Its Regulated Biomolecule',
    chapter: 'Analogy',
    explain: 'Insulin is an endocrine hormone that lowers and regulates circulating blood glucose concentrations. Similarly, calcitonin is a thyroid hormone that lowers and regulates serum calcium concentrations.',
    difficulty: 'Medium',
    subject: 'English'
  },

  // --- Sentence Structure (2 MCQs: 14 to 15) ---
  {
    id: 'mdcat-b8-eng-14',
    q: 'Identify the clinical statement that correctly rectifies the misplaced modifier error:',
    options: [
      'Upon analyzing the cerebrospinal fluid under the oil-immersion objective, the pathologist promptly identified bacterial diplococci.',
      'Upon analyzing the cerebrospinal fluid under the oil-immersion objective, bacterial diplococci were promptly identified by the pathologist.',
      'Having been stained with Gram stain, the laboratory technician inspected the microscopic slide carefully.',
      'Entering the operating theater in sterile scrubs, the illumination lights were positioned by the circulating nurse.'
    ],
    correct: 0,
    topic: 'Sentence Structure - Dangling Modifiers',
    chapter: 'Sentence Structure',
    explain: 'The introductory participial phrase "Upon analyzing the cerebrospinal fluid..." must be logically followed immediately by the agent performing the analysis ("the pathologist"). In the second option, the modifier dangles over "bacterial diplococci".',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b8-eng-15',
    q: 'Select the sentence that maintains strict coordinate parallelism across all coordinate clauses and infinitive series:',
    options: [
      'The attending surgeon advised the resident to examine the surgical wound, to sanitize the dressing equipment, and to record the postoperative vitals.',
      'The attending surgeon advised the resident to examine the surgical wound, sanitizing the dressing equipment, and that he record vitals.',
      'The resident was advised to examine the wound, that equipment must be sterilized, and monitoring patient recovery.',
      'The surgeon instructed him to examine the wound, sanitized instruments, and recording vital metrics.'
    ],
    correct: 0,
    topic: 'Sentence Structure - Parallelism',
    chapter: 'Sentence Structure',
    explain: 'Parallelism requires coordinate items in an enumeration to share the same grammatical form. "to examine..., to sanitize..., and to record..." maintains consistent infinitive verb phrases throughout.',
    difficulty: 'Medium',
    subject: 'English'
  }
];

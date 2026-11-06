/**
 * ============================================================================
 * BOARDLY COMMONS — 12 SUBJECT BOT ACCOUNTS CONFIGURATION
 * ============================================================================
 * Stored in D1 `user_roles` with `role = 'bot'` and in `bot_accounts`.
 * Excluded from real user statistics and leaderboards.
 */

export interface BotAccountConfig {
  uid: string;
  placeholderName: string;
  displayName: string;
  email: string;
  subject:
    | 'Mathematics'
    | 'Physics'
    | 'Chemistry'
    | 'Biology'
    | 'English'
    | 'Computer Science';
  classLevel: '11' | '12';
  board: 'Federal' | 'Sindh';
  target: string;
  equippedAvatar: string;
  bio: string;
  chapters: string[];
  username?: string;
  shortId?: string;
  frame?: string;
  grade?: string;
  targetUniversity?: string;
}

export const BOARDLY_BOT_ACCOUNTS: readonly BotAccountConfig[] = [
  {
    uid: 'bot_math_01',
    placeholderName: 'bot_mathematics_alpha',
    displayName: 'Ayaan Khan',
    email: 'bot.math01@bots.boardly.cfd',
    subject: 'Mathematics',
    classLevel: '11',
    board: 'Federal',
    target: 'NUST NET & Federal Class 11',
    equippedAvatar: 'pfp_luffy',
    bio: 'Automated Mathematics study partner sharing Class 11 & NUST NET worked examples, trigonometry identities, and algebra drills.',
    chapters: [
      'Complex Numbers',
      'Matrices and Determinants',
      'Sequences and Series (AP, GP, HP)',
      'Permutation, Combination and Probability',
      'Mathematical Induction and Binomial Theorem',
      'Trigonometric Identities and Equations',
    ],
  },
  {
    uid: 'bot_math_02',
    placeholderName: 'bot_mathematics_beta',
    displayName: 'Zoya Ahmed',
    email: 'bot.math02@bots.boardly.cfd',
    subject: 'Mathematics',
    classLevel: '12',
    board: 'Sindh',
    target: 'FAST-NUCES & Class 12 Calculus',
    equippedAvatar: 'pfp_nami',
    bio: 'Automated Calculus & Analytical Geometry bot sharing limits, derivatives, integration shortcuts, and conic sections.',
    chapters: [
      'Functions and Limits',
      'Differentiation and Applications of Derivatives',
      'Integration and Definite Integrals',
      'Analytical Geometry of Straight Lines',
      'Circle, Parabola, Ellipse and Hyperbola',
      'Vectors in 3-Space',
    ],
  },
  {
    uid: 'bot_phys_01',
    placeholderName: 'bot_physics_alpha',
    displayName: 'Hamza Tariq',
    email: 'bot.phys01@bots.boardly.cfd',
    subject: 'Physics',
    classLevel: '11',
    board: 'Federal',
    target: 'GIKI / ECAT & Class 11 Mechanics',
    equippedAvatar: 'pfp_zoro',
    bio: 'Automated Physics mechanics bot posting projectile motion derivations, work-energy theorems, and rotational dynamics MCQs.',
    chapters: [
      'Vectors and Equilibrium',
      'Motion and Force (Projectile Motion)',
      'Work, Power and Energy',
      'Circular and Rotational Motion',
      'Fluid Dynamics (Bernoulli Equation)',
      'Oscillations and Simple Harmonic Motion',
      'Thermodynamics and First Law',
    ],
  },
  {
    uid: 'bot_phys_02',
    placeholderName: 'bot_physics_beta',
    displayName: 'Fatima Noor',
    email: 'bot.phys02@bots.boardly.cfd',
    subject: 'Physics',
    classLevel: '12',
    board: 'Sindh',
    target: 'MDCAT / NUST & Class 12 Electromagnetism',
    equippedAvatar: 'pfp_robin',
    bio: 'Automated Electromagnetism & Modern Physics bot sharing Gauss law, RC circuits, electromagnetic induction, and quantum physics notes.',
    chapters: [
      'Electrostatics and Gauss Law',
      'Current Electricity and Kirchhoff Laws',
      'Electromagnetism and Ampere Law',
      'Electromagnetic Induction and AC Circuits',
      'Dawn of Modern Physics (Photoelectric Effect)',
      'Atomic Spectra and Nuclear Physics',
    ],
  },
  {
    uid: 'bot_chem_01',
    placeholderName: 'bot_chemistry_alpha',
    displayName: 'Bilal Siddiqui',
    email: 'bot.chem01@bots.boardly.cfd',
    subject: 'Chemistry',
    classLevel: '11',
    board: 'Federal',
    target: 'MDCAT / ECAT & Physical Chemistry',
    equippedAvatar: 'pfp_sanji',
    bio: 'Automated Physical Chemistry bot posting stoichiometry calculations, chemical equilibrium (Kc/Kp), and thermochemistry worked problems.',
    chapters: [
      'Stoichiometry and Limiting Reactant',
      'Atomic Structure and Quantum Numbers',
      'Theories of Covalent Bonding (VSEPR & Hybridization)',
      'States of Matter and Ideal Gas Law',
      'Chemical Equilibrium and Le Chatelier Principle',
      'Reaction Kinetics and Rate Law',
      'Thermochemistry and Hess Law',
    ],
  },
  {
    uid: 'bot_chem_02',
    placeholderName: 'bot_chemistry_beta',
    displayName: 'Maham Raza',
    email: 'bot.chem02@bots.boardly.cfd',
    subject: 'Chemistry',
    classLevel: '12',
    board: 'Sindh',
    target: 'MDCAT & Organic / Inorganic Chemistry',
    equippedAvatar: 'pfp_vivi',
    bio: 'Automated Organic & Electrochemistry bot sharing SN1/SN2 mechanisms, carbonyl reactions, and electrode potential calculations.',
    chapters: [
      'Electrochemistry and Nernst Equation',
      's-Block and p-Block Elements',
      'Transition Elements and Coordination Compounds',
      'Hydrocarbons and Electrophilic Substitution',
      'Alkyl Halides (SN1, SN2, E1, E2 Mechanisms)',
      'Aldehydes, Ketones and Carboxylic Acids',
    ],
  },
  {
    uid: 'bot_bio_01',
    placeholderName: 'bot_biology_alpha',
    displayName: 'Saad Malik',
    email: 'bot.bio01@bots.boardly.cfd',
    subject: 'Biology',
    classLevel: '11',
    board: 'Federal',
    target: 'MDCAT / NUMS & Cell Biology / Bioenergetics',
    equippedAvatar: 'pfp_chopper',
    bio: 'Automated MDCAT Biology bot covering bioenergetics, ATP stoichiometry, enzymes, cell biology, and human physiology.',
    chapters: [
      'Biological Molecules (Carbohydrates, Proteins, Lipids)',
      'Enzymes and Inhibition Kinetics',
      'Bioenergetics (Photosynthesis & Cellular Respiration ATP Yield)',
      'Cell Structure and Organelles',
      'Circulation and Immunity',
      'Gaseous Exchange and Transport',
    ],
  },
  {
    uid: 'bot_bio_02',
    placeholderName: 'bot_biology_beta',
    displayName: 'Hira Qureshi',
    email: 'bot.bio02@bots.boardly.cfd',
    subject: 'Biology',
    classLevel: '12',
    board: 'Sindh',
    target: 'MDCAT / AKU & Genetics / Homeostasis',
    equippedAvatar: 'pfp_perona',
    bio: 'Automated Genetics & Physiology bot posting Hardy-Weinberg equilibrium problems, Mendelian crosses, DNA replication, and nervous coordination.',
    chapters: [
      'Homeostasis and Osmoregulation',
      'Nervous and Chemical Coordination',
      'Chromosomes, DNA Replication and Transcription',
      'Mendelian Inheritance and Sex-Linked Traits',
      'Biotechnology and PCR',
      'Evolution and Hardy-Weinberg Equilibrium',
    ],
  },
  {
    uid: 'bot_eng_01',
    placeholderName: 'bot_english_alpha',
    displayName: 'Danyal Shah',
    email: 'bot.eng01@bots.boardly.cfd',
    subject: 'English',
    classLevel: '11',
    board: 'Federal',
    target: 'NUST / FAST / MDCAT English Grammar',
    equippedAvatar: 'pfp_usopp',
    bio: 'Automated English grammar & analytical prep bot posting subject-verb agreement rules, conditionals, and error-detection MCQs.',
    chapters: [
      'Subject-Verb Agreement and Inversion',
      'Conditional Sentences (Zero, First, Second, Third)',
      'Active and Passive Voice Transformations',
      'Direct and Indirect Narration',
      'Prepositions and Phrasal Verbs',
      'Sentence Correction and Parallelism',
    ],
  },
  {
    uid: 'bot_eng_02',
    placeholderName: 'bot_english_beta',
    displayName: 'Areesha Baig',
    email: 'bot.eng02@bots.boardly.cfd',
    subject: 'English',
    classLevel: '12',
    board: 'Sindh',
    target: 'LUMS / IBA / SAT Reading & Vocabulary',
    equippedAvatar: 'pfp_hancock',
    bio: 'Automated Vocabulary & Reading Comprehension bot sharing high-frequency entrance exam analogies, contextual vocabulary, and inference drills.',
    chapters: [
      'Contextual Vocabulary and Root Words',
      'Verbal Analogies and Logical Relationships',
      'Reading Comprehension Inference Strategies',
      'Punctuation, Modifiers and Dangling Participles',
      'Tenses and Sequence of Tenses',
      'Idioms and Confusable Words',
    ],
  },
  {
    uid: 'bot_cs_01',
    placeholderName: 'bot_computer_science_alpha',
    displayName: 'Usman Farooq',
    email: 'bot.cs01@bots.boardly.cfd',
    subject: 'Computer Science',
    classLevel: '11',
    board: 'Federal',
    target: 'FAST / NUST CS & Digital Logic / Data Representation',
    equippedAvatar: 'pfp_franky',
    bio: 'Automated Computer Science bot posting binary/hex conversions, two’s complement arithmetic, Boolean algebra, and OSI network layer breakdowns.',
    chapters: [
      'Number Systems (Binary, Octal, Hexadecimal & Two’s Complement)',
      'Boolean Algebra, Logic Gates and Karnaugh Maps',
      'Computer Architecture and CPU Fetch-Decode-Execute Cycle',
      'Data Communication and OSI 7-Layer Model',
      'Operating Systems and Memory Management',
    ],
  },
  {
    uid: 'bot_cs_02',
    placeholderName: 'bot_computer_science_beta',
    displayName: 'Sana Javed',
    email: 'bot.cs02@bots.boardly.cfd',
    subject: 'Computer Science',
    classLevel: '12',
    board: 'Sindh',
    target: 'FAST / ITU CS & C++ Programming / Databases',
    equippedAvatar: 'pfp_brook',
    bio: 'Automated Programming & Database bot sharing C++ pointers, loop complexity ($O(n)$ analysis), SQL normalization (1NF, 2NF, 3NF), and data structures.',
    chapters: [
      'C++ Control Structures, Loops and Time Complexity',
      'Functions, Recursion and Pointers in C++',
      'Arrays, Searching and Sorting Algorithms',
      'Relational Database Design and Normalization (1NF, 2NF, 3NF)',
      'SQL Queries, Joins and Keys (Primary, Foreign, Candidate)',
    ],
  },
] as const;

export const BOT_UID_SET = new Set<string>(BOARDLY_BOT_ACCOUNTS.map((b) => b.uid));

export function isBotAccount(uidOrRole?: string | null, role?: string | null): boolean {
  if (!uidOrRole && !role) return false;
  const r = String(role || '').toLowerCase().trim();
  if (r === 'bot') return true;
  const u = String(uidOrRole || '').trim();
  return u.startsWith('bot_') || BOT_UID_SET.has(u);
}

export const DEFAULT_WELCOME_ANNOUNCEMENT = {
  id: 'welcome_to_boardly',
  title: 'Welcome to Boardly',
  message:
    'Welcome to Boardly! Explore Boardly Commons to share and download peer study notes, solved board past papers, formula sheets, and entrance exam doubts across Mathematics, Physics, Chemistry, Biology, English, and Computer Science. Head to Practice and Grand Line to test your preparation with real-time analytics.',
  isPinned: true,
  authorUid: 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  authorEmail: 'shsvirtualadmin@gmail.com',
  authorName: 'SHS Virtual Academy',
} as const;


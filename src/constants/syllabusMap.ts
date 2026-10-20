export interface SyllabusChapter {
  id: string;
  name: string;
  classLevel?: '11' | '12' | 'Both';
  weight?: number; // relative weight for book tests
}

export interface SyllabusSubject {
  id: string;
  name: string;
  slug: string;
  chaptersClass11: SyllabusChapter[];
  chaptersClass12: SyllabusChapter[];
}

/**
 * FBISE & Provincial Intermediate Curriculum Syllabus Map (Class 11 & 12)
 * Used across Boardly Commons, Full Book Tests, and Chapter Normalization.
 */
export const SYLLABUS_MAP: Record<string, SyllabusSubject> = {
  mathematics: {
    id: 'mathematics',
    name: 'Mathematics',
    slug: 'mathematics',
    chaptersClass11: [
      { id: 'math11-01', name: 'Number Systems', classLevel: '11', weight: 8 },
      { id: 'math11-02', name: 'Sets, Functions & Groups', classLevel: '11', weight: 10 },
      { id: 'math11-03', name: 'Matrices & Determinants', classLevel: '11', weight: 14 },
      { id: 'math11-04', name: 'Quadratic Equations', classLevel: '11', weight: 12 },
      { id: 'math11-05', name: 'Partial Fractions', classLevel: '11', weight: 8 },
      { id: 'math11-06', name: 'Sequences & Series', classLevel: '11', weight: 14 },
      { id: 'math11-07', name: 'Permutation, Combination & Probability', classLevel: '11', weight: 14 },
      { id: 'math11-08', name: 'Mathematical Induction & Binomial Theorem', classLevel: '11', weight: 12 },
      { id: 'math11-09', name: 'Fundamentals of Trigonometry', classLevel: '11', weight: 10 },
      { id: 'math11-10', name: 'Trigonometric Identities & Formulas', classLevel: '11', weight: 12 },
      { id: 'math11-11', name: 'Trigonometric Functions & Graphs', classLevel: '11', weight: 8 },
      { id: 'math11-12', name: 'Application of Trigonometry', classLevel: '11', weight: 10 },
      { id: 'math11-13', name: 'Inverse Trigonometric Functions', classLevel: '11', weight: 8 },
      { id: 'math11-14', name: 'Solutions of Trigonometric Equations', classLevel: '11', weight: 8 },
    ],
    chaptersClass12: [
      { id: 'math12-01', name: 'Functions & Limits', classLevel: '12', weight: 14 },
      { id: 'math12-02', name: 'Differentiation & Derivatives', classLevel: '12', weight: 18 },
      { id: 'math12-03', name: 'Integration & Definite Integrals', classLevel: '12', weight: 20 },
      { id: 'math12-04', name: 'Introduction to Analytic Geometry', classLevel: '12', weight: 14 },
      { id: 'math12-05', name: 'Linear Inequalities & Linear Programming', classLevel: '12', weight: 10 },
      { id: 'math12-06', name: 'Conic Sections (Circle, Parabola, Ellipse, Hyperbola)', classLevel: '12', weight: 16 },
      { id: 'math12-07', name: 'Vectors & Scalar Triple Product', classLevel: '12', weight: 14 },
    ],
  },
  physics: {
    id: 'physics',
    name: 'Physics',
    slug: 'physics',
    chaptersClass11: [
      { id: 'phy11-01', name: 'Measurements & Physical Quantities', classLevel: '11', weight: 8 },
      { id: 'phy11-02', name: 'Vectors & Equilibrium', classLevel: '11', weight: 14 },
      { id: 'phy11-03', name: 'Motion & Force (Kinematics & Dynamics)', classLevel: '11', weight: 16 },
      { id: 'phy11-04', name: 'Work, Power & Energy', classLevel: '11', weight: 12 },
      { id: 'phy11-05', name: 'Circular & Rotational Motion', classLevel: '11', weight: 14 },
      { id: 'phy11-06', name: 'Fluid Dynamics & Bernoulli Theorem', classLevel: '11', weight: 8 },
      { id: 'phy11-07', name: 'Oscillations & Simple Harmonic Motion', classLevel: '11', weight: 12 },
      { id: 'phy11-08', name: 'Waves & Sound (Doppler Effect)', classLevel: '11', weight: 12 },
      { id: 'phy11-09', name: 'Physical Optics (Interference & Diffraction)', classLevel: '11', weight: 10 },
      { id: 'phy11-10', name: 'Thermodynamics & Heat Engines', classLevel: '11', weight: 12 },
    ],
    chaptersClass12: [
      { id: 'phy12-01', name: 'Electrostatics & Coulomb Law', classLevel: '12', weight: 14 },
      { id: 'phy12-02', name: 'Current Electricity & Kirchhoff Rules', classLevel: '12', weight: 14 },
      { id: 'phy12-03', name: 'Electromagnetism & Ampere Law', classLevel: '12', weight: 14 },
      { id: 'phy12-04', name: 'Electromagnetic Induction & Faraday Law', classLevel: '12', weight: 14 },
      { id: 'phy12-05', name: 'Alternating Current (AC Circuits & Resonance)', classLevel: '12', weight: 12 },
      { id: 'phy12-06', name: 'Physics of Solids & Semiconductors', classLevel: '12', weight: 10 },
      { id: 'phy12-07', name: 'Electronics (Diodes, Transistors, OP-AMP)', classLevel: '12', weight: 12 },
      { id: 'phy12-08', name: 'Dawn of Modern Physics (Photoelectric Effect)', classLevel: '12', weight: 12 },
      { id: 'phy12-09', name: 'Atomic Spectra & Bohr Model', classLevel: '12', weight: 10 },
      { id: 'phy12-10', name: 'Nuclear Physics & Radioactivity', classLevel: '12', weight: 12 },
    ],
  },
  chemistry: {
    id: 'chemistry',
    name: 'Chemistry',
    slug: 'chemistry',
    chaptersClass11: [
      { id: 'chem11-01', name: 'Basic Chemical Concepts & Stoichiometry', classLevel: '11', weight: 12 },
      { id: 'chem11-02', name: 'Experimental Techniques in Chemistry', classLevel: '11', weight: 6 },
      { id: 'chem11-03', name: 'Gases & Kinetic Molecular Theory', classLevel: '11', weight: 12 },
      { id: 'chem11-04', name: 'Liquids & Solids', classLevel: '11', weight: 12 },
      { id: 'chem11-05', name: 'Atomic Structure & Quantum Numbers', classLevel: '11', weight: 14 },
      { id: 'chem11-06', name: 'Chemical Bonding & Molecular Shapes', classLevel: '11', weight: 14 },
      { id: 'chem11-07', name: 'Thermochemistry & Hess Law', classLevel: '11', weight: 10 },
      { id: 'chem11-08', name: 'Chemical Equilibrium & Le Chatelier', classLevel: '11', weight: 12 },
      { id: 'chem11-09', name: 'Solutions & Colligative Properties', classLevel: '11', weight: 10 },
      { id: 'chem11-10', name: 'Electrochemistry & Oxidation-Reduction', classLevel: '11', weight: 12 },
      { id: 'chem11-11', name: 'Reaction Kinetics & Catalysis', classLevel: '11', weight: 10 },
    ],
    chaptersClass12: [
      { id: 'chem12-01', name: 'Periodic Classification & Periodicity', classLevel: '12', weight: 10 },
      { id: 'chem12-02', name: 's-Block Elements (Alkali & Alkaline Earth)', classLevel: '12', weight: 8 },
      { id: 'chem12-03', name: 'Group IIIA and Group IVA Elements', classLevel: '12', weight: 10 },
      { id: 'chem12-04', name: 'Group VA and Group VIA Elements', classLevel: '12', weight: 10 },
      { id: 'chem12-05', name: 'The Halogens & The Noble Gases', classLevel: '12', weight: 8 },
      { id: 'chem12-06', name: 'Transition Elements & Coordination Complexes', classLevel: '12', weight: 12 },
      { id: 'chem12-07', name: 'Fundamental Principles of Organic Chemistry', classLevel: '12', weight: 14 },
      { id: 'chem12-08', name: 'Aliphatic Hydrocarbons (Alkanes, Alkenes, Alkynes)', classLevel: '12', weight: 14 },
      { id: 'chem12-09', name: 'Aromatic Hydrocarbons & Benzene', classLevel: '12', weight: 14 },
      { id: 'chem12-10', name: 'Alkyl Halides & Nucleophilic Substitution', classLevel: '12', weight: 12 },
      { id: 'chem12-11', name: 'Alcohols, Phenols & Ethers', classLevel: '12', weight: 12 },
      { id: 'chem12-12', name: 'Aldehydes & Ketones (Carbonyl Compounds)', classLevel: '12', weight: 14 },
      { id: 'chem12-13', name: 'Carboxylic Acids & Derivatives', classLevel: '12', weight: 12 },
      { id: 'chem12-14', name: 'Macromolecules & Polymers', classLevel: '12', weight: 8 },
      { id: 'chem12-15', name: 'Common Chemical Industries in Pakistan', classLevel: '12', weight: 6 },
      { id: 'chem12-16', name: 'Environmental Chemistry & Pollution', classLevel: '12', weight: 6 },
    ],
  },
  biology: {
    id: 'biology',
    name: 'Biology',
    slug: 'biology',
    chaptersClass11: [
      { id: 'bio11-01', name: 'Introduction to Biology & Molecules', classLevel: '11', weight: 10 },
      { id: 'bio11-02', name: 'Biological Molecules (Proteins, Lipids, Carbohydrates)', classLevel: '11', weight: 14 },
      { id: 'bio11-03', name: 'Enzymes & Catalytic Action', classLevel: '11', weight: 12 },
      { id: 'bio11-04', name: 'The Cell & Organelles', classLevel: '11', weight: 16 },
      { id: 'bio11-05', name: 'Variety of Life (Viruses & Classification)', classLevel: '11', weight: 10 },
      { id: 'bio11-06', name: 'Kingdom Prokaryotae (Bacteria)', classLevel: '11', weight: 10 },
      { id: 'bio11-07', name: 'Kingdom Protista & Fungi', classLevel: '11', weight: 10 },
      { id: 'bio11-08', name: 'Kingdom Plantae (Bryophytes & Tracheophytes)', classLevel: '11', weight: 12 },
      { id: 'bio11-09', name: 'Kingdom Animalia (Invertebrates & Chordates)', classLevel: '11', weight: 14 },
      { id: 'bio11-10', name: 'Bioenergetics (Photosynthesis & Respiration)', classLevel: '11', weight: 16 },
      { id: 'bio11-11', name: 'Nutrition & Digestion', classLevel: '11', weight: 10 },
      { id: 'bio11-12', name: 'Gaseous Exchange & Transport', classLevel: '11', weight: 12 },
      { id: 'bio11-13', name: 'Immunity & Body Defenses', classLevel: '11', weight: 10 },
    ],
    chaptersClass12: [
      { id: 'bio12-01', name: 'Homeostasis & Osmoregulation', classLevel: '12', weight: 12 },
      { id: 'bio12-02', name: 'Support & Movement (Skeletal & Muscular)', classLevel: '12', weight: 14 },
      { id: 'bio12-03', name: 'Coordination & Control (Nervous & Endocrine)', classLevel: '12', weight: 16 },
      { id: 'bio12-04', name: 'Reproduction (Human & Plant)', classLevel: '12', weight: 14 },
      { id: 'bio12-05', name: 'Growth & Development', classLevel: '12', weight: 10 },
      { id: 'bio12-06', name: 'Chromosomes & DNA', classLevel: '12', weight: 16 },
      { id: 'bio12-07', name: 'Cell Cycle & Cell Division', classLevel: '12', weight: 12 },
      { id: 'bio12-08', name: 'Variation & Genetics (Mendelian Laws)', classLevel: '12', weight: 16 },
      { id: 'bio12-09', name: 'Biotechnology & Genetic Engineering', classLevel: '12', weight: 12 },
      { id: 'bio12-10', name: 'Evolution & Population Genetics', classLevel: '12', weight: 10 },
      { id: 'bio12-11', name: 'Ecosystem & Environmental Biology', classLevel: '12', weight: 10 },
    ],
  },
  'computer-science': {
    id: 'computer-science',
    name: 'Computer Science',
    slug: 'computer-science',
    chaptersClass11: [
      { id: 'cs11-01', name: 'Basics of Information Technology', classLevel: '11', weight: 12 },
      { id: 'cs11-02', name: 'Information Networks & Topologies', classLevel: '11', weight: 14 },
      { id: 'cs11-03', name: 'Data Communications & Transmission Media', classLevel: '11', weight: 14 },
      { id: 'cs11-04', name: 'Applications & Uses of Computers', classLevel: '11', weight: 10 },
      { id: 'cs11-05', name: 'Computer Architecture & CPU Buses', classLevel: '11', weight: 16 },
      { id: 'cs11-06', name: 'Security, Copyright & Cyber Ethics', classLevel: '11', weight: 10 },
      { id: 'cs11-07', name: 'Operating System Fundamentals & Windows', classLevel: '11', weight: 12 },
      { id: 'cs11-08', name: 'Word Processing & Spreadsheets', classLevel: '11', weight: 8 },
    ],
    chaptersClass12: [
      { id: 'cs12-01', name: 'Data Basics & Database Concepts', classLevel: '12', weight: 14 },
      { id: 'cs12-02', name: 'Basic Concepts and Terminology of Databases', classLevel: '12', weight: 12 },
      { id: 'cs12-03', name: 'Database Development Process & Normalization', classLevel: '12', weight: 16 },
      { id: 'cs12-04', name: 'Introduction to MS Access / SQL', classLevel: '12', weight: 12 },
      { id: 'cs12-05', name: 'Getting Started with C / C++ Programming', classLevel: '12', weight: 14 },
      { id: 'cs12-06', name: 'Elements of C (Data Types & Operators)', classLevel: '12', weight: 14 },
      { id: 'cs12-07', name: 'Input and Output (scanf, printf)', classLevel: '12', weight: 10 },
      { id: 'cs12-08', name: 'Decision Constructs (if-else, switch)', classLevel: '12', weight: 16 },
      { id: 'cs12-09', name: 'Loop Constructs (while, for, do-while)', classLevel: '12', weight: 16 },
      { id: 'cs12-10', name: 'Functions in C & Scope of Variables', classLevel: '12', weight: 14 },
      { id: 'cs12-11', name: 'File Handling in C', classLevel: '12', weight: 10 },
    ],
  },
  english: {
    id: 'english',
    name: 'English',
    slug: 'english',
    chaptersClass11: [
      { id: 'eng11-01', name: 'Subject-Verb Agreement', classLevel: '11', weight: 16 },
      { id: 'eng11-02', name: 'Tenses & Conditionals', classLevel: '11', weight: 18 },
      { id: 'eng11-03', name: 'Prepositions & Phrasal Verbs', classLevel: '11', weight: 16 },
      { id: 'eng11-04', name: 'Vocabulary, Synonyms & Antonyms', classLevel: '11', weight: 20 },
      { id: 'eng11-05', name: 'Reading Comprehension & Inferences', classLevel: '11', weight: 20 },
      { id: 'eng11-06', name: 'Punctuation & Capitalization', classLevel: '11', weight: 10 },
    ],
    chaptersClass12: [
      { id: 'eng12-01', name: 'Sentence Correction & Dangling Modifiers', classLevel: '12', weight: 20 },
      { id: 'eng12-02', name: 'Parallel Structure & Conjunctions', classLevel: '12', weight: 18 },
      { id: 'eng12-03', name: 'Direct & Indirect Speech', classLevel: '12', weight: 14 },
      { id: 'eng12-04', name: 'Active & Passive Voice', classLevel: '12', weight: 14 },
      { id: 'eng12-05', name: 'Advanced Analytical & Contextual Vocabulary', classLevel: '12', weight: 20 },
      { id: 'eng12-06', name: 'Passage Logic & Critical Reading', classLevel: '12', weight: 18 },
    ],
  },
};

export const COMMONS_TARGET_OPTIONS = [
  // University Entry Tests
  { id: 'FAST-NUCES', label: 'FAST-NUCES (CS & Engineering)', category: 'University Test' },
  { id: 'NUST NET', label: 'NUST NET (Engineering & Computing)', category: 'University Test' },
  { id: 'GIKI', label: 'GIKI Entrance Test', category: 'University Test' },
  { id: 'MDCAT', label: 'PM&DC MDCAT (Medical & Dental)', category: 'University Test' },
  { id: 'ECAT', label: 'UET ECAT (Punjab Engineering)', category: 'University Test' },
  { id: 'PIEAS', label: 'PIEAS Admission Test', category: 'University Test' },
  { id: 'COMSATS', label: 'COMSATS (NTS NAT-IE)', category: 'University Test' },
  { id: 'LUMS', label: 'LUMS SSE / LCAT', category: 'University Test' },
  { id: 'NED', label: 'NED UET Karachi', category: 'University Test' },
  // BS Undergraduate Tracks
  { id: 'BS Computer Science', label: 'BS Computer Science (HEC Curriculum)', category: 'BS Program' },
  { id: 'BS Software Engineering', label: 'BS Software Engineering', category: 'BS Program' },
  { id: 'BS Electrical Engineering', label: 'BS Electrical Engineering', category: 'BS Program' },
  { id: 'BS Mathematics', label: 'BS Mathematics', category: 'BS Program' },
  { id: 'BS Physics', label: 'BS Physics', category: 'BS Program' },
  { id: 'BS Chemistry', label: 'BS Chemistry', category: 'BS Program' },
  { id: 'BS Biology', label: 'BS Biology / Biotechnology', category: 'BS Program' },
  // Intermediate Boards
  { id: 'FBISE Class 11', label: 'FBISE Class 11 (HSSC-I)', category: 'Intermediate' },
  { id: 'FBISE Class 12', label: 'FBISE Class 12 (HSSC-II)', category: 'Intermediate' },
  { id: 'Punjab Board HSSC', label: 'Punjab Board (HSSC-I & II)', category: 'Intermediate' },
  { id: 'Sindh Board HSC', label: 'Sindh Board (HSC-I & II)', category: 'Intermediate' },
  { id: 'General', label: 'General / All Targets', category: 'General' },
];

export function getAllChaptersForSubject(subjectKey: string): SyllabusChapter[] {
  const normKey = subjectKey.toLowerCase().trim();
  const sub = SYLLABUS_MAP[normKey] || SYLLABUS_MAP['mathematics'];
  return [...sub.chaptersClass11, ...sub.chaptersClass12];
}

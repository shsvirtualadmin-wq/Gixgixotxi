export interface TCATTopic {
  id: string;
  name: string;
  subtopics: string;
  isHighYield?: boolean;
}

export interface TCATSubjectConfig {
  id: string;
  name: string;
  iconName: string;
  mcqCount: number; // e.g. 30 or 10
  weightagePercent: number; // e.g. 30 or 10
  badgeColor: string;
  description: string;
  topics: TCATTopic[];
}

export interface TCATGroupCombination {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  subjects: string[]; // Subject names included in this combination
}

export const TCAT_GROUPS: TCATGroupCombination[] = [
  {
    id: 'pre-engineering',
    title: 'Pre-Engineering Group',
    subtitle: 'Math, Physics, Chemistry & English',
    badge: 'Standard Engineering',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
  },
  {
    id: 'ics-physics',
    title: 'Pre-Engineering / CS (ICS Physics)',
    subtitle: 'Math, Physics, Computer Science & English',
    badge: 'CS & Software Track',
    subjects: ['Mathematics', 'Physics', 'Computer Science', 'English'],
  },
  {
    id: 'ics-stats',
    title: 'ICS Statistics Group',
    subtitle: 'Math, Statistics, Computer Science & English',
    badge: 'Data Science & Math',
    subjects: ['Mathematics', 'Statistics', 'Computer Science', 'English'],
  },
  {
    id: 'pre-medical',
    title: 'Pre-Medical to Engineering',
    subtitle: 'Biology, Physics, Chemistry & English',
    badge: 'Bio-Medical & Chem Engg',
    subjects: ['Biology', 'Physics', 'Chemistry', 'English'],
  },
  {
    id: 'stats-physics',
    title: 'Statistics & Physics Group',
    subtitle: 'Math, Statistics, Physics & English',
    badge: 'Applied Physics & Stats',
    subjects: ['Mathematics', 'Statistics', 'Physics', 'English'],
  },
];

export const TCAT_SUBJECTS: TCATSubjectConfig[] = [
  {
    id: 'math',
    name: 'Mathematics',
    iconName: 'Calculator',
    mcqCount: 30,
    weightagePercent: 30,
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'FSc Part I & II (Punjab/Federal Board Syllabus)',
    topics: [
      { id: 'tcat-math-1', name: 'Number Systems', subtopics: 'Real & complex numbers, field axioms, modulus & polar representation', isHighYield: true },
      { id: 'tcat-math-2', name: 'Sets Functions and Groups', subtopics: 'Sets, operations, relations, functions, domain & range, binary operations, groups', isHighYield: true },
      { id: 'tcat-math-3', name: 'Matrices and Determinants', subtopics: 'Types of matrices, determinant, inverse, Cramer rule, system of linear equations', isHighYield: true },
      { id: 'tcat-math-4', name: 'Quadratic Equations', subtopics: 'Solution methods, nature of roots, cube roots of unity, synthetic division', isHighYield: true },
      { id: 'tcat-math-5', name: 'Partial Fractions', subtopics: 'Resolution into partial fractions for proper & improper rational fractions', isHighYield: false },
      { id: 'tcat-math-6', name: 'Sequences and Series', subtopics: 'Arithmetic, Geometric & Harmonic progressions, sum formulas, infinite series', isHighYield: true },
      { id: 'tcat-math-7', name: 'Permutation Combination and Probability', subtopics: 'Fundamental principle, nPr, nCr, probability laws, sample space', isHighYield: true },
      { id: 'tcat-math-8', name: 'Mathematical Induction and Binomial Theorem', subtopics: 'Principle of mathematical induction, binomial expansion, general term', isHighYield: false },
      { id: 'tcat-math-9', name: 'Fundamentals of Trigonometry', subtopics: 'Angles, sexagesimal & circular units, arc length, trigonometric ratios', isHighYield: true },
      { id: 'tcat-math-10', name: 'Trigonometric Identities', subtopics: 'Fundamental identities, sum/difference formulas, double & half angle formulas', isHighYield: true },
      { id: 'tcat-math-11', name: 'Trigonometric Functions and Graphs', subtopics: 'Domain, range, period & graphs of trigonometric functions', isHighYield: false },
      { id: 'tcat-math-12', name: 'Application of Trigonometry', subtopics: 'Laws of sines, cosines, tangents, area of triangle, radii of circles', isHighYield: true },
      { id: 'tcat-math-13', name: 'Functions and Limits', subtopics: 'Types of functions, limits, limit theorems, continuity', isHighYield: true },
      { id: 'tcat-math-14', name: 'Differentiation', subtopics: 'Derivatives of algebraic, trigonometric, exponential & logarithmic functions, chain rule', isHighYield: true },
      { id: 'tcat-math-15', name: 'Integration', subtopics: 'Indefinite & definite integrals, integration by parts, substitution, area under curve', isHighYield: true },
      { id: 'tcat-math-16', name: 'Introduction to Analytic Geometry', subtopics: 'Distance formula, ratio formula, slope, equations of straight line, angle between lines', isHighYield: true },
      { id: 'tcat-math-17', name: 'Linear Inequalities and Linear Programming', subtopics: 'Linear inequalities in two variables, feasible region, corner points & optimization', isHighYield: false },
      { id: 'tcat-math-18', name: 'Conic Sections', subtopics: 'Circle, Parabola, Ellipse, Hyperbola equations, foci, directrix & tangents', isHighYield: true },
      { id: 'tcat-math-19', name: 'Vectors', subtopics: 'Vectors in 2D & 3D, dot product, cross product, scalar & vector triple product', isHighYield: true },
    ],
  },
  {
    id: 'physics',
    name: 'Physics',
    iconName: 'Zap',
    mcqCount: 30,
    weightagePercent: 30,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'FSc Part I & II (Punjab/Federal Board Syllabus)',
    topics: [
      { id: 'tcat-phy-1', name: 'Measurements', subtopics: 'SI units, dimensions, scientific notation, significant figures, errors & uncertainties', isHighYield: false },
      { id: 'tcat-phy-2', name: 'Vectors and Equilibrium', subtopics: 'Vector addition, rectangular components, dot product, cross product, torque, equilibrium conditions', isHighYield: true },
      { id: 'tcat-phy-3', name: 'Motion and Force', subtopics: "Displacement, velocity, acceleration, Newton's laws, momentum, impulse, projectile motion", isHighYield: true },
      { id: 'tcat-phy-4', name: 'Work and Energy', subtopics: 'Work done by constant & variable forces, kinetic energy, potential energy, power, energy conservation', isHighYield: true },
      { id: 'tcat-phy-5', name: 'Circular Motion', subtopics: 'Angular velocity, centripetal acceleration & force, geostationary satellites, moment of inertia', isHighYield: true },
      { id: 'tcat-phy-6', name: 'Fluid Dynamics', subtopics: 'Viscosity, terminal velocity, equation of continuity, Bernoulli equation', isHighYield: false },
      { id: 'tcat-phy-7', name: 'Oscillations', subtopics: 'Simple Harmonic Motion (SHM), simple pendulum, energy conservation in SHM, resonance, damping', isHighYield: true },
      { id: 'tcat-phy-8', name: 'Waves', subtopics: 'Transverse & longitudinal waves, speed of sound, Laplace correction, Doppler effect, stationary waves', isHighYield: true },
      { id: 'tcat-phy-9', name: 'Thermodynamics', subtopics: 'Kinetic theory of gases, First Law, Heat capacity, Second Law, Carnot engine, Entropy', isHighYield: true },
      { id: 'tcat-phy-10', name: 'Electrostatics', subtopics: "Coulomb's Law, Electric field intensity, Gauss's Law, Electric potential, Capacitors", isHighYield: true },
      { id: 'tcat-phy-11', name: 'Current Electricity', subtopics: "Ohm's Law, Resistivity, Temperature dependence, Kirchhoff's Rules, Wheatstone Bridge, Potentiometer", isHighYield: true },
      { id: 'tcat-phy-12', name: 'Electromagnetism', subtopics: 'Magnetic field, force on current-carrying conductor, Lorentz force, Ampere law, e/m ratio of electron', isHighYield: true },
      { id: 'tcat-phy-13', name: 'Electromagnetic Induction', subtopics: "Faraday's Law, Lenz's Law, Induced EMF, Mutual & Self Induction, AC Generator, Transformer", isHighYield: true },
      { id: 'tcat-phy-14', name: 'Alternating Current', subtopics: 'Peak & RMS values, AC through resistor, capacitor & inductor, RLC series circuit, Resonance', isHighYield: true },
      { id: 'tcat-phy-15', name: 'Electromagnetic Waves', subtopics: 'Generation & propagation of EM waves, spectrum, energy transmission', isHighYield: false },
      { id: 'tcat-phy-16', name: 'Physics of Solids', subtopics: 'Crystalline & amorphous solids, Stress, Strain, Moduli of elasticity, Energy band theory', isHighYield: false },
      { id: 'tcat-phy-17', name: 'Electronics', subtopics: 'p-n junction, Rectification, Transistor characteristics & amplifier, Operational Amplifier (Op-Amp)', isHighYield: true },
      { id: 'tcat-phy-18', name: 'Dawn of Modern Physics', subtopics: 'Reference frames, Photoelectric effect, Compton effect, Pair production, De Broglie wavelength', isHighYield: true },
      { id: 'tcat-phy-19', name: 'Atomic Spectra', subtopics: 'Bohr model of hydrogen atom, Spectral series, De Broglie interpretation, X-rays, Lasers', isHighYield: true },
      { id: 'tcat-phy-20', name: 'Nuclear Physics', subtopics: 'Mass defect & binding energy, Radioactivity, Half-life, Nuclear fission & fusion, Radiation detectors', isHighYield: true },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    iconName: 'FlaskConical',
    mcqCount: 30,
    weightagePercent: 30,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'FSc Part I & II (Punjab/Federal Board Syllabus)',
    topics: [
      { id: 'tcat-chem-1', name: 'Basic Concepts of Chemistry', subtopics: 'Atom, molecule, mole, Avogadro number, stoichiometry, limiting reactant', isHighYield: true },
      { id: 'tcat-chem-2', name: 'Experimental Techniques', subtopics: 'Filtration, crystallization, sublimation, solvent extraction, chromatography', isHighYield: false },
      { id: 'tcat-chem-3', name: 'Gases, Liquids and Solids', subtopics: 'Gas laws, ideal gas equation, Graham law, kinetic molecular theory, intermolecular forces, crystal lattices', isHighYield: true },
      { id: 'tcat-chem-4', name: 'Atomic Structure', subtopics: 'Subatomic particles, Planck quantum theory, Bohr model, quantum numbers, electronic configuration', isHighYield: true },
      { id: 'tcat-chem-5', name: 'Chemical Bonding', subtopics: 'Ionic & covalent bonding, VSEPR theory, Hybridization (sp, sp2, sp3), Molecular Orbital Theory (MOT)', isHighYield: true },
      { id: 'tcat-chem-6', name: 'Thermochemistry', subtopics: 'Enthalpy, standard states, Hess law, Born-Haber cycle, calorimetry', isHighYield: true },
      { id: 'tcat-chem-7', name: 'Chemical Equilibrium', subtopics: 'Reversible reactions, Law of mass action, Kc & Kp, Le Chatelier principle, pH, buffers, Ksp', isHighYield: true },
      { id: 'tcat-chem-8', name: 'Reaction Kinetics', subtopics: 'Rate of reaction, order of reaction, rate law, Arrhenius equation, catalysis', isHighYield: true },
      { id: 'tcat-chem-9', name: 'Electrochemistry', subtopics: 'Oxidation numbers, redox balancing, galvanic & electrolytic cells, standard electrode potential', isHighYield: true },
      { id: 'tcat-chem-10', name: 'Periodic Classification', subtopics: 'Periods & groups, atomic radius, ionization energy, electron affinity, electronegativity', isHighYield: true },
      { id: 'tcat-chem-11', name: 's and p Block Elements', subtopics: 'Group IA, IIA, IIIA, IVA, VA, VIA, VIIA elements, trends, oxides, hydrides & halides', isHighYield: true },
      { id: 'tcat-chem-12', name: 'Fundamental Principles of Organic Chemistry', subtopics: 'Functional groups, isomerism, IUPAC nomenclature, hybridization in organic molecules', isHighYield: true },
      { id: 'tcat-chem-13', name: 'Hydrocarbons', subtopics: 'Alkanes, Alkenes, Alkynes & Aromatic hydrocarbons (Benzene substitution mechanisms)', isHighYield: true },
      { id: 'tcat-chem-14', name: 'Chemistry of Life', subtopics: 'Proteins, Carbohydrates, Lipids, Enzymes, Nucleic acids (DNA/RNA)', isHighYield: false },
    ],
  },
  {
    id: 'cs',
    name: 'Computer Science',
    iconName: 'Cpu',
    mcqCount: 30,
    weightagePercent: 30,
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Fundamentals, C++ Programming, Data Structures, Logic Gates & Databases',
    topics: [
      {
        id: 'tcat-cs-1',
        name: 'Computer Fundamentals',
        subtopics: 'Hardware/software architecture, number systems (binary, hex), data representation',
        isHighYield: true,
      },
      {
        id: 'tcat-cs-2',
        name: 'Programming Fundamentals',
        subtopics: 'Variables, control structures, loops, arrays, functions, pointers & OOP concepts in C++',
        isHighYield: true,
      },
      {
        id: 'tcat-cs-3',
        name: 'Data Structures Basics',
        subtopics: 'Arrays, strings, stacks, queues, linked lists & search algorithms',
        isHighYield: true,
      },
      {
        id: 'tcat-cs-4',
        name: 'Boolean Algebra & Logic Gates',
        subtopics: 'AND, OR, NOT, NAND, NOR, XOR gates, truth tables & Boolean simplification',
        isHighYield: true,
      },
      {
        id: 'tcat-cs-5',
        name: 'Computer Networks & Internet',
        subtopics: 'Topologies, OSI 7-layer model, TCP/IP, routers, switches & network security',
        isHighYield: false,
      },
      {
        id: 'tcat-cs-6',
        name: 'Database Basics',
        subtopics: 'DBMS architecture, ER models, normalization & SQL basic queries',
        isHighYield: false,
      },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    iconName: 'Dna',
    mcqCount: 30,
    weightagePercent: 30,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Cell Biology, Physiology, Genetics & Bioenergetics (Pre-Med track)',
    topics: [
      {
        id: 'tcat-bio-1',
        name: 'Cell Biology & Bioenergetics',
        subtopics: 'Cellular structures, enzymes, ATP synthesis, glycolysis, Krebs cycle & light reactions',
        isHighYield: true,
      },
      {
        id: 'tcat-bio-2',
        name: 'Biological Molecules',
        subtopics: 'Carbohydrates, lipids, proteins, enzymes & nucleic acid structure',
        isHighYield: true,
      },
      {
        id: 'tcat-bio-3',
        name: 'Human Physiology',
        subtopics: 'Circulatory, respiratory, digestive, excretory & nervous systems',
        isHighYield: true,
      },
      {
        id: 'tcat-bio-4',
        name: 'Genetics & Biotechnology',
        subtopics: 'Mendelian inheritance, DNA replication, gene expression & recombinant DNA technology',
        isHighYield: true,
      },
      {
        id: 'tcat-bio-5',
        name: 'Support & Movement',
        subtopics: 'Human skeleton, joints, sliding filament theory of muscle contraction',
        isHighYield: false,
      },
      {
        id: 'tcat-bio-6',
        name: 'Coordination & Control',
        subtopics: 'Action potential, nerve impulses, synaptic transmission & endocrine hormones',
        isHighYield: true,
      },
      {
        id: 'tcat-bio-7',
        name: 'Reproduction & Development',
        subtopics: 'Human gametogenesis, menstrual cycle, embryonic development stages',
        isHighYield: false,
      },
      {
        id: 'tcat-bio-8',
        name: 'Evolution & Ecology',
        subtopics: 'Darwinism, natural selection, ecosystem dynamics & biogeochemical cycles',
        isHighYield: false,
      },
    ],
  },
  {
    id: 'statistics',
    name: 'Statistics',
    iconName: 'BarChart2',
    mcqCount: 30,
    weightagePercent: 30,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Descriptive Stats, Probability, Sampling, Distributions & Regression',
    topics: [
      {
        id: 'tcat-stat-1',
        name: 'Descriptive Statistics',
        subtopics: 'Mean, median, mode, variance, standard deviation & quartile range',
        isHighYield: true,
      },
      {
        id: 'tcat-stat-2',
        name: 'Probability & Distributions',
        subtopics: 'Probability rules, conditional probability, Binomial, Poisson & Normal distributions',
        isHighYield: true,
      },
      {
        id: 'tcat-stat-3',
        name: 'Sampling & Estimation',
        subtopics: 'Random sampling, point estimation, interval estimation & standard error',
        isHighYield: false,
      },
      {
        id: 'tcat-stat-4',
        name: 'Hypothesis Testing',
        subtopics: 'Null & alternative hypotheses, Z-test, t-test & Chi-square test',
        isHighYield: true,
      },
      {
        id: 'tcat-stat-5',
        name: 'Correlation & Regression',
        subtopics: 'Pearson correlation coefficient, simple linear regression line & slope estimation',
        isHighYield: true,
      },
      {
        id: 'tcat-stat-6',
        name: 'Index Numbers & Time Series',
        subtopics: 'Price index formulas (Laspeyres, Paasche), moving averages & trend estimation',
        isHighYield: false,
      },
    ],
  },
  {
    id: 'english',
    name: 'English',
    iconName: 'BookOpen',
    mcqCount: 10,
    weightagePercent: 10,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Grammar, Vocabulary, Sentence Correction, Comprehension & Analogies',
    topics: [
      { id: 'tcat-eng-1', name: 'Grammar (tenses, parts of speech, sentence structure)', subtopics: 'Tenses, subject-verb agreement, active/passive voice, direct/indirect speech, prepositions, articles', isHighYield: true },
      { id: 'tcat-eng-2', name: 'Vocabulary and Synonyms/Antonyms', subtopics: 'High-yield academic vocabulary, contextual word usage, synonyms and antonyms', isHighYield: true },
      { id: 'tcat-eng-3', name: 'Sentence Correction', subtopics: 'Identifying grammatical errors, dangling modifiers, parallel structure, punctuation', isHighYield: true },
      { id: 'tcat-eng-4', name: 'Comprehension Passages', subtopics: 'Reading passages, main idea, inference, author tone, passage-based MCQs', isHighYield: true },
      { id: 'tcat-eng-5', name: 'Analogies', subtopics: 'Word relationships, pair completion, logical semantic connections', isHighYield: true },
    ],
  },
];

export function getTCATSubjectByName(name: string): TCATSubjectConfig | undefined {
  return TCAT_SUBJECTS.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export function getTCATGroupCombination(groupId: string): TCATGroupCombination {
  return TCAT_GROUPS.find((g) => g.id === groupId) || TCAT_GROUPS[0];
}

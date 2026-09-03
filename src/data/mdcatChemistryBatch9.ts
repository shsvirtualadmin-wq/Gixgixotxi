import { Question } from '../types';

export const MDCAT_CHEMISTRY_BATCH9: Question[] = [
  // --- Fundamental Concepts of Chemistry (4 MCQs: 1 to 4) ---
  {
    id: 'mdcat-b9-chem-1',
    q: 'How many total atoms are present in 4.9 grams of pure sulfuric acid (H2SO4, molar mass = 98 g/mol)? (Avogadro\'s constant NA = 6.02 × 10²³)',
    options: [
      '2.11 × 10²³ atoms',
      '3.01 × 10²² atoms',
      '4.21 × 10²⁴ atoms',
      '6.02 × 10²² atoms'
    ],
    correct: 0,
    topic: 'Stoichiometry - Moles and Number of Atoms Calculation',
    chapter: 'Fundamental Concepts of Chemistry',
    explain: 'Moles of H2SO4 = 4.9 g / 98 g/mol = 0.05 mol. Each molecule of H2SO4 contains 7 atoms (2 H + 1 S + 4 O). Total atoms = 0.05 mol × 7 atoms/molecule × 6.02 × 10²³ = 0.35 × 6.02 × 10²³ = 2.107 × 10²³ ≈ 2.11 × 10²³ atoms.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-2',
    q: 'In the combustion of 12 grams of carbon with 16 grams of oxygen gas according to the reaction: C(s) + O2(g) → CO2(g), what is the limiting reactant and what mass of CO2 is produced?',
    options: [
      'O2 is the limiting reactant; 22 grams of CO2 are produced',
      'Carbon is the limiting reactant; 44 grams of CO2 are produced',
      'O2 is the limiting reactant; 44 grams of CO2 are produced',
      'Neither reactant is limiting; 28 grams of CO are produced'
    ],
    correct: 0,
    topic: 'Stoichiometry - Limiting Reactant and Theoretical Yield',
    chapter: 'Fundamental Concepts of Chemistry',
    explain: 'Moles of C = 12 g / 12 g/mol = 1.0 mol. Moles of O2 = 16 g / 32 g/mol = 0.50 mol. The stoichiometry is 1:1, so O2 is limiting. 0.50 mol of O2 reacts with 0.50 mol of C to form 0.50 mol of CO2. Mass of CO2 = 0.50 mol × 44 g/mol = 22 grams.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-3',
    q: 'An organic compound consists of 40.0% Carbon, 6.7% Hydrogen, and 53.3% Oxygen by mass. If its experimental molar mass is 180 g/mol, what is its molecular formula? (C=12, H=1, O=16)',
    options: [
      'C6H12O6',
      'C3H6O3',
      'CH2O',
      'C2H4O2'
    ],
    correct: 0,
    topic: 'Empirical and Molecular Formula Determination',
    chapter: 'Fundamental Concepts of Chemistry',
    explain: 'Molar ratios: C = 40.0/12 = 3.33; H = 6.7/1 = 6.7; O = 53.3/16 = 3.33. Dividing by 3.33 gives empirical formula CH2O (empirical formula mass = 12 + 2 + 16 = 30). n = Molecular mass / Empirical mass = 180 / 30 = 6. Molecular formula = (CH2O)6 = C6H12O6.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-4',
    q: 'What is the volume occupied by 5.6 g of nitrogen gas (N2, molar mass = 28 g/mol) at standard temperature and pressure (STP: 0°C and 1 atm)?',
    options: [
      '4.48 dm³ (liters)',
      '2.24 dm³ (liters)',
      '22.4 dm³ (liters)',
      '11.2 dm³ (liters)'
    ],
    correct: 0,
    topic: 'Molar Volume of Gases at STP',
    chapter: 'Fundamental Concepts of Chemistry',
    explain: 'Moles of N2 = 5.6 g / 28 g/mol = 0.20 mol. At STP, 1 mole of any ideal gas occupies 22.414 dm³. Therefore, Volume = 0.20 mol × 22.414 dm³/mol = 4.48 dm³.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Atomic Structure (4 MCQs: 5 to 8) ---
  {
    id: 'mdcat-b9-chem-5',
    q: 'According to Hund\'s Rule of Maximum Multiplicity, when filling degenerate orbitals of equal energy (such as the three 2p orbitals):',
    options: [
      'Electrons enter separate orbitals with parallel spins before any pairing occurs',
      'Electrons must completely fill one orbital with paired opposite spins before entering the next',
      'No two electrons in an atom can possess the same set of four quantum numbers',
      'Electrons occupy orbitals in increasing order of their (n + l) energy values'
    ],
    correct: 0,
    topic: 'Quantum Rules - Hund\'s Rule of Maximum Multiplicity',
    chapter: 'Atomic Structure',
    explain: 'Hund\'s rule states that for degenerate orbitals, the ground state configuration has the maximum number of unpaired electrons, all with parallel spins (minimizing inter-electronic Coulombic repulsion).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-6',
    q: 'What is the maximum number of electrons that can be accommodated in an energy level designated by principal quantum number n = 4, and how many total orbitals are present?',
    options: [
      '32 electrons and 16 orbitals',
      '16 electrons and 8 orbitals',
      '18 electrons and 9 orbitals',
      '32 electrons and 8 orbitals'
    ],
    correct: 0,
    topic: 'Quantum Numbers - Orbital and Electron Capacity',
    chapter: 'Atomic Structure',
    explain: 'For principal quantum number n: Total number of orbitals = n² = 4² = 16 orbitals (one 4s, three 4p, five 4d, and seven 4f). By the Pauli exclusion principle, each orbital holds 2 electrons with paired spins, so maximum electrons = 2n² = 2(16) = 32 electrons.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-7',
    q: 'In the line emission spectrum of atomic hydrogen, electronic transitions terminating at the ground state (n1 = 1) from higher energy levels (n2 = 2, 3, 4...) produce spectral lines in which region of the electromagnetic spectrum?',
    options: [
      'Ultraviolet region (Lyman series)',
      'Visible region (Balmer series)',
      'Infrared region (Paschen series)',
      'Far-infrared region (Pfund series)'
    ],
    correct: 0,
    topic: 'Hydrogen Spectrum - Spectral Series (Lyman Series)',
    chapter: 'Atomic Structure',
    explain: 'Transitions ending at n1 = 1 constitute the Lyman series, lying in the ultraviolet (UV) region. Balmer series (n1 = 2) lies in the visible region. Paschen (n1 = 3), Brackett (n1 = 4), and Pfund (n1 = 5) series lie in the infrared (IR) region.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-8',
    q: 'According to de Broglie\'s wave-particle duality, what is the de Broglie wavelength λ of a particle of mass m moving with velocity v?',
    options: [
      'λ = h / (m v)',
      'λ = (m v) / h',
      'λ = h c / E',
      'λ = 2 m v / h²'
    ],
    correct: 0,
    topic: 'Modern Physics and Quantum Chemistry - de Broglie Wavelength',
    chapter: 'Atomic Structure',
    explain: 'De Broglie proposed that matter exhibits wave properties with wavelength λ = h / p = h / (m v), where h is Planck\'s constant and p is linear momentum.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Gases (4 MCQs: 9 to 12) ---
  {
    id: 'mdcat-b9-chem-9',
    q: 'In the van der Waals equation for real gases: [P + (a n² / V²)] (V - n b) = n R T, what physical corrections do constants "a" and "b" account for?',
    options: [
      'Constant "a" corrects for intermolecular attractive forces; constant "b" corrects for the finite excluded co-volume of gas molecules',
      'Constant "a" corrects for molecular volume; constant "b" corrects for gravitational attraction',
      'Constant "a" corrects for kinetic energy loss; constant "b" corrects for chemical reactivity',
      'Both "a" and "b" correct for non-elastic wall collisions'
    ],
    correct: 0,
    topic: 'Real Gases - van der Waals Constants Physical Significance',
    chapter: 'Gases',
    explain: 'In the van der Waals equation, the term (a n² / V²) compensates for intermolecular attractive forces (which reduce the observed impact force against container walls), while the term (n b) accounts for the finite physical co-volume occupied by the molecules themselves (excluded volume).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-10',
    q: 'According to Graham\'s Law of Effusion, under identical conditions of temperature and pressure, the rate of effusion of methane gas (CH4, molar mass = 16 g/mol) compared to sulfur dioxide (SO2, molar mass = 64 g/mol) is:',
    options: [
      '2.0 times faster',
      '4.0 times faster',
      '0.5 times as fast',
      '1.41 times faster'
    ],
    correct: 0,
    topic: 'Gas Laws - Graham\'s Law of Diffusion and Effusion',
    chapter: 'Gases',
    explain: 'Graham\'s Law states Rate₁ / Rate₂ = √(M₂ / M₁). Rate(CH4) / Rate(SO2) = √(64 / 16) = √4 = 2.0. Methane effuses twice as fast as sulfur dioxide because its molar mass is one-fourth as large.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-11',
    q: 'A closed 10.0-liter vessel at 27°C contains a mixture of 0.20 mol of O2, 0.30 mol of N2, and 0.50 mol of Ar. If the total pressure is 2.46 atm, what is the partial pressure of nitrogen gas (N2)?',
    options: [
      '0.738 atm',
      '0.492 atm',
      '1.230 atm',
      '0.300 atm'
    ],
    correct: 0,
    topic: 'Gas Laws - Dalton\'s Law of Partial Pressures',
    chapter: 'Gases',
    explain: 'Total moles n_total = 0.20 + 0.30 + 0.50 = 1.00 mol. Mole fraction of N2 (X_N2) = 0.30 / 1.00 = 0.30. By Dalton\'s Law, P_N2 = X_N2 × P_total = 0.30 × 2.46 atm = 0.738 atm.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-12',
    q: 'Under which combination of conditions does a real gas deviate most significantly from ideal gas behavior?',
    options: [
      'High pressure and low temperature',
      'Low pressure and high temperature',
      'Low pressure and low temperature',
      'Moderate pressure at room temperature'
    ],
    correct: 0,
    topic: 'Real Gases - Deviations from Ideality',
    chapter: 'Gases',
    explain: 'Real gases deviate most from ideal behavior at high pressure (molecules are forced close together, making their finite excluded volume significant) and low temperature (molecular kinetic energy drops, allowing intermolecular attractive forces to become dominant).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Liquids and Solids (4 MCQs: 13 to 16) ---
  {
    id: 'mdcat-b9-chem-13',
    q: 'Water exhibits an anomalous density maximum at 4°C because:',
    options: [
      'Below 4°C, hydrogen bonds organize water molecules into an open cage-like hexagonal lattice with increased volume and lower density',
      'Covalent O-H bonds elongate due to vibrational resonance',
      'Water decomposes into hydronium and hydroxide ions below 4°C',
      'Surface tension collapses all micro-air pockets within liquid water'
    ],
    correct: 0,
    topic: 'Liquids - Anomalous Behavior of Water at 4°C',
    chapter: 'Liquids and Solids',
    explain: 'Upon cooling below 4°C, water molecules form a rigid, open, cage-like hexagonal hydrogen-bonded framework (ice structure). This expansion increases volume and decreases density, allowing ice (density ~0.92 g/cm³) to float on liquid water.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-14',
    q: 'In crystal lattice crystallography, how many equivalent atoms belong strictly to a single unit cell of a Face-Centered Cubic (FCC) metal crystal (such as copper or gold)?',
    options: [
      '4 atoms (8 corner atoms × 1/8 + 6 face atoms × 1/2)',
      '2 atoms (8 corner atoms × 1/8 + 1 body center atom)',
      '1 atom (8 corner atoms × 1/8)',
      '6 atoms (6 face atoms × 1)'
    ],
    correct: 0,
    topic: 'Solids - Face-Centered Cubic (FCC) Unit Cell Stoichiometry',
    chapter: 'Liquids and Solids',
    explain: 'In an FCC unit cell: 8 corners contribute 8 × 1/8 = 1 atom; 6 faces contribute 6 × 1/2 = 3 atoms. Total atoms per FCC unit cell = 1 + 3 = 4 atoms. Its coordination number is 12, with a high packing efficiency of 74%.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-15',
    q: 'Why does diamond possess an extraordinarily high melting point (>3500°C) and hardness compared to graphite?',
    options: [
      'Each carbon atom is sp³ hybridized and covalently bonded to 4 neighboring carbons in a rigid, 3D tetrahedral network lattice',
      'It contains delocalized pi electrons that conduct thermal phonons',
      'It is held together exclusively by strong inter-layer ionic bonds',
      'It contains close-packed metallic bonds between carbon cations'
    ],
    correct: 0,
    topic: 'Solids - Covalent Network Solids (Diamond vs Graphite)',
    chapter: 'Liquids and Solids',
    explain: 'In diamond, every carbon atom undergoes sp³ hybridization, forming four strong covalent sigma bonds (bond length 1.54 Å) oriented tetrahedrally in a continuous 3D giant macromolecular network, requiring immense thermal energy to break.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-16',
    q: 'Liquid crystals (such as cholesteric and nematic mesophases) are unique states of matter that flow like liquids while simultaneously exhibiting:',
    options: [
      'Anisotropic optical properties and orientational molecular order characteristic of crystalline solids',
      'Infinite thermal and electrical superconductivity',
      'Zero surface tension and zero dynamic viscosity',
      'Complete lack of vapor pressure at all temperatures'
    ],
    correct: 0,
    topic: 'Liquids - Properties and Applications of Liquid Crystals',
    chapter: 'Liquids and Solids',
    explain: 'Liquid crystals exist in an intermediate mesomorphic phase between isotropic liquid and crystalline solid. They possess fluidity yet maintain long-range orientational order, giving them anisotropic optical properties (birefringence) utilized in LCD displays.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Chemical Energetics (4 MCQs: 17 to 20) ---
  {
    id: 'mdcat-b9-chem-17',
    q: 'What is the standard enthalpy of formation (ΔHf°) assigned by thermodynamic convention to pure elements in their most stable reference allotropic state at 298 K and 1 bar (such as graphite, O2 gas, or liquid Br2)?',
    options: [
      'Exactly zero (0 kJ/mol)',
      '+100 kJ/mol',
      '-285.8 kJ/mol',
      'Variable depending on atmospheric humidity'
    ],
    correct: 0,
    topic: 'Thermochemistry - Standard Enthalpy of Formation of Elements Convention',
    chapter: 'Chemical Energetics',
    explain: 'By IUPAC thermodynamic convention, the standard enthalpy of formation (ΔHf°) of any chemical element in its most thermodynamically stable standard state at 298.15 K and 1 bar is defined as zero. For carbon, graphite is assigned ΔHf° = 0 kJ/mol (whereas diamond has ΔHf° = +1.9 kJ/mol).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-18',
    q: 'A chemical reaction has a positive standard enthalpy change (ΔH° > 0, endothermic) and a positive standard entropy change (ΔS° > 0). Under what temperature conditions will this reaction be thermodynamically spontaneous (ΔG° < 0)?',
    options: [
      'At high temperatures only (when T ΔS° > ΔH°)',
      'At low temperatures only',
      'Spontaneous at all temperatures',
      'Non-spontaneous at all temperatures'
    ],
    correct: 0,
    topic: 'Thermodynamics - Gibbs Free Energy and Spontaneity Conditions',
    chapter: 'Chemical Energetics',
    explain: 'From the Gibbs-Helmholtz equation ΔG° = ΔH° - T ΔS°: when ΔH° > 0 and ΔS° > 0, ΔG° is positive at low T, but becomes negative (spontaneous) at high temperatures where the favorable -T ΔS° term exceeds ΔH° in magnitude.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-19',
    q: 'Using a bomb calorimeter, the heat of combustion measured at constant volume (q_v) represents which thermodynamic quantity?',
    options: [
      'Change in internal energy (ΔU or ΔE)',
      'Change in enthalpy (ΔH)',
      'Gibbs free energy change (ΔG)',
      'Change in system entropy (ΔS)'
    ],
    correct: 0,
    topic: 'Thermochemistry - Bomb Calorimetry and Internal Energy (ΔU)',
    chapter: 'Chemical Energetics',
    explain: 'In a bomb calorimeter, the steel reaction vessel has a fixed rigid volume (ΔV = 0). Because expansion work w = -P ΔV = 0, the first law of thermodynamics (ΔU = q + w) dictates that q_v = ΔU (change in internal energy). In contrast, a coffee-cup calorimeter operates at constant pressure and measures q_p = ΔH.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-20',
    q: 'In the Born-Haber cycle for the formation of crystalline sodium chloride (NaCl), which energetic step has a negative sign (releases energy)?',
    options: [
      'Lattice energy (condensation of gaseous Na⁺ and Cl⁻ ions to form solid NaCl)',
      'Enthalpy of sublimation of metallic sodium',
      'First ionization energy of gaseous sodium atoms',
      'Bond dissociation enthalpy of diatomic chlorine gas'
    ],
    correct: 0,
    topic: 'Thermochemistry - Born-Haber Cycle and Lattice Energy',
    chapter: 'Chemical Energetics',
    explain: 'Sublimation of Na(s) → Na(g), ionization of Na(g) → Na⁺(g) + e⁻, and dissociation of 1/2 Cl2(g) → Cl(g) all require energy input (endothermic, ΔH > 0). Electron affinity of Cl and lattice formation energy [Na⁺(g) + Cl⁻(g) → NaCl(s)] are exothermic (ΔH < 0, energy released).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Chemical Equilibrium (4 MCQs: 21 to 24) ---
  {
    id: 'mdcat-b9-chem-21',
    q: 'For the reversible Haber-Bosch synthesis of ammonia: N2(g) + 3H2(g) ⇌ 2NH3(g) (ΔH = -92 kJ/mol), according to Le Chatelier\'s principle, which operational conditions maximize the equilibrium yield of NH3?',
    options: [
      'High pressure and low temperature',
      'Low pressure and high temperature',
      'High pressure and high temperature',
      'Low pressure and low temperature'
    ],
    correct: 0,
    topic: 'Chemical Equilibrium - Le Chatelier\'s Principle in Haber Process',
    chapter: 'Chemical Equilibrium',
    explain: 'Forward reaction produces fewer moles of gas (4 moles reactants → 2 moles product), so increasing pressure shifts equilibrium forward. Because the reaction is exothermic (ΔH < 0), lowering temperature shifts equilibrium toward products. In industry, a compromise temperature (~450°C with Fe catalyst) balances yield and kinetic rate.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-22',
    q: 'For a general gaseous reaction, what is the mathematical relationship between the equilibrium constants Kp and Kc?',
    options: [
      'Kp = Kc (R T)^(Δn)',
      'Kc = Kp (R T)^(Δn)',
      'Kp = Kc / (R T)',
      'Kp = Kc + Δn R T'
    ],
    correct: 0,
    topic: 'Chemical Equilibrium - Relationship Between Kp and Kc',
    chapter: 'Chemical Equilibrium',
    explain: 'Using the ideal gas law P = (n/V) R T = [C] R T, substitution into the equilibrium expression gives Kp = Kc (R T)^(Δn), where Δn = (moles of gaseous products) - (moles of gaseous reactants). When Δn = 0, Kp = Kc.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-23',
    q: 'For a sparingly soluble salt of type A2B3 (such as bismuth(III) sulfide, Bi2S3, or aluminum hydroxide salt analogs) having molar solubility S mol/L in pure water, what is the algebraic expression for its solubility product constant (Ksp)?',
    options: [
      'Ksp = 108 S⁵',
      'Ksp = 27 S⁴',
      'Ksp = 6 S⁵',
      'Ksp = 4 S³'
    ],
    correct: 0,
    topic: 'Solubility Product - Ksp Calculation for A2B3 Sparingly Soluble Salts',
    chapter: 'Chemical Equilibrium',
    explain: 'Dissociation: A2B3(s) ⇌ 2A³⁺(aq) + 3B²⁻(aq). If solubility is S mol/L, then [A³⁺] = 2S and [B²⁻] = 3S. Ksp = [A³⁺]² [B²⁻]³ = (2S)² (3S)³ = (4S²) (27S³) = 108 S⁵.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-24',
    q: 'Addition of solid sodium acetate (CH3COONa) to an aqueous solution of acetic acid (CH3COOH) decreases the degree of ionization of acetic acid. This phenomenon is a classic demonstration of:',
    options: [
      'The common-ion effect',
      'Ostwald\'s dilution law',
      'Irreversible precipitation',
      'Electrolytic auto-protolysis'
    ],
    correct: 0,
    topic: 'Chemical Equilibrium - Common-Ion Effect',
    chapter: 'Chemical Equilibrium',
    explain: 'CH3COOH(aq) ⇌ CH3COO⁻(aq) + H⁺(aq). Adding CH3COONa introduces excess acetate ions (CH3COO⁻), a common ion. By Le Chatelier\'s principle, the equilibrium shifts to the left, suppressing acetic acid ionization and raising pH.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Electrochemistry (4 MCQs: 25 to 28) ---
  {
    id: 'mdcat-b9-chem-25',
    q: 'In a standard Daniell galvanic cell: Zn(s) | Zn²⁺(1 M) || Cu²⁺(1 M) | Cu(s), what is the function of the salt bridge containing an inert electrolyte like KNO3 or KCl?',
    options: [
      'Maintaining electrical neutrality in the two half-cells by allowing ion migration while preventing physical mixing of solutions',
      'Supplying electrons directly to the copper cathode',
      'Oxidizing zinc atoms at the anode',
      'Preventing current flow when the circuit is closed'
    ],
    correct: 0,
    topic: 'Galvanic Cells - Function of the Salt Bridge',
    chapter: 'Electrochemistry',
    explain: 'As Zn oxidizes to Zn²⁺ at the anode and Cu²⁺ reduces to Cu at the cathode, charge buildup would immediately halt current. Anions from the salt bridge (NO3⁻) migrate to the anode compartment while cations (K⁺) migrate to the cathode compartment, completing the circuit and maintaining electroneutrality.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-26',
    q: 'Given the standard reduction potentials: E°(Ag⁺/Ag) = +0.80 V and E°(Cu²⁺/Cu) = +0.34 V, what is the standard electromotive force (E°_cell) for the spontaneous reaction: Cu(s) + 2Ag⁺(aq) → Cu²⁺(aq) + 2Ag(s)?',
    options: [
      '+0.46 V',
      '+1.14 V',
      '+1.26 V',
      '-0.46 V'
    ],
    correct: 0,
    topic: 'Standard Cell Potential - E°cell Calculation',
    chapter: 'Electrochemistry',
    explain: 'Ag⁺ has a higher reduction potential, so reduction occurs at cathode: Ag⁺ + e⁻ → Ag (E° = +0.80 V). Oxidation occurs at anode: Cu → Cu²⁺ + 2e⁻ (E° = +0.34 V). E°_cell = E°_cathode - E°_anode = +0.80 V - (+0.34 V) = +0.46 V.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-27',
    q: 'According to Faraday\'s First Law of Electrolysis, how many coulombs (C) of electrical charge are required to electroplate exactly 1 mole of aluminum metal from molten Al2O3? (1 Faraday ≈ 96,500 C)',
    options: [
      '289,500 C (3 Faradays)',
      '96,500 C (1 Faraday)',
      '193,000 C (2 Faradays)',
      '579,000 C (6 Faradays)'
    ],
    correct: 0,
    topic: 'Electrolysis - Faraday\'s Law and Stoichiometry of Charge',
    chapter: 'Electrochemistry',
    explain: 'Aluminum reduction is: Al³⁺ + 3e⁻ → Al. Reducing 1 mole of Al³⁺ requires 3 moles of electrons. Total electrical charge Q = n × F = 3 mol e⁻ × 96,500 C/mol = 289,500 C.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-28',
    q: 'In the commercial chlor-alkali process, what products are generated at the anode and cathode, respectively, during the electrolysis of concentrated aqueous sodium chloride (brine)?',
    options: [
      'Anode: Chlorine gas (Cl2); Cathode: Hydrogen gas (H2) and aqueous NaOH',
      'Anode: Oxygen gas (O2); Cathode: Metallic sodium (Na)',
      'Anode: Hydrogen gas (H2); Cathode: Chlorine gas (Cl2)',
      'Anode: Sodium chlorate; Cathode: Water vapor'
    ],
    correct: 0,
    topic: 'Electrochemical Applications - Chlor-Alkali Process',
    chapter: 'Electrochemistry',
    explain: 'At the anode, chloride ions oxidize preferentially due to overpotential: 2Cl⁻ → Cl2(g) + 2e⁻. At the cathode, water reduces preferentially over Na⁺ due to standard reduction potentials: 2H2O + 2e⁻ → H2(g) + 2OH⁻. Leaving Na⁺ and OH⁻ in solution yields caustic soda (NaOH).',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Chemical Kinetics (4 MCQs: 29 to 32) ---
  {
    id: 'mdcat-b9-chem-29',
    q: 'For a first-order chemical reaction, the half-life period (t1/2) is mathematically related to the rate constant k by:',
    options: [
      't1/2 = 0.693 / k',
      't1/2 = 1 / (k [A]0)',
      't1/2 = [A]0 / (2 k)',
      't1/2 = k / 0.693'
    ],
    correct: 0,
    topic: 'Reaction Kinetics - First-Order Half-Life Equation',
    chapter: 'Chemical Kinetics',
    explain: 'For a first-order reaction, ln([A]0 / [A]) = k t. When [A] = [A]0 / 2, ln(2) = k t1/2. Thus, t1/2 = ln(2) / k = 0.693 / k. The half-life is constant and completely independent of initial reactant concentration.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-30',
    q: 'The rate law for a reaction is determined experimentally to be: Rate = k [A]² [B]. What is the overall order of the reaction, and what are the SI units of rate constant k?',
    options: [
      'Overall third-order; units of k = mol⁻² dm⁶ s⁻¹',
      'Overall second-order; units of k = mol⁻¹ dm³ s⁻¹',
      'Overall third-order; units of k = s⁻¹',
      'Overall fourth-order; units of k = mol⁻³ dm⁹ s⁻¹'
    ],
    correct: 0,
    topic: 'Chemical Kinetics - Overall Reaction Order and Rate Constant Units',
    chapter: 'Chemical Kinetics',
    explain: 'Overall order = sum of exponents = 2 + 1 = 3 (third-order). Rate has units of mol dm⁻³ s⁻¹. k = Rate / ([A]²[B]) = (mol dm⁻³ s⁻¹) / (mol dm⁻³)³ = mol⁻² dm⁶ s⁻¹.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-31',
    q: 'According to the Arrhenius equation: k = A e^(-Ea / R T), what happens to the rate constant k when an inorganic catalyst is introduced at constant temperature?',
    options: [
      'The catalyst provides an alternative reaction pathway with lower activation energy (Ea), resulting in an exponential increase in k',
      'The catalyst increases the frequency factor A while leaving Ea unchanged',
      'The catalyst increases the enthalpy of the reaction (ΔH) to push it forward',
      'The catalyst reduces system entropy to zero'
    ],
    correct: 0,
    topic: 'Chemical Kinetics - Arrhenius Equation and Catalytic Mechanism',
    chapter: 'Chemical Kinetics',
    explain: 'Catalysts accelerate chemical reactions by lowering the activation energy (Ea) barrier without being consumed. Because Ea appears in the negative exponent (-Ea/RT) of the Arrhenius equation, reducing Ea exponentially increases the fraction of collisions exceeding the threshold energy, dramatically increasing k.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-32',
    q: 'In a multi-step complex reaction mechanism, the overall rate of the chemical reaction is determined by:',
    options: [
      'The slowest elementary step (rate-determining step, RDS)',
      'The fastest elementary step in the forward direction',
      'The average rate of all elementary steps combined',
      'The step with the lowest activation energy barrier'
    ],
    correct: 0,
    topic: 'Chemical Kinetics - Rate-Determining Step (RDS) in Mechanisms',
    chapter: 'Chemical Kinetics',
    explain: 'In a reaction mechanism with multiple consecutive steps, the slowest elementary step has the highest activation energy barrier and acts as a bottleneck, thereby governing the overall reaction rate and determining the theoretical rate law.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Solutions and Colligative Properties (4 MCQs: 33 to 36) ---
  {
    id: 'mdcat-b9-chem-33',
    q: 'Colligative properties of a solution (such as osmotic pressure, boiling point elevation, and freezing point depression) depend solely on:',
    options: [
      'The total number (concentration) of solute particles in solution, regardless of their chemical identity or size',
      'The chemical reactivity and molecular mass of solute molecules',
      'The polarity and dipole moment of solute bonds',
      'The optical rotation of dissolved stereocenters'
    ],
    correct: 0,
    topic: 'Solutions - Definition and Principles of Colligative Properties',
    chapter: 'Solutions and Colligative Properties',
    explain: 'Colligative properties depend strictly on the ratio of the number of solute particles to solvent molecules in a solution (particle concentration), and are independent of the chemical nature, size, or charge of the solute.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-34',
    q: 'Which of the following 0.10 m aqueous solutions will exhibit the lowest freezing point (greatest freezing point depression ΔTf)?',
    options: [
      '0.10 m Aluminum sulfate, Al2(SO4)3',
      '0.10 m Sodium chloride, NaCl',
      '0.10 m Calcium chloride, CaCl2',
      '0.10 m Glucose, C6H12O6'
    ],
    correct: 0,
    topic: 'Colligative Properties - Freezing Point Depression and van \'t Hoff Factor',
    chapter: 'Solutions and Colligative Properties',
    explain: 'ΔTf = i × Kf × m. For non-electrolyte glucose, i = 1 (effective m = 0.10). For NaCl, i = 2 (0.20). For CaCl2, i = 3 (0.30). For Al2(SO4)3, dissociation produces 2 Al³⁺ + 3 SO4²⁻, giving i = 5 (effective m = 0.50). Highest particle count produces greatest freezing point depression and lowest freezing point.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-35',
    q: 'According to Raoult\'s Law for ideal solutions, the partial vapor pressure of a volatile solvent component A (P_A) in a solution is given by:',
    options: [
      'P_A = X_A × P°_A (where X_A is mole fraction of A, and P°_A is pure vapor pressure)',
      'P_A = P°_A / X_A',
      'P_A = X_A + P°_A',
      'P_A = (1 - X_A) × P°_A'
    ],
    correct: 0,
    topic: 'Solutions - Raoult\'s Law for Ideal Solutions',
    chapter: 'Solutions and Colligative Properties',
    explain: 'Raoult\'s law states that the partial vapor pressure of each volatile component in an ideal solution is directly proportional to its mole fraction: P_A = X_A × P°_A. The relative lowering of vapor pressure (ΔP / P°) equals the mole fraction of non-volatile solute (X_B).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-36',
    q: 'What is the molarity (M) of a solution prepared by dissolving 4.0 grams of sodium hydroxide (NaOH, molar mass = 40 g/mol) in sufficient distilled water to make exactly 500 mL of solution?',
    options: [
      '0.20 M',
      '0.10 M',
      '0.40 M',
      '1.00 M'
    ],
    correct: 0,
    topic: 'Concentration Units - Molarity Calculation',
    chapter: 'Solutions and Colligative Properties',
    explain: 'Moles of NaOH = 4.0 g / 40 g/mol = 0.10 mol. Volume of solution in liters = 500 mL / 1000 mL/L = 0.50 L. Molarity = moles / volume (L) = 0.10 mol / 0.50 L = 0.20 M (mol/L).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Acids, Bases and Salts (4 MCQs: 37 to 40) ---
  {
    id: 'mdcat-b9-chem-37',
    q: 'According to the Henderson-Hasselbalch equation: pH = pKa + log([Conjugate Base] / [Weak Acid]), what is the pH of an equimolar acetic acid/sodium acetate buffer solution if the Ka of acetic acid is 1.8 × 10⁻⁵ (pKa = 4.74)?',
    options: [
      '4.74',
      '7.00',
      '1.80',
      '5.74'
    ],
    correct: 0,
    topic: 'Acid-Base Equilibria - Henderson-Hasselbalch Buffer Calculation',
    chapter: 'Acids, Bases and Salts',
    explain: 'When the concentrations of weak acid and conjugate base are equal ([A⁻] / [HA] = 1), log(1) = 0. Therefore, pH = pKa + 0 = 4.74. At this point, the buffer displays its maximum buffer capacity against additions of acid or base.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-38',
    q: 'Which of the following chemical species acts as a Lewis acid but cannot function as a Brønsted-Lowry acid?',
    options: [
      'Boron trifluoride (BF3)',
      'Ammonium ion (NH4⁺)',
      'Hydronium ion (H3O⁺)',
      'Hydrogen sulfate ion (HSO4⁻)'
    ],
    correct: 0,
    topic: 'Acid-Base Theories - Lewis Acid vs Brønsted-Lowry Acid',
    chapter: 'Acids, Bases and Salts',
    explain: 'A Brønsted-Lowry acid must donate a proton (H⁺). BF3 contains no hydrogen atoms and cannot donate protons; however, boron has an incomplete octet (6 valence electrons) with an empty 2p orbital, allowing it to accept an electron pair (acting as a Lewis acid).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-39',
    q: 'What is the pH of a 0.001 M (1.0 × 10⁻³ M) aqueous solution of hydrochloric acid (HCl) at 25°C, assuming complete electrolytic dissociation?',
    options: [
      '3.0',
      '1.0',
      '11.0',
      '7.0'
    ],
    correct: 0,
    topic: 'Acid-Base Calculations - Strong Acid pH Determination',
    chapter: 'Acids, Bases and Salts',
    explain: 'HCl is a strong monoprotic acid that dissociates completely: [H⁺] = 0.001 M = 10⁻³ M. pH = -log[H⁺] = -log(10⁻³) = 3.0.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-40',
    q: 'An aqueous solution of ammonium chloride (NH4Cl) tests acidic (pH < 7) primarily because:',
    options: [
      'The ammonium cation (NH4⁺) hydrolyzes in water, donating a proton to form NH3 and hydronium ions (H3O⁺)',
      'Chloride ions abstract protons from water to generate hydrochloric acid',
      'Chloride ions precipitate as insoluble chlorate crystals',
      'Ammonium chloride decomposes spontaneously into toxic chlorine gas'
    ],
    correct: 0,
    topic: 'Salt Hydrolysis - Acidic Salts (Weak Base + Strong Acid)',
    chapter: 'Acids, Bases and Salts',
    explain: 'NH4Cl is the salt of a weak base (NH3) and a strong acid (HCl). Cl⁻ is the conjugate base of a strong acid and does not hydrolyze. NH4⁺ is the conjugate acid of a weak base and undergoes cationic hydrolysis: NH4⁺ + H2O ⇌ NH3 + H3O⁺, releasing excess hydronium ions and lowering the pH.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- s-Block and p-Block Elements (4 MCQs: 41 to 44) ---
  {
    id: 'mdcat-b9-chem-41',
    q: 'The diagonal relationship between lithium (Group 1) and magnesium (Group 2) arises because both elements possess:',
    options: [
      'Similar ionic radii and similar polarizing power (charge-to-size ratio)',
      'Identical oxidation states in all their binary compounds',
      'The same number of valence shell electrons',
      'Identical standard reduction potentials in aqueous solution'
    ],
    correct: 0,
    topic: 'Periodic Trends - Diagonal Relationship Between Li and Mg',
    chapter: 's-Block and p-Block Elements',
    explain: 'Moving across a period increases nuclear charge and decreases size; moving down a group decreases polarizing power. Consequently, diagonal elements like Li⁺ (ionic radius ~76 pm) and Mg²⁺ (ionic radius ~72 pm) have similar charge densities (polarizing power), causing their carbonates and nitrates to decompose similarly upon heating.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-42',
    q: 'Which alkali metal reacts directly with dry atmospheric nitrogen upon gentle heating to form an ionic nitride?',
    options: [
      'Lithium (forms Li3N)',
      'Sodium',
      'Potassium',
      'Cesium'
    ],
    correct: 0,
    topic: 'Alkali Metals - Unique Reactivity of Lithium with Nitrogen',
    chapter: 's-Block and p-Block Elements',
    explain: 'Due to its exceptionally small ionic radius and high lattice energy with the small N³⁻ nitride anion, lithium is the only alkali metal that reacts directly with N2 gas to form a stable crystalline nitride: 6Li + N2 → 2Li3N.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-43',
    q: 'In Group 17 (the halogens), what is the correct trend in oxidizing power of the diatomic elements in aqueous solution?',
    options: [
      'F2 > Cl2 > Br2 > I2',
      'I2 > Br2 > Cl2 > F2',
      'Cl2 > F2 > Br2 > I2',
      'Br2 > Cl2 > F2 > I2'
    ],
    correct: 0,
    topic: 'Halogens - Trend in Oxidizing Power and Reduction Potentials',
    chapter: 's-Block and p-Block Elements',
    explain: 'Standard reduction potentials decrease down Group 17: F2 (+2.87 V) > Cl2 (+1.36 V) > Br2 (+1.07 V) > I2 (+0.54 V). Fluorine is the most potent oxidizing agent, readily displacing chloride, bromide, and iodide from their aqueous salts.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-44',
    q: 'The inert pair effect, which becomes increasingly pronounced in heavier p-block elements (such as Tl, Pb, and Bi), refers to:',
    options: [
      'The reluctance of the outer valence s-electrons to participate in chemical bonding due to relativistic contraction and poor d/f shielding',
      'The inability of noble gases to form coordinate complexes',
      'The complete pairing of all p-electrons in tetrahedral geometries',
      'The expulsion of two d-electrons during metallic conduction'
    ],
    correct: 0,
    topic: 'p-Block Elements - Inert Pair Effect in Heavier Elements',
    chapter: 's-Block and p-Block Elements',
    explain: 'In heavy p-block elements (Period 6), the intervening 4f and 5d subshells shield nuclear charge poorly. The effective nuclear charge experienced by valence 6s electrons increases, drawing them closer to the nucleus. These 6s² electrons remain unshared ("inert pair"), making oxidation states two units lower than group valency more stable (e.g., Pb²⁺ more stable than Pb⁴⁺; Tl⁺ more stable than Tl³⁺).',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Transition Elements (4 MCQs: 45 to 48) ---
  {
    id: 'mdcat-b9-chem-45',
    q: 'Transition metal complexes typically exhibit vibrant colors in aqueous solution primarily due to:',
    options: [
      'Electronic transitions between split d-orbitals (d-d transitions) in the visible light spectrum',
      'Nuclear fission of radioactive isotopes in the complex core',
      'Rotational transitions of ligand water molecules',
      'Complete ionization of inner core s-orbitals'
    ],
    correct: 0,
    topic: 'Transition Elements - Origin of Color in Coordination Complexes',
    chapter: 'Transition Elements',
    explain: 'In coordination complexes, ligand electrostatic fields split the five degenerate d-orbitals into different energy levels (e.g., t2g and eg in octahedral fields). Absorption of visible photons promotes an electron from a lower d-orbital to an upper d-orbital (d-d transition); the transmitted light appears as the complementary color.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-46',
    q: 'What is the ground-state electronic configuration of the chromium atom (Cr, atomic number Z = 24)?',
    options: [
      '[Ar] 3d⁵ 4s¹',
      '[Ar] 3d⁴ 4s²',
      '[Ar] 3d⁶ 4s⁰',
      '[Ar] 3d³ 4s² 4p¹'
    ],
    correct: 0,
    topic: 'Transition Elements - Electronic Configuration of Chromium',
    chapter: 'Transition Elements',
    explain: 'Chromium displays an anomalous electronic configuration: one 4s electron is promoted to the 3d subshell to yield [Ar] 3d⁵ 4s¹. This configuration provides half-filled stability across the five 3d orbitals and maximizes exchange energy.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-47',
    q: 'In the coordination complex [Fe(CN)6]³⁻, what are the oxidation state and coordination number of the central iron ion?',
    options: [
      'Oxidation state = +3; Coordination number = 6',
      'Oxidation state = +2; Coordination number = 6',
      'Oxidation state = +3; Coordination number = 3',
      'Oxidation state = +6; Coordination number = 4'
    ],
    correct: 0,
    topic: 'Coordination Chemistry - Oxidation State and Coordination Number',
    chapter: 'Transition Elements',
    explain: 'Cyanide (CN⁻) carries a -1 charge. Let oxidation state of iron be x: x + 6(-1) = -3 → x = +3 (Fe³⁺). Six monodentate cyanide ligands coordinate to the iron ion, so the coordination number is 6 (octahedral geometry).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-48',
    q: 'Paramagnetism in first-row transition metal ions is directly caused by the presence of:',
    options: [
      'Unpaired electrons in the 3d subshell, which generate net magnetic dipole moments',
      'Paired electrons with antiparallel spins in the 4s orbital',
      'Vacant 4p hybrid orbitals accepting ligand lone pairs',
      'Coordinate covalent bonds with diamagnetic water ligands'
    ],
    correct: 0,
    topic: 'Transition Elements - Paramagnetism and Unpaired Electrons',
    chapter: 'Transition Elements',
    explain: 'Paramagnetism arises from unpaired electron spins that align with an external magnetic field. The magnetic moment is given by the spin-only formula: μ = √[n(n+2)] Bohr Magnetons, where n is the number of unpaired d-electrons.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Fundamental Principles of Organic Chemistry (4 MCQs: 49 to 52) ---
  {
    id: 'mdcat-b9-chem-49',
    q: 'In the allene molecule (CH2=C=CH2), what is the hybridization state of the central carbon atom (C-2)?',
    options: [
      'sp hybridization',
      'sp² hybridization',
      'sp³ hybridization',
      'dsp² hybridization'
    ],
    correct: 0,
    topic: 'Hybridization - Carbon Hybridization in Cumulative Dienes (Allene)',
    chapter: 'Fundamental Principles of Organic Chemistry',
    explain: 'The central carbon forms two sigma bonds and two mutually perpendicular pi bonds with flanking carbons. Having two electron domains and linear geometry (180°), C-2 is sp hybridized. Flanking terminal carbons are sp² hybridized.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-50',
    q: 'Ethanol (CH3CH2OH) and dimethyl ether (CH3OCH3) share the identical molecular formula C2H6O but belong to different homologous series. What type of structural isomerism do they exhibit?',
    options: [
      'Functional group isomerism',
      'Chain isomerism',
      'Position isomerism',
      'Metamerism'
    ],
    correct: 0,
    topic: 'Isomerism - Functional Group Isomerism',
    chapter: 'Fundamental Principles of Organic Chemistry',
    explain: 'Functional group isomers possess identical molecular formulas but contain entirely different functional groups (in this case, an alcohol with an -OH group vs an ether with a C-O-C linkage), conferring radically different physical and chemical properties.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-51',
    q: 'Which of the following carbocations displays the highest thermodynamic stability due to extensive hyperconjugation and alkyl inductive electron donation?',
    options: [
      'tert-Butyl carbocation, (CH3)3C⁺',
      'Isopropyl carbocation, (CH3)2CH⁺',
      'Ethyl carbocation, CH3CH2⁺',
      'Methyl carbocation, CH3⁺'
    ],
    correct: 0,
    topic: 'Reaction Intermediates - Carbocation Stability and Hyperconjugation',
    chapter: 'Fundamental Principles of Organic Chemistry',
    explain: 'Carbocation stability follows: 3° > 2° > 1° > methyl. The tertiary tert-butyl cation has 9 alpha-C-H bonds available for hyperconjugative sigma-to-empty-p orbital overlap and three +I inductive methyl groups that disperse the positive charge.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-52',
    q: 'Heterolytic cleavage of a covalent carbon-chlorine bond in an alkyl halide results in the formation of:',
    options: [
      'A carbocation (carbonium ion) and a chloride anion',
      'A carbon free radical and a chlorine free radical',
      'A carbanion and a chloronium cation',
      'An alkene and a molecule of hydrogen chloride'
    ],
    correct: 0,
    topic: 'Reaction Mechanisms - Heterolytic vs Homolytic Cleavage',
    chapter: 'Fundamental Principles of Organic Chemistry',
    explain: 'In heterolytic fission (heterolysis), the more electronegative chlorine atom takes both electrons of the shared pair, generating a chloride anion (Cl⁻) and leaving the carbon deficient as a carbocation (R⁺). Homolytic fission generates neutral free radicals.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Hydrocarbons (4 MCQs: 53 to 56) ---
  {
    id: 'mdcat-b9-chem-53',
    q: 'According to Hückel\'s rule of aromaticity, a planar, monocyclic, completely conjugated ring system is aromatic if it contains:',
    options: [
      '(4n + 2) delocalized pi electrons (where n = 0, 1, 2, 3...)',
      '4n delocalized pi electrons',
      'Exactly 6 valence electrons regardless of geometry',
      'An odd number of alternating double and single bonds'
    ],
    correct: 0,
    topic: 'Aromaticity - Hückel\'s Rule and Resonance Stabilization',
    chapter: 'Hydrocarbons',
    explain: 'Hückel\'s rule specifies that a planar cyclic conjugated polyene possesses extra aromatic stabilization if its closed shell of delocalized pi molecular orbitals contains (4n + 2) pi electrons (e.g., 2 for cyclopropenyl cation, 6 for benzene and cyclopentadienyl anion, 10 for naphthalene). Rings with 4n pi electrons are anti-aromatic.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-54',
    q: 'In the free-radical halogenation of methane: CH4 + Cl2 → CH3Cl + HCl, which elementary step serves as a chain termination step?',
    options: [
      '•CH3 + •Cl → CH3Cl',
      'Cl2 → 2 •Cl (under UV light)',
      '•Cl + CH4 → •CH3 + HCl',
      '•CH3 + Cl2 → CH3Cl + •Cl'
    ],
    correct: 0,
    topic: 'Alkanes - Free Radical Halogenation Mechanism',
    chapter: 'Hydrocarbons',
    explain: 'Chain termination occurs when two reactive free radicals collide and combine to form a stable covalent molecule without producing new radicals (e.g., •CH3 + •Cl → CH3Cl or •CH3 + •CH3 → CH3CH3), removing chain-carrying radicals from the reaction.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-55',
    q: 'Ozonolysis of an unknown alkene followed by reductive cleavage with zinc and water yields acetone (CH3COCH3) and formaldehyde (HCHO). What was the structure of the starting alkene?',
    options: [
      '2-Methylpropene (Isobutylene)',
      '2-Butene',
      '1-Butene',
      'Cyclobutene'
    ],
    correct: 0,
    topic: 'Alkenes - Ozonolysis and Carbonyl Product Identification',
    chapter: 'Hydrocarbons',
    explain: 'Ozonolysis cleaves the double bond and caps each carbon with an oxygen atom. Joining the carbonyl carbons of acetone (CH3)2C=O and formaldehyde O=CH2 back together gives (CH3)2C=CH2, which is 2-methylpropene.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-56',
    q: 'In the electrophilic aromatic substitution of benzene (such as nitration), the electrophile that attacks the aromatic ring is generated by reacting concentrated HNO3 with concentrated H2SO4. What is this electrophilic species?',
    options: [
      'Nitronium ion (NO2⁺)',
      'Nitrite ion (NO2⁻)',
      'Nitrate radical (NO3•)',
      'Nitrosonium ion (NO⁺)'
    ],
    correct: 0,
    topic: 'Electrophilic Aromatic Substitution - Nitration and Nitronium Ion',
    chapter: 'Hydrocarbons',
    explain: 'H2SO4 acts as a Brønsted acid and protonates HNO3 to form H2NO3⁺, which loses water to generate the linear, strongly electrophilic nitronium ion (NO2⁺): HNO3 + 2H2SO4 ⇌ NO2⁺ + H3O⁺ + 2HSO4⁻. The nitronium ion attacks the benzene pi cloud to form an arenium ion (Wheland intermediate).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Alkyl Halides (4 MCQs: 57 to 60) ---
  {
    id: 'mdcat-b9-chem-57',
    q: 'The nucleophilic substitution reaction of primary alkyl halides with hydroxide ions proceeds predominantly via an SN2 mechanism, which is characterized by:',
    options: [
      'A concerted, single-step bimolecular transition state resulting in complete Walden inversion of stereochemical configuration',
      'A two-step mechanism involving a planar carbocation intermediate producing a racemic mixture',
      'First-order kinetics dependent solely on the concentration of alkyl halide',
      'Formation of an alkene through concerted E2 elimination'
    ],
    correct: 0,
    topic: 'Alkyl Halides - SN2 Mechanism and Walden Inversion',
    chapter: 'Alkyl Halides',
    explain: 'SN2 (Substitution Nucleophilic Bimolecular) occurs in a single concerted step: the nucleophile attacks the back lobe of the C-LG bond while the leaving group departs. This 180° backside attack turns the tetrahedral geometry inside out, resulting in inversion of configuration (Walden inversion).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-58',
    q: 'Which alkyl halide will react most rapidly via an SN1 solvolysis pathway in aqueous ethanol?',
    options: [
      '2-Bromo-2-methylpropane (tert-butyl bromide)',
      '2-Bromopropane (isopropyl bromide)',
      '1-Bromobutane (n-butyl bromide)',
      'Bromomethane (methyl bromide)'
    ],
    correct: 0,
    topic: 'Alkyl Halides - SN1 Reactivity and Tertiary Carbocation Stability',
    chapter: 'Alkyl Halides',
    explain: 'The rate-determining step in an SN1 mechanism is unimolecular heterolysis of the carbon-halogen bond to form a carbocation. Tertiary alkyl halides ionize fastest because the 3° tert-butyl carbocation is stabilized by 9 hyperconjugative structures and inductive electron donation.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-59',
    q: 'When an alkyl halide is heated with alcoholic potassium hydroxide (KOH / ethanol), dehydrohalogenation occurs to produce an alkene via:',
    options: [
      'Beta-elimination (1,2-elimination)',
      'Alpha-elimination forming a carbene',
      'Electrophilic addition',
      'Nucleophilic acyl substitution'
    ],
    correct: 0,
    topic: 'Alkyl Halides - Dehydrohalogenation and Elimination Reactions',
    chapter: 'Alkyl Halides',
    explain: 'Strong bases in alcoholic media (like ethoxide/KOH in ethanol) act as bases rather than nucleophiles, abstracting a proton from the beta-carbon while the halogen departs from the alpha-carbon (beta-elimination), yielding an alkene.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-60',
    q: 'Grignard reagents (organomagnesium halides, R-Mg-X) are prepared by reacting an alkyl halide with magnesium turnings in anhydrous ether. What makes Grignard reagents exceptionally reactive nucleophiles?',
    options: [
      'The highly polarized, electropositive magnesium atom imparts substantial carbanionic partial negative charge (C^δ- — Mg^δ+) to the attached carbon',
      'The magnesium atom acts as an explosive free-radical scavenger',
      'The ether solvent permanently oxidizes the alkyl chain into an alkoxide',
      'The halogen atom donates electrons to form a hypervalent coordinate salt'
    ],
    correct: 0,
    topic: 'Organometallic Compounds - Grignard Reagent Preparation and Polarity',
    chapter: 'Alkyl Halides',
    explain: 'Carbon is more electronegative (2.5) than magnesium (1.2). In the C-Mg bond, electron density is pulled toward carbon, creating a strongly nucleophilic, basic carbanion-like character (R^δ⁻-Mg^δ⁺X) that attacks electrophilic carbonyl carbons.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Alcohols and Phenols (3 MCQs: 61 to 63) ---
  {
    id: 'mdcat-b9-chem-61',
    q: 'In the Lucas test used to distinguish between primary, secondary, and tertiary alcohols (using anhydrous ZnCl2 in concentrated HCl), which alcohol produces immediate turbidity at room temperature?',
    options: [
      'Tertiary alcohols (form insoluble alkyl chloride immediately via an SN1 mechanism)',
      'Primary alcohols',
      'Secondary alcohols (turbidity appears after 5-10 minutes)',
      'Methanol only'
    ],
    correct: 0,
    topic: 'Alcohols - Lucas Test and Alcohol Classification',
    chapter: 'Alcohols and Phenols',
    explain: 'Lucas reagent converts alcohols to insoluble alkyl chlorides. Tertiary alcohols form stable 3° carbocations immediately, producing turbidity (cloudiness) in seconds. Secondary alcohols react in 5 minutes; primary alcohols show no turbidity at room temperature unless heated.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-62',
    q: 'Phenol (carbolic acid) is significantly more acidic than aliphatic alcohols (such as ethanol) because:',
    options: [
      'The phenoxide anion is stabilized by resonance delocalization of the negative charge into the aromatic benzene ring',
      'The oxygen atom in phenol is sp³ hybridized instead of sp²',
      'Phenol contains two intramolecular hydrogen bonds that eject protons',
      'Ethanol has a higher molar mass than phenol'
    ],
    correct: 0,
    topic: 'Phenols - Acidity and Phenoxide Resonance Stabilization',
    chapter: 'Alcohols and Phenols',
    explain: 'Deprotonation of phenol yields the phenoxide ion (C6H5O⁻). The negative charge on oxygen is resonance-delocalized over the ortho- and para-positions of the aromatic ring through four contributing resonance structures, stabilizing the conjugate base. Alkoxide ions from aliphatic alcohols cannot delocalize negative charge.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-63',
    q: 'Treatment of phenol with excess bromine water (Br2 / H2O) at room temperature produces an immediate white precipitate of:',
    options: [
      '2,4,6-Tribromophenol',
      '2-Bromophenol',
      '4-Bromophenol',
      'Bromobenzene'
    ],
    correct: 0,
    topic: 'Phenols - Bromination and 2,4,6-Tribromophenol Formation',
    chapter: 'Alcohols and Phenols',
    explain: 'The hydroxyl group (-OH) is an exceptionally strong activating, ortho/para-directing group due to resonance lone-pair donation. In aqueous solution, phenol ionizes partially to phenoxide, activating the ring to such an extent that substitution occurs simultaneously at all ortho and para positions, precipitating 2,4,6-tribromophenol.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Aldehydes and Ketones (3 MCQs: 64 to 66) ---
  {
    id: 'mdcat-b9-chem-64',
    q: 'Aldehydes reduce Tollens\' reagent (ammoniacal silver nitrate) to form a shiny silver mirror on the inside of the test tube, while ketones do not. This reaction demonstrates that:',
    options: [
      'Aldehydes are easily oxidized to carboxylic acids due to the presence of a carbonyl hydrogen atom, whereas ketones lack this hydrogen',
      'Ketones are stronger reducing agents than aldehydes',
      'Tollens\' reagent acts as a specific dehydrating agent for ketones',
      'Aldehydes contain enolizable alpha-hydrogens while ketones do not'
    ],
    correct: 0,
    topic: 'Carbonyl Compounds - Tollens\' Silver Mirror Test',
    chapter: 'Aldehydes and Ketones',
    explain: 'Aldehydes possess a hydrogen atom directly bonded to the carbonyl carbon (R-CHO), allowing mild oxidation by Tollens\' reagent [Ag(NH3)2]⁺ to a carboxylate salt while reducing Ag⁺ to metallic silver (Ag⁰). Simple ketones (R-CO-R\') have two alkyl groups and cannot be oxidized without breaking carbon-carbon bonds.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-65',
    q: 'In the base-catalyzed aldol condensation, an enolate ion generated from an aldehyde or ketone containing alpha-hydrogens acts as:',
    options: [
      'A nucleophile that attacks the carbonyl carbon of another aldehyde/ketone molecule',
      'An electrophile that attacks an alkoxide oxygen',
      'A leaving group that undergoes beta-elimination of water',
      'A free radical that initiates chain polymerization'
    ],
    correct: 0,
    topic: 'Aldehydes and Ketones - Aldol Condensation Mechanism',
    chapter: 'Aldehydes and Ketones',
    explain: 'Hydroxide ion abstracts an acidic alpha-hydrogen to generate a resonance-stabilized enolate carbanion. The enolate acts as a carbon nucleophile, attacking the electrophilic carbonyl carbon of a second carbonyl molecule to form an alkoxide intermediate, which protonates to yield a beta-hydroxy carbonyl (aldol).',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-66',
    q: 'The iodoform test (treatment with I2 and aqueous NaOH) produces a characteristic yellow crystalline precipitate of triiodomethane (CHI3) when reacted with which of the following compounds?',
    options: [
      'Ethanol, acetaldehyde, or methyl ketones (containing the CH3-C=O or CH3-CH(OH)- group)',
      'Methanol and formaldehyde',
      'Benzophenone and diethyl ether',
      'Formic acid and benzoic acid'
    ],
    correct: 0,
    topic: 'Carbonyl Compounds - Haloform / Iodoform Reaction',
    chapter: 'Aldehydes and Ketones',
    explain: 'The iodoform reaction is specific for compounds containing a methyl carbonyl group (CH3-C=O) or compounds oxidizable to it (CH3-CH(OH)-, such as ethanol and secondary methyl carbinols). Trihalogenation of the methyl group followed by hydroxide cleavage produces yellow crystalline iodoform (CHI3, melting point 119°C).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Carboxylic Acids (3 MCQs: 67 to 69) ---
  {
    id: 'mdcat-b9-chem-67',
    q: 'In the acid-catalyzed Fischer esterification of ethanoic acid (CH3COOH) with ethanol (C2H5OH) using concentrated sulfuric acid, isotopic tracer studies using ¹⁸O have proven that:',
    options: [
      'The oxygen atom in the resulting ester linkage (-O-C2H5) originates entirely from the alcohol molecule',
      'The oxygen in the water byproduct comes exclusively from the alcohol',
      'The ester carbonyl oxygen comes from sulfuric acid',
      'Both oxygens in the ester originate from ethanoic acid'
    ],
    correct: 0,
    topic: 'Carboxylic Acids - Fischer Esterification Mechanism and Isotopic Tracing',
    chapter: 'Carboxylic Acids',
    explain: 'Isotopic labeling with ethanol containing ¹⁸O (CH3CH2¹⁸OH) demonstrates that nucleophilic attack occurs by the alcohol oxygen at the carbonyl carbon. Elimination of the protonated -OH group from the carboxylic acid forms water. Thus, the ¹⁸O label is incorporated into the ester, proving acyl-oxygen cleavage of the acid.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-68',
    q: 'Which carboxylic acid derivative exhibits the greatest reactivity toward nucleophilic acyl substitution reactions?',
    options: [
      'Acyl chloride (acid chloride, R-CO-Cl)',
      'Acid anhydride, (RCO)2O',
      'Ester, R-CO-OR\'',
      'Amide, R-CO-NH2'
    ],
    correct: 0,
    topic: 'Carboxylic Acid Derivatives - Nucleophilic Acyl Substitution Reactivity',
    chapter: 'Carboxylic Acids',
    explain: 'Reactivity towards nucleophilic acyl substitution follows: Acyl chlorides > Acid anhydrides > Esters > Amides. Acyl chlorides are most reactive because chloride (Cl⁻) is a weak base and an excellent leaving group, and resonance donation of lone pairs into the carbonyl is minimal compared to nitrogen or oxygen.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-69',
    q: 'How does the presence of electron-withdrawing substituents (such as chlorine or fluorine) at the alpha-carbon affect the acidity of carboxylic acids?',
    options: [
      'Increases acidity by dispersing the negative charge on the conjugate carboxylate anion through the -I inductive effect',
      'Decreases acidity by strengthening the O-H covalent bond',
      'Has no effect because inductive effects cannot operate beyond one single bond',
      'Converts the carboxylic acid into an insoluble neutral ester'
    ],
    correct: 0,
    topic: 'Carboxylic Acids - Inductive Effect on Acidity',
    chapter: 'Carboxylic Acids',
    explain: 'Electronegative halogens pull electron density through sigma bonds (-I inductive effect). In the carboxylate anion (R-COO⁻), this electron withdrawal disperses the negative charge over a larger volume, stabilizing the anion and shifting the dissociation equilibrium to the right, increasing Ka (e.g., trichloroacetic acid is much stronger than acetic acid).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Amino Acids and Proteins (3 MCQs: 70 to 72) ---
  {
    id: 'mdcat-b9-chem-70',
    q: 'Which of the following 20 standard amino acids is achiral (optically inactive) because its alpha-carbon is bonded to two identical hydrogen atoms?',
    options: [
      'Glycine',
      'Alanine',
      'Valine',
      'Proline'
    ],
    correct: 0,
    topic: 'Amino Acids - Chirality and Optical Inactivity of Glycine',
    chapter: 'Amino Acids and Proteins',
    explain: 'An asymmetric (chiral) carbon must be bonded to four distinct chemical substituents. In glycine (H2N-CH2-COOH), the alpha-carbon is bonded to an amino group, a carboxyl group, and two hydrogen atoms. Lacking four distinct groups, it is achiral and does not rotate plane-polarized light.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-71',
    q: 'In the solid state and in neutral aqueous solutions, amino acids exist primarily as dipolar ions with net zero charge known as:',
    options: [
      'Zwitterions',
      'Carbocations',
      'Enolates',
      'Free radicals'
    ],
    correct: 0,
    topic: 'Amino Acids - Zwitterion Formation and Isoelectric Point',
    chapter: 'Amino Acids and Proteins',
    explain: 'The acidic carboxyl group (-COOH) transfers a proton to the basic amino group (-NH2), forming a dipolar zwitterion (+H3N-CHR-COO⁻). This internal salt-like structure accounts for the high melting points, crystalline nature, and water solubility of amino acids.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-72',
    q: 'The formation of a peptide bond linking two amino acids in a polypeptide chain is classified chemically as a:',
    options: [
      'Condensation (dehydration) reaction between an alpha-carboxyl group and an alpha-amino group, eliminating a molecule of water',
      'Hydrolytic addition across a carbonyl double bond',
      'Free radical substitution involving the alpha-carbon',
      'Decarboxylation eliminating carbon dioxide'
    ],
    correct: 0,
    topic: 'Proteins - Peptide Bond Synthesis as a Condensation Reaction',
    chapter: 'Amino Acids and Proteins',
    explain: 'A peptide bond (-CO-NH-) is an amide linkage formed by condensation between the alpha-carboxyl group of one amino acid and the alpha-amino group of an adjacent amino acid, with the stoichiometric elimination of one water molecule.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Macromolecules and Environmental Chemistry (3 MCQs: 73 to 75) ---
  {
    id: 'mdcat-b9-chem-73',
    q: 'Nylon-6,6 is a synthetic commercial polymer synthesized through step-growth condensation polymerization of which two monomers?',
    options: [
      'Adipic acid (hexanedioic acid) and hexamethylenediamine (1,6-diaminohexane)',
      'Terephthalic acid and ethylene glycol',
      'Caprolactam and styrene',
      'Vinyl chloride and formaldehyde'
    ],
    correct: 0,
    topic: 'Polymers - Nylon-6,6 Condensation Polymerization',
    chapter: 'Macromolecules and Environmental Chemistry',
    explain: 'Nylon-6,6 is a polyamide synthesized by condensation of a 6-carbon dicarboxylic acid (adipic acid) and a 6-carbon diamine (hexamethylenediamine), eliminating water molecules at high temperature to form recurring amide linkages.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-74',
    q: 'In the stratosphere, catalytic depletion of the protective ozone layer (O3) by chlorofluorocarbons (CFCs) is initiated when solar ultraviolet radiation photolytically generates:',
    options: [
      'Chlorine free radicals (Cl•), which react catalytically with ozone to form ClO• and O2',
      'Fluoride anions (F⁻)',
      'Nitrate ions (NO3⁻)',
      'Carbonate precipitates'
    ],
    correct: 0,
    topic: 'Environmental Chemistry - Ozone Depletion Mechanism by CFCs',
    chapter: 'Macromolecules and Environmental Chemistry',
    explain: 'UV radiation cleaves C-Cl bonds in CFCs: CF2Cl2 + hν → •CF2Cl + Cl•. The chlorine free radical acts as a catalyst: Cl• + O3 → ClO• + O2, followed by ClO• + O• → Cl• + O2. One chlorine radical can destroy up to 100,000 ozone molecules before termination.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b9-chem-75',
    q: 'Photochemical smog, common in sunny urban environments with dense vehicular traffic, is characterized by brown haze and eye irritation produced by secondary pollutants such as:',
    options: [
      'Ozone (O3) and peroxyacetyl nitrate (PAN), formed by photochemical reactions of nitrogen oxides and unburned hydrocarbons',
      'Sulfur dioxide (SO2) and sulfuric acid droplets',
      'Pure carbon monoxide gas',
      'Chlorofluorocarbons and methane'
    ],
    correct: 0,
    topic: 'Environmental Chemistry - Photochemical Smog and Peroxyacetyl Nitrate (PAN)',
    chapter: 'Macromolecules and Environmental Chemistry',
    explain: 'Photochemical smog (Los Angeles smog) forms on hot sunny days when primary vehicular pollutants (NOx and volatile organic hydrocarbons) undergo photochemical excitation by solar UV light. This generates hazardous secondary oxidants including tropospheric ozone, aldehydes, and peroxyacetyl nitrate (PAN, a potent lacrimator).',
    difficulty: 'Hard',
    subject: 'Chemistry'
  }
];

import { Question } from '../types';

export const MDCAT_CHEMISTRY_BATCH10: Question[] = [
  // --- Fundamental Concepts of Chemistry (4 MCQs: 1 to 4) ---
  {
    id: 'mdcat-b10-chem-1',
    q: 'How many total atoms are present in 0.5 moles of pure anhydrous copper(II) sulfate (CuSO4)? (Avogadro\'s number NA = 6.022 × 10²³)',
    options: [
      '1.807 × 10²⁴ atoms',
      '3.011 × 10²³ atoms',
      '3.613 × 10²⁴ atoms',
      '6.022 × 10²³ atoms'
    ],
    correct: 0,
    topic: 'Stoichiometry - Calculation of Total Atoms in a Compound',
    chapter: 'Fundamental Concepts of Chemistry',
    explain: 'One formula unit of CuSO4 contains 1 Cu + 1 S + 4 O = 6 atoms. In 0.5 moles of CuSO4, the total moles of atoms = 0.5 mol × 6 = 3.0 moles of atoms. Total number of atoms = 3.0 × (6.022 × 10²³) = 1.807 × 10²⁴ atoms.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-2',
    q: 'A gaseous hydrocarbon contains 85.7% carbon and 14.3% hydrogen by mass. If its vapor density is determined to be 21, what is its molecular formula? (Atomic masses: C = 12, H = 1)',
    options: [
      'C3H6 (Propene)',
      'C2H4 (Ethene)',
      'C4H8 (Butene)',
      'CH2'
    ],
    correct: 0,
    topic: 'Empirical and Molecular Formula - Determination from Vapor Density',
    chapter: 'Fundamental Concepts of Chemistry',
    explain: 'Moles of C = 85.7 / 12 = 7.14; moles of H = 14.3 / 1 = 14.3. Ratio H:C = 14.3 / 7.14 = 2. Empirical formula = CH2 (mass = 14 g/mol). Molecular mass = 2 × Vapor Density = 2 × 21 = 42 g/mol. Multiplier n = 42 / 14 = 3. Therefore, molecular formula = (CH2)3 = C3H6.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-3',
    q: 'In the combustion reaction of propane: C3H8(g) + 5O2(g) → 3CO2(g) + 4H2O(g), if 2.0 moles of propane are mixed with 8.0 moles of O2, which is the limiting reactant and how many moles of CO2 are produced?',
    options: [
      'O2 is the limiting reactant; 4.8 moles of CO2 are produced',
      'C3H8 is the limiting reactant; 6.0 moles of CO2 are produced',
      'O2 is the limiting reactant; 3.0 moles of CO2 are produced',
      'Neither reactant is limiting; 5.0 moles of CO2 are produced'
    ],
    correct: 0,
    topic: 'Stoichiometry - Limiting Reactant and Product Yield',
    chapter: 'Fundamental Concepts of Chemistry',
    explain: 'Stoichiometric ratio requires 5 mol O2 per 1 mol C3H8. For 2.0 mol C3H8, 10.0 mol O2 are required, but only 8.0 mol O2 are provided. Thus, O2 is the limiting reactant. Moles of CO2 produced = 8.0 mol O2 × (3 mol CO2 / 5 mol O2) = 4.8 moles of CO2.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-4',
    q: 'What is the volume occupied by 4.4 grams of carbon dioxide (CO2) gas at standard temperature and pressure (STP, 273.15 K and 1 atm)? (Molar mass of CO2 = 44 g/mol; molar volume at STP = 22.414 L)',
    options: [
      '2.24 dm³ (or L)',
      '22.4 dm³',
      '0.224 dm³',
      '4.48 dm³'
    ],
    correct: 0,
    topic: 'Molar Volume - Gas Stoichiometry at STP',
    chapter: 'Fundamental Concepts of Chemistry',
    explain: 'Moles of CO2 = mass / molar mass = 4.4 g / 44 g/mol = 0.10 mol. At STP, 1 mole of any ideal gas occupies 22.414 dm³. Volume = 0.10 mol × 22.414 dm³/mol = 2.24 dm³ (or liters).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Atomic Structure (4 MCQs: 5 to 8) ---
  {
    id: 'mdcat-b10-chem-5',
    q: 'According to Hund\'s rule of maximum multiplicity, how are the three 2p electrons distributed in the ground-state electronic configuration of a neutral nitrogen atom (Z = 7)?',
    options: [
      'One electron resides in each of the three degenerate 2p orbitals (2px¹, 2py¹, 2pz¹) with parallel spins',
      'Two electrons pair in 2px², one in 2py¹, and 2pz remains vacant',
      'All three electrons pair up in 2px³',
      'Two electrons reside in 2px with opposite spins and one is promoted to 3s'
    ],
    correct: 0,
    topic: 'Electronic Configuration - Hund\'s Rule of Maximum Multiplicity',
    chapter: 'Atomic Structure',
    explain: 'Hund\'s rule states that when electrons occupy degenerate orbitals of equal energy, electrons remain unpaired with parallel spins before any orbital is doubly occupied. Nitrogen (1s² 2s² 2p³) has one unpaired electron with parallel spin in each of 2px, 2py, and 2pz.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-6',
    q: 'What is the de Broglie wavelength (λ) associated with an electron of rest mass m = 9.11 × 10⁻³¹ kg moving with a velocity of 2.0 × 10⁶ m/s? (Planck\'s constant h = 6.626 × 10⁻³⁴ J·s)',
    options: [
      '3.64 × 10⁻¹⁰ m (0.364 nm)',
      '7.28 × 10⁻¹⁰ m',
      '1.82 × 10⁻¹¹ m',
      '5.46 × 10⁻⁹ m'
    ],
    correct: 0,
    topic: 'Dual Nature of Matter - De Broglie Wavelength Calculation',
    chapter: 'Atomic Structure',
    explain: 'λ = h / (m × v) = (6.626 × 10⁻³⁴ J·s) / [(9.11 × 10⁻³¹ kg) × (2.0 × 10⁶ m/s)] = (6.626 × 10⁻³⁴) / (1.822 × 10⁻²⁴) = 3.637 × 10⁻¹⁰ m ≈ 0.364 nm.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-7',
    q: 'In the hydrogen atomic emission spectrum, electronic transitions ending at the principal quantum level n1 = 2 originate the Balmer series. In which region of the electromagnetic spectrum do Balmer spectral lines appear?',
    options: [
      'Visible region (with the highest energy transitions extending into near-UV)',
      'Infrared region',
      'Far-ultraviolet region',
      'Microwave region'
    ],
    correct: 0,
    topic: 'Atomic Spectra - Hydrogen Balmer Series and Visible Range',
    chapter: 'Atomic Structure',
    explain: 'The Lyman series (n1 = 1) falls in the ultraviolet region. The Balmer series (n1 = 2) falls in the visible region (approx. 400 nm to 700 nm, e.g., H-α at 656 nm is red, H-β at 486 nm is blue-green). The Paschen, Brackett, and Pfund series fall in the infrared region.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-8',
    q: 'Which set of four quantum numbers (n, l, ml, ms) is physically impossible according to quantum mechanical selection rules and the Pauli exclusion principle?',
    options: [
      'n = 3, l = 3, ml = 0, ms = +1/2',
      'n = 4, l = 2, ml = -1, ms = -1/2',
      'n = 2, l = 1, ml = -1, ms = +1/2',
      'n = 3, l = 0, ml = 0, ms = -1/2'
    ],
    correct: 0,
    topic: 'Quantum Mechanics - Quantum Number Rules and Permissible Values',
    chapter: 'Atomic Structure',
    explain: 'For any principal quantum number n, the azimuthal (orbital) quantum number l can only take integer values from 0 up to (n - 1). Therefore, when n = 3, l can only be 0, 1, or 2 (s, p, or d subshell). An orbital with l = 3 (an f-subshell) cannot exist in the third shell (n = 3).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Gases (4 MCQs: 9 to 12) ---
  {
    id: 'mdcat-b10-chem-9',
    q: 'In the van der Waals equation of state for real gases: [P + (n²a / V²)] (V - nb) = nRT, what physical molecular property does the constant "a" correct for?',
    options: [
      'Intermolecular attractive forces between gas molecules that reduce pressure exerted on container walls',
      'The finite excluded volume occupied by the gas molecules themselves',
      'Inelastic collisions between gas molecules and container walls',
      'Thermal dissociation of gas molecules at elevated pressures'
    ],
    correct: 0,
    topic: 'Non-Ideal Gases - Van der Waals Equation and Parameter "a"',
    chapter: 'Gases',
    explain: 'In the van der Waals equation, (n²a / V²) is the internal pressure correction accounting for intermolecular attractive forces (dispersion, dipole-dipole) that pull molecules inward and lessen wall impact pressure. The constant "b" accounts for the co-volume (excluded finite volume).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-10',
    q: 'According to Graham\'s law of gaseous effusion, the rate of effusion of methane (CH4, molar mass = 16 g/mol) is how many times faster than that of sulfur dioxide (SO2, molar mass = 64 g/mol) under identical conditions of temperature and pressure?',
    options: [
      '2.0 times faster',
      '4.0 times faster',
      '1.41 times faster',
      '0.5 times as fast'
    ],
    correct: 0,
    topic: 'Gaseous Effusion - Graham\'s Law Quantitative Ratio',
    chapter: 'Gases',
    explain: 'Graham\'s law states: Rate1 / Rate2 = √(M2 / M1). For CH4 vs SO2: Rate(CH4) / Rate(SO2) = √(64 / 16) = √4 = 2.0. Therefore, methane effuses exactly twice as fast as sulfur dioxide.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-11',
    q: 'A real gas approaches ideal gas behavior most closely under which combination of thermodynamic conditions?',
    options: [
      'Low pressure and high temperature',
      'High pressure and low temperature',
      'High pressure and high temperature',
      'Low pressure and low temperature'
    ],
    correct: 0,
    topic: 'States of Matter - Conditions for Ideal Gas Behavior',
    chapter: 'Gases',
    explain: 'At low pressure, gas molecules are far apart, making their excluded volume negligible relative to the container volume. At high temperature, high kinetic energy overcomes attractive intermolecular forces. Thus, real gases behave most ideally at low pressure and high temperature.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-12',
    q: 'The root-mean-square speed (v_rms) of gas molecules in Maxwell-Boltzmann distribution is directly proportional to:',
    options: [
      'The square root of absolute temperature (√T)',
      'The absolute temperature squared (T²)',
      'The molar mass of the gas (M)',
      'The ambient pressure independent of temperature'
    ],
    correct: 0,
    topic: 'Kinetic Molecular Theory - Root-Mean-Square Velocity (v_rms)',
    chapter: 'Gases',
    explain: 'From kinetic theory, v_rms = √(3RT / M). Hence, root-mean-square velocity is directly proportional to the square root of absolute temperature (√T) and inversely proportional to the square root of molar mass (1/√M).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Liquids and Solids (4 MCQs: 13 to 16) ---
  {
    id: 'mdcat-b10-chem-13',
    q: 'Why does water (H2O) exhibit an anomalously higher normal boiling point (100°C) compared to hydrogen fluoride (HF, 19.5°C), even though fluorine is more electronegative than oxygen?',
    options: [
      'Each H2O molecule can form an average of four hydrogen bonds forming a 3D network, whereas HF forms an average of only two hydrogen bonds per molecule',
      'HF undergoes complete ionic dissociation in the gas phase',
      'H2O has a much smaller molar mass than HF',
      'The O-H covalent bond is shorter and weaker than the F-H bond'
    ],
    correct: 0,
    topic: 'Intermolecular Forces - Hydrogen Bonding in H2O vs HF',
    chapter: 'Liquids and Solids',
    explain: 'Although the H-F bond dipole is stronger, an HF molecule has only one hydrogen atom (and three lone pairs), limiting it to an average of two hydrogen bonds per molecule (linear chains). An H2O molecule has two hydrogens and two lone pairs, forming an extensive tetrahedral network of four hydrogen bonds per molecule.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-14',
    q: 'In the face-centered cubic (FCC) unit cell lattice of crystalline copper, what is the total effective number of copper atoms contained within a single unit cell?',
    options: [
      '4 atoms',
      '2 atoms',
      '1 atom',
      '8 atoms'
    ],
    correct: 0,
    topic: 'Solids - Face-Centered Cubic (FCC) Unit Cell Stoichiometry',
    chapter: 'Liquids and Solids',
    explain: 'An FCC unit cell contains atoms at 8 corners and 6 faces: (8 corners × 1/8 share) + (6 face centers × 1/2 share) = 1 + 3 = 4 net atoms per unit cell. (Its atomic packing factor is 74%).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-15',
    q: 'Isomorphism in crystallography refers to the phenomenon where two distinct chemical substances:',
    options: [
      'Possess identical crystal forms and unit cell geometry because they have similar chemical formulas and atomic radius ratios',
      'Exist in two or more distinct crystalline forms depending on crystallization temperature',
      'Have identical empirical formulas but different molecular weights',
      'Exhibit identical optical rotation of plane-polarized light'
    ],
    correct: 0,
    topic: 'Crystalline Solids - Isomorphism vs Polymorphism',
    chapter: 'Liquids and Solids',
    explain: 'Isomorphous substances (e.g., NaF and MgO, or K2SO4 and K2SeO4) have the same crystalline form because their constituent ions have identical stoichiometry and comparable ionic radius ratios. Polymorphism refers to a single chemical entity adopting multiple crystal structures.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-16',
    q: 'The vapor pressure of a pure liquid in a closed container depends exclusively on which of the following variables?',
    options: [
      'The temperature of the liquid and the nature of intermolecular forces',
      'The surface area of the liquid exposed to the vapor space',
      'The volume of empty headspace above the liquid',
      'The total atmospheric pressure of the surrounding room'
    ],
    correct: 0,
    topic: 'Liquids - Dynamic Vapor Pressure and Thermodynamic Dependence',
    chapter: 'Liquids and Solids',
    explain: 'Equilibrium vapor pressure is an intensive property defined by the Clausius-Clapeyron equation: ln(P) = -ΔH_vap / (RT) + C. It depends solely on temperature and the intrinsic strength of intermolecular attractive forces, and is independent of liquid surface area, volume, or ambient external pressure.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Chemical Energetics (4 MCQs: 17 to 20) ---
  {
    id: 'mdcat-b10-chem-17',
    q: 'In the Born-Haber cycle for the formation of crystalline sodium chloride: Na(s) + 1/2 Cl2(g) → NaCl(s), which of the component thermodynamic steps is strongly exothermic?',
    options: [
      'Lattice energy (condensation of gaseous Na⁺ and Cl⁻ ions into crystalline lattice) and electron affinity of chlorine',
      'Enthalpy of atomization of solid metallic sodium',
      'First ionization energy of gaseous sodium atoms',
      'Bond dissociation enthalpy of diatomic Cl2 gas'
    ],
    correct: 0,
    topic: 'Born-Haber Cycle - Exothermic Steps and Lattice Energy',
    chapter: 'Chemical Energetics',
    explain: 'In the Born-Haber cycle, atomization of Na(s), ionization of Na(g), and dissociation of Cl2(g) are endothermic (ΔH > 0). The electron affinity of Cl(g) (ΔH = -349 kJ/mol) and the crystal lattice energy (ΔH_latt = -787 kJ/mol) are strongly exothermic (ΔH < 0).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-18',
    q: 'For a chemical reaction occurring at constant temperature and pressure, which condition guarantees that the reaction is thermodynamically spontaneous in the forward direction?',
    options: [
      'The change in Gibbs free energy is negative (ΔG < 0)',
      'The standard enthalpy change is positive (ΔH > 0)',
      'The entropy change of the system is zero (ΔS = 0)',
      'The activation energy (Ea) is exactly zero'
    ],
    correct: 0,
    topic: 'Chemical Thermodynamics - Gibbs Free Energy and Spontaneity Criterion',
    chapter: 'Chemical Energetics',
    explain: 'According to the second law of thermodynamics, at constant temperature and pressure, the criterion for spontaneity is ΔG = ΔH - TΔS < 0. When ΔG is negative, the reaction is exergonic and spontaneous.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-19',
    q: 'When 100 mL of 1.0 M HCl is completely neutralized by 100 mL of 1.0 M NaOH in a constant-pressure coffee-cup calorimeter, the measured standard enthalpy of neutralization (ΔH_neut°) is approximately:',
    options: [
      '-57.3 kJ per mole of H2O formed',
      '-285.8 kJ per mole of H2O formed',
      '+57.3 kJ per mole of H2O formed',
      '-114.6 kJ per mole of H2O formed'
    ],
    correct: 0,
    topic: 'Thermochemistry - Enthalpy of Neutralization of Strong Acid and Strong Base',
    chapter: 'Chemical Energetics',
    explain: 'The neutralization of any strong acid by a strong base represents the reaction: H⁺(aq) + OH⁻(aq) → H2O(l). Because strong acids and bases are fully dissociated, the enthalpy of neutralization is a constant value of approximately -57.3 kJ/mol (-13.7 kcal/mol) of water formed.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-20',
    q: 'If the bond dissociation energy of H-H is 436 kJ/mol, Cl-Cl is 242 kJ/mol, and H-Cl is 431 kJ/mol, what is the enthalpy change (ΔH) for the gas-phase synthesis reaction: H2(g) + Cl2(g) → 2HCl(g)?',
    options: [
      '-184 kJ',
      '+184 kJ',
      '-92 kJ',
      '+247 kJ'
    ],
    correct: 0,
    topic: 'Thermochemistry - Enthalpy Change Calculation from Bond Energies',
    chapter: 'Chemical Energetics',
    explain: 'ΔH = Σ(Bond energy of bonds broken) - Σ(Bond energy of bonds formed) = [BE(H-H) + BE(Cl-Cl)] - [2 × BE(H-Cl)] = [436 + 242] - [2 × 431] = 678 - 862 = -184 kJ.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Chemical Equilibrium (4 MCQs: 21 to 24) ---
  {
    id: 'mdcat-b10-chem-21',
    q: 'For the exothermic synthesis of ammonia in the Haber-Bosch process: N2(g) + 3H2(g) ⇌ 2NH3(g) (ΔH = -92 kJ/mol), which change in conditions will shift the equilibrium position toward higher yield of NH3 according to Le Chatelier\'s principle?',
    options: [
      'Increasing total system pressure and lowering temperature',
      'Decreasing total system pressure and raising temperature',
      'Adding an iron catalyst at constant volume',
      'Continuously removing N2 gas from the reactor'
    ],
    correct: 0,
    topic: 'Le Chatelier\'s Principle - Haber Process Ammonia Synthesis',
    chapter: 'Chemical Equilibrium',
    explain: 'The forward reaction involves a decrease in gas moles (4 moles of reactants → 2 moles of product) and is exothermic (ΔH < 0). By Le Chatelier\'s principle, increasing pressure favors the side with fewer gas moles (NH3), and decreasing temperature shifts equilibrium in the exothermic forward direction.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-22',
    q: 'How are the equilibrium constants Kp and Kc mathematically related for the reversible thermal dissociation of dinitrogen tetroxide: N2O4(g) ⇌ 2NO2(g)?',
    options: [
      'Kp = Kc (RT)¹',
      'Kp = Kc (RT)²',
      'Kp = Kc / (RT)',
      'Kp = Kc'
    ],
    correct: 0,
    topic: 'Chemical Equilibrium - Relationship between Kp and Kc (Δn = 1)',
    chapter: 'Chemical Equilibrium',
    explain: 'The general relation is Kp = Kc (RT)^Δn, where Δn = (moles of gaseous products) - (moles of gaseous reactants). For N2O4(g) ⇌ 2NO2(g), Δn = 2 - 1 = 1. Hence, Kp = Kc (RT)¹.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-23',
    q: 'If the solubility product constant (Ksp) of silver chromate (Ag2CrO4) at 25°C is 1.1 × 10⁻¹², what is its molar solubility (S) in pure water?',
    options: [
      'S = ³√(Ksp / 4) ≈ 6.5 × 10⁻⁵ mol/L',
      'S = √(Ksp) ≈ 1.05 × 10⁻⁶ mol/L',
      'S = ⁴√(Ksp / 27) ≈ 2.2 × 10⁻⁴ mol/L',
      'S = Ksp / 2 ≈ 5.5 × 10⁻¹³ mol/L'
    ],
    correct: 0,
    topic: 'Equilibrium - Ksp and Molar Solubility for A2B Sparingly Soluble Salts',
    chapter: 'Chemical Equilibrium',
    explain: 'Dissociation: Ag2CrO4(s) ⇌ 2Ag⁺(aq) + CrO4²⁻(aq). If solubility is S mol/L, then [Ag⁺] = 2S and [CrO4²⁻] = S. Ksp = [Ag⁺]² [CrO4²⁻] = (2S)² (S) = 4S³. Therefore, S = ³√(Ksp / 4) = ³√((1.1 × 10⁻¹²) / 4) ≈ 6.5 × 10⁻⁵ mol/L.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-24',
    q: 'What happens to the numerical value of the chemical equilibrium constant Kc of an endothermic reaction when the reaction temperature is increased?',
    options: [
      'Kc increases because heat acts as an effective reactant, driving product formation',
      'Kc decreases because products decompose faster',
      'Kc remains strictly unchanged because only a catalyst alters Kc',
      'Kc drops to zero as activation energy is exceeded'
    ],
    correct: 0,
    topic: 'Equilibrium Constant - Temperature Dependence via van \'t Hoff Equation',
    chapter: 'Chemical Equilibrium',
    explain: 'By the van \'t Hoff equation (d ln Kc / dT = ΔH° / RT²), for an endothermic reaction (ΔH° > 0), raising temperature increases the value of Kc. Temperature is the only thermodynamic variable that changes the numerical value of Kc.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Electrochemistry (4 MCQs: 25 to 28) ---
  {
    id: 'mdcat-b10-chem-25',
    q: 'In the standard Daniell voltaic cell: Zn(s) | Zn²⁺(1 M) || Cu²⁺(1 M) | Cu(s), if E°(Zn²⁺/Zn) = -0.76 V and E°(Cu²⁺/Cu) = +0.34 V, what is the standard cell potential (E°_cell)?',
    options: [
      '+1.10 V',
      '+0.42 V',
      '-1.10 V',
      '+0.76 V'
    ],
    correct: 0,
    topic: 'Galvanic Cells - Standard Cell Potential (E°_cell) of Daniell Cell',
    chapter: 'Electrochemistry',
    explain: 'E°_cell = E°_cathode (reduction) - E°_anode (oxidation) = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = (+0.34 V) - (-0.76 V) = +0.34 V + 0.76 V = +1.10 V.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-26',
    q: 'According to Faraday\'s first law of electrolysis, how much electrical charge (in Coulombs) is required to deposit exactly 1.0 mole of copper metal from an aqueous solution of copper(II) sulfate (CuSO4)? (1 Faraday F ≈ 96,500 C)',
    options: [
      '193,000 C (2 Faradays)',
      '96,500 C (1 Faraday)',
      '48,250 C (0.5 Faraday)',
      '289,500 C (3 Faradays)'
    ],
    correct: 0,
    topic: 'Electrolysis - Faraday\'s Law and Stoichiometric Charge Calculation',
    chapter: 'Electrochemistry',
    explain: 'The reduction cathode half-reaction is: Cu²⁺(aq) + 2 e⁻ → Cu(s). To reduce 1 mole of Cu²⁺ ions requires 2 moles of electrons. Total electrical charge Q = n × F = 2 mol × 96,500 C/mol = 193,000 Coulombs (2 F).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-27',
    q: 'In the commercial lead-acid storage battery, what chemical transformations occur at the positive and negative plates during electrical discharge?',
    options: [
      'Both the spongy lead anode (Pb) and lead dioxide cathode (PbO2) are converted into lead(II) sulfate (PbSO4), consuming sulfuric acid',
      'Pb is oxidized to PbO at the anode while PbO2 is reduced to metallic Pb at the cathode',
      'Lead sulfate is converted into lead metal and sulfuric acid is generated',
      'Water is electrolyzed into hydrogen and oxygen gases at both electrodes'
    ],
    correct: 0,
    topic: 'Batteries - Lead-Acid Storage Battery Discharge Reactions',
    chapter: 'Electrochemistry',
    explain: 'During discharge: Anode: Pb(s) + HSO4⁻ → PbSO4(s) + H⁺ + 2e⁻. Cathode: PbO2(s) + HSO4⁻ + 3H⁺ + 2e⁻ → PbSO4(s) + 2H2O. Both plates convert to insoluble PbSO4(s), while H2SO4 is consumed, lowering the electrolyte density.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-28',
    q: 'In the standard hydrogen electrode (SHE), assigned an arbitrary standard reduction potential of 0.00 V at all temperatures, the platinum electrode is coated with platinum black to:',
    options: [
      'Provide a catalytic high-surface-area interface for the equilibrium: 2H⁺(aq) + 2e⁻ ⇌ H2(g)',
      'Prevent acidic protons from reacting with water molecules',
      'Generate an irreversible electrical resistance across the half-cell',
      'Act as a sacrificial anode that oxidizes before hydrogen'
    ],
    correct: 0,
    topic: 'Standard Hydrogen Electrode - Platinum Black Function',
    chapter: 'Electrochemistry',
    explain: 'Platinum is chemically inert and does not take part in the redox reaction. Coating it with finely divided platinum black increases its effective surface area and catalytically adsorbs H2 gas at 1 atm in contact with 1.0 M H⁺(aq) to establish rapid reversible thermodynamic equilibrium: 2H⁺ + 2e⁻ ⇌ H2.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Chemical Kinetics (4 MCQs: 29 to 32) ---
  {
    id: 'mdcat-b10-chem-29',
    q: 'For a first-order chemical reaction with rate constant k = 0.0693 min⁻¹, what is the half-life (t_1/2) of the reaction?',
    options: [
      '10 minutes',
      '1.0 minute',
      '6.93 minutes',
      '100 minutes'
    ],
    correct: 0,
    topic: 'Chemical Kinetics - First-Order Half-Life Calculation',
    chapter: 'Chemical Kinetics',
    explain: 'For a first-order reaction, half-life is independent of initial substrate concentration: t_1/2 = ln(2) / k = 0.693 / k. Substituting k = 0.0693 min⁻¹: t_1/2 = 0.693 / 0.0693 = 10 minutes.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-30',
    q: 'Experimental kinetic measurements for the reaction A + 2B → C show that doubling [A] while keeping [B] constant quadruples the rate, while doubling [B] while keeping [A] constant doubles the rate. What is the differential rate law and overall order?',
    options: [
      'Rate = k [A]² [B]; third order overall',
      'Rate = k [A] [B]²; third order overall',
      'Rate = k [A]² [B]²; fourth order overall',
      'Rate = k [A] [B]; second order overall'
    ],
    correct: 0,
    topic: 'Rate Laws - Determination of Reaction Order from Kinetic Data',
    chapter: 'Chemical Kinetics',
    explain: 'Rate ∝ [A]^m [B]^n. Doubling [A] quadruples the rate (2^m = 4 → m = 2, second order in A). Doubling [B] doubles the rate (2^n = 2 → n = 1, first order in B). Rate = k [A]² [B]¹. Overall reaction order = 2 + 1 = 3 (third order).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-31',
    q: 'According to the Arrhenius equation: k = A e^(-Ea / RT), a plot of ln(k) versus 1/T yields a straight line with what slope?',
    options: [
      '-Ea / R',
      '+Ea / R',
      '-Ea / (2.303 R)',
      '-A / R'
    ],
    correct: 0,
    topic: 'Arrhenius Equation - Plot of ln(k) vs 1/T and Activation Energy',
    chapter: 'Chemical Kinetics',
    explain: 'Taking natural logarithms: ln(k) = ln(A) - (Ea / R)(1/T). This matches the linear form y = mx + c where y = ln(k), x = 1/T, intercept c = ln(A), and slope m = -Ea / R. (If plotted with log10, slope is -Ea / (2.303 R)).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-32',
    q: 'How does the addition of a positive catalyst accelerate a chemical reaction without being consumed?',
    options: [
      'It provides an alternative reaction pathway with lower activation energy (Ea)',
      'It increases the average kinetic energy of the reacting molecules',
      'It makes the overall enthalpy change (ΔH) significantly more negative',
      'It increases the collision frequency between reactant molecules by a factor of 10⁶'
    ],
    correct: 0,
    topic: 'Catalysis - Mechanism of Activation Energy Lowering',
    chapter: 'Chemical Kinetics',
    explain: 'A catalyst offers an alternate mechanistic pathway involving a different transition state with lower activation energy (Ea). Consequently, a much larger fraction of colliding molecules possesses kinetic energy greater than or equal to Ea, dramatically increasing reaction rate without changing ΔH or equilibrium position.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Solutions and Colligative Properties (4 MCQs: 33 to 36) ---
  {
    id: 'mdcat-b10-chem-33',
    q: 'According to Raoult\'s law for an ideal binary liquid solution of two volatile components A and B, the total vapor pressure (P_total) above the solution is given by:',
    options: [
      'P_total = P°_A X_A + P°_B X_B',
      'P_total = (P°_A / X_A) + (P°_B / X_B)',
      'P_total = P°_A + P°_B',
      'P_total = (P°_A X_B) - (P°_B X_A)'
    ],
    correct: 0,
    topic: 'Raoult\'s Law - Ideal Binary Liquid Mixtures and Total Vapor Pressure',
    chapter: 'Solutions and Colligative Properties',
    explain: 'Raoult\'s law states that the partial vapor pressure of each volatile component in an ideal solution is equal to the vapor pressure of the pure component multiplied by its mole fraction in liquid: P_A = P°_A X_A and P_B = P°_B X_B. By Dalton\'s law of partial pressures: P_total = P_A + P_B = P°_A X_A + P°_B X_B.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-34',
    q: 'What is the van \'t Hoff factor (i) for an ideal, completely dissociated aqueous solution of calcium chloride (CaCl2)?',
    options: [
      'i = 3',
      'i = 1',
      'i = 2',
      'i = 4'
    ],
    correct: 0,
    topic: 'Colligative Properties - Van \'t Hoff Factor for Complete Dissociation',
    chapter: 'Solutions and Colligative Properties',
    explain: 'CaCl2 dissociates completely in water: CaCl2(s) → Ca²⁺(aq) + 2Cl⁻(aq). One mole of calcium chloride produces 1 mole of Ca²⁺ and 2 moles of Cl⁻, yielding a total of 3 moles of solute particles per mole of formula units. Thus, the theoretical van \'t Hoff factor i = 3.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-35',
    q: 'A 0.10 molal aqueous solution of which of the following non-volatile solutes will exhibit the lowest freezing point?',
    options: [
      'AlCl3 (aluminum chloride, assuming complete dissociation)',
      'NaCl (sodium chloride)',
      'CaCl2 (calcium chloride)',
      'Glucose (C6H12O6)'
    ],
    correct: 0,
    topic: 'Colligative Properties - Freezing Point Depression Comparison',
    chapter: 'Solutions and Colligative Properties',
    explain: 'Freezing point depression ΔTf = i × Kf × m. For equal molality (0.10 m): Glucose has i = 1 (ΔTf ∝ 0.10); NaCl has i = 2 (ΔTf ∝ 0.20); CaCl2 has i = 3 (ΔTf ∝ 0.30); AlCl3 dissociates into 1 Al³⁺ + 3 Cl⁻ giving i = 4 (ΔTf ∝ 0.40). Highest ΔTf produces the lowest actual freezing point.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-36',
    q: 'The osmotic pressure (π) of a dilute solution containing n moles of non-volatile solute in volume V at temperature T is mathematically described by the van \'t Hoff equation as:',
    options: [
      'π = C R T (where C = n / V)',
      'π = C / (R T)',
      'π = R T / C',
      'π = (n² R T) / V²'
    ],
    correct: 0,
    topic: 'Colligative Properties - Van \'t Hoff Equation for Osmotic Pressure',
    chapter: 'Solutions and Colligative Properties',
    explain: 'Jacobus Henricus van \'t Hoff demonstrated that dilute solutions obey an equation analogous to the ideal gas law: π V = n R T, or π = (n / V) R T = C R T, where C is the molarity (mol/L), R is the gas constant (0.0821 L·atm/mol·K), and T is absolute temperature in Kelvin.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Acids, Bases and Salts (4 MCQs: 37 to 40) ---
  {
    id: 'mdcat-b10-chem-37',
    q: 'According to the Bronsted-Lowry acid-base theory, what are the conjugate acid-base pairs in the forward aqueous equilibrium: NH3 + H2O ⇌ NH4⁺ + OH⁻?',
    options: [
      'H2O is an acid and OH⁻ is its conjugate base; NH3 is a base and NH4⁺ is its conjugate acid',
      'NH3 is an acid and OH⁻ is its conjugate base; H2O is a base and NH4⁺ is its conjugate acid',
      'NH4⁺ and OH⁻ are conjugate acid-base pairs',
      'NH3 and H2O are conjugate acid-base pairs'
    ],
    correct: 0,
    topic: 'Acid-Base Theories - Bronsted-Lowry Conjugate Acid-Base Pairs',
    chapter: 'Acids, Bases and Salts',
    explain: 'An acid donates H⁺ and a base accepts H⁺. H2O donates a proton to form OH⁻ (Pair 1: H2O acid / OH⁻ conjugate base). NH3 accepts a proton to form NH4⁺ (Pair 2: NH3 base / NH4⁺ conjugate acid).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-38',
    q: 'What is the pH of a 1.0 × 10⁻⁸ M aqueous solution of hydrochloric acid (HCl) at 25°C?',
    options: [
      'Slightly below 7 (approximately 6.96 to 6.98)',
      'Exactly 8.0',
      'Exactly 7.0',
      '1.0'
    ],
    correct: 0,
    topic: 'pH Calculations - Extremely Dilute Strong Acid Solutions and Water Autoionization',
    chapter: 'Acids, Bases and Salts',
    explain: 'In ultra-dilute acid (10⁻⁸ M HCl), autoionization of water cannot be neglected. Total [H⁺] = [H⁺]_HCl + [H⁺]_H2O = 10⁻⁸ + x. From Kw = [H⁺][OH⁻] = (10⁻⁸ + x)(x) = 1.0 × 10⁻¹⁴. Solving gives x ≈ 9.5 × 10⁻⁸ M, so total [H⁺] ≈ 1.05 × 10⁻⁷ M, yielding pH = -log(1.05 × 10⁻⁷) ≈ 6.98. Acidic solutions can never have pH > 7 at 25°C.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-39',
    q: 'According to the Henderson-Hasselbalch equation, what is the pH of an acidic buffer solution containing 0.1 M acetic acid (CH3COOH) and 0.1 M sodium acetate (CH3COONa), given that pKa of acetic acid is 4.74?',
    options: [
      '4.74',
      '5.74',
      '3.74',
      '7.00'
    ],
    correct: 0,
    topic: 'Buffer Solutions - Henderson-Hasselbalch Equation and Equimolar Buffers',
    chapter: 'Acids, Bases and Salts',
    explain: 'Henderson-Hasselbalch equation: pH = pKa + log([Conjugate Base] / [Acid]). When [Salt] = [Acid] (0.1 M / 0.1 M = 1), log(1) = 0. Therefore, pH = pKa + 0 = 4.74. An equimolar buffer operates at maximum buffer capacity with pH = pKa.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-40',
    q: 'Which of the following salts undergoes cationic hydrolysis in aqueous solution, resulting in an acidic solution with a pH less than 7 at 25°C?',
    options: [
      'Ammonium chloride (NH4Cl)',
      'Sodium acetate (CH3COONa)',
      'Sodium chloride (NaCl)',
      'Potassium cyanide (KCN)'
    ],
    correct: 0,
    topic: 'Salt Hydrolysis - Salt of Weak Base and Strong Acid (NH4Cl)',
    chapter: 'Acids, Bases and Salts',
    explain: 'NH4Cl is the salt of a weak base (NH3) and a strong acid (HCl). The ammonium cation hydrolyzes in water: NH4⁺(aq) + H2O(l) ⇌ NH3(aq) + H3O⁺(aq). The accumulation of hydronium ions yields an acidic solution (pH < 7). Cl⁻ does not hydrolyze.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- s-Block and p-Block Elements (3 MCQs: 41 to 43) ---
  {
    id: 'mdcat-b10-chem-41',
    q: 'Why does beryllium (Be) exhibit anomalous chemical properties compared to the other Group 2 alkaline earth metals, including forming predominantly covalent rather than ionic compounds?',
    options: [
      'Extremely small ionic radius and high charge density leading to strong polarizing power (Fajans\' rules)',
      'Presence of vacant d-orbitals in its valence shell',
      'Very low first and second ionization energies',
      'Ability to form stable trivalent cations (Be³⁺)'
    ],
    correct: 0,
    topic: 's-Block Elements - Anomalous Properties of Beryllium and Fajans\' Rules',
    chapter: 's-Block and p-Block Elements',
    explain: 'Beryllium has an exceptionally small atomic and ionic radius (Be²⁺ ionic radius ~31 pm). This generates an enormous charge density and polarizing power. According to Fajans\' rules, high polarizing power severely distorts anion electron clouds, conferring high covalent character to beryllium halides (e.g., BeCl2 is covalent and polymeric).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-42',
    q: 'In the contact process for industrial manufacture of sulfuric acid (H2SO4), what solid heterogeneous catalyst is employed to oxidize SO2 to SO3 at 450°C?',
    options: [
      'Vanadium(V) oxide (V2O5)',
      'Finely divided metallic iron (Fe)',
      'Nickel-aluminum alloy (Raney nickel)',
      'Platinized asbestos'
    ],
    correct: 0,
    topic: 'p-Block Elements - Contact Process and Vanadium Pentoxide Catalyst',
    chapter: 's-Block and p-Block Elements',
    explain: 'In the Contact Process, sulfur dioxide is converted to sulfur trioxide: 2SO2(g) + O2(g) ⇌ 2SO3(g) (ΔH = -196 kJ/mol). Vanadium pentoxide (V2O5) supported on silica is used as the commercial catalyst at ~450°C and 1-2 atm.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-43',
    q: 'What is the molecular geometry and hybridization of the central sulfur atom in sulfur hexafluoride (SF6) according to VSEPR theory?',
    options: [
      'Octahedral geometry with sp³d² hybridization',
      'Trigonal bipyramidal geometry with sp³d hybridization',
      'Square planar geometry with dsp² hybridization',
      'Tetrahedral geometry with sp³ hybridization'
    ],
    correct: 0,
    topic: 'p-Block Chemistry - Molecular Geometry of SF6 (VSEPR)',
    chapter: 's-Block and p-Block Elements',
    explain: 'In SF6, the central sulfur atom has 6 valence electrons and forms 6 single covalent bonds with fluorine atoms with 0 lone pairs (Steric Number = 6). VSEPR predicts sp³d² hybridization with regular octahedral geometry and 90° F-S-F bond angles.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Transition Elements (3 MCQs: 44 to 46) ---
  {
    id: 'mdcat-b10-chem-44',
    q: 'Why are aqueous solutions of scandium(III) salts [Sc³⁺(aq)] and zinc(II) salts [Zn²⁺(aq)] completely colorless?',
    options: [
      'Sc³⁺ has an empty d-subshell (3d⁰) and Zn²⁺ has a completely filled d-subshell (3d¹⁰), so neither can undergo d-d electronic transitions in the visible spectrum',
      'Both cations form giant ionic polymers that scatter all visible light',
      'Their d-orbitals are degenerate and cannot be split by water ligands',
      'They absorb only monochromatic gamma radiation'
    ],
    correct: 0,
    topic: 'Transition Elements - Color Origin and Absence in d0 and d10 Ions',
    chapter: 'Transition Elements',
    explain: 'The characteristic colors of transition metal complexes arise from d-d transitions when degenerate d-orbitals split in a crystal field. Sc³⁺ has a 3d⁰ configuration (no d-electrons to promote), and Zn²⁺ has a 3d¹⁰ configuration (all d-orbitals completely filled; no vacant d-level). Hence, both are colorless.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-45',
    q: 'What is the coordination number and oxidation state of the central iron atom in the coordination complex potassium hexacyanoferrate(II): K4[Fe(CN)6]?',
    options: [
      'Coordination number = 6; Oxidation state = +2',
      'Coordination number = 4; Oxidation state = +3',
      'Coordination number = 6; Oxidation state = +3',
      'Coordination number = 2; Oxidation state = +4'
    ],
    correct: 0,
    topic: 'Coordination Chemistry - Coordination Number and Oxidation State Calculation',
    chapter: 'Transition Elements',
    explain: 'In K4[Fe(CN)6], the complex anion is [Fe(CN)6]⁴⁻. Six monodentate cyanide ligands (CN⁻) are directly bonded to iron, so Coordination Number = 6. Let x be the oxidation state of Fe: x + 6(-1) = -4 → x - 6 = -4 → x = +2.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-46',
    q: 'According to Crystal Field Theory (CFT), an octahedral coordination complex of Cr³⁺ (electronic configuration 3d³) in an aqueous medium has what ground-state d-electron configuration?',
    options: [
      't2g³ eg⁰',
      't2g² eg¹',
      't2g⁰ eg³',
      't2g¹ eg²'
    ],
    correct: 0,
    topic: 'Crystal Field Theory - d-Orbital Splitting in Octahedral Complexes',
    chapter: 'Transition Elements',
    explain: 'In an octahedral crystal field, the 5 degenerate d-orbitals split into a lower-energy triply degenerate set (t2g: dxy, dyz, dxz) and a higher-energy doubly degenerate set (eg: dx²-y², dz²). For a 3d³ ion like Cr³⁺, Hund\'s rule places one electron in each of the three t2g orbitals with parallel spins, giving t2g³ eg⁰.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Fundamental Principles of Organic Chemistry (3 MCQs: 47 to 49) ---
  {
    id: 'mdcat-b10-chem-47',
    q: 'In the molecule ethyne (acetylene, H-C≡C-H), what is the hybridization of the carbon atoms and the composition of the carbon-carbon triple bond?',
    options: [
      'sp hybridization; the triple bond consists of one σ (sp-sp) bond and two mutually perpendicular π (2py-2py and 2pz-2pz) bonds',
      'sp² hybridization; one σ bond and two π bonds',
      'sp³ hybridization; three σ bonds',
      'sp hybridization; three π bonds without a σ bond'
    ],
    correct: 0,
    topic: 'Organic Chemistry - Hybridization and Bonding in Alkynes',
    chapter: 'Fundamental Principles of Organic Chemistry',
    explain: 'Each carbon in ethyne forms two linear σ bonds (one with H via sp-1s, one with C via sp-sp) with 180° bond angles (sp hybridization). The two unhybridized p-orbitals (2py and 2pz) on each carbon overlap sideways to form two mutually perpendicular π-bonds (cylindrical π electron cloud).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-48',
    q: 'Which of the following pairs of organic molecules illustrates tautomerism (a dynamic functional isomerism involving proton relocation)?',
    options: [
      'Acetaldehyde (CH3-CH=O) and Ethenol (CH2=CH-OH)',
      '1-Propanol and 2-Propanol',
      'Diethyl ether and Methyl propyl ether',
      'cis-2-Butene and trans-2-Butene'
    ],
    correct: 0,
    topic: 'Isomerism - Keto-Enol Tautomerism',
    chapter: 'Fundamental Principles of Organic Chemistry',
    explain: 'Tautomerism is a special form of functional group isomerism where two constitutional isomers interconvert rapidly through the migration of a mobile proton accompanied by a shift in a double bond. Acetaldehyde (keto form) and vinyl alcohol / ethenol (enol form) represent classic keto-enol tautomers.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-49',
    q: 'Which of the following organic structures contains a chiral (asymmetric) carbon center and can therefore exist as a pair of non-superimposable optical enantiomers?',
    options: [
      '2-Chlorobutane (CH3-CH(Cl)-CH2-CH3)',
      '2-Chloropropane (CH3-CH(Cl)-CH3)',
      '1-Chlorobutane (CH3-CH2-CH2-CH2-Cl)',
      'Ethanol (CH3-CH2-OH)'
    ],
    correct: 0,
    topic: 'Optical Isomerism - Asymmetric Chiral Carbon and Enantiomers',
    chapter: 'Fundamental Principles of Organic Chemistry',
    explain: 'A chiral carbon is bonded to four distinctly different atoms or groups. In 2-chlorobutane, C2 is bonded to: (1) -H, (2) -Cl, (3) -CH3, and (4) -CH2CH3 (ethyl). Having four distinct substituents, C2 is a stereocenter capable of rotating plane-polarized light.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Hydrocarbons (3 MCQs: 50 to 52) ---
  {
    id: 'mdcat-b10-chem-50',
    q: 'According to Markovnikov\'s rule, what is the major organic product obtained when propene (CH3-CH=CH2) reacts with gaseous hydrogen bromide (HBr) in the absence of peroxides?',
    options: [
      '2-Bromopropane (isopropyl bromide)',
      '1-Bromopropane (n-propyl bromide)',
      '1,2-Dibromopropane',
      'Cyclopropane'
    ],
    correct: 0,
    topic: 'Electrophilic Addition - Markovnikov\'s Rule in Alkene Halogenation',
    chapter: 'Hydrocarbons',
    explain: 'Electrophilic addition proceeds through the more stable carbocation intermediate. Protonation of propene at C1 yields a secondary carbocation (CH3-C⁺H-CH3), which is more stable than the primary carbocation (CH3-CH2-C⁺H2) due to hyperconjugation. Attack by Br⁻ on the secondary carbocation gives 2-bromopropane as the major product.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-51',
    q: 'Why does benzene (C6H6) undergo electrophilic aromatic substitution rather than electrophilic addition reactions typical of aliphatic alkenes?',
    options: [
      'Substitution preserves the cyclic delocalized 6 π-electron sextet conferring thermodynamic aromatic resonance stabilization (150 kJ/mol)',
      'Benzene lacks double bonds entirely and is an alkane',
      'Aromatic C-H bonds are ionic and easily dissociated',
      'The ring is sterically blocked from nucleophilic attack'
    ],
    correct: 0,
    topic: 'Benzene - Aromatic Stability and Electrophilic Aromatic Substitution',
    chapter: 'Hydrocarbons',
    explain: 'Benzene possesses extraordinary thermodynamic stability (resonance energy of ~150 kJ/mol or 36 kcal/mol) due to complete cyclic conjugation of 6 π-electrons (Hückel\'s 4n+2 rule). Addition reactions would permanently destroy this aromatic stabilization, whereas electrophilic substitution regenerates the intact aromatic ring.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-52',
    q: 'In the free-radical chlorination of methane in the presence of ultraviolet light, what chemical reaction represents a termination step?',
    options: [
      'Two methyl radicals recombining to form ethane: •CH3 + •CH3 → CH3-CH3',
      'A chlorine radical reacting with methane: Cl• + CH4 → •CH3 + HCl',
      'A methyl radical reacting with Cl2: •CH3 + Cl2 → CH3Cl + Cl•',
      'Photodissociation of chlorine: Cl2 + hν → 2 Cl•'
    ],
    correct: 0,
    topic: 'Free Radical Mechanisms - Initiation, Propagation, and Termination Steps',
    chapter: 'Hydrocarbons',
    explain: 'Initiation creates free radicals (Cl2 + hν → 2 Cl•). Propagation steps consume one radical and produce another. Termination occurs whenever any two free radicals collide and combine to form a stable covalent molecule without generating new radicals (e.g., •CH3 + •CH3 → C2H6).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Alkyl Halides (3 MCQs: 53 to 55) ---
  {
    id: 'mdcat-b10-chem-53',
    q: 'Which mechanism correctly describes the nucleophilic substitution reaction of primary alkyl halides (e.g., 1-bromobutane) with aqueous sodium hydroxide?',
    options: [
      'SN2 mechanism: a single-step concerted process involving backside nucleophilic attack, a pentacoordinate transition state, and complete inversion of stereochemical configuration (Walden inversion)',
      'SN1 mechanism: a two-step process via a planar carbocation intermediate producing racemization',
      'E1cB mechanism: involving an intermediate carbanion',
      'Electrophilic aromatic substitution via a sigma complex'
    ],
    correct: 0,
    topic: 'Alkyl Halides - SN2 Mechanism and Stereochemical Inversion',
    chapter: 'Alkyl Halides',
    explain: 'Primary alkyl halides possess minimal steric hindrance around the electrophilic α-carbon. Nucleophiles attack from the opposite side of the leaving group in a single concerted bimolecular step (Rate = k [R-X] [Nu⁻]), passing through a trigonal bipyramidal transition state that produces 100% inversion of configuration (Walden inversion).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-54',
    q: 'When preparing an alkylmagnesium halide (Grignard reagent, R-Mg-X), why must the reaction be conducted in anhydrous ether strictly free from all traces of moisture and water?',
    options: [
      'Grignard reagents are extremely strong carbanion bases that react violently with water to produce alkanes: R-MgX + H2O → R-H + Mg(OH)X',
      'Water oxidizes metallic magnesium into unreactive magnesium peroxide',
      'Ether reacts with water to form explosive peroxides',
      'Alkyl halides decompose into alkenes in the presence of water'
    ],
    correct: 0,
    topic: 'Grignard Reagents - Reactivity with Water and Anhydrous Conditions',
    chapter: 'Alkyl Halides',
    explain: 'The carbon-magnesium bond in Grignard reagents is strongly polarized (R^δ- — Mg^δ+), giving the alkyl carbon pronounced nucleophilic and basic carbanion character. Grignard reagents react quantitatively and rapidly with active proton donors like water: R-MgX + H2O → R-H + Mg(OH)X, destroying the reagent.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-55',
    q: 'According to Zaitsev\'s (Saytzeff\'s) rule for the base-induced dehydrohalogenation of secondary and tertiary alkyl halides, what is the major alkene formed?',
    options: [
      'The most highly substituted, thermodynamically stable alkene having the greatest number of alkyl substituents attached to the double-bond carbons',
      'The least substituted terminal alkene',
      'The cis-alkene exclusively due to steric hindrance',
      'A cyclic cycloalkane without a double bond'
    ],
    correct: 0,
    topic: 'Elimination Reactions - Zaitsev\'s Rule in Dehydrohalogenation',
    chapter: 'Alkyl Halides',
    explain: 'Zaitsev\'s rule states that in β-elimination (E2/E1) reactions of alkyl halides with non-bulky bases, base removes a proton preferentially from the β-carbon with fewer hydrogen atoms, yielding the most substituted, hyperconjugated, thermodynamically stable alkene as the major product.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Alcohols and Phenols (4 MCQs: 56 to 59) ---
  {
    id: 'mdcat-b10-chem-56',
    q: 'In the Lucas test for differentiating alcohols, anhydrous ZnCl2 in concentrated HCl is added to an unknown alcohol at room temperature. A cloudy precipitate forms immediately within seconds. What class of alcohol is present?',
    options: [
      'Tertiary alcohol (3° alcohol)',
      'Primary alcohol (1° alcohol)',
      'Secondary alcohol (2° alcohol)',
      'Phenol'
    ],
    correct: 0,
    topic: 'Alcohols - Lucas Test for Primary, Secondary, and Tertiary Alcohols',
    chapter: 'Alcohols and Phenols',
    explain: 'The Lucas reagent converts alcohols to insoluble alkyl chlorides via an SN1 carbocation mechanism. Tertiary alcohols form very stable 3° carbocations and react immediately (cloudiness in seconds). Secondary alcohols react within 5-10 minutes, while primary alcohols do not react at room temperature without heating.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-57',
    q: 'Why is phenol (C6H5OH, pKa ≈ 10) substantially more acidic than aliphatic alcohols like ethanol (C2H5OH, pKa ≈ 16)?',
    options: [
      'The phenoxide conjugate base is stabilized by resonance delocalization of its negative charge into the aromatic π-electron ring',
      'The hydroxyl oxygen in phenol is sp³ hybridized and cannot donate electrons',
      'Aliphatic alcohols form stable carbocations upon losing a proton',
      'Phenol contains a carboxylic acid functional group'
    ],
    correct: 0,
    topic: 'Acidity of Phenols - Phenoxide Anion Resonance Delocalization',
    chapter: 'Alcohols and Phenols',
    explain: 'Loss of H⁺ from phenol yields the phenoxide ion (C6H5O⁻). The negative charge on oxygen is resonance-delocalized over the ortho- and para-positions of the aromatic benzene ring across four contributing resonance structures. In ethoxide (C2H5O⁻), the negative charge is localized on oxygen, and the ethyl group destabilizes it by electron-donating induction (+I).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-58',
    q: 'When phenol is treated with excess aqueous bromine water at room temperature without a Lewis acid catalyst, what characteristic precipitate is formed?',
    options: [
      'A white precipitate of 2,4,6-tribromophenol',
      'A yellow precipitate of bromobenzene',
      'A brown liquid of o-bromophenol only',
      'A red precipitate of 4-bromocyclohexane'
    ],
    correct: 0,
    topic: 'Phenols - Bromine Water Test and 2,4,6-Tribromophenol Formation',
    chapter: 'Alcohols and Phenols',
    explain: 'The -OH group in phenol is strongly activating and ortho/para-directing due to +M resonance donation into the ring. In aqueous solution, ionization to phenoxide increases activation even further. Reaction with bromine water yields rapid polybromination, depositing a diagnostic white precipitate of 2,4,6-tribromophenol.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-59',
    q: 'Controlled oxidation of a secondary alcohol (such as 2-propanol) with acidified potassium dichromate (K2Cr2O7 / H2SO4) yields which carbonyl compound as the final oxidation product?',
    options: [
      'A ketone (propanone / acetone)',
      'An aldehyde (propanal)',
      'A carboxylic acid (propanoic acid)',
      'An ester (ethyl acetate)'
    ],
    correct: 0,
    topic: 'Alcohols - Oxidation of Secondary Alcohols to Ketones',
    chapter: 'Alcohols and Phenols',
    explain: 'Primary alcohols oxidize first to aldehydes and subsequently to carboxylic acids. Secondary alcohols possess only one α-hydrogen and oxidize exclusively to ketones (e.g., 2-propanol oxidizes to acetone), which resist further oxidation under non-destructive conditions. Tertiary alcohols lack α-hydrogens and resist oxidation.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Aldehydes and Ketones (4 MCQs: 60 to 63) ---
  {
    id: 'mdcat-b10-chem-60',
    q: 'Tollens\' reagent (ammoniacal silver nitrate, [Ag(NH3)2]⁺) is reduced to deposit an elemental silver mirror on the inner walls of a test tube by which class of organic compounds?',
    options: [
      'Aldehydes (both aliphatic and aromatic)',
      'Aliphatic ketones',
      'Aromatic ketones',
      'Tertiary alcohols'
    ],
    correct: 0,
    topic: 'Carbonyl Compounds - Tollens\' Silver Mirror Test for Aldehydes',
    chapter: 'Aldehydes and Ketones',
    explain: 'Aldehydes possess an oxidizable hydrogen atom directly attached to the carbonyl carbon, allowing them to be readily oxidized to carboxylate ions by mild oxidizing agents like Tollens\' reagent: R-CHO + 2[Ag(NH3)2]⁺ + 3OH⁻ → R-COO⁻ + 2Ag(s) + 4NH3 + 2H2O. Ketones lack this hydrogen and give a negative Tollens\' test.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-61',
    q: 'The iodoform test (reaction with I2 in aqueous NaOH) produces a diagnostic bright yellow crystalline precipitate of triiodomethane (CHI3) when reacted with which structural motif?',
    options: [
      'Methyl ketones (CH3-C=O) and secondary methyl carbinols (CH3-CH(OH)-R, including ethanol)',
      'All carboxylic acids and esters',
      'Tertiary alcohols lacking methyl groups',
      'Aromatic aldehydes like benzaldehyde'
    ],
    correct: 0,
    topic: 'Carbonyl Compounds - Iodoform Reaction and Structural Specificity',
    chapter: 'Aldehydes and Ketones',
    explain: 'The haloform reaction requires a methyl group adjacent to a carbonyl (CH3-CO-) or a group oxidizable to it (CH3-CH(OH)-). Halogenation in base converts the methyl to a trihalomethyl group (-CI3), which acts as a leaving group upon nucleophilic attack by OH⁻, precipitating yellow CHI3 (melting point 119°C).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-62',
    q: 'Which of the following aldehydes lacks α-hydrogen atoms and therefore undergoes the Cannizzaro disproportionation reaction when heated with concentrated alkali (50% NaOH)?',
    options: [
      'Benzaldehyde (C6H5CHO) and Formaldehyde (HCHO)',
      'Acetaldehyde (CH3CHO)',
      'Propionaldehyde (CH3CH2CHO)',
      'Acetone (CH3COCH3)'
    ],
    correct: 0,
    topic: 'Carbonyl Compounds - Cannizzaro Disproportionation Reaction',
    chapter: 'Aldehydes and Ketones',
    explain: 'Aldehydes possessing α-hydrogens undergo aldol condensation in base. Aldehydes lacking α-hydrogens (such as HCHO and C6H5CHO) cannot form enolate ions; instead, they undergo Cannizzaro self-redox disproportionation, where one molecule is reduced to an alcohol and another is oxidized to a carboxylic acid salt.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-63',
    q: 'In the nucleophilic addition of hydrogen cyanide (HCN) to acetaldehyde, what species acts as the attacking nucleophile in the rate-determining step?',
    options: [
      'Cyanide ion (:CN⁻)',
      'Hydronium ion (H3O⁺)',
      'Molecular hydrogen cyanide (HCN)',
      'Nitrogen gas'
    ],
    correct: 0,
    topic: 'Carbonyl Chemistry - Nucleophilic Addition of Cyanide Ion',
    chapter: 'Aldehydes and Ketones',
    explain: 'HCN is a weak acid and dissociates poorly on its own. A base catalyst generates cyanide ions (:CN⁻). The nucleophilic :CN⁻ attacks the electrophilic carbonyl carbon in the slow, rate-determining step, forming a tetrahedral alkoxide intermediate that随后 picks up a proton from HCN to yield the cyanohydrin.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },

  // --- Carboxylic Acids (4 MCQs: 64 to 67) ---
  {
    id: 'mdcat-b10-chem-64',
    q: 'Why do carboxylic acids (e.g., acetic acid) have significantly higher boiling points than alcohols of comparable molecular weight?',
    options: [
      'Carboxylic acid molecules form stable cyclic intermolecular hydrogen-bonded dimers in both liquid and vapor phases',
      'Carboxylic acids have higher covalent bond energies in their hydrocarbon tails',
      'Carboxylic acids contain basic nitrogen atoms',
      'The carboxyl group undergoes spontaneous free-radical polymerization'
    ],
    correct: 0,
    topic: 'Carboxylic Acids - Hydrogen-Bonded Dimerization and Boiling Points',
    chapter: 'Carboxylic Acids',
    explain: 'Carboxylic acids contain both a hydrogen-bond donor (-OH) and an exceptional acceptor (C=O). Two acid molecules form a cyclic eight-membered ring dimer held together by two strong complementary hydrogen bonds. This doubles their effective molecular mass and elevates boiling points above corresponding alcohols.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-65',
    q: 'In Fischer esterification, a carboxylic acid reacts with an alcohol in the presence of an acid catalyst (concentrated H2SO4) to form an ester and water. Isotopic labeling with oxygen-18 (¹⁸O) in the alcohol demonstrates that:',
    options: [
      'The ester oxygen originates from the alcohol, and water is formed from the carboxylic acid -OH group',
      'The water oxygen originates exclusively from the alcohol',
      'The carbonyl oxygen is expelled as water',
      'The reaction is an electrophilic aromatic substitution'
    ],
    correct: 0,
    topic: 'Esterification - Fischer Mechanism and Isotopic Tracing',
    chapter: 'Carboxylic Acids',
    explain: 'Fischer esterification proceeds via nucleophilic acyl substitution on the protonated carboxylic acid. When methanol containing ¹⁸O (CH3-¹⁸OH) is used, the ¹⁸O label appears in the ester product (R-CO-¹⁸OCH3), proving that the C-O bond of the carboxylic acid is cleaved and the alcohol oxygen is retained in the ester.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-66',
    q: 'Which of the following substituted acetic acids is the strongest acid due to the electron-withdrawing inductive effect (-I)?',
    options: [
      'Trichloroacetic acid (CCl3COOH)',
      'Dichloroacetic acid (CHCl2COOH)',
      'Monochloroacetic acid (CH2ClCOOH)',
      'Acetic acid (CH3COOH)'
    ],
    correct: 0,
    topic: 'Acidity of Carboxylic Acids - Inductive Effect of Halogens',
    chapter: 'Carboxylic Acids',
    explain: 'Electronegative chlorine atoms exert a strong electron-withdrawing inductive effect (-I), dispersing the negative charge on the carboxylate conjugate base (R-COO⁻) and stabilizing it. With three chlorines, CCl3COOH (pKa ≈ 0.65) is by far the strongest acid among the options.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-67',
    q: 'Decarboxylation of the sodium salt of a monocarboxylic acid by heating with soda lime (a mixture of NaOH and CaO) produces:',
    options: [
      'An alkane containing one fewer carbon atom than the parent carboxylic acid, and sodium carbonate (Na2CO3)',
      'An alkene of identical carbon chain length',
      'A symmetrical ketone and hydrogen gas',
      'An alcohol and carbon monoxide'
    ],
    correct: 0,
    topic: 'Carboxylic Acid Reactions - Soda Lime Decarboxylation',
    chapter: 'Carboxylic Acids',
    explain: 'Heating a sodium carboxylate with soda lime (NaOH + CaO) removes the carboxyl group as sodium carbonate: R-COONa + NaOH -(CaO, heat)→ R-H + Na2CO3. The resulting alkane contains one less carbon atom than the starting carboxylic acid salt.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Amino Acids and Proteins (4 MCQs: 68 to 71) ---
  {
    id: 'mdcat-b10-chem-68',
    q: 'At its characteristic isoelectric point (pI), an amino acid in aqueous solution exists predominantly in which ionic form?',
    options: [
      'A dipolar zwitterion (+H3N-CH(R)-COO⁻) with a net electrical charge of zero',
      'A fully protonated cation (+H3N-CH(R)-COOH) carrying a net +1 charge',
      'A fully deprotonated anion (H2N-CH(R)-COO⁻) carrying a net -1 charge',
      'An uncharged non-polar neutral covalent molecule (H2N-CH(R)-COOH)'
    ],
    correct: 0,
    topic: 'Amino Acids - Zwitterion Formation and Isoelectric Point (pI)',
    chapter: 'Amino Acids and Proteins',
    explain: 'At physiological pH and at the isoelectric point (pI), the amino group is protonated (-NH3⁺) and the carboxylic acid group is dissociated (-COO⁻). This dipolar dipolar ion is called a zwitterion. Because positive and negative charges balance, the net charge is zero and it does not migrate in an electric field.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-69',
    q: 'Which of the standard 20 amino acids is optically inactive (achiral) because its α-carbon is bonded to two identical hydrogen atoms?',
    options: [
      'Glycine',
      'Alanine',
      'Valine',
      'Leucine'
    ],
    correct: 0,
    topic: 'Amino Acids - Achiral Glycine and Asymmetric α-Carbon',
    chapter: 'Amino Acids and Proteins',
    explain: 'Glycine is the simplest amino acid, with -H as its side chain (R = H). Its α-carbon is bonded to two hydrogen atoms (NH2, COOH, H, H), meaning it lacks four distinct substituents. Consequently, glycine is symmetric, achiral, and optically inactive.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-70',
    q: 'In the Biuret test for proteins, an alkaline solution containing dilute copper(II) sulfate (CuSO4) produces a characteristic violet-purple coordination complex in the presence of:',
    options: [
      'Molecules containing two or more peptide linkages (-CO-NH-)',
      'Free individual monosaccharide units',
      'Isolated free amino acids lacking peptide bonds',
      'Saturated fatty acid triglyceride droplets'
    ],
    correct: 0,
    topic: 'Protein Tests - Biuret Test and Peptide Bond Detection',
    chapter: 'Amino Acids and Proteins',
    explain: 'The Biuret test detects peptide bonds. In alkaline solution, Cu²⁺ ions coordinate with four nitrogen atoms from adjacent peptide linkages (-CONH-) across peptide backbones, forming a characteristic violet-purple chelate complex. Free amino acids (except histidine) give a negative Biuret test.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-71',
    q: 'The α-helix and β-pleated sheet secondary structures of proteins are stabilized predominantly by:',
    options: [
      'Hydrogen bonds between peptide backbone amide N-H groups and carbonyl C=O oxygen atoms',
      'Covalent disulfide linkages between cysteine residues',
      'Ionic salt bridges between Lys and Asp side chains',
      'Hydrophobic interactions between non-polar side chains'
    ],
    correct: 0,
    topic: 'Protein Structure - Secondary Structure and Backbone Hydrogen Bonding',
    chapter: 'Amino Acids and Proteins',
    explain: 'Secondary protein structures (Linus Pauling\'s α-helix and β-pleated sheet) are maintained by regular, repetitive hydrogen bonding between backbone C=O (acceptor) and N-H (donor) groups. In an α-helix, the hydrogen bond forms between the C=O of residue n and the N-H of residue n+4.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },

  // --- Macromolecules and Environmental Chemistry (4 MCQs: 72 to 75) ---
  {
    id: 'mdcat-b10-chem-72',
    q: 'Nylon-6,6 is a commercially vital synthetic polyamide prepared by step-growth condensation polymerization between which two monomeric compounds?',
    options: [
      'Hexamethylenediamine and Adipic acid (hexanedioic acid)',
      'Caprolactam and ethylene glycol',
      'Terephthalic acid and ethylene glycol',
      'Styrene and 1,3-butadiene'
    ],
    correct: 0,
    topic: 'Polymers - Nylon-6,6 Synthesis and Condensation Polymerization',
    chapter: 'Macromolecules and Environmental Chemistry',
    explain: 'Nylon-6,6 is synthesized by condensing hexamethylenediamine, H2N-(CH2)6-NH2 (6 carbons), with adipic acid, HOOC-(CH2)4-COOH (6 carbons). Elimination of water molecules forms repeating amide linkages [-NH-(CH2)6-NH-CO-(CH2)4-CO-]n.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-73',
    q: 'In the stratosphere, chlorofluorocarbons (CFCs) deplete the protective ozone layer through a catalytic free-radical cycle initiated by ultraviolet photodissociation releasing:',
    options: [
      'Chlorine free radicals (Cl•)',
      'Fluoride anions (F⁻)',
      'Carbon dioxide molecules',
      'Methane radicals'
    ],
    correct: 0,
    topic: 'Environmental Chemistry - Stratospheric Ozone Depletion by CFCs',
    chapter: 'Macromolecules and Environmental Chemistry',
    explain: 'UV radiation (λ < 220 nm) cleaves C-Cl bonds in CFCs: CF2Cl2 + hν → •CF2Cl + Cl•. The chlorine radical catalytically destroys ozone in a self-sustaining cycle: Cl• + O3 → ClO• + O2, followed by ClO• + O• → Cl• + O2. A single chlorine radical can destroy over 100,000 ozone molecules.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-74',
    q: 'Photochemical smog, typical of sunny urban basins with heavy vehicular emissions, is characterized by a brownish haze caused primarily by which atmospheric pollutant?',
    options: [
      'Nitrogen dioxide (NO2) and secondary photochemical oxidants such as tropospheric ozone and peroxyacetyl nitrate (PAN)',
      'Sulfur dioxide (SO2) from coal combustion in damp winter fog',
      'Carbon monoxide (CO) reacting with nitrogen gas',
      'Chlorofluorocarbons dissolving water droplets'
    ],
    correct: 0,
    topic: 'Environmental Chemistry - Photochemical Smog and Peroxyacetyl Nitrate (PAN)',
    chapter: 'Macromolecules and Environmental Chemistry',
    explain: 'Photochemical (oxidizing / Los Angeles) smog forms when sunlight acts on vehicular NOx and unburned volatile hydrocarbons. NO is oxidized to brown NO2 gas, which photolyzes to yield ozone (O3), aldehydes, and eye-irritating peroxyacetyl nitrate (PAN). Classical smog is reducing (SO2 + soot).',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b10-chem-75',
    q: 'What is the primary chemical mechanism by which acid rain (pH < 5.6, resulting from atmospheric SO2 and NOx emissions) leaches toxic heavy metals from soil and causes ecological damage in freshwater aquatic ecosystems?',
    options: [
      'Protons (H⁺) displace bound toxic metal cations (such as Al³⁺ and Cd²⁺) from soil clay minerals into runoff water, where aluminum ions damage fish gills',
      'Acid rain neutralizes all dissolved oxygen in water bodies',
      'Sulfuric acid acts as a biological reducing agent that coagulates algae',
      'Acid rain precipitates calcium carbonate onto lake beds'
    ],
    correct: 0,
    topic: 'Environmental Chemistry - Acid Rain and Soil Cation Leaching',
    chapter: 'Macromolecules and Environmental Chemistry',
    explain: 'Acid rain (containing H2SO4 and HNO3) introduces high concentrations of H⁺ ions into soil. Protons displace essential cations (Ca²⁺, Mg²⁺) causing nutrient depletion, and exchange with insoluble aluminum silicates to mobilize soluble, highly toxic Al³⁺ ions into streams and lakes, causing mucus accumulation and asphyxiation in fish gills.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  }
];

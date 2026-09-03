import { Question } from '../types';

export const MDCAT_CHEMISTRY_BATCH3: Question[] = [
  // --- Fundamental Concepts of Chemistry (4 MCQs: 2 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-1',
    q: 'How many molecules are present in 36 grams of pure liquid water (H₂O)? (Molar mass = 18 g/mol, N_A = 6.02 × 10²³)',
    options: ['1.204 × 10²⁴ molecules', '6.02 × 10²³ molecules', '3.01 × 10²³ molecules', '2.408 × 10²⁴ molecules'],
    correct: 0,
    topic: 'Fundamental Concepts of Chemistry',
    explain: 'Moles of water n = 36 g / 18 g/mol = 2.0 moles. Number of molecules = 2.0 * N_A = 2 * (6.02 × 10²³) = 1.204 × 10²⁴ molecules.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-2',
    q: 'What is the percentage by mass of nitrogen in urea, (NH₂)₂CO? (Molar mass = 60 g/mol, N = 14)',
    options: ['46.7%', '28.0%', '35.0%', '50.0%'],
    correct: 0,
    topic: 'Fundamental Concepts of Chemistry',
    explain: 'Urea contains 2 nitrogen atoms: mass of N = 28 g. % N = (28 / 60) * 100% ≈ 46.67%.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-3',
    q: 'In the combustion reaction: C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O, what volume of CO₂ gas measured at STP is produced from the complete combustion of 4.4 g of propane (C₃H₈)? (Molar mass = 44 g/mol)',
    options: ['6.72 dm³', '2.24 dm³', '22.4 dm³', '4.48 dm³'],
    correct: 0,
    topic: 'Fundamental Concepts of Chemistry',
    explain: 'Moles of C₃H₈ = 4.4 / 44 = 0.1 mol. According to stoichiometry, 1 mol propane produces 3 mol CO₂. So 0.1 mol produces 0.3 mol CO₂. Volume at STP = 0.3 * 22.4 dm³ = 6.72 dm³.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-4',
    q: 'When 10 g of hydrogen gas reacts with 64 g of oxygen gas to synthesize liquid water (2 H₂ + O₂ → 2 H₂O), which reactant acts as the limiting reactant and what is the theoretical yield of water?',
    options: ['O₂ is limiting; yield is 72 g of H₂O', 'H₂ is limiting; yield is 90 g of H₂O', 'O₂ is limiting; yield is 64 g of H₂O', 'Neither is limiting; yield is 74 g of H₂O'],
    correct: 0,
    topic: 'Fundamental Concepts of Chemistry',
    explain: 'Moles of H₂ = 10 / 2 = 5.0 mol. Moles of O₂ = 64 / 32 = 2.0 mol. Reaction needs 2 mol H₂ per 1 mol O₂, so 2.0 mol O₂ requires 4.0 mol H₂. O₂ is consumed first (limiting reactant). Moles of H₂O formed = 2 * moles of O₂ = 4.0 mol = 4.0 * 18 = 72 g.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Atomic Structure (4 MCQs: 2 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-5',
    q: 'Which quantum number specifies the spatial orientation of an atomic orbital in three-dimensional space?',
    options: ['Magnetic quantum number (m)', 'Principal quantum number (n)', 'Azimuthal quantum number (l)', 'Spin quantum number (s)'],
    correct: 0,
    topic: 'Atomic Structure',
    explain: 'The magnetic quantum number (m) designates the spatial orientation of the orbital in space relative to a standard set of coordinate axes (takes values -l to +l).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-6',
    q: 'What is the maximum number of electrons that can be accommodated in the principal energy level n = 3?',
    options: ['18 electrons', '8 electrons', '32 electrons', '10 electrons'],
    correct: 0,
    topic: 'Atomic Structure',
    explain: 'The maximum electron capacity of an energy level with principal quantum number n is 2n². For n = 3: 2(3)² = 2(9) = 18 electrons (2 in 3s, 6 in 3p, 10 in 3d).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-7',
    q: 'Which electronic configuration violates Hund\'s rule of maximum multiplicity?',
    options: [
      'Carbon: 1s² 2s² 2px² 2py⁰ 2pz⁰',
      'Nitrogen: 1s² 2s² 2px¹ 2py¹ 2pz¹',
      'Boron: 1s² 2s² 2px¹',
      'Oxygen: 1s² 2s² 2px² 2py¹ 2pz¹'
    ],
    correct: 0,
    topic: 'Atomic Structure',
    explain: 'Hund\'s rule requires degenerate orbitals (like 2px, 2py, 2pz) to be singly occupied with parallel spins before any pairing occurs. Pairing two electrons in 2px while leaving 2py empty directly violates Hund\'s rule.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-8',
    q: 'What is the de Broglie wavelength of an electron traveling with a velocity of 2.18 × 10⁶ m/s (approximate Bohr first orbit velocity)? (m_e = 9.11 × 10⁻³¹ kg, h = 6.626 × 10⁻³⁴ J·s)',
    options: ['0.333 nm (3.33 Å)', '0.053 nm', '1.06 nm', '0.666 nm'],
    correct: 0,
    topic: 'Atomic Structure',
    explain: 'λ = h / (m * v) = (6.626 × 10⁻³⁴) / (9.11 × 10⁻³¹ * 2.18 × 10⁶) = (6.626 × 10⁻³⁴) / (1.986 × 10⁻²⁴) ≈ 3.33 × 10⁻¹⁰ m = 0.333 nm.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Gases (4 MCQs: 2 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-9',
    q: 'According to Graham\'s law of diffusion, the rate of effusion of a gas is inversely proportional to the square root of its:',
    options: ['Molar mass (or density)', 'Absolute temperature', 'Pressure', 'Volume'],
    correct: 0,
    topic: 'Gases',
    explain: 'Graham\'s law states that at constant temperature and pressure, r₁ / r₂ = √(M₂ / M₁), meaning rate of diffusion/effusion is inversely proportional to the square root of molar mass or density.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-10',
    q: 'At constant temperature, if the volume of an ideal gas sample is halved from 4.0 dm³ to 2.0 dm³, what happens to its pressure?',
    options: ['Pressure doubles', 'Pressure is halved', 'Pressure increases fourfold', 'Pressure remains unchanged'],
    correct: 0,
    topic: 'Gases',
    explain: 'By Boyle\'s law (P₁V₁ = P₂V₂), pressure and volume are inversely proportional at constant temperature. Halving volume doubles the pressure.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-11',
    q: 'A vessel contains 8 g of CH₄ (molar mass = 16 g/mol) and 32 g of SO₂ (molar mass = 64 g/mol) at a total pressure of 3.0 atm. What is the partial pressure exerted by methane (CH₄)?',
    options: ['1.5 atm', '2.0 atm', '1.0 atm', '0.75 atm'],
    correct: 0,
    topic: 'Gases',
    explain: 'Moles of CH₄ = 8 / 16 = 0.5 mol. Moles of SO₂ = 32 / 64 = 0.5 mol. Total moles = 1.0 mol. Mole fraction of CH₄ = 0.5 / 1.0 = 0.5. Partial pressure P_CH₄ = 0.5 * 3.0 atm = 1.5 atm.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-12',
    q: 'In the van der Waals real gas equation: [P + (n²a / V²)] (V - nb) = nRT, what physical molecular property does the constant \'a\' correct for?',
    options: ['Intermolecular attractive forces between gas molecules', 'Effective finite volume occupied by the gas molecules', 'Average kinetic energy of the gas particles', 'Collision frequency against the container walls'],
    correct: 0,
    topic: 'Gases',
    explain: 'The van der Waals parameter \'a\' accounts for mutual attractive intermolecular forces which reduce real pressure, while parameter \'b\' accounts for the finite incompressibility volume (excluded volume) of gas molecules.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Liquids and Solids (4 MCQs: 2 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-13',
    q: 'Which type of crystalline solid is held together entirely by electrostatic attractions between positive cations and negative anions in a rigid lattice?',
    options: ['Ionic crystals (e.g., NaCl)', 'Covalent network crystals (e.g., Diamond)', 'Molecular crystals (e.g., Ice)', 'Metallic crystals (e.g., Copper)'],
    correct: 0,
    topic: 'Liquids and Solids',
    explain: 'Ionic solids (such as NaCl, KCl) consist of alternating positive and negative ions held by non-directional, strong electrostatic ionic bonds.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-14',
    q: 'What is the crystal system where all three unit cell axes are mutually perpendicular (α = β = γ = 90°) but all three edge lengths are unequal (a ≠ b ≠ c)?',
    options: ['Orthorhombic', 'Tetragonal', 'Cubic', 'Monoclinic'],
    correct: 0,
    topic: 'Liquids and Solids',
    explain: 'The orthorhombic crystal system is defined by a ≠ b ≠ c and α = β = γ = 90° (examples: rhombic sulfur, BaSO₄).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-15',
    q: 'Why does liquid water display an anomalous maximum density at 4 °C (3.98 °C)?',
    options: [
      'Above 4 °C thermal expansion dominates, while below 4 °C open cage-like tetrahedral hydrogen-bonded networks expand the volume',
      'Water molecules dissociate into H⁺ and OH⁻ ions at 4 °C',
      'Surface tension reaches an absolute zero value at 4 °C',
      'The dielectric constant becomes infinite at 4 °C'
    ],
    correct: 0,
    topic: 'Liquids and Solids',
    explain: 'Cooling water below 4 °C promotes the formation of a rigid, open, hexagonal cage-like hydrogen-bonded framework that increases volume, decreasing density until it forms ice.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-16',
    q: 'In a face-centered cubic (FCC) unit cell of copper, what is the effective total number of atoms contained entirely within one single unit cell?',
    options: ['4 atoms', '2 atoms', '1 atom', '8 atoms'],
    correct: 0,
    topic: 'Liquids and Solids',
    explain: 'FCC has 8 corner atoms each shared by 8 unit cells (8 * 1/8 = 1 atom) and 6 face-centered atoms each shared by 2 unit cells (6 * 1/2 = 3 atoms). Total = 1 + 3 = 4 atoms.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Chemical Energetics (4 MCQs: 2 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-17',
    q: 'According to the first law of thermodynamics, what is the mathematical expression relating change in internal energy (ΔE), heat absorbed (q), and work done by the system (w)?',
    options: ['ΔE = q - w', 'ΔE = q + w', 'ΔE = w - q', 'ΔE = q · w'],
    correct: 0,
    topic: 'Chemical Energetics',
    explain: 'First law of thermodynamics states ΔE = q - w (when w is defined as work done by the system against external pressure: w = PΔV).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-18',
    q: 'Which thermodynamic state function is defined as H = E + PV?',
    options: ['Enthalpy', 'Entropy', 'Gibbs free energy', 'Helmholtz work function'],
    correct: 0,
    topic: 'Chemical Energetics',
    explain: 'Enthalpy (H) is defined mathematically as the sum of internal energy (E) and the product of pressure and volume (PV): H = E + PV.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-19',
    q: 'Given the standard enthalpies of formation: ΔH_f° [CO₂] = -393.5 kJ/mol, ΔH_f° [H₂O(l)] = -285.8 kJ/mol, and ΔH_f° [CH₄] = -74.8 kJ/mol. What is the standard enthalpy of combustion for methane (CH₄ + 2 O₂ → CO₂ + 2 H₂O)?',
    options: ['-890.3 kJ/mol', '-965.1 kJ/mol', '+890.3 kJ/mol', '-604.5 kJ/mol'],
    correct: 0,
    topic: 'Chemical Energetics',
    explain: 'ΔH_rxn = [ΔH_f°(CO₂) + 2*ΔH_f°(H₂O)] - [ΔH_f°(CH₄)] = [-393.5 + 2(-285.8)] - [-74.8] = [-393.5 - 571.6] + 74.8 = -965.1 + 74.8 = -890.3 kJ/mol.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-20',
    q: 'In the Born-Haber cycle for sodium chloride, given: Sublimation of Na = +108 kJ/mol, Ionization energy of Na = +496 kJ/mol, Dissociation of 1/2 Cl₂ = +122 kJ/mol, Electron affinity of Cl = -349 kJ/mol, and ΔH_f°(NaCl) = -411 kJ/mol. What is the lattice energy (U) of NaCl?',
    options: ['-788 kJ/mol', '+788 kJ/mol', '-650 kJ/mol', '-840 kJ/mol'],
    correct: 0,
    topic: 'Chemical Energetics',
    explain: 'ΔH_f° = ΔH_sub + IE + (1/2)D + EA + U => -411 = 108 + 496 + 122 - 349 + U => -411 = 377 + U => U = -411 - 377 = -788 kJ/mol.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Chemical Equilibrium (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-21',
    q: 'What effect does adding a catalyst have on the equilibrium position and equilibrium constant (Kc) of a reversible reaction?',
    options: [
      'It increases both forward and reverse rates equally, reaching equilibrium faster without altering the equilibrium position or Kc',
      'It increases Kc by lowering activation energy of the forward reaction only',
      'It shifts equilibrium towards the products, increasing percentage yield',
      'It decreases Kc by stabilizing reactant molecules'
    ],
    correct: 0,
    topic: 'Chemical Equilibrium',
    explain: 'A catalyst lowers the activation energy barrier equally for both forward and reverse pathways. Hence, it accelerates the attainment of equilibrium without shifting the position of equilibrium or altering Kc.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-22',
    q: 'For the exothermic synthesis of ammonia: N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g) (ΔH = -92 kJ/mol), which set of conditions maximizes the equilibrium yield of ammonia according to Le Chatelier\'s principle?',
    options: ['High pressure and low temperature', 'Low pressure and high temperature', 'High pressure and high temperature', 'Low pressure and low temperature'],
    correct: 0,
    topic: 'Chemical Equilibrium',
    explain: 'Reaction produces fewer moles of gas (4 mol reactants → 2 mol products), so high pressure shifts equilibrium right. Being exothermic (ΔH < 0), lower temperature shifts equilibrium towards products.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-23',
    q: 'For the reaction: 2 SO₂(g) + O₂(g) ⇌ 2 SO₃(g), what is the relationship between Kp and Kc?',
    options: ['Kp = Kc (RT)⁻¹', 'Kp = Kc (RT)¹', 'Kp = Kc (RT)²', 'Kp = Kc'],
    correct: 0,
    topic: 'Chemical Equilibrium',
    explain: 'The relation is Kp = Kc(RT)^Δn. Here, Δn = moles of gaseous products - moles of gaseous reactants = 2 - (2 + 1) = -1. Therefore, Kp = Kc (RT)⁻¹.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-24',
    q: 'What is the molar solubility \'s\' of sparingly soluble lead(II) chloride (PbCl₂) in pure water in terms of its solubility product constant Ksp?',
    options: ['s = ∛(Ksp / 4)', 's = √(Ksp / 2)', 's = ∛(Ksp / 27)', 's = √(Ksp)'],
    correct: 0,
    topic: 'Chemical Equilibrium',
    explain: 'PbCl₂(s) ⇌ Pb²⁺(aq) + 2 Cl⁻(aq). If solubility is s, [Pb²⁺] = s and [Cl⁻] = 2s. Ksp = [Pb²⁺][Cl⁻]² = (s)(2s)² = 4s³ => s = ∛(Ksp / 4).',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Chemical Kinetics (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-25',
    q: 'What are the units of the rate constant (k) for a first-order chemical reaction?',
    options: ['s⁻¹', 'mol·dm⁻³·s⁻¹', 'dm³·mol⁻¹·s⁻¹', 'dm⁶·mol⁻²·s⁻¹'],
    correct: 0,
    topic: 'Chemical Kinetics',
    explain: 'Rate = k [A]¹ => k = Rate / [A] = (mol·dm⁻³·s⁻¹) / (mol·dm⁻³) = s⁻¹ (or time⁻¹).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-26',
    q: 'The half-life of a radioactive decomposition following first-order kinetics is 20 minutes. What percentage of the initial reactant remains unreacted after 60 minutes?',
    options: ['12.5%', '25.0%', '6.25%', '50.0%'],
    correct: 0,
    topic: 'Chemical Kinetics',
    explain: 'Number of elapsed half-lives n = 60 / 20 = 3 half-lives. Fraction remaining = (1/2)³ = 1/8 = 12.5%.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-27',
    q: 'For the reaction A + 2 B → products, when [A] is doubled keeping [B] constant, the rate doubles. When [B] is tripled keeping [A] constant, the rate increases nine-fold. What is the overall order of reaction?',
    options: ['Third order', 'Second order', 'First order', 'Fourth order'],
    correct: 0,
    topic: 'Chemical Kinetics',
    explain: 'Rate ∝ [A]¹ (since doubling [A] doubles rate: 2¹ = 2). Rate ∝ [B]² (since tripling [B] multiplies rate by 9: 3² = 9). Overall order = 1 + 2 = 3.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-28',
    q: 'According to the Arrhenius equation (k = A e^(-Ea / RT)), a plot of ln k against 1/T yields a straight line with a slope equal to:',
    options: ['-Ea / R', '+Ea / R', '-Ea / (2.303 R)', 'ln A'],
    correct: 0,
    topic: 'Chemical Kinetics',
    explain: 'Taking natural logarithm: ln k = ln A - (Ea / R)(1/T). This matches y = c + mx, where slope m = -Ea / R.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Electrochemistry (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-29',
    q: 'In an electrochemical Galvanic (voltaic) cell, which electrode serves as the site of oxidation and what is its electrical polarity?',
    options: ['Anode; negative polarity', 'Cathode; positive polarity', 'Anode; positive polarity', 'Cathode; negative polarity'],
    correct: 0,
    topic: 'Electrochemistry',
    explain: 'Oxidation always occurs at the anode (An Ox). In a Galvanic cell, the spontaneous loss of electrons makes the anode the electron source, carrying negative electrical polarity.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-30',
    q: 'What is the oxidation number of chromium in the dichromate polyatomic anion (Cr₂O₇²⁻)?',
    options: ['+6', '+3', '+7', '+5'],
    correct: 0,
    topic: 'Electrochemistry',
    explain: '2(Cr) + 7(-2) = -2 => 2(Cr) - 14 = -2 => 2(Cr) = +12 => Cr = +6.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-31',
    q: 'Given standard reduction potentials: E°(Zn²⁺/Zn) = -0.76 V and E°(Cu²⁺/Cu) = +0.34 V. What is the standard cell electromotive force (E°_cell) for the standard Daniel cell (Zn + Cu²⁺ → Zn²⁺ + Cu)?',
    options: ['+1.10 V', '-1.10 V', '+0.42 V', '+0.88 V'],
    correct: 0,
    topic: 'Electrochemistry',
    explain: 'E°_cell = E°_cathode (reduction) - E°_anode (oxidation) = +0.34 V - (-0.76 V) = +0.34 + 0.76 = +1.10 V.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-32',
    q: 'How many Faradays of electrical charge are required to electroplate 54 g of aluminum metal from molten Al₂O₃? (Atomic mass of Al = 27 g/mol)',
    options: ['6 Faradays', '2 Faradays', '3 Faradays', '12 Faradays'],
    correct: 0,
    topic: 'Electrochemistry',
    explain: 'Moles of Al = 54 / 27 = 2.0 mol. Reduction reaction: Al³⁺ + 3 e⁻ → Al. Each mole of Al requires 3 moles of electrons (3 Faradays). For 2.0 moles: 2.0 * 3 = 6 Faradays.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Solutions and Colligative Properties (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-33',
    q: 'What is the molality (m) of a solution prepared by dissolving 10 g of sodium hydroxide (NaOH) in 500 g of pure water? (Molar mass of NaOH = 40 g/mol)',
    options: ['0.50 mol/kg', '0.25 mol/kg', '1.00 mol/kg', '0.20 mol/kg'],
    correct: 0,
    topic: 'Solutions and Colligative Properties',
    explain: 'Moles of solute = 10 / 40 = 0.25 mol. Mass of solvent in kg = 500 g / 1000 = 0.50 kg. Molality m = 0.25 / 0.50 = 0.50 mol/kg.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-34',
    q: 'Which of the following aqueous solutions will exhibit the lowest freezing point at standard atmospheric pressure?',
    options: ['0.10 m AlCl₃ (aqueous)', '0.10 m NaCl (aqueous)', '0.10 m CaCl₂ (aqueous)', '0.10 m Glucose (aqueous)'],
    correct: 0,
    topic: 'Solutions and Colligative Properties',
    explain: 'Freezing point depression ΔTf = i * Kf * m. AlCl₃ dissociates into 4 ions (1 Al³⁺ + 3 Cl⁻), giving van \'t Hoff factor i = 4. Effective particle concentration = 4 * 0.10 = 0.40 m, depressing freezing point the most.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-35',
    q: 'According to Raoult\'s law for an ideal solution containing a non-volatile non-electrolyte solute, the relative lowering of vapor pressure equals:',
    options: ['Mole fraction of solute (X_solute)', 'Mole fraction of solvent (X_solvent)', 'Molality of solution', 'Molar mass of solute'],
    correct: 0,
    topic: 'Solutions and Colligative Properties',
    explain: 'Raoult\'s law states: (P° - P) / P° = X_solute, where (P° - P) / P° is the relative lowering of vapor pressure, directly equal to the mole fraction of the non-volatile solute.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-36',
    q: 'What is the osmotic pressure (π) exerted by an aqueous solution containing 18 g of glucose (C₆H₁₂O₆, molar mass = 180 g/mol) in 1.0 dm³ of solution at 27 °C (300 K)? (R = 0.0821 dm³·atm/(mol·K))',
    options: ['2.46 atm', '4.92 atm', '0.246 atm', '1.23 atm'],
    correct: 0,
    topic: 'Solutions and Colligative Properties',
    explain: 'Molarity C = (18 / 180) / 1.0 = 0.10 mol/dm³. π = CRT = 0.10 * 0.0821 * 300 = 2.463 atm.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Acids, Bases and Salts (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-37',
    q: 'According to the Lewis acid-base definition, what is a Lewis base?',
    options: ['An electron-pair donor', 'An electron-pair acceptor', 'A proton (H⁺) donor', 'A hydroxide (OH⁻) generator'],
    correct: 0,
    topic: 'Acids, Bases and Salts',
    explain: 'A Lewis base is any chemical species possessing an unshared electron pair capable of donating it to form a coordinate covalent dative bond.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-38',
    q: 'What is the pH of a 0.001 M aqueous solution of strong hydrochloric acid (HCl)?',
    options: ['3.0', '11.0', '1.0', '4.0'],
    correct: 0,
    topic: 'Acids, Bases and Salts',
    explain: 'HCl completely dissociates: [H⁺] = 0.001 M = 10⁻³ M. pH = -log₁₀[H⁺] = -log₁₀(10⁻³) = 3.0.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-39',
    q: 'What is the pH of an acidic buffer solution composed of 0.10 M acetic acid (CH₃COOH) and 0.10 M sodium acetate (CH₃COONa), given pKa of acetic acid is 4.74?',
    options: ['4.74', '5.74', '3.74', '7.00'],
    correct: 0,
    topic: 'Acids, Bases and Salts',
    explain: 'Henderson-Hasselbalch equation: pH = pKa + log([Salt]/[Acid]). Since [Salt] = [Acid] = 0.10 M, log(0.10/0.10) = log(1) = 0. Therefore, pH = pKa = 4.74.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-40',
    q: 'What is the pH of a 0.05 M barium hydroxide [Ba(OH)₂] aqueous solution, assuming complete dissociation into ions at 25 °C?',
    options: ['13.0', '12.7', '1.0', '14.0'],
    correct: 0,
    topic: 'Acids, Bases and Salts',
    explain: 'Ba(OH)₂ produces 2 OH⁻ ions: [OH⁻] = 2 * 0.05 M = 0.10 M = 10⁻¹ M. pOH = -log₁₀(10⁻¹) = 1.0. At 25 °C, pH = 14 - pOH = 14 - 1.0 = 13.0.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Fundamental Principles of Organic Chemistry (4 MCQs: 1 Easy, 1 Medium, 2 Hard) ---
  {
    id: 'mdcat-b3-chem-41',
    q: 'What is the hybridization state of the central carbon atom in an allene molecule (H₂C=C=CH₂)?',
    options: ['sp hybridization', 'sp² hybridization', 'sp³ hybridization', 'dsp² hybridization'],
    correct: 0,
    topic: 'Fundamental Principles of Organic Chemistry',
    explain: 'The central carbon in allene forms two double bonds (two σ-bonds and two mutually perpendicular π-bonds) with no lone pairs, requiring sp hybridization with a linear 180° geometry.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-42',
    q: 'Which isomerism is exhibited by 1-propanol and 2-propanol?',
    options: ['Position isomerism', 'Chain isomerism', 'Functional group isomerism', 'Metamerism'],
    correct: 0,
    topic: 'Fundamental Principles of Organic Chemistry',
    explain: 'Both compounds have the same carbon skeleton and the same functional group (-OH), but differ in the position of the -OH group along the carbon chain (C-1 vs C-2), characteristic of position isomerism.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-43',
    q: 'Which of the following molecular structures can exhibit geometric (cis-trans or diastereomeric) isomerism?',
    options: ['2-butene (CH₃-CH=CH-CH₃)', '1-butene (CH₂=CH-CH₂-CH₃)', 'Propene (CH₂=CH-CH₃)', '2-methylpropene ((CH₃)₂C=CH₂)'],
    correct: 0,
    topic: 'Fundamental Principles of Organic Chemistry',
    explain: 'Geometric isomerism requires restricted rotation (C=C double bond) where each double-bonded carbon carries two different substituents. 2-butene satisfies this (H and CH₃ on each carbon). 1-butene has two identical H on C-1 and cannot.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-44',
    q: 'What is the primary factor accounting for the enhanced resonance stability of benzene compared to hypothetical 1,3,5-cyclohexatriene?',
    options: [
      'Delocalization of 6 π-electrons across a cyclic planar ring fulfilling Hückel\'s 4n+2 rule (resonance energy ~150.5 kJ/mol)',
      'Alternating localized single and double bonds of unequal lengths',
      'Presence of sp³ hybridized ring carbon atoms',
      'Rapid tautomerization between open-chain hexatriene isomers'
    ],
    correct: 0,
    topic: 'Fundamental Principles of Organic Chemistry',
    explain: 'Benzene possesses completely delocalized π-electron density spanning all 6 sp² ring carbons in a planar closed loop, providing 150.5 kJ/mol of aromatic resonance stabilization energy.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Hydrocarbons (4 MCQs: 1 Easy, 1 Medium, 2 Hard) ---
  {
    id: 'mdcat-b3-chem-45',
    q: 'What is the major organic product formed when 2-butene is subjected to ozonolysis followed by reductive workup with Zn / H₂O?',
    options: ['Acetaldehyde (ethanal, CH₃CHO)', 'Formaldehyde (methanal, HCHO)', 'Acetone (propanone)', 'Acetic acid (ethanoic acid)'],
    correct: 0,
    topic: 'Hydrocarbons',
    explain: 'Ozonolysis of symmetrical 2-butene (CH₃-CH=CH-CH₃) cleaves the central double bond cleanly to produce two moles of acetaldehyde (ethanal, CH₃CHO).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-46',
    q: 'In the free-radical chlorination of methane under ultraviolet light, which elementary step represents a chain termination step?',
    options: [
      '•CH₃ + •Cl → CH₃Cl',
      'Cl₂ + hν → 2 •Cl',
      '•Cl + CH₄ → HCl + •CH₃',
      '•CH₃ + Cl₂ → CH₃Cl + •Cl'
    ],
    correct: 0,
    topic: 'Hydrocarbons',
    explain: 'A termination step consumes two reactive free radicals to form a stable non-radical molecule, extinguishing free radical propagation: •CH₃ + •Cl → CH₃Cl.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-47',
    q: 'When ethyne (acetylene, HC≡CH) is hydrated by passing through dilute H₂SO₄ in the presence of 1% HgSO₄ catalyst at 75 °C, what is the final isolated carbonyl product?',
    options: ['Ethanal (acetaldehyde)', 'Ethanol', 'Propanone (acetone)', 'Ethanoic acid'],
    correct: 0,
    topic: 'Hydrocarbons',
    explain: 'Hydration initially forms unstable vinyl alcohol (H₂C=CH-OH) via Markovnikov addition, which spontaneously tautomerizes (keto-enol shift) to stable ethanal (acetaldehyde, CH₃CHO).',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-48',
    q: 'Why is the nitro group (-NO₂) in nitrobenzene a meta-directing and strongly deactivating substituent towards electrophilic aromatic substitution?',
    options: [
      'Its electron-withdrawing inductive (-I) and resonance (-M) effects withdraw electron density preferentially from ortho and para positions',
      'It donates lone pair electron density into the ring via positive resonance (+M)',
      'It hyperconjugates with aromatic ring π-orbitals',
      'It forms steric hindrance that physically blocks electrophiles at the meta position'
    ],
    correct: 0,
    topic: 'Hydrocarbons',
    explain: 'The positively polarized nitrogen withdraws π-density through resonance, placing formal positive charges at ortho and para carbons in arenium ion intermediates, leaving meta position relatively least destabilized.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Alkyl Halides (4 MCQs: 1 Easy, 1 Medium, 2 Hard) ---
  {
    id: 'mdcat-b3-chem-49',
    q: 'Which mechanism is characterized by a single-step concerted pathway featuring backside nucleophilic attack with complete inversion of configuration (Walden inversion)?',
    options: ['SN2 mechanism', 'SN1 mechanism', 'E1 mechanism', 'E1cB mechanism'],
    correct: 0,
    topic: 'Alkyl Halides',
    explain: 'The SN2 (bimolecular nucleophilic substitution) mechanism proceeds concertedly through a trigonal bipyramidal transition state with backside nucleophilic attack, producing complete stereochemical inversion.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-50',
    q: 'What is the order of reactivity of primary, secondary, and tertiary alkyl halides towards the unimolecular SN1 mechanism?',
    options: ['Tertiary > Secondary > Primary', 'Primary > Secondary > Tertiary', 'Secondary > Primary > Tertiary', 'Primary > Tertiary > Secondary'],
    correct: 0,
    topic: 'Alkyl Halides',
    explain: 'SN1 rate is determined by the stability of the carbocation intermediate formed in the rate-determining step. 3° carbocations are most stable due to hyperconjugation and +I effects: 3° > 2° > 1°.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-51',
    q: 'What is the major alkene product when 2-bromo-2-methylbutane is treated with sodium ethoxide in ethanol under reflux?',
    options: ['2-methyl-2-butene (Saytzeff product)', '2-methyl-1-butene (Hofmann product)', '2-methylbutane', '2-ethoxy-2-methylbutane'],
    correct: 0,
    topic: 'Alkyl Halides',
    explain: 'According to Saytzeff\'s rule, E2 elimination of a small unhindered strong base (ethoxide) yields the more thermodynamically stable, more highly substituted alkene: 2-methyl-2-butene (trisubstituted).',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-52',
    q: 'What is the product when methylmagnesium bromide (Grignard reagent, CH₃MgBr) reacts with dry carbon dioxide (CO₂) followed by acidic hydrolysis (H₃O⁺)?',
    options: ['Ethanoic acid (acetic acid, CH₃COOH)', 'Methanoic acid (formic acid)', 'Ethanol', 'Propanone'],
    correct: 0,
    topic: 'Alkyl Halides',
    explain: 'Nucleophilic carbanion CH₃⁻ attacks electrophilic carbonyl carbon of CO₂ to form halomagnesium carboxylate CH₃COOMgBr. Acid hydrolysis yields ethanoic acid (acetic acid): CH₃COOH.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Alcohols and Phenols (4 MCQs: 1 Easy, 1 Medium, 2 Hard) ---
  {
    id: 'mdcat-b3-chem-53',
    q: 'Lucas reagent is used to differentiate primary, secondary, and tertiary alcohols. What is the chemical composition of Lucas reagent?',
    options: [
      'Equimolar mixture of anhydrous ZnCl₂ and concentrated HCl',
      'Concentrated H₂SO₄ and KMnO₄',
      'Ammoniacal silver nitrate solution',
      'Alkaline copper tartrate solution'
    ],
    correct: 0,
    topic: 'Alcohols and Phenols',
    explain: 'Lucas reagent consists of anhydrous zinc chloride (ZnCl₂) dissolved in concentrated hydrochloric acid (HCl), generating insoluble alkyl chloride turbidity via SN1.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-54',
    q: 'What is the characteristic color produced when neutral ferric chloride (FeCl₃) solution is added to an aqueous solution of phenol?',
    options: [
      'Violet (or purple) coloration due to the formation of a ferric phenoxide coordination complex',
      'Bright scarlet precipitate of elemental iron',
      'Dark brown effervescence of chlorine gas',
      'Canary yellow precipitate of triphenyl iron'
    ],
    correct: 0,
    topic: 'Alcohols and Phenols',
    explain: 'Phenols react with neutral FeCl₃ solution to give an intensely colored violet/purple soluble coordination complex, [Fe(OC₆H₅)₆]³⁻, a classic qualitative test to distinguish phenols from aliphatic alcohols.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-55',
    q: 'What visible observation occurs when aqueous bromine water (Br₂ / H₂O) is added to a solution of phenol at room temperature?',
    options: [
      'A white precipitate of 2,4,6-tribromophenol is formed with decolorization of bromine',
      'A yellow precipitate of 2-bromophenol forms',
      'Bromine retains its red-brown color with no reaction',
      'Gas bubbles of hydrogen bromide evolve vigorously without precipitation'
    ],
    correct: 0,
    topic: 'Alcohols and Phenols',
    explain: 'Phenol activates the benzene ring strongly. In polar water solvent, phenoxide forms and undergoes rapid electrophilic substitution at all ortho and para positions, precipitating white 2,4,6-tribromophenol.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-56',
    q: 'In the industrial Dow process, chlorobenzene is converted into phenol by heating with 10% aqueous NaOH at 350 °C under 200 atm pressure. This nucleophilic substitution proceeds via which high-energy intermediate?',
    options: ['Benzyne intermediate (elimination-addition mechanism)', 'Arenium carbocation (Wheland intermediate)', 'Meisenheimer complex', 'Free phenyl radical'],
    correct: 0,
    topic: 'Alcohols and Phenols',
    explain: 'Under extreme alkaline conditions, elimination of HCl from chlorobenzene yields the strained, highly reactive triple-bond benzyne intermediate, which is subsequently attacked by hydroxide/water.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Aldehydes and Ketones (4 MCQs: 1 Easy, 1 Medium, 2 Hard) ---
  {
    id: 'mdcat-b3-chem-57',
    q: 'Which qualitative test reagent produces a brilliant silver mirror on the inner wall of a clean test tube upon reaction with an aldehyde?',
    options: ['Tollens\' reagent (ammoniacal silver nitrate)', 'Fehling\'s solution', 'Benedict\'s solution', 'Lucas reagent'],
    correct: 0,
    topic: 'Aldehydes and Ketones',
    explain: 'Tollens\' reagent ([Ag(NH₃)₂]⁺) oxidizes aldehydes to carboxylate ions while being reduced to metallic elemental silver, depositing a diagnostic silver mirror.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-58',
    q: 'Which of the following compounds gives a positive iodoform test (yellow precipitate of CHI₃ with iodine and NaOH)?',
    options: ['Ethanol (CH₃CH₂OH)', 'Methanol (CH₃OH)', '1-propanol (CH₃CH₂CH₂OH)', '3-pentanone (CH₃CH₂COCH₂CH₃)'],
    correct: 0,
    topic: 'Aldehydes and Ketones',
    explain: 'The iodoform test is specific for compounds containing a methyl carbonyl group (CH₃-C=O) or a methyl carbinol group (CH₃-CH(OH)-) capable of being oxidized to it. Ethanol oxidizes to ethanal and gives positive iodoform.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-59',
    q: 'Why does benzaldehyde (C₆H₅CHO) undergo the Cannizzaro reaction rather than aldol condensation when treated with 50% concentrated NaOH?',
    options: [
      'It lacks an α-hydrogen atom adjacent to the carbonyl carbon',
      'It possesses an aromatic ring that repels hydroxide ions',
      'Its carbonyl carbon is not electrophilic',
      'It is insoluble in aqueous solutions'
    ],
    correct: 0,
    topic: 'Aldehydes and Ketones',
    explain: 'Aldol condensation requires abstraction of an α-hydrogen to generate an enolate nucleophile. Benzaldehyde has no α-hydrogens and instead undergoes disproportionation (Cannizzaro reaction).',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-60',
    q: 'In the base-catalyzed aldol addition of ethanal (acetaldehyde), what is the first mechanistic step?',
    options: [
      'Hydroxide ion abstracts an α-proton to form a resonance-stabilized enolate carbanion',
      'Hydroxide ion attacks the carbonyl carbon directly forming a tetrahedral intermediate',
      'Protonation of carbonyl oxygen by water',
      'Elimination of water forming an α,β-unsaturated aldehyde'
    ],
    correct: 0,
    topic: 'Aldehydes and Ketones',
    explain: 'The base (OH⁻) removes an acidic α-proton from ethanal to form a nucleophilic enolate carbanion (CH₂⁻-CHO ↔ CH₂=CH-O⁻), which then attacks another neutral ethanal molecule.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Carboxylic Acids (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-61',
    q: 'What is the characteristic functional group of carboxylic acids?',
    options: ['-COOH (carboxyl group)', '-CHO (formyl group)', '-OH (hydroxyl group)', '-CO- (carbonyl group)'],
    correct: 0,
    topic: 'Carboxylic Acids',
    explain: 'Carboxylic acids contain the carboxyl group (-COOH), consisting of a carbonyl group (C=O) directly bonded to a hydroxyl group (-OH).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-62',
    q: 'What is the correct order of decreasing acid strength for chloro-substituted ethanoic acids?',
    options: [
      'Trichloroethanoic acid > Dichloroethanoic acid > Monochloroethanoic acid > Ethanoic acid',
      'Ethanoic acid > Monochloroethanoic acid > Dichloroethanoic acid > Trichloroethanoic acid',
      'Monochloroethanoic acid > Dichloroethanoic acid > Trichloroethanoic acid > Ethanoic acid',
      'Dichloroethanoic acid > Trichloroethanoic acid > Monochloroethanoic acid > Ethanoic acid'
    ],
    correct: 0,
    topic: 'Carboxylic Acids',
    explain: 'Electronegative chlorine atoms exert an electron-withdrawing inductive effect (-I), stabilizing the conjugate carboxylate anion through charge dispersal. More chlorines = stronger acid.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-63',
    q: 'When ethanoic acid is heated with ethanol in the presence of concentrated sulfuric acid (Fischer esterification), what is the IUPAC name of the pleasant-smelling ester formed?',
    options: ['Ethyl ethanoate', 'Methyl propanoate', 'Ethyl methanoate', 'Propyl ethanoate'],
    correct: 0,
    topic: 'Carboxylic Acids',
    explain: 'Ethanoic acid (CH₃COOH) reacts with ethanol (CH₃CH₂OH) in an acid-catalyzed equilibrium to form ethyl ethanoate (ethyl acetate, CH₃COOCH₂CH₃) and water.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Amino Acids and Proteins (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-64',
    q: 'Which of the following is the only standard proteinogenic amino acid that is achiral and does not exhibit optical activity?',
    options: ['Glycine', 'Alanine', 'Valine', 'Leucine'],
    correct: 0,
    topic: 'Amino Acids and Proteins',
    explain: 'Glycine has a hydrogen atom as its side chain (R = H). The α-carbon is bonded to two identical hydrogen atoms, making it achiral (optically inactive).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-65',
    q: 'In aqueous solution at physiological pH (~7.4), an amino acid exists predominantly as an internally neutralized dipolar ion called a:',
    options: ['Zwitterion', 'Carbocation', 'Carbanion', 'Radical ion'],
    correct: 0,
    topic: 'Amino Acids and Proteins',
    explain: 'The amino group accepts a proton (-NH₃⁺) while the carboxyl group donates a proton (-COO⁻), creating an overall electrically neutral dipolar molecule known as a zwitterion.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-66',
    q: 'What type of chemical bonding is responsible for maintaining the secondary structure (such as α-helices and β-pleated sheets) of proteins?',
    options: [
      'Hydrogen bonding between backbone carbonyl oxygen (C=O) and amide hydrogen (N-H) groups',
      'Covalent peptide bonds between adjacent amino acids',
      'Disulfide cross-links between distant cysteine residues',
      'Hydrophobic interactions between non-polar side chains only'
    ],
    correct: 0,
    topic: 'Amino Acids and Proteins',
    explain: 'Secondary structure is maintained by regular, repetitive hydrogen bonds formed between peptide bond amide N-H and carbonyl C=O groups along the polypeptide backbone.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Macromolecules and Environmental Chemistry (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-67',
    q: 'Nylon-6,6 is synthesized by condensation polymerization of adipic acid with which diamine monomer?',
    options: ['Hexamethylenediamine (1,6-diaminohexane)', 'Ethylenediamine', '1,4-diaminobenzene', 'Tetramethylenediamine'],
    correct: 0,
    topic: 'Macromolecules and Environmental Chemistry',
    explain: 'Nylon-6,6 is synthesized by polycondensation of adipic acid (a 6-carbon dicarboxylic acid) and hexamethylenediamine (a 6-carbon diamine) with elimination of water molecules.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-68',
    q: 'Which toxic gaseous atmospheric pollutant has an affinity for human hemoglobin approximately 200–250 times greater than oxygen, causing tissue hypoxia?',
    options: ['Carbon monoxide (CO)', 'Sulfur dioxide (SO₂)', 'Nitrogen dioxide (NO₂)', 'Carbon dioxide (CO₂)'],
    correct: 0,
    topic: 'Macromolecules and Environmental Chemistry',
    explain: 'Carbon monoxide binds reversibly to the iron(II) heme centers of hemoglobin to form carboxyhemoglobin with an affinity ~250 times greater than O₂, blocking oxygen delivery.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-69',
    q: 'In the catalytic destruction of stratospheric ozone by chlorofluorocarbons (CFCs), which free radical acts as the primary homogeneous chain-propagating catalyst?',
    options: ['Atomic chlorine radical (•Cl)', 'Fluorine radical (•F)', 'Hydroxyl radical (•OH)', 'Methyl radical (•CH₃)'],
    correct: 0,
    topic: 'Macromolecules and Environmental Chemistry',
    explain: 'UV photolysis of CFCs releases chlorine free radicals: •Cl + O₃ → •ClO + O₂; •ClO + O → •Cl + O₂. A single •Cl radical destroys up to 100,000 ozone molecules before termination.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- Transition Elements (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-70',
    q: 'Why do many aqueous transition metal complex ions exhibit vibrant colors in solution?',
    options: [
      'Absorption of visible light wavelengths during d-d electronic transitions in split d-orbitals',
      'Total reflection of all wavelengths of visible light',
      'Electronic transitions between s and p orbitals',
      'Emission of photons from nuclear radioactive decay'
    ],
    correct: 0,
    topic: 'Transition Elements',
    explain: 'In transition metal complexes, ligands split degenerate d-orbitals into eg and t2g sets. Absorption of visible light promotes d-electrons between these energy levels (d-d transition), transmitting the complementary color.',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-71',
    q: 'What is the coordination number and oxidation state of cobalt in the complex ion [Co(NH₃)₄Cl₂]⁺?',
    options: ['Coordination number = 6; oxidation state = +3', 'Coordination number = 4; oxidation state = +2', 'Coordination number = 6; oxidation state = +2', 'Coordination number = 4; oxidation state = +3'],
    correct: 0,
    topic: 'Transition Elements',
    explain: 'Cobalt is bonded to 4 neutral NH₃ ligands and 2 anionic Cl⁻ ligands, giving coordination number = 4 + 2 = 6. Charge: Co + 4(0) + 2(-1) = +1 => Co = +3.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-72',
    q: 'According to crystal field theory, what is the electronic configuration of the d⁵ ion Fe³⁺ in an octahedral complex with a strong field ligand like cyanide [Fe(CN)₆]³⁻?',
    options: ['t2g⁵ eg⁰ (low spin)', 't2g³ eg² (high spin)', 't2g⁴ eg¹', 't2g² eg³'],
    correct: 0,
    topic: 'Transition Elements',
    explain: 'Cyanide (CN⁻) is a strong field ligand producing large crystal field splitting (Δo > pairing energy P). Electrons pair up in lower t2g orbitals before entering eg, yielding t2g⁵ eg⁰ (low-spin complex with 1 unpaired electron).',
    difficulty: 'Hard',
    subject: 'Chemistry'
  },

  // --- s-Block and p-Block Elements (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b3-chem-73',
    q: 'Which alkaline earth metal sulfate exhibits the lowest solubility in water due to its high lattice energy exceeding its hydration enthalpy?',
    options: ['Barium sulfate (BaSO₄)', 'Magnesium sulfate (MgSO₄)', 'Calcium sulfate (CaSO₄)', 'Beryllium sulfate (BeSO₄)'],
    correct: 0,
    topic: 's-Block and p-Block Elements',
    explain: 'Down Group II, hydration energy decreases much more rapidly than lattice energy due to the large size of the sulfate anion. Hence, BaSO₄ is practically insoluble in water (Ksp ≈ 1.1 × 10⁻¹⁰).',
    difficulty: 'Easy',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-74',
    q: 'What is the chemical formula of plaster of Paris obtained by partially dehydrating gypsum at 100 °C?',
    options: ['CaSO₄·1/2 H₂O', 'CaSO₄·2 H₂O', 'CaSO₄', 'CaSO₄·5 H₂O'],
    correct: 0,
    topic: 's-Block and p-Block Elements',
    explain: 'Heating gypsum (CaSO₄·2H₂O) to 100–120 °C yields calcium sulfate hemihydrate (CaSO₄·0.5H₂O or (CaSO₄)₂·H₂O), known as plaster of Paris.',
    difficulty: 'Medium',
    subject: 'Chemistry'
  },
  {
    id: 'mdcat-b3-chem-75',
    q: 'Why is boric acid (H₃BO₃) classified as a monobasic Lewis acid rather than an Arrhenius or Brønsted-Lowry proton donor in aqueous solution?',
    options: [
      'It accepts a lone pair of electrons from a water molecule\'s OH⁻ ion, releasing an indirect hydronium ion: B(OH)₃ + 2 H₂O ⇌ [B(OH)₄]⁻ + H₃O⁺',
      'It donates three protons simultaneously in a single dissociation step',
      'It forms a strong covalent bond with sodium ions',
      'It decomposes into boron oxide and gaseous hydrogen'
    ],
    correct: 0,
    topic: 's-Block and p-Block Elements',
    explain: 'Boron in B(OH)₃ has an electron-deficient sextet. Instead of releasing its own protons, it acts as a Lewis acid by accepting OH⁻ from H₂O to form [B(OH)₄]⁻, releasing H⁺ into solution.',
    difficulty: 'Hard',
    subject: 'Chemistry'
  }
];

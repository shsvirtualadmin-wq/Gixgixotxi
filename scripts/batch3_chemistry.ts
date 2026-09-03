import { Question } from '../src/types';

// Batch 3 Chemistry: 100 brand new MCQs (33 Easy, 35 Medium, 32 Hard)
// Balancing all 14 official syllabus chapters
export const BATCH3_CHEMISTRY: Question[] = [
  // =========================================================
  // Chapter: Experimental Techniques (+8: 3 Easy, 3 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-et-15',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Easy',
    q: 'In thin layer chromatography (TLC), what serves as the stationary phase on a standard silica gel plate?',
    options: ['Silica gel adsorbent layer', 'Volatile organic solvent', 'Developing chamber atmosphere', 'Filter paper wick'],
    correct: 0,
    explain: 'In TLC, finely divided silica gel coated on glass or aluminum acts as the solid stationary phase.'
  },
  {
    id: 'tcat-chem-et-16',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Easy',
    q: 'Which piece of laboratory apparatus is most suitable for performing liquid-liquid solvent extraction?',
    options: ['Separating funnel', 'Büchner funnel', 'Liebig condenser', 'Thiele tube'],
    correct: 0,
    explain: 'A separating funnel is specifically designed to separate immiscible liquids of differing densities during solvent extraction.'
  },
  {
    id: 'tcat-chem-et-17',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Easy',
    q: 'Why is fluted filter paper preferred over standard quadrant-folded filter paper during gravity filtration?',
    options: ['It increases the effective surface filtration area and rate', 'It prevents crystallization', 'It neutralizes acidic filtrates', 'It acts as an oxidizing agent'],
    correct: 0,
    explain: 'Fluting creates multiple vertical folds, significantly increasing the filtration surface area and speeding up gravity filtration.'
  },
  {
    id: 'tcat-chem-et-18',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Medium',
    q: 'In partition chromatography, the retardation factor R_f value of a solute component is defined as:',
    options: [
      'Distance traveled by solute / Distance traveled by solvent front',
      'Distance traveled by solvent front / Distance traveled by solute',
      'Mass of solute / Volume of solvent',
      'Concentration in mobile phase x Concentration in stationary phase'
    ],
    correct: 0,
    explain: 'R_f is the ratio: (distance moved by solute from baseline) / (distance moved by solvent front from baseline).'
  },
  {
    id: 'tcat-chem-et-19',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Medium',
    q: 'Which drying agent is commonly employed in a desiccator to maintain anhydrous conditions for crystalline samples?',
    options: ['Anhydrous calcium chloride (CaCl2)', 'Solid sodium chloride (NaCl)', 'Calcium carbonate (CaCO3)', 'Ammonium nitrate (NH4NO3)'],
    correct: 0,
    explain: 'Anhydrous CaCl2, silica gel, or phosphorus pentoxide are standard desiccants that vigorously absorb ambient water vapor.'
  },
  {
    id: 'tcat-chem-et-20',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Medium',
    q: 'Solvent extraction is governed by the Distribution Law (Partition Law), which states that at equilibrium, the solute distributes between two immiscible solvents in a constant ratio of:',
    options: ['Concentrations, independent of total amount of solute added', 'Volumes of the respective solvents', 'Boiling points of the solvents', 'Molar masses of the solvents'],
    correct: 0,
    explain: 'Nernst distribution law states that K_d = C1 / C2 at a given temperature, regardless of the total quantity of solute present.'
  },
  {
    id: 'tcat-chem-et-21',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Hard',
    q: 'In solvent extraction, which operational method yields greater extraction efficiency for a given total volume of extracting solvent?',
    options: [
      'Performing multiple extractions with successive small portions of solvent',
      'Performing a single extraction with the entire volume of solvent',
      'Boiling the mixture under reflux for 2 hours',
      'Freezing the mixture before filtration'
    ],
    correct: 0,
    explain: 'Mathematically, repeating extractions with smaller volume fractions removes a higher fraction of solute than a single large extraction.'
  },
  {
    id: 'tcat-chem-et-22',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Hard',
    q: 'During vacuum filtration using a Büchner funnel, what safety device is placed between the suction flask and the vacuum pump to prevent water backflow?',
    options: ['Safety trap flask', 'Condenser column', 'Fractionating head', 'Reflux bubbler'],
    correct: 0,
    explain: 'A safety suction trap prevents accidental suck-back of water from a water aspirator into the reaction filtrate.'
  },

  // =========================================================
  // Chapter: Atomic Structure (+8: 3 Easy, 3 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-as-15',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Easy',
    q: 'What is the maximum number of electrons that can occupy an f-subshell (l = 3)?',
    options: ['14', '10', '6', '2'],
    correct: 0,
    explain: 'An f-subshell has 2l + 1 = 7 orbitals. Each orbital holds a maximum of 2 electrons, so 7 * 2 = 14 electrons.'
  },
  {
    id: 'tcat-chem-as-16',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Easy',
    q: 'Which quantum number specifies the spatial orientation of an atomic orbital in a magnetic field?',
    options: ['Magnetic quantum number (m_l)', 'Principal quantum number (n)', 'Azimuthal quantum number (l)', 'Spin quantum number (m_s)'],
    correct: 0,
    explain: 'The magnetic quantum number m_l determines the spatial orientation of orbitals within a given subshell.'
  },
  {
    id: 'tcat-chem-as-17',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Easy',
    q: 'Cathode rays emitted in a discharge tube were shown by J.J. Thomson to consist of streams of:',
    options: ['Fast-moving electrons', 'Positively charged protons', 'Neutral neutrons', 'High-energy gamma photons'],
    correct: 0,
    explain: 'Cathode rays are streams of negatively charged fundamental particles termed electrons.'
  },
  {
    id: 'tcat-chem-as-18',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Medium',
    q: 'According to Hund’s Rule of Maximum Multiplicity, when degenerate orbitals are available, electrons prefer to:',
    options: [
      'Occupy separate orbitals singly with parallel spins before pairing',
      'Pair up immediately in the first orbital',
      'Fill in order of increasing spin quantum number',
      'Remain in the lower principal quantum shell'
    ],
    correct: 0,
    explain: 'Hund’s rule states that for degenerate orbitals, electron pairing does not occur until each orbital contains one electron with parallel spin.'
  },
  {
    id: 'tcat-chem-as-19',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Medium',
    q: 'What is the ground state electronic configuration of the chromium atom (Cr, Z = 24)?',
    options: ['[Ar] 3d⁵ 4s¹', '[Ar] 3d⁴ 4s²', '[Ar] 3d⁶ 4s⁰', '[Ar] 3d³ 4s² 4p¹'],
    correct: 0,
    explain: 'Due to the extra stability of a half-filled d-subshell (3d⁵), an electron shifts from 4s to 3d, giving [Ar] 3d⁵ 4s¹.'
  },
  {
    id: 'tcat-chem-as-20',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Medium',
    q: 'According to the (n + l) rule of orbital filling (Aufbau principle), which orbital is filled first between 4s and 3d?',
    options: ['4s, because its (n + l) sum is 4 (4 + 0), while 3d has (n + l) = 5 (3 + 2)', '3d, because it belongs to principal quantum shell n = 3', 'Both are filled simultaneously', '4s, because it has higher angular momentum'],
    correct: 0,
    explain: 'For 4s: n + l = 4 + 0 = 4. For 3d: n + l = 3 + 2 = 5. Lower (n + l) fills first, so 4s is filled before 3d.'
  },
  {
    id: 'tcat-chem-as-21',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Hard',
    q: 'What is the total number of radial nodes in a 3p atomic orbital?',
    options: ['1', '0', '2', '3'],
    correct: 0,
    explain: 'Number of radial nodes is given by (n - l - 1). For a 3p orbital, n = 3 and l = 1, giving 3 - 1 - 1 = 1 radial node.'
  },
  {
    id: 'tcat-chem-as-22',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Hard',
    q: 'What is the wave number of the limiting line (n2 = ∞) of the Lyman series for hydrogen atom (Rydberg constant = R_H)?',
    options: ['R_H', 'R_H / 4', 'R_H / 9', '4 R_H'],
    correct: 0,
    explain: 'For Lyman series: 1/λ = R_H (1/1² - 1/n2²). For the series limit (n2 = ∞), 1/λ = R_H (1 - 0) = R_H.'
  },

  // =========================================================
  // Chapter: Thermochemistry (+8: 2 Easy, 3 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-chem-tc-15',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Easy',
    q: 'A chemical reaction that absorbs thermal energy from its surroundings (ΔH > 0) is called:',
    options: ['Endothermic reaction', 'Exothermic reaction', 'Spontaneous combustion', 'Adiabatic condensation'],
    correct: 0,
    explain: 'Endothermic processes absorb heat from the surroundings, having a positive change in enthalpy (ΔH > 0).'
  },
  {
    id: 'tcat-chem-tc-16',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Easy',
    q: 'Under standard conditions (298 K, 1 atm), what is the enthalpy of formation (ΔH°_f) of pure elemental substances in their standard states?',
    options: ['Zero', '100 kJ/mol', 'Negative', 'Infinite'],
    correct: 0,
    explain: 'By international convention, the standard enthalpy of formation of an element in its most stable allotropic state is defined as zero.'
  },
  {
    id: 'tcat-chem-tc-17',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Medium',
    q: 'According to Hess’s Law of Constant Heat Summation, the enthalpy change of a reaction:',
    options: [
      'Depends only on the initial and final states, independent of the path taken',
      'Depends directly on the number of intermediate reaction steps',
      'Is zero for all reversible cycles',
      'Increases when a catalyst is added'
    ],
    correct: 0,
    explain: 'Hess’s Law reflects that enthalpy is a state function: overall ΔH depends exclusively on initial reactants and final products.'
  },
  {
    id: 'tcat-chem-tc-18',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Medium',
    q: 'In a bomb calorimeter experiment, heat of combustion is measured at strictly constant:',
    options: ['Volume (ΔV = 0, q_v = ΔU)', 'Pressure (ΔP = 0, q_p = ΔH)', 'Temperature and pressure', 'Entropy'],
    correct: 0,
    explain: 'A bomb calorimeter has a rigid steel vessel of constant volume; thus work W = P ΔV = 0 and heat evolved equals internal energy change ΔU.'
  },
  {
    id: 'tcat-chem-tc-19',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Medium',
    q: 'The standard enthalpy of neutralization of a strong acid with a strong base in dilute aqueous solution is approximately:',
    options: ['-57.3 kJ/mol', '-13.7 kJ/mol', '+57.3 kJ/mol', '-114.6 kJ/mol'],
    correct: 0,
    explain: 'Neutralization of strong acids by strong bases always represents H⁺(aq) + OH⁻(aq) -> H2O(l), which releases -57.34 kJ/mol.'
  },
  {
    id: 'tcat-chem-tc-20',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Hard',
    q: 'What is the lattice energy of an ionic crystal lattice defined as?',
    options: [
      'Energy released when one mole of ionic solid is formed from its isolated gaseous ions',
      'Energy required to melt one mole of ionic solid into liquid',
      'Energy required to vaporize one mole of solid metal',
      'Ionization energy of the cation plus electron affinity of the anion'
    ],
    correct: 0,
    explain: 'Lattice energy is the enthalpy change when one mole of crystalline ionic compound is synthesized from its constituent gaseous ions at infinite separation.'
  },
  {
    id: 'tcat-chem-tc-21',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Hard',
    q: 'Given bond energies: H-H = 436 kJ/mol, Cl-Cl = 242 kJ/mol, and H-Cl = 431 kJ/mol. Calculate ΔH for: H2 + Cl2 -> 2HCl.',
    options: ['-184 kJ/mol', '+184 kJ/mol', '-92 kJ/mol', '+92 kJ/mol'],
    correct: 0,
    explain: 'ΔH = Bonds broken - Bonds formed = (436 + 242) - 2(431) = 678 - 862 = -184 kJ/mol.'
  },
  {
    id: 'tcat-chem-tc-22',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Hard',
    q: 'According to the Born-Haber cycle for NaCl, which term represents an exothermic process?',
    options: ['Electron affinity of chlorine (EA of Cl)', 'Ionization energy of sodium', 'Sublimation enthalpy of solid sodium', 'Bond dissociation energy of Cl2'],
    correct: 0,
    explain: 'First electron affinity of chlorine (Cl(g) + e⁻ -> Cl⁻(g)) releases energy and is exothermic, whereas sublimation, dissociation, and ionization are endothermic.'
  },

  // =========================================================
  // Chapter: Chemical Equilibrium (+8: 3 Easy, 3 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-ce-15',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Easy',
    q: 'At chemical dynamic equilibrium, which of the following statements is strictly true?',
    options: [
      'The rate of the forward reaction equals the rate of the reverse reaction',
      'Concentrations of reactants and products must be equal',
      'All chemical reactions have completely stopped',
      'The equilibrium constant K_c must equal 1'
    ],
    correct: 0,
    explain: 'Dynamic equilibrium is reached when forward and reverse reaction rates become identical, maintaining constant macroscopic concentrations.'
  },
  {
    id: 'tcat-chem-ce-16',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Easy',
    q: 'What is the pH of a neutral aqueous solution at 25°C where K_w = 1.0 x 10⁻¹⁴?',
    options: ['7', '0', '14', '1'],
    correct: 0,
    explain: 'In pure water at 25°C, [H⁺] = sqrt(K_w) = 10⁻⁷ M, so pH = -log(10⁻⁷) = 7.'
  },
  {
    id: 'tcat-chem-ce-17',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Easy',
    q: 'What type of buffer solution is formed by mixing acetic acid (CH3COOH) and sodium acetate (CH3COONa)?',
    options: ['Acidic buffer solution', 'Basic buffer solution', 'Neutral neutralizer', 'Colloidal suspension'],
    correct: 0,
    explain: 'An acidic buffer consists of a weak acid (CH3COOH) and its conjugate base salt (CH3COONa).'
  },
  {
    id: 'tcat-chem-ce-18',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Hard',
    q: 'For the Haber ammonia reaction N2(g) + 3H2(g) <=> 2NH3(g) (exothermic), which condition shifts equilibrium to the right?',
    options: ['Increasing total pressure and decreasing temperature', 'Decreasing total pressure and increasing temperature', 'Adding an inert gas at constant volume', 'Removing nitrogen gas'],
    correct: 0,
    explain: 'The forward reaction decreases moles of gas (4 -> 2, favored by high pressure) and is exothermic (favored by lower temperature per Le Chatelier\'s principle).'
  },
  {
    id: 'tcat-chem-ce-19',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Medium',
    q: 'What is the relationship between equilibrium constants K_p and K_c for a gaseous reaction?',
    options: ['K_p = K_c (R T)^(Δn)', 'K_p = K_c / (R T)^(Δn)', 'K_c = K_p (R T)^(Δn)', 'K_p = K_c + Δn R T'],
    correct: 0,
    explain: 'K_p = K_c (R T)^(Δn), where Δn is the difference between moles of gaseous products and moles of gaseous reactants.'
  },
  {
    id: 'tcat-chem-ce-20',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Medium',
    q: 'What is the Henderson-Hasselbalch equation for calculating the pH of an acidic buffer mixture?',
    options: ['pH = pK_a + log([Salt] / [Acid])', 'pH = pK_a - log([Salt] / [Acid])', 'pH = pK_w - pK_a', 'pH = pK_a * ([Salt] / [Acid])'],
    correct: 0,
    explain: 'The Henderson-Hasselbalch equation states pH = pK_a + log([conjugate base salt] / [weak acid]).'
  },
  {
    id: 'tcat-chem-ce-21',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Hard',
    q: 'If the solubility product constant K_sp of lead chloride PbCl2 is 3.2 x 10⁻⁵, what is its molar solubility S in pure water?',
    options: ['0.02 M', '0.0056 M', '0.001 M', '0.04 M'],
    correct: 0,
    explain: 'PbCl2(s) <=> Pb²⁺ + 2Cl⁻. K_sp = [S][2S]² = 4S³. 4S³ = 3.2 x 10⁻⁵ => S³ = 8 x 10⁻⁶ => S = 2 x 10⁻² = 0.02 M.'
  },
  {
    id: 'tcat-chem-ce-22',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Hard',
    q: 'When solid NaCl is added to a saturated solution of AgCl, the solubility of AgCl decreases drastically due to:',
    options: ['The common ion effect of Cl⁻', 'Hydrolysis of Na⁺ ions', 'Increase in solubility product K_sp', 'Formation of a coordination complex'],
    correct: 0,
    explain: 'Addition of Cl⁻ from NaCl increases the ionic product [Ag⁺][Cl⁻] above K_sp, precipitating AgCl due to the common ion effect.'
  },

  // =========================================================
  // Chapter: Reaction Kinetics (+8: 2 Easy, 3 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-chem-rk-15',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Easy',
    q: 'What are the SI units for the rate of a chemical reaction in solution?',
    options: ['mol·dm⁻³·s⁻¹', 'mol·s⁻¹', 'dm³·mol⁻¹·s⁻¹', 's⁻¹'],
    correct: 0,
    explain: 'Reaction rate is the change in concentration per unit time: (mol/dm³) / s = mol·dm⁻³·s⁻¹.'
  },
  {
    id: 'tcat-chem-rk-16',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Easy',
    q: 'A catalyst increases the speed of a chemical reaction primarily by:',
    options: [
      'Providing an alternative pathway with lower activation energy',
      'Increasing the overall enthalpy change (ΔH)',
      'Shifting the equilibrium position towards products',
      'Increasing the thermal energy of the reactants'
    ],
    correct: 0,
    explain: 'Catalysts lower the activation energy barrier, enabling a higher fraction of molecular collisions to be effective.'
  },
  {
    id: 'tcat-chem-rk-17',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Medium',
    q: 'For a first-order chemical reaction, what are the units of the specific rate constant k?',
    options: ['s⁻¹', 'mol·dm⁻³·s⁻¹', 'dm³·mol⁻¹·s⁻¹', 'dm⁶·mol⁻²·s⁻¹'],
    correct: 0,
    explain: 'Rate = k [A] => (mol·dm⁻³·s⁻¹) = k (mol·dm⁻³) => k has units s⁻¹.'
  },
  {
    id: 'tcat-chem-rk-18',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Medium',
    q: 'How does the half-life of a first-order reaction depend on the initial concentration of reactant [A]₀?',
    options: ['It is completely independent of initial concentration', 'Directly proportional to [A]₀', 'Inversely proportional to [A]₀', 'Proportional to [A]₀²'],
    correct: 0,
    explain: 'For first order reactions, t_(1/2) = 0.693 / k, which is strictly independent of the starting reactant concentration.'
  },
  {
    id: 'tcat-chem-rk-19',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'According to Arrhenius equation k = A * e^(-E_a / (RT)), a plot of ln(k) versus (1 / T) produces a straight line with slope equal to:',
    options: ['-E_a / R', 'E_a / R', '-E_a / (2.303 R)', 'ln(A)'],
    correct: 0,
    explain: 'Taking natural logs: ln(k) = -E_a/R * (1/T) + ln(A). Plotting ln(k) vs (1/T) yields slope = -E_a / R.'
  },
  {
    id: 'tcat-chem-rk-20',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'In a multi-step chemical reaction mechanism, the overall rate of reaction is governed by:',
    options: ['The slowest elementary step (rate-determining step)', 'The fastest elementary step', 'The first elementary step', 'The final product formation step'],
    correct: 0,
    explain: 'The slowest step in a reaction sequence forms the bottleneck and is termed the rate-determining step (RDS).'
  },
  {
    id: 'tcat-chem-rk-21',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'If doubling the concentration of reactant A quadruples the rate of reaction, what is the order of reaction with respect to A?',
    options: ['Second order', 'First order', 'Zero order', 'Half order'],
    correct: 0,
    explain: 'Rate ∝ [A]^n. When [A] doubles (2^n) and rate quadruples (4 = 2²), n = 2 (second order).'
  },
  {
    id: 'tcat-chem-rk-22',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'Radioactive decay processes strictly follow kinetics of which order?',
    options: ['First order', 'Zero order', 'Second order', 'Third order'],
    correct: 0,
    explain: 'All nuclear radioactive decay phenomena adhere strictly to first-order reaction kinetics.'
  },

  // =========================================================
  // Chapter: Electrochemistry (+8: 3 Easy, 3 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-ec-15',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Easy',
    q: 'In any electrochemical cell, oxidation always takes place at the:',
    options: ['Anode', 'Cathode', 'Salt bridge', 'External voltmeter'],
    correct: 0,
    explain: 'By electrochemical definition (AN OX, RED CAT), oxidation occurs at the anode and reduction occurs at the cathode.'
  },
  {
    id: 'tcat-chem-ec-16',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Easy',
    q: 'What is the oxidation number of manganese in the permanganate ion (MnO4⁻)?',
    options: ['+7', '+6', '+4', '+2'],
    correct: 0,
    explain: 'Mn + 4(-2) = -1 => Mn - 8 = -1 => Mn = +7.'
  },
  {
    id: 'tcat-chem-ec-17',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Easy',
    q: 'What is the primary function of a salt bridge in a galvanic (voltaic) cell?',
    options: [
      'Maintains electrical neutrality in both half-cell solutions',
      'Supplies electrons directly to the cathode',
      'Increases the cell EMF to infinity',
      'Acts as a metallic conductor'
    ],
    correct: 0,
    explain: 'A salt bridge allows ion migration to prevent charge accumulation, thereby maintaining electrical neutrality in both half-cells.'
  },
  {
    id: 'tcat-chem-ec-18',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Medium',
    q: 'According to Faraday’s First Law of Electrolysis, the mass m of a substance liberated at an electrode is proportional to:',
    options: ['Quantity of electricity passed (Q = I * t)', 'Electrode potential', 'Concentration of solution only', 'Temperature of electrolyte'],
    correct: 0,
    explain: 'm = Z * Q = Z * I * t, where Q is total electrical charge passed in Coulombs.'
  },
  {
    id: 'tcat-chem-ec-19',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Medium',
    q: 'What is the standard reduction potential of the Standard Hydrogen Electrode (SHE) at 298 K?',
    options: ['0.00 V', '1.00 V', '-0.76 V', '+0.34 V'],
    correct: 0,
    explain: 'By international agreement, the Standard Hydrogen Electrode (SHE) is assigned an arbitrary reference potential of exactly 0.00 V.'
  },
  {
    id: 'tcat-chem-ec-20',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Medium',
    q: 'For the standard Daniell cell Zn | Zn²⁺ || Cu²⁺ | Cu (E°_Zn²⁺/Zn = -0.76 V, E°_Cu²⁺/Cu = +0.34 V), what is the standard cell potential E°_cell?',
    options: ['+1.10 V', '+0.42 V', '-1.10 V', '-0.42 V'],
    correct: 0,
    explain: 'E°_cell = E°_cathode - E°_anode = +0.34 V - (-0.76 V) = +1.10 V.'
  },
  {
    id: 'tcat-chem-ec-21',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Hard',
    q: 'How many Faradays of electrical charge are required to electroplate one mole of aluminum metal from molten Al2O3?',
    options: ['3 F', '1 F', '2 F', '6 F'],
    correct: 0,
    explain: 'Al³⁺ + 3e⁻ -> Al. Reduction of 1 mole of trivalent Al³⁺ requires 3 moles of electrons, which equals 3 Faradays.'
  },
  {
    id: 'tcat-chem-ec-22',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Hard',
    q: 'Under standard conditions, a redox reaction is thermodynamically spontaneous when its standard Gibbs free energy change ΔG° and standard cell potential E°_cell satisfy:',
    options: ['ΔG° < 0 and E°_cell > 0', 'ΔG° > 0 and E°_cell < 0', 'ΔG° = 0 and E°_cell = 0', 'Both ΔG° and E°_cell are negative'],
    correct: 0,
    explain: 'ΔG° = -n F E°_cell. A spontaneous reaction requires negative free energy (ΔG° < 0), corresponding to positive cell voltage (E°_cell > 0).'
  },

  // =========================================================
  // Chapter: Periodic Classification (+7: 2 Easy, 3 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-pc-15',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Easy',
    q: 'Moseley’s experiment showed that the fundamental periodic property of chemical elements is their:',
    options: ['Atomic number (nuclear charge Z)', 'Atomic weight', 'Density', 'Number of neutrons'],
    correct: 0,
    explain: 'Moseley discovered that X-ray frequency square root varies linearly with atomic number Z, establishing atomic number as the basis of periodicity.'
  },
  {
    id: 'tcat-chem-pc-16',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Easy',
    q: 'Moving from left to right across a period in the Modern Periodic Table, atomic radius generally:',
    options: ['Decreases due to increasing effective nuclear charge', 'Increases due to added shells', 'Remains constant', 'First decreases then doubles'],
    correct: 0,
    explain: 'Across a period, electrons are added to the same principal shell while proton count increases, pulling electrons inward and decreasing atomic radius.'
  },
  {
    id: 'tcat-chem-pc-17',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Medium',
    q: 'Which element in the periodic table has the highest electronegativity on the Pauling scale?',
    options: ['Fluorine (4.0)', 'Oxygen (3.5)', 'Chlorine (3.0)', 'Cesium (0.7)'],
    correct: 0,
    explain: 'Fluorine has the highest electronegativity of all elements, assigned a value of 4.0 on the Pauling scale.'
  },
  {
    id: 'tcat-chem-pc-18',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Medium',
    q: 'Why is the first ionization energy of nitrogen (N, Z = 7) higher than that of oxygen (O, Z = 8)?',
    options: [
      'Nitrogen has a stable half-filled 2p³ subshell',
      'Oxygen has a smaller nuclear charge',
      'Nitrogen is a noble gas',
      'Oxygen electrons experience less shielding'
    ],
    correct: 0,
    explain: 'Nitrogen possesses a half-filled 2p³ configuration which offers enhanced quantum exchange stability compared to oxygen\'s 2p⁴.'
  },
  {
    id: 'tcat-chem-pc-19',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Medium',
    q: 'The diagonal relationship in the periodic table is observed between which pair of elements?',
    options: ['Lithium and Magnesium', 'Sodium and Potassium', 'Beryllium and Calcium', 'Boron and Carbon'],
    correct: 0,
    explain: 'Lithium resembles Magnesium, Beryllium resembles Aluminum, and Boron resembles Silicon due to similar charge-to-radius ratios (diagonal relationship).'
  },
  {
    id: 'tcat-chem-pc-20',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Hard',
    q: 'Why is the electron affinity of chlorine (-349 kJ/mol) more negative (greater exothermic release) than that of fluorine (-328 kJ/mol)?',
    options: [
      'Fluorine\'s small 2p subshell has high electron-electron repulsion that weakens the incoming electron\'s attraction',
      'Chlorine has higher electronegativity',
      'Fluorine cannot form anions',
      'Chlorine has higher nuclear charge than all halogens'
    ],
    correct: 0,
    explain: 'Due to fluorine’s extremely compact 2p subshell, interelectronic repulsions partially offset the attraction for the added electron, making chlorine\'s EA higher.'
  },
  {
    id: 'tcat-chem-pc-21',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Hard',
    q: 'Down a group of the periodic table, the basic nature of metal oxides generally:',
    options: ['Increases', 'Decreases', 'Remains strictly unchanged', 'Changes from basic to acidic'],
    correct: 0,
    explain: 'Down a group, metallic character increases and ionization energy decreases, making electropositive metals release O²⁻ more readily, increasing basicity.'
  },

  // =========================================================
  // Chapter: s and p Block Elements (+7: 3 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-sp-15',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Easy',
    q: 'Why are alkali metals stored immersed under kerosene oil?',
    options: ['To prevent vigorous oxidation and reaction with atmospheric moisture and oxygen', 'To prevent evaporation', 'To make them malleable', 'To neutralize basic oxides'],
    correct: 0,
    explain: 'Alkali metals (Na, K) react violently with air (O2) and water vapor; kerosene protects them from contact with both.'
  },
  {
    id: 'tcat-chem-sp-16',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Easy',
    q: 'Which alkali metal imparts a persistent golden-yellow coloration to a non-luminous Bunsen flame?',
    options: ['Sodium', 'Potassium (lilac)', 'Lithium (crimson)', 'Calcium (brick red)'],
    correct: 0,
    explain: 'Sodium salts produce an intense, characteristic golden-yellow flame emission at 589 nm.'
  },
  {
    id: 'tcat-chem-sp-17',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Easy',
    q: 'What is the common mineral name of gypsum used in manufacturing plaster of Paris?',
    options: ['CaSO4 · 2H2O', 'MgSO4 · 7H2O', 'CaCO3', 'Na2SO4 · 10H2O'],
    correct: 0,
    explain: 'Gypsum is calcium sulfate dihydrate, CaSO4 · 2H2O. Heating to ~100°C produces plaster of Paris (CaSO4 · 0.5H2O).'
  },
  {
    id: 'tcat-chem-sp-18',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Medium',
    q: 'When heated, lithium nitrate (LiNO3) decomposes abnormally compared to other alkali metal nitrates to yield:',
    options: ['Li2O, NO2 gas, and O2 gas', 'LiNO2 and O2 only', 'Li metal and N2', 'Li3N only'],
    correct: 0,
    explain: 'Due to Li⁺\'s high polarizing power, LiNO3 decomposes like group II nitrates: 4LiNO3 -> 2Li2O + 4NO2 + O2.'
  },
  {
    id: 'tcat-chem-sp-19',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Medium',
    q: 'What is the chemical formula of laughing gas used as an anesthetic?',
    options: ['Nitrous oxide (N2O)', 'Nitric oxide (NO)', 'Nitrogen dioxide (NO2)', 'Dinitrogen tetroxide (N2O4)'],
    correct: 0,
    explain: 'Dinitrogen monoxide (N2O), known as nitrous oxide, is called laughing gas and used in mild anesthesia.'
  },
  {
    id: 'tcat-chem-sp-20',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Hard',
    q: 'What is the commercial process used for manufacturing nitric acid (HNO3) by catalytic oxidation of ammonia over platinum-rhodium gauze?',
    options: ['Ostwald’s process', 'Haber’s process', 'Contact process', 'Solvay’s process'],
    correct: 0,
    explain: 'Ostwald\'s process oxidizes NH3 to NO over Pt/Rh gauze at ~850°C, followed by oxidation to NO2 and absorption in water to form HNO3.'
  },
  {
    id: 'tcat-chem-sp-21',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Hard',
    q: 'In the Contact process for manufacturing sulfuric acid, SO3 gas is absorbed in concentrated H2SO4 to form oleum rather than directly into water because:',
    options: [
      'Direct absorption in water produces a dense, unmanageable acid fog/mist',
      'SO3 is insoluble in water',
      'The reaction with water is endothermic',
      'Sulfuric acid would decompose'
    ],
    correct: 0,
    explain: 'Direct dissolution of SO3 in water is highly exothermic, producing a stable aerosol fog of sulfuric acid droplets that cannot be condensed.'
  },

  // =========================================================
  // Chapter: Fundamental Principles of Organic Chemistry (+7: 2 Easy, 3 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-fpoc-15',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Easy',
    q: 'What is the hybridization state of carbon atoms involved in an alkene double bond (C=C)?',
    options: ['sp²', 'sp³', 'sp', 'dsp²'],
    correct: 0,
    explain: 'Double-bonded carbon atoms form three σ bonds in a trigonal planar geometry, requiring sp² hybridization.'
  },
  {
    id: 'tcat-chem-fpoc-16',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Easy',
    q: 'Compounds having identical molecular formulas but different spatial arrangements of atoms in space are called:',
    options: ['Stereoisomers (geometric/optical isomers)', 'Chain isomers', 'Functional group isomers', 'Metamers'],
    correct: 0,
    explain: 'Stereoisomerism arises from different three-dimensional orientations of atoms, rather than differences in connectivity.'
  },
  {
    id: 'tcat-chem-fpoc-17',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Medium',
    q: 'Which type of structural isomerism is displayed by ethanol (CH3CH2OH) and dimethyl ether (CH3OCH3)?',
    options: ['Functional group isomerism', 'Chain isomerism', 'Position isomerism', 'Metamerism'],
    correct: 0,
    explain: 'Both share the formula C2H6O, but one contains an alcohol group (-OH) while the other contains an ether group (-O-).'
  },
  {
    id: 'tcat-chem-fpoc-18',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Medium',
    q: 'What structural condition is essential for an alkene to exhibit geometric (cis-trans) isomerism?',
    options: [
      'Restricted rotation about C=C double bond and two different groups attached to each double-bonded carbon',
      'Only an sp³ hybridized backbone',
      'A chiral center with 4 distinct groups',
      'A triple bond between carbons'
    ],
    correct: 0,
    explain: 'Geometric isomerism requires restricted rotation (like C=C) and that neither carbon of the double bond holds two identical groups.'
  },
  {
    id: 'tcat-chem-fpoc-19',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Medium',
    q: 'The phenomenon in which an organic compound rotates the plane of plane-polarized light is termed:',
    options: ['Optical activity', 'Refraction', 'Fluorescence', 'Geometric isomerism'],
    correct: 0,
    explain: 'Chiral molecules lacking an internal plane of symmetry rotate plane-polarized light and are designated optically active.'
  },
  {
    id: 'tcat-chem-fpoc-20',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Hard',
    q: 'Homolytic fission of a covalent C-C bond produces two neutral reactive species bearing unpaired electrons known as:',
    options: ['Free radicals', 'Carbocations', 'Carbanions', 'Electrophiles'],
    correct: 0,
    explain: 'In homolytic cleavage, each bonding partner retains one electron from the shared pair, producing neutral free radicals.'
  },
  {
    id: 'tcat-chem-fpoc-21',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Hard',
    q: 'Which carbocation exhibits the highest thermodynamic stability due to hyperconjugation and inductive effects?',
    options: ['Tertiary carbocation ((CH3)3C⁺)', 'Secondary carbocation ((CH3)2CH⁺)', 'Primary carbocation (CH3CH2⁺)', 'Methyl carbocation (CH3⁺)'],
    correct: 0,
    explain: 'Tertiary carbocations have 9 hyperconjugative α-hydrogens and three electron-donating alkyl groups, providing maximum stabilization.'
  },

  // =========================================================
  // Chapter: Chemistry of Life (+7: 3 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-col-15',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Easy',
    q: 'What is the characteristic covalent bond linking adjacent amino acid residues in a polypeptide protein chain?',
    options: ['Peptide bond (-CO-NH-)', 'Glycosidic bond', 'Phosphodiester bond', 'Ester linkage'],
    correct: 0,
    explain: 'Condensation of an alpha-amino group with an alpha-carboxylic acid group forms an amide peptide bond (-CO-NH-).'
  },
  {
    id: 'tcat-chem-col-16',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Easy',
    q: 'Which nitrogenous base is present in RNA molecules but absent in DNA?',
    options: ['Uracil', 'Thymine', 'Adenine', 'Cytosine'],
    correct: 0,
    explain: 'RNA contains uracil (U) instead of thymine (T), pairing with adenine during transcription.'
  },
  {
    id: 'tcat-chem-col-17',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Easy',
    q: 'Fats and oils are chemically classified as triesters of fatty acids with which alcohol?',
    options: ['Glycerol (propane-1,2,3-triol)', 'Ethanol', 'Methanol', 'Ethylene glycol'],
    correct: 0,
    explain: 'Triglycerides (fats and oils) are triesters synthesized from three fatty acid chains and one glycerol molecule.'
  },
  {
    id: 'tcat-chem-col-18',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Medium',
    q: 'Enzymes are biological catalysts that accelerate biochemical reactions primarily through which molecular class?',
    options: ['Globular proteins', 'Polysaccharides', 'Steroids', 'Phospholipids'],
    correct: 0,
    explain: 'Almost all biological enzymes are specialized globular proteins with catalytic active sites.'
  },
  {
    id: 'tcat-chem-col-19',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Medium',
    q: 'The α-helix and β-pleated sheet arrangements of a protein correspond to its:',
    options: ['Secondary structure', 'Primary structure', 'Tertiary structure', 'Quaternary structure'],
    correct: 0,
    explain: 'Local folding stabilized by backbone hydrogen bonds constitutes the secondary structure of proteins.'
  },
  {
    id: 'tcat-chem-col-20',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Hard',
    q: 'What is the isoelectric point (pI) of an amino acid?',
    options: [
      'The specific pH at which the amino acid exists predominantly as a neutral dipolar zwitterion with net charge zero',
      'The pH at which it precipitates as a solid',
      'The temperature at which peptide bonds hydrolyze',
      'The pH where all carboxyl groups are fully protonated'
    ],
    correct: 0,
    explain: 'At its isoelectric point (pI), an amino acid forms a dipolar zwitterion carrying zero net charge and does not migrate in an electric field.'
  },
  {
    id: 'tcat-chem-col-21',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Hard',
    q: 'In the DNA double helix, how many hydrogen bonds link a Guanine (G) and Cytosine (C) complementary base pair?',
    options: ['3 hydrogen bonds', '2 hydrogen bonds', '1 hydrogen bond', '4 hydrogen bonds'],
    correct: 0,
    explain: 'Guanine pairs with cytosine via 3 hydrogen bonds, whereas adenine pairs with thymine via 2 hydrogen bonds.'
  },

  // =========================================================
  // Chapter: Basic Concepts of Chemistry (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-bc-16',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Easy',
    q: 'What is the mass in grams of one mole of glucose (C6H12O6)?',
    options: ['180 g', '342 g', '90 g', '60 g'],
    correct: 0,
    explain: 'Molar mass of C6H12O6 = 6(12) + 12(1) + 6(16) = 72 + 12 + 96 = 180 g/mol.'
  },
  {
    id: 'tcat-chem-bc-17',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Easy',
    q: 'The molecular formula of a compound is related to its empirical formula by: Molecular Formula = (Empirical Formula)_n, where n is:',
    options: ['Molecular mass / Empirical formula mass', 'Empirical formula mass / Molecular mass', 'Number of carbon atoms', 'Avogadro’s number'],
    correct: 0,
    explain: 'The integer multiple n is the ratio of the true molecular weight to the empirical formula weight.'
  },
  {
    id: 'tcat-chem-bc-18',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Medium',
    q: 'How many moles of helium gas are contained in 2.0 grams of He (atomic mass = 4 g/mol)?',
    options: ['0.50 mol', '2.0 mol', '1.0 mol', '0.25 mol'],
    correct: 0,
    explain: 'Moles = mass / molar mass = 2.0 g / 4.0 g/mol = 0.50 mol.'
  },
  {
    id: 'tcat-chem-bc-19',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Medium',
    q: 'What volume in dm³ will 8.0 g of oxygen gas (O2, molar mass = 32 g/mol) occupy at STP?',
    options: ['5.6 dm³', '22.4 dm³', '11.2 dm³', '2.8 dm³'],
    correct: 0,
    explain: 'Moles of O2 = 8 / 32 = 0.25 mol. Volume at STP = 0.25 * 22.4 dm³ = 5.6 dm³.'
  },
  {
    id: 'tcat-chem-bc-20',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Hard',
    q: 'In a mass spectrometer, isotopes of an element are separated based on their differential:',
    options: ['Mass-to-charge ratio (m/e)', 'Boiling point', 'Chemical reactivity', 'Nuclear spin only'],
    correct: 0,
    explain: 'In a magnetic field, trajectory radius r = sqrt(2Vm / (B²e)), separating positive ions strictly by their mass-to-charge (m/e) ratio.'
  },
  {
    id: 'tcat-chem-bc-21',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Hard',
    q: 'Combustion of 0.5 g of a hydrocarbon yields 1.57 g of CO2 and 0.64 g of H2O. What is the empirical formula of the hydrocarbon?',
    options: ['CH2', 'CH', 'CH3', 'C2H5'],
    correct: 0,
    explain: 'Moles C = 1.57 / 44 = 0.0357 mol. Moles H = 2 * (0.64 / 18) = 0.0711 mol. Ratio H/C = 0.0711 / 0.0357 ≈ 2.0. Empirical formula is CH2.'
  },

  // =========================================================
  // Chapter: Gases, Liquids and Solids (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-gls-16',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Easy',
    q: 'According to Boyle’s Law, at constant temperature, the volume V of a fixed mass of gas is:',
    options: ['Inversely proportional to its pressure P (P * V = constant)', 'Directly proportional to P', 'Proportional to P²', 'Independent of P'],
    correct: 0,
    explain: 'Boyle’s law states that volume is inversely proportional to pressure at constant temperature: V ∝ 1/P.'
  },
  {
    id: 'tcat-chem-gls-17',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Easy',
    q: 'The temperature at which the vapor pressure of a liquid becomes equal to external atmospheric pressure is the liquid’s:',
    options: ['Boiling point', 'Melting point', 'Critical temperature', 'Triple point'],
    correct: 0,
    explain: 'Boiling occurs when internal saturated vapor pressure equals the prevailing ambient atmospheric pressure.'
  },
  {
    id: 'tcat-chem-gls-18',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Medium',
    q: 'According to Graham’s Law of Diffusion, the rates of diffusion of two gases are inversely proportional to the square root of their:',
    options: ['Molar masses (or densities)', 'Temperatures', 'Pressures', 'Volumes'],
    correct: 0,
    explain: 'Graham’s law states: r1 / r2 = sqrt(M2 / M1) = sqrt(d2 / d1) at identical temperature and pressure.'
  },
  {
    id: 'tcat-chem-gls-19',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Medium',
    q: 'In the van der Waals equation (P + an²/V²)(V - nb) = nRT, what physical property does constant "a" account for?',
    options: ['Intermolecular attractive forces between gas molecules', 'Finite volume occupied by gas molecules', 'Molecular kinetic energy', 'Gravitational force'],
    correct: 0,
    explain: 'The van der Waals parameter "a" corrects for attractive intermolecular forces, while "b" accounts for the finite molecular volume.'
  },
  {
    id: 'tcat-chem-gls-20',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Hard',
    q: 'Why does ice float on liquid water?',
    options: [
      'Ice has an open hexagonal cage-like crystalline structure held by hydrogen bonds, occupying ~9% more volume than liquid water',
      'Ice molecules have lower molecular weight',
      'Surface tension pushes ice upward',
      'Liquid water is completely non-polar'
    ],
    correct: 0,
    explain: 'Hydrogen bonding creates an open tetrahedral network in ice that creates interstitial voids, lowering its density relative to liquid water.'
  },
  {
    id: 'tcat-chem-gls-21',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Hard',
    q: 'How many Bravais space lattices are distributed across the seven crystal systems in crystallography?',
    options: ['14', '7', '32', '230'],
    correct: 0,
    explain: 'There are 14 unique Bravais space lattices categorized under the 7 primary crystal coordinate systems.'
  },

  // =========================================================
  // Chapter: Chemical Bonding (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-cb-16',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Easy',
    q: 'What is the molecular geometry of a methane molecule (CH4) according to VSEPR theory?',
    options: ['Tetrahedral (bond angle ~109.5°)', 'Trigonal planar', 'Linear', 'Octahedral'],
    correct: 0,
    explain: 'With four bonding electron pairs and zero lone pairs around carbon, VSEPR predicts a regular tetrahedral geometry with 109.5° bond angles.'
  },
  {
    id: 'tcat-chem-cb-17',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Easy',
    q: 'A coordinate covalent (dative) bond is formed when:',
    options: [
      'Both shared electrons in the bond are supplied by one of the bonded atoms',
      'Electrons are transferred completely to form ions',
      'Each atom shares one electron mutually',
      'Metal cations sit in an electron sea'
    ],
    correct: 0,
    explain: 'In a dative bond, a Lewis base donates a lone pair into an empty orbital of an electron-deficient Lewis acid.'
  },
  {
    id: 'tcat-chem-cb-18',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Medium',
    q: 'What is the bond order of the oxygen molecule (O2) according to Molecular Orbital Theory (MOT)?',
    options: ['2', '1', '2.5', '3'],
    correct: 0,
    explain: 'In O2, there are 10 bonding electrons and 6 antibonding electrons. Bond order = (10 - 6) / 2 = 2 (double bond), and it has 2 unpaired electrons (paramagnetic).'
  },
  {
    id: 'tcat-chem-cb-19',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Medium',
    q: 'Why is the bond angle in a water molecule (H2O, ~104.5°) smaller than the ideal tetrahedral angle (109.5°)?',
    options: [
      'Lone pair - lone pair repulsions are stronger than bond pair - bond pair repulsions',
      'Oxygen has high atomic mass',
      'Hydrogen atoms attract each other',
      'The bond is purely ionic'
    ],
    correct: 0,
    explain: 'Repulsion order is lone pair-lone pair > lone pair-bond pair > bond pair-bond pair. Two lone pairs compress the H-O-H angle down to 104.5°.'
  },
  {
    id: 'tcat-chem-cb-20',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Hard',
    q: 'What is the hybridization of the central sulfur atom in sulfur hexafluoride (SF6)?',
    options: ['sp³d²', 'sp³d', 'sp³', 'dsp²'],
    correct: 0,
    explain: 'Sulfur in SF6 forms 6 σ bonds with zero lone pairs (steric number = 6), which corresponds to sp³d² hybridization with octahedral geometry.'
  },
  {
    id: 'tcat-chem-cb-21',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Hard',
    q: 'Why does carbon dioxide (CO2) have a net zero dipole moment despite having two polar C=O bonds?',
    options: [
      'It has a linear symmetrical geometry where the two equal bond dipoles oppose and cancel each other',
      'C=O bonds are completely non-polar',
      'Carbon has no valence electrons',
      'It is in a liquid state'
    ],
    correct: 0,
    explain: 'CO2 is linear (O=C=O). The two individual C=O bond dipole vectors point in exactly opposite directions (180°), canceling to yield a net dipole moment of 0 Debye.'
  },

  // =========================================================
  // Chapter: Hydrocarbons (+6: 1 Easy, 3 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-hc-16',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Easy',
    q: 'Which chemical reagent is used in Baeyer’s test to detect unsaturation (double or triple bonds) in alkenes?',
    options: ['Cold alkaline potassium permanganate (KMnO4)', 'Acidified potassium dichromate', 'Fehling’s solution', 'Tollens’ reagent'],
    correct: 0,
    explain: 'Baeyer’s reagent (cold dilute alkaline KMnO4) oxidizes alkenes to vicinal diols, discharging the pink permanganate color to form brown MnO2.'
  },
  {
    id: 'tcat-chem-hc-17',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Medium',
    q: 'According to Markovnikov’s rule, when an unsymmetrical reagent like HBr adds to propene (CH3-CH=CH2), the hydrogen atom attaches to:',
    options: [
      'The double-bonded carbon holding the greater number of hydrogen atoms',
      'The double-bonded carbon with fewer hydrogens',
      'Either carbon equally',
      'The central carbon atom exclusively'
    ],
    correct: 0,
    explain: 'Electrophilic addition follows Markovnikov’s rule: H⁺ adds to the carbon with more hydrogen atoms (CH2) to form the more stable secondary carbocation.'
  },
  {
    id: 'tcat-chem-hc-18',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Medium',
    q: 'Benzene exhibits exceptional chemical stability and resists addition reactions primarily due to:',
    options: [
      'Delocalization of six π electrons across the planar cyclic ring (resonance energy ~150 kJ/mol)',
      'High electronegativity of sp² carbons',
      'Presence of alternating fixed single and double bonds',
      'Steric hindrance of hydrogen atoms'
    ],
    correct: 0,
    explain: 'Continuous delocalization of 6 π electrons in a closed loop imparts ~150 kJ/mol of aromatic stabilization energy to benzene (Hückel’s 4n+2 rule).'
  },
  {
    id: 'tcat-chem-hc-19',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Medium',
    q: 'In the halogenation of benzene (e.g. chlorination), what role does anhydrous AlCl3 play?',
    options: ['Lewis acid catalyst that generates the chloronium electrophile (Cl⁺)', 'Reducing agent', 'Solvent medium', 'Free radical initiator'],
    correct: 0,
    explain: 'AlCl3 accepts a chloride ion from Cl2 to form AlCl4⁻ and the strongly electrophilic chloronium ion Cl⁺, which attacks the benzene ring.'
  },
  {
    id: 'tcat-chem-hc-20',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Hard',
    q: 'Ozonolysis of an alkene followed by reductive zinc/water workup produces two moles of acetone ((CH3)2C=O). What was the starting alkene?',
    options: ['2,3-Dimethylbut-2-ene', '2-Methylbut-2-ene', 'Hex-3-ene', '2-Methylpropene'],
    correct: 0,
    explain: 'Cleavage of (CH3)2C=C(CH3)2 at the double bond creates two acetone units: (CH3)2C=O and O=C(CH3)2.'
  },
  {
    id: 'tcat-chem-hc-21',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Hard',
    q: 'In electrophilic aromatic substitution on nitrobenzene, into which position does an incoming substituent predominantly direct?',
    options: ['Meta position', 'Ortho position', 'Para position', 'Equally ortho and para'],
    correct: 0,
    explain: 'The nitro group (-NO2) is strongly electron-withdrawing by both resonance and inductive effects, deactivating ortho/para positions and directing to meta.'
  }
];

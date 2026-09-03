import { Question } from '../types';

export const TCAT_CHEMISTRY_QUESTIONS: Question[] = [
  // ==========================================
  // Chapter 1: Basic Concepts of Chemistry (8 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-bc-1',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Easy',
    q: 'How many molecules are present in one mole of any pure substance (Avogadro number N_A)?',
    options: ['6.022 × 10^{23}', '6.022 × 10^{22}', '1.66 × 10^{-24}', '3.0 × 10^8'],
    correct: 0,
    explain: 'By definition, one mole of any substance contains exactly Avogadro number of representative entities: 6.022 × 10^{23}.'
  },
  {
    id: 'tcat-chem-bc-2',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Easy',
    q: 'What is the molar volume occupied by one mole of any ideal gas at Standard Temperature and Pressure (STP: 0°C, 1 atm)?',
    options: ['22.414 dm^3 (or L)', '24.0 dm^3', '11.2 dm^3', '22.414 cm^3'],
    correct: 0,
    explain: 'At STP (273.15 K and 1 atm), one mole of any ideal gas occupies a standard molar volume of 22.414 dm^3 (or liters).'
  },
  {
    id: 'tcat-chem-bc-3',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Easy',
    q: 'The reactant that is completely consumed first in a chemical reaction and limits the amount of product formed is the:',
    options: ['Limiting reactant', 'Excess reactant', 'Stoichiometric catalyst', 'Theoretical reagent'],
    correct: 0,
    explain: 'The limiting reactant (or reagent) is consumed first in a reaction, thereby limiting and determining the maximum theoretical yield of products.'
  },
  {
    id: 'tcat-chem-bc-4',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Medium',
    q: 'What is the mass of 0.5 moles of carbon dioxide (CO2, molar mass = 44 g/mol)?',
    options: ['22 g', '44 g', '11 g', '88 g'],
    correct: 0,
    explain: 'Mass = moles × molar mass = 0.5 mol × 44 g/mol = 22 g.'
  },
  {
    id: 'tcat-chem-bc-5',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Medium',
    q: 'A compound contains 40% Carbon, 6.7% Hydrogen, and 53.3% Oxygen by mass. If its molecular mass is 60 g/mol, what is its molecular formula?',
    options: ['C2H4O2 (Acetic acid)', 'CH2O', 'C3H6O3', 'C6H12O6'],
    correct: 0,
    explain: 'Mole ratio: C = 40/12 = 3.33, H = 6.7/1 = 6.7, O = 53.3/16 = 3.33. Ratio = 1 : 2 : 1 => Empirical formula CH2O (mass = 30). n = 60 / 30 = 2. Molecular formula = (CH2O)2 = C2H4O2.'
  },
  {
    id: 'tcat-chem-bc-6',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Medium',
    q: 'How many atoms of oxygen are present in 18 g of liquid water (H2O)?',
    options: ['6.022 × 10^{23} atoms', '1.204 × 10^{24} atoms', '1.806 × 10^{24} atoms', '3.011 × 10^{23} atoms'],
    correct: 0,
    explain: '18 g of H2O is exactly 1 mole of H2O. Each H2O molecule has 1 oxygen atom, so 1 mole contains 1 × N_A = 6.022 × 10^{23} oxygen atoms.'
  },
  {
    id: 'tcat-chem-bc-7',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Hard',
    q: 'If 4 g of H2 gas reacts with 32 g of O2 gas to form water (2H2 + O2 -> 2H2O), what is the maximum mass of water produced?',
    options: ['36 g', '18 g', '32 g', '72 g'],
    correct: 0,
    explain: 'Moles of H2 = 4g / 2g/mol = 2 mol. Moles of O2 = 32g / 32g/mol = 1 mol. Stoichiometric ratio is 2 : 1, so both reactants are consumed completely without excess. Mass of H2O = 2 mol × 18 g/mol = 36 g.'
  },
  {
    id: 'tcat-chem-bc-8',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Hard',
    q: 'In an experiment, 20 g of CaCO3 decomposes to yield 8.96 g of CaO (theoretical yield = 11.2 g). What is the percentage yield of CaO?',
    options: ['80%', '75%', '85%', '90%'],
    correct: 0,
    explain: 'Percentage yield = (Actual Yield / Theoretical Yield) × 100% = (8.96 / 11.2) × 100% = 0.80 × 100% = 80%.'
  },

  // ==========================================
  // Chapter 2: Experimental Techniques (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-et-1',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Easy',
    q: 'Which technique is used to purify solid chemical compounds based on differential solubility in a solvent at varying temperatures?',
    options: ['Crystallization', 'Filtration', 'Sublimation', 'Chromatography'],
    correct: 0,
    explain: 'Crystallization is the primary method for purifying impure solid substances, relying on high solute solubility at high temperatures and low solubility when cooled.'
  },
  {
    id: 'tcat-chem-et-2',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Easy',
    q: 'The direct transition of a solid substance to vapor without passing through the intermediate liquid state is called:',
    options: ['Sublimation', 'Evaporation', 'Distillation', 'Condensation'],
    correct: 0,
    explain: 'Sublimation is the phase change directly from solid to gas (e.g., iodine, camphor, ammonium chloride, benzoic acid).'
  },
  {
    id: 'tcat-chem-et-3',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Easy',
    q: 'What is the retardation factor (R_f) in paper chromatography defined as?',
    options: ['Distance moved by component / Distance moved by solvent front', 'Distance moved by solvent / Distance moved by component', 'Mass of solute / Volume of solvent', 'Time taken by solute / Time taken by solvent'],
    correct: 0,
    explain: 'R_f = (Distance traveled by the component) / (Distance traveled by the solvent front). Because the component moves less than or equal to the solvent, R_f <= 1.'
  },
  {
    id: 'tcat-chem-et-4',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Medium',
    q: 'In solvent extraction (liquid-liquid extraction), repeated extractions with small portions of solvent are preferred over a single batch extraction because:',
    options: ['They extract a larger cumulative fraction of solute', 'They reduce solvent volatility', 'They change the distribution coefficient', 'They prevent solvent decomposition'],
    correct: 0,
    explain: 'By the partition law, multiple extractions using smaller volumes of solvent extract significantly more solute than a single extraction using the entire volume.'
  },
  {
    id: 'tcat-chem-et-5',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Medium',
    q: 'Which of the following substances undergoes sublimation upon heating at atmospheric pressure?',
    options: ['Ammonium chloride (NH4Cl)', 'Sodium chloride (NaCl)', 'Calcium carbonate (CaCO3)', 'Potassium nitrate (KNO3)'],
    correct: 0,
    explain: 'NH4Cl sublimes upon heating into NH3 and HCl vapors which recombine upon cooling on the colder walls of the funnel.'
  },
  {
    id: 'tcat-chem-et-6',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Hard',
    q: 'A solute with distribution coefficient K = 4 distributes between ether and water. If 10 g of solute in 100 mL water is extracted once with 50 mL of ether, what mass of solute remains in the water layer?',
    options: ['3.33 g', '6.67 g', '2.5 g', '5.0 g'],
    correct: 0,
    explain: 'Remaining mass w1 = w [V_aq / (K V_org + V_aq)] = 10 [100 / (4 × 50 + 100)] = 10 [100 / 300] = 10 / 3 = 3.33 g.'
  },
  {
    id: 'tcat-chem-et-7',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Hard',
    q: 'What is the stationary phase in paper partition chromatography?',
    options: ['Water molecules adsorbed on the cellulose fibers of the paper', 'The solid cellulose fibers themselves', 'The organic mobile solvent', 'Air trapped inside the chamber'],
    correct: 0,
    explain: 'In paper partition chromatography, moisture (water) strongly adsorbed on the cellulose network acts as the liquid stationary phase, while the moving solvent acts as the mobile phase.'
  },

  // ==========================================
  // Chapter 3: Gases, Liquids and Solids (8 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-gls-1',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Easy',
    q: 'According to Boyle Law, at constant temperature, the volume of a given mass of gas is:',
    options: ['Inversely proportional to its pressure (P \\propto 1/V)', 'Directly proportional to its pressure', 'Directly proportional to absolute temperature', 'Independent of pressure'],
    correct: 0,
    explain: 'Boyle Law states that at constant temperature, P1 V1 = P2 V2, meaning volume is inversely proportional to pressure.'
  },
  {
    id: 'tcat-chem-gls-2',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Easy',
    q: 'What is the value of absolute zero on the Celsius scale?',
    options: ['-273.15 °C', '0 °C', '-100 °C', '-459.67 °C'],
    correct: 0,
    explain: 'Absolute zero corresponds to 0 Kelvin, which is equal to -273.15 °C on the Celsius scale.'
  },
  {
    id: 'tcat-chem-gls-3',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Easy',
    q: 'How many total atoms belong to a single unit cell of a Face-Centered Cubic (FCC) crystal lattice?',
    options: ['4 atoms', '2 atoms', '1 atom', '8 atoms'],
    correct: 0,
    explain: 'FCC has 8 corner atoms (8 × 1/8 = 1 atom) and 6 face-centered atoms (6 × 1/2 = 3 atoms), totaling 1 + 3 = 4 atoms per unit cell.'
  },
  {
    id: 'tcat-chem-gls-4',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Medium',
    q: 'According to Graham Law of Diffusion, the rate of diffusion of gas A (molar mass = 16) compared to gas B (molar mass = 64) is:',
    options: ['Gas A diffuses 2 times faster than Gas B', 'Gas A diffuses 4 times faster than Gas B', 'Gas B diffuses 2 times faster than Gas A', 'Both diffuse at equal rates'],
    correct: 0,
    explain: 'rA / rB = \\sqrt{MB / MA} = \\sqrt{64 / 16} = \\sqrt{4} = 2. Thus Gas A diffuses twice as fast as Gas B.'
  },
  {
    id: 'tcat-chem-gls-5',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Medium',
    q: 'In the Van der Waals equation of state [P + (an^2 / V^2)](V - nb) = nRT, what does the constant "a" account for?',
    options: ['Intermolecular attractive forces', 'Finite molecular volume', 'Kinetic energy of molecules', 'Deviations in absolute temperature'],
    correct: 0,
    explain: 'The parameter "a" corrects for intermolecular attractive forces between gas molecules, while "b" accounts for the effective excluded volume of molecules.'
  },
  {
    id: 'tcat-chem-gls-6',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Medium',
    q: 'Why does water have an unusually high boiling point compared to hydrogen sulfide (H2S)?',
    options: ['Strong intermolecular hydrogen bonding', 'Higher molecular mass', 'Covalent network bonding', 'Higher London dispersion forces'],
    correct: 0,
    explain: 'Water molecules form extensive three-dimensional intermolecular hydrogen bonds due to the high electronegativity of oxygen, requiring substantial energy to break.'
  },
  {
    id: 'tcat-chem-gls-7',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Hard',
    q: 'What is the temperature at which water coexists simultaneously in thermodynamic equilibrium as ice, liquid, and steam (Triple Point of water)?',
    options: ['0.01 °C (273.16 K) at 4.58 mmHg', '0.00 °C (273.15 K) at 760 mmHg', '100 °C at 1 atm', '-0.01 °C at 1 atm'],
    correct: 0,
    explain: 'The triple point of pure water occurs at precisely 273.16 K (0.01 °C) and a partial vapor pressure of 4.58 mmHg (0.006 atm).'
  },
  {
    id: 'tcat-chem-gls-8',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Hard',
    q: 'Using Bragg equation n\\lambda = 2d\\sin(\\theta), find the interplanar spacing d for first-order reflection (n = 1) at glancing angle \\theta = 30° using X-rays of wavelength 1.54 Å.',
    options: ['1.54 Å', '3.08 Å', '0.77 Å', '2.18 Å'],
    correct: 0,
    explain: 'n\\lambda = 2d\\sin(\\theta) => 1(1.54) = 2d\\sin(30°) = 2d(0.5) = d => d = 1.54 Å.'
  },

  // ==========================================
  // Chapter 4: Atomic Structure (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-as-1',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Easy',
    q: 'What is the maximum number of electrons that can be accommodated in a subshell with azimuthal quantum number l = 2 (d subshell)?',
    options: ['10', '6', '14', '2'],
    correct: 0,
    explain: 'Maximum electrons in any subshell = 2(2l + 1). For l = 2 (d subshell): 2(2(2) + 1) = 2(5) = 10 electrons.'
  },
  {
    id: 'tcat-chem-as-2',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Easy',
    q: 'Which principle states that no two electrons in an atom can have the same set of four quantum numbers?',
    options: ['Pauli Exclusion Principle', 'Aufbau Principle', 'Hund Rule of Maximum Multiplicity', 'Heisenberg Uncertainty Principle'],
    correct: 0,
    explain: 'The Pauli Exclusion Principle dictates that each electron in an atom must possess a unique set of four quantum numbers (n, l, m, s).'
  },
  {
    id: 'tcat-chem-as-3',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Medium',
    q: 'What is the correct ground-state electronic configuration of Chromium (Cr, atomic number Z = 24)?',
    options: ['[Ar] 4s^1 3d^5', '[Ar] 4s^2 3d^4', '[Ar] 4s^0 3d^6', '[Ar] 3d^6'],
    correct: 0,
    explain: 'To achieve the extra thermodynamic stability of a half-filled 3d subshell (3d^5), one 4s electron is promoted: [Ar] 4s^1 3d^5.'
  },
  {
    id: 'tcat-chem-as-4',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Medium',
    q: 'What is the charge-to-mass ratio (e/m) of an electron as determined by J.J. Thomson?',
    options: ['1.7588 × 10^{11} C/kg', '1.602 × 10^{-19} C/kg', '9.109 × 10^{-31} C/kg', '9.58 × 10^7 C/kg'],
    correct: 0,
    explain: 'J.J. Thomson determined e/m = (1.602 × 10^{-19} C) / (9.109 × 10^{-31} kg) = 1.7588 × 10^{11} C/kg.'
  },
  {
    id: 'tcat-chem-as-5',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Medium',
    q: 'According to Hund Rule, when degenerate orbitals are available, electrons prefer to occupy them:',
    options: ['Singly with parallel spins before pairing begins', 'In pairs with anti-parallel spins first', 'In order of decreasing spin multiplicity', 'Randomly without spin preference'],
    correct: 0,
    explain: 'Hund Rule states that degenerate orbitals are each singly occupied by electrons with parallel spins before any orbital is doubly occupied.'
  },
  {
    id: 'tcat-chem-as-6',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Hard',
    q: 'According to Heisenberg Uncertainty Principle, if the position of an electron is determined with an uncertainty \\Delta x, the uncertainty in momentum \\Delta p satisfies:',
    options: ['\\Delta x · \\Delta p >= h / (4\\pi)', '\\Delta x · \\Delta p <= h / (2\\pi)', '\\Delta x / \\Delta p >= h / (4\\pi)', '\\Delta x · \\Delta p = h / (2\\pi)'],
    correct: 0,
    explain: 'Heisenberg Uncertainty Principle mathematically states that \\Delta x · \\Delta p >= \\hbar / 2 = h / (4\\pi).'
  },
  {
    id: 'tcat-chem-as-7',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Hard',
    q: 'How many total nodal planes (angular nodes) are present in a 3d_{xy} atomic orbital?',
    options: ['2', '1', '3', '0'],
    correct: 0,
    explain: 'Number of angular nodes (nodal planes) is equal to azimuthal quantum number l. For any d orbital (l = 2), there are exactly 2 nodal planes.'
  },

  // ==========================================
  // Chapter 5: Chemical Bonding (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-cb-1',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Easy',
    q: 'What is the hybridization and molecular geometry of Methane (CH4)?',
    options: ['sp^3, Tetrahedral (bond angle 109.5°)', 'sp^2, Trigonal planar', 'sp, Linear', 'sp^3d, Trigonal bipyramidal'],
    correct: 0,
    explain: 'Carbon in CH4 forms 4 single sigma bonds with no lone pairs, exhibiting sp^3 hybridization with tetrahedral geometry and 109.5° bond angles.'
  },
  {
    id: 'tcat-chem-cb-2',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Easy',
    q: 'Which of the following molecules has a permanent dipole moment of zero (non-polar molecule)?',
    options: ['Carbon dioxide (CO2)', 'Water (H2O)', 'Ammonia (NH3)', 'Sulfur dioxide (SO2)'],
    correct: 0,
    explain: 'CO2 has a linear symmetric geometry (O=C=O) where the two equal C=O bond dipoles point in opposite directions and cancel out completely (\\mu = 0 D).'
  },
  {
    id: 'tcat-chem-cb-3',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Medium',
    q: 'According to Molecular Orbital Theory (MOT), what is the bond order of the diatomic oxygen molecule (O2)?',
    options: ['2.0 (paramagnetic)', '2.5 (diamagnetic)', '1.5 (paramagnetic)', '3.0 (diamagnetic)'],
    correct: 0,
    explain: 'O2 has 10 bonding electrons and 6 antibonding electrons: Bond Order = (10 - 6)/2 = 2.0. The 2 unpaired electrons in \\pi*2px and \\pi*2py make O2 paramagnetic.'
  },
  {
    id: 'tcat-chem-cb-4',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Medium',
    q: 'Why is the bond angle in water (H2O, 104.5°) smaller than that in ammonia (NH3, 107.5°)?',
    options: ['Water has 2 lone pairs on oxygen causing greater lone pair - lone pair repulsion', 'Oxygen is larger than nitrogen', 'Hydrogen bonding reduces angle in vapor', 'Ammonia has sp^2 hybridization'],
    correct: 0,
    explain: 'By VSEPR theory, lone pair-lone pair repulsion > lone pair-bond pair repulsion > bond pair-bond pair repulsion. H2O has 2 lone pairs compared to 1 lone pair in NH3, compressing the bond angle more.'
  },
  {
    id: 'tcat-chem-cb-5',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Medium',
    q: 'What is the hybridization state of boron in Boron Trifluoride (BF3)?',
    options: ['sp^2 (Trigonal planar, 120°)', 'sp^3 (Tetrahedral)', 'sp (Linear)', 'dsp^2 (Square planar)'],
    correct: 0,
    explain: 'Boron in BF3 has 3 valence electrons forming 3 B-F sigma bonds with zero lone pairs, giving sp^2 hybridization and trigonal planar geometry with 120° angles.'
  },
  {
    id: 'tcat-chem-cb-6',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Hard',
    q: 'Which of the following diatomic species is diamagnetic and has a bond order of 3.0?',
    options: ['Nitrogen molecule (N2)', 'Oxygen molecule (O2)', 'Nitric oxide (NO)', 'Superoxide ion (O2^-)'],
    correct: 0,
    explain: 'N2 has 14 valence electrons (10 bonding, 4 antibonding). Bond order = (10 - 4)/2 = 3. All electrons are paired, making N2 diamagnetic.'
  },
  {
    id: 'tcat-chem-cb-7',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Hard',
    q: 'What is the molecular geometry of Xenon Tetrafluoride (XeF4) according to VSEPR theory?',
    options: ['Square planar', 'Tetrahedral', 'Seesaw', 'Trigonal bipyramidal'],
    correct: 0,
    explain: 'Xe has 8 valence electrons + 4 from F = 12 electrons (6 electron pairs: 4 bonding pairs + 2 lone pairs). Electron geometry is octahedral with lone pairs occupying opposite axial positions, resulting in square planar molecular shape.'
  },

  // ==========================================
  // Chapter 6: Thermochemistry (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-tc-1',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Easy',
    q: 'An exothermic chemical reaction is characterized by:',
    options: ['\\Delta H < 0 (Heat released to surroundings)', '\\Delta H > 0 (Heat absorbed from surroundings)', '\\Delta H = 0', 'Absorption of light only'],
    correct: 0,
    explain: 'In an exothermic reaction, enthalpy of products is lower than enthalpy of reactants, resulting in a negative change in enthalpy (\\Delta H < 0) and heat release.'
  },
  {
    id: 'tcat-chem-tc-2',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Easy',
    q: 'What is the standard enthalpy of formation (\\Delta H_f°) of pure elements in their most stable reference physical states (e.g., O2(g), C(graphite))?',
    options: ['0 kJ/mol by convention', '100 kJ/mol', '-393.5 kJ/mol', '1.0 kJ/mol'],
    correct: 0,
    explain: 'By thermodynamic convention, the standard enthalpy of formation of any pure element in its standard state at 298 K and 1 atm is assigned a value of zero.'
  },
  {
    id: 'tcat-chem-tc-3',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Medium',
    q: 'Hess Law of Constant Heat Summation states that the total enthalpy change of a reaction is:',
    options: ['Independent of the reaction pathway taken', 'Dependent on the number of intermediate steps', 'Always positive', 'Equal to the activation energy'],
    correct: 0,
    explain: 'Because enthalpy H is a thermodynamic state function, the net enthalpy change \\Delta H depends solely on initial and final states, independent of the path.'
  },
  {
    id: 'tcat-chem-tc-4',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Medium',
    q: 'Which piece of laboratory apparatus is specifically designed to measure the enthalpy of combustion of a fuel at constant volume?',
    options: ['Bomb calorimeter', 'Glass coffee-cup calorimeter', 'Manometer', 'Pycnometer'],
    correct: 0,
    explain: 'A bomb calorimeter operates at constant volume (\\Delta V = 0, q_v = \\Delta U) to measure standard heats of combustion under high oxygen pressure.'
  },
  {
    id: 'tcat-chem-tc-5',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Medium',
    q: 'What is the enthalpy change for the neutralization of a strong acid with a strong base in dilute aqueous solution (H^+ + OH^- -> H2O)?',
    options: ['-57.4 kJ/mol', '+57.4 kJ/mol', '-13.7 kJ/mol', '-100 kJ/mol'],
    correct: 0,
    explain: 'The enthalpy of neutralization of any strong acid by a strong base is approximately constant at -57.4 kJ/mol (or -13.7 kcal/mol).'
  },
  {
    id: 'tcat-chem-tc-6',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Hard',
    q: 'Given: C(s) + O2(g) -> CO2(g) (\\Delta H1 = -393.5 kJ) and CO(g) + 1/2 O2(g) -> CO2(g) (\\Delta H2 = -283.0 kJ). What is \\Delta H for C(s) + 1/2 O2(g) -> CO(g)?',
    options: ['-110.5 kJ', '+110.5 kJ', '-676.5 kJ', '+676.5 kJ'],
    correct: 0,
    explain: 'Subtracting reaction 2 from reaction 1: \\Delta H = \\Delta H1 - \\Delta H2 = -393.5 - (-283.0) = -393.5 + 283.0 = -110.5 kJ/mol.'
  },
  {
    id: 'tcat-chem-tc-7',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Hard',
    q: 'The Born-Haber cycle is primarily used to calculate which thermodynamic property of an ionic crystal?',
    options: ['Lattice energy', 'Enthalpy of hydration', 'Electronegativity', 'Activation energy'],
    correct: 0,
    explain: 'The Born-Haber cycle applies Hess Law to calculate the lattice energy of ionic solids (such as NaCl) from experimental sublimation, ionization, dissociation, and electron affinity data.'
  },

  // ==========================================
  // Chapter 7: Chemical Equilibrium (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-ce-1',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Easy',
    q: 'What happens to the rates of forward and reverse reactions at dynamic chemical equilibrium?',
    options: ['Rate of forward reaction equals rate of reverse reaction', 'Rate of forward reaction becomes zero', 'Reactants are 100% converted into products', 'Both reaction rates become zero'],
    correct: 0,
    explain: 'Dynamic equilibrium is established when the rate of the forward reaction equals the rate of the reverse reaction, maintaining constant macroscopic concentrations.'
  },
  {
    id: 'tcat-chem-ce-2',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Easy',
    q: 'What is the relationship between K_p and K_c for a general gaseous reaction (where \\Delta n = moles of gaseous products - moles of gaseous reactants)?',
    options: ['K_p = K_c (RT)^{\\Delta n}', 'K_c = K_p (RT)^{\\Delta n}', 'K_p = K_c / (RT)', 'K_p = K_c'],
    correct: 0,
    explain: 'Using ideal gas relation P = CRT: K_p = K_c (RT)^{\\Delta n}.'
  },
  {
    id: 'tcat-chem-ce-3',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Medium',
    q: 'For the Haber process N2(g) + 3H2(g) <=> 2NH3(g) (\\Delta H = -92 kJ), which change will shift the equilibrium position towards the product NH3?',
    options: ['Increasing total pressure and decreasing temperature', 'Decreasing pressure and increasing temperature', 'Adding a catalyst', 'Removing N2 gas'],
    correct: 0,
    explain: 'By Le Chatelier principle: forward reaction decreases moles of gas (4 -> 2), so higher pressure favors NH3. Because it is exothermic (\\Delta H < 0), lower temperature shifts equilibrium forward.'
  },
  {
    id: 'tcat-chem-ce-4',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Medium',
    q: 'What is the pH of a 0.001 M HCl solution in pure water at 25°C?',
    options: ['3.0', '1.0', '11.0', '7.0'],
    correct: 0,
    explain: 'HCl is a strong monoprotic acid, so [H^+] = 0.001 M = 10^{-3} M. pH = -\\log[H^+] = -\\log(10^{-3}) = 3.0.'
  },
  {
    id: 'tcat-chem-ce-5',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Medium',
    q: 'Which of the following mixtures acts as an acidic buffer solution?',
    options: ['CH3COOH and CH3COONa', 'NH4OH and NH4Cl', 'HCl and NaCl', 'NaOH and CH3COONa'],
    correct: 0,
    explain: 'An acidic buffer consists of a weak acid (CH3COOH) and its conjugate base salt with a strong base (CH3COONa).'
  },
  {
    id: 'tcat-chem-ce-6',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Hard',
    q: 'What is the solubility product K_{sp} expression for a sparingly soluble salt of type AB2 (like PbCl2) with molar solubility S?',
    options: ['4 S^3', 'S^2', '27 S^4', '2 S^2'],
    correct: 0,
    explain: 'PbCl2 <=> Pb^{2+} + 2Cl^-. [Pb^{2+}] = S, [Cl^-] = 2S. K_{sp} = [Pb^{2+}][Cl^-]^2 = S · (2S)^2 = 4 S^3.'
  },
  {
    id: 'tcat-chem-ce-7',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Hard',
    q: 'For the dissociation of PCl5(g) <=> PCl3(g) + Cl2(g), if the degree of dissociation is \\alpha at total pressure P, what is K_p?',
    options: ['[\\alpha^2 / (1 - \\alpha^2)] P', '[\\alpha / (1 - \\alpha)] P', '[\\alpha^2 / (1 + \\alpha)] P', '4\\alpha^2 P'],
    correct: 0,
    explain: 'Total moles at equilibrium = (1-\\alpha) + \\alpha + \\alpha = 1 + \\alpha. Partial pressures: PCl3 = Cl2 = (\\alpha/(1+\\alpha))P, PCl5 = ((1-\\alpha)/(1+\\alpha))P. K_p = [(\\alpha/(1+\\alpha))P]^2 / [((1-\\alpha)/(1+\\alpha))P] = [\\alpha^2 / (1 - \\alpha^2)] P.'
  },

  // ==========================================
  // Chapter 8: Reaction Kinetics (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-rk-1',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Easy',
    q: 'What are the units of the rate constant k for a first-order chemical reaction?',
    options: ['s^{-1}', 'mol/(L·s)', 'L/(mol·s)', 'L^2/(mol^2·s)'],
    correct: 0,
    explain: 'For order n, unit of k is (mol/L)^{1-n} s^{-1}. For n = 1: (mol/L)^0 s^{-1} = s^{-1}.'
  },
  {
    id: 'tcat-chem-rk-2',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Easy',
    q: 'How does a positive catalyst increase the rate of a chemical reaction?',
    options: ['By providing an alternative pathway with lower activation energy', 'By increasing the kinetic energy of reacting molecules', 'By increasing reaction enthalpy \\Delta H', 'By shifting equilibrium toward products'],
    correct: 0,
    explain: 'A catalyst speeds up reactions by providing an alternative mechanism with lower activation energy (Ea), leaving equilibrium constant and \\Delta H unchanged.'
  },
  {
    id: 'tcat-chem-rk-3',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Medium',
    q: 'For a reaction with rate law Rate = k [A]^2 [B]^1, what happens to the reaction rate if concentration of A is doubled and B is halved?',
    options: ['Rate doubles (2x)', 'Rate quadruples (4x)', 'Rate remains unchanged', 'Rate increases by factor of 8'],
    correct: 0,
    explain: 'Rate\' = k [2A]^2 [0.5B] = k (4[A]^2) (0.5[B]) = 2 × k[A]^2[B] = 2 × Rate.'
  },
  {
    id: 'tcat-chem-rk-4',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Medium',
    q: 'For a first-order reaction with rate constant k = 0.0693 min^{-1}, what is the half-life t_{1/2}?',
    options: ['10 min', '100 min', '5 min', '0.693 min'],
    correct: 0,
    explain: 't_{1/2} = 0.693 / k = 0.693 / 0.0693 = 10 minutes.'
  },
  {
    id: 'tcat-chem-rk-5',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Medium',
    q: 'According to the Arrhenius equation k = A e^{-E_a / (RT)}, a plot of \\ln(k) versus 1/T yields a straight line with slope equal to:',
    options: ['-E_a / R', '-E_a / (2.303 R)', 'E_a / R', '-E_a'],
    correct: 0,
    explain: 'Taking natural log: \\ln(k) = \\ln(A) - (E_a/R)(1/T). In y = mx + c form, y = \\ln(k), x = 1/T, and slope m = -E_a / R.'
  },
  {
    id: 'tcat-chem-rk-6',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'If the rate of a chemical reaction approximately doubles for every 10°C rise in temperature, by what factor does the rate increase when temperature rises from 20°C to 60°C?',
    options: ['16 times', '8 times', '32 times', '4 times'],
    correct: 0,
    explain: '\\Delta T = 60 - 20 = 40°C. Number of 10°C intervals n = 40 / 10 = 4. Factor = 2^n = 2^4 = 16 times.'
  },
  {
    id: 'tcat-chem-rk-7',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'For a second-order reaction 2A -> Products, what is the integrated rate law relationship for [A] at time t?',
    options: ['1/[A]_t - 1/[A]_0 = kt', '\\ln[A]_t - \\ln[A]_0 = -kt', '[A]_0 - [A]_t = kt', '1/[A]_t^2 - 1/[A]_0^2 = 2kt'],
    correct: 0,
    explain: 'Integrating -d[A]/dt = k[A]^2 from 0 to t gives 1/[A]_t = 1/[A]_0 + kt => 1/[A]_t - 1/[A]_0 = kt.'
  },

  // ==========================================
  // Chapter 9: Electrochemistry (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-ec-1',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Easy',
    q: 'In any electrochemical cell, the oxidation process always occurs at the:',
    options: ['Anode', 'Cathode', 'Salt bridge', 'External potentiometer'],
    correct: 0,
    explain: 'By international convention (An Ox / Red Cat), Oxidation always takes place at the Anode, and Reduction always takes place at the Cathode.'
  },
  {
    id: 'tcat-chem-ec-2',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Easy',
    q: 'What is the standard reduction potential assigned to the Standard Hydrogen Electrode (SHE) at all temperatures?',
    options: ['0.00 V', '1.00 V', '-0.76 V', '+0.34 V'],
    correct: 0,
    explain: 'By universal thermodynamic convention, the Standard Hydrogen Electrode (2H^+ + 2e^- <=> H2) is assigned E° = 0.00 V.'
  },
  {
    id: 'tcat-chem-ec-3',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Medium',
    q: 'What is the standard cell potential E°_{cell} of the standard Daniel cell (Zn/Zn^{2+} || Cu^{2+}/Cu) where E°(Zn^{2+}/Zn) = -0.76 V and E°(Cu^{2+}/Cu) = +0.34 V?',
    options: ['+1.10 V', '+0.42 V', '-1.10 V', '+0.76 V'],
    correct: 0,
    explain: 'E°_{cell} = E°_{cathode} - E°_{anode} = +0.34 V - (-0.76 V) = +0.34 + 0.76 = +1.10 V.'
  },
  {
    id: 'tcat-chem-ec-4',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Medium',
    q: 'How many Coulombs of electric charge are carried by 1 mole of electrons (Faraday constant F)?',
    options: ['96,500 C', '1.602 × 10^{-19} C', '6.022 × 10^{23} C', '9.65 × 10^6 C'],
    correct: 0,
    explain: '1 Faraday = N_A × e = (6.022 × 10^{23}) × (1.602 × 10^{-19} C) \\approx 96,485 C \\approx 96,500 C.'
  },
  {
    id: 'tcat-chem-ec-5',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Medium',
    q: 'What mass of copper (atomic mass = 63.5 g/mol) is deposited at the cathode by passing 2 Faradays of electricity through a CuSO4 solution?',
    options: ['63.5 g', '31.75 g', '127 g', '16 g'],
    correct: 0,
    explain: 'Reduction: Cu^{2+} + 2e^- -> Cu. Depositing 1 mole (63.5 g) of Cu requires 2 moles of electrons (2 Faradays). Thus 2 Faradays deposit exactly 63.5 g of copper.'
  },
  {
    id: 'tcat-chem-ec-6',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Hard',
    q: 'What is the relationship between standard cell potential E°_{cell} and standard Gibbs free energy change \\Delta G°?',
    options: ['\\Delta G° = -n F E°_{cell}', '\\Delta G° = n F E°_{cell}', '\\Delta G° = -E°_{cell} / (n F)', '\\Delta G° = -R T \\ln(E°_{cell})'],
    correct: 0,
    explain: 'Thermodynamics defines the maximum non-PV electrical work as \\Delta G° = -w_{elec} = -n F E°_{cell}. A positive cell potential produces a spontaneous negative \\Delta G°.'
  },
  {
    id: 'tcat-chem-ec-7',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Hard',
    q: 'What is the cell potential E of a concentration cell at 298 K with two hydrogen electrodes immersed in [H^+] = 1.0 M and [H^+] = 0.01 M?',
    options: ['0.0592 V', '0.118 V', '0.00 V', '0.296 V'],
    correct: 0,
    explain: 'E = E° - (0.0592/1) \\log(10^{-2} / 1.0) = 0 - 0.0592(-2) = +0.1184 V \\approx 0.118 V.'
  },

  // ==========================================
  // Chapter 10: Periodic Classification (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-pc-1',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Easy',
    q: 'Across a period from left to right in the modern Periodic Table, atomic radius generally:',
    options: ['Decreases due to increasing effective nuclear charge', 'Increases due to added shells', 'Remains constant', 'First increases then decreases'],
    correct: 0,
    explain: 'Electrons are added to the same principal shell while nuclear charge Z increases, pulling valence electrons closer to the nucleus and decreasing atomic radius.'
  },
  {
    id: 'tcat-chem-pc-2',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Easy',
    q: 'Which element has the highest electronegativity on the Pauling scale?',
    options: ['Fluorine (F, 4.0)', 'Oxygen (O, 3.5)', 'Chlorine (Cl, 3.0)', 'Cesium (Cs, 0.79)'],
    correct: 0,
    explain: 'Fluorine is the most electronegative element with a Pauling value of 4.0.'
  },
  {
    id: 'tcat-chem-pc-3',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Easy',
    q: 'The energy required to remove the most loosely bound electron from an isolated gaseous atom in its ground state is:',
    options: ['First Ionization Energy', 'Electron Affinity', 'Electronegativity', 'Lattice Energy'],
    correct: 0,
    explain: 'Ionization energy is the energy required to remove the outermost valence electron from an isolated neutral gaseous atom.'
  },
  {
    id: 'tcat-chem-pc-4',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Medium',
    q: 'Why does Nitrogen (Z = 7) have a higher first ionization energy than Oxygen (Z = 8)?',
    options: ['Nitrogen has a stable half-filled 2p^3 subshell', 'Oxygen has smaller atomic size', 'Oxygen has greater shielding effect', 'Nitrogen is more electronegative'],
    correct: 0,
    explain: 'Nitrogen has a half-filled 2p subshell (2p_x^1 2p_y^1 2p_z^1) which confers extra exchange stability, requiring more energy to remove an electron than from Oxygen (2p^4).'
  },
  {
    id: 'tcat-chem-pc-5',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Medium',
    q: 'Which element has the highest electron affinity among all halogen elements?',
    options: ['Chlorine (Cl)', 'Fluorine (F)', 'Bromine (Br)', 'Iodine (I)'],
    correct: 0,
    explain: 'Chlorine (-349 kJ/mol) has a higher electron affinity than Fluorine (-328 kJ/mol) because the compact 2p subshell of fluorine experiences strong inter-electronic repulsion.'
  },
  {
    id: 'tcat-chem-pc-6',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Hard',
    q: 'Which of the following is an amphoteric oxide that reacts with both acids and bases?',
    options: ['Aluminum oxide (Al2O3)', 'Sodium oxide (Na2O)', 'Sulfur trioxide (SO3)', 'Magnesium oxide (MgO)'],
    correct: 0,
    explain: 'Al2O3 and ZnO are classic amphoteric oxides; Al2O3 dissolves in acids to form Al^{3+} salts and in strong alkalis to form aluminates [Al(OH)4]^-.'
  },
  {
    id: 'tcat-chem-pc-7',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Hard',
    q: 'Arrange the isoelectronic ions N^{3-}, O^{2-}, F^-, and Na^+ in order of decreasing ionic radii:',
    options: ['N^{3-} > O^{2-} > F^- > Na^+', 'Na^+ > F^- > O^{2-} > N^{3-}', 'F^- > O^{2-} > N^{3-} > Na^+', 'O^{2-} > N^{3-} > F^- > Na^+'],
    correct: 0,
    explain: 'All these ions have 10 electrons. As nuclear charge Z increases (N=7, O=8, F=9, Na=11), the electrons are drawn closer, making N^{3-} the largest and Na^+ the smallest.'
  },

  // ==========================================
  // Chapter 11: s and p Block Elements (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-sp-1',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Easy',
    q: 'Which alkali metal carbonate decomposes upon heating to form its metal oxide and carbon dioxide gas?',
    options: ['Lithium carbonate (Li2CO3)', 'Sodium carbonate (Na2CO3)', 'Potassium carbonate (K2CO3)', 'Cesium carbonate (Cs2CO3)'],
    correct: 0,
    explain: 'Due to the small size and high polarizing power of the Li^+ cation, Li2CO3 is thermally unstable and decomposes into Li2O and CO2, while other alkali carbonates are thermally stable.'
  },
  {
    id: 'tcat-chem-sp-2',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Easy',
    q: 'What is the chemical formula of Plaster of Paris?',
    options: ['CaSO4 · (1/2) H2O', 'CaSO4 · 2 H2O', 'CaSO4 · 5 H2O', 'MgSO4 · 7 H2O'],
    correct: 0,
    explain: 'Gypsum is CaSO4 · 2H2O. Heating gypsum to 100-120°C produces Plaster of Paris: calcium sulfate hemihydrate, CaSO4 · (1/2)H2O.'
  },
  {
    id: 'tcat-chem-sp-3',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Medium',
    q: 'In the Contact Process for the industrial manufacture of sulfuric acid (H2SO4), what catalyst is used to oxidize SO2 to SO3?',
    options: ['Vanadium pentoxide (V2O5)', 'Finely divided iron (Fe)', 'Nickel (Ni)', 'Copper (Cu)'],
    correct: 0,
    explain: 'V2O5 is the modern catalyst used at 450°C in the Contact Process because it resists arsenic poisoning better than platinum.'
  },
  {
    id: 'tcat-chem-sp-4',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Medium',
    q: 'Borax on strong heating swells up and fuses into a transparent glassy bead composed of:',
    options: ['Sodium metaborate (NaBO2) and boric anhydride (B2O3)', 'Boron trioxide only', 'Sodium tetraborate only', 'Sodium hydroxide and boron'],
    correct: 0,
    explain: 'Na2B4O7 · 10H2O loses water and decomposes: Na2B4O7 -> 2NaBO2 + B2O3. This mixture forms the borax bead.'
  },
  {
    id: 'tcat-chem-sp-5',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Medium',
    q: 'Which halogen acid is the strongest acid in aqueous solution?',
    options: ['Hydroiodic acid (HI)', 'Hydrobromic acid (HBr)', 'Hydrochloric acid (HCl)', 'Hydrofluoric acid (HF)'],
    correct: 0,
    explain: 'Acid strength increases down Group 17 (HF << HCl < HBr < HI) because H-I has the largest bond length and lowest bond dissociation energy.'
  },
  {
    id: 'tcat-chem-sp-6',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Hard',
    q: 'Why does graphite conduct electricity along its layers while diamond is an electrical insulator?',
    options: ['Graphite has sp^2 hybridized carbon atoms with delocalized pi electrons', 'Graphite is softer than diamond', 'Diamond has sp^2 hybridization', 'Graphite contains metallic impurities'],
    correct: 0,
    explain: 'In graphite, each carbon atom is sp^2 hybridized and forms 3 sigma bonds, leaving one unhybridized 2p electron per carbon delocalized across the hexagonal sheets to conduct electricity.'
  },
  {
    id: 'tcat-chem-sp-7',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Hard',
    q: 'What is the oxidation state of chlorine in perchloric acid (HClO4)?',
    options: ['+7', '+5', '+3', '+1'],
    correct: 0,
    explain: 'H (+1) + Cl (x) + 4(-2) = 0 => 1 + x - 8 = 0 => x = +7.'
  },

  // ==========================================
  // Chapter 12: Fundamental Principles of Organic Chemistry (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-fpoc-1',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Easy',
    q: 'The ability of carbon atoms to link together via strong covalent bonds to form long chains and rings is called:',
    options: ['Catenation', 'Isomerism', 'Polymerization', 'Homology'],
    correct: 0,
    explain: 'Catenation is the self-linking of carbon atoms through covalent bonds to produce open chains or cyclic ring structures.'
  },
  {
    id: 'tcat-chem-fpoc-2',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Easy',
    q: 'Compounds having the same molecular formula but different functional groups belong to which isomerism?',
    options: ['Functional group isomerism', 'Position isomerism', 'Chain isomerism', 'Metamerism'],
    correct: 0,
    explain: 'Functional group isomerism occurs when compounds have identical formulas but different functional groups (e.g., ethanol CH3CH2OH and dimethyl ether CH3OCH3).'
  },
  {
    id: 'tcat-chem-fpoc-3',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Medium',
    q: 'What type of hybridization is present in the carbon atoms of Ethyne (Acetylene, HC≡CH)?',
    options: ['sp hybridization (Linear, 180°)', 'sp^2 hybridization', 'sp^3 hybridization', 'dsp^2 hybridization'],
    correct: 0,
    explain: 'Each carbon in ethyne forms 1 sigma bond with H and 1 sigma bond with C (using sp hybrid orbitals), plus 2 pi bonds from unhybridized 2p orbitals, resulting in linear geometry.'
  },
  {
    id: 'tcat-chem-fpoc-4',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Medium',
    q: 'Which of the following compounds exhibits geometrical (cis-trans) isomerism?',
    options: ['2-Butene (CH3-CH=CH-CH3)', '1-Butene (CH2=CH-CH2-CH3)', 'Propene (CH2=CH-CH3)', '2-Methylpropene ((CH3)2C=CH2)'],
    correct: 0,
    explain: 'Geometrical isomerism requires restricted rotation about C=C where each alkene carbon bears two different substituents. In 2-butene, each double-bonded carbon is bonded to -H and -CH3.'
  },
  {
    id: 'tcat-chem-fpoc-5',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Medium',
    q: 'A carbon atom bonded to four different atoms or groups is known as a:',
    options: ['Chiral (asymmetric) carbon', 'Primary carbon', 'Anomeric carbon', 'Carbocation'],
    correct: 0,
    explain: 'A tetrahedral carbon bonded to four distinct substituents is chiral (asymmetric) and produces optical activity.'
  },
  {
    id: 'tcat-chem-fpoc-6',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Hard',
    q: 'According to Huckel Rule of Aromaticity, a planar, cyclic, fully conjugated molecule is aromatic if it contains:',
    options: ['(4n + 2) \\pi electrons, where n is a non-negative integer', '4n \\pi electrons', '(2n + 2) \\pi electrons', '6n \\pi electrons'],
    correct: 0,
    explain: 'Huckel Rule requires (4n + 2) delocalized \\pi electrons (e.g., n=0 -> 2, n=1 -> 6 for benzene, n=2 -> 10 for naphthalene).'
  },
  {
    id: 'tcat-chem-fpoc-7',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Hard',
    q: 'The unequal distribution of carbon atoms on either side of a divalent functional group (such as -O- in ethers) gives rise to:',
    options: ['Metamerism', 'Tautomerism', 'Position isomerism', 'Geometric isomerism'],
    correct: 0,
    explain: 'Metamerism arises due to the presence of unequal alkyl groups attached to the same polyvalent functional group (e.g., diethyl ether vs methyl propyl ether).'
  },

  // ==========================================
  // Chapter 13: Hydrocarbons (8 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-hc-1',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Easy',
    q: 'What is the characteristic type of reaction undergone by alkanes (saturated hydrocarbons)?',
    options: ['Free-radical substitution reactions', 'Electrophilic addition reactions', 'Nucleophilic substitution reactions', 'Elimination reactions'],
    correct: 0,
    explain: 'Alkanes are inert toward ionic reagents due to stable C-C and C-H sigma bonds, undergoing free-radical substitution reactions in the presence of UV light.'
  },
  {
    id: 'tcat-chem-hc-2',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Easy',
    q: 'According to Markovnikov Rule, when an unsymmetrical reagent like HBr adds to an unsymmetrical alkene, the hydrogen atom attaches to:',
    options: ['The double-bonded carbon holding the greater number of hydrogen atoms', 'The double-bonded carbon holding fewer hydrogen atoms', 'Either carbon with equal probability', 'The central carbon atom always'],
    correct: 0,
    explain: 'Markovnikov Rule states that the positive part of the reagent (H^+) adds to the carbon atom of the C=C bond that already has more hydrogens, forming the more stable carbocation.'
  },
  {
    id: 'tcat-chem-hc-3',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Easy',
    q: 'What is the resonance energy of Benzene (C6H6)?',
    options: ['150.5 kJ/mol (36 kcal/mol)', '358 kJ/mol', '208 kJ/mol', '50 kJ/mol'],
    correct: 0,
    explain: 'The actual heat of hydrogenation of benzene is 208 kJ/mol, which is 150.5 kJ/mol less than the theoretical value for cyclohexatriene (358.5 kJ/mol), representing its resonance stabilization energy.'
  },
  {
    id: 'tcat-chem-hc-4',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Medium',
    q: 'In the halogenation of benzene (e.g., chlorination), what electrophile is generated using anhydrous AlCl3 catalyst?',
    options: ['Chloronium ion (Cl^+)', 'Chloride ion (Cl^-)', 'Chlorine free radical (Cl^•)', 'AlCl4^- ion'],
    correct: 0,
    explain: 'AlCl3 acts as a Lewis acid and abstracts a chloride ion: Cl2 + AlCl3 -> Cl^+ + AlCl4^-. The electrophile is the chloronium ion Cl^+.'
  },
  {
    id: 'tcat-chem-hc-5',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Medium',
    q: 'What is the major product obtained when propene reacts with HBr in the presence of organic peroxides (Peroxide Effect)?',
    options: ['1-Bromopropane (Anti-Markovnikov addition)', '2-Bromopropane', '1,2-Dibromopropane', 'Propane'],
    correct: 0,
    explain: 'In the presence of peroxides, HBr adds via a free-radical mechanism giving Anti-Markovnikov addition where the bromine radical adds to C-1, yielding 1-bromopropane.'
  },
  {
    id: 'tcat-chem-hc-6',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Medium',
    q: 'Which test reagent is used to distinguish terminal alkynes (e.g., ethyne) from alkenes and internal alkynes?',
    options: ['Ammoniacal cuprous chloride (Cu2Cl2 + NH4OH)', 'Bromine water in CCl4', 'Baeyer reagent (cold dilute alkaline KMnO4)', 'Lucas reagent'],
    correct: 0,
    explain: 'Terminal alkynes contain acidic acetylenic hydrogen which reacts with ammoniacal Cu2Cl2 to precipitate red copper acetylide Cu2C2.'
  },
  {
    id: 'tcat-chem-hc-7',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Hard',
    q: 'What are the products formed upon reductive ozonolysis (O3 followed by Zn / H2O) of 2-butene (CH3-CH=CH-CH3)?',
    options: ['2 molecules of Acetaldehyde (CH3CHO)', '1 molecule of Formaldehyde and 1 of Acetone', '2 molecules of Acetic acid', 'Butanoic acid'],
    correct: 0,
    explain: 'Reductive ozonolysis cleaves the C=C double bond symmetrically, converting both ends (=CH-CH3) into acetaldehyde: CH3CHO + CH3CHO.'
  },

  // ==========================================
  // Chapter 14: Chemistry of Life (7 MCQs)
  // ==========================================
  {
    id: 'tcat-chem-col-1',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Easy',
    q: 'Proteins are biopolymers composed of monomer units linked together by peptide bonds. What are these monomer units?',
    options: ['alpha-Amino acids', 'Fatty acids', 'Nucleotides', 'Monosaccharides'],
    correct: 0,
    explain: 'Proteins are polyamides composed of \\alpha-amino acids joined by peptide linkages (-CO-NH-).'
  },
  {
    id: 'tcat-chem-col-2',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Easy',
    q: 'Which nitrogenous base is found in RNA but NOT in DNA?',
    options: ['Uracil', 'Thymine', 'Cytosine', 'Guanine'],
    correct: 0,
    explain: 'RNA contains Uracil (U) in place of the Thymine (T) present in DNA.'
  },
  {
    id: 'tcat-chem-col-3',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Easy',
    q: 'An amino acid in aqueous solution exists predominantly as a dipolar ion containing both positive and negative charges, known as a:',
    options: ['Zwitterion', 'Carbocation', 'Chelate ion', 'Micelle'],
    correct: 0,
    explain: 'At neutral physiological pH, the acidic -COOH group transfers a proton to the basic -NH2 group, forming a dipolar Zwitterion (H3N^+-CHR-COO^-).'
  },
  {
    id: 'tcat-chem-col-4',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Medium',
    q: 'What is the complementary base pairing rule in double-stranded DNA?',
    options: ['Adenine pairs with Thymine (A=T) and Guanine pairs with Cytosine (G≡C)', 'Adenine pairs with Guanine and Thymine with Cytosine', 'Adenine pairs with Cytosine and Guanine with Thymine', 'Uracil pairs with Adenine'],
    correct: 0,
    explain: 'Watson-Crick base pairing specifies that Adenine forms 2 hydrogen bonds with Thymine (A=T), and Guanine forms 3 hydrogen bonds with Cytosine (G≡C).'
  },
  {
    id: 'tcat-chem-col-5',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Medium',
    q: 'Which vitamin is water-soluble and must be regularly supplied in the human diet?',
    options: ['Vitamin C (Ascorbic acid)', 'Vitamin A', 'Vitamin D', 'Vitamin K'],
    correct: 0,
    explain: 'Vitamins B-complex and C are water-soluble and readily excreted in urine, while vitamins A, D, E, and K are fat-soluble.'
  },
  {
    id: 'tcat-chem-col-6',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Hard',
    q: 'In enzyme kinetics, what does the Michaelis constant K_m represent?',
    options: ['The substrate concentration at which reaction rate is half of maximum velocity (V_max / 2)', 'The maximum velocity achievable by the enzyme', 'The equilibrium constant of enzyme denaturation', 'The turnover number k_cat'],
    correct: 0,
    explain: 'K_m is the substrate concentration [S] at which the enzymatic reaction rate v = V_max / 2. A smaller K_m indicates higher enzyme-substrate affinity.'
  },
  {
    id: 'tcat-chem-col-7',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Hard',
    q: 'What type of chemical linkage connects monosaccharide units together in polysaccharides like glycogen and starch?',
    options: ['Glycosidic bond', 'Peptide bond', 'Phosphodiester bond', 'Ester linkage'],
    correct: 0,
    explain: 'Monosaccharide units in carbohydrates are covalently linked by glycosidic acetal linkages (-C-O-C-).'
  }
];

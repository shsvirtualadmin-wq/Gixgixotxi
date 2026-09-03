import { Question } from '../src/types';

export const BATCH2_CHEMISTRY: Question[] = [
  // =========================================================
  // Chapter 1: Basic Concepts of Chemistry (7 MCQs: 3 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-bc-9',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Easy',
    q: 'The mass of one unified atomic mass unit (1 amu or 1 Da) in grams is approximately:',
    options: ['1.66 x 10^(-24) g', '6.02 x 10^(-23) g', '1.66 x 10^(-27) g', '9.11 x 10^(-28) g'],
    correct: 0,
    explain: '1 amu is defined as 1/12th the mass of a carbon-12 atom = 1 / (6.022 x 10^23) g = 1.66 x 10^(-24) g.'
  },
  {
    id: 'tcat-chem-bc-10',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Easy',
    q: 'What is the percentage by mass of oxygen in pure water (H2O, molar mass = 18 g/mol)?',
    options: ['88.89%', '11.11%', '50.0%', '75.0%'],
    correct: 0,
    explain: '% O = (16 / 18) * 100% = 88.89%.'
  },
  {
    id: 'tcat-chem-bc-11',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Easy',
    q: 'How many atoms are present in one molecule of sulfuric acid (H2SO4)?',
    options: ['7', '6', '5', '4'],
    correct: 0,
    explain: 'H2SO4 consists of 2 Hydrogen atoms + 1 Sulfur atom + 4 Oxygen atoms = 7 total atoms.'
  },
  {
    id: 'tcat-chem-bc-12',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Medium',
    q: 'What is the volume occupied by 3.2 g of methane gas (CH4, molar mass = 16 g/mol) at STP?',
    options: ['4.48 dm^3', '22.4 dm^3', '2.24 dm^3', '11.2 dm^3'],
    correct: 0,
    explain: 'Moles of CH4 = 3.2 / 16 = 0.2 mol. Volume at STP = 0.2 * 22.4 dm^3 = 4.48 dm^3.'
  },
  {
    id: 'tcat-chem-bc-13',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Medium',
    q: 'The empirical formula of glucose is CH2O. If its experimental molar mass is 180 g/mol, what is its molecular formula?',
    options: ['C6H12O6', 'C3H6O3', 'C12H22O11', 'C2H4O2'],
    correct: 0,
    explain: 'Empirical formula mass = 12 + 2 + 16 = 30 g/mol. n = 180 / 30 = 6. Molecular formula = (CH2O)6 = C6H12O6.'
  },
  {
    id: 'tcat-chem-bc-14',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Hard',
    q: 'If 4.0 g of H2 reacts with 32.0 g of O2 to produce water (2H2 + O2 -> 2H2O), what is the maximum theoretical mass of water formed?',
    options: ['36.0 g', '18.0 g', '72.0 g', '32.0 g'],
    correct: 0,
    explain: 'Moles of H2 = 4/2 = 2 mol. Moles of O2 = 32/32 = 1 mol. Exactly 2 moles H2 react with 1 mole O2 to form 2 moles H2O = 2 * 18 = 36.0 g.'
  },
  {
    id: 'tcat-chem-bc-15',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    difficulty: 'Hard',
    q: 'The actual yield of a reaction is 45 g, while the stoichiometric theoretical yield is 50 g. What is the percentage yield?',
    options: ['90%', '85%', '95%', '80%'],
    correct: 0,
    explain: '% yield = (Actual yield / Theoretical yield) * 100% = (45 / 50) * 100% = 90%.'
  },

  // =========================================================
  // Chapter 2: Experimental Techniques (7 MCQs: 3 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-et-8',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Easy',
    q: 'The technique used to separate insoluble solid impurities from a liquid solution through a porous medium is:',
    options: ['Filtration', 'Sublimation', 'Chromatography', 'Distillation'],
    correct: 0,
    explain: 'Filtration separates insoluble solids from liquids using filter paper or a Gooch crucible.'
  },
  {
    id: 'tcat-chem-et-9',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Easy',
    q: 'The process of purifying a solid chemical substance by dissolving it in a suitable hot solvent and allowing it to cool slowly is:',
    options: ['Crystallization', 'Condensation', 'Sedimentation', 'Decantation'],
    correct: 0,
    explain: 'Crystallization is the standard laboratory technique to purify impure solids from hot saturated solutions.'
  },
  {
    id: 'tcat-chem-et-10',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Easy',
    q: 'A Gooch crucible with an asbestos mat is particularly advantageous over ordinary filter paper because it allows:',
    options: [
      'Filtration under reduced pressure (suction) and high temperature drying',
      'Direct sublimation of the solution',
      'Fractional crystallization',
      'Separation of miscible organic liquids'
    ],
    correct: 0,
    explain: 'Gooch crucibles can be used with a suction pump and ignited at high temperatures without burning.'
  },
  {
    id: 'tcat-chem-et-11',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Medium',
    q: 'Which of the following organic compounds sublimates directly from solid to vapor without melting upon heating?',
    options: ['Naphthalene', 'Sodium chloride', 'Glucose', 'Urea'],
    correct: 0,
    explain: 'Naphthalene, benzoic acid, iodine, and ammonium chloride sublime directly on heating.'
  },
  {
    id: 'tcat-chem-et-12',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Medium',
    q: 'In solvent extraction, the efficiency of extracting a solute from water is maximized by:',
    options: [
      'Using multiple extractions with smaller portions of organic solvent',
      'Using a single extraction with the entire volume of solvent',
      'Boiling the mixture violently',
      'Freezing the aqueous solution solid'
    ],
    correct: 0,
    explain: 'Repeated extractions using smaller solvent volumes extract significantly more solute than a single large volume.'
  },
  {
    id: 'tcat-chem-et-13',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Hard',
    q: 'In thin layer chromatography (TLC), the retardation factor (R_f) value of any component is always:',
    options: ['Between 0 and 1', 'Greater than 1', 'Less than 0', 'Constant at 1.0'],
    correct: 0,
    explain: 'R_f = distance moved by solute / distance moved by solvent front. Since solute never moves ahead of the front, 0 <= R_f <= 1.'
  },
  {
    id: 'tcat-chem-et-14',
    subject: 'Chemistry',
    topic: 'Experimental Techniques',
    difficulty: 'Hard',
    q: 'What is the role of activated animal charcoal during crystallization of an organic compound?',
    options: [
      'To decolorize the solution by adsorbing colored resinous impurities',
      'To increase the solubility of the product',
      'To act as a catalyst for crystal nucleation',
      'To neutralize basic impurities'
    ],
    correct: 0,
    explain: 'Finely divided animal charcoal has high surface area that strongly adsorbs colored impurities from boiling solutions.'
  },

  // =========================================================
  // Chapter 3: Gases, Liquids and Solids (7 MCQs: 2 Easy, 2 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-chem-gls-9',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Easy',
    q: 'Charles\'s Law states that at constant pressure, the volume of a given mass of gas is directly proportional to its:',
    options: ['Absolute temperature (in Kelvin)', 'Celsius temperature', 'Density', 'Atmospheric pressure'],
    correct: 0,
    explain: 'Charles\'s Law: V proportional to T (where T is absolute temperature in Kelvin).'
  },
  {
    id: 'tcat-chem-gls-10',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Easy',
    q: 'What is the value of the universal gas constant R in SI units (J / (mol K))?',
    options: ['8.314 J / (mol K)', '0.0821 atm L / (mol K)', '1.987 cal / (mol K)', '62.4 mm Hg L / (mol K)'],
    correct: 0,
    explain: 'In SI units (Pa m^3 / (mol K) or J / (mol K)), R = 8.314 J / (mol K).'
  },
  {
    id: 'tcat-chem-gls-11',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Medium',
    q: 'Why do real gases show maximum deviation from ideal behavior?',
    options: [
      'At high pressure and low temperature',
      'At low pressure and high temperature',
      'At standard temperature and pressure',
      'At high temperature and moderate pressure'
    ],
    correct: 0,
    explain: 'At high pressure (molecules close together) and low temperature (low kinetic energy), intermolecular attractions and finite molecular volume become significant.'
  },
  {
    id: 'tcat-chem-gls-12',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Medium',
    q: 'In the liquid state, the resistance offered by a liquid to its laminar flow is known as:',
    options: ['Viscosity', 'Surface tension', 'Vapor pressure', 'Capillarity'],
    correct: 0,
    explain: 'Viscosity is internal fluid friction that resists shearing and laminar flow.'
  },
  {
    id: 'tcat-chem-gls-13',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Hard',
    q: 'According to Graham\'s Law of Diffusion, what is the ratio of diffusion rate of Hydrogen gas (H2, M = 2) to Oxygen gas (O2, M = 32)?',
    options: ['4 : 1', '16 : 1', '2 : 1', '1 : 4'],
    correct: 0,
    explain: 'r(H2) / r(O2) = sqrt(M(O2) / M(H2)) = sqrt(32 / 2) = sqrt(16) = 4.'
  },
  {
    id: 'tcat-chem-gls-14',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Hard',
    q: 'In a Face-Centered Cubic (FCC) unit cell, how many total equivalent atoms are contained within one unit cell?',
    options: ['4', '2', '1', '6'],
    correct: 0,
    explain: '8 corner atoms * (1/8) + 6 face-centered atoms * (1/2) = 1 + 3 = 4 atoms.'
  },
  {
    id: 'tcat-chem-gls-15',
    subject: 'Chemistry',
    topic: 'Gases, Liquids and Solids',
    difficulty: 'Hard',
    q: 'In Van der Waals equation of state, the correction factor \'b\' represents the effect of:',
    options: [
      'Finite effective volume of gas molecules',
      'Intermolecular attractive forces',
      'Elasticity of molecular collisions',
      'Ionization energy of the gas'
    ],
    correct: 0,
    explain: '\'b\' is the effective excluded volume per mole (co-volume), accounting for the finite physical size of molecules.'
  },

  // =========================================================
  // Chapter 4: Atomic Structure (7 MCQs: 2 Easy, 2 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-chem-as-8',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Easy',
    q: 'Cathode rays emitted in a discharge tube consist of a stream of negatively charged particles known as:',
    options: ['Electrons', 'Protons', 'Alpha particles', 'Neutrons'],
    correct: 0,
    explain: 'J.J. Thomson demonstrated in 1897 that cathode rays are streams of fast-moving electrons.'
  },
  {
    id: 'tcat-chem-as-9',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Easy',
    q: 'What is the maximum number of electrons that can be accommodated in a d-subshell (l = 2)?',
    options: ['10', '6', '14', '2'],
    correct: 0,
    explain: 'A d-subshell has 2l + 1 = 5 orbitals, each holding up to 2 electrons, giving 5 * 2 = 10 electrons.'
  },
  {
    id: 'tcat-chem-as-10',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Medium',
    q: 'Which quantum number determines the spatial orientation of an atomic orbital in a magnetic field?',
    options: ['Magnetic quantum number (m_l)', 'Principal quantum number (n)', 'Azimuthal quantum number (l)', 'Spin quantum number (m_s)'],
    correct: 0,
    explain: 'The magnetic quantum number m_l designates the 3D orientation of the orbital in space.'
  },
  {
    id: 'tcat-chem-as-11',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Medium',
    q: 'What is the total number of orbitals present in the 3rd principal energy level (n = 3)?',
    options: ['9', '3', '6', '18'],
    correct: 0,
    explain: 'Total orbitals in shell n is n^2. For n = 3, n^2 = 3^2 = 9 (one 3s, three 3p, five 3d).'
  },
  {
    id: 'tcat-chem-as-12',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Hard',
    q: 'According to the Aufbau principle, which of the following atomic orbitals fills first with lower energy?',
    options: ['4s (n + l = 4)', '3d (n + l = 5)', '4p (n + l = 5)', '4d (n + l = 6)'],
    correct: 0,
    explain: 'For 4s, n + l = 4 + 0 = 4. For 3d, n + l = 3 + 2 = 5. Orbitals with lower (n + l) fill first, so 4s fills before 3d.'
  },
  {
    id: 'tcat-chem-as-13',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Hard',
    q: 'What is the de Broglie wavelength of an electron (mass = 9.1 x 10^(-31) kg) moving at 1.0 x 10^6 m/s (h = 6.63 x 10^(-34) J s)?',
    options: ['7.28 x 10^(-10) m', '3.64 x 10^(-10) m', '1.05 x 10^(-9) m', '5.45 x 10^(-11) m'],
    correct: 0,
    explain: 'lambda = h / (m*v) = (6.63 x 10^(-34)) / (9.1 x 10^(-31) * 1.0 x 10^6) = 7.28 x 10^(-10) m.'
  },
  {
    id: 'tcat-chem-as-14',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Hard',
    q: 'How many radial (spherical) nodes are present in a 3p atomic orbital?',
    options: ['1', '0', '2', '3'],
    correct: 0,
    explain: 'Number of radial nodes = n - l - 1. For 3p, n = 3 and l = 1, so radial nodes = 3 - 1 - 1 = 1.'
  },

  // =========================================================
  // Chapter 5: Chemical Bonding (8 MCQs: 2 Easy, 2 Med, 4 Hard)
  // =========================================================
  {
    id: 'tcat-chem-cb-8',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Easy',
    q: 'Which type of chemical bond is formed by the electrostatic attraction between oppositely charged ions?',
    options: ['Ionic bond (electrovalent bond)', 'Covalent bond', 'Coordinate covalent bond', 'Hydrogen bond'],
    correct: 0,
    explain: 'An ionic bond results from the complete transfer of electrons between atoms forming electrostatic attractions between cations and anions.'
  },
  {
    id: 'tcat-chem-cb-9',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Easy',
    q: 'What is the molecular geometry of methane (CH4) according to VSEPR theory?',
    options: ['Tetrahedral', 'Trigonal planar', 'Linear', 'Square planar'],
    correct: 0,
    explain: 'Methane has 4 bonding electron pairs and 0 lone pairs around carbon, adopting a tetrahedral geometry with bond angle 109.5°.'
  },
  {
    id: 'tcat-chem-cb-10',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Medium',
    q: 'What is the bond angle in ammonia (NH3) molecule?',
    options: ['107.5°', '109.5°', '104.5°', '120°'],
    correct: 0,
    explain: 'The lone pair on nitrogen repels the 3 bonding pairs more strongly than bond-bond pairs, compressing the tetrahedral angle from 109.5° to 107.5°.'
  },
  {
    id: 'tcat-chem-cb-11',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Medium',
    q: 'How many sigma (sigma) and pi (pi) bonds are present in an ethyne (acetylene, C2H2) molecule?',
    options: ['3 sigma and 2 pi bonds', '2 sigma and 3 pi bonds', '4 sigma and 1 pi bond', '5 sigma and 0 pi bonds'],
    correct: 0,
    explain: 'H-C#C-H has two C-H single bonds (2 sigma) and one C#C triple bond (1 sigma + 2 pi), totaling 3 sigma and 2 pi bonds.'
  },
  {
    id: 'tcat-chem-cb-12',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Hard',
    q: 'According to Molecular Orbital Theory (MOT), what is the bond order and magnetic nature of the Nitrogen molecule (N2)?',
    options: ['Bond order = 3, Diamagnetic', 'Bond order = 2.5, Paramagnetic', 'Bond order = 2, Diamagnetic', 'Bond order = 3, Paramagnetic'],
    correct: 0,
    explain: 'N2 has 10 valence electrons: (8 bonding - 2 antibonding)/2 = 3. Since all electrons are paired, it is diamagnetic.'
  },
  {
    id: 'tcat-chem-cb-13',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Hard',
    q: 'What is the hybridization and shape of Phosphorus Pentachloride (PCl5) in the gaseous state?',
    options: ['sp3d hybridization, Trigonal bipyramidal', 'sp3d2 hybridization, Octahedral', 'sp3 hybridization, Tetrahedral', 'dsp2 hybridization, Square planar'],
    correct: 0,
    explain: 'Phosphorus has 5 bonding pairs and 0 lone pairs: sp3d hybridization with trigonal bipyramidal geometry.'
  },
  {
    id: 'tcat-chem-cb-14',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Hard',
    q: 'Why does Carbon Dioxide (CO2) have a zero dipole moment (mu = 0 D) despite possessing polar C=O bonds?',
    options: [
      'It has a linear symmetric geometry where opposing bond dipole moments cancel out',
      'Carbon and oxygen have identical electronegativity',
      'The bond angle is 120°',
      'Oxygen atoms possess no lone pairs'
    ],
    correct: 0,
    explain: 'CO2 is linear (O=C=O, bond angle 180°). The two equal and oppositely directed C=O dipole vectors cancel completely.'
  },
  {
    id: 'tcat-chem-cb-15',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Hard',
    q: 'Which molecule has a square pyramidal geometry?',
    options: ['Bromine pentafluoride (BrF5)', 'Sulfur hexafluoride (SF6)', 'Xenon tetrafluoride (XeF4)', 'Phosphorus pentachloride (PCl5)'],
    correct: 0,
    explain: 'BrF5 has 5 bonding pairs and 1 lone pair on Bromine (sp3d2 hybridization), giving a square pyramidal geometry.'
  },

  // =========================================================
  // Chapter 6: Thermochemistry (7 MCQs: 2 Easy, 2 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-chem-tc-8',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Easy',
    q: 'A thermodynamic property whose value depends only on the initial and final states of the system and not on the path followed is called a:',
    options: ['State function', 'Path function', 'Extensive property only', 'Kinetic variable'],
    correct: 0,
    explain: 'Enthalpy (H), internal energy (U), entropy (S), and free energy (G) are state functions.'
  },
  {
    id: 'tcat-chem-tc-9',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Easy',
    q: 'In an endothermic reaction at constant pressure, which condition holds true?',
    options: ['Delta H > 0 (enthalpy increases)', 'Delta H < 0 (heat is evolved)', 'Delta H = 0', 'Temperature of surroundings rises'],
    correct: 0,
    explain: 'Endothermic reactions absorb heat from surroundings, meaning Delta H is positive (Delta H > 0).'
  },
  {
    id: 'tcat-chem-tc-10',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Medium',
    q: 'What is the relationship between heat absorbed at constant pressure (q_p) and change in enthalpy (Delta H)?',
    options: ['Delta H = q_p', 'Delta U = q_p', 'Delta H = q_v', 'Delta H = q_p - w'],
    correct: 0,
    explain: 'By definition of enthalpy H = U + PV, the heat absorbed at constant pressure is q_p = Delta H.'
  },
  {
    id: 'tcat-chem-tc-11',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Medium',
    q: 'What is the standard enthalpy of combustion (Delta H°_c) of carbon to form carbon dioxide CO2(g)?',
    options: ['-393.5 kJ/mol', '+393.5 kJ/mol', '-110.5 kJ/mol', '-285.8 kJ/mol'],
    correct: 0,
    explain: 'C(graphite) + O2(g) -> CO2(g) releases 393.5 kJ/mol (Delta H = -393.5 kJ/mol).'
  },
  {
    id: 'tcat-chem-tc-12',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Hard',
    q: 'A bomb calorimeter measures the heat of reaction at:',
    options: ['Constant volume (q_v = Delta U)', 'Constant pressure (q_p = Delta H)', 'Constant temperature only', 'Adiabatic zero enthalpy'],
    correct: 0,
    explain: 'A bomb calorimeter is a rigid steel container (volume is constant, dV = 0), so work done is zero and heat evolved equals Delta U.'
  },
  {
    id: 'tcat-chem-tc-13',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Hard',
    q: 'Given: H2(g) + (1/2)O2(g) -> H2O(l) (Delta H = -286 kJ/mol). What is the enthalpy change for decomposing 2 moles of liquid water into H2 and O2?',
    options: ['+572 kJ', '-572 kJ', '+286 kJ', '-286 kJ'],
    correct: 0,
    explain: 'Reversing the equation and multiplying by 2 reverses the sign and doubles the value: 2 * (+286) = +572 kJ.'
  },
  {
    id: 'tcat-chem-tc-14',
    subject: 'Chemistry',
    topic: 'Thermochemistry',
    difficulty: 'Hard',
    q: 'Lattice energy of an ionic crystal NaCl is defined as the enthalpy change when:',
    options: [
      'One mole of ionic solid is formed from its constituent gaseous ions',
      'One mole of crystal dissolves in water',
      'Solid sodium reacts with chlorine gas',
      'One mole of solid melts at its melting point'
    ],
    correct: 0,
    explain: 'Lattice energy is the energy released when one mole of an ionic crystalline solid is formed from gaseous ions: Na+(g) + Cl-(g) -> NaCl(s).'
  },

  // =========================================================
  // Chapter 7: Chemical Equilibrium (7 MCQs: 2 Easy, 2 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-chem-ce-8',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Easy',
    q: 'A chemical reaction that proceeds in both forward and reverse directions under the same set of conditions is called a:',
    options: ['Reversible reaction', 'Irreversible reaction', 'Combustion reaction', 'Precipitation reaction'],
    correct: 0,
    explain: 'Reversible reactions establish a dynamic equilibrium where reactants and products form continuously.'
  },
  {
    id: 'tcat-chem-ce-9',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Easy',
    q: 'What is the mathematical definition of pH in aqueous solutions?',
    options: ['-log[H+]', 'log[H+]', '-ln[OH-]', '1 / [H+]'],
    correct: 0,
    explain: 'Sørensen defined pH = -log10[H+].'
  },
  {
    id: 'tcat-chem-ce-10',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Medium',
    q: 'According to Le Chatelier\'s principle, what will happen to the equilibrium N2O4(g) <=> 2NO2(g) (Delta H > 0) if temperature is increased?',
    options: [
      'Shifts forward, producing more dark brown NO2',
      'Shifts reverse, producing more colorless N2O4',
      'Has no effect on equilibrium composition',
      'Reaction stops completely'
    ],
    correct: 0,
    explain: 'Since forward reaction is endothermic (Delta H > 0), increasing temperature favors the forward direction according to Le Chatelier\'s principle.'
  },
  {
    id: 'tcat-chem-ce-11',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Medium',
    q: 'What is the pH of pure neutral water at 25°C where K_w = 1.0 x 10^(-14)?',
    options: ['7.0', '14.0', '1.0', '0.0'],
    correct: 0,
    explain: '[H+] = sqrt(1.0 x 10^(-14)) = 1.0 x 10^(-7) M. pH = -log(10^(-7)) = 7.0.'
  },
  {
    id: 'tcat-chem-ce-12',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Hard',
    q: 'For the gaseous synthesis of ammonia: N2(g) + 3H2(g) <=> 2NH3(g), what is the relationship between K_p and K_c?',
    options: ['K_p = K_c * (RT)^(-2)', 'K_p = K_c * (RT)^2', 'K_p = K_c', 'K_p = K_c * (RT)^(-1)'],
    correct: 0,
    explain: 'Delta n_g = moles of gaseous product - moles of gaseous reactant = 2 - (1 + 3) = -2. K_p = K_c * (RT)^(Delta n_g) = K_c * (RT)^(-2).'
  },
  {
    id: 'tcat-chem-ce-13',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Hard',
    q: 'The common ion effect describes the:',
    options: [
      'Suppression of ionization of a weak electrolyte by adding a strong electrolyte containing a common ion',
      'Increase in solubility of a salt due to ionic strength',
      'Complete precipitation of all dissolved ions',
      'Neutralization of acidic and basic solutions'
    ],
    correct: 0,
    explain: 'Adding a common ion shifts the dissociation equilibrium backward, suppressing ionization of the weak electrolyte.'
  },
  {
    id: 'tcat-chem-ce-14',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    difficulty: 'Hard',
    q: 'What is the Henderson-Hasselbalch equation for calculating the pH of an acidic buffer solution?',
    options: [
      'pH = pK_a + log([Salt] / [Acid])',
      'pH = pK_a - log([Salt] / [Acid])',
      'pH = pK_w + log([Acid] / [Salt])',
      'pH = pK_b + log([Base] / [Salt])'
    ],
    correct: 0,
    explain: 'The Henderson-Hasselbalch equation for an acidic buffer is pH = pK_a + log([Conjugate Base] / [Acid]).'
  },

  // =========================================================
  // Chapter 8: Reaction Kinetics (7 MCQs: 2 Easy, 1 Med, 4 Hard)
  // =========================================================
  {
    id: 'tcat-chem-rk-8',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Easy',
    q: 'What are the units of reaction rate in solution phase?',
    options: ['mol dm^(-3) s^(-1)', 'mol dm^(-3)', 's^(-1)', 'dm^3 mol^(-1) s^(-1)'],
    correct: 0,
    explain: 'Reaction rate is change in concentration per unit time: (mol/dm^3) / s = mol dm^(-3) s^(-1).'
  },
  {
    id: 'tcat-chem-rk-9',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Easy',
    q: 'A substance that accelerates the rate of a chemical reaction without undergoing any permanent chemical change itself is a:',
    options: ['Catalyst', 'Inhibitor', 'Reactant', 'Intermediate'],
    correct: 0,
    explain: 'A catalyst increases reaction speed by providing an alternative pathway with lower activation energy.'
  },
  {
    id: 'tcat-chem-rk-10',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Medium',
    q: 'What is the half-life t_(1/2) formula for a radioactive decay or first-order chemical reaction with rate constant k?',
    options: ['0.693 / k', '1 / (k * [A]0)', '[A]0 / (2k)', 'k / 0.693'],
    correct: 0,
    explain: 'For first-order kinetics, t_(1/2) = ln(2) / k = 0.693 / k, independent of initial concentration.'
  },
  {
    id: 'tcat-chem-rk-11',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'What is the overall order of reaction for the rate law: Rate = k [A]^(3/2) [B]^(-1/2)?',
    options: ['1 (first order)', '2 (second order)', '0 (zero order)', '3/2'],
    correct: 0,
    explain: 'Overall order is sum of exponents: 3/2 + (-1/2) = 2/2 = 1.'
  },
  {
    id: 'tcat-chem-rk-12',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'What are the units of the rate constant k for a zero-order chemical reaction?',
    options: ['mol dm^(-3) s^(-1)', 's^(-1)', 'dm^3 mol^(-1) s^(-1)', 'dm^6 mol^(-2) s^(-1)'],
    correct: 0,
    explain: 'For zero order: Rate = k, so units of k are identical to units of rate: mol dm^(-3) s^(-1).'
  },
  {
    id: 'tcat-chem-rk-13',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'What is the slope of the linear plot of ln(k) versus 1/T according to the Arrhenius equation ln(k) = ln(A) - E_a / (RT)?',
    options: ['-E_a / R', 'E_a / R', '-E_a / (2.303*R)', '-E_a * R'],
    correct: 0,
    explain: 'In the equation y = c + mx, y = ln(k) and x = 1/T, so slope m = -E_a / R.'
  },
  {
    id: 'tcat-chem-rk-14',
    subject: 'Chemistry',
    topic: 'Reaction Kinetics',
    difficulty: 'Hard',
    q: 'In a multi-step complex reaction mechanism, which step controls and determines the overall reaction rate?',
    options: [
      'The slowest elementary step (rate-determining step)',
      'The fastest elementary step',
      'The equilibrium step',
      'The final product step'
    ],
    correct: 0,
    explain: 'The slowest step in a reaction mechanism is the bottleneck that dictates overall reaction rate (rate-determining step).'
  },

  // =========================================================
  // Chapter 9: Electrochemistry (7 MCQs: 2 Easy, 2 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-chem-ec-8',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Easy',
    q: 'In an operating electrochemical voltaic cell (such as a Daniell cell), electrons flow externally through the wire from:',
    options: ['Anode to Cathode', 'Cathode to Anode', 'Salt bridge to Solution', 'Positive to Negative terminal'],
    correct: 0,
    explain: 'Oxidation at the anode releases electrons, which flow through external circuit toward the cathode where reduction occurs.'
  },
  {
    id: 'tcat-chem-ec-9',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Easy',
    q: 'What is the function of the salt bridge containing agar-agar and KCl in a galvanic cell?',
    options: [
      'To maintain electrical neutrality between the two half-cells without mixing solutions',
      'To supply electrons directly to cathode',
      'To oxidize the metallic electrodes',
      'To increase voltage above standard emf'
    ],
    correct: 0,
    explain: 'The salt bridge provides mobile ions (K+ and Cl-) to neutralize excess charges in half-cells, completing the electrical circuit.'
  },
  {
    id: 'tcat-chem-ec-10',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Medium',
    q: 'What is the oxidation state of Manganese in Potassium Permanganate (KMnO4)?',
    options: ['+7', '+6', '+4', '+2'],
    correct: 0,
    explain: '(+1) + Mn + 4(-2) = 0 => Mn - 7 = 0 => Mn = +7.'
  },
  {
    id: 'tcat-chem-ec-11',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Medium',
    q: 'Faraday\'s First Law of Electrolysis states that the mass m of a substance deposited at an electrode is directly proportional to:',
    options: ['Quantity of electricity Q (in Coulombs) passed', 'Voltage applied across the cell', 'Volume of the electrolyte solution', 'Temperature of the solution'],
    correct: 0,
    explain: 'Faraday\'s first law: m = Z * Q = Z * I * t.'
  },
  {
    id: 'tcat-chem-ec-12',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Hard',
    q: 'What is the standard cell potential E°_cell for a cell made of Zn/Zn2+ (E°_red = -0.76 V) and Ag/Ag+ (E°_red = +0.80 V)?',
    options: ['+1.56 V', '+0.04 V', '-1.56 V', '+0.84 V'],
    correct: 0,
    explain: 'E°_cell = E°_cathode - E°_anode = +0.80 V - (-0.76 V) = +0.80 + 0.76 = +1.56 V.'
  },
  {
    id: 'tcat-chem-ec-13',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Hard',
    q: 'How many Faradays (F) of electric charge are required to electroplate 1 mole of Aluminum from Al3+ ions?',
    options: ['3 F', '1 F', '2 F', '6 F'],
    correct: 0,
    explain: 'Al3+ + 3e^- -> Al(s). Reducing 1 mole of Al3+ requires 3 moles of electrons = 3 Faradays of charge.'
  },
  {
    id: 'tcat-chem-ec-14',
    subject: 'Chemistry',
    topic: 'Electrochemistry',
    difficulty: 'Hard',
    q: 'According to the Nernst equation at 298 K, how does cell potential E change when the reaction quotient Q increases?',
    options: [
      'E decreases',
      'E increases',
      'E remains constant',
      'E immediately drops to zero'
    ],
    correct: 0,
    explain: 'Nernst equation: E = E° - (0.0591 / n) * log(Q). As Q increases, the subtracted term increases, decreasing E.'
  },

  // =========================================================
  // Chapter 10: Periodic Classification (7 MCQs: 3 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-pc-8',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Easy',
    q: 'Moseley\'s Modern Periodic Law states that properties of elements are periodic functions of their:',
    options: ['Atomic numbers (nuclear charge Z)', 'Atomic masses', 'Mass numbers', 'Density'],
    correct: 0,
    explain: 'Moseley demonstrated through X-ray spectra that atomic number Z is the fundamental organizing property of elements.'
  },
  {
    id: 'tcat-chem-pc-9',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Easy',
    q: 'Elements belonging to Group 1 (alkali metals) possess how many valence electrons in their outermost s-subshell?',
    options: ['1', '2', '7', '8'],
    correct: 0,
    explain: 'Alkali metals have valence electron configuration ns^1 (1 valence electron).'
  },
  {
    id: 'tcat-chem-pc-10',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Easy',
    q: 'Which group in the Periodic Table contains the chemically inert noble gases with complete octets?',
    options: ['Group 18 (Group 8A / Group 0)', 'Group 17 (Halogens)', 'Group 1', 'Group 2'],
    correct: 0,
    explain: 'Group 18 consists of noble gases (He, Ne, Ar, Kr, Xe, Rn) with stable ns^2 np^6 configurations.'
  },
  {
    id: 'tcat-chem-pc-11',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Medium',
    q: 'Down any group in the periodic table, atomic radii generally increase because:',
    options: [
      'New principal electron shells are added and shielding effect increases',
      'Effective nuclear charge increases dramatically',
      'Number of protons exceeds neutrons',
      'Electronegativity increases'
    ],
    correct: 0,
    explain: 'Each period adds a new electronic shell, increasing atomic size and shielding effect down a group.'
  },
  {
    id: 'tcat-chem-pc-12',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Medium',
    q: 'Why does Beryllium (Z = 4) have a higher first ionization energy than Boron (Z = 5)?',
    options: [
      'Beryllium has a completely filled 2s^2 subshell which is exceptionally stable',
      'Boron has fewer protons in its nucleus',
      'Boron has a higher electronegativity',
      'Beryllium has a larger atomic radius'
    ],
    correct: 0,
    explain: 'Be has configuration 1s^2 2s^2 with completely filled 2s subshell, while Boron (1s^2 2s^2 2p^1) easily loses its single 2p electron.'
  },
  {
    id: 'tcat-chem-pc-13',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Hard',
    q: 'Which of the following elements has the highest second ionization energy (IE2)?',
    options: ['Sodium (Na, Z = 11)', 'Magnesium (Mg, Z = 12)', 'Aluminum (Al, Z = 13)', 'Silicon (Si, Z = 14)'],
    correct: 0,
    explain: 'Sodium loses 1 electron to achieve stable neon core 1s^2 2s^2 2p^6; removing a second electron requires disrupting this noble gas core, giving huge IE2.'
  },
  {
    id: 'tcat-chem-pc-14',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    difficulty: 'Hard',
    q: 'What is the trend of metallic character across a period from left to right in the modern periodic table?',
    options: ['Decreases', 'Increases', 'Remains constant', 'First increases then decreases'],
    correct: 0,
    explain: 'Across a period, nuclear charge increases and atomic radius decreases, making it harder to lose electrons; thus metallic character decreases.'
  },

  // =========================================================
  // Chapter 11: s and p Block Elements (7 MCQs: 3 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-chem-sp-8',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Easy',
    q: 'What is the common chemical name of washing soda?',
    options: ['Sodium carbonate decahydrate (Na2CO3·10H2O)', 'Sodium bicarbonate (NaHCO3)', 'Calcium hydroxide (Ca(OH)2)', 'Sodium hydroxide (NaOH)'],
    correct: 0,
    explain: 'Washing soda is sodium carbonate decahydrate, Na2CO3·10H2O.'
  },
  {
    id: 'tcat-chem-sp-9',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Easy',
    q: 'Which element is an allotrope of carbon with a 3D giant network of covalent bonds?',
    options: ['Diamond', 'Graphite', 'Fullerene', 'Carbon black'],
    correct: 0,
    explain: 'Diamond has a 3D network where each carbon is sp3 hybridized and covalently bonded to 4 neighboring carbons.'
  },
  {
    id: 'tcat-chem-sp-10',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Easy',
    q: 'Which noble gas is used in weather balloons and deep-sea diving gas mixtures because of its non-flammability and low solubility?',
    options: ['Helium (He)', 'Argon (Ar)', 'Neon (Ne)', 'Xenon (Xe)'],
    correct: 0,
    explain: 'Helium is very light, non-reactive, and does not cause decompression sickness (bends) in deep-sea diving gas mixtures.'
  },
  {
    id: 'tcat-chem-sp-11',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Medium',
    q: 'Why does Lithium exhibit anomalous behavior compared to the other alkali metals in Group 1?',
    options: [
      'Due to its exceptionally small ionic radius and unusually high charge density',
      'Because it has high atomic mass',
      'Because it does not form halides',
      'Because it is an alkaline earth metal'
    ],
    correct: 0,
    explain: 'Lithium has small size and high polarizing power, giving its compounds significant covalent character.'
  },
  {
    id: 'tcat-chem-sp-12',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Medium',
    q: 'What is the principal catalyst used in the Ostwald process for the industrial manufacture of nitric acid (HNO3)?',
    options: ['Platinum-Rhodium gauze', 'Iron promoted with molybdenum', 'Vanadium pentoxide (V2O5)', 'Nickel catalyst'],
    correct: 0,
    explain: 'In the Ostwald process, ammonia is oxidized by atmospheric oxygen over a Pt-Rh catalyst gauze at ~800°C.'
  },
  {
    id: 'tcat-chem-sp-13',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Hard',
    q: 'Bleaching powder (CaOCl2) acts as a powerful bleaching and disinfectant agent primarily due to the liberation of:',
    options: ['Available chlorine (nascent oxygen)', 'Hydrogen gas', 'Carbon monoxide', 'Sulfur dioxide'],
    correct: 0,
    explain: 'Bleaching powder releases chlorine when treated with dilute acids or atmospheric CO2, providing nascent oxygen for bleaching.'
  },
  {
    id: 'tcat-chem-sp-14',
    subject: 'Chemistry',
    topic: 's and p Block Elements',
    difficulty: 'Hard',
    q: 'Which oxyacid of phosphorus is a monoprotic (monobasic) acid that furnishes only one ionizable H+ ion?',
    options: ['Hypophosphorous acid (H3PO2)', 'Orthophosphoric acid (H3PO4)', 'Phosphorous acid (H3PO3)', 'Pyrophosphoric acid (H4P2O7)'],
    correct: 0,
    explain: 'In H3PO2, only one hydrogen is bonded to an oxygen atom (P-OH), while the other two are bonded directly to phosphorus (P-H).'
  },

  // =========================================================
  // Chapter 12: Fundamental Principles of Organic Chemistry (7 MCQs: 2 Easy, 2 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-chem-fpoc-8',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Easy',
    q: 'The general formula for an open-chain saturated alkane containing n carbon atoms is:',
    options: ['C_n H_(2n+2)', 'C_n H_(2n)', 'C_n H_(2n-2)', 'C_n H_(2n-6)'],
    correct: 0,
    explain: 'Alkanes are saturated hydrocarbons with the general molecular formula C_n H_(2n+2).'
  },
  {
    id: 'tcat-chem-fpoc-9',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Easy',
    q: 'The functional group -OH (hydroxyl group) is characteristic of which family of organic compounds?',
    options: ['Alcohols', 'Aldehydes', 'Ketones', 'Carboxylic acids'],
    correct: 0,
    explain: 'Alcohols contain the -OH group attached to an alkyl carbon chain (R-OH).'
  },
  {
    id: 'tcat-chem-fpoc-10',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Medium',
    q: 'What type of structural isomerism is exhibited by ethanol (CH3CH2OH) and dimethyl ether (CH3OCH3)?',
    options: ['Functional group isomerism', 'Chain isomerism', 'Position isomerism', 'Metamerism'],
    correct: 0,
    explain: 'Both share the same molecular formula C2H6O but possess different functional groups (alcohol vs ether).'
  },
  {
    id: 'tcat-chem-fpoc-11',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Medium',
    q: 'The process of breaking down large high-boiling petroleum hydrocarbons into smaller, more volatile hydrocarbons by heat is called:',
    options: ['Cracking (pyrolysis)', 'Polymerization', 'Reforming', 'Isomerization'],
    correct: 0,
    explain: 'Thermal or catalytic cracking breaks long alkane chains into shorter alkanes and alkenes suitable for motor gasoline.'
  },
  {
    id: 'tcat-chem-fpoc-12',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Hard',
    q: 'How many constitutional (chain) isomers exist for the alkane pentane (C5H12)?',
    options: ['3', '2', '4', '5'],
    correct: 0,
    explain: 'Pentane has 3 constitutional isomers: n-pentane, isopentane (2-methylbutane), and neopentane (2,2-dimethylpropane).'
  },
  {
    id: 'tcat-chem-fpoc-13',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Hard',
    q: 'Which intermediate species carries an sp2 hybridized carbon with an empty unhybridized p-orbital and a positive formal charge?',
    options: ['Carbocation', 'Carbanion', 'Free radical', 'Carbene'],
    correct: 0,
    explain: 'A carbocation has 6 valence electrons around carbon, trigonal planar sp2 geometry, and a vacant p-orbital.'
  },
  {
    id: 'tcat-chem-fpoc-14',
    subject: 'Chemistry',
    topic: 'Fundamental Principles of Organic Chemistry',
    difficulty: 'Hard',
    q: 'The inductive effect in organic molecules operates through which type of bonding electrons?',
    options: ['Sigma (sigma) bonds and decreases rapidly with distance', 'Pi (pi) bonds', 'Hydrogen bonds', 'Ionic bonds'],
    correct: 0,
    explain: 'The inductive effect is the polarization of sigma bonds due to electronegativity differences, falling off rapidly beyond 3 carbon atoms.'
  },

  // =========================================================
  // Chapter 13: Hydrocarbons (8 MCQs: 2 Easy, 2 Med, 4 Hard)
  // =========================================================
  {
    id: 'tcat-chem-hc-8',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Easy',
    q: 'What is the characteristic type of reaction undergone by unsaturated alkenes and alkynes?',
    options: ['Electrophilic addition reactions', 'Electrophilic substitution reactions', 'Nucleophilic substitution reactions', 'Elimination reactions only'],
    correct: 0,
    explain: 'The electron-rich pi bond in alkenes and alkynes readily attacks electrophiles, leading to addition across the multiple bond.'
  },
  {
    id: 'tcat-chem-hc-9',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Easy',
    q: 'What is the molecular formula of benzene?',
    options: ['C6H6', 'C6H12', 'C6H14', 'C6H8'],
    correct: 0,
    explain: 'Benzene is the prototypical aromatic hydrocarbon with molecular formula C6H6.'
  },
  {
    id: 'tcat-chem-hc-10',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Medium',
    q: 'In the halogenation of alkanes (e.g., chlorination of methane) in sunlight, what is the reaction mechanism?',
    options: ['Free radical chain substitution', 'Electrophilic addition', 'Nucleophilic substitution', 'Electrophilic aromatic substitution'],
    correct: 0,
    explain: 'Photochemical chlorination proceeds through initiation (homolytic fission to Cl radicals), propagation, and termination.'
  },
  {
    id: 'tcat-chem-hc-11',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Medium',
    q: 'What reagent is used in Baeyer\'s test to detect unsaturation (carbon-carbon double or triple bonds)?',
    options: [
      'Cold alkaline dilute potassium permanganate (KMnO4) solution',
      'Acidified potassium dichromate (K2Cr2O7)',
      'Fehling\'s solution',
      'Tollens\' reagent'
    ],
    correct: 0,
    explain: 'Baeyer\'s reagent is cold dilute 1% alkaline KMnO4; alkenes decolorize the purple solution to form vicinal glycols and brown MnO2 precipitate.'
  },
  {
    id: 'tcat-chem-hc-12',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Hard',
    q: 'What is the electrophile in the nitration of benzene using a mixture of concentrated HNO3 and concentrated H2SO4?',
    options: ['Nitronium ion (NO2+)', 'Nitrate ion (NO3-)', 'Nitrosonium ion (NO+)', 'Nitrogen dioxide (NO2)'],
    correct: 0,
    explain: 'Concentrated H2SO4 protonates HNO3, which loses water to generate the electrophilic nitronium ion: HNO3 + 2H2SO4 -> NO2+ + H3O+ + 2HSO4-.'
  },
  {
    id: 'tcat-chem-hc-13',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Hard',
    q: 'In electrophilic aromatic substitution, which of the following substituents is a meta-directing deactivator?',
    options: ['Nitro group (-NO2)', 'Hydroxyl group (-OH)', 'Methyl group (-CH3)', 'Amino group (-NH2)'],
    correct: 0,
    explain: '-NO2 has strong electron-withdrawing resonance and inductive effects (-M, -I), deactivating the ring and directing incoming electrophiles to the meta position.'
  },
  {
    id: 'tcat-chem-hc-14',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Hard',
    q: 'In Friedel-Crafts alkylation of benzene with chloromethane (CH3Cl), what is the function of anhydrous AlCl3?',
    options: [
      'Lewis acid catalyst that abstracts chloride to generate methyl carbocation',
      'Oxidizing agent',
      'Solvent for benzene',
      'Reducing agent'
    ],
    correct: 0,
    explain: 'Anhydrous AlCl3 acts as a Lewis acid, reacting with CH3Cl to form AlCl4- and generating the electrophile CH3+.'
  },
  {
    id: 'tcat-chem-hc-15',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    difficulty: 'Hard',
    q: 'When ethyne (acetylene) gas is passed through a red-hot copper or iron tube at 300°C, it polymerizes into:',
    options: ['Benzene (C6H6)', 'Polyethylene', 'Cyclohexane', 'Toluene'],
    correct: 0,
    explain: 'Trimerization of 3 molecules of acetylene (3 C2H2) over red-hot copper yields benzene (C6H6).'
  },

  // =========================================================
  // Chapter 14: Chemistry of Life (7 MCQs: 3 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-chem-col-8',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Easy',
    q: 'Monosaccharides with six carbon atoms and an aldehyde functional group (like glucose) are classified as:',
    options: ['Aldohexoses', 'Ketohexoses', 'Aldopentoses', 'Ketotetroses'],
    correct: 0,
    explain: 'Glucose has 6 carbons (hexose) and an aldehyde group (aldo-), making it an aldohexose.'
  },
  {
    id: 'tcat-chem-col-9',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Easy',
    q: 'Which disaccharide is formed by condensation of one alpha-D-glucose and one beta-D-fructose molecule?',
    options: ['Sucrose (cane sugar)', 'Maltose', 'Lactose (milk sugar)', 'Cellulose'],
    correct: 0,
    explain: 'Sucrose is a non-reducing disaccharide composed of glucose and fructose linked by an alpha-1,beta-2 glycosidic bond.'
  },
  {
    id: 'tcat-chem-col-10',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Easy',
    q: 'Fats and vegetable oils are chemically classified as esters of glycerol with long-chain fatty acids, known as:',
    options: ['Triglycerides', 'Phospholipids', 'Steroids', 'Waxes'],
    correct: 0,
    explain: 'Triacylglycerols (triglycerides) are triesters formed from one molecule of glycerol and three fatty acid molecules.'
  },
  {
    id: 'tcat-chem-col-11',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Medium',
    q: 'The peptide bond (-CO-NH-) linking consecutive amino acid residues in a polypeptide chain is formed by a:',
    options: ['Condensation (dehydration) reaction', 'Hydrolysis reaction', 'Addition reaction', 'Oxidation reaction'],
    correct: 0,
    explain: 'A peptide bond forms between the alpha-carboxyl group of one amino acid and the alpha-amino group of another, eliminating a water molecule.'
  },
  {
    id: 'tcat-chem-col-12',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Hard',
    q: 'The alpha-helix and beta-pleated sheet conformations of the secondary structure of proteins are stabilized primarily by:',
    options: [
      'Intramolecular hydrogen bonds between C=O and N-H groups of the peptide backbone',
      'Disulfide covalent linkages',
      'Ionic salt bridges between side chains',
      'Hydrophobic interactions only'
    ],
    correct: 0,
    explain: 'Secondary protein structures are maintained by hydrogen bonding between carbonyl oxygens and amide hydrogens of the polypeptide backbone.'
  },
  {
    id: 'tcat-chem-col-13',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Hard',
    q: 'In the Watson-Crick double helix model of DNA, how many hydrogen bonds link Guanine (G) and Cytosine (C)?',
    options: ['3', '2', '1', '4'],
    correct: 0,
    explain: 'Guanine forms 3 complementary hydrogen bonds with Cytosine (G ≡ C), while Adenine forms 2 with Thymine (A = T).'
  },
  {
    id: 'tcat-chem-col-14',
    subject: 'Chemistry',
    topic: 'Chemistry of Life',
    difficulty: 'Hard',
    q: 'The denaturation of a protein (by heat, extremes of pH, or heavy metal ions) disrupts all levels of protein structure EXCEPT:',
    options: [
      'Primary structure (covalent peptide sequence)',
      'Secondary structure',
      'Tertiary structure',
      'Quaternary structure'
    ],
    correct: 0,
    explain: 'Denaturation breaks non-covalent interactions and unfolds the protein, but does not cleave the covalent peptide bonds of the primary sequence.'
  }
];

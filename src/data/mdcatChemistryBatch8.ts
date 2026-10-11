import { Question } from '../types';

export const MDCAT_CHEMISTRY_BATCH8: Question[] = [
  {
    "id": "mdcat-b8-chem-1",
    "q": "How many moles of oxygen atoms are present in 0.50 moles of hydrated copper(II) sulfate crystals, CuSO4·5H2O?",
    "options": [
      "4.5 moles",
      "9.0 moles",
      "2.5 moles",
      "0.5 moles"
    ],
    "correct": 0,
    "topic": "Stoichiometry - Moles of Atoms in Hydrates",
    "chapter": "Fundamental Concepts of Chemistry",
    "explain": "Each formula unit of CuSO4·5H2O contains 4 (from sulfate) + 5 (from waters of hydration) = 9 oxygen atoms. Therefore, in 0.50 moles of the compound, moles of oxygen atoms = 0.50 × 9 = 4.50 moles.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-2",
    "q": "What is the empirical formula of an organic compound containing 40.0% Carbon, 6.7% Hydrogen, and 53.3% Oxygen by mass (Atomic masses: C = 12, H = 1, O = 16)?",
    "options": [
      "CH2O",
      "C2H4O2",
      "CHO",
      "CH4O"
    ],
    "correct": 0,
    "topic": "Empirical Formula Determination",
    "chapter": "Fundamental Concepts of Chemistry",
    "explain": "Moles: C = 40.0 / 12 = 3.33; H = 6.7 / 1 = 6.70; O = 53.3 / 16 = 3.33. Dividing by the smallest value (3.33): C = 1, H = 2.01 ≈ 2, O = 1. The empirical formula is CH2O.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-3",
    "q": "Under standard conditions, what volume of CO2 gas at STP is liberated by the complete thermal decomposition of 50.0 g of pure calcium carbonate (CaCO3, Molar mass = 100 g/mol)?",
    "options": [
      "11.2 $dm^{3}$",
      "22.4 $dm^{3}$",
      "5.6 $dm^{3}$",
      "44.8 $dm^{3}$"
    ],
    "correct": 0,
    "topic": "Stoichiometry - Molar Gas Volume at STP",
    "chapter": "Fundamental Concepts of Chemistry",
    "explain": "CaCO3(s) -> CaO(s) + CO2(g). Moles of CaCO3 = 50.0 g / 100 g/mol = 0.50 mol. 1 mole of CaCO3 yields 1 mole of CO2. At STP, 1 mole of an ideal gas occupies 22.414 $dm^{3}$. Volume of CO2 = 0.50 × 22.4 = 11.2 $dm^{3}$.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-4",
    "q": "Which quantum number determines the spatial orientation of an atomic orbital in a three-dimensional magnetic field?",
    "options": [
      "Magnetic quantum number (m or ml)",
      "Principal quantum number (n)",
      "Azimuthal quantum number (l)",
      "Spin quantum number (s or ms)"
    ],
    "correct": 0,
    "topic": "Quantum Numbers - Magnetic Quantum Number",
    "chapter": "Atomic Structure",
    "explain": "The magnetic quantum number (ml) can adopt values from -l to +l (total 2l + 1 values), describing the spatial orientation of orbitals in space and their degenerate energy states in magnetic fields (Zeeman effect).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-5",
    "q": "According to Hund's rule of maximum multiplicity, what is the ground-state electron configuration of a neutral nitrogen atom (Z = 7)?",
    "options": [
      "$1s^{2}2s^{2}2px^{1}2py^{1}2pz^{1}$",
      "$1s^{2}2s^{2}2px^{2}2py^{1}2pz^{0}$",
      "$1s^{2}2s^{1}2px^{2}2py^{2}2pz^{0}$",
      "$1s^{2}2s^{2}2px^{3}$"
    ],
    "correct": 0,
    "topic": "Electronic Configuration - Hund's Rule",
    "chapter": "Atomic Structure",
    "explain": "Hund's rule dictates that when filling degenerate orbitals (2px, 2py, 2pz), electrons occupy them singly with parallel spins before pairing occurs. Thus, nitrogen has three unpaired electrons: $1s^{2}2s^{2}2px^{1}2py^{1}2pz^{1}$.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-6",
    "q": "What is the wavelength of a photon emitted during an electronic transition in a hydrogen atom from n = 2 to n = 1 (Lyman series)? (Rydberg constant RH = 1.097 × 10⁷ m^{-1})",
    "options": [
      "1.215 × 10⁻⁷ m (121.5 nm)",
      "6.563 × 10⁻⁷ m (656.3 nm)",
      "4.861 × 10⁻⁷ m (486.1 nm)",
      "9.118 × 10⁻⁸ m (91.2 nm)"
    ],
    "correct": 0,
    "topic": "Bohr Theory and Rydberg Formula",
    "chapter": "Atomic Structure",
    "explain": "1/λ = RH (1/$1^{2}$ - 1/$2^{2}$) = RH (1 - 1/4) = (3/4) RH. λ = 4 / (3 × 1.097 × 10⁷) = 1.215 × 10⁻⁷ m = 121.5 nm, which lies in the ultraviolet spectrum.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-7",
    "q": "According to Heisenberg's uncertainty principle (Δx · Δp ≥ h / 4π), if the position of an electron is measured with absolute certainty (Δx -> 0), what is the resulting uncertainty in its momentum (Δp)?",
    "options": [
      "Approaches infinity (completely indeterminate)",
      "Zero",
      "Equal to Planck's constant (h)",
      "Equal to the electron rest mass"
    ],
    "correct": 0,
    "topic": "Heisenberg Uncertainty Principle",
    "chapter": "Atomic Structure",
    "explain": "Heisenberg's relation Δx · Δp ≥ h / 4π implies an inverse relationship between uncertainties. As uncertainty in position Δx approaches zero, the product can only be maintained if the uncertainty in momentum Δp approaches infinity.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-8",
    "q": "According to Graham's law of effusion, what is the ratio of the rate of diffusion of hydrogen gas (H2, M = 2 g/mol) to that of oxygen gas (O2, M = 32 g/mol) under identical temperature and pressure?",
    "options": [
      "4 : 1",
      "16 : 1",
      "1 : 4",
      "2 : 1"
    ],
    "correct": 0,
    "topic": "Graham's Law of Effusion",
    "chapter": "Gases",
    "explain": "Rate(H2) / Rate(O2) = $\\sqrt${M_O2 / M_H2} = $\\sqrt${32 / 2} = $\\sqrt${16} = 4. Hydrogen gas diffuses 4 times faster than oxygen gas.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-9",
    "q": "In the van der Waals equation of state for real gases, [P + ($an^{2} / V^{2}$)](V - nb) = nRT, what physical phenomenon does the constant \"a\" account for?",
    "options": [
      "Intermolecular attractive forces between real gas molecules",
      "The actual finite volume occupied by gas molecules",
      "Non-elastic collisions against the container walls",
      "Molecular dissociation into ionic species"
    ],
    "correct": 0,
    "topic": "Real Gases - van der Waals Constants",
    "chapter": "Gases",
    "explain": "The parameter \"a\" is a measure of intermolecular attractive forces (reducing pressure exerted on walls), whereas \"b\" represents the excluded volume (effective molecular volume) occupied by real gas molecules.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-10",
    "q": "Under what physical conditions of temperature and pressure does a real gas exhibit maximum deviation from ideal gas behavior?",
    "options": [
      "Low temperature and high pressure",
      "High temperature and low pressure",
      "High temperature and high pressure",
      "Low temperature and low pressure"
    ],
    "correct": 0,
    "topic": "Deviations from Ideal Gas Behavior",
    "chapter": "Gases",
    "explain": "At low temperature, molecular kinetic energy is diminished, making intermolecular attractive forces significant. At high pressure, molecules are packed closely together, making their finite volume non-negligible.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-11",
    "q": "Why does water expand and decrease in density as it freezes into ice between 4°C and 0°C (anomalous behavior of water)?",
    "options": [
      "Molecules arrange into an open cage-like hexagonal lattice maximizing intermolecular hydrogen bonds",
      "Water molecules lose kinetic energy and dissociate into H+ and OH- ions",
      "Trapped atmospheric nitrogen gas forms micro-bubbles",
      "Covalent O-H bonds stretch significantly at freezing temperatures"
    ],
    "correct": 0,
    "topic": "Liquid State - Structure and Anomaly of Ice",
    "chapter": "Liquids and Solids",
    "explain": "Below 4°C, hydrogen bonds organize water molecules into an open, tetrahedral cage-like hexagonal lattice with substantial empty interstitial spaces, increasing volume and making ice less dense than liquid water.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-12",
    "q": "What is the crystalline coordination number of each Na+ ion and each Cl- ion in the face-centered cubic (FCC) lattice of sodium chloride (NaCl)?",
    "options": [
      "6 and 6 (octahedral coordination)",
      "8 and 8 (cubic coordination)",
      "4 and 4 (tetrahedral coordination)",
      "12 and 12 (close-packed)"
    ],
    "correct": 0,
    "topic": "Crystal Lattices - NaCl Coordination Geometry",
    "chapter": "Liquids and Solids",
    "explain": "In the FCC lattice of NaCl, each Na+ cation is surrounded octahedrally by 6 Cl- anions, and each Cl- anion is similarly surrounded by 6 Na+ cations, establishing a 6:6 coordination geometry.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-13",
    "q": "Which type of crystalline solid is held together by an array of positive metal ions (cations) immersed in a delocalized \"sea\" of mobile valence electrons, imparting high electrical and thermal conductivity?",
    "options": [
      "Metallic crystals",
      "Ionic crystals",
      "Covalent network crystals",
      "Molecular crystals"
    ],
    "correct": 0,
    "topic": "Solid Types - Metallic Bonding",
    "chapter": "Liquids and Solids",
    "explain": "Metallic crystals consist of positive metal kernels immersed in a delocalized sea of valence electrons (electron-sea model / Drude-Lorentz model). These mobile electrons drift under an electric field, accounting for high electrical conductivity.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-14",
    "q": "According to Hess's Law of Constant Heat Summation, the total enthalpy change (ΔH) for a chemical transformation depends solely upon:",
    "options": [
      "The initial and final states of the chemical system, regardless of the pathway taken",
      "The rate of reaction and catalytic activation energy",
      "The number of intermediate steps involved in the reaction pathway",
      "The volume of the reaction container"
    ],
    "correct": 0,
    "topic": "Thermochemistry - Hess's Law",
    "chapter": "Chemical Energetics",
    "explain": "Enthalpy (H) is a state function. Hess's Law states that if a reaction can occur in one step or several steps, the total enthalpy change is the same, depending only on the initial and final states.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-15",
    "q": "For a chemical reaction occurring at constant temperature and pressure, which condition guarantees that the reaction will be spontaneous in the forward direction?",
    "options": [
      "ΔG < 0 (negative Gibbs free energy change)",
      "ΔH > 0 (endothermic reaction)",
      "ΔS < 0 (decrease in system entropy)",
      "ΔG > 0 (positive free energy change)"
    ],
    "correct": 0,
    "topic": "Thermodynamics - Gibbs Free Energy and Spontaneity",
    "chapter": "Chemical Energetics",
    "explain": "The criterion for spontaneity at constant T and P is a negative change in Gibbs free energy (ΔG = ΔH - TΔS < 0), meaning the process releases free energy to do useful work (exergonic).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-16",
    "q": "What is the change in internal energy (ΔE or ΔU) of a system that absorbs 250 J of heat from the surroundings while performing 100 J of expansion work on the surroundings?",
    "options": [
      "+150 J",
      "+350 J",
      "-150 J",
      "-350 J"
    ],
    "correct": 0,
    "topic": "First Law of Thermodynamics Calculations",
    "chapter": "Chemical Energetics",
    "explain": "According to the first law of thermodynamics: ΔU = q - w (or ΔU = q + w where work done by system is negative). Heat absorbed q = +250 J, work done by system w = 100 J. ΔU = 250 - 100 = +150 J.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-17",
    "q": "In the Born-Haber cycle for the formation of crystalline sodium chloride, which thermodynamic step represents the lattice energy of NaCl(s)?",
    "options": [
      "Na+(g) + Cl-(g) -> NaCl(s) [ΔH_lattice]",
      "Na(s) -> Na(g) [Enthalpy of atomization]",
      "Cl2(g) -> 2Cl(g) [Bond dissociation enthalpy]",
      "Na(s) + 1/2 Cl2(g) -> NaCl(s) [Enthalpy of formation]"
    ],
    "correct": 0,
    "topic": "Born-Haber Cycle - Lattice Energy Definition",
    "chapter": "Chemical Energetics",
    "explain": "Lattice energy is defined as the enthalpy change when one mole of an ionic crystalline solid is formed from its constituent gaseous ions separated at infinite distance: M+(g) + X-(g) -> MX(s).",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-18",
    "q": "For the reversible gas-phase Haber process: N2(g) + 3 H2(g) ⇌ 2 NH3(g) (ΔH = -92 kJ/mol), how will increasing the total external pressure shift the equilibrium position?",
    "options": [
      "Shifts to the right (toward NH3 formation, reducing total moles of gas)",
      "Shifts to the left (favoring N2 and H2 decomposition)",
      "Has no effect on the equilibrium position because temperature is constant",
      "Reduces the numerical equilibrium constant Kc"
    ],
    "correct": 0,
    "topic": "Le Chatelier's Principle - Effect of Pressure",
    "chapter": "Chemical Equilibrium",
    "explain": "By Le Chatelier's principle, increasing pressure shifts equilibrium in the direction of fewer gaseous moles. The reactant side has 1 + 3 = 4 moles of gas, while the product side has 2 moles of gas. Thus, equilibrium shifts right.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-19",
    "q": "What is the relationship between the equilibrium constants Kp and Kc for a gas reaction: Kp = Kc (RT)^Δn. For which of the following reactions is Kp = Kc?",
    "options": [
      "H2(g) + I2(g) ⇌ 2 HI(g)",
      "N2(g) + 3 H2(g) ⇌ 2 NH3(g)",
      "PCl5(g) ⇌ PCl3(g) + Cl2(g)",
      "2 SO2(g) + O2(g) ⇌ 2 SO3(g)"
    ],
    "correct": 0,
    "topic": "Equilibrium Constants - Kp vs Kc Relationship",
    "chapter": "Chemical Equilibrium",
    "explain": "Kp = Kc(RT)^Δn. When Δn (change in gaseous moles = moles products - moles reactants) equals 0, (RT)^{0} = 1 and Kp = Kc. In H2 + I2 ⇌ 2 HI, Δn = 2 - (1 + 1) = 0, so Kp = Kc.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-20",
    "q": "If the reaction quotient (Qc) calculated from instantaneous concentrations is greater than the equilibrium constant (Kc), Qc > Kc, what will occur as the system approaches equilibrium?",
    "options": [
      "The reverse reaction will predominate, converting products into reactants until Qc = Kc",
      "The forward reaction will accelerate, producing more products",
      "The temperature of the system will automatically drop",
      "The equilibrium constant Kc will increase to match Qc"
    ],
    "correct": 0,
    "topic": "Reaction Quotient Qc vs Equilibrium Constant Kc",
    "chapter": "Chemical Equilibrium",
    "explain": "When Qc > Kc, the concentration of products is higher than at equilibrium. To restore equilibrium, products must be consumed and reactants formed; hence, the reaction shifts to the left.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-21",
    "q": "How does the addition of a chemical catalyst affect a dynamic chemical equilibrium and its equilibrium constant (Kc)?",
    "options": [
      "Accelerates both forward and reverse rates equally without altering the equilibrium position or Kc",
      "Shifts the equilibrium toward products and increases Kc",
      "Decreases the activation energy of the forward reaction only, increasing product yield",
      "Lowers the numerical value of Kc"
    ],
    "correct": 0,
    "topic": "Equilibrium - Effect of Catalysts",
    "chapter": "Chemical Equilibrium",
    "explain": "A catalyst lowers the activation energy of both forward and reverse reactions by the exact same amount. Consequently, it allows equilibrium to be reached more rapidly, but does not alter the equilibrium composition or Kc value.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-22",
    "q": "In a standard electrochemical Daniel cell consisting of Zn/$Zn^{2}$⁺ and Cu/$Cu^{2}$⁺ half-cells, what process occurs at the zinc electrode (anode)?",
    "options": [
      "Oxidation of metallic Zn to $Zn^{2}$⁺ ions (Zn(s) -> $Zn^{2}$⁺(aq) + 2 e⁻)",
      "Reduction of $Zn^{2}$⁺ ions to metallic Zn",
      "Deposition of metallic copper on the zinc plate",
      "Evolution of hydrogen gas"
    ],
    "correct": 0,
    "topic": "Galvanic Cells - Daniel Cell Reactions",
    "chapter": "Electrochemistry",
    "explain": "An oxidation reaction always occurs at the anode in all electrochemical cells (An Ox). In the Daniel cell, zinc has a more negative standard reduction potential (E° = -0.76 V) than copper (E° = +0.34 V), so Zn metal is oxidized at the anode.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-23",
    "q": "What is the standard cell potential (E°cell) for a galvanic cell composed of $Zn^{2}$⁺/Zn (E° = -0.76 V) and $Cu^{2}$⁺/Cu (E° = +0.34 V)?",
    "options": [
      "+1.10 V",
      "-0.42 V",
      "+0.42 V",
      "-1.10 V"
    ],
    "correct": 0,
    "topic": "Standard Cell Potential Calculation",
    "chapter": "Electrochemistry",
    "explain": "E°cell = E°cathode - E°anode = E°($Cu^{2}$⁺/Cu) - E°($Zn^{2}$⁺/Zn) = +0.34 V - (-0.76 V) = +0.34 + 0.76 = +1.10 V.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-24",
    "q": "What is the primary function of the salt bridge (containing an inert electrolyte such as KNO3 or KCl in agar-agar) in a galvanic cell?",
    "options": [
      "Maintains electrical neutrality in both half-cells by allowing ion migration without physical mixing of solutions",
      "Supplies electrons directly to the external circuit",
      "Accelerates the chemical reaction by acting as an insoluble catalyst",
      "Prevents water molecules from evaporating from the electrolyte solutions"
    ],
    "correct": 0,
    "topic": "Galvanic Cells - Function of Salt Bridge",
    "chapter": "Electrochemistry",
    "explain": "The salt bridge completes the electrical circuit and maintains electroneutrality: anions migrate toward the anode half-cell to neutralize excess positive charge, while cations migrate toward the cathode half-cell to replace consumed cations.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-25",
    "q": "According to the Nernst equation at 298 K, Ecell = E°cell - (0.0591 / n) log Q. How does increasing the concentration of product ions in a galvanic cell affect the cell potential?",
    "options": [
      "Decreases the cell potential (Ecell)",
      "Increases the cell potential (Ecell)",
      "Increases the standard potential (E°cell)",
      "Leaves the cell potential unchanged"
    ],
    "correct": 0,
    "topic": "Nernst Equation - Concentration Dependence",
    "chapter": "Electrochemistry",
    "explain": "Q = [products] / [reactants]. Increasing the concentration of product ions increases Q, causing log Q to increase. Subtracting a larger positive value decreases the operating cell potential Ecell.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-26",
    "q": "What are the SI units of the rate constant (k) for a second-order chemical reaction with rate law Rate = k[A]²?",
    "options": [
      "$dm^{3}$mol^{-1} s^{-1} (or L mol^{-1} s^{-1})",
      "s^{-1}",
      "mol dm⁻³ s^{-1}",
      "dm⁶ mol⁻² s^{-1}"
    ],
    "correct": 0,
    "topic": "Rate Equations - Units of Rate Constant",
    "chapter": "Chemical Kinetics",
    "explain": "General formula for units of k is (mol dm⁻³)¹⁻ⁿ s^{-1}, where n is reaction order. For second order (n = 2): (mol dm⁻³)⁻¹ s^{-1} = $dm^{3}$mol^{-1} s^{-1}.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-27",
    "q": "For a first-order reaction with rate constant k, what is the mathematical expression for its half-life (t1/2)?",
    "options": [
      "t1/2 = 0.693 / k",
      "t1/2 = 1 / (k[A]0)",
      "t1/2 = [A]0 / (2k)",
      "t1/2 = 2.303 / k"
    ],
    "correct": 0,
    "topic": "First-Order Kinetics - Half-Life Formula",
    "chapter": "Chemical Kinetics",
    "explain": "For first order reactions, t1/2 = ln(2) / k = 0.693 / k. The half-life is completely independent of initial reactant concentration [A]0.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-28",
    "q": "According to the Arrhenius equation, k = A e^{-Ea / RT}, what does plotting ln(k) against 1/T yield?",
    "options": [
      "A straight line with slope = -Ea / R and y-intercept = ln(A)",
      "A parabola with minimum at the activation energy Ea",
      "A straight line with slope = +Ea / R",
      "A hyperbola with asymptote at A"
    ],
    "correct": 0,
    "topic": "Arrhenius Equation - Graphical Determination of Ea",
    "chapter": "Chemical Kinetics",
    "explain": "Taking natural logarithms gives ln(k) = ln(A) - (Ea/R)(1/T). Plotting ln(k) on the y-axis versus 1/T on the x-axis yields a straight line (y = mx + c) with slope m = -Ea / R.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-29",
    "q": "In a multi-step reaction mechanism, which elementary step determines the overall rate of the chemical reaction?",
    "options": [
      "The slowest elementary step (rate-determining step)",
      "The fastest elementary step",
      "The step with the lowest activation energy",
      "The terminal product-releasing step"
    ],
    "correct": 0,
    "topic": "Reaction Mechanisms - Rate-Determining Step",
    "chapter": "Chemical Kinetics",
    "explain": "The slowest elementary step has the highest activation energy barrier and acts as the kinetic bottleneck. The overall rate law corresponds to the molecularity and stoichiometry of this rate-determining step (RDS).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-30",
    "q": "What is the molality (m) of a solution prepared by dissolving 18.0 g of glucose (C6H12O6, Molar mass = 180 g/mol) in 500 g of pure water?",
    "options": [
      "0.20 m (mol/kg)",
      "0.10 m",
      "0.40 m",
      "1.0 m"
    ],
    "correct": 0,
    "topic": "Solution Concentrations - Molality Calculation",
    "chapter": "Solutions and Colligative Properties",
    "explain": "Moles of glucose = 18.0 g / 180 g/mol = 0.10 mol. Mass of solvent (water) = 500 g = 0.500 kg. Molality m = moles solute / kg solvent = 0.10 / 0.500 = 0.20 mol/kg.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-31",
    "q": "According to Raoult's Law for ideal binary liquid mixtures, the partial vapor pressure of a volatile component A (PA) in solution equals:",
    "options": [
      "PA = xA · P°A",
      "PA = xB · P°A",
      "PA = P°A / xA",
      "PA = xA · P_total"
    ],
    "correct": 0,
    "topic": "Raoult's Law for Ideal Solutions",
    "chapter": "Solutions and Colligative Properties",
    "explain": "Raoult's law states that the partial vapor pressure of any volatile component in an ideal solution is equal to the vapor pressure of the pure component (P°A) multiplied by its mole fraction (xA) in the solution: PA = xA · P°A.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-32",
    "q": "Which 0.10 M aqueous solution will exhibit the greatest elevation in boiling point (assuming complete ionic dissociation)?",
    "options": [
      "0.10 M Aluminum sulfate, Al2(SO4)3",
      "0.10 M Sodium chloride, NaCl",
      "0.10 M Calcium chloride, CaCl2",
      "0.10 M Glucose, C6H12O6"
    ],
    "correct": 0,
    "topic": "Colligative Properties - van 't Hoff Factor",
    "chapter": "Solutions and Colligative Properties",
    "explain": "Elevation in boiling point ΔTb = i · Kb · m. Al2(SO4)3 dissociates into 2 $Al^{3}$⁺ + 3 $SO4^{2}$⁻, giving a van 't Hoff factor i = 5. NaCl gives i = 2, CaCl2 gives i = 3, and glucose is non-electrolyte (i = 1). Therefore, Al2(SO4)3 yields the highest boiling point elevation.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-33",
    "q": "A mixture of ethanol and water shows a large positive deviation from Raoult's law. What is the molecular basis for this behavior?",
    "options": [
      "Intermolecular hydrogen bonding between ethanol and water molecules is weaker than between molecules of the pure liquids",
      "Strong hydrogen bonding between ethanol and water exceeds that of pure components",
      "Ethanol chemically reacts with water to form an ether",
      "The molecules occupy significantly less volume upon mixing"
    ],
    "correct": 0,
    "topic": "Non-Ideal Solutions - Positive Deviation from Raoult's Law",
    "chapter": "Solutions and Colligative Properties",
    "explain": "Positive deviations occur when solute-solvent adhesive forces (A-B) are weaker than cohesive forces in pure liquids (A-A and B-B). Escaping tendency increases, raising total vapor pressure above ideal predictions and causing endothermic mixing (ΔH_mix > 0).",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-34",
    "q": "What is the pH of a 0.0010 M aqueous solution of strong hydrochloric acid (HCl) at 25°C?",
    "options": [
      "3.0",
      "1.0",
      "4.0",
      "11.0"
    ],
    "correct": 0,
    "topic": "pH of Strong Acid Solutions",
    "chapter": "Acids, Bases and Salts",
    "explain": "HCl is a strong monoprotic acid that dissociates completely: [H3O+] = 0.0010 M = 1.0 × 10⁻³ M. pH = -log[H3O+] = -log(10⁻³) = 3.0.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-35",
    "q": "Which equation correctly expresses the Henderson-Hasselbalch relationship for an acidic buffer solution composed of a weak acid (HA) and its conjugate base salt (A⁻)?",
    "options": [
      "pH = pKa + log([Conjugate Base] / [Weak Acid])",
      "pH = pKa - log([Conjugate Base] / [Weak Acid])",
      "pOH = pKa + log([Salt] / [Acid])",
      "pH = pKb + log([Acid] / [Base])"
    ],
    "correct": 0,
    "topic": "Buffer Solutions - Henderson-Hasselbalch Equation",
    "chapter": "Acids, Bases and Salts",
    "explain": "The Henderson-Hasselbalch equation for an acidic buffer is derived from Ka: Ka = [H+][A-]/[HA] => -log[H+] = -log(Ka) - log([HA]/[A-]) \\implies pH = pKa + log([A-]/[HA]).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-36",
    "q": "According to the Brønsted-Lowry acid-base theory, what is the conjugate acid of the hydrogen sulfate ion (HSO4⁻)?",
    "options": [
      "H2SO4",
      "$SO4^{2}$⁻",
      "H3SO4⁺",
      "H3O⁺"
    ],
    "correct": 0,
    "topic": "Brønsted-Lowry Theory - Conjugate Pairs",
    "chapter": "Acids, Bases and Salts",
    "explain": "A conjugate acid is formed when a Brønsted base accepts a proton (H+). Adding H+ to HSO4- yields sulfuric acid, H2SO4. (Conversely, $SO4^{2}$⁻ is its conjugate base).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-37",
    "q": "The solubility product constant (Ksp) of lead(II) chloride (PbCl2) is expressed in terms of its molar solubility (S) as:",
    "options": [
      "Ksp = 4 $S^{3}$",
      "Ksp = $S^{2}$",
      "Ksp = 27 $S^{4}$",
      "Ksp = 2 $S^{2}$"
    ],
    "correct": 0,
    "topic": "Solubility Product (Ksp) Calculations",
    "chapter": "Acids, Bases and Salts",
    "explain": "PbCl2(s) ⇌ $Pb^{2}$⁺(aq) + 2 Cl⁻(aq). If solubility is S: [$Pb^{2}$⁺] = S, [Cl⁻] = 2S. Ksp = [$Pb^{2}$⁺][Cl⁻]² = (S)(2S)^{2} = (S)($4S^{2}$) = $4S^{3}$.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-38",
    "q": "Why do alkali metals (Group 1: Li, Na, K, Rb, Cs) impart characteristic bright colors to a Bunsen flame (e.g., sodium shows brilliant golden yellow)?",
    "options": [
      "Thermal energy excites the loosely held valence s-electron to higher orbitals, which emits characteristic visible photons upon returning to ground state",
      "The metal reacts with atmospheric carbon to produce incandescent soot",
      "Ionization generates free neutrons that fluoresce in air",
      "Metals form unstable radioactive isotopes in flame"
    ],
    "correct": 0,
    "topic": "Group 1 Elements - Flame Emission Spectra",
    "chapter": "s-Block and p-Block Elements",
    "explain": "Alkali metals have low ionization energies. In a flame, valence electrons absorb thermal energy and jump to higher energy levels. Returning to the ground state, they release excess energy as visible electromagnetic radiation with characteristic wavelengths (Li: crimson, Na: yellow, K: lilac).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-39",
    "q": "Which alkaline earth metal sulfate is so insoluble in water that it is routinely administered orally as a radio-opaque contrast medium for digestive X-ray imaging (\"barium meal\")?",
    "options": [
      "Barium sulfate (BaSO4)",
      "Magnesium sulfate (MgSO4)",
      "Calcium sulfate (CaSO4)",
      "Beryllium sulfate (BeSO4)"
    ],
    "correct": 0,
    "topic": "Group 2 Sulfates - Solubility Trend and Medical Use",
    "chapter": "s-Block and p-Block Elements",
    "explain": "Solubility of Group 2 sulfates decreases down the group as hydration energy drops faster than lattice energy. BaSO4 is insoluble (Ksp ~ 10^{-1}⁰) and non-toxic because $Ba^{2}$⁺ ions are not liberated into solution, making it safe for GI X-ray contrast.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-40",
    "q": "What is the molecular geometry and hybridization of the central sulfur atom in sulfur hexafluoride (SF6)?",
    "options": [
      "Octahedral geometry, $sp^{3}d^{2}$ hybridization",
      "Trigonal bipyramidal, $sp^{3}$d hybridization",
      "Tetrahedral, $sp^{3}$ hybridization",
      "Square planar, $dsp^{2}$ hybridization"
    ],
    "correct": 0,
    "topic": "p-Block Compounds - VSEPR Geometry of SF6",
    "chapter": "s-Block and p-Block Elements",
    "explain": "In SF6, sulfur shares 6 valence electrons with 6 fluorine atoms to form 6 bond pairs with 0 lone pairs (steric number 6). The hybridization is $sp^{3}d^{2}$, producing a regular octahedral molecular geometry with bond angles of $90^\\circ$ and $180^\\circ$.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-41",
    "q": "What is the \"inert pair effect\" observed prominently in heavier p-block post-transition metals such as Tl, Pb, and Bi?",
    "options": [
      "Reluctance of the valence s-electrons to participate in chemical bonding due to poor shielding by intervening d and f orbitals and relativistic contraction",
      "The complete lack of reactivity of valence p-electrons",
      "Formation of inert gas clathrates under pressure",
      "Resistance to oxidation caused by a passive oxide layer"
    ],
    "correct": 0,
    "topic": "Periodic Trends - Inert Pair Effect in Heavier p-Block",
    "chapter": "s-Block and p-Block Elements",
    "explain": "The inert pair effect refers to the energetic stability of the valence $ns^{2}$ pair in heavier post-transition elements (e.g., $Pb^{2}$⁺ is more stable than $Pb^{4}$⁺, Tl⁺ more stable than $Tl^{3}$⁺) due to high effective nuclear charge resulting from poor shielding by diffuse d and f subshells.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-42",
    "q": "Transition metal complexes are frequently brightly colored due to which electronic phenomenon in the presence of ligands?",
    "options": [
      "d-d electronic transitions between split d-orbital energy levels",
      "s to p valence transitions",
      "Nuclear spin resonance",
      "Rotational dipole radiation"
    ],
    "correct": 0,
    "topic": "Transition Elements - Origin of Color (d-d Transitions)",
    "chapter": "Transition Elements",
    "explain": "Under crystal field theory (CFT), ligands split the five degenerate d-orbitals into lower and higher energy sub-levels (t2g and eg in octahedral complexes). Absorption of visible light promotes an electron from lower to higher d-orbitals, and the transmitted complementary light gives the observed color.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-43",
    "q": "Why are transition metals and their coordination compounds extraordinarily effective heterogeneous and homogeneous industrial catalysts?",
    "options": [
      "They possess variable oxidation states and vacant d-orbitals capable of forming coordination complexes and providing low-energy reaction pathways",
      "They have exceptionally low melting points and high vapor pressures",
      "They are strong radioactive alpha emitters",
      "They dissolve completely in non-polar organic solvents"
    ],
    "correct": 0,
    "topic": "Transition Metals - Catalytic Properties",
    "chapter": "Transition Elements",
    "explain": "Transition elements have multiple oxidation states (e.g., $Fe^{2}$⁺/$Fe^{3}$⁺, $V^{4}$⁺/V⁵⁺) and accessible d-orbitals that can coordinate reactants, stabilize transition states, and shuttle electrons, lowering the activation energy barrier.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-44",
    "q": "In the coordination complex [Fe(CN)6]⁴⁻ (hexacyanoferrate(II)), what is the oxidation state, coordination number, and magnetic behavior of the central iron atom?",
    "options": [
      "Oxidation state +2, coordination number 6, diamagnetic (low spin)",
      "Oxidation state +3, coordination number 6, paramagnetic",
      "Oxidation state +2, coordination number 4, diamagnetic",
      "Oxidation state +4, coordination number 6, ferromagnetic"
    ],
    "correct": 0,
    "topic": "Coordination Chemistry - Hexacyanoferrate Complexes",
    "chapter": "Transition Elements",
    "explain": "Let x be iron's oxidation state: x + 6(-1) = -4 \\implies x = +2 ($Fe^{2}$⁺: [Ar] 3d⁶). Coordination number is 6 (six CN⁻ ligands). Cyanide is a strong field ligand, producing large crystal field splitting (Δo) that forces all 6 d-electrons to pair up in t2g orbitals (t2g⁶ $eg^{0}$), making the complex diamagnetic.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-45",
    "q": "What is the hybridization and bond angle associated with each carbon atom in ethylene (ethene, H2C=CH2)?",
    "options": [
      "$sp^{2}$ hybridization with ~$120^\\circ$ bond angles",
      "$sp^{3}$ hybridization with 109.$5^\\circ$ bond angles",
      "sp hybridization with $180^\\circ$ bond angles",
      "$dsp^{2}$ hybridization with $90^\\circ$ bond angles"
    ],
    "correct": 0,
    "topic": "Carbon Hybridization in Alkenes",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "explain": "Each double-bonded carbon in ethene forms 3 σ-bonds ($sp^{2}$ hybrid orbitals) and 1 unhybridized 2pz orbital that overlaps sideways to form a π-bond. The geometry around each carbon is trigonal planar with bond angles near $120^\\circ$.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-46",
    "q": "Which type of isomerism is exhibited by butane (CH3CH2CH2CH3) and 2-methylpropane (isobutane, (CH3)2CHCH3)?",
    "options": [
      "Chain (skeletal) isomerism",
      "Positional isomerism",
      "Functional group isomerism",
      "Metamerism"
    ],
    "correct": 0,
    "topic": "Structural Isomerism - Chain Isomerism",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "explain": "Butane and 2-methylpropane possess the same molecular formula (C4H10) but differ in the carbon skeleton connectivity (straight unbranched chain vs branched chain), classifying them as chain isomers.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-47",
    "q": "A carbon atom bonded to four completely different atoms or groups of atoms is defined as a:",
    "options": [
      "Chiral (asymmetric) carbon center",
      "Achiral carbon center",
      "Vinylic carbon",
      "Carbocation center"
    ],
    "correct": 0,
    "topic": "Optical Isomerism - Chiral Centers",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "explain": "A chiral (stereogenic or asymmetric) carbon is an $sp^{3}$-hybridized carbon bonded to four distinct chemical substituents. Such molecules lack an internal plane of symmetry and rotate plane-polarized light (optical isomerism).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-48",
    "q": "What is the relative order of thermodynamic stability among carbocations (carbonium ions)?",
    "options": [
      "Tertiary ($3^\\circ$) > Secondary ($2^\\circ$) > Primary ($1^\\circ$) > Methyl (CH3⁺)",
      "Methyl > Primary > Secondary > Tertiary",
      "Primary > Secondary > Tertiary",
      "Secondary > Tertiary > Primary"
    ],
    "correct": 0,
    "topic": "Reactive Intermediates - Carbocation Stability",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "explain": "Carbocation stability increases with the number of electron-donating alkyl groups: $3^\\circ > 2^\\circ$ > $1^\\circ$ > methyl. Alkyl groups disperse positive charge through positive inductive effect (+I) and hyperconjugation with adjacent C-H σ-bonds.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-49",
    "q": "In the presence of organic peroxides (ROOR), the free-radical addition of hydrogen bromide (HBr) to propene (CH3-CH=CH2) undergoes the peroxide effect (anti-Markovnikov addition) to yield which major organic product?",
    "options": [
      "1-Bromopropane (CH3-CH2-CH2Br)",
      "2-Bromopropane (CH3-CHBr-CH3)",
      "2,2-Dibromopropane",
      "Cyclopropane"
    ],
    "correct": 0,
    "topic": "Alkene Reactions - Free Radical Anti-Markovnikov Addition",
    "chapter": "Hydrocarbons",
    "explain": "In the presence of organic peroxides, HBr adds to unsymmetrical alkenes via a free-radical chain mechanism (Kharasch effect). The bromine radical (Br•) adds first to C-1 to generate the more stable secondary free radical (CH3-CH•-CH2Br), which abstracts hydrogen to form 1-bromopropane as the major product.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-50",
    "q": "What experimental conditions and catalyst are employed in the Kolbe's electrolytic synthesis of ethane from sodium acetate?",
    "options": [
      "Electrolysis of a concentrated aqueous solution of sodium acetate (CH3COONa)",
      "Heating sodium acetate dry with soda lime",
      "Reduction of ethyl chloride with zinc and hydrochloric acid",
      "Reaction of methyl iodide with sodium metal in dry ether (Wurtz reaction)"
    ],
    "correct": 0,
    "topic": "Alkane Preparation - Kolbe Electrolysis",
    "chapter": "Hydrocarbons",
    "explain": "In Kolbe's electrolytic method, concentrated sodium acetate solution is electrolyzed. At the anode, acetate ions lose an electron to form methyl radicals (via decarboxylation), which dimerize to form ethane: 2 CH3COO⁻ -> C2H6 + 2 CO2 + 2 e⁻.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-51",
    "q": "According to Hückel's rule of aromaticity, a planar, monocyclic, continuously conjugated ring system must possess how many π-electrons to be aromatic?",
    "options": [
      "(4n + 2) π-electrons, where n is a non-negative integer (0, 1, 2, 3...)",
      "4n π-electrons",
      "(2n + 1) π-electrons",
      "6n π-electrons"
    ],
    "correct": 0,
    "topic": "Aromaticity - Hückel's Rule",
    "chapter": "Hydrocarbons",
    "explain": "Hückel's rule states that a planar cyclic conjugated system displays aromatic stability if it possesses (4n + 2) delocalized π-electrons (e.g., n = 1 gives 6 π-electrons in benzene; n = 2 gives 10 π-electrons in naphthalene). Systems with 4n π-electrons are antiaromatic.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-52",
    "q": "What is the characteristic kinetic rate law and stereochemical outcome of a bimolecular nucleophilic substitution (SN2) reaction on an optically active secondary alkyl halide?",
    "options": [
      "Second-order kinetics (Rate = k[R-X][Nu⁻]) with complete Walden inversion of stereochemical configuration",
      "First-order kinetics (Rate = k[R-X]) with complete racemization",
      "Second-order kinetics with retention of configuration",
      "Zero-order kinetics"
    ],
    "correct": 0,
    "topic": "Alkyl Halide Reactions - SN2 Mechanism and Stereochemistry",
    "chapter": "Alkyl Halides",
    "explain": "SN2 reactions proceed in a single concerted step where the nucleophile attacks from the back side ($180^\\circ$ opposite the leaving group), resulting in second-order kinetics and complete stereochemical inversion (Walden inversion).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-53",
    "q": "Which alkyl halide isomer reacts most rapidly via the unimolecular substitution (SN1) pathway?",
    "options": [
      "2-Bromo-2-methylpropane (tert-butyl bromide)",
      "2-Bromopropane (isopropyl bromide)",
      "1-Bromopropane (propyl bromide)",
      "Bromomethane (methyl bromide)"
    ],
    "correct": 0,
    "topic": "Alkyl Halides - SN1 Reactivity Trend",
    "chapter": "Alkyl Halides",
    "explain": "SN1 rate depends on the stability of the carbocation intermediate formed in the rate-determining ionization step. Tertiary ($3^\\circ$) carbocations are vastly more stable than secondary, primary, or methyl, so tert-butyl bromide reacts fastest via SN1.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-54",
    "q": "In the preparation of a Grignard reagent (R-Mg-X), what solvent is strictly required, and why?",
    "options": [
      "Anhydrous dry ether (e.g., diethyl ether or THF); its lone pairs solvate and stabilize the organomagnesium complex while excluding moisture",
      "Aqueous ethanol; water stabilizes ionic magnesium ions",
      "Concentrated sulfuric acid to dehydrate magnesium",
      "Glacial acetic acid as a proton donor"
    ],
    "correct": 0,
    "topic": "Grignard Reagent Preparation and Solvation",
    "chapter": "Alkyl Halides",
    "explain": "Grignard reagents are prepared by reacting alkyl halides with Mg metal in dry ether. Ether lone pairs coordinate with Mg to form a stable dietherate complex. Moisture must be rigorously excluded because water immediately hydrolyzes Grignard reagents into alkanes (R-H).",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-55",
    "q": "According to Zaitsev's (Saytzeff's) rule, base-induced dehydrohalogenation (E2 elimination) of 2-bromobutane yields which major alkene product?",
    "options": [
      "2-Butene (the more substituted, more stable alkene)",
      "1-Butene (the less substituted terminal alkene)",
      "1,3-Butadiene",
      "Cyclobutane"
    ],
    "correct": 0,
    "topic": "Elimination Reactions - Zaitsev's Rule",
    "chapter": "Alkyl Halides",
    "explain": "Zaitsev's rule states that base-induced elimination predominantly yields the most stable alkene, which is the alkene with the greatest number of alkyl substituents attached to the double bond. Thus, 2-butene (disubstituted) is major, and 1-butene (monosubstituted) is minor.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-56",
    "q": "In the Lucas test used to distinguish between classes of alcohols, which class of alcohol reacts immediately at room temperature with anhydrous ZnCl2 and concentrated HCl to form an insoluble, turbid alkyl chloride layer?",
    "options": [
      "Tertiary ($3^\\circ$) alcohols",
      "Secondary ($2^\\circ$) alcohols",
      "Primary ($1^\\circ$) alcohols",
      "Methanol only"
    ],
    "correct": 0,
    "topic": "Alcohols - Lucas Test Classification",
    "chapter": "Alcohols and Phenols",
    "explain": "Lucas test differentiates alcohols based on carbocation stability during SN1 conversion to alkyl chlorides: $3^\\circ$ alcohols react immediately (turbidity forms within seconds), $2^\\circ$ alcohols react in 5-10 minutes, and $1^\\circ$ alcohols show no turbidity at room temperature unless heated.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-57",
    "q": "Why is phenol significantly more acidic than aliphatic alcohols like ethanol (pKa of phenol ~10 vs pKa of ethanol ~16)?",
    "options": [
      "The phenoxide anion is resonance-stabilized by delocalizing negative charge into the aromatic benzene ring",
      "The hydroxyl group in phenol is non-polar",
      "Phenol dissociates to release hydroxide ions",
      "Ethanol forms covalent dimers that prevent proton dissociation"
    ],
    "correct": 0,
    "topic": "Phenols - Acidity and Resonance Stabilization",
    "chapter": "Alcohols and Phenols",
    "explain": "When phenol loses a proton, the resulting phenoxide ion is stabilized by resonance across the ortho and para positions of the benzene ring. In ethoxide (CH3CH2O-), the negative charge is localized on oxygen and destabilized by the +I effect of the ethyl group.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-58",
    "q": "When phenol is treated with excess aqueous bromine water at room temperature, what characteristic precipitate is immediately formed?",
    "options": [
      "White precipitate of 2,4,6-tribromophenol",
      "Yellow liquid of 2-bromophenol",
      "Red crystalline 4-bromophenol",
      "Brown precipitate of bromobenzene"
    ],
    "correct": 0,
    "topic": "Phenols - Bromine Water Test",
    "chapter": "Alcohols and Phenols",
    "explain": "The phenolic -OH group is a powerful activating, ortho/para-directing group that activates the aromatic ring so strongly that bromination occurs at all three open ortho and para positions simultaneously, precipitating white 2,4,6-tribromophenol.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-59",
    "q": "What is the primary organic product obtained when primary alcohols (such as 1-propanol) are oxidized with acidified potassium dichromate (K2Cr2O7 / H2SO4) under prolonged reflux?",
    "options": [
      "Carboxylic acid (propanoic acid)",
      "Ketone (acetone)",
      "Alkene (propene)",
      "Ether (dipropyl ether)"
    ],
    "correct": 0,
    "topic": "Alcohol Oxidation Pathways",
    "chapter": "Alcohols and Phenols",
    "explain": "Primary alcohols are oxidized first to aldehydes, which undergo rapid further oxidation in the presence of excess aqueous dichromate oxidant under reflux to yield carboxylic acids. Secondary alcohols oxidize to ketones, while tertiary alcohols resist oxidation.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-60",
    "q": "Which diagnostic reagent yields a brilliant silver mirror on the inner walls of a clean glass test tube upon reaction with aliphatic or aromatic aldehydes, but does not react with ketones?",
    "options": [
      "Tollens' reagent (ammoniacal silver nitrate)",
      "Fehling's solution",
      "Benedict's solution",
      "Lucas reagent"
    ],
    "correct": 0,
    "topic": "Aldehyde Identification - Tollens' Silver Mirror Test",
    "chapter": "Aldehydes and Ketones",
    "explain": "Tollens' reagent contains [Ag(NH3)2]⁺. Aldehydes readily reduce Ag⁺ to metallic silver ($Ag^{0}$), which deposits on the glass wall as a reflective mirror, while the aldehyde is oxidized to a carboxylate. Ketones lack the oxidizable carbonyl hydrogen and test negative.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-61",
    "q": "Which organic carbonyl compound gives a positive iodoform test (yellow precipitate of CHI3 with characteristic antiseptic odor) when treated with I2 and aqueous NaOH?",
    "options": [
      "Acetone (propan-2-one)",
      "3-Pentanone",
      "Formaldehyde (methanal)",
      "Benzophenone"
    ],
    "correct": 0,
    "topic": "Iodoform Reaction - Methyl Carbonyl Detection",
    "chapter": "Aldehydes and Ketones",
    "explain": "The iodoform test is specific for compounds containing a methyl carbonyl group (CH3-C=O) or a secondary alcohol oxidizable to it (CH3-CH(OH)-). Acetone contains two methyl carbonyl groups and forms yellow iodoform (CHI3) crystals.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-62",
    "q": "Which of the following aldehydes undergoes the Cannizzaro self-redox (disproportionation) reaction upon treatment with concentrated 50% sodium hydroxide, because it lacks an α-hydrogen atom?",
    "options": [
      "Benzaldehyde (C6H5CHO)",
      "Acetaldehyde (CH3CHO)",
      "Propionaldehyde (CH3CH2CHO)",
      "Acetone"
    ],
    "correct": 0,
    "topic": "Cannizzaro Reaction - Aldehydes Lacking Alpha Hydrogens",
    "chapter": "Aldehydes and Ketones",
    "explain": "Aldehydes lacking α-hydrogens (such as formaldehyde and benzaldehyde) cannot undergo aldol condensation in strong base. Instead, they disproportionate via hydride transfer: one molecule is reduced to an alcohol (benzyl alcohol) and another oxidized to a carboxylate (benzoate).",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-63",
    "q": "What is the nucleophilic addition product formed by the reversible reaction of an aldehyde with one equivalent of an alcohol in the presence of an acid catalyst?",
    "options": [
      "Hemiacetal",
      "Acetal",
      "Enol",
      "Ester"
    ],
    "correct": 0,
    "topic": "Carbonyl Addition - Hemiacetal Formation",
    "chapter": "Aldehydes and Ketones",
    "explain": "Acid-catalyzed nucleophilic addition of one alcohol molecule (R'OH) to an aldehyde carbonyl yields a hemiacetal, possessing an -OH and an -OR' group attached to the same carbon atom. Addition of a second equivalent of alcohol yields a full acetal.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-64",
    "q": "In Fischer esterification, what are the products formed by the reversible acid-catalyzed reaction between ethanoic acid (acetic acid) and ethanol?",
    "options": [
      "Ethyl ethanoate (ethyl acetate) and water",
      "Diethyl ether and carbon dioxide",
      "Ethanoic anhydride and hydrogen",
      "Ethanal and methane"
    ],
    "correct": 0,
    "topic": "Esterification - Fischer Esterification Reaction",
    "chapter": "Carboxylic Acids",
    "explain": "CH3COOH + CH3CH2OH ⇌ (H2SO4) ⇌ CH3COOCH2CH3 + H2O. Concentrated sulfuric acid serves both as a proton catalyst and as a dehydrating agent to shift the equilibrium toward ester formation.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-65",
    "q": "Which reagent cleanly converts a carboxylic acid directly into an acyl chloride (acid chloride), releasing gaseous SO2 and HCl byproducts that drive the reaction to completion?",
    "options": [
      "Thionyl chloride (SOCl2)",
      "Phosphorus trichloride (PCl3)",
      "Sodium chloride (NaCl)",
      "Chlorine gas in sunlight"
    ],
    "correct": 0,
    "topic": "Carboxylic Acid Derivatives - Acyl Chloride Synthesis",
    "chapter": "Carboxylic Acids",
    "explain": "RCOOH + SOCl2 -> RCOCl + SO2(g) + HCl(g). Thionyl chloride is the preferred laboratory reagent because both byproducts are volatile gases that boil off, leaving the pure acid chloride product behind.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-66",
    "q": "Why is trichloroacetic acid (CCl3COOH) significantly more acidic than unsubstituted ethanoic acid (CH3COOH)?",
    "options": [
      "The three strongly electronegative chlorine atoms exert a powerful electron-withdrawing inductive (-I) effect, stabilizing the trichloroacetate anion",
      "The chlorine atoms donate electron density by resonance",
      "Trichloroacetic acid forms stronger intramolecular hydrogen bonds",
      "The chlorine atoms release chloride ions in aqueous solution"
    ],
    "correct": 0,
    "topic": "Carboxylic Acid Acidity - Inductive Effects",
    "chapter": "Carboxylic Acids",
    "explain": "The three electronegative chlorine atoms pull electron density away from the carboxylate group (-I inductive effect). This delocalizes and stabilizes the negative charge on the conjugate base, increasing Ka and lowering pKa from 4.76 (acetic acid) to 0.65 (trichloroacetic acid).",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-67",
    "q": "When ammonium acetate (CH3COONH4) is strongly heated, it undergoes dehydration to produce which carboxylic acid derivative?",
    "options": [
      "Acetamide (ethanamide, CH3CONH2)",
      "Acetonitrile (methyl cyanide)",
      "Ethylamine",
      "Acromine"
    ],
    "correct": 0,
    "topic": "Acid Derivatives - Amide Synthesis by Thermal Dehydration",
    "chapter": "Carboxylic Acids",
    "explain": "Heating ammonium carboxylate salts causes loss of a molecule of water to yield primary acid amides: CH3COONH4 ->(heat) -> CH3CONH2 + H2O. Further dehydration of acetamide with P2O5 yields acetonitrile.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-68",
    "q": "What is the dipolar ionic form of an amino acid called, in which the amino group is protonated (-NH3⁺) and the carboxyl group is deprotonated (-COO⁻) with a net zero electrical charge?",
    "options": [
      "Zwitterion (inner salt)",
      "Enantiomer",
      "Racemate",
      "Micelle"
    ],
    "correct": 0,
    "topic": "Amino Acids - Zwitterion Structure",
    "chapter": "Amino Acids and Proteins",
    "explain": "In aqueous solutions at physiological pH, amino acids exist predominantly as zwitterions (German for \"hybrid ions\"), where the basic amino group accepts a proton to become -NH3⁺ and the carboxyl group donates a proton to become -COO⁻.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-69",
    "q": "Which is the only standard proteinogenic amino acid that lacks a chiral carbon center and is consequently optically inactive?",
    "options": [
      "Glycine",
      "Alanine",
      "Valine",
      "Proline"
    ],
    "correct": 0,
    "topic": "Amino Acids - Glycine Achirality",
    "chapter": "Amino Acids and Proteins",
    "explain": "Glycine has a hydrogen atom (-H) as its side chain (R group). Because its α-carbon is bonded to two identical hydrogen atoms, it lacks four distinct substituents, making it achiral and optically inactive.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-70",
    "q": "When an amino acid with an isoelectric point of pI = 6.0 is subjected to zone electrophoresis in a strongly acidic buffer at pH 2.0, toward which electrode will it migrate?",
    "options": [
      "Toward the negative electrode (cathode), because excess protons convert it into a positively charged cation (-NH3⁺ / -COOH)",
      "Toward the positive electrode (anode), because it acquires a net negative charge",
      "It will remain stationary at the origin because it exists as a neutral zwitterion",
      "It will decompose rapidly into ammonia and carbon dioxide"
    ],
    "correct": 0,
    "topic": "Amino Acids - Electrophoretic Migration and pI",
    "chapter": "Amino Acids and Proteins",
    "explain": "At a buffer pH below its isoelectric point (pH < pI), the high hydrogen ion concentration suppresses carboxyl ionization (-COO⁻ becomes -COOH) while the amino group remains protonated (-NH3⁺). The molecule acquires a net positive charge and migrates toward the cathode.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-71",
    "q": "In the formation of a peptide bond between two amino acids, what type of chemical reaction occurs with the elimination of a water molecule?",
    "options": [
      "Condensation (dehydration synthesis)",
      "Hydrolysis",
      "Decarboxylation",
      "Electrophilic addition"
    ],
    "correct": 0,
    "topic": "Peptide Bond Formation Mechanism",
    "chapter": "Amino Acids and Proteins",
    "explain": "Peptide bond formation involves nucleophilic attack of the α-amino group of one amino acid on the α-carboxyl group of another, eliminating a molecule of water (condensation) to generate an amide (peptide, -CO-NH-) bond.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-72",
    "q": "Nylon 6,6 is an important synthetic polyamide fiber prepared by the condensation polymerization of which two bifunctional monomers?",
    "options": [
      "Adipic acid (hexanedioic acid) and hexamethylenediamine (1,6-diaminohexane)",
      "Terephthalic acid and ethylene glycol",
      "Caprolactam and glycine",
      "Phenol and formaldehyde"
    ],
    "correct": 0,
    "topic": "Polymers - Nylon 6,6 Synthesis",
    "chapter": "Macromolecules and Environmental Chemistry",
    "explain": "Nylon 6,6 is synthesized by condensation polymerization of adipic acid (a 6-carbon dicarboxylic acid) and hexamethylenediamine (a 6-carbon diamine), releasing water molecules and forming repeating polyamide linkages (-CO-NH-).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-73",
    "q": "In the stratosphere, chlorofluorocarbons (CFCs) undergo photolytic dissociation by ultraviolet radiation, releasing which reactive free radicals that catalytically destroy the protective ozone layer?",
    "options": [
      "Chlorine free radicals (Cl•)",
      "Fluorine free radicals (F•)",
      "Hydroxyl radicals (•OH)",
      "Carbonate radicals"
    ],
    "correct": 0,
    "topic": "Environmental Chemistry - Stratospheric Ozone Depletion",
    "chapter": "Macromolecules and Environmental Chemistry",
    "explain": "UV radiation breaks weak C-Cl bonds in CFCs: CF2Cl2 + hν -> CF2Cl• + Cl•. The chlorine radical reacts with ozone: Cl• + O3 -> ClO• + O2, and ClO• + O -> Cl• + O2, regenerating Cl• to destroy up to 100,000 ozone molecules per radical.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-74",
    "q": "What are the two principal atmospheric air pollutants primarily responsible for the formation of acid rain (pH < 5.6)?",
    "options": [
      "Sulfur dioxide (SO2) and oxides of nitrogen (NOx)",
      "Carbon monoxide (CO) and methane (CH4)",
      "Chlorofluorocarbons (CFCs) and ozone",
      "Argon and particulate carbon soot"
    ],
    "correct": 0,
    "topic": "Environmental Chemistry - Acid Rain Precursors",
    "chapter": "Macromolecules and Environmental Chemistry",
    "explain": "Sulfur dioxide (SO2) from coal combustion and nitrogen oxides (NO, NO2) from vehicle exhausts dissolve in atmospheric water droplets and are oxidized to form sulfuric acid (H2SO4) and nitric acid (HNO3), lowering rain pH to 4.0-4.5.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-chem-75",
    "q": "What is the chemical identity of the thermosetting plastic Bakelite, widely used for electrical insulators and switches?",
    "options": [
      "Phenol-formaldehyde cross-linked resin",
      "Polyethylene terephthalate (PET)",
      "Polytetrafluoroethylene (Teflon)",
      "Polyvinyl chloride (PVC)"
    ],
    "correct": 0,
    "topic": "Polymers - Bakelite Cross-Linking",
    "chapter": "Macromolecules and Environmental Chemistry",
    "explain": "Bakelite is a thermosetting polymer formed by the step-growth condensation of phenol with formaldehyde in the presence of acid or base catalysts, producing extensive 3D methylene (-CH2-) cross-links that prevent remelting upon heating.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  }
];

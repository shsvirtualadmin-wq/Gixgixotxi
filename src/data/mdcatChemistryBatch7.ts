import { Question } from '../types';

export const MDCAT_CHEMISTRY_BATCH7: Question[] = [
  {
    "id": "mdcat-b7-chem-1",
    "q": "How many total molecules of oxygen (O2) are present in 16.0 grams of pure oxygen gas at standard temperature and pressure (STP)? (Molar mass of O2 = 32.0 g/mol, NA = 6.02 × $10^{23}$)",
    "options": [
      "3.01 × $10^{23}$ molecules",
      "6.02 × $10^{23}$ molecules",
      "1.20 × $10^{24}$ molecules",
      "1.51 × $10^{23}$ molecules"
    ],
    "correct": 0,
    "topic": "Mole Concept and Avogadro Number",
    "chapter": "Fundamental Concepts of Chemistry",
    "explain": "Number of moles n = mass / molar mass = 16.0 g / 32.0 g/mol = 0.50 mol. Number of molecules N = n × NA = 0.50 × 6.02 × $10^{23}$ = 3.01 × $10^{23}$ molecules.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-2",
    "q": "A gaseous hydrocarbon contains 80% carbon and 20% hydrogen by mass. If its experimentally measured molar mass is 30.0 g/mol, what is its molecular formula? (Atomic masses: C = 12, H = 1)",
    "options": [
      "C2H6 (Ethane)",
      "CH4 (Methane)",
      "C2H4 (Ethene)",
      "C3H8 (Propane)"
    ],
    "correct": 0,
    "topic": "Empirical and Molecular Formulas",
    "chapter": "Fundamental Concepts of Chemistry",
    "explain": "Moles of C = 80/12 = 6.67; Moles of H = 20/1 = 20. Atomic ratio C:H = 6.67/6.67 : 20/6.67 = 1 : 3. Empirical formula is CH3 (formula mass = 15). n = 30 / 15 = 2. Molecular formula = (CH3)2 = C2H6.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-3",
    "q": "In the combustion reaction: C3H8 + 5 O2 -> 3 CO2 + 4 H2O, if 2.0 moles of propane (C3H8) are reacted with 8.0 moles of O2, which reactant is the limiting reagent and how many moles of CO2 are formed?",
    "options": [
      "O2 is the limiting reagent; 4.8 moles of CO2 are formed",
      "C3H8 is the limiting reagent; 6.0 moles of CO2 are formed",
      "O2 is the limiting reagent; 3.0 moles of CO2 are formed",
      "Neither reactant is limiting; 5.0 moles of CO2 are formed"
    ],
    "correct": 0,
    "topic": "Limiting Reactant Stoichiometry",
    "chapter": "Fundamental Concepts of Chemistry",
    "explain": "1 mol C3H8 requires 5 mol O2. For 2 mol C3H8, 10 mol O2 is required, but only 8.0 mol O2 is available; hence O2 is the limiting reagent. Moles of CO2 produced = 8.0 mol O2 × (3 mol CO2 / 5 mol O2) = 4.8 moles.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-4",
    "q": "In mass spectrometry, what physical quantity of an accelerated gaseous ion determines the radius of curvature (r) of its trajectory through a perpendicular uniform magnetic field (B)?",
    "options": [
      "Mass-to-charge ratio (m/z)",
      "Total nuclear spin quantum number",
      "Ionization potential of the neutral precursor",
      "Electronegativity difference"
    ],
    "correct": 0,
    "topic": "Mass Spectrometry Principles",
    "chapter": "Fundamental Concepts of Chemistry",
    "explain": "The radius of curvature is governed by r = (1/B) × $\\sqrt{2Vm/z}$. Thus, ions are separated and detected according to their specific mass-to-charge ratio (m/z).",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-5",
    "q": "According to Hund's rule of maximum multiplicity, what is the electronic configuration of the ground state of a nitrogen atom (atomic number Z = 7)?",
    "options": [
      "1s2 2s2 2px1 2py1 2pz1 with parallel spins",
      "1s2 2s2 2px2 2py1 2pz0",
      "1s2 2s1 2px2 2py2 2pz0",
      "1s2 2s2 2px0 2py2 2pz1"
    ],
    "correct": 0,
    "topic": "Hund's Rule and Electronic Configuration",
    "chapter": "Atomic Structure",
    "explain": "Hund's rule dictates that when degenerate orbitals of equal energy (2p) are available, electrons occupy them singly with parallel spins before pairing commences: 1s2 2s2 2px1 2py1 2pz1.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-6",
    "q": "In the hydrogen atom emission spectrum, transitions of electrons from outer energy levels (n2 ≥ 2) dropping down to the ground state principal energy level (n1 = 1) produce spectral lines belonging to which series, and in which electromagnetic region do they lie?",
    "options": [
      "Lyman series, Ultraviolet (UV) region",
      "Balmer series, Visible region",
      "Paschen series, Infrared region",
      "Brackett series, Far-infrared region"
    ],
    "correct": 0,
    "topic": "Hydrogen Spectral Series",
    "chapter": "Atomic Structure",
    "explain": "Transitions terminating at n = 1 constitute the Lyman series, which emits high-energy photons located exclusively in the ultraviolet (UV) region of the electromagnetic spectrum.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-7",
    "q": "According to Heisenberg's uncertainty principle, if the uncertainty in the position (Δx) of an electron is reduced to zero, what happens to the uncertainty in its linear momentum (Δp)?",
    "options": [
      "Δp approaches infinity (completely indeterminate)",
      "Δp becomes exactly zero",
      "Δp equals Planck's constant (h)",
      "Δp equals the mass of the electron"
    ],
    "correct": 0,
    "topic": "Heisenberg Uncertainty Principle",
    "chapter": "Atomic Structure",
    "explain": "Heisenberg's uncertainty relation is Δx · Δp ≥ h / (4π). If Δx -> 0, then Δp ≥ h / (4π · Δx) -> ∞; the momentum becomes completely indeterminate.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-8",
    "q": "Under which experimental conditions does a real gas exhibit maximum deviation from ideal gas behavior?",
    "options": [
      "High pressure and low temperature",
      "Low pressure and high temperature",
      "High temperature and low pressure",
      "Moderate pressure at standard boiling point"
    ],
    "correct": 0,
    "topic": "Deviation of Real Gases from Ideality",
    "chapter": "Gases",
    "explain": "At high pressure, real gas molecules are compressed tightly so their finite molecular volume cannot be neglected. At low temperature, slow molecular velocity allows intermolecular attractive forces (van der Waals attractions) to become significant.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-9",
    "q": "According to Graham's law of diffusion, what is the ratio of the rate of diffusion of hydrogen gas (H2, molar mass = 2.0 g/mol) compared to oxygen gas (O2, molar mass = 32.0 g/mol) at identical temperature and pressure?",
    "options": [
      "4 : 1 (H2 diffuses 4 times faster than O2)",
      "16 : 1",
      "1 : 4",
      "2 : 1"
    ],
    "correct": 0,
    "topic": "Graham's Law of Diffusion",
    "chapter": "Gases",
    "explain": "Rate ratio r(H2) / r(O2) = sqrt(M(O2) / M(H2)) = $\\sqrt{32.0 / 2.0} =  \\sqrt{16}$ = 4. Hydrogen gas diffuses 4 times faster than oxygen gas.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-10",
    "q": "In the van der Waals equation for real gases, [P + ($an^{2} /  V^{2}$)] (V - nb) = nRT, what physical molecular property is accounted for by the correction parameter \"a\"?",
    "options": [
      "Intermolecular attractive forces between gas molecules",
      "Finite non-zero volume occupied by gas molecules",
      "Rotational kinetic energy of polar bonds",
      "Mean free path between collisions"
    ],
    "correct": 0,
    "topic": "van der Waals Equation and Constants",
    "chapter": "Gases",
    "explain": "The van der Waals constant 'a' corrects for intermolecular forces of attraction that pull molecules inward and reduce the observed pressure; constant 'b' (co-volume) corrects for the finite physical volume of the molecules.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-11",
    "q": "What is the root-mean-square velocity (v_rms) of a gas molecule directly proportional to, according to the kinetic molecular theory of gases?",
    "options": [
      "Square root of the absolute temperature ($\\sqrt{T}$)",
      "Absolute temperature (T)",
      "Square of the absolute temperature ($T^{2}$)",
      "Molar volume of the gas"
    ],
    "correct": 0,
    "topic": "Kinetic Molecular Theory - Molecular Speeds",
    "chapter": "Gases",
    "explain": "The root-mean-square velocity is given by v_rms = $\\sqrt{3RT / M}$. Thus, v_rms is directly proportional to the square root of the absolute thermodynamic temperature, $\\sqrt{T}$, and inversely proportional to $\\sqrt{M}$.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-12",
    "q": "Why does liquid water display an anomalous expansion behavior and reach its maximum density at 4.0 °C rather than at its freezing point (0 °C)?",
    "options": [
      "Collapse of open cage-like tetrahedral hydrogen-bonded hexagonal rings into a denser liquid packing above 0 °C",
      "Thermal ionization of covalent O-H bonds into hydronium ions",
      "Rapid vaporization of dissolved atmospheric gases",
      "Formation of linear covalent ice polymer chains"
    ],
    "correct": 0,
    "topic": "Anomalous Behavior of Water and Hydrogen Bonding",
    "chapter": "Liquids and Solids",
    "explain": "Ice has an open tetrahedral cage structure held by fixed hydrogen bonds, giving it low density. When ice melts to liquid water, this rigid framework partially collapses, allowing molecules to pack closer together, maximizing density at 3.98 °C (~4 °C).",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-13",
    "q": "The normal boiling point of a liquid is precisely defined as the temperature at which its equilibrium vapor pressure equals:",
    "options": [
      "1.0 atm (760 torr / 101,325 Pa)",
      "0.5 atm",
      "2.0 atm",
      "The critical pressure of the liquid"
    ],
    "correct": 0,
    "topic": "Vapor Pressure and Boiling Point",
    "chapter": "Liquids and Solids",
    "explain": "The normal boiling point is the specific temperature at which the vapor pressure of a liquid equals exactly 1 standard atmosphere (760 mmHg or 101.325 kPa).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-14",
    "q": "In crystalline sodium chloride (NaCl), each sodium cation (Na+) is coordinated and directly surrounded by how many chloride anions (Cl-) in its face-centered cubic (FCC) lattice?",
    "options": [
      "6 chloride ions (octahedral geometry)",
      "8 chloride ions (cubic geometry)",
      "4 chloride ions (tetrahedral geometry)",
      "12 chloride ions"
    ],
    "correct": 0,
    "topic": "Crystal Lattice and Coordination Number",
    "chapter": "Liquids and Solids",
    "explain": "The NaCl crystal lattice has a face-centered cubic (FCC) rock-salt structure where each Na+ ion is surrounded by 6 equidistant Cl- ions, and each Cl- ion is surrounded by 6 Na+ ions (coordination number 6:6).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-15",
    "q": "Diamond and graphite are allotropes of carbon. Which hybridization states describe carbon atoms in diamond and graphite, respectively?",
    "options": [
      "sp3 in diamond (tetrahedral) and sp2 in graphite (planar hexagonal)",
      "sp2 in diamond and sp3 in graphite",
      "sp3 in diamond and sp in graphite",
      "sp in diamond and sp2 in graphite"
    ],
    "correct": 0,
    "topic": "Allotropes of Carbon and Hybridization",
    "chapter": "Liquids and Solids",
    "explain": "In diamond, each carbon is sp3 hybridized forming 4 strong sigma bonds in a rigid 3D tetrahedral network (insulator, hardest mineral). In graphite, carbon atoms are sp2 hybridized in 2D planar sheets with delocalized pi electrons (electrical conductor).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-16",
    "q": "According to Hess's law of constant heat summation, the enthalpy change (ΔH) of a chemical reaction depends solely on:",
    "options": [
      "The initial and final states of the chemical system, independent of the pathway or intermediate steps",
      "The number of intermediate steps in the reaction mechanism",
      "The presence of an active catalyst",
      "The rate constant of the slowest elementary step"
    ],
    "correct": 0,
    "topic": "Hess's Law of Constant Heat Summation",
    "chapter": "Chemical Energetics",
    "explain": "Enthalpy (H) is a thermodynamic state function. Hess's law states that the net enthalpy change of a chemical transformation is equal to the sum of enthalpy changes of the individual steps, regardless of the route taken.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-17",
    "q": "The standard enthalpy of formation (ΔHf°) of which of the following substances is defined as exactly zero kJ/mol at 298 K and 1 atm?",
    "options": [
      "O2(g) in its standard diatomic state",
      "H2O(l)",
      "CO2(g)",
      "Diamond C(s)"
    ],
    "correct": 0,
    "topic": "Standard Enthalpy of Formation",
    "chapter": "Chemical Energetics",
    "explain": "By thermodynamic convention, the standard enthalpy of formation (ΔHf°) of any pure chemical element in its most stable physical allotropic state at 298 K and 1 bar is assigned a value of zero (e.g., O2(g), graphite C(s), N2(g)).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-18",
    "q": "For a chemical process occurring at constant temperature and pressure, the criterion for spontaneous thermodynamic feasibility is that the change in Gibbs free energy (ΔG) must be:",
    "options": [
      "Negative (ΔG < 0)",
      "Positive (ΔG > 0)",
      "Zero (ΔG = 0)",
      "Undefined"
    ],
    "correct": 0,
    "topic": "Gibbs Free Energy and Spontaneity",
    "chapter": "Chemical Energetics",
    "explain": "According to the second law of thermodynamics, a process at constant T and P is spontaneous if ΔG = ΔH - TΔS < 0 (exergonic). At equilibrium ΔG = 0; if ΔG > 0, the forward reaction is non-spontaneous.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-19",
    "q": "In the Haber synthesis of ammonia: N2(g) + 3 H2(g) <=> 2 NH3(g) (ΔH = -92 kJ/mol), which set of conditions shifts the equilibrium toward higher yield of NH3 according to Le Chatelier's principle?",
    "options": [
      "High pressure and low to moderate temperature",
      "Low pressure and high temperature",
      "Addition of an inert gas at constant volume",
      "Continuous removal of N2 gas"
    ],
    "correct": 0,
    "topic": "Le Chatelier's Principle in Industrial Processes",
    "chapter": "Chemical Equilibrium",
    "explain": "The forward reaction is exothermic (favored by lower temperature) and involves a decrease in gas moles from 4 to 2 (favored by high pressure). Industrially, ~200 atm and an optimum 450 °C with iron catalyst are used.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-20",
    "q": "What is the relationship between Kp and Kc for the gaseous reaction: 2 SO2(g) + O2(g) <=> 2 SO3(g)?",
    "options": [
      "Kp = Kc $(RT)^{-1}$",
      "Kp = Kc $(RT)^{+1}$",
      "Kp = Kc",
      "Kp = Kc $(RT)^{-2}$"
    ],
    "correct": 0,
    "topic": "Relationship Between Kp and Kc",
    "chapter": "Chemical Equilibrium",
    "explain": "Kp = Kc (RT)^(Δn_g). Here, Δn_g = moles of gaseous products - moles of gaseous reactants = 2 - (2 + 1) = -1. Therefore, Kp = Kc $(RT)^{-1}$ or Kp = Kc / (RT).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-21",
    "q": "The solubility product constant (Ksp) of lead(II) chloride (PbCl2) in terms of its molar solubility 's' (in mol/L) in pure water is given by:",
    "options": [
      "Ksp = $4s^{3}$",
      "Ksp = $s^{2}$",
      "Ksp = $27s^{4}$",
      "Ksp = $2s^{2}$"
    ],
    "correct": 0,
    "topic": "Solubility Product (Ksp) Calculations",
    "chapter": "Chemical Equilibrium",
    "explain": "PbCl2(s) <=> Pb2+(aq) + 2 Cl-(aq). In saturated solution: [Pb2+] = s, [Cl-] = 2s. Ksp = [Pb2+][Cl-]^2 = (s)$(2s)^{2} =  4s^{3}$.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-22",
    "q": "For a first-order chemical reaction, the half-life period (t_1/2) is mathematically given by which expression, demonstrating that it is completely independent of initial reactant concentration ([A]0)?",
    "options": [
      "t_1/2 = 0.693 / k",
      "t_1/2 = 1 / (k [A]0)",
      "t_1/2 = [A]0 / (2k)",
      "t_1/2 = k / 0.693"
    ],
    "correct": 0,
    "topic": "First-Order Reaction Kinetics and Half-Life",
    "chapter": "Chemical Kinetics",
    "explain": "For a first-order reaction, integrating rate = -d[A]/dt = k[A] gives ln([A]0/[A]) = kt. At t = t_1/2, [A] = [A]0/2, so t_1/2 = ln(2)/k = 0.693 / k, which contains no concentration term.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-23",
    "q": "According to the Arrhenius equation, k = A · e^{-Ea / RT}, what is the slope of the linear plot of ln(k) versus (1/T)?",
    "options": [
      "-Ea / R",
      "+Ea / R",
      "-Ea / (2.303 R)",
      "-R / Ea"
    ],
    "correct": 0,
    "topic": "Arrhenius Equation and Activation Energy Plot",
    "chapter": "Chemical Kinetics",
    "explain": "Taking natural logarithm of both sides: ln(k) = ln(A) - (Ea / R)(1/T). This matches the straight-line equation y = mx + c with y = ln(k), x = 1/T, intercept c = ln(A), and slope m = -Ea / R.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-24",
    "q": "What is the overall order of a reaction whose experimental rate law is determined to be: Rate = k [A]^(3/2) [B]^(-1/2)?",
    "options": [
      "1 (First order)",
      "2 (Second order)",
      "0 (Zero order)",
      "3/2"
    ],
    "correct": 0,
    "topic": "Determination of Reaction Order",
    "chapter": "Chemical Kinetics",
    "explain": "The overall reaction order is the sum of the exponents of concentration terms in the rate law: Overall order = (3/2) + (-1/2) = 2/2 = 1 (first order overall).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-25",
    "q": "In a standard electrochemical galvanic cell (Daniel cell: Zn | Zn2+ || Cu2+ | Cu), which electrode serves as the anode where oxidation occurs, and what is its electrical polarity?",
    "options": [
      "Zinc electrode, negative polarity",
      "Copper electrode, positive polarity",
      "Zinc electrode, positive polarity",
      "Copper electrode, negative polarity"
    ],
    "correct": 0,
    "topic": "Galvanic Cells and Electrode Polarities",
    "chapter": "Electrochemistry",
    "explain": "In galvanic cells, oxidation occurs at the anode: Zn(s) -> Zn2+(aq) + 2 e-. Electrons accumulate on the zinc electrode making it negative (-) relative to the copper cathode (+), where Cu2+ reduction takes place.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-26",
    "q": "According to Faraday's second law of electrolysis, when the identical quantity of electric charge is passed through different electrolyte solutions connected in series, the masses of different substances liberated at the electrodes are directly proportional to their:",
    "options": [
      "Chemical equivalent weights (equivalent masses)",
      "Atomic numbers",
      "Electronegativity values",
      "Standard molar enthalpies of formation"
    ],
    "correct": 0,
    "topic": "Faraday's Second Law of Electrolysis",
    "chapter": "Electrochemistry",
    "explain": "Faraday's 2nd Law states that m1 / m2 = E1 / E2, where E is the chemical equivalent weight (molar mass / n). The masses of different elements deposited or liberated by the same electric charge are directly proportional to their chemical equivalents.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-27",
    "q": "Standard reduction potentials are: E°(Zn2+/Zn) = -0.76 V and E°(Ag+/Ag) = +0.80 V. What is the standard cell potential (E°_cell) for the galvanic reaction: Zn(s) + 2 Ag+(aq) -> Zn2+(aq) + 2 Ag(s)?",
    "options": [
      "+1.56 V",
      "+0.04 V",
      "-1.56 V",
      "+0.84 V"
    ],
    "correct": 0,
    "topic": "Standard Cell Potential Calculation",
    "chapter": "Electrochemistry",
    "explain": "E°_cell = E°_cathode (reduction) - E°_anode (oxidation) = E°(Ag+/Ag) - E°(Zn2+/Zn) = (+0.80 V) - (-0.76 V) = +1.56 V. Since E°_cell > 0, the reaction is spontaneous.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-28",
    "q": "What is the pH of a 0.001 M (1.0 × 10^{-3} M) aqueous solution of hydrochloric acid (HCl), assuming complete dissociation?",
    "options": [
      "3.0",
      "1.0",
      "4.0",
      "11.0"
    ],
    "correct": 0,
    "topic": "pH Calculations of Strong Acids",
    "chapter": "Acids, Bases and Salts",
    "explain": "HCl is a strong monoprotic acid; thus [H3O+] = 1.0 × 10^{-3} M. pH = -log[H3O+] = -log(1.0 × 10^{-3}) = 3.0.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-29",
    "q": "According to the Henderson-Hasselbalch equation: pH = pKa + log([Conjugate Base] / [Weak Acid]), what is the pH of an equimolar acetic acid / sodium acetate buffer solution (where [CH3COO-] = [CH3COOH]) if pKa = 4.74?",
    "options": [
      "4.74",
      "7.00",
      "5.74",
      "3.74"
    ],
    "correct": 0,
    "topic": "Buffer Solutions and Henderson-Hasselbalch Equation",
    "chapter": "Acids, Bases and Salts",
    "explain": "When conjugate base and acid concentrations are equal, [Base]/[Acid] = 1, so log(1) = 0. Therefore, pH = pKa + 0 = 4.74.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-30",
    "q": "Which of the following chemical species acts as a Lewis base according to G.N. Lewis's acid-base theory?",
    "options": [
      "Ammonia (NH3) containing a lone pair of non-bonding electrons",
      "Boron trifluoride (BF3) possessing an incomplete electron octet",
      "Aluminum chloride (AlCl3)",
      "Hydronium ion (H3O+)"
    ],
    "correct": 0,
    "topic": "Lewis Acid-Base Concepts",
    "chapter": "Acids, Bases and Salts",
    "explain": "A Lewis base is an electron pair donor. Ammonia (NH3) possesses an unshared lone pair of electrons on nitrogen available for coordinate covalent bonding, whereas BF3 and AlCl3 are electron pair acceptors (Lewis acids).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-31",
    "q": "An aqueous solution of sodium carbonate (Na2CO3) tests alkaline (pH > 7) to litmus paper because:",
    "options": [
      "The carbonate anion ($CO3^{2}$-) undergoes anionic hydrolysis, producing OH- ions in solution",
      "Sodium cations react with water to generate nascent hydrogen gas",
      "Sodium carbonate is a non-polar covalent salt",
      "Atmospheric CO2 neutralizes the base"
    ],
    "correct": 0,
    "topic": "Salt Hydrolysis and Solution pH",
    "chapter": "Acids, Bases and Salts",
    "explain": "Na2CO3 is the salt of a strong base (NaOH) and a weak diprotic acid (H2CO3). The strong conjugate base $CO3^{2}$- hydrolyzes water: $CO3^{2}$- + H2O <=> HCO3- + OH-, generating excess hydroxide ions.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-32",
    "q": "Colligative properties of a dilute solution (e.g., freezing point depression, osmotic pressure) depend strictly on:",
    "options": [
      "The number (concentration) of dissolved solute particles in a given quantity of solvent, regardless of their chemical identity",
      "The chemical reactivity and dipole moment of the solute molecules",
      "The color and viscosity of the solute",
      "The molecular mass of the container walls"
    ],
    "correct": 0,
    "topic": "Definition and Nature of Colligative Properties",
    "chapter": "Solutions and Colligative Properties",
    "explain": "Colligative properties depend exclusively on the ratio of the number of solute particles to solvent particles in a solution, and not on the chemical identity, size, or charge of the solute.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-33",
    "q": "According to Raoult's law for an ideal binary liquid mixture, the partial vapor pressure of a volatile solvent (P_A) above a solution is given by:",
    "options": [
      "P_A = x_A · P°_A",
      "P_A = x_A / P°_A",
      "P_A = P°_A - x_A",
      "P_A = x_B · P°_A"
    ],
    "correct": 0,
    "topic": "Raoult's Law for Ideal Solutions",
    "chapter": "Solutions and Colligative Properties",
    "explain": "Raoult's law states that the vapor pressure of a volatile component in a solution is directly proportional to its mole fraction (x_A) multiplied by the pure component vapor pressure (P°_A): P_A = x_A · P°_A.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-34",
    "q": "What is the van 't Hoff factor (i) for an aqueous solution of calcium chloride (CaCl2) assuming complete 100% ionic dissociation into its constituent ions?",
    "options": [
      "i = 3",
      "i = 2",
      "i = 1",
      "i = 4"
    ],
    "correct": 0,
    "topic": "van 't Hoff Factor for Electrolytes",
    "chapter": "Solutions and Colligative Properties",
    "explain": "CaCl2 dissociates as: CaCl2(s) -> Ca2+(aq) + 2 Cl-(aq). One mole of salt yields 1 mol Ca2+ + 2 mol Cl- = 3 moles of ions. Thus, the theoretical van 't Hoff factor i = 3.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-35",
    "q": "The molarity (M) of a solution prepared by dissolving 4.0 grams of sodium hydroxide (NaOH, molar mass = 40.0 g/mol) in sufficient distilled water to make 250 mL of solution is:",
    "options": [
      "0.40 M",
      "0.10 M",
      "1.00 M",
      "0.25 M"
    ],
    "correct": 0,
    "topic": "Solution Concentration Calculations - Molarity",
    "chapter": "Solutions and Colligative Properties",
    "explain": "Moles of NaOH = 4.0 g / 40.0 g/mol = 0.10 mol. Volume = 250 mL = 0.250 L. Molarity M = moles / Volume (L) = 0.10 / 0.250 = 0.40 mol/L (0.40 M).",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-36",
    "q": "Why does beryllium (Be) exhibit diagonal relationship similarities in chemical behavior with aluminum (Al)?",
    "options": [
      "Similar ionic charge-to-radius ratio (polarizing power)",
      "Identical number of valence p electrons",
      "Same principal quantum number of outer electrons",
      "Equal atomic weights"
    ],
    "correct": 0,
    "topic": "Diagonal Relationship - Be and Al",
    "chapter": "s-Block and p-Block Elements",
    "explain": "Beryllium (Group 2) and Aluminum (Group 13) exhibit similar polarizing power (charge-to-radius ratio). Both form covalent, amphoteric oxides/hydroxides, polymeric bridge halides, and withstand nitric acid passivation.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-37",
    "q": "Which alkali metal reacts directly with atmospheric nitrogen gas (N2) at room temperature or upon mild heating to form a stable ionic nitride (M3N)?",
    "options": [
      "Lithium (Li)",
      "Sodium (Na)",
      "Potassium (K)",
      "Cesium (Cs)"
    ],
    "correct": 0,
    "topic": "Anomalous Behavior of Lithium",
    "chapter": "s-Block and p-Block Elements",
    "explain": "Owing to its exceptionally small ionic radius and high lattice energy with the small nitride anion (N3-), lithium is the only alkali metal that directly combines with nitrogen to form lithium nitride (6 Li + N2 -> 2 Li3N).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-38",
    "q": "In qualitative inorganic salt analysis, which characteristic flame color is imparted to a non-luminous Bunsen flame by volatile salts of potassium (K)?",
    "options": [
      "Lilac (violet)",
      "Brick red",
      "Golden yellow",
      "Apple green"
    ],
    "correct": 0,
    "topic": "Flame Tests of s-Block Elements",
    "chapter": "s-Block and p-Block Elements",
    "explain": "Thermal excitation of s-electrons followed by relaxation emits characteristic photons: Sodium produces persistent golden yellow; Potassium gives lilac/violet (viewed through cobalt glass); Calcium gives brick red; Barium gives apple green.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-39",
    "q": "The inert pair effect in heavier p-block elements (such as Thallium, Lead, and Bismuth) refers to:",
    "options": [
      "Reluctance of outer valence s-electrons to participate in chemical bonding due to poor shielding by d and f subshells",
      "Complete unreactivity of noble gas octets",
      "Inability of p-electrons to undergo covalent hybridization",
      "Formation of stable coordinate bonds with cyanide ligands"
    ],
    "correct": 0,
    "topic": "Inert Pair Effect in Heavy p-Block Elements",
    "chapter": "s-Block and p-Block Elements",
    "explain": "Poor shielding by intervening 4f and 5d electrons causes increased effective nuclear charge, holding the outer 6s2 electron pair tightly and rendering it inert. Consequently, lower oxidation states (e.g., Tl+, Pb2+, Bi3+) are more stable than group states.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-40",
    "q": "Most transition metal complexes exhibit vibrant colors in aqueous solution primarily due to which electronic phenomenon?",
    "options": [
      "d-d electron transitions within split d-orbitals in a crystal field",
      "s to p valence emission",
      "Nuclear spin transitions",
      "Photoelectric ionization"
    ],
    "correct": 0,
    "topic": "Color of Transition Metal Complexes - d-d Transitions",
    "chapter": "Transition Elements",
    "explain": "In transition metal coordination complexes, surrounding ligands split degenerate d-orbitals into t2g and eg energy sets. Absorption of visible wavelengths promotes an electron from lower to higher d-orbitals (d-d transition), transmitting complementary color.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-41",
    "q": "What is the IUPAC name of the coordination compound [Fe(CN)6]^(4-)?",
    "options": [
      "Hexacyanoferrate(II) ion",
      "Hexacyanoferrate(III) ion",
      "Iron hexacyanide ion",
      "Cyanoferrate(VI) ion"
    ],
    "correct": 0,
    "topic": "Nomenclature of Coordination Compounds",
    "chapter": "Transition Elements",
    "explain": "Six cyanide ligands give \"hexacyano-\". For anionic complexes, the metal suffix is \"-ate\" (ferrate). Oxidation state of iron: x + 6(-1) = -4 \\implies x = +2. Thus, the IUPAC name is hexacyanoferrate(II) ion.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-42",
    "q": "Why are zinc (Zn), cadmium (Cd), and mercury (Hg) frequently considered non-typical transition elements?",
    "options": [
      "They possess completely filled d10 subshells both in their ground elemental state and common oxidation states",
      "They cannot form covalent bonds with halogens",
      "They have low boiling points and decompose in air",
      "They do not possess s-electrons"
    ],
    "correct": 0,
    "topic": "Definition and Characteristics of Transition Metals",
    "chapter": "Transition Elements",
    "explain": "By IUPAC definition, transition elements have incompletely filled d-subshells either as free elements or in common ions. Group 12 elements (Zn, Cd, Hg) have filled (n-1)d10 ns2 configurations and form d10 ions (Zn2+), lacking d-d transitions and paramagnetism.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-43",
    "q": "The paramagnetic moment of a transition metal ion with 3 unpaired electrons in its 3d subshell (e.g., Cr3+) calculated using the spin-only formula [μ = sqrt(n(n+2)) BM] is:",
    "options": [
      "3.87 Bohr Magnetons (BM)",
      "1.73 BM",
      "2.83 BM",
      "4.90 BM"
    ],
    "correct": 0,
    "topic": "Magnetic Properties and Spin-Only Formula",
    "chapter": "Transition Elements",
    "explain": "Spin-only formula: μ = sqrt(n(n+2)) BM. For n = 3 unpaired electrons: μ = sqrt(3(3+2)) = $\\sqrt{15}$ ≈ 3.87 BM.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-44",
    "q": "Which pair of organic compounds represents functional group isomerism?",
    "options": [
      "Ethanol (CH3CH2OH) and Dimethyl ether (CH3OCH3)",
      "1-Butene and 2-Butene",
      "n-Pentane and Isopentane",
      "cis-2-Butene and trans-2-Butene"
    ],
    "correct": 0,
    "topic": "Isomerism in Organic Compounds",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "explain": "Functional group isomers possess identical molecular formulas (C2H6O) but completely different functional groups: ethanol contains an alcohol group (-OH), whereas dimethyl ether contains an ether linkage (-O-).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-45",
    "q": "Which of the following organic reaction intermediates is planar, sp2 hybridized, and possesses a vacant p orbital with a formal +1 charge?",
    "options": [
      "Carbocation (carbonium ion)",
      "Carbanion",
      "Carbon free radical",
      "Carbene"
    ],
    "correct": 0,
    "topic": "Organic Reaction Intermediates",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "explain": "A carbocation has 6 valence electrons in 3 sp2 hybrid orbitals in a trigonal planar geometry ($120^\\circ$ bond angles), with an empty unhybridized p-orbital perpendicular to the molecular plane.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-46",
    "q": "According to Hückel's rule of aromaticity, a planar, cyclic, fully conjugated ring system is aromatic if it contains how many delocalized pi electrons?",
    "options": [
      "(4n + 2) pi electrons, where n is a non-negative integer (0, 1, 2, ...)",
      "4n pi electrons",
      "(2n + 1) pi electrons",
      "6n pi electrons"
    ],
    "correct": 0,
    "topic": "Hückel's Rule and Aromaticity Criteria",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "explain": "Hückel's rule states that planar monocyclic conjugated rings containing (4n + 2) pi electrons (e.g., 2, 6, 10, 14 pi electrons for n = 0, 1, 2, 3) possess closed electronic shells conferring aromatic stabilization (like benzene with 6 pi electrons, n=1).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-47",
    "q": "Homolytic fission of a covalent C-C bond by ultraviolet irradiation generates which reactive intermediate species?",
    "options": [
      "Two neutral free radicals each bearing an unpaired electron",
      "A carbocation and a carbanion",
      "A pair of coordinate zwitterions",
      "An electrophile and a nucleophile"
    ],
    "correct": 0,
    "topic": "Bond Cleavage Mechanisms",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "explain": "In homolytic cleavage (homolysis), the shared electron pair of the covalent bond is cleaved symmetrically, with one bonding electron departing with each atom to form two uncharged free radicals (R· + R·).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-48",
    "q": "According to Markovnikov's rule, when an unsymmetrical hydrogen halide (such as HBr) adds across the double bond of propene (CH3-CH=CH2), what is the major organic product formed?",
    "options": [
      "2-Bromopropane",
      "1-Bromopropane",
      "1,2-Dibromopropane",
      "Propyl hydrogen sulfate"
    ],
    "correct": 0,
    "topic": "Electrophilic Addition and Markovnikov's Rule",
    "chapter": "Hydrocarbons",
    "explain": "Electrophilic attack by H+ generates the more stable secondary carbocation (CH3-CH \\pm CH3) rather than the primary carbocation. Subsequent attack by Br- yields 2-bromopropane as the predominant Markovnikov product.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-49",
    "q": "In the nitration of benzene with concentrated nitric acid and concentrated sulfuric acid (HNO3 + H2SO4 at 50–55 °C), what is the active electrophile that attacks the benzene ring?",
    "options": [
      "Nitronium ion (NO2+)",
      "Nitrate ion (NO3-)",
      "Nitrosonium ion (NO+)",
      "Nitric acid molecule (HNO3)"
    ],
    "correct": 0,
    "topic": "Electrophilic Aromatic Substitution - Nitration",
    "chapter": "Hydrocarbons",
    "explain": "Sulfuric acid protonates nitric acid, triggering loss of water to generate the linear, electrophilic nitronium ion: HNO3 + 2 H2SO4 <=> NO2+ + H3O+ + 2 HSO4-. The NO2+ ion attacks benzene in the rate-determining step.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-50",
    "q": "When propyne (CH3-C≡CH) is hydrated in the presence of dilute sulfuric acid (H2SO4) and mercuric sulfate (HgSO4) catalyst at 60 °C, the initial enol intermediate tautomerizes to yield which final stable product?",
    "options": [
      "Acetone (Propanone)",
      "Propanal",
      "Propanoic acid",
      "1-Propanol"
    ],
    "correct": 0,
    "topic": "Hydration of Alkynes and Keto-Enol Tautomerism",
    "chapter": "Hydrocarbons",
    "explain": "Markovnikov addition of water across propyne yields prop-1-en-2-ol (an enol). Tautomerization rapidly rearranges the unstable enol into its thermodynamically favored keto tautomer, acetone (CH3COCH3).",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-51",
    "q": "Which chemical reagent is used in qualitative organic analysis to distinguish terminal alkynes (e.g., ethyne) from non-terminal alkynes (e.g., 2-butyne) by forming a heavy reddish-brown or white precipitate?",
    "options": [
      "Ammoniacal cuprous chloride or ammoniacal silver nitrate (Tollens' reagent)",
      "Bromine water in CCl4",
      "Alkaline potassium permanganate (Baeyer's reagent)",
      "Cold concentrated sulfuric acid"
    ],
    "correct": 0,
    "topic": "Acidity of Terminal Alkynes",
    "chapter": "Hydrocarbons",
    "explain": "Terminal alkynes have acidic sp-hybridized C-H protons that react with ammoniacal silver nitrate to form a white silver acetylide precipitate (AgC≡CAg) or with ammoniacal Cu2Cl2 to yield a red copper acetylide precipitate.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-52",
    "q": "In an SN2 (bimolecular nucleophilic substitution) reaction mechanism, which statement regarding stereochemistry and reaction kinetics is correct?",
    "options": [
      "Second-order kinetics (Rate = k[R-X][Nu-]) with complete Walden inversion of configuration",
      "First-order kinetics with complete racemization",
      "Second-order kinetics with retention of configuration",
      "Zero-order kinetics involving a planar carbocation intermediate"
    ],
    "correct": 0,
    "topic": "SN2 Reaction Mechanism and Stereochemistry",
    "chapter": "Alkyl Halides",
    "explain": "SN2 is a concerted bimolecular process where the nucleophile attacks from the backside of the carbon-leaving group bond, displacing the halide in a single transition state, resulting in 100% Walden inversion.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-53",
    "q": "Which alkyl halide class is most reactive toward unimolecular nucleophilic substitution (SN1) due to the resonance and hyperconjugative stabilization of its intermediate carbocation?",
    "options": [
      "Tertiary ($3^\\circ$) alkyl halides",
      "Secondary ($2^\\circ$) alkyl halides",
      "Primary ($1^\\circ$) alkyl halides",
      "Methyl halides"
    ],
    "correct": 0,
    "topic": "SN1 Reactivity and Carbocation Stability",
    "chapter": "Alkyl Halides",
    "explain": "SN1 rate depends on carbocation formation in the slow rate-determining step. $3^\\circ$ carbocations are stabilized by 9 hyperconjugative structures and inductive electron donation (+I), making $3^\\circ$ alkyl halides the most reactive.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-54",
    "q": "Grignard reagents (R-Mg-X) are organometallic compounds prepared by reacting an alkyl halide with magnesium turnings in which anhydrous solvent to prevent decomposition?",
    "options": [
      "Dry diethyl ether",
      "Ethanol",
      "Distilled water",
      "Concentrated aqueous ammonia"
    ],
    "correct": 0,
    "topic": "Grignard Reagent Preparation and Properties",
    "chapter": "Alkyl Halides",
    "explain": "Grignard reagents are strong bases and nucleophiles that react vigorously with any active hydrogen (water, alcohols) to form alkanes. Anhydrous ether stabilizes RMgX by coordinating lone pairs to magnesium.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-55",
    "q": "When 2-bromobutane is heated with alcoholic potassium hydroxide (alc. KOH), the major alkene formed according to Saytzeff's (Zaitsev's) rule is:",
    "options": [
      "2-Butene (more substituted, more stable alkene)",
      "1-Butene",
      "1,3-Butadiene",
      "Isobutylene"
    ],
    "correct": 0,
    "topic": "Dehydrohalogenation and Saytzeff's Rule",
    "chapter": "Alkyl Halides",
    "explain": "Saytzeff's rule states that in base-induced β-elimination, proton abstraction occurs predominantly from the β-carbon with fewer hydrogens, yielding the most highly substituted and thermodynamically stable alkene (2-butene).",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-56",
    "q": "The Lucas test distinguishes primary, secondary, and tertiary alcohols using anhydrous ZnCl2 and concentrated HCl. Which alcohol class forms an immediate oily emulsion/turbidity of alkyl chloride at room temperature?",
    "options": [
      "Tertiary alcohols",
      "Secondary alcohols",
      "Primary alcohols",
      "Methanol"
    ],
    "correct": 0,
    "topic": "Lucas Test for Alcohols",
    "chapter": "Alcohols and Phenols",
    "explain": "Tertiary alcohols react immediately (< 1 min) via stable $3^\\circ$ carbocations to form insoluble alkyl chlorides, creating instant turbidity. Secondary alcohols take 5–10 minutes, and primary alcohols show no turbidity at room temperature.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-57",
    "q": "Phenol is significantly more acidic than aliphatic alcohols (e.g., ethanol) primarily because:",
    "options": [
      "The phenoxide conjugate base is resonance-stabilized by delocalization of negative charge into the aromatic pi system",
      "Phenol has a higher molecular weight than ethanol",
      "Aliphatic alcohols contain stronger sp-hybridized bonds",
      "The hydroxyl oxygen in phenol carries a formal positive charge"
    ],
    "correct": 0,
    "topic": "Acidity of Phenol vs Alcohols",
    "chapter": "Alcohols and Phenols",
    "explain": "Loss of a proton from phenol yields the phenoxide ion, whose negative charge is delocalized over the ortho and para positions of the benzene ring through resonance. Alkoxide ions from aliphatic alcohols have no resonance stabilization.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-58",
    "q": "In qualitative organic chemistry, the reaction of phenol with neutral aqueous ferric chloride (FeCl3) produces which diagnostic observation?",
    "options": [
      "A characteristic violet/purple complex solution",
      "A white precipitate of barium sulfate",
      "Effervescence of carbon dioxide gas",
      "A silvery metallic mirror on the test tube walls"
    ],
    "correct": 0,
    "topic": "Qualitative Identification Tests for Phenol",
    "chapter": "Alcohols and Phenols",
    "explain": "Phenol coordinates with ferric ions to form a water-soluble coordination complex, [Fe(OC6H5)6]^(3-), which exhibits an intense violet or purple coloration, serving as a specific diagnostic test for phenolic -OH groups.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-59",
    "q": "Bromination of phenol with bromine water (Br2 / H2O) at room temperature occurs without any catalyst to yield a heavy white precipitate of which compound?",
    "options": [
      "2,4,6-Tribromophenol",
      "o-Bromophenol",
      "p-Bromophenol",
      "Bromobenzene"
    ],
    "correct": 0,
    "topic": "Electrophilic Substitution of Phenol - Bromination",
    "chapter": "Alcohols and Phenols",
    "explain": "In aqueous medium, phenol ionizes to phenoxide, which activates the aromatic ring so strongly that electrophilic bromination occurs simultaneously at all available ortho and para positions, yielding 2,4,6-tribromophenol.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-60",
    "q": "Which of the following organic reagents reacts with aldehydes upon gentle warming to deposit a bright, reflective silver mirror on the inner glass walls of the test tube?",
    "options": [
      "Tollens' reagent (ammoniacal silver nitrate solution)",
      "Benedict's solution",
      "Lucas reagent",
      "2,4-Dinitrophenylhydrazine (Brady's reagent)"
    ],
    "correct": 0,
    "topic": "Tollens' Test for Aldehydes",
    "chapter": "Aldehydes and Ketones",
    "explain": "Tollens' reagent contains [Ag(NH3)2]+. Aldehydes are readily oxidized to carboxylate anions while reducing Ag+ to metallic silver, which plates the clean glass surface as a silver mirror. Ketones do not react.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-61",
    "q": "Which structural carbonyl motif is required for an aldehyde or ketone to give a positive iodoform test (formation of yellow crystalline CHI3 precipitate upon treatment with I2 and NaOH)?",
    "options": [
      "CH3-C=O (methyl carbonyl group)",
      "CH3-CH2-C=O (ethyl ketone)",
      "Ar-C=O (aryl ketone)",
      "Formaldehyde (H-C=O)"
    ],
    "correct": 0,
    "topic": "Iodoform Test for Methyl Carbonyl Compounds",
    "chapter": "Aldehydes and Ketones",
    "explain": "The haloform/iodoform reaction requires compounds containing a methyl carbonyl group (CH3-C=O) or methyl carbinols (CH3-CH(OH)-) oxidizable to it. Base-catalyzed halogenation of the methyl group forms CHI3.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-62",
    "q": "The Cannizzaro reaction—a base-catalyzed redox disproportionation yielding an alcohol and a carboxylate salt—is exhibited exclusively by aldehydes that:",
    "options": [
      "Lack $\\alpha$-hydrogen atoms (e.g., formaldehyde, benzaldehyde)",
      "Contain at least two $\\alpha$-hydrogen atoms",
      "Possess an $\\alpha$-beta unsaturated double bond",
      "Are sterically hindered secondary ketones"
    ],
    "correct": 0,
    "topic": "Cannizzaro Reaction Mechanism",
    "chapter": "Aldehydes and Ketones",
    "explain": "Aldehydes lacking α-hydrogens (such as HCHO and C6H5CHO) cannot undergo aldol condensation. Under concentrated base (50% NaOH), one molecule is oxidized to carboxylate while another is reduced to alcohol (disproportionation).",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-63",
    "q": "In the nucleophilic addition of hydrogen cyanide (HCN) to acetaldehyde, what is the initial rate-determining step of the mechanism?",
    "options": [
      "Attack of the cyanide ion (CN-) on the electrophilic carbonyl carbon",
      "Protonation of the carbonyl oxygen by HCN",
      "Elimination of water to form an alkene",
      "Enolization of acetaldehyde"
    ],
    "correct": 0,
    "topic": "Nucleophilic Addition to Carbonyl Groups",
    "chapter": "Aldehydes and Ketones",
    "explain": "HCN is a weak acid; base generates nucleophilic cyanide ion (:CN-). In the slow step, :CN- attacks the partially positive carbonyl carbon of acetaldehyde, forming an intermediate tetrahedral alkoxide ion.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-64",
    "q": "Carboxylic acids possess higher boiling points than alcohols of comparable molecular weight because carboxylic acid molecules:",
    "options": [
      "Form stable, cyclic, hydrogen-bonded dimers in both liquid and vapor phases",
      "Possess nonpolar hydrocarbon chains that pack into crystal lattices",
      "Undergo self-ionization into carbocations",
      "Decompose into volatile anhydride gases at low temperature"
    ],
    "correct": 0,
    "topic": "Physical Properties - Hydrogen-Bonded Dimers",
    "chapter": "Carboxylic Acids",
    "explain": "Carboxylic acids form strong intermolecular hydrogen bonds between the carbonyl oxygen of one molecule and the hydroxyl hydrogen of another, assembling into cyclic dimeric pairs requiring significant thermal energy to vaporize.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-65",
    "q": "In the Fischer esterification of ethanoic acid with ethanol in the presence of concentrated H2SO4 catalyst, where does the oxygen atom in the departing water molecule originate from?",
    "options": [
      "Exclusively from the -OH group of the carboxylic acid",
      "Exclusively from the -OH group of the alcohol",
      "Equally split between both reactants",
      "From the sulfuric acid catalyst molecule"
    ],
    "correct": 0,
    "topic": "Mechanism of Fischer Esterification",
    "chapter": "Carboxylic Acids",
    "explain": "Isotopic labeling studies (using 18O-labeled alcohol R-18OH) demonstrated that nucleophilic attack of the alcohol oxygen on the protonated carbonyl carbon leads to elimination of the carboxylic acid's -OH group as water.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-66",
    "q": "Which chlorosubstituted ethanoic acid exhibits the highest acid dissociation constant (Ka) and lowest pKa value due to electron-withdrawing inductive effects (-I effect)?",
    "options": [
      "Trichloroacetic acid (CCl3COOH)",
      "Dichloroacetic acid (CHCl2COOH)",
      "Monochloroacetic acid (CH2ClCOOH)",
      "Acetic acid (CH3COOH)"
    ],
    "correct": 0,
    "topic": "Inductive Effect and Carboxylic Acid Strength",
    "chapter": "Carboxylic Acids",
    "explain": "Three strongly electronegative chlorine atoms pull electron density away via inductive effect (-I effect), dispersing the negative charge on the carboxylate anion (CCl3COO-), dramatically stabilizing it and making CCl3COOH the strongest acid.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-67",
    "q": "When an aliphatic carboxylic acid is heated with phosphorus pentachloride (PCl5) or thionyl chloride (SOCl2), which reactive acid derivative is formed?",
    "options": [
      "Acyl chloride (Acid chloride, R-COCl)",
      "Acid anhydride",
      "Ester",
      "Amide"
    ],
    "correct": 0,
    "topic": "Preparation of Acyl Halides",
    "chapter": "Carboxylic Acids",
    "explain": "Reaction of carboxylic acids with SOCl2, PCl3, or PCl5 substitutes the -OH group with chlorine, yielding acyl chlorides (R-COCl). SOCl2 is preferred industrially because gaseous byproducts (SO2 and HCl) escape cleanly.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-68",
    "q": "What is the electrical state and net molecular charge of an amino acid at its characteristic isoelectric point (pI)?",
    "options": [
      "It exists predominantly as a dipolar zwitterion with net charge of zero",
      "It carries a net positive charge and migrates to the cathode",
      "It carries a net negative charge and migrates to the anode",
      "It is completely uncharged and non-ionized"
    ],
    "correct": 0,
    "topic": "Zwitterion Structure and Isoelectric Point",
    "chapter": "Amino Acids and Proteins",
    "explain": "At the isoelectric point (pI), the amino acid exists as a zwitterion (+H3N-CHR-COO-) where the positive charge on the ammonium group balances the negative charge on the carboxylate group, resulting in net zero charge.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-69",
    "q": "Which of the following 20 standard proteinogenic $\\alpha$-amino acids is optically inactive (achiral) because its $\\alpha$-carbon is bonded to two identical hydrogen atoms?",
    "options": [
      "Glycine",
      "L-Alanine",
      "L-Leucine",
      "L-Phenylalanine"
    ],
    "correct": 0,
    "topic": "Chirality and Optical Activity in Amino Acids",
    "chapter": "Amino Acids and Proteins",
    "explain": "Glycine (H2N-CH2-COOH) has an R-group of -H. Its $\\alpha$-carbon is bonded to two hydrogens, lacking an asymmetric stereocenter, rendering glycine the sole achiral and optically inactive standard amino acid.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-70",
    "q": "The peptide bond (-CO-NH-) that covalently links amino acid residues in polypeptides exhibits partial double-bond character because of:",
    "options": [
      "Resonance delocalization of the nitrogen lone pair into the carbonyl pi system, preventing free rotation",
      "Direct overlapping of nitrogen d-orbitals with carbon",
      "Rapid tautomerism with water molecules",
      "Ionic attraction between adjacent terminal $\\alpha$-amines"
    ],
    "correct": 0,
    "topic": "Peptide Bond Geometry and Resonance",
    "chapter": "Amino Acids and Proteins",
    "explain": "The peptide linkage possesses ~40% double bond character due to resonance between O=C-N and -O-C=N+. This confers planarity to the six-atom peptide unit and restricts free rotation around the C-N bond.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-71",
    "q": "Which qualitative reagent gives a characteristic deep blue-violet coloration upon heating with free $\\alpha$-amino acids or proteins?",
    "options": [
      "Ninhydrin reagent",
      "Molisch reagent",
      "Barfoed reagent",
      "Fehling solution"
    ],
    "correct": 0,
    "topic": "Ninhydrin Reaction for Amino Acids",
    "chapter": "Amino Acids and Proteins",
    "explain": "Ninhydrin (triketohydrindene hydrate) oxidatively decarboxylates and deaminates α-amino acids, yielding Ruhemann's purple (a deep blue-violet chromophore absorbing at 570 nm).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-72",
    "q": "Nylon-6,6 is an industrially important synthetic condensation polyamide synthesized from which two stoichiometric monomers?",
    "options": [
      "Adipic acid (hexanedioic acid) and Hexamethylenediamine (1,6-diaminohexane)",
      "Terephthalic acid and Ethylene glycol",
      "Phenol and Formaldehyde",
      "Caprolactam and Styrene"
    ],
    "correct": 0,
    "topic": "Synthetic Condensation Polymers - Polyamides",
    "chapter": "Macromolecules and Environmental Chemistry",
    "explain": "Nylon-6,6 is synthesized via step-growth condensation polymerization of adipic acid (a 6-carbon dicarboxylic acid) and hexamethylenediamine (a 6-carbon diamine), releasing water at each amide linkage.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-73",
    "q": "In the stratosphere, synthetic chlorofluorocarbons (CFCs) deplete the protective ozone layer through a free radical catalytic cycle initiated by which radical generated by solar UV photolysis?",
    "options": [
      "Chlorine free radical (Cl·)",
      "Fluorine radical (F·)",
      "Hydroxyl radical (·OH)",
      "Carbon radical (·CH3)"
    ],
    "correct": 0,
    "topic": "Stratospheric Ozone Depletion Mechanisms",
    "chapter": "Macromolecules and Environmental Chemistry",
    "explain": "UV radiation cleaves C-Cl bonds in CFCs: CF2Cl2 + hν -> CF2Cl· + Cl·. The reactive chlorine free radical destroys ozone in a chain cycle: Cl· + O3 -> ClO· + O2; ClO· + O -> Cl· + O2, destroying thousands of ozone molecules.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-74",
    "q": "Photochemical smog, typically formed in sunny urban environments with heavy vehicular emissions, is primarily characterized by secondary oxidants such as:",
    "options": [
      "Peroxyacetyl nitrate (PAN), ozone (O3), and aldehydes",
      "Sulfur dioxide (SO2) and carbon soot particles",
      "Pure molecular nitrogen gas",
      "Methane and water vapor"
    ],
    "correct": 0,
    "topic": "Photochemical Smog Components",
    "chapter": "Macromolecules and Environmental Chemistry",
    "explain": "Photochemical (oxidizing) smog forms when nitrogen oxides (NOx) and unburned hydrocarbons react under solar UV radiation to produce powerful secondary photochemical oxidants: ozone (O3), peroxyacetyl nitrate (PAN), and acrolein.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b7-chem-75",
    "q": "Acid rain has a pH typically below 5.6 and is primarily caused by atmospheric dissolution of which industrial anthropogenic acidic gases?",
    "options": [
      "Sulfur dioxide (SO2) and nitrogen oxides (NO and NO2)",
      "Carbon monoxide (CO) and methane (CH4)",
      "Chlorofluorocarbons (CFCs)",
      "Argon and helium"
    ],
    "correct": 0,
    "topic": "Acid Rain Formation and Environmental Impact",
    "chapter": "Macromolecules and Environmental Chemistry",
    "explain": "Combustion of fossil fuels releases SO2 and NOx, which are oxidized in atmospheric water droplets by hydrogen peroxide to form sulfuric acid (H2SO4) and nitric acid (HNO3), lowering rain pH well below unpolluted rain (pH 5.6).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "universities": [
      "MDCAT"
    ]
  }
];

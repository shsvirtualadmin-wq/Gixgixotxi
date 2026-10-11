import { Question } from '../types';

export const MDCAT_CHEMISTRY_NEW_QUESTIONS: Question[] = [
  {
    "id": "mdcat-new-chem-1",
    "q": "How many molecules are present in 18 grams of pure liquid water (H₂O)?",
    "options": [
      "6.02 × $10^{23}$ molecules",
      "3.01 × $10^{23}$ molecules",
      "1.204 × $10^{24}$ molecules",
      "18 × $10^{23}$ molecules"
    ],
    "correct": 0,
    "topic": "Fundamental Concepts of Chemistry",
    "explain": "The molar mass of H₂O is (2 × 1) + 16 = 18 g/mol. 18 g equals exactly 1 mole of water, which contains Avogadro's number (6.022 × $10^{23}$) of molecules.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Fundamental Concepts of Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-2",
    "q": "What is the volume occupied by 4.4 grams of carbon dioxide (CO₂) gas at standard temperature and pressure (STP)?",
    "options": [
      "2.24 $dm^{3}$",
      "4.40 $dm^{3}$",
      "22.4 $dm^{3}$",
      "0.224 $dm^{3}$"
    ],
    "correct": 0,
    "topic": "Fundamental Concepts of Chemistry",
    "explain": "Molar mass of CO₂ = 12 + 32 = 44 g/mol. Number of moles = 4.4 g / 44 g/mol = 0.1 mol. At STP, 1 mole occupies 22.4 $dm^{3}$, so 0.1 mol occupies 0.1 * 22.4 = 2.24 $dm^{3}$.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Fundamental Concepts of Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-3",
    "q": "A compound contains 40% Carbon, 6.7% Hydrogen, and 53.3% Oxygen by mass. What is its empirical formula?",
    "options": [
      "CH₂O",
      "C₂H₄O",
      "CHO₂",
      "C₂H₂O"
    ],
    "correct": 0,
    "topic": "Fundamental Concepts of Chemistry",
    "explain": "Moles of C = 40/12 = 3.33; Moles of H = 6.7/1 = 6.7; Moles of O = 53.3/16 = 3.33. Dividing by lowest (3.33): C = 1, H = 2, O = 1. Empirical formula is CH₂O.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Fundamental Concepts of Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-4",
    "q": "In the combustion reaction 2C₂H₆ + 7O₂ -> 4CO₂ + 6H₂O, how many moles of CO₂ are produced when 3 moles of C₂H₆ react with 7 moles of O₂?",
    "options": [
      "4 moles",
      "6 moles",
      "2 moles",
      "8 moles"
    ],
    "correct": 0,
    "topic": "Fundamental Concepts of Chemistry",
    "explain": "According to stoichiometry, 7 moles of O₂ require 2 moles of C₂H₆ to react completely and produce 4 moles of CO₂. Since 3 moles of C₂H₆ are provided, O₂ is the limiting reactant, yielding exactly 4 moles of CO₂.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Fundamental Concepts of Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-5",
    "q": "According to the Pauli Exclusion Principle, no two electrons in an atom can have the same:",
    "options": [
      "Set of all four quantum numbers",
      "Principal quantum number n",
      "Magnetic quantum number m",
      "Spin quantum number s alone"
    ],
    "correct": 0,
    "topic": "Atomic Structure",
    "explain": "The Pauli Exclusion Principle states that no two electrons in an isolated atom can share an identical set of all four quantum numbers (n, l, m, s).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Atomic Structure",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-6",
    "q": "Which spectral series of the hydrogen emission spectrum lies in the visible electromagnetic region?",
    "options": [
      "Balmer series",
      "Lyman series",
      "Paschen series",
      "Brackett series"
    ],
    "correct": 0,
    "topic": "Atomic Structure",
    "explain": "Transitions terminating on the n=2 principal energy level produce the Balmer series, which falls in the visible range (400 - 700 nm). Lyman series is in the UV region, while Paschen and Brackett are in the infrared region.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Atomic Structure",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-7",
    "q": "What is the maximum number of electrons that can be accommodated in a subshell characterized by azimuthal quantum number l = 2?",
    "options": [
      "10 electrons",
      "6 electrons",
      "2 electrons",
      "14 electrons"
    ],
    "correct": 0,
    "topic": "Atomic Structure",
    "explain": "The azimuthal quantum number l = 2 represents a d-subshell. Maximum electrons = 2(2l + 1) = 2(2*2 + 1) = 2(5) = 10 electrons.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Atomic Structure",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-8",
    "q": "What is the correct ground-state electronic configuration of the Chromium atom (Cr, Z = 24)?",
    "options": [
      "[Ar] $4s^{1}$ 3d⁵",
      "[Ar] $4s^{2}3d^{4}$",
      "[Ar] $4s^{0}$ 3d⁶",
      "[Ar] 3d⁶"
    ],
    "correct": 0,
    "topic": "Atomic Structure",
    "explain": "Due to the extra thermodynamic stability associated with a half-filled d-subshell (exchange energy and symmetry), one electron from the 4s orbital shifts to 3d, giving [Ar] $4s^{1}$ 3d⁵ instead of [Ar] $4s^{2}3d^{4}$.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Atomic Structure",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-9",
    "q": "At constant temperature, the volume of a fixed mass of gas is inversely proportional to its pressure. This fundamental gas law is known as:",
    "options": [
      "Boyle's Law",
      "Charles's Law",
      "Avogadro's Law",
      "Graham's Law"
    ],
    "correct": 0,
    "topic": "Gases",
    "explain": "Boyle's Law states that at constant temperature, P * V = constant (V ∝ 1/P). Charles's Law relates volume and temperature at constant pressure.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Gases",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-10",
    "q": "Under which thermodynamic conditions does a real gas behave most like an ideal gas?",
    "options": [
      "High temperature and low pressure",
      "Low temperature and high pressure",
      "High temperature and high pressure",
      "Low temperature and low pressure"
    ],
    "correct": 0,
    "topic": "Gases",
    "explain": "At high temperatures, kinetic energy dominates over intermolecular attractions; at low pressures, gas volume is large, making intermolecular volume negligible. Thus, real gases approach ideal behavior.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Gases",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-11",
    "q": "According to Graham's Law of Diffusion, the relative rate of diffusion of Hydrogen gas (H₂, molar mass = 2 g/mol) compared to Oxygen gas (O₂, molar mass = 32 g/mol) is:",
    "options": [
      "4 times faster",
      "16 times faster",
      "2 times faster",
      "0.25 times as fast"
    ],
    "correct": 0,
    "topic": "Gases",
    "explain": "r(H₂) / r(O₂) = √(M(O₂) / M(H₂)) = $\\sqrt${32 / 2} = $\\sqrt${16} = 4. Hydrogen diffuses 4 times faster than oxygen.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Gases",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-12",
    "q": "In the van der Waals equation for real gases [P + ($an^{2} / V^{2}$)](V - nb) = nRT, the constant \"a\" accounts for:",
    "options": [
      "Intermolecular forces of attraction between gas molecules",
      "The finite effective volume of individual gas molecules",
      "The average kinetic energy of gas molecules",
      "The molecular mass of the gas particles"
    ],
    "correct": 0,
    "topic": "Gases",
    "explain": "The parameter \"a\" corrects for attractive intermolecular forces (cohesive forces that reduce impact pressure on vessel walls), whereas \"b\" accounts for the finite physical volume occupied by molecules.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Gases",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-13",
    "q": "Which of the following substances forms a three-dimensional network covalent solid with an exceptionally high melting point?",
    "options": [
      "Diamond",
      "Ice",
      "Dry ice (solid CO₂)",
      "Sodium chloride"
    ],
    "correct": 0,
    "topic": "Liquids and Solids",
    "explain": "Diamond consists of $sp^{3}$-hybridized carbon atoms linked by strong covalent bonds in an infinite 3D tetrahedral network, resulting in an extremely rigid structure and high melting point (> 3500°C).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Liquids and Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-14",
    "q": "What is the primary intermolecular force responsible for the unusually high boiling point of liquid water compared to hydrogen sulfide (H₂S)?",
    "options": [
      "Extensive intermolecular hydrogen bonding",
      "London dispersion forces",
      "Dipole-induced dipole interactions",
      "Coordinate covalent bonding"
    ],
    "correct": 0,
    "topic": "Liquids and Solids",
    "explain": "The high electronegativity difference between oxygen and hydrogen produces strong hydrogen bonds between water molecules, which requires substantial thermal energy to break compared to the weaker dipole interactions in H₂S.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Liquids and Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-15",
    "q": "Liquid vapor pressure increases with temperature because:",
    "options": [
      "A greater fraction of surface molecules possess kinetic energy exceeding the latent heat of vaporization barrier",
      "Atmospheric pressure decreases as temperature rises",
      "Intermolecular bonding becomes stronger at higher temperatures",
      "Liquid density increases with thermal expansion"
    ],
    "correct": 0,
    "topic": "Liquids and Solids",
    "explain": "Increasing temperature broadens the Maxwell-Boltzmann kinetic energy distribution, so an exponentially larger fraction of liquid molecules have sufficient kinetic energy to overcome attractive intermolecular forces and escape into the vapor phase.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Liquids and Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-16",
    "q": "How many total chloride ions (Cl⁻) surround each sodium ion (Na⁺) in a face-centered cubic crystal lattice of rock salt (NaCl)?",
    "options": [
      "6",
      "8",
      "4",
      "12"
    ],
    "correct": 0,
    "topic": "Liquids and Solids",
    "explain": "In the NaCl lattice, each Na⁺ cation sits in an octahedral interstitial void surrounded by 6 Cl⁻ anions, and vice-versa, giving an octahedral coordination number of 6:6.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Liquids and Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-17",
    "q": "For an exothermic chemical reaction taking place at constant pressure, what is the sign of the enthalpy change (ΔH)?",
    "options": [
      "Negative (ΔH < 0)",
      "Positive (ΔH > 0)",
      "Zero (ΔH = 0)",
      "Undefined"
    ],
    "correct": 0,
    "topic": "Chemical Energetics",
    "explain": "In an exothermic reaction, heat is released to the surroundings because the total enthalpy of products is lower than that of reactants (H_products < H_reactants), so ΔH is negative.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Chemical Energetics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-18",
    "q": "Which thermodynamic law states that the total enthalpy change of a chemical reaction is independent of the pathway taken, depending only on the initial and final states?",
    "options": [
      "Hess's Law of Constant Heat Summation",
      "First Law of Thermodynamics",
      "Le Chatelier's Principle",
      "Raoult's Law"
    ],
    "correct": 0,
    "topic": "Chemical Energetics",
    "explain": "Hess's Law states that because enthalpy is a state function, the overall ΔH for a reaction is identical whether the process occurs in one step or through a multi-step sequence.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Chemical Energetics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-19",
    "q": "Under what conditions is a chemical reaction always spontaneous at all temperatures?",
    "options": [
      "ΔH is negative and ΔS is positive",
      "ΔH is positive and ΔS is negative",
      "Both ΔH and ΔS are positive",
      "Both ΔH and ΔS are negative"
    ],
    "correct": 0,
    "topic": "Chemical Energetics",
    "explain": "Gibbs free energy change is given by ΔG = ΔH - TΔS. If ΔH < 0 (exothermic) and ΔS > 0 (entropy increase), both terms contribute negatively, making ΔG strictly negative (spontaneous) at all temperatures.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Chemical Energetics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-20",
    "q": "Calculate the standard enthalpy of formation of methane, CH₄(g), given the following combustion enthalpies: ΔHc°(C, graphite) = -393.5 kJ/mol, ΔHc°(H₂, g) = -285.8 kJ/mol, ΔHc°(CH₄, g) = -890.3 kJ/mol.",
    "options": [
      "-74.8 kJ/mol",
      "+74.8 kJ/mol",
      "-211.0 kJ/mol",
      "+890.3 kJ/mol"
    ],
    "correct": 0,
    "topic": "Chemical Energetics",
    "explain": "Formation: C + 2H₂ -> CH₄. ΔHf° = ΔHc°(C) + 2*ΔHc°(H₂) - ΔHc°(CH₄) = -393.5 + 2(-285.8) - (-890.3) = -393.5 - 571.6 + 890.3 = -965.1 + 890.3 = -74.8 kJ/mol.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Chemical Energetics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-21",
    "q": "What is the only experimental variable that changes the numerical value of the equilibrium constant (Kc) for a given reversible reaction?",
    "options": [
      "Temperature",
      "Pressure",
      "Concentration of reactants",
      "Presence of a catalyst"
    ],
    "correct": 0,
    "topic": "Chemical Equilibrium",
    "explain": "The equilibrium constant Kc depends solely on temperature. Changes in pressure, volume, concentration, or the addition of a catalyst shift the equilibrium position without changing the Kc value itself.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Chemical Equilibrium",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-22",
    "q": "For the Haber process reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH = -92 kJ/mol), how does increasing the total pressure affect the equilibrium position?",
    "options": [
      "Equilibrium shifts to the right (favoring NH₃ formation)",
      "Equilibrium shifts to the left (favoring N₂ and H₂)",
      "Equilibrium remains unaffected",
      "The equilibrium constant Kc increases"
    ],
    "correct": 0,
    "topic": "Chemical Equilibrium",
    "explain": "According to Le Chatelier's principle, increasing pressure shifts equilibrium towards the side with fewer gas moles (2 moles of NH₃ vs 4 moles of reactants), thereby increasing ammonia yield.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Chemical Equilibrium",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-23",
    "q": "For which of the following reactions does Kc = Kp?",
    "options": [
      "H₂(g) + I₂(g) ⇌ 2HI(g)",
      "PCl₅(g) ⇌ PCl₃(g) + Cl₂(g)",
      "2SO₂(g) + O₂(g) ⇌ 2SO₃(g)",
      "N₂(g) + 3H₂(g) ⇌ 2NH₃(g)"
    ],
    "correct": 0,
    "topic": "Chemical Equilibrium",
    "explain": "Kp = Kc(RT)^(Δn). When change in gas moles Δn = moles of products - moles of reactants = 0, (RT)^{0} = 1 and Kp = Kc. For H₂ + I₂ ⇌ 2HI, Δn = 2 - 2 = 0.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Chemical Equilibrium",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-24",
    "q": "If the solubility product constant (Ksp) of AgCl is 1.0 × 10^{-1}⁰ at 25°C, what is its molar solubility in pure water?",
    "options": [
      "1.0 × 10⁻⁵ M",
      "1.0 × 10^{-1}⁰ M",
      "2.0 × 10⁻⁵ M",
      "1.0 × 10⁻²⁰ M"
    ],
    "correct": 0,
    "topic": "Chemical Equilibrium",
    "explain": "AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq). Ksp = [Ag⁺][Cl⁻] = s * s = $s^{2}$. Thus, molar solubility s = $\\sqrt${Ksp} = $\\sqrt${1.0 × 10^{-1}⁰} = 1.0 × 10⁻⁵ mol/$dm^{3}$.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Chemical Equilibrium",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-25",
    "q": "In an electrochemical cell, oxidation always occurs at which electrode?",
    "options": [
      "Anode",
      "Cathode",
      "Salt bridge",
      "Standard hydrogen electrode only"
    ],
    "correct": 0,
    "topic": "Electrochemistry",
    "explain": "By definition, the anode is the electrode where oxidation (loss of electrons) takes place in both galvanic (voltaic) and electrolytic cells.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Electrochemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-26",
    "q": "What is the primary function of the salt bridge (containing inert electrolytes like KCl or KNO₃ in agar) in a Daniell galvanic cell?",
    "options": [
      "Maintains electrical neutrality in both half-cell compartments by ion migration",
      "Provides a direct pathway for electrons to flow between half-cells",
      "Increases the standard cell potential by oxidizing zinc ions",
      "Prevents any chemical equilibrium from ever being reached"
    ],
    "correct": 0,
    "topic": "Electrochemistry",
    "explain": "The salt bridge allows anions and cations to migrate between half-cells to neutralize accumulating charges, preventing polarization and maintaining circuit continuity without mixing solutions.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Electrochemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-27",
    "q": "Given standard reduction potentials: E°($Zn^{2}$⁺/Zn) = -0.76 V and E°($Cu^{2}$⁺/Cu) = +0.34 V. What is the standard cell potential (E°cell) for the galvanic reaction Zn + $Cu^{2}$⁺ -> $Zn^{2}$⁺ + Cu?",
    "options": [
      "+1.10 V",
      "-1.10 V",
      "+0.42 V",
      "-0.42 V"
    ],
    "correct": 0,
    "topic": "Electrochemistry",
    "explain": "E°cell = E°cathode (reduction) - E°anode (oxidation) = E°($Cu^{2}$⁺/Cu) - E°($Zn^{2}$⁺/Zn) = (+0.34 V) - (-0.76 V) = +1.10 V.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Electrochemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-28",
    "q": "How many Coulombs of electric charge are required to electrodeposit 1 mole of aluminum metal from molten Al₂O₃? (Take 1 Faraday = 96,500 C)",
    "options": [
      "289,500 C (3 F)",
      "96,500 C (1 F)",
      "193,000 C (2 F)",
      "579,000 C (6 F)"
    ],
    "correct": 0,
    "topic": "Electrochemistry",
    "explain": "Reduction of aluminum requires 3 electrons per ion: $Al^{3}$⁺ + 3e⁻ -> Al. Therefore, producing 1 mole of Al requires 3 moles of electrons = 3 Faradays = 3 * 96,500 C = 289,500 C.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Electrochemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-29",
    "q": "A catalyst increases the rate of a chemical reaction primarily by:",
    "options": [
      "Providing an alternative reaction pathway with lower activation energy",
      "Increasing the overall enthalpy change (ΔH) of the reaction",
      "Increasing the equilibrium constant Kc",
      "Decreasing the kinetic energy of reacting molecules"
    ],
    "correct": 0,
    "topic": "Chemical Kinetics",
    "explain": "A catalyst lowers the activation energy barrier (Ea) by providing an alternative mechanism, enabling a larger fraction of reactant collisions to be effective at a given temperature.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Chemical Kinetics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-30",
    "q": "What are the SI units of the rate constant (k) for a first-order chemical reaction?",
    "options": [
      "s^{-1}",
      "mol·dm⁻³·s^{-1}",
      "mol^{-1}·$dm^{3}$·s^{-1}",
      "mol⁻²·dm⁶·s^{-1}"
    ],
    "correct": 0,
    "topic": "Chemical Kinetics",
    "explain": "For rate = k[A]¹, Rate has units (mol·dm⁻³·s^{-1}) and [A] has units (mol·dm⁻³). Thus, k = Rate / [A] = s^{-1}.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Chemical Kinetics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-31",
    "q": "For the reaction A + 2B -> Products, doubling the concentration of A quadruples the rate, while doubling the concentration of B has no effect on the rate. What is the overall order of the reaction?",
    "options": [
      "Second order",
      "First order",
      "Third order",
      "Zero order"
    ],
    "correct": 0,
    "topic": "Chemical Kinetics",
    "explain": "Rate ∝ [A]^m [B]^n. Doubling [A] quadruples the rate ($2^{m}$ = 4 \\implies m = 2). Doubling [B] has no effect ($2^{n}$ = 1 \\implies n = 0). Overall order = 2 + 0 = 2.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Chemical Kinetics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-32",
    "q": "For a first-order reaction with rate constant k = 0.0693 min^{-1}, how much time is required for the reactant concentration to decrease to 25% of its initial value?",
    "options": [
      "20 minutes",
      "10 minutes",
      "30 minutes",
      "40 minutes"
    ],
    "correct": 0,
    "topic": "Chemical Kinetics",
    "explain": "Half-life t1/2 = 0.693 / k = 0.693 / 0.0693 = 10 minutes. Decreasing to 25% requires 2 half-lives (100% -> 50% -> 25%), taking 2 * 10 = 20 minutes.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Chemical Kinetics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-33",
    "q": "Which of the following is a colligative property of a dilute solution?",
    "options": [
      "Osmotic pressure",
      "Viscosity",
      "Surface tension",
      "Refractive index"
    ],
    "correct": 0,
    "topic": "Solutions and Colligative Properties",
    "explain": "Colligative properties depend solely on the total number (concentration) of dissolved solute particles, not on their chemical identity. The four standard colligative properties are: vapor pressure lowering, boiling point elevation, freezing point depression, and osmotic pressure.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Solutions and Colligative Properties",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-34",
    "q": "What is the molarity of a solution prepared by dissolving 4.0 grams of NaOH (molar mass = 40 g/mol) in enough water to make 250 $cm^{3}$ of solution?",
    "options": [
      "0.40 M",
      "0.10 M",
      "1.00 M",
      "0.04 M"
    ],
    "correct": 0,
    "topic": "Solutions and Colligative Properties",
    "explain": "Moles of NaOH = 4.0 / 40 = 0.1 mol. Volume = 250 $cm^{3}$ = 0.250 $dm^{3}$. Molarity = moles / volume in $dm^{3}$ = 0.1 / 0.25 = 0.40 M.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Solutions and Colligative Properties",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-35",
    "q": "Which of the following 0.1 m aqueous solutions will exhibit the lowest freezing point?",
    "options": [
      "0.1 m AlCl₃",
      "0.1 m NaCl",
      "0.1 m CaCl₂",
      "0.1 m Glucose"
    ],
    "correct": 0,
    "topic": "Solutions and Colligative Properties",
    "explain": "Freezing point depression ΔTf = i * Kf * m. AlCl₃ dissociates into 4 ions (1 $Al^{3}$⁺ + 3 Cl⁻, i = 4), producing the highest effective particle concentration and therefore the greatest depression, resulting in the lowest freezing point.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Solutions and Colligative Properties",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-36",
    "q": "According to Raoult's Law, the relative lowering of vapor pressure (ΔP / P°) for a dilute solution of a non-volatile, non-electrolyte solute is equal to the:",
    "options": [
      "Mole fraction of the solute",
      "Mole fraction of the solvent",
      "Molarity of the solution",
      "Molality of the solvent"
    ],
    "correct": 0,
    "topic": "Solutions and Colligative Properties",
    "explain": "Raoult's Law states that ΔP / P° = x₂, where x₂ is the mole fraction of the non-volatile solute in the solution.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Solutions and Colligative Properties",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-37",
    "q": "According to the Bronsted-Lowry acid-base theory, an acid is defined as a:",
    "options": [
      "Proton (H⁺) donor",
      "Proton (H⁺) acceptor",
      "Electron-pair donor",
      "Hydroxide ion (OH⁻) donor"
    ],
    "correct": 0,
    "topic": "Acids, Bases and Salts",
    "explain": "Bronsted-Lowry theory defines an acid as a chemical species capable of donating a proton (H⁺) to a base (proton acceptor).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Acids, Bases and Salts",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-38",
    "q": "What is the pH of a 1.0 × 10⁻⁴ M aqueous solution of hydrochloric acid (HCl)?",
    "options": [
      "4.0",
      "10.0",
      "7.0",
      "1.0"
    ],
    "correct": 0,
    "topic": "Acids, Bases and Salts",
    "explain": "HCl is a strong monoprotic acid that dissociates completely: [H⁺] = 1.0 × 10⁻⁴ M. pH = -log[H⁺] = -log(10⁻⁴) = 4.0.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Acids, Bases and Salts",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-39",
    "q": "Which pair of substances forms an effective acidic buffer solution?",
    "options": [
      "CH₃COOH and CH₃COONa",
      "HCl and NaCl",
      "NaOH and CH₃COONa",
      "NH₄OH and NH₄Cl"
    ],
    "correct": 0,
    "topic": "Acids, Bases and Salts",
    "explain": "An acidic buffer consists of a weak acid (CH₃COOH) and its conjugate base salt formed with a strong base (CH₃COONa). NH₄OH/NH₄Cl is a basic buffer.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Acids, Bases and Salts",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-40",
    "q": "According to the Henderson-Hasselbalch equation, what is the pH of a buffer solution containing 0.1 M ethanoic acid and 0.1 M sodium ethanoate if the pKa of ethanoic acid is 4.76?",
    "options": [
      "4.76",
      "5.76",
      "3.76",
      "7.00"
    ],
    "correct": 0,
    "topic": "Acids, Bases and Salts",
    "explain": "pH = pKa + log([Salt] / [Acid]). When [Salt] = [Acid], log(0.1 / 0.1) = log(1) = 0. Therefore, pH = pKa = 4.76.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Acids, Bases and Salts",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-41",
    "q": "Why do alkali metals (Group 1: Li, Na, K, Rb, Cs) exhibit only a +1 oxidation state in their compounds?",
    "options": [
      "They have a single valence electron ($ns^{1}$) with an exceptionally large second ionization energy",
      "They have completely filled p-orbitals in their valence shell",
      "Their atomic radii are the smallest in their respective periods",
      "They readily gain 7 electrons to complete their octet"
    ],
    "correct": 0,
    "topic": "s-Block and p-Block Elements",
    "explain": "Alkali metals possess an $ns^{1}$ valence configuration. Removing the first electron leaves a stable noble gas core, requiring immense energy to remove a second electron (IE₂ >> IE₁).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "s-Block and p-Block Elements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-42",
    "q": "Which halogen exists as a reddish-brown liquid at standard room temperature and pressure?",
    "options": [
      "Bromine (Br₂)",
      "Chlorine (Cl₂)",
      "Iodine (I₂)",
      "Fluorine (F₂)"
    ],
    "correct": 0,
    "topic": "s-Block and p-Block Elements",
    "explain": "At 25°C and 1 atm, Bromine is a volatile reddish-brown liquid. Fluorine and chlorine are gases, while iodine is a dark purplish-black solid.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "s-Block and p-Block Elements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-43",
    "q": "What is the correct order of thermal stability of alkaline earth metal carbonates (Group 2: BeCO₃ to BaCO₃)?",
    "options": [
      "BeCO₃ < MgCO₃ < CaCO₃ < SrCO₃ < BaCO₃",
      "BaCO₃ < SrCO₃ < CaCO₃ < MgCO₃ < BeCO₃",
      "CaCO₃ < BeCO₃ < MgCO₃ < BaCO₃ < SrCO₃",
      "All Group 2 carbonates have identical thermal stability"
    ],
    "correct": 0,
    "topic": "s-Block and p-Block Elements",
    "explain": "As ionic radius increases down the group from $Be^{2}$⁺ to $Ba^{2}$⁺, charge density decreases, causing less polarizing distortion of the large carbonate (CO₃²⁻) anion. Thus, thermal stability increases down the group.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "s-Block and p-Block Elements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-44",
    "q": "Why does hydrofluoric acid (HF) have a significantly higher boiling point than hydrochloric acid (HCl), despite HCl having a larger molecular mass?",
    "options": [
      "Strong intermolecular hydrogen bonding between electronegative fluorine and hydrogen atoms in HF",
      "Greater London dispersion forces in HF molecules",
      "HF dissociates into free ionic radicals at room temperature",
      "Fluorine forms coordinate covalent bonds in aqueous solution"
    ],
    "correct": 0,
    "topic": "s-Block and p-Block Elements",
    "explain": "Fluorine is the most electronegative element, forming strong intermolecular hydrogen bonds in HF (forming zig-zag polymeric chains), leading to an anomalously high boiling point compared to HCl.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "s-Block and p-Block Elements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-45",
    "q": "Why do most transition metal complexes display vivid colors in aqueous solutions?",
    "options": [
      "d-d electron transitions within split d-orbitals",
      "s-p electron transitions",
      "Nuclear spin transitions",
      "Complete absence of d-electrons"
    ],
    "correct": 0,
    "topic": "Transition Elements",
    "explain": "In transition metal complexes, ligands split degenerate d-orbitals into lower and higher energy levels (crystal field splitting). Absorption of visible light photons promotes electrons between these split d-orbitals (d-d transition), imparting complementary color.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Transition Elements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-46",
    "q": "Which of the following transition metal ions is diamagnetic (repelled by magnetic fields)?",
    "options": [
      "$Zn^{2}$⁺ ([Ar] $3d^{10}$)",
      "$Fe^{3}$⁺ ([Ar] 3d⁵)",
      "$Cu^{2}$⁺ ([Ar] 3d⁹)",
      "$Cr^{3}$⁺ ([Ar] $3d^{3}$)"
    ],
    "correct": 0,
    "topic": "Transition Elements",
    "explain": "$Zn^{2}$⁺ has an electronic configuration of [Ar] $3d^{10}$, with all five 3d orbitals completely filled and zero unpaired electrons, making it diamagnetic. $Fe^{3}$⁺, $Cu^{2}$⁺, and $Cr^{3}$⁺ have unpaired electrons and are paramagnetic.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Transition Elements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-47",
    "q": "What is the coordination number of the central cobalt ion in the complex ion [Co(NH₃)₄Cl₂]⁺?",
    "options": [
      "6",
      "4",
      "2",
      "5"
    ],
    "correct": 0,
    "topic": "Transition Elements",
    "explain": "The coordination number is the total number of coordinate covalent bonds formed by ligands with the central metal ion. Here, 4 monodentate ammine ligands (NH₃) and 2 monodentate chlorido ligands (Cl⁻) give a coordination number of 4 + 2 = 6.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Transition Elements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-48",
    "q": "In the redox titration of oxalic acid with potassium permanganate (KMnO₄) in acidic medium, what acts as the autocatalyst as the reaction proceeds?",
    "options": [
      "$Mn^{2}$⁺ ions produced during reduction",
      "K⁺ ions in solution",
      "Excess sulfuric acid",
      "Water molecules formed as a byproduct"
    ],
    "correct": 0,
    "topic": "Transition Elements",
    "explain": "The reaction between MnO₄⁻ and C₂O₄²⁻ is initially sluggish, but accelerates rapidly because the $Mn^{2}$⁺ ions produced act as an autocatalyst for the reaction.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Transition Elements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-49",
    "q": "What is the hybridization state of the carbon atoms in ethyne (acetylene, HC≡CH)?",
    "options": [
      "sp",
      "$sp^{2}$",
      "$sp^{3}$",
      "$dsp^{2}$"
    ],
    "correct": 0,
    "topic": "Fundamental Principles of Organic Chemistry",
    "explain": "In ethyne, each carbon atom forms two σ bonds (one with H and one with C) and two π bonds. Two hybrid orbitals correspond to sp hybridization with a linear geometry ($180^\\circ$ bond angle).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-50",
    "q": "Which type of structural isomerism is exhibited by 1-propanol and 2-propanol?",
    "options": [
      "Positional isomerism",
      "Chain isomerism",
      "Functional group isomerism",
      "Metamerism"
    ],
    "correct": 0,
    "topic": "Fundamental Principles of Organic Chemistry",
    "explain": "1-propanol and 2-propanol share the same carbon skeleton (propane) and functional group (-OH), but differ only in the position of the hydroxyl group on the carbon chain (C1 vs C2), exhibiting position isomerism.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-51",
    "q": "Which of the following organic molecules exhibits optical isomerism (enantiomerism)?",
    "options": [
      "2-chlorobutane",
      "1-chlorobutane",
      "2-chloropropane",
      "Ethanol"
    ],
    "correct": 0,
    "topic": "Fundamental Principles of Organic Chemistry",
    "explain": "Optical activity requires an asymmetric (chiral) carbon atom bonded to 4 distinct groups. In 2-chlorobutane, C2 is bonded to -H, -Cl, -CH₃, and -CH₂CH₃, making it chiral and optically active.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-52",
    "q": "What is the correct IUPAC name of the compound CH₃-CH(CH₃)-CH₂-C≡CH?",
    "options": [
      "4-methyl-1-pentyne",
      "2-methyl-4-pentyne",
      "4-methylpent-2-yne",
      "2-methylpent-1-yne"
    ],
    "correct": 0,
    "topic": "Fundamental Principles of Organic Chemistry",
    "explain": "The carbon chain is numbered from the end nearest to the triple bond to give the alkyne the lowest locant (C1). The methyl substituent is at C4. Hence, 4-methyl-1-pentyne.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Fundamental Principles of Organic Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-53",
    "q": "What type of reaction do alkanes typically undergo under photochemical or thermal conditions?",
    "options": [
      "Free-radical substitution",
      "Electrophilic addition",
      "Nucleophilic substitution",
      "Electrophilic aromatic substitution"
    ],
    "correct": 0,
    "topic": "Hydrocarbons",
    "explain": "Alkanes are saturated hydrocarbons containing strong C-C and C-H sigma bonds with low polarity. Under UV light, homolytic fission generates free radicals, resulting in free-radical substitution reactions.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Hydrocarbons",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-54",
    "q": "According to Markovnikov's Rule, when hydrogen bromide (HBr) adds across propene (CH₃-CH=CH₂), the major product formed is:",
    "options": [
      "2-bromopropane",
      "1-bromopropane",
      "1,2-dibromopropane",
      "2-bromopropene"
    ],
    "correct": 0,
    "topic": "Hydrocarbons",
    "explain": "Markovnikov's rule states that the electrophilic proton (H⁺) adds to the double-bond carbon with more hydrogen atoms (C1), producing a more stable secondary carbocation intermediate (CH₃-CH⁺-CH₃), which then reacts with Br⁻ to yield 2-bromopropane.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Hydrocarbons",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-55",
    "q": "Which reagent is used in the laboratory to distinguish between a terminal alkyne (like 1-butyne) and an internal alkyne (like 2-butyne)?",
    "options": [
      "Ammoniacal silver nitrate solution (Tollens' reagent)",
      "Bromine water (Br₂ in CCl₄)",
      "Dilute alkaline KMnO₄ (Baeyer's reagent)",
      "Acidified potassium dichromate (K₂Cr₂O₇)"
    ],
    "correct": 0,
    "topic": "Hydrocarbons",
    "explain": "Terminal alkynes have weakly acidic acetylenic hydrogens (≡C-H) that react with Tollens' reagent to yield a white precipitate of silver acetylide (Ag-C≡C-R). Internal alkynes lack acidic terminal hydrogens and show no precipitate.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Hydrocarbons",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-56",
    "q": "Why does benzene undergo electrophilic substitution reactions rather than electrophilic addition reactions under normal conditions?",
    "options": [
      "Substitution preserves the exceptionally stable aromatic sextet of delocalized pi electrons",
      "Benzene lacks double bonds in its chemical structure",
      "Addition reactions are highly endothermic for all cyclic compounds",
      "Electrophiles are repelled by the delocalized electron cloud"
    ],
    "correct": 0,
    "topic": "Hydrocarbons",
    "explain": "Benzene possesses a resonance energy of ~150.5 kJ/mol due to its delocalized 6 pi-electron aromatic system. Electrophilic addition would destroy this aromatic stability, whereas electrophilic substitution restores aromaticity.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Hydrocarbons",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-57",
    "q": "Which alkyl halide undergoes nucleophilic substitution primarily via the bimolecular SN2 pathway?",
    "options": [
      "Primary alkyl halide (e.g. 1-bromobutane)",
      "Tertiary alkyl halide (e.g. 2-bromo-2-methylpropane)",
      "Triphenylmethyl bromide",
      "Neopentyl bromide"
    ],
    "correct": 0,
    "topic": "Alkyl Halides",
    "explain": "SN2 reactions occur via a concerted, backside attack on the electrophilic carbon. Primary alkyl halides have minimal steric hindrance, making them ideal substrates for SN2 reactions.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Alkyl Halides",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-58",
    "q": "The reaction of an alkyl halide with magnesium metal in dry ether solvent yields which important organometallic reagent?",
    "options": [
      "Grignard reagent (R-Mg-X)",
      "Wurtz alkane",
      "Lucas reagent",
      "Fehling's reagent"
    ],
    "correct": 0,
    "topic": "Alkyl Halides",
    "explain": "Alkyl halides react with magnesium turnings in anhydrous ether to form alkylmagnesium halides (R-Mg-X), known as Grignard reagents.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Alkyl Halides",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-59",
    "q": "In an SN1 reaction mechanism involving an optically active chiral tertiary alkyl halide, what is the stereochemical outcome of the product?",
    "options": [
      "Racemization (with slight excess of inversion)",
      "Complete retention of configuration",
      "100% Walden inversion",
      "Formation of a meso compound only"
    ],
    "correct": 0,
    "topic": "Alkyl Halides",
    "explain": "SN1 proceeds through a planar, achiral $sp^{2}$-hybridized carbocation intermediate. Nucleophilic attack can occur from either face with almost equal probability, resulting in racemization.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Alkyl Halides",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-60",
    "q": "When 2-bromobutane is heated with alcoholic potassium hydroxide (KOH), what is the major elimination product according to Zaitsev's Rule?",
    "options": [
      "2-butene (trans/cis mixture)",
      "1-butene",
      "1-butanol",
      "2-butanol"
    ],
    "correct": 0,
    "topic": "Alkyl Halides",
    "explain": "Under base-induced dehydrohalogenation, Zaitsev's rule predicts the preferred formation of the more substituted, thermodynamically stable alkene. Elimination yields 2-butene (disubstituted) as the major product rather than 1-butene (monosubstituted).",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Alkyl Halides",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-61",
    "q": "Why is phenol significantly more acidic than aliphatic alcohols like ethanol?",
    "options": [
      "The phenoxide anion formed by deprotonation is stabilized by resonance delocalization into the aromatic ring",
      "Phenol contains an $sp^{3}$ hybridized carbon attached to the -OH group",
      "Ethanol has a higher molecular mass than phenol",
      "The oxygen atom in phenol is less electronegative"
    ],
    "correct": 0,
    "topic": "Alcohols and Phenols",
    "explain": "Loss of a proton from phenol yields the phenoxide ion, whose negative charge is resonance-delocalized over the ortho and para positions of the benzene ring, stabilizing the anion and increasing acidity.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Alcohols and Phenols",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-62",
    "q": "Which chemical reagent is used in the Lucas test to distinguish among primary, secondary, and tertiary alcohols based on cloudiness/turbidity formation?",
    "options": [
      "Anhydrous ZnCl₂ and concentrated HCl",
      "Alkaline iodine solution",
      "Acidified KMnO₄",
      "Neutral FeCl₃ solution"
    ],
    "correct": 0,
    "topic": "Alcohols and Phenols",
    "explain": "Lucas reagent is a solution of anhydrous zinc chloride (ZnCl₂) in concentrated hydrochloric acid. Tertiary alcohols react immediately forming insoluble alkyl chlorides (turbidity), secondary alcohols react in 5-10 minutes, and primary alcohols show turbidity only upon heating.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Alcohols and Phenols",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-63",
    "q": "When phenol is treated with excess aqueous bromine water at room temperature, what characteristic precipitate is formed?",
    "options": [
      "White precipitate of 2,4,6-tribromophenol",
      "Yellow precipitate of 4-bromophenol",
      "Red precipitate of bromobenzene",
      "No reaction without AlCl₃ catalyst"
    ],
    "correct": 0,
    "topic": "Alcohols and Phenols",
    "explain": "The hydroxyl group (-OH) is strongly activating and ortho/para-directing due to resonance donation of oxygen lone pairs. Bromine water reacts vigorously without a catalyst to substitute all ortho and para positions, yielding a white precipitate of 2,4,6-tribromophenol.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Alcohols and Phenols",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-64",
    "q": "Which carbonyl compound gives a bright silver mirror on the inner wall of a test tube when heated with Tollens' reagent?",
    "options": [
      "Ethanal (Acetaldehyde)",
      "Propanone (Acetone)",
      "Benzophenone",
      "2-pentanone"
    ],
    "correct": 0,
    "topic": "Aldehydes and Ketones",
    "explain": "Aldehydes (like Ethanal) possess a carbonyl hydrogen that is readily oxidized to a carboxylic acid by mild oxidizing agents such as Tollens' reagent [Ag(NH₃)₂]⁺, precipitating elemental silver (silver mirror). Ketones do not react.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Aldehydes and Ketones",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-65",
    "q": "Which of the following compounds produces a yellow precipitate of triiodomethane (iodoform) when treated with I₂ and aqueous NaOH?",
    "options": [
      "Ethanol and Ethanal",
      "Methanol and Methanal",
      "3-pentanone",
      "Benzaldehyde"
    ],
    "correct": 0,
    "topic": "Aldehydes and Ketones",
    "explain": "The iodoform test is specific for compounds containing a methyl carbonyl group (CH₃-C=O) or a secondary alcohol with CH₃-CH(OH)- group (such as ethanol, which oxidizes to ethanal). Methanol and 3-pentanone lack this structural unit.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Aldehydes and Ketones",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-66",
    "q": "Aldol condensation takes place only in aldehydes and ketones that possess at least one:",
    "options": [
      "$\\alpha$-hydrogen atom (α-H)",
      "$\\beta$-hydrogen atom",
      "Aromatic phenyl ring",
      "Chiral carbon center"
    ],
    "correct": 0,
    "topic": "Aldehydes and Ketones",
    "explain": "Aldol addition requires an $\\alpha$-hydrogen atom (α-H on the carbon adjacent to the carbonyl). Base abstracts the acidic α-H to generate a nucleophilic enolate resonance ion, which attacks another carbonyl molecule.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Aldehydes and Ketones",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-67",
    "q": "What gas is effervescently liberated when a carboxylic acid reacts with sodium bicarbonate (NaHCO₃)?",
    "options": [
      "Carbon dioxide (CO₂)",
      "Hydrogen (H₂)",
      "Carbon monoxide (CO)",
      "Oxygen (O₂)"
    ],
    "correct": 0,
    "topic": "Carboxylic Acids",
    "explain": "Carboxylic acids are stronger acids than carbonic acid (H₂CO₃), decomposing sodium bicarbonate to form a carboxylate salt, water, and brisk effervescence of carbon dioxide gas (CO₂).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Carboxylic Acids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-68",
    "q": "In the acid-catalyzed esterification reaction between ethanoic acid and ethanol, what is the chemical role of concentrated sulfuric acid (H₂SO₄)?",
    "options": [
      "Acts as an acid catalyst and a dehydrating agent",
      "Acts as a reducing agent",
      "Acts as a base to neutralize ethanoic acid",
      "Acts as a nucleophile"
    ],
    "correct": 0,
    "topic": "Carboxylic Acids",
    "explain": "Concentrated H₂SO₄ protonates the carbonyl oxygen, making the carbonyl carbon more electrophilic towards ethanol attack. It also absorbs water as a dehydrating agent, shifting equilibrium toward the ester product.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Carboxylic Acids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-69",
    "q": "What is the correct order of acid strength among ethanoic acid and its chloro-substituted derivatives?",
    "options": [
      "Trichloroethanoic acid > Dichloroethanoic acid > Chloroethanoic acid > Ethanoic acid",
      "Ethanoic acid > Chloroethanoic acid > Dichloroethanoic acid > Trichloroethanoic acid",
      "Chloroethanoic acid > Dichloroethanoic acid > Trichloroethanoic acid > Ethanoic acid",
      "All chloroacetic acids have identical acidity"
    ],
    "correct": 0,
    "topic": "Carboxylic Acids",
    "explain": "Chlorine is strongly electronegative and exerts an electron-withdrawing inductive effect (-I effect) that delocalizes and stabilizes the negative charge of the conjugate carboxylate anion. Greater chlorine substitution increases acid strength.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Carboxylic Acids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-70",
    "q": "Which amino acid is the only naturally occurring proteinogenic amino acid that lacks a chiral carbon center and is optically inactive?",
    "options": [
      "Glycine",
      "Alanine",
      "Valine",
      "Proline"
    ],
    "correct": 0,
    "topic": "Amino Acids and Proteins",
    "explain": "Glycine has a hydrogen atom (-H) as its side chain (R-group). Since its $\\alpha$-carbon is bonded to two identical hydrogen atoms, it is achiral and optically inactive.",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Amino Acids and Proteins",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-71",
    "q": "At its characteristic isoelectric point (pI), an amino acid exists predominantly in aqueous solution as a dipolar ion known as a:",
    "options": [
      "Zwitterion",
      "Carbocation",
      "Free radical",
      "Carbanion"
    ],
    "correct": 0,
    "topic": "Amino Acids and Proteins",
    "explain": "At the isoelectric point, internal proton transfer from the carboxylic acid group (-COOH) to the basic amino group (-NH₂) forms a dipolar species (+H₃N-CH(R)-COO⁻) called a zwitterion, with zero net electrical charge.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Amino Acids and Proteins",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-72",
    "q": "What type of chemical linkage stabilizes the $\\alpha$-helix and $\\beta$-pleated sheet secondary structures of proteins?",
    "options": [
      "Hydrogen bonds between carbonyl oxygen (C=O) and amide hydrogen (N-H) of the peptide backbone",
      "Disulfide covalent bonds between methionine residues",
      "Hydrophobic interactions between lipid side chains",
      "Coordinate covalent bonds with metal cofactors"
    ],
    "correct": 0,
    "topic": "Amino Acids and Proteins",
    "explain": "Secondary protein structures ($\\alpha$-helices and $\\beta$-sheets) are stabilized by regular hydrogen bonds formed between the carbonyl oxygen (C=O) of one peptide bond and the amino hydrogen (N-H) of another in the polypeptide backbone.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Amino Acids and Proteins",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-73",
    "q": "Nylon-6,6 is an example of which category of synthetic polymer?",
    "options": [
      "Condensation polyamide",
      "Addition polyolefin",
      "Natural carbohydrate polymer",
      "Cross-linked elastomer"
    ],
    "correct": 0,
    "topic": "Macromolecules and Environmental Chemistry",
    "explain": "Nylon-6,6 is formed by the condensation polymerization of hexamethylenediamine and adipic acid with the elimination of water molecules, forming repeating amide linkages (-CO-NH-).",
    "difficulty": "Easy",
    "subject": "Chemistry",
    "chapter": "Macromolecules and Environmental Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-74",
    "q": "Which atmospheric pollutant gas binds to blood hemoglobin with an affinity roughly 200 times greater than oxygen, causing tissue hypoxia and asphyxiation?",
    "options": [
      "Carbon monoxide (CO)",
      "Carbon dioxide (CO₂)",
      "Sulfur dioxide (SO₂)",
      "Nitric oxide (NO)"
    ],
    "correct": 0,
    "topic": "Macromolecules and Environmental Chemistry",
    "explain": "Carbon monoxide (CO) binds competitively to the iron(II) center of hemoglobin to form carboxyhemoglobin, which has a 200-fold higher binding affinity than oxygen, blocking oxygen delivery.",
    "difficulty": "Medium",
    "subject": "Chemistry",
    "chapter": "Macromolecules and Environmental Chemistry",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-chem-75",
    "q": "In the catalytic depletion of stratospheric ozone (O₃) by chlorofluorocarbons (CFCs), which reactive intermediate acts as the chain-propagating free-radical catalyst?",
    "options": [
      "Chlorine free radical (Cl•)",
      "Fluoride anion (F⁻)",
      "Chloride anion (Cl⁻)",
      "Methylene radical (CH₂•)"
    ],
    "correct": 0,
    "topic": "Macromolecules and Environmental Chemistry",
    "explain": "UV photolysis of CFCs releases chlorine free radicals (Cl•). Cl• attacks ozone: Cl• + O₃ -> ClO• + O₂, and ClO• reacts with atomic oxygen: ClO• + O -> Cl• + O₂, regenerating Cl• to destroy thousands of ozone molecules.",
    "difficulty": "Hard",
    "subject": "Chemistry",
    "chapter": "Macromolecules and Environmental Chemistry",
    "universities": [
      "MDCAT"
    ]
  }
];

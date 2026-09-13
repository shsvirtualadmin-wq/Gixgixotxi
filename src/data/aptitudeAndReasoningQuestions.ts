import { Question } from '../types';

/**
 * High-yield Aptitude, Analytical, and Scientific Reasoning Questions
 * Specifically tailored for:
 * 1. IBA Karachi Aptitude Test (English & Mathematics)
 * 2. LUMS LCAT (Verbal Reasoning & Quantitative Reasoning)
 * 3. NTS NAT (Verbal, Analytical & Quantitative Reasoning)
 * 4. Aga Khan University (AKU) Science Reasoning & Mathematical Reasoning
 */

export const APTITUDE_QUANT_QUESTIONS: Question[] = [
  {
    id: 'apt-quant-1',
    subject: 'Quantitative Reasoning',
    topic: 'Algebra & Functions',
    q: 'If f(x) = 3x² - 5x + 2, what is the value of f(x - 1)?',
    options: ['3x² - 11x + 10', '3x² - 5x + 10', '3x² - 11x + 4', '3x² - 6x + 2'],
    correct: 0,
    explain: 'f(x - 1) = 3(x - 1)² - 5(x - 1) + 2 = 3(x² - 2x + 1) - 5x + 5 + 2 = 3x² - 6x + 3 - 5x + 7 = 3x² - 11x + 10.'
  },
  {
    id: 'apt-quant-2',
    subject: 'Quantitative Reasoning',
    topic: 'Arithmetic & Percentages',
    q: 'A merchant increases the price of an article by 25% and then offers a discount of 20% on the new price. What is the net percentage change in the original price?',
    options: ['5% increase', '0% (No change)', '5% decrease', '2.5% increase'],
    correct: 1,
    explain: 'Let initial price = 100. Increased price = 100 * 1.25 = 125. After 20% discount = 125 * (1 - 0.20) = 125 * 0.80 = 100. The net change is 0%.'
  },
  {
    id: 'apt-quant-3',
    subject: 'Quantitative Reasoning',
    topic: 'Work & Rates',
    q: 'Worker A can complete a task in 12 hours, while Worker B can complete the same task in 18 hours. If they work together for 4 hours, what fraction of the task remains uncompleted?',
    options: ['4/9', '5/9', '1/3', '2/3'],
    correct: 0,
    explain: 'Combined rate = 1/12 + 1/18 = (3 + 2)/36 = 5/36 per hour. In 4 hours, work done = 4 * (5/36) = 20/36 = 5/9. Remaining fraction = 1 - 5/9 = 4/9.'
  },
  {
    id: 'apt-quant-4',
    subject: 'Quantitative Reasoning',
    topic: 'Geometry & Coordinate Geometry',
    q: 'What is the distance between the parallel lines 3x + 4y - 12 = 0 and 3x + 4y + 8 = 0?',
    options: ['2 units', '4 units', '5 units', '20 units'],
    correct: 1,
    explain: 'Distance between parallel lines Ax + By + C1 = 0 and Ax + By + C2 = 0 is |C1 - C2| / √(A² + B²) = |-12 - 8| / √(3² + 4²) = 20 / 5 = 4 units.'
  },
  {
    id: 'apt-quant-5',
    subject: 'Quantitative Reasoning',
    topic: 'Probability & Combinatorics',
    q: 'In how many distinct ways can the letters of the word "EQUATION" be arranged such that all vowels appear together?',
    options: ['720', '1,440', '2,880', '5,760'],
    correct: 2,
    explain: 'Vowels in EQUATION are E, U, A, I, O (5 vowels). Consonants are Q, T, N (3 consonants). Treating the 5 vowels as a single block gives 4 units (block + 3 consonants), arranged in 4! = 24 ways. The 5 vowels inside the block can be arranged in 5! = 120 ways. Total = 24 * 120 = 2,880.'
  },
  {
    id: 'apt-quant-6',
    subject: 'Quantitative Reasoning',
    topic: 'Number Theory',
    q: 'What is the remainder when 7¹⁰² is divided by 25?',
    options: ['1', '7', '18', '24'],
    correct: 3,
    explain: 'Euler totient φ(25) = 20. By Euler theorem, 7²⁰ ≡ 1 (mod 25). 102 = 5 * 20 + 2, so 7¹⁰² ≡ (7²⁰)⁵ * 7² ≡ 1⁵ * 49 ≡ 49 (mod 25) ≡ 24.'
  },
  {
    id: 'apt-quant-7',
    subject: 'Quantitative Reasoning',
    topic: 'Ratios & Mixtures',
    q: 'A container has 60 liters of a mixture of milk and water in the ratio 3:1. How much water must be added so that the ratio of milk to water becomes 2:1?',
    options: ['7.5 liters', '10 liters', '12 liters', '15 liters'],
    correct: 0,
    explain: 'Milk = (3/4)*60 = 45 L, Water = (1/4)*60 = 15 L. Let added water = W. 45 / (15 + W) = 2/1 => 2(15 + W) = 45 => 30 + 2W = 45 => 2W = 15 => W = 7.5 liters.'
  },
  {
    id: 'apt-quant-8',
    subject: 'Quantitative Reasoning',
    topic: 'Speed, Time & Distance',
    q: 'A train 150 meters long traveling at 72 km/h crosses a bridge in 20 seconds. What is the length of the bridge?',
    options: ['200 m', '250 m', '300 m', '350 m'],
    correct: 1,
    explain: 'Speed = 72 * (5/18) = 20 m/s. Total distance in 20 s = 20 * 20 = 400 m. Length of bridge = 400 - 150 = 250 m.'
  },
  {
    id: 'apt-quant-9',
    subject: 'Quantitative Reasoning',
    topic: 'Inequalities & Absolute Values',
    q: 'What is the complete solution set for the inequality |2x - 7| ≤ 5?',
    options: ['[1, 6]', '(-∞, 1] ∪ [6, ∞)', '[2, 5]', '(-1, 6)'],
    correct: 0,
    explain: '|2x - 7| ≤ 5 means -5 ≤ 2x - 7 ≤ 5. Adding 7: 2 ≤ 2x ≤ 12. Dividing by 2: 1 ≤ x ≤ 6, or interval [1, 6].'
  },
  {
    id: 'apt-quant-10',
    subject: 'Quantitative Reasoning',
    topic: 'Sequences & Series',
    q: 'The sum of the first n terms of an arithmetic progression is given by S_n = 2n² + 3n. What is the 10th term (a₁₀)?',
    options: ['39', '41', '43', '45'],
    correct: 1,
    explain: 'a_n = S_n - S_(n-1). S₁₀ = 2(100) + 3(10) = 230. S₉ = 2(81) + 3(9) = 162 + 27 = 189. a₁₀ = 230 - 189 = 41.'
  },
  {
    id: 'apt-quant-11',
    subject: 'Quantitative Reasoning',
    topic: 'Quadratic Equations',
    q: 'If the roots of x² - (k + 2)x + (k² - 4) = 0 are real and equal, what are the possible values of k?',
    options: ['k = -2 or k = 10/3', 'k = 4 or k = -2', 'k = 2 only', 'k = 0 or k = 4'],
    correct: 0,
    explain: 'Discriminant D = b² - 4ac = 0 => (k + 2)² - 4(1)(k² - 4) = 0 => (k+2)[(k+2) - 4(k-2)] = (k+2)(-3k+10) = 0 => k = -2 or k = 10/3.'
  },
  {
    id: 'apt-quant-12',
    subject: 'Quantitative Reasoning',
    topic: 'Data Analysis & Statistics',
    q: 'In a class of 30 students, the average score on a test is 74. When the top two scores are excluded, the average drops to 72. What is the average of the two highest scores?',
    options: ['98', '102', '104', '106'],
    correct: 1,
    explain: 'Total score = 30 * 74 = 2220. Total score of remaining 28 students = 28 * 72 = 2016. Sum of top two scores = 2220 - 2016 = 204. Average = 204 / 2 = 102.'
  },
  {
    id: 'apt-quant-13',
    subject: 'Quantitative Reasoning',
    topic: 'Geometry & Trigonometry',
    q: 'A right-angled triangle has legs of lengths (x - 3) and (x + 4), and a hypotenuse of (2x - 5). What is the perimeter of the triangle?',
    options: ['24', '30', '36', '40'],
    correct: 3,
    explain: '(x - 3)² + (x + 4)² = (2x - 5)² => x² - 6x + 9 + x² + 8x + 16 = 4x² - 20x + 25 => 2x² - 22x = 0 => x = 11. Sides: 8, 15, 17. Perimeter = 8 + 15 + 17 = 40.'
  },
  {
    id: 'apt-quant-14',
    subject: 'Quantitative Reasoning',
    topic: 'Exponents & Logarithms',
    q: 'If log₂(x) + log₄(x) = 6, what is the value of x?',
    options: ['8', '16', '32', '64'],
    correct: 1,
    explain: 'log₄(x) = log₂(x) / log₂(4) = log₂(x) / 2. So log₂(x) + (1/2)log₂(x) = (3/2)log₂(x) = 6 => log₂(x) = 4 => x = 2⁴ = 16.'
  },
  {
    id: 'apt-quant-15',
    subject: 'Quantitative Reasoning',
    topic: 'Probability',
    q: 'Two fair six-sided dice are rolled simultaneously. What is the probability that the product of the two numbers is even?',
    options: ['1/4', '1/2', '3/4', '5/6'],
    correct: 2,
    explain: 'Product is odd only when both dice show odd numbers. P(both odd) = (3/6) * (3/6) = 1/4. Therefore, P(product is even) = 1 - 1/4 = 3/4.'
  }
];

export const APTITUDE_VERBAL_QUESTIONS: Question[] = [
  {
    id: 'apt-verb-1',
    subject: 'Verbal Reasoning',
    topic: 'Vocabulary in Context',
    q: 'Select the word that is most nearly OPPOSITE in meaning to EPHEMERAL:',
    options: ['Transitory', 'Permanent', 'Evanescent', 'Fleeting'],
    correct: 1,
    explain: 'Ephemeral means lasting for a very short time. Permanent means lasting indefinitely, which is the direct antonym.'
  },
  {
    id: 'apt-verb-2',
    subject: 'Verbal Reasoning',
    topic: 'Analogies',
    q: 'ANOMALY : PARADIGM ::',
    options: ['Error : Protocol', 'Mutiny : Allegiance', 'Outlier : Norm', 'Hypothesis : Proof'],
    correct: 2,
    explain: 'An anomaly is a deviation from a standard paradigm; similarly, an outlier is a data point or element that deviates from the established norm.'
  },
  {
    id: 'apt-verb-3',
    subject: 'Verbal Reasoning',
    topic: 'Sentence Completion',
    q: 'The professor\'s lecture was so _______ that even students with little background in astrophysics found the complex concepts surprisingly _______.',
    options: ['pedantic ... convoluted', 'lucid ... comprehensible', 'abstruse ... accessible', 'esoteric ... confusing'],
    correct: 1,
    explain: 'The sentence structure contrasts high complexity with ease of understanding. "Lucid" (clear) and "comprehensible" (understandable) fit logically.'
  },
  {
    id: 'apt-verb-4',
    subject: 'Verbal Reasoning',
    topic: 'Sentence Correction & Grammar',
    q: 'Identify the grammatically correct sentence:',
    options: [
      'Neither the principal nor the teachers was present at the ceremony.',
      'Neither the principal nor the teachers were present at the ceremony.',
      'Neither the principal or the teachers was present at the ceremony.',
      'Neither the principal nor the teachers has been present at the ceremony.'
    ],
    correct: 1,
    explain: 'In correlative conjunctions with "neither... nor...", the verb agrees in number with the closer subject ("teachers", which is plural), requiring "were".'
  },
  {
    id: 'apt-verb-5',
    subject: 'Verbal Reasoning',
    topic: 'Critical Reading & Logical Deduction',
    q: 'Premise: "All sustainable agricultural projects require regulated water allocation. No project with unregulated water allocation qualifies for government subsidies." Which of the following must be true?',
    options: [
      'All projects qualifying for government subsidies are sustainable agricultural projects.',
      'Any sustainable agricultural project that receives government subsidies must regulate its water allocation.',
      'Regulating water allocation guarantees government subsidies.',
      'Projects lacking government subsidies cannot regulate their water allocation.'
    ],
    correct: 1,
    explain: 'A sustainable project requires regulated water, and subsidies require regulated water. Thus, any sustainable project receiving subsidies must have regulated water.'
  },
  {
    id: 'apt-verb-6',
    subject: 'Verbal Reasoning',
    topic: 'Error Identification',
    q: 'Select the part of the sentence containing an error: "The committee has [A] decided to postpone [B] the review because neither of the candidates [C] have completed the portfolio [D]."',
    options: ['[A]', '[B]', '[C]', '[D]'],
    correct: 3,
    explain: '"Neither of the candidates" is grammatically singular and requires the singular verb "has completed" instead of "have completed".'
  },
  {
    id: 'apt-verb-7',
    subject: 'Verbal Reasoning',
    topic: 'Vocabulary in Context',
    q: 'Choose the word that best completes the sentence: "Despite repeated warnings, the contractor displayed a _______ disregard for municipal safety regulations."',
    options: ['flagrant', 'circumspect', 'plausible', 'redundant'],
    correct: 0,
    explain: '"Flagrant" means conspicuously and outrageously offensive or blatant, which collocated with "disregard for safety regulations".'
  },
  {
    id: 'apt-verb-8',
    subject: 'Verbal Reasoning',
    topic: 'Reading Comprehension',
    q: 'Passage excerpt: "Economic resilience hinges not upon insularity, but upon diversification of supply chains and rapid modular reconfiguration." According to the passage, an economy that seeks resilience should:',
    options: [
      'Isolate its domestic markets from external trade dependencies.',
      'Develop multi-sourced supply pathways capable of swift operational adaptation.',
      'Eliminate all supply chain foreign trade partners.',
      'Standardize production into immutable, rigid manufacturing channels.'
    ],
    correct: 1,
    explain: 'The passage explicitly rejects insularity (isolation) and advocates diversification and modular reconfiguration.'
  }
];

export const AKU_SCIENCE_REASONING_QUESTIONS: Question[] = [
  {
    id: 'aku-sci-1',
    subject: 'Science Reasoning',
    topic: 'Enzyme Kinetics & Experimental Data',
    q: 'In an experiment measuring enzymatic activity, the reaction velocity V increases linearly with substrate concentration [S] at low concentrations, but plateaus at V_max at high concentrations. When an unknown compound X is added, V_max remains unchanged but the apparent K_m increases twofold. Compound X is best classified as:',
    options: ['A competitive inhibitor', 'A non-competitive inhibitor', 'An uncompetitive inhibitor', 'An irreversible allosteric inactivator'],
    correct: 0,
    explain: 'Competitive inhibitors compete directly with substrate for the catalytic active site. They do not alter V_max (which can still be reached at saturating [S]) but increase the apparent Michaelis constant (K_m).'
  },
  {
    id: 'aku-sci-2',
    subject: 'Science Reasoning',
    topic: 'Physiological Systems & Feedback Loops',
    q: 'A clinical study measures blood arterial pH and partial pressure of CO₂ (PaCO₂) in an acutely hyperventilating patient. The data shows pH = 7.52 and PaCO₂ = 28 mmHg (normal: 35-45 mmHg). What physiological disturbance and compensatory response are represented?',
    options: [
      'Respiratory acidosis with renal bicarbonate retention',
      'Respiratory alkalosis; compensation occurs through increased renal excretion of HCO₃⁻',
      'Metabolic alkalosis with respiratory hypoventilation',
      'Metabolic acidosis with hyperventilation'
    ],
    correct: 1,
    explain: 'Elevated pH (>7.45) indicates alkalosis, and low PaCO₂ (<35 mmHg) indicates excessive respiratory blowing off of carbon dioxide (respiratory alkalosis). Kidneys compensate slowly by eliminating bicarbonate.'
  },
  {
    id: 'aku-sci-3',
    subject: 'Science Reasoning',
    topic: 'Cellular Respiration & Metabolic Pathways',
    q: 'An isolated mitochondrial suspension is provided with pyruvate and inorganic phosphate in the presence of oxygen. Upon addition of oligomycin, ATP synthesis ceases completely, and oxygen consumption drops significantly. Subsequently, adding DNP (2,4-dinitrophenol) restores oxygen consumption without restoring ATP synthesis. Which conclusion is supported?',
    options: [
      'DNP directly catalyzes ATP formation in the matrix.',
      'DNP acts as an uncoupler by dissipating the proton gradient across the inner membrane.',
      'Oligomycin inhibits electron transport directly at Complex I.',
      'DNP prevents oxygen from binding to Cytochrome c oxidase.'
    ],
    correct: 1,
    explain: 'DNP is a lipid-soluble proton ionophore that transports H⁺ across the inner mitochondrial membrane, dissipating the electrochemical proton gradient (uncoupling electron transport from ATP synthase).'
  },
  {
    id: 'aku-sci-4',
    subject: 'Science Reasoning',
    topic: 'Genetics & Pedigree Analysis',
    q: 'A rare neurological disorder affects both males and females in a pedigree. An affected father and unaffected mother have 3 affected daughters and 2 unaffected sons. All daughters inherit the condition, but sons do not. The mode of inheritance is most likely:',
    options: ['Autosomal recessive', 'X-linked dominant', 'X-linked recessive', 'Y-linked holandric'],
    correct: 1,
    explain: 'An affected father passes his mutated X chromosome to all daughters (making them affected under dominant inheritance) and his Y chromosome to all sons (making them unaffected).'
  },
  {
    id: 'aku-sci-5',
    subject: 'Science Reasoning',
    topic: 'Chemical Equilibrium & Le Chatelier',
    q: 'For the exothermic equilibrium N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH = -92 kJ/mol), which manipulation will increase both the equilibrium yield of NH₃ and the forward reaction rate?',
    options: [
      'Increasing temperature at constant pressure',
      'Increasing total pressure by reducing reaction volume at optimal temperature',
      'Adding an inert gas (Helium) at constant volume',
      'Adding a catalyst without changing temperature or pressure'
    ],
    correct: 1,
    explain: 'Increasing pressure shifts the equilibrium toward fewer moles of gas (forward direction to form NH₃, increasing yield) while simultaneously increasing molecular collision frequency (increasing rate).'
  },
  {
    id: 'aku-sci-6',
    subject: 'Science Reasoning',
    topic: 'Experimental Design & Control Groups',
    q: 'In a double-blind randomized clinical trial testing a novel monoclonal antibody against viral infection, what is the primary purpose of administering a matching saline placebo to the control group?',
    options: [
      'To provide adequate hydration to control participants',
      'To eliminate confounding psychological expectation and observer bias',
      'To stimulate non-specific innate immune activation',
      'To test whether saline contains therapeutic antiviral activity'
    ],
    correct: 1,
    explain: 'Placebo controls ensure that measured therapeutic effects stem from the pharmacological agent rather than participant expectations or evaluation bias.'
  },
  {
    id: 'aku-sci-7',
    subject: 'Science Reasoning',
    topic: 'Optics & Wave Phenomena in Diagnostics',
    q: 'An ultrasound probe emits sound waves at 3.5 MHz into tissue. When scanning a blood vessel, the reflected frequency is measured at 3.504 MHz. This positive frequency shift indicates that:',
    options: [
      'Blood is flowing away from the probe.',
      'Blood is flowing toward the probe.',
      'Sound velocity is decelerating within the blood vessel.',
      'Tissue attenuation has amplified the acoustic wavelength.'
    ],
    correct: 1,
    explain: 'According to the Doppler effect, when the source or reflector moves toward the detector, the observed frequency increases (f_observed > f_emitted).'
  }
];

export const AKU_MATH_REASONING_QUESTIONS: Question[] = [
  {
    id: 'aku-math-1',
    subject: 'Mathematical Reasoning',
    topic: 'Clinical Calculations & Infusion Rates',
    q: 'A patient is prescribed 500 mL of normal saline to be infused intravenously over 4 hours. The IV administration set delivers 15 drops per mL (gtt/mL). What is the required infusion rate in drops per minute?',
    options: ['25 drops/min', '31 drops/min', '42 drops/min', '60 drops/min'],
    correct: 1,
    explain: 'Total volume = 500 mL, time = 4 * 60 = 240 minutes. Drops/min = (500 mL * 15 gtt/mL) / 240 min = 7500 / 240 = 31.25 drops/min ≈ 31 drops/min.'
  },
  {
    id: 'aku-math-2',
    subject: 'Mathematical Reasoning',
    topic: 'Epidemiology & Diagnostic Metrics',
    q: 'A screening test for a disease has a sensitivity of 90% and specificity of 80%. In a population of 1,000 individuals where disease prevalence is 10%, how many individuals will test positive (true positives + false positives)?',
    options: ['90', '180', '270', '350'],
    correct: 2,
    explain: 'Diseased = 10% of 1000 = 100. Healthy = 900. True positives = 90% of 100 = 90. Specificity 80% means 20% false positive rate. False positives = 20% of 900 = 180. Total positive tests = 90 + 180 = 270.'
  },
  {
    id: 'aku-math-3',
    subject: 'Mathematical Reasoning',
    topic: 'Radioactive Decay & Half-Life',
    q: 'A diagnostic radioisotope with a half-life of 6 hours has an initial activity of 80 mCi. What will be its remaining activity after 24 hours?',
    options: ['2.5 mCi', '5 mCi', '10 mCi', '20 mCi'],
    correct: 1,
    explain: 'Number of half-lives = 24 / 6 = 4. Remaining activity = 80 / 2⁴ = 80 / 16 = 5 mCi.'
  },
  {
    id: 'aku-math-4',
    subject: 'Mathematical Reasoning',
    topic: 'Concentration & Dilution',
    q: 'How many milliliters of a 70% ethanol solution must be mixed with sterile distilled water to prepare 350 mL of a 20% ethanol antiseptic solution?',
    options: ['75 mL', '100 mL', '125 mL', '150 mL'],
    correct: 1,
    explain: 'C1 * V1 = C2 * V2 => 70% * V1 = 20% * 350 mL => V1 = (20 * 350) / 70 = 7000 / 70 = 100 mL.'
  },
  {
    id: 'aku-math-5',
    subject: 'Mathematical Reasoning',
    topic: 'Proportionality & Physiological Scaling',
    q: 'According to Poiseuille\'s Law, fluid flow rate through a cylindrical vessel is proportional to the fourth power of the radius (r⁴). If vascular vasoconstriction reduces vessel radius by 20%, by what approximate percentage is blood flow reduced (assuming constant pressure gradient)?',
    options: ['20%', '36%', '59%', '80%'],
    correct: 2,
    explain: 'New radius = 0.8r. New flow = (0.8)⁴ = 0.4096 of original flow. Percentage reduction = 1 - 0.4096 = 0.5904 ≈ 59%.'
  }
];

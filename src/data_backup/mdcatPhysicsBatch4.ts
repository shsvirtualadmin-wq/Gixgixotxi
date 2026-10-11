import { Question } from '../types';

export const MDCAT_PHYSICS_BATCH4: Question[] = [
  // --- Alternating Current (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-1',
    q: 'What is the relationship between the peak value (V₀) and the root-mean-square value (V_rms) of a sinusoidal alternating voltage?',
    options: [
      'V_rms = V₀ / √2 ≈ 0.707 V₀',
      'V_rms = √2 V₀ ≈ 1.414 V₀',
      'V_rms = 2 V₀ / π ≈ 0.637 V₀',
      'V_rms = V₀ / 2'
    ],
    correct: 0,
    topic: 'Alternating Current',
    explain: 'For a sinusoidal AC waveform, the root-mean-square voltage representing equivalent DC heating power is V_rms = V₀ / √2 ≈ 0.707 V₀.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-2',
    q: 'How does the inductive reactance (X_L) of an ideal inductor change when the operating frequency of an AC circuit is tripled?',
    options: [
      'It increases by a factor of 3',
      'It decreases to one-third of its original value',
      'It increases by a factor of 9',
      'It remains unchanged'
    ],
    correct: 0,
    topic: 'Alternating Current',
    explain: 'Inductive reactance is given by X_L = 2πfL. Since X_L is directly proportional to frequency f, tripling the frequency triples the inductive reactance.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-3',
    q: 'In a series RLC alternating current circuit at electrical resonance, what is the power factor of the circuit?',
    options: [
      '1.0 (unity)',
      '0.0',
      '0.707',
      '0.5'
    ],
    correct: 0,
    topic: 'Alternating Current',
    explain: 'At resonance, inductive reactance equals capacitive reactance (X_L = X_C), making the net reactance zero. The circuit impedance is purely resistive (Z = R), yielding phase angle φ = 0 and power factor cos(φ) = 1.0.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Atomic Spectra (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-4',
    q: 'Which spectral series of atomic hydrogen emission lies entirely in the visible region of the electromagnetic spectrum?',
    options: [
      'Balmer series',
      'Lyman series',
      'Paschen series',
      'Brackett series'
    ],
    correct: 0,
    topic: 'Atomic Spectra',
    explain: 'Transitions dropping down to the n = 2 quantum level form the Balmer series, which emits radiation in the visible region (380–750 nm). The Lyman series falls in the UV region, and Paschen in the infrared.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-5',
    q: 'According to Bohr\'s atomic model, what is the quantization condition for the orbital angular momentum (L) of an electron moving in a stable stationary orbit?',
    options: [
      'L = n(h / 2π), where n = 1, 2, 3...',
      'L = n(h / 4π)',
      'L = 2πnh',
      'L = n²h'
    ],
    correct: 0,
    topic: 'Atomic Spectra',
    explain: 'Bohr\'s second postulate states that an electron orbits only in orbits where its orbital angular momentum is an integral multiple of reduced Planck\'s constant: L = mvr = n(h / 2π).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-6',
    q: 'In laser physics, what condition is fundamentally required for stimulated emission to predominate over spontaneous absorption and produce coherent optical amplification?',
    options: [
      'Population inversion in a metastable state',
      'Continuous thermal cooling to absolute zero',
      'Total destructive interference in the optical cavity',
      'A completely opaque external output coupler'
    ],
    correct: 0,
    topic: 'Atomic Spectra',
    explain: 'Population inversion—a non-equilibrium state where more atoms occupy the higher metastable energy level than the ground state—is essential for stimulated emission to exceed absorption and achieve lasing.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Current Electricity (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-7',
    q: 'Which conservation law forms the fundamental physical basis for Kirchhoff\'s first rule (Junction Rule, ΣI = 0)?',
    options: [
      'Law of conservation of electric charge',
      'Law of conservation of energy',
      'Law of conservation of linear momentum',
      'Law of conservation of magnetic flux'
    ],
    correct: 0,
    topic: 'Current Electricity',
    explain: 'Kirchhoff\'s Junction Rule states that the algebraic sum of currents meeting at any electrical node is zero, which is a direct consequence of the conservation of electric charge.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-8',
    q: 'A uniform cylindrical copper wire of resistance R is stretched mechanically until its length is doubled while its volume remains strictly constant. What is its new resistance?',
    options: [
      '4R',
      '2R',
      'R / 2',
      'R / 4'
    ],
    correct: 0,
    topic: 'Current Electricity',
    explain: 'Since volume V = A * L is constant, doubling length (L\' = 2L) halves cross-sectional area (A\' = A / 2). Resistance R\' = ρ(L\' / A\') = ρ(2L / (A/2)) = 4(ρL / A) = 4R.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-9',
    q: 'A potentiometer is preferred over a standard high-resistance voltmeter for measuring the true electromotive force (EMF) of a chemical cell because:',
    options: [
      'It draws zero current from the cell at null deflection, measuring the open-circuit terminal voltage',
      'It has zero internal resistance during all calibration steps',
      'It converts thermal noise into electrical signal',
      'It measures root-mean-square current directly'
    ],
    correct: 0,
    topic: 'Current Electricity',
    explain: 'At null point, no current flows from the test cell into the potentiometer circuit. Thus, there is zero internal resistance drop (Ir = 0), and the measured value equals the exact open-circuit EMF.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Dawn of Modern Physics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-10',
    q: 'In the photoelectric effect, what parameter determines the maximum kinetic energy of emitted photoelectrons from a metallic surface?',
    options: [
      'The frequency of the incident photon beam',
      'The intensity of the incident photon beam',
      'The surface area of the illuminated metal',
      'The exposure duration of the radiation'
    ],
    correct: 0,
    topic: 'Dawn of Modern Physics',
    explain: 'According to Einstein\'s photoelectric equation, KE_max = hf - Φ. The maximum kinetic energy depends solely on the incident photon frequency (f) and work function (Φ), completely independent of radiation intensity.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-11',
    q: 'What is the de Broglie wavelength (λ) associated with a material particle of rest mass m moving with non-relativistic velocity v?',
    options: [
      'λ = h / (mv)',
      'λ = hmv',
      'λ = mv² / h',
      'λ = h / (2mv²)'
    ],
    correct: 0,
    topic: 'Dawn of Modern Physics',
    explain: 'Louis de Broglie postulated wave-particle duality: λ = h / p = h / (mv), where h is Planck\'s constant and p = mv is the linear momentum.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-12',
    q: 'In Compton scattering, what is the change in photon wavelength (Δλ) when a high-energy X-ray photon scatters backward at an angle θ = 180° from a stationary electron?',
    options: [
      '2h / (m_e c) ≈ 4.85 × 10⁻¹² m',
      'h / (m_e c) ≈ 2.43 × 10⁻¹² m',
      '0',
      'h / (2m_e c)'
    ],
    correct: 0,
    topic: 'Dawn of Modern Physics',
    explain: 'Compton formula: Δλ = (h / m_e c)(1 - cos θ). At θ = 180°, cos(180°) = -1, so (1 - cos θ) = 2. Therefore, Δλ = 2h / (m_e c) ≈ 2 * 2.426 pm = 4.85 pm (maximum possible wavelength shift).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electromagnetic Induction (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-13',
    q: 'Which physical law dictates the directional polarity of an induced electromotive force in an electromagnetic system?',
    options: [
      'Lenz\'s law',
      'Ampère\'s law',
      'Coulomb\'s law',
      'Biot-Savart law'
    ],
    correct: 0,
    topic: 'Electromagnetic Induction',
    explain: 'Lenz\'s law states that the direction of an induced EMF/current always opposes the change in magnetic flux producing it, representing the principle of energy conservation.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-14',
    q: 'A straight metallic rod of length L moves with uniform perpendicular velocity v through a uniform magnetic field B. What motional EMF is induced across its ends?',
    options: [
      'ε = vBL',
      'ε = v²BL',
      'ε = vB / L',
      'ε = B / (vL)'
    ],
    correct: 0,
    topic: 'Electromagnetic Induction',
    explain: 'Motional electromotive force induced across a conductor cutting perpendicular magnetic field lines is given by ε = -vBL sin(θ); when perpendicular (θ = 90°), magnitude is ε = vBL.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-15',
    q: 'In an ideal electrical transformer, if the primary coil has 200 turns and the secondary has 1000 turns, what is the output current in the secondary when a 10 A current flows in the primary?',
    options: [
      '2.0 A',
      '50.0 A',
      '5.0 A',
      '0.5 A'
    ],
    correct: 0,
    topic: 'Electromagnetic Induction',
    explain: 'For an ideal transformer, power is conserved: V_p I_p = V_s I_s, which implies I_s / I_p = N_p / N_s. Here, I_s = I_p * (N_p / N_s) = 10 A * (200 / 1000) = 2.0 A.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electromagnetism (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-16',
    q: 'What is the magnetic Lorentz force experienced by a charged particle q moving with velocity v parallel to a uniform magnetic field B?',
    options: [
      'Zero',
      'q v B',
      'q v² B',
      'q B / v'
    ],
    correct: 0,
    topic: 'Electromagnetism',
    explain: 'The magnetic force is F = q(v × B) = q v B sin(θ). When velocity is parallel to the magnetic field, θ = 0° and sin(0°) = 0, so the magnetic force is zero.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-17',
    q: 'What is the magnetic flux density (B) inside an infinitely long ideal solenoid having n turns per unit length carrying a steady current I?',
    options: [
      'B = μ₀ n I',
      'B = μ₀ I / (2πr)',
      'B = μ₀ n I / 2',
      'B = μ₀ I / n'
    ],
    correct: 0,
    topic: 'Electromagnetism',
    explain: 'Applying Ampère\'s circuital law to an ideal solenoid shows that the interior magnetic field is uniform and given by B = μ₀ n I, where n = N/L is the number of turns per unit length.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-18',
    q: 'A charged particle enters a region containing mutually perpendicular uniform electric (E) and magnetic (B) fields. What velocity enables the particle to traverse undeflected (velocity selector condition)?',
    options: [
      'v = E / B',
      'v = B / E',
      'v = E * B',
      'v = √(E / B)'
    ],
    correct: 0,
    topic: 'Electromagnetism',
    explain: 'For zero net deflection, electrostatic force must balance magnetic force: qE = qvB. Solving for velocity yields v = E / B, the velocity selector principle used in J.J. Thomson\'s e/m experiment.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electronics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-19',
    q: 'What type of majority charge carriers are present in an n-type extrinsic semiconductor formed by doping silicon with phosphorus?',
    options: [
      'Free conduction electrons',
      'Mobile electron holes',
      'Positive donor ions',
      'Negative acceptor ions'
    ],
    correct: 0,
    topic: 'Electronics',
    explain: 'Phosphorus is pentavalent. Donating an electron to the conduction band without creating a valence hole produces an excess of free conduction electrons as majority carriers in n-type semiconductor.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-20',
    q: 'What is the width and barrier potential of the depletion layer in a silicon p-n junction diode at room temperature (300 K) under zero external bias?',
    options: [
      'Approximately 0.7 V',
      'Approximately 0.3 V',
      'Approximately 1.1 V',
      'Approximately 0.1 V'
    ],
    correct: 0,
    topic: 'Electronics',
    explain: 'At room temperature, the contact barrier potential formed across the uncompensated ionic depletion zone is approximately 0.7 V for silicon (and ~0.3 V for germanium).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-21',
    q: 'In an operational amplifier configured as an inverting amplifier with input resistor R_in = 10 kΩ and feedback resistor R_f = 250 kΩ, what is the voltage gain (A_v)?',
    options: [
      '-25',
      '+25',
      '-26',
      '-0.04'
    ],
    correct: 0,
    topic: 'Electronics',
    explain: 'The voltage gain of an ideal inverting operational amplifier is given by A_v = -R_f / R_in = -250 kΩ / 10 kΩ = -25 (the negative sign denotes 180° phase inversion).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electrostatics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-22',
    q: 'What happens to the electrostatic force between two point charges if the distance separating them is halved, according to Coulomb\'s law?',
    options: [
      'It increases by a factor of 4',
      'It doubles',
      'It is reduced to one-fourth',
      'It remains unchanged'
    ],
    correct: 0,
    topic: 'Electrostatics',
    explain: 'Coulomb\'s law states F ∝ 1 / r². Halving distance r -> r/2 yields F\' ∝ 1 / (r/2)² = 4 / r² = 4F, quadrupling the electrostatic force.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-23',
    q: 'A dielectric slab of relative permittivity ε_r = 5 is inserted to completely fill the space between the plates of an isolated charged parallel-plate capacitor. How does its capacitance change?',
    options: [
      'It increases by a factor of 5',
      'It decreases by a factor of 5',
      'It remains unchanged',
      'It increases by a factor of 25'
    ],
    correct: 0,
    topic: 'Electrostatics',
    explain: 'Capacitance with a dielectric medium is C = ε_r * C₀. Introducing a dielectric with dielectric constant ε_r = 5 increases capacitance five-fold.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-24',
    q: 'According to Gauss\'s law, what is the total electric flux passing outward through an arbitrary closed Gaussian surface enclosing an electric dipole consisting of charges +q and -q?',
    options: [
      'Zero',
      'q / ε₀',
      '2q / ε₀',
      '-q / ε₀'
    ],
    correct: 0,
    topic: 'Electrostatics',
    explain: 'Gauss\'s law states that total electric flux Φ = Q_enclosed / ε₀. For an electric dipole, Q_enclosed = (+q) + (-q) = 0, so net electric flux through any surface enclosing the dipole is exactly zero.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Fluid Dynamics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-25',
    q: 'According to the equation of continuity (A₁v₁ = A₂v₂), what occurs to the velocity of an incompressible fluid when the pipe cross-sectional area narrows?',
    options: [
      'Fluid velocity increases proportionally',
      'Fluid velocity decreases',
      'Fluid velocity remains constant',
      'Fluid velocity oscillates randomly'
    ],
    correct: 0,
    topic: 'Fluid Dynamics',
    explain: 'By conservation of mass in steady incompressible flow, A * v = constant. As cross-sectional area decreases, fluid velocity must increase proportionally.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-26',
    q: 'What is the terminal velocity condition for a spherical droplet of radius r falling vertically through a viscous medium under gravity?',
    options: [
      'Downward gravitational force equals the sum of upward buoyant force and Stokes viscous drag force',
      'Stokes drag force equals twice the weight',
      'Upward buoyant force completely vanishes',
      'Gravitational acceleration increases linearly with time'
    ],
    correct: 0,
    topic: 'Fluid Dynamics',
    explain: 'Terminal velocity is reached when net acceleration is zero: downward gravitational weight is balanced by the sum of upward Archimedes buoyant force and Stokes drag force (6πηrv_t).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-27',
    q: 'According to Bernoulli\'s equation (P + 1/2 ρv² + ρgh = constant), how does static fluid pressure change in a horizontal constriction where flow velocity increases?',
    options: [
      'Static pressure decreases (Venturi effect)',
      'Static pressure increases substantially',
      'Static pressure remains identical',
      'Static pressure drops strictly to absolute zero'
    ],
    correct: 0,
    topic: 'Fluid Dynamics',
    explain: 'Along a horizontal streamline (constant h), P + 1/2 ρv² = constant. An increase in kinetic energy density (higher v) requires an equivalent decrease in static pressure P (the Venturi principle).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Force and Motion (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-28',
    q: 'What is the change in linear momentum of an object subjected to a net external force F acting over a time interval Δt?',
    options: [
      'Impulse = F * Δt',
      'Work = F * d',
      'Kinetic energy = 1/2 m v²',
      'Power = F * v'
    ],
    correct: 0,
    topic: 'Force and Motion',
    explain: 'According to Newton\'s second law in momentum form, net force equals rate of change of momentum (F = Δp / Δt). The product F * Δt is defined as impulse, which equals the change in momentum (Δp).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-29',
    q: 'A projectile is launched with initial velocity v₀ at an angle θ with the horizontal. What is the formula for its maximum horizontal range (ignoring air resistance)?',
    options: [
      'R = (v₀² sin 2θ) / g',
      'R = (v₀² sin² θ) / (2g)',
      'R = (v₀ sin θ) / g',
      'R = (v₀² cos 2θ) / g'
    ],
    correct: 0,
    topic: 'Force and Motion',
    explain: 'The horizontal range of a parabolic projectile launched over flat terrain is given by R = (v₀² sin 2θ) / g, reaching its theoretical maximum at θ = 45° where sin(2θ) = 1.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-30',
    q: 'Two bodies of masses m₁ and m₂ collide in a completely elastic one-dimensional collision. What quantities are conserved during the impact?',
    options: [
      'Both total linear momentum and total kinetic energy are strictly conserved',
      'Only linear momentum is conserved; kinetic energy is lost as heat',
      'Only kinetic energy is conserved; linear momentum changes',
      'Neither momentum nor kinetic energy is conserved'
    ],
    correct: 0,
    topic: 'Force and Motion',
    explain: 'By definition, in a perfectly elastic collision, both total linear momentum and total mechanical kinetic energy of the closed system are strictly conserved.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-31',
    q: 'A 2 kg block slides down an inclined plane angled at 30° to the horizontal. If the coefficient of kinetic friction μ_k is 0.2 and g = 9.8 m/s², what is the acceleration of the block down the incline?',
    options: [
      '3.20 m/s²',
      '4.90 m/s²',
      '1.70 m/s²',
      '6.60 m/s²'
    ],
    correct: 0,
    topic: 'Force and Motion',
    explain: 'Net accelerating force down incline: F_net = mg sin θ - μ_k mg cos θ. Acceleration a = g(sin 30° - 0.2 * cos 30°) = 9.8(0.5 - 0.2 * 0.866) = 9.8(0.5 - 0.1732) = 9.8 * 0.3268 ≈ 3.20 m/s².',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Measurements (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-32',
    q: 'Which of the following is a base SI unit in the International System of Units?',
    options: [
      'Kelvin',
      'Joule',
      'Newton',
      'Volt'
    ],
    correct: 0,
    topic: 'Measurements',
    explain: 'The seven SI base units are meter (m), kilogram (kg), second (s), ampere (A), kelvin (K), mole (mol), and candela (cd). Joule, newton, and volt are derived units.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-33',
    q: 'What are the base SI dimensional formulas for the physical quantity Force?',
    options: [
      '[M L T⁻²]',
      '[M L² T⁻²]',
      '[M L⁻¹ T⁻¹]',
      '[M L² T⁻³]'
    ],
    correct: 0,
    topic: 'Measurements',
    explain: 'Force = mass * acceleration = [M] * [L T⁻²] = [M L T⁻²]. (In contrast, Energy is [M L² T⁻²] and Power is [M L² T⁻³]).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-34',
    q: 'A physical quantity X is given by the relation X = A³ B / √C. If percentage uncertainties in measuring A, B, and C are 1%, 2%, and 4% respectively, what is the maximum percentage uncertainty in X?',
    options: [
      '7%',
      '5%',
      '9%',
      '3%'
    ],
    correct: 0,
    topic: 'Measurements',
    explain: 'In fractional error propagation: %ΔX = 3(%ΔA) + 1(%ΔB) + 1/2(%ΔC) = 3(1%) + 1(2%) + 1/2(4%) = 3% + 2% + 2% = 7%.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Nuclear Physics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-35',
    q: 'What is an alpha (α) particle emitted during radioactive nuclear decay?',
    options: [
      'A doubly ionized helium nucleus (⁴₂He²⁺) consisting of 2 protons and 2 neutrons',
      'A relativistic high-energy electron',
      'A high-frequency electromagnetic wave photon',
      'A solitary uncharged neutron'
    ],
    correct: 0,
    topic: 'Nuclear Physics',
    explain: 'An alpha particle is identical to a helium-4 nucleus, composed of 2 protons and 2 neutrons bound together, carrying a +2e elementary charge.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-36',
    q: 'If a radioactive sample has a half-life of 6 hours, what fraction of the original radioactive nuclei remains undecayed after 24 hours?',
    options: [
      '1 / 16 (6.25%)',
      '1 / 8 (12.5%)',
      '1 / 32 (3.125%)',
      '1 / 4 (25%)'
    ],
    correct: 0,
    topic: 'Nuclear Physics',
    explain: 'Number of elapsed half-lives n = t / T_(1/2) = 24 / 6 = 4. Remaining fraction = (1/2)⁴ = 1 / 16 = 0.0625 (6.25%).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-37',
    q: 'In nuclear physics, what does mass defect (Δm) represent, and how is it related to nuclear binding energy according to Einstein\'s mass-energy equivalence?',
    options: [
      'The difference between the total mass of separated nucleons and the bound nucleus; Binding Energy = Δm * c²',
      'The loss of electrons during beta decay; Binding Energy = Δm * v',
      'The gain in nuclear mass during alpha emission',
      'The electrostatic repulsive energy between protons'
    ],
    correct: 0,
    topic: 'Nuclear Physics',
    explain: 'Mass defect Δm = [Z * m_p + (A - Z) * m_n] - M_nucleus. This lost mass is converted into binding energy that holds the nucleons together: E_b = (Δm)c².',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Oscillations (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-38',
    q: 'What is the defining dynamical equation of motion for an ideal simple harmonic oscillator?',
    options: [
      'a = -ω² x',
      'a = +ω² x',
      'a = ω x²',
      'a = -ω x'
    ],
    correct: 0,
    topic: 'Oscillations',
    explain: 'Simple harmonic motion requires that acceleration is directly proportional to displacement from equilibrium and directed towards the mean position: a = -ω² x.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-39',
    q: 'How does the time period (T) of an ideal simple pendulum change if its physical length is quadrupled?',
    options: [
      'It doubles',
      'It quadruples',
      'It is halved',
      'It remains unchanged'
    ],
    correct: 0,
    topic: 'Oscillations',
    explain: 'Period of a simple pendulum is T = 2π √(L / g). If length L is quadrupled (4L), T\' = 2π √(4L / g) = 2 * (2π √(L / g)) = 2T, doubling the period.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-40',
    q: 'In an undamped simple harmonic oscillator, at what displacement x from the mean position are kinetic energy and potential energy exactly equal?',
    options: [
      'x = x₀ / √2 ≈ 0.707 x₀',
      'x = x₀ / 2',
      'x = x₀ / 4',
      'x = √2 x₀'
    ],
    correct: 0,
    topic: 'Oscillations',
    explain: 'Total energy E = 1/2 k x₀². Potential energy PE = 1/2 k x². When PE = 1/2 E: 1/2 k x² = 1/2 (1/2 k x₀²) -> x² = x₀² / 2 -> x = x₀ / √2.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Physics of Solids (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-41',
    q: 'What is the SI unit of mechanical stress (force per unit area)?',
    options: [
      'Pascal (Pa) or N/m²',
      'Joule (J)',
      'Newton (N)',
      'Watt (W)'
    ],
    correct: 0,
    topic: 'Physics of Solids',
    explain: 'Stress σ = F / A. Its SI unit is Newtons per square meter (N/m²), which is dimensionally equivalent to the Pascal (Pa).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-42',
    q: 'What is Young\'s modulus of elasticity for a solid material subjected to longitudinal tensile deformation?',
    options: [
      'Ratio of tensile stress to tensile strain within the elastic limit',
      'Ratio of shear stress to shear strain',
      'Ratio of hydraulic stress to volumetric strain',
      'Product of stress and strain'
    ],
    correct: 0,
    topic: 'Physics of Solids',
    explain: 'Young\'s modulus (Y) is the fundamental measure of longitudinal stiffness, defined within Hooke\'s elastic limit as tensile stress (F/A) divided by tensile strain (ΔL/L).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-43',
    q: 'In band theory of solids, what characterizes the electronic energy band structure of an electrical insulator at absolute zero?',
    options: [
      'A completely filled valence band, an empty conduction band, and a wide forbidden energy gap (E_g > 3 eV)',
      'An overlapping valence band and conduction band with zero band gap',
      'A partially filled conduction band',
      'A narrow band gap of less than 0.1 eV'
    ],
    correct: 0,
    topic: 'Physics of Solids',
    explain: 'Insulators possess a fully occupied valence band and a completely empty conduction band separated by a large forbidden energy gap (typically > 3 to 6 eV), precluding thermal excitation into the conduction band.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Rotational and Circular Motion (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-44',
    q: 'What is the magnitude of centripetal acceleration (a_c) of a body moving with constant speed v along a circular track of radius r?',
    options: [
      'a_c = v² / r',
      'a_c = v / r²',
      'a_c = v * r',
      'a_c = v² * r'
    ],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    explain: 'Centripetal acceleration directed toward the center of circular curvature is given by a_c = v² / r = rω².',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-45',
    q: 'What is the rotational analog of linear mass in Newtonian rotational dynamics?',
    options: [
      'Moment of inertia (I = Σ m_i r_i²)',
      'Angular momentum',
      'Torque',
      'Angular velocity'
    ],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    explain: 'Moment of inertia (I = Σ mr²) measures an object\'s rotational inertia (resistance to angular acceleration), analogous to inertial mass in linear motion (τ = Iα vs F = ma).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-46',
    q: 'A spinning figure skater pulls her outstretched arms inward toward her chest, decreasing her moment of inertia by half. In the absence of external torques, what happens to her angular velocity?',
    options: [
      'It doubles',
      'It is halved',
      'It quadruples',
      'It remains unchanged'
    ],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    explain: 'By conservation of angular momentum (L = Iω = constant), halving the moment of inertia (I\' = I / 2) forces angular velocity to double (ω\' = 2ω).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-47',
    q: 'What is the minimum speed required for a car of mass m to safely negotiate an unbanked circular curve of radius 50 m without skidding, if the coefficient of static friction between tires and tarmac is 0.5 (g = 9.8 m/s²)?',
    options: [
      '15.65 m/s',
      '22.14 m/s',
      '9.80 m/s',
      '4.95 m/s'
    ],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    explain: 'Maximum speed without skidding on a flat curve is v_max = √(μ_s g r) = √(0.5 * 9.8 * 50) = √245 ≈ 15.65 m/s (approx 56.3 km/h).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Scalars and Vectors (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-48',
    q: 'Which of the following physical quantities is a scalar quantity?',
    options: [
      'Electric potential',
      'Electric field intensity',
      'Magnetic torque',
      'Linear acceleration'
    ],
    correct: 0,
    topic: 'Scalars and Vectors',
    explain: 'Electric potential is scalar work done per unit charge (V = W/q), possessing magnitude only. Field intensity, torque, and acceleration have both magnitude and spatial direction.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-49',
    q: 'If the scalar (dot) product of two non-zero vectors A and B is zero (A · B = 0), what is the geometric angle between them?',
    options: [
      '90° (perpendicular)',
      '0° (parallel)',
      '180° (antiparallel)',
      '45°'
    ],
    correct: 0,
    topic: 'Scalars and Vectors',
    explain: 'The dot product is defined as A · B = |A||B| cos θ. Since |A| ≠ 0 and |B| ≠ 0, A · B = 0 implies cos θ = 0, which occurs when θ = 90° (orthogonal vectors).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-50',
    q: 'Two vectors of equal magnitude F act at a single point. If the magnitude of their resultant vector is also exactly F, what is the angle θ between the two vectors?',
    options: [
      '120°',
      '60°',
      '90°',
      '180°'
    ],
    correct: 0,
    topic: 'Scalars and Vectors',
    explain: 'R² = A² + B² + 2AB cos θ. With R = A = B = F: F² = F² + F² + 2F² cos θ -> F² = 2F²(1 + cos θ) -> 1/2 = 1 + cos θ -> cos θ = -1/2, which gives θ = 120°.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Thermodynamics (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-51',
    q: 'What is the statement of the First Law of Thermodynamics for a closed thermodynamic system?',
    options: [
      'ΔU = Q - W (conservation of energy)',
      'ΔS_universe ≥ 0',
      'PV = nRT',
      'W = Q_c - Q_h'
    ],
    correct: 0,
    topic: 'Thermodynamics',
    explain: 'The First Law of Thermodynamics is the law of conservation of energy: the change in internal energy ΔU equals the heat absorbed by the system (Q) minus work done by the system (W).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-52',
    q: 'In an isothermal expansion of an ideal gas, how does the internal energy (U) of the gas change?',
    options: [
      'Internal energy remains constant (ΔU = 0)',
      'Internal energy increases proportionally with volume',
      'Internal energy decreases to zero',
      'Internal energy oscillates'
    ],
    correct: 0,
    topic: 'Thermodynamics',
    explain: 'The internal energy of an ideal gas is a function solely of absolute temperature (U ∝ T). Because temperature remains constant during an isothermal process (ΔT = 0), ΔU = 0.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-53',
    q: 'What is the theoretical thermal efficiency (η) of a Carnot heat engine operating between a heat source at 500 K and a heat sink at 300 K?',
    options: [
      '40% (0.40)',
      '60% (0.60)',
      '20% (0.20)',
      '50% (0.50)'
    ],
    correct: 0,
    topic: 'Thermodynamics',
    explain: 'Carnot efficiency η = 1 - (T_c / T_h) = 1 - (300 / 500) = 1 - 0.60 = 0.40 or 40%.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-54',
    q: 'In an adiabatic expansion of an ideal gas, which relationship correctly describes the pressure-volume behavior (where γ = C_p / C_v)?',
    options: [
      'P V^γ = constant',
      'P V = constant',
      'P / V^γ = constant',
      'P^γ V = constant'
    ],
    correct: 0,
    topic: 'Thermodynamics',
    explain: 'During a reversible adiabatic process (no heat exchange, Q = 0), Poisson\'s relation dictates that P V^γ = constant, where γ is the ratio of principal molar specific heat capacities.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Waves (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-55',
    q: 'What type of wave is a sound wave propagating through dry ambient air?',
    options: [
      'Longitudinal mechanical wave consisting of compressions and rarefactions',
      'Transverse electromagnetic wave',
      'Stationary torsional surface wave',
      'Non-dispersive polar wave'
    ],
    correct: 0,
    topic: 'Waves',
    explain: 'Sound waves in gaseous air are longitudinal mechanical waves, where air particles oscillate parallel to the direction of acoustic energy propagation via alternating compressions and rarefactions.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-56',
    q: 'What acoustic phenomenon is observed when two sound waves of slightly differing frequencies (e.g., 440 Hz and 444 Hz) interfere with one another?',
    options: [
      'Beats with a beat frequency equal to the difference (|f₁ - f₂| = 4 Hz)',
      'Total destructive silence',
      'A constant tone of frequency 884 Hz',
      'A stationary standing wave with zero nodes'
    ],
    correct: 0,
    topic: 'Waves',
    explain: 'Periodic constructive and destructive interference of two acoustic frequencies produces beats. The beat frequency is the absolute frequency difference: |444 - 440| = 4 Hz.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-57',
    q: 'In the acoustic Doppler effect, what is the observed frequency (f\') when a sound source emitting frequency f moves directly toward a stationary listener with speed u_s (speed of sound = v)?',
    options: [
      'f\' = f [v / (v - u_s)] (observed frequency increases)',
      'f\' = f [v / (v + u_s)]',
      'f\' = f [(v - u_s) / v]',
      'f\' = f'
    ],
    correct: 0,
    topic: 'Waves',
    explain: 'When the source approaches a stationary observer, wavefronts compress ahead of the source, shortening observed wavelength (λ\' = (v - u_s)/f) and increasing detected frequency: f\' = v / λ\' = f [v / (v - u_s)].',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Work, Energy and Power (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-phy-58',
    q: 'What mechanical work is done by the centripetal force acting on a satellite orbiting Earth in a stable circular orbit?',
    options: [
      'Zero joules',
      'G M m / r',
      '1/2 m v²',
      'm g h'
    ],
    correct: 0,
    topic: 'Work, Energy and Power',
    explain: 'Work W = F · d = F d cos(θ). Centripetal force acts perpendicular (θ = 90°) to instantaneous orbital displacement at all times. Since cos(90°) = 0, work done is zero.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-59',
    q: 'How does the kinetic energy (KE) of a moving vehicle change if its velocity is doubled?',
    options: [
      'It quadruples (increases four-fold)',
      'It doubles',
      'It increases eight-fold',
      'It remains unchanged'
    ],
    correct: 0,
    topic: 'Work, Energy and Power',
    explain: 'Kinetic energy is given by KE = 1/2 m v². Because KE is proportional to velocity squared (v²), doubling velocity (2v)² multiplies kinetic energy by 4.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b4-phy-60',
    q: 'What is the instantaneous mechanical power developed by a motor applying a force vector F = 50 N at an instantaneous velocity v = 4 m/s in the direction of force?',
    options: [
      '200 Watts',
      '12.5 Watts',
      '54 Watts',
      '800 Watts'
    ],
    correct: 0,
    topic: 'Work, Energy and Power',
    explain: 'Instantaneous power is the dot product of force and velocity: P = F · v = F v cos(0°) = 50 N * 4 m/s = 200 W (or J/s).',
    difficulty: 'Hard',
    subject: 'Physics'
  }
];

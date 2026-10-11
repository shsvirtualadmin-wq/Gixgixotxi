import { Question } from '../types';

export const MDCAT_PHYSICS_BATCH10: Question[] = [
  // --- Force and Motion (3 MCQs: 1 to 3) ---
  {
    id: 'mdcat-b10-phy-1',
    q: 'A projectile is launched from ground level with initial speed v0 at an angle of 30° to the horizontal. Assuming negligible air resistance and g = 9.8 m/s², what is the ratio of its kinetic energy at the peak of its trajectory to its initial launch kinetic energy?',
    options: [
      '3 / 4 (0.75)',
      '1 / 2 (0.50)',
      '1 / 4 (0.25)',
      'Zero'
    ],
    correct: 0,
    topic: 'Projectile Motion - Kinetic Energy at Trajectory Peak',
    chapter: 'Force and Motion',
    explain: 'At the apex of projectile motion, the vertical velocity component is zero (vy = 0), so the speed is purely horizontal: vx = v0 cos(θ) = v0 cos(30°) = (√3 / 2) v0. Kinetic energy at the top K_top = 1/2 m vx² = 1/2 m [(√3 / 2) v0]² = (3/4) × (1/2 m v0²) = (3/4) K_initial.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-2',
    q: 'According to Newton\'s second law formulated in terms of momentum (F_net = dp/dt), what is the area under a force-versus-time (F vs t) graph equal to?',
    options: [
      'Impulse (J), which equals the net change in linear momentum (Δp)',
      'Total mechanical work done (W)',
      'Instantaneous power delivered (P)',
      'Acceleration of the body (a)'
    ],
    correct: 0,
    topic: 'Impulse and Momentum - Area Under Force-Time Graph',
    chapter: 'Force and Motion',
    explain: 'By definition, Impulse J = ∫ F dt, which represents the area under the force-time curve. By the impulse-momentum theorem, J = Δp = p_final - p_initial (units N·s or kg·m/s).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-3',
    q: 'A 2.0 kg block sliding on a frictionless horizontal floor at 6.0 m/s collides head-on elastically with a stationary 4.0 kg block. What is the velocity of the 2.0 kg block immediately after the collision?',
    options: [
      '-2.0 m/s (rebounding backward at 2.0 m/s)',
      '+2.0 m/s (continuing forward at 2.0 m/s)',
      '0 m/s (coming to rest)',
      '-4.0 m/s'
    ],
    correct: 0,
    topic: 'Collisions - 1D Elastic Collision Velocity Calculation',
    chapter: 'Force and Motion',
    explain: 'For an elastic collision with stationary target (u2 = 0): v1 = [(m1 - m2) / (m1 + m2)] u1. Substituting m1 = 2 kg, m2 = 4 kg, and u1 = 6 m/s: v1 = [(2 - 4) / (2 + 4)] × 6 = (-2 / 6) × 6 = -2.0 m/s (rebounding in the opposite direction).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Rotational and Circular Motion (3 MCQs: 4 to 6) ---
  {
    id: 'mdcat-b10-phy-4',
    q: 'A car of mass m navigates an unbanked circular curve of radius R on a level road with coefficient of static friction μs. What is the maximum speed (v_max) the car can achieve without skidding off the track?',
    options: [
      'v_max = √(μs g R)',
      'v_max = μs g R',
      'v_max = √(g R / μs)',
      'v_max = 1/2 μs g R²'
    ],
    correct: 0,
    topic: 'Circular Motion - Maximum Safe Speed on Flat Unbanked Curves',
    chapter: 'Rotational and Circular Motion',
    explain: 'On an unbanked curve, the necessary centripetal force is provided solely by static friction: F_c = m v² / R ≤ f_s,max = μs N = μs m g. Equating m v_max² / R = μs m g gives v_max = √(μs g R).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-5',
    q: 'A solid uniform cylinder and a thin hollow cylindrical hoop of identical mass M and radius R roll without slipping down an inclined plane from the same height. Which object reaches the bottom first with greater linear velocity?',
    options: [
      'The solid cylinder, because its moment of inertia is smaller (1/2 M R² vs M R²), resulting in less rotational kinetic energy and more translational kinetic energy',
      'The thin hollow hoop, because its moment of inertia is larger',
      'Both reach the bottom simultaneously because acceleration is mass-independent',
      'Whichever has the greater surface roughness'
    ],
    correct: 0,
    topic: 'Rotational Dynamics - Rolling Without Slipping on an Incline',
    chapter: 'Rotational and Circular Motion',
    explain: 'Linear acceleration on an incline is a = g sin(θ) / (1 + I / (M R²)). For a solid cylinder, I / (M R²) = 0.5, so a = (2/3) g sin(θ) ≈ 0.67 g sin(θ). For a hollow hoop, I / (M R²) = 1, so a = (1/2) g sin(θ) = 0.5 g sin(θ). The solid cylinder accelerates faster and reaches the bottom first.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-6',
    q: 'A figure skater spinning on frictionless ice pulls her extended arms and legs inward toward her body axis. What happens to her moment of inertia (I) and rotational kinetic energy (K_rot)?',
    options: [
      'Moment of inertia decreases, and rotational kinetic energy increases because of internal muscular work performed',
      'Moment of inertia decreases, and rotational kinetic energy remains constant',
      'Both moment of inertia and rotational kinetic energy decrease',
      'Angular momentum increases while kinetic energy decreases'
    ],
    correct: 0,
    topic: 'Conservation of Angular Momentum - Moment of Inertia and Rotational Energy',
    chapter: 'Rotational and Circular Motion',
    explain: 'External torque is zero, so angular momentum L = I ω is strictly conserved. Pulling mass inward reduces I, so angular velocity ω increases (ω = L / I). Rotational kinetic energy K_rot = L² / (2 I). As I decreases, K_rot increases. The additional energy comes from the biological muscular work done in pulling the limbs inward against centrifugal forces.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Oscillations (3 MCQs: 7 to 9) ---
  {
    id: 'mdcat-b10-phy-7',
    q: 'In simple harmonic motion (SHM) of an ideal mass-spring system, at what displacement from the equilibrium position (x = 0) is the kinetic energy equal to exactly half of the total mechanical energy (K = E / 2)?',
    options: [
      'x = ± x0 / √2 (where x0 is the amplitude)',
      'x = ± x0 / 2',
      'x = ± x0 / 4',
      'x = ± (√3 / 2) x0'
    ],
    correct: 0,
    topic: 'Simple Harmonic Motion - Energy Partitioning and Displacement',
    chapter: 'Oscillations',
    explain: 'Total energy E = 1/2 k x0². Potential energy U = 1/2 k x². When kinetic energy equals half total energy, potential energy must also equal half total energy: 1/2 k x² = 1/2 (1/2 k x0²) → x² = x0² / 2 → x = ± x0 / √2 ≈ ± 0.707 x0.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-8',
    q: 'A simple pendulum has a period of oscillation T on the surface of the Earth. If the length of the pendulum is quadrupled (4L) and it is transported to a planet where the local gravitational acceleration is 4g, what is its new period of oscillation?',
    options: [
      'T (unchanged)',
      '2T',
      '4T',
      'T / 2'
    ],
    correct: 0,
    topic: 'Simple Pendulum - Period Dependence on Length and Gravity',
    chapter: 'Oscillations',
    explain: 'The period of a simple pendulum is T = 2π √(L / g). With L\' = 4L and g\' = 4g: T\' = 2π √(4L / 4g) = 2π √(L / g) = T. The fourfold increase in length is exactly counterbalanced by the fourfold increase in gravitational acceleration.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-9',
    q: 'What physical condition defines resonance in a driven harmonic oscillator with light damping?',
    options: [
      'The driving frequency of the periodic external force matches the natural undamped frequency of the oscillator, maximizing amplitude',
      'The driving frequency is twice the natural frequency',
      'The damping coefficient approaches infinity',
      'The restoring force drops to zero'
    ],
    correct: 0,
    topic: 'Damped and Driven Oscillations - Resonance Phenomenon',
    chapter: 'Oscillations',
    explain: 'Resonance occurs when the external driving frequency matches the natural resonant frequency (ω = ω0) of the oscillating system. Energy transfer from the driver to the oscillator is maximized, producing large amplitude oscillations limited only by friction/damping.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Thermodynamics (3 MCQs: 10 to 12) ---
  {
    id: 'mdcat-b10-phy-10',
    q: 'A Carnot heat engine operates reversibly between a hot reservoir at 500 K and a cold reservoir at 300 K. What is the maximum theoretical thermodynamic efficiency of this engine?',
    options: [
      '40% (0.40)',
      '60% (0.60)',
      '20% (0.20)',
      '66.7%'
    ],
    correct: 0,
    topic: 'Carnot Engine - Maximum Theoretical Efficiency Calculation',
    chapter: 'Thermodynamics',
    explain: 'The efficiency of a Carnot cycle is η = 1 - (T_cold / T_hot). Substituting absolute temperatures: η = 1 - (300 K / 500 K) = 1 - 0.60 = 0.40 or 40%.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-11',
    q: 'In an adiabatic expansion of an ideal gas against an external piston, no heat is exchanged with the surroundings (Q = 0). What happens to the internal energy (U) and temperature (T) of the gas?',
    options: [
      'Work is done by the gas at the expense of its internal energy (ΔU = -W < 0), causing temperature to drop',
      'Internal energy increases because work is done on the gas',
      'Temperature remains strictly constant because Q = 0',
      'Internal energy remains constant while pressure increases'
    ],
    correct: 0,
    topic: 'First Law of Thermodynamics - Adiabatic Expansion and Temperature Drop',
    chapter: 'Thermodynamics',
    explain: 'By the first law of thermodynamics: ΔU = Q - W. In an adiabatic process, Q = 0, so ΔU = -W. Because the expanding gas does positive work on the surroundings (W > 0), ΔU is negative. For an ideal gas, internal energy is proportional to temperature (U = n Cv T), so the gas cools during expansion.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-12',
    q: 'For one mole of an ideal gas, the molar heat capacity at constant pressure (Cp) and at constant volume (Cv) are related by Mayer\'s equation as:',
    options: [
      'Cp - Cv = R (the universal gas constant)',
      'Cp / Cv = R',
      'Cp + Cv = R',
      'Cv - Cp = R'
    ],
    correct: 0,
    topic: 'Molar Heat Capacities - Mayer\'s Relation (Cp - Cv = R)',
    chapter: 'Thermodynamics',
    explain: 'At constant pressure, heat supplied must both increase internal energy (raising temperature, Cv ΔT) and perform boundary expansion work (P ΔV = R ΔT for 1 mole). Hence, Cp ΔT = Cv ΔT + R ΔT, yielding Cp - Cv = R.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electrostatics (3 MCQs: 13 to 15) ---
  {
    id: 'mdcat-b10-phy-13',
    q: 'Two point charges +q and -q are separated by a distance d in a vacuum, forming an electric dipole. What is the electric potential (V) at the midpoint along the perpendicular bisector line connecting the two charges?',
    options: [
      'Exactly zero (0 V)',
      'k q / d',
      '2 k q / d',
      'k q / d²'
    ],
    correct: 0,
    topic: 'Electric Dipole - Potential on the Equatorial Perpendicular Bisector',
    chapter: 'Electrostatics',
    explain: 'Electric potential is a scalar quantity: V = V+ + V- = k(+q)/r + k(-q)/r. Any point on the perpendicular bisector line is equidistant (r) from both charges. The positive potential from +q exactly cancels the negative potential from -q, yielding V = 0 V everywhere on the equatorial plane.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-14',
    q: 'A parallel-plate capacitor of capacitance C0 is charged to potential V0 and then disconnected from the battery. A dielectric slab of relative permittivity (dielectric constant) εr = 4 is inserted between the plates. What are the new capacitance (C) and stored electrostatic energy (U)?',
    options: [
      'C = 4 C0; U = U0 / 4',
      'C = 4 C0; U = 4 U0',
      'C = C0 / 4; U = U0 / 4',
      'C = C0; U = U0'
    ],
    correct: 0,
    topic: 'Capacitance - Dielectric Insertion in Disconnected Capacitor',
    chapter: 'Electrostatics',
    explain: 'Because the battery is disconnected, charge Q remains constant (Q = Q0). Capacitance increases: C = εr C0 = 4 C0. Stored energy U = Q² / (2C) = Q0² / (2 × 4C0) = U0 / 4. (The missing electrostatic energy is converted into mechanical work pulling the dielectric into the plates).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-15',
    q: 'According to Gauss\'s law, the net electric flux (ΦE) through any closed Gaussian surface enclosing a net electric charge Q_enc in a vacuum is:',
    options: [
      'ΦE = Q_enc / ε0',
      'ΦE = Q_enc × ε0',
      'ΦE = Q_enc / (4π ε0 r²)',
      'ΦE = zero regardless of charge'
    ],
    correct: 0,
    topic: 'Gauss\'s Law - Net Electric Flux through Closed Surface',
    chapter: 'Electrostatics',
    explain: 'Gauss\'s law states that the surface integral of the electric field over any closed surface is proportional to the total enclosed charge: ∮ E · dA = Q_enc / ε0. Flux depends solely on enclosed charge and is independent of the geometry or size of the Gaussian surface.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Current Electricity (4 MCQs: 16 to 19) ---
  {
    id: 'mdcat-b10-phy-16',
    q: 'A cylindrical metallic wire of resistance R is uniformly drawn and stretched until its length is tripled (L\' = 3L) while keeping its volume constant. What is the new resistance (R\') of the wire?',
    options: [
      '9 R',
      '3 R',
      '6 R',
      'R / 3'
    ],
    correct: 0,
    topic: 'Current Electricity - Wire Stretching and Resistance Scaling (R ∝ L²)',
    chapter: 'Current Electricity',
    explain: 'Volume V = A × L is constant. When length triples (L\' = 3L), cross-sectional area decreases to one-third (A\' = A / 3). New resistance R\' = ρ L\' / A\' = ρ (3L) / (A / 3) = 9 (ρ L / A) = 9 R.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-17',
    q: 'Kirchhoff\'s Junction Rule (Current Law, Σ I_in = Σ I_out) and Kirchhoff\'s Loop Rule (Voltage Law, Σ ΔV = 0) are consequences of which fundamental conservation laws, respectively?',
    options: [
      'Conservation of electric charge and conservation of energy',
      'Conservation of energy and conservation of linear momentum',
      'Conservation of electric charge and conservation of angular momentum',
      'Conservation of mass and conservation of electric charge'
    ],
    correct: 0,
    topic: 'Kirchhoff\'s Laws - Conservation of Charge and Conservation of Energy',
    chapter: 'Current Electricity',
    explain: 'Kirchhoff\'s Current Law (junction rule) reflects conservation of charge: charge cannot accumulate or vanish at a node in steady-state current flow. Kirchhoff\'s Voltage Law (loop rule) reflects conservation of energy: the work done moving a unit charge around any closed loop in an electrostatic field is zero.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-18',
    q: 'A real battery has an electromotive force (EMF) E = 12.0 V and an internal resistance r = 1.0 Ω. When connected to an external load resistor R = 5.0 Ω, what is the terminal potential difference (V_t) across the battery terminals?',
    options: [
      '10.0 V',
      '12.0 V',
      '2.0 V',
      '6.0 V'
    ],
    correct: 0,
    topic: 'Current Electricity - EMF and Terminal Potential Difference',
    chapter: 'Current Electricity',
    explain: 'Total circuit current I = E / (R + r) = 12.0 V / (5.0 + 1.0 Ω) = 12.0 / 6.0 = 2.0 A. Terminal voltage V_t = E - I r = 12.0 V - (2.0 A × 1.0 Ω) = 12.0 - 2.0 = 10.0 V (or V_t = I R = 2.0 A × 5.0 Ω = 10.0 V).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-19',
    q: 'Why is a potentiometer inherently more accurate than a standard analog voltmeter for measuring the true electromotive force (EMF) of a cell?',
    options: [
      'At the null balance point, the potentiometer draws zero current from the test cell, measuring true open-circuit EMF without internal resistance voltage drops',
      'It contains superconducting components that eliminate all thermal noise',
      'It converts direct current into high-frequency alternating current',
      'It has zero electrical resistance along its slide wire'
    ],
    correct: 0,
    topic: 'Potentiometer - Null Deflection Method vs Voltmeter Loading',
    chapter: 'Current Electricity',
    explain: 'A standard voltmeter has finite resistance and must draw current from the cell, causing an internal voltage drop (Ir), so it measures terminal voltage V = E - Ir rather than true EMF. A potentiometer operates on the null deflection principle: at balance, current from the unknown cell is zero (I = 0), measuring true open-circuit EMF E.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Dawn of Modern Physics (4 MCQs: 20 to 23) ---
  {
    id: 'mdcat-b10-phy-20',
    q: 'In the photoelectric effect, if the frequency (f) of the incident monochromatic light is kept constant above the threshold frequency (f > f0) while the intensity of the light is doubled, what happens to the photocurrent and the maximum kinetic energy (K_max) of the emitted photoelectrons?',
    options: [
      'The saturation photocurrent doubles, while K_max remains completely unchanged',
      'Both the photocurrent and K_max double',
      'K_max doubles while photocurrent remains unchanged',
      'Photocurrent drops to zero because photon flux saturates the surface'
    ],
    correct: 0,
    topic: 'Photoelectric Effect - Intensity vs Frequency Effects on Photocurrent and K_max',
    chapter: 'Dawn of Modern Physics',
    explain: 'Light intensity corresponds to photon arrival rate (number of photons per second). Doubling intensity doubles the number of photons striking the cathode per second, doubling the emitted photoelectrons and saturation current. K_max = h f - Φ depends solely on photon frequency f and work function Φ, and is independent of intensity.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-21',
    q: 'In Compton scattering, an X-ray photon of wavelength λ collides with a stationary free electron and is scattered at an angle θ = 180° (backward scattering). What is the Compton wavelength shift (Δλ)? (Compton wavelength λ_C = h / (m_e c) ≈ 2.43 × 10⁻¹² m)',
    options: [
      'Δλ = 2 λ_C ≈ 4.86 × 10⁻¹² m',
      'Δλ = λ_C ≈ 2.43 × 10⁻¹² m',
      'Δλ = zero',
      'Δλ = 4 λ_C'
    ],
    correct: 0,
    topic: 'Compton Effect - Maximum Compton Shift at 180° Backscattering',
    chapter: 'Dawn of Modern Physics',
    explain: 'The Compton shift formula is Δλ = λ\' - λ = (h / m_e c)(1 - cos θ) = λ_C (1 - cos θ). At θ = 180°, cos(180°) = -1, so (1 - cos θ) = 1 - (-1) = 2. Maximum shift Δλ_max = 2 λ_C = 2 × 2.43 pm = 4.86 pm.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-22',
    q: 'What is the minimum photon energy required for pair production (creation of an electron and a positron) in the Coulomb field of an atomic nucleus? (Rest mass energy of electron m_e c² = 0.511 MeV)',
    options: [
      '1.022 MeV',
      '0.511 MeV',
      '2.044 MeV',
      '13.6 eV'
    ],
    correct: 0,
    topic: 'Pair Production - Threshold Energy Requirement',
    chapter: 'Dawn of Modern Physics',
    explain: 'By Einstein\'s mass-energy equivalence E = m c², the total energy needed to create an electron-positron pair at rest is E_min = 2 m_e c² = 2 × 0.511 MeV = 1.022 MeV. Any photon energy exceeding 1.022 MeV appears as kinetic energy of the emitted particle pair.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-23',
    q: 'According to Heisenberg\'s uncertainty principle (Δx · Δp ≥ h / 4π), if the uncertainty in the position of an electron is reduced to zero (Δx → 0), what does the uncertainty in its momentum (Δp) become?',
    options: [
      'Approaches infinity (Δp → ∞)',
      'Zero (Δp = 0)',
      'Equal to Planck\'s constant (h)',
      'Indeterminate finite constant'
    ],
    correct: 0,
    topic: 'Quantum Mechanics - Heisenberg\'s Uncertainty Principle Limits',
    chapter: 'Dawn of Modern Physics',
    explain: 'From Δp ≥ h / (4π Δx), as Δx approaches 0 (absolute precision in spatial localization), the uncertainty in momentum Δp approaches infinity. It is impossible to simultaneously measure both conjugate variables with arbitrary precision.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Nuclear Physics (4 MCQs: 24 to 27) ---
  {
    id: 'mdcat-b10-phy-24',
    q: 'A radioactive isotope sample has a half-life of 8.0 days. What fraction of the original radioactive nuclei will remain undecayed after 32.0 days?',
    options: [
      '1 / 16 (6.25%)',
      '1 / 8 (12.5%)',
      '1 / 32 (3.125%)',
      '1 / 4 (25%)'
    ],
    correct: 0,
    topic: 'Radioactivity - Exponential Decay and Half-Life Calculations',
    chapter: 'Nuclear Physics',
    explain: 'Number of half-lives elapsed n = Total time (t) / Half-life (T_1/2) = 32 days / 8 days = 4 half-lives. Fraction remaining N / N0 = (1/2)^n = (1/2)⁴ = 1 / 16 (or 6.25%).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-25',
    q: 'When an unstable parent nucleus decays by emitting an alpha (α) particle, how do its atomic number (Z) and mass number (A) change?',
    options: [
      'Z decreases by 2, and A decreases by 4',
      'Z increases by 1, and A remains unchanged',
      'Z decreases by 1, and A remains unchanged',
      'Z decreases by 4, and A decreases by 2'
    ],
    correct: 0,
    topic: 'Radioactivity - Alpha Decay Nuclear Conservation Rules',
    chapter: 'Nuclear Physics',
    explain: 'An alpha particle is a helium nucleus (⁴₂He²⁺) containing 2 protons and 2 neutrons. Conservation of nucleon number and charge mandates: ᴬ_Z X → ᴬ⁻⁴_{Z-2} Y + ⁴₂He. Thus, atomic number Z drops by 2 and mass number A drops by 4.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-26',
    q: 'In the nuclear fission of uranium-235 triggered by thermal neutrons: ²³⁵₉₂U + ¹₀n → ¹⁴¹₅₆Ba + ⁹²₃₆Kr + x ¹₀n, what is the stoichiometric number of prompt neutrons (x) released?',
    options: [
      '3 neutrons',
      '2 neutrons',
      '1 neutron',
      '4 neutrons'
    ],
    correct: 0,
    topic: 'Nuclear Fission - Neutron Balance in Uranium-235 Fission',
    chapter: 'Nuclear Physics',
    explain: 'Conservation of mass number: A_reactants = 235 + 1 = 236. A_products = 141 + 92 + x(1) = 233 + x. Equating: 236 = 233 + x → x = 3 neutrons. These prompt neutrons sustain the nuclear chain reaction.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-27',
    q: 'Which subatomic particle is emitted alongside a positron during positive beta (β⁺) decay to satisfy conservation of lepton number?',
    options: [
      'An electron neutrino (νe)',
      'An electron antineutrino (ν̄e)',
      'A muon neutrino',
      'A photon'
    ],
    correct: 0,
    topic: 'Nuclear Decay - Beta-Plus Decay and Neutrino Emission',
    chapter: 'Nuclear Physics',
    explain: 'In β⁺ decay: p → n + e⁺ + νe. A proton converts to a neutron, emitting a positron (lepton number L = -1). To conserve total lepton number (L = 0 before and after), an electron neutrino (lepton number L = +1) must be emitted.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Measurements (3 MCQs: 28 to 30) ---
  {
    id: 'mdcat-b10-phy-28',
    q: 'What is the base SI unit for luminous intensity?',
    options: [
      'Candela (cd)',
      'Lumen (lm)',
      'Lux (lx)',
      'Watt per steradian'
    ],
    correct: 0,
    topic: 'SI Units - Seven Base Physical Units (Candela)',
    chapter: 'Measurements',
    explain: 'The seven base SI units are: meter (length), kilogram (mass), second (time), ampere (electric current), kelvin (thermodynamic temperature), mole (amount of substance), and candela (luminous intensity). Lumen and lux are derived units.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-29',
    q: 'When measuring the period of a simple pendulum, an experimenter uses a stopwatch with a least count of 0.1 s to measure the duration of 20 complete oscillations, recording a total time of 40.0 s. What is the fractional uncertainty in the measured period of a single oscillation?',
    options: [
      '0.0025 (or 0.25%)',
      '0.05 (or 5.0%)',
      '0.025 (or 2.5%)',
      '0.01 (or 1.0%)'
    ],
    correct: 0,
    topic: 'Error Analysis - Timing Multiple Oscillations and Fractional Uncertainty',
    chapter: 'Measurements',
    explain: 'The total elapsed time is t = 40.0 s with an absolute uncertainty equal to the stopwatch least count Δt = 0.1 s. Fractional uncertainty in the measurement is Δt / t = 0.1 s / 40.0 s = 1 / 400 = 0.0025 (0.25%). Because the period of a single oscillation is T = t / 20, the fractional uncertainty in T is identical: (Δt / 20) / (t / 20) = Δt / t = 0.0025.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-30',
    q: 'What are the dimensions of dynamic viscosity (η) in terms of base dimensions of mass (M), length (L), and time (T) derived from Stokes\' law F = 6πηrv?',
    options: [
      '[M L⁻¹ T⁻¹]',
      '[M L T⁻²]',
      '[M L⁻² T⁻¹]',
      '[M L² T⁻¹]'
    ],
    correct: 0,
    topic: 'Dimensional Analysis - Viscosity Dimensions from Stokes\' Law',
    chapter: 'Measurements',
    explain: 'From Stokes\' law, η = F / (6π r v). Dimensions: [F] = [M L T⁻²]; [r] = [L]; [v] = [L T⁻¹]. Therefore, [η] = [M L T⁻²] / ([L][L T⁻¹]) = [M L T⁻²] / [L² T⁻¹] = [M L⁻¹ T⁻¹] (SI units: Pa·s or kg·m⁻¹·s⁻¹).',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Scalars and Vectors (3 MCQs: 31 to 33) ---
  {
    id: 'mdcat-b10-phy-31',
    q: 'If the scalar (dot) product of two non-zero vectors A and B equals the magnitude of their vector (cross) product (|A · B| = |A × B|), what is the angle (θ) between them?',
    options: [
      '45° (or π/4 radians)',
      '90°',
      '0°',
      '60°'
    ],
    correct: 0,
    topic: 'Vectors - Equivalence of Dot Product and Cross Product Magnitudes',
    chapter: 'Scalars and Vectors',
    explain: '|A · B| = A B cos(θ) and |A × B| = A B sin(θ). Equating them: A B cos(θ) = A B sin(θ) → tan(θ) = 1 → θ = 45°.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-32',
    q: 'Two force vectors of magnitudes 8 N and 6 N act simultaneously at a single point. Which of the following cannot be the magnitude of their resultant vector?',
    options: [
      '1 N',
      '14 N',
      '10 N',
      '2 N'
    ],
    correct: 0,
    topic: 'Vector Addition - Range of Resultant Vector Magnitudes',
    chapter: 'Scalars and Vectors',
    explain: 'The magnitude of the resultant of two vectors ranges from |A - B| (minimum when antiparallel at 180°) to (A + B) (maximum when parallel at 0°). For 8 N and 6 N, R_min = 8 - 6 = 2 N and R_max = 8 + 6 = 14 N. Any value between 2 N and 14 N is possible; 1 N is physically impossible.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-33',
    q: 'A rigid body is in complete static equilibrium if and only if which two mathematical conditions are satisfied?',
    options: [
      'The vector sum of all external forces is zero (Σ F = 0) and the vector sum of all external torques about any pivot point is zero (Σ τ = 0)',
      'The linear velocity is constant and non-zero',
      'The net torque is zero while net force is non-zero',
      'The body is rotating with constant non-zero angular acceleration'
    ],
    correct: 0,
    topic: 'Equilibrium of Rigid Bodies - First and Second Conditions of Equilibrium',
    chapter: 'Scalars and Vectors',
    explain: 'First condition of equilibrium (translational equilibrium): Σ F_ext = 0 (no linear acceleration). Second condition of equilibrium (rotational equilibrium): Σ τ_ext = 0 (no angular acceleration). Complete static equilibrium requires both conditions and zero velocity.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Work, Energy and Power (3 MCQs: 34 to 36) ---
  {
    id: 'mdcat-b10-phy-34',
    q: 'An electric pump lifts 200 kg of water through a vertical height of 10 meters in 20 seconds. If g = 9.8 m/s², what is the average useful power output delivered by the pump?',
    options: [
      '980 W',
      '1960 W',
      '490 W',
      '98 W'
    ],
    correct: 0,
    topic: 'Power - Work Done and Average Power Calculation',
    chapter: 'Work, Energy and Power',
    explain: 'Work done against gravity W = m g h = 200 kg × 9.8 m/s² × 10 m = 19,600 Joules. Power P = W / t = 19,600 J / 20 s = 980 Watts.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-35',
    q: 'If the linear momentum of an object is doubled (p\' = 2p) while its mass remains constant, by what factor does its kinetic energy increase?',
    options: [
      '4 times (400% of original)',
      '2 times',
      '8 times',
      '16 times'
    ],
    correct: 0,
    topic: 'Kinetic Energy and Momentum - K = p² / (2m) Relationship',
    chapter: 'Work, Energy and Power',
    explain: 'Kinetic energy is related to momentum by K = p² / (2m). If momentum doubles to 2p, new kinetic energy K\' = (2p)² / (2m) = 4 [p² / (2m)] = 4 K. Kinetic energy quadruples.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-36',
    q: 'Which of the following forces is a non-conservative force because the work done by it over a closed loop path is non-zero and depends on the trajectory taken?',
    options: [
      'Frictional force',
      'Gravitational force',
      'Electrostatic force',
      'Ideal spring restoring force'
    ],
    correct: 0,
    topic: 'Conservative vs Non-Conservative Forces - Friction and Path Dependence',
    chapter: 'Work, Energy and Power',
    explain: 'In a conservative force (gravity, electrostatics, spring force), work done over any closed path is zero (∮ F · dr = 0) and depends only on endpoints. Friction always opposes motion, dissipating mechanical energy as heat regardless of direction (∮ f · dr < 0); hence, it is non-conservative.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Fluid Dynamics (3 MCQs: 37 to 39) ---
  {
    id: 'mdcat-b10-phy-37',
    q: 'According to Bernoulli\'s principle for steady, incompressible, non-viscous fluid streamline flow, what happens to the internal fluid pressure where the flow speed increases across a horizontal constriction (Venturi effect)?',
    options: [
      'Static pressure decreases',
      'Static pressure increases proportionally',
      'Static pressure remains unchanged',
      'Static pressure drops to absolute zero'
    ],
    correct: 0,
    topic: 'Fluid Dynamics - Bernoulli\'s Equation and Venturi Effect',
    chapter: 'Fluid Dynamics',
    explain: 'Bernoulli\'s equation along a horizontal streamline is P + 1/2 ρ v² = constant. Where the pipe narrows, equation of continuity (A1 v1 = A2 v2) dictates flow speed v must increase. Consequently, dynamic pressure (1/2 ρ v²) increases, causing static pressure P to decrease.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-38',
    q: 'A spherical raindrop of radius r falls through air of viscosity η and density ρ under gravity. When the raindrop reaches its constant terminal velocity (v_t), Stokes\' drag force plus buoyancy balances gravity. Terminal velocity is directly proportional to:',
    options: [
      'The square of the radius (r²)',
      'The radius (r)',
      'The cube of the radius (r³)',
      '1 / r'
    ],
    correct: 0,
    topic: 'Terminal Velocity - Stokes\' Law and Radius Scaling (v_t ∝ r²)',
    chapter: 'Fluid Dynamics',
    explain: 'At terminal velocity, weight equals drag force (neglecting air buoyancy): m g = 6πη r v_t → (4/3 π r³ ρ) g = 6πη r v_t → v_t = (2 r² ρ g) / (9 η). Hence, terminal velocity is directly proportional to r².',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-39',
    q: 'According to Torricelli\'s theorem, the speed of efflux (v) of an ideal liquid exiting a small orifice located a depth h below the open surface of an open tank is equal to:',
    options: [
      'v = √(2 g h)',
      'v = 2 g h',
      'v = √(g h)',
      'v = 1/2 g h²'
    ],
    correct: 0,
    topic: 'Fluid Dynamics - Torricelli\'s Law of Efflux',
    chapter: 'Fluid Dynamics',
    explain: 'Applying Bernoulli\'s equation between the open tank surface (v1 ≈ 0, P1 = P_atm) and the exit orifice (P2 = P_atm, height difference h): P_atm + ρ g h = P_atm + 1/2 ρ v² → v = √(2 g h), identical to the speed of a freely falling body dropped from height h.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Waves (3 MCQs: 40 to 42) ---
  {
    id: 'mdcat-b10-phy-40',
    q: 'In a standing (stationary) wave formed on a string fixed at both ends, the distance between any two consecutive nodes (or two consecutive antinodes) is equal to:',
    options: [
      'λ / 2 (half wavelength)',
      'λ (one full wavelength)',
      'λ / 4 (quarter wavelength)',
      '2 λ'
    ],
    correct: 0,
    topic: 'Standing Waves - Node-to-Node Distance and Harmonic Wavelengths',
    chapter: 'Waves',
    explain: 'In a standing wave, nodes are points of zero amplitude and antinodes are points of maximum amplitude. The distance between two successive nodes (or two successive antinodes) is exactly half a wavelength (λ / 2). The distance between a node and the adjacent antinode is λ / 4.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-41',
    q: 'A sound source emitting a constant frequency fs moves directly toward a stationary observer at speed vs in still air where sound travels at speed v. What frequency (f\') is perceived by the observer according to the Doppler effect?',
    options: [
      'f\' = fs [ v / (v - vs) ] (higher frequency)',
      'f\' = fs [ v / (v + vs) ] (lower frequency)',
      'f\' = fs [ (v + vs) / v ]',
      'f\' = fs'
    ],
    correct: 0,
    topic: 'Doppler Effect - Moving Source Approaching Stationary Observer',
    chapter: 'Waves',
    explain: 'When the source moves toward the observer, wave crests are bunched closer together in front of the source, shortening observed wavelength: λ\' = (v - vs) / fs. Perceived frequency f\' = v / λ\' = fs [ v / (v - vs) ]. Because the denominator is smaller, perceived frequency is higher.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-42',
    q: 'In Young\'s double-slit interference experiment, the fringe width (fringe spacing y) between consecutive bright fringes is expressed as:',
    options: [
      'y = λ L / d (where L is screen distance, d is slit separation)',
      'y = λ d / L',
      'y = d L / λ',
      'y = λ / (2 d L)'
    ],
    correct: 0,
    topic: 'Wave Optics - Young\'s Double-Slit Fringe Width Formula',
    chapter: 'Waves',
    explain: 'Fringe spacing y is the distance between consecutive bright (or dark) bands on the screen: y = λ L / d, where λ is the light wavelength, L is the distance from the double slits to the observation screen, and d is the distance between the two slit centers.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electromagnetism (3 MCQs: 43 to 45) ---
  {
    id: 'mdcat-b10-phy-43',
    q: 'A charged particle carrying charge q enters a uniform magnetic field B with velocity v directed at an angle θ = 90° to the field lines. What trajectory does the particle describe?',
    options: [
      'A circle in a plane perpendicular to the magnetic field with radius r = m v / (q B)',
      'A straight line parallel to the magnetic field',
      'A parabola with constant linear acceleration',
      'A hyperbolic trajectory escaping the field'
    ],
    correct: 0,
    topic: 'Lorentz Magnetic Force - Circular Trajectory in Perpendicular Field',
    chapter: 'Electromagnetism',
    explain: 'The magnetic force F = q (v × B) has magnitude F = q v B when θ = 90°. Because force is always perpendicular to instantaneous velocity, it does zero work and acts as a pure centripetal force: q v B = m v² / r → r = m v / (q B), producing uniform circular motion.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-44',
    q: 'Two long, straight parallel wires separated by a distance d in a vacuum carry electric currents I1 and I2 flowing in the same direction. What is the nature and magnitude of the magnetic force per unit length (F/L) between them?',
    options: [
      'Attractive force with magnitude F/L = (μ0 I1 I2) / (2π d)',
      'Repulsive force with magnitude F/L = (μ0 I1 I2) / (2π d)',
      'Attractive force with magnitude F/L = (μ0 I1 I2) / (4π d²)',
      'Zero force because electric fields cancel'
    ],
    correct: 0,
    topic: 'Electromagnetism - Magnetic Force Between Parallel Current-Carrying Wires',
    chapter: 'Electromagnetism',
    explain: 'By Ampère\'s law and the right-hand rule, parallel currents flowing in the same direction produce an attractive magnetic force per unit length F/L = (μ0 I1 I2) / (2π d). Antiparallel currents flowing in opposite directions repel.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-45',
    q: 'According to Ampère\'s circuital law, the line integral of magnetic field B around any closed loop in a vacuum is equal to:',
    options: [
      'μ0 multiplied by the total enclosed current (∮ B · dl = μ0 I_enc)',
      'Zero for all closed loops',
      'ε0 multiplied by the electric flux',
      'μ0 / I_enc'
    ],
    correct: 0,
    topic: 'Ampère\'s Circuital Law - Closed Line Integral of Magnetic Field',
    chapter: 'Electromagnetism',
    explain: 'Ampère\'s circuital law states: ∮ B · dl = μ0 I_enc, where I_enc is the net electric conduction current passing through any surface bounded by the closed Amperian loop.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electromagnetic Induction (3 MCQs: 46 to 48) ---
  {
    id: 'mdcat-b10-phy-46',
    q: 'According to Faraday\'s law of electromagnetic induction, the magnitude of the induced electromotive force (EMF) in a closed coil is directly proportional to:',
    options: [
      'The time rate of change of magnetic flux through the coil (EMF = -N dΦB / dt)',
      'The absolute magnitude of the static magnetic field',
      'The electrical resistance of the wire coil',
      'The length of the connecting circuit wires'
    ],
    correct: 0,
    topic: 'Electromagnetic Induction - Faraday\'s Law of Induced EMF',
    chapter: 'Electromagnetic Induction',
    explain: 'Faraday\'s law states that whenever magnetic flux linking a circuit changes with time, an EMF is induced proportional to the rate of change: EMF = -N (ΔΦB / Δt). The negative sign is Lenz\'s law.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-47',
    q: 'Lenz\'s law states that the polarity of an induced EMF is such that it produces a current whose magnetic field opposes the change in magnetic flux that created it. Lenz\'s law is a direct consequence of:',
    options: [
      'The law of conservation of energy',
      'The law of conservation of electric charge',
      'Newton\'s law of universal gravitation',
      'The law of conservation of linear momentum'
    ],
    correct: 0,
    topic: 'Lenz\'s Law - Conservation of Energy in Electromagnetic Induction',
    chapter: 'Electromagnetic Induction',
    explain: 'If the induced current aided the flux change rather than opposing it, energy would be created from nothing without mechanical work being performed, violating energy conservation. The mechanical work done against the opposing induced magnetic force provides the electrical energy generated.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-48',
    q: 'A straight conducting rod of length L moves with constant velocity v perpendicular to both its own length and a uniform magnetic field B. What is the motional EMF induced across the ends of the rod?',
    options: [
      'EMF = v B L',
      'EMF = 1/2 v B L',
      'EMF = v² B L',
      'EMF = v B / L'
    ],
    correct: 0,
    topic: 'Electromagnetic Induction - Motional EMF in a Moving Conductor',
    chapter: 'Electromagnetic Induction',
    explain: 'Magnetic force on free conduction electrons is F_m = q (v × B). When v, B, and L are mutually perpendicular, this produces an electric field E = v B inside the conductor. Integrating along length L yields motional EMF = E L = v B L.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electronics (3 MCQs: 49 to 51) ---
  {
    id: 'mdcat-b10-phy-49',
    q: 'In an intrinsic semiconductor (such as pure silicon or germanium), what is the relationship between the concentration of free conduction electrons (n) and valence band holes (p)?',
    options: [
      'n = p = ni (electron and hole concentrations are strictly equal)',
      'n >> p (electrons are majority carriers)',
      'p >> n (holes are majority carriers)',
      'n = 0 at all temperatures above absolute zero'
    ],
    correct: 0,
    topic: 'Semiconductors - Intrinsic Semiconductors and Carrier Concentrations',
    chapter: 'Electronics',
    explain: 'In an undoped intrinsic semiconductor, thermal excitation promotes an electron across the bandgap from the valence band to the conduction band, leaving behind exactly one vacant state (hole). Thus, electron concentration n equals hole concentration p (n = p = ni).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-50',
    q: 'In a full-wave bridge rectifier circuit operating on a 50 Hz sinusoidal alternating current (AC) input, what is the fundamental ripple frequency of the output direct current (DC)?',
    options: [
      '100 Hz',
      '50 Hz',
      '25 Hz',
      '200 Hz'
    ],
    correct: 0,
    topic: 'Rectification - Full-Wave Bridge Rectifier Ripple Frequency',
    chapter: 'Electronics',
    explain: 'A half-wave rectifier passes one pulse per AC cycle (ripple frequency = f_in = 50 Hz). A full-wave rectifier conducts during both positive and negative half-cycles, producing two output voltage pulses per input cycle. Output ripple frequency = 2 × f_in = 2 × 50 Hz = 100 Hz.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-51',
    q: 'An operational amplifier (op-amp) connected in inverting amplifier configuration has an input resistor R_in = 10 kΩ and a feedback resistor R_f = 100 kΩ. What is the closed-loop voltage gain (Av)?',
    options: [
      'Av = -10',
      'Av = +10',
      'Av = -100',
      'Av = -0.1'
    ],
    correct: 0,
    topic: 'Operational Amplifiers - Inverting Amplifier Voltage Gain (Av = -Rf / Rin)',
    chapter: 'Electronics',
    explain: 'Due to virtual ground at the inverting terminal, input current I_in = V_in / R_in. Since no current enters the ideal op-amp input, this current flows through R_f: (0 - V_out) / R_f = I_in = V_in / R_in. Thus, V_out / V_in = Av = -R_f / R_in = -100 kΩ / 10 kΩ = -10.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Alternating Current (3 MCQs: 52 to 54) ---
  {
    id: 'mdcat-b10-phy-52',
    q: 'For a sinusoidal alternating voltage with peak amplitude V0 = 311 V, what is its root-mean-square (RMS) effective voltage value?',
    options: [
      '220 V',
      '155 V',
      '311 V',
      '240 V'
    ],
    correct: 0,
    topic: 'Alternating Current - Peak vs Root-Mean-Square (RMS) Voltage Value',
    chapter: 'Alternating Current',
    explain: 'For a sine wave, V_rms = V0 / √2 = V0 / 1.414 ≈ 0.707 × V0. With V0 = 311 V: V_rms = 311 / 1.414 ≈ 220 V (standard domestic utility AC voltage).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-53',
    q: 'In an AC circuit containing a pure inductor of inductance L connected to an AC voltage source of frequency f, how does the current (I) compare in phase with the voltage (V)?',
    options: [
      'Current lags behind voltage by 90° (π/2 radians)',
      'Current leads voltage by 90° (π/2 radians)',
      'Current and voltage are strictly in phase',
      'Current lags behind voltage by 180°'
    ],
    correct: 0,
    topic: 'AC Circuits - Pure Inductive Circuit Phase Relationship',
    chapter: 'Alternating Current',
    explain: 'In a purely inductive circuit, back EMF opposes current buildup according to V = L (dI/dt). Current lags voltage by 90° (π/2 radians), or voltage leads current by 90° (remember mnemonic ELI: EMF leads current I in an inductor L).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-54',
    q: 'In a series RLC resonant circuit, what is the total circuit impedance (Z) at the resonant frequency f0 = 1 / (2π √(L C))?',
    options: [
      'Z = R (impedance is purely resistive and at its absolute minimum value)',
      'Z = 0',
      'Z = √(R² + (ωL)²)',
      'Z approaches infinity'
    ],
    correct: 0,
    topic: 'Series RLC Resonance - Minimum Impedance and Maximum Current',
    chapter: 'Alternating Current',
    explain: 'Total impedance is Z = √[R² + (X_L - X_C)²]. At resonance, inductive reactance equals capacitive reactance (X_L = X_C = ωL = 1/ωC), so the reactive term cancels to zero: Z = √[R² + 0] = R. Impedance is at its minimum, maximizing circuit current.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Physics of Solids (3 MCQs: 55 to 57) ---
  {
    id: 'mdcat-b10-phy-55',
    q: 'According to Hooke\'s law within the elastic limit of a solid material, Young\'s modulus of elasticity (Y) is defined as:',
    options: [
      'Tensile stress divided by tensile strain (Y = σ / ε)',
      'Tensile strain divided by tensile stress',
      'Shear stress divided by volume strain',
      'Total mechanical force multiplied by elongation'
    ],
    correct: 0,
    topic: 'Elasticity - Young\'s Modulus Definition (Stress / Strain)',
    chapter: 'Physics of Solids',
    explain: 'Young\'s modulus Y measures the resistance of a solid to linear longitudinal deformation: Y = Tensile Stress / Tensile Strain = (F / A) / (ΔL / L0) = (F L0) / (A ΔL). Its SI unit is N/m² or Pascal (Pa).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-56',
    q: 'According to energy band theory, how do the valence band, conduction band, and forbidden energy gap (Eg) characterize an electrical insulator at room temperature?',
    options: [
      'A completely filled valence band, an empty conduction band, and a very wide forbidden energy bandgap (Eg > 5 eV)',
      'Overlapping valence and conduction bands with zero bandgap',
      'A narrow bandgap of approximately 1 eV permitting thermal excitation',
      'A partially filled conduction band with free valence states'
    ],
    correct: 0,
    topic: 'Band Theory of Solids - Insulators vs Conductors and Semiconductors',
    chapter: 'Physics of Solids',
    explain: 'In electrical insulators (e.g., diamond, quartz), the valence band is completely full and the conduction band is completely empty. The forbidden bandgap Eg is wide (>5-6 eV), so thermal energy at room temperature (kT ≈ 0.026 eV) cannot excite valence electrons across the gap.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-57',
    q: 'Superconductors, when cooled below their critical transition temperature (Tc), exhibit zero electrical resistivity and completely expel internal magnetic field lines from their interior. This magnetic expulsion phenomenon is known as the:',
    options: [
      'Meissner effect',
      'Curie effect',
      'Hall effect',
      'Zeeman effect'
    ],
    correct: 0,
    topic: 'Superconductivity - Meissner Effect and Perfect Diamagnetism',
    chapter: 'Physics of Solids',
    explain: 'The Meissner effect is the total expulsion of magnetic flux from the interior of a superconductor as it transitions into the superconducting state below Tc. The material exhibits perfect diamagnetism with magnetic susceptibility χ = -1.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Atomic Spectra (3 MCQs: 58 to 60) ---
  {
    id: 'mdcat-b10-phy-58',
    q: 'According to Bohr\'s quantum postulate for the hydrogen atom, what is the quantization condition for the orbital angular momentum (L) of an electron in the n-th stationary orbit?',
    options: [
      'L = n h / (2π) (where n = 1, 2, 3...)',
      'L = n h / (4π)',
      'L = 2π n / h',
      'L = n² h / (2π)'
    ],
    correct: 0,
    topic: 'Bohr Model - Quantization of Orbital Angular Momentum',
    chapter: 'Atomic Spectra',
    explain: 'Bohr\'s second postulate states that an electron can only revolve in orbits where its orbital angular momentum is an integral multiple of h / (2π) = ħ: m v r = n (h / 2π), where n is the principal quantum number.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-59',
    q: 'In the characteristic X-ray emission spectrum of heavy target metals, a K-alpha (Kα) X-ray photon is emitted when an electron makes a radiative transition from:',
    options: [
      'The L-shell (n = 2) to a vacancy in the K-shell (n = 1)',
      'The M-shell (n = 3) to a vacancy in the K-shell (n = 1)',
      'The conduction band to the valence band',
      'The K-shell to the free continuum'
    ],
    correct: 0,
    topic: 'Characteristic X-Rays - Electronic Transitions (Kα and Kβ)',
    chapter: 'Atomic Spectra',
    explain: 'When an energetic incident electron knocks an inner-shell electron out of the K-shell (n = 1), outer-shell electrons fall to fill the vacancy. A transition from the L-shell (n = 2) to the K-shell (n = 1) emits a Kα X-ray. A transition from the M-shell (n = 3) to the K-shell emits a higher-energy Kβ X-ray.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b10-phy-60',
    q: 'In a continuous-wave Helium-Neon (He-Ne) gas laser, what is the primary role of the helium atoms in achieving population inversion in the neon lasing atoms?',
    options: [
      'Helium atoms are excited by electron impact to long-lived metastable states (20.61 eV and 19.82 eV) and transfer this energy resonant-collisionally to closely matched neon excited states',
      'Helium directly emits the coherent red 632.8 nm laser photons',
      'Helium acts as a chemical catalyst that absorbs infrared radiation',
      'Helium cools the laser tube by rapid convection'
    ],
    correct: 0,
    topic: 'Lasers - Helium-Neon Laser Mechanism and Resonant Energy Transfer',
    chapter: 'Atomic Spectra',
    explain: 'In a He-Ne laser (10:1 ratio), electrical discharge excites He atoms into 2s states. Because their energy levels closely match Ne excited states (3s and 2s), resonant inelastic collisions transfer excitation energy with near 100% efficiency, creating the population inversion in neon needed for 632.8 nm stimulated emission.',
    difficulty: 'Medium',
    subject: 'Physics'
  }
];

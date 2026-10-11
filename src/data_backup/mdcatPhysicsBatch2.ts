import { Question } from '../types';

export const MDCAT_PHYSICS_BATCH2: Question[] = [
  // --- Force and Motion (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-1',
    q: 'A body is dropped from rest from the top of a tower. Neglecting air resistance and taking g = 9.8 m/s², what distance does it travel in the first 3 seconds of free fall?',
    options: ['44.1 meters', '29.4 meters', '88.2 meters', '14.7 meters'],
    correct: 0,
    topic: 'Force and Motion',
    explain: 'Using equation S = vit + (1/2)gt² with vi = 0: S = 0.5 × 9.8 × (3)² = 4.9 × 9 = 44.1 m.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-2',
    q: 'A projectile is launched with an initial velocity v₀ at an angle of 30° above the horizontal. At what other launch angle will the horizontal range R be identical, assuming equal initial speed?',
    options: ['60°', '45°', '75°', '15°'],
    correct: 0,
    topic: 'Force and Motion',
    explain: 'Horizontal range R = (v₀² sin 2θ) / g. Range is equal for complementary launch angles θ and (90° - θ). Since sin(2 × 30°) = sin(60°) and sin(2 × 60°) = sin(120°) = sin(60°), range at 60° equals range at 30°.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-3',
    q: 'In an elastic one-dimensional collision between two bodies of equal mass, where body 1 moves with velocity v and body 2 is initially at rest, what are their velocities after the collision?',
    options: ['Body 1 comes to rest (v₁\' = 0) and body 2 moves with velocity v₂\' = v', 'Both move together with velocity v/2', 'Body 1 rebounds with -v and body 2 remains at rest', 'Both move with equal velocity v/√2 in opposite directions'],
    correct: 0,
    topic: 'Force and Motion',
    explain: 'When two bodies of identical mass undergo a head-on elastic collision, they completely exchange their velocities: v₁\' = 0 and v₂\' = v.',
    difficulty: 'Hard',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-4',
    q: 'A spherical raindrop of radius r falls through air with dynamic viscosity η. According to Stokes\' Law (F = 6πηrv), what is the terminal velocity vt directly proportional to?',
    options: ['Square of the radius (vt ∝ r²)', 'Radius (vt ∝ r)', 'Inverse of the radius (vt ∝ 1/r)', 'Cube of the radius (vt ∝ r³)'],
    correct: 0,
    topic: 'Force and Motion',
    explain: 'At terminal velocity, drag force balances submerged weight: 6πηrvt = (4/3)πr³(ρ - σ)g. Solving for vt yields vt = [2r²g(ρ - σ)] / (9η), so vt ∝ r².',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Work, Energy and Power (5 MCQs: 2 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-5',
    q: 'How much work is done by the gravitational force on an artificial satellite of mass m orbiting Earth in a stable circular orbit of radius r for one complete revolution?',
    options: ['Zero joules', '2πrmg', 'mgr', 'mg / (2πr)'],
    correct: 0,
    topic: 'Work, Energy and Power',
    explain: 'Gravitational centripetal force is directed radially inward toward Earth\'s center, strictly perpendicular to the satellite\'s displacement vector at all points (θ = 90°). Work W = F·d·cos(90°) = 0 J.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-6',
    q: 'One kilowatt-hour (1 kWh) of commercial electrical energy is equivalent to how many Joules?',
    options: ['3.6 × 10⁶ J (3.6 MJ)', '3.6 × 10³ J', '1.0 × 10⁵ J', '7.46 × 10⁵ J'],
    correct: 0,
    topic: 'Work, Energy and Power',
    explain: '1 kWh = (1,000 W) × (3,600 s) = 3,600,000 J = 3.6 × 10⁶ J (3.6 megajoules).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-7',
    q: 'If the linear momentum p of an object is doubled, by what factor does its kinetic energy (K = p² / 2m) increase?',
    options: ['Four times', 'Two times', 'Eight times', 'Square root of 2 times'],
    correct: 0,
    topic: 'Work, Energy and Power',
    explain: 'Kinetic energy is given by K = p² / (2m). If momentum is doubled (p\' = 2p), then K\' = (2p)² / (2m) = 4 [p² / (2m)] = 4K.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-8',
    q: 'An electric water pump with an efficiency of 80% lifts 300 kg of water to a vertical height of 20 meters in 10 seconds (take g = 9.8 m/s²). What input electrical power is consumed by the pump motor?',
    options: ['7,350 W', '5,880 W', '4,704 W', '9,200 W'],
    correct: 0,
    topic: 'Work, Energy and Power',
    explain: 'Output work = mgh = 300 × 9.8 × 20 = 58,800 J. Useful output power = 58,800 J / 10 s = 5,880 W. Input power = Output power / efficiency = 5,880 W / 0.80 = 7,350 W.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-9',
    q: 'A spring with spring constant k is compressed by an initial distance x. What additional work must be performed to compress the spring further from x to 2x?',
    options: ['(3/2) kx²', '(1/2) kx²', '2 kx²', 'kx²'],
    correct: 0,
    topic: 'Work, Energy and Power',
    explain: 'Initial potential energy U₁ = (1/2)kx². Final potential energy at 2x is U₂ = (1/2)k(2x)² = (4/2)kx² = 2kx². Work required ΔU = U₂ - U₁ = 2kx² - 0.5kx² = 1.5kx² = (3/2)kx².',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Rotational and Circular Motion (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-10',
    q: 'A particle moves in a circle of radius r with constant speed v. The direction of its centripetal acceleration is always:',
    options: ['Directed radially inward toward the center of the circular path', 'Directed tangential to the path in the direction of motion', 'Directed radially outward away from the center', 'Perpendicular to the plane of rotation'],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    explain: 'Centripetal acceleration arises from continuous change in the direction of linear velocity and points radially inward toward the instantaneous center of curvature.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-11',
    q: 'What is the rotational kinetic energy of a solid cylinder of mass M and radius R (moment of inertia I = (1/2)MR²) rotating about its longitudinal axis with angular velocity ω?',
    options: ['(1/4) M R² ω²', '(1/2) M R² ω²', '(1/2) M R ω', 'M R² ω²'],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    explain: 'Rotational kinetic energy K_rot = (1/2)Iω². Substituting I = (1/2)MR² gives K_rot = (1/2)[(1/2)MR²]ω² = (1/4)MR²ω².',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-12',
    q: 'According to the Law of Conservation of Angular Momentum (L = Iω = constant), when a spinning figure skater pulls her outstretched arms inward, her:',
    options: ['Moment of inertia decreases and angular velocity increases', 'Moment of inertia increases and angular velocity decreases', 'Both moment of inertia and angular velocity increase', 'Angular momentum increases proportionally'],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    explain: 'Bringing mass closer to the rotational axis reduces moment of inertia I = Σmr². In the absence of external torque, L = Iω is conserved, so angular velocity ω must increase.',
    difficulty: 'Hard',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-13',
    q: 'What is the orbital speed v of a geostationary satellite orbiting Earth at a distance r from the center of Earth of mass M (G = gravitational constant)?',
    options: ['v = √(GM / r)', 'v = GM / r²', 'v = √(2GM / r)', 'v = √(GM r)'],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    explain: 'Centripetal force is provided by gravity: mv²/r = GMm/r². Solving for v yields orbital velocity v = √(GM / r).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Oscillations (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-14',
    q: 'The time period T of a simple pendulum executing simple harmonic motion (SHM) of length L in a gravitational field g is given by:',
    options: ['T = 2π √(L / g)', 'T = 2π √(g / L)', 'T = (1/2π) √(L / g)', 'T = 2π √(m / k)'],
    correct: 0,
    topic: 'Oscillations',
    explain: 'For small angular amplitudes, the restoring torque gives angular frequency ω = √(g / L). Hence the time period T = 2π / ω = 2π √(L / g), independent of bob mass.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-15',
    q: 'In simple harmonic motion of a mass-spring system, at the mean (equilibrium) position:',
    options: ['Velocity is maximum, acceleration is zero, and kinetic energy is maximum', 'Velocity is zero, acceleration is maximum, and potential energy is maximum', 'Both kinetic energy and potential energy are zero', 'Acceleration is maximum and velocity is maximum'],
    correct: 0,
    topic: 'Oscillations',
    explain: 'At x = 0 (mean position), displacement is zero so restoring force and acceleration a = -ω²x are zero. All energy is kinetic, and velocity v = ω√(A² - x²) = ωA is maximum.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-16',
    q: 'What is the total mechanical energy E of a simple harmonic oscillator of mass m, angular frequency ω, and amplitude A?',
    options: ['E = (1/2) m ω² A²', 'E = m ω² A', 'E = (1/2) m ω A²', 'E = (1/4) m ω² A²'],
    correct: 0,
    topic: 'Oscillations',
    explain: 'Total energy is constant throughout SHM and equals maximum kinetic energy: E = (1/2)m v_max² = (1/2)m(ωA)² = (1/2)mω²A².',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Waves (5 MCQs: 2 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-17',
    q: 'Which wave property remains strictly unchanged when a monochromatic light wave passes from air into a denser medium like water or glass?',
    options: ['Frequency', 'Wavelength', 'Speed', 'Amplitude'],
    correct: 0,
    topic: 'Waves',
    explain: 'Frequency is determined solely by the wave source (rate of oscillation). When entering a denser optical medium, speed v and wavelength λ decrease proportionally (v = fλ), leaving f constant.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-18',
    q: 'Two sound waves with slightly different frequencies of 256 Hz and 260 Hz interfere. How many beats per second will be heard by an observer?',
    options: ['4 beats per second', '2 beats per second', '516 beats per second', '8 beats per second'],
    correct: 0,
    topic: 'Waves',
    explain: 'The beat frequency f_beat equals the absolute difference between the frequencies of the two interfering waves: f_beat = |f₁ - f₂| = |260 - 256| = 4 Hz (4 beats/s).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-19',
    q: 'In a stationary (standing) wave formed on a stretched string fixed at both ends, the distance between two consecutive nodes is equal to:',
    options: ['λ / 2 (half wavelength)', 'λ (one full wavelength)', 'λ / 4 (quarter wavelength)', '2λ'],
    correct: 0,
    topic: 'Waves',
    explain: 'In standing waves, adjacent nodes are separated by λ/2, and adjacent antinodes are also separated by λ/2. The distance between a node and an adjacent antinode is λ/4.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-20',
    q: 'According to the Doppler effect, what happens to the apparent pitch (frequency) heard by a stationary observer when an ambulance sounding its siren approaches the observer at high speed?',
    options: ['Apparent frequency increases because sound waves are compressed in front of the source', 'Apparent frequency decreases because wave speed increases', 'Pitch remains unchanged but loudness increases', 'Apparent frequency drops to zero as the ambulance passes'],
    correct: 0,
    topic: 'Waves',
    explain: 'As the sound source moves toward the observer, wave crests are emitted closer together in space, shortening the observed wavelength (λ\' = λ - vs/f) and increasing apparent frequency f\' = f [v / (v - vs)].',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-21',
    q: 'In an organ pipe of length L closed at one end, the fundamental resonant frequency (first harmonic) is f₁ = v / (4L). What is the frequency of the second resonant overtone (third harmonic) permitted in this closed pipe?',
    options: ['3f₁ = 3v / (4L)', '2f₁ = 2v / (4L)', '4f₁ = v / L', '5f₁ = 5v / (4L)'],
    correct: 0,
    topic: 'Waves',
    explain: 'An organ pipe closed at one end supports only odd harmonics (n = 1, 3, 5, ...). The first overtone corresponds to the third harmonic: f₃ = 3 f₁ = 3v / (4L).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Thermodynamics (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-22',
    q: 'In a thermodynamic adiabatic process, what quantity remains strictly zero throughout the expansion or compression?',
    options: ['Heat transfer into or out of the system (Q = 0)', 'Change in internal energy (ΔU = 0)', 'Work done by the system (W = 0)', 'Change in temperature (ΔT = 0)'],
    correct: 0,
    topic: 'Thermodynamics',
    explain: 'An adiabatic process is thermally insulated from the surroundings so that no heat enters or leaves the system (Q = 0). By the First Law, ΔU = -W.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-23',
    q: 'What is the maximum theoretical efficiency (Carnot efficiency) of a heat engine operating between a hot reservoir at 600 K and a cold sink at 300 K?',
    options: ['50%', '33.3%', '66.7%', '75%'],
    correct: 0,
    topic: 'Thermodynamics',
    explain: 'Carnot efficiency η = 1 - (Tc / Th) = 1 - (300 K / 600 K) = 1 - 0.50 = 0.50 or 50%.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-24',
    q: 'For an ideal gas, the molar heat capacity at constant pressure (Cp) and at constant volume (Cv) are related by Mayer\'s relation as:',
    options: ['Cp - Cv = R', 'Cp + Cv = R', 'Cp / Cv = R', 'Cv - Cp = R'],
    correct: 0,
    topic: 'Thermodynamics',
    explain: 'Mayer\'s relation states that Cp - Cv = R, reflecting the additional work PΔV = RΔT done by an expanding gas when heated at constant pressure compared to constant volume.',
    difficulty: 'Hard',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-25',
    q: 'According to the Second Law of Thermodynamics (Clausius statement), natural spontaneous heat flow can never occur without external work from:',
    options: ['A body at lower temperature to a body at higher temperature', 'A body at higher temperature to a body at lower temperature', 'An isolated system to an open system', 'A compressed gas to a vacuum'],
    correct: 0,
    topic: 'Thermodynamics',
    explain: 'Clausius formulation of the second law states that it is impossible to construct a cyclic machine whose sole result is the transfer of heat from a cooler body to a hotter body without external work input.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electrostatics (5 MCQs: 2 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-26',
    q: 'According to Coulomb\'s Law, if the distance between two point charges is tripled while their charges remain unchanged, the electrostatic force between them becomes:',
    options: ['1/9 of the original force', '1/3 of the original force', '3 times the original force', '9 times the original force'],
    correct: 0,
    topic: 'Electrostatics',
    explain: 'Coulomb\'s Law states F ∝ 1/r². If distance r is tripled (r\' = 3r), force F\' = F / (3)² = F / 9.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-27',
    q: 'What is the electric field intensity E inside the hollow cavity of an isolated charged spherical conducting shell of radius R?',
    options: ['Zero everywhere inside the shell', 'q / (4πε₀R²)', 'q / (4πε₀r)', 'Infinite at the center'],
    correct: 0,
    topic: 'Electrostatics',
    explain: 'By Gauss\'s Law, a Gaussian surface drawn inside the cavity encloses zero net charge (q_enc = 0). Therefore, the electric field is strictly zero everywhere inside the conductor.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-28',
    q: 'When a dielectric slab of dielectric constant εr is inserted between the plates of an isolated charged parallel-plate capacitor, how are its capacitance C and electric field E affected?',
    options: ['Capacitance increases by factor εr and electric field decreases by factor εr', 'Capacitance decreases and electric field increases', 'Both capacitance and electric field remain unchanged', 'Capacitance increases and potential difference increases'],
    correct: 0,
    topic: 'Electrostatics',
    explain: 'Bound surface polarization charges in the dielectric create an opposing internal electric field, reducing E = E₀/εr and potential difference V = V₀/εr. Since Q is constant, C = Q/V = εr·C₀ increases.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-29',
    q: 'What is the electric potential V at a distance r from an isolated point charge q in a vacuum?',
    options: ['V = q / (4πε₀r)', 'V = q / (4πε₀r²)', 'V = q² / (4πε₀r)', 'V = 4πε₀qr'],
    correct: 0,
    topic: 'Electrostatics',
    explain: 'Electric potential is the work done per unit positive charge bringing it from infinity to r: V = ∫ -E·dr = q / (4πε₀r).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-30',
    q: 'How much electrostatic energy is stored in a 10 μF capacitor charged to a potential difference of 200 V?',
    options: ['0.2 Joules', '2.0 Joules', '0.02 Joules', '20 Joules'],
    correct: 0,
    topic: 'Electrostatics',
    explain: 'Stored electrostatic energy U = (1/2)CV² = 0.5 × (10 × 10⁻⁶ F) × (200 V)² = 5 × 10⁻⁶ × 40,000 = 0.20 J.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Current Electricity (5 MCQs: 2 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-31',
    q: 'According to Ohm\'s Law, for an ohmic metallic conductor at constant temperature, the current I flowing through the conductor is:',
    options: ['Directly proportional to the potential difference V across its ends', 'Inversely proportional to the potential difference V', 'Directly proportional to the square of the potential difference', 'Independent of the applied voltage'],
    correct: 0,
    topic: 'Current Electricity',
    explain: 'Ohm\'s Law states that current is directly proportional to voltage (V = IR) as long as physical conditions such as temperature remain unchanged.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-32',
    q: 'Kirchhoff\'s First Rule (Current/Junction Rule, ΣI = 0) is a direct consequence of the conservation of:',
    options: ['Electrical charge', 'Mechanical energy', 'Linear momentum', 'Electromotive force'],
    correct: 0,
    topic: 'Current Electricity',
    explain: 'At any electrical circuit junction, charge cannot accumulate or disappear; the sum of currents entering must equal the sum of currents leaving (conservation of charge).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-33',
    q: 'A uniform copper wire of resistance R is uniformly stretched so that its length doubles (L\' = 2L) while keeping its total volume constant. What is the new electrical resistance R\' of the stretched wire?',
    options: ['4R', '2R', 'R / 2', 'R / 4'],
    correct: 0,
    topic: 'Current Electricity',
    explain: 'Volume V = A·L is constant. When length doubles (L\' = 2L), cross-sectional area halves (A\' = A/2). Since R = ρL/A, new resistance R\' = ρ(2L)/(A/2) = 4(ρL/A) = 4R.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-34',
    q: 'In a balanced Wheatstone bridge consisting of four resistors P, Q, R, and S, what condition holds true when no current flows through the central galvanometer?',
    options: ['P / Q = R / S', 'P · Q = R · S', 'P + Q = R + S', 'P - R = Q - S'],
    correct: 0,
    topic: 'Current Electricity',
    explain: 'When potentials at the bridge nodes are equal (null deflection in galvanometer), ratio of resistance branches satisfies P/Q = R/S.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-35',
    q: 'A cell of electromotive force E = 12 V and internal resistance r = 1.0 Ω is connected across an external load resistor R. For maximum power transfer from the cell to the load, what must be the value of R, and what is the maximum power delivered?',
    options: ['R = 1.0 Ω and P_max = 36 W', 'R = 2.0 Ω and P_max = 72 W', 'R = 0.5 Ω and P_max = 144 W', 'R = 1.0 Ω and P_max = 18 W'],
    correct: 0,
    topic: 'Current Electricity',
    explain: 'By the Maximum Power Transfer Theorem, load resistance must match internal resistance: R = r = 1.0 Ω. P_max = E² / (4r) = 12² / (4 × 1) = 144 / 4 = 36 W.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electromagnetism (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-36',
    q: 'What is the magnetic force F experienced by a charged particle q moving with velocity v parallel to a uniform magnetic field B (angle θ = 0°)?',
    options: ['Zero', 'q v B', 'q v B / 2', 'q B / v'],
    correct: 0,
    topic: 'Electromagnetism',
    explain: 'Lorentz magnetic force is F = q(v × B) = q v B sin(θ). For motion parallel to magnetic field lines, θ = 0° and sin(0°) = 0, so no magnetic deflection force acts on the charge.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-37',
    q: 'According to Ampere\'s Circuital Law, the magnetic field B inside a tightly wound long solenoid of n turns per unit length carrying current I is given by:',
    options: ['B = μ₀ n I', 'B = μ₀ I / (2πr)', 'B = μ₀ n I / 2', 'B = 2μ₀ n I'],
    correct: 0,
    topic: 'Electromagnetism',
    explain: 'Evaluating line integral ∮ B·dl around an Amperian loop inside an ideal long solenoid yields uniform axial magnetic field B = μ₀ n I.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-38',
    q: 'A charged particle of mass m and charge q enters a uniform perpendicular magnetic field B with speed v. What is the orbital frequency (cyclotron frequency f) of the resulting circular trajectory?',
    options: ['f = q B / (2πm)', 'f = 2πm / (q B)', 'f = q B v / m', 'f = q m / (2πB)'],
    correct: 0,
    topic: 'Electromagnetism',
    explain: 'Centripetal force is provided by magnetic force: m v² / r = q v B, giving radius r = mv / (qB). Orbital frequency f = v / (2πr) = v / [2π(mv/qB)] = qB / (2πm), independent of velocity.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electromagnetic Induction (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-39',
    q: 'According to Faraday\'s Law of Electromagnetic Induction, the magnitude of the induced electromotive force (emf) in a circuit is directly proportional to:',
    options: ['The time rate of change of magnetic flux linked with the circuit', 'The total magnetic flux linkage at any static moment', 'The electrical resistance of the wire coil', 'The physical mass of the magnet being moved'],
    correct: 0,
    topic: 'Electromagnetic Induction',
    explain: 'Faraday\'s law states that induced emf ε = -N (dΦB / dt), where dΦB/dt is the time rate of change of magnetic flux through the circuit.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-40',
    q: 'Lenz\'s Law, which states that an induced current flows in such a direction as to oppose the change in magnetic flux that causes it, is a direct manifestation of:',
    options: ['Law of Conservation of Energy', 'Law of Conservation of Electric Charge', 'Newton\'s First Law of Motion', 'Law of Conservation of Angular Momentum'],
    correct: 0,
    topic: 'Electromagnetic Induction',
    explain: 'Lenz\'s law ensures conservation of energy; mechanical work performed in moving a magnet against opposing induced magnetic fields equals the electrical energy produced in the circuit.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-41',
    q: 'What is the self-inductance L of an air-core solenoid of length l, cross-sectional area A, and total number of turns N?',
    options: ['L = (μ₀ N² A) / l', 'L = (μ₀ N A) / l', 'L = (μ₀ N² l) / A', 'L = μ₀ N A l'],
    correct: 0,
    topic: 'Electromagnetic Induction',
    explain: 'Flux linkage NΦ = N(B·A) = N[(μ₀ N I / l) A] = (μ₀ N² A / l) I. Since NΦ = L I, self-inductance L = (μ₀ N² A) / l.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Alternating Current (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-42',
    q: 'What is the root-mean-square (rms) voltage of a sinusoidal alternating current supply whose peak voltage is V₀ = 311 V?',
    options: ['~220 V', '~155 V', '~311 V', '~440 V'],
    correct: 0,
    topic: 'Alternating Current',
    explain: 'For a sinusoidal waveform, V_rms = V₀ / √2 ≈ 0.707 × V₀. For V₀ = 311 V, V_rms = 311 / 1.414 ≈ 220 V.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-43',
    q: 'In a purely capacitive AC circuit connected to an alternating voltage supply, what is the phase relationship between the current I and the applied voltage V?',
    options: ['Current leads voltage by a phase angle of 90° (π/2 radians)', 'Voltage leads current by 90°', 'Current and voltage are completely in phase (0° phase angle)', 'Current lags voltage by 180°'],
    correct: 0,
    topic: 'Alternating Current',
    explain: 'In a pure capacitor, current must flow to deposit charge before potential builds up across the plates: I = C(dV/dt), so alternating current leads voltage by 90° (ELI the ICE man: ICE).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-44',
    q: 'In a series RLC AC circuit at resonance, the inductive reactance XL and capacitive reactance XC cancel out (XL = XC). Under this condition, the circuit impedance Z equals:',
    options: ['Z = R (purely resistive and at its minimum value)', 'Z = 0 (zero impedance)', 'Z = √(R² + (XL + XC)²)', 'Z = infinite (maximum impedance)'],
    correct: 0,
    topic: 'Alternating Current',
    explain: 'Total impedance Z = √[R² + (XL - XC)²]. At resonant frequency fr = 1/(2π√LC), XL = XC, so Z reduces to Z = R, which is minimum and gives maximum current.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Physics of Solids (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-45',
    q: 'According to Hooke\'s Law, within the elastic limit of a material, tensile stress is:',
    options: ['Directly proportional to tensile strain', 'Inversely proportional to strain', 'Proportional to the square of strain', 'Independent of strain'],
    correct: 0,
    topic: 'Physics of Solids',
    explain: 'Hooke\'s Law states that for small deformations within the proportional limit, Stress ∝ Strain (Stress / Strain = Modulus of Elasticity).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-46',
    q: 'According to the energy band theory of solids, what characterizes an electrical insulator (such as diamond)?',
    options: ['A completely filled valence band, an empty conduction band, and a wide forbidden energy gap (Eg > 3-5 eV)', 'Overlapping valence and conduction bands', 'A half-filled conduction band at absolute zero', 'A narrow band gap of less than 0.7 eV'],
    correct: 0,
    topic: 'Physics of Solids',
    explain: 'Insulators have a large energy band gap (> 3 eV) between full valence and empty conduction bands; thermal energy at room temperature cannot excite electrons across this wide gap.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-47',
    q: 'Superconductors are materials that exhibit zero electrical resistance below a critical temperature Tc. What is the Meissner effect observed in superconductors?',
    options: ['Complete expulsion of interior magnetic flux lines (perfect diamagnetism) below Tc', 'Absorption of magnetic field lines creating strong ferromagnetism', 'Emission of high-energy photons when placed in electric fields', 'Spontaneous polarization of internal electric dipoles'],
    correct: 0,
    topic: 'Physics of Solids',
    explain: 'The Meissner effect is the complete exclusion of magnetic flux lines (B = 0 inside) when a material transitions into the superconducting state below Tc, demonstrating ideal diamagnetism (χ = -1).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electronics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-48',
    q: 'A p-type extrinsic semiconductor is formed by doping pure intrinsic silicon or germanium with minute traces of which type of impurity element?',
    options: ['Trivalent impurity atoms (e.g., Boron, Aluminum, Gallium)', 'Pentavalent impurity atoms (e.g., Phosphorus, Arsenic)', 'Tetravalent carbon atoms', 'Monovalent alkali metal atoms'],
    correct: 0,
    topic: 'Electronics',
    explain: 'Doping with trivalent elements (Group 13) introduces 3 valence electrons, leaving one covalent bond deficient of an electron, which creates a positive mobile hole (p-type).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-49',
    q: 'Under forward bias of a semiconductor p-n junction diode:',
    options: ['The external potential opposes the built-in potential barrier, narrowing the depletion region and allowing substantial current flow', 'The depletion width widens dramatically, blocking all current', 'Majority charge carriers are pulled away from the junction', 'The diode acts as an open switch with infinite impedance'],
    correct: 0,
    topic: 'Electronics',
    explain: 'Connecting p-side to positive and n-side to negative terminal opposes the internal barrier potential, reducing depletion layer width and permitting majority carriers to cross easily.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-50',
    q: 'In an operational amplifier (op-amp) connected as an inverting amplifier with input resistor R₁ and feedback resistor Rf, what is the closed-loop voltage gain Av?',
    options: ['Av = -Rf / R₁', 'Av = 1 + (Rf / R₁)', 'Av = Rf / R₁', 'Av = -R₁ / Rf'],
    correct: 0,
    topic: 'Electronics',
    explain: 'Using the virtual ground concept at the inverting terminal: I_in = (Vin - 0)/R₁ and I_f = (0 - Vout)/Rf. Equating I_in = I_f gives Vout / Vin = -Rf / R₁.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Dawn of Modern Physics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-51',
    q: 'In the photoelectric effect, the threshold frequency (f₀) is defined as:',
    options: ['The minimum frequency of incident light required to eject photoelectrons from a metal surface with zero kinetic energy', 'The frequency at which maximum photoelectric current flows', 'The frequency of emitted photoelectrons', 'The frequency corresponding to the work function plus kinetic energy of 10 eV'],
    correct: 0,
    topic: 'Dawn of Modern Physics',
    explain: 'Threshold frequency f₀ provides photon energy hf₀ equal to the work function Φ of the metal; photons with f < f₀ cannot eject electrons regardless of light intensity.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-52',
    q: 'According to the de Broglie hypothesis, what is the matter wavelength λ associated with a particle of mass m moving with velocity v?',
    options: ['λ = h / (m v)', 'λ = m v / h', 'λ = h m / v', 'λ = h / (m v²)'],
    correct: 0,
    topic: 'Dawn of Modern Physics',
    explain: 'De Broglie proposed wave-particle duality where any moving particle exhibits wave properties with wavelength λ = h / p = h / (mv).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-53',
    q: 'In Compton scattering, an X-ray photon of wavelength λ collides with a stationary free electron and scatters at an angle θ. The Compton shift in wavelength Δλ is given by:',
    options: ['Δλ = (h / m_e c) (1 - cos θ)', 'Δλ = (h / m_e c) (1 + cos θ)', 'Δλ = (m_e c / h) (1 - cos θ)', 'Δλ = (h / 2m_e c) sin θ'],
    correct: 0,
    topic: 'Dawn of Modern Physics',
    explain: 'Applying relativistic conservation of energy and momentum yields Compton shift Δλ = λ\' - λ = (h / m_e c)(1 - cos θ), where h/(m_e c) ≈ 0.00243 nm is the Compton wavelength.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Atomic Spectra (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-54',
    q: 'According to Niels Bohr\'s quantum postulate for the hydrogen atom, an electron can only revolve in stable orbits where its orbital angular momentum L is an integral multiple of:',
    options: ['h / (2π)', 'h / π', '2π / h', 'h² / (2π)'],
    correct: 0,
    topic: 'Atomic Spectra',
    explain: 'Bohr\'s quantization condition states that angular momentum is quantized: L = mvr = n(h / 2π) = nħ, where n = 1, 2, 3... is the principal quantum number.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-55',
    q: 'What is the ground state ionization energy required to completely remove an electron from the n = 1 ground state of a neutral hydrogen atom?',
    options: ['13.6 eV', '3.4 eV', '1.51 eV', '10.2 eV'],
    correct: 0,
    topic: 'Atomic Spectra',
    explain: 'Energy of hydrogen level is En = -13.6 eV / n². For n = 1, E₁ = -13.6 eV. Ionization energy ΔE = E_∞ - E₁ = 0 - (-13.6 eV) = +13.6 eV.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-56',
    q: 'In laser physics, what condition is fundamentally required to produce stimulated emission amplification of coherent light over spontaneous emission?',
    options: ['Population inversion (more atoms in a metastable excited state than in the ground state)', 'High thermal temperature causing chaotic collisions', 'Spontaneous radioactive decay of the gain medium', 'Ground state saturation with zero excited atoms'],
    correct: 0,
    topic: 'Atomic Spectra',
    explain: 'Light amplification by stimulated emission requires population inversion (N₂ > N₁), achieved by optical or electrical pumping into a long-lived metastable state.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Nuclear Physics (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b2-phys-57',
    q: 'What are the three types of natural radioactive decay emissions, arranged in order of increasing penetrating power through matter?',
    options: ['Alpha particles (least) < Beta particles < Gamma rays (most penetrating)', 'Gamma rays < Beta particles < Alpha particles', 'Beta particles < Alpha particles < Gamma rays', 'Alpha particles < Gamma rays < Beta particles'],
    correct: 0,
    topic: 'Nuclear Physics',
    explain: 'Alpha particles (He²⁺) are heavy and stopped by paper; beta particles (electrons) penetrate skin and are stopped by aluminum; uncharged gamma photons penetrate centimeters of lead.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-58',
    q: 'A radioactive isotope has a half-life of 8 days. If an initial sample has an activity of 64 mCi, what will be its remaining radioactivity after 24 days?',
    options: ['8 mCi', '16 mCi', '4 mCi', '32 mCi'],
    correct: 0,
    topic: 'Nuclear Physics',
    explain: 'Number of elapsed half-lives n = total time / half-life = 24 days / 8 days = 3 half-lives. Remaining activity = 64 / 2³ = 64 / 8 = 8 mCi.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-59',
    q: 'In the nuclear fission of uranium-235 triggered by a thermal neutron (²³⁵U + ¹n -> ¹⁴¹Ba + ⁹²Kr + 3¹n + energy), what is the primary source of the enormous energy released (~200 MeV)?',
    options: ['Conversion of nuclear mass defect (Δm) into energy according to Einstein\'s equation E = Δm·c²', 'Combustion of atomic valence electrons', 'Decay of cosmic neutrino pairs', 'Gravitational collapse of nucleons'],
    correct: 0,
    topic: 'Nuclear Physics',
    explain: 'Total rest mass of fission fragments is less than initial mass of ²³⁵U and neutron. This mass defect Δm converts into kinetic energy of fragments and radiation via E = Δmc².',
    difficulty: 'Hard',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b2-phys-60',
    q: 'Why does the binding energy per nucleon (BE/A) curve peak around iron-56 (⁵⁶Fe, ~8.8 MeV/nucleon) and then gradually decline for heavier nuclei?',
    options: ['The short-range strong nuclear attractive force saturates, while long-range electrostatic Coulomb repulsion among protons grows with Z²', 'Neutrons stop interacting via the strong force above Z = 26', 'Gravitational repulsion overcomes nuclear attraction', 'Heavy nuclei lack gluons inside their quarks'],
    correct: 0,
    topic: 'Nuclear Physics',
    explain: 'The strong nuclear force acts only between nearest-neighbor nucleons (saturation), whereas Coulomb repulsion between protons acts across the entire nucleus and scales with Z², destabilizing heavier nuclei.',
    difficulty: 'Hard',
    subject: 'Physics'
  }
];

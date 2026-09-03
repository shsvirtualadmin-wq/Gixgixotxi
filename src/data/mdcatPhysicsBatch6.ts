import { Question } from '../types';

export const MDCAT_PHYSICS_BATCH6: Question[] = [
  // --- Measurements (4 MCQs: 1 to 4) ---
  {
    id: 'mdcat-b6-phy-1',
    q: 'What are the base SI units of Planck\'s constant (h = 6.626 × 10^-34 J·s)?',
    options: ['kg · m^2 · s^-1', 'kg · m · s^-2', 'kg · m^2 · s^-2', 'kg · m^3 · s^-1'],
    correct: 0,
    topic: 'Dimensions and SI Units',
    chapter: 'Measurements',
    explain: 'Energy E = h · f => h = E / f. Energy has units Joules = N · m = (kg · m · s^-2) · m = kg · m^2 · s^-2. Frequency f has units s^-1. Therefore, h = (kg · m^2 · s^-2) / s^-1 = kg · m^2 · s^-1.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-2',
    q: 'The diameter of a metal cylinder measured using a screw gauge is (2.50 ± 0.02) cm. What is the percentage uncertainty in this measurement?',
    options: ['0.8%', '0.08%', '1.6%', '0.4%'],
    correct: 0,
    topic: 'Uncertainties in Measurement',
    chapter: 'Measurements',
    explain: 'Percentage uncertainty = (Absolute uncertainty / Measured value) × 100% = (0.02 / 2.50) × 100% = 0.8%.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-3',
    q: 'Which of the following physical quantities has the dimensional formula [M^1 L^-1 T^-2]?',
    options: ['Pressure (and Young\'s modulus)', 'Surface tension', 'Force', 'Angular momentum'],
    correct: 0,
    topic: 'Dimensional Analysis',
    chapter: 'Measurements',
    explain: 'Pressure = Force / Area = [M L T^-2] / [L^2] = [M L^-1 T^-2]. Young\'s modulus (stress/strain) also shares the exact same dimensional formula since strain is dimensionless.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-4',
    q: 'If the percentage uncertainty in the measurement of mass of a sphere is 2% and in its radius is 1%, what is the total percentage uncertainty in its calculated density (ρ = m / V)?',
    options: ['5%', '3%', '4%', '1%'],
    correct: 0,
    topic: 'Propagation of Errors',
    chapter: 'Measurements',
    explain: 'Volume of a sphere V = (4/3)πr^3. Percentage uncertainty in V = 3 × (% uncertainty in r) = 3 × 1% = 3%. Total percentage uncertainty in density ρ = (% in m) + (% in V) = 2% + 3% = 5%.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Scalars and Vectors (4 MCQs: 5 to 8) ---
  {
    id: 'mdcat-b6-phy-5',
    q: 'Two vectors A and B of equal magnitude |A| = |B| = F act at an angle of 120° to each other. What is the magnitude of their resultant vector R?',
    options: ['F', '2F', '√3 F', 'F / 2'],
    correct: 0,
    topic: 'Vector Addition',
    chapter: 'Scalars and Vectors',
    explain: 'R = √(A^2 + B^2 + 2AB cos θ) = √(F^2 + F^2 + 2F^2 cos 120°). Since cos 120° = -0.5, R = √(2F^2 - F^2) = √(F^2) = F.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-6',
    q: 'If the scalar (dot) product and vector (cross) product of two vectors A and B have equal magnitudes (|A · B| = |A × B|), what is the angle θ between them?',
    options: ['45°', '90°', '60°', '30°'],
    correct: 0,
    topic: 'Vector Products',
    chapter: 'Scalars and Vectors',
    explain: '|A · B| = AB cos θ and |A × B| = AB sin θ. Equating both: AB cos θ = AB sin θ => tan θ = 1 => θ = 45° (or π/4 rad).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-7',
    q: 'A force vector F = (3i + 4j - 2k) N produces a displacement d = (2i - 3j + 5k) m. What is the work done by the force?',
    options: ['-16 Joules', '+16 Joules', '-6 Joules', '+28 Joules'],
    correct: 0,
    topic: 'Dot Product Applications',
    chapter: 'Scalars and Vectors',
    explain: 'Work W = F · d = (3)(2) + (4)(-3) + (-2)(5) = 6 - 12 - 10 = -16 Joules.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-8',
    q: 'For a rigid body rotating about an axis, torque τ is defined as the cross product τ = r × F. If position vector r lies along the positive x-axis and force F is directed along the positive y-axis, along which axis does torque point?',
    options: ['Positive z-axis (+k)', 'Negative z-axis (-k)', 'Positive x-axis (+i)', 'Negative y-axis (-j)'],
    correct: 0,
    topic: 'Torque and Cross Product',
    chapter: 'Scalars and Vectors',
    explain: 'Using the right-hand rule for cross products: i × j = k. Thus, the torque vector points along the positive z-axis.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Force and Motion (4 MCQs: 9 to 12) ---
  {
    id: 'mdcat-b6-phy-9',
    q: 'A projectile is launched from ground level with initial speed v0 at an elevation angle θ to the horizontal. Neglecting air resistance, what launch angle maximizes the horizontal range R?',
    options: ['45°', '30°', '60°', '90°'],
    correct: 0,
    topic: 'Projectile Motion',
    chapter: 'Force and Motion',
    explain: 'Horizontal range R = (v0^2 sin 2θ) / g. R is maximized when sin 2θ is maximum (= 1). Thus, 2θ = 90° => θ = 45°.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-10',
    q: 'A body of mass 5 kg initially at rest is acted upon by a constant force of 20 N for a duration of 3 seconds. What is the impulse delivered to the body and its final momentum?',
    options: ['60 N·s and 60 kg·m/s', '30 N·s and 30 kg·m/s', '100 N·s and 20 kg·m/s', '15 N·s and 15 kg·m/s'],
    correct: 0,
    topic: 'Impulse and Momentum',
    chapter: 'Force and Motion',
    explain: 'Impulse J = F · Δt = 20 N × 3 s = 60 N·s. By the impulse-momentum theorem, J = Δp = p_final - 0 = 60 kg·m/s.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-11',
    q: 'In an elastic one-dimensional collision between a moving ball of mass m with velocity v and an identical stationary ball of equal mass m, what happens after the collision?',
    options: [
      'The incident ball comes completely to rest and the target ball moves forward with velocity v',
      'Both balls move forward together with velocity v / 2',
      'The incident ball rebounds with velocity -v',
      'Both balls stop immediately'
    ],
    correct: 0,
    topic: 'Elastic Collisions',
    chapter: 'Force and Motion',
    explain: 'In an elastic head-on collision between two equal masses (m1 = m2), the bodies completely exchange their velocities: v1\' = 0 and v2\' = v.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-12',
    q: 'When a parachutist reaches terminal velocity while falling vertically through the atmosphere, the acceleration of the parachutist is:',
    options: [
      'Zero, because upward drag force equals downward gravitational force',
      '9.8 m/s^2 downward',
      'Linearly increasing with velocity squared',
      '9.8 m/s^2 upward'
    ],
    correct: 0,
    topic: 'Terminal Velocity and Drag Force',
    chapter: 'Force and Motion',
    explain: 'Terminal velocity is reached when the upward aerodynamic drag force equals the downward weight (mg). Net force becomes zero (ΣF = 0), so acceleration a = 0.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Work, Energy and Power (4 MCQs: 13 to 16) ---
  {
    id: 'mdcat-b6-phy-13',
    q: 'If the linear momentum of a moving object is increased by 100% (doubled), by what percentage does its kinetic energy increase?',
    options: ['300% increase (becomes 4 times original)', '100% increase', '200% increase', '400% increase'],
    correct: 0,
    topic: 'Kinetic Energy and Momentum',
    chapter: 'Work, Energy and Power',
    explain: 'Kinetic energy KE = p^2 / (2m). If momentum doubles (p\' = 2p), KE\' = (2p)^2 / (2m) = 4 [p^2 / (2m)] = 4 KE. The increase is (4KE - KE) / KE × 100% = 300%.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-14',
    q: 'An electric motor lifts an elevator of total mass 1000 kg vertically at a constant speed of 2.0 m/s. Assuming g = 9.8 m/s^2, what is the power output developed by the motor?',
    options: ['19.6 kW', '9.8 kW', '39.2 kW', '4.9 kW'],
    correct: 0,
    topic: 'Power Calculations',
    chapter: 'Work, Energy and Power',
    explain: 'Tension T = mg = 1000 kg × 9.8 m/s^2 = 9800 N. Power P = F · v = 9800 N × 2.0 m/s = 19,600 W = 19.6 kW.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-15',
    q: 'A force is classified as a \'conservative force\' if and only if:',
    options: [
      'The work done by the force on an object moving between two points is independent of the path taken and depends only on initial and final positions',
      'The force always acts in the direction of velocity',
      'The force generates thermal dissipation in mechanical bearings',
      'The total mechanical energy of the system decreases with time'
    ],
    correct: 0,
    topic: 'Conservative Forces',
    chapter: 'Work, Energy and Power',
    explain: 'A force is conservative if the work done in moving a particle between two points is path-independent, meaning the work done around any closed loop is zero (∮ F · dr = 0).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-16',
    q: 'An ideal spring with spring constant k = 200 N/m is compressed by 0.10 m from its relaxed equilibrium position. What is the elastic potential energy stored in the spring?',
    options: ['1.0 Joule', '2.0 Joules', '0.5 Joules', '10 Joules'],
    correct: 0,
    topic: 'Elastic Potential Energy',
    chapter: 'Work, Energy and Power',
    explain: 'Elastic potential energy U = (1/2)kx^2 = 0.5 × 200 N/m × (0.10 m)^2 = 100 × 0.01 = 1.0 Joule.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Rotational and Circular Motion (4 MCQs: 17 to 20) ---
  {
    id: 'mdcat-b6-phy-17',
    q: 'A car of mass m negotiates a flat horizontal circular curve of radius r at constant speed v. What provides the necessary centripetal force preventing the car from skidding outwards?',
    options: ['Static friction between the car tires and the road surface', 'Kinetic friction between tires and road', 'The normal reaction force of the road acting vertically', 'Gravitational force acting along the horizontal radius'],
    correct: 0,
    topic: 'Centripetal Force',
    chapter: 'Rotational and Circular Motion',
    explain: 'On an unbanked flat road, the lateral static friction force (fs ≤ μs · N) directed toward the center of curvature provides the centripetal force: fs = m · v^2 / r.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-18',
    q: 'What is the rotational kinetic energy of a solid flywheel with moment of inertia I = 4.0 kg·m^2 spinning at an angular velocity of ω = 10 rad/s?',
    options: ['200 Joules', '40 Joules', '400 Joules', '800 Joules'],
    correct: 0,
    topic: 'Rotational Kinetic Energy',
    chapter: 'Rotational and Circular Motion',
    explain: 'Rotational kinetic energy KE_rot = (1/2) I ω^2 = 0.5 × 4.0 kg·m^2 × (10 rad/s)^2 = 2.0 × 100 = 200 Joules.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-19',
    q: 'A geostationary satellite orbiting Earth has an orbital period of exactly 24 hours (synchronous with Earth\'s rotation). At approximately what altitude above Earth\'s equator does it orbit?',
    options: ['~36,000 km', '~400 km', '~10,000 km', '~120,000 km'],
    correct: 0,
    topic: 'Geostationary Orbits',
    chapter: 'Rotational and Circular Motion',
    explain: 'A geostationary satellite orbits at an altitude of approximately 35,786 km (~36,000 km) above Earth\'s equator, with an orbital radius of ~42,200 km from Earth\'s center.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-20',
    q: 'When an ice skater pulls her outstretched arms inward during a spin on frictionless ice, her spin rate (angular velocity ω) increases because:',
    options: [
      'Her moment of inertia I decreases while angular momentum L = Iω is strictly conserved',
      'An external torque is exerted on her shoulders by centrifugal force',
      'Her rotational kinetic energy is converted into gravitational potential energy',
      'The frictional force between her skate and the ice increases'
    ],
    correct: 0,
    topic: 'Conservation of Angular Momentum',
    chapter: 'Rotational and Circular Motion',
    explain: 'With zero net external torque (τ = 0), angular momentum L = I · ω is conserved. Bringing arms inward reduces mass distribution radius, decreasing I and proportionally increasing angular speed ω.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Fluid Dynamics (4 MCQs: 21 to 24) ---
  {
    id: 'mdcat-b6-phy-21',
    q: 'According to Bernoulli\'s equation (P + 1/2 ρv^2 + ρgh = constant), in horizontal streamline flow of an incompressible non-viscous fluid, where the fluid velocity increases, the fluid pressure:',
    options: ['Decreases', 'Increases', 'Remains unchanged', 'Drops instantly to zero'],
    correct: 0,
    topic: 'Bernoulli\'s Theorem',
    chapter: 'Fluid Dynamics',
    explain: 'Along a horizontal streamline (h is constant), P + (1/2)ρv^2 = constant. Thus, an increase in fluid speed (v) must be accompanied by a simultaneous decrease in static pressure (P).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-22',
    q: 'According to Stokes\' Law, the viscous drag force F acting on a small sphere of radius r moving at terminal velocity v through a fluid of dynamic viscosity η is given by:',
    options: ['F = 6πηrv', 'F = (4/3)πηr^2v', 'F = 2πηrv^2', 'F = ηv / r'],
    correct: 0,
    topic: 'Stokes\' Law',
    chapter: 'Fluid Dynamics',
    explain: 'Sir George Stokes formulated that for laminar flow at low Reynolds numbers, the viscous retarding force on a spherical particle is F = 6πηrv.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-23',
    q: 'In fluid flow through a pipe of varying cross-section, the equation of continuity (A1 v1 = A2 v2) is a direct consequence of which fundamental physical law?',
    options: ['Conservation of mass', 'Conservation of energy', 'Conservation of momentum', 'First law of thermodynamics'],
    correct: 0,
    topic: 'Equation of Continuity',
    chapter: 'Fluid Dynamics',
    explain: 'For an incompressible fluid, the mass entering per unit time must equal the mass exiting per unit time (mass flow rate = ρAv = constant). This expresses conservation of mass.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-24',
    q: 'Torricelli\'s theorem states that the speed of efflux v of a liquid flowing out of an orifice situated at a depth h below the open surface of an open tank is given by:',
    options: ['v = √(2gh)', 'v = 2gh', 'v = √(gh)', 'v = gh / 2'],
    correct: 0,
    topic: 'Torricelli\'s Theorem',
    chapter: 'Fluid Dynamics',
    explain: 'Applying Bernoulli\'s theorem between the surface and orifice gives v = √(2gh), which equals the speed an object would acquire falling freely from rest through height h.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Oscillations (4 MCQs: 25 to 28) ---
  {
    id: 'mdcat-b6-phy-25',
    q: 'The period of oscillation of a simple pendulum of length L is T = 2π√(L/g). If the length of the pendulum is quadrupled (multiplied by 4), its new period becomes:',
    options: ['Double the original period (2T)', 'Four times the original period (4T)', 'Half the original period (T/2)', 'Unchanged'],
    correct: 0,
    topic: 'Simple Harmonic Motion',
    chapter: 'Oscillations',
    explain: 'T ∝ √L. If L becomes 4L, T\' = 2π√(4L/g) = 2 · (2π√(L/g)) = 2T. The period doubles.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-26',
    q: 'In simple harmonic motion (SHM) of a mass-spring system, when the oscillating mass passes through its central equilibrium position (x = 0):',
    options: [
      'Velocity is maximum and acceleration is zero',
      'Acceleration is maximum and velocity is zero',
      'Both velocity and acceleration are zero',
      'Both velocity and acceleration are at their maximum values'
    ],
    correct: 0,
    topic: 'Kinematics of SHM',
    chapter: 'Oscillations',
    explain: 'In SHM, acceleration a = -ω^2 x. At equilibrium x = 0, so a = 0. Velocity v = ±ω√(A^2 - x^2) = ±ωA (maximum speed). Kinetic energy is maximum while potential energy is zero.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-27',
    q: 'Resonance in a driven mechanical oscillator occurs when the driving frequency of the external periodic force:',
    options: [
      'Matches the natural resonant frequency of the oscillating system, causing maximum amplitude',
      'Is significantly greater than ten times the natural frequency',
      'Equals zero',
      'Causes damping forces to increase to infinity'
    ],
    correct: 0,
    topic: 'Resonance and Damping',
    chapter: 'Oscillations',
    explain: 'Resonance occurs when the external driving frequency matches the system\'s natural undamped frequency (ω_drive ≈ ω_0), allowing maximum power transfer and peak oscillation amplitude.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-28',
    q: 'What is the total mechanical energy of an object of mass m executing simple harmonic motion with amplitude A and angular frequency ω?',
    options: ['(1/2) m ω^2 A^2', 'm ω A', '(1/2) m ω A^2', 'm ω^2 A'],
    correct: 0,
    topic: 'Energy in SHM',
    chapter: 'Oscillations',
    explain: 'Total energy E = KE + PE = (1/2)kA^2. Since spring constant k = mω^2, total energy E = (1/2)mω^2A^2, which remains constant at all points in the oscillation cycle.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Waves (4 MCQs: 29 to 32) ---
  {
    id: 'mdcat-b6-phy-29',
    q: 'The fundamental frequency of a vibrating string of length L fixed at both ends and under tension T with linear mass density μ is given by:',
    options: ['f1 = (1 / 2L) √(T / μ)', 'f1 = (1 / L) √(T / μ)', 'f1 = 2L √(μ / T)', 'f1 = (1 / 4L) √(T / μ)'],
    correct: 0,
    topic: 'Stationary Waves in Strings',
    chapter: 'Waves',
    explain: 'Wave speed on a stretched string is v = √(T / μ). For the fundamental harmonic fixed at both ends, λ1 = 2L. Therefore, f1 = v / λ1 = (1 / 2L) √(T / μ).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-30',
    q: 'According to the Doppler effect, when an ambulance emitting a siren of frequency f0 approaches a stationary pedestrian, the pitch heard by the pedestrian is:',
    options: [
      'Higher than f0, because successive wave crests are compressed closer together in front of the moving source',
      'Lower than f0, because the sound wave moves slower through air',
      'Identical to f0',
      'Alternating periodically between ultrasound and infrasound'
    ],
    correct: 0,
    topic: 'Doppler Effect',
    chapter: 'Waves',
    explain: 'As the source approaches, the apparent wavelength decreases (λ\' = λ - v_source · T), so apparent frequency f\' = v / (v - v_source) · f0 is higher than emitted frequency f0.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-31',
    q: 'Two tuning forks with frequencies of 256 Hz and 260 Hz are sounded simultaneously. What is the beat frequency perceived by an observer?',
    options: ['4 Hz', '258 Hz', '516 Hz', '2 Hz'],
    correct: 0,
    topic: 'Beats',
    chapter: 'Waves',
    explain: 'Beat frequency f_beat = |f1 - f2| = |260 Hz - 256 Hz| = 4 Hz (4 beats per second).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-32',
    q: 'In Young\'s double-slit experiment, the fringe width (fringe spacing β) on a distant screen is related to wavelength λ, slit separation d, and screen distance D by:',
    options: ['β = λD / d', 'β = λd / D', 'β = dD / λ', 'β = 2λD / d'],
    correct: 0,
    topic: 'Interference of Light',
    chapter: 'Waves',
    explain: 'The distance between adjacent bright fringes (or adjacent dark fringes) is fringe width β = λ · D / d, where D is screen distance and d is slit separation.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Thermodynamics (4 MCQs: 33 to 36) ---
  {
    id: 'mdcat-b6-phy-33',
    q: 'In an adiabatic thermodynamic expansion of an ideal gas:',
    options: [
      'No heat enters or leaves the system (Q = 0), and work is done entirely at the expense of internal energy',
      'Temperature remains constant (ΔT = 0)',
      'Pressure remains constant throughout the expansion',
      'The entropy of the universe decreases'
    ],
    correct: 0,
    topic: 'Thermodynamic Processes',
    chapter: 'Thermodynamics',
    explain: 'An adiabatic process is thermally insulated so Q = 0. By the First Law ΔU = Q - W = -W, work done by the gas (W > 0) causes internal energy and temperature to drop.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-34',
    q: 'What is the theoretical maximum thermal efficiency of an ideal Carnot heat engine operating between a hot reservoir at 500 K and a cold reservoir at 300 K?',
    options: ['40%', '60%', '20%', '66.7%'],
    correct: 0,
    topic: 'Carnot Cycle Efficiency',
    chapter: 'Thermodynamics',
    explain: 'Carnot efficiency η = 1 - (Tc / Th) = 1 - (300 / 500) = 1 - 0.60 = 0.40 or 40%.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-35',
    q: 'The molar heat capacity of a gas at constant pressure (Cp) is always greater than the molar heat capacity at constant volume (Cv) because at constant pressure:',
    options: [
      'The gas expands and does external work against atmospheric pressure in addition to raising temperature',
      'Molecules break their internal chemical covalent bonds',
      'The density of the gas increases with temperature',
      'All heat energy is radiated away as infrared photons'
    ],
    correct: 0,
    topic: 'Heat Capacities and Mayer\'s Relation',
    chapter: 'Thermodynamics',
    explain: 'At constant volume, no work is done (W = 0). At constant pressure, heat added must both raise internal energy (increase temperature) AND perform work (PΔV), so Cp - Cv = R (Mayer\'s relation).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-36',
    q: 'The Second Law of Thermodynamics states that for any spontaneous, irreversible process occurring in an isolated system, the total entropy of the system:',
    options: ['Always increases (ΔS > 0)', 'Always decreases (ΔS < 0)', 'Remains exactly constant', 'Becomes zero at room temperature'],
    correct: 0,
    topic: 'Second Law of Thermodynamics',
    chapter: 'Thermodynamics',
    explain: 'The Clausius statement and statistical mechanics dictate that real irreversible processes increase molecular disorder; the entropy of an isolated system never decreases and always increases (ΔS > 0).',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electrostatics (4 MCQs: 37 to 40) ---
  {
    id: 'mdcat-b6-phy-37',
    q: 'According to Coulomb\'s Law, if the distance between two point charges is doubled, the electrostatic force between them is multiplied by a factor of:',
    options: ['1/4 (one-fourth)', '1/2 (one-half)', '4 (quadrupled)', '1/8'],
    correct: 0,
    topic: 'Coulomb\'s Law',
    chapter: 'Electrostatics',
    explain: 'Coulomb\'s force follows the inverse-square law: F ∝ 1 / r^2. If distance doubles (2r), the new force F\' = F / (2)^2 = F / 4.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-38',
    q: 'A parallel plate capacitor with capacitance C0 has an insulating dielectric slab of relative permittivity (dielectric constant) εr = 4 inserted completely between its plates. What is its new capacitance?',
    options: ['4 C0', 'C0 / 4', '2 C0', '16 C0'],
    correct: 0,
    topic: 'Capacitance and Dielectrics',
    chapter: 'Electrostatics',
    explain: 'Inserting a dielectric reduces the internal electric field and potential difference for a given charge, multiplying capacitance by the dielectric constant: C = εr · C0 = 4 C0.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-39',
    q: 'According to Gauss\'s Law, the total outward electric flux through any closed Gaussian surface enclosing a net electric charge Q_enc in a vacuum is equal to:',
    options: ['Q_enc / ε0', 'Q_enc · ε0', '4πε0 · Q_enc', 'Q_enc / (4πε0 r^2)'],
    correct: 0,
    topic: 'Gauss\'s Law',
    chapter: 'Electrostatics',
    explain: 'Gauss\'s law states that ∮ E · dA = Q_enc / ε0, where ε0 is the permittivity of free space.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-40',
    q: 'What is the electrical energy stored in a 10 μF capacitor charged to a potential difference of 200 V?',
    options: ['0.20 Joules', '0.40 Joules', '2.0 Joules', '0.02 Joules'],
    correct: 0,
    topic: 'Energy Stored in Capacitor',
    chapter: 'Electrostatics',
    explain: 'U = (1/2) C V^2 = 0.5 × (10 × 10^-6 F) × (200 V)^2 = 0.5 × 10^-5 × 40,000 = 0.20 Joules.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Current Electricity (4 MCQs: 41 to 44) ---
  {
    id: 'mdcat-b6-phy-41',
    q: 'Kirchhoff\'s Current Law (junction rule: ΣI = 0 at any circuit node) is an immediate consequence of the conservation of:',
    options: ['Electric charge', 'Energy', 'Linear momentum', 'Magnetic flux'],
    correct: 0,
    topic: 'Kirchhoff\'s Rules',
    chapter: 'Current Electricity',
    explain: 'Because electric charge cannot accumulate indefinitely or spontaneously disappear at a junction, the sum of currents entering equals the sum of currents exiting, conserving electric charge.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-42',
    q: 'Three resistors of resistances 6 Ω, 3 Ω, and 2 Ω are connected in parallel across a DC battery. What is their equivalent resistance?',
    options: ['1.0 Ω', '11.0 Ω', '2.5 Ω', '0.5 Ω'],
    correct: 0,
    topic: 'Resistor Networks',
    chapter: 'Current Electricity',
    explain: '1/R_eq = 1/6 + 1/3 + 1/2 = 1/6 + 2/6 + 3/6 = 6/6 = 1. Therefore, R_eq = 1.0 Ω.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-43',
    q: 'A potentiometer is superior to a standard voltmeter for measuring the electromotive force (EMF) of a cell because:',
    options: [
      'At the balance point, it draws zero current from the test cell, measuring the true open-circuit terminal voltage',
      'It has zero internal resistance',
      'It requires an external AC power supply',
      'It converts electrical potential directly into magnetic field'
    ],
    correct: 0,
    topic: 'Potentiometer',
    chapter: 'Current Electricity',
    explain: 'A potentiometer operates as a null detector. At the null balance point, no current is drawn from the cell under test, preventing internal resistance drop (Ir) and measuring true EMF.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-44',
    q: 'The resistance R of a cylindrical metallic wire of resistivity ρ, length L, and cross-sectional diameter d is given by R = 4ρL / (πd^2). If the wire is drawn out uniformly so that its length is doubled while mass remains constant, its new resistance becomes:',
    options: ['4 times original resistance (4R)', '2 times original resistance (2R)', 'Half original resistance (R/2)', '16 times original resistance (16R)'],
    correct: 0,
    topic: 'Resistivity and Wire Geometry',
    chapter: 'Current Electricity',
    explain: 'Since volume V = A · L is conserved, doubling the length (L\' = 2L) halves the cross-sectional area (A\' = A/2). Resistance R\' = ρ(2L) / (A/2) = 4 [ρL / A] = 4R.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Electromagnetism (4 MCQs: 45 to 48) ---
  {
    id: 'mdcat-b6-phy-45',
    q: 'A charged particle of charge q enters a uniform magnetic field B with velocity v directed perpendicular to the magnetic field lines. The path traced by the particle inside the field is a:',
    options: [
      'Circle, because the magnetic Lorentz force acts perpendicular to velocity at every instant, doing zero work',
      'Straight line with accelerating speed',
      'Parabola toward the positive magnetic pole',
      'Hyperbola with decreasing kinetic energy'
    ],
    correct: 0,
    topic: 'Magnetic Force on Moving Charges',
    chapter: 'Electromagnetism',
    explain: 'Magnetic force F = q(v × B) is perpendicular to both velocity and magnetic field, acting purely as a centripetal force (qvB = mv^2 / r) that alters direction without changing speed, tracing a circular path.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-46',
    q: 'According to Ampere\'s Law, the magnetic field strength B inside an ideal tightly-wound solenoid of n turns per unit length carrying a steady current I is:',
    options: ['B = μ0 n I', 'B = μ0 I / (2πr)', 'B = μ0 n^2 I', 'B = 2μ0 n I'],
    correct: 0,
    topic: 'Ampere\'s Law and Solenoids',
    chapter: 'Electromagnetism',
    explain: 'Applying Ampere\'s circuital law ∮ B · dl = μ0 I_enc yields B = μ0 n I inside the solenoid bore, with uniform axial field lines.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-47',
    q: 'A moving coil galvanometer is converted into a high-range DC voltmeter by connecting which component in series with the galvanometer coil?',
    options: ['A high resistance (multiplier resistor)', 'A very low resistance shunt in parallel', 'An inductor coil in series', 'A step-up transformer'],
    correct: 0,
    topic: 'Electrical Meters',
    chapter: 'Electromagnetism',
    explain: 'To measure high voltage drops without drawing excessive current, a high resistance Rh is connected in series with the galvanometer coil: Rh = (V / Ig) - Rg.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-48',
    q: 'The magnetic dipole moment M of a planar loop of N turns, carrying current I and enclosing an area A, is defined as:',
    options: ['M = N · I · A', 'M = N · I / A', 'M = I · A / N', 'M = B · I · L'],
    correct: 0,
    topic: 'Magnetic Dipole Moment',
    chapter: 'Electromagnetism',
    explain: 'Magnetic dipole moment M = N I A, oriented perpendicular to the loop plane according to the right-hand grip rule. In an external field B, torque is τ = M × B.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electromagnetic Induction (3 MCQs: 49 to 51) ---
  {
    id: 'mdcat-b6-phy-49',
    q: 'Lenz\'s Law states that the direction of an induced electromotive force (EMF) and current always opposes the change in magnetic flux that produces it. Lenz\'s law is a physical manifestation of:',
    options: ['Law of Conservation of Energy', 'Law of Conservation of Momentum', 'Gauss\'s Law of Magnetism', 'Coulomb\'s Law'],
    correct: 0,
    topic: 'Faraday\'s and Lenz\'s Laws',
    chapter: 'Electromagnetic Induction',
    explain: 'If the induced current aided the change in flux, infinite energy would be created from nothing. Lenz\'s law ensures mechanical work must be done against opposing magnetic forces, conserving energy.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-50',
    q: 'An ideal step-down transformer has a primary-to-secondary turns ratio of Np/Ns = 10:1. If the primary winding is supplied with 240 V AC at 2.0 A, what are the secondary output voltage and secondary current?',
    options: ['Vs = 24 V and Is = 20 A', 'Vs = 2400 V and Is = 0.2 A', 'Vs = 24 V and Is = 0.2 A', 'Vs = 120 V and Is = 4.0 A'],
    correct: 0,
    topic: 'Transformers',
    chapter: 'Electromagnetic Induction',
    explain: 'Vs = Vp × (Ns / Np) = 240 V × (1 / 10) = 24 V. For an ideal transformer (100% efficiency), Pp = Ps => Vp · Ip = Vs · Is => Is = (240 × 2) / 24 = 20 A.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-51',
    q: 'The self-inductance L of a coil in which a rate of change of current of 5.0 A/s induces a back EMF of 10.0 V is:',
    options: ['2.0 Henry', '0.5 Henry', '50 Henry', '15 Henry'],
    correct: 0,
    topic: 'Self-Inductance',
    chapter: 'Electromagnetic Induction',
    explain: 'Induced EMF ε = -L (ΔI / Δt) => L = |ε| / (ΔI / Δt) = 10.0 V / (5.0 A/s) = 2.0 Henry.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electronics (3 MCQs: 52 to 54) ---
  {
    id: 'mdcat-b6-phy-52',
    q: 'In a forward-biased p-n junction diode:',
    options: [
      'The external positive terminal is connected to the p-type region, narrowing the depletion layer and allowing majority carriers to cross',
      'The depletion region widens, preventing all current flow',
      'Conduction occurs solely via minority carriers',
      'The junction breakdown voltage is permanently exceeded'
    ],
    correct: 0,
    topic: 'Semiconductor Diodes',
    chapter: 'Electronics',
    explain: 'In forward bias, connecting p-region to positive and n-region to negative repels holes and electrons toward the junction, reducing barrier potential and thinning the depletion layer to allow large forward current.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-53',
    q: 'A bridge rectifier circuit employs four semiconductor diodes to achieve full-wave rectification. What is its fundamental advantage over a center-tapped transformer full-wave rectifier?',
    options: [
      'It does not require a bulky center-tapped secondary transformer winding and has lower peak inverse voltage (PIV) rating requirements per diode',
      'It requires only a single diode',
      'It produces pure DC without requiring any smoothing filter capacitors',
      'It operates only on three-phase electrical grids'
    ],
    correct: 0,
    topic: 'Rectification',
    chapter: 'Electronics',
    explain: 'A bridge rectifier uses a standard secondary winding (no center tap) and the PIV of each diode is Vm rather than 2Vm, making it more compact and economical for power supplies.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-54',
    q: 'An operational amplifier (op-amp) configured as an inverting amplifier has input resistance Rin = 10 kΩ and feedback resistance Rf = 100 kΩ. What is the closed-loop voltage gain Av of this circuit?',
    options: ['-10', '+10', '-100', '+11'],
    correct: 0,
    topic: 'Operational Amplifiers',
    chapter: 'Electronics',
    explain: 'For an inverting op-amp with virtual ground at the inverting input: Av = -Rf / Rin = -100 kΩ / 10 kΩ = -10.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Dawn of Modern Physics (3 MCQs: 55 to 57) ---
  {
    id: 'mdcat-b6-phy-55',
    q: 'In the photoelectric effect, increasing the intensity of incident monochromatic light above the threshold frequency results in:',
    options: [
      'An increase in the number of photoelectrons emitted per second (photoelectric current) without changing their maximum kinetic energy',
      'An increase in the maximum kinetic energy of emitted electrons',
      'A decrease in the stopping potential',
      'A complete cessation of photoelectron emission'
    ],
    correct: 0,
    topic: 'Photoelectric Effect',
    chapter: 'Dawn of Modern Physics',
    explain: 'Light intensity corresponds to the number of photons per second. Each photon above threshold frequency ejects one electron. More photons = more ejected photoelectrons per second (higher current). Maximum kinetic energy depends strictly on photon frequency (hf - Φ), not intensity.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-56',
    q: 'In the Compton scattering experiment, an incident X-ray photon collides with a stationary electron and is scattered through an angle θ. The shift in wavelength (Δλ = λ\' - λ) is given by Δλ = (h / m_e c)(1 - cos θ). At what scattering angle is the Compton wavelength shift maximized?',
    options: ['180° (backscattering)', '90°', '0°', '45°'],
    correct: 0,
    topic: 'Compton Effect',
    chapter: 'Dawn of Modern Physics',
    explain: 'Δλ is maximum when (1 - cos θ) is maximum. Since cos 180° = -1, (1 - (-1)) = 2. Thus, at θ = 180°, Δλ_max = 2h / (m_e c) ≈ 0.0485 Å.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-57',
    q: 'Pair production (spontaneous creation of an electron and a positron from a high-energy photon) can occur only if the incident gamma-ray photon possesses a minimum energy equal to the rest mass energy of both particles, which is:',
    options: ['1.02 MeV', '0.51 MeV', '2.04 MeV', '13.6 eV'],
    correct: 0,
    topic: 'Pair Production',
    chapter: 'Dawn of Modern Physics',
    explain: 'Rest mass of an electron = 0.511 MeV. Creating an electron-positron pair requires minimum threshold photon energy hf = 2 m_e c^2 = 2 × 0.511 MeV = 1.022 MeV in the vicinity of a heavy nucleus to conserve momentum.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Nuclear Physics (3 MCQs: 58 to 60) ---
  {
    id: 'mdcat-b6-phy-58',
    q: 'A radioactive isotope has a half-life of 4.0 hours. If a freshly prepared sample contains 80 mg of this isotope, what mass of the parent isotope remains undecayed after 12 hours?',
    options: ['10 mg', '20 mg', '5 mg', '40 mg'],
    correct: 0,
    topic: 'Radioactive Decay and Half-Life',
    chapter: 'Nuclear Physics',
    explain: 'Number of half-lives n = total time / half-life = 12 h / 4 h = 3 half-lives. Remaining mass = 80 mg / (2^3) = 80 / 8 = 10 mg.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-59',
    q: 'In nuclear physics, the mass defect Δm between the sum of individual constituent nucleon masses and the actual bound nucleus mass is converted into binding energy according to Einstein\'s equation E = Δm · c^2. What element possesses the highest binding energy per nucleon (~8.8 MeV/nucleon), making its nucleus the most stable?',
    options: ['Iron-56 (56Fe)', 'Uranium-235 (235U)', 'Helium-4 (4He)', 'Lead-208 (208Pb)'],
    correct: 0,
    topic: 'Nuclear Binding Energy',
    chapter: 'Nuclear Physics',
    explain: 'The binding energy per nucleon curve peaks near mass number A ≈ 56 to 62, with Iron-56 (56Fe) and Nickel-62 having the highest binding energy per nucleon (~8.8 MeV), making them the most thermodynamically stable nuclei.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b6-phy-60',
    q: 'In the nuclear fission of Uranium-235 triggered by a thermal neutron (235U + 1n → 141Ba + 92Kr + 3 1n + Q), what is the function of heavy water (D2O) or graphite in a nuclear reactor?',
    options: [
      'To act as a moderator that slows down fast fission neutrons to thermal speeds to sustain the chain reaction',
      'To absorb all neutrons and immediately shut down the reactor',
      'To accelerate neutrons to relativistic velocities',
      'To shield workers from external gamma radiation'
    ],
    correct: 0,
    topic: 'Nuclear Fission and Reactors',
    chapter: 'Nuclear Physics',
    explain: 'Moderators such as heavy water (D2O) and graphite slow down energetic fast neutrons (~2 MeV) through elastic collisions down to thermal energies (~0.025 eV), at which 235U has a vastly higher fission capture cross-section.',
    difficulty: 'Medium',
    subject: 'Physics'
  }
];

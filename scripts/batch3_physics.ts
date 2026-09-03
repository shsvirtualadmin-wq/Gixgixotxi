import { Question } from '../src/types';

// Batch 3 Physics: 100 brand new MCQs (33 Easy, 33 Medium, 34 Hard)
// Exactly 5 questions per chapter across all 20 official syllabus chapters
export const BATCH3_PHYSICS: Question[] = [
  // =========================================================
  // Chapter 1: Measurements (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-meas-11',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Easy',
    q: 'Which of the following is a derived SI unit?',
    options: ['Newton', 'Kelvin', 'Mole', 'Candela'],
    correct: 0,
    explain: 'Kelvin, mole, and candela are base SI units, whereas Newton (N = kg·m/s²) is a derived unit of force.'
  },
  {
    id: 'tcat-phy-meas-12',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Medium',
    q: 'The fractional uncertainty in a measurement is defined as the ratio of:',
    options: ['Absolute uncertainty to the measured value', 'Measured value to absolute uncertainty', 'Percentage uncertainty to 1000', 'Least count to total range'],
    correct: 0,
    explain: 'Fractional uncertainty = (Absolute uncertainty / Measured value). Multiplying by 100 yields the percentage uncertainty.'
  },
  {
    id: 'tcat-phy-meas-13',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Hard',
    q: 'If the percentage uncertainty in measuring radius r of a sphere is 2%, what is the percentage uncertainty in its calculated volume V = (4/3)πr³?',
    options: ['6%', '2%', '8%', '4%'],
    correct: 0,
    explain: 'For V ∝ r³, the percentage uncertainty in V is 3 times the percentage uncertainty in r: 3 * 2% = 6%.'
  },
  {
    id: 'tcat-phy-meas-14',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Hard',
    q: 'What are the dimensions of the universal gravitational constant G in terms of M, L, and T?',
    options: ['[M⁻¹ L³ T⁻²]', '[M L² T⁻²]', '[M⁻¹ L² T⁻¹]', '[M L³ T⁻²]'],
    correct: 0,
    explain: 'From F = G m1 m2 / r², G = F r² / m² = [M L T⁻²][L²] / [M²] = [M⁻¹ L³ T⁻²].'
  },
  {
    id: 'tcat-phy-meas-15',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Hard',
    q: 'What are the dimensions of Planck’s constant h?',
    options: ['[M L² T⁻¹]', '[M L² T⁻²]', '[M L T⁻¹]', '[M⁻¹ L² T⁻¹]'],
    correct: 0,
    explain: 'E = h f => h = E / f = [M L² T⁻²] / [T⁻¹] = [M L² T⁻¹], which matches the dimensions of angular momentum.'
  },

  // =========================================================
  // Chapter 2: Vectors and Equilibrium (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-ve-11',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Easy',
    q: 'A body is in rotational equilibrium if and only if the vector sum of all external:',
    options: ['Torques acting on it is zero (Στ = 0)', 'Forces acting on it is zero (ΣF = 0)', 'Velocities is constant', 'Momenta is non-zero'],
    correct: 0,
    explain: 'The second condition of equilibrium states that the algebraic sum of all external torques must vanish: Στ = 0.'
  },
  {
    id: 'tcat-phy-ve-12',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Easy',
    q: 'Two forces of 6 N and 8 N act at a point at right angles (90°) to each other. What is the magnitude of their resultant force?',
    options: ['10 N', '14 N', '2 N', '48 N'],
    correct: 0,
    explain: 'R = sqrt(F1² + F2²) = sqrt(6² + 8²) = sqrt(36 + 64) = sqrt(100) = 10 N.'
  },
  {
    id: 'tcat-phy-ve-13',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Medium',
    q: 'A couple consists of two parallel forces that are:',
    options: [
      'Equal in magnitude, opposite in direction, with different lines of action',
      'Equal in magnitude and in the same direction',
      'Unequal in magnitude with identical line of action',
      'Perpendicular to each other'
    ],
    correct: 0,
    explain: 'A couple is formed by two equal and antiparallel forces not acting along the same line, producing pure rotation without translation.'
  },
  {
    id: 'tcat-phy-ve-14',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Medium',
    q: 'At what angle θ between two equal magnitude vectors does their resultant also have the exact same magnitude as each vector?',
    options: ['120°', '60°', '90°', '180°'],
    correct: 0,
    explain: 'R² = A² + A² + 2A² cos(θ). If R = A, then A² = 2A²(1 + cos(θ)) => 1 + cos(θ) = 1/2 => cos(θ) = -1/2 => θ = 120°.'
  },
  {
    id: 'tcat-phy-ve-15',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Hard',
    q: 'A uniform meter rod of mass 200 g is balanced horizontally at its 40 cm mark when a mass m is suspended from the 20 cm mark. What is mass m?',
    options: ['100 g', '200 g', '50 g', '400 g'],
    correct: 0,
    explain: 'The rod’s center of gravity is at 50 cm. Lever arm of rod weight = 50 - 40 = 10 cm. Lever arm of mass m = 40 - 20 = 20 cm. By principle of moments: m * 20 = 200 * 10 => m = 100 g.'
  },

  // =========================================================
  // Chapter 3: Motion and Force (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-mf-11',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Easy',
    q: 'The area under a velocity-time graph represents which physical quantity?',
    options: ['Displacement', 'Acceleration', 'Force', 'Instantaneous speed'],
    correct: 0,
    explain: 'The integral of velocity with respect to time ∫ v dt equals the displacement of the moving body.'
  },
  {
    id: 'tcat-phy-mf-12',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Easy',
    q: 'Newton’s third law of motion implies that action and reaction forces:',
    options: [
      'Act on two different interacting bodies',
      'Act on the exact same body and cancel each other',
      'Occur with a slight time delay',
      'Are unequal in non-inertial frames'
    ],
    correct: 0,
    explain: 'Action and reaction forces act simultaneously on two different interacting objects, so they never cancel each other out.'
  },
  {
    id: 'tcat-phy-mf-13',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Medium',
    q: 'A ball is projected horizontally with velocity v from the top of a cliff of height h. What is its time of flight to reach the ground?',
    options: ['sqrt(2h / g)', 'sqrt(h / g)', '2h / g', 'v * sqrt(2h / g)'],
    correct: 0,
    explain: 'Vertical initial velocity is zero: h = (1/2)gt² => t = sqrt(2h / g), which is completely independent of the horizontal launch velocity.'
  },
  {
    id: 'tcat-phy-mf-14',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Medium',
    q: 'In an elastic collision between two isolated bodies in one dimension, which quantities are conserved?',
    options: ['Both total linear momentum and total kinetic energy', 'Only total linear momentum', 'Only total kinetic energy', 'Neither momentum nor kinetic energy'],
    correct: 0,
    explain: 'By definition, an elastic collision conserves both the total linear momentum and the total kinetic energy of the system.'
  },
  {
    id: 'tcat-phy-mf-15',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Hard',
    q: 'A 1000 kg rocket expels exhaust gases at an effective exhaust speed of 2000 m/s. To achieve an initial upward acceleration of 10.2 m/s² (taking g = 9.8 m/s²), what must be the rate of gas ejection dm/dt?',
    options: ['10 kg/s', '5 kg/s', '20 kg/s', '15 kg/s'],
    correct: 0,
    explain: 'Thrust F = v_rel * (dm/dt). Upward net force: F - mg = m*a => F = m(g + a) = 1000(9.8 + 10.2) = 20,000 N. Rate dm/dt = 20,000 / 2000 = 10 kg/s.'
  },

  // =========================================================
  // Chapter 4: Work and Energy (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-we-11',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Easy',
    q: 'One kilowatt-hour (1 kWh) of electrical energy is numerically equivalent to how many Joules?',
    options: ['3.6 x 10⁶ J', '3.6 x 10³ J', '1.0 x 10⁵ J', '3.6 x 10⁹ J'],
    correct: 0,
    explain: '1 kWh = (1000 W) * (3600 s) = 3,600,000 J = 3.6 x 10⁶ J = 3.6 MJ.'
  },
  {
    id: 'tcat-phy-we-12',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Medium',
    q: 'If the linear momentum p of an object is increased by 100%, by what percentage does its kinetic energy increase?',
    options: ['300%', '100%', '200%', '400%'],
    correct: 0,
    explain: 'KE = p² / (2m). If p doubles to 2p, KE becomes (2p)² / (2m) = 4 KE, an increase of 300%.'
  },
  {
    id: 'tcat-phy-we-13',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Hard',
    q: 'The work done by a conservative force along any closed path in a gravitational field is always:',
    options: ['Zero', 'Positive', 'Negative', 'Dependent on the path taken'],
    correct: 0,
    explain: 'By definition of a conservative force field, the line integral along any closed loop is strictly zero: ∮ F · dr = 0.'
  },
  {
    id: 'tcat-phy-we-14',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Hard',
    q: 'What is the absolute gravitational potential energy of a body of mass m at infinity from Earth?',
    options: ['Zero', 'Maximum positive value', 'Negative infinity', 'mgR'],
    correct: 0,
    explain: 'Gravitational potential energy U = -G M m / r. As r approaches infinity (r -> ∞), U reaches its maximum reference value of zero.'
  },
  {
    id: 'tcat-phy-we-15',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Hard',
    q: 'An electric motor with 75% efficiency delivers 3 kW of mechanical output power. What is the electrical power input to the motor?',
    options: ['4.0 kW', '2.25 kW', '5.0 kW', '3.75 kW'],
    correct: 0,
    explain: 'Efficiency η = Power_out / Power_in => Power_in = Power_out / η = 3 kW / 0.75 = 4.0 kW.'
  },

  // =========================================================
  // Chapter 5: Circular Motion (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-cm-11',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Easy',
    q: 'What is the relationship between linear velocity v and angular velocity ω for a particle moving in a circle of radius r?',
    options: ['v = r ω', 'v = ω / r', 'ω = v r', 'v = r² ω'],
    correct: 0,
    explain: 'Linear speed v is related to angular speed ω by the fundamental formula v = r ω.'
  },
  {
    id: 'tcat-phy-cm-12',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Easy',
    q: 'A body moving in a circle with constant speed has centripetal acceleration directed:',
    options: ['Towards the center of the circle', 'Tangentially to the circle', 'Away from the center', 'Along the rotation axis'],
    correct: 0,
    explain: 'Centripetal acceleration a_c = v² / r is always directed radially inward toward the center of the circular trajectory.'
  },
  {
    id: 'tcat-phy-cm-13',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Medium',
    q: 'What is the moment of inertia of a thin uniform hoop (ring) of mass M and radius R about its central symmetry axis?',
    options: ['M R²', '(1/2) M R²', '(2/5) M R²', '(1/12) M R²'],
    correct: 0,
    explain: 'For a thin cylindrical ring or hoop where all mass is at distance R from the central axis, I = M R².'
  },
  {
    id: 'tcat-phy-cm-14',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Medium',
    q: 'What is the orbital period of a geostationary satellite orbiting the Earth?',
    options: ['24 hours (1 day)', '12 hours', '84 minutes', '365 days'],
    correct: 0,
    explain: 'A geostationary satellite remains stationary relative to a point on the equator because its orbital period exactly matches Earth’s rotation period: 24 hours.'
  },
  {
    id: 'tcat-phy-cm-15',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Hard',
    q: 'A solid sphere and a hollow cylinder of identical mass and radius roll down the same incline without slipping. Which reaches the bottom first?',
    options: [
      'The solid sphere, because it has a smaller moment of inertia',
      'The hollow cylinder, because all its mass is at the rim',
      'Both reach simultaneously',
      'Depends on the inclination angle'
    ],
    correct: 0,
    explain: 'Acceleration on an incline a = g sin(θ) / (1 + I / (m R²)). For a solid sphere, I/(mR²) = 2/5 = 0.4; for a hollow cylinder, I/(mR²) = 1. The solid sphere has less rotational inertia and accelerates faster.'
  },

  // =========================================================
  // Chapter 6: Fluid Dynamics (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-fd-11',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Easy',
    q: 'What are the SI units of dynamic viscosity coefficient η?',
    options: ['N·s·m⁻² (or Pa·s)', 'N·m⁻²', 'kg·m·s⁻¹', 'N·s⁻¹'],
    correct: 0,
    explain: 'From Stokes\' law F = 6πηrv, η = F / (6πrv) = N / (m · m/s) = N·s·m⁻² = Pa·s.'
  },
  {
    id: 'tcat-phy-fd-12',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Medium',
    q: 'According to the Equation of Continuity for incompressible fluid flow, what product remains constant along a streamline?',
    options: ['Cross-sectional area x flow speed (A * v)', 'Pressure x velocity (P * v)', 'Density x area (ρ * A)', 'Viscosity x velocity (η * v)'],
    correct: 0,
    explain: 'The equation of continuity states that the volume flow rate Q = A * v is constant at every cross-section for an incompressible fluid.'
  },
  {
    id: 'tcat-phy-fd-13',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Hard',
    q: 'Bernoulli’s equation is a direct mathematical consequence of the law of conservation of:',
    options: ['Energy', 'Linear momentum', 'Mass', 'Angular momentum'],
    correct: 0,
    explain: 'Bernoulli’s equation relates pressure energy, kinetic energy, and potential energy per unit volume, embodying conservation of energy for steady, ideal fluid flow.'
  },
  {
    id: 'tcat-phy-fd-14',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Hard',
    q: 'According to Torricelli’s theorem, the efflux speed of a liquid emerging from a small hole at depth h below the free liquid surface is:',
    options: ['sqrt(2gh)', '2gh', 'sqrt(gh)', 'gh / 2'],
    correct: 0,
    explain: 'Torricelli’s law gives v = sqrt(2gh), which is identical to the speed of a freely falling body dropped through vertical height h.'
  },
  {
    id: 'tcat-phy-fd-15',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Hard',
    q: 'When water flows from a pipe of diameter 4 cm into a nozzle of diameter 2 cm, how does the flow speed change in the nozzle?',
    options: ['Increases by a factor of 4', 'Increases by a factor of 2', 'Decreases by a factor of 4', 'Remains unchanged'],
    correct: 0,
    explain: 'By continuity A1 v1 = A2 v2 => v2 = v1 * (d1 / d2)². With d1/d2 = 4/2 = 2, v2 = v1 * 2² = 4 v1.'
  },

  // =========================================================
  // Chapter 7: Oscillations (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-osc-11',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Easy',
    q: 'In simple harmonic motion (SHM), the acceleration of the particle is directly proportional to its displacement and:',
    options: ['Always directed towards the mean position', 'Always directed away from the mean position', 'Perpendicular to displacement', 'Directed along velocity'],
    correct: 0,
    explain: 'By definition of SHM, a = -ω² x, meaning acceleration is proportional to displacement x and always directed toward the equilibrium (mean) position.'
  },
  {
    id: 'tcat-phy-osc-12',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Easy',
    q: 'What is the time period of a simple pendulum of length L in a gravitational field of strength g?',
    options: ['T = 2π sqrt(L / g)', 'T = 2π sqrt(g / L)', 'T = (1/2π) sqrt(L / g)', 'T = 2π (L / g)'],
    correct: 0,
    explain: 'The period of a simple pendulum executing small oscillations is T = 2π sqrt(L / g).'
  },
  {
    id: 'tcat-phy-osc-13',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Medium',
    q: 'At what displacement from the mean position are the kinetic energy and potential energy of an SHM oscillator equal?',
    options: ['x = x₀ / sqrt(2)', 'x = x₀ / 2', 'x = x₀ / 4', 'x = x₀ * sqrt(3) / 2'],
    correct: 0,
    explain: 'PE = (1/2)k x² and Total E = (1/2)k x₀². PE = Total E / 2 => (1/2)k x² = (1/4)k x₀² => x² = x₀² / 2 => x = x₀ / sqrt(2).'
  },
  {
    id: 'tcat-phy-osc-14',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Medium',
    q: 'When an oscillating system is driven by a periodic external force at a frequency matching its natural frequency, the phenomenon is called:',
    options: ['Resonance', 'Damping', 'Diffraction', 'Polarization'],
    correct: 0,
    explain: 'Resonance occurs when the driving frequency equals the natural frequency of the oscillator, resulting in maximum energy transfer and maximum amplitude.'
  },
  {
    id: 'tcat-phy-osc-15',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Hard',
    q: 'If the length of a simple pendulum is increased by 21%, by what percentage does its time period increase?',
    options: ['10%', '21%', '5%', '44%'],
    correct: 0,
    explain: 'T ∝ sqrt(L). New length L\' = 1.21 L. New period T\' = sqrt(1.21) T = 1.10 T, which is a 10% increase.'
  },

  // =========================================================
  // Chapter 8: Waves (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-wav-11',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Easy',
    q: 'Sound waves traveling through atmospheric air are classified as:',
    options: ['Longitudinal mechanical waves', 'Transverse mechanical waves', 'Electromagnetic waves', 'Stationary surface waves'],
    correct: 0,
    explain: 'Sound in air propagates as compressions and rarefactions where air molecules oscillate parallel to wave propagation, making them longitudinal mechanical waves.'
  },
  {
    id: 'tcat-phy-wav-12',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Easy',
    q: 'The distance between two consecutive nodes in a stationary wave is equal to:',
    options: ['λ / 2', 'λ', 'λ / 4', '2λ'],
    correct: 0,
    explain: 'In standing waves, the distance between any two adjacent nodes (or two adjacent antinodes) is half a wavelength, λ/2.'
  },
  {
    id: 'tcat-phy-wav-13',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Medium',
    q: 'Laplace corrected Newton’s formula for the speed of sound in air by assuming the compressions and rarefactions occur under:',
    options: ['Adiabatic conditions', 'Isothermal conditions', 'Isobaric conditions', 'Isochoric conditions'],
    correct: 0,
    explain: 'Laplace recognized that sound oscillations happen too rapidly for heat exchange with surroundings, meaning the process is adiabatic (v = sqrt(γ P / ρ)).'
  },
  {
    id: 'tcat-phy-wav-14',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Medium',
    q: 'Two tuning forks of frequencies 256 Hz and 260 Hz are sounded together. How many beats per second are heard?',
    options: ['4', '2', '258', '516'],
    correct: 0,
    explain: 'Beat frequency equals the absolute difference between the two interacting sound frequencies: f_beat = |260 - 256| = 4 Hz.'
  },
  {
    id: 'tcat-phy-wav-15',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Hard',
    q: 'An organ pipe open at both ends of length L has its fundamental frequency f. If one end is now closed, what is the new fundamental frequency?',
    options: ['f / 2', '2 f', 'f / 4', 'f'],
    correct: 0,
    explain: 'For an open pipe, f_open = v / (2L). For a closed pipe of same length, f_closed = v / (4L) = (1/2) * (v / 2L) = f / 2.'
  },

  // =========================================================
  // Chapter 9: Thermodynamics (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-td-11',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Easy',
    q: 'The First Law of Thermodynamics is a statement of the conservation of:',
    options: ['Energy', 'Entropy', 'Momentum', 'Mass'],
    correct: 0,
    explain: 'The First Law (ΔQ = ΔU + W) expresses the principle of conservation of energy for thermodynamic systems.'
  },
  {
    id: 'tcat-phy-td-12',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Medium',
    q: 'In an isothermal expansion of an ideal gas, which parameter remains strictly constant?',
    options: ['Temperature', 'Pressure', 'Volume', 'Heat content'],
    correct: 0,
    explain: 'An isothermal process occurs at constant temperature (ΔT = 0), so internal energy change ΔU = 0.'
  },
  {
    id: 'tcat-phy-td-13',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Hard',
    q: 'What is the theoretical efficiency of a Carnot heat engine operating between hot reservoir T_H = 600 K and cold reservoir T_C = 300 K?',
    options: ['50%', '100%', '25%', '75%'],
    correct: 0,
    explain: 'Carnot efficiency η = 1 - T_C / T_H = 1 - 300 / 600 = 1 - 0.5 = 0.50 or 50%.'
  },
  {
    id: 'tcat-phy-td-14',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Hard',
    q: 'What is the change in entropy ΔS during any reversible adiabatic process?',
    options: ['Zero', 'Positive', 'Negative', 'Infinite'],
    correct: 0,
    explain: 'In an adiabatic reversible process, no heat is transferred (dQ = 0). Since dS = dQ / T, the change in entropy ΔS = 0 (isentropic process).'
  },
  {
    id: 'tcat-phy-td-15',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Hard',
    q: 'For an ideal gas, the molar heat capacity at constant pressure C_p and at constant volume C_v are related by Mayer’s formula as:',
    options: ['C_p - C_v = R', 'C_p + C_v = R', 'C_v - C_p = R', 'C_p / C_v = R'],
    correct: 0,
    explain: 'Mayer’s relation states C_p - C_v = R, accounting for the mechanical boundary work P dV performed by the gas at constant pressure.'
  },

  // =========================================================
  // Chapter 10: Electrostatics (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-es-11',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Easy',
    q: 'The electric field strength E between two large oppositely charged parallel plates separated by distance d with potential difference V is:',
    options: ['E = V / d', 'E = V * d', 'E = d / V', 'E = V / d²'],
    correct: 0,
    explain: 'In a uniform electric field, the potential gradient magnitude is E = ΔV / Δr = V / d.'
  },
  {
    id: 'tcat-phy-es-12',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Easy',
    q: 'What is the capacitance of a parallel plate capacitor when a dielectric of relative permittivity ε_r is inserted between its plates?',
    options: ['Increases by factor ε_r', 'Decreases by factor ε_r', 'Remains unchanged', 'Becomes zero'],
    correct: 0,
    explain: 'Capacitance with dielectric C = ε_r * C_0. Since ε_r > 1 for all dielectric materials, capacitance increases by a factor of ε_r.'
  },
  {
    id: 'tcat-phy-es-13',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Medium',
    q: 'According to Gauss’s Law, the total electric flux Φ through any closed surface enclosing a net charge Q is:',
    options: ['Q / ε₀', 'Q * ε₀', '4π Q', 'Q / (4πε₀)'],
    correct: 0,
    explain: 'Gauss’s Law states that the net outward electric flux through any closed Gaussian surface equals Q_enclosed / ε₀.'
  },
  {
    id: 'tcat-phy-es-14',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Medium',
    q: 'Three capacitors of capacitance 6 μF each are connected in series. What is their equivalent capacitance?',
    options: ['2 μF', '18 μF', '3 μF', '6 μF'],
    correct: 0,
    explain: 'In series, 1/C_eq = 1/6 + 1/6 + 1/6 = 3/6 = 1/2 => C_eq = 2 μF.'
  },
  {
    id: 'tcat-phy-es-15',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Hard',
    q: 'How much electrostatic energy is stored in a 10 μF capacitor charged to a potential difference of 200 V?',
    options: ['0.2 J', '0.4 J', '2.0 J', '0.02 J'],
    correct: 0,
    explain: 'Energy U = (1/2) C V² = (1/2) * (10 x 10⁻⁶ F) * (200 V)² = 5 x 10⁻⁶ * 40,000 = 0.2 J.'
  },

  // =========================================================
  // Chapter 11: Current Electricity (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-ce-11',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Easy',
    q: 'Kirchhoff’s First Rule (Junction Rule), ΣI = 0, is a manifestation of the conservation of:',
    options: ['Charge', 'Energy', 'Momentum', 'Power'],
    correct: 0,
    explain: 'At any electrical junction, the total current entering equals the total current leaving, ensuring conservation of electric charge.'
  },
  {
    id: 'tcat-phy-ce-12',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Medium',
    q: 'A uniform copper wire of resistance R is stretched uniformly until its length doubles (2L). What is its new resistance?',
    options: ['4 R', '2 R', 'R / 2', 'R / 4'],
    correct: 0,
    explain: 'Volume V = A * L is constant. When L doubles, cross-sectional area A halves (A/2). Resistance R\' = ρ(2L)/(A/2) = 4 (ρL/A) = 4 R.'
  },
  {
    id: 'tcat-phy-ce-13',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Hard',
    q: 'Kirchhoff’s Second Rule (Loop Rule), ΣV = 0, is based on the law of conservation of:',
    options: ['Energy', 'Charge', 'Magnetic flux', 'Electric flux'],
    correct: 0,
    explain: 'The sum of potential differences around any closed circuit loop is zero, representing conservation of electrical potential energy.'
  },
  {
    id: 'tcat-phy-ce-14',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Hard',
    q: 'Under what condition is a Wheatstone bridge circuit in a balanced state?',
    options: ['R1 / R2 = R3 / R4 (galvanometer reads zero current)', 'R1 + R2 = R3 + R4', 'All four resistances must be equal', 'When battery voltage is zero'],
    correct: 0,
    explain: 'A Wheatstone bridge is balanced when R1 / R2 = R3 / R4, resulting in zero potential difference across the galvanometer detector.'
  },
  {
    id: 'tcat-phy-ce-15',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Hard',
    q: 'Under what condition is maximum power transferred from a real DC source of EMF E and internal resistance r to an external load resistor R_L?',
    options: ['R_L = r', 'R_L >> r', 'R_L = 0', 'R_L = 2r'],
    correct: 0,
    explain: 'By the Maximum Power Transfer Theorem, maximum power is delivered to the load when the load resistance equals the internal resistance of the power source (R_L = r).'
  },

  // =========================================================
  // Chapter 12: Electromagnetism (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-em-11',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Easy',
    q: 'What is the magnetic force acting on a stationary electric charge (v = 0) in a strong magnetic field B?',
    options: ['Zero', 'q B', 'q / B', 'Infinite'],
    correct: 0,
    explain: 'The Lorentz magnetic force is F = q (v x B) = q v B sin(θ). If v = 0, F is identically zero.'
  },
  {
    id: 'tcat-phy-em-12',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Easy',
    q: 'What is the SI unit of magnetic flux density (B)?',
    options: ['Tesla (T)', 'Weber (Wb)', 'Henry (H)', 'Ampere per meter'],
    correct: 0,
    explain: 'Magnetic flux density B is measured in Tesla (1 T = 1 Wb/m² = 1 N/(A·m)).'
  },
  {
    id: 'tcat-phy-em-13',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Medium',
    q: 'What is the trajectory of a charged particle entering a uniform magnetic field at an angle of 90° to the field lines?',
    options: ['Circular', 'Helical', 'Straight line', 'Parabolic'],
    correct: 0,
    explain: 'When velocity is perpendicular to the magnetic field, the constant-magnitude perpendicular magnetic force provides the exact centripetal force required for uniform circular motion.'
  },
  {
    id: 'tcat-phy-em-14',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Medium',
    q: 'According to Ampere’s Law, the line integral of magnetic field ∮ B · dl around a closed path is equal to:',
    options: ['μ₀ * I_enclosed', 'I / μ₀', 'ε₀ * I', 'Zero'],
    correct: 0,
    explain: 'Ampere’s circuital law states that ∮ B · dl = μ₀ I_enclosed.'
  },
  {
    id: 'tcat-phy-em-15',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Hard',
    q: 'To convert a sensitive galvanometer of coil resistance R_g into a voltmeter of range V, how should the multiplier resistor R_h be connected?',
    options: ['In series with the coil, with high resistance R_h = (V / I_g) - R_g', 'In parallel with low resistance', 'In series with low resistance', 'In parallel with high resistance'],
    correct: 0,
    explain: 'A voltmeter must draw minimal current, so a large multiplier resistance R_h = (V / I_g) - R_g is connected in series with the galvanometer coil.'
  },

  // =========================================================
  // Chapter 13: Electromagnetic Induction (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-emi-11',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Easy',
    q: 'Faraday’s Law states that the induced EMF in a coil is directly proportional to:',
    options: ['Time rate of change of magnetic flux', 'Magnetic flux itself', 'Current in the coil', 'Resistance of the coil'],
    correct: 0,
    explain: 'Induced EMF ε = -N (dΦ_B / dt), which is directly proportional to the time rate of change of magnetic flux linkage.'
  },
  {
    id: 'tcat-phy-emi-12',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Easy',
    q: 'The minus sign in Faraday’s Law ε = -N(ΔΦ/Δt) is an expression of:',
    options: ['Lenz’s Law (conservation of energy)', 'Ohm’s Law', 'Ampere’s Law', 'Coulomb’s Law'],
    correct: 0,
    explain: 'Lenz’s law states the induced current always opposes the change in flux causing it, which guarantees conservation of energy.'
  },
  {
    id: 'tcat-phy-emi-13',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Medium',
    q: 'What is the motional EMF induced across a straight conductor of length L moving at speed v perpendicular to a uniform magnetic field B?',
    options: ['ε = v B L', 'ε = v B / L', 'ε = B L / v', 'ε = v² B L'],
    correct: 0,
    explain: 'Motional EMF is given by ε = -v B L sin(θ). For perpendicular motion (θ = 90°), magnitude is v B L.'
  },
  {
    id: 'tcat-phy-emi-14',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Medium',
    q: 'In an ideal step-up transformer with turns ratio N_s / N_p = 5, if the input voltage is 220 V, what is the output secondary voltage?',
    options: ['1100 V', '44 V', '220 V', '550 V'],
    correct: 0,
    explain: 'V_s / V_p = N_s / N_p => V_s = V_p * (N_s / N_p) = 220 V * 5 = 1100 V.'
  },
  {
    id: 'tcat-phy-emi-15',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Hard',
    q: 'How much magnetic potential energy is stored in an inductor of self-inductance L = 2 H carrying a steady DC current of 3 A?',
    options: ['9 J', '6 J', '18 J', '4.5 J'],
    correct: 0,
    explain: 'Energy stored in magnetic field of inductor U_B = (1/2) L I² = (1/2) * (2 H) * (3 A)² = 9 J.'
  },

  // =========================================================
  // Chapter 14: Alternating Current (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-ac-11',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Easy',
    q: 'What is the peak-to-peak voltage V_p-p of a sinusoidal AC supply having peak voltage V_0 = 100 V?',
    options: ['200 V', '100 V', '141.4 V', '70.7 V'],
    correct: 0,
    explain: 'Peak-to-peak voltage is the total excursion from positive peak to negative peak: V_p-p = 2 * V_0 = 2 * 100 V = 200 V.'
  },
  {
    id: 'tcat-phy-ac-12',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Medium',
    q: 'Which component is commonly used in power supply filter circuits to block AC ripple while offering minimal resistance to steady DC?',
    options: ['A choke coil (inductor)', 'A step-up transformer', 'A precision potentiometer', 'A shunt ammeter'],
    correct: 0,
    explain: 'An inductor (choke) offers high reactance X_L = 2π f L to high-frequency AC ripple, but negligible resistance to DC (f = 0 Hz).'
  },
  {
    id: 'tcat-phy-ac-13',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Hard',
    q: 'What is the inductive reactance X_L of an inductor of inductance L when connected to an AC source of angular frequency ω?',
    options: ['X_L = ω L', 'X_L = 1 / (ω L)', 'X_L = ω / L', 'X_L = ω² L'],
    correct: 0,
    explain: 'Inductive reactance opposes AC current with magnitude X_L = ω L = 2π f L.'
  },
  {
    id: 'tcat-phy-ac-14',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Hard',
    q: 'At resonance in a series RLC circuit, the total electrical impedance Z of the circuit is:',
    options: ['Minimum and purely resistive (Z = R)', 'Maximum and purely inductive', 'Zero', 'Infinite'],
    correct: 0,
    explain: 'At resonance, inductive reactance cancels capacitive reactance (X_L = X_C), making total impedance Z = sqrt(R² + (X_L - X_C)²) = R (minimum).'
  },
  {
    id: 'tcat-phy-ac-15',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Hard',
    q: 'What is the Quality factor (Q-factor) measuring sharpness of resonance in a series RLC circuit at angular resonance frequency ω₀?',
    options: ['Q = ω₀ L / R', 'Q = R / (ω₀ L)', 'Q = ω₀ R L', 'Q = 1 / (ω₀ R L)'],
    correct: 0,
    explain: 'The Quality factor (Q) of a series resonant circuit is defined as Q = ω₀ L / R = (1 / R) * sqrt(L / C).'
  },

  // =========================================================
  // Chapter 15: Electromagnetic Waves (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-emw-11',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Easy',
    q: 'All electromagnetic waves propagate through vacuum at what constant speed?',
    options: ['3 x 10⁸ m/s', '330 m/s', '3 x 10⁶ m/s', 'Infinite speed'],
    correct: 0,
    explain: 'In a vacuum, all electromagnetic waves travel at the speed of light c ≈ 3 x 10⁸ m/s, irrespective of their frequency.'
  },
  {
    id: 'tcat-phy-emw-12',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Easy',
    q: 'Which region of the electromagnetic spectrum has the shortest wavelength and highest photon energy?',
    options: ['Gamma rays', 'Radio waves', 'Infrared', 'Visible light'],
    correct: 0,
    explain: 'Gamma rays possess the shortest wavelengths (< 10⁻¹² m) and therefore the highest frequencies and photon energies.'
  },
  {
    id: 'tcat-phy-emw-13',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Medium',
    q: 'In a plane electromagnetic wave propagating in free space, the electric field E and magnetic field B are:',
    options: [
      'Perpendicular to each other and perpendicular to the direction of propagation',
      'Parallel to each other and parallel to propagation',
      'Parallel to each other but perpendicular to propagation',
      'Antiparallel to each other'
    ],
    correct: 0,
    explain: 'Electromagnetic waves are transverse: E ⊥ B and both are perpendicular to the propagation vector k (Poynting vector S = E x B / μ₀).'
  },
  {
    id: 'tcat-phy-emw-14',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Medium',
    q: 'What is the speed of light c in terms of permittivity of free space ε₀ and permeability of free space μ₀?',
    options: ['c = 1 / sqrt(μ₀ ε₀)', 'c = sqrt(μ₀ ε₀)', 'c = μ₀ / ε₀', 'c = 1 / (μ₀ ε₀)'],
    correct: 0,
    explain: 'Maxwell’s equations demonstrated that electromagnetic wave speed in vacuum is c = 1 / sqrt(μ₀ ε₀).'
  },
  {
    id: 'tcat-phy-emw-15',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Hard',
    q: 'An electromagnetic wave has a frequency of 100 MHz. What is its wavelength in free space?',
    options: ['3.0 m', '0.3 m', '30 m', '300 m'],
    correct: 0,
    explain: 'λ = c / f = (3 x 10⁸ m/s) / (100 x 10⁶ Hz) = 3.0 m.'
  },

  // =========================================================
  // Chapter 16: Physics of Solids (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-pos-11',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Easy',
    q: 'Hooke’s Law is valid for a deformed material up to its:',
    options: ['Proportional limit', 'Ultimate tensile strength', 'Fracture point', 'Yield point'],
    correct: 0,
    explain: 'Stress is directly proportional to strain strictly up to the proportional limit on the stress-strain curve.'
  },
  {
    id: 'tcat-phy-pos-12',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Easy',
    q: 'What are the SI units of Young’s Modulus of elasticity?',
    options: ['N/m² (or Pascal)', 'N·m', 'Dimensionless', 'N/m'],
    correct: 0,
    explain: 'Young’s modulus Y = Stress / Strain. Since strain is dimensionless, Y has units of stress: N/m² or Pa.'
  },
  {
    id: 'tcat-phy-pos-13',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Medium',
    q: 'Materials that undergo significant permanent plastic deformation before fracture are termed:',
    options: ['Ductile materials', 'Brittle materials', 'Polymers', 'Amorphous materials'],
    correct: 0,
    explain: 'Ductile materials (such as copper and aluminum) experience large plastic strains before fracturing, allowing them to be drawn into wires.'
  },
  {
    id: 'tcat-phy-pos-14',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Medium',
    q: 'In crystalline solids, ferromagnetic materials lose their permanent magnetism and become paramagnetic above the:',
    options: ['Curie temperature', 'Debye temperature', 'Critical temperature', 'Absolute zero'],
    correct: 0,
    explain: 'The Curie temperature T_c is the threshold above which thermal agitation destroys ferromagnetic domain alignment, converting it to paramagnetism.'
  },
  {
    id: 'tcat-phy-pos-15',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Hard',
    q: 'According to energy band theory, an electrical insulator has:',
    options: ['A full valence band, an empty conduction band, and a wide forbidden energy gap (> 3 eV)', 'An overlapping conduction and valence band', 'A narrow band gap (< 1 eV)', 'A partially filled conduction band'],
    correct: 0,
    explain: 'Insulators feature a completely filled valence band, an empty conduction band, and a wide forbidden gap (> 3 to 6 eV) that thermal energy cannot overcome.'
  },

  // =========================================================
  // Chapter 17: Electronics (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-el-11',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Easy',
    q: 'In an intrinsic semiconductor at room temperature, electrical conduction is carried by:',
    options: ['Both free electrons and holes in equal numbers', 'Only free electrons', 'Only positive ions', 'Only holes'],
    correct: 0,
    explain: 'Thermal excitation generates electron-hole pairs in equal quantities, both contributing to electric conduction in pure intrinsic semiconductors.'
  },
  {
    id: 'tcat-phy-el-12',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Easy',
    q: 'A p-type semiconductor is obtained by doping pure silicon with which type of impurity atom?',
    options: ['Trivalent impurity (such as Indium, Boron, or Gallium)', 'Pentavalent impurity (such as Phosphorus)', 'Hexavalent impurity', 'Noble gas'],
    correct: 0,
    explain: 'Doping group IV elements with trivalent atoms creates a deficiency of bonding electrons (holes), creating a p-type semiconductor.'
  },
  {
    id: 'tcat-phy-el-13',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Medium',
    q: 'What is the potential barrier across a silicon p-n junction at room temperature under zero bias?',
    options: ['0.7 V', '0.3 V', '1.1 V', '0.1 V'],
    correct: 0,
    explain: 'The internal diffusion potential barrier of a silicon p-n diode is approximately 0.7 V (compared to 0.3 V for germanium).'
  },
  {
    id: 'tcat-phy-el-14',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Medium',
    q: 'In a bipolar junction transistor (BJT) configured as an amplifier, the base-emitter junction and base-collector junction must be biased respectively as:',
    options: ['Forward biased and reverse biased', 'Both forward biased', 'Both reverse biased', 'Reverse biased and forward biased'],
    correct: 0,
    explain: 'For active region amplification in a BJT, the input base-emitter junction must be forward biased and the output collector-base junction reverse biased.'
  },
  {
    id: 'tcat-phy-el-15',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Hard',
    q: 'What is the closed-loop voltage gain of an ideal operational amplifier in an inverting configuration with input resistor R_in = 10 kΩ and feedback resistor R_f = 100 kΩ?',
    options: ['-10', '10', '-11', '11'],
    correct: 0,
    explain: 'Inverting amplifier gain A_v = -R_f / R_in = -100 kΩ / 10 kΩ = -10.'
  },

  // =========================================================
  // Chapter 18: Dawn of Modern Physics (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-dmp-11',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Easy',
    q: 'According to Einstein’s photoelectric equation, the kinetic energy of emitted photoelectrons depends solely on:',
    options: ['Frequency of the incident light', 'Intensity of the incident light', 'Surface area of the metal', 'Duration of illumination'],
    correct: 0,
    explain: 'KE_max = h f - Φ. The kinetic energy of emitted photoelectrons depends directly on the frequency f of the incident photons, not the intensity.'
  },
  {
    id: 'tcat-phy-dmp-12',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Medium',
    q: 'What is the de Broglie wavelength λ associated with a particle of mass m moving with momentum p?',
    options: ['λ = h / p', 'λ = p / h', 'λ = h * p', 'λ = h / (2p)'],
    correct: 0,
    explain: 'De Broglie proposed wave-particle duality where wavelength λ = h / p = h / (m v).'
  },
  {
    id: 'tcat-phy-dmp-13',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Hard',
    q: 'In the Compton scattering effect, when an X-ray photon is scattered by a stationary electron at 90°, the Compton shift Δλ is equal to:',
    options: ['h / (m_e c) ≈ 2.43 x 10⁻¹² m', '2 h / (m_e c)', 'Zero', 'h / (2 m_e c)'],
    correct: 0,
    explain: 'Δλ = (h / m_e c)(1 - cos(θ)). For θ = 90°, cos(90°) = 0, so Δλ = h / (m_e c) = 2.426 x 10⁻¹² m (the Compton wavelength).'
  },
  {
    id: 'tcat-phy-dmp-14',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Hard',
    q: 'What is the minimum photon energy required to produce an electron-positron pair via pair production?',
    options: ['1.02 MeV', '0.51 MeV', '2.04 MeV', '13.6 eV'],
    correct: 0,
    explain: 'Rest mass of an electron or positron is 0.511 MeV. Pair production creates two such particles: 2 * 0.511 MeV = 1.02 MeV.'
  },
  {
    id: 'tcat-phy-dmp-15',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Hard',
    q: 'According to Heisenberg’s Uncertainty Principle, the product of uncertainties in position (Δx) and momentum (Δp) satisfies:',
    options: ['Δx · Δp >= h / (4π)', 'Δx · Δp = 0', 'Δx · Δp <= h / (2π)', 'Δx · Δp = h'],
    correct: 0,
    explain: 'Heisenberg’s uncertainty principle establishes that Δx · Δp >= ℏ / 2 = h / (4π).'
  },

  // =========================================================
  // Chapter 19: Atomic Spectra (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-as-11',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Easy',
    q: 'Which spectral series of the hydrogen atom lies entirely within the visible region of the electromagnetic spectrum?',
    options: ['Balmer series', 'Lyman series', 'Paschen series', 'Brackett series'],
    correct: 0,
    explain: 'Transitions ending on n = 2 form the Balmer series, which emits in the visible spectral region.'
  },
  {
    id: 'tcat-phy-as-12',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Easy',
    q: 'According to Bohr’s postulate, an electron can only orbit in stationary states where its orbital angular momentum L is an integral multiple of:',
    options: ['h / (2π)', 'h / π', '2π / h', 'h / 4π'],
    correct: 0,
    explain: 'Bohr’s quantization condition states L = m v r = n * (h / 2π), where n = 1, 2, 3...'
  },
  {
    id: 'tcat-phy-as-13',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Medium',
    q: 'What is the ground state ionization energy of the hydrogen atom?',
    options: ['13.6 eV', '3.4 eV', '1.51 eV', '0 eV'],
    correct: 0,
    explain: 'The ground state energy of hydrogen is E1 = -13.6 eV. Removing the electron to infinity (E = 0) requires exactly +13.6 eV.'
  },
  {
    id: 'tcat-phy-as-14',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Medium',
    q: 'Characteristic X-rays are emitted when:',
    options: [
      'An outer shell atomic electron falls into a vacancy in an inner shell',
      'Electrons undergo rapid deceleration near the atomic nucleus',
      'Nuclear fission takes place',
      'Electrons are absorbed by protons'
    ],
    correct: 0,
    explain: 'When high-energy incident electrons eject an inner-shell electron (like K-shell), an outer electron drops into the vacancy, emitting a discrete characteristic X-ray photon.'
  },
  {
    id: 'tcat-phy-as-15',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Hard',
    q: 'In a laser system, achieving a condition where there are more atoms in the excited metastable state than in the ground state is known as:',
    options: ['Population inversion', 'Optical pumping', 'Spontaneous emission', 'Stimulated absorption'],
    correct: 0,
    explain: 'Population inversion is the non-equilibrium condition essential for laser action where excited state population exceeds ground state population.'
  },

  // =========================================================
  // Chapter 20: Nuclear Physics (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-np-11',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Easy',
    q: 'What is the charge of a beta-minus (β⁻) particle emitted during nuclear radioactive decay?',
    options: ['-1.6 x 10⁻¹⁹ C (charge of an electron)', '+1.6 x 10⁻¹⁹ C', 'Zero', '+3.2 x 10⁻¹⁹ C'],
    correct: 0,
    explain: 'A beta-minus particle is a high-speed electron emitted from the nucleus with charge -e = -1.6 x 10⁻¹⁹ C.'
  },
  {
    id: 'tcat-phy-np-12',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Easy',
    q: 'The mass number A of a nucleus represents the total count of:',
    options: ['Protons and neutrons (nucleons)', 'Only protons', 'Only neutrons', 'Protons and orbital electrons'],
    correct: 0,
    explain: 'Mass number A = Z + N, representing the total number of nucleons (protons plus neutrons) in the nucleus.'
  },
  {
    id: 'tcat-phy-np-13',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Medium',
    q: 'What is the relationship between the half-life T_(1/2) of a radioactive isotope and its decay constant λ?',
    options: ['T_(1/2) = 0.693 / λ', 'T_(1/2) = λ / 0.693', 'T_(1/2) = 0.693 * λ', 'T_(1/2) = 1 / λ'],
    correct: 0,
    explain: 'Half-life T_(1/2) = ln(2) / λ ≈ 0.693 / λ.'
  },
  {
    id: 'tcat-phy-np-14',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Medium',
    q: 'During an alpha (α) decay process, how do the mass number A and atomic number Z of the parent nucleus change?',
    options: ['A decreases by 4, Z decreases by 2', 'A decreases by 2, Z decreases by 4', 'A unchanged, Z increases by 1', 'A decreases by 1, Z unchanged'],
    correct: 0,
    explain: 'An alpha particle is a helium nucleus (⁴₂He). Thus, the daughter nucleus has A - 4 and Z - 2.'
  },
  {
    id: 'tcat-phy-np-15',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Hard',
    q: 'One unified atomic mass unit (1 u) is equivalent to how much rest mass energy according to E = mc²?',
    options: ['931.5 MeV', '938 MeV', '0.511 MeV', '1.02 MeV'],
    correct: 0,
    explain: '1 u = 1.6605 x 10⁻²⁷ kg. By Einstein’s mass-energy equivalence, 1 u = 931.5 MeV of energy.'
  }
];

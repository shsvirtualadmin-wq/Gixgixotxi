import { Question } from '../types';

export const MDCAT_PHYSICS_BATCH9: Question[] = [
  // --- Measurements (3 MCQs: 1 to 3) ---
  {
    id: 'mdcat-b9-phy-1',
    q: 'What are the base SI dimensional formula representations for the universal gravitational constant G, derived from Newton\'s Law of Universal Gravitation F = G m1 m2 / r²?',
    options: [
      '[M⁻¹ L³ T⁻²]',
      '[M¹ L³ T⁻²]',
      '[M⁻¹ L² T⁻¹]',
      '[M⁰ L² T⁻²]'
    ],
    correct: 0,
    topic: 'Dimensions - Dimensional Analysis of Universal Gravitational Constant G',
    chapter: 'Measurements',
    explain: 'From F = G m1 m2 / r², G = F r² / (m1 m2). Dimensions of force F = [M L T⁻²], distance r = [L], and mass m = [M]. Thus [G] = [M L T⁻²][L²] / [M²] = [M⁻¹ L³ T⁻²].',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-2',
    q: 'A physical quantity X is given by X = A² B / √C. If the percentage errors in the measurement of A, B, and C are 1.0%, 2.0%, and 4.0% respectively, what is the maximum percentage uncertainty in X?',
    options: [
      '6.0%',
      '4.0%',
      '8.0%',
      '3.0%'
    ],
    correct: 0,
    topic: 'Errors and Uncertainties - Fractional and Percentage Error Propagation',
    chapter: 'Measurements',
    explain: 'For X = A² B C^(-1/2), fractional uncertainty is ΔX/X = 2(ΔA/A) + 1(ΔB/B) + (1/2)(ΔC/C). Percentage error = 2(1.0%) + 1(2.0%) + (1/2)(4.0%) = 2.0% + 2.0% + 2.0% = 6.0%.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-3',
    q: 'Which of the following units is a supplementary SI unit used to measure plane angles in two dimensions?',
    options: [
      'Radian (rad)',
      'Steradian (sr)',
      'Degree',
      'Candela (cd)'
    ],
    correct: 0,
    topic: 'SI Units - Supplementary Units (Radian and Steradian)',
    chapter: 'Measurements',
    explain: 'Radian (rad) is the supplementary SI unit for plane angles (θ = arc length s / radius r, dimensionless). Steradian (sr) is the supplementary SI unit for solid angles. Candela is a base unit for luminous intensity.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Scalars and Vectors (3 MCQs: 4 to 6) ---
  {
    id: 'mdcat-b9-phy-4',
    q: 'Two vectors A and B have magnitudes of 6 units and 8 units, respectively. If the magnitude of their vector cross product |A × B| is equal to 24 units, what is the scalar dot product A · B?',
    options: [
      '24√3 units (approx 41.57 units)',
      '24 units',
      '48 units',
      '12 units'
    ],
    correct: 0,
    topic: 'Vectors - Cross Product vs Dot Product Relationships',
    chapter: 'Scalars and Vectors',
    explain: '|A × B| = A B sin θ = (6)(8) sin θ = 48 sin θ = 24 → sin θ = 0.5 → θ = 30°. The scalar dot product is A · B = A B cos θ = (6)(8) cos 30° = 48 × (√3/2) = 24√3 units.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-5',
    q: 'Under what physical condition is the vector sum (A + B) perpendicular to the vector difference (A - B)?',
    options: [
      'When the magnitudes of vectors A and B are equal (|A| = |B|)',
      'When vector A is parallel to vector B',
      'When vector A is perpendicular to vector B',
      'When the dot product A · B is negative'
    ],
    correct: 0,
    topic: 'Vectors - Orthogonality of Vector Sum and Difference',
    chapter: 'Scalars and Vectors',
    explain: 'Two vectors are perpendicular if their dot product is zero: (A + B) · (A - B) = 0 → A · A - A · B + B · A - B · B = 0 → |A|² - |B|² = 0 → |A| = |B|. Thus, the sum and difference are perpendicular if and only if both vectors have equal magnitudes (forming diagonals of a rhombus).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-6',
    q: 'For a body to be in complete mechanical equilibrium, which two mathematical conditions must be simultaneously satisfied?',
    options: [
      'ΣF = 0 (first condition, translational equilibrium) and Στ = 0 (second condition, rotational equilibrium)',
      'ΣF = 0 and linear velocity must be zero',
      'Στ = 0 and angular acceleration must equal 9.8 m/s²',
      'Kinetic energy and potential energy must be equal'
    ],
    correct: 0,
    topic: 'Equilibrium - First and Second Conditions of Equilibrium',
    chapter: 'Scalars and Vectors',
    explain: 'Complete mechanical equilibrium requires: (1) First condition: vector sum of all external forces must be zero (ΣF = 0, no linear acceleration); (2) Second condition: vector sum of all external torques about any axis must be zero (Στ = 0, no angular acceleration).',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Force and Motion (3 MCQs: 7 to 9) ---
  {
    id: 'mdcat-b9-phy-7',
    q: 'A projectile is launched from ground level with initial velocity v0 at an elevation angle θ to the horizontal. If air resistance is neglected, at what projection angle is the maximum horizontal range (R) achieved?',
    options: [
      '45°',
      '30°',
      '60°',
      '90°'
    ],
    correct: 0,
    topic: 'Projectile Motion - Maximum Horizontal Range',
    chapter: 'Force and Motion',
    explain: 'The horizontal range is given by R = (v0² sin 2θ) / g. Range is maximum when sin 2θ = 1, which occurs at 2θ = 90° → θ = 45°.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-8',
    q: 'A 0.5 kg ball moving horizontally at 20 m/s strikes a rigid vertical brick wall elastically and rebounds in the opposite direction at 20 m/s. If the collision contact time is 0.02 seconds, what average force did the wall exert on the ball?',
    options: [
      '1000 N',
      '500 N',
      '200 N',
      '0 N'
    ],
    correct: 0,
    topic: 'Momentum and Impulse - Force Exerted in Elastic Rebound',
    chapter: 'Force and Motion',
    explain: 'Initial momentum p_i = m v = (0.5 kg)(+20 m/s) = +10 kg m/s. Final momentum p_f = (0.5 kg)(-20 m/s) = -10 kg m/s. Change in momentum Δp = p_f - p_i = -10 - 10 = -20 kg m/s. Average force F = |Δp| / Δt = 20 / 0.02 = 1000 N.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-9',
    q: 'In a completely inelastic one-dimensional collision between two isolated colliding bodies, which physical quantity is conserved, and what happens to kinetic energy?',
    options: [
      'Total linear momentum is strictly conserved, while kinetic energy is not conserved (maximum kinetic energy is converted to internal energy/heat)',
      'Both total linear momentum and total kinetic energy are strictly conserved',
      'Total kinetic energy is conserved, while momentum decreases',
      'Neither momentum nor energy is conserved'
    ],
    correct: 0,
    topic: 'Collisions - Conservation Laws in Completely Inelastic Collisions',
    chapter: 'Force and Motion',
    explain: 'In all isolated collisions (no external net force), total linear momentum is strictly conserved. In an inelastic collision, mechanical kinetic energy is transformed into thermal energy, sound, and plastic deformation (bodies stick together, maximizing kinetic energy loss).',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Work, Energy and Power (3 MCQs: 10 to 12) ---
  {
    id: 'mdcat-b9-phy-10',
    q: 'According to the Work-Energy Theorem, the net work done by all acting forces on a particle of mass m is always equal to:',
    options: [
      'The change in kinetic energy of the particle (ΔKE = KE_f - KE_i)',
      'The change in gravitational potential energy only',
      'The total mechanical power multiplied by velocity',
      'The rate of change of linear momentum'
    ],
    correct: 0,
    topic: 'Work and Energy - Work-Energy Theorem Principle',
    chapter: 'Work, Energy and Power',
    explain: 'The Work-Energy Theorem states that the net work done by all forces (conservative and non-conservative) on a body equals the change in its translational kinetic energy: W_net = ΔK = (1/2) m v_f² - (1/2) m v_i².',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-11',
    q: 'An electric water pump with an efficiency of 80% lifts 360 kg of water to a vertical height of 10 meters in 60 seconds. What is the electrical power input required by the motor? (g = 10 m/s²)',
    options: [
      '750 W',
      '600 W',
      '480 W',
      '1000 W'
    ],
    correct: 0,
    topic: 'Work and Power - Mechanical Work, Power, and Efficiency Calculation',
    chapter: 'Work, Energy and Power',
    explain: 'Work output W_out = m g h = (360 kg)(10 m/s²)(10 m) = 36,000 J. Useful power output P_out = W_out / t = 36,000 J / 60 s = 600 W. Efficiency η = P_out / P_in → P_in = P_out / η = 600 W / 0.80 = 750 W.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-12',
    q: 'Which of the following forces is non-conservative, meaning the work done by the force on a particle moving between two points depends on the path taken?',
    options: [
      'Kinetic frictional force',
      'Gravitational force',
      'Electrostatic Coulomb force',
      'Ideal Hookean spring restorative force'
    ],
    correct: 0,
    topic: 'Conservative and Non-Conservative Forces',
    chapter: 'Work, Energy and Power',
    explain: 'A force is conservative if work done around any closed loop is zero (path-independent). Gravity, electrostatic force, and elastic spring forces are conservative. Friction and drag are dissipative (non-conservative): work done depends on path length and is converted irreversibly to heat.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Rotational and Circular Motion (3 MCQs: 13 to 15) ---
  {
    id: 'mdcat-b9-phy-13',
    q: 'A stone attached to a string of length r is whirled in a vertical circle. What is the minimum critical speed (v_critical) required at the highest point of the circle to maintain circular motion without the string going slack? (g = acceleration due to gravity)',
    options: [
      'v = √(g r)',
      'v = √(2 g r)',
      'v = √(5 g r)',
      'v = g r'
    ],
    correct: 0,
    topic: 'Circular Motion - Critical Speed in Vertical Circle',
    chapter: 'Rotational and Circular Motion',
    explain: 'At the apex of the vertical circle, both tension T and gravity act downward: T + m g = m v² / r. The string will not go slack if tension T ≥ 0. Setting T = 0 gives m g = m v_critical² / r → v_critical = √(g r).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-14',
    q: 'What is the orbital period T of a geostationary communications satellite revolving around the Earth in an equatorial orbit?',
    options: [
      '24 hours (1 sidereal day)',
      '12 hours',
      '90 minutes',
      '365 days'
    ],
    correct: 0,
    topic: 'Gravitation - Geostationary Satellites and Orbital Period',
    chapter: 'Rotational and Circular Motion',
    explain: 'A geostationary satellite appears stationary relative to a fixed point on Earth\'s equator because its orbital period matches Earth\'s rotational period (24 hours) and it orbits eastward at an altitude of approximately 35,786 km.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-15',
    q: 'A uniform solid cylinder of mass M and radius R rolls without slipping down an inclined plane of height h. What is its linear speed at the bottom of the incline? (Moment of inertia of solid cylinder I = 1/2 M R²)',
    options: [
      'v = √[(4/3) g h]',
      'v = √(2 g h)',
      'v = √[(3/4) g h]',
      'v = √[(1/2) g h]'
    ],
    correct: 0,
    topic: 'Rotational Dynamics - Rolling Without Slipping on an Incline',
    chapter: 'Rotational and Circular Motion',
    explain: 'Conservation of mechanical energy: M g h = KE_trans + KE_rot = (1/2) M v² + (1/2) I ω². Since rolling without slipping means ω = v/R and I = 1/2 M R²: M g h = (1/2) M v² + (1/2)(1/2 M R²)(v/R)² = (1/2 + 1/4) M v² = (3/4) M v². Thus v = √[(4/3) g h].',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Fluid Dynamics (3 MCQs: 16 to 18) ---
  {
    id: 'mdcat-b9-phy-16',
    q: 'According to Bernoulli\'s equation: P + (1/2) ρ v² + ρ g h = constant, what happens to the static pressure of a fluid flowing horizontally through a constriction (narrow pipe section) where its velocity increases?',
    options: [
      'Static pressure decreases (Venturi effect)',
      'Static pressure increases proportionally',
      'Static pressure remains unchanged',
      'Static pressure drops to absolute zero'
    ],
    correct: 0,
    topic: 'Fluid Dynamics - Bernoulli\'s Theorem and Venturi Effect',
    chapter: 'Fluid Dynamics',
    explain: 'For horizontal flow (h is constant), P + (1/2) ρ v² = constant. When fluid enters a constriction, continuity requires velocity v to increase, raising dynamic pressure (1/2) ρ v². Consequently, static pressure P must decrease to maintain a constant sum.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-17',
    q: 'According to Stokes\' Law, what is the viscous retarding drag force (F) acting on a small sphere of radius r moving with terminal velocity v through a fluid of dynamic viscosity η?',
    options: [
      'F = 6 π η r v',
      'F = 4 π η r² v',
      'F = (4/3) π r³ ρ g',
      'F = 6 π η r / v'
    ],
    correct: 0,
    topic: 'Fluid Dynamics - Stokes\' Law and Viscous Drag',
    chapter: 'Fluid Dynamics',
    explain: 'Stokes\' Law states that the viscous retarding drag force opposing a spherical particle moving at low Reynolds numbers through a laminar viscous fluid is given by F = 6 π η r v.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-18',
    q: 'Water flows through a horizontal pipe of non-uniform cross-section. If the diameter of the pipe decreases from 4 cm at Section 1 to 2 cm at Section 2, what is the ratio of flow speed v2 to v1?',
    options: [
      '4 : 1',
      '2 : 1',
      '16 : 1',
      '1 : 4'
    ],
    correct: 0,
    topic: 'Fluid Dynamics - Equation of Continuity and Velocity Ratio',
    chapter: 'Fluid Dynamics',
    explain: 'By the equation of continuity: A1 v1 = A2 v2 → v2/v1 = A1/A2 = (π d1² / 4) / (π d2² / 4) = (d1/d2)² = (4/2)² = 2² = 4. Speed quadruples when pipe diameter is halved.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Oscillations (3 MCQs: 19 to 21) ---
  {
    id: 'mdcat-b9-phy-19',
    q: 'For a simple pendulum executing small-amplitude simple harmonic motion (SHM), what happens to its time period T if its length L is quadrupled and the mass of the bob m is doubled?',
    options: [
      'The time period doubles (increases by a factor of 2)',
      'The time period quadruples',
      'The time period increases by a factor of 2√2',
      'The time period remains unchanged'
    ],
    correct: 0,
    topic: 'Oscillations - Time Period of Simple Pendulum',
    chapter: 'Oscillations',
    explain: 'The period of a simple pendulum is T = 2π √(L/g). The period is completely independent of the bob\'s mass m. When length L is quadrupled (4L), T\' = 2π √(4L/g) = 2 × [2π √(L/g)] = 2T.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-20',
    q: 'In simple harmonic motion (SHM) of amplitude A, at what displacement x from the mean position are the kinetic energy (KE) and potential energy (PE) of the oscillator exactly equal?',
    options: [
      'x = A / √2',
      'x = A / 2',
      'x = A / 4',
      'x = A / √3'
    ],
    correct: 0,
    topic: 'SHM - Energy Equipartition Displacement',
    chapter: 'Oscillations',
    explain: 'Total energy E = (1/2) k A². PE = (1/2) k x². When PE = (1/2) E: (1/2) k x² = (1/2) [(1/2) k A²] → x² = A² / 2 → x = A / √2 ≈ 0.707 A.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-21',
    q: 'Resonance in a driven mechanical oscillator occurs when:',
    options: [
      'The frequency of the external periodic driving force matches the natural unforced frequency of the system, maximizing oscillation amplitude',
      'Damping friction is maximized to critical damping',
      'Potential energy drops to zero at all positions',
      'The phase difference between driving force and displacement becomes zero degrees'
    ],
    correct: 0,
    topic: 'Oscillations - Mechanical Resonance Phenomenon',
    chapter: 'Oscillations',
    explain: 'Resonance is the condition where an external periodic driving frequency equals the natural resonant frequency of the system. Energy transfer from the driver to the oscillator is optimal, driving the amplitude of oscillation to its theoretical maximum (limited only by damping).',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Waves (3 MCQs: 22 to 24) ---
  {
    id: 'mdcat-b9-phy-22',
    q: 'According to the Doppler effect for sound, what happens to the observed frequency when a sound source emitting frequency f moves directly toward a stationary listener at speed u_s? (Speed of sound = v)',
    options: [
      'f\' = f [v / (v - u_s)], so observed frequency increases',
      'f\' = f [v / (v + u_s)], so observed frequency decreases',
      'f\' = f [(v + u_s) / v], so observed frequency increases',
      'f\' = f [v / u_s]'
    ],
    correct: 0,
    topic: 'Doppler Effect - Moving Source Approaching Stationary Listener',
    chapter: 'Waves',
    explain: 'When the source moves toward a stationary observer, wave crests are compressed into a shorter apparent wavelength λ\' = (v - u_s)/f. The observed frequency f\' = v / λ\' = f [v / (v - u_s)], which is higher than the emitted frequency.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-23',
    q: 'In a standing (stationary) wave formed by two interfering identical counter-propagating waves, what is the spatial separation between two adjacent nodes?',
    options: [
      'λ / 2',
      'λ',
      'λ / 4',
      '2 λ'
    ],
    correct: 0,
    topic: 'Stationary Waves - Distance Between Nodes and Antinodes',
    chapter: 'Waves',
    explain: 'In a standing wave: the distance between two consecutive nodes (points of zero amplitude) is λ/2; the distance between two consecutive antinodes is λ/2; and the distance between an adjacent node and antinode is λ/4.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-24',
    q: 'A sound wave travels from air into water. What happens to its frequency, wavelength, and speed?',
    options: [
      'Frequency remains constant; speed and wavelength both increase',
      'Speed decreases; frequency decreases; wavelength remains constant',
      'Frequency increases; speed increases; wavelength remains constant',
      'All three quantities remain unchanged'
    ],
    correct: 0,
    topic: 'Sound Waves - Refraction and Wave Properties Across Media',
    chapter: 'Waves',
    explain: 'Frequency is determined exclusively by the vibrating source and remains unchanged across media. Water is much less compressible (higher bulk modulus) than air, so sound speed increases (~1480 m/s vs ~340 m/s). Because v = f λ and f is constant, wavelength λ must increase proportionally.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Thermodynamics (3 MCQs: 25 to 27) ---
  {
    id: 'mdcat-b9-phy-25',
    q: 'What is the maximum theoretical efficiency of a Carnot heat engine operating between an absolute hot reservoir at 500 K and an absolute cold reservoir at 300 K?',
    options: [
      '40% (0.40)',
      '60% (0.60)',
      '66.7%',
      '20%'
    ],
    correct: 0,
    topic: 'Thermodynamics - Carnot Engine Maximum Efficiency',
    chapter: 'Thermodynamics',
    explain: 'Carnot efficiency η = 1 - (T_cold / T_hot) = 1 - (300 K / 500 K) = 1 - 0.60 = 0.40 or 40%.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-26',
    q: 'In an adiabatic expansion of an ideal gas, no heat enters or leaves the system (Q = 0). According to the First Law of Thermodynamics (ΔU = Q - W), what happens to the internal energy and temperature of the gas?',
    options: [
      'Internal energy decreases (ΔU = -W < 0) and temperature drops (cooling effect)',
      'Internal energy increases and temperature rises',
      'Internal energy remains constant because Q = 0',
      'Work done is zero and temperature remains constant'
    ],
    correct: 0,
    topic: 'Thermodynamics - Adiabatic Expansion and First Law',
    chapter: 'Thermodynamics',
    explain: 'During adiabatic expansion, Q = 0. Work done by the expanding gas is positive (W > 0). By the First Law, ΔU = -W. Because work is done at the expense of internal energy, U decreases. Since internal energy of an ideal gas is directly proportional to temperature (U ∝ T), the gas cools.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-27',
    q: 'Molar heat capacity at constant pressure (Cp) of an ideal gas is always greater than molar heat capacity at constant volume (Cv) because:',
    options: [
      'At constant pressure, added heat must both increase internal energy (raise temperature) and perform external expansion work (P ΔV = R)',
      'Molecular mass increases when heated at constant pressure',
      'The gas condenses into a liquid at constant volume',
      'Gravitational potential energy of the gas molecules increases'
    ],
    correct: 0,
    topic: 'Thermodynamics - Mayer\'s Relation (Cp - Cv = R)',
    chapter: 'Thermodynamics',
    explain: 'At constant volume, all added heat raises internal energy (Q_v = ΔU = Cv ΔT). At constant pressure, the gas expands against atmospheric pressure, performing boundary work P ΔV = R ΔT. Thus Q_p = ΔU + W = Cv ΔT + R ΔT = (Cv + R) ΔT. Hence Cp - Cv = R.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electrostatics (4 MCQs: 28 to 31) ---
  {
    id: 'mdcat-b9-phy-28',
    q: 'According to Gauss\'s Law in electrostatics, the total electric flux Φ_E passing through any closed Gaussian surface enclosing a net charge Q_enc in free space is:',
    options: [
      'Φ_E = Q_enc / ε0',
      'Φ_E = Q_enc × ε0',
      'Φ_E = 4 π k Q_enc²',
      'Φ_E = 0 regardless of enclosed charge'
    ],
    correct: 0,
    topic: 'Electrostatics - Gauss\'s Law and Electric Flux',
    chapter: 'Electrostatics',
    explain: 'Gauss\'s Law states that the net outward electric flux through any closed Gaussian surface equals the net charge enclosed divided by the permittivity of free space: ∮ E · dA = Q_enc / ε0.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-29',
    q: 'A parallel plate capacitor with capacitance C0 has its plates disconnected from a battery (charge Q remains constant). If a dielectric slab of dielectric constant κ = 4 is inserted between the plates, how do capacitance C, voltage V, and stored energy U change?',
    options: [
      'Capacitance increases to 4 C0; voltage decreases to V0 / 4; stored energy decreases to U0 / 4',
      'Capacitance decreases to C0 / 4; voltage increases to 4 V0; stored energy increases to 4 U0',
      'Capacitance increases to 4 C0; voltage remains V0; stored energy increases to 4 U0',
      'Capacitance remains C0; voltage decreases; energy remains unchanged'
    ],
    correct: 0,
    topic: 'Capacitance - Effect of Dielectric on Disconnected Capacitor',
    chapter: 'Electrostatics',
    explain: 'With no battery connected, charge Q is conserved. Capacitance becomes C = κ C0 = 4 C0. Voltage V = Q / C = Q / (4 C0) = V0 / 4. Stored electrostatic energy U = Q² / (2 C) = Q² / [2(4 C0)] = U0 / 4.',
    difficulty: 'Hard',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-30',
    q: 'What is the electric field strength E inside the interior cavity of an isolated charged spherical conducting shell in electrostatic equilibrium?',
    options: [
      'E = 0 at all interior points (electrostatic shielding)',
      'E = k Q / r²',
      'E = k Q / R (constant non-zero value)',
      'E increases linearly from center to surface'
    ],
    correct: 0,
    topic: 'Electrostatics - Electric Field Inside a Hollow Conductor',
    chapter: 'Electrostatics',
    explain: 'By Gauss\'s Law, drawing a Gaussian surface inside the conductor cavity encloses zero net charge (all excess charge resides on the outer surface). Thus, ∮ E · dA = 0 → E = 0 everywhere inside the shell. Consequently, the electric potential V is uniform throughout the interior.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-31',
    q: 'Two point charges +4 μC and +1 μC are placed 30 cm apart along a line in vacuum. At what distance from the +4 μC charge along the connecting line is the net electric field zero?',
    options: [
      '20 cm',
      '10 cm',
      '15 cm',
      '25 cm'
    ],
    correct: 0,
    topic: 'Electrostatics - Neutral Point Between Two Like Point Charges',
    chapter: 'Electrostatics',
    explain: 'Let x be distance from +4 μC charge. At the neutral point: E1 = E2 → k (4 μC) / x² = k (1 μC) / (30 - x)². Taking square roots: 2 / x = 1 / (30 - x) → 2(30 - x) = x → 60 - 2x = x → 3x = 60 → x = 20 cm.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Current Electricity (4 MCQs: 32 to 35) ---
  {
    id: 'mdcat-b9-phy-32',
    q: 'Kirchhoff\'s First Rule (Junction Rule, ΣI = 0) and Second Rule (Loop Rule, ΣΔV = 0) are respective physical manifestations of which fundamental conservation laws?',
    options: [
      'Junction rule represents Conservation of Charge; Loop rule represents Conservation of Energy',
      'Junction rule represents Conservation of Energy; Loop rule represents Conservation of Momentum',
      'Both rules represent Conservation of Charge',
      'Both rules represent Conservation of Energy'
    ],
    correct: 0,
    topic: 'Circuit Theory - Kirchhoff\'s Laws and Conservation Principles',
    chapter: 'Current Electricity',
    explain: 'Kirchhoff\'s Current Law (Junction Rule) asserts that charge cannot accumulate at a junction, expressing Conservation of Electric Charge. Kirchhoff\'s Voltage Law (Loop Rule) asserts that the net change in electrostatic potential around any closed circuit loop is zero, expressing Conservation of Energy.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-33',
    q: 'A uniform metallic wire of resistance R is stretched uniformly such that its length doubles (L\' = 2L) while keeping its mass and density constant. What is the new electrical resistance R\' of the stretched wire?',
    options: [
      '4 R',
      '2 R',
      'R / 2',
      'R / 4'
    ],
    correct: 0,
    topic: 'Current Electricity - Resistance of Stretched Wire',
    chapter: 'Current Electricity',
    explain: 'Volume is conserved: V = A L = A\' L\'. Since L\' = 2L, cross-sectional area must halve: A\' = A/2. New resistance R\' = ρ L\' / A\' = ρ (2L) / (A/2) = 4 (ρ L / A) = 4 R.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-34',
    q: 'Why is a potentiometer considered an ideal device for measuring the electromotive force (emf) of a cell compared to a standard analog voltmeter?',
    options: [
      'At null balance condition, it draws zero electric current from the test cell, measuring true open-circuit terminal potential difference without loading error',
      'It has zero internal resistance and consumes infinite current',
      'It operates purely on alternating currents without calibration',
      'It directly amplifies voltage using a transistor'
    ],
    correct: 0,
    topic: 'Electrical Measurements - Potentiometer vs Voltmeter',
    chapter: 'Current Electricity',
    explain: 'A voltmeter draws current from the source, causing an internal voltage drop (V = E - I r) so it measures terminal voltage rather than true emf. At the null balance point, the potentiometer draws zero current, acting like an ideal voltmeter of infinite resistance.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-35',
    q: 'In a balanced Wheatstone bridge consisting of resistors P, Q, R, and S arranged in cyclic order around a loop, what is the mathematical balancing condition that ensures zero galvanometer deflection?',
    options: [
      'P / Q = R / S',
      'P · Q = R · S',
      'P + Q = R + S',
      'P / R = S / Q'
    ],
    correct: 0,
    topic: 'Current Electricity - Balanced Wheatstone Bridge Condition',
    chapter: 'Current Electricity',
    explain: 'When the Wheatstone bridge is balanced, the electric potential at opposite central nodes is identical, so no current flows through the galvanometer. This condition corresponds to P / Q = R / S.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electromagnetism (3 MCQs: 36 to 38) ---
  {
    id: 'mdcat-b9-phy-36',
    q: 'A charged particle carrying charge q enters a uniform magnetic field B with velocity v directed perpendicular to the magnetic field lines. What is the radius r of its resulting circular trajectory?',
    options: [
      'r = (m v) / (q B)',
      'r = (q B) / (m v)',
      'r = (m B) / (q v)',
      'r = (q v) / (m B)'
    ],
    correct: 0,
    topic: 'Magnetic Force - Radius of Cyclotron Motion',
    chapter: 'Electromagnetism',
    explain: 'The magnetic Lorentz force acts as the centripetal force: F_mag = q v B = m v² / r. Solving for r yields r = (m v) / (q B).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-37',
    q: 'According to Ampère\'s Circuital Law, the magnetic field strength B inside a tightly wound long solenoid having n turns per unit length carrying electric current I is given by:',
    options: [
      'B = μ0 n I',
      'B = μ0 I / (2 π r)',
      'B = μ0 N I / (2 R)',
      'B = μ0 n² I / 2'
    ],
    correct: 0,
    topic: 'Magnetic Field - Magnetic Field of a Long Solenoid',
    chapter: 'Electromagnetism',
    explain: 'By Ampère\'s Law ∮ B · dl = μ0 I_enc, the interior magnetic field of an ideal long solenoid is uniform, axial, and has magnitude B = μ0 n I, where n = N/L is turns per meter.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-38',
    q: 'To convert a sensitive moving-coil galvanometer of coil resistance Rg into an ammeter with full-scale range I, one must connect:',
    options: [
      'A very low resistance shunt (Rs) in parallel with the galvanometer coil',
      'A very high resistance multiplier in series with the galvanometer coil',
      'A capacitor in parallel with the galvanometer coil',
      'An inductor in series with the galvanometer coil'
    ],
    correct: 0,
    topic: 'Galvanometer Conversion - Conversion to Ammeter using Shunt',
    chapter: 'Electromagnetism',
    explain: 'To measure larger currents without burning the delicate coil, a low resistance shunt (Rs) is connected in parallel with the galvanometer. Most of the main current bypasses the meter through the shunt: Rs = (Ig Rg) / (I - Ig).',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Electromagnetic Induction (3 MCQs: 39 to 41) ---
  {
    id: 'mdcat-b9-phy-39',
    q: 'According to Faraday\'s Law of Electromagnetic Induction and Lenz\'s Law, the induced electromotive force (emf) ε in a closed conducting coil of N turns is given by:',
    options: [
      'ε = - N (ΔΦ_B / Δt)',
      'ε = + N (ΔΦ_B / Δt)',
      'ε = - N B A',
      'ε = - L (ΔΦ_B / Δt)'
    ],
    correct: 0,
    topic: 'Electromagnetic Induction - Faraday and Lenz\'s Laws',
    chapter: 'Electromagnetic Induction',
    explain: 'Faraday\'s law states that induced emf is proportional to the time rate of change of magnetic flux. The negative sign represents Lenz\'s Law, which states that the polarity of induced emf creates a current whose magnetic field opposes the change in flux that produced it (Conservation of Energy).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-40',
    q: 'A straight metallic rod of length L moves with constant velocity v perpendicular to a uniform magnetic field B and perpendicular to its own length. What is the motional emf induced across the ends of the rod?',
    options: [
      'ε = B v L',
      'ε = B v / L',
      'ε = B v² L / 2',
      'ε = 0'
    ],
    correct: 0,
    topic: 'Motional EMF - Conductor Moving in Uniform Magnetic Field',
    chapter: 'Electromagnetic Induction',
    explain: 'As free conduction electrons move with velocity v through magnetic field B, they experience a magnetic Lorentz force F = q (v × B) along the rod. Charge separation continues until the internal electrostatic field balances the magnetic force: q E = q v B → E = v B. Potential difference across length L is ε = E L = B v L.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-41',
    q: 'In an ideal step-down electrical transformer with primary turns Np and secondary turns Ns (where Ns < Np), how do secondary voltage Vs and secondary current Is compare to primary values?',
    options: [
      'Vs is lower than Vp, while Is is higher than Ip (conserving electrical power Vp Ip = Vs Is)',
      'Vs is higher than Vp, and Is is higher than Ip',
      'Both Vs and Is are lower than primary values',
      'Vs is lower than Vp, and power increases by a factor of two'
    ],
    correct: 0,
    topic: 'Transformers - Step-Down Transformer Voltage and Current Relations',
    chapter: 'Electromagnetic Induction',
    explain: 'In an ideal transformer, P_in = P_out → Vp Ip = Vs Is. The turns ratio gives Vs / Vp = Ns / Np. For a step-down transformer (Ns < Np), secondary voltage decreases (Vs < Vp), while secondary current increases proportionally (Is > Ip).',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Electronics (3 MCQs: 42 to 44) ---
  {
    id: 'mdcat-b9-phy-42',
    q: 'In an intrinsic semiconductor (such as pure silicon or germanium at room temperature), the Fermi energy level lies:',
    options: [
      'Approximately halfway in the middle of the forbidden energy band gap',
      'Inside the conduction band',
      'Immediately below the top of the valence band',
      'At infinity'
    ],
    correct: 0,
    topic: 'Semiconductors - Intrinsic Fermi Level Position',
    chapter: 'Electronics',
    explain: 'In pure intrinsic semiconductors, thermal excitation creates equal numbers of conduction electrons and valence holes (n = p). By Fermi-Dirac statistics, the Fermi level Ef is located virtually halfway between the valence and conduction band edges: Ef ≈ (Ev + Ec)/2.',
    difficulty: 'Hard',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-43',
    q: 'In an NPN bipolar junction transistor (BJT) operating in the active amplification region, what are the bias conditions for the emitter-base and collector-base junctions?',
    options: [
      'Emitter-base junction is forward-biased, while collector-base junction is reverse-biased',
      'Both emitter-base and collector-base junctions are forward-biased',
      'Both emitter-base and collector-base junctions are reverse-biased',
      'Emitter-base junction is reverse-biased, while collector-base junction is forward-biased'
    ],
    correct: 0,
    topic: 'Transistors - BJT Biasing in Active Mode',
    chapter: 'Electronics',
    explain: 'For a BJT to function in the linear/active amplification mode: (1) the emitter-base junction must be forward-biased to inject electrons from emitter into base, and (2) the collector-base junction must be reverse-biased to sweep injected electrons from base into collector (Ic ≈ β Ib).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-44',
    q: 'In a full-wave bridge rectifier operating from a 50 Hz AC mains supply, what is the fundamental output ripple frequency?',
    options: [
      '100 Hz',
      '50 Hz',
      '25 Hz',
      '200 Hz'
    ],
    correct: 0,
    topic: 'Rectification - Full-Wave Rectifier Ripple Frequency',
    chapter: 'Electronics',
    explain: 'In a full-wave rectifier (center-tapped or bridge), both positive and negative half-cycles of the AC input are converted into unidirectional DC pulses. Thus, two output pulses are generated per input cycle: f_ripple = 2 × f_in = 2 × 50 Hz = 100 Hz.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Dawn of Modern Physics (4 MCQs: 45 to 48) ---
  {
    id: 'mdcat-b9-phy-45',
    q: 'In Einstein\'s photoelectric equation: h f = Φ + KE_max, what does the symbol Φ (work function) physically represent?',
    options: [
      'The minimum energy required to liberate the most loosely bound electron from the metallic surface',
      'The kinetic energy of the emitted photoelectron at the collector plate',
      'The maximum energy of the incident photon',
      'The potential difference required to stop the photocurrent'
    ],
    correct: 0,
    topic: 'Photoelectric Effect - Einstein\'s Photoelectric Equation and Work Function',
    chapter: 'Dawn of Modern Physics',
    explain: 'The work function Φ is the minimum binding energy an electron must absorb to overcome electrostatic surface forces and escape the metal lattice. Any remaining photon energy (h f - Φ) appears as maximum kinetic energy of the photoelectrons.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-46',
    q: 'In Compton scattering, a high-energy X-ray photon collides with a stationary free electron. The wavelength shift Δλ is given by Δλ = (h / m_e c) (1 - cos θ). At what scattering angle θ is the Compton wavelength shift maximal?',
    options: [
      'θ = 180° (backscattering), where Δλ = 2 h / (m_e c)',
      'θ = 90°, where Δλ = h / (m_e c)',
      'θ = 0°, where Δλ = 0',
      'θ = 45°'
    ],
    correct: 0,
    topic: 'Modern Physics - Compton Effect and Maximum Wavelength Shift',
    chapter: 'Dawn of Modern Physics',
    explain: 'The Compton shift is Δλ = λ_c (1 - cos θ). The term (1 - cos θ) reaches its mathematical maximum when cos θ = -1, which occurs at θ = 180° (head-on collision where the photon is backscattered). Here, Δλ_max = 2 λ_c ≈ 0.0485 Å.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-47',
    q: 'Pair production, wherein a high-energy gamma-ray photon transforms near a heavy atomic nucleus into an electron-positron pair, requires a minimum threshold photon energy of:',
    options: [
      '1.02 MeV (twice the rest-mass energy of an electron, 2 m_e c²)',
      '0.511 MeV',
      '2.04 MeV',
      '13.6 eV'
    ],
    correct: 0,
    topic: 'Modern Physics - Pair Production Threshold Energy',
    chapter: 'Dawn of Modern Physics',
    explain: 'The rest-mass energy of an electron or positron is E0 = m_e c² ≈ 0.511 MeV. To create an electron-positron pair, energy conservation requires E_gamma ≥ 2 m_e c² = 2(0.511 MeV) = 1.022 MeV.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-48',
    q: 'According to Heisenberg\'s Uncertainty Principle, the product of the uncertainties in the simultaneous measurement of position (Δx) and momentum (Δp_x) of a subatomic particle satisfies:',
    options: [
      'Δx · Δp_x ≥ ℏ / 2 (where ℏ = h / 2π)',
      'Δx · Δp_x = 0',
      'Δx · Δp_x ≤ h',
      'Δx / Δp_x ≥ 4 π'
    ],
    correct: 0,
    topic: 'Quantum Mechanics - Heisenberg Uncertainty Principle',
    chapter: 'Dawn of Modern Physics',
    explain: 'Heisenberg showed that the wave nature of matter imposes a fundamental physical limit on simultaneous precision of conjugate observables: Δx · Δp_x ≥ h / (4π) = ℏ / 2.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Nuclear Physics (3 MCQs: 49 to 51) ---
  {
    id: 'mdcat-b9-phy-49',
    q: 'A radioactive isotope sample has an initial activity of 800 counts per minute. If its radioactive half-life is 4 hours, what will be its activity after 16 hours have elapsed?',
    options: [
      '50 counts per minute',
      '100 counts per minute',
      '200 counts per minute',
      '25 counts per minute'
    ],
    correct: 0,
    topic: 'Nuclear Physics - Radioactive Decay Law and Half-Life Calculation',
    chapter: 'Nuclear Physics',
    explain: 'Number of half-lives elapsed n = t / t1/2 = 16 hours / 4 hours = 4 half-lives. Remaining activity A = A0 / 2ⁿ = 800 / 2⁴ = 800 / 16 = 50 counts per minute.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-50',
    q: 'In the nuclear binding energy curve, which atomic nucleus possesses the highest binding energy per nucleon (approximately 8.8 MeV/nucleon), making it the most thermodynamically stable nucleus in nature?',
    options: [
      'Iron-56 (⁵⁶Fe) and Nickel-62 (⁶²Ni)',
      'Uranium-235 (²³⁵U)',
      'Helium-4 (⁴He)',
      'Hydrogen-2 (Deuterium)'
    ],
    correct: 0,
    topic: 'Nuclear Physics - Binding Energy Curve and Nuclear Stability',
    chapter: 'Nuclear Physics',
    explain: 'The binding energy per nucleon curve rises sharply from light elements, peaks near mass number A ≈ 56-62 (⁵⁶Fe at 8.79 MeV/nucleon and ⁶²Ni at 8.8 MeV/nucleon), and gradually declines for heavier nuclei. Nuclei lighter than iron undergo fusion, while nuclei heavier than iron undergo fission.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-51',
    q: 'Which of the following nuclear radiation types possesses the highest ionizing power and the lowest penetrating ability?',
    options: [
      'Alpha particles (⁴He nuclei)',
      'Beta-minus particles (high-speed electrons)',
      'Gamma rays (high-energy photons)',
      'Neutrons'
    ],
    correct: 0,
    topic: 'Radioactivity - Alpha, Beta, and Gamma Properties',
    chapter: 'Nuclear Physics',
    explain: 'Alpha particles are helium nuclei with +2e charge and high mass. Due to their double positive charge and slow velocity, they interact strongly with orbital electrons, producing ~10,000 ion pairs per millimeter of air (highest ionizing power), but are stopped by a sheet of paper (lowest penetration).',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Physics of Solids (3 MCQs: 52 to 54) ---
  {
    id: 'mdcat-b9-phy-52',
    q: 'In materials science, Young\'s modulus of elasticity (Y) is defined mathematically as:',
    options: [
      'Tensile stress divided by tensile strain (Y = (F / A) / (ΔL / L0))',
      'Shear stress divided by shear strain',
      'Volumetric strain divided by hydraulic pressure',
      'Force divided by cross-sectional area multiplied by length'
    ],
    correct: 0,
    topic: 'Elasticity - Young\'s Modulus of Elasticity',
    chapter: 'Physics of Solids',
    explain: 'Within the proportional elastic limit, Hooke\'s law dictates that stress is proportional to strain. Young\'s modulus Y = Tensile Stress / Longitudinal Strain = (F / A) / (ΔL / L). Its SI unit is N/m² or Pascal (Pa).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-53',
    q: 'Superconductors expel all internal magnetic flux lines when cooled below their critical temperature (Tc), exhibiting perfect diamagnetism (magnetic susceptibility χ = -1). This phenomenon is known as:',
    options: [
      'The Meissner effect',
      'The Hall effect',
      'The Zeeman effect',
      'The Curie-Weiss law'
    ],
    correct: 0,
    topic: 'Superconductivity - Meissner Effect and Diamagnetism',
    chapter: 'Physics of Solids',
    explain: 'The Meissner effect is the complete expulsion of magnetic fields from the interior of a material as it transitions into the superconducting state below Tc. Screening surface supercurrents generate an opposing field, canceling B inside (B = 0).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-54',
    q: 'Ferromagnetic materials (such as iron, cobalt, and nickel) exhibit spontaneous magnetization below their Curie temperature primarily due to:',
    options: [
      'Quantum mechanical exchange interactions causing parallel alignment of atomic magnetic dipole moments within microscopic domains',
      'Drift velocity of free conduction electrons along slip planes',
      'Nuclear quadrupole moments aligning with external gravity',
      'Covalent bond cleavage under intense hydraulic pressure'
    ],
    correct: 0,
    topic: 'Magnetism in Solids - Ferromagnetism and Domain Theory',
    chapter: 'Physics of Solids',
    explain: 'In ferromagnets, quantum mechanical exchange coupling between unpaired d-electron spins overcomes thermal agitation below the Curie temperature (Tc), locking magnetic dipoles parallel across microscopic clusters called magnetic domains.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Alternating Current (3 MCQs: 55 to 57) ---
  {
    id: 'mdcat-b9-phy-55',
    q: 'In a pure inductor circuit connected across an alternating AC sinusoidal voltage source V = V0 sin(ω t), what is the phase relationship between voltage and current?',
    options: [
      'Voltage leads the electric current by a phase angle of 90° (π/2 radians)',
      'Current leads the voltage by 90°',
      'Voltage and current are completely in phase (0° phase difference)',
      'Voltage and current are 180° out of phase'
    ],
    correct: 0,
    topic: 'Alternating Current - Inductive Reactance and Phase Relations',
    chapter: 'Alternating Current',
    explain: 'In a purely inductive AC circuit, self-induced back emf opposes the growth of current: v = L (di/dt). Consequently, voltage leads current by 90° (or current lags voltage by 90° / π/2 rad). Mnemonic: "ELI the ICE man".',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-56',
    q: 'What is the capacitive reactance Xc of a capacitor of capacitance C operating at an AC angular frequency ω = 2 π f?',
    options: [
      'Xc = 1 / (2 π f C)',
      'Xc = 2 π f C',
      'Xc = 2 π f / C',
      'Xc = 1 / (2 π f C²)'
    ],
    correct: 0,
    topic: 'Alternating Current - Capacitive Reactance Formula',
    chapter: 'Alternating Current',
    explain: 'Capacitive reactance represents the opposition of a capacitor to alternating current: Xc = 1 / (ω C) = 1 / (2 π f C). Reactance is inversely proportional to frequency, so a capacitor blocks direct current (f = 0, Xc → ∞) while passing high frequencies.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-57',
    q: 'In a series RLC AC circuit at electrical resonance, the inductive reactance equals capacitive reactance (X_L = X_C). What is the total impedance Z of the circuit and the circuit power factor?',
    options: [
      'Z = R (impedance is at its minimum); Power factor cos φ = 1.0 (purely resistive)',
      'Z = 0; Power factor = 0',
      'Z = √(R² + X_L²); Power factor = 0.5',
      'Z = ∞; Power factor = 1.0'
    ],
    correct: 0,
    topic: 'Alternating Current - Series RLC Resonance and Power Factor',
    chapter: 'Alternating Current',
    explain: 'In a series RLC circuit, Z = √[R² + (X_L - X_C)²]. At resonance, X_L = X_C, so the reactive terms cancel, giving minimum impedance Z = R and maximum current I = V/R. Phase angle φ = 0°, so power factor cos φ = cos(0°) = 1.0.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Atomic Spectra (3 MCQs: 58 to 60) ---
  {
    id: 'mdcat-b9-phy-58',
    q: 'According to Bohr\'s postulates for the hydrogen atom, what is the quantized orbital angular momentum L of an electron revolving in the nth stationary orbit?',
    options: [
      'L = n h / (2 π) = n ℏ',
      'L = 2 π n / h',
      'L = n² h / (2 π)',
      'L = h / (n 2 π)'
    ],
    correct: 0,
    topic: 'Bohr Model - Quantization of Orbital Angular Momentum',
    chapter: 'Atomic Spectra',
    explain: 'Bohr\'s second postulate states that an electron revolves only in non-radiating orbits where its orbital angular momentum is an integral multiple of h / (2π): m v r = n h / (2π) = n ℏ, where n = 1, 2, 3...',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-59',
    q: 'In an X-ray tube, the continuous X-ray spectrum (Bremsstrahlung or "braking radiation") has a sharp, well-defined minimum cutoff wavelength (λ_min) determined solely by:',
    options: [
      'The accelerating high voltage V applied across the tube (λ_min = h c / (e V))',
      'The atomic number of the heavy metal target anode',
      'The temperature of the tungsten filament cathode',
      'The length of the evacuated glass tube'
    ],
    correct: 0,
    topic: 'X-Rays - Duane-Hunt Law and Bremsstrahlung Cutoff Wavelength',
    chapter: 'Atomic Spectra',
    explain: 'Continuous X-rays are generated when high-energy electrons decelerate in the nuclear electric fields of the target. When an electron transfers all its kinetic energy (e V) into a single photon in a single collision: h f_max = e V → λ_min = h c / (e V) (Duane-Hunt Law).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b9-phy-60',
    q: 'In a ruby or helium-neon laser, the fundamental physical prerequisite to achieve stimulated emission and optical amplification is:',
    options: [
      'Population inversion (more atoms in the metastable excited state than in the ground state)',
      'Thermal ionization of all gas molecules into plasma',
      'Complete evacuation of all mirror coatings',
      'Cooling the active medium to absolute zero'
    ],
    correct: 0,
    topic: 'Lasers - Population Inversion and Stimulated Emission',
    chapter: 'Atomic Spectra',
    explain: 'Under thermal equilibrium, Boltzmann distribution dictates that ground states are more populated than excited states. By optical or electrical pumping, a non-equilibrium condition termed population inversion (N2 > N1) must be established in a metastable state so that incoming resonant photons trigger stimulated emission faster than absorption.',
    difficulty: 'Medium',
    subject: 'Physics'
  }
];

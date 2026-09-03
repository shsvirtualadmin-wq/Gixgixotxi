import { Question } from '../types';

export const TCAT_PHYSICS_QUESTIONS: Question[] = [
  // ==========================================
  // Chapter 1: Measurements (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-meas-1',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Easy',
    q: 'Which of the following is a supplementary SI unit?',
    options: ['Steradian (sr)', 'Candela (cd)', 'Ampere (A)', 'Kelvin (K)'],
    correct: 0,
    explain: 'Radian (plane angle) and Steradian (solid angle) are the two supplementary SI units, while candela, ampere, and kelvin are fundamental base units.'
  },
  {
    id: 'tcat-phy-meas-2',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Easy',
    q: 'What is the dimensional formula of universal gravitational constant G?',
    options: ['[M^{-1} L^3 T^{-2}]', '[M^1 L^2 T^{-2}]', '[M^{-1} L^2 T^{-1}]', '[M^0 L^3 T^{-2}]'],
    correct: 0,
    explain: 'From F = G m1 m2 / r^2: G = F r^2 / (m1 m2) => [M L T^{-2}][L^2] / [M^2] = [M^{-1} L^3 T^{-2}].'
  },
  {
    id: 'tcat-phy-meas-3',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Medium',
    q: 'How many significant figures are in the measurement 0.005080 kg?',
    options: ['4', '3', '6', '7'],
    correct: 0,
    explain: 'Leading zeros before the first non-zero digit are not significant. The digits 5, 0, 8, and the trailing 0 (after decimal) are significant, giving exactly 4 significant figures.'
  },
  {
    id: 'tcat-phy-meas-4',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Medium',
    q: 'If the percentage uncertainty in mass is 2% and in velocity is 3%, what is the percentage uncertainty in kinetic energy (KE = (1/2)mv^2)?',
    options: ['8%', '5%', '11%', '6%'],
    correct: 0,
    explain: '% uncertainty in KE = (% in m) + 2 × (% in v) = 2% + 2(3%) = 2% + 6% = 8%.'
  },
  {
    id: 'tcat-phy-meas-5',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Hard',
    q: 'The period of oscillation of a simple pendulum is T = 2\\pi \\sqrt{L/g}. If measured length has 1% error and time period has 2% error, what is the maximum percentage error in the calculated acceleration due to gravity g?',
    options: ['5%', '3%', '4%', '1%'],
    correct: 0,
    explain: 'g = 4\\pi^2 L / T^2. Percentage error in g = (% error in L) + 2 × (% error in T) = 1% + 2(2%) = 5%.'
  },

  // ==========================================
  // Chapter 2: Vectors and Equilibrium (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-ve-1',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Easy',
    q: 'What is the SI unit of torque (moment of a force)?',
    options: ['Newton-meter (N·m)', 'Joule (J)', 'Newton per meter (N/m)', 'Pascal (Pa)'],
    correct: 0,
    explain: 'Torque \\tau = r × F has units of Newton-meters (N·m). Although dimensionally equivalent to Joules, torque is a vector quantity and is strictly measured in N·m.'
  },
  {
    id: 'tcat-phy-ve-2',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Easy',
    q: 'The first condition of equilibrium states that for a body in translational equilibrium:',
    options: ['\\sum F = 0 (Vector sum of all external forces is zero)', '\\sum \\tau = 0 (Sum of all torques is zero)', 'Velocity must be zero', 'Acceleration must be non-zero'],
    correct: 0,
    explain: 'Translational equilibrium requires \\sum F = 0. (Rotational equilibrium requires \\sum \\tau = 0).'
  },
  {
    id: 'tcat-phy-ve-3',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Medium',
    q: 'If the magnitudes of dot product and cross product of two vectors are equal (|A · B| = |A × B|), what is the angle between them?',
    options: ['45° (\\pi/4)', '90° (\\pi/2)', '60° (\\pi/3)', '0°'],
    correct: 0,
    explain: '|A · B| = AB\\cos(\\theta) and |A × B| = AB\\sin(\\theta). Equating them gives \\sin(\\theta) = \\cos(\\theta) => \\tan(\\theta) = 1 => \\theta = 45°.'
  },
  {
    id: 'tcat-phy-ve-4',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Medium',
    q: 'Two forces of 6 N and 8 N act at a right angle (90°) to each other. What is the magnitude of their resultant force?',
    options: ['10 N', '14 N', '2 N', '48 N'],
    correct: 0,
    explain: 'R = \\sqrt{F1^2 + F2^2 + 2F1 F2 \\cos(90°)} = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10 N.'
  },
  {
    id: 'tcat-phy-ve-5',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Hard',
    q: 'A uniform meter rod of mass 200 g is balanced horizontally on a knife-edge placed at the 40 cm mark. Where must a 100 g mass be suspended to maintain horizontal equilibrium?',
    options: ['At the 20 cm mark', 'At the 30 cm mark', 'At the 60 cm mark', 'At the 10 cm mark'],
    correct: 0,
    explain: 'Center of gravity of the rod is at 50 cm. Distance from pivot (40 cm) to CG is 10 cm. Clockwise torque = 200 g × 10 cm = 2000 g·cm. Counter-clockwise torque needed = 100 g × d = 2000 => d = 20 cm to the left of 40 cm, which is at the (40 - 20) = 20 cm mark.'
  },

  // ==========================================
  // Chapter 3: Motion and Force (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-mf-1',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Easy',
    q: 'At what launch angle \\theta is the horizontal range of a projectile maximum over level ground?',
    options: ['45°', '30°', '60°', '90°'],
    correct: 0,
    explain: 'Range R = (v0^2 \\sin(2\\theta)) / g. The maximum occurs when \\sin(2\\theta) = 1 => 2\\theta = 90° => \\theta = 45°.'
  },
  {
    id: 'tcat-phy-mf-2',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Easy',
    q: 'The area under a velocity-time (v-t) graph represents:',
    options: ['Displacement', 'Acceleration', 'Force', 'Momentum'],
    correct: 0,
    explain: 'Area under v-t graph = \\int v dt = displacement. (Slope of v-t graph represents acceleration).'
  },
  {
    id: 'tcat-phy-mf-3',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Medium',
    q: 'A ball is projected horizontally with 20 m/s from the top of a 20 m high tower. Taking g = 10 m/s^2, how far from the base of the tower will it strike the ground?',
    options: ['40 m', '20 m', '60 m', '80 m'],
    correct: 0,
    explain: 'Time of flight t = \\sqrt{2h/g} = \\sqrt{2(20)/10} = \\sqrt{4} = 2 s. Horizontal distance x = vx · t = 20 m/s × 2 s = 40 m.'
  },
  {
    id: 'tcat-phy-mf-4',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Medium',
    q: 'A force of 50 N acts on an object of mass 5 kg for 0.2 seconds. What is the impulse imparted to the object?',
    options: ['10 N·s', '250 N·s', '5 N·s', '50 N·s'],
    correct: 0,
    explain: 'Impulse J = F · \\Delta t = 50 N × 0.2 s = 10 N·s (or kg·m/s).'
  },
  {
    id: 'tcat-phy-mf-5',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Hard',
    q: 'A bullet of mass 20 g moving with velocity 400 m/s penetrates a wooden block up to 10 cm before coming to rest. What is the average retarding force exerted by the wood?',
    options: ['16,000 N', '8,000 N', '32,000 N', '1,600 N'],
    correct: 0,
    explain: 'Work done against retarding force = initial KE: F · d = (1/2)mv^2. F(0.1 m) = 0.5 × 0.02 kg × (400)^2 = 0.01 × 160,000 = 1600 J. F = 1600 / 0.1 = 16,000 N.'
  },

  // ==========================================
  // Chapter 4: Work and Energy (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-we-1',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Easy',
    q: 'How many Joules are equivalent to 1 kilowatt-hour (1 kWh)?',
    options: ['3.6 × 10^6 J (3.6 MJ)', '3.6 × 10^3 J', '1.0 × 10^6 J', '3.6 × 10^5 J'],
    correct: 0,
    explain: '1 kWh = 1000 W × 3600 s = 3,600,000 J = 3.6 × 10^6 J.'
  },
  {
    id: 'tcat-phy-we-2',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Easy',
    q: 'If the angle between the applied force and the displacement is 90°, the work done is:',
    options: ['Zero', 'Maximum positive', 'Maximum negative', 'Half the maximum'],
    correct: 0,
    explain: 'W = F · d · \\cos(90°). Since \\cos(90°) = 0, work done is zero.'
  },
  {
    id: 'tcat-phy-we-3',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Medium',
    q: 'If the linear momentum of an object is doubled, by what factor does its kinetic energy increase?',
    options: ['4 times', '2 times', '8 times', '\\sqrt{2} times'],
    correct: 0,
    explain: 'KE = p^2 / (2m). If momentum p is doubled to 2p, KE\' = (2p)^2 / (2m) = 4 [p^2 / (2m)] = 4 KE.'
  },
  {
    id: 'tcat-phy-we-4',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Medium',
    q: 'An electric pump lifts 100 kg of water to a vertical height of 20 m in 10 seconds. Assuming g = 9.8 m/s^2, what is the output power of the pump?',
    options: ['1960 W (1.96 kW)', '980 W', '3920 W', '490 W'],
    correct: 0,
    explain: 'Work W = mgh = 100 × 9.8 × 20 = 19,600 J. Power P = W / t = 19,600 / 10 = 1960 W.'
  },
  {
    id: 'tcat-phy-we-5',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Hard',
    q: 'What is the escape velocity from the surface of the Earth with radius R = 6.4 × 10^6 m and g = 9.8 m/s^2?',
    options: ['11.2 km/s', '7.9 km/s', '9.8 km/s', '16.0 km/s'],
    correct: 0,
    explain: 'v_esc = \\sqrt{2gR} = \\sqrt{2 × 9.8 × 6.4 × 10^6} = \\sqrt{1.2544 × 10^8} \\approx 11,200 m/s = 11.2 km/s.'
  },

  // ==========================================
  // Chapter 5: Circular Motion (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-cm-1',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Easy',
    q: 'What is the orbital time period of a geostationary satellite around Earth?',
    options: ['24 hours (1 day)', '12 hours', '84 minutes', '365 days'],
    correct: 0,
    explain: 'A geostationary satellite has an orbital period equal to the rotation period of Earth (24 hours), remaining stationary above a fixed point on the equator.'
  },
  {
    id: 'tcat-phy-cm-2',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Easy',
    q: 'What is the relationship between linear velocity v and angular velocity \\omega?',
    options: ['v = r\\omega', '\\omega = rv', 'v = r^2\\omega', 'v = \\omega / r'],
    correct: 0,
    explain: 'For circular motion of radius r, linear speed v is related to angular speed \\omega by v = r\\omega (in vector form v = \\omega × r).'
  },
  {
    id: 'tcat-phy-cm-3',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Medium',
    q: 'A car of mass 1000 kg rounds a curve of radius 50 m at a constant speed of 10 m/s. What is the required centripetal force?',
    options: ['2000 N', '1000 N', '500 N', '4000 N'],
    correct: 0,
    explain: 'Fc = m v^2 / r = 1000 × (10)^2 / 50 = 1000 × 100 / 50 = 2000 N.'
  },
  {
    id: 'tcat-phy-cm-4',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Medium',
    q: 'What is the moment of inertia of a uniform solid sphere of mass M and radius R about its diameter?',
    options: ['(2/5) M R^2', '(1/2) M R^2', '(2/3) M R^2', 'M R^2'],
    correct: 0,
    explain: 'For a uniform solid sphere, I = (2/5)MR^2. (For a thin spherical shell it is (2/3)MR^2; for a solid cylinder/disc it is (1/2)MR^2).'
  },
  {
    id: 'tcat-phy-cm-5',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Hard',
    q: 'A stone tied to a string of length L is whirled in a vertical circle. What is the minimum speed required at the highest point to prevent the string from slacking?',
    options: ['\\sqrt{gL}', '\\sqrt{2gL}', '\\sqrt{5gL}', '\\sqrt{3gL}'],
    correct: 0,
    explain: 'At the highest point, tension T >= 0. When T = 0, gravity alone provides the centripetal force: mg = m v^2 / L => v = \\sqrt{gL}.'
  },

  // ==========================================
  // Chapter 6: Fluid Dynamics (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-fd-1',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Easy',
    q: 'What does the Equation of Continuity (A1 v1 = A2 v2) express the conservation of?',
    options: ['Mass', 'Energy', 'Momentum', 'Volume'],
    correct: 0,
    explain: 'The equation of continuity for incompressible steady flow A1 v1 = A2 v2 is a direct consequence of the law of conservation of mass.'
  },
  {
    id: 'tcat-phy-fd-2',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Easy',
    q: 'What is the SI unit of viscosity (coefficient of viscosity \\eta)?',
    options: ['kg/(m·s) or Pa·s', 'N/m', 'kg·m/s', 'Pa/s'],
    correct: 0,
    explain: 'From Stokes law F = 6\\pi\\eta r v: \\eta = F / (6\\pi r v) => N / (m · m/s) = N·s/m^2 = Pa·s = kg/(m·s).'
  },
  {
    id: 'tcat-phy-fd-3',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Medium',
    q: 'Water flows through a horizontal pipe. If the diameter of the pipe is halved, what happens to the flow velocity?',
    options: ['Increases by a factor of 4', 'Doubles', 'Decreases to one-fourth', 'Increases by a factor of 16'],
    correct: 0,
    explain: 'Area A \\propto d^2. Halving diameter reduces area to A/4. By A1 v1 = A2 v2, v2 = (A1 / A2) v1 = 4 v1.'
  },
  {
    id: 'tcat-phy-fd-4',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Medium',
    q: 'According to Bernoulli equation, where the speed of a flowing fluid is high, the pressure is:',
    options: ['Low', 'High', 'Constant', 'Zero'],
    correct: 0,
    explain: 'Bernoulli principle states P + (1/2)\\rho v^2 + \\rho g h = constant. When speed v increases in a horizontal flow, static pressure P must decrease.'
  },
  {
    id: 'tcat-phy-fd-5',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Hard',
    q: 'Two spherical raindrops of radii in the ratio 1 : 2 fall through air. What is the ratio of their terminal velocities (v1 : v2)?',
    options: ['1 : 4', '1 : 2', '1 : 8', '1 : 16'],
    correct: 0,
    explain: 'Terminal velocity vt = (2 r^2 g (\\rho - \\sigma)) / (9 \\eta) \\propto r^2. Therefore, v1 / v2 = (r1 / r2)^2 = (1/2)^2 = 1/4.'
  },

  // ==========================================
  // Chapter 7: Oscillations (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-osc-1',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Easy',
    q: 'What is the time period T of a simple pendulum of length L in a gravitational field g?',
    options: ['2\\pi \\sqrt{L/g}', '2\\pi \\sqrt{g/L}', '(1/2\\pi) \\sqrt{L/g}', '2\\pi (L/g)'],
    correct: 0,
    explain: 'The formula for the small-amplitude period of a simple pendulum is T = 2\\pi \\sqrt{L/g}.'
  },
  {
    id: 'tcat-phy-osc-2',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Easy',
    q: 'In Simple Harmonic Motion (SHM), acceleration is directly proportional to displacement and directed:',
    options: ['Towards the mean position', 'Away from the mean position', 'Perpendicular to displacement', 'In the direction of motion'],
    correct: 0,
    explain: 'By definition of SHM, a = -\\omega^2 x. The negative sign denotes that acceleration is always directed towards the equilibrium (mean) position.'
  },
  {
    id: 'tcat-phy-osc-3',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Medium',
    q: 'At what displacement from the mean position is the kinetic energy of an oscillator equal to its potential energy in SHM?',
    options: ['x = x0 / \\sqrt{2}', 'x = x0 / 2', 'x = x0 / 4', 'x = x0 / \\sqrt{3}'],
    correct: 0,
    explain: 'KE = (1/2)k(x0^2 - x^2) and PE = (1/2)kx^2. Equating: x0^2 - x^2 = x^2 => 2x^2 = x0^2 => x = x0 / \\sqrt{2}.'
  },
  {
    id: 'tcat-phy-osc-4',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Medium',
    q: 'A mass-spring system has spring constant k = 200 N/m and mass m = 2 kg. What is its natural frequency of oscillation f?',
    options: ['(5 / \\pi) Hz \\approx 1.59 Hz', '10 Hz', '(10 / \\pi) Hz', '100 Hz'],
    correct: 0,
    explain: '\\omega = \\sqrt{k/m} = \\sqrt{200/2} = 10 rad/s. Frequency f = \\omega / (2\\pi) = 10 / (2\\pi) = 5 / \\pi Hz \\approx 1.59 Hz.'
  },
  {
    id: 'tcat-phy-osc-5',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Hard',
    q: 'A seconds pendulum has a time period of exactly 2.0 seconds. What is its approximate length on the surface of Earth (g = 9.8 m/s^2)?',
    options: ['0.993 m (approx 1 m)', '0.50 m', '2.0 m', '1.96 m'],
    correct: 0,
    explain: 'T = 2\\pi \\sqrt{L/g} => 2 = 2\\pi \\sqrt{L/9.8} => 1 = \\pi^2 (L/9.8) => L = 9.8 / \\pi^2 \\approx 9.8 / 9.87 \\approx 0.993 m.'
  },

  // ==========================================
  // Chapter 8: Waves (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-wav-1',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Easy',
    q: 'What was Laplace correction factor \\gamma to Newton formula for the speed of sound in a gas?',
    options: ['\\sqrt{\\gamma P / \\rho}', '\\sqrt{P / (\\gamma\\rho)}', '\\gamma \\sqrt{P / \\rho}', '\\sqrt{P / \\rho}'],
    correct: 0,
    explain: 'Laplace corrected Newton assumption from isothermal to adiabatic: v = \\sqrt{\\gamma P / \\rho}, where \\gamma = Cp/Cv.'
  },
  {
    id: 'tcat-phy-wav-2',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Easy',
    q: 'The distance between two consecutive nodes in a stationary wave of wavelength \\lambda is:',
    options: ['\\lambda / 2', '\\lambda', '\\lambda / 4', '2\\lambda'],
    correct: 0,
    explain: 'In a standing wave, the distance between any two adjacent nodes (or two adjacent antinodes) is \\lambda / 2.'
  },
  {
    id: 'tcat-phy-wav-3',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Medium',
    q: 'Two tuning forks with frequencies 256 Hz and 260 Hz are sounded together. What is the number of beats heard per second?',
    options: ['4 beats/s', '2 beats/s', '516 beats/s', '258 beats/s'],
    correct: 0,
    explain: 'Beat frequency fb = |f1 - f2| = |256 - 260| = 4 Hz (4 beats per second).'
  },
  {
    id: 'tcat-phy-wav-4',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Medium',
    q: 'A source of sound producing frequency 600 Hz moves towards a stationary observer with speed v/10 (v = speed of sound). What is the observed frequency?',
    options: ['667 Hz', '545 Hz', '660 Hz', '600 Hz'],
    correct: 0,
    explain: 'f\' = f [v / (v - vs)] = 600 [v / (v - 0.1v)] = 600 / 0.9 = 666.7 \\approx 667 Hz.'
  },
  {
    id: 'tcat-phy-wav-5',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Hard',
    q: 'By how much does the speed of sound in air increase for every 1°C rise in temperature?',
    options: ['0.61 m/s', '0.33 m/s', '1.0 m/s', '3.3 m/s'],
    correct: 0,
    explain: 'v_t = v_0 + 0.61 t. Thus the speed of sound increases by 0.61 m/s for each degree Celsius rise in temperature.'
  },

  // ==========================================
  // Chapter 9: Thermodynamics (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-th-1',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Easy',
    q: 'In an isothermal expansion of an ideal gas, which quantity remains constant?',
    options: ['Temperature (\\Delta T = 0, \\Delta U = 0)', 'Pressure', 'Volume', 'Heat content (Q = 0)'],
    correct: 0,
    explain: 'In an isothermal process, temperature remains constant (T = const). For an ideal gas, internal energy depends solely on temperature, so \\Delta U = 0.'
  },
  {
    id: 'tcat-phy-th-2',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Easy',
    q: 'What is the First Law of Thermodynamics fundamentally an expression of?',
    options: ['Conservation of Energy', 'Conservation of Momentum', 'Conservation of Mass', 'Conservation of Charge'],
    correct: 0,
    explain: 'The First Law Q = \\Delta U + W expresses the principle of conservation of energy for thermodynamic systems.'
  },
  {
    id: 'tcat-phy-th-3',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Medium',
    q: 'What is the efficiency of a Carnot heat engine operating between a hot reservoir at 500 K and a cold reservoir at 300 K?',
    options: ['40%', '60%', '66.7%', '20%'],
    correct: 0,
    explain: '\\eta = 1 - (Tc / Th) = 1 - (300 / 500) = 1 - 0.6 = 0.4 = 40%.'
  },
  {
    id: 'tcat-phy-th-4',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Medium',
    q: 'For an ideal gas, the difference between molar heat capacities Cp - Cv is equal to:',
    options: ['Universal gas constant R', 'Zero', 'Boltzmann constant k', 'R / 2'],
    correct: 0,
    explain: 'Mayer relation states Cp - Cv = R for one mole of an ideal gas.'
  },
  {
    id: 'tcat-phy-th-5',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Hard',
    q: 'During an adiabatic expansion, an ideal gas performs 250 J of work. What is the change in its internal energy \\Delta U?',
    options: ['-250 J', '+250 J', '0 J', '+500 J'],
    correct: 0,
    explain: 'In an adiabatic process, Q = 0. From the First Law Q = \\Delta U + W: 0 = \\Delta U + 250 J => \\Delta U = -250 J (internal energy decreases).'
  },

  // ==========================================
  // Chapter 10: Electrostatics (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-es-1',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Easy',
    q: 'What is the SI unit of electric flux \\Phi_E?',
    options: ['N·m^2 / C (or V·m)', 'N / C', 'V / m', 'C / m^2'],
    correct: 0,
    explain: '\\Phi_E = E · A. Since E is in N/C and A is in m^2, unit is N·m^2/C = (V/m) · m^2 = V·m.'
  },
  {
    id: 'tcat-phy-es-2',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Easy',
    q: 'When a dielectric slab with relative permittivity \\epsilon_r = 4 is inserted between the plates of an isolated capacitor, its capacitance becomes:',
    options: ['4 times the original capacitance', '1/4 of the original capacitance', '16 times', 'Unchanged'],
    correct: 0,
    explain: 'C\' = \\epsilon_r C0. With \\epsilon_r = 4, capacitance increases by a factor of 4.'
  },
  {
    id: 'tcat-phy-es-3',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Medium',
    q: 'What is the electric field intensity inside a hollow conducting sphere carrying a uniform charge Q on its surface?',
    options: ['Zero', 'kQ / r^2', 'kQ / R', 'Infinite'],
    correct: 0,
    explain: 'By Gauss law, a Gaussian surface inside the hollow sphere encloses zero net charge, so E = 0 everywhere inside the sphere.'
  },
  {
    id: 'tcat-phy-es-4',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Medium',
    q: 'Two equal charges of +2 \\mu C are separated by 3 m in vacuum. What is the electrostatic repulsive force between them (k = 9 × 10^9 N·m^2/C^2)?',
    options: ['0.004 N (4 × 10^{-3} N)', '0.012 N', '0.006 N', '40 N'],
    correct: 0,
    explain: 'F = k q1 q2 / r^2 = (9 × 10^9 × 2 × 10^{-6} × 2 × 10^{-6}) / (3)^2 = 36 × 10^{-3} / 9 = 4 × 10^{-3} N = 0.004 N.'
  },
  {
    id: 'tcat-phy-es-5',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Hard',
    q: 'Three capacitors of capacitances 3 \\mu F, 6 \\mu F, and 2 \\mu F are connected such that 3 \\mu F and 6 \\mu F are in series, and this combination is in parallel with the 2 \\mu F capacitor. What is the equivalent capacitance?',
    options: ['4 \\mu F', '11 \\mu F', '1 \\mu F', '2 \\mu F'],
    correct: 0,
    explain: 'Series combination: Cs = (3 × 6) / (3 + 6) = 18 / 9 = 2 \\mu F. In parallel with 2 \\mu F: Ceq = Cs + 2 = 2 + 2 = 4 \\mu F.'
  },

  // ==========================================
  // Chapter 11: Current Electricity (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-ce-1',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Easy',
    q: 'Kirchhoff First Rule (junction rule) \\sum I = 0 is a manifestation of the conservation of:',
    options: ['Charge', 'Energy', 'Momentum', 'Mass'],
    correct: 0,
    explain: 'Kirchhoff Current Law states total current entering a node equals total current leaving, which conserves electric charge.'
  },
  {
    id: 'tcat-phy-ce-2',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Easy',
    q: 'What is the SI unit of resistivity \\rho?',
    options: ['Ohm-meter (\\Omega·m)', 'Ohm per meter (\\Omega/m)', 'Siemens (S)', 'Ohm (\\Omega)'],
    correct: 0,
    explain: 'From R = \\rho L / A: \\rho = R A / L = (\\Omega · m^2) / m = \\Omega·m.'
  },
  {
    id: 'tcat-phy-ce-3',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Medium',
    q: 'A uniform copper wire of resistance 16 \\Omega is cut into 4 equal parts, and all 4 parts are then connected in parallel. What is the equivalent resistance?',
    options: ['1 \\Omega', '4 \\Omega', '0.25 \\Omega', '16 \\Omega'],
    correct: 0,
    explain: 'Each part has resistance R_each = 16 / 4 = 4 \\Omega. Connecting 4 identical resistors of 4 \\Omega in parallel gives R_eq = 4 / 4 = 1 \\Omega.'
  },
  {
    id: 'tcat-phy-ce-4',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Medium',
    q: 'A cell of emf 12 V and internal resistance 2 \\Omega is connected to an external resistor of 4 \\Omega. What is the terminal potential difference across the cell?',
    options: ['8 V', '12 V', '6 V', '4 V'],
    correct: 0,
    explain: 'Circuit current I = E / (R + r) = 12 / (4 + 2) = 2 A. Terminal voltage V = E - Ir = 12 - (2)(2) = 12 - 4 = 8 V (or V = I·R = 2 × 4 = 8 V).'
  },
  {
    id: 'tcat-phy-ce-5',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Hard',
    q: 'A balanced Wheatstone bridge has branch resistances P = 10 \\Omega, Q = 20 \\Omega, and R = 30 \\Omega. What is the value of the unknown resistance S?',
    options: ['60 \\Omega', '15 \\Omega', '40 \\Omega', '50 \\Omega'],
    correct: 0,
    explain: 'For a balanced Wheatstone bridge: P / Q = R / S => 10 / 20 = 30 / S => 1/2 = 30 / S => S = 60 \\Omega.'
  },

  // ==========================================
  // Chapter 12: Electromagnetism (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-em-1',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Easy',
    q: 'What is 1 Tesla (1 T) equal to in terms of fundamental SI units?',
    options: ['1 N / (A·m)', '1 N·A / m', '1 J / (A·m)', '1 Wb·m^2'],
    correct: 0,
    explain: 'From F = I L B: B = F / (I L) => 1 T = 1 N / (A·m) = 1 Wb / m^2.'
  },
  {
    id: 'tcat-phy-em-2',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Easy',
    q: 'The magnetic force on a charged particle moving parallel to a uniform magnetic field (\\theta = 0°) is:',
    options: ['Zero', 'Maximum', 'Negative', 'Infinite'],
    correct: 0,
    explain: 'F = q v B \\sin(\\theta). Since \\sin(0°) = 0, the magnetic deflecting force is zero.'
  },
  {
    id: 'tcat-phy-em-3',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Medium',
    q: 'What is the magnetic field B at the center of a long solenoid having n turns per unit length carrying current I?',
    options: ['\\mu_0 n I', '\\mu_0 N I', '\\mu_0 I / (2\\pi r)', '2\\pi \\mu_0 n I'],
    correct: 0,
    explain: 'Applying Ampere circuital law to an ideal long solenoid gives B = \\mu_0 n I, where n = N/L.'
  },
  {
    id: 'tcat-phy-em-4',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Medium',
    q: 'An electron enters perpendicularly into a uniform magnetic field B with speed v. The radius of its circular orbit is given by:',
    options: ['m v / (q B)', 'q B / (m v)', 'm B / (q v)', 'q v / (m B)'],
    correct: 0,
    explain: 'Centripetal force is provided by magnetic force: m v^2 / r = q v B => r = m v / (q B).'
  },
  {
    id: 'tcat-phy-em-5',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Hard',
    q: 'Two long parallel wires carry currents of 4 A and 6 A in the same direction separated by a distance of 0.2 m. What is the force per unit length between them (\\mu_0 = 4\\pi × 10^{-7} T·m/A)?',
    options: ['2.4 × 10^{-5} N/m (attractive)', '2.4 × 10^{-5} N/m (repulsive)', '1.2 × 10^{-5} N/m (attractive)', '4.8 × 10^{-5} N/m (repulsive)'],
    correct: 0,
    explain: 'F/L = (\\mu_0 I1 I2) / (2\\pi d) = (4\\pi × 10^{-7} × 4 × 6) / (2\\pi × 0.2) = (2 × 10^{-7} × 24) / 0.2 = 48 × 10^{-7} / 0.2 = 2.4 × 10^{-5} N/m. Currents in the same direction attract.'
  },

  // ==========================================
  // Chapter 13: Electromagnetic Induction (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-emi-1',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Easy',
    q: 'Lenz Law for the direction of induced emf is a direct consequence of the conservation of:',
    options: ['Energy', 'Charge', 'Momentum', 'Current'],
    correct: 0,
    explain: 'Lenz Law ensures that mechanical work done against the opposing induced magnetic field is converted into electrical energy, satisfying conservation of energy.'
  },
  {
    id: 'tcat-phy-emi-2',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Easy',
    q: 'What is the SI unit of mutual and self-inductance?',
    options: ['Henry (H)', 'Weber (Wb)', 'Tesla (T)', 'Farad (F)'],
    correct: 0,
    explain: 'Inductance is measured in Henry (H), where 1 H = 1 V·s/A = 1 Wb/A.'
  },
  {
    id: 'tcat-phy-emi-3',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Medium',
    q: 'A metal rod of length 0.5 m moves with speed 10 m/s perpendicular to a uniform magnetic field of 0.4 T. What motional emf is induced across the rod?',
    options: ['2.0 V', '0.2 V', '5.0 V', '1.0 V'],
    correct: 0,
    explain: '\\epsilon = v B L \\sin(90°) = 10 × 0.4 × 0.5 × 1 = 2.0 V.'
  },
  {
    id: 'tcat-phy-emi-4',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Medium',
    q: 'An ideal step-down transformer converts 220 V to 11 V. If the primary winding has 1000 turns, how many turns are on the secondary winding?',
    options: ['50 turns', '200 turns', '20,000 turns', '25 turns'],
    correct: 0,
    explain: 'Ns / Np = Vs / Vp => Ns = Np × (Vs / Vp) = 1000 × (11 / 220) = 1000 × (1/20) = 50 turns.'
  },
  {
    id: 'tcat-phy-emi-5',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Hard',
    q: 'A magnetic flux through a coil changes from 12 Wb to 2 Wb in 0.2 seconds. What is the magnitude of average emf induced in the coil (N = 1)?',
    options: ['50 V', '20 V', '100 V', '2.5 V'],
    correct: 0,
    explain: '|\\epsilon| = N |\\Delta \\Phi| / \\Delta t = 1 × |2 - 12| / 0.2 = 10 / 0.2 = 50 V.'
  },

  // ==========================================
  // Chapter 14: Alternating Current (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-ac-1',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Easy',
    q: 'What is the relationship between RMS voltage V_rms and peak voltage V_0 for a sinusoidal AC voltage?',
    options: ['V_rms = V_0 / \\sqrt{2} \\approx 0.707 V_0', 'V_rms = \\sqrt{2} V_0', 'V_rms = V_0 / 2', 'V_rms = 2 V_0 / \\pi'],
    correct: 0,
    explain: 'The root-mean-square value of a sinusoidal wave is V_rms = V_0 / \\sqrt{2} \\approx 0.707 V_0.'
  },
  {
    id: 'tcat-phy-ac-2',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Easy',
    q: 'In a purely inductive AC circuit, the voltage:',
    options: ['Leads the current by 90° (\\pi/2)', 'Lags the current by 90° (\\pi/2)', 'Is in phase with current', 'Leads the current by 180°'],
    correct: 0,
    explain: 'In a pure inductor, induced back-emf opposes current rise, so voltage leads current by 90° (\\pi/2 rad).'
  },
  {
    id: 'tcat-phy-ac-3',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Medium',
    q: 'What is the resonance frequency f_r of a series RLC circuit with L = 0.1 H and C = 10 \\mu F?',
    options: ['(500 / \\pi) Hz \\approx 159 Hz', '1000 Hz', '(1000 / \\pi) Hz', '50 Hz'],
    correct: 0,
    explain: '\\omega_r = 1 / \\sqrt{LC} = 1 / \\sqrt{0.1 × 10 × 10^{-6}} = 1 / \\sqrt{10^{-6}} = 1000 rad/s. f_r = \\omega_r / (2\\pi) = 1000 / (2\\pi) = 500 / \\pi Hz \\approx 159 Hz.'
  },
  {
    id: 'tcat-phy-ac-4',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Medium',
    q: 'What is the capacitive reactance X_C of a capacitor of capacitance C in a circuit of frequency f?',
    options: ['1 / (2\\pi f C)', '2\\pi f C', '2\\pi f / C', 'C / (2\\pi f)'],
    correct: 0,
    explain: 'Capacitive reactance is inversely proportional to frequency and capacitance: X_C = 1 / (\\omega C) = 1 / (2\\pi f C).'
  },
  {
    id: 'tcat-phy-ac-5',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Hard',
    q: 'A series RLC circuit has R = 30 \\Omega, inductive reactance X_L = 80 \\Omega, and capacitive reactance X_C = 40 \\Omega. What is the total impedance Z of the circuit?',
    options: ['50 \\Omega', '70 \\Omega', '150 \\Omega', '30 \\Omega'],
    correct: 0,
    explain: 'Z = \\sqrt{R^2 + (X_L - X_C)^2} = \\sqrt{30^2 + (80 - 40)^2} = \\sqrt{30^2 + 40^2} = \\sqrt{900 + 1600} = \\sqrt{2500} = 50 \\Omega.'
  },

  // ==========================================
  // Chapter 15: Electromagnetic Waves (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-emw-1',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Easy',
    q: 'In free space, all electromagnetic waves travel with a speed of:',
    options: ['3.0 × 10^8 m/s', '3.0 × 10^6 m/s', '340 m/s', 'Infinite speed'],
    correct: 0,
    explain: 'c = 1 / \\sqrt{\\mu_0 \\epsilon_0} \\approx 3.0 × 10^8 m/s in vacuum regardless of frequency.'
  },
  {
    id: 'tcat-phy-emw-2',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Easy',
    q: 'Which type of electromagnetic radiation has the shortest wavelength and highest photon energy?',
    options: ['Gamma rays', 'X-rays', 'Ultraviolet', 'Radio waves'],
    correct: 0,
    explain: 'Gamma rays occupy the highest frequency (shortest wavelength, \\lambda < 10^{-11} m) portion of the electromagnetic spectrum.'
  },
  {
    id: 'tcat-phy-emw-3',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Medium',
    q: 'What is the phase difference between electric field E and magnetic field B vectors in a propagating electromagnetic wave in free space?',
    options: ['0° (They oscillate in phase)', '90°', '180°', '45°'],
    correct: 0,
    explain: 'Although E and B oscillate in mutually perpendicular spatial planes, their sinusoidal oscillations are in phase (reaching peaks and zeros simultaneously).'
  },
  {
    id: 'tcat-phy-emw-4',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Medium',
    q: 'What is the wavelength of an FM radio wave transmitted at 100 MHz in vacuum?',
    options: ['3.0 m', '30 m', '0.33 m', '300 m'],
    correct: 0,
    explain: '\\lambda = c / f = (3.0 × 10^8 m/s) / (100 × 10^6 s^{-1}) = 3.0 m.'
  },
  {
    id: 'tcat-phy-emw-5',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Hard',
    q: 'The Poynting vector S represents the directional energy flux density of an EM wave and is defined as:',
    options: ['S = (1 / \\mu_0) (E × B)', 'S = \\mu_0 (E × B)', 'S = E · B', 'S = \\epsilon_0 (E × B)'],
    correct: 0,
    explain: 'The Poynting vector S = (1/\\mu_0)(E × B) gives the rate of energy transfer per unit area (W/m^2) in the direction of wave propagation.'
  },

  // ==========================================
  // Chapter 16: Physics of Solids (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-pos-1',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Easy',
    q: 'What is the SI unit of Young Modulus of elasticity?',
    options: ['Pascal (Pa) or N/m^2', 'Newton (N)', 'Joule (J)', 'Dimensionless'],
    correct: 0,
    explain: 'Young modulus Y = Tensile Stress / Tensile Strain. Since strain is dimensionless, Y has the units of stress (N/m^2 or Pa).'
  },
  {
    id: 'tcat-phy-pos-2',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Easy',
    q: 'Substances like glass and plastics which do not have a regular periodic atomic arrangement are called:',
    options: ['Amorphous solids', 'Crystalline solids', 'Polycrystalline solids', 'Superconductors'],
    correct: 0,
    explain: 'Amorphous (glassy) solids lack long-range periodic lattice order, unlike crystalline solids.'
  },
  {
    id: 'tcat-phy-pos-3',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Medium',
    q: 'According to Energy Band Theory, in an electrical insulator the forbidden energy gap between valence band and conduction band is typically:',
    options: ['Very wide (> 3 to 6 eV)', 'Zero (bands overlap)', 'Very narrow (< 1 eV)', 'Negative'],
    correct: 0,
    explain: 'Insulators have a completely filled valence band, an empty conduction band, and a wide forbidden energy gap (Eg > 3 to 6 eV) preventing thermal excitation of electrons.'
  },
  {
    id: 'tcat-phy-pos-4',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Medium',
    q: 'A wire of length L and cross-sectional area A is stretched by force F to produce elongation \\Delta L. The strain energy stored per unit volume is:',
    options: ['(1/2) × Stress × Strain', 'Stress × Strain', '(1/2) × Stress / Strain', 'Stress^2 × Strain'],
    correct: 0,
    explain: 'Strain energy per unit volume = (1/2) × stress × strain = (1/2) Y (strain)^2.'
  },
  {
    id: 'tcat-phy-pos-5',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Hard',
    q: 'The critical temperature Tc below which mercury completely loses its electrical resistance (superconductivity) is:',
    options: ['4.2 K', '77 K', '0 K', '273 K'],
    correct: 0,
    explain: 'Heike Kamerlingh Onnes discovered superconductivity in mercury at 4.2 K in 1911.'
  },

  // ==========================================
  // Chapter 17: Electronics (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-elec-1',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Easy',
    q: 'How many diodes are required to construct a full-wave bridge rectifier?',
    options: ['4', '2', '1', '6'],
    correct: 0,
    explain: 'A bridge rectifier uses 4 diodes arranged in a closed ring bridge configuration to rectify both halves of the AC cycle without requiring a center-tapped transformer.'
  },
  {
    id: 'tcat-phy-elec-2',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Easy',
    q: 'In an n-type semiconductor, the majority charge carriers are:',
    options: ['Free electrons', 'Holes', 'Positive ions', 'Neutrons'],
    correct: 0,
    explain: 'Doping pure silicon or germanium with pentavalent donor atoms (e.g., Phosphorus) provides excess free electrons as majority carriers.'
  },
  {
    id: 'tcat-phy-elec-3',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Medium',
    q: 'What is the voltage gain of an inverting Operational Amplifier (Op-Amp) circuit with input resistor R1 and feedback resistor Rf?',
    options: ['-Rf / R1', '1 + (Rf / R1)', '-R1 / Rf', 'Rf / (R1 + Rf)'],
    correct: 0,
    explain: 'For an inverting op-amp configuration, the closed-loop voltage gain is G = -Rf / R1.'
  },
  {
    id: 'tcat-phy-elec-4',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Medium',
    q: 'For a bipolar junction transistor (BJT), what is the relationship between collector current Ic, base current Ib, and emitter current Ie?',
    options: ['Ie = Ib + Ic', 'Ic = Ib + Ie', 'Ib = Ic + Ie', 'Ie = Ic - Ib'],
    correct: 0,
    explain: 'By Kirchhoff Current Law at the transistor terminals: Ie = Ib + Ic. Because Ib is typically very small (< 5%), Ie \\approx Ic.'
  },
  {
    id: 'tcat-phy-elec-5',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Hard',
    q: 'What is the ideal input impedance and open-loop voltage gain of a standard operational amplifier?',
    options: ['Input impedance = \\infty, Open-loop gain = \\infty', 'Input impedance = 0, Open-loop gain = 1', 'Input impedance = 50 \\Omega, Open-loop gain = 1000', 'Input impedance = \\infty, Open-loop gain = 0'],
    correct: 0,
    explain: 'An ideal Op-Amp possesses infinite input impedance (Rin = \\infty, drawing zero input current) and infinite open-loop gain (A_OL = \\infty).'
  },

  // ==========================================
  // Chapter 18: Dawn of Modern Physics (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-dmp-1',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Easy',
    q: 'In the photoelectric effect, the maximum kinetic energy of emitted photoelectrons depends on the:',
    options: ['Frequency of incident light', 'Intensity of incident light', 'Time of exposure', 'Distance of source'],
    correct: 0,
    explain: 'Einstein photoelectric equation KE_max = hf - \\Phi shows that electron energy depends solely on the frequency f of incident photons, while intensity determines the rate of emission.'
  },
  {
    id: 'tcat-phy-dmp-2',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Easy',
    q: 'What is the de Broglie wavelength \\lambda of a particle with linear momentum p?',
    options: ['h / p', 'p / h', 'h · p', 'h / \\sqrt{p}'],
    correct: 0,
    explain: 'Louis de Broglie proposed the matter-wave relation \\lambda = h / p = h / (mv).'
  },
  {
    id: 'tcat-phy-dmp-3',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Medium',
    q: 'What is the Compton wavelength of an electron (\\lambda_c = h / (m_0 c))?',
    options: ['2.43 × 10^{-12} m (0.0243 Å)', '1.05 × 10^{-10} m', '5.29 × 10^{-11} m', '6.63 × 10^{-34} m'],
    correct: 0,
    explain: '\\lambda_c = h / (m_0 c) = 6.63 × 10^{-34} / (9.11 × 10^{-31} × 3.0 × 10^8) \\approx 2.426 × 10^{-12} m = 0.0243 Å.'
  },
  {
    id: 'tcat-phy-dmp-4',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Medium',
    q: 'What is the minimum photon energy required to produce an electron-positron pair in pair production?',
    options: ['1.02 MeV', '0.51 MeV', '2.04 MeV', '13.6 eV'],
    correct: 0,
    explain: 'Rest energy of an electron or positron is m0 c^2 = 0.511 MeV. For pair production, the minimum photon energy is 2 m0 c^2 = 2 × 0.511 = 1.022 MeV.'
  },
  {
    id: 'tcat-phy-dmp-5',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Hard',
    q: 'According to Special Relativity, if a spaceship travels at speed v = 0.8 c relative to an observer, by what factor is its length contracted in the direction of motion?',
    options: ['0.6 (or 60%)', '0.8', '0.64', '0.5'],
    correct: 0,
    explain: 'Lorentz factor \\gamma = 1 / \\sqrt{1 - (v/c)^2} = 1 / \\sqrt{1 - 0.64} = 1 / \\sqrt{0.36} = 1 / 0.6. Length L = L0 / \\gamma = 0.6 L0.'
  },

  // ==========================================
  // Chapter 19: Atomic Spectra (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-as-1',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Easy',
    q: 'Which spectral series of the hydrogen atom lies entirely within the visible light region?',
    options: ['Balmer series', 'Lyman series', 'Paschen series', 'Brackett series'],
    correct: 0,
    explain: 'Transitions ending at principal quantum number n = 2 form the Balmer series, which lies in the visible spectrum. (Lyman lies in UV; Paschen, Brackett, and Pfund in IR).'
  },
  {
    id: 'tcat-phy-as-2',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Easy',
    q: 'What is the ionization energy of the hydrogen atom from its ground state (n = 1)?',
    options: ['13.6 eV', '3.4 eV', '1.51 eV', '10.2 eV'],
    correct: 0,
    explain: 'Ground state energy E1 = -13.6 eV. To ionize the atom (reach n = \\infty, E = 0), energy required is 0 - (-13.6) = +13.6 eV.'
  },
  {
    id: 'tcat-phy-as-3',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Medium',
    q: 'According to Bohr model, the orbital angular momentum L of an electron in an orbit is quantized as:',
    options: ['n h / (2\\pi)', 'n h / \\pi', '2\\pi / (n h)', 'n^2 h / (2\\pi)'],
    correct: 0,
    explain: 'Bohr quantization condition states m v r = n \\hbar = n h / (2\\pi), where n = 1, 2, 3, ...'
  },
  {
    id: 'tcat-phy-as-4',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Medium',
    q: 'What is the radius of the first Bohr orbit (n = 1) of the hydrogen atom?',
    options: ['0.053 nm (0.53 Å)', '0.106 nm', '0.53 nm', '1.0 Å'],
    correct: 0,
    explain: 'r1 = h^2 \\epsilon_0 / (\\pi m e^2) \\approx 0.529 × 10^{-10} m = 0.053 nm = 0.53 Å.'
  },
  {
    id: 'tcat-phy-as-5',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Hard',
    q: 'What is the wavelength of radiation emitted when an electron in a hydrogen atom transitions from n = 3 to n = 2 (Balmer H-\\alpha line, R_H = 1.097 × 10^7 m^{-1})?',
    options: ['656 nm', '486 nm', '434 nm', '121 nm'],
    correct: 0,
    explain: '1/\\lambda = R_H (1/2^2 - 1/3^2) = R_H (1/4 - 1/9) = R_H (5/36). \\lambda = 36 / (5 × 1.097 × 10^7) \\approx 6.56 × 10^{-7} m = 656 nm (red line).'
  },

  // ==========================================
  // Chapter 20: Nuclear Physics (5 MCQs)
  // ==========================================
  {
    id: 'tcat-phy-np-1',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Easy',
    q: 'What does an alpha particle (\\alpha) consist of?',
    options: ['2 protons and 2 neutrons (Helium-4 nucleus)', '1 proton and 1 neutron', '4 protons', '2 electrons and 2 protons'],
    correct: 0,
    explain: 'An alpha particle is a doubly ionized Helium nucleus (_2^4He^{2+}) consisting of 2 protons and 2 neutrons.'
  },
  {
    id: 'tcat-phy-np-2',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Easy',
    q: 'What is the relationship between the half-life T_{1/2} and decay constant \\lambda of a radioactive substance?',
    options: ['T_{1/2} = 0.693 / \\lambda', 'T_{1/2} = \\lambda / 0.693', 'T_{1/2} = 0.693 · \\lambda', 'T_{1/2} = 1 / \\lambda'],
    correct: 0,
    explain: 'T_{1/2} = \\ln(2) / \\lambda \\approx 0.693 / \\lambda.'
  },
  {
    id: 'tcat-phy-np-3',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Medium',
    q: 'A radioactive sample has a half-life of 10 days. What fraction of the original active nuclei remains undecayed after 30 days?',
    options: ['1/8 (12.5%)', '1/4 (25%)', '1/16 (6.25%)', '1/6 (16.7%)'],
    correct: 0,
    explain: 'Number of half-lives n = t / T_{1/2} = 30 / 10 = 3. Remaining fraction = (1/2)^n = (1/2)^3 = 1/8 = 12.5%.'
  },
  {
    id: 'tcat-phy-np-4',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Medium',
    q: 'How much energy is released when 1 unified atomic mass unit (1 u) is completely converted into energy (c = 3 × 10^8 m/s)?',
    options: ['931.5 MeV', '0.511 MeV', '13.6 MeV', '1.02 MeV'],
    correct: 0,
    explain: 'E = m c^2. 1 u = 1.6605 × 10^{-27} kg. E = (1.6605 × 10^{-27})(3 × 10^8)^2 J / (1.602 × 10^{-13} J/MeV) \\approx 931.5 MeV.'
  },
  {
    id: 'tcat-phy-np-5',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Hard',
    q: 'In the nuclear fission of Uranium-235 triggered by a thermal neutron, what is the approximate average energy released per fission event?',
    options: ['200 MeV', '20 MeV', '1000 MeV', '8 MeV'],
    correct: 0,
    explain: 'Each Uranium-235 fission event releases approximately 200 MeV of energy, primarily in the form of kinetic energy of the fission fragments.'
  }
];

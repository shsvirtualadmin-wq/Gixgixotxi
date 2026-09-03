import { Question } from '../src/types';

export const BATCH2_PHYSICS: Question[] = [
  // =========================================================
  // Chapter 1: Measurements (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-meas-6',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Easy',
    q: 'Which of the following is an SI base unit?',
    options: ['Kelvin', 'Joule', 'Newton', 'Coulomb'],
    correct: 0,
    explain: 'The seven SI base units are meter, kilogram, second, ampere, kelvin, mole, and candela. Joule, Newton, and Coulomb are derived units.'
  },
  {
    id: 'tcat-phy-meas-7',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Easy',
    q: 'A solid angle subtended at the center of a sphere by an area of its surface equal to the square of its radius is called:',
    options: ['1 steradian', '1 radian', '1 degree', '1 revolution'],
    correct: 0,
    explain: 'One steradian (sr) is the supplementary SI unit of solid angle subtended at the center of a sphere of radius r by a surface area of r^2.'
  },
  {
    id: 'tcat-phy-meas-8',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Medium',
    q: 'What are the dimensions of Planck\'s constant h?',
    options: ['[M L^2 T^(-1)]', '[M L T^(-1)]', '[M L^2 T^(-2)]', '[M L^(-1) T^(-2)]'],
    correct: 0,
    explain: 'E = h*nu => h = E / nu = [M L^2 T^(-2)] / [T^(-1)] = [M L^2 T^(-1)]. These are the same dimensions as angular momentum.'
  },
  {
    id: 'tcat-phy-meas-9',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Hard',
    q: 'If density is calculated from mass m and length L of a cube as rho = m / L^3, where uncertainty in m is 1.5% and in L is 1%, what is the percentage uncertainty in density?',
    options: ['4.5%', '2.5%', '3.0%', '5.5%'],
    correct: 0,
    explain: '% uncertainty in rho = (% uncertainty in m) + 3 * (% uncertainty in L) = 1.5% + 3(1.0%) = 4.5%.'
  },
  {
    id: 'tcat-phy-meas-10',
    subject: 'Physics',
    topic: 'Measurements',
    difficulty: 'Hard',
    q: 'Which pair of physical quantities possesses identical dimensional formulas?',
    options: ['Work and Torque', 'Impulse and Force', 'Stress and Strain', 'Power and Energy'],
    correct: 0,
    explain: 'Work = Force * distance = [M L^2 T^(-2)]. Torque = Force * lever arm = [M L^2 T^(-2)]. Both have identical dimensions.'
  },

  // =========================================================
  // Chapter 2: Vectors and Equilibrium (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-ve-6',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Easy',
    q: 'A body is said to be in complete mechanical equilibrium when which conditions are fulfilled?',
    options: [
      'Both net external force and net external torque are zero',
      'Only net external force is zero',
      'Only net external torque is zero',
      'Body is completely at rest with zero velocity'
    ],
    correct: 0,
    explain: 'Complete mechanical equilibrium requires translational equilibrium (Sigma F = 0) and rotational equilibrium (Sigma tau = 0).'
  },
  {
    id: 'tcat-phy-ve-7',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Medium',
    q: 'Two forces of magnitudes 10 N and 10 N act at an angle of 120° to each other. What is the magnitude of their resultant force?',
    options: ['10 N', '20 N', '10*sqrt(3) N', '0 N'],
    correct: 0,
    explain: 'R = sqrt(F1^2 + F2^2 + 2*F1*F2*cos(120°)) = sqrt(100 + 100 + 2(100)(-0.5)) = sqrt(200 - 100) = sqrt(100) = 10 N.'
  },
  {
    id: 'tcat-phy-ve-8',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Medium',
    q: 'What is the torque produced by a force F = 3i + 2j - k acting at a point whose position vector is r = i - j + 2k about the origin?',
    options: ['-3i + 7j + 5k', '3i - 7j - 5k', '-3i - 7j + 5k', 'i + 3j - 4k'],
    correct: 0,
    explain: 'tau = r x F = det([[i, j, k], [1, -1, 2], [3, 2, -1]]) = i(1 - 4) - j(-1 - 6) + k(2 - (-3)) = -3i + 7j + 5k.'
  },
  {
    id: 'tcat-phy-ve-9',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Hard',
    q: 'A couple consists of two forces that are:',
    options: [
      'Equal in magnitude, opposite in direction, with non-coincident lines of action',
      'Equal in magnitude and acting along the same line in opposite directions',
      'Unequal in magnitude acting in opposite directions',
      'Perpendicular to each other producing zero torque'
    ],
    correct: 0,
    explain: 'A couple is formed by two equal and opposite parallel forces whose lines of action do not coincide, producing pure rotation with net force zero.'
  },
  {
    id: 'tcat-phy-ve-10',
    subject: 'Physics',
    topic: 'Vectors and Equilibrium',
    difficulty: 'Hard',
    q: 'Lami\'s Theorem for three coplanar forces in equilibrium P, Q, and R opposite to angles alpha, beta, and gamma states:',
    options: [
      'P/sin(alpha) = Q/sin(beta) = R/sin(gamma)',
      'P/cos(alpha) = Q/cos(beta) = R/cos(gamma)',
      'P*sin(alpha) = Q*sin(beta) = R*sin(gamma)',
      'P + Q + R = sin(alpha) + sin(beta) + sin(gamma)'
    ],
    correct: 0,
    explain: 'Lami\'s theorem states that for three concurrent forces in equilibrium, each force magnitude is proportional to the sine of the angle between the other two forces.'
  },

  // =========================================================
  // Chapter 3: Motion and Force (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-mf-6',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Easy',
    q: 'What does the slope of a velocity-time (v-t) graph represent at any given instant?',
    options: ['Instantaneous acceleration', 'Total displacement', 'Instantaneous momentum', 'Instantaneous speed'],
    correct: 0,
    explain: 'The derivative of velocity with respect to time, a = dv/dt, corresponds geometrically to the slope of the v-t graph.'
  },
  {
    id: 'tcat-phy-mf-7',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Medium',
    q: 'In an elastic collision between two bodies in an isolated system, which quantities are conserved?',
    options: [
      'Both total linear momentum and total kinetic energy',
      'Total linear momentum only',
      'Total kinetic energy only',
      'Neither momentum nor kinetic energy'
    ],
    correct: 0,
    explain: 'By definition, an elastic collision conserves both the total linear momentum and the total kinetic energy of the system.'
  },
  {
    id: 'tcat-phy-mf-8',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Hard',
    q: 'A projectile is launched with speed v0 at angle theta to the horizontal. What is its maximum vertical height H?',
    options: ['(v0^2 * sin^2(theta)) / (2g)', '(v0^2 * sin(2*theta)) / g', '(v0 * sin(theta)) / g', '(v0^2 * cos^2(theta)) / (2g)'],
    correct: 0,
    explain: 'At peak height vy = 0. Using vy^2 = (v0*sin(theta))^2 - 2gH => H = (v0^2 * sin^2(theta)) / (2g).'
  },
  {
    id: 'tcat-phy-mf-9',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Hard',
    q: 'A rocket of initial mass M ejects fuel gases at a constant relative exhaust velocity v_rel at a burn rate -dM/dt. What is the instantaneous rocket thrust force?',
    options: ['-v_rel * (dM/dt)', 'M * v_rel', '(1/2) * (dM/dt) * v_rel^2', '-M * (dv/dt)'],
    correct: 0,
    explain: 'Thrust force on a variable mass system is given by F = -v_rel * (dM/dt), where -dM/dt is the mass consumption rate.'
  },
  {
    id: 'tcat-phy-mf-10',
    subject: 'Physics',
    topic: 'Motion and Force',
    difficulty: 'Hard',
    q: 'An elevator of total mass 1000 kg accelerates downwards at 2 m/s^2. Taking g = 9.8 m/s^2, what is the tension in the supporting cable?',
    options: ['7800 N', '9800 N', '11800 N', '2000 N'],
    correct: 0,
    explain: 'For downward acceleration: mg - T = ma => T = m(g - a) = 1000 * (9.8 - 2.0) = 1000 * 7.8 = 7800 N.'
  },

  // =========================================================
  // Chapter 4: Work and Energy (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-we-6',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Easy',
    q: 'What is the work done by the centripetal force on an object moving along a circular path of radius R?',
    options: ['Zero', 'F_c * 2*pi*R', '(1/2) * m * v^2', 'F_c * R'],
    correct: 0,
    explain: 'Centripetal force is always perpendicular to the instantaneous displacement vector (theta = 90°), so W = F * d * cos(90°) = 0.'
  },
  {
    id: 'tcat-phy-we-7',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Medium',
    q: 'What is the absolute gravitational potential energy of a body of mass m located on Earth\'s surface (radius R, Earth mass M)?',
    options: ['-G*M*m / R', 'G*M*m / R', '-G*M*m / R^2', 'm*g*R'],
    correct: 0,
    explain: 'Taking reference point U = 0 at infinity, gravitational potential energy on the surface is U = -G*M*m / R.'
  },
  {
    id: 'tcat-phy-we-8',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Medium',
    q: 'An electric motor with 80% efficiency delivers 4 kW of useful mechanical output power. What is its input electrical power?',
    options: ['5 kW', '3.2 kW', '4.8 kW', '6 kW'],
    correct: 0,
    explain: 'Efficiency = Output / Input => Input = Output / Efficiency = 4 kW / 0.80 = 5 kW.'
  },
  {
    id: 'tcat-phy-we-9',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Hard',
    q: 'If the kinetic energy of a moving particle increases by 300%, by what percentage does its linear momentum increase?',
    options: ['100%', '300%', '200%', '50%'],
    correct: 0,
    explain: 'p = sqrt(2m*KE). If KE increases by 300%, new KE\' = 4*KE. New p\' = sqrt(4)*p = 2p. Percentage increase in momentum = (2p - p)/p * 100% = 100%.'
  },
  {
    id: 'tcat-phy-we-10',
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'Hard',
    q: 'What is the relationship between power P, force F, and constant velocity v when force is applied in the direction of motion?',
    options: ['P = F · v', 'P = F / v', 'P = F · v^2', 'P = (1/2) F · v'],
    correct: 0,
    explain: 'P = dW/dt = F · (dr/dt) = F · v.'
  },

  // =========================================================
  // Chapter 5: Circular Motion (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-cm-6',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Easy',
    q: 'How many radians are contained in one complete revolution?',
    options: ['2*pi radians', 'pi radians', 'pi/2 radians', '4*pi radians'],
    correct: 0,
    explain: 'One full circle (360°) corresponds to 2*pi radians.'
  },
  {
    id: 'tcat-phy-cm-7',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Medium',
    q: 'What is the relationship between angular acceleration alpha and tangential acceleration a_t of a rotating body of radius r?',
    options: ['a_t = r * alpha', 'alpha = r * a_t', 'a_t = r * alpha^2', 'a_t = r^2 * alpha'],
    correct: 0,
    explain: 'Tangential acceleration a_t is directly related to angular acceleration by a_t = r * alpha.'
  },
  {
    id: 'tcat-phy-cm-8',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Hard',
    q: 'A solid cylinder (mass M, radius R) and a thin hollow hoop of identical mass and radius roll down the same inclined plane without slipping. Which reaches the bottom first?',
    options: [
      'The solid cylinder',
      'The thin hollow hoop',
      'Both reach at exactly the same time',
      'Depends on the mass M of the objects'
    ],
    correct: 0,
    explain: 'Solid cylinder has I = (1/2)MR^2, hoop has I = MR^2. Smaller moment of inertia means greater linear acceleration a = g*sin(theta) / (1 + I/(MR^2)). Hence cylinder reaches first.'
  },
  {
    id: 'tcat-phy-cm-9',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Hard',
    q: 'What is the rotational kinetic energy of a body having moment of inertia I spinning with angular velocity omega?',
    options: ['(1/2) * I * omega^2', 'I * omega', '(1/2) * I^2 * omega', 'I * omega^2'],
    correct: 0,
    explain: 'Rotational kinetic energy is KE_rot = (1/2) * I * omega^2, analogous to translational KE = (1/2) * m * v^2.'
  },
  {
    id: 'tcat-phy-cm-10',
    subject: 'Physics',
    topic: 'Circular Motion',
    difficulty: 'Hard',
    q: 'If a spinning ice skater pulls her arms inward, her moment of inertia decreases by half. What happens to her angular velocity?',
    options: ['Doubles', 'Halves', 'Quadruples', 'Remains unchanged'],
    correct: 0,
    explain: 'By conservation of angular momentum L = I * omega. If I decreases to I/2, omega must double so that L remains constant.'
  },

  // =========================================================
  // Chapter 6: Fluid Dynamics (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-fd-6',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Easy',
    q: 'A fluid whose density remains constant under changing pressure is classified as:',
    options: ['Incompressible fluid', 'Non-viscous fluid', 'Compressible fluid', 'Turbulent fluid'],
    correct: 0,
    explain: 'An incompressible fluid has a constant density rho regardless of the pressure applied.'
  },
  {
    id: 'tcat-phy-fd-7',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Easy',
    q: 'Stokes\' Law states that the viscous drag force F_d on a spherical particle of radius r moving at speed v in a fluid of viscosity eta is:',
    options: ['6 * pi * eta * r * v', '4 * pi * eta * r * v', '6 * pi * eta * r^2 * v', '(1/2) * C_d * rho * A * v^2'],
    correct: 0,
    explain: 'Stokes\' Law for viscous drag on a sphere in laminar flow is F_d = 6*pi*eta*r*v.'
  },
  {
    id: 'tcat-phy-fd-8',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Medium',
    q: 'According to Torricelli\'s theorem, the speed of efflux v of water discharging from a small orifice at depth h below the open surface is:',
    options: ['sqrt(2 * g * h)', '2 * g * h', 'sqrt(g * h)', '(1/2) * g * h'],
    correct: 0,
    explain: 'Torricelli\'s theorem shows efflux speed v = sqrt(2gh), identical to the speed acquired by an object falling freely from height h.'
  },
  {
    id: 'tcat-phy-fd-9',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Hard',
    q: 'What is the physical principle underlying the dynamic lift generated on an airplane wing (aerofoil)?',
    options: ['Bernoulli\'s principle', 'Archimedes\' principle', 'Pascal\'s law', 'Newton\'s law of cooling'],
    correct: 0,
    explain: 'Air travels faster over the curved upper surface of an aerofoil, creating lower pressure above than below according to Bernoulli\'s principle, generating net upward lift.'
  },
  {
    id: 'tcat-phy-fd-10',
    subject: 'Physics',
    topic: 'Fluid Dynamics',
    difficulty: 'Hard',
    q: 'How does the terminal velocity v_t of a dense sphere falling through a viscous fluid scale with its radius r?',
    options: ['v_t is directly proportional to r^2', 'v_t is directly proportional to r', 'v_t is inversely proportional to r', 'v_t is independent of r'],
    correct: 0,
    explain: 'Equating weight (proportional to r^3) to Stokes drag (proportional to r*v_t): r^3 ~ r*v_t => v_t ~ r^2.'
  },

  // =========================================================
  // Chapter 7: Oscillations (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-osc-6',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Easy',
    q: 'What is the relationship between frequency f and time period T of an oscillating system?',
    options: ['f = 1 / T', 'f = T', 'f = 2*pi*T', 'f = sqrt(T)'],
    correct: 0,
    explain: 'Frequency is the reciprocal of the period: f = 1 / T.'
  },
  {
    id: 'tcat-phy-osc-7',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Medium',
    q: 'What is the total mechanical energy of an oscillating mass-spring system having spring constant k and amplitude x0?',
    options: ['(1/2) * k * x0^2', 'k * x0^2', '(1/2) * m * x0^2', '(1/4) * k * x0^2'],
    correct: 0,
    explain: 'Total mechanical energy in simple harmonic motion is conserved and equals E = (1/2) * k * x0^2.'
  },
  {
    id: 'tcat-phy-osc-8',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Medium',
    q: 'When a simple pendulum is taken from Earth\'s surface to the Moon (where g_moon = g_earth / 6), its time period will:',
    options: ['Increase by a factor of sqrt(6)', 'Decrease by a factor of 6', 'Increase by a factor of 6', 'Remain unchanged'],
    correct: 0,
    explain: 'T = 2*pi*sqrt(L/g). If g decreases to g/6, T increases by sqrt(6).'
  },
  {
    id: 'tcat-phy-osc-9',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Hard',
    q: 'What is the phase difference between displacement and acceleration in Simple Harmonic Motion (SHM)?',
    options: ['pi radians (180°)', 'pi/2 radians (90°)', 'Zero radians', '2*pi radians (360°)'],
    correct: 0,
    explain: 'In SHM, a = -omega^2 * x. The negative sign represents a phase shift of pi radians (180°).'
  },
  {
    id: 'tcat-phy-osc-10',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Hard',
    q: 'Sharp resonance in a driven harmonic oscillator occurs when the damping force is:',
    options: ['Extremely small or zero', 'Very large (heavily damped)', 'Equal to spring constant', 'Critical'],
    correct: 0,
    explain: 'With smaller damping, the resonance response peak becomes significantly taller and narrower (sharp resonance).'
  },

  // =========================================================
  // Chapter 8: Waves (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-wav-6',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Easy',
    q: 'Sound waves traveling through air are classified as which type of wave?',
    options: ['Longitudinal mechanical waves', 'Transverse electromagnetic waves', 'Transverse mechanical waves', 'Torsional waves'],
    correct: 0,
    explain: 'Sound waves in air propagate through alternating compressions and rarefactions parallel to the wave motion, which defines longitudinal waves.'
  },
  {
    id: 'tcat-phy-wav-7',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Easy',
    q: 'What is the fundamental wave equation relating speed v, frequency f, and wavelength lambda?',
    options: ['v = f * lambda', 'v = f / lambda', 'v = lambda / f', 'v = f^2 * lambda'],
    correct: 0,
    explain: 'Wave speed equals frequency multiplied by wavelength: v = f * lambda.'
  },
  {
    id: 'tcat-phy-wav-8',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Medium',
    q: 'For an organ pipe of length L open at both ends, what is the fundamental frequency f1 (where v is speed of sound)?',
    options: ['v / (2L)', 'v / (4L)', '2v / L', 'v / L'],
    correct: 0,
    explain: 'An open pipe has antinodes at both ends, with fundamental wavelength lambda = 2L, so f1 = v / (2L).'
  },
  {
    id: 'tcat-phy-wav-9',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Hard',
    q: 'When a sound source of frequency f moves towards a stationary observer with speed u_s (where v is sound speed), the observed frequency f\' is:',
    options: ['f * [v / (v - u_s)]', 'f * [v / (v + u_s)]', 'f * [(v - u_s) / v]', 'f * [(v + u_s) / v]'],
    correct: 0,
    explain: 'Due to Doppler effect, as source approaches observer, perceived wavelength compresses: f\' = f * [v / (v - u_s)].'
  },
  {
    id: 'tcat-phy-wav-10',
    subject: 'Physics',
    topic: 'Waves',
    difficulty: 'Hard',
    q: 'If the tension in a stretched vibrating string is quadrupled, how does the propagation speed of transverse waves change?',
    options: ['Doubles', 'Quadruples', 'Halves', 'Remains unchanged'],
    correct: 0,
    explain: 'Wave speed v = sqrt(T / mu). If tension T is multiplied by 4, v is multiplied by sqrt(4) = 2.'
  },

  // =========================================================
  // Chapter 9: Thermodynamics (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-th-6',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Easy',
    q: 'Which thermodynamic process takes place at constant volume?',
    options: ['Isochoric process', 'Isobaric process', 'Isothermal process', 'Adiabatic process'],
    correct: 0,
    explain: 'An isochoric (or isometric) process occurs at constant volume (dV = 0), so work done W = P*dV = 0.'
  },
  {
    id: 'tcat-phy-th-7',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Medium',
    q: 'What is the change in internal energy Delta U of an ideal gas undergoing a cyclic thermodynamic process?',
    options: ['Zero', 'Positive', 'Negative', 'Equal to total work done'],
    correct: 0,
    explain: 'Internal energy is a state function. For any complete thermodynamic cycle, initial and final states are identical, so Delta U = 0.'
  },
  {
    id: 'tcat-phy-th-8',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Medium',
    q: 'What is the efficiency of a Carnot engine operating between 500 K and 300 K?',
    options: ['40%', '60%', '20%', '50%'],
    correct: 0,
    explain: 'Efficiency eta = 1 - (T_cold / T_hot) = 1 - (300 / 500) = 1 - 0.60 = 0.40 or 40%.'
  },
  {
    id: 'tcat-phy-th-9',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Hard',
    q: 'During an adiabatic process for an ideal gas, which equation represents the relationship between pressure P and volume V?',
    options: ['P * V^gamma = constant', 'P * V = constant', 'P / V^gamma = constant', 'V / T = constant'],
    correct: 0,
    explain: 'For a reversible adiabatic process of an ideal gas, P * V^gamma = constant, where gamma = Cp / Cv.'
  },
  {
    id: 'tcat-phy-th-10',
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'Hard',
    q: 'According to the Second Law of Thermodynamics, in any natural spontaneous process, the total entropy of the universe:',
    options: ['Always increases', 'Always decreases', 'Remains strictly constant', 'Becomes zero at equilibrium'],
    correct: 0,
    explain: 'The entropy of an isolated system (the universe) always increases in irreversible spontaneous processes: Delta S_universe >= 0.'
  },

  // =========================================================
  // Chapter 10: Electrostatics (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-es-6',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Easy',
    q: 'What is the value of Coulomb constant k = 1 / (4*pi*epsilon_0) in SI units?',
    options: ['9 x 10^9 N m^2 / C^2', '8.85 x 10^(-12) C^2 / (N m^2)', '1.6 x 10^(-19) N m^2 / C^2', '6.67 x 10^(-11) N m^2 / C^2'],
    correct: 0,
    explain: 'In free space, k = 1 / (4*pi*epsilon_0) is approximately 8.99 x 10^9 N m^2 / C^2 (commonly 9 x 10^9).'
  },
  {
    id: 'tcat-phy-es-7',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Medium',
    q: 'What is the relationship between electric field intensity E and electric potential V?',
    options: ['E = -dV/dr (negative potential gradient)', 'E = dV/dr', 'E = V * r', 'E = -V / r^2'],
    correct: 0,
    explain: 'Electric field intensity is the negative gradient of electric potential: E = -dV/dr.'
  },
  {
    id: 'tcat-phy-es-8',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Hard',
    q: 'Gauss\'s Law states that total electric flux Phi through any closed surface enclosing net charge Q is:',
    options: ['Q / epsilon_0', 'Q * epsilon_0', '4*pi * Q', 'Q / (4*pi*epsilon_0)'],
    correct: 0,
    explain: 'Gauss\'s Law states that the net outward electric flux through any closed Gaussian surface equals Q_enclosed / epsilon_0.'
  },
  {
    id: 'tcat-phy-es-9',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Hard',
    q: 'What is the electrostatic potential energy U stored in a capacitor of capacitance C charged to voltage V?',
    options: ['(1/2) * C * V^2', 'C * V^2', '(1/2) * C^2 * V', 'Q * V^2'],
    correct: 0,
    explain: 'Energy stored in a capacitor is U = (1/2)*C*V^2 = (1/2)*Q*V = Q^2 / (2C).'
  },
  {
    id: 'tcat-phy-es-10',
    subject: 'Physics',
    topic: 'Electrostatics',
    difficulty: 'Hard',
    q: 'Two point charges +q and -q are separated by distance 2a. What is the electric dipole moment vector p?',
    options: ['q * (2a) directed from -q to +q', 'q * (2a) directed from +q to -q', '2q * a directed radially outward', 'q^2 / (2a) directed perpendicular to axis'],
    correct: 0,
    explain: 'The electric dipole moment has magnitude p = q*(2a) and by physics convention points from negative charge -q to positive charge +q.'
  },

  // =========================================================
  // Chapter 11: Current Electricity (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-ce-6',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Easy',
    q: 'Which law relates potential difference V and current I across an ohmic conductor at constant temperature?',
    options: ['Ohm\'s Law', 'Ampere\'s Law', 'Faraday\'s Law', 'Coulomb\'s Law'],
    correct: 0,
    explain: 'Ohm\'s Law states that V is directly proportional to I across a conductor, provided physical conditions (temperature) remain constant.'
  },
  {
    id: 'tcat-phy-ce-7',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Medium',
    q: 'Kirchhoff\'s Second Rule (loop rule) Sigma V = 0 is a direct manifestation of which conservation law?',
    options: ['Conservation of Energy', 'Conservation of Charge', 'Conservation of Momentum', 'Conservation of Mass'],
    correct: 0,
    explain: 'The sum of potential differences around any closed circuit loop is zero, directly conserving electrical energy.'
  },
  {
    id: 'tcat-phy-ce-8',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Medium',
    q: 'Two resistors of 6 ohms and 12 ohms are connected in parallel. What is their equivalent resistance?',
    options: ['4 ohms', '18 ohms', '8 ohms', '3 ohms'],
    correct: 0,
    explain: '1/R_eq = 1/6 + 1/12 = 3/12 = 1/4 => R_eq = 4 ohms.'
  },
  {
    id: 'tcat-phy-ce-9',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Hard',
    q: 'A potentiometer is preferred over a standard voltmeter for measuring emf of a cell because:',
    options: [
      'It draws zero current from the source at balance point (null condition)',
      'It has very low resistance',
      'It can measure alternating current directly',
      'It is portable and uses no battery'
    ],
    correct: 0,
    explain: 'At null condition, no current flows from the test cell, so there is no internal resistance drop (Ir = 0), yielding exact emf.'
  },
  {
    id: 'tcat-phy-ce-10',
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'Hard',
    q: 'When a wire of original resistance R is uniformly stretched to double its original length, its new electrical resistance becomes:',
    options: ['4R', '2R', 'R/2', 'R/4'],
    correct: 0,
    explain: 'Since volume V = A*L is constant, stretching to 2L halves cross-sectional area to A/2. New R\' = rho*(2L)/(A/2) = 4*rho*L/A = 4R.'
  },

  // =========================================================
  // Chapter 12: Electromagnetism (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-em-6',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Easy',
    q: 'The direction of the magnetic field lines around a straight current-carrying wire is determined by the:',
    options: ['Right-hand grip rule', 'Left-hand rule', 'Lenz\'s law', 'Snell\'s law'],
    correct: 0,
    explain: 'Grasping the wire with thumb pointing in current direction, curled fingers show the concentric magnetic field line direction.'
  },
  {
    id: 'tcat-phy-em-7',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Medium',
    q: 'What is the magnetic force on a charge q moving with velocity v in magnetic field B at an angle of 90°?',
    options: ['q * v * B', 'Zero', 'q * v / B', '(1/2) * q * v * B'],
    correct: 0,
    explain: 'F = q * v * B * sin(theta). When theta = 90°, sin(90°) = 1, so F = q * v * B.'
  },
  {
    id: 'tcat-phy-em-8',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Hard',
    q: 'Ampere\'s Circuital Law states that the line integral of magnetic field B around any closed loop is equal to:',
    options: ['mu_0 * I_enclosed', 'I_enclosed / mu_0', 'mu_0 * epsilon_0 * I', 'B / mu_0'],
    correct: 0,
    explain: 'Ampere\'s Law in magnetostatics states oint B · dl = mu_0 * I_enclosed.'
  },
  {
    id: 'tcat-phy-em-9',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Hard',
    q: 'To convert a sensitive moving coil galvanometer into a voltmeter of range V, what must be connected?',
    options: [
      'A very high resistance in series with the coil',
      'A very low resistance in parallel (shunt)',
      'A low resistance in series',
      'A high resistance in parallel'
    ],
    correct: 0,
    explain: 'A voltmeter requires high total resistance so it draws negligible current; this is achieved by connecting a large multiplier resistance R_h in series.'
  },
  {
    id: 'tcat-phy-em-10',
    subject: 'Physics',
    topic: 'Electromagnetism',
    difficulty: 'Hard',
    q: 'In the velocity selector of J.J. Thomson experiment, an electron experiences mutually perpendicular electric field E and magnetic field B. What is the selected speed v?',
    options: ['E / B', 'B / E', 'E * B', 'sqrt(E / B)'],
    correct: 0,
    explain: 'Zero deflection occurs when electric force qE balances magnetic force qvB: qE = qvB => v = E / B.'
  },

  // =========================================================
  // Chapter 13: Electromagnetic Induction (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-emi-6',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Easy',
    q: 'According to Faraday\'s Law of Electromagnetic Induction, the magnitude of induced emf is directly proportional to:',
    options: [
      'Rate of change of magnetic flux',
      'Total magnetic flux',
      'Area of the coil only',
      'Resistance of the circuit'
    ],
    correct: 0,
    explain: 'Faraday\'s law states emf = -N * (dPhi/dt), proportional to the time rate of change of magnetic flux.'
  },
  {
    id: 'tcat-phy-emi-7',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Medium',
    q: 'What is the energy density (energy per unit volume) stored in the magnetic field B of an inductor in vacuum?',
    options: ['B^2 / (2 * mu_0)', '(1/2) * mu_0 * B^2', 'B / (2 * mu_0)', 'mu_0 * B^2'],
    correct: 0,
    explain: 'Magnetic energy density is u_B = B^2 / (2 * mu_0).'
  },
  {
    id: 'tcat-phy-emi-8',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Hard',
    q: 'Eddy currents induced in the solid iron core of a transformer cause power loss as heat. How is this loss minimized?',
    options: [
      'By using a laminated core of insulated thin sheets',
      'By using a solid copper core',
      'By reducing the primary voltage',
      'By decreasing the frequency to zero'
    ],
    correct: 0,
    explain: 'Laminating the core into thin sheets separated by insulating varnish restricts the circulation loops of eddy currents, minimizing ohmic heat losses.'
  },
  {
    id: 'tcat-phy-emi-9',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Hard',
    q: 'What is the motional emf induced in a conductor of length L moving with velocity v perpendicular to a uniform magnetic field B?',
    options: ['v * B * L', '-v * B / L', '(1/2) * v * B * L', 'v^2 * B * L'],
    correct: 0,
    explain: 'Motional emf is given by epsilon = (v x B) · L. For perpendicular orientation, epsilon = v * B * L.'
  },
  {
    id: 'tcat-phy-emi-10',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    difficulty: 'Hard',
    q: 'In an AC generator with N turns of area A rotating at angular speed omega in field B, what is the peak induced voltage V0?',
    options: ['N * B * A * omega', 'N * B * A / omega', '(1/2) * N * B * A * omega', 'N * B * A'],
    correct: 0,
    explain: 'Flux Phi = BA*cos(omega*t). Emf = -N*(dPhi/dt) = NBA*omega*sin(omega*t). Peak emf is V0 = N * B * A * omega.'
  },

  // =========================================================
  // Chapter 14: Alternating Current (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-ac-6',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Easy',
    q: 'What is the frequency of standard household alternating current in Pakistan?',
    options: ['50 Hz', '60 Hz', '100 Hz', '120 Hz'],
    correct: 0,
    explain: 'Pakistan, like Europe and most of Asia, operates its national electricity grid at a standard frequency of 50 Hz.'
  },
  {
    id: 'tcat-phy-ac-7',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Medium',
    q: 'In a purely capacitive AC circuit, what is the phase relationship between current and voltage?',
    options: [
      'Current leads voltage by 90° (pi/2 radians)',
      'Voltage leads current by 90° (pi/2 radians)',
      'Current and voltage are completely in phase',
      'Current leads voltage by 180°'
    ],
    correct: 0,
    explain: 'In a capacitor, charge (and therefore current) must build up before voltage develops: current leads voltage by 90° (pi/2).'
  },
  {
    id: 'tcat-phy-ac-8',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Hard',
    q: 'What is the inductive reactance X_L of an inductor with inductance L = 0.1 H connected to a 50 Hz AC supply?',
    options: ['31.4 ohms', '314 ohms', '3.14 ohms', '15.7 ohms'],
    correct: 0,
    explain: 'X_L = 2*pi*f*L = 2 * 3.1416 * 50 * 0.1 = 10 * 3.1416 = 31.4 ohms.'
  },
  {
    id: 'tcat-phy-ac-9',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Hard',
    q: 'What is the power factor cos(phi) of a series RLC circuit at electrical resonance?',
    options: ['1.0 (unity)', '0', '0.5', 'Infinity'],
    correct: 0,
    explain: 'At resonance, inductive reactance cancels capacitive reactance (X_L = X_C), making the total impedance purely resistive (Z = R). Thus cos(phi) = R/Z = 1.0.'
  },
  {
    id: 'tcat-phy-ac-10',
    subject: 'Physics',
    topic: 'Alternating Current',
    difficulty: 'Hard',
    q: 'What is the average power dissipated over one complete AC cycle in a purely inductive or purely capacitive circuit?',
    options: ['Zero', 'V_rms * I_rms', '(1/2) * V0 * I0', 'V_rms^2 / R'],
    correct: 0,
    explain: 'Average power P_avg = V_rms * I_rms * cos(phi). In purely reactive circuits phi = 90°, cos(90°) = 0, so average dissipated power is zero.'
  },

  // =========================================================
  // Chapter 15: Electromagnetic Waves (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-emw-6',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Easy',
    q: 'Electromagnetic waves are transverse in nature because they can exhibit which phenomenon?',
    options: ['Polarization', 'Interference', 'Diffraction', 'Refraction'],
    correct: 0,
    explain: 'Polarization can only occur in transverse waves where oscillations are perpendicular to the direction of propagation.'
  },
  {
    id: 'tcat-phy-emw-7',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Easy',
    q: 'Which region of the electromagnetic spectrum has the longest wavelength?',
    options: ['Radio waves', 'Infrared rays', 'X-rays', 'Gamma rays'],
    correct: 0,
    explain: 'Radio waves have wavelengths ranging from millimeters to kilometers, which are the longest in the electromagnetic spectrum.'
  },
  {
    id: 'tcat-phy-emw-8',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Medium',
    q: 'How are the speeds of electromagnetic waves c in vacuum related to electric permittivity epsilon_0 and magnetic permeability mu_0?',
    options: ['c = 1 / sqrt(mu_0 * epsilon_0)', 'c = sqrt(mu_0 / epsilon_0)', 'c = mu_0 * epsilon_0', 'c = 1 / (mu_0 * epsilon_0)'],
    correct: 0,
    explain: 'Maxwell derived that the speed of light in vacuum is c = 1 / sqrt(mu_0 * epsilon_0).'
  },
  {
    id: 'tcat-phy-emw-9',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Hard',
    q: 'What produces electromagnetic radiation according to classical Maxwellian electrodynamics?',
    options: [
      'Accelerating electric charges',
      'Stationary electric charges',
      'Constant steady currents in straight wires',
      'Uniformly moving charges with zero acceleration'
    ],
    correct: 0,
    explain: 'Accelerating or oscillating charges create time-varying electric and magnetic fields that propagate outward as electromagnetic waves.'
  },
  {
    id: 'tcat-phy-emw-10',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    difficulty: 'Hard',
    q: 'What is the ratio of the amplitude of the electric field E0 to the magnetic field B0 in a plane electromagnetic wave in vacuum?',
    options: ['c (speed of light)', '1 / c', 'c^2', 'mu_0 / epsilon_0'],
    correct: 0,
    explain: 'In an electromagnetic wave in free space, E0 / B0 = c.'
  },

  // =========================================================
  // Chapter 16: Physics of Solids (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-pos-6',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Easy',
    q: 'Crystalline solids have a regular three-dimensional geometric arrangement of atoms known as a:',
    options: ['Crystal lattice', 'Amorphous glass', 'Polymer chain', 'Plastic slip'],
    correct: 0,
    explain: 'A regular periodic spatial array of atoms or ions is called a crystal lattice.'
  },
  {
    id: 'tcat-phy-pos-7',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Easy',
    q: 'The fractional change in dimension (Delta L / L) produced by an applied stress is known as:',
    options: ['Strain', 'Elastic modulus', 'Yield stress', 'Toughness'],
    correct: 0,
    explain: 'Tensile strain is defined as the dimensionless ratio of change in length Delta L to original length L.'
  },
  {
    id: 'tcat-phy-pos-8',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Medium',
    q: 'Substances like iron, nickel, and cobalt that strongly align with an external magnetic field are classified as:',
    options: ['Ferromagnetic', 'Paramagnetic', 'Diamagnetic', 'Superparamagnetic'],
    correct: 0,
    explain: 'Ferromagnetic materials have permanent magnetic domains that align strongly with applied fields and retain magnetism.'
  },
  {
    id: 'tcat-phy-pos-9',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Hard',
    q: 'In the stress-strain curve for a ductile metal, the point beyond which deformation becomes permanent and irreversible is called the:',
    options: ['Yield point (elastic limit)', 'Fracture point', 'Ultimate tensile strength', 'Proportional limit'],
    correct: 0,
    explain: 'Beyond the elastic limit or yield point, the material enters the plastic deformation region and does not return to its original shape.'
  },
  {
    id: 'tcat-phy-pos-10',
    subject: 'Physics',
    topic: 'Physics of Solids',
    difficulty: 'Hard',
    q: 'Superconductors expel all internal magnetic flux when cooled below their critical temperature Tc. This phenomenon is called the:',
    options: ['Meissner effect', 'Hall effect', 'Seebeck effect', 'Peltier effect'],
    correct: 0,
    explain: 'The Meissner effect is the complete expulsion of magnetic field lines from the interior of a superconductor in the superconducting state.'
  },

  // =========================================================
  // Chapter 17: Electronics (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-phy-elec-6',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Easy',
    q: 'In an intrinsic (pure) silicon semiconductor at room temperature, which statement is true?',
    options: [
      'Number of free electrons equals number of holes',
      'Number of free electrons exceeds number of holes',
      'Number of holes exceeds number of free electrons',
      'There are no free charge carriers'
    ],
    correct: 0,
    explain: 'In pure semiconductors, thermal generation creates electron-hole pairs in equal numbers (n = p = n_i).'
  },
  {
    id: 'tcat-phy-elec-7',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Easy',
    q: 'Doping pure silicon with a pentavalent impurity like Phosphorus or Arsenic produces an:',
    options: ['n-type semiconductor', 'p-type semiconductor', 'Intrinsic semiconductor', 'Insulator'],
    correct: 0,
    explain: 'Pentavalent atoms donate a 5th outer electron, providing excess negative mobile electrons (n-type).'
  },
  {
    id: 'tcat-phy-elec-8',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Medium',
    q: 'What is the voltage gain of a non-inverting operational amplifier circuit with feedback resistor Rf and input resistor R1?',
    options: ['1 + (Rf / R1)', '-Rf / R1', 'Rf / R1', '1 - (Rf / R1)'],
    correct: 0,
    explain: 'The closed-loop voltage gain of a non-inverting operational amplifier is A_v = 1 + (Rf / R1).'
  },
  {
    id: 'tcat-phy-elec-9',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Medium',
    q: 'What is the potential barrier across a silicon p-n junction diode at room temperature (approx 300 K)?',
    options: ['0.7 V', '0.3 V', '1.1 V', '0.1 V'],
    correct: 0,
    explain: 'The built-in potential barrier of silicon p-n junction diode is ~0.7 V (compared to ~0.3 V for Germanium).'
  },
  {
    id: 'tcat-phy-elec-10',
    subject: 'Physics',
    topic: 'Electronics',
    difficulty: 'Hard',
    q: 'In a transistor in common-emitter configuration, if base current is Ib = 20 muA and collector current is Ic = 2 mA, what is the current gain beta?',
    options: ['100', '50', '200', '10'],
    correct: 0,
    explain: 'Current gain beta = Ic / Ib = (2 x 10^(-3) A) / (20 x 10^(-6) A) = 2000 / 20 = 100.'
  },

  // =========================================================
  // Chapter 18: Dawn of Modern Physics (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-phy-dmp-6',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Easy',
    q: 'According to Einstein\'s mass-energy equivalence principle, energy E contained in rest mass m0 is:',
    options: ['E = m0 * c^2', 'E = (1/2) * m0 * c^2', 'E = m0 * c', 'E = m0^2 * c'],
    correct: 0,
    explain: 'Einstein\'s celebrated equation is E = m0 * c^2.'
  },
  {
    id: 'tcat-phy-dmp-7',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Medium',
    q: 'According to Heisenberg\'s Uncertainty Principle, the product of uncertainty in position Delta x and momentum Delta p satisfies:',
    options: ['Delta x * Delta p >= h / (4*pi)', 'Delta x * Delta p = 0', 'Delta x * Delta p <= h / (2*pi)', 'Delta x / Delta p >= h'],
    correct: 0,
    explain: 'Heisenberg\'s Uncertainty Principle states that Delta x * Delta p >= h / (4*pi) = hbar / 2.'
  },
  {
    id: 'tcat-phy-dmp-8',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Hard',
    q: 'In Compton scattering, the shift in photon wavelength Delta lambda is maximum when the scattering angle theta is:',
    options: ['180°', '90°', '0°', '45°'],
    correct: 0,
    explain: 'Delta lambda = (h / (m_e * c)) * (1 - cos(theta)). For theta = 180°, cos(180°) = -1, making 1 - (-1) = 2, giving the maximum shift of 2*lambda_c.'
  },
  {
    id: 'tcat-phy-dmp-9',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Hard',
    q: 'A spaceship moves at speed v = 0.8c relative to Earth. What is the Lorentz factor gamma = 1 / sqrt(1 - v^2/c^2)?',
    options: ['1.67 (5/3)', '1.25', '2.0', '1.0'],
    correct: 0,
    explain: 'sqrt(1 - (0.8)^2) = sqrt(1 - 0.64) = sqrt(0.36) = 0.6. gamma = 1 / 0.6 = 10/6 = 5/3 approx 1.67.'
  },
  {
    id: 'tcat-phy-dmp-10',
    subject: 'Physics',
    topic: 'Dawn of Modern Physics',
    difficulty: 'Hard',
    q: 'Pair production (materialization of a gamma photon into an electron-positron pair) can only take place in the vicinity of:',
    options: [
      'A heavy atomic nucleus (to conserve momentum)',
      'A perfect vacuum with zero particles',
      'An intense light beam',
      'A magnetic dipole only'
    ],
    correct: 0,
    explain: 'A massive nucleus is required to absorb recoil momentum so that both energy and linear momentum are simultaneously conserved.'
  },

  // =========================================================
  // Chapter 19: Atomic Spectra (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-as-6',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Easy',
    q: 'Which spectral series of the hydrogen atom produces emission lines exclusively in the visible spectrum region?',
    options: ['Balmer series', 'Lyman series', 'Paschen series', 'Brackett series'],
    correct: 0,
    explain: 'The Balmer series transitions to the n = 2 state fall directly within the visible light region (400 nm - 700 nm).'
  },
  {
    id: 'tcat-phy-as-7',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Easy',
    q: 'The wavelength range of X-rays is approximately:',
    options: ['0.01 nm to 10 nm', '400 nm to 700 nm', '1 mm to 100 mm', '10 m to 1000 m'],
    correct: 0,
    explain: 'X-rays have wavelengths typically around 0.01 nm to 10 nm (0.1 Å to 100 Å), roughly the size of atomic spacing.'
  },
  {
    id: 'tcat-phy-as-8',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Medium',
    q: 'What is the physical condition required for stimulated emission in a LASER to dominate over spontaneous absorption?',
    options: ['Population inversion', 'Thermal equilibrium', 'Ground state saturation', 'Critical damping'],
    correct: 0,
    explain: 'Population inversion occurs when there are more atoms in the higher excited metastable state than in the ground state.'
  },
  {
    id: 'tcat-phy-as-9',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Hard',
    q: 'According to Bohr\'s theory, the orbital radius r_n of an electron in a hydrogen atom scales with principal quantum number n as:',
    options: ['r_n proportional to n^2', 'r_n proportional to n', 'r_n proportional to 1/n', 'r_n proportional to 1/n^2'],
    correct: 0,
    explain: 'Bohr radius formula gives r_n = n^2 * r1, where r1 = 0.529 Å. Hence r_n is directly proportional to n^2.'
  },
  {
    id: 'tcat-phy-as-10',
    subject: 'Physics',
    topic: 'Atomic Spectra',
    difficulty: 'Hard',
    q: 'What is the cutoff wavelength lambda_min of continuous X-rays produced by electrons accelerated through potential V?',
    options: ['h * c / (e * V)', 'e * V / (h * c)', 'h * V / (e * c)', 'h * c / (2 * e * V)'],
    correct: 0,
    explain: 'Maximum photon energy occurs when entire kinetic energy eV is converted to a single photon: eV = h*c / lambda_min => lambda_min = hc / (eV).'
  },

  // =========================================================
  // Chapter 20: Nuclear Physics (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-phy-np-6',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Easy',
    q: 'Which type of nuclear radiation has the highest penetrating power through matter?',
    options: ['Gamma rays', 'Beta particles', 'Alpha particles', 'Protons'],
    correct: 0,
    explain: 'Gamma rays are high-energy neutral photons with no charge or rest mass, giving them the highest penetrating power (stopped only by thick lead).'
  },
  {
    id: 'tcat-phy-np-7',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Medium',
    q: 'In negative beta decay (beta-), which transformation occurs inside the unstable parent nucleus?',
    options: [
      'A neutron transforms into a proton, an electron, and an antineutrino',
      'A proton transforms into a neutron, a positron, and a neutrino',
      'An alpha particle is ejected from the nucleus',
      'A proton captures an orbital electron'
    ],
    correct: 0,
    explain: 'In beta-minus decay: n -> p + e^- + nu_bar. The atomic number Z increases by 1 while mass number A remains unchanged.'
  },
  {
    id: 'tcat-phy-np-8',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Medium',
    q: 'What is the function of a moderator (such as heavy water D2O or graphite) in a thermal nuclear fission reactor?',
    options: [
      'To slow down fast neutrons to thermal energies',
      'To absorb excess neutrons and stop the reaction',
      'To cool down the reactor core fluid',
      'To shield the environment from radiation'
    ],
    correct: 0,
    explain: 'Moderators slow down fast fission neutrons through elastic collisions so they can effectively induce fission in Uranium-235.'
  },
  {
    id: 'tcat-phy-np-9',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Hard',
    q: 'What is the mass defect Delta m of a stable nucleus composed of Z protons and N neutrons with actual nuclear mass M_nuc?',
    options: [
      '[Z * m_p + N * m_n] - M_nuc',
      'M_nuc - [Z * m_p + N * m_n]',
      '[Z * m_p + N * m_n] / M_nuc',
      'M_nuc / (Z + N)'
    ],
    correct: 0,
    explain: 'The mass of a bound nucleus is always less than the sum of its free constituent nucleons: Delta m = (Z*m_p + N*m_n) - M_nuc.'
  },
  {
    id: 'tcat-phy-np-10',
    subject: 'Physics',
    topic: 'Nuclear Physics',
    difficulty: 'Hard',
    q: 'The primary source of stellar energy in the core of our Sun is the nuclear fusion of hydrogen into helium via the:',
    options: ['Proton-Proton cycle', 'Carbon-Nitrogen cycle', 'Fission of Uranium-238', 'Alpha decay chain'],
    correct: 0,
    explain: 'For main-sequence stars with solar mass like our Sun, the proton-proton (p-p) fusion chain reaction accounts for ~99% of energy generation.'
  }
];

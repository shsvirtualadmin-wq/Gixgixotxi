import { Question } from '../types';

export const MDCAT_PHYSICS_BATCH5: Question[] = [
  // --- Current Electricity (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-1',
    q: 'According to Ohm\'s law, under constant physical conditions, the electric current passing through a metallic conductor is directly proportional to:',
    options: [
      'The potential difference applied across its ends',
      'The cross-sectional area of the conductor only',
      'The temperature of the conductor',
      'The resistivity of the conductor material'
    ],
    correct: 0,
    topic: 'Current Electricity',
    chapter: 'Current Electricity',
    explain: 'Ohm\'s law states that I ∝ V (current is directly proportional to the potential difference across the conductor) provided temperature and physical state remain constant.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-2',
    q: 'A uniform copper wire of resistance R is uniformly stretched until its length is doubled while maintaining constant mass. What is its new resistance?',
    options: ['4R', '2R', 'R/2', 'R/4'],
    correct: 0,
    topic: 'Current Electricity',
    chapter: 'Current Electricity',
    explain: 'Since volume is conserved (V = A · L = constant), doubling length (L\' = 2L) halves cross-sectional area (A\' = A/2). Since R = ρL/A, R\' = ρ(2L)/(A/2) = 4(ρL/A) = 4R.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-3',
    q: 'Kirchhoff\'s first rule (Junction Rule, ΣI = 0) is a direct consequence of the conservation of:',
    options: ['Electric charge', 'Energy', 'Linear momentum', 'Angular momentum'],
    correct: 0,
    topic: 'Current Electricity',
    chapter: 'Current Electricity',
    explain: 'Kirchhoff\'s Current Law (junction rule) states that total charge entering any junction equals total charge leaving it, embodying conservation of electric charge.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-4',
    q: 'A battery of emf E and internal resistance r is connected across an external load resistor R. Maximum power is transferred to the load when:',
    options: [
      'R = r',
      'R = 2r',
      'R = r/2',
      'R >> r'
    ],
    correct: 0,
    topic: 'Current Electricity',
    chapter: 'Current Electricity',
    explain: 'By the Maximum Power Transfer Theorem, the power delivered to an external load is maximized when the load resistance equals the internal resistance of the source (R = r).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electrostatics (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-5',
    q: 'Coulomb\'s law states that the electrostatic force between two point charges separated by distance r in vacuum is proportional to:',
    options: ['1 / r²', '1 / r', 'r²', 'r'],
    correct: 0,
    topic: 'Electrostatics',
    chapter: 'Electrostatics',
    explain: 'Coulomb\'s law states F = (1 / 4πε₀) · (q₁q₂ / r²), following the inverse-square law with respect to separation distance r.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-6',
    q: 'A parallel plate capacitor with capacitance C has plate separation d. If the distance between plates is halved and a dielectric of relative permittivity εr = 4 is inserted, the new capacitance becomes:',
    options: ['8C', '4C', '2C', '16C'],
    correct: 0,
    topic: 'Electrostatics',
    chapter: 'Electrostatics',
    explain: 'Initial capacitance is C = ε₀A/d. With d\' = d/2 and εr = 4, C\' = (εr · ε₀A)/(d/2) = (4 · 2) · (ε₀A/d) = 8C.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-7',
    q: 'The electric field strength E inside a charged hollow spherical conducting shell at electrostatic equilibrium is:',
    options: ['Zero', 'Uniform and positive', 'Inversely proportional to r²', 'Infinite at the center'],
    correct: 0,
    topic: 'Electrostatics',
    chapter: 'Electrostatics',
    explain: 'By Gauss\'s Law, because all static charge resides on the outer surface of a conductor, a Gaussian surface inside encloses zero charge (q_enc = 0), making E = 0 everywhere inside.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-8',
    q: 'An electron is accelerated from rest through a potential difference of 100 V. What is the approximate kinetic energy gained by the electron?',
    options: ['1.6 × 10⁻¹⁷ J', '1.6 × 10⁻¹⁹ J', '1.6 × 10⁻¹⁵ J', '3.2 × 10⁻¹⁷ J'],
    correct: 0,
    topic: 'Electrostatics',
    chapter: 'Electrostatics',
    explain: 'K.E. = qV = (1.6 × 10⁻¹⁹ C) × (100 V) = 1.6 × 10⁻¹⁷ J (or 100 eV).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Force and Motion (4 MCQs: 1 Easy, 1 Medium, 2 Hard) ---
  {
    id: 'mdcat-b5-phys-9',
    q: 'Newton\'s first law of motion defines the fundamental physical concept of:',
    options: ['Inertia', 'Momentum', 'Work', 'Impulse'],
    correct: 0,
    topic: 'Force and Motion',
    chapter: 'Force and Motion',
    explain: 'Newton\'s first law of motion is also known as the Law of Inertia, describing an object\'s intrinsic tendency to resist changes to its state of rest or uniform motion.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-10',
    q: 'A projectile is launched from the ground with initial velocity v at an angle of 30° to the horizontal. At what other launch angle with the same initial speed will it achieve the exact same horizontal range?',
    options: ['60°', '45°', '75°', '15°'],
    correct: 0,
    topic: 'Force and Motion',
    chapter: 'Force and Motion',
    explain: 'Horizontal projectile range R = (v² sin 2θ)/g is identical for complementary launch angles (θ and 90° - θ). For 30°, the complementary angle is 90° - 30° = 60°.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-11',
    q: 'A 0.5 kg ball moving horizontally at 20 m/s strikes a rigid vertical wall and rebounds elastically in the opposite direction with the same speed. If contact duration is 0.02 s, the average force exerted on the ball is:',
    options: ['1000 N', '500 N', '200 N', '50 N'],
    correct: 0,
    topic: 'Force and Motion',
    chapter: 'Force and Motion',
    explain: 'Change in momentum Δp = m(v_f - v_i) = 0.5 · (-20 - 20) = -20 kg·m/s. Magnitude of force F = |Δp| / Δt = 20 / 0.02 = 1000 N.',
    difficulty: 'Hard',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-12',
    q: 'During an inelastic collision between two isolated bodies in the absence of external forces, which of the following remains strictly conserved?',
    options: [
      'Total linear momentum only',
      'Total kinetic energy only',
      'Both total linear momentum and total kinetic energy',
      'Neither linear momentum nor kinetic energy'
    ],
    correct: 0,
    topic: 'Force and Motion',
    chapter: 'Force and Motion',
    explain: 'In any closed system without external net forces, total linear momentum is strictly conserved in all collisions. Kinetic energy is not conserved in inelastic collisions (some converts to heat/sound/deformation).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Rotational and Circular Motion (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-13',
    q: 'The centripetal acceleration acting on an object moving with linear speed v in a circular path of radius r is directed:',
    options: [
      'Radially inward towards the center of the circular trajectory',
      'Tangentially along the direction of velocity',
      'Radially outward away from the center',
      'Perpendicular to the plane of circular orbit'
    ],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    chapter: 'Rotational and Circular Motion',
    explain: 'Centripetal acceleration (a_c = v²/r) is always directed radially inward towards the instantaneous center of curvature of the circular path.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-14',
    q: 'A satellite orbits Earth in a circular geostationary orbit. What is its orbital period relative to the rotating Earth?',
    options: ['24 hours', '12 hours', '84 minutes', '365 days'],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    chapter: 'Rotational and Circular Motion',
    explain: 'A geostationary satellite has an orbital period of exactly 1 sidereal day (~24 hours), rotating synchronously with the Earth so it appears stationary above an equatorial point.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-15',
    q: 'The relationship between linear velocity v and angular velocity ω for a particle moving in a circular path of radius r is expressed as:',
    options: ['v = rω', 'v = ω / r', 'v = r²ω', 'v = r / ω'],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    chapter: 'Rotational and Circular Motion',
    explain: 'In circular motion, linear velocity is related to angular velocity by v = rω (or in vector form, v = ω × r).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-16',
    q: 'A solid sphere (I = 2/5 MR²) and a thin circular hoop (I = MR²) of equal mass and radius roll down an inclined plane from rest without slipping. Which reaches the bottom first?',
    options: [
      'The solid sphere',
      'The thin hoop',
      'Both reach simultaneously',
      'Depends on the angle of inclination'
    ],
    correct: 0,
    topic: 'Rotational and Circular Motion',
    chapter: 'Rotational and Circular Motion',
    explain: 'Acceleration a = (g sin θ) / (1 + I / MR²). The solid sphere has a smaller dimensionless moment of inertia (2/5 = 0.4) than the hoop (1.0), meaning less energy is diverted into rotational motion, resulting in higher translational acceleration.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Thermodynamics (4 MCQs: 1 Easy, 1 Medium, 2 Hard) ---
  {
    id: 'mdcat-b5-phys-17',
    q: 'The first law of thermodynamics (ΔU = Q - W or Q = ΔU + W) represents the universal conservation of:',
    options: ['Energy', 'Mass', 'Momentum', 'Entropy'],
    correct: 0,
    topic: 'Thermodynamics',
    chapter: 'Thermodynamics',
    explain: 'The first law of thermodynamics states that the net heat supplied to a system equals the increase in its internal energy plus the work done by the system, which is conservation of energy.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-18',
    q: 'In an adiabatic thermodynamic process involving an ideal gas, which quantity remains strictly zero throughout?',
    options: [
      'Heat exchanged between system and surroundings (Q = 0)',
      'Work performed by the gas (W = 0)',
      'Change in internal energy (ΔU = 0)',
      'Change in temperature (ΔT = 0)'
    ],
    correct: 0,
    topic: 'Thermodynamics',
    chapter: 'Thermodynamics',
    explain: 'An adiabatic process is one in which no heat enters or leaves the system (Q = 0), so ΔU = -W.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-19',
    q: 'A Carnot heat engine operates between a hot reservoir at 500 K and a cold sink at 300 K. What is its theoretical maximum thermodynamic efficiency?',
    options: ['40%', '60%', '20%', '50%'],
    correct: 0,
    topic: 'Thermodynamics',
    chapter: 'Thermodynamics',
    explain: 'Carnot efficiency η = 1 - (T_cold / T_hot) = 1 - (300 / 500) = 1 - 0.60 = 0.40 or 40%.',
    difficulty: 'Hard',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-20',
    q: 'During an isothermal expansion of an ideal gas at constant temperature T, which of the following is correct regarding internal energy U?',
    options: [
      'ΔU = 0, so all heat absorbed is converted completely into work (Q = W)',
      'ΔU > 0, so internal energy increases proportionally with volume',
      'W = 0, so no mechanical work is performed',
      'Pressure remains constant while volume expands'
    ],
    correct: 0,
    topic: 'Thermodynamics',
    chapter: 'Thermodynamics',
    explain: 'For an ideal gas, internal energy depends solely on temperature (U ∝ T). Since temperature is constant in an isothermal process, ΔU = 0, implying Q = W.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Waves (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-21',
    q: 'Sound waves traveling through atmospheric air are categorized as which type of wave?',
    options: [
      'Longitudinal mechanical waves',
      'Transverse electromagnetic waves',
      'Transverse mechanical waves',
      'Non-mechanical stationary waves'
    ],
    correct: 0,
    topic: 'Waves',
    chapter: 'Waves',
    explain: 'Sound in air propagates as a series of compressions and rarefactions where fluid particles oscillate parallel to the direction of wave propagation, making it a longitudinal mechanical wave.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-22',
    q: 'Two sound sources producing frequencies of 256 Hz and 260 Hz are sounded together. What is the beat frequency heard by an observer?',
    options: ['4 Hz', '258 Hz', '516 Hz', '2 Hz'],
    correct: 0,
    topic: 'Waves',
    chapter: 'Waves',
    explain: 'Beat frequency is equal to the absolute difference between the frequencies of the two interfering waves: f_beat = |f₁ - f₂| = |260 - 256| = 4 Hz.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-23',
    q: 'In a stationary (standing) wave formed along a stretched string clamped at both ends, the points where amplitude of vibration is permanently zero are called:',
    options: ['Nodes', 'Antinodes', 'Crests', 'Troughs'],
    correct: 0,
    topic: 'Waves',
    chapter: 'Waves',
    explain: 'In standing waves, nodes are positions of destructive interference that experience zero displacement/amplitude. Antinodes have maximum displacement.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-24',
    q: 'An ambulance emitting a siren of frequency f approaches a stationary observer with speed u. If v is the speed of sound in air, the apparent frequency f\' detected by the observer is given by:',
    options: [
      'f\' = f · [v / (v - u)]',
      'f\' = f · [v / (v + u)]',
      'f\' = f · [(v - u) / v]',
      'f\' = f · [(v + u) / v]'
    ],
    correct: 0,
    topic: 'Waves',
    chapter: 'Waves',
    explain: 'By the Doppler effect, when a sound source moves towards a stationary observer, wavefronts are compressed in front of the source, resulting in an increased apparent frequency: f\' = f · [v / (v - u)].',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Work, Energy and Power (4 MCQs: 1 Easy, 2 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-25',
    q: 'The SI unit of mechanical work and energy, the Joule (J), is dimensionally equivalent to:',
    options: ['kg·m²·s⁻²', 'kg·m·s⁻²', 'kg·m²·s⁻¹', 'kg·m⁻¹·s⁻²'],
    correct: 0,
    topic: 'Work, Energy and Power',
    chapter: 'Work, Energy and Power',
    explain: 'Work = Force × distance = (mass × acceleration) × distance = (kg · m·s⁻²) · m = kg·m²·s⁻².',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-26',
    q: 'A force F = (3i + 4j) N acts on a particle, displacing it through d = (2i + 5j) m. The work done by this force is:',
    options: ['26 J', '20 J', '14 J', '32 J'],
    correct: 0,
    topic: 'Work, Energy and Power',
    chapter: 'Work, Energy and Power',
    explain: 'Work done W = F · d = (3)(2) + (4)(5) = 6 + 20 = 26 J.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-27',
    q: 'An electric motor lifts an elevator of mass 1000 kg at a constant vertical speed of 2 m/s against gravity (taking g = 9.8 m/s²). The power output delivered by the motor is:',
    options: ['19,600 W', '9,800 W', '4,900 W', '39,200 W'],
    correct: 0,
    topic: 'Work, Energy and Power',
    chapter: 'Work, Energy and Power',
    explain: 'Power P = F · v = (m · g) · v = (1000 kg · 9.8 m/s²) · 2 m/s = 19,600 W (19.6 kW).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-28',
    q: 'If the linear momentum of an object is increased by 50%, by what percentage does its kinetic energy increase?',
    options: ['125%', '50%', '100%', '225%'],
    correct: 0,
    topic: 'Work, Energy and Power',
    chapter: 'Work, Energy and Power',
    explain: 'Kinetic energy K = p² / 2m. If momentum becomes p\' = 1.5p, new kinetic energy is K\' = (1.5p)² / 2m = 2.25 K. The fractional increase is (2.25 - 1) = 1.25, which corresponds to an increase of 125%.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Alternating Current (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-29',
    q: 'The root-mean-square (rms) value of a sinusoidal alternating current with peak value I₀ is given by:',
    options: ['I₀ / √2', 'I₀ / 2', '√2 · I₀', '2I₀ / π'],
    correct: 0,
    topic: 'Alternating Current',
    chapter: 'Alternating Current',
    explain: 'For a sinusoidal waveform, I_rms = I₀ / √2 ≈ 0.707 I₀.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-30',
    q: 'In a purely inductive AC circuit, the phase relationship between alternating voltage V and alternating current I is:',
    options: [
      'Voltage leads current by 90° (π/2 radians)',
      'Current leads voltage by 90° (π/2 radians)',
      'Voltage and current are in phase',
      'Voltage lags current by 180°'
    ],
    correct: 0,
    topic: 'Alternating Current',
    chapter: 'Alternating Current',
    explain: 'In an inductor, the back emf opposes changes in current, causing the alternating voltage to lead the alternating current by a phase angle of 90° (π/2).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-31',
    q: 'At resonance in a series RLC alternating current circuit, the total electrical impedance Z of the circuit is equal to:',
    options: ['R (minimum impedance)', 'Zero', '√(R² + ω²L²)', 'Infinite (maximum impedance)'],
    correct: 0,
    topic: 'Alternating Current',
    chapter: 'Alternating Current',
    explain: 'At resonance, inductive reactance equals capacitive reactance (X_L = X_C), canceling the reactive component. Hence Z = √[R² + (X_L - X_C)²] = R, achieving its minimum value.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Atomic Spectra (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-32',
    q: 'In the hydrogen atomic spectrum, spectral lines belonging to the Balmer series fall in which region of the electromagnetic spectrum?',
    options: ['Visible region', 'Ultraviolet region', 'Infrared region', 'X-ray region'],
    correct: 0,
    topic: 'Atomic Spectra',
    chapter: 'Atomic Spectra',
    explain: 'The Balmer series transitions terminate on n = 2 and emit photons in the visible spectrum (approx 400 to 700 nm). Lyman is UV, Paschen/Brackett/Pfund are IR.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-33',
    q: 'According to Bohr\'s atomic model, an electron can only revolve in orbits for which its orbital angular momentum L is an integral multiple of:',
    options: ['h / 2π', 'h / π', '2π / h', 'h / 4π'],
    correct: 0,
    topic: 'Atomic Spectra',
    chapter: 'Atomic Spectra',
    explain: 'Bohr\'s quantization postulate states L = mvr = n(h / 2π), where n = 1, 2, 3... and h is Planck\'s constant.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-34',
    q: 'The ground state ionization potential of atomic hydrogen is 13.6 V. How much excitation energy is required to elevate the electron from n = 1 to n = 3?',
    options: ['12.09 eV', '13.60 eV', '10.20 eV', '1.51 eV'],
    correct: 0,
    topic: 'Atomic Spectra',
    chapter: 'Atomic Spectra',
    explain: 'Energy levels are E_n = -13.6 / n² eV. E₁ = -13.6 eV and E₃ = -13.6 / 9 = -1.51 eV. Excitation energy ΔE = E₃ - E₁ = -1.51 - (-13.6) = +12.09 eV.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Dawn of Modern Physics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-35',
    q: 'The photoelectric effect provided definitive experimental verification for which physical concept?',
    options: [
      'The particle (quantum) nature of electromagnetic radiation',
      'The wave nature of electrons',
      'The continuous nature of atomic energy levels',
      'The existence of nuclear strong force'
    ],
    correct: 0,
    topic: 'Dawn of Modern Physics',
    chapter: 'Dawn of Modern Physics',
    explain: 'Einstein explained the photoelectric effect by positing that light consists of discrete energy quanta (photons) with energy E = hf, confirming light\'s particulate nature.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-36',
    q: 'In the Compton scattering experiment, when an incident X-ray photon collides with a loosely bound stationary electron, the scattered photon exhibits:',
    options: [
      'A longer wavelength and lower frequency',
      'A shorter wavelength and higher frequency',
      'An unchanged wavelength but increased speed',
      'Zero energy after collision'
    ],
    correct: 0,
    topic: 'Dawn of Modern Physics',
    chapter: 'Dawn of Modern Physics',
    explain: 'In Compton scattering, the photon transfers some energy and momentum to the electron, so the scattered photon has lower energy (E = hc/λ), which means lower frequency and a longer wavelength (Compton shift Δλ > 0).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-37',
    q: 'The de Broglie wavelength associated with a particle of mass m moving with non-relativistic velocity v is given by:',
    options: ['λ = h / (mv)', 'λ = mv / h', 'λ = h · mv', 'λ = h / (2mv²)'],
    correct: 0,
    topic: 'Dawn of Modern Physics',
    chapter: 'Dawn of Modern Physics',
    explain: 'The de Broglie hypothesis relates particle momentum p = mv to its matter wavelength: λ = h / p = h / (mv).',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electromagnetic Induction (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-38',
    q: 'Faraday\'s law of electromagnetic induction states that the induced electromotive force (emf) in a circuit is directly proportional to:',
    options: [
      'The time rate of change of magnetic flux through the circuit',
      'The total electric resistance of the circuit',
      'The constant magnetic flux density',
      'The electrostatic potential gradient'
    ],
    correct: 0,
    topic: 'Electromagnetic Induction',
    chapter: 'Electromagnetic Induction',
    explain: 'Faraday\'s law: ε = -N(ΔΦ/Δt). The induced emf is directly proportional to the time rate of change of magnetic flux linking the circuit.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-39',
    q: 'Lenz\'s law states that the direction of an induced current is such that it opposes the change that produces it. This law is an embodiment of:',
    options: [
      'Conservation of energy',
      'Conservation of charge',
      'Conservation of momentum',
      'Conservation of mass'
    ],
    correct: 0,
    topic: 'Electromagnetic Induction',
    chapter: 'Electromagnetic Induction',
    explain: 'Lenz\'s law enforces conservation of energy: mechanical work must be done against the opposing magnetic force to generate electrical energy.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-40',
    q: 'A 2 H inductor carries a current that drops uniformly from 5 A to 1 A in 0.1 seconds. What is the magnitude of the self-induced emf across the inductor?',
    options: ['80 V', '40 V', '20 V', '10 V'],
    correct: 0,
    topic: 'Electromagnetic Induction',
    chapter: 'Electromagnetic Induction',
    explain: 'Induced emf ε = L · |ΔI / Δt| = 2 H · |(1 - 5) A / 0.1 s| = 2 · (4 / 0.1) = 80 V.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electromagnetism (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-41',
    q: 'The magnetic force F acting on a charge q moving with velocity v in a uniform magnetic field B is zero when the angle between v and B is:',
    options: ['0° or 180°', '90°', '45°', '60°'],
    correct: 0,
    topic: 'Electromagnetism',
    chapter: 'Electromagnetism',
    explain: 'Lorentz magnetic force F = q(v × B) has magnitude F = qvB sin θ. When θ = 0° or 180° (parallel or antiparallel motion), sin θ = 0, so F = 0.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-42',
    q: 'A charged particle enters perpendicular to a uniform magnetic field with speed v. The radius r of its circular orbit is directly proportional to:',
    options: [
      'Its momentum (mv)',
      'The magnetic field strength B',
      'The charge of the particle q',
      'The inverse of its mass (1/m)'
    ],
    correct: 0,
    topic: 'Electromagnetism',
    chapter: 'Electromagnetism',
    explain: 'Equating magnetic force to centripetal force: qvB = mv²/r, which yields r = mv / (qB) = p / (qB). The radius is directly proportional to particle momentum p = mv.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-43',
    q: 'According to Ampere\'s Circuital Law, the line integral of magnetic field B around any closed loop is proportional to:',
    options: [
      'The net electric current enclosed by the loop (μ₀ · I_enc)',
      'The rate of change of magnetic flux',
      'The net electric charge enclosed by the loop',
      'The total resistance of the path'
    ],
    correct: 0,
    topic: 'Electromagnetism',
    chapter: 'Electromagnetism',
    explain: 'Ampere\'s Law states ∮ B · dl = μ₀ · I_enc, relating the line integral of magnetic field around a closed loop to the enclosed steady current.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Electronics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-44',
    q: 'A semiconductor diode allows significant electric current to flow through it when it is:',
    options: [
      'Forward biased',
      'Reverse biased',
      'Unbiased',
      'Kept at absolute zero'
    ],
    correct: 0,
    topic: 'Electronics',
    chapter: 'Electronics',
    explain: 'When a p-n junction is forward biased (p-side to positive, n-side to negative), the depletion barrier height is narrowed, permitting majority carriers to cross readily.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-45',
    q: 'An operational amplifier (Op-Amp) in an inverting configuration has input resistor R_in = 10 kΩ and feedback resistor R_f = 100 kΩ. What is the closed-loop voltage gain?',
    options: ['-10', '+10', '-0.1', '+100'],
    correct: 0,
    topic: 'Electronics',
    chapter: 'Electronics',
    explain: 'The voltage gain of an inverting amplifier is given by A_v = -R_f / R_in = -100 kΩ / 10 kΩ = -10.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-46',
    q: 'In an n-p-n bipolar junction transistor operating in the active amplification region, the emitter-base and collector-base junctions must be biased respectively as:',
    options: [
      'Emitter-base forward biased, collector-base reverse biased',
      'Emitter-base reverse biased, collector-base forward biased',
      'Both junctions forward biased',
      'Both junctions reverse biased'
    ],
    correct: 0,
    topic: 'Electronics',
    chapter: 'Electronics',
    explain: 'For linear amplification in the active region, the emitter-base junction must be forward biased to inject carriers, and the collector-base junction must be reverse biased to collect them.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Fluid Dynamics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-47',
    q: 'The equation of continuity (A₁v₁ = A₂v₂) for an incompressible, non-viscous fluid flowing through a pipe of varying cross-section expresses conservation of:',
    options: ['Mass', 'Energy', 'Linear momentum', 'Angular momentum'],
    correct: 0,
    topic: 'Fluid Dynamics',
    chapter: 'Fluid Dynamics',
    explain: 'The equation of continuity states that mass flow rate (dm/dt = ρAv) is constant along a streamline for an incompressible fluid (ρ = const), which is conservation of mass.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-48',
    q: 'According to Bernoulli\'s equation, where the speed of a flowing horizontal fluid increases, its internal fluid pressure:',
    options: [
      'Decreases',
      'Increases proportionally',
      'Remains unaffected',
      'Becomes negative'
    ],
    correct: 0,
    topic: 'Fluid Dynamics',
    chapter: 'Fluid Dynamics',
    explain: 'For horizontal flow, P + 1/2 ρv² = constant. As flow velocity v increases, dynamic pressure increases, so static pressure P must decrease to keep total head constant.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-49',
    q: 'A spherical raindrop of radius r falls through air of viscosity η. According to Stokes\' law, the viscous retarding drag force F acting on the drop at velocity v is:',
    options: ['F = 6πηrv', 'F = 6πηr²v', 'F = 4πηrv²', 'F = 3πηr/v'],
    correct: 0,
    topic: 'Fluid Dynamics',
    chapter: 'Fluid Dynamics',
    explain: 'Stokes\' law states that for a spherical body of radius r moving through a fluid of viscosity η with laminar velocity v, viscous drag force is F = 6πηrv.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Nuclear Physics (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-50',
    q: 'During radioactive alpha (α) decay, how do the mass number A and atomic number Z of the parent nucleus change?',
    options: [
      'A decreases by 4, Z decreases by 2',
      'A decreases by 2, Z decreases by 4',
      'A remains unchanged, Z increases by 1',
      'Both A and Z decrease by 1'
    ],
    correct: 0,
    topic: 'Nuclear Physics',
    chapter: 'Nuclear Physics',
    explain: 'An alpha particle is a helium-4 nucleus (⁴₂He). Emission of an α-particle therefore reduces mass number A by 4 and atomic number Z by 2.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-51',
    q: 'A radioactive isotope has a half-life of 10 days. What fraction of the original radioactive nuclei will remain undecayed after 30 days?',
    options: ['1/8 (12.5%)', '1/4 (25%)', '1/16 (6.25%)', '1/2 (50%)'],
    correct: 0,
    topic: 'Nuclear Physics',
    chapter: 'Nuclear Physics',
    explain: 'Number of elapsed half-lives n = t / T_{1/2} = 30 / 10 = 3. Remaining fraction N/N₀ = (1/2)³ = 1/8 = 12.5%.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-52',
    q: 'In nuclear binding energy curves, the highest average binding energy per nucleon (approx 8.8 MeV/nucleon) occurs near which nucleus?',
    options: ['Iron-56 (⁵⁶Fe)', 'Uranium-235 (²³⁵U)', 'Helium-4 (⁴He)', 'Carbon-12 (¹²C)'],
    correct: 0,
    topic: 'Nuclear Physics',
    chapter: 'Nuclear Physics',
    explain: 'The binding energy per nucleon peaks around mass number A ≈ 56–62 (specifically ⁵⁶Fe and ⁶²Ni at ~8.8 MeV/nucleon), making them the most tightly bound and stable nuclei.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Measurements (2 MCQs: 1 Easy, 1 Medium) ---
  {
    id: 'mdcat-b5-phys-53',
    q: 'Which of the following is a supplementary SI unit?',
    options: ['Radian', 'Candela', 'Mole', 'Kelvin'],
    correct: 0,
    topic: 'Measurements',
    chapter: 'Measurements',
    explain: 'Radian (plane angle) and Steradian (solid angle) are classified as supplementary units in the SI system (candela, mole, and kelvin are base units).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-54',
    q: 'If the percentage uncertainty in measuring mass m is 2% and in measuring velocity v is 3%, what is the percentage uncertainty in kinetic energy (K.E. = 1/2 m v²)?',
    options: ['8%', '5%', '6%', '11%'],
    correct: 0,
    topic: 'Measurements',
    chapter: 'Measurements',
    explain: 'Percentage uncertainty in K.E. = (% uncertainty in m) + 2 × (% uncertainty in v) = 2% + 2(3%) = 2% + 6% = 8%.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Oscillations (2 MCQs: 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-55',
    q: 'For a simple pendulum undergoing simple harmonic motion of small angular amplitude, its time period T is independent of:',
    options: [
      'The mass of the bob',
      'The length of the suspension string',
      'The acceleration due to gravity g',
      'The geographic location on Earth'
    ],
    correct: 0,
    topic: 'Oscillations',
    chapter: 'Oscillations',
    explain: 'The period of a simple pendulum is T = 2π√(L/g). It depends only on string length L and gravitational acceleration g, being completely independent of the bob\'s mass.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-56',
    q: 'A body executing simple harmonic motion has displacement x = A sin(ωt). At what displacement from the equilibrium position are its kinetic energy and potential energy equal?',
    options: ['x = A / √2', 'x = A / 2', 'x = A / 4', 'x = A / 3'],
    correct: 0,
    topic: 'Oscillations',
    chapter: 'Oscillations',
    explain: 'Total energy E = 1/2 kA². Potential energy U = 1/2 kx². When K.E. = P.E., U = E/2, so 1/2 kx² = 1/2 (1/2 kA²), which gives x² = A²/2, meaning x = A / √2.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Physics of Solids (2 MCQs: 1 Easy, 1 Hard) ---
  {
    id: 'mdcat-b5-phys-57',
    q: 'Within the elastic limit of a solid material, Hooke\'s law states that tensile stress is directly proportional to:',
    options: ['Tensile strain', 'Original length', 'Total cross-sectional area', 'Applied torque'],
    correct: 0,
    topic: 'Physics of Solids',
    chapter: 'Physics of Solids',
    explain: 'Hooke\'s law states that within the proportional/elastic limit, stress is directly proportional to strain (Stress = Modulus × Strain).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-58',
    q: 'In energy band theory of crystalline solids, a material possessing a completely filled valence band and an empty conduction band separated by a wide energy gap (E_g > 3 eV) behaves as:',
    options: ['An electrical insulator', 'A metallic conductor', 'An intrinsic semiconductor', 'A superconductor'],
    correct: 0,
    topic: 'Physics of Solids',
    chapter: 'Physics of Solids',
    explain: 'A large forbidden energy band gap (typically > 3 to 5 eV) prevents thermal promotion of electrons from the valence band to the conduction band at ordinary temperatures, characteristic of electrical insulators.',
    difficulty: 'Hard',
    subject: 'Physics'
  },

  // --- Scalars and Vectors (2 MCQs: 1 Easy, 1 Medium) ---
  {
    id: 'mdcat-b5-phys-59',
    q: 'If the scalar (dot) product of two non-zero vectors A and B is zero (A · B = 0), the angle between them is:',
    options: ['90° (perpendicular)', '0° (parallel)', '180° (antiparallel)', '45°'],
    correct: 0,
    topic: 'Scalars and Vectors',
    chapter: 'Scalars and Vectors',
    explain: 'A · B = AB cos θ = 0. For non-zero vectors, cos θ = 0, which corresponds to θ = 90° (vectors are orthogonal).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b5-phys-60',
    q: 'Two forces of magnitudes 6 N and 8 N act concurrently on a point mass at an angle of 90° to each other. What is the magnitude of their resultant force?',
    options: ['10 N', '14 N', '2 N', '48 N'],
    correct: 0,
    topic: 'Scalars and Vectors',
    chapter: 'Scalars and Vectors',
    explain: 'For perpendicular vectors, resultant R = √(F₁² + F₂²) = √(6² + 8²) = √(36 + 64) = √100 = 10 N.',
    difficulty: 'Medium',
    subject: 'Physics'
  }
];

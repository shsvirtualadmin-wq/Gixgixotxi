import { Question } from '../types';

export const MDCAT_PHYSICS_BATCH7: Question[] = [
  // --- Physics of Solids (7 MCQs: 1 to 7) ---
  {
    id: 'mdcat-b7-phy-1',
    q: 'According to Hooke\'s law within the elastic limit, what is the ratio of tensile stress (σ) to tensile strain (ε) for an isotropic elastic solid called?',
    options: ['Young\'s modulus (Y)', 'Bulk modulus (K)', 'Shear modulus (G)', 'Poisson\'s ratio'],
    correct: 0,
    topic: 'Elastic Moduli - Young\'s Modulus',
    chapter: 'Physics of Solids',
    explain: 'Hooke\'s law states that within the proportional limit, stress is directly proportional to strain. The constant of proportionality for linear stretching or compression is Young\'s modulus: Y = Stress / Strain = (F/A) / (ΔL/L).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-2',
    q: 'What is the SI unit of strain in solid mechanics?',
    options: ['Dimensionless (no units)', 'N/m^2 (Pascal)', 'N·m (Joule)', 'kg/m^3'],
    correct: 0,
    topic: 'Stress and Strain Dimensions',
    chapter: 'Physics of Solids',
    explain: 'Strain is the fractional deformation of a body: tensile strain = ΔL / L, shear strain = Δx / L, and volumetric strain = ΔV / V. Since it is the ratio of two identical physical dimensions, it is a dimensionless quantity.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-3',
    q: 'In the energy band theory of solids, why are intrinsic semiconductors (such as pure silicon and germanium) electrical insulators at absolute zero temperature (0 Kelvin)?',
    options: [
      'The valence band is completely full and the conduction band is completely empty, with no thermal energy to cross the energy band gap',
      'The conduction band overlaps with the valence band',
      'Electrons are trapped in nuclear potential wells',
      'The energy band gap is greater than 10 electron-volts'
    ],
    correct: 0,
    topic: 'Energy Band Theory of Solids',
    chapter: 'Physics of Solids',
    explain: 'At 0 K, all valence electrons are locked in covalent bonds (completely filled valence band). The forbidden energy gap Eg is ~1.1 eV for Si, and without thermal excitation, the conduction band has zero electrons, acting as a perfect insulator.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-4',
    q: 'Superconductors are materials whose electrical resistivity drops abruptly to exactly zero below a characteristic temperature known as the:',
    options: ['Critical transition temperature (Tc)', 'Curie temperature', 'Debye temperature', 'Fermi temperature'],
    correct: 0,
    topic: 'Superconductivity and Critical Temperature',
    chapter: 'Physics of Solids',
    explain: 'Discovered by Heike Kamerlingh Onnes in mercury at 4.2 K, superconductivity is the state where DC electrical resistance vanishes identically below the material\'s critical temperature (Tc).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-5',
    q: 'The complete expulsion of internal magnetic flux from the interior of a superconducting material when cooled below its critical temperature (Tc) in an external magnetic field is known as the:',
    options: ['Meissner effect', 'Hall effect', 'Zeeman effect', 'Stark effect'],
    correct: 0,
    topic: 'Superconductors - Meissner Effect',
    chapter: 'Physics of Solids',
    explain: 'The Meissner effect demonstrates that superconductors are perfect diamagnets (B = 0 inside). Surface screening supercurrents cancel out any interior magnetic flux, enabling magnetic levitation.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-6',
    q: 'In a stress-strain graph for a ductile metal, the area under the curve up to the fracture point represents which mechanical property?',
    options: ['Toughness (strain energy per unit volume absorbed before rupture)', 'Resilience (elastic energy storage)', 'Brittle fracture modulus', 'Yield strength'],
    correct: 0,
    topic: 'Stress-Strain Curve and Toughness',
    chapter: 'Physics of Solids',
    explain: 'The total area under the entire stress-strain curve from origin to ultimate fracture measures the mechanical toughness—the total mechanical energy per unit volume that a material can absorb before breaking.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-7',
    q: 'Ferromagnetic materials (e.g., iron, cobalt, nickel) retain macroscopic magnetization in the absence of an applied field due to the spontaneous parallel alignment of atomic magnetic dipoles within microscopic regions called:',
    options: ['Magnetic domains', 'Brillouin zones', 'Lattice vacancies', 'Phonon cavities'],
    correct: 0,
    topic: 'Ferromagnetism and Domain Theory',
    chapter: 'Physics of Solids',
    explain: 'According to Weiss domain theory, quantum mechanical exchange interactions align magnetic moments of neighboring atoms parallel within microscopic regions called domains (~10^12 to 10^15 atoms), even without an external field.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Alternating Current (6 MCQs: 8 to 13) ---
  {
    id: 'mdcat-b7-phy-8',
    q: 'For a sinusoidal alternating voltage with peak amplitude V0, what is the root-mean-square (RMS) effective voltage (V_rms)?',
    options: ['V0 / sqrt(2) ≈ 0.707 V0', 'V0 / 2', '2 V0 / π ≈ 0.637 V0', 'sqrt(2) V0'],
    correct: 0,
    topic: 'Peak and RMS Values of AC',
    chapter: 'Alternating Current',
    explain: 'RMS (effective) value represents the equivalent DC heating value: V_rms = V0 / sqrt(2) ≈ 0.707 V0. Thus, standard 220 V household AC has a peak voltage V0 = 220 × sqrt(2) ≈ 311 V.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-9',
    q: 'In a purely inductive AC circuit containing an inductor of inductance L connected to an AC source of angular frequency ω, what is the phase relationship between the alternating voltage (v) and alternating current (i)?',
    options: ['Voltage leads current by a phase angle of 90° (π/2 radians)', 'Current leads voltage by 90°', 'Voltage and current are completely in phase (0°)', 'Voltage and current are in anti-phase (180°)'],
    correct: 0,
    topic: 'AC Through Pure Inductor',
    chapter: 'Alternating Current',
    explain: 'In an inductor, self-induced back EMF opposes current rise. Current lags voltage by 90° (π/2 rad), or conversely, voltage leads current by 90°: v = V0 sin(ωt), i = I0 sin(ωt - π/2).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-10',
    q: 'What is the capacitive reactance (Xc) of a capacitor with capacitance C operating in an AC circuit with angular frequency ω?',
    options: ['Xc = 1 / (ω C)', 'Xc = ω C', 'Xc = ω / C', 'Xc = 1 / (ω^2 C)'],
    correct: 0,
    topic: 'Capacitive Reactance in AC Circuits',
    chapter: 'Alternating Current',
    explain: 'Capacitive reactance is the opposition offered by a capacitor to alternating current: Xc = 1 / (2πf C) = 1 / (ω C). At high frequencies, Xc approaches zero, allowing AC to pass easily.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-11',
    q: 'In a series RLC resonance circuit, what is the electrical impedance (Z) at the resonant frequency (fr = 1 / (2π sqrt(LC)))?',
    options: ['Z is minimum and purely resistive (Z = R)', 'Z is infinite (open circuit)', 'Z = sqrt(R^2 + (ωL)^2)', 'Z = 0'],
    correct: 0,
    topic: 'Series RLC Resonance Circuit',
    chapter: 'Alternating Current',
    explain: 'At resonance, XL = Xc (ωL = 1/ωC), so inductive and capacitive reactances completely cancel each other. Impedance Z = sqrt(R^2 + (XL - Xc)^2) reduces to its minimum value Z = R, maximizing current amplitude.',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-12',
    q: 'What is the average electrical power dissipated over a complete AC cycle in a purely capacitive circuit?',
    options: ['Zero Watts', 'P = V_rms · I_rms', 'P = (1/2) C V0^2', 'P = I_rms^2 · Xc'],
    correct: 0,
    topic: 'Power in AC Circuits',
    chapter: 'Alternating Current',
    explain: 'Average power P_avg = V_rms · I_rms · cos(φ). In a purely capacitive circuit, the phase angle φ = 90° (current leads voltage by 90°). Since cos(90°) = 0, power factor is zero and no real power is dissipated (wattless current).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-13',
    q: 'In electromagnetic wave transmission, an LC resonant tank circuit generates high-frequency alternating electrical oscillations by continuously exchanging stored energy between:',
    options: [
      'The electric field of the capacitor and the magnetic field of the inductor',
      'The kinetic energy of electrons and thermal lattice vibrations',
      'Gravitational potential energy and nuclear forces',
      'Chemical bond energy and acoustic vibrations'
    ],
    correct: 0,
    topic: 'Electromagnetic Oscillations in LC Circuits',
    chapter: 'Alternating Current',
    explain: 'In an LC circuit, energy oscillates between electrical potential energy stored in the capacitor\'s electric field (UE = Q^2 / 2C) and magnetic energy stored in the inductor\'s magnetic field (UB = (1/2) L I^2).',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Atomic Spectra (6 MCQs: 14 to 19) ---
  {
    id: 'mdcat-b7-phy-14',
    q: 'According to Niels Bohr\'s second postulate for the hydrogen atom, the orbital angular momentum (L) of an electron revolving in a stable non-radiating stationary orbit is quantized as an integer multiple of:',
    options: ['h / (2π)', 'h / (4π)', '2π / h', 'h / π'],
    correct: 0,
    topic: 'Bohr\'s Quantization Postulate',
    chapter: 'Atomic Spectra',
    explain: 'Bohr postulated that electrons move only in permitted orbits where their orbital angular momentum is an integral multiple of reduced Planck\'s constant: L = m · v · r = n (h / 2π), where n = 1, 2, 3... is the principal quantum number.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-15',
    q: 'The radius of the first Bohr orbit (n = 1) of the hydrogen atom, known as the Bohr radius (r1 or a0), is approximately equal to:',
    options: ['0.0529 nm (0.529 Å)', '0.529 nm', '1.058 nm', '0.00529 nm'],
    correct: 0,
    topic: 'Bohr Radii of Hydrogen Atom',
    chapter: 'Atomic Spectra',
    explain: 'Bohr radius rn = (n^2 h^2 ε0) / (π m e^2) = n^2 × r1. For n = 1, r1 = 0.529 × 10^(-10) m = 0.0529 nm = 0.529 Å.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-16',
    q: 'What is the ground-state ionization energy required to completely remove an electron from the n = 1 ground state of a hydrogen atom (E1 = -13.6 eV) to infinity (E∞ = 0 eV)?',
    options: ['+13.6 eV', '-13.6 eV', '+3.4 eV', '+10.2 eV'],
    correct: 0,
    topic: 'Hydrogen Atom Energy Levels and Ionization Energy',
    chapter: 'Atomic Spectra',
    explain: 'Ionization energy is the energy required to promote the electron from its ground state to the continuum: E_ion = E∞ - E1 = 0 - (-13.6 eV) = +13.6 eV.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-17',
    q: 'The characteristic X-ray K_alpha line is emitted when an electron from an outer atomic shell drops to fill a vacancy created in which inner shell?',
    options: ['Drops from L shell (n = 2) to K shell (n = 1)', 'Drops from M shell (n = 3) to K shell (n = 1)', 'Drops from M shell (n = 3) to L shell (n = 2)', 'Drops from N shell (n = 4) to L shell (n = 2)'],
    correct: 0,
    topic: 'Production and Origin of Characteristic X-Rays',
    chapter: 'Atomic Spectra',
    explain: 'When bombarding electrons eject a K-shell (n = 1) electron, an electron from the L-shell (n = 2) transitions downward to fill the inner hole, emitting a high-energy characteristic X-ray photon designated as K_alpha.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-18',
    q: 'The continuous spectrum of X-rays produced in an X-ray tube by the rapid deceleration of high-energy projectile electrons within the nuclear Coulomb field of the heavy target anode is called:',
    options: ['Bremsstrahlung (braking radiation)', 'Photoelectric scattering', 'Compton emission', 'Pair production'],
    correct: 0,
    topic: 'Continuous X-Ray Spectrum - Bremsstrahlung',
    chapter: 'Atomic Spectra',
    explain: 'Bremsstrahlung ("braking radiation") arises when fast electrons undergo sudden electrostatic deceleration near target nuclei. The loss of kinetic energy is radiated directly as continuous X-ray photons with cutoff wavelength λ_min = hc / (e V0).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-19',
    q: 'In laser operation (Light Amplification by Stimulated Emission of Radiation), what condition is an absolute prerequisite to achieve light amplification rather than absorption?',
    options: [
      'Population inversion (more atoms residing in a higher metastable state than in the ground state)',
      'Thermal equilibrium at cryogenic temperatures',
      'Total absence of spontaneous emission',
      'Use of continuous radioactive isotopes'
    ],
    correct: 0,
    topic: 'Laser Physics - Population Inversion and Stimulated Emission',
    chapter: 'Atomic Spectra',
    explain: 'Under thermal equilibrium, Boltzmann statistics dictate lower states are more populated. Laser action requires pumping energy into a metastable state to achieve population inversion (N2 > N1), so stimulated emission dominates over absorption.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Measurements (3 MCQs: 20 to 22) ---
  {
    id: 'mdcat-b7-phy-20',
    q: 'What are the base SI dimensions of dynamic viscosity (η), whose unit is Pascal-second (Pa·s)?',
    options: ['[M L^(-1) T^(-1)]', '[M L^(-2) T^(-1)]', '[M L T^(-2)]', '[M L^2 T^(-2)]'],
    correct: 0,
    topic: 'Dimensional Analysis of Viscosity',
    chapter: 'Measurements',
    explain: 'From Stokes\' law, F = 6πηrv => η = F / (6πrv). Dimensions of F = [M L T^(-2)], r = [L], v = [L T^(-1)]. Therefore, [η] = [M L T^(-2)] / ([L] · [L T^(-1)]) = [M L^(-1) T^(-1)].',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-21',
    q: 'A digital stopwatch has a precision (least count) of 0.1 s. A student measures the time for 20 oscillations of a simple pendulum as 40.0 s. What is the absolute uncertainty in the calculated time period (T) of one oscillation?',
    options: ['0.005 s', '0.1 s', '0.05 s', '0.01 s'],
    correct: 0,
    topic: 'Uncertainty and Least Count Propagation',
    chapter: 'Measurements',
    explain: 'Uncertainty in total time = least count = 0.1 s. Uncertainty in one oscillation time period T = (least count) / (number of oscillations) = 0.1 s / 20 = 0.005 s.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-22',
    q: 'Which of the following physical quantities is dimensionless yet possesses a standard SI unit?',
    options: ['Plane angle (Radian)', 'Specific heat capacity', 'Refractive index', 'Universal gravitational constant'],
    correct: 0,
    topic: 'Supplementary SI Units and Dimensions',
    chapter: 'Measurements',
    explain: 'Plane angle is the ratio of arc length to radius (s / r = [L]/[L] = dimensionless [M^0 L^0 T^0]). However, in the SI system it is assigned the supplementary unit radian (rad). Similarly, solid angle has steradian (sr).',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Scalars and Vectors (3 MCQs: 23 to 25) ---
  {
    id: 'mdcat-b7-phy-23',
    q: 'Two forces of magnitudes 6 N and 8 N act simultaneously on a body at right angles (90°) to each other. What is the magnitude of their resultant force vector?',
    options: ['10 N', '14 N', '2 N', '48 N'],
    correct: 0,
    topic: 'Vector Addition by Rectangular Components',
    chapter: 'Scalars and Vectors',
    explain: 'Resultant R = sqrt(F1^2 + F2^2 + 2 F1 F2 cos θ). Since θ = 90°, cos(90°) = 0, so R = sqrt(6^2 + 8^2) = sqrt(36 + 64) = sqrt(100) = 10 N.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-24',
    q: 'If the scalar (dot) product of two non-zero vectors equals the magnitude of their vector (cross) product (|A · B| = |A × B|), what is the angle θ between them?',
    options: ['45° (π/4 radians)', '90°', '0°', '60°'],
    correct: 0,
    topic: 'Dot and Cross Products of Vectors',
    chapter: 'Scalars and Vectors',
    explain: 'A · B = AB cos θ, and |A × B| = AB sin θ. If AB cos θ = AB sin θ, then sin θ / cos θ = tan θ = 1. Therefore, θ = arctan(1) = 45°.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-25',
    q: 'A body is in complete mechanical equilibrium when which two equilibrium conditions are simultaneously satisfied?',
    options: [
      'Net external force is zero (ΣF = 0) and net external torque is zero (Στ = 0)',
      'Linear momentum is zero and angular momentum is zero',
      'Net force is zero while linear velocity is changing',
      'Net torque is maximum and angular acceleration is zero'
    ],
    correct: 0,
    topic: 'Conditions of Complete Mechanical Equilibrium',
    chapter: 'Scalars and Vectors',
    explain: 'Complete equilibrium requires translational equilibrium (First Condition: vector sum of all external forces ΣF = 0, so a = 0) and rotational equilibrium (Second Condition: vector sum of all external torques Στ = 0, so α = 0).',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Oscillations (3 MCQs: 26 to 28) ---
  {
    id: 'mdcat-b7-phy-26',
    q: 'In simple harmonic motion (SHM) of a mass on a spring, at which position is the magnitude of acceleration maximum and the kinetic energy zero?',
    options: ['At the extreme positions (x = ±x0)', 'At the mean equilibrium position (x = 0)', 'At x = x0 / 2', 'At x = x0 / sqrt(2)'],
    correct: 0,
    topic: 'Kinematics and Energetics of SHM',
    chapter: 'Oscillations',
    explain: 'In SHM, acceleration a = -ω^2 x; it reaches its maximum magnitude at extreme displacements (|x| = x0). At extremes, instantaneous velocity v = 0, so kinetic energy KE = 0 and potential energy is maximum.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-27',
    q: 'What is the time period of a simple pendulum of length L placed inside an elevator ascending vertically with an upward acceleration \'a\'?',
    options: ['T = 2π sqrt(L / (g + a))', 'T = 2π sqrt(L / (g - a))', 'T = 2π sqrt(L / g)', 'T = 2π sqrt(L / a)'],
    correct: 0,
    topic: 'Simple Pendulum in Accelerated Frames',
    chapter: 'Oscillations',
    explain: 'In an upwardly accelerating elevator, the effective gravitational acceleration experienced in the non-inertial frame is g_eff = g + a. Therefore, time period T = 2π sqrt(L / g_eff) = 2π sqrt(L / (g + a)).',
    difficulty: 'Medium',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-28',
    q: 'When the frequency of an external periodic driving force matches the natural frequency of an oscillating system, the amplitude of oscillation becomes exceptionally large. This phenomenon is termed:',
    options: ['Resonance', 'Damping', 'Diffraction', 'Superposition'],
    correct: 0,
    topic: 'Forced Oscillations and Resonance',
    chapter: 'Oscillations',
    explain: 'Resonance occurs when the driving frequency matches the system\'s natural frequency (ω_drive = ω0), maximizing energy transfer from driver to oscillator and producing large amplitude oscillations.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electromagnetic Induction (3 MCQs: 29 to 31) ---
  {
    id: 'mdcat-b7-phy-29',
    q: 'According to Faraday\'s law of electromagnetic induction, the magnitude of the induced electromotive force (EMF) in a closed circuit is directly proportional to:',
    options: [
      'The time rate of change of magnetic flux linked with the circuit',
      'The static magnetic flux passing through the loop',
      'The electrical resistance of the loop',
      'The capacitance of the surrounding medium'
    ],
    correct: 0,
    topic: 'Faraday\'s Law of Electromagnetic Induction',
    chapter: 'Electromagnetic Induction',
    explain: 'Faraday\'s law states that ε = -N (dΦB / dt), meaning the induced electromotive force is directly proportional to the time rate of change of magnetic flux linked through the coil.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-30',
    q: 'Lenz\'s law, which states that the direction of an induced current always opposes the change in magnetic flux producing it, is a direct manifestation of which fundamental physical law?',
    options: ['Law of conservation of energy', 'Law of conservation of electric charge', 'Law of conservation of linear momentum', 'Newton\'s third law'],
    correct: 0,
    topic: 'Lenz\'s Law and Conservation of Energy',
    chapter: 'Electromagnetic Induction',
    explain: 'Lenz\'s law enforces conservation of energy. The negative sign in ε = -dΦ/dt ensures that mechanical work performed against opposing induced magnetic forces is what gets converted into electrical energy.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-31',
    q: 'An ideal step-up transformer has a primary-to-secondary turns ratio of Np:Ns = 1:5. If the primary voltage is 120 V AC, what is the output secondary voltage?',
    options: ['600 V', '24 V', '120 V', '3000 V'],
    correct: 0,
    topic: 'Transformer Equations and Voltage Transformation',
    chapter: 'Electromagnetic Induction',
    explain: 'For an ideal transformer, Vs / Vp = Ns / Np. Therefore, Vs = Vp × (Ns / Np) = 120 V × (5 / 1) = 600 V.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electronics (3 MCQs: 32 to 34) ---
  {
    id: 'mdcat-b7-phy-32',
    q: 'In a semiconductor p-n junction diode under forward bias conditions:',
    options: [
      'The external electric field opposes the built-in junction barrier potential, narrowing the depletion region and permitting current flow',
      'The depletion region widens substantially, preventing any majority carrier migration',
      'Electrons and holes are pushed away from the junction interface',
      'Breakdown occurs via avalanche multiplication'
    ],
    correct: 0,
    topic: 'p-n Junction Diode Biasing',
    chapter: 'Electronics',
    explain: 'Forward bias connects the p-side to positive and n-side to negative. The applied potential counters the internal barrier potential (~0.7 V for Si), narrowing the depletion layer and allowing majority carriers to cross.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-33',
    q: 'How many semiconductor diodes are utilized in a standard bridge full-wave rectifier to rectify alternating current into pulsating direct current?',
    options: ['4 diodes', '2 diodes', '1 diode', '3 diodes'],
    correct: 0,
    topic: 'Bridge Full-Wave Rectification',
    chapter: 'Electronics',
    explain: 'A bridge rectifier uses 4 diodes arranged in a closed loop (Wheatstone bridge format). In each half-cycle of input AC, two diagonally opposite diodes conduct while two are reverse-biased, delivering full-wave rectification without a center-tapped transformer.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-34',
    q: 'In an operational amplifier (op-amp), an ideal differential amplifier possesses which theoretical input impedance (R_in) and open-loop voltage gain (A_OL)?',
    options: ['Infinite input impedance and infinite open-loop voltage gain', 'Zero input impedance and zero voltage gain', 'Infinite output impedance and unit gain', 'Zero input impedance and infinite output impedance'],
    correct: 0,
    topic: 'Operational Amplifier Characteristics',
    chapter: 'Electronics',
    explain: 'An ideal op-amp has infinite input impedance (R_in = ∞, drawing zero input current), zero output impedance (R_out = 0), infinite open-loop voltage gain (A_OL = ∞), and infinite bandwidth.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Dawn of Modern Physics (3 MCQs: 35 to 37) ---
  {
    id: 'mdcat-b7-phy-35',
    q: 'In Einstein\'s photoelectric effect equation (hf = Φ + KE_max), what physical parameter does the work function (Φ) represent?',
    options: [
      'The minimum photon energy required to liberate the most loosely bound electron from the metal surface',
      'The maximum kinetic energy of ejected photoelectrons',
      'The threshold frequency divided by Planck\'s constant',
      'The stopping potential multiplied by electron mass'
    ],
    correct: 0,
    topic: 'Photoelectric Effect and Work Function',
    chapter: 'Dawn of Modern Physics',
    explain: 'The work function Φ = hf0 is the characteristic threshold energy needed to detach an electron from the metal surface. Any excess photon energy above Φ appears as maximum kinetic energy of the photoelectron.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-36',
    q: 'According to Louis de Broglie\'s matter wave hypothesis, what is the wavelength (λ) associated with a moving particle of mass m traveling with velocity v?',
    options: ['λ = h / (m v)', 'λ = m v / h', 'λ = h / (m c^2)', 'λ = sqrt(2m E) / h'],
    correct: 0,
    topic: 'De Broglie Matter Waves',
    chapter: 'Dawn of Modern Physics',
    explain: 'De Broglie proposed wave-particle duality: any moving matter with linear momentum p = m·v has an associated pilot wave with wavelength λ = h / p = h / (m v).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-37',
    q: 'In Compton scattering, when an incident X-ray photon of wavelength λ collides with a stationary free electron, the scattered photon emerges with:',
    options: [
      'A longer wavelength (λ\' > λ) and lower frequency due to energy transferred to the recoiling electron',
      'A shorter wavelength (λ\' < λ) and higher frequency',
      'An unchanged wavelength regardless of scattering angle',
      'Zero frequency and infinite momentum'
    ],
    correct: 0,
    topic: 'Compton Scattering Effect',
    chapter: 'Dawn of Modern Physics',
    explain: 'Compton scattering treats X-ray photons as relativistic particles. In an elastic collision with a stationary electron, the photon imparts kinetic energy to the recoiling electron, emerging with less energy and thus a longer wavelength: Δλ = (h / m_e c)(1 - cos θ).',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Nuclear Physics (3 MCQs: 38 to 40) ---
  {
    id: 'mdcat-b7-phy-38',
    q: 'The mass defect (Δm) of an atomic nucleus represents:',
    options: [
      'The difference between the total mass of individual constituent nucleons and the actual resting mass of the assembled nucleus',
      'The mass lost by radioactive decay per unit time',
      'The mass of outer orbital electrons',
      'The total relativistic mass at speed of light'
    ],
    correct: 0,
    topic: 'Mass Defect and Nuclear Binding Energy',
    chapter: 'Nuclear Physics',
    explain: 'The mass of a stable nucleus is always less than the sum of the resting masses of its free constituent protons and neutrons: Δm = [Z·mp + (A-Z)mn] - M_nucleus. This mass defect converts into binding energy via E = Δm·c^2.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-39',
    q: 'A radioactive isotope has a half-life (t_1/2) of 6.0 hours. If an initial sample contains 80 mg of this isotope, what mass remains undecayed after 24 hours?',
    options: ['5 mg', '10 mg', '20 mg', '2.5 mg'],
    correct: 0,
    topic: 'Radioactive Decay Law and Half-Life',
    chapter: 'Nuclear Physics',
    explain: 'Number of elapsed half-lives n = total time / half-life = 24 / 6.0 = 4 half-lives. Remaining mass = N0 / (2^n) = 80 mg / (2^4) = 80 / 16 = 5.0 mg.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-40',
    q: 'In negative beta decay (β- decay), what nuclear transformation takes place inside the unstable radioactive nucleus, and what subatomic particle is emitted alongside the beta electron?',
    options: [
      'A neutron transforms into a proton, emitting an electron and an electron antineutrino',
      'A proton transforms into a neutron, emitting a positron and a neutrino',
      'Two protons fuse together, emitting an alpha particle',
      'A neutron absorbs an electron, emitting a gamma ray'
    ],
    correct: 0,
    topic: 'Beta Decay and Antineutrino Emission',
    chapter: 'Nuclear Physics',
    explain: 'In β- decay mediated by the weak force, an intra-nuclear down quark converts to an up quark: n -> p + e- + ν_e(bar). Thus, a neutron becomes a proton while ejecting an energetic electron (β-) and an electron antineutrino.',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Force and Motion (2 MCQs: 41 to 42) ---
  {
    id: 'mdcat-b7-phy-41',
    q: 'A 2.0 kg projectile is launched with an initial velocity of 50 m/s at an angle of 30° above the horizontal. Neglecting air resistance, what is the magnitude of its velocity at the peak of its trajectory? (g = 9.8 m/s^2)',
    options: ['43.3 m/s', '0 m/s', '25.0 m/s', '50.0 m/s'],
    correct: 0,
    topic: 'Projectile Motion - Velocity at Summit',
    chapter: 'Force and Motion',
    explain: 'At the apex of projectile flight, the vertical velocity component vy = 0. The horizontal velocity vx remains constant throughout flight: vx = v0 cos θ = 50 × cos(30°) = 50 × (sqrt(3)/2) ≈ 43.3 m/s.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-42',
    q: 'In an elastic one-dimensional collision between two bodies of masses m1 and m2, which physical quantities are conserved throughout the collision?',
    options: ['Both total linear momentum and total kinetic energy', 'Total linear momentum only', 'Total kinetic energy only', 'Neither momentum nor kinetic energy'],
    correct: 0,
    topic: 'Elastic Collisions in One Dimension',
    chapter: 'Force and Motion',
    explain: 'By definition, in a perfectly elastic collision, no kinetic energy is converted into heat, sound, or permanent deformation. Thus, both total linear momentum and total mechanical kinetic energy are conserved.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Work, Energy and Power (2 MCQs: 43 to 44) ---
  {
    id: 'mdcat-b7-phy-43',
    q: 'According to the work-energy theorem, the total work done by all forces (conservative and non-conservative) acting on a body equals:',
    options: ['The change in kinetic energy of the body (W_net = ΔKE)', 'The change in potential energy only', 'The total momentum of the body', 'The instantaneous mechanical power'],
    correct: 0,
    topic: 'Work-Energy Theorem',
    chapter: 'Work, Energy and Power',
    explain: 'The work-energy theorem states that W_net = F_net · d = m·a·d = (1/2)m vf^2 - (1/2)m vi^2 = ΔKE. The net work done on an object always equals the change in its kinetic energy.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-44',
    q: 'An electric crane lifts a 500 kg crate vertically upward through a height of 20 meters at constant speed in 10 seconds. What is the average power delivered by the crane? (Take g = 9.8 m/s^2)',
    options: ['9,800 Watts (9.8 kW)', '4,900 Watts', '1,000 Watts', '98,000 Watts'],
    correct: 0,
    topic: 'Power Calculations',
    chapter: 'Work, Energy and Power',
    explain: 'Work done W = m g h = 500 kg × 9.8 m/s^2 × 20 m = 98,000 Joules. Average power P = W / t = 98,000 J / 10 s = 9,800 W = 9.8 kW.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Rotational and Circular Motion (2 MCQs: 45 to 46) ---
  {
    id: 'mdcat-b7-phy-45',
    q: 'A stone attached to a string is whirled in a horizontal circle of radius r with constant tangential speed v. If the speed is doubled while the radius is kept constant, by what factor does the required centripetal force change?',
    options: ['Increases by a factor of 4', 'Increases by a factor of 2', 'Decreases by half', 'Remains unchanged'],
    correct: 0,
    topic: 'Centripetal Force Dependencies',
    chapter: 'Rotational and Circular Motion',
    explain: 'Centripetal force is given by Fc = (m v^2) / r. Since Fc is proportional to v^2, doubling tangential velocity (v -> 2v) increases centripetal force by (2)^2 = 4 times.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-46',
    q: 'The moment of inertia (I) of a rigid body rotating about an axis depends on:',
    options: ['The mass of the body and the spatial distribution of mass relative to the axis of rotation', 'The angular velocity of rotation exclusively', 'The applied external torque', 'The gravitational field strength'],
    correct: 0,
    topic: 'Moment of Inertia and Rotational Dynamics',
    chapter: 'Rotational and Circular Motion',
    explain: 'Moment of inertia I = Σ m_i r_i^2 depends on the total mass of the object, its geometrical shape, and crucially how that mass is distributed relative to the designated rotational axis.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Fluid Dynamics (2 MCQs: 47 to 48) ---
  {
    id: 'mdcat-b7-phy-47',
    q: 'According to Bernoulli\'s theorem for the steady, non-viscous, incompressible streamline flow of an ideal fluid, where the fluid velocity increases along a horizontal pipe:',
    options: ['The static fluid pressure decreases', 'The static fluid pressure increases', 'The fluid density increases', 'The viscosity increases'],
    correct: 0,
    topic: 'Bernoulli\'s Equation and Venturi Effect',
    chapter: 'Fluid Dynamics',
    explain: 'Bernoulli\'s equation along a horizontal streamline (h1 = h2) states: P + (1/2)ρ v^2 = constant. If fluid velocity v increases (e.g., at a constriction), dynamic pressure rises and static pressure P must decrease.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-48',
    q: 'According to the equation of continuity (A1 v1 = A2 v2), when water flows from a pipe of cross-sectional area A into a constricted nozzle of area A/4, the velocity of the water exiting the nozzle:',
    options: ['Increases by a factor of 4', 'Decreases by a factor of 4', 'Increases by a factor of 16', 'Remains unchanged'],
    correct: 0,
    topic: 'Equation of Continuity in Fluid Flow',
    chapter: 'Fluid Dynamics',
    explain: 'For incompressible fluids, volume flow rate is constant: A1 v1 = A2 v2 => v2 = (A1 / A2) v1 = (A / (A/4)) v1 = 4 v1. The speed quadruples.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Waves (2 MCQs: 49 to 50) ---
  {
    id: 'mdcat-b7-phy-49',
    q: 'When an ambulance sounding its siren at frequency f0 travels with speed vs directly toward a stationary pedestrian, the apparent frequency (f\') heard by the pedestrian is:',
    options: ['f\' = f0 [v / (v - vs)] (higher pitch)', 'f\' = f0 [v / (v + vs)]', 'f\' = f0 [(v + vs) / v]', 'f\' = f0'],
    correct: 0,
    topic: 'Doppler Effect for Sound Waves',
    chapter: 'Waves',
    explain: 'According to the Doppler effect, as a source approaches a stationary observer, the sound wavefronts are compressed in front of the source, decreasing apparent wavelength and elevating observed frequency: f\' = f0 [v / (v - vs)].',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-50',
    q: 'In Young\'s double-slit experiment, what happens to the fringe width (fringe spacing β = λL / d) on the screen if the distance (d) between the two coherent slits is doubled?',
    options: ['Fringe width is halved', 'Fringe width is doubled', 'Fringe width is quadrupled', 'Fringe width remains unchanged'],
    correct: 0,
    topic: 'Young\'s Double-Slit Experiment - Fringe Spacing',
    chapter: 'Waves',
    explain: 'Fringe spacing β = λ L / d is inversely proportional to slit separation d. Doubling d (d -> 2d) halves the fringe spacing β (fringes become twice as closely packed).',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Thermodynamics (2 MCQs: 51 to 52) ---
  {
    id: 'mdcat-b7-phy-51',
    q: 'In an adiabatic thermodynamic expansion of an ideal gas, no heat enters or leaves the system (Q = 0). What is the relationship between the work done by the gas (W) and its internal energy (ΔU)?',
    options: ['W = -ΔU (gas cools as internal energy decreases)', 'W = +ΔU', 'ΔU = 0', 'W = 0'],
    correct: 0,
    topic: 'First Law Applied to Adiabatic Processes',
    chapter: 'Thermodynamics',
    explain: 'From the first law of thermodynamics, Q = ΔU + W. In an adiabatic process, Q = 0, so W = -ΔU. When the gas expands and does positive work (W > 0), its internal energy drops (ΔU < 0), causing the gas temperature to fall.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-52',
    q: 'What is the theoretical thermodynamic efficiency (η) of a Carnot heat engine operating between a hot thermal reservoir at 500 K and a cold reservoir at 300 K?',
    options: ['40% (0.40)', '60%', '20%', '100%'],
    correct: 0,
    topic: 'Carnot Cycle Efficiency',
    chapter: 'Thermodynamics',
    explain: 'Carnot efficiency η = 1 - (Tc / Th) = 1 - (300 / 500) = 1 - 0.60 = 0.40 or 40%.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electrostatics (2 MCQs: 53 to 54) ---
  {
    id: 'mdcat-b7-phy-53',
    q: 'According to Coulomb\'s law, if the distance (r) between two point charges is halved while their charges remain unchanged, the electrostatic force (F) between them:',
    options: ['Increases by a factor of 4', 'Increases by a factor of 2', 'Decreases by half', 'Decreases by a factor of 4'],
    correct: 0,
    topic: 'Coulomb\'s Law and Inverse-Square Dependence',
    chapter: 'Electrostatics',
    explain: 'Coulomb\'s force F = (1 / 4πε0) · (q1 q2 / r^2). Because force is inversely proportional to r^2, reducing distance to r/2 increases electrostatic force by (1 / (1/2)^2) = 4 times.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-54',
    q: 'What is the electrostatic potential (V) inside a hollow charged spherical conductor of radius R carrying a total surface charge Q?',
    options: [
      'Constant everywhere inside and equal to the potential at the surface [V = Q / (4πε0 R)]',
      'Zero everywhere inside',
      'Linearly increasing toward the center',
      'Infinite at the exact center'
    ],
    correct: 0,
    topic: 'Electric Potential Inside a Charged Conductor',
    chapter: 'Electrostatics',
    explain: 'Inside a hollow charged conductor, electric field E = -dV/dr = 0 everywhere. Since dV/dr = 0, the electric potential V is uniform and constant throughout the interior, equal to the surface value: V = Q / (4πε0 R).',
    difficulty: 'Medium',
    subject: 'Physics'
  },

  // --- Current Electricity (3 MCQs: 55 to 57) ---
  {
    id: 'mdcat-b7-phy-55',
    q: 'A metallic wire of electrical resistance R is uniformly stretched to twice its original length (L\' = 2L) without altering its mass or density. What is its new electrical resistance (R\')?',
    options: ['4 R', '2 R', 'R / 2', 'R / 4'],
    correct: 0,
    topic: 'Resistance and Volume Invariance During Stretching',
    chapter: 'Current Electricity',
    explain: 'Volume V = A · L remains constant during stretching. When length doubles (L\' = 2L), cross-sectional area halves (A\' = A/2). Resistance R\' = ρ (L\' / A\') = ρ (2L / (A/2)) = 4 · [ρ(L/A)] = 4 R.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-56',
    q: 'In a balanced Wheatstone bridge circuit with four resistors R1, R2, R3, and R4 arranged in a diamond, what is the electric current flowing through the sensitive central galvanometer?',
    options: ['Zero Amperes', 'Maximum circuit current', 'V / (R1 + R2)', 'Infinite current'],
    correct: 0,
    topic: 'Wheatstone Bridge Principle',
    chapter: 'Current Electricity',
    explain: 'When the ratio condition R1 / R2 = R3 / R4 is fulfilled, the two bridge nodes flanking the galvanometer are at identical electrical potentials. With zero potential difference (ΔV = 0), no current passes through the galvanometer.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-57',
    q: 'Kirchhoff\'s First Rule (Junction Rule: ΣI = 0) and Kirchhoff\'s Second Rule (Loop Rule: ΣV = 0) are consequences of which two fundamental conservation laws, respectively?',
    options: [
      'Conservation of electric charge and conservation of energy',
      'Conservation of energy and conservation of electric charge',
      'Conservation of linear momentum and conservation of angular momentum',
      'Conservation of mass and conservation of electric charge'
    ],
    correct: 0,
    topic: 'Kirchhoff\'s Rules and Conservation Laws',
    chapter: 'Current Electricity',
    explain: 'Kirchhoff\'s junction rule (total current entering equals total current leaving) reflects conservation of electric charge. The loop rule (sum of potential changes around a closed loop is zero) reflects conservation of energy.',
    difficulty: 'Easy',
    subject: 'Physics'
  },

  // --- Electromagnetism (3 MCQs: 58 to 60) ---
  {
    id: 'mdcat-b7-phy-58',
    q: 'A charged particle of charge q and mass m enters a uniform magnetic field B with velocity v directed perpendicular (90°) to the field lines. What is the radius (r) of its resulting circular trajectory?',
    options: ['r = (m v) / (q B)', 'r = (q B) / (m v)', 'r = (q v) / (m B)', 'r = (m B) / (q v)'],
    correct: 0,
    topic: 'Motion of Charged Particles in Magnetic Fields',
    chapter: 'Electromagnetism',
    explain: 'The magnetic Lorentz force provides the necessary centripetal force: q v B sin(90°) = (m v^2) / r. Solving for r gives r = (m v) / (q B).',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-59',
    q: 'What is the magnetic force (F) experienced by a stationary electric charge (v = 0) placed inside an intensely strong constant magnetic field (B)?',
    options: ['Zero Newtons', 'F = q B', 'F = q / B', 'F = q B c'],
    correct: 0,
    topic: 'Magnetic Force on Charges',
    chapter: 'Electromagnetism',
    explain: 'The magnetic force on a charge is given by F = q (v × B) = q v B sin θ. If the charge is at rest (v = 0), the magnetic force is identically zero. Magnetic fields exert forces only on moving charges.',
    difficulty: 'Easy',
    subject: 'Physics'
  },
  {
    id: 'mdcat-b7-phy-60',
    q: 'Ampère\'s circuital law states that the line integral of magnetic flux density B around any closed loop is equal to:',
    options: ['μ0 × I_enclosed (permeability of free space multiplied by total enclosed current)', 'ε0 × I_enclosed', 'I_enclosed / μ0', 'Zero always'],
    correct: 0,
    topic: 'Ampère\'s Circuital Law',
    chapter: 'Electromagnetism',
    explain: 'Ampère\'s circuital law states that ∮ B · dl = μ0 · I_enclosed, linking the circulation of the magnetic field around any closed path to the net steady current puncturing the surface bounded by the path.',
    difficulty: 'Medium',
    subject: 'Physics'
  }
];

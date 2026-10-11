import { Question } from '../types';

export const MDCAT_PHYSICS_BATCH3: Question[] = [
  {
    "id": "mdcat-b3-phy-1",
    "q": "What is the root mean square (rms) value of an alternating voltage whose peak amplitude is 282 V?",
    "options": [
      "200 V",
      "141 V",
      "282 V",
      "400 V"
    ],
    "correct": 0,
    "topic": "Alternating Current",
    "explain": "V_rms = V₀ / $\\sqrt${2} ≈ 282 / 1.414 = 200 V.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Alternating Current",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-2",
    "q": "In a purely capacitive AC circuit, what is the phase relationship between alternating current and alternating voltage?",
    "options": [
      "Current leads voltage by $90^\\circ$ (π/2 radians)",
      "Current lags voltage by $90^\\circ$ (π/2 radians)",
      "Current and voltage are strictly in phase",
      "Current lags voltage by $180^\\circ$ (π radians)"
    ],
    "correct": 0,
    "topic": "Alternating Current",
    "explain": "In a capacitor, charging current reaches peak value a quarter-cycle before the potential difference builds up across the plates, so current leads voltage by π/2 ($90^\\circ$).",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Alternating Current",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-3",
    "q": "An AC circuit operates at 50 Hz. What is the capacitive reactance of a 100 μF capacitor connected across this supply?",
    "options": [
      "31.8 Ω",
      "15.9 Ω",
      "63.7 Ω",
      "314 Ω"
    ],
    "correct": 0,
    "topic": "Alternating Current",
    "explain": "Xc = 1 / (2π f C) = 1 / (2 * 3.1416 * 50 * 100 * 10⁻⁶) = 1 / (0.031416) ≈ 31.8 Ω.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Alternating Current",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-4",
    "q": "In a series R-L-C circuit at resonance, the impedance of the circuit is:",
    "options": [
      "Purely resistive and at its minimum value (Z = R)",
      "Purely inductive and at its maximum value",
      "Purely capacitive and approaching zero",
      "Infinite because reactances cancel completely"
    ],
    "correct": 0,
    "topic": "Alternating Current",
    "explain": "At resonance, inductive reactance equals capacitive reactance (X_L = X_C), making net reactance zero. Total impedance Z = √($R^{2}$ + (X_L - X_C)^{2}) = R, which is minimum.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Alternating Current",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-5",
    "q": "A series R-L circuit with resistance R = 30 Ω and inductive reactance X_L = 40 Ω is connected to a 100 V (rms) source. What is the power factor of this circuit?",
    "options": [
      "0.6",
      "0.8",
      "0.75",
      "1.0"
    ],
    "correct": 0,
    "topic": "Alternating Current",
    "explain": "Impedance Z = $\\sqrt${$R^{2}$ + X_$L^{2}$} = $\\sqrt${$30^{2} +  40^{2}$} = 50 Ω. Power factor cos θ = R / Z = 30 / 50 = 0.6.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Alternating Current",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-6",
    "q": "An inductor of inductance 0.5 H and negligible resistance is connected to an AC source of V = 141 sin(100π t). What is the peak current flowing through the inductor?",
    "options": [
      "0.90 A",
      "1.41 A",
      "2.82 A",
      "0.45 A"
    ],
    "correct": 0,
    "topic": "Alternating Current",
    "explain": "Inductive reactance X_L = ωL = 100π * 0.5 = 50π ≈ 157 Ω. Peak current I₀ = V₀ / X_L = 141 / 157 ≈ 0.90 A.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Alternating Current",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-7",
    "q": "What is the quality factor (Q-factor) of a series resonant circuit with R = 10 Ω, L = 0.1 H, and C = 10 μF?",
    "options": [
      "10",
      "100",
      "1",
      "50"
    ],
    "correct": 0,
    "topic": "Alternating Current",
    "explain": "Q = (1/R) * $\\sqrt${L/C} = (1/10) * √(0.1 / (10 * 10⁻⁶)) = (1/10) * $\\sqrt${10,000} = (1/10) * 100 = 10.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Alternating Current",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-8",
    "q": "Which spectral series of atomic hydrogen lies in the visible region of electromagnetic radiation?",
    "options": [
      "Balmer series",
      "Lyman series",
      "Paschen series",
      "Brackett series"
    ],
    "correct": 0,
    "topic": "Atomic Spectra",
    "explain": "The Balmer series corresponds to electron transitions down to principal quantum level n = 2, emitting photon wavelengths in the visible spectrum (400–700 nm).",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Atomic Spectra",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-9",
    "q": "According to Bohr's postulates, what is the quantized condition for orbital angular momentum of an electron?",
    "options": [
      "L = n h / (2π)",
      "L = n h / (4π)",
      "L = 2π n / h",
      "L = $n^{2}$ h / (2π)"
    ],
    "correct": 0,
    "topic": "Atomic Spectra",
    "explain": "Bohr's second postulate states that the orbital angular momentum of an electron in a permitted stationary orbit is an integral multiple of h/(2π): mvr = nh/(2π).",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Atomic Spectra",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-10",
    "q": "What is the ground state energy of an electron in a hydrogen atom?",
    "options": [
      "-13.6 eV",
      "-3.4 eV",
      "-1.51 eV",
      "0 eV"
    ],
    "correct": 0,
    "topic": "Atomic Spectra",
    "explain": "The energy of the n-th orbital in a hydrogen atom is E_n = -13.6 / $n^{2}$ eV. For the ground state (n = 1), E₁ = -13.6 eV.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Atomic Spectra",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-11",
    "q": "What is the wavelength of the photon emitted when an electron in hydrogen transitions from n = 2 to n = 1 (Lyman-alpha)? (Rydberg constant R_H ≈ 1.097 × 10⁷ m^{-1})",
    "options": [
      "121.5 nm",
      "656.3 nm",
      "91.2 nm",
      "486.1 nm"
    ],
    "correct": 0,
    "topic": "Atomic Spectra",
    "explain": "1/λ = R_H (1/$1^{2}$ - 1/$2^{2}$) = (3/4) R_H. λ = 4 / (3 * 1.097 × 10⁷) ≈ 1.215 × 10⁻⁷ m = 121.5 nm.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Atomic Spectra",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-12",
    "q": "What is the radius of the third Bohr orbit (n = 3) of the hydrogen atom, given that the Bohr radius r₁ = 0.529 Å?",
    "options": [
      "4.76 Å",
      "1.59 Å",
      "2.12 Å",
      "9.00 Å"
    ],
    "correct": 0,
    "topic": "Atomic Spectra",
    "explain": "The radius of the n-th Bohr orbit scales with $n^{2}$: r_n = $n^{2}$ * r₁ = $3^{2}$ * 0.529 Å = 9 * 0.529 Å = 4.76 Å.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Atomic Spectra",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-13",
    "q": "The ionization potential of singly ionized helium (He⁺, Z = 2) in its ground state is:",
    "options": [
      "54.4 V",
      "13.6 V",
      "27.2 V",
      "108.8 V"
    ],
    "correct": 0,
    "topic": "Atomic Spectra",
    "explain": "Energy of a hydrogen-like ion is E_n = -13.6 * $Z^{2} /  n^{2}$ eV. For He⁺ (Z = 2, n = 1), E₁ = -13.6 * 4 = -54.4 eV. Thus, the ionization potential is 54.4 V.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Atomic Spectra",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-14",
    "q": "In a helium-neon gas laser, laser emission occurs at 632.8 nm due to transitions between which energy levels in neon atoms?",
    "options": [
      "Metastable 20.66 eV level to 18.70 eV level",
      "Ground state 0 eV to 20.61 eV",
      "Metastable 20.61 eV level of He to ground state",
      "Ionization level to 20.66 eV level"
    ],
    "correct": 0,
    "topic": "Atomic Spectra",
    "explain": "Electrons in He are excited to 20.61 eV by collision, resonant transfer excites Ne to 20.66 eV (3s state). Stimulated transition from 20.66 eV to 18.70 eV (2p state) emits 632.8 nm red laser photons.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Atomic Spectra",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-15",
    "q": "Which mechanical property is represented by the ratio of tensile stress to tensile strain within the proportional limit?",
    "options": [
      "Young's modulus",
      "Bulk modulus",
      "Shear modulus",
      "Poisson's ratio"
    ],
    "correct": 0,
    "topic": "Physics of Solids",
    "explain": "Young's modulus (Y) is defined as the ratio of tensile (or compressive) stress to tensile (or compressive) strain within the elastic limit: Y = (F/A) / (ΔL/L₀).",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Physics of Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-16",
    "q": "What are the SI units of Young's modulus of elasticity?",
    "options": [
      "N/$m^{2}$ (or Pascal, Pa)",
      "N·m",
      "Dimensionless",
      "N/m"
    ],
    "correct": 0,
    "topic": "Physics of Solids",
    "explain": "Since strain is dimensionless (ratio of lengths ΔL/L), Young's modulus has the same dimensions and units as stress (Force/Area), which is N/$m^{2}$ or Pa.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Physics of Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-17",
    "q": "A steel wire of length 2 m and cross-sectional area 1 $mm^{2}$ is stretched by 2 mm under a load. If Young's modulus is 2 × $10^{11}$ N/$m^{2}$, what is the tensile force applied?",
    "options": [
      "200 N",
      "100 N",
      "400 N",
      "20 N"
    ],
    "correct": 0,
    "topic": "Physics of Solids",
    "explain": "F = Y * A * (ΔL / L₀) = (2 × $10^{11}$ N/$m^{2}$) * (1 × 10⁻⁶ $m^{2}$) * (2 × 10⁻³ m / 2 m) = 2 × 10⁵ * 10⁻³ = 200 N.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Physics of Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-18",
    "q": "In band theory of solids, what characterizes an insulator at absolute zero temperature?",
    "options": [
      "A completely filled valence band, an empty conduction band, and a wide energy band gap (> 3 eV)",
      "An overlapping valence band and conduction band with zero band gap",
      "A partially filled conduction band and empty valence band",
      "A completely empty valence band and completely full conduction band"
    ],
    "correct": 0,
    "topic": "Physics of Solids",
    "explain": "Insulators have a completely filled valence band, an empty conduction band, and a large forbidden energy gap Eg > 3 eV (up to 6-9 eV in diamond), preventing thermal electron excitation.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Physics of Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-19",
    "q": "What is the electrical resistivity behavior of a pure intrinsic semiconductor with increasing temperature?",
    "options": [
      "Resistivity decreases exponentially because covalent bonds break, generating free electron-hole pairs",
      "Resistivity increases linearly due to lattice vibration scattering",
      "Resistivity remains completely constant regardless of temperature",
      "Resistivity instantly drops to zero at room temperature"
    ],
    "correct": 0,
    "topic": "Physics of Solids",
    "explain": "Semiconductors have a negative temperature coefficient of resistance. As temperature rises, thermal energy promotes valence electrons across the small band gap, increasing carrier concentration exponentially and lowering resistivity.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Physics of Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-20",
    "q": "What does the area enclosed by the magnetic hysteresis loop of a ferromagnetic material physically quantify?",
    "options": [
      "Thermal energy dissipated as heat per unit volume during one complete cycle of magnetization",
      "Saturation magnetization of the core material",
      "Electrical conductivity of the ferromagnetic crystal",
      "Curie temperature of the substance"
    ],
    "correct": 0,
    "topic": "Physics of Solids",
    "explain": "The area under the B-H hysteresis loop equals the energy lost as heat per unit volume of the ferromagnetic material in completing one full AC magnetization cycle: W = ∮ H dB.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Physics of Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-21",
    "q": "What is the strain energy stored per unit volume in an elastic material stretched to a tensile strain of 0.002 with Young's modulus 2 × $10^{11}$ N/$m^{2}$?",
    "options": [
      "4 × 10⁵ J/$m^{3}$",
      "2 × 10⁵ J/$m^{3}$",
      "8 × 10⁵ J/$m^{3}$",
      "4 × $10^{2}$ J/$m^{3}$"
    ],
    "correct": 0,
    "topic": "Physics of Solids",
    "explain": "Energy density u = (1/2) * Stress * Strain = (1/2) * Y * (Strain)^{2} = 0.5 * (2 × $10^{11}$) * (2 × 10⁻³)² = $10^{11}$ * (4 × 10⁻⁶) = 4 × 10⁵ J/$m^{3}$.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Physics of Solids",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-22",
    "q": "According to the equation of continuity for an incompressible fluid flowing steadily through a pipe, what quantity remains constant throughout the streamline flow?",
    "options": [
      "Product of cross-sectional area and fluid speed (A · v)",
      "Fluid pressure alone",
      "Fluid speed squared",
      "Viscous drag force"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "Equation of continuity: A₁v₁ = A₂v₂ = constant (volume flow rate Q), expressing conservation of mass for an incompressible fluid.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-23",
    "q": "Stokes' law for the viscous drag force F_d acting on a small spherical droplet of radius r falling through a fluid of viscosity η with terminal velocity v_t is given by:",
    "options": [
      "F_d = 6πηrv_t",
      "F_d = 4πη$r^{2}$v_t",
      "F_d = 6πη$r^{2}$v_$t^{2}$",
      "F_d = (1/2)πηrv_t"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "Stokes' law for laminar spherical drag is F = 6πηrv, where η is coefficient of viscosity, r is sphere radius, and v is speed.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-24",
    "q": "Water flows through a horizontal pipe of diameter 4 cm at a speed of 2 m/s. The pipe narrows to a diameter of 2 cm. What is the speed of water in the constricted section?",
    "options": [
      "8 m/s",
      "4 m/s",
      "16 m/s",
      "1 m/s"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "From continuity: A₁v₁ = A₂v₂ => (π d₁²/4) v₁ = (π d₂²/4) v₂ => v₂ = v₁ * (d₁/d₂)² = 2 * (4/2)^{2} = 2 * 4 = 8 m/s.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-25",
    "q": "According to Torricelli's theorem, what is the efflux speed of water escaping through a small orifice situated 5 m beneath the free surface of a wide open reservoir? (Take g = 10 m/$s^{2}$)",
    "options": [
      "10 m/s",
      "5 m/s",
      "14.1 m/s",
      "20 m/s"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "Torricelli's theorem: v = $\\sqrt${2gh} = $\\sqrt${2 * 10 * 5} = $\\sqrt${100} = 10 m/s.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-26",
    "q": "A horizontal pipe carries water. At point 1, speed is 2 m/s and static pressure is 30 kPa. At point 2, the speed increases to 6 m/s. Taking water density ρ = 1000 kg/$m^{3}$, what is the static pressure at point 2?",
    "options": [
      "14 kPa",
      "22 kPa",
      "26 kPa",
      "10 kPa"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "Bernoulli's equation for horizontal pipe: P₁ + (1/2)ρv₁² = P₂ + (1/2)ρv₂² => P₂ = P₁ + (1/2)ρ(v₁² - v₂²) = 30,000 + 0.5 * 1000 * (4 - 36) = 30,000 - 16,000 = 14,000 Pa = 14 kPa.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-27",
    "q": "Two small spherical water mist droplets of identical radius r fall through air at a terminal speed of 0.05 m/s. If the two droplets coalesce into a single spherical drop, what is the new terminal speed?",
    "options": [
      "0.079 m/s",
      "0.100 m/s",
      "0.050 m/s",
      "0.125 m/s"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "Volume doubles: (4/3)π $R^{3}$ = 2 * (4/3)π $r^{3}$ \\implies R = 2^{1/3} r. Terminal velocity v_t ∝ $r^{2}$ \\implies v_new = v_old * (R/r)^{2} = 0.05 * 2^{2/3} ≈ 0.05 * 1.587 = 0.0794 m/s.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-28",
    "q": "Which of the following physical quantities is an SI base unit?",
    "options": [
      "Candela (cd)",
      "Newton (N)",
      "Joule (J)",
      "Coulomb (C)"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "The seven SI base units are meter, kilogram, second, ampere, kelvin, mole, and candela. Newton, Joule, and Coulomb are derived units.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-29",
    "q": "What are the dimensions of universal gravitational constant G in terms of fundamental dimensions [M, L, T]?",
    "options": [
      "[M^{-1} $L^{3}$ T⁻²]",
      "[M L T⁻²]",
      "[M^{-1} $L^{2}$T^{-1}]",
      "[$M^{2}$ L⁻³ T⁻²]"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "From Newton's law: F = G m₁m₂ / $r^{2}$ \\implies G = F $r^{2} /  m^{2}$ => [M L T⁻²] [$L^{2}$] / [$M^{2}$] = [M^{-1} $L^{3}$ T⁻²].",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-30",
    "q": "The radius of a sphere is measured as r = (2.0 ± 0.1) cm. What is the percentage uncertainty in the calculated volume of the sphere?",
    "options": [
      "15%",
      "5%",
      "10%",
      "3%"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "Percentage uncertainty in radius = (0.1 / 2.0) * 100% = 5%. Since volume V = (4/3)π $r^{3}$, percentage uncertainty in volume = 3 * (% uncertainty in r) = 3 * 5% = 15%.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-31",
    "q": "A student measures current I = (4.0 ± 0.2) A and resistance R = (20.0 ± 0.5) Ω. What is the total percentage uncertainty in the calculated dissipated electrical power (P = $I^{2}$R)?",
    "options": [
      "12.5%",
      "7.5%",
      "10.0%",
      "5.0%"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "% uncertainty in I = (0.2 / 4.0) * 100% = 5.0%. % uncertainty in R = (0.5 / 20.0) * 100% = 2.5%. For P = $I^{2}$R: % uncertainty = 2 * (% in I) + (% in R) = 2 * 5.0% + 2.5% = 12.5%.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-32",
    "q": "Which of the following combinations of physical variables possesses the exact dimensions of time [T]?",
    "options": [
      "L / R (Inductance / Resistance)",
      "R $C^{2}$ (Resistance × $Capacitance^{2}$)",
      "L C (Inductance × Capacitance)",
      "R / L (Resistance / Inductance)"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "The inductive time constant of an RL circuit is τ = L/R, which has the dimension of time [T]. Similarly, RC has dimension of time [T], whereas $\\sqrt${LC} has dimension of time.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-33",
    "q": "In a screw gauge, the pitch is 0.5 mm and the circular scale is divided into 50 equal divisions. When measuring the diameter of a thin wire, main scale reads 2.5 mm and 28th division coincides with reference line. What is the diameter if zero error is -0.04 mm?",
    "options": [
      "2.82 mm",
      "2.74 mm",
      "2.78 mm",
      "2.86 mm"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "Least count = 0.5 mm / 50 = 0.01 mm. Observed reading = 2.5 mm + 28 * 0.01 mm = 2.78 mm. Correct reading = Observed - (Zero Error) = 2.78 - (-0.04) = 2.82 mm.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-34",
    "q": "If the scalar product (dot product) of two non-zero vectors A and B is zero (A · B = 0), what is the angle between them?",
    "options": [
      "$90^\\circ$ (perpendicular)",
      "$0^\\circ$ (parallel)",
      "$180^\\circ$ (anti-parallel)",
      "$45^\\circ$"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "A · B = |A||B| cos θ. Since $|A|$ ≠ 0 and $|B|$ ≠ 0, cos θ = 0, which means θ = $90^\\circ$ (vectors are orthogonal).",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-35",
    "q": "Which of the following physical quantities is an axial vector?",
    "options": [
      "Torque",
      "Linear momentum",
      "Electric field",
      "Gravitational force"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "Torque (τ = r × F) is an axial (or pseudo) vector that points along the rotational axis determined by the right-hand rule, unlike polar vectors like linear momentum or force.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-36",
    "q": "The magnitudes of two vectors are 6 units and 8 units. If the magnitude of their resultant is 10 units, what is the angle between the two vectors?",
    "options": [
      "$90^\\circ$",
      "$60^\\circ$",
      "$45^\\circ$",
      "$120^\\circ$"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "$R^{2} =  A^{2}$ + $B^{2}$ + 2AB cos θ => 100 = 36 + 64 + 2(6)(8) cos θ => 100 = 100 + 96 cos θ => 96 cos θ = 0 => θ = $90^\\circ$.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-37",
    "q": "What is the unit vector in the direction of vector A = 3 î + 4 ĵ - 12 k̂?",
    "options": [
      "(3 î + 4 ĵ - 12 k̂) / 13",
      "(3 î + 4 ĵ - 12 k̂) / 19",
      "(3 î + 4 ĵ - 12 k̂) / 7",
      "(3 î + 4 ĵ - 12 k̂) / 169"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "$|A|$ = √($3^{2} +  4^{2}$ + (-12)^{2}) = $\\sqrt${9 + 16 + 144} = $\\sqrt${169} = 13. Unit vector â = A / $|A|$ = (3 î + 4 ĵ - 12 k̂) / 13.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-38",
    "q": "At what angle θ between two non-zero vectors A and B is the magnitude of their vector product equal to their scalar product (|A × B| = A · B)?",
    "options": [
      "$45^\\circ$",
      "$30^\\circ$",
      "$60^\\circ$",
      "$90^\\circ$"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "|A × B| = AB sin θ, and A · B = AB cos θ. Equating both: AB sin θ = AB cos θ => tan θ = 1 => θ = $45^\\circ$.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-39",
    "q": "If vector A = 2 î + 3 ĵ - k̂ and vector B = -4 î - 6 ĵ + λ k̂ are collinear (parallel or anti-parallel), what is the scalar value of λ?",
    "options": [
      "2",
      "-2",
      "4",
      "-4"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "For collinear vectors, component ratios must be identical: B_x/A_x = B_y/A_y = B_z/A_z => -4/2 = -6/3 = λ/(-1) => -2 = -λ => λ = 2.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-40",
    "q": "In the photoelectric effect, what happens to the stopping potential when the intensity of incident monochromatic light is doubled?",
    "options": [
      "Remains completely unchanged",
      "Doubles",
      "Halves",
      "Increases fourfold"
    ],
    "correct": 0,
    "topic": "Dawn of Modern Physics",
    "explain": "Stopping potential depends exclusively on photon frequency and work function (eV₀ = hf - Φ). Light intensity affects only photo-current, not electron kinetic energy or stopping potential.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-41",
    "q": "What is the de Broglie wavelength of an electron accelerated from rest through a potential difference of 100 V? (h = 6.63 × 10⁻³⁴ J·s, m_e = 9.11 × 10⁻³¹ kg, e = 1.6 × 10^{-1}⁹ C)",
    "options": [
      "0.123 nm",
      "1.23 nm",
      "0.0123 nm",
      "12.3 nm"
    ],
    "correct": 0,
    "topic": "Dawn of Modern Physics",
    "explain": "λ = h / $\\sqrt${2m eV} = 1.227 / $\\sqrt${V} nm = 1.227 / $\\sqrt${100} = 1.227 / 10 = 0.1227 nm ≈ 0.123 nm.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-42",
    "q": "In Compton scattering, at what scattering angle θ of the scattered photon is the Compton wavelength shift maximum?",
    "options": [
      "$180^\\circ$",
      "$90^\\circ$",
      "$0^\\circ$",
      "$45^\\circ$"
    ],
    "correct": 0,
    "topic": "Dawn of Modern Physics",
    "explain": "Compton shift Δλ = (h / m₀c)(1 - cos θ). The maximum shift occurs when (1 - cos θ) is maximum, which happens at θ = $180^\\circ$ where cos($180^\\circ$) = -1, giving Δλ_max = 2h/(m₀c).",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-43",
    "q": "According to special relativity, what is the total relativistic energy of a particle whose relativistic momentum is p = m₀c?",
    "options": [
      "$\\sqrt${2} m₀$c^{2}$",
      "2 m₀$c^{2}$",
      "m₀$c^{2}$",
      "$\\sqrt${3} m₀$c^{2}$"
    ],
    "correct": 0,
    "topic": "Dawn of Modern Physics",
    "explain": "$E^{2}$ = (pc)^{2} + (m₀$c^{2}$)² = (m₀c * c)^{2} + (m₀$c^{2}$)² = (m₀$c^{2}$)² + (m₀$c^{2}$)² = 2 (m₀$c^{2}$)² => E = $\\sqrt${2} m₀$c^{2}$.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-44",
    "q": "Lenz's law of electromagnetic induction is a direct consequence of which fundamental conservation law?",
    "options": [
      "Law of conservation of energy",
      "Law of conservation of electric charge",
      "Law of conservation of linear momentum",
      "Law of conservation of mass"
    ],
    "correct": 0,
    "topic": "Electromagnetic Induction",
    "explain": "Lenz's law states induced current opposes the flux change causing it. Mechanical work done against this magnetic opposition is converted into electrical energy, satisfying conservation of energy.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-45",
    "q": "A magnetic flux through a coil of 200 turns changes uniformly from 0.05 Wb to 0.01 Wb in 0.2 seconds. What is the magnitude of the induced electromotive force (emf)?",
    "options": [
      "40 V",
      "20 V",
      "8 V",
      "4 V"
    ],
    "correct": 0,
    "topic": "Electromagnetic Induction",
    "explain": "Faraday's law: ε = -N (ΔΦ / Δt) => |ε| = 200 * |0.01 - 0.05| / 0.2 = 200 * 0.04 / 0.2 = 200 * 0.2 = 40 V.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-46",
    "q": "A straight conducting rod of length 0.5 m moves at a constant speed of 10 m/s perpendicular to a uniform magnetic field of 0.4 T. What motional emf is induced across the ends of the rod?",
    "options": [
      "2.0 V",
      "1.0 V",
      "4.0 V",
      "0.5 V"
    ],
    "correct": 0,
    "topic": "Electromagnetic Induction",
    "explain": "Motional emf ε = v B L sin θ. For perpendicular motion (θ = $90^\\circ$): ε = 10 * 0.4 * 0.5 * 1 = 2.0 V.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-47",
    "q": "What is the self-inductance of a solenoid of length 0.5 m, cross-sectional area 20 $cm^{2}$, and 1000 turns wound around an air core? (μ₀ = 4π × 10⁻⁷ T·m/A)",
    "options": [
      "5.03 mH",
      "2.51 mH",
      "10.06 mH",
      "1.26 mH"
    ],
    "correct": 0,
    "topic": "Electromagnetic Induction",
    "explain": "L = μ₀ $N^{2}$ A / l = (4π × 10⁻⁷) * (1000)^{2} * (20 × 10⁻⁴) / 0.5 = (4π × 10⁻⁷ * 10⁶ * 2 × 10⁻³) / 0.5 = (8π × 10⁻⁴) / 0.5 = 16π × 10⁻⁴ ≈ 5.03 × 10⁻³ H = 5.03 mH.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-48",
    "q": "What is the depletion region barrier potential of a standard silicon p-n junction diode at room temperature (300 K)?",
    "options": [
      "0.7 V",
      "0.3 V",
      "1.1 V",
      "0.1 V"
    ],
    "correct": 0,
    "topic": "Electronics",
    "explain": "The intrinsic junction potential barrier formed by immobile donor and acceptor ions across the depletion zone is approximately 0.7 V for silicon and 0.3 V for germanium.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Electronics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-49",
    "q": "In full-wave bridge rectification, how many semiconductor diodes are utilized in the bridge configuration?",
    "options": [
      "4 diodes",
      "2 diodes",
      "1 diode",
      "8 diodes"
    ],
    "correct": 0,
    "topic": "Electronics",
    "explain": "A bridge rectifier uses 4 diodes arranged in a diamond bridge network to rectify both positive and negative alternating half-cycles without requiring a center-tapped transformer.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Electronics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-50",
    "q": "In an operational amplifier (op-amp) configured as an inverting amplifier with input resistor R₁ = 10 kΩ and feedback resistor R_f = 100 kΩ, what is the closed-loop voltage gain?",
    "options": [
      "-10",
      "+10",
      "-100",
      "+11"
    ],
    "correct": 0,
    "topic": "Electronics",
    "explain": "For an inverting operational amplifier, the closed-loop voltage gain is G = -R_f / R₁ = -100 kΩ / 10 kΩ = -10.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Electronics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-51",
    "q": "For a bipolar junction transistor (BJT) operating in the active region, the common-base current gain is α = 0.98. What is its common-emitter current gain β?",
    "options": [
      "49",
      "98",
      "50",
      "24.5"
    ],
    "correct": 0,
    "topic": "Electronics",
    "explain": "β = α / (1 - α) = 0.98 / (1 - 0.98) = 0.98 / 0.02 = 49.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Electronics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-52",
    "q": "Which radioactive decay emission consists of energetic doubly ionized helium-4 nuclei (²$He^{4}$)?",
    "options": [
      "Alpha particles (α)",
      "Beta particles (β⁻)",
      "Gamma rays (γ)",
      "Positrons (β⁺)"
    ],
    "correct": 0,
    "topic": "Nuclear Physics",
    "explain": "Alpha particles are helium nuclei consisting of 2 protons and 2 neutrons bound together (charge +2e, mass number 4).",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Nuclear Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-53",
    "q": "A radioactive isotope has a half-life of 8 days. What fraction of the original radioactive nuclei will remain undecayed after 32 days?",
    "options": [
      "1/16",
      "1/8",
      "1/32",
      "1/4"
    ],
    "correct": 0,
    "topic": "Nuclear Physics",
    "explain": "Number of elapsed half-lives n = 32 / 8 = 4. Remaining fraction N/N₀ = (1/2)ⁿ = (1/2)^{4} = 1/16.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Nuclear Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-54",
    "q": "The mass defect Δm for the formation of a helium nucleus (⁴₂He) is 0.03038 amu. Given that 1 amu = 931.5 MeV, what is the binding energy per nucleon of the helium nucleus?",
    "options": [
      "7.07 MeV",
      "28.3 MeV",
      "14.1 MeV",
      "3.54 MeV"
    ],
    "correct": 0,
    "topic": "Nuclear Physics",
    "explain": "Total binding energy = 0.03038 * 931.5 MeV ≈ 28.3 MeV. Helium has mass number A = 4 nucleons. Binding energy per nucleon = 28.3 / 4 ≈ 7.07 MeV/nucleon.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Nuclear Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-55",
    "q": "What is the period of a simple pendulum of length 0.993 m situated at a location where acceleration due to gravity is g = 9.8 m/$s^{2}$?",
    "options": [
      "2.0 seconds",
      "1.0 second",
      "3.14 seconds",
      "0.5 seconds"
    ],
    "correct": 0,
    "topic": "Oscillations",
    "explain": "T = 2π $\\sqrt${L/g} = 2 * 3.1416 * $\\sqrt${0.993 / 9.8} = 2 * 3.1416 * $\\sqrt${0}.1013 ≈ 2 * 3.1416 * 0.3183 ≈ 2.0 s (a seconds pendulum).",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Oscillations",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-56",
    "q": "In simple harmonic motion of an ideal spring-mass system, at what displacement x from equilibrium is kinetic energy equal to potential energy (KE = PE)?",
    "options": [
      "x = x₀ / $\\sqrt${2}",
      "x = x₀ / 2",
      "x = x₀ / 4",
      "x = x₀ / $\\sqrt${3}"
    ],
    "correct": 0,
    "topic": "Oscillations",
    "explain": "Total energy E = (1/2) k x₀². Potential energy PE = (1/2) k $x^{2}$. When PE = (1/2) E \\implies (1/2) k $x^{2}$ = (1/2) * (1/2) k x₀² => $x^{2}$ = x₀²/2 \\implies x = x₀ / $\\sqrt${2}.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Oscillations",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-57",
    "q": "A body executing SHM has maximum velocity v_max = 16 m/s and maximum acceleration a_max = 64 m/$s^{2}$. What is the angular frequency ω and amplitude x₀ of oscillation?",
    "options": [
      "ω = 4 rad/s, x₀ = 4 m",
      "ω = 2 rad/s, x₀ = 8 m",
      "ω = 8 rad/s, x₀ = 2 m",
      "ω = 4 rad/s, x₀ = 2 m"
    ],
    "correct": 0,
    "topic": "Oscillations",
    "explain": "v_max = ω x₀ and a_max = ω² x₀. Dividing gives ω = a_max / v_max = 64 / 16 = 4 rad/s. Then amplitude x₀ = v_max / ω = 16 / 4 = 4 m.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Oscillations",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-58",
    "q": "What is the magnitude of magnetic force experienced by a proton moving parallel to a uniform magnetic field B with velocity v?",
    "options": [
      "Zero",
      "q v B",
      "q v B / 2",
      "q B / v"
    ],
    "correct": 0,
    "topic": "Electromagnetism",
    "explain": "Lorentz magnetic force F = q (v × B) = q v B sin θ. When the velocity is parallel to the magnetic field lines, angle θ = $0^\\circ$, so sin $0^\\circ$ = 0 and the magnetic force is identically zero.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Electromagnetism",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-59",
    "q": "A long straight wire carries a current of 10 A. What is the magnitude of the magnetic field B at a perpendicular distance of 5 cm from the wire? (μ₀ = 4π × 10⁻⁷ T·m/A)",
    "options": [
      "4 × 10⁻⁵ T",
      "2 × 10⁻⁵ T",
      "8 × 10⁻⁵ T",
      "1 × 10⁻⁴ T"
    ],
    "correct": 0,
    "topic": "Electromagnetism",
    "explain": "Ampere's law for a long straight wire: B = μ₀ I / (2π r) = (4π × 10⁻⁷ * 10) / (2π * 0.05) = (2 × 10⁻⁶) / 0.05 = 4 × 10⁻⁵ T.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Electromagnetism",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b3-phy-60",
    "q": "An electron enters perpendicularly into crossed electric and magnetic fields (E = 2 × $10^{4}$ V/m and B = 0.05 T). What must be the electron velocity for it to pass through undeflected without deviation?",
    "options": [
      "4 × 10⁵ m/s",
      "1 × 10⁵ m/s",
      "2 × 10⁶ m/s",
      "8 × $10^{4}$ m/s"
    ],
    "correct": 0,
    "topic": "Electromagnetism",
    "explain": "In a velocity selector, the electric force balances the magnetic force: qE = qvB \\implies v = E / B = (2 × $10^{4}$) / 0.05 = 4 × 10⁵ m/s.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Electromagnetism",
    "universities": [
      "MDCAT"
    ]
  }
];

import { Question } from '../types';

export const MDCAT_PHYSICS_NEW_QUESTIONS: Question[] = [
  {
    "id": "mdcat-new-phy-1",
    "q": "Which of the following is an SI supplementary unit?",
    "options": [
      "Steradian",
      "Candela",
      "Coulomb",
      "Weber"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "Radian (plane angle) and Steradian (solid angle) are classified as supplementary SI units in the International System of Units. Candela is a base unit, while Coulomb and Weber are derived units.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-2",
    "q": "A student measures a length with a meter rod of least count 0.1 cm and records it as 20.0 cm. What is the percentage uncertainty in this measurement?",
    "options": [
      "0.5%",
      "0.1%",
      "1.0%",
      "2.0%"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "Percentage uncertainty = (Least Count / Measured Value) * 100% = (0.1 cm / 20.0 cm) * 100% = 0.5%.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-3",
    "q": "Which physical quantity has the dimensional formula [M $L^{2}$ T⁻²]?",
    "options": [
      "Torque",
      "Power",
      "Linear Momentum",
      "Force"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "Torque τ = r * F has dimensions [L] * [M L T⁻²] = [M $L^{2}$ T⁻²], identical to work and energy. Power is [M $L^{2}$ T⁻³], Momentum is [M L T^{-1}], and Force is [M L T⁻²].",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-4",
    "q": "The radius of a solid sphere is measured to be (2.0 ± 0.1) cm. What is the fractional uncertainty in its calculated volume?",
    "options": [
      "0.15",
      "0.05",
      "0.25",
      "0.0125"
    ],
    "correct": 0,
    "topic": "Measurements",
    "explain": "Volume V = (4/3)π $r^{3}$. Fractional uncertainty in V = 3 * (Δr / r) = 3 * (0.1 / 2.0) = 3 * 0.05 = 0.15 (or 15%).",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Measurements",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-5",
    "q": "Which of the following physical quantities is a true scalar quantity?",
    "options": [
      "Electric potential",
      "Electric field intensity",
      "Linear momentum",
      "Magnetic flux density"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "Electric potential is the work done per unit charge and is a scalar quantity with only magnitude and sign, lacking spatial direction.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-6",
    "q": "If the scalar product and vector product of two vectors have equal magnitudes (|A · B| = |A × B|), what is the angle between them?",
    "options": [
      "$45^\\circ$",
      "$90^\\circ$",
      "$60^\\circ$",
      "$30^\\circ$"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "|A · B| = AB cos θ, and |A × B| = AB sin θ. Equating the two gives AB cos θ = AB sin θ => tan θ = 1 => θ = $45^\\circ$. (or $225^\\circ$).",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-7",
    "q": "Two forces of 6 N and 8 N act on a body simultaneously at a right angle ($90^\\circ$). What is the magnitude of the resultant force?",
    "options": [
      "10 N",
      "14 N",
      "2 N",
      "48 N"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "R = $\\sqrt${F₁² + F₂² + 2F₁F₂ cos $90^\\circ$} = $\\sqrt${$6^{2} +  8^{2}$ + 0} = $\\sqrt${36 + 64} = $\\sqrt${100} = 10 N.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-8",
    "q": "For what value of parameter \"k\" are the two vectors A = 2î + 3ĵ - 4k̂ and B = 4î - 2ĵ + k k̂ mutually orthogonal?",
    "options": [
      "0.5",
      "2.0",
      "-1.5",
      "4.0"
    ],
    "correct": 0,
    "topic": "Scalars and Vectors",
    "explain": "Two vectors are orthogonal if their dot product A · B = 0. (2)(4) + (3)(-2) + (-4)(k) = 0 \\implies 8 - 6 - 4k = 0 \\implies 2 = 4k \\implies k = 0.5.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Scalars and Vectors",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-9",
    "q": "A body is dropped from rest from a height of 80 m above the ground. Taking g = 10 m/$s^{2}$, how long does it take to reach the ground?",
    "options": [
      "4 seconds",
      "2 seconds",
      "8 seconds",
      "16 seconds"
    ],
    "correct": 0,
    "topic": "Force and Motion",
    "explain": "Using h = vi*t + (1/2)$gt^{2}$ with vi = 0: 80 = (1/2)(10)$t^{2}$ \\implies 80 = $5t^{2} \\implies t^{2}$ = 16 \\implies t = 4 s.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Force and Motion",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-10",
    "q": "The area under a velocity-time graph represents which physical quantity?",
    "options": [
      "Displacement",
      "Acceleration",
      "Instantaneous speed",
      "Impulse"
    ],
    "correct": 0,
    "topic": "Force and Motion",
    "explain": "The integral of velocity with respect to time (area under the v-t graph) represents total displacement: s = ∫ v dt.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Force and Motion",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-11",
    "q": "At what launch angle θ is the maximum height attained by a projectile equal to one-fourth of its horizontal range (H = R/4)?",
    "options": [
      "$45^\\circ$",
      "$30^\\circ$",
      "$60^\\circ$",
      "$76^\\circ$"
    ],
    "correct": 0,
    "topic": "Force and Motion",
    "explain": "The general relation is R = 4H cot θ => H/R = (tan θ) / 4. Given H = R/4, we get 1/4 = (tan θ)/4 \\implies tan θ = 1 => θ = $45^\\circ$.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Force and Motion",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-12",
    "q": "A ball of mass 0.2 kg moving horizontally at 20 m/s strikes a rigid vertical wall and rebounds elastically in the opposite direction with the same speed. If the contact duration is 0.02 seconds, the average force exerted on the wall is:",
    "options": [
      "400 N",
      "200 N",
      "0 N",
      "800 N"
    ],
    "correct": 0,
    "topic": "Force and Motion",
    "explain": "Change in momentum Δp = m(vf - vi) = 0.2 * (-20 - 20) = -8 kg·m/s. Magnitude of average force F = |Δp| / Δt = 8 / 0.02 = 400 N.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Force and Motion",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-13",
    "q": "How much work is done by the centripetal force on an object moving with constant speed in a circular path?",
    "options": [
      "Zero",
      "Positive and equal to $mv^{2}$",
      "Negative and equal to -$mv^{2}$",
      "Equal to 2πr * Fc"
    ],
    "correct": 0,
    "topic": "Work, Energy and Power",
    "explain": "Centripetal force is always directed radially inwards toward the center, perpendicular to the instantaneous tangential displacement (θ = $90^\\circ$). Since W = F d cos $90^\\circ$ = 0, no work is done.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Work, Energy and Power",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-14",
    "q": "If the linear momentum of a moving body is increased by 50%, by what percentage does its kinetic energy increase?",
    "options": [
      "125%",
      "50%",
      "100%",
      "225%"
    ],
    "correct": 0,
    "topic": "Work, Energy and Power",
    "explain": "KE = $p^{2}$ / (2m). If p becomes 1.5p, then KE_new = (1.5p)^{2} / (2m) = 2.25 * KE_initial. Fractional increase = (2.25 - 1) = 1.25 = 125%.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Work, Energy and Power",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-15",
    "q": "An electric pump lifts 600 kg of water to a height of 20 meters in 1 minute. Assuming g = 10 m/$s^{2}$, what is the output power of the pump?",
    "options": [
      "2000 W",
      "1200 W",
      "6000 W",
      "360 W"
    ],
    "correct": 0,
    "topic": "Work, Energy and Power",
    "explain": "Work = mgh = 600 kg * 10 m/$s^{2}$ * 20 m = 120,000 J. Power = Work / time = 120,000 J / 60 s = 2,000 W (2 kW).",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Work, Energy and Power",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-16",
    "q": "A variable force F = ($3x^{2}$ + 2x) N acts on a particle, displacing it from x = 0 to x = 2 meters. What is the total work done on the particle?",
    "options": [
      "12 J",
      "8 J",
      "16 J",
      "24 J"
    ],
    "correct": 0,
    "topic": "Work, Energy and Power",
    "explain": "W = ∫₀² ($3x^{2}$ + 2x) dx = [$x^{3} +  x^{2}$]₀² = ($2^{3} +  2^{2}$) - 0 = (8 + 4) = 12 J.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Work, Energy and Power",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-17",
    "q": "What is the angular speed (ω) of the hour hand of a standard analog clock in rad/s?",
    "options": [
      "π / 21600 rad/s",
      "π / 1800 rad/s",
      "π / 3600 rad/s",
      "2π rad/s"
    ],
    "correct": 0,
    "topic": "Rotational and Circular Motion",
    "explain": "The hour hand completes one full revolution (2π radians) in 12 hours. Time T = 12 * 3600 s = 43,200 s. ω = 2π / 43,200 = π / 21,600 rad/s.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Rotational and Circular Motion",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-18",
    "q": "A vehicle of mass 1000 kg rounds a flat horizontal circular curve of radius 50 m. If the coefficient of static friction between tires and road is 0.5, what is the maximum safe speed without skidding? (Take g = 10 m/$s^{2}$)",
    "options": [
      "15.8 m/s",
      "25.0 m/s",
      "5.0 m/s",
      "10.0 m/s"
    ],
    "correct": 0,
    "topic": "Rotational and Circular Motion",
    "explain": "Maximum safe speed v_max = $\\sqrt${μ s * g * r} = $\\sqrt${0.5 * 10 * 50} = $\\sqrt${250} ≈ 15.8 m/s.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Rotational and Circular Motion",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-19",
    "q": "A stone of mass \"m\" tied to a string of length \"r\" is whirled in a vertical circle. What is the minimum tension in the string at the lowest point of the circle so that it safely completes the vertical loop without slacking?",
    "options": [
      "6 mg",
      "5 mg",
      "mg",
      "3 mg"
    ],
    "correct": 0,
    "topic": "Rotational and Circular Motion",
    "explain": "At critical looping, speed at the bottom is v = $\\sqrt${5gr}. The tension at the bottom is T = mg + $mv^{2}$/r = mg + m(5gr)/r = mg + 5mg = 6mg.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Rotational and Circular Motion",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-20",
    "q": "A solid cylinder (I = 1/2 $MR^{2}$) and a thin hollow hoop (I = $MR^{2}$) of equal mass and radius roll down an inclined plane from rest without slipping. The ratio of their linear accelerations (a_cylinder / a_hoop) is:",
    "options": [
      "4/3",
      "3/2",
      "2/1",
      "1/1"
    ],
    "correct": 0,
    "topic": "Rotational and Circular Motion",
    "explain": "Acceleration for rolling without slipping is a = g sin θ / (1 + I / $MR^{2}$). For solid cylinder: a_cyl = g sin θ / (1 + 0.5) = (2/3) g sin θ. For hoop: a_hoop = g sin θ / (1 + 1) = (1/2) g sin θ. Ratio = (2/3) / (1/2) = 4/3.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Rotational and Circular Motion",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-21",
    "q": "According to the equation of continuity for an incompressible fluid in steady flow, which quantity remains constant throughout the streamline flow?",
    "options": [
      "Flow rate (Volume per second)",
      "Velocity alone",
      "Cross-sectional area alone",
      "Static pressure alone"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "The equation of continuity states that A₁v₁ = A₂v₂ = constant, meaning the volumetric flow rate ($m^{3}$/s) remains constant along the pipe.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-22",
    "q": "Bernoulli's theorem in fluid dynamics is a direct consequence of the law of conservation of:",
    "options": [
      "Energy",
      "Linear momentum",
      "Mass",
      "Angular momentum"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "Bernoulli's equation (P + 1/2 ρ$v^{2}$ + ρgh = constant) is derived directly from the principle of conservation of energy for ideal, non-viscous fluid flow.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-23",
    "q": "Water flows through a horizontal pipe. At a constriction where the pipe diameter is halved, the speed of the water:",
    "options": [
      "Increases by a factor of 4",
      "Doubles",
      "Decreases by half",
      "Remains unchanged"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "Area A is proportional to diameter squared (A ∝ $d^{2}$). Halving the diameter reduces cross-sectional area to (1/2)^{2} = 1/4. From A₁v₁ = A₂v₂, speed must increase by a factor of 4.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-24",
    "q": "A spherical raindrop of radius r reaches a terminal falling velocity vt in air. According to Stokes' law, how does terminal velocity scale with the droplet radius r?",
    "options": [
      "vt ∝ $r^{2}$",
      "vt ∝ r",
      "vt ∝ 1/r",
      "vt ∝ $r^{3}$"
    ],
    "correct": 0,
    "topic": "Fluid Dynamics",
    "explain": "Equating weight mg = (4/3)π$r^{3}$ρg to Stokes drag Fd = 6πηr vt gives vt = (2/9) $r^{2}$ g (ρ - σ) / η. Thus, terminal velocity is directly proportional to $r^{2}$.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Fluid Dynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-25",
    "q": "In simple harmonic motion (SHM), the restoring acceleration is always directly proportional to:",
    "options": [
      "Displacement from the mean position and directed towards it",
      "Square of velocity",
      "Amplitude of the motion",
      "Time elapsed"
    ],
    "correct": 0,
    "topic": "Oscillations",
    "explain": "The defining equation of SHM is a = -ω²x, stating that acceleration is directly proportional to displacement x and always directed towards the equilibrium position.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Oscillations",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-26",
    "q": "A simple pendulum has a time period T on Earth. If its length is increased by a factor of 4, what is its new time period?",
    "options": [
      "2T",
      "4T",
      "T/2",
      "T/4"
    ],
    "correct": 0,
    "topic": "Oscillations",
    "explain": "T = 2π $\\sqrt${l/g}. If length becomes 4l, T_new = 2π $\\sqrt${4l/g} = 2 * (2π $\\sqrt${l/g}) = 2T.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Oscillations",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-27",
    "q": "At what displacement from the mean position is the kinetic energy of an oscillator executing SHM equal to its potential energy (KE = PE)?",
    "options": [
      "x = x₀ / $\\sqrt${2}",
      "x = x₀ / 2",
      "x = x₀ / 4",
      "x = x₀ / $\\sqrt${3}"
    ],
    "correct": 0,
    "topic": "Oscillations",
    "explain": "Total energy E = 1/2 k x₀². When KE = PE, each equals E/2. So PE = 1/2 k $x^{2}$ = 1/2 (1/2 k x₀²) \\implies $x^{2}$ = x₀²/2 \\implies x = x₀ / $\\sqrt${2}.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Oscillations",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-28",
    "q": "A mass-spring system executes SHM with amplitude x₀. If the mass is doubled while the spring constant is halved, what happens to the natural frequency of oscillation?",
    "options": [
      "It is halved (f_new = f / 2)",
      "It doubles",
      "It remains unchanged",
      "It is reduced to f / 4"
    ],
    "correct": 0,
    "topic": "Oscillations",
    "explain": "Frequency f = (1 / 2π) $\\sqrt${k / m}. If k becomes k/2 and m becomes 2m, then the term inside the square root becomes (k/2)/(2m) = k/(4m). Taking the square root gives 1/2, so f_new = f / 2.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Oscillations",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-29",
    "q": "What is the fundamental difference between transverse waves and longitudinal waves?",
    "options": [
      "In transverse waves, particle oscillations are perpendicular to wave propagation, whereas in longitudinal waves they are parallel.",
      "Transverse waves require a material medium while longitudinal waves do not.",
      "Longitudinal waves cannot undergo reflection or refraction.",
      "Transverse waves travel faster than longitudinal waves in all media."
    ],
    "correct": 0,
    "topic": "Waves",
    "explain": "In transverse waves (e.g. light, ripples), particles oscillate perpendicular to wave direction. In longitudinal waves (e.g. sound), oscillations occur parallel to wave direction.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Waves",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-30",
    "q": "A sound source emits a wave of frequency 500 Hz that travels in air at 340 m/s. What is the wavelength of this sound wave?",
    "options": [
      "0.68 m",
      "1.47 m",
      "170 m",
      "0.34 m"
    ],
    "correct": 0,
    "topic": "Waves",
    "explain": "Using the fundamental wave relation v = f λ => λ = v / f = 340 m/s / 500 Hz = 0.68 m.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Waves",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-31",
    "q": "A pipe of length L is open at one end and closed at the other. What is the wavelength of its fundamental harmonic resonance?",
    "options": [
      "4L",
      "2L",
      "L",
      "L/2"
    ],
    "correct": 0,
    "topic": "Waves",
    "explain": "In a closed organ pipe, a node forms at the closed end and an antinode at the open end. The fundamental mode spans a quarter of a wavelength: L = λ/4 => λ = 4L.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Waves",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-32",
    "q": "A stationary observer hears a frequency of 1100 Hz from an approaching ambulance moving at 30 m/s. If the speed of sound is 330 m/s, what is the actual emitted frequency of the siren?",
    "options": [
      "1000 Hz",
      "1200 Hz",
      "950 Hz",
      "1050 Hz"
    ],
    "correct": 0,
    "topic": "Waves",
    "explain": "For a source moving toward a stationary observer: f' = f * [v / (v - vs)]. Rearranging: f = f' * [(v - vs) / v] = 1100 * [(330 - 30) / 330] = 1100 * (300 / 330) = 1100 * (10 / 11) = 1000 Hz.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Waves",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-33",
    "q": "In an isothermal process involving an ideal gas, which of the following thermodynamic variables remains constant?",
    "options": [
      "Temperature",
      "Pressure",
      "Volume",
      "Internal energy changes while temperature fluctuates"
    ],
    "correct": 0,
    "topic": "Thermodynamics",
    "explain": "An isothermal process occurs at constant temperature (ΔT = 0). For an ideal gas whose internal energy depends solely on temperature, ΔU = 0 as well.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Thermodynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-34",
    "q": "The first law of thermodynamics (Q = ΔU + W) is a statement of the conservation of:",
    "options": [
      "Energy",
      "Mass",
      "Entropy",
      "Momentum"
    ],
    "correct": 0,
    "topic": "Thermodynamics",
    "explain": "The first law of thermodynamics states that the total heat energy supplied to a system equals the increase in internal energy plus the work done by the system, exemplifying conservation of energy.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Thermodynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-35",
    "q": "During an adiabatic expansion of an ideal gas, work is done by the gas on the surroundings. What happens to the internal energy and temperature of the gas?",
    "options": [
      "Internal energy decreases and temperature falls",
      "Internal energy increases and temperature rises",
      "Internal energy and temperature remain constant",
      "Temperature falls while internal energy remains constant"
    ],
    "correct": 0,
    "topic": "Thermodynamics",
    "explain": "In an adiabatic process, Q = 0. By the first law, 0 = ΔU + W \\implies W = -ΔU. When the gas expands (W > 0), ΔU must be negative, so internal energy decreases and temperature drops.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Thermodynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-36",
    "q": "A Carnot engine operates between a hot reservoir at 500 K and a cold sink at 300 K. What is its maximum theoretical thermal efficiency?",
    "options": [
      "40%",
      "60%",
      "20%",
      "50%"
    ],
    "correct": 0,
    "topic": "Thermodynamics",
    "explain": "Efficiency η = 1 - (T_cold / T_hot) = 1 - (300 / 500) = 1 - 0.6 = 0.4 = 40%.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Thermodynamics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-37",
    "q": "What is the electric field intensity inside a hollow, uniformly charged conducting sphere?",
    "options": [
      "Zero",
      "Maximum at the geometric center",
      "Uniform and equal to the surface value",
      "Inversely proportional to radius"
    ],
    "correct": 0,
    "topic": "Electrostatics",
    "explain": "According to Gauss's Law, the net enclosed charge inside any Gaussian surface placed inside a hollow charged conductor is zero (q_enc = 0), so the electric field E = 0 everywhere inside.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Electrostatics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-38",
    "q": "Two point charges separated by distance \"r\" experience an electrostatic force F. If the distance between them is doubled (2r), the new force becomes:",
    "options": [
      "F / 4",
      "F / 2",
      "2 F",
      "4 F"
    ],
    "correct": 0,
    "topic": "Electrostatics",
    "explain": "Coulomb's Law states F = k q₁q₂ / $r^{2}$. Since F is inversely proportional to $r^{2}$, doubling distance reduces the force to F / (2)^{2} = F / 4.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Electrostatics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-39",
    "q": "A parallel plate capacitor has capacitance C in vacuum. If a dielectric slab with dielectric constant εr = 4 is inserted between the plates, the new capacitance is:",
    "options": [
      "4 C",
      "C / 4",
      "2 C",
      "16 C"
    ],
    "correct": 0,
    "topic": "Electrostatics",
    "explain": "Capacitance with a dielectric is C_med = εr * C_vac. With εr = 4, the capacitance increases fourfold to 4C.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Electrostatics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-40",
    "q": "A 10 μF capacitor is charged to a potential difference of 100 V. What is the total electrostatic energy stored in its electric field?",
    "options": [
      "0.05 J",
      "0.1 J",
      "1.0 J",
      "0.005 J"
    ],
    "correct": 0,
    "topic": "Electrostatics",
    "explain": "Energy U = 1/2 C $V^{2}$ = 1/2 * (10 × 10⁻⁶ F) * (100 V)^{2} = 5 × 10⁻⁶ * 10,000 = 0.05 Joules.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Electrostatics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-41",
    "q": "Three resistors of resistances 2 Ω, 3 Ω, and 6 Ω are connected in parallel. What is their equivalent resistance?",
    "options": [
      "1 Ω",
      "11 Ω",
      "3 Ω",
      "0.5 Ω"
    ],
    "correct": 0,
    "topic": "Current Electricity",
    "explain": "1/Req = 1/2 + 1/3 + 1/6 = (3 + 2 + 1)/6 = 6/6 = 1 Ω⁻¹ => Req = 1 Ω.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Current Electricity",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-42",
    "q": "A copper wire of resistance R is stretched uniformly so that its length doubles while volume remains constant. What is its new electrical resistance?",
    "options": [
      "4 R",
      "2 R",
      "R / 2",
      "R / 4"
    ],
    "correct": 0,
    "topic": "Current Electricity",
    "explain": "When stretched uniformly to twice its length (L' = 2L), volume conservation (V = A*L) dictates that cross-sectional area halves (A' = A/2). Resistance R' = ρ L' / A' = ρ (2L) / (A/2) = 4 (ρ L / A) = 4R.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Current Electricity",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-43",
    "q": "A battery of emf 12 V and internal resistance 2 Ω is connected across an external load of 4 Ω. What is the terminal potential difference across the battery?",
    "options": [
      "8 V",
      "12 V",
      "6 V",
      "10 V"
    ],
    "correct": 0,
    "topic": "Current Electricity",
    "explain": "Circuit current I = E / (R + r) = 12 / (4 + 2) = 2 A. Terminal voltage Vt = E - I*r = 12 - (2 * 2) = 12 - 4 = 8 V (or Vt = I*R = 2 * 4 = 8 V).",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Current Electricity",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-44",
    "q": "Kirchhoff's First Rule (Junction Rule: Σ I = 0) and Second Rule (Loop Rule: Σ V = 0) are based respectively on the conservation of:",
    "options": [
      "Charge and Energy",
      "Energy and Charge",
      "Momentum and Energy",
      "Charge and Mass"
    ],
    "correct": 0,
    "topic": "Current Electricity",
    "explain": "Kirchhoff's Junction rule reflects conservation of electric charge (current in = current out). The Loop rule reflects conservation of energy (sum of potential gains and drops around a closed loop is zero).",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Current Electricity",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-45",
    "q": "What is the magnetic force experienced by a stationary electric charge (v = 0) placed in a strong uniform magnetic field B?",
    "options": [
      "Zero",
      "q B",
      "q B / 2",
      "Infinite"
    ],
    "correct": 0,
    "topic": "Electromagnetism",
    "explain": "Lorentz magnetic force is F = q (v × B) = q v B sin θ. If velocity v = 0, F = 0 regardless of the field strength.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Electromagnetism",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-46",
    "q": "A charged particle enters a uniform magnetic field perpendicularly. What is the path traced by the particle?",
    "options": [
      "Circular",
      "Parabolic",
      "Helical",
      "Straight line"
    ],
    "correct": 0,
    "topic": "Electromagnetism",
    "explain": "When velocity is perpendicular to B (θ = $90^\\circ$), the magnetic force acts as a centripetal force constantly perpendicular to the velocity, bending the particle into a uniform circle.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Electromagnetism",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-47",
    "q": "Two long parallel wires carry currents in the same direction. What is the nature of the magnetic interaction between them?",
    "options": [
      "They attract each other",
      "They repel each other",
      "They exert zero net force",
      "They rotate perpendicularly"
    ],
    "correct": 0,
    "topic": "Electromagnetism",
    "explain": "By applying the right-hand rule to find magnetic field directions and the resulting magnetic force F = I (L × B), parallel currents in the same direction attract each other.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Electromagnetism",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-48",
    "q": "An electron of mass m and charge e accelerates from rest through a potential difference V and enters a transverse magnetic field B. What is the radius of its circular orbit?",
    "options": [
      "r = $\\sqrt${2 m V / e} / B",
      "r = B $\\sqrt${2 m V / e}",
      "r = 2 m V / (e B)",
      "r = e B / $\\sqrt${2 m V}"
    ],
    "correct": 0,
    "topic": "Electromagnetism",
    "explain": "Kinetic energy 1/2 m $v^{2}$ = e V \\implies v = $\\sqrt${2 e V / m}. Radius in magnetic field is r = m v / (e B) = [m / (e B)] * $\\sqrt${2 e V / m} = $\\sqrt${2 m V / e} / B.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Electromagnetism",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-49",
    "q": "Lenz's Law of electromagnetic induction is a direct manifestation of which fundamental conservation law?",
    "options": [
      "Conservation of Energy",
      "Conservation of Charge",
      "Conservation of Momentum",
      "Conservation of Mass"
    ],
    "correct": 0,
    "topic": "Electromagnetic Induction",
    "explain": "Lenz's law states that induced current opposes the change that causes it. Mechanical work done against this opposing magnetic force is converted into electrical energy, satisfying conservation of energy.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-50",
    "q": "A magnetic flux through a coil of 50 turns changes uniformly from 0.8 Wb to 0.2 Wb in 0.1 seconds. What is the magnitude of the induced EMF in the coil?",
    "options": [
      "300 V",
      "30 V",
      "60 V",
      "150 V"
    ],
    "correct": 0,
    "topic": "Electromagnetic Induction",
    "explain": "Faraday's law gives |ε| = N (ΔΦ / Δt) = 50 * |(0.2 - 0.8) / 0.1| = 50 * (0.6 / 0.1) = 50 * 6 = 300 V.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-51",
    "q": "The primary coil of an ideal step-down transformer has 1000 turns and is supplied with 220 V AC. If the secondary coil has 50 turns, what is the output voltage?",
    "options": [
      "11 V",
      "22 V",
      "44 V",
      "5.5 V"
    ],
    "correct": 0,
    "topic": "Electromagnetic Induction",
    "explain": "Transformer equation: Vs / Vp = Ns / Np \\implies Vs = Vp * (Ns / Np) = 220 V * (50 / 1000) = 220 * 0.05 = 11 V.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-52",
    "q": "A p-type semiconductor is obtained by doping pure intrinsic silicon with which type of impurity atom?",
    "options": [
      "Trivalent impurity (e.g. Boron, Aluminum, Indium)",
      "Pentavalent impurity (e.g. Phosphorus, Arsenic)",
      "Tetravalent impurity (e.g. Carbon)",
      "Hexavalent impurity"
    ],
    "correct": 0,
    "topic": "Electronics",
    "explain": "Doping silicon with trivalent impurities (Group III elements like Boron, Aluminum) creates holes as majority charge carriers, forming a p-type semiconductor.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Electronics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-53",
    "q": "What happens to the width of the depletion region in a semiconductor p-n junction diode when it is reverse-biased?",
    "options": [
      "The depletion region widens",
      "The depletion region narrows",
      "The depletion region disappears",
      "The depletion region remains unchanged"
    ],
    "correct": 0,
    "topic": "Electronics",
    "explain": "Under reverse bias, external electric fields pull majority charge carriers away from the junction, leaving behind more immobilized uncompensated ions and widening the depletion barrier.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Electronics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-54",
    "q": "In an operational amplifier (op-amp) connected in an inverting amplifier configuration with input resistor R₁ = 10 kΩ and feedback resistor Rf = 100 kΩ, what is the closed-loop voltage gain (Av)?",
    "options": [
      "-10",
      "-0.1",
      "+10",
      "-11"
    ],
    "correct": 0,
    "topic": "Electronics",
    "explain": "For an ideal inverting amplifier, closed-loop gain Av = - (Rf / R₁) = - (100 kΩ / 10 kΩ) = -10.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Electronics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-55",
    "q": "According to Max Planck's quantum theory, the energy of a single photon is directly proportional to its:",
    "options": [
      "Frequency",
      "Wavelength",
      "Amplitude",
      "Intensity"
    ],
    "correct": 0,
    "topic": "Dawn of Modern Physics",
    "explain": "Planck's equation E = h f states that photon energy is directly proportional to the radiation frequency f.",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-56",
    "q": "In the photoelectric effect, if the intensity of the incident light of frequency above the threshold frequency is doubled, which of the following quantities doubles?",
    "options": [
      "Photoelectric current (rate of emitted photoelectrons)",
      "Maximum kinetic energy of photoelectrons",
      "Stopping potential",
      "Work function of the metal"
    ],
    "correct": 0,
    "topic": "Dawn of Modern Physics",
    "explain": "Light intensity corresponds to the number of photons arriving per second. Doubling intensity doubles emitted photoelectrons per second (current), but does not alter individual photon energy or maximum KE.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-57",
    "q": "What is the de Broglie wavelength associated with an electron (mass m = 9.1 × 10⁻³¹ kg) moving with a speed of 1.0 × 10⁶ m/s? (Take Planck's constant h = 6.63 × 10⁻³⁴ J·s)",
    "options": [
      "0.728 nm",
      "7.28 nm",
      "0.0728 nm",
      "72.8 nm"
    ],
    "correct": 0,
    "topic": "Dawn of Modern Physics",
    "explain": "λ = h / (m v) = (6.63 × 10⁻³⁴) / (9.1 × 10⁻³¹ * 1.0 × 10⁶) = (6.63 × 10⁻³⁴) / (9.1 × 10⁻²⁵) = 7.28 × 10^{-1}⁰ m = 0.728 nm.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-58",
    "q": "Which type of nuclear radiation has the highest ionization power?",
    "options": [
      "Alpha particles (α)",
      "Beta particles (β)",
      "Gamma rays (γ)",
      "Neutrons"
    ],
    "correct": 0,
    "topic": "Nuclear Physics",
    "explain": "Alpha particles (Helium-4 nuclei with charge +2e and large mass) exert strong electrostatic forces on orbital electrons, having the highest specific ionization power (about 100 times greater than beta).",
    "difficulty": "Easy",
    "subject": "Physics",
    "chapter": "Nuclear Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-59",
    "q": "A radioactive isotope has a half-life of 8 days. Starting with a 64-gram sample, how much of the original isotope remains undecayed after 32 days?",
    "options": [
      "4 grams",
      "8 grams",
      "2 grams",
      "16 grams"
    ],
    "correct": 0,
    "topic": "Nuclear Physics",
    "explain": "Number of half-lives elapsed n = 32 / 8 = 4 half-lives. Remaining mass = 64 / $2^{4}$ = 64 / 16 = 4 grams.",
    "difficulty": "Medium",
    "subject": "Physics",
    "chapter": "Nuclear Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-new-phy-60",
    "q": "When a nucleus undergoes $\\beta$-minus (β⁻) radioactive decay, what happens to its proton number (Z) and nucleon number (A)?",
    "options": [
      "Z increases by 1, A remains unchanged",
      "Z decreases by 1, A remains unchanged",
      "Z decreases by 2, A decreases by 4",
      "Both Z and A remain unchanged"
    ],
    "correct": 0,
    "topic": "Nuclear Physics",
    "explain": "In β⁻ decay, a neutron converts into a proton, an electron (β⁻), and an electron antineutrino: n -> p + e⁻ + ν̄. Thus, atomic number Z increases by 1, while total mass number A remains constant.",
    "difficulty": "Hard",
    "subject": "Physics",
    "chapter": "Nuclear Physics",
    "universities": [
      "MDCAT"
    ]
  }
];

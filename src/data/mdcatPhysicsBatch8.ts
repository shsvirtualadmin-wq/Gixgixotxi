import { Question } from '../types';

export const MDCAT_PHYSICS_BATCH8: Question[] = [
  {
    "id": "mdcat-b8-phy-1",
    "q": "What is the SI base unit of thermodynamic temperature?",
    "options": [
      "Kelvin (K)",
      "Degree Celsius (°C)",
      "Degree Fahrenheit (°F)",
      "Joule (J)"
    ],
    "correct": 0,
    "topic": "SI Base Units - Thermodynamic Temperature",
    "chapter": "Measurements",
    "explain": "Kelvin (K) is the SI base unit of thermodynamic temperature. Degree Celsius and Fahrenheit are derived scale units, whereas Kelvin is the absolute fundamental base unit defined by fixing the numerical value of Boltzmann's constant.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-2",
    "q": "What are the base dimensional formula of the universal gravitational constant G in terms of mass [M], length [L], and time [T]?",
    "options": [
      "[M^{-1} $L^{3}$ T⁻²]",
      "[M $L^{2}$ T⁻²]",
      "[M^{-1} $L^{2}$T^{-1}]",
      "[M $L^{3}$ T⁻²]"
    ],
    "correct": 0,
    "topic": "Dimensional Analysis - Gravitational Constant",
    "chapter": "Measurements",
    "explain": "From Newton's law of gravitation: F = G (m1 m2) / $r^{2}$ \\implies G = F $r^{2} /  m^{2}$ = [M L T⁻²] [$L^{2}$] / [$M^{2}$] = [M^{-1} $L^{3}$ T⁻²].",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-3",
    "q": "In an experiment, current I = (2.0 ± 0.1) A and voltage V = (10.0 ± 0.2) V. What is the total percentage uncertainty in the calculated electrical resistance R = V / I?",
    "options": [
      "7.0%",
      "2.0%",
      "5.0%",
      "3.0%"
    ],
    "correct": 0,
    "topic": "Error Propagation - Quotient Uncertainty",
    "chapter": "Measurements",
    "explain": "Percentage uncertainty in V = (0.2 / 10.0) × 100% = 2.0%. Percentage uncertainty in I = (0.1 / 2.0) × 100% = 5.0%. When multiplying or dividing, fractional (percentage) uncertainties add directly: 2.0% + 5.0% = 7.0%.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-4",
    "q": "If a coplanar force vector F has rectangular Cartesian components Fx = 5.0 N and Fy = 5$\\sqrt${3} N, what is the inclination angle θ made by vector F with the positive x-axis?",
    "options": [
      "$60^\\circ$",
      "$30^\\circ$",
      "$45^\\circ$",
      "$90^\\circ$"
    ],
    "correct": 0,
    "topic": "Vectors - Direction Angle and Rectangular Components",
    "chapter": "Scalars and Vectors",
    "explain": "The direction angle θ relative to the positive x-axis is given by tan(θ) = Fy / Fx = (5$\\sqrt${3}) / 5.0 = $\\sqrt${3}. Taking the inverse tangent yields θ = arctan($\\sqrt${3}) = $60^\\circ$.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-5",
    "q": "What is the magnitude of the resultant of two perpendicular vectors of magnitudes 6 N and 8 N acting at the same point?",
    "options": [
      "10 N",
      "14 N",
      "2 N",
      "48 N"
    ],
    "correct": 0,
    "topic": "Vector Addition - Orthogonal Components",
    "chapter": "Scalars and Vectors",
    "explain": "For perpendicular vectors (θ = $90^\\circ$), R = $\\sqrt${$A^{2} +  B^{2}$} = $\\sqrt${$6^{2} +  8^{2}$} = $\\sqrt${36 + 64} = $\\sqrt${100} = 10 N.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-6",
    "q": "If vector A = 3 î + 4 ĵ and vector B = -4 î + 3 ĵ, what is the value of the cross product A × B?",
    "options": [
      "25 k̂",
      "0",
      "-7 k̂",
      "12 k̂"
    ],
    "correct": 0,
    "topic": "Vector Cross Product in 2D Components",
    "chapter": "Scalars and Vectors",
    "explain": "A × B = (Ax By - Ay Bx) k̂ = [(3)(3) - (4)(-4)] k̂ = (9 - (-16)) k̂ = (9 + 16) k̂ = 25 k̂.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-7",
    "q": "A body is projected with an initial velocity v0 at an angle of $30^\\circ$ to the horizontal. At what complementary projection angle with the same launch speed will it attain the exact same horizontal range (ignoring air resistance)?",
    "options": [
      "$60^\\circ$",
      "$45^\\circ$",
      "$75^\\circ$",
      "$15^\\circ$"
    ],
    "correct": 0,
    "topic": "Projectile Motion - Complementary Range Angles",
    "chapter": "Force and Motion",
    "explain": "The horizontal range of a projectile is R = ($v0^{2}$ sin(2θ)) / g. Since sin(2($90^\\circ$ - θ)) = sin($180^\\circ$ - 2θ) = sin(2θ), any two complementary launch angles (summing to $90^\\circ$) produce identical horizontal ranges. For $30^\\circ$, the complementary angle is $90^\\circ -  30^\\circ = 60^\\circ$.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-8",
    "q": "A constant force of 20 N acts on an object of mass 4.0 kg initially at rest for a duration of 3.0 seconds. What is the final momentum acquired by the object?",
    "options": [
      "60 N·s (or kg·m/s)",
      "80 N·s",
      "15 N·s",
      "240 N·s"
    ],
    "correct": 0,
    "topic": "Impulse-Momentum Theorem",
    "chapter": "Force and Motion",
    "explain": "According to the impulse-momentum theorem: Impulse J = Δp = F · Δt. Since initial momentum is zero (at rest), final momentum p = F · Δt = 20 N × 3.0 s = 60 N·s.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-9",
    "q": "In a completely inelastic one-dimensional collision between two isolated colliding bodies, which conservation principle holds true?",
    "options": [
      "Total linear momentum is conserved, but total kinetic energy is not conserved (maximum kinetic energy is converted to internal energy/heat)",
      "Both linear momentum and total kinetic energy are strictly conserved",
      "Kinetic energy is conserved, but linear momentum is lost",
      "Total mechanical energy is increased"
    ],
    "correct": 0,
    "topic": "Collisions - Inelastic Collisions",
    "chapter": "Force and Motion",
    "explain": "In any isolated collision, total linear momentum is strictly conserved because net external force is zero. In a completely inelastic collision, the bodies stick together and kinetic energy is not conserved, partially dissipating as heat and sound.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-10",
    "q": "A car of mass 1000 kg traveling at 20 m/s is brought to rest over a stopping distance of 50 m by constant braking friction. What is the magnitude of the average braking force applied?",
    "options": [
      "4000 N",
      "2000 N",
      "8000 N",
      "500 N"
    ],
    "correct": 0,
    "topic": "Work-Energy Principle in Deceleration",
    "chapter": "Force and Motion",
    "explain": "By the work-energy theorem, Work done by friction W = ΔKE \\implies F · d = 1/2 m $v^{2}$. F = (m $v^{2}$) / (2 d) = (1000 × $20^{2}$) / (2 × 50) = (1000 × 400) / 100 = 400,000 / 100 = 4000 N.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-11",
    "q": "An electric motor lifts a 200 kg load vertically upward at a constant speed of 2.0 m/s. Taking g = 9.8 m/$s^{2}$, what is the minimum power delivered by the motor?",
    "options": [
      "3920 W (3.92 kW)",
      "1960 W",
      "980 W",
      "400 W"
    ],
    "correct": 0,
    "topic": "Power - Mechanical Lifting at Constant Speed",
    "chapter": "Work, Energy and Power",
    "explain": "At constant speed, upward tension equals weight: F = mg = 200 kg × 9.8 m/$s^{2}$ = 1960 N. Power P = F · v = 1960 N × 2.0 m/s = 3920 W (3.92 kW).",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-12",
    "q": "If the linear momentum of a moving particle is doubled (increased by 100%), by what factor does its kinetic energy increase?",
    "options": [
      "Increases by a factor of 4 (quadruples / increases by 300%)",
      "Increases by a factor of 2 (doubles)",
      "Increases by a factor of 8",
      "Remains unchanged"
    ],
    "correct": 0,
    "topic": "Relationship Between Kinetic Energy and Momentum",
    "chapter": "Work, Energy and Power",
    "explain": "Kinetic energy is related to momentum by KE = $p^{2}$ / (2m). If momentum p is replaced by 2p, KE_new = (2p)^{2} / (2m) = 4 [$p^{2}$ / (2m)] = 4 KE. Thus, kinetic energy quadruples (a 300% increase).",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-13",
    "q": "Which of the following is a non-conservative force in classical mechanics?",
    "options": [
      "Kinetic friction force",
      "Gravitational force",
      "Electrostatic Coulomb force",
      "Ideal spring restoring force"
    ],
    "correct": 0,
    "topic": "Conservative vs Non-Conservative Forces",
    "chapter": "Work, Energy and Power",
    "explain": "A force is conservative if the work it does around a closed loop is zero (path-independent). Gravity, electrostatic, and elastic restoring forces are conservative. Friction and drag are non-conservative forces because their work dissipates mechanical energy into heat and depends on the total distance traveled.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-14",
    "q": "What is the centripetal acceleration of a vehicle moving around a flat circular curve of radius 50 m at a constant linear speed of 20 m/s?",
    "options": [
      "8.0 m/$s^{2}$",
      "4.0 m/$s^{2}$",
      "10.0 m/$s^{2}$",
      "2.5 m/$s^{2}$"
    ],
    "correct": 0,
    "topic": "Uniform Circular Motion - Centripetal Acceleration",
    "chapter": "Rotational and Circular Motion",
    "explain": "Centripetal acceleration is given by ac = $v^{2}$ / r = (20 m/s)^{2} / 50 m = 400 / 50 = 8.0 m/$s^{2}$, directed radially toward the center of curvature.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-15",
    "q": "What is the rotational kinetic energy of a solid flywheel with moment of inertia I = 4.0 kg·$m^{2}$ rotating at an angular velocity of 10 rad/s?",
    "options": [
      "200 J",
      "400 J",
      "40 J",
      "800 J"
    ],
    "correct": 0,
    "topic": "Rotational Kinetic Energy",
    "chapter": "Rotational and Circular Motion",
    "explain": "Rotational kinetic energy is KE_rot = 1/2 I ω² = 1/2 (4.0 kg·$m^{2}$) (10 rad/s)^{2} = 0.5 × 4.0 × 100 = 200 J.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-16",
    "q": "According to the law of conservation of angular momentum (L = I ω = constant), when a spinning figure skater pulls her outstretched arms tightly in toward her torso:",
    "options": [
      "Her moment of inertia decreases, causing her angular spin velocity (ω) to increase",
      "Her moment of inertia increases, causing her to slow down",
      "Her angular velocity and moment of inertia remain identical",
      "Her total angular momentum decreases to zero"
    ],
    "correct": 0,
    "topic": "Conservation of Angular Momentum",
    "chapter": "Rotational and Circular Motion",
    "explain": "Moment of inertia I = ∑ m $r^{2}$. Drawing arms inward redistributes mass closer to the axis of rotation, reducing I. In the absence of external torque, L = I ω is conserved, so angular velocity ω must increase proportionally.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-17",
    "q": "At what banking angle θ should a curved roadway of radius r be inclined so that a car moving at design speed v can safely negotiate the turn without relying on tire friction?",
    "options": [
      "tan(θ) = $v^{2}$ / (r g)",
      "sin(θ) = v / (r g)",
      "tan(θ) = (r g) / $v^{2}$",
      "cos(θ) = $v^{2}$ / (r g)"
    ],
    "correct": 0,
    "topic": "Banking of Roads - Frictionless Condition",
    "chapter": "Rotational and Circular Motion",
    "explain": "The horizontal component of normal force provides the centripetal force: N sin(θ) = m $v^{2}$ / r, while the vertical component balances gravity: N cos(θ) = mg. Dividing equations gives tan(θ) = $v^{2}$ / (r g).",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-18",
    "q": "According to the equation of continuity for incompressible fluid flow (A1 v1 = A2 v2), if the cross-sectional area of a pipe is reduced by half, what happens to the fluid flow speed?",
    "options": [
      "The flow speed doubles (increases by factor of 2)",
      "The flow speed is halved",
      "The flow speed quadruples",
      "The flow speed remains constant"
    ],
    "correct": 0,
    "topic": "Fluid Continuity Equation",
    "chapter": "Fluid Dynamics",
    "explain": "A1 v1 = A2 v2. If A2 = A1 / 2, then v2 = (A1 / A2) v1 = (A1 / (A1 / 2)) v1 = 2 v1. Halving cross-sectional area doubles the fluid velocity.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-19",
    "q": "According to Bernoulli's principle for horizontal fluid flow (P + 1/2 ρ $v^{2}$ = constant), at a constriction where the fluid speed increases:",
    "options": [
      "The internal static fluid pressure decreases",
      "The static pressure increases proportionally",
      "The density of the fluid drops to zero",
      "Viscous dissipation halts the flow"
    ],
    "correct": 0,
    "topic": "Bernoulli's Theorem in Horizontal Constrictions",
    "chapter": "Fluid Dynamics",
    "explain": "For horizontal streamlines (constant elevation h), P + 1/2 ρ $v^{2}$ = constant. When fluid velocity v increases, kinetic energy per unit volume (1/2 ρ $v^{2}$) rises; therefore, the static fluid pressure P must decrease (Venturi effect).",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-20",
    "q": "According to Stokes' Law (F = 6πηrv), what is the terminal velocity (vt) of a spherical raindrop of radius r and density ρ falling through air of viscosity η and density σ?",
    "options": [
      "vt = [2 $r^{2}$ (ρ - σ) g] / (9 η)",
      "vt = [9 $r^{2}$ (ρ - σ) g] / (2 η)",
      "vt = [6 π η r] / (m g)",
      "vt = [4 r (ρ - σ) g] / (3 η)"
    ],
    "correct": 0,
    "topic": "Terminal Velocity from Stokes' Law",
    "chapter": "Fluid Dynamics",
    "explain": "At terminal velocity, downward weight balances upward buoyant force plus viscous drag: mg = F_b + 6πηrvt \\implies (4/3)π$r^{3}$ρg = (4/3)π$r^{3}$σg + 6πηrvt \\implies vt = [2 $r^{2}$ (ρ - σ) g] / (9 η).",
    "difficulty": "Hard",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-21",
    "q": "For a simple pendulum executing small-amplitude oscillations, how does quadrupling the pendulum length (L -> 4L) affect its period of oscillation (T)?",
    "options": [
      "The period doubles (increases by a factor of 2)",
      "The period quadruples",
      "The period is halved",
      "The period is unchanged"
    ],
    "correct": 0,
    "topic": "Simple Harmonic Motion - Pendulum Period",
    "chapter": "Oscillations",
    "explain": "The period of a simple pendulum is T = 2π $\\sqrt${L / g}. If length L becomes 4L, T_new = 2π $\\sqrt${4L / g} = 2 × [2π $\\sqrt${L / g}] = 2 T. The period doubles.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-22",
    "q": "In simple harmonic motion (SHM) of a mass-spring system, at which position is the instantaneous kinetic energy of the oscillating mass at its absolute maximum?",
    "options": [
      "At the central equilibrium position (x = 0)",
      "At the positive extreme displacement (x = +A)",
      "At the negative extreme displacement (x = -A)",
      "At half the amplitude (x = A/2)"
    ],
    "correct": 0,
    "topic": "SHM - Energy Distribution Across Cycle",
    "chapter": "Oscillations",
    "explain": "In SHM, total mechanical energy is E = 1/2 k $A^{2}$ = constant. At the equilibrium position (x = 0), potential energy is zero (U = 1/2 k $x^{2}$ = 0), so all energy exists as kinetic energy (KE_max = 1/2 m v_$max^{2}$ = 1/2 k $A^{2}$).",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-23",
    "q": "What physical condition defines resonance in a forced (driven) harmonic oscillator?",
    "options": [
      "The driving frequency of the external periodic force matches the natural frequency of the oscillating system, producing maximum energy absorption and amplitude",
      "The damping coefficient exceeds the critical damping threshold",
      "The amplitude of oscillation decays to zero instantaneously",
      "The restoring force drops to zero"
    ],
    "correct": 0,
    "topic": "Forced Oscillations and Resonance",
    "chapter": "Oscillations",
    "explain": "Resonance occurs when the frequency of an applied periodic driving force equals the natural resonant frequency of the system (f_drive = f_0). Power transfer is optimized, causing the steady-state amplitude of oscillation to reach a sharp maximum.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-24",
    "q": "For an object executing SHM described by displacement equation x(t) = A cos(ω t), what is the relationship between instantaneous acceleration a(t) and displacement x(t)?",
    "options": [
      "a(t) = -ω² x(t)",
      "a(t) = +ω x(t)",
      "a(t) = -ω x(t)",
      "a(t) = +ω² x(t)"
    ],
    "correct": 0,
    "topic": "Differential Equation of SHM",
    "chapter": "Oscillations",
    "explain": "Differentiating displacement x = A cos(ωt) yields velocity v = dx/dt = -Aω sin(ωt). Differentiating velocity yields acceleration a = dv/dt = -Aω² cos(ωt) = -ω² x. Acceleration is directly proportional to displacement and opposite in direction.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-25",
    "q": "In a standing (stationary) wave formed on a stretched string fixed at both ends, the points where particles experience zero amplitude of vibration are termed:",
    "options": [
      "Nodes",
      "Antinodes",
      "Crests",
      "Troughs"
    ],
    "correct": 0,
    "topic": "Stationary Waves - Nodes and Antinodes",
    "chapter": "Waves",
    "explain": "Nodes are positions along a standing wave where destructive interference is permanent, resulting in zero particle displacement. Antinodes are positions of constructive interference where displacement amplitude is at a maximum.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-26",
    "q": "According to the Doppler effect, when an ambulance with a sounding siren of frequency f0 approaches a stationary pedestrian at speed vs (speed of sound = v), the observed frequency f is:",
    "options": [
      "f = f0 [v / (v - vs)] (higher pitch)",
      "f = f0 [v / (v + vs)] (lower pitch)",
      "f = f0 [(v + vs) / v]",
      "f = f0"
    ],
    "correct": 0,
    "topic": "Doppler Effect for Sound - Approaching Source",
    "chapter": "Waves",
    "explain": "As the source moves toward a stationary listener, wavefronts are compressed in front of the source, shortening the observed wavelength (λ' = (v - vs)/f0). The perceived frequency f = v / λ' = f0 [v / (v - vs)], which is higher than f0.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-27",
    "q": "In Young's double-slit interference experiment, the fringe width (fringe spacing β) is mathematically given by:",
    "options": [
      "β = (λ L) / d",
      "β = (λ d) / L",
      "β = (d L) / λ",
      "β = λ / (2 d)"
    ],
    "correct": 0,
    "topic": "Wave Optics - Young's Double Slit Fringe Width",
    "chapter": "Waves",
    "explain": "The linear fringe separation between adjacent bright (or dark) fringes on the screen is β = (λ L) / d, where λ is light wavelength, L is distance from slits to screen, and d is slit separation distance.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-28",
    "q": "In an adiabatic thermodynamic process involving an ideal gas, how much heat (Q) is exchanged between the system and its surroundings?",
    "options": [
      "Q = 0 (zero heat exchange)",
      "Q = ΔU",
      "Q = W",
      "Q = constant > 0"
    ],
    "correct": 0,
    "topic": "Thermodynamic Processes - Adiabatic Process",
    "chapter": "Thermodynamics",
    "explain": "An adiabatic process is one in which the system is thermally isolated from its surroundings, or the process occurs so rapidly that no heat enters or leaves: Q = 0. By the first law, ΔU = -W.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-29",
    "q": "What is the theoretical thermal efficiency of a reversible Carnot heat engine operating between a hot reservoir at 600 K and a cold sink at 300 K?",
    "options": [
      "50%",
      "100%",
      "25%",
      "75%"
    ],
    "correct": 0,
    "topic": "Carnot Heat Engine Efficiency",
    "chapter": "Thermodynamics",
    "explain": "Carnot efficiency is η = 1 - (Tc / Th) = 1 - (300 / 600) = 1 - 0.50 = 0.50 = 50%.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-30",
    "q": "According to the Second Law of Thermodynamics (Clausius statement), it is impossible to construct a cyclic device whose sole effect is to:",
    "options": [
      "Transfer heat from a cooler body to a hotter body without the input of external work",
      "Convert work completely into heat",
      "Maintain constant entropy in a closed system",
      "Compress an ideal gas reversibly"
    ],
    "correct": 0,
    "topic": "Second Law of Thermodynamics Statements",
    "chapter": "Thermodynamics",
    "explain": "The Clausius statement of the 2nd law establishes that heat cannot spontaneously flow from a colder body to a hotter body without external work input (e.g., refrigerator compressors require electrical work).",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-31",
    "q": "What is the numerical value of the adiabatic index ratio γ = Cp / Cv for an ideal monoatomic gas (such as helium or neon)?",
    "options": [
      "1.67 (5/3)",
      "1.40 (7/5)",
      "1.33 (4/3)",
      "1.20 (6/5)"
    ],
    "correct": 0,
    "topic": "Thermodynamics - Adiabatic Index Ratio for Monoatomic Gas",
    "chapter": "Thermodynamics",
    "explain": "For an ideal monoatomic gas with 3 translational degrees of freedom, Cv = 3/2 R and Cp = Cv + R = 5/2 R. The ratio of molar specific heat capacities is γ = Cp / Cv = (5/2 R) / (3/2 R) = 5/3 ≈ 1.67.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-32",
    "q": "According to Coulomb's law, if the separation distance (r) between two point charges is doubled while keeping charges constant, what happens to the electrostatic force between them?",
    "options": [
      "The force decreases to one-fourth of its initial value (decreases by factor of 4)",
      "The force is halved",
      "The force quadruples",
      "The force remains unchanged"
    ],
    "correct": 0,
    "topic": "Coulomb's Law - Inverse-Square Distance Dependence",
    "chapter": "Electrostatics",
    "explain": "Coulomb's law states F = (k q1 q2) / $r^{2}$. Because force depends inversely on the square of distance, doubling r (r -> 2r) causes the force to become F_new = F / $2^{2}$ = F / 4.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-33",
    "q": "What is the capacitance of a parallel-plate capacitor with plate area A and separation distance d when filled with a dielectric material of relative permittivity εr?",
    "options": [
      "C = (εr ε0 A) / d",
      "C = (ε0 A) / (εr d)",
      "C = (εr d) / (ε0 A)",
      "C = εr ε0 A d"
    ],
    "correct": 0,
    "topic": "Capacitance of Parallel Plate Capacitors",
    "chapter": "Electrostatics",
    "explain": "The capacitance of a parallel plate capacitor in vacuum is C0 = (ε0 A) / d. Introducing a dielectric of dielectric constant εr enhances capacitance via molecular polarization: C = εr C0 = (εr ε0 A) / d.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-34",
    "q": "According to Gauss's law in electrostatics, what is the net electric flux (ΦE) passing through any closed Gaussian surface enclosing a net electric charge Q_enc?",
    "options": [
      "ΦE = Q_enc / ε0",
      "ΦE = Q_enc · ε0",
      "ΦE = ε0 / Q_enc",
      "ΦE = 0 regardless of charge"
    ],
    "correct": 0,
    "topic": "Gauss's Law of Electrostatics",
    "chapter": "Electrostatics",
    "explain": "Gauss's law states that the total electric flux through any closed surface is equal to 1/ε0 times the total net electric charge enclosed by that surface: ∮ E · dA = Q_enc / ε0.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-35",
    "q": "Kirchhoff's Current Law (junction rule, ∑ I = 0) is a direct consequence of which fundamental physical conservation law?",
    "options": [
      "Conservation of electric charge",
      "Conservation of energy",
      "Conservation of linear momentum",
      "Conservation of magnetic flux"
    ],
    "correct": 0,
    "topic": "Kirchhoff's Rules - Junction Rule Conservation",
    "chapter": "Current Electricity",
    "explain": "Kirchhoff's junction rule (KCL) states that total current entering a junction equals total current leaving it. This reflects conservation of electric charge: charge cannot accumulate or disappear at a point conductor junction.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-36",
    "q": "Three resistors of resistance 2 Ω, 3 Ω, and 6 Ω are connected in parallel across a battery. What is the equivalent resistance of this parallel combination?",
    "options": [
      "1.0 Ω",
      "11.0 Ω",
      "0.5 Ω",
      "3.0 Ω"
    ],
    "correct": 0,
    "topic": "Resistors in Parallel Calculation",
    "chapter": "Current Electricity",
    "explain": "1/Req = 1/R1 + 1/R2 + 1/R3 = 1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 6/6 = 1.0 Ω⁻¹ => Req = 1.0 Ω.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-37",
    "q": "A charged particle of charge q enters a uniform magnetic field B with velocity v oriented parallel to the magnetic field lines (θ = $0^\\circ$). What is the magnetic Lorentz force experienced by the particle?",
    "options": [
      "Zero (0 N)",
      "q v B",
      "1/2 q v B",
      "Infinite"
    ],
    "correct": 0,
    "topic": "Magnetic Lorentz Force on Moving Charges",
    "chapter": "Electromagnetism",
    "explain": "The magnetic force is given by FB = q (v × B) = q v B sin(θ). When velocity is parallel to field lines, θ = $0^\\circ$ and sin($0^\\circ$) = 0, so the magnetic force is zero. The particle continues in a straight line undeflected.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-38",
    "q": "According to Ampère's circuital law, what is the magnetic flux density (B) inside a long, tightly wound solenoid possessing n turns per unit length carrying current I?",
    "options": [
      "B = μ0 n I",
      "B = (μ0 I) / (2 π r)",
      "B = (μ0 n I) / 2",
      "B = μ0 $n^{2}$ I"
    ],
    "correct": 0,
    "topic": "Ampère's Law - Solenoid Magnetic Field",
    "chapter": "Electromagnetism",
    "explain": "Applying Ampère's law (∮ B · dl = μ0 I_enc) along a rectangular Amperian loop inside a long solenoid yields B L = μ0 (n L) I \\implies B = μ0 n I. The internal field is uniform and directed along the solenoid axis.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-39",
    "q": "According to Lenz's Law, the polarity of an induced electromotive force (emf) is such that it always:",
    "options": [
      "Opposes the change in magnetic flux that produces it",
      "Assists and reinforces the changing magnetic flux",
      "Generates a constant electrostatic field",
      "Dissipates zero electrical energy"
    ],
    "correct": 0,
    "topic": "Faraday's and Lenz's Law of Induction",
    "chapter": "Electromagnetic Induction",
    "explain": "Lenz's law (represented by the negative sign in Faraday's law ε = -dΦB/dt) states that an induced current always flows in a direction such that its own magnetic field opposes the magnetic flux change that created it, satisfying conservation of energy.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-40",
    "q": "What is the mutual inductance (M) between two coils if a current change of 4.0 A/s in the primary coil induces an emf of 12.0 V in the secondary coil?",
    "options": [
      "3.0 Henry (H)",
      "48.0 H",
      "0.33 H",
      "16.0 H"
    ],
    "correct": 0,
    "topic": "Mutual Inductance Calculation",
    "chapter": "Electromagnetic Induction",
    "explain": "Induced secondary emf is ε2 = M (ΔI1 / Δt). M = ε2 / (ΔI1 / Δt) = 12.0 V / 4.0 A/s = 3.0 H.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-41",
    "q": "How does an ideal step-up transformer change electrical voltage and current from the primary winding to the secondary winding (Np < Ns)?",
    "options": [
      "Increases voltage and decreases current proportionally, keeping total electrical power constant",
      "Increases both voltage and current simultaneously",
      "Decreases voltage and increases current",
      "Increases electrical power output above input power"
    ],
    "correct": 0,
    "topic": "Transformer Equations and Power Conservation",
    "chapter": "Electromagnetic Induction",
    "explain": "Vs / Vp = Ns / Np. For an ideal step-up transformer (Ns > Np), secondary voltage is stepped up (Vs > Vp). Since power is conserved (Pp = Ps \\implies Vp Ip = Vs Is), secondary current must decrease proportionally (Is < Ip).",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-42",
    "q": "In an extrinsic n-type semiconductor crystal (such as silicon doped with phosphorus), what are the majority charge carriers?",
    "options": [
      "Conduction band electrons",
      "Valence band holes",
      "Positive silicon ions",
      "Acceptor impurity cores"
    ],
    "correct": 0,
    "topic": "Extrinsic Semiconductors - Doping and Majority Carriers",
    "chapter": "Electronics",
    "explain": "Doping tetravalent silicon with pentavalent donor atoms (such as P, As, Sb) contributes extra valence electrons that enter the conduction band. Hence, electrons are majority carriers and holes are minority carriers.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-43",
    "q": "What happens to the width of the depletion layer and the barrier potential across a p-n junction diode when it is connected in forward bias?",
    "options": [
      "The depletion layer width narrows and the barrier potential is reduced, permitting current flow",
      "The depletion layer widens and barrier potential increases",
      "The depletion layer remains unchanged",
      "The junction completely insulates all carriers"
    ],
    "correct": 0,
    "topic": "p-n Junction - Forward vs Reverse Bias",
    "chapter": "Electronics",
    "explain": "In forward bias (positive terminal connected to p-side, negative to n-side), the external field opposes the built-in barrier field, narrowing the depletion region and lowering the potential barrier to allow majority carriers to cross.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-44",
    "q": "What is the boolean logic output of a two-input NAND gate when both inputs A and B are simultaneously HIGH (binary 1)?",
    "options": [
      "LOW (0)",
      "HIGH (1)",
      "Floating high impedance",
      "Alternating pulse"
    ],
    "correct": 0,
    "topic": "Digital Logic Gates - NAND Truth Table",
    "chapter": "Electronics",
    "explain": "A NAND gate is an AND gate followed by an inverter: Y = NOT(A AND B). When A = 1 and B = 1, A AND B = 1, and inverting gives output Y = 0 (LOW). For all other input combinations, the output is 1.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-45",
    "q": "In a photoelectric effect apparatus illuminated by monochromatic light above the threshold frequency, what occurs when the intensity of the incident radiation is doubled while keeping frequency constant?",
    "options": [
      "The saturation photocurrent doubles, while the stopping potential (V0) and maximum kinetic energy of photoelectrons remain unchanged",
      "The stopping potential doubles, while the saturation photocurrent remains unchanged",
      "Both the stopping potential and the saturation photocurrent double",
      "The work function of the target metal is halved"
    ],
    "correct": 0,
    "topic": "Photoelectric Effect - Intensity vs Frequency Dependence",
    "chapter": "Dawn of Modern Physics",
    "explain": "Intensity of monochromatic light corresponds to the rate of incident photons per unit time. Doubling intensity doubles the number of emitted photoelectrons per second, doubling saturation current. However, individual photon energy (hf) and electron maximum kinetic energy (KE_max = e V0 = hf - Φ) depend solely on frequency, leaving stopping potential unaffected.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-46",
    "q": "According to the de Broglie matter-wave hypothesis, what is the wavelength (λ) associated with a moving particle of rest mass m traveling at velocity v?",
    "options": [
      "λ = h / (m v)",
      "λ = (m v) / h",
      "λ = h m v",
      "λ = h / (m $c^{2}$)"
    ],
    "correct": 0,
    "topic": "de Broglie Wavelength of Matter Waves",
    "chapter": "Dawn of Modern Physics",
    "explain": "Louis de Broglie postulated that all matter exhibits wave-particle duality. The matter wavelength is given by λ = h / p = h / (m v), where h is Planck's constant and p is linear momentum.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-47",
    "q": "In Compton scattering, when an incident X-ray photon of wavelength λ0 collides with a stationary free electron and scatters at angle θ, the scattered photon wavelength λ' is:",
    "options": [
      "Greater than λ0 (λ' - λ0 = [h / (m_e c)] (1 - cos θ))",
      "Less than λ0",
      "Identical to λ0 for all scattering angles",
      "Zero"
    ],
    "correct": 0,
    "topic": "Compton Scattering - Wavelength Shift",
    "chapter": "Dawn of Modern Physics",
    "explain": "In Compton scattering, the photon transfers kinetic energy and momentum to the target electron. Conservation of energy and relativistic momentum yields a wavelength shift Δλ = λ' - λ0 = [h / (m_e c)] (1 - cos θ), meaning the scattered photon has less energy and a longer wavelength.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-48",
    "q": "What is the nuclear composition of an alpha particle (α-particle) emitted during radioactive alpha decay?",
    "options": [
      "Two protons and two neutrons (a helium-4 nucleus, ⁴₂$He^{2}$⁺)",
      "A high-speed nuclear electron",
      "A high-energy electromagnetic photon",
      "A solitary free neutron"
    ],
    "correct": 0,
    "topic": "Radioactive Emissions - Alpha Particle Identity",
    "chapter": "Nuclear Physics",
    "explain": "An alpha particle is identical to a doubly ionized helium nucleus (⁴₂$He^{2}$⁺), consisting of 2 protons and 2 neutrons tightly bound together with a total mass number A = 4 and atomic charge Z = +2.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-49",
    "q": "A radioactive sample has a half-life (t1/2) of 8.0 days. What fraction of the original radioactive parent nuclei remains undecayed after 24 days?",
    "options": [
      "1/8 (12.5%)",
      "1/4 (25%)",
      "1/16 (6.25%)",
      "1/2 (50%)"
    ],
    "correct": 0,
    "topic": "Radioactive Decay Law - Half-Life Decay Calculations",
    "chapter": "Nuclear Physics",
    "explain": "Number of elapsed half-lives n = total time / t1/2 = 24 days / 8.0 days = 3 half-lives. The remaining fraction is (1/2)ⁿ = (1/2)^{3} = 1/8 (or 12.5%).",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-50",
    "q": "In the nuclear binding energy per nucleon curve, which nuclide sits near the absolute peak of the curve (~8.8 MeV per nucleon), representing maximum nuclear stability?",
    "options": [
      "Iron-56 (⁵⁶Fe)",
      "Uranium-235 (²³⁵U)",
      "Helium-4 (⁴He)",
      "Deuterium (²H)"
    ],
    "correct": 0,
    "topic": "Nuclear Binding Energy Curve and Stability",
    "chapter": "Nuclear Physics",
    "explain": "The binding energy per nucleon curve peaks at iron-56 (⁵⁶₂₆Fe) and nickel-62 at ~8.8 MeV/nucleon. Light elements can undergo fusion toward Fe to release energy, while heavy elements like uranium undergo fission toward Fe.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-51",
    "q": "During negative beta decay (β⁻ decay) of a radioactive nucleus, what microscopic transformation occurs inside the nucleus?",
    "options": [
      "A neutron transforms into a proton, emitting an electron (β⁻) and an electron antineutrino (ν̄e)",
      "A proton transforms into a neutron, emitting a positron",
      "Two protons fuse to form a deuteron",
      "An orbital electron is captured by the nucleus"
    ],
    "correct": 0,
    "topic": "Beta Decay Mechanics - Weak Interaction",
    "chapter": "Nuclear Physics",
    "explain": "In β⁻ decay mediated by the weak force, a down quark in a neutron flips to an up quark: n -> p + e⁻ + ν̄e. The atomic number Z increases by 1 while the mass number A remains unchanged.",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-52",
    "q": "According to Hooke's Law within the elastic limit of a material, stress is directly proportional to:",
    "options": [
      "Strain",
      "Young's modulus squared",
      "Surface area",
      "Plastic deformation"
    ],
    "correct": 0,
    "topic": "Elasticity - Hooke's Law and Stress-Strain",
    "chapter": "Physics of Solids",
    "explain": "Hooke's law states that within the proportional (elastic) limit of a solid, stress (force per unit area) is directly proportional to strain (fractional deformation): Stress = E × Strain, where E is the modulus of elasticity.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-53",
    "q": "In the energy band theory of crystalline solids, how does an electrical insulator differ from a semiconductor at room temperature?",
    "options": [
      "An insulator has a very wide forbidden energy band gap (Eg > 3-5 eV) between valence and conduction bands",
      "An insulator has overlapping valence and conduction bands",
      "An insulator has a completely empty valence band",
      "An insulator contains a high density of conduction electrons"
    ],
    "correct": 0,
    "topic": "Band Theory of Solids - Insulators vs Semiconductors",
    "chapter": "Physics of Solids",
    "explain": "In insulators, the forbidden energy band gap (Eg) is wide (> 3 to 6 eV), preventing thermal excitation of electrons from the valence band into the conduction band at room temperature. Semiconductors have a narrow band gap (~1 eV).",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-54",
    "q": "What is the defining physical characteristic of a superconductor cooled below its critical transition temperature (Tc)?",
    "options": [
      "Zero electrical resistance and complete expulsion of internal magnetic fields (Meissner effect)",
      "Infinite electrical resistance",
      "Generation of high internal thermal heat",
      "Loss of all magnetic susceptibility"
    ],
    "correct": 0,
    "topic": "Superconductivity and Meissner Effect",
    "chapter": "Physics of Solids",
    "explain": "Below Tc, superconductors exhibit zero DC electrical resistance (current circulates indefinitely without dissipation) and perfect diamagnetism, completely expelling magnetic flux lines from their interior (the Meissner effect).",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-55",
    "q": "For a sinusoidal alternating current with peak current I0, what is the root-mean-square (RMS / effective) current Irms?",
    "options": [
      "Irms = I0 / $\\sqrt${2} ≈ 0.707 I0",
      "Irms = 2 I0 / π",
      "Irms = I0 / 2",
      "Irms = $\\sqrt${2} I0"
    ],
    "correct": 0,
    "topic": "Alternating Current - Root-Mean-Square (RMS) Values",
    "chapter": "Alternating Current",
    "explain": "The RMS current represents the equivalent steady DC current that delivers the same average resistive heating power: Irms = I0 / $\\sqrt${2} ≈ 0.707 I0.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-56",
    "q": "In a purely inductive AC circuit containing inductance L and angular frequency ω, what is the phase relationship between the alternating voltage v(t) and alternating current i(t)?",
    "options": [
      "Voltage leads current by a phase angle of $90^\\circ$ (π/2 radians)",
      "Current leads voltage by $90^\\circ$",
      "Voltage and current are in phase (phase difference = $0^\\circ$)",
      "Voltage and current are $180^\\circ$ out of phase"
    ],
    "correct": 0,
    "topic": "AC in Pure Inductor - Phase Angle",
    "chapter": "Alternating Current",
    "explain": "In a purely inductive circuit, self-induced back emf opposes current rise. Consequently, voltage reaches its peak a quarter-cycle before current does: voltage leads current by $90^\\circ$ (π/2 rad) (ELI mnemonic: E leads I in L).",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-57",
    "q": "What is the resonant frequency (fr) of a series RLC alternating current circuit containing inductance L and capacitance C?",
    "options": [
      "fr = 1 / (2 π $\\sqrt${L C})",
      "fr = 2 π $\\sqrt${L C}",
      "fr = 1 / (2 π L C)",
      "fr = $\\sqrt${L / C}"
    ],
    "correct": 0,
    "topic": "Series RLC Resonance Frequency Formula",
    "chapter": "Alternating Current",
    "explain": "Resonance occurs when inductive reactance equals capacitive reactance: XL = XC => ωr L = 1 / (ωr C) => ω$r^{2}$ = 1 / (L C) \\implies 2π fr = 1 / $\\sqrt${LC} \\implies fr = 1 / (2π $\\sqrt${LC}). At resonance, circuit impedance is purely resistive and minimal (Z = R).",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-58",
    "q": "According to Bohr's quantum condition, an electron can only revolve in stable, non-radiating orbits where its orbital angular momentum L is quantized as:",
    "options": [
      "L = (n h) / (2 π), where n = 1, 2, 3...",
      "L = (2 π n) / h",
      "L = $n^{2}$ h",
      "L = h / (4 π n)"
    ],
    "correct": 0,
    "topic": "Bohr Postulates - Angular Momentum Quantization",
    "chapter": "Atomic Spectra",
    "explain": "Bohr's second postulate states that the orbital angular momentum of an electron is an integral multiple of h / 2π: m v r = (n h) / (2π), where n is the principal quantum number.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-59",
    "q": "In the emission spectrum of atomic hydrogen, transitions from higher outer orbits (n = 3, 4, 5...) down to the ground state (n = 1) produce spectral lines in which region of the electromagnetic spectrum?",
    "options": [
      "Ultraviolet region (Lyman series)",
      "Visible region (Balmer series)",
      "Infrared region (Paschen series)",
      "Far-infrared region (Brackett series)"
    ],
    "correct": 0,
    "topic": "Hydrogen Spectral Series - Lyman Series",
    "chapter": "Atomic Spectra",
    "explain": "The Lyman series transitions terminate on n = 1 and involve large energy differences (≥ 10.2 eV), falling in the ultraviolet spectrum. The Balmer series (terminating on n = 2) falls in the visible spectrum.",
    "difficulty": "Easy",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  },
  {
    "id": "mdcat-b8-phy-60",
    "q": "What fundamental quantum optical process is required for laser light amplification, wherein an incident photon stimulates an excited atom in a metastable state to emit an identical, coherent photon?",
    "options": [
      "Stimulated emission",
      "Spontaneous emission",
      "Photoelectric absorption",
      "Rayleigh scattering"
    ],
    "correct": 0,
    "topic": "Laser Physics - Stimulated Emission",
    "chapter": "Atomic Spectra",
    "explain": "LASER (Light Amplification by Stimulated Emission of Radiation) requires population inversion. An incoming photon of energy hf induces an excited electron to drop to ground state, emitting a second photon of identical energy, phase, polarization, and direction (coherent amplification).",
    "difficulty": "Medium",
    "subject": "Physics",
    "universities": [
      "MDCAT"
    ]
  }
];

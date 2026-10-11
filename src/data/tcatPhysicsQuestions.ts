import { Question } from '../types';

export const TCAT_PHYSICS_QUESTIONS: Question[] = [
  {
    "id": "tcat-phy-meas-1",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Easy",
    "q": "Which of the following is a supplementary SI unit?",
    "options": [
      "Steradian (sr)",
      "Candela (cd)",
      "Ampere (A)",
      "Kelvin (K)"
    ],
    "correct": 0,
    "explain": "Radian (plane angle) and Steradian (solid angle) are the two supplementary SI units, while candela, ampere, and kelvin are fundamental base units.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-2",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Easy",
    "q": "What is the dimensional formula of universal gravitational constant G?",
    "options": [
      "[$M^{-1}L^{3}T^{-2}$]",
      "[$M^{1}L^{2}T^{-2}$]",
      "[$M^{-1}L^{2}T^{-1}$]",
      "[$M^{0}L^{3}T^{-2}$]"
    ],
    "correct": 0,
    "explain": "From F = G m1 m2 / $r^{2}$: G = F $r^{2}$ / (m1 m2) => [M L $T^{-2}$][$L^{2}$] / [$M^{2}$] = [$M^{-1}L^{3}T^{-2}$].",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-3",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Medium",
    "q": "How many significant figures are in the measurement 0.005080 kg?",
    "options": [
      "4",
      "3",
      "6",
      "7"
    ],
    "correct": 0,
    "explain": "Leading zeros before the first non-zero digit are not significant. The digits 5, 0, 8, and the trailing 0 (after decimal) are significant, giving exactly 4 significant figures.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-4",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Medium",
    "q": "If the percentage uncertainty in mass is 2% and in velocity is 3%, what is the percentage uncertainty in kinetic energy (KE = (1/2)$mv^{2}$)?",
    "options": [
      "8%",
      "5%",
      "11%",
      "6%"
    ],
    "correct": 0,
    "explain": "% uncertainty in KE = (% in m) + 2 × (% in v) = 2% + 2(3%) = 2% + 6% = 8%.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-5",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Hard",
    "q": "The period of oscillation of a simple pendulum is T = 2\\pi $\\sqrt${L/g}. If measured length has 1% error and time period has 2% error, what is the maximum percentage error in the calculated acceleration due to gravity g?",
    "options": [
      "5%",
      "3%",
      "4%",
      "1%"
    ],
    "correct": 0,
    "explain": "g = 4\\$pi^{2}$ L / $T^{2}$. Percentage error in g = (% error in L) + 2 × (% error in T) = 1% + 2(2%) = 5%.$",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-1",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Easy",
    "q": "What is the SI unit of torque (moment of a force)?",
    "options": [
      "Newton-meter (N·m)",
      "Joule (J)",
      "Newton per meter (N/m)",
      "Pascal (Pa)"
    ],
    "correct": 0,
    "explain": "Torque \\tau = r × F has units of Newton-meters (N·m). Although dimensionally equivalent to Joules, torque is a vector quantity and is strictly measured in N·m.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-2",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Easy",
    "q": "The first condition of equilibrium states that for a body in translational equilibrium:",
    "options": [
      "\\sum F = 0 (Vector sum of all external forces is zero)",
      "\\sum \\tau = 0 (Sum of all torques is zero)",
      "Velocity must be zero",
      "Acceleration must be non-zero"
    ],
    "correct": 0,
    "explain": "Translational equilibrium requires \\sum F = 0. (Rotational equilibrium requires \\sum \\tau = 0).",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-3",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Medium",
    "q": "If the magnitudes of dot product and cross product of two vectors are equal (|A · B| = |A × B|), what is the angle between them?",
    "options": [
      "$45^\\circ$ (\\pi/4)",
      "$90^\\circ$ (\\pi/2)",
      "$60^\\circ$ (\\pi/3)",
      "$0^\\circ$"
    ],
    "correct": 0,
    "explain": "|A · B| = AB$\\cos$($\\theta$) and |A × B| = AB$\\sin$($\\theta$). Equating them gives $\\sin$($\\theta$) = $\\cos$($\\theta$) \\implies $\\tan$($\\theta$) = 1 \\implies $\\theta =  45^\\circ$.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-4",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Medium",
    "q": "Two forces of 6 N and 8 N act at a right angle ($90^\\circ$) to each other. What is the magnitude of their resultant force?",
    "options": [
      "10 N",
      "14 N",
      "2 N",
      "48 N"
    ],
    "correct": 0,
    "explain": "R = $\\sqrt${$F1^{2} +  F2^{2}$ + 2F1 F2 $\\cos$($90^\\circ$)} = $\\sqrt${$6^{2} +  8^{2}$} = $\\sqrt${36 + 64} = $\\sqrt${100} = 10 N.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-5",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Hard",
    "q": "A uniform meter rod of mass 200 g is balanced horizontally on a knife-edge placed at the 40 cm mark. Where must a 100 g mass be suspended to maintain horizontal equilibrium?",
    "options": [
      "At the 20 cm mark",
      "At the 30 cm mark",
      "At the 60 cm mark",
      "At the 10 cm mark"
    ],
    "correct": 0,
    "explain": "Center of gravity of the rod is at 50 cm. Distance from pivot (40 cm) to CG is 10 cm. Clockwise torque = 200 g × 10 cm = 2000 g·cm. Counter-clockwise torque needed = 100 g × d = 2000 \\implies d = 20 cm to the left of 40 cm, which is at the (40 - 20) = 20 cm mark.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-1",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Easy",
    "q": "At what launch angle $\\theta$ is the horizontal range of a projectile maximum over level ground?",
    "options": [
      "$45^\\circ$",
      "$30^\\circ$",
      "$60^\\circ$",
      "$90^\\circ$"
    ],
    "correct": 0,
    "explain": "Range R = ($v0^{2}\\sin$(2$\\theta$)) / g. The maximum occurs when $\\sin$(2$\\theta$) = 1 \\implies 2$\\theta =  90^\\circ \\implies \\theta =  45^\\circ$.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-2",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Easy",
    "q": "The area under a velocity-time (v-t) graph represents:",
    "options": [
      "Displacement",
      "Acceleration",
      "Force",
      "Momentum"
    ],
    "correct": 0,
    "explain": "Area under v-t graph = \\int v dt = displacement. (Slope of v-t graph represents acceleration).",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-3",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Medium",
    "q": "A ball is projected horizontally with 20 m/s from the top of a 20 m high tower. Taking g = 10 m/$s^{2}$, how far from the base of the tower will it strike the ground?",
    "options": [
      "40 m",
      "20 m",
      "60 m",
      "80 m"
    ],
    "correct": 0,
    "explain": "Time of flight t = $\\sqrt${2h/g} = $\\sqrt${2(20)/10} = $\\sqrt${4} = 2 s. Horizontal distance x = vx · t = 20 m/s × 2 s = 40 m.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-4",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Medium",
    "q": "A force of 50 N acts on an object of mass 5 kg for 0.2 seconds. What is the impulse imparted to the object?",
    "options": [
      "10 N·s",
      "250 N·s",
      "5 N·s",
      "50 N·s"
    ],
    "correct": 0,
    "explain": "Impulse J = F · \\Delta t = 50 N × 0.2 s = 10 N·s (or kg·m/s).",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-5",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Hard",
    "q": "A bullet of mass 20 g moving with velocity 400 m/s penetrates a wooden block up to 10 cm before coming to rest. What is the average retarding force exerted by the wood?",
    "options": [
      "16,000 N",
      "8,000 N",
      "32,000 N",
      "1,600 N"
    ],
    "correct": 0,
    "explain": "Work done against retarding force = initial KE: F · d = (1/2)$mv^{2}$. F(0.1 m) = 0.5 × 0.02 kg × $(400)^{2}$ = 0.01 × 160,000 = 1600 J. F = 1600 / 0.1 = 16,000 N.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-1",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Easy",
    "q": "How many Joules are equivalent to 1 kilowatt-hour (1 kWh)?",
    "options": [
      "3.6 × $10^{6}$ J (3.6 MJ)",
      "3.6 × $10^{3}$ J",
      "1.0 × $10^{6}$ J",
      "3.6 × $10^{5}$ J"
    ],
    "correct": 0,
    "explain": "1 kWh = 1000 W × 3600 s = 3,600,000 J = 3.6 × $10^{6}$ J.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-2",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Easy",
    "q": "If the angle between the applied force and the displacement is $90^\\circ$, the work done is:",
    "options": [
      "Zero",
      "Maximum positive",
      "Maximum negative",
      "Half the maximum"
    ],
    "correct": 0,
    "explain": "W = F · d · $\\cos$($90^\\circ$). Since $\\cos$($90^\\circ$) = 0, work done is zero.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-3",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Medium",
    "q": "If the linear momentum of an object is doubled, by what factor does its kinetic energy increase?",
    "options": [
      "4 times",
      "2 times",
      "8 times",
      "$\\sqrt${2} times"
    ],
    "correct": 0,
    "explain": "KE = $p^{2}$ / (2m). If momentum p is doubled to 2p, KE' = $(2p)^{2}$ / (2m) = 4 [$p^{2}$ / (2m)] = 4 KE.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-4",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Medium",
    "q": "An electric pump lifts 100 kg of water to a vertical height of 20 m in 10 seconds. Assuming g = 9.8 m/$s^{2}$, what is the output power of the pump?",
    "options": [
      "1960 W (1.96 kW)",
      "980 W",
      "3920 W",
      "490 W"
    ],
    "correct": 0,
    "explain": "Work W = mgh = 100 × 9.8 × 20 = 19,600 J. Power P = W / t = 19,600 / 10 = 1960 W.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-5",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Hard",
    "q": "What is the escape velocity from the surface of the Earth with radius R = 6.4 × $10^{6}$ m and g = 9.8 m/$s^{2}$?",
    "options": [
      "11.2 km/s",
      "7.9 km/s",
      "9.8 km/s",
      "16.0 km/s"
    ],
    "correct": 0,
    "explain": "v_esc = $\\sqrt${2gR} = $\\sqrt${2 × 9.8 × 6.4 × $10^{6}$} = $\\sqrt${1.2544 × $10^{8}$} \\approx 11,200 m/s = 11.2 km/s.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-1",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Easy",
    "q": "What is the orbital time period of a geostationary satellite around Earth?",
    "options": [
      "24 hours (1 day)",
      "12 hours",
      "84 minutes",
      "365 days"
    ],
    "correct": 0,
    "explain": "A geostationary satellite has an orbital period equal to the rotation period of Earth (24 hours), remaining stationary above a fixed point on the equator.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-2",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Easy",
    "q": "What is the relationship between linear velocity v and angular velocity $\\omega$?",
    "options": [
      "v = r$\\omega$",
      "$\\omega$ = rv",
      "v = $r^{2}\\omega$",
      "v = $\\omega$ / r"
    ],
    "correct": 0,
    "explain": "For circular motion of radius r, linear speed v is related to angular speed $\\omega$ by v = r$\\omega$ (in vector form v = $\\omega$ × r).",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-3",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Medium",
    "q": "A car of mass 1000 kg rounds a curve of radius 50 m at a constant speed of 10 m/s. What is the required centripetal force?",
    "options": [
      "2000 N",
      "1000 N",
      "500 N",
      "4000 N"
    ],
    "correct": 0,
    "explain": "Fc = m $v^{2}$ / r = 1000 × $(10)^{2}$ / 50 = 1000 × 100 / 50 = 2000 N.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-4",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Medium",
    "q": "What is the moment of inertia of a uniform solid sphere of mass M and radius R about its diameter?",
    "options": [
      "(2/5) M $R^{2}$",
      "(1/2) M $R^{2}$",
      "(2/3) M $R^{2}$",
      "M $R^{2}$"
    ],
    "correct": 0,
    "explain": "For a uniform solid sphere, I = (2/5)$MR^{2}$. (For a thin spherical shell it is (2/3)$MR^{2}$; for a solid cylinder/disc it is (1/2)$MR^{2}$).",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-5",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Hard",
    "q": "A stone tied to a string of length L is whirled in a vertical circle. What is the minimum speed required at the highest point to prevent the string from slacking?",
    "options": [
      "$\\sqrt${gL}",
      "$\\sqrt${2gL}",
      "$\\sqrt${5gL}",
      "$\\sqrt${3gL}"
    ],
    "correct": 0,
    "explain": "At the highest point, tension T \\ge 0. When T = 0, gravity alone provides the centripetal force: mg = m $v^{2}$ / L \\implies v = $\\sqrt${gL}.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-1",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Easy",
    "q": "What does the Equation of Continuity (A1 v1 = A2 v2) express the conservation of?",
    "options": [
      "Mass",
      "Energy",
      "Momentum",
      "Volume"
    ],
    "correct": 0,
    "explain": "The equation of continuity for incompressible steady flow A1 v1 = A2 v2 is a direct consequence of the law of conservation of mass.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-2",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Easy",
    "q": "What is the SI unit of viscosity (coefficient of viscosity \\eta)?",
    "options": [
      "kg/(m·s) or Pa·s",
      "N/m",
      "kg·m/s",
      "Pa/s"
    ],
    "correct": 0,
    "explain": "From Stokes law F = 6\\pi\\eta r v: \\eta = F / (6\\pi r v) \\implies N / (m · m/s) = N·s/$m^{2}$ = Pa·s = kg/(m·s).",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-3",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Medium",
    "q": "Water flows through a horizontal pipe. If the diameter of the pipe is halved, what happens to the flow velocity?",
    "options": [
      "Increases by a factor of 4",
      "Doubles",
      "Decreases to one-fourth",
      "Increases by a factor of 16"
    ],
    "correct": 0,
    "explain": "Area A \\propto $d^{2}$. Halving diameter reduces area to A/4. By A1 v1 = A2 v2, v2 = (A1 / A2) v1 = 4 v1.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-4",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Medium",
    "q": "According to Bernoulli equation, where the speed of a flowing fluid is high, the pressure is:",
    "options": [
      "Low",
      "High",
      "Constant",
      "Zero"
    ],
    "correct": 0,
    "explain": "Bernoulli principle states P + (1/2)$\\rhov^{2} +  \\rho$ g h = constant. When speed v increases in a horizontal flow, static pressure P must decrease.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-5",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Hard",
    "q": "Two spherical raindrops of radii in the ratio 1 : 2 fall through air. What is the ratio of their terminal velocities (v1 : v2)?",
    "options": [
      "1 : 4",
      "1 : 2",
      "1 : 8",
      "1 : 16"
    ],
    "correct": 0,
    "explain": "Terminal velocity vt = (2 $r^{2}$ g ($\\rho -  \\sigma$)) / (9 \\eta) \\propto $r^{2}$. Therefore, v1 / v2 = $(r1 / r2)^{2} =  (1/2)^{2}$ = 1/4.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-1",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Easy",
    "q": "What is the time period T of a simple pendulum of length L in a gravitational field g?",
    "options": [
      "2\\pi $\\sqrt${L/g}",
      "2\\pi $\\sqrt${g/L}",
      "(1/2\\pi) $\\sqrt${L/g}",
      "2\\pi (L/g)"
    ],
    "correct": 0,
    "explain": "The formula for the small-amplitude period of a simple pendulum is T = 2\\pi $\\sqrt${L/g}.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-2",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Easy",
    "q": "In Simple Harmonic Motion (SHM), acceleration is directly proportional to displacement and directed:",
    "options": [
      "Towards the mean position",
      "Away from the mean position",
      "Perpendicular to displacement",
      "In the direction of motion"
    ],
    "correct": 0,
    "explain": "By definition of SHM, a = -$\\omega$^2 x. The negative sign denotes that acceleration is always directed towards the equilibrium (mean) position.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-3",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Medium",
    "q": "At what displacement from the mean position is the kinetic energy of an oscillator equal to its potential energy in SHM?",
    "options": [
      "x = x0 / $\\sqrt${2}",
      "x = x0 / 2",
      "x = x0 / 4",
      "x = x0 / $\\sqrt${3}"
    ],
    "correct": 0,
    "explain": "KE = (1/2)k($x0^{2} -  x^{2}$) and PE = (1/2)$kx^{2}$. Equating: $x0^{2} -  x^{2} = x^{2}$ \\implies $2x^{2} =  x0^{2}$ \\implies x = x0 / $\\sqrt${2}.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-4",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Medium",
    "q": "A mass-spring system has spring constant k = 200 N/m and mass m = 2 kg. What is its natural frequency of oscillation f?",
    "options": [
      "(5 / \\pi) Hz \\approx 1.59 Hz",
      "10 Hz",
      "(10 / \\pi) Hz",
      "100 Hz"
    ],
    "correct": 0,
    "explain": "$\\omega =  \\sqrt${k/m} = $\\sqrt${200/2} = 10 rad/s. Frequency f = $\\omega$ / (2\\pi) = 10 / (2\\pi) = 5 / \\pi Hz \\approx 1.59 Hz.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-5",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Hard",
    "q": "A seconds pendulum has a time period of exactly 2.0 seconds. What is its approximate length on the surface of Earth (g = 9.8 m/$s^{2}$)?",
    "options": [
      "0.993 m (approx 1 m)",
      "0.50 m",
      "2.0 m",
      "1.96 m"
    ],
    "correct": 0,
    "explain": "T = 2\\pi $\\sqrt${L/g} \\implies 2 = 2\\pi $\\sqrt${L/9.8} \\implies 1 = \\$pi^{2}$ (L/9.8) \\implies L = 9.8 / \\$pi^{2}$ \\approx 9.8 / 9.87 \\approx 0.993 m.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-1",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Easy",
    "q": "What was Laplace correction factor $\\gamma$ to Newton formula for the speed of sound in a gas?",
    "options": [
      "$\\sqrt${$\\gamma$ P / $\\rho$}",
      "$\\sqrt${P / ($\\gamma\\rho$)}",
      "$\\gamma\\sqrt${P / $\\rho$}",
      "$\\sqrt${P / $\\rho$}"
    ],
    "correct": 0,
    "explain": "Laplace corrected Newton assumption from isothermal to adiabatic: v = $\\sqrt${$\\gamma$ P / $\\rho$}, where $\\gamma$ = Cp/Cv.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-2",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Easy",
    "q": "The distance between two consecutive nodes in a stationary wave of wavelength $\\lambda$ is:",
    "options": [
      "$\\lambda$ / 2",
      "$\\lambda$",
      "$\\lambda$ / 4",
      "2$\\lambda$"
    ],
    "correct": 0,
    "explain": "In a standing wave, the distance between any two adjacent nodes (or two adjacent antinodes) is $\\lambda$ / 2.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-3",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Medium",
    "q": "Two tuning forks with frequencies 256 Hz and 260 Hz are sounded together. What is the number of beats heard per second?",
    "options": [
      "4 beats/s",
      "2 beats/s",
      "516 beats/s",
      "258 beats/s"
    ],
    "correct": 0,
    "explain": "Beat frequency fb = |f1 - f2| = $|256 - 260|$ = 4 Hz (4 beats per second).",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-4",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Medium",
    "q": "A source of sound producing frequency 600 Hz moves towards a stationary observer with speed v/10 (v = speed of sound). What is the observed frequency?",
    "options": [
      "667 Hz",
      "545 Hz",
      "660 Hz",
      "600 Hz"
    ],
    "correct": 0,
    "explain": "f' = f [v / (v - vs)] = 600 [v / (v - 0.1v)] = 600 / 0.9 = 666.7 \\approx 667 Hz.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-5",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Hard",
    "q": "By how much does the speed of sound in air increase for every 1°C rise in temperature?",
    "options": [
      "0.61 m/s",
      "0.33 m/s",
      "1.0 m/s",
      "3.3 m/s"
    ],
    "correct": 0,
    "explain": "v_t = v_0 + 0.61 t. Thus the speed of sound increases by 0.61 m/s for each degree Celsius rise in temperature.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-1",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Easy",
    "q": "In an isothermal expansion of an ideal gas, which quantity remains constant?",
    "options": [
      "Temperature (\\Delta T = 0, \\Delta U = 0)",
      "Pressure",
      "Volume",
      "Heat content (Q = 0)"
    ],
    "correct": 0,
    "explain": "In an isothermal process, temperature remains constant (T = const). For an ideal gas, internal energy depends solely on temperature, so \\Delta U = 0.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-2",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Easy",
    "q": "What is the First Law of Thermodynamics fundamentally an expression of?",
    "options": [
      "Conservation of Energy",
      "Conservation of Momentum",
      "Conservation of Mass",
      "Conservation of Charge"
    ],
    "correct": 0,
    "explain": "The First Law Q = \\Delta U + W expresses the principle of conservation of energy for thermodynamic systems.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-3",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Medium",
    "q": "What is the efficiency of a Carnot heat engine operating between a hot reservoir at 500 K and a cold reservoir at 300 K?",
    "options": [
      "40%",
      "60%",
      "66.7%",
      "20%"
    ],
    "correct": 0,
    "explain": "\\eta = 1 - (Tc / Th) = 1 - (300 / 500) = 1 - 0.6 = 0.4 = 40%.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-4",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Medium",
    "q": "For an ideal gas, the difference between molar heat capacities Cp - Cv is equal to:",
    "options": [
      "Universal gas constant R",
      "Zero",
      "Boltzmann constant k",
      "R / 2"
    ],
    "correct": 0,
    "explain": "Mayer relation states Cp - Cv = R for one mole of an ideal gas.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-5",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Hard",
    "q": "During an adiabatic expansion, an ideal gas performs 250 J of work. What is the change in its internal energy \\Delta U?",
    "options": [
      "-250 J",
      "+250 J",
      "0 J",
      "+500 J"
    ],
    "correct": 0,
    "explain": "In an adiabatic process, Q = 0. From the First Law Q = \\Delta U + W: 0 = \\Delta U + 250 J => \\Delta U = -250 J (internal energy decreases).",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-1",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Easy",
    "q": "What is the SI unit of electric flux \\Phi_E?",
    "options": [
      "N·$m^{2}$ / C (or V·m)",
      "N / C",
      "V / m",
      "C / $m^{2}$"
    ],
    "correct": 0,
    "explain": "\\Phi_E = E · A. Since E is in N/C and A is in $m^{2}$, unit is N·$m^{2}$/C = (V/m) · $m^{2}$ = V·m.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-2",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Easy",
    "q": "When a dielectric slab with relative permittivity \\epsilon_r = 4 is inserted between the plates of an isolated capacitor, its capacitance becomes:",
    "options": [
      "4 times the original capacitance",
      "1/4 of the original capacitance",
      "16 times",
      "Unchanged"
    ],
    "correct": 0,
    "explain": "C' = \\epsilon_r C0. With \\epsilon_r = 4, capacitance increases by a factor of 4.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-3",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Medium",
    "q": "What is the electric field intensity inside a hollow conducting sphere carrying a uniform charge Q on its surface?",
    "options": [
      "Zero",
      "kQ / $r^{2}$",
      "kQ / R",
      "Infinite"
    ],
    "correct": 0,
    "explain": "By Gauss law, a Gaussian surface inside the hollow sphere encloses zero net charge, so E = 0 everywhere inside the sphere.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-4",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Medium",
    "q": "Two equal charges of +2 $\\mu$ C are separated by 3 m in vacuum. What is the electrostatic repulsive force between them (k = 9 × $10^{9}$ N·$m^{2} / C^{2}$)?",
    "options": [
      "0.004 N (4 × $10^{-3}$ N)",
      "0.012 N",
      "0.006 N",
      "40 N"
    ],
    "correct": 0,
    "explain": "F = k q1 q2 / $r^{2}$ = (9 × $10^{9}$ × 2 × $10^{-6}$ × 2 × $10^{-6}$) / $(3)^{2}$ = 36 × $10^{-3}$ / 9 = 4 × $10^{-3}$ N = 0.004 N.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-5",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Hard",
    "q": "Three capacitors of capacitances 3 $\\mu$ F, 6 $\\mu$ F, and 2 $\\mu$ F are connected such that 3 $\\mu$ F and 6 $\\mu$ F are in series, and this combination is in parallel with the 2 $\\mu$ F capacitor. What is the equivalent capacitance?",
    "options": [
      "4 $\\mu$ F",
      "11 $\\mu$ F",
      "1 $\\mu$ F",
      "2 $\\mu$ F"
    ],
    "correct": 0,
    "explain": "Series combination: Cs = (3 × 6) / (3 + 6) = 18 / 9 = 2 $\\mu$ F. In parallel with 2 $\\mu$ F: Ceq = Cs + 2 = 2 + 2 = 4 $\\mu$ F.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-1",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Easy",
    "q": "Kirchhoff First Rule (junction rule) \\sum I = 0 is a manifestation of the conservation of:",
    "options": [
      "Charge",
      "Energy",
      "Momentum",
      "Mass"
    ],
    "correct": 0,
    "explain": "Kirchhoff Current Law states total current entering a node equals total current leaving, which conserves electric charge.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-2",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Easy",
    "q": "What is the SI unit of resistivity $\\rho$?",
    "options": [
      "Ohm-meter (\\Omega·m)",
      "Ohm per meter (\\$\\omega$/m)$",
      "Siemens (S)",
      "Ohm (\\Omega)"
    ],
    "correct": 0,
    "explain": "From R = $\\rho$ L / A: $\\rho$ = R A / L = (\\Omega · $m^{2}$) / m = \\Omega·m.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-3",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Medium",
    "q": "A uniform copper wire of resistance 16 \\Omega is cut into 4 equal parts, and all 4 parts are then connected in parallel. What is the equivalent resistance?",
    "options": [
      "1 \\Omega",
      "4 \\Omega",
      "0.25 \\Omega",
      "16 \\Omega"
    ],
    "correct": 0,
    "explain": "Each part has resistance R_each = 16 / 4 = 4 \\Omega. Connecting 4 identical resistors of 4 \\Omega in parallel gives R_eq = 4 / 4 = 1 \\Omega.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-4",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Medium",
    "q": "A cell of emf 12 V and internal resistance 2 \\Omega is connected to an external resistor of 4 \\Omega. What is the terminal potential difference across the cell?",
    "options": [
      "8 V",
      "12 V",
      "6 V",
      "4 V"
    ],
    "correct": 0,
    "explain": "Circuit current I = E / (R + r) = 12 / (4 + 2) = 2 A. Terminal voltage V = E - Ir = 12 - (2)(2) = 12 - 4 = 8 V (or V = I·R = 2 × 4 = 8 V).",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-5",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Hard",
    "q": "A balanced Wheatstone bridge has branch resistances P = 10 \\Omega, Q = 20 \\Omega, and R = 30 \\Omega. What is the value of the unknown resistance S?",
    "options": [
      "60 \\Omega",
      "15 \\Omega",
      "40 \\Omega",
      "50 \\Omega"
    ],
    "correct": 0,
    "explain": "For a balanced Wheatstone bridge: P / Q = R / S \\implies 10 / 20 = 30 / S \\implies 1/2 = 30 / S \\implies S = 60 \\Omega.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-1",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Easy",
    "q": "What is 1 Tesla (1 T) equal to in terms of fundamental SI units?",
    "options": [
      "1 N / (A·m)",
      "1 N·A / m",
      "1 J / (A·m)",
      "1 Wb·$m^{2}$"
    ],
    "correct": 0,
    "explain": "From F = I L B: B = F / (I L) \\implies 1 T = 1 N / (A·m) = 1 Wb / $m^{2}$.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-2",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Easy",
    "q": "The magnetic force on a charged particle moving parallel to a uniform magnetic field ($\\theta =  0^\\circ$) is:",
    "options": [
      "Zero",
      "Maximum",
      "Negative",
      "Infinite"
    ],
    "correct": 0,
    "explain": "F = q v B $\\sin$($\\theta$). Since $\\sin$($0^\\circ$) = 0, the magnetic deflecting force is zero.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-3",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Medium",
    "q": "What is the magnetic field B at the center of a long solenoid having n turns per unit length carrying current I?",
    "options": [
      "\\mu_0 n I",
      "\\mu_0 N I / L",
      "\\mu_0 I / (2\\pi r)",
      "2\\pi \\mu_0 n I"
    ],
    "correct": 0,
    "explain": "Applying Ampere circuital law to an ideal long solenoid gives B = \\mu_0 n I, where n = N/L.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-4",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Medium",
    "q": "An electron enters perpendicularly into a uniform magnetic field B with speed v. The radius of its circular orbit is given by:",
    "options": [
      "m v / (q B)",
      "q B / (m v)",
      "m B / (q v)",
      "q v / (m B)"
    ],
    "correct": 0,
    "explain": "Centripetal force is provided by magnetic force: m $v^{2}$ / r = q v B \\implies r = m v / (q B).",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-5",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Hard",
    "q": "Two long parallel wires carry currents of 4 A and 6 A in the same direction separated by a distance of 0.2 m. What is the force per unit length between them (\\mu_0 = 4\\pi × $10^{-7}$ T·m/A)?",
    "options": [
      "2.4 × $10^{-5}$ N/m (attractive)",
      "2.4 × $10^{-5}$ N/m (repulsive)",
      "1.2 × $10^{-5}$ N/m (attractive)",
      "4.8 × $10^{-5}$ N/m (repulsive)"
    ],
    "correct": 0,
    "explain": "F/L = (\\mu_0 I1 I2) / (2\\pi d) = (4\\pi × $10^{-7}$ × 4 × 6) / (2\\pi × 0.2) = (2 × $10^{-7}$ × 24) / 0.2 = 48 × $10^{-7}$ / 0.2 = 2.4 × $10^{-5}$ N/m. Currents in the same direction attract.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-1",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Easy",
    "q": "Lenz Law for the direction of induced emf is a direct consequence of the conservation of:",
    "options": [
      "Energy",
      "Charge",
      "Momentum",
      "Current"
    ],
    "correct": 0,
    "explain": "Lenz Law ensures that mechanical work done against the opposing induced magnetic field is converted into electrical energy, satisfying conservation of energy.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-2",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Easy",
    "q": "What is the SI unit of mutual and self-inductance?",
    "options": [
      "Henry (H)",
      "Weber (Wb)",
      "Tesla (T)",
      "Farad (F)"
    ],
    "correct": 0,
    "explain": "Inductance is measured in Henry (H), where 1 H = 1 V·s/A = 1 Wb/A.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-3",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Medium",
    "q": "A metal rod of length 0.5 m moves with speed 10 m/s perpendicular to a uniform magnetic field of 0.4 T. What motional emf is induced across the rod?",
    "options": [
      "2.0 V",
      "0.2 V",
      "5.0 V",
      "1.0 V"
    ],
    "correct": 0,
    "explain": "$\\epsilon$ = v B L $\\sin$($90^\\circ$) = 10 × 0.4 × 0.5 × 1 = 2.0 V.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-4",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Medium",
    "q": "An ideal step-down transformer converts 220 V to 11 V. If the primary winding has 1000 turns, how many turns are on the secondary winding?",
    "options": [
      "50 turns",
      "200 turns",
      "20,000 turns",
      "25 turns"
    ],
    "correct": 0,
    "explain": "Ns / Np = Vs / Vp \\implies Ns = Np × (Vs / Vp) = 1000 × (11 / 220) = 1000 × (1/20) = 50 turns.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-5",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Hard",
    "q": "A magnetic flux through a coil changes from 12 Wb to 2 Wb in 0.2 seconds. What is the magnitude of average emf induced in the coil (N = 1)?",
    "options": [
      "50 V",
      "20 V",
      "100 V",
      "2.5 V"
    ],
    "correct": 0,
    "explain": "|$\\epsilon$| = N |\\Delta \\Phi| / \\Delta t = 1 × $|2 - 12|$ / 0.2 = 10 / 0.2 = 50 V.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-1",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Easy",
    "q": "What is the relationship between RMS voltage V_rms and peak voltage V_0 for a sinusoidal AC voltage?",
    "options": [
      "V_rms = V_0 / $\\sqrt${2} \\approx 0.707 V_0",
      "V_rms = $\\sqrt${2} V_0",
      "V_rms = V_0 / 2",
      "V_rms = 2 V_0 / \\pi"
    ],
    "correct": 0,
    "explain": "The root-mean-square value of a sinusoidal wave is V_rms = V_0 / $\\sqrt${2} \\approx 0.707 V_0.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-2",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Easy",
    "q": "In a purely inductive AC circuit, the voltage:",
    "options": [
      "Leads the current by $90^\\circ$ (\\pi/2)",
      "Lags the current by $90^\\circ$ (\\pi/2)",
      "Is in phase with current",
      "Leads the current by $180^\\circ$"
    ],
    "correct": 0,
    "explain": "In a pure inductor, induced back-emf opposes current rise, so voltage leads current by $90^\\circ$ (\\pi/2 rad).",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-3",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Medium",
    "q": "What is the resonance frequency f_r of a series RLC circuit with L = 0.1 H and C = 10 $\\mu$ F?",
    "options": [
      "(500 / \\pi) Hz \\approx 159 Hz",
      "1000 Hz",
      "(1000 / \\pi) Hz",
      "50 Hz"
    ],
    "correct": 0,
    "explain": "\\omega_r = 1 / $\\sqrt${LC} = 1 / $\\sqrt${0.1 × 10 × $10^{-6}$} = 1 / $\\sqrt${$10^{-6}$} = 1000 rad/s. f_r = \\omega_r / (2\\pi) = 1000 / (2\\pi) = 500 / \\pi Hz \\approx 159 Hz.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-4",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Medium",
    "q": "What is the capacitive reactance X_C of a capacitor of capacitance C in a circuit of frequency f?",
    "options": [
      "1 / (2\\pi f C)",
      "2\\pi f C",
      "2\\pi f / C",
      "C / (2\\pi f)"
    ],
    "correct": 0,
    "explain": "Capacitive reactance is inversely proportional to frequency and capacitance: X_C = 1 / ($\\omega$ C) = 1 / (2\\pi f C).",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-5",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "A series RLC circuit has R = 30 \\Omega, inductive reactance X_L = 80 \\Omega, and capacitive reactance X_C = 40 \\Omega. What is the total impedance Z of the circuit?",
    "options": [
      "50 \\Omega",
      "70 \\Omega",
      "150 \\Omega",
      "30 \\Omega"
    ],
    "correct": 0,
    "explain": "Z = $\\sqrt${$R^{2}$ + (X_L - X_C)^2} = $\\sqrt${$30^{2} +  (80 - 40)^{2}$} = $\\sqrt${$30^{2} +  40^{2}$} = $\\sqrt${900 + 1600} = $\\sqrt${2500} = 50 \\Omega.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-1",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Easy",
    "q": "In free space, all electromagnetic waves travel with a speed of:",
    "options": [
      "3.0 × $10^{8}$ m/s",
      "3.0 × $10^{6}$ m/s",
      "340 m/s",
      "Infinite speed"
    ],
    "correct": 0,
    "explain": "c = 1 / $\\sqrt${\\mu_0 \\epsilon_0} \\approx 3.0 × $10^{8}$ m/s in vacuum regardless of frequency.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-2",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Easy",
    "q": "Which type of electromagnetic radiation has the shortest wavelength and highest photon energy?",
    "options": [
      "Gamma rays",
      "X-rays",
      "Ultraviolet",
      "Radio waves"
    ],
    "correct": 0,
    "explain": "Gamma rays occupy the highest frequency (shortest wavelength, $\\lambda < 10^{-11}$ m) portion of the electromagnetic spectrum.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-3",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Medium",
    "q": "What is the phase difference between electric field E and magnetic field B vectors in a propagating electromagnetic wave in free space?",
    "options": [
      "$0^\\circ$ (They oscillate in phase)",
      "$90^\\circ$",
      "$180^\\circ$",
      "$45^\\circ$"
    ],
    "correct": 0,
    "explain": "Although E and B oscillate in mutually perpendicular spatial planes, their sinusoidal oscillations are in phase (reaching peaks and zeros simultaneously).",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-4",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Medium",
    "q": "What is the wavelength of an FM radio wave transmitted at 100 MHz in vacuum?",
    "options": [
      "3.0 m",
      "30 m",
      "0.33 m",
      "300 m"
    ],
    "correct": 0,
    "explain": "$\\lambda$ = c / f = (3.0 × $10^{8}$ m/s) / (100 × $10^{6}s^{-1}$) = 3.0 m.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-5",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Hard",
    "q": "The Poynting vector S represents the directional energy flux density of an EM wave and is defined as:",
    "options": [
      "S = (1 / \\mu_0) (E × B)",
      "S = \\mu_0 (E × B)",
      "S = E · B",
      "S = \\epsilon_0 (E × B)"
    ],
    "correct": 0,
    "explain": "The Poynting vector S = (1/\\mu_0)(E × B) gives the rate of energy transfer per unit area (W/$m^{2}$) in the direction of wave propagation.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-1",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Easy",
    "q": "What is the SI unit of Young Modulus of elasticity?",
    "options": [
      "Pascal (Pa) or N/$m^{2}$",
      "Newton (N)",
      "Joule (J)",
      "Dimensionless"
    ],
    "correct": 0,
    "explain": "Young modulus Y = Tensile Stress / Tensile Strain. Since strain is dimensionless, Y has the units of stress (N/$m^{2}$ or Pa).",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-2",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Easy",
    "q": "Substances like glass and plastics which do not have a regular periodic atomic arrangement are called:",
    "options": [
      "Amorphous solids",
      "Crystalline solids",
      "Polycrystalline solids",
      "Superconductors"
    ],
    "correct": 0,
    "explain": "Amorphous (glassy) solids lack long-range periodic lattice order, unlike crystalline solids.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-3",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Medium",
    "q": "According to Energy Band Theory, in an electrical insulator the forbidden energy gap between valence band and conduction band is typically:",
    "options": [
      "Very wide (> 3 to 6 eV)",
      "Zero (bands overlap)",
      "Very narrow (< 1 eV)",
      "Negative"
    ],
    "correct": 0,
    "explain": "Insulators have a completely filled valence band, an empty conduction band, and a wide forbidden energy gap (Eg > 3 to 6 eV) preventing thermal excitation of electrons.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-4",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Medium",
    "q": "A wire of length L and cross-sectional area A is stretched by force F to produce elongation \\Delta L. The strain energy stored per unit volume is:",
    "options": [
      "(1/2) × Stress × Strain",
      "Stress × Strain",
      "(1/2) × Stress / Strain",
      "$Stress^{2}$ × Strain"
    ],
    "correct": 0,
    "explain": "Strain energy per unit volume = (1/2) × stress × strain = (1/2) Y $(strain)^{2}$.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-5",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Hard",
    "q": "The critical temperature Tc below which mercury completely loses its electrical resistance (superconductivity) is:",
    "options": [
      "4.2 K",
      "77 K",
      "0 K",
      "273 K"
    ],
    "correct": 0,
    "explain": "Heike Kamerlingh Onnes discovered superconductivity in mercury at 4.2 K in 1911.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-1",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Easy",
    "q": "How many diodes are required to construct a full-wave bridge rectifier?",
    "options": [
      "4",
      "2",
      "1",
      "6"
    ],
    "correct": 0,
    "explain": "A bridge rectifier uses 4 diodes arranged in a closed ring bridge configuration to rectify both halves of the AC cycle without requiring a center-tapped transformer.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-2",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Easy",
    "q": "In an n-type semiconductor, the majority charge carriers are:",
    "options": [
      "Free electrons",
      "Holes",
      "Positive ions",
      "Neutrons"
    ],
    "correct": 0,
    "explain": "Doping pure silicon or germanium with pentavalent donor atoms (e.g., Phosphorus) provides excess free electrons as majority carriers.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-3",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Medium",
    "q": "What is the voltage gain of an inverting Operational Amplifier (Op-Amp) circuit with input resistor R1 and feedback resistor Rf?",
    "options": [
      "-Rf / R1",
      "1 + (Rf / R1)",
      "-R1 / Rf",
      "Rf / (R1 + Rf)"
    ],
    "correct": 0,
    "explain": "For an inverting op-amp configuration, the closed-loop voltage gain is G = -Rf / R1.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-4",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Medium",
    "q": "For a bipolar junction transistor (BJT), what is the relationship between collector current Ic, base current Ib, and emitter current Ie?",
    "options": [
      "Ie = Ib + Ic",
      "Ic = Ib + Ie",
      "Ib = Ic + Ie",
      "Ie = Ic - Ib"
    ],
    "correct": 0,
    "explain": "By Kirchhoff Current Law at the transistor terminals: Ie = Ib + Ic. Because Ib is typically very small (< 5%), Ie \\approx Ic.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-5",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Hard",
    "q": "What is the ideal input impedance and open-loop voltage gain of a standard operational amplifier?",
    "options": [
      "Input impedance = \\infty, Open-loop gain = \\infty",
      "Input impedance = 0, Open-loop gain = 1",
      "Input impedance = 50 \\Omega, Open-loop gain = 1000",
      "Input impedance = \\infty, Open-loop gain = 0"
    ],
    "correct": 0,
    "explain": "An ideal Op-Amp possesses infinite input impedance (Rin = \\infty, drawing zero input current) and infinite open-loop gain (A_OL = \\infty).",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-1",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Easy",
    "q": "In the photoelectric effect, the maximum kinetic energy of emitted photoelectrons depends on the:",
    "options": [
      "Frequency of incident light",
      "Intensity of incident light",
      "Time of exposure",
      "Distance of source"
    ],
    "correct": 0,
    "explain": "Einstein photoelectric equation KE_max = hf - \\Phi shows that electron energy depends solely on the frequency f of incident photons, while intensity determines the rate of emission.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-2",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Easy",
    "q": "What is the de Broglie wavelength $\\lambda$ of a particle with linear momentum p?",
    "options": [
      "h / p",
      "p / h",
      "h · p",
      "h / $\\sqrt${p}"
    ],
    "correct": 0,
    "explain": "Louis de Broglie proposed the matter-wave relation $\\lambda$ = h / p = h / (mv).",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-3",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Medium",
    "q": "What is the Compton wavelength of an electron (\\lambda_c = h / (m_0 c))?",
    "options": [
      "2.43 × $10^{-12}$ m (0.0243 Å)",
      "1.05 × $10^{-10}$ m",
      "5.29 × $10^{-11}$ m",
      "6.63 × $10^{-34}$ m"
    ],
    "correct": 0,
    "explain": "\\lambda_c = h / (m_0 c) = 6.63 × $10^{-34}$ / (9.11 × $10^{-31}$ × 3.0 × $10^{8}$) \\approx 2.426 × $10^{-12}$ m = 0.0243 Å.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-4",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Medium",
    "q": "What is the minimum photon energy required to produce an electron-positron pair in pair production?",
    "options": [
      "1.02 MeV",
      "0.51 MeV",
      "2.04 MeV",
      "13.6 eV"
    ],
    "correct": 0,
    "explain": "Rest energy of an electron or positron is m0 $c^{2}$ = 0.511 MeV. For pair production, the minimum photon energy is 2 m0 $c^{2}$ = 2 × 0.511 = 1.022 MeV.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-5",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "According to Special Relativity, if a spaceship travels at speed v = 0.8 c relative to an observer, by what factor is its length contracted in the direction of motion?",
    "options": [
      "0.6 (or 60%)",
      "0.8",
      "0.64",
      "0.5"
    ],
    "correct": 0,
    "explain": "Lorentz factor $\\gamma$ = 1 / $\\sqrt${1 - $(v/c)^{2}$} = 1 / $\\sqrt${1 - 0.64} = 1 / $\\sqrt${0.36} = 1 / 0.6. Length L = L0 / $\\gamma$ = 0.6 L0.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-1",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Easy",
    "q": "Which spectral series of the hydrogen atom lies entirely within the visible light region?",
    "options": [
      "Balmer series",
      "Lyman series",
      "Paschen series",
      "Brackett series"
    ],
    "correct": 0,
    "explain": "Transitions ending at principal quantum number n = 2 form the Balmer series, which lies in the visible spectrum. (Lyman lies in UV; Paschen, Brackett, and Pfund in IR).",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-2",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Easy",
    "q": "What is the ionization energy of the hydrogen atom from its ground state (n = 1)?",
    "options": [
      "13.6 eV",
      "3.4 eV",
      "1.51 eV",
      "10.2 eV"
    ],
    "correct": 0,
    "explain": "Ground state energy E1 = -13.6 eV. To ionize the atom (reach n = \\infty, E = 0), energy required is 0 - (-13.6) = +13.6 eV.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-3",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Medium",
    "q": "According to Bohr model, the orbital angular momentum L of an electron in an orbit is quantized as:",
    "options": [
      "n h / (2\\pi)",
      "n h / \\pi",
      "2\\pi / (n h)",
      "$n^{2}$ h / (2\\pi)"
    ],
    "correct": 0,
    "explain": "Bohr quantization condition states m v r = n \\hbar = n h / (2\\pi), where n = 1, 2, 3, ...",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-4",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Medium",
    "q": "What is the radius of the first Bohr orbit (n = 1) of the hydrogen atom?",
    "options": [
      "0.053 nm (0.53 Å)",
      "0.106 nm",
      "0.53 nm",
      "1.0 Å"
    ],
    "correct": 0,
    "explain": "r1 = $h^{2}$ \\epsilon_0 / (\\pi m $e^{2}$) \\approx 0.529 × $10^{-10}$ m = 0.053 nm = 0.53 Å.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-5",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Hard",
    "q": "What is the wavelength of radiation emitted when an electron in a hydrogen atom transitions from n = 3 to n = 2 (Balmer H-$\\alpha$ line, R_H = 1.097 × $10^{7}m^{-1}$)?",
    "options": [
      "656 nm",
      "486 nm",
      "434 nm",
      "121 nm"
    ],
    "correct": 0,
    "explain": "1/$\\lambda$ = R_H (1/$2^{2}$ - 1/$3^{2}$) = R_H (1/4 - 1/9) = R_H (5/36). $\\lambda$ = 36 / (5 × 1.097 × $10^{7}$) \\approx 6.56 × $10^{-7}$ m = 656 nm (red line).",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-1",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Easy",
    "q": "What does an alpha particle ($\\alpha$) consist of?",
    "options": [
      "2 protons and 2 neutrons (Helium-4 nucleus)",
      "1 proton and 1 neutron",
      "4 protons",
      "2 electrons and 2 protons"
    ],
    "correct": 0,
    "explain": "An alpha particle is a doubly ionized Helium nucleus (_2^$4He^{2+}$) consisting of 2 protons and 2 neutrons.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-2",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Easy",
    "q": "What is the relationship between the half-life $T_{1/2}$ and decay constant $\\lambda$ of a radioactive substance?",
    "options": [
      "$T_{1/2}$ = 0.693 / $\\lambda$",
      "$T_{1/2} =  \\lambda$ / 0.693",
      "$T_{1/2}$ = 0.693 · $\\lambda$",
      "$T_{1/2}$ = 1 / $\\lambda$"
    ],
    "correct": 0,
    "explain": "$T_{1/2} =  \\ln$(2) / $\\lambda$ \\approx 0.693 / $\\lambda$.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-3",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Medium",
    "q": "A radioactive sample has a half-life of 10 days. What fraction of the original active nuclei remains undecayed after 30 days?",
    "options": [
      "1/8 (12.5%)",
      "1/4 (25%)",
      "1/16 (6.25%)",
      "1/6 (16.7%)"
    ],
    "correct": 0,
    "explain": "Number of half-lives n = t / $T_{1/2}$ = 30 / 10 = 3. Remaining fraction = $(1/2)^{n} =  (1/2)^{3}$ = 1/8 = 12.5%.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-4",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Medium",
    "q": "How much energy is released when 1 unified atomic mass unit (1 u) is completely converted into energy (c = 3 × $10^{8}$ m/s)?",
    "options": [
      "931.5 MeV",
      "0.511 MeV",
      "13.6 MeV",
      "1.02 MeV"
    ],
    "correct": 0,
    "explain": "E = m $c^{2}$. 1 u = 1.6605 × $10^{-27}$ kg. E = (1.6605 × $10^{-27}$)(3 × $10^{8}$)^2 J / (1.602 × $10^{-13}$ J/MeV) \\approx 931.5 MeV.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-5",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Hard",
    "q": "In the nuclear fission of Uranium-235 triggered by a thermal neutron, what is the approximate average energy released per fission event?",
    "options": [
      "200 MeV",
      "20 MeV",
      "1000 MeV",
      "8 MeV"
    ],
    "correct": 0,
    "explain": "Each Uranium-235 fission event releases approximately 200 MeV of energy, primarily in the form of kinetic energy of the fission fragments.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-6",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Easy",
    "q": "Which of the following is an SI base unit?",
    "options": [
      "Kelvin",
      "Joule",
      "Newton",
      "Coulomb"
    ],
    "correct": 0,
    "explain": "The seven SI base units are meter, kilogram, second, ampere, kelvin, mole, and candela. Joule, Newton, and Coulomb are derived units.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-7",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Easy",
    "q": "A solid angle subtended at the center of a sphere by an area of its surface equal to the square of its radius is called:",
    "options": [
      "1 steradian",
      "1 radian",
      "1 degree",
      "1 revolution"
    ],
    "correct": 0,
    "explain": "One steradian (sr) is the supplementary SI unit of solid angle subtended at the center of a sphere of radius r by a surface area of $r^{2}$.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-8",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Medium",
    "q": "What are the dimensions of Planck's constant h?",
    "options": [
      "[M $L^{2}$T^{-1}]",
      "[M L T^{-1}]",
      "[M $L^{2}$T^{-2}]",
      "[M L^{-1} T^{-2}]"
    ],
    "correct": 0,
    "explain": "E = h*nu \\implies h = E / nu = [M $L^{2}$T^{-2}] / [T^{-1}] = [M $L^{2}$T^{-1}]. These are the same dimensions as angular momentum.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-9",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Hard",
    "q": "If density is calculated from mass m and length L of a cube as rho = m / $L^{3}$, where uncertainty in m is 1.5% and in L is 1%, what is the percentage uncertainty in density?",
    "options": [
      "4.5%",
      "2.5%",
      "3.0%",
      "5.5%"
    ],
    "correct": 0,
    "explain": "% uncertainty in rho = (% uncertainty in m) + 3 * (% uncertainty in L) = 1.5% + 3(1.0%) = 4.5%.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-10",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Hard",
    "q": "Which pair of physical quantities possesses identical dimensional formulas?",
    "options": [
      "Work and Torque",
      "Impulse and Force",
      "Stress and Strain",
      "Power and Energy"
    ],
    "correct": 0,
    "explain": "Work = Force * distance = [M $L^{2}$T^{-2}]. Torque = Force * lever arm = [M $L^{2}$T^{-2}]. Both have identical dimensions.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-6",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Easy",
    "q": "A body is said to be in complete mechanical equilibrium when which conditions are fulfilled?",
    "options": [
      "Both net external force and net external torque are zero",
      "Only net external force is zero",
      "Only net external torque is zero",
      "Body is completely at rest with zero velocity"
    ],
    "correct": 0,
    "explain": "Complete mechanical equilibrium requires translational equilibrium (Sigma F = 0) and rotational equilibrium (Sigma tau = 0).",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-7",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Medium",
    "q": "Two forces of magnitudes 10 N and 10 N act at an angle of $120^\\circ$ to each other. What is the magnitude of their resultant force?",
    "options": [
      "10 N",
      "20 N",
      "10*$\\sqrt{3}$ N",
      "0 N"
    ],
    "correct": 0,
    "explain": "R = sqrt($F1^{2} +  F2^{2}$ + 2*F1*F2*cos($120^\\circ$)) = sqrt(100 + 100 + 2(100)(-0.5)) = $\\sqrt{200 - 100} =  \\sqrt{100}$ = 10 N.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-8",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Medium",
    "q": "What is the torque produced by a force F = 3i + 2j - k acting at a point whose position vector is r = i - j + 2k about the origin?",
    "options": [
      "-3i + 7j + 5k",
      "3i - 7j - 5k",
      "-3i - 7j + 5k",
      "i + 3j - 4k"
    ],
    "correct": 0,
    "explain": "tau = r x F = det([[i, j, k], [1, -1, 2], [3, 2, -1]]) = i(1 - 4) - j(-1 - 6) + k(2 - (-3)) = -3i + 7j + 5k.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-9",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Hard",
    "q": "A couple consists of two forces that are:",
    "options": [
      "Equal in magnitude, opposite in direction, with non-coincident lines of action",
      "Equal in magnitude and acting along the same line in opposite directions",
      "Unequal in magnitude acting in opposite directions",
      "Perpendicular to each other producing zero torque"
    ],
    "correct": 0,
    "explain": "A couple is formed by two equal and opposite parallel forces whose lines of action do not coincide, producing pure rotation with net force zero.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-10",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Hard",
    "q": "Lami's Theorem for three coplanar forces in equilibrium P, Q, and R opposite to angles alpha, beta, and gamma states:",
    "options": [
      "P/sin(alpha) = Q/sin(beta) = R/sin(gamma)",
      "P/cos(alpha) = Q/cos(beta) = R/cos(gamma)",
      "P*sin(alpha) = Q*sin(beta) = R*sin(gamma)",
      "P + Q + R = sin(alpha) + sin(beta) + sin(gamma)"
    ],
    "correct": 0,
    "explain": "Lami's theorem states that for three concurrent forces in equilibrium, each force magnitude is proportional to the sine of the angle between the other two forces.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-6",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Easy",
    "q": "What does the slope of a velocity-time (v-t) graph represent at any given instant?",
    "options": [
      "Instantaneous acceleration",
      "Total displacement",
      "Instantaneous momentum",
      "Instantaneous speed"
    ],
    "correct": 0,
    "explain": "The derivative of velocity with respect to time, a = dv/dt, corresponds geometrically to the slope of the v-t graph.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-7",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Medium",
    "q": "In an elastic collision between two bodies in an isolated system, which quantities are conserved?",
    "options": [
      "Both total linear momentum and total kinetic energy",
      "Total linear momentum only",
      "Total kinetic energy only",
      "Neither momentum nor kinetic energy"
    ],
    "correct": 0,
    "explain": "By definition, an elastic collision conserves both the total linear momentum and the total kinetic energy of the system.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-8",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Hard",
    "q": "A projectile is launched with speed v0 at angle theta to the horizontal. What is its maximum vertical height H?",
    "options": [
      "($v0^{2} *  sin^{2}$(theta)) / (2g)",
      "($v0^{2}$ * sin(2*theta)) / g",
      "(v0 * sin(theta)) / g",
      "($v0^{2} *  cos^{2}$(theta)) / (2g)"
    ],
    "correct": 0,
    "explain": "At peak height vy = 0. Using $vy^{2}$ = (v0*sin(theta))^2 - 2gH \\implies H = ($v0^{2} *  sin^{2}$(theta)) / (2g).",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-9",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Hard",
    "q": "A rocket of initial mass M ejects fuel gases at a constant relative exhaust velocity v_rel at a burn rate -dM/dt. What is the instantaneous rocket thrust force?",
    "options": [
      "-v_rel * (dM/dt)",
      "M * v_rel",
      "(1/2) * (dM/dt) * v_rel^2",
      "-M * (dv/dt)"
    ],
    "correct": 0,
    "explain": "Thrust force on a variable mass system is given by F = -v_rel * (dM/dt), where -dM/dt is the mass consumption rate.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-10",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Hard",
    "q": "An elevator of total mass 1000 kg accelerates downwards at 2 m/$s^{2}$. Taking g = 9.8 m/$s^{2}$, what is the tension in the supporting cable?",
    "options": [
      "7800 N",
      "9800 N",
      "11800 N",
      "2000 N"
    ],
    "correct": 0,
    "explain": "For downward acceleration: mg - T = ma \\implies T = m(g - a) = 1000 * (9.8 - 2.0) = 1000 * 7.8 = 7800 N.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-6",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Easy",
    "q": "What is the work done by the centripetal force on an object moving along a circular path of radius R?",
    "options": [
      "Zero",
      "F_c * 2*pi*R",
      "(1/2) * m * $v^{2}$",
      "F_c * R"
    ],
    "correct": 0,
    "explain": "Centripetal force is always perpendicular to the instantaneous displacement vector ($\\theta =  90^\\circ$), so W = F * d * cos($90^\\circ$) = 0.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-7",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Medium",
    "q": "What is the absolute gravitational potential energy of a body of mass m located on Earth's surface (radius R, Earth mass M)?",
    "options": [
      "-G*M*m / R",
      "G*M*m / R",
      "-G*M*m / $R^{2}$",
      "m*g*R"
    ],
    "correct": 0,
    "explain": "Taking reference point U = 0 at infinity, gravitational potential energy on the surface is U = -G*M*m / R.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-8",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Medium",
    "q": "An electric motor with 80% efficiency delivers 4 kW of useful mechanical output power. What is its input electrical power?",
    "options": [
      "5 kW",
      "3.2 kW",
      "4.8 kW",
      "6 kW"
    ],
    "correct": 0,
    "explain": "Efficiency = Output / Input \\implies Input = Output / Efficiency = 4 kW / 0.80 = 5 kW.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-9",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Hard",
    "q": "If the kinetic energy of a moving particle increases by 300%, by what percentage does its linear momentum increase?",
    "options": [
      "100%",
      "300%",
      "200%",
      "50%"
    ],
    "correct": 0,
    "explain": "p = $\\sqrt{2m*KE}$. If KE increases by 300%, new KE' = 4*KE. New p' = $\\sqrt{4}$*p = 2p. Percentage increase in momentum = (2p - p)/p * 100% = 100%.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-10",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Hard",
    "q": "What is the relationship between power P, force F, and constant velocity v when force is applied in the direction of motion?",
    "options": [
      "P = F · v",
      "P = F / v",
      "P = F · $v^{2}$",
      "P = (1/2) F · v"
    ],
    "correct": 0,
    "explain": "P = dW/dt = F · (dr/dt) = F · v.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-6",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Easy",
    "q": "How many radians are contained in one complete revolution?",
    "options": [
      "2*pi radians",
      "pi radians",
      "pi/2 radians",
      "4*pi radians"
    ],
    "correct": 0,
    "explain": "One full circle ($360^\\circ$) corresponds to 2*pi radians.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-7",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Medium",
    "q": "What is the relationship between angular acceleration alpha and tangential acceleration a_t of a rotating body of radius r?",
    "options": [
      "a_t = r * alpha",
      "$\\alpha$ = r * a_t",
      "a_t = r * $alpha^{2}$",
      "a_t = $r^{2}$ * alpha"
    ],
    "correct": 0,
    "explain": "Tangential acceleration a_t is directly related to angular acceleration by a_t = r * alpha.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-8",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Hard",
    "q": "A solid cylinder (mass M, radius R) and a thin hollow hoop of identical mass and radius roll down the same inclined plane without slipping. Which reaches the bottom first?",
    "options": [
      "The solid cylinder",
      "The thin hollow hoop",
      "Both reach at exactly the same time",
      "Depends on the mass M of the objects"
    ],
    "correct": 0,
    "explain": "Solid cylinder has I = (1/2)$MR^{2}$, hoop has I = $MR^{2}$. Smaller moment of inertia means greater linear acceleration a = g*sin(theta) / (1 + I/($MR^{2}$)). Hence cylinder reaches first.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-9",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Hard",
    "q": "What is the rotational kinetic energy of a body having moment of inertia I spinning with angular velocity omega?",
    "options": [
      "(1/2) * I * $omega^{2}$",
      "I * omega",
      "(1/2) * $I^{2}$ * omega",
      "I * $omega^{2}$"
    ],
    "correct": 0,
    "explain": "Rotational kinetic energy is KE_rot = (1/2) * I * $omega^{2}$, analogous to translational KE = (1/2) * m * $v^{2}$.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-10",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Hard",
    "q": "If a spinning ice skater pulls her arms inward, her moment of inertia decreases by half. What happens to her angular velocity?",
    "options": [
      "Doubles",
      "Halves",
      "Quadruples",
      "Remains unchanged"
    ],
    "correct": 0,
    "explain": "By conservation of angular momentum L = I * omega. If I decreases to I/2, omega must double so that L remains constant.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-6",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Easy",
    "q": "A fluid whose density remains constant under changing pressure is classified as:",
    "options": [
      "Incompressible fluid",
      "Non-viscous fluid",
      "Compressible fluid",
      "Turbulent fluid"
    ],
    "correct": 0,
    "explain": "An incompressible fluid has a constant density rho regardless of the pressure applied.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-7",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Easy",
    "q": "Stokes' Law states that the viscous drag force F_d on a spherical particle of radius r moving at speed v in a fluid of viscosity eta is:",
    "options": [
      "6 * pi * eta * r * v",
      "4 * pi * eta * r * v",
      "6 * pi * eta * $r^{2}$ * v",
      "(1/2) * C_d * rho * A * $v^{2}$"
    ],
    "correct": 0,
    "explain": "Stokes' Law for viscous drag on a sphere in laminar flow is F_d = 6*pi*eta*r*v.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-8",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Medium",
    "q": "According to Torricelli's theorem, the speed of efflux v of water discharging from a small orifice at depth h below the open surface is:",
    "options": [
      "$\\sqrt{2 * g * h}$",
      "2 * g * h",
      "$\\sqrt{g * h}$",
      "(1/2) * g * h"
    ],
    "correct": 0,
    "explain": "Torricelli's theorem shows efflux speed v = $\\sqrt{2gh}$, identical to the speed acquired by an object falling freely from height h.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-9",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Hard",
    "q": "What is the physical principle underlying the dynamic lift generated on an airplane wing (aerofoil)?",
    "options": [
      "Bernoulli's principle",
      "Archimedes' principle",
      "Pascal's law",
      "Newton's law of cooling"
    ],
    "correct": 0,
    "explain": "Air travels faster over the curved upper surface of an aerofoil, creating lower pressure above than below according to Bernoulli's principle, generating net upward lift.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-10",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Hard",
    "q": "How does the terminal velocity v_t of a dense sphere falling through a viscous fluid scale with its radius r?",
    "options": [
      "v_t is directly proportional to $r^{2}$",
      "v_t is directly proportional to r",
      "v_t is inversely proportional to r",
      "v_t is independent of r"
    ],
    "correct": 0,
    "explain": "Equating weight (proportional to $r^{3}$) to Stokes drag (proportional to r*v_t): $r^{3}$ ~ r*v_t \\implies v_t ~ $r^{2}$.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-6",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Easy",
    "q": "What is the relationship between frequency f and time period T of an oscillating system?",
    "options": [
      "f = 1 / T",
      "f = T",
      "f = 2*pi*T",
      "f = $\\sqrt{T}$"
    ],
    "correct": 0,
    "explain": "Frequency is the reciprocal of the period: f = 1 / T.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-7",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Medium",
    "q": "What is the total mechanical energy of an oscillating mass-spring system having spring constant k and amplitude x0?",
    "options": [
      "(1/2) * k * $x0^{2}$",
      "k * $x0^{2}$",
      "(1/2) * m * $x0^{2}$",
      "(1/4) * k * $x0^{2}$"
    ],
    "correct": 0,
    "explain": "Total mechanical energy in simple harmonic motion is conserved and equals E = (1/2) * k * $x0^{2}$.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-8",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Medium",
    "q": "When a simple pendulum is taken from Earth's surface to the Moon (where g_moon = g_earth / 6), its time period will:",
    "options": [
      "Increase by a factor of $\\sqrt{6}$",
      "Decrease by a factor of 6",
      "Increase by a factor of 6",
      "Remain unchanged"
    ],
    "correct": 0,
    "explain": "T = 2*pi*$\\sqrt{L/g}$. If g decreases to g/6, T increases by $\\sqrt{6}$.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-9",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Hard",
    "q": "What is the phase difference between displacement and acceleration in Simple Harmonic Motion (SHM)?",
    "options": [
      "pi radians ($180^\\circ$)",
      "pi/2 radians ($90^\\circ$)",
      "Zero radians",
      "2*pi radians ($360^\\circ$)"
    ],
    "correct": 0,
    "explain": "In SHM, a = -$omega^{2}$ * x. The negative sign represents a phase shift of pi radians ($180^\\circ$).",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-10",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Hard",
    "q": "Sharp resonance in a driven harmonic oscillator occurs when the damping force is:",
    "options": [
      "Extremely small or zero",
      "Very large (heavily damped)",
      "Equal to spring constant",
      "Critical"
    ],
    "correct": 0,
    "explain": "With smaller damping, the resonance response peak becomes significantly taller and narrower (sharp resonance).",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-6",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Easy",
    "q": "Sound waves traveling through air are classified as which type of wave?",
    "options": [
      "Longitudinal mechanical waves",
      "Transverse electromagnetic waves",
      "Transverse mechanical waves",
      "Torsional waves"
    ],
    "correct": 0,
    "explain": "Sound waves in air propagate through alternating compressions and rarefactions parallel to the wave motion, which defines longitudinal waves.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-7",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Easy",
    "q": "What is the fundamental wave equation relating speed v, frequency f, and wavelength lambda?",
    "options": [
      "v = f * lambda",
      "v = f / lambda",
      "v = lambda / f",
      "v = $f^{2}$ * lambda"
    ],
    "correct": 0,
    "explain": "Wave speed equals frequency multiplied by wavelength: v = f * lambda.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-8",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Medium",
    "q": "For an organ pipe of length L open at both ends, what is the fundamental frequency f1 (where v is speed of sound)?",
    "options": [
      "v / (2L)",
      "v / (4L)",
      "2v / L",
      "v / L"
    ],
    "correct": 0,
    "explain": "An open pipe has antinodes at both ends, with fundamental wavelength lambda = 2L, so f1 = v / (2L).",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-9",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Hard",
    "q": "When a sound source of frequency f moves towards a stationary observer with speed u_s (where v is sound speed), the observed frequency f' is:",
    "options": [
      "f * [v / (v - u_s)]",
      "f * [v / (v + u_s)]",
      "f * [(v - u_s) / v]",
      "f * [(v + u_s) / v]"
    ],
    "correct": 0,
    "explain": "Due to Doppler effect, as source approaches observer, perceived wavelength compresses: f' = f * [v / (v - u_s)].",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-10",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Hard",
    "q": "If the tension in a stretched vibrating string is quadrupled, how does the propagation speed of transverse waves change?",
    "options": [
      "Doubles",
      "Quadruples",
      "Halves",
      "Remains unchanged"
    ],
    "correct": 0,
    "explain": "Wave speed v = $\\sqrt{T / mu}$. If tension T is multiplied by 4, v is multiplied by $\\sqrt{4}$ = 2.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-6",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Easy",
    "q": "Which thermodynamic process takes place at constant volume?",
    "options": [
      "Isochoric process",
      "Isobaric process",
      "Isothermal process",
      "Adiabatic process"
    ],
    "correct": 0,
    "explain": "An isochoric (or isometric) process occurs at constant volume (dV = 0), so work done W = P*dV = 0.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-7",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Medium",
    "q": "What is the change in internal energy Delta U of an ideal gas undergoing a cyclic thermodynamic process?",
    "options": [
      "Zero",
      "Positive",
      "Negative",
      "Equal to total work done"
    ],
    "correct": 0,
    "explain": "Internal energy is a state function. For any complete thermodynamic cycle, initial and final states are identical, so Delta U = 0.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-8",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Medium",
    "q": "What is the efficiency of a Carnot engine operating between 500 K and 300 K?",
    "options": [
      "40%",
      "60%",
      "20%",
      "50%"
    ],
    "correct": 0,
    "explain": "Efficiency eta = 1 - (T_cold / T_hot) = 1 - (300 / 500) = 1 - 0.60 = 0.40 or 40%.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-9",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Hard",
    "q": "During an adiabatic process for an ideal gas, which equation represents the relationship between pressure P and volume V?",
    "options": [
      "P * $V^{gamma}$ = constant",
      "P * V = constant",
      "P / $V^{gamma}$ = constant",
      "V / T = constant"
    ],
    "correct": 0,
    "explain": "For a reversible adiabatic process of an ideal gas, P * $V^{gamma}$ = constant, where gamma = Cp / Cv.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-th-10",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Hard",
    "q": "According to the Second Law of Thermodynamics, in any natural spontaneous process, the total entropy of the universe:",
    "options": [
      "Always increases",
      "Always decreases",
      "Remains strictly constant",
      "Becomes zero at equilibrium"
    ],
    "correct": 0,
    "explain": "The entropy of an isolated system (the universe) always increases in irreversible spontaneous processes: Delta S_universe \\ge 0.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-6",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Easy",
    "q": "What is the value of Coulomb constant k = 1 / (4*pi*epsilon_0) in SI units?",
    "options": [
      "9 x $10^{9}$ N $m^{2} /  C^{2}$",
      "8.85 x 10^{-12} $C^{2}$ / (N $m^{2}$)",
      "1.6 x 10^{-19} N $m^{2} /  C^{2}$",
      "6.67 x 10^{-11} N $m^{2} /  C^{2}$"
    ],
    "correct": 0,
    "explain": "In free space, k = 1 / (4*pi*epsilon_0) is approximately 8.99 x $10^{9}$ N $m^{2} /  C^{2}$ (commonly 9 x $10^{9}$).",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-7",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Medium",
    "q": "What is the relationship between electric field intensity E and electric potential V?",
    "options": [
      "E = -dV/dr (negative potential gradient)",
      "E = dV/dr",
      "E = V * r",
      "E = -V / $r^{2}$"
    ],
    "correct": 0,
    "explain": "Electric field intensity is the negative gradient of electric potential: E = -dV/dr.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-8",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Hard",
    "q": "Gauss's Law states that total electric flux Phi through any closed surface enclosing net charge Q is:",
    "options": [
      "Q / epsilon_0",
      "Q * epsilon_0",
      "4*pi * Q",
      "Q / (4*pi*epsilon_0)"
    ],
    "correct": 0,
    "explain": "Gauss's Law states that the net outward electric flux through any closed Gaussian surface equals Q_enclosed / epsilon_0.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-9",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Hard",
    "q": "What is the electrostatic potential energy U stored in a capacitor of capacitance C charged to voltage V?",
    "options": [
      "(1/2) * C * $V^{2}$",
      "C * $V^{2}$",
      "(1/2) * $C^{2}$ * V",
      "Q * $V^{2}$"
    ],
    "correct": 0,
    "explain": "Energy stored in a capacitor is U = (1/2)*C*$V^{2}$ = (1/2)*Q*V = $Q^{2}$ / (2C).",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-10",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Hard",
    "q": "Two point charges +q and -q are separated by distance 2a. What is the electric dipole moment vector p?",
    "options": [
      "q * (2a) directed from -q to +q",
      "q * (2a) directed from +q to -q",
      "2q * a directed radially outward",
      "$q^{2}$ / (2a) directed perpendicular to axis"
    ],
    "correct": 0,
    "explain": "The electric dipole moment has magnitude p = q*(2a) and by physics convention points from negative charge -q to positive charge +q.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-6",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Easy",
    "q": "Which law relates potential difference V and current I across an ohmic conductor at constant temperature?",
    "options": [
      "Ohm's Law",
      "Ampere's Law",
      "Faraday's Law",
      "Coulomb's Law"
    ],
    "correct": 0,
    "explain": "Ohm's Law states that V is directly proportional to I across a conductor, provided physical conditions (temperature) remain constant.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-7",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Medium",
    "q": "Kirchhoff's Second Rule (loop rule) Sigma V = 0 is a direct manifestation of which conservation law?",
    "options": [
      "Conservation of Energy",
      "Conservation of Charge",
      "Conservation of Momentum",
      "Conservation of Mass"
    ],
    "correct": 0,
    "explain": "The sum of potential differences around any closed circuit loop is zero, directly conserving electrical energy.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-8",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Medium",
    "q": "Two resistors of 6 ohms and 12 ohms are connected in parallel. What is their equivalent resistance?",
    "options": [
      "4 ohms",
      "18 ohms",
      "8 ohms",
      "3 ohms"
    ],
    "correct": 0,
    "explain": "1/R_eq = 1/6 + 1/12 = 3/12 = 1/4 \\implies R_eq = 4 ohms.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-9",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Hard",
    "q": "A potentiometer is preferred over a standard voltmeter for measuring emf of a cell because:",
    "options": [
      "It draws zero current from the source at balance point (null condition)",
      "It has very low resistance",
      "It can measure alternating current directly",
      "It is portable and uses no battery"
    ],
    "correct": 0,
    "explain": "At null condition, no current flows from the test cell, so there is no internal resistance drop (Ir = 0), yielding exact emf.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-10",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Hard",
    "q": "When a wire of original resistance R is uniformly stretched to double its original length, its new electrical resistance becomes:",
    "options": [
      "4R",
      "2R",
      "R/2",
      "R/4"
    ],
    "correct": 0,
    "explain": "Since volume V = A*L is constant, stretching to 2L halves cross-sectional area to A/2. New R' = rho*(2L)/(A/2) = 4*rho*L/A = 4R.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-6",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Easy",
    "q": "The direction of the magnetic field lines around a straight current-carrying wire is determined by the:",
    "options": [
      "Right-hand grip rule",
      "Left-hand rule",
      "Lenz's law",
      "Snell's law"
    ],
    "correct": 0,
    "explain": "Grasping the wire with thumb pointing in current direction, curled fingers show the concentric magnetic field line direction.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-7",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Medium",
    "q": "What is the magnetic force on a charge q moving with velocity v in magnetic field B at an angle of $90^\\circ$?",
    "options": [
      "q * v * B",
      "Zero",
      "q * v / B",
      "(1/2) * q * v * B"
    ],
    "correct": 0,
    "explain": "F = q * v * B * sin(theta). When $\\theta =  90^\\circ$, sin($90^\\circ$) = 1, so F = q * v * B.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-8",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Hard",
    "q": "Ampere's Circuital Law states that the line integral of magnetic field B around any closed loop is equal to:",
    "options": [
      "mu_0 * I_enclosed",
      "I_enclosed / mu_0",
      "mu_0 * epsilon_0 * I",
      "B / mu_0"
    ],
    "correct": 0,
    "explain": "Ampere's Law in magnetostatics states oint B · dl = mu_0 * I_enclosed.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-9",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Hard",
    "q": "To convert a sensitive moving coil galvanometer into a voltmeter of range V, what must be connected?",
    "options": [
      "A very high resistance in series with the coil",
      "A very low resistance in parallel (shunt)",
      "A low resistance in series",
      "A high resistance in parallel"
    ],
    "correct": 0,
    "explain": "A voltmeter requires high total resistance so it draws negligible current; this is achieved by connecting a large multiplier resistance R_h in series.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-10",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Hard",
    "q": "In the velocity selector of J.J. Thomson experiment, an electron experiences mutually perpendicular electric field E and magnetic field B. What is the selected speed v?",
    "options": [
      "E / B",
      "B / E",
      "E * B",
      "$\\sqrt{E / B}$"
    ],
    "correct": 0,
    "explain": "Zero deflection occurs when electric force qE balances magnetic force qvB: qE = qvB \\implies v = E / B.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-6",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Easy",
    "q": "According to Faraday's Law of Electromagnetic Induction, the magnitude of induced emf is directly proportional to:",
    "options": [
      "Rate of change of magnetic flux",
      "Total magnetic flux",
      "Area of the coil only",
      "Resistance of the circuit"
    ],
    "correct": 0,
    "explain": "Faraday's law states emf = -N * (dPhi/dt), proportional to the time rate of change of magnetic flux.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-7",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Medium",
    "q": "What is the energy density (energy per unit volume) stored in the magnetic field B of an inductor in vacuum?",
    "options": [
      "$B^{2}$ / (2 * mu_0)",
      "(1/2) * mu_0 * $B^{2}$",
      "B / (2 * mu_0)",
      "mu_0 * $B^{2}$"
    ],
    "correct": 0,
    "explain": "Magnetic energy density is u_B = $B^{2}$ / (2 * mu_0).",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-8",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Hard",
    "q": "Eddy currents induced in the solid iron core of a transformer cause power loss as heat. How is this loss minimized?",
    "options": [
      "By using a laminated core of insulated thin sheets",
      "By using a solid copper core",
      "By reducing the primary voltage",
      "By decreasing the frequency to zero"
    ],
    "correct": 0,
    "explain": "Laminating the core into thin sheets separated by insulating varnish restricts the circulation loops of eddy currents, minimizing ohmic heat losses.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-9",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Hard",
    "q": "What is the motional emf induced in a conductor of length L moving with velocity v perpendicular to a uniform magnetic field B?",
    "options": [
      "v * B * L",
      "-v * B / L",
      "(1/2) * v * B * L",
      "$v^{2}$ * B * L"
    ],
    "correct": 0,
    "explain": "Motional emf is given by epsilon = (v x B) · L. For perpendicular orientation, epsilon = v * B * L.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-10",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Hard",
    "q": "In an AC generator with N turns of area A rotating at angular speed omega in field B, what is the peak induced voltage V0?",
    "options": [
      "N * B * A * omega",
      "N * B * A / omega",
      "(1/2) * N * B * A * omega",
      "N * B * A"
    ],
    "correct": 0,
    "explain": "Flux Phi = BA*cos($\\omega$*t). Emf = -N*(dPhi/dt) = NBA*$\\omega$*sin($\\omega$*t). Peak emf is V0 = N * B * A * omega.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-6",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Easy",
    "q": "What is the frequency of standard household alternating current in Pakistan?",
    "options": [
      "50 Hz",
      "60 Hz",
      "100 Hz",
      "120 Hz"
    ],
    "correct": 0,
    "explain": "Pakistan, like Europe and most of Asia, operates its national electricity grid at a standard frequency of 50 Hz.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-7",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Medium",
    "q": "In a purely capacitive AC circuit, what is the phase relationship between current and voltage?",
    "options": [
      "Current leads voltage by $90^\\circ$ (pi/2 radians)",
      "Voltage leads current by $90^\\circ$ (pi/2 radians)",
      "Current and voltage are completely in phase",
      "Current leads voltage by $180^\\circ$"
    ],
    "correct": 0,
    "explain": "In a capacitor, charge (and therefore current) must build up before voltage develops: current leads voltage by $90^\\circ$ (pi/2).",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-8",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "What is the inductive reactance X_L of an inductor with inductance L = 0.1 H connected to a 50 Hz AC supply?",
    "options": [
      "31.4 ohms",
      "314 ohms",
      "3.14 ohms",
      "15.7 ohms"
    ],
    "correct": 0,
    "explain": "X_L = 2*pi*f*L = 2 * 3.1416 * 50 * 0.1 = 10 * 3.1416 = 31.4 ohms.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-9",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "What is the power factor cos(phi) of a series RLC circuit at electrical resonance?",
    "options": [
      "1.0 (unity)",
      "0",
      "0.5",
      "Infinity"
    ],
    "correct": 0,
    "explain": "At resonance, inductive reactance cancels capacitive reactance (X_L = X_C), making the total impedance purely resistive (Z = R). Thus cos(phi) = R/Z = 1.0.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-10",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "What is the average power dissipated over one complete AC cycle in a purely inductive or purely capacitive circuit?",
    "options": [
      "Zero",
      "V_rms * I_rms",
      "(1/2) * V0 * I0",
      "V_rms^2 / R"
    ],
    "correct": 0,
    "explain": "Average power P_avg = V_rms * I_rms * cos(phi). In purely reactive circuits phi = $90^\\circ$, cos($90^\\circ$) = 0, so average dissipated power is zero.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-6",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Easy",
    "q": "Electromagnetic waves are transverse in nature because they can exhibit which phenomenon?",
    "options": [
      "Polarization",
      "Interference",
      "Diffraction",
      "Refraction"
    ],
    "correct": 0,
    "explain": "Polarization can only occur in transverse waves where oscillations are perpendicular to the direction of propagation.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-7",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Easy",
    "q": "Which region of the electromagnetic spectrum has the longest wavelength?",
    "options": [
      "Radio waves",
      "Infrared rays",
      "X-rays",
      "Gamma rays"
    ],
    "correct": 0,
    "explain": "Radio waves have wavelengths ranging from millimeters to kilometers, which are the longest in the electromagnetic spectrum.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-8",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Medium",
    "q": "How are the speeds of electromagnetic waves c in vacuum related to electric permittivity epsilon_0 and magnetic permeability mu_0?",
    "options": [
      "c = 1 / $\\sqrt{mu_0 * epsilon_0}$",
      "c = $\\sqrt{mu_0 / epsilon_0}$",
      "c = mu_0 * epsilon_0",
      "c = 1 / (mu_0 * epsilon_0)"
    ],
    "correct": 0,
    "explain": "Maxwell derived that the speed of light in vacuum is c = 1 / $\\sqrt{mu_0 * epsilon_0}$.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-9",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Hard",
    "q": "What produces electromagnetic radiation according to classical Maxwellian electrodynamics?",
    "options": [
      "Accelerating electric charges",
      "Stationary electric charges",
      "Constant steady currents in straight wires",
      "Uniformly moving charges with zero acceleration"
    ],
    "correct": 0,
    "explain": "Accelerating or oscillating charges create time-varying electric and magnetic fields that propagate outward as electromagnetic waves.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-10",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Hard",
    "q": "What is the ratio of the amplitude of the electric field E0 to the magnetic field B0 in a plane electromagnetic wave in vacuum?",
    "options": [
      "c (speed of light)",
      "1 / c",
      "$c^{2}$",
      "mu_0 / epsilon_0"
    ],
    "correct": 0,
    "explain": "In an electromagnetic wave in free space, E0 / B0 = c.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-6",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Easy",
    "q": "Crystalline solids have a regular three-dimensional geometric arrangement of atoms known as a:",
    "options": [
      "Crystal lattice",
      "Amorphous glass",
      "Polymer chain",
      "Plastic slip"
    ],
    "correct": 0,
    "explain": "A regular periodic spatial array of atoms or ions is called a crystal lattice.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-7",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Easy",
    "q": "The fractional change in dimension (Delta L / L) produced by an applied stress is known as:",
    "options": [
      "Strain",
      "Elastic modulus",
      "Yield stress",
      "Toughness"
    ],
    "correct": 0,
    "explain": "Tensile strain is defined as the dimensionless ratio of change in length Delta L to original length L.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-8",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Medium",
    "q": "Substances like iron, nickel, and cobalt that strongly align with an external magnetic field are classified as:",
    "options": [
      "Ferromagnetic",
      "Paramagnetic",
      "Diamagnetic",
      "Superparamagnetic"
    ],
    "correct": 0,
    "explain": "Ferromagnetic materials have permanent magnetic domains that align strongly with applied fields and retain magnetism.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-9",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Hard",
    "q": "In the stress-strain curve for a ductile metal, the point beyond which deformation becomes permanent and irreversible is called the:",
    "options": [
      "Yield point (elastic limit)",
      "Fracture point",
      "Ultimate tensile strength",
      "Proportional limit"
    ],
    "correct": 0,
    "explain": "Beyond the elastic limit or yield point, the material enters the plastic deformation region and does not return to its original shape.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-10",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Hard",
    "q": "Superconductors expel all internal magnetic flux when cooled below their critical temperature Tc. This phenomenon is called the:",
    "options": [
      "Meissner effect",
      "Hall effect",
      "Seebeck effect",
      "Peltier effect"
    ],
    "correct": 0,
    "explain": "The Meissner effect is the complete expulsion of magnetic field lines from the interior of a superconductor in the superconducting state.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-6",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Easy",
    "q": "In an intrinsic (pure) silicon semiconductor at room temperature, which statement is true?",
    "options": [
      "Number of free electrons equals number of holes",
      "Number of free electrons exceeds number of holes",
      "Number of holes exceeds number of free electrons",
      "There are no free charge carriers"
    ],
    "correct": 0,
    "explain": "In pure semiconductors, thermal generation creates electron-hole pairs in equal numbers (n = p = n_i).",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-7",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Easy",
    "q": "Doping pure silicon with a pentavalent impurity like Phosphorus or Arsenic produces an:",
    "options": [
      "n-type semiconductor",
      "p-type semiconductor",
      "Intrinsic semiconductor",
      "Insulator"
    ],
    "correct": 0,
    "explain": "Pentavalent atoms donate a 5th outer electron, providing excess negative mobile electrons (n-type).",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-8",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Medium",
    "q": "What is the voltage gain of a non-inverting operational amplifier circuit with feedback resistor Rf and input resistor R1?",
    "options": [
      "1 + (Rf / R1)",
      "-Rf / R1",
      "Rf / R1",
      "1 - (Rf / R1)"
    ],
    "correct": 0,
    "explain": "The closed-loop voltage gain of a non-inverting operational amplifier is A_v = 1 + (Rf / R1).",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-9",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Medium",
    "q": "What is the potential barrier across a silicon p-n junction diode at room temperature (approx 300 K)?",
    "options": [
      "0.7 V",
      "0.3 V",
      "1.1 V",
      "0.1 V"
    ],
    "correct": 0,
    "explain": "The built-in potential barrier of silicon p-n junction diode is ~0.7 V (compared to ~0.3 V for Germanium).",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-elec-10",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Hard",
    "q": "In a transistor in common-emitter configuration, if base current is Ib = 20 muA and collector current is Ic = 2 mA, what is the current gain beta?",
    "options": [
      "100",
      "50",
      "200",
      "10"
    ],
    "correct": 0,
    "explain": "Current gain $\\beta$ = Ic / Ib = (2 x 10^{-3} A) / (20 x 10^{-6} A) = 2000 / 20 = 100.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-6",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Easy",
    "q": "According to Einstein's mass-energy equivalence principle, energy E contained in rest mass m0 is:",
    "options": [
      "E = m0 * $c^{2}$",
      "E = (1/2) * m0 * $c^{2}$",
      "E = m0 * c",
      "E = $m0^{2}$ * c"
    ],
    "correct": 0,
    "explain": "Einstein's celebrated equation is E = m0 * $c^{2}$.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-7",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Medium",
    "q": "According to Heisenberg's Uncertainty Principle, the product of uncertainty in position Delta x and momentum Delta p satisfies:",
    "options": [
      "Delta x * Delta p \\ge h / (4*pi)",
      "Delta x * Delta p = 0",
      "Delta x * Delta p \\le h / (2*pi)",
      "Delta x / Delta p \\ge h"
    ],
    "correct": 0,
    "explain": "Heisenberg's Uncertainty Principle states that Delta x * Delta p \\ge h / (4*pi) = hbar / 2.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-8",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "In Compton scattering, the shift in photon wavelength Delta lambda is maximum when the scattering angle theta is:",
    "options": [
      "$180^\\circ$",
      "$90^\\circ$",
      "$0^\\circ$",
      "$45^\\circ$"
    ],
    "correct": 0,
    "explain": "Delta lambda = (h / (m_e * c)) * (1 - cos(theta)). For $\\theta =  180^\\circ$, cos($180^\\circ$) = -1, making 1 - (-1) = 2, giving the maximum shift of 2*lambda_c.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-9",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "A spaceship moves at speed v = 0.8c relative to Earth. What is the Lorentz factor gamma = 1 / $\\sqrt{1 - $v^{2} / c^{2}$}$?",
    "options": [
      "1.67 (5/3)",
      "1.25",
      "2.0",
      "1.0"
    ],
    "correct": 0,
    "explain": "sqrt(1 - (0.8)^2) = $\\sqrt{1 - 0.64} =  \\sqrt{0.36}$ = 0.6. gamma = 1 / 0.6 = 10/6 = 5/3 approx 1.67.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-10",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "Pair production (materialization of a gamma photon into an electron-positron pair) can only take place in the vicinity of:",
    "options": [
      "A heavy atomic nucleus (to conserve momentum)",
      "A perfect vacuum with zero particles",
      "An intense light beam",
      "A magnetic dipole only"
    ],
    "correct": 0,
    "explain": "A massive nucleus is required to absorb recoil momentum so that both energy and linear momentum are simultaneously conserved.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-6",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Easy",
    "q": "Which spectral series of the hydrogen atom produces emission lines exclusively in the visible spectrum region?",
    "options": [
      "Balmer series",
      "Lyman series",
      "Paschen series",
      "Brackett series"
    ],
    "correct": 0,
    "explain": "The Balmer series transitions to the n = 2 state fall directly within the visible light region (400 nm - 700 nm).",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-7",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Easy",
    "q": "The wavelength range of X-rays is approximately:",
    "options": [
      "0.01 nm to 10 nm",
      "400 nm to 700 nm",
      "1 mm to 100 mm",
      "10 m to 1000 m"
    ],
    "correct": 0,
    "explain": "X-rays have wavelengths typically around 0.01 nm to 10 nm (0.1 Å to 100 Å), roughly the size of atomic spacing.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-8",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Medium",
    "q": "What is the physical condition required for stimulated emission in a LASER to dominate over spontaneous absorption?",
    "options": [
      "Population inversion",
      "Thermal equilibrium",
      "Ground state saturation",
      "Critical damping"
    ],
    "correct": 0,
    "explain": "Population inversion occurs when there are more atoms in the higher excited metastable state than in the ground state.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-9",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Hard",
    "q": "According to Bohr's theory, the orbital radius r_n of an electron in a hydrogen atom scales with principal quantum number n as:",
    "options": [
      "r_n proportional to $n^{2}$",
      "r_n proportional to n",
      "r_n proportional to 1/n",
      "r_n proportional to 1/$n^{2}$"
    ],
    "correct": 0,
    "explain": "Bohr radius formula gives r_n = $n^{2}$ * r1, where r1 = 0.529 Å. Hence r_n is directly proportional to $n^{2}$.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-10",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Hard",
    "q": "What is the cutoff wavelength lambda_min of continuous X-rays produced by electrons accelerated through potential V?",
    "options": [
      "h * c / (e * V)",
      "e * V / (h * c)",
      "h * V / (e * c)",
      "h * c / (2 * e * V)"
    ],
    "correct": 0,
    "explain": "Maximum photon energy occurs when entire kinetic energy eV is converted to a single photon: eV = h*c / lambda_min \\implies lambda_min = hc / (eV).",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-6",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Easy",
    "q": "Which type of nuclear radiation has the highest penetrating power through matter?",
    "options": [
      "Gamma rays",
      "Beta particles",
      "Alpha particles",
      "Protons"
    ],
    "correct": 0,
    "explain": "Gamma rays are high-energy neutral photons with no charge or rest mass, giving them the highest penetrating power (stopped only by thick lead).",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-7",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Medium",
    "q": "In negative beta decay ($\\beta$-), which transformation occurs inside the unstable parent nucleus?",
    "options": [
      "A neutron transforms into a proton, an electron, and an antineutrino",
      "A proton transforms into a neutron, a positron, and a neutrino",
      "An alpha particle is ejected from the nucleus",
      "A proton captures an orbital electron"
    ],
    "correct": 0,
    "explain": "In $\\beta$-minus decay: n -> p + e^- + nu_bar. The atomic number Z increases by 1 while mass number A remains unchanged.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-8",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Medium",
    "q": "What is the function of a moderator (such as heavy water D2O or graphite) in a thermal nuclear fission reactor?",
    "options": [
      "To slow down fast neutrons to thermal energies",
      "To absorb excess neutrons and stop the reaction",
      "To cool down the reactor core fluid",
      "To shield the environment from radiation"
    ],
    "correct": 0,
    "explain": "Moderators slow down fast fission neutrons through elastic collisions so they can effectively induce fission in Uranium-235.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-9",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Hard",
    "q": "What is the mass defect Delta m of a stable nucleus composed of Z protons and N neutrons with actual nuclear mass M_nuc?",
    "options": [
      "[Z * m_p + N * m_n] - M_nuc",
      "M_nuc - [Z * m_p + N * m_n]",
      "[Z * m_p + N * m_n] / M_nuc",
      "M_nuc / (Z + N)"
    ],
    "correct": 0,
    "explain": "The mass of a bound nucleus is always less than the sum of its free constituent nucleons: Delta m = (Z*m_p + N*m_n) - M_nuc.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-10",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Hard",
    "q": "The primary source of stellar energy in the core of our Sun is the nuclear fusion of hydrogen into helium via the:",
    "options": [
      "Proton-Proton cycle",
      "Carbon-Nitrogen cycle",
      "Fission of Uranium-238",
      "Alpha decay chain"
    ],
    "correct": 0,
    "explain": "For main-sequence stars with solar mass like our Sun, the proton-proton (p-p) fusion chain reaction accounts for ~99% of energy generation.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-11",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Easy",
    "q": "Which of the following is a derived SI unit?",
    "options": [
      "Newton",
      "Kelvin",
      "Mole",
      "Candela"
    ],
    "correct": 0,
    "explain": "Kelvin, mole, and candela are base SI units, whereas Newton (N = kg·m/$s^{2}$) is a derived unit of force.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-12",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Medium",
    "q": "The fractional uncertainty in a measurement is defined as the ratio of:",
    "options": [
      "Absolute uncertainty to the measured value",
      "Measured value to absolute uncertainty",
      "Percentage uncertainty to 1000",
      "Least count to total range"
    ],
    "correct": 0,
    "explain": "Fractional uncertainty = (Absolute uncertainty / Measured value). Multiplying by 100 yields the percentage uncertainty.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-13",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Hard",
    "q": "If the percentage uncertainty in measuring radius r of a sphere is 2%, what is the percentage uncertainty in its calculated volume V = (4/3)π$r^{3}$?",
    "options": [
      "6%",
      "2%",
      "8%",
      "4%"
    ],
    "correct": 0,
    "explain": "For V ∝ $r^{3}$, the percentage uncertainty in V is 3 times the percentage uncertainty in r: 3 * 2% = 6%.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-14",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Hard",
    "q": "What are the dimensions of the universal gravitational constant G in terms of M, L, and T?",
    "options": [
      "[M^{-1} $L^{3}$ T⁻²]",
      "[M $L^{2}$ T⁻²]",
      "[M^{-1} $L^{2}$T^{-1}]",
      "[M $L^{3}$ T⁻²]"
    ],
    "correct": 0,
    "explain": "From F = G m1 m2 / $r^{2}$, G = F $r^{2} /  m^{2}$ = [M L T⁻²][$L^{2}$] / [$M^{2}$] = [M^{-1} $L^{3}$ T⁻²].",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-15",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Hard",
    "q": "What are the base dimensions of surface tension in terms of M, L, and T?",
    "options": [
      "[M T⁻²]",
      "[M L T⁻²]",
      "[M L^{-1} T⁻²]",
      "[M $L^{2}$ T⁻²]"
    ],
    "correct": 0,
    "explain": "Surface tension is defined as force per unit length: γ = F / L = [M L T⁻²] / [L] = [M T⁻²] = [M $L^{0}$ T⁻²].",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-11",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Easy",
    "q": "A body is in rotational equilibrium if and only if the vector sum of all external:",
    "options": [
      "Torques acting on it is zero (Στ = 0)",
      "Forces acting on it is zero (ΣF = 0)",
      "Velocities is constant",
      "Momenta is non-zero"
    ],
    "correct": 0,
    "explain": "The second condition of equilibrium states that the algebraic sum of all external torques must vanish: Στ = 0.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-12",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Easy",
    "q": "Two forces of 6 N and 8 N act at a point at right angles ($90^\\circ$) to each other. What is the magnitude of their resultant force?",
    "options": [
      "10 N",
      "14 N",
      "2 N",
      "48 N"
    ],
    "correct": 0,
    "explain": "R = sqrt($F1^{2} +  F2^{2}$) = sqrt($6^{2} +  8^{2}$) = $\\sqrt{36 + 64} =  \\sqrt{100}$ = 10 N.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-13",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Medium",
    "q": "A couple consists of two parallel forces that are:",
    "options": [
      "Equal in magnitude, opposite in direction, with different lines of action",
      "Equal in magnitude and in the same direction",
      "Unequal in magnitude with identical line of action",
      "Perpendicular to each other"
    ],
    "correct": 0,
    "explain": "A couple is formed by two equal and antiparallel forces not acting along the same line, producing pure rotation without translation.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-14",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Medium",
    "q": "At what angle θ between two equal magnitude vectors does their resultant also have the exact same magnitude as each vector?",
    "options": [
      "$120^\\circ$",
      "$60^\\circ$",
      "$90^\\circ$",
      "$180^\\circ$"
    ],
    "correct": 0,
    "explain": "$R^{2} =  A^{2}$ + $A^{2} +  2A^{2}$ cos(θ). If R = A, then $A^{2} =  2A^{2}$(1 + cos(θ)) \\implies 1 + cos(θ) = 1/2 \\implies cos(θ) = -1/2 => θ = $120^\\circ$.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-15",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Hard",
    "q": "A uniform meter rod of mass 200 g is balanced horizontally at its 40 cm mark when a mass m is suspended from the 20 cm mark. What is mass m?",
    "options": [
      "100 g",
      "200 g",
      "50 g",
      "400 g"
    ],
    "correct": 0,
    "explain": "The rod’s center of gravity is at 50 cm. Lever arm of rod weight = 50 - 40 = 10 cm. Lever arm of mass m = 40 - 20 = 20 cm. By principle of moments: m * 20 = 200 * 10 \\implies m = 100 g.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-11",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Easy",
    "q": "The area under a velocity-time graph represents which physical quantity?",
    "options": [
      "Displacement",
      "Acceleration",
      "Force",
      "Instantaneous speed"
    ],
    "correct": 0,
    "explain": "The integral of velocity with respect to time ∫ v dt equals the displacement of the moving body.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-12",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Easy",
    "q": "Newton’s third law of motion implies that action and reaction forces:",
    "options": [
      "Act on two different interacting bodies",
      "Act on the exact same body and cancel each other",
      "Occur with a slight time delay",
      "Are unequal in non-inertial frames"
    ],
    "correct": 0,
    "explain": "Action and reaction forces act simultaneously on two different interacting objects, so they never cancel each other out.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-13",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Medium",
    "q": "A ball is projected horizontally with velocity v from the top of a cliff of height h. What is its time of flight to reach the ground?",
    "options": [
      "$\\sqrt{2h / g}$",
      "$\\sqrt{h / g}$",
      "2h / g",
      "v * $\\sqrt{2h / g}$"
    ],
    "correct": 0,
    "explain": "Vertical initial velocity is zero: h = (1/2)$gt^{2}$ \\implies t = $\\sqrt{2h / g}$, which is completely independent of the horizontal launch velocity.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-14",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Medium",
    "q": "In an elastic collision between two isolated bodies in one dimension, which quantities are conserved?",
    "options": [
      "Both total linear momentum and total kinetic energy",
      "Only total linear momentum",
      "Only total kinetic energy",
      "Neither momentum nor kinetic energy"
    ],
    "correct": 0,
    "explain": "By definition, an elastic collision conserves both the total linear momentum and the total kinetic energy of the system.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-15",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Hard",
    "q": "A 1000 kg rocket expels exhaust gases at an effective exhaust speed of 2000 m/s. To achieve an initial upward acceleration of 10.2 m/$s^{2}$ (taking g = 9.8 m/$s^{2}$), what must be the rate of gas ejection dm/dt?",
    "options": [
      "10 kg/s",
      "5 kg/s",
      "20 kg/s",
      "15 kg/s"
    ],
    "correct": 0,
    "explain": "Thrust F = v_rel * (dm/dt). Upward net force: F - mg = m*a \\implies F = m(g + a) = 1000(9.8 + 10.2) = 20,000 N. Rate dm/dt = 20,000 / 2000 = 10 kg/s.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-11",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Easy",
    "q": "One kilowatt-hour (1 kWh) of electrical energy is numerically equivalent to how many Joules?",
    "options": [
      "3.6 x 10⁶ J",
      "3.6 x $10^{3}$ J",
      "1.0 x 10⁵ J",
      "3.6 x 10⁹ J"
    ],
    "correct": 0,
    "explain": "1 kWh = (1000 W) * (3600 s) = 3,600,000 J = 3.6 x 10⁶ J = 3.6 MJ.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-12",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Medium",
    "q": "If the linear momentum p of an object is increased by 100%, by what percentage does its kinetic energy increase?",
    "options": [
      "300%",
      "100%",
      "200%",
      "400%"
    ],
    "correct": 0,
    "explain": "KE = $p^{2}$ / (2m). If p doubles to 2p, KE becomes (2p)^{2} / (2m) = 4 KE, an increase of 300%.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-13",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Hard",
    "q": "The work done by a conservative force along any closed path in a gravitational field is always:",
    "options": [
      "Zero",
      "Positive",
      "Negative",
      "Dependent on the path taken"
    ],
    "correct": 0,
    "explain": "By definition of a conservative force field, the line integral along any closed loop is strictly zero: ∮ F · dr = 0.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-14",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Hard",
    "q": "What is the absolute gravitational potential energy of a body of mass m at infinity from Earth?",
    "options": [
      "Zero",
      "Maximum positive value",
      "Negative infinity",
      "mgR"
    ],
    "correct": 0,
    "explain": "Gravitational potential energy U = -G M m / r. As r approaches infinity (r -> ∞), U reaches its maximum reference value of zero.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-15",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Hard",
    "q": "An electric motor with 75% efficiency delivers 3 kW of mechanical output power. What is the electrical power input to the motor?",
    "options": [
      "4.0 kW",
      "2.25 kW",
      "5.0 kW",
      "3.75 kW"
    ],
    "correct": 0,
    "explain": "Efficiency η = Power_out / Power_in \\implies Power_in = Power_out / η = 3 kW / 0.75 = 4.0 kW.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-11",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Easy",
    "q": "What is the relationship between linear velocity v and angular velocity ω for a particle moving in a circle of radius r?",
    "options": [
      "v = r ω",
      "v = ω / r",
      "ω = v r",
      "v = $r^{2}$ ω"
    ],
    "correct": 0,
    "explain": "Linear speed v is related to angular speed ω by the fundamental formula v = r ω.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-12",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Easy",
    "q": "A body moving in a circle with constant speed has centripetal acceleration directed:",
    "options": [
      "Towards the center of the circle",
      "Tangentially to the circle",
      "Away from the center",
      "Along the rotation axis"
    ],
    "correct": 0,
    "explain": "Centripetal acceleration a_c = $v^{2}$ / r is always directed radially inward toward the center of the circular trajectory.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-13",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Medium",
    "q": "What is the moment of inertia of a thin uniform hoop (ring) of mass M and radius R about its central symmetry axis?",
    "options": [
      "M $R^{2}$",
      "(1/2) M $R^{2}$",
      "(2/5) M $R^{2}$",
      "(1/12) M $R^{2}$"
    ],
    "correct": 0,
    "explain": "For a thin cylindrical ring or hoop where all mass is at distance R from the central axis, I = M $R^{2}$.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-14",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Medium",
    "q": "What is the orbital period of a geostationary satellite orbiting the Earth?",
    "options": [
      "24 hours (1 day)",
      "12 hours",
      "84 minutes",
      "365 days"
    ],
    "correct": 0,
    "explain": "A geostationary satellite remains stationary relative to a point on the equator because its orbital period exactly matches Earth’s rotation period: 24 hours.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-15",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Hard",
    "q": "A solid sphere and a hollow cylinder of identical mass and radius roll down the same incline without slipping. Which reaches the bottom first?",
    "options": [
      "The solid sphere, because it has a smaller moment of inertia",
      "The hollow cylinder, because all its mass is at the rim",
      "Both reach simultaneously",
      "Depends on the inclination angle"
    ],
    "correct": 0,
    "explain": "Acceleration on an incline a = g sin(θ) / (1 + I / (m $R^{2}$)). For a solid sphere, I/($mR^{2}$) = 2/5 = 0.4; for a hollow cylinder, I/($mR^{2}$) = 1. The solid sphere has less rotational inertia and accelerates faster.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-11",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Easy",
    "q": "What are the SI units of dynamic viscosity coefficient η?",
    "options": [
      "N·s·m⁻² (or Pa·s)",
      "N·m⁻²",
      "kg·m·s^{-1}",
      "N·s^{-1}"
    ],
    "correct": 0,
    "explain": "From Stokes' law F = 6πηrv, η = F / (6πrv) = N / (m · m/s) = N·s·m⁻² = Pa·s.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-12",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Medium",
    "q": "According to the Equation of Continuity for incompressible fluid flow, what product remains constant along a streamline?",
    "options": [
      "Cross-sectional area x flow speed (A * v)",
      "Pressure x velocity (P * v)",
      "Density x area (ρ * A)",
      "Viscosity x velocity (η * v)"
    ],
    "correct": 0,
    "explain": "The equation of continuity states that the volume flow rate Q = A * v is constant at every cross-section for an incompressible fluid.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-13",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Hard",
    "q": "Bernoulli’s equation is a direct mathematical consequence of the law of conservation of:",
    "options": [
      "Energy",
      "Linear momentum",
      "Mass",
      "Angular momentum"
    ],
    "correct": 0,
    "explain": "Bernoulli’s equation relates pressure energy, kinetic energy, and potential energy per unit volume, embodying conservation of energy for steady, ideal fluid flow.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-14",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Hard",
    "q": "According to Torricelli’s theorem, the efflux speed of a liquid emerging from a small hole at depth h below the free liquid surface is:",
    "options": [
      "$\\sqrt{2gh}$",
      "2gh",
      "$\\sqrt{gh}$",
      "gh / 2"
    ],
    "correct": 0,
    "explain": "Torricelli’s law gives v = $\\sqrt{2gh}$, which is identical to the speed of a freely falling body dropped through vertical height h.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-15",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Hard",
    "q": "When water flows from a pipe of diameter 4 cm into a nozzle of diameter 2 cm, how does the flow speed change in the nozzle?",
    "options": [
      "Increases by a factor of 4",
      "Increases by a factor of 2",
      "Decreases by a factor of 4",
      "Remains unchanged"
    ],
    "correct": 0,
    "explain": "By continuity A1 v1 = A2 v2 \\implies v2 = v1 * (d1 / d2)^{2}. With d1/d2 = 4/2 = 2, v2 = v1 * $2^{2}$ = 4 v1.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-11",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Easy",
    "q": "In simple harmonic motion (SHM), the acceleration of the particle is directly proportional to its displacement and:",
    "options": [
      "Always directed towards the mean position",
      "Always directed away from the mean position",
      "Perpendicular to displacement",
      "Directed along velocity"
    ],
    "correct": 0,
    "explain": "By definition of SHM, a = -ω² x, meaning acceleration is proportional to displacement x and always directed toward the equilibrium (mean) position.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-12",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Easy",
    "q": "What is the time period of a simple pendulum of length L in a gravitational field of strength g?",
    "options": [
      "T = 2π $\\sqrt{L / g}$",
      "T = 2π $\\sqrt{g / L}$",
      "T = (1/2π) $\\sqrt{L / g}$",
      "T = 2π (L / g)"
    ],
    "correct": 0,
    "explain": "The period of a simple pendulum executing small oscillations is T = 2π $\\sqrt{L / g}$.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-13",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Medium",
    "q": "At what displacement from the mean position are the kinetic energy and potential energy of an SHM oscillator equal?",
    "options": [
      "x = x₀ / $\\sqrt{2}$",
      "x = x₀ / 2",
      "x = x₀ / 4",
      "x = x₀ * $\\sqrt{3}$ / 2"
    ],
    "correct": 0,
    "explain": "PE = (1/2)k $x^{2}$ and Total E = (1/2)k x₀². PE = Total E / 2 \\implies (1/2)k $x^{2}$ = (1/4)k x₀² => $x^{2}$ = x₀² / 2 \\implies x = x₀ / $\\sqrt{2}$.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-14",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Medium",
    "q": "When an oscillating system is driven by a periodic external force at a frequency matching its natural frequency, the phenomenon is called:",
    "options": [
      "Resonance",
      "Damping",
      "Diffraction",
      "Polarization"
    ],
    "correct": 0,
    "explain": "Resonance occurs when the driving frequency equals the natural frequency of the oscillator, resulting in maximum energy transfer and maximum amplitude.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-15",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Hard",
    "q": "If the length of a simple pendulum is increased by 21%, by what percentage does its time period increase?",
    "options": [
      "10%",
      "21%",
      "5%",
      "44%"
    ],
    "correct": 0,
    "explain": "T ∝ $\\sqrt{L}$. New length L' = 1.21 L. New period T' = $\\sqrt{1.21}$ T = 1.10 T, which is a 10% increase.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-11",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Easy",
    "q": "Sound waves traveling through atmospheric air are classified as:",
    "options": [
      "Longitudinal mechanical waves",
      "Transverse mechanical waves",
      "Electromagnetic waves",
      "Stationary surface waves"
    ],
    "correct": 0,
    "explain": "Sound in air propagates as compressions and rarefactions where air molecules oscillate parallel to wave propagation, making them longitudinal mechanical waves.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-12",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Easy",
    "q": "The distance between two consecutive nodes in a stationary wave is equal to:",
    "options": [
      "λ / 2",
      "λ",
      "λ / 4",
      "2λ"
    ],
    "correct": 0,
    "explain": "In standing waves, the distance between any two adjacent nodes (or two adjacent antinodes) is half a wavelength, λ/2.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-13",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Medium",
    "q": "Laplace corrected Newton’s formula for the speed of sound in air by assuming the compressions and rarefactions occur under:",
    "options": [
      "Adiabatic conditions",
      "Isothermal conditions",
      "Isobaric conditions",
      "Isochoric conditions"
    ],
    "correct": 0,
    "explain": "Laplace recognized that sound oscillations happen too rapidly for heat exchange with surroundings, meaning the process is adiabatic (v = $\\sqrt{γ P / ρ}$).",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-14",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Medium",
    "q": "Two tuning forks of frequencies 256 Hz and 260 Hz are sounded together. How many beats per second are heard?",
    "options": [
      "4",
      "2",
      "258",
      "516"
    ],
    "correct": 0,
    "explain": "Beat frequency equals the absolute difference between the two interacting sound frequencies: f_beat = $|260 - 256|$ = 4 Hz.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-15",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Hard",
    "q": "An organ pipe open at both ends of length L has its fundamental frequency f. If one end is now closed, what is the new fundamental frequency?",
    "options": [
      "f / 2",
      "2 f",
      "f / 4",
      "f"
    ],
    "correct": 0,
    "explain": "For an open pipe, f_open = v / (2L). For a closed pipe of same length, f_closed = v / (4L) = (1/2) * (v / 2L) = f / 2.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-11",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Easy",
    "q": "The First Law of Thermodynamics is a statement of the conservation of:",
    "options": [
      "Energy",
      "Entropy",
      "Momentum",
      "Mass"
    ],
    "correct": 0,
    "explain": "The First Law (ΔQ = ΔU + W) expresses the principle of conservation of energy for thermodynamic systems.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-12",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Medium",
    "q": "In an isothermal expansion of an ideal gas, which parameter remains strictly constant?",
    "options": [
      "Temperature",
      "Pressure",
      "Volume",
      "Heat content"
    ],
    "correct": 0,
    "explain": "An isothermal process occurs at constant temperature (ΔT = 0), so internal energy change ΔU = 0.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-13",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Hard",
    "q": "What is the theoretical efficiency of a Carnot heat engine operating between hot reservoir T_H = 600 K and cold reservoir T_C = 300 K?",
    "options": [
      "50%",
      "100%",
      "25%",
      "75%"
    ],
    "correct": 0,
    "explain": "Carnot efficiency η = 1 - T_C / T_H = 1 - 300 / 600 = 1 - 0.5 = 0.50 or 50%.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-14",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Hard",
    "q": "What is the change in entropy ΔS during any reversible adiabatic process?",
    "options": [
      "Zero",
      "Positive",
      "Negative",
      "Infinite"
    ],
    "correct": 0,
    "explain": "In an adiabatic reversible process, no heat is transferred (dQ = 0). Since dS = dQ / T, the change in entropy ΔS = 0 (isentropic process).",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-15",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Hard",
    "q": "For an ideal gas, the molar heat capacity at constant pressure C_p and at constant volume C_v are related by Mayer’s formula as:",
    "options": [
      "C_p - C_v = R",
      "C_p + C_v = R",
      "C_v - C_p = R",
      "C_p / C_v = R"
    ],
    "correct": 0,
    "explain": "Mayer’s relation states C_p - C_v = R, accounting for the mechanical boundary work P dV performed by the gas at constant pressure.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-11",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Easy",
    "q": "The electric field strength E between two large oppositely charged parallel plates separated by distance d with potential difference V is:",
    "options": [
      "E = V / d",
      "E = V * d",
      "E = d / V",
      "E = V / $d^{2}$"
    ],
    "correct": 0,
    "explain": "In a uniform electric field, the potential gradient magnitude is E = ΔV / Δr = V / d.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-12",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Easy",
    "q": "What is the capacitance of a parallel plate capacitor when a dielectric of relative permittivity ε_r is inserted between its plates?",
    "options": [
      "Increases by factor ε_r",
      "Decreases by factor ε_r",
      "Remains unchanged",
      "Becomes zero"
    ],
    "correct": 0,
    "explain": "Capacitance with dielectric C = ε_r * C_0. Since ε_r > 1 for all dielectric materials, capacitance increases by a factor of ε_r.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-13",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Medium",
    "q": "According to Gauss’s Law, the total electric flux Φ through any closed surface enclosing a net charge Q is:",
    "options": [
      "Q / ε₀",
      "Q * ε₀",
      "4π Q",
      "Q / (4πε₀)"
    ],
    "correct": 0,
    "explain": "Gauss’s Law states that the net outward electric flux through any closed Gaussian surface equals Q_enclosed / ε₀.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-14",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Medium",
    "q": "Three capacitors of capacitance 6 μF each are connected in series. What is their equivalent capacitance?",
    "options": [
      "2 μF",
      "18 μF",
      "3 μF",
      "6 μF"
    ],
    "correct": 0,
    "explain": "In series, 1/C_eq = 1/6 + 1/6 + 1/6 = 3/6 = 1/2 \\implies C_eq = 2 μF.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-15",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Hard",
    "q": "How much electrostatic energy is stored in a 10 μF capacitor charged to a potential difference of 200 V?",
    "options": [
      "0.2 J",
      "0.4 J",
      "2.0 J",
      "0.02 J"
    ],
    "correct": 0,
    "explain": "Energy U = (1/2) C $V^{2}$ = (1/2) * (10 x 10⁻⁶ F) * (200 V)^{2} = 5 x 10⁻⁶ * 40,000 = 0.2 J.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-11",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Easy",
    "q": "Kirchhoff’s First Rule (Junction Rule), ΣI = 0, is a manifestation of the conservation of:",
    "options": [
      "Charge",
      "Energy",
      "Momentum",
      "Power"
    ],
    "correct": 0,
    "explain": "At any electrical junction, the total current entering equals the total current leaving, ensuring conservation of electric charge.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-12",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Medium",
    "q": "A uniform copper wire of resistance R is stretched uniformly until its length doubles (2L). What is its new resistance?",
    "options": [
      "4 R",
      "2 R",
      "R / 2",
      "R / 4"
    ],
    "correct": 0,
    "explain": "Volume V = A * L is constant. When L doubles, cross-sectional area A halves (A/2). Resistance R' = ρ(2L)/(A/2) = 4 (ρL/A) = 4 R.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-13",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Hard",
    "q": "Kirchhoff’s Second Rule (Loop Rule), ΣV = 0, is based on the law of conservation of:",
    "options": [
      "Energy",
      "Charge",
      "Magnetic flux",
      "Electric flux"
    ],
    "correct": 0,
    "explain": "The sum of potential differences around any closed circuit loop is zero, representing conservation of electrical potential energy.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-14",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Hard",
    "q": "Under what condition is a Wheatstone bridge circuit in a balanced state?",
    "options": [
      "R1 / R2 = R3 / R4 (galvanometer reads zero current)",
      "R1 + R2 = R3 + R4",
      "All four resistances must be equal",
      "When battery voltage is zero"
    ],
    "correct": 0,
    "explain": "A Wheatstone bridge is balanced when R1 / R2 = R3 / R4, resulting in zero potential difference across the galvanometer detector.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-15",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Hard",
    "q": "Under what condition is maximum power transferred from a real DC source of EMF E and internal resistance r to an external load resistor R_L?",
    "options": [
      "R_L = r",
      "R_L >> r",
      "R_L = 0",
      "R_L = 2r"
    ],
    "correct": 0,
    "explain": "By the Maximum Power Transfer Theorem, maximum power is delivered to the load when the load resistance equals the internal resistance of the power source (R_L = r).",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-11",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Easy",
    "q": "What is the magnetic force acting on a stationary electric charge (v = 0) in a strong magnetic field B?",
    "options": [
      "Zero",
      "q B",
      "q / B",
      "Infinite"
    ],
    "correct": 0,
    "explain": "The Lorentz magnetic force is F = q (v x B) = q v B sin(θ). If v = 0, F is identically zero.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-12",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Easy",
    "q": "What is the SI unit of magnetic flux density (B)?",
    "options": [
      "Tesla (T)",
      "Weber (Wb)",
      "Henry (H)",
      "Ampere per meter"
    ],
    "correct": 0,
    "explain": "Magnetic flux density B is measured in Tesla (1 T = 1 Wb/$m^{2}$ = 1 N/(A·m)).",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-13",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Medium",
    "q": "What is the trajectory of a charged particle entering a uniform magnetic field at an angle of $90^\\circ$ to the field lines?",
    "options": [
      "Circular",
      "Helical",
      "Straight line",
      "Parabolic"
    ],
    "correct": 0,
    "explain": "When velocity is perpendicular to the magnetic field, the constant-magnitude perpendicular magnetic force provides the exact centripetal force required for uniform circular motion.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-14",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Medium",
    "q": "According to Ampere’s Law, the line integral of magnetic field ∮ B · dl around a closed path is equal to:",
    "options": [
      "μ₀ * I_enclosed",
      "I / μ₀",
      "ε₀ * I",
      "Zero"
    ],
    "correct": 0,
    "explain": "Ampere’s circuital law states that ∮ B · dl = μ₀ I_enclosed.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-15",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Hard",
    "q": "To convert a sensitive galvanometer of coil resistance R_g into a voltmeter of range V, how should the multiplier resistor R_h be connected?",
    "options": [
      "In series with the coil, with high resistance R_h = (V / I_g) - R_g",
      "In parallel with low resistance",
      "In series with low resistance",
      "In parallel with high resistance"
    ],
    "correct": 0,
    "explain": "A voltmeter must draw minimal current, so a large multiplier resistance R_h = (V / I_g) - R_g is connected in series with the galvanometer coil.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-11",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Easy",
    "q": "Faraday’s Law states that the induced EMF in a coil is directly proportional to:",
    "options": [
      "Time rate of change of magnetic flux",
      "Magnetic flux itself",
      "Current in the coil",
      "Resistance of the coil"
    ],
    "correct": 0,
    "explain": "Induced EMF ε = -N (dΦ_B / dt), which is directly proportional to the time rate of change of magnetic flux linkage.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-12",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Easy",
    "q": "The minus sign in Faraday’s Law ε = -N(ΔΦ/Δt) is an expression of:",
    "options": [
      "Lenz’s Law (conservation of energy)",
      "Ohm’s Law",
      "Ampere’s Law",
      "Coulomb’s Law"
    ],
    "correct": 0,
    "explain": "Lenz’s law states the induced current always opposes the change in flux causing it, which guarantees conservation of energy.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-13",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Medium",
    "q": "What is the motional EMF induced across a straight conductor of length L moving at speed v perpendicular to a uniform magnetic field B?",
    "options": [
      "ε = v B L",
      "ε = v B / L",
      "ε = B L / v",
      "ε = $v^{2}$ B L"
    ],
    "correct": 0,
    "explain": "Motional EMF is given by ε = -v B L sin(θ). For perpendicular motion (θ = $90^\\circ$), magnitude is v B L.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-14",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Medium",
    "q": "In an ideal step-up transformer with turns ratio N_s / N_p = 5, if the input voltage is 220 V, what is the output secondary voltage?",
    "options": [
      "1100 V",
      "44 V",
      "220 V",
      "550 V"
    ],
    "correct": 0,
    "explain": "V_s / V_p = N_s / N_p \\implies V_s = V_p * (N_s / N_p) = 220 V * 5 = 1100 V.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-15",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Hard",
    "q": "How much magnetic potential energy is stored in an inductor of self-inductance L = 2 H carrying a steady DC current of 3 A?",
    "options": [
      "9 J",
      "6 J",
      "18 J",
      "4.5 J"
    ],
    "correct": 0,
    "explain": "Energy stored in magnetic field of inductor U_B = (1/2) L $I^{2}$ = (1/2) * (2 H) * (3 A)^{2} = 9 J.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-11",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Easy",
    "q": "What is the peak-to-peak voltage V_p-p of a sinusoidal AC supply having peak voltage V_0 = 100 V?",
    "options": [
      "200 V",
      "100 V",
      "141.4 V",
      "70.7 V"
    ],
    "correct": 0,
    "explain": "Peak-to-peak voltage is the total excursion from positive peak to negative peak: V_p-p = 2 * V_0 = 2 * 100 V = 200 V.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-12",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Medium",
    "q": "Which component is commonly used in power supply filter circuits to block AC ripple while offering minimal resistance to steady DC?",
    "options": [
      "A choke coil (inductor)",
      "A step-up transformer",
      "A precision potentiometer",
      "A shunt ammeter"
    ],
    "correct": 0,
    "explain": "An inductor (choke) offers high reactance X_L = 2π f L to high-frequency AC ripple, but negligible resistance to DC (f = 0 Hz).",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-13",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "What is the inductive reactance X_L of an inductor of inductance L when connected to an AC source of angular frequency ω?",
    "options": [
      "X_L = ω L",
      "X_L = 1 / (ω L)",
      "X_L = ω / L",
      "X_L = ω² L"
    ],
    "correct": 0,
    "explain": "Inductive reactance opposes AC current with magnitude X_L = ω L = 2π f L.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-14",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "At resonance in a series RLC circuit, the total electrical impedance Z of the circuit is:",
    "options": [
      "Minimum and purely resistive (Z = R)",
      "Maximum and purely inductive",
      "Zero",
      "Infinite"
    ],
    "correct": 0,
    "explain": "At resonance, inductive reactance cancels capacitive reactance (X_L = X_C), making total impedance Z = sqrt($R^{2}$ + (X_L - X_C)^{2}) = R (minimum).",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-15",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "What is the Quality factor (Q-factor) measuring sharpness of resonance in a series RLC circuit at angular resonance frequency ω₀?",
    "options": [
      "Q = ω₀ L / R",
      "Q = R / (ω₀ L)",
      "Q = ω₀ R L",
      "Q = 1 / (ω₀ R L)"
    ],
    "correct": 0,
    "explain": "The Quality factor (Q) of a series resonant circuit is defined as Q = ω₀ L / R = (1 / R) * $\\sqrt{L / C}$.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-11",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Easy",
    "q": "All electromagnetic waves propagate through vacuum at what constant speed?",
    "options": [
      "3 x 10⁸ m/s",
      "330 m/s",
      "3 x 10⁶ m/s",
      "Infinite speed"
    ],
    "correct": 0,
    "explain": "In a vacuum, all electromagnetic waves travel at the speed of light c ≈ 3 x 10⁸ m/s, irrespective of their frequency.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-12",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Easy",
    "q": "Which region of the electromagnetic spectrum has the shortest wavelength and highest photon energy?",
    "options": [
      "Gamma rays",
      "Radio waves",
      "Infrared",
      "Visible light"
    ],
    "correct": 0,
    "explain": "Gamma rays possess the shortest wavelengths (< 10^{-1}² m) and therefore the highest frequencies and photon energies.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-13",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Medium",
    "q": "In a plane electromagnetic wave propagating in free space, the electric field E and magnetic field B are:",
    "options": [
      "Perpendicular to each other and perpendicular to the direction of propagation",
      "Parallel to each other and parallel to propagation",
      "Parallel to each other but perpendicular to propagation",
      "Antiparallel to each other"
    ],
    "correct": 0,
    "explain": "Electromagnetic waves are transverse: E ⊥ B and both are perpendicular to the propagation vector k (Poynting vector S = E x B / μ₀).",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-14",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Medium",
    "q": "What is the speed of light c in terms of permittivity of free space ε₀ and permeability of free space μ₀?",
    "options": [
      "c = 1 / $\\sqrt{μ₀ ε₀}$",
      "c = $\\sqrt{μ₀ ε₀}$",
      "c = μ₀ / ε₀",
      "c = 1 / (μ₀ ε₀)"
    ],
    "correct": 0,
    "explain": "Maxwell’s equations demonstrated that electromagnetic wave speed in vacuum is c = 1 / $\\sqrt{μ₀ ε₀}$.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-15",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Hard",
    "q": "An electromagnetic wave has a frequency of 100 MHz. What is its wavelength in free space?",
    "options": [
      "3.0 m",
      "0.3 m",
      "30 m",
      "300 m"
    ],
    "correct": 0,
    "explain": "λ = c / f = (3 x 10⁸ m/s) / (100 x 10⁶ Hz) = 3.0 m.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-11",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Easy",
    "q": "Hooke’s Law is valid for a deformed material up to its:",
    "options": [
      "Proportional limit",
      "Ultimate tensile strength",
      "Fracture point",
      "Yield point"
    ],
    "correct": 0,
    "explain": "Stress is directly proportional to strain strictly up to the proportional limit on the stress-strain curve.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-12",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Easy",
    "q": "What are the SI units of Young’s Modulus of elasticity?",
    "options": [
      "N/$m^{2}$ (or Pascal)",
      "N·m",
      "Dimensionless",
      "N/m"
    ],
    "correct": 0,
    "explain": "Young’s modulus Y = Stress / Strain. Since strain is dimensionless, Y has units of stress: N/$m^{2}$ or Pa.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-13",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Medium",
    "q": "Materials that undergo significant permanent plastic deformation before fracture are termed:",
    "options": [
      "Ductile materials",
      "Brittle materials",
      "Polymers",
      "Amorphous materials"
    ],
    "correct": 0,
    "explain": "Ductile materials (such as copper and aluminum) experience large plastic strains before fracturing, allowing them to be drawn into wires.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-14",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Medium",
    "q": "In crystalline solids, ferromagnetic materials lose their permanent magnetism and become paramagnetic above the:",
    "options": [
      "Curie temperature",
      "Debye temperature",
      "Critical temperature",
      "Absolute zero"
    ],
    "correct": 0,
    "explain": "The Curie temperature T_c is the threshold above which thermal agitation destroys ferromagnetic domain alignment, converting it to paramagnetism.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-15",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Hard",
    "q": "According to energy band theory, an electrical insulator has:",
    "options": [
      "A full valence band, an empty conduction band, and a wide forbidden energy gap (> 3 eV)",
      "An overlapping conduction and valence band",
      "A narrow band gap (< 1 eV)",
      "A partially filled conduction band"
    ],
    "correct": 0,
    "explain": "Insulators feature a completely filled valence band, an empty conduction band, and a wide forbidden gap (> 3 to 6 eV) that thermal energy cannot overcome.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-11",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Easy",
    "q": "In an intrinsic semiconductor at room temperature, electrical conduction is carried by:",
    "options": [
      "Both free electrons and holes in equal numbers",
      "Only free electrons",
      "Only positive ions",
      "Only holes"
    ],
    "correct": 0,
    "explain": "Thermal excitation generates electron-hole pairs in equal quantities, both contributing to electric conduction in pure intrinsic semiconductors.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-12",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Easy",
    "q": "A p-type semiconductor is obtained by doping pure silicon with which type of impurity atom?",
    "options": [
      "Trivalent impurity (such as Indium, Boron, or Gallium)",
      "Pentavalent impurity (such as Phosphorus)",
      "Hexavalent impurity",
      "Noble gas"
    ],
    "correct": 0,
    "explain": "Doping group IV elements with trivalent atoms creates a deficiency of bonding electrons (holes), creating a p-type semiconductor.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-13",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Medium",
    "q": "What is the potential barrier across a silicon p-n junction at room temperature under zero bias?",
    "options": [
      "0.7 V",
      "0.3 V",
      "1.1 V",
      "0.1 V"
    ],
    "correct": 0,
    "explain": "The internal diffusion potential barrier of a silicon p-n diode is approximately 0.7 V (compared to 0.3 V for germanium).",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-14",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Medium",
    "q": "In a bipolar junction transistor (BJT) configured as an amplifier, the base-emitter junction and base-collector junction must be biased respectively as:",
    "options": [
      "Forward biased and reverse biased",
      "Both forward biased",
      "Both reverse biased",
      "Reverse biased and forward biased"
    ],
    "correct": 0,
    "explain": "For active region amplification in a BJT, the input base-emitter junction must be forward biased and the output collector-base junction reverse biased.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-15",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Hard",
    "q": "What is the closed-loop voltage gain of an ideal operational amplifier in an inverting configuration with input resistor R_in = 10 kΩ and feedback resistor R_f = 100 kΩ?",
    "options": [
      "-10",
      "10",
      "-11",
      "11"
    ],
    "correct": 0,
    "explain": "Inverting amplifier gain A_v = -R_f / R_in = -100 kΩ / 10 kΩ = -10.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-11",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Easy",
    "q": "According to Einstein’s photoelectric equation, the kinetic energy of emitted photoelectrons depends solely on:",
    "options": [
      "Frequency of the incident light",
      "Intensity of the incident light",
      "Surface area of the metal",
      "Duration of illumination"
    ],
    "correct": 0,
    "explain": "KE_max = h f - Φ. The kinetic energy of emitted photoelectrons depends directly on the frequency f of the incident photons, not the intensity.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-12",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Medium",
    "q": "What is the de Broglie wavelength λ associated with a particle of mass m moving with momentum p?",
    "options": [
      "λ = h / p",
      "λ = p / h",
      "λ = h * p",
      "λ = h / (2p)"
    ],
    "correct": 0,
    "explain": "De Broglie proposed wave-particle duality where wavelength λ = h / p = h / (m v).",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-13",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "In the Compton scattering effect, when an X-ray photon is scattered by a stationary electron at $90^\\circ$, the Compton shift Δλ is equal to:",
    "options": [
      "h / (m_e c) ≈ 2.43 x 10^{-1}² m",
      "2 h / (m_e c)",
      "Zero",
      "h / (2 m_e c)"
    ],
    "correct": 0,
    "explain": "Δλ = (h / m_e c)(1 - cos(θ)). For θ = $90^\\circ$, cos($90^\\circ$) = 0, so Δλ = h / (m_e c) = 2.426 x 10^{-1}² m (the Compton wavelength).",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-14",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "What is the minimum photon energy required to produce an electron-positron pair via pair production?",
    "options": [
      "1.02 MeV",
      "0.51 MeV",
      "2.04 MeV",
      "13.6 eV"
    ],
    "correct": 0,
    "explain": "Rest mass of an electron or positron is 0.511 MeV. Pair production creates two such particles: 2 * 0.511 MeV = 1.02 MeV.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-15",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "According to Heisenberg’s Uncertainty Principle, the product of uncertainties in position (Δx) and momentum (Δp) satisfies:",
    "options": [
      "Δx · Δp \\ge h / (4π)",
      "Δx · Δp = 0",
      "Δx · Δp \\le h / (2π)",
      "Δx · Δp = h"
    ],
    "correct": 0,
    "explain": "Heisenberg’s uncertainty principle establishes that Δx · Δp >= ℏ / 2 = h / (4π).",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-11",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Easy",
    "q": "Which spectral series of the hydrogen atom lies entirely within the visible region of the electromagnetic spectrum?",
    "options": [
      "Balmer series",
      "Lyman series",
      "Paschen series",
      "Brackett series"
    ],
    "correct": 0,
    "explain": "Transitions ending on n = 2 form the Balmer series, which emits in the visible spectral region.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-12",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Easy",
    "q": "According to Bohr’s postulate, an electron can only orbit in stationary states where its orbital angular momentum L is an integral multiple of:",
    "options": [
      "h / (2π)",
      "h / π",
      "2π / h",
      "h / 4π"
    ],
    "correct": 0,
    "explain": "Bohr’s quantization condition states L = m v r = n * (h / 2π), where n = 1, 2, 3...",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-13",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Medium",
    "q": "What is the ground state ionization energy of the hydrogen atom?",
    "options": [
      "13.6 eV",
      "3.4 eV",
      "1.51 eV",
      "0 eV"
    ],
    "correct": 0,
    "explain": "The ground state energy of hydrogen is E1 = -13.6 eV. Removing the electron to infinity (E = 0) requires exactly +13.6 eV.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-14",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Medium",
    "q": "Characteristic X-rays are emitted when:",
    "options": [
      "An outer shell atomic electron falls into a vacancy in an inner shell",
      "Electrons undergo rapid deceleration near the atomic nucleus",
      "Nuclear fission takes place",
      "Electrons are absorbed by protons"
    ],
    "correct": 0,
    "explain": "When high-energy incident electrons eject an inner-shell electron (like K-shell), an outer electron drops into the vacancy, emitting a discrete characteristic X-ray photon.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-15",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Hard",
    "q": "In a laser system, achieving a condition where there are more atoms in the excited metastable state than in the ground state is known as:",
    "options": [
      "Population inversion",
      "Optical pumping",
      "Spontaneous emission",
      "Stimulated absorption"
    ],
    "correct": 0,
    "explain": "Population inversion is the non-equilibrium condition essential for laser action where excited state population exceeds ground state population.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-11",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Easy",
    "q": "What is the charge of a $\\beta$-minus (β⁻) particle emitted during nuclear radioactive decay?",
    "options": [
      "-1.6 x 10^{-1}⁹ C (charge of an electron)",
      "+1.6 x 10^{-1}⁹ C",
      "Zero",
      "+3.2 x 10^{-1}⁹ C"
    ],
    "correct": 0,
    "explain": "A $\\beta$-minus particle is a high-speed electron emitted from the nucleus with charge -e = -1.6 x 10^{-1}⁹ C.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-12",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Easy",
    "q": "The mass number A of a nucleus represents the total count of:",
    "options": [
      "Protons and neutrons (nucleons)",
      "Only protons",
      "Only neutrons",
      "Protons and orbital electrons"
    ],
    "correct": 0,
    "explain": "Mass number A = Z + N, representing the total number of nucleons (protons plus neutrons) in the nucleus.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-13",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Medium",
    "q": "What is the relationship between the half-life $T_{1/2}$ of a radioactive isotope and its decay constant λ?",
    "options": [
      "$T_{1/2}$ = 0.693 / λ",
      "$T_{1/2}$ = λ / 0.693",
      "$T_{1/2}$ = 0.693 * λ",
      "$T_{1/2}$ = 1 / λ"
    ],
    "correct": 0,
    "explain": "Half-life $T_{1/2}$ = ln(2) / λ ≈ 0.693 / λ.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-14",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Medium",
    "q": "During an alpha (α) decay process, how do the mass number A and atomic number Z of the parent nucleus change?",
    "options": [
      "A decreases by 4, Z decreases by 2",
      "A decreases by 2, Z decreases by 4",
      "A unchanged, Z increases by 1",
      "A decreases by 1, Z unchanged"
    ],
    "correct": 0,
    "explain": "An alpha particle is a helium nucleus (⁴₂He). Thus, the daughter nucleus has A - 4 and Z - 2.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-15",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Hard",
    "q": "One unified atomic mass unit (1 u) is equivalent to how much rest mass energy according to E = $mc^{2}$?",
    "options": [
      "931.5 MeV",
      "938 MeV",
      "0.511 MeV",
      "1.02 MeV"
    ],
    "correct": 0,
    "explain": "1 u = 1.6605 x 10⁻²⁷ kg. By Einstein’s mass-energy equivalence, 1 u = 931.5 MeV of energy.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-16",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Easy",
    "q": "Which of the following is a supplementary SI unit in the international metric system?",
    "options": [
      "Steradian",
      "Newton",
      "Joule",
      "Coulomb"
    ],
    "correct": 0,
    "explain": "Radian (plane angle) and Steradian (solid angle) are the two supplementary SI units.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-17",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Hard",
    "q": "What are the base dimensions of dynamic pressure [P]?",
    "options": [
      "[M L^{-1} T⁻²]",
      "[M L T⁻²]",
      "[M $L^{2}$ T⁻²]",
      "[M L⁻² T^{-1}]"
    ],
    "correct": 0,
    "explain": "Pressure = Force / Area = [M L T⁻²] / [$L^{2}$] = [M L^{-1} T⁻²].",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-18",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Medium",
    "q": "A physical quantity x is given by x = $a^{2}$ b / $c^{3}$. If percentage uncertainties in a, b, and c are 1%, 2%, and 1% respectively, what is the maximum percentage uncertainty in x?",
    "options": [
      "7%",
      "4%",
      "5%",
      "6%"
    ],
    "correct": 0,
    "explain": "Percentage uncertainty = 2(1%) + 1(2%) + 3(1%) = 2% + 2% + 3% = 7%.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-19",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Medium",
    "q": "How many significant figures are present in the measurement 0.005080 kg?",
    "options": [
      "4",
      "3",
      "6",
      "7"
    ],
    "correct": 0,
    "explain": "Leading zeros before the first non-zero digit are non-significant; the digits 5, 0, 8, and the trailing 0 are significant, giving 4 significant figures.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-meas-20",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Hard",
    "q": "What are the dimensions of the universal gravitational constant G in terms of base dimensions M, L, and T?",
    "options": [
      "[M^{-1} $L^{3}$ T⁻²]",
      "[M $L^{3}$ T⁻²]",
      "[M^{-1} $L^{2}$ T⁻²]",
      "[M⁻² $L^{3}$T^{-1}]"
    ],
    "correct": 0,
    "explain": "From Newton’s law F = G m1 m2 / $r^{2}$ \\implies G = F $r^{2} /  m^{2}$ = [M L T⁻²][$L^{2}$] / [$M^{2}$] = [M^{-1} $L^{3}$ T⁻²].",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-16",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Medium",
    "q": "What is the angle between two equal non-zero vectors if the magnitude of their resultant is equal to the magnitude of either vector?",
    "options": [
      "$120^\\circ$",
      "$60^\\circ$",
      "$90^\\circ$",
      "$180^\\circ$"
    ],
    "correct": 0,
    "explain": "$R^{2} =  A^{2}$ + $A^{2} +  2A^{2}$ cos(θ). If R = A, then $A^{2} =  2A^{2}$(1 + cos θ) \\implies 1 + cos θ = 1/2 \\implies cos θ = -1/2 => θ = $120^\\circ$.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-17",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Easy",
    "q": "For a rigid body to satisfy the second condition of static equilibrium, what must be zero?",
    "options": [
      "Vector sum of all external torques (Στ = 0)",
      "Vector sum of all external forces (ΣF = 0)",
      "Total linear momentum",
      "Total angular velocity"
    ],
    "correct": 0,
    "explain": "The second condition of equilibrium states that the net external torque acting on the body must be zero (Στ = 0).",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-18",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Medium",
    "q": "Two forces of 6 N and 8 N act at right angles to each other. What is the magnitude of their resultant force?",
    "options": [
      "10 N",
      "14 N",
      "2 N",
      "12 N"
    ],
    "correct": 0,
    "explain": "For perpendicular forces: R = sqrt($6^{2} +  8^{2}$) = $\\sqrt{36 + 64} =  \\sqrt{100}$ = 10 N.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-19",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Hard",
    "q": "If the cross product of two non-zero vectors satisfies |A × B| = $\\sqrt{3}$ (A · B), what is the angle θ between them?",
    "options": [
      "$60^\\circ$",
      "$30^\\circ$",
      "$45^\\circ$",
      "$90^\\circ$"
    ],
    "correct": 0,
    "explain": "|A × B| = AB sin(θ) and A · B = AB cos(θ). Thus AB sin(θ) = $\\sqrt{3}$ AB cos(θ) \\implies tan(θ) = $\\sqrt{3}$ => θ = $60^\\circ$.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ve-20",
    "subject": "Physics",
    "topic": "Vectors and Equilibrium",
    "difficulty": "Hard",
    "q": "A force F = 3i + 2j - k acts at a point with position vector r = i - j + 2k. What is the torque τ = r × F about the origin?",
    "options": [
      "-3i + 7j + 5k",
      "3i - 7j - 5k",
      "-3i + 5j + 7k",
      "i + 3j - 5k"
    ],
    "correct": 0,
    "explain": "τ = det([[i, j, k], [1, -1, 2], [3, 2, -1]]) = i((-1)(-1) - (2)(2)) - j((1)(-1) - (2)(3)) + k((1)(2) - (-1)(3)) = i(1 - 4) - j(-1 - 6) + k(2 + 3) = -3i + 7j + 5k.",
    "chapter": "Vectors and Equilibrium",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-16",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Easy",
    "q": "What is the rate of change of linear momentum of a body equal to according to Newton’s second law?",
    "options": [
      "Net applied external force",
      "Kinetic energy",
      "Total impulse",
      "Work done"
    ],
    "correct": 0,
    "explain": "Newton’s second law states that F = dp/dt, meaning the net applied force equals the time rate of change of linear momentum.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-17",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Easy",
    "q": "At what angle of projection with the horizontal is the horizontal range of a projectile maximized on flat ground?",
    "options": [
      "$45^\\circ$",
      "$30^\\circ$",
      "$60^\\circ$",
      "$90^\\circ$"
    ],
    "correct": 0,
    "explain": "Range R = (v₀² sin 2θ) / g. R is maximum when sin(2θ) = 1 \\implies 2θ = $90^\\circ$ => θ = $45^\\circ$.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-18",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Medium",
    "q": "A ball is projected horizontally with an initial speed of 20 m/s from a cliff of height 45 m. Taking g = 10 m/$s^{2}$, how long does it take to reach the ground?",
    "options": [
      "3.0 s",
      "4.5 s",
      "2.0 s",
      "9.0 s"
    ],
    "correct": 0,
    "explain": "Vertical motion: h = (1/2) g $t^{2}$ \\implies 45 = (1/2)(10) $t^{2}$ = 5 $t^{2} \\implies t^{2}$ = 9 \\implies t = 3.0 s.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-19",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Medium",
    "q": "A 0.5 kg ball moving at 12 m/s strikes a wall and bounces back elastically at the same speed. What is the magnitude of the impulse imparted to the ball?",
    "options": [
      "12 N·s",
      "6 N·s",
      "0 N·s",
      "24 N·s"
    ],
    "correct": 0,
    "explain": "Impulse J = Δp = m(v_f - v_i) = 0.5(-12 - 12) = 0.5(-24) = -12 N·s. Magnitude is 12 N·s.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-mf-20",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Hard",
    "q": "What is the relationship between the maximum height H and the horizontal range R of a projectile launched at $45^\\circ$?",
    "options": [
      "R = 4H",
      "R = 2H",
      "R = H",
      "R = 8H"
    ],
    "correct": 0,
    "explain": "H = v₀² $sin^{2}$($45^\\circ$) / (2g) = v₀² / (4g). R = v₀² / g. Comparing them shows R = 4H.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-16",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Easy",
    "q": "What is the work done by a centripetal force acting on a satellite in a circular orbit?",
    "options": [
      "Zero",
      "Positive",
      "Negative",
      "Infinite"
    ],
    "correct": 0,
    "explain": "Centripetal force is always directed perpendicular to the instantaneous velocity (displacement), so cos($90^\\circ$) = 0, resulting in zero work done.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-17",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Easy",
    "q": "How many joules are equivalent to one kilowatt-hour (1 kWh)?",
    "options": [
      "3.6 × 10⁶ J",
      "3.6 × $10^{3}$ J",
      "1.0 × $10^{3}$ J",
      "3.6 × 10⁵ J"
    ],
    "correct": 0,
    "explain": "1 kWh = 1000 W * 3600 s = 3,600,000 J = 3.6 × 10⁶ J.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-18",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Medium",
    "q": "If the linear momentum of a moving particle is doubled, by what factor does its kinetic energy increase?",
    "options": [
      "4 times",
      "2 times",
      "8 times",
      "Square root of 2 times"
    ],
    "correct": 0,
    "explain": "Kinetic energy is related to momentum by KE = $p^{2}$ / (2m). If p is doubled, KE becomes (2p)^{2} / (2m) = 4 [$p^{2}$ / (2m)], quadrupling.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-19",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Hard",
    "q": "What is the escape velocity from the surface of Earth in terms of gravitational acceleration g and Earth radius R?",
    "options": [
      "$\\sqrt{2gR}$",
      "$\\sqrt{gR}$",
      "2 $\\sqrt{gR}$",
      "$\\sqrt{gR / 2}$"
    ],
    "correct": 0,
    "explain": "Equating initial kinetic energy to gravitational binding energy: (1/2) m v_$esc^{2}$ = G M m / R \\implies v_esc = $\\sqrt{2GM / R} =  \\sqrt{2gR}$.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-we-20",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Hard",
    "q": "An electric motor with 80% mechanical efficiency lifts a 200 kg load vertically through 10 m in 5 seconds (g = 10 m/$s^{2}$). What is the electrical power input to the motor?",
    "options": [
      "5,000 W",
      "4,000 W",
      "3,200 W",
      "6,250 W"
    ],
    "correct": 0,
    "explain": "Useful work W_out = m g h = 200 * 10 * 10 = 20,000 J. Useful power P_out = 20,000 / 5 = 4,000 W. Power input P_in = P_out / efficiency = 4,000 / 0.80 = 5,000 W.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-16",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Easy",
    "q": "What is the rotational analog of mass (inertia in linear motion)?",
    "options": [
      "Moment of inertia",
      "Torque",
      "Angular momentum",
      "Centripetal acceleration"
    ],
    "correct": 0,
    "explain": "Moment of inertia I = Σ m $r^{2}$ measures a body’s resistance to changes in its rotational state, serving as the rotational analog of inertial mass.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-17",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Easy",
    "q": "What is the relationship between linear velocity v, angular velocity ω, and radius r for circular motion?",
    "options": [
      "v = r ω",
      "v = ω / r",
      "v = $r^{2}$ ω",
      "ω = v r"
    ],
    "correct": 0,
    "explain": "In vector form v = ω × r, giving the scalar relation v = r ω.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-18",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Medium",
    "q": "What is the orbital period of a geostationary satellite orbiting around the Earth?",
    "options": [
      "24 hours (1 sidereal day)",
      "12 hours",
      "84 minutes",
      "365 days"
    ],
    "correct": 0,
    "explain": "A geostationary satellite completes one full orbit in synchrony with Earth’s rotation: exactly 24 hours.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-19",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Medium",
    "q": "A wheel of radius 0.5 m accelerates from rest with an angular acceleration of 4 rad/$s^{2}$. What is the tangential acceleration of a point on its rim?",
    "options": [
      "2.0 m/$s^{2}$",
      "8.0 m/$s^{2}$",
      "1.0 m/$s^{2}$",
      "4.0 m/$s^{2}$"
    ],
    "correct": 0,
    "explain": "Tangential acceleration a_t = r α = 0.5 * 4 = 2.0 m/$s^{2}$.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-cm-20",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Hard",
    "q": "A solid disc and a thin hoop of the same mass M and outer radius R roll down an inclined plane from rest without slipping. Which reaches the bottom first?",
    "options": [
      "The solid disc",
      "The thin hoop",
      "Both arrive at the same instant",
      "Depends on the angle of inclination"
    ],
    "correct": 0,
    "explain": "The disc has a smaller moment of inertia (I = 1/2 M $R^{2}$) than the hoop (I = M $R^{2}$), meaning less energy goes into rotation and more into translation, so the disc accelerates faster.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-16",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Easy",
    "q": "According to the equation of continuity for an incompressible fluid in a non-uniform pipe, what product remains constant along a streamline?",
    "options": [
      "A * v (Area × Speed)",
      "A / v",
      "P * v",
      "P * A"
    ],
    "correct": 0,
    "explain": "The continuity equation states that volume flow rate Q = A * v is constant for steady, incompressible flow.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-17",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Medium",
    "q": "What is the SI unit of coefficient of viscosity (η)?",
    "options": [
      "N·s/$m^{2}$ (or Pa·s)",
      "N/$m^{2}$",
      "N·s",
      "kg·m/s"
    ],
    "correct": 0,
    "explain": "From Stokes' law F = 6πηrv, η = F / (6πrv) with SI units N / (m * m/s) = N·s/$m^{2}$ = Pa·s.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-18",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Medium",
    "q": "According to Stokes’ Law, what is the viscous drag force acting on a spherical particle of radius r falling at speed v through a medium of viscosity η?",
    "options": [
      "6πηrv",
      "6πη$r^{2}$v",
      "3πηrv",
      "4πη$rv^{2}$"
    ],
    "correct": 0,
    "explain": "Stokes’ law defines the viscous retarding force on a sphere as F_d = 6πηrv.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-19",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Hard",
    "q": "According to Torricelli’s Theorem, what is the efflux speed of an ideal liquid discharging through an orifice located a depth h below the free surface?",
    "options": [
      "$\\sqrt{2gh}$",
      "2gh",
      "$\\sqrt{gh}$",
      "gh / 2"
    ],
    "correct": 0,
    "explain": "Applying Bernoulli’s equation between the open surface and the orifice gives the Torricelli efflux speed v = $\\sqrt{2gh}$.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-fd-20",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Hard",
    "q": "In a horizontal pipe where liquid flows steadily, if the cross-sectional area decreases by a factor of 2, how does the fluid speed change?",
    "options": [
      "It doubles (increases by 2x)",
      "It halves (decreases by 2x)",
      "It quadruples (increases by 4x)",
      "It remains unchanged"
    ],
    "correct": 0,
    "explain": "From continuity A1 v1 = A2 v2: if A2 = A1 / 2, then v2 = 2 v1, meaning speed doubles.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-16",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Easy",
    "q": "What is the frequency f of an oscillating system whose time period T is 0.02 seconds?",
    "options": [
      "50 Hz",
      "20 Hz",
      "0.02 Hz",
      "100 Hz"
    ],
    "correct": 0,
    "explain": "Frequency f = 1 / T = 1 / 0.02 = 50 Hz.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-17",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Easy",
    "q": "In simple harmonic motion (SHM), what is the phase difference between displacement and acceleration?",
    "options": [
      "$180^\\circ$ (π radians)",
      "$90^\\circ$ (π/2 radians)",
      "$0^\\circ$",
      "$270^\\circ$"
    ],
    "correct": 0,
    "explain": "Since acceleration a = -ω² x, acceleration and displacement are always opposite in sign, which corresponds to a phase difference of π radians ($180^\\circ$).",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-18",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Medium",
    "q": "If the length of a simple pendulum is quadrupled (multiplied by 4), what happens to its time period?",
    "options": [
      "It doubles (increases by 2x)",
      "It quadruples (increases by 4x)",
      "It halves",
      "It remains unchanged"
    ],
    "correct": 0,
    "explain": "T = 2π $\\sqrt{L / g}$. When L becomes 4L, T' = 2π $\\sqrt{4L / g}$ = 2 [2π $\\sqrt{L/g}$] = 2T.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-19",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Medium",
    "q": "At what point in simple harmonic motion is the speed of the oscillating body maximum?",
    "options": [
      "At the mean equilibrium position (x = 0)",
      "At the extreme amplitude positions (x = ±x₀)",
      "At x = x₀ / 2",
      "At all points equally"
    ],
    "correct": 0,
    "explain": "Velocity v = ω $\\sqrt{x₀² - $x^{2}$}$. When x = 0 (mean position), v attains its maximum value v_max = ω x₀.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-osc-20",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Hard",
    "q": "In an undamped simple harmonic oscillator, at what displacement x from the mean position are kinetic energy and potential energy equal?",
    "options": [
      "x = x₀ / $\\sqrt{2}$",
      "x = x₀ / 2",
      "x = x₀ / 4",
      "x = x₀ / $\\sqrt{3}$"
    ],
    "correct": 0,
    "explain": "PE = (1/2) k $x^{2}$ and Total E = (1/2) k x₀². When PE = Total E / 2: (1/2) k $x^{2}$ = (1/4) k x₀² => $x^{2}$ = x₀² / 2 \\implies x = x₀ / $\\sqrt{2}$.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-16",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Easy",
    "q": "What type of waves are sound waves traveling through air at room temperature?",
    "options": [
      "Longitudinal mechanical waves",
      "Transverse mechanical waves",
      "Electromagnetic waves",
      "Torsional stationary waves"
    ],
    "correct": 0,
    "explain": "Sound waves in air propagate via alternating compressions and rarefactions along the direction of propagation, making them longitudinal mechanical waves.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-17",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Easy",
    "q": "What is the distance between two consecutive nodes in a stationary standing wave?",
    "options": [
      "λ / 2",
      "λ",
      "λ / 4",
      "2λ"
    ],
    "correct": 0,
    "explain": "In standing waves, the distance between any two adjacent nodes (or two adjacent antinodes) is half the wavelength: λ / 2.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-18",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Medium",
    "q": "Why was Newton’s theoretical calculation of the speed of sound in air incorrect, later corrected by Laplace?",
    "options": [
      "Newton assumed sound propagation is isothermal, whereas Laplace showed it is adiabatic",
      "Newton assumed sound is adiabatic while Laplace proved it is isobaric",
      "Newton neglected the density of air",
      "Laplace included electromagnetic dispersion"
    ],
    "correct": 0,
    "explain": "Newton assumed rapid sound wave compressions and rarefactions occur isothermally (E = P). Laplace corrected this by recognizing that rapid heat exchange cannot occur, so the process is adiabatic (E = γP).",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-19",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Hard",
    "q": "Two tuning forks with frequencies 380 Hz and 384 Hz are sounded simultaneously. What is the number of beats heard per second?",
    "options": [
      "4 beats per second",
      "2 beats per second",
      "382 beats per second",
      "8 beats per second"
    ],
    "correct": 0,
    "explain": "Beat frequency f_b = |f1 - f2| = $|380 - 384|$ = 4 Hz (4 beats per second).",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-wav-20",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Hard",
    "q": "A sound source emits a frequency f while moving towards a stationary observer with speed u_s (sound speed v). What is the observed frequency f' according to the Doppler effect?",
    "options": [
      "f' = f * [v / (v - u_s)]",
      "f' = f * [(v - u_s) / v]",
      "f' = f * [v / (v + u_s)]",
      "f' = f * [(v + u_s) / v]"
    ],
    "correct": 0,
    "explain": "When the source approaches a stationary observer, the apparent wavelength compresses: f' = f * [v / (v - u_s)], raising the observed pitch.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-16",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Easy",
    "q": "Which thermodynamic process occurs at constant volume with zero boundary work done (W = 0)?",
    "options": [
      "Isochoric process",
      "Isobaric process",
      "Isothermal process",
      "Adiabatic process"
    ],
    "correct": 0,
    "explain": "In an isochoric (isovolumetric) process, ΔV = 0, so work done W = P ΔV = 0.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-17",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Easy",
    "q": "What is the mathematical formulation of the First Law of Thermodynamics?",
    "options": [
      "Q = ΔU + W",
      "Q = ΔU - W",
      "ΔU = Q + W",
      "W = Q * ΔU"
    ],
    "correct": 0,
    "explain": "The first law states conservation of energy: heat added Q equals change in internal energy ΔU plus work done by the system W (Q = ΔU + W).",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-18",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Medium",
    "q": "What is the theoretical efficiency of a Carnot heat engine operating between temperatures of 500 K and 300 K?",
    "options": [
      "40%",
      "60%",
      "20%",
      "50%"
    ],
    "correct": 0,
    "explain": "Efficiency η = 1 - (T_C / T_H) = 1 - (300 / 500) = 1 - 0.60 = 0.40 = 40%.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-19",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Medium",
    "q": "In an ideal reversible adiabatic process, what happens to the total entropy of the system?",
    "options": [
      "It remains constant (ΔS = 0)",
      "It increases continuously",
      "It decreases to absolute zero",
      "It fluctuates sinusoidally"
    ],
    "correct": 0,
    "explain": "An adiabatic reversible process has dQ = 0, hence dS = dQ / T = 0, making it an isentropic process.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-td-20",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Hard",
    "q": "For an ideal gas, what is the ratio of molar heat capacities γ = C_p / C_v for a diatomic gas like N₂ at moderate temperatures?",
    "options": [
      "1.40 (7/5)",
      "1.67 (5/3)",
      "1.33 (4/3)",
      "1.20"
    ],
    "correct": 0,
    "explain": "At room temperature, a diatomic gas has 5 degrees of freedom (3 translational + 2 rotational): C_v = 5/2 R, C_p = 7/2 R => γ = 7/5 = 1.40.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-16",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Easy",
    "q": "What is the SI unit of electric potential and electromotive force?",
    "options": [
      "Volt (J/C)",
      "Ampere",
      "Watt",
      "Ohm"
    ],
    "correct": 0,
    "explain": "Electric potential is defined as work done per unit charge: 1 Volt = 1 Joule per Coulomb (J/C).",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-17",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Easy",
    "q": "According to Gauss’s Law, the total electric flux through any closed Gaussian surface enclosing charge Q in vacuum is:",
    "options": [
      "Q / ε₀",
      "Q * ε₀",
      "Q / (4πε₀)",
      "zero always"
    ],
    "correct": 0,
    "explain": "Gauss’s law states that total electric flux Φ_E = ∮ E · dA = Q_enclosed / ε₀.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-18",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Medium",
    "q": "Two parallel conducting plates separated by 2 mm have a potential difference of 200 V between them. What is the electric field strength in the uniform region?",
    "options": [
      "100,000 V/m",
      "50,000 V/m",
      "400 V/m",
      "200,000 V/m"
    ],
    "correct": 0,
    "explain": "E = V / d = 200 V / (2 × 10⁻³ m) = 100,000 V/m = 1 × 10⁵ V/m.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-19",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Hard",
    "q": "What happens to the capacitance of a parallel plate capacitor when a dielectric slab of dielectric constant κ = 4 is inserted between its plates?",
    "options": [
      "It quadruples (increases by 4x)",
      "It decreases by a factor of 4",
      "It doubles",
      "It remains unchanged"
    ],
    "correct": 0,
    "explain": "Capacitance with dielectric is C = κ C₀. Inserting a dielectric of constant 4 multiplies capacitance by 4.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-es-20",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Hard",
    "q": "How much energy is stored in a 10 μF capacitor charged to a potential difference of 100 V?",
    "options": [
      "0.05 J",
      "0.10 J",
      "1.0 J",
      "0.01 J"
    ],
    "correct": 0,
    "explain": "U = (1/2) C $V^{2}$ = 0.5 * (10 × 10⁻⁶ F) * (100 V)^{2} = 0.5 * 10⁻⁵ * $10^{4}$ = 0.05 J.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-16",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Easy",
    "q": "Which law states that the current flowing through a conductor is directly proportional to the potential difference across its ends at constant temperature?",
    "options": [
      "Ohm’s Law",
      "Ampere’s Law",
      "Faraday’s Law",
      "Joule’s Law"
    ],
    "correct": 0,
    "explain": "Ohm’s law states that V = I R, indicating current is directly proportional to voltage at constant physical conditions.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-17",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Easy",
    "q": "Kirchhoff’s First Rule (Junction Rule, ΣI = 0) is a direct consequence of the law of conservation of:",
    "options": [
      "Electric charge",
      "Energy",
      "Linear momentum",
      "Magnetic flux"
    ],
    "correct": 0,
    "explain": "Kirchhoff’s junction rule asserts that the net charge entering a node equals the net charge leaving it, conserving electric charge.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-18",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Medium",
    "q": "Three resistors of resistances 3 Ω, 6 Ω, and 2 Ω are connected in parallel. What is their equivalent resistance?",
    "options": [
      "1.0 Ω",
      "11.0 Ω",
      "2.5 Ω",
      "0.5 Ω"
    ],
    "correct": 0,
    "explain": "1/R_eq = 1/3 + 1/6 + 1/2 = 2/6 + 1/6 + 3/6 = 6/6 = 1 \\implies R_eq = 1.0 Ω.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-19",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Medium",
    "q": "What is the condition for balance in a Wheatstone bridge with bridge arm resistors P, Q, R, and S?",
    "options": [
      "P / Q = R / S",
      "P * Q = R * S",
      "P + Q = R + S",
      "P / R = S / Q"
    ],
    "correct": 0,
    "explain": "When no galvanometer deflection occurs, the ratio of adjacent bridge arms is equal: P / Q = R / S.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ce-20",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Hard",
    "q": "A battery of emf E = 12 V and internal resistance r = 0.5 Ω is connected across an external load of R = 5.5 Ω. What is the terminal potential difference across the battery?",
    "options": [
      "11.0 V",
      "12.0 V",
      "10.5 V",
      "6.0 V"
    ],
    "correct": 0,
    "explain": "Current I = E / (R + r) = 12 / (5.5 + 0.5) = 12 / 6 = 2 A. Terminal voltage V_t = E - I r = 12 - 2(0.5) = 12 - 1 = 11.0 V.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-16",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Easy",
    "q": "What is the SI unit of magnetic flux density (magnetic field strength B)?",
    "options": [
      "Tesla (or Weber/$m^{2}$)",
      "Weber",
      "Henry",
      "Gauss"
    ],
    "correct": 0,
    "explain": "The SI unit of magnetic field B is the Tesla (T), where 1 T = 1 Wb/$m^{2}$ = 1 N/(A·m).",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-17",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Easy",
    "q": "What is the magnetic force on a charge q moving with velocity v parallel to a uniform magnetic field B?",
    "options": [
      "Zero",
      "q v B",
      "q B / v",
      "q $v^{2}$ B"
    ],
    "correct": 0,
    "explain": "F_B = q (v × B) = q v B sin(θ). For parallel motion, θ = $0^\\circ$ \\implies sin($0^\\circ$) = 0, so the force is zero.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-18",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Medium",
    "q": "What is the radius of the circular orbit of a charged particle of mass m and charge q entering perpendicular to a uniform magnetic field B with speed v?",
    "options": [
      "r = m v / (q B)",
      "r = q B / (m v)",
      "r = m $v^{2}$ / (q B)",
      "r = q v / (m B)"
    ],
    "correct": 0,
    "explain": "Equating centripetal force to magnetic Lorentz force: m $v^{2}$ / r = q v B \\implies r = m v / (q B).",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-19",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Hard",
    "q": "According to Ampere’s Circuital Law, the line integral of magnetic field B around a closed loop enclosing net current I is:",
    "options": [
      "∮ B · dl = μ₀ I",
      "∮ B · dl = I / μ₀",
      "∮ B · dl = ε₀ I",
      "∮ B · dl = 0"
    ],
    "correct": 0,
    "explain": "Ampere’s law states that ∮ B · dl = μ₀ I_enclosed.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-em-20",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Hard",
    "q": "How does the deflection sensitivity of a moving coil galvanometer change if the magnetic field B in the pole gap is doubled?",
    "options": [
      "It doubles",
      "It halves",
      "It quadruples",
      "It remains unchanged"
    ],
    "correct": 0,
    "explain": "Galvanometer deflection θ = (N B A / C) I. Deflection sensitivity θ/I = N B A / C, which is directly proportional to B.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-16",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Easy",
    "q": "Lenz’s Law, which determines the direction of an induced current, is a direct expression of the conservation of:",
    "options": [
      "Energy",
      "Charge",
      "Linear momentum",
      "Mass"
    ],
    "correct": 0,
    "explain": "Lenz’s law ensures that electrical energy is not created without performing mechanical work against the induced opposing magnetic force, conserving energy.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-17",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Easy",
    "q": "What is the SI unit of mutual inductance and self-inductance?",
    "options": [
      "Henry (H)",
      "Tesla",
      "Weber",
      "Farad"
    ],
    "correct": 0,
    "explain": "Inductance is measured in Henry (H), where 1 H = 1 V·s / A = 1 Wb / A.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-18",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Medium",
    "q": "A magnetic flux through a 50-turn coil changes uniformly from 0.4 Wb to 0.1 Wb in 0.2 seconds. What is the magnitude of the induced EMF?",
    "options": [
      "75 V",
      "150 V",
      "30 V",
      "15 V"
    ],
    "correct": 0,
    "explain": "|EMF| = N |ΔΦ / Δt| = 50 * |0.1 - 0.4| / 0.2 = 50 * (0.3 / 0.2) = 50 * 1.5 = 75 V.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-19",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Medium",
    "q": "What is the motional EMF induced in a conductor of length L moving at speed v perpendicular to a uniform magnetic field B?",
    "options": [
      "v B L",
      "$v^{2}$ B L",
      "v B / L",
      "B L / v"
    ],
    "correct": 0,
    "explain": "Motional EMF is given by ε = -v B L sin(θ). For perpendicular motion (θ = $90^\\circ$), ε = v B L.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emi-20",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Hard",
    "q": "How much energy is stored in the magnetic field of an inductor of L = 0.4 H carrying a steady current of 5 A?",
    "options": [
      "5.0 J",
      "10.0 J",
      "2.0 J",
      "1.0 J"
    ],
    "correct": 0,
    "explain": "U_B = (1/2) L $I^{2}$ = 0.5 * 0.4 * (5)^{2} = 0.2 * 25 = 5.0 J.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-16",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Easy",
    "q": "What is the root-mean-square (rms) value of a sinusoidal AC voltage with peak value V₀?",
    "options": [
      "V₀ / $\\sqrt{2}$ ≈ 0.707 V₀",
      "V₀ / 2",
      "2 V₀ / π",
      "$\\sqrt{2}$ V₀"
    ],
    "correct": 0,
    "explain": "For sinusoidal alternating waveforms, V_rms = V₀ / $\\sqrt{2}$ ≈ 0.707 V₀.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-17",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "In a purely inductive AC circuit, what is the phase relationship between voltage and current?",
    "options": [
      "Voltage leads current by $90^\\circ$ (π/2)",
      "Current leads voltage by $90^\\circ$",
      "Voltage and current are in phase",
      "Voltage and current are $180^\\circ$ out of phase"
    ],
    "correct": 0,
    "explain": "In an inductor, the induced back-EMF causes voltage to lead current by $90^\\circ$ (current lags voltage by $90^\\circ$).",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-18",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Medium",
    "q": "What is the capacitive reactance X_c of a capacitor C in an AC circuit operating at angular frequency ω?",
    "options": [
      "1 / (ω C)",
      "ω C",
      "ω / C",
      "1 / (ω² C)"
    ],
    "correct": 0,
    "explain": "Capacitive reactance is inversely proportional to frequency and capacitance: X_c = 1 / (ω C).",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-19",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "What is the resonant angular frequency ω₀ of a series RLC AC circuit?",
    "options": [
      "1 / $\\sqrt{L C}$",
      "$\\sqrt{L / C}$",
      "1 / (L C)",
      "$\\sqrt{C / L}$"
    ],
    "correct": 0,
    "explain": "At resonance, inductive and capacitive reactances cancel: ω₀ L = 1 / (ω₀ C) => ω₀² = 1 / (L C) => ω₀ = 1 / $\\sqrt{L C}$.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-ac-20",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Hard",
    "q": "An ideal step-down transformer has 1000 primary turns and 100 secondary turns. If the input primary voltage is 220 V, what is the output secondary voltage?",
    "options": [
      "22 V",
      "2200 V",
      "110 V",
      "44 V"
    ],
    "correct": 0,
    "explain": "V_s / V_p = N_s / N_p \\implies V_s = 220 * (100 / 1000) = 22 V.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-16",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Easy",
    "q": "What is the speed of all electromagnetic waves in vacuum?",
    "options": [
      "3.0 × 10⁸ m/s",
      "3.0 × 10⁶ m/s",
      "3.0 × $10^{10}$ m/s",
      "330 m/s"
    ],
    "correct": 0,
    "explain": "All electromagnetic radiations travel through vacuum at the universal speed of light c ≈ 3.0 × 10⁸ m/s.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-17",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Medium",
    "q": "Which Maxwell equation mathematically expresses that isolated magnetic monopoles do not exist in nature?",
    "options": [
      "Gauss’s Law for Magnetism (∮ B · dA = 0)",
      "Ampere-Maxwell Law",
      "Faraday’s Law of Induction",
      "Gauss’s Law for Electrostatics"
    ],
    "correct": 0,
    "explain": "Gauss’s law for magnetism states that the net magnetic flux through any closed Gaussian surface is identically zero (∮ B · dA = 0), confirming that magnetic field lines are continuous loops and isolated magnetic monopoles do not exist.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-18",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Medium",
    "q": "In an electromagnetic wave propagating in free space, what is the angle between the electric field vector E and magnetic field vector B?",
    "options": [
      "$90^\\circ$",
      "$0^\\circ$",
      "$180^\\circ$",
      "$45^\\circ$"
    ],
    "correct": 0,
    "explain": "In EM waves, E and B oscillate perpendicularly to each other ($90^\\circ$) and both are perpendicular to the propagation vector k.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-19",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Medium",
    "q": "What is the ratio of electric field amplitude E₀ to magnetic field amplitude B₀ in a vacuum electromagnetic wave?",
    "options": [
      "c (speed of light)",
      "1 / c",
      "$c^{2}$",
      "1 / $c^{2}$"
    ],
    "correct": 0,
    "explain": "Maxwell’s equations prove that E₀ / B₀ = c, where c is the speed of light in vacuum.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-emw-20",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Hard",
    "q": "Which physical quantity does the Poynting vector S = (1/μ₀) (E × B) represent in electromagnetic theory?",
    "options": [
      "Rate of electromagnetic energy flow per unit area (intensity)",
      "Total electric charge per unit volume",
      "Electrostatic energy density",
      "Magnetic scalar potential"
    ],
    "correct": 0,
    "explain": "The Poynting vector represents the directional energy flux density (power per unit cross-sectional area, W/$m^{2}$) carried by an EM wave.",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-16",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Easy",
    "q": "What is the ratio of tensile stress to tensile strain within the proportional elastic limit called?",
    "options": [
      "Young’s Modulus",
      "Bulk Modulus",
      "Shear Modulus",
      "Poisson’s Ratio"
    ],
    "correct": 0,
    "explain": "Young’s modulus Y = stress / strain defines the stiffness of a solid material subjected to linear tensile or compressive load.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-17",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Hard",
    "q": "Substances that completely lose their electrical resistance below a critical temperature T_c are known as:",
    "options": [
      "Superconductors",
      "Semiconductors",
      "Dielectrics",
      "Ferromagnetics"
    ],
    "correct": 0,
    "explain": "Superconductors exhibit zero DC electrical resistance and expel interior magnetic fields (Meissner effect) below T_c.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-18",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Medium",
    "q": "In terms of energy band theory, how is an electrical insulator characterized at absolute zero?",
    "options": [
      "A completely filled valence band, an empty conduction band, and a wide forbidden energy gap (> 3 eV)",
      "An overlapping conduction and valence band",
      "A partially filled valence band with no band gap",
      "A narrow band gap (< 1 eV)"
    ],
    "correct": 0,
    "explain": "Insulators have a completely full valence band and empty conduction band separated by a large forbidden energy gap (Eg > 3 to 5 eV).",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-19",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Hard",
    "q": "What type of magnetic behavior is exhibited by materials whose atomic dipoles align parallel to an applied magnetic field in macroscopic domains?",
    "options": [
      "Ferromagnetism",
      "Paramagnetism",
      "Diamagnetism",
      "Antiferromagnetism"
    ],
    "correct": 0,
    "explain": "Ferromagnetic materials (e.g., Fe, Co, Ni) feature spontaneous parallel domain alignment yielding strong magnetization.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-pos-20",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Hard",
    "q": "A wire of original length L and cross-sectional area A is stretched by an amount ΔL by a force F. What is the elastic strain energy stored in the wire?",
    "options": [
      "(1/2) F * ΔL",
      "F * ΔL",
      "(1/2) F / ΔL",
      "2 F * ΔL"
    ],
    "correct": 0,
    "explain": "Strain energy stored during elastic deformation is U = (1/2) * average force * extension = (1/2) F ΔL.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-16",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Easy",
    "q": "In an n-type semiconductor, which charge carriers constitute the majority carriers?",
    "options": [
      "Free conduction electrons",
      "Holes",
      "Positive donor ions",
      "Protons"
    ],
    "correct": 0,
    "explain": "Doping pure silicon with pentavalent impurities (e.g., Phosphorus) yields excess free conduction electrons as majority carriers.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-17",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Easy",
    "q": "What is the output of a two-input AND gate when both inputs are at logic level 1?",
    "options": [
      "1 (High)",
      "0 (Low)",
      "Undefined",
      "Alternating"
    ],
    "correct": 0,
    "explain": "An AND gate outputs 1 if and only if all its inputs are 1: 1 AND 1 = 1.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-18",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Medium",
    "q": "What happens to the width of the depletion region of a p-n junction under forward bias?",
    "options": [
      "It narrows (decreases)",
      "It widens (increases)",
      "It remains constant",
      "It completely reverses polarity"
    ],
    "correct": 0,
    "explain": "Forward bias opposes the internal built-in potential barrier, pushing majority carriers across and narrowing the depletion region.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-19",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Medium",
    "q": "In an operational amplifier (op-amp) connected as an inverting amplifier with input resistor R_in and feedback resistor R_f, what is the closed-loop voltage gain A_v?",
    "options": [
      "-R_f / R_in",
      "R_f / R_in",
      "1 + (R_f / R_in)",
      "-R_in / R_f"
    ],
    "correct": 0,
    "explain": "For an inverting op-amp configuration, closed-loop voltage gain is A_v = -R_f / R_in.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-el-20",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Hard",
    "q": "In a bipolar junction transistor (BJT) operating in the active amplification mode, which junction is forward-biased and which is reverse-biased?",
    "options": [
      "Emitter-base junction is forward-biased, collector-base junction is reverse-biased",
      "Emitter-base is reverse-biased, collector-base is forward-biased",
      "Both junctions are forward-biased",
      "Both junctions are reverse-biased"
    ],
    "correct": 0,
    "explain": "For active mode operation of a BJT, the emitter-base junction must be forward biased to inject carriers, and the collector-base junction must be reverse biased to collect them.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-16",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Easy",
    "q": "According to Einstein’s photoelectric equation, what does the threshold frequency f₀ represent?",
    "options": [
      "Minimum frequency of incident radiation required to eject electrons from a metal surface",
      "Maximum frequency of emitted photoelectrons",
      "Frequency at which kinetic energy is doubled",
      "Frequency where light speed becomes c"
    ],
    "correct": 0,
    "explain": "Threshold frequency f₀ is the minimum frequency of light capable of overcoming the work function Φ = h f₀ to eject a photoelectron.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-17",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Easy",
    "q": "What is the rest mass energy E₀ of an object of mass m₀ according to special relativity?",
    "options": [
      "m₀ $c^{2}$",
      "(1/2) m₀ $c^{2}$",
      "m₀ c",
      "m₀ $c^{3}$"
    ],
    "correct": 0,
    "explain": "Einstein’s mass-energy equivalence equation gives rest energy as E₀ = m₀ $c^{2}$.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-18",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Medium",
    "q": "What is the de Broglie wavelength λ of a particle of momentum p?",
    "options": [
      "λ = h / p",
      "λ = p / h",
      "λ = h * p",
      "λ = h / $p^{2}$"
    ],
    "correct": 0,
    "explain": "The de Broglie hypothesis relates matter wavelength to momentum by λ = h / p.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-19",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "In the Compton scattering effect, what is the Compton shift in wavelength Δλ when an X-ray photon is scattered at an angle θ = $90^\\circ$ by a stationary electron?",
    "options": [
      "h / (m_e c) ≈ 2.43 × 10^{-1}² m",
      "2 h / (m_e c)",
      "Zero",
      "h / (2 m_e c)"
    ],
    "correct": 0,
    "explain": "Δλ = [h / (m_e c)] (1 - cos θ). For θ = $90^\\circ$, cos($90^\\circ$) = 0, so Δλ = h / (m_e c) = 2.43 × 10^{-1}² m (the Compton wavelength).",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-dmp-20",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "According to Heisenberg’s Uncertainty Principle, what is the minimum value of Δx * Δp_x?",
    "options": [
      "h / (4π) (or ℏ/2)",
      "h / (2π)",
      "h",
      "2π / h"
    ],
    "correct": 0,
    "explain": "Heisenberg’s uncertainty principle specifies that Δx * Δp_x ≥ ℏ/2 = h / (4π).",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-16",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Easy",
    "q": "Which spectral series of the hydrogen atom falls in the visible region of the electromagnetic spectrum?",
    "options": [
      "Balmer series",
      "Lyman series",
      "Paschen series",
      "Brackett series"
    ],
    "correct": 0,
    "explain": "The Balmer series transitions to the n = 2 energy level fall in the visible wavelength range (400–700 nm).",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-17",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Easy",
    "q": "What is the ground state ionization potential of the hydrogen atom in electron-volts?",
    "options": [
      "13.6 eV",
      "-13.6 eV",
      "3.4 eV",
      "1.51 eV"
    ],
    "correct": 0,
    "explain": "The ground state energy of hydrogen is -13.6 eV. Therefore, +13.6 eV of energy is required to ionize it.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-18",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Medium",
    "q": "According to Bohr’s model, the orbital angular momentum L of an electron in stationary orbit n is quantized as:",
    "options": [
      "n h / (2π)",
      "$n^{2}$ h / (2π)",
      "h / (2π n)",
      "n h / π"
    ],
    "correct": 0,
    "explain": "Bohr’s quantization postulate specifies L = m v r = n ℏ = n h / (2π), where n = 1, 2, 3...",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-19",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Medium",
    "q": "How does the radius of the n-th Bohr orbit of hydrogen scale with the principal quantum number n?",
    "options": [
      "Directly proportional to $n^{2}$ (r_n ∝ $n^{2}$)",
      "Directly proportional to n (r_n ∝ n)",
      "Inversely proportional to n (r_n ∝ 1/n)",
      "Directly proportional to $\\sqrt{n}$"
    ],
    "correct": 0,
    "explain": "In Bohr’s theory, r_n = (ε₀ $n^{2}h^{2}$) / (π m $e^{2}$) = $n^{2}$ r₁, which is directly proportional to $n^{2}$.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-as-20",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Hard",
    "q": "What optical condition is essential to achieve population inversion in a laser medium?",
    "options": [
      "A metastable state with longer lifetime than normal excited states",
      "Spontaneous emission rate greater than stimulated emission",
      "Total internal absorption",
      "Zero optical pumping energy"
    ],
    "correct": 0,
    "explain": "A metastable state has an unusually long lifetime (~10⁻³ s vs 10⁻⁸ s), allowing atoms to accumulate and create population inversion.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-16",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Easy",
    "q": "What is an alpha (α) particle identical to?",
    "options": [
      "Helium-4 nucleus (2 protons and 2 neutrons)",
      "High-speed electron",
      "Electromagnetic photon",
      "Neutron"
    ],
    "correct": 0,
    "explain": "An alpha particle consists of two protons and two neutrons bound together, identical to a ⁴₂He nucleus.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-17",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Easy",
    "q": "What is the mass defect of a nucleus converted into when nucleons assemble to form a nucleus?",
    "options": [
      "Nuclear binding energy",
      "Gravitational potential energy",
      "Electrostatic repulsive energy",
      "Chemical bond energy"
    ],
    "correct": 0,
    "explain": "By mass-energy equivalence (ΔE = Δm $c^{2}$), the lost mass (mass defect) is released as nuclear binding energy.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-18",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Medium",
    "q": "A radioactive isotope has a half-life of 8 days. What fraction of the original sample remains undecayed after 24 days?",
    "options": [
      "1/8",
      "1/4",
      "1/16",
      "1/2"
    ],
    "correct": 0,
    "explain": "Number of half-lives n = 24 / 8 = 3. Remaining fraction = (1/2)^{3} = 1/8.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-19",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Hard",
    "q": "What is the relationship between the decay constant λ and half-life $T_{1/2}$ of a radioactive nuclide?",
    "options": [
      "$T_{1/2}$ = ln(2) / λ ≈ 0.693 / λ",
      "$T_{1/2}$ = λ / ln(2)",
      "$T_{1/2}$ = 1 / λ",
      "$T_{1/2}$ = 2 / λ"
    ],
    "correct": 0,
    "explain": "From N(t) = N₀ e^{-λt}: when N = N₀/2, $e^{λ $T_{1/2}$}$ = 2 \\implies $T_{1/2}$ = ln(2) / λ ≈ 0.693 / λ.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-np-20",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Hard",
    "q": "In a nuclear fission reaction of Uranium-235 triggered by a thermal neutron, what is typically produced alongside fission fragments?",
    "options": [
      "2 to 3 fast neutrons and approximately 200 MeV of energy",
      "Alpha particles and positrons",
      "Protons and antineutrinos",
      "Zero neutrons"
    ],
    "correct": 0,
    "explain": "U-235 fission yields middle-mass fission fragments, 2 to 3 fast neutrons that sustain a chain reaction, and ~200 MeV of energy.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-401",
    "subject": "Physics",
    "topic": "Measurements",
    "difficulty": "Easy",
    "q": "Which of the following physical quantities is classified as a base SI unit in the International System of Units?",
    "options": [
      "Kelvin",
      "Joule",
      "Newton",
      "Coulomb"
    ],
    "correct": 0,
    "explain": "Kelvin (K) is one of the seven fundamental SI base units for thermodynamic temperature. Joule, Newton, and Coulomb are derived units.",
    "chapter": "Measurements",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-402",
    "subject": "Physics",
    "topic": "Motion and Force",
    "difficulty": "Easy",
    "q": "A 1200 kg vehicle accelerates uniformly from rest to a velocity of 20 m/s in 10 seconds. What is the net force exerted on the vehicle?",
    "options": [
      "2400 N",
      "1200 N",
      "6000 N",
      "4800 N"
    ],
    "correct": 0,
    "explain": "Acceleration a = (v - u) / t = (20 - 0) / 10 = 2 m/$s^{2}$. Net force F = m*a = 1200 kg * 2 m/$s^{2}$ = 2400 N.",
    "chapter": "Motion and Force",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-403",
    "subject": "Physics",
    "topic": "Work and Energy",
    "difficulty": "Easy",
    "q": "How much work is done against gravity to elevate a 5 kg mass vertically to a height of 4 meters (taking g = 9.8 m/$s^{2}$)?",
    "options": [
      "196 J",
      "98 J",
      "49 J",
      "392 J"
    ],
    "correct": 0,
    "explain": "Work W = m*g*h = 5 kg * 9.8 m/$s^{2}$ * 4 m = 196 J.",
    "chapter": "Work and Energy",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-404",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Easy",
    "q": "What happens to the magnitude of the centripetal force acting on an orbiting mass if its linear orbital speed is doubled while the radius remains constant?",
    "options": [
      "It quadruples (increases by a factor of 4)",
      "It doubles",
      "It halves",
      "It remains unchanged"
    ],
    "correct": 0,
    "explain": "Centripetal force is F_c = m*$v^{2}$ / r. Because F_c is directly proportional to $v^{2}$, doubling v increases F_c by $(2)^{2}$ = 4 times.",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-405",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Easy",
    "q": "State the SI derived unit of electrical capacitance:",
    "options": [
      "Farad",
      "Henry",
      "Ohm",
      "Tesla"
    ],
    "correct": 0,
    "explain": "Capacitance C = Q/V is measured in Farads (F), which corresponds to Coulombs per Volt.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-406",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Easy",
    "q": "Three resistors of resistances 6 Ω, 3 Ω, and 2 Ω are connected in parallel. What is the equivalent resistance of the combination?",
    "options": [
      "1 Ω",
      "11 Ω",
      "2 Ω",
      "0.5 Ω"
    ],
    "correct": 0,
    "explain": "1/R_eq = 1/6 + 1/3 + 1/2 = 1/6 + 2/6 + 3/6 = 6/6 = 1 Ω^-1 \\implies R_eq = 1 Ω.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-407",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Easy",
    "q": "A sound wave propagating in air has a frequency of 680 Hz. If the speed of sound is 340 m/s, determine its wavelength.",
    "options": [
      "0.5 m",
      "2.0 m",
      "1.5 m",
      "0.25 m"
    ],
    "correct": 0,
    "explain": "Using the wave relation v = f * λ: λ = v / f = 340 / 680 = 0.5 m.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-408",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Easy",
    "q": "Which physical conservation law forms the theoretical foundation of Bernoulli's theorem for fluid flow?",
    "options": [
      "Law of Conservation of Energy",
      "Law of Conservation of Linear Momentum",
      "Law of Conservation of Angular Momentum",
      "Law of Conservation of Mass"
    ],
    "correct": 0,
    "explain": "Bernoulli's equation is fundamentally an expression of the law of conservation of mechanical energy applied to ideal flowing fluids.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-409",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Easy",
    "q": "The magnetic force acting on a point charge q moving with velocity v in an external magnetic field B is zero when:",
    "options": [
      "The velocity vector is parallel or antiparallel to the magnetic field",
      "The velocity vector is perpendicular to the magnetic field",
      "The charge moves at relativistic speed",
      "The magnetic field strength is doubled"
    ],
    "correct": 0,
    "explain": "F = q(v x B) = q*v*B*sin(θ). When v and B are parallel or antiparallel (θ = $0^\\circ$ or $180^\\circ$), sin(θ) = 0, so the force is zero.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-410",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Easy",
    "q": "What is the composition of an alpha (α) particle emitted during radioactive decay?",
    "options": [
      "Two protons and two neutrons (helium-4 nucleus)",
      "A high-energy electron",
      "A positron and neutrino",
      "A high-frequency photon"
    ],
    "correct": 0,
    "explain": "An alpha particle consists of two protons and two neutrons tightly bound, identical to the nucleus of a helium-4 atom.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-411",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Medium",
    "q": "An ideal heat engine absorbs 2000 J of thermal energy from a high-temperature reservoir at 500 K and exhausts heat to a low-temperature sink at 300 K. What is its Carnot thermodynamic efficiency?",
    "options": [
      "40%",
      "60%",
      "25%",
      "50%"
    ],
    "correct": 0,
    "explain": "Carnot efficiency η = 1 - (T_C / T_H) = 1 - (300 / 500) = 1 - 0.60 = 0.40 or 40%.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-412",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Medium",
    "q": "A simple harmonic oscillator has an amplitude A. At what displacement x from the equilibrium position is its kinetic energy exactly equal to its potential energy?",
    "options": [
      "A / $\\sqrt${2}",
      "A / 2",
      "A / 4",
      "A / $\\sqrt${3}"
    ],
    "correct": 0,
    "explain": "PE = (1/2)$kx^{2}$ and KE = (1/2)k($A^{2} -  x^{2}$). Setting PE = KE gives $x^{2} =  A^{2}$ - $x^{2} \\implies 2x^{2} =  A^{2}$ \\implies x = A / $\\sqrt${2}.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-413",
    "subject": "Physics",
    "topic": "Electromagnetic Induction",
    "difficulty": "Medium",
    "q": "A magnetic flux through a stationary coil of 50 turns changes uniformly from 0.8 Wb to 0.2 Wb in 0.1 seconds. Determine the magnitude of the induced electromotive force (EMF).",
    "options": [
      "300 V",
      "60 V",
      "150 V",
      "500 V"
    ],
    "correct": 0,
    "explain": "Faraday's law states |EMF| = N * |ΔΦ / Δt| = 50 * |(0.2 - 0.8) / 0.1| = 50 * (0.6 / 0.1) = 50 * 6 = 300 V.",
    "chapter": "Electromagnetic Induction",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-414",
    "subject": "Physics",
    "topic": "Alternating Current",
    "difficulty": "Medium",
    "q": "In a series RLC circuit at resonance, the inductive reactance is X_L = 250 Ω and resistance is R = 50 Ω. What is the total electrical impedance of the circuit?",
    "options": [
      "50 Ω",
      "250 Ω",
      "300 Ω",
      "0 Ω"
    ],
    "correct": 0,
    "explain": "At electrical resonance, inductive reactance equals capacitive reactance (X_L = X_C). Thus, the net reactance vanishes and impedance Z = R = 50 Ω.",
    "chapter": "Alternating Current",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-415",
    "subject": "Physics",
    "topic": "Physics of Solids",
    "difficulty": "Medium",
    "q": "A steel wire of length 2 m and cross-sectional area 1 x 10^-6 $m^{2}$ elongates by 1 mm under an axial tension of 100 N. Calculate the Young's modulus of the steel.",
    "options": [
      "2.0 x $10^{11}$ Pa",
      "1.0 x $10^{11}$ Pa",
      "5.0 x $10^{10}$ Pa",
      "4.0 x $10^{11}$ Pa"
    ],
    "correct": 0,
    "explain": "Stress = F/A = 100 / (1 x 10^-6) = 1 x $10^{8}$ Pa. Strain = ΔL / L = (1 x 10^-3) / 2 = 5 x 10^-4. Young's modulus Y = Stress / Strain = 1 x $10^{8}$ / 5 x 10^-4 = 2.0 x $10^{11}$ Pa.",
    "chapter": "Physics of Solids",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-416",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Medium",
    "q": "The work function of a metallic emitter is 2.5 eV. If incident monochromatic photons carry an energy of 4.1 eV, what is the maximum kinetic energy of the ejected photoelectrons?",
    "options": [
      "1.6 eV",
      "6.6 eV",
      "2.5 eV",
      "3.3 eV"
    ],
    "correct": 0,
    "explain": "By Einstein's photoelectric equation: K_max = hf - Φ = 4.1 eV - 2.5 eV = 1.6 eV.",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-417",
    "subject": "Physics",
    "topic": "Atomic Spectra",
    "difficulty": "Medium",
    "q": "Which spectral series of the hydrogen atom produces emission spectral lines lying entirely within the visible electromagnetic spectrum?",
    "options": [
      "Balmer series",
      "Lyman series",
      "Paschen series",
      "Brackett series"
    ],
    "correct": 0,
    "explain": "The Balmer series transitions to the n = 2 energy level emit electromagnetic radiation in the visible spectrum.",
    "chapter": "Atomic Spectra",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-418",
    "subject": "Physics",
    "topic": "Circular Motion",
    "difficulty": "Medium",
    "q": "A solid disk and a hollow ring of identical mass M and outer radius R roll down an inclined plane from rest without slipping. Which reaches the bottom first?",
    "options": [
      "The solid disk, because of its smaller moment of inertia",
      "The hollow ring, because of its larger moment of inertia",
      "Both reach the bottom simultaneously",
      "The ring reaches first because of higher rotational kinetic energy"
    ],
    "correct": 0,
    "explain": "Solid disk has I = (1/2)$MR^{2}$ whereas a ring has I = $MR^{2}$. Smaller rotational inertia yields greater linear acceleration: a = g*sin(θ)/(1 + I/$MR^{2}$).",
    "chapter": "Circular Motion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-419",
    "subject": "Physics",
    "topic": "Electrostatics",
    "difficulty": "Medium",
    "q": "Two parallel conducting plates separated by a distance d in air store an electrostatic potential difference V. If a dielectric slab with relative permittivity ε_r = 4 is inserted between the isolated plates, what is the new potential difference?",
    "options": [
      "V / 4",
      "4V",
      "V / 2",
      "2V"
    ],
    "correct": 0,
    "explain": "For an isolated capacitor, charge Q remains constant. Capacitance increases by factor ε_r (C' = 4C). Therefore, V' = Q / C' = V / 4.",
    "chapter": "Electrostatics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-420",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Medium",
    "q": "A radioactive radioisotope has a half-life of 8 days. If the initial activity of the sample is 640 Bq, what will be its activity after 24 days?",
    "options": [
      "80 Bq",
      "160 Bq",
      "40 Bq",
      "20 Bq"
    ],
    "correct": 0,
    "explain": "Number of half-lives n = 24 / 8 = 3. Remaining activity = A_0 / ($2^{n}$) = 640 / ($2^{3}$) = 640 / 8 = 80 Bq.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-421",
    "subject": "Physics",
    "topic": "Thermodynamics",
    "difficulty": "Hard",
    "q": "During an adiabatic expansion of an ideal gas with adiabatic index γ = 1.4, the volume increases by a factor of 4. By what factor does the absolute temperature change?",
    "options": [
      "$(1/4)^{0}$.4 ≈ 0.574",
      "$(1/4)^{1}$.4",
      "$4^{0}$.4",
      "Decreases by exactly half"
    ],
    "correct": 0,
    "explain": "For an adiabatic process, T * V^{γ - 1} = constant. Thus, $T_{2} /  T_{1}$ = (V_1 / V_2)^(γ - 1) = (1/4)^(1.4 - 1) = $(1/4)^{0}$.4 ≈ 0.574.",
    "chapter": "Thermodynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-422",
    "subject": "Physics",
    "topic": "Waves",
    "difficulty": "Hard",
    "q": "A stationary sound detector records a frequency of 550 Hz from an approaching ambulance moving at 34 m/s. Taking the speed of sound in air as 340 m/s, find the true emitter frequency.",
    "options": [
      "495 Hz",
      "500 Hz",
      "605 Hz",
      "510 Hz"
    ],
    "correct": 0,
    "explain": "By Doppler effect for a source approaching a stationary observer: f' = f * [v / (v - v_s)] => 550 = f * [340 / (340 - 34)] = f * [340 / 306] = f * [10 / 9] => f = 550 * 9 / 10 = 495 Hz.",
    "chapter": "Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-423",
    "subject": "Physics",
    "topic": "Electromagnetism",
    "difficulty": "Hard",
    "q": "A proton enters a uniform perpendicular magnetic field of 0.5 T with a kinetic energy of 3.2 x 10^-13 J. If m_p = 1.67 x 10^-27 kg and q = 1.6 x 10^-19 C, what is the radius of its circular trajectory?",
    "options": [
      "0.41 m",
      "0.82 m",
      "0.20 m",
      "1.64 m"
    ],
    "correct": 0,
    "explain": "Momentum p = $\\sqrt${2*m*KE} = $\\sqrt${2 * 1.67 x 10^-27 * 3.2 x 10^-13} = $\\sqrt${1.0688 x 10^-39} ≈ 3.27 x 10^-20 kg·m/s. Radius r = p / (q*B) = (3.27 x 10^-20) / (1.6 x 10^-19 * 0.5) = (3.27 x 10^-20) / (8.0 x 10^-20) ≈ 0.41 m.",
    "chapter": "Electromagnetism",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-424",
    "subject": "Physics",
    "topic": "Dawn of Modern Physics",
    "difficulty": "Hard",
    "q": "Calculate the de Broglie wavelength of an electron accelerated from rest across an electric potential difference of 100 Volts (h = 6.63 x 10^-34 J·s, m_e = 9.11 x 10^-31 kg, e = 1.6 x 10^-19 C).",
    "options": [
      "0.123 nm",
      "1.23 nm",
      "0.0123 nm",
      "12.3 nm"
    ],
    "correct": 0,
    "explain": "λ = h / $\\sqrt${2*m_e*e*V} = 1.227 / $\\sqrt${V} nm. For V = 100 V, λ = 1.227 / 10 = 0.1227 nm ≈ 0.123 nm (or 1.23 Å).",
    "chapter": "Dawn of Modern Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-425",
    "subject": "Physics",
    "topic": "Electronics",
    "difficulty": "Hard",
    "q": "In an operational amplifier inverting configuration with input resistor R_in = 10 kΩ and feedback resistor R_f = 220 kΩ, what is the closed-loop voltage gain?",
    "options": [
      "-22",
      "-0.045",
      "22",
      "-220"
    ],
    "correct": 0,
    "explain": "For an ideal op-amp in an inverting amplifier configuration, the closed-loop voltage gain is A_v = - R_f / R_in = - 220 kΩ / 10 kΩ = -22.",
    "chapter": "Electronics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-426",
    "subject": "Physics",
    "topic": "Fluid Dynamics",
    "difficulty": "Hard",
    "q": "A horizontal pipe carrying water tapers from a cross-sectional area of 40 $cm^{2}$ (where speed is 2 m/s and pressure is 2.0 x $10^{5}$ Pa) to a constriction of 10 $cm^{2}$. Find the static pressure at the constriction (water density = 1000 kg/$m^{3}$).",
    "options": [
      "1.7 x $10^{5}$ Pa",
      "1.4 x $10^{5}$ Pa",
      "2.3 x $10^{5}$ Pa",
      "1.1 x $10^{5}$ Pa"
    ],
    "correct": 0,
    "explain": "By continuity: A_1*v_1 = A_2*v_2 \\implies 40*2 = 10*v_2 \\implies v_2 = 8 m/s. By Bernoulli: P_1 + (1/2)ρv_1^2 = P_2 + (1/2)ρv_2^2 \\implies 2.0 x $10^{5}$ + 0.5(1000)(4) = P_2 + 0.5(1000)(64) \\implies 200,000 + 2000 = P_2 + 32,000 \\implies P_2 = 202,000 - 32,000 = 170,000 Pa = 1.7 x $10^{5}$ Pa.",
    "chapter": "Fluid Dynamics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-427",
    "subject": "Physics",
    "topic": "Oscillations",
    "difficulty": "Hard",
    "q": "A damped harmonic oscillator experiences a resistive damping force proportional to velocity (F_d = -b*v). The quality factor Q of the oscillator is directly proportional to:",
    "options": [
      "The stored energy divided by the energy dissipated per radian cycle",
      "The damping coefficient b",
      "The square of the damping force",
      "The period of oscillation divided by amplitude"
    ],
    "correct": 0,
    "explain": "The Q factor quantifies damping and is defined as Q = 2π * (Energy stored / Energy dissipated per cycle) = ω_0 * m / b.",
    "chapter": "Oscillations",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-428",
    "subject": "Physics",
    "topic": "Nuclear Physics",
    "difficulty": "Hard",
    "q": "The mass of a deuteron nucleus (^2H) is 2.01355 u, while the constituent masses are m_p = 1.00728 u and m_n = 1.00866 u. What is the nuclear binding energy of the deuteron (1 u = 931.5 MeV)?",
    "options": [
      "2.22 MeV",
      "1.11 MeV",
      "4.44 MeV",
      "8.79 MeV"
    ],
    "correct": 0,
    "explain": "Mass defect Δm = (1.00728 + 1.00866) - 2.01355 = 2.01594 - 2.01355 = 0.00239 u. Binding energy E_b = 0.00239 * 931.5 MeV ≈ 2.226 MeV ≈ 2.22 MeV.",
    "chapter": "Nuclear Physics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-429",
    "subject": "Physics",
    "topic": "Electromagnetic Waves",
    "difficulty": "Hard",
    "q": "The electric field amplitude of a plane electromagnetic wave propagating in free space is E_0 = 300 V/m. What is the amplitude of its corresponding magnetic field B_0 (c = 3.0 x $10^{8}$ m/s)?",
    "options": [
      "1.0 x 10^-6 T",
      "9.0 x $10^{10}$ T",
      "3.0 x 10^-6 T",
      "1.0 x 10^-4 T"
    ],
    "correct": 0,
    "explain": "In an electromagnetic wave in vacuum, E_0 / B_0 = c. Thus, B_0 = E_0 / c = 300 / (3.0 x $10^{8}$) = 1.0 x 10^-6 Tesla (1.0 μT).",
    "chapter": "Electromagnetic Waves",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-phy-430",
    "subject": "Physics",
    "topic": "Current Electricity",
    "difficulty": "Hard",
    "q": "A potentiometer wire of length 10 m has a uniform resistance of 20 Ω. It is connected in series with a 480 Ω resistor and a 5 V accumulator. What is the potential gradient along the wire?",
    "options": [
      "0.02 V/m",
      "0.2 V/m",
      "0.05 V/m",
      "0.5 V/m"
    ],
    "correct": 0,
    "explain": "Total circuit resistance R_tot = 20 + 480 = 500 Ω. Current I = 5 / 500 = 0.01 A. Voltage drop across the potentiometer wire V_wire = I * R_wire = 0.01 * 20 = 0.2 V. Potential gradient k = V_wire / L = 0.2 V / 10 m = 0.02 V/m.",
    "chapter": "Current Electricity",
    "universities": [
      "TCAT"
    ]
  }
];

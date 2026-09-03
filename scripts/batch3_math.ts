import { Question } from '../src/types';

// Batch 3 Mathematics: 100 brand new MCQs (34 Easy, 32 Medium, 34 Hard)
// Rebalancing all 19 official chapters
export const BATCH3_MATH: Question[] = [
  // =========================================================
  // Sets Functions and Groups (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-sfg-11',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Easy',
    q: 'If a binary operation * on a set S satisfies (a * b) * c = a * (b * c) for all a, b, c in S, the operation is called:',
    options: ['Associative', 'Commutative', 'Distributive', 'Idempotent'],
    correct: 0,
    explain: 'By definition, an operation is associative if grouping does not change the result: (a * b) * c = a * (b * c).'
  },
  {
    id: 'tcat-math-sfg-12',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Easy',
    q: 'What is the identity element in the group (Z, +) of integers under addition?',
    options: ['0', '1', '-1', 'Does not exist'],
    correct: 0,
    explain: 'For any integer a, a + 0 = 0 + a = a. Thus, 0 is the additive identity.'
  },
  {
    id: 'tcat-math-sfg-13',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Medium',
    q: 'A function f: A -> B is said to be bijective if and only if it is:',
    options: ['Both injective (one-to-one) and surjective (onto)', 'Only injective', 'Only surjective', 'Neither injective nor surjective'],
    correct: 0,
    explain: 'A bijection is a one-to-one correspondence, meaning the mapping is simultaneously injective and surjective.'
  },
  {
    id: 'tcat-math-sfg-14',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Medium',
    q: 'Under the operation of multiplication modulo 5 on the set {1, 2, 3, 4}, what is the inverse of 3?',
    options: ['2', '4', '1', '3'],
    correct: 0,
    explain: 'In multiplication mod 5, 3 * 2 = 6 = 1 (mod 5). Since the product equals the identity 1, the multiplicative inverse of 3 is 2.'
  },
  {
    id: 'tcat-math-sfg-15',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Hard',
    q: 'How many proper non-empty subsets does a finite set S with 5 elements possess?',
    options: ['30', '31', '32', '25'],
    correct: 0,
    explain: 'Total subsets = 2^5 = 32. Proper subsets exclude the set itself (32 - 1 = 31). Non-empty proper subsets also exclude the empty set (31 - 1 = 30).'
  },
  {
    id: 'tcat-math-sfg-16',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Hard',
    q: 'In any mathematical group (G, *), what is the inverse of the element (a * b)?',
    options: ['b^(-1) * a^(-1)', 'a^(-1) * b^(-1)', '(a * b)^(-1) does not exist', 'a * b^(-1)'],
    correct: 0,
    explain: 'By the shoes-and-socks property of groups, (a * b)^(-1) = b^(-1) * a^(-1) because (a * b) * (b^(-1) * a^(-1)) = a * (b * b^(-1)) * a^(-1) = a * e * a^(-1) = e.'
  },

  // =========================================================
  // Partial Fractions (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-pf-11',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Easy',
    q: 'A rational fraction P(x) / Q(x) is classified as an improper fraction when:',
    options: [
      'Degree of P(x) >= Degree of Q(x)',
      'Degree of P(x) < Degree of Q(x)',
      'Degree of P(x) = 0',
      'Q(x) is a linear polynomial'
    ],
    correct: 0,
    explain: 'A fraction P(x)/Q(x) is improper if the degree of the numerator polynomial P(x) is greater than or equal to the degree of the denominator Q(x).'
  },
  {
    id: 'tcat-math-pf-12',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Easy',
    q: 'For the fraction (2x + 1) / ((x - 2)(x + 3)), how many partial fraction terms are formed?',
    options: ['2', '3', '1', '4'],
    correct: 0,
    explain: 'The denominator has 2 distinct linear non-repeated factors, so the decomposition takes the form A/(x - 2) + B/(x + 3), which is 2 terms.'
  },
  {
    id: 'tcat-math-pf-13',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Medium',
    q: 'What is the correct form of the partial fraction decomposition for 1 / (x^2 (x + 1))?',
    options: [
      'A/x + B/x^2 + C/(x + 1)',
      'Ax / x^2 + B/(x + 1)',
      'A/x^2 + B/(x + 1)',
      '(Ax + B)/x^2 + C/(x + 1)'
    ],
    correct: 0,
    explain: 'For a repeated linear factor x^2, the terms must ascend in power: A/x + B/x^2, followed by C/(x + 1) for the distinct linear factor.'
  },
  {
    id: 'tcat-math-pf-14',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Medium',
    q: 'In the identity 1 / ((x - 1)(x + 2)) = A / (x - 1) + B / (x + 2), find the value of constant A.',
    options: ['1/3', '-1/3', '1', '2/3'],
    correct: 0,
    explain: 'Multiplying through by (x - 1)(x + 2) gives 1 = A(x + 2) + B(x - 1). Setting x = 1 yields 1 = A(3) => A = 1/3.'
  },
  {
    id: 'tcat-math-pf-15',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Hard',
    q: 'In decomposing (5x^2 - 2) / ((x^2 + 1)(x - 1)), what is the standard numerator chosen for the irreducible quadratic factor (x^2 + 1)?',
    options: ['Ax + B', 'A', 'Ax^2 + B', 'A / (x^2 + 1)'],
    correct: 0,
    explain: 'For an irreducible non-repeated quadratic factor (x^2 + 1) in the denominator, the corresponding partial fraction numerator is linear, namely (Ax + B).'
  },
  {
    id: 'tcat-math-pf-16',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Hard',
    q: 'Convert (x^3 + 1) / (x^2 - 1) into polynomial quotient plus proper rational fraction before partial fraction resolution:',
    options: ['x + (x + 1)/(x^2 - 1)', 'x + 1/(x^2 - 1)', 'x^2 + 1/(x - 1)', '1 + x/(x^2 - 1)'],
    correct: 0,
    explain: 'Dividing x^3 + 1 by x^2 - 1: x^3 = x(x^2 - 1) + x, so x^3 + 1 = x(x^2 - 1) + (x + 1). Hence (x^3 + 1)/(x^2 - 1) = x + (x + 1)/(x^2 - 1).'
  },

  // =========================================================
  // Mathematical Induction and Binomial Theorem (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-mibt-11',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Easy',
    q: 'What is the sum of the binomial coefficients in the expansion of (1 + x)^n?',
    options: ['2^n', '2^(n-1)', '2^(n+1)', 'n * 2^(n-1)'],
    correct: 0,
    explain: 'Putting x = 1 into (1 + x)^n gives (1 + 1)^n = 2^n = C(n,0) + C(n,1) + ... + C(n,n).'
  },
  {
    id: 'tcat-math-mibt-12',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Easy',
    q: 'The formula for the sum of the first n cubes, 1^3 + 2^3 + ... + n^3, is equal to:',
    options: ['[n(n + 1) / 2]^2', 'n(n + 1)(2n + 1) / 6', 'n^2(n + 1) / 2', '[n(n - 1) / 2]^2'],
    correct: 0,
    explain: 'By standard mathematical induction, the sum of cubes of first n natural numbers is [n(n + 1)/2]^2, which is the square of the sum of first n numbers.'
  },
  {
    id: 'tcat-math-mibt-13',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Medium',
    q: 'What is the general term T_(r+1) in the binomial expansion of (a + b)^n for a positive integer n?',
    options: ['C(n, r) * a^(n - r) * b^r', 'C(n, r) * a^r * b^(n - r)', 'C(n, r+1) * a^(n - r) * b^r', 'C(n, r) * a^(n - r - 1) * b^(r+1)'],
    correct: 0,
    explain: 'By the Binomial Theorem, the (r + 1)-th term is given by T_(r+1) = (n choose r) * a^(n - r) * b^r.'
  },
  {
    id: 'tcat-math-mibt-14',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Medium',
    q: 'Find the term independent of x in the expansion of (x + 1/x)^6.',
    options: ['20', '15', '6', '1'],
    correct: 0,
    explain: 'T_(r+1) = C(6, r) * x^(6 - r) * (x^(-1))^r = C(6, r) * x^(6 - 2r). For x^0, 6 - 2r = 0 => r = 3. T_4 = C(6, 3) = 6!/(3!3!) = 20.'
  },
  {
    id: 'tcat-math-mibt-15',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Hard',
    q: 'The expansion of (1 - x)^(-2) is valid only when:',
    options: ['|x| < 1', '|x| <= 1', 'x > 1', 'For all real numbers x'],
    correct: 0,
    explain: 'For any non-positive or fractional exponent, the infinite binomial series (1 + y)^n converges if and only if |y| < 1. Here |-x| = |x| < 1.'
  },
  {
    id: 'tcat-math-mibt-16',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Hard',
    q: 'In the expansion of (1 + 2x)^(-1), what is the coefficient of x^3?',
    options: ['-8', '8', '-6', '6'],
    correct: 0,
    explain: '(1 + y)^(-1) = 1 - y + y^2 - y^3 + ... With y = 2x, the term is -(2x)^3 = -8x^3. So the coefficient of x^3 is -8.'
  },

  // =========================================================
  // Fundamentals of Trigonometry (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-fot-11',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Easy',
    q: 'How many radians are there in a complete revolution of 360 degrees?',
    options: ['2π rad', 'π rad', 'π/2 rad', '4π rad'],
    correct: 0,
    explain: '180° = π radians, therefore a full rotation of 360° is equal to 2π radians.'
  },
  {
    id: 'tcat-math-fot-12',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Easy',
    q: 'In which quadrant are both sin(θ) < 0 and cos(θ) < 0?',
    options: ['Quadrant III', 'Quadrant II', 'Quadrant IV', 'Quadrant I'],
    correct: 0,
    explain: 'In Quadrant III, both x-coordinate (cosine) and y-coordinate (sine) are negative (tangent is positive).'
  },
  {
    id: 'tcat-math-fot-13',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Medium',
    q: 'Find the length of an arc of a circle of radius 6 cm subtended by a central angle of 2.5 radians.',
    options: ['15 cm', '12 cm', '18 cm', '8.5 cm'],
    correct: 0,
    explain: 'Arc length l = r * θ = 6 cm * 2.5 rad = 15 cm.'
  },
  {
    id: 'tcat-math-fot-14',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Medium',
    q: 'What is the area of a circular sector with radius r = 4 cm and central angle θ = π/4 radians?',
    options: ['2π cm²', '4π cm²', 'π cm²', '8π cm²'],
    correct: 0,
    explain: 'Area of sector = (1/2) * r^2 * θ = (1/2) * (16) * (π/4) = 2π cm².'
  },
  {
    id: 'tcat-math-fot-15',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Hard',
    q: 'If cot(θ) = 5/12 and the terminal ray of θ lies in Quadrant III, what is the exact value of cosec(θ)?',
    options: ['-13/12', '13/12', '-13/5', '12/13'],
    correct: 0,
    explain: 'cot(θ) = 5/12 => tan(θ) = 12/5. In Q III, both sin and cos are negative. Opp = -12, Adj = -5, Hyp = sqrt((-12)^2 + (-5)^2) = 13. sin(θ) = -12/13, so cosec(θ) = 1/sin(θ) = -13/12.'
  },
  {
    id: 'tcat-math-fot-16',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Hard',
    q: 'The value of the trigonometric ratio sec(-300°) is equal to:',
    options: ['2', '-2', '2 / sqrt(3)', '-2 / sqrt(3)'],
    correct: 0,
    explain: 'sec(-θ) = sec(θ). sec(300°) = 1 / cos(300°). cos(300°) = cos(360° - 60°) = cos(60°) = 1/2. Thus, sec(-300°) = 1 / (1/2) = 2.'
  },

  // =========================================================
  // Trigonometric Identities (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-ti-11',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Easy',
    q: 'Which of the following fundamental identities is correct for all real angles θ?',
    options: ['1 + tan²(θ) = sec²(θ)', '1 - sin²(θ) = -cos²(θ)', '1 + cot²(θ) = tan²(θ)', 'sec²(θ) - cosec²(θ) = 1'],
    correct: 0,
    explain: 'Dividing sin²(θ) + cos²(θ) = 1 by cos²(θ) gives tan²(θ) + 1 = sec²(θ).'
  },
  {
    id: 'tcat-math-ti-12',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Easy',
    q: 'Express sin(2α) in terms of single-angle functions sin(α) and cos(α):',
    options: ['2 sin(α) cos(α)', 'sin²(α) - cos²(α)', '2 sin(α)', 'cos²(α) - sin²(α)'],
    correct: 0,
    explain: 'The double angle formula for sine is sin(2α) = 2 sin(α) cos(α).'
  },
  {
    id: 'tcat-math-ti-13',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Medium',
    q: 'What is the value of cos(75°)?',
    options: ['(sqrt(6) - sqrt(2)) / 4', '(sqrt(6) + sqrt(2)) / 4', '(sqrt(3) - 1) / 2', '(sqrt(3) + 1) / 2'],
    correct: 0,
    explain: 'cos(75°) = cos(45° + 30°) = cos(45°)cos(30°) - sin(45°)sin(30°) = (1/sqrt(2))(sqrt(3)/2) - (1/sqrt(2))(1/2) = (sqrt(6) - sqrt(2))/4.'
  },
  {
    id: 'tcat-math-ti-14',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Medium',
    q: 'Convert the product 2 sin(5θ) cos(3θ) into a sum of sines:',
    options: ['sin(8θ) + sin(2θ)', 'sin(8θ) - sin(2θ)', 'cos(8θ) + cos(2θ)', 'cos(8θ) - cos(2θ)'],
    correct: 0,
    explain: 'Using 2 sin(A) cos(B) = sin(A + B) + sin(A - B): 2 sin(5θ) cos(3θ) = sin(5θ + 3θ) + sin(5θ - 3θ) = sin(8θ) + sin(2θ).'
  },
  {
    id: 'tcat-math-ti-15',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Hard',
    q: 'What is the exact value of tan(15°)?',
    options: ['2 - sqrt(3)', '2 + sqrt(3)', 'sqrt(3) - 1', '1 - sqrt(3)'],
    correct: 0,
    explain: 'tan(15°) = tan(45° - 30°) = (1 - 1/sqrt(3)) / (1 + 1/sqrt(3)) = (sqrt(3) - 1)/(sqrt(3) + 1). Multiplying by (sqrt(3) - 1): (4 - 2*sqrt(3))/2 = 2 - sqrt(3).'
  },
  {
    id: 'tcat-math-ti-16',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Hard',
    q: 'The expression (sin(3θ) - sin(θ)) / (cos(3θ) + cos(θ)) simplifies to:',
    options: ['tan(θ)', 'cot(θ)', 'tan(2θ)', 'cot(2θ)'],
    correct: 0,
    explain: 'sin(3θ) - sin(θ) = 2 cos(2θ) sin(θ). cos(3θ) + cos(θ) = 2 cos(2θ) cos(θ). Ratio = [2 cos(2θ) sin(θ)] / [2 cos(2θ) cos(θ)] = sin(θ)/cos(θ) = tan(θ).'
  },

  // =========================================================
  // Trigonometric Functions and Graphs (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-tfg-11',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Easy',
    q: 'What is the fundamental period of the tangent function y = tan(x)?',
    options: ['π', '2π', 'π/2', '4π'],
    correct: 0,
    explain: 'The tangent and cotangent functions have a fundamental period of π radians, whereas sine and cosine have a period of 2π.'
  },
  {
    id: 'tcat-math-tfg-12',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Easy',
    q: 'What is the amplitude of the sinusoidal function f(x) = -4 cos(3x + π/2)?',
    options: ['4', '-4', '3', '2'],
    correct: 0,
    explain: 'The amplitude of A cos(kx + φ) is given by the absolute value |A|. Here |-4| = 4.'
  },
  {
    id: 'tcat-math-tfg-13',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Medium',
    q: 'Find the period of the function f(x) = 3 cos(4x - π).',
    options: ['π/2', 'π/4', '2π', '4π'],
    correct: 0,
    explain: 'Period of cos(kx) is 2π / |k|. Here k = 4, so the period is 2π / 4 = π/2.'
  },
  {
    id: 'tcat-math-tfg-14',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Medium',
    q: 'What is the principal range of the inverse cosine function y = arccos(x)?',
    options: ['[0, π]', '[-π/2, π/2]', '(-π/2, π/2)', '[0, 2π]'],
    correct: 0,
    explain: 'To make cosine bijective, its domain is restricted to [0, π], which becomes the range of y = arccos(x).'
  },
  {
    id: 'tcat-math-tfg-15',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Hard',
    q: 'Evaluate: sin(arctan(4/3)).',
    options: ['4/5', '3/5', '3/4', '5/4'],
    correct: 0,
    explain: 'Let θ = arctan(4/3). Then tan(θ) = 4/3 (opposite = 4, adjacent = 3). Hypotenuse = sqrt(4^2 + 3^2) = 5. Therefore sin(θ) = 4/5.'
  },
  {
    id: 'tcat-math-tfg-16',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Hard',
    q: 'Find the number of solutions of the equation sin(2x) = 1 in the closed interval [0, 2π].',
    options: ['2', '1', '4', '0'],
    correct: 0,
    explain: 'For x in [0, 2π], 2x is in [0, 4π]. sin(2x) = 1 when 2x = π/2 or 2x = 5π/2. Thus x = π/4 and x = 5π/4, giving exactly 2 solutions.'
  },

  // =========================================================
  // Application of Trigonometry (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-aot-11',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Easy',
    q: 'According to the Law of Sines for any triangle ABC, the ratio a / sin(α) is equal to:',
    options: ['2R (where R is the circumradius)', 'R', 'r (inradius)', 'Δ (area)'],
    correct: 0,
    explain: 'By the extended Law of Sines: a/sin(α) = b/sin(β) = c/sin(γ) = 2R, where R is the radius of the circumcircle.'
  },
  {
    id: 'tcat-math-aot-12',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Easy',
    q: 'In a triangle ABC, the formula for inradius r is:',
    options: ['Δ / s', 's / Δ', 'abc / (4Δ)', 'Δ / (s - a)'],
    correct: 0,
    explain: 'The inradius of a triangle is given by r = Δ / s, where Δ is the area and s is the semi-perimeter.'
  },
  {
    id: 'tcat-math-aot-13',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Medium',
    q: 'In a right triangle with hypotenuse 10 m and an acute angle of 30°, what is the length of the side opposite to the 30° angle?',
    options: ['5 m', '5 * sqrt(3) m', '10 * sqrt(3) m', '2.5 m'],
    correct: 0,
    explain: 'sin(30°) = Opposite / Hypotenuse => 1/2 = Opp / 10 => Opposite = 5 m.'
  },
  {
    id: 'tcat-math-aot-14',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Medium',
    q: 'If the sides of a triangle are a = 5, b = 6, and c = 7, find the semi-perimeter s.',
    options: ['9', '18', '8.5', '12'],
    correct: 0,
    explain: 'Semi-perimeter s = (a + b + c) / 2 = (5 + 6 + 7) / 2 = 18 / 2 = 9.'
  },
  {
    id: 'tcat-math-aot-15',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Hard',
    q: 'In triangle ABC, if a = 3, b = 4, and c = 5, what is the radius R of its circumscribed circle?',
    options: ['2.5', '5', '1.25', '1.5'],
    correct: 0,
    explain: 'Since 3^2 + 4^2 = 5^2, this is a right triangle with hypotenuse c = 5. In any right-angled triangle, the circumcentre is the midpoint of the hypotenuse, so R = c / 2 = 5 / 2 = 2.5.'
  },
  {
    id: 'tcat-math-aot-16',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Hard',
    q: 'An observer standing 50 m from the base of a vertical tower notes an angle of elevation of 45° to the top. What is the height of the tower?',
    options: ['50 m', '25 m', '50 * sqrt(3) m', '100 m'],
    correct: 0,
    explain: 'tan(45°) = height / distance => 1 = h / 50 => h = 50 m.'
  },

  // =========================================================
  // Linear Inequalities and Linear Programming (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-lilp-11',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Easy',
    q: 'If -3x < 12, what is the resulting inequality after dividing both sides by -3?',
    options: ['x > -4', 'x < -4', 'x >= -4', 'x <= 4'],
    correct: 0,
    explain: 'Dividing or multiplying an inequality by a negative number reverses the direction of the inequality sign: x > 12 / (-3) => x > -4.'
  },
  {
    id: 'tcat-math-lilp-12',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Easy',
    q: 'In linear programming, the non-negativity constraints x >= 0, y >= 0 restrict the feasible region to which quadrant?',
    options: ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'],
    correct: 0,
    explain: 'Both x >= 0 and y >= 0 describe the first quadrant of the Cartesian coordinate plane.'
  },
  {
    id: 'tcat-math-lilp-13',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Medium',
    q: 'Does the origin (0, 0) satisfy the linear inequality 2x - 3y <= 6?',
    options: ['Yes, because 0 <= 6 is true', 'No, because 0 > 6', 'Only if x > 0', 'Cannot be determined'],
    correct: 0,
    explain: 'Substituting (0, 0): 2(0) - 3(0) = 0 <= 6, which is a true statement; hence the origin lies inside the solution half-plane.'
  },
  {
    id: 'tcat-math-lilp-14',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Medium',
    q: 'A point where two boundary lines of the feasible region intersect is termed a:',
    options: ['Corner point (or vertex)', 'Midpoint', 'Origin', 'Saddle point'],
    correct: 0,
    explain: 'The intersection of boundary lines bounding a feasible region is known as a corner point or extreme point.'
  },
  {
    id: 'tcat-math-lilp-15',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Hard',
    q: 'Maximize the objective function f(x, y) = 3x + 2y subject to corner points (0, 0), (4, 0), (2, 3), and (0, 4).',
    options: ['12 (at both (4, 0) and (2, 3))', '8', '14', '10'],
    correct: 0,
    explain: 'f(0, 0) = 0; f(4, 0) = 3(4) + 2(0) = 12; f(2, 3) = 3(2) + 2(3) = 6 + 6 = 12; f(0, 4) = 3(0) + 2(4) = 8. Maximum value is 12.'
  },
  {
    id: 'tcat-math-lilp-16',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Hard',
    q: 'According to the Fundamental Theorem of Linear Programming, where does the optimal value of a linear objective function occur?',
    options: [
      'At one or more corner points (vertices) of the feasible region',
      'At the geometric center of the feasible region',
      'Always strictly at the origin',
      'Outside the feasible boundary'
    ],
    correct: 0,
    explain: 'A linear function defined on a convex polygon achieves its global maximum and minimum at the extreme/corner points of the region.'
  },

  // =========================================================
  // Vectors (+6: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-vec-11',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Easy',
    q: 'What is the magnitude of the 3D position vector r = 2i - 3j + 6k?',
    options: ['7', 'sqrt(11)', '49', '5'],
    correct: 0,
    explain: '|r| = sqrt(2^2 + (-3)^2 + 6^2) = sqrt(4 + 9 + 36) = sqrt(49) = 7.'
  },
  {
    id: 'tcat-math-vec-12',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Easy',
    q: 'What is the unit vector in the direction of the vector v = 3i - 4j?',
    options: ['(3/5)i - (4/5)j', '(3/7)i - (4/7)j', '3i - 4j', '(4/5)i - (3/5)j'],
    correct: 0,
    explain: 'The unit vector is v / |v|. Magnitude |v| = sqrt(3^2 + (-4)^2) = 5. Hence v_hat = (3/5)i - (4/5)j.'
  },
  {
    id: 'tcat-math-vec-13',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Medium',
    q: 'Compute the scalar projection of vector a = 3i + 4j onto vector b = i.',
    options: ['3', '4', '5', '3/5'],
    correct: 0,
    explain: 'Scalar projection of a onto b = (a · b) / |b| = (3*1 + 4*0) / 1 = 3.'
  },
  {
    id: 'tcat-math-vec-14',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Medium',
    q: 'Evaluate the cross product: k x j.',
    options: ['-i', 'i', '0', 'k'],
    correct: 0,
    explain: 'In the right-handed cyclic system, j x k = i, so k x j = -(j x k) = -i.'
  },
  {
    id: 'tcat-math-vec-15',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Hard',
    q: 'What is the area of a parallelogram having adjacent side vectors a = 2i + j - k and b = i - j + 2k?',
    options: ['sqrt(35)', 'sqrt(27)', '6', 'sqrt(14)'],
    correct: 0,
    explain: 'a x b = i(2 - 1) - j(4 - (-1)) + k(-2 - 1) = i - 5j - 3k. Magnitude |a x b| = sqrt(1^2 + (-5)^2 + (-3)^2) = sqrt(1 + 25 + 9) = sqrt(35).'
  },
  {
    id: 'tcat-math-vec-16',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Hard',
    q: 'If the vectors u = i + j, v = j + k, and w = i + λk are coplanar, find the value of λ.',
    options: ['-1', '1', '0', '2'],
    correct: 0,
    explain: 'Vectors are coplanar when their scalar triple product is zero: det([[1, 1, 0], [0, 1, 1], [1, 0, λ]]) = 1(λ - 0) - 1(0 - 1) = λ + 1 = 0 => λ = -1.'
  },

  // =========================================================
  // Number Systems (+5: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-ns-12',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Easy',
    q: 'The set of rational numbers Q and irrational numbers Q\' are:',
    options: ['Disjoint sets whose union is the set of real numbers R', 'Identical sets', 'Subsets of integers', 'Intersecting sets with infinite common elements'],
    correct: 0,
    explain: 'Every real number is either rational or irrational, and no number can be both: Q ∩ Q\' = ∅ and Q ∪ Q\' = R.'
  },
  {
    id: 'tcat-math-ns-13',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Easy',
    q: 'What is the absolute value (modulus) of the complex number z = -6 + 8i?',
    options: ['10', '14', '2', '100'],
    correct: 0,
    explain: '|z| = sqrt((-6)^2 + 8^2) = sqrt(36 + 64) = sqrt(100) = 10.'
  },
  {
    id: 'tcat-math-ns-14',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Medium',
    q: 'What is the polar form of the complex number z = 1 + i*sqrt(3)?',
    options: ['2(cos(π/3) + i sin(π/3))', '2(cos(π/6) + i sin(π/6))', 'sqrt(2)(cos(π/4) + i sin(π/4))', 'cos(π/3) + i sin(π/3)'],
    correct: 0,
    explain: 'r = sqrt(1^2 + (sqrt(3))^2) = 2. θ = arctan(sqrt(3)/1) = π/3. Thus z = 2(cos(π/3) + i sin(π/3)).'
  },
  {
    id: 'tcat-math-ns-15',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Hard',
    q: 'According to De Moivre\'s Theorem, for any integer n, (cos(θ) + i sin(θ))^n equals:',
    options: ['cos(nθ) + i sin(nθ)', 'cos^n(θ) + i sin^n(θ)', 'n cos(θ) + i n sin(θ)', 'cos(θ/n) + i sin(θ/n)'],
    correct: 0,
    explain: 'De Moivre\'s theorem states that (cos(θ) + i sin(θ))^n = cos(nθ) + i sin(nθ) for all rational numbers n.'
  },
  {
    id: 'tcat-math-ns-16',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Hard',
    q: 'If ω is a complex cube root of unity, what is the value of 1 + ω + ω^2?',
    options: ['0', '1', '-1', '3'],
    correct: 0,
    explain: 'The sum of all three cube roots of unity (1, ω, ω^2) is always equal to 0: 1 + ω + ω^2 = 0.'
  },

  // =========================================================
  // Matrices and Determinants (+5: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-math-md-12',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Easy',
    q: 'A square matrix A is classified as symmetric if and only if:',
    options: ['A^t = A', 'A^t = -A', 'det(A) = 0', 'A^(-1) = A'],
    correct: 0,
    explain: 'A matrix equals its transpose (A^t = A) if and only if it is a symmetric matrix.'
  },
  {
    id: 'tcat-math-md-13',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Easy',
    q: 'What is the determinant of a 2x2 identity matrix I_2?',
    options: ['1', '0', '2', '-1'],
    correct: 0,
    explain: 'det([[1, 0], [0, 1]]) = (1)(1) - (0)(0) = 1.'
  },
  {
    id: 'tcat-math-md-14',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Medium',
    q: 'If A is a 3x3 matrix and det(A) = 4, what is the value of det(2A)?',
    options: ['32', '8', '16', '64'],
    correct: 0,
    explain: 'For an n x n matrix, det(k*A) = k^n * det(A). For n = 3 and k = 2, det(2A) = 2^3 * 4 = 8 * 4 = 32.'
  },
  {
    id: 'tcat-math-md-15',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Medium',
    q: 'Find the inverse of the matrix A = [[2, 0], [0, 3]].',
    options: ['[[1/2, 0], [0, 1/3]]', '[[1/3, 0], [0, 1/2]]', '[[3, 0], [0, 2]]', '[[-2, 0], [0, -3]]'],
    correct: 0,
    explain: 'The inverse of a diagonal matrix is formed by taking the reciprocal of each non-zero diagonal entry: diag(1/2, 1/3).'
  },
  {
    id: 'tcat-math-md-16',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Hard',
    q: 'If the determinant of the matrix [[1, x], [4, 8]] is equal to 0, what is the value of x?',
    options: ['2', '4', '8', '0'],
    correct: 0,
    explain: 'det = (1)(8) - (4)(x) = 8 - 4x = 0 => 4x = 8 => x = 2.'
  },

  // =========================================================
  // Quadratic Equations (+5: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-qe-12',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Easy',
    q: 'What is the sum of the roots of the quadratic equation 3x^2 - 12x + 7 = 0?',
    options: ['4', '-4', '7/3', '-7/3'],
    correct: 0,
    explain: 'Sum of roots = -b / a = -(-12) / 3 = 12 / 3 = 4.'
  },
  {
    id: 'tcat-math-qe-13',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Medium',
    q: 'For what value of k does the quadratic equation x^2 - 6x + k = 0 have equal (repeated) real roots?',
    options: ['9', '36', '3', '6'],
    correct: 0,
    explain: 'Roots are equal when discriminant b^2 - 4ac = 0. (-6)^2 - 4(1)(k) = 0 => 36 - 4k = 0 => k = 9.'
  },
  {
    id: 'tcat-math-qe-14',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Medium',
    q: 'If α and β are roots of x^2 - 5x + 6 = 0, form the quadratic equation whose roots are 2α and 2β.',
    options: ['x^2 - 10x + 24 = 0', 'x^2 - 10x + 12 = 0', 'x^2 - 5x + 24 = 0', 'x^2 - 20x + 24 = 0'],
    correct: 0,
    explain: 'New sum S = 2(α + β) = 2(5) = 10. New product P = (2α)(2β) = 4(αβ) = 4(6) = 24. Equation: x^2 - Sx + P = x^2 - 10x + 24 = 0.'
  },
  {
    id: 'tcat-math-qe-15',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Hard',
    q: 'According to the Remainder Theorem, when polynomial P(x) = 2x^3 - 3x^2 + 4x - 5 is divided by (x - 2), what is the remainder?',
    options: ['7', '5', '3', '-1'],
    correct: 0,
    explain: 'Remainder R = P(2) = 2(2)^3 - 3(2)^2 + 4(2) - 5 = 2(8) - 3(4) + 8 - 5 = 16 - 12 + 8 - 5 = 7.'
  },
  {
    id: 'tcat-math-qe-16',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Hard',
    q: 'If the roots of ax^2 + bx + c = 0 are reciprocal to each other, which condition must hold true?',
    options: ['a = c', 'b = 0', 'a = -c', 'b^2 = 4ac'],
    correct: 0,
    explain: 'Product of roots = α * (1/α) = 1. But product = c/a. Hence c/a = 1 => a = c.'
  },

  // =========================================================
  // Sequences and Series (+5: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-ss-12',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Easy',
    q: 'What is the 10th term of the arithmetic progression with first term a = 3 and common difference d = 4?',
    options: ['39', '43', '36', '40'],
    correct: 0,
    explain: 'a_n = a + (n - 1)d => a_10 = 3 + (9)(4) = 3 + 36 = 39.'
  },
  {
    id: 'tcat-math-ss-13',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Easy',
    q: 'What is the sum to infinity of a geometric series with first term a = 4 and common ratio r = 1/2?',
    options: ['8', '6', '16', '4'],
    correct: 0,
    explain: 'S_∞ = a / (1 - r) = 4 / (1 - 1/2) = 4 / (1/2) = 8.'
  },
  {
    id: 'tcat-math-ss-14',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Medium',
    q: 'What is the Harmonic Mean (HM) between two positive real numbers a = 2 and b = 6?',
    options: ['3', '4', '3.5', 'sqrt(12)'],
    correct: 0,
    explain: 'HM = 2ab / (a + b) = 2(2)(6) / (2 + 6) = 24 / 8 = 3.'
  },
  {
    id: 'tcat-math-ss-15',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Hard',
    q: 'For any two distinct positive real numbers, which inequality relationship strictly holds between AM, GM, and HM?',
    options: ['AM > GM > HM', 'HM > GM > AM', 'GM > AM > HM', 'AM = GM = HM'],
    correct: 0,
    explain: 'For distinct positive real numbers, the Arithmetic Mean is strictly greater than the Geometric Mean, which is strictly greater than the Harmonic Mean (AM > GM > HM).'
  },
  {
    id: 'tcat-math-ss-16',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Hard',
    q: 'If the n-th term of an arithmetic sequence is a_n = 5n - 3, what is the sum of its first 20 terms?',
    options: ['990', '1000', '950', '1050'],
    correct: 0,
    explain: 'a_1 = 5(1) - 3 = 2. a_20 = 5(20) - 3 = 97. Sum S_20 = (n/2)(a_1 + a_n) = (20/2)(2 + 97) = 10 * 99 = 990.'
  },

  // =========================================================
  // Permutation Combination and Probability (+5: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-math-pcp-12',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Easy',
    q: 'In how many different orders can 5 distinct books be arranged on a single shelf?',
    options: ['120', '60', '24', '20'],
    correct: 0,
    explain: 'The number of arrangements of 5 distinct items is 5! = 5 * 4 * 3 * 2 * 1 = 120.'
  },
  {
    id: 'tcat-math-pcp-13',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Easy',
    q: 'What is the probability of rolling a prime number on a single fair six-sided die?',
    options: ['1/2', '1/3', '2/3', '1/6'],
    correct: 0,
    explain: 'Prime outcomes on a standard die are {2, 3, 5} (3 outcomes out of 6). Probability = 3/6 = 1/2.'
  },
  {
    id: 'tcat-math-pcp-14',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Medium',
    q: 'In how many ways can a delegation committee of 3 engineers be selected from a department of 8 engineers?',
    options: ['56', '336', '24', '112'],
    correct: 0,
    explain: 'Selection order does not matter: C(8, 3) = 8! / (3! * 5!) = (8 * 7 * 6) / (3 * 2 * 1) = 56.'
  },
  {
    id: 'tcat-math-pcp-15',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Medium',
    q: 'If two fair coins are tossed simultaneously, what is the probability of obtaining at least one Head?',
    options: ['3/4', '1/2', '1/4', '1'],
    correct: 0,
    explain: 'Sample space = {HH, HT, TH, TT} (4 outcomes). Outcomes with at least one head = {HH, HT, TH} (3 outcomes). P = 3/4.'
  },
  {
    id: 'tcat-math-pcp-16',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Hard',
    q: 'For two independent events A and B with P(A) = 0.4 and P(B) = 0.5, what is the probability of their union P(A ∪ B)?',
    options: ['0.7', '0.9', '0.2', '0.6'],
    correct: 0,
    explain: 'For independent events, P(A ∩ B) = P(A) * P(B) = 0.4 * 0.5 = 0.20. Then P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.4 + 0.5 - 0.2 = 0.7.'
  },

  // =========================================================
  // Functions and Limits (+5: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-fl-12',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Easy',
    q: 'A real function f(x) is classified as an even function if for all x in its domain:',
    options: ['f(-x) = f(x)', 'f(-x) = -f(x)', 'f(1/x) = f(x)', 'f(x) = f\'(x)'],
    correct: 0,
    explain: 'By definition, f(x) is an even function if f(-x) = f(x) for all x in the domain.'
  },
  {
    id: 'tcat-math-fl-13',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Medium',
    q: 'Evaluate the limit: lim_(x -> 0) [sin(5x) / x].',
    options: ['5', '1', '0', '1/5'],
    correct: 0,
    explain: 'lim_(x -> 0) [sin(kx) / x] = k * lim_(kx -> 0) [sin(kx) / (kx)] = k * 1 = 5.'
  },
  {
    id: 'tcat-math-fl-14',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Medium',
    q: 'Evaluate the limit: lim_(x -> ∞) [(3x^2 + 5x) / (2x^2 - 7)].',
    options: ['3/2', '0', '∞', '5/2'],
    correct: 0,
    explain: 'Dividing numerator and denominator by highest power x^2 gives (3 + 5/x)/(2 - 7/x^2) -> 3/2 as x -> ∞.'
  },
  {
    id: 'tcat-math-fl-15',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Hard',
    q: 'What is the domain of the real-valued function f(x) = sqrt(16 - x^2)?',
    options: ['[-4, 4]', '(-∞, -4] ∪ [4, ∞)', '[0, 4]', '(-4, 4)'],
    correct: 0,
    explain: 'For real values, the radicand must be non-negative: 16 - x^2 >= 0 => x^2 <= 16 => -4 <= x <= 4.'
  },
  {
    id: 'tcat-math-fl-16',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Hard',
    q: 'Evaluate the limit: lim_(n -> ∞) (1 + 1/n)^(3n).',
    options: ['e^3', 'e', '3e', '1'],
    correct: 0,
    explain: 'Using the fundamental definition lim_(n -> ∞) (1 + 1/n)^n = e, we have [(1 + 1/n)^n]^3 -> e^3.'
  },

  // =========================================================
  // Differentiation (+4: 1 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-diff-12',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Easy',
    q: 'What is the derivative with respect to x of y = e^(4x)?',
    options: ['4 e^(4x)', 'e^(4x)', '(1/4) e^(4x)', '4x e^(4x - 1)'],
    correct: 0,
    explain: 'By chain rule, d/dx [e^(kx)] = k * e^(kx). Here k = 4, giving 4 e^(4x).'
  },
  {
    id: 'tcat-math-diff-13',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Medium',
    q: 'Find the derivative of y = ln(sec(x)).',
    options: ['tan(x)', 'sec(x)', 'cot(x)', 'sec(x) tan(x)'],
    correct: 0,
    explain: 'd/dx [ln(sec(x))] = (1/sec(x)) * d/dx[sec(x)] = (1/sec(x)) * sec(x) tan(x) = tan(x).'
  },
  {
    id: 'tcat-math-diff-14',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Hard',
    q: 'At what point does the function f(x) = x^3 - 3x have a local maximum?',
    options: ['x = -1', 'x = 1', 'x = 0', 'x = 3'],
    correct: 0,
    explain: 'f\'(x) = 3x^2 - 3 = 0 => x = ±1. f\'\'(x) = 6x. For x = -1, f\'\'(-1) = -6 < 0 (local maximum). For x = 1, f\'\'(1) = 6 > 0 (local minimum).'
  },
  {
    id: 'tcat-math-diff-15',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Hard',
    q: 'According to Maclaurin\'s series expansion, what is the coefficient of x^2 for f(x) = cos(x)?',
    options: ['-1/2', '1/2', '-1/6', '0'],
    correct: 0,
    explain: 'cos(x) = 1 - x^2/2! + x^4/4! - ... The coefficient of x^2 is -1/2! = -1/2.'
  },

  // =========================================================
  // Integration (+4: 1 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-int-12',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Easy',
    q: 'What is the indefinite integral ∫ sec^2(x) dx?',
    options: ['tan(x) + C', '-cot(x) + C', 'sec(x) + C', '2 sec(x) tan(x) + C'],
    correct: 0,
    explain: 'Since d/dx [tan(x)] = sec^2(x), the anti-derivative ∫ sec^2(x) dx is tan(x) + C.'
  },
  {
    id: 'tcat-math-int-13',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Medium',
    q: 'Evaluate the definite integral ∫ from 0 to π/2 of cos(x) dx.',
    options: ['1', '0', '-1', 'π/2'],
    correct: 0,
    explain: '∫ cos(x) dx = [sin(x)] from 0 to π/2 = sin(π/2) - sin(0) = 1 - 0 = 1.'
  },
  {
    id: 'tcat-math-int-14',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Hard',
    q: 'Evaluate the indefinite integral: ∫ x * e^x dx.',
    options: ['(x - 1) e^x + C', '(x + 1) e^x + C', 'x^2 e^x / 2 + C', 'x e^x + C'],
    correct: 0,
    explain: 'Using integration by parts ∫ u v\' dx = u v - ∫ u\' v dx with u = x, v\' = e^x: x e^x - ∫ e^x dx = x e^x - e^x + C = (x - 1)e^x + C.'
  },
  {
    id: 'tcat-math-int-15',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Hard',
    q: 'Evaluate the definite integral: ∫ from 0 to 1 of 1 / (1 + x^2) dx.',
    options: ['π/4', 'π/2', '1', 'π'],
    correct: 0,
    explain: '∫ 1/(1 + x^2) dx = [arctan(x)] from 0 to 1 = arctan(1) - arctan(0) = π/4 - 0 = π/4.'
  },

  // =========================================================
  // Introduction to Analytic Geometry (+4: 2 Easy, 1 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-math-iag-12',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Easy',
    q: 'What is the slope of the straight line 4x - 2y + 7 = 0?',
    options: ['2', '-2', '1/2', '-7/2'],
    correct: 0,
    explain: 'Rewriting in slope-intercept form: 2y = 4x + 7 => y = 2x + 7/2. The slope m is 2.'
  },
  {
    id: 'tcat-math-iag-13',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Easy',
    q: 'What is the perpendicular distance from the origin (0, 0) to the line 3x + 4y - 15 = 0?',
    options: ['3', '5', '15', '4'],
    correct: 0,
    explain: 'Distance d = |a*x0 + b*y0 + c| / sqrt(a^2 + b^2) = |0 + 0 - 15| / sqrt(3^2 + 4^2) = 15 / 5 = 3.'
  },
  {
    id: 'tcat-math-iag-14',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Medium',
    q: 'Find the equation of the line passing through (1, 2) with slope m = 3.',
    options: ['3x - y - 1 = 0', '3x + y - 5 = 0', 'x - 3y + 5 = 0', '3x - y + 1 = 0'],
    correct: 0,
    explain: 'y - y1 = m(x - x1) => y - 2 = 3(x - 1) => y - 2 = 3x - 3 => 3x - y - 1 = 0.'
  },
  {
    id: 'tcat-math-iag-15',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Hard',
    q: 'Two lines with slopes m1 and m2 are perpendicular if and only if:',
    options: ['m1 * m2 = -1', 'm1 = m2', 'm1 * m2 = 1', 'm1 + m2 = 0'],
    correct: 0,
    explain: 'Condition for perpendicularity of two non-vertical lines is m1 * m2 = -1 (product of slopes equals -1).'
  },

  // =========================================================
  // Conic Sections (+4: 2 Easy, 1 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-math-cs-12',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Easy',
    q: 'What is the eccentricity e of any parabola?',
    options: ['e = 1', 'e < 1', 'e > 1', 'e = 0'],
    correct: 0,
    explain: 'By geometric definition, a parabola is the locus of a point whose distance from the focus equals its distance from the directrix, giving an eccentricity e = 1.'
  },
  {
    id: 'tcat-math-cs-13',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Easy',
    q: 'What is the coordinates of the focus of the standard parabola y^2 = 12x?',
    options: ['(3, 0)', '(0, 3)', '(12, 0)', '(6, 0)'],
    correct: 0,
    explain: 'Comparing with y^2 = 4ax: 4a = 12 => a = 3. The focus lies at (a, 0) = (3, 0).'
  },
  {
    id: 'tcat-math-cs-14',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Medium',
    q: 'Find the length of the latus rectum of the ellipse x^2/25 + y^2/9 = 1.',
    options: ['18/5', '50/3', '9/5', '18'],
    correct: 0,
    explain: 'Here a^2 = 25 (a = 5) and b^2 = 9. The length of the latus rectum is 2b^2 / a = 2(9) / 5 = 18/5.'
  },
  {
    id: 'tcat-math-cs-15',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Hard',
    q: 'What type of conic section is represented by the general equation x^2/16 - y^2/9 = 1?',
    options: ['Hyperbola', 'Ellipse', 'Parabola', 'Circle'],
    correct: 0,
    explain: 'An equation of the form x^2/a^2 - y^2/b^2 = 1 represents a horizontal hyperbola with eccentricity e > 1.'
  }
];

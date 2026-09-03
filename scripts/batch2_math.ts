import { Question } from '../src/types';

export const BATCH2_MATH: Question[] = [
  // =========================================================
  // Chapter 1: Number Systems (6 MCQs: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-ns-6',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Easy',
    q: 'Every non-terminating and non-periodic decimal fraction represents which type of number?',
    options: ['An irrational number', 'A rational number', 'An integer', 'A prime number'],
    correct: 0,
    explain: 'Non-terminating and non-repeating (non-periodic) decimals cannot be expressed as p/q where p, q are integers and q != 0, so they represent irrational numbers.'
  },
  {
    id: 'tcat-math-ns-7',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Easy',
    q: 'What is the additive inverse of the complex number z = -4 + 7i?',
    options: ['4 - 7i', '-4 - 7i', '4 + 7i', '7 - 4i'],
    correct: 0,
    explain: 'The additive inverse of a complex number z = a + bi is -z = -a - bi. For z = -4 + 7i, -z = 4 - 7i.'
  },
  {
    id: 'tcat-math-ns-8',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Medium',
    q: 'Find the multiplicative inverse of the complex number z = (1, 2) in ordered pair notation.',
    options: ['(1/5, -2/5)', '(-1/5, 2/5)', '(1/3, -2/3)', '(-1/5, -2/5)'],
    correct: 0,
    explain: 'For z = (a, b), the multiplicative inverse is (a / (a^2 + b^2), -b / (a^2 + b^2)). Here a = 1, b = 2, so a^2 + b^2 = 5, yielding (1/5, -2/5).'
  },
  {
    id: 'tcat-math-ns-9',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Medium',
    q: 'Simplify the algebraic expression: (1 + i)^4.',
    options: ['-4', '4', '4i', '-4i'],
    correct: 0,
    explain: '(1 + i)^2 = 1 + 2i + i^2 = 2i. Therefore, (1 + i)^4 = (2i)^2 = 4i^2 = -4.'
  },
  {
    id: 'tcat-math-ns-10',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Hard',
    q: 'According to De Moivre\'s theorem, what is the value of (cos(theta) + i*sin(theta))^n when n is a negative integer -m (where m is positive)?',
    options: ['cos(m*theta) - i*sin(m*theta)', 'cos(m*theta) + i*sin(m*theta)', '-cos(m*theta) - i*sin(m*theta)', '-cos(m*theta) + i*sin(m*theta)'],
    correct: 0,
    explain: '(cos(theta) + i*sin(theta))^(-m) = cos(-m*theta) + i*sin(-m*theta) = cos(m*theta) - i*sin(m*theta) because cosine is an even function and sine is odd.'
  },
  {
    id: 'tcat-math-ns-11',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Hard',
    q: 'What is the principal argument Arg(z) of the complex number z = -sqrt(3) + i?',
    options: ['5*pi/6', '2*pi/3', '-5*pi/6', '7*pi/6'],
    correct: 0,
    explain: 'The point (-sqrt(3), 1) lies in the second quadrant. The reference angle is alpha = arctan(|1 / -sqrt(3)|) = pi/6. Thus, Arg(z) = pi - pi/6 = 5*pi/6.'
  },

  // =========================================================
  // Chapter 2: Sets Functions and Groups (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-sfg-6',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Easy',
    q: 'If a finite set A contains 5 distinct elements, how many proper subsets does A possess?',
    options: ['31', '32', '25', '16'],
    correct: 0,
    explain: 'The total number of subsets for a set with n elements is 2^n = 2^5 = 32. The number of proper subsets excludes the set itself: 2^n - 1 = 31.'
  },
  {
    id: 'tcat-math-sfg-7',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Medium',
    q: 'Let f: R -> R be defined by f(x) = 3x - 5. What is the inverse function f^(-1)(x)?',
    options: ['(x + 5)/3', '(x - 5)/3', '3/(x + 5)', '(5 - x)/3'],
    correct: 0,
    explain: 'Let y = 3x - 5. Solving for x in terms of y yields 3x = y + 5 => x = (y + 5)/3. Therefore, f^(-1)(x) = (x + 5)/3.'
  },
  {
    id: 'tcat-math-sfg-8',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Medium',
    q: 'Which axiom is NOT required for an algebraic structure (S, *) to qualify as a semi-group?',
    options: ['Existence of an identity element', 'Closure property', 'Associative property', 'Well-defined binary operation'],
    correct: 0,
    explain: 'A semi-group requires only closure and associativity. An identity element is required for a monoid, not a general semi-group.'
  },
  {
    id: 'tcat-math-sfg-9',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Hard',
    q: 'In any group (G, *), what is the inverse of the compound element (a * b) for all a, b in G?',
    options: ['b^(-1) * a^(-1)', 'a^(-1) * b^(-1)', '(a * b)^(-1)', 'b * a'],
    correct: 0,
    explain: 'By the reversal law of inverses in abstract algebra, (a * b)^(-1) = b^(-1) * a^(-1).'
  },
  {
    id: 'tcat-math-sfg-10',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Hard',
    q: 'What is the order of the cyclic group formed by the fourth roots of unity {1, -1, i, -i} under complex multiplication?',
    options: ['4', '2', '1', 'Infinite'],
    correct: 0,
    explain: 'The set {1, -1, i, -i} has 4 elements and is generated by i (i^1=i, i^2=-1, i^3=-i, i^4=1). Its group order is 4.'
  },

  // =========================================================
  // Chapter 3: Matrices and Determinants (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-math-mat-7',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Easy',
    q: 'If A is a square matrix of order n such that A^t = -A, then matrix A is called a:',
    options: ['Skew-symmetric matrix', 'Symmetric matrix', 'Orthogonal matrix', 'Hermitian matrix'],
    correct: 0,
    explain: 'A matrix A is skew-symmetric if its transpose equals its negative (A^t = -A), with all principal diagonal entries equal to zero.'
  },
  {
    id: 'tcat-math-mat-8',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Medium',
    q: 'If A is a 3x3 matrix with determinant |A| = 4, what is the determinant of the scalar multiple 2A?',
    options: ['32', '8', '16', '64'],
    correct: 0,
    explain: 'For an n x n matrix, |k*A| = k^n * |A|. Here n = 3 and k = 2, so |2A| = 2^3 * 4 = 8 * 4 = 32.'
  },
  {
    id: 'tcat-math-mat-9',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Hard',
    q: 'If A is a non-singular square matrix of order 3 with determinant |A| = 3, what is the determinant of adj(A)?',
    options: ['9', '3', '27', '1/3'],
    correct: 0,
    explain: 'For any n x n matrix A, |adj(A)| = |A|^(n - 1). For n = 3, |adj(A)| = |A|^2 = 3^2 = 9.'
  },
  {
    id: 'tcat-math-mat-10',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Hard',
    q: 'What is the rank of the matrix A = [[1, 2, 3], [2, 4, 6], [3, 6, 9]]?',
    options: ['1', '2', '3', '0'],
    correct: 0,
    explain: 'Rows 2 and 3 are exact scalar multiples of Row 1 (R2 = 2*R1, R3 = 3*R1). In row echelon form, two rows reduce to zeros, leaving exactly 1 non-zero row.'
  },
  {
    id: 'tcat-math-mat-11',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Hard',
    q: 'If A and B are symmetric matrices of the same order, under what condition is the product AB also symmetric?',
    options: ['AB = BA (matrices commute)', 'A = B', 'AB = -BA', '|A| = |B|'],
    correct: 0,
    explain: '(AB)^t = B^t * A^t = BA. For AB to be symmetric, (AB)^t must equal AB, meaning BA = AB (the matrices must commute).'
  },

  // =========================================================
  // Chapter 4: Quadratic Equations (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-quad-7',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Easy',
    q: 'What is the nature of the roots of the quadratic equation 3x^2 - 4x + 2 = 0?',
    options: ['Complex and unequal', 'Real, rational and equal', 'Real, irrational and unequal', 'Real, rational and unequal'],
    correct: 0,
    explain: 'Discriminant Delta = b^2 - 4ac = (-4)^2 - 4(3)(2) = 16 - 24 = -8. Since Delta < 0, roots are complex conjugate and unequal.'
  },
  {
    id: 'tcat-math-quad-8',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Medium',
    q: 'If the sum of the roots of k*x^2 - 6x + 2k = 0 is equal to their product, find the value of k (where k != 0).',
    options: ['3', '2', '6', '1/3'],
    correct: 0,
    explain: 'Sum of roots = -(-6)/k = 6/k. Product of roots = 2k/k = 2. Setting 6/k = 2 gives k = 3.'
  },
  {
    id: 'tcat-math-quad-9',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Medium',
    q: 'If alpha and beta are the roots of x^2 - 5x + 6 = 0, what is the numerical value of alpha^2 + beta^2?',
    options: ['13', '25', '19', '37'],
    correct: 0,
    explain: 'alpha + beta = 5 and alpha * beta = 6. Then alpha^2 + beta^2 = (alpha + beta)^2 - 2*alpha*beta = 25 - 2(6) = 13.'
  },
  {
    id: 'tcat-math-quad-10',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Hard',
    q: 'Find the quadratic equation whose roots are the reciprocals of the roots of ax^2 + bx + c = 0 (where a, c != 0).',
    options: ['cx^2 + bx + a = 0', 'cx^2 - bx + a = 0', 'ax^2 - bx + c = 0', 'cx^2 + ax + b = 0'],
    correct: 0,
    explain: 'Substituting x by 1/x: a(1/x)^2 + b(1/x) + c = 0. Multiplying through by x^2 yields cx^2 + bx + a = 0.'
  },
  {
    id: 'tcat-math-quad-11',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Hard',
    q: 'If omega is an imaginary cube root of unity, simplify the expression: (2 + 5*omega + 2*omega^2)^6.',
    options: ['729', '-729', '243', '64'],
    correct: 0,
    explain: 'Rewrite as 2(1 + omega^2) + 5*omega. Since 1 + omega + omega^2 = 0, 1 + omega^2 = -omega. So 2(-omega) + 5*omega = 3*omega. Raising to power 6 gives (3*omega)^6 = 3^6 * omega^6 = 729 * 1 = 729.'
  },

  // =========================================================
  // Chapter 5: Partial Fractions (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-pf-6',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Easy',
    q: 'Which of the following rational expressions represents an improper fraction?',
    options: ['(x^3 + 1) / (x^2 + 4)', '(x + 1) / (x^2 + 4)', '(2x - 3) / (x^3 - 1)', '1 / (x + 2)'],
    correct: 0,
    explain: 'A rational fraction is improper when the degree of the numerator polynomial is greater than or equal to the degree of the denominator polynomial. Degree 3 >= 2.'
  },
  {
    id: 'tcat-math-pf-7',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Easy',
    q: 'How many partial fractions will the proper rational fraction 1 / [(x - 1)(x + 2)(x - 3)] decompose into?',
    options: ['3', '2', '4', '1'],
    correct: 0,
    explain: 'The denominator contains 3 distinct non-repeated linear factors, producing 3 terms: A/(x - 1) + B/(x + 2) + C/(x - 3).'
  },
  {
    id: 'tcat-math-pf-8',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Medium',
    q: 'Find the constant A in the partial fraction expansion: 1 / [(x - 2)(x + 3)] = A/(x - 2) + B/(x + 3).',
    options: ['1/5', '-1/5', '1', '1/6'],
    correct: 0,
    explain: 'Using the cover-up rule for A: multiply by (x - 2) and evaluate at x = 2: A = 1 / (2 + 3) = 1/5.'
  },
  {
    id: 'tcat-math-pf-9',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Hard',
    q: 'What is the correct partial fraction decomposition form for (x^2 + 1) / [(x - 1)^2 * (x^2 + 3)]?',
    options: [
      'A/(x - 1) + B/(x - 1)^2 + (Cx + D)/(x^2 + 3)',
      'A/(x - 1) + B/(x^2 + 3)',
      'A/(x - 1)^2 + (Bx + C)/(x^2 + 3)',
      'A/(x - 1) + B/(x - 1)^2 + C/(x^2 + 3)'
    ],
    correct: 0,
    explain: 'Repeated linear factor (x - 1)^2 gives A/(x - 1) + B/(x - 1)^2, and irreducible quadratic factor (x^2 + 3) requires (Cx + D)/(x^2 + 3).'
  },
  {
    id: 'tcat-math-pf-10',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Hard',
    q: 'If (x^3) / (x^2 - 1) is converted to proper rational form by polynomial division, what is the quotient polynomial?',
    options: ['x', 'x + 1', '1', 'x^2'],
    correct: 0,
    explain: 'Dividing x^3 by (x^2 - 1): x^3 = x*(x^2 - 1) + x. Thus (x^3)/(x^2 - 1) = x + x/(x^2 - 1). The quotient polynomial is x.'
  },

  // =========================================================
  // Chapter 6: Sequences and Series (6 MCQs: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-seq-6',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Easy',
    q: 'What is the common ratio r of the geometric progression: 2, -6, 18, -54, ...?',
    options: ['-3', '3', '-1/3', '-4'],
    correct: 0,
    explain: 'The common ratio is r = a2 / a1 = -6 / 2 = -3.'
  },
  {
    id: 'tcat-math-seq-7',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Easy',
    q: 'What is the Harmonic Mean (HM) between the two positive numbers 2 and 8?',
    options: ['3.2', '5', '4', '3.5'],
    correct: 0,
    explain: 'HM = 2ab / (a + b) = 2(2)(8) / (2 + 8) = 32 / 10 = 3.2.'
  },
  {
    id: 'tcat-math-seq-8',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Medium',
    q: 'For what range of x does the infinite geometric series 1 + x + x^2 + ... converge?',
    options: ['|x| < 1', '|x| <= 1', 'x > 1', 'For all real x'],
    correct: 0,
    explain: 'An infinite geometric series converges if and only if the absolute value of the common ratio |r| < 1. Here r = x, so |x| < 1.'
  },
  {
    id: 'tcat-math-seq-9',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Medium',
    q: 'If the sum of n terms of an arithmetic progression is S_n = 2n^2 + 3n, find the 5th term a_5.',
    options: ['21', '25', '19', '17'],
    correct: 0,
    explain: 'a_n = S_n - S_{n-1}. S_5 = 2(25) + 3(5) = 65. S_4 = 2(16) + 3(4) = 44. Thus a_5 = 65 - 44 = 21.'
  },
  {
    id: 'tcat-math-seq-10',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Hard',
    q: 'What is the closed-form sum of squares of the first n natural numbers 1^2 + 2^2 + 3^2 + ... + n^2?',
    options: ['n(n + 1)(2n + 1) / 6', '[n(n + 1) / 2]^2', 'n(n + 1) / 2', 'n(2n + 1) / 3'],
    correct: 0,
    explain: 'The formula for the sum of the squares of the first n natural numbers is Sigma k^2 = n(n + 1)(2n + 1) / 6.'
  },
  {
    id: 'tcat-math-seq-11',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Hard',
    q: 'If A, G, and H are the Arithmetic, Geometric, and Harmonic means between two distinct positive numbers, which relationship holds strictly true?',
    options: ['A > G > H', 'A < G < H', 'G > A > H', 'A = G = H'],
    correct: 0,
    explain: 'For any two unequal positive real numbers, A > G > H, with G^2 = A * H.'
  },

  // =========================================================
  // Chapter 7: Permutation Combination and Probability (6 MCQs: 1 Easy, 2 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-math-pcp-6',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Easy',
    q: 'What is the numerical value of 0! (zero factorial)?',
    options: ['1', '0', 'Undefined', '-1'],
    correct: 0,
    explain: 'By mathematical definition and convention in combinatorics, 0! = 1.'
  },
  {
    id: 'tcat-math-pcp-7',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Medium',
    q: 'How many different 4-letter words can be formed using the letters of the word "MATHS" without repetition?',
    options: ['120', '24', '60', '720'],
    correct: 0,
    explain: '5P4 = 5! / (5 - 4)! = 120 / 1 = 120.'
  },
  {
    id: 'tcat-math-pcp-8',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Medium',
    q: 'A single card is drawn from a standard deck of 52 playing cards. What is the probability of drawing either a King or a Heart?',
    options: ['4/13', '17/52', '1/4', '9/52'],
    correct: 0,
    explain: 'There are 4 Kings and 13 Hearts, with 1 card being the King of Hearts. By addition rule: P = 4/52 + 13/52 - 1/52 = 16/52 = 4/13.'
  },
  {
    id: 'tcat-math-pcp-9',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Hard',
    q: 'In how many ways can 6 beads of different colors be arranged to form a circular necklace?',
    options: ['60', '120', '720', '360'],
    correct: 0,
    explain: 'For a necklace that can be flipped over, clockwise and counterclockwise arrangements are indistinguishable: (n - 1)! / 2 = 5! / 2 = 60.'
  },
  {
    id: 'tcat-math-pcp-10',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Hard',
    q: 'What is the total number of distinct permutations that can be formed using all letters of the word "PAKISTAN"?',
    options: ['20160', '40320', '10080', '5040'],
    correct: 0,
    explain: '"PAKISTAN" contains 8 letters with \'A\' repeating 2 times. Total permutations = 8! / 2! = 40320 / 2 = 20160.'
  },
  {
    id: 'tcat-math-pcp-11',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Hard',
    q: 'If events A and B are independent with P(A) = 0.4 and P(B) = 0.5, what is P(A union B)?',
    options: ['0.7', '0.9', '0.2', '0.6'],
    correct: 0,
    explain: 'For independent events, P(A intersect B) = 0.4 * 0.5 = 0.2. Then P(A union B) = P(A) + P(B) - P(A intersect B) = 0.4 + 0.5 - 0.2 = 0.7.'
  },

  // =========================================================
  // Chapter 8: Mathematical Induction and Binomial Theorem (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-math-mib-6',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Easy',
    q: 'In the principle of mathematical induction, what is the initial verification step called?',
    options: ['Basis step (base step)', 'Inductive hypothesis', 'Inductive conclusion', 'Transitive step'],
    correct: 0,
    explain: 'The step verifying the proposition for the initial value (usually n = 1) is called the basis step or base step.'
  },
  {
    id: 'tcat-math-mib-7',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Medium',
    q: 'What is the sum of the odd binomial coefficients C1 + C3 + C5 + ... in the expansion of (1 + x)^n?',
    options: ['2^(n - 1)', '2^n', '2^(n + 1)', '2^(n - 2)'],
    correct: 0,
    explain: 'Sum of all coefficients is 2^n. Sum of odd coefficients equals sum of even coefficients = 2^n / 2 = 2^(n - 1).'
  },
  {
    id: 'tcat-math-mib-8',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Hard',
    q: 'What is the coefficient of x^3 in the expansion of (1 - 2x)^5?',
    options: ['-80', '80', '-40', '40'],
    correct: 0,
    explain: 'General term is 5Cr * 1^(5-r) * (-2x)^r. For x^3, r = 3: 5C3 * (-2)^3 = 10 * (-8) = -80.'
  },
  {
    id: 'tcat-math-mib-9',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Hard',
    q: 'If the expansion of (x + a)^n contains exactly 11 terms, what is the value of n?',
    options: ['10', '11', '12', '9'],
    correct: 0,
    explain: 'The binomial expansion of (x + a)^n with positive integer exponent n contains exactly n + 1 terms. Therefore n + 1 = 11 => n = 10.'
  },
  {
    id: 'tcat-math-mib-10',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Hard',
    q: 'For what condition on x is the infinite binomial series (1 + x)^(-2) valid and convergent?',
    options: ['|x| < 1', '|x| <= 1', 'x > 1', 'For all real x'],
    correct: 0,
    explain: 'When the exponent n is a rational or negative number, the expansion of (1 + x)^n converges if and only if |x| < 1.'
  },

  // =========================================================
  // Chapter 9: Fundamentals of Trigonometry (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-fot-6',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Easy',
    q: 'If an angle in standard position has its terminal side lying on the negative y-axis, what is its radian measure?',
    options: ['3*pi/2', 'pi', 'pi/2', '2*pi'],
    correct: 0,
    explain: 'The negative y-axis corresponds to 270 degrees, which equals 3*pi/2 radians.'
  },
  {
    id: 'tcat-math-fot-7',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Easy',
    q: 'In which quadrant do both conditions sin(theta) < 0 and cos(theta) > 0 simultaneously hold?',
    options: ['Quadrant IV', 'Quadrant III', 'Quadrant II', 'Quadrant I'],
    correct: 0,
    explain: 'In Quadrant IV, x-coordinates (cosine) are positive while y-coordinates (sine) are negative.'
  },
  {
    id: 'tcat-math-fot-8',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Medium',
    q: 'If tan(theta) = 3/4 and theta lies in the third quadrant, what is the value of cos(theta)?',
    options: ['-4/5', '4/5', '-3/5', '3/5'],
    correct: 0,
    explain: 'In Quadrant III, cosine is negative. With opposite = 3 and adjacent = 4, hypotenuse = 5, so cos(theta) = -4/5.'
  },
  {
    id: 'tcat-math-fot-9',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Hard',
    q: 'Find the length of the arc of a circle of radius 6 cm subtended by a central angle of 30 degrees.',
    options: ['pi cm', '2*pi cm', '3*pi cm', 'pi/2 cm'],
    correct: 0,
    explain: 'Convert 30 degrees to radians: theta = 30 * pi/180 = pi/6 rad. Arc length s = r * theta = 6 * (pi/6) = pi cm.'
  },
  {
    id: 'tcat-math-fot-10',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Hard',
    q: 'Simplify the trigonometric expression: (1 - sin^2(x)) * (1 + tan^2(x)).',
    options: ['1', 'sin^2(x)', 'cos^2(x)', 'tan^2(x)'],
    correct: 0,
    explain: '1 - sin^2(x) = cos^2(x), and 1 + tan^2(x) = sec^2(x). Their product is cos^2(x) * sec^2(x) = 1.'
  },

  // =========================================================
  // Chapter 10: Trigonometric Identities (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-ti-6',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Easy',
    q: 'Which of the following is the correct double-angle formula for cos(2*alpha) exclusively in terms of sin(alpha)?',
    options: ['1 - 2*sin^2(alpha)', '2*sin^2(alpha) - 1', '1 - sin^2(alpha)', '2*cos^2(alpha) - 1'],
    correct: 0,
    explain: 'cos(2*alpha) = cos^2(alpha) - sin^2(alpha) = (1 - sin^2(alpha)) - sin^2(alpha) = 1 - 2*sin^2(alpha).'
  },
  {
    id: 'tcat-math-ti-7',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Medium',
    q: 'What is the exact algebraic value of sin(105 degrees)?',
    options: ['(sqrt(6) + sqrt(2)) / 4', '(sqrt(6) - sqrt(2)) / 4', '(sqrt(3) + 1) / 2', 'sqrt(2) / 2'],
    correct: 0,
    explain: 'sin(105) = sin(60 + 45) = sin(60)cos(45) + cos(60)sin(45) = (sqrt(3)/2)(sqrt(2)/2) + (1/2)(sqrt(2)/2) = (sqrt(6) + sqrt(2)) / 4.'
  },
  {
    id: 'tcat-math-ti-8',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Medium',
    q: 'Express cos(70°) - cos(20°) in product form:',
    options: ['-2*sin(45°)*sin(25°)', '2*cos(45°)*cos(25°)', '2*sin(45°)*sin(25°)', '-2*cos(45°)*sin(25°)'],
    correct: 0,
    explain: 'Using cos(C) - cos(D) = -2*sin((C + D)/2)*sin((C - D)/2): cos(70°) - cos(20°) = -2*sin(45°)*sin(25°).'
  },
  {
    id: 'tcat-math-ti-9',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Hard',
    q: 'Simplify the identity: sin(3*theta)/sin(theta) - cos(3*theta)/cos(theta).',
    options: ['2', '1', '4*cos(2*theta)', '0'],
    correct: 0,
    explain: 'Combine over common denominator: [sin(3*theta)cos(theta) - cos(3*theta)sin(theta)] / [sin(theta)cos(theta)] = sin(3*theta - theta) / [(1/2)sin(2*theta)] = sin(2*theta) / [(1/2)sin(2*theta)] = 2.'
  },
  {
    id: 'tcat-math-ti-10',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Hard',
    q: 'If tan(alpha) = 1/2 and tan(beta) = 1/3, what is the value of alpha + beta?',
    options: ['pi/4 (45°)', 'pi/3 (60°)', 'pi/6 (30°)', 'pi/2 (90°)'],
    correct: 0,
    explain: 'tan(alpha + beta) = (tan(alpha) + tan(beta)) / (1 - tan(alpha)tan(beta)) = (1/2 + 1/3) / (1 - 1/6) = (5/6) / (5/6) = 1. Thus alpha + beta = pi/4.'
  },

  // =========================================================
  // Chapter 11: Trigonometric Functions and Graphs (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-tfg-6',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Easy',
    q: 'What is the fundamental period of the cotangent function y = cot(x)?',
    options: ['pi', '2*pi', 'pi/2', '4*pi'],
    correct: 0,
    explain: 'Like the tangent function, cot(x) repeats its values every pi radians.'
  },
  {
    id: 'tcat-math-tfg-7',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Easy',
    q: 'What is the domain of the principal inverse sine function y = arcsin(x)?',
    options: ['[-1, 1]', '(-infinity, infinity)', '[0, pi]', '[-pi/2, pi/2]'],
    correct: 0,
    explain: 'Since the sine function maps real numbers to [-1, 1], its inverse arcsin(x) is defined only on the domain [-1, 1].'
  },
  {
    id: 'tcat-math-tfg-8',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Medium',
    q: 'What is the period of the function f(x) = cos(x / 3)?',
    options: ['6*pi', '2*pi/3', '3*pi', '2*pi'],
    correct: 0,
    explain: 'Period of cos(kx) is 2*pi / k. Here k = 1/3, so period = 2*pi / (1/3) = 6*pi.'
  },
  {
    id: 'tcat-math-tfg-9',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Hard',
    q: 'Evaluate the exact value of the sum: arcsin(1/2) + arccos(1/2).',
    options: ['pi/2', 'pi/4', 'pi', 'pi/3'],
    correct: 0,
    explain: 'arcsin(1/2) = pi/6, arccos(1/2) = pi/3. Their sum is pi/6 + pi/3 = pi/2. In general, arcsin(x) + arccos(x) = pi/2 for all x in [-1, 1].'
  },
  {
    id: 'tcat-math-tfg-10',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Hard',
    q: 'Find all solutions to the trigonometric equation sin(x) = 1/2 within the interval [0, 2*pi).',
    options: ['{pi/6, 5*pi/6}', '{pi/6, 7*pi/6}', '{pi/3, 2*pi/3}', '{pi/6, 11*pi/6}'],
    correct: 0,
    explain: 'sin(x) is positive in quadrants I and II. In quadrant I, x = pi/6. In quadrant II, x = pi - pi/6 = 5*pi/6.'
  },

  // =========================================================
  // Chapter 12: Application of Trigonometry (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-aot-6',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Easy',
    q: 'If the angle of elevation of the sun is 45°, what is the length of the shadow cast by a 10-meter vertical pole?',
    options: ['10 meters', '10*sqrt(3) meters', '10/sqrt(3) meters', '5 meters'],
    correct: 0,
    explain: 'tan(45°) = height / shadow => 1 = 10 / shadow => shadow = 10 meters.'
  },
  {
    id: 'tcat-math-aot-7',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Medium',
    q: 'In any triangle ABC, the Law of Tangents is expressed as:',
    options: [
      '(a - b)/(a + b) = tan((alpha - beta)/2) / tan((alpha + beta)/2)',
      '(a + b)/(a - b) = tan((alpha - beta)/2) / tan((alpha + beta)/2)',
      '(a - b)/(a + b) = sin((alpha - beta)/2) / sin((alpha + beta)/2)',
      '(a - b)/(a + b) = cos((alpha - beta)/2) / cos((alpha + beta)/2)'
    ],
    correct: 0,
    explain: 'By Napier\'s analogies / Law of Tangents: (a - b)/(a + b) = tan((alpha - beta)/2) / tan((alpha + beta)/2).'
  },
  {
    id: 'tcat-math-aot-8',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Medium',
    q: 'In triangle ABC, if side a = 4, side b = 5, and included angle gamma = 60°, what is the area Delta of the triangle?',
    options: ['5*sqrt(3) sq units', '10*sqrt(3) sq units', '10 sq units', '5 sq units'],
    correct: 0,
    explain: 'Area Delta = (1/2)*a*b*sin(gamma) = (1/2)*(4)*(5)*sin(60°) = 10*(sqrt(3)/2) = 5*sqrt(3) sq units.'
  },
  {
    id: 'tcat-math-aot-9',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Hard',
    q: 'What is the formula for the radius r1 of the excircle opposite to vertex A in terms of triangle area Delta and semi-perimeter s?',
    options: ['Delta / (s - a)', 'Delta / (s - b)', 'Delta / s', '(s - a) / Delta'],
    correct: 0,
    explain: 'The ex-radii are given by r1 = Delta / (s - a), r2 = Delta / (s - b), and r3 = Delta / (s - c).'
  },
  {
    id: 'tcat-math-aot-10',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Hard',
    q: 'In a triangle ABC, if circumradius R = 10 cm and side a = 10 cm, what is the measure of angle alpha opposite to side a?',
    options: ['30°', '45°', '60°', '90°'],
    correct: 0,
    explain: 'By the extended Law of Sines: a / sin(alpha) = 2R => 10 / sin(alpha) = 20 => sin(alpha) = 1/2. Hence alpha = 30°.'
  },

  // =========================================================
  // Chapter 13: Functions and Limits (5 MCQs: 1 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-fl-7',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Easy',
    q: 'If f(x) = x^2 - 4, what is the expanded expression for f(x + 2)?',
    options: ['x^2 + 4x', 'x^2', 'x^2 + 4', 'x^2 - 4x'],
    correct: 0,
    explain: 'f(x + 2) = (x + 2)^2 - 4 = x^2 + 4x + 4 - 4 = x^2 + 4x.'
  },
  {
    id: 'tcat-math-fl-8',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Medium',
    q: 'Evaluate the limit: lim_{x -> 0} (e^(2x) - 1) / x.',
    options: ['2', '1', 'e^2', '0'],
    correct: 0,
    explain: 'Using standard limit lim_{u -> 0} (e^u - 1)/u = 1 with u = 2x: lim_{x -> 0} 2*(e^(2x) - 1)/(2x) = 2 * 1 = 2.'
  },
  {
    id: 'tcat-math-fl-9',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Medium',
    q: 'What is the natural domain of the real-valued function f(x) = sqrt(9 - x^2)?',
    options: ['[-3, 3]', '(-3, 3)', '(-infinity, -3] U [3, infinity)', '[0, 3]'],
    correct: 0,
    explain: 'For f(x) to be real, the radicand 9 - x^2 >= 0 => x^2 <= 9 => -3 <= x <= 3.'
  },
  {
    id: 'tcat-math-fl-10',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Hard',
    q: 'Evaluate the limit: lim_{x -> 0} [sqrt(1 + x) - 1] / x.',
    options: ['1/2', '1', '0', '2'],
    correct: 0,
    explain: 'Rationalize the numerator: [sqrt(1 + x) - 1][sqrt(1 + x) + 1] / [x(sqrt(1 + x) + 1)] = x / [x(sqrt(1 + x) + 1)] = 1 / (1 + 1) = 1/2.'
  },
  {
    id: 'tcat-math-fl-11',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Hard',
    q: 'For the signum-like function f(x) = |x| / x (where x != 0), what is the right-hand limit lim_{x -> 0^+} f(x)?',
    options: ['1', '-1', '0', 'Does not exist'],
    correct: 0,
    explain: 'For x > 0, |x| = x, so f(x) = x/x = 1. Therefore, lim_{x -> 0^+} f(x) = 1.'
  },

  // =========================================================
  // Chapter 14: Differentiation (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-math-diff-7',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Easy',
    q: 'What is the derivative of the exponential function f(x) = a^x (where a > 0, a != 1) with respect to x?',
    options: ['a^x * ln(a)', 'a^x / ln(a)', 'x * a^(x - 1)', 'a^x'],
    correct: 0,
    explain: 'By the exponential derivative rule, d/dx(a^x) = a^x * ln(a).'
  },
  {
    id: 'tcat-math-diff-8',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Medium',
    q: 'Find the slope dy/dx of the circle x^2 + y^2 = 25 at the point (3, 4).',
    options: ['-3/4', '3/4', '-4/3', '4/3'],
    correct: 0,
    explain: 'Differentiating implicitly: 2x + 2y*(dy/dx) = 0 => dy/dx = -x/y. At (3, 4), dy/dx = -3/4.'
  },
  {
    id: 'tcat-math-diff-9',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Hard',
    q: 'What is the derivative of y = arcsin(2x) with respect to x for |2x| < 1?',
    options: ['2 / sqrt(1 - 4x^2)', '1 / sqrt(1 - 4x^2)', '2 / (1 + 4x^2)', '-2 / sqrt(1 - 4x^2)'],
    correct: 0,
    explain: 'Using chain rule: dy/dx = [1 / sqrt(1 - (2x)^2)] * d/dx(2x) = 2 / sqrt(1 - 4x^2).'
  },
  {
    id: 'tcat-math-diff-10',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Hard',
    q: 'A continuous function f(x) has a point of inflection at x = c if:',
    options: [
      'f\'\'(c) = 0 and f\'\'(x) changes sign across x = c',
      'f\'(c) = 0 and f\'\'(c) > 0',
      'f\'(c) = 0 and f\'\'(c) < 0',
      'f\'\'(c) > 0 for all x'
    ],
    correct: 0,
    explain: 'A point of inflection occurs where the concavity changes, requiring f\'\'(c) = 0 (or undefined) with f\'\'(x) changing sign across c.'
  },
  {
    id: 'tcat-math-diff-11',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Hard',
    q: 'Find the equation of the normal line to the curve y = x^2 at the point (1, 1).',
    options: ['x + 2y - 3 = 0', '2x - y - 1 = 0', 'x - 2y + 1 = 0', '2x + y - 3 = 0'],
    correct: 0,
    explain: 'dy/dx = 2x => slope of tangent at x = 1 is m_t = 2. Slope of normal m_n = -1/2. Equation: y - 1 = -1/2(x - 1) => 2y - 2 = -x + 1 => x + 2y - 3 = 0.'
  },

  // =========================================================
  // Chapter 15: Integration (5 MCQs: 1 Easy, 1 Med, 3 Hard)
  // =========================================================
  {
    id: 'tcat-math-int-7',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Easy',
    q: 'Evaluate the indefinite integral: integral of e^(3x) dx.',
    options: ['(1/3)*e^(3x) + C', '3*e^(3x) + C', 'e^(3x) + C', '(1/3)*e^x + C'],
    correct: 0,
    explain: 'int e^(ax) dx = (1/a)*e^(ax) + C. Here a = 3, so (1/3)*e^(3x) + C.'
  },
  {
    id: 'tcat-math-int-8',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Medium',
    q: 'Evaluate the integral: integral of 1 / (x^2 + 9) dx.',
    options: ['(1/3)*arctan(x/3) + C', 'arctan(x/3) + C', '(1/9)*arctan(x/9) + C', 'ln(x^2 + 9) + C'],
    correct: 0,
    explain: 'Using standard form int 1 / (x^2 + a^2) dx = (1/a)*arctan(x/a) + C. With a = 3: (1/3)*arctan(x/3) + C.'
  },
  {
    id: 'tcat-math-int-9',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Hard',
    q: 'Evaluate the definite integral: int_0^(pi/4) sec^2(x) dx.',
    options: ['1', '0', 'sqrt(2)', 'pi/4'],
    correct: 0,
    explain: 'Antiderivative of sec^2(x) is tan(x). Evaluating from 0 to pi/4: tan(pi/4) - tan(0) = 1 - 0 = 1.'
  },
  {
    id: 'tcat-math-int-10',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Hard',
    q: 'Using integration by parts, what is the antiderivative of ln(x) dx?',
    options: ['x*ln(x) - x + C', 'x*ln(x) + x + C', '1/x + C', '(ln x)^2 / 2 + C'],
    correct: 0,
    explain: 'Let u = ln(x), dv = dx. Then du = 1/x dx, v = x. int ln(x) dx = x*ln(x) - int x*(1/x) dx = x*ln(x) - x + C.'
  },
  {
    id: 'tcat-math-int-11',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Hard',
    q: 'Evaluate the integral: integral of (3x + 2) / (x^2 + 1) dx.',
    options: [
      '(3/2)*ln(x^2 + 1) + 2*arctan(x) + C',
      '3*ln(x^2 + 1) + 2*arctan(x) + C',
      '(3/2)*ln(x^2 + 1) + arctan(x) + C',
      '3*arctan(x) + 2*ln(x^2 + 1) + C'
    ],
    correct: 0,
    explain: 'Split: 3/2 * int (2x)/(x^2 + 1) dx + 2 * int 1/(x^2 + 1) dx = (3/2)*ln(x^2 + 1) + 2*arctan(x) + C.'
  },

  // =========================================================
  // Chapter 16: Introduction to Analytic Geometry (6 MCQs: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-ag-6',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Easy',
    q: 'What is the midpoint of the line segment connecting P(2, -4) and Q(6, 8)?',
    options: ['(4, 2)', '(4, -2)', '(8, 4)', '(2, 6)'],
    correct: 0,
    explain: 'Midpoint M = ((x1 + x2)/2, (y1 + y2)/2) = ((2 + 6)/2, (-4 + 8)/2) = (4, 2).'
  },
  {
    id: 'tcat-math-ag-7',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Easy',
    q: 'What is the slope of any horizontal line parallel to the x-axis?',
    options: ['0', '1', 'Undefined (infinity)', '-1'],
    correct: 0,
    explain: 'A line parallel to the x-axis has delta y = 0, so slope m = 0 / delta x = 0.'
  },
  {
    id: 'tcat-math-ag-8',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Medium',
    q: 'Find the acute angle theta between two lines having slopes m1 = 2 and m2 = -3.',
    options: ['45°', '30°', '60°', '90°'],
    correct: 0,
    explain: 'tan(theta) = |(m2 - m1) / (1 + m1*m2)| = |(-3 - 2) / (1 + (2)(-3))| = |-5 / -5| = 1 => theta = 45°.'
  },
  {
    id: 'tcat-math-ag-9',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Medium',
    q: 'What is the equation of the line passing through (2, 3) with a slope of -1?',
    options: ['x + y - 5 = 0', 'x - y + 1 = 0', 'x + y + 5 = 0', '2x + y - 7 = 0'],
    correct: 0,
    explain: 'Point-slope form: y - 3 = -1(x - 2) => y - 3 = -x + 2 => x + y - 5 = 0.'
  },
  {
    id: 'tcat-math-ag-10',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Hard',
    q: 'What is the area of the triangle with vertices at the origin (0, 0), (4, 0), and (0, 6)?',
    options: ['12 sq units', '24 sq units', '10 sq units', '14 sq units'],
    correct: 0,
    explain: 'Since base is on x-axis (length = 4) and height is on y-axis (length = 6), area = (1/2)*4*6 = 12 sq units.'
  },
  {
    id: 'tcat-math-ag-11',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Hard',
    q: 'What is the necessary and sufficient condition for three straight lines a1*x + b1*y + c1 = 0, a2*x + b2*y + c2 = 0, and a3*x + b3*y + c3 = 0 to be concurrent?',
    options: [
      'The 3x3 determinant formed by their coefficients equals 0',
      'a1/a2 = b1/b2 = c1/c2',
      'The sum of their slopes equals 0',
      'a1*a2*a3 + b1*b2*b3 = 0'
    ],
    correct: 0,
    explain: 'Three lines intersect at a common point (are concurrent) if and only if the determinant of the coefficient matrix [[a1, b1, c1], [a2, b2, c2], [a3, b3, c3]] is zero.'
  },

  // =========================================================
  // Chapter 17: Linear Inequalities and Linear Programming (5 MCQs: 2 Easy, 1 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-lp-6',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Easy',
    q: 'Which geometric half-plane does the origin (0, 0) belong to with respect to the inequality 3x - 4y <= 12?',
    options: ['The origin-side half-plane', 'The non-origin side', 'The boundary line', 'Neither half-plane'],
    correct: 0,
    explain: 'Testing (0, 0): 3(0) - 4(0) = 0 <= 12, which is true. Hence the origin lies in the solution half-plane.'
  },
  {
    id: 'tcat-math-lp-7',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Easy',
    q: 'In linear programming, the linear function of decision variables to be maximized or minimized is called the:',
    options: ['Objective function', 'Feasible region', 'Constraint equation', 'Slack function'],
    correct: 0,
    explain: 'The function that expresses the goal (e.g. profit maximization or cost minimization) is the objective function.'
  },
  {
    id: 'tcat-math-lp-8',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Medium',
    q: 'Where does the optimal (maximum or minimum) value of an objective function always occur in a bounded feasible polygon?',
    options: ['At one of the corner points (vertices)', 'At the centroid', 'At the origin strictly', 'Along the interior center'],
    correct: 0,
    explain: 'By the Fundamental Theorem of Linear Programming, optimal values of a linear objective function occur at the extreme points (corner points) of the feasible region.'
  },
  {
    id: 'tcat-math-lp-9',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Hard',
    q: 'Maximize Z = 2x + 3y subject to the constraints: x >= 0, y >= 0, and x + y <= 4.',
    options: ['12', '8', '10', '14'],
    correct: 0,
    explain: 'Corner points are (0, 0), (4, 0), and (0, 4). Evaluating Z: at (0,0) Z=0; at (4,0) Z=8; at (0,4) Z=12. The maximum is 12.'
  },
  {
    id: 'tcat-math-lp-10',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Hard',
    q: 'If a linear programming problem has an unbounded feasible region in the direction of optimization, the problem has:',
    options: ['No finite optimal solution (unbounded solution)', 'A unique optimal solution at (0,0)', 'Multiple optimal solutions on all boundaries', 'Exactly two corner solutions'],
    correct: 0,
    explain: 'If the feasible region extends indefinitely in the direction that increases the objective function, the maximum value is infinite (unbounded solution).'
  },

  // =========================================================
  // Chapter 18: Conic Sections (6 MCQs: 2 Easy, 2 Med, 2 Hard)
  // =========================================================
  {
    id: 'tcat-math-cs-6',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Easy',
    q: 'What is the locus of a point whose distance from a fixed focus is equal to its distance from a fixed directrix line (eccentricity e = 1)?',
    options: ['Parabola', 'Ellipse', 'Hyperbola', 'Circle'],
    correct: 0,
    explain: 'By geometric definition of conics, e = 1 defines a parabola.'
  },
  {
    id: 'tcat-math-cs-7',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Easy',
    q: 'What are the center coordinates of the circle given by (x - 3)^2 + (y + 5)^2 = 49?',
    options: ['(3, -5)', '(-3, 5)', '(3, 5)', '(-3, -5)'],
    correct: 0,
    explain: 'Standard circle equation is (x - h)^2 + (y - k)^2 = r^2. Here h = 3, k = -5, so center is (3, -5).'
  },
  {
    id: 'tcat-math-cs-8',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Medium',
    q: 'What is the length of the major axis of the ellipse x^2/25 + y^2/9 = 1?',
    options: ['10', '5', '6', '8'],
    correct: 0,
    explain: 'Here a^2 = 25 => a = 5. The length of the major axis is 2a = 2 * 5 = 10.'
  },
  {
    id: 'tcat-math-cs-9',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Medium',
    q: 'What are the coordinates of the foci of the hyperbola x^2/16 - y^2/9 = 1?',
    options: ['(+-5, 0)', '(0, +-5)', '(+-4, 0)', '(+-3, 0)'],
    correct: 0,
    explain: 'For a horizontal hyperbola, c^2 = a^2 + b^2 = 16 + 9 = 25 => c = 5. Foci are located at (+-c, 0) = (+-5, 0).'
  },
  {
    id: 'tcat-math-cs-10',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Hard',
    q: 'What is the equation of the directrix of the parabola y^2 = 8x?',
    options: ['x = -2', 'x = 2', 'y = -2', 'y = 2'],
    correct: 0,
    explain: 'Standard form y^2 = 4ax. 4a = 8 => a = 2. Directrix of y^2 = 4ax is x = -a => x = -2.'
  },
  {
    id: 'tcat-math-cs-11',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Hard',
    q: 'What is the condition of tangency for the straight line y = mx + c to touch the circle x^2 + y^2 = a^2?',
    options: ['c^2 = a^2 * (1 + m^2)', 'c^2 = a^2 * (1 - m^2)', 'c = a * m', 'c^2 = a^2 / (1 + m^2)'],
    correct: 0,
    explain: 'The perpendicular distance from center (0, 0) to line mx - y + c = 0 is |c| / sqrt(1 + m^2). Equating to radius a gives c^2 = a^2*(1 + m^2).'
  },

  // =========================================================
  // Chapter 19: Vectors (5 MCQs: 2 Easy, 2 Med, 1 Hard)
  // =========================================================
  {
    id: 'tcat-math-vec-6',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Easy',
    q: 'A vector having zero magnitude and an arbitrary, indeterminate direction is known as a:',
    options: ['Null vector (zero vector)', 'Unit vector', 'Position vector', 'Equal vector'],
    correct: 0,
    explain: 'A null or zero vector has magnitude 0 and no specific direction.'
  },
  {
    id: 'tcat-math-vec-7',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Easy',
    q: 'What is the unit vector in the direction of vector v = 3i - 4j?',
    options: ['(3i - 4j) / 5', '(3i - 4j) / 25', '(3i + 4j) / 5', '(4i - 3j) / 5'],
    correct: 0,
    explain: 'Magnitude |v| = sqrt(3^2 + (-4)^2) = sqrt(9 + 16) = 5. Unit vector = v / |v| = (3i - 4j) / 5.'
  },
  {
    id: 'tcat-math-vec-8',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Medium',
    q: 'If two non-zero vectors a and b are parallel or collinear, what is their cross product a x b?',
    options: ['0 (zero vector)', '1', '|a|*|b|', 'a · b'],
    correct: 0,
    explain: 'a x b = |a||b|sin(theta) n_hat. When parallel, theta = 0 or 180°, so sin(theta) = 0, giving the zero vector 0.'
  },
  {
    id: 'tcat-math-vec-9',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Medium',
    q: 'Find the work done by a constant force F = 2i + 3j + k acting on a particle moving from the origin to displacement d = 4i - j + 2k.',
    options: ['7 units', '13 units', '5 units', '9 units'],
    correct: 0,
    explain: 'Work W = F · d = (2)(4) + (3)(-1) + (1)(2) = 8 - 3 + 2 = 7 units.'
  },
  {
    id: 'tcat-math-vec-10',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Hard',
    q: 'What is the numerical value of the scalar triple product [i, j, k]?',
    options: ['1', '0', '-1', 'sqrt(3)'],
    correct: 0,
    explain: '[i, j, k] = i · (j x k). Since j x k = i, i · i = 1.'
  }
];

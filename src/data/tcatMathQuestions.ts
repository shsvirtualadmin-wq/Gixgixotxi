import { Question } from '../types';

export const TCAT_MATH_QUESTIONS: Question[] = [
  // ==========================================
  // Chapter 1: Number Systems (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-ns-1',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Easy',
    q: 'What is the multiplicative identity in the set of complex numbers C?',
    options: ['(1, 0) or 1 + 0i', '(0, 1) or 0 + 1i', '(0, 0) or 0 + 0i', '(1, 1) or 1 + i'],
    correct: 0,
    explain: 'The multiplicative identity in complex numbers is (1, 0) because for any z = (x, y), (x, y) × (1, 0) = (x·1 - y·0, x·0 + y·1) = (x, y).'
  },
  {
    id: 'tcat-math-ns-2',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Easy',
    q: 'Which set is NOT closed under addition?',
    options: ['Odd integers {..., -3, -1, 1, 3, ...}', 'Even integers {..., -4, -2, 0, 2, 4, ...}', 'Rational numbers Q', 'Real numbers R'],
    correct: 0,
    explain: 'The sum of two odd integers is always an even integer (e.g., 3 + 5 = 8). Since 8 is not an odd integer, the set of odd integers is not closed under addition.'
  },
  {
    id: 'tcat-math-ns-3',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Medium',
    q: 'What is the modulus of the complex number z = (3 - 4i) / (1 + i)?',
    options: ['5 / \\sqrt{2}', '5 / 2', '25 / 2', '5'],
    correct: 0,
    explain: '|z| = |3 - 4i| / |1 + i|. |3 - 4i| = \\sqrt{3^2 + (-4)^2} = \\sqrt{25} = 5. |1 + i| = \\sqrt{1^2 + 1^2} = \\sqrt{2}. Therefore, |z| = 5 / \\sqrt{2}.'
  },
  {
    id: 'tcat-math-ns-4',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Medium',
    q: 'Evaluate i^{107} where i = \\sqrt{-1}.',
    options: ['-i', 'i', '1', '-1'],
    correct: 0,
    explain: 'Since i^4 = 1, we divide the exponent 107 by 4: 107 = 4(26) + 3. Thus i^{107} = (i^4)^{26} · i^3 = 1 · (-i) = -i.'
  },
  {
    id: 'tcat-math-ns-5',
    subject: 'Mathematics',
    topic: 'Number Systems',
    difficulty: 'Hard',
    q: 'What is the polar form of the complex number z = -1 - i\\sqrt{3}?',
    options: ['2(\\cos(4\\pi/3) + i\\sin(4\\pi/3))', '2(\\cos(2\\pi/3) + i\\sin(2\\pi/3))', '2(\\cos(5\\pi/3) + i\\sin(5\\pi/3))', '4(\\cos(4\\pi/3) + i\\sin(4\\pi/3))'],
    correct: 0,
    explain: 'Modulus r = \\sqrt{(-1)^2 + (-\\sqrt{3})^2} = \\sqrt{1 + 3} = 2. Since both real and imaginary parts are negative, z lies in the third quadrant. Reference angle \\alpha = \\arctan(\\sqrt{3}/1) = \\pi/3, so argument \\theta = \\pi + \\pi/3 = 4\\pi/3. Thus z = 2(\\cos(4\\pi/3) + i\\sin(4\\pi/3)).'
  },

  // ==========================================
  // Chapter 2: Sets Functions and Groups (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-sfg-1',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Easy',
    q: 'If a set S has 4 elements, how many non-empty proper subsets does S have?',
    options: ['14', '15', '16', '12'],
    correct: 0,
    explain: 'Total subsets = 2^n = 2^4 = 16. Proper subsets exclude S itself (16 - 1 = 15). Non-empty proper subsets also exclude the empty set (15 - 1 = 14).'
  },
  {
    id: 'tcat-math-sfg-2',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Easy',
    q: 'A function f: A -> B is said to be bijective if it is:',
    options: ['Both injective (one-to-one) and surjective (onto)', 'Injective only', 'Surjective only', 'Neither injective nor surjective'],
    correct: 0,
    explain: 'By definition, a bijective function (one-to-one correspondence) must satisfy both injectivity (every element in B has at most one pre-image) and surjectivity (every element in B has at least one pre-image).'
  },
  {
    id: 'tcat-math-sfg-3',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Medium',
    q: 'What is the identity element of the group (Q^+, *) under the binary operation a * b = (ab) / 3?',
    options: ['3', '1', '1/3', '9'],
    correct: 0,
    explain: 'Let e be the identity element. Then a * e = a => (a · e) / 3 = a. Multiplying both sides by 3 and dividing by a (since a != 0) gives e = 3.'
  },
  {
    id: 'tcat-math-sfg-4',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Medium',
    q: 'What is the natural domain of the real-valued function f(x) = \\sqrt{9 - x^2}?',
    options: ['[-3, 3]', '(-3, 3)', '(-\\infty, -3] \\cup [3, \\infty)', '[0, 3]'],
    correct: 0,
    explain: 'For f(x) to be real, the radicand must be non-negative: 9 - x^2 >= 0 => x^2 <= 9 => -3 <= x <= 3. Hence domain is [-3, 3].'
  },
  {
    id: 'tcat-math-sfg-5',
    subject: 'Mathematics',
    topic: 'Sets Functions and Groups',
    difficulty: 'Hard',
    q: 'What is the inverse of the element 5 in the group (Q^+, *) where a * b = (a · b) / 2?',
    options: ['4/5', '5/4', '2/5', '1/5'],
    correct: 0,
    explain: 'First find identity e: a * e = a => (a · e) / 2 = a => e = 2. Now let b be the inverse of 5: 5 * b = e => (5 · b) / 2 = 2 => 5b = 4 => b = 4/5.'
  },

  // ==========================================
  // Chapter 3: Matrices and Determinants (6 MCQs)
  // ==========================================
  {
    id: 'tcat-math-mat-1',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Easy',
    q: 'A square matrix A is called skew-symmetric if:',
    options: ['A^T = -A', 'A^T = A', 'A · A^T = I', '|A| = 0'],
    correct: 0,
    explain: 'A matrix A is symmetric if A^T = A, and skew-symmetric if A^T = -A. For skew-symmetric matrices, all diagonal entries must be zero.'
  },
  {
    id: 'tcat-math-mat-2',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Easy',
    q: 'If A is a matrix of order 3x2 and B is of order 2x4, what is the order of matrix AB?',
    options: ['3x4', '2x2', '4x3', 'Product AB is not defined'],
    correct: 0,
    explain: 'Matrix multiplication of (m x k) and (k x n) yields an (m x n) matrix. Here, (3x2) × (2x4) yields a 3x4 matrix.'
  },
  {
    id: 'tcat-math-mat-3',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Medium',
    q: 'If A is an invertible matrix of order 3 with |A| = 4, what is |2A|?',
    options: ['32', '8', '16', '64'],
    correct: 0,
    explain: 'For an n x n square matrix A and scalar k, |kA| = k^n |A|. Here n = 3, so |2A| = 2^3 · |A| = 8 · 4 = 32.'
  },
  {
    id: 'tcat-math-mat-4',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Medium',
    q: 'For an n x n matrix A, what is the value of A · adj(A)?',
    options: ['|A| · I_n', '|A|^{n-1} · I_n', 'I_n', '|A|'],
    correct: 0,
    explain: 'By the fundamental theorem of adjugate matrices, A · adj(A) = adj(A) · A = |A| · I_n, where I_n is the identity matrix.'
  },
  {
    id: 'tcat-math-mat-5',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Hard',
    q: 'If A is a 3x3 matrix with |A| = 5, what is the value of |adj(adj(A))|?',
    options: ['625', '125', '25', '3125'],
    correct: 0,
    explain: 'For an n x n matrix, |adj(adj(A))| = |A|^{(n-1)^2}. For n = 3, (n-1)^2 = (2)^2 = 4. Thus |adj(adj(A))| = 5^4 = 625.'
  },
  {
    id: 'tcat-math-mat-6',
    subject: 'Mathematics',
    topic: 'Matrices and Determinants',
    difficulty: 'Hard',
    q: 'For what value of k does the system of homogeneous equations x + ky + z = 0, 2x - y + 3z = 0, 3x + y + 4z = 0 have a non-trivial solution?',
    options: ['k = 2', 'k = 0', 'k = -1', 'k = 3'],
    correct: 0,
    explain: 'A homogeneous linear system has non-trivial solutions if and only if its coefficient determinant is 0: |[1, k, 1], [2, -1, 3], [3, 1, 4]| = 1(-4 - 3) - k(8 - 9) + 1(2 - (-3)) = -7 + k + 5 = k - 2 = 0 => k = 2.'
  },

  // ==========================================
  // Chapter 4: Quadratic Equations (6 MCQs)
  // ==========================================
  {
    id: 'tcat-math-quad-1',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Easy',
    q: 'If \\omega is a complex cube root of unity, what is the value of 1 + \\omega + \\omega^2?',
    options: ['0', '1', '-1', '3'],
    correct: 0,
    explain: 'The sum of all three cube roots of unity (1, \\omega, \\omega^2) is identically equal to zero (1 + \\omega + \\omega^2 = 0).'
  },
  {
    id: 'tcat-math-quad-2',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Easy',
    q: 'If the roots of ax^2 + bx + c = 0 are real and equal, the discriminant b^2 - 4ac must be:',
    options: ['Equal to 0', 'Greater than 0', 'Less than 0', 'A perfect square > 0'],
    correct: 0,
    explain: 'When discriminant b^2 - 4ac = 0, the quadratic formula yields x = -b / (2a), giving two real and coincident (equal) roots.'
  },
  {
    id: 'tcat-math-quad-3',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Medium',
    q: 'If \\alpha and \\beta are the roots of 2x^2 - 4x + 1 = 0, what is the value of \\alpha^2 + \\beta^2?',
    options: ['3', '4', '7/2', '5'],
    correct: 0,
    explain: 'Sum of roots \\alpha + \\beta = -(-4)/2 = 2, and product \\alpha\\beta = 1/2. Therefore, \\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta = 2^2 - 2(1/2) = 4 - 1 = 3.'
  },
  {
    id: 'tcat-math-quad-4',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Medium',
    q: 'What is the value of (1 - \\omega - \\omega^2)^5, where \\omega is a complex cube root of unity?',
    options: ['32', '-32', '1', '0'],
    correct: 0,
    explain: 'Since 1 + \\omega + \\omega^2 = 0, -\\omega - \\omega^2 = 1. Thus 1 - \\omega - \\omega^2 = 1 + 1 = 2. Therefore, 2^5 = 32.'
  },
  {
    id: 'tcat-math-quad-5',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Hard',
    q: 'If the roots of the equation x^2 - px + q = 0 differ by unity, which relationship is true?',
    options: ['p^2 = 4q + 1', 'p^2 = 4q - 1', 'q^2 = 4p + 1', 'p^2 = 2q + 1'],
    correct: 0,
    explain: 'Let roots be \\alpha and \\beta. \\alpha + \\beta = p, \\alpha\\beta = q, and |\\alpha - \\beta| = 1. (\\alpha - \\beta)^2 = (\\alpha + \\beta)^2 - 4\\alpha\\beta => 1^2 = p^2 - 4q => p^2 = 4q + 1.'
  },
  {
    id: 'tcat-math-quad-6',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'Hard',
    q: 'What is the sum of all fourth roots of 16?',
    options: ['0', '4', '8', '16'],
    correct: 0,
    explain: 'The equation x^4 - 16 = 0 has four roots: 2, -2, 2i, -2i. Sum of roots = 2 + (-2) + 2i + (-2i) = 0 (or by Vieta formula, the coefficient of x^3 is 0).'
  },

  // ==========================================
  // Chapter 5: Partial Fractions (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-pf-1',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Easy',
    q: 'A rational fraction P(x)/Q(x) where degree of P(x) is strictly less than degree of Q(x) is called:',
    options: ['A proper rational fraction', 'An improper rational fraction', 'A polynomial fraction', 'An identity fraction'],
    correct: 0,
    explain: 'By definition, if deg(P) < deg(Q), it is proper. If deg(P) >= deg(Q), it is improper and must first be divided using polynomial long division.'
  },
  {
    id: 'tcat-math-pf-2',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Easy',
    q: 'What is the form of partial fractions for 1 / [(x - 1)(x + 2)]?',
    options: ['A / (x - 1) + B / (x + 2)', '(Ax + B) / [(x - 1)(x + 2)]', 'A / (x - 1)^2 + B / (x + 2)', 'Ax / (x - 1) + B / (x + 2)'],
    correct: 0,
    explain: 'For distinct non-repeated linear factors (x - a) and (x - b), the standard partial fraction decomposition is A/(x - a) + B/(x - b).'
  },
  {
    id: 'tcat-math-pf-3',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Medium',
    q: 'Find the value of A in the partial fraction resolution: 1 / [(x - 1)(x + 2)] = A / (x - 1) + B / (x + 2).',
    options: ['1/3', '-1/3', '1/2', '1'],
    correct: 0,
    explain: 'Multiplying by (x - 1)(x + 2): 1 = A(x + 2) + B(x - 1). Setting x = 1 gives 1 = A(3) + 0 => A = 1/3.'
  },
  {
    id: 'tcat-math-pf-4',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Medium',
    q: 'What is the correct form of partial fraction decomposition for (x + 1) / [x^2(x - 2)]?',
    options: ['A / x + B / x^2 + C / (x - 2)', 'A / x^2 + B / (x - 2)', '(Ax + B) / x^2 + C / (x - 2)', 'A / x + B / (x - 2)'],
    correct: 0,
    explain: 'For a repeated linear factor (x)^2, we must include terms for each ascending power: A/x + B/x^2, along with C/(x - 2) for the distinct linear factor.'
  },
  {
    id: 'tcat-math-pf-5',
    subject: 'Mathematics',
    topic: 'Partial Fractions',
    difficulty: 'Hard',
    q: 'Resolve into partial fractions: (2x + 3) / [(x - 1)(x^2 + 1)]. What is the coefficient of x in the numerator of the quadratic term (Bx + C)/(x^2 + 1)?',
    options: ['-5/2', '5/2', '1/2', '-1/2'],
    correct: 0,
    explain: '2x + 3 = A(x^2 + 1) + (Bx + C)(x - 1). Put x = 1: 5 = 2A => A = 5/2. Equating coefficients of x^2: 0 = A + B => B = -A = -5/2.'
  },

  // ==========================================
  // Chapter 6: Sequences and Series (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-seq-1',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Easy',
    q: 'What is the 10th term of the arithmetic progression 2, 7, 12, 17, ...?',
    options: ['47', '45', '52', '42'],
    correct: 0,
    explain: 'a = 2, d = 7 - 2 = 5. a_{10} = a + (10 - 1)d = 2 + 9(5) = 2 + 45 = 47.'
  },
  {
    id: 'tcat-math-seq-2',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Easy',
    q: 'What is the sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + ...?',
    options: ['2', '1', '4', 'Infinity'],
    correct: 0,
    explain: 'Here a = 1 and r = 1/2 < 1. S_\\infty = a / (1 - r) = 1 / (1 - 1/2) = 1 / (1/2) = 2.'
  },
  {
    id: 'tcat-math-seq-3',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Medium',
    q: 'If the arithmetic mean between two positive numbers a and b is 5 and their geometric mean is 4, what is their harmonic mean?',
    options: ['16/5 (3.2)', '20/5 (4.0)', '25/4 (6.25)', '3.0'],
    correct: 0,
    explain: 'By the fundamental relation between AM, GM, and HM: GM^2 = AM · HM. Therefore, 4^2 = 5 · HM => 16 = 5 · HM => HM = 16/5 = 3.2.'
  },
  {
    id: 'tcat-math-seq-4',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Medium',
    q: 'What is the sum of the first n natural numbers 1 + 2 + 3 + ... + n?',
    options: ['n(n + 1) / 2', 'n(n - 1) / 2', 'n^2', '[n(n + 1) / 2]^2'],
    correct: 0,
    explain: '\\sum_{k=1}^n k = n(n + 1)/2. (While \\sum k^2 = n(n+1)(2n+1)/6 and \\sum k^3 = [n(n+1)/2]^2).'
  },
  {
    id: 'tcat-math-seq-5',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    difficulty: 'Hard',
    q: 'If the p-th term of an HP is q and the q-th term is p, what is the (pq)-th term?',
    options: ['1', 'p + q', 'pq', '1 / (pq)'],
    correct: 0,
    explain: 'In the corresponding AP, the p-th term is 1/q and the q-th term is 1/p. Common difference d = (1/p - 1/q)/(q - p) = 1/(pq). First term a = 1/(pq). Thus the (pq)-th term of AP is a + (pq - 1)d = 1/(pq) + (pq - 1)/(pq) = pq/(pq) = 1. Hence in HP it is 1/1 = 1.'
  },

  // ==========================================
  // Chapter 7: Permutation Combination and Probability (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-pcp-1',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Easy',
    q: 'What is the numerical value of 7P3?',
    options: ['210', '35', '42', '5040'],
    correct: 0,
    explain: 'nPr = n! / (n - r)!. 7P3 = 7! / (7 - 3)! = 7 × 6 × 5 = 210.'
  },
  {
    id: 'tcat-math-pcp-2',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Easy',
    q: 'In how many different ways can 5 people be seated in a circular ring?',
    options: ['24', '120', '60', '12'],
    correct: 0,
    explain: 'The number of circular permutations of n distinct objects is (n - 1)!. For 5 people: (5 - 1)! = 4! = 24.'
  },
  {
    id: 'tcat-math-pcp-3',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Medium',
    q: 'If nC8 = nC12, what is the value of n?',
    options: ['20', '4', '96', '16'],
    correct: 0,
    explain: 'If nCx = nCy and x != y, then x + y = n. Here, 8 + 12 = n => n = 20.'
  },
  {
    id: 'tcat-math-pcp-4',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Medium',
    q: 'Two unbiased dice are rolled simultaneously. What is the probability that the sum of the numbers is 7?',
    options: ['1/6', '7/36', '5/36', '1/12'],
    correct: 0,
    explain: 'Total outcomes = 36. Favorable outcomes giving sum 7 are: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 pairs. P = 6/36 = 1/6.'
  },
  {
    id: 'tcat-math-pcp-5',
    subject: 'Mathematics',
    topic: 'Permutation Combination and Probability',
    difficulty: 'Hard',
    q: 'A committee of 4 is to be chosen from 6 men and 4 women. What is the probability that the committee contains at least one woman?',
    options: ['13/14', '1/14', '5/6', '9/10'],
    correct: 0,
    explain: 'Total ways to choose 4 from 10 = 10C4 = 210. Ways with NO women (all 4 men) = 6C4 = 15. Probability of no women = 15/210 = 1/14. Probability of at least one woman = 1 - 1/14 = 13/14.'
  },

  // ==========================================
  // Chapter 8: Mathematical Induction and Binomial Theorem (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-mib-1',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Easy',
    q: 'What is the total number of terms in the binomial expansion of (a + b)^n for positive integer n?',
    options: ['n + 1', 'n', 'n - 1', '2^n'],
    correct: 0,
    explain: 'The binomial expansion of (a + b)^n contains (n + 1) terms, starting from r = 0 up to r = n.'
  },
  {
    id: 'tcat-math-mib-2',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Easy',
    q: 'What is the sum of all binomial coefficients C0 + C1 + C2 + ... + Cn in the expansion of (1 + x)^n?',
    options: ['2^n', '2^{n-1}', 'n^2', '2n'],
    correct: 0,
    explain: 'Setting x = 1 in (1 + x)^n = C0 + C1·x + C2·x^2 + ... + Cn·x^n gives (1 + 1)^n = 2^n.'
  },
  {
    id: 'tcat-math-mib-3',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Medium',
    q: 'What is the term independent of x in the expansion of (x + 1/x)^6?',
    options: ['20', '15', '6', '1'],
    correct: 0,
    explain: 'General term T_{r+1} = 6Cr · x^{6-r} · (x^{-1})^r = 6Cr · x^{6-2r}. For term independent of x, set 6 - 2r = 0 => r = 3. T_4 = 6C3 = 20.'
  },
  {
    id: 'tcat-math-mib-4',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Medium',
    q: 'What is the middle term in the expansion of (x - 2y)^8?',
    options: ['5th term (T5)', '4th term (T4)', '6th term (T6)', 'Both 4th and 5th terms'],
    correct: 0,
    explain: 'When n is even (n = 8), there is a single middle term at position (n/2 + 1) = 8/2 + 1 = 5th term (T5).'
  },
  {
    id: 'tcat-math-mib-5',
    subject: 'Mathematics',
    topic: 'Mathematical Induction and Binomial Theorem',
    difficulty: 'Hard',
    q: 'For what range of x is the infinite binomial series (1 - 2x)^{-1/2} valid and convergent?',
    options: ['|x| < 1/2', '|x| < 1', '|x| < 2', '|x| <= 1/2'],
    correct: 0,
    explain: 'The binomial series (1 + y)^n for rational non-integer n converges if and only if |y| < 1. Here y = -2x, so |-2x| < 1 => 2|x| < 1 => |x| < 1/2.'
  },

  // ==========================================
  // Chapter 9: Fundamentals of Trigonometry (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-fot-1',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Easy',
    q: 'How many radians are in an angle of 135 degrees?',
    options: ['3\\pi/4 rad', '2\\pi/3 rad', '5\\pi/6 rad', '4\\pi/3 rad'],
    correct: 0,
    explain: '\\theta (rad) = 135° × (\\pi / 180°) = (135/180)\\pi = 3\\pi/4 radians.'
  },
  {
    id: 'tcat-math-fot-2',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Easy',
    q: 'What is the area of a circular sector with radius r and central angle \\theta radians?',
    options: ['(1/2) r^2 \\theta', 'r^2 \\theta', '(1/2) r \\theta', '\\pi r^2 \\theta'],
    correct: 0,
    explain: 'The formula for the area of a sector is A = (1/2)r^2 \\theta, where \\theta is measured in radians.'
  },
  {
    id: 'tcat-math-fot-3',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Medium',
    q: 'If \\sin(\\theta) = -3/5 and \\theta is in the third quadrant, what is the value of \\tan(\\theta)?',
    options: ['3/4', '-3/4', '4/3', '-4/3'],
    correct: 0,
    explain: 'In the third quadrant, tangent is positive. Since \\sin(\\theta) = -3/5, \\cos(\\theta) = -\\sqrt{1 - (-3/5)^2} = -4/5. Thus \\tan(\\theta) = \\sin/\\cos = (-3/5)/(-4/5) = 3/4.'
  },
  {
    id: 'tcat-math-fot-4',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Medium',
    q: 'An arc of length 15 cm subtends a central angle of 1.5 radians in a circle. What is the radius of the circle?',
    options: ['10 cm', '22.5 cm', '15 cm', '7.5 cm'],
    correct: 0,
    explain: 'Using the arc length formula l = r\\theta: 15 = r(1.5) => r = 15 / 1.5 = 10 cm.'
  },
  {
    id: 'tcat-math-fot-5',
    subject: 'Mathematics',
    topic: 'Fundamentals of Trigonometry',
    difficulty: 'Hard',
    q: 'If \\sec(\\theta) + \\tan(\\theta) = 3, what is the value of \\sec(\\theta) - \\tan(\\theta)?',
    options: ['1/3', '-3', '1/9', '3'],
    correct: 0,
    explain: 'Since \\sec^2(\\theta) - \\tan^2(\\theta) = 1, (\\sec(\\theta) + \\tan(\\theta))(\\sec(\\theta) - \\tan(\\theta)) = 1. Given \\sec(\\theta) + \\tan(\\theta) = 3, it follows that \\sec(\\theta) - \\tan(\\theta) = 1/3.'
  },

  // ==========================================
  // Chapter 10: Trigonometric Identities (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-ti-1',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Easy',
    q: 'What is the simplified form of \\sin(2\\alpha)?',
    options: ['2\\sin(\\alpha)\\cos(\\alpha)', '\\cos^2(\\alpha) - \\sin^2(\\alpha)', '2\\sin(\\alpha)', '\\sin^2(\\alpha)'],
    correct: 0,
    explain: 'By the double-angle identity: \\sin(2\\alpha) = 2\\sin(\\alpha)\\cos(\\alpha).'
  },
  {
    id: 'tcat-math-ti-2',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Easy',
    q: 'What is the value of \\cos(90° + \\theta)?',
    options: ['-\\sin(\\theta)', '\\sin(\\theta)', '\\cos(\\theta)', '-\\cos(\\theta)'],
    correct: 0,
    explain: '\\cos(90° + \\theta) = \\cos(90°)\\cos(\\theta) - \\sin(90°)\\sin(\\theta) = 0 - 1·\\sin(\\theta) = -\\sin(\\theta).'
  },
  {
    id: 'tcat-math-ti-3',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Medium',
    q: 'What is the exact value of \\cos(15°)?',
    options: ['(\\sqrt{6} + \\sqrt{2}) / 4', '(\\sqrt{6} - \\sqrt{2}) / 4', '(\\sqrt{3} + 1) / 2', '1/2'],
    correct: 0,
    explain: '\\cos(15°) = \\cos(45° - 30°) = \\cos(45°)\\cos(30°) + \\sin(45°)\\sin(30°) = (1/\\sqrt{2})(\\sqrt{3}/2) + (1/\\sqrt{2})(1/2) = (\\sqrt{3} + 1)/(2\\sqrt{2}) = (\\sqrt{6} + \\sqrt{2})/4.'
  },
  {
    id: 'tcat-math-ti-4',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Medium',
    q: 'Express 2\\sin(5\\theta)\\cos(3\\theta) as a sum or difference of trigonometric functions.',
    options: ['\\sin(8\\theta) + \\sin(2\\theta)', '\\cos(8\\theta) + \\cos(2\\theta)', '\\sin(8\\theta) - \\sin(2\\theta)', '\\cos(8\\theta) - \\cos(2\\theta)'],
    correct: 0,
    explain: 'Using product-to-sum formula: 2\\sin(A)\\cos(B) = \\sin(A + B) + \\sin(A - B). Here A = 5\\theta, B = 3\\theta => \\sin(8\\theta) + \\sin(2\\theta).'
  },
  {
    id: 'tcat-math-ti-5',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    difficulty: 'Hard',
    q: 'If \\tan(\\alpha) = 1/2 and \\tan(\\beta) = 1/3, what is the value of \\alpha + \\beta?',
    options: ['\\pi / 4 (45°)', '\\pi / 6 (30°)', '\\pi / 3 (60°)', '\\pi / 2 (90°)'],
    correct: 0,
    explain: '\\tan(\\alpha + \\beta) = (\\tan\\alpha + \\tan\\beta) / (1 - \\tan\\alpha\\tan\\beta) = (1/2 + 1/3) / (1 - (1/2)(1/3)) = (5/6) / (5/6) = 1. Since \\alpha, \\beta are acute, \\alpha + \\beta = \\arctan(1) = \\pi/4.'
  },

  // ==========================================
  // Chapter 11: Trigonometric Functions and Graphs (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-tfg-1',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Easy',
    q: 'What is the period of the tangent function y = \\tan(x)?',
    options: ['\\pi', '2\\pi', '\\pi / 2', '4\\pi'],
    correct: 0,
    explain: 'The fundamental period of \\tan(x) and \\cot(x) is \\pi, while the period of \\sin(x), \\cos(x), \\sec(x), and \\csc(x) is 2\\pi.'
  },
  {
    id: 'tcat-math-tfg-2',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Easy',
    q: 'What is the range of the function f(x) = \\cos(x)?',
    options: ['[-1, 1]', '(-1, 1)', '[0, 1]', '(-\\infty, \\infty)'],
    correct: 0,
    explain: 'For all real values of x, -1 <= \\cos(x) <= 1, so the range is the closed interval [-1, 1].'
  },
  {
    id: 'tcat-math-tfg-3',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Medium',
    q: 'What is the period of the function f(x) = 3\\sin(4x)?',
    options: ['\\pi / 2', '\\pi', '2\\pi', '\\pi / 4'],
    correct: 0,
    explain: 'The period of \\sin(kx) is 2\\pi / |k|. Here k = 4, so period = 2\\pi / 4 = \\pi / 2.'
  },
  {
    id: 'tcat-math-tfg-4',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Medium',
    q: 'What is the maximum value attained by the function f(x) = 3\\sin(x) + 4\\cos(x)?',
    options: ['5', '7', '1', '25'],
    correct: 0,
    explain: 'The maximum value of a\\sin(x) + b\\cos(x) is \\sqrt{a^2 + b^2}. Here \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5.'
  },
  {
    id: 'tcat-math-tfg-5',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions and Graphs',
    difficulty: 'Hard',
    q: 'At which points does the function f(x) = \\tan(x) have vertical asymptotes?',
    options: ['x = (2k + 1)\\pi/2, k \\in Z', 'x = k\\pi, k \\in Z', 'x = 2k\\pi, k \\in Z', 'x = k\\pi/4, k \\in Z'],
    correct: 0,
    explain: '\\tan(x) = \\sin(x)/\\cos(x) is undefined wherever \\cos(x) = 0. The zeros of cosine occur at odd multiples of \\pi/2, i.e., x = (2k + 1)\\pi/2 for all integers k.'
  },

  // ==========================================
  // Chapter 12: Application of Trigonometry (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-aot-1',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Easy',
    q: 'According to the Law of Cosines for a triangle ABC, c^2 is equal to:',
    options: ['a^2 + b^2 - 2ab\\cos(C)', 'a^2 + b^2 + 2ab\\cos(C)', 'a^2 - b^2 - 2ab\\cos(C)', '(a + b)^2 - \\cos(C)'],
    correct: 0,
    explain: 'The Law of Cosines states c^2 = a^2 + b^2 - 2ab\\cos(C).'
  },
  {
    id: 'tcat-math-aot-2',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Easy',
    q: 'In a triangle ABC, the circumradius R is given by:',
    options: ['a / (2\\sin A)', 'a / \\sin A', 'abc / (2\\Delta)', '2a / \\sin A'],
    correct: 0,
    explain: 'By the extended Law of Sines: a / \\sin A = b / \\sin B = c / \\sin C = 2R => R = a / (2\\sin A) = abc / (4\\Delta).'
  },
  {
    id: 'tcat-math-aot-3',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Medium',
    q: 'What is the inradius r of a triangle with area \\Delta = 24 cm^2 and semi-perimeter s = 8 cm?',
    options: ['3 cm', '4 cm', '2 cm', '6 cm'],
    correct: 0,
    explain: 'The inradius formula is r = \\Delta / s. Here r = 24 / 8 = 3 cm.'
  },
  {
    id: 'tcat-math-aot-4',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Medium',
    q: 'In a triangle ABC, if a = 5, b = 6, and c = 7, what is the value of \\cos(A)?',
    options: ['5/7', '3/5', '19/35', '4/5'],
    correct: 0,
    explain: '\\cos(A) = (b^2 + c^2 - a^2) / (2bc) = (36 + 49 - 25) / (2 · 6 · 7) = 60 / 84 = 5/7.'
  },
  {
    id: 'tcat-math-aot-5',
    subject: 'Mathematics',
    topic: 'Application of Trigonometry',
    difficulty: 'Hard',
    q: 'For an equilateral triangle of side a, what is the ratio of inradius r to circumradius R (r : R)?',
    options: ['1 : 2', '1 : 3', '1 : \\sqrt{3}', '2 : 3'],
    correct: 0,
    explain: 'For an equilateral triangle, r = a / (2\\sqrt{3}) and R = a / \\sqrt{3}. Thus r / R = [a/(2\\sqrt{3})] / [a/\\sqrt{3}] = 1/2, so the ratio is 1 : 2.'
  },

  // ==========================================
  // Chapter 13: Functions and Limits (6 MCQs)
  // ==========================================
  {
    id: 'tcat-math-fl-1',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Easy',
    q: 'Evaluate \\lim_{x \\to 0} \\frac{\\sin(7x)}{x}.',
    options: ['7', '1', '0', '1/7'],
    correct: 0,
    explain: 'Using \\lim_{\\theta \\to 0} \\sin(\\theta)/\\theta = 1, \\lim_{x \\to 0} 7 · [\\sin(7x)/(7x)] = 7(1) = 7.'
  },
  {
    id: 'tcat-math-fl-2',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Easy',
    q: 'A function f(x) is said to be even if:',
    options: ['f(-x) = f(x)', 'f(-x) = -f(x)', 'f(1/x) = f(x)', 'f(x) = f(x + T)'],
    correct: 0,
    explain: 'A function is even if f(-x) = f(x) for all x in its domain (symmetric about the y-axis), and odd if f(-x) = -f(x).'
  },
  {
    id: 'tcat-math-fl-3',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Medium',
    q: 'Evaluate the limit \\lim_{n \\to \\infty} (1 + 1/n)^{3n}.',
    options: ['e^3', 'e', '3e', 'e^{1/3}'],
    correct: 0,
    explain: 'By definition of Euler number, \\lim_{n \\to \\infty} (1 + 1/n)^n = e. Thus [(1 + 1/n)^n]^3 = e^3.'
  },
  {
    id: 'tcat-math-fl-4',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Medium',
    q: 'Evaluate \\lim_{x \\to 2} \\frac{x^3 - 8}{x - 2}.',
    options: ['12', '4', '8', '0'],
    correct: 0,
    explain: 'Factor numerator: x^3 - 8 = (x - 2)(x^2 + 2x + 4). Cancel (x - 2): \\lim_{x \\to 2} (x^2 + 2x + 4) = 4 + 4 + 4 = 12.'
  },
  {
    id: 'tcat-math-fl-5',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Hard',
    q: 'Evaluate \\lim_{x \\to 0} \\frac{1 - \\cos(x)}{x^2}.',
    options: ['1/2', '1', '0', '2'],
    correct: 0,
    explain: '1 - \\cos(x) = 2\\sin^2(x/2). So [2\\sin^2(x/2)] / x^2 = (1/2) · [\\sin(x/2) / (x/2)]^2 -> (1/2)(1)^2 = 1/2.'
  },
  {
    id: 'tcat-math-fl-6',
    subject: 'Mathematics',
    topic: 'Functions and Limits',
    difficulty: 'Hard',
    q: 'For what value of k is the function f(x) = { (x^2 - 9)/(x - 3) for x != 3, k for x = 3 } continuous at x = 3?',
    options: ['6', '3', '9', '0'],
    correct: 0,
    explain: 'For continuity, \\lim_{x \\to 3} f(x) = f(3). \\lim_{x \\to 3} (x^2 - 9)/(x - 3) = \\lim_{x \\to 3} (x + 3) = 6. Thus k = 6.'
  },

  // ==========================================
  // Chapter 14: Differentiation (6 MCQs)
  // ==========================================
  {
    id: 'tcat-math-diff-1',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Easy',
    q: 'What is the derivative of f(x) = \\ln(x) with respect to x for x > 0?',
    options: ['1/x', 'e^x', 'x', '1/x^2'],
    correct: 0,
    explain: 'The standard derivative of the natural logarithm \\ln(x) is d/dx [\\ln(x)] = 1/x.'
  },
  {
    id: 'tcat-math-diff-2',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Easy',
    q: 'What is the derivative of \\tan(x) with respect to x?',
    options: ['\\sec^2(x)', '\\csc^2(x)', '-\\sec^2(x)', '\\tan^2(x)'],
    correct: 0,
    explain: 'By trigonometric differentiation: d/dx [\\tan(x)] = \\sec^2(x).'
  },
  {
    id: 'tcat-math-diff-3',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Medium',
    q: 'If y = e^{3x} \\sin(2x), find dy/dx at x = 0.',
    options: ['2', '3', '5', '0'],
    correct: 0,
    explain: 'dy/dx = 3e^{3x}\\sin(2x) + 2e^{3x}\\cos(2x). At x = 0: dy/dx = 3(1)(0) + 2(1)(1) = 2.'
  },
  {
    id: 'tcat-math-diff-4',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Medium',
    q: 'Find the slope of the tangent to the curve y = x^3 - 3x + 2 at x = 2.',
    options: ['9', '12', '6', '3'],
    correct: 0,
    explain: 'dy/dx = 3x^2 - 3. At x = 2, slope m = 3(2)^2 - 3 = 12 - 3 = 9.'
  },
  {
    id: 'tcat-math-diff-5',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Hard',
    q: 'If x = a\\cos^3(\\theta) and y = a\\sin^3(\\theta), what is dy/dx at \\theta = \\pi/4?',
    options: ['-1', '1', '0', '-2'],
    correct: 0,
    explain: 'dx/d\\theta = -3a\\cos^2(\\theta)\\sin(\\theta), dy/d\\theta = 3a\\sin^2(\\theta)\\cos(\\theta). dy/dx = (dy/d\\theta)/(dx/d\\theta) = -\\tan(\\theta). At \\theta = \\pi/4, dy/dx = -\\tan(\\pi/4) = -1.'
  },
  {
    id: 'tcat-math-diff-6',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Hard',
    q: 'What is the maximum value of the function f(x) = x(10 - x) on the interval [0, 10]?',
    options: ['25', '20', '50', '100'],
    correct: 0,
    explain: 'f(x) = 10x - x^2. f\'(x) = 10 - 2x = 0 => x = 5. f\'\'(x) = -2 < 0 (maximum). Maximum value f(5) = 5(10 - 5) = 25.'
  },

  // ==========================================
  // Chapter 15: Integration (6 MCQs)
  // ==========================================
  {
    id: 'tcat-math-int-1',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Easy',
    q: 'Evaluate \\int \\sec^2(x) dx.',
    options: ['\\tan(x) + c', '-\\tan(x) + c', '\\sec(x)\\tan(x) + c', '2\\sec(x) + c'],
    correct: 0,
    explain: 'Since d/dx [\\tan(x)] = \\sec^2(x), \\int \\sec^2(x) dx = \\tan(x) + c.'
  },
  {
    id: 'tcat-math-int-2',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Easy',
    q: 'Evaluate the definite integral \\int_0^1 (3x^2 + 2x) dx.',
    options: ['2', '1', '3', '5'],
    correct: 0,
    explain: '\\int (3x^2 + 2x) dx = [x^3 + x^2]_0^1 = (1 + 1) - (0) = 2.'
  },
  {
    id: 'tcat-math-int-3',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Medium',
    q: 'Evaluate \\int \\frac{2x}{x^2 + 1} dx.',
    options: ['\\ln(x^2 + 1) + c', '\\arctan(x) + c', '1/(x^2 + 1) + c', '2\\ln(x) + c'],
    correct: 0,
    explain: 'The numerator is the exact derivative of the denominator: \\int [f\'(x)/f(x)] dx = \\ln|f(x)| + c. Thus \\ln(x^2 + 1) + c.'
  },
  {
    id: 'tcat-math-int-4',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Medium',
    q: 'Evaluate by parts: \\int x e^x dx.',
    options: ['e^x (x - 1) + c', 'e^x (x + 1) + c', 'x e^x - e^{-x} + c', 'e^x + c'],
    correct: 0,
    explain: 'Let u = x, dv = e^x dx => du = dx, v = e^x. \\int x e^x dx = x e^x - \\int e^x dx = x e^x - e^x + c = e^x(x - 1) + c.'
  },
  {
    id: 'tcat-math-int-5',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Hard',
    q: 'What is the area enclosed between the parabola y = x^2 and the line y = 4?',
    options: ['32/3', '16/3', '8', '64/3'],
    correct: 0,
    explain: 'Intersections occur at x^2 = 4 => x = -2 to 2. Area = \\int_{-2}^2 (4 - x^2) dx = 2 \\int_0^2 (4 - x^2) dx = 2 [4x - x^3/3]_0^2 = 2 [8 - 8/3] = 2(16/3) = 32/3.'
  },
  {
    id: 'tcat-math-int-6',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Hard',
    q: 'Evaluate \\int_0^{\\pi/2} \\frac{\\sin(x)}{\\sin(x) + \\cos(x)} dx.',
    options: ['\\pi / 4', '\\pi / 2', '1', '\\pi'],
    correct: 0,
    explain: 'Let I = \\int_0^{\\pi/2} \\frac{\\sin x}{\\sin x + \\cos x} dx. Using \\int_0^a f(x)dx = \\int_0^a f(a - x)dx, I = \\int_0^{\\pi/2} \\frac{\\cos x}{\\cos x + \\sin x} dx. Adding both: 2I = \\int_0^{\\pi/2} 1 dx = \\pi/2 => I = \\pi/4.'
  },

  // ==========================================
  // Chapter 16: Introduction to Analytic Geometry (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-ag-1',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Easy',
    q: 'What is the slope of a line perpendicular to 2x - 3y + 6 = 0?',
    options: ['-3/2', '2/3', '3/2', '-2/3'],
    correct: 0,
    explain: 'Slope of given line is m1 = -A/B = -2/(-3) = 2/3. For perpendicular lines, m1 · m2 = -1 => m2 = -1 / (2/3) = -3/2.'
  },
  {
    id: 'tcat-math-ag-2',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Easy',
    q: 'What is the perpendicular distance from the origin (0, 0) to the line 3x + 4y - 10 = 0?',
    options: ['2', '10', '5', '1'],
    correct: 0,
    explain: 'Distance d = |ax1 + by1 + c| / \\sqrt{a^2 + b^2} = |3(0) + 4(0) - 10| / \\sqrt{3^2 + 4^2} = 10 / 5 = 2.'
  },
  {
    id: 'tcat-math-ag-3',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Medium',
    q: 'What is the point dividing the segment joining A(1, 2) and B(4, 8) internally in the ratio 1 : 2?',
    options: ['(2, 4)', '(3, 6)', '(2.5, 5)', '(1.5, 3)'],
    correct: 0,
    explain: 'x = (m1·x2 + m2·x1) / (m1 + m2) = (1(4) + 2(1)) / 3 = 6/3 = 2. y = (1(8) + 2(2)) / 3 = 12/3 = 4. Point is (2, 4).'
  },
  {
    id: 'tcat-math-ag-4',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Medium',
    q: 'What is the equation of the line passing through (2, 3) with an inclination of 45°?',
    options: ['x - y + 1 = 0', 'x + y - 5 = 0', '2x - y - 1 = 0', 'x - y - 1 = 0'],
    correct: 0,
    explain: 'm = \\tan(45°) = 1. Equation is y - y1 = m(x - x1) => y - 3 = 1(x - 2) => y - 3 = x - 2 => x - y + 1 = 0.'
  },
  {
    id: 'tcat-math-ag-5',
    subject: 'Mathematics',
    topic: 'Introduction to Analytic Geometry',
    difficulty: 'Hard',
    q: 'Find the distance between the two parallel lines 3x - 4y + 5 = 0 and 3x - 4y - 15 = 0.',
    options: ['4', '20', '2', '5'],
    correct: 0,
    explain: 'Distance between parallel lines ax + by + c1 = 0 and ax + by + c2 = 0 is d = |c1 - c2| / \\sqrt{a^2 + b^2} = |5 - (-15)| / \\sqrt{9 + 16} = 20 / 5 = 4.'
  },

  // ==========================================
  // Chapter 17: Linear Inequalities and Linear Programming (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-lp-1',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Easy',
    q: 'Which point satisfies the linear inequality 2x + 3y <= 6?',
    options: ['(1, 1)', '(2, 2)', '(3, 1)', '(0, 3)'],
    correct: 0,
    explain: 'Testing (1, 1): 2(1) + 3(1) = 5 <= 6 (True). Testing others: 2(2)+3(2)=10 (False), 2(3)+3(1)=9 (False), 2(0)+3(3)=9 (False).'
  },
  {
    id: 'tcat-math-lp-2',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Easy',
    q: 'In linear programming, the non-negative constraints x >= 0, y >= 0 restrict the feasible region to which quadrant?',
    options: ['First quadrant only', 'Second quadrant', 'Fourth quadrant', 'All four quadrants'],
    correct: 0,
    explain: 'x >= 0 and y >= 0 restricts all valid points to the upper-right quadrant (first quadrant).'
  },
  {
    id: 'tcat-math-lp-3',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Medium',
    q: 'A point where two boundary lines of a feasible region intersect is called a:',
    options: ['Corner point (extreme point)', 'Feasible center', 'Optimum origin', 'Pivot locus'],
    correct: 0,
    explain: 'By definition, the vertices of the polygonal feasible region where bounding constraints intersect are called corner points (or vertices/extreme points).'
  },
  {
    id: 'tcat-math-lp-4',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Medium',
    q: 'Maximize the objective function Z = 3x + 5y given corner points (0, 0), (4, 0), (2, 3), and (0, 4).',
    options: ['Z = 21 at (2, 3)', 'Z = 20 at (0, 4)', 'Z = 12 at (4, 0)', 'Z = 0 at (0, 0)'],
    correct: 0,
    explain: 'Evaluate Z at each corner: Z(0,0)=0; Z(4,0)=12; Z(0,4)=20; Z(2,3)=3(2)+5(3)=6+15=21. Maximum is 21 at (2, 3).'
  },
  {
    id: 'tcat-math-lp-5',
    subject: 'Mathematics',
    topic: 'Linear Inequalities and Linear Programming',
    difficulty: 'Hard',
    q: 'If a feasible region in a linear programming problem is unbounded, then the objective function:',
    options: ['May not have a maximum value', 'Must have both maximum and minimum values', 'Cannot have any solution', 'Always has infinitely many optimal solutions'],
    correct: 0,
    explain: 'For an unbounded feasible region, the objective function may increase indefinitely, meaning a finite maximum may not exist.'
  },

  // ==========================================
  // Chapter 18: Conic Sections (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-cs-1',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Easy',
    q: 'What is the eccentricity e of a parabola?',
    options: ['e = 1', 'e < 1', 'e > 1', 'e = 0'],
    correct: 0,
    explain: 'For a circle e = 0, for an ellipse e < 1, for a parabola e = 1, and for a hyperbola e > 1.'
  },
  {
    id: 'tcat-math-cs-2',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Easy',
    q: 'What is the radius of the circle given by x^2 + y^2 - 4x + 6y - 12 = 0?',
    options: ['5', '25', '\\sqrt{12}', '4'],
    correct: 0,
    explain: '2g = -4 => g = -2; 2f = 6 => f = 3; c = -12. Radius r = \\sqrt{g^2 + f^2 - c} = \\sqrt{(-2)^2 + 3^2 - (-12)} = \\sqrt{4 + 9 + 12} = \\sqrt{25} = 5.'
  },
  {
    id: 'tcat-math-cs-3',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Medium',
    q: 'What is the focus of the parabola y^2 = -16x?',
    options: ['(-4, 0)', '(4, 0)', '(0, -4)', '(0, 4)'],
    correct: 0,
    explain: 'Comparing with y^2 = -4ax: 4a = 16 => a = 4. The parabola opens leftward, so focus is at (-a, 0) = (-4, 0).'
  },
  {
    id: 'tcat-math-cs-4',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Medium',
    q: 'What is the length of the latus rectum of the ellipse x^2/25 + y^2/9 = 1?',
    options: ['18/5', '50/3', '9/5', '10/3'],
    correct: 0,
    explain: 'Here a^2 = 25 (a = 5) and b^2 = 9. Length of latus rectum = 2b^2 / a = 2(9) / 5 = 18/5.'
  },
  {
    id: 'tcat-math-cs-5',
    subject: 'Mathematics',
    topic: 'Conic Sections',
    difficulty: 'Hard',
    q: 'What is the eccentricity of the hyperbola x^2/16 - y^2/9 = 1?',
    options: ['5/4', '4/5', '\\sqrt{7}/4', '7/16'],
    correct: 0,
    explain: 'c^2 = a^2 + b^2 = 16 + 9 = 25 => c = 5. Eccentricity e = c / a = 5 / 4.'
  },

  // ==========================================
  // Chapter 19: Vectors (5 MCQs)
  // ==========================================
  {
    id: 'tcat-math-vec-1',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Easy',
    q: 'What is the magnitude of the vector u = 2i - 3j + 6k?',
    options: ['7', '49', '\\sqrt{11}', '5'],
    correct: 0,
    explain: '|u| = \\sqrt{2^2 + (-3)^2 + 6^2} = \\sqrt{4 + 9 + 36} = \\sqrt{49} = 7.'
  },
  {
    id: 'tcat-math-vec-2',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Easy',
    q: 'Two non-zero vectors u and v are orthogonal (perpendicular) if and only if:',
    options: ['u · v = 0', 'u × v = 0', '|u| = |v|', 'u · v = 1'],
    correct: 0,
    explain: 'u · v = |u||v|\\cos(\\theta). Since \\cos(90°) = 0, orthogonal vectors have dot product equal to 0.'
  },
  {
    id: 'tcat-math-vec-3',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Medium',
    q: 'Find the projection of vector a = i + 2j + 2k onto vector b = 2i + j - 2k.',
    options: ['0', '2/3', '4/3', '2'],
    correct: 0,
    explain: 'Projection = (a · b) / |b|. a · b = 1(2) + 2(1) + 2(-2) = 2 + 2 - 4 = 0. Thus the projection is 0 (the vectors are perpendicular).'
  },
  {
    id: 'tcat-math-vec-4',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Medium',
    q: 'What is the area of a parallelogram whose adjacent sides are given by vectors a = i + j and b = j + k?',
    options: ['\\sqrt{3}', '3', '1', '\\sqrt{2}'],
    correct: 0,
    explain: 'Area = |a × b|. a = (1, 1, 0), b = (0, 1, 1). a × b = (1 - 0)i - (1 - 0)j + (1 - 0)k = i - j + k. Magnitude = \\sqrt{1^2 + (-1)^2 + 1^2} = \\sqrt{3}.'
  },
  {
    id: 'tcat-math-vec-5',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Hard',
    q: 'What is the volume of a parallelepiped determined by vectors u = (1, 0, 0), v = (0, 2, 0), and w = (1, 1, 3)?',
    options: ['6', '5', '3', '12'],
    correct: 0,
    explain: 'Volume = |[u v w]| = |det([[1, 0, 0], [0, 2, 0], [1, 1, 3]])| = |1(6 - 0) - 0 + 0| = 6 cubic units.'
  }
];

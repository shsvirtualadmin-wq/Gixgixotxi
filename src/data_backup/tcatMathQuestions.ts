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
  },
  {
    id: "tcat-math-ns-6",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Easy",
    q: "Every non-terminating and non-periodic decimal fraction represents which type of number?",
    options: ["An irrational number","A rational number","An integer","A prime number"],
    correct: 0,
    explain: "Non-terminating and non-repeating (non-periodic) decimals cannot be expressed as p/q where p, q are integers and q != 0, so they represent irrational numbers."
  },
  {
    id: "tcat-math-ns-7",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Easy",
    q: "What is the additive inverse of the complex number z = -4 + 7i?",
    options: ["4 - 7i","-4 - 7i","4 + 7i","7 - 4i"],
    correct: 0,
    explain: "The additive inverse of a complex number z = a + bi is -z = -a - bi. For z = -4 + 7i, -z = 4 - 7i."
  },
  {
    id: "tcat-math-ns-8",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Medium",
    q: "Find the multiplicative inverse of the complex number z = (1, 2) in ordered pair notation.",
    options: ["(1/5, -2/5)","(-1/5, 2/5)","(1/3, -2/3)","(-1/5, -2/5)"],
    correct: 0,
    explain: "For z = (a, b), the multiplicative inverse is (a / (a^2 + b^2), -b / (a^2 + b^2)). Here a = 1, b = 2, so a^2 + b^2 = 5, yielding (1/5, -2/5)."
  },
  {
    id: "tcat-math-ns-9",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Medium",
    q: "Simplify the algebraic expression: (1 + i)^4.",
    options: ["-4","4","4i","-4i"],
    correct: 0,
    explain: "(1 + i)^2 = 1 + 2i + i^2 = 2i. Therefore, (1 + i)^4 = (2i)^2 = 4i^2 = -4."
  },
  {
    id: "tcat-math-ns-10",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Hard",
    q: "According to De Moivre's theorem, what is the value of (cos(theta) + i*sin(theta))^n when n is a negative integer -m (where m is positive)?",
    options: ["cos(m*theta) - i*sin(m*theta)","cos(m*theta) + i*sin(m*theta)","-cos(m*theta) - i*sin(m*theta)","-cos(m*theta) + i*sin(m*theta)"],
    correct: 0,
    explain: "(cos(theta) + i*sin(theta))^(-m) = cos(-m*theta) + i*sin(-m*theta) = cos(m*theta) - i*sin(m*theta) because cosine is an even function and sine is odd."
  },
  {
    id: "tcat-math-ns-11",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Hard",
    q: "What is the principal argument Arg(z) of the complex number z = -sqrt(3) + i?",
    options: ["5*pi/6","2*pi/3","-5*pi/6","7*pi/6"],
    correct: 0,
    explain: "The point (-sqrt(3), 1) lies in the second quadrant. The reference angle is alpha = arctan(|1 / -sqrt(3)|) = pi/6. Thus, Arg(z) = pi - pi/6 = 5*pi/6."
  },
  {
    id: "tcat-math-sfg-6",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Easy",
    q: "If a finite set A contains 5 distinct elements, how many proper subsets does A possess?",
    options: ["31","32","25","16"],
    correct: 0,
    explain: "The total number of subsets for a set with n elements is 2^n = 2^5 = 32. The number of proper subsets excludes the set itself: 2^n - 1 = 31."
  },
  {
    id: "tcat-math-sfg-7",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Medium",
    q: "Let f: R -> R be defined by f(x) = 3x - 5. What is the inverse function f^(-1)(x)?",
    options: ["(x + 5)/3","(x - 5)/3","3/(x + 5)","(5 - x)/3"],
    correct: 0,
    explain: "Let y = 3x - 5. Solving for x in terms of y yields 3x = y + 5 => x = (y + 5)/3. Therefore, f^(-1)(x) = (x + 5)/3."
  },
  {
    id: "tcat-math-sfg-8",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Medium",
    q: "Which axiom is NOT required for an algebraic structure (S, *) to qualify as a semi-group?",
    options: ["Existence of an identity element","Closure property","Associative property","Well-defined binary operation"],
    correct: 0,
    explain: "A semi-group requires only closure and associativity. An identity element is required for a monoid, not a general semi-group."
  },
  {
    id: "tcat-math-sfg-9",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Hard",
    q: "In any group (G, *), what is the inverse of the compound element (a * b) for all a, b in G?",
    options: ["b^(-1) * a^(-1)","a^(-1) * b^(-1)","(a * b)^(-1)","b * a"],
    correct: 0,
    explain: "By the reversal law of inverses in abstract algebra, (a * b)^(-1) = b^(-1) * a^(-1)."
  },
  {
    id: "tcat-math-sfg-10",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Hard",
    q: "What is the order of the cyclic group formed by the fourth roots of unity {1, -1, i, -i} under complex multiplication?",
    options: ["4","2","1","Infinite"],
    correct: 0,
    explain: "The set {1, -1, i, -i} has 4 elements and is generated by i (i^1=i, i^2=-1, i^3=-i, i^4=1). Its group order is 4."
  },
  {
    id: "tcat-math-mat-7",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Easy",
    q: "If A is a square matrix of order n such that A^t = -A, then matrix A is called a:",
    options: ["Skew-symmetric matrix","Symmetric matrix","Orthogonal matrix","Hermitian matrix"],
    correct: 0,
    explain: "A matrix A is skew-symmetric if its transpose equals its negative (A^t = -A), with all principal diagonal entries equal to zero."
  },
  {
    id: "tcat-math-mat-8",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Medium",
    q: "If A is a 3x3 matrix with determinant |A| = 4, what is the determinant of the scalar multiple 2A?",
    options: ["32","8","16","64"],
    correct: 0,
    explain: "For an n x n matrix, |k*A| = k^n * |A|. Here n = 3 and k = 2, so |2A| = 2^3 * 4 = 8 * 4 = 32."
  },
  {
    id: "tcat-math-mat-9",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Hard",
    q: "If A is a non-singular square matrix of order 3 with determinant |A| = 3, what is the determinant of adj(A)?",
    options: ["9","3","27","1/3"],
    correct: 0,
    explain: "For any n x n matrix A, |adj(A)| = |A|^(n - 1). For n = 3, |adj(A)| = |A|^2 = 3^2 = 9."
  },
  {
    id: "tcat-math-mat-10",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Hard",
    q: "What is the rank of the matrix A = [[1, 2, 3], [2, 4, 6], [3, 6, 9]]?",
    options: ["1","2","3","0"],
    correct: 0,
    explain: "Rows 2 and 3 are exact scalar multiples of Row 1 (R2 = 2*R1, R3 = 3*R1). In row echelon form, two rows reduce to zeros, leaving exactly 1 non-zero row."
  },
  {
    id: "tcat-math-mat-11",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Hard",
    q: "If A and B are symmetric matrices of the same order, under what condition is the product AB also symmetric?",
    options: ["AB = BA (matrices commute)","A = B","AB = -BA","|A| = |B|"],
    correct: 0,
    explain: "(AB)^t = B^t * A^t = BA. For AB to be symmetric, (AB)^t must equal AB, meaning BA = AB (the matrices must commute)."
  },
  {
    id: "tcat-math-quad-7",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Easy",
    q: "What is the nature of the roots of the quadratic equation 3x^2 - 4x + 2 = 0?",
    options: ["Complex and unequal","Real, rational and equal","Real, irrational and unequal","Real, rational and unequal"],
    correct: 0,
    explain: "Discriminant Delta = b^2 - 4ac = (-4)^2 - 4(3)(2) = 16 - 24 = -8. Since Delta < 0, roots are complex conjugate and unequal."
  },
  {
    id: "tcat-math-quad-8",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Medium",
    q: "If the sum of the roots of k*x^2 - 6x + 2k = 0 is equal to their product, find the value of k (where k != 0).",
    options: ["3","2","6","1/3"],
    correct: 0,
    explain: "Sum of roots = -(-6)/k = 6/k. Product of roots = 2k/k = 2. Setting 6/k = 2 gives k = 3."
  },
  {
    id: "tcat-math-quad-9",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Medium",
    q: "If alpha and beta are the roots of x^2 - 5x + 6 = 0, what is the numerical value of alpha^2 + beta^2?",
    options: ["13","25","19","37"],
    correct: 0,
    explain: "alpha + beta = 5 and alpha * beta = 6. Then alpha^2 + beta^2 = (alpha + beta)^2 - 2*alpha*beta = 25 - 2(6) = 13."
  },
  {
    id: "tcat-math-quad-10",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Hard",
    q: "Find the quadratic equation whose roots are the reciprocals of the roots of ax^2 + bx + c = 0 (where a, c != 0).",
    options: ["cx^2 + bx + a = 0","cx^2 - bx + a = 0","ax^2 - bx + c = 0","cx^2 + ax + b = 0"],
    correct: 0,
    explain: "Substituting x by 1/x: a(1/x)^2 + b(1/x) + c = 0. Multiplying through by x^2 yields cx^2 + bx + a = 0."
  },
  {
    id: "tcat-math-quad-11",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Hard",
    q: "If omega is an imaginary cube root of unity, simplify the expression: (2 + 5*omega + 2*omega^2)^6.",
    options: ["729","-729","243","64"],
    correct: 0,
    explain: "Rewrite as 2(1 + omega^2) + 5*omega. Since 1 + omega + omega^2 = 0, 1 + omega^2 = -omega. So 2(-omega) + 5*omega = 3*omega. Raising to power 6 gives (3*omega)^6 = 3^6 * omega^6 = 729 * 1 = 729."
  },
  {
    id: "tcat-math-pf-6",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Easy",
    q: "Which of the following rational expressions represents an improper fraction?",
    options: ["(x^3 + 1) / (x^2 + 4)","(x + 1) / (x^2 + 4)","(2x - 3) / (x^3 - 1)","1 / (x + 2)"],
    correct: 0,
    explain: "A rational fraction is improper when the degree of the numerator polynomial is greater than or equal to the degree of the denominator polynomial. Degree 3 >= 2."
  },
  {
    id: "tcat-math-pf-7",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Easy",
    q: "How many partial fractions will the proper rational fraction 1 / [(x - 1)(x + 2)(x - 3)] decompose into?",
    options: ["3","2","4","1"],
    correct: 0,
    explain: "The denominator contains 3 distinct non-repeated linear factors, producing 3 terms: A/(x - 1) + B/(x + 2) + C/(x - 3)."
  },
  {
    id: "tcat-math-pf-8",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Medium",
    q: "Find the constant A in the partial fraction expansion: 1 / [(x - 2)(x + 3)] = A/(x - 2) + B/(x + 3).",
    options: ["1/5","-1/5","1","1/6"],
    correct: 0,
    explain: "Using the cover-up rule for A: multiply by (x - 2) and evaluate at x = 2: A = 1 / (2 + 3) = 1/5."
  },
  {
    id: "tcat-math-pf-9",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Hard",
    q: "What is the correct partial fraction decomposition form for (x^2 + 1) / [(x - 1)^2 * (x^2 + 3)]?",
    options: ["A/(x - 1) + B/(x - 1)^2 + (Cx + D)/(x^2 + 3)","A/(x - 1) + B/(x^2 + 3)","A/(x - 1)^2 + (Bx + C)/(x^2 + 3)","A/(x - 1) + B/(x - 1)^2 + C/(x^2 + 3)"],
    correct: 0,
    explain: "Repeated linear factor (x - 1)^2 gives A/(x - 1) + B/(x - 1)^2, and irreducible quadratic factor (x^2 + 3) requires (Cx + D)/(x^2 + 3)."
  },
  {
    id: "tcat-math-pf-10",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Hard",
    q: "If (x^3) / (x^2 - 1) is converted to proper rational form by polynomial division, what is the quotient polynomial?",
    options: ["x","x + 1","1","x^2"],
    correct: 0,
    explain: "Dividing x^3 by (x^2 - 1): x^3 = x*(x^2 - 1) + x. Thus (x^3)/(x^2 - 1) = x + x/(x^2 - 1). The quotient polynomial is x."
  },
  {
    id: "tcat-math-seq-6",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Easy",
    q: "What is the common ratio r of the geometric progression: 2, -6, 18, -54, ...?",
    options: ["-3","3","-1/3","-4"],
    correct: 0,
    explain: "The common ratio is r = a2 / a1 = -6 / 2 = -3."
  },
  {
    id: "tcat-math-seq-7",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Easy",
    q: "What is the Harmonic Mean (HM) between the two positive numbers 2 and 8?",
    options: ["3.2","5","4","3.5"],
    correct: 0,
    explain: "HM = 2ab / (a + b) = 2(2)(8) / (2 + 8) = 32 / 10 = 3.2."
  },
  {
    id: "tcat-math-seq-8",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Medium",
    q: "For what range of x does the infinite geometric series 1 + x + x^2 + ... converge?",
    options: ["|x| < 1","|x| <= 1","x > 1","For all real x"],
    correct: 0,
    explain: "An infinite geometric series converges if and only if the absolute value of the common ratio |r| < 1. Here r = x, so |x| < 1."
  },
  {
    id: "tcat-math-seq-9",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Medium",
    q: "If the sum of n terms of an arithmetic progression is S_n = 2n^2 + 3n, find the 5th term a_5.",
    options: ["21","25","19","17"],
    correct: 0,
    explain: "a_n = S_n - S_{n-1}. S_5 = 2(25) + 3(5) = 65. S_4 = 2(16) + 3(4) = 44. Thus a_5 = 65 - 44 = 21."
  },
  {
    id: "tcat-math-seq-10",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Hard",
    q: "What is the closed-form sum of squares of the first n natural numbers 1^2 + 2^2 + 3^2 + ... + n^2?",
    options: ["n(n + 1)(2n + 1) / 6","[n(n + 1) / 2]^2","n(n + 1) / 2","n(2n + 1) / 3"],
    correct: 0,
    explain: "The formula for the sum of the squares of the first n natural numbers is Sigma k^2 = n(n + 1)(2n + 1) / 6."
  },
  {
    id: "tcat-math-seq-11",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Hard",
    q: "If A, G, and H are the Arithmetic, Geometric, and Harmonic means between two distinct positive numbers, which relationship holds strictly true?",
    options: ["A > G > H","A < G < H","G > A > H","A = G = H"],
    correct: 0,
    explain: "For any two unequal positive real numbers, A > G > H, with G^2 = A * H."
  },
  {
    id: "tcat-math-pcp-6",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Easy",
    q: "What is the numerical value of 0! (zero factorial)?",
    options: ["1","0","Undefined","-1"],
    correct: 0,
    explain: "By mathematical definition and convention in combinatorics, 0! = 1."
  },
  {
    id: "tcat-math-pcp-7",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Medium",
    q: "How many different 4-letter words can be formed using the letters of the word \"MATHS\" without repetition?",
    options: ["120","24","60","720"],
    correct: 0,
    explain: "5P4 = 5! / (5 - 4)! = 120 / 1 = 120."
  },
  {
    id: "tcat-math-pcp-8",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Medium",
    q: "A single card is drawn from a standard deck of 52 playing cards. What is the probability of drawing either a King or a Heart?",
    options: ["4/13","17/52","1/4","9/52"],
    correct: 0,
    explain: "There are 4 Kings and 13 Hearts, with 1 card being the King of Hearts. By addition rule: P = 4/52 + 13/52 - 1/52 = 16/52 = 4/13."
  },
  {
    id: "tcat-math-pcp-9",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Hard",
    q: "In how many ways can 6 beads of different colors be arranged to form a circular necklace?",
    options: ["60","120","720","360"],
    correct: 0,
    explain: "For a necklace that can be flipped over, clockwise and counterclockwise arrangements are indistinguishable: (n - 1)! / 2 = 5! / 2 = 60."
  },
  {
    id: "tcat-math-pcp-10",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Hard",
    q: "What is the total number of distinct permutations that can be formed using all letters of the word \"PAKISTAN\"?",
    options: ["20160","40320","10080","5040"],
    correct: 0,
    explain: "\"PAKISTAN\" contains 8 letters with 'A' repeating 2 times. Total permutations = 8! / 2! = 40320 / 2 = 20160."
  },
  {
    id: "tcat-math-pcp-11",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Hard",
    q: "If events A and B are independent with P(A) = 0.4 and P(B) = 0.5, what is P(A union B)?",
    options: ["0.7","0.9","0.2","0.6"],
    correct: 0,
    explain: "For independent events, P(A intersect B) = 0.4 * 0.5 = 0.2. Then P(A union B) = P(A) + P(B) - P(A intersect B) = 0.4 + 0.5 - 0.2 = 0.7."
  },
  {
    id: "tcat-math-mib-6",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Easy",
    q: "In the principle of mathematical induction, what is the initial verification step called?",
    options: ["Basis step (base step)","Inductive hypothesis","Inductive conclusion","Transitive step"],
    correct: 0,
    explain: "The step verifying the proposition for the initial value (usually n = 1) is called the basis step or base step."
  },
  {
    id: "tcat-math-mib-7",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Medium",
    q: "What is the sum of the odd binomial coefficients C1 + C3 + C5 + ... in the expansion of (1 + x)^n?",
    options: ["2^(n - 1)","2^n","2^(n + 1)","2^(n - 2)"],
    correct: 0,
    explain: "Sum of all coefficients is 2^n. Sum of odd coefficients equals sum of even coefficients = 2^n / 2 = 2^(n - 1)."
  },
  {
    id: "tcat-math-mib-8",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Hard",
    q: "What is the coefficient of x^3 in the expansion of (1 - 2x)^5?",
    options: ["-80","80","-40","40"],
    correct: 0,
    explain: "General term is 5Cr * 1^(5-r) * (-2x)^r. For x^3, r = 3: 5C3 * (-2)^3 = 10 * (-8) = -80."
  },
  {
    id: "tcat-math-mib-9",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Hard",
    q: "If the expansion of (x + a)^n contains exactly 11 terms, what is the value of n?",
    options: ["10","11","12","9"],
    correct: 0,
    explain: "The binomial expansion of (x + a)^n with positive integer exponent n contains exactly n + 1 terms. Therefore n + 1 = 11 => n = 10."
  },
  {
    id: "tcat-math-mib-10",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Hard",
    q: "For what condition on x is the infinite binomial series (1 + x)^(-2) valid and convergent?",
    options: ["|x| < 1","|x| <= 1","x > 1","For all real x"],
    correct: 0,
    explain: "When the exponent n is a rational or negative number, the expansion of (1 + x)^n converges if and only if |x| < 1."
  },
  {
    id: "tcat-math-fot-6",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Easy",
    q: "If an angle in standard position has its terminal side lying on the negative y-axis, what is its radian measure?",
    options: ["3*pi/2","pi","pi/2","2*pi"],
    correct: 0,
    explain: "The negative y-axis corresponds to 270 degrees, which equals 3*pi/2 radians."
  },
  {
    id: "tcat-math-fot-7",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Easy",
    q: "In which quadrant do both conditions sin(theta) < 0 and cos(theta) > 0 simultaneously hold?",
    options: ["Quadrant IV","Quadrant III","Quadrant II","Quadrant I"],
    correct: 0,
    explain: "In Quadrant IV, x-coordinates (cosine) are positive while y-coordinates (sine) are negative."
  },
  {
    id: "tcat-math-fot-8",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Medium",
    q: "If tan(theta) = 3/4 and theta lies in the third quadrant, what is the value of cos(theta)?",
    options: ["-4/5","4/5","-3/5","3/5"],
    correct: 0,
    explain: "In Quadrant III, cosine is negative. With opposite = 3 and adjacent = 4, hypotenuse = 5, so cos(theta) = -4/5."
  },
  {
    id: "tcat-math-fot-9",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Hard",
    q: "Find the length of the arc of a circle of radius 6 cm subtended by a central angle of 30 degrees.",
    options: ["pi cm","2*pi cm","3*pi cm","pi/2 cm"],
    correct: 0,
    explain: "Convert 30 degrees to radians: theta = 30 * pi/180 = pi/6 rad. Arc length s = r * theta = 6 * (pi/6) = pi cm."
  },
  {
    id: "tcat-math-fot-10",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Hard",
    q: "Simplify the trigonometric expression: (1 - sin^2(x)) * (1 + tan^2(x)).",
    options: ["1","sin^2(x)","cos^2(x)","tan^2(x)"],
    correct: 0,
    explain: "1 - sin^2(x) = cos^2(x), and 1 + tan^2(x) = sec^2(x). Their product is cos^2(x) * sec^2(x) = 1."
  },
  {
    id: "tcat-math-ti-6",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Easy",
    q: "Which of the following is the correct double-angle formula for cos(2*alpha) exclusively in terms of sin(alpha)?",
    options: ["1 - 2*sin^2(alpha)","2*sin^2(alpha) - 1","1 - sin^2(alpha)","2*cos^2(alpha) - 1"],
    correct: 0,
    explain: "cos(2*alpha) = cos^2(alpha) - sin^2(alpha) = (1 - sin^2(alpha)) - sin^2(alpha) = 1 - 2*sin^2(alpha)."
  },
  {
    id: "tcat-math-ti-7",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Medium",
    q: "What is the exact algebraic value of sin(105 degrees)?",
    options: ["(sqrt(6) + sqrt(2)) / 4","(sqrt(6) - sqrt(2)) / 4","(sqrt(3) + 1) / 2","sqrt(2) / 2"],
    correct: 0,
    explain: "sin(105) = sin(60 + 45) = sin(60)cos(45) + cos(60)sin(45) = (sqrt(3)/2)(sqrt(2)/2) + (1/2)(sqrt(2)/2) = (sqrt(6) + sqrt(2)) / 4."
  },
  {
    id: "tcat-math-ti-8",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Medium",
    q: "Express cos(70°) - cos(20°) in product form:",
    options: ["-2*sin(45°)*sin(25°)","2*cos(45°)*cos(25°)","2*sin(45°)*sin(25°)","-2*cos(45°)*sin(25°)"],
    correct: 0,
    explain: "Using cos(C) - cos(D) = -2*sin((C + D)/2)*sin((C - D)/2): cos(70°) - cos(20°) = -2*sin(45°)*sin(25°)."
  },
  {
    id: "tcat-math-ti-9",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Hard",
    q: "Simplify the identity: sin(3*theta)/sin(theta) - cos(3*theta)/cos(theta).",
    options: ["2","1","4*cos(2*theta)","0"],
    correct: 0,
    explain: "Combine over common denominator: [sin(3*theta)cos(theta) - cos(3*theta)sin(theta)] / [sin(theta)cos(theta)] = sin(3*theta - theta) / [(1/2)sin(2*theta)] = sin(2*theta) / [(1/2)sin(2*theta)] = 2."
  },
  {
    id: "tcat-math-ti-10",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Hard",
    q: "If tan(A) = 3/4 and tan(B) = 1/7, what is the value of tan(A + B)?",
    options: ["1","4/3","11/25","2"],
    correct: 0,
    explain: "tan(A + B) = (tan A + tan B) / (1 - tan A tan B) = (3/4 + 1/7) / (1 - (3/4)(1/7)) = (25/28) / (25/28) = 1."
  },
  {
    id: "tcat-math-tfg-6",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Easy",
    q: "What is the fundamental period of the cotangent function y = cot(x)?",
    options: ["pi","2*pi","pi/2","4*pi"],
    correct: 0,
    explain: "Like the tangent function, cot(x) repeats its values every pi radians."
  },
  {
    id: "tcat-math-tfg-7",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Easy",
    q: "What is the domain of the principal inverse sine function y = arcsin(x)?",
    options: ["[-1, 1]","(-infinity, infinity)","[0, pi]","[-pi/2, pi/2]"],
    correct: 0,
    explain: "Since the sine function maps real numbers to [-1, 1], its inverse arcsin(x) is defined only on the domain [-1, 1]."
  },
  {
    id: "tcat-math-tfg-8",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Medium",
    q: "What is the period of the function f(x) = cos(x / 3)?",
    options: ["6*pi","2*pi/3","3*pi","2*pi"],
    correct: 0,
    explain: "Period of cos(kx) is 2*pi / k. Here k = 1/3, so period = 2*pi / (1/3) = 6*pi."
  },
  {
    id: "tcat-math-tfg-9",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Hard",
    q: "Evaluate the exact value of the sum: arcsin(1/2) + arccos(1/2).",
    options: ["pi/2","pi/4","pi","pi/3"],
    correct: 0,
    explain: "arcsin(1/2) = pi/6, arccos(1/2) = pi/3. Their sum is pi/6 + pi/3 = pi/2. In general, arcsin(x) + arccos(x) = pi/2 for all x in [-1, 1]."
  },
  {
    id: "tcat-math-tfg-10",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Hard",
    q: "Find all solutions to the trigonometric equation sin(x) = 1/2 within the interval [0, 2*pi).",
    options: ["{pi/6, 5*pi/6}","{pi/6, 7*pi/6}","{pi/3, 2*pi/3}","{pi/6, 11*pi/6}"],
    correct: 0,
    explain: "sin(x) is positive in quadrants I and II. In quadrant I, x = pi/6. In quadrant II, x = pi - pi/6 = 5*pi/6."
  },
  {
    id: "tcat-math-aot-6",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Easy",
    q: "If the angle of elevation of the sun is 45°, what is the length of the shadow cast by a 10-meter vertical pole?",
    options: ["10 meters","10*sqrt(3) meters","10/sqrt(3) meters","5 meters"],
    correct: 0,
    explain: "tan(45°) = height / shadow => 1 = 10 / shadow => shadow = 10 meters."
  },
  {
    id: "tcat-math-aot-7",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Medium",
    q: "In any triangle ABC, the Law of Tangents is expressed as:",
    options: ["(a - b)/(a + b) = tan((alpha - beta)/2) / tan((alpha + beta)/2)","(a + b)/(a - b) = tan((alpha - beta)/2) / tan((alpha + beta)/2)","(a - b)/(a + b) = sin((alpha - beta)/2) / sin((alpha + beta)/2)","(a - b)/(a + b) = cos((alpha - beta)/2) / cos((alpha + beta)/2)"],
    correct: 0,
    explain: "By Napier's analogies / Law of Tangents: (a - b)/(a + b) = tan((alpha - beta)/2) / tan((alpha + beta)/2)."
  },
  {
    id: "tcat-math-aot-8",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Medium",
    q: "In triangle ABC, if side a = 4, side b = 5, and included angle gamma = 60°, what is the area Delta of the triangle?",
    options: ["5*sqrt(3) sq units","10*sqrt(3) sq units","10 sq units","5 sq units"],
    correct: 0,
    explain: "Area Delta = (1/2)*a*b*sin(gamma) = (1/2)*(4)*(5)*sin(60°) = 10*(sqrt(3)/2) = 5*sqrt(3) sq units."
  },
  {
    id: "tcat-math-aot-9",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Hard",
    q: "What is the formula for the radius r1 of the excircle opposite to vertex A in terms of triangle area Delta and semi-perimeter s?",
    options: ["Delta / (s - a)","Delta / (s - b)","Delta / s","(s - a) / Delta"],
    correct: 0,
    explain: "The ex-radii are given by r1 = Delta / (s - a), r2 = Delta / (s - b), and r3 = Delta / (s - c)."
  },
  {
    id: "tcat-math-aot-10",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Hard",
    q: "In a triangle ABC, if circumradius R = 10 cm and side a = 10 cm, what is the measure of angle alpha opposite to side a?",
    options: ["30°","45°","60°","90°"],
    correct: 0,
    explain: "By the extended Law of Sines: a / sin(alpha) = 2R => 10 / sin(alpha) = 20 => sin(alpha) = 1/2. Hence alpha = 30°."
  },
  {
    id: "tcat-math-fl-7",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Easy",
    q: "If f(x) = x^2 - 4, what is the expanded expression for f(x + 2)?",
    options: ["x^2 + 4x","x^2","x^2 + 4","x^2 - 4x"],
    correct: 0,
    explain: "f(x + 2) = (x + 2)^2 - 4 = x^2 + 4x + 4 - 4 = x^2 + 4x."
  },
  {
    id: "tcat-math-fl-8",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Medium",
    q: "Evaluate the limit: lim_{x -> 0} (e^(2x) - 1) / x.",
    options: ["2","1","e^2","0"],
    correct: 0,
    explain: "Using standard limit lim_{u -> 0} (e^u - 1)/u = 1 with u = 2x: lim_{x -> 0} 2*(e^(2x) - 1)/(2x) = 2 * 1 = 2."
  },
  {
    id: "tcat-math-fl-9",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Medium",
    q: "What is the natural domain of the real-valued function f(x) = sqrt(x^2 - 16)?",
    options: ["(-infinity, -4] U [4, infinity)","[-4, 4]","(-4, 4)","[4, infinity)"],
    correct: 0,
    explain: "For f(x) to be real, the radicand x^2 - 16 >= 0 => (x - 4)(x + 4) >= 0 => x <= -4 or x >= 4, which is (-infinity, -4] U [4, infinity)."
  },
  {
    id: "tcat-math-fl-10",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Hard",
    q: "Evaluate the limit: lim_{x -> 0} [sqrt(1 + x) - 1] / x.",
    options: ["1/2","1","0","2"],
    correct: 0,
    explain: "Rationalize the numerator: [sqrt(1 + x) - 1][sqrt(1 + x) + 1] / [x(sqrt(1 + x) + 1)] = x / [x(sqrt(1 + x) + 1)] = 1 / (1 + 1) = 1/2."
  },
  {
    id: "tcat-math-fl-11",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Hard",
    q: "For the signum-like function f(x) = |x| / x (where x != 0), what is the right-hand limit lim_{x -> 0^+} f(x)?",
    options: ["1","-1","0","Does not exist"],
    correct: 0,
    explain: "For x > 0, |x| = x, so f(x) = x/x = 1. Therefore, lim_{x -> 0^+} f(x) = 1."
  },
  {
    id: "tcat-math-diff-7",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Easy",
    q: "What is the derivative of the exponential function f(x) = a^x (where a > 0, a != 1) with respect to x?",
    options: ["a^x * ln(a)","a^x / ln(a)","x * a^(x - 1)","a^x"],
    correct: 0,
    explain: "By the exponential derivative rule, d/dx(a^x) = a^x * ln(a)."
  },
  {
    id: "tcat-math-diff-8",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Medium",
    q: "Find the slope dy/dx of the circle x^2 + y^2 = 25 at the point (3, 4).",
    options: ["-3/4","3/4","-4/3","4/3"],
    correct: 0,
    explain: "Differentiating implicitly: 2x + 2y*(dy/dx) = 0 => dy/dx = -x/y. At (3, 4), dy/dx = -3/4."
  },
  {
    id: "tcat-math-diff-9",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Hard",
    q: "What is the derivative of y = arcsin(2x) with respect to x for |2x| < 1?",
    options: ["2 / sqrt(1 - 4x^2)","1 / sqrt(1 - 4x^2)","2 / (1 + 4x^2)","-2 / sqrt(1 - 4x^2)"],
    correct: 0,
    explain: "Using chain rule: dy/dx = [1 / sqrt(1 - (2x)^2)] * d/dx(2x) = 2 / sqrt(1 - 4x^2)."
  },
  {
    id: "tcat-math-diff-10",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Hard",
    q: "A continuous function f(x) has a point of inflection at x = c if:",
    options: ["f''(c) = 0 and f''(x) changes sign across x = c","f'(c) = 0 and f''(c) > 0","f'(c) = 0 and f''(c) < 0","f''(c) > 0 for all x"],
    correct: 0,
    explain: "A point of inflection occurs where the concavity changes, requiring f''(c) = 0 (or undefined) with f''(x) changing sign across c."
  },
  {
    id: "tcat-math-diff-11",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Hard",
    q: "Find the equation of the normal line to the curve y = x^2 at the point (1, 1).",
    options: ["x + 2y - 3 = 0","2x - y - 1 = 0","x - 2y + 1 = 0","2x + y - 3 = 0"],
    correct: 0,
    explain: "dy/dx = 2x => slope of tangent at x = 1 is m_t = 2. Slope of normal m_n = -1/2. Equation: y - 1 = -1/2(x - 1) => 2y - 2 = -x + 1 => x + 2y - 3 = 0."
  },
  {
    id: "tcat-math-int-7",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Easy",
    q: "Evaluate the indefinite integral: integral of e^(3x) dx.",
    options: ["(1/3)*e^(3x) + C","3*e^(3x) + C","e^(3x) + C","(1/3)*e^x + C"],
    correct: 0,
    explain: "int e^(ax) dx = (1/a)*e^(ax) + C. Here a = 3, so (1/3)*e^(3x) + C."
  },
  {
    id: "tcat-math-int-8",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Medium",
    q: "Evaluate the integral: integral of 1 / (x^2 + 9) dx.",
    options: ["(1/3)*arctan(x/3) + C","arctan(x/3) + C","(1/9)*arctan(x/9) + C","ln(x^2 + 9) + C"],
    correct: 0,
    explain: "Using standard form int 1 / (x^2 + a^2) dx = (1/a)*arctan(x/a) + C. With a = 3: (1/3)*arctan(x/3) + C."
  },
  {
    id: "tcat-math-int-9",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Hard",
    q: "Evaluate the definite integral: int_0^(pi/4) sec^2(x) dx.",
    options: ["1","0","sqrt(2)","pi/4"],
    correct: 0,
    explain: "Antiderivative of sec^2(x) is tan(x). Evaluating from 0 to pi/4: tan(pi/4) - tan(0) = 1 - 0 = 1."
  },
  {
    id: "tcat-math-int-10",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Hard",
    q: "Using integration by parts, what is the antiderivative of ln(x) dx?",
    options: ["x*ln(x) - x + C","x*ln(x) + x + C","1/x + C","(ln x)^2 / 2 + C"],
    correct: 0,
    explain: "Let u = ln(x), dv = dx. Then du = 1/x dx, v = x. int ln(x) dx = x*ln(x) - int x*(1/x) dx = x*ln(x) - x + C."
  },
  {
    id: "tcat-math-int-11",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Hard",
    q: "Evaluate the integral: integral of (3x + 2) / (x^2 + 1) dx.",
    options: ["(3/2)*ln(x^2 + 1) + 2*arctan(x) + C","3*ln(x^2 + 1) + 2*arctan(x) + C","(3/2)*ln(x^2 + 1) + arctan(x) + C","3*arctan(x) + 2*ln(x^2 + 1) + C"],
    correct: 0,
    explain: "Split: 3/2 * int (2x)/(x^2 + 1) dx + 2 * int 1/(x^2 + 1) dx = (3/2)*ln(x^2 + 1) + 2*arctan(x) + C."
  },
  {
    id: "tcat-math-ag-6",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Easy",
    q: "What is the midpoint of the line segment connecting P(2, -4) and Q(6, 8)?",
    options: ["(4, 2)","(4, -2)","(8, 4)","(2, 6)"],
    correct: 0,
    explain: "Midpoint M = ((x1 + x2)/2, (y1 + y2)/2) = ((2 + 6)/2, (-4 + 8)/2) = (4, 2)."
  },
  {
    id: "tcat-math-ag-7",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Easy",
    q: "What is the slope of any horizontal line parallel to the x-axis?",
    options: ["0","1","Undefined (infinity)","-1"],
    correct: 0,
    explain: "A line parallel to the x-axis has delta y = 0, so slope m = 0 / delta x = 0."
  },
  {
    id: "tcat-math-ag-8",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Medium",
    q: "Find the acute angle theta between two lines having slopes m1 = 2 and m2 = -3.",
    options: ["45°","30°","60°","90°"],
    correct: 0,
    explain: "tan(theta) = |(m2 - m1) / (1 + m1*m2)| = |(-3 - 2) / (1 + (2)(-3))| = |-5 / -5| = 1 => theta = 45°."
  },
  {
    id: "tcat-math-ag-9",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Medium",
    q: "What is the equation of the line passing through (2, 3) with a slope of -1?",
    options: ["x + y - 5 = 0","x - y + 1 = 0","x + y + 5 = 0","2x + y - 7 = 0"],
    correct: 0,
    explain: "Point-slope form: y - 3 = -1(x - 2) => y - 3 = -x + 2 => x + y - 5 = 0."
  },
  {
    id: "tcat-math-ag-10",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Hard",
    q: "What is the area of the triangle with vertices at the origin (0, 0), (4, 0), and (0, 6)?",
    options: ["12 sq units","24 sq units","10 sq units","14 sq units"],
    correct: 0,
    explain: "Since base is on x-axis (length = 4) and height is on y-axis (length = 6), area = (1/2)*4*6 = 12 sq units."
  },
  {
    id: "tcat-math-ag-11",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Hard",
    q: "What is the necessary and sufficient condition for three straight lines a1*x + b1*y + c1 = 0, a2*x + b2*y + c2 = 0, and a3*x + b3*y + c3 = 0 to be concurrent?",
    options: ["The 3x3 determinant formed by their coefficients equals 0","a1/a2 = b1/b2 = c1/c2","The sum of their slopes equals 0","a1*a2*a3 + b1*b2*b3 = 0"],
    correct: 0,
    explain: "Three lines intersect at a common point (are concurrent) if and only if the determinant of the coefficient matrix [[a1, b1, c1], [a2, b2, c2], [a3, b3, c3]] is zero."
  },
  {
    id: "tcat-math-lp-6",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Easy",
    q: "Which geometric half-plane does the origin (0, 0) belong to with respect to the inequality 3x - 4y <= 12?",
    options: ["The origin-side half-plane","The non-origin side","The boundary line","Neither half-plane"],
    correct: 0,
    explain: "Testing (0, 0): 3(0) - 4(0) = 0 <= 12, which is true. Hence the origin lies in the solution half-plane."
  },
  {
    id: "tcat-math-lp-7",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Easy",
    q: "In linear programming, the linear function of decision variables to be maximized or minimized is called the:",
    options: ["Objective function","Feasible region","Constraint equation","Slack function"],
    correct: 0,
    explain: "The function that expresses the goal (e.g. profit maximization or cost minimization) is the objective function."
  },
  {
    id: "tcat-math-lp-8",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Medium",
    q: "Where does the optimal (maximum or minimum) value of an objective function always occur in a bounded feasible polygon?",
    options: ["At one of the corner points (vertices)","At the centroid","At the origin strictly","Along the interior center"],
    correct: 0,
    explain: "By the Fundamental Theorem of Linear Programming, optimal values of a linear objective function occur at the extreme points (corner points) of the feasible region."
  },
  {
    id: "tcat-math-lp-9",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Hard",
    q: "Maximize Z = 2x + 3y subject to the constraints: x >= 0, y >= 0, and x + y <= 4.",
    options: ["12","8","10","14"],
    correct: 0,
    explain: "Corner points are (0, 0), (4, 0), and (0, 4). Evaluating Z: at (0,0) Z=0; at (4,0) Z=8; at (0,4) Z=12. The maximum is 12."
  },
  {
    id: "tcat-math-lp-10",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Hard",
    q: "If a linear programming problem has an unbounded feasible region in the direction of optimization, the problem has:",
    options: ["No finite optimal solution (unbounded solution)","A unique optimal solution at (0,0)","Multiple optimal solutions on all boundaries","Exactly two corner solutions"],
    correct: 0,
    explain: "If the feasible region extends indefinitely in the direction that increases the objective function, the maximum value is infinite (unbounded solution)."
  },
  {
    id: "tcat-math-cs-6",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Easy",
    q: "What is the locus of a point whose distance from a fixed focus is equal to its distance from a fixed directrix line (eccentricity e = 1)?",
    options: ["Parabola","Ellipse","Hyperbola","Circle"],
    correct: 0,
    explain: "By geometric definition of conics, e = 1 defines a parabola."
  },
  {
    id: "tcat-math-cs-7",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Easy",
    q: "What are the center coordinates of the circle given by (x - 3)^2 + (y + 5)^2 = 49?",
    options: ["(3, -5)","(-3, 5)","(3, 5)","(-3, -5)"],
    correct: 0,
    explain: "Standard circle equation is (x - h)^2 + (y - k)^2 = r^2. Here h = 3, k = -5, so center is (3, -5)."
  },
  {
    id: "tcat-math-cs-8",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Medium",
    q: "What is the length of the major axis of the ellipse x^2/25 + y^2/9 = 1?",
    options: ["10","5","6","8"],
    correct: 0,
    explain: "Here a^2 = 25 => a = 5. The length of the major axis is 2a = 2 * 5 = 10."
  },
  {
    id: "tcat-math-cs-9",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Medium",
    q: "What are the coordinates of the foci of the hyperbola x^2/16 - y^2/9 = 1?",
    options: ["(+-5, 0)","(0, +-5)","(+-4, 0)","(+-3, 0)"],
    correct: 0,
    explain: "For a horizontal hyperbola, c^2 = a^2 + b^2 = 16 + 9 = 25 => c = 5. Foci are located at (+-c, 0) = (+-5, 0)."
  },
  {
    id: "tcat-math-cs-10",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Hard",
    q: "What is the equation of the directrix of the parabola y^2 = 8x?",
    options: ["x = -2","x = 2","y = -2","y = 2"],
    correct: 0,
    explain: "Standard form y^2 = 4ax. 4a = 8 => a = 2. Directrix of y^2 = 4ax is x = -a => x = -2."
  },
  {
    id: "tcat-math-cs-11",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Hard",
    q: "What is the condition of tangency for the straight line y = mx + c to touch the circle x^2 + y^2 = a^2?",
    options: ["c^2 = a^2 * (1 + m^2)","c^2 = a^2 * (1 - m^2)","c = a * m","c^2 = a^2 / (1 + m^2)"],
    correct: 0,
    explain: "The perpendicular distance from center (0, 0) to line mx - y + c = 0 is |c| / sqrt(1 + m^2). Equating to radius a gives c^2 = a^2*(1 + m^2)."
  },
  {
    id: "tcat-math-vec-6",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Easy",
    q: "A vector having zero magnitude and an arbitrary, indeterminate direction is known as a:",
    options: ["Null vector (zero vector)","Unit vector","Position vector","Equal vector"],
    correct: 0,
    explain: "A null or zero vector has magnitude 0 and no specific direction."
  },
  {
    id: "tcat-math-vec-7",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Easy",
    q: "What is the unit vector in the direction of vector v = 3i - 4j?",
    options: ["(3i - 4j) / 5","(3i - 4j) / 25","(3i + 4j) / 5","(4i - 3j) / 5"],
    correct: 0,
    explain: "Magnitude |v| = sqrt(3^2 + (-4)^2) = sqrt(9 + 16) = 5. Unit vector = v / |v| = (3i - 4j) / 5."
  },
  {
    id: "tcat-math-vec-8",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Medium",
    q: "If two non-zero vectors a and b are parallel or collinear, what is their cross product a x b?",
    options: ["0 (zero vector)","1","|a|*|b|","a · b"],
    correct: 0,
    explain: "a x b = |a||b|sin(theta) n_hat. When parallel, theta = 0 or 180°, so sin(theta) = 0, giving the zero vector 0."
  },
  {
    id: "tcat-math-vec-9",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Medium",
    q: "Find the work done by a constant force F = 2i + 3j + k acting on a particle moving from the origin to displacement d = 4i - j + 2k.",
    options: ["7 units","13 units","5 units","9 units"],
    correct: 0,
    explain: "Work W = F · d = (2)(4) + (3)(-1) + (1)(2) = 8 - 3 + 2 = 7 units."
  },
  {
    id: "tcat-math-vec-10",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Hard",
    q: "What is the numerical value of the scalar triple product [i, j, k]?",
    options: ["1","0","-1","sqrt(3)"],
    correct: 0,
    explain: "[i, j, k] = i · (j x k). Since j x k = i, i · i = 1."
  },
  {
    id: "tcat-math-sfg-11",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Easy",
    q: "If a binary operation * on a set S satisfies (a * b) * c = a * (b * c) for all a, b, c in S, the operation is called:",
    options: ["Associative","Commutative","Distributive","Idempotent"],
    correct: 0,
    explain: "By definition, an operation is associative if grouping does not change the result: (a * b) * c = a * (b * c)."
  },
  {
    id: "tcat-math-sfg-12",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Easy",
    q: "What is the identity element in the group (Z, +) of integers under addition?",
    options: ["0","1","-1","Does not exist"],
    correct: 0,
    explain: "For any integer a, a + 0 = 0 + a = a. Thus, 0 is the additive identity."
  },
  {
    id: "tcat-math-sfg-13",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Medium",
    q: "A function f: A -> B is said to be bijective if and only if it is:",
    options: ["Both injective (one-to-one) and surjective (onto)","Only injective","Only surjective","Neither injective nor surjective"],
    correct: 0,
    explain: "A bijection is a one-to-one correspondence, meaning the mapping is simultaneously injective and surjective."
  },
  {
    id: "tcat-math-sfg-14",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Medium",
    q: "Under the operation of multiplication modulo 5 on the set {1, 2, 3, 4}, what is the inverse of 3?",
    options: ["2","4","1","3"],
    correct: 0,
    explain: "In multiplication mod 5, 3 * 2 = 6 = 1 (mod 5). Since the product equals the identity 1, the multiplicative inverse of 3 is 2."
  },
  {
    id: "tcat-math-sfg-15",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Hard",
    q: "How many proper non-empty subsets does a finite set S with 5 elements possess?",
    options: ["30","31","32","25"],
    correct: 0,
    explain: "Total subsets = 2^5 = 32. Proper subsets exclude the set itself (32 - 1 = 31). Non-empty proper subsets also exclude the empty set (31 - 1 = 30)."
  },
  {
    id: "tcat-math-sfg-16",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Hard",
    q: "In any mathematical group (G, *), what is the inverse of the element (a * b)?",
    options: ["b^(-1) * a^(-1)","a^(-1) * b^(-1)","(a * b)^(-1) does not exist","a * b^(-1)"],
    correct: 0,
    explain: "By the shoes-and-socks property of groups, (a * b)^(-1) = b^(-1) * a^(-1) because (a * b) * (b^(-1) * a^(-1)) = a * (b * b^(-1)) * a^(-1) = a * e * a^(-1) = e."
  },
  {
    id: "tcat-math-pf-11",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Easy",
    q: "A rational fraction P(x) / Q(x) is classified as an improper fraction when:",
    options: ["Degree of P(x) >= Degree of Q(x)","Degree of P(x) < Degree of Q(x)","Degree of P(x) = 0","Q(x) is a linear polynomial"],
    correct: 0,
    explain: "A fraction P(x)/Q(x) is improper if the degree of the numerator polynomial P(x) is greater than or equal to the degree of the denominator Q(x)."
  },
  {
    id: "tcat-math-pf-12",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Easy",
    q: "For the fraction (2x + 1) / ((x - 2)(x + 3)), how many partial fraction terms are formed?",
    options: ["2","3","1","4"],
    correct: 0,
    explain: "The denominator has 2 distinct linear non-repeated factors, so the decomposition takes the form A/(x - 2) + B/(x + 3), which is 2 terms."
  },
  {
    id: "tcat-math-pf-13",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Medium",
    q: "What is the correct form of the partial fraction decomposition for 1 / (x^2 (x + 1))?",
    options: ["A/x + B/x^2 + C/(x + 1)","Ax / x^2 + B/(x + 1)","A/x^2 + B/(x + 1)","(Ax + B)/x^2 + C/(x + 1)"],
    correct: 0,
    explain: "For a repeated linear factor x^2, the terms must ascend in power: A/x + B/x^2, followed by C/(x + 1) for the distinct linear factor."
  },
  {
    id: "tcat-math-pf-14",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Medium",
    q: "In the identity 1 / ((x - 1)(x + 2)) = A / (x - 1) + B / (x + 2), find the value of constant A.",
    options: ["1/3","-1/3","1","2/3"],
    correct: 0,
    explain: "Multiplying through by (x - 1)(x + 2) gives 1 = A(x + 2) + B(x - 1). Setting x = 1 yields 1 = A(3) => A = 1/3."
  },
  {
    id: "tcat-math-pf-15",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Hard",
    q: "In decomposing (5x^2 - 2) / ((x^2 + 1)(x - 1)), what is the standard numerator chosen for the irreducible quadratic factor (x^2 + 1)?",
    options: ["Ax + B","A","Ax^2 + B","A / (x^2 + 1)"],
    correct: 0,
    explain: "For an irreducible non-repeated quadratic factor (x^2 + 1) in the denominator, the corresponding partial fraction numerator is linear, namely (Ax + B)."
  },
  {
    id: "tcat-math-pf-16",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Hard",
    q: "Convert (x^3 + 1) / (x^2 - 1) into polynomial quotient plus proper rational fraction before partial fraction resolution:",
    options: ["x + (x + 1)/(x^2 - 1)","x + 1/(x^2 - 1)","x^2 + 1/(x - 1)","1 + x/(x^2 - 1)"],
    correct: 0,
    explain: "Dividing x^3 + 1 by x^2 - 1: x^3 = x(x^2 - 1) + x, so x^3 + 1 = x(x^2 - 1) + (x + 1). Hence (x^3 + 1)/(x^2 - 1) = x + (x + 1)/(x^2 - 1)."
  },
  {
    id: "tcat-math-mibt-11",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Easy",
    q: "What is the sum of the binomial coefficients in the expansion of (1 + x)^n?",
    options: ["2^n","2^(n-1)","2^(n+1)","n * 2^(n-1)"],
    correct: 0,
    explain: "Putting x = 1 into (1 + x)^n gives (1 + 1)^n = 2^n = C(n,0) + C(n,1) + ... + C(n,n)."
  },
  {
    id: "tcat-math-mibt-12",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Easy",
    q: "The formula for the sum of the first n cubes, 1^3 + 2^3 + ... + n^3, is equal to:",
    options: ["[n(n + 1) / 2]^2","n(n + 1)(2n + 1) / 6","n^2(n + 1) / 2","[n(n - 1) / 2]^2"],
    correct: 0,
    explain: "By standard mathematical induction, the sum of cubes of first n natural numbers is [n(n + 1)/2]^2, which is the square of the sum of first n numbers."
  },
  {
    id: "tcat-math-mibt-13",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Medium",
    q: "What is the general term T_(r+1) in the binomial expansion of (a + b)^n for a positive integer n?",
    options: ["C(n, r) * a^(n - r) * b^r","C(n, r) * a^r * b^(n - r)","C(n, r+1) * a^(n - r) * b^r","C(n, r) * a^(n - r - 1) * b^(r+1)"],
    correct: 0,
    explain: "By the Binomial Theorem, the (r + 1)-th term is given by T_(r+1) = (n choose r) * a^(n - r) * b^r."
  },
  {
    id: "tcat-math-mibt-14",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Medium",
    q: "Find the term independent of x in the expansion of (x + 1/x)^6.",
    options: ["20","15","6","1"],
    correct: 0,
    explain: "T_(r+1) = C(6, r) * x^(6 - r) * (x^(-1))^r = C(6, r) * x^(6 - 2r). For x^0, 6 - 2r = 0 => r = 3. T_4 = C(6, 3) = 6!/(3!3!) = 20."
  },
  {
    id: "tcat-math-mibt-15",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Hard",
    q: "The expansion of (1 - x)^(-2) is valid only when:",
    options: ["|x| < 1","|x| <= 1","x > 1","For all real numbers x"],
    correct: 0,
    explain: "For any non-positive or fractional exponent, the infinite binomial series (1 + y)^n converges if and only if |y| < 1. Here |-x| = |x| < 1."
  },
  {
    id: "tcat-math-mibt-16",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Hard",
    q: "In the expansion of (1 + 2x)^(-1), what is the coefficient of x^3?",
    options: ["-8","8","-6","6"],
    correct: 0,
    explain: "(1 + y)^(-1) = 1 - y + y^2 - y^3 + ... With y = 2x, the term is -(2x)^3 = -8x^3. So the coefficient of x^3 is -8."
  },
  {
    id: "tcat-math-fot-11",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Easy",
    q: "How many radians are there in a complete revolution of 360 degrees?",
    options: ["2π rad","π rad","π/2 rad","4π rad"],
    correct: 0,
    explain: "180° = π radians, therefore a full rotation of 360° is equal to 2π radians."
  },
  {
    id: "tcat-math-fot-12",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Easy",
    q: "In which quadrant are both sin(θ) < 0 and cos(θ) < 0?",
    options: ["Quadrant III","Quadrant II","Quadrant IV","Quadrant I"],
    correct: 0,
    explain: "In Quadrant III, both x-coordinate (cosine) and y-coordinate (sine) are negative (tangent is positive)."
  },
  {
    id: "tcat-math-fot-13",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Medium",
    q: "Find the length of an arc of a circle of radius 6 cm subtended by a central angle of 2.5 radians.",
    options: ["15 cm","12 cm","18 cm","8.5 cm"],
    correct: 0,
    explain: "Arc length l = r * θ = 6 cm * 2.5 rad = 15 cm."
  },
  {
    id: "tcat-math-fot-14",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Medium",
    q: "What is the area of a circular sector with radius r = 4 cm and central angle θ = π/4 radians?",
    options: ["2π cm²","4π cm²","π cm²","8π cm²"],
    correct: 0,
    explain: "Area of sector = (1/2) * r^2 * θ = (1/2) * (16) * (π/4) = 2π cm²."
  },
  {
    id: "tcat-math-fot-15",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Hard",
    q: "If cot(θ) = 5/12 and the terminal ray of θ lies in Quadrant III, what is the exact value of cosec(θ)?",
    options: ["-13/12","13/12","-13/5","12/13"],
    correct: 0,
    explain: "cot(θ) = 5/12 => tan(θ) = 12/5. In Q III, both sin and cos are negative. Opp = -12, Adj = -5, Hyp = sqrt((-12)^2 + (-5)^2) = 13. sin(θ) = -12/13, so cosec(θ) = 1/sin(θ) = -13/12."
  },
  {
    id: "tcat-math-fot-16",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Hard",
    q: "The value of the trigonometric ratio sec(-300°) is equal to:",
    options: ["2","-2","2 / sqrt(3)","-2 / sqrt(3)"],
    correct: 0,
    explain: "sec(-θ) = sec(θ). sec(300°) = 1 / cos(300°). cos(300°) = cos(360° - 60°) = cos(60°) = 1/2. Thus, sec(-300°) = 1 / (1/2) = 2."
  },
  {
    id: "tcat-math-ti-11",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Easy",
    q: "Which of the following fundamental identities is correct for all real angles θ?",
    options: ["1 + tan²(θ) = sec²(θ)","1 - sin²(θ) = -cos²(θ)","1 + cot²(θ) = tan²(θ)","sec²(θ) - cosec²(θ) = 1"],
    correct: 0,
    explain: "Dividing sin²(θ) + cos²(θ) = 1 by cos²(θ) gives tan²(θ) + 1 = sec²(θ)."
  },
  {
    id: "tcat-math-ti-12",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Easy",
    q: "Express sin(2α) in terms of single-angle functions sin(α) and cos(α):",
    options: ["2 sin(α) cos(α)","sin²(α) - cos²(α)","2 sin(α)","cos²(α) - sin²(α)"],
    correct: 0,
    explain: "The double angle formula for sine is sin(2α) = 2 sin(α) cos(α)."
  },
  {
    id: "tcat-math-ti-13",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Medium",
    q: "What is the value of cos(75°)?",
    options: ["(sqrt(6) - sqrt(2)) / 4","(sqrt(6) + sqrt(2)) / 4","(sqrt(3) - 1) / 2","(sqrt(3) + 1) / 2"],
    correct: 0,
    explain: "cos(75°) = cos(45° + 30°) = cos(45°)cos(30°) - sin(45°)sin(30°) = (1/sqrt(2))(sqrt(3)/2) - (1/sqrt(2))(1/2) = (sqrt(6) - sqrt(2))/4."
  },
  {
    id: "tcat-math-ti-14",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Medium",
    q: "Convert the product 2 sin(5θ) cos(3θ) into a sum of sines:",
    options: ["sin(8θ) + sin(2θ)","sin(8θ) - sin(2θ)","cos(8θ) + cos(2θ)","cos(8θ) - cos(2θ)"],
    correct: 0,
    explain: "Using 2 sin(A) cos(B) = sin(A + B) + sin(A - B): 2 sin(5θ) cos(3θ) = sin(5θ + 3θ) + sin(5θ - 3θ) = sin(8θ) + sin(2θ)."
  },
  {
    id: "tcat-math-ti-15",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Hard",
    q: "What is the exact value of tan(15°)?",
    options: ["2 - sqrt(3)","2 + sqrt(3)","sqrt(3) - 1","1 - sqrt(3)"],
    correct: 0,
    explain: "tan(15°) = tan(45° - 30°) = (1 - 1/sqrt(3)) / (1 + 1/sqrt(3)) = (sqrt(3) - 1)/(sqrt(3) + 1). Multiplying by (sqrt(3) - 1): (4 - 2*sqrt(3))/2 = 2 - sqrt(3)."
  },
  {
    id: "tcat-math-ti-16",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Hard",
    q: "The expression (sin(3θ) - sin(θ)) / (cos(3θ) + cos(θ)) simplifies to:",
    options: ["tan(θ)","cot(θ)","tan(2θ)","cot(2θ)"],
    correct: 0,
    explain: "sin(3θ) - sin(θ) = 2 cos(2θ) sin(θ). cos(3θ) + cos(θ) = 2 cos(2θ) cos(θ). Ratio = [2 cos(2θ) sin(θ)] / [2 cos(2θ) cos(θ)] = sin(θ)/cos(θ) = tan(θ)."
  },
  {
    id: "tcat-math-tfg-11",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Easy",
    q: "What is the fundamental period of the tangent function y = tan(x)?",
    options: ["π","2π","π/2","4π"],
    correct: 0,
    explain: "The tangent and cotangent functions have a fundamental period of π radians, whereas sine and cosine have a period of 2π."
  },
  {
    id: "tcat-math-tfg-12",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Easy",
    q: "What is the amplitude of the sinusoidal function f(x) = -4 cos(3x + π/2)?",
    options: ["4","-4","3","2"],
    correct: 0,
    explain: "The amplitude of A cos(kx + φ) is given by the absolute value |A|. Here |-4| = 4."
  },
  {
    id: "tcat-math-tfg-13",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Medium",
    q: "Find the period of the function f(x) = 3 cos(4x - π).",
    options: ["π/2","π/4","2π","4π"],
    correct: 0,
    explain: "Period of cos(kx) is 2π / |k|. Here k = 4, so the period is 2π / 4 = π/2."
  },
  {
    id: "tcat-math-tfg-14",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Medium",
    q: "What is the principal range of the inverse cosine function y = arccos(x)?",
    options: ["[0, π]","[-π/2, π/2]","(-π/2, π/2)","[0, 2π]"],
    correct: 0,
    explain: "To make cosine bijective, its domain is restricted to [0, π], which becomes the range of y = arccos(x)."
  },
  {
    id: "tcat-math-tfg-15",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Hard",
    q: "Evaluate: sin(arctan(4/3)).",
    options: ["4/5","3/5","3/4","5/4"],
    correct: 0,
    explain: "Let θ = arctan(4/3). Then tan(θ) = 4/3 (opposite = 4, adjacent = 3). Hypotenuse = sqrt(4^2 + 3^2) = 5. Therefore sin(θ) = 4/5."
  },
  {
    id: "tcat-math-tfg-16",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Hard",
    q: "Find the number of solutions of the equation sin(2x) = 1 in the closed interval [0, 2π].",
    options: ["2","1","4","0"],
    correct: 0,
    explain: "For x in [0, 2π], 2x is in [0, 4π]. sin(2x) = 1 when 2x = π/2 or 2x = 5π/2. Thus x = π/4 and x = 5π/4, giving exactly 2 solutions."
  },
  {
    id: "tcat-math-aot-11",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Easy",
    q: "According to the Law of Sines for any triangle ABC, the ratio a / sin(α) is equal to:",
    options: ["2R (where R is the circumradius)","R","r (inradius)","Δ (area)"],
    correct: 0,
    explain: "By the extended Law of Sines: a/sin(α) = b/sin(β) = c/sin(γ) = 2R, where R is the radius of the circumcircle."
  },
  {
    id: "tcat-math-aot-12",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Easy",
    q: "In a triangle ABC, the formula for inradius r is:",
    options: ["Δ / s","s / Δ","abc / (4Δ)","Δ / (s - a)"],
    correct: 0,
    explain: "The inradius of a triangle is given by r = Δ / s, where Δ is the area and s is the semi-perimeter."
  },
  {
    id: "tcat-math-aot-13",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Medium",
    q: "In a right triangle with hypotenuse 10 m and an acute angle of 30°, what is the length of the side opposite to the 30° angle?",
    options: ["5 m","5 * sqrt(3) m","10 * sqrt(3) m","2.5 m"],
    correct: 0,
    explain: "sin(30°) = Opposite / Hypotenuse => 1/2 = Opp / 10 => Opposite = 5 m."
  },
  {
    id: "tcat-math-aot-14",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Medium",
    q: "If the sides of a triangle are a = 5, b = 6, and c = 7, find the semi-perimeter s.",
    options: ["9","18","8.5","12"],
    correct: 0,
    explain: "Semi-perimeter s = (a + b + c) / 2 = (5 + 6 + 7) / 2 = 18 / 2 = 9."
  },
  {
    id: "tcat-math-aot-15",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Hard",
    q: "In triangle ABC, if a = 3, b = 4, and c = 5, what is the radius R of its circumscribed circle?",
    options: ["2.5","5","1.25","1.5"],
    correct: 0,
    explain: "Since 3^2 + 4^2 = 5^2, this is a right triangle with hypotenuse c = 5. In any right-angled triangle, the circumcentre is the midpoint of the hypotenuse, so R = c / 2 = 5 / 2 = 2.5."
  },
  {
    id: "tcat-math-aot-16",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Hard",
    q: "An observer standing 50 m from the base of a vertical tower notes an angle of elevation of 45° to the top. What is the height of the tower?",
    options: ["50 m","25 m","50 * sqrt(3) m","100 m"],
    correct: 0,
    explain: "tan(45°) = height / distance => 1 = h / 50 => h = 50 m."
  },
  {
    id: "tcat-math-lilp-11",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Easy",
    q: "If -3x < 12, what is the resulting inequality after dividing both sides by -3?",
    options: ["x > -4","x < -4","x >= -4","x <= 4"],
    correct: 0,
    explain: "Dividing or multiplying an inequality by a negative number reverses the direction of the inequality sign: x > 12 / (-3) => x > -4."
  },
  {
    id: "tcat-math-lilp-12",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Easy",
    q: "In linear programming, the non-negativity constraints x >= 0, y >= 0 restrict the feasible region to which quadrant?",
    options: ["Quadrant I","Quadrant II","Quadrant III","Quadrant IV"],
    correct: 0,
    explain: "Both x >= 0 and y >= 0 describe the first quadrant of the Cartesian coordinate plane."
  },
  {
    id: "tcat-math-lilp-13",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Medium",
    q: "Does the origin (0, 0) satisfy the linear inequality 2x - 3y <= 6?",
    options: ["Yes, because 0 <= 6 is true","No, because 0 > 6","Only if x > 0","Cannot be determined"],
    correct: 0,
    explain: "Substituting (0, 0): 2(0) - 3(0) = 0 <= 6, which is a true statement; hence the origin lies inside the solution half-plane."
  },
  {
    id: "tcat-math-lilp-14",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Medium",
    q: "A point where two boundary lines of the feasible region intersect is termed a:",
    options: ["Corner point (or vertex)","Midpoint","Origin","Saddle point"],
    correct: 0,
    explain: "The intersection of boundary lines bounding a feasible region is known as a corner point or extreme point."
  },
  {
    id: "tcat-math-lilp-15",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Hard",
    q: "Maximize the objective function f(x, y) = 3x + 2y subject to corner points (0, 0), (4, 0), (2, 3), and (0, 4).",
    options: ["12 (at both (4, 0) and (2, 3))","8","14","10"],
    correct: 0,
    explain: "f(0, 0) = 0; f(4, 0) = 3(4) + 2(0) = 12; f(2, 3) = 3(2) + 2(3) = 6 + 6 = 12; f(0, 4) = 3(0) + 2(4) = 8. Maximum value is 12."
  },
  {
    id: "tcat-math-lilp-16",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Hard",
    q: "According to the Fundamental Theorem of Linear Programming, where does the optimal value of a linear objective function occur?",
    options: ["At one or more corner points (vertices) of the feasible region","At the geometric center of the feasible region","Always strictly at the origin","Outside the feasible boundary"],
    correct: 0,
    explain: "A linear function defined on a convex polygon achieves its global maximum and minimum at the extreme/corner points of the region."
  },
  {
    id: "tcat-math-vec-11",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Easy",
    q: "What is the magnitude of the 3D position vector r = 2i - 3j + 6k?",
    options: ["7","sqrt(11)","49","5"],
    correct: 0,
    explain: "|r| = sqrt(2^2 + (-3)^2 + 6^2) = sqrt(4 + 9 + 36) = sqrt(49) = 7."
  },
  {
    id: "tcat-math-vec-12",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Easy",
    q: "What is the unit vector in the direction of the vector v = 3i - 4j?",
    options: ["(3/5)i - (4/5)j","(3/7)i - (4/7)j","3i - 4j","(4/5)i - (3/5)j"],
    correct: 0,
    explain: "The unit vector is v / |v|. Magnitude |v| = sqrt(3^2 + (-4)^2) = 5. Hence v_hat = (3/5)i - (4/5)j."
  },
  {
    id: "tcat-math-vec-13",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Medium",
    q: "Compute the scalar projection of vector a = 3i + 4j onto vector b = i.",
    options: ["3","4","5","3/5"],
    correct: 0,
    explain: "Scalar projection of a onto b = (a · b) / |b| = (3*1 + 4*0) / 1 = 3."
  },
  {
    id: "tcat-math-vec-14",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Medium",
    q: "Evaluate the cross product: k x j.",
    options: ["-i","i","0","k"],
    correct: 0,
    explain: "In the right-handed cyclic system, j x k = i, so k x j = -(j x k) = -i."
  },
  {
    id: "tcat-math-vec-15",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Hard",
    q: "What is the area of a parallelogram having adjacent side vectors a = 2i + j - k and b = i - j + 2k?",
    options: ["sqrt(35)","sqrt(27)","6","sqrt(14)"],
    correct: 0,
    explain: "a x b = i(2 - 1) - j(4 - (-1)) + k(-2 - 1) = i - 5j - 3k. Magnitude |a x b| = sqrt(1^2 + (-5)^2 + (-3)^2) = sqrt(1 + 25 + 9) = sqrt(35)."
  },
  {
    id: "tcat-math-vec-16",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Hard",
    q: "If the vectors u = i + j, v = j + k, and w = i + λk are coplanar, find the value of λ.",
    options: ["-1","1","0","2"],
    correct: 0,
    explain: "Vectors are coplanar when their scalar triple product is zero: det([[1, 1, 0], [0, 1, 1], [1, 0, λ]]) = 1(λ - 0) - 1(0 - 1) = λ + 1 = 0 => λ = -1."
  },
  {
    id: "tcat-math-ns-12",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Easy",
    q: "The set of rational numbers Q and irrational numbers Q' are:",
    options: ["Disjoint sets whose union is the set of real numbers R","Identical sets","Subsets of integers","Intersecting sets with infinite common elements"],
    correct: 0,
    explain: "Every real number is either rational or irrational, and no number can be both: Q ∩ Q' = ∅ and Q ∪ Q' = R."
  },
  {
    id: "tcat-math-ns-13",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Easy",
    q: "What is the absolute value (modulus) of the complex number z = -6 + 8i?",
    options: ["10","14","2","100"],
    correct: 0,
    explain: "|z| = sqrt((-6)^2 + 8^2) = sqrt(36 + 64) = sqrt(100) = 10."
  },
  {
    id: "tcat-math-ns-14",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Medium",
    q: "What is the polar form of the complex number z = 1 - i?",
    options: ["sqrt(2)(cos(7π/4) + i sin(7π/4))","sqrt(2)(cos(π/4) + i sin(π/4))","2(cos(7π/4) + i sin(7π/4))","cos(7π/4) + i sin(7π/4)"],
    correct: 0,
    explain: "Modulus r = sqrt(1^2 + (-1)^2) = sqrt(2). Since x > 0 and y < 0, z lies in the fourth quadrant. Argument theta = 2π - π/4 = 7π/4. Thus z = sqrt(2)(cos(7π/4) + i sin(7π/4))."
  },
  {
    id: "tcat-math-ns-15",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Hard",
    q: "According to De Moivre's Theorem, for any integer n, (cos(θ) + i sin(θ))^n equals:",
    options: ["cos(nθ) + i sin(nθ)","cos^n(θ) + i sin^n(θ)","n cos(θ) + i n sin(θ)","cos(θ/n) + i sin(θ/n)"],
    correct: 0,
    explain: "De Moivre's theorem states that (cos(θ) + i sin(θ))^n = cos(nθ) + i sin(nθ) for all rational numbers n."
  },
  {
    id: "tcat-math-ns-16",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Hard",
    q: "If ω is a complex cube root of unity, what is the value of 1 + ω + ω^2?",
    options: ["0","1","-1","3"],
    correct: 0,
    explain: "The sum of all three cube roots of unity (1, ω, ω^2) is always equal to 0: 1 + ω + ω^2 = 0."
  },
  {
    id: "tcat-math-md-12",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Easy",
    q: "A square matrix A is classified as symmetric if and only if:",
    options: ["A^t = A","A^t = -A","det(A) = 0","A^(-1) = A"],
    correct: 0,
    explain: "A matrix equals its transpose (A^t = A) if and only if it is a symmetric matrix."
  },
  {
    id: "tcat-math-md-13",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Easy",
    q: "What is the determinant of a 2x2 identity matrix I_2?",
    options: ["1","0","2","-1"],
    correct: 0,
    explain: "det([[1, 0], [0, 1]]) = (1)(1) - (0)(0) = 1."
  },
  {
    id: "tcat-math-md-14",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Medium",
    q: "If A is a 3x3 matrix and det(A) = 4, what is the value of det(2A)?",
    options: ["32","8","16","64"],
    correct: 0,
    explain: "For an n x n matrix, det(k*A) = k^n * det(A). For n = 3 and k = 2, det(2A) = 2^3 * 4 = 8 * 4 = 32."
  },
  {
    id: "tcat-math-md-15",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Medium",
    q: "Find the inverse of the matrix A = [[2, 0], [0, 3]].",
    options: ["[[1/2, 0], [0, 1/3]]","[[1/3, 0], [0, 1/2]]","[[3, 0], [0, 2]]","[[-2, 0], [0, -3]]"],
    correct: 0,
    explain: "The inverse of a diagonal matrix is formed by taking the reciprocal of each non-zero diagonal entry: diag(1/2, 1/3)."
  },
  {
    id: "tcat-math-md-16",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Hard",
    q: "If the determinant of the matrix [[1, x], [4, 8]] is equal to 0, what is the value of x?",
    options: ["2","4","8","0"],
    correct: 0,
    explain: "det = (1)(8) - (4)(x) = 8 - 4x = 0 => 4x = 8 => x = 2."
  },
  {
    id: "tcat-math-qe-12",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Easy",
    q: "What is the sum of the roots of the quadratic equation 3x^2 - 12x + 7 = 0?",
    options: ["4","-4","7/3","-7/3"],
    correct: 0,
    explain: "Sum of roots = -b / a = -(-12) / 3 = 12 / 3 = 4."
  },
  {
    id: "tcat-math-qe-13",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Medium",
    q: "For what value of k does the quadratic equation x^2 - 6x + k = 0 have equal (repeated) real roots?",
    options: ["9","36","3","6"],
    correct: 0,
    explain: "Roots are equal when discriminant b^2 - 4ac = 0. (-6)^2 - 4(1)(k) = 0 => 36 - 4k = 0 => k = 9."
  },
  {
    id: "tcat-math-qe-14",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Medium",
    q: "If α and β are roots of x^2 - 5x + 6 = 0, form the quadratic equation whose roots are 2α and 2β.",
    options: ["x^2 - 10x + 24 = 0","x^2 - 10x + 12 = 0","x^2 - 5x + 24 = 0","x^2 - 20x + 24 = 0"],
    correct: 0,
    explain: "New sum S = 2(α + β) = 2(5) = 10. New product P = (2α)(2β) = 4(αβ) = 4(6) = 24. Equation: x^2 - Sx + P = x^2 - 10x + 24 = 0."
  },
  {
    id: "tcat-math-qe-15",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Hard",
    q: "According to the Remainder Theorem, when polynomial P(x) = 2x^3 - 3x^2 + 4x - 5 is divided by (x - 2), what is the remainder?",
    options: ["7","5","3","-1"],
    correct: 0,
    explain: "Remainder R = P(2) = 2(2)^3 - 3(2)^2 + 4(2) - 5 = 2(8) - 3(4) + 8 - 5 = 16 - 12 + 8 - 5 = 7."
  },
  {
    id: "tcat-math-qe-16",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Hard",
    q: "If the roots of ax^2 + bx + c = 0 are reciprocal to each other, which condition must hold true?",
    options: ["a = c","b = 0","a = -c","b^2 = 4ac"],
    correct: 0,
    explain: "Product of roots = α * (1/α) = 1. But product = c/a. Hence c/a = 1 => a = c."
  },
  {
    id: "tcat-math-ss-12",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Easy",
    q: "What is the 10th term of the arithmetic progression with first term a = 3 and common difference d = 4?",
    options: ["39","43","36","40"],
    correct: 0,
    explain: "a_n = a + (n - 1)d => a_10 = 3 + (9)(4) = 3 + 36 = 39."
  },
  {
    id: "tcat-math-ss-13",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Easy",
    q: "What is the sum to infinity of a geometric series with first term a = 4 and common ratio r = 1/2?",
    options: ["8","6","16","4"],
    correct: 0,
    explain: "S_∞ = a / (1 - r) = 4 / (1 - 1/2) = 4 / (1/2) = 8."
  },
  {
    id: "tcat-math-ss-14",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Medium",
    q: "What is the Harmonic Mean (HM) between two positive real numbers a = 2 and b = 6?",
    options: ["3","4","3.5","sqrt(12)"],
    correct: 0,
    explain: "HM = 2ab / (a + b) = 2(2)(6) / (2 + 6) = 24 / 8 = 3."
  },
  {
    id: "tcat-math-ss-15",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Hard",
    q: "For any two distinct positive real numbers, which inequality relationship strictly holds between AM, GM, and HM?",
    options: ["AM > GM > HM","HM > GM > AM","GM > AM > HM","AM = GM = HM"],
    correct: 0,
    explain: "For distinct positive real numbers, the Arithmetic Mean is strictly greater than the Geometric Mean, which is strictly greater than the Harmonic Mean (AM > GM > HM)."
  },
  {
    id: "tcat-math-ss-16",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Hard",
    q: "If the n-th term of an arithmetic sequence is a_n = 5n - 3, what is the sum of its first 20 terms?",
    options: ["990","1000","950","1050"],
    correct: 0,
    explain: "a_1 = 5(1) - 3 = 2. a_20 = 5(20) - 3 = 97. Sum S_20 = (n/2)(a_1 + a_n) = (20/2)(2 + 97) = 10 * 99 = 990."
  },
  {
    id: "tcat-math-pcp-12",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Easy",
    q: "In how many different orders can 5 distinct books be arranged on a single shelf?",
    options: ["120","60","24","20"],
    correct: 0,
    explain: "The number of arrangements of 5 distinct items is 5! = 5 * 4 * 3 * 2 * 1 = 120."
  },
  {
    id: "tcat-math-pcp-13",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Easy",
    q: "What is the probability of rolling a prime number on a single fair six-sided die?",
    options: ["1/2","1/3","2/3","1/6"],
    correct: 0,
    explain: "Prime outcomes on a standard die are {2, 3, 5} (3 outcomes out of 6). Probability = 3/6 = 1/2."
  },
  {
    id: "tcat-math-pcp-14",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Medium",
    q: "In how many ways can a delegation committee of 3 engineers be selected from a department of 8 engineers?",
    options: ["56","336","24","112"],
    correct: 0,
    explain: "Selection order does not matter: C(8, 3) = 8! / (3! * 5!) = (8 * 7 * 6) / (3 * 2 * 1) = 56."
  },
  {
    id: "tcat-math-pcp-15",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Medium",
    q: "If two fair coins are tossed simultaneously, what is the probability of obtaining at least one Head?",
    options: ["3/4","1/2","1/4","1"],
    correct: 0,
    explain: "Sample space = {HH, HT, TH, TT} (4 outcomes). Outcomes with at least one head = {HH, HT, TH} (3 outcomes). P = 3/4."
  },
  {
    id: "tcat-math-pcp-16",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Hard",
    q: "For two independent events A and B with P(A) = 0.4 and P(B) = 0.5, what is the probability of their union P(A ∪ B)?",
    options: ["0.7","0.9","0.2","0.6"],
    correct: 0,
    explain: "For independent events, P(A ∩ B) = P(A) * P(B) = 0.4 * 0.5 = 0.20. Then P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.4 + 0.5 - 0.2 = 0.7."
  },
  {
    id: "tcat-math-fl-12",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Easy",
    q: "A real function f(x) is classified as an even function if for all x in its domain:",
    options: ["f(-x) = f(x)","f(-x) = -f(x)","f(1/x) = f(x)","f(x) = f'(x)"],
    correct: 0,
    explain: "By definition, f(x) is an even function if f(-x) = f(x) for all x in the domain."
  },
  {
    id: "tcat-math-fl-13",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Medium",
    q: "Evaluate the limit: lim_(x -> 0) [sin(5x) / x].",
    options: ["5","1","0","1/5"],
    correct: 0,
    explain: "lim_(x -> 0) [sin(kx) / x] = k * lim_(kx -> 0) [sin(kx) / (kx)] = k * 1 = 5."
  },
  {
    id: "tcat-math-fl-14",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Medium",
    q: "Evaluate the limit: lim_(x -> ∞) [(3x^2 + 5x) / (2x^2 - 7)].",
    options: ["3/2","0","∞","5/2"],
    correct: 0,
    explain: "Dividing numerator and denominator by highest power x^2 gives (3 + 5/x)/(2 - 7/x^2) -> 3/2 as x -> ∞."
  },
  {
    id: "tcat-math-fl-15",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Hard",
    q: "What is the domain of the real-valued function f(x) = sqrt(16 - x^2)?",
    options: ["[-4, 4]","(-∞, -4] ∪ [4, ∞)","[0, 4]","(-4, 4)"],
    correct: 0,
    explain: "For real values, the radicand must be non-negative: 16 - x^2 >= 0 => x^2 <= 16 => -4 <= x <= 4."
  },
  {
    id: "tcat-math-fl-16",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Hard",
    q: "Evaluate the limit: lim_(n -> ∞) (1 + 1/n)^(3n).",
    options: ["e^3","e","3e","1"],
    correct: 0,
    explain: "Using the fundamental definition lim_(n -> ∞) (1 + 1/n)^n = e, we have [(1 + 1/n)^n]^3 -> e^3."
  },
  {
    id: "tcat-math-diff-12",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Easy",
    q: "What is the derivative with respect to x of y = e^(4x)?",
    options: ["4 e^(4x)","e^(4x)","(1/4) e^(4x)","4x e^(4x - 1)"],
    correct: 0,
    explain: "By chain rule, d/dx [e^(kx)] = k * e^(kx). Here k = 4, giving 4 e^(4x)."
  },
  {
    id: "tcat-math-diff-13",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Medium",
    q: "Find the derivative of y = ln(sec(x)).",
    options: ["tan(x)","sec(x)","cot(x)","sec(x) tan(x)"],
    correct: 0,
    explain: "d/dx [ln(sec(x))] = (1/sec(x)) * d/dx[sec(x)] = (1/sec(x)) * sec(x) tan(x) = tan(x)."
  },
  {
    id: "tcat-math-diff-14",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Hard",
    q: "At what point does the function f(x) = x^3 - 3x have a local maximum?",
    options: ["x = -1","x = 1","x = 0","x = 3"],
    correct: 0,
    explain: "f'(x) = 3x^2 - 3 = 0 => x = ±1. f''(x) = 6x. For x = -1, f''(-1) = -6 < 0 (local maximum). For x = 1, f''(1) = 6 > 0 (local minimum)."
  },
  {
    id: "tcat-math-diff-15",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Hard",
    q: "According to Maclaurin's series expansion, what is the coefficient of x^2 for f(x) = cos(x)?",
    options: ["-1/2","1/2","-1/6","0"],
    correct: 0,
    explain: "cos(x) = 1 - x^2/2! + x^4/4! - ... The coefficient of x^2 is -1/2! = -1/2."
  },
  {
    id: "tcat-math-int-12",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Easy",
    q: "What is the indefinite integral ∫ sec^2(x) dx?",
    options: ["tan(x) + C","-cot(x) + C","sec(x) + C","2 sec(x) tan(x) + C"],
    correct: 0,
    explain: "Since d/dx [tan(x)] = sec^2(x), the anti-derivative ∫ sec^2(x) dx is tan(x) + C."
  },
  {
    id: "tcat-math-int-13",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Medium",
    q: "Evaluate the definite integral ∫ from 0 to π/2 of cos(x) dx.",
    options: ["1","0","-1","π/2"],
    correct: 0,
    explain: "∫ cos(x) dx = [sin(x)] from 0 to π/2 = sin(π/2) - sin(0) = 1 - 0 = 1."
  },
  {
    id: "tcat-math-int-14",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Hard",
    q: "Evaluate the indefinite integral: ∫ x * e^x dx.",
    options: ["(x - 1) e^x + C","(x + 1) e^x + C","x^2 e^x / 2 + C","x e^x + C"],
    correct: 0,
    explain: "Using integration by parts ∫ u v' dx = u v - ∫ u' v dx with u = x, v' = e^x: x e^x - ∫ e^x dx = x e^x - e^x + C = (x - 1)e^x + C."
  },
  {
    id: "tcat-math-int-15",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Hard",
    q: "Evaluate the definite integral: ∫ from 0 to 1 of 1 / (1 + x^2) dx.",
    options: ["π/4","π/2","1","π"],
    correct: 0,
    explain: "∫ 1/(1 + x^2) dx = [arctan(x)] from 0 to 1 = arctan(1) - arctan(0) = π/4 - 0 = π/4."
  },
  {
    id: "tcat-math-iag-12",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Easy",
    q: "What is the slope of the straight line 4x - 2y + 7 = 0?",
    options: ["2","-2","1/2","-7/2"],
    correct: 0,
    explain: "Rewriting in slope-intercept form: 2y = 4x + 7 => y = 2x + 7/2. The slope m is 2."
  },
  {
    id: "tcat-math-iag-13",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Easy",
    q: "What is the perpendicular distance from the origin (0, 0) to the line 3x + 4y - 15 = 0?",
    options: ["3","5","15","4"],
    correct: 0,
    explain: "Distance d = |a*x0 + b*y0 + c| / sqrt(a^2 + b^2) = |0 + 0 - 15| / sqrt(3^2 + 4^2) = 15 / 5 = 3."
  },
  {
    id: "tcat-math-iag-14",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Medium",
    q: "Find the equation of the line passing through (1, 2) with slope m = 3.",
    options: ["3x - y - 1 = 0","3x + y - 5 = 0","x - 3y + 5 = 0","3x - y + 1 = 0"],
    correct: 0,
    explain: "y - y1 = m(x - x1) => y - 2 = 3(x - 1) => y - 2 = 3x - 3 => 3x - y - 1 = 0."
  },
  {
    id: "tcat-math-iag-15",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Hard",
    q: "Two lines with slopes m1 and m2 are perpendicular if and only if:",
    options: ["m1 * m2 = -1","m1 = m2","m1 * m2 = 1","m1 + m2 = 0"],
    correct: 0,
    explain: "Condition for perpendicularity of two non-vertical lines is m1 * m2 = -1 (product of slopes equals -1)."
  },
  {
    id: "tcat-math-cs-12",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Easy",
    q: "What is the eccentricity e of any parabola?",
    options: ["e = 1","e < 1","e > 1","e = 0"],
    correct: 0,
    explain: "By geometric definition, a parabola is the locus of a point whose distance from the focus equals its distance from the directrix, giving an eccentricity e = 1."
  },
  {
    id: "tcat-math-cs-13",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Easy",
    q: "What is the coordinates of the focus of the standard parabola y^2 = 12x?",
    options: ["(3, 0)","(0, 3)","(12, 0)","(6, 0)"],
    correct: 0,
    explain: "Comparing with y^2 = 4ax: 4a = 12 => a = 3. The focus lies at (a, 0) = (3, 0)."
  },
  {
    id: "tcat-math-cs-14",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Medium",
    q: "Find the length of the latus rectum of the ellipse x^2/25 + y^2/9 = 1.",
    options: ["18/5","50/3","9/5","18"],
    correct: 0,
    explain: "Here a^2 = 25 (a = 5) and b^2 = 9. The length of the latus rectum is 2b^2 / a = 2(9) / 5 = 18/5."
  },
  {
    id: "tcat-math-cs-15",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Hard",
    q: "What type of conic section is represented by the general equation x^2/16 - y^2/9 = 1?",
    options: ["Hyperbola","Ellipse","Parabola","Circle"],
    correct: 0,
    explain: "An equation of the form x^2/a^2 - y^2/b^2 = 1 represents a horizontal hyperbola with eccentricity e > 1."
  },
  {
    id: "tcat-math-cs-16",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Easy",
    q: "What is the length of the latus rectum of the parabola y² = 16x?",
    options: ["16","4","8","32"],
    correct: 0,
    explain: "For the standard parabola y² = 4ax, the length of the latus rectum is 4a. Here 4a = 16."
  },
  {
    id: "tcat-math-cs-17",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Hard",
    q: "The eccentricity e of a rectangular hyperbola is always equal to:",
    options: ["sqrt(2)","1","0","2"],
    correct: 0,
    explain: "For an equilateral (rectangular) hyperbola, a = b. Thus e = sqrt(1 + b²/a²) = sqrt(1 + 1) = sqrt(2)."
  },
  {
    id: "tcat-math-cs-18",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Medium",
    q: "What are the coordinates of the foci of the ellipse x²/25 + y²/9 = 1?",
    options: ["(±4, 0)","(0, ±4)","(±5, 0)","(±3, 0)"],
    correct: 0,
    explain: "Here a² = 25, b² = 9. c² = a² - b² = 25 - 9 = 16 => c = 4. Since the major axis is along the x-axis, foci are (±c, 0) = (±4, 0)."
  },
  {
    id: "tcat-math-cs-19",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Medium",
    q: "What is the equation of the directrix of the parabola x² = -12y?",
    options: ["y = 3","y = -3","x = 3","x = -3"],
    correct: 0,
    explain: "Comparing with x² = -4ay: 4a = 12 => a = 3. The focus is at (0, -3) and the directrix is y = a, so y = 3."
  },
  {
    id: "tcat-math-cs-20",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Hard",
    q: "What is the condition for the line y = mx + c to be tangent to the ellipse x²/a² + y²/b² = 1?",
    options: ["c² = a²m² + b²","c² = a²m² - b²","c = a/m","c² = a² - b²m²"],
    correct: 0,
    explain: "The condition of tangency for the line y = mx + c to an ellipse x²/a² + y²/b² = 1 is c² = a²m² + b²."
  },
  {
    id: "tcat-math-cs-21",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Hard",
    q: "What are the equations of the asymptotes of the hyperbola x²/16 - y²/9 = 1?",
    options: ["y = ±(3/4)x","y = ±(4/3)x","y = ±(9/16)x","y = ±(16/9)x"],
    correct: 0,
    explain: "For hyperbola x²/a² - y²/b² = 1, asymptotes are y = ±(b/a)x. Here a = 4, b = 3, so y = ±(3/4)x."
  },
  {
    id: "tcat-math-diff-16",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Medium",
    q: "What is the derivative of f(x) = ln(sec(x) + tan(x)) with respect to x?",
    options: ["sec(x)","tan(x)","sec²(x)","sec(x)tan(x)"],
    correct: 0,
    explain: "d/dx [ln(sec(x) + tan(x))] = (sec(x)tan(x) + sec²(x)) / (sec(x) + tan(x)) = sec(x)(tan(x) + sec(x)) / (sec(x) + tan(x)) = sec(x)."
  },
  {
    id: "tcat-math-diff-17",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Easy",
    q: "What is the derivative of e^(5x) at x = 0?",
    options: ["5","1","0","e⁵"],
    correct: 0,
    explain: "d/dx [e^(5x)] = 5 e^(5x). At x = 0, 5 e⁰ = 5."
  },
  {
    id: "tcat-math-diff-18",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Medium",
    q: "If y = arctan((2x) / (1 - x²)), what is dy/dx for |x| < 1?",
    options: ["2 / (1 + x²)","1 / (1 + x²)","2x / (1 + x²)","-2 / (1 + x²)"],
    correct: 0,
    explain: "By trigonometric substitution x = tan(θ), 2x/(1 - x²) = tan(2θ). Thus y = 2θ = 2 arctan(x), so dy/dx = 2 / (1 + x²)."
  },
  {
    id: "tcat-math-diff-19",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Medium",
    q: "At what point does the function f(x) = x³ - 3x² + 5 have a local minimum?",
    options: ["x = 2","x = 0","x = 1","x = -1"],
    correct: 0,
    explain: "f'(x) = 3x² - 6x = 3x(x - 2) = 0 => critical points at x = 0, 2. f''(x) = 6x - 6. At x = 2, f''(2) = 6 > 0, indicating a local minimum."
  },
  {
    id: "tcat-math-diff-20",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Hard",
    q: "If x = a cos³(θ) and y = a sin³(θ), what is the value of dy/dx in terms of θ?",
    options: ["-tan(θ)","-cot(θ)","tan(θ)","cot(θ)"],
    correct: 0,
    explain: "dx/dθ = -3a cos²(θ) sin(θ) and dy/dθ = 3a sin²(θ) cos(θ). dy/dx = (dy/dθ) / (dx/dθ) = (3a sin²θ cosθ) / (-3a cos²θ sinθ) = -sinθ / cosθ = -tanθ."
  },
  {
    id: "tcat-math-diff-21",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Hard",
    q: "According to Maclaurin’s theorem, what is the coefficient of x⁴ in the expansion of cos(x)?",
    options: ["1 / 24","-1 / 24","1 / 4","-1 / 4"],
    correct: 0,
    explain: "The Maclaurin series of cos(x) is 1 - x²/2! + x⁴/4! - ... . Since 4! = 24, the coefficient of x⁴ is 1/24."
  },
  {
    id: "tcat-math-int-16",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Medium",
    q: "What is the indefinite integral ∫ sec²(3x) dx?",
    options: ["(1/3) tan(3x) + C","3 tan(3x) + C","tan(3x) + C","(1/3) sec(3x) + C"],
    correct: 0,
    explain: "Since d/dx [tan(kx)] = k sec²(kx), ∫ sec²(3x) dx = (1/3) tan(3x) + C."
  },
  {
    id: "tcat-math-int-17",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Easy",
    q: "What is the value of the definite integral ∫[0 to π/2] cos(x) dx?",
    options: ["1","0","π/2","-1"],
    correct: 0,
    explain: "∫[0 to π/2] cos(x) dx = [sin(x)][0 to π/2] = sin(π/2) - sin(0) = 1 - 0 = 1."
  },
  {
    id: "tcat-math-int-18",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Medium",
    q: "What is the result of evaluating ∫ x e^x dx by integration by parts?",
    options: ["e^x (x - 1) + C","e^x (x + 1) + C","x e^x - x + C","x² e^x / 2 + C"],
    correct: 0,
    explain: "Let u = x, dv = e^x dx => du = dx, v = e^x. ∫ x e^x dx = x e^x - ∫ e^x dx = x e^x - e^x + C = e^x (x - 1) + C."
  },
  {
    id: "tcat-math-int-19",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Medium",
    q: "What is the value of ∫ 1 / sqrt(9 - x²) dx?",
    options: ["arcsin(x/3) + C","(1/3) arcsin(x/3) + C","arctan(x/3) + C","(1/3) ln|x + sqrt(9 - x²)| + C"],
    correct: 0,
    explain: "Standard integral formula: ∫ 1 / sqrt(a² - x²) dx = arcsin(x/a) + C. Here a = 3, so the result is arcsin(x/3) + C."
  },
  {
    id: "tcat-math-int-20",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Hard",
    q: "What is the area of the region bounded by the curve y = 4 - x² and the x-axis?",
    options: ["32 / 3","16 / 3","8","64 / 3"],
    correct: 0,
    explain: "The roots are x = ±2. Area = ∫[-2 to 2] (4 - x²) dx = 2 ∫[0 to 2] (4 - x²) dx = 2 [4x - x³/3][0 to 2] = 2 [8 - 8/3] = 2 [16/3] = 32/3."
  },
  {
    id: "tcat-math-int-21",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Hard",
    q: "What is the solution of the differential equation dy/dx = (1 + y²) / (1 + x²)?",
    options: ["arctan(y) = arctan(x) + C","ln(1 + y²) = ln(1 + x²) + C","y = x + C","arctan(y) * arctan(x) = C"],
    correct: 0,
    explain: "Separating variables gives dy / (1 + y²) = dx / (1 + x²). Integrating both sides gives arctan(y) = arctan(x) + C."
  },
  {
    id: "tcat-math-iag-16",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Easy",
    q: "What is the slope of the line passing through points (2, 3) and (6, 11)?",
    options: ["2","1/2","4","-2"],
    correct: 0,
    explain: "Slope m = (y2 - y1) / (x2 - x1) = (11 - 3) / (6 - 2) = 8 / 4 = 2."
  },
  {
    id: "tcat-math-iag-17",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Easy",
    q: "What are the coordinates of the midpoint of the line segment joining (3, -5) and (-1, 7)?",
    options: ["(1, 1)","(2, 2)","(1, -1)","(2, 1)"],
    correct: 0,
    explain: "Midpoint M = ((x1 + x2)/2, (y1 + y2)/2) = ((3 + (-1))/2, (-5 + 7)/2) = (2/2, 2/2) = (1, 1)."
  },
  {
    id: "tcat-math-iag-18",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Medium",
    q: "What is the perpendicular distance from the point (1, 2) to the line 3x + 4y + 4 = 0?",
    options: ["3","2.5","5","15"],
    correct: 0,
    explain: "d = |Ax0 + By0 + C| / sqrt(A² + B²) = |3(1) + 4(2) + 4| / sqrt(3² + 4²) = |3 + 8 + 4| / 5 = 15 / 5 = 3."
  },
  {
    id: "tcat-math-iag-19",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Medium",
    q: "What is the distance between the two parallel lines 3x - 4y + 5 = 0 and 3x - 4y - 15 = 0?",
    options: ["4","2","20","5"],
    correct: 0,
    explain: "d = |c1 - c2| / sqrt(A² + B²) = |5 - (-15)| / sqrt(3² + (-4)²) = 20 / 5 = 4."
  },
  {
    id: "tcat-math-iag-20",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Hard",
    q: "If the pair of lines represented by ax² + 2hxy + by² = 0 are mutually perpendicular, what is the required condition?",
    options: ["a + b = 0","h² - ab = 0","a = b","h = 0"],
    correct: 0,
    explain: "For homogeneous quadratic equation ax² + 2hxy + by² = 0, lines are perpendicular if the sum of coefficients of x² and y² is zero: a + b = 0."
  },
  {
    id: "tcat-math-iag-21",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Hard",
    q: "What are the coordinates of the centroid of a triangle with vertices at (1, 4), (4, -2), and (4, 7)?",
    options: ["(3, 3)","(4.5, 4.5)","(3, 4.5)","(4, 3)"],
    correct: 0,
    explain: "Centroid G = ((x1+x2+x3)/3, (y1+y2+y3)/3) = ((1 + 4 + 4)/3, (4 - 2 + 7)/3) = (9/3, 9/3) = (3, 3)."
  },
  {
    id: "tcat-math-fl-17",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Easy",
    q: "What is the domain of the real-valued function f(x) = 1 / sqrt(x - 4)?",
    options: ["x > 4","x ≥ 4","x < 4","All real numbers except 4"],
    correct: 0,
    explain: "The quantity under the square root must be strictly positive: x - 4 > 0 => x > 4."
  },
  {
    id: "tcat-math-fl-18",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Easy",
    q: "What is the value of lim(x -> 0) [sin(5x) / x]?",
    options: ["5","1","0","1/5"],
    correct: 0,
    explain: "lim(x -> 0) [sin(kx) / x] = k. Here k = 5, so the limit is 5."
  },
  {
    id: "tcat-math-fl-19",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Medium",
    q: "What is the value of lim(x -> ∞) (1 + 1/x)^(3x)?",
    options: ["e³","e","3e","1"],
    correct: 0,
    explain: "Since lim(x -> ∞) (1 + 1/x)^x = e, lim(x -> ∞) [(1 + 1/x)^x]³ = e³."
  },
  {
    id: "tcat-math-fl-20",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Medium",
    q: "A function f(x) is classified as an even function if for all x in its domain:",
    options: ["f(-x) = f(x)","f(-x) = -f(x)","f(1/x) = f(x)","f(x) = f'(x)"],
    correct: 0,
    explain: "By definition, a function is even if f(-x) = f(x) for all x in its domain (symmetric about the y-axis)."
  },
  {
    id: "tcat-math-fl-21",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Hard",
    q: "What is the value of lim(x -> 0) [(1 - cos(x)) / x²]?",
    options: ["1/2","1","0","2"],
    correct: 0,
    explain: "Using L'Hopital's rule or identity 1 - cos(x) = 2 sin²(x/2): lim(x -> 0) [sin(x) / (2x)] = 1/2."
  },
  {
    id: "tcat-math-fl-22",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Hard",
    q: "If f(x) = (x² - 9) / (x - 3) for x ≠ 3, what value must f(3) be assigned to make f continuous at x = 3?",
    options: ["6","3","0","9"],
    correct: 0,
    explain: "For x ≠ 3, f(x) = (x - 3)(x + 3) / (x - 3) = x + 3. The limit as x -> 3 is 3 + 3 = 6. For continuity, f(3) must equal 6."
  },
  {
    id: "tcat-math-ns-17",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Easy",
    q: "What is the value of i¹⁴, where i = sqrt(-1)?",
    options: ["-1","1","i","-i"],
    correct: 0,
    explain: "i¹⁴ = (i⁴)³ * i² = (1)³ * (-1) = -1."
  },
  {
    id: "tcat-math-ns-18",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Easy",
    q: "What is the complex conjugate of z = -5 + 8i?",
    options: ["-5 - 8i","5 - 8i","5 + 8i","-8 + 5i"],
    correct: 0,
    explain: "The conjugate of a complex number a + bi is obtained by changing the sign of the imaginary part, giving a - bi = -5 - 8i."
  },
  {
    id: "tcat-math-ns-19",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Medium",
    q: "What is the multiplicative inverse of the complex number z = 3 + 4i?",
    options: ["(3 - 4i) / 25","(3 + 4i) / 25","(3 - 4i) / 5","(-3 + 4i) / 25"],
    correct: 0,
    explain: "z⁻¹ = conjugate(z) / |z|² = (3 - 4i) / (3² + 4²) = (3 - 4i) / 25."
  },
  {
    id: "tcat-math-ns-20",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Hard",
    q: "What is the modulus and principal argument of the complex number z = -1 - i sqrt(3)?",
    options: ["r = 2, θ = -2π/3","r = 2, θ = -π/3","r = 4, θ = 4π/3","r = 2, θ = 2π/3"],
    correct: 0,
    explain: "r = sqrt((-1)² + (-sqrt(3))²) = sqrt(1 + 3) = 2. Since z is in quadrant III with tan(α) = sqrt(3) => α = π/3, Arg(z) = -π + π/3 = -2π/3."
  },
  {
    id: "tcat-math-ns-21",
    subject: "Mathematics",
    topic: "Number Systems",
    difficulty: "Hard",
    q: "According to De Moivre’s Theorem, (cos(θ) + i sin(θ))ⁿ equals:",
    options: ["cos(nθ) + i sin(nθ)","n cos(θ) + i n sin(θ)","cosⁿ(θ) + i sinⁿ(θ)","cos(θ/n) + i sin(θ/n)"],
    correct: 0,
    explain: "De Moivre’s theorem states that for any integer or rational n, (cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ)."
  },
  {
    id: "tcat-math-sfg-17",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Easy",
    q: "How many subsets does a set containing 5 elements have in total?",
    options: ["32","25","16","64"],
    correct: 0,
    explain: "The total number of subsets of a set with n elements is 2ⁿ. For n = 5, 2⁵ = 32."
  },
  {
    id: "tcat-math-sfg-18",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Easy",
    q: "A relation R on a set A is reflexive if for every element a in A:",
    options: ["(a, a) ∈ R","(a, b) ∈ R implies (b, a) ∈ R","(a, b) ∈ R and (b, c) ∈ R implies (a, c) ∈ R","(a, a) ∉ R"],
    correct: 0,
    explain: "A relation R on set A is reflexive if every element is related to itself, i.e., (a, a) ∈ R for all a ∈ A."
  },
  {
    id: "tcat-math-sfg-19",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Medium",
    q: "If set A has 4 elements and set B has 3 elements, what is the total number of distinct binary relations from A to B?",
    options: ["2¹² = 4,096","12","2⁷ = 128","81"],
    correct: 0,
    explain: "The Cartesian product A x B has 4 * 3 = 12 ordered pairs. The total number of relations from A to B is the number of subsets of A x B, which is 2¹² = 4,096."
  },
  {
    id: "tcat-math-sfg-20",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Medium",
    q: "What is the identity element under multiplication in the set of non-zero real numbers?",
    options: ["1","0","-1","e"],
    correct: 0,
    explain: "For any real number a, a * 1 = 1 * a = a. Hence 1 is the multiplicative identity."
  },
  {
    id: "tcat-math-sfg-21",
    subject: "Mathematics",
    topic: "Sets Functions and Groups",
    difficulty: "Hard",
    q: "In group theory, what does Lagrange’s Theorem state regarding a finite group G and its subgroup H?",
    options: ["The order of subgroup H divides the order of group G","The order of G divides the order of H","Every subgroup H must be abelian","The index of H is always a prime number"],
    correct: 0,
    explain: "Lagrange's theorem states that if G is a finite group and H is a subgroup of G, then |H| divides |G|."
  },
  {
    id: "tcat-math-md-17",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Easy",
    q: "A square matrix A is called symmetric if:",
    options: ["A^T = A","A^T = -A","A * A^T = I","det(A) = 0"],
    correct: 0,
    explain: "A square matrix is symmetric if it equals its transpose, i.e., A^T = A."
  },
  {
    id: "tcat-math-md-18",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Easy",
    q: "What is the determinant of the 2x2 matrix [[4, 2], [3, 5]]?",
    options: ["14","26","20","6"],
    correct: 0,
    explain: "det = (4 * 5) - (2 * 3) = 20 - 6 = 14."
  },
  {
    id: "tcat-math-md-19",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Medium",
    q: "If A is a 3x3 square matrix with det(A) = 5, what is det(2A)?",
    options: ["40","10","30","25"],
    correct: 0,
    explain: "For an n x n matrix, det(k A) = kⁿ det(A). Here n = 3 and k = 2, so det(2A) = 2³ * 5 = 8 * 5 = 40."
  },
  {
    id: "tcat-math-md-20",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Medium",
    q: "If A and B are invertible matrices of the same size, what is (A B)⁻¹?",
    options: ["B⁻¹ A⁻¹","A⁻¹ B⁻¹","A B⁻¹","B A⁻¹"],
    correct: 0,
    explain: "The reversal law for matrix inverses states that (A B)⁻¹ = B⁻¹ A⁻¹."
  },
  {
    id: "tcat-math-md-21",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Hard",
    q: "For a non-singular 3x3 matrix A with det(A) = 4, what is the determinant of its adjugate matrix det(adj(A))?",
    options: ["16","4","64","1/4"],
    correct: 0,
    explain: "For any n x n matrix, det(adj(A)) = (det(A))^(n - 1). For n = 3: det(adj(A)) = (4)^(3 - 1) = 4² = 16."
  },
  {
    id: "tcat-math-qe-17",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Easy",
    q: "If the discriminant b² - 4ac of a quadratic equation is negative, the roots are:",
    options: ["Complex and unequal","Real and equal","Real and unequal","Rational and equal"],
    correct: 0,
    explain: "When discriminant Δ < 0, the roots involve the square root of a negative quantity, yielding complex conjugate roots."
  },
  {
    id: "tcat-math-qe-18",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Easy",
    q: "What is the sum of the roots of the quadratic equation 3x² - 12x + 7 = 0?",
    options: ["4","-4","7/3","-7/3"],
    correct: 0,
    explain: "Sum of roots = -b / a = -(-12) / 3 = 12 / 3 = 4."
  },
  {
    id: "tcat-math-qe-19",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Medium",
    q: "If α and β are the roots of x² - 5x + 6 = 0, what is the value of α² + β²?",
    options: ["13","25","37","19"],
    correct: 0,
    explain: "α + β = 5, αβ = 6. α² + β² = (α + β)² - 2αβ = 5² - 2(6) = 25 - 12 = 13."
  },
  {
    id: "tcat-math-qe-20",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Hard",
    q: "For what value of k does the equation x² + 2(k + 1)x + k² = 0 have equal real roots?",
    options: ["-1/2","1/2","-1","0"],
    correct: 0,
    explain: "For equal roots, discriminant Δ = 0: [2(k + 1)]² - 4(1)(k²) = 0 => 4(k² + 2k + 1) - 4k² = 0 => 8k + 4 = 0 => k = -1/2."
  },
  {
    id: "tcat-math-qe-21",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Hard",
    q: "What is the value of (1 + ω - ω²)(1 - ω + ω²), where ω is a complex cube root of unity?",
    options: ["4","1","0","-2"],
    correct: 0,
    explain: "Since 1 + ω + ω² = 0, 1 + ω = -ω² and 1 + ω² = -ω. Expression = (-ω² - ω²)(-ω - ω) = (-2ω²)(-2ω) = 4ω³ = 4(1) = 4."
  },
  {
    id: "tcat-math-pf-17",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Easy",
    q: "A rational fraction P(x)/Q(x) is termed a proper rational fraction if:",
    options: ["Degree of P(x) < Degree of Q(x)","Degree of P(x) > Degree of Q(x)","Degree of P(x) = Degree of Q(x)","Degree of Q(x) = 1"],
    correct: 0,
    explain: "A rational function is proper when the degree of the numerator polynomial is strictly less than the degree of the denominator polynomial."
  },
  {
    id: "tcat-math-pf-18",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Easy",
    q: "What is the partial fraction form of 1 / ((x - 1)(x + 2))?",
    options: ["A / (x - 1) + B / (x + 2)","(Ax + B) / ((x - 1)(x + 2))","A / (x - 1)² + B / (x + 2)","A / (x - 1) + B / (x + 2)²"],
    correct: 0,
    explain: "For distinct non-repeated linear factors, the partial fraction decomposition is A/(x - 1) + B/(x + 2)."
  },
  {
    id: "tcat-math-pf-19",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Medium",
    q: "In the resolution 1 / (x(x + 1)) = A/x + B/(x + 1), what is the value of coefficient A?",
    options: ["1","-1","2","1/2"],
    correct: 0,
    explain: "1 = A(x + 1) + Bx. Setting x = 0 gives 1 = A(1) => A = 1."
  },
  {
    id: "tcat-math-pf-20",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Medium",
    q: "What is the correct partial fraction template for P(x) / ((x - 1)(x² + 4))?",
    options: ["A / (x - 1) + (Bx + C) / (x² + 4)","A / (x - 1) + B / (x² + 4)","(Ax + B) / (x - 1) + C / (x² + 4)","A / (x - 1) + B / (x + 2) + C / (x - 2)"],
    correct: 0,
    explain: "An irreducible quadratic denominator factor (x² + 4) requires a linear numerator (Bx + C)."
  },
  {
    id: "tcat-math-pf-21",
    subject: "Mathematics",
    topic: "Partial Fractions",
    difficulty: "Hard",
    q: "In the decomposition (3x + 1) / (x² - 1) = A / (x - 1) + B / (x + 1), what is the value of B?",
    options: ["1","2","-1","-2"],
    correct: 0,
    explain: "3x + 1 = A(x + 1) + B(x - 1). Setting x = -1 gives 3(-1) + 1 = B(-1 - 1) => -2 = -2B => B = 1."
  },
  {
    id: "tcat-math-ss-17",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Easy",
    q: "What is the 10th term of an arithmetic progression with first term a = 3 and common difference d = 4?",
    options: ["39","43","36","40"],
    correct: 0,
    explain: "a_n = a + (n - 1)d => a_10 = 3 + (10 - 1)*4 = 3 + 36 = 39."
  },
  {
    id: "tcat-math-ss-18",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Medium",
    q: "What is the sum of an infinite geometric series with first term a = 6 and common ratio r = 1/3?",
    options: ["9","18","8","12"],
    correct: 0,
    explain: "S_∞ = a / (1 - r) = 6 / (1 - 1/3) = 6 / (2/3) = 18 / 2 = 9."
  },
  {
    id: "tcat-math-ss-19",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Medium",
    q: "What is the geometric mean between numbers 4 and 16?",
    options: ["8","10","6","12"],
    correct: 0,
    explain: "Geometric mean G = ±sqrt(a * b) = sqrt(4 * 16) = sqrt(64) = 8."
  },
  {
    id: "tcat-math-ss-20",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Hard",
    q: "If the harmonic mean of two numbers a and b is H = (2ab)/(a + b), what is the harmonic mean of 3 and 6?",
    options: ["4","4.5","5","3.5"],
    correct: 0,
    explain: "H = 2(3)(6) / (3 + 6) = 36 / 9 = 4."
  },
  {
    id: "tcat-math-ss-21",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Hard",
    q: "What is the sum of the first n natural numbers squared, Σ(k = 1 to n) k²?",
    options: ["n(n + 1)(2n + 1) / 6","[n(n + 1) / 2]²","n(n + 1) / 2","n(2n + 1) / 3"],
    correct: 0,
    explain: "The standard sum of squares formula is Σ k² = n(n + 1)(2n + 1) / 6."
  },
  {
    id: "tcat-math-pcp-17",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Easy",
    q: "In how many ways can 5 distinct books be arranged on a single bookshelf?",
    options: ["120","24","60","720"],
    correct: 0,
    explain: "Number of arrangements of 5 distinct items is 5! = 5 * 4 * 3 * 2 * 1 = 120."
  },
  {
    id: "tcat-math-pcp-18",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Easy",
    q: "What is the value of the combination 8C3?",
    options: ["56","336","28","64"],
    correct: 0,
    explain: "8C3 = (8 * 7 * 6) / (3 * 2 * 1) = 336 / 6 = 56."
  },
  {
    id: "tcat-math-pcp-19",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Medium",
    q: "If a fair standard six-sided die is rolled once, what is the probability of rolling a prime number?",
    options: ["1/2","1/3","2/3","1/6"],
    correct: 0,
    explain: "The prime numbers on a 6-sided die are {2, 3, 5} (3 outcomes out of 6). P = 3/6 = 1/2."
  },
  {
    id: "tcat-math-pcp-20",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Hard",
    q: "In how many distinguishable ways can the letters of the word \"ENGINEERING\" be arranged?",
    options: ["277,200","11!","554,400","39,916,800"],
    correct: 0,
    explain: "Total letters = 11. Counts: E: 3, N: 3, G: 2, I: 2, R: 1. Total = 11! / (3! 3! 2! 2!) = 39,916,800 / (6 * 6 * 2 * 2) = 39,916,800 / 144 = 277,200."
  },
  {
    id: "tcat-math-pcp-21",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Hard",
    q: "Two unbiased dice are tossed simultaneously. What is the probability that the sum of the numbers is 8?",
    options: ["5/36","1/6","7/36","1/9"],
    correct: 0,
    explain: "Pairs summing to 8: (2,6), (3,5), (4,4), (5,3), (6,2) = 5 pairs out of 36 total. P = 5/36."
  },
  {
    id: "tcat-math-mibt-17",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Easy",
    q: "How many terms are there in the binomial expansion of (x + y)¹⁵?",
    options: ["16","15","14","30"],
    correct: 0,
    explain: "The expansion of (a + b)ⁿ has exactly n + 1 terms. For n = 15, there are 15 + 1 = 16 terms."
  },
  {
    id: "tcat-math-mibt-18",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Easy",
    q: "What is the sum of all binomial coefficients in the expansion of (1 + x)ⁿ?",
    options: ["2ⁿ","2ⁿ - 1","n²","2^(n - 1)"],
    correct: 0,
    explain: "Setting x = 1 in (1 + x)ⁿ yields (1 + 1)ⁿ = 2ⁿ = C(n,0) + C(n,1) + ... + C(n,n)."
  },
  {
    id: "tcat-math-mibt-19",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Medium",
    q: "What is the general (r + 1)-th term T_(r + 1) in the expansion of (a + b)ⁿ?",
    options: ["nCr * a^(n - r) * b^r","nCr * a^r * b^(n - r)","nC(r+1) * a^(n - r) * b^r","nCr * a^(n - r - 1) * b^(r + 1)"],
    correct: 0,
    explain: "By the binomial theorem, the (r + 1)-th term is T_(r + 1) = nCr a^(n - r) b^r."
  },
  {
    id: "tcat-math-mibt-20",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Medium",
    q: "What is the middle term in the expansion of (x - 2y)⁸?",
    options: ["T₅ = 1120 x⁴ y⁴","T₄ = -448 x⁵ y³","T₆ = -1792 x³ y⁵","T₅ = 70 x⁴ y⁴"],
    correct: 0,
    explain: "Since n = 8 is even, the single middle term is T_(8/2 + 1) = T₅. T₅ = 8C4 x⁴ (-2y)⁴ = 70 * x⁴ * 16 y⁴ = 1120 x⁴ y⁴."
  },
  {
    id: "tcat-math-mibt-21",
    subject: "Mathematics",
    topic: "Mathematical Induction and Binomial Theorem",
    difficulty: "Hard",
    q: "What is the term independent of x in the expansion of (x + 1/x)⁶?",
    options: ["20","15","6","30"],
    correct: 0,
    explain: "T_(r + 1) = 6Cr x^(6 - r) (x⁻¹)^r = 6Cr x^(6 - 2r). For independence from x, 6 - 2r = 0 => r = 3. T₄ = 6C3 = 20."
  },
  {
    id: "tcat-math-fot-17",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Easy",
    q: "How many radians are equivalent to an angle of 150°?",
    options: ["5π / 6","2π / 3","3π / 4","7π / 6"],
    correct: 0,
    explain: "Radians = degrees * (π / 180) = 150 * π / 180 = 5π / 6."
  },
  {
    id: "tcat-math-fot-18",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Easy",
    q: "What is the value of tan(45°) + cot(45°)?",
    options: ["2","1","0","sqrt(2)"],
    correct: 0,
    explain: "tan(45°) = 1, cot(45°) = 1. Sum = 1 + 1 = 2."
  },
  {
    id: "tcat-math-fot-19",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Medium",
    q: "What is the area of a circular sector of radius r = 6 cm subtending an angle θ = π/3 radians?",
    options: ["6π cm²","12π cm²","3π cm²","18π cm²"],
    correct: 0,
    explain: "Area of sector = (1/2) r² θ = (1/2) * (6)² * (π/3) = (1/2) * 36 * (π/3) = 18 * π/3 = 6π cm²."
  },
  {
    id: "tcat-math-fot-20",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Hard",
    q: "If sin(θ) = -3/5 and θ lies in the fourth quadrant, what is the value of sec(θ)?",
    options: ["5/4","4/5","-5/4","-4/5"],
    correct: 0,
    explain: "In quadrant IV, cos(θ) is positive. cos(θ) = sqrt(1 - (-3/5)²) = sqrt(16/25) = 4/5. Hence sec(θ) = 1/cos(θ) = 5/4."
  },
  {
    id: "tcat-math-fot-21",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Hard",
    q: "What is the exact value of sin(15°)?",
    options: ["(sqrt(6) - sqrt(2)) / 4","(sqrt(6) + sqrt(2)) / 4","(sqrt(3) - 1) / 2","1 / (2 sqrt(2))"],
    correct: 0,
    explain: "sin(15°) = sin(45° - 30°) = sin45 cos30 - cos45 sin30 = (1/√2)(√3/2) - (1/√2)(1/2) = (√6 - √2) / 4."
  },
  {
    id: "tcat-math-ti-17",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Easy",
    q: "What is the value of sin²(θ) + cos²(θ) for any real angle θ?",
    options: ["1","0","2","sec²(θ)"],
    correct: 0,
    explain: "The fundamental Pythagorean trigonometric identity states that sin²(θ) + cos²(θ) = 1 for all real θ."
  },
  {
    id: "tcat-math-ti-18",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Easy",
    q: "Which identity represents cos(2θ) in terms of cos(θ)?",
    options: ["2 cos²(θ) - 1","cos²(θ) - 1","2 cos(θ) - 1","1 - 2 cos²(θ)"],
    correct: 0,
    explain: "cos(2θ) = cos²(θ) - sin²(θ) = 2 cos²(θ) - 1 = 1 - 2 sin²(θ)."
  },
  {
    id: "tcat-math-ti-19",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Medium",
    q: "What is the simplified form of (1 - cos(2θ)) / sin(2θ)?",
    options: ["tan(θ)","cot(θ)","sin(θ)","cos(θ)"],
    correct: 0,
    explain: "1 - cos(2θ) = 2 sin²(θ) and sin(2θ) = 2 sin(θ) cos(θ). Dividing gives (2 sin²θ) / (2 sinθ cosθ) = sinθ / cosθ = tanθ."
  },
  {
    id: "tcat-math-ti-20",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Medium",
    q: "What is 2 sin(40°) cos(20°) expressed as a sum of trigonometric functions?",
    options: ["sin(60°) + sin(20°)","sin(60°) - sin(20°)","cos(60°) + cos(20°)","cos(60°) - cos(20°)"],
    correct: 0,
    explain: "Product-to-sum formula: 2 sin(A) cos(B) = sin(A + B) + sin(A - B) = sin(40° + 20°) + sin(40° - 20°) = sin(60°) + sin(20°)."
  },
  {
    id: "tcat-math-ti-21",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Hard",
    q: "What is the value of the product cos(20°) cos(40°) cos(80°)?",
    options: ["1/8","1/16","1/4","sqrt(3)/8"],
    correct: 0,
    explain: "Standard identity: cos(θ) cos(60° - θ) cos(60° + θ) = (1/4) cos(3θ). For θ = 20°, (1/4) cos(60°) = (1/4)(1/2) = 1/8."
  },
  {
    id: "tcat-math-tfg-17",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Easy",
    q: "What is the amplitude of the sinusoidal curve represented by y = -4 cos(3x)?",
    options: ["4","-4","3","12"],
    correct: 0,
    explain: "The amplitude of y = A cos(Bx) is always the absolute magnitude |A|. Here |-4| = 4."
  },
  {
    id: "tcat-math-tfg-18",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Easy",
    q: "What is the maximum value of the function f(x) = 3 sin(2x) + 4?",
    options: ["7","5","4","10"],
    correct: 0,
    explain: "Since the maximum value of sin(2x) is 1, the maximum of 3 sin(2x) + 4 is 3(1) + 4 = 7."
  },
  {
    id: "tcat-math-tfg-19",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Medium",
    q: "What is the fundamental period of the function f(x) = cos(4x)?",
    options: ["π / 2","2π","π","4π"],
    correct: 0,
    explain: "Period of cos(kx) is 2π / k. Here k = 4, so period is 2π / 4 = π/2."
  },
  {
    id: "tcat-math-tfg-20",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Medium",
    q: "What is the range of the principal arcsine function y = arcsin(x)?",
    options: ["[-π/2, π/2]","[0, π]","(-π/2, π/2)","[-1, 1]"],
    correct: 0,
    explain: "The principal branch of inverse sine is restricted to the closed interval [-π/2, π/2]."
  },
  {
    id: "tcat-math-tfg-21",
    subject: "Mathematics",
    topic: "Trigonometric Functions and Graphs",
    difficulty: "Hard",
    q: "What is the general solution of the trigonometric equation sin(x) = 1/2?",
    options: ["x = nπ + (-1)ⁿ (π/6), n ∈ Z","x = 2nπ ± π/6, n ∈ Z","x = nπ ± π/3, n ∈ Z","x = 2nπ + π/6, n ∈ Z"],
    correct: 0,
    explain: "General solution of sin(x) = sin(α) is x = nπ + (-1)ⁿ α. Here α = π/6, so x = nπ + (-1)ⁿ (π/6)."
  },
  {
    id: "tcat-math-aot-17",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Easy",
    q: "According to the Law of Sines for any triangle ABC, a / sin(A) = b / sin(B) = c / sin(C) = ?",
    options: ["2R (where R is circumradius)","R","r (inradius)","4R"],
    correct: 0,
    explain: "In any triangle, a/sin(A) = b/sin(B) = c/sin(C) = 2R, where R is the radius of the circumcircle."
  },
  {
    id: "tcat-math-aot-18",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Hard",
    q: "What is the area of triangle ABC given sides a = 8, b = 10, and included angle C = 30°?",
    options: ["20","40","20 sqrt(3)","10"],
    correct: 0,
    explain: "Area = (1/2) a b sin(C) = (1/2) * 8 * 10 * sin(30°) = 40 * (1/2) = 20."
  },
  {
    id: "tcat-math-aot-19",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Medium",
    q: "According to the Law of Cosines, what is c² in terms of a, b, and C?",
    options: ["a² + b² - 2ab cos(C)","a² + b² + 2ab cos(C)","a² - b² - 2ab cos(C)","(a + b)² - 2ab sin(C)"],
    correct: 0,
    explain: "The Law of Cosines states c² = a² + b² - 2ab cos(C)."
  },
  {
    id: "tcat-math-aot-20",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Hard",
    q: "What is the inradius r of a triangle with area Δ = 84 and semi-perimeter s = 21?",
    options: ["4","6","2","8"],
    correct: 0,
    explain: "The inradius formula is r = Δ / s = 84 / 21 = 4."
  },
  {
    id: "tcat-math-aot-21",
    subject: "Mathematics",
    topic: "Application of Trigonometry",
    difficulty: "Hard",
    q: "What is the radius of the excircle r1 opposite to vertex A in terms of triangle area Δ and sides?",
    options: ["Δ / (s - a)","Δ / (s - b)","Δ / s","abc / (4Δ)"],
    correct: 0,
    explain: "The radius of the escribed circle opposite vertex A is r1 = Δ / (s - a)."
  },
  {
    id: "tcat-math-lilp-17",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Easy",
    q: "Which quadrant of the Cartesian coordinate plane is defined by the system of inequalities x ≥ 0 and y ≥ 0?",
    options: ["First quadrant (I)","Second quadrant (II)","Third quadrant (III)","Fourth quadrant (IV)"],
    correct: 0,
    explain: "Non-negative constraints x ≥ 0 and y ≥ 0 confine the feasible solution to the first quadrant."
  },
  {
    id: "tcat-math-lilp-18",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Easy",
    q: "A linear programming problem seeks to maximize or minimize a linear expression known as the:",
    options: ["Objective function","Feasible region","Constraint matrix","Slack variable"],
    correct: 0,
    explain: "The function to be optimized (maximized or minimized) is termed the objective function."
  },
  {
    id: "tcat-math-lilp-19",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Medium",
    q: "Where does the optimal value of an objective function in a linear programming problem always occur?",
    options: ["At a corner point (vertex) of the feasible region","At the origin always","At the centroid of the feasible region","Strictly inside the interior"],
    correct: 0,
    explain: "The fundamental theorem of linear programming guarantees that the optimal value occurs at one of the corner points (vertices) of the convex feasible region."
  },
  {
    id: "tcat-math-lilp-20",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Medium",
    q: "What is the maximum value of z = 3x + 2y over the vertices (0, 0), (4, 0), (2, 3), and (0, 4)?",
    options: ["12 (at (4, 0) and (2, 3))","14","8","10"],
    correct: 0,
    explain: "Evaluating z: at (0,0)=0; at (4,0)=3(4)+0=12; at (2,3)=3(2)+2(3)=6+6=12; at (0,4)=0+2(4)=8. Maximum is 12."
  },
  {
    id: "tcat-math-lilp-21",
    subject: "Mathematics",
    topic: "Linear Inequalities and Linear Programming",
    difficulty: "Hard",
    q: "A point that satisfies all the given constraints of a linear programming problem simultaneously is called a:",
    options: ["Feasible solution","Optimal solution","Infeasible constraint","Degenerate point"],
    correct: 0,
    explain: "Any point that satisfies all constraint inequalities simultaneously is designated a feasible solution."
  },
  {
    id: "tcat-math-vec-17",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Easy",
    q: "What is the magnitude of the 3D vector v = 2i - 3j + 6k?",
    options: ["7","49","5","9"],
    correct: 0,
    explain: "|v| = sqrt(2² + (-3)² + 6²) = sqrt(4 + 9 + 36) = sqrt(49) = 7."
  },
  {
    id: "tcat-math-vec-18",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Easy",
    q: "What is the cross product of the standard unit vector i with the unit vector j (i.e., i × j)?",
    options: ["k","-k","0","1"],
    correct: 0,
    explain: "In the right-handed Cartesian coordinate system, i × j = k, j × k = i, and k × i = j."
  },
  {
    id: "tcat-math-vec-19",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Medium",
    q: "What is the scalar projection of vector a = 4i + 2j - 4k onto vector b = i + 2j + 2k?",
    options: ["0","4/3","2","8/9"],
    correct: 0,
    explain: "Projection of a on b = (a · b) / |b|. a · b = 4(1) + 2(2) - 4(2) = 4 + 4 - 8 = 0. So projection = 0 (vectors are perpendicular)."
  },
  {
    id: "tcat-math-vec-20",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Hard",
    q: "What is the area of the parallelogram formed by adjacent vectors a = 2i + j - k and b = i - j + 2k?",
    options: ["sqrt(35)","sqrt(27)","6","sqrt(14)"],
    correct: 0,
    explain: "a x b = det([[i, j, k], [2, 1, -1], [1, -1, 2]]) = i(2 - 1) - j(4 - (-1)) + k(-2 - 1) = i - 5j - 3k. Magnitude = sqrt(1² + (-5)² + (-3)²) = sqrt(1 + 25 + 9) = sqrt(35)."
  },
  {
    id: "tcat-math-vec-21",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Hard",
    q: "What is the volume of the parallelepiped with coterminous edges a = i + j, b = j + k, and c = i + k?",
    options: ["2","1","4","0"],
    correct: 0,
    explain: "Volume = scalar triple product [a, b, c] = det([[1, 1, 0], [0, 1, 1], [1, 0, 1]]) = 1(1 - 0) - 1(0 - 1) + 0 = 1 + 1 = 2."
  },
  {
    id: "tcat-math-401",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Easy",
    q: "Evaluate the algebraic limit: lim(x -> 3) [ (x^2 - 9) / (x - 3) ].",
    options: [
      "6",
      "3",
      "0",
      "Does not exist"
    ],
    correct: 0,
    explain: "Factoring the numerator: (x - 3)(x + 3) / (x - 3) = x + 3. As x -> 3, the limit is 3 + 3 = 6."
  },
  {
    id: "tcat-math-402",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Easy",
    q: "Find the first derivative of f(x) = 4x^3 - 5x^2 + 7x - 12 with respect to x.",
    options: [
      "12x^2 - 10x + 7",
      "12x^2 - 10x - 5",
      "4x^2 - 5x + 7",
      "12x^3 - 10x^2 + 7"
    ],
    correct: 0,
    explain: "Applying the power rule d/dx [x^n] = n*x^(n-1) gives 12x^2 - 10x + 7."
  },
  {
    id: "tcat-math-403",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Easy",
    q: "Evaluate the indefinite integral: ∫ (6x^2 + 2e^x) dx.",
    options: [
      "2x^3 + 2e^x + C",
      "3x^3 + 2e^x + C",
      "6x^3 + e^x + C",
      "2x^3 + e^(2x) + C"
    ],
    correct: 0,
    explain: "∫ 6x^2 dx = 6*(x^3/3) = 2x^3, and ∫ 2e^x dx = 2e^x. Thus, 2x^3 + 2e^x + C."
  },
  {
    id: "tcat-math-404",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Easy",
    q: "Calculate the determinant of the 2x2 matrix A = [[5, 3], [2, 4]].",
    options: [
      "14",
      "26",
      "20",
      "6"
    ],
    correct: 0,
    explain: "det(A) = (5)(4) - (3)(2) = 20 - 6 = 14."
  },
  {
    id: "tcat-math-405",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Easy",
    q: "Determine the slope of the straight line defined by the equation 4x - 2y + 7 = 0.",
    options: [
      "2",
      "-2",
      "1/2",
      "-1/2"
    ],
    correct: 0,
    explain: "Rearranging into slope-intercept form y = mx + c: 2y = 4x + 7 => y = 2x + 7/2. The slope m = 2."
  },
  {
    id: "tcat-math-406",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    difficulty: "Easy",
    q: "If the roots of ax^2 + bx + c = 0 are real and equal, what is the value of the discriminant b^2 - 4ac?",
    options: [
      "0",
      "Greater than 0",
      "Less than 0",
      "Undefined"
    ],
    correct: 0,
    explain: "A discriminant equal to zero indicates that the quadratic equation possesses two coincident (real and equal) roots."
  },
  {
    id: "tcat-math-407",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Easy",
    q: "Find the 10th term of an arithmetic progression whose first term is a = 3 and common difference is d = 4.",
    options: [
      "39",
      "43",
      "36",
      "40"
    ],
    correct: 0,
    explain: "The n-th term of an AP is a_n = a + (n - 1)d. For n = 10: a_10 = 3 + (9)(4) = 3 + 36 = 39."
  },
  {
    id: "tcat-math-408",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Easy",
    q: "Compute the scalar (dot) product of vectors u = 2i + 3j - k and v = 4i - j + 5k.",
    options: [
      "0",
      "5",
      "10",
      "-1"
    ],
    correct: 0,
    explain: "u . v = (2)(4) + (3)(-1) + (-1)(5) = 8 - 3 - 5 = 0. (The vectors are orthogonal)."
  },
  {
    id: "tcat-math-409",
    subject: "Mathematics",
    topic: "Fundamentals of Trigonometry",
    difficulty: "Easy",
    q: "What is the exact value of tan(135°)?",
    options: [
      "-1",
      "1",
      "-√3",
      "1/√3"
    ],
    correct: 0,
    explain: "tan(135°) = tan(180° - 45°) = -tan(45°) = -1."
  },
  {
    id: "tcat-math-410",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Easy",
    q: "Evaluate the combination 7C3 (7 choose 3).",
    options: [
      "35",
      "21",
      "42",
      "210"
    ],
    correct: 0,
    explain: "7C3 = 7! / (3! * 4!) = (7 * 6 * 5) / (3 * 2 * 1) = 35."
  },
  {
    id: "tcat-math-411",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Medium",
    q: "Evaluate the trigonometric limit: lim(x -> 0) [ sin(5x) / (3x) ].",
    options: [
      "5/3",
      "3/5",
      "1",
      "0"
    ],
    correct: 0,
    explain: "Using lim(u -> 0) [sin(u)/u] = 1: lim(x -> 0) [(sin(5x)/(5x)) * (5/3)] = 1 * (5/3) = 5/3."
  },
  {
    id: "tcat-math-412",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Medium",
    q: "Find the derivative of y = ln(sec(x) + tan(x)) with respect to x.",
    options: [
      "sec(x)",
      "tan(x)",
      "sec(x)*tan(x)",
      "1 / (sec(x) + tan(x))"
    ],
    correct: 0,
    explain: "dy/dx = (1 / (sec(x) + tan(x))) * (sec(x)tan(x) + sec^2(x)) = (sec(x)(tan(x) + sec(x))) / (sec(x) + tan(x)) = sec(x)."
  },
  {
    id: "tcat-math-413",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Medium",
    q: "Evaluate the definite integral: ∫ from 0 to 1 of [ x / (x^2 + 1) ] dx.",
    options: [
      "(1/2) * ln(2)",
      "ln(2)",
      "(1/2) * ln(3)",
      "2 * ln(2)"
    ],
    correct: 0,
    explain: "Let u = x^2 + 1, then du = 2x dx. The integral becomes (1/2) ∫_1^2 (1/u) du = (1/2) [ln(2) - ln(1)] = (1/2) ln(2)."
  },
  {
    id: "tcat-math-414",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Medium",
    q: "Find the perpendicular distance from the point P(2, -3) to the straight line 3x - 4y + 7 = 0.",
    options: [
      "5",
      "25",
      "1",
      "4"
    ],
    correct: 0,
    explain: "Distance d = |Ax_1 + By_1 + C| / √(A^2 + B^2) = |3(2) - 4(-3) + 7| / √(3^2 + (-4)^2) = |6 + 12 + 7| / 5 = 25 / 5 = 5."
  },
  {
    id: "tcat-math-415",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Medium",
    q: "What are the coordinates of the foci of the ellipse (x^2 / 25) + (y^2 / 9) = 1?",
    options: [
      "(±4, 0)",
      "(0, ±4)",
      "(±5, 0)",
      "(±3, 0)"
    ],
    correct: 0,
    explain: "Here a^2 = 25, b^2 = 9. For an ellipse, c^2 = a^2 - b^2 = 25 - 9 = 16, so c = 4. Since a is under x^2, foci lie on the x-axis at (±4, 0)."
  },
  {
    id: "tcat-math-416",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Medium",
    q: "Find the area of the parallelogram formed by the adjacent vectors a = 2i - j + 2k and b = i + 2j - k.",
    options: [
      "5√2",
      "√89",
      "3√10",
      "15"
    ],
    correct: 0,
    explain: "Cross product a x b = det([[i, j, k], [2, -1, 2], [1, 2, -1]]) = -3i + 4j + 5k. Area = |a x b| = √((-3)^2 + 4^2 + 5^2) = √(9 + 16 + 25) = √50 = 5√2."
  },
  {
    id: "tcat-math-417",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Medium",
    q: "If A is an invertible 3x3 matrix with determinant det(A) = 4, what is the determinant of the scalar multiple matrix 2A?",
    options: [
      "32",
      "8",
      "16",
      "64"
    ],
    correct: 0,
    explain: "For an n x n matrix, det(k*A) = k^n * det(A). For n = 3: det(2A) = 2^3 * det(A) = 8 * 4 = 32."
  },
  {
    id: "tcat-math-418",
    subject: "Mathematics",
    topic: "Sequences and Series",
    difficulty: "Medium",
    q: "Find the sum of the infinite geometric series: 12 + 4 + 4/3 + 4/9 + ...",
    options: [
      "18",
      "16",
      "24",
      "15"
    ],
    correct: 0,
    explain: "First term a = 12, common ratio r = 4/12 = 1/3. Since |r| < 1, S_inf = a / (1 - r) = 12 / (1 - 1/3) = 12 / (2/3) = 18."
  },
  {
    id: "tcat-math-419",
    subject: "Mathematics",
    topic: "Trigonometric Identities",
    difficulty: "Medium",
    q: "Simplify the trigonometric expression: [ 1 - cos(2θ) ] / sin(2θ).",
    options: [
      "tan(θ)",
      "cot(θ)",
      "sin(θ)",
      "sec(θ)"
    ],
    correct: 0,
    explain: "Using 1 - cos(2θ) = 2sin^2(θ) and sin(2θ) = 2sin(θ)cos(θ): 2sin^2(θ) / [2sin(θ)cos(θ)] = sin(θ)/cos(θ) = tan(θ)."
  },
  {
    id: "tcat-math-420",
    subject: "Mathematics",
    topic: "Permutation Combination and Probability",
    difficulty: "Medium",
    q: "In how many distinct ways can the letters of the word \"STATISTICS\" be arranged?",
    options: [
      "50,400",
      "100,800",
      "302,400",
      "3,628,800"
    ],
    correct: 0,
    explain: "The word \"STATISTICS\" contains 10 letters: S occurs 3 times, T occurs 3 times, I occurs 2 times, A occurs 1 time, C occurs 1 time. Distinct permutations = 10! / (3! * 3! * 2!) = 3,628,800 / (6 * 6 * 2) = 3,628,800 / 72 = 50,400."
  },
  {
    id: "tcat-math-421",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Hard",
    q: "Find the slope of the normal to the circle x^2 + y^2 - 4x + 6y - 12 = 0 at the point P(5, 1).",
    options: [
      "4/3",
      "-3/4",
      "-4/3",
      "3/4"
    ],
    correct: 0,
    explain: "Implicit differentiation yields 2x + 2y(dy/dx) - 4 + 6(dy/dx) = 0 => dy/dx = (2 - x) / (y + 3). At (5, 1), the tangent slope is m_tan = (2 - 5)/(1 + 3) = -3/4. Therefore, the normal slope is m_norm = -1 / (-3/4) = 4/3."
  },
  {
    id: "tcat-math-422",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Hard",
    q: "Evaluate the definite integral by parts: ∫ from 0 to π/2 of [ x * cos(x) ] dx.",
    options: [
      "(π/2) - 1",
      "π - 1",
      "(π/2) + 1",
      "1"
    ],
    correct: 0,
    explain: "∫ x cos(x) dx = x sin(x) - ∫ sin(x) dx = x sin(x) + cos(x). Evaluated from 0 to π/2: [(π/2)(1) + 0] - [0 + 1] = (π/2) - 1."
  },
  {
    id: "tcat-math-423",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Hard",
    q: "Determine the eccentricity of the hyperbola defined by the equation 9x^2 - 16y^2 = 144.",
    options: [
      "5/4",
      "4/5",
      "5/3",
      "√7/4"
    ],
    correct: 0,
    explain: "Dividing by 144 gives (x^2 / 16) - (y^2 / 9) = 1. Here a^2 = 16 (so a = 4) and b^2 = 9. For a hyperbola, c^2 = a^2 + b^2 = 16 + 9 = 25, so c = 5. Eccentricity e = c/a = 5/4."
  },
  {
    id: "tcat-math-424",
    subject: "Mathematics",
    topic: "Functions and Limits",
    difficulty: "Hard",
    q: "Evaluate the limit using L'Hopital's rule: lim(x -> 0) [ (e^(2x) - 1 - 2x) / x^2 ].",
    options: [
      "2",
      "1",
      "4",
      "0"
    ],
    correct: 0,
    explain: "Form 0/0. First differentiation: (2e^(2x) - 2) / (2x) = (e^(2x) - 1) / x. Still 0/0. Second differentiation: 2e^(2x) / 1. At x = 0, this evaluates to 2(1)/1 = 2."
  },
  {
    id: "tcat-math-425",
    subject: "Mathematics",
    topic: "Vectors",
    difficulty: "Hard",
    q: "Find the volume of the parallelepiped whose coterminous edges are defined by vectors u = i + 2j + 3k, v = 2i - j + k, and w = 3i + j + 2k.",
    options: [
      "10 cubic units",
      "16 cubic units",
      "24 cubic units",
      "12 cubic units"
    ],
    correct: 0,
    explain: "The volume is the scalar triple product |u . (v x w)| = |det([[1, 2, 3], [2, -1, 1], [3, 1, 2]])| = |1(-2 - 1) - 2(4 - 3) + 3(2 - (-3))| = |-3 - 2 + 15| = 10 cubic units."
  },
  {
    id: "tcat-math-426",
    subject: "Mathematics",
    topic: "Matrices and Determinants",
    difficulty: "Hard",
    q: "If A is an orthogonal square matrix (A^T * A = I), what are the only possible real values of its determinant det(A)?",
    options: [
      "±1",
      "Only 1",
      "Only 0",
      "Any real number except 0"
    ],
    correct: 0,
    explain: "det(A^T * A) = det(I) => det(A^T) * det(A) = 1. Since det(A^T) = det(A), we have (det(A))^2 = 1, meaning det(A) = ±1."
  },
  {
    id: "tcat-math-427",
    subject: "Mathematics",
    topic: "Introduction to Analytic Geometry",
    difficulty: "Hard",
    q: "Find the condition for the general second-degree homogeneous equation ax^2 + 2hxy + by^2 = 0 to represent two perpendicular straight lines.",
    options: [
      "a + b = 0",
      "h^2 - ab = 0",
      "a - b = 0",
      "h = 0"
    ],
    correct: 0,
    explain: "The angle θ between the lines is given by tan(θ) = 2√(h^2 - ab) / (a + b). The lines are perpendicular (θ = 90°) when the denominator vanishes, i.e., a + b = 0 (sum of coefficients of x^2 and y^2 is zero)."
  },
  {
    id: "tcat-math-428",
    subject: "Mathematics",
    topic: "Differentiation",
    difficulty: "Hard",
    q: "Find the maximum value of the function f(x) = x * e^(-x) for x ≥ 0.",
    options: [
      "1/e",
      "e",
      "1",
      "2/e"
    ],
    correct: 0,
    explain: "f'(x) = e^(-x) - x*e^(-x) = e^(-x)(1 - x). Setting f'(x) = 0 gives x = 1. Since f''(1) < 0, this is a local maximum: f(1) = 1 * e^(-1) = 1/e."
  },
  {
    id: "tcat-math-429",
    subject: "Mathematics",
    topic: "Integration",
    difficulty: "Hard",
    q: "Evaluate the improper integral: ∫ from 0 to ∞ of [ e^(-2x) ] dx.",
    options: [
      "1/2",
      "1",
      "2",
      "Diverges"
    ],
    correct: 0,
    explain: "lim(b -> ∞) [- (1/2) e^(-2x)]_0^b = lim(b -> ∞) [- (1/2) e^(-2b) - (-1/2)] = 0 + 1/2 = 1/2."
  },
  {
    id: "tcat-math-430",
    subject: "Mathematics",
    topic: "Conic Sections",
    difficulty: "Hard",
    q: "Find the equation of the directrix of the parabola y^2 = -12x.",
    options: [
      "x = 3",
      "x = -3",
      "y = 3",
      "y = -3"
    ],
    correct: 0,
    explain: "The standard parabola y^2 = -4ax has 4a = 12, so a = 3. Its focus is at (-3, 0) and its vertical directrix is given by x = a, which is x = 3."
  }
];

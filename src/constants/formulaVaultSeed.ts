export interface D1FormulaCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  sort_order: number;
  chapter_count: number;
  formula_count: number;
  status: 'live' | 'draft';
  is_active?: number;
  guest_access: number;
  search_text: string;
  created_at: string;
  updated_at: string;
}

export interface D1FormulaChapterRow {
  id: string;
  category_id: string;
  chapter_no: number;
  title: string;
  slug: string;
  subtopics: string;
  sort_order: number;
  formula_count: number;
  status: 'live' | 'draft';
  pdf_r2_key: string;
  pdf_updated_at: string;
  pdf_generated_at?: string;
  search_text: string;
  created_at: string;
  updated_at: string;
}

export interface D1FormulaRow {
  id: string;
  category_id: string;
  chapter_id: string;
  formula_no: number;
  title: string;
  formula_latex: string;
  plain_text: string;
  formula_plain?: string;
  note: string;
  status: 'live' | 'draft';
  sort_order: number;
  is_featured?: number;
  is_render_valid: number;
  render_error: string;
  search_text: string;
  created_at: string;
  updated_at: string;
}

export type D1FormulaItemRow = D1FormulaRow;

export interface D1FormulaBookmarkRow {
  id: number;
  user_id: string;
  formula_id: string;
  category_id: string;
  chapter_id: string;
  created_at: string;
}

export interface D1FormulaReportRow {
  id: string;
  formula_id: string;
  category_id: string;
  chapter_id: string;
  user_id: string;
  reason: string;
  details: string;
  formula_latex_snapshot: string;
  formula_latex?: string;
  status: 'open' | 'resolved' | 'ignored';
  resolved_by: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  chapter_title?: string;
  formula_no?: number;
}

export interface D1FormulaImportLogRow {
  id: string;
  category_id: string;
  category_name?: string;
  chapter_id: string;
  admin_uid: string;
  source_type: 'csv' | 'gsheet' | 'paste';
  file_name: string;
  csv_r2_key: string;
  duplicate_strategy: 'skip' | 'update';
  total_rows: number;
  imported_rows: number;
  updated_rows: number;
  skipped_rows: number;
  failed_rows: number;
  imported_count?: number;
  updated_count?: number;
  skipped_count?: number;
  failed_count?: number;
  status: string;
  created_at: string;
}

const NOW_ISO = '2026-03-01T00:00:00.000Z';

export const SEED_FORMULA_CATEGORIES: Omit<D1FormulaCategoryRow, 'chapter_count' | 'formula_count'>[] = [
  {
    id: 'cat_basic-maths',
    name: 'Basic Maths',
    slug: 'basic-maths',
    description: 'Quantitative arithmetic, percentages, logarithms, progressions, and number theory.',
    sort_order: 1,
    status: 'live',
    guest_access: 1,
    search_text: 'basic maths quantitative arithmetic percentages logarithms number series progressions',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  {
    id: 'cat_advanced-maths',
    name: 'Advanced Maths',
    slug: 'advanced-maths',
    description: 'Algebraic identities, quadratics, binomial expansion, trigonometry, and calculus.',
    sort_order: 2,
    status: 'live',
    guest_access: 1,
    search_text: 'advanced maths algebra quadratics binomial trigonometry derivatives integrals',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  {
    id: 'cat_physics',
    name: 'Physics',
    slug: 'physics',
    description: 'Classical mechanics, kinematics, projectile motion, electrostatics, and circuits.',
    sort_order: 3,
    status: 'live',
    guest_access: 1,
    search_text: 'physics kinematics mechanics electricity circuits coulomb ohm kirchhoff',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  {
    id: 'cat_chemistry',
    name: 'Chemistry',
    slug: 'chemistry',
    description: 'Gas laws, kinetic molecular theory, stoichiometry, thermochemistry, and equilibrium.',
    sort_order: 4,
    status: 'live',
    guest_access: 1,
    search_text: 'chemistry gas laws ideal gas boyle charles avogadro dalton van der waals',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  {
    id: 'cat_computer-science',
    name: 'Computer Science',
    slug: 'computer-science',
    description: 'Algorithm complexity, asymptotic bounds, recurrence relations, and data structures.',
    sort_order: 5,
    status: 'live',
    guest_access: 1,
    search_text: 'computer science algorithm complexity big o master theorem sorting graph trees',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  {
    id: 'cat_statistics',
    name: 'Statistics',
    slug: 'statistics',
    description: 'Descriptive measures, probability axioms, Bayes theorem, and standard distributions.',
    sort_order: 6,
    status: 'live',
    guest_access: 1,
    search_text: 'statistics probability variance standard deviation binomial normal distribution bayes',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  {
    id: 'cat_biology',
    name: 'Biology',
    slug: 'biology',
    description: 'Population genetics, Hardy-Weinberg equilibrium, bioenergetics, and enzyme kinetics.',
    sort_order: 7,
    status: 'live',
    guest_access: 1,
    search_text: 'biology hardy weinberg genetics water potential michaelis menten cellular respiration',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  {
    id: 'cat_economics-and-finance',
    name: 'Economics and Finance',
    slug: 'economics-and-finance',
    description: 'Time value of money, annuities, price elasticity, and macroeconomic multipliers.',
    sort_order: 8,
    status: 'live',
    guest_access: 1,
    search_text: 'economics finance npv compound interest annuity elasticity gdp multiplier',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  {
    id: 'cat_electronics-and-engineering',
    name: 'Electronics and Engineering',
    slug: 'electronics-and-engineering',
    description: 'AC impedance, resonance, decibels, operational amplifiers, and logic gates.',
    sort_order: 9,
    status: 'live',
    guest_access: 1,
    search_text: 'electronics engineering ac impedance resonance op amp decibel RLC filter',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
];

interface SeedChapterSpec {
  id: string;
  category_id: string;
  chapter_no: number;
  title: string;
  slug: string;
  subtopics: string;
  sort_order: number;
  formulas: Array<{
    formula_no: number;
    title: string;
    formula_latex: string;
    plain_text: string;
    note: string;
  }>;
}

const RAW_SEED_CHAPTERS: SeedChapterSpec[] = [
  // =========================================================================
  // 1. BASIC MATHS — Chapter 1: Number System (12 formulas)
  // =========================================================================
  {
    id: 'chap_bm_number-system',
    category_id: 'cat_basic-maths',
    chapter_no: 1,
    title: 'Number System',
    slug: 'number-system',
    subtopics: 'Euclidean Division · HCF & LCM · Divisibility & Factors · Modular Arithmetic',
    sort_order: 1,
    formulas: [
      {
        formula_no: 1,
        title: 'Euclidean Division Lemma',
        formula_latex: 'N = d \\cdot q + r \\quad (0 \\le r < |d|)',
        plain_text: 'N = d * q + r (0 <= r < |d|)',
        note: 'Dividend equals divisor times quotient plus non-negative remainder strictly less than divisor.',
      },
      {
        formula_no: 2,
        title: 'Product of Two Numbers via HCF and LCM',
        formula_latex: 'a \\times b = \\operatorname{HCF}(a, b) \\times \\operatorname{LCM}(a, b)',
        plain_text: 'a * b = HCF(a, b) * LCM(a, b)',
        note: 'Holds strictly for any two positive integers a and b.',
      },
      {
        formula_no: 3,
        title: 'HCF and LCM of Fractions',
        formula_latex: '\\operatorname{HCF} = \\frac{\\operatorname{HCF}(\\text{numerators})}{\\operatorname{LCM}(\\text{denominators})}, \\qquad \\operatorname{LCM} = \\frac{\\operatorname{LCM}(\\text{numerators})}{\\operatorname{HCF}(\\text{denominators})}',
        plain_text: 'HCF = HCF(numerators)/LCM(denominators); LCM = LCM(numerators)/HCF(denominators)',
        note: 'Reduce all fractions to their simplest coprime form before applying.',
      },
      {
        formula_no: 4,
        title: 'Total Number of Positive Divisors',
        formula_latex: 'N = p_{1}^{a_{1}} p_{2}^{a_{2}} \\cdots p_{k}^{a_{k}} \\implies d(N) = (a_{1} + 1)(a_{2} + 1)\\cdots(a_{k} + 1)',
        plain_text: 'd(N) = (a1 + 1)(a2 + 1)...(ak + 1)',
        note: 'Where p_1, p_2, ..., p_k are distinct prime factors of N.',
      },
      {
        formula_no: 5,
        title: 'Sum of All Positive Divisors',
        formula_latex: '\\sigma(N) = \\prod_{i=1}^{k} \\frac{p_{i}^{a_{i} + 1} - 1}{p_{i} - 1}',
        plain_text: 'sigma(N) = product((p_i^(a_i + 1) - 1) / (p_i - 1))',
        note: 'Gives the sum of all positive factors of N including 1 and N itself.',
      },
      {
        formula_no: 6,
        title: 'Product of All Positive Divisors',
        formula_latex: 'P(N) = N^{d(N) / 2}',
        plain_text: 'P(N) = N^(d(N) / 2)',
        note: 'Where d(N) is the total count of positive divisors of N.',
      },
      {
        formula_no: 7,
        title: 'Number of Ways to Write N as Product of Two Factors',
        formula_latex: 'W = \\frac{d(N)}{2} \\; (\\text{non-square}), \\qquad W = \\frac{d(N) + 1}{2} \\; (\\text{perfect square})',
        plain_text: 'W = d(N)/2 for non-square; W = (d(N)+1)/2 for perfect square',
        note: 'Counts unordered factor pairs (u, v) such that u * v = N.',
      },
      {
        formula_no: 8,
        title: 'Euler’s Totient Function (Count of Coprimes <= N)',
        formula_latex: '\\phi(N) = N \\prod_{p \\mid N} \\left(1 - \\frac{1}{p}\\right)',
        plain_text: 'phi(N) = N * product(1 - 1/p)',
        note: 'Counts positive integers up to N that are relatively prime to N.',
      },
      {
        formula_no: 9,
        title: 'Legendre’s Formula (Highest Power of Prime p in n!)',
        formula_latex: 'E_{p}(n!) = \\sum_{k=1}^{\\infty} \\left\\lfloor \\frac{n}{p^{k}} \\right\\rfloor = \\left\\lfloor \\frac{n}{p} \\right\\rfloor + \\left\\lfloor \\frac{n}{p^{2}} \\right\\rfloor + \\cdots',
        plain_text: 'E_p(n!) = floor(n/p) + floor(n/p^2) + floor(n/p^3) + ...',
        note: 'For trailing zeros of n!, compute E_5(n!).',
      },
      {
        formula_no: 10,
        title: 'Fermat’s Little Theorem',
        formula_latex: 'a^{p - 1} \\equiv 1 \\pmod{p} \\quad (p \\text{ prime},\\; \\gcd(a, p) = 1)',
        plain_text: 'a^(p - 1) = 1 (mod p) for prime p not dividing a',
        note: 'Fast remainder reduction for large prime moduli.',
      },
      {
        formula_no: 11,
        title: 'Euler’s Remainder Theorem',
        formula_latex: 'a^{\\phi(n)} \\equiv 1 \\pmod{n} \\quad (\\gcd(a, n) = 1)',
        plain_text: 'a^phi(n) = 1 (mod n) when gcd(a, n) = 1',
        note: 'Generalizes Fermat’s Little Theorem to any composite modulus n.',
      },
      {
        formula_no: 12,
        title: 'Wilson’s Prime Remainder Theorem',
        formula_latex: '(p - 1)! \\equiv -1 \\equiv p - 1 \\pmod{p} \\quad (p \\text{ prime})',
        plain_text: '(p - 1)! = -1 = p - 1 (mod p)',
        note: 'Also implies (p - 2)! is congruent to 1 modulo prime p.',
      },
    ],
  },

  // =========================================================================
  // 2. BASIC MATHS — Chapter 2: Algebraic Identities (12 formulas)
  // =========================================================================
  {
    id: 'chap_bm_algebraic-identities',
    category_id: 'cat_basic-maths',
    chapter_no: 2,
    title: 'Algebraic Identities',
    slug: 'algebraic-identities',
    subtopics: 'Binomial Squares · Cubic Identities · Reciprocal Powers · Cyclic Factorizations',
    sort_order: 2,
    formulas: [
      {
        formula_no: 1,
        title: 'Square of Sum and Difference',
        formula_latex: '(a \\pm b)^{2} = a^{2} \\pm 2ab + b^{2}',
        plain_text: '(a +/- b)^2 = a^2 +/- 2ab + b^2',
        note: 'Core binomial expansion for squaring two-term expressions.',
      },
      {
        formula_no: 2,
        title: 'Difference of Squares Factorization',
        formula_latex: 'a^{2} - b^{2} = (a - b)(a + b)',
        plain_text: 'a^2 - b^2 = (a - b)(a + b)',
        note: 'Used to simplify differences of squares and rationalize conjugate denominators.',
      },
      {
        formula_no: 3,
        title: 'Sum of Squares from Sum and Product',
        formula_latex: 'a^{2} + b^{2} = (a + b)^{2} - 2ab = (a - b)^{2} + 2ab',
        plain_text: 'a^2 + b^2 = (a + b)^2 - 2ab = (a - b)^2 + 2ab',
        note: 'Directly evaluates a^2 + b^2 given (a + b) or (a - b) and ab.',
      },
      {
        formula_no: 4,
        title: 'Combined Square Sum & Difference Identity',
        formula_latex: '(a + b)^{2} + (a - b)^{2} = 2(a^{2} + b^{2}), \\qquad (a + b)^{2} - (a - b)^{2} = 4ab',
        plain_text: '(a+b)^2 + (a-b)^2 = 2(a^2+b^2); (a+b)^2 - (a-b)^2 = 4ab',
        note: 'Connects (a + b)^2 and (a - b)^2 directly via 4ab.',
      },
      {
        formula_no: 5,
        title: 'Cube of a Binomial',
        formula_latex: '(a \\pm b)^{3} = a^{3} \\pm b^{3} \\pm 3ab(a \\pm b)',
        plain_text: '(a +/- b)^3 = a^3 +/- b^3 +/- 3ab(a +/- b)',
        note: 'Expanded form: a^3 +/- 3a^2b + 3ab^2 +/- b^3.',
      },
      {
        formula_no: 6,
        title: 'Sum and Difference of Cubes',
        formula_latex: 'a^{3} \\pm b^{3} = (a \\pm b)(a^{2} \\mp ab + b^{2})',
        plain_text: 'a^3 +/- b^3 = (a +/- b)(a^2 -/+ ab + b^2)',
        note: 'Note the opposite sign on the middle ab term inside the quadratic factor.',
      },
      {
        formula_no: 7,
        title: 'Square of a Trinomial',
        formula_latex: '(a + b + c)^{2} = a^{2} + b^{2} + c^{2} + 2(ab + bc + ca)',
        plain_text: '(a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca)',
        note: 'Relates the sum of three terms, sum of squares, and pairwise products.',
      },
      {
        formula_no: 8,
        title: 'Cyclic Sum of Cubes Identity',
        formula_latex: 'a^{3} + b^{3} + c^{3} - 3abc = (a + b + c)(a^{2} + b^{2} + c^{2} - ab - bc - ca)',
        plain_text: 'a^3 + b^3 + c^3 - 3abc = (a+b+c)(a^2+b^2+c^2-ab-bc-ca)',
        note: 'Also equals (1/2)(a + b + c)[(a - b)^2 + (b - c)^2 + (c - a)^2].',
      },
      {
        formula_no: 9,
        title: 'Conditional Cubic Identity (When a + b + c = 0)',
        formula_latex: 'a + b + c = 0 \\implies a^{3} + b^{3} + c^{3} = 3abc',
        plain_text: 'If a + b + c = 0, then a^3 + b^3 + c^3 = 3abc',
        note: 'High-frequency shortcut when three terms sum to zero.',
      },
      {
        formula_no: 10,
        title: 'Reciprocal Square Identity',
        formula_latex: 'x + \\frac{1}{x} = k \\implies x^{2} + \\frac{1}{x^{2}} = k^{2} - 2',
        plain_text: 'If x + 1/x = k, then x^2 + 1/x^2 = k^2 - 2',
        note: 'If x - 1/x = k, then x^2 + 1/x^2 = k^2 + 2.',
      },
      {
        formula_no: 11,
        title: 'Reciprocal Cube Identity',
        formula_latex: 'x + \\frac{1}{x} = k \\implies x^{3} + \\frac{1}{x^{3}} = k^{3} - 3k',
        plain_text: 'If x + 1/x = k, then x^3 + 1/x^3 = k^3 - 3k',
        note: 'If x - 1/x = k, then x^3 - 1/x^3 = k^3 + 3k.',
      },
      {
        formula_no: 12,
        title: 'Sophie Germain Biquadratic Factorization',
        formula_latex: 'a^{4} + a^{2}b^{2} + b^{4} = (a^{2} + ab + b^{2})(a^{2} - ab + b^{2})',
        plain_text: 'a^4 + a^2*b^2 + b^4 = (a^2 + ab + b^2)(a^2 - ab + b^2)',
        note: 'Completes the square by adding and subtracting a^2b^2.',
      },
    ],
  },

  // =========================================================================
  // 3. BASIC MATHS — Chapter 3: Exponents & Surds (12 formulas)
  // =========================================================================
  {
    id: 'chap_bm_exponents-and-surds',
    category_id: 'cat_basic-maths',
    chapter_no: 3,
    title: 'Exponents & Surds',
    slug: 'exponents-and-surds',
    subtopics: 'Laws of Indices · Fractional Exponents · Radical Operations · Conjugate Rationalization',
    sort_order: 3,
    formulas: [
      {
        formula_no: 1,
        title: 'Product and Quotient Laws of Exponents',
        formula_latex: 'a^{m} \\cdot a^{n} = a^{m + n}, \\qquad \\frac{a^{m}}{a^{n}} = a^{m - n} \\quad (a \\neq 0)',
        plain_text: 'a^m * a^n = a^(m + n); a^m / a^n = a^(m - n)',
        note: 'Add exponents when multiplying same bases; subtract exponents when dividing.',
      },
      {
        formula_no: 2,
        title: 'Power of a Power and Power of a Product',
        formula_latex: '(a^{m})^{n} = a^{mn}, \\qquad (ab)^{n} = a^{n}b^{n}, \\qquad \\left(\\frac{a}{b}\\right)^{n} = \\frac{a^{n}}{b^{n}}',
        plain_text: '(a^m)^n = a^(m*n); (ab)^n = a^n * b^n; (a/b)^n = a^n / b^n',
        note: 'Note that a^(m^n) is evaluated top-down and does NOT equal (a^m)^n in general.',
      },
      {
        formula_no: 3,
        title: 'Zero and Negative Exponents',
        formula_latex: 'a^{0} = 1 \\; (a \\neq 0), \\qquad a^{-n} = \\frac{1}{a^{n}}, \\qquad \\left(\\frac{a}{b}\\right)^{-n} = \\left(\\frac{b}{a}\\right)^{n}',
        plain_text: 'a^0 = 1; a^(-n) = 1 / a^n; (a/b)^(-n) = (b/a)^n',
        note: 'A negative exponent takes the reciprocal of the base.',
      },
      {
        formula_no: 4,
        title: 'Fractional Exponents (nth Root Definition)',
        formula_latex: 'a^{m/n} = \\sqrt[n]{a^{m}} = \\left(\\sqrt[n]{a}\\right)^{m} \\quad (a > 0)',
        plain_text: 'a^(m/n) = nth_root(a^m) = (nth_root(a))^m',
        note: 'Denominator n is the root index and numerator m is the power.',
      },
      {
        formula_no: 5,
        title: 'Multiplication and Division of Same-Order Surds',
        formula_latex: '\\sqrt[n]{a} \\cdot \\sqrt[n]{b} = \\sqrt[n]{ab}, \\qquad \\frac{\\sqrt[n]{a}}{\\sqrt[n]{b}} = \\sqrt[n]{\\frac{a}{b}}',
        plain_text: 'nth_root(a) * nth_root(b) = nth_root(a*b); nth_root(a)/nth_root(b) = nth_root(a/b)',
        note: 'Radicals of the same order n can be combined under a single root.',
      },
      {
        formula_no: 6,
        title: 'Nested Radical Index Law',
        formula_latex: '\\sqrt[m]{\\sqrt[n]{a}} = \\sqrt[mn]{a} = a^{1/(mn)}',
        plain_text: 'mth_root(nth_root(a)) = (m*n)th_root(a) = a^(1/(m*n))',
        note: 'Successive radical indices multiply together.',
      },
      {
        formula_no: 7,
        title: 'Conjugate Rationalization of Quadratic Surds',
        formula_latex: '\\frac{1}{\\sqrt{a} \\pm \\sqrt{b}} = \\frac{\\sqrt{a} \\mp \\sqrt{b}}{a - b} \\quad (a \\neq b)',
        plain_text: '1 / (sqrt(a) +/- sqrt(b)) = (sqrt(a) -/+ sqrt(b)) / (a - b)',
        note: 'Multiply numerator and denominator by the conjugate surd to eliminate radicals from the denominator.',
      },
      {
        formula_no: 8,
        title: 'Square Root of a Binomial Quadratic Surd',
        formula_latex: '\\sqrt{(a + b) \\pm 2\\sqrt{ab}} = \\sqrt{a} \\pm \\sqrt{b} \\quad (a \\ge b > 0)',
        plain_text: 'sqrt((a + b) +/- 2*sqrt(a*b)) = sqrt(a) +/- sqrt(b) for a >= b > 0',
        note: 'Find two numbers a and b whose sum is the outer term and product is inside 2*sqrt(ab).',
      },
      {
        formula_no: 9,
        title: 'Infinite Nested Square Root Product',
        formula_latex: '\\sqrt{a\\sqrt{a\\sqrt{a\\cdots}}} = a, \\qquad \\underbrace{\\sqrt{a\\sqrt{a\\cdots\\sqrt{a}}}}_{n \\text{ roots}} = a^{1 - 2^{-n}}',
        plain_text: 'sqrt(a*sqrt(a*sqrt(a...))) = a; n nested roots = a^(1 - 1/2^n)',
        note: 'For a > 0, the infinite product radical converges to a itself.',
      },
      {
        formula_no: 10,
        title: 'Infinite Nested Square Root Sum & Difference',
        formula_latex: '\\sqrt{a \\pm \\sqrt{a \\pm \\sqrt{a \\pm \\cdots}}} = \\frac{\\sqrt{4a + 1} \\pm 1}{2}',
        plain_text: 'sqrt(a +/- sqrt(a +/- ...)) = (sqrt(4a + 1) +/- 1) / 2',
        note: 'If a = k(k + 1), the positive nested sum equals k + 1 and the negative difference equals k.',
      },
      {
        formula_no: 11,
        title: 'Exponential Equality Comparison Rules',
        formula_latex: 'a^{x} = a^{y} \\implies x = y \\; (a > 0,\\, a \\neq 1); \\qquad x^{n} = y^{n} \\implies x = y \\; (n \\text{ odd})',
        plain_text: 'a^x = a^y => x = y (a > 0, a != 1)',
        note: 'For even n, x^n = y^n implies |x| = |y|.',
      },
      {
        formula_no: 12,
        title: 'Cubic Rationalizing Factor',
        formula_latex: '\\frac{1}{\\sqrt[3]{a} \\pm \\sqrt[3]{b}} = \\frac{\\sqrt[3]{a^{2}} \\mp \\sqrt[3]{ab} + \\sqrt[3]{b^{2}}}{a \\pm b}',
        plain_text: '1 / (cbrt(a) +/- cbrt(b)) = (cbrt(a^2) -/+ cbrt(ab) + cbrt(b^2)) / (a +/- b)',
        note: 'Uses the sum/difference of cubes identity u^3 +/- v^3 = (u +/- v)(u^2 -/+ uv + v^2).',
      },
    ],
  },

  // =========================================================================
  // 4. BASIC MATHS — Chapter 14: Percentages (16 formulas)
  // =========================================================================
  {
    id: 'chap_bm_percentages',
    category_id: 'cat_basic-maths',
    chapter_no: 14,
    title: 'Percentages',
    slug: 'percentages',
    subtopics: 'Percent Change · Successive Change · Reverse Percentage · Profit & Discount',
    sort_order: 6,
    formulas: [
      {
        formula_no: 1,
        title: 'Basic Percentage Definition',
        formula_latex: 'P\\% \\text{ of } X = \\frac{P}{100} \\times X',
        plain_text: 'P% of X = (P / 100) * X',
        note: 'Converts a percentage P into a fraction of 100 multiplied by base value X.',
      },
      {
        formula_no: 2,
        title: 'Percentage Share',
        formula_latex: '\\text{Percentage} = \\left(\\frac{\\text{Part}}{\\text{Whole}}\\right) \\times 100\\%',
        plain_text: 'Percentage = (Part / Whole) * 100%',
        note: 'Expresses one quantity as a percentage of the total reference quantity.',
      },
      {
        formula_no: 3,
        title: 'Percentage Change',
        formula_latex: '\\Delta\\% = \\left(\\frac{V_{\\text{new}} - V_{\\text{old}}}{V_{\\text{old}}}\\right) \\times 100\\%',
        plain_text: 'Percent Change = ((V_new - V_old) / V_old) * 100%',
        note: 'Denominator is always the original value V_old. Positive indicates increase; negative indicates decrease.',
      },
      {
        formula_no: 4,
        title: 'Value After Percentage Increase',
        formula_latex: 'V_{\\text{final}} = V_{0}\\left(1 + \\frac{r}{100}\\right)',
        plain_text: 'V_final = V_0 * (1 + r / 100)',
        note: 'Direct multiplier for increasing an initial quantity V_0 by r%.',
      },
      {
        formula_no: 5,
        title: 'Value After Percentage Decrease',
        formula_latex: 'V_{\\text{final}} = V_{0}\\left(1 - \\frac{r}{100}\\right)',
        plain_text: 'V_final = V_0 * (1 - r / 100)',
        note: 'Direct multiplier for reducing an initial quantity V_0 by r%.',
      },
      {
        formula_no: 6,
        title: 'Reverse Percentage (Original Value)',
        formula_latex: 'V_{0} = \\frac{V_{\\text{final}}}{1 \\pm \\frac{r}{100}}',
        plain_text: 'V_0 = V_final / (1 +/- r / 100)',
        note: 'Recovers the original pre-change value when only the final value and rate r% are known.',
      },
      {
        formula_no: 7,
        title: 'Successive Percentage Change (Two Steps)',
        formula_latex: '\\text{Net }\\% = \\left(a + b + \\frac{ab}{100}\\right)\\%',
        plain_text: 'Net % = (a + b + (a * b) / 100)%',
        note: 'Use negative sign for decreases. Applies when two percentage changes a% and b% occur sequentially.',
      },
      {
        formula_no: 8,
        title: 'Equal Increase then Decrease by r%',
        formula_latex: '\\text{Net Change} = -\\left(\\frac{r^{2}}{100}\\right)\\%',
        plain_text: 'Net Change = -(r^2 / 100)%',
        note: 'Increasing a number by r% and then decreasing by r% always results in a net decrease of (r^2 / 100)%.',
      },
      {
        formula_no: 9,
        title: 'Offsetting Percentage Reduction After r% Rise',
        formula_latex: '\\text{Required Decrease} = \\left(\\frac{r}{100 + r}\\times 100\\right)\\%',
        plain_text: 'Required Decrease = (r / (100 + r)) * 100%',
        note: 'If price rises by r%, consumption must drop by this percentage to keep total expenditure unchanged.',
      },
      {
        formula_no: 10,
        title: 'Offsetting Percentage Increase After r% Drop',
        formula_latex: '\\text{Required Increase} = \\left(\\frac{r}{100 - r}\\times 100\\right)\\%',
        plain_text: 'Required Increase = (r / (100 - r)) * 100%',
        note: 'If price falls by r%, consumption can increase by this percentage without changing expenditure.',
      },
      {
        formula_no: 11,
        title: 'Profit Percentage on Cost Price',
        formula_latex: '\\text{Profit }\\% = \\left(\\frac{\\text{SP} - \\text{CP}}{\\text{CP}}\\right) \\times 100\\%',
        plain_text: 'Profit % = ((SP - CP) / CP) * 100%',
        note: 'Profit and loss percentages are always computed with respect to Cost Price (CP) unless stated otherwise.',
      },
      {
        formula_no: 12,
        title: 'Selling Price from Profit/Loss Rate',
        formula_latex: '\\text{SP} = \\text{CP}\\left(1 \\pm \\frac{p}{100}\\right)',
        plain_text: 'SP = CP * (1 +/- p / 100)',
        note: 'Use +p for profit percentage and -p for loss percentage.',
      },
      {
        formula_no: 13,
        title: 'Discount Percentage on Marked Price',
        formula_latex: '\\text{Discount }\\% = \\left(\\frac{\\text{MP} - \\text{SP}}{\\text{MP}}\\right) \\times 100\\%',
        plain_text: 'Discount % = ((MP - SP) / MP) * 100%',
        note: 'Discount is always calculated on the Marked Price (MP) or List Price.',
      },
      {
        formula_no: 14,
        title: 'Equivalent Single Discount for Two Discounts',
        formula_latex: 'D_{\\text{eq}} = \\left(d_{1} + d_{2} - \\frac{d_{1}d_{2}}{100}\\right)\\%',
        plain_text: 'D_eq = (d1 + d2 - (d1 * d2) / 100)%',
        note: 'Single effective discount rate corresponding to successive discounts d1% and d2%.',
      },
      {
        formula_no: 15,
        title: 'Marked Price to Cost Price Ratio',
        formula_latex: '\\frac{\\text{MP}}{\\text{CP}} = \\frac{100 + \\text{Profit }\\%}{100 - \\text{Discount }\\%}',
        plain_text: 'MP / CP = (100 + Profit%) / (100 - Discount%)',
        note: 'Directly relates Marked Price and Cost Price when both discount % and profit % are known.',
      },
      {
        formula_no: 16,
        title: 'Compound Growth / Population Formula',
        formula_latex: 'P_{n} = P_{0}\\left(1 + \\frac{r}{100}\\right)^{n}',
        plain_text: 'P_n = P_0 * (1 + r / 100)^n',
        note: 'Gives value after n compounding periods at constant growth rate r% per period.',
      },
    ],
  },

  // =========================================================================
  // 2. BASIC MATHS — Chapter 8: Logarithms (14 formulas)
  // =========================================================================
  {
    id: 'chap_bm_logarithms',
    category_id: 'cat_basic-maths',
    chapter_no: 8,
    title: 'Logarithms',
    slug: 'logarithms',
    subtopics: 'Laws of Logarithms · Change of Base · Exponential Equivalence · Characteristic & Mantissa',
    sort_order: 2,
    formulas: [
      {
        formula_no: 1,
        title: 'Definition of Logarithm',
        formula_latex: '\\log_{b}(x) = y \\iff b^{y} = x \\quad (b > 0,\\, b \\neq 1,\\, x > 0)',
        plain_text: 'log_b(x) = y <=> b^y = x (b > 0, b != 1, x > 0)',
        note: 'Fundamental equivalence between logarithmic form and exponential form.',
      },
      {
        formula_no: 2,
        title: 'Logarithm of Unity and Base',
        formula_latex: '\\log_{b}(1) = 0, \\qquad \\log_{b}(b) = 1',
        plain_text: 'log_b(1) = 0, log_b(b) = 1',
        note: 'For any valid base b, the log of 1 is 0 and the log of the base itself is 1.',
      },
      {
        formula_no: 3,
        title: 'Product Rule of Logarithms',
        formula_latex: '\\log_{b}(MN) = \\log_{b}(M) + \\log_{b}(N)',
        plain_text: 'log_b(M * N) = log_b(M) + log_b(N)',
        note: 'The logarithm of a product equals the sum of the logarithms of its factors (M, N > 0).',
      },
      {
        formula_no: 4,
        title: 'Quotient Rule of Logarithms',
        formula_latex: '\\log_{b}\\!\\left(\\frac{M}{N}\\right) = \\log_{b}(M) - \\log_{b}(N)',
        plain_text: 'log_b(M / N) = log_b(M) - log_b(N)',
        note: 'The logarithm of a quotient equals the difference of the numerator and denominator logarithms.',
      },
      {
        formula_no: 5,
        title: 'Power Rule of Argument',
        formula_latex: '\\log_{b}\\!\\left(M^{k}\\right) = k\\,\\log_{b}(M)',
        plain_text: 'log_b(M^k) = k * log_b(M)',
        note: 'An exponent on the argument moves out as a linear multiplier.',
      },
      {
        formula_no: 6,
        title: 'Power Rule of Base',
        formula_latex: '\\log_{b^{m}}\\!(M^{n}) = \\frac{n}{m}\\,\\log_{b}(M)',
        plain_text: 'log_(b^m)(M^n) = (n / m) * log_b(M)',
        note: 'An exponent m in the base divides the resulting logarithm while argument exponent n multiplies it.',
      },
      {
        formula_no: 7,
        title: 'Change of Base Formula',
        formula_latex: '\\log_{b}(a) = \\frac{\\log_{c}(a)}{\\log_{c}(b)} = \\frac{\\ln(a)}{\\ln(b)}',
        plain_text: 'log_b(a) = log_c(a) / log_c(b) = ln(a) / ln(b)',
        note: 'Converts a logarithm from base b to any convenient base c such as 10 or e.',
      },
      {
        formula_no: 8,
        title: 'Reciprocal Base Identity',
        formula_latex: '\\log_{b}(a) = \\frac{1}{\\log_{a}(b)} \\implies \\log_{b}(a)\\cdot\\log_{a}(b) = 1',
        plain_text: 'log_b(a) = 1 / log_a(b)',
        note: 'Swapping the base and argument takes the reciprocal of the logarithm.',
      },
      {
        formula_no: 9,
        title: 'Telescoping Chain Rule',
        formula_latex: '\\log_{a}(b)\\cdot\\log_{b}(c)\\cdot\\log_{c}(d) = \\log_{a}(d)',
        plain_text: 'log_a(b) * log_b(c) * log_c(d) = log_a(d)',
        note: 'Intermediate bases cancel in a chain product of logarithms.',
      },
      {
        formula_no: 10,
        title: 'Inverse Exponential Identity',
        formula_latex: 'b^{\\log_{b}(x)} = x, \\qquad \\log_{b}\\!\\left(b^{x}\\right) = x',
        plain_text: 'b^(log_b(x)) = x, log_b(b^x) = x',
        note: 'Exponentiation and logarithms with the same base are inverse operations.',
      },
      {
        formula_no: 11,
        title: 'Base-Swapping Exponent Identity',
        formula_latex: 'a^{\\log_{b}(c)} = c^{\\log_{b}(a)}',
        plain_text: 'a^(log_b(c)) = c^(log_b(a))',
        note: 'The base a of the power and the argument c inside the exponent logarithm can be interchanged.',
      },
      {
        formula_no: 12,
        title: 'Reciprocal Base Sign Rule',
        formula_latex: '\\log_{1/b}(x) = -\\log_{b}(x) = \\log_{b}\\!\\left(\\frac{1}{x}\\right)',
        plain_text: 'log_(1/b)(x) = -log_b(x) = log_b(1/x)',
        note: 'Replacing the base or argument by its reciprocal negates the logarithm.',
      },
      {
        formula_no: 13,
        title: 'Number of Digits in Base-10 Representation',
        formula_latex: 'D = \\lfloor \\log_{10}(N) \\rfloor + 1',
        plain_text: 'D = floor(log10(N)) + 1',
        note: 'Gives the exact number of digits of any positive integer N in standard decimal notation.',
      },
      {
        formula_no: 14,
        title: 'Logarithmic Inequality Direction',
        formula_latex: '\\log_{b}(x) > \\log_{b}(y) \\iff \\begin{cases} x > y & \\text{if } b > 1 \\\\ 0 < x < y & \\text{if } 0 < b < 1 \\end{cases}',
        plain_text: 'log_b(x) > log_b(y) <=> x > y (for b > 1) or 0 < x < y (for 0 < b < 1)',
        note: 'Inequality sign reverses when the logarithm base lies strictly between 0 and 1.',
      },
    ],
  },

  // =========================================================================
  // 3. BASIC MATHS — Chapter 11: Number Series (14 formulas)
  // =========================================================================
  {
    id: 'chap_bm_number-series',
    category_id: 'cat_basic-maths',
    chapter_no: 11,
    title: 'Number Series',
    slug: 'number-series',
    subtopics: 'Arithmetic Progression · Geometric Progression · Harmonic Mean · Power Sums',
    sort_order: 3,
    formulas: [
      {
        formula_no: 1,
        title: 'nth Term of an Arithmetic Progression (AP)',
        formula_latex: 'a_{n} = a_{1} + (n - 1)d',
        plain_text: 'a_n = a_1 + (n - 1)*d',
        note: 'a_1 is the first term and d = a_2 - a_1 is the constant common difference.',
      },
      {
        formula_no: 2,
        title: 'Sum of First n Terms of an AP',
        formula_latex: 'S_{n} = \\frac{n}{2}\\bigl[2a_{1} + (n - 1)d\\bigr] = \\frac{n}{2}(a_{1} + a_{n})',
        plain_text: 'S_n = (n/2)*[2*a_1 + (n - 1)*d] = (n/2)*(a_1 + a_n)',
        note: 'Equals the number of terms multiplied by the average of the first and last terms.',
      },
      {
        formula_no: 3,
        title: 'Arithmetic Mean (AM)',
        formula_latex: '\\text{AM} = \\frac{a + b}{2}',
        plain_text: 'AM = (a + b) / 2',
        note: 'Middle term when three quantities a, AM, b form an Arithmetic Progression.',
      },
      {
        formula_no: 4,
        title: 'nth Term of a Geometric Progression (GP)',
        formula_latex: 'a_{n} = a_{1}\\,r^{n - 1}',
        plain_text: 'a_n = a_1 * r^(n - 1)',
        note: 'a_1 is the first term and r = a_2 / a_1 is the non-zero common ratio.',
      },
      {
        formula_no: 5,
        title: 'Sum of First n Terms of a GP',
        formula_latex: 'S_{n} = \\frac{a_{1}(1 - r^{n})}{1 - r} = \\frac{a_{1}(r^{n} - 1)}{r - 1} \\quad (r \\neq 1)',
        plain_text: 'S_n = a_1 * (r^n - 1) / (r - 1) for r != 1',
        note: 'For r = 1, the sum is simply S_n = n * a_1.',
      },
      {
        formula_no: 6,
        title: 'Sum of an Infinite Geometric Series',
        formula_latex: 'S_{\\infty} = \\frac{a_{1}}{1 - r} \\quad (|r| < 1)',
        plain_text: 'S_infinity = a_1 / (1 - r) for |r| < 1',
        note: 'Converges if and only if the magnitude of common ratio r is strictly less than 1.',
      },
      {
        formula_no: 7,
        title: 'Geometric Mean (GM)',
        formula_latex: '\\text{GM} = \\sqrt{ab} \\quad (a, b > 0)',
        plain_text: 'GM = sqrt(a * b)',
        note: 'For n positive numbers, GM = (x_1 * x_2 * ... * x_n)^(1/n).',
      },
      {
        formula_no: 8,
        title: 'Harmonic Mean (HM) of Two Numbers',
        formula_latex: '\\text{HM} = \\frac{2ab}{a + b}',
        plain_text: 'HM = (2 * a * b) / (a + b)',
        note: 'Reciprocal of the arithmetic mean of the reciprocals. Also gives average speed over equal distances.',
      },
      {
        formula_no: 9,
        title: 'AM–GM–HM Inequality & Relationship',
        formula_latex: '\\text{AM} \\ge \\text{GM} \\ge \\text{HM}, \\qquad \\text{GM}^{2} = \\text{AM} \\times \\text{HM}',
        plain_text: 'AM >= GM >= HM, and GM^2 = AM * HM',
        note: 'Holds for any two positive real numbers a, b; equality holds if and only if a = b.',
      },
      {
        formula_no: 10,
        title: 'Sum of First n Natural Numbers',
        formula_latex: '\\sum_{k=1}^{n} k = 1 + 2 + \\cdots + n = \\frac{n(n + 1)}{2}',
        plain_text: 'sum(k, k=1..n) = n*(n + 1) / 2',
        note: 'Triangular number formula for the sum of the first n positive integers.',
      },
      {
        formula_no: 11,
        title: 'Sum of Squares of First n Natural Numbers',
        formula_latex: '\\sum_{k=1}^{n} k^{2} = \\frac{n(n + 1)(2n + 1)}{6}',
        plain_text: 'sum(k^2, k=1..n) = n*(n + 1)*(2n + 1) / 6',
        note: 'Closed-form sum of squares 1^2 + 2^2 + ... + n^2.',
      },
      {
        formula_no: 12,
        title: 'Sum of Cubes of First n Natural Numbers',
        formula_latex: '\\sum_{k=1}^{n} k^{3} = \\left[\\frac{n(n + 1)}{2}\\right]^{2}',
        plain_text: 'sum(k^3, k=1..n) = (n*(n + 1) / 2)^2',
        note: 'Equals the square of the sum of the first n natural numbers.',
      },
      {
        formula_no: 13,
        title: 'Sum of First n Odd Natural Numbers',
        formula_latex: '\\sum_{k=1}^{n} (2k - 1) = 1 + 3 + 5 + \\cdots + (2n - 1) = n^{2}',
        plain_text: '1 + 3 + 5 + ... + (2n - 1) = n^2',
        note: 'The sum of the first n odd positive integers is always a perfect square n^2.',
      },
      {
        formula_no: 14,
        title: 'Term from Partial Sums',
        formula_latex: 'a_{n} = S_{n} - S_{n - 1} \\quad (n \\ge 2), \\qquad a_{1} = S_{1}',
        plain_text: 'a_n = S_n - S_(n-1) for n >= 2, a_1 = S_1',
        note: 'Recovers the nth term of any sequence directly from its cumulative sum formula S_n.',
      },
    ],
  },

  // =========================================================================
  // 4. ADVANCED MATHS — Chapter 1: Algebra basics (15 formulas)
  // =========================================================================
  {
    id: 'chap_am_algebra-basics',
    category_id: 'cat_advanced-maths',
    chapter_no: 1,
    title: 'Algebra basics',
    slug: 'algebra-basics',
    subtopics: 'Polynomial Identities · Quadratic Roots & Discriminant · Binomial Theorem · Factor Theorem',
    sort_order: 1,
    formulas: [
      {
        formula_no: 1,
        title: 'Square of a Binomial',
        formula_latex: '(a \\pm b)^{2} = a^{2} \\pm 2ab + b^{2}',
        plain_text: '(a +/- b)^2 = a^2 +/- 2ab + b^2',
        note: 'Fundamental expansion for the square of the sum or difference of two terms.',
      },
      {
        formula_no: 2,
        title: 'Difference of Two Squares',
        formula_latex: 'a^{2} - b^{2} = (a - b)(a + b)',
        plain_text: 'a^2 - b^2 = (a - b)(a + b)',
        note: 'Factorizes the difference of squares into conjugate binomial factors.',
      },
      {
        formula_no: 3,
        title: 'Legendre Identity (Sum & Difference of Squares)',
        formula_latex: '(a + b)^{2} - (a - b)^{2} = 4ab, \\qquad (a + b)^{2} + (a - b)^{2} = 2(a^{2} + b^{2})',
        plain_text: '(a + b)^2 - (a - b)^2 = 4ab; (a + b)^2 + (a - b)^2 = 2(a^2 + b^2)',
        note: 'Directly relates (a + b), (a - b), ab, and (a^2 + b^2) in entrance exam problems.',
      },
      {
        formula_no: 4,
        title: 'Cube of a Binomial',
        formula_latex: '(a \\pm b)^{3} = a^{3} \\pm 3a^{2}b + 3ab^{2} \\pm b^{3} = a^{3} \\pm b^{3} \\pm 3ab(a \\pm b)',
        plain_text: '(a +/- b)^3 = a^3 +/- b^3 +/- 3ab(a +/- b)',
        note: 'Factored form is especially fast when (a + b) and ab are given.',
      },
      {
        formula_no: 5,
        title: 'Sum and Difference of Two Cubes',
        formula_latex: 'a^{3} \\pm b^{3} = (a \\pm b)\\left(a^{2} \\mp ab + b^{2}\\right)',
        plain_text: 'a^3 +/- b^3 = (a +/- b)(a^2 -/+ ab + b^2)',
        note: 'Notice the opposite sign on the middle product term ab in the quadratic factor.',
      },
      {
        formula_no: 6,
        title: 'Square of a Trinomial',
        formula_latex: '(a + b + c)^{2} = a^{2} + b^{2} + c^{2} + 2(ab + bc + ca)',
        plain_text: '(a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca)',
        note: 'Relates the sum of three variables, sum of their squares, and pairwise products.',
      },
      {
        formula_no: 7,
        title: 'Gauss Cyclic Cubic Identity',
        formula_latex: 'a^{3} + b^{3} + c^{3} - 3abc = (a + b + c)\\left(a^{2} + b^{2} + c^{2} - ab - bc - ca\\right)',
        plain_text: 'a^3 + b^3 + c^3 - 3abc = (a + b + c)(a^2 + b^2 + c^2 - ab - bc - ca)',
        note: 'If a + b + c = 0, then immediately a^3 + b^3 + c^3 = 3abc.',
      },
      {
        formula_no: 8,
        title: 'Quadratic Formula',
        formula_latex: 'x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a} \\quad (ax^{2} + bx + c = 0,\\, a \\neq 0)',
        plain_text: 'x = (-b +/- sqrt(b^2 - 4ac)) / (2a)',
        note: 'Gives both roots of any quadratic equation in standard form.',
      },
      {
        formula_no: 9,
        title: 'Quadratic Discriminant',
        formula_latex: '\\Delta = b^{2} - 4ac',
        plain_text: 'Delta = b^2 - 4ac',
        note: 'Delta > 0: two distinct real roots; Delta = 0: equal real roots; Delta < 0: complex conjugate roots.',
      },
      {
        formula_no: 10,
        title: 'Vieta Formulas (Sum and Product of Roots)',
        formula_latex: '\\alpha + \\beta = -\\frac{b}{a}, \\qquad \\alpha\\beta = \\frac{c}{a}',
        plain_text: 'alpha + beta = -b/a, alpha * beta = c/a',
        note: 'Also |alpha - beta| = sqrt(b^2 - 4ac) / |a|.',
      },
      {
        formula_no: 11,
        title: 'Forming a Quadratic from Given Roots',
        formula_latex: 'x^{2} - (\\alpha + \\beta)x + \\alpha\\beta = 0',
        plain_text: 'x^2 - (Sum of roots)x + (Product of roots) = 0',
        note: 'Constructs a monic quadratic equation with roots alpha and beta.',
      },
      {
        formula_no: 12,
        title: 'Reciprocal Power Sums',
        formula_latex: 'x + \\frac{1}{x} = k \\implies x^{2} + \\frac{1}{x^{2}} = k^{2} - 2, \\quad x^{3} + \\frac{1}{x^{3}} = k^{3} - 3k',
        plain_text: 'If x + 1/x = k, then x^2 + 1/x^2 = k^2 - 2 and x^3 + 1/x^3 = k^3 - 3k',
        note: 'High-frequency shortcut for symmetric reciprocal expressions.',
      },
      {
        formula_no: 13,
        title: 'Polynomial Remainder & Factor Theorem',
        formula_latex: 'P(x) = (x - c)Q(x) + P(c); \\qquad (x - c) \\mid P(x) \\iff P(c) = 0',
        plain_text: 'Remainder of P(x) / (x - c) is P(c)',
        note: 'When polynomial P(x) is divided by (x - c), the remainder is P(c).',
      },
      {
        formula_no: 14,
        title: 'Binomial Theorem Expansion',
        formula_latex: '(a + b)^{n} = \\sum_{r=0}^{n} \\binom{n}{r} a^{n - r} b^{r}, \\qquad T_{r+1} = \\binom{n}{r} a^{n - r} b^{r}',
        plain_text: '(a + b)^n = sum(nCr * a^(n-r) * b^r, r=0..n)',
        note: 'General (r + 1)-th term is T_(r+1) = nCr * a^(n - r) * b^r.',
      },
      {
        formula_no: 15,
        title: 'Sum of Binomial Coefficients',
        formula_latex: '\\sum_{r=0}^{n} \\binom{n}{r} = 2^{n}, \\qquad \\sum_{r \\text{ even}} \\binom{n}{r} = \\sum_{r \\text{ odd}} \\binom{n}{r} = 2^{n-1}',
        plain_text: 'nC0 + nC1 + ... + nCn = 2^n',
        note: 'Setting a = b = 1 in the binomial expansion yields 2^n.',
      },
    ],
  },

  // =========================================================================
  // 5. ADVANCED MATHS — Chapter 5: Trigonometric & Calculus Identities (12 formulas)
  // =========================================================================
  {
    id: 'chap_am_trig-calculus',
    category_id: 'cat_advanced-maths',
    chapter_no: 5,
    title: 'Trigonometry & Calculus',
    slug: 'trigonometry-and-calculus',
    subtopics: 'Pythagorean Identities · Double Angle · Standard Limits · Derivatives & Integrals',
    sort_order: 2,
    formulas: [
      {
        formula_no: 1,
        title: 'Pythagorean Trigonometric Identities',
        formula_latex: '\\sin^{2}\\theta + \\cos^{2}\\theta = 1, \\quad 1 + \\tan^{2}\\theta = \\sec^{2}\\theta, \\quad 1 + \\cot^{2}\\theta = \\csc^{2}\\theta',
        plain_text: 'sin^2(theta) + cos^2(theta) = 1; 1 + tan^2(theta) = sec^2(theta)',
        note: 'Core trigonometric relationships valid for all angles within domain.',
      },
      {
        formula_no: 2,
        title: 'Compound Angle Formulas',
        formula_latex: '\\sin(\\alpha \\pm \\beta) = \\sin\\alpha\\cos\\beta \\pm \\cos\\alpha\\sin\\beta, \\quad \\cos(\\alpha \\pm \\beta) = \\cos\\alpha\\cos\\beta \\mp \\sin\\alpha\\sin\\beta',
        plain_text: 'sin(A +/- B) = sinA cosB +/- cosA sinB',
        note: 'Expands sine and cosine of the sum or difference of two angles.',
      },
      {
        formula_no: 3,
        title: 'Double-Angle Formulas',
        formula_latex: '\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta, \\qquad \\cos(2\\theta) = \\cos^{2}\\theta - \\sin^{2}\\theta = 2\\cos^{2}\\theta - 1 = 1 - 2\\sin^{2}\\theta',
        plain_text: 'sin(2*theta) = 2*sin(theta)*cos(theta); cos(2*theta) = cos^2(theta) - sin^2(theta)',
        note: 'Also yields power-reduction formulas sin^2(theta) = (1 - cos 2theta)/2.',
      },
      {
        formula_no: 4,
        title: 'Law of Sines and Law of Cosines',
        formula_latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R, \\qquad c^{2} = a^{2} + b^{2} - 2ab\\cos C',
        plain_text: 'a/sinA = b/sinB = c/sinC = 2R; c^2 = a^2 + b^2 - 2ab cosC',
        note: 'Relates side lengths, opposite angles, and circumradius R in any triangle.',
      },
      {
        formula_no: 5,
        title: 'Fundamental Trigonometric & Exponential Limits',
        formula_latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1, \\qquad \\lim_{x \\to 0} \\frac{e^{x} - 1}{x} = 1, \\qquad \\lim_{x \\to \\infty}\\left(1 + \\frac{1}{x}\\right)^{x} = e',
        plain_text: 'lim_(x->0) sin(x)/x = 1; lim_(x->0) (e^x - 1)/x = 1',
        note: 'Angle x must be measured in radians for trigonometric limits.',
      },
      {
        formula_no: 6,
        title: 'Power, Exponential & Logarithmic Derivatives',
        formula_latex: '\\frac{d}{dx}\\left(x^{n}\\right) = nx^{n-1}, \\qquad \\frac{d}{dx}\\left(e^{kx}\\right) = ke^{kx}, \\qquad \\frac{d}{dx}\\left(\\ln|x|\\right) = \\frac{1}{x}',
        plain_text: 'd/dx(x^n) = n*x^(n-1); d/dx(e^(kx)) = k*e^(kx); d/dx(ln|x|) = 1/x',
        note: 'Standard differentiation rules for algebraic and transcendental functions.',
      },
      {
        formula_no: 7,
        title: 'Product and Quotient Rules of Differentiation',
        formula_latex: '(uv)^{\\prime} = u^{\\prime}v + uv^{\\prime}, \\qquad \\left(\\frac{u}{v}\\right)^{\\prime} = \\frac{u^{\\prime}v - uv^{\\prime}}{v^{2}}',
        plain_text: '(u*v)\' = u\'*v + u*v\'; (u/v)\' = (u\'*v - u*v\') / v^2',
        note: 'Differentiates products and quotients of differentiable functions u(x) and v(x).',
      },
      {
        formula_no: 8,
        title: 'Chain Rule',
        formula_latex: '\\frac{dy}{dx} = \\frac{dy}{du}\\cdot\\frac{du}{dx} = f^{\\prime}(g(x))\\cdot g^{\\prime}(x)',
        plain_text: 'dy/dx = f\'(g(x)) * g\'(x)',
        note: 'Differentiates composite functions y = f(g(x)).',
      },
      {
        formula_no: 9,
        title: 'L’Hôpital’s Rule for Indeterminate Forms',
        formula_latex: '\\lim_{x \\to c} \\frac{f(x)}{g(x)} = \\lim_{x \\to c} \\frac{f^{\\prime}(x)}{g^{\\prime}(x)} \\quad \\left(\\text{for } \\frac{0}{0} \\text{ or } \\frac{\\infty}{\\infty}\\right)',
        plain_text: 'lim_(x->c) f(x)/g(x) = lim_(x->c) f\'(x)/g\'(x)',
        note: 'Applies when numerator and denominator both approach 0 or +/- infinity.',
      },
      {
        formula_no: 10,
        title: 'Standard Indefinite Power Integral',
        formula_latex: '\\int x^{n}\\,dx = \\frac{x^{n+1}}{n + 1} + C \\quad (n \\neq -1), \\qquad \\int \\frac{1}{x}\\,dx = \\ln|x| + C',
        plain_text: 'integral(x^n dx) = x^(n+1)/(n+1) + C',
        note: 'Antiderivative power rule with constant of integration C.',
      },
      {
        formula_no: 11,
        title: 'Integration by Parts',
        formula_latex: '\\int u\\,dv = uv - \\int v\\,du',
        plain_text: 'integral(u dv) = u*v - integral(v du)',
        note: 'Choose u using the ILATE priority order (Inverse, Log, Algebraic, Trig, Exponential).',
      },
      {
        formula_no: 12,
        title: 'Fundamental Theorem of Calculus',
        formula_latex: '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a) \\quad \\text{where } F^{\\prime}(x) = f(x)',
        plain_text: 'integral_a^b f(x) dx = F(b) - F(a)',
        note: 'Evaluates definite integrals using any antiderivative F(x).',
      },
    ],
  },

  // =========================================================================
  // 6. PHYSICS — Chapter 2: Kinematics (15 formulas)
  // =========================================================================
  {
    id: 'chap_phy_kinematics',
    category_id: 'cat_physics',
    chapter_no: 2,
    title: 'Kinematics',
    slug: 'kinematics',
    subtopics: 'Equations of Motion · Free Fall · Projectile Motion · Relative & Circular Velocity',
    sort_order: 1,
    formulas: [
      {
        formula_no: 1,
        title: 'Average Velocity & Average Speed',
        formula_latex: '\\vec{v}_{\\text{avg}} = \\frac{\\Delta \\vec{r}}{\\Delta t}, \\qquad v_{\\text{avg}} = \\frac{\\text{Total Distance}}{\\text{Total Time}}',
        plain_text: 'v_avg = Delta_r / Delta_t',
        note: 'Average velocity is vector displacement over time; average speed is scalar path length over time.',
      },
      {
        formula_no: 2,
        title: 'Harmonic Average Speed for Equal Distances',
        formula_latex: 'v_{\\text{avg}} = \\frac{2v_{1}v_{2}}{v_{1} + v_{2}}',
        plain_text: 'v_avg = (2 * v1 * v2) / (v1 + v2)',
        note: 'Applies when a body covers two equal distances at speeds v1 and v2.',
      },
      {
        formula_no: 3,
        title: 'Instantaneous Velocity and Acceleration',
        formula_latex: 'v = \\frac{dx}{dt}, \\qquad a = \\frac{dv}{dt} = \\frac{d^{2}x}{dt^{2}} = v\\frac{dv}{dx}',
        plain_text: 'v = dx/dt; a = dv/dt = v*(dv/dx)',
        note: 'v(dv/dx) is essential when acceleration is given as a function of position x.',
      },
      {
        formula_no: 4,
        title: 'First Equation of Uniformly Accelerated Motion',
        formula_latex: 'v = u + at',
        plain_text: 'v = u + a*t',
        note: 'Relates initial velocity u, final velocity v, constant acceleration a, and time t.',
      },
      {
        formula_no: 5,
        title: 'Second Equation of Uniformly Accelerated Motion',
        formula_latex: 's = ut + \\frac{1}{2}at^{2} = \\left(\\frac{u + v}{2}\\right)t',
        plain_text: 's = u*t + 0.5*a*t^2 = ((u + v)/2)*t',
        note: 'Gives displacement s under constant acceleration a over time interval t.',
      },
      {
        formula_no: 6,
        title: 'Third Equation of Uniformly Accelerated Motion',
        formula_latex: 'v^{2} - u^{2} = 2as',
        plain_text: 'v^2 - u^2 = 2*a*s',
        note: 'Time-independent kinematic relation connecting velocities, acceleration, and displacement.',
      },
      {
        formula_no: 7,
        title: 'Displacement in the nth Second',
        formula_latex: 's_{n} = u + \\frac{a}{2}(2n - 1)',
        plain_text: 's_n = u + (a/2)*(2n - 1)',
        note: 'Distance traveled specifically during the nth second (between t = n - 1 and t = n).',
      },
      {
        formula_no: 8,
        title: 'Stopping Distance Under Constant Braking',
        formula_latex: 'd_{\\text{stop}} = \\frac{u^{2}}{2a} \\implies d_{\\text{stop}} \\propto u^{2}',
        plain_text: 'd_stop = u^2 / (2*a)',
        note: 'Doubling initial speed u quadruples the minimum stopping distance for fixed deceleration a.',
      },
      {
        formula_no: 9,
        title: 'Free-Fall Time and Impact Velocity from Height h',
        formula_latex: 't = \\sqrt{\\frac{2h}{g}}, \\qquad v = \\sqrt{2gh}',
        plain_text: 't = sqrt(2h/g), v = sqrt(2gh)',
        note: 'For an object released from rest (u = 0) under uniform gravity g neglecting air drag.',
      },
      {
        formula_no: 10,
        title: 'Projectile Time of Flight',
        formula_latex: 'T = \\frac{2u\\sin\\theta}{g}',
        plain_text: 'T = (2 * u * sin(theta)) / g',
        note: 'Total time for level-ground projectile launched at speed u and angle theta above horizontal.',
      },
      {
        formula_no: 11,
        title: 'Projectile Maximum Height',
        formula_latex: 'H_{\\max} = \\frac{u^{2}\\sin^{2}\\theta}{2g}',
        plain_text: 'H_max = (u^2 * sin^2(theta)) / (2*g)',
        note: 'Peak vertical altitude reached when vertical velocity component v_y becomes zero.',
      },
      {
        formula_no: 12,
        title: 'Projectile Horizontal Range',
        formula_latex: 'R = \\frac{u^{2}\\sin(2\\theta)}{g}, \\qquad R_{\\max} = \\frac{u^{2}}{g} \\;(\\text{at } \\theta = 45^{\\circ})',
        plain_text: 'R = (u^2 * sin(2*theta)) / g',
        note: 'Complementary launch angles theta and (90 deg - theta) yield the exact same horizontal range.',
      },
      {
        formula_no: 13,
        title: 'Projectile Trajectory Equation & R-H Relation',
        formula_latex: 'y = x\\tan\\theta - \\frac{gx^{2}}{2u^{2}\\cos^{2}\\theta}, \\qquad R\\tan\\theta = 4H_{\\max}',
        plain_text: 'y = x*tan(theta) - (g*x^2)/(2*u^2*cos^2(theta)); R*tan(theta) = 4*H_max',
        note: 'Parabola equation of projectile path and direct ratio between range R and maximum height H_max.',
      },
      {
        formula_no: 14,
        title: 'Relative Velocity in One & Two Dimensions',
        formula_latex: '\\vec{v}_{AB} = \\vec{v}_{A} - \\vec{v}_{B}',
        plain_text: 'v_AB = v_A - v_B',
        note: 'Velocity of object A as observed from the reference frame of moving object B.',
      },
      {
        formula_no: 15,
        title: 'Uniform Circular Motion & Centripetal Acceleration',
        formula_latex: 'v = \\omega r, \\qquad a_{c} = \\frac{v^{2}}{r} = \\omega^{2}r = \\frac{4\\pi^{2}r}{T^{2}}',
        plain_text: 'v = omega*r, a_c = v^2/r = omega^2*r',
        note: 'Centripetal acceleration is always directed radially inward toward the center of the circle.',
      },
    ],
  },

  // =========================================================================
  // 7. PHYSICS — Chapter 12: Electricity (15 formulas)
  // =========================================================================
  {
    id: 'chap_phy_electricity',
    category_id: 'cat_physics',
    chapter_no: 12,
    title: 'Electricity',
    slug: 'electricity',
    subtopics: 'Coulomb Law · Electric Field & Potential · Capacitance · Ohm Law & Kirchhoff Circuits',
    sort_order: 2,
    formulas: [
      {
        formula_no: 1,
        title: 'Quantization of Electric Charge',
        formula_latex: 'Q = ne \\quad \\left(e = 1.602 \\times 10^{-19}\\text{ C}\\right)',
        plain_text: 'Q = n * e',
        note: 'Any observable charge Q is an integral multiple n of elementary charge e.',
      },
      {
        formula_no: 2,
        title: 'Coulomb’s Law of Electrostatic Force',
        formula_latex: 'F = \\frac{1}{4\\pi\\varepsilon_{0}}\\frac{|q_{1}q_{2}|}{r^{2}} = k_{e}\\frac{|q_{1}q_{2}|}{r^{2}}',
        plain_text: 'F = k_e * |q1 * q2| / r^2',
        note: 'In vacuum, k_e = 8.99 x 10^9 N*m^2/C^2. In a dielectric medium of relative permittivity epsilon_r, F_med = F_vac / epsilon_r.',
      },
      {
        formula_no: 3,
        title: 'Electric Field Intensity',
        formula_latex: '\\vec{E} = \\frac{\\vec{F}}{q_{0}}, \\qquad E = \\frac{k_{e}|Q|}{r^{2}} = -\\frac{dV}{dr}',
        plain_text: 'E = F / q_0 = k_e * |Q| / r^2 = -dV/dr',
        note: 'Electric field points in the direction of steepest decrease of electric potential V.',
      },
      {
        formula_no: 4,
        title: 'Gauss’s Law for Electric Flux',
        formula_latex: '\\Phi_{E} = \\oint \\vec{E}\\cdot d\\vec{A} = \\frac{Q_{\\text{enclosed}}}{\\varepsilon_{0}}',
        plain_text: 'Phi_E = Q_enclosed / epsilon_0',
        note: 'Total electric flux through any closed surface depends only on the net enclosed charge.',
      },
      {
        formula_no: 5,
        title: 'Electric Potential & Potential Energy',
        formula_latex: 'V = \\frac{k_{e}Q}{r}, \\qquad U = \\frac{k_{e}q_{1}q_{2}}{r} = q\\Delta V',
        plain_text: 'V = k_e * Q / r; U = k_e * q1 * q2 / r = q * Delta_V',
        note: 'Work done in moving charge q across potential difference Delta_V is W = q * Delta_V.',
      },
      {
        formula_no: 6,
        title: 'Parallel-Plate Capacitance',
        formula_latex: 'C = \\frac{Q}{V} = \\frac{\\varepsilon_{0}\\varepsilon_{r}A}{d}',
        plain_text: 'C = Q / V = (epsilon_0 * epsilon_r * A) / d',
        note: 'Capacitance increases with plate area A and dielectric constant epsilon_r, and decreases with separation d.',
      },
      {
        formula_no: 7,
        title: 'Energy Stored in a Capacitor',
        formula_latex: 'U = \\frac{1}{2}CV^{2} = \\frac{Q^{2}}{2C} = \\frac{1}{2}QV, \\qquad u_{E} = \\frac{1}{2}\\varepsilon_{0}E^{2}',
        plain_text: 'U = 0.5*C*V^2 = Q^2/(2*C) = 0.5*Q*V',
        note: 'u_E gives the electrostatic energy density (energy per unit volume) in electric field E.',
      },
      {
        formula_no: 8,
        title: 'Equivalent Capacitance (Series vs Parallel)',
        formula_latex: 'C_{\\text{parallel}} = \\sum_{i} C_{i}, \\qquad \\frac{1}{C_{\\text{series}}} = \\sum_{i} \\frac{1}{C_{i}}',
        plain_text: 'C_parallel = C1 + C2 + ...; 1/C_series = 1/C1 + 1/C2 + ...',
        note: 'Capacitors in parallel add directly; capacitors in series combine via reciprocals.',
      },
      {
        formula_no: 9,
        title: 'Electric Current and Drift Velocity',
        formula_latex: 'I = \\frac{\\Delta Q}{\\Delta t} = nAve_{d}',
        plain_text: 'I = Delta_Q / Delta_t = n * A * e * v_d',
        note: 'n is free carrier density, A is cross-sectional area, e is carrier charge, and v_d is drift speed.',
      },
      {
        formula_no: 10,
        title: 'Ohm’s Law & Electrical Resistivity',
        formula_latex: 'V = IR, \\qquad R = \\rho\\frac{L}{A}, \\qquad R(T) = R_{0}\\bigl[1 + \\alpha(T - T_{0})\\bigr]',
        plain_text: 'V = I*R; R = rho * (L / A)',
        note: 'If a wire is stretched to n times its original length at constant volume, its new resistance is n^2 * R.',
      },
      {
        formula_no: 11,
        title: 'Equivalent Resistance (Series & Parallel)',
        formula_latex: 'R_{\\text{series}} = \\sum_{i} R_{i}, \\qquad \\frac{1}{R_{\\text{parallel}}} = \\sum_{i} \\frac{1}{R_{i}}',
        plain_text: 'R_series = R1 + R2 + ...; 1/R_parallel = 1/R1 + 1/R2 + ...',
        note: 'For two resistors in parallel, R_eq = (R1 * R2) / (R1 + R2).',
      },
      {
        formula_no: 12,
        title: 'Terminal Potential Difference & Internal Resistance',
        formula_latex: 'V_{T} = \\mathcal{E} - Ir, \\qquad I = \\frac{\\mathcal{E}}{R + r}',
        plain_text: 'V_T = E - I*r; I = E / (R + r)',
        note: 'Maximum power is delivered to load R when load resistance matches internal resistance (R = r).',
      },
      {
        formula_no: 13,
        title: 'Electrical Power and Joule Heating',
        formula_latex: 'P = VI = I^{2}R = \\frac{V^{2}}{R}, \\qquad H = I^{2}Rt',
        plain_text: 'P = V*I = I^2*R = V^2/R; H = I^2*R*t',
        note: 'Use P = I^2*R to compare series loads (same I) and P = V^2/R to compare parallel loads (same V).',
      },
      {
        formula_no: 14,
        title: 'Kirchhoff’s Circuit Laws & Wheatstone Bridge',
        formula_latex: '\\sum I_{\\text{in}} = \\sum I_{\\text{out}}, \\qquad \\sum \\Delta V_{\\text{loop}} = 0, \\qquad \\frac{R_{1}}{R_{2}} = \\frac{R_{3}}{R_{4}}',
        plain_text: 'Sum(I_in) = Sum(I_out); Sum(Delta_V) = 0; R1/R2 = R3/R4',
        note: 'KCL expresses conservation of charge; KVL expresses conservation of energy; R1/R2 = R3/R4 balances a bridge.',
      },
      {
        formula_no: 15,
        title: 'RC Circuit Charging & Time Constant',
        formula_latex: 'q(t) = Q_{0}\\left(1 - e^{-t/\\tau}\\right), \\qquad \\tau = RC',
        plain_text: 'q(t) = Q_0 * (1 - e^(-t / (R*C))), tau = R*C',
        note: 'After one time constant t = RC, a charging capacitor reaches 63.2% of its maximum charge Q_0.',
      },
    ],
  },

  // =========================================================================
  // 8. CHEMISTRY — Chapter 4: Gas laws (14 formulas)
  // =========================================================================
  {
    id: 'chap_chem_gas-laws',
    category_id: 'cat_chemistry',
    chapter_no: 4,
    title: 'Gas laws',
    slug: 'gas-laws',
    subtopics: 'Boyle, Charles & Avogadro Laws · Ideal Gas Equation · Dalton Partial Pressures · Kinetic Theory',
    sort_order: 1,
    formulas: [
      {
        formula_no: 1,
        title: 'Boyle’s Law (Isothermal Process)',
        formula_latex: 'P_{1}V_{1} = P_{2}V_{2} = k \\quad (\\text{constant } T, n)',
        plain_text: 'P1 * V1 = P2 * V2 = constant (at constant T, n)',
        note: 'Pressure of a fixed mass of ideal gas is inversely proportional to its volume at constant temperature.',
      },
      {
        formula_no: 2,
        title: 'Charles’s Law (Isobaric Process)',
        formula_latex: '\\frac{V_{1}}{T_{1}} = \\frac{V_{2}}{T_{2}} = k \\quad (\\text{constant } P, n)',
        plain_text: 'V1 / T1 = V2 / T2 (at constant P, n)',
        note: 'Temperature T must be in absolute Kelvin: T(K) = T(deg C) + 273.15.',
      },
      {
        formula_no: 3,
        title: 'Gay-Lussac’s / Amontons’s Pressure-Temperature Law',
        formula_latex: '\\frac{P_{1}}{T_{1}} = \\frac{P_{2}}{T_{2}} = k \\quad (\\text{constant } V, n)',
        plain_text: 'P1 / T1 = P2 / T2 (at constant V, n)',
        note: 'At constant volume, gas pressure varies directly with absolute temperature T in Kelvin.',
      },
      {
        formula_no: 4,
        title: 'Avogadro’s Law (Molar Volume)',
        formula_latex: '\\frac{V_{1}}{n_{1}} = \\frac{V_{2}}{n_{2}}, \\qquad V_{m,\\text{STP}} = 22.414\\text{ L mol}^{-1}',
        plain_text: 'V1 / n1 = V2 / n2; V_m at STP = 22.414 L/mol',
        note: 'Equal volumes of ideal gases at the same temperature and pressure contain equal numbers of moles.',
      },
      {
        formula_no: 5,
        title: 'Combined Gas Law',
        formula_latex: '\\frac{P_{1}V_{1}}{T_{1}} = \\frac{P_{2}V_{2}}{T_{2}} \\quad (\\text{fixed } n)',
        plain_text: '(P1 * V1) / T1 = (P2 * V2) / T2',
        note: 'Simultaneously relates pressure, volume, and Kelvin temperature for a fixed amount of gas.',
      },
      {
        formula_no: 6,
        title: 'Ideal Gas Equation',
        formula_latex: 'PV = nRT = \\frac{m}{M}RT',
        plain_text: 'P * V = n * R * T = (m / M) * R * T',
        note: 'R = 0.08206 L*atm/(mol*K) = 8.314 J/(mol*K). Ensure P and V units match the chosen R.',
      },
      {
        formula_no: 7,
        title: 'Gas Density and Molar Mass Relation',
        formula_latex: '\\rho = \\frac{PM}{RT} \\iff M = \\frac{\\rho RT}{P}',
        plain_text: 'density = (P * M) / (R * T); M = (density * R * T) / P',
        note: 'Gas density is directly proportional to pressure and molar mass, and inversely proportional to Kelvin temperature.',
      },
      {
        formula_no: 8,
        title: 'Dalton’s Law of Partial Pressures',
        formula_latex: 'P_{\\text{total}} = \\sum_{i} P_{i}, \\qquad P_{i} = X_{i}\\,P_{\\text{total}}',
        plain_text: 'P_total = P1 + P2 + ...; P_i = X_i * P_total',
        note: 'X_i = n_i / n_total is the mole fraction of non-reacting gas component i.',
      },
      {
        formula_no: 9,
        title: 'Graham’s Law of Effusion and Diffusion',
        formula_latex: '\\frac{r_{1}}{r_{2}} = \\sqrt{\\frac{M_{2}}{M_{1}}} = \\sqrt{\\frac{\\rho_{2}}{\\rho_{1}}}',
        plain_text: 'r1 / r2 = sqrt(M2 / M1) = sqrt(density2 / density1)',
        note: 'Lighter gases diffuse and effuse faster: rate r is inversely proportional to square root of molar mass M.',
      },
      {
        formula_no: 10,
        title: 'Kinetic Gas Equation & Average Kinetic Energy',
        formula_latex: 'PV = \\frac{1}{3}Nm\\overline{c^{2}}, \\qquad E_{k,\\text{mol}} = \\frac{3}{2}RT, \\qquad E_{k,\\text{molecule}} = \\frac{3}{2}k_{B}T',
        plain_text: 'PV = (1/3)*N*m*c_rms^2; E_k_mol = (3/2)*R*T',
        note: 'Average translational kinetic energy depends solely on absolute temperature T, independent of gas identity.',
      },
      {
        formula_no: 11,
        title: 'Root-Mean-Square (RMS) Molecular Speed',
        formula_latex: 'u_{\\text{rms}} = \\sqrt{\\frac{3RT}{M}} = \\sqrt{\\frac{3P}{\\rho}}',
        plain_text: 'u_rms = sqrt(3 * R * T / M)',
        note: 'M must be in kg/mol (e.g. 0.032 kg/mol for O2) when using R = 8.314 J/(mol*K).',
      },
      {
        formula_no: 12,
        title: 'Most Probable and Average Molecular Speeds',
        formula_latex: 'u_{\\text{mp}} = \\sqrt{\\frac{2RT}{M}}, \\qquad u_{\\text{avg}} = \\sqrt{\\frac{8RT}{\\pi M}}, \\qquad u_{\\text{mp}} : u_{\\text{avg}} : u_{\\text{rms}} = 1 : 1.128 : 1.225',
        plain_text: 'u_mp = sqrt(2RT/M), u_avg = sqrt(8RT/(pi*M))',
        note: 'For any gas at temperature T, u_mp < u_avg < u_rms.',
      },
      {
        formula_no: 13,
        title: 'Compressibility Factor (Z)',
        formula_latex: 'Z = \\frac{PV}{nRT} = \\frac{V_{\\text{real}}}{V_{\\text{ideal}}}',
        plain_text: 'Z = (P * V) / (n * R * T)',
        note: 'Z = 1 for an ideal gas; Z < 1 indicates dominant attractive forces; Z > 1 indicates dominant repulsive forces.',
      },
      {
        formula_no: 14,
        title: 'Van der Waals Equation for Real Gases',
        formula_latex: '\\left(P + \\frac{an^{2}}{V^{2}}\\right)(V - nb) = nRT',
        plain_text: '(P + a*n^2 / V^2) * (V - n*b) = n * R * T',
        note: 'Parameter a corrects for intermolecular attractions; parameter b corrects for finite molecular volume.',
      },
    ],
  },

  // =========================================================================
  // 9. COMPUTER SCIENCE — Chapter 3: Algorithm complexity (14 formulas)
  // =========================================================================
  {
    id: 'chap_cs_algorithm-complexity',
    category_id: 'cat_computer-science',
    chapter_no: 3,
    title: 'Algorithm complexity',
    slug: 'algorithm-complexity',
    subtopics: 'Asymptotic Big-O, Omega & Theta · Master Theorem · Sorting & Graph Time Bounds',
    sort_order: 1,
    formulas: [
      {
        formula_no: 1,
        title: 'Big-O Upper Bound Definition',
        formula_latex: 'f(n) \\in O(g(n)) \\iff \\exists\\, c > 0,\\, n_{0} > 0 \\text{ s.t. } 0 \\le f(n) \\le c\\,g(n) \\;\\forall n \\ge n_{0}',
        plain_text: 'f(n) in O(g(n)) iff 0 <= f(n) <= c*g(n) for all n >= n_0',
        note: 'Characterizes the asymptotic worst-case upper bound of an algorithm’s running time or space.',
      },
      {
        formula_no: 2,
        title: 'Big-Omega Lower Bound & Big-Theta Tight Bound',
        formula_latex: 'f(n) \\in \\Theta(g(n)) \\iff c_{1}g(n) \\le f(n) \\le c_{2}g(n) \\;\\forall n \\ge n_{0}',
        plain_text: 'f(n) in Theta(g(n)) iff f(n) in O(g(n)) and f(n) in Omega(g(n))',
        note: 'Big-Theta bounds the growth rate tightly from both above and below.',
      },
      {
        formula_no: 3,
        title: 'Asymptotic Dominance Hierarchy',
        formula_latex: 'O(1) \\prec O(\\log n) \\prec O(\\sqrt{n}) \\prec O(n) \\prec O(n\\log n) \\prec O(n^{2}) \\prec O(2^{n}) \\prec O(n!)',
        plain_text: 'O(1) < O(log n) < O(sqrt(n)) < O(n) < O(n log n) < O(n^2) < O(2^n) < O(n!)',
        note: 'Standard hierarchy of growth rates from constant time to factorial time.',
      },
      {
        formula_no: 4,
        title: 'Master Theorem for Divide-and-Conquer Recurrences',
        formula_latex: 'T(n) = aT\\!\\left(\\frac{n}{b}\\right) + f(n), \\qquad c_{\\text{crit}} = \\log_{b}(a)',
        plain_text: 'T(n) = a * T(n/b) + f(n), critical exponent c_crit = log_b(a)',
        note: 'Compares work at leaves n^(log_b a) against work per level f(n) for a >= 1, b > 1.',
      },
      {
        formula_no: 5,
        title: 'Master Theorem Cases 1, 2, and 3',
        formula_latex: 'T(n) = \\begin{cases} \\Theta(n^{\\log_{b}a}) & \\text{if } f(n) = O(n^{\\log_{b}a - \\varepsilon}) \\\\ \\Theta(n^{\\log_{b}a}\\log n) & \\text{if } f(n) = \\Theta(n^{\\log_{b}a}) \\\\ \\Theta(f(n)) & \\text{if } f(n) = \\Omega(n^{\\log_{b}a + \\varepsilon}) \\end{cases}',
        plain_text: 'Case 1: Theta(n^(log_b a)); Case 2: Theta(n^(log_b a) log n); Case 3: Theta(f(n))',
        note: 'Determines closed-form complexity of divide-and-conquer recurrences.',
      },
      {
        formula_no: 6,
        title: 'Binary Search Recurrence & Complexity',
        formula_latex: 'T(n) = T\\!\\left(\\frac{n}{2}\\right) + O(1) \\implies T(n) = \\Theta(\\log_{2} n)',
        plain_text: 'T(n) = T(n/2) + O(1) => Theta(log n)',
        note: 'Halving the search space on each comparison requires at most floor(log2 n) + 1 comparisons.',
      },
      {
        formula_no: 7,
        title: 'Merge Sort & Heap Sort Complexity',
        formula_latex: 'T(n) = 2T\\!\\left(\\frac{n}{2}\\right) + \\Theta(n) \\implies T(n) = \\Theta(n\\log n)',
        plain_text: 'T(n) = 2*T(n/2) + Theta(n) => Theta(n log n)',
        note: 'Guarantees O(n log n) time in best, average, and worst cases.',
      },
      {
        formula_no: 8,
        title: 'Information-Theoretic Comparison Sort Lower Bound',
        formula_latex: '\\log_{2}(n!) = \\Theta(n\\log n)',
        plain_text: 'log2(n!) = Theta(n log n)',
        note: 'Any comparison-based sorting algorithm requires Omega(n log n) comparisons in the worst case.',
      },
      {
        formula_no: 9,
        title: 'Nested Triangular Loop Complexity',
        formula_latex: '\\sum_{i=1}^{n} \\sum_{j=1}^{i} 1 = \\frac{n(n + 1)}{2} = \\Theta(n^{2})',
        plain_text: '1 + 2 + ... + n = n*(n + 1)/2 = Theta(n^2)',
        note: 'Worst-case comparison count for Bubble Sort, Insertion Sort, and Selection Sort.',
      },
      {
        formula_no: 10,
        title: 'Geometric Halving Loop (Linear Build-Heap)',
        formula_latex: '\\sum_{k=0}^{\\lfloor\\log_{2}n\\rfloor} \\frac{n}{2^{k}} < 2n = \\Theta(n)',
        plain_text: 'n + n/2 + n/4 + ... = 2n = Theta(n)',
        note: 'Explains why bottom-up Floyd Heapify builds a binary heap in O(n) linear time.',
      },
      {
        formula_no: 11,
        title: 'Harmonic Series (Sieve & Bucket Complexity)',
        formula_latex: 'H_{n} = \\sum_{k=1}^{n} \\frac{1}{k} = \\ln(n) + \\gamma + O\\!\\left(\\frac{1}{n}\\right) = \\Theta(\\log n)',
        plain_text: '1 + 1/2 + 1/3 + ... + 1/n = Theta(log n)',
        note: 'A loop stepping by i += k for k = 1..n executes n * H_n = Theta(n log n) total iterations.',
      },
      {
        formula_no: 12,
        title: 'Breadth-First & Depth-First Graph Traversal',
        formula_latex: 'T_{\\text{BFS/DFS}} = \\Theta(|V| + |E|), \\qquad S_{\\text{BFS/DFS}} = \\Theta(|V|)',
        plain_text: 'Time = Theta(|V| + |E|), Space = Theta(|V|)',
        note: 'Using an adjacency list representation with |V| vertices and |E| edges.',
      },
      {
        formula_no: 13,
        title: 'Dijkstra’s Shortest Path (Binary Min-Heap)',
        formula_latex: 'T_{\\text{Dijkstra}} = O\\bigl((|V| + |E|)\\log |V|\\bigr)',
        plain_text: 'T_Dijkstra = O((|V| + |E|) log |V|)',
        note: 'Applies to graphs with non-negative edge weights using a binary priority queue.',
      },
      {
        formula_no: 14,
        title: 'Amortized Cost per Operation',
        formula_latex: 'c_{\\text{amortized}} = \\frac{1}{m}\\sum_{i=1}^{m} c_{i} = O(1) \\quad (\\text{Dynamic Array Push})',
        plain_text: 'Amortized Cost = (Sum of m operations) / m',
        note: 'Doubling dynamic array capacity on overflow gives O(1) amortized insertion cost.',
      },
    ],
  },

  // =========================================================================
  // 10. STATISTICS — Chapter 2: Probability & Distributions (12 formulas)
  // =========================================================================
  {
    id: 'chap_stat_probability',
    category_id: 'cat_statistics',
    chapter_no: 2,
    title: 'Probability & Distributions',
    slug: 'probability-and-distributions',
    subtopics: 'Mean & Variance · Addition & Bayes Rules · Binomial, Poisson & Normal Distributions',
    sort_order: 1,
    formulas: [
      {
        formula_no: 1,
        title: 'Arithmetic Mean & Weighted Mean',
        formula_latex: '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_{i}, \\qquad \\bar{x}_{w} = \\frac{\\sum w_{i}x_{i}}{\\sum w_{i}}',
        plain_text: 'x_bar = (1/n) * sum(x_i)',
        note: 'Measures central tendency of sample observations.',
      },
      {
        formula_no: 2,
        title: 'Population Variance & Standard Deviation',
        formula_latex: '\\sigma^{2} = \\frac{1}{N}\\sum_{i=1}^{N}(x_{i} - \\mu)^{2} = \\overline{x^{2}} - \\mu^{2}, \\qquad \\sigma = \\sqrt{\\sigma^{2}}',
        plain_text: 'sigma^2 = E[X^2] - (E[X])^2',
        note: 'For sample variance s^2, divide by (n - 1) instead of N (Bessel’s correction).',
      },
      {
        formula_no: 3,
        title: 'Permutations and Combinations',
        formula_latex: '{}^{n}P_{r} = \\frac{n!}{(n - r)!}, \\qquad \\binom{n}{r} = \\frac{n!}{r!(n - r)!}',
        plain_text: 'nPr = n! / (n - r)!; nCr = n! / (r! * (n - r)!)',
        note: 'Permutations count ordered arrangements; combinations count unordered selections.',
      },
      {
        formula_no: 4,
        title: 'Addition Rule of Probability',
        formula_latex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)',
        plain_text: 'P(A or B) = P(A) + P(B) - P(A and B)',
        note: 'For mutually exclusive events, P(A and B) = 0.',
      },
      {
        formula_no: 5,
        title: 'Conditional Probability & Independence',
        formula_latex: 'P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}; \\qquad A \\perp B \\iff P(A \\cap B) = P(A)P(B)',
        plain_text: 'P(A | B) = P(A and B) / P(B)',
        note: 'Defines probability of event A given that event B has occurred (with P(B) > 0).',
      },
      {
        formula_no: 6,
        title: 'Bayes’ Theorem',
        formula_latex: 'P(A_{i} \\mid B) = \\frac{P(B \\mid A_{i})P(A_{i})}{\\sum_{j} P(B \\mid A_{j})P(A_{j})}',
        plain_text: 'P(A_i | B) = P(B | A_i)*P(A_i) / P(B)',
        note: 'Updates prior probabilities P(A_i) into posterior probabilities after observing evidence B.',
      },
      {
        formula_no: 7,
        title: 'Expected Value and Variance of Random Variable',
        formula_latex: 'E[X] = \\sum x_{i}P(x_{i}), \\qquad \\operatorname{Var}(aX + b) = a^{2}\\operatorname{Var}(X)',
        plain_text: 'E[X] = sum(x_i * P(x_i)); Var(aX + b) = a^2 * Var(X)',
        note: 'Adding a constant b shifts the mean by b but leaves variance unchanged.',
      },
      {
        formula_no: 8,
        title: 'Binomial Distribution PMF, Mean & Variance',
        formula_latex: 'P(X = k) = \\binom{n}{k}p^{k}(1 - p)^{n - k}, \\qquad \\mu = np, \\qquad \\sigma^{2} = np(1 - p)',
        plain_text: 'P(X = k) = nCk * p^k * (1 - p)^(n - k); mean = np, var = np(1 - p)',
        note: 'Models k successes in n independent Bernoulli trials with success probability p.',
      },
      {
        formula_no: 9,
        title: 'Poisson Distribution PMF',
        formula_latex: 'P(X = k) = \\frac{\\lambda^{k}e^{-\\lambda}}{k!}, \\qquad \\mu = \\sigma^{2} = \\lambda',
        plain_text: 'P(X = k) = (lambda^k * e^(-lambda)) / k!',
        note: 'Mean and variance of a Poisson distribution are both equal to rate parameter lambda.',
      },
      {
        formula_no: 10,
        title: 'Standard Normal Z-Score',
        formula_latex: 'Z = \\frac{X - \\mu}{\\sigma}, \\qquad f(z) = \\frac{1}{\\sqrt{2\\pi}}e^{-z^{2}/2}',
        plain_text: 'Z = (X - mu) / sigma',
        note: 'Measures how many standard deviations an observation X lies from population mean mu.',
      },
      {
        formula_no: 11,
        title: 'Standard Error of the Sample Mean',
        formula_latex: '\\sigma_{\\bar{x}} = \\frac{\\sigma}{\\sqrt{n}}',
        plain_text: 'SE = sigma / sqrt(n)',
        note: 'By the Central Limit Theorem, sample mean distribution approaches N(mu, sigma^2 / n).',
      },
      {
        formula_no: 12,
        title: 'Pearson Correlation Coefficient',
        formula_latex: 'r = \\frac{\\operatorname{Cov}(X, Y)}{\\sigma_{X}\\sigma_{Y}} \\in [-1, 1]',
        plain_text: 'r = Cov(X, Y) / (sigma_X * sigma_Y)',
        note: 'Measures strength and direction of linear association between variables X and Y.',
      },
    ],
  },

  // =========================================================================
  // 11. BIOLOGY — Chapter 6: Genetics & Cellular Energetics (10 formulas)
  // =========================================================================
  {
    id: 'chap_bio_genetics-energetics',
    category_id: 'cat_biology',
    chapter_no: 6,
    title: 'Genetics & Cellular Energetics',
    slug: 'genetics-and-cellular-energetics',
    subtopics: 'Hardy-Weinberg Equilibrium · Water Potential · Michaelis-Menten Kinetics · Gamete Combinations',
    sort_order: 1,
    formulas: [
      {
        formula_no: 1,
        title: 'Hardy-Weinberg Allele & Genotype Frequencies',
        formula_latex: 'p + q = 1, \\qquad p^{2} + 2pq + q^{2} = 1',
        plain_text: 'p + q = 1; p^2 + 2pq + q^2 = 1',
        note: 'p^2 = homozygous dominant (AA), 2pq = heterozygous carriers (Aa), q^2 = homozygous recessive (aa).',
      },
      {
        formula_no: 2,
        title: 'Distinct Gametes & Genotypes from Heterozygote',
        formula_latex: '\\text{Gametes} = 2^{n}, \\qquad \\text{Genotypes} = 3^{n}, \\qquad \\text{Phenotypes} = 2^{n}',
        plain_text: 'Gametes = 2^n, Genotypes = 3^n, Phenotypes = 2^n',
        note: 'Where n is the number of heterozygous gene loci assorting independently.',
      },
      {
        formula_no: 3,
        title: 'Genetic Recombination Frequency (Map Units)',
        formula_latex: '\\text{RF (\\%)} = \\left(\\frac{\\text{Recombinant Offspring}}{\\text{Total Offspring}}\\right) \\times 100\\%',
        plain_text: 'RF (%) = (Recombinant Offspring / Total Offspring) * 100%',
        note: '1% recombination frequency corresponds to 1 centiMorgan (cM) genetic map distance.',
      },
      {
        formula_no: 4,
        title: 'Chi-Square Goodness-of-Fit Test in Genetics',
        formula_latex: '\\chi^{2} = \\sum \\frac{(O - E)^{2}}{E}',
        plain_text: 'chi^2 = sum((Observed - Expected)^2 / Expected)',
        note: 'Degrees of freedom df = (number of phenotypic classes - 1).',
      },
      {
        formula_no: 5,
        title: 'Plant Cell Water Potential',
        formula_latex: '\\Psi_{w} = \\Psi_{s} + \\Psi_{p}, \\qquad \\Psi_{s} = -iCRT',
        plain_text: 'Psi_w = Psi_s + Psi_p; Psi_s = -i*C*R*T',
        note: 'Water always moves passively from higher (less negative) to lower (more negative) water potential.',
      },
      {
        formula_no: 6,
        title: 'Michaelis-Menten Enzyme Kinetics',
        formula_latex: 'v_{0} = \\frac{V_{\\max}[S]}{K_{m} + [S]}',
        plain_text: 'v_0 = (V_max * [S]) / (K_m + [S])',
        note: 'K_m is the substrate concentration [S] at which reaction rate reaches exactly 0.5 * V_max.',
      },
      {
        formula_no: 7,
        title: 'Gibbs Free Energy in Bioenergetics',
        formula_latex: '\\Delta G = \\Delta H - T\\Delta S',
        plain_text: 'Delta_G = Delta_H - T * Delta_S',
        note: 'Delta_G < 0 indicates an exergonic (spontaneous) metabolic reaction such as ATP hydrolysis.',
      },
      {
        formula_no: 8,
        title: 'Aerobic Cellular Respiration Overall Stoichiometry',
        formula_latex: '\\ce{C6H12O6 + 6O2 -> 6CO2 + 6H2O + ATP}',
        plain_text: 'C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + 30-32 ATP',
        note: 'Complete oxidation of 1 mole of glucose yields ~30 to 32 ATP in eukaryotic cells.',
      },
      {
        formula_no: 9,
        title: 'Respiratory Quotient (RQ)',
        formula_latex: '\\text{RQ} = \\frac{\\text{Moles of } \\ce{CO2} \\text{ Eliminated}}{\\text{Moles of } \\ce{O2} \\text{ Consumed}}',
        plain_text: 'RQ = CO2 produced / O2 consumed',
        note: 'RQ = 1.0 for carbohydrates, ~0.7 for fats, and ~0.8–0.9 for proteins.',
      },
      {
        formula_no: 10,
        title: 'Logistic Population Growth Equation',
        formula_latex: '\\frac{dN}{dt} = r_{\\max}N\\left(\\frac{K - N}{K}\\right)',
        plain_text: 'dN/dt = r_max * N * ((K - N) / K)',
        note: 'Population growth rate is fastest when population size is half the carrying capacity (N = K/2).',
      },
    ],
  },

  // =========================================================================
  // 12. ECONOMICS & FINANCE — Chapter 4: Time Value of Money & Elasticity (12 formulas)
  // =========================================================================
  {
    id: 'chap_econ_finance-elasticity',
    category_id: 'cat_economics-and-finance',
    chapter_no: 4,
    title: 'Time Value of Money & Elasticity',
    slug: 'time-value-of-money-and-elasticity',
    subtopics: 'Compound Interest & NPV · Annuities · Price Elasticity · Keynesian Multiplier',
    sort_order: 1,
    formulas: [
      {
        formula_no: 1,
        title: 'Future Value with Discrete Compounding',
        formula_latex: '\\text{FV} = \\text{PV}\\left(1 + \\frac{r}{m}\\right)^{mt}',
        plain_text: 'FV = PV * (1 + r/m)^(m*t)',
        note: 'm is compounding frequency per year, r is nominal annual interest rate, and t is years.',
      },
      {
        formula_no: 2,
        title: 'Present Value & Discounting',
        formula_latex: '\\text{PV} = \\frac{\\text{FV}}{(1 + r)^{n}}',
        plain_text: 'PV = FV / (1 + r)^n',
        note: 'Discounts a future cash flow FV back n periods at discount rate r.',
      },
      {
        formula_no: 3,
        title: 'Effective Annual Rate (EAR)',
        formula_latex: '\\text{EAR} = \\left(1 + \\frac{r}{m}\\right)^{m} - 1',
        plain_text: 'EAR = (1 + r/m)^m - 1',
        note: 'Converts nominal annual percentage rate r compounded m times per year into effective annual yield.',
      },
      {
        formula_no: 4,
        title: 'Present Value of an Ordinary Annuity',
        formula_latex: '\\text{PV}_{\\text{annuity}} = C \\times \\frac{1 - (1 + r)^{-n}}{r}',
        plain_text: 'PV_annuity = C * (1 - (1 + r)^(-n)) / r',
        note: 'Present value of n equal end-of-period payments C at discount rate r.',
      },
      {
        formula_no: 5,
        title: 'Present Value of a Growing Perpetuity (Gordon Growth)',
        formula_latex: '\\text{PV} = \\frac{C_{1}}{r - g} \\quad (r > g)',
        plain_text: 'PV = C_1 / (r - g)',
        note: 'Values an infinite cash flow stream growing at constant rate g < r.',
      },
      {
        formula_no: 6,
        title: 'Net Present Value (NPV)',
        formula_latex: '\\text{NPV} = \\sum_{t=1}^{n} \\frac{\\text{CF}_{t}}{(1 + r)^{t}} - \\text{CF}_{0}',
        plain_text: 'NPV = sum(CF_t / (1 + r)^t) - CF_0',
        note: 'Accept investment projects with NPV > 0; IRR is the discount rate where NPV = 0.',
      },
      {
        formula_no: 7,
        title: 'Price Elasticity of Demand (PED)',
        formula_latex: 'E_{d} = \\frac{\\%\\Delta Q_{d}}{\\%\\Delta P} = \\frac{dQ}{dP}\\cdot\\frac{P}{Q}',
        plain_text: 'E_d = (% change in Q_d) / (% change in P) = (dQ/dP) * (P/Q)',
        note: '|E_d| > 1 is elastic; |E_d| < 1 is inelastic; |E_d| = 1 is unit elastic.',
      },
      {
        formula_no: 8,
        title: 'Midpoint (Arc) Elasticity Formula',
        formula_latex: 'E_{d} = \\frac{Q_{2} - Q_{1}}{(Q_{1} + Q_{2})/2} \\div \\frac{P_{2} - P_{1}}{(P_{1} + P_{2})/2}',
        plain_text: 'E_d = ((Q2 - Q1)/(Q1 + Q2)) / ((P2 - P1)/(P1 + P2))',
        note: 'Gives symmetric elasticity value regardless of whether price moves from P1 to P2 or P2 to P1.',
      },
      {
        formula_no: 9,
        title: 'Profit Maximization Condition',
        formula_latex: '\\text{MR} = \\text{MC}, \\qquad \\pi(Q) = \\text{TR}(Q) - \\text{TC}(Q)',
        plain_text: 'MR = MC; Profit = Total Revenue - Total Cost',
        note: 'Any firm maximizes economic profit at the output level where Marginal Revenue equals Marginal Cost.',
      },
      {
        formula_no: 10,
        title: 'Expenditure Approach to GDP',
        formula_latex: 'Y = C + I + G + (X - M)',
        plain_text: 'GDP (Y) = C + I + G + (X - M)',
        note: 'Sum of Consumption C, Investment I, Government Spending G, and Net Exports (X - M).',
      },
      {
        formula_no: 11,
        title: 'Keynesian Spending & Tax Multipliers',
        formula_latex: 'k_{G} = \\frac{1}{1 - \\text{MPC}} = \\frac{1}{\\text{MPS}}, \\qquad k_{T} = -\\frac{\\text{MPC}}{1 - \\text{MPC}}',
        plain_text: 'k_G = 1 / (1 - MPC) = 1 / MPS',
        note: 'MPC + MPS = 1 in a closed economy without income tax leakage.',
      },
      {
        formula_no: 12,
        title: 'Fisher Equation (Real vs Nominal Interest Rate)',
        formula_latex: '1 + i = (1 + r)(1 + \\pi) \\implies r \\approx i - \\pi',
        plain_text: '1 + i = (1 + r)*(1 + inflation); r approx i - inflation',
        note: 'Relates nominal interest rate i, real interest rate r, and inflation rate pi.',
      },
    ],
  },

  // =========================================================================
  // 13. ELECTRONICS & ENGINEERING — Chapter 5: AC Circuits & Op-Amps (12 formulas)
  // =========================================================================
  {
    id: 'chap_ee_ac-opamps',
    category_id: 'cat_electronics-and-engineering',
    chapter_no: 5,
    title: 'AC Circuits & Operational Amplifiers',
    slug: 'ac-circuits-and-operational-amplifiers',
    subtopics: 'Inductive & Capacitive Reactance · RLC Resonance · Op-Amp Gains · Decibels',
    sort_order: 1,
    formulas: [
      {
        formula_no: 1,
        title: 'RMS Voltage and Current for Sinusoidal AC',
        formula_latex: 'V_{\\text{rms}} = \\frac{V_{m}}{\\sqrt{2}} \\approx 0.707\\,V_{m}, \\qquad I_{\\text{rms}} = \\frac{I_{m}}{\\sqrt{2}}',
        plain_text: 'V_rms = V_m / sqrt(2) = 0.707 * V_m',
        note: 'Relates peak amplitude V_m to root-mean-square effective value V_rms for a pure sine wave.',
      },
      {
        formula_no: 2,
        title: 'Inductive and Capacitive Reactance',
        formula_latex: 'X_{L} = \\omega L = 2\\pi fL, \\qquad X_{C} = \\frac{1}{\\omega C} = \\frac{1}{2\\pi fC}',
        plain_text: 'X_L = 2*pi*f*L; X_C = 1 / (2*pi*f*C)',
        note: 'Inductive reactance rises linearly with frequency f; capacitive reactance falls inversely with f.',
      },
      {
        formula_no: 3,
        title: 'Series RLC Impedance & Phase Angle',
        formula_latex: 'Z = \\sqrt{R^{2} + (X_{L} - X_{C})^{2}}, \\qquad \\tan\\phi = \\frac{X_{L} - X_{C}}{R}',
        plain_text: 'Z = sqrt(R^2 + (X_L - X_C)^2); tan(phi) = (X_L - X_C) / R',
        note: 'Magnitude of total AC impedance Z and phase angle phi between voltage and current.',
      },
      {
        formula_no: 4,
        title: 'RLC Resonant Frequency',
        formula_latex: 'f_{0} = \\frac{1}{2\\pi\\sqrt{LC}}, \\qquad \\omega_{0} = \\frac{1}{\\sqrt{LC}}',
        plain_text: 'f_0 = 1 / (2 * pi * sqrt(L * C))',
        note: 'At resonance X_L = X_C, so impedance is purely resistive (Z = R) and power factor cos(phi) = 1.',
      },
      {
        formula_no: 5,
        title: 'Quality Factor (Q) & Bandwidth of Resonant Circuit',
        formula_latex: 'Q = \\frac{\\omega_{0}L}{R} = \\frac{1}{R}\\sqrt{\\frac{L}{C}} = \\frac{f_{0}}{\\text{BW}}',
        plain_text: 'Q = (1/R) * sqrt(L/C) = f_0 / BW',
        note: 'Higher Q factor yields a sharper resonance peak and narrower -3 dB bandwidth BW.',
      },
      {
        formula_no: 6,
        title: 'Real, Reactive, and Apparent AC Power',
        formula_latex: 'P = V_{\\text{rms}}I_{\\text{rms}}\\cos\\phi, \\qquad Q = V_{\\text{rms}}I_{\\text{rms}}\\sin\\phi, \\qquad S = V_{\\text{rms}}I_{\\text{rms}}',
        plain_text: 'P = V_rms * I_rms * cos(phi); S^2 = P^2 + Q^2',
        note: 'cos(phi) = R / Z is the power factor of the AC load.',
      },
      {
        formula_no: 7,
        title: 'Ideal Transformer Voltage & Current Ratios',
        formula_latex: '\\frac{V_{s}}{V_{p}} = \\frac{N_{s}}{N_{p}} = \\frac{I_{p}}{I_{s}}, \\qquad Z_{\\text{in}} = \\left(\\frac{N_{p}}{N_{s}}\\right)^{2}Z_{L}',
        plain_text: 'V_s / V_p = N_s / N_p = I_p / I_s',
        note: 'Reflected load impedance scales with the square of the primary-to-secondary turns ratio.',
      },
      {
        formula_no: 8,
        title: 'Inverting Operational Amplifier Closed-Loop Gain',
        formula_latex: 'A_{v} = \\frac{V_{\\text{out}}}{V_{\\text{in}}} = -\\frac{R_{f}}{R_{\\text{in}}}',
        plain_text: 'A_v = V_out / V_in = -R_f / R_in',
        note: 'Uses virtual ground at the inverting input with feedback resistor R_f.',
      },
      {
        formula_no: 9,
        title: 'Non-Inverting Operational Amplifier Closed-Loop Gain',
        formula_latex: 'A_{v} = \\frac{V_{\\text{out}}}{V_{\\text{in}}} = 1 + \\frac{R_{f}}{R_{g}}',
        plain_text: 'A_v = 1 + R_f / R_g',
        note: 'Provides high input impedance and non-inverted output with gain >= 1.',
      },
      {
        formula_no: 10,
        title: 'Decibel Power and Voltage Gain',
        formula_latex: 'G_{\\text{dB}} = 10\\log_{10}\\!\\left(\\frac{P_{2}}{P_{1}}\\right) = 20\\log_{10}\\!\\left(\\frac{V_{2}}{V_{1}}\\right)',
        plain_text: 'G_dB = 10*log10(P2/P1) = 20*log10(V2/V1)',
        note: 'At the half-power cutoff point (P2/P1 = 0.5, V2/V1 = 1/sqrt(2)), gain drops by -3.01 dB.',
      },
      {
        formula_no: 11,
        title: 'First-Order RC Filter Cutoff Frequency',
        formula_latex: 'f_{c} = \\frac{1}{2\\pi RC}',
        plain_text: 'f_c = 1 / (2 * pi * R * C)',
        note: '-3 dB corner frequency for first-order passive RC low-pass and high-pass filters.',
      },
      {
        formula_no: 12,
        title: 'De Morgan’s Laws for Digital Logic Gates',
        formula_latex: '\\overline{A \\cdot B} = \\overline{A} + \\overline{B}, \\qquad \\overline{A + B} = \\overline{A} \\cdot \\overline{B}',
        plain_text: 'NOT(A AND B) = (NOT A) OR (NOT B); NOT(A OR B) = (NOT A) AND (NOT B)',
        note: 'NAND and NOR gates are universal logic gates capable of implementing any Boolean function.',
      },
    ],
  },
];

export function buildFormulaSlug(raw: string): string {
  return (
    String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 72) || 'formula-item'
  );
}

export function buildFormulaSearchText(parts: Array<string | number | undefined | null>): string {
  return parts
    .filter((p) => p !== undefined && p !== null && String(p).trim().length > 0)
    .map((p) => String(p).trim().toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildInitialFormulaVaultSeed(): {
  categories: D1FormulaCategoryRow[];
  chapters: D1FormulaChapterRow[];
  formulas: D1FormulaRow[];
} {
  const chapters: D1FormulaChapterRow[] = [];
  const formulas: D1FormulaRow[] = [];

  for (const ch of RAW_SEED_CHAPTERS) {
    const chFormulas: D1FormulaRow[] = ch.formulas.map((f, idx) => {
      const fId = `form_${ch.id}_${f.formula_no}`;
      const searchText = `${ch.title} ${ch.subtopics} ${f.title} ${f.plain_text} ${f.note} ${f.formula_latex}`
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      return {
        id: fId,
        category_id: ch.category_id,
        chapter_id: ch.id,
        formula_no: f.formula_no,
        title: f.title,
        formula_latex: f.formula_latex,
        plain_text: f.plain_text,
        formula_plain: f.plain_text,
        note: f.note,
        status: 'live',
        sort_order: idx + 1,
        is_featured: f.formula_no <= 2 ? 1 : 0,
        is_render_valid: 1,
        render_error: '',
        search_text: searchText,
        created_at: NOW_ISO,
        updated_at: NOW_ISO,
      };
    });

    formulas.push(...chFormulas);

    chapters.push({
      id: ch.id,
      category_id: ch.category_id,
      chapter_no: ch.chapter_no,
      title: ch.title,
      slug: ch.slug,
      subtopics: ch.subtopics,
      sort_order: ch.sort_order,
      formula_count: chFormulas.length,
      status: 'live',
      pdf_r2_key: '',
      pdf_updated_at: '',
      pdf_generated_at: '',
      search_text: `${ch.chapter_no} ${ch.title} ${ch.subtopics}`.toLowerCase(),
      created_at: NOW_ISO,
      updated_at: NOW_ISO,
    });
  }

  chapters.sort(
    (a, b) =>
      Number(a.chapter_no) - Number(b.chapter_no) ||
      Number(a.sort_order) - Number(b.sort_order)
  );

  const categories: D1FormulaCategoryRow[] = SEED_FORMULA_CATEGORIES.map((cat) => {
    const catChapters = chapters.filter((c) => c.category_id === cat.id);
    const catFormulas = formulas.filter((f) => f.category_id === cat.id);
    return {
      ...cat,
      icon: 'Sigma',
      is_active: 1,
      chapter_count: catChapters.length,
      formula_count: catFormulas.length,
    };
  });

  return { categories, chapters, formulas };
}

const INITIAL_FORMULA_VAULT_SEED = buildInitialFormulaVaultSeed();

export const FORMULA_VAULT_CATEGORIES_SEED: D1FormulaCategoryRow[] =
  INITIAL_FORMULA_VAULT_SEED.categories;
export const FORMULA_VAULT_CHAPTERS_SEED: D1FormulaChapterRow[] =
  INITIAL_FORMULA_VAULT_SEED.chapters;
export const FORMULA_VAULT_ITEMS_SEED: D1FormulaItemRow[] =
  INITIAL_FORMULA_VAULT_SEED.formulas;


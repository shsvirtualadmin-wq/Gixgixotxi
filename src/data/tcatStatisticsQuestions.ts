import { Question } from '../types';

/**
 * TCAT Statistics Question Bank (84 MCQs)
 * Covers all 6 official UET Taxila TCAT Statistics syllabus chapters:
 * 1. Descriptive Statistics (14 MCQs: 5 Easy, 5 Medium, 4 Hard)
 * 2. Probability & Distributions (14 MCQs: 5 Easy, 5 Medium, 4 Hard)
 * 3. Sampling & Estimation (14 MCQs: 4 Easy, 5 Medium, 5 Hard)
 * 4. Hypothesis Testing (14 MCQs: 4 Easy, 5 Medium, 5 Hard)
 * 5. Correlation & Regression (14 MCQs: 5 Easy, 4 Medium, 5 Hard)
 * 6. Index Numbers & Time Series (14 MCQs: 5 Easy, 4 Medium, 5 Hard)
 * Total: exactly 84 MCQs (28 Easy, 28 Medium, 28 Hard).
 * Every item has correct: 0 (shuffled at runtime), 4 distinct options, detailed factual explanation.
 */
export const TCAT_STATISTICS_QUESTIONS: Question[] = [
  // ============================================
  // CHAPTER 1: Descriptive Statistics (14 MCQs)
  // ============================================
  {
    id: 'tcat-stat-1',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Easy',
    q: 'Which measure of central tendency is defined as the most frequently occurring value in a dataset?',
    options: [
      'Mode',
      'Arithmetic Mean',
      'Median',
      'Geometric Mean'
    ],
    correct: 0,
    explain: 'The mode is the value that appears with the highest frequency in a given set of observations.'
  },
  {
    id: 'tcat-stat-2',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Easy',
    q: 'What is the arithmetic mean of the numbers 4, 8, 12, 16, and 20?',
    options: [
      '12',
      '10',
      '14',
      '16'
    ],
    correct: 0,
    explain: 'Sum = 4 + 8 + 12 + 16 + 20 = 60. Mean = 60 / 5 = 12.'
  },
  {
    id: 'tcat-stat-3',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Easy',
    q: 'Which measure of dispersion is calculated as the positive square root of the variance?',
    options: [
      'Standard Deviation',
      'Range',
      'Mean Deviation',
      'Quartile Deviation'
    ],
    correct: 0,
    explain: 'Standard Deviation (σ or s) is mathematically defined as the positive square root of the variance (σ = √Var).'
  },
  {
    id: 'tcat-stat-4',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Easy',
    q: 'For an ordered dataset of N odd observations, at which position is the median located?',
    options: [
      '(N + 1) / 2',
      'N / 2',
      '(N / 2) + 1',
      '(N - 1) / 2'
    ],
    correct: 0,
    explain: 'When N is odd and the data is sorted, the median is the value at the (N + 1)/2-th rank.'
  },
  {
    id: 'tcat-stat-5',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Easy',
    q: 'What is the sum of deviations of all values in a dataset from their arithmetic mean (∑(X - X̄))?',
    options: [
      'Always equal to 0',
      'Always positive',
      'Equal to the variance',
      'Equal to the sample size N'
    ],
    correct: 0,
    explain: 'A fundamental algebraic property of the arithmetic mean is that ∑(X - X̄) = 0.'
  },
  {
    id: 'tcat-stat-6',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Medium',
    q: 'According to Karl Pearson\'s empirical relationship for moderately skewed distributions, what is the connection between Mean, Median, and Mode?',
    options: [
      'Mode = 3(Median) - 2(Mean)',
      'Mean = 3(Median) - 2(Mode)',
      'Median = 3(Mode) - 2(Mean)',
      'Mode = 2(Median) - 3(Mean)'
    ],
    correct: 0,
    explain: 'The empirical relationship is Mean - Mode = 3(Mean - Median), which rearranges to Mode = 3(Median) - 2(Mean).'
  },
  {
    id: 'tcat-stat-7',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Medium',
    q: 'What is the formula for calculating the Coefficient of Variation (C.V.), used to compare relative variability between distributions?',
    options: [
      'C.V. = (Standard Deviation / Mean) × 100',
      'C.V. = (Mean / Standard Deviation) × 100',
      'C.V. = (Variance / Mean) × 100',
      'C.V. = (Range / Median) × 100'
    ],
    correct: 0,
    explain: 'Coefficient of Variation expresses the standard deviation as a percentage of the arithmetic mean: C.V. = (s / X̄) × 100.'
  },
  {
    id: 'tcat-stat-8',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Medium',
    q: 'If each observation in a dataset is multiplied by a constant factor of 3, what happens to the standard deviation?',
    options: [
      'The standard deviation is multiplied by 3',
      'The standard deviation is multiplied by 9',
      'The standard deviation remains completely unchanged',
      'The standard deviation increases by 3'
    ],
    correct: 0,
    explain: 'Multiplying every value by a constant c multiplies the standard deviation by |c|. Here, standard deviation becomes 3 × original.'
  },
  {
    id: 'tcat-stat-9',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Medium',
    q: 'In a positively (right) skewed frequency distribution, what is the relative order of the three central tendency measures?',
    options: [
      'Mean > Median > Mode',
      'Mode > Median > Mean',
      'Median > Mean > Mode',
      'Mean = Median = Mode'
    ],
    correct: 0,
    explain: 'In a right-skewed distribution, extreme high values pull the mean toward the right tail, resulting in Mean > Median > Mode.'
  },
  {
    id: 'tcat-stat-10',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Medium',
    q: 'Which measure of central tendency is mathematically most appropriate for calculating the average rate of speed over equal distance intervals?',
    options: [
      'Harmonic Mean (H.M.)',
      'Arithmetic Mean (A.M.)',
      'Geometric Mean (G.M.)',
      'Median'
    ],
    correct: 0,
    explain: 'Harmonic Mean is the reciprocal of the arithmetic mean of reciprocals, providing the exact average for rates and speed over fixed distances.'
  },
  {
    id: 'tcat-stat-11',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Hard',
    q: 'For any set of positive non-identical real numbers, what strict inequality holds between their Arithmetic Mean (A.M.), Geometric Mean (G.M.), and Harmonic Mean (H.M.)?',
    options: [
      'A.M. > G.M. > H.M.',
      'H.M. > G.M. > A.M.',
      'G.M. > A.M. > H.M.',
      'A.M. > H.M. > G.M.'
    ],
    correct: 0,
    explain: 'The AM-GM-HM inequality proves that for positive unequal numbers, A.M. > G.M. > H.M. (equality holds only if all values are identical).'
  },
  {
    id: 'tcat-stat-12',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Hard',
    q: 'What is the Quartile Deviation (Semi-Interquartile Range) for a distribution with first quartile Q₁ = 24 and third quartile Q₃ = 40?',
    options: [
      '8',
      '16',
      '32',
      '4'
    ],
    correct: 0,
    explain: 'Quartile Deviation = (Q₃ - Q₁) / 2 = (40 - 24) / 2 = 16 / 2 = 8.'
  },
  {
    id: 'tcat-stat-13',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Hard',
    q: 'If a frequency distribution has a coefficient of kurtosis β₂ = 3 (or excess kurtosis γ₂ = 0), how is the peakedness of the distribution classified?',
    options: [
      'Mesokurtic (Normal peak)',
      'Leptokurtic (Sharply peaked)',
      'Platykurtic (Flat topped)',
      'Bimodal'
    ],
    correct: 0,
    explain: 'A normal distribution has moment ratio β₂ = μ₄ / σ⁴ = 3 (excess kurtosis = 0) and is called mesokurtic. β₂ > 3 is leptokurtic; β₂ < 3 is platykurtic.'
  },
  {
    id: 'tcat-stat-14',
    subject: 'Statistics',
    topic: 'Descriptive Statistics',
    difficulty: 'Hard',
    q: 'The variance of 10 observations is 16. If a constant value of 5 is added to every single observation, what is the new variance?',
    options: [
      '16',
      '21',
      '80',
      '400'
    ],
    correct: 0,
    explain: 'Variance is independent of change of origin; adding or subtracting a constant to each value leaves the variance unchanged (Var = 16).'
  },

  // ===============================================
  // CHAPTER 2: Probability & Distributions (14 MCQs)
  // ===============================================
  {
    id: 'tcat-stat-15',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Easy',
    q: 'What is the probability of rolling a sum of 7 when tossing two fair, six-sided dice simultaneously?',
    options: [
      '6 / 36 (1 / 6)',
      '7 / 36',
      '5 / 36',
      '1 / 12'
    ],
    correct: 0,
    explain: 'Pairs summing to 7 are (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 favorable outcomes out of 36 total outcomes = 6/36 = 1/6.'
  },
  {
    id: 'tcat-stat-16',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Easy',
    q: 'For two mutually exclusive events A and B, what is the probability of their intersection P(A ∩ B)?',
    options: [
      '0',
      'P(A) × P(B)',
      '1',
      'P(A) + P(B)'
    ],
    correct: 0,
    explain: 'Mutually exclusive events cannot occur simultaneously, so their intersection is empty: P(A ∩ B) = 0.'
  },
  {
    id: 'tcat-stat-17',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Easy',
    q: 'What are the two parameters of a Binomial Probability Distribution?',
    options: [
      'n (number of independent trials) and p (probability of success)',
      'μ (mean) and σ (standard deviation)',
      'λ (arrival rate) and t (time interval)',
      'α (shape) and β (scale)'
    ],
    correct: 0,
    explain: 'A Binomial distribution is denoted B(n, p) where n is the number of identical Bernoulli trials and p is the probability of success on each trial.'
  },
  {
    id: 'tcat-stat-18',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Easy',
    q: 'What is the numerical value of the total area under the probability density curve of any continuous random variable?',
    options: [
      '1.0',
      '0.5',
      '100',
      'Infinity'
    ],
    correct: 0,
    explain: 'By the second axiom of probability, the integral of any valid probability density function across its entire domain equals exactly 1.0.'
  },
  {
    id: 'tcat-stat-19',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Easy',
    q: 'In a Standard Normal Distribution Z ~ N(0, 1), what are the values of the Mean and Variance respectively?',
    options: [
      'Mean = 0, Variance = 1',
      'Mean = 1, Variance = 0',
      'Mean = 0, Variance = 0',
      'Mean = 1, Variance = 1'
    ],
    correct: 0,
    explain: 'A standard normal variable Z has a mean of 0 and a standard deviation (and variance) of 1.'
  },
  {
    id: 'tcat-stat-20',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Medium',
    q: 'For two independent events A and B with P(A) = 0.4 and P(B) = 0.5, what is the probability P(A ∪ B)?',
    options: [
      '0.70',
      '0.90',
      '0.20',
      '0.60'
    ],
    correct: 0,
    explain: 'P(A ∩ B) = 0.4 × 0.5 = 0.20. P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.4 + 0.5 - 0.20 = 0.70.'
  },
  {
    id: 'tcat-stat-21',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Medium',
    q: 'In a Poisson distribution with mean parameter λ, what is the mathematical relationship between the Mean and the Variance?',
    options: [
      'Mean = Variance = λ',
      'Variance = Mean² = λ²',
      'Mean > Variance',
      'Variance = λ / 2'
    ],
    correct: 0,
    explain: 'A unique characteristic of the Poisson distribution is that its mean and variance are identical and equal to parameter λ.'
  },
  {
    id: 'tcat-stat-22',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Medium',
    q: 'In a Binomial distribution B(n, p), what are the formulas for the expected value (mean) and variance respectively?',
    options: [
      'Mean = np, Variance = npq (where q = 1 - p)',
      'Mean = np, Variance = np',
      'Mean = n/p, Variance = n/p²',
      'Mean = p/n, Variance = pq/n'
    ],
    correct: 0,
    explain: 'For B(n, p), E(X) = np and Var(X) = np(1 - p) = npq.'
  },
  {
    id: 'tcat-stat-23',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Medium',
    q: 'According to the Empirical Rule (68-95-99.7 rule) for a normal distribution, what percentage of values lie within μ ± 2σ?',
    options: [
      'Approximately 95.45%',
      'Approximately 68.27%',
      'Approximately 99.73%',
      'Approximately 50.00%'
    ],
    correct: 0,
    explain: 'In a normal distribution, ~68.3% falls within 1 SD, ~95.45% within 2 SDs, and ~99.73% within 3 SDs.'
  },
  {
    id: 'tcat-stat-24',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Medium',
    q: 'What is the conditional probability formula P(A | B), assuming P(B) > 0?',
    options: [
      'P(A | B) = P(A ∩ B) / P(B)',
      'P(A | B) = P(A ∩ B) / P(A)',
      'P(A | B) = P(A) / P(B)',
      'P(A | B) = P(A) × P(B)'
    ],
    correct: 0,
    explain: 'By definition of conditional probability, P(A | B) = P(A ∩ B) / P(B) for P(B) > 0.'
  },
  {
    id: 'tcat-stat-25',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Hard',
    q: 'Under what limiting conditions does a Binomial distribution B(n, p) converge to a Poisson distribution?',
    options: [
      'When n → ∞, p → 0, such that the product np = λ remains constant and finite',
      'When n → ∞ and p = 0.5',
      'When n < 30 and p > 0.9',
      'When both n and p approach infinity simultaneously'
    ],
    correct: 0,
    explain: 'The Poisson distribution is the law of rare events, derived as the limit of B(n, p) as n → ∞ and p → 0 with np = λ constant.'
  },
  {
    id: 'tcat-stat-26',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Hard',
    q: 'What is the probability of obtaining exactly 3 heads when tossing a fair coin 5 times?',
    options: [
      '10 / 32 (5 / 16)',
      '5 / 32',
      '1 / 2',
      '15 / 32'
    ],
    correct: 0,
    explain: 'P(X = 3) = C(5, 3) × (0.5)³ × (0.5)² = 10 × (1/32) = 10/32 = 5/16.'
  },
  {
    id: 'tcat-stat-27',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Hard',
    q: 'If a random variable X has mean E(X) = 10 and variance Var(X) = 4, what is the expected value of E(X²)?',
    options: [
      '104',
      '100',
      '16',
      '96'
    ],
    correct: 0,
    explain: 'Var(X) = E(X²) - [E(X)]² → 4 = E(X²) - 100 → E(X²) = 100 + 4 = 104.'
  },
  {
    id: 'tcat-stat-28',
    subject: 'Statistics',
    topic: 'Probability & Distributions',
    difficulty: 'Hard',
    q: 'What does Bayes\' Theorem calculate in statistical inference?',
    options: [
      'Posterior probability of an event given prior probability and conditional likelihood evidence',
      'The marginal variance of two correlated continuous variables',
      'The exact sample size required for zero standard error',
      'The degree of peakedness in a multimodal probability density'
    ],
    correct: 0,
    explain: 'Bayes\' theorem computes posterior probability: P(Ai | B) = [P(B | Ai)P(Ai)] / ∑[P(B | Aj)P(Aj)], updating prior beliefs with observed evidence.'
  },

  // ============================================
  // CHAPTER 3: Sampling & Estimation (14 MCQs)
  // ============================================
  {
    id: 'tcat-stat-29',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Easy',
    q: 'What is any measurable numerical characteristic calculated from a sample called?',
    options: [
      'Statistic',
      'Parameter',
      'Population constant',
      'Census constant'
    ],
    correct: 0,
    explain: 'A numerical measure calculated from sample data is a statistic (e.g., sample mean x̄); a measure describing an entire population is a parameter (e.g., μ).'
  },
  {
    id: 'tcat-stat-30',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Easy',
    q: 'What is the Standard Error of the mean (S.E.) for a simple random sample of size n drawn from a population with standard deviation σ?',
    options: [
      'σ / √n',
      'σ² / n',
      'σ / n',
      'σ × √n'
    ],
    correct: 0,
    explain: 'The standard error of the sample mean is the standard deviation of its sampling distribution: SE(x̄) = σ / √n.'
  },
  {
    id: 'tcat-stat-31',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Easy',
    q: 'How many total possible samples of size n = 2 can be drawn from a population of size N = 5 WITH replacement?',
    options: [
      '25 samples (N^n)',
      '10 samples',
      '20 samples',
      '12 samples'
    ],
    correct: 0,
    explain: 'With replacement, each selection is independent: N^n = 5^2 = 25 possible samples.'
  },
  {
    id: 'tcat-stat-32',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Easy',
    q: 'An estimator θ̂ is called an "unbiased estimator" of parameter θ if its expected value satisfies:',
    options: [
      'E(θ̂) = θ',
      'E(θ̂) = 0',
      'Var(θ̂) = θ',
      'E(θ̂) = 1'
    ],
    correct: 0,
    explain: 'An estimator is unbiased if its expected value equals the true population parameter: E(θ̂) = θ.'
  },
  {
    id: 'tcat-stat-33',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Medium',
    q: 'According to the Central Limit Theorem (CLT), as the sample size n becomes sufficiently large (typically n ≥ 30), what happens to the sampling distribution of the sample mean x̄?',
    options: [
      'It approaches a normal distribution regardless of the shape of the parent population',
      'It becomes uniform across all intervals',
      'It adopts the exact shape of the underlying population',
      'Its variance increases proportionally to n'
    ],
    correct: 0,
    explain: 'CLT states that for large n, the distribution of sample mean approaches N(μ, σ²/n), regardless of the original population distribution.'
  },
  {
    id: 'tcat-stat-34',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Medium',
    q: 'When sampling WITHOUT replacement from a finite population of size N, what finite population correction factor (FPC) is multiplied into the standard error formula?',
    options: [
      '√((N - n) / (N - 1))',
      '(N - n) / (N - 1)',
      '√((N - 1) / (N - n))',
      '(N - 1) / N'
    ],
    correct: 0,
    explain: 'Without replacement from a finite population, the standard error is adjusted by the finite population multiplier √[(N - n)/(N - 1)].'
  },
  {
    id: 'tcat-stat-35',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Medium',
    q: 'What is the critical Z-value (Z_α/2) used to construct a two-sided 95% confidence interval for a population mean?',
    options: [
      '1.96',
      '1.645',
      '2.576',
      '2.33'
    ],
    correct: 0,
    explain: 'For a 95% confidence interval, α = 0.05, α/2 = 0.025, and the critical standard normal value is Z = 1.96.'
  },
  {
    id: 'tcat-stat-36',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Medium',
    q: 'Why is the sample variance formula divided by (n - 1) instead of n when estimating the population variance σ² from sample data?',
    options: [
      'To correct for downward bias, making s² = ∑(x - x̄)² / (n - 1) an unbiased estimator (Bessel\'s correction)',
      'To account for measurement instrument inaccuracies',
      'To ensure the variance is always an integer',
      'Because one observation is always discarded as an outlier'
    ],
    correct: 0,
    explain: 'Dividing by n underestimates σ²; Bessel\'s correction dividing by degrees of freedom (n - 1) produces an unbiased estimator: E(s²) = σ².'
  },
  {
    id: 'tcat-stat-37',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Medium',
    q: 'If the sample size n is quadrupled from 25 to 100, what happens to the standard error of the mean?',
    options: [
      'The standard error is halved (reduced by 50%)',
      'The standard error is reduced to 1/4th of its value',
      'The standard error doubles',
      'The standard error remains unchanged'
    ],
    correct: 0,
    explain: 'Since SE = σ / √n, quadrupling n (4n) divides the standard error by √4 = 2, halving it.'
  },
  {
    id: 'tcat-stat-38',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Hard',
    q: 'A sample of 64 observations from a population with known standard deviation σ = 16 has a sample mean x̄ = 50. What is the 95% confidence interval for the population mean μ?',
    options: [
      '46.08 to 53.92',
      '48.04 to 51.96',
      '45.00 to 55.00',
      '42.16 to 57.84'
    ],
    correct: 0,
    explain: 'SE = 16 / √64 = 16 / 8 = 2. Margin of error = 1.96 × 2 = 3.92. CI = 50 ± 3.92 = [46.08, 53.92].'
  },
  {
    id: 'tcat-stat-39',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Hard',
    q: 'What property must an estimator possess if, as sample size n approaches infinity, the probability that the estimator differs from the parameter by any arbitrary amount approaches zero?',
    options: [
      'Consistency',
      'Efficiency',
      'Sufficiency',
      'Unbiasedness'
    ],
    correct: 0,
    explain: 'Consistency means the estimator converges in probability to the true population parameter as n → ∞.'
  },
  {
    id: 'tcat-stat-40',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Hard',
    q: 'In Stratified Random Sampling, when is Neyman Optimal Allocation used to determine stratum sample sizes?',
    options: [
      'When stratum variances differ, allocating larger sample sizes to larger and more variable strata',
      'When all strata have identical standard deviations',
      'When costs per unit are equal and variances are negligible',
      'When the population cannot be partitioned into homogeneous subgroups'
    ],
    correct: 0,
    explain: 'Neyman allocation determines stratum sample size n_h proportional to N_h × σ_h, minimizing sample variance for a fixed overall sample size.'
  },
  {
    id: 'tcat-stat-41',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Hard',
    q: 'Between two unbiased estimators θ̂₁ and θ̂₂ of parameter θ, why is θ̂₁ called "more efficient" than θ̂₂?',
    options: [
      'Var(θ̂₁) < Var(θ̂₂)',
      'E(θ̂₁) > E(θ̂₂)',
      'θ̂₁ can be computed in fewer arithmetic steps',
      'θ̂₁ is derived from a smaller sample size'
    ],
    correct: 0,
    explain: 'Statistical efficiency compares the sampling variances of unbiased estimators: the estimator with the smaller variance is more efficient.'
  },
  {
    id: 'tcat-stat-42',
    subject: 'Statistics',
    topic: 'Sampling & Estimation',
    difficulty: 'Hard',
    q: 'What is the required sample size n to estimate a population mean within a margin of error E = 2 with 95% confidence (Z = 1.96), given population variance σ² = 64?',
    options: [
      '62 (rounded up from 61.47)',
      '16',
      '32',
      '128'
    ],
    correct: 0,
    explain: 'n = (Z × σ / E)² = (1.96 × 8 / 2)² = (7.84)² = 61.47 → 62.'
  },

  // ===========================================
  // CHAPTER 4: Hypothesis Testing (14 MCQs)
  // ===========================================
  {
    id: 'tcat-stat-43',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Easy',
    q: 'In statistical testing, what does the Null Hypothesis (H₀) typically state?',
    options: [
      'There is no significant difference, effect, or relationship (status quo)',
      'The proposed treatment causes a massive significant increase',
      'The sample parameter is exactly equal to the alternative hypothesis',
      'The probability of error is zero'
    ],
    correct: 0,
    explain: 'The null hypothesis (H0) posits no real effect, difference, or association, serving as the benchmark tested against evidence.'
  },
  {
    id: 'tcat-stat-44',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Easy',
    q: 'What error is committed when a true null hypothesis (H₀) is mistakenly rejected?',
    options: [
      'Type I error (False Positive, probability α)',
      'Type II error (False Negative, probability β)',
      'Standard error',
      'Systematic bias error'
    ],
    correct: 0,
    explain: 'Rejecting H0 when H0 is actually true is a Type I error; its maximum probability is the level of significance α.'
  },
  {
    id: 'tcat-stat-45',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Easy',
    q: 'What is the statistical power of a hypothesis test defined as?',
    options: [
      '1 - β (Probability of correctly rejecting a false null hypothesis)',
      '1 - α',
      'α + β',
      'β / α'
    ],
    correct: 0,
    explain: 'The power of a test is 1 - β, the probability of correctly rejecting H0 when H1 is true.'
  },
  {
    id: 'tcat-stat-46',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Easy',
    q: 'When testing a hypothesis about a single population mean with a small sample (n < 30) and unknown population variance σ², which test statistic is appropriate?',
    options: [
      'Student\'s t-test with (n - 1) degrees of freedom',
      'Standard Normal Z-test',
      'Chi-Square goodness of fit test',
      'Snedecor\'s F-test'
    ],
    correct: 0,
    explain: 'When n < 30 and σ is unknown (estimated by sample SD s), the test statistic follows Student\'s t-distribution with df = n - 1.'
  },
  {
    id: 'tcat-stat-47',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Medium',
    q: 'What is the decision rule in hypothesis testing when using the p-value approach with significance level α?',
    options: [
      'Reject H₀ if p-value ≤ α',
      'Reject H₀ if p-value > α',
      'Accept H₀ if p-value < α / 2',
      'Reject H₁ if p-value ≤ α'
    ],
    correct: 0,
    explain: 'If the p-value is less than or equal to the significance level α, the observed result is statistically significant and H0 is rejected.'
  },
  {
    id: 'tcat-stat-48',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Medium',
    q: 'What error is committed when an investigator fails to reject a false null hypothesis (H₀)?',
    options: [
      'Type II error (False Negative, probability β)',
      'Type I error',
      'Sampling error',
      'Measurement rounding error'
    ],
    correct: 0,
    explain: 'A Type II error occurs when H0 is false, but the test fails to reject it. Its probability is denoted by β.'
  },
  {
    id: 'tcat-stat-49',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Medium',
    q: 'In a contingency table with r rows and c columns, what are the degrees of freedom for the Chi-Square (χ²) test of independence of attributes?',
    options: [
      '(r - 1)(c - 1)',
      'r × c - 1',
      '(r + c) - 1',
      '(r - 1) + (c - 1)'
    ],
    correct: 0,
    explain: 'For an r × c contingency table, degrees of freedom are (r - 1)(c - 1).'
  },
  {
    id: 'tcat-stat-50',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Medium',
    q: 'When is a two-tailed hypothesis test used instead of a one-tailed test?',
    options: [
      'When the alternative hypothesis H₁ specifies an inequality (μ ≠ μ₀) in either direction',
      'When the alternative hypothesis specifies strictly μ > μ₀',
      'When the sample size is greater than 1000',
      'When the population variance is strictly zero'
    ],
    correct: 0,
    explain: 'A two-tailed test is employed when H1 is non-directional (μ ≠ μ0), testing for significant deviations in either direction.'
  },
  {
    id: 'tcat-stat-51',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Medium',
    q: 'What is the formula for the Chi-Square test statistic used in testing goodness-of-fit or independence?',
    options: [
      'χ² = ∑[(O - E)² / E]',
      'χ² = ∑[(O - E) / E²]',
      'χ² = ∑[(O - E)² / O]',
      'χ² = ∑[(O² - E²) / E]'
    ],
    correct: 0,
    explain: 'The Chi-Square statistic sums squared differences between observed (O) and expected (E) frequencies divided by expected: χ² = ∑[(O - E)² / E].'
  },
  {
    id: 'tcat-stat-52',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Hard',
    q: 'In a two-tailed Z-test with α = 0.05, the calculated test statistic is Z_calc = -2.35. What is the statistical conclusion?',
    options: [
      'Reject H₀ because |-2.35| > 1.96 (the result falls in the critical rejection region)',
      'Fail to reject H₀ because -2.35 is negative',
      'Accept H₀ with 99% certainty',
      'The test is inconclusive without knowing degrees of freedom'
    ],
    correct: 0,
    explain: 'Critical values for two-tailed α = 0.05 are ±1.96. Since -2.35 < -1.96, the test statistic falls in the critical region, so H0 is rejected.'
  },
  {
    id: 'tcat-stat-53',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Hard',
    q: 'When testing for the equality of variances between two independent normally distributed populations (σ₁² = σ₂²), which test statistic is used?',
    options: [
      'F-test (F = s₁² / s₂² where s₁² > s₂²)',
      'Student\'s t-test with n₁ + n₂ - 2 degrees of freedom',
      'Z-score difference test',
      'Mann-Whitney U-test'
    ],
    correct: 0,
    explain: 'The F-test (variance ratio test) compares two sample variances: F = s₁² / s₂² with (n₁ - 1, n₂ - 1) degrees of freedom.'
  },
  {
    id: 'tcat-stat-54',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Hard',
    q: 'Under what experimental design is a Paired-Sample t-test mandatory rather than an independent two-sample t-test?',
    options: [
      'When two sets of observations are matched, paired, or collected from the same subjects in a before-and-after repeated measures study',
      'When the two samples have drastically different sample sizes',
      'When both population variances are known and identical',
      'When the data is measured on a nominal categorical scale'
    ],
    correct: 0,
    explain: 'A paired t-test analyzes differences d = x₁ - x₂ between matched pairs (e.g. before-and-after tests on the same subjects), removing subject variability.'
  },
  {
    id: 'tcat-stat-55',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Hard',
    q: 'In Chi-Square testing, what is the expected frequency formula for a cell in row i and column j of an r × c contingency table under H₀?',
    options: [
      'E_ij = (Row i Total × Column j Total) / Grand Total (N)',
      'E_ij = (Row i Total + Column j Total) / 2',
      'E_ij = Grand Total / (r × c)',
      'E_ij = (Row i Total - Column j Total) / N'
    ],
    correct: 0,
    explain: 'Under independence, E_ij = P(Row i) × P(Col j) × N = (R_i / N) × (C_j / N) × N = (R_i × C_j) / N.'
  },
  {
    id: 'tcat-stat-56',
    subject: 'Statistics',
    topic: 'Hypothesis Testing',
    difficulty: 'Hard',
    q: 'If the significance level α is decreased from 0.05 to 0.01 while keeping sample size n constant, what happens to the probability of Type II error (β) and the Power (1 - β)?',
    options: [
      'Type II error β increases, and Power (1 - β) decreases',
      'Type II error β decreases, and Power increases',
      'Both Type I error and Type II error decrease simultaneously',
      'Neither β nor Power change'
    ],
    correct: 0,
    explain: 'For fixed n, reducing α makes the rejection region smaller and more stringent, increasing the risk of Type II error (β) and decreasing power (1 - β).'
  },

  // =============================================
  // CHAPTER 5: Correlation & Regression (14 MCQs)
  // =============================================
  {
    id: 'tcat-stat-57',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Easy',
    q: 'What is the numerical range of Pearson\'s product-moment correlation coefficient (r)?',
    options: [
      '-1 ≤ r ≤ +1',
      '0 ≤ r ≤ 1',
      '-∞ < r < +∞',
      '-1 < r < 0'
    ],
    correct: 0,
    explain: 'Pearson\'s correlation coefficient r is bounded strictly between -1.0 (perfect negative linear correlation) and +1.0 (perfect positive linear correlation).'
  },
  {
    id: 'tcat-stat-58',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Easy',
    q: 'What does a correlation coefficient r = 0 indicate regarding the relationship between two variables X and Y?',
    options: [
      'No linear association between X and Y',
      'A perfect non-linear parabolic association',
      'That X and Y are identical variables',
      'That both variables have zero variance'
    ],
    correct: 0,
    explain: 'An r value of zero signifies the absence of any linear relationship (though non-linear relationships could still exist).'
  },
  {
    id: 'tcat-stat-59',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Easy',
    q: 'In the simple linear regression equation Ŷ = a + bX, what does parameter \'b\' represent?',
    options: [
      'The slope (regression coefficient) indicating the expected change in Y for a one-unit change in X',
      'The Y-intercept when X equals zero',
      'The coefficient of determination',
      'The total sum of squared residuals'
    ],
    correct: 0,
    explain: 'In Ŷ = a + bX, b is the slope (regression coefficient of Y on X), measuring the rate of change of Ŷ per unit increase in X.'
  },
  {
    id: 'tcat-stat-60',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Easy',
    q: 'What graphical representation plots pairs of bivariate observations (X, Y) as individual points on a Cartesian plane?',
    options: [
      'Scatter Diagram',
      'Histogram',
      'Ogive curve',
      'Pareto chart'
    ],
    correct: 0,
    explain: 'A scatter plot/diagram visually displays bivariate data points to inspect the direction and strength of association.'
  },
  {
    id: 'tcat-stat-61',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Easy',
    q: 'What is the sign of the correlation coefficient r if both regression coefficients b_yx and b_xy are negative?',
    options: [
      'Negative (r is always negative when both slopes are negative)',
      'Positive (since square root is positive)',
      'Zero',
      'Undefined'
    ],
    correct: 0,
    explain: 'The correlation coefficient r has the exact same mathematical sign as both regression coefficients: if b_yx and b_xy are negative, r is negative.'
  },
  {
    id: 'tcat-stat-62',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Medium',
    q: 'What does the Coefficient of Determination (r²) quantify in regression analysis?',
    options: [
      'The proportion of total variation in the dependent variable Y explained by the independent variable X',
      'The slope of the orthogonal regression line',
      'The ratio of the sample sizes',
      'The probability that the true slope is zero'
    ],
    correct: 0,
    explain: 'r² (coefficient of determination) measures the fraction of total variance in Y that is accounted for by the linear model with X.'
  },
  {
    id: 'tcat-stat-63',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Medium',
    q: 'What is the mathematical relationship between the correlation coefficient r and the two regression coefficients b_yx and b_xy?',
    options: [
      'r = ±√(b_yx × b_xy)',
      'r = (b_yx + b_xy) / 2',
      'r = b_yx / b_xy',
      'r = b_yx × b_xy'
    ],
    correct: 0,
    explain: 'The correlation coefficient is the geometric mean of the two regression slopes: r = ±√(b_yx × b_xy).'
  },
  {
    id: 'tcat-stat-64',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Medium',
    q: 'What criterion does the Method of Ordinary Least Squares (OLS) use to fit the best regression line?',
    options: [
      'Minimizing the sum of squared vertical residuals: ∑(Y - Ŷ)²',
      'Maximizing the sum of horizontal deviations',
      'Setting the sum of absolute errors to infinity',
      'Equating the mean of X to the variance of Y'
    ],
    correct: 0,
    explain: 'OLS determines intercept \'a\' and slope \'b\' such that the sum of squared errors ∑(Y_i - Ŷ_i)² is minimized.'
  },
  {
    id: 'tcat-stat-65',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Medium',
    q: 'At what specific coordinate point do the two regression lines (Y on X and X on Y) always intersect?',
    options: [
      '(X̄, Ȳ) — the point of means',
      '(0, 0) — the origin',
      '(s_x, s_y) — the point of standard deviations',
      '(Median_X, Median_Y)'
    ],
    correct: 0,
    explain: 'Both regression lines pass through the centroid of bivariate data: the point of means (X̄, Ȳ).'
  },
  {
    id: 'tcat-stat-66',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Hard',
    q: 'If the two regression coefficients are b_yx = 0.8 and b_xy = 0.45, what is the value of the correlation coefficient r?',
    options: [
      '+0.60',
      '+0.36',
      '+0.625',
      '+0.80'
    ],
    correct: 0,
    explain: 'r = √(b_yx × b_xy) = √(0.8 × 0.45) = √0.36 = +0.60.'
  },
  {
    id: 'tcat-stat-67',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Hard',
    q: 'If the correlation coefficient between X and Y is r = 0.8, what percentage of the variance in Y remains unexplained by variable X?',
    options: [
      '36% (0.36)',
      '64% (0.64)',
      '20% (0.20)',
      '80% (0.80)'
    ],
    correct: 0,
    explain: 'Explained variation r² = (0.8)² = 0.64 (64%). Unexplained variation is 1 - r² = 1 - 0.64 = 0.36 = 36%.'
  },
  {
    id: 'tcat-stat-68',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Hard',
    q: 'If the two regression lines are completely perpendicular to each other (angle θ = 90°), what is the correlation coefficient r?',
    options: [
      'r = 0',
      'r = +1',
      'r = -1',
      'r = ±0.5'
    ],
    correct: 0,
    explain: 'tan θ = (1 - r²) / |r| × [s_x s_y / (s_x² + s_y²)]. When lines are perpendicular (θ = 90°), tan θ → ∞, which occurs when r = 0.'
  },
  {
    id: 'tcat-stat-69',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Hard',
    q: 'What is the formula for Spearman\'s Rank Correlation Coefficient (r_s) when there are no tied ranks across n paired observations?',
    options: [
      'r_s = 1 - [6∑d² / (n(n² - 1))]',
      'r_s = 1 + [6∑d² / (n(n² - 1))]',
      'r_s = 1 - [∑d² / n³]',
      'r_s = [6∑d² / (n² - 1)]'
    ],
    correct: 0,
    explain: 'Spearman\'s rank correlation formula without ties is r_s = 1 - [6∑d² / (n(n² - 1))], where d is the rank difference for each pair.'
  },
  {
    id: 'tcat-stat-70',
    subject: 'Statistics',
    topic: 'Correlation & Regression',
    difficulty: 'Hard',
    q: 'How is Pearson\'s correlation coefficient r affected by a change of origin and change of scale on the variables: U = (X - a)/c and V = (Y - b)/d, where c > 0 and d > 0?',
    options: [
      'r is completely invariant to both changes of origin and positive changes of scale',
      'r is multiplied by (c × d)',
      'r increases by (a + b)',
      'r is squared'
    ],
    correct: 0,
    explain: 'The correlation coefficient r is a pure dimensionless number, invariant to changes of origin and positive scale changes: r_uv = r_xy.'
  },

  // ==============================================
  // CHAPTER 6: Index Numbers & Time Series (14 MCQs)
  // ==============================================
  {
    id: 'tcat-stat-71',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Easy',
    q: 'What weighting system does the Laspeyres Price Index use when calculating price changes across time?',
    options: [
      'Base year quantities (q₀)',
      'Current year quantities (qₙ)',
      'Average quantities of base and current years',
      'Fixed constant unit weights of 1'
    ],
    correct: 0,
    explain: 'Laspeyres index is base-weighted: P₀ₙ = [∑(pₙq₀) / ∑(p₀q₀)] × 100.'
  },
  {
    id: 'tcat-stat-72',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Easy',
    q: 'What weighting system does the Paasche Price Index employ?',
    options: [
      'Current year quantities (qₙ)',
      'Base year quantities (q₀)',
      'Base year prices (p₀)',
      'Target future quantities'
    ],
    correct: 0,
    explain: 'Paasche index is current-weighted: P₀ₙ = [∑(pₙqₙ) / ∑(p₀qₙ)] × 100.'
  },
  {
    id: 'tcat-stat-73',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Easy',
    q: 'Fisher\'s "Ideal" Index Number is mathematically defined as:',
    options: [
      'The Geometric Mean of the Laspeyres and Paasche index numbers (√[L × P])',
      'The Arithmetic Mean of Laspeyres and Paasche index numbers',
      'The Harmonic Mean of Laspeyres and Paasche index numbers',
      'Laspeyres index multiplied by Paasche index'
    ],
    correct: 0,
    explain: 'Irving Fisher\'s Ideal Index is the geometric mean of Laspeyres (L) and Paasche (P): Fisher = √(L × P).'
  },
  {
    id: 'tcat-stat-74',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Easy',
    q: 'What are the four classical components that constitute an economic Time Series?',
    options: [
      'Secular Trend (T), Seasonal Variations (S), Cyclical Fluctuations (C), and Irregular/Random Variations (I)',
      'Mean, Variance, Skewness, and Kurtosis',
      'Price, Quantity, Value, and Weight',
      'Base year, Current year, Index, and Deflator'
    ],
    correct: 0,
    explain: 'Classical time series decomposition identifies four components: Trend (T), Seasonal (S), Cyclical (C), and Irregular (I).'
  },
  {
    id: 'tcat-stat-75',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Easy',
    q: 'Which component of a time series represents regular, repeating periodic movements within a single annual cycle (e.g., umbrella sales in monsoon)?',
    options: [
      'Seasonal Variation (S)',
      'Secular Trend (T)',
      'Cyclical Fluctuation (C)',
      'Irregular Variation (I)'
    ],
    correct: 0,
    explain: 'Seasonal variations are recurring intra-year patterns caused by weather seasons, holidays, and institutional calendars.'
  },
  {
    id: 'tcat-stat-76',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Medium',
    q: 'Why is Fisher\'s Index called an "Ideal" index number in economic statistics?',
    options: [
      'It satisfies both the Time Reversal Test and the Factor Reversal Test',
      'It uses zero weights and requires no quantity data',
      'It is computationally simpler than simple aggregative indices',
      'It eliminates the need for selecting a base year'
    ],
    correct: 0,
    explain: 'Fisher\'s formula satisfies both rigorous consistency tests: Time Reversal Test (P₀₁ × P₁₀ = 1) and Factor Reversal Test (P₀₁ × Q₀₁ = V₀₁).'
  },
  {
    id: 'tcat-stat-77',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Medium',
    q: 'In the multiplicative model of time series decomposition, how is the observed series Y_t expressed?',
    options: [
      'Y_t = T × S × C × I',
      'Y_t = T + S + C + I',
      'Y_t = (T + S) × (C + I)',
      'Y_t = T / (S × C × I)'
    ],
    correct: 0,
    explain: 'The multiplicative model assumes components interact proportionally: Y = T × S × C × I, where S, C, and I are expressed as indices/ratios around 1.0.'
  },
  {
    id: 'tcat-stat-78',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Medium',
    q: 'Which method of trend estimation fits a mathematical trend line by minimizing the sum of squared deviations from observed data points?',
    options: [
      'Method of Least Squares',
      'Method of Moving Averages',
      'Freehand Graphic Method',
      'Method of Semi-Averages'
    ],
    correct: 0,
    explain: 'The Method of Least Squares fits an analytical trend equation (e.g. Y = a + bX) minimizing ∑(Y - Ŷ)².'
  },
  {
    id: 'tcat-stat-79',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Medium',
    q: 'What is a recognized disadvantage of using a 3-year or 5-year Moving Average to smooth out short-term fluctuations in a time series?',
    options: [
      'Trend values cannot be calculated for the beginning and end periods (loss of data at both ends)',
      'It cannot eliminate linear trend',
      'It introduces complex quadratic curvature into linear series',
      'It requires equal weighting of all past centuries'
    ],
    correct: 0,
    explain: 'An m-period moving average cannot provide trend estimates for the first and last (m - 1)/2 periods, losing endpoint information.'
  },
  {
    id: 'tcat-stat-80',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Hard',
    q: 'If the Laspeyres Price Index is L = 144 and the Paasche Price Index is P = 100, what is Fisher\'s Ideal Price Index?',
    options: [
      '120',
      '122',
      '14400',
      '110'
    ],
    correct: 0,
    explain: 'Fisher\'s Index = √(L × P) = √(144 × 100) = √14400 = 120.'
  },
  {
    id: 'tcat-stat-81',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Hard',
    q: 'What mathematical condition is required for an index number formula to satisfy the Time Reversal Test (excluding the factor 100)?',
    options: [
      'P₀₁ × P₁₀ = 1',
      'P₀₁ / P₁₀ = 1',
      'P₀₁ + P₁₀ = 0',
      'P₀₁ × Q₀₁ = 1'
    ],
    correct: 0,
    explain: 'The time reversal test requires that reversing the time subscripts produces the reciprocal of the forward index: P₀₁ × P₁₀ = 1.'
  },
  {
    id: 'tcat-stat-82',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Hard',
    q: 'In the method of least squares for linear trend Y = a + bX with an odd number of years (e.g., N = 7), what simplification occurs when the origin X = 0 is placed at the middle year?',
    options: [
      '∑X = 0, so the normal equations simplify to a = ∑Y / N and b = ∑XY / ∑X²',
      'b becomes identically zero',
      'All squared residuals sum to zero',
      'a equals the sample variance of Y'
    ],
    correct: 0,
    explain: 'Placing origin at the middle year makes ∑X = 0, simplifying the normal equations to direct formulas: a = ∑Y/N and b = ∑XY/∑X².'
  },
  {
    id: 'tcat-stat-83',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Hard',
    q: 'What test of index numbers is satisfied when the product of the price index and the quantity index equals the true value ratio: P₀₁ × Q₀₁ = ∑(p₁q₁) / ∑(p₀q₀)?',
    options: [
      'Factor Reversal Test',
      'Time Reversal Test',
      'Circular Test',
      'Base Shifting Test'
    ],
    correct: 0,
    explain: 'The Factor Reversal Test mandates that interchanging prices and quantities yields the true value ratio V₀₁ = ∑(p₁q₁) / ∑(p₀q₀).'
  },
  {
    id: 'tcat-stat-84',
    subject: 'Statistics',
    topic: 'Index Numbers & Time Series',
    difficulty: 'Hard',
    q: 'How does Laspeyres Price Index typically behave relative to the true cost-of-living index during periods of inflation?',
    options: [
      'It overstates (upward bias) price increases because it assumes consumers maintain a fixed base-period basket without substituting cheaper goods',
      'It understates inflation because it uses current-period quantities',
      'It equals the true geometric cost of living index exactly',
      'It exhibits zero substitution bias under all economic conditions'
    ],
    correct: 0,
    explain: 'Laspeyres has an upward substitution bias: by holding base quantities fixed, it fails to account for consumer substitution toward relatively cheaper items.'
  }
];

import { Question } from '../types';

export const TCAT_STATISTICS_QUESTIONS: Question[] = [
  {
    "id": "tcat-stat-1",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "Which measure of central tendency is defined as the most frequently occurring value in a dataset?",
    "options": [
      "Mode",
      "Arithmetic Mean",
      "Median",
      "Geometric Mean"
    ],
    "correct": 0,
    "explain": "The mode is the value that appears with the highest frequency in a given set of observations.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-2",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "What is the arithmetic mean of the numbers 4, 8, 12, 16, and 20?",
    "options": [
      "12",
      "10",
      "14",
      "16"
    ],
    "correct": 0,
    "explain": "Sum = 4 + 8 + 12 + 16 + 20 = 60. Mean = 60 / 5 = 12.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-3",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "Which measure of dispersion is calculated as the positive square root of the variance?",
    "options": [
      "Standard Deviation",
      "Range",
      "Mean Deviation",
      "Quartile Deviation"
    ],
    "correct": 0,
    "explain": "Standard Deviation (σ or s) is mathematically defined as the positive square root of the variance (σ = $\\sqrt${Var}).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-4",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "For an ordered dataset of N odd observations, at which position is the median located?",
    "options": [
      "(N + 1) / 2",
      "N / 2",
      "(N / 2) + 1",
      "(N - 1) / 2"
    ],
    "correct": 0,
    "explain": "When N is odd and the data is sorted, the median is the value at the (N + 1)/2-th rank.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-5",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "What is the sum of deviations of all values in a dataset from their arithmetic mean (∑(X - X̄))?",
    "options": [
      "Always equal to 0",
      "Always positive",
      "Equal to the variance",
      "Equal to the sample size N"
    ],
    "correct": 0,
    "explain": "A fundamental algebraic property of the arithmetic mean is that ∑(X - X̄) = 0.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-6",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "According to Karl Pearson's empirical relationship for moderately skewed distributions, what is the connection between Mean, Median, and Mode?",
    "options": [
      "Mode = 3(Median) - 2(Mean)",
      "Mean = 3(Median) - 2(Mode)",
      "Median = 3(Mode) - 2(Mean)",
      "Mode = 2(Median) - 3(Mean)"
    ],
    "correct": 0,
    "explain": "The empirical relationship is Mean - Mode = 3(Mean - Median), which rearranges to Mode = 3(Median) - 2(Mean).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-7",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "What is the formula for calculating the Coefficient of Variation (C.V.), used to compare relative variability between distributions?",
    "options": [
      "C.V. = (Standard Deviation / Mean) × 100",
      "C.V. = (Mean / Standard Deviation) × 100",
      "C.V. = (Variance / Mean) × 100",
      "C.V. = (Range / Median) × 100"
    ],
    "correct": 0,
    "explain": "Coefficient of Variation expresses the standard deviation as a percentage of the arithmetic mean: C.V. = (s / X̄) × 100.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-8",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "If each observation in a dataset is multiplied by a constant factor of 3, what happens to the standard deviation?",
    "options": [
      "The standard deviation is multiplied by 3",
      "The standard deviation is multiplied by 9",
      "The standard deviation remains completely unchanged",
      "The standard deviation increases by 3"
    ],
    "correct": 0,
    "explain": "Multiplying every value by a constant c multiplies the standard deviation by $|c|$. Here, standard deviation becomes 3 × original.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-9",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "In a positively (right) skewed frequency distribution, what is the relative order of the three central tendency measures?",
    "options": [
      "Mean > Median > Mode",
      "Mode > Median > Mean",
      "Median > Mean > Mode",
      "Mean = Median = Mode"
    ],
    "correct": 0,
    "explain": "In a right-skewed distribution, extreme high values pull the mean toward the right tail, resulting in Mean > Median > Mode.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-10",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "Which measure of central tendency is mathematically most appropriate for calculating the average rate of speed over equal distance intervals?",
    "options": [
      "Harmonic Mean (H.M.)",
      "Arithmetic Mean (A.M.)",
      "Geometric Mean (G.M.)",
      "Median"
    ],
    "correct": 0,
    "explain": "Harmonic Mean is the reciprocal of the arithmetic mean of reciprocals, providing the exact average for rates and speed over fixed distances.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-11",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "For any set of positive non-identical real numbers, what strict inequality holds between their Arithmetic Mean (A.M.), Geometric Mean (G.M.), and Harmonic Mean (H.M.)?",
    "options": [
      "A.M. > G.M. > H.M.",
      "H.M. > G.M. > A.M.",
      "G.M. > A.M. > H.M.",
      "A.M. > H.M. > G.M."
    ],
    "correct": 0,
    "explain": "The AM-GM-HM inequality proves that for positive unequal numbers, A.M. > G.M. > H.M. (equality holds only if all values are identical).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-12",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "What is the Quartile Deviation (Semi-Interquartile Range) for a distribution with first quartile Q₁ = 24 and third quartile Q₃ = 40?",
    "options": [
      "8",
      "16",
      "32",
      "4"
    ],
    "correct": 0,
    "explain": "Quartile Deviation = (Q₃ - Q₁) / 2 = (40 - 24) / 2 = 16 / 2 = 8.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-13",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "If a frequency distribution has a coefficient of kurtosis β₂ = 3 (or excess kurtosis γ₂ = 0), how is the peakedness of the distribution classified?",
    "options": [
      "Mesokurtic (Normal peak)",
      "Leptokurtic (Sharply peaked)",
      "Platykurtic (Flat topped)",
      "Bimodal"
    ],
    "correct": 0,
    "explain": "A normal distribution has moment ratio β₂ = μ₄ / σ⁴ = 3 (excess kurtosis = 0) and is called mesokurtic. β₂ > 3 is leptokurtic; β₂ < 3 is platykurtic.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-14",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "The variance of 10 observations is 16. If a constant value of 5 is added to every single observation, what is the new variance?",
    "options": [
      "16",
      "21",
      "80",
      "400"
    ],
    "correct": 0,
    "explain": "Variance is independent of change of origin; adding or subtracting a constant to each value leaves the variance unchanged (Var = 16).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-15",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "What is the probability of rolling a sum of 7 when tossing two fair, six-sided dice simultaneously?",
    "options": [
      "6 / 36 (1 / 6)",
      "7 / 36",
      "5 / 36",
      "1 / 12"
    ],
    "correct": 0,
    "explain": "Pairs summing to 7 are (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 favorable outcomes out of 36 total outcomes = 6/36 = 1/6.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-16",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "For two mutually exclusive events A and B, what is the probability of their intersection P(A ∩ B)?",
    "options": [
      "0",
      "P(A) × P(B)",
      "1",
      "P(A) + P(B)"
    ],
    "correct": 0,
    "explain": "Mutually exclusive events cannot occur simultaneously, so their intersection is empty: P(A ∩ B) = 0.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-17",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "What are the two parameters of a Binomial Probability Distribution?",
    "options": [
      "n (number of independent trials) and p (probability of success)",
      "μ (mean) and σ (standard deviation)",
      "λ (arrival rate) and t (time interval)",
      "α (shape) and β (scale)"
    ],
    "correct": 0,
    "explain": "A Binomial distribution is denoted B(n, p) where n is the number of identical Bernoulli trials and p is the probability of success on each trial.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-18",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "What is the numerical value of the total area under the probability density curve of any continuous random variable?",
    "options": [
      "1.0",
      "0.5",
      "100",
      "Infinity"
    ],
    "correct": 0,
    "explain": "By the second axiom of probability, the integral of any valid probability density function across its entire domain equals exactly 1.0.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-19",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "In a Standard Normal Distribution Z ~ N(0, 1), what are the values of the Mean and Variance respectively?",
    "options": [
      "Mean = 0, Variance = 1",
      "Mean = 1, Variance = 0",
      "Mean = 0, Variance = 0",
      "Mean = 1, Variance = 1"
    ],
    "correct": 0,
    "explain": "A standard normal variable Z has a mean of 0 and a standard deviation (and variance) of 1.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-20",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "For two independent events A and B with P(A) = 0.4 and P(B) = 0.5, what is the probability P(A ∪ B)?",
    "options": [
      "0.70",
      "0.90",
      "0.20",
      "0.60"
    ],
    "correct": 0,
    "explain": "P(A ∩ B) = 0.4 × 0.5 = 0.20. P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.4 + 0.5 - 0.20 = 0.70.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-21",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "In a Poisson distribution with mean parameter λ, what is the mathematical relationship between the Mean and the Variance?",
    "options": [
      "Mean = Variance = λ",
      "Variance = $Mean^{2}$ = λ²",
      "Mean > Variance",
      "Variance = λ / 2"
    ],
    "correct": 0,
    "explain": "A unique characteristic of the Poisson distribution is that its mean and variance are identical and equal to parameter λ.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-22",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "In a Binomial distribution B(n, p), what are the formulas for the expected value (mean) and variance respectively?",
    "options": [
      "Mean = np, Variance = npq (where q = 1 - p)",
      "Mean = np, Variance = np",
      "Mean = n/p, Variance = n/$p^{2}$",
      "Mean = p/n, Variance = pq/n"
    ],
    "correct": 0,
    "explain": "For B(n, p), E(X) = np and Var(X) = np(1 - p) = npq.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-23",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "According to the Empirical Rule (68-95-99.7 rule) for a normal distribution, what percentage of values lie within μ ± 2σ?",
    "options": [
      "Approximately 95.45%",
      "Approximately 68.27%",
      "Approximately 99.73%",
      "Approximately 50.00%"
    ],
    "correct": 0,
    "explain": "In a normal distribution, ~68.3% falls within 1 SD, ~95.45% within 2 SDs, and ~99.73% within 3 SDs.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-24",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "What is the conditional probability formula P(A | B), assuming P(B) > 0?",
    "options": [
      "P(A | B) = P(A ∩ B) / P(B)",
      "P(A | B) = P(A ∩ B) / P(A)",
      "P(A | B) = P(A) / P(B)",
      "P(A | B) = P(A) × P(B)"
    ],
    "correct": 0,
    "explain": "By definition of conditional probability, P(A | B) = P(A ∩ B) / P(B) for P(B) > 0.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-25",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "Under what limiting conditions does a Binomial distribution B(n, p) converge to a Poisson distribution?",
    "options": [
      "When n → ∞, p → 0, such that the product np = λ remains constant and finite",
      "When n → ∞ and p = 0.5",
      "When n < 30 and p > 0.9",
      "When both n and p approach infinity simultaneously"
    ],
    "correct": 0,
    "explain": "The Poisson distribution is the law of rare events, derived as the limit of B(n, p) as n → ∞ and p → 0 with np = λ constant.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-26",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "What is the probability of obtaining exactly 3 heads when tossing a fair coin 5 times?",
    "options": [
      "10 / 32 (5 / 16)",
      "5 / 32",
      "1 / 2",
      "15 / 32"
    ],
    "correct": 0,
    "explain": "P(X = 3) = $\\binom{5}{3}$ × (0.5)^{3} × (0.5)^{2} = 10 × (1/32) = 10/32 = 5/16.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-27",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "If a random variable X has mean E(X) = 10 and variance Var(X) = 4, what is the expected value of E($X^{2}$)?",
    "options": [
      "104",
      "100",
      "16",
      "96"
    ],
    "correct": 0,
    "explain": "Var(X) = E($X^{2}$) - [E(X)]² → 4 = E($X^{2}$) - 100 → E($X^{2}$) = 100 + 4 = 104.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-28",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "What does Bayes' Theorem calculate in statistical inference?",
    "options": [
      "Posterior probability of an event given prior probability and conditional likelihood evidence",
      "The marginal variance of two correlated continuous variables",
      "The exact sample size required for zero standard error",
      "The degree of peakedness in a multimodal probability density"
    ],
    "correct": 0,
    "explain": "Bayes' theorem computes posterior probability: P(Ai | B) = [P(B | Ai)P(Ai)] / ∑[P(B | Aj)P(Aj)], updating prior beliefs with observed evidence.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-29",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What is any measurable numerical characteristic calculated from a sample called?",
    "options": [
      "Statistic",
      "Parameter",
      "Population constant",
      "Census constant"
    ],
    "correct": 0,
    "explain": "A numerical measure calculated from sample data is a statistic (e.g., sample mean x̄); a measure describing an entire population is a parameter (e.g., μ).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-30",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What is the Standard Error of the mean (S.E.) for a simple random sample of size n drawn from a population with standard deviation σ?",
    "options": [
      "σ / $\\sqrt${n}",
      "σ² / n",
      "σ / n",
      "σ × $\\sqrt${n}"
    ],
    "correct": 0,
    "explain": "The standard error of the sample mean is the standard deviation of its sampling distribution: SE(x̄) = σ / $\\sqrt${n}.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-31",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "How many total possible samples of size n = 2 can be drawn from a population of size N = 5 WITH replacement?",
    "options": [
      "25 samples ($N^{n}$)",
      "10 samples",
      "20 samples",
      "12 samples"
    ],
    "correct": 0,
    "explain": "With replacement, each selection is independent: $N^{n} =  5^{2}$ = 25 possible samples.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-32",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "An estimator θ̂ is called an \"unbiased estimator\" of parameter θ if its expected value satisfies:",
    "options": [
      "E(θ̂) = θ",
      "E(θ̂) = 0",
      "Var(θ̂) = θ",
      "E(θ̂) = 1"
    ],
    "correct": 0,
    "explain": "An estimator is unbiased if its expected value equals the true population parameter: E(θ̂) = θ.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-33",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "According to the Central Limit Theorem (CLT), as the sample size n becomes sufficiently large (typically n ≥ 30), what happens to the sampling distribution of the sample mean x̄?",
    "options": [
      "It approaches a normal distribution regardless of the shape of the parent population",
      "It becomes uniform across all intervals",
      "It adopts the exact shape of the underlying population",
      "Its variance increases proportionally to n"
    ],
    "correct": 0,
    "explain": "CLT states that for large n, the distribution of sample mean approaches N(μ, σ²/n), regardless of the original population distribution.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-34",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "When sampling WITHOUT replacement from a finite population of size N, what finite population correction factor (FPC) is multiplied into the standard error formula?",
    "options": [
      "√((N - n) / (N - 1))",
      "(N - n) / (N - 1)",
      "√((N - 1) / (N - n))",
      "(N - 1) / N"
    ],
    "correct": 0,
    "explain": "Without replacement from a finite population, the standard error is adjusted by the finite population multiplier √[(N - n)/(N - 1)].",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-35",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "What is the critical Z-value (Z_α/2) used to construct a two-sided 95% confidence interval for a population mean?",
    "options": [
      "1.96",
      "1.645",
      "2.576",
      "2.33"
    ],
    "correct": 0,
    "explain": "For a 95% confidence interval, α = 0.05, α/2 = 0.025, and the critical standard normal value is Z = 1.96.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-36",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "Why is the sample variance formula divided by (n - 1) instead of n when estimating the population variance σ² from sample data?",
    "options": [
      "To correct for downward bias, making $s^{2}$ = ∑(x - x̄)² / (n - 1) an unbiased estimator (Bessel's correction)",
      "To account for measurement instrument inaccuracies",
      "To ensure the variance is always an integer",
      "Because one observation is always discarded as an outlier"
    ],
    "correct": 0,
    "explain": "Dividing by n underestimates σ²; Bessel's correction dividing by degrees of freedom (n - 1) produces an unbiased estimator: E($s^{2}$) = σ².",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-37",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "If the sample size n is quadrupled from 25 to 100, what happens to the standard error of the mean?",
    "options": [
      "The standard error is halved (reduced by 50%)",
      "The standard error is reduced to 1/4th of its value",
      "The standard error doubles",
      "The standard error remains unchanged"
    ],
    "correct": 0,
    "explain": "Since SE = σ / $\\sqrt${n}, quadrupling n (4n) divides the standard error by $\\sqrt${4} = 2, halving it.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-38",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "A sample of 64 observations from a population with known standard deviation σ = 16 has a sample mean x̄ = 50. What is the 95% confidence interval for the population mean μ?",
    "options": [
      "46.08 to 53.92",
      "48.04 to 51.96",
      "45.00 to 55.00",
      "42.16 to 57.84"
    ],
    "correct": 0,
    "explain": "SE = 16 / $\\sqrt${64} = 16 / 8 = 2. Margin of error = 1.96 × 2 = 3.92. CI = 50 ± 3.92 = [46.08, 53.92].",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-39",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "What property must an estimator possess if, as sample size n approaches infinity, the probability that the estimator differs from the parameter by any arbitrary amount approaches zero?",
    "options": [
      "Consistency",
      "Efficiency",
      "Sufficiency",
      "Unbiasedness"
    ],
    "correct": 0,
    "explain": "Consistency means the estimator converges in probability to the true population parameter as n → ∞.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-40",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "In Stratified Random Sampling, when is Neyman Optimal Allocation used to determine stratum sample sizes?",
    "options": [
      "When stratum variances differ, allocating larger sample sizes to larger and more variable strata",
      "When all strata have identical standard deviations",
      "When costs per unit are equal and variances are negligible",
      "When the population cannot be partitioned into homogeneous subgroups"
    ],
    "correct": 0,
    "explain": "Neyman allocation determines stratum sample size n_h proportional to N_h × σ_h, minimizing sample variance for a fixed overall sample size.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-41",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "Between two unbiased estimators θ̂₁ and θ̂₂ of parameter θ, why is θ̂₁ called \"more efficient\" than θ̂₂?",
    "options": [
      "Var(θ̂₁) < Var(θ̂₂)",
      "E(θ̂₁) > E(θ̂₂)",
      "θ̂₁ can be computed in fewer arithmetic steps",
      "θ̂₁ is derived from a smaller sample size"
    ],
    "correct": 0,
    "explain": "Statistical efficiency compares the sampling variances of unbiased estimators: the estimator with the smaller variance is more efficient.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-42",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "What is the required sample size n to estimate a population mean within a margin of error E = 2 with 95% confidence (Z = 1.96), given population variance σ² = 64?",
    "options": [
      "62 (rounded up from 61.47)",
      "16",
      "32",
      "128"
    ],
    "correct": 0,
    "explain": "n = (Z × σ / E)^{2} = (1.96 × 8 / 2)^{2} = (7.84)^{2} = 61.47 → 62.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-43",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "In statistical testing, what does the Null Hypothesis (H₀) typically state?",
    "options": [
      "There is no significant difference, effect, or relationship (status quo)",
      "The proposed treatment causes a massive significant increase",
      "The sample parameter is exactly equal to the alternative hypothesis",
      "The probability of error is zero"
    ],
    "correct": 0,
    "explain": "The null hypothesis (H0) posits no real effect, difference, or association, serving as the benchmark tested against evidence.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-44",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "What error is committed when a true null hypothesis (H₀) is mistakenly rejected?",
    "options": [
      "Type I error (False Positive, probability α)",
      "Type II error (False Negative, probability β)",
      "Standard error",
      "Systematic bias error"
    ],
    "correct": 0,
    "explain": "Rejecting H0 when H0 is actually true is a Type I error; its maximum probability is the level of significance α.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-45",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "What is the statistical power of a hypothesis test defined as?",
    "options": [
      "1 - β (Probability of correctly rejecting a false null hypothesis)",
      "1 - α",
      "α + β",
      "β / α"
    ],
    "correct": 0,
    "explain": "The power of a test is 1 - β, the probability of correctly rejecting H0 when H1 is true.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-46",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "When testing a hypothesis about a single population mean with a small sample (n < 30) and unknown population variance σ², which test statistic is appropriate?",
    "options": [
      "Student's t-test with (n - 1) degrees of freedom",
      "Standard Normal Z-test",
      "Chi-Square goodness of fit test",
      "Snedecor's F-test"
    ],
    "correct": 0,
    "explain": "When n < 30 and σ is unknown (estimated by sample SD s), the test statistic follows Student's t-distribution with df = n - 1.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-47",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "What is the decision rule in hypothesis testing when using the p-value approach with significance level α?",
    "options": [
      "Reject H₀ if p-value ≤ α",
      "Reject H₀ if p-value > α",
      "Accept H₀ if p-value < α / 2",
      "Reject H₁ if p-value ≤ α"
    ],
    "correct": 0,
    "explain": "If the p-value is less than or equal to the significance level α, the observed result is statistically significant and H0 is rejected.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-48",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "What error is committed when an investigator fails to reject a false null hypothesis (H₀)?",
    "options": [
      "Type II error (False Negative, probability β)",
      "Type I error",
      "Sampling error",
      "Measurement rounding error"
    ],
    "correct": 0,
    "explain": "A Type II error occurs when H0 is false, but the test fails to reject it. Its probability is denoted by β.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-49",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "In a contingency table with r rows and c columns, what are the degrees of freedom for the Chi-Square (χ²) test of independence of attributes?",
    "options": [
      "(r - 1)(c - 1)",
      "r × c - 1",
      "(r + c) - 1",
      "(r - 1) + (c - 1)"
    ],
    "correct": 0,
    "explain": "For an r × c contingency table, degrees of freedom are (r - 1)(c - 1).",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-50",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "When is a two-tailed hypothesis test used instead of a one-tailed test?",
    "options": [
      "When the alternative hypothesis H₁ specifies an inequality (μ ≠ μ₀) in either direction",
      "When the alternative hypothesis specifies strictly μ > μ₀",
      "When the sample size is greater than 1000",
      "When the population variance is strictly zero"
    ],
    "correct": 0,
    "explain": "A two-tailed test is employed when H1 is non-directional (μ ≠ μ0), testing for significant deviations in either direction.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-51",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "What is the formula for the Chi-Square test statistic used in testing goodness-of-fit or independence?",
    "options": [
      "χ² = ∑[(O - E)^{2} / E]",
      "χ² = ∑[(O - E) / $E^{2}$]",
      "χ² = ∑[(O - E)^{2} / O]",
      "χ² = ∑[($O^{2} -  E^{2}$) / E]"
    ],
    "correct": 0,
    "explain": "The Chi-Square statistic sums squared differences between observed (O) and expected (E) frequencies divided by expected: χ² = ∑[(O - E)^{2} / E].",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-52",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "In a two-tailed Z-test with α = 0.05, the calculated test statistic is Z_calc = -2.35. What is the statistical conclusion?",
    "options": [
      "Reject H₀ because |-2.35| > 1.96 (the result falls in the critical rejection region)",
      "Fail to reject H₀ because -2.35 is negative",
      "Accept H₀ with 99% certainty",
      "The test is inconclusive without knowing degrees of freedom"
    ],
    "correct": 0,
    "explain": "Critical values for two-tailed α = 0.05 are ±1.96. Since -2.35 < -1.96, the test statistic falls in the critical region, so H0 is rejected.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-53",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "When testing for the equality of variances between two independent normally distributed populations (σ₁² = σ₂²), which test statistic is used?",
    "options": [
      "F-test (F = s₁² / s₂² where s₁² > s₂²)",
      "Student's t-test with n₁ + n₂ - 2 degrees of freedom",
      "Z-score difference test",
      "Mann-Whitney U-test"
    ],
    "correct": 0,
    "explain": "The F-test (variance ratio test) compares two sample variances: F = s₁² / s₂² with (n₁ - 1, n₂ - 1) degrees of freedom.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-54",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "Under what experimental design is a Paired-Sample t-test mandatory rather than an independent two-sample t-test?",
    "options": [
      "When two sets of observations are matched, paired, or collected from the same subjects in a before-and-after repeated measures study",
      "When the two samples have drastically different sample sizes",
      "When both population variances are known and identical",
      "When the data is measured on a nominal categorical scale"
    ],
    "correct": 0,
    "explain": "A paired t-test analyzes differences d = x₁ - x₂ between matched pairs (e.g. before-and-after tests on the same subjects), removing subject variability.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-55",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "In Chi-Square testing, what is the expected frequency formula for a cell in row i and column j of an r × c contingency table under H₀?",
    "options": [
      "E_ij = (Row i Total × Column j Total) / Grand Total (N)",
      "E_ij = (Row i Total + Column j Total) / 2",
      "E_ij = Grand Total / (r × c)",
      "E_ij = (Row i Total - Column j Total) / N"
    ],
    "correct": 0,
    "explain": "Under independence, E_ij = P(Row i) × P(Col j) × N = (R_i / N) × (C_j / N) × N = (R_i × C_j) / N.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-56",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "If the significance level α is decreased from 0.05 to 0.01 while keeping sample size n constant, what happens to the probability of Type II error (β) and the Power (1 - β)?",
    "options": [
      "Type II error β increases, and Power (1 - β) decreases",
      "Type II error β decreases, and Power increases",
      "Both Type I error and Type II error decrease simultaneously",
      "Neither β nor Power change"
    ],
    "correct": 0,
    "explain": "For fixed n, reducing α makes the rejection region smaller and more stringent, increasing the risk of Type II error (β) and decreasing power (1 - β).",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-57",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "What is the numerical range of Pearson's product-moment correlation coefficient (r)?",
    "options": [
      "-1 ≤ r ≤ +1",
      "0 ≤ r ≤ 1",
      "-∞ < r < +∞",
      "-1 < r < 0"
    ],
    "correct": 0,
    "explain": "Pearson's correlation coefficient r is bounded strictly between -1.0 (perfect negative linear correlation) and +1.0 (perfect positive linear correlation).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-58",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "What does a correlation coefficient r = 0 indicate regarding the relationship between two variables X and Y?",
    "options": [
      "No linear association between X and Y",
      "A perfect non-linear parabolic association",
      "That X and Y are identical variables",
      "That both variables have zero variance"
    ],
    "correct": 0,
    "explain": "An r value of zero signifies the absence of any linear relationship (though non-linear relationships could still exist).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-59",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "In the simple linear regression equation Ŷ = a + bX, what does parameter 'b' represent?",
    "options": [
      "The slope (regression coefficient) indicating the expected change in Y for a one-unit change in X",
      "The Y-intercept when X equals zero",
      "The coefficient of determination",
      "The total sum of squared residuals"
    ],
    "correct": 0,
    "explain": "In Ŷ = a + bX, b is the slope (regression coefficient of Y on X), measuring the rate of change of Ŷ per unit increase in X.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-60",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "What graphical representation plots pairs of bivariate observations (X, Y) as individual points on a Cartesian plane?",
    "options": [
      "Scatter Diagram",
      "Histogram",
      "Ogive curve",
      "Pareto chart"
    ],
    "correct": 0,
    "explain": "A scatter plot/diagram visually displays bivariate data points to inspect the direction and strength of association.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-61",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "What is the sign of the correlation coefficient r if both regression coefficients b_yx and b_xy are negative?",
    "options": [
      "Negative (r is always negative when both slopes are negative)",
      "Positive (since square root is positive)",
      "Zero",
      "Undefined"
    ],
    "correct": 0,
    "explain": "The correlation coefficient r has the exact same mathematical sign as both regression coefficients: if b_yx and b_xy are negative, r is negative.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-62",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "What does the Coefficient of Determination ($r^{2}$) quantify in regression analysis?",
    "options": [
      "The proportion of total variation in the dependent variable Y explained by the independent variable X",
      "The slope of the orthogonal regression line",
      "The ratio of the sample sizes",
      "The probability that the true slope is zero"
    ],
    "correct": 0,
    "explain": "$r^{2}$ (coefficient of determination) measures the fraction of total variance in Y that is accounted for by the linear model with X.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-63",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "What is the mathematical relationship between the correlation coefficient r and the two regression coefficients b_yx and b_xy?",
    "options": [
      "r = ±$\\sqrt${b_yx × b_xy}",
      "r = (b_yx + b_xy) / 2",
      "r = b_yx / b_xy",
      "r = b_yx × b_xy"
    ],
    "correct": 0,
    "explain": "The correlation coefficient is the geometric mean of the two regression slopes: r = ±$\\sqrt${b_yx × b_xy}.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-64",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "What criterion does the Method of Ordinary Least Squares (OLS) use to fit the best regression line?",
    "options": [
      "Minimizing the sum of squared vertical residuals: ∑(Y - Ŷ)²",
      "Maximizing the sum of horizontal deviations",
      "Setting the sum of absolute errors to infinity",
      "Equating the mean of X to the variance of Y"
    ],
    "correct": 0,
    "explain": "OLS determines intercept 'a' and slope 'b' such that the sum of squared errors ∑(Y_i - Ŷ_i)^{2} is minimized.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-65",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "At what specific coordinate point do the two regression lines (Y on X and X on Y) always intersect?",
    "options": [
      "(X̄, Ȳ) — the point of means",
      "(0, 0) — the origin",
      "(s_x, s_y) — the point of standard deviations",
      "(Median_X, Median_Y)"
    ],
    "correct": 0,
    "explain": "Both regression lines pass through the centroid of bivariate data: the point of means (X̄, Ȳ).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-66",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "If the two regression coefficients are b_yx = 0.8 and b_xy = 0.45, what is the value of the correlation coefficient r?",
    "options": [
      "+0.60",
      "+0.36",
      "+0.625",
      "+0.80"
    ],
    "correct": 0,
    "explain": "r = $\\sqrt${b_yx × b_xy} = $\\sqrt${0.8 × 0.45} = $\\sqrt${0}.36 = +0.60.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-67",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "If the correlation coefficient between X and Y is r = 0.8, what percentage of the variance in Y remains unexplained by variable X?",
    "options": [
      "36% (0.36)",
      "64% (0.64)",
      "20% (0.20)",
      "80% (0.80)"
    ],
    "correct": 0,
    "explain": "Explained variation $r^{2}$ = (0.8)^{2} = 0.64 (64%). Unexplained variation is 1 - $r^{2}$ = 1 - 0.64 = 0.36 = 36%.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-68",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "If the two regression lines are completely perpendicular to each other (angle θ = $90^\\circ$), what is the correlation coefficient r?",
    "options": [
      "r = 0",
      "r = +1",
      "r = -1",
      "r = ±0.5"
    ],
    "correct": 0,
    "explain": "tan θ = (1 - $r^{2}$) / $|r|$ × [s_x s_y / (s_$x^{2}$ + s_$y^{2}$)]. When lines are perpendicular (θ = $90^\\circ$), tan θ → ∞, which occurs when r = 0.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-69",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "What is the formula for Spearman's Rank Correlation Coefficient (r_s) when there are no tied ranks across n paired observations?",
    "options": [
      "r_s = 1 - [6∑$d^{2}$ / (n($n^{2}$ - 1))]",
      "r_s = 1 + [6∑$d^{2}$ / (n($n^{2}$ - 1))]",
      "r_s = 1 - [∑$d^{2} /  n^{3}$]",
      "r_s = [6∑$d^{2}$ / ($n^{2}$ - 1)]"
    ],
    "correct": 0,
    "explain": "Spearman's rank correlation formula without ties is r_s = 1 - [6∑$d^{2}$ / (n($n^{2}$ - 1))], where d is the rank difference for each pair.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-70",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "How is Pearson's correlation coefficient r affected by a change of origin and change of scale on the variables: U = (X - a)/c and V = (Y - b)/d, where c > 0 and d > 0?",
    "options": [
      "r is completely invariant to both changes of origin and positive changes of scale",
      "r is multiplied by (c × d)",
      "r increases by (a + b)",
      "r is squared"
    ],
    "correct": 0,
    "explain": "The correlation coefficient r is a pure dimensionless number, invariant to changes of origin and positive scale changes: r_uv = r_xy.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-71",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What weighting system does the Laspeyres Price Index use when calculating price changes across time?",
    "options": [
      "Base year quantities (q₀)",
      "Current year quantities (qₙ)",
      "Average quantities of base and current years",
      "Fixed constant unit weights of 1"
    ],
    "correct": 0,
    "explain": "Laspeyres index is base-weighted: P₀ₙ = [∑(pₙq₀) / ∑(p₀q₀)] × 100.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-72",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What weighting system does the Paasche Price Index employ?",
    "options": [
      "Current year quantities (qₙ)",
      "Base year quantities (q₀)",
      "Base year prices (p₀)",
      "Target future quantities"
    ],
    "correct": 0,
    "explain": "Paasche index is current-weighted: P₀ₙ = [∑(pₙqₙ) / ∑(p₀qₙ)] × 100.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-73",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "Fisher's \"Ideal\" Index Number is mathematically defined as:",
    "options": [
      "The Geometric Mean of the Laspeyres and Paasche index numbers (√[L × P])",
      "The Arithmetic Mean of Laspeyres and Paasche index numbers",
      "The Harmonic Mean of Laspeyres and Paasche index numbers",
      "Laspeyres index multiplied by Paasche index"
    ],
    "correct": 0,
    "explain": "Irving Fisher's Ideal Index is the geometric mean of Laspeyres (L) and Paasche (P): Fisher = $\\sqrt${L × P}.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-74",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What are the four classical components that constitute an economic Time Series?",
    "options": [
      "Secular Trend (T), Seasonal Variations (S), Cyclical Fluctuations (C), and Irregular/Random Variations (I)",
      "Mean, Variance, Skewness, and Kurtosis",
      "Price, Quantity, Value, and Weight",
      "Base year, Current year, Index, and Deflator"
    ],
    "correct": 0,
    "explain": "Classical time series decomposition identifies four components: Trend (T), Seasonal (S), Cyclical (C), and Irregular (I).",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-75",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "Which component of a time series represents regular, repeating periodic movements within a single annual cycle (e.g., umbrella sales in monsoon)?",
    "options": [
      "Seasonal Variation (S)",
      "Secular Trend (T)",
      "Cyclical Fluctuation (C)",
      "Irregular Variation (I)"
    ],
    "correct": 0,
    "explain": "Seasonal variations are recurring intra-year patterns caused by weather seasons, holidays, and institutional calendars.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-76",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "Why is Fisher's Index called an \"Ideal\" index number in economic statistics?",
    "options": [
      "It satisfies both the Time Reversal Test and the Factor Reversal Test",
      "It uses zero weights and requires no quantity data",
      "It is computationally simpler than simple aggregative indices",
      "It eliminates the need for selecting a base year"
    ],
    "correct": 0,
    "explain": "Fisher's formula satisfies both rigorous consistency tests: Time Reversal Test (P₀₁ × P₁₀ = 1) and Factor Reversal Test (P₀₁ × Q₀₁ = V₀₁).",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-77",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "In the multiplicative model of time series decomposition, how is the observed series Y_t expressed?",
    "options": [
      "Y_t = T × S × C × I",
      "Y_t = T + S + C + I",
      "Y_t = (T + S) × (C + I)",
      "Y_t = T / (S × C × I)"
    ],
    "correct": 0,
    "explain": "The multiplicative model assumes components interact proportionally: Y = T × S × C × I, where S, C, and I are expressed as indices/ratios around 1.0.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-78",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "Which method of trend estimation fits a mathematical trend line by minimizing the sum of squared deviations from observed data points?",
    "options": [
      "Method of Least Squares",
      "Method of Moving Averages",
      "Freehand Graphic Method",
      "Method of Semi-Averages"
    ],
    "correct": 0,
    "explain": "The Method of Least Squares fits an analytical trend equation (e.g. Y = a + bX) minimizing ∑(Y - Ŷ)².",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-79",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "What is a recognized disadvantage of using a 3-year or 5-year Moving Average to smooth out short-term fluctuations in a time series?",
    "options": [
      "Trend values cannot be calculated for the beginning and end periods (loss of data at both ends)",
      "It cannot eliminate linear trend",
      "It introduces complex quadratic curvature into linear series",
      "It requires equal weighting of all past centuries"
    ],
    "correct": 0,
    "explain": "An m-period moving average cannot provide trend estimates for the first and last (m - 1)/2 periods, losing endpoint information.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-80",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "If the Laspeyres Price Index is L = 144 and the Paasche Price Index is P = 100, what is Fisher's Ideal Price Index?",
    "options": [
      "120",
      "122",
      "14400",
      "110"
    ],
    "correct": 0,
    "explain": "Fisher's Index = $\\sqrt${L × P} = $\\sqrt${144 × 100} = $\\sqrt${14400} = 120.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-81",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "What mathematical condition is required for an index number formula to satisfy the Time Reversal Test (excluding the factor 100)?",
    "options": [
      "P₀₁ × P₁₀ = 1",
      "P₀₁ / P₁₀ = 1",
      "P₀₁ + P₁₀ = 0",
      "P₀₁ × Q₀₁ = 1"
    ],
    "correct": 0,
    "explain": "The time reversal test requires that reversing the time subscripts produces the reciprocal of the forward index: P₀₁ × P₁₀ = 1.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-82",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "In the method of least squares for linear trend Y = a + bX with an odd number of years (e.g., N = 7), what simplification occurs when the origin X = 0 is placed at the middle year?",
    "options": [
      "∑X = 0, so the normal equations simplify to a = ∑Y / N and b = ∑XY / ∑$X^{2}$",
      "b becomes identically zero",
      "All squared residuals sum to zero",
      "a equals the sample variance of Y"
    ],
    "correct": 0,
    "explain": "Placing origin at the middle year makes ∑X = 0, simplifying the normal equations to direct formulas: a = ∑Y/N and b = ∑XY/∑$X^{2}$.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-83",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "What test of index numbers is satisfied when the product of the price index and the quantity index equals the true value ratio: P₀₁ × Q₀₁ = ∑(p₁q₁) / ∑(p₀q₀)?",
    "options": [
      "Factor Reversal Test",
      "Time Reversal Test",
      "Circular Test",
      "Base Shifting Test"
    ],
    "correct": 0,
    "explain": "The Factor Reversal Test mandates that interchanging prices and quantities yields the true value ratio V₀₁ = ∑(p₁q₁) / ∑(p₀q₀).",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-84",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "How does Laspeyres Price Index typically behave relative to the true cost-of-living index during periods of inflation?",
    "options": [
      "It overstates (upward bias) price increases because it assumes consumers maintain a fixed base-period basket without substituting cheaper goods",
      "It understates inflation because it uses current-period quantities",
      "It equals the true geometric cost of living index exactly",
      "It exhibits zero substitution bias under all economic conditions"
    ],
    "correct": 0,
    "explain": "Laspeyres has an upward substitution bias: by holding base quantities fixed, it fails to account for consumer substitution toward relatively cheaper items.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-85",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "Which measure of central tendency is the most suitable average for computing the average rate of speed over equal distances or price per unit?",
    "options": [
      "Arithmetic Mean",
      "Geometric Mean",
      "Harmonic Mean",
      "Median"
    ],
    "correct": 2,
    "explain": "Harmonic Mean is the reciprocal of the arithmetic mean of the reciprocals and is mathematically appropriate for rates and ratios involving equal distance/work.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-86",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "For the dataset {4, 7, 7, 9, 10, 12, 14}, what is the median value?",
    "options": [
      "7",
      "9",
      "8.5",
      "10"
    ],
    "correct": 1,
    "explain": "There are n = 7 ordered observations. The median is the (7 + 1)/2 = 4th observation, which is 9.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-87",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "What is the sum of the deviations of a set of observations taken from their arithmetic mean, Σ(X - X̄)?",
    "options": [
      "Always greater than zero",
      "Always zero",
      "Equal to the variance",
      "Equal to n · X̄"
    ],
    "correct": 1,
    "explain": "By the algebraic property of the arithmetic mean, the algebraic sum of deviations from the mean is always exactly zero: Σ(X - X̄) = 0.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-88",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "Which measure of dispersion is expressed as a pure, unitless percentage to compare the relative variability of two distributions with different units?",
    "options": [
      "Standard Deviation",
      "Variance",
      "Range",
      "Coefficient of Variation (C.V.)"
    ],
    "correct": 3,
    "explain": "Coefficient of Variation is C.V. = (s / X̄) * 100%, expressing dispersion as a dimensionless relative percentage.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-89",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "In a frequency distribution, if the mean is 45 and the mode is 42, what is the empirical estimate of the median?",
    "options": [
      "43",
      "44",
      "46",
      "41"
    ],
    "correct": 1,
    "explain": "By Pearson's empirical relationship: Mode = 3·Median - 2·Mean. Thus: 42 = 3·Median - 2(45) \\implies 42 = 3·Median - 90 \\implies 3·Median = 132 \\implies Median = 44.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-90",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "If each observation in a dataset is multiplied by a constant c = 3, what happens to the variance of the transformed dataset?",
    "options": [
      "The variance remains unchanged",
      "The variance is multiplied by 3",
      "The variance is multiplied by 9 ($3^{2}$)",
      "The variance is increased by 3"
    ],
    "correct": 2,
    "explain": "By the properties of variance: Var(cX) = $c^{2}$ · Var(X). When multiplied by 3, the new variance is $3^{2}$ = 9 times the original variance.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-91",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "In a unimodal frequency curve skewed to the right (positively skewed), what is the correct relative ordering of the Mean, Median, and Mode?",
    "options": [
      "Mean < Median < Mode",
      "Mode < Median < Mean",
      "Median < Mode < Mean",
      "Mean = Median = Mode"
    ],
    "correct": 1,
    "explain": "In a positively skewed distribution, the long right tail pulls the mean to the highest value, so Mode < Median < Mean.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-92",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "What is the value of the second moment about the mean, μ2?",
    "options": [
      "Mean",
      "Variance",
      "Standard Error",
      "Coefficient of Skewness"
    ],
    "correct": 1,
    "explain": "The second central moment is μ2 = Σ(X - X̄)^2 / N, which by definition is the population variance.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-93",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "A distribution with moment coefficient of kurtosis β2 = 3 (or excess kurtosis γ2 = 0) is classified as:",
    "options": [
      "Leptokurtic",
      "Platykurtic",
      "Mesokurtic",
      "Bimodal"
    ],
    "correct": 2,
    "explain": "A distribution with β2 = 3 (identical to the normal distribution kurtosis) is called mesokurtic. Values > 3 are leptokurtic; < 3 are platykurtic.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-94",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "Given first quartile Q1 = 30 and third quartile Q3 = 70, what is the Semi-Interquartile Range (Quartile Deviation)?",
    "options": [
      "40",
      "20",
      "50",
      "10"
    ],
    "correct": 1,
    "explain": "The Quartile Deviation is Q.D. = (Q3 - Q1) / 2 = (70 - 30) / 2 = 20.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-95",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "According to Chebyshev's Inequality, what is the minimum proportion of any distribution's observations that must fall within k = 2 standard deviations of the mean?",
    "options": [
      "50%",
      "68%",
      "75%",
      "95%"
    ],
    "correct": 2,
    "explain": "Chebyshev's theorem states P(|X - μ| < kσ) ≥ 1 - 1/$k^{2}$. For k = 2: 1 - 1/4 = 3/4 = 75% for any arbitrary distribution.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-96",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "Under Bowley's coefficient of skewness Sk_B = (Q3 + Q1 - 2·Q2) / (Q3 - Q1), if Q1 = 20, Q2 = 35, and Q3 = 60, what is the coefficient of skewness?",
    "options": [
      "+0.25",
      "-0.25",
      "+0.15",
      "0.00"
    ],
    "correct": 0,
    "explain": "Sk_B = (60 + 20 - 2(35)) / (60 - 20) = (80 - 70) / 40 = 10 / 40 = +0.25.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-97",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "When calculating moments from grouped frequency distributions, what do Sheppard's corrections adjust for?",
    "options": [
      "Missing data values in the tails",
      "Grouping error caused by assuming observations are concentrated at the class midpoints",
      "Non-linear scale transformations",
      "Outliers identified by boxplot whiskers"
    ],
    "correct": 1,
    "explain": "Sheppard's corrections adjust the central moments for the grouping error arising from the assumption that frequencies are concentrated at the class midpoints.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-98",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "If the relationship between two variables is given by Y = 10 - 2X, and the variance of X is 4, what is the standard deviation of Y?",
    "options": [
      "4",
      "-4",
      "2",
      "16"
    ],
    "correct": 0,
    "explain": "Var(Y) = Var(10 - 2X) = $(-2)^{2}$ · Var(X) = 4 · 4 = 16. Standard deviation is SD(Y) = $\\sqrt{16}$ = 4 (dispersion is always non-negative).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-99",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "Two unbiased six-sided dice are rolled simultaneously. What is the probability that the sum of the numbers showing is 7?",
    "options": [
      "1/6",
      "1/12",
      "7/36",
      "1/36"
    ],
    "correct": 0,
    "explain": "Out of 36 equally likely outcomes, the pairs summing to 7 are (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) — exactly 6 outcomes. P = 6/36 = 1/6.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-100",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "If events A and B are mutually exclusive, what is P(A ∩ B)?",
    "options": [
      "P(A) · P(B)",
      "0",
      "1",
      "P(A) + P(B)"
    ],
    "correct": 1,
    "explain": "Mutually exclusive events cannot occur simultaneously, so their intersection is the null event: P(A ∩ B) = 0.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-101",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "In a single throw of a fair coin 4 times, what is the probability of obtaining exactly 2 heads?",
    "options": [
      "1/4",
      "3/8",
      "1/2",
      "5/16"
    ],
    "correct": 1,
    "explain": "By binomial formula: P(X=2) = $\\binom{4}{2}$ · $(1/2)^{2}$ · $(1/2)^{2}$ = 6 · 1/16 = 6/16 = 3/8.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-102",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "What is the sum of all probabilities in a discrete probability distribution, Σ P(X = x)?",
    "options": [
      "0",
      "0.5",
      "1",
      "Infinity"
    ],
    "correct": 2,
    "explain": "The total probability across an exhaustive and mutually exclusive sample space is always exactly 1.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-103",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "What are the mean (μ) and variance (σ^2) of the standard normal distribution Z?",
    "options": [
      "μ = 0, σ^2 = 1",
      "μ = 1, σ^2 = 0",
      "μ = 1, σ^2 = 1",
      "μ = 0, σ^2 = 0"
    ],
    "correct": 0,
    "explain": "The standard normal distribution is specifically normalized so that its mean μ = 0 and variance σ^2 = 1.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-104",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "Given P(A) = 0.6, P(B) = 0.5, and P(A ∩ B) = 0.3. What is the conditional probability P(A | B)?",
    "options": [
      "0.6",
      "0.5",
      "0.3",
      "0.18"
    ],
    "correct": 0,
    "explain": "By definition of conditional probability: P(A | B) = P(A ∩ B) / P(B) = 0.3 / 0.5 = 0.6. (Since P(A|B) = P(A), A and B are also independent).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-105",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "For a Binomial distribution with n = 100 trials and probability of success p = 0.2, what are its mean and variance?",
    "options": [
      "Mean = 20, Variance = 16",
      "Mean = 20, Variance = 20",
      "Mean = 80, Variance = 16",
      "Mean = 20, Variance = 4"
    ],
    "correct": 0,
    "explain": "Mean = np = 100 · 0.2 = 20. Variance = np(1-p) = 20 · 0.8 = 16.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-106",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "Under what conditions does the Binomial distribution converge asymptotically to the Poisson distribution?",
    "options": [
      "n is small and p is very large (close to 1)",
      "n is very large (n -> ∞) and p is very small (p -> 0) such that λ = np remains constant",
      "n is small and p = 0.5",
      "Variance is greater than the mean"
    ],
    "correct": 1,
    "explain": "The Poisson distribution is the law of rare events, derived as n -> ∞ and p -> 0 with constant mean λ = np.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-107",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "For a continuous random variable X with probability density function f(x) over [a, b], what does the integral ∫ from a to b of f(x) dx equal?",
    "options": [
      "0",
      "1",
      "b - a",
      "E(X)"
    ],
    "correct": 1,
    "explain": "The total area under the entire probability density curve equals 1.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-108",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "In a normal distribution N(μ, σ^2), what percentage of total observations approximately lies in the interval (μ - 2σ, μ + 2σ)?",
    "options": [
      "68.27%",
      "95.45%",
      "99.73%",
      "50.00%"
    ],
    "correct": 1,
    "explain": "By the empirical rule of the normal curve: ~68.27% lies within ±1σ, ~95.45% lies within ±2σ, and ~99.73% lies within ±3σ.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-109",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "In a Poisson distribution with parameter λ, if P(X = 1) = P(X = 2), what is the numerical value of the parameter λ?",
    "options": [
      "1",
      "2",
      "0.5",
      "4"
    ],
    "correct": 1,
    "explain": "P(X=1) = e^{-λ} · λ^1 / 1! = λ e^{-λ}. P(X=2) = e^{-λ} · λ^2 / 2! = (λ^2 / 2) e^{-λ}. Setting them equal: λ = λ^2 / 2 => λ = 2.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-110",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "A continuous random variable X follows a Uniform distribution U(a, b) on the interval [2, 8]. What is the variance of X?",
    "options": [
      "3",
      "6",
      "1",
      "12"
    ],
    "correct": 0,
    "explain": "The variance of a continuous uniform distribution U(a, b) is Var(X) = $(b - a)^{2}$ / 12. For [2, 8]: $(8 - 2)^{2}$ / 12 = 36 / 12 = 3.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-111",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "If a random variable follows an Exponential distribution with rate parameter λ = 0.5, what is its expected value E(X)?",
    "options": [
      "0.5",
      "2.0",
      "1.0",
      "4.0"
    ],
    "correct": 1,
    "explain": "For an exponential distribution with parameter λ, the expected value is E(X) = 1 / λ = 1 / 0.5 = 2.0.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-112",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "Which theoretical probability distribution is appropriate when sampling without replacement from a finite population of size N containing M successes?",
    "options": [
      "Binomial Distribution",
      "Hypergeometric Distribution",
      "Geometric Distribution",
      "Poisson Distribution"
    ],
    "correct": 1,
    "explain": "The Hypergeometric distribution models successes in draws from a finite population without replacement, where trials are dependent.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-113",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "Let X be a continuous random variable with cumulative distribution function F(x). What is P(a < X ≤ b)?",
    "options": [
      "F(b) + F(a)",
      "F(b) - F(a)",
      "F'(b) - F'(a)",
      "F(b) · F(a)"
    ],
    "correct": 1,
    "explain": "By the fundamental property of CDF: P(a < X ≤ b) = F(b) - F(a).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-114",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What is a numerical characteristic computed from an entire population called (as opposed to a statistic computed from a sample)?",
    "options": [
      "Parameter",
      "Statistic",
      "Estimator",
      "Sample Space"
    ],
    "correct": 0,
    "explain": "A parameter is a descriptive index of an entire population (e.g., μ, σ), while a statistic is computed from sample data (e.g., X̄, s).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-115",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What is the standard deviation of the sampling distribution of a statistic known as?",
    "options": [
      "Standard Variance",
      "Standard Error (S.E.)",
      "Coefficient of Variation",
      "Sampling Bias"
    ],
    "correct": 1,
    "explain": "The standard deviation of the sampling distribution of an estimator (such as the sample mean) is called its Standard Error.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-116",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "Which probability sampling technique involves dividing a heterogeneous population into non-overlapping homogeneous sub-groups (strata) and taking a random sample from each?",
    "options": [
      "Simple Random Sampling",
      "Stratified Random Sampling",
      "Systematic Sampling",
      "Cluster Sampling"
    ],
    "correct": 1,
    "explain": "Stratified sampling ensures representation by partitioning a population into homogeneous strata and sampling proportionally within each stratum.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-117",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "If a population has standard deviation σ = 20 and a simple random sample of size n = 100 is drawn with replacement, what is the standard error of the sample mean X̄?",
    "options": [
      "20",
      "2",
      "0.2",
      "0.02"
    ],
    "correct": 1,
    "explain": "Standard Error = σ / $\\sqrt{n}$ = 20 / $\\sqrt{100}$ = 20 / 10 = 2.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-118",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What does the Central Limit Theorem state regarding the distribution of the sample mean X̄ as the sample size n becomes large (typically n ≥ 30)?",
    "options": [
      "The sample mean becomes exactly equal to the population variance",
      "The sampling distribution of X̄ approaches a Normal distribution regardless of the underlying population shape",
      "The sample standard deviation approaches zero",
      "The population distribution converts into a uniform distribution"
    ],
    "correct": 1,
    "explain": "The Central Limit Theorem guarantees that the sampling distribution of X̄ approaches normality as n increases, even if the parent population is non-normal.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-119",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "An estimator T is defined as an \"unbiased estimator\" of a population parameter θ if:",
    "options": [
      "Var(T) = 0",
      "E(T) = θ",
      "T -> θ as n -> ∞",
      "T has the minimum variance"
    ],
    "correct": 1,
    "explain": "An estimator T is unbiased if its mathematical expected value equals the true population parameter: E(T) = θ.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-120",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "Why is the sample variance calculated using divisor (n - 1) instead of n, i.e., $s^{2}$ = Σ(X - X̄)^2 / (n - 1)?",
    "options": [
      "To make $s^{2}$ an unbiased estimator of the population variance σ^2",
      "Because one observation is always corrupted by measurement error",
      "To account for the finite population correction factor",
      "To make the calculation easier without a calculator"
    ],
    "correct": 0,
    "explain": "Dividing by (n - 1) corrects for Bessel's correction; dividing by n produces a negatively biased estimate of σ^2.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-121",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "In sampling without replacement from a finite population of size N, what is the Finite Population Correction (FPC) factor multiplied into the variance of X̄?",
    "options": [
      "(N - 1) / N",
      "(N - n) / (N - 1)",
      "$\\sqrt{n / N}$",
      "(N - n) / n"
    ],
    "correct": 1,
    "explain": "For finite populations sampled without replacement, the variance of X̄ is adjusted by the FPC factor: (N - n) / (N - 1).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-122",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "What is the critical Z-value for a two-sided 95% confidence interval for a population mean?",
    "options": [
      "1.645",
      "1.96",
      "2.576",
      "2.33"
    ],
    "correct": 1,
    "explain": "For a two-tailed standard normal interval with α = 0.05, the critical value Z_(0.025) is 1.96.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-123",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "When estimating a population mean from a normally distributed population with unknown variance using a small sample (n < 30), which sampling distribution must be used?",
    "options": [
      "Standard Normal (Z) distribution",
      "Student's t-distribution with (n - 1) degrees of freedom",
      "Chi-Square distribution",
      "F-distribution"
    ],
    "correct": 1,
    "explain": "When σ is unknown and n < 30, the statistic follows Student's t-distribution with df = n - 1.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-124",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "An estimator T is termed \"consistent\" if, as the sample size n approaches infinity:",
    "options": [
      "The bias of T increases exponentially",
      "T converges in probability to the true parameter θ (Var(T) -> 0 and Bias -> 0)",
      "T is always normally distributed with variance 1",
      "T equals the median of the sample"
    ],
    "correct": 1,
    "explain": "Consistency means that as n -> ∞, the estimator converges in probability to the true parameter θ, which occurs if its variance and bias both approach zero.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-125",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "Between two unbiased estimators T1 and T2 of a parameter θ, T1 is said to be \"more efficient\" than T2 if:",
    "options": [
      "Var(T1) < Var(T2)",
      "Var(T1) > Var(T2)",
      "E(T1) > E(T2)",
      "T1 is based on a smaller sample size"
    ],
    "correct": 0,
    "explain": "Efficiency compares the dispersion of unbiased estimators; the one with the smaller sampling variance is more efficient.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-126",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "To reduce the margin of error (width of a confidence interval) of a sample mean by half (factor of 1/2) while maintaining the same confidence level, by what factor must the sample size n be increased?",
    "options": [
      "2 times",
      "4 times",
      "8 times",
      "16 times"
    ],
    "correct": 1,
    "explain": "Margin of error E = Z · σ / $\\sqrt{n}$. Halving E requires doubling $\\sqrt{n}$, which means n must be multiplied by $2^{2}$ = 4.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-127",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "In Maximum Likelihood Estimation (MLE), how is the maximum likelihood estimator θ̂ determined from the likelihood function L(θ)?",
    "options": [
      "By finding the value of θ that minimizes the sum of squared residuals",
      "By solving d[ln L(θ)] / dθ = 0 for θ",
      "By calculating the sample median of the likelihood ratios",
      "By setting L(θ) equal to zero"
    ],
    "correct": 1,
    "explain": "The MLE maximizes the log-likelihood function by setting its first derivative with respect to θ equal to 0 (score equation) and verifying a negative second derivative.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-128",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "What is the primary hypothesis of \"no effect\", \"no difference\", or \"status quo\" denoted in statistical inference?",
    "options": [
      "Alternative Hypothesis (H1)",
      "Null Hypothesis (H0)",
      "Empirical Hypothesis",
      "Composite Hypothesis"
    ],
    "correct": 1,
    "explain": "The Null Hypothesis (H0) represents the default assertion of no difference or no treatment effect.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-129",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "What is a Type I error in statistical hypothesis testing?",
    "options": [
      "Rejecting H0 when H0 is actually true",
      "Failing to reject H0 when H0 is actually false",
      "Accepting H1 when H1 is true",
      "Making an arithmetic addition mistake"
    ],
    "correct": 0,
    "explain": "A Type I error occurs when a true null hypothesis is erroneously rejected (false positive), with probability α.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-130",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "The probability of committing a Type I error is denoted by which Greek letter, which also represents the level of significance?",
    "options": [
      "β (Beta)",
      "α (Alpha)",
      "γ (Gamma)",
      "μ (Mu)"
    ],
    "correct": 1,
    "explain": "The level of significance α is the predetermined maximum threshold probability of committing a Type I error.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-131",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "If the p-value computed from a test statistic is 0.015 and the significance level is set at α = 0.05, what is the statistical decision?",
    "options": [
      "Reject the null hypothesis H0 (statistically significant)",
      "Fail to reject the null hypothesis H0",
      "Accept the null hypothesis as definitively proven",
      "Discard the sample data and retest"
    ],
    "correct": 0,
    "explain": "When p-value ≤ α (0.015 < 0.05), we reject the null hypothesis in favor of the alternative hypothesis.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-132",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "Which statistical test is standardly used to test whether two qualitative attributes are independent in a contingency table?",
    "options": [
      "One-sample Z-test",
      "Chi-Square (χ^2) Test of Independence",
      "Paired Student's t-test",
      "Spearman's Rank Test"
    ],
    "correct": 1,
    "explain": "The Chi-Square test of independence assesses whether two categorical variables are independent in a contingency table.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-133",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "What does the \"Power of a Test\" represent in statistical inference?",
    "options": [
      "The probability of committing a Type I error (α)",
      "The probability of correctly rejecting a false null hypothesis (1 - β)",
      "The probability of failing to reject a true null hypothesis (1 - α)",
      "The ratio of sample size to population size"
    ],
    "correct": 1,
    "explain": "Power of a test is 1 - β, the probability of rejecting H0 when H0 is false (correct detection of a true effect).",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-134",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "In testing H0: μ = 50 against H1: μ > 50 at α = 0.05 with known population variance, which type of test is conducted?",
    "options": [
      "Two-tailed test",
      "Right-tailed (one-tailed) test",
      "Left-tailed (one-tailed) test",
      "Goodness of fit test"
    ],
    "correct": 1,
    "explain": "Because the alternative hypothesis specifies μ > 50, the rejection region lies exclusively in the upper (right) tail.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-135",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "What is the formula for the degrees of freedom in a Chi-Square test of independence for an r × c contingency table (r rows, c columns)?",
    "options": [
      "r · c - 1",
      "(r - 1)(c - 1)",
      "r + c - 1",
      "(r - 1) + (c - 1)"
    ],
    "correct": 1,
    "explain": "The degrees of freedom for an r × c contingency table is df = (r - 1)(c - 1).",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-136",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "When conducting a two-sample pooled t-test for comparing two independent population means with sample sizes n1 and n2, what are the total degrees of freedom?",
    "options": [
      "n1 + n2 - 1",
      "n1 + n2 - 2",
      "(n1 - 1)(n2 - 1)",
      "n1 + n2"
    ],
    "correct": 1,
    "explain": "Estimating two sample means consumes 2 degrees of freedom, leaving df = n1 + n2 - 2 for the pooled variance.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-137",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "Which statistical test is designed to test the equality of two population variances, H0: σ$1^{2}$ = σ$2^{2}$?",
    "options": [
      "F-Test (Snedecor's F)",
      "Z-Test",
      "Paired t-Test",
      "Wilcoxon Signed-Rank Test"
    ],
    "correct": 0,
    "explain": "The F-test evaluates the ratio of two sample variances F = $s1^{2} /  s2^{2}$ to test whether their population variances are equal.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-138",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "In a one-way Analysis of Variance (ANOVA) with k groups and N total observations, what is the F-statistic ratio?",
    "options": [
      "Within-group Mean Square / Between-group Mean Square",
      "Between-group Mean Square / Within-group Mean Square (Error)",
      "Total Sum of Squares / Error Sum of Squares",
      "Group Mean / Grand Mean"
    ],
    "correct": 1,
    "explain": "The ANOVA test statistic is F = MS_between / MS_within (treatment variance divided by residual error variance).",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-139",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "What is the consequence of testing multiple independent hypotheses simultaneously at α = 0.05 without a family-wise error rate correction (like Bonferroni)?",
    "options": [
      "The overall probability of at least one false positive (Type I error) increases substantially above 0.05",
      "The statistical power of each individual test drops to zero",
      "The degrees of freedom become negative",
      "Type II errors are completely eliminated"
    ],
    "correct": 0,
    "explain": "Running m independent tests increases the family-wise error rate to 1 - (1 - α)^m, making false positive discoveries highly probable.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-140",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "When is a Paired t-test used instead of an independent two-sample t-test?",
    "options": [
      "When the two samples have unequal variances and large sample sizes",
      "When observations in the two groups are naturally paired or matched (such as pre-test and post-test on the same subjects)",
      "When the data is measured on a nominal classification scale",
      "When testing more than three experimental treatment groups"
    ],
    "correct": 1,
    "explain": "The paired t-test analyzes differences (d = X1 - X2) for matched-pair or before-and-after repeated measures on the same subjects.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-141",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "What is the Neyman-Pearson Lemma primarily used for in the theoretical foundation of hypothesis testing?",
    "options": [
      "Constructing the Most Powerful (MP) test for simple null against simple alternative hypotheses based on likelihood ratio",
      "Proving the Central Limit Theorem for non-independent variables",
      "Deriving least-squares regression lines",
      "Calculating Pearson's contingency coefficient"
    ],
    "correct": 0,
    "explain": "The Neyman-Pearson lemma proves that the likelihood ratio test produces the most powerful test of a given size α for simple hypotheses.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-142",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "In a Chi-square goodness-of-fit test with k categories and m parameters estimated from the sample data, what are the degrees of freedom?",
    "options": [
      "k - 1",
      "k - 1 - m",
      "k + m",
      "k(m - 1)"
    ],
    "correct": 1,
    "explain": "Each parameter estimated from the sample consumes 1 degree of freedom, resulting in df = k - 1 - m.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-143",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "If the coefficient of determination between two variables is $r^{2}$ = 0.64, what is the coefficient of non-determination (proportion of unexplained variation)?",
    "options": [
      "0.36",
      "0.64",
      "0.20",
      "0.80"
    ],
    "correct": 0,
    "explain": "The coefficient of non-determination is $k^{2}$ = 1 - $r^{2}$ = 1 - 0.64 = 0.36, representing the proportion of total variation in Y left unexplained by the regression.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-144",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "If the correlation coefficient between X and Y is r = 0, what does this specifically imply regarding their relationship?",
    "options": [
      "There is no linear association between X and Y",
      "There is no relationship of any kind (linear or non-linear) between X and Y",
      "X and Y are identical variables",
      "X causes Y to be zero"
    ],
    "correct": 0,
    "explain": "r = 0 indicates absence of linear correlation; a strong non-linear (e.g., quadratic) relationship could still exist.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-145",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "In the simple linear regression model Y = a + bX, what does the parameter \"b\" represent?",
    "options": [
      "The Y-intercept when X = 0",
      "The slope of the regression line (change in Y per unit increase in X)",
      "The correlation coefficient r",
      "The standard error of the estimate"
    ],
    "correct": 1,
    "explain": "The regression coefficient b is the slope, indicating the expected change in the dependent variable Y for every one-unit increase in X.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-146",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "Through which point do both regression lines (Y on X and X on Y) always intersect?",
    "options": [
      "(0, 0)",
      "(X̄, Ȳ) [the means of X and Y]",
      "(1, 1)",
      "(s_x, s_y)"
    ],
    "correct": 1,
    "explain": "Both regression lines pass through the centroid of the data: the point of means (X̄, Ȳ).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-147",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "If the correlation coefficient r = 0.8, what is the coefficient of determination ($r^{2}$)?",
    "options": [
      "0.80",
      "0.64",
      "0.16",
      "0.40"
    ],
    "correct": 1,
    "explain": "Coefficient of determination is $r^{2}$ = (0.8)^2 = 0.64 (indicating 64% of variation in Y is explained by X).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-148",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "In simple linear regression of Y on X with sample size n, what are the degrees of freedom associated with the residual variance (sum of squared errors)?",
    "options": [
      "n",
      "n - 1",
      "n - 2",
      "2n - 1"
    ],
    "correct": 2,
    "explain": "Estimating two parameters (intercept a and slope b) consumes 2 degrees of freedom from the sample, leaving df = n - 2 for the residual sum of squares.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-149",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "Given the two regression coefficients b_yx = 0.8 and b_xy = 0.45, what is the correlation coefficient r?",
    "options": [
      "+0.60",
      "+0.36",
      "+0.50",
      "+0.72"
    ],
    "correct": 0,
    "explain": "r = ± $\\sqrt{b_yx · b_xy}$. Since both coefficients are positive: r = +$\\sqrt{0.8 · 0.45}$ = +$\\sqrt{0.36}$ = +0.60.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-150",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "What is the sum of the residuals Σ(Y - Ŷ) in an ordinary least squares (OLS) linear regression model with an intercept?",
    "options": [
      "Always zero",
      "Always positive",
      "Equal to the residual variance",
      "Dependent on the sample size"
    ],
    "correct": 0,
    "explain": "A fundamental mathematical property of OLS regression with an intercept term is that the sum of the residuals is identically zero: Σ e_i = 0.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-151",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "What is the formula for Spearman's rank correlation coefficient (r_s) when there are no tied ranks?",
    "options": [
      "1 - [6 Σ $d^{2}$ / (n($n^{2}$ - 1))]",
      "1 - [Σ d / n]",
      "6 Σ $d^{2}$ / (n(n - 1))",
      "1 + [6 Σ $d^{2}$ / (n($n^{2}$ - 1))]"
    ],
    "correct": 0,
    "explain": "Spearman's rank correlation formula is r_s = 1 - [6 Σ d_i^2 / (n($n^{2}$ - 1))], where d_i is the difference between ranks.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-152",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "If the two regression lines are perpendicular (at an angle of $90^\\circ$), what is the correlation between the two variables?",
    "options": [
      "r = 1",
      "r = -1",
      "r = 0",
      "r = 0.5"
    ],
    "correct": 2,
    "explain": "When r = 0, the regression lines are parallel to the coordinate axes and perpendicular to each other. When r = ±1, they coincide.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-153",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "Why can the two regression coefficients b_yx and b_xy NEVER have opposite signs?",
    "options": [
      "Because b_yx · b_xy = $r^{2}$, which must be non-negative, and both share the sign of the covariance Cov(X, Y)",
      "Because least squares requires positive intercepts",
      "Because the sample variance of X must equal the sample variance of Y",
      "Because the angle between regression lines cannot exceed 45 degrees"
    ],
    "correct": 0,
    "explain": "Both b_yx = Cov(X,Y)/Var(X) and b_xy = Cov(X,Y)/Var(Y) have variances (which are positive) in the denominator; hence both take the exact sign of Cov(X,Y).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-154",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "In multiple regression, what phenomenon occurs when two or more predictor variables are highly correlated with each other, inflating the variance of regression coefficients?",
    "options": [
      "Heteroscedasticity",
      "Multicollinearity",
      "Autocorrelation",
      "Endogeneity"
    ],
    "correct": 1,
    "explain": "Multicollinearity occurs when independent variables share strong linear relationships, leading to unstable coefficient estimates and high standard errors.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-155",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "What does the statistical assumption of \"Homoscedasticity\" require in a linear regression model?",
    "options": [
      "The independent variables are normally distributed",
      "The variance of the error terms (residuals) is constant across all values of the independent variable",
      "The error terms are mutually correlated over time",
      "The regression line passes through the origin (0, 0)"
    ],
    "correct": 1,
    "explain": "Homoscedasticity means constant error variance: Var(ε_i | X) = σ^2 for all i. Heteroscedasticity refers to non-constant error variance.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-156",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "If the arithmetic mean of the two regression coefficients is greater than or equal to the correlation coefficient, i.e., (b_yx + b_xy) / 2 ≥ r, this property is known as:",
    "options": [
      "The fundamental inequality of regression coefficients",
      "Markov's inequality",
      "The Gauss-Markov theorem",
      "The Cauchy-Schwarz theorem applied to residuals"
    ],
    "correct": 0,
    "explain": "Since ($\\sqrt{b_yx} -  \\sqrt{b_xy}$)^2 ≥ 0 \\implies b_yx + b_xy ≥ 2 $\\sqrt{b_yx · b_xy}$ = 2r \\implies (b_yx + b_xy) / 2 ≥ r.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-157",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What is an index number that measures the relative change in price of a single commodity over time called?",
    "options": [
      "Price Relative",
      "Composite Index",
      "Volume Index",
      "Chain Base Index"
    ],
    "correct": 0,
    "explain": "A price relative is the ratio of the price of a single commodity in the current year to its price in the base year: (P1 / P0) * 100.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-158",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "Which price index formula uses base-period quantities (q0) as weights?",
    "options": [
      "Paasche's Index",
      "Laspeyres' Index",
      "Fisher's Ideal Index",
      "Marshall-Edgeworth Index"
    ],
    "correct": 1,
    "explain": "Laspeyres price index uses base-year quantities: P_01^L = [Σ(p1 · q0) / Σ(p0 · q0)] * 100.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-159",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "Which price index formula uses current-period quantities (q1) as weights?",
    "options": [
      "Laspeyres' Index",
      "Paasche's Index",
      "Bowley's Index",
      "Kelly's Index"
    ],
    "correct": 1,
    "explain": "Paasche price index weights by current-year quantities: P_01^P = [Σ(p1 · q1) / Σ(p0 · q1)] * 100.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-160",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "In time series analysis, which component reflects regular, repeating fluctuations occurring within a period of one year or less (such as holiday shopping spikes)?",
    "options": [
      "Secular Trend (T)",
      "Seasonal Variation (S)",
      "Cyclical Fluctuation (C)",
      "Irregular Variation (I)"
    ],
    "correct": 1,
    "explain": "Seasonal variation refers to rhythmic patterns that repeat within a calendar year due to seasons, climate, or cultural holidays.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-161",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What is the standard multiplicative model equation for decomposing a time series Y into its four components?",
    "options": [
      "Y = T + S + C + I",
      "Y = T · S · C · I",
      "Y = (T · S) / (C · I)",
      "Y = T + S · C - I"
    ],
    "correct": 1,
    "explain": "The multiplicative time series decomposition model expresses the observed value as the product of Trend, Seasonal, Cyclical, and Irregular components: Y = T · S · C · I.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-162",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "Why is Fisher's Ideal Index designated as \"ideal\"?",
    "options": [
      "It is the arithmetic mean of Laspeyres and Paasche indices",
      "It is the geometric mean of Laspeyres and Paasche indices and satisfies both the Time Reversal Test and Factor Reversal Test",
      "It requires no quantity data to calculate",
      "It is always exactly equal to 100"
    ],
    "correct": 1,
    "explain": "Fisher's index P_01^F = $\\sqrt{P_01^L · P_01^P}$ satisfies both the Time Reversal Test and Factor Reversal Test, free from single-period weighting bias.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-163",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "What mathematical condition defines the Time Reversal Test for an index number P_01?",
    "options": [
      "P_01 · P_10 = 1",
      "P_01 + P_10 = 0",
      "P_01 / P_10 = 100",
      "P_01 · Q_01 = V_01"
    ],
    "correct": 0,
    "explain": "The Time Reversal Test requires that reversing the time subscripts yields the reciprocal: P_01 · P_10 = 1.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-164",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "What mathematical condition defines the Factor Reversal Test for price and quantity index numbers?",
    "options": [
      "P_01 · Q_01 = V_01 = Σ(p1 · q1) / Σ(p0 · q0)",
      "P_01 / Q_01 = 1",
      "P_01 + Q_01 = V_01",
      "P_01 · P_10 = 1"
    ],
    "correct": 0,
    "explain": "The Factor Reversal Test requires the product of the price index and quantity index to equal the true value ratio: P_01 · Q_01 = Σ(p1 q1) / Σ(p0 q0).",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-165",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "In trend estimation using the Method of Moving Averages, what is the primary effect of taking a k-period moving average?",
    "options": [
      "It accentuates short-term random noise",
      "It smooths out short-term fluctuations and seasonal variations to reveal the underlying long-term trend",
      "It eliminates the need for historical baseline data",
      "It fits a parabolic second-degree polynomial exactly"
    ],
    "correct": 1,
    "explain": "Moving averages smooth out periodic, seasonal, and random irregular fluctuations to isolate the secular trend.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-166",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "Which test of adequacy is satisfied by simple aggregates of prices and the Kelly's fixed-weight index, but failed by Fisher's index?",
    "options": [
      "Time Reversal Test",
      "Factor Reversal Test",
      "Circular Test",
      "Unit Test"
    ],
    "correct": 2,
    "explain": "The Circular Test (P_01 · P_12 · P_20 = 1) is an extension of the time reversal test satisfied by Kelly's and simple aggregate methods, but NOT by Fisher's ideal index.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-167",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "When fitting a linear trend line Y = a + bX by the method of least squares to an odd number of years (n = 2m + 1), how does setting the origin X = 0 at the middle year simplify the normal equations?",
    "options": [
      "Σ X = 0, reducing the equations to a = (Σ Y) / n and b = (Σ XY) / (Σ $X^{2}$)",
      "Σ Y becomes 0, eliminating the intercept parameter a",
      "Σ $X^{2}$ becomes 1, simplifying the denominator",
      "The residuals become exactly zero for all data points"
    ],
    "correct": 0,
    "explain": "Centering X at the middle year ensures Σ X = 0, which decouples the normal equations directly into a = ΣY / n and b = ΣXY / Σ$X^{2}$.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-168",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "Which component of a time series is associated with multi-year economic cycles of prosperity, recession, depression, and recovery?",
    "options": [
      "Secular Trend",
      "Seasonal Variations",
      "Cyclical Variations",
      "Irregular Noise"
    ],
    "correct": 2,
    "explain": "Cyclical fluctuations represent oscillatory business cycle movements recurring over periods longer than one year (typically 3 to 10 years).",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-169",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "Why does Laspeyres' price index tend to have an inherent upward bias (overstating inflation)?",
    "options": [
      "It uses current-year quantities that reflect consumer substitution away from items whose prices rose",
      "It uses base-year quantities and fails to account for consumer substitution toward cheaper alternatives as relative prices change",
      "It divides by zero when prices drop",
      "It squares price ratios before averaging"
    ],
    "correct": 1,
    "explain": "Because it fixes base-period quantities, Laspeyres ignores consumer substitution toward cheaper substitute goods, systematically overestimating the cost-of-living increase.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-170",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "In time series analysis, what does \"deseasonalizing\" the data accomplish in a multiplicative model?",
    "options": [
      "Dividing the observed series Y by the seasonal index S to yield T · C · I",
      "Subtracting the trend component T from the observed data Y",
      "Multiplying Y by the cyclical component C",
      "Setting all quarterly seasonal indices equal to 0"
    ],
    "correct": 0,
    "explain": "Deseasonalizing (seasonally adjusting) in a multiplicative model divides the original data by the seasonal index: Y / S = (T · S · C · I) / S = T · C · I.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-171",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Easy",
    "q": "In statistical classification, the temperature measured on the Celsius scale is an example of which scale of measurement?",
    "options": [
      "Interval scale",
      "Ratio scale",
      "Ordinal scale",
      "Nominal scale"
    ],
    "correct": 0,
    "explain": "Celsius temperature is measured on an interval scale because it has equal distances between points, but no absolute zero (0°C does not mean the complete absence of heat).",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-172",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Easy",
    "q": "What graphical representation uses adjacent rectangular bars whose areas are proportional to the frequencies of continuous class intervals?",
    "options": [
      "Histogram",
      "Bar chart",
      "Pie diagram",
      "Pictogram"
    ],
    "correct": 0,
    "explain": "A histogram represents continuous frequency distributions using adjacent rectangular columns where column area represents class frequency.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-173",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Easy",
    "q": "In a cumulative frequency polygon, the curve obtained by plotting cumulative frequencies against class upper boundaries is known as an:",
    "options": [
      "Ogive",
      "Historigram",
      "Frequency polygon",
      "Scattergram"
    ],
    "correct": 0,
    "explain": "An ogive (cumulative frequency curve) is constructed by plotting cumulative frequencies against the upper (or lower) class boundaries of a grouped frequency distribution.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-174",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Easy",
    "q": "Data collected by an investigator directly from original primary sources through surveys or laboratory experiments is defined as:",
    "options": [
      "Primary data",
      "Secondary data",
      "Tertiary data",
      "Derived data"
    ],
    "correct": 0,
    "explain": "Primary data is first-hand information collected directly by the researcher for a specific study, unlike secondary data which is retrieved from published records.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-175",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Easy",
    "q": "In constructing a pie chart, what central angle represents a component that accounts for 25% of the total aggregate value?",
    "options": [
      "$90^\\circ$",
      "$45^\\circ$",
      "$120^\\circ$",
      "$60^\\circ$"
    ],
    "correct": 0,
    "explain": "The total central angle in a circle is $360^\\circ$. A 25% component subtends an angle of 0.25 * $360^\\circ =  90^\\circ$.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-176",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Medium",
    "q": "According to Sturges' Rule, how many class intervals k should be constructed for a sample size of N = 64 observations?",
    "options": [
      "7 classes",
      "5 classes",
      "10 classes",
      "12 classes"
    ],
    "correct": 0,
    "explain": "Sturges' formula is k = 1 + 3.322 * log_10(N). For N = 64: log_10(64) ≈ 1.806; k = 1 + (3.322 * 1.806) = 1 + 6.00 = 7 classes.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-177",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Medium",
    "q": "When class limits for continuous data are given as 10-19, 20-29, and 30-39, what are the exact class boundaries for the 20-29 interval?",
    "options": [
      "19.5 - 29.5",
      "20.0 - 29.0",
      "19.0 - 29.0",
      "20.5 - 29.5"
    ],
    "correct": 0,
    "explain": "To convert inclusive class limits into true continuous class boundaries, subtract 0.5 from the lower limit (20 - 0.5 = 19.5) and add 0.5 to the upper limit (29 + 0.5 = 29.5).",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-178",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Medium",
    "q": "In a Lorenz Curve used to analyze income distribution, what does the 45-degree diagonal line represent?",
    "options": [
      "Line of perfect equality",
      "Line of maximum skewness",
      "Line of absolute dispersion",
      "Line of modal frequency"
    ],
    "correct": 0,
    "explain": "The 45-degree diagonal represents the line of perfect equality, where every cumulative percentage of the population possesses the exact same cumulative percentage of wealth.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-179",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Medium",
    "q": "Which statistical graph represents time-series data plotted against chronological time intervals?",
    "options": [
      "Historigram",
      "Histogram",
      "Stem-and-leaf plot",
      "Box-and-whisker plot"
    ],
    "correct": 0,
    "explain": "A historigram (chronological line chart) plots observations on the vertical axis against regular intervals of time on the horizontal axis.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-180",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Medium",
    "q": "What is the relative frequency of a class interval with frequency f = 35 in a total sample of N = 140 observations?",
    "options": [
      "0.25",
      "0.35",
      "0.40",
      "0.20"
    ],
    "correct": 0,
    "explain": "Relative frequency = f / N = 35 / 140 = 1 / 4 = 0.25 (or 25%).",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-181",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Hard",
    "q": "In a grouped frequency distribution with unequal class widths w_i, how must the heights of the histogram bars be adjusted to maintain correct frequency representation?",
    "options": [
      "Height must equal frequency density (frequency divided by class width: f_i / w_i)",
      "Height must be multiplied by class midpoint",
      "Height must be squared proportionally",
      "Height must equal cumulative frequency up to that class"
    ],
    "correct": 0,
    "explain": "Because bar area in a histogram represents frequency (Area = width * height), when class widths vary, the height must be set to frequency density: h_i = f_i / w_i.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-182",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Hard",
    "q": "In the construction of a stem-and-leaf display for the dataset {102, 107, 115, 118, 124}, what are the leaves for stem 11?",
    "options": [
      "5, 8",
      "15, 18",
      "2, 7",
      "1, 1"
    ],
    "correct": 0,
    "explain": "With stem representing the leading digits \"11\" (tens/hundreds place), the trailing units digits for 115 and 118 are 5 and 8.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-183",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Hard",
    "q": "What geometric property is true of the point of intersection between a \"less than\" ogive and a \"more than\" ogive?",
    "options": [
      "Its x-coordinate corresponds exactly to the Median of the distribution",
      "Its x-coordinate corresponds to the Arithmetic Mean",
      "Its y-coordinate equals the total frequency N",
      "Its x-coordinate corresponds to the Mode"
    ],
    "correct": 0,
    "explain": "The intersection point between the \"less than\" ogive and \"more than\" ogive corresponds to cumulative frequency N/2, whose x-axis projection is the Median.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-184",
    "subject": "Statistics",
    "topic": "Introduction to Statistics & Data Presentation",
    "difficulty": "Hard",
    "q": "When tabular data is categorized simultaneously according to two qualitative attributes in a two-way classification grid, the resulting table is formally termed a:",
    "options": [
      "Contingency table",
      "Manifold table",
      "Frequency polygon",
      "Correlation matrix"
    ],
    "correct": 0,
    "explain": "A contingency table (cross-tabulation matrix) presents joint frequency distributions for two categorical or qualitative variables cross-classified into rows and columns.",
    "chapter": "Introduction to Statistics & Data Presentation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-185",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Easy",
    "q": "Calculate the arithmetic mean of the dataset: 8, 12, 15, 20, 25:",
    "options": [
      "16",
      "15",
      "18",
      "14"
    ],
    "correct": 0,
    "explain": "Mean = Sum / n = (8 + 12 + 15 + 20 + 25) / 5 = 80 / 5 = 16.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-186",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Easy",
    "q": "What is the median of the ordered array: 4, 7, 9, 13, 18, 22, 29?",
    "options": [
      "13",
      "9",
      "15.5",
      "18"
    ],
    "correct": 0,
    "explain": "For n = 7 (odd), the median is the (7 + 1)/2 = 4th observation, which is 13.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-187",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Easy",
    "q": "What is the mode of the dataset: 3, 5, 7, 5, 9, 5, 11, 7, 12?",
    "options": [
      "5",
      "7",
      "9",
      "6.67"
    ],
    "correct": 0,
    "explain": "The value 5 occurs with the highest frequency (3 times), making 5 the unimodal value of the dataset.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-188",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Easy",
    "q": "The algebraic sum of deviations of a set of n observations from their arithmetic mean is always equal to:",
    "options": [
      "0",
      "n",
      "1",
      "The variance"
    ],
    "correct": 0,
    "explain": "A fundamental mathematical property of the arithmetic mean is that sum(x_i - mean) = sum(x_i) - n * mean = n * mean - n * mean = 0.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-189",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Easy",
    "q": "Which measure of central tendency is uniquely suited for computing average rates of speed or unit ratios?",
    "options": [
      "Harmonic Mean",
      "Geometric Mean",
      "Mode",
      "Median"
    ],
    "correct": 0,
    "explain": "The Harmonic Mean is the reciprocal of the arithmetic mean of reciprocals, making it mathematically ideal for averaging rates, speeds, and price-per-unit ratios.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-190",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Medium",
    "q": "Calculate the Geometric Mean of the three positive numbers: 2, 8, and 32:",
    "options": [
      "8",
      "14",
      "6.5",
      "16"
    ],
    "correct": 0,
    "explain": "Geometric Mean = (2 * 8 * 32)^(1/3) = (512)^(1/3) = 8.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-191",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Medium",
    "q": "In a moderately skewed unimodal frequency distribution with Mean = 45 and Median = 42, what is the empirical estimate of the Mode?",
    "options": [
      "36",
      "39",
      "48",
      "40"
    ],
    "correct": 0,
    "explain": "By Pearson's empirical relationship: Mode ≈ 3 * Median - 2 * Mean = 3(42) - 2(45) = 126 - 90 = 36.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-192",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Medium",
    "q": "For two positive non-identical numbers a and b, what is the strict mathematical ordering among their AM, GM, and HM?",
    "options": [
      "AM > GM > HM",
      "HM > GM > AM",
      "GM > AM > HM",
      "AM = GM = HM"
    ],
    "correct": 0,
    "explain": "For any set of positive unequal real numbers, the Cauchy-Schwarz inequality dictates that AM > GM > HM. (They are equal only if all values are identical).",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-193",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Medium",
    "q": "A sample of 20 male students has a mean test score of 70, and a sample of 30 female students has a mean score of 80. What is the combined pooled arithmetic mean?",
    "options": [
      "76",
      "75",
      "74",
      "78"
    ],
    "correct": 0,
    "explain": "Combined Mean = (n_1 * x_1 + n_2 * x_2) / (n_1 + n_2) = (20 * 70 + 30 * 80) / (20 + 30) = (1400 + 2400) / 50 = 3800 / 50 = 76.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-194",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Hard",
    "q": "If each observation in a dataset x_i is transformed linearly by y_i = 3 * x_i - 7, and the original mean was 15, what is the new mean of y?",
    "options": [
      "38",
      "45",
      "35",
      "52"
    ],
    "correct": 0,
    "explain": "The arithmetic mean satisfies linear change of scale and origin: Mean(y) = 3 * Mean(x) - 7 = 3(15) - 7 = 45 - 7 = 38.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-195",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Hard",
    "q": "What is the Harmonic Mean of two positive numbers if their Arithmetic Mean is 16 and their Geometric Mean is 8?",
    "options": [
      "4",
      "2",
      "6",
      "8"
    ],
    "correct": 0,
    "explain": "For two numbers, $GM^{2}$ = AM * HM. Therefore, HM = $GM^{2}$ / AM = $8^{2}$ / 16 = 64 / 16 = 4.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-196",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Hard",
    "q": "The sum of squared deviations sum(x_i - A)^2 is minimized if and only if the constant A is chosen to be:",
    "options": [
      "The Arithmetic Mean of the dataset",
      "The Median of the dataset",
      "The Mode of the dataset",
      "The Geometric Mean of the dataset"
    ],
    "correct": 0,
    "explain": "A defining mathematical theorem of least squares states that sum(x_i - A)^2 attains its global minimum when A = Mean(x). (Sum of absolute deviations is minimized at the Median).",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-197",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Hard",
    "q": "In a positively skewed frequency distribution, what is the relative positional order of the three classical averages from left to right along the x-axis?",
    "options": [
      "Mode < Median < Mean",
      "Mean < Median < Mode",
      "Median < Mode < Mean",
      "Mean < Mode < Median"
    ],
    "correct": 0,
    "explain": "In positive (right) skewness, extreme high values pull the mean rightward the most, while the mode stays at the peak: Mode < Median < Mean.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-198",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Hard",
    "q": "Which fractile divides an ordered dataset such that 75% of observations lie below it and 25% lie above it?",
    "options": [
      "Third Quartile (Q_3)",
      "First Quartile (Q_1)",
      "Seventh Decile (D_7)",
      "Median (Q_2)"
    ],
    "correct": 0,
    "explain": "The Third Quartile (Q_3 or 75th percentile) partitions the upper 25% of the data from the lower 75%.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-199",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Easy",
    "q": "What is the range of the numerical dataset: 14, 28, 9, 35, 42, 17, 23?",
    "options": [
      "33",
      "28",
      "42",
      "31"
    ],
    "correct": 0,
    "explain": "Range = Maximum - Minimum = 42 - 9 = 33.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-200",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Easy",
    "q": "What is the variance of a dataset where every single observed value is identical to a constant c = 5?",
    "options": [
      "0",
      "5",
      "25",
      "1"
    ],
    "correct": 0,
    "explain": "If all observations are identical, there is zero variability; every deviation (x_i - mean) = 0, so the variance is strictly 0.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-201",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Easy",
    "q": "What is the mathematical relationship between the standard deviation (s) and variance ($s^{2}$) of a sample?",
    "options": [
      "Standard deviation is the positive square root of the variance",
      "Variance is the square root of the standard deviation",
      "Standard deviation is half of the variance",
      "Variance is double the standard deviation"
    ],
    "correct": 0,
    "explain": "Standard deviation is defined as the positive square root of the variance: s = $\\sqrt{$s^{2}$}$.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-202",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Easy",
    "q": "Which dimensionless measure of relative dispersion is defined as the ratio of standard deviation to arithmetic mean expressed as a percentage?",
    "options": [
      "Coefficient of Variation (CV)",
      "Variance ratio",
      "Quartile deviation",
      "Standard error"
    ],
    "correct": 0,
    "explain": "The Coefficient of Variation is CV = (s / mean) * 100%, providing a unitless measure of relative risk or dispersion.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-203",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Medium",
    "q": "Calculate the population standard deviation of the values: 3, 5, 7, 9, 11 (where mean = 7):",
    "options": [
      "$\\sqrt{8}$ ≈ 2.83",
      "$\\sqrt{10}$ ≈ 3.16",
      "4",
      "2"
    ],
    "correct": 0,
    "explain": "Squared deviations from 7: $(3-7)^{2}$=16, $(5-7)^{2}$=4, $(7-7)^{2}$=0, $(9-7)^{2}$=4, $(11-7)^{2}$=16. Sum = 40. Variance = 40 / 5 = 8. SD = $\\sqrt{8}$ ≈ 2.83.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-204",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Medium",
    "q": "If the first and third quartiles of an income distribution are Q_1 = 30 and Q_3 = 70, what is the Semi-Interquartile Range (Quartile Deviation)?",
    "options": [
      "20",
      "40",
      "50",
      "25"
    ],
    "correct": 0,
    "explain": "Quartile Deviation = (Q_3 - Q_1) / 2 = (70 - 30) / 2 = 40 / 2 = 20.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-205",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Medium",
    "q": "If each observation in a dataset is increased by adding a constant 10, how does the standard deviation change?",
    "options": [
      "The standard deviation remains completely unchanged",
      "The standard deviation increases by 10",
      "The standard deviation increases by 100",
      "The standard deviation is multiplied by 10"
    ],
    "correct": 0,
    "explain": "Standard deviation is independent of changes of origin (adding or subtracting a constant); shifting data preserves all relative distances between points.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-206",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Medium",
    "q": "Product A has a mean lifespan of 500 hours with SD = 25 hours. Product B has a mean lifespan of 800 hours with SD = 32 hours. Which product exhibits higher relative consistency?",
    "options": [
      "Product B (CV = 4.0% vs Product A CV = 5.0%)",
      "Product A (CV = 5.0% vs Product B CV = 4.0%)",
      "Both have identical consistency",
      "Cannot be determined without sample size"
    ],
    "correct": 0,
    "explain": "CV_A = (25 / 500) * 100% = 5.0%. CV_B = (32 / 800) * 100% = 4.0%. Lower CV indicates higher relative consistency, so Product B is more consistent.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-207",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Medium",
    "q": "What is the Mean Deviation about the mean for the dataset: 2, 4, 6, 8, 10 (mean = 6)?",
    "options": [
      "2.4",
      "2.0",
      "3.2",
      "1.8"
    ],
    "correct": 0,
    "explain": "Absolute deviations: |2-6|=4, |4-6|=2, |6-6|=0, |8-6|=2, |10-6|=4. Sum = 12. Mean Deviation = 12 / 5 = 2.4.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-208",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Hard",
    "q": "If the linear transformation y_i = -4 * x_i + 25 is applied to a dataset with variance Var(x) = 9, what is the variance of y?",
    "options": [
      "144",
      "36",
      "-36",
      "61"
    ],
    "correct": 0,
    "explain": "Variance under linear transformation: Var(a * x + b) = $a^{2}$ * Var(x). Here a = -4, so Var(y) = $(-4)^{2}$ * 9 = 16 * 9 = 144.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-209",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Hard",
    "q": "In a mesokurtic standard normal distribution, what are the theoretical values of the moment coefficients beta_1 (skewness) and beta_2 (kurtosis)?",
    "options": [
      "beta_1 = 0, beta_2 = 3",
      "beta_1 = 1, beta_2 = 0",
      "beta_1 = 0, beta_2 = 0",
      "beta_1 = 3, beta_2 = 0"
    ],
    "correct": 0,
    "explain": "For a normal distribution: beta_1 = mu_3^2 / mu_2^3 = 0 (symmetric), and beta_2 = mu_4 / mu_2^2 = 3 (mesokurtic). Excess kurtosis is beta_2 - 3 = 0.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-210",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Hard",
    "q": "According to Chebyshev's inequality, what minimum proportion of any distribution must lie within k = 3 standard deviations of its mean?",
    "options": [
      "At least 88.89% (1 - 1/9 = 8/9)",
      "At least 75.00%",
      "At least 95.44%",
      "At least 99.73%"
    ],
    "correct": 0,
    "explain": "Chebyshev's theorem guarantees that P(|X - mu| < k * sigma) \\ge 1 - 1/$k^{2}$. For k = 3: 1 - 1/9 = 8/9 ≈ 88.89% for any arbitrary distribution.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-211",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Hard",
    "q": "For two independent samples with n_1 = 10, mean_1 = 50, s_1^2 = 16 and n_2 = 10, mean_2 = 50, s_2^2 = 25, what is the pooled variance s_p^2?",
    "options": [
      "20.5",
      "20.0",
      "41.0",
      "18.2"
    ],
    "correct": 0,
    "explain": "When means are identical, pooled variance s_p^2 = (n_1 * s_1^2 + n_2 * s_2^2) / (n_1 + n_2) = (10*16 + 10*25) / 20 = (160 + 250) / 20 = 410 / 20 = 20.5.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-212",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Easy",
    "q": "What is the probability of rolling a prime number on a single throw of a standard fair six-sided die?",
    "options": [
      "1/2",
      "1/3",
      "2/3",
      "5/6"
    ],
    "correct": 0,
    "explain": "The prime outcomes on a six-sided die are {2, 3, 5}. Total outcomes = 6. P(Prime) = 3/6 = 1/2.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-213",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Easy",
    "q": "For two mutually exclusive and collectively exhaustive events E_1 and E_2 defined on sample space S, what is the value of P(E_1) + P(E_2)?",
    "options": [
      "1.0",
      "0.0",
      "0.5",
      "P(E_1 ∩ E_2)"
    ],
    "correct": 0,
    "explain": "Collectively exhaustive events encompass all outcomes in sample space S (E_1 ∪ E_2 = S). Because they are disjoint, the addition axiom yields P(E_1) + P(E_2) = P(S) = 1.0.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-214",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Easy",
    "q": "If a fair coin is tossed 3 times independently, what is the probability of obtaining exactly 2 Heads?",
    "options": [
      "3/8",
      "1/8",
      "1/2",
      "5/8"
    ],
    "correct": 0,
    "explain": "Using binomial probability: P(X = 2) = $\\binom{3}{2} *  (1/2)^{2}$ * $(1/2)^{1}$ = 3 * (1/8) = 3/8.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-215",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Easy",
    "q": "What is the expected value E(X) of a discrete random variable X having possible values {0, 1} with P(X=0) = 0.4 and P(X=1) = 0.6?",
    "options": [
      "0.6",
      "0.5",
      "0.4",
      "1.0"
    ],
    "correct": 0,
    "explain": "E(X) = sum(x * P(x)) = (0 * 0.4) + (1 * 0.6) = 0 + 0.6 = 0.6 (the Bernoulli parameter p).",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-216",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Medium",
    "q": "Two independent events A and B have probabilities P(A) = 0.4 and P(B) = 0.5. What is P(A ∪ B)?",
    "options": [
      "0.70",
      "0.90",
      "0.20",
      "0.60"
    ],
    "correct": 0,
    "explain": "For independent events, P(A ∩ B) = P(A) * P(B) = 0.4 * 0.5 = 0.20. Then P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.4 + 0.5 - 0.20 = 0.70.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-217",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Medium",
    "q": "In a Poisson distribution with mean parameter lambda = 4, what is the variance of the distribution?",
    "options": [
      "4",
      "2",
      "16",
      "1"
    ],
    "correct": 0,
    "explain": "A signature property of the Poisson distribution is that its mean and variance are identical: Mean = lambda and Variance = lambda = 4.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-218",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Medium",
    "q": "In a standard normal distribution Z ~ N(0, 1), what percentage of total probability lies within the interval [-1, +1]?",
    "options": [
      "Approximately 68.27%",
      "Approximately 95.45%",
      "Approximately 99.73%",
      "Approximately 50.00%"
    ],
    "correct": 0,
    "explain": "Under the empirical rule for normal curves, approximately 68.27% of total probability mass falls within 1 standard deviation of the mean (mu ± 1*sigma).",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-219",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Medium",
    "q": "What is the variance of a Binomial random variable with n = 100 trials and probability of success p = 0.2?",
    "options": [
      "16",
      "20",
      "4",
      "80"
    ],
    "correct": 0,
    "explain": "For Binomial(n, p): Variance = n * p * q = 100 * 0.2 * (1 - 0.2) = 100 * 0.2 * 0.8 = 16.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-220",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Hard",
    "q": "A medical diagnostic test has 95% sensitivity (true positive) and 90% specificity (true negative). In a population with 2% disease prevalence, what is the posterior probability P(Disease | Positive) using Bayes' Theorem?",
    "options": [
      "Approximately 16.2%",
      "Approximately 95.0%",
      "Approximately 50.0%",
      "Approximately 2.0%"
    ],
    "correct": 0,
    "explain": "P(D)=0.02, P(+|D)=0.95, P(+|no D)=0.10. P(+) = (0.95*0.02) + (0.10*0.98) = 0.019 + 0.098 = 0.117. P(D|+) = 0.019 / 0.117 ≈ 16.24%.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-221",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Hard",
    "q": "If continuous random variable X has probability density function f(x) = 2x for 0 \\le x \\le 1 (and 0 elsewhere), what is the expected value E(X)?",
    "options": [
      "2/3",
      "1/2",
      "3/4",
      "1/3"
    ],
    "correct": 0,
    "explain": "E(X) = integral from 0 to 1 of x * f(x) dx = integral from 0 to 1 of $2x^{2}$ dx = [ (2/3) * $x^{3}$ ]_0^1 = 2/3.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-222",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Hard",
    "q": "In a Hypergeometric distribution, sampling is conducted under which physical condition?",
    "options": [
      "Without replacement from a finite population of known size N",
      "With replacement from an infinite population",
      "At constant continuous time intervals",
      "Until the first success occurs"
    ],
    "correct": 0,
    "explain": "The Hypergeometric distribution models the number of successes in n draws without replacement from a finite population of size N containing M successes.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-223",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Hard",
    "q": "What is the moment-generating function (MGF) M_X(t) of an Exponential distribution with rate parameter lambda?",
    "options": [
      "lambda / (lambda - t) for t < lambda",
      "$(1 - lambda*t)^{-1}$",
      "exp(lambda * t)",
      "lambda / (t - lambda)"
    ],
    "correct": 0,
    "explain": "M_X(t) = E(e^{tX}) = integral_0^inf e^{tx} * lambda * e^{-lambda*x} dx = lambda * integral_0^inf e^{-(lambda - t}x) dx = lambda / (lambda - t) for t < lambda.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-224",
    "subject": "Statistics",
    "topic": "Probability & Probability Distributions",
    "difficulty": "Hard",
    "q": "If X and Y are independent random variables with Var(X) = 9 and Var(Y) = 16, what is the variance of the difference: Var(2X - 3Y)?",
    "options": [
      "180",
      "108",
      "-108",
      "72"
    ],
    "correct": 0,
    "explain": "For independent variables, Var(aX - bY) = $a^{2}$ * Var(X) + $b^{2}$ * Var(Y) = $2^{2}$(9) + $(-3)^{2}$(16) = 4(9) + 9(16) = 36 + 144 = 180.",
    "chapter": "Probability & Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-225",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Easy",
    "q": "A numerical characteristic calculated from a complete census of an entire population is called a:",
    "options": [
      "Parameter",
      "Statistic",
      "Sample estimate",
      "Standard error"
    ],
    "correct": 0,
    "explain": "A parameter is a fixed numerical characteristic describing a population (e.g., mu, sigma), whereas a statistic is computed from a sample.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-226",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Easy",
    "q": "Which sampling technique guarantees that every possible sample of size n has an equal probability of selection?",
    "options": [
      "Simple Random Sampling",
      "Convenience Sampling",
      "Quota Sampling",
      "Purposive Sampling"
    ],
    "correct": 0,
    "explain": "Simple Random Sampling (SRS) ensures that every individual unit and every possible sample subset of size n has an identical, non-zero probability of being selected.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-227",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Easy",
    "q": "What is the standard deviation of the sampling distribution of a sample statistic formally called?",
    "options": [
      "Standard Error",
      "Sampling variance",
      "Mean deviation",
      "Residual deviation"
    ],
    "correct": 0,
    "explain": "The standard deviation of a sampling distribution (such as the distribution of sample means) is specifically designated as the Standard Error.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-228",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Easy",
    "q": "What happens to the Standard Error of the sample mean (sigma / $\\sqrt{n}$) when the sample size n is quadrupled (multiplied by 4)?",
    "options": [
      "It is halved (reduced by 50%)",
      "It is quartered (reduced to 25%)",
      "It is doubled",
      "It remains unchanged"
    ],
    "correct": 0,
    "explain": "Because Standard Error = sigma / $\\sqrt{n}$, replacing n with 4n gives sigma / $\\sqrt{4n}$ = (1/2) * (sigma / $\\sqrt{n}$), cutting the standard error in half.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-229",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Medium",
    "q": "According to the Central Limit Theorem (CLT), as sample size n becomes sufficiently large (typically n \\ge 30), what form does the sampling distribution of the sample mean assume?",
    "options": [
      "Approaches a Normal distribution regardless of the underlying population shape",
      "Approaches a Uniform distribution",
      "Matches the exact skewness of the parent population",
      "Collapses to a single deterministic point"
    ],
    "correct": 0,
    "explain": "The CLT establishes that the sampling distribution of the mean tends toward a normal distribution as n increases, even if the parent population is non-normal.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-230",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Medium",
    "q": "In sampling without replacement from a finite population of size N, what multiplier must be applied to the variance of the sample mean?",
    "options": [
      "Finite Population Correction factor: (N - n) / (N - 1)",
      "(N - 1) / N",
      "n / N",
      "sqrt((N - n) / N)"
    ],
    "correct": 0,
    "explain": "When sampling without replacement from a finite population N, the variance is scaled by the Finite Population Correction (FPC) factor: (N - n) / (N - 1).",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-231",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Medium",
    "q": "When a population is heterogeneous overall but consists of homogeneous sub-groups, which sampling method yields the most representative sample?",
    "options": [
      "Stratified Random Sampling",
      "Cluster Sampling",
      "Systematic Sampling",
      "Snowball Sampling"
    ],
    "correct": 0,
    "explain": "Stratified Random Sampling divides a heterogeneous population into mutually exclusive homogeneous strata and samples randomly within each stratum, reducing variance.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-232",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Medium",
    "q": "If a population has standard deviation sigma = 20 and a random sample of size n = 64 is drawn, what is the Standard Error of the mean?",
    "options": [
      "2.5",
      "0.3125",
      "5.0",
      "1.25"
    ],
    "correct": 0,
    "explain": "SE = sigma / $\\sqrt{n}$ = 20 / $\\sqrt{64}$ = 20 / 8 = 2.5.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-233",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Medium",
    "q": "An estimator T of a population parameter theta is defined as \"unbiased\" if and only if:",
    "options": [
      "E(T) = theta",
      "Var(T) = 0",
      "T = theta for all samples",
      "lim Var(T) = 0 as n -> inf"
    ],
    "correct": 0,
    "explain": "An estimator is unbiased if its mathematical expected value equals the true population parameter being estimated: E(T) = theta.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-234",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Hard",
    "q": "Why is the sample variance formula $s^{2}$ divided by (n - 1) rather than n?",
    "options": [
      "To correct for downward bias and make $s^{2}$ an unbiased estimator of population variance $sigma^{2}$",
      "To account for measurement instrument uncertainty",
      "Because one degree of freedom is lost to the population median",
      "To ensure standard deviation equals the mean deviation"
    ],
    "correct": 0,
    "explain": "Dividing by n underestimates $sigma^{2}$ because deviations are taken from sample mean x_bar rather than true population mean mu. Bessel's correction (dividing by n - 1) makes E($s^{2}$) = $sigma^{2}$.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-235",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Hard",
    "q": "If X_1, X_2, ..., X_k are independent standard normal random variables Z_i ~ N(0, 1), what distribution does the sum of their squares sum(Z_i^2) follow?",
    "options": [
      "Chi-Square distribution with k degrees of freedom",
      "Student's t-distribution with k degrees of freedom",
      "Snedecor's F-distribution with (k, 1) degrees of freedom",
      "Standard Normal distribution"
    ],
    "correct": 0,
    "explain": "By definition, the sum of k independent squared standard normal random variables follows a Chi-Square distribution with k degrees of freedom: sum(Z_i^2) ~ $Chi^{2}$(k).",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-236",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Hard",
    "q": "What sampling distribution arises from the ratio: Z / $\\sqrt{Y / nu}$, where Z ~ N(0, 1) and Y ~ $Chi^{2}$(nu) are independent random variables?",
    "options": [
      "Student's t-distribution with nu degrees of freedom",
      "F-distribution with (1, nu) degrees of freedom",
      "Gamma distribution with scale parameter nu",
      "Beta distribution"
    ],
    "correct": 0,
    "explain": "Gosset's Student's t-distribution is mathematically defined as the ratio of a standard normal variable Z to the square root of an independent chi-square variable divided by its degrees of freedom.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-237",
    "subject": "Statistics",
    "topic": "Sampling & Sampling Distributions",
    "difficulty": "Hard",
    "q": "According to the Rao-Blackwell theorem, how can an existing unbiased estimator of a parameter be improved?",
    "options": [
      "By conditioning the estimator upon a sufficient statistic",
      "By taking the reciprocal of its variance",
      "By multiplying it by Bessel's degrees of freedom factor",
      "By increasing the confidence interval width to 99%"
    ],
    "correct": 0,
    "explain": "The Rao-Blackwell theorem proves that conditioning any unbiased estimator on a sufficient statistic produces an estimator whose variance is less than or equal to the original estimator.",
    "chapter": "Sampling & Sampling Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-238",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Easy",
    "q": "In statistical hypothesis testing, what error is committed when a true null hypothesis H_0 is incorrectly rejected?",
    "options": [
      "Type I error (False Positive)",
      "Type II error (False Negative)",
      "Sampling bias",
      "Standard estimation error"
    ],
    "correct": 0,
    "explain": "A Type I error occurs when the researcher rejects the null hypothesis H_0 when H_0 is in fact true (probability designated as alpha, the significance level).",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-239",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Easy",
    "q": "What is the theoretical range of values for Pearson's product-moment correlation coefficient r?",
    "options": [
      "-1 \\le r <= +1",
      "0 \\le r \\le 1",
      "-inf < r < +inf",
      "-1 < r < 0"
    ],
    "correct": 0,
    "explain": "Pearson's correlation coefficient r is bounded strictly between -1 (perfect negative linear relationship) and +1 (perfect positive linear relationship).",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-240",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Easy",
    "q": "In the simple linear regression equation Y = beta_0 + beta_1 * X, what does beta_1 physically represent?",
    "options": [
      "The slope: change in Y for a one-unit increase in X",
      "The y-intercept when X = 1",
      "The correlation coefficient squared",
      "The standard error of estimate"
    ],
    "correct": 0,
    "explain": "beta_1 is the regression slope, representing the expected marginal change in response variable Y corresponding to a single unit increase in predictor variable X.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-241",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Easy",
    "q": "What does a p-value less than the chosen significance level (p < 0.05) indicate in a hypothesis test?",
    "options": [
      "Reject the null hypothesis H_0 in favor of the alternative hypothesis H_1",
      "Fail to reject the null hypothesis H_0",
      "Accept the null hypothesis as proven beyond doubt",
      "The test is invalid due to high variance"
    ],
    "correct": 0,
    "explain": "When the observed p-value is less than the pre-set significance threshold alpha, the observed sample evidence is sufficiently extreme under H_0 to reject the null hypothesis.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-242",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Medium",
    "q": "If the two linear regression coefficients between X and Y are b_yx = 0.8 and b_xy = 0.45, what is the value of Pearson's correlation coefficient r?",
    "options": [
      "0.6",
      "0.36",
      "0.625",
      "0.5"
    ],
    "correct": 0,
    "explain": "The correlation coefficient is the geometric mean of the two regression coefficients: r = $\\sqrt{b_yx * b_xy} =  \\sqrt{0.8 * 0.45} = \\sqrt{0.36}$ = 0.6.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-243",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Medium",
    "q": "What test statistic is used to test a hypothesis about a single population mean when the sample size is small (n = 16) and population variance $sigma^{2}$ is unknown?",
    "options": [
      "Student's t-test with (n - 1) degrees of freedom",
      "Z-test using standard normal distribution",
      "Chi-square goodness-of-fit test",
      "One-way ANOVA F-test"
    ],
    "correct": 0,
    "explain": "When sample size is small (n < 30) and population variance $sigma^{2}$ is unknown, replacing sigma with sample SD s mandates the use of Student's t-distribution with df = n - 1.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-244",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Medium",
    "q": "In linear regression, if the coefficient of determination is $R^{2}$ = 0.64, what percentage of the total variation in Y is explained by the regression on X?",
    "options": [
      "64%",
      "80%",
      "36%",
      "8%"
    ],
    "correct": 0,
    "explain": "The coefficient of determination $R^{2}$ represents the proportion of total sum of squares in Y that is accounted for or explained by the linear relationship with X (0.64 = 64%).",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-245",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Medium",
    "q": "What is the power of a statistical test (1 - beta) defined as?",
    "options": [
      "The probability of correctly rejecting a false null hypothesis",
      "The probability of committing a Type I error",
      "The probability of failing to reject a true null hypothesis",
      "The width of the 95% confidence interval"
    ],
    "correct": 0,
    "explain": "Power is 1 - beta (where beta is the probability of a Type II error); it measures the test's ability to detect a true effect and reject H_0 when H_0 is false.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-246",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Hard",
    "q": "In a contingency table with r = 3 rows and c = 4 columns, how many degrees of freedom are associated with the Chi-Square test of independence?",
    "options": [
      "6",
      "12",
      "7",
      "5"
    ],
    "correct": 0,
    "explain": "The degrees of freedom for a Chi-Square test of independence in an r x c contingency table is df = (r - 1) * (c - 1) = (3 - 1) * (4 - 1) = 2 * 3 = 6.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-247",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Hard",
    "q": "According to the Gauss-Markov theorem, the Ordinary Least Squares (OLS) estimators are BLUE. What does this acronym signify?",
    "options": [
      "Best Linear Unbiased Estimators (minimum variance among all linear unbiased estimators)",
      "Basic Logarithmic Universal Estimates",
      "Bounded Linear Uniform Estimates",
      "Bivariate Least Uncertainty Estimators"
    ],
    "correct": 0,
    "explain": "The Gauss-Markov theorem establishes that under standard regression assumptions, OLS estimators are BLUE: Best (minimum variance) Linear Unbiased Estimators.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-248",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Hard",
    "q": "What does the Neyman-Pearson Lemma prove regarding the Likelihood Ratio Test for simple versus simple hypotheses?",
    "options": [
      "It is Uniformly Most Powerful (UMP) of size alpha for testing simple H_0 vs simple H_1",
      "It minimizes the Type I error to exactly zero",
      "It makes parameter estimates completely independent of sample size",
      "It eliminates the need for normality assumptions"
    ],
    "correct": 0,
    "explain": "The Neyman-Pearson Lemma proves that for testing a simple null hypothesis against a simple alternative, the likelihood ratio test maximizes power (1 - beta) for a fixed significance level alpha.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-249",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Hard",
    "q": "In regression residual analysis, what condition is present when the variance of the error terms sigma_epsilon^2 is non-constant across levels of predictor X?",
    "options": [
      "Heteroscedasticity",
      "Multicollinearity",
      "Autocorrelation",
      "Endogeneity"
    ],
    "correct": 0,
    "explain": "Heteroscedasticity violates the classical regression assumption of constant error variance (homoscedasticity), resulting in inefficient OLS standard errors and invalid t-tests.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-250",
    "subject": "Statistics",
    "topic": "Hypothesis Testing & Correlation/Regression",
    "difficulty": "Hard",
    "q": "If the acute angle theta between the two linear regression lines Y on X and X on Y is zero degrees ($\\theta =  0^\\circ$), what does this indicate about correlation r?",
    "options": [
      "Perfect correlation: r = +1 or r = -1 (the two regression lines coincide completely)",
      "Zero correlation: r = 0 (the regression lines are mutually perpendicular)",
      "Weak correlation: r = 0.1",
      "Undefined correlation due to zero variance"
    ],
    "correct": 0,
    "explain": "The angle between regression lines satisfies tan(theta) = ((1 - $r^{2}$) / |r|) * (s_x * s_y / (s_x^2 + s_y^2)). When r = ±1, tan(theta) = 0, so $\\theta =  0^\\circ$ and the two lines merge into one.",
    "chapter": "Hypothesis Testing & Correlation/Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-251",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "What measure of central tendency corresponds to the observation with the highest frequency in a dataset?",
    "options": [
      "Mode",
      "Mean",
      "Median",
      "Geometric mean"
    ],
    "correct": 0,
    "explain": "The mode is defined as the value that appears most frequently in a collection of data values.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-252",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "For the dataset {4, 8, 9, 15, 24}, what is the sample range?",
    "options": [
      "20",
      "18",
      "24",
      "15"
    ],
    "correct": 0,
    "explain": "Range = Maximum value - Minimum value = 24 - 4 = 20.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-253",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "If each value x_i in a dataset is multiplied by a constant c (c > 0), how does the standard deviation change?",
    "options": [
      "Multiplied by c",
      "Multiplied by $c^{2}$",
      "Remains unchanged",
      "Increased by c"
    ],
    "correct": 0,
    "explain": "Scaling every observation by constant c scales the standard deviation by $|c|$. Thus SD(cX) = c * SD(X).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-254",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "What is the sum of deviations of all values in a dataset from their arithmetic mean, Σ(x_i - x̄)?",
    "options": [
      "Always equal to 0",
      "Always equal to 1",
      "Equal to sample variance",
      "Equal to sample size n"
    ],
    "correct": 0,
    "explain": "A fundamental algebraic property of the arithmetic mean is that the algebraic sum of deviations from the mean is always zero: Σ(x_i - x̄) = 0.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-255",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "For a dataset with first quartile Q1 = 28 and third quartile Q3 = 64, what is the Semi-Interquartile Range (Quartile Deviation)?",
    "options": [
      "18",
      "36",
      "46",
      "24"
    ],
    "correct": 0,
    "explain": "Quartile Deviation (Semi-Interquartile Range) = (Q3 - Q1) / 2 = (64 - 28) / 2 = 36 / 2 = 18.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-256",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "In a moderately skewed unimodal frequency distribution, if the mean is 45 and the median is 42, what is the empirical estimate of the mode?",
    "options": [
      "36",
      "40",
      "39",
      "44"
    ],
    "correct": 0,
    "explain": "Karl Pearson's empirical relationship states: Mode ≈ 3(Median) - 2(Mean) = 3(42) - 2(45) = 126 - 90 = 36.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-257",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "If the mean of a sample is 50 and its standard deviation is 10, what is the Coefficient of Variation (C.V.)?",
    "options": [
      "20%",
      "5%",
      "2%",
      "50%"
    ],
    "correct": 0,
    "explain": "Coefficient of Variation C.V. = (Standard Deviation / Mean) * 100% = (10 / 50) * 100% = 20%.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-258",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "What is the harmonic mean of the two numbers 4 and 12?",
    "options": [
      "6.0",
      "8.0",
      "6.93",
      "7.5"
    ],
    "correct": 0,
    "explain": "Harmonic Mean HM = 2 / (1/4 + 1/12) = 2 / (3/12 + 1/12) = 2 / (4/12) = 2 / (1/3) = 6.0.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-259",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "If the second central moment (variance) μ2 = 16 and the fourth central moment μ4 = 768, what is the coefficient of kurtosis β2, and how is the distribution classified?",
    "options": [
      "β2 = 3.0 (Mesokurtic)",
      "β2 = 4.0 (Leptokurtic)",
      "β2 = 2.5 (Platykurtic)",
      "β2 = 1.8 (Platykurtic)"
    ],
    "correct": 0,
    "explain": "Moment coefficient of kurtosis β2 = μ4 / (μ2)^2 = 768 / ($16^{2}$) = 768 / 256 = 3.0. When β2 = 3.0, the distribution is normal or mesokurtic.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-260",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "If two sub-samples have sizes n1 = 40 and n2 = 60 with means x̄1 = 70 and x̄2 = 80, and variances $s1^{2}$ = 16 and $s2^{2}$ = 25, what is the pooled variance s_pooled^2?",
    "options": [
      "45.4",
      "21.4",
      "20.5",
      "52.0"
    ],
    "correct": 0,
    "explain": "Combined mean x̄ = (40*70 + 60*80)/100 = 7600/100 = 76. Deviation d1 = 70 - 76 = -6, d2 = 80 - 76 = 4. Combined variance = [n1($s1^{2} +  d1^{2}$) + n2($s2^{2} +  d2^{2}$)] / (n1 + n2) = [40(16 + 36) + 60(25 + 16)] / 100 = [40(52) + 60(41)] / 100 = [2080 + 2460] / 100 = 4540 / 100 = 45.4.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-261",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "According to Chebyshev's Inequality, for any probability distribution with mean μ and standard deviation σ, what is the minimum proportion of data within k = 2.5 standard deviations of the mean?",
    "options": [
      "84%",
      "75%",
      "89%",
      "95%"
    ],
    "correct": 0,
    "explain": "Chebyshev's inequality states P(|X - μ| < kσ) ≥ 1 - 1/$k^{2}$. For k = 2.5, 1 - 1/(2.$5^{2}$) = 1 - 1/6.25 = 1 - 0.16 = 0.84 = 84%.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-262",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "How are Sheppard's corrections applied to the raw grouped central moments μ2 and μ4 when grouping continuous data into class intervals of width h?",
    "options": [
      "Corrected μ2 = μ2 - ($h^{2}$ / 12), Corrected μ4 = μ4 - ($h^{2}$ / 2)μ2 + ($7h^{4}$ / 240)",
      "Corrected μ2 = μ2 + ($h^{2}$ / 12), Corrected μ4 = μ4 + ($h^{2}$ / 2)μ2",
      "Corrected μ2 = μ2 - h, Corrected μ4 = μ4 - $h^{2}$",
      "Corrected μ2 = μ2 / h, Corrected μ4 = μ4 / $h^{2}$"
    ],
    "correct": 0,
    "explain": "Sheppard's corrections adjust grouped data central moments for the quantization error introduced by grouping: μ2(corrected) = μ2 - $h^{2}$/12 and μ4(corrected) = μ4 - ($h^{2}$/2)μ2 + $7h^{4}$/240.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-263",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "If the third central moment μ3 of a distribution is negative (μ3 < 0), what does this indicate regarding the geometric shape of the frequency curve?",
    "options": [
      "Negatively skewed (skewed to the left, longer tail towards smaller values)",
      "Positively skewed (skewed to the right, longer tail towards larger values)",
      "Strictly symmetric about the mean",
      "Uniformly flat distribution"
    ],
    "correct": 0,
    "explain": "The moment coefficient of skewness β1 is governed by the sign of μ3. When μ3 < 0, the distribution has a prolonged tail extending toward the left (negative skewness).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-264",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "If a fair six-sided die is rolled once, what is the probability of obtaining an even prime number?",
    "options": [
      "1/6",
      "1/2",
      "1/3",
      "2/3"
    ],
    "correct": 0,
    "explain": "The prime numbers on a die are {2, 3, 5}. The only even prime is 2. The probability of rolling a 2 is 1/6.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-265",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "For any two mutually exclusive events A and B with P(A) = 0.35 and P(B) = 0.40, what is P(A ∩ B)?",
    "options": [
      "0",
      "0.14",
      "0.75",
      "0.05"
    ],
    "correct": 0,
    "explain": "Mutually exclusive events cannot occur simultaneously, meaning their intersection is the empty set: P(A ∩ B) = 0.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-266",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "What is the total area under the probability density curve of any valid continuous random variable across its entire support?",
    "options": [
      "1.0",
      "100",
      "0.5",
      "Infinity"
    ],
    "correct": 0,
    "explain": "By definition of probability density functions, the integral of f(x) over (-∞, ∞) equals exactly 1.0.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-267",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "If P(E) is the probability of event E, what is the probability of its complementary event E'?",
    "options": [
      "1 - P(E)",
      "P(E)",
      "1 / P(E)",
      "P(E) - 1"
    ],
    "correct": 0,
    "explain": "By the law of complements, the probability of an event not occurring is P(E') = 1 - P(E).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-268",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "In a standard Normal distribution Z ~ N(0, 1), what are the numerical values of the mean μ and variance σ^2?",
    "options": [
      "μ = 0, σ^2 = 1",
      "μ = 1, σ^2 = 0",
      "μ = 0, σ^2 = 0",
      "μ = 1, σ^2 = 1"
    ],
    "correct": 0,
    "explain": "A standard normal variate Z has mean μ = 0 and standard deviation σ = 1 (and variance σ^2 = 1).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-269",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "In a Binomial distribution B(n, p) with n = 8 trials and success probability p = 0.25, what are the theoretical mean and variance?",
    "options": [
      "Mean = 2.0, Variance = 1.5",
      "Mean = 2.0, Variance = 2.0",
      "Mean = 2.5, Variance = 1.875",
      "Mean = 1.5, Variance = 1.125"
    ],
    "correct": 0,
    "explain": "Mean = np = 8 * 0.25 = 2.0. Variance = np(1 - p) = 8 * 0.25 * 0.75 = 2.0 * 0.75 = 1.5.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-270",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "For a Poisson distribution with parameter λ = 4, what is the standard deviation?",
    "options": [
      "2.0",
      "4.0",
      "16.0",
      "1.414"
    ],
    "correct": 0,
    "explain": "In a Poisson distribution, Mean = Variance = λ = 4. Therefore, Standard Deviation = $\\sqrt{Variance} =  \\sqrt{4}$ = 2.0.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-271",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "If two independent events A and B have probabilities P(A) = 0.6 and P(B) = 0.3, what is P(A ∪ B)?",
    "options": [
      "0.72",
      "0.90",
      "0.18",
      "0.50"
    ],
    "correct": 0,
    "explain": "For independent events, P(A ∩ B) = P(A) * P(B) = 0.6 * 0.3 = 0.18. Then P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.6 + 0.3 - 0.18 = 0.72.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-272",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "What is the probability of getting exactly 2 heads in 3 independent tosses of a fair coin?",
    "options": [
      "3/8",
      "1/8",
      "1/2",
      "5/8"
    ],
    "correct": 0,
    "explain": "Using the Binomial formula: P(X = 2) = (3 choose 2) * $(1/2)^{2} *  (1/2)^{1}$ = 3 * (1/4) * (1/2) = 3/8.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-273",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "A continuous random variable X follows an Exponential distribution with rate parameter λ = 0.5. What is the conditional probability P(X > 6 | X > 2) using its memoryless property?",
    "options": [
      "e^{-2}",
      "e^{-3}",
      "e^{-1}",
      "1 - e^{-2}"
    ],
    "correct": 0,
    "explain": "By the memoryless property of the Exponential distribution, P(X > s + t | X > s) = P(X > t). Here s = 2, s + t = 6 -> t = 4. P(X > 4) = e^{-λt} = e^{-0.5 * 4} = e^{-2}.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-274",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "In a medical screening test, disease prevalence in the population is 1% (P(D) = 0.01). The diagnostic test has sensitivity 95% (P(+|D) = 0.95) and false positive rate 5% (P(+|D') = 0.05). By Bayes' Theorem, what is the positive predictive value P(D|+)?",
    "options": [
      "≈ 16.1%",
      "≈ 95.0%",
      "≈ 50.0%",
      "≈ 5.0%"
    ],
    "correct": 0,
    "explain": "Bayes' Theorem: P(D|+) = P(+|D)P(D) / [P(+|D)P(D) + P(+|D')P(D')] = (0.95 * 0.01) / [(0.95 * 0.01) + (0.05 * 0.99)] = 0.0095 / (0.0095 + 0.0495) = 0.0095 / 0.0590 ≈ 0.161 (16.1%).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-275",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "What is the Moment Generating Function (MGF) M_X(t) of a Normal random variable X ~ N(μ, σ^2)?",
    "options": [
      "exp(μt + 0.5 * σ^2 * $t^{2}$)",
      "exp(μt - 0.5 * σ^2 * $t^{2}$)",
      "(1 - 2t)^(-μ/2)",
      "exp(λ($e^{t}$ - 1))"
    ],
    "correct": 0,
    "explain": "The moment generating function of a normally distributed random variable is given by M_X(t) = E[e^{tX}] = exp(μt + 0.5 * σ^2 * $t^{2}$).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-276",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "Under what asymptotic conditions does the Hypergeometric distribution converge to the Binomial distribution B(n, p)?",
    "options": [
      "When population size N -> ∞ while sampling ratio n/N -> 0, with proportion p = k/N remaining constant",
      "When number of successes k -> 0",
      "When sample size n approaches N",
      "Only when sampling is performed with replacement"
    ],
    "correct": 0,
    "explain": "As the population size N becomes very large relative to sample size n (n/N < 0.05), sampling without replacement approximates independent trials with constant success probability p = k/N.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-277",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What is the numerical value calculated from sample observations called, which is used to estimate an unknown population parameter?",
    "options": [
      "Statistic",
      "Parameter",
      "Variance component",
      "Critical value"
    ],
    "correct": 0,
    "explain": "A descriptive measure calculated from sample data is called a statistic, whereas a descriptive measure of an entire population is a parameter.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-278",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What is the standard error of the sample mean (SE) when drawing random samples of size n from a population with known standard deviation σ?",
    "options": [
      "σ / $\\sqrt{n}$",
      "σ * $\\sqrt{n}$",
      "σ^2 / n",
      "n / σ"
    ],
    "correct": 0,
    "explain": "The standard error of the sample mean is the standard deviation of its sampling distribution: SE(x̄) = σ / $\\sqrt{n}$.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-279",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What sampling design divides a heterogeneous population into distinct homogeneous non-overlapping strata and draws random samples from each stratum?",
    "options": [
      "Stratified Random Sampling",
      "Simple Random Sampling",
      "Cluster Sampling",
      "Convenience Sampling"
    ],
    "correct": 0,
    "explain": "Stratified sampling ensures representation by partitioning a heterogeneous population into internally homogeneous subgroups (strata) and sampling within each.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-280",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What property does an estimator T possess if its mathematical expectation equals the true population parameter θ (E[T] = θ)?",
    "options": [
      "Unbiasedness",
      "Efficiency",
      "Sufficiency",
      "Consistency"
    ],
    "correct": 0,
    "explain": "An estimator T is unbiased for parameter θ if its expected value is identically equal to θ: E[T] = θ.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-281",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "When sampling without replacement from a finite population of size N, what is the Finite Population Correction (FPC) factor applied to the variance of the sample mean?",
    "options": [
      "(N - n) / (N - 1)",
      "sqrt((N - n) / N)",
      "(N - 1) / (N - n)",
      "N / (N - n)"
    ],
    "correct": 0,
    "explain": "The finite population correction factor for the variance of the sample mean in sampling without replacement is FPC = (N - n) / (N - 1).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-282",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "According to the Central Limit Theorem (CLT), what happens to the sampling distribution of the sample mean x̄ as the sample size n becomes sufficiently large (n ≥ 30)?",
    "options": [
      "It approaches a Normal distribution regardless of the underlying population shape",
      "It approaches a Student's t-distribution with n degrees of freedom",
      "It becomes strictly Uniform across all ranges",
      "It degenerates into a single point mass"
    ],
    "correct": 0,
    "explain": "The CLT states that the distribution of sample means approaches normality as n increases, provided the population has a finite variance, irrespective of the population distribution.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-283",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "If a random sample of size n = 25 is drawn from a normal distribution with unknown variance and sample standard deviation s = 6.0, what is the estimated standard error of the sample mean s_x̄?",
    "options": [
      "1.20",
      "0.24",
      "1.50",
      "2.50"
    ],
    "correct": 0,
    "explain": "Estimated standard error s_x̄ = s / $\\sqrt{n}$ = 6.0 / $\\sqrt{25}$ = 6.0 / 5 = 1.20.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-284",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "For a random sample of size n = 64 with sample mean x̄ = 120 from a population with known standard deviation σ = 16, what is the 95% confidence interval for the population mean μ (using Z = 1.96)?",
    "options": [
      "[116.08, 123.92]",
      "[118.04, 121.96]",
      "[112.16, 127.84]",
      "[110.00, 130.00]"
    ],
    "correct": 0,
    "explain": "SE = σ / $\\sqrt{n}$ = 16 / $\\sqrt{64}$ = 16 / 8 = 2. Margin of error = Z * SE = 1.96 * 2 = 3.92. CI = 120 ± 3.92 = [116.08, 123.92].",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-285",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "What mathematical lower bound does the Cramér-Rao Inequality establish for the variance of any unbiased estimator T of parameter θ?",
    "options": [
      "Var(T) ≥ 1 / I(θ), where I(θ) is Fisher's Information",
      "Var(T) ≥ 1 / $\\sqrt{n}$",
      "Var(T) ≥ σ^2 / $n^{2}$",
      "Var(T) ≤ 1 / I(θ)"
    ],
    "correct": 0,
    "explain": "The Cramér-Rao Lower Bound (CRLB) proves that for any unbiased estimator T, Var(T) cannot be less than the reciprocal of Fisher Information I(θ).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-286",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "Under the Neyman-Pearson framework, what makes an estimator consistent for parameter θ?",
    "options": [
      "As sample size n -> ∞, the estimator converges in probability to the true parameter θ",
      "Its variance is smaller than all other estimators for all n",
      "Its sampling distribution is exactly symmetric for all n",
      "Its expected value is zero for all n"
    ],
    "correct": 0,
    "explain": "Consistency is a large-sample asymptotic property: for any ε > 0, lim_{n -> ∞} P(|T_n - θ| < ε) = 1 (convergence in probability).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-287",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "In Maximum Likelihood Estimation (MLE), what mathematical equation is solved to find the parameter estimate θ̂?",
    "options": [
      "d/dθ [ln L(θ; x)] = 0",
      "d/dθ [L(θ; x)] = 1",
      "∫ L(θ; x) dθ = 0",
      "E[L(θ; x)] = θ"
    ],
    "correct": 0,
    "explain": "The maximum likelihood estimate maximizes the log-likelihood function by setting the score function (first derivative of log-likelihood with respect to θ) to zero.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-288",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "By the Rao-Blackwell Theorem, how can an existing unbiased estimator T be improved to produce an estimator with equal or lower variance?",
    "options": [
      "By taking the conditional expectation E[T | S], where S is a sufficient statistic for θ",
      "By multiplying T by the sample size n",
      "By taking the square root of the likelihood ratio",
      "By replacing the sample mean with the sample median"
    ],
    "correct": 0,
    "explain": "Rao-Blackwell states that conditioning any unbiased estimator on a sufficient statistic S produces an estimator T* = E[T | S] that is unbiased and has Var(T*) ≤ Var(T).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-289",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "In Neyman allocation for stratified sampling, how are sample sizes n_h distributed across strata to minimize the variance of the estimated mean for a fixed total sample size n?",
    "options": [
      "Proportional to N_h * S_h (product of stratum size and stratum standard deviation)",
      "Equally across all strata regardless of size or variability",
      "Proportional strictly to stratum size N_h only",
      "Proportional to 1 / S_h"
    ],
    "correct": 0,
    "explain": "Neyman optimal allocation allocates more sample units to strata that are larger (N_h) and have higher internal variability (S_h): n_h = n * (N_h * S_h) / Σ(N_i * S_i).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-290",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "What type of statistical error is committed when a researcher rejects a true null hypothesis (H0)?",
    "options": [
      "Type I error (False Positive)",
      "Type II error (False Negative)",
      "Sampling bias error",
      "Standard error"
    ],
    "correct": 0,
    "explain": "A Type I error (alpha) occurs when the null hypothesis H0 is rejected even though it is genuinely true.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-291",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "What is the probability of rejecting a false null hypothesis called?",
    "options": [
      "Power of the test (1 - β)",
      "Significance level (α)",
      "Type I error probability",
      "Confidence level"
    ],
    "correct": 0,
    "explain": "The power of a statistical test is 1 - β, representing the probability of correctly rejecting H0 when H0 is false.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-292",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "In testing the hypothesis H0: μ = 50 against H1: μ ≠ 50, what kind of test should be conducted?",
    "options": [
      "Two-tailed test",
      "Right-tailed test",
      "Left-tailed test",
      "One-way ANOVA"
    ],
    "correct": 0,
    "explain": "An alternative hypothesis with \"≠\" specifies rejection regions in both tails of the test statistic distribution, requiring a two-tailed test.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-293",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "If the p-value obtained from a test statistic is 0.02 and the chosen level of significance is α = 0.05, what is the statistical decision?",
    "options": [
      "Reject the null hypothesis H0",
      "Fail to reject H0",
      "Accept H0 as definitely true",
      "Inconclusive test"
    ],
    "correct": 0,
    "explain": "When p-value ≤ α (0.02 ≤ 0.05), the observed data is statistically significant, warranting rejection of the null hypothesis.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-294",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "Under what conditions is Student's t-test used instead of the Z-test to test a population mean μ?",
    "options": [
      "When the population standard deviation σ is unknown and the sample size is small (n < 30) from a normal population",
      "When the population standard deviation σ is known",
      "When the sample size is greater than 10,000",
      "When the data is qualitative and categorical"
    ],
    "correct": 0,
    "explain": "Student's t-test is appropriate when testing means from a normally distributed population where the population standard deviation σ is unknown and estimated by s with small n.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-295",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "In a contingency table with r rows and c columns, what are the degrees of freedom for the Chi-square (χ^2) test of independence?",
    "options": [
      "(r - 1)(c - 1)",
      "r * c - 1",
      "(r - 1) + (c - 1)",
      "r * c"
    ],
    "correct": 0,
    "explain": "The degrees of freedom for testing independence in an r x c contingency table are df = (r - 1)(c - 1).",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-296",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "In One-Way Analysis of Variance (ANOVA), what is the test statistic F calculated as?",
    "options": [
      "Between-group mean square / Within-group mean square (MSB / MSW)",
      "Total sum of squares / Within-group sum of squares",
      "Sample mean / Standard deviation",
      "Within-group variance / Total variance"
    ],
    "correct": 0,
    "explain": "The F-ratio in ANOVA is the ratio of treatment variance to error variance: F = Mean Square Between (MSB) / Mean Square Within (MSW).",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-297",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "What is the formula for the test statistic in a Chi-square Goodness-of-Fit test with observed frequencies O_i and expected frequencies E_i?",
    "options": [
      "Σ [(O_i - E_i)^2 / E_i]",
      "Σ [(O_i - E_i) / E_i]",
      "Σ [(O_i - E_i)^2 / O_i]",
      "sqrt(Σ (O_i - E_i)^2)"
    ],
    "correct": 0,
    "explain": "The Pearson Chi-square test statistic is calculated as χ^2 = Σ [(O_i - E_i)^2 / E_i] summed over all categories.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-298",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "According to the Neyman-Pearson Lemma, what defines the Most Powerful (MP) test of a simple null hypothesis H0: θ = θ0 versus a simple alternative H1: θ = θ1?",
    "options": [
      "A critical region defined by the likelihood ratio criterion: L(θ0; x) / L(θ1; x) ≤ k",
      "A test that minimizes the sample size n",
      "A test that sets Type I error probability α equal to Type II error probability β",
      "A test based purely on the sample median"
    ],
    "correct": 0,
    "explain": "The Neyman-Pearson Lemma proves that the test rejecting H0 for small values of the likelihood ratio L(θ0)/L(θ1) ≤ k achieves maximal power (1 - β) for a given significance level α.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-299",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "When conducting two-sample t-tests where population variances σ$1^{2}$ ≠ σ$2^{2}$ cannot be assumed equal, how is Welch's t-test adjusted?",
    "options": [
      "By using separate sample variances $s1^{2}$/n1 + $s2^{2}$/n2 and adjusting the degrees of freedom via the Welch-Satterthwaite equation",
      "By pooling the sample variances together as ($s1^{2} +  s2^{2}$)/2",
      "By multiplying the test statistic by 2",
      "By transforming the observations to logarithms"
    ],
    "correct": 0,
    "explain": "Welch's t-test does not pool variances; it computes standard error as $\\sqrt{$s1^{2}$/n1 + $s2^{2}$/n2}$ and approximates degrees of freedom using the Welch-Satterthwaite equation.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-300",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "In testing whether two independent normal population variances are equal (H0: σ$1^{2}$ = σ$2^{2}$), what distribution does the test statistic $s1^{2} /  s2^{2}$ follow?",
    "options": [
      "F-distribution with (n1 - 1, n2 - 1) degrees of freedom",
      "Student's t-distribution with n1 + n2 - 2 degrees of freedom",
      "Chi-square distribution with n1 - 1 degrees of freedom",
      "Standard Normal distribution"
    ],
    "correct": 0,
    "explain": "The ratio of two independent sample variances from normal populations follows an F-distribution with ν1 = n1 - 1 and ν2 = n2 - 1 degrees of freedom.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-301",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "What is Wilks' Theorem regarding the asymptotic null distribution of the Likelihood Ratio Test (LRT) statistic λ = -2 ln(L0 / L1)?",
    "options": [
      "As sample size n -> ∞, -2 ln(λ) converges in distribution to a Chi-square distribution with df equal to the difference in free parameters between models",
      "It converges to an F-distribution with infinite degrees of freedom",
      "It converges to a uniform distribution on [0, 1]",
      "It converges to a Cauchy distribution"
    ],
    "correct": 0,
    "explain": "Wilks' theorem establishes that the deviance statistic -2 ln(L0/L1) asymptotically follows a χ^2 distribution with degrees of freedom equal to the difference in parameter dimensionality.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-302",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "What is the mathematically possible range of values for Pearson's correlation coefficient r?",
    "options": [
      "-1.0 ≤ r ≤ +1.0",
      "0.0 ≤ r ≤ 1.0",
      "-∞ < r < +∞",
      "-0.5 ≤ r ≤ +0.5"
    ],
    "correct": 0,
    "explain": "Pearson's product-moment correlation coefficient r is bounded strictly between -1.0 (perfect negative correlation) and +1.0 (perfect positive correlation).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-303",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "In bivariate linear regression modeling, which variable is conventionally plotted along the horizontal axis as the predictor or independent variable?",
    "options": [
      "Explanatory (independent) variable X",
      "Dependent (response) variable Y",
      "Residual error e",
      "Standardized residual"
    ],
    "correct": 0,
    "explain": "By convention in regression coordinate systems, the independent (explanatory/predictor) variable X is assigned to the abscissa (horizontal axis).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-304",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "If Pearson's correlation coefficient r between two variables is 0, what does this indicate?",
    "options": [
      "Absence of any linear association",
      "Perfect quadratic association",
      "Data is completely invalid",
      "Variables are inversely related"
    ],
    "correct": 0,
    "explain": "r = 0 indicates that there is no linear relationship between the two variables (though non-linear relationships may still exist).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-305",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "What is the Coefficient of Determination $R^{2}$ in simple linear regression?",
    "options": [
      "The proportion of total variation in Y explained by its linear relationship with X",
      "The square root of the residual variance",
      "The ratio of slope to intercept",
      "The sum of squared errors"
    ],
    "correct": 0,
    "explain": "The coefficient of determination $R^{2} =  r^{2}$ represents the proportion of total variation in the dependent variable explained by the regression model.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-306",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "If the two regression coefficients are b_yx = 0.8 and b_xy = 0.45, what is the value of Pearson's correlation coefficient r?",
    "options": [
      "0.60",
      "0.36",
      "0.625",
      "0.50"
    ],
    "correct": 0,
    "explain": "The correlation coefficient is the geometric mean of the two regression coefficients: r = $\\sqrt{b_yx * b_xy} =  \\sqrt{0.8 * 0.45} = \\sqrt{0.36}$ = 0.60.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-307",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "What fundamental mathematical criterion defines Ordinary Least Squares (OLS) estimation for finding regression coefficients?",
    "options": [
      "Minimizing the sum of squared vertical residuals: Σ e_i^2 = Σ (y_i - ŷ_i)^2",
      "Maximizing the correlation coefficient r",
      "Minimizing the sum of absolute horizontal deviations",
      "Equating mean of X to mean of Y"
    ],
    "correct": 0,
    "explain": "Ordinary Least Squares chooses parameter estimates that minimize the sum of squared differences between observed values y_i and fitted values ŷ_i.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-308",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "Through which geometric point in the Cartesian plane does the OLS sample regression line ŷ = a + bx ALWAYS pass?",
    "options": [
      "(x̄, ȳ) (Point of means)",
      "(0, 0) (Origin)",
      "(1, 1)",
      "(s_x, s_y)"
    ],
    "correct": 0,
    "explain": "Because a = ȳ - b(x̄), substituting x = x̄ gives ŷ = ȳ - b(x̄) + b(x̄) = ȳ. Hence, the regression line always passes through (x̄, ȳ).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-309",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "What is Spearman's Rank Correlation Coefficient formula r_s when there are no ties in ranks for n pairs of observations?",
    "options": [
      "1 - [6 Σ d_i^2 / (n($n^{2}$ - 1))]",
      "1 - [Σ d_i^2 / n]",
      "[6 Σ d_i^2 / ($n^{2}$ - 1)]",
      "1 + [6 Σ d_i^2 / (n($n^{2}$ - 1))]"
    ],
    "correct": 0,
    "explain": "Spearman's rank correlation formula for untied ranks is r_s = 1 - [6 Σ d_i^2 / (n($n^{2}$ - 1))], where d_i is the difference between ranks.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-310",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "According to the Gauss-Markov Theorem, what properties do the Ordinary Least Squares (OLS) estimators possess under classical assumptions?",
    "options": [
      "BLUE: Best Linear Unbiased Estimator (minimum variance among all linear unbiased estimators)",
      "Asymptotically Cauchy distributed",
      "Possess zero residual variance",
      "Identical to median regression"
    ],
    "correct": 0,
    "explain": "The Gauss-Markov theorem proves that under homoscedasticity, exogeneity, and uncorrelated errors, OLS estimators are BLUE (Best Linear Unbiased Estimators).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-311",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "What is the effect of severe multicollinearity among explanatory variables in multiple linear regression?",
    "options": [
      "Inflates the standard errors of regression coefficients, leading to wide confidence intervals and unstable parameter estimates",
      "Reduces the $R^{2}$ value to zero",
      "Biases the OLS slope estimates away from their true expectation",
      "Forces all residuals to follow a uniform distribution"
    ],
    "correct": 0,
    "explain": "Multicollinearity does not bias OLS estimates, but it dramatically inflates the variances of estimated coefficients (high Variance Inflation Factor / VIF), making coefficients erratic and statistically insignificant.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-312",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "What is the definition of partial correlation coefficient r_12.3 between variables X1 and X2 after controlling for variable X3?",
    "options": [
      "(r_12 - r_13 * r_23) / [$\\sqrt{1 - r_13^2} *  \\sqrt{1 - r_23^2}$]",
      "(r_12 + r_13 * r_23) / (1 - r_23^2)",
      "$\\sqrt{r_12^2 + r_13^2 + r_23^2}$",
      "r_12 * r_13 * r_23"
    ],
    "correct": 0,
    "explain": "The partial correlation between X1 and X2 eliminating the linear influence of X3 is r_12.3 = (r_12 - r_13*r_23) / [$\\sqrt{1 - r_13^2} *  \\sqrt{1 - r_23^2}$].",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-313",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "How does the presence of heteroscedasticity (non-constant error variance Var(e_i) = σ_i^2) affect the validity of OLS inference?",
    "options": [
      "OLS estimates remain unbiased, but standard errors are biased, invalidating standard t-tests and F-tests unless robust White standard errors are used",
      "OLS estimators become systematically biased and inconsistent",
      "The $R^{2}$ value is guaranteed to exceed 1.0",
      "Heteroscedasticity automatically enforces normality of residuals"
    ],
    "correct": 0,
    "explain": "Under heteroscedasticity, OLS coefficients remain unbiased and consistent, but the standard error formulas underestimate or overestimate true variability, requiring Huber-White heteroscedasticity-consistent standard errors.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-314",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What is the base period index number value conventionally assigned to in price index calculations?",
    "options": [
      "100",
      "0",
      "1",
      "10"
    ],
    "correct": 0,
    "explain": "In index number construction, the benchmark base period index value is conventionally normalized to 100.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-315",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "Which component of a time series describes long-term smooth upward or downward movements over an extended duration?",
    "options": [
      "Secular Trend (T)",
      "Seasonal Variation (S)",
      "Cyclical Fluctuation (C)",
      "Irregular Variation (I)"
    ],
    "correct": 0,
    "explain": "The secular trend captures the smooth, long-term general tendency of a time series to grow or decline over many years or decades.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-316",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What time series component accounts for recurring patterns occurring at regular intervals within a single year (e.g., increased winter heating demand)?",
    "options": [
      "Seasonal Variation",
      "Secular Trend",
      "Cyclical Fluctuation",
      "Random Noise"
    ],
    "correct": 0,
    "explain": "Seasonal variation refers to periodic, rhythmic fluctuations that repeat annually within a span of 12 months or less due to climate, holidays, or business customs.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-317",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What weights does Laspeyres' Price Index formula utilize to measure price level changes between base period 0 and current period n?",
    "options": [
      "Base period quantities (q0)",
      "Current period quantities (qn)",
      "Average of base and current period quantities",
      "Base period prices (p0)"
    ],
    "correct": 0,
    "explain": "Laspeyres' price index is base-year quantity weighted: P_0n = [Σ (pn * q0) / Σ (p0 * q0)] * 100.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-318",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "What mathematical relationship connects Fisher's Ideal Index (F) to Laspeyres' Index (L) and Paasche's Index (P)?",
    "options": [
      "F = $\\sqrt{L * P}$ (Geometric mean of L and P)",
      "F = (L + P) / 2 (Arithmetic mean of L and P)",
      "F = 2 / (1/L + 1/P) (Harmonic mean of L and P)",
      "F = L * P"
    ],
    "correct": 0,
    "explain": "Irving Fisher's Ideal Index is defined as the geometric mean of Laspeyres' and Paasche's index numbers: F = $\\sqrt{L * P}$.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-319",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "In moving average smoothing of a time series with an even period (e.g., m = 4 quarters), what procedure is necessary to align moving averages with actual time points?",
    "options": [
      "Centering the moving average by taking a 2-period moving average of the 4-period moving averages",
      "Subtracting the mean from each observation",
      "Multiplying by 100",
      "Omitting the first and last years"
    ],
    "correct": 0,
    "explain": "Even-length moving averages fall midway between time periods; centering requires calculating a 2-period moving average of the results to align values with actual calendar periods.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-320",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "What index number consistency test is satisfied when P_01 * P_10 = 1?",
    "options": [
      "Time Reversal Test",
      "Factor Reversal Test",
      "Circular Test",
      "Unit Test"
    ],
    "correct": 0,
    "explain": "The Time Reversal Test formulated by Irving Fisher requires that interchanging the base period and current period yields the reciprocal of the original index: P_01 * P_10 = 1.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-321",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "In the multiplicative decomposition model of a time series, how is the observed series Y_t expressed in terms of its four components?",
    "options": [
      "Y_t = T_t * S_t * C_t * I_t",
      "Y_t = T_t + S_t + C_t + I_t",
      "Y_t = T_t / (S_t * C_t * I_t)",
      "Y_t = T_t * S_t + C_t * I_t"
    ],
    "correct": 0,
    "explain": "The multiplicative model assumes that seasonal, cyclical, and irregular effects operate as proportional multipliers on trend: Y_t = T_t * S_t * C_t * I_t.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-322",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "Which index number formula satisfies BOTH the Time Reversal Test and the Factor Reversal Test?",
    "options": [
      "Fisher's Ideal Index",
      "Laspeyres' Index",
      "Paasche's Index",
      "Marshall-Edgeworth Index"
    ],
    "correct": 0,
    "explain": "Fisher's Ideal Index is the only standard index number that satisfies both the Time Reversal Test (P_01 * P_10 = 1) and the Factor Reversal Test (P_01 * Q_01 = V_01).",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-323",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "In Box-Jenkins time series methodology, what condition defines a weakly (covariance) stationary stochastic process Y_t?",
    "options": [
      "Constant mean E[Y_t] = μ, constant variance Var(Y_t) = σ^2, and autocovariance Cov(Y_t, Y_{t-k}) dependent solely on lag k",
      "All observations Y_t are strictly independent and identically distributed",
      "The time series exhibits an upward linear trend",
      "The variance of the series grows proportionally with time t"
    ],
    "correct": 0,
    "explain": "Covariance stationarity requires that the mean and variance are time-invariant, and autocovariance depends only on the separation displacement (lag k), not absolute time.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-324",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "How does an Autoregressive model of order 1 (AR(1)): Y_t = c + φ Y_{t-1} + ε_t behave when the autoregressive parameter |φ| ≥ 1?",
    "options": [
      "The process contains a unit root or is explosive, resulting in a non-stationary time series with infinite memory",
      "The process is strictly stationary with rapidly decaying autocorrelation",
      "The process simplifies to pure white noise with zero autocorrelation",
      "The variance approaches zero asymptotically"
    ],
    "correct": 0,
    "explain": "For an AR(1) process to be stationary, the characteristic root must lie strictly outside the unit circle, requiring |φ| < 1. When φ = 1, it becomes a non-stationary random walk (unit root).",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-325",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "What is the theoretical Autocorrelation Function (ACF) signature of an autoregressive process of order p, AR(p)?",
    "options": [
      "Tails off gradually (exponentially decaying or damped sinusoidal waves), while the Partial Autocorrelation Function (PACF) cuts off sharply after lag p",
      "Cuts off sharply after lag p in the ACF while PACF tails off",
      "Zero at all non-zero lags in both ACF and PACF",
      "Constant at 1.0 across all lags"
    ],
    "correct": 0,
    "explain": "In AR(p) processes, the ACF decays smoothly towards zero (tailing off) via Yule-Walker difference equations, whereas the PACF cuts off cleanly to zero for all lags greater than p.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-326",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "What is the arithmetic mean of the dataset: 12, 18, 20, 22, 28?",
    "options": [
      "20",
      "18",
      "22",
      "100"
    ],
    "correct": 0,
    "explain": "Sum = 12 + 18 + 20 + 22 + 28 = 100. Mean = 100 / 5 = 20.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-327",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "Which measure of central tendency identifies the data value that appears with the highest frequency in a sample distribution?",
    "options": [
      "Mode",
      "Median",
      "Geometric Mean",
      "Harmonic Mean"
    ],
    "correct": 0,
    "explain": "The mode is defined as the observation that occurs with the greatest frequency in a dataset.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-328",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "What is the range of the following numerical observations: 14, 28, 9, 45, 33, 19?",
    "options": [
      "36",
      "45",
      "9",
      "26"
    ],
    "correct": 0,
    "explain": "Range = Maximum - Minimum = 45 - 9 = 36.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-329",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "If every observation in a sample is multiplied by a positive constant c = 3, what happens to the standard deviation of the sample?",
    "options": [
      "It is multiplied by 3",
      "It is multiplied by 9",
      "It remains unchanged",
      "It increases by 3"
    ],
    "correct": 0,
    "explain": "Standard deviation is directly scaled by the absolute factor: SD(c * X) = $|c|$ * SD(X) = 3 * SD(X).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-330",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Easy",
    "q": "What is the sum of deviations of a set of n observations from their arithmetic mean?",
    "options": [
      "Always exactly 0",
      "Always equal to n",
      "Equal to the sample variance",
      "Always positive"
    ],
    "correct": 0,
    "explain": "A fundamental algebraic property of the arithmetic mean is that sum(x_i - mean) = sum(x_i) - n * mean = 0.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-331",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "For a positively skewed (right-skewed) unimodal frequency distribution, what is the typical relationship between the mean, median, and mode?",
    "options": [
      "Mean > Median > Mode",
      "Mode > Median > Mean",
      "Mean = Median = Mode",
      "Median > Mean > Mode"
    ],
    "correct": 0,
    "explain": "In a right-skewed distribution, the long right tail pulls the mean to the right most, resulting in Mean > Median > Mode.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-332",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "How is the Interquartile Range (IQR) defined in terms of distribution quartiles?",
    "options": [
      "Q3 - Q1",
      "(Q3 - Q1) / 2",
      "Q3 + Q1",
      "Q2 - Q1"
    ],
    "correct": 0,
    "explain": "The Interquartile Range is the difference between the third quartile (75th percentile) and the first quartile (25th percentile): IQR = Q3 - Q1.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-333",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "If a dataset has an arithmetic mean of 50 and a variance of 25, what is its Coefficient of Variation (CV)?",
    "options": [
      "10%",
      "20%",
      "50%",
      "5%"
    ],
    "correct": 0,
    "explain": "Standard deviation = $\\sqrt{variance} =  \\sqrt{25}$ = 5. CV = (SD / Mean) * 100% = (5 / 50) * 100% = 10%.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-334",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Medium",
    "q": "Which measure of central tendency is mathematically optimal for calculating the average rate of speed over fixed equal distances?",
    "options": [
      "Harmonic Mean",
      "Arithmetic Mean",
      "Geometric Mean",
      "Median"
    ],
    "correct": 0,
    "explain": "The Harmonic Mean is the appropriate measure of central tendency when averaging rates or ratios over equal distances.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-335",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "What is the value of the fourth standardized central moment (kurtosis coefficient beta_2) for a perfectly mesokurtic standard normal distribution?",
    "options": [
      "3",
      "0",
      "1",
      "6"
    ],
    "correct": 0,
    "explain": "For a normal distribution, Pearson's kurtosis beta_2 = mu_4 / ($sigma^{4}$) = 3 (excess kurtosis gamma_2 = beta_2 - 3 = 0).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-336",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "Under Sheppard's corrections for grouped frequency distributions, what adjustment is applied to the second raw sample moment to correct for grouping error with class interval width h?",
    "options": [
      "Subtract $h^{2}$ / 12 from the calculated variance",
      "Add $h^{2}$ / 12 to the variance",
      "Subtract h / 6",
      "Divide the variance by $h^{2}$"
    ],
    "correct": 0,
    "explain": "Sheppard's correction states that grouping observations into intervals of width h inflates the second moment by $h^{2}$ / 12; hence mu_2(corrected) = mu_2 - ($h^{2}$ / 12).",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-337",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "According to Chebyshev's Inequality, what is the minimum proportion of any arbitrary probability distribution that must lie within k standard deviations of the mean (for k > 1)?",
    "options": [
      "1 - (1 / $k^{2}$)",
      "1 - (1 / k)",
      "1 / $k^{2}$",
      "(k - 1) / k"
    ],
    "correct": 0,
    "explain": "Chebyshev's theorem guarantees that P(|X - mu| < k*sigma) \\ge 1 - (1 / $k^{2}$) for any distribution with finite variance.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-338",
    "subject": "Statistics",
    "topic": "Descriptive Statistics",
    "difficulty": "Hard",
    "q": "For three non-negative, non-identical real numbers, what strict inequality relationship always holds between their Harmonic Mean (HM), Geometric Mean (GM), and Arithmetic Mean (AM)?",
    "options": [
      "HM < GM < AM",
      "AM < GM < HM",
      "GM < HM < AM",
      "HM = GM < AM"
    ],
    "correct": 0,
    "explain": "By the Cauchy-Schwarz and AM-GM-HM inequalities, for distinct positive values: HM < GM < AM.",
    "chapter": "Descriptive Statistics",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-339",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "Two fair 6-sided dice are rolled simultaneously. What is the probability of obtaining a sum of 7?",
    "options": [
      "6 / 36 (1/6)",
      "5 / 36",
      "7 / 36",
      "4 / 36 (1/9)"
    ],
    "correct": 0,
    "explain": "Combinations giving sum 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) -> 6 outcomes out of 36 total, so 6/36 = 1/6.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-340",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "If events A and B are mutually exclusive (disjoint), what is P(A and B)?",
    "options": [
      "0",
      "1",
      "P(A) * P(B)",
      "P(A) + P(B)"
    ],
    "correct": 0,
    "explain": "Mutually exclusive events cannot occur simultaneously, so the probability of their intersection is zero.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-341",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "A standard deck of 52 playing cards has 4 aces. What is the probability of drawing an ace at random in a single draw?",
    "options": [
      "4 / 52 (1/13)",
      "1 / 52",
      "2 / 52 (1/26)",
      "13 / 52 (1/4)"
    ],
    "correct": 0,
    "explain": "There are 4 aces in 52 cards: P(Ace) = 4 / 52 = 1 / 13.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-342",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Easy",
    "q": "If the probability of success in a single Bernoulli trial is p = 0.4, what is the probability of failure q?",
    "options": [
      "0.6",
      "0.4",
      "0.16",
      "1.0"
    ],
    "correct": 0,
    "explain": "In any Bernoulli trial, q = 1 - p = 1 - 0.4 = 0.6.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-343",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "In a Binomial distribution B(n, p) with n = 20 trials and success probability p = 0.3, what are the theoretical mean and variance?",
    "options": [
      "Mean = 6, Variance = 4.2",
      "Mean = 6, Variance = 6",
      "Mean = 4.2, Variance = 6",
      "Mean = 7, Variance = 4.9"
    ],
    "correct": 0,
    "explain": "Mean = n * p = 20 * 0.3 = 6. Variance = n * p * (1 - p) = 20 * 0.3 * 0.7 = 4.2.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-344",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "In a Poisson distribution with parameter lambda = 4, what is the variance of the random variable?",
    "options": [
      "4",
      "2",
      "16",
      "8"
    ],
    "correct": 0,
    "explain": "A defining property of the Poisson distribution is that its variance equals its mean parameter lambda: Var(X) = lambda = 4.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-345",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "For a continuous random variable X following a standard normal distribution Z ~ N(0, 1), what is P(Z = 1.5)?",
    "options": [
      "0",
      "0.0668",
      "0.9332",
      "0.5000"
    ],
    "correct": 0,
    "explain": "For any continuous random variable, the probability of taking on any single exact point value is zero: P(X = c) = 0.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-346",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "If P(A) = 0.5, P(B) = 0.4, and P(A ∩ B) = 0.2, are events A and B statistically independent?",
    "options": [
      "Yes, because P(A ∩ B) = P(A) * P(B)",
      "No, because P(A ∩ B) ≠ 0",
      "No, because P(A) ≠ P(B)",
      "Cannot be determined without conditional probabilities"
    ],
    "correct": 0,
    "explain": "Two events are independent if and only if P(A ∩ B) = P(A) * P(B). Here, 0.5 * 0.4 = 0.2, exactly matching P(A ∩ B).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-347",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Medium",
    "q": "What is the formula for Bayes' Theorem calculating the posterior probability P(A|B)?",
    "options": [
      "[P(B|A) * P(A)] / P(B)",
      "[P(A|B) * P(B)] / P(A)",
      "P(A ∩ B) * P(B)",
      "P(B|A) / [P(A) + P(B)]"
    ],
    "correct": 0,
    "explain": "Bayes' theorem states that P(A|B) = [P(B|A) * P(A)] / P(B).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-348",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "What is the moment-generating function (MGF) M_X(t) of a Poisson random variable X with parameter lambda?",
    "options": [
      "exp(lambda * ($e^{t}$ - 1))",
      "exp(lambda * t)",
      "$(1 - lambda * t)^{-1}$",
      "exp(mu * t + 0.5 * $sigma^{2} *  t^{2}$)"
    ],
    "correct": 0,
    "explain": "The MGF of Poisson(lambda) is E[e^{tX}] = sum_{k=0}^inf e^{tk} * ($lambda^{k}$e^{-lambda} / k!) = exp(lambda * ($e^{t}$ - 1)).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-349",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "Under what asymptotic conditions does a Binomial distribution B(n, p) converge to a Poisson distribution?",
    "options": [
      "As n -> infinity and p -> 0 such that the product n*p = lambda remains constant",
      "As n -> infinity and p -> 0.5",
      "As n -> 0 and p -> 1",
      "Whenever the sample variance equals $n^{2}$"
    ],
    "correct": 0,
    "explain": "Poisson approximation to the binomial occurs in the Law of Rare Events: when n is very large and p is very small such that n*p = lambda.",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-350",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "What unique mathematical property characterizes the continuous Exponential distribution, expressed as P(X > s + t | X > s) = P(X > t)?",
    "options": [
      "Memoryless property",
      "Central Limit property",
      "Infinite divisibility",
      "Mesokurtic symmetry"
    ],
    "correct": 0,
    "explain": "The memoryless property asserts that the remaining waiting time is independent of how much time has already elapsed: P(X > s + t | X > s) = P(X > t).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-351",
    "subject": "Statistics",
    "topic": "Probability & Distributions",
    "difficulty": "Hard",
    "q": "If X_1, X_2, ..., X_k are k independent standard normal random variables (Z_i ~ N(0, 1)), what probability distribution does the sum of their squares Q = sum_{i=1}^k (X_i)^2 follow?",
    "options": [
      "Chi-Square distribution with k degrees of freedom",
      "Student's t-distribution with k degrees of freedom",
      "F-distribution with (k, 1) degrees of freedom",
      "Standard Cauchy distribution"
    ],
    "correct": 0,
    "explain": "By definition, the sum of squares of k independent standard normal variates follows a Chi-Square distribution with k degrees of freedom: sum Z_i^2 ~ $chi^{2}$(k).",
    "chapter": "Probability & Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-352",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What is the term for a complete enumeration or investigation of every individual unit in a target population?",
    "options": [
      "Census",
      "Sample survey",
      "Pilot study",
      "Cluster sample"
    ],
    "correct": 0,
    "explain": "A census is a comprehensive 100% survey examining every element comprising the entire statistical population.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-353",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "In probability sampling, what is a complete list of all sampling units from which a sample is drawn called?",
    "options": [
      "Sampling frame",
      "Target stratum",
      "Sample size",
      "Parameter matrix"
    ],
    "correct": 0,
    "explain": "A sampling frame is the actual roster, index, or directory of accessible population members from which sample units are selected.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-354",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "What is the standard error of the sample mean (SE) drawn from an infinite population with standard deviation sigma and sample size n?",
    "options": [
      "sigma / $\\sqrt{n}$",
      "sigma / n",
      "$sigma^{2}$ / n",
      "sigma * $\\sqrt{n}$"
    ],
    "correct": 0,
    "explain": "The standard error of the sample mean measures the dispersion of sample means across repeated samples: SE = sigma / $\\sqrt{n}$.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-355",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Easy",
    "q": "A numerical characteristic calculated from a sample (such as sample mean x̄) is called a:",
    "options": [
      "Statistic",
      "Parameter",
      "Stratum",
      "Population census"
    ],
    "correct": 0,
    "explain": "A summary value computed from sample data is called a statistic; a summary value representing the whole population is a parameter.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-356",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "What property makes the sample mean x̄ an \"unbiased estimator\" of the population mean mu?",
    "options": [
      "Its expected value E[x̄] equals the population mean mu",
      "Its variance is zero",
      "It is always normally distributed",
      "It matches mu in every single sample"
    ],
    "correct": 0,
    "explain": "An estimator T is unbiased for parameter theta if its mathematical expectation equals theta: E[T] = theta. For sample mean, E[x̄] = mu.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-357",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "When sampling without replacement from a finite population of size N with sample size n, what finite population correction factor (FPCF) is applied to the standard error?",
    "options": [
      "sqrt((N - n) / (N - 1))",
      "sqrt((N - 1) / (N - n))",
      "(N - n) / N",
      "$\\sqrt{n / N}$"
    ],
    "correct": 0,
    "explain": "When sampling without replacement from a finite population, the variance is scaled by the finite population correction factor: (N - n) / (N - 1).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-358",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "What does the Central Limit Theorem (CLT) state regarding the sampling distribution of the sample mean x̄ for large sample sizes (n \\ge 30)?",
    "options": [
      "It approaches a normal distribution regardless of the underlying shape of the parent population",
      "It becomes identical to the original population distribution",
      "The sample variance becomes equal to the sample mean",
      "The population parameters become known constants"
    ],
    "correct": 0,
    "explain": "The CLT guarantees that as sample size n increases, the sampling distribution of x̄ converges to a normal distribution N(mu, $sigma^{2}$/n), even for non-normal populations.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-359",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "In Stratified Random Sampling, how is the population partitioned prior to sampling?",
    "options": [
      "Divided into mutually exclusive, internally homogeneous strata, and random samples are drawn from each stratum",
      "Divided into heterogeneous clusters where only a few clusters are surveyed",
      "Sampled at periodic intervals from an alphabetical list",
      "Selected based on convenient accessibility"
    ],
    "correct": 0,
    "explain": "Stratified sampling divides the population into non-overlapping groups (strata) that are homogeneous within and heterogeneous between, then samples within each.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-360",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "Why does sample variance calculated as $s^{2}$ = sum(x_i - x̄)^2 / (n - 1) use (n - 1) in the denominator instead of n?",
    "options": [
      "Bessel's correction to yield an unbiased estimator of the population variance $sigma^{2}$",
      "To account for measurement instrument errors",
      "Because one observation is discarded as an outlier",
      "To make the sample variance equal to standard deviation"
    ],
    "correct": 0,
    "explain": "Dividing by n underestimates $sigma^{2}$ because deviations are measured from sample mean x̄ rather than true mean mu. Dividing by n - 1 (Bessel's correction) ensures E[$s^{2}$] = $sigma^{2}$.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-361",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "What does the Cramér-Rao Lower Bound (CRLB) establish in mathematical estimation theory?",
    "options": [
      "The theoretical minimum variance that any unbiased point estimator can achieve, given by the reciprocal of the Fisher Information",
      "The maximum value of the likelihood function",
      "The minimum sample size needed for asymptotic normality",
      "The exact width of a non-parametric confidence interval"
    ],
    "correct": 0,
    "explain": "The Cramér-Rao inequality states that Var(T) \\ge 1 / I(theta), setting the lower bound on variance for any unbiased estimator T, where I(theta) is the Fisher Information.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-362",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "What criterion defines a \"Consistent Estimator\" T_n of parameter theta as sample size n grows indefinitely?",
    "options": [
      "T_n converges in probability to theta as n -> infinity (plim T_n = theta)",
      "The bias of T_n is strictly zero for every small n",
      "The variance of T_n equals 1 for all n",
      "T_n follows a Student's t-distribution for all sample sizes"
    ],
    "correct": 0,
    "explain": "An estimator is consistent if for every epsilon > 0, lim_{n->inf} P(|T_n - theta| < epsilon) = 1, meaning it converges in probability to the true parameter value.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-363",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "According to the Gauss-Markov Theorem, what distinguishes the Ordinary Least Squares (OLS) estimator in a classical linear regression model?",
    "options": [
      "It is the Best Linear Unbiased Estimator (BLUE), possessing minimum variance among all linear unbiased estimators",
      "It maximizes the coefficient of determination to exactly 1.0",
      "It eliminates all heteroscedasticity from residual disturbances",
      "It guarantees normally distributed regression residuals"
    ],
    "correct": 0,
    "explain": "The Gauss-Markov theorem proves that under classical assumptions (homoscedasticity, no autocorrelation), OLS estimates are BLUE (Best Linear Unbiased Estimators).",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-364",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Hard",
    "q": "In Neyman optimum allocation for stratified random sampling, how is sample size n_h for stratum h allocated relative to stratum size N_h and stratum standard deviation S_h?",
    "options": [
      "Proportional to N_h * S_h",
      "Proportional solely to N_h",
      "Proportional solely to S_h^2",
      "Inversely proportional to N_h * S_h"
    ],
    "correct": 0,
    "explain": "Neyman allocation minimizes total sampling variance for a fixed total sample size by choosing n_h proportional to N_h * S_h.",
    "chapter": "Sampling & Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-365",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "In statistical hypothesis testing, what is the default hypothesis of \"no effect\" or \"no difference\" called?",
    "options": [
      "Null Hypothesis (H0)",
      "Alternative Hypothesis (H1)",
      "Composite Hypothesis",
      "Research Hypothesis"
    ],
    "correct": 0,
    "explain": "The null hypothesis (H0) posits no significant difference or effect, serving as the benchmark tested against evidence.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-366",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "What error is committed when a researcher rejects a null hypothesis H0 that is actually true in reality?",
    "options": [
      "Type I error (False Positive)",
      "Type II error (False Negative)",
      "Standard error",
      "Sampling frame error"
    ],
    "correct": 0,
    "explain": "Rejecting a true null hypothesis is a Type I error (alpha), often called a false positive.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-367",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "What is the critical value z for a two-tailed hypothesis test conducted at the standard significance level $\\alpha$ = 0.05?",
    "options": [
      "±1.96",
      "±1.645",
      "±2.576",
      "±1.00"
    ],
    "correct": 0,
    "explain": "For a two-tailed test under standard normal distribution at $\\alpha$ = 0.05, $\\alpha$/2 = 0.025 in each tail, corresponding to z = ±1.96.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-368",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Easy",
    "q": "If the calculated p-value of a statistical test is less than the chosen significance level alpha (p < alpha), what decision is made?",
    "options": [
      "Reject the null hypothesis H0",
      "Fail to reject H0",
      "Accept H0 as conclusively proven",
      "Discard the dataset"
    ],
    "correct": 0,
    "explain": "When p < alpha, the observed data provides sufficient statistical evidence against H0 to justify rejecting the null hypothesis.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-369",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "What is the definition of statistical \"Power of a Test\"?",
    "options": [
      "1 - beta (probability of correctly rejecting a false null hypothesis)",
      "1 - alpha (confidence level)",
      "beta (probability of Type II error)",
      "alpha (probability of Type I error)"
    ],
    "correct": 0,
    "explain": "Power = 1 - $\\beta$ = P(Reject H0 | H0 is false). It represents the sensitivity of a test to detect a real effect.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-370",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "When testing a hypothesis concerning a population mean mu with a small sample (n < 30) from a normal population where population variance $sigma^{2}$ is unknown, which test statistic is appropriate?",
    "options": [
      "Student's t-test",
      "Z-test",
      "Chi-Square test of independence",
      "F-test of variances"
    ],
    "correct": 0,
    "explain": "When sample size is small and population standard deviation sigma is unknown, estimating sigma via sample standard deviation s yields a t-statistic with n - 1 degrees of freedom.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-371",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "What degrees of freedom are associated with a Chi-Square test of independence applied to an r x c contingency table?",
    "options": [
      "(r - 1) * (c - 1)",
      "r * c - 1",
      "(r - 1) + (c - 1)",
      "r * c"
    ],
    "correct": 0,
    "explain": "For an r x c contingency table with row and column marginal totals fixed, df = (r - 1) * (c - 1).",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-372",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "In testing equality of two population variances H0: sigma_1^2 = sigma_2^2 against H1: sigma_1^2 ≠ sigma_2^2, which distribution describes the ratio of sample variances F = s_1^2 / s_2^2?",
    "options": [
      "Snedecor's F-distribution",
      "Student's t-distribution",
      "Chi-square distribution",
      "Standard normal distribution"
    ],
    "correct": 0,
    "explain": "The ratio of two independent sample variances from normal populations follows Snedecor's F-distribution with (n1 - 1, n2 - 1) degrees of freedom.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-373",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "State the fundamental Neyman-Pearson Lemma regarding testing a simple null hypothesis H0: $\\theta$ = theta_0 against a simple alternative H1: $\\theta$ = theta_1:",
    "options": [
      "The likelihood ratio test provides the Uniformly Most Powerful (UMP) critical region of size alpha",
      "All tests have identical power curves",
      "The test minimizes both Type I and Type II error probabilities simultaneously to zero",
      "The p-value equals 0.5 under all sample conditions"
    ],
    "correct": 0,
    "explain": "The Neyman-Pearson lemma proves that the likelihood ratio test L(x; theta_0) / L(x; theta_1) \\le k yields the most powerful test of size alpha for simple hypotheses.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-374",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "When is Welch's t-test preferred over the standard two-sample pooled Student's t-test for comparing two independent population means?",
    "options": [
      "When the two population variances cannot be assumed equal (heteroscedasticity)",
      "When sample sizes are both greater than 1,000",
      "When data values are categorical counts",
      "When testing paired before-and-after observations on the same subjects"
    ],
    "correct": 0,
    "explain": "Welch's t-test does not assume equal population variances (heteroscedasticity) and adjusts the degrees of freedom using the Welch-Satterthwaite equation.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-375",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "In One-Way Analysis of Variance (ANOVA), what does the F-ratio test statistic compare?",
    "options": [
      "Mean Square Between Groups (MSB) divided by Mean Square Within Groups (MSW)",
      "Sum of Squares Total divided by Degrees of Freedom",
      "Sample Mean divided by Standard Deviation",
      "Between-group variance multiplied by within-group variance"
    ],
    "correct": 0,
    "explain": "ANOVA assesses group mean equality via F = MSB / MSW. Under H0 (all group means equal), this ratio follows an F-distribution.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-376",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "Why is Yates' continuity correction applied to the 2x2 contingency table Chi-Square test statistic?",
    "options": [
      "To correct for the approximation error of using a continuous Chi-Square distribution to model discrete cell counts",
      "To adjust for unequal sample sizes between groups",
      "To force the degrees of freedom to 2",
      "To transform the data into logarithmic form"
    ],
    "correct": 0,
    "explain": "Yates' correction subtracts 0.5 from |O - E| in 2x2 tables with small frequencies to adjust for approximating a discrete binomial distribution with continuous Chi-Square.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-377",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "What is the bounded mathematical range of Pearson's product-moment correlation coefficient r?",
    "options": [
      "-1 \\le r <= +1",
      "0 \\le r \\le 1",
      "-infinity < r < +infinity",
      "-0.5 \\le r <= +0.5"
    ],
    "correct": 0,
    "explain": "Pearson's r is strictly bounded between -1 (perfect negative linear correlation) and +1 (perfect positive linear correlation).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-378",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "If Pearson's correlation coefficient between two variables is r = 0, what does this indicate?",
    "options": [
      "Absence of any linear relationship",
      "A perfect parabolic relationship",
      "Zero variance in both variables",
      "Total deterministic dependence"
    ],
    "correct": 0,
    "explain": "r = 0 signifies no linear association between variables, though a non-linear (e.g., quadratic) relationship could still exist.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-379",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "In the simple linear regression equation Y = a + b*X, what parameter does b represent?",
    "options": [
      "Slope of the regression line",
      "Y-intercept",
      "Correlation coefficient",
      "Coefficient of determination"
    ],
    "correct": 0,
    "explain": "In Y = a + bX, b is the regression slope, representing the expected change in Y for a one-unit increase in X.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-380",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "What visual graphical tool is primarily used to inspect the bivariate relationship between two continuous variables?",
    "options": [
      "Scatter diagram",
      "Histogram",
      "Box-and-whisker plot",
      "Pie chart"
    ],
    "correct": 0,
    "explain": "A scatter plot plots paired (x, y) coordinates on Cartesian axes to display the direction, form, and strength of bivariate association.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-381",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "If the correlation coefficient between two variables is r = 0.8, what is the value of the Coefficient of Determination ($r^{2}$) and its interpretation?",
    "options": [
      "0.64; meaning 64% of the total variation in Y is explained by variation in X",
      "0.80; meaning 80% of data points fall on the line",
      "0.16; meaning the residual variance is 16%",
      "0.40; meaning the slope is positive"
    ],
    "correct": 0,
    "explain": "$r^{2}$ = 0.$8^{2}$ = 0.64. The coefficient of determination indicates that 64% of the total variation in Y is accounted for by the linear model.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-382",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "At what specific point do the two linear regression lines (Y on X and X on Y) always intersect?",
    "options": [
      "(x̄, ȳ), the point of sample means",
      "(0, 0), the origin",
      "(s_x, s_y), the standard deviations",
      "(median_x, median_y)"
    ],
    "correct": 0,
    "explain": "Both regression lines pass through the centroid of the data: (mean_x, mean_y), so they always intersect at (x̄, ȳ).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-383",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "If the two regression coefficients are b_yx = 0.8 and b_xy = 0.45, what is Pearson's correlation coefficient r?",
    "options": [
      "+0.60",
      "+0.36",
      "+0.625",
      "+0.80"
    ],
    "correct": 0,
    "explain": "Pearson's r is the geometric mean of the two regression coefficients: r = $\\sqrt{b_yx * b_xy} =  \\sqrt{0.8 * 0.45} = \\sqrt{0.36}$ = 0.60.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-384",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "How does Spearman's Rank Correlation Coefficient r_s measure association between two variables?",
    "options": [
      "By applying Pearson's formula to the ranks assigned to the observed values rather than raw values",
      "By computing the ratio of geometric means",
      "By squaring all deviations before ranking",
      "By testing differences between medians"
    ],
    "correct": 0,
    "explain": "Spearman's rank correlation measures monotonic relationships by ranking values and assessing linear correlation between the ranks.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-385",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "What does the Principle of Least Squares minimize to derive the optimal regression coefficients a and b in linear regression?",
    "options": [
      "The sum of squared vertical residuals: sum(y_i - ŷ_i)^2",
      "The sum of absolute horizontal deviations",
      "The product of the sample standard deviations",
      "The variance of the independent variable X"
    ],
    "correct": 0,
    "explain": "Ordinary least squares minimizes the residual sum of squares: RSS = sum (y_i - (a + b*x_i))^2.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-386",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "What happens to the angle theta between the two regression lines (Y on X and X on Y) as Pearson's correlation coefficient $|r|$ approaches 1?",
    "options": [
      "The angle theta approaches 0 degrees; the two lines coincide",
      "The angle theta approaches 90 degrees; lines become perpendicular",
      "The angle theta approaches 45 degrees",
      "The lines become parallel but never intersect"
    ],
    "correct": 0,
    "explain": "tan(theta) = ((1 - $r^{2}$) / |r|) * (s_x * s_y / (s_x^2 + s_y^2)). When $|r|$ = 1, tan(theta) = 0, so $\\theta$ = 0 degrees (coincident lines).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-387",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "In multiple linear regression, what statistical phenomenon occurs when two or more explanatory predictor variables are highly linearly correlated with each other?",
    "options": [
      "Multicollinearity, inflating standard errors of regression coefficients and destabilizing parameter estimates",
      "Autocorrelation, biasing residual variances",
      "Heteroscedasticity, rendering point estimates non-linear",
      "Endogeneity, creating negative degrees of freedom"
    ],
    "correct": 0,
    "explain": "Multicollinearity occurs when predictors are strongly intercorrelated, causing inflated standard errors and making individual coefficient estimates unstable.",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-388",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "What is the formula for the partial correlation coefficient r_12.3 measuring the linear correlation between variables X1 and X2 while controlling for variable X3?",
    "options": [
      "(r_12 - r_13 * r_23) / sqrt((1 - r_13^2) * (1 - r_23^2))",
      "(r_12 + r_13 * r_23) / (r_13 * r_23)",
      "$\\sqrt{r_12 * r_13 * r_23}$",
      "(r_12 - r_23) / (1 - r_13^2)"
    ],
    "correct": 0,
    "explain": "The first-order partial correlation formula is r_12.3 = (r_12 - r_13 * r_23) / sqrt((1 - r_13^2) * (1 - r_23^2)).",
    "chapter": "Correlation & Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-389",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What standard baseline value is conventionally assigned to the index number in the selected base period?",
    "options": [
      "100",
      "0",
      "1",
      "1000"
    ],
    "correct": 0,
    "explain": "Index numbers conventionally assign 100 to the base period (Base Index = 100), expressing subsequent periods as percentages of that base.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-390",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What are the four classical component forces underlying time series decomposition analysis?",
    "options": [
      "Secular Trend (T), Seasonal Variations (S), Cyclical Fluctuations (C), and Irregular/Random Movements (I)",
      "Mean, Variance, Skewness, and Kurtosis",
      "Base year, Current year, Weight, and Price",
      "Inflation, Deflation, Stagnation, and Recession"
    ],
    "correct": 0,
    "explain": "Classical time series models decompose movements into four distinct components: Trend (T), Seasonal (S), Cyclical (C), and Irregular (I).",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-391",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "Which price index formula utilizes base-period quantities (q0) as weights in its calculation?",
    "options": [
      "Laspeyres Price Index",
      "Paasche Price Index",
      "Fisher's Ideal Index",
      "Marshall-Edgeworth Index"
    ],
    "correct": 0,
    "explain": "The Laspeyres price index formula is L = [sum(p_n * q_0) / sum(p_0 * q_0)] * 100, weighting by base period quantities q0.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-392",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Easy",
    "q": "What time series component is responsible for repetitive, regular oscillatory patterns occurring within a fixed span of twelve months or less (e.g., ice cream sales surging every summer)?",
    "options": [
      "Seasonal Variation",
      "Secular Trend",
      "Cyclical Movement",
      "Random Noise"
    ],
    "correct": 0,
    "explain": "Seasonal variations are periodic rhythmic movements caused by climate, calendar, or social customs recurring within a single calendar year.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-393",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "Why is Fisher's Ideal Index Formula described as \"ideal\"?",
    "options": [
      "It is the geometric mean of Laspeyres and Paasche indices, satisfying both the Time Reversal Test and Factor Reversal Test",
      "It requires zero quantity weights",
      "It is computationally simpler than the simple price relative",
      "It is completely unaffected by changes in base year"
    ],
    "correct": 0,
    "explain": "Fisher's index F = $\\sqrt{L * P}$ is deemed ideal because it satisfies both the Time Reversal and Factor Reversal consistency tests.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-394",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "In time series trend estimation, what is the primary operational effect of calculating an m-period moving average on the original raw data series?",
    "options": [
      "Smooths out short-term seasonal and irregular fluctuations, highlighting the underlying long-term trend",
      "Amplifies cyclical business booms",
      "Interpolates missing future observations deterministically",
      "Forces all observations to equal zero"
    ],
    "correct": 0,
    "explain": "Moving averages smooth away higher-frequency short-term fluctuations and irregular noise, isolating the underlying secular trend.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-395",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "What test of consistency is satisfied by an index number formula if P_01 * P_10 = 1?",
    "options": [
      "Time Reversal Test",
      "Factor Reversal Test",
      "Circular Test",
      "Unit Test"
    ],
    "correct": 0,
    "explain": "The Time Reversal Test requires that reversing the time subscripts yields the reciprocal index: P_01 * P_10 = 1.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-396",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Medium",
    "q": "In the multiplicative decomposition model of time series, how is the observed value Y_t expressed in terms of its components?",
    "options": [
      "Y_t = T_t * S_t * C_t * I_t",
      "Y_t = T_t + S_t + C_t + I_t",
      "Y_t = (T_t + S_t) * (C_t + I_t)",
      "Y_t = T_t / (S_t * C_t * I_t)"
    ],
    "correct": 0,
    "explain": "The multiplicative model assumes the observed value is the product of all four components: Y = T * S * C * I.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-397",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "State the algebraic condition that must be satisfied for an index number formula to pass Irving Fisher's Factor Reversal Test:",
    "options": [
      "P_01 * Q_01 = sum(p_1 * q_1) / sum(p_0 * q_0) (Value Index V_01)",
      "P_01 * P_10 = 1",
      "P_01 * P_12 * P_20 = 1",
      "P_01 + Q_01 = 200"
    ],
    "correct": 0,
    "explain": "The Factor Reversal Test demands that interchanging price and quantity factors yields the true value ratio: P_01 * Q_01 = V_01.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-398",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "Which index number formula satisfies the Circular Test of consistency, permitting continuous chaining across multiple successive time periods?",
    "options": [
      "Simple Geometric Mean of Price Relatives (and Kelly's fixed-weight index)",
      "Laspeyres Price Index",
      "Paasche Price Index",
      "Fisher's Ideal Index"
    ],
    "correct": 0,
    "explain": "Neither Laspeyres, Paasche, nor Fisher satisfy the Circular Test; only fixed-weight aggregative indices (Kelly's) and simple geometric mean of price relatives satisfy it.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-399",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "What statistical definition characterizes a \"Strictly Stationary\" stochastic time series process {X_t}?",
    "options": [
      "The joint probability distribution of any collection of time points is invariant under arbitrary time shifts tau",
      "The mean increases monotonically with time",
      "All observations are uncorrelated with variance zero",
      "The series contains no seasonal variations"
    ],
    "correct": 0,
    "explain": "Strict stationarity requires that the joint distribution of (X_{t1}, ..., X_{tk}) is identical to (X_{t1+tau}, ..., X_{tk+tau}) for all shifts tau.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-400",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "In the Box-Jenkins ARIMA(p, d, q) time series modeling methodology, what do the parameters p, d, and q represent?",
    "options": [
      "p: order of autoregressive terms, d: degree of differencing for stationarity, q: order of moving average error terms",
      "p: probability, d: dispersion, q: quartile",
      "p: polynomial degree, d: decay factor, q: quality index",
      "p: population size, d: dummy variables, q: quarterly frequency"
    ],
    "correct": 0,
    "explain": "In ARIMA(p, d, q), p is the autoregressive (AR) order, d is the order of integration/differencing to attain stationarity, and q is the moving average (MA) order.",
    "chapter": "Index Numbers & Time Series",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-401",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Easy",
    "q": "Find the sample median of the dataset: 14, 7, 22, 9, 18, 5, 30.",
    "options": [
      "14",
      "18",
      "9",
      "15"
    ],
    "correct": 0,
    "explain": "Arranging in ascending order: 5, 7, 9, 14, 18, 22, 30. For n = 7, the median is the (7+1)/2 = 4th value, which is 14.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-402",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Easy",
    "q": "Which measure of central tendency is identified as the most frequently occurring value in a frequency distribution?",
    "options": [
      "Mode",
      "Arithmetic Mean",
      "Median",
      "Harmonic Mean"
    ],
    "correct": 0,
    "explain": "The mode represents the data observation with the highest relative frequency in a sample or population.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-403",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Easy",
    "q": "What is the statistical range of the sample observations: 12, 45, 8, 32, 19, 54, 21?",
    "options": [
      "46",
      "54",
      "42",
      "50"
    ],
    "correct": 0,
    "explain": "Range = Maximum - Minimum = 54 - 8 = 46.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-404",
    "subject": "Statistics",
    "topic": "Basic Probability",
    "difficulty": "Easy",
    "q": "A fair six-sided die is rolled once. What is the probability of obtaining an even prime number?",
    "options": [
      "1/6",
      "1/2",
      "1/3",
      "2/3"
    ],
    "correct": 0,
    "explain": "The faces are {1, 2, 3, 4, 5, 6}. The only even prime number is 2. Thus, probability = 1/6.",
    "chapter": "Basic Probability",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-405",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Easy",
    "q": "If the variance of a numerical dataset is 64, what is its standard deviation?",
    "options": [
      "8",
      "16",
      "32",
      "4"
    ],
    "correct": 0,
    "explain": "Standard deviation is the positive square root of variance: σ = $\\sqrt${64} = 8.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-406",
    "subject": "Statistics",
    "topic": "Probability Distributions",
    "difficulty": "Easy",
    "q": "What is the total area enclosed under the probability density function (PDF) curve of any continuous random variable across its support (-∞ to +∞)?",
    "options": [
      "1.0",
      "0.5",
      "100",
      "Undefined"
    ],
    "correct": 0,
    "explain": "The fundamental axiom of probability density requires that the integral of f(x) over its entire range equals exactly 1.",
    "chapter": "Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-407",
    "subject": "Statistics",
    "topic": "Correlation and Regression",
    "difficulty": "Easy",
    "q": "If Pearson's correlation coefficient between two variables X and Y is r = -1.0, what does this indicate about their relationship?",
    "options": [
      "A perfect negative linear relationship",
      "No linear relationship whatsoever",
      "A weak negative association",
      "A non-linear curved relationship"
    ],
    "correct": 0,
    "explain": "A correlation coefficient of r = -1.0 indicates a deterministic, perfect inverse linear relationship.",
    "chapter": "Correlation and Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-408",
    "subject": "Statistics",
    "topic": "Index Numbers",
    "difficulty": "Easy",
    "q": "In the construction of price index numbers, which period is assigned the index value of 100 as the comparative benchmark?",
    "options": [
      "Base period",
      "Current period",
      "Terminal period",
      "Intermediate period"
    ],
    "correct": 0,
    "explain": "The base period serves as the fixed temporal standard of comparison and is assigned a benchmark value of 100 (P_0 = 100).",
    "chapter": "Index Numbers",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-409",
    "subject": "Statistics",
    "topic": "Basic Probability",
    "difficulty": "Easy",
    "q": "If events A and B are mutually exclusive (disjoint), what is the probability of their intersection P(A ∩ B)?",
    "options": [
      "0",
      "P(A) * P(B)",
      "1",
      "P(A) + P(B)"
    ],
    "correct": 0,
    "explain": "Mutually exclusive events cannot occur simultaneously, so their intersection is an impossible event: P(A ∩ B) = 0.",
    "chapter": "Basic Probability",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-410",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Easy",
    "q": "If each observation in a dataset is multiplied by a constant factor k = 5, how does the arithmetic mean change?",
    "options": [
      "It is multiplied by 5",
      "It remains unchanged",
      "It increases by 5",
      "It is divided by 5"
    ],
    "correct": 0,
    "explain": "The arithmetic mean possesses linear scaling properties: E[k*X] = k * E[X], so multiplying each value by 5 multiplies the mean by 5.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-411",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Medium",
    "q": "Calculate the coefficient of variation (CV) for a distribution whose sample mean is 40 and standard deviation is 8.",
    "options": [
      "20%",
      "25%",
      "5%",
      "15%"
    ],
    "correct": 0,
    "explain": "Coefficient of variation is CV = (σ / μ) * 100% = (8 / 40) * 100% = 0.20 * 100% = 20%.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-412",
    "subject": "Statistics",
    "topic": "Probability Distributions",
    "difficulty": "Medium",
    "q": "In a binomial distribution with parameters n = 100 trials and probability of success p = 0.4, what is the variance of the distribution?",
    "options": [
      "24",
      "40",
      "16",
      "4.89"
    ],
    "correct": 0,
    "explain": "For a binomial distribution, Var(X) = n * p * (1 - p) = 100 * 0.4 * 0.6 = 24.",
    "chapter": "Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-413",
    "subject": "Statistics",
    "topic": "Correlation and Regression",
    "difficulty": "Medium",
    "q": "If the two regression coefficients are b_yx = 0.8 and b_xy = 0.45, what is the Pearson correlation coefficient r?",
    "options": [
      "0.6",
      "0.36",
      "0.75",
      "0.5"
    ],
    "correct": 0,
    "explain": "r = ±$\\sqrt${b_yx * b_xy} = $\\sqrt${0.8 * 0.45} = $\\sqrt${0}.36 = 0.6 (positive since both regression coefficients are positive).",
    "chapter": "Correlation and Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-414",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Medium",
    "q": "In a moderately skewed unimodal distribution, the mean is 48 and the median is 45. Using Karl Pearson's empirical approximation, estimate the mode.",
    "options": [
      "39",
      "42",
      "51",
      "46.5"
    ],
    "correct": 0,
    "explain": "Pearson's empirical relationship states Mode ≈ 3*Median - 2*Mean = 3(45) - 2(48) = 135 - 96 = 39.",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-415",
    "subject": "Statistics",
    "topic": "Sampling and Estimation",
    "difficulty": "Medium",
    "q": "According to the Central Limit Theorem, as sample size n becomes sufficiently large (n ≥ 30), what is the sampling distribution of the sample mean?",
    "options": [
      "Approximately normal, regardless of the underlying population distribution shape",
      "Uniformly distributed",
      "Student's t distributed with infinite variance",
      "Positively skewed Poisson"
    ],
    "correct": 0,
    "explain": "The CLT guarantees that the distribution of sample means approaches normality as sample size increases, provided the population variance is finite.",
    "chapter": "Sampling and Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-416",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "In formal statistical hypothesis testing, committing a Type I error (alpha error) corresponds to:",
    "options": [
      "Rejecting a true null hypothesis (H0)",
      "Failing to reject a false null hypothesis (H0)",
      "Accepting an impossible alternative hypothesis",
      "Choosing an unrepresentative sample size"
    ],
    "correct": 0,
    "explain": "A Type I error occurs when the researcher falsely rejects a null hypothesis that is actually true in the population.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-417",
    "subject": "Statistics",
    "topic": "Basic Probability",
    "difficulty": "Medium",
    "q": "A bag contains 5 red balls and 3 green balls. Two balls are drawn successively without replacement. What is the probability that both balls are red?",
    "options": [
      "5/14",
      "25/64",
      "5/8",
      "15/56"
    ],
    "correct": 0,
    "explain": "P(First Red) = 5/8. P(Second Red | First Red) = 4/7. P(Both Red) = (5/8) * (4/7) = 20/56 = 5/14.",
    "chapter": "Basic Probability",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-418",
    "subject": "Statistics",
    "topic": "Index Numbers",
    "difficulty": "Medium",
    "q": "Which index number formula is referred to as the \"ideal index\" because it satisfies both the Time Reversal Test and the Factor Reversal Test?",
    "options": [
      "Fisher's Ideal Index",
      "Laspeyres Index",
      "Paasche Index",
      "Marshall-Edgeworth Index"
    ],
    "correct": 0,
    "explain": "Fisher's Ideal Index is the geometric mean of Laspeyres and Paasche indices: I_F = $\\sqrt${I_L * I_P}, and satisfies both reversal tests.",
    "chapter": "Index Numbers",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-419",
    "subject": "Statistics",
    "topic": "Probability Distributions",
    "difficulty": "Medium",
    "q": "For a standard normal distribution Z ~ N(0, 1), what percentage of total observations falls approximately within the interval [-2, +2]?",
    "options": [
      "95.45%",
      "68.27%",
      "99.73%",
      "90.00%"
    ],
    "correct": 0,
    "explain": "Under the empirical normal distribution rule: ±1σ encompasses ~68.27%, ±2σ encompasses ~95.45%, and ±3σ encompasses ~99.73% of data.",
    "chapter": "Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-420",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Medium",
    "q": "What is the semi-interquartile range (quartile deviation) of a dataset if the first quartile Q1 = 25 and third quartile Q3 = 65?",
    "options": [
      "20",
      "40",
      "45",
      "15"
    ],
    "correct": 0,
    "explain": "Quartile deviation QD = (Q3 - Q1) / 2 = (65 - 25) / 2 = 40 / 2 = 20.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-421",
    "subject": "Statistics",
    "topic": "Probability Distributions",
    "difficulty": "Hard",
    "q": "A Poisson distribution has a mean λ = 4. What is the exact probability of observing zero occurrences P(X = 0)?",
    "options": [
      "e^{-4}",
      "4 * e^{-4}",
      "1 - e^{-4}",
      "1/16"
    ],
    "correct": 0,
    "explain": "The Poisson PMF is P(X = k) = (λ^k * e^{-λ}) / k!. For k = 0 and λ = 4: P(X = 0) = ($4^{0}$ * e^{-4}) / 0! = e^{-4}.",
    "chapter": "Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-422",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "When conducting a two-tailed test for a population mean with unknown variance based on a sample of size n = 16, how many degrees of freedom are associated with the Student's t-statistic?",
    "options": [
      "15",
      "16",
      "14",
      "30"
    ],
    "correct": 0,
    "explain": "For a one-sample Student's t-test, the degrees of freedom parameter is df = n - 1 = 16 - 1 = 15.",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-423",
    "subject": "Statistics",
    "topic": "Correlation and Regression",
    "difficulty": "Hard",
    "q": "In simple linear regression, the total sum of squares (SST) is 250 and the sum of squared errors (SSE) is 50. What is the coefficient of determination $R^{2}$?",
    "options": [
      "0.80",
      "0.20",
      "0.25",
      "0.75"
    ],
    "correct": 0,
    "explain": "SSR = SST - SSE = 250 - 50 = 200. Coefficient of determination $R^{2}$ = SSR / SST = 200 / 250 = 0.80 (80% of variation explained).",
    "chapter": "Correlation and Regression",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-424",
    "subject": "Statistics",
    "topic": "Basic Probability",
    "difficulty": "Hard",
    "q": "Given: P(A) = 0.6, P(B) = 0.5, and P(A ∪ B) = 0.8. What is the conditional probability P(A | B)?",
    "options": [
      "0.60",
      "0.50",
      "0.75",
      "0.30"
    ],
    "correct": 0,
    "explain": "P(A ∩ B) = P(A) + P(B) - P(A ∪ B) = 0.6 + 0.5 - 0.8 = 0.3. Then P(A | B) = P(A ∩ B) / P(B) = 0.3 / 0.5 = 0.60.",
    "chapter": "Basic Probability",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-425",
    "subject": "Statistics",
    "topic": "Measures of Dispersion",
    "difficulty": "Hard",
    "q": "A sample of 10 observations has a mean of 12 and sum of squares of observations Σ($x^{2}$) = 1540. What is the sample variance $s^{2}$?",
    "options": [
      "11.11",
      "10.00",
      "14.40",
      "12.25"
    ],
    "correct": 0,
    "explain": "Σx = n * x̄ = 10 * 12 = 120. (Σx)^2 / n = 14400 / 10 = 1440. Sum of squared deviations SS = Σ($x^{2}$) - (Σx)^2/n = 1540 - 1440 = 100. Sample variance $s^{2}$ = SS / (n - 1) = 100 / 9 ≈ 11.11.",
    "chapter": "Measures of Dispersion",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-426",
    "subject": "Statistics",
    "topic": "Sampling and Estimation",
    "difficulty": "Hard",
    "q": "An estimator T of a population parameter θ is termed \"unbiased\" if and only if:",
    "options": [
      "E[T] = θ",
      "Var(T) = 0",
      "lim(n -> ∞) Var(T) = 0",
      "T = θ for every sample"
    ],
    "correct": 0,
    "explain": "By definition, an estimator T is unbiased if its mathematical expectation equals the true population parameter: E[T] = θ.",
    "chapter": "Sampling and Estimation",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-427",
    "subject": "Statistics",
    "topic": "Probability Distributions",
    "difficulty": "Hard",
    "q": "In a continuous uniform distribution on the interval [a, b], what is the mathematical formula for the variance Var(X)?",
    "options": [
      "$(b - a)^{2}$ / 12",
      "(b - a) / 2",
      "$(b - a)^{2}$ / 6",
      "$(b + a)^{2}$ / 12"
    ],
    "correct": 0,
    "explain": "For X ~ Uniform(a, b), the mean is (a + b)/2 and the variance is Var(X) = $(b - a)^{2}$ / 12.",
    "chapter": "Probability Distributions",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-428",
    "subject": "Statistics",
    "topic": "Measures of Central Tendency",
    "difficulty": "Hard",
    "q": "What is the relationship between the Arithmetic Mean (AM), Geometric Mean (GM), and Harmonic Mean (HM) for a set of distinct positive real numbers?",
    "options": [
      "AM > GM > HM",
      "HM > GM > AM",
      "AM = GM = HM",
      "GM > AM > HM"
    ],
    "correct": 0,
    "explain": "For any set of positive distinct numbers, the inequality of arithmetic and geometric means dictates AM > GM > HM (equality holds only if all numbers are identical).",
    "chapter": "Measures of Central Tendency",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-429",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Hard",
    "q": "In a contingency table analysis with r rows and c columns, what are the degrees of freedom for the Pearson Chi-Square test of independence?",
    "options": [
      "(r - 1)(c - 1)",
      "r * c - 1",
      "(r - 1) + (c - 1)",
      "r * c"
    ],
    "correct": 0,
    "explain": "The test of independence in an r x c contingency table has degrees of freedom df = (r - 1) * (c - 1).",
    "chapter": "Hypothesis Testing",
    "universities": [
      "TCAT"
    ]
  },
  {
    "id": "tcat-stat-430",
    "subject": "Statistics",
    "topic": "Index Numbers",
    "difficulty": "Hard",
    "q": "Why does the Laspeyres price index typically exhibit an upward bias compared to the true cost-of-living index during periods of inflation?",
    "options": [
      "It utilizes fixed base-period quantity weights, ignoring consumer substitution toward cheaper alternatives",
      "It uses current-period quantity weights exclusively",
      "It computes the geometric mean rather than arithmetic mean of prices",
      "It assumes completely inelastic supply curves"
    ],
    "correct": 0,
    "explain": "Because Laspeyres fixes base-period consumption baskets (Q0), it fails to account for consumers substituting away from goods whose relative prices have risen, overstating inflation.",
    "chapter": "Index Numbers",
    "universities": [
      "TCAT"
    ]
  }
];

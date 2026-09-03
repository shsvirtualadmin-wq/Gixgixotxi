import { Question } from "../src/types";

export const NEW_STATS_QUESTIONS: Question[] = [
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
    "explain": "Harmonic Mean is the reciprocal of the arithmetic mean of the reciprocals and is mathematically appropriate for rates and ratios involving equal distance/work."
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
    "explain": "There are n = 7 ordered observations. The median is the (7 + 1)/2 = 4th observation, which is 9."
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
    "explain": "By the algebraic property of the arithmetic mean, the algebraic sum of deviations from the mean is always exactly zero: Σ(X - X̄) = 0."
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
    "explain": "Coefficient of Variation is C.V. = (s / X̄) * 100%, expressing dispersion as a dimensionless relative percentage."
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
    "explain": "By Pearson's empirical relationship: Mode = 3·Median - 2·Mean. Thus: 42 = 3·Median - 2(45) => 42 = 3·Median - 90 => 3·Median = 132 => Median = 44."
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
      "The variance is multiplied by 9 (3^2)",
      "The variance is increased by 3"
    ],
    "correct": 2,
    "explain": "By the properties of variance: Var(cX) = c^2 · Var(X). When multiplied by 3, the new variance is 3^2 = 9 times the original variance."
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
    "explain": "In a positively skewed distribution, the long right tail pulls the mean to the highest value, so Mode < Median < Mean."
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
    "explain": "The second central moment is μ2 = Σ(X - X̄)^2 / N, which by definition is the population variance."
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
    "explain": "A distribution with β2 = 3 (identical to the normal distribution kurtosis) is called mesokurtic. Values > 3 are leptokurtic; < 3 are platykurtic."
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
    "explain": "The Quartile Deviation is Q.D. = (Q3 - Q1) / 2 = (70 - 30) / 2 = 20."
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
    "explain": "Chebyshev's theorem states P(|X - μ| < kσ) ≥ 1 - 1/k^2. For k = 2: 1 - 1/4 = 3/4 = 75% for any arbitrary distribution."
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
    "explain": "Sk_B = (60 + 20 - 2(35)) / (60 - 20) = (80 - 70) / 40 = 10 / 40 = +0.25."
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
    "explain": "Sheppard's corrections adjust the central moments for the grouping error arising from the assumption that frequencies are concentrated at the class midpoints."
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
    "explain": "Var(Y) = Var(10 - 2X) = (-2)^2 · Var(X) = 4 · 4 = 16. Standard deviation is SD(Y) = sqrt(16) = 4 (dispersion is always non-negative)."
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
    "explain": "Out of 36 equally likely outcomes, the pairs summing to 7 are (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) — exactly 6 outcomes. P = 6/36 = 1/6."
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
    "explain": "Mutually exclusive events cannot occur simultaneously, so their intersection is the null event: P(A ∩ B) = 0."
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
    "explain": "By binomial formula: P(X=2) = C(4,2) · (1/2)^2 · (1/2)^2 = 6 · 1/16 = 6/16 = 3/8."
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
    "explain": "The total probability across an exhaustive and mutually exclusive sample space is always exactly 1."
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
    "explain": "The standard normal distribution is specifically normalized so that its mean μ = 0 and variance σ^2 = 1."
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
    "explain": "By definition of conditional probability: P(A | B) = P(A ∩ B) / P(B) = 0.3 / 0.5 = 0.6. (Since P(A|B) = P(A), A and B are also independent)."
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
    "explain": "Mean = np = 100 · 0.2 = 20. Variance = np(1-p) = 20 · 0.8 = 16."
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
    "explain": "The Poisson distribution is the law of rare events, derived as n -> ∞ and p -> 0 with constant mean λ = np."
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
    "explain": "The total area under the entire probability density curve equals 1."
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
    "explain": "By the empirical rule of the normal curve: ~68.27% lies within ±1σ, ~95.45% lies within ±2σ, and ~99.73% lies within ±3σ."
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
    "explain": "P(X=1) = e^(-λ) · λ^1 / 1! = λ e^(-λ). P(X=2) = e^(-λ) · λ^2 / 2! = (λ^2 / 2) e^(-λ). Setting them equal: λ = λ^2 / 2 => λ = 2."
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
    "explain": "The variance of a continuous uniform distribution U(a, b) is Var(X) = (b - a)^2 / 12. For [2, 8]: (8 - 2)^2 / 12 = 36 / 12 = 3."
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
    "explain": "For an exponential distribution with parameter λ, the expected value is E(X) = 1 / λ = 1 / 0.5 = 2.0."
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
    "explain": "The Hypergeometric distribution models successes in draws from a finite population without replacement, where trials are dependent."
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
    "explain": "By the fundamental property of CDF: P(a < X ≤ b) = F(b) - F(a)."
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
    "explain": "A parameter is a descriptive index of an entire population (e.g., μ, σ), while a statistic is computed from sample data (e.g., X̄, s)."
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
    "explain": "The standard deviation of the sampling distribution of an estimator (such as the sample mean) is called its Standard Error."
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
    "explain": "Stratified sampling ensures representation by partitioning a population into homogeneous strata and sampling proportionally within each stratum."
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
    "explain": "Standard Error = σ / sqrt(n) = 20 / sqrt(100) = 20 / 10 = 2."
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
    "explain": "The Central Limit Theorem guarantees that the sampling distribution of X̄ approaches normality as n increases, even if the parent population is non-normal."
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
    "explain": "An estimator T is unbiased if its mathematical expected value equals the true population parameter: E(T) = θ."
  },
  {
    "id": "tcat-stat-120",
    "subject": "Statistics",
    "topic": "Sampling & Estimation",
    "difficulty": "Medium",
    "q": "Why is the sample variance calculated using divisor (n - 1) instead of n, i.e., s^2 = Σ(X - X̄)^2 / (n - 1)?",
    "options": [
      "To make s^2 an unbiased estimator of the population variance σ^2",
      "Because one observation is always corrupted by measurement error",
      "To account for the finite population correction factor",
      "To make the calculation easier without a calculator"
    ],
    "correct": 0,
    "explain": "Dividing by (n - 1) corrects for Bessel's correction; dividing by n produces a negatively biased estimate of σ^2."
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
      "sqrt(n / N)",
      "(N - n) / n"
    ],
    "correct": 1,
    "explain": "For finite populations sampled without replacement, the variance of X̄ is adjusted by the FPC factor: (N - n) / (N - 1)."
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
    "explain": "For a two-tailed standard normal interval with α = 0.05, the critical value Z_(0.025) is 1.96."
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
    "explain": "When σ is unknown and n < 30, the statistic follows Student's t-distribution with df = n - 1."
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
    "explain": "Consistency means that as n -> ∞, the estimator converges in probability to the true parameter θ, which occurs if its variance and bias both approach zero."
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
    "explain": "Efficiency compares the dispersion of unbiased estimators; the one with the smaller sampling variance is more efficient."
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
    "explain": "Margin of error E = Z · σ / sqrt(n). Halving E requires doubling sqrt(n), which means n must be multiplied by 2^2 = 4."
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
    "explain": "The MLE maximizes the log-likelihood function by setting its first derivative with respect to θ equal to 0 (score equation) and verifying a negative second derivative."
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
    "explain": "The Null Hypothesis (H0) represents the default assertion of no difference or no treatment effect."
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
    "explain": "A Type I error occurs when a true null hypothesis is erroneously rejected (false positive), with probability α."
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
    "explain": "The level of significance α is the predetermined maximum threshold probability of committing a Type I error."
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
    "explain": "When p-value ≤ α (0.015 < 0.05), we reject the null hypothesis in favor of the alternative hypothesis."
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
    "explain": "The Chi-Square test of independence assesses whether two categorical variables are independent in a contingency table."
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
    "explain": "Power of a test is 1 - β, the probability of rejecting H0 when H0 is false (correct detection of a true effect)."
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
    "explain": "Because the alternative hypothesis specifies μ > 50, the rejection region lies exclusively in the upper (right) tail."
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
    "explain": "The degrees of freedom for an r × c contingency table is df = (r - 1)(c - 1)."
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
    "explain": "Estimating two sample means consumes 2 degrees of freedom, leaving df = n1 + n2 - 2 for the pooled variance."
  },
  {
    "id": "tcat-stat-137",
    "subject": "Statistics",
    "topic": "Hypothesis Testing",
    "difficulty": "Medium",
    "q": "Which statistical test is designed to test the equality of two population variances, H0: σ1^2 = σ2^2?",
    "options": [
      "F-Test (Snedecor's F)",
      "Z-Test",
      "Paired t-Test",
      "Wilcoxon Signed-Rank Test"
    ],
    "correct": 0,
    "explain": "The F-test evaluates the ratio of two sample variances F = s1^2 / s2^2 to test whether their population variances are equal."
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
    "explain": "The ANOVA test statistic is F = MS_between / MS_within (treatment variance divided by residual error variance)."
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
    "explain": "Running m independent tests increases the family-wise error rate to 1 - (1 - α)^m, making false positive discoveries highly probable."
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
    "explain": "The paired t-test analyzes differences (d = X1 - X2) for matched-pair or before-and-after repeated measures on the same subjects."
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
    "explain": "The Neyman-Pearson lemma proves that the likelihood ratio test produces the most powerful test of a given size α for simple hypotheses."
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
    "explain": "Each parameter estimated from the sample consumes 1 degree of freedom, resulting in df = k - 1 - m."
  },
  {
    "id": "tcat-stat-143",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "If the coefficient of determination between two variables is r^2 = 0.64, what is the coefficient of non-determination (proportion of unexplained variation)?",
    "options": [
      "0.36",
      "0.64",
      "0.20",
      "0.80"
    ],
    "correct": 0,
    "explain": "The coefficient of non-determination is k^2 = 1 - r^2 = 1 - 0.64 = 0.36, representing the proportion of total variation in Y left unexplained by the regression."
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
    "explain": "r = 0 indicates absence of linear correlation; a strong non-linear (e.g., quadratic) relationship could still exist."
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
    "explain": "The regression coefficient b is the slope, indicating the expected change in the dependent variable Y for every one-unit increase in X."
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
    "explain": "Both regression lines pass through the centroid of the data: the point of means (X̄, Ȳ)."
  },
  {
    "id": "tcat-stat-147",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Easy",
    "q": "If the correlation coefficient r = 0.8, what is the coefficient of determination (r^2)?",
    "options": [
      "0.80",
      "0.64",
      "0.16",
      "0.40"
    ],
    "correct": 1,
    "explain": "Coefficient of determination is r^2 = (0.8)^2 = 0.64 (indicating 64% of variation in Y is explained by X)."
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
    "explain": "Estimating two parameters (intercept a and slope b) consumes 2 degrees of freedom from the sample, leaving df = n - 2 for the residual sum of squares."
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
    "explain": "r = ± sqrt(b_yx · b_xy). Since both coefficients are positive: r = +sqrt(0.8 · 0.45) = +sqrt(0.36) = +0.60."
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
    "explain": "A fundamental mathematical property of OLS regression with an intercept term is that the sum of the residuals is identically zero: Σ e_i = 0."
  },
  {
    "id": "tcat-stat-151",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "What is the formula for Spearman's rank correlation coefficient (r_s) when there are no tied ranks?",
    "options": [
      "1 - [6 Σ d^2 / (n(n^2 - 1))]",
      "1 - [Σ d / n]",
      "6 Σ d^2 / (n(n - 1))",
      "1 + [6 Σ d^2 / (n(n^2 - 1))]"
    ],
    "correct": 0,
    "explain": "Spearman's rank correlation formula is r_s = 1 - [6 Σ d_i^2 / (n(n^2 - 1))], where d_i is the difference between ranks."
  },
  {
    "id": "tcat-stat-152",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Medium",
    "q": "If the two regression lines are perpendicular (at an angle of 90°), what is the correlation between the two variables?",
    "options": [
      "r = 1",
      "r = -1",
      "r = 0",
      "r = 0.5"
    ],
    "correct": 2,
    "explain": "When r = 0, the regression lines are parallel to the coordinate axes and perpendicular to each other. When r = ±1, they coincide."
  },
  {
    "id": "tcat-stat-153",
    "subject": "Statistics",
    "topic": "Correlation & Regression",
    "difficulty": "Hard",
    "q": "Why can the two regression coefficients b_yx and b_xy NEVER have opposite signs?",
    "options": [
      "Because b_yx · b_xy = r^2, which must be non-negative, and both share the sign of the covariance Cov(X, Y)",
      "Because least squares requires positive intercepts",
      "Because the sample variance of X must equal the sample variance of Y",
      "Because the angle between regression lines cannot exceed 45 degrees"
    ],
    "correct": 0,
    "explain": "Both b_yx = Cov(X,Y)/Var(X) and b_xy = Cov(X,Y)/Var(Y) have variances (which are positive) in the denominator; hence both take the exact sign of Cov(X,Y)."
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
    "explain": "Multicollinearity occurs when independent variables share strong linear relationships, leading to unstable coefficient estimates and high standard errors."
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
    "explain": "Homoscedasticity means constant error variance: Var(ε_i | X) = σ^2 for all i. Heteroscedasticity refers to non-constant error variance."
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
    "explain": "Since (sqrt(b_yx) - sqrt(b_xy))^2 ≥ 0 => b_yx + b_xy ≥ 2 sqrt(b_yx · b_xy) = 2r => (b_yx + b_xy) / 2 ≥ r."
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
    "explain": "A price relative is the ratio of the price of a single commodity in the current year to its price in the base year: (P1 / P0) * 100."
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
    "explain": "Laspeyres price index uses base-year quantities: P_01^L = [Σ(p1 · q0) / Σ(p0 · q0)] * 100."
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
    "explain": "Paasche price index weights by current-year quantities: P_01^P = [Σ(p1 · q1) / Σ(p0 · q1)] * 100."
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
    "explain": "Seasonal variation refers to rhythmic patterns that repeat within a calendar year due to seasons, climate, or cultural holidays."
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
    "explain": "The multiplicative time series decomposition model expresses the observed value as the product of Trend, Seasonal, Cyclical, and Irregular components: Y = T · S · C · I."
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
    "explain": "Fisher's index P_01^F = sqrt(P_01^L · P_01^P) satisfies both the Time Reversal Test and Factor Reversal Test, free from single-period weighting bias."
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
    "explain": "The Time Reversal Test requires that reversing the time subscripts yields the reciprocal: P_01 · P_10 = 1."
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
    "explain": "The Factor Reversal Test requires the product of the price index and quantity index to equal the true value ratio: P_01 · Q_01 = Σ(p1 q1) / Σ(p0 q0)."
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
    "explain": "Moving averages smooth out periodic, seasonal, and random irregular fluctuations to isolate the secular trend."
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
    "explain": "The Circular Test (P_01 · P_12 · P_20 = 1) is an extension of the time reversal test satisfied by Kelly's and simple aggregate methods, but NOT by Fisher's ideal index."
  },
  {
    "id": "tcat-stat-167",
    "subject": "Statistics",
    "topic": "Index Numbers & Time Series",
    "difficulty": "Hard",
    "q": "When fitting a linear trend line Y = a + bX by the method of least squares to an odd number of years (n = 2m + 1), how does setting the origin X = 0 at the middle year simplify the normal equations?",
    "options": [
      "Σ X = 0, reducing the equations to a = (Σ Y) / n and b = (Σ XY) / (Σ X^2)",
      "Σ Y becomes 0, eliminating the intercept parameter a",
      "Σ X^2 becomes 1, simplifying the denominator",
      "The residuals become exactly zero for all data points"
    ],
    "correct": 0,
    "explain": "Centering X at the middle year ensures Σ X = 0, which decouples the normal equations directly into a = ΣY / n and b = ΣXY / ΣX^2."
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
    "explain": "Cyclical fluctuations represent oscillatory business cycle movements recurring over periods longer than one year (typically 3 to 10 years)."
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
    "explain": "Because it fixes base-period quantities, Laspeyres ignores consumer substitution toward cheaper substitute goods, systematically overestimating the cost-of-living increase."
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
    "explain": "Deseasonalizing (seasonally adjusting) in a multiplicative model divides the original data by the seasonal index: Y / S = (T · S · C · I) / S = T · C · I."
  }
];

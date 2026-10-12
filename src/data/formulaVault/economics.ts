import { FormulaSheet } from './types';

export const economicsSheets: FormulaSheet[] = [
  {
    id: 'econ-micro-elasticity-utility',
    subject: 'Economics',
    title: 'Microeconomics: Elasticity, Consumer Choice & Costs',
    chapter: 'Microeconomic Theory',
    tags: ['Price Elasticity', 'Cross Elasticity', 'Marginal Utility', 'Production', 'Marginal Cost'],
    formulas: [
      {
        number: 382,
        name: 'Price Elasticity of Demand (PED) - Midpoint Formula',
        formula: 'E_d = \\frac{\\% \\Delta Q_d}{\\% \\Delta P} = \\frac{(Q_2 - Q_1) / [(Q_1 + Q_2) / 2]}{(P_2 - P_1) / [(P_1 + P_2) / 2]} = \\frac{dQ}{dP} \\cdot \\frac{P}{Q}',
        variables: '|E_d| > 1: elastic demand; |E_d| = 1: unitary; |E_d| < 1: inelastic demand',
      },
      {
        number: 383,
        name: 'Income Elasticity of Demand (YED)',
        formula: 'E_Y = \\frac{\\% \\Delta Q_d}{\\% \\Delta Y} = \\frac{\\Delta Q}{Q} \\cdot \\frac{Y}{\\Delta Y}',
        variables: 'E_Y > 0: normal good; E_Y > 1: luxury good; E_Y < 0: inferior good',
      },
      {
        number: 384,
        name: 'Cross-Price Elasticity of Demand (XED)',
        formula: 'E_{xy} = \\frac{\\% \\Delta Q_{dx}}{\\% \\Delta P_y} = \\frac{\\Delta Q_x}{Q_x} \\cdot \\frac{P_y}{\\Delta P_y}',
        variables: 'E_{xy} > 0: substitute goods; E_{xy} < 0: complementary goods; E_{xy} = 0: unrelated independent goods',
      },
      {
        number: 385,
        name: 'Equi-Marginal Utility Condition (Consumer Equilibrium)',
        formula: '\\frac{MU_x}{P_x} = \\frac{MU_y}{P_y} = \\dots = MU_m, \\quad P_x X + P_y Y = M',
        variables: 'MU: marginal utility, P: unit price, M: consumer budget constraint income',
      },
      {
        number: 386,
        name: 'Marginal Rate of Substitution (MRS) & Tangency',
        formula: 'MRS_{xy} = -\\frac{\\Delta y}{\\Delta x} = \\frac{MU_x}{MU_y} = \\frac{P_x}{P_y}',
        variables: 'Slope of indifference curve equals slope of budget constraint line at optimal consumer bundle',
      },
      {
        number: 387,
        name: 'Total, Average and Marginal Cost Relations',
        formula: 'TC = TFC + TVC, \\quad ATC = AFC + AVC = \\frac{TC}{Q}, \\quad MC = \\frac{d(TC)}{dQ} = \\frac{\\Delta TC}{\\Delta Q}',
        variables: 'MC intersects ATC and AVC curves exactly at their respective minimum lowest points',
      },
      {
        number: 388,
        name: 'Profit Maximization Condition across All Market Structures',
        formula: 'MR = MC \\quad \\text{with } \\frac{d(MC)}{dQ} > \\frac{d(MR)}{dQ}',
        variables: 'Under perfect competition P = MR = AR = MC; under monopoly P > MR = MC',
      },
      {
        number: 389,
        name: "Lerner Index of Monopoly Market Power",
        formula: 'L = \\frac{P - MC}{P} = -\\frac{1}{E_d}',
        variables: '0 \\le L \\le 1; measures firm markup ability over marginal cost',
      },
    ],
  },
  {
    id: 'econ-macro-gdp-money',
    subject: 'Economics',
    title: 'Macroeconomics: National Income, Multiplier & Inflation',
    chapter: 'Macroeconomic Principles',
    tags: ['GDP', 'Keynesian Multiplier', 'Quantity Theory', 'Fisher Equation', 'CPI'],
    formulas: [
      {
        number: 390,
        name: 'Gross Domestic Product (GDP) - Expenditure Approach',
        formula: 'Y = C + I + G + (X - M) = C + I + G + NX',
        variables: 'C: private household consumption, I: gross private investment, G: government spending, NX = X - M: net exports',
      },
      {
        number: 391,
        name: 'GDP Deflator and Real GDP',
        formula: '\\text{Real GDP} = \\frac{\\text{Nominal GDP}}{\\text{GDP Deflator}} \\times 100, \\quad \\text{GDP Deflator} = \\frac{\\text{Nominal GDP}}{\\text{Real GDP}} \\times 100',
        variables: 'Adjusts current output for price-level inflation relative to the base year',
      },
      {
        number: 392,
        name: 'Keynesian Expenditure Multiplier',
        formula: 'k = \\frac{1}{1 - MPC} = \\frac{1}{MPS} = \\frac{1}{MPS + MPT + MPM}',
        variables: 'MPC: marginal propensity to consume, MPS = 1 - MPC: marginal propensity to save, MPT: tax rate, MPM: import propensity',
      },
      {
        number: 393,
        name: "Quantity Theory of Money (Fisher's Equation of Exchange)",
        formula: 'M \\cdot V = P \\cdot Y',
        variables: 'M: money supply, V: velocity of money circulation, P: general price level, Y: real national output/income',
      },
      {
        number: 394,
        name: 'Fisher Equation of Real Interest Rate',
        formula: 'r \\approx i - \\pi \\implies (1 + i) = (1 + r)(1 + \\pi)',
        variables: 'r: real interest rate, i: nominal interest rate, \\pi: expected rate of price inflation',
      },
      {
        number: 395,
        name: 'Consumer Price Index (CPI) and Inflation Rate',
        formula: '\\text{CPI}_t = \\frac{\\sum P_{t} Q_0}{\\sum P_0 Q_0} \\times 100, \\quad \\text{Inflation Rate} = \\frac{\\text{CPI}_t - \\text{CPI}_{t-1}}{\\text{CPI}_{t-1}} \\times 100\\%',
        variables: 'Laspeyres basket approach utilizing fixed base-year consumption quantities Q_0',
      },
      {
        number: 396,
        name: 'Money Multiplier and Central Bank Reserve Ratio',
        formula: 'm = \\frac{1}{\\text{RRR}} \\implies \\Delta M_{\\text{broad}} = \\frac{\\Delta \\text{Deposits}}{\\text{RRR}}',
        variables: 'RRR: required reserve ratio mandated by central monetary bank',
      },
      {
        number: 397,
        name: "Okun's Law (Output Gap and Unemployment)",
        formula: '\\frac{Y - Y^*}{Y^*} = -\\beta (u - u^*)',
        variables: 'Y - Y^*: GDP output gap, u: actual unemployment rate, u^*: natural rate of unemployment (NAIRU), \\beta \\approx 2.0',
      },
    ],
  },
];

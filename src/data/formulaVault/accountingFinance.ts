import { FormulaSheet } from './types';

export const accountingFinanceSheets: FormulaSheet[] = [
  {
    id: 'fin-time-value-money',
    subject: 'Accounting & Finance',
    title: 'Time Value of Money & Valuation',
    chapter: 'Corporate Finance',
    tags: ['Present Value', 'Future Value', 'Annuity', 'Perpetuity', 'Bond Price'],
    formulas: [
      {
        number: 365,
        name: 'Future Value of Single Sum with Compound Interest',
        formula: 'FV = PV (1 + r)^n = PV \\left(1 + \\frac{r}{m}\\right)^{m \\times n}',
        variables: 'PV: present value, r: annual interest rate, n: years, m: compounding periods per year',
      },
      {
        number: 366,
        name: 'Present Value of Single Sum (Discounting)',
        formula: 'PV = \\frac{FV}{(1 + r)^n} = FV (1 + r)^{-n}',
        variables: 'r: discount rate, (1+r)^{-n}: present value interest factor (PVIF)',
      },
      {
        number: 367,
        name: 'Present Value of an Ordinary Annuity',
        formula: 'PV_{\\text{annuity}} = C \\left[ \\frac{1 - (1 + r)^{-n}}{r} \\right]',
        variables: 'C: periodic equal cash flow, r: discount rate per period, n: total number of periods',
      },
      {
        number: 368,
        name: 'Future Value of an Ordinary Annuity',
        formula: 'FV_{\\text{annuity}} = C \\left[ \\frac{(1 + r)^n - 1}{r} \\right]',
        variables: 'C: periodic deposit/payment, r: periodic interest rate',
      },
      {
        number: 369,
        name: 'Present Value of a Perpetuity & Growing Perpetuity',
        formula: 'PV_{\\text{perpetuity}} = \\frac{C}{r}, \\quad PV_{\\text{growing}} = \\frac{C_1}{r - g} \\quad (r > g)',
        variables: 'C_1: cash flow in year 1, r: required discount rate, g: constant perpetual growth rate (Gordon Growth Model)',
      },
      {
        number: 370,
        name: 'Effective Annual Rate (EAR)',
        formula: '\\text{EAR} = \\left(1 + \\frac{r_{\\text{nominal}}}{m}\\right)^m - 1',
        variables: 'r_{\\text{nominal}}: stated annual percentage rate (APR), m: compounding frequency per annum',
      },
      {
        number: 371,
        name: 'Bond Valuation Formula',
        formula: 'P_{\\text{bond}} = \\sum_{t=1}^n \\frac{C}{(1 + y)^t} + \\frac{F}{(1 + y)^n} = C \\left[\\frac{1 - (1+y)^{-n}}{y}\\right] + \\frac{F}{(1+y)^n}',
        variables: 'C: coupon payment (Coupon Rate \\times Face Value F), y: yield to maturity (YTM), n: periods to maturity',
      },
    ],
  },
  {
    id: 'fin-capital-budgeting-wacc',
    subject: 'Accounting & Finance',
    title: 'Capital Budgeting & Cost of Capital',
    chapter: 'Managerial Finance',
    tags: ['NPV', 'IRR', 'WACC', 'CAPM', 'Payback Period'],
    formulas: [
      {
        number: 372,
        name: 'Net Present Value (NPV)',
        formula: '\\text{NPV} = \\sum_{t=1}^n \\frac{CF_t}{(1 + r)^t} - CF_0',
        variables: 'CF_t: expected net cash inflow at period t, CF_0: initial capital outlay, r: hurdle discount rate; accept if NPV > 0',
      },
      {
        number: 373,
        name: 'Internal Rate of Return (IRR)',
        formula: '\\text{NPV} = \\sum_{t=1}^n \\frac{CF_t}{(1 + \\text{IRR})^t} - CF_0 = 0',
        variables: 'IRR: discount rate that makes NPV exactly zero; accept if IRR > Cost of Capital',
      },
      {
        number: 374,
        name: 'Profitability Index (Benefit-Cost Ratio)',
        formula: '\\text{PI} = \\frac{\\text{PV of Future Cash Inflows}}{CF_0} = 1 + \\frac{\\text{NPV}}{CF_0}',
        variables: 'Accept investment project if PI > 1.0',
      },
      {
        number: 375,
        name: 'Capital Asset Pricing Model (CAPM) Cost of Equity',
        formula: 'r_e = R_f + \\beta_i (E(R_m) - R_f) = R_f + \\beta_i (\\text{Market Risk Premium})',
        variables: 'r_e: expected cost of equity, R_f: risk-free rate, \\beta_i = \\frac{\\operatorname{Cov}(R_i, R_m)}{\\sigma_m^2}: systematic market risk, E(R_m): expected market return',
      },
      {
        number: 376,
        name: 'Weighted Average Cost of Capital (WACC)',
        formula: '\\text{WACC} = \\left(\\frac{E}{V}\\right) r_e + \\left(\\frac{D}{V}\\right) r_d (1 - T_c)',
        variables: 'E: market equity value, D: market debt value, V = E + D, r_e: cost of equity, r_d: pre-tax cost of debt, T_c: corporate tax rate',
      },
    ],
  },
  {
    id: 'fin-accounting-ratios',
    subject: 'Accounting & Finance',
    title: 'Financial Statement Analysis & Ratios',
    chapter: 'Financial Accounting',
    tags: ['Liquidity', 'Current Ratio', 'DuPont Analysis', 'ROE', 'ROA', 'Leverage'],
    formulas: [
      {
        number: 377,
        name: 'Current Ratio and Quick (Acid-Test) Ratio',
        formula: '\\text{Current Ratio} = \\frac{\\text{Current Assets}}{\\text{Current Liabilities}}, \\quad \\text{Quick Ratio} = \\frac{\\text{Cash} + \\text{Marketable Securities} + \\text{Receivables}}{\\text{Current Liabilities}}',
        variables: 'Measures short-term debt solvency; quick ratio excludes illiquid inventory and prepaid expenses',
      },
      {
        number: 378,
        name: 'Net Working Capital (NWC) & Cash Conversion Cycle',
        formula: '\\text{NWC} = \\text{Current Assets} - \\text{Current Liabilities}, \\quad \\text{CCC} = \\text{DIO} + \\text{DSO} - \\text{DPO}',
        variables: 'DIO: days inventory outstanding, DSO: days sales outstanding (receivables), DPO: days payable outstanding',
      },
      {
        number: 379,
        name: 'DuPont Three-Step Identity for Return on Equity (ROE)',
        formula: '\\text{ROE} = \\left( \\frac{\\text{Net Income}}{\\text{Sales}} \\right) \\times \\left( \\frac{\\text{Sales}}{\\text{Total Assets}} \\right) \\times \\left( \\frac{\\text{Total Assets}}{\\text{Equity}} \\right) = \\text{Net Margin} \\times \\text{Asset Turnover} \\times \\text{Equity Multiplier}',
        variables: 'Decomposes profitability, operational efficiency, and financial leverage',
      },
      {
        number: 380,
        name: 'Debt-to-Equity and Interest Coverage Ratios',
        formula: '\\text{D/E} = \\frac{\\text{Total Debt}}{\\text{Total Equity}}, \\quad \\text{TIE} = \\frac{\\text{EBIT}}{\\text{Interest Expense}}',
        variables: 'EBIT: earnings before interest and taxes; TIE: times interest earned',
      },
      {
        number: 381,
        name: 'Earnings Per Share (EPS) & Price-to-Earnings (P/E)',
        formula: '\\text{EPS} = \\frac{\\text{Net Income} - \\text{Preferred Dividends}}{\\text{Weighted Average Shares Outstanding}}, \\quad \\text{P/E} = \\frac{\\text{Market Price per Share}}{\\text{EPS}}',
        variables: 'Valuation multiple comparing stock market price to corporate earnings power',
      },
    ],
  },
];

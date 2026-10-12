import { FormulaSheet, FormulaItem, FormulaSubject, SubjectMetadata } from './types';
import { mathematicsSheets } from './mathematics';
import { physicsSheets } from './physics';
import { chemistrySheets } from './chemistry';
import { biologySheets } from './biology';
import { statisticsSheets } from './statistics';
import { computerScienceSheets } from './computerScience';
import { englishGrammarSheets } from './englishGrammar';
import { logicalReasoningSheets } from './logicalReasoning';
import { accountingFinanceSheets } from './accountingFinance';
import { economicsSheets } from './economics';

export * from './types';
export {
  mathematicsSheets,
  physicsSheets,
  chemistrySheets,
  biologySheets,
  statisticsSheets,
  computerScienceSheets,
  englishGrammarSheets,
  logicalReasoningSheets,
  accountingFinanceSheets,
  economicsSheets,
};

export const allFormulaSheets: FormulaSheet[] = [
  ...mathematicsSheets,
  ...physicsSheets,
  ...chemistrySheets,
  ...biologySheets,
  ...statisticsSheets,
  ...computerScienceSheets,
  ...englishGrammarSheets,
  ...logicalReasoningSheets,
  ...accountingFinanceSheets,
  ...economicsSheets,
];

export interface SubjectVaultConfig {
  subject: FormulaSubject;
  displayName: string;
  category: 'STEM' | 'Quantitative' | 'General Aptitude' | 'Commerce';
  icon: string;
  badgeColor: string;
  accentBg: string;
  borderColor: string;
  description: string;
}

export const SUBJECT_METADATA_CONFIGS: SubjectVaultConfig[] = [
  {
    subject: 'Mathematics',
    displayName: 'Mathematics',
    category: 'STEM',
    icon: 'Calculator',
    badgeColor: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    accentBg: 'from-blue-600 to-indigo-700',
    borderColor: 'border-blue-200 dark:border-blue-800/60',
    description: 'Algebra, Quadratics, Trigonometry, Analytical Geometry, Calculus, Vectors & Matrices',
  },
  {
    subject: 'Physics',
    displayName: 'Physics',
    category: 'STEM',
    icon: 'Zap',
    badgeColor: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    accentBg: 'from-amber-600 to-orange-700',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
    description: 'Kinematics, Dynamics, Thermodynamics, Electromagnetism, Optics, Quantum & Nuclear Physics',
  },
  {
    subject: 'Chemistry',
    displayName: 'Chemistry',
    category: 'STEM',
    icon: 'FlaskConical',
    badgeColor: 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    accentBg: 'from-teal-600 to-emerald-700',
    borderColor: 'border-teal-200 dark:border-teal-800/60',
    description: 'Stoichiometry, Gas Laws, Thermodynamics, Equilibrium, Electrochemistry, Kinetics & Solutions',
  },
  {
    subject: 'Biology',
    displayName: 'Biology',
    category: 'STEM',
    icon: 'Dna',
    badgeColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    accentBg: 'from-emerald-600 to-teal-700',
    borderColor: 'border-emerald-200 dark:border-emerald-800/60',
    description: 'Enzyme Kinetics, Hardy-Weinberg Genetics, Bioenergetics, Respiration, Cardiac & Renal Physiology',
  },
  {
    subject: 'Statistics & Probability',
    displayName: 'Statistics & Probability',
    category: 'Quantitative',
    icon: 'BarChart2',
    badgeColor: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    accentBg: 'from-indigo-600 to-purple-700',
    borderColor: 'border-indigo-200 dark:border-indigo-800/60',
    description: 'Descriptive Stats, Binomial/Poisson/Normal Distributions, Regression, Correlation & Hypothesis Testing',
  },
  {
    subject: 'Computer Science',
    displayName: 'Computer Science',
    category: 'STEM',
    icon: 'Binary',
    badgeColor: 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
    accentBg: 'from-cyan-600 to-blue-700',
    borderColor: 'border-cyan-200 dark:border-cyan-800/60',
    description: 'Boolean Algebra, Logic Gates, Binary Complements, Time Complexities, Amdahl’s Law & Data Transmission',
  },
  {
    subject: 'English Grammar rules',
    displayName: 'English Grammar Rules',
    category: 'General Aptitude',
    icon: 'BookOpen',
    badgeColor: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    accentBg: 'from-purple-600 to-fuchsia-700',
    borderColor: 'border-purple-200 dark:border-purple-800/60',
    description: 'Tense Syntax Rules, Conditionals, Subjunctive, Passive Voice, Reported Speech & Inversion Structures',
  },
  {
    subject: 'IQ & Logical Reasoning',
    displayName: 'IQ & Logical Reasoning',
    category: 'General Aptitude',
    icon: 'Brain',
    badgeColor: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    accentBg: 'from-rose-600 to-pink-700',
    borderColor: 'border-rose-200 dark:border-rose-800/60',
    description: 'Clock Angles, Calendar Calculations, Speed-Distance, Syllogisms, Work Rates & Coding Decoders',
  },
  {
    subject: 'Accounting & Finance',
    displayName: 'Accounting & Finance',
    category: 'Commerce',
    icon: 'Coins',
    badgeColor: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    accentBg: 'from-amber-600 to-yellow-700',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
    description: 'Balance Sheet Identity, Dupont Analysis, NPV, IRR, WACC, CAPM, Bond Valuation & Cash Flow Ratios',
  },
  {
    subject: 'Economics',
    displayName: 'Economics',
    category: 'Commerce',
    icon: 'TrendingUp',
    badgeColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    accentBg: 'from-emerald-600 to-green-700',
    borderColor: 'border-emerald-200 dark:border-emerald-800/60',
    description: 'Elasticities, Consumer Theory, Cobb-Douglas, GDP Multipliers, IS-LM, Taylor Rule, Solow Growth & Game Theory',
  },
];

/**
 * Returns summary stats across all subjects
 */
export function getFormulaVaultStats() {
  const totalSheets = allFormulaSheets.length;
  let totalFormulas = 0;
  const subjectBreakdown: Record<string, { sheets: number; formulas: number }> = {};

  allFormulaSheets.forEach((sheet) => {
    totalFormulas += sheet.formulas.length;
    if (!subjectBreakdown[sheet.subject]) {
      subjectBreakdown[sheet.subject] = { sheets: 0, formulas: 0 };
    }
    subjectBreakdown[sheet.subject].sheets += 1;
    subjectBreakdown[sheet.subject].formulas += sheet.formulas.length;
  });

  return {
    totalFormulas,
    totalSheets,
    subjectBreakdown,
  };
}

/**
 * Filter formulas across sheets by query, subject, chapter, or tags
 */
export function searchFormulaSheets(
  queryText: string,
  selectedSubject?: FormulaSubject | 'ALL',
  selectedChapter?: string
): FormulaSheet[] {
  const q = (queryText || '').toLowerCase().trim();

  return allFormulaSheets
    .filter((sheet) => {
      if (selectedSubject && selectedSubject !== 'ALL' && sheet.subject !== selectedSubject) {
        return false;
      }
      if (selectedChapter && selectedChapter !== 'ALL' && sheet.chapter !== selectedChapter) {
        return false;
      }
      return true;
    })
    .map((sheet) => {
      if (!q) return sheet;

      // Filter individual formulas inside matching sheet
      const sheetMatches =
        sheet.title.toLowerCase().includes(q) ||
        sheet.chapter.toLowerCase().includes(q) ||
        sheet.tags.some((t) => t.toLowerCase().includes(q));

      const matchingFormulas = sheet.formulas.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.formula.toLowerCase().includes(q) ||
          f.variables.toLowerCase().includes(q) ||
          String(f.number).includes(q)
      );

      if (sheetMatches && matchingFormulas.length === 0) {
        // Return sheet with all formulas if sheet level matches query
        return sheet;
      }

      return {
        ...sheet,
        formulas: matchingFormulas,
      };
    })
    .filter((sheet) => sheet.formulas.length > 0);
}

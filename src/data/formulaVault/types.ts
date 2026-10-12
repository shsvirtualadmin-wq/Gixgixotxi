export interface FormulaItem {
  number: number;
  name: string;
  formula: string; // KaTeX / LaTeX format
  variables: string; // Explanatory note of variables
}

export interface FormulaSheet {
  id: string;
  subject: FormulaSubject;
  title: string;
  chapter: string;
  tags: string[];
  formulas: FormulaItem[];
}

export type FormulaSubject =
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Statistics & Probability'
  | 'Computer Science'
  | 'English Grammar rules'
  | 'IQ & Logical Reasoning'
  | 'Accounting & Finance'
  | 'Economics';

export interface SubjectMetadata {
  subject: FormulaSubject;
  iconName: string;
  sheetCount: number;
  formulaCount: number;
  color: string;
}

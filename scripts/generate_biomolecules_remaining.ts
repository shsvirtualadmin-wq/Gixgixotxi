import dotenv from 'dotenv';
dotenv.config();

export interface MCQ {
  question_text: string;
  options: string[];
  correct_option: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  needs_review?: boolean;
}

export const lipidsMCQs: MCQ[] = [];
export const proteinsMCQs: MCQ[] = [];
export const nucleicAcidsMCQs: MCQ[] = [];
export const conjugatedMCQs: MCQ[] = [];

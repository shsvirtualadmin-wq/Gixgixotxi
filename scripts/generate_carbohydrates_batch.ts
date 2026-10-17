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

export const mcqs: MCQ[] = [];

import dotenv from 'dotenv';
dotenv.config();

export interface UserMCQFormat {
  exam_type: string;
  subject: string;
  chapter: string;
  subtopic: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  source: string;
}

export const kipsLogicalReasoningMCQs: UserMCQFormat[] = [];

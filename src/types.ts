export type PathType = 'boards' | 'mdcat' | 'tcat';

export type BoardClass = 9 | 10 | 11 | 12 | 'MDCAT' | 'TCAT';

export type DashboardCategory = 
  | 'grade9_cs'
  | 'grade9_medical'
  | 'grade10_cs'
  | 'grade10_medical'
  | 'grade11_ics'
  | 'grade11_premedical'
  | 'grade11_preengineering'
  | 'grade12_ics'
  | 'grade12_preengineering'
  | 'grade12_premedical'
  | 'mdcat'
  | 'tcat'
  | 'admin';

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Exam Standard';

export interface Question {
  id: string;
  q: string;
  options: string[];
  correct: number;
  topic: string;
  explain: string;
  difficulty?: QuestionDifficulty;
  subject?: string;
}

export type TestMode = 'instant' | 'ai-custom';

export interface TestConfig {
  path: PathType;
  classNum?: BoardClass;
  group?: string;
  subject: string;
  customTopic?: string;
  chapterName?: string;
  subtopic?: string;
  durationMinutes: number;
  questionCount: number;
  difficulty: QuestionDifficulty;
  mode: TestMode;
  instantFeedback: boolean;
  groupSubjects?: string[];
  isFullMock?: boolean;
}

export interface UserAnswer {
  questionIndex: number;
  selectedOption: number | null;
  timeSpentSeconds: number;
  flagged?: boolean;
  skipped?: boolean;
}

export interface TestResult {
  id: string;
  timestamp: number;
  config: TestConfig;
  score: number;
  total: number;
  percentage: number;
  timeTakenSeconds: number;
  topicBreakdown: Record<string, { total: number; correct: number }>;
  userAnswers: UserAnswer[];
  questions: Question[];
}

export interface HistoryItem {
  id: string;
  dateStr: string;
  subject: string;
  pathLabel: string;
  percentage: number;
  score: number;
  total: number;
  timeTaken: string;
  hidden_from_student?: boolean;
}

export interface ActiveTestSession {
  sessionId: string;
  userId: string;
  userEmail?: string;
  config: TestConfig;
  questions: Question[];
  currentIndex: number;
  userAnswers: Record<number, UserAnswer>;
  timeLeftSeconds: number;
  startedAt: number;
  updatedAt: number;
}

export type ResourceCategory = 'past_paper' | 'mcq_drill';

export interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  class: string;
  category: ResourceCategory;
  file_url: string;
  file_size?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface MCQContext {
  question: string;
  options: string[];
  correctOption: number;
  selectedOption: number | null;
  subject?: string;
  topic?: string;
  explanation?: string;
  difficulty?: string;
}




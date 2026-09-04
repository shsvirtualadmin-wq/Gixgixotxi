import { MDCAT_PREBUILT_QUESTIONS } from '../data/mdcatPrebuiltQuestions';
import { TCAT_PREBUILT_QUESTIONS } from '../data/tcatPrebuiltQuestions';
import { PREBUILT_QUESTIONS } from '../data/prebuiltQuestions';

export interface QuestionBankStats {
  totalBankMCQs: number;
  mdcatCount: number;
  tcatCount: number;
  boardCount: number;
}

let cachedStats: QuestionBankStats | null = null;

export function getDynamicQuestionBankStats(): QuestionBankStats {
  if (cachedStats) {
    return cachedStats;
  }

  let mdcatCount = 0;
  for (const subject in MDCAT_PREBUILT_QUESTIONS) {
    const list = MDCAT_PREBUILT_QUESTIONS[subject];
    if (Array.isArray(list)) {
      mdcatCount += list.length;
    }
  }

  let tcatCount = 0;
  for (const subject in TCAT_PREBUILT_QUESTIONS) {
    const list = TCAT_PREBUILT_QUESTIONS[subject];
    if (Array.isArray(list)) {
      tcatCount += list.length;
    }
  }

  let boardCount = 0;
  for (const key in PREBUILT_QUESTIONS) {
    const list = PREBUILT_QUESTIONS[key];
    if (Array.isArray(list)) {
      boardCount += list.length;
    }
  }

  cachedStats = {
    totalBankMCQs: mdcatCount + tcatCount + boardCount,
    mdcatCount,
    tcatCount,
    boardCount,
  };

  return cachedStats;
}

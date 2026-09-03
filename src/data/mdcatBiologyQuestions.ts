import { Question } from '../types';
import { MDCAT_BIOLOGY_PART1_QUESTIONS } from './mdcatBiologyPart1';
import { MDCAT_BIOLOGY_PART2_QUESTIONS } from './mdcatBiologyPart2';

export const MDCAT_BIOLOGY_NEW_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_PART1_QUESTIONS,
  ...MDCAT_BIOLOGY_PART2_QUESTIONS
];

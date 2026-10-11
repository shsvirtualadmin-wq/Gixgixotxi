import { Question } from '../types';
import { MDCAT_BIOLOGY_BATCH3_PART1 } from './mdcatBiologyBatch3Part1';
import { MDCAT_BIOLOGY_BATCH3_PART2 } from './mdcatBiologyBatch3Part2';
import { MDCAT_CHEMISTRY_BATCH3 } from './mdcatChemistryBatch3';
import { MDCAT_PHYSICS_BATCH3 } from './mdcatPhysicsBatch3';
import { MDCAT_ENGLISH_BATCH3 } from './mdcatEnglishBatch3';
import { MDCAT_LOGICAL_REASONING_BATCH3 } from './mdcatLogicalReasoningBatch3';

export const MDCAT_BATCH3_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH3_PART1,
  ...MDCAT_BIOLOGY_BATCH3_PART2,
  ...MDCAT_CHEMISTRY_BATCH3,
  ...MDCAT_PHYSICS_BATCH3,
  ...MDCAT_ENGLISH_BATCH3,
  ...MDCAT_LOGICAL_REASONING_BATCH3
];

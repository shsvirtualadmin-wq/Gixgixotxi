import { Question } from '../types';
import { MDCAT_BIOLOGY_BATCH4_PART1 } from './mdcatBiologyBatch4Part1';
import { MDCAT_BIOLOGY_BATCH4_PART2 } from './mdcatBiologyBatch4Part2';
import { MDCAT_CHEMISTRY_BATCH4 } from './mdcatChemistryBatch4';
import { MDCAT_PHYSICS_BATCH4 } from './mdcatPhysicsBatch4';
import { MDCAT_ENGLISH_BATCH4 } from './mdcatEnglishBatch4';
import { MDCAT_LOGICAL_REASONING_BATCH4 } from './mdcatLogicalReasoningBatch4';

export const MDCAT_BATCH4_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH4_PART1,
  ...MDCAT_BIOLOGY_BATCH4_PART2,
  ...MDCAT_CHEMISTRY_BATCH4,
  ...MDCAT_PHYSICS_BATCH4,
  ...MDCAT_ENGLISH_BATCH4,
  ...MDCAT_LOGICAL_REASONING_BATCH4
];

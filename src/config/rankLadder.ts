/**
 * Rank Ladder Configuration
 * Determines student rank title based on total MCQs solved and streak.
 * Titles: Fresher, Scholar, Specialist, Topper
 */

export type RankTitle = 'Fresher' | 'Scholar' | 'Specialist' | 'Topper';

export interface RankDefinition {
  title: RankTitle;
  minMcqs: number;
  minStreak: number;
  description: string;
  badgeColor: string;
  badgeBg: string;
}

export const RANK_LADDER: RankDefinition[] = [
  {
    title: 'Topper',
    minMcqs: 1500,
    minStreak: 14,
    description: '1,500+ MCQs & 14+ day streak',
    badgeColor: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
  },
  {
    title: 'Specialist',
    minMcqs: 500,
    minStreak: 7,
    description: '500+ MCQs & 7+ day streak',
    badgeColor: '#A855F7',
    badgeBg: 'rgba(168, 85, 247, 0.12)',
  },
  {
    title: 'Scholar',
    minMcqs: 100,
    minStreak: 3,
    description: '100+ MCQs or 3+ day streak',
    badgeColor: '#3B82F6',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
  },
  {
    title: 'Fresher',
    minMcqs: 0,
    minStreak: 0,
    description: 'Beginning the preparation journey',
    badgeColor: '#9CA3AF',
    badgeBg: 'rgba(156, 163, 175, 0.12)',
  },
];

/**
 * Returns the highest earned rank definition based on total MCQs and streak.
 */
export function getRankTitle(mcqs = 0, streak = 0): RankDefinition {
  const safeMcqs = Number(mcqs) || 0;
  const safeStreak = Number(streak) || 0;

  if (safeMcqs >= 1500 && safeStreak >= 14) {
    return RANK_LADDER[0]; // Topper
  }
  if (safeMcqs >= 500 && safeStreak >= 7) {
    return RANK_LADDER[1]; // Specialist
  }
  if (safeMcqs >= 100 || safeStreak >= 3) {
    return RANK_LADDER[2]; // Scholar
  }
  return RANK_LADDER[3]; // Fresher
}

/**
 * Returns rank title string (e.g. 'Fresher', 'Scholar', 'Specialist', 'Topper')
 */
export function calculateRankTitle(mcqs = 0, streak = 0): RankTitle {
  return getRankTitle(mcqs, streak).title;
}

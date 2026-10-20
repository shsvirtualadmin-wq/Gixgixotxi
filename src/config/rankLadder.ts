export type RankTitle = 'Fresher' | 'Scholar' | 'Specialist' | 'Topper';

export interface RankLadderTier {
  title: RankTitle;
  minMcqs: number;
  minStreak: number;
  description: string;
  badgeColor: string;
}

export const RANK_LADDER: RankLadderTier[] = [
  {
    title: 'Topper',
    minMcqs: 500,
    minStreak: 14,
    description: '500+ MCQs solved & 14-day streak',
    badgeColor: '#F59E0B',
  },
  {
    title: 'Specialist',
    minMcqs: 200,
    minStreak: 7,
    description: '200+ MCQs solved or 7-day streak',
    badgeColor: '#A855F7',
  },
  {
    title: 'Scholar',
    minMcqs: 50,
    minStreak: 3,
    description: '50+ MCQs solved or 3-day streak',
    badgeColor: '#00F0FF',
  },
  {
    title: 'Fresher',
    minMcqs: 0,
    minStreak: 0,
    description: 'Starting academic journey',
    badgeColor: '#9CA3AF',
  },
];

export const RANK_TIERS = RANK_LADDER;

export function calculateRankTitle(mcqs = 0, streak = 0): RankTitle {
  const safeMcqs = Number(mcqs) || 0;
  const safeStreak = Number(streak) || 0;

  if (safeMcqs >= 500 && safeStreak >= 14) return 'Topper';
  if (safeMcqs >= 200 || safeStreak >= 7) return 'Specialist';
  if (safeMcqs >= 50 || safeStreak >= 3) return 'Scholar';
  return 'Fresher';
}

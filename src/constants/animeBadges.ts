import { api } from '@/lib/api';

export interface AnimeBadge {
  id: string;
  days: number;
  name: string;
  tierName: string;
  accentColor: string;
  glowColor: string;
  rewardTitle: string;
  rewardDesc: string;
  lore: string;
}

export const ANIME_STREAK_BADGES: AnimeBadge[] = [
  {
    id: 'genin-spark',
    days: 3,
    name: 'Genin Spark',
    tierName: 'Tier 1',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    rewardTitle: 'Genin Chakra Aura',
    rewardDesc: 'Emerald leaf matrix frame & "Genin" profile title',
    lore: 'The spark is ignited. Three consecutive days of daily focus mark the beginning of your ninja way.',
  },
  {
    id: 'haki-awakening',
    days: 7,
    name: 'Haki Awakening',
    tierName: 'Tier 2',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    rewardTitle: 'Electric Will Frame',
    rewardDesc: 'Electric blue pulse border & "Haki Awakened" profile title',
    lore: 'One full unbroken week. Your observational will awakens to predict and conquer exam traps.',
  },
  {
    id: 'shonen-resolve',
    days: 14,
    name: 'Shonen Resolve',
    tierName: 'Tier 3',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    rewardTitle: 'Vivid Purple Halo',
    rewardDesc: 'Vivid purple glowing username & "Shonen Protagonist" title',
    lore: 'Fourteen days of relentless discipline. You fight through fatigue like a classic anime hero.',
  },
  {
    id: 'bankai-mode',
    days: 30,
    name: 'Bankai Mode',
    tierName: 'Tier 4',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    rewardTitle: 'Amber Gold Crest',
    rewardDesc: 'Amber gold holographic profile crest & "Bankai Master" title',
    lore: 'A whole month of daily drills. Your inner power is fully released in its final released form.',
  },
  {
    id: 'super-saiyan-streak',
    days: 60,
    name: 'Super Saiyan Streak',
    tierName: 'Tier 5',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    rewardTitle: 'Crimson Flame Pulse',
    rewardDesc: 'Crimson aura matrix pulse animation & "Super Saiyan" title',
    lore: 'Two solid months without breaking. Your power level surpasses ordinary student limits.',
  },
  {
    id: 'hokage-rank',
    days: 100,
    name: 'Hokage Rank',
    tierName: 'Tier 6',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    rewardTitle: 'Hokage Will Cloak',
    rewardDesc: 'Neon cyan cybernetic badge & "Hokage" profile title',
    lore: 'One hundred unbroken days. You protect your squad, inspire your peers, and command the village.',
  },
  {
    id: 'pirate-king',
    days: 150,
    name: 'Pirate King',
    tierName: 'Final Tier',
    accentColor: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.65)',
    rewardTitle: 'Celestial Pirate Crown',
    rewardDesc: 'Imperial gold corona & "Pirate King" legendary title',
    lore: 'The supreme pinnacle. You have sailed the Grand Line and conquered all challenges across Pakistan.',
  },
];

export { AnimeBadgeEmblem } from '@/components/dashboard/AnimeBadgeEmblem';

export async function redeemStreakBadge(
  _uid: string,
  badgeId: string
): Promise<{ success: boolean; message: string }> {
  const badge = ANIME_STREAK_BADGES.find((b) => b.id === badgeId);
  if (!badge) throw new Error('Badge not found.');

  const res = await api.post<{ success?: boolean; message?: string }>('/api/users/me/badges', {
    action: 'redeem',
    badgeId,
    requiredDays: badge.days,
  });

  return {
    success: Boolean(res?.success ?? true),
    message:
      res?.message ||
      `Unlocked & redeemed ${badge.name}! Earned reward: ${badge.rewardTitle}.`,
  };
}

export async function toggleEquipBadge(
  _uid: string,
  badgeId: string,
  currentEquipped: string[]
): Promise<string[]> {
  const isEquipped = currentEquipped.includes(badgeId);

  let updated: string[];
  if (isEquipped) {
    updated = currentEquipped.filter((id) => id !== badgeId);
  } else {
    if (currentEquipped.length >= 3) {
      updated = [...currentEquipped.slice(1), badgeId];
    } else {
      updated = [...currentEquipped, badgeId];
    }
  }

  const res = await api.post<{ equippedBadges?: string[] }>('/api/users/me/badges', {
    action: 'equip',
    badgeId,
    equippedBadges: updated,
  });

  return Array.isArray(res?.equippedBadges) ? res.equippedBadges : updated;
}

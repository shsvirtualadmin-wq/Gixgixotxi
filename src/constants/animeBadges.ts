import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    id: 'initiation',
    days: 3,
    name: 'Initiation',
    tierName: 'Tier 1',
    accentColor: '#4ade80', // soft green
    glowColor: 'rgba(74, 222, 128, 0.45)',
    rewardTitle: 'Initiate Aura',
    rewardDesc: 'Soft green matrix frame & "Initiate" profile title',
    lore: 'The foundation is laid. Three unbroken days igniting daily study discipline.',
  },
  {
    id: 'discipline',
    days: 7,
    name: 'Discipline',
    tierName: 'Tier 2',
    accentColor: '#38bdf8', // electric blue
    glowColor: 'rgba(56, 189, 248, 0.45)',
    rewardTitle: 'Electric Focus Frame',
    rewardDesc: 'Electric blue border & "Disciplined" profile badge',
    lore: 'One full week of uninterrupted daily practice. Mental fortitude awakened.',
  },
  {
    id: 'habit-locked',
    days: 14,
    name: 'Habit Locked',
    tierName: 'Tier 3',
    accentColor: '#a855f7', // vivid purple
    glowColor: 'rgba(168, 85, 247, 0.45)',
    rewardTitle: 'Vivid Purple Halo',
    rewardDesc: 'Vivid purple glowing username & "Habit Master" title',
    lore: 'Fourteen days straight. Studying is no longer effort—it is an instinct.',
  },
  {
    id: 'unstoppable',
    days: 30,
    name: 'Unstoppable',
    tierName: 'Tier 4',
    accentColor: '#f59e0b', // amber gold
    glowColor: 'rgba(245, 158, 11, 0.45)',
    rewardTitle: 'Amber Gold Crest',
    rewardDesc: 'Amber gold holographic profile crest & "Unstoppable" title',
    lore: 'A whole month of relentless daily drills. Nothing can break your stride.',
  },
  {
    id: 'master-of-momentum',
    days: 60,
    name: 'Master of Momentum',
    tierName: 'Tier 5',
    accentColor: '#ef4444', // ruby red
    glowColor: 'rgba(239, 68, 68, 0.45)',
    rewardTitle: 'Ruby Red Aura',
    rewardDesc: 'Ruby red matrix pulse animation & "Momentum Titan" title',
    lore: 'Two solid months of exam mastery. You command speed and precision effortlessly.',
  },
  {
    id: 'legend-of-consistency',
    days: 90,
    name: 'Legend of Consistency',
    tierName: 'Tier 6',
    accentColor: '#06b6d4', // neon cyan
    glowColor: 'rgba(6, 182, 212, 0.45)',
    rewardTitle: 'Neon Cyan Cloak',
    rewardDesc: 'Neon cyan cybernetic badge & "Consistency Legend" title',
    lore: 'Ninety days. A legendary quarter-year standing among the very elite across Pakistan.',
  },
  {
    id: 'ascendant',
    days: 180,
    name: 'Ascendant',
    tierName: 'Tier 7',
    accentColor: '#c084fc', // prismatic / iridescent
    glowColor: 'rgba(192, 132, 252, 0.45)',
    rewardTitle: 'Prismatic Shimmer',
    rewardDesc: 'Iridescent animated avatar glow & "Ascendant" title',
    lore: 'Half a year of unbroken daily dedication. Transcending ordinary student boundaries.',
  },
  {
    id: 'eternal-vanguard',
    days: 365,
    name: 'Eternal Vanguard',
    tierName: 'Tier 8',
    accentColor: '#fef08a', // celestial white-gold
    glowColor: 'rgba(254, 240, 138, 0.55)',
    rewardTitle: 'Celestial White-Gold Crown',
    rewardDesc: 'Eternal celestial white-gold corona & "Vanguard Immortal" title',
    lore: '365 days. A complete year of immortal study consistency. The pinnacle of Boardly.',
  },
];

export { AnimeBadgeEmblem } from '@/components/dashboard/AnimeBadgeEmblem';

/**
 * Server/Client Redeem Action: validates actual user streak before adding to redeemedBadges.
 */
export async function redeemStreakBadge(
  uid: string,
  badgeId: string
): Promise<{ success: boolean; message: string }> {
  const badge = ANIME_STREAK_BADGES.find((b) => b.id === badgeId);
  if (!badge) throw new Error('Badge not found.');

  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) throw new Error('User not found.');

  const userData = snap.data();
  const currentStreak = Number(userData.streak || 0);
  const currentRedeemed = Array.isArray(userData.redeemedBadges) ? userData.redeemedBadges : [];

  if (currentStreak < badge.days) {
    throw new Error(
      `Streak requirement not met: ${currentStreak}/${badge.days} days required to unlock ${badge.name}.`
    );
  }

  if (currentRedeemed.includes(badgeId)) {
    return { success: true, message: `${badge.name} is already redeemed!` };
  }

  await updateDoc(userDocRef, {
    redeemedBadges: arrayUnion(badgeId),
  });

  return {
    success: true,
    message: `Unlocked & redeemed ${badge.name}! Earned reward: ${badge.rewardTitle}.`,
  };
}

/**
 * Equips up to 3 badges on the user's profile and leaderboards.
 */
export async function toggleEquipBadge(
  uid: string,
  badgeId: string,
  currentEquipped: string[]
): Promise<string[]> {
  const userDocRef = doc(db, 'users', uid);
  const isEquipped = currentEquipped.includes(badgeId);

  let updated: string[];
  if (isEquipped) {
    updated = currentEquipped.filter((id) => id !== badgeId);
  } else {
    if (currentEquipped.length >= 3) {
      // Replace oldest
      updated = [...currentEquipped.slice(1), badgeId];
    } else {
      updated = [...currentEquipped, badgeId];
    }
  }

  await updateDoc(userDocRef, {
    equippedBadges: updated,
  });

  return updated;
}

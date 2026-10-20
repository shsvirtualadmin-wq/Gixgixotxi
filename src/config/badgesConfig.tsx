import React from 'react';
import {
  Sparkles,
  Flame,
  ShieldAlert,
  Award,
  Crown,
  Anchor,
  Compass,
  Trophy,
  CheckCircle,
} from 'lucide-react';

export interface PassportStamp {
  id: string;
  name: string;
  requirement: string;
  category: 'solve' | 'streak' | 'crew' | 'arena';
  earned: (stats: { mcqs?: number; streak?: number; longestStreak?: number; crewName?: string | null }) => boolean;
}

export const PASSPORT_STAMPS: PassportStamp[] = [
  {
    id: 'stamp_100_mcqs',
    name: 'Century Solver',
    requirement: 'Solve your first 100 practice MCQs',
    category: 'solve',
    earned: (stats) => (stats.mcqs || 0) >= 100,
  },
  {
    id: 'stamp_7d_streak',
    name: 'Week of Fire',
    requirement: 'Maintain a 7-day uninterrupted study streak',
    category: 'streak',
    earned: (stats) => Math.max(stats.streak || 0, stats.longestStreak || 0) >= 7,
  },
  {
    id: 'stamp_crew_joined',
    name: 'Nakama Oath',
    requirement: 'Enlist in a study squad or crew',
    category: 'crew',
    earned: (stats) => Boolean(stats.crewName),
  },
  {
    id: 'stamp_top10',
    name: 'Arena Contender',
    requirement: 'Reach the Top 10 on the student leaderboard',
    category: 'arena',
    earned: (stats) => (stats.mcqs || 0) >= 250 || Math.max(stats.streak || 0, stats.longestStreak || 0) >= 10,
  },
];

export interface StreakBadge {
  id: string;
  name: string;
  days: number;
  description: string;
  color: string;
  flameIntensity: 'low' | 'med' | 'high' | 'ultra' | 'cosmic';
}

export const STREAK_BADGES: StreakBadge[] = [
  {
    id: 'badge_streak_3d',
    name: '3-Day Spark',
    days: 3,
    description: '3 consecutive days studying on Boardly',
    color: '#F97316',
    flameIntensity: 'low',
  },
  {
    id: 'badge_streak_7d',
    name: '7-Day Blaze',
    days: 7,
    description: '7 consecutive days studying on Boardly',
    color: '#EF4444',
    flameIntensity: 'med',
  },
  {
    id: 'badge_streak_14d',
    name: '14-Day Inferno',
    days: 14,
    description: '14 consecutive days studying on Boardly',
    color: '#DC2626',
    flameIntensity: 'high',
  },
  {
    id: 'badge_streak_30d',
    name: '30-Day Supernova',
    days: 30,
    description: '30 consecutive days studying on Boardly',
    color: '#A855F7',
    flameIntensity: 'ultra',
  },
  {
    id: 'badge_streak_100d',
    name: '100-Day Eternal',
    days: 100,
    description: '100 consecutive days studying on Boardly',
    color: '#EAB308',
    flameIntensity: 'cosmic',
  },
];

export interface RoleBadgeItem {
  id: string;
  name: string;
  meaning: string;
  icon: (size?: number) => React.ReactNode;
  bg: string;
  color: string;
}

export const ROLE_BADGES: Record<string, RoleBadgeItem> = {
  pro: {
    id: 'pro',
    name: 'Pro Member',
    meaning: 'Active Boardly Pro subscription with unlimited tests & features',
    icon: (size = 14) => <Sparkles size={size} className="text-[#F59E0B]" />,
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
  },
  captain: {
    id: 'captain',
    name: 'Nakama Captain',
    meaning: 'Founder and leader of a verified study crew',
    icon: (size = 14) => <Anchor size={size} className="text-[#3B82F6]" />,
    bg: 'rgba(59, 130, 246, 0.15)',
    color: '#3B82F6',
  },
  crew_leader: {
    id: 'crew_leader',
    name: 'Crew Leader',
    meaning: 'Leader of an active study squad',
    icon: (size = 14) => <Crown size={size} className="text-[#8B5CF6]" />,
    bg: 'rgba(139, 92, 246, 0.15)',
    color: '#8B5CF6',
  },
  staff: {
    id: 'staff',
    name: 'Boardly Staff',
    meaning: 'Official Boardly administrator and academic proctor',
    icon: (size = 14) => <ShieldAlert size={size} className="text-[#E11D48]" />,
    bg: 'rgba(225, 29, 72, 0.15)',
    color: '#E11D48',
  },
};

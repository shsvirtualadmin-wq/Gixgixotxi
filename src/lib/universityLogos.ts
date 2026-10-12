/**
 * Central University Logo Mapping
 * Single source of truth for university logo resolution handling name variants:
 * - Habib University: DUHS, Dow University, KMU, Khyber Medical University, SZABMU, Habib University, Air University, AU
 */

export const TARGET_UNIVERSITY_LOGOS: Record<string, string> = {
  // 1. Habib University
  'habib': '/logos/habib.png',
  'habib university': '/logos/habib.png',
  'hu': '/logos/habib.png',

  // 2. Shaheed Zulfiqar Ali Bhutto Medical University
  'szabmu': '/logos/szabmu.png',
  'shaheed zulfiqar ali bhutto medical university': '/logos/szabmu.png',
  'szab medical university': '/logos/szabmu.png',
  'szab medical university islamabad': '/logos/szabmu.png',
  'szabmu islamabad': '/logos/szabmu.png',
  'szab': '/logos/szabmu.png',

  // 3. Khyber Medical University
  'kmu': '/logos/kmu.png',
  'khyber medical university': '/logos/kmu.png',
  'khyber medical university peshawar': '/logos/kmu.png',
  'kmu peshawar': '/logos/kmu.png',
  'khyber medical': '/logos/kmu.png',

  // 4. Dow University of Health Sciences
  'duhs': '/logos/duhs.png',
  'dow university': '/logos/duhs.png',
  'dow university of health sciences': '/logos/duhs.png',
  'dow': '/logos/duhs.png',
  'dow medical college': '/logos/duhs.png',

  // 5. Air University
  'air': '/logos/air.png',
  'air university': '/logos/air.png',
  'air university islamabad': '/logos/air.png',
  'au': '/logos/air.png',
};

export const ALL_UNIVERSITY_LOGOS: Record<string, string> = {
  ...TARGET_UNIVERSITY_LOGOS,
  'nust': '/logos/nust.png',
  'fast': '/logos/fast.png',
  'fast-nu': '/logos/fast.png',
  'giki': '/logos/giki.png',
  'lums': '/logos/lums.png',
  'iba': '/logos/iba.png',
  'ned': '/logos/ned.png',
  'uet': '/logos/uet.png',
  'pieas': '/logos/pieas.png',
  'comsats': '/logos/comsats.png',
  'nums': '/logos/nums.png',
  'aku': '/logos/aku.png',
  'uhs': '/logos/uhs.png',
  'numl': '/logos/numl.png',
  'hitec': '/logos/hitec.png',
  'nutech': '/logos/nutech.png',
  'muet': '/logos/muet.png',
  'qau': '/logos/qau.png',
  'pmdc': '/logos/pmdc.png',
  'fbise': '/logos/fbise.png',
};

/**
 * Returns whether a given university identifier/name corresponds to one of the 5 target universities
 */
export function isTargetUniversity(nameOrId?: string): boolean {
  if (!nameOrId || typeof nameOrId !== 'string') return false;
  const clean = nameOrId.trim().toLowerCase().replace(/[()[\]{}:;,.-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (TARGET_UNIVERSITY_LOGOS[clean]) return true;
  if (clean.includes('habib')) return true;
  if (clean.includes('szabmu') || clean.includes('zulfiqar ali bhutto')) return true;
  if (clean.includes('kmu') || clean.includes('khyber medical')) return true;
  if (clean.includes('duhs') || clean.includes('dow university') || clean.includes('dow medical')) return true;
  if (clean.startsWith('air') || clean.includes('air university') || clean === 'au') return true;
  return false;
}

/**
 * Resolves the logo for any university string or identifier.
 * Priority given to target 5 universities with comprehensive variant matching.
 */
export function getUniversityLogo(nameOrId?: string): string | undefined {
  if (!nameOrId || typeof nameOrId !== 'string') return undefined;
  const clean = nameOrId.trim().toLowerCase();
  if (!clean || clean === 'none' || clean === 'not selected' || clean === 'not_decided') return undefined;

  if (TARGET_UNIVERSITY_LOGOS[clean]) {
    return TARGET_UNIVERSITY_LOGOS[clean];
  }

  const sanitized = clean.replace(/[()[\]{}:;,.-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (TARGET_UNIVERSITY_LOGOS[sanitized]) {
    return TARGET_UNIVERSITY_LOGOS[sanitized];
  }

  // Variant matching
  if (sanitized.includes('habib')) return '/logos/habib.png';
  if (sanitized.includes('szabmu') || sanitized.includes('zulfiqar ali bhutto')) return '/logos/szabmu.png';
  if (sanitized.includes('kmu') || sanitized.includes('khyber medical')) return '/logos/kmu.png';
  if (sanitized.includes('duhs') || sanitized.includes('dow university') || sanitized.includes('dow medical')) return '/logos/duhs.png';
  if (sanitized === 'au' || sanitized.startsWith('air university') || sanitized.includes('air university')) return '/logos/air.png';
  if (sanitized === 'air') return '/logos/air.png';

  if (ALL_UNIVERSITY_LOGOS[clean]) return ALL_UNIVERSITY_LOGOS[clean];
  if (ALL_UNIVERSITY_LOGOS[sanitized]) return ALL_UNIVERSITY_LOGOS[sanitized];

  return undefined;
}

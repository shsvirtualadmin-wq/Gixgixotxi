import { getUniversityLogo } from '../lib/universityLogos';

export interface University {
  id: string;
  name?: string;
  shortName: string;
  fullName: string;
  logo: string;
  category: 'Engineering' | 'Business' | 'Medical';
  location?: string;
  testName?: string;
}

export const UNIVERSITIES: University[] = [
  {
    id: 'nust',
    name: 'National University of Sciences & Technology',
    shortName: 'NUST',
    fullName: 'National University of Sciences & Technology',
    logo: '/logos/nust.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'NET',
  },
  {
    id: 'fast',
    name: 'FAST National University of Computer and Emerging Sciences',
    shortName: 'FAST',
    fullName: 'FAST National University of Computer and Emerging Sciences',
    logo: '/logos/fast.png',
    category: 'Engineering',
    location: 'Islamabad / Lahore / Karachi',
    testName: 'FAST-NU Test',
  },
  {
    id: 'giki',
    name: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    shortName: 'GIKI',
    fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    logo: '/logos/giki.png',
    category: 'Engineering',
    location: 'Topi, Swabi',
    testName: 'GIKI Admission Test',
  },
  {
    id: 'lums',
    name: 'Lahore University of Management Sciences',
    shortName: 'LUMS',
    fullName: 'Lahore University of Management Sciences',
    logo: '/logos/lums.png',
    category: 'Business',
    location: 'Lahore',
    testName: 'LCAT / SSE',
  },
  {
    id: 'iba',
    name: 'Institute of Business Administration',
    shortName: 'IBA',
    fullName: 'Institute of Business Administration',
    logo: '/logos/iba.png',
    category: 'Business',
    location: 'Karachi',
    testName: 'IBA Aptitude Test',
  },
  {
    id: 'ned',
    name: 'NED University of Engineering & Technology',
    shortName: 'NED',
    fullName: 'NED University of Engineering & Technology',
    logo: '/logos/ned.png',
    category: 'Engineering',
    location: 'Karachi',
    testName: 'NED Entry Test',
  },
  {
    id: 'uet',
    name: 'University of Engineering and Technology',
    shortName: 'UET',
    fullName: 'University of Engineering and Technology',
    logo: '/logos/uet.png',
    category: 'Engineering',
    location: 'Lahore / Taxila',
    testName: 'ECAT / TCAT',
  },
  {
    id: 'pieas',
    name: 'Pakistan Institute of Engineering and Applied Sciences',
    shortName: 'PIEAS',
    fullName: 'Pakistan Institute of Engineering and Applied Sciences',
    logo: '/logos/pieas.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'PIEAS Written Test',
  },
  {
    id: 'comsats',
    name: 'COMSATS University Islamabad',
    shortName: 'COMSATS',
    fullName: 'COMSATS University Islamabad',
    logo: '/logos/comsats.png',
    category: 'Engineering',
    location: 'Islamabad / Lahore',
    testName: 'NTS NAT',
  },
  {
    id: 'muet',
    name: 'Mehran University of Engineering and Technology',
    shortName: 'MUET',
    fullName: 'Mehran University of Engineering and Technology',
    logo: '/logos/muet.png',
    category: 'Engineering',
    location: 'Jamshoro',
    testName: 'MUET Pre-Admission',
  },
  {
    id: 'nums',
    name: 'National University of Medical Sciences',
    shortName: 'NUMS',
    fullName: 'National University of Medical Sciences',
    logo: '/logos/nums.png',
    category: 'Medical',
    location: 'Rawalpindi',
    testName: 'NUMS MDCAT',
  },
  {
    id: 'uhs',
    name: 'University of Health Sciences',
    shortName: 'UHS',
    fullName: 'University of Health Sciences',
    logo: '/logos/uhs.png',
    category: 'Medical',
    location: 'Lahore',
    testName: 'PMDC MDCAT',
  },
  {
    id: 'aku',
    name: 'Aga Khan University Medical College',
    shortName: 'AKU',
    fullName: 'Aga Khan University Medical College',
    logo: '/logos/aku.png',
    category: 'Medical',
    location: 'Karachi',
    testName: 'AKU Entry Test',
  },
  {
    id: 'nutech',
    name: 'National University of Technology',
    shortName: 'NUTECH',
    fullName: 'National University of Technology',
    logo: '/logos/nutech.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'NUAT Test',
  },
  {
    id: 'qau',
    name: 'Quaid-i-Azam University',
    shortName: 'QAU',
    fullName: 'Quaid-i-Azam University',
    logo: '/logos/qau.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'QAU Entrance Exam',
  },
  {
    id: 'air',
    name: 'Air University Islamabad',
    shortName: 'Air University',
    fullName: 'Air University Islamabad',
    logo: '/logos/air.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'AU Entry Test',
  },
  {
    id: 'habib',
    name: 'Habib University',
    shortName: 'Habib',
    fullName: 'Habib University',
    logo: '/logos/habib.png',
    category: 'Business',
    location: 'Karachi',
    testName: 'Habib Entrance Exam',
  },
  {
    id: 'duhs',
    name: 'Dow University of Health Sciences',
    shortName: 'DUHS',
    fullName: 'Dow University of Health Sciences',
    logo: '/logos/duhs.png',
    category: 'Medical',
    location: 'Karachi',
    testName: 'MDCAT Sindh',
  },
  {
    id: 'kmu',
    name: 'Khyber Medical University',
    shortName: 'KMU',
    fullName: 'Khyber Medical University',
    logo: '/logos/kmu.png',
    category: 'Medical',
    location: 'Peshawar',
    testName: 'MDCAT KPK',
  },
  {
    id: 'szabmu',
    name: 'Shaheed Zulfiqar Ali Bhutto Medical University',
    shortName: 'SZABMU',
    fullName: 'Shaheed Zulfiqar Ali Bhutto Medical University',
    logo: '/logos/szabmu.png',
    category: 'Medical',
    location: 'Islamabad',
    testName: 'MDCAT Federal',
  },
  {
    id: 'numl',
    name: 'National University of Modern Languages',
    shortName: 'NUML',
    fullName: 'National University of Modern Languages',
    logo: '/logos/numl.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'NUML Admission Test',
  },
  {
    id: 'hitec',
    name: 'HITEC University',
    shortName: 'HITEC',
    fullName: 'HITEC University',
    logo: '/logos/hitec.png',
    category: 'Engineering',
    location: 'Taxila',
    testName: 'HITEC Entry Test',
  },
];

export const UNIVERSITY_MAP: Record<string, University> = UNIVERSITIES.reduce((acc, u) => {
  acc[u.id.toLowerCase()] = u;
  acc[u.shortName.toLowerCase()] = u;
  acc[u.fullName.toLowerCase()] = u;
  return acc;
}, {} as Record<string, University>);

// Common aliases map
const UNIVERSITY_ALIASES: Record<string, string> = {
  'fast-nu': 'fast',
  'fast nuces': 'fast',
  'fast-nuces': 'fast',
  'nuces': 'fast',
  'nust net': 'nust',
  'nust-net': 'nust',
  'uet taxila': 'uet',
  'uet-taxila': 'uet',
  'uet lahore': 'uet',
  'uet-lahore': 'uet',
  'aga khan': 'aku',
  'aga khan university': 'aku',
  'king edward': 'uhs',
  'kemu': 'uhs',
  'allama iqbal': 'uhs',
  'aimc': 'uhs',
  'army medical college': 'nums',
  'amc': 'nums',
  'dow': 'duhs',
  'dow university': 'duhs',
  'dow university of health sciences': 'duhs',
  'kmu': 'kmu',
  'khyber medical university': 'kmu',
  'szabmu': 'szabmu',
  'shaheed zulfiqar ali bhutto': 'szabmu',
  'shaheed zulfiqar ali bhutto medical university': 'szabmu',
  'habib': 'habib',
  'habib university': 'habib',
  'air university': 'air',
  'au': 'air',
};

export function findUniversity(nameOrId?: string): University | undefined {
  if (!nameOrId) return undefined;
  const key = nameOrId.toLowerCase().trim();
  if (!key || key === 'not_decided' || key === 'none' || key === 'not selected' || key === 'not chosen') {
    return undefined;
  }
  if (UNIVERSITY_MAP[key]) return UNIVERSITY_MAP[key];

  if (UNIVERSITY_ALIASES[key]) {
    const aliasedId = UNIVERSITY_ALIASES[key];
    if (UNIVERSITY_MAP[aliasedId]) return UNIVERSITY_MAP[aliasedId];
  }

  // Substring search
  const found = UNIVERSITIES.find(
    (u) =>
      u.id.toLowerCase() === key ||
      u.shortName.toLowerCase() === key ||
      u.fullName.toLowerCase().includes(key) ||
      key.includes(u.shortName.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(key))
  );
  if (found) return found;

  if (key === 'somewhere_else') {
    return {
      id: 'somewhere_else',
      shortName: 'Other University',
      fullName: 'Other Higher Education Institution',
      logo: '/logos/nust.png',
      category: 'Engineering',
      testName: 'General Entrance Exam',
    };
  }

  // Synthesize entry for user-specified custom university
  return {
    id: key.replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'custom-uni',
    shortName: nameOrId.trim(),
    fullName: nameOrId.trim(),
    logo: getUniversityLogo(nameOrId) || '/logos/nust.png',
    category: 'Engineering',
    testName: `${nameOrId.trim()} Entrance Test`,
  };
}

export const UNIVERSITY_DISCLAIMER =
  'University names and logos belong to their respective owners. Boardly is an independent platform and is not affiliated with or endorsed by them.';

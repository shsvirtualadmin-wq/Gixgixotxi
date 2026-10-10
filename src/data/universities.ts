export interface University {
  id: string;
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
    shortName: 'NUST',
    fullName: 'National University of Sciences & Technology',
    logo: '/logos/nust.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'NET',
  },
  {
    id: 'fast',
    shortName: 'FAST',
    fullName: 'FAST National University of Computer and Emerging Sciences',
    logo: '/logos/fast.png',
    category: 'Engineering',
    location: 'Islamabad / Lahore / Karachi',
    testName: 'FAST-NU Test',
  },
  {
    id: 'giki',
    shortName: 'GIKI',
    fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    logo: '/logos/giki.png',
    category: 'Engineering',
    location: 'Topi, Swabi',
    testName: 'GIKI Admission Test',
  },
  {
    id: 'lums',
    shortName: 'LUMS',
    fullName: 'Lahore University of Management Sciences',
    logo: '/logos/lums.png',
    category: 'Business',
    location: 'Lahore',
    testName: 'LCAT / SSE',
  },
  {
    id: 'iba',
    shortName: 'IBA',
    fullName: 'Institute of Business Administration',
    logo: '/logos/iba.png',
    category: 'Business',
    location: 'Karachi',
    testName: 'IBA Aptitude Test',
  },
  {
    id: 'ned',
    shortName: 'NED',
    fullName: 'NED University of Engineering & Technology',
    logo: '/logos/ned.png',
    category: 'Engineering',
    location: 'Karachi',
    testName: 'NED Entry Test',
  },
  {
    id: 'uet',
    shortName: 'UET',
    fullName: 'University of Engineering and Technology',
    logo: '/logos/uet-taxila.png',
    category: 'Engineering',
    location: 'Lahore / Taxila',
    testName: 'ECAT',
  },
  {
    id: 'pieas',
    shortName: 'PIEAS',
    fullName: 'Pakistan Institute of Engineering and Applied Sciences',
    logo: '/logos/pieas.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'PIEAS Written Test',
  },
  {
    id: 'comsats',
    shortName: 'COMSATS',
    fullName: 'COMSATS University Islamabad',
    logo: '/logos/comsats.png',
    category: 'Engineering',
    location: 'Islamabad / Lahore',
    testName: 'NTS NAT',
  },
  {
    id: 'muet',
    shortName: 'MUET',
    fullName: 'Mehran University of Engineering and Technology',
    logo: '/logos/muet.png',
    category: 'Engineering',
    location: 'Jamshoro',
    testName: 'MUET Pre-Admission',
  },
  {
    id: 'nums',
    shortName: 'NUMS',
    fullName: 'National University of Medical Sciences',
    logo: '/logos/nums.png',
    category: 'Medical',
    location: 'Rawalpindi',
    testName: 'NUMS MDCAT',
  },
  {
    id: 'uhs',
    shortName: 'UHS',
    fullName: 'University of Health Sciences',
    logo: '/logos/uhs.png',
    category: 'Medical',
    location: 'Lahore',
    testName: 'PMDC MDCAT',
  },
  {
    id: 'aku',
    shortName: 'AKU',
    fullName: 'Aga Khan University Medical College',
    logo: '/logos/aku.png',
    category: 'Medical',
    location: 'Karachi',
    testName: 'AKU Entry Test',
  },
  {
    id: 'nutech',
    shortName: 'NUTECH',
    fullName: 'National University of Technology',
    logo: '/logos/nutech.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'NUAT Test',
  },
  {
    id: 'qau',
    shortName: 'QAU',
    fullName: 'Quaid-i-Azam University',
    logo: '/logos/qau.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'QAU Entrance Exam',
  },
  {
    id: 'air',
    shortName: 'Air University',
    fullName: 'Air University Islamabad',
    // Logo file not in repository: will render elegant clean round placeholder with short name AU
    logo: '/logos/air.png',
    category: 'Engineering',
    location: 'Islamabad',
    testName: 'AU Entry Test',
  },
  {
    id: 'habib',
    shortName: 'Habib',
    fullName: 'Habib University',
    // Logo file not in repository: will render elegant clean round placeholder with short name HU
    logo: '/logos/habib.png',
    category: 'Business',
    location: 'Karachi',
    testName: 'Habib Entrance Exam',
  },
  {
    id: 'duhs',
    shortName: 'DUHS',
    fullName: 'Dow University of Health Sciences',
    logo: '/logos/duhs.svg',
    category: 'Medical',
    location: 'Karachi',
    testName: 'MDCAT Sindh',
  },
  {
    id: 'kmu',
    shortName: 'KMU',
    fullName: 'Khyber Medical University',
    logo: '/logos/kmu.svg',
    category: 'Medical',
    location: 'Peshawar',
    testName: 'MDCAT KPK',
  },
  {
    id: 'szabmu',
    shortName: 'SZABMU',
    fullName: 'Shaheed Zulfiqar Ali Bhutto Medical University',
    logo: '/logos/szabmu.svg',
    category: 'Medical',
    location: 'Islamabad',
    testName: 'MDCAT Federal',
  },
];

export const UNIVERSITY_MAP: Record<string, University> = UNIVERSITIES.reduce((acc, u) => {
  acc[u.id] = u;
  acc[u.shortName.toLowerCase()] = u;
  return acc;
}, {} as Record<string, University>);

export function findUniversity(nameOrId?: string): University | undefined {
  if (!nameOrId) return undefined;
  const key = nameOrId.toLowerCase().trim();
  if (UNIVERSITY_MAP[key]) return UNIVERSITY_MAP[key];

  return UNIVERSITIES.find(
    (u) =>
      u.id.toLowerCase() === key ||
      u.shortName.toLowerCase() === key ||
      u.fullName.toLowerCase().includes(key) ||
      key.includes(u.shortName.toLowerCase())
  );
}

export const UNIVERSITY_DISCLAIMER =
  'University names and logos belong to their respective owners. Boardly is an independent platform and is not affiliated with or endorsed by them.';

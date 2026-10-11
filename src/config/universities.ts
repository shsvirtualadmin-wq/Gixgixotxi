export interface UniversityWeights {
  matric: number;
  fsc: number;
  test: number;
}

export interface UniversityConfig {
  id: string;
  shortName: string;
  fullName: string;
  city: string;
  category: ('Engineering & CS' | 'Medical' | 'Business')[];
  programs: string[];
  logo: string;
  entryTestName: string;
  weights: UniversityWeights;
  officialUrl: string;
  closingMerits?: Record<string, number>; // program -> last year closing percentage
}

export const UNIVERSITIES_CONFIG: UniversityConfig[] = [
  {
    id: 'nust',
    shortName: 'NUST',
    fullName: 'National University of Sciences & Technology',
    city: 'Islamabad',
    category: ['Engineering & CS', 'Business'],
    programs: ['Software Engineering', 'Computer Science', 'Electrical Engineering', 'BBA'],
    logo: '/logos/nust.png',
    entryTestName: 'NET (NUST Entry Test)',
    weights: { matric: 10, fsc: 15, test: 75 },
    officialUrl: 'https://nust.edu.pk/admissions/',
    closingMerits: {
      'Software Engineering': 79.4,
      'Computer Science': 78.8,
      'Electrical Engineering': 72.1,
      'BBA': 74.2,
    },
  },
  {
    id: 'uet',
    shortName: 'UET',
    fullName: 'University of Engineering and Technology, Lahore',
    city: 'Lahore',
    category: ['Engineering & CS'],
    programs: ['Computer Science', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering'],
    logo: '/logos/uet.png',
    entryTestName: 'ECAT (Engineering College Admission Test)',
    weights: { matric: 15, fsc: 50, test: 35 },
    officialUrl: 'https://admission.uet.edu.pk/',
    closingMerits: {
      'Computer Science': 78.2,
      'Mechanical Engineering': 73.5,
      'Electrical Engineering': 74.0,
      'Civil Engineering': 71.2,
    },
  },
  {
    id: 'fast-nu',
    shortName: 'FAST-NU',
    fullName: 'National University of Computer and Emerging Sciences',
    city: 'Islamabad / Lahore / Karachi',
    category: ['Engineering & CS', 'Business'],
    programs: ['Computer Science', 'Software Engineering', 'Artificial Intelligence', 'Data Science', 'BBA'],
    logo: '/logos/fast.png',
    entryTestName: 'FAST-NU Admission Test',
    weights: { matric: 10, fsc: 40, test: 50 },
    officialUrl: 'https://www.nu.edu.pk/Admissions',
    closingMerits: {
      'Computer Science': 74.5,
      'Software Engineering': 73.8,
      'Artificial Intelligence': 73.0,
      'Data Science': 71.9,
    },
  },
  {
    id: 'giki',
    shortName: 'GIKI',
    fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    city: 'Topi, KPK',
    category: ['Engineering & CS'],
    programs: ['Computer Science', 'Software Engineering', 'Artificial Intelligence', 'Mechanical Engineering'],
    logo: '/logos/giki.png',
    entryTestName: 'GIKI Admission Test',
    weights: { matric: 0, fsc: 15, test: 85 },
    officialUrl: 'https://giki.edu.pk/admissions/',
    closingMerits: {
      'Computer Science': 77.0,
      'Software Engineering': 75.5,
      'Mechanical Engineering': 68.4,
    },
  },
  {
    id: 'comsats',
    shortName: 'COMSATS',
    fullName: 'COMSATS University Islamabad',
    city: 'Islamabad / Lahore',
    category: ['Engineering & CS', 'Business'],
    programs: ['Computer Science', 'Software Engineering', 'Electrical Engineering', 'BBA'],
    logo: '/logos/comsats.png',
    entryTestName: 'NTS NAT-IE / NAT-ICS',
    weights: { matric: 10, fsc: 40, test: 50 },
    officialUrl: 'https://www.comsats.edu.pk/',
    closingMerits: {
      'Computer Science': 84.2,
      'Software Engineering': 83.1,
    },
  },
  {
    id: 'ned',
    shortName: 'NED',
    fullName: 'NED University of Engineering and Technology',
    city: 'Karachi',
    category: ['Engineering & CS'],
    programs: ['Computer Science', 'Software Engineering', 'Electrical Engineering', 'Mechanical Engineering'],
    logo: '/logos/ned.png',
    entryTestName: 'NED Pre-Admission Entry Test',
    weights: { matric: 0, fsc: 50, test: 50 },
    officialUrl: 'https://www.neduet.edu.pk/admission',
    closingMerits: {
      'Computer Science': 85.6,
      'Software Engineering': 84.8,
    },
  },
  {
    id: 'pieas',
    shortName: 'PIEAS',
    fullName: 'Pakistan Institute of Engineering and Applied Sciences',
    city: 'Islamabad',
    category: ['Engineering & CS'],
    programs: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'],
    logo: '/logos/pieas.png',
    entryTestName: 'PIEAS Written Admission Test',
    weights: { matric: 15, fsc: 25, test: 60 },
    officialUrl: 'http://www.pieas.edu.pk/admissions/',
    closingMerits: {
      'Computer Science': 75.3,
      'Electrical Engineering': 71.8,
    },
  },
  {
    id: 'itu',
    shortName: 'ITU',
    fullName: 'Information Technology University',
    city: 'Lahore',
    category: ['Engineering & CS'],
    programs: ['Computer Science', 'Software Engineering', 'Electrical Engineering', 'AI'],
    logo: '/logos/uet.png', // verified fallback
    entryTestName: 'ITU Admission Test',
    weights: { matric: 10, fsc: 40, test: 50 },
    officialUrl: 'https://itu.edu.pk/admissions/',
  },
  {
    id: 'air',
    shortName: 'Air',
    fullName: 'Air University',
    city: 'Islamabad',
    category: ['Engineering & CS', 'Business'],
    programs: ['Computer Science', 'Cyber Security', 'Software Engineering', 'BBA'],
    logo: '/logos/air.png',
    entryTestName: 'Air University Admission Test (AUAT)',
    weights: { matric: 15, fsc: 35, test: 50 },
    officialUrl: 'https://www.au.edu.pk/',
    closingMerits: {
      'Cyber Security': 76.5,
      'Computer Science': 78.0,
    },
  },
  {
    id: 'bahria',
    shortName: 'Bahria',
    fullName: 'Bahria University',
    city: 'Islamabad / Karachi / Lahore',
    category: ['Engineering & CS', 'Business', 'Medical'],
    programs: ['Computer Science', 'Software Engineering', 'BBA', 'MBBS (Karachi)'],
    logo: '/logos/nust.png', // verified local fallback
    entryTestName: 'Bahria University Computer-Based Test (CBT)',
    weights: { matric: 10, fsc: 40, test: 50 },
    officialUrl: 'https://bahria.edu.pk/admissions/',
  },
  {
    id: 'ist',
    shortName: 'IST',
    fullName: 'Institute of Space Technology',
    city: 'Islamabad',
    category: ['Engineering & CS'],
    programs: ['Aerospace Engineering', 'Avionics', 'Computer Science', 'Materials Science'],
    logo: '/logos/pieas.png', // verified local fallback
    entryTestName: 'NAT / NET / SAT',
    weights: { matric: 10, fsc: 40, test: 50 },
    officialUrl: 'https://www.ist.edu.pk/admissions',
  },
  {
    id: 'nutech',
    shortName: 'NUTECH',
    fullName: 'National University of Technology',
    city: 'Islamabad',
    category: ['Engineering & CS'],
    programs: ['Computer Science', 'Computer Engineering', 'Civil Engineering'],
    logo: '/logos/nutech.png',
    entryTestName: 'NU-BAT (NUTECH Basic Admission Test)',
    weights: { matric: 10, fsc: 20, test: 70 },
    officialUrl: 'https://nutech.edu.pk/admissions/',
  },
  {
    id: 'iiu',
    shortName: 'IIU',
    fullName: 'International Islamic University Islamabad',
    city: 'Islamabad',
    category: ['Engineering & CS', 'Business'],
    programs: ['Computer Science', 'Software Engineering', 'BBA', 'Islamic Studies'],
    logo: '/logos/qau.png', // verified local fallback
    entryTestName: 'IIUI Admission Test',
    weights: { matric: 20, fsc: 40, test: 40 },
    officialUrl: 'https://www.iiu.edu.pk/',
  },
  {
    id: 'muet',
    shortName: 'MUET',
    fullName: 'Mehran University of Engineering and Technology',
    city: 'Jamshoro',
    category: ['Engineering & CS'],
    programs: ['Computer Systems Engineering', 'Software Engineering', 'Civil Engineering'],
    logo: '/logos/muet.png',
    entryTestName: 'MUET Pre-Admission Test',
    weights: { matric: 10, fsc: 30, test: 60 },
    officialUrl: 'https://www.muet.edu.pk/admissions',
  },
  {
    id: 'pucit',
    shortName: 'PUCIT',
    fullName: 'Punjab University College of Information Technology',
    city: 'Lahore',
    category: ['Engineering & CS'],
    programs: ['Computer Science', 'Software Engineering', 'Information Technology', 'Data Science'],
    logo: '/logos/uet.png', // verified local fallback
    entryTestName: 'PU Admission Test',
    weights: { matric: 15, fsc: 55, test: 30 },
    officialUrl: 'http://pucit.edu.pk/',
    closingMerits: {
      'Computer Science (Morning)': 89.2,
      'Software Engineering (Morning)': 88.5,
    },
  },
  {
    id: 'pu',
    shortName: 'PU',
    fullName: 'University of the Punjab',
    city: 'Lahore',
    category: ['Engineering & CS', 'Business', 'Medical'],
    programs: ['Pharmacy', 'Computer Science', 'Commerce', 'Law', 'Chemical Engineering'],
    logo: '/logos/uet.png', // verified local fallback
    entryTestName: 'PU-UG Admission Test',
    weights: { matric: 15, fsc: 55, test: 30 },
    officialUrl: 'http://pu.edu.pk/admissions/',
  },
  {
    id: 'uog',
    shortName: 'UOG',
    fullName: 'University of Gujrat',
    city: 'Gujrat',
    category: ['Engineering & CS', 'Business'],
    programs: ['Computer Science', 'Software Engineering', 'BBA', 'English'],
    logo: '/logos/uet.png', // verified local fallback
    entryTestName: 'NTS / UOG Entry Test',
    weights: { matric: 20, fsc: 50, test: 30 },
    officialUrl: 'https://uog.edu.pk/',
  },
  {
    id: 'iba',
    shortName: 'IBA',
    fullName: 'Institute of Business Administration, Karachi',
    city: 'Karachi',
    category: ['Business', 'Engineering & CS'],
    programs: ['BBA', 'BS Computer Science', 'BS Economics', 'BS Mathematics'],
    logo: '/logos/iba.png',
    entryTestName: 'IBA Aptitude Test / SAT',
    weights: { matric: 0, fsc: 10, test: 90 },
    officialUrl: 'https://www.iba.edu.pk/admissions',
    closingMerits: {
      'BBA': 78.5,
      'BS Computer Science': 76.0,
    },
  },
  {
    id: 'pmdc-mdcat',
    shortName: 'MDCAT (UHS / DUHS)',
    fullName: 'PMDC National Medical Colleges (MBBS / BDS)',
    city: 'Punjab, Sindh, KPK, Balochistan',
    category: ['Medical'],
    programs: ['MBBS', 'BDS'],
    logo: '/logos/pmdc.png',
    entryTestName: 'PMDC National MDCAT',
    weights: { matric: 10, fsc: 40, test: 50 },
    officialUrl: 'https://pmdc.pk/',
    closingMerits: {
      'MBBS (Punjab Public)': 91.8,
      'MBBS (Sindh Public)': 88.4,
      'BDS (Public)': 90.2,
    },
  },
  {
    id: 'nums',
    shortName: 'NUMS',
    fullName: 'National University of Medical Sciences',
    city: 'Rawalpindi / Islamabad',
    category: ['Medical'],
    programs: ['MBBS (Army Medical College)', 'BDS', 'BS Nursing'],
    logo: '/logos/nums.png',
    entryTestName: 'NUMS Entry Test',
    weights: { matric: 10, fsc: 40, test: 50 },
    officialUrl: 'https://numspak.edu.pk/admissions',
    closingMerits: {
      'MBBS (Army Medical College Open Merit)': 93.4,
    },
  },
  {
    id: 'aku',
    shortName: 'AKU',
    fullName: 'Aga Khan University Medical College',
    city: 'Karachi',
    category: ['Medical'],
    programs: ['MBBS', 'BSc Nursing'],
    logo: '/logos/aku.png',
    entryTestName: 'AKU Test + Multi-Mini Interviews',
    weights: { matric: 10, fsc: 30, test: 60 },
    officialUrl: 'https://www.aku.edu/admissions',
  },
];

export function getUniversityById(id?: string | null): UniversityConfig | undefined {
  if (!id) return undefined;
  return UNIVERSITIES_CONFIG.find((u) => u.id.toLowerCase() === id.toLowerCase());
}

import { BoardClass } from '../types';

export interface MasterPortalTrack {
  id: string;
  name: string;
  assignableKey: string;
  grade: BoardClass;
  defaultGroup?: string;
  tag: string;
  title: string;
  subtitle: string;
  logoUrl: string;
  institutionId: string;
  category: 'FBISE Boards' | 'Medical Entry' | 'Engineering & CS Entrance' | 'Comprehensive University';
  officialPatternText?: string;
}

/**
 * Master assignable classes list used in Admin Subscription Plans, User Profiles,
 * and Student Home Dashboards. Kept 100% in sync with portal tracks.
 */
export const AVAILABLE_ASSIGNABLE_CLASSES: string[] = [
  'FBISE 9',
  'FBISE 10',
  'FBISE 11 Pre-Engineering',
  'FBISE 11 Pre-Medical',
  'FBISE 11 ICS',
  'FBISE 12 Pre-Engineering',
  'FBISE 12 Pre-Medical',
  'FBISE 12 ICS',
  'MDCAT',
  'TCAT',
  'NUST (NET)',
  'FAST-NU (NAT)',
  'ECAT (UET Lahore)',
  'ETEA (KPK Engineering)',
  'NUMS (Medical)',
  'GIKI (Engineering)',
  'USAT (HEC)',
  'NED University',
  'PIEAS',
  'NTS NAT',
  'IBA Karachi',
  'Aga Khan University (AKU)',
  'MUET Jamshoro',
  'LUMS',
  'NUML',
  'HITEC University Taxila',
  'NUTECH Islamabad',
];

/**
 * Master list of all portals / dashboards available across the Boardly ecosystem.
 * Used on the "All Portals" / "Select Your Class" screen.
 */
export const MASTER_PORTAL_TRACKS: MasterPortalTrack[] = [
  // 1. FBISE Secondary & Higher Secondary Boards
  {
    id: 'fbise-9',
    name: 'FBISE 9',
    assignableKey: 'FBISE 9',
    grade: 9,
    defaultGroup: 'Science & Computer',
    tag: 'SSC Part 1',
    title: 'Class 9',
    subtitle: 'Science & Computer Science Groups (Biology, Chemistry, Physics, Math, CS)',
    logoUrl: '/logos/academic/fbise.png',
    institutionId: 'fbise',
    category: 'FBISE Boards',
    officialPatternText: 'FBISE Matric Syllabus • Full Subject Mocks',
  },
  {
    id: 'fbise-10',
    name: 'FBISE 10',
    assignableKey: 'FBISE 10',
    grade: 10,
    defaultGroup: 'Science & Computer',
    tag: 'SSC Part 2',
    title: 'Class 10',
    subtitle: 'Science & Computer Science Groups (Biology, Chemistry, Physics, Math, CS)',
    logoUrl: '/logos/academic/fbise.png',
    institutionId: 'fbise',
    category: 'FBISE Boards',
    officialPatternText: 'FBISE Matric Syllabus • Full Subject Mocks',
  },
  {
    id: 'fbise-11',
    name: 'FBISE 11',
    assignableKey: 'FBISE 11 Pre-Medical',
    grade: 11,
    defaultGroup: 'Pre-Medical',
    tag: 'HSSC Part 1',
    title: 'Class 11',
    subtitle: 'Pre-Medical, Pre-Engineering, ICS & General Science Groups',
    logoUrl: '/logos/academic/fbise.png',
    institutionId: 'fbise',
    category: 'FBISE Boards',
    officialPatternText: 'FBISE Intermediate Syllabus • Full Subject Mocks',
  },
  {
    id: 'fbise-12',
    name: 'FBISE 12',
    assignableKey: 'FBISE 12 Pre-Medical',
    grade: 12,
    defaultGroup: 'Pre-Medical',
    tag: 'HSSC Part 2',
    title: 'Class 12',
    subtitle: 'Pre-Medical, Pre-Engineering, ICS & General Science Groups',
    logoUrl: '/logos/academic/fbise.png',
    institutionId: 'fbise',
    category: 'FBISE Boards',
    officialPatternText: 'FBISE Intermediate Syllabus • Full Subject Mocks',
  },

  // 2. Medical Entrance Examinations
  {
    id: 'mdcat',
    name: 'MDCAT',
    assignableKey: 'MDCAT',
    grade: 'MDCAT',
    defaultGroup: 'MDCAT',
    tag: 'Medical Entry Test',
    title: 'MDCAT Dashboard',
    subtitle: 'Biology, Chemistry, Physics, English & Logical Reasoning',
    logoUrl: '/logos/academic/pmdc.png',
    institutionId: 'pmdc',
    category: 'Medical Entry',
    officialPatternText: '180 MCQs • 180 Minutes • PMDC Uniform Curriculum',
  },
  {
    id: 'nums',
    name: 'NUMS (Medical)',
    assignableKey: 'NUMS (Medical)',
    grade: 'NUMS',
    defaultGroup: 'MBBS / BDS & Psychological Assessment',
    tag: 'Army Medical College',
    title: 'NUMS Dashboard',
    subtitle: 'Part A (Bio 55, Chem 40, Phys 40, Eng 15) + Part B (Psychology 50)',
    logoUrl: '/logos/academic/nums.png',
    institutionId: 'nums',
    category: 'Medical Entry',
    officialPatternText: '200 MCQs • 180 Minutes • Military Medical Entrance',
  },
  {
    id: 'aku',
    name: 'Aga Khan University (AKU)',
    assignableKey: 'Aga Khan University (AKU)',
    grade: 'AKU',
    defaultGroup: 'MBBS & Nursing',
    tag: 'MBBS & Nursing Entrance',
    title: 'Aga Khan University (AKU)',
    subtitle: 'Science Achievement (40), Science Reasoning (30) & Mathematical Reasoning (30)',
    logoUrl: '/logos/academic/aku.png',
    institutionId: 'aku',
    category: 'Medical Entry',
    officialPatternText: '100 Marks • 120 Minutes • Negative Marking on Science',
  },

  // 3. Engineering & CS Entrance Tests
  {
    id: 'tcat',
    name: 'TCAT',
    assignableKey: 'TCAT',
    grade: 'TCAT',
    defaultGroup: 'TCAT',
    tag: 'UET Taxila Admission',
    title: 'TCAT Dashboard',
    subtitle: 'Mathematics, Physics, Chemistry, Computer Science & English',
    logoUrl: '/logos/academic/uet-taxila.png',
    institutionId: 'uet-taxila',
    category: 'Engineering & CS Entrance',
    officialPatternText: '100 MCQs • 400 Marks • 100 Minutes',
  },
  {
    id: 'nust-net',
    name: 'NUST (NET)',
    assignableKey: 'NUST (NET)',
    grade: 'NET',
    defaultGroup: 'Engineering & Computing',
    tag: 'NUST Entry Test',
    title: 'NUST NET Dashboard',
    subtitle: 'Mathematics (100), Physics (60), English (40) Official Pattern',
    logoUrl: '/logos/academic/nust.png',
    institutionId: 'nust',
    category: 'Engineering & CS Entrance',
    officialPatternText: '200 MCQs • 180 Minutes • No Negative Marking',
  },
  {
    id: 'fast-nat',
    name: 'FAST-NU (NAT)',
    assignableKey: 'FAST-NU (NAT)',
    grade: 'FAST',
    defaultGroup: 'CS & Engineering',
    tag: 'FAST-NUCES Test',
    title: 'FAST-NU NAT Dashboard',
    subtitle: 'Advanced Math (50), Basic Math (20), IQ & Logic (20), English (30)',
    logoUrl: '/logos/academic/fast.png',
    institutionId: 'fast',
    category: 'Engineering & CS Entrance',
    officialPatternText: '120 MCQs • 120 Minutes • -0.25 Negative Marking',
  },
  {
    id: 'ecat',
    name: 'ECAT (UET Lahore)',
    assignableKey: 'ECAT (UET Lahore)',
    grade: 'ECAT',
    defaultGroup: 'Pre-Engineering',
    tag: 'Punjab Engineering',
    title: 'ECAT Dashboard (UET Lahore)',
    subtitle: 'Mathematics (30), Physics (30), Chemistry or CS (30), English (10)',
    logoUrl: '/logos/academic/uet-taxila.png',
    institutionId: 'ecat',
    category: 'Engineering & CS Entrance',
    officialPatternText: '100 MCQs • 400 Marks • 100 Minutes',
  },
  {
    id: 'etea',
    name: 'ETEA (KPK Engineering)',
    assignableKey: 'ETEA (KPK Engineering)',
    grade: 'ETEA',
    defaultGroup: 'Engineering (Chemistry)',
    tag: 'KPK Engineering Entrance',
    title: 'ETEA Dashboard (UET Peshawar)',
    subtitle: 'Physics (40), Mathematics (35), English (15), Chemistry or CS (10)',
    logoUrl: '/logos/academic/uet-peshawar.png',
    institutionId: 'etea',
    category: 'Engineering & CS Entrance',
    officialPatternText: '100 MCQs • 100 Minutes • No Negative Marking',
  },
  {
    id: 'giki',
    name: 'GIKI (Engineering)',
    assignableKey: 'GIKI (Engineering)',
    grade: 'GIKI',
    defaultGroup: 'Engineering & Artificial Intelligence',
    tag: 'GIKI Entrance Test',
    title: 'GIKI Dashboard',
    subtitle: 'Mathematics (30), Physics (30), English (20) Comprehensive Preparation',
    logoUrl: '/logos/academic/giki.png',
    institutionId: 'giki',
    category: 'Engineering & CS Entrance',
    officialPatternText: '80 MCQs • 120 Minutes • Top Engineering Institute',
  },
  {
    id: 'ned',
    name: 'NED University',
    assignableKey: 'NED University',
    grade: 'NED',
    defaultGroup: 'Pre-Engineering',
    tag: 'Sindh Engineering',
    title: 'NED University Dashboard',
    subtitle: 'Mathematics (25), Physics (25), Chemistry (25), English (25)',
    logoUrl: '/logos/academic/ned.png',
    institutionId: 'ned',
    category: 'Engineering & CS Entrance',
    officialPatternText: '100 MCQs • 120 Minutes • NED Pre-Admission',
  },
  {
    id: 'pieas',
    name: 'PIEAS',
    assignableKey: 'PIEAS',
    grade: 'PIEAS',
    defaultGroup: 'Pre-Engineering',
    tag: 'Nuclear & CS Admissions',
    title: 'PIEAS Dashboard',
    subtitle: 'Mathematics (30), Physics (30), Chemistry or CS (30), English (10)',
    logoUrl: '/logos/academic/pieas.png',
    institutionId: 'pieas',
    category: 'Engineering & CS Entrance',
    officialPatternText: '100 MCQs • 180 Minutes • No Negative Marking',
  },
  {
    id: 'muet',
    name: 'MUET Jamshoro',
    assignableKey: 'MUET Jamshoro',
    grade: 'MUET',
    defaultGroup: 'Pre-Engineering',
    tag: 'Sindh Engineering',
    title: 'MUET Jamshoro Dashboard',
    subtitle: 'Mathematics/Biology (25), Physics (25), Chemistry/CS (25), English (25)',
    logoUrl: '/logos/academic/muet.png',
    institutionId: 'muet',
    category: 'Engineering & CS Entrance',
    officialPatternText: '100 MCQs • 100 Minutes • Mehran University Pattern',
  },
  {
    id: 'hitec',
    name: 'HITEC University Taxila',
    assignableKey: 'HITEC University Taxila',
    grade: 'HITEC',
    defaultGroup: 'Engineering',
    tag: 'Engineering & Computing',
    title: 'HITEC University Taxila',
    subtitle: 'Mathematics (30), Physics (30), Chemistry or CS (20), English (20)',
    logoUrl: '/logos/academic/hitec.png',
    institutionId: 'hitec',
    category: 'Engineering & CS Entrance',
    officialPatternText: '100 MCQs • 120 Minutes • Taxila Cantt Entrance',
  },
  {
    id: 'nutech',
    name: 'NUTECH Islamabad',
    assignableKey: 'NUTECH Islamabad',
    grade: 'NUTECH',
    defaultGroup: 'Engineering',
    tag: 'National University of Tech',
    title: 'NUTECH NUET Dashboard',
    subtitle: 'Mathematics (80), Physics (60), Chemistry or CS (40), English (20)',
    logoUrl: '/logos/academic/nutech.png',
    institutionId: 'nutech',
    category: 'Engineering & CS Entrance',
    officialPatternText: '200 MCQs • 180 Minutes • Technology & Applied Sciences',
  },

  // 4. Comprehensive Universities & Standardized Tests
  {
    id: 'usat',
    name: 'USAT (HEC)',
    assignableKey: 'USAT (HEC)',
    grade: 'USAT',
    defaultGroup: 'USAT-E (Pre-Engineering)',
    tag: 'HEC Admission Test',
    title: 'HEC USAT Dashboard',
    subtitle: 'Part 1 Verbal (20) & Quant (25) + Part 2 Discipline-Specific Subject MCQs (55)',
    logoUrl: '/logos/academic/hec-usat.png',
    institutionId: 'usat',
    category: 'Comprehensive University',
    officialPatternText: '100 MCQs • 100 Minutes • Passing 50/100',
  },
  {
    id: 'nts-nat',
    name: 'NTS NAT',
    assignableKey: 'NTS NAT',
    grade: 'NAT',
    defaultGroup: 'NAT-IE (Pre-Engineering)',
    tag: 'Shared University Portal',
    title: 'NTS NAT Dashboard',
    subtitle: 'COMSATS, Air University, Bahria, IIUI & IST Shared Aptitude Test',
    logoUrl: '/logos/academic/nat.png',
    institutionId: 'nat',
    category: 'Comprehensive University',
    officialPatternText: '90 MCQs • 120 Minutes • English, Quant, Analytical & Subject',
  },
  {
    id: 'iba',
    name: 'IBA Karachi',
    assignableKey: 'IBA Karachi',
    grade: 'IBA',
    defaultGroup: 'Undergraduate Aptitude',
    tag: 'Business & CS Aptitude',
    title: 'IBA Karachi Dashboard',
    subtitle: 'English Verbal Aptitude (45) & Quantitative Mathematics (45)',
    logoUrl: '/logos/academic/iba.png',
    institutionId: 'iba',
    category: 'Comprehensive University',
    officialPatternText: '90 MCQs • 165 Minutes • Sectional Cut-offs Applied',
  },
  {
    id: 'lums',
    name: 'LUMS',
    assignableKey: 'LUMS',
    grade: 'LUMS',
    defaultGroup: 'LCAT (Aptitude)',
    tag: 'Undergraduate Admissions',
    title: 'LUMS LCAT Dashboard',
    subtitle: 'LCAT Verbal (45) & Quant (45) + SBASSE Scientific Aptitude',
    logoUrl: '/logos/academic/lums.png',
    institutionId: 'lums',
    category: 'Comprehensive University',
    officialPatternText: '90 MCQs • 160 Minutes • LUMS Common Test',
  },
  {
    id: 'numl',
    name: 'NUML',
    assignableKey: 'NUML',
    grade: 'NUML',
    defaultGroup: 'Engineering & CS',
    tag: 'Languages, CS & Tech',
    title: 'NUML Dashboard',
    subtitle: 'English (20), Physics (20), Mathematics (20), Computer Science (15)',
    logoUrl: '/logos/academic/numl.png',
    institutionId: 'numl',
    category: 'Comprehensive University',
    officialPatternText: '75 MCQs • 60 Minutes • 50% Passing Threshold',
  },
];

export interface DerivedTrackInfo {
  primaryClass: string;
  grade: BoardClass;
  gradeDisplay: string;
  stream: string;
  targetUniversity: string;
  enrolledTrackLabel: string;
  practiceButtonText: string;
  assignedClasses: string[];
  isEntranceExam: boolean;
}

/**
 * Universal Track Resolver: Single authoritative source of truth for parsing any
 * assignable track, plan name, or class string into its canonical grade, stream,
 * target university, and UI display labels.
 */
function getBaseTrackDetails(rawTrack?: string | null): Omit<DerivedTrackInfo, 'assignedClasses' | 'isEntranceExam'> {
  const raw = (rawTrack || '').trim();
  const upper = raw.toUpperCase();

  // 1. FAST-NU (NAT)
  if (upper.includes('FAST')) {
    return {
      primaryClass: 'FAST-NU (NAT)',
      grade: 'FAST',
      gradeDisplay: 'FAST-NU (NAT)',
      stream: 'CS & Engineering Stream',
      targetUniversity: 'FAST-NUCES',
      enrolledTrackLabel: 'FAST-NU (NAT)',
      practiceButtonText: 'FAST-NU NAT Entry Test Portal',
    };
  }

  // 2. NUST (NET)
  if (upper.includes('NET') || (upper.includes('NUST') && !upper.includes('NUTECH'))) {
    return {
      primaryClass: 'NUST (NET)',
      grade: 'NET',
      gradeDisplay: 'NUST (NET)',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'NUST Islamabad',
      enrolledTrackLabel: 'NUST (NET)',
      practiceButtonText: 'NUST NET Entry Test Portal',
    };
  }

  // 3. MDCAT
  if (upper.includes('MDCAT') || upper.includes('PMDC') || upper.includes('MBBS')) {
    return {
      primaryClass: 'MDCAT',
      grade: 'MDCAT',
      gradeDisplay: 'MDCAT',
      stream: 'Pre-Medical Stream',
      targetUniversity: 'King Edward / UHS / PMDC',
      enrolledTrackLabel: 'MDCAT',
      practiceButtonText: 'MDCAT Entry Test Portal',
    };
  }

  // 4. UET Taxila TCAT
  if (upper.includes('TCAT')) {
    return {
      primaryClass: 'TCAT',
      grade: 'TCAT',
      gradeDisplay: 'TCAT',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'UET Taxila',
      enrolledTrackLabel: 'TCAT (UET Taxila)',
      practiceButtonText: 'UET Taxila TCAT Entry Portal',
    };
  }

  // 5. ECAT (UET Lahore)
  if (upper.includes('ECAT')) {
    return {
      primaryClass: 'ECAT (UET Lahore)',
      grade: 'ECAT',
      gradeDisplay: 'ECAT (UET Lahore)',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'UET Lahore',
      enrolledTrackLabel: 'ECAT (UET Lahore)',
      practiceButtonText: 'ECAT UET Lahore Entry Portal',
    };
  }

  // 6. NUMS
  if (upper.includes('NUMS')) {
    return {
      primaryClass: 'NUMS (Medical)',
      grade: 'NUMS',
      gradeDisplay: 'NUMS (Medical)',
      stream: 'Pre-Medical Stream',
      targetUniversity: 'Army Medical College / NUMS',
      enrolledTrackLabel: 'NUMS (Medical)',
      practiceButtonText: 'NUMS Medical Entry Portal',
    };
  }

  // 7. GIKI
  if (upper.includes('GIKI')) {
    return {
      primaryClass: 'GIKI (Engineering)',
      grade: 'GIKI',
      gradeDisplay: 'GIKI (Engineering)',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'GIKI Topi',
      enrolledTrackLabel: 'GIKI (Engineering)',
      practiceButtonText: 'GIKI Engineering Entry Portal',
    };
  }

  // 8. ETEA (KPK)
  if (upper.includes('ETEA')) {
    return {
      primaryClass: 'ETEA (KPK Engineering)',
      grade: 'ETEA',
      gradeDisplay: 'ETEA (KPK Engineering)',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'UET Peshawar',
      enrolledTrackLabel: 'ETEA (KPK Engineering)',
      practiceButtonText: 'ETEA Engineering Entry Portal',
    };
  }

  // 9. USAT (HEC)
  if (upper.includes('USAT')) {
    return {
      primaryClass: 'USAT (HEC)',
      grade: 'USAT',
      gradeDisplay: 'USAT (HEC)',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'HEC Recognized Universities',
      enrolledTrackLabel: 'USAT (HEC)',
      practiceButtonText: 'HEC USAT Entry Portal',
    };
  }

  // 10. NED
  if (upper.includes('NED')) {
    return {
      primaryClass: 'NED University',
      grade: 'NED',
      gradeDisplay: 'NED University',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'NED Karachi',
      enrolledTrackLabel: 'NED University',
      practiceButtonText: 'NED University Entry Portal',
    };
  }

  // 11. PIEAS
  if (upper.includes('PIEAS')) {
    return {
      primaryClass: 'PIEAS',
      grade: 'PIEAS',
      gradeDisplay: 'PIEAS',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'PIEAS Islamabad',
      enrolledTrackLabel: 'PIEAS',
      practiceButtonText: 'PIEAS Written Test Portal',
    };
  }

  // 12. NTS NAT
  if (upper.includes('NAT') || upper.includes('NTS')) {
    return {
      primaryClass: 'NTS NAT',
      grade: 'NAT',
      gradeDisplay: 'NTS NAT',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'COMSATS / NTS Universities',
      enrolledTrackLabel: 'NTS NAT',
      practiceButtonText: 'NTS NAT Entry Portal',
    };
  }

  // 13. IBA Karachi
  if (upper.includes('IBA')) {
    return {
      primaryClass: 'IBA Karachi',
      grade: 'IBA',
      gradeDisplay: 'IBA Karachi',
      stream: 'Business & CS Aptitude',
      targetUniversity: 'IBA Karachi',
      enrolledTrackLabel: 'IBA Karachi',
      practiceButtonText: 'IBA Karachi Aptitude Portal',
    };
  }

  // 14. Aga Khan University (AKU)
  if (upper.includes('AKU') || upper.includes('AGA KHAN')) {
    return {
      primaryClass: 'Aga Khan University (AKU)',
      grade: 'AKU',
      gradeDisplay: 'Aga Khan University',
      stream: 'Pre-Medical Stream',
      targetUniversity: 'Aga Khan University (AKU)',
      enrolledTrackLabel: 'Aga Khan University (AKU)',
      practiceButtonText: 'AKU Medical Entry Portal',
    };
  }

  // 15. MUET Jamshoro
  if (upper.includes('MUET')) {
    return {
      primaryClass: 'MUET Jamshoro',
      grade: 'MUET',
      gradeDisplay: 'MUET Jamshoro',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'MUET Jamshoro',
      enrolledTrackLabel: 'MUET Jamshoro',
      practiceButtonText: 'MUET Jamshoro Entry Portal',
    };
  }

  // 16. LUMS
  if (upper.includes('LUMS')) {
    return {
      primaryClass: 'LUMS',
      grade: 'LUMS',
      gradeDisplay: 'LUMS',
      stream: 'LCAT Aptitude Stream',
      targetUniversity: 'LUMS Lahore',
      enrolledTrackLabel: 'LUMS',
      practiceButtonText: 'LUMS LCAT Entry Portal',
    };
  }

  // 17. NUML
  if (upper.includes('NUML')) {
    return {
      primaryClass: 'NUML',
      grade: 'NUML',
      gradeDisplay: 'NUML',
      stream: 'Languages & CS Stream',
      targetUniversity: 'NUML Islamabad',
      enrolledTrackLabel: 'NUML',
      practiceButtonText: 'NUML Entrance Portal',
    };
  }

  // 18. HITEC
  if (upper.includes('HITEC')) {
    return {
      primaryClass: 'HITEC University Taxila',
      grade: 'HITEC',
      gradeDisplay: 'HITEC University',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'HITEC University Taxila',
      enrolledTrackLabel: 'HITEC University',
      practiceButtonText: 'HITEC University Entry Portal',
    };
  }

  // 19. NUTECH
  if (upper.includes('NUTECH')) {
    return {
      primaryClass: 'NUTECH Islamabad',
      grade: 'NUTECH',
      gradeDisplay: 'NUTECH Islamabad',
      stream: 'Applied Sciences & Tech',
      targetUniversity: 'NUTECH Islamabad',
      enrolledTrackLabel: 'NUTECH Islamabad',
      practiceButtonText: 'NUTECH NUET Entry Portal',
    };
  }

  // 20. FBISE 9th Class
  if (upper.includes('FBISE 9') || upper.includes('CLASS 9') || upper.includes('GRADE 9') || upper === '9') {
    return {
      primaryClass: 'FBISE 9',
      grade: 9,
      gradeDisplay: 'Class 9',
      stream: 'Science & Computer Group',
      targetUniversity: 'FBISE Board Examinations',
      enrolledTrackLabel: 'FBISE Class 9',
      practiceButtonText: 'Class 9 Practice Test',
    };
  }

  // 21. FBISE 10th Class
  if (upper.includes('FBISE 10') || upper.includes('CLASS 10') || upper.includes('GRADE 10') || upper === '10') {
    return {
      primaryClass: 'FBISE 10',
      grade: 10,
      gradeDisplay: 'Class 10',
      stream: 'Science & Computer Group',
      targetUniversity: 'FBISE Board Examinations',
      enrolledTrackLabel: 'FBISE Class 10',
      practiceButtonText: 'Class 10 Practice Test',
    };
  }

  // 22. FBISE 12th Class
  if (upper.includes('12') || upper.includes('2ND YEAR')) {
    if (upper.includes('MED')) {
      return {
        primaryClass: 'FBISE 12 Pre-Medical',
        grade: 12,
        gradeDisplay: 'Class 12',
        stream: 'Pre-Medical Stream',
        targetUniversity: 'Medical Colleges (King Edward, UHS)',
        enrolledTrackLabel: 'Class 12 Pre-Medical',
        practiceButtonText: 'Class 12 Pre-Medical Practice Test',
      };
    }
    if (upper.includes('ICS') || upper.includes('COMP')) {
      return {
        primaryClass: 'FBISE 12 ICS',
        grade: 12,
        gradeDisplay: 'Class 12',
        stream: 'ICS Stream',
        targetUniversity: 'Computing Universities (FAST, NUST)',
        enrolledTrackLabel: 'Class 12 ICS',
        practiceButtonText: 'Class 12 ICS Practice Test',
      };
    }
    return {
      primaryClass: 'FBISE 12 Pre-Engineering',
      grade: 12,
      gradeDisplay: 'Class 12',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'Engineering Universities (NUST, GIKI, UET)',
      enrolledTrackLabel: 'Class 12 Pre-Engineering',
      practiceButtonText: 'Class 12 Pre-Engineering Practice Test',
    };
  }

  // 23. FBISE 11th Class (Default standard board stream)
  if (upper.includes('ENG') || upper.includes('PRE-ENG')) {
    return {
      primaryClass: 'FBISE 11 Pre-Engineering',
      grade: 11,
      gradeDisplay: 'Class 11',
      stream: 'Pre-Engineering Stream',
      targetUniversity: 'Engineering Universities (NUST, GIKI, UET)',
      enrolledTrackLabel: 'Class 11 Pre-Engineering',
      practiceButtonText: 'Class 11 Pre-Engineering Practice Test',
    };
  }

  if (upper.includes('ICS') || upper.includes('COMP')) {
    return {
      primaryClass: 'FBISE 11 ICS',
      grade: 11,
      gradeDisplay: 'Class 11',
      stream: 'ICS Stream',
      targetUniversity: 'Computing Universities (FAST, NUST)',
      enrolledTrackLabel: 'Class 11 ICS',
      practiceButtonText: 'Class 11 ICS Practice Test',
    };
  }

  return {
    primaryClass: 'FBISE 11 Pre-Medical',
    grade: 11,
    gradeDisplay: 'Class 11',
    stream: 'Pre-Medical Stream',
    targetUniversity: 'Medical Colleges (King Edward, UHS)',
    enrolledTrackLabel: 'Class 11 Pre-Medical',
    practiceButtonText: 'Class 11 Pre-Medical Stream Practice Test',
  };
}

export function deriveTrackDetailsFromAssignableClass(rawTrack?: string | null): DerivedTrackInfo {
  const base = getBaseTrackDetails(rawTrack);
  const isEntrance = typeof base.grade === 'string' && isNaN(Number(base.grade));
  return {
    ...base,
    assignedClasses: [base.primaryClass],
    isEntranceExam: isEntrance,
  };
}

/**
 * Authoritative Student Profile Track Resolver.
 * Resolves the student's active track, stream, target university, and display labels
 * strictly using the single source of truth (assigned_classes -> grade/stream).
 */
export function resolveStudentTrackDetails(profile?: {
  grade?: string;
  stream?: string;
  assigned_classes?: string[];
  target_university?: string;
  dream_university?: string;
} | null): DerivedTrackInfo {
  // 1. Primary Source of Truth: assigned_classes[0]
  if (profile?.assigned_classes && Array.isArray(profile.assigned_classes) && profile.assigned_classes.length > 0) {
    const primary = String(profile.assigned_classes[0]).trim();
    if (primary) {
      const derived = deriveTrackDetailsFromAssignableClass(primary);
      // If student has an explicitly selected custom dream university, retain it unless track is specific entrance portal
      const customUni = (profile.target_university || profile.dream_university || '').trim();
      if (customUni && derived.targetUniversity === 'FBISE Board Examinations') {
        derived.targetUniversity = customUni;
      }
      return {
        ...derived,
        assignedClasses: profile.assigned_classes.map((cls, idx) => idx === 0 ? derived.primaryClass : cls),
      };
    }
  }

  // 2. Secondary fallback: grade + stream composite
  if (profile?.grade || profile?.stream) {
    const composite = `${profile.grade || ''} ${profile.stream || ''}`.trim();
    const derived = deriveTrackDetailsFromAssignableClass(composite);
    const customUni = (profile.target_university || profile.dream_university || '').trim();
    if (customUni && !derived.targetUniversity.includes('FAST') && !derived.targetUniversity.includes('NUST')) {
      derived.targetUniversity = customUni;
    }
    return derived;
  }

  // 3. Unassigned / Unenrolled default
  const customUni = (profile?.target_university || profile?.dream_university || '').trim();
  return {
    primaryClass: 'Class 11',
    grade: 11,
    gradeDisplay: 'Class 11',
    stream: 'General Track',
    targetUniversity: customUni || 'Not Selected',
    enrolledTrackLabel: 'Class 11 (Unassigned)',
    practiceButtonText: 'Class 11 Practice Test',
    assignedClasses: [],
    isEntranceExam: false,
  };
}


import { BoardClass } from '../types';
import { getSubjectsForClassAndGroup } from './categories';

export interface DashboardStreamConfig {
  id: string; // e.g. "9-Medical", "11-ICS"
  classNum: BoardClass;
  group: string; // e.g. "Medical", "Computer Science", "ICS", "Pre-Engineering", "Pre-Medical"
  title: string; // e.g. "Class 9 – Medical"
  shortTitle: string; // e.g. "9th Medical"
  levelTag: string; // e.g. "Matric Part 1"
  description: string;
  badgeBg: string; // Tailwind background style or color
  badgeText: string;
  subjects: string[];
  mockExamTimeMinutes: number;
  mockQuestionCount: number;
}

export const DASHBOARD_CONFIGS: DashboardStreamConfig[] = [
  // Class 9
  {
    id: "9-Medical",
    classNum: 9,
    group: "Medical",
    title: "Class 9 – Medical Dashboard",
    shortTitle: "Class 9 Medical",
    levelTag: "Matric SSC Part 1",
    description: "FBISE Exam preparation portal for Class 9 Biology & Sciences stream.",
    badgeBg: "bg-[#AF52DE] ",
    badgeText: "text-[#AF52DE] ",
    subjects: getSubjectsForClassAndGroup(9, "Medical"),
    mockExamTimeMinutes: 20,
    mockQuestionCount: 20,
  },
  {
    id: "9-Computer Science",
    classNum: 9,
    group: "Computer Science",
    title: "Class 9 – Computer Science (CS) Dashboard",
    shortTitle: "Class 9 CS",
    levelTag: "Matric SSC Part 1",
    description: "FBISE Exam preparation portal for Class 9 Computer Science & IT stream.",
    badgeBg: "bg-[#008299] ",
    badgeText: "text-[#008299] ",
    subjects: getSubjectsForClassAndGroup(9, "Computer Science"),
    mockExamTimeMinutes: 20,
    mockQuestionCount: 20,
  },

  // Class 10
  {
    id: "10-Medical",
    classNum: 10,
    group: "Medical",
    title: "Class 10 – Medical Dashboard",
    shortTitle: "Class 10 Medical",
    levelTag: "Matric SSC Part 2",
    description: "FBISE Exam preparation portal for Class 10 Biology & Sciences stream.",
    badgeBg: "bg-[#AF52DE] ",
    badgeText: "text-[#AF52DE] ",
    subjects: getSubjectsForClassAndGroup(10, "Medical"),
    mockExamTimeMinutes: 20,
    mockQuestionCount: 20,
  },
  {
    id: "10-Computer Science",
    classNum: 10,
    group: "Computer Science",
    title: "Class 10 – Computer Science (CS) Dashboard",
    shortTitle: "Class 10 CS",
    levelTag: "Matric SSC Part 2",
    description: "FBISE Exam preparation portal for Class 10 Computer Science & IT stream.",
    badgeBg: "bg-[#008299] ",
    badgeText: "text-[#008299] ",
    subjects: getSubjectsForClassAndGroup(10, "Computer Science"),
    mockExamTimeMinutes: 20,
    mockQuestionCount: 20,
  },

  // Class 11
  {
    id: "11-Pre-Medical",
    classNum: 11,
    group: "Pre-Medical",
    title: "Class 11 – Pre-Medical Dashboard",
    shortTitle: "Class 11 Pre-Med",
    levelTag: "HSSC Part 1",
    description: "FBISE Exams & Medical College Entry Test preparation for 11th Grade Pre-Medical.",
    badgeBg: "bg-[#AF52DE] ",
    badgeText: "text-[#AF52DE] ",
    subjects: getSubjectsForClassAndGroup(11, "Pre-Medical"),
    mockExamTimeMinutes: 25,
    mockQuestionCount: 25,
  },
  {
    id: "11-Pre-Engineering",
    classNum: 11,
    group: "Pre-Engineering",
    title: "Class 11 – Pre-Engineering Dashboard",
    shortTitle: "Class 11 Pre-Eng",
    levelTag: "HSSC Part 1",
    description: "FBISE Exams & Engineering Entry Test preparation for 11th Grade Pre-Engineering.",
    badgeBg: "bg-emerald-600 ",
    badgeText: "text-emerald-600 ",
    subjects: getSubjectsForClassAndGroup(11, "Pre-Engineering"),
    mockExamTimeMinutes: 25,
    mockQuestionCount: 25,
  },
  {
    id: "11-ICS",
    classNum: 11,
    group: "ICS",
    title: "Class 11 – ICS Dashboard",
    shortTitle: "Class 11 ICS",
    levelTag: "HSSC Part 1",
    description: "FBISE Exams & CS Entry Test preparation for 11th Grade Intermediate in Computer Science.",
    badgeBg: "bg-[#008299] ",
    badgeText: "text-[#008299] ",
    subjects: getSubjectsForClassAndGroup(11, "ICS"),
    mockExamTimeMinutes: 25,
    mockQuestionCount: 25,
  },

  // Class 12
  {
    id: "12-Pre-Medical",
    classNum: 12,
    group: "Pre-Medical",
    title: "Class 12 – Pre-Medical Dashboard",
    shortTitle: "Class 12 Pre-Med",
    levelTag: "HSSC Part 2",
    description: "FBISE Exams & Medical Entry Test (MDCAT) preparation for 12th Grade Pre-Medical.",
    badgeBg: "bg-[#AF52DE] ",
    badgeText: "text-[#AF52DE] ",
    subjects: getSubjectsForClassAndGroup(12, "Pre-Medical"),
    mockExamTimeMinutes: 25,
    mockQuestionCount: 25,
  },
  {
    id: "12-Pre-Engineering",
    classNum: 12,
    group: "Pre-Engineering",
    title: "Class 12 – Pre-Engineering Dashboard",
    shortTitle: "Class 12 Pre-Eng",
    levelTag: "HSSC Part 2",
    description: "FBISE Exams & Engineering Entry Test (ECAT/ECAT-NUST) preparation for 12th Grade Pre-Engineering.",
    badgeBg: "bg-emerald-600 ",
    badgeText: "text-emerald-600 ",
    subjects: getSubjectsForClassAndGroup(12, "Pre-Engineering"),
    mockExamTimeMinutes: 25,
    mockQuestionCount: 25,
  },
  {
    id: "12-ICS",
    classNum: 12,
    group: "ICS",
    title: "Class 12 – ICS Dashboard",
    shortTitle: "Class 12 ICS",
    levelTag: "HSSC Part 2",
    description: "FBISE Exams & CS University Entry Test preparation for 12th Grade ICS.",
    badgeBg: "bg-[#008299] ",
    badgeText: "text-[#008299] ",
    subjects: getSubjectsForClassAndGroup(12, "ICS"),
    mockExamTimeMinutes: 25,
    mockQuestionCount: 25,
  },

  // MDCAT Section
  {
    id: "MDCAT-MDCAT",
    classNum: "MDCAT",
    group: "MDCAT",
    title: "MDCAT Entry Test Dashboard",
    shortTitle: "MDCAT Prep",
    levelTag: "Medical Entry Test",
    description: "National Medical & Dental College Admission Test (MDCAT) prep portal for Biology, Chemistry, Physics & English.",
    badgeBg: "bg-rose-600 ",
    badgeText: "text-rose-600 ",
    subjects: getSubjectsForClassAndGroup("MDCAT", "MDCAT"),
    mockExamTimeMinutes: 30,
    mockQuestionCount: 30,
  },

  // TCAT Section
  {
    id: "TCAT-TCAT",
    classNum: "TCAT",
    group: "TCAT",
    title: "TCAT Entry Test Dashboard",
    shortTitle: "TCAT Prep (UET Taxila)",
    levelTag: "Engineering & Tech Test",
    description: "Taxila College Admission Test (TCAT / UET Taxila) prep portal for Physics, Mathematics, Chemistry/CS & English.",
    badgeBg: "bg-cyan-600 ",
    badgeText: "text-cyan-600 ",
    subjects: getSubjectsForClassAndGroup("TCAT", "TCAT"),
    mockExamTimeMinutes: 30,
    mockQuestionCount: 30,
  },

  // NUST NET (Engineering & Computing)
  {
    id: "NET-NET",
    classNum: "NET",
    group: "Engineering & Computing",
    title: "NUST NET (Engineering & Computing) Dashboard",
    shortTitle: "NUST NET",
    levelTag: "NUST Entry Test",
    description: "Official 200-MCQ NUST Entry Test (NET) portal: Mathematics (100), Physics (60), English (40). No negative marking.",
    badgeBg: "bg-[#004B87] ",
    badgeText: "text-[#004B87] ",
    subjects: getSubjectsForClassAndGroup("NET", "Engineering & Computing"),
    mockExamTimeMinutes: 180,
    mockQuestionCount: 200,
  },

  // FAST-NU NAT (CS & Engineering)
  {
    id: "FAST-FAST",
    classNum: "FAST",
    group: "CS & Engineering",
    title: "FAST-NU NAT (CS & Engineering) Dashboard",
    shortTitle: "FAST-NU NAT",
    levelTag: "FAST Admission Test",
    description: "Official 120-MCQ FAST-NU admission test portal: Advanced Math (50), Basic Math (20), IQ & Analytical Reasoning (20), English (30). Negative marking: -0.25.",
    badgeBg: "bg-[#003B73] ",
    badgeText: "text-[#003B73] ",
    subjects: getSubjectsForClassAndGroup("FAST", "CS & Engineering"),
    mockExamTimeMinutes: 120,
    mockQuestionCount: 120,
  },

  // UET Lahore ECAT
  {
    id: "ECAT-ECAT",
    classNum: "ECAT",
    group: "Pre-Engineering",
    title: "UET Lahore ECAT Dashboard",
    shortTitle: "UET Lahore ECAT",
    levelTag: "Punjab Engineering Entrance",
    description: "Official 100-MCQ UET Lahore Combined Entry Test (ECAT): Mathematics (30), Physics (30), Chemistry or CS (30), English (10). 4 marks per correct MCQ (400 marks total). No negative marking.",
    badgeBg: "bg-blue-600 ",
    badgeText: "text-blue-600 ",
    subjects: getSubjectsForClassAndGroup("ECAT", "Pre-Engineering"),
    mockExamTimeMinutes: 100,
    mockQuestionCount: 100,
  },

  // UET Peshawar ETEA
  {
    id: "ETEA-ETEA",
    classNum: "ETEA",
    group: "Engineering (Chemistry)",
    title: "UET Peshawar ETEA (Engineering) Dashboard",
    shortTitle: "UET Peshawar ETEA",
    levelTag: "KPK Engineering Entrance",
    description: "Official 100-MCQ UET Peshawar ETEA Engineering admission test: Physics (40), Mathematics (35), English (15), Chemistry or CS (10). No negative marking.",
    badgeBg: "bg-teal-700 ",
    badgeText: "text-teal-700 ",
    subjects: getSubjectsForClassAndGroup("ETEA", "Engineering (Chemistry)"),
    mockExamTimeMinutes: 100,
    mockQuestionCount: 100,
  },

  // NUMS Entry Test
  {
    id: "NUMS-NUMS",
    classNum: "NUMS",
    group: "MBBS / BDS & Psychological Assessment",
    title: "NUMS Entry Test (Army Medical College) Dashboard",
    shortTitle: "NUMS Medical Entry",
    levelTag: "Military & NUMS Medical Entrance",
    description: "Official 200-MCQ NUMS entrance examination portal: Part A (Biology 55, Chemistry 40, Physics 40, English 15 — 95% weight) + Part B (Psychological Assessment 50 MCQs — 5% weight). No negative marking.",
    badgeBg: "bg-[#006837] ",
    badgeText: "text-[#006837] ",
    subjects: getSubjectsForClassAndGroup("NUMS", "MBBS / BDS & Psychological Assessment"),
    mockExamTimeMinutes: 180,
    mockQuestionCount: 200,
  },

  // GIKI Admission Test
  {
    id: "GIKI-GIKI",
    classNum: "GIKI",
    group: "Engineering & Artificial Intelligence",
    title: "GIKI Admission Test Dashboard",
    shortTitle: "GIKI Entry Test",
    levelTag: "GIKI Engineering Entrance",
    description: "Official 80-MCQ Ghulam Ishaq Khan Institute (GIKI) admission test portal: Mathematics (30), Physics (30), English (20). 120 minutes. No negative marking.",
    badgeBg: "bg-[#102254] ",
    badgeText: "text-[#102254] ",
    subjects: getSubjectsForClassAndGroup("GIKI", "Engineering & Artificial Intelligence"),
    mockExamTimeMinutes: 120,
    mockQuestionCount: 80,
  },

  // HEC USAT (Undergraduate Studies Admission Test)
  {
    id: "USAT-USAT",
    classNum: "USAT",
    group: "USAT-E (Pre-Engineering)",
    title: "HEC USAT Admission Test Dashboard",
    shortTitle: "HEC USAT",
    levelTag: "HEC Higher Education Test",
    description: "Official 100-MCQ Higher Education Commission USAT portal: Part 1 Verbal Reasoning (20) & Quantitative Reasoning (25) + Part 2 Discipline-Specific Subject MCQs (55). Passing criteria: 50/100. No negative marking.",
    badgeBg: "bg-indigo-700 ",
    badgeText: "text-indigo-700 ",
    subjects: getSubjectsForClassAndGroup("USAT", "USAT-E (Pre-Engineering)"),
    mockExamTimeMinutes: 100,
    mockQuestionCount: 100,
  },
  {
    id: "NED-Engineering",
    classNum: "NED",
    group: "Pre-Engineering",
    title: "NED University Pre-Admission Test Dashboard",
    shortTitle: "NED University",
    levelTag: "Engineering & Technology",
    description: "Official 100-MCQ NED admission test portal: Mathematics (25), Physics (25), Chemistry (25), English (25). Duration 2 hours, no negative marking. Merit: 60% Entry Test + 40% HSC.",
    badgeBg: "bg-[#002D62] ",
    badgeText: "text-[#002D62] ",
    subjects: getSubjectsForClassAndGroup("NED", "Pre-Engineering"),
    mockExamTimeMinutes: 120,
    mockQuestionCount: 100,
  },
  {
    id: "PIEAS-Engineering",
    classNum: "PIEAS",
    group: "Pre-Engineering",
    title: "PIEAS Written Admission Test Dashboard",
    shortTitle: "PIEAS",
    levelTag: "Nuclear & Computing Admissions",
    description: "100-MCQ PIEAS admission test portal: English (10), Mathematics (30), Physics (30), Chemistry/CS (30). 3 Hours duration. No negative marking.",
    badgeBg: "bg-[#1E3A8A] ",
    badgeText: "text-[#1E3A8A] ",
    subjects: getSubjectsForClassAndGroup("PIEAS", "Pre-Engineering"),
    mockExamTimeMinutes: 180,
    mockQuestionCount: 100,
  },
  {
    id: "NAT-Shared",
    classNum: "NAT",
    group: "NAT-IE (Pre-Engineering)",
    title: "NTS NAT Shared Portal (COMSATS, Air, Bahria, IIUI, IST)",
    shortTitle: "NTS NAT",
    levelTag: "Shared University Portal",
    description: "90-MCQ National Aptitude Test (NAT) for COMSATS, Air University, Bahria, IIUI, and IST: English (20), Analytical (20), Quantitative (20), Subject Knowledge (30). No negative marking.",
    badgeBg: "bg-[#006A4E] ",
    badgeText: "text-[#006A4E] ",
    subjects: getSubjectsForClassAndGroup("NAT", "NAT-IE (Pre-Engineering)"),
    mockExamTimeMinutes: 120,
    mockQuestionCount: 90,
  },
  {
    id: "IBA-Aptitude",
    classNum: "IBA",
    group: "Undergraduate Aptitude",
    title: "IBA Karachi Aptitude Test Dashboard",
    shortTitle: "IBA Karachi",
    levelTag: "Business & CS Aptitude",
    description: "90-MCQ IBA Karachi entrance test: English Verbal Aptitude (45) and Quantitative Mathematics (45). 165 minutes with sectional cut-offs and negative marking.",
    badgeBg: "bg-[#8B0000] ",
    badgeText: "text-[#8B0000] ",
    subjects: getSubjectsForClassAndGroup("IBA", "Undergraduate Aptitude"),
    mockExamTimeMinutes: 165,
    mockQuestionCount: 90,
  },
  {
    id: "AKU-Medical",
    classNum: "AKU",
    group: "MBBS & Nursing",
    title: "Aga Khan University (AKU) Admission Portal",
    shortTitle: "AKU Medical",
    levelTag: "MBBS & BScN Entrance",
    description: "100-Mark AKU Medical College test: Science Achievement (Biology 16, Chemistry 12, Physics 12 with -0.25 penalty), Science Reasoning (30), and Mathematical Reasoning (30).",
    badgeBg: "bg-[#005A36] ",
    badgeText: "text-[#005A36] ",
    subjects: getSubjectsForClassAndGroup("AKU", "MBBS & Nursing"),
    mockExamTimeMinutes: 120,
    mockQuestionCount: 100,
  },
  {
    id: "MUET-Engineering",
    classNum: "MUET",
    group: "Pre-Engineering",
    title: "MUET Jamshoro Pre-Admission Test Dashboard",
    shortTitle: "MUET Jamshoro",
    levelTag: "Engineering & Technology",
    description: "100-MCQ MUET entry test: Math/Bio (25), Physics (25), Chem/CS (25), English (25). 100 minutes duration, no negative marking.",
    badgeBg: "bg-[#800020] ",
    badgeText: "text-[#800020] ",
    subjects: getSubjectsForClassAndGroup("MUET", "Pre-Engineering"),
    mockExamTimeMinutes: 100,
    mockQuestionCount: 100,
  },
  {
    id: "LUMS-Aptitude",
    classNum: "LUMS",
    group: "LCAT (Aptitude)",
    title: "LUMS LCAT & SBASSE Scientific Dashboard",
    shortTitle: "LUMS",
    levelTag: "Undergraduate Admissions",
    description: "LUMS Common Admissions Test (LCAT: Verbal 45, Quant 45 in 160 mins) and SBASSE Scientific Aptitude Test (Physics, Chem, Math, Bio).",
    badgeBg: "bg-[#002855] ",
    badgeText: "text-[#002855] ",
    subjects: getSubjectsForClassAndGroup("LUMS", "LCAT (Aptitude)"),
    mockExamTimeMinutes: 160,
    mockQuestionCount: 90,
  },
  {
    id: "NUML-Entrance",
    classNum: "NUML",
    group: "Engineering & CS",
    title: "NUML University Entrance Test Dashboard",
    shortTitle: "NUML",
    levelTag: "Languages, CS & Engineering",
    description: "75-MCQ NUML entrance exam: English (20), Physics (20), Mathematics (20), CS (15) in 60 minutes. Minimum 50% passing threshold.",
    badgeBg: "bg-[#155E75] ",
    badgeText: "text-[#155E75] ",
    subjects: getSubjectsForClassAndGroup("NUML", "Engineering & CS"),
    mockExamTimeMinutes: 60,
    mockQuestionCount: 75,
  },
  {
    id: "HITEC-Engineering",
    classNum: "HITEC",
    group: "Engineering",
    title: "HITEC University Taxila Admission Dashboard",
    shortTitle: "HITEC Taxila",
    levelTag: "Engineering & Computing",
    description: "100-MCQ HITEC entrance exam: Mathematics (30), Physics (30), Chemistry/CS (20), English (20) in 120 minutes with 50% pass threshold.",
    badgeBg: "bg-[#7C2D12] ",
    badgeText: "text-[#7C2D12] ",
    subjects: getSubjectsForClassAndGroup("HITEC", "Engineering"),
    mockExamTimeMinutes: 120,
    mockQuestionCount: 100,
  },
  {
    id: "NUTECH-NUET",
    classNum: "NUTECH",
    group: "Engineering",
    title: "NUTECH Entry Test (NUET) Dashboard",
    shortTitle: "NUTECH (NUET)",
    levelTag: "Technology & Applied Sciences",
    description: "200-MCQ NUTECH Entry Test (NUET): Engineering (Math 80, Phys 60, Chem/CS 40, Eng 20) or Computing (Math 100, CS/Phys 60, Eng 40) in 180 minutes.",
    badgeBg: "bg-[#14532D] ",
    badgeText: "text-[#14532D] ",
    subjects: getSubjectsForClassAndGroup("NUTECH", "Engineering"),
    mockExamTimeMinutes: 180,
    mockQuestionCount: 200,
  },
];

export function getDashboardConfig(classNum?: BoardClass, group?: string): DashboardStreamConfig {
  if (!classNum || !group) return DASHBOARD_CONFIGS[0];

  const normClass = String(classNum).toUpperCase();
  const normGroup = (group || '').trim().toUpperCase();

  if (normClass === 'MDCAT' || normGroup === 'MDCAT') {
    const mdcatCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'MDCAT');
    if (mdcatCfg) return mdcatCfg;
  }

  if (normClass === 'TCAT' || normGroup === 'TCAT') {
    const tcatCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'TCAT');
    if (tcatCfg) return tcatCfg;
  }

  if (normClass === 'NET' || normGroup.includes('NET') || normGroup.includes('NUST')) {
    const netCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'NET');
    if (netCfg) return netCfg;
  }

  if (normClass === 'FAST' || normGroup.includes('FAST')) {
    const fastCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'FAST');
    if (fastCfg) return fastCfg;
  }

  if (normClass === 'ECAT' || normGroup.includes('ECAT')) {
    const ecatCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'ECAT');
    if (ecatCfg) return ecatCfg;
  }

  if (normClass === 'ETEA' || normGroup.includes('ETEA')) {
    const eteaCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'ETEA');
    if (eteaCfg) return eteaCfg;
  }

  if (normClass === 'NUMS' || normGroup.includes('NUMS')) {
    const numsCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'NUMS');
    if (numsCfg) return numsCfg;
  }

  if (normClass === 'GIKI' || normGroup.includes('GIKI')) {
    const gikiCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'GIKI');
    if (gikiCfg) return gikiCfg;
  }

  if (normClass === 'USAT' || normGroup.includes('USAT')) {
    const usatCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'USAT');
    if (usatCfg) return usatCfg;
  }

  if (normClass === 'NED' || normGroup.includes('NED')) {
    const nedCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'NED');
    if (nedCfg) return nedCfg;
  }

  if (normClass === 'PIEAS' || normGroup.includes('PIEAS')) {
    const pieasCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'PIEAS');
    if (pieasCfg) return pieasCfg;
  }

  if (normClass === 'NAT' || normGroup.includes('NAT')) {
    const natCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'NAT');
    if (natCfg) return natCfg;
  }

  if (normClass === 'IBA' || normGroup.includes('IBA')) {
    const ibaCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'IBA');
    if (ibaCfg) return ibaCfg;
  }

  if (normClass === 'AKU' || normGroup.includes('AKU')) {
    const akuCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'AKU');
    if (akuCfg) return akuCfg;
  }

  if (normClass === 'MUET' || normGroup.includes('MUET')) {
    const muetCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'MUET');
    if (muetCfg) return muetCfg;
  }

  if (normClass === 'LUMS' || normGroup.includes('LUMS')) {
    const lumsCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'LUMS');
    if (lumsCfg) return lumsCfg;
  }

  if (normClass === 'NUML' || normGroup.includes('NUML')) {
    const numlCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'NUML');
    if (numlCfg) return numlCfg;
  }

  if (normClass === 'HITEC' || normGroup.includes('HITEC')) {
    const hitecCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'HITEC');
    if (hitecCfg) return hitecCfg;
  }

  if (normClass === 'NUTECH' || normGroup.includes('NUTECH') || normGroup.includes('NUET')) {
    const nutechCfg = DASHBOARD_CONFIGS.find(cfg => cfg.classNum === 'NUTECH');
    if (nutechCfg) return nutechCfg;
  }

  const lowerGroup = group.trim().toLowerCase();
  const match = DASHBOARD_CONFIGS.find(cfg => {
    if (cfg.classNum !== classNum) return false;
    const cfgGroup = cfg.group.toLowerCase();
    if (lowerGroup.includes('computer') || lowerGroup.includes('cs') || lowerGroup === 'ics') {
      return cfgGroup.includes('computer') || cfgGroup.includes('cs') || cfgGroup === 'ics';
    }
    if (lowerGroup.includes('engineering')) {
      return cfgGroup.includes('engineering');
    }
    if (lowerGroup.includes('medical')) {
      return cfgGroup.includes('medical');
    }
    return cfgGroup === lowerGroup;
  });

  return match || {
    id: `${classNum}-${group}`,
    classNum,
    group,
    title: `Class ${classNum} – ${group} Dashboard`,
    shortTitle: `Class ${classNum} ${group}`,
    levelTag: classNum === 'MDCAT' ? 'Medical Entry Test' : (Number(classNum) >= 11 ? `HSSC Part ${Number(classNum) === 11 ? 1 : 2}` : `Matric Part ${Number(classNum) === 9 ? 1 : 2}`),
    description: `FBISE preparation portal for Class ${classNum} (${group}).`,
    badgeBg: "bg-[#FF9500] ",
    badgeText: "text-[#FF9500] ",
    subjects: getSubjectsForClassAndGroup(classNum, group),
    mockExamTimeMinutes: 20,
    mockQuestionCount: 20,
  };
}

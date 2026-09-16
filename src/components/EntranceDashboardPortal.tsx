import React, { useState, useEffect } from 'react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Flame,
  FileText,
  Dna,
  FlaskConical,
  Brain,
  Layers,
  Award,
  ChevronRight,
  ChevronDown,
  Play,
  RotateCcw,
  BarChart3,
  HelpCircle,
  ShieldCheck,
  Calculator,
  Cpu,
  Check,
  Lock,
  AlertCircle,
  TrendingUp,
  Target,
} from 'lucide-react';
import { BoardClass, QuestionDifficulty, TestMode, HistoryItem } from '../types';
import { User, StudentProfile, isUserProOrPaid } from '../lib/supabase';
import { InstitutionBadge } from './InstitutionBadge';
import { BoardlyProBadge } from './BoardlyProBadge';

export type EntranceTrackType =
  | 'FBISE'
  | 'MDCAT'
  | 'TCAT'
  | 'NET'
  | 'FAST'
  | 'ECAT'
  | 'ETEA'
  | 'NUMS'
  | 'GIKI'
  | 'USAT'
  | 'NED'
  | 'PIEAS'
  | 'NAT'
  | 'IBA'
  | 'AKU'
  | 'MUET'
  | 'LUMS'
  | 'NUML'
  | 'HITEC'
  | 'NUTECH';

interface SectionDistribution {
  subject: string;
  mcqs: number;
  percentage: string;
  desc?: string;
}

interface EntranceTrackDetails {
  id: EntranceTrackType;
  fullName: string;
  institutionId: string;
  testName: string;
  badgeBg: string;
  badgeText: string;
  totalMcqs: number;
  totalTimeMinutes: number;
  negativeMarking: string;
  scoringScheme: string;
  sections: SectionDistribution[];
  hasElectiveGroup?: boolean;
  electiveGroups?: { id: string; label: string; electiveSubject: string; sections: SectionDistribution[] }[];
  overview: string;
  specialRules: string[];
}

export const ENTRANCE_TRACKS_DATA: Record<EntranceTrackType, EntranceTrackDetails> = {
  FBISE: {
    id: 'FBISE',
    fullName: 'Federal Board of Intermediate & Secondary Education (FBISE)',
    institutionId: 'fbise',
    testName: 'FBISE Board Examinations — Full-Length Grand Mock',
    badgeBg: 'bg-[#00703C]',
    badgeText: 'text-[#00703C]',
    totalMcqs: 85,
    totalTimeMinutes: 120,
    negativeMarking: 'No Negative Marking (0)',
    scoringScheme: '1 Mark per correct answer (Total: 85 Marks)',
    sections: [
      { subject: 'Mathematics', mcqs: 20, percentage: '24%', desc: 'Algebra, Geometry, Trigonometry, Calculus' },
      { subject: 'Physics', mcqs: 20, percentage: '24%', desc: 'Mechanics, Electromagnetism, Modern Physics' },
      { subject: 'Chemistry', mcqs: 20, percentage: '24%', desc: 'Physical, Inorganic & Organic Chemistry' },
      { subject: 'English', mcqs: 15, percentage: '18%', desc: 'Grammar, Comprehension, Vocabulary & Writing' },
      { subject: 'Biology / CS', mcqs: 10, percentage: '12%', desc: 'Cell Biology, Ecology or Computer Architecture' },
    ],
    overview: 'Official Federal Board (FBISE) examination curriculum. Full-length model mock papers and chapter-wise MCQs strictly aligned with National Curriculum standards and Student Learning Outcomes (SLOs).',
    specialRules: [
      'No negative marking for incorrect answers.',
      'Strictly aligned with FBISE Student Learning Outcomes (SLOs).',
      'Standardized board examination timing and question distribution.',
    ],
  },
  MDCAT: {
    id: 'MDCAT',
    fullName: 'Pakistan Medical & Dental Council (PMDC MDCAT)',
    institutionId: 'pmdc',
    testName: 'PMDC MDCAT — National Medical & Dental College Admission Test',
    badgeBg: 'bg-[#1E7B47]',
    badgeText: 'text-[#1E7B47]',
    totalMcqs: 180,
    totalTimeMinutes: 180,
    negativeMarking: 'No Negative Marking (0)',
    scoringScheme: '1 Mark per correct answer (Total: 180 Marks)',
    sections: [
      { subject: 'Biology', mcqs: 68, percentage: '38%', desc: 'Cell Structure, Genetics, Human Physiology, Evolution, Biodiversity' },
      { subject: 'Chemistry', mcqs: 54, percentage: '30%', desc: 'Physical Chemistry, Inorganic Chemistry, Organic Reaction Mechanisms' },
      { subject: 'Physics', mcqs: 36, percentage: '20%', desc: 'Mechanics, Thermodynamics, Electromagnetism, Nuclear & Modern Physics' },
      { subject: 'English', mcqs: 12, percentage: '7%', desc: 'Vocabulary in Context, Sentence Correction, Reading Comprehension' },
      { subject: 'Logical Reasoning', mcqs: 10, percentage: '5%', desc: 'Critical Thinking, Letter & Symbol Series, Logical Deductions' },
    ],
    overview: 'Official PMDC MDCAT uniform curriculum for MBBS and BDS admissions across all public and private medical colleges in Pakistan.',
    specialRules: [
      'No negative marking across any section.',
      'Unified PMDC syllabus covering UHS, DUHS, KMU, SZABMU, and BUMHS.',
      'Full-length 180-minute countdown simulation matching official hall protocol.',
    ],
  },
  TCAT: {
    id: 'TCAT',
    fullName: 'University of Engineering & Technology (UET Taxila TCAT)',
    institutionId: 'uet-taxila',
    testName: 'UET Taxila Combined Admission Test (TCAT)',
    badgeBg: 'bg-[#0891B2]',
    badgeText: 'text-[#0891B2]',
    totalMcqs: 100,
    totalTimeMinutes: 100,
    negativeMarking: 'No Negative Marking (0)',
    scoringScheme: '4 Marks per correct answer (Total: 400 Marks)',
    sections: [
      { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Calculus, Analytic Geometry, Trigonometry, Vectors' },
      { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Mechanics, Oscillations, Electromagnetism, Modern Physics' },
      { subject: 'Chemistry / Computer Science', mcqs: 30, percentage: '30%', desc: 'Physical/Organic Chemistry or Programming & Architecture' },
      { subject: 'English', mcqs: 10, percentage: '10%', desc: 'Grammar, Analytical Comprehension, Vocabulary' },
    ],
    overview: 'Comprehensive engineering and computing admission test for UET Taxila undergraduate degree programs in engineering, technology, and computer sciences.',
    specialRules: [
      '4 marks per correct answer, 0 marks for incorrect (400 total marks).',
      'Focus on rapid calculation and fundamental physics & math formulas.',
      'Simulated online computer-based testing interface.',
    ],
  },
  NET: {
    id: 'NET',
    fullName: 'National University of Sciences & Technology (NUST)',
    institutionId: 'nust',
    testName: 'NUST Entry Test (NET) — Engineering & Computing',
    badgeBg: 'bg-[#004B87]',
    badgeText: 'text-[#004B87]',
    totalMcqs: 200,
    totalTimeMinutes: 180,
    negativeMarking: 'No Negative Marking (0)',
    scoringScheme: '1 Mark per correct answer (Total: 200 Marks)',
    sections: [
      { subject: 'Mathematics', mcqs: 100, percentage: '50%', desc: 'Calculus, Algebra, Trigonometry, Vectors, Conic Sections' },
      { subject: 'Physics', mcqs: 60, percentage: '30%', desc: 'Mechanics, Electromagnetism, Modern Physics, Waves & Optics' },
      { subject: 'English', mcqs: 40, percentage: '20%', desc: 'SAT-style Vocabulary, Sentence Completion, Reading Comprehension' },
    ],
    overview: 'The official NUST NET Engineering & Computing test comprises exactly 200 multiple-choice questions administered over 180 minutes. No Chemistry, Biology, or Computer Science section exists in this stream.',
    specialRules: [
      'Strictly 200 MCQs: Mathematics 100, Physics 60, English 40.',
      'No negative marking — candidates should attempt every question.',
      'English follows the SAT-I pattern with critical reading and vocabulary.',
      'Calculators and electronic devices are strictly prohibited.'
    ]
  },
  FAST: {
    id: 'FAST',
    fullName: 'National University of Computer & Emerging Sciences (FAST-NUCES)',
    institutionId: 'fast',
    testName: 'FAST-NU Admission Test (NAT) — CS & Engineering',
    badgeBg: 'bg-[#003B73]',
    badgeText: 'text-[#003B73]',
    totalMcqs: 120,
    totalTimeMinutes: 120,
    negativeMarking: '-0.25 Marks per wrong answer',
    scoringScheme: '+1 for correct, -0.25 for incorrect (Total: 120 Marks)',
    sections: [
      { subject: 'Advanced Mathematics', mcqs: 50, percentage: '41.7%', desc: 'FSc Calculus, Matrices, Trigonometry, Analytic Geometry' },
      { subject: 'Basic Mathematics', mcqs: 20, percentage: '16.7%', desc: 'Arithmetic, Percentages, Ratios, Speed & Work, Averages' },
      { subject: 'IQ & Analytical Reasoning', mcqs: 20, percentage: '16.7%', desc: 'Series, Coding-Decoding, Blood Relations, Logical Deductions' },
      { subject: 'English', mcqs: 30, percentage: '25.0%', desc: 'Grammar, Analogies, Sentence Correction, Synonyms & Antonyms' },
    ],
    overview: 'The FAST-NU admission test consists of 120 MCQs over 120 minutes with a penalty of -0.25 marks for every incorrect answer. No Physics or Chemistry sections exist in this test.',
    specialRules: [
      'Strictly 120 MCQs: Advanced Math 50, Basic Math 20, IQ 20, English 30.',
      'Negative marking (-0.25) applies: guessing without elimination is penalized.',
      'No Physics or Chemistry sections — focus entirely on Math, Logic & English.',
      'Speed and analytical accuracy are critical for qualifying FAST campuses.'
    ]
  },
  ECAT: {
    id: 'ECAT',
    fullName: 'University of Engineering and Technology (UET Lahore)',
    institutionId: 'ecat',
    testName: 'UET Combined Entry Test (ECAT) — Punjab Engineering Entrance',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-blue-600',
    totalMcqs: 100,
    totalTimeMinutes: 100,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '4 Marks per correct answer (Total: 400 Marks)',
    hasElectiveGroup: true,
    electiveGroups: [
      {
        id: 'pre-engineering',
        label: 'Pre-Engineering Group (with Chemistry)',
        electiveSubject: 'Chemistry',
        sections: [
          { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Vectors, Calculus, Differentiation & Integration' },
          { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Kinematics, Thermodynamics, Electrostatics, Electromagnetism' },
          { subject: 'Chemistry', mcqs: 30, percentage: '30%', desc: 'Physical, Inorganic, and Organic Chemistry concepts' },
          { subject: 'English', mcqs: 10, percentage: '10%', desc: 'Vocabulary, Sentence Structure & Comprehension' }
        ]
      },
      {
        id: 'ics',
        label: 'ICS Group (with Computer Science)',
        electiveSubject: 'Computer Science',
        sections: [
          { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Vectors, Calculus, Differentiation & Integration' },
          { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Kinematics, Thermodynamics, Electrostatics, Electromagnetism' },
          { subject: 'Computer Science', mcqs: 30, percentage: '30%', desc: 'C/C++ Programming, Data Structures, Logic Gates, DB' },
          { subject: 'English', mcqs: 10, percentage: '10%', desc: 'Vocabulary, Sentence Structure & Comprehension' }
        ]
      }
    ],
    sections: [
      { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Vectors, Calculus, Differentiation & Integration' },
      { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Kinematics, Thermodynamics, Electrostatics, Electromagnetism' },
      { subject: 'Chemistry', mcqs: 30, percentage: '30%', desc: 'Or Computer Science (based on chosen group)' },
      { subject: 'English', mcqs: 10, percentage: '10%', desc: 'Vocabulary, Sentence Structure & Comprehension' }
    ],
    overview: 'UET Lahore ECAT is the central engineering entrance examination for public and private engineering universities across Punjab, featuring 100 MCQs for 400 total marks.',
    specialRules: [
      'Each correct answer yields +4 marks; total maximum score is 400.',
      'Students select either Chemistry or Computer Science according to their intermediate background.',
      'Calculators are not allowed in the test hall.',
      'Time allocation: exactly 1 minute per MCQ (100 mins total).'
    ]
  },
  ETEA: {
    id: 'ETEA',
    fullName: 'University of Engineering and Technology (UET Peshawar / ETEA)',
    institutionId: 'etea',
    testName: 'ETEA Engineering Entrance Test — Khyber Pakhtunkhwa',
    badgeBg: 'bg-teal-700',
    badgeText: 'text-teal-700',
    totalMcqs: 100,
    totalTimeMinutes: 100,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '1 Mark per correct answer (Total: 100 Marks)',
    hasElectiveGroup: true,
    electiveGroups: [
      {
        id: 'engineering-chem',
        label: 'Engineering (Chemistry)',
        electiveSubject: 'Chemistry',
        sections: [
          { subject: 'Physics', mcqs: 40, percentage: '40%', desc: 'KPK Textboard Physics Core Topics' },
          { subject: 'Mathematics', mcqs: 35, percentage: '35%', desc: 'FSc Pure and Applied Mathematics' },
          { subject: 'English', mcqs: 15, percentage: '15%', desc: 'Grammar, Reading Comprehension & Vocabulary' },
          { subject: 'Chemistry', mcqs: 10, percentage: '10%', desc: 'Fundamental Principles & Inorganic Chemistry' }
        ]
      },
      {
        id: 'engineering-cs',
        label: 'Engineering (Computer Science)',
        electiveSubject: 'Computer Science',
        sections: [
          { subject: 'Physics', mcqs: 40, percentage: '40%', desc: 'KPK Textboard Physics Core Topics' },
          { subject: 'Mathematics', mcqs: 35, percentage: '35%', desc: 'FSc Pure and Applied Mathematics' },
          { subject: 'English', mcqs: 15, percentage: '15%', desc: 'Grammar, Reading Comprehension & Vocabulary' },
          { subject: 'Computer Science', mcqs: 10, percentage: '10%', desc: 'Programming, Algorithms & Fundamentals' }
        ]
      }
    ],
    sections: [
      { subject: 'Physics', mcqs: 40, percentage: '40%', desc: 'KPK Textboard Physics Core Topics' },
      { subject: 'Mathematics', mcqs: 35, percentage: '35%', desc: 'FSc Pure and Applied Mathematics' },
      { subject: 'English', mcqs: 15, percentage: '15%', desc: 'Grammar, Reading Comprehension & Vocabulary' },
      { subject: 'Chemistry', mcqs: 10, percentage: '10%', desc: 'Or Computer Science (based on chosen group)' }
    ],
    overview: 'The Educational Testing and Evaluation Agency (ETEA) test is the primary admission gateway for UET Peshawar and KPK engineering colleges, comprising 100 questions.',
    specialRules: [
      'Section weights: Physics 40, Mathematics 35, English 15, Chemistry or CS 10.',
      'No negative marking applies.',
      'Based strictly on the Khyber Pakhtunkhwa textbook board syllabus.'
    ]
  },
  NUMS: {
    id: 'NUMS',
    fullName: 'National University of Medical Sciences (Army Medical College)',
    institutionId: 'nums',
    testName: 'NUMS Entry Test — MBBS & BDS Admissions',
    badgeBg: 'bg-[#006837]',
    badgeText: 'text-[#006837]',
    totalMcqs: 150,
    totalTimeMinutes: 150,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '1 Mark per correct answer (Total: 150 Marks)',
    sections: [
      { subject: 'Biology', mcqs: 55, percentage: '36.7%', desc: 'Cell Biology, Genetics, Human Physiology & Anatomy' },
      { subject: 'Chemistry', mcqs: 40, percentage: '26.7%', desc: 'Organic, Inorganic & Physical Chemistry' },
      { subject: 'Physics', mcqs: 40, percentage: '26.7%', desc: 'Mechanics, Optics, Electricity & Magnetism' },
      { subject: 'English', mcqs: 15, percentage: '10.0%', desc: 'Vocabulary, Tenses & Grammar structure' },
    ],
    overview: 'The NUMS Entry Test qualifies students for Army Medical College (AMC) Rawalpindi and all NUMS military and affiliated private medical colleges. It features a unique 50-MCQ Psychological Assessment component.',
    specialRules: [
      'Two distinct papers: Part A (Subject Knowledge: 150 MCQs) and Part B (Psychological Assessment: 50 MCQs).',
      'Psychological Assessment evaluates emotional stability, stress tolerance, doctor-patient empathy, and integrity.',
      'No negative marking in either section.',
      'Mandatory for all candidates seeking admission to Army Medical College.'
    ]
  },
  GIKI: {
    id: 'GIKI',
    fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    institutionId: 'giki',
    testName: 'GIKI Admission Test — Engineering & AI',
    badgeBg: 'bg-[#102254]',
    badgeText: 'text-[#102254]',
    totalMcqs: 80,
    totalTimeMinutes: 120,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '1 Mark per correct answer (Total: 80 Marks)',
    sections: [
      { subject: 'Mathematics', mcqs: 30, percentage: '37.5%', desc: 'Calculus, Trigonometry, Analytic Geometry & Vectors' },
      { subject: 'Physics', mcqs: 30, percentage: '37.5%', desc: 'Classical Mechanics, Electromagnetism, Modern Physics' },
      { subject: 'English', mcqs: 20, percentage: '25.0%', desc: 'Verbal Aptitude, Reading Comprehension, Advanced Grammar' }
    ],
    overview: 'GIKI conducts an intensive 80-question admission test over 120 minutes testing foundational mathematics, conceptual physics, and analytical English proficiency.',
    specialRules: [
      'Strictly 80 questions: Mathematics 30, Physics 30, English 20.',
      'Generous time limit of 120 minutes (1.5 minutes per MCQ) for complex analytical derivations.',
      'No negative marking.',
      'Questions focus heavily on conceptual physics problems and multi-step calculus.'
    ]
  },
  USAT: {
    id: 'USAT',
    fullName: 'Higher Education Commission (HEC Pakistan)',
    institutionId: 'usat',
    testName: 'Undergraduate Studies Admission Test (USAT)',
    badgeBg: 'bg-indigo-700',
    badgeText: 'text-indigo-700',
    totalMcqs: 100,
    totalTimeMinutes: 100,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '100 Marks Total — Minimum 50 Marks to Pass',
    hasElectiveGroup: true,
    electiveGroups: [
      {
        id: 'usat-e',
        label: 'USAT-E (Pre-Engineering)',
        electiveSubject: 'Physics & Mathematics',
        sections: [
          { subject: 'Verbal Reasoning', mcqs: 20, percentage: '20%', desc: 'Part 1: Analogies, Synonyms, Sentence Completion, Comprehension' },
          { subject: 'Quantitative Reasoning', mcqs: 25, percentage: '25%', desc: 'Part 1: Basic Math, Arithmetic, Algebra, Geometry, Statistics' },
          { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Part 2: Mechanics, Optics, Electricity, Modern Physics' },
          { subject: 'Mathematics', mcqs: 25, percentage: '25%', desc: 'Part 2: Advanced Math, Calculus, Trigonometry' }
        ]
      },
      {
        id: 'usat-cs',
        label: 'USAT-CS (Computer Science)',
        electiveSubject: 'Physics, CS & Math',
        sections: [
          { subject: 'Verbal Reasoning', mcqs: 20, percentage: '20%', desc: 'Part 1: Analogies, Synonyms, Sentence Completion, Comprehension' },
          { subject: 'Quantitative Reasoning', mcqs: 25, percentage: '25%', desc: 'Part 1: Basic Math, Arithmetic, Algebra, Geometry, Statistics' },
          { subject: 'Physics', mcqs: 20, percentage: '20%', desc: 'Part 2: Mechanics, Waves, Modern Physics' },
          { subject: 'Computer Science', mcqs: 20, percentage: '20%', desc: 'Part 2: Programming Fundamentals, Logic, Data Systems' },
          { subject: 'Mathematics', mcqs: 15, percentage: '15%', desc: 'Part 2: Matrices, Functions, Calculus Basics' }
        ]
      }
    ],
    sections: [
      { subject: 'Verbal Reasoning', mcqs: 20, percentage: '20%', desc: 'Part 1: Analogies, Synonyms, Sentence Completion, Comprehension' },
      { subject: 'Quantitative Reasoning', mcqs: 25, percentage: '25%', desc: 'Part 1: Basic Math, Arithmetic, Algebra, Geometry, Statistics' },
      { subject: 'Discipline-Specific Physics/CS', mcqs: 30, percentage: '30%', desc: 'Part 2: Relevant science subject MCQs' },
      { subject: 'Discipline-Specific Mathematics', mcqs: 25, percentage: '25%', desc: 'Part 2: Relevant mathematics MCQs' }
    ],
    overview: 'The HEC USAT is the standardized aptitude test required for admissions to universities across Pakistan, scored out of 100 with a strict passing threshold of 50 marks.',
    specialRules: [
      'Two-part test: Part 1 Aptitude (Verbal 20 + Quantitative 25) and Part 2 Discipline (55 MCQs).',
      'Passing score is exactly 50 out of 100 marks.',
      'No negative marking applies.',
      'Accepted by top public and chartered universities nationwide.'
    ]
  },
  NED: {
    id: 'NED',
    fullName: 'NED University of Engineering & Technology (Karachi)',
    institutionId: 'ned',
    testName: 'NED Pre-Admission Entry Test',
    badgeBg: 'bg-[#002D62]',
    badgeText: 'text-[#002D62]',
    totalMcqs: 100,
    totalTimeMinutes: 120,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '1 Mark per MCQ (Total: 100 Marks) — Merit: 60% Test + 40% HSC',
    sections: [
      { subject: 'Mathematics', mcqs: 25, percentage: '25%', desc: 'Algebra, Trigonometry, Calculus, Vectors, Analytical Geometry' },
      { subject: 'Physics', mcqs: 25, percentage: '25%', desc: 'Mechanics, Heat, Thermodynamics, Electromagnetism, Modern Physics' },
      { subject: 'Chemistry', mcqs: 25, percentage: '25%', desc: 'Physical, Organic, Inorganic, Electrochemistry & Industrial Chemistry' },
      { subject: 'English', mcqs: 25, percentage: '25%', desc: 'Vocabulary, Grammar, Sentence Completion & Reading Comprehension' }
    ],
    overview: 'The official NED University admission test comprises exactly 100 multiple-choice questions administered over 120 minutes with balanced distribution across Mathematics, Physics, Chemistry, and English.',
    specialRules: [
      'Strictly 100 MCQs: Mathematics 25, Physics 25, Chemistry 25, English 25.',
      'Total test duration: 2 hours (120 minutes).',
      'No negative marking applies.',
      'Merit aggregation: 60% Entry Test weightage + 40% HSC (Intermediate) board score.'
    ]
  },
  PIEAS: {
    id: 'PIEAS',
    fullName: 'Pakistan Institute of Engineering & Applied Sciences (PIEAS)',
    institutionId: 'pieas',
    testName: 'PIEAS Written Admission Test',
    badgeBg: 'bg-[#1E3A8A]',
    badgeText: 'text-[#1E3A8A]',
    totalMcqs: 100,
    totalTimeMinutes: 180,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '1 Mark per correct answer (Total: 100 Marks)',
    hasElectiveGroup: true,
    electiveGroups: [
      {
        id: 'pieas-eng',
        label: 'Pre-Engineering Stream',
        electiveSubject: 'Chemistry',
        sections: [
          { subject: 'English', mcqs: 10, percentage: '10%', desc: 'Grammar, Reading Comprehension, Vocabulary' },
          { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Calculus, Analytical Geometry, Trigonometry, Series' },
          { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Mechanics, Electricity & Magnetism, Modern Physics' },
          { subject: 'Chemistry', mcqs: 30, percentage: '30%', desc: 'Chemical Bonding, Energetics, Organic Chemistry' }
        ]
      },
      {
        id: 'pieas-ics',
        label: 'ICS (Computer Science) Stream',
        electiveSubject: 'Computer Science',
        sections: [
          { subject: 'English', mcqs: 10, percentage: '10%', desc: 'Grammar, Reading Comprehension, Vocabulary' },
          { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Calculus, Analytical Geometry, Trigonometry, Series' },
          { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Mechanics, Electricity & Magnetism, Modern Physics' },
          { subject: 'Computer Science', mcqs: 30, percentage: '30%', desc: 'Programming, Data Structures, Logic, Computer Architecture' }
        ]
      }
    ],
    sections: [
      { subject: 'English', mcqs: 10, percentage: '10%', desc: 'Grammar, Reading Comprehension, Vocabulary' },
      { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Calculus, Analytical Geometry, Trigonometry, Series' },
      { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Mechanics, Electricity & Magnetism, Modern Physics' },
      { subject: 'Chemistry', mcqs: 30, percentage: '30%', desc: 'Chemical Bonding, Energetics, Organic Chemistry' }
    ],
    overview: 'PIEAS administers an intensive 100-question written test over 180 minutes (3 hours) for premier nuclear, engineering, and computing admissions.',
    specialRules: [
      'Strictly 100 MCQs: English 10, Mathematics 30, Physics 30, Elective 30.',
      'Pre-Engineering elective: Chemistry (30 MCQs).',
      'ICS elective: Computer Science (30 MCQs).',
      'Generous 3-hour (180 minute) testing window allows deep problem-solving.',
      'No negative marking applies.'
    ]
  },
  NAT: {
    id: 'NAT',
    fullName: 'NTS National Aptitude Test (NAT) — Shared Portal',
    institutionId: 'nat',
    testName: 'NTS NAT Portal (COMSATS, Air, Bahria, IIUI, IST)',
    badgeBg: 'bg-[#006A4E]',
    badgeText: 'text-[#006A4E]',
    totalMcqs: 90,
    totalTimeMinutes: 120,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '1 Mark per MCQ (Total: 90 Marks) — Valid for 1 Year',
    hasElectiveGroup: true,
    electiveGroups: [
      {
        id: 'nat-ie',
        label: 'NAT-IE (Pre-Engineering)',
        electiveSubject: 'Math, Physics, Chem',
        sections: [
          { subject: 'English', mcqs: 20, percentage: '22.2%', desc: 'Sentence Completion, Analogy, Antonym/Synonym, Comprehension' },
          { subject: 'Analytical Reasoning', mcqs: 20, percentage: '22.2%', desc: 'Scenario Deductions, Logic Games, Constraint Satisfaction' },
          { subject: 'Quantitative Reasoning', mcqs: 20, percentage: '22.2%', desc: 'Basic Arithmetic, Algebra, Geometry, Statistics' },
          { subject: 'Physics', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Mechanics, Electromagnetism' },
          { subject: 'Chemistry', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Physical, Inorganic, Organic' },
          { subject: 'Mathematics', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: FSc Intermediate Mathematics' }
        ]
      },
      {
        id: 'nat-im',
        label: 'NAT-IM (Pre-Medical)',
        electiveSubject: 'Bio, Physics, Chem',
        sections: [
          { subject: 'English', mcqs: 20, percentage: '22.2%', desc: 'Sentence Completion, Analogy, Antonym/Synonym, Comprehension' },
          { subject: 'Analytical Reasoning', mcqs: 20, percentage: '22.2%', desc: 'Scenario Deductions, Logic Games, Constraint Satisfaction' },
          { subject: 'Quantitative Reasoning', mcqs: 20, percentage: '22.2%', desc: 'Basic Arithmetic, Algebra, Geometry, Statistics' },
          { subject: 'Physics', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Mechanics, Optics, Modern Physics' },
          { subject: 'Chemistry', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Physical, Inorganic, Organic' },
          { subject: 'Biology', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Botany, Zoology, Human Physiology' }
        ]
      },
      {
        id: 'nat-ics',
        label: 'NAT-ICS (Computer Science)',
        electiveSubject: 'CS, Physics, Math',
        sections: [
          { subject: 'English', mcqs: 20, percentage: '22.2%', desc: 'Sentence Completion, Analogy, Antonym/Synonym, Comprehension' },
          { subject: 'Analytical Reasoning', mcqs: 20, percentage: '22.2%', desc: 'Scenario Deductions, Logic Games, Constraint Satisfaction' },
          { subject: 'Quantitative Reasoning', mcqs: 20, percentage: '22.2%', desc: 'Basic Arithmetic, Algebra, Geometry, Statistics' },
          { subject: 'Physics', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Mechanics, Electromagnetism' },
          { subject: 'Computer Science', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Programming, DB, Logic Gates' },
          { subject: 'Mathematics', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Intermediate Mathematics' }
        ]
      }
    ],
    sections: [
      { subject: 'English', mcqs: 20, percentage: '22.2%', desc: 'Sentence Completion, Analogy, Antonym/Synonym, Comprehension' },
      { subject: 'Analytical Reasoning', mcqs: 20, percentage: '22.2%', desc: 'Scenario Deductions, Logic Games, Constraint Satisfaction' },
      { subject: 'Quantitative Reasoning', mcqs: 20, percentage: '22.2%', desc: 'Basic Arithmetic, Algebra, Geometry, Statistics' },
      { subject: 'Physics', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Core Physics' },
      { subject: 'Chemistry', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Core Chemistry' },
      { subject: 'Mathematics', mcqs: 10, percentage: '11.1%', desc: 'Subject Knowledge: Core Mathematics' }
    ],
    overview: 'Universal NTS NAT portal accepted for admissions at COMSATS University, Air University, Bahria University, IIUI, and Institute of Space Technology (IST).',
    specialRules: [
      'Single shared test valid for COMSATS, Air, Bahria, IIUI, and IST admissions.',
      'Total 90 MCQs administered over 120 minutes (2 hours).',
      'Common sections: English (20), Analytical Reasoning (20), Quantitative Reasoning (20).',
      'Subject knowledge section (30 MCQs) customized by candidate stream (NAT-IE, NAT-IM, NAT-ICS).',
      'No negative marking applies.'
    ]
  },
  IBA: {
    id: 'IBA',
    fullName: 'Institute of Business Administration (IBA Karachi)',
    institutionId: 'iba',
    testName: 'IBA Undergraduate Aptitude Test',
    badgeBg: 'bg-[#8B0000]',
    badgeText: 'text-[#8B0000]',
    totalMcqs: 90,
    totalTimeMinutes: 165,
    negativeMarking: '-1 Mark per wrong answer (or -0.25 penalty)',
    scoringScheme: 'Scored with Negative Marking — Sectional Cut-offs Apply',
    sections: [
      { subject: 'English', mcqs: 45, percentage: '50%', desc: 'Vocabulary in Context, Sentence Correction, Error Detection, Critical Reading' },
      { subject: 'Mathematics', mcqs: 45, percentage: '50%', desc: 'Quantitative Reasoning, Word Problems, Algebra, Geometry, Functions' }
    ],
    overview: 'The IBA Karachi Aptitude Test is a premier standardized entrance examination testing high-precision English verbal ability and advanced mathematical reasoning.',
    specialRules: [
      'Strictly 90 MCQs: English 45 MCQs, Mathematics 45 MCQs.',
      'Total test duration: 165 minutes (2 hours 45 minutes).',
      'Negative marking applies: incorrect answers are penalized.',
      'Candidates must clear individual cut-offs in both English and Mathematics sections independently.'
    ]
  },
  AKU: {
    id: 'AKU',
    fullName: 'The Aga Khan University Medical College (AKU Karachi)',
    institutionId: 'aku',
    testName: 'AKU MBBS & BScN Admission Test',
    badgeBg: 'bg-[#005A36]',
    badgeText: 'text-[#005A36]',
    totalMcqs: 100,
    totalTimeMinutes: 120,
    negativeMarking: '-0.25 in Science Achievement section',
    scoringScheme: '100 Marks Total — Negative Marking in Science Achievement only',
    sections: [
      { subject: 'Biology', mcqs: 16, percentage: '16%', desc: 'Science Achievement: Cellular, Genetics, Physiology (-0.25 penalty)' },
      { subject: 'Chemistry', mcqs: 12, percentage: '12%', desc: 'Science Achievement: Organic, Physical, Inorganic (-0.25 penalty)' },
      { subject: 'Physics', mcqs: 12, percentage: '12%', desc: 'Science Achievement: Mechanics, Electromagnetism, Modern Physics (-0.25 penalty)' },
      { subject: 'Science Reasoning', mcqs: 30, percentage: '30%', desc: 'Experimental Interpretation, Data Analysis, Hypotheses (No penalty)' },
      { subject: 'Mathematical Reasoning', mcqs: 30, percentage: '30%', desc: 'Quantitative Logic, Rates, Ratios, Probability, Scaling (No penalty)' }
    ],
    overview: 'The prestigious Aga Khan University entrance exam evaluates both foundational science knowledge and high-order scientific and mathematical reasoning.',
    specialRules: [
      'Science Achievement (40 Marks): Biology 16, Chemistry 12, Physics 12. Negative marking (-0.25) applies here.',
      'Science Reasoning (30 Marks): Evaluates experimental analysis and scientific deduction without negative marking.',
      'Mathematical Reasoning (30 Marks): Evaluates quantitative logic and data interpretation without negative marking.',
      'Total 100 Marks over 120 minutes.'
    ]
  },
  MUET: {
    id: 'MUET',
    fullName: 'Mehran University of Engineering & Technology (MUET Jamshoro)',
    institutionId: 'muet',
    testName: 'MUET Pre-Admission Entry Test',
    badgeBg: 'bg-[#800020]',
    badgeText: 'text-[#800020]',
    totalMcqs: 100,
    totalTimeMinutes: 100,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '1 Mark per MCQ (Total: 100 Marks)',
    hasElectiveGroup: true,
    electiveGroups: [
      {
        id: 'muet-eng',
        label: 'Pre-Engineering Stream',
        electiveSubject: 'Chemistry',
        sections: [
          { subject: 'Mathematics', mcqs: 25, percentage: '25%', desc: 'Calculus, Trigonometry, Analytic Geometry' },
          { subject: 'Physics', mcqs: 25, percentage: '25%', desc: 'Mechanics, Electricity, Waves, Modern Physics' },
          { subject: 'Chemistry', mcqs: 25, percentage: '25%', desc: 'Physical, Inorganic, Organic Chemistry' },
          { subject: 'English', mcqs: 25, percentage: '25%', desc: 'Grammar, Vocabulary, Comprehension' }
        ]
      },
      {
        id: 'muet-ics',
        label: 'ICS (Computer Science) Stream',
        electiveSubject: 'Computer Science',
        sections: [
          { subject: 'Mathematics', mcqs: 25, percentage: '25%', desc: 'Calculus, Trigonometry, Analytic Geometry' },
          { subject: 'Physics', mcqs: 25, percentage: '25%', desc: 'Mechanics, Electricity, Waves, Modern Physics' },
          { subject: 'Computer Science', mcqs: 25, percentage: '25%', desc: 'Programming, Data Structures, DB Systems' },
          { subject: 'English', mcqs: 25, percentage: '25%', desc: 'Grammar, Vocabulary, Comprehension' }
        ]
      },
      {
        id: 'muet-med',
        label: 'Pre-Medical (Bio-Engineering)',
        electiveSubject: 'Biology',
        sections: [
          { subject: 'Biology', mcqs: 25, percentage: '25%', desc: 'Cell Biology, Genetics, Physiology' },
          { subject: 'Physics', mcqs: 25, percentage: '25%', desc: 'Mechanics, Electricity, Waves, Modern Physics' },
          { subject: 'Chemistry', mcqs: 25, percentage: '25%', desc: 'Physical, Inorganic, Organic Chemistry' },
          { subject: 'English', mcqs: 25, percentage: '25%', desc: 'Grammar, Vocabulary, Comprehension' }
        ]
      }
    ],
    sections: [
      { subject: 'Mathematics', mcqs: 25, percentage: '25%', desc: 'Calculus, Trigonometry, Analytic Geometry' },
      { subject: 'Physics', mcqs: 25, percentage: '25%', desc: 'Mechanics, Electricity, Waves, Modern Physics' },
      { subject: 'Chemistry', mcqs: 25, percentage: '25%', desc: 'Physical, Inorganic, Organic Chemistry' },
      { subject: 'English', mcqs: 25, percentage: '25%', desc: 'Grammar, Vocabulary, Comprehension' }
    ],
    overview: 'The MUET Jamshoro pre-admission test consists of 100 questions over 100 minutes testing core science disciplines and English language proficiency.',
    specialRules: [
      '100 MCQs in 100 minutes (1 minute per question).',
      'Streams for Pre-Engineering, ICS, and Pre-Medical.',
      'No negative marking applies.'
    ]
  },
  LUMS: {
    id: 'LUMS',
    fullName: 'Lahore University of Management Sciences (LUMS)',
    institutionId: 'lums',
    testName: 'LUMS LCAT & SBASSE Scientific Aptitude Test',
    badgeBg: 'bg-[#002855]',
    badgeText: 'text-[#002855]',
    totalMcqs: 90,
    totalTimeMinutes: 160,
    negativeMarking: 'No Negative Marking',
    scoringScheme: 'Undergraduate Admissions Aptitude Benchmark',
    hasElectiveGroup: true,
    electiveGroups: [
      {
        id: 'lums-lcat',
        label: 'LCAT (Undergraduate Aptitude)',
        electiveSubject: 'Verbal & Quantitative',
        sections: [
          { subject: 'Verbal Reasoning', mcqs: 45, percentage: '50%', desc: 'Critical Reading, Sentence Completion, Analytical Grammar' },
          { subject: 'Quantitative Reasoning', mcqs: 45, percentage: '50%', desc: 'Advanced Arithmetic, Algebra, Geometry, Probability' }
        ]
      },
      {
        id: 'lums-sse',
        label: 'SBASSE Scientific Aptitude',
        electiveSubject: 'Science Core',
        sections: [
          { subject: 'Physics', mcqs: 25, percentage: '25%', desc: 'Mechanics, Electromagnetism, Modern Physics' },
          { subject: 'Chemistry', mcqs: 25, percentage: '25%', desc: 'Physical, Organic, Inorganic Chemistry' },
          { subject: 'Mathematics', mcqs: 25, percentage: '25%', desc: 'Calculus, Trigonometry, Vectors, Linear Algebra' },
          { subject: 'Biology', mcqs: 25, percentage: '25%', desc: 'Molecular Biology, Genetics, Physiology' }
        ]
      }
    ],
    sections: [
      { subject: 'Verbal Reasoning', mcqs: 45, percentage: '50%', desc: 'Critical Reading, Sentence Completion, Analytical Grammar' },
      { subject: 'Quantitative Reasoning', mcqs: 45, percentage: '50%', desc: 'Advanced Arithmetic, Algebra, Geometry, Probability' }
    ],
    overview: 'LUMS admissions test featuring the general LCAT (Verbal & Quantitative) and the specialized SBASSE Scientific Aptitude Test for STEM candidates.',
    specialRules: [
      'LCAT: 90 MCQs (Verbal Reasoning 45, Quantitative Reasoning 45) over 160 minutes.',
      'SBASSE Scientific Aptitude: 100 MCQs across Physics, Chemistry, Math, and Biology.',
      'No negative marking applies.'
    ]
  },
  NUML: {
    id: 'NUML',
    fullName: 'National University of Modern Languages (NUML Islamabad)',
    institutionId: 'numl',
    testName: 'NUML University Entrance Test',
    badgeBg: 'bg-[#155E75]',
    badgeText: 'text-[#155E75]',
    totalMcqs: 75,
    totalTimeMinutes: 60,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '75 Marks Total — Minimum 50% passing threshold',
    sections: [
      { subject: 'English', mcqs: 20, percentage: '26.7%', desc: 'Grammar, Reading Comprehension, Vocabulary' },
      { subject: 'Physics', mcqs: 20, percentage: '26.7%', desc: 'Mechanics, Electricity, Heat, Modern Physics' },
      { subject: 'Mathematics', mcqs: 20, percentage: '26.7%', desc: 'Algebra, Trigonometry, Matrices, Calculus' },
      { subject: 'Computer Science', mcqs: 15, percentage: '20.0%', desc: 'Computer Basics, Logic, Databases, Programming' }
    ],
    overview: 'NUML undergraduate entrance test assessing English, quantitative foundations, physics, and computer fundamentals with a mandatory 50% passing mark.',
    specialRules: [
      '75 MCQs in 60 minutes.',
      'Sections: English 20, Physics 20, Mathematics 20, Computer Science 15.',
      'Minimum 50% score required to qualify for admission.',
      'No negative marking applies.'
    ]
  },
  HITEC: {
    id: 'HITEC',
    fullName: 'HITEC University Taxila',
    institutionId: 'hitec',
    testName: 'HITEC University Admission Test',
    badgeBg: 'bg-[#7C2D12]',
    badgeText: 'text-[#7C2D12]',
    totalMcqs: 100,
    totalTimeMinutes: 120,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '100 Marks Total — Minimum 50% qualifying pass rate',
    hasElectiveGroup: true,
    electiveGroups: [
      {
        id: 'hitec-eng',
        label: 'Engineering Stream',
        electiveSubject: 'Chemistry',
        sections: [
          { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Calculus, Algebra, Trigonometry, Vectors' },
          { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Mechanics, Electromagnetism, Modern Physics' },
          { subject: 'Chemistry', mcqs: 20, percentage: '20%', desc: 'Physical, Inorganic, Organic Chemistry' },
          { subject: 'English', mcqs: 20, percentage: '20%', desc: 'Grammar, Comprehension, Vocabulary' }
        ]
      },
      {
        id: 'hitec-cs',
        label: 'Computing Stream',
        electiveSubject: 'Computer Science',
        sections: [
          { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Calculus, Algebra, Trigonometry, Vectors' },
          { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Mechanics, Electromagnetism, Modern Physics' },
          { subject: 'Computer Science', mcqs: 20, percentage: '20%', desc: 'Programming, Data Structures, DB Systems' },
          { subject: 'English', mcqs: 20, percentage: '20%', desc: 'Grammar, Comprehension, Vocabulary' }
        ]
      }
    ],
    sections: [
      { subject: 'Mathematics', mcqs: 30, percentage: '30%', desc: 'Calculus, Algebra, Trigonometry, Vectors' },
      { subject: 'Physics', mcqs: 30, percentage: '30%', desc: 'Mechanics, Electromagnetism, Modern Physics' },
      { subject: 'Chemistry', mcqs: 20, percentage: '20%', desc: 'Physical, Inorganic, Organic Chemistry' },
      { subject: 'English', mcqs: 20, percentage: '20%', desc: 'Grammar, Comprehension, Vocabulary' }
    ],
    overview: 'HITEC University Taxila entrance test evaluating analytical and scientific preparation for Engineering and Computer Science disciplines.',
    specialRules: [
      '100 MCQs in 120 minutes.',
      '50% minimum passing score required.',
      'No negative marking applies.',
      'Also accepts valid NTS NAT test scores.'
    ]
  },
  NUTECH: {
    id: 'NUTECH',
    fullName: 'National University of Technology (NUTECH Islamabad)',
    institutionId: 'nutech',
    testName: 'NUTECH Entry Test (NUET)',
    badgeBg: 'bg-[#14532D]',
    badgeText: 'text-[#14532D]',
    totalMcqs: 200,
    totalTimeMinutes: 180,
    negativeMarking: 'No Negative Marking',
    scoringScheme: '200 Marks Total (1 Mark per MCQ)',
    hasElectiveGroup: true,
    electiveGroups: [
      {
        id: 'nuet-eng',
        label: 'Engineering Stream',
        electiveSubject: 'Chemistry & CS',
        sections: [
          { subject: 'Mathematics', mcqs: 80, percentage: '40%', desc: 'Calculus, Analytical Geometry, Trigonometry, Algebra' },
          { subject: 'Physics', mcqs: 60, percentage: '30%', desc: 'Mechanics, Thermodynamics, Electromagnetism' },
          { subject: 'Chemistry', mcqs: 40, percentage: '20%', desc: 'Physical, Inorganic, Organic Chemistry' },
          { subject: 'English', mcqs: 20, percentage: '10%', desc: 'Grammar, Vocabulary, Sentence Completion' }
        ]
      },
      {
        id: 'nuet-cs',
        label: 'Computing Stream',
        electiveSubject: 'Computer Science',
        sections: [
          { subject: 'Mathematics', mcqs: 100, percentage: '50%', desc: 'Calculus, Analytical Geometry, Trigonometry, Algebra' },
          { subject: 'Computer Science', mcqs: 60, percentage: '30%', desc: 'Programming, Data Structures, DB, Algorithms' },
          { subject: 'English', mcqs: 40, percentage: '20%', desc: 'Grammar, Vocabulary, Sentence Completion' }
        ]
      }
    ],
    sections: [
      { subject: 'Mathematics', mcqs: 80, percentage: '40%', desc: 'Calculus, Analytical Geometry, Trigonometry, Algebra' },
      { subject: 'Physics', mcqs: 60, percentage: '30%', desc: 'Mechanics, Thermodynamics, Electromagnetism' },
      { subject: 'Chemistry', mcqs: 40, percentage: '20%', desc: 'Physical, Inorganic, Organic Chemistry' },
      { subject: 'English', mcqs: 20, percentage: '10%', desc: 'Grammar, Vocabulary, Sentence Completion' }
    ],
    overview: 'NUTECH Entry Test (NUET) comprising 200 questions over 180 minutes evaluating advanced technical mastery for premier technology and engineering degree programs.',
    specialRules: [
      '200 MCQs in 180 minutes (3 hours).',
      'Engineering: Math 80 (40%), Physics 60 (30%), Chemistry/CS 40 (20%), English 20 (10%).',
      'Computing: Math 100 (50%), CS/Physics 60 (30%), English 40 (20%).',
      'No negative marking applies.'
    ]
  }
};

interface EntranceDashboardPortalProps {
  track: EntranceTrackType;
  selectedGroup?: string;
  currentUser: User | null;
  userProfile?: StudentProfile | null;
  history: HistoryItem[];
  isTestLimitReached?: boolean;
  isAdmin?: boolean;
  onStartTest: (params: {
    subject: string;
    chapterName?: string;
    customTopic?: string;
    topic?: string;
    subtopic?: string;
    questionCount: number;
    durationMinutes: number;
    difficulty: QuestionDifficulty;
    mode: TestMode;
    instantFeedback: boolean;
    isFullMock?: boolean;
    groupSubjects?: string[];
  }) => void;
  onOpenAuth: (intendedParams?: any) => void;
  onOpenHistory: () => void;
  onBackToMainScreen?: () => void;
  onUpgradeClick?: () => void;
  onSelectTrack?: (track: EntranceTrackType) => void;
}

export const EntranceDashboardPortal: React.FC<EntranceDashboardPortalProps> = React.memo(({
  track,
  selectedGroup,
  currentUser,
  userProfile,
  history,
  isTestLimitReached = false,
  isAdmin = false,
  onStartTest,
  onOpenAuth,
  onOpenHistory,
  onBackToMainScreen,
  onUpgradeClick,
  onSelectTrack,
}) => {
  const isProStudent = isUserProOrPaid(currentUser, userProfile, isAdmin);
  const [currentTrack, setCurrentTrack] = useState<EntranceTrackType>(track);
  const [showTrackDropdown, setShowTrackDropdown] = useState<boolean>(false);

  useEffect(() => {
    setCurrentTrack(track);
  }, [track]);

  const trackData = ENTRANCE_TRACKS_DATA[currentTrack] || ENTRANCE_TRACKS_DATA.NUMS;

  // Elective group state (for ECAT, ETEA, USAT)
  const [activeElectiveGroupId, setActiveElectiveGroupId] = useState<string>(() => {
    if (trackData.electiveGroups && trackData.electiveGroups.length > 0) {
      if (selectedGroup) {
        const sLower = selectedGroup.toLowerCase();
        const matched = trackData.electiveGroups.find(g =>
          g.id.toLowerCase().includes(sLower) ||
          g.label.toLowerCase().includes(sLower) ||
          sLower.includes(g.id.toLowerCase())
        );
        if (matched) return matched.id;
      }
      return trackData.electiveGroups[0].id;
    }
    return '';
  });

  // Modal / Practice Config
  const [selectedSubjectForDrill, setSelectedSubjectForDrill] = useState<string | null>(null);
  const [drillQuestionCount, setDrillQuestionCount] = useState<number>(20);
  const [drillDuration, setDrillDuration] = useState<number>(20);
  const [drillDifficulty, setDrillDifficulty] = useState<QuestionDifficulty>('Exam Standard');
  const [drillInstantFeedback, setDrillInstantFeedback] = useState<boolean>(true);
  const [showDrillModal, setShowDrillModal] = useState<boolean>(false);

  // Active section list based on elective group
  const activeSections: SectionDistribution[] = (() => {
    if (trackData.hasElectiveGroup && trackData.electiveGroups) {
      const currentGrp = trackData.electiveGroups.find(g => g.id === activeElectiveGroupId);
      if (currentGrp) return currentGrp.sections;
    }
    return trackData.sections;
  })();

  // Filter history items for this track
  const trackHistory = history.filter(item => {
    const p = (item.pathLabel || '').toUpperCase();
    const s = (item.subject || '').toUpperCase();
    const tId = trackData.id.toUpperCase();
    return p.includes(tId) || s.includes(tId) || p.includes(trackData.fullName.toUpperCase());
  });

  const averageTrackScore = trackHistory.length > 0
    ? Math.round(trackHistory.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / trackHistory.length)
    : null;

  // Handle Full-Length Mock Exam launch
  const handleLaunchFullMock = () => {
    triggerHaptic(HAPTIC_PATTERNS.light);
    if (!currentUser) {
      onOpenAuth({ track: trackData.id, fullMock: true });
      return;
    }

    const groupLabel = trackData.hasElectiveGroup && trackData.electiveGroups
      ? trackData.electiveGroups.find(g => g.id === activeElectiveGroupId)?.label
      : undefined;

    onStartTest({
      subject: `${trackData.id} Full-Length Grand Mock Exam`,
      customTopic: `${trackData.fullName} Exam Pattern`,
      chapterName: groupLabel || `${trackData.id} Standard Pattern`,
      questionCount: trackData.totalMcqs,
      durationMinutes: trackData.totalTimeMinutes,
      difficulty: 'Exam Standard',
      mode: 'instant',
      instantFeedback: false,
      isFullMock: true,
      groupSubjects: activeSections.map(s => s.subject),
    });
  };

  // Handle Subject Drill launch
  const handleLaunchSubjectDrill = (subjectName: string) => {
    setSelectedSubjectForDrill(subjectName);
    setShowDrillModal(true);
  };

  const handleConfirmDrill = () => {
    if (!selectedSubjectForDrill) return;
    triggerHaptic(HAPTIC_PATTERNS.light);

    if (!currentUser) {
      onOpenAuth({ track: trackData.id, subject: selectedSubjectForDrill });
      return;
    }

    onStartTest({
      subject: selectedSubjectForDrill,
      customTopic: `${trackData.id} Subject Practice Drill`,
      chapterName: `${trackData.id} Preparation`,
      questionCount: drillQuestionCount,
      durationMinutes: drillDuration,
      difficulty: drillDifficulty,
      mode: 'instant',
      instantFeedback: drillInstantFeedback,
      isFullMock: false,
    });

    setShowDrillModal(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          {onBackToMainScreen && (
            <button
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.light);
                onBackToMainScreen();
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              title="Return to Main Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <InstitutionBadge id={trackData.institutionId} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Entrance Examination Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {trackData.fullName}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Portal Switcher (All 20 Tracks) */}
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.light);
                setShowTrackDropdown(!showTrackDropdown);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              title="Switch Exam Portal"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Switch Exam ({Object.keys(ENTRANCE_TRACKS_DATA).length} Tracks)</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showTrackDropdown && (
              <div className="absolute right-0 top-10 z-50 w-72 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl max-h-88 overflow-y-auto">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5 py-1.5 border-b border-slate-100 mb-1">
                  All 20 Exam Portals
                </div>
                {(Object.keys(ENTRANCE_TRACKS_DATA) as EntranceTrackType[]).map((tKey) => {
                  const item = ENTRANCE_TRACKS_DATA[tKey];
                  const isSelected = tKey === currentTrack;
                  return (
                    <button
                      key={tKey}
                      onClick={() => {
                        triggerHaptic(HAPTIC_PATTERNS.light);
                        setCurrentTrack(tKey);
                        setShowTrackDropdown(false);
                        if (onSelectTrack) onSelectTrack(tKey);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <InstitutionBadge id={item.institutionId} size="sm" />
                        <span className="truncate">{item.id} — {item.fullName.split('(')[0].trim()}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-1 shrink-0">{item.totalMcqs} Qs</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {trackHistory.length > 0 && (
            <button
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.light);
                onOpenHistory();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Past Attempts ({trackHistory.length})</span>
            </button>
          )}

          <BoardlyProBadge userProfile={userProfile} isAdmin={isAdmin} label="Full Access Entrance Pass" />
        </div>
      </div>

      {/* Elective Group Selector (for ECAT, ETEA, USAT) */}
      {trackData.hasElectiveGroup && trackData.electiveGroups && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Stream / Group Combination
            </div>
            <div className="text-sm font-black text-slate-800">
              Select your academic discipline for accurate subject allocation
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {trackData.electiveGroups.map((grp) => (
              <button
                key={grp.id}
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.light);
                  setActiveElectiveGroupId(grp.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeElectiveGroupId === grp.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {grp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero: Grand Mock Exam Launch & Key Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full-Length Mock Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800 flex flex-col justify-between">
          <div className="relative z-10 space-y-3">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {trackData.testName}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                {trackData.overview}
              </p>
            </div>

            {/* Continuous Track Stats Marquee Ticker Strip */}
            <div className="w-full overflow-hidden rounded-2xl bg-white/[0.06] border border-white/10 py-3 px-4 my-2 select-none">
              <div className="animate-marquee-scroll flex items-center whitespace-nowrap">
                <div className="flex items-center gap-4 pr-4">
                  <span className="flex items-center gap-1.5 text-white font-bold text-xs">
                    <span className="text-amber-400">●</span>
                    {trackData.totalMcqs} Questions
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-slate-200 font-semibold text-xs">
                    {trackData.totalTimeMinutes} Minutes
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-emerald-400 font-semibold text-xs">
                    {trackData.negativeMarking}
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-cyan-300 font-semibold text-xs">
                    {trackData.scoringScheme}
                  </span>
                  {activeSections.map((sec, idx) => (
                    <React.Fragment key={idx}>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-slate-300 font-medium text-xs">
                        {sec.subject} ({sec.mcqs} MCQs)
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex items-center gap-4 pr-4" aria-hidden="true">
                  <span className="flex items-center gap-1.5 text-white font-bold text-xs">
                    <span className="text-amber-400">●</span>
                    {trackData.totalMcqs} Questions
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-slate-200 font-semibold text-xs">
                    {trackData.totalTimeMinutes} Minutes
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-emerald-400 font-semibold text-xs">
                    {trackData.negativeMarking}
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-cyan-300 font-semibold text-xs">
                    {trackData.scoringScheme}
                  </span>
                  {activeSections.map((sec, idx) => (
                    <React.Fragment key={idx}>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-slate-300 font-medium text-xs">
                        {sec.subject} ({sec.mcqs} MCQs)
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-3 border-t border-white/10 flex items-center justify-between gap-4">
            <button
              onClick={handleLaunchFullMock}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Full-Length Mock Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Track Readiness & Rules */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>Exam Strategy & Rules</span>
              </h3>
              {averageTrackScore !== null && (
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                  {averageTrackScore}% Avg Score
                </span>
              )}
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600">
              {trackData.specialRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-600" />
              <span>Unlimited Practice Access</span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              All enrolled students enjoy 100% free, unlimited access to chapter drills and full-length timed entrance exam mocks.
            </p>
          </div>
        </div>
      </div>

      {/* Section-Wise Syllabus Breakdown & Subject Drills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Subject-Wise Test Sections & Targeted Practice
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Practice individual exam sections or review topic weightage according to official guidelines
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSections.map((sec, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Section {idx + 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
                    {sec.mcqs} MCQs ({sec.percentage})
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  {sec.subject}
                </h3>

                {sec.desc && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {sec.desc}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Full Section Mock
                </span>
                <button
                  onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.light);
                    handleLaunchSubjectDrill(sec.subject);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Section Mock Test</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drill Config Modal */}
      <AnimatePresence>
        {showDrillModal && selectedSubjectForDrill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-6"
            >
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Custom Practice Drill
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedSubjectForDrill} Drill
                </h3>
                <p className="text-xs text-slate-500">
                  Configure question count, duration, and test environment mode.
                </p>
              </div>

              <div className="space-y-4">
                {/* Question Count */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    Question Count
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, 30].map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setDrillQuestionCount(count);
                          setDrillDuration(count);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          drillQuestionCount === count
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {count} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Easy', 'Medium', 'Exam Standard'] as QuestionDifficulty[]).map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDrillDifficulty(diff)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          drillDifficulty === diff
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Mode */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    Feedback Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDrillInstantFeedback(true)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        drillInstantFeedback
                          ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-black">Instant Explanations</div>
                      <div className="text-[10px] text-slate-500">Learn on every option select</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrillInstantFeedback(false)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        !drillInstantFeedback
                          ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-black">Exam Mode</div>
                      <div className="text-[10px] text-slate-500">Review solutions at test finish</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDrillModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDrill}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Drill</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

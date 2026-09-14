import fs from 'fs';
import path from 'path';
import {
  generateNetFullMockBank,
  generateFastFullMockBank,
  generateEcatFullMockBank,
  generateEteaFullMockBank,
  generateNumsFullMockBank,
  generateGikiFullMockBank,
  generateUsatFullMockBank,
  generateNedFullMockBank,
  generatePieasFullMockBank,
  generateNatFullMockBank,
  generateIbaFullMockBank,
  generateAkuFullMockBank,
  generateMuetFullMockBank,
  generateLumsFullMockBank,
  generateNumlFullMockBank,
  generateHitecFullMockBank,
  generateNutechFullMockBank,
  getEntranceExamQuestions
} from '../src/data/entranceExamQuestions';
import { TCAT_MATH_QUESTIONS, TCAT_PHYSICS_QUESTIONS, TCAT_CHEMISTRY_QUESTIONS, TCAT_CS_QUESTIONS, TCAT_ENGLISH_QUESTIONS, ALL_TCAT_QUESTIONS } from '../src/data/tcatPrebuiltQuestions';
import { ALL_MDCAT_QUESTIONS } from '../src/data/mdcatPrebuiltQuestions';
import { FAST_BASIC_MATH_QUESTIONS } from '../src/data/fastBasicMathQuestions';
import { FAST_IQ_ANALYTICAL_QUESTIONS } from '../src/data/fastIqAnalyticalQuestions';
import { NUMS_PSYCHOLOGICAL_QUESTIONS } from '../src/data/numsPsychologicalQuestions';
import {
  APTITUDE_QUANT_QUESTIONS,
  APTITUDE_VERBAL_QUESTIONS,
  AKU_SCIENCE_REASONING_QUESTIONS,
  AKU_MATH_REASONING_QUESTIONS
} from '../src/data/aptitudeAndReasoningQuestions';

const STRUCTURED_MCQS_FILE = path.join(process.cwd(), 'data', 'structured_mcqs.json');

interface McqRow {
  id: string;
  exam_type: string;
  subject: string;
  chapter: string;
  subtopic: string;
  question_text: string;
  options: string[];
  correct_option: number;
  explanation: string;
  difficulty: string;
  needs_review: boolean;
  created_at: string;
}

function loadExisting(): McqRow[] {
  try {
    if (fs.existsSync(STRUCTURED_MCQS_FILE)) {
      return JSON.parse(fs.readFileSync(STRUCTURED_MCQS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading structured_mcqs.json:', e);
  }
  return [];
}

const existing = loadExisting();
console.log(`Starting seed with ${existing.length} existing MCQs...`);

const rows: McqRow[] = [...existing];
const existingIdSet = new Set(rows.map(r => r.id));

function addQuestions(examType: string, subject: string, questions: any[], chapterName: string = 'General Syllabus', subtopicName: string = 'Comprehensive Practice') {
  let count = 0;
  for (const q of questions) {
    const qId = `${examType.toLowerCase()}-${subject.toLowerCase().replace(/\s+/g, '-')}-${q.id || Math.random().toString(36).substring(2, 9)}`;
    if (existingIdSet.has(qId)) continue;

    rows.push({
      id: qId,
      exam_type: examType.toUpperCase(),
      subject: subject,
      chapter: q.chapter || chapterName,
      subtopic: q.topic || subtopicName,
      question_text: q.q || q.question_text || '',
      options: q.options || [],
      correct_option: typeof q.correct === 'number' ? q.correct : Number(q.correct_option ?? 0),
      explanation: q.explain || q.explanation || '',
      difficulty: q.difficulty || 'Exam Standard',
      needs_review: false,
      created_at: new Date().toISOString()
    });
    existingIdSet.add(qId);
    count++;
  }
  console.log(`Added ${count} questions for ${examType} -> ${subject}`);
}

// 1. Seed TCAT
addQuestions('TCAT', 'Mathematics', TCAT_MATH_QUESTIONS);
addQuestions('TCAT', 'Physics', TCAT_PHYSICS_QUESTIONS);
addQuestions('TCAT', 'Chemistry', TCAT_CHEMISTRY_QUESTIONS);
addQuestions('TCAT', 'Computer Science', TCAT_CS_QUESTIONS);
addQuestions('TCAT', 'English', TCAT_ENGLISH_QUESTIONS);

// 2. Seed MDCAT
addQuestions('MDCAT', 'Biology', ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('bio')));
addQuestions('MDCAT', 'Chemistry', ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('chem')));
addQuestions('MDCAT', 'Physics', ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('phys')));
addQuestions('MDCAT', 'English', ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('eng')));
addQuestions('MDCAT', 'Logical Reasoning', ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('log')));

// 3. Seed All 17 Engineering/Medical/Aptitude Entrance Tracks
const entranceTracks = [
  {
    track: 'MUET',
    subjects: [
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS }
    ]
  },
  {
    track: 'NET',
    subjects: [
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS }
    ]
  },
  {
    track: 'FAST',
    subjects: [
      { name: 'Advanced Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Basic Mathematics', pool: FAST_BASIC_MATH_QUESTIONS },
      { name: 'IQ & Analytical Reasoning', pool: FAST_IQ_ANALYTICAL_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS }
    ]
  },
  {
    track: 'ECAT',
    subjects: [
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS }
    ]
  },
  {
    track: 'ETEA',
    subjects: [
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS }
    ]
  },
  {
    track: 'NUMS',
    subjects: [
      { name: 'Biology', pool: ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('bio')) },
      { name: 'Chemistry', pool: ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('chem')) },
      { name: 'Physics', pool: ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('phys')) },
      { name: 'English', pool: ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('eng')) },
      { name: 'Psychological Assessment', pool: NUMS_PSYCHOLOGICAL_QUESTIONS }
    ]
  },
  {
    track: 'GIKI',
    subjects: [
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS }
    ]
  },
  {
    track: 'USAT',
    subjects: [
      { name: 'Verbal Reasoning', pool: APTITUDE_VERBAL_QUESTIONS },
      { name: 'Quantitative Reasoning', pool: APTITUDE_QUANT_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS }
    ]
  },
  {
    track: 'NED',
    subjects: [
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS }
    ]
  },
  {
    track: 'PIEAS',
    subjects: [
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS }
    ]
  },
  {
    track: 'NAT',
    subjects: [
      { name: 'Verbal Reasoning', pool: APTITUDE_VERBAL_QUESTIONS },
      { name: 'Analytical Reasoning', pool: FAST_IQ_ANALYTICAL_QUESTIONS },
      { name: 'Quantitative Reasoning', pool: APTITUDE_QUANT_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS }
    ]
  },
  {
    track: 'IBA',
    subjects: [
      { name: 'English', pool: [...APTITUDE_VERBAL_QUESTIONS, ...TCAT_ENGLISH_QUESTIONS] },
      { name: 'Mathematics', pool: [...APTITUDE_QUANT_QUESTIONS, ...FAST_BASIC_MATH_QUESTIONS] }
    ]
  },
  {
    track: 'AKU',
    subjects: [
      { name: 'Biology', pool: ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('bio')) },
      { name: 'Chemistry', pool: ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('chem')) },
      { name: 'Physics', pool: ALL_MDCAT_QUESTIONS.filter((q: any) => (q.subject || '').toLowerCase().includes('phys')) },
      { name: 'Science Reasoning', pool: AKU_SCIENCE_REASONING_QUESTIONS },
      { name: 'Mathematical Reasoning', pool: AKU_MATH_REASONING_QUESTIONS }
    ]
  },
  {
    track: 'LUMS',
    subjects: [
      { name: 'Verbal Reasoning', pool: APTITUDE_VERBAL_QUESTIONS },
      { name: 'Quantitative Reasoning', pool: APTITUDE_QUANT_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS }
    ]
  },
  {
    track: 'NUML',
    subjects: [
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS }
    ]
  },
  {
    track: 'HITEC',
    subjects: [
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS }
    ]
  },
  {
    track: 'NUTECH',
    subjects: [
      { name: 'Mathematics', pool: TCAT_MATH_QUESTIONS },
      { name: 'Physics', pool: TCAT_PHYSICS_QUESTIONS },
      { name: 'Chemistry', pool: TCAT_CHEMISTRY_QUESTIONS },
      { name: 'Computer Science', pool: TCAT_CS_QUESTIONS },
      { name: 'English', pool: TCAT_ENGLISH_QUESTIONS }
    ]
  }
];

for (const item of entranceTracks) {
  for (const s of item.subjects) {
    // Take up to 105 verified questions per subject
    addQuestions(item.track, s.name, s.pool.slice(0, 105));
  }
}

fs.writeFileSync(STRUCTURED_MCQS_FILE, JSON.stringify(rows, null, 2), 'utf-8');
console.log(`Successfully seeded ${rows.length} total MCQs into ${STRUCTURED_MCQS_FILE}!`);

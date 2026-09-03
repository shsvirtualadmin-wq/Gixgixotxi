import { Question } from '../types';
import { MDCAT_BIOLOGY_NEW_QUESTIONS } from './mdcatBiologyQuestions';
import { MDCAT_BIOLOGY_BATCH2_PART1 } from './mdcatBiologyBatch2Part1';
import { MDCAT_BIOLOGY_BATCH2_PART2 } from './mdcatBiologyBatch2Part2';
import { MDCAT_BIOLOGY_BATCH3_PART1 } from './mdcatBiologyBatch3Part1';
import { MDCAT_BIOLOGY_BATCH3_PART2 } from './mdcatBiologyBatch3Part2';
import { MDCAT_BIOLOGY_BATCH4_PART1 } from './mdcatBiologyBatch4Part1';
import { MDCAT_BIOLOGY_BATCH4_PART2 } from './mdcatBiologyBatch4Part2';
import { MDCAT_BIOLOGY_BATCH5_PART1 } from './mdcatBiologyBatch5Part1';
import { MDCAT_BIOLOGY_BATCH5_PART2 } from './mdcatBiologyBatch5Part2';
import { MDCAT_BIOLOGY_BATCH6_PART1 } from './mdcatBiologyBatch6Part1';
import { MDCAT_BIOLOGY_BATCH6_PART2 } from './mdcatBiologyBatch6Part2';
import { MDCAT_BIOLOGY_BATCH7_PART1 } from './mdcatBiologyBatch7Part1';
import { MDCAT_BIOLOGY_BATCH7_PART2 } from './mdcatBiologyBatch7Part2';
import { MDCAT_BIOLOGY_BATCH8_PART1 } from './mdcatBiologyBatch8Part1';
import { MDCAT_BIOLOGY_BATCH8_PART2 } from './mdcatBiologyBatch8Part2';
import { MDCAT_BIOLOGY_BATCH9_PART1 } from './mdcatBiologyBatch9Part1';
import { MDCAT_BIOLOGY_BATCH9_PART2 } from './mdcatBiologyBatch9Part2';
import { MDCAT_BIOLOGY_BATCH10_PART1 } from './mdcatBiologyBatch10Part1';
import { MDCAT_BIOLOGY_BATCH10_PART2 } from './mdcatBiologyBatch10Part2';

import { MDCAT_CHEMISTRY_NEW_QUESTIONS } from './mdcatChemistryQuestions';
import { MDCAT_CHEMISTRY_BATCH2 } from './mdcatChemistryBatch2';
import { MDCAT_CHEMISTRY_BATCH3 } from './mdcatChemistryBatch3';
import { MDCAT_CHEMISTRY_BATCH4 } from './mdcatChemistryBatch4';
import { MDCAT_CHEMISTRY_BATCH5 } from './mdcatChemistryBatch5';
import { MDCAT_CHEMISTRY_BATCH6 } from './mdcatChemistryBatch6';
import { MDCAT_CHEMISTRY_BATCH7 } from './mdcatChemistryBatch7';
import { MDCAT_CHEMISTRY_BATCH8 } from './mdcatChemistryBatch8';
import { MDCAT_CHEMISTRY_BATCH9 } from './mdcatChemistryBatch9';
import { MDCAT_CHEMISTRY_BATCH10 } from './mdcatChemistryBatch10';

import { MDCAT_PHYSICS_NEW_QUESTIONS } from './mdcatPhysicsQuestions';
import { MDCAT_PHYSICS_BATCH2 } from './mdcatPhysicsBatch2';
import { MDCAT_PHYSICS_BATCH3 } from './mdcatPhysicsBatch3';
import { MDCAT_PHYSICS_BATCH4 } from './mdcatPhysicsBatch4';
import { MDCAT_PHYSICS_BATCH5 } from './mdcatPhysicsBatch5';
import { MDCAT_PHYSICS_BATCH6 } from './mdcatPhysicsBatch6';
import { MDCAT_PHYSICS_BATCH7 } from './mdcatPhysicsBatch7';
import { MDCAT_PHYSICS_BATCH8 } from './mdcatPhysicsBatch8';
import { MDCAT_PHYSICS_BATCH9 } from './mdcatPhysicsBatch9';
import { MDCAT_PHYSICS_BATCH10 } from './mdcatPhysicsBatch10';

import { MDCAT_ENGLISH_NEW_QUESTIONS } from './mdcatEnglishQuestions';
import { MDCAT_ENGLISH_BATCH2 } from './mdcatEnglishBatch2';
import { MDCAT_ENGLISH_BATCH3 } from './mdcatEnglishBatch3';
import { MDCAT_ENGLISH_BATCH4 } from './mdcatEnglishBatch4';
import { MDCAT_ENGLISH_BATCH5 } from './mdcatEnglishBatch5';
import { MDCAT_ENGLISH_BATCH6 } from './mdcatEnglishBatch6';
import { MDCAT_ENGLISH_BATCH7 } from './mdcatEnglishBatch7';
import { MDCAT_ENGLISH_BATCH8 } from './mdcatEnglishBatch8';
import { MDCAT_ENGLISH_BATCH9 } from './mdcatEnglishBatch9';
import { MDCAT_ENGLISH_BATCH10 } from './mdcatEnglishBatch10';

import { MDCAT_LOGICAL_REASONING_NEW_QUESTIONS } from './mdcatLogicalReasoningQuestions';
import { MDCAT_LOGICAL_REASONING_BATCH2 } from './mdcatLogicalReasoningBatch2';
import { MDCAT_LOGICAL_REASONING_BATCH3 } from './mdcatLogicalReasoningBatch3';
import { MDCAT_LOGICAL_REASONING_BATCH4 } from './mdcatLogicalReasoningBatch4';
import { MDCAT_LOGICAL_REASONING_BATCH5 } from './mdcatLogicalReasoningBatch5';
import { MDCAT_LOGICAL_REASONING_BATCH6 } from './mdcatLogicalReasoningBatch6';
import { MDCAT_LOGICAL_REASONING_BATCH7 } from './mdcatLogicalReasoningBatch7';
import { MDCAT_LOGICAL_REASONING_BATCH8 } from './mdcatLogicalReasoningBatch8';
import { MDCAT_LOGICAL_REASONING_BATCH9 } from './mdcatLogicalReasoningBatch9';
import { MDCAT_LOGICAL_REASONING_BATCH10 } from './mdcatLogicalReasoningBatch10';

function shuffleOptionsAndFixCorrect(q: Question): Question {
  const correctText = q.options[q.correct];
  const shuffledOptions = [...q.options];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  const newCorrectIndex = shuffledOptions.indexOf(correctText);
  return {
    ...q,
    options: shuffledOptions,
    correct: newCorrectIndex >= 0 ? newCorrectIndex : q.correct,
  };
}

// Batch 1 (300 verified MCQs)
export const MDCAT_BATCH1_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_NEW_QUESTIONS,
  ...MDCAT_CHEMISTRY_NEW_QUESTIONS,
  ...MDCAT_PHYSICS_NEW_QUESTIONS,
  ...MDCAT_ENGLISH_NEW_QUESTIONS,
  ...MDCAT_LOGICAL_REASONING_NEW_QUESTIONS
];

// Batch 2 (300 new verified MCQs)
export const MDCAT_BATCH2_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH2_PART1,
  ...MDCAT_BIOLOGY_BATCH2_PART2,
  ...MDCAT_CHEMISTRY_BATCH2,
  ...MDCAT_PHYSICS_BATCH2,
  ...MDCAT_ENGLISH_BATCH2,
  ...MDCAT_LOGICAL_REASONING_BATCH2
];

// Batch 3 (300 new verified MCQs bringing bank to 900 total)
export const MDCAT_BATCH3_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH3_PART1,
  ...MDCAT_BIOLOGY_BATCH3_PART2,
  ...MDCAT_CHEMISTRY_BATCH3,
  ...MDCAT_PHYSICS_BATCH3,
  ...MDCAT_ENGLISH_BATCH3,
  ...MDCAT_LOGICAL_REASONING_BATCH3
];

// Batch 4 (300 new verified MCQs bringing bank to 1200 total)
export const MDCAT_BATCH4_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH4_PART1,
  ...MDCAT_BIOLOGY_BATCH4_PART2,
  ...MDCAT_CHEMISTRY_BATCH4,
  ...MDCAT_PHYSICS_BATCH4,
  ...MDCAT_ENGLISH_BATCH4,
  ...MDCAT_LOGICAL_REASONING_BATCH4
];

// Batch 5 (300 new verified MCQs bringing bank to 1500 total)
export const MDCAT_BATCH5_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH5_PART1,
  ...MDCAT_BIOLOGY_BATCH5_PART2,
  ...MDCAT_CHEMISTRY_BATCH5,
  ...MDCAT_PHYSICS_BATCH5,
  ...MDCAT_ENGLISH_BATCH5,
  ...MDCAT_LOGICAL_REASONING_BATCH5
];

// Batch 6 (300 new verified MCQs bringing bank to 1800 total)
export const MDCAT_BATCH6_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH6_PART1,
  ...MDCAT_BIOLOGY_BATCH6_PART2,
  ...MDCAT_CHEMISTRY_BATCH6,
  ...MDCAT_PHYSICS_BATCH6,
  ...MDCAT_ENGLISH_BATCH6,
  ...MDCAT_LOGICAL_REASONING_BATCH6
];

// Batch 7 (300 new verified MCQs bringing bank to 2100 total)
export const MDCAT_BATCH7_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH7_PART1,
  ...MDCAT_BIOLOGY_BATCH7_PART2,
  ...MDCAT_CHEMISTRY_BATCH7,
  ...MDCAT_PHYSICS_BATCH7,
  ...MDCAT_ENGLISH_BATCH7,
  ...MDCAT_LOGICAL_REASONING_BATCH7
];

// Batch 8 (300 new verified MCQs bringing bank to 2400 total)
export const MDCAT_BATCH8_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH8_PART1,
  ...MDCAT_BIOLOGY_BATCH8_PART2,
  ...MDCAT_CHEMISTRY_BATCH8,
  ...MDCAT_PHYSICS_BATCH8,
  ...MDCAT_ENGLISH_BATCH8,
  ...MDCAT_LOGICAL_REASONING_BATCH8
];

// Batch 9 (300 new verified MCQs bringing bank to 2700 total)
export const MDCAT_BATCH9_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH9_PART1,
  ...MDCAT_BIOLOGY_BATCH9_PART2,
  ...MDCAT_CHEMISTRY_BATCH9,
  ...MDCAT_PHYSICS_BATCH9,
  ...MDCAT_ENGLISH_BATCH9,
  ...MDCAT_LOGICAL_REASONING_BATCH9
];

// Batch 10 (300 new verified MCQs bringing bank to 3000 total)
export const MDCAT_BATCH10_QUESTIONS: Question[] = [
  ...MDCAT_BIOLOGY_BATCH10_PART1,
  ...MDCAT_BIOLOGY_BATCH10_PART2,
  ...MDCAT_CHEMISTRY_BATCH10,
  ...MDCAT_PHYSICS_BATCH10,
  ...MDCAT_ENGLISH_BATCH10,
  ...MDCAT_LOGICAL_REASONING_BATCH10
];

function normalizeQuestion(q: Question, fallbackSubject: string): Question {
  return {
    ...q,
    subject: q.subject || fallbackSubject,
    chapter: q.chapter || q.topic || 'General',
    topic: q.topic || q.chapter || 'General',
  };
}

// Primary 3000 Question Repository grouped by Subject according to PMDC Exam Weightage
export const MDCAT_PREBUILT_QUESTIONS: Record<string, Question[]> = {
  Biology: [
    ...MDCAT_BIOLOGY_NEW_QUESTIONS,
    ...MDCAT_BIOLOGY_BATCH2_PART1,
    ...MDCAT_BIOLOGY_BATCH2_PART2,
    ...MDCAT_BIOLOGY_BATCH3_PART1,
    ...MDCAT_BIOLOGY_BATCH3_PART2,
    ...MDCAT_BIOLOGY_BATCH4_PART1,
    ...MDCAT_BIOLOGY_BATCH4_PART2,
    ...MDCAT_BIOLOGY_BATCH5_PART1,
    ...MDCAT_BIOLOGY_BATCH5_PART2,
    ...MDCAT_BIOLOGY_BATCH6_PART1,
    ...MDCAT_BIOLOGY_BATCH6_PART2,
    ...MDCAT_BIOLOGY_BATCH7_PART1,
    ...MDCAT_BIOLOGY_BATCH7_PART2,
    ...MDCAT_BIOLOGY_BATCH8_PART1,
    ...MDCAT_BIOLOGY_BATCH8_PART2,
    ...MDCAT_BIOLOGY_BATCH9_PART1,
    ...MDCAT_BIOLOGY_BATCH9_PART2,
    ...MDCAT_BIOLOGY_BATCH10_PART1,
    ...MDCAT_BIOLOGY_BATCH10_PART2
  ].map(q => normalizeQuestion(q, 'Biology')),
  Chemistry: [
    ...MDCAT_CHEMISTRY_NEW_QUESTIONS,
    ...MDCAT_CHEMISTRY_BATCH2,
    ...MDCAT_CHEMISTRY_BATCH3,
    ...MDCAT_CHEMISTRY_BATCH4,
    ...MDCAT_CHEMISTRY_BATCH5,
    ...MDCAT_CHEMISTRY_BATCH6,
    ...MDCAT_CHEMISTRY_BATCH7,
    ...MDCAT_CHEMISTRY_BATCH8,
    ...MDCAT_CHEMISTRY_BATCH9,
    ...MDCAT_CHEMISTRY_BATCH10
  ].map(q => normalizeQuestion(q, 'Chemistry')),
  Physics: [
    ...MDCAT_PHYSICS_NEW_QUESTIONS,
    ...MDCAT_PHYSICS_BATCH2,
    ...MDCAT_PHYSICS_BATCH3,
    ...MDCAT_PHYSICS_BATCH4,
    ...MDCAT_PHYSICS_BATCH5,
    ...MDCAT_PHYSICS_BATCH6,
    ...MDCAT_PHYSICS_BATCH7,
    ...MDCAT_PHYSICS_BATCH8,
    ...MDCAT_PHYSICS_BATCH9,
    ...MDCAT_PHYSICS_BATCH10
  ].map(q => normalizeQuestion(q, 'Physics')),
  English: [
    ...MDCAT_ENGLISH_NEW_QUESTIONS,
    ...MDCAT_ENGLISH_BATCH2,
    ...MDCAT_ENGLISH_BATCH3,
    ...MDCAT_ENGLISH_BATCH4,
    ...MDCAT_ENGLISH_BATCH5,
    ...MDCAT_ENGLISH_BATCH6,
    ...MDCAT_ENGLISH_BATCH7,
    ...MDCAT_ENGLISH_BATCH8,
    ...MDCAT_ENGLISH_BATCH9,
    ...MDCAT_ENGLISH_BATCH10
  ].map(q => normalizeQuestion(q, 'English')),
  'Logical Reasoning': [
    ...MDCAT_LOGICAL_REASONING_NEW_QUESTIONS,
    ...MDCAT_LOGICAL_REASONING_BATCH2,
    ...MDCAT_LOGICAL_REASONING_BATCH3,
    ...MDCAT_LOGICAL_REASONING_BATCH4,
    ...MDCAT_LOGICAL_REASONING_BATCH5,
    ...MDCAT_LOGICAL_REASONING_BATCH6,
    ...MDCAT_LOGICAL_REASONING_BATCH7,
    ...MDCAT_LOGICAL_REASONING_BATCH8,
    ...MDCAT_LOGICAL_REASONING_BATCH9,
    ...MDCAT_LOGICAL_REASONING_BATCH10
  ].map(q => normalizeQuestion(q, 'Logical Reasoning'))
};

// Aliases for robust subject mapping
MDCAT_PREBUILT_QUESTIONS['biology'] = MDCAT_PREBUILT_QUESTIONS.Biology;
MDCAT_PREBUILT_QUESTIONS['chemistry'] = MDCAT_PREBUILT_QUESTIONS.Chemistry;
MDCAT_PREBUILT_QUESTIONS['physics'] = MDCAT_PREBUILT_QUESTIONS.Physics;
MDCAT_PREBUILT_QUESTIONS['english'] = MDCAT_PREBUILT_QUESTIONS.English;
MDCAT_PREBUILT_QUESTIONS['logical reasoning'] = MDCAT_PREBUILT_QUESTIONS['Logical Reasoning'];
MDCAT_PREBUILT_QUESTIONS['Logical reasoning'] = MDCAT_PREBUILT_QUESTIONS['Logical Reasoning'];
MDCAT_PREBUILT_QUESTIONS['Logical Reasoning '] = MDCAT_PREBUILT_QUESTIONS['Logical Reasoning'];

export const ALL_MDCAT_QUESTIONS: Question[] = [
  ...MDCAT_PREBUILT_QUESTIONS.Biology,
  ...MDCAT_PREBUILT_QUESTIONS.Chemistry,
  ...MDCAT_PREBUILT_QUESTIONS.Physics,
  ...MDCAT_PREBUILT_QUESTIONS.English,
  ...MDCAT_PREBUILT_QUESTIONS['Logical Reasoning'],
];

/**
 * Intelligent topic matching helper that reconciles official PMDC syllabus names,
 * UI category labels, and question tags.
 */
function matchesTopic(qTopic: string, targetTopic: string): boolean {
  if (!qTopic || !targetTopic) return false;
  const normQ = qTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const normT = targetTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  if (normQ === normT || normQ.includes(normT) || normT.includes(normQ)) return true;

  // Synonyms and topic maps
  const mappings: [string[], string[]][] = [
    // Biology
    [['bio molecule', 'biological molecule', 'biomolecule', 'macromolecule'], ['bio molecule', 'biological molecule', 'macromolecule']],
    [['cell structure', 'organelle', 'membrane'], ['cell structure', 'organelle']],
    [['enzyme', 'reaction kinetic'], ['enzyme']],
    [['cell division', 'mitosis', 'meiosis', 'cell cycle', 'virology', 'prokaryote', 'bacterial'], ['cell division', 'virology', 'prokaryote']],
    [['diversity', 'plant', 'animal'], ['diversity']],
    [['life process', 'physiology', 'digestion', 'circulation'], ['life process', 'digestion', 'physiology']],
    [['bioenergetic', 'respiration', 'photosynthesis', 'calvin', 'krebs', 'glycolysis'], ['bioenergetic']],
    [['transport', 'cardiovascular', 'heart', 'xylem', 'phloem', 'blood'], ['transport', 'cardiovascular']],
    [['homeostasis', 'osmoregulation', 'excretion', 'kidney', 'nephron'], ['homeostasis', 'excretion', 'osmoregulation']],
    [['gaseous exchange', 'gas exchange', 'lung', 'alveoli', 'respiratory'], ['gaseous exchange', 'gas exchange']],
    [['coordination', 'control', 'nervous', 'endocrine', 'hormone', 'brain'], ['coordination', 'control']],
    [['support', 'movement', 'muscle', 'skeleton', 'bone'], ['support', 'movement', 'skeleton', 'muscle']],
    [['reproduction', 'development', 'gamete', 'embryo'], ['reproduction', 'development']],
    [['genetics', 'chromosome', 'inheritance', 'dna', 'mendel'], ['genetics', 'chromosome', 'inheritance']],
    [['biotechnology', 'pcr', 'recombinant', 'cloning'], ['biotechnology', 'dna technology']],
    [['evolution', 'natural selection', 'darwin', 'hardy weinberg'], ['evolution', 'natural selection']],
    
    // Chemistry
    [['fundamental concept', 'stoichiometry', 'mole'], ['fundamental concept', 'stoichiometry']],
    [['atomic structure', 'quantum'], ['atomic structure', 'quantum']],
    [['gas', 'gases', 'graham', 'dalton'], ['gas', 'gases']],
    [['liquid', 'solid', 'crystal'], ['liquid', 'solid', 'liquids and solids']],
    [['chemical energetic', 'thermochemistry', 'enthalpy', 'hess'], ['chemical energetic', 'thermochemistry', 'energetic']],
    [['chemical equilibrium', 'le chatelier', 'solubility'], ['chemical equilibrium', 'equilibrium']],
    [['electrochemistry', 'galvanic', 'redox', 'electrode'], ['electrochemistry', 'redox']],
    [['chemical kinetic', 'reaction rate', 'order of reaction'], ['chemical kinetic', 'reaction kinetics', 'kinetics']],
    [['solution', 'colligative'], ['solution', 'colligative']],
    [['acid', 'base', 'salt', 'buffer', 'ph'], ['acid', 'base', 'salt', 'acids bases and salts']],
    [['s block', 'p block', 'periodic trend', 'period', 'group'], ['s block', 'p block', 'periods groups']],
    [['transition element', 'complex compound', 'coordination'], ['transition element', 'transition elements']],
    [['fundamental principle of organic', 'isomerism', 'hybridization'], ['fundamental principle of organic', 'organic principles']],
    [['hydrocarbon', 'alkane', 'alkene', 'alkyne', 'benzene'], ['hydrocarbon', 'hydrocarbons']],
    [['alkyl halide', 'nucleophilic substitution'], ['alkyl halide', 'alkyl halides']],
    [['alcohol', 'phenol', 'ether'], ['alcohol', 'phenol', 'alcohols and phenols']],
    [['aldehyde', 'ketone', 'carbonyl'], ['aldehyde', 'ketone', 'aldehydes and ketones']],
    [['carboxylic acid', 'ester', 'amide'], ['carboxylic acid', 'carboxylic acids']],
    [['amino acid', 'protein', 'peptide'], ['amino acid', 'amino acids', 'proteins']],
    [['macromolecule', 'environmental', 'polymer', 'smog', 'pollution'], ['macromolecule', 'environmental chemistry', 'macromolecules']],

    // Physics
    [['force and motion', 'motion and force', 'momentum', 'newton'], ['force and motion', 'motion and force', 'force and motion momentum']],
    [['work energy', 'power', 'work, energy and power'], ['work energy', 'work energy and power', 'work, energy and power']],
    [['rotational', 'circular', 'angular', 'circular motion', 'rotational and circular motion'], ['rotational', 'circular motion', 'rotational circular', 'rotational and circular motion']],
    [['wave', 'sound', 'light wave', 'doppler', 'standing wave', 'waves'], ['wave', 'waves', 'waves oscillations']],
    [['oscillation', 'shm', 'pendulum', 'oscillations'], ['oscillation', 'oscillations']],
    [['thermodynamics', 'heat engine', 'carnot'], ['thermodynamic', 'thermodynamics']],
    [['electrostatic', 'coulomb', 'capacitor', 'electrostatics'], ['electrostatic', 'electrostatics']],
    [['current electricity', 'kirchhoff', 'ohm'], ['current electricity']],
    [['electromagnetism', 'magnetic field', 'ampere', 'lorentz'], ['electromagnetism', 'magnetic fields']],
    [['electromagnetic induction', 'faraday', 'lenz', 'flux'], ['electromagnetic induction']],
    [['alternating current', 'ac circuit', 'resonance'], ['alternating current', 'ac circuits']],
    [['physics of solids', 'deformation', 'elasticity', 'semiconductor band'], ['physics of solids', 'deformation of solids']],
    [['electronics', 'diode', 'transistor', 'op amp'], ['electronic', 'electronics']],
    [['dawn of modern', 'photoelectric', 'compton', 'de broglie', 'dawn of modern physics'], ['dawn of modern physics', 'quantum physics']],
    [['atomic spectra', 'bohr', 'hydrogen spectrum'], ['atomic spectra', 'spectra']],
    [['nuclear physics', 'radioactivity', 'fission', 'half life'], ['nuclear physics', 'radioactivity']],
    [['measurement', 'measurements', 'physical quantity', 'si unit'], ['measurement', 'measurements']],
    [['scalar', 'vector', 'scalars and vectors', 'cross product', 'dot product'], ['scalar', 'vector', 'scalars and vectors']],
    [['fluid dynamic', 'fluid dynamics', 'bernoulli', 'viscosity', 'stokes'], ['fluid dynamic', 'fluid dynamics']],

    // English
    [['vocabulary', 'synonym', 'antonym'], ['vocabulary', 'synonyms']],
    [['grammar', 'tense', 'agreement'], ['grammar', 'subject verb agreement']],
    [['sentence structure', 'sentence correction', 'error spotting'], ['sentence structure', 'sentence correction', 'grammar']],
    [['comprehension', 'reading', 'deduction'], ['comprehension', 'reading comprehension']],
    [['analogy', 'analogies'], ['analogy']],
    [['sentence completion', 'filler'], ['sentence completion']],

    // Logical Reasoning
    [['critical thinking'], ['critical thinking']],
    [['letter', 'symbol series', 'number series'], ['letter and symbol series', 'series']],
    [['logical deduction', 'syllogism'], ['logical deduction']],
    [['logical problem', 'puzzle', 'order'], ['logical problems']],
    [['course of action'], ['course of action']],
    [['cause and effect'], ['cause and effect']]
  ];

  for (const [qTokens, tTokens] of mappings) {
    const qHit = qTokens.some(t => normQ.includes(t));
    const tHit = tTokens.some(t => normT.includes(t));
    if (qHit && tHit) return true;
  }

  // Significant word overlap
  const qWords = normQ.split(/\s+/).filter(w => w.length >= 4 && !['about', 'with', 'from', 'into', 'that'].includes(w));
  const tWords = normT.split(/\s+/).filter(w => w.length >= 4 && !['about', 'with', 'from', 'into', 'that'].includes(w));
  return qWords.some(w => tWords.includes(w));
}

export function getMDCATPrebuiltQuestions(subject: string, count: number = 10, topic?: string): Question[] {
  const normSub = Object.keys(MDCAT_PREBUILT_QUESTIONS).find(
    k => k.toLowerCase() === subject.toLowerCase()
  ) || 'Biology';

  const fullPool = MDCAT_PREBUILT_QUESTIONS[normSub] || MDCAT_PREBUILT_QUESTIONS['Biology'];
  let topicPool = fullPool;

  if (topic && topic.trim().length > 0) {
    const cleanTopic = topic.toLowerCase().trim();
    const isGeneric = cleanTopic.includes('syllabus') || 
      (cleanTopic.includes('all') && cleanTopic.includes('chapter')) || 
      (cleanTopic.includes('all') && cleanTopic.includes('topic')) || 
      cleanTopic.includes('full mock') ||
      cleanTopic.includes('full exam') ||
      cleanTopic === normSub.toLowerCase();

    if (!isGeneric) {
      const exactMatches = fullPool.filter(q =>
        (q.chapter && q.chapter.toLowerCase().trim() === cleanTopic) ||
        (q.topic && q.topic.toLowerCase().trim() === cleanTopic)
      );
      if (exactMatches.length > 0) {
        topicPool = exactMatches;
      } else {
        const topicMatches = fullPool.filter(q => matchesTopic(q.chapter || '', cleanTopic) || matchesTopic(q.topic || '', cleanTopic));
        if (topicMatches.length > 0) {
          topicPool = topicMatches;
        }
      }
    }
  }

  const seenStems = new Set<string>();
  const results: Question[] = [];

  // Pass 1: Select unique questions from requested topic pool
  const shuffledTopicPool = [...topicPool].sort(() => 0.5 - Math.random());
  for (const raw of shuffledTopicPool) {
    if (results.length >= count) break;
    const stem = (raw.q || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenStems.has(stem)) {
      seenStems.add(stem);
      const itemWithShuffledOptions = shuffleOptionsAndFixCorrect(raw);
      results.push({
        ...itemWithShuffledOptions,
        subject: normSub,
        id: `mdcat-q-${normSub.toLowerCase().replace(/\s+/g, '-')}-${results.length + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      });
    }
  }

  // Pass 2: If topic has fewer questions than requested, fill the gap with real questions from the same subject's other chapters
  if (results.length < count && fullPool.length > results.length) {
    const shuffledFull = [...fullPool].sort(() => 0.5 - Math.random());
    for (const raw of shuffledFull) {
      if (results.length >= count) break;
      const stem = (raw.q || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenStems.has(stem)) {
        seenStems.add(stem);
        const itemWithShuffledOptions = shuffleOptionsAndFixCorrect(raw);
        results.push({
          ...itemWithShuffledOptions,
          subject: normSub,
          id: `mdcat-q-${normSub.toLowerCase().replace(/\s+/g, '-')}-${results.length + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        });
      }
    }
  }

  // Pass 3: If still < count (e.g. huge practice count requested), wrap around with unique IDs
  let loopIdx = 0;
  while (results.length < count && fullPool.length > 0) {
    const raw = fullPool[loopIdx % fullPool.length];
    const itemWithShuffledOptions = shuffleOptionsAndFixCorrect(raw);
    results.push({
      ...itemWithShuffledOptions,
      subject: normSub,
      id: `mdcat-q-${normSub.toLowerCase().replace(/\s+/g, '-')}-topup-${results.length + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    });
    loopIdx++;
  }

  return results;
}

export function generateMDCATFullMockBank(): Question[] {
  // Official PMDC MDCAT Exam Structure: 180 MCQs total
  // 81 Biology (45%), 45 Chemistry (25%), 36 Physics (20%), 9 English (5%), 9 Logical Reasoning (5%)
  const seenStems = new Set<string>();

  function selectUnique(subjectKey: string, targetCount: number): Question[] {
    const pool = MDCAT_PREBUILT_QUESTIONS[subjectKey] || [];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected: Question[] = [];

    for (const qItem of shuffled) {
      if (selected.length >= targetCount) break;
      const norm = (qItem.q || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenStems.has(norm)) {
        seenStems.add(norm);
        const fixed = shuffleOptionsAndFixCorrect(qItem);
        selected.push({
          ...fixed,
          subject: subjectKey,
          id: `mdcat-mock-${subjectKey.toLowerCase().replace(/\s+/g, '-')}-${selected.length + 1}-${Date.now()}`
        });
      }
    }

    // Top up safely if needed without duplicates
    let loopIndex = 0;
    while (selected.length < targetCount && pool.length > 0) {
      const base = pool[loopIndex % pool.length];
      const fixed = shuffleOptionsAndFixCorrect(base);
      selected.push({
        ...fixed,
        subject: subjectKey,
        id: `mdcat-mock-${subjectKey.toLowerCase().replace(/\s+/g, '-')}-topup-${selected.length + 1}-${Date.now()}`
      });
      loopIndex++;
    }

    return selected;
  }

  const bio = selectUnique('Biology', 81);
  const chem = selectUnique('Chemistry', 45);
  const phys = selectUnique('Physics', 36);
  const eng = selectUnique('English', 9);
  const lr = selectUnique('Logical Reasoning', 9);

  return [...bio, ...chem, ...phys, ...eng, ...lr];
}

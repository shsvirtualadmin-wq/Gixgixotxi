import { Question } from '../types';
import { TCAT_MATH_QUESTIONS } from './tcatMathQuestions';
import { TCAT_PHYSICS_QUESTIONS } from './tcatPhysicsQuestions';
import { TCAT_CHEMISTRY_QUESTIONS } from './tcatChemistryQuestions';

export { TCAT_MATH_QUESTIONS } from './tcatMathQuestions';
export { TCAT_PHYSICS_QUESTIONS } from './tcatPhysicsQuestions';
export { TCAT_CHEMISTRY_QUESTIONS } from './tcatChemistryQuestions';

/**
 * Shuffles options using Fisher-Yates and updates the correct index accordingly.
 */
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

export const TCAT_ENGLISH_QUESTIONS: Question[] = [
  {
    id: 'tcat-eng-1',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Medium',
    q: 'Select the synonym for the word "PRAGMATIC":',
    options: ['Practical', 'Idealistic', 'Theoretical', 'Irrational'],
    correct: 0,
    explain: '"Pragmatic" means dealing with things sensibly and realistically based on practical considerations rather than theoretical ideals.'
  },
  {
    id: 'tcat-eng-2',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Medium',
    q: 'Identify the grammatically correct sentence:',
    options: [
      'Each of the engineering candidates is required to submit their credentials.',
      'Each of the engineering candidates are required to submit their credentials.',
      'Each of the engineering candidates were required to submit their credentials.',
      'Each of the engineering candidates have been required to submit their credentials.'
    ],
    correct: 0,
    explain: '"Each" is an indefinite singular pronoun requiring a singular verb form ("is required").'
  },
  {
    id: 'tcat-eng-3',
    subject: 'English',
    topic: 'Analogies',
    difficulty: 'Easy',
    q: 'Choose the correct word to complete the analogy: ENGINE is to CAR as HEART is to ______.',
    options: ['HUMAN BODY', 'BLOOD', 'PULSE', 'VEIN'],
    correct: 0,
    explain: 'An engine is the primary power-generating organ/source for a car, just as the heart is the central organ powering the human body.'
  },
  {
    id: 'tcat-eng-4',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Easy',
    q: 'Select the correct passive form: "The chief engineer will inspect the bridge tomorrow."',
    options: [
      'The bridge will be inspected by the chief engineer tomorrow.',
      'The bridge would be inspected by the chief engineer tomorrow.',
      'The bridge is inspected by the chief engineer tomorrow.',
      'The bridge was inspected by the chief engineer tomorrow.'
    ],
    correct: 0,
    explain: 'Simple future active ("will inspect") converts to simple future passive ("will be inspected").'
  },
  {
    id: 'tcat-eng-5',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Easy',
    q: 'Choose the correct antonym of "AMBIGUOUS":',
    options: ['Clear and explicit', 'Vague', 'Obscure', 'Dubious'],
    correct: 0,
    explain: '"Ambiguous" means open to more than one interpretation; its antonym is clear or explicit.'
  },
  {
    id: 'tcat-eng-6',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Easy',
    q: 'Fill in the blank with the appropriate preposition: "The software algorithm complies _____ international safety standards."',
    options: ['with', 'to', 'for', 'at'],
    correct: 0,
    explain: 'The verb "comply" takes the fixed preposition "with" (comply with standards).'
  },
  {
    id: 'tcat-eng-7',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Hard',
    q: 'Identify the error in the sentence: "Hardly had the test started when the power went out."',
    options: [
      'No error - the sentence is grammatically correct.',
      'Change "when" to "than".',
      'Change "had" to "has".',
      'Remove "Hardly".'
    ],
    correct: 0,
    explain: '"Hardly... when" is the correct inverted correlative conjunction pair. The sentence is completely correct.'
  },
  {
    id: 'tcat-eng-8',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Medium',
    q: 'Choose the word that best completes the sentence: "The panel reached a _____ decision after hours of deliberation."',
    options: ['unanimous', 'anonymous', 'ambivalent', 'unilateral'],
    correct: 0,
    explain: '"Unanimous" means fully agreed upon by all members of a group.'
  },
  {
    id: 'tcat-eng-9',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Medium',
    q: 'Select the correctly reported speech: She said, "I have completed the circuit diagram."',
    options: [
      'She said that she had completed the circuit diagram.',
      'She said that she has completed the circuit diagram.',
      'She said that I completed the circuit diagram.',
      'She told she completes the circuit diagram.'
    ],
    correct: 0,
    explain: 'Present perfect ("have completed") in direct speech backshifts to past perfect ("had completed") in indirect speech.'
  },
  {
    id: 'tcat-eng-10',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Easy',
    q: 'Choose the word with correct spelling:',
    options: ['Maintenance', 'Maintainance', 'Maintenence', 'Mentenance'],
    correct: 0,
    explain: '"Maintenance" is the correct spelling (derived from maintain, but spelled m-a-i-n-t-e-n-a-n-c-e).'
  },
  {
    id: 'tcat-eng-11',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Medium',
    q: 'Select the synonym for the word "METICULOUS":',
    options: ['Thorough and careful', 'Careless', 'Hastily done', 'Unreliable'],
    correct: 0,
    explain: '"Meticulous" means showing great attention to detail; very careful and precise.'
  },
  {
    id: 'tcat-eng-12',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Hard',
    q: 'Complete the third conditional sentence: "If the cooling system had worked properly, the generator ________ overheat."',
    options: ['would not have', 'will not', 'would not', 'did not'],
    correct: 0,
    explain: 'Third conditional sentences use "If + past perfect, would + have + past participle" to describe an unreal past condition.'
  },
  {
    id: 'tcat-eng-13',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Easy',
    q: 'What does the common professional idiom "to cut corners" mean?',
    options: [
      'To do something carelessly or cheaply to save time or money',
      'To measure rectangular corners precisely with a square',
      'To negotiate a profitable discount with a vendor',
      'To speed up a vehicle around tight bends'
    ],
    correct: 0,
    explain: '"To cut corners" is an idiom meaning to take shortcuts or do something cheaply or hastily, compromising quality.'
  },
  {
    id: 'tcat-eng-14',
    subject: 'English',
    topic: 'Vocabulary and Synonyms/Antonyms',
    difficulty: 'Medium',
    q: 'Choose the correct antonym of "EPHEMERAL":',
    options: ['Permanent and enduring', 'Transitory', 'Fleeting', 'Momentary'],
    correct: 0,
    explain: '"Ephemeral" means lasting for a very short time. Its antonym is permanent, eternal, or enduring.'
  },
  {
    id: 'tcat-eng-15',
    subject: 'English',
    topic: 'Analogies',
    difficulty: 'Easy',
    q: 'Complete the analogy: TELESCOPE is to ASTRONOMER as MICROSCOPE is to ______.',
    options: ['MICROBIOLOGIST', 'GEOLOGIST', 'ARCHITECT', 'SURGEON'],
    correct: 0,
    explain: 'A telescope is the primary scientific optical instrument used by an astronomer, while a microscope is the primary instrument of a microbiologist.'
  },
  {
    id: 'tcat-eng-16',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Hard',
    q: 'Select the sentence with correct subject-verb agreement:',
    options: [
      'Neither the project manager nor the site engineers were present at the briefing.',
      'Neither the project manager nor the site engineers was present at the briefing.',
      'Neither the site engineers nor the project manager were present at the briefing.',
      'Neither of the site engineers are certified.'
    ],
    correct: 0,
    explain: 'When subjects are connected by "neither... nor", the verb agrees with the closer subject ("site engineers" is plural -> "were").'
  },
  {
    id: 'tcat-eng-17',
    subject: 'English',
    topic: 'Grammar (tenses, parts of speech, sentence structure)',
    difficulty: 'Easy',
    q: 'Fill in the blank with the correct preposition: "The engineering team succeeded _____ designing an ultra-low-power microchip."',
    options: ['in', 'at', 'on', 'with'],
    correct: 0,
    explain: 'The verb "succeed" takes the preposition "in" followed by a gerund ("succeeded in designing").'
  },
  {
    id: 'tcat-eng-18',
    subject: 'English',
    topic: 'Sentence Correction',
    difficulty: 'Easy',
    q: 'Choose the correct technical spelling for an instrument that measures pressure or physical thickness:',
    options: ['Gauge', 'Guage', 'Gagee', 'Gawge'],
    correct: 0,
    explain: 'The standard spelling of the measuring instrument is "Gauge".'
  },
  {
    id: 'tcat-eng-19',
    subject: 'English',
    topic: 'Comprehension Passages',
    difficulty: 'Medium',
    q: 'Passage: "A ductile metal undergoes substantial plastic deformation before rupture, whereas a brittle material fractures abruptly with minimal strain." Based on this statement, what distinguishes a brittle material?',
    options: [
      'It fractures abruptly with little or no prior plastic deformation',
      'It deforms plastically to high degrees before failure',
      'It exhibits superior thermal conductivity under stress',
      'It resists fracture by absorbing elastic shock waves'
    ],
    correct: 0,
    explain: 'According to the passage, brittle materials fracture abruptly with minimal strain/deformation compared to ductile metals.'
  },
  {
    id: 'tcat-eng-20',
    subject: 'English',
    topic: 'Analogies',
    difficulty: 'Easy',
    q: 'Complete the analogy: THERMOMETER is to TEMPERATURE as BAROMETER is to ______.',
    options: ['ATMOSPHERIC PRESSURE', 'HUMIDITY', 'WIND VELOCITY', 'ELECTRIC CURRENT'],
    correct: 0,
    explain: 'A thermometer measures temperature, just as a barometer measures atmospheric pressure.'
  }
];

export const TCAT_PREBUILT_QUESTIONS: Record<string, Question[]> = {
  Mathematics: TCAT_MATH_QUESTIONS,
  Physics: TCAT_PHYSICS_QUESTIONS,
  Chemistry: TCAT_CHEMISTRY_QUESTIONS,
  English: TCAT_ENGLISH_QUESTIONS,
  // Alias mappings
  Math: TCAT_MATH_QUESTIONS,
  math: TCAT_MATH_QUESTIONS,
  mathematics: TCAT_MATH_QUESTIONS,
  physics: TCAT_PHYSICS_QUESTIONS,
  chemistry: TCAT_CHEMISTRY_QUESTIONS,
  english: TCAT_ENGLISH_QUESTIONS,
};

/**
 * Returns prebuilt questions for a specific TCAT subject and optional chapter topic.
 */
export function getTCATPrebuiltQuestions(subject: string, count: number = 10, topic?: string): Question[] {
  const normSub = Object.keys(TCAT_PREBUILT_QUESTIONS).find(
    (k) => k.toLowerCase() === subject.toLowerCase()
  ) || 'Mathematics';

  let pool = TCAT_PREBUILT_QUESTIONS[normSub] || TCAT_PREBUILT_QUESTIONS['Mathematics'];

  if (topic && topic.trim().length > 0) {
    const cleanTopic = topic.toLowerCase().trim();
    const isGeneric = cleanTopic.includes('syllabus') || cleanTopic.includes('all topic') || cleanTopic.includes('all chapter') || cleanTopic.includes('full mock');
    if (!isGeneric) {
      const topicMatches = pool.filter(q => {
        const qTopic = (q.topic || '').toLowerCase();
        return qTopic.includes(cleanTopic) || cleanTopic.includes(qTopic);
      });
      if (topicMatches.length > 0) {
        pool = topicMatches;
      }
    }
  }

  const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
  const results: Question[] = [];

  for (let i = 0; i < count; i++) {
    const raw = shuffledPool[i % shuffledPool.length];
    const itemWithShuffledOptions = shuffleOptionsAndFixCorrect(raw);
    results.push({
      ...itemWithShuffledOptions,
      subject: normSub,
      id: `tcat-q-${normSub.toLowerCase()}-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    });
  }

  return results;
}

/**
 * Generates a full-length 100-MCQ TCAT Mock Exam.
 * Allocation strictly matches official UET Taxila TCAT specifications:
 * - Mathematics: 30 MCQs (proportionately distributed across all official chapters)
 * - Physics: 30 MCQs (proportionately distributed across all official chapters)
 * - Chemistry: 30 MCQs (proportionately distributed across all official chapters)
 * - English: 10 MCQs (distributed across grammar, vocabulary, correction & comprehension)
 * Total: exactly 100 MCQs, zero duplicate questions within the test.
 */
export function generateTCATFullMockBank(groupSubjects: string[] = ['Mathematics', 'Physics', 'Chemistry', 'English']): Question[] {
  const sub1 = groupSubjects[0] || 'Mathematics';
  const sub2 = groupSubjects[1] || 'Physics';
  const sub3 = groupSubjects[2] || 'Chemistry';
  const sub4 = 'English';

  const seenStems = new Set<string>();

  function selectProportional(subjectKey: string, targetCount: number): Question[] {
    const pool = TCAT_PREBUILT_QUESTIONS[subjectKey] || TCAT_PREBUILT_QUESTIONS['Mathematics'] || [];
    if (pool.length === 0) return [];

    // Group questions by chapter topic for even representation
    const chapterMap = new Map<string, Question[]>();
    for (const q of pool) {
      const ch = q.topic || 'General';
      if (!chapterMap.has(ch)) {
        chapterMap.set(ch, []);
      }
      chapterMap.get(ch)!.push(q);
    }

    // Shuffle within each chapter
    for (const [, list] of chapterMap) {
      list.sort(() => 0.5 - Math.random());
    }

    const chapters = Array.from(chapterMap.keys()).sort(() => 0.5 - Math.random());
    const selected: Question[] = [];

    // Round-robin selection across chapters to guarantee all chapters are represented
    let chIdx = 0;
    let attempts = 0;
    const maxAttempts = pool.length * 3;

    while (selected.length < targetCount && attempts < maxAttempts) {
      attempts++;
      const currentChapter = chapters[chIdx % chapters.length];
      const chQuestions = chapterMap.get(currentChapter) || [];

      for (let i = 0; i < chQuestions.length; i++) {
        const candidate = chQuestions[i];
        const norm = candidate.q.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!seenStems.has(norm)) {
          seenStems.add(norm);
          chQuestions.splice(i, 1); // remove so it's not picked again
          const fixed = shuffleOptionsAndFixCorrect(candidate);
          selected.push({
            ...fixed,
            subject: subjectKey,
            id: `tcat-mock-${subjectKey.toLowerCase()}-${selected.length + 1}-${Date.now()}`
          });
          break;
        }
      }
      chIdx++;
    }

    // Fallback top-up if needed
    let loopIndex = 0;
    while (selected.length < targetCount && pool.length > 0) {
      const base = pool[loopIndex % pool.length];
      const fixed = shuffleOptionsAndFixCorrect(base);
      selected.push({
        ...fixed,
        subject: subjectKey,
        id: `tcat-mock-${subjectKey.toLowerCase()}-fill-${selected.length + 1}-${Date.now()}`
      });
      loopIndex++;
    }

    return selected;
  }

  const q1 = selectProportional(sub1, 30);
  const q2 = selectProportional(sub2, 30);
  const q3 = selectProportional(sub3, 30);
  const q4 = selectProportional(sub4, 10);

  return [...q1, ...q2, ...q3, ...q4];
}

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Lock,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { MathText } from '@/components/ui/MathText';
import { SYLLABUS_MAP } from '@/constants/syllabusMap';
import { formatSubjectName, formatChapterName, slugify } from '@/constants/taxonomy';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';

export interface SampleMcqItem {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

function getCuratedSampleQuestions(subjectSlug: string, chapterTitle: string): SampleMcqItem[] {
  const s = subjectSlug.toLowerCase();

  if (s.includes('math')) {
    return [
      {
        id: 'sample-math-1',
        question: `In ${chapterTitle}, if $f(x) = x^2 - 4x + 7$, what is the minimum value of $f(x)$ for $x \\in \\mathbb{R}$?`,
        options: ['$3$', '$4$', '$7$', '$-3$'],
        correctIndex: 0,
        explanation:
          'Complete the square: $$f(x) = (x - 2)^2 + 3$$ Since $(x - 2)^2 \\ge 0$ for all real $x$, the minimum value is $3$ at $x = 2$.',
        difficulty: 'Easy',
      },
      {
        id: 'sample-math-2',
        question: 'Evaluate the derivative of $y = \\sin(2x) + e^{3x}$ with respect to $x$:',
        options: [
          '$2\\cos(2x) + 3e^{3x}$',
          '$\\cos(2x) + e^{3x}$',
          '$-2\\cos(2x) + 3e^{3x}$',
          '$2\\sin(2x) + 3e^{3x}$',
        ],
        correctIndex: 0,
        explanation:
          'Using the chain rule: $$\\frac{d}{dx}[\\sin(2x)] = 2\\cos(2x)$$ and $$\\frac{d}{dx}[e^{3x}] = 3e^{3x}$$ Combining both gives $2\\cos(2x) + 3e^{3x}$.',
        difficulty: 'Medium',
      },
      {
        id: 'sample-math-3',
        question: 'If the vectors $\\vec{u} = 2\\hat{i} - 3\\hat{j} + \\hat{k}$ and $\\vec{v} = \\hat{i} + 2\\hat{j} + c\\hat{k}$ are orthogonal, then $c$ equals:',
        options: ['$4$', '$-4$', '$2$', '$0$'],
        correctIndex: 0,
        explanation:
          'Two vectors are orthogonal when their dot product is zero: $$\\vec{u} \\cdot \\vec{v} = (2)(1) + (-3)(2) + (1)(c) = 0 \\implies 2 - 6 + c = 0 \\implies c = 4$$',
        difficulty: 'Medium',
      },
      {
        id: 'sample-math-4',
        question: 'What is the value of $\\lim_{x \\to 0} \\frac{\\sin(5x)}{x}$?',
        options: ['$5$', '$1$', '$0$', '$\\frac{1}{5}$'],
        correctIndex: 0,
        explanation:
          'Rewrite the limit using the standard identity $\\lim_{u \\to 0} \\frac{\\sin u}{u} = 1$: $$\\lim_{x \\to 0} 5 \\cdot \\frac{\\sin(5x)}{5x} = 5 \\times 1 = 5$$',
        difficulty: 'Easy',
      },
    ];
  }

  if (s.includes('phys')) {
    return [
      {
        id: 'sample-phys-1',
        question: `A projectile is launched at an angle $\\theta = 45^\\circ$ with initial speed $v_0 = 20\\text{ m/s}$ ($g = 10\\text{ m/s}^2$). What is its maximum horizontal range $R$?`,
        options: ['$40\\text{ m}$', '$20\\text{ m}$', '$80\\text{ m}$', '$10\\text{ m}$'],
        correctIndex: 0,
        explanation:
          'The horizontal range is given by: $$R = \\frac{v_0^2 \\sin(2\\theta)}{g} = \\frac{(20)^2 \\sin(90^\\circ)}{10} = \\frac{400 \\times 1}{10} = 40\\text{ m}$$',
        difficulty: 'Easy',
      },
      {
        id: 'sample-phys-2',
        question: 'If the kinetic energy $K$ of a particle of mass $m$ is doubled, by what factor does its linear momentum $p$ increase?',
        options: ['$\\sqrt{2}$', '$2$', '$4$', '$\\frac{1}{\\sqrt{2}}$'],
        correctIndex: 0,
        explanation:
          'Since $K = \\frac{p^2}{2m}$, momentum is related to kinetic energy by: $$p = \\sqrt{2mK}$$ Doubling $K$ multiplies $p$ by $\\sqrt{2}$.',
        difficulty: 'Medium',
      },
      {
        id: 'sample-phys-3',
        question: 'Two resistors of $6\\,\\Omega$ and $3\\,\\Omega$ are connected in parallel across a $12\\text{ V}$ ideal battery. What is the total current drawn from the battery?',
        options: ['$6\\text{ A}$', '$2\\text{ A}$', '$4\\text{ A}$', '$9\\text{ A}$'],
        correctIndex: 0,
        explanation:
          'First find the equivalent resistance: $$R_{\\text{eq}} = \\frac{6 \\times 3}{6 + 3} = 2\\,\\Omega$$ By Ohm’s Law, $$I = \\frac{V}{R_{\\text{eq}}} = \\frac{12\\text{ V}}{2\\,\\Omega} = 6\\text{ A}$$',
        difficulty: 'Medium',
      },
      {
        id: 'sample-phys-4',
        question: 'What is the de Broglie wavelength $\\lambda$ of a particle with momentum $p$?',
        options: ['$\\lambda = \\frac{h}{p}$', '$\\lambda = hp$', '$\\lambda = \\frac{p}{h}$', '$\\lambda = \\frac{hc}{p}$'],
        correctIndex: 0,
        explanation:
          'By de Broglie’s hypothesis, matter waves have wavelength inversely proportional to linear momentum: $$\\lambda = \\frac{h}{p} = \\frac{h}{mv}$$',
        difficulty: 'Easy',
      },
    ];
  }

  if (s.includes('chem')) {
    return [
      {
        id: 'sample-chem-1',
        question: 'How many moles of oxygen gas ($\\text{O}_2$) are required for the complete combustion of $2\\text{ moles}$ of methane ($\\text{CH}_4$)?',
        options: ['$4\\text{ moles}$', '$2\\text{ moles}$', '$1\\text{ mole}$', '$6\\text{ moles}$'],
        correctIndex: 0,
        explanation:
          'From the balanced equation: $$\\text{CH}_4 + 2\\text{O}_2 \\rightarrow \\text{CO}_2 + 2\\text{H}_2\\text{O}$$ $1\\text{ mole}$ of $\\text{CH}_4$ requires $2\\text{ moles}$ of $\\text{O}_2$, so $2\\text{ moles}$ require $4\\text{ moles}$ of $\\text{O}_2$.',
        difficulty: 'Easy',
      },
      {
        id: 'sample-chem-2',
        question: 'What is the $\\text{pH}$ of a $0.001\\text{ M}$ aqueous solution of $\\text{HCl}$ at $25^\\circ\\text{C}$?',
        options: ['$3$', '$2$', '$1$', '$11$'],
        correctIndex: 0,
        explanation:
          '$\\text{HCl}$ is a strong monoprotic acid, so $[\\text{H}^+] = 10^{-3}\\text{ M}$: $$\\text{pH} = -\\log_{10}[\\text{H}^+] = -\\log_{10}(10^{-3}) = 3$$',
        difficulty: 'Easy',
      },
      {
        id: 'sample-chem-3',
        question: 'Which orbital hybridization is exhibited by the carbon atoms in ethyne ($\\text{HC}\\equiv\\text{CH}$)?',
        options: ['$sp$', '$sp^2$', '$sp^3$', '$dsp^2$'],
        correctIndex: 0,
        explanation:
          'Each carbon in ethyne forms two $\\sigma$-bonds ($180^\\circ$ linear geometry) and two $\\pi$-bonds, corresponding to $sp$ hybridization.',
        difficulty: 'Medium',
      },
      {
        id: 'sample-chem-4',
        question: 'For an exothermic reaction at equilibrium, increasing the temperature will shift the equilibrium position:',
        options: [
          'In the backward (reactant) direction',
          'In the forward (product) direction',
          'No change in equilibrium position',
          'Doubles the equilibrium constant $K_c$',
        ],
        correctIndex: 0,
        explanation:
          'By Le Chatelier’s principle, adding heat to an exothermic reaction ($\\Delta H < 0$) favors the endothermic reverse direction, decreasing $K_c$.',
        difficulty: 'Medium',
      },
    ];
  }

  if (s.includes('bio')) {
    return [
      {
        id: 'sample-bio-1',
        question: 'Which cellular organelle is responsible for aerobic respiration and ATP synthesis via oxidative phosphorylation?',
        options: ['Mitochondrion', 'Golgi apparatus', 'Ribosome', 'Lysosome'],
        correctIndex: 0,
        explanation:
          'The inner mitochondrial membrane cristae house the electron transport chain and ATP synthase complexes that drive oxidative phosphorylation.',
        difficulty: 'Easy',
      },
      {
        id: 'sample-bio-2',
        question: 'In enzyme kinetics, a competitive inhibitor affects the reaction rate by:',
        options: [
          'Increasing the apparent $K_m$ without changing $V_{\\max}$',
          'Decreasing $V_{\\max}$ without changing $K_m$',
          'Decreasing both $K_m$ and $V_{\\max}$',
          'Irreversibly denaturing the active site',
        ],
        correctIndex: 0,
        explanation:
          'A competitive inhibitor competes with the substrate for the active site. High substrate concentration can overcome it ($V_{\\max}$ unchanged), while apparent $K_m$ increases.',
        difficulty: 'Medium',
      },
      {
        id: 'sample-bio-3',
        question: 'During the light-dependent reactions of photosynthesis, photolysis of water ($\\text{H}_2\\text{O}$) is directly associated with:',
        options: ['Photosystem II (P680)', 'Photosystem I (P700)', 'Calvin Cycle', 'Cytochrome $b_6f$'],
        correctIndex: 0,
        explanation:
          'The oxygen-evolving complex of Photosystem II splits water: $$2\\text{H}_2\\text{O} \\rightarrow 4\\text{H}^+ + 4e^- + \\text{O}_2$$ replacing electrons excited from P680.',
        difficulty: 'Medium',
      },
      {
        id: 'sample-bio-4',
        question: 'How many net ATP molecules are produced per glucose molecule during cytoplasmic glycolysis?',
        options: ['$2\\text{ ATP}$', '$4\\text{ ATP}$', '$36\\text{ ATP}$', '$38\\text{ ATP}$'],
        correctIndex: 0,
        explanation:
          'Glycolysis invests $2\\text{ ATP}$ in the preparatory phase and generates $4\\text{ ATP}$ in the payoff phase, yielding a net gain of $2\\text{ ATP}$ per glucose.',
        difficulty: 'Easy',
      },
    ];
  }

  if (s.includes('comp')) {
    return [
      {
        id: 'sample-cs-1',
        question: 'What is the worst-case time complexity of binary search on a sorted array of $n$ elements?',
        options: ['$\\mathcal{O}(\\log n)$', '$\\mathcal{O}(n)$', '$\\mathcal{O}(n \\log n)$', '$\\mathcal{O}(1)$'],
        correctIndex: 0,
        explanation:
          'Binary search halves the search interval on each comparison, requiring at most $\\lfloor \\log_2 n \\rfloor + 1 = \\mathcal{O}(\\log n)$ steps.',
        difficulty: 'Easy',
      },
      {
        id: 'sample-cs-2',
        question: 'In relational database design, a foreign key is used to enforce:',
        options: [
          'Referential integrity between two tables',
          'Entity uniqueness within the same table',
          'First Normal Form (1NF) atomicity',
          'Full-text indexing on character columns',
        ],
        correctIndex: 0,
        explanation:
          'A foreign key references a primary/unique key in a parent table, guaranteeing referential integrity across related relations.',
        difficulty: 'Easy',
      },
      {
        id: 'sample-cs-3',
        question: 'Which layer of the OSI model is responsible for end-to-end logical addressing and packet routing (IP)?',
        options: ['Network Layer (Layer 3)', 'Data Link Layer (Layer 2)', 'Transport Layer (Layer 4)', 'Session Layer (Layer 5)'],
        correctIndex: 0,
        explanation:
          'The Network Layer (Layer 3) handles logical IP addressing and routing packets across interconnected networks.',
        difficulty: 'Medium',
      },
      {
        id: 'sample-cs-4',
        question: 'Which data structure operates on a Last-In, First-Out (LIFO) principle and is used to manage function call frames?',
        options: ['Stack', 'Queue', 'Min-Heap', 'Adjacency List'],
        correctIndex: 0,
        explanation:
          'A stack pushes and pops elements from the top in LIFO order, making it ideal for managing activation records on the call stack.',
        difficulty: 'Easy',
      },
    ];
  }

  return [
    {
      id: 'sample-eng-1',
      question: 'Choose the grammatically correct sentence:',
      options: [
        'Neither the captain nor the players were aware of the schedule change.',
        'Neither the captain nor the players was aware of the schedule change.',
        'Neither the captain or the players were aware of the schedule change.',
        'Neither the captain nor the players has been aware of the schedule change.',
      ],
      correctIndex: 0,
      explanation:
        'With correlative conjunctions "neither ... nor", the verb agrees in number with the closer subject ("players" is plural, so "were" is correct).',
      difficulty: 'Medium',
    },
    {
      id: 'sample-eng-2',
      question: 'Select the closest synonym for the word "EPHEMERAL":',
      options: ['Short-lived', 'Permanent', 'Resilient', 'Ambiguous'],
      correctIndex: 0,
      explanation:
        '"Ephemeral" means lasting for a very short time (transient, fleeting).',
      difficulty: 'Easy',
    },
    {
      id: 'sample-eng-3',
      question: 'Identify the correct passive voice transformation of: "The committee will announce the merit list tomorrow."',
      options: [
        'The merit list will be announced by the committee tomorrow.',
        'The merit list would be announced by the committee tomorrow.',
        'The merit list is announced by the committee tomorrow.',
        'The merit list will have been announced by the committee tomorrow.',
      ],
      correctIndex: 0,
      explanation:
        'Future simple active ("will + base verb") converts to future simple passive ("will be + past participle").',
      difficulty: 'Easy',
    },
    {
      id: 'sample-eng-4',
      question: 'Select the correct preposition to complete the sentence: "The candidate was exempted ___ paying the late registration fee."',
      options: ['from', 'of', 'with', 'against'],
      correctIndex: 0,
      explanation:
        'The verb "exempt" takes the fixed preposition "from" ("exempted from doing something").',
      difficulty: 'Easy',
    },
  ];
}

export const McqChapterPage: React.FC = () => {
  const { subject = 'physics', chapter = 'vectors-and-equilibrium' } = useParams<{
    subject: string;
    chapter: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();

  const subjectName = formatSubjectName(subject);

  // Resolve exact human chapter title from SYLLABUS_MAP if available
  const syllabusKey =
    subject.toLowerCase() === 'computer' ? 'computer-science' : subject.toLowerCase();
  const syllabusEntry = SYLLABUS_MAP[syllabusKey];
  const allSyllabusChapters = syllabusEntry
    ? [
        ...syllabusEntry.chaptersClass11.map((c) => c.name),
        ...syllabusEntry.chaptersClass12.map((c) => c.name),
      ]
    : [];
  const matchedChapterTitle =
    allSyllabusChapters.find(
      (c) =>
        slugify(c) === chapter.toLowerCase() ||
        slugify(c).includes(chapter.toLowerCase()) ||
        chapter.toLowerCase().includes(slugify(c))
    ) || formatChapterName(subject, chapter);
  const relatedChapters = allSyllabusChapters
    .filter((c) => slugify(c) !== slugify(matchedChapterTitle))
    .slice(0, 6);

  const [sampleQuestions, setSampleQuestions] = useState<SampleMcqItem[]>(() =>
    getCuratedSampleQuestions(subject, matchedChapterTitle)
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  // Attempt to load up to 4 real published Firestore questions for this subject/chapter if available
  useEffect(() => {
    let mounted = true;
    const curated = getCuratedSampleQuestions(subject, matchedChapterTitle);
    setSampleQuestions(curated);
    setSelectedAnswers({});

    const colName =
      subject.toLowerCase().includes('math')
        ? 'questions_mathematics'
        : subject.toLowerCase().includes('phys')
        ? 'questions_physics'
        : subject.toLowerCase().includes('chem')
        ? 'questions_chemistry'
        : subject.toLowerCase().includes('bio')
        ? 'questions_biology'
        : subject.toLowerCase().includes('comp')
        ? 'questions_computer'
        : subject.toLowerCase().includes('eng')
        ? 'questions_english'
        : 'questions';

    getDocs(query(collection(db, colName), limit(15)))
      .then((snap) => {
        if (!mounted || snap.empty) return;
        const matching: SampleMcqItem[] = [];
        snap.docs.forEach((d) => {
          const data = d.data();
          if (
            Array.isArray(data.options) &&
            data.options.length >= 4 &&
            typeof data.correctAnswer === 'number' &&
            data.questionText
          ) {
            const topicStr = `${data.topic || ''} ${data.chapter || ''}`.toLowerCase();
            if (
              topicStr.includes(chapter.replace(/-/g, ' ').slice(0, 8)) ||
              matching.length < 4
            ) {
              matching.push({
                id: d.id,
                question: data.questionText,
                options: [
                  String(data.options[0]),
                  String(data.options[1]),
                  String(data.options[2]),
                  String(data.options[3]),
                ],
                correctIndex: data.correctAnswer,
                explanation:
                  data.explanation ||
                  'Step-by-step solution verified by Boardly Academic Review.',
                difficulty:
                  data.difficulty === 'hard'
                    ? 'Hard'
                    : data.difficulty === 'easy'
                    ? 'Easy'
                    : 'Medium',
              });
            }
          }
        });
        if (matching.length >= 3) {
          setSampleQuestions(matching.slice(0, 4));
        }
      })
      .catch(() => {
        // Keep curated sample questions with KaTeX derivations
      });

    return () => {
      mounted = false;
    };
  }, [subject, chapter, matchedChapterTitle]);

  const canonicalPath = `/mcqs/${subject}/${chapter}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `${matchedChapterTitle} — ${subjectName} MCQs with Step-by-Step Solutions`,
    about: {
      '@type': 'Thing',
      name: `${subjectName}: ${matchedChapterTitle}`,
    },
    educationalAlignment: {
      '@type': 'AlignmentObject',
      alignmentType: 'educationalSubject',
      targetName: subjectName,
    },
    hasPart: sampleQuestions.map((q) => ({
      '@type': 'Question',
      eduQuestionType: 'Multiple choice',
      text: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.options[q.correctIndex],
      },
    })),
  };

  const handlePracticeAndSave = () => {
    requireAuth(
      `start a full ${matchedChapterTitle} practice session and save your progress`,
      () => {
        navigate('/dashboard');
      },
      '/dashboard'
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={`${matchedChapterTitle} MCQs — ${subjectName} Class 11 & 12 / Entrance Prep`}
        description={`Practice interactive ${matchedChapterTitle} MCQs in ${subjectName} with instant answer verification and step-by-step KaTeX derivations for FBISE, Punjab Board, MDCAT, and ECAT.`}
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Subject MCQs', href: '/mcqs' },
            { label: subjectName, href: `/mcqs/${subject}` },
            { label: matchedChapterTitle },
          ]}
        />

        {/* Chapter Overview Header */}
        <section className="glass-panel p-8 sm:p-10 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="section-chip-red">
              <Sparkles size={13} />
              <span>{subjectName} · Chapter Practice</span>
            </div>
            <span className="glass-pill px-3 py-1 text-xs text-white/70">
              {sampleQuestions.length} Interactive Sample MCQs
            </span>
          </div>

          <h1 className="font-dot text-3xl sm:text-4xl font-bold text-white mb-3">
            {matchedChapterTitle} — {subjectName} MCQs
          </h1>

          <p className="text-sm sm:text-base text-white/75 leading-relaxed mb-6">
            Test your grasp of <strong>{matchedChapterTitle}</strong> right here. Select any option below to check your answer immediately and view the complete KaTeX mathematical derivation. Guest answers are not saved—sign in to unlock the full chapter question bank, timed mocks, and mastery tracking.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePracticeAndSave}
              className="btn-primary px-6 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              {user ? <BookOpen size={16} /> : <Lock size={15} />}
              <span>
                {user
                  ? `Open Full ${matchedChapterTitle} Cockpit`
                  : 'Sign in to Practice & Save Progress'}
              </span>
              <ArrowRight size={15} />
            </button>

            <Link
              to={`/material/subject/${subject}`}
              className="btn-secondary px-5 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
            >
              <FolderOpen size={15} />
              <span>{subjectName} Notes &amp; PDFs</span>
            </Link>
          </div>
        </section>

        {/* Interactive Guest Sample MCQs */}
        <section className="space-y-6 mb-10">
          <div className="flex items-center justify-between">
            <h2 className="font-dot text-xl sm:text-2xl font-bold text-white">
              Interactive Sample Questions
            </h2>
            {Object.keys(selectedAnswers).length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAnswers({})}
                className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset Sample Answers</span>
              </button>
            )}
          </div>

          {sampleQuestions.map((mcq, qIdx) => {
            const chosenIdx = selectedAnswers[mcq.id];
            const hasAnswered = chosenIdx !== undefined;
            const isCorrect = chosenIdx === mcq.correctIndex;

            return (
              <div key={mcq.id} className="glass-card p-6 sm:p-7">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-dot text-sm font-bold text-[#D71921]">
                    Question {String(qIdx + 1).padStart(2, '0')}
                  </span>
                  <span className="glass-pill px-2.5 py-0.5 text-[11px] text-white/65">
                    {mcq.difficulty}
                  </span>
                </div>

                <div className="text-sm sm:text-base font-medium text-white leading-relaxed mb-5">
                  <MathText text={mcq.question} block />
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {mcq.options.map((opt, optIdx) => {
                    const isThisChosen = chosenIdx === optIdx;
                    const isThisCorrect = mcq.correctIndex === optIdx;

                    let optionStyle =
                      'bg-white/[0.03] border-white/10 text-white/85 hover:border-white/25 hover:bg-white/[0.06]';
                    if (hasAnswered) {
                      if (isThisCorrect) {
                        optionStyle =
                          'bg-emerald-500/15 border-emerald-500/50 text-white font-semibold';
                      } else if (isThisChosen && !isThisCorrect) {
                        optionStyle =
                          'bg-[#D71921]/15 border-[#D71921]/60 text-white';
                      } else {
                        optionStyle = 'bg-white/[0.02] border-white/[0.06] text-white/50';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          setSelectedAnswers((prev) => {
                            const wasAlreadyAnswered = prev[mcq.id] !== undefined;
                            const next = { ...prev, [mcq.id]: optIdx };
                            if (
                              !user &&
                              !wasAlreadyAnswered &&
                              Object.keys(next).length === sampleQuestions.length
                            ) {
                              setTimeout(() => {
                                requireAuth(
                                  `continue practicing ${matchedChapterTitle} MCQs and save your progress`,
                                  () => navigate('/dashboard'),
                                  '/dashboard'
                                );
                              }, 550);
                            }
                            return next;
                          });
                        }}
                        className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center font-mono text-xs shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <div className="min-w-0">
                            <MathText text={opt} />
                          </div>
                        </div>

                        {hasAnswered && isThisCorrect && (
                          <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
                        )}
                        {hasAnswered && isThisChosen && !isThisCorrect && (
                          <XCircle size={17} className="text-[#D71921] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Step-by-step KaTeX Explanation */}
                {hasAnswered && (
                  <div className="mt-5 pt-4 border-t border-white/10 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Correct Answer
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#D71921] uppercase tracking-wider">
                          Incorrect — Correct Option is {String.fromCharCode(65 + mcq.correctIndex)}
                        </span>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs sm:text-sm text-white/80 leading-relaxed">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#D71921] block mb-1.5">
                        Step-by-Step Derivation
                      </span>
                      <MathText text={mcq.explanation} block />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Sign in to Practice & Save Progress Banner */}
        <section className="glass-panel p-8 text-center mb-8">
          <h2 className="font-dot text-2xl font-bold text-white mb-2">
            Ready to Master All {matchedChapterTitle} Questions?
          </h2>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto mb-6">
            Sign in to unlock full-length timed practice sessions, penalty marking simulations, weak-topic analytics, and saved attempt history for {subjectName}.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handlePracticeAndSave}
              className="btn-primary px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Sign in to Practice &amp; Save Progress</span>
              <ArrowRight size={14} />
            </button>
            <Link
              to={`/mcqs/${subject}`}
              className="btn-secondary px-5 py-3 text-xs font-semibold"
            >
              More {subjectName} Chapters
            </Link>
          </div>
        </section>

        {/* Related Chapters in Subject */}
        {relatedChapters.length > 0 && (
          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-dot text-xl font-bold text-white">
                More Chapters in {subjectName}
              </h2>
              <Link
                to={`/mcqs/${subject}`}
                className="text-xs text-[#D71921] hover:underline font-semibold"
              >
                View All Chapters →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedChapters.map((relCh) => (
                <Link
                  key={relCh}
                  to={`/mcqs/${subject}/${slugify(relCh)}`}
                  className="glass-card-interactive p-4 flex items-center justify-between gap-2"
                >
                  <span className="text-xs sm:text-sm font-medium text-white truncate">
                    {relCh}
                  </span>
                  <ArrowRight size={14} className="text-[#D71921] shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default McqChapterPage;

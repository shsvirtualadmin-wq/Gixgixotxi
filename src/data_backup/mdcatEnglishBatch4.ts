import { Question } from '../types';

export const MDCAT_ENGLISH_BATCH4: Question[] = [
  // --- Analogy (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-eng-1',
    q: 'Select the pair that expresses a relationship most similar to that in the given pair: STETHOSCOPE : PHYSICIAN',
    options: [
      'Trowel : Mason',
      'Scalpel : Patient',
      'Microscope : Specimen',
      'Telescope : Star'
    ],
    correct: 0,
    topic: 'Analogy',
    explain: 'A stethoscope is an essential tool used by a physician to perform their trade. Similarly, a trowel is an essential tool used by a mason in construction.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b4-eng-2',
    q: 'Select the pair that best mirrors the relationship in: PROPHYLACTIC : DISEASE',
    options: [
      'Antiseptic : Infection',
      'Antibiotic : Immunity',
      'Vaccine : Cure',
      'Palliative : Diagnosis'
    ],
    correct: 0,
    topic: 'Analogy',
    explain: 'A prophylactic is an agent or measure taken specifically to prevent disease. Similarly, an antiseptic is used to prevent infection.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b4-eng-3',
    q: 'Select the pair that exhibits the same subtle relationship: RECALCITRANT : COMPLIANCE',
    options: [
      'Parsimonious : Generosity',
      'Meticulous : Precision',
      'Tenacious : Perseverance',
      'Bellicose : Hostility'
    ],
    correct: 0,
    topic: 'Analogy',
    explain: 'A recalcitrant person lacks compliance (inherent antonymous deficiency). Likewise, a parsimonious (stingy) person inherently lacks generosity.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Comprehension (2 MCQs: 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-eng-4',
    q: 'Read the excerpt: "The advent of targeted immunotherapy represents a paradigm shift from broad-spectrum cytotoxic chemotherapy, sparing healthy non-malignant tissues while selectively engaging antigen-bearing tumor cells." What is the main idea conveyed?',
    options: [
      'Targeted immunotherapy offers a selective mechanism that preserves healthy cells compared to indiscriminate chemotherapy',
      'Cytotoxic chemotherapy has been entirely supplanted by immunotherapeutic drugs',
      'All tumor cells lack identifiable surface antigens',
      'Chemotherapy causes fewer systemic toxicities than modern immunotherapy'
    ],
    correct: 0,
    topic: 'Comprehension',
    explain: 'The sentence highlights the fundamental distinction: targeted immunotherapy selectively attacks tumor cells while sparing healthy tissue, unlike broad-spectrum cytotoxic therapy.',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b4-eng-5',
    q: 'Read the excerpt: "While empirical antimicrobial treatment is often indispensable in acute sepsis, indiscriminate empiricism unmoored from microbiological surveillance inexorably accelerates selective antimicrobial resistance." Which inference is most justifiable?',
    options: [
      'Overuse of empiric antibiotics without microbiological testing fosters drug-resistant pathogens',
      'Microbiological surveillance eliminates the initial clinical need for empirical therapy in sepsis',
      'Empirical therapy should never be initiated prior to obtaining definitive culture results',
      'Antimicrobial resistance occurs exclusively in hospital settings with surveillance'
    ],
    correct: 0,
    topic: 'Comprehension',
    explain: 'The passage asserts that while empiric therapy is clinically vital in emergencies, administering antibiotics indiscriminately without surveillance drives bacterial resistance.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Grammar (2 MCQs: 1 Easy, 1 Hard) ---
  {
    id: 'mdcat-b4-eng-6',
    q: 'Choose the grammatically correct sentence regarding subject-verb agreement:',
    options: [
      'Neither the attending physician nor the charge nurses were aware of the revised protocol.',
      'Neither the attending physician nor the charge nurses was aware of the revised protocol.',
      'Neither the attending physician nor the charge nurses has been aware of the revised protocol.',
      'Neither the attending physician nor the charge nurses is aware of the revised protocol.'
    ],
    correct: 0,
    topic: 'Grammar',
    explain: 'Under the rule of proximity for correlative conjunctions ("neither... nor"), the verb agrees with the closer subject noun ("charge nurses", plural -> "were").',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b4-eng-7',
    q: 'Identify the sentence containing correct subjunctive mood usage for a hypothetical conditional condition contrary to present fact:',
    options: [
      'If the patient were hemodynamically stable, we would proceed immediately with elective surgical repair.',
      'If the patient was hemodynamically stable, we will proceed immediately with elective surgical repair.',
      'If the patient would be hemodynamically stable, we would proceed with elective surgery.',
      'If the patient is hemodynamically stable, we would have proceeded with elective surgery.'
    ],
    correct: 0,
    topic: 'Grammar',
    explain: 'The subjunctive form "were" is required in hypothetical or contrary-to-fact conditional clauses ("If the patient were..."), paired with modal "would proceed".',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Sentence Completion (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-eng-8',
    q: 'Complete the sentence: Because the clinical trial data were completely ________, the regulatory board demanded an independent re-investigation.',
    options: [
      'equivocal',
      'irrefutable',
      'conclusive',
      'axiomatic'
    ],
    correct: 0,
    topic: 'Sentence Completion',
    explain: '"Equivocal" means ambiguous or open to contradictory interpretations, logically explaining why an independent audit was demanded.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b4-eng-9',
    q: 'Complete the sentence: Despite the surgeon\'s ________ demeanor during the emergency, her internal anxiety was palpable to her senior scrub nurse.',
    options: [
      'stoic',
      'belligerent',
      'petulant',
      'frenetic'
    ],
    correct: 0,
    topic: 'Sentence Completion',
    explain: '"Stoic" denotes enduring pain or distress without display of feelings, contrasting directly with "internal anxiety was palpable".',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b4-eng-10',
    q: 'Complete the sentence: Far from being ________, the toxicologist\'s monograph provided an exhaustive, meticulously documented exposition of heavy metal pathobiology.',
    options: [
      'cursory',
      'pedantic',
      'didactic',
      'prolix'
    ],
    correct: 0,
    topic: 'Sentence Completion',
    explain: '"Cursory" means hasty, superficial, or lacking depth, which stands in direct contrast to "exhaustive, meticulously documented".',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Sentence Structure (3 MCQs: 1 Easy, 1 Medium, 1 Hard) ---
  {
    id: 'mdcat-b4-eng-11',
    q: 'Which of the following sentences correctly remedies the dangling modifier error?',
    options: [
      'Having examined the patient thoroughly, the resident made an accurate differential diagnosis.',
      'Having examined the patient thoroughly, an accurate differential diagnosis was made by the resident.',
      'Having examined the patient thoroughly, the chart was signed by the resident.',
      'Having examined the patient thoroughly, the laboratory report was finalized.'
    ],
    correct: 0,
    topic: 'Sentence Structure',
    explain: 'The participial phrase "Having examined..." must modify the person who performed the examination ("the resident"), who must immediately follow the comma.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b4-eng-12',
    q: 'Select the sentence with parallel grammatical structure:',
    options: [
      'The intensive care specialist instructed the intern to monitor arterial pressure, record urine output, and assess pupillary reflexes hourly.',
      'The intensive care specialist instructed the intern to monitor arterial pressure, recording urine output, and how to assess pupillary reflexes.',
      'The intensive care specialist instructed the intern to monitor arterial pressure, that he record urine output, and assessing pupillary reflexes.',
      'The intensive care specialist instructed the intern monitoring arterial pressure, to record urine output, and assess reflexes.'
    ],
    correct: 0,
    topic: 'Sentence Structure',
    explain: 'Parallelism requires matching grammatical forms: base infinitive verbs coordinated by "and" ("to monitor...", "[to] record...", and "[to] assess...").',
    difficulty: 'Medium',
    subject: 'English'
  },
  {
    id: 'mdcat-b4-eng-13',
    q: 'Identify the sentence that correctly avoids both a comma splice and a run-on sentence:',
    options: [
      'The patient was markedly tachypneic; consequently, the intensivist initiated mechanical ventilation.',
      'The patient was markedly tachypneic, consequently the intensivist initiated mechanical ventilation.',
      'The patient was markedly tachypneic, consequently, the intensivist initiated mechanical ventilation.',
      'The patient was markedly tachypneic and consequently initiated mechanical ventilation.'
    ],
    correct: 0,
    topic: 'Sentence Structure',
    explain: 'When joining two independent clauses using a conjunctive adverb like "consequently", a semicolon must precede the adverb and a comma must follow it.',
    difficulty: 'Hard',
    subject: 'English'
  },

  // --- Vocabulary (2 MCQs: 1 Easy, 1 Medium) ---
  {
    id: 'mdcat-b4-eng-14',
    q: 'What is the closest synonym for the word "BENIGN" in a clinical pathological context?',
    options: [
      'Non-malignant',
      'Infectious',
      'Metastatic',
      'Fulminant'
    ],
    correct: 0,
    topic: 'Vocabulary',
    explain: 'In medicine, "benign" refers to a condition, tumor, or growth that is not cancerous, invasive, or malignant.',
    difficulty: 'Easy',
    subject: 'English'
  },
  {
    id: 'mdcat-b4-eng-15',
    q: 'Select the option that is most nearly OPPOSITE in meaning to the word "PERNICIOUS":',
    options: [
      'Salubrious',
      'Inimical',
      'Deleterious',
      'Virulent'
    ],
    correct: 0,
    topic: 'Vocabulary',
    explain: '"Pernicious" means causing insidious or serious harm. Its antonym is "salubrious", meaning favorable to or promoting health and well-being.',
    difficulty: 'Medium',
    subject: 'English'
  }
];

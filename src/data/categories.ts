import { BoardClass } from '../types';
import { getFBISEChaptersForSubject, parseSubtopicsList } from './fbiseSyllabus';

export const CLASS_GROUPS: Record<BoardClass, string[]> = {
  9:  ["Medical", "Computer Science"],
  10: ["Medical", "Computer Science"],
  11: ["Pre-Medical", "Pre-Engineering", "ICS"],
  12: ["Pre-Medical", "Pre-Engineering", "ICS"],
  'MDCAT': ["MDCAT"],
  'TCAT': ["Pre-Engineering", "ICS (Physics)", "ICS (Statistics)", "Pre-Medical to Engineering", "Statistics & Physics"],
  'NET': ["Engineering & Computing"],
  'FAST': ["CS & Engineering"],
  'ECAT': ["Pre-Engineering", "ICS"],
  'ETEA': ["Engineering (Chemistry)", "Engineering (Computer Science)"],
  'NUMS': ["MBBS / BDS & Psychological Assessment"],
  'GIKI': ["Engineering & Artificial Intelligence"],
  'USAT': ["USAT-E (Pre-Engineering)", "USAT-CS (Computer Science)"],
  'NED': ["Pre-Engineering"],
  'PIEAS': ["Pre-Engineering", "ICS"],
  'NAT': ["NAT-IE (Pre-Engineering)", "NAT-IM (Pre-Medical)", "NAT-ICS (Computer Science)"],
  'IBA': ["Undergraduate Aptitude"],
  'AKU': ["MBBS & Nursing"],
  'MUET': ["Pre-Engineering", "ICS", "Pre-Medical"],
  'LUMS': ["LCAT (Aptitude)", "SBASSE (Scientific Aptitude)"],
  'NUML': ["Engineering & CS", "General"],
  'HITEC': ["Engineering", "Computing"],
  'NUTECH': ["Engineering", "Computing"]
};

/**
 * Returns the exact subject list for a given Class and Group combination.
 * Enforces strict subject requirements per class + group.
 */
export function getSubjectsForClassAndGroup(classNum: BoardClass, group: string): string[] {
  const normGroup = (group || '').trim().toLowerCase();
  const normClass = String(classNum).toUpperCase();

  // NUST NET: Mathematics 100, Physics 60, English 40. No Chem/Bio/CS!
  if (normClass === 'NET' || normGroup.includes('net') || normGroup.includes('nust')) {
    return ["Mathematics", "Physics", "English"];
  }

  // FAST-NU NAT: Advanced Math 50, Basic Math 20, IQ & Analytical 20, English 30. No Physics/Chemistry!
  if (normClass === 'FAST' || normGroup.includes('fast') || normGroup.includes('nat')) {
    return ["Advanced Mathematics", "Basic Mathematics", "IQ & Analytical Reasoning", "English"];
  }

  // UET Lahore ECAT: Math 30, Physics 30, Chemistry OR Computer Science 30, English 10
  if (normClass === 'ECAT' || normGroup.includes('ecat')) {
    if (normGroup.includes('cs') || normGroup.includes('computer') || normGroup.includes('ics')) {
      return ["Mathematics", "Physics", "Computer Science", "English"];
    }
    return ["Mathematics", "Physics", "Chemistry", "English"];
  }

  // UET Peshawar ETEA: Physics 40, Mathematics 35, English 15, Chemistry OR CS 10
  if (normClass === 'ETEA' || normGroup.includes('etea')) {
    if (normGroup.includes('cs') || normGroup.includes('computer')) {
      return ["Physics", "Mathematics", "English", "Computer Science"];
    }
    return ["Physics", "Mathematics", "English", "Chemistry"];
  }

  // NUMS: Part A (Biology 55, Chemistry 40, Physics 40, English 15), Part B (Psychological Assessment 50)
  if (normClass === 'NUMS' || normGroup.includes('nums')) {
    return ["Biology", "Chemistry", "Physics", "English", "Psychological Assessment"];
  }

  // GIKI: Mathematics 30, Physics 30, English 20.
  if (normClass === 'GIKI' || normGroup.includes('giki')) {
    return ["Mathematics", "Physics", "English"];
  }

  // USAT (HEC): USAT-E & USAT-CS
  if (normClass === 'USAT' || normGroup.includes('usat')) {
    if (normGroup.includes('cs') || normGroup.includes('computer')) {
      return ["Verbal Reasoning", "Quantitative Reasoning", "Physics", "Computer Science", "Mathematics"];
    }
    return ["Verbal Reasoning", "Quantitative Reasoning", "Physics", "Mathematics"];
  }

  // NED University: Math 25, Physics 25, Chemistry 25, English 25
  if (normClass === 'NED' || normGroup.includes('ned')) {
    return ["Mathematics", "Physics", "Chemistry", "English"];
  }

  // PIEAS: Pre-Engineering (Math 30, Phys 30, Chem 30, Eng 10) vs ICS (Math 30, Phys 30, CS 30, Eng 10)
  if (normClass === 'PIEAS' || normGroup.includes('pieas')) {
    if (normGroup.includes('cs') || normGroup.includes('computer') || normGroup.includes('ics')) {
      return ["English", "Mathematics", "Physics", "Computer Science"];
    }
    return ["English", "Mathematics", "Physics", "Chemistry"];
  }

  // NTS NAT (Shared Portal: COMSATS, Air, Bahria, IIUI, IST)
  if (normClass === 'NAT' || normGroup.includes('nat-ie') || normGroup.includes('nat-im') || normGroup.includes('nat-ics')) {
    if (normGroup.includes('im') || normGroup.includes('med')) {
      return ["English", "Analytical Reasoning", "Quantitative Reasoning", "Physics", "Chemistry", "Biology"];
    }
    if (normGroup.includes('ics') || normGroup.includes('cs') || normGroup.includes('computer')) {
      return ["English", "Analytical Reasoning", "Quantitative Reasoning", "Physics", "Computer Science", "Mathematics"];
    }
    return ["English", "Analytical Reasoning", "Quantitative Reasoning", "Physics", "Chemistry", "Mathematics"];
  }

  // IBA Karachi Aptitude Test: English 45, Mathematics 45
  if (normClass === 'IBA' || normGroup.includes('iba')) {
    return ["English", "Mathematics"];
  }

  // Aga Khan University (AKU): Science Achievement (Bio 16, Chem 12, Phys 12), Science Reasoning 30, Math Reasoning 30
  if (normClass === 'AKU' || normGroup.includes('aku')) {
    return ["Biology", "Chemistry", "Physics", "Science Reasoning", "Mathematical Reasoning"];
  }

  // MUET Jamshoro: Math/Bio 25, Physics 25, Chem/CS 25, English 25
  if (normClass === 'MUET' || normGroup.includes('muet')) {
    if (normGroup.includes('med')) {
      return ["Biology", "Physics", "Chemistry", "English"];
    }
    if (normGroup.includes('ics') || normGroup.includes('cs') || normGroup.includes('computer')) {
      return ["Mathematics", "Physics", "Computer Science", "English"];
    }
    return ["Mathematics", "Physics", "Chemistry", "English"];
  }

  // LUMS: LCAT vs SBASSE Scientific Aptitude
  if (normClass === 'LUMS' || normGroup.includes('lums')) {
    if (normGroup.includes('sse') || normGroup.includes('scientific') || normGroup.includes('science')) {
      return ["Physics", "Chemistry", "Mathematics", "Biology"];
    }
    return ["Verbal Reasoning", "Quantitative Reasoning"];
  }

  // NUML: English 20, Physics 20, Mathematics 20, CS 15
  if (normClass === 'NUML' || normGroup.includes('numl')) {
    return ["English", "Physics", "Mathematics", "Computer Science"];
  }

  // HITEC University Taxila: Math 30, Physics 30, Chem/CS 20, English 20
  if (normClass === 'HITEC' || normGroup.includes('hitec')) {
    if (normGroup.includes('cs') || normGroup.includes('computer') || normGroup.includes('comput')) {
      return ["Mathematics", "Physics", "Computer Science", "English"];
    }
    return ["Mathematics", "Physics", "Chemistry", "English"];
  }

  // NUTECH: Engineering vs Computing
  if (normClass === 'NUTECH' || normGroup.includes('nutech') || normGroup.includes('nuet')) {
    if (normGroup.includes('cs') || normGroup.includes('computer') || normGroup.includes('comput')) {
      return ["Mathematics", "Computer Science", "English"];
    }
    return ["Mathematics", "Physics", "Chemistry", "English"];
  }

  if (classNum === 'TCAT' || normGroup === 'tcat') {
    if (normGroup.includes('med')) {
      return ["Biology", "Physics", "Chemistry", "English"];
    }
    if (normGroup.includes('ics-stats') || (normGroup.includes('ics') && normGroup.includes('stat'))) {
      return ["Mathematics", "Statistics", "Computer Science", "English"];
    }
    if (normGroup.includes('ics') || normGroup.includes('cs') || normGroup.includes('computer')) {
      return ["Mathematics", "Physics", "Computer Science", "English"];
    }
    if (normGroup.includes('stat')) {
      return ["Mathematics", "Statistics", "Physics", "English"];
    }
    if (normGroup.includes('eng')) {
      return ["Mathematics", "Physics", "Chemistry", "English"];
    }
    return ["Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "Statistics", "English"];
  }

  if (classNum === 'MDCAT' || normGroup === 'mdcat') {
    return ["Biology", "Chemistry", "Physics", "English"];
  }

  // Class 9
  if (classNum === 9) {
    if (normGroup.includes('computer') || normGroup === 'cs' || normGroup.includes('computer science')) {
      return ["Computer Science", "Mathematics", "Physics", "English", "Urdu", "Islamiat", "Pakistan Studies"];
    }
    // Medical (or default)
    return ["Biology", "Chemistry", "Physics", "Mathematics", "English", "Urdu", "Islamiat", "Pakistan Studies"];
  }

  // Class 10
  if (classNum === 10) {
    if (normGroup.includes('computer') || normGroup === 'cs' || normGroup.includes('computer science')) {
      return ["Computer Science", "Mathematics", "Physics", "English", "Urdu", "Islamiat", "Pakistan Studies"];
    }
    // Medical (or default)
    return ["Biology", "Chemistry", "Physics", "Mathematics", "English", "Urdu", "Islamiat", "Pakistan Studies"];
  }

  // Class 11
  if (classNum === 11) {
    if (normGroup.includes('engineering') || normGroup === 'pre-engineering') {
      return ["Mathematics", "Chemistry", "Physics", "English", "Urdu", "Islamiat"];
    }
    if (normGroup.includes('ics') || normGroup === 'computer science') {
      return ["Computer Science", "Mathematics", "Physics", "English", "Urdu", "Islamiat"];
    }
    // Pre-Medical (or default)
    return ["Biology", "Chemistry", "Physics", "English", "Urdu", "Islamiat"];
  }

  // Class 12
  if (classNum === 12) {
    if (normGroup.includes('engineering') || normGroup === 'pre-engineering') {
      return ["Mathematics", "Chemistry", "Physics", "English", "Urdu", "Islamiat"];
    }
    if (normGroup.includes('ics') || normGroup === 'computer science') {
      return ["Computer Science", "Mathematics", "Physics", "English", "Urdu", "Islamiat"];
    }
    // Pre-Medical (or default)
    return ["Biology", "Chemistry", "Physics", "English", "Urdu", "Islamiat"];
  }

  return ["Biology", "Chemistry", "Physics", "English", "Urdu", "Islamiat"];
}

export const MDCAT_SUBJECT_TOPICS: Record<string, string[]> = {
  "Biology": [
    "Cell Structure, Organelles & Membranes",
    "Biological Molecules & Macromolecules",
    "Enzymes & Reaction Kinetics",
    "Bioenergetics & Cellular Respiration",
    "Acellular Life & Virology",
    "Prokaryotes & Bacterial Genetics",
    "Diversity Among Plants & Animals",
    "Human Physiology & Cardiovascular System",
    "Digestion & Gas Exchange in Humans",
    "Homeostasis, Osmoregulation & Excretion",
    "Coordination & Control (Nervous & Endocrine)",
    "Support & Movement in Humans",
    "Human Reproduction & Development",
    "Genetics, Chromosomes & Inheritance",
    "Evolution & Natural Selection",
    "Biotechnology & DNA Technology"
  ],
  "Chemistry": [
    "Atomic Structure & Quantum Numbers",
    "States of Matter (Gases, Liquids, Solids)",
    "Chemical Bonding & Molecular Shapes",
    "Thermochemistry & Reaction Energetics",
    "Electrochemistry & Redox Reactions",
    "Chemical Equilibrium & Le Chatelier's Principle",
    "Reaction Kinetics & Catalysis",
    "Periods, Groups & Periodic Trends",
    "Transition Elements & Complex Compounds",
    "Fundamental Principles of Organic Chemistry",
    "Hydrocarbons (Alkanes, Alkenes, Alkynes, Benzene)",
    "Alkyl Halides & Nucleophilic Substitution",
    "Alcohols, Phenols & Ethers",
    "Aldehydes & Ketones",
    "Carboxylic Acids & Derivatives",
    "Macromolecules & Biochemistry"
  ],
  "Physics": [
    "Force and Motion & Momentum",
    "Work, Energy and Power",
    "Rotational & Circular Motion",
    "Waves, Oscillations & Simple Harmonic Motion",
    "Thermodynamics & Kinetic Theory of Gases",
    "Electrostatics & Coulomb's Law",
    "Current Electricity & Kirchhoff's Laws",
    "Electromagnetism & Magnetic Fields",
    "Electromagnetic Induction & AC Circuits",
    "Deformation of Solids & Electronics",
    "Atomic Spectra & Quantum Physics",
    "Nuclear Physics & Radioactivity"
  ],
  "English": [
    "PMDC High-Yield Vocabulary (Synonyms & Antonyms)",
    "Grammar, Tenses & Subject-Verb Agreement",
    "Sentence Correction & Error Spotting",
    "Articles, Prepositions & Conjunctions",
    "Punctuation & Capitalization Rules",
    "Active & Passive Voice Transformation",
    "Direct & Indirect Speech Conversion",
    "Reading Comprehension & Logical Deductions"
  ]
};

export function getSubjectTopicsForClass(sub: string, classNum?: BoardClass | string): string[] {
  if (classNum === 'MDCAT' || (typeof classNum === 'string' && classNum.toUpperCase() === 'MDCAT')) {
    return MDCAT_SUBJECT_TOPICS[sub] || SUBJECT_TOPICS[sub] || ['MDCAT PMDC Core Syllabus', 'MDCAT High Yield MCQs'];
  }
  if (classNum !== undefined && classNum !== null && classNum !== '') {
    const parsedNum = Number(classNum);
    if (!isNaN(parsedNum) && [9, 10, 11, 12].includes(parsedNum)) {
      const fbiseChapters = getFBISEChaptersForSubject(parsedNum as BoardClass, sub);
      if (fbiseChapters && fbiseChapters.length > 0) {
        const result: string[] = [];
        fbiseChapters.forEach((ch) => {
          result.push(ch.name);
          const subs = parseSubtopicsList(ch.subtopics);
          subs.forEach((s) => {
            if (s && !result.includes(`${ch.name} — ${s}`)) {
              result.push(`${ch.name} — ${s}`);
            }
          });
        });
        return result;
      }
    }
  }
  return SUBJECT_TOPICS[sub] || ['General Practice', 'Core Concepts', 'FBISE High Yield'];
}

export const SUBJECT_TOPICS: Record<string, string[]> = {
  "Physics": [
    "Electrostatics & Electric Fields",
    "Current Electricity & Ohm's Law",
    "Electromagnetism & Magnetic Waves",
    "Waves, Oscillations & Simple Harmonic Motion",
    "Work, Energy, Power & Rotational Dynamics",
    "Optics & Light Wave Diffraction",
    "Nuclear Physics & Radioactivity",
    "Vectors & Equilibrium"
  ],
  "Chemistry": [
    "Atomic Structure & Quantum Mechanics",
    "Chemical Bonding & Hybridization",
    "Thermochemistry & Reaction Energetics",
    "Electrochemistry & Oxidation-Reduction",
    "Organic Reaction Mechanisms & Functional Groups",
    "Chemical Equilibrium & Le Chatelier's Principle",
    "Acids, Bases & pH Calculations",
    "States of Matter & Gas Laws"
  ],
  "Biology": [
    "Cell Structure, Organelles & Membranes",
    "Biological Molecules & Enzymes",
    "Genetics, Inheritance & DNA Replication",
    "Human Physiology & Cardiovascular System",
    "Plant Physiology & Photosynthesis",
    "Ecology, Ecosystems & Environment",
    "Bioenergetics & Respiration",
    "Immunology & Lymphatic System"
  ],
  "Mathematics": [
    "Calculus, Derivatives & Integrals",
    "Matrices, Determinants & System of Equations",
    "Trigonometry & Inverse Functions",
    "Complex Numbers & Quadratic Equations",
    "Vectors & 3D Analytic Geometry",
    "Sequences, Series & Mathematical Induction",
    "Permutations, Combinations & Probability",
    "Conic Sections & Straight Lines"
  ],
  "Computer Science": [
    "Data Structures & Queue/Stack/Tree Algorithms",
    "Object-Oriented Programming (OOP)",
    "Database Management Systems & SQL",
    "Computer Networks & Protocols",
    "Binary Systems, Logic Gates & Boolean Algebra",
    "Operating Systems & Process Management",
    "Algorithms & Time Complexity (Big O)"
  ],
  "English": [
    "Grammar & Sentence Correction",
    "Vocabulary, Synonyms & Antonyms",
    "Reading Comprehension & Inferences",
    "Idioms, Phrases & Prepositions",
    "Active & Passive Voice Transformation",
    "Analogies & Sentence Completion"
  ],
  "Urdu": [
    "Urdu Grammar & Qawaid",
    "Asnafe Adab (Ghazal, Nazm, Afsana)",
    "Vocabulary & Muhaware"
  ],
  "Pakistan Studies": [
    "Pakistan Movement & History (1857-1947)",
    "Constitutional Developments & Geography",
    "Economy, Culture & Foreign Policy"
  ],
  "Islamiat": [
    "Quranic Verses & Surah Key Themes",
    "Hadith & Sunnah Guidance",
    "Islamic History & Seerah of Prophet Muhammad (PBUH)"
  ],
  "Islamic Studies": [
    "Quranic Verses & Surah Key Themes",
    "Hadith & Sunnah Guidance",
    "Islamic History & Caliphate Era"
  ]
};

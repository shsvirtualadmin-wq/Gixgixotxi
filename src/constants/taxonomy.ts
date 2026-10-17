import { doc, getDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ChapterTaxonomyItem {
  slug: string;
  name: string;
  description?: string;
}

export interface SubjectTaxonomyItem {
  slug: string;
  name: string;
  color?: string;
  icon?: string;
  chapters: ChapterTaxonomyItem[];
}

/**
 * Universal canonical subjects and chapters for Boardly entrance prep.
 * Slugs are lowercase hyphen-separated strings.
 */
export const DEFAULT_TAXONOMY: SubjectTaxonomyItem[] = [
  {
    slug: 'mathematics',
    name: 'Mathematics',
    color: '#D71921',
    chapters: [
      { slug: 'integration-by-parts', name: 'Integration by Parts' },
      { slug: 'calculus-and-derivatives', name: 'Calculus & Derivatives' },
      { slug: 'conic-sections', name: 'Conic Sections' },
      { slug: 'vectors-and-matrices', name: 'Vectors & Matrices' },
      { slug: 'trigonometry', name: 'Trigonometry & Identities' },
      { slug: 'algebra-and-functions', name: 'Algebra & Functions' },
      { slug: 'sequences-and-series', name: 'Sequences & Series' },
      { slug: 'probability-and-binomial', name: 'Probability & Binomial Theorem' },
    ],
  },
  {
    slug: 'physics',
    name: 'Physics',
    color: '#0A0A0A',
    chapters: [
      { slug: 'electromagnetism-and-induction', name: 'Electromagnetism & Induction' },
      { slug: 'work-energy-and-power', name: 'Work, Energy & Power' },
      { slug: 'nuclear-and-quantum-physics', name: 'Nuclear & Quantum Physics' },
      { slug: 'kinematics-and-dynamics', name: 'Kinematics & Dynamics' },
      { slug: 'waves-and-oscillations', name: 'Waves & Oscillations' },
      { slug: 'thermodynamics', name: 'Thermodynamics' },
      { slug: 'current-electricity', name: 'Current Electricity' },
      { slug: 'rotational-motion', name: 'Circular & Rotational Motion' },
    ],
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    color: '#D71921',
    chapters: [
      { slug: 'aldehydes-and-ketones', name: 'Aldehydes & Ketones' },
      { slug: 'chemical-equilibrium', name: 'Chemical Equilibrium' },
      { slug: 'electrochemistry', name: 'Electrochemistry' },
      { slug: 'atomic-structure', name: 'Atomic Structure' },
      { slug: 'chemical-bonding', name: 'Chemical Bonding' },
      { slug: 'hydrocarbons-and-organic', name: 'Hydrocarbons & Organic Chemistry' },
      { slug: 'thermochemistry', name: 'Thermochemistry' },
      { slug: 'solutions-and-colloids', name: 'Solutions & Colloids' },
    ],
  },
  {
    slug: 'computer-science',
    name: 'Computer Science',
    color: '#0A0A0A',
    chapters: [
      { slug: 'data-structures-and-algorithms', name: 'Data Structures & Algorithms' },
      { slug: 'digital-logic-and-gates', name: 'Digital Logic & Gates' },
      { slug: 'programming-fundamentals', name: 'Programming Fundamentals' },
      { slug: 'databases-and-sql', name: 'Databases & SQL' },
      { slug: 'computer-networks', name: 'Computer Networks' },
      { slug: 'operating-systems', name: 'Operating Systems' },
    ],
  },
  {
    slug: 'english',
    name: 'English',
    color: '#D71921',
    chapters: [
      { slug: 'sentence-correction', name: 'Sentence Correction & Grammar' },
      { slug: 'vocabulary-and-synonyms', name: 'Vocabulary & Synonyms' },
      { slug: 'reading-comprehension', name: 'Reading Comprehension' },
      { slug: 'prepositions-and-idioms', name: 'Prepositions & Idiomatic Phrases' },
      { slug: 'analytical-writing', name: 'Analytical & Contextual Usage' },
    ],
  },
  {
    slug: 'biology',
    name: 'Biology',
    color: '#0A0A0A',
    chapters: [
      { slug: 'cell-biology', name: 'Cell Biology & Structure' },
      { slug: 'genetics-and-inheritance', name: 'Genetics & Inheritance' },
      { slug: 'bioenergetics', name: 'Bioenergetics & Respiration' },
      { slug: 'human-physiology', name: 'Human Physiology & Coordination' },
      { slug: 'biotechnology', name: 'Biotechnology & Recombinant DNA' },
      { slug: 'evolution-and-biodiversity', name: 'Evolution & Biodiversity' },
    ],
  },
  {
    slug: 'analytical-reasoning',
    name: 'Analytical Reasoning',
    color: '#D71921',
    chapters: [
      { slug: 'analytical-scenarios', name: 'Analytical Scenarios & Ordering' },
      { slug: 'logical-deductions', name: 'Logical Deductions & Syllogisms' },
      { slug: 'data-sufficiency', name: 'Data Sufficiency' },
      { slug: 'pattern-recognition', name: 'Pattern Recognition & Series' },
    ],
  },
];

// In-memory cache for dynamic admin chapters
let runtimeTaxonomy: SubjectTaxonomyItem[] = [...DEFAULT_TAXONOMY];

/**
 * Normalizes any string into a clean lowercase hyphenated slug.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Returns all active subjects in the taxonomy.
 */
export function getAllSubjects(): SubjectTaxonomyItem[] {
  return runtimeTaxonomy;
}

/**
 * Gets a subject by slug (case-insensitive).
 */
export function getSubjectBySlug(subjectSlug: string): SubjectTaxonomyItem | undefined {
  if (!subjectSlug) return undefined;
  const s = slugify(subjectSlug);
  return runtimeTaxonomy.find((item) => item.slug === s);
}

/**
 * Finds subject slug from user input (name, partial name, or slug).
 */
export function findSubjectSlug(input: string): string | undefined {
  if (!input) return undefined;
  const clean = input.trim().toLowerCase();
  const slug = slugify(input);

  // Exact slug match
  const bySlug = runtimeTaxonomy.find((s) => s.slug === slug);
  if (bySlug) return bySlug.slug;

  // Name match
  const byName = runtimeTaxonomy.find((s) => s.name.toLowerCase() === clean);
  if (byName) return byName.slug;

  // Partial or alias matches (e.g., 'math', 'comp sci', 'iq')
  if (clean.includes('math')) return 'mathematics';
  if (clean.includes('phys')) return 'physics';
  if (clean.includes('chem')) return 'chemistry';
  if (clean.includes('comp') || clean.includes('cs')) return 'computer-science';
  if (clean.includes('eng')) return 'english';
  if (clean.includes('bio') || clean.includes('mdcat')) return 'biology';
  if (clean.includes('analyt') || clean.includes('iq') || clean.includes('reason')) return 'analytical-reasoning';

  return undefined;
}

/**
 * Gets all chapters under a subject.
 */
export function getChaptersForSubject(subjectSlug: string): ChapterTaxonomyItem[] {
  const subject = getSubjectBySlug(subjectSlug);
  return subject?.chapters ?? [];
}

/**
 * Finds a chapter by its slug under a subject.
 */
export function getChapterBySlug(subjectSlug: string, chapterSlug: string): ChapterTaxonomyItem | undefined {
  const chapters = getChaptersForSubject(subjectSlug);
  const cSlug = slugify(chapterSlug);
  return chapters.find((c) => c.slug === cSlug);
}

/**
 * Finds chapter slug from user input (either display name or slug) for a given subject.
 */
export function findChapterSlug(subjectSlug: string, input: string): string | undefined {
  if (!input) return undefined;
  const chapters = getChaptersForSubject(subjectSlug);
  const clean = input.trim().toLowerCase();
  const slug = slugify(input);

  const exact = chapters.find((c) => c.slug === slug || c.name.toLowerCase() === clean);
  if (exact) return exact.slug;

  // Fallback: contains match
  const fuzzy = chapters.find((c) => c.name.toLowerCase().includes(clean) || clean.includes(c.name.toLowerCase()));
  if (fuzzy) return fuzzy.slug;

  return undefined;
}

/**
 * Formats a subject slug into its clean display name.
 */
export function formatSubjectName(slugOrName: string): string {
  if (!slugOrName) return 'General';
  const found = getSubjectBySlug(slugOrName) || runtimeTaxonomy.find((s) => s.name.toLowerCase() === slugOrName.toLowerCase());
  if (found) return found.name;
  return slugOrName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Formats a chapter slug into its clean display name.
 */
export function formatChapterName(subjectSlug: string, chapterSlug: string): string {
  if (!chapterSlug) return 'General Drill';
  const ch = getChapterBySlug(subjectSlug, chapterSlug);
  if (ch) return ch.name;
  return chapterSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Loads custom chapters added by admins from Firestore config doc `config/taxonomy`.
 */
export async function syncTaxonomyFromFirestore(): Promise<SubjectTaxonomyItem[]> {
  try {
    const configDocRef = doc(db, 'config', 'taxonomy');
    const snap = await getDoc(configDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const customChapters: Record<string, ChapterTaxonomyItem[]> = data.customChapters || {};

      runtimeTaxonomy = DEFAULT_TAXONOMY.map((sub) => {
        const added = customChapters[sub.slug] || [];
        const existingSlugs = new Set(sub.chapters.map((c) => c.slug));
        const mergedChapters = [...sub.chapters];

        for (const c of added) {
          if (!existingSlugs.has(c.slug)) {
            existingSlugs.add(c.slug);
            mergedChapters.push(c);
          }
        }

        return {
          ...sub,
          chapters: mergedChapters,
        };
      });
    }
  } catch (err) {
    console.warn('[Taxonomy] syncTaxonomyFromFirestore warning:', err);
  }
  return runtimeTaxonomy;
}

/**
 * Admin action: Adds a new chapter under a subject and persists to Firestore.
 */
export async function addAdminChapter(
  subjectSlug: string,
  chapterName: string
): Promise<{ ok: boolean; slug: string; error?: string }> {
  const sSlug = findSubjectSlug(subjectSlug);
  if (!sSlug) {
    return { ok: false, slug: '', error: 'Subject not found' };
  }

  const cleanName = chapterName.trim();
  if (cleanName.length < 2) {
    return { ok: false, slug: '', error: 'Chapter name is too short' };
  }

  const cSlug = slugify(cleanName);
  const existingChapters = getChaptersForSubject(sSlug);
  if (existingChapters.some((c) => c.slug === cSlug)) {
    return { ok: true, slug: cSlug }; // Already exists
  }

  const newChapterItem: ChapterTaxonomyItem = {
    slug: cSlug,
    name: cleanName,
  };

  // 1. Update runtime local taxonomy immediately
  runtimeTaxonomy = runtimeTaxonomy.map((sub) => {
    if (sub.slug === sSlug) {
      return {
        ...sub,
        chapters: [...sub.chapters, newChapterItem],
      };
    }
    return sub;
  });

  // 2. Persist to Firestore config document
  try {
    const configDocRef = doc(db, 'config', 'taxonomy');
    await setDoc(
      configDocRef,
      {
        [`customChapters.${sSlug}`]: arrayUnion(newChapterItem),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Taxonomy] Failed to persist custom chapter to Firestore:', err);
  }

  return { ok: true, slug: cSlug };
}

export const addNewChapterToTaxonomy = addAdminChapter;

/**
 * Computes deterministic content hash of question text + options for duplicate detection.
 */
export async function computeContentHash(q: string, options: string[]): Promise<string> {
  const normQ = (q || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normOpts = (options || [])
    .map((o) => (o || '').trim().toLowerCase().replace(/\s+/g, ' '))
    .sort()
    .join('|');

  const rawString = `${normQ}:::${normOpts}`;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(rawString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }

  // Pure JS hash fallback
  let hash1 = 0x811c9dc5;
  let hash2 = 0x27d4eb2f;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 = (hash2 << 5) - hash2 + char;
    hash2 |= 0;
  }
  return `h_${(hash1 >>> 0).toString(16)}_${(hash2 >>> 0).toString(16)}`;
}

export interface D1UniversitySeed {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  category: 'Engineering & CS' | 'Medical' | 'Business & General' | 'National Test';
  logo_url: string;
  sort_order: number;
}

export interface D1UniversityRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  sort_order: number;
  mcq_count: number;
  is_live: number;
  created_at: string;
}

export interface D1McqRow {
  id: string;
  university_id: string;
  university_slug?: string;
  import_batch_id?: string;
  subject: string;
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface D1ImportBatchRow {
  id: string;
  university_id: string;
  university_slug: string;
  source_type: string;
  file_name: string;
  row_count: number;
  imported_count: number;
  failed_count: number;
  created_at: string;
}

export interface D1BankHealthIntegrityReport {
  isHealthy: boolean;
  missingOrInvalidUniversityIdCount: number;
  slugMismatchCount: number;
  duplicateSlugs: string[];
  countMismatchUniversities: Array<{
    id: string;
    name: string;
    slug: string;
    stored_count: number;
    actual_count: number;
  }>;
}

export interface D1RepairUniversityGroup {
  university_id: string;
  university_name: string;
  university_slug: string;
  total_count: number;
  earliest_created_at: string;
  latest_created_at: string;
  suspected_fast_count: number;
  import_batches: Array<{
    import_batch_id: string;
    count: number;
    earliest_created_at: string;
    latest_created_at: string;
    file_name?: string;
  }>;
  sample_rows: D1McqRow[];
}

export interface D1McqReportRow {
  id: string;
  mcq_id: string;
  university_id: string;
  subject: string;
  topic: string;
  question_preview: string;
  question?: string;
  reason: string;
  comment: string;
  details?: string;
  user_id: string;
  user_email: string;
  status: 'open' | 'resolved' | 'ignored';
  created_at: string;
}

/**
 * Canonical pre-seeded Pakistani universities and national entry tests.
 * All start with mcq_count = 0 and is_live = 0 ("Coming Soon" in Cockpit)
 * and automatically switch to LIVE as soon as MCQs are added or imported.
 */
export const PRE_SEEDED_UNIVERSITIES: D1UniversitySeed[] = [
  {
    id: 'uni_fast_nuces',
    name: 'FAST-NUCES',
    slug: 'fast-nuces',
    shortName: 'FAST',
    category: 'Engineering & CS',
    logo_url: '',
    sort_order: 1,
  },
  {
    id: 'uni_nust_net',
    name: 'NUST (NET)',
    slug: 'nust-net',
    shortName: 'NUST',
    category: 'Engineering & CS',
    logo_url: '',
    sort_order: 2,
  },
  {
    id: 'uni_giki',
    name: 'GIKI',
    slug: 'giki',
    shortName: 'GIKI',
    category: 'Engineering & CS',
    logo_url: '',
    sort_order: 3,
  },
  {
    id: 'uni_comsats',
    name: 'COMSATS',
    slug: 'comsats',
    shortName: 'COMSATS',
    category: 'Engineering & CS',
    logo_url: '',
    sort_order: 4,
  },
  {
    id: 'uni_lums_lcat',
    name: 'LUMS (LCAT)',
    slug: 'lums-lcat',
    shortName: 'LUMS',
    category: 'Business & General',
    logo_url: '',
    sort_order: 5,
  },
  {
    id: 'uni_iba_karachi',
    name: 'IBA Karachi',
    slug: 'iba-karachi',
    shortName: 'IBA',
    category: 'Business & General',
    logo_url: '',
    sort_order: 6,
  },
  {
    id: 'uni_uet_ecat',
    name: 'UET (ECAT)',
    slug: 'uet-ecat',
    shortName: 'UET',
    category: 'Engineering & CS',
    logo_url: '',
    sort_order: 7,
  },
  {
    id: 'uni_pieas',
    name: 'PIEAS',
    slug: 'pieas',
    shortName: 'PIEAS',
    category: 'Engineering & CS',
    logo_url: '',
    sort_order: 8,
  },
  {
    id: 'uni_air_university',
    name: 'Air University',
    slug: 'air-university',
    shortName: 'AU',
    category: 'Engineering & CS',
    logo_url: '',
    sort_order: 9,
  },
  {
    id: 'uni_bahria_university',
    name: 'Bahria University',
    slug: 'bahria-university',
    shortName: 'BU',
    category: 'Engineering & CS',
    logo_url: '',
    sort_order: 10,
  },
  {
    id: 'uni_ned_university',
    name: 'NED University',
    slug: 'ned-university',
    shortName: 'NED',
    category: 'Engineering & CS',
    logo_url: '',
    sort_order: 11,
  },
  {
    id: 'uni_ecat',
    name: 'ECAT',
    slug: 'ecat',
    shortName: 'ECAT',
    category: 'National Test',
    logo_url: '',
    sort_order: 12,
  },
  {
    id: 'uni_mdcat',
    name: 'MDCAT',
    slug: 'mdcat',
    shortName: 'MDCAT',
    category: 'Medical',
    logo_url: '',
    sort_order: 13,
  },
  {
    id: 'uni_nums',
    name: 'NUMS',
    slug: 'nums',
    shortName: 'NUMS',
    category: 'Medical',
    logo_url: '',
    sort_order: 14,
  },
  {
    id: 'uni_etea',
    name: 'ETEA',
    slug: 'etea',
    shortName: 'ETEA',
    category: 'National Test',
    logo_url: '',
    sort_order: 15,
  },
  {
    id: 'uni_nts_nat',
    name: 'NTS NAT',
    slug: 'nts-nat',
    shortName: 'NAT',
    category: 'National Test',
    logo_url: '',
    sort_order: 16,
  },
  {
    id: 'uni_usat_hec',
    name: 'USAT (HEC)',
    slug: 'usat-hec',
    shortName: 'USAT',
    category: 'National Test',
    logo_url: '',
    sort_order: 17,
  },
  {
    id: 'uni_aku',
    name: 'AKU',
    slug: 'aku',
    shortName: 'AKU',
    category: 'Medical',
    logo_url: '',
    sort_order: 18,
  },
];

export const DEFAULT_UNIVERSITY_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'English',
  'Biology',
  'Analytical Reasoning',
  'Quantitative Reasoning',
  'Logical Reasoning',
] as const;

export function buildUniversitySlug(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `uni-${Date.now()}`;
}

export const DEFAULT_D1_UNIVERSITIES: D1UniversityRow[] = PRE_SEEDED_UNIVERSITIES.map((u) => ({
  id: u.id,
  name: u.name,
  slug: u.slug,
  logo_url: u.logo_url || '',
  sort_order: u.sort_order,
  mcq_count: 0,
  is_live: 0,
  created_at: '2025-01-01T00:00:00.000Z',
}));

export function normalizeCorrectLetter(
  raw: unknown,
  options?: { a?: string; b?: string; c?: string; d?: string } | string[]
): 'A' | 'B' | 'C' | 'D' | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number' && Number.isInteger(raw)) {
    const map: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    if (raw >= 0 && raw <= 3) return map[raw];
    if (raw >= 1 && raw <= 4) return map[raw - 1];
  }
  const str = String(raw).trim();
  if (!str) return null;

  const upper = str.toUpperCase();
  if (upper === 'A' || upper === 'OPTION A' || upper === '(A)' || upper === '0') return 'A';
  if (upper === 'B' || upper === 'OPTION B' || upper === '(B)' || upper === '1') return 'B';
  if (upper === 'C' || upper === 'OPTION C' || upper === '(C)' || upper === '2') return 'C';
  if (upper === 'D' || upper === 'OPTION D' || upper === '(D)' || upper === '3') return 'D';

  if (options) {
    const optObj = Array.isArray(options)
      ? { a: options[0], b: options[1], c: options[2], d: options[3] }
      : options;
    const norm = (s?: string) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const target = norm(str);
    if (target) {
      if (norm(optObj.a) === target) return 'A';
      if (norm(optObj.b) === target) return 'B';
      if (norm(optObj.c) === target) return 'C';
      if (norm(optObj.d) === target) return 'D';
    }
  }

  return null;
}

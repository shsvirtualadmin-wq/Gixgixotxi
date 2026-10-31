import {
  D1UniversityRow,
  D1McqRow,
  D1McqReportRow,
  normalizeCorrectLetter,
} from '../constants/d1Universities';
import { auth } from '../lib/firebase';

export interface ParsedImportMcqRow {
  rowIndex: number;
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
}

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ChunkImportProgress {
  importedCount: number;
  failedCount: number;
  processedRows: number;
  totalRows: number;
  currentChunkIndex: number;
  totalChunks: number;
  errors: ImportRowError[];
}

export interface ResumableImportState {
  universityId: string;
  defaultSubject: string;
  defaultTopic: string;
  rows: ParsedImportMcqRow[];
  nextRowOffset: number;
  importedCount: number;
  failedCount: number;
  errors: ImportRowError[];
}

export interface BankHealthData {
  ok: boolean;
  totalUniversities: number;
  liveUniversities: number;
  comingSoonUniversities: number;
  totalMcqs: number;
  missingExplanations: number;
  openReports: number;
  byUniversity: Array<{
    id: string;
    name: string;
    slug: string;
    mcq_count: number;
    is_live: number;
  }>;
  bySubject: Record<string, number>;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface LegacyBankSummary {
  ok: boolean;
  alreadyPurged: boolean;
  totalToDelete: number;
  subjectPools: Record<string, number>;
  backupTotalCount: number;
  backupPools: Record<string, number>;
  purgedAt: string | null;
  backupJsonUrl: string;
  backupCsvUrl: string;
}

async function getD1RequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = await auth.currentUser?.getIdToken(false).catch(() => null);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const localToken =
        window.localStorage.getItem('boardly_session_token') ||
        window.localStorage.getItem('boardly_cf_token');
      if (localToken) {
        headers['Authorization'] = `Bearer ${localToken}`;
      }
    }
  } catch {
    // Non-fatal
  }
  return headers;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const baseHeaders = await getD1RequestHeaders();
  const headers: Record<string, string> = {
    ...baseHeaders,
    ...((init?.headers as Record<string, string>) || {}),
  };
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

// ============================================================================
// Universities API (D1)
// ============================================================================

export async function fetchUniversities(): Promise<D1UniversityRow[]> {
  const res = await apiRequest<{ ok: boolean; universities: D1UniversityRow[] }>('/api/universities');
  return res.universities || [];
}

export async function createUniversity(payload: {
  name: string;
  slug?: string;
  logo_url?: string;
  sort_order?: number;
}): Promise<D1UniversityRow> {
  const res = await apiRequest<{ ok: boolean; university: D1UniversityRow }>('/api/universities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.university;
}

export async function updateUniversity(
  id: string,
  payload: Partial<{ name: string; slug: string; logo_url: string; sort_order: number }>
): Promise<D1UniversityRow> {
  const res = await apiRequest<{ ok: boolean; university: D1UniversityRow }>(
    `/api/universities/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
  return res.university;
}

export async function reorderUniversities(orderedIds: string[]): Promise<D1UniversityRow[]> {
  const res = await apiRequest<{ ok: boolean; universities: D1UniversityRow[] }>(
    '/api/universities/reorder',
    {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }
  );
  return res.universities || [];
}

export async function deleteUniversity(id: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/api/universities/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// MCQs API (D1)
// ============================================================================

export interface FetchMcqsParams {
  university_id?: string;
  university?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
  include_answers?: boolean;
}

export async function fetchMcqs(params: FetchMcqsParams = {}): Promise<{
  mcqs: D1McqRow[];
  total: number;
}> {
  const qs = new URLSearchParams();
  if (params.university_id) qs.set('university_id', params.university_id);
  if (params.university) qs.set('university', params.university);
  if (params.subject) qs.set('subject', params.subject);
  if (params.topic) qs.set('topic', params.topic);
  if (params.difficulty) qs.set('difficulty', params.difficulty);
  if (params.search) qs.set('search', params.search);
  if (typeof params.limit === 'number') qs.set('limit', String(params.limit));
  if (typeof params.offset === 'number') qs.set('offset', String(params.offset));
  if (params.include_answers) qs.set('include_answers', 'true');

  const res = await apiRequest<{ ok: boolean; mcqs: D1McqRow[]; total: number }>(
    `/api/mcqs?${qs.toString()}`
  );
  return {
    mcqs: res.mcqs || [],
    total: res.total ?? (res.mcqs || []).length,
  };
}

export async function fetchUniversityTopics(
  universityIdOrSlug?: string
): Promise<{
  subjects: Array<{
    subject: string;
    total: number;
    topics: Array<{ topic: string; count: number }>;
  }>;
  flat: Array<{ subject: string; topic: string; count: number }>;
}> {
  const qs = new URLSearchParams();
  if (universityIdOrSlug) qs.set('university_id', universityIdOrSlug);
  const res = await apiRequest<{
    ok: boolean;
    subjects: Array<{
      subject: string;
      total: number;
      topics: Array<{ topic: string; count: number }>;
    }>;
    flat: Array<{ subject: string; topic: string; count: number }>;
  }>(`/api/mcqs/topics?${qs.toString()}`);
  return {
    subjects: res.subjects || [],
    flat: res.flat || [],
  };
}

export async function createMcq(payload: {
  university_id: string;
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
}): Promise<D1McqRow> {
  const res = await apiRequest<{ ok: boolean; mcq: D1McqRow }>('/api/mcqs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.mcq;
}

export async function updateMcq(
  id: string,
  payload: Partial<{
    university_id: string;
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
  }>
): Promise<D1McqRow> {
  const res = await apiRequest<{ ok: boolean; mcq: D1McqRow }>(
    `/api/mcqs/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
  return res.mcq;
}

export async function deleteMcq(id: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/api/mcqs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function bulkDeleteMcqs(ids: string[], universityId?: string): Promise<number> {
  const res = await apiRequest<{ ok: boolean; deleted: number }>('/api/mcqs/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids, university_id: universityId }),
  });
  return res.deleted || 0;
}

export async function verifyMcqAnswers(
  questionIds: string[]
): Promise<Record<string, { correctIndex: number; correctAnswer: string; explanation: string }>> {
  if (!questionIds.length) return {};
  const res = await apiRequest<{
    ok: boolean;
    results: Record<string, { correctIndex: number; correctAnswer: string; explanation: string }>;
  }>('/api/mcqs/verify', {
    method: 'POST',
    body: JSON.stringify({ questionIds }),
  });
  return res.results || {};
}

// ============================================================================
// Health & Student Reports (D1)
// ============================================================================

export async function fetchBankHealth(): Promise<BankHealthData> {
  return apiRequest<BankHealthData>('/api/mcqs/health');
}

export async function fetchMcqReports(): Promise<D1McqReportRow[]> {
  const res = await apiRequest<{ ok: boolean; reports: D1McqReportRow[] }>('/api/mcqs/reports');
  return res.reports || [];
}

export async function submitMcqReport(payload: {
  mcq_id: string;
  university_id?: string;
  reason: string;
  details?: string;
  reported_by?: string;
}): Promise<D1McqReportRow> {
  const res = await apiRequest<{ ok: boolean; report: D1McqReportRow }>('/api/mcqs/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.report;
}

export async function updateMcqReportStatus(
  id: string,
  status: 'open' | 'resolved' | 'ignored'
): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/api/mcqs/reports/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ============================================================================
// Legacy Admin Bank Backup & Confirmed Delete
// ============================================================================

export async function fetchLegacyBankSummary(): Promise<LegacyBankSummary> {
  return apiRequest<LegacyBankSummary>('/api/admin/legacy-bank/summary');
}

export async function confirmDeleteLegacyAdminBank(): Promise<{
  ok: boolean;
  deletedCount: number;
  subjectPools: Record<string, number>;
  purgedAt: string;
}> {
  return apiRequest('/api/admin/legacy-bank/delete-confirmed', {
    method: 'POST',
    body: JSON.stringify({ confirm: true }),
  });
}

// ============================================================================
// Unlimited Bulk Importer: CSV, Google Sheets, Pasted Text / JSON + Chunked Upload
// ============================================================================

export function convertGoogleSheetToCsvUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return trimmed;
  const sheetId = match[1];
  const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
  const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
}

/**
 * RFC-4180 compliant CSV parser that handles multiline quoted fields,
 * escaped quotes (""), and preserves LaTeX / \ce{} backslashes intact.
 */
export function parseCsvRecords(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const text = csvText.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }
  return rows;
}

function normalizeDifficulty(raw: unknown): 'easy' | 'medium' | 'hard' {
  const val = String(raw ?? 'medium').trim().toLowerCase();
  if (val === 'easy' || val === 'e') return 'easy';
  if (val === 'hard' || val === 'h') return 'hard';
  return 'medium';
}

export function parseImportInput(
  rawInput: string,
  defaultSubject: string,
  defaultTopic: string
): { rows: ParsedImportMcqRow[]; parseErrors: ImportRowError[] } {
  const trimmed = rawInput.trim();
  const rows: ParsedImportMcqRow[] = [];
  const parseErrors: ImportRowError[] = [];

  if (!trimmed) {
    return { rows, parseErrors };
  }

  // 1. Check if JSON array or object with questions/mcqs array
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.mcqs)
        ? parsed.mcqs
        : Array.isArray(parsed.questions)
        ? parsed.questions
        : [parsed];

      list.forEach((item, idx) => {
        const rowNum = idx + 1;
        if (!item || typeof item !== 'object') {
          parseErrors.push({ row: rowNum, message: 'Invalid JSON row object' });
          return;
        }
        const question = String(item.question || item.stem || item.text || '').trim();
        const optionsArr = Array.isArray(item.options) ? item.options : [];
        const option_a = String(item.option_a ?? item.optionA ?? item.a ?? optionsArr[0] ?? '').trim();
        const option_b = String(item.option_b ?? item.optionB ?? item.b ?? optionsArr[1] ?? '').trim();
        const option_c = String(item.option_c ?? item.optionC ?? item.c ?? optionsArr[2] ?? '').trim();
        const option_d = String(item.option_d ?? item.optionD ?? item.d ?? optionsArr[3] ?? '').trim();
        const correct = normalizeCorrectLetter(
          item.correct_answer ?? item.correctAnswer ?? item.answer ?? item.correctIndex,
          [option_a, option_b, option_c, option_d]
        );

        if (!question) {
          parseErrors.push({ row: rowNum, message: 'Missing question text' });
          return;
        }
        if (!option_a || !option_b || !option_c || !option_d) {
          parseErrors.push({ row: rowNum, message: 'All 4 options (A, B, C, D) are required' });
          return;
        }
        if (!correct) {
          parseErrors.push({
            row: rowNum,
            message: 'Invalid correct_answer (must be A, B, C, D or 0-3)',
          });
          return;
        }

        rows.push({
          rowIndex: rowNum,
          subject: String(item.subject || defaultSubject || 'General').trim(),
          topic: String(item.topic || item.chapter || defaultTopic || 'General').trim(),
          question,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer: correct,
          explanation: String(item.explanation || item.solution || '').trim(),
          difficulty: normalizeDifficulty(item.difficulty),
        });
      });

      return { rows, parseErrors };
    } catch {
      // Fall through to text/CSV parsing if not valid JSON
    }
  }

  // 2. Check if structured pasted MCQ blocks (e.g. Q: ... A) ... B) ... C) ... D) ... Answer: ...)
  const looksLikeBlockFormat =
    /(?:^|\n)\s*(?:Q\d*[:.)]|Question\s*\d*[:.)])/i.test(trimmed) &&
    /(?:^|\n)\s*[A-D][).:-]\s+/i.test(trimmed);

  if (looksLikeBlockFormat) {
    const blocks = trimmed
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter(Boolean);

    blocks.forEach((block, idx) => {
      const rowNum = idx + 1;
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      let question = '';
      let option_a = '';
      let option_b = '';
      let option_c = '';
      let option_d = '';
      let rawCorrect = '';
      let explanation = '';
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      let subject = defaultSubject || 'General';
      let topic = defaultTopic || 'General';

      for (const line of lines) {
        if (/^(?:Q\d*|Question\s*\d*)[:.)]\s*/i.test(line)) {
          question = line.replace(/^(?:Q\d*|Question\s*\d*)[:.)]\s*/i, '').trim();
        } else if (/^[Aa][).:-]\s*/.test(line)) {
          option_a = line.replace(/^[Aa][).:-]\s*/, '').trim();
        } else if (/^[Bb][).:-]\s*/.test(line)) {
          option_b = line.replace(/^[Bb][).:-]\s*/, '').trim();
        } else if (/^[Cc][).:-]\s*/.test(line)) {
          option_c = line.replace(/^[Cc][).:-]\s*/, '').trim();
        } else if (/^[Dd][).:-]\s*/.test(line)) {
          option_d = line.replace(/^[Dd][).:-]\s*/, '').trim();
        } else if (/^(?:Ans|Answer|Correct(?:\s*Answer)?)[:.\s-]+/i.test(line)) {
          rawCorrect = line.replace(/^(?:Ans|Answer|Correct(?:\s*Answer)?)[:.\s-]+/i, '').trim();
        } else if (/^(?:Exp|Explanation|Solution)[:.\s-]+/i.test(line)) {
          explanation = line.replace(/^(?:Exp|Explanation|Solution)[:.\s-]+/i, '').trim();
        } else if (/^(?:Difficulty)[:.\s-]+/i.test(line)) {
          difficulty = normalizeDifficulty(line.replace(/^(?:Difficulty)[:.\s-]+/i, ''));
        } else if (/^(?:Subject)[:.\s-]+/i.test(line)) {
          subject = line.replace(/^(?:Subject)[:.\s-]+/i, '').trim() || subject;
        } else if (/^(?:Topic|Chapter)[:.\s-]+/i.test(line)) {
          topic = line.replace(/^(?:Topic|Chapter)[:.\s-]+/i, '').trim() || topic;
        } else if (!option_a && !option_b) {
          question = question ? `${question} ${line}` : line;
        }
      }

      const correct = normalizeCorrectLetter(rawCorrect, [option_a, option_b, option_c, option_d]);
      if (!question) {
        parseErrors.push({ row: rowNum, message: 'Missing question text in pasted block' });
        return;
      }
      if (!option_a || !option_b || !option_c || !option_d) {
        parseErrors.push({ row: rowNum, message: 'Missing one or more options A/B/C/D in block' });
        return;
      }
      if (!correct) {
        parseErrors.push({
          row: rowNum,
          message: `Missing or invalid Answer line ("${rawCorrect || 'empty'}")`,
        });
        return;
      }

      rows.push({
        rowIndex: rowNum,
        subject,
        topic,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer: correct,
        explanation,
        difficulty,
      });
    });

    return { rows, parseErrors };
  }

  // 3. Default: CSV / TSV table parsing
  const csvRows = parseCsvRecords(trimmed);
  if (csvRows.length === 0) {
    return { rows, parseErrors };
  }

  const firstRowLower = csvRows[0].map((h) =>
    h
      .toLowerCase()
      .replace(/[\s_-]+/g, '')
      .trim()
  );
  const hasHeader =
    firstRowLower.includes('question') ||
    firstRowLower.includes('optiona') ||
    firstRowLower.includes('correctanswer') ||
    firstRowLower.includes('subject');

  let colMap = {
    subject: -1,
    topic: -1,
    question: 0,
    option_a: 1,
    option_b: 2,
    option_c: 3,
    option_d: 4,
    correct_answer: 5,
    explanation: 6,
    difficulty: 7,
  };

  let startIndex = 0;
  if (hasHeader) {
    startIndex = 1;
    colMap = {
      subject: firstRowLower.findIndex((c) => c === 'subject' || c === 'course'),
      topic: firstRowLower.findIndex((c) => c === 'topic' || c === 'chapter' || c === 'unit'),
      question: firstRowLower.findIndex(
        (c) => c === 'question' || c === 'stem' || c === 'questiontext'
      ),
      option_a: firstRowLower.findIndex(
        (c) => c === 'optiona' || c === 'a' || c === 'choicea' || c === 'opt1'
      ),
      option_b: firstRowLower.findIndex(
        (c) => c === 'optionb' || c === 'b' || c === 'choiceb' || c === 'opt2'
      ),
      option_c: firstRowLower.findIndex(
        (c) => c === 'optionc' || c === 'c' || c === 'choicec' || c === 'opt3'
      ),
      option_d: firstRowLower.findIndex(
        (c) => c === 'optiond' || c === 'd' || c === 'choiced' || c === 'opt4'
      ),
      correct_answer: firstRowLower.findIndex(
        (c) =>
          c === 'correctanswer' ||
          c === 'correct' ||
          c === 'answer' ||
          c === 'ans' ||
          c === 'key'
      ),
      explanation: firstRowLower.findIndex(
        (c) => c === 'explanation' || c === 'solution' || c === 'rationale'
      ),
      difficulty: firstRowLower.findIndex((c) => c === 'difficulty' || c === 'level'),
    };
  } else if (csvRows[0].length >= 9) {
    // Standard 9 or 10 column row: subject, topic, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty
    colMap = {
      subject: 0,
      topic: 1,
      question: 2,
      option_a: 3,
      option_b: 4,
      option_c: 5,
      option_d: 6,
      correct_answer: 7,
      explanation: 8,
      difficulty: 9,
    };
  }

  for (let i = startIndex; i < csvRows.length; i++) {
    const cells = csvRows[i];
    const rowNum = i + 1;
    if (!cells || cells.every((c) => !c.trim())) continue;

    const getCell = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx].trim() : '');

    const subject = getCell(colMap.subject) || defaultSubject || 'General';
    const topic = getCell(colMap.topic) || defaultTopic || 'General';
    const question = getCell(colMap.question);
    const option_a = getCell(colMap.option_a);
    const option_b = getCell(colMap.option_b);
    const option_c = getCell(colMap.option_c);
    const option_d = getCell(colMap.option_d);
    const rawCorrect = getCell(colMap.correct_answer);
    const explanation = getCell(colMap.explanation);
    const difficulty = normalizeDifficulty(getCell(colMap.difficulty) || 'medium');

    const correct = normalizeCorrectLetter(rawCorrect, [option_a, option_b, option_c, option_d]);

    if (!question) {
      parseErrors.push({ row: rowNum, message: 'Missing question text' });
      continue;
    }
    if (!option_a || !option_b || !option_c || !option_d) {
      parseErrors.push({ row: rowNum, message: 'All 4 options (option_a..option_d) are required' });
      continue;
    }
    if (!correct) {
      parseErrors.push({
        row: rowNum,
        message: `Invalid correct_answer "${rawCorrect}" (expected A, B, C, or D)`,
      });
      continue;
    }

    rows.push({
      rowIndex: rowNum,
      subject,
      topic,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer: correct,
      explanation,
      difficulty,
    });
  }

  return { rows, parseErrors };
}

/**
 * Uploads any number of rows in chunks (default 100 rows per chunk) with live progress
 * callbacks, per-row error reporting, and resumable state if a chunk encounters a network issue.
 */
export async function runChunkedMcqImport(options: {
  state: ResumableImportState;
  chunkSize?: number;
  onProgress?: (progress: ChunkImportProgress, updatedState: ResumableImportState) => void;
  signal?: AbortSignal;
}): Promise<{
  completed: boolean;
  state: ResumableImportState;
}> {
  const chunkSize = options.chunkSize || 100;
  const state: ResumableImportState = {
    ...options.state,
    errors: [...options.state.errors],
  };

  const totalRows = state.rows.length;
  const totalChunks = Math.max(1, Math.ceil(totalRows / chunkSize));

  while (state.nextRowOffset < totalRows) {
    if (options.signal?.aborted) {
      return { completed: false, state };
    }

    const chunkStart = state.nextRowOffset;
    const chunkRows = state.rows.slice(chunkStart, chunkStart + chunkSize);
    const currentChunkIndex = Math.floor(chunkStart / chunkSize) + 1;

    const response = await apiRequest<{
      ok: boolean;
      imported: number;
      failed: number;
      errors: Array<{ row: number; message: string }>;
    }>('/api/mcqs/import-chunk', {
      method: 'POST',
      body: JSON.stringify({
        university_id: state.universityId,
        default_subject: state.defaultSubject,
        default_topic: state.defaultTopic,
        chunk_offset: chunkStart,
        rows: chunkRows,
      }),
      signal: options.signal,
    });

    state.importedCount += response.imported || 0;
    state.failedCount += response.failed || 0;
    if (Array.isArray(response.errors) && response.errors.length > 0) {
      state.errors.push(...response.errors);
    }
    state.nextRowOffset = chunkStart + chunkRows.length;

    if (options.onProgress) {
      options.onProgress(
        {
          importedCount: state.importedCount,
          failedCount: state.failedCount,
          processedRows: state.nextRowOffset,
          totalRows,
          currentChunkIndex,
          totalChunks,
          errors: state.errors,
        },
        { ...state, errors: [...state.errors] }
      );
    }

    // Yield to browser between chunks so UI counter & progress bar stay 60fps smooth
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  return { completed: true, state };
}

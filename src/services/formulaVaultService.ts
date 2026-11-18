import {
  D1FormulaCategoryRow,
  D1FormulaChapterRow,
  D1FormulaItemRow,
  D1FormulaReportRow,
  D1FormulaImportLogRow,
  FORMULA_VAULT_CATEGORIES_SEED,
  FORMULA_VAULT_CHAPTERS_SEED,
  FORMULA_VAULT_ITEMS_SEED,
} from '../constants/formulaVaultSeed';
import { auth } from '../lib/firebase';
import { validateMath } from '../lib/math';

export interface FormulaOfTheDayItem extends D1FormulaItemRow {
  chapter_title: string;
  chapter_no: number;
  category_name: string;
}

export interface FormulaVaultOverviewResponse {
  categories: D1FormulaCategoryRow[];
  chapters: D1FormulaChapterRow[];
  formulaOfTheDay: FormulaOfTheDayItem | null;
  bookmarkedIds: string[];
  isGuest: boolean;
}

export interface FormulaChapterDetailResponse {
  chapter: D1FormulaChapterRow;
  category: D1FormulaCategoryRow | null;
  formulas: D1FormulaItemRow[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FormulaSearchResponse {
  query: string;
  chapters: D1FormulaChapterRow[];
  formulas: Array<
    D1FormulaItemRow & {
      chapter_title?: string;
      chapter_no?: number;
      category_name?: string;
    }
  >;
}

export interface FormulaBankHealthData {
  ok: boolean;
  totalCategories: number;
  totalChapters: number;
  totalFormulas: number;
  liveFormulas: number;
  draftFormulas: number;
  brokenFormulasCount: number;
  emptyChaptersCount: number;
  duplicateFormulasCount: number;
  openReportsCount: number;
  brokenFormulas: Array<
    D1FormulaItemRow & {
      error: string;
      chapter_title: string;
      category_name: string;
    }
  >;
  emptyChapters: Array<
    D1FormulaChapterRow & {
      category_name: string;
    }
  >;
  duplicateFormulas: Array<{
    formula: D1FormulaItemRow;
    duplicateOfId: string;
    reason: string;
    chapter_title: string;
    category_name: string;
  }>;
}

export interface ParsedFormulaImportRow {
  rowNumber: number;
  category: string;
  chapter_no: number;
  chapter: string;
  subtopics: string;
  formula_no: number;
  title: string;
  formula_latex: string;
  note: string;
  isValid: boolean;
  isDuplicate: boolean;
  error?: string;
  duplicateReason?: string;
}

export interface FormulaImportRowError {
  rowNumber: number;
  reason: string;
}

export interface FormulaChunkImportProgress {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  processedRows: number;
  totalRows: number;
  currentChunkIndex: number;
  totalChunks: number;
  errors: FormulaImportRowError[];
  failedChunkIndex?: number | null;
  failedChunkMessage?: string | null;
}

async function getAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
  try {
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Guest fallback
  }
  return headers;
}

// ── In-memory caches for instant navigation & zero flicker ────────────────────
let cachedOverview: FormulaVaultOverviewResponse | null = null;
let cachedOverviewAt = 0;
const chapterFormulaCache = new Map<string, FormulaChapterDetailResponse>();

export function invalidateFormulaVaultCache(chapterId?: string): void {
  cachedOverview = null;
  cachedOverviewAt = 0;
  if (chapterId) {
    chapterFormulaCache.delete(`${chapterId}:0`);
    chapterFormulaCache.delete(`${chapterId}:1`);
  } else {
    chapterFormulaCache.clear();
  }
}

export async function fetchFormulaVaultOverview(options?: {
  includeDrafts?: boolean;
  forceRefresh?: boolean;
}): Promise<FormulaVaultOverviewResponse> {
  const includeDrafts = Boolean(options?.includeDrafts);
  const now = Date.now();
  if (!includeDrafts && !options?.forceRefresh && cachedOverview && now - cachedOverviewAt < 45_000) {
    return cachedOverview;
  }

  try {
    const headers = await getAuthHeaders();
    const qs = includeDrafts ? '?include_drafts=1' : '';
    const res = await fetch(`/api/formulas/overview${qs}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const result: FormulaVaultOverviewResponse = {
          categories: Array.isArray(data.categories) ? data.categories : FORMULA_VAULT_CATEGORIES_SEED,
          chapters: Array.isArray(data.chapters) ? data.chapters : FORMULA_VAULT_CHAPTERS_SEED,
          formulaOfTheDay: data.formulaOfTheDay || null,
          bookmarkedIds: Array.isArray(data.bookmarkedIds) ? data.bookmarkedIds : [],
          isGuest: Boolean(data.isGuest),
        };
        if (!includeDrafts) {
          cachedOverview = result;
          cachedOverviewAt = now;
        }
        return result;
      }
    }
  } catch {
    // Fallback to local seed
  }

  const featured = FORMULA_VAULT_ITEMS_SEED.filter((f) => f.is_featured === 1);
  const fotd = featured[0] || FORMULA_VAULT_ITEMS_SEED[0] || null;
  const fotdCh = fotd ? FORMULA_VAULT_CHAPTERS_SEED.find((c) => c.id === fotd.chapter_id) : null;
  const fotdCat = fotd ? FORMULA_VAULT_CATEGORIES_SEED.find((c) => c.id === fotd.category_id) : null;

  return {
    categories: FORMULA_VAULT_CATEGORIES_SEED,
    chapters: FORMULA_VAULT_CHAPTERS_SEED,
    formulaOfTheDay: fotd
      ? {
          ...fotd,
          chapter_title: fotdCh?.title || '',
          chapter_no: fotdCh?.chapter_no || 1,
          category_name: fotdCat?.name || '',
        }
      : null,
    bookmarkedIds: [],
    isGuest: !auth?.currentUser,
  };
}

export async function fetchChapterFormulas(
  chapterId: string,
  options?: { includeDrafts?: boolean; forceRefresh?: boolean }
): Promise<FormulaChapterDetailResponse> {
  const includeDrafts = Boolean(options?.includeDrafts);
  const cacheKey = `${chapterId}:${includeDrafts ? '1' : '0'}`;
  if (!options?.forceRefresh && chapterFormulaCache.has(cacheKey)) {
    return chapterFormulaCache.get(cacheKey)!;
  }

  try {
    const headers = await getAuthHeaders();
    const qs = includeDrafts ? '?include_drafts=1&page_size=200' : '?page_size=200';
    const res = await fetch(`/api/formulas/chapters/${encodeURIComponent(chapterId)}${qs}`, {
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.chapter) {
        const result: FormulaChapterDetailResponse = {
          chapter: data.chapter,
          category: data.category || null,
          formulas: Array.isArray(data.formulas) ? data.formulas : [],
          total: Number(data.total || 0),
          page: Number(data.page || 1),
          pageSize: Number(data.pageSize || 200),
          hasMore: Boolean(data.hasMore),
        };
        chapterFormulaCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // Fallback to seed
  }

  const ch =
    FORMULA_VAULT_CHAPTERS_SEED.find((c) => c.id === chapterId || c.slug === chapterId) ||
    FORMULA_VAULT_CHAPTERS_SEED[0];
  const cat = FORMULA_VAULT_CATEGORIES_SEED.find((c) => c.id === ch?.category_id) || null;
  const items = FORMULA_VAULT_ITEMS_SEED.filter((f) => f.chapter_id === ch?.id);
  const fallback: FormulaChapterDetailResponse = {
    chapter: ch,
    category: cat,
    formulas: items,
    total: items.length,
    page: 1,
    pageSize: 200,
    hasMore: false,
  };
  chapterFormulaCache.set(cacheKey, fallback);
  return fallback;
}

export async function searchFormulaVault(
  query: string,
  categoryId?: string
): Promise<FormulaSearchResponse> {
  const q = String(query || '').trim();
  if (!q) {
    return { query: '', chapters: [], formulas: [] };
  }
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ q });
    if (categoryId) params.set('category_id', categoryId);
    const res = await fetch(`/api/formulas/search?${params.toString()}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          query: q,
          chapters: Array.isArray(data.chapters) ? data.chapters : [],
          formulas: Array.isArray(data.formulas) ? data.formulas : [],
        };
      }
    }
  } catch {
    // Local search fallback
  }

  const lower = q.toLowerCase();
  const chapters = FORMULA_VAULT_CHAPTERS_SEED.filter(
    (c) => (!categoryId || c.category_id === categoryId) && c.search_text.includes(lower)
  );
  const formulas = FORMULA_VAULT_ITEMS_SEED.filter(
    (f) => (!categoryId || f.category_id === categoryId) && f.search_text.includes(lower)
  ).map((f) => {
    const ch = FORMULA_VAULT_CHAPTERS_SEED.find((c) => c.id === f.chapter_id);
    const cat = FORMULA_VAULT_CATEGORIES_SEED.find((c) => c.id === f.category_id);
    return {
      ...f,
      chapter_title: ch?.title || '',
      chapter_no: ch?.chapter_no || 1,
      category_name: cat?.name || '',
    };
  });

  return { query: q, chapters, formulas };
}

export async function toggleFormulaBookmark(formulaId: string): Promise<{
  bookmarked: boolean;
  bookmarkedIds: string[];
}> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/bookmarks/toggle', {
    method: 'POST',
    headers,
    body: JSON.stringify({ formula_id: formulaId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Sign in required to save bookmarks.');
  }
  if (cachedOverview) {
    cachedOverview = {
      ...cachedOverview,
      bookmarkedIds: Array.isArray(data.bookmarkedIds) ? data.bookmarkedIds : cachedOverview.bookmarkedIds,
    };
  }
  return {
    bookmarked: Boolean(data.bookmarked),
    bookmarkedIds: Array.isArray(data.bookmarkedIds) ? data.bookmarkedIds : [],
  };
}

export async function fetchBookmarkedFormulas(): Promise<
  Array<
    D1FormulaItemRow & {
      chapter_title?: string;
      chapter_no?: number;
      category_name?: string;
    }
  >
> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/bookmarks', { headers });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data.bookmarks) ? data.bookmarks : [];
}

export async function requestChapterPdfSignedUrl(chapterId: string): Promise<{
  downloadUrl: string;
  r2Key: string;
  expiresAt: number;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/formulas/chapters/${encodeURIComponent(chapterId)}/pdf-url`, {
    method: 'POST',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const err: any = new Error(data.error || 'Unable to generate chapter PDF.');
    err.requiresPro = Boolean(data.requiresPro || data.code === 'PRO_REQUIRED');
    err.requiresAuth = Boolean(data.requiresAuth || data.code === 'AUTH_REQUIRED');
    throw err;
  }
  return {
    downloadUrl: String(data.downloadUrl || data.signedUrl || ''),
    r2Key: String(data.r2Key || ''),
    expiresAt: Number(data.expiresAt || 0),
  };
}

export async function submitFormulaReport(params: {
  formulaId: string;
  reason: string;
  details: string;
}): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/reports', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      formula_id: params.formulaId,
      reason: params.reason,
      details: params.details,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to submit formula report.');
  }
  return String(data.reportId || '');
}

// ── Admin CRUD & Management ─────────────────────────────────────────────────

export async function createFormulaCategory(payload: {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  guest_access?: boolean;
}): Promise<D1FormulaCategoryRow> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/categories', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create category.');
  }
  invalidateFormulaVaultCache();
  return data.category;
}

export async function updateFormulaCategory(
  id: string,
  payload: Partial<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    guest_access: boolean;
    is_active: boolean;
    sort_order: number;
  }>
): Promise<D1FormulaCategoryRow> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/formulas/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update category.');
  }
  invalidateFormulaVaultCache();
  return data.category;
}

export async function reorderFormulaCategories(
  orderedIds: string[]
): Promise<D1FormulaCategoryRow[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/categories/reorder', {
    method: 'POST',
    headers,
    body: JSON.stringify({ orderedIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reorder categories.');
  }
  invalidateFormulaVaultCache();
  return data.categories || [];
}

export async function deleteFormulaCategory(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/formulas/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete category.');
  }
  invalidateFormulaVaultCache();
}

export async function createFormulaChapter(payload: {
  category_id: string;
  chapter_no?: number;
  title: string;
  subtopics?: string;
  status?: 'live' | 'draft';
}): Promise<D1FormulaChapterRow> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/chapters', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create chapter.');
  }
  invalidateFormulaVaultCache();
  return data.chapter;
}

export async function updateFormulaChapter(
  id: string,
  payload: Partial<{
    chapter_no: number;
    title: string;
    subtopics: string;
    status: 'live' | 'draft';
    sort_order: number;
  }>
): Promise<D1FormulaChapterRow> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/formulas/chapters/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update chapter.');
  }
  invalidateFormulaVaultCache(id);
  return data.chapter;
}

export async function reorderFormulaChapters(
  categoryId: string,
  orderedIds: string[]
): Promise<D1FormulaChapterRow[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/chapters/reorder', {
    method: 'POST',
    headers,
    body: JSON.stringify({ category_id: categoryId, orderedIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reorder chapters.');
  }
  invalidateFormulaVaultCache();
  return data.chapters || [];
}

export async function deleteFormulaChapter(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/formulas/chapters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete chapter.');
  }
  invalidateFormulaVaultCache(id);
}

export async function createFormulaItem(payload: {
  chapter_id: string;
  formula_no?: number;
  title?: string;
  formula_latex: string;
  formula_plain?: string;
  note?: string;
  status?: 'live' | 'draft';
  is_featured?: boolean;
}): Promise<D1FormulaItemRow> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/items', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create formula.');
  }
  invalidateFormulaVaultCache(payload.chapter_id);
  return data.formula;
}

export async function updateFormulaItem(
  id: string,
  payload: Partial<{
    formula_no: number;
    title: string;
    formula_latex: string;
    formula_plain: string;
    note: string;
    status: 'live' | 'draft';
    is_featured: boolean;
    sort_order: number;
  }>
): Promise<D1FormulaItemRow> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/formulas/items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update formula.');
  }
  invalidateFormulaVaultCache(data.formula?.chapter_id);
  return data.formula;
}

export async function reorderFormulaItems(
  chapterId: string,
  orderedIds: string[]
): Promise<D1FormulaItemRow[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/items/reorder', {
    method: 'POST',
    headers,
    body: JSON.stringify({ chapter_id: chapterId, orderedIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reorder formulas.');
  }
  invalidateFormulaVaultCache(chapterId);
  return data.formulas || [];
}

export async function deleteFormulaItem(id: string, chapterId?: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/formulas/items/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete formula.');
  }
  invalidateFormulaVaultCache(chapterId);
}

export async function downloadFormulaCsvExport(params: {
  chapterId?: string;
  categoryId?: string;
  filenameHint?: string;
}): Promise<void> {
  const headers = await getAuthHeaders();
  const qs = new URLSearchParams();
  if (params.chapterId) qs.set('chapter_id', params.chapterId);
  if (params.categoryId) qs.set('category_id', params.categoryId);
  const res = await fetch(`/api/formulas/export-csv?${qs.toString()}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to export CSV.');
  }
  const csvText = await res.text();
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${params.filenameHint || 'formulas_export'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function fetchFormulaBankHealth(): Promise<FormulaBankHealthData> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/health', { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load Formula Bank health.');
  }
  const h = data.health || data;
  return {
    ok: Boolean(h.ok ?? true),
    totalCategories: Number(h.totalCategories || 0),
    totalChapters: Number(h.totalChapters || 0),
    totalFormulas: Number(h.totalFormulas || 0),
    liveFormulas: Number(h.liveFormulas || 0),
    draftFormulas: Number(h.draftFormulas || 0),
    brokenFormulasCount: Number(
      h.brokenFormulasCount ?? (Array.isArray(h.brokenFormulas) ? h.brokenFormulas.length : 0)
    ),
    emptyChaptersCount: Number(
      h.emptyChaptersCount ?? (Array.isArray(h.emptyChapters) ? h.emptyChapters.length : 0)
    ),
    duplicateFormulasCount: Number(
      h.duplicateFormulasCount ??
        (Array.isArray(h.duplicateFormulas) ? h.duplicateFormulas.length : 0)
    ),
    openReportsCount: Number(h.openReportsCount || 0),
    brokenFormulas: Array.isArray(h.brokenFormulas) ? h.brokenFormulas : [],
    emptyChapters: Array.isArray(h.emptyChapters) ? h.emptyChapters : [],
    duplicateFormulas: Array.isArray(h.duplicateFormulas) ? h.duplicateFormulas : [],
  };
}

export async function fixFormulaBankHealth(action: string): Promise<{ fixedCount: number }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/formulas/health/fix', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fix Formula Bank issues.');
  }
  invalidateFormulaVaultCache();
  return { fixedCount: Number(data.fixedCount || 0) };
}

export async function fetchFormulaReports(status = 'all'): Promise<{
  reports: Array<
    D1FormulaReportRow & {
      formula_latex?: string;
      formula_no?: number;
      formula_note?: string;
      chapter_title?: string;
      category_name?: string;
    }
  >;
  importLogs: D1FormulaImportLogRow[];
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/formulas/reports?status=${encodeURIComponent(status)}`, {
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load formula reports.');
  }
  return {
    reports: Array.isArray(data.reports) ? data.reports : [],
    importLogs: Array.isArray(data.importLogs) ? data.importLogs : [],
  };
}

export async function updateFormulaReportStatus(
  id: string,
  status: 'open' | 'resolved' | 'ignored'
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/formulas/reports/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update report status.');
  }
}

// ── Bulk Import Formulas Parser & 100-Row Chunk Importer ────────────────────

function splitCsvRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

export function generateFormulaImportTemplateCsv(categoryName = 'Basic Maths'): string {
  const header = 'category,chapter_no,chapter,subtopics,formula_no,formula_latex,note';
  const rows = [
    `"${categoryName}",14,"Percentages","Percent Change · Successive Change · Reverse Percentage",1,"\\text{Percentage} = \\frac{\\text{Part}}{\\text{Whole}} \\times 100\\%","Basic percentage definition"`,
    `"${categoryName}",14,"Percentages","Percent Change · Successive Change · Reverse Percentage",2,"\\text{Net \\% Change} = \\left(a + b + \\frac{ab}{100}\\right)\\%","Two successive percentage changes"`,
    `"${categoryName}",15,"Logarithms","Product Rule · Change of Base",1,"\\log_b(xy) = \\log_b(x) + \\log_b(y)","Logarithm product rule"`,
  ];
  return [header, ...rows].join('\n');
}

export function parseFormulaImportInput(
  rawText: string,
  options: {
    lockedCategoryName: string;
    defaultChapterTitle?: string;
    existingFormulasInCategory?: D1FormulaItemRow[];
    existingChaptersInCategory?: D1FormulaChapterRow[];
  }
): {
  rows: ParsedFormulaImportRow[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
} {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) {
    return { rows: [], validCount: 0, invalidCount: 0, duplicateCount: 0 };
  }

  const rawObjects: Array<Record<string, any>> = [];

  // 1. Try JSON array
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed.rows) ? parsed.rows : [parsed];
      for (const item of arr) {
        if (item && typeof item === 'object') rawObjects.push(item);
      }
    } catch {
      // Fall through to CSV/block parser
    }
  }

  // 2. CSV / TSV or Formula Block parser
  if (rawObjects.length === 0) {
    const lines = trimmed
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length > 0) {
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';
      const firstCols = splitCsvRow(firstLine, delimiter).map((c) =>
        c.toLowerCase().replace(/[^a-z0-9_]/g, '')
      );

      const looksLikeHeader =
        firstCols.includes('formula_latex') ||
        firstCols.includes('formulalatex') ||
        firstCols.includes('latex') ||
        firstCols.includes('formula') ||
        firstCols.includes('chapter');

      if (looksLikeHeader) {
        for (let i = 1; i < lines.length; i++) {
          const cols = splitCsvRow(lines[i], delimiter);
          const obj: Record<string, any> = {};
          firstCols.forEach((colName, idx) => {
            obj[colName] = cols[idx] ?? '';
          });
          rawObjects.push(obj);
        }
      } else {
        // Formula blocks or headerless CSV
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const cols = splitCsvRow(line, delimiter);
          if (cols.length >= 6) {
            rawObjects.push({
              category: cols[0],
              chapter_no: cols[1],
              chapter: cols[2],
              subtopics: cols[3],
              formula_no: cols[4],
              formula_latex: cols[5],
              note: cols[6] || '',
            });
          } else if (line.includes('|')) {
            const parts = line.split('|').map((p) => p.trim());
            rawObjects.push({
              chapter: parts[0] || options.defaultChapterTitle || '',
              formula_no: i + 1,
              formula_latex: parts[1] || parts[0] || '',
              note: parts[2] || '',
            });
          } else {
            rawObjects.push({
              chapter: options.defaultChapterTitle || '',
              formula_no: i + 1,
              formula_latex: line,
              note: '',
            });
          }
        }
      }
    }
  }

  // Build existing lookup for duplicate detection
  const existingChaptersByTitle = new Map<string, D1FormulaChapterRow>();
  for (const ch of options.existingChaptersInCategory || []) {
    existingChaptersByTitle.set(ch.title.trim().toLowerCase(), ch);
  }
  const existingFormulas = options.existingFormulasInCategory || [];
  const seenInBatch = new Set<string>();

  const rows: ParsedFormulaImportRow[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < rawObjects.length; i++) {
    const r = rawObjects[i];
    const rowNumber = i + 1;
    const chapter = String(
      r.chapter ?? r.chapter_title ?? r.chaptertitle ?? options.defaultChapterTitle ?? ''
    ).trim();
    const subtopics = String(r.subtopics ?? r.subtopic ?? '').trim();
    const chapterNoRaw = Number(r.chapter_no ?? r.chapterno ?? 0);
    const chapter_no = Number.isFinite(chapterNoRaw) && chapterNoRaw > 0 ? chapterNoRaw : 1;
    const formulaNoRaw = Number(r.formula_no ?? r.formulano ?? 0);
    const formula_no = Number.isFinite(formulaNoRaw) && formulaNoRaw > 0 ? formulaNoRaw : rowNumber;
    const formula_latex = String(
      r.formula_latex ?? r.formulalatex ?? r.latex ?? r.formula ?? ''
    ).trim();
    const note = String(r.note ?? r.notes ?? r.explanation ?? '').trim();
    const title = String(r.title ?? r.name ?? '').trim();

    let error: string | undefined;
    if (!chapter) {
      error = 'Missing chapter (specify chapter column or choose a default chapter)';
    } else if (!formula_latex) {
      error = 'Missing formula_latex';
    } else {
      const check = validateMath(formula_latex);
      if (!check.valid) {
        error = `Broken LaTeX: ${check.error || 'unbalanced braces or invalid syntax'}`;
      }
    }

    let isDuplicate = false;
    let duplicateReason: string | undefined;
    const batchKeyNo = `${chapter.toLowerCase()}::no::${formula_no}`;
    const batchKeyLatex = `${chapter.toLowerCase()}::latex::${formula_latex.toLowerCase()}`;

    if (!error) {
      if (seenInBatch.has(batchKeyNo) || seenInBatch.has(batchKeyLatex)) {
        isDuplicate = true;
        duplicateReason = `Duplicate formula_no #${formula_no} or identical LaTeX inside this file`;
      } else {
        seenInBatch.add(batchKeyNo);
        seenInBatch.add(batchKeyLatex);
        const targetCh = existingChaptersByTitle.get(chapter.toLowerCase());
        if (targetCh) {
          const matchExisting = existingFormulas.find(
            (ef) =>
              ef.chapter_id === targetCh.id &&
              (ef.formula_no === formula_no ||
                ef.formula_latex.trim().toLowerCase() === formula_latex.toLowerCase())
          );
          if (matchExisting) {
            isDuplicate = true;
            duplicateReason =
              matchExisting.formula_no === formula_no
                ? `Duplicate formula_no #${formula_no} in "${targetCh.title}"`
                : `Formula LaTeX already exists in "${targetCh.title}"`;
          }
        }
      }
    }

    const isValid = !error;
    if (isValid) {
      validCount += 1;
      if (isDuplicate) duplicateCount += 1;
    } else {
      invalidCount += 1;
    }

    rows.push({
      rowNumber,
      category: options.lockedCategoryName,
      chapter_no,
      chapter,
      subtopics,
      formula_no,
      title,
      formula_latex,
      note,
      isValid,
      isDuplicate,
      error,
      duplicateReason,
    });
  }

  return { rows, validCount, invalidCount, duplicateCount };
}

export async function runChunkedFormulaImport(params: {
  categoryId: string;
  defaultChapterId?: string;
  duplicateStrategy: 'skip' | 'update';
  sourceType: 'csv' | 'gsheet' | 'paste';
  fileName?: string;
  rawCsvText?: string;
  rows: ParsedFormulaImportRow[];
  startChunkIndex?: number;
  initialProgress?: Partial<FormulaChunkImportProgress>;
  onProgress?: (progress: FormulaChunkImportProgress) => void;
}): Promise<FormulaChunkImportProgress> {
  const CHUNK_SIZE = 100;
  const totalRows = params.rows.length;
  const totalChunks = Math.max(1, Math.ceil(totalRows / CHUNK_SIZE));
  const startChunk = Math.max(0, Number(params.startChunkIndex || 0));
  const importBatchId = `fimp_${Date.now()}`;

  let importedCount = Number(params.initialProgress?.importedCount || 0);
  let updatedCount = Number(params.initialProgress?.updatedCount || 0);
  let skippedCount = Number(params.initialProgress?.skippedCount || 0);
  let failedCount = Number(params.initialProgress?.failedCount || 0);
  const errors: FormulaImportRowError[] = [...(params.initialProgress?.errors || [])];

  for (let chunkIdx = startChunk; chunkIdx < totalChunks; chunkIdx++) {
    const offset = chunkIdx * CHUNK_SIZE;
    const slice = params.rows.slice(offset, offset + CHUNK_SIZE);
    const isLastChunk = chunkIdx === totalChunks - 1;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/formulas/import-chunk', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category_id: params.categoryId,
          default_chapter_id: params.defaultChapterId || '',
          duplicate_strategy: params.duplicateStrategy,
          source_type: params.sourceType,
          file_name: params.fileName || '',
          raw_csv_text: chunkIdx === 0 ? params.rawCsvText : undefined,
          chunk_offset: offset,
          is_final_chunk: isLastChunk,
          import_batch_id: importBatchId,
          rows: slice,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const progress: FormulaChunkImportProgress = {
          importedCount,
          updatedCount,
          skippedCount,
          failedCount,
          processedRows: offset,
          totalRows,
          currentChunkIndex: chunkIdx,
          totalChunks,
          errors,
          failedChunkIndex: chunkIdx,
          failedChunkMessage: data.error || `Chunk ${chunkIdx + 1} failed (${res.status})`,
        };
        params.onProgress?.(progress);
        return progress;
      }

      importedCount += Number(data.importedCount || 0);
      updatedCount += Number(data.updatedCount || 0);
      skippedCount += Number(data.skippedCount || 0);
      const chunkErrors: FormulaImportRowError[] = Array.isArray(data.errors) ? data.errors : [];
      failedCount += chunkErrors.length;
      errors.push(...chunkErrors);

      const progress: FormulaChunkImportProgress = {
        importedCount,
        updatedCount,
        skippedCount,
        failedCount,
        processedRows: Math.min(totalRows, offset + slice.length),
        totalRows,
        currentChunkIndex: chunkIdx + 1,
        totalChunks,
        errors,
        failedChunkIndex: null,
        failedChunkMessage: null,
      };
      params.onProgress?.(progress);
    } catch (err: any) {
      const progress: FormulaChunkImportProgress = {
        importedCount,
        updatedCount,
        skippedCount,
        failedCount,
        processedRows: offset,
        totalRows,
        currentChunkIndex: chunkIdx,
        totalChunks,
        errors,
        failedChunkIndex: chunkIdx,
        failedChunkMessage: err?.message || `Network error on chunk ${chunkIdx + 1}`,
      };
      params.onProgress?.(progress);
      return progress;
    }
  }

  invalidateFormulaVaultCache();
  return {
    importedCount,
    updatedCount,
    skippedCount,
    failedCount,
    processedRows: totalRows,
    totalRows,
    currentChunkIndex: totalChunks,
    totalChunks,
    errors,
    failedChunkIndex: null,
    failedChunkMessage: null,
  };
}

export function downloadFormulaImportErrorsCsv(errors: FormulaImportRowError[]): void {
  const header = 'row_number,error_reason';
  const lines = errors.map(
    (e) => `${e.rowNumber},"${String(e.reason || '').replace(/"/g, '""')}"`
  );
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `formula_import_errors_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import katex from 'katex';
import {
  buildInitialFormulaVaultSeed,
  D1FormulaCategoryRow,
  D1FormulaChapterRow,
  D1FormulaRow,
  D1FormulaBookmarkRow,
  D1FormulaReportRow,
  D1FormulaImportLogRow,
} from '../constants/formulaVaultSeed';

export interface FormulaVaultStoreData {
  categories: D1FormulaCategoryRow[];
  chapters: D1FormulaChapterRow[];
  formulas: D1FormulaRow[];
  bookmarks: D1FormulaBookmarkRow[];
  formula_reports: D1FormulaReportRow[];
  import_logs: D1FormulaImportLogRow[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'd1_formula_vault.json');
const R2_DIR = path.resolve(DATA_DIR, 'r2-bucket');
const PDF_SIGNING_SECRET =
  process.env.FORMULA_PDF_SIGNING_SECRET || 'boardly-formula-vault-r2-signed-url-secret-2026';

let cachedFormulaStore: FormulaVaultStoreData | null = null;

// Rate limiting maps for guest reads and writes
const guestReadRateMap = new Map<string, { count: number; resetAt: number }>();
const writeRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now >= entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function slugifyText(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

export function validateServerLatex(latex: string): { valid: boolean; error: string } {
  const trimmed = String(latex || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Formula LaTeX is empty.' };
  }
  // Strip outer $...$ or $$...$$ if present
  const unwrapped = trimmed
    .replace(/^\$\$([\s\S]+)\$\$$/, '$1')
    .replace(/^\$([\s\S]+)\$$/, '$1')
    .trim();

  if (!unwrapped) {
    return { valid: false, error: 'Formula LaTeX contains only delimiters.' };
  }

  // Check balanced curly braces (ignoring escaped \{ and \})
  let depth = 0;
  for (let i = 0; i < unwrapped.length; i++) {
    const ch = unwrapped[i];
    const prev = i > 0 ? unwrapped[i - 1] : '';
    if (ch === '{' && prev !== '\\') depth++;
    else if (ch === '}' && prev !== '\\') depth--;
    if (depth < 0) {
      return { valid: false, error: 'Unmatched closing brace "}" in LaTeX.' };
    }
  }
  if (depth !== 0) {
    return { valid: false, error: `Unclosed curly brace "{" in LaTeX (depth ${depth}).` };
  }

  try {
    // Prepare mhchem-compatible Macros so \ce{...} validates cleanly on the server
    katex.renderToString(unwrapped, {
      displayMode: true,
      throwOnError: true,
      strict: false,
      trust: false,
      macros: {
        '\\ce': '\\text{#1}',
      },
    });
    return { valid: true, error: '' };
  } catch (err: any) {
    return {
      valid: false,
      error: String(err?.message || 'KaTeX parse error').slice(0, 180),
    };
  }
}

export function latexToPlainText(latex: string): string {
  return String(latex || '')
    .replace(/^\$\$|\$\$$/g, '')
    .replace(/^\$|\$$/g, '')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\ce\{([^}]*)\}/g, '$1')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)')
    .replace(/\\overline\{([^}]*)\}/g, 'bar($1)')
    .replace(/\\vec\{([^}]*)\}/g, '$1')
    .replace(/\\binom\{([^}]*)\}\{([^}]*)\}/g, 'C($1, $2)')
    .replace(/\\left|\\right|\\bigl|\\bigr/g, '')
    .replace(/\\times/g, ' * ')
    .replace(/\\cdot/g, ' * ')
    .replace(/\\div/g, ' / ')
    .replace(/\\pm/g, ' +/- ')
    .replace(/\\mp/g, ' -/+ ')
    .replace(/\\le/g, ' <= ')
    .replace(/\\ge/g, ' >= ')
    .replace(/\\neq/g, ' != ')
    .replace(/\\approx/g, ' ~= ')
    .replace(/\\iff/g, ' <=> ')
    .replace(/\\implies/g, ' => ')
    .replace(/\\infty/g, 'infinity')
    .replace(/\\Delta/g, 'Delta ')
    .replace(/\\theta/g, 'theta')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\gamma/g, 'gamma')
    .replace(/\\lambda/g, 'lambda')
    .replace(/\\mu/g, 'mu')
    .replace(/\\sigma/g, 'sigma')
    .replace(/\\omega/g, 'omega')
    .replace(/\\pi/g, 'pi')
    .replace(/\\rho/g, 'rho')
    .replace(/\\tau/g, 'tau')
    .replace(/\\phi/g, 'phi')
    .replace(/\\Phi/g, 'Phi')
    .replace(/\\varepsilon/g, 'epsilon')
    .replace(/\\quad|\\qquad|\\,|\\;/g, ' ')
    .replace(/\\!/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function loadFormulaVaultStore(): FormulaVaultStoreData {
  if (cachedFormulaStore) {
    return cachedFormulaStore;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<FormulaVaultStoreData>;
      if (
        Array.isArray(parsed.categories) &&
        parsed.categories.length > 0 &&
        Array.isArray(parsed.chapters) &&
        Array.isArray(parsed.formulas)
      ) {
        cachedFormulaStore = {
          categories: parsed.categories,
          chapters: parsed.chapters,
          formulas: parsed.formulas,
          bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
          formula_reports: Array.isArray(parsed.formula_reports) ? parsed.formula_reports : [],
          import_logs: Array.isArray(parsed.import_logs) ? parsed.import_logs : [],
        };
        recalculateFormulaVaultCounts(cachedFormulaStore);
        return cachedFormulaStore;
      }
    }
  } catch (err) {
    console.warn('[FormulaVault] Failed to read d1_formula_vault.json, seeding fresh:', err);
  }

  const seed = buildInitialFormulaVaultSeed();
  cachedFormulaStore = {
    categories: seed.categories,
    chapters: seed.chapters,
    formulas: seed.formulas,
    bookmarks: [],
    formula_reports: [],
    import_logs: [],
  };
  saveFormulaVaultStore(cachedFormulaStore);
  return cachedFormulaStore;
}

export function saveFormulaVaultStore(store: FormulaVaultStoreData): void {
  cachedFormulaStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[FormulaVault] Failed to write d1_formula_vault.json:', err);
  }
}

export function recalculateFormulaVaultCounts(store: FormulaVaultStoreData): void {
  const chapFormulaCounts = new Map<string, number>();
  for (const f of store.formulas) {
    if (f.status !== 'draft') {
      chapFormulaCounts.set(f.chapter_id, (chapFormulaCounts.get(f.chapter_id) || 0) + 1);
    }
  }
  for (const ch of store.chapters) {
    const liveCnt = chapFormulaCounts.get(ch.id) || 0;
    const totalCnt = store.formulas.filter((f) => f.chapter_id === ch.id).length;
    ch.formula_count = liveCnt > 0 ? liveCnt : totalCnt;
    ch.search_text = `${ch.chapter_no} ${ch.title} ${ch.subtopics}`.toLowerCase().trim();
  }

  for (const cat of store.categories) {
    const catChaps = store.chapters.filter((ch) => ch.category_id === cat.id);
    const catFormulas = store.formulas.filter((f) => f.category_id === cat.id);
    cat.chapter_count = catChaps.length;
    cat.formula_count = catFormulas.length;
    cat.search_text = `${cat.name} ${cat.slug} ${cat.description}`.toLowerCase().trim();
  }
}

function invalidateChapterPdfR2(store: FormulaVaultStoreData, chapterId: string): void {
  const ch = store.chapters.find((c) => c.id === chapterId);
  if (!ch) return;
  if (ch.pdf_r2_key) {
    try {
      const fullPath = path.resolve(R2_DIR, ch.pdf_r2_key);
      if (fullPath.startsWith(R2_DIR) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch {
      // ignore cleanup error
    }
  }
  ch.pdf_r2_key = '';
  ch.pdf_updated_at = '';
}

function toAsciiPdfSafe(input: string): string {
  return String(input || '')
    .replace(/[^\x20-\x7E]/g, (ch) => {
      const map: Record<string, string> = {
        '·': ' | ',
        '—': '-',
        '–': '-',
        '’': "'",
        '‘': "'",
        '“': '"',
        '”': '"',
        '±': '+/-',
        '×': 'x',
        '÷': '/',
        '≤': '<=',
        '≥': '>=',
        '≠': '!=',
        '≈': '~=',
        '∞': 'infinity',
        'Δ': 'Delta',
        'θ': 'theta',
        'π': 'pi',
        'α': 'alpha',
        'β': 'beta',
        'γ': 'gamma',
        'λ': 'lambda',
        'μ': 'mu',
        'σ': 'sigma',
        'ω': 'omega',
      };
      return map[ch] || ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapTextLines(text: string, maxCharsPerLine: number): string[] {
  const words = toAsciiPdfSafe(text).split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    if ((current + ' ' + w).length <= maxCharsPerLine) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generates a clean, multi-page Chapter Formula Sheet PDF with the Boardly logo watermark
 * and stores it in R2 (`data/r2-bucket/formulas/pdfs/...`), saving only the R2 key in D1.
 */
export async function generateAndStoreChapterPdf(
  store: FormulaVaultStoreData,
  chapter: D1FormulaChapterRow
): Promise<string> {
  if (chapter.pdf_r2_key) {
    const existingPath = path.resolve(R2_DIR, chapter.pdf_r2_key);
    if (existingPath.startsWith(R2_DIR) && fs.existsSync(existingPath)) {
      return chapter.pdf_r2_key;
    }
  }

  const category = store.categories.find((c) => c.id === chapter.category_id);
  const formulas = store.formulas
    .filter((f) => f.chapter_id === chapter.id && f.status === 'live')
    .sort(
      (a, b) =>
        Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
        Number(a.formula_no || 0) - Number(b.formula_no || 0)
    );

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const margin = 42;

  const drawWatermarkAndChrome = (page: any, pageNum: number) => {
    // Diagonal BOARDLY watermark in center
    page.drawText('BOARDLY', {
      x: 135,
      y: 320,
      size: 76,
      font: fontBold,
      color: rgb(0.93, 0.9, 0.91),
      rotate: degrees(34),
      opacity: 0.25,
    });
    page.drawText('FORMULA VAULT', {
      x: 175,
      y: 265,
      size: 32,
      font: fontBold,
      color: rgb(0.93, 0.9, 0.91),
      rotate: degrees(34),
      opacity: 0.25,
    });

    // Top Red Accent Bar
    page.drawRectangle({
      x: 0,
      y: pageHeight - 10,
      width: pageWidth,
      height: 10,
      color: rgb(0.843, 0.098, 0.129), // #D71921
    });

    // Top Brand Header
    page.drawText('BOARDLY  |  FORMULA VAULT', {
      x: margin,
      y: pageHeight - 32,
      size: 9.5,
      font: fontBold,
      color: rgb(0.843, 0.098, 0.129),
    });

    const catRight = toAsciiPdfSafe(
      `${category?.name || 'Formula Sheet'}  |  Chapter ${chapter.chapter_no}`
    );
    page.drawText(catRight, {
      x: pageWidth - margin - Math.min(240, catRight.length * 5.2),
      y: pageHeight - 32,
      size: 9,
      font: fontRegular,
      color: rgb(0.42, 0.44, 0.48),
    });

    // Footer
    page.drawLine({
      start: { x: margin, y: 36 },
      end: { x: pageWidth - margin, y: 36 },
      thickness: 0.6,
      color: rgb(0.86, 0.87, 0.89),
    });
    page.drawText('Boardly Formula Vault - Original Reference Sheet (boardly.cfd)', {
      x: margin,
      y: 22,
      size: 8,
      font: fontRegular,
      color: rgb(0.45, 0.47, 0.51),
    });
    page.drawText(`Page ${pageNum}`, {
      x: pageWidth - margin - 40,
      y: 22,
      size: 8,
      font: fontBold,
      color: rgb(0.35, 0.37, 0.4),
    });
  };

  let pageNum = 1;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermarkAndChrome(page, pageNum);

  let cursorY = pageHeight - 62;

  // Chapter Banner Box on Page 1
  page.drawRectangle({
    x: margin,
    y: cursorY - 56,
    width: pageWidth - margin * 2,
    height: 62,
    color: rgb(0.98, 0.97, 0.98),
    borderColor: rgb(0.843, 0.098, 0.129),
    borderWidth: 1,
  });

  page.drawText(
    toAsciiPdfSafe(`Chapter ${String(chapter.chapter_no).padStart(2, '0')}: ${chapter.title}`),
    {
      x: margin + 14,
      y: cursorY - 18,
      size: 16,
      font: fontBold,
      color: rgb(0.08, 0.09, 0.12),
    }
  );

  const subtopicsLine = toAsciiPdfSafe(chapter.subtopics || category?.description || '').slice(
    0,
    92
  );
  if (subtopicsLine) {
    page.drawText(subtopicsLine, {
      x: margin + 14,
      y: cursorY - 35,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.35, 0.38, 0.42),
    });
  }

  page.drawText(`${formulas.length} Numbered Formulas`, {
    x: margin + 14,
    y: cursorY - 49,
    size: 8.5,
    font: fontBold,
    color: rgb(0.843, 0.098, 0.129),
  });

  cursorY -= 76;

  for (const f of formulas) {
    const plainExpr = toAsciiPdfSafe(f.plain_text || latexToPlainText(f.formula_latex));
    const latexRaw = toAsciiPdfSafe(f.formula_latex);
    const noteLines = wrapTextLines(f.note || '', 84);
    const exprLines = wrapTextLines(plainExpr || latexRaw, 68);
    const boxHeight = Math.max(
      54,
      26 + exprLines.length * 13 + (noteLines.length > 0 ? noteLines.length * 11 + 6 : 0)
    );

    if (cursorY - boxHeight < 52) {
      pageNum += 1;
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      drawWatermarkAndChrome(page, pageNum);
      cursorY = pageHeight - 54;
    }

    // Formula card border
    page.drawRectangle({
      x: margin,
      y: cursorY - boxHeight,
      width: pageWidth - margin * 2,
      height: boxHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.88, 0.89, 0.91),
      borderWidth: 0.75,
    });

    // Number badge
    page.drawRectangle({
      x: margin + 10,
      y: cursorY - 24,
      width: 28,
      height: 16,
      color: rgb(0.843, 0.098, 0.129),
    });
    page.drawText(`#${f.formula_no}`, {
      x: margin + 14,
      y: cursorY - 19,
      size: 8.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Formula title
    const titleStr = toAsciiPdfSafe(f.title || `Formula ${f.formula_no}`);
    page.drawText(titleStr, {
      x: margin + 45,
      y: cursorY - 19,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.11, 0.14),
    });

    let innerY = cursorY - 34;
    for (const line of exprLines) {
      page.drawText(line, {
        x: margin + 14,
        y: innerY,
        size: 10,
        font: fontMono,
        color: rgb(0.08, 0.08, 0.1),
      });
      innerY -= 13;
    }

    if (noteLines.length > 0) {
      innerY -= 2;
      for (const nLine of noteLines) {
        page.drawText(nLine, {
          x: margin + 14,
          y: innerY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.38, 0.4, 0.45),
        });
        innerY -= 11;
      }
    }

    cursorY -= boxHeight + 8;
  }

  const pdfBytes = await pdfDoc.save();
  const r2Key = `formulas/pdfs/chapter_${chapter.id}_${Date.now()}.pdf`;
  const fullDestPath = path.resolve(R2_DIR, r2Key);
  fs.mkdirSync(path.dirname(fullDestPath), { recursive: true });
  fs.writeFileSync(fullDestPath, Buffer.from(pdfBytes));

  chapter.pdf_r2_key = r2Key;
  chapter.pdf_updated_at = new Date().toISOString();
  saveFormulaVaultStore(store);

  return r2Key;
}

export function createSignedPdfDownloadToken(
  chapterId: string,
  uid: string,
  expiresAtMs: number
): string {
  const payload = `${chapterId}:${uid}:${expiresAtMs}`;
  return crypto.createHmac('sha256', PDF_SIGNING_SECRET).update(payload).digest('hex');
}

export function verifySignedPdfDownloadToken(
  chapterId: string,
  uid: string,
  expiresAtMs: number,
  signature: string
): boolean {
  if (!chapterId || !uid || !signature || !Number.isFinite(expiresAtMs)) return false;
  if (Date.now() > expiresAtMs) return false;
  const expected = createSignedPdfDownloadToken(chapterId, uid, expiresAtMs);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function registerFormulaVaultRoutes(
  app: Express,
  deps: {
    verifyUser: (req: Request) => Promise<{
      uid: string;
      email?: string;
      name?: string;
      role?: string;
      isSuperAdmin?: boolean;
      isGuest?: boolean;
    } | null>;
    isAdminOrSuperadmin: (user: any) => boolean;
    isProOrAdminUser: (user: any, req: Request) => boolean;
  }
): void {
  const { verifyUser, isAdminOrSuperadmin, isProOrAdminUser } = deps;

  // ---------------------------------------------------------------------------
  // 1. GET /api/formulas/overview — Fast single-request overview for Formula Vault
  //    Returns categories + chapters (without formulas of closed chapters) +
  //    Formula of the Day + signed-in user's bookmarked formula IDs.
  // ---------------------------------------------------------------------------
  app.get('/api/formulas/overview', async (req: Request, res: Response) => {
    const clientIp =
      String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || 'anon')
        .split(',')[0]
        .trim();

    if (!checkRateLimit(guestReadRateMap, `fv_overview:${clientIp}`, 180, 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
      });
    }

    const store = loadFormulaVaultStore();
    recalculateFormulaVaultCounts(store);

    const includeDrafts = req.query.include_drafts === '1';
    const user = await verifyUser(req);
    const isAdmin = includeDrafts && user && isAdminOrSuperadmin(user);

    const categories = store.categories
      .filter((c) => isAdmin || c.status === 'live')
      .sort(
        (a, b) =>
          Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name)
      );

    const chapters = store.chapters
      .filter((ch) => isAdmin || ch.status === 'live')
      .sort(
        (a, b) =>
          Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
          Number(a.chapter_no || 0) - Number(b.chapter_no || 0)
      );

    // Deterministic Formula of the Day based on UTC date
    const liveFormulas = store.formulas.filter((f) => f.status === 'live' && f.is_render_valid !== 0);
    let formulaOfTheDay: (D1FormulaRow & {
      chapter_title?: string;
      chapter_no?: number;
      category_name?: string;
      category_slug?: string;
    }) | null = null;

    if (liveFormulas.length > 0) {
      const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
      const picked = liveFormulas[daySeed % liveFormulas.length];
      const ch = store.chapters.find((c) => c.id === picked.chapter_id);
      const cat = store.categories.find((c) => c.id === picked.category_id);
      formulaOfTheDay = {
        ...picked,
        chapter_title: ch?.title || 'Formula Sheet',
        chapter_no: ch?.chapter_no || 1,
        category_name: cat?.name || 'Mathematics',
        category_slug: cat?.slug || 'basic-maths',
      };
    }

    let bookmarkedIds: string[] = [];
    if (user && !user.isGuest) {
      bookmarkedIds = store.bookmarks
        .filter((b) => b.user_id === user.uid)
        .map((b) => b.formula_id);
    }

    if (!user) {
      res.setHeader(
        'Cache-Control',
        'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
      );
    } else {
      res.setHeader('Cache-Control', 'private, max-age=15');
    }

    return res.status(200).json({
      success: true,
      categories,
      chapters,
      formulaOfTheDay,
      bookmarkedIds,
      totalFormulas: liveFormulas.length,
    });
  });

  // ---------------------------------------------------------------------------
  // 2. GET /api/formulas/chapters/:chapterId — Load formulas ONLY for opened chapter
  // ---------------------------------------------------------------------------
  app.get('/api/formulas/chapters/:chapterId', async (req: Request, res: Response) => {
    const clientIp =
      String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || 'anon')
        .split(',')[0]
        .trim();

    if (!checkRateLimit(guestReadRateMap, `fv_chap:${clientIp}`, 240, 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait a moment.',
      });
    }

    const chapterId = String(req.params.chapterId || '').trim();
    const store = loadFormulaVaultStore();
    const chapter = store.chapters.find((c) => c.id === chapterId || c.slug === chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found.' });
    }

    const includeDrafts = req.query.include_drafts === '1';
    const user = includeDrafts ? await verifyUser(req) : null;
    const isAdmin = Boolean(includeDrafts && user && isAdminOrSuperadmin(user));

    const allChapterFormulas = store.formulas
      .filter((f) => f.chapter_id === chapter.id && (isAdmin || f.status === 'live'))
      .sort(
        (a, b) =>
          Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
          Number(a.formula_no || 0) - Number(b.formula_no || 0)
      );

    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));
    const offset = Math.max(0, Number(req.query.offset || 0));
    const formulas = allChapterFormulas.slice(offset, offset + limit);

    if (!includeDrafts) {
      res.setHeader(
        'Cache-Control',
        'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
      );
    }

    return res.status(200).json({
      success: true,
      chapter,
      formulas,
      total: allChapterFormulas.length,
    });
  });

  // ---------------------------------------------------------------------------
  // 3. GET /api/formulas/search — Search across formulas, chapters, and subtopics
  // ---------------------------------------------------------------------------
  app.get('/api/formulas/search', (req: Request, res: Response) => {
    const clientIp =
      String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || 'anon')
        .split(',')[0]
        .trim();

    if (!checkRateLimit(guestReadRateMap, `fv_search:${clientIp}`, 120, 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Search rate limit reached. Please slow down.',
      });
    }

    const normalizeSearchStr = (val: string): string =>
      String(val || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    const q = normalizeSearchStr(String(req.query.q || ''));
    const categoryId = String(req.query.category_id || '').trim();

    if (!q) {
      return res.status(200).json({ success: true, chapters: [], formulas: [] });
    }

    const store = loadFormulaVaultStore();
    const catMap = new Map(store.categories.map((c) => [c.id, c]));
    const chapMap = new Map(store.chapters.map((c) => [c.id, c]));
    const tokens = q.split(' ').filter(Boolean);

    const matchedChapters = store.chapters
      .filter((ch) => {
        if (ch.status !== 'live') return false;
        if (categoryId && categoryId !== 'all' && ch.category_id !== categoryId) return false;
        const cat = catMap.get(ch.category_id);
        const hay = normalizeSearchStr(
          `${ch.chapter_no} ${ch.title} ${cat?.name || ''} ${ch.search_text || ''}`
        );
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 40)
      .map((ch) => ({
        ...ch,
        category_name: catMap.get(ch.category_id)?.name || '',
      }));

    const matchedFormulas = store.formulas
      .filter((f) => {
        if (f.status !== 'live') return false;
        if (categoryId && categoryId !== 'all' && f.category_id !== categoryId) return false;
        const ch = chapMap.get(f.chapter_id);
        const cat = catMap.get(f.category_id);
        const hay = normalizeSearchStr(
          `${f.formula_no} ${f.title || ''} ${f.note || ''} ${f.plain_text || ''} ${f.formula_latex || ''} ${ch?.chapter_no || ''} ${ch?.title || ''} ${cat?.name || ''}`
        );
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 150)
      .map((f) => {
        const ch = chapMap.get(f.chapter_id);
        const cat = catMap.get(f.category_id);
        return {
          ...f,
          chapter_title: ch?.title || '',
          chapter_no: ch?.chapter_no || 1,
          category_name: cat?.name || '',
        };
      });

    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=120');
    return res.status(200).json({
      success: true,
      chapters: matchedChapters,
      formulas: matchedFormulas,
    });
  });

  // ---------------------------------------------------------------------------
  // 4. GET /api/formulas/bookmarks & POST /api/formulas/bookmarks/toggle
  // ---------------------------------------------------------------------------
  app.get('/api/formulas/bookmarks', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!user || user.isGuest) {
      return res.status(401).json({
        success: false,
        error: 'Sign in with a full account to view saved formula bookmarks.',
      });
    }

    const store = loadFormulaVaultStore();
    const userBookmarks = store.bookmarks.filter((b) => b.user_id === user.uid);
    const chapMap = new Map(store.chapters.map((c) => [c.id, c]));
    const catMap = new Map(store.categories.map((c) => [c.id, c]));

    const formulas = userBookmarks
      .map((b) => {
        const f = store.formulas.find((item) => item.id === b.formula_id);
        if (!f) return null;
        const ch = chapMap.get(f.chapter_id);
        const cat = catMap.get(f.category_id);
        return {
          ...f,
          chapter_title: ch?.title || '',
          chapter_no: ch?.chapter_no || 1,
          category_name: cat?.name || '',
          bookmarked_at: b.created_at,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      bookmarks: formulas,
      bookmarkedIds: userBookmarks.map((b) => b.formula_id),
    });
  });

  app.post('/api/formulas/bookmarks/toggle', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!user || user.isGuest) {
      return res.status(401).json({
        success: false,
        error: 'Guest mode: sign in to save favourites.',
        code: 'AUTH_REQUIRED',
      });
    }

    const formulaId = String(req.body?.formula_id || '').trim();
    if (!formulaId) {
      return res.status(400).json({ success: false, error: 'formula_id is required.' });
    }

    const store = loadFormulaVaultStore();
    const formula = store.formulas.find((f) => f.id === formulaId);
    if (!formula) {
      return res.status(404).json({ success: false, error: 'Formula not found.' });
    }

    const existingIdx = store.bookmarks.findIndex(
      (b) => b.user_id === user.uid && b.formula_id === formulaId
    );

    let bookmarked = false;
    if (existingIdx >= 0) {
      store.bookmarks.splice(existingIdx, 1);
      bookmarked = false;
    } else {
      const nextId =
        store.bookmarks.reduce((max, b) => Math.max(max, Number(b.id || 0)), 0) + 1;
      store.bookmarks.push({
        id: nextId,
        user_id: user.uid,
        formula_id: formula.id,
        category_id: formula.category_id,
        chapter_id: formula.chapter_id,
        created_at: new Date().toISOString(),
      });
      bookmarked = true;
    }

    saveFormulaVaultStore(store);
    const bookmarkedIds = store.bookmarks
      .filter((b) => b.user_id === user.uid)
      .map((b) => b.formula_id);

    return res.status(200).json({
      success: true,
      bookmarked,
      bookmarkedIds,
    });
  });

  // ---------------------------------------------------------------------------
  // 5. POST /api/formulas/chapters/:chapterId/pdf-url & GET /api/formulas/pdf-download
  //    Pro-only PDF per chapter with Boardly watermark, stored in R2, signed URL
  // ---------------------------------------------------------------------------
  app.post('/api/formulas/chapters/:chapterId/pdf-url', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!user || user.isGuest) {
      return res.status(401).json({
        success: false,
        error: 'Please sign in and upgrade to Boardly Pro to download chapter PDFs.',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!isProOrAdminUser(user, req)) {
      return res.status(403).json({
        success: false,
        error: 'Chapter PDF downloads are a Boardly Pro feature.',
        code: 'PRO_REQUIRED',
      });
    }

    const chapterId = String(req.params.chapterId || '').trim();
    const store = loadFormulaVaultStore();
    const chapter = store.chapters.find((c) => c.id === chapterId || c.slug === chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found.' });
    }

    try {
      const r2Key = await generateAndStoreChapterPdf(store, chapter);
      const expiresAtMs = Date.now() + 15 * 60 * 1000; // 15-minute signed URL
      const sig = createSignedPdfDownloadToken(chapter.id, user.uid, expiresAtMs);
      const signedUrl = `/api/formulas/pdf-download?chapterId=${encodeURIComponent(
        chapter.id
      )}&uid=${encodeURIComponent(user.uid)}&exp=${expiresAtMs}&sig=${sig}`;

      return res.status(200).json({
        success: true,
        signedUrl,
        downloadUrl: signedUrl,
        r2Key,
        expiresAt: expiresAtMs,
        fileName: `Boardly_Ch${String(chapter.chapter_no).padStart(2, '0')}_${chapter.slug}_Formulas.pdf`,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to generate chapter PDF.',
      });
    }
  });

  app.get('/api/formulas/pdf-download', async (req: Request, res: Response) => {
    const chapterId = String(req.query.chapterId || '').trim();
    const uid = String(req.query.uid || '').trim();
    const exp = Number(req.query.exp || 0);
    const sig = String(req.query.sig || '').trim();

    if (!verifySignedPdfDownloadToken(chapterId, uid, exp, sig)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired signed PDF download link.',
      });
    }

    const store = loadFormulaVaultStore();
    const chapter = store.chapters.find((c) => c.id === chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found.' });
    }

    const r2Key = await generateAndStoreChapterPdf(store, chapter);
    const fullPath = path.resolve(R2_DIR, r2Key);
    if (!fullPath.startsWith(R2_DIR) || !fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'PDF object not found in R2.' });
    }

    const fileName = `Boardly_Ch${String(chapter.chapter_no).padStart(2, '0')}_${chapter.slug}_Formulas.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(fs.readFileSync(fullPath));
  });

  // ---------------------------------------------------------------------------
  // 6. ADMIN: Categories CRUD & Reorder
  // ---------------------------------------------------------------------------
  app.post('/api/formulas/categories', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admins can create formula categories.',
      });
    }

    const name = String(req.body?.name || '').trim().slice(0, 100);
    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }
    const slug = slugifyText(String(req.body?.slug || name));
    const store = loadFormulaVaultStore();
    if (store.categories.some((c) => c.slug.toLowerCase() === slug.toLowerCase())) {
      return res.status(409).json({
        success: false,
        error: `A category with slug "${slug}" already exists.`,
      });
    }

    const maxSort = store.categories.reduce((m, c) => Math.max(m, Number(c.sort_order || 0)), 0);
    const nowIso = new Date().toISOString();
    const newCat: D1FormulaCategoryRow = {
      id: `cat_${slug}_${crypto.randomUUID().slice(0, 6)}`,
      name,
      slug,
      description: String(req.body?.description || '').trim().slice(0, 240),
      sort_order: maxSort + 1,
      chapter_count: 0,
      formula_count: 0,
      status: req.body?.status === 'draft' ? 'draft' : 'live',
      guest_access: req.body?.guest_access === 0 ? 0 : 1,
      search_text: `${name} ${slug}`.toLowerCase(),
      created_at: nowIso,
      updated_at: nowIso,
    };

    store.categories.push(newCat);
    saveFormulaVaultStore(store);
    return res.status(201).json({ success: true, category: newCat });
  });

  const handleUpdateCategory = async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admins can update formula categories.',
      });
    }
    const id = String(req.params.id || '').trim();
    const store = loadFormulaVaultStore();
    const cat = store.categories.find((c) => c.id === id);
    if (!cat) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      cat.name = req.body.name.trim().slice(0, 100);
    }
    if (typeof req.body?.slug === 'string' && req.body.slug.trim()) {
      const nextSlug = slugifyText(req.body.slug);
      if (
        store.categories.some(
          (other) => other.id !== cat.id && other.slug.toLowerCase() === nextSlug.toLowerCase()
        )
      ) {
        return res.status(409).json({
          success: false,
          error: `Slug "${nextSlug}" is already used by another category.`,
        });
      }
      cat.slug = nextSlug;
    }
    if (typeof req.body?.description === 'string') {
      cat.description = req.body.description.trim().slice(0, 240);
    }
    if (req.body?.status === 'live' || req.body?.status === 'draft') {
      cat.status = req.body.status;
    }
    if (req.body?.guest_access !== undefined) {
      cat.guest_access = Number(req.body.guest_access) ? 1 : 0;
    }
    cat.updated_at = new Date().toISOString();
    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);
    return res.status(200).json({ success: true, category: cat });
  };

  app.put('/api/formulas/categories/:id', handleUpdateCategory);
  app.patch('/api/formulas/categories/:id', handleUpdateCategory);

  app.post('/api/formulas/categories/reorder', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }
    const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds.map(String) : [];
    const store = loadFormulaVaultStore();
    orderedIds.forEach((id: string, idx: number) => {
      const c = store.categories.find((item) => item.id === id);
      if (c) c.sort_order = idx + 1;
    });
    saveFormulaVaultStore(store);
    return res.status(200).json({ success: true, categories: store.categories });
  });

  app.delete('/api/formulas/categories/:id', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }
    const id = String(req.params.id || '').trim();
    const store = loadFormulaVaultStore();
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx < 0) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }
    const chaps = store.chapters.filter((ch) => ch.category_id === id);
    for (const ch of chaps) {
      invalidateChapterPdfR2(store, ch.id);
    }
    store.categories.splice(idx, 1);
    store.chapters = store.chapters.filter((ch) => ch.category_id !== id);
    store.formulas = store.formulas.filter((f) => f.category_id !== id);
    store.bookmarks = store.bookmarks.filter((b) => b.category_id !== id);
    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);
    return res.status(200).json({ success: true });
  });

  // ---------------------------------------------------------------------------
  // 7. ADMIN: Chapters CRUD, Reorder & CSV Export
  // ---------------------------------------------------------------------------
  app.post('/api/formulas/chapters', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admins can create chapters.',
      });
    }

    const categoryId = String(req.body?.category_id || '').trim();
    const title = String(req.body?.title || '').trim().slice(0, 140);
    if (!categoryId || !title) {
      return res
        .status(400)
        .json({ success: false, error: 'category_id and chapter title are required.' });
    }

    const store = loadFormulaVaultStore();
    const cat = store.categories.find((c) => c.id === categoryId);
    if (!cat) {
      return res.status(404).json({ success: false, error: 'Target category not found.' });
    }

    const catChapters = store.chapters.filter((ch) => ch.category_id === categoryId);
    const maxSort = catChapters.reduce((m, ch) => Math.max(m, Number(ch.sort_order || 0)), 0);
    const maxChapNo = catChapters.reduce((m, ch) => Math.max(m, Number(ch.chapter_no || 0)), 0);
    const chapterNo = Number.isFinite(Number(req.body?.chapter_no))
      ? Math.max(1, Number(req.body.chapter_no))
      : maxChapNo + 1;
    const slug = slugifyText(String(req.body?.slug || title));
    const subtopics = String(req.body?.subtopics || '').trim().slice(0, 260);
    const nowIso = new Date().toISOString();

    const newChap: D1FormulaChapterRow = {
      id: `chap_${cat.slug}_${slug}_${crypto.randomUUID().slice(0, 5)}`,
      category_id: categoryId,
      chapter_no: chapterNo,
      title,
      slug,
      subtopics,
      sort_order: maxSort + 1,
      formula_count: 0,
      status: req.body?.status === 'draft' ? 'draft' : 'live',
      pdf_r2_key: '',
      pdf_updated_at: '',
      search_text: `${chapterNo} ${title} ${subtopics}`.toLowerCase(),
      created_at: nowIso,
      updated_at: nowIso,
    };

    store.chapters.push(newChap);
    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);
    return res.status(201).json({ success: true, chapter: newChap });
  });

  const handleUpdateChapter = async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }
    const id = String(req.params.id || '').trim();
    const store = loadFormulaVaultStore();
    const ch = store.chapters.find((c) => c.id === id);
    if (!ch) {
      return res.status(404).json({ success: false, error: 'Chapter not found.' });
    }

    if (typeof req.body?.title === 'string' && req.body.title.trim()) {
      ch.title = req.body.title.trim().slice(0, 140);
      ch.slug = slugifyText(req.body?.slug || ch.title);
    }
    if (req.body?.chapter_no !== undefined && Number.isFinite(Number(req.body.chapter_no))) {
      ch.chapter_no = Math.max(1, Number(req.body.chapter_no));
    }
    if (typeof req.body?.subtopics === 'string') {
      ch.subtopics = req.body.subtopics.trim().slice(0, 260);
    }
    if (req.body?.status === 'live' || req.body?.status === 'draft') {
      ch.status = req.body.status;
    }
    ch.updated_at = new Date().toISOString();
    invalidateChapterPdfR2(store, ch.id);
    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);
    return res.status(200).json({ success: true, chapter: ch });
  };

  app.put('/api/formulas/chapters/:id', handleUpdateChapter);
  app.patch('/api/formulas/chapters/:id', handleUpdateChapter);

  app.post('/api/formulas/chapters/reorder', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }
    const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds.map(String) : [];
    const store = loadFormulaVaultStore();
    orderedIds.forEach((id: string, idx: number) => {
      const ch = store.chapters.find((item) => item.id === id);
      if (ch) ch.sort_order = idx + 1;
    });
    saveFormulaVaultStore(store);
    return res.status(200).json({ success: true });
  });

  app.delete('/api/formulas/chapters/:id', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }
    const id = String(req.params.id || '').trim();
    const store = loadFormulaVaultStore();
    const idx = store.chapters.findIndex((c) => c.id === id);
    if (idx < 0) {
      return res.status(404).json({ success: false, error: 'Chapter not found.' });
    }
    invalidateChapterPdfR2(store, id);
    store.chapters.splice(idx, 1);
    store.formulas = store.formulas.filter((f) => f.chapter_id !== id);
    store.bookmarks = store.bookmarks.filter((b) => b.chapter_id !== id);
    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);
    return res.status(200).json({ success: true });
  });

  // Export Chapter (or Category) as CSV
  app.get('/api/formulas/export-csv', (req: Request, res: Response) => {
    const chapterId = String(req.query.chapter_id || '').trim();
    const categoryId = String(req.query.category_id || '').trim();
    const store = loadFormulaVaultStore();
    const catMap = new Map(store.categories.map((c) => [c.id, c]));
    const chapMap = new Map(store.chapters.map((c) => [c.id, c]));

    const filtered = store.formulas
      .filter((f) => {
        if (chapterId && f.chapter_id !== chapterId) return false;
        if (categoryId && f.category_id !== categoryId) return false;
        return true;
      })
      .sort(
        (a, b) =>
          a.category_id.localeCompare(b.category_id) ||
          Number(chapMap.get(a.chapter_id)?.chapter_no || 0) -
            Number(chapMap.get(b.chapter_id)?.chapter_no || 0) ||
          Number(a.formula_no || 0) - Number(b.formula_no || 0)
      );

    const csvEsc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = ['category,chapter_no,chapter,subtopics,formula_no,formula_latex,note'];
    for (const f of filtered) {
      const cat = catMap.get(f.category_id);
      const ch = chapMap.get(f.chapter_id);
      rows.push(
        [
          csvEsc(cat?.name || ''),
          ch?.chapter_no ?? 1,
          csvEsc(ch?.title || ''),
          csvEsc(ch?.subtopics || ''),
          f.formula_no,
          csvEsc(f.formula_latex),
          csvEsc(f.note || f.title || ''),
        ].join(',')
      );
    }

    const fileSlug = chapterId
      ? chapMap.get(chapterId)?.slug || 'chapter'
      : categoryId
      ? catMap.get(categoryId)?.slug || 'category'
      : 'all_formulas';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="boardly_${fileSlug}_formulas.csv"`);
    return res.status(200).send(rows.join('\n') + '\n');
  });

  // ---------------------------------------------------------------------------
  // 8. ADMIN: Formulas CRUD & Reorder
  // ---------------------------------------------------------------------------
  app.post('/api/formulas/items', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admins can add formulas.',
      });
    }

    const chapterId = String(req.body?.chapter_id || '').trim();
    const formulaLatex = String(req.body?.formula_latex || '').trim();
    if (!chapterId || !formulaLatex) {
      return res
        .status(400)
        .json({ success: false, error: 'chapter_id and formula_latex are required.' });
    }

    const store = loadFormulaVaultStore();
    const ch = store.chapters.find((c) => c.id === chapterId);
    if (!ch) {
      return res.status(404).json({ success: false, error: 'Target chapter not found.' });
    }

    const validation = validateServerLatex(formulaLatex);
    const chapFormulas = store.formulas.filter((f) => f.chapter_id === ch.id);
    const maxNo = chapFormulas.reduce((m, f) => Math.max(m, Number(f.formula_no || 0)), 0);
    const maxSort = chapFormulas.reduce((m, f) => Math.max(m, Number(f.sort_order || 0)), 0);

    const formulaNo = Number.isFinite(Number(req.body?.formula_no))
      ? Math.max(1, Number(req.body.formula_no))
      : maxNo + 1;
    const title = String(req.body?.title || '').trim().slice(0, 160);
    const note = String(req.body?.note || '').trim().slice(0, 600);
    const plainText =
      String(req.body?.plain_text || req.body?.formula_plain || '').trim() ||
      latexToPlainText(formulaLatex);
    const isFeatured =
      req.body?.is_featured === true || Number(req.body?.is_featured) === 1 ? 1 : 0;
    const nowIso = new Date().toISOString();

    const newFormula: D1FormulaRow = {
      id: `form_${ch.id}_${formulaNo}_${crypto.randomUUID().slice(0, 5)}`,
      category_id: ch.category_id,
      chapter_id: ch.id,
      formula_no: formulaNo,
      title,
      formula_latex: formulaLatex,
      plain_text: plainText,
      formula_plain: plainText,
      note,
      status: req.body?.status === 'draft' ? 'draft' : 'live',
      sort_order: maxSort + 1,
      is_featured: isFeatured,
      is_render_valid: validation.valid ? 1 : 0,
      render_error: validation.error,
      search_text: `${ch.title} ${ch.subtopics} ${title} ${plainText} ${note} ${formulaLatex}`
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim(),
      created_at: nowIso,
      updated_at: nowIso,
    };

    store.formulas.push(newFormula);
    invalidateChapterPdfR2(store, ch.id);
    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);

    return res.status(201).json({ success: true, formula: newFormula });
  });

  const handleUpdateFormula = async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }
    const id = String(req.params.id || '').trim();
    const store = loadFormulaVaultStore();
    const formula = store.formulas.find((f) => f.id === id);
    if (!formula) {
      return res.status(404).json({ success: false, error: 'Formula not found.' });
    }

    if (typeof req.body?.formula_latex === 'string' && req.body.formula_latex.trim()) {
      formula.formula_latex = req.body.formula_latex.trim();
      const validation = validateServerLatex(formula.formula_latex);
      formula.is_render_valid = validation.valid ? 1 : 0;
      formula.render_error = validation.error;
      if (!req.body?.plain_text && !req.body?.formula_plain) {
        formula.plain_text = latexToPlainText(formula.formula_latex);
        formula.formula_plain = formula.plain_text;
      }
    }
    const nextPlain =
      typeof req.body?.plain_text === 'string'
        ? req.body.plain_text.trim()
        : typeof req.body?.formula_plain === 'string'
        ? req.body.formula_plain.trim()
        : '';
    if (nextPlain) {
      formula.plain_text = nextPlain;
      formula.formula_plain = nextPlain;
    }
    if (typeof req.body?.title === 'string') {
      formula.title = req.body.title.trim().slice(0, 160);
    }
    if (typeof req.body?.note === 'string') {
      formula.note = req.body.note.trim().slice(0, 600);
    }
    if (req.body?.formula_no !== undefined && Number.isFinite(Number(req.body.formula_no))) {
      formula.formula_no = Math.max(1, Number(req.body.formula_no));
    }
    if (req.body?.status === 'live' || req.body?.status === 'draft') {
      formula.status = req.body.status;
    }
    if (req.body?.is_featured !== undefined) {
      formula.is_featured =
        req.body.is_featured === true || Number(req.body.is_featured) === 1 ? 1 : 0;
    }
    if (typeof req.body?.chapter_id === 'string' && req.body.chapter_id.trim()) {
      const targetCh = store.chapters.find((c) => c.id === req.body.chapter_id.trim());
      if (targetCh) {
        invalidateChapterPdfR2(store, formula.chapter_id);
        formula.chapter_id = targetCh.id;
        formula.category_id = targetCh.category_id;
      }
    }

    const ch = store.chapters.find((c) => c.id === formula.chapter_id);
    formula.search_text = `${ch?.title || ''} ${ch?.subtopics || ''} ${formula.title} ${formula.plain_text} ${formula.note} ${formula.formula_latex}`
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    formula.updated_at = new Date().toISOString();

    invalidateChapterPdfR2(store, formula.chapter_id);
    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);

    return res.status(200).json({ success: true, formula });
  };

  app.put('/api/formulas/items/:id', handleUpdateFormula);
  app.patch('/api/formulas/items/:id', handleUpdateFormula);

  app.post('/api/formulas/items/reorder', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }
    const chapterId = String(req.body?.chapter_id || '').trim();
    const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds.map(String) : [];
    const store = loadFormulaVaultStore();
    orderedIds.forEach((id: string, idx: number) => {
      const f = store.formulas.find((item) => item.id === id);
      if (f) {
        f.sort_order = idx + 1;
        f.formula_no = idx + 1;
      }
    });
    if (chapterId) {
      invalidateChapterPdfR2(store, chapterId);
    }
    saveFormulaVaultStore(store);
    return res.status(200).json({ success: true });
  });

  app.delete('/api/formulas/items/:id', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }
    const id = String(req.params.id || '').trim();
    const store = loadFormulaVaultStore();
    const idx = store.formulas.findIndex((f) => f.id === id);
    if (idx < 0) {
      return res.status(404).json({ success: false, error: 'Formula not found.' });
    }
    const removed = store.formulas[idx];
    store.formulas.splice(idx, 1);
    store.bookmarks = store.bookmarks.filter((b) => b.formula_id !== id);
    invalidateChapterPdfR2(store, removed.chapter_id);
    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);
    return res.status(200).json({ success: true });
  });

  // ---------------------------------------------------------------------------
  // 9. ADMIN: Bulk Import Formulas by 100-Row Chunk (POST /api/formulas/import-chunk)
  //    - Checks admin permission on the server for EVERY chunk
  //    - Auto-creates missing chapters inside the locked category
  //    - Validates formula_latex with KaTeX before import
  //    - Supports duplicate_strategy: 'skip' | 'update'
  //    - Stores raw CSV upload in R2 and logs only the R2 key in import_logs
  // ---------------------------------------------------------------------------
  app.post('/api/formulas/import-chunk', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Admin permission is required for every import chunk.',
      });
    }

    if (!checkRateLimit(writeRateMap, `fv_import:${user!.uid}`, 300, 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Import rate limit exceeded. Please retry chunk.',
      });
    }

    const body = req.body || {};
    const categoryId = String(body.category_id || '').trim();
    const defaultChapterId = String(body.default_chapter_id || '').trim();
    const defaultChapterTitleInput = String(body.default_chapter || '').trim();
    const duplicateStrategy: 'skip' | 'update' =
      body.duplicate_strategy === 'update' ? 'update' : 'skip';
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const chunkOffset = Number(body.chunk_offset ?? Number(body.chunk_index || 0) * 100);
    const chunkIndex = Number(body.chunk_index ?? Math.floor(chunkOffset / 100));
    const rawCsvContent =
      typeof body.raw_csv_text === 'string'
        ? body.raw_csv_text
        : typeof body.raw_csv === 'string'
        ? body.raw_csv
        : '';
    const fileName = String(body.file_name || 'bulk_import.csv').trim();
    const sourceType: 'csv' | 'gsheet' | 'paste' =
      body.source_type === 'gsheet' || body.source_type === 'paste' ? body.source_type : 'csv';

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Locked target category_id is required.',
      });
    }

    const store = loadFormulaVaultStore();
    const category = store.categories.find(
      (c) => c.id === categoryId || c.slug.toLowerCase() === categoryId.toLowerCase()
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        error: `Target category "${categoryId}" not found.`,
      });
    }

    const defaultChapterObj = defaultChapterId
      ? store.chapters.find((c) => c.id === defaultChapterId && c.category_id === category.id)
      : null;
    const defaultChapterTitle = defaultChapterObj?.title || defaultChapterTitleInput || '';

    let csvR2Key = '';
    if (chunkIndex === 0 && rawCsvContent.length > 0) {
      try {
        csvR2Key = `formulas/imports/${category.slug}_${Date.now()}_${slugifyText(fileName)}.csv`;
        const fullCsvPath = path.resolve(R2_DIR, csvR2Key);
        fs.mkdirSync(path.dirname(fullCsvPath), { recursive: true });
        fs.writeFileSync(fullCsvPath, rawCsvContent, 'utf-8');
      } catch {
        csvR2Key = '';
      }
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: Array<{ rowNumber: number; reason: string; row?: number; message?: string }> = [];
    const touchedChapterIds = new Set<string>();
    const nowIso = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const rowNum = Number(r.rowNumber || r.rowIndex || chunkOffset + i + 1);
      const chapterTitle = String(r.chapter || defaultChapterTitle || '').trim();
      const chapterNoInput = Number(r.chapter_no);
      const subtopicsInput = String(r.subtopics || '').trim();
      const formulaNoInput = Number(r.formula_no);
      const formulaLatex = String(r.formula_latex || '').trim();
      const note = String(r.note || '').trim();
      const titleInput = String(r.title || '').trim();

      if (!chapterTitle) {
        failedCount++;
        const msg = 'Missing chapter name and no default chapter set.';
        errors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }

      if (!formulaLatex) {
        failedCount++;
        const msg = 'Missing formula_latex.';
        errors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }

      const latexCheck = validateServerLatex(formulaLatex);
      if (!latexCheck.valid) {
        failedCount++;
        const msg = `Broken LaTeX: ${latexCheck.error}`;
        errors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }

      // Locate or auto-create chapter inside the locked category
      let chapter = store.chapters.find(
        (ch) =>
          ch.category_id === category.id &&
          (ch.title.toLowerCase() === chapterTitle.toLowerCase() ||
            ch.slug === slugifyText(chapterTitle))
      );

      if (!chapter) {
        const catChapters = store.chapters.filter((ch) => ch.category_id === category.id);
        const maxSort = catChapters.reduce((m, ch) => Math.max(m, Number(ch.sort_order || 0)), 0);
        const maxChapNo = catChapters.reduce((m, ch) => Math.max(m, Number(ch.chapter_no || 0)), 0);
        const resolvedChapNo =
          Number.isFinite(chapterNoInput) && chapterNoInput > 0 ? chapterNoInput : maxChapNo + 1;
        const chSlug = slugifyText(chapterTitle);
        chapter = {
          id: `chap_${category.slug}_${chSlug}_${crypto.randomUUID().slice(0, 5)}`,
          category_id: category.id,
          chapter_no: resolvedChapNo,
          title: chapterTitle,
          slug: chSlug,
          subtopics: subtopicsInput,
          sort_order: maxSort + 1,
          formula_count: 0,
          status: 'live',
          pdf_r2_key: '',
          pdf_updated_at: '',
          search_text: `${resolvedChapNo} ${chapterTitle} ${subtopicsInput}`.toLowerCase(),
          created_at: nowIso,
          updated_at: nowIso,
        };
        store.chapters.push(chapter);
      } else if (subtopicsInput && !chapter.subtopics) {
        chapter.subtopics = subtopicsInput;
      }

      const chapFormulas = store.formulas.filter((f) => f.chapter_id === chapter!.id);
      const maxFormulaNo = chapFormulas.reduce(
        (m, f) => Math.max(m, Number(f.formula_no || 0)),
        0
      );
      const resolvedFormulaNo =
        Number.isFinite(formulaNoInput) && formulaNoInput > 0 ? formulaNoInput : maxFormulaNo + 1;

      const existingDuplicate = chapFormulas.find(
        (f) =>
          f.formula_no === resolvedFormulaNo ||
          f.formula_latex.trim().toLowerCase() === formulaLatex.toLowerCase()
      );

      if (existingDuplicate) {
        if (duplicateStrategy === 'skip') {
          skippedCount++;
          continue;
        } else {
          // Update existing formula in place
          existingDuplicate.formula_no = resolvedFormulaNo;
          existingDuplicate.formula_latex = formulaLatex;
          existingDuplicate.plain_text = latexToPlainText(formulaLatex);
          if (note) existingDuplicate.note = note;
          if (titleInput) existingDuplicate.title = titleInput;
          existingDuplicate.is_render_valid = 1;
          existingDuplicate.render_error = '';
          existingDuplicate.updated_at = nowIso;
          existingDuplicate.search_text = `${chapter.title} ${chapter.subtopics} ${existingDuplicate.title} ${existingDuplicate.plain_text} ${existingDuplicate.note} ${formulaLatex}`
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
          updatedCount++;
          touchedChapterIds.add(chapter.id);
          continue;
        }
      }

      const maxSort = chapFormulas.reduce((m, f) => Math.max(m, Number(f.sort_order || 0)), 0);
      const plainText = latexToPlainText(formulaLatex);
      const newFormula: D1FormulaRow = {
        id: `form_${chapter.id}_${resolvedFormulaNo}_${crypto.randomUUID().slice(0, 5)}`,
        category_id: category.id,
        chapter_id: chapter.id,
        formula_no: resolvedFormulaNo,
        title: titleInput,
        formula_latex: formulaLatex,
        plain_text: plainText,
        note,
        status: 'live',
        sort_order: maxSort + 1,
        is_render_valid: 1,
        render_error: '',
        search_text: `${chapter.title} ${chapter.subtopics} ${titleInput} ${plainText} ${note} ${formulaLatex}`
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .trim(),
        created_at: nowIso,
        updated_at: nowIso,
      };
      store.formulas.push(newFormula);
      importedCount++;
      touchedChapterIds.add(chapter.id);
    }

    for (const chId of touchedChapterIds) {
      invalidateChapterPdfR2(store, chId);
    }

    const logEntry: D1FormulaImportLogRow = {
      id: `fimp_${Date.now()}_${crypto.randomUUID().slice(0, 5)}`,
      category_id: category.id,
      category_name: category.name,
      chapter_id: Array.from(touchedChapterIds)[0] || '',
      admin_uid: user!.uid,
      source_type: sourceType,
      file_name: fileName,
      csv_r2_key: csvR2Key,
      duplicate_strategy: duplicateStrategy,
      total_rows: rows.length,
      imported_rows: importedCount,
      updated_rows: updatedCount,
      skipped_rows: skippedCount,
      failed_rows: failedCount,
      imported_count: importedCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      failed_count: failedCount,
      status: 'completed',
      created_at: nowIso,
    };
    store.import_logs.unshift(logEntry);
    if (store.import_logs.length > 100) {
      store.import_logs.length = 100;
    }

    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);

    return res.status(200).json({
      success: true,
      importedCount,
      updatedCount,
      skippedCount,
      failedCount,
      errors,
      csvR2Key,
    });
  });

  // ---------------------------------------------------------------------------
  // 10. ADMIN: Health Tab (Broken LaTeX, Empty Chapters, Duplicates) & Fix
  // ---------------------------------------------------------------------------
  app.get('/api/formulas/health', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }

    const store = loadFormulaVaultStore();
    recalculateFormulaVaultCounts(store);

    const catMap = new Map(store.categories.map((c) => [c.id, c]));
    const chapMap = new Map(store.chapters.map((c) => [c.id, c]));

    const brokenFormulas: Array<
      D1FormulaRow & { error: string; category_name: string; chapter_title: string }
    > = [];
    for (const f of store.formulas) {
      const check = validateServerLatex(f.formula_latex);
      f.is_render_valid = check.valid ? 1 : 0;
      f.render_error = check.error;
      if (!check.valid) {
        brokenFormulas.push({
          ...f,
          error: check.error || 'LaTeX syntax error',
          category_name: catMap.get(f.category_id)?.name || '',
          chapter_title: chapMap.get(f.chapter_id)?.title || '',
        });
      }
    }

    const emptyChapters = store.chapters
      .filter((ch) => !store.formulas.some((f) => f.chapter_id === ch.id))
      .map((ch) => ({
        ...ch,
        category_name: catMap.get(ch.category_id)?.name || '',
      }));

    const duplicateFormulas: Array<{
      formula: D1FormulaRow;
      duplicateOfId: string;
      reason: string;
      chapter_id: string;
      chapter_title: string;
      category_name: string;
      formulas?: D1FormulaRow[];
    }> = [];

    for (const ch of store.chapters) {
      const chFormulas = store.formulas.filter((f) => f.chapter_id === ch.id);
      const byNo = new Map<number, D1FormulaRow[]>();
      const byLatex = new Map<string, D1FormulaRow[]>();

      for (const f of chFormulas) {
        const listNo = byNo.get(f.formula_no) || [];
        listNo.push(f);
        byNo.set(f.formula_no, listNo);

        const normLatex = f.formula_latex.trim().toLowerCase().replace(/\s+/g, '');
        const listLatex = byLatex.get(normLatex) || [];
        listLatex.push(f);
        byLatex.set(normLatex, listLatex);
      }

      for (const [no, group] of byNo.entries()) {
        if (group.length > 1) {
          for (let i = 1; i < group.length; i++) {
            duplicateFormulas.push({
              formula: group[i],
              duplicateOfId: group[0].id,
              chapter_id: ch.id,
              chapter_title: ch.title,
              category_name: catMap.get(ch.category_id)?.name || '',
              reason: `Duplicate formula_no #${no} (${group.length} formulas)`,
              formulas: group,
            });
          }
        }
      }

      for (const [, group] of byLatex.entries()) {
        if (group.length > 1) {
          for (let i = 1; i < group.length; i++) {
            if (!duplicateFormulas.some((d) => d.formula.id === group[i].id)) {
              duplicateFormulas.push({
                formula: group[i],
                duplicateOfId: group[0].id,
                chapter_id: ch.id,
                chapter_title: ch.title,
                category_name: catMap.get(ch.category_id)?.name || '',
                reason: `Identical LaTeX expression (${group.length} copies)`,
                formulas: group,
              });
            }
          }
        }
      }
    }

    const openReportsCount = store.formula_reports.filter((r) => r.status === 'open').length;

    const healthPayload = {
      ok:
        brokenFormulas.length === 0 &&
        emptyChapters.length === 0 &&
        duplicateFormulas.length === 0,
      totalCategories: store.categories.length,
      totalChapters: store.chapters.length,
      totalFormulas: store.formulas.length,
      liveFormulas: store.formulas.filter((f) => f.status === 'live').length,
      draftFormulas: store.formulas.filter((f) => f.status === 'draft').length,
      brokenFormulasCount: brokenFormulas.length,
      emptyChaptersCount: emptyChapters.length,
      duplicateFormulasCount: duplicateFormulas.length,
      openReportsCount,
      brokenFormulas,
      emptyChapters,
      duplicateFormulas,
      recentImports: store.import_logs.slice(0, 10),
    };

    return res.status(200).json({
      success: true,
      ...healthPayload,
      health: healthPayload,
    });
  });

  app.post('/api/formulas/health/fix', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }

    const action = String(req.body?.action || 'all');
    const store = loadFormulaVaultStore();
    let fixedCount = 0;

    if (action === 'all' || action === 'deduplicate') {
      for (const ch of store.chapters) {
        const chFormulas = store.formulas
          .filter((f) => f.chapter_id === ch.id)
          .sort(
            (a, b) =>
              Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
              Number(a.formula_no || 0) - Number(b.formula_no || 0)
          );
        const seenLatex = new Set<string>();
        const kept: D1FormulaRow[] = [];
        for (const f of chFormulas) {
          const norm = f.formula_latex.trim().toLowerCase().replace(/\s+/g, '');
          if (seenLatex.has(norm)) {
            fixedCount++;
            store.formulas = store.formulas.filter((item) => item.id !== f.id);
          } else {
            seenLatex.add(norm);
            kept.push(f);
          }
        }
        kept.forEach((f, idx) => {
          if (f.formula_no !== idx + 1) {
            f.formula_no = idx + 1;
            fixedCount++;
          }
          f.sort_order = idx + 1;
        });
      }
    }

    if (
      action === 'all' ||
      action === 'remove_empty_chapters' ||
      action === 'delete_empty_chapters'
    ) {
      const before = store.chapters.length;
      store.chapters = store.chapters.filter((ch) =>
        store.formulas.some((f) => f.chapter_id === ch.id)
      );
      fixedCount += before - store.chapters.length;
    }

    recalculateFormulaVaultCounts(store);
    saveFormulaVaultStore(store);

    return res.status(200).json({ success: true, fixedCount });
  });

  // ---------------------------------------------------------------------------
  // 11. STUDENT & ADMIN: Formula Error Reports
  // ---------------------------------------------------------------------------
  app.get('/api/formulas/reports', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }

    const statusFilter = String(req.query.status || 'all')
      .trim()
      .toLowerCase();
    const store = loadFormulaVaultStore();
    const catMap = new Map(store.categories.map((c) => [c.id, c]));
    const chapMap = new Map(store.chapters.map((c) => [c.id, c]));
    const formMap = new Map(store.formulas.map((f) => [f.id, f]));

    const reports = store.formula_reports
      .filter((rep) => statusFilter === 'all' || rep.status === statusFilter)
      .map((rep) => {
        const f = formMap.get(rep.formula_id);
        return {
          ...rep,
          category_name: catMap.get(rep.category_id)?.name || '',
          chapter_title: chapMap.get(rep.chapter_id)?.title || '',
          formula_no: f?.formula_no || 1,
          formula_latex: f?.formula_latex || rep.formula_latex_snapshot,
          formula_latex_snapshot: f?.formula_latex || rep.formula_latex_snapshot,
        };
      });

    const importLogs = store.import_logs.map((log) => ({
      ...log,
      category_name: log.category_name || catMap.get(log.category_id)?.name || 'Category',
      imported_count: log.imported_count ?? log.imported_rows ?? 0,
      updated_count: log.updated_count ?? log.updated_rows ?? 0,
      skipped_count: log.skipped_count ?? log.skipped_rows ?? 0,
      failed_count: log.failed_count ?? log.failed_rows ?? 0,
    }));

    return res.status(200).json({ success: true, reports, importLogs });
  });

  app.post('/api/formulas/reports', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    const formulaId = String(req.body?.formula_id || '').trim();
    const reason = String(req.body?.reason || '').trim().slice(0, 120);
    const details = String(req.body?.details || '').trim().slice(0, 600);

    if (!formulaId || !reason) {
      return res
        .status(400)
        .json({ success: false, error: 'formula_id and reason are required.' });
    }

    const store = loadFormulaVaultStore();
    const formula = store.formulas.find((f) => f.id === formulaId);
    if (!formula) {
      return res.status(404).json({ success: false, error: 'Formula not found.' });
    }

    const nowIso = new Date().toISOString();
    const newReport: D1FormulaReportRow = {
      id: `frep_${Date.now()}_${crypto.randomUUID().slice(0, 5)}`,
      formula_id: formula.id,
      category_id: formula.category_id,
      chapter_id: formula.chapter_id,
      user_id: user?.uid || 'guest',
      reason,
      details,
      formula_latex_snapshot: formula.formula_latex,
      formula_latex: formula.formula_latex,
      status: 'open',
      resolved_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    };

    store.formula_reports.unshift(newReport);
    saveFormulaVaultStore(store);

    return res.status(201).json({
      success: true,
      reportId: newReport.id,
      report: newReport,
    });
  });

  app.patch('/api/formulas/reports/:id', async (req: Request, res: Response) => {
    const user = await verifyUser(req);
    if (!isAdminOrSuperadmin(user)) {
      return res.status(user ? 403 : 401).json({ success: false, error: 'Forbidden' });
    }

    const id = String(req.params.id || '').trim();
    const status = req.body?.status;
    if (status !== 'open' && status !== 'resolved' && status !== 'ignored') {
      return res.status(400).json({ success: false, error: 'Invalid report status.' });
    }

    const store = loadFormulaVaultStore();
    const rep = store.formula_reports.find((r) => r.id === id);
    if (!rep) {
      return res.status(404).json({ success: false, error: 'Report not found.' });
    }

    rep.status = status;
    rep.resolved_by = user!.uid;
    rep.updated_at = new Date().toISOString();
    saveFormulaVaultStore(store);

    return res.status(200).json({ success: true, report: rep });
  });
}

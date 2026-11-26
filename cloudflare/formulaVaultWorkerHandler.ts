import {
  FORMULA_VAULT_CATEGORIES_SEED,
  FORMULA_VAULT_CHAPTERS_SEED,
  FORMULA_VAULT_ITEMS_SEED,
  buildFormulaSearchText,
  buildFormulaSlug,
} from '../src/constants/formulaVaultSeed';
import { validateMath } from '../src/lib/math';

const edgeGuestRateMap = new Map<string, { count: number; resetAt: number }>();

function checkEdgeRateLimit(ip: string, limit = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  const rec = edgeGuestRateMap.get(ip);
  if (!rec || now >= rec.resetAt) {
    edgeGuestRateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  rec.count += 1;
  return rec.count <= limit;
}

export function normalizeWorkerChapterMatchKey(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^(?:chapter|chap|ch|sheet)?\s*\d+\s*[:.\-–—]?\s*/i, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractWorkerLeadingChapterNoAndTitle(
  rawTitle: string,
  fallbackNo?: number
): { chapterNo: number | null; cleanTitle: string } {
  const trimmed = String(rawTitle || '').trim();
  const m = /^(?:chapter|chap|ch|sheet)?\s*(\d{1,3})\s*[:.\-–—\s]+\s*(.+)$/i.exec(trimmed);
  if (m && m[2].trim()) {
    const parsedNo = Number(m[1]);
    return {
      chapterNo: Number.isFinite(parsedNo) && parsedNo > 0 ? parsedNo : fallbackNo || null,
      cleanTitle: m[2].trim(),
    };
  }
  const fb = Number(fallbackNo);
  return {
    chapterNo: Number.isFinite(fb) && fb > 0 ? fb : null,
    cleanTitle: trimmed,
  };
}

export async function recalculateFormulaVaultD1Counts(
  db: any,
  targetCategoryId?: string
): Promise<void> {
  try {
    if (targetCategoryId) {
      await db.batch([
        db
          .prepare(
            `UPDATE chapters
             SET formula_count = (
               SELECT COUNT(*) FROM formulas f
               WHERE f.chapter_id = chapters.id AND f.category_id = chapters.category_id
             )
             WHERE category_id = ?`
          )
          .bind(targetCategoryId),
        db
          .prepare(
            `UPDATE categories
             SET chapter_count = (
               SELECT COUNT(*) FROM chapters ch WHERE ch.category_id = categories.id
             ),
             formula_count = (
               SELECT COUNT(*) FROM formulas f WHERE f.category_id = categories.id
             )
             WHERE id = ?`
          )
          .bind(targetCategoryId),
      ]);
    } else {
      await db.batch([
        db.prepare(
          `UPDATE chapters
           SET formula_count = (
             SELECT COUNT(*) FROM formulas f
             WHERE f.chapter_id = chapters.id AND f.category_id = chapters.category_id
           )`
        ),
        db.prepare(
          `UPDATE categories
           SET chapter_count = (
             SELECT COUNT(*) FROM chapters ch WHERE ch.category_id = categories.id
           ),
           formula_count = (
             SELECT COUNT(*) FROM formulas f WHERE f.category_id = categories.id
           )`
        ),
      ]);
    }
  } catch (err) {
    console.warn('[FormulaVaultWorker] recalculateFormulaVaultD1Counts warning:', err);
  }
}

function normalizeLatexComparisonKey(latex: string): string {
  return String(latex || '').trim().toLowerCase().replace(/\s+/g, '');
}

async function runBatchedD1(db: any, stmts: any[]): Promise<void> {
  for (let i = 0; i < stmts.length; i += 50) {
    await db.batch(stmts.slice(i, i + 50));
  }
}

export async function normalizeFormulaVaultD1Numbering(
  db: any,
  targetCategoryId?: string
): Promise<{
  fixedChapters: number;
  removedDuplicateFormulas: number;
  renumberedFormulas: number;
}> {
  let fixedChapters = 0;
  let removedDuplicateFormulas = 0;
  let renumberedFormulas = 0;

  try {
    const chapsRes = targetCategoryId
      ? await db
          .prepare(
            'SELECT * FROM chapters WHERE category_id = ? ORDER BY CAST(chapter_no AS INTEGER) ASC, sort_order ASC, created_at ASC, id ASC'
          )
          .bind(targetCategoryId)
          .all()
      : await db
          .prepare(
            'SELECT * FROM chapters ORDER BY category_id ASC, CAST(chapter_no AS INTEGER) ASC, sort_order ASC, created_at ASC, id ASC'
          )
          .all();

    const allChaps: any[] = chapsRes.results || [];
    const chapsByCat = new Map<string, any[]>();
    for (const ch of allChaps) {
      const cid = String(ch.category_id || '');
      const list = chapsByCat.get(cid) || [];
      list.push(ch);
      chapsByCat.set(cid, list);
    }

    const stmts: any[] = [];

    for (const [, catChaps] of chapsByCat.entries()) {
      // 1. Merge duplicate chapters with same normalized title inside the category
      const canonicalByKey = new Map<string, any>();
      const kept: any[] = [];
      for (const ch of catChaps) {
        const extracted = extractWorkerLeadingChapterNoAndTitle(
          String(ch.title || ''),
          Number(ch.chapter_no || 0)
        );
        const cleanTitle = extracted.cleanTitle || String(ch.title || '').trim();
        const key = normalizeWorkerChapterMatchKey(cleanTitle);
        const existing = canonicalByKey.get(key);
        if (!existing) {
          ch.title = cleanTitle;
          canonicalByKey.set(key, ch);
          kept.push(ch);
        } else if (String(existing.id) !== String(ch.id)) {
          stmts.push(
            db
              .prepare('UPDATE formulas SET chapter_id = ? WHERE chapter_id = ? AND category_id = ?')
              .bind(String(existing.id), String(ch.id), String(ch.category_id)),
            db.prepare('DELETE FROM chapters WHERE id = ?').bind(String(ch.id))
          );
          fixedChapters += 1;
        }
      }

      // 2. Re-sequence chapter_no = 1..N and sort_order = 1..N stably
      kept.sort(
        (a, b) =>
          Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
          String(a.created_at || '').localeCompare(String(b.created_at || '')) ||
          String(a.id || '').localeCompare(String(b.id || ''))
      );

      kept.forEach((ch, idx) => {
        const seqNo = idx + 1;
        const searchText = buildFormulaSearchText([seqNo, ch.title, ch.subtopics]);
        if (
          Number(ch.chapter_no) !== seqNo ||
          Number(ch.sort_order) !== seqNo ||
          String(ch.search_text || '') !== searchText
        ) {
          stmts.push(
            db
              .prepare(
                "UPDATE chapters SET chapter_no = ?, sort_order = ?, title = ?, search_text = ?, updated_at = datetime('now') WHERE id = ?"
              )
              .bind(seqNo, seqNo, String(ch.title || ''), searchText, String(ch.id))
          );
          if (Number(ch.chapter_no) !== seqNo) fixedChapters += 1;
        }
      });
    }

    if (stmts.length > 0) {
      await runBatchedD1(db, stmts);
    }

    // 3. Deduplicate exact-LaTeX formulas and re-sequence formula_no = 1..M per chapter
    const formsRes = targetCategoryId
      ? await db
          .prepare(
            'SELECT * FROM formulas WHERE category_id = ? ORDER BY chapter_id ASC, CAST(formula_no AS INTEGER) ASC, sort_order ASC, created_at ASC, id ASC'
          )
          .bind(targetCategoryId)
          .all()
      : await db
          .prepare(
            'SELECT * FROM formulas ORDER BY chapter_id ASC, CAST(formula_no AS INTEGER) ASC, sort_order ASC, created_at ASC, id ASC'
          )
          .all();

    const allForms: any[] = formsRes.results || [];
    const formsByChap = new Map<string, any[]>();
    for (const f of allForms) {
      const chId = String(f.chapter_id || '');
      const list = formsByChap.get(chId) || [];
      list.push(f);
      formsByChap.set(chId, list);
    }

    const formStmts: any[] = [];
    for (const [, chapForms] of formsByChap.entries()) {
      chapForms.sort(
        (a, b) =>
          Number(a.formula_no || 0) - Number(b.formula_no || 0) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
          String(a.created_at || '').localeCompare(String(b.created_at || '')) ||
          String(a.id || '').localeCompare(String(b.id || ''))
      );

      // Prefer keeping the richest copy when identical LaTeX appears multiple times
      const keptByLatex = new Map<string, any>();
      const keptOrdered: any[] = [];
      for (const f of chapForms) {
        const key = normalizeLatexComparisonKey(String(f.formula_latex || ''));
        const existing = key ? keptByLatex.get(key) : undefined;
        if (!existing) {
          if (key) keptByLatex.set(key, f);
          keptOrdered.push(f);
        } else {
          const existingScore =
            (String(existing.title || '').trim() ? 2 : 0) +
            (String(existing.note || '').trim() ? 1 : 0);
          const candidateScore =
            (String(f.title || '').trim() ? 2 : 0) + (String(f.note || '').trim() ? 1 : 0);
          if (candidateScore > existingScore) {
            formStmts.push(
              db.prepare('DELETE FROM formulas WHERE id = ?').bind(String(existing.id))
            );
            const pos = keptOrdered.indexOf(existing);
            if (pos >= 0) keptOrdered[pos] = f;
            keptByLatex.set(key, f);
          } else {
            formStmts.push(db.prepare('DELETE FROM formulas WHERE id = ?').bind(String(f.id)));
          }
          removedDuplicateFormulas += 1;
        }
      }

      keptOrdered.forEach((f, idx) => {
        const seqNo = idx + 1;
        if (Number(f.formula_no) !== seqNo || Number(f.sort_order) !== seqNo) {
          formStmts.push(
            db
              .prepare(
                "UPDATE formulas SET formula_no = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?"
              )
              .bind(seqNo, seqNo, String(f.id))
          );
          if (Number(f.formula_no) !== seqNo) renumberedFormulas += 1;
        }
      });
    }

    if (formStmts.length > 0) {
      await runBatchedD1(db, formStmts);
    }

    await recalculateFormulaVaultD1Counts(db, targetCategoryId);
  } catch (err) {
    console.warn('[FormulaVaultWorker] normalizeFormulaVaultD1Numbering warning:', err);
  }

  return { fixedChapters, removedDuplicateFormulas, renumberedFormulas };
}

async function repositionChapterNumberD1(
  db: any,
  categoryId: string,
  chapterId: string,
  desiredNo: number
): Promise<void> {
  const res = await db
    .prepare(
      'SELECT * FROM chapters WHERE category_id = ? ORDER BY CAST(chapter_no AS INTEGER) ASC, sort_order ASC, id ASC'
    )
    .bind(categoryId)
    .all();
  const list: any[] = (res.results || []).filter((c: any) => String(c.id) !== String(chapterId));
  const target = (res.results || []).find((c: any) => String(c.id) === String(chapterId));
  if (!target) return;
  const clampedIdx = Math.max(0, Math.min(list.length, Math.floor(desiredNo) - 1));
  list.splice(clampedIdx, 0, target);
  const stmts = list.map((ch, idx) => {
    const seqNo = idx + 1;
    const searchText = buildFormulaSearchText([seqNo, ch.title, ch.subtopics]);
    return db
      .prepare(
        "UPDATE chapters SET chapter_no = ?, sort_order = ?, search_text = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind(seqNo, seqNo, searchText, String(ch.id));
  });
  if (stmts.length > 0) await runBatchedD1(db, stmts);
}

async function repositionFormulaNumberD1(
  db: any,
  chapterId: string,
  formulaId: string,
  desiredNo: number
): Promise<void> {
  const res = await db
    .prepare(
      'SELECT id, formula_no, sort_order FROM formulas WHERE chapter_id = ? ORDER BY CAST(formula_no AS INTEGER) ASC, sort_order ASC, id ASC'
    )
    .bind(chapterId)
    .all();
  const list: any[] = (res.results || []).filter((f: any) => String(f.id) !== String(formulaId));
  const target = (res.results || []).find((f: any) => String(f.id) === String(formulaId));
  if (!target) return;
  const clampedIdx = Math.max(0, Math.min(list.length, Math.floor(desiredNo) - 1));
  list.splice(clampedIdx, 0, target);
  const stmts = list.map((f, idx) => {
    const seqNo = idx + 1;
    return db
      .prepare(
        "UPDATE formulas SET formula_no = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind(seqNo, seqNo, String(f.id));
  });
  if (stmts.length > 0) await runBatchedD1(db, stmts);
}

let formulaSchemaEnsured = false;

async function ensureFormulaVaultD1SchemaAndSeed(db: any): Promise<void> {
  if (formulaSchemaEnsured) return;
  try {
    await db.batch([
      db.prepare(
        `CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL DEFAULT '',
          sort_order INTEGER NOT NULL DEFAULT 0,
          chapter_count INTEGER NOT NULL DEFAULT 0,
          formula_count INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'live',
          guest_access INTEGER NOT NULL DEFAULT 1,
          search_text TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS chapters (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          chapter_no INTEGER NOT NULL DEFAULT 1,
          title TEXT NOT NULL,
          slug TEXT NOT NULL,
          subtopics TEXT NOT NULL DEFAULT '',
          sort_order INTEGER NOT NULL DEFAULT 0,
          formula_count INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'live',
          pdf_r2_key TEXT NOT NULL DEFAULT '',
          pdf_updated_at TEXT DEFAULT '',
          search_text TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS formulas (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          formula_no INTEGER NOT NULL DEFAULT 1,
          title TEXT NOT NULL DEFAULT '',
          formula_latex TEXT NOT NULL,
          plain_text TEXT NOT NULL DEFAULT '',
          note TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'live',
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_render_valid INTEGER NOT NULL DEFAULT 1,
          render_error TEXT NOT NULL DEFAULT '',
          search_text TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS bookmarks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          formula_id TEXT NOT NULL,
          category_id TEXT NOT NULL DEFAULT '',
          chapter_id TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(user_id, formula_id)
        )`
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS formula_reports (
          id TEXT PRIMARY KEY,
          formula_id TEXT NOT NULL,
          category_id TEXT NOT NULL DEFAULT '',
          chapter_id TEXT NOT NULL DEFAULT '',
          user_id TEXT NOT NULL DEFAULT 'guest',
          reason TEXT NOT NULL DEFAULT '',
          details TEXT NOT NULL DEFAULT '',
          formula_latex_snapshot TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'open',
          resolved_by TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS import_logs (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL DEFAULT '',
          admin_uid TEXT NOT NULL DEFAULT '',
          source_type TEXT NOT NULL DEFAULT 'csv',
          file_name TEXT NOT NULL DEFAULT '',
          csv_r2_key TEXT NOT NULL DEFAULT '',
          duplicate_strategy TEXT NOT NULL DEFAULT 'skip',
          total_rows INTEGER NOT NULL DEFAULT 0,
          imported_rows INTEGER NOT NULL DEFAULT 0,
          updated_rows INTEGER NOT NULL DEFAULT 0,
          skipped_rows INTEGER NOT NULL DEFAULT 0,
          failed_rows INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'completed',
          created_at TEXT DEFAULT (datetime('now'))
        )`
      ),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_fv_chapters_cat ON chapters(category_id, chapter_no)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_fv_formulas_chap ON formulas(chapter_id, category_id)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_fv_formulas_cat ON formulas(category_id)`),
    ]);

    // Ensure seed categories exist
    const catStmts: any[] = [];
    for (const c of FORMULA_VAULT_CATEGORIES_SEED) {
      catStmts.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO categories (
              id, name, slug, description, sort_order, chapter_count, formula_count, status, guest_access, search_text, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            String(c.id || ''),
            String(c.name || ''),
            String(c.slug || ''),
            String(c.description || ''),
            Number(c.sort_order || 0),
            Number(c.chapter_count || 0),
            Number(c.formula_count || 0),
            String(c.status || 'live'),
            Number(c.guest_access ?? 1),
            String(c.search_text || ''),
            String(c.created_at || ''),
            String(c.updated_at || '')
          )
      );
    }
    if (catStmts.length > 0) {
      await db.batch(catStmts);
    }

    // Load current chapters & formula counts per chapter to heal any mismatched chapter_ids
    // and ensure seed chapters (including 1 Number System, 2 Algebraic Identities, 3 Exponents & Surds) exist with formulas
    const existingChaptersRes = await db
      .prepare('SELECT * FROM chapters ORDER BY CAST(chapter_no AS INTEGER) ASC, sort_order ASC')
      .all()
      .catch(() => ({ results: [] }));
    const existingChapters: any[] = existingChaptersRes.results || [];

    const canonicalByCatAndKey = new Map<string, any>();
    const healStmts: any[] = [];

    for (const ch of existingChapters) {
      const extracted = extractWorkerLeadingChapterNoAndTitle(String(ch.title || ''), Number(ch.chapter_no || 0));
      if (extracted.cleanTitle && extracted.cleanTitle !== ch.title) {
        const nextNo = Number(ch.chapter_no) > 0 ? Number(ch.chapter_no) : extracted.chapterNo || 1;
        ch.title = extracted.cleanTitle;
        ch.chapter_no = nextNo;
        healStmts.push(
          db
            .prepare('UPDATE chapters SET title = ?, chapter_no = ? WHERE id = ?')
            .bind(String(ch.title), Number(ch.chapter_no), String(ch.id))
        );
      }
      const key = `${ch.category_id}::${normalizeWorkerChapterMatchKey(ch.title)}`;
      const canonical = canonicalByCatAndKey.get(key);
      if (!canonical) {
        canonicalByCatAndKey.set(key, ch);
      } else if (canonical.id !== ch.id) {
        // Re-point formulas from duplicate chapter to canonical chapter and remove duplicate chapter
        healStmts.push(
          db
            .prepare('UPDATE formulas SET chapter_id = ? WHERE chapter_id = ? AND category_id = ?')
            .bind(String(canonical.id), String(ch.id), String(ch.category_id)),
          db.prepare('DELETE FROM chapters WHERE id = ?').bind(String(ch.id))
        );
      }
    }

    // Heal formulas whose chapter_id matches a chapter slug, title, or chapter_no instead of chapters.id
    for (const [, canonical] of canonicalByCatAndKey.entries()) {
      const normTitle = String(canonical.title || '').toLowerCase();
      const numberedTitle = `${canonical.chapter_no} ${canonical.title}`.toLowerCase();
      healStmts.push(
        db
          .prepare(
            `UPDATE formulas
             SET chapter_id = ?
             WHERE category_id = ?
               AND chapter_id != ?
               AND (
                 LOWER(chapter_id) = ?
                 OR LOWER(chapter_id) = ?
                 OR LOWER(chapter_id) = ?
                 OR chapter_id = ?
               )`
          )
          .bind(
            String(canonical.id),
            String(canonical.category_id),
            String(canonical.id),
            String(canonical.slug || '').toLowerCase(),
            normTitle,
            numberedTitle,
            String(canonical.chapter_no)
          )
      );
    }

    if (healStmts.length > 0) {
      for (let i = 0; i < healStmts.length; i += 50) {
        await db.batch(healStmts.slice(i, i + 50)).catch(() => {});
      }
    }

    // Check which seed chapters are missing or have 0 formulas in D1
    const countByChapRes = await db
      .prepare('SELECT chapter_id, COUNT(*) AS cnt FROM formulas GROUP BY chapter_id')
      .all()
      .catch(() => ({ results: [] }));
    const formulaCountByChapId = new Map<string, number>();
    for (const r of countByChapRes.results || []) {
      formulaCountByChapId.set(String((r as any).chapter_id), Number((r as any).cnt || 0));
    }

    const seedStmts: any[] = [];
    for (const seedCh of FORMULA_VAULT_CHAPTERS_SEED) {
      const key = `${seedCh.category_id}::${normalizeWorkerChapterMatchKey(seedCh.title)}`;
      const existingCanonical = canonicalByCatAndKey.get(key);
      const targetChapterId = existingCanonical ? String(existingCanonical.id) : String(seedCh.id);

      if (!existingCanonical) {
        seedStmts.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO chapters (
                id, category_id, chapter_no, title, slug, subtopics, sort_order, formula_count, status, pdf_r2_key, pdf_updated_at, search_text, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              String(seedCh.id),
              String(seedCh.category_id),
              Number(seedCh.chapter_no || 1),
              String(seedCh.title || ''),
              String(seedCh.slug || ''),
              String(seedCh.subtopics || ''),
              Number(seedCh.sort_order || 1),
              Number(seedCh.formula_count || 0),
              String(seedCh.status || 'live'),
              String(seedCh.pdf_r2_key || ''),
              String(seedCh.pdf_updated_at || ''),
              String(seedCh.search_text || ''),
              String(seedCh.created_at || ''),
              String(seedCh.updated_at || '')
            )
        );
      }

      const currentCnt = formulaCountByChapId.get(targetChapterId) || 0;
      if (currentCnt === 0) {
        const seedItems = FORMULA_VAULT_ITEMS_SEED.filter((f) => f.chapter_id === seedCh.id);
        for (const f of seedItems) {
          const fId =
            targetChapterId === seedCh.id ? String(f.id) : `form_${targetChapterId}_${f.formula_no}`;
          seedStmts.push(
            db
              .prepare(
                `INSERT OR IGNORE INTO formulas (
                  id, category_id, chapter_id, formula_no, title, formula_latex, plain_text, note, status, sort_order, is_render_valid, render_error, search_text, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(
                fId,
                String(seedCh.category_id),
                targetChapterId,
                Number(f.formula_no || 1),
                String(f.title || ''),
                String(f.formula_latex || ''),
                String(f.plain_text || ''),
                String(f.note || ''),
                String(f.status || 'live'),
                Number(f.sort_order || 1),
                Number(f.is_render_valid ?? 1),
                String(f.render_error || ''),
                String(f.search_text || ''),
                String(f.created_at || ''),
                String(f.updated_at || '')
              )
          );
        }
      }
    }

    for (let i = 0; i < seedStmts.length; i += 50) {
      await db.batch(seedStmts.slice(i, i + 50)).catch(() => {});
    }

    await normalizeFormulaVaultD1Numbering(db);
    formulaSchemaEnsured = true;
  } catch (err) {
    console.warn('[FormulaVaultWorker] Schema/seed check warning:', err);
  }
}

export async function handleFormulaVaultWorkerRequest(params: {
  req: Request;
  env: any;
  url: URL;
  cors: Record<string, string>;
  verifyFirebaseIdToken: (req: Request, env: any) => Promise<any>;
  jsonResponse: (data: unknown, status?: number, extraHeaders?: Record<string, string>) => Response;
}): Promise<Response> {
  const { req, env, url, cors, verifyFirebaseIdToken, jsonResponse } = params;
  if (!env.DB) {
    return jsonResponse({ success: false, error: 'D1 binding (DB) is missing' }, 503, cors);
  }

  await ensureFormulaVaultD1SchemaAndSeed(env.DB);

  const sub = url.pathname.slice('/api/formulas'.length).replace(/\/+$/, '') || '/';
  const method = req.method.toUpperCase();
  const user = await verifyFirebaseIdToken(req, env).catch(() => null);
  const isAdmin = Boolean(
    user &&
      (user.role === 'admin' ||
        user.role === 'superadmin' ||
        user.role === 'superAdmin' ||
        String(user.email || '').trim().toLowerCase() === 'shsvirtualadmin@gmail.com')
  );

  const clientIp = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'edge';
  if (!user && method === 'GET' && !checkEdgeRateLimit(clientIp, 120, 60_000)) {
    return jsonResponse(
      { success: false, error: 'Too many requests. Please slow down.' },
      429,
      { ...cors, 'Retry-After': '60' }
    );
  }

  // GET /api/formulas/overview — Live formula_count from formulas table + numeric chapter_no sort
  if (sub === '/overview' && method === 'GET') {
    const includeDrafts = url.searchParams.get('include_drafts') === '1' && isAdmin;
    const catSql = includeDrafts
      ? `SELECT categories.*,
           (SELECT COUNT(*) FROM chapters ch WHERE ch.category_id = categories.id) AS chapter_count,
           (SELECT COUNT(*) FROM formulas f WHERE f.category_id = categories.id) AS formula_count
         FROM categories
         ORDER BY sort_order ASC, name ASC`
      : `SELECT categories.*,
           (SELECT COUNT(*) FROM chapters ch WHERE ch.category_id = categories.id AND ch.status = 'live') AS chapter_count,
           (SELECT COUNT(*) FROM formulas f WHERE f.category_id = categories.id AND f.status = 'live') AS formula_count
         FROM categories
         WHERE status = 'live'
         ORDER BY sort_order ASC, name ASC`;

    const chSql = includeDrafts
      ? `SELECT chapters.*,
           (SELECT COUNT(*) FROM formulas f WHERE f.chapter_id = chapters.id AND f.category_id = chapters.category_id) AS formula_count
         FROM chapters
         ORDER BY CAST(chapter_no AS INTEGER) ASC, sort_order ASC`
      : `SELECT chapters.*,
           (SELECT COUNT(*) FROM formulas f WHERE f.chapter_id = chapters.id AND f.category_id = chapters.category_id AND f.status = 'live') AS formula_count
         FROM chapters
         WHERE status = 'live'
         ORDER BY CAST(chapter_no AS INTEGER) ASC, sort_order ASC`;

    const [catRes, chRes, featuredRes] = await Promise.all([
      env.DB.prepare(catSql).all(),
      env.DB.prepare(chSql).all(),
      env.DB.prepare("SELECT * FROM formulas WHERE status = 'live' ORDER BY sort_order ASC LIMIT 40").all(),
    ]);

    const featuredPool = featuredRes.results || [];
    const daySeed = Math.floor(Date.now() / 86_400_000);
    const fotdItem = featuredPool.length > 0 ? featuredPool[daySeed % featuredPool.length] : null;
    const categories = (catRes.results || []).map((c: any) => ({
      ...c,
      chapter_count: Number(c.chapter_count || 0),
      formula_count: Number(c.formula_count || 0),
    }));
    const chapters = (chRes.results || [])
      .map((ch: any) => ({
        ...ch,
        chapter_no: Number(ch.chapter_no || 1),
        formula_count: Number(ch.formula_count || 0),
      }))
      .sort(
        (a: any, b: any) =>
          Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
      );

    const fotdChapter = fotdItem ? chapters.find((c: any) => c.id === fotdItem.chapter_id) : null;
    const fotdCategory = fotdItem ? categories.find((c: any) => c.id === fotdItem.category_id) : null;

    let bookmarkedIds: string[] = [];
    if (user?.uid) {
      const bmRes = await env.DB.prepare(
        'SELECT formula_id FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC'
      )
        .bind(user.uid)
        .all()
        .catch(() => ({ results: [] }));
      bookmarkedIds = (bmRes.results || []).map((r: any) => String(r.formula_id));
    }

    const cacheHeader =
      !user && !includeDrafts
        ? 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
        : 'private, no-cache';

    return jsonResponse(
      {
        success: true,
        categories,
        chapters,
        formulaOfTheDay: fotdItem
          ? {
              ...fotdItem,
              chapter_title: fotdChapter?.title || '',
              chapter_no: fotdChapter?.chapter_no || 1,
              category_name: fotdCategory?.name || '',
            }
          : null,
        bookmarkedIds,
        isGuest: !user,
      },
      200,
      { ...cors, 'Cache-Control': cacheHeader }
    );
  }

  // GET /api/formulas/chapters/:chapterId
  const chapterMatch = /^\/chapters\/([^/]+)$/.exec(sub);
  if (chapterMatch && method === 'GET') {
    const chapterId = decodeURIComponent(chapterMatch[1]);
    const includeDrafts = url.searchParams.get('include_drafts') === '1' && isAdmin;
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(200, Math.max(10, Number(url.searchParams.get('page_size') || url.searchParams.get('limit') || 100)));
    const offset = Number(url.searchParams.get('offset') ?? (page - 1) * pageSize);

    const chapter = await env.DB.prepare(
      `SELECT chapters.*,
         (SELECT COUNT(*) FROM formulas f WHERE f.chapter_id = chapters.id AND f.category_id = chapters.category_id${
           includeDrafts ? '' : " AND f.status = 'live'"
         }) AS formula_count
       FROM chapters
       WHERE id = ? OR slug = ?`
    )
      .bind(chapterId, chapterId.toLowerCase())
      .first();

    if (!chapter || (!includeDrafts && chapter.status !== 'live')) {
      return jsonResponse({ success: false, error: 'Chapter not found.' }, 404, cors);
    }

    const category = await env.DB.prepare('SELECT * FROM categories WHERE id = ?')
      .bind(chapter.category_id)
      .first();

    const itemsRes = await env.DB.prepare(
      includeDrafts
        ? 'SELECT * FROM formulas WHERE chapter_id = ? ORDER BY CAST(formula_no AS INTEGER) ASC, sort_order ASC, id ASC LIMIT ? OFFSET ?'
        : "SELECT * FROM formulas WHERE chapter_id = ? AND status = 'live' ORDER BY CAST(formula_no AS INTEGER) ASC, sort_order ASC, id ASC LIMIT ? OFFSET ?"
    )
      .bind(chapter.id, pageSize, offset)
      .all();

    const cacheHeader =
      !user && !includeDrafts
        ? 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
        : 'private, no-cache';

    const formulas = itemsRes.results || [];
    return jsonResponse(
      {
        success: true,
        chapter: {
          ...chapter,
          formula_count: Number(chapter.formula_count ?? formulas.length),
        },
        category,
        formulas,
        total: Number(chapter.formula_count ?? formulas.length),
        page,
        pageSize,
        hasMore: formulas.length === pageSize,
      },
      200,
      { ...cors, 'Cache-Control': cacheHeader }
    );
  }

  // GET /api/formulas/search
  if (sub === '/search' && method === 'GET') {
    const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
    const categoryId = String(url.searchParams.get('category_id') || '').trim();
    if (!q) {
      return jsonResponse({ success: true, query: '', chapters: [], formulas: [] }, 200, cors);
    }
    const likePattern = `%${q}%`;
    const chRes = await env.DB.prepare(
      categoryId
        ? `SELECT chapters.*,
             (SELECT COUNT(*) FROM formulas f WHERE f.chapter_id = chapters.id AND f.category_id = chapters.category_id AND f.status = 'live') AS formula_count
           FROM chapters
           WHERE status = 'live' AND category_id = ? AND search_text LIKE ?
           ORDER BY CAST(chapter_no AS INTEGER) ASC, sort_order ASC LIMIT 25`
        : `SELECT chapters.*,
             (SELECT COUNT(*) FROM formulas f WHERE f.chapter_id = chapters.id AND f.category_id = chapters.category_id AND f.status = 'live') AS formula_count
           FROM chapters
           WHERE status = 'live' AND search_text LIKE ?
           ORDER BY CAST(chapter_no AS INTEGER) ASC, sort_order ASC LIMIT 25`
    )
      .bind(...(categoryId ? [categoryId, likePattern] : [likePattern]))
      .all();

    const fRes = await env.DB.prepare(
      categoryId
        ? "SELECT * FROM formulas WHERE status = 'live' AND category_id = ? AND search_text LIKE ? ORDER BY sort_order ASC LIMIT 60"
        : "SELECT * FROM formulas WHERE status = 'live' AND search_text LIKE ? ORDER BY sort_order ASC LIMIT 60"
    )
      .bind(...(categoryId ? [categoryId, likePattern] : [likePattern]))
      .all();

    return jsonResponse(
      {
        success: true,
        query: q,
        chapters: chRes.results || [],
        formulas: fRes.results || [],
      },
      200,
      { ...cors, 'Cache-Control': 'public, max-age=30, s-maxage=120' }
    );
  }

  // GET /api/formulas/bookmarks
  if (sub === '/bookmarks' && method === 'GET') {
    if (!user?.uid) {
      return jsonResponse({ success: false, error: 'Sign in required.' }, 401, cors);
    }
    const bmRes = await env.DB.prepare(
      `SELECT f.*, ch.title AS chapter_title, ch.chapter_no AS chapter_no, c.name AS category_name
       FROM bookmarks b
       JOIN formulas f ON f.id = b.formula_id
       LEFT JOIN chapters ch ON ch.id = f.chapter_id
       LEFT JOIN categories c ON c.id = f.category_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`
    )
      .bind(user.uid)
      .all();
    const bookmarks = bmRes.results || [];
    return jsonResponse(
      {
        success: true,
        bookmarks,
        bookmarkedIds: bookmarks.map((r: any) => String(r.id)),
      },
      200,
      cors
    );
  }

  // POST /api/formulas/bookmarks/toggle
  if (sub === '/bookmarks/toggle' && method === 'POST') {
    if (!user?.uid) {
      return jsonResponse({ success: false, error: 'Sign in required to save bookmarks.' }, 401, cors);
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const formulaId = String(body.formula_id || body.formulaId || '').trim();
    const formula = await env.DB.prepare('SELECT * FROM formulas WHERE id = ?').bind(formulaId).first();
    if (!formula) {
      return jsonResponse({ success: false, error: 'Formula not found.' }, 404, cors);
    }
    const existing = await env.DB.prepare(
      'SELECT id FROM bookmarks WHERE user_id = ? AND formula_id = ?'
    )
      .bind(user.uid, formulaId)
      .first();

    if (existing) {
      await env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ? AND formula_id = ?')
        .bind(user.uid, formulaId)
        .run();
    } else {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO bookmarks (user_id, formula_id, category_id, chapter_id) VALUES (?, ?, ?, ?)'
      )
        .bind(user.uid, formulaId, String(formula.category_id || ''), String(formula.chapter_id || ''))
        .run();
    }
    const allBm = await env.DB.prepare('SELECT formula_id FROM bookmarks WHERE user_id = ?')
      .bind(user.uid)
      .all();
    return jsonResponse(
      {
        success: true,
        bookmarked: !existing,
        formulaId,
        bookmarkedIds: (allBm.results || []).map((r: any) => String(r.formula_id)),
      },
      200,
      cors
    );
  }

  // POST /api/formulas/reports
  if (sub === '/reports' && method === 'POST') {
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const formulaId = String(body.formula_id || body.formulaId || '').trim();
    const reason = String(body.reason || 'incorrect_formula').trim();
    const details = String(body.details || '').trim();
    const formula = await env.DB.prepare('SELECT * FROM formulas WHERE id = ?').bind(formulaId).first();
    if (!formula) {
      return jsonResponse({ success: false, error: 'Formula not found.' }, 404, cors);
    }
    const id = `frep_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    await env.DB.prepare(
      `INSERT INTO formula_reports (
        id, formula_id, category_id, chapter_id, user_id, reason, details, formula_latex_snapshot, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`
    )
      .bind(
        id,
        String(formula.id),
        String(formula.category_id || ''),
        String(formula.chapter_id || ''),
        String(user?.uid || 'guest'),
        reason,
        details,
        String(formula.formula_latex || '')
      )
      .run();
    return jsonResponse({ success: true, reportId: id }, 201, cors);
  }

  // GET /api/formulas/reports (Admin)
  if (sub === '/reports' && method === 'GET') {
    if (!isAdmin) {
      return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    }
    const statusFilter = String(url.searchParams.get('status') || 'all').trim();
    const repRes = await env.DB.prepare(
      statusFilter !== 'all'
        ? `SELECT r.*, f.formula_no, f.formula_latex, ch.title AS chapter_title, c.name AS category_name
           FROM formula_reports r
           LEFT JOIN formulas f ON f.id = r.formula_id
           LEFT JOIN chapters ch ON ch.id = r.chapter_id
           LEFT JOIN categories c ON c.id = r.category_id
           WHERE r.status = ?
           ORDER BY r.created_at DESC LIMIT 200`
        : `SELECT r.*, f.formula_no, f.formula_latex, ch.title AS chapter_title, c.name AS category_name
           FROM formula_reports r
           LEFT JOIN formulas f ON f.id = r.formula_id
           LEFT JOIN chapters ch ON ch.id = r.chapter_id
           LEFT JOIN categories c ON c.id = r.category_id
           ORDER BY r.created_at DESC LIMIT 200`
    )
      .bind(...(statusFilter !== 'all' ? [statusFilter] : []))
      .all()
      .catch(() => ({ results: [] }));
    const logRes = await env.DB.prepare(
      `SELECT l.*, c.name AS category_name
       FROM import_logs l
       LEFT JOIN categories c ON c.id = l.category_id
       ORDER BY l.created_at DESC LIMIT 100`
    )
      .all()
      .catch(() => ({ results: [] }));
    return jsonResponse(
      {
        success: true,
        reports: repRes.results || [],
        importLogs: logRes.results || [],
      },
      200,
      cors
    );
  }

  // PATCH /api/formulas/reports/:id (Admin)
  const repMatch = /^\/reports\/([^/]+)$/.exec(sub);
  if (repMatch && method === 'PATCH') {
    if (!isAdmin) {
      return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    }
    const repId = decodeURIComponent(repMatch[1]);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const status = String(body.status || 'resolved').trim();
    await env.DB.prepare(
      "UPDATE formula_reports SET status = ?, resolved_by = ?, updated_at = datetime('now') WHERE id = ?"
    )
      .bind(status, String(user?.email || user?.uid || 'admin'), repId)
      .run();
    return jsonResponse({ success: true }, 200, cors);
  }

  // GET /api/formulas/health & POST /api/formulas/health/fix (Admin)
  if (sub === '/health' && method === 'GET') {
    if (!isAdmin) {
      return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    }
    await recalculateFormulaVaultD1Counts(env.DB);
    const [catsRes, chapsRes, formsRes, openReportsRes] = await Promise.all([
      env.DB.prepare('SELECT * FROM categories').all(),
      env.DB.prepare('SELECT * FROM chapters ORDER BY category_id ASC, CAST(chapter_no AS INTEGER) ASC, sort_order ASC').all(),
      env.DB.prepare('SELECT * FROM formulas ORDER BY chapter_id ASC, CAST(formula_no AS INTEGER) ASC, sort_order ASC').all(),
      env.DB.prepare("SELECT COUNT(*) AS cnt FROM formula_reports WHERE status = 'open'")
        .first()
        .catch(() => ({ cnt: 0 })),
    ]);
    const cats = catsRes.results || [];
    const chaps = chapsRes.results || [];
    const forms = formsRes.results || [];
    const openReportsCount = Number((openReportsRes as any)?.cnt || 0);
    const chapMap = new Map<string, any>(chaps.map((c: any) => [String(c.id), c]));
    const catMap = new Map<string, any>(cats.map((c: any) => [String(c.id), c]));

    const emptyChapters = chaps
      .filter((ch: any) => !forms.some((f: any) => f.chapter_id === ch.id))
      .map((ch: any) => ({
        ...ch,
        chapter_no: Number(ch.chapter_no || 1),
        category_name: catMap.get(String(ch.category_id))?.name || '',
      }));

    const brokenFormulas: any[] = [];
    const missingNoteFormulas: any[] = [];
    for (const f of forms as any[]) {
      const check = validateMath(String(f.formula_latex || ''));
      if (!check.valid) {
        brokenFormulas.push({
          ...f,
          formula_no: Number(f.formula_no || 1),
          error: check.error || 'Invalid LaTeX',
          render_error: check.error || 'Invalid LaTeX',
          chapter_title: chapMap.get(String(f.chapter_id))?.title || '',
          category_name: catMap.get(String(f.category_id))?.name || '',
        });
      }
      if (!String(f.note || '').trim()) {
        missingNoteFormulas.push({
          id: f.id,
          formula_no: Number(f.formula_no || 1),
          formula_latex: f.formula_latex,
          chapter_id: f.chapter_id,
          chapter_title: chapMap.get(String(f.chapter_id))?.title || '',
          category_id: f.category_id,
          category_name: catMap.get(String(f.category_id))?.name || '',
        });
      }
    }

    // Detect duplicate / non-sequential chapters per category
    const duplicateChapters: Array<{
      chapter: any;
      duplicateOfId?: string;
      reason: string;
      category_name: string;
    }> = [];
    const chapsByCat = new Map<string, any[]>();
    for (const ch of chaps as any[]) {
      const cid = String(ch.category_id || '');
      const list = chapsByCat.get(cid) || [];
      list.push(ch);
      chapsByCat.set(cid, list);
    }
    for (const [cid, catChaps] of chapsByCat.entries()) {
      const catName = catMap.get(cid)?.name || '';
      const byChNo = new Map<number, any[]>();
      const byChTitle = new Map<string, any[]>();
      const flaggedChapIds = new Set<string>();

      for (const ch of catChaps) {
        const no = Number(ch.chapter_no || 0);
        const listNo = byChNo.get(no) || [];
        listNo.push(ch);
        byChNo.set(no, listNo);

        const key = normalizeWorkerChapterMatchKey(String(ch.title || ''));
        if (key) {
          const listTitle = byChTitle.get(key) || [];
          listTitle.push(ch);
          byChTitle.set(key, listTitle);
        }
      }

      for (const [no, group] of byChNo.entries()) {
        if (group.length > 1) {
          for (let i = 1; i < group.length; i++) {
            flaggedChapIds.add(String(group[i].id));
            duplicateChapters.push({
              chapter: group[i],
              duplicateOfId: String(group[0].id),
              category_name: catName,
              reason: `Duplicate chapter number #${String(no).padStart(2, '0')} (${group.length} chapters in ${catName || 'category'})`,
            });
          }
        }
      }

      for (const [, group] of byChTitle.entries()) {
        if (group.length > 1) {
          for (let i = 1; i < group.length; i++) {
            if (!flaggedChapIds.has(String(group[i].id))) {
              flaggedChapIds.add(String(group[i].id));
              duplicateChapters.push({
                chapter: group[i],
                duplicateOfId: String(group[0].id),
                category_name: catName,
                reason: `Duplicate chapter title "${group[i].title}" (${group.length} copies)`,
              });
            }
          }
        }
      }

      const sortedChaps = [...catChaps].sort(
        (a, b) =>
          Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
      );
      sortedChaps.forEach((ch, idx) => {
        const expected = idx + 1;
        const actual = Number(ch.chapter_no || 0);
        if (actual !== expected && !flaggedChapIds.has(String(ch.id))) {
          flaggedChapIds.add(String(ch.id));
          duplicateChapters.push({
            chapter: ch,
            category_name: catName,
            reason: `Non-sequential chapter number #${String(actual).padStart(2, '0')} (expected #${String(expected).padStart(2, '0')})`,
          });
        }
      });
    }

    // Detect duplicate formula_no, identical LaTeX, and non-sequential formula_no per chapter
    const duplicateFormulas: Array<{
      formula: any;
      duplicateOfId: string;
      reason: string;
      chapter_id: string;
      chapter_title: string;
      category_name: string;
    }> = [];

    const formsByChap = new Map<string, any[]>();
    for (const f of forms as any[]) {
      const chId = String(f.chapter_id || '');
      const list = formsByChap.get(chId) || [];
      list.push(f);
      formsByChap.set(chId, list);
    }

    for (const [chId, chFormulas] of formsByChap.entries()) {
      const ch = chapMap.get(chId);
      const chTitle = ch?.title || '';
      const catName = catMap.get(String(ch?.category_id || chFormulas[0]?.category_id || ''))?.name || '';
      const byNo = new Map<number, any[]>();
      const byLatex = new Map<string, any[]>();
      const flaggedIds = new Set<string>();

      for (const f of chFormulas) {
        const no = Number(f.formula_no || 0);
        const listNo = byNo.get(no) || [];
        listNo.push(f);
        byNo.set(no, listNo);

        const normLatex = normalizeLatexComparisonKey(String(f.formula_latex || ''));
        if (normLatex) {
          const listLatex = byLatex.get(normLatex) || [];
          listLatex.push(f);
          byLatex.set(normLatex, listLatex);
        }
      }

      for (const [no, group] of byNo.entries()) {
        if (group.length > 1) {
          for (let i = 1; i < group.length; i++) {
            flaggedIds.add(String(group[i].id));
            duplicateFormulas.push({
              formula: group[i],
              duplicateOfId: String(group[0].id),
              chapter_id: chId,
              chapter_title: chTitle,
              category_name: catName,
              reason: `Duplicate formula_no #${no} (${group.length} formulas)`,
            });
          }
        }
      }

      for (const [, group] of byLatex.entries()) {
        if (group.length > 1) {
          for (let i = 1; i < group.length; i++) {
            if (!flaggedIds.has(String(group[i].id))) {
              flaggedIds.add(String(group[i].id));
              duplicateFormulas.push({
                formula: group[i],
                duplicateOfId: String(group[0].id),
                chapter_id: chId,
                chapter_title: chTitle,
                category_name: catName,
                reason: `Identical LaTeX expression (${group.length} copies)`,
              });
            }
          }
        }
      }

      const sortedForms = [...chFormulas].sort(
        (a, b) =>
          Number(a.formula_no || 0) - Number(b.formula_no || 0) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
      );
      sortedForms.forEach((f, idx) => {
        const expected = idx + 1;
        const actual = Number(f.formula_no || 0);
        if (actual !== expected && !flaggedIds.has(String(f.id))) {
          flaggedIds.add(String(f.id));
          duplicateFormulas.push({
            formula: f,
            duplicateOfId: String(f.id),
            chapter_id: chId,
            chapter_title: chTitle,
            category_name: catName,
            reason: `Non-sequential formula_no #${actual} (expected #${expected})`,
          });
        }
      });
    }

    const totalDuplicatesCount = duplicateFormulas.length + duplicateChapters.length;
    const liveFormulas = (forms as any[]).filter((f) => f.status === 'live').length;
    const draftFormulas = (forms as any[]).filter((f) => f.status === 'draft').length;

    const healthPayload = {
      ok:
        brokenFormulas.length === 0 &&
        emptyChapters.length === 0 &&
        totalDuplicatesCount === 0,
      totalCategories: cats.length,
      totalChapters: chaps.length,
      totalFormulas: forms.length,
      liveFormulas,
      draftFormulas,
      brokenFormulasCount: brokenFormulas.length,
      brokenLatexCount: brokenFormulas.length,
      emptyChaptersCount: emptyChapters.length,
      duplicateFormulasCount: totalDuplicatesCount,
      duplicateChaptersCount: duplicateChapters.length,
      duplicateNumbersCount: totalDuplicatesCount,
      openReportsCount,
      missingNoteCount: missingNoteFormulas.length,
      stalePdfCount: 0,
      brokenFormulas,
      brokenLatexFormulas: brokenFormulas,
      emptyChapters,
      duplicateFormulas,
      duplicateChapters,
      duplicateNumbers: duplicateFormulas,
      missingNoteFormulas: missingNoteFormulas.slice(0, 50),
      stalePdfChapters: [],
    };

    return jsonResponse(
      {
        success: true,
        ...healthPayload,
        health: healthPayload,
      },
      200,
      cors
    );
  }

  if (sub === '/health/fix' && method === 'POST') {
    if (!isAdmin) {
      return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const action = String(body.action || 'all');
    let fixedCount = 0;

    if (
      action === 'all' ||
      action === 'delete_empty_chapters' ||
      action === 'remove_empty_chapters'
    ) {
      const emptyRes = await env.DB.prepare(
        `SELECT id FROM chapters
         WHERE NOT EXISTS (SELECT 1 FROM formulas f WHERE f.chapter_id = chapters.id)`
      ).all();
      const emptyIds = (emptyRes.results || []).map((r: any) => String(r.id));
      if (emptyIds.length > 0) {
        const delStmts = emptyIds.map((id: string) =>
          env.DB.prepare('DELETE FROM chapters WHERE id = ?').bind(id)
        );
        await runBatchedD1(env.DB, delStmts);
        fixedCount += emptyIds.length;
      }
    }

    if (
      action === 'all' ||
      action === 'deduplicate' ||
      action === 'renumber' ||
      action === 'delete_empty_chapters' ||
      action === 'remove_empty_chapters'
    ) {
      const stats = await normalizeFormulaVaultD1Numbering(env.DB);
      fixedCount +=
        stats.fixedChapters + stats.removedDuplicateFormulas + stats.renumberedFormulas;
    }

    return jsonResponse(
      {
        success: true,
        fixedCount,
        message: `Normalized chapter & formula numbering and removed duplicates (${fixedCount} updates).`,
      },
      200,
      cors
    );
  }

  // ADMIN CRUD: Categories (/api/formulas/categories, /api/formulas/categories/:id, /api/formulas/categories/reorder)
  if (sub === '/categories' && method === 'POST') {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const name = String(body.name || '').trim();
    if (!name) return jsonResponse({ success: false, error: 'Category name is required.' }, 400, cors);
    const slug = buildFormulaSlug(name);
    const id = `cat_${slug}`;
    const description = String(body.description || '').trim();
    const status = body.status === 'draft' ? 'draft' : 'live';
    const guestAccess = body.guest_access === 0 || body.guest_access === false ? 0 : 1;
    const searchText = buildFormulaSearchText([name, slug, description]);
    await env.DB.prepare(
      `INSERT INTO categories (id, name, slug, description, sort_order, chapter_count, formula_count, status, guest_access, search_text)
       VALUES (?, ?, ?, ?, 99, 0, 0, ?, ?, ?)`
    )
      .bind(id, name, slug, description, status, guestAccess, searchText)
      .run();
    const category = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, category }, 201, cors);
  }

  if (sub === '/categories/reorder' && method === 'POST') {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const ids: string[] = Array.isArray(body.orderedIds) ? body.orderedIds : [];
    const stmts = ids.map((id, idx) =>
      env.DB.prepare('UPDATE categories SET sort_order = ? WHERE id = ?').bind(idx + 1, String(id))
    );
    if (stmts.length > 0) await env.DB.batch(stmts);
    return jsonResponse({ success: true }, 200, cors);
  }

  const catIdMatch = /^\/categories\/([^/]+)$/.exec(sub);
  if (catIdMatch && (method === 'PUT' || method === 'PATCH')) {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const catId = decodeURIComponent(catIdMatch[1]);
    const existing = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(catId).first();
    if (!existing) return jsonResponse({ success: false, error: 'Category not found.' }, 404, cors);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const name = body.name !== undefined ? String(body.name).trim() : String(existing.name);
    const description = body.description !== undefined ? String(body.description).trim() : String(existing.description || '');
    const status = body.status !== undefined ? (body.status === 'draft' ? 'draft' : 'live') : String(existing.status || 'live');
    const guestAccess =
      body.guest_access !== undefined
        ? body.guest_access === 0 || body.guest_access === false
          ? 0
          : 1
        : Number(existing.guest_access ?? 1);
    await env.DB.prepare(
      "UPDATE categories SET name = ?, description = ?, status = ?, guest_access = ?, updated_at = datetime('now') WHERE id = ?"
    )
      .bind(name, description, status, guestAccess, catId)
      .run();
    const category = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(catId).first();
    return jsonResponse({ success: true, category }, 200, cors);
  }

  if (catIdMatch && method === 'DELETE') {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const catId = decodeURIComponent(catIdMatch[1]);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM formulas WHERE category_id = ?').bind(catId),
      env.DB.prepare('DELETE FROM chapters WHERE category_id = ?').bind(catId),
      env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(catId),
    ]);
    return jsonResponse({ success: true }, 200, cors);
  }

  // ADMIN CRUD: Chapters (/api/formulas/chapters, /api/formulas/chapters/:id, /api/formulas/chapters/reorder)
  if (sub === '/chapters' && method === 'POST') {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const categoryId = String(body.category_id || '').trim();
    const rawTitle = String(body.title || '').trim();
    if (!categoryId || !rawTitle) {
      return jsonResponse({ success: false, error: 'category_id and title are required.' }, 400, cors);
    }
    const countRow = await env.DB.prepare('SELECT COUNT(*) AS cnt FROM chapters WHERE category_id = ?')
      .bind(categoryId)
      .first();
    const existingCount = Number((countRow as any)?.cnt || 0);
    const extracted = extractWorkerLeadingChapterNoAndTitle(rawTitle, Number(body.chapter_no || 0));
    const title = extracted.cleanTitle || rawTitle;
    const requestedNo =
      Number(body.chapter_no) > 0
        ? Number(body.chapter_no)
        : extracted.chapterNo || existingCount + 1;
    const subtopics = String(body.subtopics || '').trim();
    const status = body.status === 'draft' ? 'draft' : 'live';
    const slug = buildFormulaSlug(title);
    const id = `chap_${buildFormulaSlug(categoryId)}_${slug}_${Date.now().toString(36)}`;
    const searchText = buildFormulaSearchText([requestedNo, title, subtopics]);
    await env.DB.prepare(
      `INSERT INTO chapters (
        id, category_id, chapter_no, title, slug, subtopics, sort_order, formula_count, status, search_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
      .bind(id, categoryId, requestedNo, title, slug, subtopics, requestedNo, status, searchText)
      .run();
    await repositionChapterNumberD1(env.DB, categoryId, id, requestedNo);
    await recalculateFormulaVaultD1Counts(env.DB, categoryId);
    const chapter = await env.DB.prepare('SELECT * FROM chapters WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, chapter }, 201, cors);
  }

  if (sub === '/chapters/reorder' && method === 'POST') {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const ids: string[] = Array.isArray(body.orderedIds) ? body.orderedIds : [];
    const stmts = ids.map((id, idx) =>
      env.DB.prepare(
        "UPDATE chapters SET sort_order = ?, chapter_no = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(idx + 1, idx + 1, String(id))
    );
    if (stmts.length > 0) await runBatchedD1(env.DB, stmts);
    if (body.category_id) {
      await recalculateFormulaVaultD1Counts(env.DB, String(body.category_id));
    }
    return jsonResponse({ success: true }, 200, cors);
  }

  if (chapterMatch && (method === 'PUT' || method === 'PATCH')) {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const chapId = decodeURIComponent(chapterMatch[1]);
    const existing = await env.DB.prepare('SELECT * FROM chapters WHERE id = ?').bind(chapId).first();
    if (!existing) return jsonResponse({ success: false, error: 'Chapter not found.' }, 404, cors);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const rawTitle = body.title !== undefined ? String(body.title).trim() : String(existing.title);
    const extracted = extractWorkerLeadingChapterNoAndTitle(rawTitle, Number(existing.chapter_no || 1));
    const title = extracted.cleanTitle || rawTitle;
    const chapterNo =
      body.chapter_no !== undefined && Number.isFinite(Number(body.chapter_no))
        ? Math.max(1, Number(body.chapter_no))
        : Number(existing.chapter_no || 1);
    const subtopics =
      body.subtopics !== undefined ? String(body.subtopics).trim() : String(existing.subtopics || '');
    const status =
      body.status !== undefined
        ? body.status === 'draft'
          ? 'draft'
          : 'live'
        : String(existing.status || 'live');
    const searchText = buildFormulaSearchText([chapterNo, title, subtopics]);
    await env.DB.prepare(
      "UPDATE chapters SET chapter_no = ?, title = ?, subtopics = ?, status = ?, search_text = ?, updated_at = datetime('now') WHERE id = ?"
    )
      .bind(chapterNo, title, subtopics, status, searchText, chapId)
      .run();
    if (body.chapter_no !== undefined) {
      await repositionChapterNumberD1(env.DB, String(existing.category_id), chapId, chapterNo);
    }
    await recalculateFormulaVaultD1Counts(env.DB, String(existing.category_id));
    const chapter = await env.DB.prepare('SELECT * FROM chapters WHERE id = ?').bind(chapId).first();
    return jsonResponse({ success: true, chapter }, 200, cors);
  }

  if (chapterMatch && method === 'DELETE') {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const chapId = decodeURIComponent(chapterMatch[1]);
    const existing = await env.DB.prepare('SELECT * FROM chapters WHERE id = ?').bind(chapId).first();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM formulas WHERE chapter_id = ?').bind(chapId),
      env.DB.prepare('DELETE FROM chapters WHERE id = ?').bind(chapId),
    ]);
    if (existing?.category_id) {
      await normalizeFormulaVaultD1Numbering(env.DB, String(existing.category_id));
    }
    return jsonResponse({ success: true }, 200, cors);
  }

  // ADMIN CRUD: Formula Items (/api/formulas/items, /api/formulas/items/:id, /api/formulas/items/reorder)
  if (sub === '/items' && method === 'POST') {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const chapterId = String(body.chapter_id || '').trim();
    let categoryId = String(body.category_id || '').trim();
    const formulaLatex = String(body.formula_latex || '').trim();
    if (!chapterId || !formulaLatex) {
      return jsonResponse({ success: false, error: 'chapter_id and formula_latex are required.' }, 400, cors);
    }
    if (!categoryId) {
      const chapRow = await env.DB.prepare('SELECT category_id FROM chapters WHERE id = ?')
        .bind(chapterId)
        .first();
      categoryId = String((chapRow as any)?.category_id || '').trim();
    }
    if (!categoryId) {
      return jsonResponse({ success: false, error: 'Target chapter not found.' }, 404, cors);
    }
    const mathCheck = validateMath(formulaLatex);
    if (!mathCheck.valid) {
      return jsonResponse({ success: false, error: `Invalid LaTeX: ${mathCheck.error || 'syntax error'}` }, 400, cors);
    }
    const countRow = await env.DB.prepare('SELECT COUNT(*) AS cnt FROM formulas WHERE chapter_id = ?')
      .bind(chapterId)
      .first();
    const existingCount = Number((countRow as any)?.cnt || 0);
    const formulaNo =
      body.formula_no !== undefined && Number(body.formula_no) > 0
        ? Math.max(1, Number(body.formula_no))
        : existingCount + 1;
    const title = String(body.title || '').trim();
    const note = String(body.note || '').trim();
    const plainText = String(body.plain_text || body.formula_plain || formulaLatex).trim();
    const status = body.status === 'draft' ? 'draft' : 'live';
    const id = `form_${chapterId}_${formulaNo}_${Date.now().toString(36)}`;
    const searchText = buildFormulaSearchText([title, formulaLatex, plainText, note]);
    await env.DB.prepare(
      `INSERT INTO formulas (
        id, category_id, chapter_id, formula_no, title, formula_latex, plain_text, note, status, sort_order, is_render_valid, render_error, search_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '', ?)`
    )
      .bind(id, categoryId, chapterId, formulaNo, title, formulaLatex, plainText, note, status, formulaNo, searchText)
      .run();
    await repositionFormulaNumberD1(env.DB, chapterId, id, formulaNo);
    await recalculateFormulaVaultD1Counts(env.DB, categoryId);
    const formula = await env.DB.prepare('SELECT * FROM formulas WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, formula }, 201, cors);
  }

  if (sub === '/items/reorder' && method === 'POST') {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const ids: string[] = Array.isArray(body.orderedIds) ? body.orderedIds : [];
    const stmts = ids.map((id, idx) =>
      env.DB.prepare(
        "UPDATE formulas SET sort_order = ?, formula_no = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(idx + 1, idx + 1, String(id))
    );
    if (stmts.length > 0) await runBatchedD1(env.DB, stmts);
    return jsonResponse({ success: true }, 200, cors);
  }

  const itemMatch = /^\/items\/([^/]+)$/.exec(sub);
  if (itemMatch && (method === 'PUT' || method === 'PATCH')) {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const itemId = decodeURIComponent(itemMatch[1]);
    const existing = await env.DB.prepare('SELECT * FROM formulas WHERE id = ?').bind(itemId).first();
    if (!existing) return jsonResponse({ success: false, error: 'Formula not found.' }, 404, cors);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const formulaLatex =
      body.formula_latex !== undefined ? String(body.formula_latex).trim() : String(existing.formula_latex);
    const mathCheck = validateMath(formulaLatex);
    if (!mathCheck.valid) {
      return jsonResponse({ success: false, error: `Invalid LaTeX: ${mathCheck.error || 'syntax error'}` }, 400, cors);
    }
    const formulaNo =
      body.formula_no !== undefined && Number.isFinite(Number(body.formula_no))
        ? Math.max(1, Number(body.formula_no))
        : Number(existing.formula_no || 1);
    const title = body.title !== undefined ? String(body.title).trim() : String(existing.title || '');
    const note = body.note !== undefined ? String(body.note).trim() : String(existing.note || '');
    const plainText =
      body.plain_text !== undefined
        ? String(body.plain_text).trim()
        : body.formula_plain !== undefined
        ? String(body.formula_plain).trim()
        : String(existing.plain_text || formulaLatex);
    const status =
      body.status !== undefined
        ? body.status === 'draft'
          ? 'draft'
          : 'live'
        : String(existing.status || 'live');
    const chapterId =
      body.chapter_id !== undefined ? String(body.chapter_id).trim() : String(existing.chapter_id);
    const categoryId =
      body.category_id !== undefined ? String(body.category_id).trim() : String(existing.category_id);
    const searchText = buildFormulaSearchText([title, formulaLatex, plainText, note]);
    await env.DB.prepare(
      `UPDATE formulas
       SET category_id = ?, chapter_id = ?, formula_no = ?, title = ?, formula_latex = ?, plain_text = ?, note = ?, status = ?, search_text = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(categoryId, chapterId, formulaNo, title, formulaLatex, plainText, note, status, searchText, itemId)
      .run();
    if (body.formula_no !== undefined || chapterId !== String(existing.chapter_id)) {
      await repositionFormulaNumberD1(env.DB, chapterId, itemId, formulaNo);
      if (chapterId !== String(existing.chapter_id)) {
        await normalizeFormulaVaultD1Numbering(env.DB, String(existing.category_id));
      }
    }
    await recalculateFormulaVaultD1Counts(env.DB, categoryId);
    const formula = await env.DB.prepare('SELECT * FROM formulas WHERE id = ?').bind(itemId).first();
    return jsonResponse({ success: true, formula }, 200, cors);
  }

  if (itemMatch && method === 'DELETE') {
    if (!isAdmin) return jsonResponse({ success: false, error: 'Forbidden' }, user ? 403 : 401, cors);
    const itemId = decodeURIComponent(itemMatch[1]);
    const existing = await env.DB.prepare('SELECT * FROM formulas WHERE id = ?').bind(itemId).first();
    await env.DB.prepare('DELETE FROM formulas WHERE id = ?').bind(itemId).run();
    if (existing?.category_id) {
      await normalizeFormulaVaultD1Numbering(env.DB, String(existing.category_id));
    }
    return jsonResponse({ success: true }, 200, cors);
  }

  // POST /api/formulas/import-chunk (Admin) — Batched D1 writes (<500 limit) + live count update
  if (sub === '/import-chunk' && method === 'POST') {
    if (!isAdmin) {
      return jsonResponse({ success: false, error: 'Forbidden: Admin access required.' }, user ? 403 : 401, cors);
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const categoryId = String(body.category_id ?? body.categoryId ?? '').trim();
    const defaultChapterId = String(body.default_chapter_id ?? body.defaultChapterId ?? '').trim();
    const duplicateStrategy: 'skip' | 'update' =
      String(body.duplicate_strategy ?? body.duplicateStrategy ?? 'skip').toLowerCase() === 'update'
        ? 'update'
        : 'skip';
    const chunkOffset = Math.max(0, Number(body.chunk_offset ?? body.chunkOffset ?? 0));
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const rawCsvText = typeof body.raw_csv_text === 'string' ? body.raw_csv_text : '';
    const fileName = String(body.file_name ?? 'bulk_import.csv').trim();
    const sourceType = String(body.source_type ?? 'csv').trim();

    const cat = await env.DB.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?')
      .bind(categoryId, categoryId.toLowerCase())
      .first();
    if (!cat) {
      return jsonResponse({ success: false, error: 'Target category not found.' }, 404, cors);
    }

    let csvR2Key = '';
    if (chunkOffset === 0 && rawCsvText && env.R2_BUCKET) {
      csvR2Key = `formulas/imports/${cat.slug}_${Date.now()}_${buildFormulaSlug(fileName)}.csv`;
      await env.R2_BUCKET.put(csvR2Key, rawCsvText, {
        httpMetadata: { contentType: 'text/csv; charset=utf-8' },
      }).catch(() => {});
    }

    // Preload all chapters and formulas for this category in 2 fast SELECT queries
    const [existingChRes, existingFormRes] = await Promise.all([
      env.DB.prepare(
        'SELECT * FROM chapters WHERE category_id = ? ORDER BY CAST(chapter_no AS INTEGER) ASC, sort_order ASC'
      )
        .bind(String(cat.id))
        .all(),
      env.DB.prepare('SELECT id, chapter_id, formula_no, formula_latex FROM formulas WHERE category_id = ?')
        .bind(String(cat.id))
        .all(),
    ]);

    const catChapters: any[] = [...(existingChRes.results || [])];
    const catFormulas: any[] = [...(existingFormRes.results || [])];

    const defaultChapterObj = defaultChapterId
      ? catChapters.find(
          (c) =>
            String(c.id) === defaultChapterId ||
            String(c.slug || '').toLowerCase() === defaultChapterId.toLowerCase() ||
            normalizeWorkerChapterMatchKey(String(c.title || '')) ===
              normalizeWorkerChapterMatchKey(defaultChapterId)
        )
      : catChapters[0] || null;

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const rowErrors: Array<{ rowNumber: number; reason: string }> = [];
    const writeStmts: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const rowNum = Number(r.rowNumber ?? r.rowIndex ?? chunkOffset + i + 1);
      const rawLatex = String(r.formula_latex ?? r.formulaLatex ?? r.latex ?? r.formula ?? '').trim();
      const rawTitle = String(r.title ?? r.name ?? '').trim();
      const rawNote = String(r.note ?? r.notes ?? r.explanation ?? '').trim();
      const rawChapterInput = String(
        r.chapter_id ?? r.chapterId ?? r.chapter ?? r.chapter_title ?? ''
      ).trim();
      const rawSubtopics = String(r.subtopics ?? '').trim();
      const rawChapterNo = Number(r.chapter_no ?? r.chapterNo ?? 0);
      const rawFormulaNo = Number(r.formula_no ?? r.formulaNo ?? 0);

      if (!rawLatex) {
        rowErrors.push({ rowNumber: rowNum, reason: 'Missing formula_latex' });
        continue;
      }
      const mathCheck = validateMath(rawLatex);
      if (!mathCheck.valid) {
        rowErrors.push({
          rowNumber: rowNum,
          reason: `Broken LaTeX: ${mathCheck.error || 'syntax error'}`,
        });
        continue;
      }

      const extracted = extractWorkerLeadingChapterNoAndTitle(rawChapterInput, rawChapterNo);
      const cleanChapterTitle = extracted.cleanTitle || String(defaultChapterObj?.title || '').trim();
      const effectiveChapterNo =
        extracted.chapterNo || (Number.isFinite(rawChapterNo) && rawChapterNo > 0 ? rawChapterNo : 0);

      let chapter: any = null;
      if (rawChapterInput) {
        const targetKey = normalizeWorkerChapterMatchKey(cleanChapterTitle);
        const targetSlug = buildFormulaSlug(cleanChapterTitle);
        chapter = catChapters.find(
          (ch) =>
            String(ch.id) === rawChapterInput ||
            String(ch.title || '').toLowerCase() === cleanChapterTitle.toLowerCase() ||
            normalizeWorkerChapterMatchKey(String(ch.title || '')) === targetKey ||
            String(ch.slug || '').toLowerCase() === targetSlug ||
            (effectiveChapterNo > 0 &&
              Number(ch.chapter_no) === effectiveChapterNo &&
              (!targetKey || normalizeWorkerChapterMatchKey(String(ch.title || '')) === targetKey))
        );
        if (!chapter && cleanChapterTitle) {
          const maxChapNo = catChapters.reduce((m, c) => Math.max(m, Number(c.chapter_no || 0)), 0);
          const newChNo = effectiveChapterNo > 0 ? effectiveChapterNo : maxChapNo + 1;
          const slug = buildFormulaSlug(cleanChapterTitle);
          const newChId = `chap_${cat.slug}_${slug}_${Date.now().toString(36)}_${i}`;
          const searchText = buildFormulaSearchText([cat.name, newChNo, cleanChapterTitle, rawSubtopics]);
          writeStmts.push(
            env.DB.prepare(
              `INSERT INTO chapters (
                id, category_id, chapter_no, slug, title, subtopics, formula_count, sort_order, status, search_text
              ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'live', ?)`
            ).bind(
              String(newChId),
              String(cat.id),
              Number(newChNo),
              String(slug),
              String(cleanChapterTitle),
              String(rawSubtopics || ''),
              Number(newChNo),
              String(searchText || '')
            )
          );
          chapter = {
            id: newChId,
            category_id: String(cat.id),
            title: cleanChapterTitle,
            subtopics: rawSubtopics || '',
            chapter_no: newChNo,
            slug,
          };
          catChapters.push(chapter);
        }
      } else if (defaultChapterObj) {
        chapter = defaultChapterObj;
      }

      if (!chapter) {
        rowErrors.push({
          rowNumber: rowNum,
          reason: 'Missing chapter and no default chapter selected',
        });
        continue;
      }

      const chapFormulas = catFormulas.filter((f) => String(f.chapter_id) === String(chapter.id));
      const maxFormulaNo = chapFormulas.reduce((m, f) => Math.max(m, Number(f.formula_no || 0)), 0);
      const formulaNo = Number.isFinite(rawFormulaNo) && rawFormulaNo > 0 ? rawFormulaNo : maxFormulaNo + 1;

      const existingDup = chapFormulas.find(
        (f) =>
          Number(f.formula_no) === formulaNo ||
          String(f.formula_latex || '').trim().toLowerCase() === rawLatex.toLowerCase()
      );

      const searchText = buildFormulaSearchText([
        cat.name,
        chapter.title,
        chapter.subtopics,
        rawTitle,
        rawLatex,
        rawNote,
      ]);

      if (existingDup) {
        if (duplicateStrategy === 'skip') {
          skippedCount += 1;
          continue;
        }
        writeStmts.push(
          env.DB.prepare(
            `UPDATE formulas
             SET category_id = ?, chapter_id = ?, formula_no = ?, title = ?, formula_latex = ?, plain_text = ?, note = ?, search_text = ?, updated_at = datetime('now')
             WHERE id = ?`
          ).bind(
            String(cat.id),
            String(chapter.id),
            Number(formulaNo),
            String(rawTitle || ''),
            String(rawLatex),
            String(rawLatex),
            String(rawNote || ''),
            String(searchText || ''),
            String(existingDup.id)
          )
        );
        existingDup.formula_no = formulaNo;
        existingDup.formula_latex = rawLatex;
        updatedCount += 1;
      } else {
        const newId = `form_${chapter.id}_${formulaNo}_${Date.now().toString(36)}_${i}`;
        writeStmts.push(
          env.DB.prepare(
            `INSERT INTO formulas (
              id, category_id, chapter_id, formula_no, title, formula_latex, plain_text, note, status, sort_order, is_render_valid, render_error, search_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'live', ?, 1, '', ?)`
          ).bind(
            String(newId),
            String(cat.id),
            String(chapter.id),
            Number(formulaNo),
            String(rawTitle || ''),
            String(rawLatex),
            String(rawLatex),
            String(rawNote || ''),
            Number(formulaNo),
            String(searchText || '')
          )
        );
        catFormulas.push({
          id: newId,
          chapter_id: String(chapter.id),
          formula_no: formulaNo,
          formula_latex: rawLatex,
        });
        importedCount += 1;
      }
    }

    // Execute batched writes in chunks of 50 statements (well under 500-write limit)
    for (let i = 0; i < writeStmts.length; i += 50) {
      await env.DB.batch(writeStmts.slice(i, i + 50));
    }

    // Refresh numbering and live chapter/category formula counts immediately
    await normalizeFormulaVaultD1Numbering(env.DB, String(cat.id));

    await env.DB.prepare(
      `INSERT INTO import_logs (
        id, category_id, chapter_id, admin_uid, source_type, file_name, csv_r2_key, duplicate_strategy, total_rows, imported_rows, updated_rows, skipped_rows, failed_rows, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`
    )
      .bind(
        `fimp_${Date.now()}_${crypto.randomUUID().slice(0, 5)}`,
        String(cat.id),
        String(defaultChapterObj?.id || ''),
        String(user?.uid || 'admin'),
        String(sourceType || 'csv'),
        String(fileName || 'bulk_import.csv'),
        String(csvR2Key || ''),
        String(duplicateStrategy || 'skip'),
        Number(rows.length),
        Number(importedCount),
        Number(updatedCount),
        Number(skippedCount),
        Number(rowErrors.length)
      )
      .run()
      .catch(() => {});

    return jsonResponse(
      {
        success: true,
        importedCount,
        updatedCount,
        skippedCount,
        failedCount: rowErrors.length,
        errors: rowErrors,
        csvR2Key,
      },
      200,
      cors
    );
  }

  return jsonResponse({ success: false, error: 'Formula endpoint not found' }, 404, cors);
}

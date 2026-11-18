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

let formulaSchemaEnsured = false;

async function ensureFormulaVaultD1SchemaAndSeed(db: any): Promise<void> {
  if (formulaSchemaEnsured) return;
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS formula_categories (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          icon TEXT NOT NULL DEFAULT 'Sigma',
          sort_order INTEGER NOT NULL DEFAULT 0,
          chapter_count INTEGER NOT NULL DEFAULT 0,
          formula_count INTEGER NOT NULL DEFAULT 0,
          guest_access INTEGER NOT NULL DEFAULT 1,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS formula_chapters (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          chapter_no INTEGER NOT NULL DEFAULT 1,
          slug TEXT NOT NULL,
          title TEXT NOT NULL,
          subtopics TEXT NOT NULL DEFAULT '',
          formula_count INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'live',
          pdf_r2_key TEXT,
          pdf_generated_at TEXT,
          search_text TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS formula_items (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          formula_no INTEGER NOT NULL DEFAULT 1,
          title TEXT NOT NULL DEFAULT '',
          formula_latex TEXT NOT NULL,
          formula_plain TEXT NOT NULL DEFAULT '',
          note TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'live',
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_featured INTEGER NOT NULL DEFAULT 0,
          search_text TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS formula_bookmarks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_uid TEXT NOT NULL,
          formula_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(user_uid, formula_id)
        )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS formula_reports (
          id TEXT PRIMARY KEY,
          formula_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          reporter_uid TEXT NOT NULL DEFAULT 'guest',
          reporter_email TEXT NOT NULL DEFAULT '',
          reason TEXT NOT NULL DEFAULT 'incorrect_formula',
          details TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'open',
          resolved_by TEXT,
          resolved_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS formula_import_logs (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          category_name TEXT NOT NULL DEFAULT '',
          admin_uid TEXT NOT NULL,
          admin_email TEXT NOT NULL DEFAULT '',
          source_type TEXT NOT NULL DEFAULT 'csv',
          file_name TEXT NOT NULL DEFAULT '',
          csv_r2_key TEXT,
          duplicate_strategy TEXT NOT NULL DEFAULT 'skip',
          total_rows INTEGER NOT NULL DEFAULT 0,
          imported_count INTEGER NOT NULL DEFAULT 0,
          updated_count INTEGER NOT NULL DEFAULT 0,
          skipped_count INTEGER NOT NULL DEFAULT 0,
          failed_count INTEGER NOT NULL DEFAULT 0,
          errors_json TEXT NOT NULL DEFAULT '[]',
          created_at TEXT DEFAULT (datetime('now'))
        )`
      )
      .run();

    const existingCat = await db
      .prepare('SELECT COUNT(*) AS cnt FROM formula_categories')
      .first<{ cnt: number }>()
      .catch(() => ({ cnt: 0 }));

    if (!existingCat || Number(existingCat.cnt || 0) === 0) {
      const stmts: any[] = [];
      for (const c of FORMULA_VAULT_CATEGORIES_SEED) {
        stmts.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO formula_categories (
                id, slug, name, description, icon, sort_order, chapter_count, formula_count, guest_access, is_active, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              c.id,
              c.slug,
              c.name,
              c.description,
              c.icon,
              c.sort_order,
              c.chapter_count,
              c.formula_count,
              c.guest_access,
              c.is_active,
              c.created_at,
              c.updated_at
            )
        );
      }
      for (const ch of FORMULA_VAULT_CHAPTERS_SEED) {
        stmts.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO formula_chapters (
                id, category_id, chapter_no, slug, title, subtopics, formula_count, sort_order, status, pdf_r2_key, pdf_generated_at, search_text, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              ch.id,
              ch.category_id,
              ch.chapter_no,
              ch.slug,
              ch.title,
              ch.subtopics,
              ch.formula_count,
              ch.sort_order,
              ch.status,
              ch.pdf_r2_key,
              ch.pdf_generated_at,
              ch.search_text,
              ch.created_at,
              ch.updated_at
            )
        );
      }
      for (const f of FORMULA_VAULT_ITEMS_SEED) {
        stmts.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO formula_items (
                id, category_id, chapter_id, formula_no, title, formula_latex, formula_plain, note, status, sort_order, is_featured, search_text, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              f.id,
              f.category_id,
              f.chapter_id,
              f.formula_no,
              f.title,
              f.formula_latex,
              f.formula_plain,
              f.note,
              f.status,
              f.sort_order,
              f.is_featured,
              f.search_text,
              f.created_at,
              f.updated_at
            )
        );
      }
      for (let i = 0; i < stmts.length; i += 50) {
        await db.batch(stmts.slice(i, i + 50));
      }
    }
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

  // GET /api/formulas/overview
  if (sub === '/overview' && method === 'GET') {
    const includeDrafts = url.searchParams.get('include_drafts') === '1' && isAdmin;
    const catRes = await env.DB.prepare(
      includeDrafts
        ? 'SELECT * FROM formula_categories ORDER BY sort_order ASC, name ASC'
        : 'SELECT * FROM formula_categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC'
    ).all();
    const chRes = await env.DB.prepare(
      includeDrafts
        ? 'SELECT * FROM formula_chapters ORDER BY sort_order ASC, chapter_no ASC'
        : "SELECT * FROM formula_chapters WHERE status = 'live' ORDER BY sort_order ASC, chapter_no ASC"
    ).all();
    const featuredRes = await env.DB.prepare(
      "SELECT * FROM formula_items WHERE status = 'live' ORDER BY is_featured DESC, sort_order ASC LIMIT 25"
    ).all();

    const featuredPool = featuredRes.results || [];
    const daySeed = Math.floor(Date.now() / 86_400_000);
    const fotdItem = featuredPool.length > 0 ? featuredPool[daySeed % featuredPool.length] : null;
    const categories = catRes.results || [];
    const chapters = chRes.results || [];

    const fotdChapter = fotdItem ? chapters.find((c: any) => c.id === fotdItem.chapter_id) : null;
    const fotdCategory = fotdItem ? categories.find((c: any) => c.id === fotdItem.category_id) : null;

    let bookmarkedIds: string[] = [];
    if (user?.uid) {
      const bmRes = await env.DB.prepare(
        'SELECT formula_id FROM formula_bookmarks WHERE user_uid = ? ORDER BY created_at DESC'
      )
        .bind(user.uid)
        .all()
        .catch(() => ({ results: [] }));
      bookmarkedIds = (bmRes.results || []).map((r: any) => String(r.formula_id));
    }

    const cacheHeader = !user && !includeDrafts
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
    const pageSize = Math.min(200, Math.max(10, Number(url.searchParams.get('page_size') || 100)));
    const offset = (page - 1) * pageSize;

    const chapter = await env.DB.prepare('SELECT * FROM formula_chapters WHERE id = ? OR slug = ?')
      .bind(chapterId, chapterId.toLowerCase())
      .first();

    if (!chapter || (!includeDrafts && chapter.status !== 'live')) {
      return jsonResponse({ success: false, error: 'Chapter not found.' }, 404, cors);
    }

    const category = await env.DB.prepare('SELECT * FROM formula_categories WHERE id = ?')
      .bind(chapter.category_id)
      .first();

    const itemsRes = await env.DB.prepare(
      includeDrafts
        ? 'SELECT * FROM formula_items WHERE chapter_id = ? ORDER BY sort_order ASC, formula_no ASC LIMIT ? OFFSET ?'
        : "SELECT * FROM formula_items WHERE chapter_id = ? AND status = 'live' ORDER BY sort_order ASC, formula_no ASC LIMIT ? OFFSET ?"
    )
      .bind(chapter.id, pageSize, offset)
      .all();

    const cacheHeader = !user && !includeDrafts
      ? 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
      : 'private, no-cache';

    const formulas = itemsRes.results || [];
    return jsonResponse(
      {
        success: true,
        chapter,
        category,
        formulas,
        total: formulas.length,
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
        ? "SELECT * FROM formula_chapters WHERE status = 'live' AND category_id = ? AND search_text LIKE ? ORDER BY sort_order ASC LIMIT 25"
        : "SELECT * FROM formula_chapters WHERE status = 'live' AND search_text LIKE ? ORDER BY sort_order ASC LIMIT 25"
    )
      .bind(...(categoryId ? [categoryId, likePattern] : [likePattern]))
      .all();

    const fRes = await env.DB.prepare(
      categoryId
        ? "SELECT * FROM formula_items WHERE status = 'live' AND category_id = ? AND search_text LIKE ? ORDER BY sort_order ASC LIMIT 60"
        : "SELECT * FROM formula_items WHERE status = 'live' AND search_text LIKE ? ORDER BY sort_order ASC LIMIT 60"
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

  // POST /api/formulas/bookmarks/toggle
  if (sub === '/bookmarks/toggle' && method === 'POST') {
    if (!user?.uid) {
      return jsonResponse({ success: false, error: 'Sign in required to save bookmarks.' }, 401, cors);
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const formulaId = String(body.formula_id || body.formulaId || '').trim();
    const formula = await env.DB.prepare('SELECT * FROM formula_items WHERE id = ?').bind(formulaId).first();
    if (!formula) {
      return jsonResponse({ success: false, error: 'Formula not found.' }, 404, cors);
    }
    const existing = await env.DB.prepare(
      'SELECT id FROM formula_bookmarks WHERE user_uid = ? AND formula_id = ?'
    )
      .bind(user.uid, formulaId)
      .first();

    if (existing) {
      await env.DB.prepare('DELETE FROM formula_bookmarks WHERE user_uid = ? AND formula_id = ?')
        .bind(user.uid, formulaId)
        .run();
    } else {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO formula_bookmarks (user_uid, formula_id, category_id, chapter_id) VALUES (?, ?, ?, ?)'
      )
        .bind(user.uid, formulaId, formula.category_id, formula.chapter_id)
        .run();
    }
    const allBm = await env.DB.prepare('SELECT formula_id FROM formula_bookmarks WHERE user_uid = ?')
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
    const formula = await env.DB.prepare('SELECT * FROM formula_items WHERE id = ?').bind(formulaId).first();
    if (!formula) {
      return jsonResponse({ success: false, error: 'Formula not found.' }, 404, cors);
    }
    const id = `frep_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    await env.DB.prepare(
      `INSERT INTO formula_reports (
        id, formula_id, category_id, chapter_id, reporter_uid, reporter_email, reason, details, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`
    )
      .bind(
        id,
        formula.id,
        formula.category_id,
        formula.chapter_id,
        user?.uid || 'guest',
        user?.email || '',
        reason,
        details
      )
      .run();
    return jsonResponse({ success: true, reportId: id }, 201, cors);
  }

  // POST /api/formulas/import-chunk (Admin)
  if (sub === '/import-chunk' && method === 'POST') {
    if (!isAdmin) {
      return jsonResponse({ success: false, error: 'Forbidden: Admin access required.' }, user ? 403 : 401, cors);
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const categoryId = String(body.category_id || body.categoryId || '').trim();
    const defaultChapterId = String(body.default_chapter_id || body.defaultChapterId || '').trim();
    const duplicateStrategy: 'skip' | 'update' =
      String(body.duplicate_strategy || body.duplicateStrategy || 'skip').toLowerCase() === 'update'
        ? 'update'
        : 'skip';
    const chunkOffset = Math.max(0, Number(body.chunk_offset ?? body.chunkOffset ?? 0));
    const rows = Array.isArray(body.rows) ? body.rows : [];

    const cat = await env.DB.prepare('SELECT * FROM formula_categories WHERE id = ? OR slug = ?')
      .bind(categoryId, categoryId.toLowerCase())
      .first();
    if (!cat) {
      return jsonResponse({ success: false, error: 'Target category not found.' }, 404, cors);
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const rowErrors: Array<{ rowNumber: number; reason: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = chunkOffset + i + 1;
      const r = rows[i] || {};
      const rawLatex = String(r.formula_latex ?? r.formulaLatex ?? r.latex ?? r.formula ?? '').trim();
      const rawTitle = String(r.title ?? r.name ?? '').trim();
      const rawNote = String(r.note ?? r.notes ?? r.explanation ?? '').trim();
      const rawChapterTitle = String(r.chapter ?? r.chapter_title ?? '').trim();
      const rawSubtopics = String(r.subtopics ?? '').trim();
      const rawChapterNo = Number(r.chapter_no ?? r.chapterNo ?? 0);
      const rawFormulaNo = Number(r.formula_no ?? r.formulaNo ?? 0);

      if (!rawLatex) {
        rowErrors.push({ rowNumber: rowNum, reason: 'Missing formula_latex' });
        continue;
      }
      const mathCheck = validateMath(rawLatex);
      if (!mathCheck.valid) {
        rowErrors.push({ rowNumber: rowNum, reason: `Broken LaTeX: ${mathCheck.error || 'syntax error'}` });
        continue;
      }

      let chapter: any = null;
      if (rawChapterTitle) {
        chapter = await env.DB.prepare(
          'SELECT * FROM formula_chapters WHERE category_id = ? AND LOWER(title) = ?'
        )
          .bind(cat.id, rawChapterTitle.toLowerCase())
          .first();
        if (!chapter) {
          const newChId = `fch_${cat.slug}_${Date.now()}_${i}`;
          const newChNo = rawChapterNo > 0 ? rawChapterNo : 1;
          const slug = buildFormulaSlug(rawChapterTitle);
          const searchText = buildFormulaSearchText([cat.name, rawChapterTitle, rawSubtopics]);
          await env.DB.prepare(
            `INSERT INTO formula_chapters (
              id, category_id, chapter_no, slug, title, subtopics, formula_count, sort_order, status, search_text
            ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'live', ?)`
          )
            .bind(newChId, cat.id, newChNo, slug, rawChapterTitle, rawSubtopics, newChNo, searchText)
            .run();
          chapter = { id: newChId, title: rawChapterTitle, subtopics: rawSubtopics, chapter_no: newChNo };
        }
      } else if (defaultChapterId) {
        chapter = await env.DB.prepare('SELECT * FROM formula_chapters WHERE id = ? AND category_id = ?')
          .bind(defaultChapterId, cat.id)
          .first();
      }

      if (!chapter) {
        rowErrors.push({ rowNumber: rowNum, reason: 'Missing chapter and no default chapter selected' });
        continue;
      }

      const formulaNo = rawFormulaNo > 0 ? rawFormulaNo : i + 1;
      const existingDup = await env.DB.prepare(
        'SELECT id FROM formula_items WHERE chapter_id = ? AND (formula_no = ? OR LOWER(formula_latex) = ?)'
      )
        .bind(chapter.id, formulaNo, rawLatex.toLowerCase())
        .first();

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
        await env.DB.prepare(
          `UPDATE formula_items
           SET formula_no = ?, title = ?, formula_latex = ?, note = ?, search_text = ?, updated_at = datetime('now')
           WHERE id = ?`
        )
          .bind(formulaNo, rawTitle, rawLatex, rawNote, searchText, existingDup.id)
          .run();
        updatedCount += 1;
      } else {
        const newId = `f_${chapter.id}_${Date.now()}_${i}`;
        await env.DB.prepare(
          `INSERT INTO formula_items (
            id, category_id, chapter_id, formula_no, title, formula_latex, formula_plain, note, status, sort_order, is_featured, search_text
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'live', ?, 0, ?)`
        )
          .bind(newId, cat.id, chapter.id, formulaNo, rawTitle, rawLatex, rawLatex, rawNote, formulaNo, searchText)
          .run();
        importedCount += 1;
      }
    }

    return jsonResponse(
      {
        success: true,
        importedCount,
        updatedCount,
        skippedCount,
        failedCount: rowErrors.length,
        errors: rowErrors,
      },
      200,
      cors
    );
  }

  return jsonResponse({ success: false, error: 'Formula endpoint not found' }, 404, cors);
}

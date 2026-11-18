import { BALANCED_MCQ_POOL, type BalancedSeedQuestion } from '../../../src/data/seedBalancedPool';
import type { Env } from '../../../cloudflare/worker';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      count?: number;
      subject?: string;
      chapter?: string;
      university?: string;
      excludeIds?: string[];
      batchIndex?: number;
    };

    const count = Math.min(Math.max(Number(body.count) || 5, 1), 20);
    const subject = String(body.subject || 'All').trim();
    const chapter = String(body.chapter || '').trim();
    const university = String(body.university || '').trim();
    const excludeIds = new Set(Array.isArray(body.excludeIds) ? body.excludeIds : []);

    let pool: BalancedSeedQuestion[] = [...BALANCED_MCQ_POOL];

    // Query D1 university_mcqs if bound on Cloudflare Pages
    if (env?.DB && typeof env.DB.prepare === 'function') {
      try {
        const d1Res = await env.DB.prepare(
          `SELECT id, subject, topic, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty
           FROM university_mcqs
           LIMIT 200`
        ).all();
        const rows = Array.isArray(d1Res?.results) ? d1Res.results : [];
        if (rows.length > 0) {
          const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
          const d1Questions: BalancedSeedQuestion[] = rows.map((r: Record<string, unknown>) => {
            const ansLetter = String(r.correct_answer || 'A').toUpperCase();
            const correctIdx = letterMap[ansLetter] ?? 0;
            const qText = String(r.question || '');
            const expText = String(r.explanation || '');
            const diffRaw = String(r.difficulty || 'medium').toLowerCase();
            const diff: 'Easy' | 'Medium' | 'Hard' =
              diffRaw === 'easy' ? 'Easy' : diffRaw === 'hard' ? 'Hard' : 'Medium';
            return {
              id: String(r.id || ''),
              subject: String(r.subject || subject || 'General'),
              chapter: String(r.topic || chapter || ''),
              topic: String(r.topic || chapter || ''),
              university: university || 'FAST-NUCES',
              difficulty: diff,
              q: qText,
              question: qText,
              options: [
                String(r.option_a || 'A'),
                String(r.option_b || 'B'),
                String(r.option_c || 'C'),
                String(r.option_d || 'D'),
              ],
              correct: correctIdx,
              correctAnswer: correctIdx,
              explain: expText,
              explanation: expText,
            };
          });
          pool = [...d1Questions, ...pool];
        }
      } catch {
        // Fall back to BALANCED_MCQ_POOL if D1 table is unavailable
      }
    }

    let candidates = pool.filter((q) => {
      if (excludeIds.has(q.id)) return false;
      if (subject && subject !== 'All' && subject !== 'General') {
        if (q.subject && !q.subject.toLowerCase().includes(subject.toLowerCase())) return false;
      }
      if (chapter && chapter !== 'All') {
        const cLower = chapter.toLowerCase();
        const qChapter = (q.chapter || '').toLowerCase();
        const qTopic = (q.topic || '').toLowerCase();
        if (!qChapter.includes(cLower) && !qTopic.includes(cLower)) return false;
      }
      return true;
    });

    if (candidates.length < count && subject && subject !== 'All' && subject !== 'General') {
      const subjectPool = pool.filter((q) => {
        if (excludeIds.has(q.id)) return false;
        return q.subject && q.subject.toLowerCase().includes(subject.toLowerCase());
      });
      candidates = [...candidates, ...subjectPool];
    }

    if (candidates.length < count) {
      const generalPool = pool.filter((q) => !excludeIds.has(q.id));
      candidates = [...candidates, ...generalPool];
    }

    const uniqueMap = new Map<string, BalancedSeedQuestion>();
    for (const c of candidates) {
      if (!uniqueMap.has(c.id)) uniqueMap.set(c.id, c);
    }
    const uniqueList = Array.from(uniqueMap.values());
    const shuffled = uniqueList.sort(() => 0.5 - Math.random());
    const selectedRaw = shuffled.slice(0, count);

    const selected = selectedRaw.map((q) => ({
      id: q.id,
      q: q.q || q.question || '',
      options:
        Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'],
      correct: typeof q.correct === 'number' ? q.correct : (q.correctAnswer ?? 0),
      explain: q.explain || q.explanation || '',
      subject: q.subject || subject || 'General',
      chapter: q.chapter || q.topic || chapter || '',
      difficulty: q.difficulty || 'Medium',
      university: q.university || university || 'FAST-NUCES',
    }));

    return new Response(
      JSON.stringify({
        success: true,
        questions: selected,
        count: selected.length,
        batchIndex: Number(body.batchIndex) || 0,
        hasMore: uniqueList.length > count,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error generating test batch';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

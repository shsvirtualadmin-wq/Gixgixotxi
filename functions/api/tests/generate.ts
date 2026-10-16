import { BALANCED_500_QUESTIONS } from '../../../src/data/seedBalancedPool';

interface RequestBody {
  batchIndex?: number;
  count?: number;
  subject?: string;
  chapter?: string;
  university?: string;
  excludeIds?: string[];
}

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const body = (await context.request.json()) as RequestBody;
    const count = Math.min(Math.max(Number(body.count) || 5, 1), 20);
    const subject = (body.subject || 'All').trim();
    const chapter = (body.chapter || '').trim();
    const university = (body.university || '').trim();
    const excludeIds = new Set(Array.isArray(body.excludeIds) ? body.excludeIds : []);

    // Filter from balanced question pool
    let candidates = BALANCED_500_QUESTIONS.filter((q) => {
      if (excludeIds.has(q.id)) return false;
      if (subject && subject !== 'All' && subject !== 'General') {
        if (q.subject && !q.subject.toLowerCase().includes(subject.toLowerCase())) return false;
      }
      if (chapter && chapter !== 'All') {
        const cLower = chapter.toLowerCase();
        const qChapter = (q.chapter || '').toLowerCase();
        if (!qChapter.includes(cLower)) return false;
      }
      return true;
    });

    // If not enough questions, loosen chapter filter to subject
    if (candidates.length < count && subject && subject !== 'All' && subject !== 'General') {
      const subjectPool = BALANCED_500_QUESTIONS.filter((q) => {
        if (excludeIds.has(q.id)) return false;
        return q.subject && q.subject.toLowerCase().includes(subject.toLowerCase());
      });
      candidates = [...candidates, ...subjectPool];
    }

    // Fall back to general pool if still needed
    if (candidates.length < count) {
      const generalPool = BALANCED_500_QUESTIONS.filter((q) => !excludeIds.has(q.id));
      candidates = [...candidates, ...generalPool];
    }

    // Deduplicate
    const uniqueMap = new Map<string, (typeof BALANCED_500_QUESTIONS)[0]>();
    for (const c of candidates) {
      if (!uniqueMap.has(c.id)) uniqueMap.set(c.id, c);
    }
    const uniqueList = Array.from(uniqueMap.values());

    // Shuffle & slice
    const shuffled = uniqueList.sort(() => 0.5 - Math.random());
    const selectedRaw = shuffled.slice(0, count);

    const questions = selectedRaw.map((q) => ({
      id: q.id,
      q: q.question || (q as any).q || '',
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'],
      correct: typeof q.correctAnswer === 'number' ? q.correctAnswer : (q as any).correct ?? 0,
      explain: q.explanation || (q as any).explain || '',
      subject: q.subject || subject || 'General',
      chapter: q.chapter || chapter || '',
      difficulty: q.difficulty || 'Medium',
      university: (q as any).university || university || 'FAST-NUCES',
    }));

    return new Response(
      JSON.stringify({
        success: true,
        questions,
        count: questions.length,
        batchIndex: Number(body.batchIndex) || 0,
        hasMore: uniqueList.length > count,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const snippet = errorMsg.slice(0, 200);
    return new Response(
      JSON.stringify({ error: errorMsg, code: 'TEST_GEN_ERROR', snippet }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

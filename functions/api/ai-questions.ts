interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  VITE_FIREBASE_API_KEY?: string;
  FIREBASE_API_KEY?: string;
}

interface RequestBody {
  mode: 'generate' | 'extract';
  subject?: string;
  chapter?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  style?: string; // e.g. "FAST", "NUST", "MDCAT"
  // For extract mode:
  fileBase64?: string;
  fileMimeType?: string;
  extractedText?: string;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(adminKey: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(adminKey);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(adminKey, { count: 1, resetAt: now + 3600 * 1000 });
    return true;
  }
  if (entry.count >= 20) {
    return false;
  }
  entry.count += 1;
  return true;
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

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  const apiKey = context.env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        success: false,
        notConfigured: true,
        message: "AI import isn't set up yet",
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // Rate limit by IP or Auth header
  const authHeader = context.request.headers.get('Authorization') || '';
  const clientKey = authHeader ? authHeader.slice(-16) : 'admin-generic';
  if (!checkRateLimit(clientKey)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit reached (maximum 20 AI import requests per hour). Please try again later.',
      }),
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const body = (await context.request.json()) as RequestBody;
    const mode = body.mode || 'generate';
    const model = context.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (mode === 'generate') {
      const count = Math.min(Math.max(Number(body.count) || 5, 1), 30);
      const subject = body.subject || 'mathematics';
      const chapter = body.chapter || 'general';
      const difficulty = body.difficulty || 'medium';
      const style = body.style ? `Target style: ${body.style} entrance test pattern.` : '';

      const prompt = `You are an academic entrance test question author for university exams in Pakistan (FAST-NUCES, NUST NET, GIKI, MDCAT, ECAT).
Generate exactly ${count} multiple-choice questions for:
Subject: ${subject}
Chapter: ${chapter}
Difficulty: ${difficulty}
${style}

CRITICAL FORMATTING INSTRUCTIONS:
- Mathematical equations MUST use standard LaTeX wrapped in $...$ for inline formulas and $$...$$ for display equations.
- Chemical formulas MUST use mhchem LaTeX syntax: \\ce{...}.
- Each question MUST have exactly 4 distinct answer options.
- The "correct" field must be an integer from 0 to 3 representing the index of the correct option.
- Provide a clear, step-by-step academic explanation for every question.
- Always avoid generic placeholder questions.

Return a valid JSON array of objects with this EXACT structure (no markdown fences, raw JSON):
[
  {
    "q": "The question text with LaTeX math like $\\\\int x dx$ or chemistry like \\\\ce{H2SO4}",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correct": 0,
    "explain": "Step-by-step solution and derivation",
    "difficulty": "${difficulty}",
    "subject": "${subject}",
    "chapter": "${chapter}",
    "tags": ["${subject}", "${chapter}"]
  }
]`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return new Response(
          JSON.stringify({ success: false, error: 'Could not generate questions with AI.', details: errText.slice(0, 200) }),
          { status: 502, headers: corsHeaders }
        );
      }

      const data: any = await geminiRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      let parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed) && parsed.questions) parsed = parsed.questions;
      if (!Array.isArray(parsed)) parsed = [];

      // Validate on server
      const questions = parsed.map((item: any) => {
        const needsReview: string[] = [];
        if (!item.q || item.q.length < 10) needsReview.push('Question text too short');
        if (!Array.isArray(item.options) || item.options.length !== 4) needsReview.push('Must have exactly 4 options');
        if (typeof item.correct !== 'number' || item.correct < 0 || item.correct > 3) needsReview.push('Invalid answer index');
        if (!item.explain) needsReview.push('Missing explanation');

        return {
          q: String(item.q || '').trim(),
          options: Array.isArray(item.options) && item.options.length === 4 ? item.options.map(String) : ['A', 'B', 'C', 'D'],
          correct: typeof item.correct === 'number' && item.correct >= 0 && item.correct <= 3 ? item.correct : 0,
          explain: String(item.explain || '').trim(),
          subject,
          chapter,
          difficulty,
          tags: Array.isArray(item.tags) ? item.tags : [subject],
          needsReview: needsReview.length > 0 ? needsReview : undefined,
          status: 'draft' as const,
        };
      });

      return new Response(JSON.stringify({ success: true, count: questions.length, questions }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (mode === 'extract') {
      const { fileBase64, fileMimeType, extractedText, subject, chapter, difficulty } = body;

      const prompt = `Extract all multiple choice questions (MCQs) that ACTUALLY appear in this source.
RULES:
1. Extract ONLY questions that are genuinely present. Never invent new questions, options, or answers.
2. If the correct answer is not explicitly visible in the document, set "correct" to null.
3. Every question must have options A, B, C, D (4 options). If an option is missing, set "needsReview" with reason.
4. Format all math formulas with LaTeX ($...$) and chemical formulas with \\ce{...}.
5. Return raw JSON matching:
[
  {
    "q": "Question stem",
    "options": ["A", "B", "C", "D"],
    "correct": 0, // integer 0..3 or null if unseen
    "explain": "Explanation if provided or visible, else empty string",
    "needsReview": ["Reason if answer or option is missing"]
  }
]`;

      const contentsParts: any[] = [];
      if (fileBase64 && fileMimeType) {
        contentsParts.push({
          inlineData: {
            mimeType: fileMimeType,
            data: fileBase64,
          },
        });
      }
      contentsParts.push({
        text: `${prompt}\n${extractedText ? `\nText Content:\n${extractedText}` : ''}`,
      });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: contentsParts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return new Response(
          JSON.stringify({ success: false, error: 'Could not extract questions from document.', details: errText.slice(0, 200) }),
          { status: 502, headers: corsHeaders }
        );
      }

      const data: any = await geminiRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      let parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed) && parsed.questions) parsed = parsed.questions;
      if (!Array.isArray(parsed)) parsed = [];

      const questions = parsed.map((item: any) => {
        const needsReview: string[] = Array.isArray(item.needsReview) ? [...item.needsReview] : [];
        if (item.correct === null || item.correct === undefined || item.correct < 0 || item.correct > 3) {
          needsReview.push('No answer detected - please select correct option');
        }
        if (!Array.isArray(item.options) || item.options.length !== 4) {
          needsReview.push('Missing or incomplete options');
        }

        return {
          q: String(item.q || '').trim(),
          options: Array.isArray(item.options) && item.options.length === 4 ? item.options.map(String) : ['A', 'B', 'C', 'D'],
          correct: typeof item.correct === 'number' && item.correct >= 0 && item.correct <= 3 ? item.correct : null,
          explain: String(item.explain || '').trim(),
          subject: subject || 'mathematics',
          chapter: chapter || 'general',
          difficulty: difficulty || 'medium',
          needsReview: needsReview.length > 0 ? needsReview : undefined,
          status: 'draft' as const,
        };
      });

      return new Response(JSON.stringify({ success: true, count: questions.length, questions }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported mode' }), { status: 400, headers: corsHeaders });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Server error processing AI question request' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

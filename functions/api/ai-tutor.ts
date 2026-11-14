interface Env {
  GEMINI_API_KEY?: string;
}

interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

interface RequestBody {
  message: string;
  history?: ChatMessage[];
  uid?: string;
}

const SYSTEM_PROMPT = `You are Boardy, the AI Tutor for Boardly (boardly.cfd), Pakistan's premier entrance test-prep platform for university entrance exams (FAST-NUCES, NUST NET, GIKI, LUMS, NED, MDCAT, ECAT, COMSATS, PIEAS).
Tone: Patient, encouraging, concise, highly focused on entrance test speed tricks, shortcuts, and avoiding common traps.
Math Formatting:
- Always use standard LaTeX math formatting.
- Use $...$ for inline math (e.g. $f(x) = x^2$, $\\theta = 45^\\circ$).
- Use $$...$$ for display equations (e.g. $$\\int x dx = \\frac{x^2}{2} + C$$).
- Always explain tricky steps and clarify negative marking risks (such as FAST-NUCES -0.25 penalty for wrong answers).
Keep explanations structured with numbered steps or bullet points.`;

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const body = (await context.request.json()) as RequestBody;
    const userMessage = body.message?.trim();

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const apiKey = context.env.GEMINI_API_KEY;

    if (apiKey) {
      // Build conversation contents for Gemini REST API
      const contents = [];

      // Add system prompt as initial turn or systemInstruction
      const history = body.history ?? [];
      for (const h of history) {
        contents.push({
          role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      }

      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-4-hydrogen:generateContent?key=${apiKey}`;

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1200,
          },
        }),
      });

      if (geminiRes.ok) {
        const data = (await geminiRes.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const replyText =
          data.candidates?.[0]?.content?.parts?.[0]?.text ??
          'I reviewed your query. Could you clarify which university syllabus or chapter you are practicing?';

        return new Response(
          JSON.stringify({
            reply: replyText,
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // Heuristic intelligent fallback when GEMINI_API_KEY secret is not yet set in Cloudflare
    const lower = userMessage.toLowerCase();
    let reply = `Here is a step-by-step breakdown:\n\nFor entrance tests like **FAST-NUCES** and **NUST NET**, precision and time management are critical.\n\n$$\\text{Target Pace} = \\frac{\\text{Total Duration (min)}}{\\text{Total Questions}} \\approx 45\\text{ to }60\\text{ seconds per MCQ}$$\n\n1. **First Pass:** Solve all high-confidence direct recall & simple algebra questions first.\n2. **Second Pass:** Tackle multi-step calculus, mechanics derivations, and analytical questions.\n3. **Trap Detection:** Notice negative marking rules. In FAST (-0.25), only guess if you can eliminate at least 2 distractors.\n\nWhat specific subject formula or past-paper question would you like to derive together?`;

    if (lower.includes('negative marking') || lower.includes('fast')) {
      reply = `### FAST-NUCES Marking & Strategy Breakdown\n\nFAST-NUCES entrance test uses **negative marking**:\n- **Correct answer:** $+1.0$ point\n- **Incorrect answer:** $-0.25$ point\n- **Unanswered:** $0.0$ points\n\n$$\\mathbb{E}[\\text{Score}] = p(+1.0) + (1-p)(-0.25)$$\n\n**Decision Heuristic:**\n- If you eliminate **2 options**, your chance is $p = 0.5$:\n$$\\mathbb{E}[\\text{Score}] = 0.5(1.0) - 0.5(0.25) = +0.375 > 0$$\n*Always guess if you have eliminated 2 or more options!*`;
    } else if (lower.includes('derivative') || lower.includes('differentiation') || lower.includes('calculus')) {
      reply = `### Standard Entrance Test Differentiation Rules\n\n1. **Product Rule:**\n$$\\frac{d}{dx}[u \\cdot v] = u'v + uv'$$\n\n2. **Quotient Rule:**\n$$\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{u'v - uv'}{v^2}$$\n\n3. **Chain Rule with Exponential:**\n$$\\frac{d}{dx}\\left[e^{g(x)}\\right] = g'(x) \\cdot e^{g(x)}$$\n\n*Entrance Tip:* When dealing with $y = [f(x)]^{g(x)}$, take the natural logarithm on both sides before differentiating!`;
    } else if (lower.includes('kinematic') || lower.includes('physics') || lower.includes('projectile')) {
      reply = `### High-Yield Mechanics & Kinematics Shortcuts\n\nFor constant acceleration $g$:\n1. **Maximum Height:**\n$$H = \\frac{v_0^2 \\sin^2(\\theta)}{2g}$$\n\n2. **Time of Flight:**\n$$T = \\frac{2 v_0 \\sin(\\theta)}{g}$$\n\n3. **Horizontal Range:**\n$$R = \\frac{v_0^2 \\sin(2\\theta)}{g}$$\n\n*Maximum Range:* Occurs at $\\theta = 45^\\circ$, where $R_{\\max} = \\frac{v_0^2}{g} = 2H_{\\max}$.`;
    }

    return new Response(
      JSON.stringify({
        reply,
        timestamp: new Date().toISOString(),
        isFallback: true,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: corsHeaders,
    });
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

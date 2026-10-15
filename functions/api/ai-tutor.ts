/**
 * Cloudflare Pages Function: /api/ai-tutor
 * 
 * Verifies caller's Firebase ID token via REST accounts:lookup API.
 * Proxies student queries to Gemini with 24/7 Boardy AI Persona for Pakistani entrance tests.
 * NEVER exposes GEMINI_API_KEY to client code.
 */

const FIREBASE_PUBLIC_API_KEY = "AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs";

interface VerifyUserResult {
  uid: string;
  email: string;
  displayName?: string;
}

async function verifyAuthUser(
  request: Request,
  env: Record<string, string | undefined>
): Promise<VerifyUserResult> {
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (!authHeader) {
    throw new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1]) {
    throw new Response(
      JSON.stringify({ error: "Malformed Bearer token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const idToken = parts[1];
  const apiKey = (env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || FIREBASE_PUBLIC_API_KEY).trim();

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!resp.ok) {
      throw new Response(
        JSON.stringify({ error: "Token verification failed" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const data: any = await resp.json();
    const user = data?.users?.[0];
    if (!user || !user.localId) {
      throw new Response(
        JSON.stringify({ error: "No user found for token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return {
      uid: user.localId,
      email: (user.email || "").toLowerCase().trim(),
      displayName: user.displayName || "",
    };
  } catch (err: any) {
    if (err instanceof Response) throw err;
    throw new Response(
      JSON.stringify({ error: "Identity verification network error" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;

    // 1. Authenticate caller using Firebase ID token
    const authUser = await verifyAuthUser(request, env);

    // 2. Parse request payload
    const body: any = await request.json().catch(() => ({}));
    const promptText = (body.prompt || body.message || body.userQuestion || "").trim();

    if (!promptText) {
      return new Response(JSON.stringify({ error: "Prompt message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mode = body.mode || "deep-dive";
    const targetExam = body.targetExam || "FAST, NUST NET, GIKI, MDCAT";
    const studentName = body.studentName || authUser.displayName || "Student";

    let modeInstruction = "ACTIVE MODE: Deep Dive\n- Provide thorough step-by-step teaching with derivations, formula proofs, and deep conceptual clarity.";
    if (mode === "quick-take") {
      modeInstruction = "ACTIVE MODE: Quick Take\n- Give at most 3 sentences explaining the core takeaway or mechanism, followed immediately by the final answer or formula.";
    } else if (mode === "study-pal") {
      modeInstruction = "ACTIVE MODE: Study Pal\n- Speak like a friendly, encouraging, supportive peer study partner. Keep responses short, motivating, and warm (2 to 4 sentences).";
    } else if (mode === "game-plan") {
      modeInstruction = `ACTIVE MODE: Game Plan\n- Focus entirely on competitive test strategy, pacing, and option elimination tricks for ${targetExam}.`;
    }

    const systemPromptText = `You are Boardy, an encouraging, step-by-step 24/7 AI study partner for Pakistani entrance test aspirants (${targetExam}).
Student Name: ${studentName}

CRITICAL MATHEMATICAL & LATEX FORMATTING RULES:
- Use inline math with $...$ for mathematical variables, formulas, and expressions.
- Use display math with $$...$$ on their own separate lines for multi-step equations or derivations.
- Never wrap LaTeX math in markdown code blocks (\`\`\` or \`).
- Keep steps logically ordered and highlight high-yield entrance test shortcuts.
- For non-academic conversational queries, reply warmly in 1-2 sentences without forced math.

${modeInstruction}`;

    const geminiKey = (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || "").trim();

    if (geminiKey) {
      const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
      for (const model of models) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: promptText }],
                  },
                ],
                systemInstruction: {
                  parts: [{ text: systemPromptText }],
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const data: any = await geminiRes.json();
            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (replyText) {
              return new Response(
                JSON.stringify({
                  reply: replyText,
                  model,
                  mode,
                  userUid: authUser.uid,
                }),
                {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
          }
        } catch (fetchErr) {
          console.warn(`[AI Tutor] Gemini model ${model} fetch attempt error:`, fetchErr);
        }
      }
    }

    // High quality academic fallback if Gemini API is unreachable
    return new Response(
      JSON.stringify({
        reply: `### Step-by-Step Derivation & Strategy by Boardy 🎓\n\n1. **Identify the Core Given**: Always write down the known values and state what you need to find.\n2. **Select the Governing Relation**: Recall the standard formula for this entrance test topic.\n3. **Test Elimination Shortcut**: On timed exams like FAST and NUST, plug extreme choices ($0, 1, \\infty$) to eliminate impossible options before computing full algebra.\n\nLet me know which specific formula or numerical you'd like us to derive together!`,
        mode,
        model: "fallback-curriculum",
        userUid: authUser.uid,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

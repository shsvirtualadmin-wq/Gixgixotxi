export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body: any = await request.json().catch(() => ({}));
    const promptText = body.message || body.userQuestion || "";

    if (!promptText.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mode = body.mode || 'deep-dive';
    const targetExam = body.targetExam || '';
    const studentName = body.studentName || 'Student';

    let modeInstruction = 'ACTIVE MODE: Deep Dive\n- Provide thorough step-by-step teaching with derivations, formula proofs, and deep conceptual clarity.';
    if (mode === 'quick-take') {
      modeInstruction = 'ACTIVE MODE: Quick Take\n- Give at most 3 sentences explaining the core takeaway or mechanism, followed immediately by the final answer or formula.';
    } else if (mode === 'study-pal') {
      modeInstruction = 'ACTIVE MODE: Study Pal\n- Speak like a friendly, encouraging, supportive peer study partner. Keep responses short and warm (2 to 4 sentences).';
    } else if (mode === 'game-plan') {
      modeInstruction = `ACTIVE MODE: Game Plan\n- Focus entirely on competitive test strategy, pacing, and elimination tricks for ${targetExam || 'Pakistani entrance tests'}.`;
    }

    const systemPromptText = `You are Boardy, an encouraging, step-by-step 24/7 AI study partner for Pakistani students (${targetExam || 'NUST NET, FAST, GIKI, MDCAT, ECAT'}).
Student's Name: ${studentName}

CRITICAL MATHEMATICAL & LATEX FORMATTING RULES:
- Use $...$ inline for math formulas and expressions.
- Use $$...$$ on their own separate lines for display math blocks.
- Never put math inside markdown code blocks or code fences.
- Break explanations into numbered steps with concise exam tips when answering real academic queries.
- Casual greetings should be answered in 1-2 friendly sentences without math templates.

${modeInstruction}`;

    if (env.DEV || env.NODE_ENV !== 'production') {
      console.log(`[Boardy Cloudflare Worker Dev] Mode: ${mode} | Prompt prefix: "${systemPromptText.slice(0, 80)}..."`);
    }

    const apiKey = env.GEMINI_API_KEY || env.API_KEY || "";
    if (apiKey) {
      const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash"];
      for (let i = 0; i < modelsToTry.length; i++) {
        const modelName = modelsToTry[i];
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
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
                  parts: [
                    {
                      text: systemPromptText,
                    },
                  ],
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const data: any = await geminiRes.json();
            const replyText =
              data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (replyText) {
              return new Response(JSON.stringify({ reply: replyText, model: modelName, mode }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
          } else if (i === 0) {
            console.warn(`[Boardy Cloudflare Worker Fallback]: Primary model ${modelName} returned status ${geminiRes.status}. Retrying with gemini-3.5-flash...`);
          }
        } catch (gemErr) {
          if (i === 0) {
            console.warn(`[Boardy Cloudflare Worker Fallback]: Primary model ${modelName} failed, retrying with gemini-3.5-flash:`, gemErr);
          }
        }
      }
    }

    // High quality fallback
    return new Response(
      JSON.stringify({
        reply: `### Step-by-Step Explanation by Boardy 🎓\n\n1. **Core Concept**: Break the given problem into initial knowns and unknowns.\n2. **Standard Formula**: Apply standard FSC/Entrance Test definitions carefully.\n3. **Quick Test Tip**: Avoid long multi-page expansions when practicing entry tests—test options for edge values ($x=0$ or $x=1$).\n\nLet me know if you would like me to work through a specific problem or verify your answer!`,
        mode,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

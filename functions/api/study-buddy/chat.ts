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

    const apiKey = env.GEMINI_API_KEY || env.API_KEY || "";
    if (apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
                    text: `You are Boardy, an encouraging, step-by-step 24/7 AI study partner for Pakistani high school (FSC/Matric) and university entrance exam students (FAST, NUST NET, GIKI, PIEAS, ECAT, IBA, LUMS, MDCAT).
Format mathematical formulas cleanly using standard LaTeX notation ($...$ or $$...$$).
Break explanations into numbered steps with concise exam tips and trick shortcuts.
Keep tone warm, confident, and encouraging without robotic fluff.`,
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
            return new Response(JSON.stringify({ reply: replyText }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
      } catch (gemErr) {
        console.warn("Gemini fetch error:", gemErr);
      }
    }

    // High quality fallback
    return new Response(
      JSON.stringify({
        reply: `### Step-by-Step Explanation by Boardy 🎓\n\n1. **Core Concept**: Break the given problem into initial knowns and unknowns.\n2. **Standard Formula**: Apply standard FSC/Entrance Test definitions carefully.\n3. **Quick Test Tip**: Avoid long multi-page expansions when practicing entry tests—test options for edge values ($x=0$ or $x=1$).\n\nLet me know if you would like me to work through a specific problem or verify your answer!`,
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

import { BotAccountConfig } from '../config/botsConfig';
import { validateMathInText, validatePostMath } from '../utils/katexValidator';

export interface GeneratedBotPost {
  title: string;
  description: string;
  type: 'notes' | 'formula_sheet' | 'solved_paper' | 'discussion';
  chapter: string;
  tags: string[];
  verifiedBySelfCheck: boolean;
  katexSegmentsVerified: number;
}

export interface GeneratedBotComment {
  text: string;
  katexSegmentsVerified: number;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
const FALLBACK_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];

function extractJsonObject(rawText: string): any {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) throw new Error('Empty response from Gemini API');
  try {
    return JSON.parse(trimmed);
  } catch {
    const cleaned = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      }
      throw new Error('Could not parse JSON from Gemini response');
    }
  }
}

async function callGeminiJson(params: {
  apiKey: string;
  model?: string;
  systemInstruction: string;
  prompt: string;
  temperature?: number;
}): Promise<any> {
  const { apiKey, systemInstruction, prompt, temperature = 0.4 } = params;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }

  const primaryModel = (params.model || '').trim() || DEFAULT_GEMINI_MODEL;
  const modelsToTry = Array.from(new Set([primaryModel, ...FALLBACK_GEMINI_MODELS]));

  let lastErr: Error | null = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          modelName
        )}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'aistudio-build',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!resp.ok) {
          const errBody = await resp.text().catch(() => '');
          throw new Error(`Gemini HTTP ${resp.status} (${modelName}): ${errBody.slice(0, 200)}`);
        }

        const data = (await resp.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return extractJsonObject(rawText);
      } catch (err: any) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    }
  }

  throw lastErr || new Error('Gemini JSON generation failed');
}

const POST_FORMATS = [
  'worked_example',
  'formula_sheet',
  'common_mistakes',
  'mcq_with_explanation',
] as const;

/**
 * Generates a high-precision study post for a bot account, enforces strict KaTeX validation
 * (with 1 Gemini repair retry if needed), and executes a Gemini self-check step to verify
 * calculations, formulas, and answers before allowing publication.
 */
export async function generateVerifiedBotStudyPost(params: {
  bot: BotAccountConfig;
  apiKey: string;
  model?: string;
  postIndex?: number;
}): Promise<{ post: GeneratedBotPost | null; discardReason?: string }> {
  const { bot, apiKey, model, postIndex = 0 } = params;
  const chapter =
    bot.chapters[Math.floor(Math.random() * bot.chapters.length)] || bot.subject;
  const formatStyle =
    POST_FORMATS[(postIndex + Math.floor(Math.random() * POST_FORMATS.length)) % POST_FORMATS.length];

  const mappedType: GeneratedBotPost['type'] =
    formatStyle === 'formula_sheet'
      ? 'formula_sheet'
      : formatStyle === 'mcq_with_explanation'
      ? 'solved_paper'
      : 'notes';

  const systemInstruction = `You are ${bot.displayName}, an expert ${bot.subject} educator and entrance-exam mentor on Boardly Commons (Class ${bot.classLevel}, ${bot.board} Board, ${bot.target}).
STRICT RULES:
1. Return ONLY valid JSON matching the requested schema.
2. All mathematical, physical, chemical, or algorithmic notation MUST use valid KaTeX:
   - Inline math: $...$ (e.g., $v = u + at$, $\\Delta H^\\circ = -285.8\\text{ kJ/mol}$, $O(n \\log n)$)
   - Block math: $$...$$ (e.g., $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$)
   - Even for English or Biology, include at least one valid KaTeX expression (e.g., Hardy-Weinberg $p^2 + 2pq + q^2 = 1$, ATP yield $\\text{Net ATP} = 36\\text{ to }38$, or entrance test scoring formula $\\text{Net Score} = C - 0.25W$).
3. Do NOT use unsupported LaTeX environments like \\begin{align*}, \\begin{equation}, or unescaped % inside math mode. Use \\begin{aligned}...\\end{aligned} inside $$...$$ if multi-line math is needed.
4. Content must be real, rigorous, calculation-verified study material (worked examples, formula sheets, common exam traps/mistakes, or an entrance test MCQ with options A-D, the exact correct answer, and step-by-step derivation). Never write filler or vague advice. Do not reference videos.`;

  const userPrompt = `Create a ${formatStyle.replace(/_/g, ' ')} post for:
- Subject: ${bot.subject}
- Chapter/Topic: ${chapter}
- Class Level: Class ${bot.classLevel} (${bot.board} Board / ${bot.target})

Return JSON with this exact structure:
{
  "title": "Concise, specific academic title (40-95 chars, no unclosed $)",
  "description": "Full structured study post (180-450 words) with worked steps, valid KaTeX ($...$ and $$...$$), and if MCQ format, options (A)-(D), Correct Answer, and Step-by-Step Solution.",
  "chapter": "${chapter}",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

  let rawDraft: any;
  try {
    rawDraft = await callGeminiJson({
      apiKey,
      model,
      systemInstruction,
      prompt: userPrompt,
      temperature: 0.45,
    });
  } catch (err: any) {
    return {
      post: null,
      discardReason: `Gemini generation error: ${err?.message || String(err)}`,
    };
  }

  let title = String(rawDraft?.title || '').trim();
  let description = String(rawDraft?.description || '').trim();
  const tags: string[] = Array.isArray(rawDraft?.tags)
    ? rawDraft.tags.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6)
    : [bot.subject.toLowerCase(), `class-${bot.classLevel}`, bot.board.toLowerCase()];

  if (!title || !description || description.length < 80) {
    return { post: null, discardReason: 'Generated title or description was empty or too short' };
  }

  // STEP 1: Strict KaTeX validation with katex.renderToString(expr, { throwOnError: true })
  let katexCheck = validatePostMath(title, description);

  // STEP 2: If KaTeX validation fails, send the exact error back to Gemini ONCE to fix it
  if (!katexCheck.valid) {
    try {
      const repairPrompt = `Your previous JSON post failed strict KaTeX validation (katex.renderToString with throwOnError: true).
Exact KaTeX errors:
${katexCheck.errors.join('\n')}

Original Title:
${title}

Original Description:
${description}

Fix every broken KaTeX expression so all inline $...$ and block $$...$$ render without error in KaTeX. Keep all academic content intact.
Return JSON:
{
  "title": "Fixed title",
  "description": "Fixed description"
}`;

      const repaired = await callGeminiJson({
        apiKey,
        model,
        systemInstruction,
        prompt: repairPrompt,
        temperature: 0.15,
      });

      if (repaired?.title && repaired?.description) {
        title = String(repaired.title).trim();
        description = String(repaired.description).trim();
      }
    } catch (repairErr: any) {
      return {
        post: null,
        discardReason: `KaTeX repair call failed: ${repairErr?.message || String(repairErr)}`,
      };
    }

    // Re-validate after the single repair attempt; if still invalid, discard!
    katexCheck = validatePostMath(title, description);
    if (!katexCheck.valid) {
      return {
        post: null,
        discardReason: `Discarded: KaTeX still invalid after retry (${katexCheck.errors.join('; ')})`,
      };
    }
  }

  // STEP 3: Gemini Self-Check Step — verify facts, calculations, and MCQ answers before publishing
  try {
    const selfCheckPrompt = `Review this ${bot.subject} study post before publication on Boardly Commons.
Verify:
1. Every mathematical calculation, formula, chemical equation, or factual claim is 100% accurate.
2. If an MCQ or worked problem is included, verify that the stated final answer matches the step-by-step derivation.
3. All KaTeX ($...$ and $$...$$) remains strictly valid.

Title: ${title}
Description:
${description}

Return JSON only:
{
  "verified": true,
  "hasFactualOrCalculationError": false,
  "issues": "",
  "correctedTitle": "${title.replace(/"/g, '\\"')}",
  "correctedDescription": ""
}
If you find a calculation or factual mistake, set "hasFactualOrCalculationError": true and provide the corrected post in "correctedDescription" (with valid KaTeX). If the post is fundamentally flawed and cannot be fixed, set "verified": false.`;

    const verification = await callGeminiJson({
      apiKey,
      model,
      systemInstruction:
        'You are a strict academic fact-checker and mathematical verifier for Pakistani FSc / Entrance Exam (NUST, FAST, MDCAT, ECAT) study materials. Output JSON only.',
      prompt: selfCheckPrompt,
      temperature: 0.1,
    });

    if (verification?.verified === false && !verification?.correctedDescription) {
      return {
        post: null,
        discardReason: `Discarded by Gemini self-check: ${verification?.issues || 'Failed factual/calculation verification'}`,
      };
    }

    if (
      verification?.hasFactualOrCalculationError &&
      typeof verification?.correctedDescription === 'string' &&
      verification.correctedDescription.trim().length > 80
    ) {
      const candidateTitle = String(verification.correctedTitle || title).trim();
      const candidateDesc = verification.correctedDescription.trim();
      const recheckKatex = validatePostMath(candidateTitle, candidateDesc);
      if (recheckKatex.valid) {
        title = candidateTitle;
        description = candidateDesc;
        katexCheck = recheckKatex;
      } else {
        // Never publish broken math or unverified correction
        return {
          post: null,
          discardReason: `Discarded: Self-check correction contained invalid KaTeX (${recheckKatex.errors.join('; ')})`,
        };
      }
    }
  } catch (verifyErr: any) {
    return {
      post: null,
      discardReason: `Self-check verification call failed: ${verifyErr?.message || String(verifyErr)}`,
    };
  }

  return {
    post: {
      title,
      description,
      type: mappedType,
      chapter,
      tags,
      verifiedBySelfCheck: true,
      katexSegmentsVerified: katexCheck.mathSegmentsCount,
    },
  };
}

/**
 * Generates a constructive, subject-aware academic comment on another user's post,
 * strictly validating any KaTeX math (`$...$` / `$$...$$`) with 1 retry before saving.
 */
export async function generateVerifiedBotComment(params: {
  bot: BotAccountConfig;
  targetPost: { title: string; description: string; subject: string };
  apiKey: string;
  model?: string;
}): Promise<{ comment: GeneratedBotComment | null; discardReason?: string }> {
  const { bot, targetPost, apiKey, model } = params;

  const systemInstruction = `You are ${bot.displayName}, a ${bot.subject} study partner on Boardly Commons.
Write a short, helpful, academically accurate comment (1 to 3 sentences) adding a useful formula tip, shortcut, or key exam insight related to the post.
Use valid inline KaTeX $...$ if referencing a formula or variable. Never use broken LaTeX. Return JSON only: { "text": "..." }`;

  const prompt = `Post Title: ${targetPost.title}
Post Subject: ${targetPost.subject}
Post Excerpt: ${String(targetPost.description || '').slice(0, 450)}

Return JSON:
{
  "text": "Your 1-3 sentence academic comment here"
}`;

  try {
    const raw = await callGeminiJson({
      apiKey,
      model,
      systemInstruction,
      prompt,
      temperature: 0.4,
    });

    let text = String(raw?.text || '').trim();
    if (!text || text.length < 10) {
      return { comment: null, discardReason: 'Empty comment generated' };
    }

    let check = validateMathInText(text);
    if (!check.valid) {
      // Retry once with Gemini to fix KaTeX
      const repaired = await callGeminiJson({
        apiKey,
        model,
        systemInstruction,
        prompt: `Your comment failed KaTeX validation (${check.errors.join('; ')}). Fix the LaTeX syntax in this comment and return JSON { "text": "..." }:\n\n${text}`,
        temperature: 0.15,
      });
      text = String(repaired?.text || '').trim();
      check = validateMathInText(text);
      if (!check.valid || !text) {
        return {
          comment: null,
          discardReason: `Discarded comment: KaTeX invalid after retry (${check.errors.join('; ')})`,
        };
      }
    }

    return {
      comment: {
        text,
        katexSegmentsVerified: check.mathSegmentsCount,
      },
    };
  } catch (err: any) {
    return {
      comment: null,
      discardReason: `Comment generation failed: ${err?.message || String(err)}`,
    };
  }
}

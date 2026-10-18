import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';

function aiTutorPlugin() {
  return {
    name: 'ai-tutor-api',
    configureServer(server: any) {
      // ─── TEST GENERATION API ──────────────────────────────────────────────
      server.middlewares.use('/api/tests/generate', async (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let rawBody = '';
          req.on('data', (chunk: any) => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}');
              const count = Math.min(Math.max(Number(body.count) || 5, 1), 20);
              const subject = (body.subject || 'All').trim();
              const chapter = (body.chapter || '').trim();
              const university = (body.university || '').trim();
              const excludeIds = new Set(Array.isArray(body.excludeIds) ? body.excludeIds : []);

              const questionsPath = path.resolve(__dirname, './data/questions.cleaned.json');
              let pool: any[] = [];
              if (fs.existsSync(questionsPath)) {
                try {
                  const raw = fs.readFileSync(questionsPath, 'utf-8');
                  pool = JSON.parse(raw);
                } catch (e) {
                  console.warn('Failed to parse questions.cleaned.json', e);
                }
              }

              // Priority 1: Exact match on subject and chapter/topic (excluding already used)
              let candidates = pool.filter((q: any) => {
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

              // Priority 2: If not enough questions, loosen chapter filter to subject match
              if (candidates.length < count && subject && subject !== 'All' && subject !== 'General') {
                const subjectPool = pool.filter((q: any) => {
                  if (excludeIds.has(q.id)) return false;
                  return q.subject && q.subject.toLowerCase().includes(subject.toLowerCase());
                });
                candidates = [...candidates, ...subjectPool];
              }

              // Priority 3: Fall back to general pool
              if (candidates.length < count) {
                const generalPool = pool.filter((q: any) => !excludeIds.has(q.id));
                candidates = [...candidates, ...generalPool];
              }

              // Deduplicate candidates by ID
              const uniqueMap = new Map<string, any>();
              for (const c of candidates) {
                if (!uniqueMap.has(c.id)) uniqueMap.set(c.id, c);
              }
              const uniqueList = Array.from(uniqueMap.values());

              // Randomize order
              const shuffled = uniqueList.sort(() => 0.5 - Math.random());
              const selectedRaw = shuffled.slice(0, count);

              const selected = selectedRaw.map((q: any) => ({
                id: q.id,
                q: q.q || q.question || '',
                options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'],
                correct: typeof q.correct === 'number' ? q.correct : (q.correctAnswer ?? 0),
                explain: q.explain || q.explanation || '',
                subject: q.subject || subject || 'General',
                chapter: q.chapter || q.topic || chapter || '',
                difficulty: q.difficulty || 'Medium',
                university: q.university || university || 'FAST-NUCES',
              }));

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  questions: selected,
                  count: selected.length,
                  batchIndex: Number(body.batchIndex) || 0,
                  hasMore: uniqueList.length > count,
                })
              );
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err?.message || 'Server error generating test batch' }));
            }
          });
          return;
        }

        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      // ─── CONTACT FORM API ─────────────────────────────────────────────────
      server.middlewares.use('/api/contact', async (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end();
          return;
        }

        if (req.method === 'GET') {
          const resendKey = process.env.RESEND_API_KEY;
          const isConfigured = Boolean(resendKey && resendKey.length > 5);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'ok',
              service: 'boardly-contact-api',
              resendConfigured: isConfigured,
              recipient: process.env.CONTACT_TO_EMAIL || 'support@boardly.cfd',
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (req.method === 'POST') {
          let rawBody = '';
          req.on('data', (chunk: any) => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}');

              // Honeypot check
              if (body.honeypot && String(body.honeypot).trim().length > 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Spam validation check failed.', code: 'HONEYPOT_TRIGGERED' }));
                return;
              }

              const name = (body.name || '').trim();
              const email = (body.email || '').trim().toLowerCase();
              const phone = (body.phone || '').trim();
              const message = (body.message || '').trim();
              const pageUrl = (body.pageUrl || 'https://boardly.cfd/contact').trim();

              if (!name || name.length < 2 || name.length > 80) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Name must be between 2 and 80 characters long.', code: 'INVALID_NAME' }));
                return;
              }

              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!email || !emailRegex.test(email)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' }));
                return;
              }

              if (!message || message.length < 10 || message.length > 2000) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Message must be between 10 and 2,000 characters long.', code: 'MESSAGE_LENGTH' }));
                return;
              }

              const resendApiKey = process.env.RESEND_API_KEY;
              const recipient = process.env.CONTACT_TO_EMAIL || 'support@boardly.cfd';

              if (!resendApiKey) {
                console.warn('[Contact Server] RESEND_API_KEY is not set in environment.');
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: false,
                    error: 'Support email service is currently not configured on this server.',
                    code: 'RESEND_NOT_CONFIGURED',
                  })
                );
                return;
              }

              const pktTimeStr = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Karachi',
                dateStyle: 'full',
                timeStyle: 'medium',
              }).format(new Date());

              const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Boardly Contact <contact@boardly.cfd>',
                  to: [recipient],
                  reply_to: email,
                  subject: `[Boardly] New inquiry from ${name}`,
                  html: `<h3>New Student Inquiry</h3><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || 'Not provided'}</p><p><strong>Time (PKT):</strong> ${pktTimeStr}</p><p><strong>URL:</strong> ${pageUrl}</p><hr/><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`,
                  text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nTime (PKT): ${pktTimeStr}\n\nMessage:\n${message}`,
                }),
              });

              if (!resendRes.ok) {
                const errText = await resendRes.text();
                console.error('[Resend Error in Dev Server]:', resendRes.status, errText);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: false,
                    error: 'Failed to deliver message via Resend.',
                    code: `RESEND_ERROR_${resendRes.status}`,
                    details: errText.slice(0, 300),
                  })
                );
                return;
              }

              const resData: any = await resendRes.json();
              if (!resData?.id) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Email gateway responded without message confirmation ID.', code: 'RESEND_MISSING_ID' }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Message sent successfully!', id: resData.id }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error processing contact message' }));
            }
          });
          return;
        }

        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      // ─── AI TUTOR API ─────────────────────────────────────────────────────
      server.middlewares.use('/api/ai-tutor', async (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let rawBody = '';
          req.on('data', (chunk: any) => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}');
              const BOARDY_AI_MODEL = 'gemini-3.8-flash';
              const BOARDY_AI_FALLBACK_MODEL = 'gemini-flash-latest';

              // If structured MCQ derivation request
              const isMcqDerivation = body.mode === 'mcq_derivation' || body.questionText;
              const questionText = body.questionText || body.message || '';
              const options = Array.isArray(body.options) ? body.options : [];
              const correct = body.correctAnswer || {};
              const chosen = body.chosenAnswer || {};
              const subject = body.subject || 'General';
              const chapter = body.chapter || 'General';
              const track = body.track || 'Entrance Exam';

              const apiKey = process.env.GEMINI_API_KEY;

              const SYSTEM_PROMPT = `You are Boardy, a tutor for Pakistani university entrance tests (MDCAT, NUST NET, FAST-NUCES, GIKI, ECAT, etc.). You get one MCQ, its options, the correct answer, and the student's chosen answer. Rules:
1. Treat the provided correct answer as the truth. Explain WHY it is correct, step by step.
2. If the student chose a wrong option, explain exactly why it is wrong and what misconception likely led to it.
3. Briefly say why each other option is wrong (one line each).
4. End with a quick tip to remember the concept.
5. Stay on this question only. No talk about pacing, time management, or negative marking unless asked.
6. Be accurate. If unsure, say so instead of inventing facts.
7. Write math in LaTeX: $...$ inline, $$...$$ display.
8. Keep it short: short steps, no long paragraphs.
9. Never ask the student what they want to derive. Just answer.

Output format:
### Correct Answer
[Letter]: [Option text]

### Step-by-Step Solution
[Short, numbered derivation steps]

### Why Your Answer Was Wrong
[Explain the specific trap or misconception if chosen answer is wrong; omit if correct or skipped]

### Why Other Options Are Wrong
- Option [X]: [One line reason]
- Option [Y]: [One line reason]

### Quick Tip
[Key takeaway or shortcut]`;

              let promptContent = '';
              if (isMcqDerivation) {
                promptContent = `University Track: ${track}
Subject: ${subject}
Chapter: ${chapter}

Question:
${questionText}

Options:
${options.map((opt: string, i: number) => `(${['A', 'B', 'C', 'D'][i] || i + 1}) ${opt}`).join('\n')}

Stored Correct Answer:
[${correct.letter || 'Key'}]: ${correct.text || ''}

Student's Choice:
${chosen.text ? `[${chosen.letter || 'Chosen'}]: ${chosen.text}` : 'Skipped'}

Provide the step-by-step solution following your exact output format.`;
              } else {
                promptContent = questionText;
              }

              if (apiKey) {
                const callGemini = async (model: string) => {
                  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                  const r = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                      contents: [{ role: 'user', parts: [{ text: promptContent }] }],
                      generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
                    }),
                  });
                  if (!r.ok) throw new Error(`Gemini status ${r.status}`);
                  const data: any = await r.json();
                  return data.candidates?.[0]?.content?.parts?.[0]?.text;
                };

                try {
                  let replyText = await callGemini(BOARDY_AI_MODEL);
                  if (!replyText) {
                    replyText = await callGemini(BOARDY_AI_FALLBACK_MODEL);
                  }
                  if (replyText) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ reply: replyText, timestamp: new Date().toISOString() }));
                    return;
                  }
                } catch (gErr) {
                  console.warn('[vite ai-tutor] Primary Gemini call note:', gErr);
                  try {
                    const fallbackText = await callGemini(BOARDY_AI_FALLBACK_MODEL);
                    if (fallbackText) {
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ reply: fallbackText, timestamp: new Date().toISOString() }));
                      return;
                    }
                  } catch (fbErr) {
                    console.warn('[vite ai-tutor] Fallback Gemini call note:', fbErr);
                  }
                }
              }

              // Fallback generation conforming strictly to the requested format (no generic pacing talk!)
              const optLetters = ['A', 'B', 'C', 'D'];
              const cLetter = correct.letter || 'Correct Option';
              const cText = correct.text || options[0] || '';
              const chText = chosen.text || 'Skipped';

              let fallbackReply = `### Correct Answer\n**[${cLetter}]:** ${cText}\n\n### Step-by-Step Solution\n1. Analyze the given problem: $${questionText.slice(0, 60)}$.\n2. Apply the fundamental definition of ${chapter} in ${subject}.\n3. Evaluating the condition directly yields: $${cText}$.\n\n`;

              if (chosen.letter && chosen.letter !== correct.letter && chText !== 'Skipped') {
                fallbackReply += `### Why Your Answer Was Wrong\nYou selected **[${chosen.letter}]: ${chText}**. This is a common misconception where the operation or definition is confused with related properties.\n\n`;
              }

              fallbackReply += `### Why Other Options Are Wrong\n`;
              options.forEach((opt: string, i: number) => {
                const l = optLetters[i] || String(i + 1);
                if (l !== cLetter) {
                  fallbackReply += `- **Option [${l}]:** Does not satisfy the definition of ${cText}.\n`;
                }
              });

              fallbackReply += `\n### Quick Tip\nAlways test simple boundary values or verify the formal mathematical definition before selecting an option!`;

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply: fallbackReply, timestamp: new Date().toISOString(), isFallback: true }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }

        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      // ─── AI QUESTIONS GENERATOR & EXTRACTOR API ───────────────────────────
      server.middlewares.use('/api/ai-questions', async (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let rawBody = '';
          req.on('data', (chunk: any) => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}');
              const apiKey = process.env.GEMINI_API_KEY;

              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: false,
                    notConfigured: true,
                    message: "AI import isn't set up yet",
                  })
                );
                return;
              }

              const mode = body.mode || 'generate';
              const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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
                  res.writeHead(502, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: 'Could not generate questions with AI.', details: errText.slice(0, 200) }));
                  return;
                }

                const data: any = await geminiRes.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
                let parsed = JSON.parse(rawText);
                if (!Array.isArray(parsed) && parsed.questions) parsed = parsed.questions;
                if (!Array.isArray(parsed)) parsed = [];

                const questions = parsed.map((item: any) => ({
                  q: String(item.q || '').trim(),
                  options: Array.isArray(item.options) && item.options.length === 4 ? item.options.map(String) : ['A', 'B', 'C', 'D'],
                  correct: typeof item.correct === 'number' && item.correct >= 0 && item.correct <= 3 ? item.correct : 0,
                  explain: String(item.explain || '').trim(),
                  subject,
                  chapter,
                  difficulty,
                  tags: Array.isArray(item.tags) ? item.tags : [subject],
                  status: 'draft',
                }));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, count: questions.length, questions }));
                return;
              }

              if (mode === 'extract') {
                const { fileBase64, fileMimeType, extractedText, subject, chapter, difficulty } = body;

                const prompt = `Extract all multiple choice questions (MCQs) that ACTUALLY appear in this source.
RULES:
1. Extract ONLY questions that are genuinely present. Never invent new questions, options, or answers.
2. If the correct answer is not explicitly visible in the document, set "correct" to null.
3. Every question must have options A, B, C, D (4 options). If an option is missing, flag it in needsReview.
4. Format all math formulas with LaTeX ($...$) and chemical formulas with \\ce{...}.
5. Return raw JSON matching:
[
  {
    "q": "Question stem",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explain": "Explanation if provided, else empty string",
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
                  res.writeHead(502, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: 'Could not extract questions from document.', details: errText.slice(0, 200) }));
                  return;
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
                    status: 'draft',
                  };
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, count: questions.length, questions }));
                return;
              }

              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Unsupported mode' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }

        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      // ─── CREW API (LEADERBOARDS, MODERATION, PAYMENTS) ───────────────────
      server.middlewares.use('/api/crews', async (req: any, res: any) => {
        console.log('[DEBUG] /api/crews hit! url:', req.url);
        try {
          const { handleCrewApi } = await import('./src/server/crewApiHandler.ts');
          await handleCrewApi(req, res);
        } catch (err: any) {
          console.error('[ViteMiddleware] Crew API error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err?.message || 'Server error' }));
        }
      });

      // ─── PDF DOWNLOAD RATE LIMIT API (1 DOWNLOAD PER HOUR PER USER) ──────
      server.middlewares.use('/api/tests/pdf-download-check', async (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let raw = '';
        req.on('data', (chunk: any) => {
          raw += chunk;
        });
        req.on('end', () => {
          try {
            const body = JSON.parse(raw || '{}');
            const uid = body.uid;
            const email = (body.email || '').toLowerCase().trim();
            const role = (body.role || '').toLowerCase().trim();

            if (!uid) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing uid' }));
              return;
            }

            // Superadmins and admins are exempt
            const superAdmins = ['shsvirtualadmin@gmail.com', 'support@boardly.cfd', 'jan798408@gmail.com'];
            const isAdmin = role === 'admin' || role === 'superadmin' || superAdmins.includes(email);
            if (isAdmin) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ allowed: true, isAdminExempt: true }));
              return;
            }

            const downloadLogPath = path.resolve(__dirname, './data/pdf_downloads.json');
            let downloads: Record<string, number> = {};
            if (fs.existsSync(downloadLogPath)) {
              try {
                downloads = JSON.parse(fs.readFileSync(downloadLogPath, 'utf-8'));
              } catch (_) {}
            }

            const now = Date.now();
            const lastTime = downloads[uid] || 0;
            const oneHour = 60 * 60 * 1000;

            if (lastTime && now - lastTime < oneHour) {
              const remainingMs = oneHour - (now - lastTime);
              const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
              res.writeHead(429, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  allowed: false,
                  remainingMinutes,
                  message: `Download limit: Pro members can download 1 PDF per hour. Please wait ${remainingMinutes} minute${
                    remainingMinutes === 1 ? '' : 's'
                  } before downloading another test PDF.`,
                })
              );
              return;
            }

            // Record download
            downloads[uid] = now;
            try {
              fs.writeFileSync(downloadLogPath, JSON.stringify(downloads, null, 2), 'utf-8');
            } catch (_) {}

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ allowed: true, downloadedAt: now }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err?.message || 'Server error' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), aiTutorPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(
      process.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs'
    ),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(
      process.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'auth.boardly.cfd'
    ),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(
      process.env.VITE_FIREBASE_PROJECT_ID ?? 'gen-lang-client-0365509316'
    ),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(
      process.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'gen-lang-client-0365509316.firebasestorage.app'
    ),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '556734245207'
    ),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(
      process.env.VITE_FIREBASE_APP_ID ?? '1:556734245207:web:4797f3915b424209b03612'
    ),
    'import.meta.env.VITE_FIREBASE_DATABASE_ID': JSON.stringify(
      process.env.VITE_FIREBASE_DATABASE_ID ?? 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712'
    ),
    'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(
      process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ?? 'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712'
    ),
    '__BUILD_TIME__': JSON.stringify(new Date().toUTCString()),
    '__BUILD_ID__': JSON.stringify('boardly-' + Date.now().toString(36)),
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('katex')) return 'vendor-math';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('@tanstack')) return 'vendor-query';
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true as const,
    hmr: false,
  },
});

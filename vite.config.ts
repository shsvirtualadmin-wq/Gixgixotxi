import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { defineConfig } from 'vite';

function aiTutorPlugin() {
  return {
    name: 'ai-tutor-api',
    configureServer(server: any) {
      // ─── HTTP GZIP COMPRESSION FOR TEXT / JS / CSS / JSON / SVG ───────────
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const acceptEncoding = String(req.headers?.['accept-encoding'] || '');
        const rawUrl = String(req.url || '').split('?')[0].toLowerCase();
        if (rawUrl.startsWith('/src/')) {
          try {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          } catch {}
        }
        if (
          !acceptEncoding.includes('gzip') ||
          (req.method !== 'GET' && req.method !== 'POST') ||
          rawUrl.startsWith('/api/commons/') ||
          /\.(png|jpe?g|webp|gif|mp4|webm|pdf|woff2?|ttf|eot|ico)$/i.test(rawUrl)
        ) {
          return next();
        }

        const origWrite = res.write.bind(res);
        const origEnd = res.end.bind(res);
        const origWriteHead = res.writeHead.bind(res);

        let streamingPassthrough = false;
        const chunks: Buffer[] = [];

        const isCompressibleType = (ct: string): boolean => {
          const lower = ct.toLowerCase();
          return (
            lower.includes('javascript') ||
            lower.includes('ecmascript') ||
            lower.includes('text/css') ||
            lower.includes('text/html') ||
            lower.includes('application/json') ||
            lower.includes('image/svg+xml') ||
            lower.includes('text/plain') ||
            lower.includes('text/xml') ||
            lower.includes('application/xml')
          );
        };

        res.writeHead = function (statusCode: number, statusMessage?: any, headersArg?: any) {
          res.statusCode = statusCode;
          let headersObj = headersArg;
          if (typeof statusMessage === 'string') {
            res.statusMessage = statusMessage;
          } else if (statusMessage && typeof statusMessage === 'object') {
            headersObj = statusMessage;
          }
          if (headersObj && typeof headersObj === 'object' && !Array.isArray(headersObj)) {
            for (const [k, v] of Object.entries(headersObj)) {
              if (v !== undefined) {
                try {
                  res.setHeader(k, v as any);
                } catch {}
              }
            }
          }
          return res;
        };

        res.write = function (chunk: any, encoding?: any, cb?: any) {
          if (streamingPassthrough) {
            return origWrite(chunk, encoding, cb);
          }
          const ct = String(res.getHeader?.('Content-Type') || res.getHeader?.('content-type') || '');
          if (ct && !isCompressibleType(ct)) {
            streamingPassthrough = true;
            res.writeHead = origWriteHead;
            return origWrite(chunk, encoding, cb);
          }
          if (chunk) {
            chunks.push(
              Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(String(chunk), typeof encoding === 'string' ? (encoding as BufferEncoding) : 'utf-8')
            );
          }
          if (typeof encoding === 'function') encoding();
          else if (typeof cb === 'function') cb();
          return true;
        };

        res.end = function (chunk?: any, encoding?: any, cb?: any) {
          res.writeHead = origWriteHead;
          const doneCb = typeof chunk === 'function' ? chunk : typeof encoding === 'function' ? encoding : cb;
          if (streamingPassthrough) {
            return origEnd(chunk, encoding, cb);
          }

          if (res.statusCode === 204 || res.statusCode === 304 || req.method === 'HEAD') {
            try {
              res.removeHeader('Content-Length');
              res.removeHeader('content-length');
              res.removeHeader('Content-Encoding');
              res.removeHeader('content-encoding');
            } catch {}
            return origEnd(doneCb);
          }

          if (chunk && typeof chunk !== 'function') {
            chunks.push(
              Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(String(chunk), typeof encoding === 'string' ? (encoding as BufferEncoding) : 'utf-8')
            );
          }

          const fullBuf = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks);
          const alreadyEncoded = Boolean(
            res.getHeader?.('Content-Encoding') || res.getHeader?.('content-encoding')
          );
          const ct = String(res.getHeader?.('Content-Type') || res.getHeader?.('content-type') || '');

          if (!alreadyEncoded && isCompressibleType(ct) && fullBuf.length >= 512) {
            try {
              const compressed = zlib.gzipSync(fullBuf, { level: 6 });
              res.setHeader('Content-Encoding', 'gzip');
              res.setHeader('Vary', 'Accept-Encoding');
              res.setHeader('Content-Length', compressed.length);
              return origEnd(compressed, doneCb);
            } catch {
              // Fallback to uncompressed
            }
          }

          if (fullBuf.length > 0) {
            res.setHeader('Content-Length', fullBuf.length);
            return origEnd(fullBuf, doneCb);
          }
          return origEnd(doneCb);
        };

        next();
      });

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

              const apiKey = process.env.GEMINI_API_KEY || (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',')[0].trim() : '');

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
                      generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1500,
                        thinkingConfig: { thinkingBudget: 1024 },
                      },
                    }),
                  });
                  if (!r.ok) {
                    const errBody = await r.text();
                    console.error(`[vite ai-tutor] Gemini API error (${model}): status ${r.status}`, errBody);
                    let parsedReason = `Gemini status ${r.status}`;
                    try {
                      const parsed = JSON.parse(errBody);
                      parsedReason = parsed?.error?.message || parsedReason;
                    } catch {}
                    const err: any = new Error(parsedReason);
                    err.status = r.status;
                    err.reason = parsedReason;
                    throw err;
                  }
                  const data: any = await r.json();
                  return data.candidates?.[0]?.content?.parts?.[0]?.text;
                };

                try {
                  const replyText = await callGemini(BOARDY_AI_MODEL);
                  if (replyText) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ reply: replyText, timestamp: new Date().toISOString() }));
                    return;
                  }
                } catch (gErr: any) {
                  console.error('[vite ai-tutor] Boardly AI error:', gErr?.status, gErr?.reason || gErr?.message);
                  res.writeHead(gErr?.status || 500, { 'Content-Type': 'application/json' });
                  res.end(
                    JSON.stringify({
                      error: gErr?.reason || gErr?.message || 'AI generation failed',
                      status: gErr?.status || 500,
                      code:
                        gErr?.status === 429
                          ? 'RATE_LIMIT'
                          : gErr?.status === 400 || gErr?.status === 401 || gErr?.status === 403
                          ? 'BAD_KEY'
                          : gErr?.status === 503
                          ? 'MODEL_UNAVAILABLE'
                          : 'AI_ERROR',
                    })
                  );
                  return;
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
              const apiKey = process.env.GEMINI_API_KEY || (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',')[0].trim() : '');

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

      // ─── CLOUDFLARE D1 + R2 POSTS API, SITEMAP, SSR & AUTH/ADMIN ROUTES ────
      let cfModPromise: Promise<any> | null = null;
      let cfMiddlewarePromise: Promise<any> | null = null;
      server.middlewares.use(async (req: any, res: any, next: () => void) => {
        try {
          const capturedUrl = req.originalUrl || req.url || '/';
          if (!cfModPromise) {
            cfModPromise = import('./src/server/cloudflarePostsAndAuthRouter.ts');
          }
          const cfMod = await cfModPromise;
          if (!cfMiddlewarePromise) {
            cfMiddlewarePromise = Promise.resolve(cfMod.createCloudflarePostsAndAuthMiddleware());
          }
          const origEnd = res.end.bind(res);
          res.end = function (chunk: any, ...args: any[]) {
            try {
              const ct = String(res.getHeader?.('content-type') || res.getHeader?.('Content-Type') || '');
              if (ct.includes('text/html') && chunk) {
                const rawStr = typeof chunk === 'string' ? chunk : Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : null;
                if (rawStr && rawStr.includes('<title>')) {
                  const enriched = cfMod.injectRouteMetaIntoHtml(rawStr, capturedUrl);
                  if (res.getHeader?.('content-length') || res.getHeader?.('Content-Length')) {
                    res.setHeader('Content-Length', Buffer.byteLength(enriched, 'utf-8'));
                  }
                  return origEnd(enriched, ...args);
                }
              }
            } catch {
              // ignore meta injection errors
            }
            return origEnd(chunk, ...args);
          };
          const mw = await cfMiddlewarePromise;
          await mw(req, res, next);
        } catch (err) {
          console.error('[ViteMiddleware] Cloudflare D1/R2 router error:', err);
          next();
        }
      });

      // ─── BOARDLY COMMONS FILE STORAGE (SIGNED URL + DIRECT STREAM UPLOAD UP TO 25 MB) ───
      const commonsUploadsDir = path.resolve(__dirname, './data/commons-uploads');
      if (!fs.existsSync(commonsUploadsDir)) {
        fs.mkdirSync(commonsUploadsDir, { recursive: true });
      }

      const DISALLOWED_EXTS = [
        '.exe', '.bat', '.cmd', '.sh', '.bin', '.msi', '.apk',
        '.jar', '.scr', '.vbs', '.js', '.com', '.wsf', '.ps1',
      ];
      const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

      const getMimeFromExt = (filename: string, fallback = 'application/octet-stream'): string => {
        const ext = path.extname(filename).toLowerCase();
        const map: Record<string, string> = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.gif': 'image/gif',
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.ppt': 'application/vnd.ms-powerpoint',
          '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          '.txt': 'text/plain; charset=utf-8',
        };
        return map[ext] || fallback;
      };

      server.middlewares.use('/api/commons/upload-url', (req: any, res: any) => {
        const corsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Name, X-File-Type, X-User-Id',
        };

        if (req.method === 'OPTIONS') {
          res.writeHead(204, corsHeaders);
          res.end();
          return;
        }

        let raw = '';
        req.on('data', (chunk: any) => {
          raw += chunk;
        });
        req.on('end', () => {
          try {
            const body = raw ? JSON.parse(raw) : {};
            const fileName = String(body.fileName || 'resource.bin').trim();
            const fileSize = Number(body.fileSize ?? body.size ?? 0);
            const contentType = String(body.contentType || getMimeFromExt(fileName));
            const uid = String(body.uid || body.userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');

            const lowerName = fileName.toLowerCase();
            if (DISALLOWED_EXTS.some((ext) => lowerName.endsWith(ext))) {
              res.writeHead(415, { ...corsHeaders, 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  code: 'UNSUPPORTED_TYPE',
                  error: `File "${fileName}" has a blocked executable extension.`,
                })
              );
              return;
            }

            if (fileSize > MAX_UPLOAD_BYTES) {
              res.writeHead(413, { ...corsHeaders, 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  code: 'FILE_TOO_LARGE',
                  error: `File "${fileName}" (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB limit.`,
                })
              );
              return;
            }

            const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            const token = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const storedFileName = `${uid}_${token}_${safeName}`;
            const uploadUrl = `/api/commons/upload?key=${encodeURIComponent(storedFileName)}&name=${encodeURIComponent(fileName)}&type=${encodeURIComponent(contentType)}`;
            const downloadUrl = `/api/commons/files/${encodeURIComponent(storedFileName)}`;

            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: true,
                method: 'PUT',
                uploadUrl,
                downloadUrl,
                storedFileName,
                maxBytes: MAX_UPLOAD_BYTES,
              })
            );
          } catch (err: any) {
            res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: false,
                code: 'BAD_REQUEST',
                error: err?.message || 'Invalid upload-url request payload.',
              })
            );
          }
        });
      });

      server.middlewares.use('/api/commons/upload', (req: any, res: any) => {
        const corsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Name, X-File-Type, X-User-Id',
        };

        if (req.method === 'OPTIONS') {
          res.writeHead(204, corsHeaders);
          res.end();
          return;
        }

        if (req.method !== 'PUT' && req.method !== 'POST') {
          res.writeHead(405, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, code: 'METHOD_NOT_ALLOWED', error: 'Use PUT or POST to upload files.' }));
          return;
        }

        try {
          const reqUrl = new URL(req.url, 'http://localhost');
          const rawName =
            reqUrl.searchParams.get('name') ||
            decodeURIComponent(req.headers['x-file-name'] || '') ||
            'resource.bin';
          const contentType =
            reqUrl.searchParams.get('type') ||
            req.headers['x-file-type'] ||
            req.headers['content-type'] ||
            getMimeFromExt(rawName);
          const uid = String(reqUrl.searchParams.get('uid') || req.headers['x-user-id'] || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');

          const lowerName = rawName.toLowerCase();
          if (DISALLOWED_EXTS.some((ext) => lowerName.endsWith(ext))) {
            res.writeHead(415, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: false,
                code: 'UNSUPPORTED_TYPE',
                error: `Blocked file "${rawName}". Executable and script files are prohibited.`,
              })
            );
            return;
          }

          const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const requestedKey = reqUrl.searchParams.get('key');
          const storedFileName = requestedKey
            ? path.basename(requestedKey).replace(/[^a-zA-Z0-9._-]/g, '_')
            : `${uid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;

          const destPath = path.join(commonsUploadsDir, storedFileName);
          const writeStream = fs.createWriteStream(destPath);
          let receivedBytes = 0;
          let aborted = false;

          req.on('data', (chunk: Buffer) => {
            if (aborted) return;
            receivedBytes += chunk.length;
            if (receivedBytes > MAX_UPLOAD_BYTES) {
              aborted = true;
              writeStream.destroy();
              try {
                if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
              } catch {}
              res.writeHead(413, { ...corsHeaders, 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  code: 'FILE_TOO_LARGE',
                  error: `File "${rawName}" exceeds the 25 MB maximum size limit.`,
                })
              );
              return;
            }
            writeStream.write(chunk);
          });

          req.on('end', () => {
            if (aborted) return;
            writeStream.end(() => {
              if (receivedBytes === 0) {
                try {
                  if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                } catch {}
                res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: false,
                    code: 'EMPTY_FILE',
                    error: `File "${rawName}" is empty (0 bytes).`,
                  })
                );
                return;
              }

              // Save sidecar metadata for Content-Type and original filename
              try {
                fs.writeFileSync(
                  `${destPath}.meta.json`,
                  JSON.stringify({
                    originalName: rawName,
                    contentType: getMimeFromExt(rawName, contentType),
                    size: receivedBytes,
                    uploadedAt: new Date().toISOString(),
                  }),
                  'utf-8'
                );
              } catch {}

              const fileUrl = `/api/commons/files/${encodeURIComponent(storedFileName)}`;
              res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  url: fileUrl,
                  name: rawName,
                  size: receivedBytes,
                  type: getMimeFromExt(rawName, contentType),
                })
              );
            });
          });

          req.on('error', (err: any) => {
            if (aborted) return;
            aborted = true;
            writeStream.destroy();
            try {
              if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
            } catch {}
            res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: false,
                code: 'STREAM_ERROR',
                error: err?.message || 'Error reading upload stream.',
              })
            );
          });
        } catch (err: any) {
          res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              code: 'SERVER_ERROR',
              error: err?.message || 'Internal server error during upload.',
            })
          );
        }
      });

      server.middlewares.use('/api/commons/files', (req: any, res: any) => {
        const corsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Range',
        };

        if (req.method === 'OPTIONS') {
          res.writeHead(204, corsHeaders);
          res.end();
          return;
        }

        try {
          const cleanPath = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\/+/, '');
          const filename = path.basename(cleanPath);
          if (!filename) {
            res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not specified' }));
            return;
          }

          const filePath = path.join(commonsUploadsDir, filename);
          if (!fs.existsSync(filePath)) {
            res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
            return;
          }

          const stat = fs.statSync(filePath);
          let contentType = getMimeFromExt(filename);
          let originalName = filename;

          const metaPath = `${filePath}.meta.json`;
          if (fs.existsSync(metaPath)) {
            try {
              const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
              if (meta.contentType) contentType = meta.contentType;
              if (meta.originalName) originalName = meta.originalName;
            } catch {}
          }

          const isInline = contentType.startsWith('image/') || contentType === 'application/pdf';
          const disposition = isInline
            ? `inline; filename="${originalName.replace(/"/g, '')}"`
            : `attachment; filename="${originalName.replace(/"/g, '')}"`;

          res.writeHead(200, {
            ...corsHeaders,
            'Content-Type': contentType,
            'Content-Length': stat.size,
            'Content-Disposition': disposition,
            'Cache-Control': 'public, max-age=31536000, immutable',
          });

          if (req.method === 'HEAD') {
            res.end();
            return;
          }

          fs.createReadStream(filePath).pipe(res);
        } catch (err: any) {
          res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err?.message || 'Error serving file' }));
        }
      });

      server.middlewares.use('/api/rewards', async (req: any, res: any) => {
        try {
          const rawBody = await new Promise<string>((resolve) => {
            if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
              resolve('');
              return;
            }
            let data = '';
            req.on('data', (chunk: any) => {
              data += chunk;
            });
            req.on('end', () => resolve(data));
          });

          const fullUrl = `http://localhost:3000/api/rewards${req.url || ''}`;
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers || {})) {
            if (typeof v === 'string') headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(', '));
          }

          const webReq = new Request(fullUrl, {
            method: req.method || 'GET',
            headers,
            body:
              req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS'
                ? rawBody
                : undefined,
          });

          const mod = await import('./functions/api/rewards/[[path]].ts');
          const webRes = await mod.handleRewardsApiRequest({
            request: webReq,
            env: {
              FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
              GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
              FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
              FIREBASE_DATABASE_ID:
                process.env.FIREBASE_DATABASE_ID ||
                process.env.VITE_FIREBASE_DATABASE_ID ||
                process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
            },
          });

          const outHeaders: Record<string, string> = {};
          webRes.headers.forEach((v, k) => {
            outHeaders[k] = v;
          });
          res.writeHead(webRes.status, outHeaders);
          const text = await webRes.text();
          res.end(text);
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: err?.message || 'Rewards middleware error' }));
        }
      });

      // ─── TRANSACTIONAL EMAIL NOTIFICATIONS API (/api/send-email) ──────────
      server.middlewares.use('/api/send-email', async (req: any, res: any) => {
        try {
          const rawBody = await new Promise<string>((resolve) => {
            if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
              resolve('');
              return;
            }
            let data = '';
            req.on('data', (chunk: any) => {
              data += chunk;
            });
            req.on('end', () => resolve(data));
          });

          const fullUrl = `http://localhost:3000/api/send-email${req.url || ''}`;
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers || {})) {
            if (typeof v === 'string') headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(', '));
          }

          const webReq = new Request(fullUrl, {
            method: req.method || 'POST',
            headers,
            body:
              req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS'
                ? rawBody
                : undefined,
          });

          const mod = await import('./functions/api/send-email.ts');
          const webRes = await mod.handleSendEmailRequest(webReq, {
            RESEND_API_KEY: process.env.RESEND_API_KEY,
            EMAIL_FROM: process.env.EMAIL_FROM,
            ADMIN_EMAILS: process.env.ADMIN_EMAILS,
            APP_URL: process.env.APP_URL,
            KOBAN_ALERT_THRESHOLD: process.env.KOBAN_ALERT_THRESHOLD,
            ENABLE_TEST_START_EMAIL: process.env.ENABLE_TEST_START_EMAIL,
            INTERNAL_EMAIL_SECRET: process.env.INTERNAL_EMAIL_SECRET,
            FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
            GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
            FIREBASE_PROJECT_ID:
              process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
            FIREBASE_DATABASE_ID:
              process.env.FIREBASE_DATABASE_ID ||
              process.env.VITE_FIREBASE_DATABASE_ID ||
              process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
          });

          const outHeaders: Record<string, string> = {};
          webRes.headers.forEach((v, k) => {
            outHeaders[k] = v;
          });
          res.writeHead(webRes.status, outHeaders);
          const text = await webRes.text();
          res.end(text);
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({ ok: false, error: err?.message || 'Send email middleware error' })
          );
        }
      });

      server.middlewares.use('/assets/store', (req: any, res: any, next: any) => {
        const cleanRel = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\/+/, '');
        const fullPath = path.join(__dirname, 'public', 'assets', 'store', cleanRel);
        if (!cleanRel || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
          res.writeHead(404, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          });
          res.end('Not Found');
          return;
        }
        next();
      });
    },
    transformIndexHtml: {
      order: 'pre' as const,
      async handler(html: string, ctx: any) {
        try {
          const reqUrl = ctx?.originalUrl || ctx?.path || '/';
          const mod = await import('./src/server/cloudflarePostsAndAuthRouter.ts');
          return mod.injectRouteMetaIntoHtml(html, reqUrl);
        } catch {
          return html;
        }
      },
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
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('katex')) return 'vendor-math';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('html2canvas')) return 'vendor-html2canvas';
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

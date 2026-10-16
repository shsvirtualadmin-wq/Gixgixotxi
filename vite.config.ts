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
              const name = (body.name || '').trim();
              const email = (body.email || '').trim().toLowerCase();
              const message = (body.message || '').trim();

              if (!name || name.length < 2) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Please enter a valid name (at least 2 characters).', code: 'INVALID_NAME' }));
                return;
              }

              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!email || !emailRegex.test(email)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' }));
                return;
              }

              if (!message || message.length < 10) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Message must be at least 10 characters long.', code: 'MESSAGE_TOO_SHORT' }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Message sent successfully!' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err?.message || 'Server error processing contact message' }));
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
              const userMessage = (body.message || '').trim();

              if (!userMessage) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Message cannot be empty' }));
                return;
              }

              const apiKey = process.env.GEMINI_API_KEY;
              if (apiKey) {
                const SYSTEM_PROMPT = `You are Boardy, the AI Tutor for Boardly (boardly.cfd), Pakistan's premier entrance test-prep platform for university entrance exams (FAST-NUCES, NUST NET, GIKI, LUMS, NED, MDCAT, ECAT, COMSATS, PIEAS).
Tone: Patient, encouraging, concise, highly focused on entrance test speed tricks, shortcuts, and avoiding common traps.
Math Formatting:
- Always use standard LaTeX math formatting.
- Use $...$ for inline math (e.g. $f(x) = x^2$, $\\theta = 45^\\circ$).
- Use $$...$$ for display equations (e.g. $$\\int x dx = \\frac{x^2}{2} + C$$).
- Always explain tricky steps and clarify negative marking risks (such as FAST-NUCES -0.25 penalty for wrong answers).
Keep explanations structured with numbered steps or bullet points.`;

                const contents = [];
                const history = body.history ?? [];
                for (const h of history) {
                  contents.push({
                    role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
                    parts: [{ text: h.content }],
                  });
                }
                contents.push({
                  role: 'user',
                  parts: [{ text: userMessage }],
                });

                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                const geminiRes = await fetch(geminiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents,
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
                  }),
                });

                if (geminiRes.ok) {
                  const data: any = await geminiRes.json();
                  const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (replyText) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ reply: replyText, timestamp: new Date().toISOString() }));
                    return;
                  }
                }
              }

              const lower = userMessage.toLowerCase();
              let reply = `Here is a step-by-step breakdown:\n\nFor entrance tests like **FAST-NUCES** and **NUST NET**, precision and time management are critical.\n\n$$\\text{Target Pace} = \\frac{\\text{Total Duration (min)}}{\\text{Total Questions}} \\approx 45\\text{ to }60\\text{ seconds per MCQ}$$\n\n1. **First Pass:** Solve all high-confidence direct recall & simple algebra questions first.\n2. **Second Pass:** Tackle multi-step calculus, mechanics derivations, and analytical questions.\n3. **Trap Detection:** Notice negative marking rules. In FAST (-0.25), only guess if you can eliminate at least 2 distractors.\n\nWhat specific subject formula or past-paper question would you like to derive together?`;

              if (lower.includes('negative marking') || lower.includes('fast')) {
                reply = `### FAST-NUCES Marking & Strategy Breakdown\n\nFAST-NUCES entrance test uses **negative marking**:\n- **Correct answer:** $+1.0$ point\n- **Incorrect answer:** $-0.25$ point\n- **Unanswered:** $0.0$ points\n\n$$\\mathbb{E}[\\text{Score}] = p(+1.0) + (1-p)(-0.25)$$\n\n**Decision Heuristic:**\n- If you eliminate **2 options**, your chance is $p = 0.5$:\n$$\\mathbb{E}[\\text{Score}] = 0.5(1.0) - 0.5(0.25) = +0.375 > 0$$\n*Always guess if you have eliminated 2 or more options!*`;
              } else if (lower.includes('derivative') || lower.includes('differentiation') || lower.includes('calculus')) {
                reply = `### Standard Entrance Test Differentiation Rules\n\n1. **Product Rule:**\n$$\\frac{d}{dx}[u \\cdot v] = u'v + uv'$$\n\n2. **Quotient Rule:**\n$$\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{u'v - uv'}{v^2}$$\n\n3. **Chain Rule with Exponential:**\n$$\\frac{d}{dx}\\left[e^{g(x)}\\right] = g'(x) \\cdot e^{g(x)}$$\n\n*Entrance Tip:* When dealing with $y = [f(x)]^{g(x)}$, take the natural logarithm on both sides before differentiating!`;
              } else if (lower.includes('kinematic') || lower.includes('physics') || lower.includes('projectile')) {
                reply = `### High-Yield Mechanics & Kinematics Shortcuts\n\nFor constant acceleration $g$:\n1. **Maximum Height:**\n$$H = \\frac{v_0^2 \\sin^2(\\theta)}{2g}$$\n\n2. **Time of Flight:**\n$$T = \\frac{2 v_0 \\sin(\\theta)}{g}$$\n\n3. **Horizontal Range:**\n$$R = \\frac{v_0^2 \\sin(2\\theta)}{g}$$\n\n*Maximum Range:* Occurs at $\\theta = 45^\\circ$, where $R_{\\max} = \\frac{v_0^2}{g} = 2H_{\\max}$.`;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply, timestamp: new Date().toISOString(), isFallback: true }));
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
      process.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'gen-lang-client-0366509316.firebaseapp.com'
    ),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(
      process.env.VITE_FIREBASE_PROJECT_ID ?? 'gen-lang-client-0366509316'
    ),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(
      process.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'gen-lang-client-0366509316.firebasestorage.app'
    ),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '0366509316'
    ),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(
      process.env.VITE_FIREBASE_APP_ID ?? '1:0366509316:web:gen-lang-client-0366509316'
    ),
    'import.meta.env.VITE_FIREBASE_DATABASE_ID': JSON.stringify(
      process.env.VITE_FIREBASE_DATABASE_ID ?? 'ai-studio-25287ca6-33a1-49f8-8867-70061120a712'
    ),
    'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(
      process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ?? 'ai-studio-25287ca6-33a1-49f8-8867-70061120a712'
    ),
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
    hmr: process.env.DISABLE_HMR === 'true' ? false : { port: 24678 },
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});

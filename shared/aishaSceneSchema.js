/**
 * Shared Aisha Animated SVG & Data-Driven Graph Schema, SVG Sanitizer,
 * Streaming Narration Parser, and Question Hasher.
 * Used identically by client (`src/`) and server (`functions/api/ai.js`).
 */

export const SCENE_VIEWBOX_WIDTH = 380;
export const SCENE_VIEWBOX_HEIGHT = 240;
export const MAX_ANIMATION_SVG_BYTES = 6144;

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escXml = (s) => String(s || '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);
const fmtTick = (n) => (Number.isInteger(n) ? String(n) : Number(n.toFixed(1)).toString());
const utf8Bytes = (s) => new TextEncoder().encode(String(s || '')).length;

/**
 * Strips dangerous tags/attributes/external URLs from AI-generated SVG and enforces <= 6 KB.
 * Returns { ok: true, svg } or { ok: false, error }.
 */
export function sanitizeAnimationSvg(rawSvg, maxBytes = MAX_ANIMATION_SVG_BYTES) {
  if (typeof rawSvg !== 'string') return { ok: false, error: 'SVG must be a string.' };
  const trimmed = rawSvg.trim();
  if (!trimmed) return { ok: false, error: 'SVG is empty.' };
  if (utf8Bytes(trimmed) > maxBytes) {
    return { ok: false, error: `SVG exceeds ${maxBytes} byte limit.` };
  }

  // Reject outright if dangerous payloads appear (forces retry/fallback instead of partial broken SVG)
  if (/<(?:script|foreignobject|iframe|object|embed)\b/i.test(trimmed)) {
    return { ok: false, error: 'SVG contains forbidden executable or embedded tags.' };
  }
  if (/\son[a-z]+\s*=/i.test(trimmed)) {
    return { ok: false, error: 'SVG contains inline event handler attributes.' };
  }
  if (/(?:javascript|vbscript):|data\s*:\s*text\/html|@import\b/i.test(trimmed)) {
    return { ok: false, error: 'SVG contains forbidden script URI or CSS import.' };
  }
  const rawWithoutXmlns = trimmed.replace(/\sxmlns(?::[a-z0-9_-]+)?\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
  if (/(?:https?:)?\/\//i.test(rawWithoutXmlns)) {
    return { ok: false, error: 'SVG contains disallowed external URLs.' };
  }

  // Extract outermost <svg>...</svg>
  const startIdx = trimmed.search(/<svg\b/i);
  const endIdx = trimmed.toLowerCase().lastIndexOf('</svg>');
  if (startIdx < 0 || endIdx <= startIdx) {
    return { ok: false, error: 'Missing valid <svg>...</svg> root.' };
  }

  let svg = trimmed.slice(startIdx, endIdx + 6);

  // Strip any stray unsafe tags, event handlers, or external URLs defensively
  svg = svg
    .replace(/<(?:script|foreignobject|iframe|object|embed|link|meta|base|image)\b[\s\S]*?(?:<\/(?:script|foreignobject|iframe|object|embed|link|meta|base|image)>|\/>|>)/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:xlink:)?href\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*')/gi, '')
    .replace(/url\(\s*["']?(?!#)[^)]+\)/gi, 'none');

  // Verify no external HTTP(S) or protocol-relative URLs remain (except XML namespace xmlns)
  const withoutXmlns = svg.replace(/\sxmlns(?::[a-z0-9_-]+)?\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
  if (/(?:https?:)?\/\/|javascript:|vbscript:/i.test(withoutXmlns)) {
    return { ok: false, error: 'SVG contains disallowed external URLs.' };
  }

  if (!/\bviewBox\s*=/i.test(svg)) {
    svg = svg.replace(/<svg\b/i, `<svg viewBox="0 0 ${SCENE_VIEWBOX_WIDTH} ${SCENE_VIEWBOX_HEIGHT}"`);
  }

  if (utf8Bytes(svg) > maxBytes || svg.length < 32) {
    return { ok: false, error: 'Sanitized SVG is empty or oversized.' };
  }

  return { ok: true, svg };
}

/**
 * Validates and auto-repairs structured graph data:
 * sorted by x, values inside [0..xMax, 0..yMax], contiguous touching phases.
 */
export function normalizeAndValidateGraph(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const rawPts = Array.isArray(raw.points) ? raw.points : [];
  const pts = rawPts
    .slice(0, 40)
    .map((p) => {
      const x = Array.isArray(p) ? Number(p[0]) : Number(p?.x);
      const y = Array.isArray(p) ? Number(p[1]) : Number(p?.y);
      return Number.isFinite(x) && Number.isFinite(y) ? [Math.max(0, x), Math.max(0, y)] : null;
    })
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0]);

  if (pts.length < 2) return null;

  const maxPtX = Math.max(...pts.map((p) => p[0]));
  const maxPtY = Math.max(...pts.map((p) => p[1]));
  const rawXMax = Number(raw.xMax);
  const rawYMax = Number(raw.yMax);
  const xMax = Number.isFinite(rawXMax) && rawXMax >= maxPtX && rawXMax > 0 ? rawXMax : Math.max(1, maxPtX);
  const yMax = Number.isFinite(rawYMax) && rawYMax >= maxPtY && rawYMax > 0 ? rawYMax : Math.max(1, maxPtY);

  const clampedPts = pts.map(([x, y]) => [Math.min(xMax, Math.max(0, x)), Math.min(yMax, Math.max(0, y))]);
  const lastIdx = clampedPts.length - 1;

  // Repair phases so every phase touches the next end-to-start (0 -> ... -> lastIdx)
  const rawPhases = Array.isArray(raw.phases) ? raw.phases : [];
  const parsedPhases = rawPhases
    .map((ph) => ({
      fromIndex: Math.max(0, Math.min(lastIdx - 1, Math.floor(Number(ph?.fromIndex)))),
      toIndex: Math.max(1, Math.min(lastIdx, Math.floor(Number(ph?.toIndex)))),
      label: String(ph?.label || '').trim().slice(0, 28),
    }))
    .filter((ph) => Number.isFinite(ph.fromIndex) && Number.isFinite(ph.toIndex) && ph.toIndex > ph.fromIndex)
    .sort((a, b) => a.fromIndex - b.fromIndex);

  const phases = [];
  if (parsedPhases.length > 0) {
    let cursor = 0;
    for (let i = 0; i < parsedPhases.length; i++) {
      const targetTo = i === parsedPhases.length - 1 ? lastIdx : Math.max(cursor + 1, Math.min(lastIdx, parsedPhases[i].toIndex));
      if (cursor < targetTo) {
        phases.push({ fromIndex: cursor, toIndex: targetTo, label: parsedPhases[i].label || `Phase ${phases.length + 1}` });
        cursor = targetTo;
      }
      if (cursor >= lastIdx) break;
    }
    if (cursor < lastIdx && phases.length > 0) phases[phases.length - 1].toIndex = lastIdx;
  } else {
    for (let i = 0; i < lastIdx; i++) {
      phases.push({ fromIndex: i, toIndex: i + 1, label: `Step ${i + 1}` });
    }
  }

  return {
    xLabel: String(raw.xLabel || 'Time (s)').trim().slice(0, 32),
    yLabel: String(raw.yLabel || 'Value').trim().slice(0, 32),
    xMax,
    yMax,
    points: clampedPts,
    phases,
  };
}

/**
 * Small data-driven helper (<60 lines) converting structured `graph` data into a crisp animated SVG
 * inside viewBox 0..380 x 0..240: one set of axes with arrowheads, aligned ticks/grid, one connected
 * polyline through all points, contiguous phase labels + highlight, and synced moving dot.
 */
export function buildGraphSvg(graph, { totalDuration = 9, activePhase = -1 } = {}) {
  const g = normalizeAndValidateGraph(graph);
  if (!g) return '';
  const ox = 56, oy = 194, pw = 300, ph = 158, dur = Math.max(1.5, Number(totalDuration) || 9);
  const toX = (x) => +(ox + (x / g.xMax) * pw).toFixed(1);
  const toY = (y) => +(oy - (y / g.yMax) * ph).toFixed(1);
  const coords = g.points.map(([x, y]) => [toX(x), toY(y)]);
  const polyPoints = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const pathD = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  let totalLen = 0;
  for (let i = 1; i < coords.length; i++) {
    totalLen += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
  }
  const dash = Math.max(1, Math.ceil(totalLen));
  const palette = ['#0ea5e9', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6'];
  const grid = [];
  for (let i = 0; i <= 4; i++) {
    const gx = +(ox + (i / 4) * pw).toFixed(1), gy = +(oy - (i / 4) * ph).toFixed(1);
    if (i > 0) {
      grid.push(`<line x1="${gx}" y1="${oy - ph}" x2="${gx}" y2="${oy}" stroke="#cbd5e1" stroke-opacity=".35" stroke-dasharray="3 3"/>`);
      grid.push(`<line x1="${ox}" y1="${gy}" x2="${ox + pw}" y2="${gy}" stroke="#cbd5e1" stroke-opacity=".35" stroke-dasharray="3 3"/>`);
    }
    grid.push(`<text x="${gx}" y="${oy + 16}" text-anchor="middle" font-size="12" fill="#475569">${fmtTick((g.xMax * i) / 4)}</text>`);
    grid.push(`<text x="${ox - 8}" y="${gy + 4}" text-anchor="end" font-size="12" fill="#475569">${fmtTick((g.yMax * i) / 4)}</text>`);
  }
  const phaseMarkup = g.phases.map((p, idx) => {
    const slice = coords.slice(p.fromIndex, p.toIndex + 1);
    const mid = slice[Math.floor(slice.length / 2)] || slice[0];
    const isAct = activePhase === idx;
    const col = palette[idx % palette.length];
    const ly = Math.max(22, Math.min(oy - 14, mid[1] - (idx % 2 === 0 ? 12 : 26)));
    return `<polyline data-phase="${idx}" points="${slice.map((c) => c.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="${isAct ? 5 : 3}" stroke-opacity="${isAct ? 0.95 : 0.35}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<text x="${mid[0]}" y="${ly}" text-anchor="middle" font-size="12" font-weight="${isAct ? 700 : 600}" fill="${col}">${escXml(p.label)}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 240" width="100%" height="100%">` +
    `<defs><marker id="ax" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1L9 5L1 9z" fill="#334155"/></marker></defs>` +
    `<style>@keyframes grDraw{from{stroke-dashoffset:${dash}}to{stroke-dashoffset:0}}.gr-line{stroke-dasharray:${dash};stroke-dashoffset:${dash};animation:grDraw ${dur}s linear forwards}</style>` +
    `<rect x="0" y="0" width="380" height="240" rx="12" fill="#f8fafc"/>` +
    grid.join('') +
    `<line data-axis="x" x1="${ox}" y1="${oy}" x2="${ox + pw + 10}" y2="${oy}" stroke="#334155" stroke-width="2" marker-end="url(#ax)"/>` +
    `<line data-axis="y" x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - ph - 12}" stroke="#334155" stroke-width="2" marker-end="url(#ax)"/>` +
    `<text x="${ox + pw / 2}" y="232" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">${escXml(g.xLabel)}</text>` +
    `<text x="16" y="${oy - ph / 2}" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a" transform="rotate(-90 16 ${oy - ph / 2})">${escXml(g.yLabel)}</text>` +
    phaseMarkup +
    `<polyline data-connected-curve="true" class="gr-line" points="${polyPoints}" fill="none" stroke="#0284c7" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle r="5.5" fill="#e11d48" stroke="#ffffff" stroke-width="2"><animateMotion dur="${dur}s" fill="freeze" path="${pathD}"/></circle></svg>`;
}

export function normalizePhysicsStep(raw, prevEnd = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const narration = String(raw.narration || '').trim().slice(0, 420);
  if (!narration) return null;
  const equation = typeof raw.equation === 'string' ? raw.equation.trim().slice(0, 260) : '';
  const rawFrom = Number(raw.from);
  const rawTo = Number(raw.to);
  const from = Number.isFinite(rawFrom) && rawFrom >= prevEnd ? +rawFrom.toFixed(2) : +prevEnd.toFixed(2);
  const to = Number.isFinite(rawTo) && rawTo > from ? +rawTo.toFixed(2) : +(from + 3).toFixed(2);
  return { from, to, narration, equation };
}

export function extractJsonObjectText(rawText) {
  const s = String(rawText || '').trim();
  if (!s) return '';
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : s).trim();
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) return '';
  return candidate.slice(firstBrace, lastBrace + 1);
}

/**
 * Strictly validates an Aisha animated SVG / graph scene reply.
 * Returns { valid: true, scene } or { valid: false, error }.
 */
export function validatePhysicsScene(input, maxSteps = 12) {
  let obj = input;
  if (typeof input === 'string') {
    const jsonSlice = extractJsonObjectText(input);
    if (!jsonSlice) return { valid: false, error: 'Response did not contain a JSON object.' };
    try {
      obj = JSON.parse(jsonSlice);
    } catch (err) {
      return { valid: false, error: `Invalid JSON: ${err?.message || 'parse failed'}` };
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { valid: false, error: 'Scene must be a JSON object.' };
  }

  const title = String(obj.title || '').trim().slice(0, 120);
  if (!title) return { valid: false, error: 'Scene is missing a non-empty title.' };
  if (!Array.isArray(obj.steps) || obj.steps.length === 0) {
    return { valid: false, error: 'Scene must contain at least one step.' };
  }

  const cap = Math.max(1, Math.min(12, Math.floor(Number(maxSteps) || 12)));
  const steps = [];
  let cursor = 0;
  for (const rawStep of obj.steps.slice(0, cap)) {
    const norm = normalizePhysicsStep(rawStep, cursor);
    if (norm) {
      steps.push(norm);
      cursor = norm.to;
    }
  }
  if (steps.length === 0) return { valid: false, error: 'Scene steps had invalid narration.' };

  const graph = obj.graph ? normalizeAndValidateGraph(obj.graph) : null;
  if (obj.graph && !graph) {
    return { valid: false, error: 'Graph data was invalid or had fewer than 2 points.' };
  }

  const rawSvg = typeof obj.animationSvg === 'string' ? obj.animationSvg.trim() : '';
  let animationSvg = '';
  if (rawSvg) {
    const check = sanitizeAnimationSvg(rawSvg, MAX_ANIMATION_SVG_BYTES);
    if (!check.ok) return { valid: false, error: check.error };
    animationSvg = check.svg;
  }

  const graphOnly = Boolean(obj.graphOnly) || (!animationSvg && Boolean(graph));
  if (!animationSvg && !graph) {
    return { valid: false, error: 'Scene requires a valid animationSvg or structured graph.' };
  }

  return {
    valid: true,
    scene: {
      title,
      steps,
      animationSvg,
      ...(graph ? { graph } : {}),
      ...(graphOnly ? { graphOnly: true } : {}),
      totalDuration: steps[steps.length - 1].to,
    },
  };
}

/**
 * Incremental streaming parser for Aisha's JSON reply.
 * Streams title & step narrations immediately before animationSvg completes (never shows raw code).
 */
export function extractStreamingPhysicsScene(partialText, maxSteps = 12) {
  const raw = String(partialText || '');
  const stripped = raw.replace(/^[\s`]*json\s*/i, '').replace(/^```(?:json)?/i, '');
  const firstBrace = stripped.indexOf('{');
  if (firstBrace < 0) return null;
  const s = stripped.slice(firstBrace);

  let title = '';
  const titleMatch = s.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (titleMatch) {
    try {
      title = JSON.parse(`"${titleMatch[1]}"`).trim().slice(0, 120);
    } catch {
      title = titleMatch[1].trim().slice(0, 120);
    }
  }

  const stepsKeyIdx = s.search(/"steps"\s*:\s*\[/);
  if (stepsKeyIdx < 0) {
    return title ? { title, steps: [], animationSvg: '', totalDuration: 3, isComplete: false } : null;
  }
  const arrStart = s.indexOf('[', stepsKeyIdx);
  if (arrStart < 0) return null;

  const steps = [];
  const cap = Math.max(1, Math.min(12, Math.floor(Number(maxSteps) || 12)));
  let inString = false, escapeNext = false, depth = 0, objStart = -1, arrClosed = false, cursor = 0;

  for (let i = arrStart + 1; i < s.length; i++) {
    const ch = s[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\' && inString) { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') { if (depth === 0) objStart = i; depth++; }
    else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart >= 0) {
        try {
          const norm = normalizePhysicsStep(JSON.parse(s.slice(objStart, i + 1)), cursor);
          if (norm && steps.length < cap) { steps.push(norm); cursor = norm.to; }
        } catch { /* ignore partial */ }
        objStart = -1;
      }
    } else if (ch === ']' && depth === 0) { arrClosed = true; break; }
  }

  if (!title && steps.length === 0) return null;
  return {
    title: title || 'Physics Animation',
    steps,
    animationSvg: '',
    totalDuration: steps.length > 0 ? steps[steps.length - 1].to : 3,
    isComplete: arrClosed && s.trimEnd().endsWith('}'),
  };
}

export function parseStoredPhysicsScene(text) {
  const s = String(text || '').trim();
  if (!s || (!s.startsWith('{') && !s.startsWith('```'))) return null;
  if (!s.includes('"steps"') || (!s.includes('"animationSvg"') && !s.includes('"graph"'))) return null;
  const res = validatePhysicsScene(s, 12);
  return res.valid ? res.scene : null;
}

export function normalizePhysicsQuestion(question) {
  return String(question || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.+\-*/^=]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashPhysicsQuestion(question, depthId) {
  const normalized = `${normalizePhysicsQuestion(question)}::d${Number(depthId) || 0}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= (c + i) & 0xff;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `aisha_${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export function isGraphOnlyQuery(rawText) {
  const lower = String(rawText || '').toLowerCase();
  if (!/\b(graph|plot|v-t|d-t|s-t|a-t)\b/.test(lower)) return false;
  return /\b(?:only|just)\b[^.!?\n]{0,36}\b(?:graph|plot)\b|\b(?:graph|plot)\s+only\b/.test(lower);
}

export function isPhysicsVisualQuery(rawText) {
  const clean = String(rawText || '').trim();
  if (!clean) return false;
  const lower = clean.toLowerCase();
  const greetingOnly =
    /^(hi|hello|hey|salam|salaam|assalam[- ]?o[- ]?alaikum|aoa|asalam|good\s+(morning|afternoon|evening|night)|how\s+are\s+you|kya\s+haal|kaise\s+ho|kaisi\s+ho|thanks|thank\s+you|shukriya|ok|okay|nice|cool|bye|khuda\s+hafiz|allah\s+hafiz|who\s+are\s+you|what\s+is\s+your\s+name|ap\s+kon\s+ho|tum\s+kon\s+ho)[!.,?\s]*$/i;
  if (greetingOnly.test(lower)) return false;

  const physicsPattern =
    /\b(physics|projectile|free\s*fall|gravity|velocity|acceleration|displacement|distance|speed|time|graph|inclined\s*plane|slope|ramp|friction|force|newton|momentum|impulse|work|energy|power|kinetic|potential|torque|moment|bending\s*moment|bridge|beam|truck|load|shear|cone|tank|water|filling|flow\s*rate|circuit|resistor|voltage|current|ohm|series|parallel|capacitor|inductor|battery|lens|mirror|refraction|reflection|optics|wave|frequency|wavelength|doppler|pendulum|shm|harmonic|spring|hooke|electric|magnetic|field|flux|faraday|vector|component|circular\s*motion|centripetal|orbit|satellite|pressure|buoyancy|archimedes|bernoulli|thermo|heat|entropy|gas|boyle|charles|nuclear|half[- ]?life|photoelectric|bohr|atom|kinematics|dynamics|statics|m\/s|m\/s2|km\/h|kg|joule|watt|volt|ampere|ohm|hz|rad|theta|g\s*=\s*9\.8|f\s*=\s*ma|v\s*=\s*u|s\s*=\s*ut)\b/i;
  if (physicsPattern.test(lower)) return true;

  if (/\d/.test(lower) && /(find|calculate|solve|derive|determine|what|how|angle|height|range|time|mass|speed|distance|rate|draw|show|explain|animate|diagram)/i.test(lower)) {
    return true;
  }

  const words = lower.split(/\s+/).filter(Boolean);
  return words.length >= 5 && /(explain|draw|show|animate|derive|graph|diagram|formula|law|motion|rate|solve|numerical|samjha|batao)/i.test(lower);
}

/**
 * Concise JSON contract for Aisha's self-contained illustrated SVG animation & data-driven graphs.
 */
export function buildAishaVisualSchemaInstruction({ maxSteps, question }) {
  const graphOnly = isGraphOnlyQuery(question);
  return (
    `ANIMATED PHYSICS JSON MODE (STRICT RAW JSON ONLY — NO MARKDOWN OR EXTRA TEXT):\n` +
    `Put "title" and "steps" FIRST so narration streams first, then "animationSvg" and optional "graph":\n` +
    `{"title":"Short clear title","steps":[{"from":0,"to":3,"narration":"Warm step explanation","equation":"LaTeX without $"}],"animationSvg":"<svg viewBox=\\"0 0 380 240\\" ...>...</svg>","graph":{"xLabel":"Time (s)","yLabel":"Velocity (m/s)","xMax":10,"yMax":20,"points":[[0,0],[4,20],[7,20],[10,0]],"phases":[{"fromIndex":0,"toIndex":1,"label":"Accelerate"},{"fromIndex":1,"toIndex":2,"label":"Cruise"},{"fromIndex":2,"toIndex":3,"label":"Brake"}]}}\n` +
    `Rules:\n` +
    `- Use 2 to ${maxSteps} steps with contiguous from/to seconds sharing ONE total timeline (T = last step's "to").\n` +
    `- animationSvg: draw REAL illustrated objects (car with spinning wheels, road, sky, water, lenses, vectors, labels) using gradients, outlines, and soft shadows—NEVER bare stick lines. Objects must move, rotate, fill, or fade to match the real physics (e.g. car accelerates, cruises, brakes with spinning wheels & growing/shrinking speed arrow). Use ONLY transform, opacity, and stroke-dashoffset in CSS @keyframes or SMIL sharing duration T. Keep SVG under 5.5 KB, viewBox="0 0 380 240", all text >= 12px. FORBIDDEN: <script>, <foreignObject>, on* attributes, external URLs.\n` +
    `- graph (include whenever the student asks for a graph/plot/curve/line): use the student's exact numbers, sorted by x, inside [0..xMax, 0..yMax], with contiguous phases touching end-to-start.` +
    (graphOnly ? ` The student asked for ONLY a graph: set "graphOnly":true, omit "animationSvg", and provide an exact "graph" object.` : ` Omit "graph" if no graph is needed.`)
  );
}

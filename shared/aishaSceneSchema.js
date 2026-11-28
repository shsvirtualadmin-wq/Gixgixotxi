/**
 * Shared Aisha Visual Physics Scene Schema, Streaming Incremental Step Parser,
 * Question Classifier, Normalizer/Hasher, and Physics Template Detector.
 *
 * Used identically by both client (`src/`) and server (`functions/api/ai.js`).
 */

export const SCENE_VIEWBOX_WIDTH = 400;
export const SCENE_VIEWBOX_HEIGHT = 240;

const ALLOWED_SHAPE_TYPES = new Set(['line', 'rect', 'circle', 'arrow', 'label', 'curve']);

function clampNum(val, min, max, fallback = 0) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function sanitizeColor(raw, fallback = '#0ea5e9') {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  if (/^(rgb|rgba|hsl|hsla)\([0-9.,%\s]+\)$/i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z]{3,20}$/.test(trimmed)) return trimmed;
  return fallback;
}

/**
 * Validates and normalizes a single whiteboard shape.
 * Returns normalized shape or null if structurally invalid.
 */
export function normalizePhysicsShape(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = String(raw.type || '').trim().toLowerCase();
  if (!ALLOWED_SHAPE_TYPES.has(type)) return null;

  const stroke = sanitizeColor(raw.stroke ?? raw.color, '#0ea5e9');
  const fill = raw.fill ? sanitizeColor(raw.fill, 'none') : 'none';
  const strokeWidth = clampNum(raw.strokeWidth ?? raw.width, 1, 8, 2.2);
  const dashed = Boolean(raw.dashed);
  const label = typeof raw.label === 'string' ? raw.label.trim().slice(0, 48) : undefined;

  if (type === 'line' || type === 'arrow') {
    if (
      !Number.isFinite(Number(raw.x1)) ||
      !Number.isFinite(Number(raw.y1)) ||
      !Number.isFinite(Number(raw.x2)) ||
      !Number.isFinite(Number(raw.y2))
    ) {
      return null;
    }
    return {
      type,
      x1: clampNum(raw.x1, 0, SCENE_VIEWBOX_WIDTH, 20),
      y1: clampNum(raw.y1, 0, SCENE_VIEWBOX_HEIGHT, 120),
      x2: clampNum(raw.x2, 0, SCENE_VIEWBOX_WIDTH, 360),
      y2: clampNum(raw.y2, 0, SCENE_VIEWBOX_HEIGHT, 120),
      stroke,
      strokeWidth,
      dashed,
      ...(label ? { label } : {}),
    };
  }

  if (type === 'rect') {
    const w = clampNum(raw.w ?? raw.width, 2, SCENE_VIEWBOX_WIDTH, 40);
    const h = clampNum(raw.h ?? raw.height, 2, SCENE_VIEWBOX_HEIGHT, 30);
    if (!Number.isFinite(Number(raw.x)) || !Number.isFinite(Number(raw.y))) return null;
    return {
      type: 'rect',
      x: clampNum(raw.x, 0, SCENE_VIEWBOX_WIDTH - 2, 20),
      y: clampNum(raw.y, 0, SCENE_VIEWBOX_HEIGHT - 2, 20),
      w,
      h,
      stroke,
      fill,
      strokeWidth,
      dashed,
      ...(label ? { label } : {}),
    };
  }

  if (type === 'circle') {
    const cx = Number(raw.cx ?? raw.x);
    const cy = Number(raw.cy ?? raw.y);
    const r = Number(raw.r ?? raw.radius);
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r) || r <= 0) return null;
    return {
      type: 'circle',
      cx: clampNum(cx, 0, SCENE_VIEWBOX_WIDTH, 200),
      cy: clampNum(cy, 0, SCENE_VIEWBOX_HEIGHT, 120),
      r: clampNum(r, 2, 110, 12),
      stroke,
      fill,
      strokeWidth,
      dashed,
      ...(label ? { label } : {}),
    };
  }

  if (type === 'label') {
    const text = String(raw.text ?? raw.label ?? '').trim().slice(0, 80);
    if (!text || !Number.isFinite(Number(raw.x)) || !Number.isFinite(Number(raw.y))) return null;
    return {
      type: 'label',
      x: clampNum(raw.x, 4, SCENE_VIEWBOX_WIDTH - 4, 200),
      y: clampNum(raw.y, 12, SCENE_VIEWBOX_HEIGHT - 4, 120),
      text,
      color: sanitizeColor(raw.color ?? raw.stroke, '#e2e8f0'),
      size: clampNum(raw.size, 9, 20, 12),
    };
  }

  if (type === 'curve') {
    // Accepts either points: [[x,y], ...] OR quadratic (x1,y1,cx,cy,x2,y2)
    let points = [];
    if (Array.isArray(raw.points) && raw.points.length >= 2) {
      points = raw.points
        .slice(0, 24)
        .map((pt) => {
          if (Array.isArray(pt) && pt.length >= 2) {
            return [
              clampNum(pt[0], 0, SCENE_VIEWBOX_WIDTH, 0),
              clampNum(pt[1], 0, SCENE_VIEWBOX_HEIGHT, 0),
            ];
          }
          if (pt && typeof pt === 'object' && Number.isFinite(Number(pt.x)) && Number.isFinite(Number(pt.y))) {
            return [
              clampNum(pt.x, 0, SCENE_VIEWBOX_WIDTH, 0),
              clampNum(pt.y, 0, SCENE_VIEWBOX_HEIGHT, 0),
            ];
          }
          return null;
        })
        .filter(Boolean);
    } else if (
      Number.isFinite(Number(raw.x1)) &&
      Number.isFinite(Number(raw.y1)) &&
      Number.isFinite(Number(raw.cx)) &&
      Number.isFinite(Number(raw.cy)) &&
      Number.isFinite(Number(raw.x2)) &&
      Number.isFinite(Number(raw.y2))
    ) {
      points = [
        [clampNum(raw.x1, 0, SCENE_VIEWBOX_WIDTH, 20), clampNum(raw.y1, 0, SCENE_VIEWBOX_HEIGHT, 200)],
        [clampNum(raw.cx, 0, SCENE_VIEWBOX_WIDTH, 200), clampNum(raw.cy, 0, SCENE_VIEWBOX_HEIGHT, 40)],
        [clampNum(raw.x2, 0, SCENE_VIEWBOX_WIDTH, 380), clampNum(raw.y2, 0, SCENE_VIEWBOX_HEIGHT, 200)],
      ];
    }
    if (points.length < 2) return null;
    return {
      type: 'curve',
      points,
      stroke,
      strokeWidth,
      dashed,
      ...(label ? { label } : {}),
    };
  }

  return null;
}

export function normalizePhysicsStep(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const narration = String(raw.narration || '').trim().slice(0, 420);
  if (!narration) return null;
  const equation = typeof raw.equation === 'string' ? raw.equation.trim().slice(0, 260) : '';
  const rawShapes = Array.isArray(raw.shapes) ? raw.shapes : [];
  const shapes = rawShapes.slice(0, 28).map(normalizePhysicsShape).filter(Boolean);
  if (shapes.length === 0) return null;
  return {
    narration,
    equation,
    shapes,
  };
}

/**
 * Strips optional ```json ... ``` fences and extracts the outermost JSON object if present.
 */
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
 * Strictly validates an Aisha animated physics scene object or JSON string.
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
  if (!title) {
    return { valid: false, error: 'Scene is missing a non-empty title.' };
  }

  if (!Array.isArray(obj.steps) || obj.steps.length === 0) {
    return { valid: false, error: 'Scene must contain at least one valid step.' };
  }

  const cap = Math.max(1, Math.min(12, Math.floor(Number(maxSteps) || 12)));
  const steps = obj.steps.slice(0, cap).map(normalizePhysicsStep).filter(Boolean);
  if (steps.length === 0) {
    return { valid: false, error: 'Scene steps had invalid narration or shapes.' };
  }

  return {
    valid: true,
    scene: {
      title,
      steps,
    },
  };
}

/**
 * Incremental streaming parser for Aisha's JSON scene output.
 * Extracts `title` and every completed step object inside `"steps": [...]` as tokens stream in,
 * allowing the whiteboard to draw Step 1 immediately while Step 2..N are still generating.
 */
export function extractStreamingPhysicsScene(partialText, maxSteps = 12) {
  const raw = String(partialText || '');
  const stripped = raw.replace(/^[\s`]*json\s*/i, '').replace(/^```(?:json)?/i, '');
  const firstBrace = stripped.indexOf('{');
  if (firstBrace < 0) return null;
  const s = stripped.slice(firstBrace);

  // Extract title as soon as complete string closes
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
    return title ? { title, steps: [], isComplete: false } : null;
  }

  const arrStart = s.indexOf('[', stepsKeyIdx);
  if (arrStart < 0) {
    return title ? { title, steps: [], isComplete: false } : null;
  }

  const steps = [];
  const cap = Math.max(1, Math.min(12, Math.floor(Number(maxSteps) || 12)));
  let inString = false;
  let escapeNext = false;
  let depth = 0;
  let objStart = -1;
  let arrClosed = false;

  for (let i = arrStart + 1; i < s.length; i++) {
    const ch = s[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart >= 0) {
        const candidateStr = s.slice(objStart, i + 1);
        try {
          const parsedStep = JSON.parse(candidateStr);
          const normalized = normalizePhysicsStep(parsedStep);
          if (normalized && steps.length < cap) {
            steps.push(normalized);
          }
        } catch {
          // Ignore malformed partial object
        }
        objStart = -1;
      }
    } else if (ch === ']' && depth === 0) {
      arrClosed = true;
      break;
    }
  }

  if (!title && steps.length === 0) return null;
  return {
    title: title || 'Physics Whiteboard',
    steps,
    isComplete: arrClosed,
  };
}

/**
 * Checks whether a serialized message text is a stored Aisha visual physics scene.
 */
export function parseStoredPhysicsScene(text) {
  const s = String(text || '').trim();
  if (!s || (!s.startsWith('{') && !s.startsWith('```'))) return null;
  if (!s.includes('"steps"') || !s.includes('"shapes"')) return null;
  const res = validatePhysicsScene(s, 12);
  return res.valid ? res.scene : null;
}

/**
 * Normalizes a physics question for deterministic cache keys.
 */
export function normalizePhysicsQuestion(question) {
  return String(question || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.+\-*/^=]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fast, synchronous, cross-runtime FNV-1a 64-bit hex hash of normalized question + depth.
 * Runs in <0.02ms on both Cloudflare Workers and browsers without async crypto latency.
 */
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

/**
 * Detects whether the user's message is a greeting/small-talk/off-topic message
 * vs. a physics question that should produce an animated whiteboard scene.
 */
export function isPhysicsVisualQuery(rawText) {
  const clean = String(rawText || '').trim();
  if (!clean) return false;
  const lower = clean.toLowerCase();

  // Pure greetings / short conversational chatter -> warm 1-line text reply, NOT a whiteboard JSON
  const greetingOnly =
    /^(hi|hello|hey|salam|salaam|assalam[- ]?o[- ]?alaikum|aoa|asalam|good\s+(morning|afternoon|evening|night)|how\s+are\s+you|kya\s+haal|kaise\s+ho|kaisi\s+ho|thanks|thank\s+you|shukriya|ok|okay|nice|cool|bye|khuda\s+hafiz|allah\s+hafiz|who\s+are\s+you|what\s+is\s+your\s+name|ap\s+kon\s+ho|tum\s+kon\s+ho)[!.,?\s]*$/i;
  if (greetingOnly.test(lower)) return false;

  // Explicit physics keywords, formulas, units, or numericals -> visual whiteboard scene
  const physicsPattern =
    /\b(physics|projectile|free\s*fall|gravity|velocity|acceleration|displacement|distance|speed|time|graph|inclined\s*plane|slope|ramp|friction|force|newton|momentum|impulse|work|energy|power|kinetic|potential|torque|moment|bending\s*moment|bridge|beam|truck|load|shear|cone|tank|water|filling|flow\s*rate|circuit|resistor|voltage|current|ohm|series|parallel|capacitor|inductor|battery|lens|mirror|refraction|reflection|optics|wave|frequency|wavelength|doppler|pendulum|shm|harmonic|spring|hooke|electric|magnetic|field|flux|faraday|vector|component|circular\s*motion|centripetal|orbit|satellite|pressure|buoyancy|archimedes|bernoulli|thermo|heat|entropy|gas|boyle|charles|nuclear|half[- ]?life|photoelectric|bohr|atom|kinematics|dynamics|statics|m\/s|m\/s2|km\/h|kg|joule|watt|volt|ampere|ohm|hz|rad|theta|g\s*=\s*9\.8|f\s*=\s*ma|v\s*=\s*u|s\s*=\s*ut)\b/i;
  if (physicsPattern.test(lower)) return true;

  // Numerical problem heuristic (contains digits + units or question words)
  if (/\d/.test(lower) && /(find|calculate|solve|derive|determine|what|how|angle|height|range|time|mass|speed|distance|rate|draw|show|explain|animate|diagram)/i.test(lower)) {
    return true;
  }

  // Explicitly asking to explain/draw/animate something substantive (>= 5 words)
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length >= 5 && /(explain|draw|show|animate|derive|graph|diagram|formula|law|motion|rate|solve|numerical|samjha|batao)/i.test(lower)) {
    return true;
  }

  return false;
}

/**
 * Matches a physics question to one of the 7 starter visual templates (or free composition).
 */
export function detectPhysicsTemplate(rawText) {
  const lower = String(rawText || '').toLowerCase();
  if (/projectile|trajectory|launch\s+angle|horizontal\s+range|max(imum)?\s+height/.test(lower)) {
    return {
      key: 'projectile_motion',
      hint: 'Template: Projectile Motion — ground line y=205, launch point (50,205), parabolic curve peaking near (200,55) landing (350,205), velocity vectors vx/vy, height H & range R arrows.',
    };
  }
  if (/free\s*fall|dropped|falling\s+object|vertical\s+drop|terminal\s+velocity/.test(lower)) {
    return {
      key: 'free_fall',
      hint: 'Template: Free Fall — building/cliff rect on left, falling ball circles at t=0,1,2,3s with increasing spacing, downward gravity arrow g=9.8 m/s², ground line y=215.',
    };
  }
  if (/bridge|bending\s*moment|beam|truck|simply\s*supported|shear\s*force/.test(lower)) {
    return {
      key: 'bridge_bending_moment',
      hint: 'Template: Truck on Bridge + Bending Moment — upper bridge beam y=95 with supports at x=60 and x=340, truck rect + wheels on beam, downward load arrow W, lower bending moment triangular/parabolic diagram y=145..215.',
    };
  }
  if (/cone|tank|filling|rate\s*graph|drain|funnel|water\s*level|dh\/dt|dv\/dt/.test(lower)) {
    return {
      key: 'tank_filling_rate',
      hint: 'Template: Cone/Tank Filling + Rate Graph — left side (x=30..180): tapered cone or tank outline with rising water levels & inflow arrow; right side (x=215..380): axes with height vs time rate curve.',
    };
  }
  if (/(distance|displacement|velocity|speed)[\s-]*time\s*graph|v-t\s*graph|d-t\s*graph|s-t\s*graph|kinematics\s*graph/.test(lower)) {
    return {
      key: 'kinematics_graphs',
      hint: 'Template: Distance-Time & Velocity-Time Graphs — crisp x/y axes (origin 55,200), labeled segments (constant speed line, acceleration slope, area under v-t curve shaded rect/triangle).',
    };
  }
  if (/inclined\s*plane|incline|ramp|wedge|slope|friction\s*on\s*slope|mg\s*sin/.test(lower)) {
    return {
      key: 'inclined_plane',
      hint: 'Template: Inclined Plane — right triangle ramp (60,205)-(340,205)-(340,75), angle θ label, block rect on slope, force arrows mg (down), N (normal), mg sinθ (along slope), friction f.',
    };
  }
  if (/circuit|resistor|ohm|series|parallel|battery|kirchhoff|current|voltage|voltmeter|ammeter/.test(lower)) {
    return {
      key: 'simple_circuits',
      hint: 'Template: Simple Circuit — rectangular wire loop (70,55)-(330,185), battery lines on left, resistor zig-zag/rect on top/right, current direction arrows I, labels V, R, I.',
    };
  }
  return {
    key: 'free_compose',
    hint: 'Compose a clean, well-proportioned physics diagram freely inside viewBox 0..400 x 0..240.',
  };
}

/**
 * Concise, token-efficient visual JSON contract appended for Aisha when visual mode is active.
 */
export function buildAishaVisualSchemaInstruction({ maxSteps, question }) {
  const tpl = detectPhysicsTemplate(question);
  return (
    `VISUAL WHITEBOARD MODE (STRICT JSON ONLY):\n` +
    `Reply ONLY with a single raw JSON object (no markdown fences, no text outside JSON):\n` +
    `{"title":"Short clear title","steps":[{"narration":"Warm clear step explanation in student language","equation":"LaTeX equation without $ delimiters","shapes":[...]}]}\n` +
    `Rules:\n` +
    `- Use 2 to ${maxSteps} steps (NEVER exceed ${maxSteps}).\n` +
    `- Coordinate space: x in 0..400, y in 0..240 (keep labels inside 16..384 x 18..228).\n` +
    `- Allowed shape objects:\n` +
    `  {"type":"line","x1":0,"y1":0,"x2":100,"y2":100,"stroke":"#0ea5e9","dashed":false}\n` +
    `  {"type":"arrow","x1":0,"y1":0,"x2":100,"y2":0,"stroke":"#e11d48","label":"v0"}\n` +
    `  {"type":"rect","x":40,"y":60,"w":60,"h":40,"stroke":"#f59e0b","fill":"rgba(245,158,11,0.18)"}\n` +
    `  {"type":"circle","cx":120,"cy":100,"r":14,"stroke":"#10b981","fill":"rgba(16,185,129,0.22)"}\n` +
    `  {"type":"curve","points":[[50,200],[200,50],[350,200]],"stroke":"#0ea5e9"}\n` +
    `  {"type":"label","x":200,"y":30,"text":"Max Height H","color":"#0f172a"}\n` +
    `- Each step should build logically on the previous diagram so the student watches the physics unfold step by step.\n` +
    `- ${tpl.hint}`
  );
}

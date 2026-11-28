import aiConfig from '../../ai-config.json';
import {
  AISHA_MENTOR_ID,
  BASE_AI_SYSTEM_PROMPT,
  getDepthBaseCostForMentor,
  resolveAiDepthExecution,
  trimContentsForDepth,
  parseStrictDepthId,
  parseStrictMentorId,
  type AiDepthExecutionPlan,
} from '../../shared/aiDepthRouter.js';
import {
  buildGraphSvg,
  extractStreamingPhysicsScene,
  hashPhysicsQuestion,
  isGraphOnlyQuery,
  isPhysicsVisualQuery,
  normalizeAndValidateGraph,
  normalizePhysicsQuestion,
  parseStoredPhysicsScene,
  sanitizeAnimationSvg,
  validatePhysicsScene,
  type PhysicsGraphData,
  type PhysicsGraphPhase,
  type PhysicsScene,
  type PhysicsSceneStep,
  type StreamingPhysicsScene,
} from '../../shared/aishaSceneSchema.js';

export {
  AISHA_MENTOR_ID,
  BASE_AI_SYSTEM_PROMPT,
  getDepthBaseCostForMentor,
  resolveAiDepthExecution,
  trimContentsForDepth,
  parseStrictDepthId,
  parseStrictMentorId,
  buildGraphSvg,
  extractStreamingPhysicsScene,
  hashPhysicsQuestion,
  isGraphOnlyQuery,
  isPhysicsVisualQuery,
  normalizeAndValidateGraph,
  normalizePhysicsQuestion,
  parseStoredPhysicsScene,
  sanitizeAnimationSvg,
  validatePhysicsScene,
  type AiDepthExecutionPlan,
  type PhysicsGraphData,
  type PhysicsGraphPhase,
  type PhysicsScene,
  type PhysicsSceneStep,
  type StreamingPhysicsScene,
};

export type AiDepthId = 0 | 1 | 2 | 3;
export type AiMentorId = 0 | 1 | 2 | 3 | 4 | 5;
export type AiMentorSlug = 'noor' | 'zain' | 'sehar' | 'hamza' | 'mahnoor' | 'aisha';
export type AiPlan = 'free' | 'pro' | 'plus';

export interface AiDepthConfig {
  id: AiDepthId;
  key: 'quick' | 'balanced' | 'deep' | 'max';
  label: string;
  baseCost: number;
  model: string;
  fallbackModels?: string[];
  thinkingLevel:
    | 'none'
    | 'minimal'
    | 'low'
    | 'medium'
    | 'high'
    | 'xhigh'
    | 'NONE'
    | 'MINIMAL'
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
    | 'XHIGH';
  maxOutputTokens: number;
  targetVisibleTokens?: number;
  maxHistoryMessages?: number;
  freeAllowed: boolean;
  speed: number;
  detail: number;
  accuracy: number;
  subtitle: string;
  instruction?: string;
}

export interface AiMentorConfig {
  id: AiMentorId;
  slug: AiMentorSlug;
  aliases?: string[];
  name: string;
  voice: 'female' | 'male';
  role: string;
  accent: string;
  emoji: string;
  tag: string;
  avatar: string;
  description: string;
  greetingTemplate: string;
  systemPrompt?: string;
}

export const AI_CONFIG = aiConfig;
export const AI_DEPTHS = aiConfig.DEPTHS as AiDepthConfig[];
export const AI_MENTORS = aiConfig.MENTORS as AiMentorConfig[];
export const AISHA_VISUAL_CONFIG = (aiConfig as any).AISHA_VISUAL_CONFIG;
export const AI_CALL_CONFIG: {
  creditsPerMinuteByDepth: Record<'quick' | 'balanced' | 'deep' | 'max', number>;
  dailyMinuteLimits: { free: number; paid: number };
  maxCallSeconds: number;
  silenceTimeoutSeconds: number;
  maxHistoryMessages: number;
} = (aiConfig as any).AI_CALL_CONFIG || {
  creditsPerMinuteByDepth: { quick: 2, balanced: 3, deep: 5, max: 8 },
  dailyMinuteLimits: { free: 5, paid: 60 },
  maxCallSeconds: 600,
  silenceTimeoutSeconds: 30,
  maxHistoryMessages: 10,
};

export function getCallRatePerMinute(depthId: number): number {
  const depth = getDepthConfig(depthId);
  return Number(AI_CALL_CONFIG.creditsPerMinuteByDepth[depth.key] ?? 3);
}

export function getDailyCallMinutesLimit(isPaid: boolean): number {
  return isPaid ? AI_CALL_CONFIG.dailyMinuteLimits.paid : AI_CALL_CONFIG.dailyMinuteLimits.free;
}

/** Pure per-started-minute call billing helper (0 if call failed to connect or AI never answered). */
export function calculateCallBilling(params: {
  elapsedSec: number;
  depthId: number;
  answered: boolean;
}): { startedMinutes: number; creditsCharged: number; ratePerMin: number } {
  const ratePerMin = getCallRatePerMinute(params.depthId);
  const secs = Math.max(0, Math.floor(Number(params.elapsedSec) || 0));
  if (!params.answered || secs <= 0) {
    return { startedMinutes: 0, creditsCharged: 0, ratePerMin };
  }
  const cappedSecs = Math.min(secs, AI_CALL_CONFIG.maxCallSeconds);
  const startedMinutes = Math.max(1, Math.ceil(cappedSecs / 60));
  return {
    startedMinutes,
    creditsCharged: startedMinutes * ratePerMin,
    ratePerMin,
  };
}

export function canContinueCallMinute(params: {
  creditsLeft: number;
  isUnlimited: boolean;
  depthId: number;
  callMinutesLeft: number;
}): { ok: boolean; reason?: 'INSUFFICIENT_CREDITS' | 'DAILY_LIMIT_REACHED'; needed: number } {
  const needed = getCallRatePerMinute(params.depthId);
  if (params.isUnlimited) return { ok: true, needed: 0 };
  if (params.callMinutesLeft <= 0) {
    return { ok: false, reason: 'DAILY_LIMIT_REACHED', needed };
  }
  if (params.creditsLeft < needed) {
    return { ok: false, reason: 'INSUFFICIENT_CREDITS', needed };
  }
  return { ok: true, needed };
}

export const FREE_AI_CREDITS_PER_DAY = aiConfig.FREE_CREDITS_PER_DAY;
export const PRO_AI_CREDITS_PER_DAY = aiConfig.PRO_CREDITS_PER_DAY;
export const PLUS_AI_CREDITS_PER_DAY =
  typeof (aiConfig as any).PLUS_CREDITS_PER_DAY === 'number'
    ? (aiConfig as any).PLUS_CREDITS_PER_DAY
    : 100;
export const AI_COST_RULES = aiConfig.COST_RULES;

export function getDailyCreditsLimit(
  plan: AiPlan,
  overrides?: {
    free?: { aiCreditsPerDay?: number };
    pro?: { aiCreditsPerDay?: number };
    plus?: { aiCreditsPerDay?: number };
  } | null
): number {
  if (plan === 'plus') {
    return overrides?.plus?.aiCreditsPerDay ?? PLUS_AI_CREDITS_PER_DAY;
  }
  if (plan === 'pro') {
    return overrides?.pro?.aiCreditsPerDay ?? PRO_AI_CREDITS_PER_DAY;
  }
  return overrides?.free?.aiCreditsPerDay ?? FREE_AI_CREDITS_PER_DAY;
}

export function isDepthAllowedForPlan(depth: number, plan: AiPlan): boolean {
  const cfg = getDepthConfig(depth);
  return cfg.freeAllowed || plan === 'pro' || plan === 'plus';
}

export interface CreditCostInput {
  depth: number;
  textLength: number;
  photoCount?: number;
  pdfCount?: number;
  historyMessageCount?: number;
  mentorId?: number;
  visualMode?: boolean;
  cacheHit?: boolean;
}

export interface CreditCostBreakdown {
  baseCost: number;
  textExtra: number;
  photoExtra: number;
  pdfExtra: number;
  historyExtra: number;
  total: number;
}

export function getDepthConfig(depth: number): AiDepthConfig {
  const clamped = Math.max(0, Math.min(AI_DEPTHS.length - 1, Math.floor(Number(depth) || 0)));
  return AI_DEPTHS[clamped] || AI_DEPTHS[1];
}

export function getMentorConfig(mentor: number): AiMentorConfig {
  const clamped = Math.max(0, Math.min(AI_MENTORS.length - 1, Math.floor(Number(mentor) || 0)));
  return AI_MENTORS[clamped] || AI_MENTORS[0];
}

export function resolveMentorIdFromParam(param?: string | null): AiMentorId {
  if (!param) return 0;
  const parsed = parseStrictMentorId(param);
  return (parsed >= 0 ? parsed : 0) as AiMentorId;
}

export function calculateMessageCreditCost(input: CreditCostInput): CreditCostBreakdown {
  const rules = AI_COST_RULES;
  const textLen = Math.max(0, Math.floor(Number(input.textLength) || 0));
  const photos = Math.max(0, Math.floor(Number(input.photoCount) || 0));
  const pdfs = Math.max(0, Math.floor(Number(input.pdfCount) || 0));
  const historyLen = Math.max(0, Math.floor(Number(input.historyMessageCount) || 0));

  const isAishaVisual = input.mentorId === AISHA_MENTOR_ID && input.visualMode !== false;
  const baseCost =
    typeof input.mentorId === 'number'
      ? getDepthBaseCostForMentor(input.mentorId, input.depth, {
          visualMode: input.visualMode !== false,
          cacheHit: Boolean(input.cacheHit),
        })
      : getDepthConfig(input.depth).baseCost;

  // Aisha cached visual scenes always cost a flat 1 credit
  if (isAishaVisual && input.cacheHit) {
    return {
      baseCost: 1,
      textExtra: 0,
      photoExtra: 0,
      pdfExtra: 0,
      historyExtra: 0,
      total: 1,
    };
  }

  const textExtra = Math.min(
    rules.maxTextExtraCredits,
    Math.floor(textLen / rules.charsPerExtraCredit)
  );
  const photoExtra = photos * rules.photoExtraCredit;
  const pdfExtra = pdfs * rules.pdfExtraCredit;
  const historyExtra = Math.min(
    rules.maxHistoryExtraCredits,
    Math.floor(historyLen / rules.messagesPerExtraCredit)
  );

  return {
    baseCost,
    textExtra,
    photoExtra,
    pdfExtra,
    historyExtra,
    total: baseCost + textExtra + photoExtra + pdfExtra + historyExtra,
  };
}

/**
 * Returns today's date key in Asia/Karachi (PKT = UTC+5) as YYYY-MM-DD.
 */
export function getPktDateKey(nowMs: number = Date.now()): string {
  const pktOffsetMs = 5 * 60 * 60 * 1000;
  const pktDate = new Date(nowMs + pktOffsetMs);
  const year = pktDate.getUTCFullYear();
  const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(pktDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface PktResetInfo {
  dateKey: string;
  resetAtMs: number;
  resetAtIso: string;
  msUntilReset: number;
  hoursLeft: number;
  minutesLeft: number;
  countdownLabel: string;
}

/**
 * Computes exact next midnight in Asia/Karachi (UTC+5) and formatted countdown "Hh Mm".
 */
export function getPktResetInfo(nowMs: number = Date.now()): PktResetInfo {
  const pktOffsetMs = 5 * 60 * 60 * 1000;
  const pktNow = new Date(nowMs + pktOffsetMs);
  const year = pktNow.getUTCFullYear();
  const month = pktNow.getUTCMonth();
  const day = pktNow.getUTCDate();
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Next midnight PKT in UTC epoch ms
  const nextPktMidnightUtcMs = Date.UTC(year, month, day + 1, 0, 0, 0, 0) - pktOffsetMs;
  const msUntilReset = Math.max(0, nextPktMidnightUtcMs - nowMs);
  const totalMinutes = Math.max(1, Math.ceil(msUntilReset / (60 * 1000)));
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;
  const countdownLabel =
    hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`;

  return {
    dateKey,
    resetAtMs: nextPktMidnightUtcMs,
    resetAtIso: new Date(nextPktMidnightUtcMs).toISOString(),
    msUntilReset,
    hoursLeft,
    minutesLeft,
    countdownLabel,
  };
}

export function getStudentFirstName(rawName?: string | null): string {
  const cleaned = String(rawName || '')
    .replace(/^@/, '')
    .trim();
  if (!cleaned || cleaned.toLowerCase() === 'student' || cleaned.toLowerCase() === 'guest') {
    return 'friend';
  }
  const first = cleaned.split(/\s+/)[0] || 'friend';
  return first.slice(0, 24);
}

export function buildMentorGreeting(mentorId: AiMentorId, displayName?: string | null): string {
  const mentor = getMentorConfig(mentorId);
  const firstName = getStudentFirstName(displayName);
  return mentor.greetingTemplate.replace('{firstName}', firstName);
}

export interface ApiContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ApiContentMessage {
  role: 'user' | 'model';
  parts: ApiContentPart[];
}

export interface LocalChatMessageInput {
  role: 'user' | 'model';
  text: string;
  parts?: ApiContentPart[];
  isError?: boolean;
  isGreeting?: boolean;
}

/**
 * Prepares the last N messages for Gemini:
 * - Excludes greeting and unsaved error bubbles
 * - Keeps at most maxMessagesClient (12)
 * - Merges consecutive same-role messages
 * - Guarantees the first message has role === 'user'
 */
export function prepareApiContents(
  messages: LocalChatMessageInput[],
  maxMessages: number = AI_COST_RULES.maxMessagesClient
): ApiContentMessage[] {
  const filtered = messages
    .filter((m) => !m.isError && !m.isGreeting)
    .map((m): ApiContentMessage => {
      const parts: ApiContentPart[] = [];
      if (Array.isArray(m.parts) && m.parts.length > 0) {
        for (const p of m.parts) {
          if (p.inlineData && p.inlineData.data && p.inlineData.mimeType) {
            parts.push({ inlineData: { mimeType: p.inlineData.mimeType, data: p.inlineData.data } });
          } else if (typeof p.text === 'string' && p.text.trim()) {
            parts.push({ text: p.text.slice(0, AI_COST_RULES.maxCharsPerMessage) });
          }
        }
      }
      if (parts.length === 0 && m.text && m.text.trim()) {
        parts.push({ text: m.text.slice(0, AI_COST_RULES.maxCharsPerMessage) });
      }
      return { role: m.role, parts };
    })
    .filter((m) => m.parts.length > 0);

  const sliced = filtered.slice(-maxMessages);

  // Merge consecutive same-role messages
  const merged: ApiContentMessage[] = [];
  for (const msg of sliced) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === msg.role) {
      prev.parts = [...prev.parts, ...msg.parts];
    } else {
      merged.push({ role: msg.role, parts: [...msg.parts] });
    }
  }

  // Ensure first message is always 'user'
  while (merged.length > 0 && merged[0].role !== 'user') {
    merged.shift();
  }

  return merged;
}

/**
 * Prepares the last `maxRecent` (default 10) real messages for Gemini plus a compact
 * single-turn summary of any older messages so prompts stay small and fast.
 */
export function prepareApiContentsWithSummary(
  messages: LocalChatMessageInput[],
  maxRecent: number = 10
): ApiContentMessage[] {
  const realMessages = messages.filter((m) => !m.isError && !m.isGreeting);
  const recentLimit = Math.max(2, Math.min(AI_COST_RULES.maxMessagesClient || 10, maxRecent));

  if (realMessages.length <= recentLimit) {
    return prepareApiContents(realMessages, recentLimit);
  }

  const older = realMessages.slice(0, realMessages.length - recentLimit);
  const recent = realMessages.slice(-recentLimit);

  // Build a compact summary (<= 340 chars) from older turns (prioritizing user topics)
  const snippets: string[] = [];
  for (const m of older) {
    const raw = (m.text || '').replace(/\s+/g, ' ').trim();
    if (!raw) continue;
    const prefix = m.role === 'user' ? 'Student' : 'Mentor';
    snippets.push(`${prefix}: ${raw.slice(0, 68)}${raw.length > 68 ? '…' : ''}`);
  }
  const summaryBody = snippets.slice(-4).join(' | ').slice(0, 320);

  const recentPrepared = prepareApiContents(recent, recentLimit);
  if (!summaryBody) {
    return recentPrepared;
  }

  const summaryPrefix = `[Earlier chat context: ${summaryBody}]\n\n`;
  if (recentPrepared.length > 0 && recentPrepared[0].role === 'user') {
    const first = recentPrepared[0];
    return [
      {
        role: 'user',
        parts: [{ text: summaryPrefix }, ...first.parts],
      },
      ...recentPrepared.slice(1),
    ];
  }

  return [
    { role: 'user', parts: [{ text: summaryPrefix.trim() }] },
    ...recentPrepared,
  ];
}

export function buildChatTitle(firstQuestion: string): string {
  const clean = String(firstQuestion || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return 'New chat';
  return clean.length > 48 ? `${clean.slice(0, 47).trimEnd()}…` : clean;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface KatexLike {
  renderToString: (
    tex: string,
    options?: {
      displayMode?: boolean;
      throwOnError?: boolean;
      strict?: boolean | 'warn' | 'error' | 'ignore';
      trust?: boolean;
    }
  ) => string;
}

function getRuntimeKatex(explicit?: KatexLike | null): KatexLike | null {
  if (explicit && typeof explicit.renderToString === 'function') {
    return explicit;
  }
  if (typeof window !== 'undefined' && (window as any).katex?.renderToString) {
    return (window as any).katex as KatexLike;
  }
  return null;
}

function renderInlineMarkdown(escapedText: string): string {
  // Inline code first (protect its contents from bold/italic formatting)
  const codeTokens: string[] = [];
  let text = escapedText.replace(/`([^`\n]+)`/g, (_m, code) => {
    const idx = codeTokens.length;
    codeTokens.push(`<code class="ai-inline-code">${code}</code>`);
    return `@@AICODE${idx}@@`;
  });

  // Bold (**text**)
  text = text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  // Italic (*text*) - avoid matching inside words or math placeholders
  text = text.replace(/(^|[\s(>])\*([^*\n]+?)\*(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');

  // Restore inline code
  text = text.replace(/@@AICODE(\d+)@@/g, (_m, idxStr) => codeTokens[Number(idxStr)] || '');
  return text;
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('-')) return false;
  return /^\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?$/.test(trimmed);
}

function parseTableCells(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((c) => c.trim());
}

/**
 * Pipeline:
 * 1. Extract fenced code blocks so math/markdown inside code is untouched.
 * 2. Extract LaTeX ($$...$$, \[...\], \(...\), $...$) and render with KaTeX
 *    (throwOnError: false, strict: false, trust: false).
 * 3. HTML-escape all non-math text.
 * 4. Apply light markdown (headings, bold, italic, lists, inline code, tables inside scroll wrapper).
 * 5. Restore rendered KaTeX & code placeholders.
 */
export function renderAiMarkdownWithKatex(
  rawText: string,
  katexOverride?: KatexLike | null
): string {
  if (!rawText) return '';
  const katexInst = getRuntimeKatex(katexOverride);

  const mathTokens: string[] = [];
  const codeBlockTokens: string[] = [];

  const pushMath = (tex: string, displayMode: boolean): string => {
    const cleanTex = tex.trim();
    if (!cleanTex) return '';
    let rendered = '';
    if (katexInst) {
      try {
        rendered = katexInst.renderToString(cleanTex, {
          displayMode,
          throwOnError: false,
          strict: false,
          trust: false,
        });
      } catch {
        rendered = `<code>${escapeHtml(cleanTex)}</code>`;
      }
    } else {
      rendered = `<code class="ai-katex-fallback">${escapeHtml(cleanTex)}</code>`;
    }
    const wrapped = displayMode
      ? `<div class="ai-math-display">${rendered}</div>`
      : `<span class="ai-math-inline">${rendered}</span>`;
    const idx = mathTokens.length;
    mathTokens.push(wrapped);
    return `@@AIMATH${idx}@@`;
  };

  let src = String(rawText).replace(/\r\n/g, '\n');

  // Step 1: Extract fenced code blocks
  src = src.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = codeBlockTokens.length;
    const langLabel = lang ? `<div class="ai-code-lang">${escapeHtml(lang)}</div>` : '';
    codeBlockTokens.push(
      `<div class="ai-code-block">${langLabel}<pre><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre></div>`
    );
    return `\n@@AICODEBLOCK${idx}@@\n`;
  });

  // Step 2: Extract LaTeX delimiters in safe order: $$...$$, \[...\], \(...\), $...$
  src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => pushMath(tex, true));
  src = src.replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex) => pushMath(tex, true));
  src = src.replace(/\\\(([\s\S]+?)\\\)/g, (_m, tex) => pushMath(tex, false));
  // Inline $...$: require non-space after opening $ and non-space before closing $, not preceded by \ or digit currency like "$5 and $10" unless math-like
  src = src.replace(/(?<!\\)\$(?!\s)((?:\\\$|[^$\n])+?)(?<!\s)\$/g, (full, inner) => {
    // Avoid mistaking plain currency like "$50" or "$100" when followed by nothing mathy
    if (/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(inner.trim())) {
      return full;
    }
    return pushMath(inner, false);
  });

  // Step 3: HTML-escape everything remaining
  const escaped = escapeHtml(src);

  // Step 4: Block-level light markdown (headings, tables, lists, paragraphs)
  const lines = escaped.split('\n');
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block placeholder
    if (/^@@AICODEBLOCK\d+@@$/.test(trimmed)) {
      htmlParts.push(trimmed);
      i++;
      continue;
    }

    // Standalone display math placeholder
    if (/^@@AIMATH\d+@@$/.test(trimmed)) {
      htmlParts.push(trimmed);
      i++;
      continue;
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(4, headingMatch[1].length);
      const tag = level === 1 ? 'h3' : level === 2 ? 'h3' : 'h4';
      htmlParts.push(`<${tag} class="ai-md-heading">${renderInlineMarkdown(headingMatch[2])}</${tag}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      htmlParts.push('<hr class="ai-md-hr" />');
      i++;
      continue;
    }

    // Markdown table: header row followed by separator row
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      isTableSeparatorLine(lines[i + 1])
    ) {
      const headers = parseTableCells(trimmed);
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim() !== '') {
        bodyRows.push(parseTableCells(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${headers
        .map((h) => `<th>${renderInlineMarkdown(h)}</th>`)
        .join('')}</tr></thead>`;
      const tbody = `<tbody>${bodyRows
        .map(
          (row) =>
            `<tr>${headers
              .map((_, colIdx) => `<td>${renderInlineMarkdown(row[colIdx] || '')}</td>`)
              .join('')}</tr>`
        )
        .join('')}</tbody>`;
      htmlParts.push(`<div class="ai-table-scroll-wrap"><table class="ai-md-table">${thead}${tbody}</table></div>`);
      continue;
    }

    // Unordered list
    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(`<li>${renderInlineMarkdown(lines[i].trim().replace(/^[-*•]\s+/, ''))}</li>`);
        i++;
      }
      htmlParts.push(`<ul class="ai-md-ul">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(`<li>${renderInlineMarkdown(lines[i].trim().replace(/^\d+[.)]\s+/, ''))}</li>`);
        i++;
      }
      htmlParts.push(`<ol class="ai-md-ol">${items.join('')}</ol>`);
      continue;
    }

    // Paragraph (collect consecutive non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,4}\s+/.test(lines[i].trim()) &&
      !/^[-*•]\s+/.test(lines[i].trim()) &&
      !/^\d+[.)]\s+/.test(lines[i].trim()) &&
      !/^@@AICODEBLOCK\d+@@$/.test(lines[i].trim()) &&
      !(lines[i].trim().includes('|') && i + 1 < lines.length && isTableSeparatorLine(lines[i + 1]))
    ) {
      paraLines.push(renderInlineMarkdown(lines[i].trim()));
      i++;
    }
    htmlParts.push(`<p class="ai-md-p">${paraLines.join('<br />')}</p>`);
  }

  // Step 5: Restore placeholders
  let output = htmlParts.join('\n');
  output = output.replace(/@@AICODEBLOCK(\d+)@@/g, (_m, idxStr) => codeBlockTokens[Number(idxStr)] || '');
  output = output.replace(/@@AIMATH(\d+)@@/g, (_m, idxStr) => mathTokens[Number(idxStr)] || '');

  return output;
}

/**
 * Strips LaTeX & markdown symbols into natural spoken plain text for speechSynthesis.
 */
export function stripLatexForSpeech(rawText: string): string {
  if (!rawText) return '';
  return String(rawText)
    // Remove code fences
    .replace(/```[\s\S]*?```/g, ' code snippet ')
    // Unwrap mhchem \ce{...}
    .replace(/\\ce\{([^}]+)\}/g, '$1')
    // Convert \frac{a}{b} -> a over b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
    // Convert \sqrt{x} -> square root of x
    .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
    // Common math symbols
    .replace(/\\times/g, ' times ')
    .replace(/\\cdot/g, ' times ')
    .replace(/\\div/g, ' divided by ')
    .replace(/\\pm/g, ' plus or minus ')
    .replace(/\\rightarrow|\\to/g, ' gives ')
    .replace(/\\leq/g, ' less than or equal to ')
    .replace(/\\geq/g, ' greater than or equal to ')
    .replace(/\\neq/g, ' not equal to ')
    .replace(/\\approx/g, ' approximately ')
    .replace(/\\pi/g, ' pi ')
    .replace(/\\theta/g, ' theta ')
    .replace(/\\Delta/g, ' delta ')
    // Remove remaining LaTeX commands & delimiters
    .replace(/\$\$|\\\[|\\\]|\\\(|\\\)|\$/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}^_]/g, ' ')
    // Remove markdown formatting
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*|__|`|~~|\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

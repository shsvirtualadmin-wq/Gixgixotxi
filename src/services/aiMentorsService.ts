import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  AI_COST_RULES,
  FREE_AI_CREDITS_PER_DAY,
  buildChatTitle,
  getDailyCreditsLimit,
  getPktDateKey,
  getPktResetInfo,
  type AiDepthId,
  type AiMentorId,
  type AiPlan,
  type ApiContentMessage,
} from '@/utils/aiMentorsLogic';
import type { PlansConfigDoc } from '@/lib/planTier';
import { readSwrCache, writeSwrCache } from '@/utils/userStateSource';

export interface AiCreditsStatus {
  creditsUsed: number;
  creditsLeft: number;
  dailyLimit: number;
  isUnlimited: boolean;
  isPro: boolean;
  isPlus: boolean;
  isPaid: boolean;
  isSuperAdmin: boolean;
  deepMaxUnlocked: boolean;
  plan: AiPlan;
  source: 'superadmin' | 'personal' | 'crew' | 'none';
  dateKey: string;
  resetAt: string;
  syncedFromServer: boolean;
}

export interface StoredAiMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isGreeting?: boolean;
  isError?: boolean;
  isStreaming?: boolean;
  attachmentLabels?: string[];
  retryPayload?: {
    text: string;
    attachments: PreparedAttachment[];
  };
  createdAt?: number;
}

export interface SavedAiChat {
  id: string;
  mentor: AiMentorId;
  title: string;
  updatedAt: number;
  messages: Array<{ role: 'user' | 'model'; text: string }>;
}

const AI_CREDITS_CACHE_PREFIX = 'boardly_ai_credits_v1:';
const AI_CHATS_CACHE_PREFIX = 'boardly_ai_chats_v1:';
const AI_SAVE_HISTORY_PREF_PREFIX = 'boardly_ai_save_history_v1:';

export function getSaveChatHistoryPref(uid?: string | null): boolean {
  try {
    const key = `${AI_SAVE_HISTORY_PREF_PREFIX}${uid || 'default'}`;
    const raw = localStorage.getItem(key);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

export function setSaveChatHistoryPref(uid: string | null | undefined, enabled: boolean): void {
  try {
    const key = `${AI_SAVE_HISTORY_PREF_PREFIX}${uid || 'default'}`;
    localStorage.setItem(key, enabled ? '1' : '0');
    window.dispatchEvent(new CustomEvent('boardly:ai-prefs-changed', { detail: { saveHistory: enabled } }));
  } catch {
    // Ignore storage quota errors
  }
  if (uid && !uid.startsWith('guest_')) {
    void setDoc(
      doc(db, 'users', uid, 'settings', 'ai'),
      { saveChatHistory: enabled, updatedAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {});
  }
}

export function buildFallbackCreditsStatus(opts: {
  plan?: AiPlan;
  isPro: boolean;
  isPlus?: boolean;
  isSuperAdmin: boolean;
  source?: 'superadmin' | 'personal' | 'crew' | 'none';
  plansConfig?: PlansConfigDoc | null;
}): AiCreditsStatus {
  const reset = getPktResetInfo();
  const resolvedPlan: AiPlan = opts.isSuperAdmin
    ? 'plus'
    : opts.plan === 'plus' || opts.isPlus
    ? 'plus'
    : opts.plan === 'pro' || opts.isPro
    ? 'pro'
    : 'free';
  const dailyLimit = getDailyCreditsLimit(resolvedPlan, opts.plansConfig);
  const isPaid = resolvedPlan !== 'free' || opts.isSuperAdmin;
  const isPlus = resolvedPlan === 'plus' || opts.isSuperAdmin;
  return {
    creditsUsed: 0,
    creditsLeft: dailyLimit,
    dailyLimit,
    isUnlimited: opts.isSuperAdmin,
    isPro: isPaid,
    isPlus,
    isPaid,
    isSuperAdmin: opts.isSuperAdmin,
    deepMaxUnlocked: isPaid,
    plan: resolvedPlan,
    source: opts.isSuperAdmin ? 'superadmin' : opts.source || (isPaid ? 'personal' : 'none'),
    dateKey: reset.dateKey,
    resetAt: reset.resetAtIso,
    syncedFromServer: false,
  };
}

export function getCachedAiCreditsStatus(uid?: string | null): AiCreditsStatus | null {
  if (!uid) return null;
  const cached = readSwrCache<AiCreditsStatus>(`${AI_CREDITS_CACHE_PREFIX}${uid}`);
  if (!cached) return null;
  // Invalidate if PKT date rolled over
  if (cached.dateKey !== getPktDateKey()) return null;
  const plan: AiPlan =
    cached.plan === 'plus' || cached.isPlus
      ? 'plus'
      : cached.plan === 'pro' || cached.isPro
      ? 'pro'
      : 'free';
  return {
    ...cached,
    plan,
    isPlus: Boolean(cached.isPlus || plan === 'plus'),
    isPaid: Boolean(cached.isPaid || cached.isPro || plan !== 'free' || cached.isSuperAdmin),
  };
}

export function cacheAiCreditsStatus(uid: string | null | undefined, status: AiCreditsStatus): void {
  if (!uid) return;
  writeSwrCache(`${AI_CREDITS_CACHE_PREFIX}${uid}`, status);
  try {
    window.dispatchEvent(new CustomEvent('boardly:ai-credits-updated', { detail: status }));
  } catch {
    // Ignore
  }
}

export async function fetchAiCreditsStatus(
  uid?: string | null,
  fallbackOpts?: {
    plan?: AiPlan;
    isPro: boolean;
    isPlus?: boolean;
    isSuperAdmin: boolean;
    source?: 'superadmin' | 'personal' | 'crew' | 'none';
    plansConfig?: PlansConfigDoc | null;
  }
): Promise<AiCreditsStatus> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    return buildFallbackCreditsStatus(
      fallbackOpts || { plan: 'free', isPro: false, isPlus: false, isSuperAdmin: false, source: 'none' }
    );
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('/api/ai', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    const resolvedPlan: AiPlan =
      data.plan === 'plus' || data.isPlus === true || data.isSuperAdmin === true
        ? 'plus'
        : data.plan === 'pro' || data.isPro === true
        ? 'pro'
        : 'free';
    const isPaid = resolvedPlan !== 'free' || Boolean(data.isSuperAdmin);
    const isPlus = resolvedPlan === 'plus' || Boolean(data.isSuperAdmin);
    const status: AiCreditsStatus = {
      creditsUsed: Number(data.creditsUsed || 0),
      creditsLeft: Number(data.creditsLeft ?? data.dailyLimit ?? FREE_AI_CREDITS_PER_DAY),
      dailyLimit: Number(data.dailyLimit || getDailyCreditsLimit(resolvedPlan, fallbackOpts?.plansConfig)),
      isUnlimited: Boolean(data.isUnlimited),
      isPro: isPaid,
      isPlus,
      isPaid,
      isSuperAdmin: Boolean(data.isSuperAdmin),
      deepMaxUnlocked: Boolean(data.deepMaxUnlocked ?? isPaid),
      plan: resolvedPlan,
      source: data.source || 'none',
      dateKey: String(data.dateKey || getPktDateKey()),
      resetAt: String(data.resetAt || getPktResetInfo().resetAtIso),
      syncedFromServer: true,
    };
    cacheAiCreditsStatus(uid || auth.currentUser?.uid, status);
    return status;
  } finally {
    window.clearTimeout(timeout);
  }
}

export interface AiMessageTimings {
  ttfbMs: number;
  ttftMs: number;
  totalMs: number;
  wordCount: number;
  model?: string;
  depth?: number;
}

export interface SendAiMessageResult {
  text: string;
  creditsLeft: number;
  creditsUsed: number;
  dailyLimit: number;
  isUnlimited: boolean;
  cost: number;
  resetAt: string;
  dateKey: string;
  timings?: AiMessageTimings;
}

export class AiMentorApiError extends Error {
  status: number;
  code?: string;
  creditsLeft?: number;
  dailyLimit?: number;
  resetAt?: string;

  constructor(
    message: string,
    status: number,
    meta?: { code?: string; creditsLeft?: number; dailyLimit?: number; resetAt?: string }
  ) {
    super(message);
    this.name = 'AiMentorApiError';
    this.status = status;
    this.code = meta?.code;
    this.creditsLeft = meta?.creditsLeft;
    this.dailyLimit = meta?.dailyLimit;
    this.resetAt = meta?.resetAt;
  }
}

async function getIdTokenWithTimeout(timeoutMs = 10_000): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  let timer: number | null = null;
  try {
    return await Promise.race([
      currentUser.getIdToken().catch(() => null),
      new Promise<null>((resolve) => {
        timer = window.setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== null) window.clearTimeout(timer);
  }
}

function createIdempotentRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `req_${crypto.randomUUID()}`;
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function countWordsSimple(text: string): number {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export async function sendAiMentorMessage(params: {
  mentor: AiMentorId;
  depth: AiDepthId;
  contents: ApiContentMessage[];
  signal?: AbortSignal;
  requestId?: string;
  stream?: boolean;
  onDelta?: (delta: string, fullText: string) => void;
  onMeta?: (meta: { model?: string; depth?: number; cost?: number }) => void;
}): Promise<SendAiMessageResult> {
  const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const token = await getIdTokenWithTimeout(10_000);
  if (!token) {
    throw new AiMentorApiError('Please sign in with a registered Boardly account to chat.', 401);
  }

  const TOTAL_TIMEOUT_MS = 45_000;
  const STREAM_INACTIVITY_TIMEOUT_MS = 25_000;

  const controller = new AbortController();
  let timedOut = false;
  let timeoutReason: 'total' | 'inactivity' = 'total';
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    timeoutReason = 'total';
    controller.abort();
  }, TOTAL_TIMEOUT_MS);

  let inactivityTimerId: number | null = null;
  const resetInactivityWatchdog = () => {
    if (inactivityTimerId !== null) {
      window.clearTimeout(inactivityTimerId);
    }
    inactivityTimerId = window.setTimeout(() => {
      timedOut = true;
      timeoutReason = 'inactivity';
      controller.abort();
    }, STREAM_INACTIVITY_TIMEOUT_MS);
  };
  const clearInactivityWatchdog = () => {
    if (inactivityTimerId !== null) {
      window.clearTimeout(inactivityTimerId);
      inactivityTimerId = null;
    }
  };

  const onExternalAbort = () => controller.abort();
  if (params.signal) {
    if (params.signal.aborted) {
      window.clearTimeout(timeoutId);
      throw new AiMentorApiError('Request was cancelled.', 499, { code: 'ABORTED' });
    }
    params.signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const requestId = params.requestId || createIdempotentRequestId();
  const wantStream = params.stream !== false;

  console.info(
    `[AI Mentor Client] start requestId=${requestId} mentor=${params.mentor} depth=${params.depth} stream=${wantStream} turns=${params.contents.length}`
  );

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(wantStream ? { Accept: 'text/event-stream' } : {}),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mentor: params.mentor,
        depth: params.depth,
        contents: params.contents,
        stream: wantStream,
        requestId,
      }),
      signal: controller.signal,
    });

    const tHeaders = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const ttfbMs = Math.round(tHeaders - tStart);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    console.info(
      `[AI Mentor Client] headers requestId=${requestId} status=${res.status} contentType=${contentType || 'none'} TTFB=${ttfbMs}ms`
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(
        `[AI Mentor Client] HTTP error requestId=${requestId} status=${res.status} code=${data?.code || 'NONE'} error=${data?.error || 'unknown'}`
      );
      throw new AiMentorApiError(
        data?.error || `Could not get a response from your AI Mentor (HTTP ${res.status}).`,
        res.status,
        {
          code: data?.code,
          creditsLeft: typeof data?.creditsLeft === 'number' ? data.creditsLeft : undefined,
          dailyLimit: typeof data?.dailyLimit === 'number' ? data.dailyLimit : undefined,
          resetAt: typeof data?.resetAt === 'string' ? data.resetAt : undefined,
        }
      );
    }

    // Streaming SSE path — render tokens immediately as they arrive
    if (contentType.includes('text/event-stream') && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let ttftMs: number | null = null;
      let donePayload: Record<string, any> | null = null;
      let metaModel: string | undefined;
      let metaDepth: number = params.depth;

      const processEventBlock = (block: string) => {
        const lines = block.split(/\r?\n/);
        let eventName = 'message';
        const dataLines: string[] = [];

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, '');
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        if (dataLines.length === 0) return;
        const payloadStr = dataLines.join('\n');
        if (!payloadStr || payloadStr === '[DONE]') return;

        let parsed: Record<string, any>;
        try {
          parsed = JSON.parse(payloadStr);
        } catch {
          return;
        }

        if (eventName === 'meta') {
          metaModel = typeof parsed.model === 'string' ? parsed.model : metaModel;
          if (typeof parsed.depth === 'number') metaDepth = parsed.depth;
          console.info(
            `[AI Mentor Client] meta requestId=${requestId} model=${metaModel || 'unknown'} depth=${metaDepth}`
          );
          params.onMeta?.({
            model: metaModel,
            depth: metaDepth,
            cost: typeof parsed.cost === 'number' ? parsed.cost : undefined,
          });
        } else if (eventName === 'delta') {
          const delta = typeof parsed.text === 'string' ? parsed.text : '';
          if (delta) {
            if (ttftMs === null) {
              const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
              ttftMs = Math.round(now - tStart);
              console.info(
                `[AI Mentor Client] first-token requestId=${requestId} model=${metaModel || 'unknown'} TTFT=${ttftMs}ms`
              );
            }
            fullText += delta;
            params.onDelta?.(delta, fullText);
          }
        } else if (eventName === 'done') {
          donePayload = parsed;
        } else if (eventName === 'error') {
          console.error(
            `[AI Mentor Client] SSE error event requestId=${requestId} code=${parsed.code || 'STREAM_ERROR'} error=${parsed.error || 'unknown'}`
          );
          throw new AiMentorApiError(
            parsed.error || 'Could not get a response from your AI Mentor.',
            Number(parsed.status) || 502,
            {
              code: typeof parsed.code === 'string' ? parsed.code : undefined,
              creditsLeft: typeof parsed.creditsLeft === 'number' ? parsed.creditsLeft : undefined,
              dailyLimit: typeof parsed.dailyLimit === 'number' ? parsed.dailyLimit : undefined,
              resetAt: typeof parsed.resetAt === 'string' ? parsed.resetAt : undefined,
            }
          );
        }
      };

      resetInactivityWatchdog();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          resetInactivityWatchdog();
          buffer += decoder.decode(value, { stream: true });

          const sepRegex = /\r?\n\r?\n/;
          let match = sepRegex.exec(buffer);
          while (match) {
            const block = buffer.slice(0, match.index);
            buffer = buffer.slice(match.index + match[0].length);
            if (block.trim()) {
              processEventBlock(block);
            }
            match = sepRegex.exec(buffer);
          }
        }

        buffer += decoder.decode();
        if (buffer.trim()) {
          processEventBlock(buffer);
        }
      } finally {
        clearInactivityWatchdog();
        try {
          reader.releaseLock();
        } catch {
          // ignore
        }
      }

      const finalText = (fullText || String(donePayload?.text || '')).trim();
      if (!finalText) {
        console.error(`[AI Mentor Client] empty SSE answer requestId=${requestId}`);
        throw new AiMentorApiError(
          'The mentor returned an empty reply. Please tap Retry.',
          502,
          { code: 'EMPTY_ANSWER' }
        );
      }

      const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const totalMs = Math.round(tEnd - tStart);
      const resolvedTtft = ttftMs ?? totalMs;
      const wordCount = countWordsSimple(finalText);
      const cost = Number(donePayload?.cost ?? 0);

      console.info(
        `[AI Mentor Client] done requestId=${requestId} mentor=${params.mentor} depth=${metaDepth} model=${metaModel || 'unknown'} ` +
          `TTFB=${ttfbMs}ms TTFT=${resolvedTtft}ms Total=${totalMs}ms words=${wordCount} cost=${cost}`
      );

      return {
        text: finalText,
        creditsLeft: Number(donePayload?.creditsLeft ?? 0),
        creditsUsed: Number(donePayload?.creditsUsed ?? 0),
        dailyLimit: Number(donePayload?.dailyLimit ?? FREE_AI_CREDITS_PER_DAY),
        isUnlimited: Boolean(donePayload?.isUnlimited),
        cost,
        resetAt: String(donePayload?.resetAt || getPktResetInfo().resetAtIso),
        dateKey: String(donePayload?.dateKey || getPktDateKey()),
        timings: {
          ttfbMs,
          ttftMs: resolvedTtft,
          totalMs,
          wordCount,
          model: metaModel,
          depth: metaDepth,
        },
      };
    }

    // Standard JSON fallback path
    const data = await res.json().catch(() => ({}));
    const answerText = String(data.text || '').trim();
    if (!answerText) {
      console.error(`[AI Mentor Client] empty JSON answer requestId=${requestId}`);
      throw new AiMentorApiError(
        'The mentor returned an empty reply. Please tap Retry.',
        502,
        { code: 'EMPTY_ANSWER' }
      );
    }

    const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const totalMs = Math.round(tEnd - tStart);
    const wordCount = countWordsSimple(answerText);
    const cost = Number(data.cost ?? 0);

    params.onDelta?.(answerText, answerText);

    console.info(
      `[AI Mentor Client] done (json) requestId=${requestId} mentor=${params.mentor} depth=${params.depth} ` +
        `TTFB=${ttfbMs}ms TTFT=${totalMs}ms Total=${totalMs}ms words=${wordCount} cost=${cost}`
    );

    return {
      text: answerText,
      creditsLeft: Number(data.creditsLeft ?? 0),
      creditsUsed: Number(data.creditsUsed ?? 0),
      dailyLimit: Number(data.dailyLimit ?? FREE_AI_CREDITS_PER_DAY),
      isUnlimited: Boolean(data.isUnlimited),
      cost,
      resetAt: String(data.resetAt || getPktResetInfo().resetAtIso),
      dateKey: String(data.dateKey || getPktDateKey()),
      timings: {
        ttfbMs,
        ttftMs: totalMs,
        totalMs,
        wordCount,
        model: data.model,
        depth: data.depth ?? params.depth,
      },
    };
  } catch (err: any) {
    const elapsedMs = Math.round(
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - tStart
    );
    if (err instanceof AiMentorApiError) {
      console.error(
        `[AI Mentor Client] failed requestId=${requestId} elapsed=${elapsedMs}ms status=${err.status} code=${err.code || 'NONE'} msg=${err.message}`
      );
      throw err;
    }
    if (err?.name === 'AbortError') {
      if (timedOut) {
        const msg =
          timeoutReason === 'inactivity'
            ? 'The AI Mentor stopped responding mid-reply. Your credits were not used — please tap Retry.'
            : 'Request timed out after 45 seconds. Please tap Retry.';
        console.error(
          `[AI Mentor Client] timeout (${timeoutReason}) requestId=${requestId} elapsed=${elapsedMs}ms`
        );
        throw new AiMentorApiError(msg, 408, {
          code: 'CLIENT_TIMEOUT',
        });
      }
      console.info(`[AI Mentor Client] aborted requestId=${requestId} elapsed=${elapsedMs}ms`);
      throw new AiMentorApiError('Request was cancelled.', 499, { code: 'ABORTED' });
    }
    console.error(
      `[AI Mentor Client] network/unexpected error requestId=${requestId} elapsed=${elapsedMs}ms`,
      err
    );
    throw new AiMentorApiError(
      err?.message || 'Network error while reaching AI Mentor. Please tap Retry.',
      0
    );
  } finally {
    window.clearTimeout(timeoutId);
    clearInactivityWatchdog();
    if (params.signal) {
      params.signal.removeEventListener('abort', onExternalAbort);
    }
  }
}

// ─── Attachment Preparation (Resize JPEG <= 1280px, PDF <= 4MB) ──────────────

export interface PreparedAttachment {
  id: string;
  kind: 'photo' | 'pdf';
  name: string;
  mimeType: string;
  base64Data: string;
  previewUrl?: string;
}

export async function prepareImageAttachment(file: File): Promise<PreparedAttachment> {
  const maxPx = AI_COST_RULES.maxImagePx;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not decode image.'));
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxPx / Math.max(img.width || 1, img.height || 1));
  const targetW = Math.max(1, Math.round(img.width * scale));
  const targetH = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable to compress image.');
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.84);
  const base64Data = jpegDataUrl.split(',')[1] || '';

  return {
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kind: 'photo',
    name: file.name || 'Photo.jpg',
    mimeType: 'image/jpeg',
    base64Data,
    previewUrl: jpegDataUrl,
  };
}

export async function preparePdfAttachment(file: File): Promise<PreparedAttachment> {
  if (file.size > AI_COST_RULES.maxPdfBytes) {
    throw new Error('PDF is too large. Maximum size is 4 MB.');
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read PDF file.'));
    reader.readAsDataURL(file);
  });
  const base64Data = dataUrl.split(',')[1] || '';
  return {
    id: `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kind: 'pdf',
    name: file.name || 'Document.pdf',
    mimeType: 'application/pdf',
    base64Data,
  };
}

// ─── Firestore Chat History (users/{uid}/aiChats/{chatId}) ────────────────────

function parseUpdatedAtMs(val: any): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (val && typeof val.toMillis === 'function') return val.toMillis();
  if (val && typeof val.seconds === 'number') return val.seconds * 1000;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

export function getCachedAiChats(uid?: string | null): SavedAiChat[] {
  if (!uid) return [];
  try {
    const raw = localStorage.getItem(`${AI_CHATS_CACHE_PREFIX}${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedAiChats(uid: string, chats: SavedAiChat[]): void {
  try {
    localStorage.setItem(`${AI_CHATS_CACHE_PREFIX}${uid}`, JSON.stringify(chats.slice(0, 60)));
  } catch {
    // Ignore quota errors
  }
}

export async function loadAiChatsFromFirestore(uid: string): Promise<SavedAiChat[]> {
  if (!uid || uid.startsWith('guest_')) return [];
  const q = query(
    collection(db, 'users', uid, 'aiChats'),
    orderBy('updatedAt', 'desc'),
    limit(60)
  );
  const snap = await getDocs(q);
  const list: SavedAiChat[] = snap.docs.map((d) => {
    const data = d.data() as Record<string, any>;
    const rawMessages = Array.isArray(data.messages) ? data.messages : [];
    return {
      id: d.id,
      mentor: Math.max(0, Math.min(4, Number(data.mentor) || 0)) as AiMentorId,
      title: String(data.title || 'New chat').slice(0, 48),
      updatedAt: parseUpdatedAtMs(data.updatedAt),
      messages: rawMessages
        .filter((m) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string')
        .map((m) => ({ role: m.role, text: m.text })),
    };
  });
  writeCachedAiChats(uid, list);
  return list;
}

export async function saveAiChatToFirestore(params: {
  uid: string;
  chatId: string;
  mentor: AiMentorId;
  messages: StoredAiMessage[];
}): Promise<SavedAiChat | null> {
  const { uid, chatId, mentor, messages } = params;
  if (!uid || uid.startsWith('guest_')) return null;

  // Persist only real user/model messages (never greetings, errors, or base64 blobs)
  const persistedMessages = messages
    .filter((m) => !m.isGreeting && !m.isError)
    .map((m) => {
      const labelPrefix =
        Array.isArray(m.attachmentLabels) && m.attachmentLabels.length > 0
          ? `${m.attachmentLabels.join(' ')}${m.text.trim() ? '\n' : ''}`
          : '';
      return {
        role: m.role,
        text: `${labelPrefix}${m.text.trim()}`.trim(),
      };
    })
    .filter((m) => m.text.length > 0)
    .slice(-100);

  if (persistedMessages.length === 0) return null;

  const firstUserMsg = persistedMessages.find((m) => m.role === 'user')?.text || 'New chat';
  const title = buildChatTitle(firstUserMsg);
  const nowMs = Date.now();

  const saved: SavedAiChat = {
    id: chatId,
    mentor,
    title,
    updatedAt: nowMs,
    messages: persistedMessages,
  };

  // Update local cache immediately
  const existing = getCachedAiChats(uid).filter((c) => c.id !== chatId);
  writeCachedAiChats(uid, [saved, ...existing]);

  await setDoc(
    doc(db, 'users', uid, 'aiChats', chatId),
    {
      mentor,
      title,
      updatedAt: nowMs,
      messages: persistedMessages,
    },
    { merge: true }
  );

  return saved;
}

export async function deleteAiChatFromFirestore(uid: string, chatId: string): Promise<void> {
  if (!uid || uid.startsWith('guest_')) return;
  const remaining = getCachedAiChats(uid).filter((c) => c.id !== chatId);
  writeCachedAiChats(uid, remaining);
  await deleteDoc(doc(db, 'users', uid, 'aiChats', chatId));
}

export async function deleteAllAiChatsFromFirestore(uid: string): Promise<number> {
  if (!uid || uid.startsWith('guest_')) return 0;
  writeCachedAiChats(uid, []);
  const colRef = collection(db, 'users', uid, 'aiChats');
  const snap = await getDocs(colRef);
  let deleted = 0;
  // Firestore batches support up to 500 ops each
  for (let i = 0; i < snap.docs.length; i += 450) {
    const batch = writeBatch(db);
    const slice = snap.docs.slice(i, i + 450);
    for (const d of slice) {
      batch.delete(d.ref);
      deleted++;
    }
    await batch.commit();
  }
  return deleted;
}

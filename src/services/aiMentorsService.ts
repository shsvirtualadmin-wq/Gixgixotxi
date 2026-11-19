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
  PRO_AI_CREDITS_PER_DAY,
  buildChatTitle,
  getPktDateKey,
  getPktResetInfo,
  type AiDepthId,
  type AiMentorId,
  type ApiContentMessage,
} from '@/utils/aiMentorsLogic';
import { readSwrCache, writeSwrCache } from '@/utils/userStateSource';

export interface AiCreditsStatus {
  creditsUsed: number;
  creditsLeft: number;
  dailyLimit: number;
  isUnlimited: boolean;
  isPro: boolean;
  isSuperAdmin: boolean;
  deepMaxUnlocked: boolean;
  plan: 'free' | 'pro';
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
  isPro: boolean;
  isSuperAdmin: boolean;
  source?: 'superadmin' | 'personal' | 'crew' | 'none';
}): AiCreditsStatus {
  const reset = getPktResetInfo();
  const dailyLimit = opts.isPro || opts.isSuperAdmin ? PRO_AI_CREDITS_PER_DAY : FREE_AI_CREDITS_PER_DAY;
  return {
    creditsUsed: 0,
    creditsLeft: dailyLimit,
    dailyLimit,
    isUnlimited: opts.isSuperAdmin,
    isPro: opts.isPro || opts.isSuperAdmin,
    isSuperAdmin: opts.isSuperAdmin,
    deepMaxUnlocked: opts.isPro || opts.isSuperAdmin,
    plan: opts.isPro || opts.isSuperAdmin ? 'pro' : 'free',
    source: opts.isSuperAdmin ? 'superadmin' : opts.source || (opts.isPro ? 'personal' : 'none'),
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
  return cached;
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
  fallbackOpts?: { isPro: boolean; isSuperAdmin: boolean; source?: 'superadmin' | 'personal' | 'crew' | 'none' }
): Promise<AiCreditsStatus> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    return buildFallbackCreditsStatus(
      fallbackOpts || { isPro: false, isSuperAdmin: false, source: 'none' }
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
    const status: AiCreditsStatus = {
      creditsUsed: Number(data.creditsUsed || 0),
      creditsLeft: Number(data.creditsLeft ?? data.dailyLimit ?? FREE_AI_CREDITS_PER_DAY),
      dailyLimit: Number(data.dailyLimit || FREE_AI_CREDITS_PER_DAY),
      isUnlimited: Boolean(data.isUnlimited),
      isPro: Boolean(data.isPro),
      isSuperAdmin: Boolean(data.isSuperAdmin),
      deepMaxUnlocked: Boolean(data.deepMaxUnlocked),
      plan: data.plan === 'pro' ? 'pro' : 'free',
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

export interface SendAiMessageResult {
  text: string;
  creditsLeft: number;
  creditsUsed: number;
  dailyLimit: number;
  isUnlimited: boolean;
  cost: number;
  resetAt: string;
  dateKey: string;
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

export async function sendAiMentorMessage(params: {
  mentor: AiMentorId;
  depth: AiDepthId;
  contents: ApiContentMessage[];
  signal?: AbortSignal;
}): Promise<SendAiMessageResult> {
  const token = await getIdTokenWithTimeout(10_000);
  if (!token) {
    throw new AiMentorApiError('Please sign in with a registered Boardly account to chat.', 401);
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 60_000);

  const onExternalAbort = () => controller.abort();
  if (params.signal) {
    if (params.signal.aborted) {
      window.clearTimeout(timeoutId);
      throw new AiMentorApiError('Request was cancelled.', 499, { code: 'ABORTED' });
    }
    params.signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mentor: params.mentor,
        depth: params.depth,
        contents: params.contents,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
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

    const answerText = String(data.text || '').trim();
    if (!answerText) {
      throw new AiMentorApiError(
        'The mentor returned an empty reply. Please try again.',
        502,
        { code: 'EMPTY_ANSWER' }
      );
    }

    return {
      text: answerText,
      creditsLeft: Number(data.creditsLeft ?? 0),
      creditsUsed: Number(data.creditsUsed ?? 0),
      dailyLimit: Number(data.dailyLimit ?? FREE_AI_CREDITS_PER_DAY),
      isUnlimited: Boolean(data.isUnlimited),
      cost: Number(data.cost ?? 0),
      resetAt: String(data.resetAt || getPktResetInfo().resetAtIso),
      dateKey: String(data.dateKey || getPktDateKey()),
    };
  } catch (err: any) {
    if (err instanceof AiMentorApiError) throw err;
    if (err?.name === 'AbortError') {
      if (timedOut) {
        throw new AiMentorApiError('Request timed out after 60 seconds. Please tap Retry.', 408, {
          code: 'CLIENT_TIMEOUT',
        });
      }
      throw new AiMentorApiError('Request was cancelled.', 499, { code: 'ABORTED' });
    }
    throw new AiMentorApiError(
      err?.message || 'Network error while reaching AI Mentor. Please try again.',
      0
    );
  } finally {
    window.clearTimeout(timeoutId);
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

/**
 * Boardly AI Tutor (Boardy) Service
 * Single source of truth for AI-powered step-by-step question derivations.
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { reportQuestion } from './testEngine';
import type { AttemptQuestion } from '@/types/index';

export const BOARDY_AI_MODEL = 'gemini-4-hydrogen';
export const BOARDY_AI_FALLBACK_MODEL = 'gemini-3.1-flash-lite';
export const FREE_DAILY_AI_TOKENS = 5;

// In-memory cache to guarantee successful explanations are never re-fetched
const explanationMemoryCache = new Map<string, string>();

export interface BoardyDerivationParams {
  question: AttemptQuestion;
  questionIndex: number;
  chosenAnswerIndex?: number | null;
  track?: string;
  isUnlimited: boolean;
  uid?: string;
  forceRefresh?: boolean;
}

export interface BoardyDerivationResult {
  explanation: string;
  cached: boolean;
  remainingTokens?: number;
  tokensUsed?: number;
  status: 'success' | 'reviewed' | 'limit_reached' | 'error';
  error?: string;
}

/**
 * Checks remaining daily AI tokens for a free tier student.
 */
export function getRemainingDailyAiTokens(uid: string): { used: number; remaining: number } {
  if (!uid) return { used: 0, remaining: FREE_DAILY_AI_TOKENS };
  const dateKey = getPKTDateKey();
  const storageKey = `boardy_ai_tokens_${uid}_${dateKey}`;
  const used = Number(localStorage.getItem(storageKey) || 0);
  const remaining = Math.max(0, FREE_DAILY_AI_TOKENS - used);
  return { used, remaining };
}

/**
 * Consumes 1 daily AI token for a free tier student.
 */
export function consumeDailyAiToken(uid: string): number {
  if (!uid) return 0;
  const dateKey = getPKTDateKey();
  const storageKey = `boardy_ai_tokens_${uid}_${dateKey}`;
  const used = Number(localStorage.getItem(storageKey) || 0);
  const updated = used + 1;
  localStorage.setItem(storageKey, String(updated));
  return updated;
}

/**
 * Generates or retrieves cached step-by-step derivation for an MCQ.
 */
export async function getBoardyExplanation(
  params: BoardyDerivationParams
): Promise<BoardyDerivationResult> {
  const {
    question,
    chosenAnswerIndex,
    track = 'Entrance Exam',
    isUnlimited,
    uid,
    forceRefresh = false,
  } = params;

  // 1. Safety check: Verify stored correct answer exists and is valid
  const options = Array.isArray(question.options) ? question.options : [];
  const correctIdx = typeof question.correct === 'number' ? question.correct : undefined;

  if (correctIdx === undefined || correctIdx < 0 || correctIdx >= options.length) {
    // Flag this question for admin review
    if (question.id && uid) {
      reportQuestion({
        questionId: question.id,
        reason: 'wrong_key',
        comment: '[Auto-Flag] AI explanation requested but stored correct answer was missing or out-of-bounds.',
        userId: uid,
      }).catch(() => {});
    }

    return {
      explanation: 'This question is currently being reviewed by the academic faculty. Correct answer key is being verified.',
      cached: false,
      status: 'reviewed',
      error: 'QUESTION_UNDER_REVIEW',
    };
  }

  const correctOptionText = String(options[correctIdx] || '');
  const chosenOptionText =
    chosenAnswerIndex !== undefined && chosenAnswerIndex !== null && options[chosenAnswerIndex] !== undefined
      ? String(options[chosenAnswerIndex])
      : 'Skipped';

  const cacheKey = `boardy_cache_q_${question.id || question.q?.slice(0, 30)}`;

  // 2. Caching check: If not forceRefresh, check for existing cached explanation
  if (!forceRefresh) {
    const memoryCached = explanationMemoryCache.get(cacheKey);
    if (memoryCached && memoryCached.trim().length > 20) {
      return {
        explanation: memoryCached,
        cached: true,
        status: 'success',
      };
    }

    const existingCache =
      (question as { cachedAiExplanation?: string }).cachedAiExplanation ||
      localStorage.getItem(cacheKey);

    if (existingCache && existingCache.trim().length > 20) {
      explanationMemoryCache.set(cacheKey, existingCache);
      return {
        explanation: existingCache,
        cached: true,
        status: 'success',
      };
    }
  }

  // 3. Token check: Free tier limited to 5 AI calls per calendar day (PKT)
  if (!isUnlimited && uid) {
    const { remaining, used } = getRemainingDailyAiTokens(uid);
    if (remaining <= 0) {
      return {
        explanation: `You've used all ${FREE_DAILY_AI_TOKENS} daily Boardy AI explanations for today. Upgrade to Pro or join a Study Crew to get unlimited AI derivations.`,
        cached: false,
        status: 'limit_reached',
        tokensUsed: used,
        remainingTokens: 0,
      };
    }
  }

  // 4. Request from backend `/api/ai-tutor` with retry & exponential backoff
  const requestPayload = {
    mode: 'mcq_derivation',
    questionText: question.q || question.stem || '',
    options,
    correctAnswer: {
      index: correctIdx,
      letter: ['A', 'B', 'C', 'D'][correctIdx] || 'A',
      text: correctOptionText,
    },
    chosenAnswer: {
      index: chosenAnswerIndex,
      letter:
        chosenAnswerIndex !== undefined && chosenAnswerIndex !== null
          ? ['A', 'B', 'C', 'D'][chosenAnswerIndex]
          : undefined,
      text: chosenOptionText,
    },
    subject: question.subject || 'General',
    chapter: question.chapter || 'General',
    track,
  };

interface ServiceHttpError extends Error {
  status?: number;
  code?: string;
  reason?: string;
}

  const executeCall = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offErr: ServiceHttpError = new Error('Client is offline');
      offErr.status = 0;
      offErr.code = 'OFFLINE';
      throw offErr;
    }

    const res = await fetch('/api/ai-tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    if (!res.ok) {
      let errData: Record<string, string | number> = {};
      try {
        errData = (await res.json()) as Record<string, string | number>;
      } catch {
        // non-json body
      }
      const errMsg = String(errData.error || `AI service returned status ${res.status}`);
      const err: ServiceHttpError = new Error(errMsg);
      err.status = res.status;
      err.code = String(
        errData.code || (res.status === 429 ? 'RATE_LIMIT' : res.status === 503 ? 'MODEL_UNAVAILABLE' : 'SERVER_ERROR')
      );
      err.reason = errMsg;
      throw err;
    }

    const data = (await res.json()) as { reply?: string; explanation?: string };
    const rawReply = data.reply || data.explanation || '';
    if (!rawReply || rawReply.trim().length === 0) {
      throw new Error('Empty reply received from AI tutor.');
    }
    return rawReply;
  };

  try {
    let rawReply = '';
    try {
      rawReply = await executeCall();
    } catch (firstErr: unknown) {
      const fe = firstErr as ServiceHttpError;
      console.warn('[boardyAiService] First derivation attempt failed, retrying with backoff:', fe?.status, fe?.message);
      // Backoff 1200ms before retry
      await new Promise((resolve) => setTimeout(resolve, 1200));
      rawReply = await executeCall();
    }

    // Cache the explanation locally and in memory
    explanationMemoryCache.set(cacheKey, rawReply);
    try {
      localStorage.setItem(cacheKey, rawReply);
      if (question.id) {
        const qRef = doc(db, 'questions', question.id);
        const qSnap = await getDoc(qRef);
        if (qSnap.exists()) {
          updateDoc(qRef, { cachedAiExplanation: rawReply }).catch(() => {});
        }
      }
    } catch {
      // Ignore storage/caching errors
    }

    // Consume 1 token for free tier
    if (!isUnlimited && uid) {
      consumeDailyAiToken(uid);
    }

    const { remaining, used } = uid ? getRemainingDailyAiTokens(uid) : { remaining: 5, used: 0 };

    return {
      explanation: rawReply,
      cached: false,
      status: 'success',
      tokensUsed: used,
      remainingTokens: remaining,
    };
  } catch (err: unknown) {
    const errorObj = err as ServiceHttpError;
    const status = errorObj?.status ?? (typeof navigator !== 'undefined' && !navigator.onLine ? 0 : 500);
    const reason = errorObj?.reason || errorObj?.message || 'Unknown network error';
    const code = errorObj?.code;

    // Log the real error (status code and reason) to the console
    console.error('[boardyAiService] Derivation failure:', {
      statusCode: status,
      reason,
      code,
      questionId: question.id,
      timestamp: new Date().toISOString(),
    });

    // Provide student with a specific, helpful message
    let studentMessage = 'Could not generate step-by-step solution right now. Tap "Re-derive" to try again.';

    if (code === 'OFFLINE' || (typeof navigator !== 'undefined' && !navigator.onLine) || reason.includes('Failed to fetch')) {
      studentMessage = 'You appear to be offline. Please check your internet connection and tap "Re-derive".';
    } else if (status === 429 || code === 'RATE_LIMIT' || reason.includes('429') || reason.toLowerCase().includes('quota') || reason.toLowerCase().includes('rate limit')) {
      studentMessage = 'Boardy AI rate limit reached. Please wait a few moments and tap "Re-derive".';
    } else if (status === 401 || status === 403 || code === 'BAD_KEY' || reason.toLowerCase().includes('api key') || reason.toLowerCase().includes('unauthenticated')) {
      studentMessage = 'AI service authentication error. Please contact academic support.';
    } else if (status === 503 || status === 500 || code === 'MODEL_UNAVAILABLE' || reason.toLowerCase().includes('unavailable') || reason.toLowerCase().includes('overloaded')) {
      studentMessage = 'Boardy AI is temporarily unavailable. Please tap "Re-derive" in a few seconds.';
    } else {
      studentMessage = `Could not generate step-by-step solution (${reason}). Tap "Re-derive" to retry.`;
    }

    return {
      explanation: studentMessage,
      cached: false,
      status: 'error',
      error: reason,
    };
  }
}

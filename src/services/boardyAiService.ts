/**
 * Boardly AI Tutor (Boardy) Service
 * Single source of truth for AI-powered step-by-step question derivations.
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { reportQuestion } from './testEngine';
import type { AttemptQuestion } from '@/types/index';

export const BOARDY_AI_MODEL = 'gemini-3.8-flash';
export const BOARDY_AI_FALLBACK_MODEL = 'gemini-flash-latest';
export const FREE_DAILY_AI_TOKENS = 5;

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
    // Check question document cachedAiExplanation
    const existingCache =
      (question as { cachedAiExplanation?: string }).cachedAiExplanation ||
      localStorage.getItem(cacheKey);

    if (existingCache && existingCache.trim().length > 20) {
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

  // 4. Request from backend `/api/ai-tutor` with full context
  try {
    const res = await fetch('/api/ai-tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
          letter: chosenAnswerIndex !== undefined && chosenAnswerIndex !== null ? ['A', 'B', 'C', 'D'][chosenAnswerIndex] : undefined,
          text: chosenOptionText,
        },
        subject: question.subject || 'General',
        chapter: question.chapter || 'General',
        track,
      }),
    });

    if (!res.ok) {
      throw new Error(`AI service returned status ${res.status}`);
    }

    const data = (await res.json()) as { reply?: string; explanation?: string };
    const rawReply = data.reply || data.explanation || '';

    if (!rawReply || rawReply.trim().length === 0) {
      throw new Error('Empty reply received from AI tutor.');
    }

    // Cache the explanation locally and on question doc if id exists
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
  } catch (err) {
    console.warn('[boardyAiService] Derivation error:', err);
    return {
      explanation:
        'Could not generate step-by-step solution right now. Please check your internet connection and try "Re-derive" in a moment.',
      cached: false,
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

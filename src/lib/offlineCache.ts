import { Question } from '../types';
import { checkQuestionTopicRelevance } from '../utils/topicValidator';

const MCQS_CACHE_KEY = 'shs_offline_mcqs_v2';
const HISTORY_CACHE_KEY = 'shs_offline_history_v1';

export interface CachedMcqSet {
  subject: string;
  customTopic?: string;
  questions: Question[];
  timestamp: number;
}

/**
 * Cache generated questions into LocalStorage for offline practice
 */
export function cacheGeneratedQuestions(
  subject: string,
  customTopic: string | undefined,
  questions: Question[]
): void {
  try {
    const raw = localStorage.getItem(MCQS_CACHE_KEY);
    let cachedSets: CachedMcqSet[] = raw ? JSON.parse(raw) : [];

    // Filter out duplicate or stale cache for the same subject/topic
    cachedSets = cachedSets.filter(
      (item) => !(item.subject === subject && (item.customTopic || '') === (customTopic || ''))
    );

    // Prepend new cache set
    cachedSets.unshift({
      subject,
      customTopic: customTopic || undefined,
      questions,
      timestamp: Date.now(),
    });

    // Keep top 30 cached sets to prevent localStorage overflow
    cachedSets = cachedSets.slice(0, 30);

    localStorage.setItem(MCQS_CACHE_KEY, JSON.stringify(cachedSets));
  } catch (err) {
    console.warn('Failed to cache MCQs to localStorage:', err);
  }
}

/**
 * Get cached questions for a subject/customTopic from LocalStorage when offline
 */
export function getCachedQuestions(subject: string, customTopic?: string): Question[] | null {
  try {
    const raw = localStorage.getItem(MCQS_CACHE_KEY);
    if (!raw) return null;

    const cachedSets: CachedMcqSet[] = JSON.parse(raw);
    const cleanSub = subject.split('(')[0].trim();

    // Look for matching set
    const match = cachedSets.find(
      (item) =>
        (item.subject === subject || item.subject.includes(cleanSub)) &&
        (!customTopic || (item.customTopic && item.customTopic.toLowerCase().includes(customTopic.toLowerCase())))
    );

    if (match && match.questions && match.questions.length > 0) {
      if (customTopic) {
        const filtered = match.questions.filter((q) =>
          checkQuestionTopicRelevance(q.q || '', q.topic, q.options || [], q.explain || '', customTopic, subject)
        );
        if (filtered.length > 0) return filtered;
      } else {
        return match.questions;
      }
    }

    // Only fallback to subject set if customTopic is generic or absent
    const isGenericTopic = !customTopic || customTopic.toLowerCase().includes('syllabus') || customTopic.toLowerCase().includes('all topic') || customTopic.toLowerCase().includes('all chapter');
    if (isGenericTopic) {
      const subjectMatch = cachedSets.find((item) => item.subject === subject || item.subject.includes(cleanSub));
      if (subjectMatch && subjectMatch.questions && subjectMatch.questions.length > 0) {
        return subjectMatch.questions;
      }
    }
  } catch (err) {
    console.warn('Error reading cached MCQs from localStorage:', err);
  }

  return null;
}

/**
 * Cache user test history locally
 */
export function saveHistoryOffline(historyItems: any[], userId?: string): void {
  try {
    const key = userId ? `${HISTORY_CACHE_KEY}_${userId}` : HISTORY_CACHE_KEY;
    localStorage.setItem(key, JSON.stringify(historyItems));
    if (userId) {
      // ALSO save to global key as fallback
      localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(historyItems));
    }
  } catch (err) {
    console.warn('Failed to save offline history:', err);
  }
}

/**
 * Load offline test history
 */
export function loadHistoryOffline(userId?: string): any[] {
  try {
    const map = new Map<string, any>();

    // 1. Load from specific user key if provided
    if (userId) {
      const userKey = `${HISTORY_CACHE_KEY}_${userId}`;
      const rawUser = localStorage.getItem(userKey);
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id) map.set(String(item.id), item);
          }
        }
      }
    }

    // 2. Load from global key
    const rawGlobal = localStorage.getItem(HISTORY_CACHE_KEY);
    if (rawGlobal) {
      const parsed = JSON.parse(rawGlobal);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.id && !map.has(String(item.id))) {
            map.set(String(item.id), item);
          }
        }
      }
    }

    return Array.from(map.values());
  } catch (err) {
    console.warn('Failed to load offline history:', err);
    return [];
  }
}

/**
 * Clear offline test history from localStorage
 */
export function clearHistoryOffline(userId?: string): void {
  try {
    const key = userId ? `${HISTORY_CACHE_KEY}_${userId}` : HISTORY_CACHE_KEY;
    localStorage.removeItem(key);
    localStorage.removeItem(HISTORY_CACHE_KEY);
  } catch (err) {
    console.warn('Failed to clear offline history:', err);
  }
}

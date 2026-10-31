import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatChapterName, formatSubjectName } from '@/constants/taxonomy';

export interface ChapterStatItem {
  id: string;
  chapter: string;
  chapterSlug: string;
  subject: string;
  subjectSlug: string;
  correct: number;
  total: number;
  accuracy: number;
  isWeak: boolean;
  notEnoughData: boolean;
  notAttempted: boolean;
}

interface CachedChapterStats {
  statsMap: Record<string, ChapterStatItem>;
  weakChapters: ChapterStatItem[];
  timestamp: number;
}

const chapterStatsCache = new Map<string, CachedChapterStats>();

export function invalidateChapterStatsCache(uid?: string) {
  if (uid) {
    chapterStatsCache.delete(uid);
  } else {
    chapterStatsCache.clear();
  }
}

export function useUserChapterStats(uid?: string | null) {
  const cached = uid && chapterStatsCache.has(uid) ? chapterStatsCache.get(uid)! : null;
  const isFresh = cached && Date.now() - cached.timestamp < 180000;

  const [statsMap, setStatsMap] = useState<Record<string, ChapterStatItem>>(() =>
    isFresh ? cached.statsMap : {}
  );
  const [weakChapters, setWeakChapters] = useState<ChapterStatItem[]>(() =>
    isFresh ? cached.weakChapters : []
  );
  const [loading, setLoading] = useState<boolean>(() => !isFresh);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setStatsMap({});
      setWeakChapters([]);
      setLoading(false);
      return;
    }

    if (chapterStatsCache.has(uid)) {
      const entry = chapterStatsCache.get(uid)!;
      if (Date.now() - entry.timestamp < 180000) {
        setStatsMap(entry.statsMap);
        setWeakChapters(entry.weakChapters);
        setLoading(false);
        return;
      }
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .get<{ chapterStats?: Array<Record<string, unknown>> }>(
        `/api/users/${encodeURIComponent(uid)}/chapter-stats`,
        { silentToast: true }
      )
      .then((res) => {
        if (!isMounted) return;
        const rows = Array.isArray(res?.chapterStats) ? res.chapterStats : [];
        const map: Record<string, ChapterStatItem> = {};
        const weakList: ChapterStatItem[] = [];

        rows.forEach((data) => {
          const chapterSlug = String(data.chapter || data.id || '').trim().toLowerCase();
          if (!chapterSlug) return;
          const subjectSlug = String(data.subject || 'general').trim().toLowerCase();
          const correct = Number(data.correct ?? 0);
          const total = Number(data.total ?? 0);
          const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
          const notAttempted = total === 0;
          const notEnoughData = total > 0 && total < 3;
          const isWeak = total >= 3 && accuracy < 50;

          const chapterDisplay =
            formatChapterName(subjectSlug, chapterSlug) || chapterSlug || 'General Drill';
          const subjectDisplay = formatSubjectName(subjectSlug) || 'General';

          const item: ChapterStatItem = {
            id: chapterSlug,
            chapterSlug,
            chapter: chapterDisplay,
            subjectSlug,
            subject: subjectDisplay,
            correct,
            total,
            accuracy,
            isWeak,
            notEnoughData,
            notAttempted,
          };

          map[chapterSlug] = item;
          if (item.chapter) {
            map[item.chapter.toLowerCase()] = item;
          }

          if (isWeak) {
            weakList.push(item);
          }
        });

        weakList.sort((a, b) => a.accuracy - b.accuracy);

        setStatsMap(map);
        setWeakChapters(weakList);
        chapterStatsCache.set(uid, {
          statsMap: map,
          weakChapters: weakList,
          timestamp: Date.now(),
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[useUserChapterStats] D1 fetch notice:', err);
        setError('Could not load chapter statistics');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [uid]);

  return { statsMap, weakChapters, loading, error };
}

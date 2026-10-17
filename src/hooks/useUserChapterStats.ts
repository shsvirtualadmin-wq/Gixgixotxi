import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ChapterStatItem {
  id: string;
  chapter: string;
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  isWeak: boolean;
  notEnoughData: boolean;
  notAttempted: boolean;
}

export function useUserChapterStats(uid?: string | null) {
  const [statsMap, setStatsMap] = useState<Record<string, ChapterStatItem>>({});
  const [weakChapters, setWeakChapters] = useState<ChapterStatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setStatsMap({});
      setWeakChapters([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getDocs(collection(db, 'users', uid, 'chapterStats'))
      .then((snap) => {
        if (!isMounted) return;
        const map: Record<string, ChapterStatItem> = {};
        const weakList: ChapterStatItem[] = [];

        snap.docs.forEach((d) => {
          const data = d.data();
          const chapter = String(data.chapter || d.id).trim();
          const subject = String(data.subject || 'General').trim();
          const correct = Number(data.correct ?? 0);
          const total = Number(data.total ?? 0);
          const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
          const notAttempted = total === 0;
          const notEnoughData = total > 0 && total < 3;
          // Per specification: Weak chapters ONLY if at least 3 answered questions AND < 50% accuracy
          const isWeak = total >= 3 && accuracy < 50;

          const item: ChapterStatItem = {
            id: d.id,
            chapter,
            subject,
            correct,
            total,
            accuracy,
            isWeak,
            notEnoughData,
            notAttempted,
          };

          map[chapter.toLowerCase()] = item;
          // Also key by id
          map[d.id.toLowerCase()] = item;

          if (isWeak) {
            weakList.push(item);
          }
        });

        // Sort weak chapters lowest accuracy first
        weakList.sort((a, b) => a.accuracy - b.accuracy);

        setStatsMap(map);
        setWeakChapters(weakList);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[useUserChapterStats] Fetch notice:', err);
        setError('Could not load chapter statistics');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [uid]);

  return { statsMap, weakChapters, loading, error };
}

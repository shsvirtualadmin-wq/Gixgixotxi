import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  Target,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Swords,
  Lock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Modal } from '../ui/Modal';

interface EventDoc {
  id: string;
  type: 'blitz' | 'arena' | 'mock';
  title: string;
  description: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  questionCount: number;
  status: 'scheduled' | 'live' | 'completed';
  registeredCount?: number;
}

interface LeaderboardItem {
  id: string;
  student_id: string;
  student_name: string;
  subject?: string;
  score: number;
  total: number;
  percentage: number;
  time_taken_seconds?: number;
  created_at: string;
}

interface EventsArenaViewProps {
  onEnterExam: (eventId: string) => void;
}

export function maskDisplayName(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
  }
  if (email && email.includes('@')) {
    const local = email.split('@')[0];
    return `${local.charAt(0).toUpperCase()}${local.slice(1, 3)}***`;
  }
  return 'Student';
}

export function getNextSundayBlitzTime(): Date {
  const now = new Date();
  const pktTime = new Date(now.getTime() + (5 * 60 + now.getTimezoneOffset()) * 60000);
  const day = pktTime.getDay();
  const daysUntilSunday = (7 - day) % 7;
  const target = new Date(pktTime);
  target.setDate(pktTime.getDate() + (daysUntilSunday === 0 && pktTime.getHours() >= 20 ? 7 : daysUntilSunday));
  target.setHours(20, 0, 0, 0);
  return new Date(target.getTime() - 5 * 60 * 60000);
}

export const EventsArenaView: React.FC<EventsArenaViewProps> = ({
  onEnterExam,
}) => {
  const { user, profile } = useAuth();

  const [events, setEvents] = useState<EventDoc[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<Record<string, boolean>>({});

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegisteringId, setIsRegisteringId] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ message: string; path?: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'events' | 'leaderboard'>('events');

  // Next Sunday Blitz countdown ticker
  const [blitzCountdown, setBlitzCountdown] = useState<{ d: number; h: number; m: number; s: number }>({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const target = getNextSundayBlitzTime();
      const diff = Math.max(0, target.getTime() - Date.now());
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setBlitzCountdown({ d, h, m, s });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEventsAndLeaderboard = async () => {
    setIsLoading(true);
    setErrorInfo(null);
    const eventsPath = 'events';

    try {
      // 1. Fetch real events
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('scheduledAt', 'desc'),
        limit(20)
      );
      const eventsSnap = await getDocs(eventsQuery);
      const eventList: EventDoc[] = eventsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setEvents(eventList);

      // 2. Fetch user's registered events
      if (user?.uid) {
        const regQuery = query(
          collection(db, 'registrations'),
          where('userId', '==', user.uid)
        );
        const regSnap = await getDocs(regQuery);
        const regMap: Record<string, boolean> = {};
        regSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.eventId) regMap[data.eventId] = true;
        });
        setUserRegistrations(regMap);
      }

      // 3. Fetch real sessionResults for Leaderboard
      const leaderboardQuery = query(
        collection(db, 'sessionResults'),
        orderBy('score', 'desc'),
        limit(20)
      );
      const lbSnap = await getDocs(leaderboardQuery);
      const lbList: LeaderboardItem[] = lbSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setLeaderboard(lbList);
    } catch (err: any) {
      logFirestoreError(eventsPath, err, 'events_arena_fetch');
      setErrorInfo({
        message: err?.message || 'Unable to fetch events or leaderboard data.',
        path: eventsPath,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndLeaderboard();
  }, [user?.uid]);

  const handleRegister = async (event: EventDoc) => {
    if (!user?.uid || isRegisteringId) return;
    setIsRegisteringId(event.id);
    const regDocId = `reg_${user.uid}_${event.id}`;
    const regPath = `registrations/${regDocId}`;

    try {
      await setDoc(doc(db, 'registrations', regDocId), {
        id: regDocId,
        eventId: event.id,
        userId: user.uid,
        userEmail: user.email?.toLowerCase().trim() || '',
        userName: profile?.name || user.displayName || 'Student',
        registeredAt: new Date().toISOString(),
        status: 'confirmed',
        seatNumber: `B-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: serverTimestamp(),
      });

      setUserRegistrations((prev) => ({ ...prev, [event.id]: true }));
    } catch (err: any) {
      logFirestoreError(regPath, err, 'event_registration');
      alert(`Registration failed: ${err?.message || 'Please retry.'}`);
    } finally {
      setIsRegisteringId(null);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display flex items-center gap-2">
            <span>Boardly Blitz & Arena Mocks</span>
            <Trophy className="w-6 h-6 text-amber-400" />
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Compete live against students nationwide under negative marking constraints and view national ranks.
          </p>
        </div>
      </div>

      {errorInfo && (
        <ErrorState
          title="Could not load Arena events"
          error={errorInfo.message}
          path={errorInfo.path}
          onRetry={fetchEventsAndLeaderboard}
        />
      )}

      {/* View Switcher */}
      <div className="flex items-center gap-2 border-b border-white/8 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'events'
              ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/30'
              : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
          }`}
        >
          Live & Scheduled Mocks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/30'
              : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
          }`}
        >
          National Leaderboard
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={140} className="rounded-3xl" />
          ))}
        </div>
      )}

      {/* TAB 1: Events List */}
      {!isLoading && activeTab === 'events' && (
        <div className="space-y-4">
          {/* Conic Gradient Live Hero Card */}
          <div className="relative rounded-3xl p-[1.5px] bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-600 via-cyan-400 to-indigo-600 shadow-2xl mb-6">
            <div className="rounded-3xl bg-[#0B1220]/95 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-[#22D3EE]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sunday National Blitz Mock • 8:00 PM PKT</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Next National Entrance Blitz Battle
                </h2>
                <p className="text-xs sm:text-sm text-[#A3B0CC] max-w-xl leading-relaxed">
                  Compete simultaneously against candidates from top colleges across Pakistan. 100 entrance-standard MCQs, synchronized timer, instant percentile ranking, and chapter mastery analytics.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#A3B0CC] pt-1">
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <Swords className="w-3.5 h-3.5 text-amber-400" /> Negative Marking Active
                  </span>
                  <span>•</span>
                  <span>Free entry for all registered students</span>
                </div>
              </div>

              {/* Countdown Ticker */}
              <div className="shrink-0 flex flex-col items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/8 min-w-[240px]">
                <span className="text-xs font-bold text-[#A3B0CC] uppercase tracking-wider">Starts In</span>
                <div className="flex items-center gap-2 font-mono">
                  <div className="text-center">
                    <span className="text-xl sm:text-2xl font-black text-white">{blitzCountdown.d}</span>
                    <span className="block text-[10px] text-[#A3B0CC]">DAYS</span>
                  </div>
                  <span className="text-lg text-white/40">:</span>
                  <div className="text-center">
                    <span className="text-xl sm:text-2xl font-black text-white">{String(blitzCountdown.h).padStart(2, '0')}</span>
                    <span className="block text-[10px] text-[#A3B0CC]">HRS</span>
                  </div>
                  <span className="text-lg text-white/40">:</span>
                  <div className="text-center">
                    <span className="text-xl sm:text-2xl font-black text-white">{String(blitzCountdown.m).padStart(2, '0')}</span>
                    <span className="block text-[10px] text-[#A3B0CC]">MIN</span>
                  </div>
                  <span className="text-lg text-white/40">:</span>
                  <div className="text-center">
                    <span className="text-xl sm:text-2xl font-black text-[#22D3EE]">{String(blitzCountdown.s).padStart(2, '0')}</span>
                    <span className="block text-[10px] text-[#A3B0CC]">SEC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {events.length === 0 ? (
            <EmptyState
              title="No live Arena sessions right now"
              description="National mock sessions are held on weekends at 8:00 PM PKT. Check back shortly for registration open alerts."
              icon={<Trophy className="w-8 h-8 text-amber-400" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map((evt) => {
                const isRegistered = Boolean(userRegistrations[evt.id]);
                const isLive = evt.status === 'live';
                const scheduledDate = new Date(evt.scheduledAt).toLocaleString('en-PK', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });

                return (
                  <Card
                    key={evt.id}
                    variant="glass"
                    className={`p-6 flex flex-col justify-between space-y-4 border transition-all text-left ${
                      isLive
                        ? 'border-emerald-500 shadow-[0_0_24px_-4px_rgba(52,211,153,0.3)] bg-gradient-to-tr from-emerald-950/20 to-slate-900/40'
                        : 'border-white/8 hover:border-white/15'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={isLive ? 'success' : 'student'} size="sm">
                          {isLive ? '● Live Now' : evt.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-mono text-[var(--text-faint)]">
                          {evt.questionCount} Questions
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                        {evt.title}
                      </h3>

                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-faint)] pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {scheduledDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {evt.durationMinutes} min
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/8 flex items-center justify-between gap-3">
                      {isRegistered ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Registered</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-faint)]">
                          Free entry for all students
                        </span>
                      )}

                      {isLive ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onEnterExam(evt.id)}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                          className="shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          Enter Exam Lobby
                        </Button>
                      ) : isRegistered ? (
                        <Button variant="ghost" size="sm" disabled className="text-xs">
                          Lobby opens at start time
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isRegisteringId === evt.id}
                          onClick={() => handleRegister(evt)}
                          leftIcon={<Zap className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Reserve Seat
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Real Leaderboard from sessionResults */}
      {!isLoading && activeTab === 'leaderboard' && (
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div>
              <h3 className="text-base font-bold text-white font-display">National Arena Standings</h3>
              <p className="text-xs text-[var(--text-muted)]">Verified entrance mock test rankings</p>
            </div>
            <Badge variant="student" size="sm" className="font-mono">
              Top 20 Candidates
            </Badge>
          </div>

          {leaderboard.length === 0 ? (
            <EmptyState
              title="No leaderboard scores recorded"
              description="Be the first to finish an Arena sprint to top the national board."
            />
          ) : (
            <div className="space-y-2">
              {leaderboard.map((item, idx) => {
                const displayName = maskDisplayName(item.student_name);
                const rank = idx + 1;
                const isTop3 = rank <= 3;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                      isTop3 ? 'bg-white/8 border border-white/12' : 'bg-white/4 border border-white/6'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl font-mono font-bold text-xs flex items-center justify-center ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/20'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/5 text-[var(--text-muted)]'
                        }`}
                      >
                        {rank}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{displayName}</h4>
                        <span className="text-[10px] text-[var(--text-faint)] font-mono">
                          {item.subject || 'National Mock'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-[#34D399] font-mono">
                        {item.score} / {item.total}
                      </span>
                      <span className="text-[10px] text-[var(--text-faint)] block font-mono">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

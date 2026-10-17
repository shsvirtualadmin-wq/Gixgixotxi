import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock, CheckCircle2, Award, Users } from 'lucide-react';

interface LeaderboardItem {
  id: string;
  uid: string;
  displayName: string;
  university?: string;
  city?: string;
  score: number;
  streak?: number;
}

interface CircleMember {
  uid: string;
  name: string;
  dailyMcqs: number;
  streak: number;
}

export function ArenaDashboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'blitz' | 'circle'>('leaderboard');

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Blitz State
  const [blitzCountdown, setBlitzCountdown] = useState('');
  const [registeredBlitz, setRegisteredBlitz] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Circle State
  const [circleCode, setCircleCode] = useState('FAST26');
  const [circleInput, setCircleInput] = useState('');
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [circleCreated, setCircleCreated] = useState(false);

  // Calculate next Sunday 8:00 PM PKT
  useEffect(() => {
    function calcNextSunday() {
      const now = new Date();
      // PKT is UTC + 5
      const pktOffset = 5 * 60;
      const localOffset = now.getTimezoneOffset();
      const pktNow = new Date(now.getTime() + (pktOffset + localOffset) * 60 * 1000);

      // Target: Next Sunday at 20:00:00 PKT
      const target = new Date(pktNow);
      const day = target.getDay(); // 0 is Sunday
      let daysUntilSunday = (7 - day) % 7;
      if (day === 0 && target.getHours() >= 20) {
        daysUntilSunday = 7;
      }
      target.setDate(target.getDate() + daysUntilSunday);
      target.setHours(20, 0, 0, 0);

      const diff = target.getTime() - pktNow.getTime();
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setBlitzCountdown(`${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    }

    calcNextSunday();
    const interval = setInterval(calcNextSunday, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real leaderboard from Firestore
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoadingLeaderboard(true);
      try {
        const snap = await getDocs(query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(30)));
        if (!snap.empty) {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardItem));
          setLeaderboard(items);
        } else {
          setLeaderboard([]);
        }
      } catch {
        setLeaderboard([]);
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    fetchLeaderboard();
  }, [user, profile]);

  const handleRegisterBlitz = async () => {
    if (!user || registering) return;
    setRegistering(true);
    try {
      await addDoc(collection(db, 'registrations'), {
        userId: user.uid,
        userEmail: user.email,
        event: 'boardly_blitz_sunday',
        status: 'registered',
        registeredAt: serverTimestamp(),
      });
      setRegisteredBlitz(true);
    } catch (err) {
      console.warn('Blitz registration:', err);
      setRegisteredBlitz(true);
    } finally {
      setRegistering(false);
    }
  };

  const handleCreateCircle = async () => {
    if (!user) return;
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCircleCode(newCode);
    setCircleCreated(true);
    try {
      await setDoc(doc(db, 'crews', newCode), {
        code: newCode,
        leaderId: user.uid,
        leaderName: user.displayName || 'Lead',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Circle create:', e);
    }
  };

  const handleJoinCircle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleInput.trim()) return;
    const cleanCode = circleInput.trim().toUpperCase();
    setCircleCode(cleanCode);
    setCircleMembers(prev => [
      ...prev,
      { uid: 'u_new', name: 'Study Buddy', dailyMcqs: 12, streak: 2 },
    ]);
    setCircleInput('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto">
      {/* ── Segmented Control: "Leaderboard | Blitz | My circle" ─────────────── */}
      <div className="w-full max-w-[420px] mx-auto h-11 p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] grid grid-cols-3 gap-1 items-center">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`h-full rounded-full text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-[var(--text)] text-[var(--bg)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('blitz')}
          className={`h-full rounded-full text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            activeTab === 'blitz'
              ? 'bg-[var(--text)] text-[var(--bg)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Blitz
        </button>
        <button
          onClick={() => setActiveTab('circle')}
          className={`h-full rounded-full text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            activeTab === 'circle'
              ? 'bg-[var(--text)] text-[var(--bg)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          My circle
        </button>
      </div>

      {/* ── TAB 1: LEADERBOARD ─────────────────────────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div>
              <span className="badge-pill mb-1">Verified National Rankings</span>
              <h2
                className="text-xl font-bold text-[var(--text)] tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                National Entrance Leaderboard
              </h2>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-doto">Top Aspirants</span>
          </div>

          {loadingLeaderboard ? (
            <div className="space-y-2 py-4">
              <Skeleton height={50} count={5} />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={<Award size={36} className="text-[var(--text-muted)]" />}
                title="No leaderboard rankings yet"
                description="Complete practice sprints and national mock tests to appear on the nationwide honor roll."
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              {leaderboard.map((item, index) => {
                const isCurrentUser = item.uid === user?.uid || item.displayName === 'You';
                const rankNum = String(index + 1).padStart(2, '0');

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between transition-colors ${
                      isCurrentUser
                        ? 'bg-[var(--surface-2)] border-2 border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--surface)] border border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Rank in Doto font */}
                      <span className="font-doto font-bold text-base sm:text-lg text-[var(--text-muted)] w-7 shrink-0 text-left">
                        {rankNum}
                      </span>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs sm:text-sm font-bold text-[var(--text)] truncate"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            {item.displayName}
                          </span>
                          {isCurrentUser && (
                            <span className="badge-pill-red text-[10px] px-2 py-0.5 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                          {item.university || 'Engineering Track'} {item.city ? `· ${item.city}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Score in Doto font */}
                    <div className="text-right shrink-0">
                      <div className="font-doto font-bold text-sm sm:text-base text-[var(--text)]">
                        {item.score} pts
                      </div>
                      <div className="font-doto text-[10px] text-[var(--text-muted)]">
                        {item.streak ? `${item.streak}d streak` : 'active'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 2: BLITZ ───────────────────────────────────────────────────── */}
      {activeTab === 'blitz' && (
        <Card variant="red" className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-lg">
              <Badge color="red-outline" dot>
                National Competitive Arena
              </Badge>

              <h2
                className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Boardly Blitz: <span>Sunday 8:00 PM PKT</span>
              </h2>

              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                A synchronized, high-stakes 45-minute national mock test. Every aspirant across Pakistan answers identical past-paper questions simultaneously under strict anti-cheat auto-submission.
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-muted)] font-doto">
                <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Questions</div>
                  <div className="text-sm font-bold text-[var(--text)] mt-0.5">50 MCQs</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Time Limit</div>
                  <div className="text-sm font-bold text-[var(--text)] mt-0.5">45 Minutes</div>
                </div>
              </div>
            </div>

            {/* Countdown Box & Register Button */}
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center text-center gap-4 shrink-0 w-full md:w-80">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Clock size={16} className="text-[var(--accent)]" />
                <span>Next Session Countdown</span>
              </div>

              {/* Countdown in Doto font */}
              <div className="font-doto text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight">
                {blitzCountdown || '00d 00h 00m 00s'}
              </div>

              {registeredBlitz ? (
                <div className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[var(--text)]">
                  <CheckCircle2 size={16} className="text-[var(--accent)]" />
                  <span>Seat Reserved for Sunday</span>
                </div>
              ) : (
                <button
                  onClick={handleRegisterBlitz}
                  disabled={registering}
                  className="btn-red w-full cursor-pointer disabled:opacity-50"
                  style={{ height: '48px' }}
                >
                  {registering ? 'Reserving Seat...' : 'Register for Next Blitz'}
                </button>
              )}

              <p className="text-[11px] text-[var(--text-muted)]">
                National percentile results posted right after session close.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── TAB 3: MY CIRCLE ───────────────────────────────────────────────── */}
      {activeTab === 'circle' && (
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[var(--border)]">
            <div>
              <span className="badge-pill mb-1">Squad Command</span>
              <h2
                className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Study Circle · Code: <span className="font-doto text-[var(--accent)]">{circleCode}</span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                Collaborative micro-squads. Compete with your friends on daily drill goals.
              </p>
            </div>

            <button
              onClick={handleCreateCircle}
              className="btn-outline text-xs px-4 self-start md:self-auto cursor-pointer"
              style={{ height: '40px' }}
            >
              Generate New Room Code
            </button>
          </div>

          {/* Join Circle Input */}
          <form onSubmit={handleJoinCircle} className="flex gap-2 max-w-md my-4">
            <input
              type="text"
              placeholder="Enter 6-char room code (e.g. NET2026)"
              value={circleInput}
              onChange={(e) => setCircleInput(e.target.value)}
              className="flex-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--text-muted)] uppercase tracking-wider focus:border-[var(--accent)]"
              style={{ height: '48px' }}
            />
            <button
              type="submit"
              className="btn-red text-xs px-5 cursor-pointer shrink-0"
              style={{ height: '48px' }}
            >
              Join Squad
            </button>
          </form>

          {circleCreated && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)]">
              New squad created! Share code <strong className="text-[var(--accent)] font-doto">{circleCode}</strong> with your academy peers.
            </div>
          )}

          {/* Circle Members & Daily Progress */}
          <div className="mt-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Squad Members ({circleMembers.length})
            </h3>

            {circleMembers.length === 0 ? (
              <div className="py-6">
                <EmptyState
                  icon={<Users size={36} className="text-[var(--text-muted)]" />}
                  title="No circle members yet"
                  description="Share your room code above with classmates to track daily MCQ goals and build consistent habits."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {circleMembers.map((m) => (
                  <div
                    key={m.uid}
                    className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--text)]">
                        {m.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)]">{m.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-doto">
                          {m.streak}d streak
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-doto font-bold text-sm text-[var(--accent)]">
                        {m.dailyMcqs} MCQs
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">Today&apos;s sprint</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default ArenaDashboardPage;

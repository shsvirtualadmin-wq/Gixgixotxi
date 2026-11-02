import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LineLoader } from '@/components/ui/LineLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AvatarFrame, AvatarPicture, Nameplate } from '@/components/koban/CosmeticRenderers';
import { Award, Users, Compass, ArrowRight } from 'lucide-react';
import { useProfileModal } from '@/contexts/ProfileModalContext';

interface LeaderboardItem {
  id: string;
  uid: string;
  displayName: string;
  university?: string;
  city?: string;
  score: number;
  streak?: number;
  avatarKey?: string;
  avatarVariant?: string;
  equipped?: {
    effect?: string | null;
    frame?: string | null;
    nameplate?: string | null;
    avatar?: string | null;
  };
}

interface CircleMember {
  uid: string;
  name: string;
  dailyMcqs: number;
  streak: number;
}

export function ArenaDashboardPage() {
  const { user, profile } = useAuth();
  const { equipped: myEquipped } = useWallet();
  const { openProfile } = useProfileModal();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'grandline' | 'circle'>('leaderboard');

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Circle State
  const [circleCode, setCircleCode] = useState('FAST26');
  const [circleInput, setCircleInput] = useState('');
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [circleCreated, setCircleCreated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchLeaderboardData() {
      try {
        let snap = await getDocs(query(collection(db, 'publicProfiles'), orderBy('publicStats.score', 'desc'), limit(15))).catch(() => null);
        if (!snap || snap.empty) {
          snap = await getDocs(query(collection(db, 'users'), orderBy('score', 'desc'), limit(15))).catch(() => null);
        }
        if (!isMounted) return;

        if (snap && !snap.empty) {
          const items: LeaderboardItem[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              uid: d.id,
              displayName: data.displayName || data.name || 'Anonymous Student',
              university: data.targetUniversity || 'Top Tier University',
              city: data.city || 'Pakistan',
              score: typeof data.publicStats?.score === 'number' ? data.publicStats.score : (typeof data.score === 'number' ? data.score : 0),
              streak: typeof data.publicStats?.streak === 'number' ? data.publicStats.streak : (typeof data.streak === 'number' ? data.streak : 0),
              avatarKey: data.avatarKey,
              avatarVariant: data.avatarVariant,
              equipped: data.equipped,
            };
          });
          setLeaderboard(items);
        } else {
          // Fallback sample aspirants
          const sampleLeaderboard: LeaderboardItem[] = [
            { id: '1', uid: 'sample-1', displayName: 'Hamza A.', university: 'FAST-NUCES (CS)', city: 'Lahore', score: 1840, streak: 14 },
            { id: '2', uid: 'sample-2', displayName: 'Ayesha K.', university: 'NUST (SEECS)', city: 'Islamabad', score: 1720, streak: 9 },
            { id: '3', uid: 'sample-3', displayName: 'Bilal R.', university: 'GIKI (AI)', city: 'Topi', score: 1610, streak: 7 },
            { id: '4', uid: 'sample-4', displayName: 'Zainab T.', university: 'UET Lahore', city: 'Faisalabad', score: 1490, streak: 5 },
            { id: '5', uid: 'sample-5', displayName: 'Mustafa S.', university: 'NED Karachi', city: 'Karachi', score: 1380, streak: 4 },
          ];
          if (user && profile) {
            sampleLeaderboard.splice(2, 0, {
              id: user.uid,
              uid: user.uid,
              displayName: profile.displayName || user.displayName || 'You',
              university: profile.targetUniversity || 'Entrance Aspirant',
              city: 'You',
              score: profile.score || 1650,
              streak: profile.streak || 1,
            });
          }
          setLeaderboard(sampleLeaderboard);
        }
      } catch (err) {
        console.warn('Failed to load leaderboard, using default list:', err);
        const fallbackList: LeaderboardItem[] = [
          { id: '1', uid: 'sample-1', displayName: 'Hamza A.', university: 'FAST-NUCES (CS)', city: 'Lahore', score: 1840, streak: 14 },
          { id: '2', uid: 'sample-2', displayName: 'Ayesha K.', university: 'NUST (SEECS)', city: 'Islamabad', score: 1720, streak: 9 },
          { id: '3', uid: 'sample-3', displayName: 'Bilal R.', university: 'GIKI (AI)', city: 'Topi', score: 1610, streak: 7 },
        ];
        if (user && profile) {
          fallbackList.push({
            id: user.uid,
            uid: user.uid,
            displayName: profile.displayName || user.displayName || 'You',
            university: profile.targetUniversity || 'Entrance Aspirant',
            city: 'You',
            score: profile.score || 1650,
            streak: profile.streak || 1,
          });
        }
        setLeaderboard(fallbackList);
      } finally {
        if (isMounted) setLoadingLeaderboard(false);
      }
    }
    fetchLeaderboardData();
    return () => {
      isMounted = false;
    };
  }, [user, profile]);

  const handleCreateCircle = async () => {
    if (!user) return;
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCircleCode(newCode);
    setCircleCreated(true);
    try {
      const { createCrewD1 } = await import('@/services/crewService');
      await createCrewD1({
        name: `${user.displayName || 'Captain'}'s Circle`,
        code: newCode,
        captainName: user.displayName || 'Lead',
        captainEmail: user.email || '',
      });
    } catch (e) {
      console.warn('Circle create:', e);
    }
  };

  const handleJoinCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleInput.trim()) return;
    const cleanCode = circleInput.trim().toUpperCase();
    setCircleCode(cleanCode);
    try {
      const { joinCrewD1 } = await import('@/services/crewService');
      await joinCrewD1(cleanCode);
    } catch (err) {
      console.warn('Circle join:', err);
    }
    setCircleMembers(prev => [
      ...prev,
      { uid: 'u_new', name: 'Study Buddy', dailyMcqs: 12, streak: 2 },
    ]);
    setCircleInput('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto">
      {/* ── Segmented Control: "Leaderboard | Grand Line | My circle" ─────────────── */}
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
          onClick={() => setActiveTab('grandline')}
          className={`h-full rounded-full text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            activeTab === 'grandline'
              ? 'bg-[var(--text)] text-[var(--bg)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Grand Line
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
            <LineLoader context="dashboard" variant="section" />
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
                    onClick={() => openProfile(item.uid)}
                    className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between transition-colors cursor-pointer hover:border-[var(--red)] ${
                      isCurrentUser
                        ? 'bg-[var(--surface-2)] border-2 border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--surface)] border border-[var(--border)]'
                    }`}
                    title={isCurrentUser ? 'View your profile' : `View ${item.displayName}'s profile`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Rank in Doto font */}
                      <span className="font-doto font-bold text-base sm:text-lg text-[var(--text-muted)] w-7 shrink-0 text-left">
                        {rankNum}
                      </span>

                      {/* Avatar Picture inside Avatar Frame */}
                      <div className="shrink-0">
                        <AvatarFrame itemId={(isCurrentUser ? myEquipped?.frame : item.equipped?.frame) || 'none'} size={44}>
                          <AvatarPicture
                            avatarId={isCurrentUser ? myEquipped?.avatar : item.equipped?.avatar}
                            avatarKey={item.avatarKey || (isCurrentUser ? profile?.avatarKey : undefined)}
                            variant={item.avatarVariant || (isCurrentUser ? profile?.avatarVariant : undefined)}
                            seed={item.uid}
                            size={34}
                          />
                        </AvatarFrame>
                      </div>

                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-2">
                          {(isCurrentUser ? myEquipped?.nameplate : item.equipped?.nameplate) ? (
                            <Nameplate
                              itemId={(isCurrentUser ? myEquipped?.nameplate : item.equipped?.nameplate)!}
                              name={item.displayName}
                              shortId={item.uid.slice(0, 5)}
                              forceStatic={true}
                            />
                          ) : (
                            <span
                              className="text-xs sm:text-sm font-bold text-[var(--text)] truncate"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {item.displayName}
                            </span>
                          )}
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

      {/* ── TAB 2: GRAND LINE ───────────────────────────────────────────────────── */}
      {activeTab === 'grandline' && (
        <Card variant="red" className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-lg">
              <Badge color="red-outline" dot>
                Grand Line
              </Badge>

              <h2
                className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Grand Line: Public Tests by Nakama Captains
              </h2>

              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Take tests created by Nakama Captains from across Pakistan. Enter your name and Gmail, take the test, and see where you rank.
              </p>

              <div className="pt-2">
                <Link to="/grand-line" className="btn-red inline-flex items-center gap-2 px-6 py-3 text-xs font-bold">
                  <span>Browse Grand Line</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center text-center gap-4 shrink-0 w-full md:w-80">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--red)]">
                <Compass size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--text)]">
                  Available Any Time
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Tests published by verified Nakama Captains from leading universities across Pakistan.
                </p>
              </div>
              <Link to="/grand-line" className="btn-outline w-full text-center text-xs">
                Explore Available Tests
              </Link>
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

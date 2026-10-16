import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { DottedRingProgress } from '@/components/ui/DottedRingProgress';
import { DotRowStreak } from '@/components/ui/DotRowStreak';
import {
  Users,
  Copy,
  Check,
  Flame,
  Trash2,
  RefreshCw,
  Plus,
  LogIn,
  AlertTriangle,
  Target,
} from 'lucide-react';

interface CrewMember {
  uid: string;
  displayName: string;
  email: string;
  joinedAt: string;
  activeToday?: boolean;
}

interface CrewDoc {
  id: string;
  name: string;
  code: string;
  leaderId: string;
  leaderName: string;
  goalQuestions: number;
  currentQuestions: number;
  members: CrewMember[];
  streak: number;
  weakChapters?: { chapter: string; errorCount: number }[];
  createdAt?: { seconds: number; nanoseconds?: number } | null;
}

function generateCrewCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function CrewDashboardPage() {
  const { user } = useAuth();

  const [crew, setCrew] = useState<CrewDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modal / Form state
  const [newCrewName, setNewCrewName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCrew = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setActionError(null);
    try {
      // 1. Check if user is leader or in members
      const q1 = query(collection(db, 'crews'), where('leaderId', '==', user.uid));
      const snap1 = await getDocs(q1);

      if (!snap1.empty) {
        const d = snap1.docs[0];
        setCrew({ id: d.id, ...d.data() } as CrewDoc);
        setLoading(false);
        return;
      }

      // Check all crews if user is in members array
      const allCrewsSnap = await getDocs(collection(db, 'crews'));
      const found = allCrewsSnap.docs.find((d) => {
        const data = d.data();
        const members: CrewMember[] = data.members || [];
        return members.some((m) => m.uid === user.uid);
      });

      if (found) {
        setCrew({ id: found.id, ...found.data() } as CrewDoc);
      } else {
        setCrew(null);
      }
    } catch (err: unknown) {
      console.warn('[CrewDashboardPage] Error loading crew:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCrew();
  }, [loadCrew]);

  const handleCreateCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCrewName.trim()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const code = generateCrewCode();
      const member: CrewMember = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Leader',
        email: user.email || '',
        joinedAt: new Date().toISOString(),
        activeToday: true,
      };

      const docRef = await addDoc(collection(db, 'crews'), {
        name: newCrewName.trim(),
        code,
        leaderId: user.uid,
        leaderName: member.displayName,
        goalQuestions: 300,
        currentQuestions: 20,
        members: [member],
        streak: 1,
        weakChapters: [
          { chapter: 'Calculus & Integration', errorCount: 14 },
          { chapter: 'Electromagnetism', errorCount: 9 },
        ],
        createdAt: serverTimestamp(),
      });

      // Update user profile role to crew
      await setDoc(
        doc(db, 'users', user.uid),
        {
          role: 'crew',
          isCrewMember: true,
          crewId: docRef.id,
          crewName: newCrewName.trim(),
        },
        { merge: true }
      );

      setNewCrewName('');
      await loadCrew();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create crew';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCodeInput.trim()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const cleanCode = joinCodeInput.trim().toUpperCase();
      const q = query(collection(db, 'crews'), where('code', '==', cleanCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        setActionError('Invalid invite code. Please check with your crew leader.');
        setActionLoading(false);
        return;
      }

      const crewDoc = snap.docs[0];
      const crewData = crewDoc.data();
      const existingMembers: CrewMember[] = crewData.members || [];

      if (existingMembers.some((m) => m.uid === user.uid)) {
        setJoinCodeInput('');
        await loadCrew();
        return;
      }

      const newMember: CrewMember = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Crew Member',
        email: user.email || '',
        joinedAt: new Date().toISOString(),
        activeToday: true,
      };

      await updateDoc(crewDoc.ref, {
        members: arrayUnion(newMember),
        currentQuestions: (crewData.currentQuestions || 0) + 15,
      });

      await setDoc(
        doc(db, 'users', user.uid),
        {
          role: 'crew',
          isCrewMember: true,
          crewId: crewDoc.id,
          crewName: crewData.name,
        },
        { merge: true }
      );

      setJoinCodeInput('');
      await loadCrew();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join crew';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberToRemove: CrewMember) => {
    if (!crew || !user || crew.leaderId !== user.uid) return;
    if (memberToRemove.uid === user.uid) return;

    if (!confirm(`Remove ${memberToRemove.displayName} from this crew?`)) return;

    try {
      const crewRef = doc(db, 'crews', crew.id);
      await updateDoc(crewRef, {
        members: arrayRemove(memberToRemove),
      });

      // Reset user's crew role
      await setDoc(
        doc(db, 'users', memberToRemove.uid),
        {
          role: 'student',
          isCrewMember: false,
          crewId: null,
          crewName: null,
        },
        { merge: true }
      );

      await loadCrew();
    } catch (err) {
      console.error('[CrewDashboardPage] Remove member error:', err);
    }
  };

  const handleResetInviteCode = async () => {
    if (!crew || !user || crew.leaderId !== user.uid) return;
    try {
      const newCode = generateCrewCode();
      await updateDoc(doc(db, 'crews', crew.id), {
        code: newCode,
      });
      setCrew((prev) => (prev ? { ...prev, code: newCode } : null));
    } catch (err) {
      console.error('[CrewDashboardPage] Reset code error:', err);
    }
  };

  const copyCode = () => {
    if (!crew?.code) return;
    navigator.clipboard.writeText(crew.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const isLeader = crew?.leaderId === user?.uid;

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: '2rem auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton height={40} width="40%" />
        <Skeleton height={180} />
        <Skeleton height={240} />
      </div>
    );
  }

  // If not currently in a crew, show Join or Create screen
  if (!crew) {
    return (
      <div style={{ maxWidth: 720, margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '1rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Boardly Study Crews
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Join a squad of 4–8 students preparing for the same entrance exam. Share daily goals, track team streaks, and drill weak chapters together.
          </p>
        </div>

        {actionError && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--r-input)', background: 'rgba(215, 25, 33, 0.1)', border: '1px solid #D71921', color: '#D71921', fontSize: 13 }}>
            {actionError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {/* Join Crew Card */}
          <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D71921' }}>
              <LogIn size={20} />
              <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                Join with Invite Code
              </h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Enter the 6-character code provided by your crew leader or classmate.
            </p>

            <form onSubmit={handleJoinCrew} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. NET26A"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 16,
                  fontFamily: 'monospace',
                  letterSpacing: '0.2em',
                  textAlign: 'center',
                }}
              />
              <Button variant="primary" size="md" type="submit" loading={actionLoading}>
                Join Squad
              </Button>
            </form>
          </GlassCard>

          {/* Create Crew Card */}
          <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <Plus size={20} className="text-[#D71921]" />
              <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                Start a New Crew
              </h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Create a custom squad for your college friends or study group. Set a shared weekly question target.
            </p>

            <form onSubmit={handleCreateCrew} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
              <input
                type="text"
                required
                placeholder="Crew Name (e.g. FAST Aces)"
                value={newCrewName}
                onChange={(e) => setNewCrewName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 14,
                }}
              />
              <Button variant="secondary" size="md" type="submit" loading={actionLoading}>
                Create Crew Squad
              </Button>
            </form>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Crew is loaded: full Crew Dashboard
  const members = crew.members || [];
  const currentQuestions = crew.currentQuestions || 0;
  const goalQuestions = crew.goalQuestions || 300;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '1rem' }}>
      {/* ── Crew Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Active Crew Squad
            </span>
            {isLeader && <Badge color="brand">LEADER</Badge>}
          </div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {crew.name}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Led by {crew.leaderName} · {members.length} members
          </p>
        </div>

        {/* Invite Code Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--r-input)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>CODE:</span>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#D71921', letterSpacing: '0.1em' }}>
              {crew.code}
            </span>
            <button onClick={copyCode} title="Copy code" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
              {copiedCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>

          {isLeader && (
            <button
              onClick={handleResetInviteCode}
              title="Reset code"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--r-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Key Widgets Row: Goal Progress Ring + Crew Streak ────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {/* Goal Progress Ring */}
        <GlassCard style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <DottedRingProgress
            value={currentQuestions}
            max={goalQuestions}
            size={130}
            strokeWidth={8}
            label={`${Math.round((currentQuestions / Math.max(1, goalQuestions)) * 100)}%`}
            sublabel="Target"
          />
          <div>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Weekly Squad Goal
            </span>
            <div style={{ marginTop: 6 }}>
              <span className="font-display tabular-nums" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
                {currentQuestions}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}> / {goalQuestions} MCQs</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
              Combined total solved by all squad members this week.
            </p>
          </div>
        </GlassCard>

        {/* Crew Streak Card */}
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Squad Consistency Streak
            </span>
            <Flame size={18} className="text-[#D71921]" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="font-display tabular-nums" style={{ fontSize: 36, fontWeight: 900, color: '#D71921' }}>
                {crew.streak || 1}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                Days Active
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <DotRowStreak days={7} activeDays={crew.streak || 1} todayActive={true} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Maintained when at least one crew member solves tests each calendar day.
          </p>
        </GlassCard>
      </div>

      {/* ── 2-Column: Member List & Daily Activity Dots + Crew Weak Chapters ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        {/* Members List with Daily Activity Dots */}
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} className="text-[#D71921]" />
              <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                Squad Members ({members.length})
              </h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Today's Activity</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map((m, _idx) => {
              const isMemLeader = m.uid === crew.leaderId;
              const isCurrentUser = Boolean(user && m.uid === user.uid);

              return (
                <div
                  key={m.uid}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--r-input)',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Activity Dot */}
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#D71921',
                        boxShadow: '0 0 6px rgba(215, 25, 33, 0.6)',
                      }}
                      title="Active today"
                    />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                          {m.displayName}
                        </span>
                        {isMemLeader && (
                          <span style={{ fontSize: 9, background: '#D71921', color: 'white', padding: '1px 5px', borderRadius: 999 }}>
                            LEADER
                          </span>
                        )}
                        {isCurrentUser && (
                          <span style={{ fontSize: 9, background: 'var(--border)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: 999 }}>
                            YOU
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{m.email}</span>
                    </div>
                  </div>

                  {isLeader && !isMemLeader && (
                    <button
                      onClick={() => handleRemoveMember(m)}
                      title="Remove member"
                      style={{
                        color: 'var(--danger)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 6,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Crew Weak Chapters */}
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} className="text-[#D71921]" />
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Squad Weak Topics
            </h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Topics where squad members made the highest number of errors this week.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(crew.weakChapters || []).map((ch, _idx) => (
              <div
                key={ch.chapter}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid #D71921',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {ch.chapter}
                  </h4>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {ch.errorCount} squad mistake flags
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => (window.location.href = '/dashboard/practice')}
                >
                  <Target size={12} /> Drill
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default CrewDashboardPage;

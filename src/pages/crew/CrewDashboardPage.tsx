import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyCrew } from '@/hooks/useStudyCrew';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { DottedRingProgress } from '@/components/ui/DottedRingProgress';
import { DotRowStreak } from '@/components/ui/DotRowStreak';
import { QrCodeSvg } from '@/components/crew/QrCodeSvg';
import {
  Copy,
  Check,
  Flame,
  Trash2,
  RefreshCw,
  Plus,
  LogIn,
  AlertTriangle,
  Target,
  Share2,
  Lock,
  Unlock,
  LogOut,
  Sparkles,
  Trophy,
  ArrowLeft,
} from 'lucide-react';

export function CrewDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    crew,
    loading,
    error: hookError,
    createCrew,
    joinCrewByCode,
    leaveCrew,
    transferLeadership,
    toggleLock,
    regenerateCode,
    kickMember,
  } = useStudyCrew();

  // Form / Action states
  const [newCrewName, setNewCrewName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string>('');
  const [leaderboardTab, setLeaderboardTab] = useState<'weekly' | 'alltime'>('weekly');

  const isLeader = Boolean(crew && user && crew.leaderId === user.uid);
  const joinUrl = crew ? `https://boardly.cfd/join/${crew.code}` : '';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewName.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await createCrew(newCrewName.trim());
      setNewCrewName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create crew';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await joinCrewByCode(joinCodeInput.trim());
      setJoinCodeInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join crew';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!crew?.code) return;
    navigator.clipboard.writeText(crew.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!crew) return;
    const msg = encodeURIComponent(
      `Join our Study Crew "${crew.name}" on Boardly!\nPrepare together for FAST, NUST & GIKI with shared Pro quota (up to 30 members):\n${joinUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this study crew?')) return;
    try {
      await leaveCrew();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to leave crew';
      alert(msg);
    }
  };

  const handleTransfer = async () => {
    if (!selectedNewLeader) return;
    try {
      await transferLeadership(selectedNewLeader);
      setTransferModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to transfer leadership';
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: '2rem auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton height={40} width="40%" />
        <Skeleton height={180} />
        <Skeleton height={240} />
      </div>
    );
  }

  // State A: Not in a crew
  if (!crew) {
    return (
      <div style={{ maxWidth: 760, margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '1rem' }}>
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white mb-2 transition-colors font-heading"
          >
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </Link>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Boardly Study Crews
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Join or start a squad of up to 30 students. Share daily goals, track collective streaks, drill common weak chapters, and share Pro access!
          </p>
        </div>

        {(actionError || hookError) && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--r-input)', background: 'rgba(215, 25, 33, 0.1)', border: '1px solid #D71921', color: '#D71921', fontSize: 13 }}>
            {actionError || hookError}
          </div>
        )}

        {/* Advantage Banner */}
        <div className="p-4 rounded-xl bg-red-500/10 border border-[#D71921]/30 flex items-start gap-3">
          <Sparkles size={20} className="text-[#D71921] shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--muted)] leading-relaxed">
            <span className="font-bold text-[var(--text)] block text-sm mb-0.5">Shared Pro Member Advantage</span>
            Study Crews support <strong className="text-[var(--text)]">up to 30 members</strong>. When any single squad member upgrades to Pro, unlimited practice MCQs and AI tokens instantly unlock for everyone in the crew!
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Join Crew Card */}
          <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D71921' }}>
              <LogIn size={20} />
              <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                Join with Invite Code
              </h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Enter the 6-character code provided by your crew leader or classmate (or open an invite link).
            </p>

            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
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
                Create New Crew
              </h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Start your own study crew for up to 30 classmates and become the squad leader.
            </p>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
              <input
                type="text"
                required
                placeholder="Crew Name (e.g. FAST Aces 2026)"
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

  // State B: User has an active crew
  const members = crew.members || [];
  const memberCount = members.length;
  const currentQuestions = crew.currentQuestions || 0;
  const goalQuestions = crew.goalQuestions || 500;

  // Member Leaderboard calculation
  const sortedMembers = [...members].sort((a, b) => {
    if (leaderboardTab === 'weekly') {
      return (b.questionsSolved || 0) - (a.questionsSolved || 0);
    }
    return (b.streak || 0) - (a.streak || 0);
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '1rem' }}>
      {/* ── Return Link ── */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white mb-2 transition-colors font-heading"
        >
          <ArrowLeft size={14} />
          <span>Return to Dashboard</span>
        </Link>
      </div>

      {/* ── Crew Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Study Crew
            </span>
            {isLeader && <Badge color="brand">LEADER</Badge>}
            {crew.hasProMember && (
              <span className="text-[10px] font-heading px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                PRO ACTIVE
              </span>
            )}
            {crew.isLocked && (
              <span className="text-[10px] font-heading px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                <Lock size={10} /> LOCKED
              </span>
            )}
          </div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {crew.name}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Led by {crew.leaderName} · <strong className="text-[var(--text)]">{memberCount} / 30 members</strong>
          </p>
        </div>

        {/* Action buttons (Share, Code, Lock, Leave) */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {/* Share Modal Trigger */}
          <Button variant="primary" size="sm" onClick={() => setShareModalOpen(true)}>
            <Share2 size={14} /> Share Squad
          </Button>

          {/* Quick Copy Code Pill */}
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--r-input)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>CODE:</span>
            <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: '#D71921', letterSpacing: '0.1em' }}>
              {crew.code}
            </span>
            <button onClick={handleCopyCode} title="Copy code" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
              {copiedCode ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
          </div>

          {/* Leader Controls: Lock/Unlock & Regenerate */}
          {isLeader && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLock}
                title={crew.isLocked ? 'Unlock invites' : 'Lock invites'}
              >
                {crew.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{crew.isLocked ? 'Unlock' : 'Lock'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateCode}
                title="Regenerate invite code"
              >
                <RefreshCw size={14} />
              </Button>
            </>
          )}

          {/* Leave Crew Button */}
          <Button variant="ghost" size="sm" onClick={handleLeave} style={{ color: 'var(--text-faint)' }}>
            <LogOut size={14} /> Leave
          </Button>
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
              Combined total solved by all up to 30 members this week.
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
            Maintained whenever at least one crew member solves tests each calendar day.
          </p>
        </GlassCard>
      </div>

      {/* ── 2-Column: Crew Member Leaderboard + Squad Weak Topics ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        {/* Crew Leaderboard */}
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} className="text-[#D71921]" />
              <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                Squad Leaderboard ({memberCount}/30)
              </h3>
            </div>

            {/* Toggle Weekly vs All-Time */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs">
              <button
                type="button"
                onClick={() => setLeaderboardTab('weekly')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  leaderboardTab === 'weekly'
                    ? 'bg-[var(--card)] text-[var(--text)] font-semibold shadow-sm'
                    : 'text-[var(--muted)] hover:text-white'
                }`}
              >
                Weekly MCQs
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardTab('alltime')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  leaderboardTab === 'alltime'
                    ? 'bg-[var(--card)] text-[var(--text)] font-semibold shadow-sm'
                    : 'text-[var(--muted)] hover:text-white'
                }`}
              >
                Streaks
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedMembers.map((m, idx) => {
              const isMemLeader = m.uid === crew.leaderId;
              const isCurrentUser = Boolean(user && m.uid === user.uid);
              const rank = idx + 1;

              return (
                <div
                  key={m.uid}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--r-input)',
                    background: isCurrentUser ? 'rgba(215, 25, 33, 0.08)' : 'var(--surface-hover)',
                    border: isCurrentUser ? '1px solid #D71921' : '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Rank Badge */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : rank === 3 ? '#d97706' : 'var(--surface)',
                        color: rank <= 3 ? '#000000' : 'var(--text-muted)',
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {rank}
                    </div>

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
                        {m.isPro && (
                          <span style={{ fontSize: 9, background: '#059669', color: 'white', padding: '1px 5px', borderRadius: 999 }}>
                            PRO
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className="font-display tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {leaderboardTab === 'weekly' ? `${m.questionsSolved || 0} MCQs` : `${m.streak || 1} Days`}
                      </span>
                    </div>

                    {isLeader && !isMemLeader && (
                      <button
                        onClick={() => kickMember(m.uid)}
                        title="Remove member"
                        style={{
                          color: 'var(--danger)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isLeader && members.length > 1 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => setTransferModalOpen(true)}>
                Transfer Leadership
              </Button>
            </div>
          )}
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
            High-error chapters aggregated across all active squad members this week.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(crew.weakChapters || []).map((ch) => (
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
                  onClick={() => navigate('/dashboard/practice')}
                >
                  <Target size={12} /> Drill
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── Modal: Share Squad (QR + Link + WhatsApp) ──────────────── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4">
            <div className="text-center">
              <h3 className="text-lg font-bold font-display text-[var(--text)]">Invite to {crew.name}</h3>
              <p className="text-xs text-[var(--muted)] mt-1">
                Share this QR code or link with classmates (up to 30 members)
              </p>
            </div>

            <div className="flex items-center justify-center p-2 rounded-xl bg-white/5 border border-[var(--border)]">
              <QrCodeSvg value={joinUrl} size={150} />
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-center">
              <span className="text-[10px] font-mono text-[var(--text-faint)] block mb-0.5">INVITE CODE</span>
              <span className="font-mono text-lg font-bold text-[#D71921] tracking-widest">{crew.code}</span>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="secondary" size="md" fullWidth onClick={handleCopyLink}>
                {copiedCode ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Link Copied!' : 'Copy Direct Link'}</span>
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={handleWhatsAppShare}>
                <Share2 size={14} />
                <span>Share via WhatsApp</span>
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setShareModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ── Modal: Transfer Leadership ─────────────────────────────── */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold font-display text-[var(--text)]">Transfer Leadership</h3>
              <p className="text-xs text-[var(--muted)] mt-1">
                Select a member to become the new crew squad leader.
              </p>
            </div>

            <select
              value={selectedNewLeader}
              onChange={(e) => setSelectedNewLeader(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)]"
            >
              <option value="">Select a squad member...</option>
              {members
                .filter((m) => m.uid !== user?.uid)
                .map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.displayName} ({m.email})
                  </option>
                ))}
            </select>

            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth disabled={!selectedNewLeader} onClick={handleTransfer}>
                Confirm Transfer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrewDashboardPage;

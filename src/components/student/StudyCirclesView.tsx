import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Share2,
  Copy,
  Check,
  Target,
  ArrowRight,
  Flame,
  Clock,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError } from '../../lib/firebase';
import {
  collection,
  query,
  limit,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Modal } from '../ui/Modal';

interface CircleSession {
  id: string;
  name: string;
  description: string;
  creatorEmail: string;
  creatorName: string;
  track: string;
  memberCount: number;
  maxMembers: number;
  weeklyGoal: string;
  status: string;
  inviteCode?: string;
  members?: string[];
  createdAt: string;
}

export const StudyCirclesView: React.FC = () => {
  const { user, profile } = useAuth();

  const [circles, setCircles] = useState<CircleSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; path?: string } | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newCircleName, setNewCircleName] = useState<string>('');
  const [newCircleTrack, setNewCircleTrack] = useState<string>('NUST NET Engineering');
  const [newCircleGoal, setNewCircleGoal] = useState<string>('150 MCQs / week');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Join Modal
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [joinCode, setJoinCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    setIsLoading(true);
    setErrorInfo(null);
    const path = 'sessions';

    try {
      const q = query(collection(db, 'sessions'), limit(25));
      const snap = await getDocs(q);
      const list: CircleSession[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setCircles(list);
    } catch (err: any) {
      logFirestoreError(path, err, 'fetch_study_circles');
      setErrorInfo({
        message: err?.message || 'Unable to fetch peer study circles from Firestore.',
        path,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !newCircleName.trim() || isCreating) return;

    setIsCreating(true);
    const circleId = `circle_${Date.now()}`;
    const code = `${newCircleName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const newDocData: CircleSession = {
        id: circleId,
        name: newCircleName.trim(),
        description: `Study group formed by ${profile?.name || user.email} targeting ${newCircleTrack}.`,
        creatorEmail: user.email?.toLowerCase().trim() || '',
        creatorName: profile?.name || 'Student',
        track: newCircleTrack,
        memberCount: 1,
        maxMembers: 12,
        weeklyGoal: newCircleGoal,
        status: 'active',
        inviteCode: code,
        members: [user.uid],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'sessions', circleId), newDocData);
      setCircles((prev) => [newDocData, ...prev]);
      setShowCreateModal(false);
      setNewCircleName('');
    } catch (err: any) {
      logFirestoreError(`sessions/${circleId}`, err, 'create_study_circle');
      alert(`Could not create circle: ${err?.message || 'Try again'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !joinCode.trim() || isJoining) return;

    setIsJoining(true);
    const cleanCode = joinCode.trim().toUpperCase();

    try {
      const targetCircle = circles.find((c) => c.inviteCode === cleanCode || c.id === cleanCode);
      if (!targetCircle) {
        alert('Invalid invite code. Please verify with your circle admin.');
        setIsJoining(false);
        return;
      }

      await updateDoc(doc(db, 'sessions', targetCircle.id), {
        members: arrayUnion(user.uid),
        memberCount: (targetCircle.memberCount || 1) + 1,
      });

      setShowJoinModal(false);
      setJoinCode('');
      fetchCircles();
    } catch (err: any) {
      logFirestoreError('sessions', err, 'join_study_circle');
      alert(`Could not join circle: ${err?.message || 'Try again'}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display flex items-center gap-2">
            <span>Collaborative Study Circles</span>
            <Users className="w-6 h-6 text-[var(--brand-2)]" />
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Form small private squads, compare weekly questions solved, and hold each other accountable for test day.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowJoinModal(true)}
          >
            Join with Code
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Squad
          </Button>
        </div>
      </div>

      {errorInfo && (
        <ErrorState
          title="Could not load study circles"
          error={errorInfo.message}
          path={errorInfo.path}
          onRetry={fetchCircles}
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={180} className="rounded-3xl" />
          ))}
        </div>
      )}

      {!isLoading && circles.length === 0 && !errorInfo && (
        <EmptyState
          title="No study circles created yet"
          description="Create your first study circle and invite friends to track entrance prep together."
          action={{
            label: 'Create Study Circle',
            onClick: () => setShowCreateModal(true),
          }}
        />
      )}

      {/* Circles Grid */}
      {!isLoading && circles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {circles.map((circle) => {
            const isMember = Boolean(user?.uid && circle.members?.includes(user.uid));
            const inviteCode = circle.inviteCode || circle.id.slice(0, 8);

            return (
              <Card
                key={circle.id}
                variant="glass"
                className="p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={isMember ? 'student' : 'default'} size="sm">
                      {isMember ? 'Joined Member' : 'Open Squad'}
                    </Badge>
                    <span className="text-xs font-mono text-[var(--text-faint)]">
                      {circle.memberCount || 1} / {circle.maxMembers || 12} Members
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {circle.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">
                      {circle.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/6 text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--text-faint)]">Target Track</span>
                      <span className="font-bold text-white">{circle.track}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--text-faint)]">Weekly Goal</span>
                      <span className="font-bold text-[#34D399]">{circle.weeklyGoal}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/8 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[var(--brand-2)] bg-white/5 px-2 py-0.5 rounded border border-white/8">
                      {inviteCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(circle.id, inviteCode)}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                      title="Copy squad invite code"
                    >
                      {copiedCodeId === circle.id ? (
                        <Check className="w-3 h-3 text-[#34D399]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {!isMember ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setJoinCode(inviteCode);
                        setShowJoinModal(true);
                      }}
                      className="text-xs"
                    >
                      Join Squad
                    </Button>
                  ) : (
                    <span className="text-xs text-[#34D399] font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-[#34D399]" />
                      Active
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Circle Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Study Circle"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCircle} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Squad Name</label>
            <input
              type="text"
              required
              placeholder="e.g. FAST CS 2026 Achievers"
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Target Track</label>
            <select
              value={newCircleTrack}
              onChange={(e) => setNewCircleTrack(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              <option value="FAST-NU CS & Engineering" className="bg-[#0E1626]">FAST-NU CS & Engineering</option>
              <option value="NUST NET Engineering" className="bg-[#0E1626]">NUST NET Engineering</option>
              <option value="GIKI Entrance Test" className="bg-[#0E1626]">GIKI Entrance Test</option>
              <option value="PMDC MDCAT Medical" className="bg-[#0E1626]">PMDC MDCAT Medical</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Weekly Goal</label>
            <input
              type="text"
              value={newCircleGoal}
              onChange={(e) => setNewCircleGoal(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-white/8">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isCreating}>
              Create Squad
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Circle Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Study Circle"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleJoinCircle} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Invite Code</label>
            <input
              type="text"
              required
              placeholder="e.g. FAS-842"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-white/8">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isJoining}>
              Join Circle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

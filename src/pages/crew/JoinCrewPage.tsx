import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyCrew, type CrewDoc } from '@/hooks/useStudyCrew';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { QrCodeSvg } from '@/components/crew/QrCodeSvg';
import { Users, Check, Copy, Share2, Sparkles, AlertCircle, ArrowLeft, LogIn } from 'lucide-react';

export function JoinCrewPage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinCrewByCode } = useStudyCrew();

  const [crewPreview, setCrewPreview] = useState<CrewDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const cleanCode = (code || '').trim().toUpperCase();
  const joinUrl = `https://boardly.cfd/join/${cleanCode}`;

  // If signed out, remember join code in sessionStorage so user joins right after login
  useEffect(() => {
    if (cleanCode) {
      sessionStorage.setItem('pending_join_crew_code', cleanCode);
    }
  }, [cleanCode]);

  useEffect(() => {
    if (!cleanCode) {
      setError('No crew invite code specified.');
      setLoading(false);
      return;
    }

    async function fetchCrewInfo() {
      try {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'crews'), where('code', '==', cleanCode));
        const snap = await getDocs(q);

        if (snap.empty) {
          setError(`No study crew found with code "${cleanCode}".`);
          setCrewPreview(null);
        } else {
          const docSnap = snap.docs[0];
          setCrewPreview({ id: docSnap.id, ...docSnap.data() } as CrewDoc);
        }
      } catch (err: unknown) {
        console.warn('[JoinCrewPage] Fetch error:', err);
        setError('Failed to load crew information. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchCrewInfo();
  }, [cleanCode]);

  const handleJoin = async () => {
    if (!user) {
      navigate(`/login?redirect=/join/${cleanCode}`);
      return;
    }

    setJoining(true);
    setError(null);
    try {
      await joinCrewByCode(cleanCode);
      sessionStorage.removeItem('pending_join_crew_code');
      navigate('/crew');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join crew';
      setError(msg);
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Join our Study Crew "${crewPreview?.name || 'Boardly Crew'}" on Boardly!\nPrep together for FAST, NUST & GIKI entry tests with unlimited shared practice:\n${joinUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const memberCount = crewPreview?.members?.length || 0;
  const isFull = memberCount >= 30;
  const isLocked = crewPreview?.isLocked === true;
  const isAlreadyMember = user && crewPreview?.members?.some((m) => m.uid === user.uid);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white mb-4 transition-colors font-heading"
        >
          <ArrowLeft size={14} />
          <span>Return to Dashboard</span>
        </Link>

        {loading ? (
          <Skeleton height={340} />
        ) : error && !crewPreview ? (
          <GlassCard style={{ padding: '28px', textAlign: 'center' }}>
            <AlertCircle size={36} className="text-[#D71921] mx-auto mb-3" />
            <h2 className="text-xl font-bold font-display text-[var(--text)] mb-2">Invalid Invite Link</h2>
            <p className="text-sm text-[var(--muted)] mb-6">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="secondary" onClick={() => navigate('/crew')}>
                Open Crew Hub
              </Button>
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </GlassCard>
        ) : crewPreview ? (
          <GlassCard style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div className="text-center">
              <span className="badge-pill mb-2">Study Crew Invite</span>
              <h1 className="text-2xl font-display font-extrabold text-[var(--text)] tracking-tight">
                {crewPreview.name}
              </h1>
              <p className="text-xs text-[var(--muted)] mt-1">
                Led by <span className="text-[var(--text)] font-semibold">{crewPreview.leaderName}</span>
              </p>
            </div>

            {/* Crew Stats Pill */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-faint)] block">Squad Members</span>
                <span className="text-base font-bold font-display text-[var(--text)]">
                  {memberCount} / 30
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-faint)] block">Squad Goal</span>
                <span className="text-base font-bold font-display text-[#D71921]">
                  {crewPreview.goalQuestions} MCQs
                </span>
              </div>
            </div>

            {/* Pro Sharing Advantage */}
            <div className="p-3 rounded-xl bg-red-500/10 border border-[#D71921]/30 flex items-start gap-3">
              <Sparkles size={18} className="text-[#D71921] shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--muted)]">
                <p className="font-semibold text-[var(--text)] mb-0.5">Shared Pro Advantage</p>
                When any member of this crew upgrades to Pro, all up to 30 crew members unlock unlimited MCQs automatically!
              </div>
            </div>

            {/* Error banner if join failed */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Join or Sign-in button */}
            {isAlreadyMember ? (
              <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/crew')}>
                You are in this Crew — Open Crew Hub
              </Button>
            ) : isLocked ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center">
                This crew has locked new invites.
              </div>
            ) : isFull ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center">
                This crew is full (30 / 30 members).
              </div>
            ) : user ? (
              <Button variant="primary" size="lg" fullWidth loading={joining} onClick={handleJoin}>
                <Users size={16} /> Join {crewPreview.name}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate(`/login?redirect=/join/${cleanCode}`)}
              >
                <LogIn size={16} /> Sign in to Join Crew
              </Button>
            )}

            {/* QR Code & Share Options */}
            <div className="border-t border-[var(--border)] pt-4 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center p-2 rounded-xl bg-white/5 border border-[var(--border)]">
                <QrCodeSvg value={joinUrl} size={130} />
              </div>
              <p className="text-[11px] text-[var(--text-faint)] text-center">
                Scan or share this code with up to 30 classmates
              </p>

              <div className="flex items-center gap-2 w-full">
                <Button variant="secondary" size="sm" fullWidth onClick={handleCopyLink}>
                  {copiedLink ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </Button>
                <Button variant="outline" size="sm" fullWidth onClick={handleWhatsAppShare}>
                  <Share2 size={14} className="text-green-500" />
                  <span>WhatsApp</span>
                </Button>
              </div>
            </div>
          </GlassCard>
        ) : null}
      </div>
    </div>
  );
}

export default JoinCrewPage;

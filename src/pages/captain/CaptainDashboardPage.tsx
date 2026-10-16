import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { collection, query, where, getDocs, orderBy, limit, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Compass,
  Trophy,
  Copy,
  Check,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReferredStudent {
  id: string;
  referredEmail: string;
  referredUserName?: string;
  hasTakenFirstTest?: boolean;
  isPro?: boolean;
  signedUpAt?: { seconds: number; nanoseconds?: number } | null;
}

interface CaptainRankItem {
  id: string;
  name: string;
  university: string;
  referralCount: number;
  points: number;
  tier: string;
}

export function CaptainDashboardPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.uid ?? null);

  const [referredStudents, setReferredStudents] = useState<ReferredStudent[]>([]);
  const [crewsLedCount, setCrewsLedCount] = useState(0);
  const [captainRankings, setCaptainRankings] = useState<CaptainRankItem[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  // Captain code derived from user
  const captainCode =
    profile?.crewReferralCode ||
    `CAP-${(profile?.targetUniversity || 'CAMPUS').slice(0, 4).toUpperCase()}-${user?.uid.slice(0, 4).toUpperCase()}`;

  const referralLink = `${window.location.origin}/signup?ref=${captainCode}`;

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    async function loadCaptainStats() {
      try {
        // 1. Fetch referred students matching this captain's code or uid
        const refQ = query(
          collection(db, 'referrals'),
          where('referrerCode', '==', captainCode)
        );
        const refSnap = await getDocs(refQ);
        let refs: ReferredStudent[] = refSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as ReferredStudent));

        // If empty by code, fallback query by referrerUid
        if (refs.length === 0) {
          const refQ2 = query(
            collection(db, 'referrals'),
            where('referrerUid', '==', user!.uid)
          );
          const refSnap2 = await getDocs(refQ2);
          refs = refSnap2.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          } as ReferredStudent));
        }

        setReferredStudents(refs);

        // 2. Fetch crews led by this captain
        const crewQ = query(collection(db, 'crews'), where('leaderId', '==', user!.uid));
        const crewSnap = await getDocs(crewQ);
        setCrewsLedCount(crewSnap.size);

        // 3. Fetch captain rankings from real Firestore 'captains' collection
        const capQ = query(collection(db, 'captains'), orderBy('referralCount', 'desc'), limit(10));
        const capSnap = await getDocs(capQ).catch(() => ({ docs: [] as QueryDocumentSnapshot<DocumentData>[] }));
        if (capSnap.docs.length > 0) {
          setCaptainRankings(capSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CaptainRankItem)));
        } else {
          // Fallback if captains collection hasn't been populated yet
          setCaptainRankings([
            { id: user!.uid, name: profile?.displayName || 'You', university: profile?.targetUniversity || 'Campus', referralCount: refs.length, points: refs.length * 50, tier: 'Bronze' },
          ]);
        }
      } catch (err) {
        console.warn('[CaptainDashboard] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCaptainStats();
  }, [user, captainCode, profile]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(captainCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (profileLoading || loading) {
    return (
      <div style={{ maxWidth: 960, margin: '2rem auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton height={200} />
        <Skeleton height={140} />
        <Skeleton height={280} />
      </div>
    );
  }

  const isCaptain = profile?.role === 'captain' || profile?.role === 'admin';

  // If not yet a captain, offer application
  if (!isCaptain) {
    return (
      <div style={{ maxWidth: 840, margin: '2rem auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <GlassCard
          style={{
            borderRadius: 'var(--r-hero)',
            padding: '3rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(215, 25, 33, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D71921',
            }}
          >
            <Compass size={36} />
          </div>

          <div>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
              Become a Boardly Campus Captain
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520, margin: '8px auto 0', lineHeight: 1.6 }}>
              Lead entrance test prep at your university campus or college. Get your own official ambassador referral code, earn monthly stipends, and mentor future engineers and doctors.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/captain/apply">
              <Button variant="primary" size="lg">
                Apply for Campus Captaincy <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Calculate stats
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

  const totalJoined = referredStudents.length;

  const joinedThisWeek = referredStudents.filter((s) => {
    const sec = s.signedUpAt?.seconds;
    const t = sec ? sec * 1000 : now;
    return now - t <= ONE_WEEK_MS;
  }).length;

  const joinedThisMonth = referredStudents.filter((s) => {
    const sec = s.signedUpAt?.seconds;
    const t = sec ? sec * 1000 : now;
    return now - t <= ONE_MONTH_MS;
  }).length;

  const proConversions = referredStudents.filter((s) => s.isPro).length;

  // Reward tier
  let tier = 'Bronze';
  if (totalJoined >= 50) tier = 'Platinum';
  else if (totalJoined >= 25) tier = 'Gold';
  else if (totalJoined >= 10) tier = 'Silver';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '1rem' }}>
      {/* ── Captain Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Campus Ambassador Portal
            </span>
            <Badge color="brand">{tier} TIER</Badge>
          </div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Captain Command Center
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Representing {profile?.targetUniversity || 'Campus'} · Ambassador Code {captainCode}
          </p>
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={handleCopyCode}>
            {copiedCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} {captainCode}
          </Button>
          <Button variant="primary" size="sm" onClick={handleCopyLink}>
            {copiedLink ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />} Copy Invite Link
          </Button>
        </div>
      </div>

      {/* ── Key Metrics 4-Card Grid ─────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-faint)' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Week</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ marginTop: 8 }}>
            <span className="font-display tabular-nums" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
              +{joinedThisWeek}
            </span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Students joined</p>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-faint)' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month</span>
            <Users size={16} />
          </div>
          <div style={{ marginTop: 8 }}>
            <span className="font-display tabular-nums" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
              {joinedThisMonth}
            </span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monthly recruits</p>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-faint)' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Recruits</span>
            <Award size={16} className="text-[#D71921]" />
          </div>
          <div style={{ marginTop: 8 }}>
            <span className="font-display tabular-nums" style={{ fontSize: 28, fontWeight: 800, color: '#D71921' }}>
              {totalJoined}
            </span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>All-time network</p>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-faint)' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Crews Led / Pro</span>
            <Sparkles size={16} />
          </div>
          <div style={{ marginTop: 8 }}>
            <span className="font-display tabular-nums" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
              {crewsLedCount} <span style={{ fontSize: 16, color: 'var(--text-faint)' }}>/ {proConversions} Pro</span>
            </span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active study squads</p>
          </div>
        </GlassCard>
      </div>

      {/* ── 2-Column: Referred Students Directory & Captain Leaderboard ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        {/* Referred Students List */}
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} className="text-[#D71921]" />
              <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                Referred Students Directory
              </h3>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{referredStudents.length} total</span>
          </div>

          {referredStudents.length === 0 ? (
            <EmptyState
              icon={<Users size={36} className="text-[#D71921]" />}
              title="No students joined yet"
              description="Share your referral code in WhatsApp class groups to track student signups."
              actionLabel="Copy Invite Link"
              onAction={handleCopyLink}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {referredStudents.map((st) => (
                <div
                  key={st.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--r-input)',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {st.referredUserName || st.referredEmail?.split('@')[0] || 'Student'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                      {st.referredEmail}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {st.hasTakenFirstTest ? (
                      <span style={{ fontSize: 10, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CheckCircle size={12} /> Test Taken
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>Signed Up</span>
                    )}
                    {st.isPro && <Badge color="brand">PRO</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Captain Leaderboard & Rewards Status */}
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={18} className="text-[#D71921]" />
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              National Captain Leaderboard
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {captainRankings.map((c, idx) => (
              <div
                key={c.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="font-display" style={{ fontSize: 14, fontWeight: 800, color: idx === 0 ? '#FBBF24' : 'var(--text-muted)' }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{c.university}</p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="font-display tabular-nums" style={{ fontSize: 14, fontWeight: 800, color: '#D71921' }}>
                    {c.referralCount} recruits
                  </span>
                  <p style={{ fontSize: 10, color: 'var(--text-faint)' }}>{c.points} pts</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reward Status Milestone */}
          <div
            style={{
              marginTop: 'auto',
              padding: '14px',
              borderRadius: 'var(--r-input)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Next Milestone: Gold Tier (25 Recruits)</span>
              <span className="font-mono text-[#D71921]">{totalJoined} / 25</span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (totalJoined / 25) * 100)}%`,
                  height: '100%',
                  background: '#D71921',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default CaptainDashboardPage;

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Users,
  Award,
  Copy,
  Check,
  Share2,
  Gift,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReferralRecord {
  id: string;
  referredUserName?: string;
  referredUserEmail?: string;
  status: string;
  hasTakenFirstTest?: boolean;
  createdAt?: { seconds: number };
}

interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category?: string;
  stockRemaining?: number;
}

export function CrewDashboardPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.uid ?? null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  // Ambassador Details
  const referralCode = profile?.crewReferralCode || user?.uid?.substring(0, 8).toUpperCase() || 'CREW2026';
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
  const isCrew = Boolean(profile?.isCrewMember || profile?.crewStatus === 'active');

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);

    async function loadCrewData() {
      try {
        // 1. Fetch Referrals attributed to this user
        const refQ = query(
          collection(db, 'referrals'),
          where('ambassadorUid', '==', user!.uid)
        );
        const refSnap = await getDocs(refQ);
        const refs: ReferralRecord[] = refSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ReferralRecord[];
        setReferrals(refs);

        // 2. Fetch Rewards catalog
        const rewSnap = await getDocs(collection(db, 'rewards'));
        if (!rewSnap.empty) {
          setRewards(rewSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RewardItem)));
        } else {
          // Default rewards catalog if database is not yet seeded
          setRewards([
            {
              id: 'rwd-pro-3mo',
              title: 'Boardly Pro 3-Month Voucher',
              description: 'Gift full unthrottled access, past papers & AI tutor to a classmate.',
              pointsCost: 500,
              stockRemaining: 50,
            },
            {
              id: 'rwd-swag-kit',
              title: 'Official Boardly Study Merch',
              description: 'Boardly metallic notebook, sticker pack, and university formula sheet.',
              pointsCost: 1200,
              stockRemaining: 25,
            },
            {
              id: 'rwd-internship-recommendation',
              title: 'Campus Leadership Recommendation Letter',
              description: 'Official verified internship credential signed by SHS Virtual Academy.',
              pointsCost: 2000,
              stockRemaining: 999,
            },
          ]);
        }

        setLoadingData(false);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        console.warn('[CrewDashboard] Load warning:', err);
        setError({
          code: e.code,
          message: e.message ?? 'Failed to load ambassador records',
        });
        setLoadingData(false);
      }
    }

    loadCrewData();
  }, [user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const promoMessage = `Assalam-o-Alaikum! 🚀 If you are preparing for FAST-NUCES, NUST NET, GIKI, or MDCAT entrance tests, practice on Boardly with 17,000+ real MCQs and server-synced timers.\n\nSign up using my link for free diagnostic practice:\n${referralLink}`;

  const handleCopyPromo = () => {
    navigator.clipboard.writeText(promoMessage);
    setCopiedPromo(true);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  const handleRedeemReward = async (r: RewardItem) => {
    if (!user || redeemingId) return;
    setRedeemingId(r.id);
    setRedeemSuccess(null);
    try {
      await addDoc(collection(db, 'rewardRedemptions'), {
        userId: user.uid,
        student_id: user.uid,
        student_email: user.email,
        student_name: user.displayName ?? 'Student Ambassador',
        rewardId: r.id,
        rewardTitle: r.title,
        pointsCost: r.pointsCost,
        status: 'pending',
        redeemed_at: serverTimestamp(),
      });
      setRedeemSuccess(`Redemption requested for "${r.title}". Our team will verify and dispatch your perk!`);
    } catch (e: unknown) {
      const err = e as { message?: string };
      alert(`Redemption failed: ${err.message ?? 'Error contacting server'}`);
    } finally {
      setRedeemingId(null);
    }
  };

  // Mask Name for Privacy (DATA_AUDIT standard: "First L.")
  const maskName = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
      return `${parts[0]}`;
    }
    if (email) return `${email.substring(0, 3)}***@${email.split('@')[1]}`;
    return 'Student User';
  };

  if (profileLoading || loadingData) {
    return (
      <div style={{ maxWidth: 960, margin: '2rem auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton height={200} />
        <Skeleton height={140} />
        <Skeleton height={280} />
      </div>
    );
  }

  if (error && referrals.length === 0) {
    return (
      <div style={{ maxWidth: 840, margin: '2rem auto', padding: '1rem' }}>
        <ErrorState
          title="Could not load ambassador data"
          error={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // If user is not yet an approved crew member, display invitation & application CTA
  if (!isCrew) {
    return (
      <div style={{ maxWidth: 840, margin: '2rem auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          className="glass glass-animated-border"
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
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--crew-from), var(--crew-to))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 0 24px rgba(124, 92, 255, 0.5)',
            }}
          >
            <Sparkles size={28} />
          </div>

          <div>
            <h1 className="font-display" style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, color: 'var(--text)' }}>
              Join the <span className="text-gradient-violet">Boardly Crew</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 540, marginTop: 8, lineHeight: 1.6 }}>
              Become a verified Student Ambassador for your college or academy. Help your peers ace their university entrance tests and unlock Pro access, paid internship eligibility, and verified leadership credentials.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              width: '100%',
              maxWidth: 680,
              textAlign: 'left',
              marginTop: 12,
            }}
          >
            <div className="glass" style={{ padding: '16px', borderRadius: 'var(--r-input)' }}>
              <Award size={20} style={{ color: 'var(--violet)', marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Free Pro Access</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                Active crew members get complimentary Boardly Pro with full question vaults.
              </p>
            </div>

            <div className="glass" style={{ padding: '16px', borderRadius: 'var(--r-input)' }}>
              <ShieldCheck size={20} style={{ color: 'var(--success)', marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Verified Certificate</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                Campus leadership credential signed by SHS Virtual Academy for your CV.
              </p>
            </div>

            <div className="glass" style={{ padding: '16px', borderRadius: 'var(--r-input)' }}>
              <Gift size={20} style={{ color: 'var(--warning)', marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Milestone Rewards</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                Earn points on every activated student to redeem vouchers and tech perks.
              </p>
            </div>
          </div>

          <Link to="/crew/apply" style={{ marginTop: 12 }}>
            <Button variant="primary" size="lg" style={{ gap: 8, background: 'linear-gradient(135deg, var(--crew-from), var(--crew-to))' }}>
              <span>Apply for Boardly Crew</span>
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Approved Crew Ambassador View
  const totalReferrals = referrals.length;
  const activatedCount = referrals.filter((r) => r.hasTakenFirstTest || r.status === 'activated').length;
  const points = activatedCount * 50 + (totalReferrals - activatedCount) * 10;

  let tier = 'Bronze';
  if (activatedCount >= 50) tier = 'Platinum';
  else if (activatedCount >= 20) tier = 'Gold';
  else if (activatedCount >= 8) tier = 'Silver';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.25rem 5rem', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Ambassador Bar */}
      <div
        className="glass"
        style={{
          borderRadius: 'var(--r-hero)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.08), rgba(232, 121, 249, 0.04))',
          border: '1px solid rgba(124, 92, 255, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--violet)' }}>
                Boardly Crew Ambassador
              </span>
              <Badge color="violet">{tier} Tier</Badge>
            </div>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              Your Ambassador Cockpit
            </h1>
          </div>

          <Link to="/crew/apply">
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Crew Member #{referralCode}</span>
          </Link>
        </div>

        {/* 1-Click Referral Link Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 18px',
            borderRadius: 'var(--r-input)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ overflow: 'hidden', minWidth: 200, flex: 1 }}>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 2 }}>Personal Referral Link</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {referralLink}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={handleCopyLink} style={{ gap: 6 }}>
              {copiedLink ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </Button>

            <Button variant="primary" size="sm" onClick={handleCopyPromo} style={{ gap: 6, background: 'linear-gradient(135deg, var(--crew-from), var(--crew-to))' }}>
              {copiedPromo ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copiedPromo ? 'Promo Copied!' : 'Share WhatsApp'}</span>
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          <div className="glass" style={{ padding: '14px', borderRadius: 'var(--r-input)', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--violet)' }}>{totalReferrals}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Total Joined</p>
          </div>

          <div className="glass" style={{ padding: '14px', borderRadius: 'var(--r-input)', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{activatedCount}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Activated (1st Test)</p>
          </div>

          <div className="glass" style={{ padding: '14px', borderRadius: 'var(--r-input)', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>{points}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Reward Points</p>
          </div>

          <div className="glass" style={{ padding: '14px', borderRadius: 'var(--r-input)', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#E879F9' }}>{tier}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Current Tier</p>
          </div>
        </div>
      </div>

      {redeemSuccess && (
        <div style={{ padding: '12px 18px', borderRadius: 'var(--r-input)', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
          {redeemSuccess}
        </div>
      )}

      {/* Rewards Catalog */}
      <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            Ambassador Rewards Catalog
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Redeem points earned from activated student referrals
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {rewards.map((r) => {
            const canAfford = points >= r.pointsCost;

            return (
              <div
                key={r.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{r.title}</p>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--warning)', whiteSpace: 'nowrap' }}>
                      {r.pointsCost} pts
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, lineHeight: 1.5 }}>
                    {r.description}
                  </p>
                </div>

                <Button
                  variant={canAfford ? 'primary' : 'secondary'}
                  size="sm"
                  disabled={!canAfford || redeemingId === r.id}
                  loading={redeemingId === r.id}
                  onClick={() => handleRedeemReward(r)}
                  style={{
                    width: '100%',
                    background: canAfford ? 'linear-gradient(135deg, var(--crew-from), var(--crew-to))' : undefined,
                  }}
                >
                  {canAfford ? 'Redeem Perk' : `Need ${r.pointsCost - points} more pts`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              Referred Students ({referrals.length})
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Live registration and test activity (names masked for student privacy)
            </p>
          </div>
        </div>

        {referrals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-faint)' }}>
            <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>No referrals registered yet</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Share your link or WhatsApp message in your college groups to get started!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {referrals.map((ref) => {
              const isActivated = ref.hasTakenFirstTest || ref.status === 'activated';
              const name = maskName(ref.referredUserName, ref.referredUserEmail);

              return (
                <div
                  key={ref.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--r-input)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                      Joined with code #{referralCode}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isActivated ? (
                      <span style={{ fontSize: 12, color: 'var(--success)', background: 'rgba(52, 211, 153, 0.15)', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>
                        ● Activated (+50 pts)
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-faint)', background: 'var(--surface)', padding: '3px 10px', borderRadius: 999 }}>
                        Joined (+10 pts)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

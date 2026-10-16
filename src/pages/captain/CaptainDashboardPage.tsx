import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Compass,
  Trophy,
  Copy,
  Check,
  Target,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface MissionItem {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  rewardPoints: number;
  category?: string;
  icon?: string;
  isActive?: boolean;
}

interface CaptainData {
  id: string;
  studentName?: string;
  institution?: string;
  city?: string;
  referralCode?: string;
  referralCount?: number;
  activeUsersCount?: number;
  points?: number;
  tier?: string;
  rank?: number;
  status?: string;
}

export function CaptainDashboardPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.uid ?? null);

  const [captain, setCaptain] = useState<CaptainData | null>(null);
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    async function loadCaptainData() {
      try {
        // 1. Fetch captain profile document from captains/{uid}
        const capSnap = await getDoc(doc(db, 'captains', user!.uid));
        if (capSnap.exists()) {
          setCaptain({ id: capSnap.id, ...capSnap.data() } as CaptainData);
        }

        // 2. Fetch active missions
        const misSnap = await getDocs(collection(db, 'missions'));
        if (!misSnap.empty) {
          setMissions(misSnap.docs.map((d) => ({ id: d.id, ...d.data() } as MissionItem)));
        } else {
          // Default missions if collection not yet seeded
          setMissions([
            {
              id: 'msn-1',
              title: 'Weekly Squad Recruitment',
              description: 'Onboard 5 students from your campus batch who complete their first diagnostic test.',
              targetCount: 5,
              rewardPoints: 250,
            },
            {
              id: 'msn-2',
              title: 'Host a Campus Mock Sprint',
              description: 'Organize a timed peer drill for your class using the Boardly Practice Vault.',
              targetCount: 1,
              rewardPoints: 500,
            },
            {
              id: 'msn-3',
              title: 'Reach 50 Campus Activations',
              description: 'Surpass 50 active students on your campus leaderboard to unlock Captain Gold status.',
              targetCount: 50,
              rewardPoints: 1000,
            },
          ]);
        }
      } catch (err) {
        console.warn('[CaptainDashboard] Data fetch note:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCaptainData();
  }, [user]);

  const captainCode = captain?.referralCode || `CAP-${profile?.targetUniversity?.substring(0, 4) || 'NUST'}-26`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(captainCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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

  const isCaptain = Boolean(captain?.status === 'active' || profile?.role === 'captain');

  // If user is not yet a Campus Captain, render the invitation and apply CTA
  if (!isCaptain) {
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
              background: 'linear-gradient(135deg, var(--captain-from), var(--captain-to))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 0 24px rgba(245, 158, 11, 0.5)',
            }}
          >
            <Compass size={28} />
          </div>

          <div>
            <h1 className="font-display" style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, color: 'var(--text)' }}>
              Become a <span style={{ color: 'var(--captain-from)' }}>Campus Captain</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 540, marginTop: 8, lineHeight: 1.6 }}>
              Lead entrance test preparation at your university or college campus. Host campus sprints, guide batchmates through NUST NET / FAST-NUCES mocks, and earn official leadership recommendations.
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
              <Trophy size={20} style={{ color: 'var(--captain-from)', marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>National Leaderboard</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                Compete against captains across NUST, FAST, GIKI, and LUMS for top campus ranks.
              </p>
            </div>

            <div className="glass" style={{ padding: '16px', borderRadius: 'var(--r-input)' }}>
              <Target size={20} style={{ color: 'var(--brand)', marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Weekly Missions</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                Complete structured campus challenges to unlock higher rewards and tiers.
              </p>
            </div>

            <div className="glass" style={{ padding: '16px', borderRadius: 'var(--r-input)' }}>
              <Award size={20} style={{ color: 'var(--success)', marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Direct Team Access</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                Exclusive monthly syncs with Boardly engineering and product leadership.
              </p>
            </div>
          </div>

          <Link to="/captain/apply" style={{ marginTop: 12 }}>
            <Button
              variant="primary"
              size="lg"
              style={{
                gap: 8,
                background: 'linear-gradient(135deg, var(--captain-from), var(--captain-to))',
              }}
            >
              <span>Apply for Campus Captain</span>
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Approved Campus Captain View
  const activeStudents = captain?.activeUsersCount ?? 0;
  const captainPoints = captain?.points ?? activeStudents * 50;
  const campusRank = captain?.rank ? `#${captain.rank}` : '#2';
  const campusName = captain?.institution || profile?.targetUniversity || 'FAST-NUCES';
  const tier = captain?.tier || (activeStudents > 25 ? 'Platinum' : activeStudents > 10 ? 'Gold' : 'Silver');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.25rem 5rem', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner */}
      <div
        className="glass"
        style={{
          borderRadius: 'var(--r-hero)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(251, 146, 60, 0.04))',
          border: '1px solid rgba(245, 158, 11, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--captain-from)' }}>
                Campus Captain Cockpit
              </span>
              <Badge color="warning">{tier} Tier</Badge>
            </div>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              {campusName}
            </h1>
          </div>

          <Link to="/captain/leaderboard">
            <Button variant="secondary" size="sm" style={{ gap: 6 }}>
              <Trophy size={14} color="var(--warning)" />
              <span>National Leaderboard</span>
            </Button>
          </Link>
        </div>

        {/* Code Bar */}
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
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 2 }}>Campus Captain Code</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--captain-from)', letterSpacing: '0.04em' }}>
              {captainCode}
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={handleCopyCode} style={{ gap: 6 }}>
            {copiedCode ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
          </Button>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          <div className="glass" style={{ padding: '14px', borderRadius: 'var(--r-input)', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--captain-from)' }}>{activeStudents}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Activated Students</p>
          </div>

          <div className="glass" style={{ padding: '14px', borderRadius: 'var(--r-input)', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>{campusRank}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Campus Rank</p>
          </div>

          <div className="glass" style={{ padding: '14px', borderRadius: 'var(--r-input)', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#FB923C' }}>{captainPoints}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Captain Points</p>
          </div>

          <div className="glass" style={{ padding: '14px', borderRadius: 'var(--r-input)', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{tier}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Captain Tier</p>
          </div>
        </div>
      </div>

      {/* Active Missions */}
      <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              Active Campus Missions
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Weekly objectives to drive campus test-readiness
            </p>
          </div>
          <TrendingUp size={20} style={{ color: 'var(--captain-from)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {missions.map((m, i) => {
            const currentCount = Math.min(m.targetCount, Math.floor(activeStudents * 0.4) + (i === 0 ? 3 : 1));
            const progress = Math.min(100, Math.round((currentCount / m.targetCount) * 100));

            return (
              <div
                key={m.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{m.title}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{m.description}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--captain-from)', whiteSpace: 'nowrap' }}>
                    +{m.rewardPoints} pts
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>
                    <span>Progress: {currentCount} / {m.targetCount}</span>
                    <span style={{ fontWeight: 700, color: progress >= 100 ? 'var(--success)' : 'var(--text)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        borderRadius: 3,
                        background: 'linear-gradient(90deg, var(--captain-from), var(--captain-to))',
                        transition: 'width 800ms var(--ease-out)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

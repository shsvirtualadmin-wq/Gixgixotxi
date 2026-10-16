import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../ui/AppShell';
import { StatCard } from '../ui/StatCard';
import { Badge } from '../ui/Badge';
import { DashboardPhoneCard } from '../ui/PhoneMockup';
import {
  Users,
  Award,
  Target,
  Gift,
  TrendingUp,
  Share2,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  db,
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  getDocs,
} from '../../lib/firebase';

interface ReferralItem {
  id: string;
  referredUserName?: string;
  referredUserEmail?: string;
  createdAt?: any;
  status?: string;
  activated?: boolean;
  hasTakenFirstTest?: boolean;
}

interface CaptainData {
  points: number;
  referralCount: number;
  activeUsersCount: number;
  institution?: string;
  referralCode?: string;
  rank?: number;
}

export const CaptainDashboard: React.FC = () => {
  const { user, profile, logOut, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);

  const [captainData, setCaptainData] = useState<CaptainData>({
    points: 0,
    referralCount: 0,
    activeUsersCount: 0,
    institution: profile?.targetUniversity || '',
    referralCode: profile?.uid ? `BOARDLY-${profile.uid.substring(0, 6).toUpperCase()}` : 'BOARDLY-CAPTAIN',
  });

  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState<boolean>(true);
  const [nationalRank, setNationalRank] = useState<number | string>('—');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string | null>(null);

  const captainCode = captainData.referralCode || (profile?.uid ? `BOARDLY-${profile.uid.substring(0, 6).toUpperCase()}` : 'BOARDLY-CAPTAIN');
  const referralUrl = `https://boardly.cfd/r/${captainCode}`;

  // 1. Listen live to captains/{uid}
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'captains', user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setCaptainData((prev) => ({
          ...prev,
          points: d.points || 0,
          referralCount: d.referralCount || 0,
          activeUsersCount: d.activeUsersCount || 0,
          institution: d.institution || prev.institution,
          referralCode: d.referralCode || prev.referralCode,
        }));
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // 2. Listen live to referrals where captainId == user.uid
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingReferrals(true);
    const q = query(collection(db, 'referrals'), where('captainId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: ReferralItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        items.sort((a, b) => {
          const tA = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || 0).getTime();
          return tB - tA;
        });
        setReferrals(items);
        setLoadingReferrals(false);
      },
      (err) => {
        console.warn('[CaptainDashboard] Referrals snapshot error:', err);
        setLoadingReferrals(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  // 3. Fetch National Rank from captains collection
  useEffect(() => {
    async function fetchRank() {
      if (!user?.uid) return;
      try {
        const q = query(collection(db, 'captains'), orderBy('points', 'desc'), limit(50));
        const snap = await getDocs(q);
        const idx = snap.docs.findIndex((d) => d.id === user.uid);
        if (idx !== -1) {
          setNationalRank(`#${idx + 1}`);
        } else {
          setNationalRank('Top 20%');
        }
      } catch (err) {
        console.warn('[CaptainDashboard] Rank calculation note:', err);
      }
    }
    fetchRank();
  }, [user?.uid, captainData.points]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Prepare for FSC and University Entrance Tests (NUST, FAST, GIKI, MDCAT) with Boardly & SHS Virtual Academy! Free timed MCQ drills, AI explanations, and past papers. Join via my campus link: ${referralUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyPromo = (promoText: string) => {
    navigator.clipboard.writeText(promoText);
    setCopiedPromo(true);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  // Helper: Mask name into "First L."
  const maskName = (name?: string) => {
    if (!name) return 'Student';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
  };

  // Redeem Reward handler
  const handleRedeemReward = async (rewardTitle: string, requiredPoints: number) => {
    if (!user?.uid) return;
    if (captainData.points < requiredPoints) {
      alert(`You need ${requiredPoints} points to redeem this reward. Keep bringing peers to earn more!`);
      return;
    }

    setRedeemingId(rewardTitle);
    try {
      const redemptionId = `red_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await setDoc(doc(db, 'rewardRedemptions', redemptionId), {
        id: redemptionId,
        userId: user.uid,
        captainId: user.uid,
        rewardTitle,
        pointsDeducted: requiredPoints,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Deduct points
      await updateDoc(doc(db, 'captains', user.uid), {
        points: increment(-requiredPoints),
        updatedAt: serverTimestamp(),
      });

      setRedeemSuccessMsg(`Redemption request for "${rewardTitle}" submitted! Our team will process it within 24 hours.`);
      setTimeout(() => setRedeemSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('[CaptainDashboard] Redeem error:', err);
      alert(`Redemption error: ${err?.message || 'Please try again.'}`);
    } finally {
      setRedeemingId(null);
    }
  };

  const totalReferrals = referrals.length || captainData.referralCount;
  const activatedCount = referrals.filter((r) => r.activated || r.hasTakenFirstTest).length || captainData.activeUsersCount;

  // Real missions
  const missions = [
    {
      id: 'm1',
      title: 'Class Blitz Rally',
      desc: 'Bring 10 classmates to participate in this week’s National Blitz mock.',
      progress: Math.min(10, totalReferrals),
      target: 10,
      points: 250,
      completed: totalReferrals >= 10,
    },
    {
      id: 'm2',
      title: 'First Mock Activation',
      desc: 'Activate 5 newly referred students who complete their first diagnostic test.',
      progress: Math.min(5, activatedCount),
      target: 5,
      points: 300,
      completed: activatedCount >= 5,
    },
    {
      id: 'm3',
      title: 'Academy WhatsApp Broadcast',
      desc: 'Share your campus link in college & FSC batch WhatsApp groups.',
      progress: totalReferrals > 0 ? 1 : 0,
      target: 1,
      points: 100,
      completed: totalReferrals > 0,
    },
  ];

  // Rewards Catalog
  const rewardsList = [
    {
      id: 'r1',
      title: 'Official Campus Captain Digital Certificate',
      points: 300,
      desc: 'Signed leadership certificate verified by SHS Virtual Academy leadership.',
    },
    {
      id: 'r2',
      title: '1 Month Boardly Pro Membership',
      points: 650,
      desc: 'Unlimited full-length entrance mocks and priority Boardy AI tutor access.',
    },
    {
      id: 'r3',
      title: 'Boardly Academy Swag Bag & Hoodie',
      points: 1500,
      desc: 'High-quality cotton hoodie and branded study kit shipped to your address.',
    },
    {
      id: 'r4',
      title: 'Executive Letter of Recommendation',
      points: 2500,
      desc: 'Customized letter detailing your campus leadership and outreach metrics.',
    },
  ];

  return (
    <AppShell
      role="captain"
      title="Campus Captains Portal"
      subtitle="Represent Boardly at your college or academy and earn leadership rewards"
      activeNav={activeTab}
      onSelectNav={(id) => {
        if (id === 'student_profile') {
          switchRole('student');
          window.history.pushState({}, '', '/app/profile');
          window.dispatchEvent(new PopStateEvent('popstate'));
          return;
        }
        setActiveTab(id);
      }}
      onLogout={logOut}
    >
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 text-left">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Campus Referrals"
              value={String(totalReferrals)}
              subtitle="Registered students"
              accent="amber"
              icon={<Users className="w-5 h-5 text-amber-500" />}
            />
            <StatCard
              label="Activated Students"
              value={String(activatedCount)}
              subtitle="Completed >=1 test"
              accent="amber"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            />
            <StatCard
              label="Leadership Points"
              value={String(captainData.points)}
              subtitle="50 pts per activated student"
              accent="amber"
              icon={<Sparkles className="w-5 h-5 text-amber-500" />}
            />
            <StatCard
              label="National Rank"
              value={String(nationalRank)}
              subtitle="Verified captain standings"
              accent="amber"
              icon={<Award className="w-5 h-5 text-orange-500" />}
            />
          </div>

          {/* Dismissible PhoneMockup preview card */}
          <DashboardPhoneCard
            title="Mobile Captain Preview"
            subtitle="How student recruits see your campus referral link on mobile browsers"
            initialScreen="student"
          />

          {/* Referral Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-black text-base text-white">
                Your Exclusive Campus Referral Link
              </h3>
              <p className="text-xs text-[#A3B0CC]">
                Code: <span className="font-mono font-bold text-amber-400">{captainCode}</span>
                {captainData.institution && ` • Campus: ${captainData.institution}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp Share</span>
              </button>
            </div>
          </div>

          {/* Real Referrals Table */}
          <div className="p-6 rounded-3xl bg-[#0B1220] border border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Referred Classmates & Students</h3>
                <p className="text-xs text-[#A3B0CC]">Real-time tracking of peers joined through your campus code</p>
              </div>
              <Badge variant="student" size="sm">
                {referrals.length} Total
              </Badge>
            </div>

            {loadingReferrals ? (
              <div className="py-8 text-center text-xs text-[#A3B0CC] animate-pulse">
                Loading campus referrals from Firestore...
              </div>
            ) : referrals.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-sm font-bold text-white">No Referrals Yet</h4>
                  <p className="text-xs text-[#A3B0CC]">
                    Share your campus link in your college WhatsApp group to track newly registered students.
                  </p>
                </div>
                <button
                  onClick={handleShareWhatsApp}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Campus Link Now</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/8 text-[#A3B0CC]">
                      <th className="py-3 px-3 font-semibold">Student Name</th>
                      <th className="py-3 px-3 font-semibold">Status</th>
                      <th className="py-3 px-3 font-semibold">Joined Date</th>
                      <th className="py-3 px-3 font-semibold text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {referrals.map((r) => {
                      const isAct = r.activated || r.hasTakenFirstTest;
                      const dateStr = r.createdAt?.toDate
                        ? r.createdAt.toDate().toLocaleDateString()
                        : 'Recently';
                      return (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-bold text-white">{maskName(r.referredUserName)}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isAct
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-white/10 text-[#A3B0CC]'
                              }`}
                            >
                              {isAct ? 'Active (Test Taken)' : 'Joined'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#A3B0CC]">{dateStr}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                            {isAct ? '+50 pts' : '+0 pts'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MISSIONS TAB */}
      {activeTab === 'missions' && (
        <div className="space-y-6 text-left">
          <div className="p-6 rounded-3xl bg-[#0B1220] border border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Campus Leadership Missions</h3>
                <p className="text-xs text-[#A3B0CC]">Complete weekly goals to boost your campus rank and rewards</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {captainData.points} Points Available
              </span>
            </div>

            <div className="space-y-3">
              {missions.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-white/5 border border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-white">{m.title}</p>
                      {m.completed && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#A3B0CC]">{m.desc}</p>
                    <div className="w-full max-w-xs h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#A3B0CC] font-mono pt-1">
                      {m.progress} / {m.target} progress
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      +{m.points} Points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. REWARDS CATALOG TAB */}
      {activeTab === 'rewards' && (
        <div className="space-y-6 text-left">
          {redeemSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{redeemSuccessMsg}</span>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-[#0B1220] border border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Campus Captain Rewards Catalog</h3>
                <p className="text-xs text-[#A3B0CC]">Redeem your leadership points for verified certificates, Pro access, and swag</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                Balance: {captainData.points} pts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewardsList.map((r) => {
                const canRedeem = captainData.points >= r.points;
                const isRedeeming = redeemingId === r.title;

                return (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl bg-white/5 border border-white/8 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {r.points} Points
                        </span>
                        {canRedeem ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                            Available
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-[#A3B0CC]">
                            Locked
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">{r.title}</h4>
                      <p className="text-xs text-[#A3B0CC] leading-relaxed">{r.desc}</p>
                    </div>

                    <button
                      onClick={() => handleRedeemReward(r.title, r.points)}
                      disabled={!canRedeem || isRedeeming}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        canRedeem
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-md shadow-amber-500/20'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      {isRedeeming ? 'Processing...' : canRedeem ? 'Redeem Reward' : `Need ${r.points - captainData.points} more pts`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. PROMOTIONAL KIT TAB */}
      {activeTab === 'kit' && (
        <div className="space-y-6 text-left">
          <div className="p-6 rounded-3xl bg-[#0B1220] border border-white/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Campus Outreach & Promotional Kit</h3>
                <p className="text-xs text-[#A3B0CC]">Ready-to-post messages tailored for WhatsApp college batch groups and social media</p>
              </div>
              <span className="text-xs font-mono text-[#22D3EE]">Verified Kit 2026</span>
            </div>

            {/* Template 1: College Batch WhatsApp Broadcast */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/8 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  1. College Batch WhatsApp Broadcast
                </h4>
                <button
                  onClick={() => {
                    const text = `Assalam o Alaikum everyone! 👋\n\nIf you're preparing for FSC boards or university entry tests (NUST NET, FAST, GIKI, MDCAT, PIEAS), check out Boardly. It features timed MCQ drills with step-by-step mathematical derivations and AI diagnostic feedback.\n\nYou can access free timed mocks using my campus invite link:\n👉 ${referralUrl}\n\nLet's ace the exams together! 🚀`;
                    handleCopyPromo(text);
                  }}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  {copiedPromo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPromo ? 'Copied' : 'Copy Message'}</span>
                </button>
              </div>
              <p className="text-xs text-[#A3B0CC] whitespace-pre-line bg-[#070B14] p-4 rounded-xl border border-white/5 font-mono">
                {`Assalam o Alaikum everyone! 👋\n\nIf you're preparing for FSC boards or university entry tests (NUST NET, FAST, GIKI, MDCAT, PIEAS), check out Boardly. It features timed MCQ drills with step-by-step mathematical derivations and AI diagnostic feedback.\n\nYou can access free timed mocks using my campus invite link:\n👉 ${referralUrl}\n\nLet's ace the exams together! 🚀`}
              </p>
            </div>

            {/* Template 2: Instagram Story Caption */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/8 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  2. Instagram / WhatsApp Story Caption
                </h4>
                <button
                  onClick={() => {
                    const text = `Practicing entrance test MCQs with instant step-by-step solutions on @boardly.pk 📚 Link in bio or swipe up to try a mock: ${referralUrl}`;
                    handleCopyPromo(text);
                  }}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Caption</span>
                </button>
              </div>
              <p className="text-xs text-[#A3B0CC] bg-[#070B14] p-4 rounded-xl border border-white/5 font-mono">
                {`Practicing entrance test MCQs with instant step-by-step solutions on @boardly.pk 📚 Link in bio or swipe up to try a mock: ${referralUrl}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

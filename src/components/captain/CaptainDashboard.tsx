import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../ui/AppShell';
import { StatCard } from '../ui/StatCard';
import { DataTable } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { StatusPill } from '../ui/StatusPill';
import {
  Users,
  Award,
  Target,
  Gift,
  TrendingUp,
  Share2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  CheckCircle,
  FileText,
} from 'lucide-react';

export const CaptainDashboard: React.FC = () => {
  const { user, profile, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode = profile?.uid ? `BOARDLY-${profile.uid.substring(0, 6).toUpperCase()}` : 'BOARDLY-CAPTAIN';
  const referralUrl = `https://boardly.cfd/r/${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Prepare for FSC and Entry Tests (NUST, FAST, GIKI, MDCAT) with Boardly's timed MCQ drills and AI explanations! Join using my captain link: ${referralUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const referredStudents = [
    { id: '1', name: 'Hamza A.', date: 'Yesterday', activated: true },
    { id: '2', name: 'Zainab M.', date: '2 days ago', activated: true },
    { id: '3', name: 'Daniyal K.', date: '3 days ago', activated: false },
    { id: '4', name: 'Usman T.', date: '5 days ago', activated: true },
    { id: '5', name: 'Maryam S.', date: '1 week ago', activated: true },
  ];

  const missions = [
    {
      id: 'm1',
      title: 'Class Blitz Rally',
      desc: 'Bring 10 classmates to participate in this week’s Boardly Blitz drill.',
      progress: 7,
      target: 10,
      points: 250,
      completed: false,
    },
    {
      id: 'm2',
      title: 'First Mock Challenge',
      desc: 'Activate 5 newly referred students who complete their diagnostic test.',
      progress: 5,
      target: 5,
      points: 300,
      completed: true,
    },
    {
      id: 'm3',
      title: 'Academy WhatsApp Share',
      desc: 'Share Boardly’s formula sheet handbook link with your class group.',
      progress: 1,
      target: 1,
      points: 100,
      completed: true,
    },
  ];

  const rewards = [
    { tier: 'Tier 1', title: 'Official Campus Captain Digital Certificate', points: 300, unlocked: true },
    { tier: 'Tier 2', title: '1 Month Boardly Pro Membership', points: 650, unlocked: true },
    { tier: 'Tier 3', title: 'Boardly Academy Swag Bag & Hoodie', points: 1500, unlocked: false },
    { tier: 'Tier 4', title: 'Recommendation Letter from SHS Virtual Academy Leadership', points: 2500, unlocked: false },
  ];

  return (
    <AppShell
      role="captain"
      title="Campus Captains Portal"
      subtitle="Represent Boardly at your college or academy and earn leadership rewards"
      activeNav={activeTab}
      onSelectNav={(id) => setActiveTab(id)}
      onLogout={logOut}
    >
      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Referrals This Month"
              value="18"
              subtitle="Registered students"
              accent="amber"
              icon={<Users className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              label="Activated Students"
              value="14"
              subtitle="Completed 1st test"
              accent="amber"
              icon={<CheckCircle className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              label="Captain Points"
              value="850"
              subtitle="650 needed for Tier 3"
              accent="amber"
              icon={<Sparkles className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              label="National Rank"
              value="#4"
              subtitle="Top 5% across Pakistan"
              accent="amber"
              icon={<Award className="w-5 h-5 text-amber-600" />}
            />
          </div>

          {/* Referral Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-200/80 dark:border-amber-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Your Exclusive Referral Link
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Code: <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{referralCode}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-xs shadow-xs hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp Share</span>
              </button>
            </div>
          </div>

          {/* Active Missions Quick View */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Active Weekly Missions
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('missions')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                View All Missions →
              </button>
            </div>
            <div className="space-y-3">
              {missions.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{m.title}</p>
                    <p className="text-[11px] text-slate-400">{m.desc}</p>
                    <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant={m.completed ? 'emerald' : 'amber'}>
                    {m.completed ? 'Completed' : `+${m.points} pts`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. MY REFERRALS */}
      {activeTab === 'referrals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Referred Students
              </h3>
              <p className="text-xs text-slate-400">
                Activation occurs when student verifies their email and takes their first practice test.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              Share Referral Code
            </button>
          </div>

          <DataTable
            data={referredStudents}
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: 'name',
                header: 'Student (Privacy Masked)',
                render: (r) => <span className="font-bold">{r.name}</span>,
              },
              { key: 'date', header: 'Joined Date' },
              {
                key: 'activated',
                header: 'Activation Status',
                render: (r) => (
                  <StatusPill
                    status={r.activated ? 'approved' : 'pending'}
                    label={r.activated ? 'Activated (1st Test Done)' : 'Pending Test'}
                  />
                ),
              },
            ]}
          />
        </div>
      )}

      {/* 3. MISSIONS */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              Weekly Captain Missions
            </h3>
            <p className="text-xs text-slate-400">
              Complete tasks to level up your points and climb the nationwide leaderboard.
            </p>
          </div>

          <div className="space-y-3">
            {missions.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900 dark:text-white">{m.title}</span>
                    <Badge variant={m.completed ? 'emerald' : 'amber'}>
                      {m.completed ? 'Claimed' : `+${m.points} Points`}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-lg">{m.desc}</p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1 max-w-xs h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {m.progress} / {m.target}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. REWARDS */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              Official Captain Rewards Tier
            </h3>
            <p className="text-xs text-slate-400">
              Rewards are issued and approved directly by SHS Virtual Academy leadership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((r, i) => (
              <div
                key={i}
                className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
                  r.unlocked
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant={r.unlocked ? 'amber' : 'slate'}>{r.tier}</Badge>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {r.points} Points
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{r.title}</h4>
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!r.unlocked}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700 text-white disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {r.unlocked ? 'Redeem Reward' : 'Points Locked'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                National Campus Captains Ranking
              </h3>
              <p className="text-xs text-slate-400">Ranked by verified activated students this month.</p>
            </div>
            <Badge variant="amber">Top 10</Badge>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {[
              { rank: 1, name: 'Shahmeer K.', institution: 'Cadet College Hasanabdal', count: 32, pts: 1600 },
              { rank: 2, name: 'Amina F.', institution: 'Kinnaird College Lahore', count: 28, pts: 1400 },
              { rank: 3, name: 'Ali Raza', institution: 'F.G. Sir Syed College', count: 24, pts: 1200 },
              { rank: 4, name: 'Zain K. (You)', institution: 'Army Public School', count: 18, pts: 850 },
              { rank: 5, name: 'Dua N.', institution: 'St. Patrick’s Karachi', count: 15, pts: 750 },
            ].map((c) => (
              <div
                key={c.rank}
                className={`py-3 px-3 flex items-center justify-between rounded-xl ${
                  c.rank === 4 ? 'bg-amber-50 dark:bg-amber-950/40 font-bold' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold">
                    {c.rank}
                  </span>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white">{c.name}</span>
                    <span className="text-[11px] text-slate-400 block">{c.institution}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                  <span>{c.count} students</span>
                  <span className="font-extrabold text-amber-600">{c.pts} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. RESOURCES */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <FileText className="w-6 h-6 text-amber-600" />
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
              Captain Promotional Kit
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Official posters, WhatsApp caption templates, and QR code banners for your college campus.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 cursor-pointer"
            >
              Download Promotional Kit
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
};

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PublicLeaderboard } from '@/components/crew/PublicLeaderboard';
import {
  Users,
  Trophy,
  Zap,
  Lock,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import { MAX_CREW_MEMBERS } from '@/constants/limits';
import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME, NAKAMA_CAPTAIN_SINGULAR } from '@/constants/branding';
import { DashboardBottomNav } from '@/components/dashboard/DashboardBottomNav';



const CREW_FEATURES = [
  {
    icon: <Users size={22} />,
    title: 'Collaborative Study Squads',
    desc: `Room for up to ${MAX_CREW_MEMBERS} students per squad with real-time member rosters, active study status, and shareable QR codes.`,
  },
  {
    icon: <Trophy size={22} />,
    title: 'Squad-Only Leaderboards',
    desc: 'Internal rank tracking based on tests completed, accuracy percentages, and current consecutive daily study streaks.',
  },
  {
    icon: <Lock size={22} />,
    title: 'Privacy & Invite Controls',
    desc: 'Squad leaders can lock rooms to prevent uninvited entries, manage members, or seamlessly transfer leadership.',
  },
  {
    icon: <Zap size={22} />,
    title: GRAND_LINE_NAME,
    desc: 'Participate in synchronized competitive drills and track how your squad measures up across Pakistan.',
  },
];

const CREW_ROLES = [
  {
    badge: 'Core Student',
    title: 'Squad Member / Leader',
    desc: 'Every registered student can create their own study crew or join an existing one using an invite code. Practice daily tests, track streaks, and compare scores.',
    actionText: 'Open Squad Dashboard',
    actionLink: '/dashboard/crew',
  },
  {
    badge: 'Official Leadership',
    title: NAKAMA_CAPTAIN_SINGULAR,
    desc: 'Student leaders who assemble squads, publish entrance tests on Grand Line, earn weekly Pro rewards, and gain certificates and internship pathways with SHS Virtual Academy.',
    actionText: `Apply as ${NAKAMA_CAPTAIN_SINGULAR}`,
    actionLink: '/captain/apply',
  },
  {
    badge: 'Campus Lead',
    title: 'Study Squad Captain',
    desc: 'Student leadership role with dedicated referral code tracking, student onboarding metrics, and campus leaderboard standing.',
    actionText: `Explore ${NAKAMA_CAPTAINS_NAME}`,
    actionLink: '/nakama-captains',
  },
];

const CREW_FAQS = [
  {
    q: 'How many students can be in a single study crew?',
    a: `Each study crew has a strict limit of ${MAX_CREW_MEMBERS} members. This keeps discussion focused and prevents squad rooms from turning into cluttered broadcast channels.`,
  },
  {
    q: 'Does it cost anything to create or join a Crew?',
    a: 'No. Creating and joining a Study Crew is 100% free for all students on Boardly.',
  },
  {
    q: 'How do I join a friend’s existing squad?',
    a: 'Ask your squad leader for their 6-character code (e.g. ABC123) or invite link. Enter the code in the Crew portal or visit https://boardly.cfd/join/CODE to join with one click.',
  },
  {
    q: 'Can I be in more than one crew simultaneously?',
    a: 'To maintain meaningful squad commitment and accurate leaderboards, each student can only belong to one active study crew at a time. You can leave your current squad at any time to join another.',
  },
  {
    q: `What is the role of a ${NAKAMA_CAPTAIN_SINGULAR}?`,
    a: `A ${NAKAMA_CAPTAIN_SINGULAR} commands their study squad, publishes timed test drills on Grand Line, and earns extra Pro access extensions for every student they onboard.`,
  },
];

export function CrewPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const isInCrew = Boolean(profile?.crewId || profile?.isCrewMember);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) return;
    navigate(`/join/${code}`);
  };

  return (
    <>
      <PageMeta
        title="Study Crew & Campus Squads — Boardly"
        description={`Study together in squads of up to ${MAX_CREW_MEMBERS} students. Take synchronized mock tests, track leaderboards, and build consistent daily preparation habits.`}
      />

      <div className="pt-28 pb-20 boardly-container page-enter space-y-16">
        {/* ── 1. Hero ── */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <Badge color="red">Feature 05 &bull; Collaborative Prep</Badge>
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight leading-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Study Crew &amp; Campus Squads
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            Entrance exam prep is tough in isolation. Form a focused squad of up to {MAX_CREW_MEMBERS} peers, compare step derivations, and turn daily practice into a disciplined team habit.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            {isInCrew ? (
              <Link to="/crew/my" className="btn-red" style={{ height: '52px' }}>
                Go to My Crew
              </Link>
            ) : user ? (
              <Link to="/crew/my" className="btn-red" style={{ height: '52px' }}>
                Create or Join a Crew
              </Link>
            ) : (
              <Link to="/login?redirect=/crew/my" className="btn-red" style={{ height: '52px' }}>
                Create or Join a Crew
              </Link>
            )}
            <Link to="/captain/apply" className="btn-outline" style={{ height: '52px' }}>
              Apply as {NAKAMA_CAPTAIN_SINGULAR}
            </Link>
          </div>

          {/* 6-character Crew Code Quick Join Input */}
          <div className="max-w-md mx-auto pt-4">
            <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter 6-char crew code (e.g. CRW123)"
                maxLength={8}
                className="flex-1 rounded-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] uppercase tracking-wider text-center font-mono font-bold"
                style={{ height: '52px' }}
              />
              <button
                type="submit"
                className="btn-red shrink-0 px-6 text-sm font-bold cursor-pointer"
                style={{ height: '52px' }}
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* ── 2. National Crew Leaderboard ── */}
        <div className="space-y-8">
          <div className="section-header">
            <Badge color="red">Live Rankings</Badge>
            <h2>National Crew Leaderboard</h2>
            <p>
              Ranked in real time across Pakistan by questions solved, consecutive day streaks, and drill accuracy.
            </p>
          </div>

          <PublicLeaderboard
            currentUser={
              user
                ? {
                    uid: user.uid,
                    email: user.email || '',
                    streak: profile?.streak || 0,
                    score: 0,
                    crewId: profile?.crewId || null,
                  }
                : null
            }
          />
        </div>

        {/* ── 3. Feature Grid ── */}
        <div className="space-y-8">
          <div className="section-header">
            <Badge color="muted">Engineered for Teams</Badge>
            <h2>Squad Capabilities</h2>
            <p>Everything your study circle needs to prepare together effectively.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CREW_FEATURES.map((f) => (
              <Card key={f.title} className="p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h3
                      className="text-lg font-bold text-[var(--text)] mb-1"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                    >
                      {f.title}
                    </h3>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── 4. Roles Section ── */}
        <div className="space-y-8">
          <div className="section-header">
            <Badge color="muted">Leadership Pathways</Badge>
            <h2>Roles in the Boardly Network</h2>
            <p>
              From everyday study partners to official student ambassadors representing Boardly and SHS Virtual Academy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CREW_ROLES.map((role) => (
              <Card key={role.title} className="p-6 justify-between flex flex-col gap-4">
                <div className="space-y-3">
                  <Badge color="muted">{role.badge}</Badge>
                  <h3
                    className="text-lg font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                  >
                    {role.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    {role.desc}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    to={role.actionLink}
                    className="btn-outline w-full text-xs font-semibold flex items-center justify-center gap-2"
                    style={{ height: '44px' }}
                  >
                    <span>{role.actionText}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── 5. FAQ ── */}
        <div className="space-y-8">
          <div className="section-header">
            <Badge color="muted">Crew Inquiries</Badge>
            <h2>Frequently Asked Questions About Crew</h2>
          </div>

          <div className="max-w-[800px] mx-auto flex flex-col gap-3">
            {CREW_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="rounded-[16px] bg-[var(--surface)] border border-[var(--border)] cursor-pointer transition-colors hover:bg-[var(--surface-2)] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3
                      className="text-[16px] font-semibold text-[var(--text)] leading-snug"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                    >
                      {faq.q}
                    </h3>
                    <div className="text-[var(--muted)] shrink-0 w-6 h-6 flex items-center justify-center">
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] text-[14px] text-[var(--muted)] leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 6. Bottom Banner ── */}
        <div className="p-8 sm:p-12 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center space-y-6 max-w-3xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Start Your Squad Today
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Create a squad room, invite up to {MAX_CREW_MEMBERS} peers, and practice with real university test patterns.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/signup" className="btn-red" style={{ height: '52px' }}>
              Create Your Free Account
            </Link>
            <Link to="/captain/apply" className="btn-outline" style={{ height: '52px' }}>
              Become a {NAKAMA_CAPTAIN_SINGULAR}
            </Link>
          </div>
        </div>
      </div>

      {/* Fixed bottom navigation bar (icons only) */}
      <DashboardBottomNav />
    </>
  );
}

export default CrewPage;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PageMeta } from '@/components/ui/PageMeta';
import { PublicLeaderboard } from '@/components/crew/PublicLeaderboard';
import {
  Users,
  Trophy,
  Compass,
  Lock,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import { MAX_CREW_MEMBERS } from '@/constants/limits';
import { GRAND_LINE_NAME, NAKAMA_CAPTAIN_SINGULAR } from '@/constants/branding';
import { DashboardBottomNav } from '@/components/dashboard/DashboardBottomNav';
import { PublicPageHeader } from '@/components/layout/PublicPageHeader';
import { Footer } from '@/components/layout/Footer';
import { BackgroundCanvas } from '@/components/BackgroundCanvas';

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
    icon: <Compass size={22} />,
    title: GRAND_LINE_NAME,
    desc: 'Public tests created by Nakama Captains from across Pakistan. Take tests, compare scores, and see where your squad stands.',
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
    highlight: true,
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
    a: 'Ask your squad leader for their 6-character code (e.g. CRW123) or invite link. Enter the code in the Crew portal or visit https://boardly.cfd/join/CODE to join with one click.',
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
  const { requireAuth } = useAuthGate();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const isLoggedIn = Boolean(user);
  const isInCrew = Boolean(profile?.crewId || profile?.isCrewMember);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) return;
    if (!isLoggedIn) {
      requireAuth(
        `join Study Crew "${code}"`,
        () => navigate(`/join/${code}`),
        `/join/${code}`
      );
      return;
    }
    navigate(`/join/${code}`);
  };

  const handleCreateOrJoinCrew = () => {
    requireAuth(
      'create or join a Study Crew',
      () => navigate('/crew/my'),
      '/crew/my'
    );
  };

  const handleApplyCaptain = () => {
    requireAuth(
      `apply as a ${NAKAMA_CAPTAIN_SINGULAR}`,
      () => navigate('/captain/apply'),
      '/captain/apply'
    );
  };

  const content = (
    <div className="pb-20 boardly-container page-enter space-y-16 sm:space-y-24 pt-4 sm:pt-6">
      {/* ── 1. Hero ── */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="flex justify-center">
          <span className="section-chip-red">
            Feature 05 &bull; Collaborative Prep
          </span>
        </div>

        <h1
          className="section-heading text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight leading-tight"
          style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(28px, 4.2vw, 48px)' }}
        >
          Study Crew &amp; Campus Squads
        </h1>
        <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
          Entrance exam prep is tough in isolation. Form a focused squad of up to {MAX_CREW_MEMBERS} peers, compare step derivations, and turn daily practice into a disciplined team habit.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
          {isInCrew ? (
            <Link to="/crew/my" className="btn-primary">
              Go to My Crew
            </Link>
          ) : isLoggedIn ? (
            <Link to="/crew/my" className="btn-primary">
              Create or Join a Crew
            </Link>
          ) : (
            <button type="button" onClick={handleCreateOrJoinCrew} className="btn-primary cursor-pointer">
              Create or Join a Crew
            </button>
          )}
          {isLoggedIn ? (
            <Link to="/captain/apply" className="btn-secondary">
              Apply as {NAKAMA_CAPTAIN_SINGULAR}
            </Link>
          ) : (
            <button type="button" onClick={handleApplyCaptain} className="btn-secondary cursor-pointer">
              Apply as {NAKAMA_CAPTAIN_SINGULAR}
            </button>
          )}
        </div>

        {/* 6-character Crew Code Quick Join Input - Neat Glass Pill Group */}
        <div className="max-w-md mx-auto pt-3">
          <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter 6-char crew code (e.g. CRW123)"
              maxLength={8}
              className="w-full sm:flex-1 h-[52px] rounded-full px-5 text-sm text-[var(--text)] placeholder-[var(--muted)] glass-input focus:outline-none focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/40 uppercase tracking-wider text-center font-mono font-bold transition-all"
            />
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto shrink-0 px-8 text-sm font-bold cursor-pointer"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* ── 2. National Crew Leaderboard ── */}
      <div className="space-y-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none -z-10 blur-3xl opacity-60">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.12)_0%,rgba(215,25,33,0.03)_50%,transparent_75%)]" />
        </div>

        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="flex justify-center">
            <span className="section-chip-red">Live Rankings</span>
          </div>
          <h2
            className="section-heading text-2xl sm:text-4xl font-extrabold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(24px, 3.4vw, 38px)' }}
          >
            National Crew Leaderboard
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
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

      {/* ── 3. Squad Capabilities (2x2 Grid) ── */}
      <div className="space-y-8 relative">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="flex justify-center">
            <span className="section-chip">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0" aria-hidden="true" />
              Engineered for Teams
            </span>
          </div>
          <h2
            className="section-heading text-2xl sm:text-4xl font-extrabold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(24px, 3.4vw, 38px)' }}
          >
            Squad Capabilities
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            Everything your study circle needs to prepare together effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {CREW_FEATURES.map((f) => (
            <div key={f.title} className="glass-card rounded-[28px] p-6 sm:p-7 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl icon-tile text-white flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3
                    className="text-lg font-bold text-[var(--text)] mb-2"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Roles Section ── */}
      <div className="space-y-8 relative">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="flex justify-center">
            <span className="section-chip">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0" aria-hidden="true" />
              Leadership Pathways
            </span>
          </div>
          <h2
            className="section-heading text-2xl sm:text-4xl font-extrabold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(24px, 3.4vw, 38px)' }}
          >
            Roles in the Boardly Network
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            From everyday study partners to official student ambassadors representing Boardly and SHS Virtual Academy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
          {CREW_ROLES.map((role) => (
            <div
              key={role.title}
              className={`glass-card rounded-[28px] p-6 sm:p-8 flex flex-col justify-between ${
                role.highlight
                  ? 'glass-card-highlight'
                  : ''
              }`}
            >
              <div className="space-y-4">
                <span className="section-chip text-xs">
                  {role.badge}
                </span>
                <h3
                  className="text-xl font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  {role.title}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{role.desc}</p>
              </div>

              <div className="pt-6 mt-6 border-t border-white/[0.08]">
                {isLoggedIn ? (
                  <Link to={role.actionLink} className="btn-secondary w-full group">
                    <span>{role.actionText}</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      role.actionLink.includes('captain')
                        ? handleApplyCaptain()
                        : handleCreateOrJoinCrew()
                    }
                    className="btn-secondary w-full group cursor-pointer"
                  >
                    <span>{role.actionText}</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. FAQs ── */}
      <div className="space-y-8 max-w-3xl mx-auto relative">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="flex justify-center">
            <span className="section-chip">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0" aria-hidden="true" />
              Questions
            </span>
          </div>
          <h2
            className="section-heading text-2xl sm:text-4xl font-extrabold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(24px, 3.4vw, 38px)' }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            Common questions about Study Crews, squad limits, and Nakama Captains.
          </p>
        </div>

        <div className="space-y-3.5">
          {CREW_FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            const answerId = `crew-faq-ans-${i}`;
            const triggerId = `crew-faq-trig-${i}`;

            return (
              <div
                key={faq.q}
                className={`rounded-[24px] sm:rounded-[28px] border transition-all duration-300 ${
                  isOpen
                    ? 'glass-card-highlight'
                    : 'glass-card hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer rounded-[24px] sm:rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D71921] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <span
                    className="font-semibold text-sm sm:text-base text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border transition-all duration-300 flex items-center justify-center shrink-0 ${
                      isOpen
                        ? 'bg-[#D71921]/20 border-[#D71921]/60 text-[var(--text-primary)] shadow-[0_0_12px_rgba(215,25,33,0.3)]'
                        : 'icon-tile text-white/70 hover:text-white'
                    }`}
                  >
                    {isOpen ? <Minus size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />}
                  </div>
                </button>

                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={triggerId}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                      <div className="pt-3 border-t border-white/[0.08] text-sm text-[var(--muted)] leading-relaxed">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. Bottom CTA (Matching Panel A) ── */}
      <div className="relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none -z-10 blur-3xl opacity-75">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.18)_0%,rgba(215,25,33,0.04)_50%,transparent_75%)]" />
        </div>

        <div className="glass-panel p-8 sm:p-12 lg:p-14 text-center space-y-4 max-w-4xl mx-auto">
          <h2
            className="section-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(24px, 3.2vw, 36px)' }}
          >
            Study with your crew today
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] max-w-xl mx-auto">
            Create a squad room, invite up to {MAX_CREW_MEMBERS} peers, and practice with real university test patterns.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
            {isLoggedIn ? (
              <Link to="/crew/my" className="btn-primary">
                Open Squad Dashboard
              </Link>
            ) : (
              <button type="button" onClick={handleCreateOrJoinCrew} className="btn-primary cursor-pointer">
                Sign In to Join or Create
              </button>
            )}
            {isLoggedIn ? (
              <Link to="/captain/apply" className="btn-secondary">
                Become a {NAKAMA_CAPTAIN_SINGULAR}
              </Link>
            ) : (
              <button type="button" onClick={handleApplyCaptain} className="btn-secondary cursor-pointer">
                Become a {NAKAMA_CAPTAIN_SINGULAR}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PageMeta
        title="Study Crew & Campus Squads — Boardly"
        description={`Study together in squads of up to ${MAX_CREW_MEMBERS} students. Take practice tests, track leaderboards, and build consistent daily preparation habits.`}
      />

      {isLoggedIn ? (
        // Logged in: in-dashboard Crew view (bottom nav visible, public top navbar hidden)
        <div className="relative min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
          <BackgroundCanvas />
          <div className="flex-1 flex flex-col pb-16 pt-4 sm:pt-6">
            {content}
          </div>
          <DashboardBottomNav />
        </div>
      ) : (
        // Logged out: public header with back arrow & title, footer, and NO bottom nav
        <div className="relative min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
          <BackgroundCanvas />
          <PublicPageHeader title="Study Crew" />
          <div className="flex-1 flex flex-col pt-20 sm:pt-24">
            {content}
          </div>
          <Footer />
        </div>
      )}
    </>
  );
}

export default CrewPage;

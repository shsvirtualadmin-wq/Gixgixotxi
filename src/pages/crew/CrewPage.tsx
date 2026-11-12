import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PageMeta } from '@/components/ui/PageMeta';
import { PublicLeaderboard } from '@/components/crew/PublicLeaderboard';
import {
  CrewBottomDock,
  getCrewBtnHandlers,
} from '@/components/crew/CrewGlassPrimitives';
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

const CREW_FEATURES = [
  {
    icon: <Users size={20} strokeWidth={2} />,
    title: 'Collaborative Study Squads',
    desc: `Room for up to ${MAX_CREW_MEMBERS} students per squad with real-time member rosters, active study status, and shareable QR codes.`,
  },
  {
    icon: <Trophy size={20} strokeWidth={2} />,
    title: 'Squad-Only Leaderboards',
    desc: 'Internal rank tracking based on tests completed, accuracy percentages, and current consecutive daily study streaks.',
  },
  {
    icon: <Lock size={20} strokeWidth={2} />,
    title: 'Privacy & Invite Controls',
    desc: 'Squad leaders can lock rooms to prevent uninvited entries, manage members, or seamlessly transfer leadership.',
  },
  {
    icon: <Compass size={20} strokeWidth={2} />,
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

  return (
    <div className="cw-screen-root min-h-screen w-full flex flex-col justify-between overflow-x-clip transition-colors duration-150">
      <PageMeta
        title="Study Crew & Campus Squads — Boardly"
        description={`Study together in squads of up to ${MAX_CREW_MEMBERS} students. Take practice tests, track leaderboards, and build consistent daily preparation habits.`}
      />

      <div
        className="mx-auto w-full max-w-5xl px-3.5 sm:px-6 lg:px-8 pt-2 space-y-6 flex-1"
        style={{
          paddingBottom: isLoggedIn
            ? 'var(--sdn-page-pb)'
            : '48px',
        }}
      >
        {/* ── 1. Doto Page Title & Intro ── */}
        <div className="space-y-2 px-1">
          <span className="cw-chip cw-chip-leader">
            Feature 05 &bull; Collaborative Prep
          </span>
          <h1
            className="cw-font-doto text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight pt-1"
            style={{ color: 'var(--cw-text)' }}
          >
            Study Crew &amp; Campus Squads
          </h1>
          <p
            className="text-sm sm:text-base leading-relaxed"
            style={{ color: 'var(--cw-muted)' }}
          >
            Entrance exam prep is tough in isolation. Form a focused squad of up to{' '}
            {MAX_CREW_MEMBERS} peers, compare step derivations, and turn daily practice into a disciplined team habit.
          </p>
        </div>

        {/* ── 2. CTA Card with Red & Glass Buttons + Join-Code Pill Input + Join Button ── */}
        <section className="cw-card space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {isInCrew ? (
                <Link
                  to="/crew/my"
                  {...getCrewBtnHandlers()}
                  className="cw-btn cw-btn-red"
                >
                  Go to My Crew
                </Link>
              ) : isLoggedIn ? (
                <Link
                  to="/crew/my"
                  {...getCrewBtnHandlers()}
                  className="cw-btn cw-btn-red"
                >
                  Create or Join a Crew
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateOrJoinCrew}
                  {...getCrewBtnHandlers()}
                  className="cw-btn cw-btn-red"
                >
                  Create or Join a Crew
                </button>
              )}

              {isLoggedIn ? (
                <Link
                  to="/captain/apply"
                  {...getCrewBtnHandlers()}
                  className="cw-btn cw-btn-glass"
                >
                  Apply as {NAKAMA_CAPTAIN_SINGULAR}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCaptain}
                  {...getCrewBtnHandlers()}
                  className="cw-btn cw-btn-glass"
                >
                  Apply as {NAKAMA_CAPTAIN_SINGULAR}
                </button>
              )}
            </div>

            {/* Join-Code Pill Input + Join Button */}
            <form
              onSubmit={handleJoinByCode}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="6-char code (e.g. CRW123)"
                maxLength={8}
                className="cw-pill-input flex-1 sm:w-44 h-[44px] px-4 text-xs uppercase tracking-wider text-center font-mono font-bold"
              />
              <button
                type="submit"
                {...getCrewBtnHandlers()}
                className="cw-btn cw-btn-red shrink-0"
              >
                Join
              </button>
            </form>
          </div>
        </section>

        {/* ── 3. National Crew Leaderboard Card ── */}
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

        {/* ── 4. Squad Capabilities (2x2 Grid) ── */}
        <section className="space-y-4 pt-2">
          <div className="px-1">
            <h2
              className="cw-font-doto text-2xl font-extrabold"
              style={{ color: 'var(--cw-text)' }}
            >
              Squad Capabilities
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--cw-muted)' }}>
              Everything your study circle needs to prepare together effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CREW_FEATURES.map((f) => (
              <div key={f.title} className="cw-card space-y-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--cw-red) 18%, transparent)',
                    color: 'var(--cw-red-text)',
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3
                    className="cw-font-doto text-lg font-extrabold"
                    style={{ color: 'var(--cw-text)' }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-xs sm:text-sm mt-1 leading-relaxed"
                    style={{ color: 'var(--cw-muted)' }}
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Roles in the Boardly Network ── */}
        <section className="space-y-4 pt-2">
          <div className="px-1">
            <h2
              className="cw-font-doto text-2xl font-extrabold"
              style={{ color: 'var(--cw-text)' }}
            >
              Roles in the Boardly Network
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--cw-muted)' }}>
              From everyday study partners to official student ambassadors representing Boardly and SHS Virtual Academy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CREW_ROLES.map((role) => (
              <div
                key={role.title}
                className="cw-card flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <span
                    className={`cw-chip ${
                      role.highlight ? 'cw-chip-leader' : 'cw-chip-you'
                    }`}
                  >
                    {role.badge}
                  </span>
                  <h3
                    className="cw-font-doto text-xl font-extrabold"
                    style={{ color: 'var(--cw-text)' }}
                  >
                    {role.title}
                  </h3>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: 'var(--cw-muted)' }}
                  >
                    {role.desc}
                  </p>
                </div>

                <div>
                  {isLoggedIn ? (
                    <Link
                      to={role.actionLink}
                      {...getCrewBtnHandlers()}
                      className={`cw-btn w-full ${
                        role.highlight ? 'cw-btn-red' : 'cw-btn-glass'
                      }`}
                    >
                      <span>{role.actionText}</span>
                      <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        role.actionLink.includes('captain')
                          ? handleApplyCaptain()
                          : handleCreateOrJoinCrew()
                      }
                      {...getCrewBtnHandlers()}
                      className={`cw-btn w-full ${
                        role.highlight ? 'cw-btn-red' : 'cw-btn-glass'
                      }`}
                    >
                      <span>{role.actionText}</span>
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. Frequently Asked Questions ── */}
        <section className="space-y-4 pt-2">
          <div className="px-1">
            <h2
              className="cw-font-doto text-2xl font-extrabold"
              style={{ color: 'var(--cw-text)' }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--cw-muted)' }}>
              Common questions about Study Crews, squad limits, and Nakama Captains.
            </p>
          </div>

          <div className="space-y-3">
            {CREW_FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              const answerId = `crew-faq-ans-${i}`;
              const triggerId = `crew-faq-trig-${i}`;

              return (
                <div key={faq.q} className="cw-card !p-0 overflow-hidden">
                  <button
                    type="button"
                    id={triggerId}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span
                      className="font-bold text-sm sm:text-base"
                      style={{ color: 'var(--cw-text)' }}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`cw-btn cw-icon-btn ${
                        isOpen ? 'cw-btn-red' : 'cw-btn-glass'
                      } !w-8 !h-8 !min-w-[32px] !min-h-[32px] shrink-0`}
                    >
                      {isOpen ? (
                        <Minus size={14} strokeWidth={2.5} />
                      ) : (
                        <Plus size={14} strokeWidth={2.5} />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={answerId}
                      role="region"
                      aria-labelledby={triggerId}
                      className="px-5 pb-5 pt-0 text-xs sm:text-sm leading-relaxed"
                      style={{ color: 'var(--cw-muted)' }}
                    >
                      <div
                        className="pt-3"
                        style={{ borderTop: '1px solid var(--cw-line)' }}
                      >
                        {faq.a}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {isLoggedIn && <CrewBottomDock />}
    </div>
  );
}

export default CrewPage;

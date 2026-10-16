import { useState } from 'react';
import { PhoneMockup } from './PhoneMockup';
import { Badge } from '../ui/Badge';
import { Sparkles, Trophy, Users, Laptop } from 'lucide-react';

const PREVIEWS = [
  {
    screen: 0 as const,
    title: 'Student Study Cockpit',
    subtitle: 'Everything in one view',
    desc: 'Target exam countdown, daily sprint progress bar, accuracy % per chapter, and priority weak areas identified automatically.',
    icon: Laptop,
  },
  {
    screen: 1 as const,
    title: 'Ambassador Crew Hub',
    subtitle: 'Share & Earn Rewards',
    desc: 'Track referral milestones, copy unique student discount codes, and see real-time active student numbers.',
    icon: Users,
  },
  {
    screen: 2 as const,
    title: 'Campus Captain Desk',
    subtitle: 'Lead your college wing',
    desc: 'Campus rankings, weekly outreach missions, mock pass distribution counters, and ambassador leaderboards.',
    icon: Trophy,
  },
  {
    screen: 3 as const,
    title: 'Live Arena & Blitz',
    subtitle: 'National synchronized mock',
    desc: 'Compete in timed Sunday night sessions with national percentiles and instant anti-cheat auto-submission.',
    icon: Sparkles,
  },
];

export function ScrollDrivenPreview() {
  const [activeScreen, setActiveScreen] = useState<0 | 1 | 2 | 3>(0);

  return (
    <section className="landing-section relative">
      <div className="boardly-container">
        {/* Centered section header */}
        <div className="section-header">
          <Badge color="muted">Interactive Experience</Badge>
          <h2>Designed for Every Aspiring Leader</h2>
          <p>
            Whether you&apos;re an ambitious student, a study squad captain, or a campus ambassador, Boardly equips you with dedicated tools.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          {/* Left Column: Selector list */}
          <div className="space-y-3">
            {PREVIEWS.map(p => {
              const Icon = p.icon;
              const isSelected = activeScreen === p.screen;
              return (
                <div
                  key={p.title}
                  onClick={() => setActiveScreen(p.screen)}
                  className={`p-5 rounded-[20px] cursor-pointer transition-colors duration-150 border ${
                    isSelected
                      ? 'bg-[var(--card-2)] border-[var(--red)]'
                      : 'bg-[var(--card)] border-[var(--border)] hover:bg-[var(--card-2)]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[var(--red)] text-[#FFFFFF] border-[var(--red)]'
                          : 'bg-[#1A1A1A] text-[var(--muted)] border-[var(--border)]'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-base font-bold text-[var(--text)]"
                          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                        >
                          {p.title}
                        </h3>
                        <span className="text-xs text-[var(--muted)]">· {p.subtitle}</span>
                      </div>
                      <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Controlled PhoneMockup */}
          <div className="flex justify-center items-center">
            <PhoneMockup screen={activeScreen} onScreenChange={setActiveScreen} />
          </div>
        </div>
      </div>
    </section>
  );
}

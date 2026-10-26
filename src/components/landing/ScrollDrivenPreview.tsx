import { useState } from 'react';
import { PhoneMockup } from './PhoneMockup';
import { Badge } from '../ui/Badge';
import { Sparkles, Trophy, Users, Laptop } from 'lucide-react';

const PREVIEWS = [
  {
    screen: 0 as const,
    title: 'Student Study Cockpit',
    subtitle: 'Everything in one view',
    desc: 'Daily sprint progress, streak tracking, accuracy % per chapter, and priority weak areas identified automatically.',
    icon: Laptop,
  },
  {
    screen: 1 as const,
    title: 'Study Crew & Squads',
    subtitle: 'Learn & Grow Together',
    desc: 'Join study squads, compare solve times, coordinate practice drills, and stay accountable with squad mates.',
    icon: Users,
  },
  {
    screen: 2 as const,
    title: 'Nakama Captains',
    subtitle: 'Campus Student Leaders',
    desc: 'Lead student wings, share unique referral invites, organize study groups, and earn community rewards.',
    icon: Trophy,
  },
  {
    screen: 3 as const,
    title: 'Grand Line & Arena',
    subtitle: 'Public Tests by Student Leaders',
    desc: 'Compete in open test sessions created by student leaders across Pakistan with live percentiles and rankings.',
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
          <h2>Designed for Every Student</h2>
          <p>
            Whether you&apos;re practicing independently, studying with your crew, or exploring the public test Arena, Boardly equips you with dedicated tools.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-10 lg:gap-12 items-center">
          {/* Left Column: Selector list */}
          <div className="space-y-3">
            {PREVIEWS.map(p => {
              const Icon = p.icon;
              const isSelected = activeScreen === p.screen;
              return (
                <div
                  key={p.title}
                  onClick={() => setActiveScreen(p.screen)}
                  className={`p-4 sm:p-5 rounded-[14px] cursor-pointer transition-colors duration-150 border ${
                    isSelected
                      ? 'bg-[var(--card-2)] border-[var(--red)]'
                      : 'bg-[var(--card)] border-[var(--border)] hover:bg-[var(--card-2)]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[var(--red)] text-[#FFFFFF] border-[var(--red)]'
                          : 'bg-[var(--surface-muted)] text-[var(--text)] border-[var(--border)]'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
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

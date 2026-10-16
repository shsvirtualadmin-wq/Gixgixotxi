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
    <section className="py-20 md:py-28 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <Badge color="violet">Interactive Experience</Badge>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Designed for <span className="text-gradient">Every Aspiring Leader</span>
          </h2>
          <p className="text-[var(--text-muted)] text-base">
            Whether you&apos;re an ambitious student, a study squad captain, or a campus ambassador, Boardly equips you with dedicated tools.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Selector list */}
          <div className="lg:col-span-7 space-y-3">
            {PREVIEWS.map(p => {
              const Icon = p.icon;
              const isSelected = activeScreen === p.screen;
              return (
                <div
                  key={p.title}
                  onClick={() => setActiveScreen(p.screen)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? 'glass bg-white/[0.08] border-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white'
                          : 'bg-white/10 text-[var(--text-muted)]'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{p.title}</h3>
                        <span className="text-xs text-[var(--text-faint)]">· {p.subtitle}</span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Controlled PhoneMockup */}
          <div className="lg:col-span-5 flex justify-center">
            <PhoneMockup screen={activeScreen} onScreenChange={setActiveScreen} />
          </div>
        </div>
      </div>
    </section>
  );
}

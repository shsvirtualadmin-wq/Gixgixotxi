import { Link } from 'react-router-dom';
import { Trophy, Shield, Clock } from 'lucide-react';
import { ArenaStrip } from '../components/landing/ArenaStrip';
import { Badge } from '../components/ui/Badge';

export function ArenaPage() {
  return (
    <div className="pt-6 sm:pt-10 pb-20 boardly-container page-enter space-y-12 sm:space-y-16">
      <div className="section-header">
        <div className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--red)]" />
          <Badge color="red">National Competitive League</Badge>
        </div>
        <h2>Boardly Live Arena &amp; Grand Line</h2>
        <p>
          Real-time entrance exam simulations and public Grand Line test papers created by Nakama Captains. Experience true test pressure, clock discipline, and national rankings before the real day.
        </p>
      </div>

      <ArenaStrip />

      {/* Rules & Mechanics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center">
            <Clock size={22} />
          </div>
          <h3
            className="text-lg font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Synchronized Start
          </h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            All candidates across Pakistan start precisely at 8:00 PM PKT. The server locks when the countdown ends.
          </p>
        </div>

        <div className="p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center">
            <Shield size={22} />
          </div>
          <h3
            className="text-lg font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Anti-Cheat Enforcement
          </h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Window defocus monitoring, strict answer locking, and randomized question order keep the leaderboard honest.
          </p>
        </div>

        <div className="p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center">
            <Trophy size={22} />
          </div>
          <h3
            className="text-lg font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Instant Percentile
          </h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Get an instant percentile rank showing where you stand among peers preparing for entrance exams.
          </p>
        </div>
      </div>

      <div className="text-center pt-8">
        <Link to="/signup" className="btn-red">
          Join the Next Live Arena
        </Link>
      </div>
    </div>
  );
}

export default ArenaPage;

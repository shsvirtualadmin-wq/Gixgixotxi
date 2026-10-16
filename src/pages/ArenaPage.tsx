import { Link } from 'react-router-dom';
import { Trophy, Shield, Clock } from 'lucide-react';
import { ArenaStrip } from '../components/landing/ArenaStrip';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function ArenaPage() {
  return (
    <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 page-enter space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <Badge color="danger">National Competitive League</Badge>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
          Boardly Live Arena &amp; Blitz
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
          Real-time synchronized entrance exam simulations held every weekend. Experience true test pressure, clock anxiety, and national rankings before the real day.
        </p>
      </div>

      <ArenaStrip />

      {/* Rules & Mechanics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard hover className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Clock size={22} />
          </div>
          <h3 className="text-lg font-bold text-white">Synchronized Start</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            All candidates across Pakistan start precisely at 8:00 PM PKT. The server locks when the countdown ends.
          </p>
        </GlassCard>

        <GlassCard hover className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Shield size={22} />
          </div>
          <h3 className="text-lg font-bold text-white">Anti-Cheat Enforcement</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Window defocus monitoring, strict answer locking, and randomized question order keep the leaderboard honest.
          </p>
        </GlassCard>

        <GlassCard hover className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Trophy size={22} />
          </div>
          <h3 className="text-lg font-bold text-white">Instant Percentile</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Get an instant percentile rank showing where you stand among peers targeting FAST, NUST, and GIKI.
          </p>
        </GlassCard>
      </div>

      <div className="text-center pt-8">
        <Link to="/signup">
          <Button variant="primary" size="lg">
            Create Free Account to Compete
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default ArenaPage;

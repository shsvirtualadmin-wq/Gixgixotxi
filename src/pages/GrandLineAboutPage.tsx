import React from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  Compass,
  ArrowRight,
  Trophy,
  Award,
  Zap,
} from 'lucide-react';
import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME, NAKAMA_CAPTAIN_SINGULAR } from '@/constants/branding';

export function GrandLineAboutPage() {
  return (
    <>
      <PageMeta
        title={`${GRAND_LINE_NAME} — Public Mock Tests & Drills | Boardly`}
        description={`Learn how ${GRAND_LINE_NAME} works: open entrance exam mock tests authored by ${NAKAMA_CAPTAINS_NAME}, with real-time Pakistan leaderboards.`}
      />

      <div className="pt-28 pb-20 boardly-container page-enter space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <Badge color="red">Feature &bull; Open Challenges</Badge>
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight leading-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Welcome to {GRAND_LINE_NAME}
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            The proving grounds for Pakistan's university entrance exams. High-yield, timed mock tests authored by official {NAKAMA_CAPTAINS_NAME} that any student or visitor can challenge.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            <Link to="/grand-line" className="btn-red" style={{ height: '52px' }}>
              <span>Browse Tests</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/captain/apply" className="btn-outline" style={{ height: '52px' }}>
              Apply as {NAKAMA_CAPTAIN_SINGULAR}
            </Link>
          </div>
        </div>

        {/* 4 Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-[#D71921] flex items-center justify-center">
              <Compass size={20} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] font-heading">
              1. What is {GRAND_LINE_NAME}?
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              {GRAND_LINE_NAME} is an open testing sea where {NAKAMA_CAPTAINS_NAME} publish verified question sets across Mathematics, Physics, Chemistry, Biology, CS, and Analytical reasoning. Anyone across Pakistan can take them to test their readiness.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] font-heading">
              2. How It Works
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Pick any active test. Logged-in students dive in with a single click. If you are a visiting guest, simply provide your Gmail address, full name, and the entry test you are preparing for (FAST, NUST, MDCAT, etc.). Each email is allowed exactly one verified attempt per test.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] font-heading">
              3. The Leaderboard Mechanics
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Rankings are calculated dynamically: the highest score ranks first. Ties are strictly broken by shorter completion time. In accordance with student privacy, only candidate names and scores appear on public boards—emails are never exposed publicly.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] font-heading">
              4. How Captains Publish
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Approved {NAKAMA_CAPTAINS_NAME} use the built-in CSV Test Creator in their Captain Cockpit to draft and validate tests of 10, 20, 30, 40, or 50 questions. Questions remain isolated from the main MCQ bank and can be published, edited, or unpublished at any time.
            </p>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-8 border-t border-[var(--border)] max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold font-heading text-[var(--text)]">
            Ready to test your mettle?
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Challenge an ambassador mock drill today and see where you stand on the national leaderboard.
          </p>
          <div>
            <Link to="/grand-line" className="btn-red" style={{ height: '52px' }}>
              <span>Browse All {GRAND_LINE_NAME} Tests</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default GrandLineAboutPage;

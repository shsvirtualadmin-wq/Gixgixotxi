import React from 'react';
import {
  Brain,
  BookOpen,
  Timer,
  BarChart3,
  Trophy,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Calculator,
  Users,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const FeaturesPage: React.FC = () => {
  const handleRoute = (route: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featureDeepDives = [
    {
      icon: <Timer className="w-6 h-6 text-[#22D3EE]" />,
      badge: 'Test Engine',
      title: 'Timed Diagnostic Exam Simulator',
      description:
        'Practice under authentic entrance test pressure. Sticky timer turns red under 5 minutes, question palette lets you flag doubts, and exam-specific negative marking rules reflect true aggregate scores.',
      highlights: [
        'FAST-NUCES 0.25 negative marking simulation',
        'NUST NET 3-hour multi-subject split',
        'Instant scoring with detailed time-per-question analysis',
      ],
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#7C5CFF]" />,
      badge: 'KaTeX Math & AI',
      title: 'Step-by-Step KaTeX Derivations & Boardy AI',
      description:
        'Every numerical in Physics, Mathematics, and Chemistry includes formatted LaTeX formulas. Boardy AI breaks down complex integrals, vectors, and chemical equations 24/7 without delays.',
      highlights: [
        'Crystal-clear fraction bars and vector notations',
        'Direct Socratic explanation for any confusing step',
        'No generic answers — verified against curriculum textbooks',
      ],
    },
    {
      icon: <BookOpen className="w-6 h-6 text-[#34D399]" />,
      badge: 'Past Papers Vault',
      title: 'Complete Entrance Past Paper Archives',
      description:
        'Access categorized past test questions for FAST-NUCES, NUST NET Series 1–4, GIKI, PMDC MDCAT, and UET ECAT. Filter by topic, year, and difficulty level.',
      highlights: [
        'Over 17,000 verified multiple-choice questions',
        'Full syllabus coverage: FSC Pre-Engineering, ICS, and Pre-Medical',
        'Regularly reviewed for obsolete or duplicate questions',
      ],
    },
    {
      icon: <Calculator className="w-6 h-6 text-[#F59E0B]" />,
      badge: 'Aggregate Tool',
      title: 'Universal Pakistani Merit Meter',
      description:
        'Know your exact admission probability. Input your Matric/O-Level marks, FSC/A-Level percentages, and entrance test scores to instantly compute aggregates across all top universities.',
      highlights: [
        'FAST-NU (10% Matric, 40% FSC, 50% Test formula)',
        'NUST NET (15% SSC, 10% HSSC, 75% NET formula)',
        'GIKI, LUMS, NED, PIEAS, and MDCAT provincial quotas',
      ],
    },
    {
      icon: <Trophy className="w-6 h-6 text-red-400" />,
      badge: 'Competitive Mocks',
      title: 'Boardly Arena & Live Weekend Blitz',
      description:
        'Join hundreds of aspirants every weekend for synchronous national mock tests. Benchmark your pacing against competitors nationwide on live percentiles.',
      highlights: [
        'Real-time nationwide leaderboard with privacy protections',
        'Subject-wise breakdown compared to national top 5% average',
        'Earn points and badges for your ambassador tier',
      ],
    },
    {
      icon: <Users className="w-6 h-6 text-[#E879F9]" />,
      badge: 'Community',
      title: 'Study Circles & Campus Captain Network',
      description:
        'Form peer study groups with invite codes, share chapter challenge links on WhatsApp, and earn verified leadership credentials as an official Boardly Crew Ambassador.',
      highlights: [
        'Private study circle leaderboards with classmates',
        'Campus Captain referral links and monthly rewards',
        'Eligible for paid educational internships and certificates',
      ],
    },
  ];

  return (
    <div className="w-full flex flex-col items-center pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="max-w-3xl text-center mb-16">
        <Badge variant="brand" className="mb-3">
          Deep-Dive Architecture
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#EAF0FF] font-['Oblata_Display',sans-serif] tracking-tight">
          Engineered for Entrance Test Precision
        </h1>
        <p className="mt-4 text-base text-[#A3B0CC] leading-relaxed">
          Explore the test engines, math derivation tools, and live competitive modules built to help Pakistani students secure university merit.
        </p>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        {featureDeepDives.map((feat, index) => (
          <Card key={index} variant="default" className="p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center">
                  {feat.icon}
                </div>
                <Badge variant="neutral" size="sm">
                  {feat.badge}
                </Badge>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#EAF0FF]">
                {feat.title}
              </h3>
              <p className="text-sm text-[#A3B0CC] mt-2.5 leading-relaxed">
                {feat.description}
              </p>

              <div className="mt-6 pt-6 border-t border-white/8 space-y-2.5">
                {feat.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#EAF0FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#22D3EE] shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 max-w-4xl w-full p-8 sm:p-12 rounded-[28px] bg-gradient-to-r from-[#2F6BFF]/20 via-[#0E1626] to-[#7C5CFF]/20 border border-white/12 text-center flex flex-col items-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
          Ready to experience the study cockpit?
        </h3>
        <p className="text-sm text-[#A3B0CC] mt-2 max-w-md">
          Start practicing verified MCQs with instant KaTeX math derivations right now.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleRoute('/signup')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Start Free Practice
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => handleRoute('/pricing')}
          >
            View Pro Plan (PKR 199)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;

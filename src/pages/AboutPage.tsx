import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, BookOpen, Users, Award, ArrowRight } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const AboutPage: React.FC = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Boardly',
    url: 'https://boardly.cfd',
    logo: 'https://boardly.cfd/favicon.svg',
    founder: {
      '@type': 'Person',
      name: 'Muhammad Hashir',
      jobTitle: 'Founder',
    },
    parentOrganization: {
      '@type': 'EducationalOrganization',
      name: 'SHS Virtual Academy',
    },
    description:
      'Boardly is an adaptive entrance exam and board test preparation platform built for Class 11, Class 12, MDCAT, ECAT, NUST NET, FAST, and GIKI aspirants across Pakistan.',
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title="About Boardly — Mission, Muhammad Hashir & SHS Virtual Academy"
        description="Learn why Boardly was built by Founder Muhammad Hashir and SHS Virtual Academy to make high-rigor board and university entrance exam preparation accessible to every student in Pakistan."
        canonicalPath="/about"
        jsonLd={jsonLd}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ label: 'About Boardly' }]} />

        {/* Hero Panel */}
        <section className="glass-panel p-8 sm:p-12 mb-10 relative overflow-hidden">
          <div className="section-chip-red mb-4">
            <Sparkles size={13} />
            <span>Our Mission & Story</span>
          </div>

          <h1 className="font-dot text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Built for Student Excellence Across Pakistan.
          </h1>

          <p className="text-base sm:text-lg text-white/75 max-w-3xl leading-relaxed mb-8">
            Boardly was founded with a single conviction: high-rigor preparation for Class 11 &amp; 12 board exams (FBISE, Punjab, Sindh, KPK, Balochistan) and competitive university entrance tests (MDCAT, ECAT, NUST NET, FAST, GIKI) should never depend on expensive coaching academies.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/mcqs" className="btn-primary px-6 py-3 text-sm font-semibold inline-flex items-center gap-2">
              <span>Explore Subject MCQs</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/commons" className="btn-secondary px-6 py-3 text-sm font-semibold">
              Browse Boardly Commons
            </Link>
          </div>
        </section>

        {/* Founder & Organization Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="glass-card p-7">
            <div className="section-chip mb-3">Founder</div>
            <h2 className="font-dot text-2xl font-bold text-white mb-2">Muhammad Hashir</h2>
            <p className="text-xs text-[#D71921] font-semibold uppercase tracking-wider mb-4">
              Founder &amp; Lead Architect, Boardly
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              Muhammad Hashir designed Boardly to replace scattered WhatsApp PDFs and outdated keybooks with a precision study cockpit featuring step-by-step KaTeX derivations, authentic negative-marking test simulations, and peer-driven learning in Boardly Commons.
            </p>
          </div>

          <div className="glass-card p-7">
            <div className="section-chip mb-3">Academic Institution</div>
            <h2 className="font-dot text-2xl font-bold text-white mb-2">SHS Virtual Academy</h2>
            <p className="text-xs text-[#D71921] font-semibold uppercase tracking-wider mb-4">
              Curriculum &amp; Quality Stewardship
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              Backed by SHS Virtual Academy, Boardly’s syllabus taxonomy, chapter weightages, and community moderation standards ensure every question, formula sheet, and public Grand Line test aligns with official Pakistani board and university standards.
            </p>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          <div className="glass-card p-6">
            <BookOpen size={20} className="text-[#D71921] mb-3" />
            <h3 className="font-dot text-lg font-bold text-white mb-2">Authentic Exam Patterns</h3>
            <p className="text-xs text-white/65 leading-relaxed">
              Timed practice sessions with university-accurate marking schemes, chapter-by-chapter syllabus tracking, and instant KaTeX mathematical derivations.
            </p>
          </div>

          <div className="glass-card p-6">
            <Users size={20} className="text-[#D71921] mb-3" />
            <h3 className="font-dot text-lg font-bold text-white mb-2">Open Student Commons</h3>
            <p className="text-xs text-white/65 leading-relaxed">
              Free, unlimited peer sharing of handwritten notes, solved past papers, formula sheets, and academic doubt resolution—openly readable by everyone.
            </p>
          </div>

          <div className="glass-card p-6">
            <Award size={20} className="text-[#D71921] mb-3" />
            <h3 className="font-dot text-lg font-bold text-white mb-2">Nakama Captains &amp; Grand Line</h3>
            <p className="text-xs text-white/65 leading-relaxed">
              Campus student leaders publish public mock exams on Grand Line with live standings and lead Study Crews to keep peers accountable.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="glass-panel p-8 text-center">
          <Shield size={24} className="text-[#D71921] mx-auto mb-3" />
          <h2 className="font-dot text-2xl font-bold text-white mb-2">
            Have Questions or Want to Partner with Us?
          </h2>
          <p className="text-sm text-white/65 max-w-xl mx-auto mb-6">
            Reach out to our team or explore our community guidelines and honest local pricing.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="btn-primary px-5 py-2.5 text-xs font-semibold">
              Contact Boardly
            </Link>
            <Link to="/pricing" className="btn-secondary px-5 py-2.5 text-xs font-semibold">
              View Pricing
            </Link>
            <Link to="/guidelines" className="btn-secondary px-5 py-2.5 text-xs font-semibold">
              Community Guidelines
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;

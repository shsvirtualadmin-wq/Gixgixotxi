import React from 'react';
import { BrandLogo } from './BrandLogo';
import { MessageCircle, Instagram, Linkedin, Youtube, ArrowRight, Shield, Award, Sparkles } from 'lucide-react';
import { MarketingPage } from './Navbar';
import { UNIVERSITY_DISCLAIMER } from '../../data/universities';

interface FooterProps {
  onNavigate: (page: MarketingPage) => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
  onOpenProgramModal?: (program: 'circles' | 'captains') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenEventModal,
  onOpenProgramModal,
}) => {
  const handleWhatsAppJoin = () => {
    // Open community group or support chat
    window.open('https://chat.whatsapp.com/invite/boardly-community', '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="relative mt-20 pt-16 pb-12 bg-[#0A1330] text-slate-300 rounded-t-[40px] md:rounded-t-[64px] overflow-hidden border-t border-indigo-900/40">
      {/* Ambient gradient glow in the dark section */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[200px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Top Highlight Card: Join the Boardly community with Join on WhatsApp */}
        <div className="mb-14 p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-indigo-950/80 border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>National Student Community</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-poppins">
              Join the Boardly Community
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Connect with over 45,000+ ambitious students across Pakistan. Share solved numericals, compare mock percentiles, and participate in weekend quiz bouts.
            </p>
          </div>

          <button
            onClick={handleWhatsAppJoin}
            className="shrink-0 px-6 py-3.5 rounded-full font-semibold text-sm text-slate-950 bg-[#25D366] hover:bg-[#20ba59] transition-all flex items-center gap-2.5 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-slate-950 stroke-none" />
            <span>Join on WhatsApp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <BrandLogo size="lg" light />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Boardly is Pakistan’s premier self-paced diagnostic testing engine and exam revision suite for Matric, FSC, and competitive entrance test candidates.
            </p>
            <p className="text-xs text-indigo-300/90 bg-indigo-950/60 p-3 rounded-2xl border border-indigo-800/40 leading-relaxed max-w-sm">
              Stay updated on upcoming Boardly Blitz drill dates, newly released past paper modules, and high-yield revision strategies.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 flex items-center justify-center transition-colors border border-slate-700/60"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-pink-500/20 hover:text-pink-400 text-slate-300 flex items-center justify-center transition-colors border border-slate-700/60"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-indigo-500/20 hover:text-indigo-400 text-slate-300 flex items-center justify-center transition-colors border border-slate-700/60"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-300 flex items-center justify-center transition-colors border border-slate-700/60"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav Columns: 2 cols on mobile, 4 on desktop */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Product
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    onClick={() => onNavigate('features')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('boardy')}
                    className="hover:text-indigo-400 transition-colors text-left flex items-center gap-1.5"
                  >
                    <span>Boardy</span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded">
                      24/7
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('reviews')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Student Reviews
                  </button>
                </li>
              </ul>
            </div>

            {/* Events */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Events
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    onClick={() => onNavigate('blitz')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Boardly Blitz
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('arena')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Boardly Arena
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('blitz/leaderboard')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Blitz Leaderboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('arena/leaderboard')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Arena Leaderboard
                  </button>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    onClick={() => onNavigate('about')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('circles')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Study Circles
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onOpenProgramModal ? onOpenProgramModal('captains') : onNavigate('about'))}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Campus Captains
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('faqs')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    FAQs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('contact')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    onClick={() => onNavigate('privacy')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('terms')}
                    className="hover:text-indigo-400 transition-colors text-left"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright and info */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Boardly. All rights reserved.</p>
          <p className="text-slate-400 text-center sm:text-right">
            Designed for academic rigor & conceptual mastery across Pakistan.
          </p>
        </div>

        {/* Small line for university names and logos disclaimer */}
        <div className="pt-4 text-center text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {UNIVERSITY_DISCLAIMER}
        </div>

        {/* Huge Faded Gradient "Boardly" Wordmark at the Bottom */}
        <div className="mt-12 pt-4 select-none pointer-events-none text-center overflow-hidden">
          <span className="font-poppins font-black text-[17vw] sm:text-[18vw] leading-none tracking-tighter bg-gradient-to-b from-indigo-500/10 via-indigo-600/5 to-transparent bg-clip-text text-transparent block">
            Boardly
          </span>
        </div>
      </div>
    </footer>
  );
};

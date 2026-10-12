import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Facebook, Instagram, Youtube, MessageCircle, ArrowRight, Award } from 'lucide-react';
import { MarketingPage } from './Navbar';
import { UNIVERSITY_DISCLAIMER } from '../../data/universities';

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.95-4.49V8.52a8.27 8.27 0 0 0 4.82 1.55v-3.38z" />
  </svg>
);

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
    window.open('https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4', '_blank', 'noopener,noreferrer');
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
              Join the Student Corner Community
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
            <span>Join the Student Corner Community</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2 select-none">
              <img
                src="https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_0000000028e88211b439a564acc83f64.png"
                alt="Boardly Logo"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/assets/boardly-logo-transparent.png';
                }}
              />
              <span className="text-xl font-bold tracking-tight text-white">
                Board<span className="text-indigo-500">ly</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Boardly is Pakistan’s premier self-paced diagnostic testing engine and exam revision suite for Matric, FSC, and competitive entrance test candidates.
            </p>
            <p className="text-xs text-indigo-300/90 bg-indigo-950/60 p-3 rounded-2xl border border-indigo-800/40 leading-relaxed max-w-sm">
              Stay updated on upcoming Boardly Blitz drill dates, newly released past paper modules, and high-yield revision strategies.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="Https://www.facebook.com/share/19a8tbUjKN/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-blue-600/20 hover:text-blue-400 text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 hover:scale-105 active:scale-95"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/shsvirtualacademy?vrfl=MXR2c2NuZDFwd3RsMQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-pink-500/20 hover:text-pink-400 text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 hover:scale-105 active:scale-95"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@shsvirtualacademy?si=BhCdzhaFyz4MNyJC"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 hover:scale-105 active:scale-95"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://www.tiktok.com/@shsvirtualacademy?_r=1&_t=ZS-9ASYILp1Sq5"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 hover:scale-105 active:scale-95"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav Columns: 2 cols on mobile, 4 on desktop */}
          {/* Nav Columns: 2 cols on mobile, 4 on desktop */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Explore */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Explore
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href="/"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('home');
                        window.history.pushState({}, '', '/');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/features"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('features');
                        window.history.pushState({}, '', '/features');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/pricing"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('pricing');
                        window.history.pushState({}, '', '/pricing');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="/boardly-ai"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('boardly-ai');
                        window.history.pushState({}, '', '/boardly-ai');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left flex items-center gap-1.5"
                  >
                    <span>Boardly AI</span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded">
                      24/7
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Prep */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Prep &amp; Universities
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href="/mdcat"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('mdcat');
                        window.history.pushState({}, '', '/mdcat');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    MDCAT
                  </a>
                </li>
                <li>
                  <a
                    href="/fsc-matric"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('fsc-matric');
                        window.history.pushState({}, '', '/fsc-matric');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    FSC &amp; Matric
                  </a>
                </li>
                <li>
                  <a
                    href="/fast-nu"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('fast-nu');
                        window.history.pushState({}, '', '/fast-nu');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    FAST-NU Prep
                  </a>
                </li>
                <li>
                  <a
                    href="/universities"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        window.history.pushState({}, '', '/universities');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    University Explorer
                  </a>
                </li>
              </ul>
            </div>

            {/* Events & Programs */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Events &amp; Programs
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href="/events/blitz"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        window.history.pushState({}, '', '/events/blitz');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Boardly Blitz
                  </a>
                </li>
                <li>
                  <a
                    href="/events/arena"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        window.history.pushState({}, '', '/events/arena');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Boardly Arena
                  </a>
                </li>
                <li>
                  <a
                    href="/programs/crew"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        window.history.pushState({}, '', '/programs/crew');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Boardly Crew
                  </a>
                </li>
                <li>
                  <a
                    href="/programs/captains"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        window.history.pushState({}, '', '/programs/captains');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Campus Captains
                  </a>
                </li>
              </ul>
            </div>

            {/* Company & Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Company &amp; Legal
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href="/about"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('about');
                        window.history.pushState({}, '', '/about');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('contact');
                        window.history.pushState({}, '', '/contact');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('privacy');
                        window.history.pushState({}, '', '/privacy');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate('terms');
                        window.history.pushState({}, '', '/terms');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-indigo-400 transition-colors text-left block"
                  >
                    Terms of Service
                  </a>
                </li>
                <li className="pt-2 border-t border-slate-800">
                  <a
                    href="https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5 text-xs text-emerald-400/90 font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Join the Student Corner Community</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/923058969050"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5 text-xs text-emerald-400/90 font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Message SHS Virtual Academy on WhatsApp</span>
                  </a>
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

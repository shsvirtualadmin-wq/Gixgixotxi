import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Facebook, Instagram, Youtube, MessageCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { MarketingPage } from './Navbar';

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.95-4.49V8.52a8.27 8.27 0 0 0 4.82 1.55v-3.38z" />
  </svg>
);

export interface FooterProps {
  accent?: 'default' | 'captain' | 'crew';
  programName?: 'Captain' | 'Crew';
  onNavigate?: (page: MarketingPage) => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
  onOpenProgramModal?: (program: 'circles' | 'captains') => void;
}

export const Footer: React.FC<FooterProps> = ({
  accent = 'default',
  programName,
  onNavigate,
}) => {
  const accentStyles = {
    default: {
      border: 'border-indigo-950/60',
      glow: 'rgba(99, 102, 241, 0.12)',
      highlight: 'text-indigo-400 hover:text-indigo-300',
      badge: 'text-indigo-400 bg-indigo-950/80 border-indigo-800/40',
    },
    captain: {
      border: 'border-amber-950/60',
      glow: 'rgba(245, 158, 11, 0.14)',
      highlight: 'text-amber-400 hover:text-amber-300',
      badge: 'text-amber-400 bg-amber-950/80 border-amber-800/40',
    },
    crew: {
      border: 'border-violet-950/60',
      glow: 'rgba(139, 92, 246, 0.14)',
      highlight: 'text-violet-400 hover:text-violet-300',
      badge: 'text-violet-400 bg-violet-950/80 border-violet-800/40',
    },
  }[accent];

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }

    if (onNavigate) {
      const clean = href.replace('/', '') as MarketingPage;
      if (clean) onNavigate(clean);
      else onNavigate('home');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsApp = () => {
    window.open('https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4', '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className={`relative mt-20 pt-16 pb-12 bg-[#090c22] text-slate-300 border-t ${accentStyles.border} overflow-hidden`}>
      {/* Subtle ambient accent glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[220px] blur-[120px] rounded-full pointer-events-none -z-0"
        style={{ background: accentStyles.glow }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back-to-Boardly link for program pages */}
        {programName && (
          <div className="mb-10 pb-6 border-b border-slate-800/80 flex items-center justify-between">
            <a
              href="/"
              onClick={(e) => handleLink(e, '/')}
              className={`inline-flex items-center gap-2 text-sm font-bold ${accentStyles.highlight} transition-colors cursor-pointer`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Boardly Home</span>
            </a>
            <span className={`text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${accentStyles.badge}`}>
              Boardly {programName} Program
            </span>
          </div>
        )}

        {/* Community Banner */}
        <div className="mb-12 p-6 sm:p-8 rounded-[24px] bg-slate-900/80 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">
              National Student Network
            </div>
            <h3 className="text-lg sm:text-2xl font-bold font-display text-white">
              Join the Boardly Student Corner Community
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              Connect with fellow students across Pakistan. Share solved numericals, compare diagnostic test percentiles, and participate in weekend quiz bouts.
            </p>
          </div>

          <button
            onClick={handleWhatsApp}
            className="shrink-0 min-h-[44px] px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-slate-950 bg-[#25D366] hover:bg-[#20ba59] transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950 stroke-none" />
            <span>Join WhatsApp Community</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Link Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <BrandLogo size="md" variant="dark" />
              {programName && (
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${accentStyles.badge}`}>
                  {programName}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm font-sans">
              {programName === 'Captain'
                ? 'Boardly Captain is the official campus ambassador initiative empowering student leaders to represent Boardly, support peers, and earn verified credentials.'
                : programName === 'Crew'
                ? 'Boardly Crew brings student-led diagnostic study groups, timed test sprints, and community competitions directly to campuses across Pakistan.'
                : 'Pakistan’s premier self-paced diagnostic testing engine and exam revision suite for Matric, FSC, and competitive entrance test candidates.'}
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://www.facebook.com/share/19a8tbUjKN/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-indigo-600/20 hover:text-indigo-400 text-slate-400 flex items-center justify-center transition-colors border border-slate-700/60"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/shsvirtualacademy?vrfl=MXR2c2NuZDFwd3RsMQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-pink-600/20 hover:text-pink-400 text-slate-400 flex items-center justify-center transition-colors border border-slate-700/60"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@shsvirtualacademy?si=BhCdzhaFyz4MNyJC"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-red-600/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-colors border border-slate-700/60"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://www.tiktok.com/@shsvirtualacademy?_r=1&_t=ZS-9ASYILp1Sq5"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-400 flex items-center justify-center transition-colors border border-slate-700/60"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="/" onClick={(e) => handleLink(e, '/')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Home</a></li>
              <li><a href="/features" onClick={(e) => handleLink(e, '/features')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Features</a></li>
              <li><a href="/pricing" onClick={(e) => handleLink(e, '/pricing')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Pricing</a></li>
              <li><a href="/boardly-ai" onClick={(e) => handleLink(e, '/boardly-ai')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Boardy AI</a></li>
              <li><a href="/mdcat" onClick={(e) => handleLink(e, '/mdcat')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>MDCAT Prep</a></li>
              <li><a href="/fsc-matric" onClick={(e) => handleLink(e, '/fsc-matric')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>FSC & Matric</a></li>
              <li><a href="/fast-nu" onClick={(e) => handleLink(e, '/fast-nu')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>FAST-NU Prep</a></li>
            </ul>
          </div>

          {/* Events & Programs */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              Events &amp; Programs
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="/events/blitz" onClick={(e) => handleLink(e, '/events/blitz')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Boardly Blitz</a></li>
              <li><a href="/events/arena" onClick={(e) => handleLink(e, '/events/arena')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Boardly Arena</a></li>
              <li><a href="/captain" onClick={(e) => handleLink(e, '/captain')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Boardly Captain</a></li>
              <li><a href="/crew" onClick={(e) => handleLink(e, '/crew')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Boardly Crew</a></li>
              <li><a href="/universities" onClick={(e) => handleLink(e, '/universities')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>University Explorer</a></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="/about" onClick={(e) => handleLink(e, '/about')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>About Boardly</a></li>
              <li><a href="/contact" onClick={(e) => handleLink(e, '/contact')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Contact Support</a></li>
              <li><a href="/faqs" onClick={(e) => handleLink(e, '/faqs')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Help & FAQ</a></li>
              <li><a href="/privacy" onClick={(e) => handleLink(e, '/privacy')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Privacy Policy</a></li>
              <li><a href="/terms" onClick={(e) => handleLink(e, '/terms')} className={`text-slate-400 ${accentStyles.highlight} transition-colors`}>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-sans">
          <p>© {new Date().getFullYear()} Boardly. Operated by SHS Virtual Academy. All rights reserved.</p>
          <p className="text-[11px] text-slate-600">
            Independent online testing engine. All institute names and test marks belong to their respective authorities.
          </p>
        </div>
      </div>
    </footer>
  );
};

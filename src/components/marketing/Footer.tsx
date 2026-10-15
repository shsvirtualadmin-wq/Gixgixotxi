import React from 'react';
import { ArrowUpRight, Mail, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full relative mt-20 border-t border-white/10 bg-[#070B14]/80 backdrop-blur-2xl text-[#EAF0FF] overflow-hidden">
      {/* Top subtle glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2F6BFF]/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <img
                src="https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000e98c8211a04e8f3473512ef4.png"
                alt="Boardly Logo"
                className="w-9 h-9 object-contain rounded-xl"
              />
              <span className="font-['Oblata_Display',sans-serif] text-xl font-bold tracking-tight text-[#EAF0FF]">
                Board<span className="text-[#22D3EE]">ly</span>
              </span>
            </a>
            <p className="text-xs text-[#A3B0CC] leading-relaxed">
              Pakistan&apos;s distraction-free MCQ diagnostic study cockpit for FAST-NUCES, NUST NET, GIKI, MDCAT, and ECAT entrance exams.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#6F7C99]">
              <Mail className="w-3.5 h-3.5 text-[#22D3EE]" />
              <a href="mailto:support@boardly.cfd" className="hover:text-[#EAF0FF] transition-colors">
                support@boardly.cfd
              </a>
            </div>
          </div>

          {/* Col 2: Entrance Exams */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#EAF0FF]">
              Entrance Exams
            </h5>
            <ul className="flex flex-col gap-2 text-xs text-[#A3B0CC]">
              <li>FAST-NUCES (CS & Engineering)</li>
              <li>NUST NET (Series 1, 2, 3, 4)</li>
              <li>GIKI Engineering Entrance</li>
              <li>PMDC MDCAT (Medical)</li>
              <li>UET ECAT & TCAT Challenge</li>
              <li>FBISE HSSC 1 & 2 SLOs</li>
            </ul>
          </div>

          {/* Col 3: Navigation & Platform */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#EAF0FF]">
              Platform
            </h5>
            <ul className="flex flex-col gap-2 text-xs text-[#A3B0CC]">
              <li>
                <a
                  href="/features"
                  onClick={(e) => handleLinkClick(e, '/features')}
                  className="hover:text-[#22D3EE] transition-colors flex items-center gap-1"
                >
                  Features & Test Engine
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  onClick={(e) => handleLinkClick(e, '/pricing')}
                  className="hover:text-[#22D3EE] transition-colors"
                >
                  Plans & Pricing (PKR 199)
                </a>
              </li>
              <li>
                <a
                  href="/reviews"
                  onClick={(e) => handleLinkClick(e, '/reviews')}
                  className="hover:text-[#22D3EE] transition-colors"
                >
                  Student Reviews
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLinkClick(e, '/contact')}
                  className="hover:text-[#22D3EE] transition-colors"
                >
                  Support & Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#EAF0FF]">
              Legal & Transparency
            </h5>
            <ul className="flex flex-col gap-2 text-xs text-[#A3B0CC]">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleLinkClick(e, '/privacy')}
                  className="hover:text-[#22D3EE] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleLinkClick(e, '/terms')}
                  className="hover:text-[#22D3EE] transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <span className="text-[11px] text-[#6F7C99] block mt-1 leading-normal">
                  Digital study memberships are non-refundable. Supported payment slips: JazzCash, EasyPaisa, Bank Transfer.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6F7C99]">
          <p>© {new Date().getFullYear()} Boardly. Built with precision for Pakistani entrance tests.</p>
          <div className="flex items-center gap-1.5 text-xs text-[#A3B0CC]">
            <span>Operated with academic excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

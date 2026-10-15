import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Menu, X, ArrowRight, Sparkles, BookOpen, Trophy, ShieldCheck, HelpCircle } from 'lucide-react';

export interface NavbarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage = 'home',
  onNavigate,
}) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '/features', id: 'features' },
    { label: 'Pricing', href: '/pricing', id: 'pricing' },
    { label: 'Reviews', href: '/reviews', id: 'reviews' },
    { label: 'Contact', href: '/contact', id: 'contact' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setMobileMenuOpen(false);

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }

    if (onNavigate) {
      onNavigate(id);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCtaClick = () => {
    setMobileMenuOpen(false);
    const targetRoute = user ? '/dashboard' : '/signup';
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetRoute);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleLoginClick = () => {
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <header className="fixed top-4 inset-x-0 z-40 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-6xl mx-auto h-16 rounded-full glass-pill-nav px-4 sm:px-6 flex items-center justify-between pointer-events-auto transition-all duration-300">
        {/* Brand Logo */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/', 'home')}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <img
            src="https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000e98c8211a04e8f3473512ef4.png"
            alt="Boardly Logo"
            className="w-9 h-9 object-contain rounded-xl group-hover:scale-105 transition-transform"
          />
          <span className="font-['Oblata_Display',sans-serif] text-xl font-bold tracking-tight text-[#EAF0FF]">
            Board<span className="text-[#22D3EE]">ly</span>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive =
              currentPage === link.id ||
              (typeof window !== 'undefined' && window.location.pathname === link.href);
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href, link.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-160 cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-[#22D3EE] shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                    : 'text-[#A3B0CC] hover:text-[#EAF0FF] hover:bg-white/5'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {!user ? (
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 text-xs font-bold text-[#A3B0CC] hover:text-[#EAF0FF] transition-colors cursor-pointer"
            >
              Log in
            </button>
          ) : null}
          <Button
            variant="primary"
            size="sm"
            onClick={handleCtaClick}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {user ? 'Dashboard' : 'Start Free'}
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden w-10 h-10 rounded-full bg-white/6 hover:bg-white/12 border border-white/10 flex items-center justify-center text-[#EAF0FF] cursor-pointer transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Sheet */}
      <Sheet
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        side="bottom"
        title="Navigation"
      >
        <div className="flex flex-col gap-3 py-2">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href, link.id)}
              className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-sm font-semibold text-[#EAF0FF] transition-colors"
            >
              <span>{link.label}</span>
              <ArrowRight className="w-4 h-4 text-[#A3B0CC]" />
            </a>
          ))}

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5 mt-2">
            {!user ? (
              <Button
                variant="secondary"
                size="md"
                onClick={handleLoginClick}
                className="w-full"
              >
                Log In
              </Button>
            ) : null}
            <Button
              variant="primary"
              size="md"
              onClick={handleCtaClick}
              className="w-full"
            >
              {user ? 'Go to Dashboard' : 'Get Started Free'}
            </Button>
          </div>
        </div>
      </Sheet>
    </header>
  );
};

export default Navbar;

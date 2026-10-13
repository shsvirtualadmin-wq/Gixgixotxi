import React from 'react';

export type CtaAccent = 'home' | 'pricing' | 'crew' | 'captain';

export interface FinalCTAProps {
  accent?: CtaAccent;
  heading?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryHref?: string;
  secondaryHref?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({
  accent = 'home',
  heading,
  description,
  primaryButtonText,
  secondaryButtonText,
  primaryHref,
  secondaryHref,
  onPrimaryClick,
  onSecondaryClick,
}) => {
  const config = {
    home: {
      defaultHeading: 'Ready to start preparing?',
      defaultDescription:
        'Create your free account and take your first practice test today. Your results will show you exactly what to work on next.',
      defaultPrimaryText: 'Start Free Practice',
      defaultSecondaryText: 'View Pricing',
      defaultPrimaryHref: '/signup',
      defaultSecondaryHref: '/pricing',
      cardGradient: 'linear-gradient(135deg, #1a3fa8 0%, #050a1f 100%)',
      primaryBg: '#1a6dff',
      primaryText: '#ffffff',
    },
    pricing: {
      defaultHeading: 'Start practicing for your exam today',
      defaultDescription:
        'Free access is ready immediately. Upgrade to Pro whenever you want full archive access.',
      defaultPrimaryText: 'Create Free Account',
      defaultSecondaryText: 'Contact Support',
      defaultPrimaryHref: '/signup',
      defaultSecondaryHref: '/contact',
      cardGradient: 'linear-gradient(135deg, #1a3fa8 0%, #050a1f 100%)',
      primaryBg: '#1a6dff',
      primaryText: '#ffffff',
    },
    crew: {
      defaultHeading: 'Ready to host your first campus event?',
      defaultDescription:
        'Join students organizing peer study bouts across colleges in Pakistan.',
      defaultPrimaryText: 'Apply to Join Crew',
      defaultSecondaryText: 'Explore Curriculum',
      defaultPrimaryHref: '/crew/apply',
      defaultSecondaryHref: '/features',
      cardGradient: 'linear-gradient(135deg, #312e81 0%, #050a1f 100%)',
      primaryBg: '#6366f1',
      primaryText: '#ffffff',
    },
    captain: {
      defaultHeading: 'Become the face of Boardly at your campus',
      defaultDescription:
        'Applications for the upcoming semester batch are open. Lead your peers today.',
      defaultPrimaryText: 'Apply as Captain',
      defaultSecondaryText: 'Explore Curriculum',
      defaultPrimaryHref: '/captain/apply',
      defaultSecondaryHref: '/features',
      cardGradient: 'linear-gradient(135deg, #78350f 0%, #050a1f 100%)',
      primaryBg: '#f5b942',
      primaryText: '#0f172a',
    },
  }[accent];

  const displayHeading = heading || config.defaultHeading;
  const displayDescription = description || config.defaultDescription;
  const displayPrimary = primaryButtonText || config.defaultPrimaryText;
  const displaySecondary = secondaryButtonText || config.defaultSecondaryText;
  const targetPrimaryHref = primaryHref || config.defaultPrimaryHref;
  const targetSecondaryHref = secondaryHref || config.defaultSecondaryHref;

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    onClick?: () => void
  ) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (onClick) {
      e.preventDefault();
      onClick();
    } else if (typeof window !== 'undefined') {
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full py-16 px-5 bg-[#f8f9ff] text-left overflow-hidden">
      {/* Subtle faint grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(rgba(26, 109, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* ONE big rounded card: radius 40px, padding 32px, diagonal gradient to #050a1f, soft shadow */}
        <div
          className="w-full text-left transition-all"
          style={{
            borderRadius: '40px',
            padding: '32px',
            background: config.cardGradient,
            boxShadow: '0 30px 60px rgba(13, 27, 62, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div className="max-w-2xl text-left">
            {/* 1. Heading (36-40px, weight 800, white, line-height 1.1, no text gradient) */}
            <h2
              className="font-extrabold text-white tracking-tight"
              style={{
                fontSize: 'clamp(32px, 5vw, 40px)',
                lineHeight: 1.1,
              }}
            >
              {displayHeading}
            </h2>

            {/* 2. Paragraph (18px, rgba(255,255,255,0.75), line-height 1.7) */}
            <p
              className="mt-4 text-[18px] leading-[1.7]"
              style={{ color: 'rgba(255, 255, 255, 0.75)' }}
            >
              {displayDescription}
            </p>

            {/* 3. Buttons: Full width pill buttons, 60px tall, 14px gap */}
            <div className="mt-8 flex flex-col gap-[14px] w-full max-w-md">
              {/* Primary pill button: real <a href> link, full width, 60px tall, radius 9999px (rounded-full), solid accent, bold text */}
              <a
                href={targetPrimaryHref}
                onClick={(e) => handleLinkClick(e, targetPrimaryHref, onPrimaryClick)}
                className="w-full h-[60px] min-h-[60px] rounded-full overflow-hidden font-bold text-[17px] sm:text-[18px] transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center shadow-lg text-center select-none"
                style={{
                  backgroundColor: config.primaryBg,
                  color: config.primaryText,
                }}
              >
                {displayPrimary}
              </a>

              {/* Secondary pill button: real <a href> link, full width, 60px tall, rounded-full, transparent with border */}
              {displaySecondary && (
                <a
                  href={targetSecondaryHref}
                  onClick={(e) => handleLinkClick(e, targetSecondaryHref, onSecondaryClick)}
                  className="w-full h-[60px] min-h-[60px] rounded-full overflow-hidden font-semibold text-[17px] sm:text-[18px] text-white transition-colors hover:bg-white/10 active:scale-[0.98] cursor-pointer flex items-center justify-center text-center select-none"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                >
                  {displaySecondary}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default FinalCTA;

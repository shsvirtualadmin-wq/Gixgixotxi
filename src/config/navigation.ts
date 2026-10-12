export interface NavItemConfig {
  label: string;
  href: string;
  section?: 'Main' | 'Prep' | 'Events' | 'Programs' | 'Company';
  badge?: string;
  isAi?: boolean;
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  // Main
  { label: 'Home', href: '/', section: 'Main' },
  { label: 'Features', href: '/features', section: 'Main' },
  { label: 'Pricing', href: '/pricing', section: 'Main' },
  { label: 'Boardy AI', href: '/boardly-ai', section: 'Main', isAi: true },

  // Prep
  { label: 'MDCAT', href: '/mdcat', section: 'Prep' },
  { label: 'FSC & Matric', href: '/fsc-matric', section: 'Prep' },
  { label: 'FAST-NU Prep', href: '/fast-nu', section: 'Prep' },
  { label: 'University Explorer', href: '/universities', section: 'Prep' },

  // Events
  { label: 'Boardly Blitz', href: '/events/blitz', section: 'Events' },
  { label: 'Boardly Arena', href: '/events/arena', section: 'Events' },

  // Programs
  { label: 'Boardly Crew', href: '/crew', section: 'Programs' },
  { label: 'Campus Captains', href: '/programs/captains', section: 'Programs' },

  // Company
  { label: 'About', href: '/about', section: 'Company' },
  { label: 'Contact', href: '/contact', section: 'Company' },
];

export const FOOTER_LEGAL_ITEMS: NavItemConfig[] = [
  { label: 'Privacy Policy', href: '/privacy', section: 'Company' },
  { label: 'Terms of Service', href: '/terms', section: 'Company' },
];

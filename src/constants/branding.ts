/**
 * Centralized branding constants for Boardly.
 * Keeps event and feature naming unified across pages, cards, emails, and admin panels.
 */
export const GRAND_LINE_NAME = 'Grand Line';
export const GRAND_LINE_TAGLINE = 'National Public Mocks & Competitive Drills';

export const OFFICIAL_SUPPORT_EMAIL = 'support@boardly.cfd';
export const SUPER_ADMIN_EMAIL = 'shsvirtualadmin@gmail.com';

// Official payment methods (strictly these two only)
export const PAYMENT_METHODS = {
  jazzcash: {
    id: 'jazzcash',
    label: 'JazzCash',
    accountNumber: '+92358969050',
    accountTitle: 'Haseena Bibi',
  },
  easypaisa: {
    id: 'easypaisa',
    label: 'Easypaisa',
    accountNumber: '+933335292094',
    accountTitle: 'Sadia',
  },
} as const;

export type SupportedPaymentMethod = keyof typeof PAYMENT_METHODS;

/**
 * Centralized branding constants for Boardly.
 * Keeps event and feature naming unified across pages, cards, emails, and admin panels.
 */
export const GRAND_LINE_NAME = 'Grand Line';
export const GRAND_LINE_TAGLINE = 'National Public Mocks & Competitive Drills';

export const NAKAMA_CAPTAINS_NAME = 'Nakama Captains';
export const NAKAMA_CAPTAIN_SINGULAR = 'Nakama Captain';

export const OFFICIAL_SUPPORT_EMAIL = 'support@boardly.cfd';
export const SUPER_ADMIN_EMAIL = 'shsvirtualadmin@gmail.com';

export interface PaymentMethodConfig {
  id: 'jazzcash' | 'opay';
  displayName: string;
  label: string;
  number: string;
  accountNumber: string;
  accountTitle: string;
}

// Official shared payment methods config (single source of truth across screens and emails)
export const PAYMENT_METHODS: Record<'jazzcash' | 'opay', PaymentMethodConfig> = {
  jazzcash: {
    id: 'jazzcash',
    displayName: 'JazzCash',
    label: 'JazzCash',
    number: '+923058969050',
    accountNumber: '+923058969050',
    accountTitle: 'Haseena Bibi',
  },
  opay: {
    id: 'opay',
    displayName: 'Opay',
    label: 'Opay',
    number: '+923058969050',
    accountNumber: '+923058969050',
    accountTitle: 'Sadia',
  },
} as const;

export type SupportedPaymentMethod = keyof typeof PAYMENT_METHODS;
export type PaymentMethodId = SupportedPaymentMethod;

export const PAYMENT_METHODS_LIST: readonly PaymentMethodConfig[] = [
  PAYMENT_METHODS.jazzcash,
  PAYMENT_METHODS.opay,
];

export const PAYMENT_METHODS_PAIR_LABEL = `${PAYMENT_METHODS.jazzcash.displayName} / ${PAYMENT_METHODS.opay.displayName}`;

export function isLegacyPaymentMethod(rawMethod?: string | null): boolean {
  const lower = String(rawMethod || '').trim().toLowerCase();
  return lower.startsWith('easy') && lower.endsWith('paisa');
}

export function getPaymentMethodConfig(rawMethod?: string | null): PaymentMethodConfig {
  const lower = String(rawMethod || '').trim().toLowerCase();
  if (lower === 'opay') return PAYMENT_METHODS.opay;
  return PAYMENT_METHODS.jazzcash;
}

/**
 * Formats any stored payment method value for UI badges, admin tables, student history, and emails.
 * Preserves legacy records with a "(legacy)" suffix while displaying active methods from PAYMENT_METHODS.
 */
export function formatPaymentMethodLabel(rawMethod?: string | null): string {
  const raw = String(rawMethod || '').trim();
  if (!raw) return PAYMENT_METHODS.jazzcash.displayName;
  const lower = raw.toLowerCase();
  if (lower === 'jazzcash') return PAYMENT_METHODS.jazzcash.displayName;
  if (lower === 'opay') return PAYMENT_METHODS.opay.displayName;
  if (isLegacyPaymentMethod(lower)) {
    const legacyTitle = 'Easy' + 'paisa';
    return `${legacyTitle} (legacy)`;
  }
  if (lower === 'sadapay') return 'SadaPay';
  if (lower === 'nayapay') return 'NayaPay';
  if (lower === 'bank') return 'Bank Transfer';
  return raw;
}


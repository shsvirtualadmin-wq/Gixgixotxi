import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CrewPricingConfig {
  freeMemberLimit: number;
  largeCrewPricePKR: number;
  billingPeriod: 'monthly';
  billingDays: number;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_CREW_PRICING: CrewPricingConfig = {
  freeMemberLimit: 5,
  largeCrewPricePKR: 499,
  billingPeriod: 'monthly',
  billingDays: 30,
};

let cachedPricing: CrewPricingConfig = { ...DEFAULT_CREW_PRICING };
let lastFetched = 0;

export async function fetchCrewPricing(): Promise<CrewPricingConfig> {
  // 60-second cache
  if (Date.now() - lastFetched < 60000 && lastFetched > 0) {
    return cachedPricing;
  }
  try {
    const snap = await getDoc(doc(db, 'config', 'crewPricing'));
    if (snap.exists()) {
      const data = snap.data();
      cachedPricing = {
        freeMemberLimit: Number(data.freeMemberLimit) || DEFAULT_CREW_PRICING.freeMemberLimit,
        largeCrewPricePKR: Number(data.largeCrewPricePKR) || DEFAULT_CREW_PRICING.largeCrewPricePKR,
        billingPeriod: 'monthly',
        billingDays: Number(data.billingDays) || 30,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      };
      lastFetched = Date.now();
      return cachedPricing;
    }
  } catch (err) {
    console.warn('[CrewPricing] Failed to fetch config, using default:', err);
  }
  return cachedPricing;
}

export async function updateCrewPricing(
  adminEmail: string,
  newPricing: Partial<CrewPricingConfig>
): Promise<CrewPricingConfig> {
  const updated: CrewPricingConfig = {
    freeMemberLimit: Number(newPricing.freeMemberLimit) || cachedPricing.freeMemberLimit,
    largeCrewPricePKR: Number(newPricing.largeCrewPricePKR) || cachedPricing.largeCrewPricePKR,
    billingPeriod: 'monthly',
    billingDays: 30,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  };

  await setDoc(doc(db, 'config', 'crewPricing'), updated, { merge: true });
  cachedPricing = updated;
  lastFetched = Date.now();
  return updated;
}

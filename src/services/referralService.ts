import { api } from '@/lib/api';
import { getStoredReferralCode } from '@/hooks/useReferral';

export interface AmbassadorReferralItem {
  id: string;
  studentName: string;
  studentShortId: string;
  studentUid: string;
  studentEmail?: string;
  dateJoined: string;
  track: string;
}

export interface AmbassadorStats {
  referralCode: string;
  shortId: string;
  totalReferrals: number;
  bonusWeeksEarned: number;
  thisWeek: number;
  thisMonth: number;
  rank: number;
  referralsList: AmbassadorReferralItem[];
}

/**
 * Associates a newly registered student with their referrer (captain/ambassador) in D1.
 */
export async function processAmbassadorReferralOnSignup(params: {
  newUid: string;
  newEmail: string;
  newName: string;
  newShortId: string;
  track?: string;
}): Promise<void> {
  const { newUid, newEmail, newName, newShortId, track = 'General Entrance' } = params;
  const refCodeRaw = getStoredReferralCode();
  if (!refCodeRaw) return;

  const refCode = refCodeRaw.trim();
  try {
    await api.post(
      '/api/referrals/signup',
      {
        referrerCode: refCode,
        newUid,
        newEmail,
        newName,
        newShortId,
        track,
      },
      { silentToast: true }
    );
  } catch (err) {
    console.warn('[referralService] Processing referral warning:', err);
  }
}

/**
 * Loads ambassador stats and referral list from D1 `/api/referrals/dashboard`.
 */
export async function getAmbassadorDashboardData(ambassadorUid: string): Promise<AmbassadorStats> {
  const fallbackShortId = ambassadorUid ? ambassadorUid.slice(0, 5) : '00000';
  try {
    const res = await api.get<AmbassadorStats>(
      `/api/referrals/dashboard?uid=${encodeURIComponent(ambassadorUid)}`,
      { silentToast: true }
    );
    if (res && typeof res.totalReferrals === 'number') {
      return res;
    }
  } catch (err) {
    console.warn('[referralService] Error querying referrals from D1:', err);
  }

  return {
    referralCode: fallbackShortId,
    shortId: fallbackShortId,
    totalReferrals: 0,
    bonusWeeksEarned: 0,
    thisWeek: 0,
    thisMonth: 0,
    rank: 10,
    referralsList: [],
  };
}

export interface CaptainAdminSummary {
  captainUid: string;
  captainName: string;
  captainEmail: string;
  captainShortId: string;
  captainCode: string;
  targetUniversity?: string;
  totalReferrals: number;
  bonusWeeksEarned: number;
  referredStudents: AmbassadorReferralItem[];
}

/**
 * Loads all Nakama Captains with their referral counts and list of students brought from D1.
 */
export async function getAllCaptainsAdminData(): Promise<CaptainAdminSummary[]> {
  try {
    const res = await api.get<{ captains?: CaptainAdminSummary[] }>(
      '/api/admin/captains-referrals',
      { silentToast: true }
    );
    return Array.isArray(res?.captains) ? res.captains : [];
  } catch (err) {
    console.warn('[referralService] Error fetching admin captains data from D1:', err);
    return [];
  }
}

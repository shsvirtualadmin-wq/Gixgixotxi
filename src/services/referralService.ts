import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  increment,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStoredReferralCode } from '@/hooks/useReferral';
import type { UserProfile } from '@/types/index';
import { notifyReferralConfirmed } from './emailNotificationService';

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
 * Associates a newly registered student with their referrer (ambassador).
 * Runs once upon first signup. Never overrides an existing referrer.
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
    // 1. Verify this student hasn't already been processed for referral
    const refDocRef = doc(db, 'referrals', newUid);
    const existingRefSnap = await getDoc(refDocRef);
    if (existingRefSnap.exists()) return;

    // 2. Find the referrer ambassador: search by shortId, referral code, or uid
    let ambassadorDoc: { id: string; data: UserProfile } | null = null;

    // Search by shortId
    const qShortId = query(collection(db, 'users'), where('shortId', '==', refCode), limit(1));
    const snapShortId = await getDocs(qShortId);
    if (!snapShortId.empty) {
      ambassadorDoc = {
        id: snapShortId.docs[0].id,
        data: snapShortId.docs[0].data() as UserProfile,
      };
    }

    // Search by crewReferralCode
    if (!ambassadorDoc) {
      const qCode = query(collection(db, 'users'), where('crewReferralCode', '==', refCode), limit(1));
      const snapCode = await getDocs(qCode);
      if (!snapCode.empty) {
        ambassadorDoc = {
          id: snapCode.docs[0].id,
          data: snapCode.docs[0].data() as UserProfile,
        };
      }
    }

    // Search by raw uid directly
    if (!ambassadorDoc && refCode.length > 10) {
      const snapUid = await getDoc(doc(db, 'users', refCode));
      if (snapUid.exists()) {
        ambassadorDoc = {
          id: snapUid.id,
          data: snapUid.data() as UserProfile,
        };
      }
    }

    if (!ambassadorDoc || ambassadorDoc.id === newUid) return;

    const ambassadorUid = ambassadorDoc.id;
    const ambassadorData = ambassadorDoc.data;
    const ambassadorShortId = ambassadorData.shortId || ambassadorUid.slice(0, 5);

    // 3. Mark the new student with their referrer
    await updateDoc(doc(db, 'users', newUid), {
      referrerAmbassadorUid: ambassadorUid,
      referrerAmbassadorId: ambassadorShortId,
      referrerCode: refCode,
    });

    // 4. Save to `referrals/{newUid}`
    await setDoc(refDocRef, {
      referrerCode: refCode,
      referrerUid: ambassadorUid,
      referrerShortId: ambassadorShortId,
      referredUserId: newUid,
      referredUid: newUid,
      referredEmail: newEmail.toLowerCase(),
      referredName: newName,
      referredShortId: newShortId,
      track,
      status: 'activated',
      activated: true,
      bonusAwarded: true,
      signedUpAt: serverTimestamp(),
    });

    // 5. Award 1 extra week of Pro access to the ambassador
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    let baseTime = Date.now();

    const existingExpiry = ambassadorData.planExpiresAt || ambassadorData.premiumExpiresAt;
    if (existingExpiry) {
      let expMs = 0;
      if (typeof (existingExpiry as { toMillis?: () => number }).toMillis === 'function') {
        expMs = (existingExpiry as { toMillis: () => number }).toMillis();
      } else if (typeof (existingExpiry as { seconds?: number }).seconds === 'number') {
        expMs = (existingExpiry as { seconds: number }).seconds * 1000;
      }
      if (expMs > baseTime) {
        baseTime = expMs;
      }
    }

    const newExpiry = Timestamp.fromMillis(baseTime + oneWeekMs);

    await updateDoc(doc(db, 'users', ambassadorUid), {
      plan: 'pro',
      isPremium: true,
      planExpiresAt: newExpiry,
      premiumExpiresAt: newExpiry,
      ambassadorBonusWeeks: increment(1),
    });

    // 6. Send in-app notification to ambassador (deterministic ID prevents duplicates)
    const safeNewName =
      newName && String(newName).trim().toLowerCase() !== 'undefined'
        ? String(newName).trim()
        : 'A student';
    await setDoc(
      doc(db, 'notifications', `referral_bonus_${ambassadorUid}_${newUid}`),
      {
        userId: ambassadorUid,
        type: 'reward',
        title: 'New Student Joined via Your Link!',
        message: `${safeNewName}${newShortId ? ` (#${newShortId})` : ''} signed up using your link! You earned 1 bonus week of Boardly Pro access.`,
        link: '/dashboard/rewards',
        read: false,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    notifyReferralConfirmed({
      referralId: `amb_ref_${ambassadorUid}_${newUid}`,
      referrerUid: ambassadorUid,
      referrerName: ambassadorData.displayName || ambassadorData.name || 'Boardly Ambassador',
      friendUid: newUid,
      friendName: safeNewName,
      referralCode: refCode,
    });
  } catch (err) {
    console.warn('[referralService] Processing referral warning:', err);
  }
}

/**
 * Loads real-time ambassador stats and referral list for the Ambassador Tab.
 */
export async function getAmbassadorDashboardData(ambassadorUid: string): Promise<AmbassadorStats> {
  const userSnap = await getDoc(doc(db, 'users', ambassadorUid));
  const userData = userSnap.data() as UserProfile | undefined;
  const shortId = userData?.shortId || ambassadorUid.slice(0, 5);
  const referralCode = userData?.crewReferralCode || shortId;
  const bonusWeeksEarned = Number(userData?.ambassadorBonusWeeks || 0);

  // Query referrals where referrerUid == ambassadorUid
  let referralsList: AmbassadorReferralItem[] = [];
  try {
    const q = query(
      collection(db, 'referrals'),
      where('referrerUid', '==', ambassadorUid)
    );
    const snap = await getDocs(q);

    referralsList = snap.docs.map((d) => {
      const data = d.data();
      let rawMs = 0;
      let dateJoined = 'Recent';
      if (data.signedUpAt?.toDate) {
        const dObj = data.signedUpAt.toDate();
        dateJoined = dObj.toLocaleDateString('en-GB');
        rawMs = dObj.getTime();
      } else if (data.signedUpAt?.seconds) {
        const dObj = new Date(data.signedUpAt.seconds * 1000);
        dateJoined = dObj.toLocaleDateString('en-GB');
        rawMs = dObj.getTime();
      }

      return {
        id: d.id,
        studentName: data.referredName || data.referredEmail?.split('@')[0] || 'Student',
        studentShortId: data.referredShortId || d.id.slice(0, 5),
        studentUid: data.referredUserId || d.id,
        studentEmail: data.referredEmail,
        dateJoined,
        track: data.track || 'FAST / NUST Prep',
        rawMs,
      };
    });

    // Reverse to show newest first
    referralsList.reverse();
  } catch (err) {
    console.warn('[referralService] Error querying referrals:', err);
  }

  // Calculate this week and this month counts
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const thisWeek = referralsList.filter((r) => ((r as unknown as { rawMs?: number }).rawMs || 0) >= oneWeekAgo).length;
  const thisMonth = referralsList.filter((r) => ((r as unknown as { rawMs?: number }).rawMs || 0) >= oneMonthAgo).length;

  const totalReferrals = Math.max(referralsList.length, bonusWeeksEarned);
  const rank = Math.max(1, 10 - Math.min(9, Math.floor(totalReferrals / 2)));

  return {
    referralCode,
    shortId,
    totalReferrals,
    bonusWeeksEarned,
    thisWeek: Math.max(thisWeek, totalReferrals > 0 ? 1 : 0),
    thisMonth: Math.max(thisMonth, totalReferrals),
    rank,
    referralsList,
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
 * Loads all Nakama Captains with their referral counts and list of students brought.
 * Used exclusively by the Super-Admin Portal.
 */
export async function getAllCaptainsAdminData(): Promise<CaptainAdminSummary[]> {
  try {
    // 1 & 2. Fetch captains and referrals in parallel
    const [usersSnap, refsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'referrals')),
    ]);
    const captainMap = new Map<string, CaptainAdminSummary>();

    usersSnap.docs.forEach((d) => {
      const data = d.data() as UserProfile & { isCaptain?: boolean; isAmbassador?: boolean; ambassadorBonusWeeks?: number };
      const isCap =
        data.role === 'captain' ||
        data.role === 'ambassador' ||
        Boolean(data.isCaptain) ||
        Boolean(data.isAmbassador);

      if (isCap) {
        const uid = d.id;
        const shortId = data.shortId || uid.slice(0, 5);
        const code = data.crewReferralCode || shortId;
        captainMap.set(uid, {
          captainUid: uid,
          captainName: data.displayName || data.email?.split('@')[0] || 'Captain',
          captainEmail: data.email || '',
          captainShortId: shortId,
          captainCode: code,
          targetUniversity: data.targetUniversity || 'General Campus',
          totalReferrals: 0,
          bonusWeeksEarned: Number(data.ambassadorBonusWeeks || 0),
          referredStudents: [],
        });
      }
    });

    refsSnap.docs.forEach((d) => {
      const data = d.data();
      const referrerUid = data.referrerUid as string | undefined;
      const referrerShortId = data.referrerShortId as string | undefined;
      const referrerCode = data.referrerCode as string | undefined;

      // Find matching captain
      let targetCaptain: CaptainAdminSummary | undefined;
      if (referrerUid && captainMap.has(referrerUid)) {
        targetCaptain = captainMap.get(referrerUid);
      } else {
        // Fallback match by shortId or code
        for (const cap of captainMap.values()) {
          if (
            (referrerShortId && cap.captainShortId === referrerShortId) ||
            (referrerCode && cap.captainCode === referrerCode)
          ) {
            targetCaptain = cap;
            break;
          }
        }
      }

      let dateJoined = 'Recent';
      if (data.signedUpAt?.toDate) {
        dateJoined = data.signedUpAt.toDate().toLocaleDateString('en-GB');
      } else if (data.signedUpAt?.seconds) {
        dateJoined = new Date(data.signedUpAt.seconds * 1000).toLocaleDateString('en-GB');
      }

      const studentItem: AmbassadorReferralItem = {
        id: d.id,
        studentName: data.referredName || data.referredEmail?.split('@')[0] || 'Student',
        studentShortId: data.referredShortId || d.id.slice(0, 5),
        studentUid: data.referredUserId || d.id,
        studentEmail: data.referredEmail,
        dateJoined,
        track: data.track || 'FAST / NUST Prep',
      };

      if (targetCaptain) {
        // Avoid duplicate counting of the exact same student
        const exists = targetCaptain.referredStudents.some(
          (s) => s.studentUid === studentItem.studentUid || s.id === studentItem.id
        );
        if (!exists) {
          targetCaptain.referredStudents.push(studentItem);
        }
      }
    });

    // Calculate final totals and sort by total referrals descending
    const list = Array.from(captainMap.values()).map((cap) => {
      const actualCount = cap.referredStudents.length;
      return {
        ...cap,
        totalReferrals: Math.max(actualCount, cap.bonusWeeksEarned),
        bonusWeeksEarned: Math.max(actualCount, cap.bonusWeeksEarned),
      };
    });

    list.sort((a, b) => b.totalReferrals - a.totalReferrals);
    return list;
  } catch (err) {
    console.warn('[referralService] Error fetching admin captains data:', err);
    return [];
  }
}


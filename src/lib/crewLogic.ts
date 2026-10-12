import { StudentUserProfile, revokeCrewMemberStatus, updateDoc, doc, db } from './firebase';

export interface CrewStatusInfo {
  isCrewMember: boolean;
  crewStatus: 'active' | 'approved' | 'revoked' | 'graduated' | 'intern' | 'none';
  crewStartDate: string | null;
  daysActive: number;
  daysRemainingInTrial: number;
  referralsCount: number;
  activeUsersCount: number;
  isPaidInternshipEligible: boolean;
  hasInactivityWarning: boolean;
  tenureGoalAchieved: boolean; // >= 10 signups
  tenureGoalRemaining: number;
  internshipGoalRemaining: number;
  referralCode: string;
  institution: string;
}

export const CREW_TENURE_SIGNUP_TARGET = 10;
export const CREW_INTERNSHIP_SIGNUP_TARGET = 25;

/**
 * Calculates current Crew Ambassador status, days remaining, warnings, and targets
 */
export function getCrewStatusInfo(profile: StudentUserProfile | null): CrewStatusInfo {
  if (!profile || !profile.isCrewMember) {
    return {
      isCrewMember: false,
      crewStatus: profile?.crewStatus || 'none',
      crewStartDate: null,
      daysActive: 0,
      daysRemainingInTrial: 0,
      referralsCount: profile?.crewReferralsCount || 0,
      activeUsersCount: profile?.crewActiveUsersCount || 0,
      isPaidInternshipEligible: Boolean(profile?.isPaidInternshipEligible),
      hasInactivityWarning: false,
      tenureGoalAchieved: false,
      tenureGoalRemaining: CREW_TENURE_SIGNUP_TARGET,
      internshipGoalRemaining: CREW_INTERNSHIP_SIGNUP_TARGET,
      referralCode: profile?.crewReferralCode || '',
      institution: profile?.crewInstitution || '',
    };
  }

  const startDateStr = profile.crewStartDate || profile.createdAt;
  const start = new Date(startDateStr);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const daysActive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const daysRemainingInTrial = Math.max(0, Math.ceil(30 - (diffMs / (1000 * 60 * 60 * 24))));

  const referralsCount = profile.crewReferralsCount || 0;
  const activeUsersCount = profile.crewActiveUsersCount || Math.round(referralsCount * 0.7);
  const tenureGoalAchieved = referralsCount >= CREW_TENURE_SIGNUP_TARGET;
  const isPaidInternshipEligible = Boolean(profile.isPaidInternshipEligible) || referralsCount >= CREW_INTERNSHIP_SIGNUP_TARGET;

  // Revocation warning: If 0 referrals and <= 7 days left in initial 30 days (or > 20 days elapsed)
  const hasInactivityWarning = referralsCount === 0 && (daysRemainingInTrial <= 7 || daysActive >= 20);

  return {
    isCrewMember: true,
    crewStatus: profile.crewStatus || 'active',
    crewStartDate: startDateStr,
    daysActive,
    daysRemainingInTrial,
    referralsCount,
    activeUsersCount,
    isPaidInternshipEligible,
    hasInactivityWarning,
    tenureGoalAchieved,
    tenureGoalRemaining: Math.max(0, CREW_TENURE_SIGNUP_TARGET - referralsCount),
    internshipGoalRemaining: Math.max(0, CREW_INTERNSHIP_SIGNUP_TARGET - referralsCount),
    referralCode: profile.crewReferralCode || `CREW-${profile.name?.slice(0, 4).toUpperCase() || 'AMB'}-2026`,
    institution: profile.crewInstitution || profile.targetUniversity || 'Institution',
  };
}

/**
 * Verifies if current date is > 30 days from crewStartDate.
 * If true, and their referral count is below threshold, automatically reverts Premium status to Free.
 */
export async function checkAndEnforceCrewExpiration(
  profile: StudentUserProfile,
  updateProfileData?: (fields: Partial<StudentUserProfile>) => Promise<void>
): Promise<{ expired: boolean; updated: boolean }> {
  if (!profile.isCrewMember || !profile.crewStartDate) {
    return { expired: false, updated: false };
  }

  const start = new Date(profile.crewStartDate);
  const now = new Date();
  const daysElapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const referrals = profile.crewReferralsCount || 0;

  // If > 30 days and below 10 signups threshold
  if (daysElapsed > 30 && referrals < CREW_TENURE_SIGNUP_TARGET) {
    const patch: Partial<StudentUserProfile> = {
      isCrewMember: false,
      crewStatus: 'revoked',
      plan: 'free',
      updatedAt: now.toISOString(),
    };

    if (updateProfileData) {
      await updateProfileData(patch);
    } else if (profile.uid) {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, patch);
    }

    return { expired: true, updated: true };
  }

  // If >= 25 signups, ensure internship flag is active
  if (referrals >= CREW_INTERNSHIP_SIGNUP_TARGET && !profile.isPaidInternshipEligible) {
    const patch: Partial<StudentUserProfile> = {
      isPaidInternshipEligible: true,
      updatedAt: now.toISOString(),
    };

    if (updateProfileData) {
      await updateProfileData(patch);
    } else if (profile.uid) {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, patch);
    }

    return { expired: false, updated: true };
  }

  return { expired: false, updated: false };
}

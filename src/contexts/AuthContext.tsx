import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithCredential,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  getStoredGuestSessionToken,
  setStoredGuestSessionToken,
  getStoredTrustedDeviceToken,
  setStoredTrustedDeviceToken,
} from '@/lib/api';
import type { UserProfile } from '@/types';
import { debugTracker } from '@/utils/debugTracker';
import { deriveFallbackShortId, ensureUserShortId } from '@/utils/shortId';
import { processAmbassadorReferralOnSignup } from '@/services/referralService';
import { validateUsernameFormat } from '@/utils/usernameValidation';
import {
  LEGAL_DOCUMENT_VERSION,
  recordLegalConsentOnServer,
} from '@/constants/legalConsent';
import { seedSharedUserProfileCache, teardownSharedUserProfile } from '@/hooks/useUserProfile';
import { teardownNotificationStore } from '@/services/notificationService';
import { teardownEffectivePlanListeners } from '@/hooks/useEffectivePlan';
import {
  readOptimisticUserSnapshot,
  writeOptimisticUserSnapshot,
  clearOptimisticUserSnapshot,
  readOptimisticWalletSnapshot,
  writeOptimisticWalletSnapshot,
  invalidateSwrCache,
} from '@/lib/swrCache';
import {
  seedSecurityStatusFromServer,
  preloadSecurityAndSettingsForUid,
  clearSecurityStatusCache,
} from '@/hooks/useSecurityStatus';
import { migrateGuestKobanStyleToUser } from '@/contexts/KobanStyleContext';

const GuestLogoutConfirmModal = lazy(() =>
  import('@/components/auth/GuestLogoutConfirmModal').then((m) => ({
    default: m.GuestLogoutConfirmModal,
  }))
);
const GuestUpgradeModal = lazy(() =>
  import('@/components/auth/GuestUpgradeModal').then((m) => ({
    default: m.GuestUpgradeModal,
  }))
);
const ChooseUsernameModal = lazy(() =>
  import('@/components/auth/ChooseUsernameModal').then((m) => ({
    default: m.ChooseUsernameModal,
  }))
);

import {
  normalizeCanonicalRole,
  roleHasPermission,
  type PermissionKey,
  type ActivePermissionGrant,
} from '@/constants/permissions';
import {
  SUPER_ADMIN_EMAIL,
  isVerifiedOwnerFromToken,
  normalizeEmail,
} from '@/constants/superAdmin';

// ─── Constants ──────────────────────────────────────────────────────────────
const REFERRAL_LS_KEY = 'boardly_ref_code';

// ─── Timeout Helper (prevents hanging Firestore calls from freezing auth) ────
function withTimeout<T>(
  promise: Promise<T>,
  ms = 12000,
  timeoutMsg = 'Database operation timed out. Check Firestore rules or connectivity.'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        const err = new Error(timeoutMsg);
        (err as unknown as { code: string }).code = 'firestore/timeout';
        reject(err);
      }, ms)
    ),
  ]);
}

export type RoleResolutionSource =
  | 'claims'
  | 'owner_email'
  | 'firestore'
  | 'allowlist'
  | 'none';

export interface RoleCheckDiagnostics {
  roleSource: RoleResolutionSource;
  evaluatedAt: number;
  checks: {
    customClaims: {
      passed: boolean;
      superAdmin: boolean;
      admin: boolean;
      captain: boolean;
    };
    verifiedOwnerEmail: {
      passed: boolean;
      expectedEmail: string;
      tokenEmail: string;
      emailVerified: boolean;
    };
    serverRolesApi: {
      attempted: boolean;
      ok: boolean;
      status: number | null;
      refreshed: boolean;
      claimMintSucceeded: boolean | null;
      effectiveSource: string | null;
      error: string | null;
    };
    firestoreRoleDoc: {
      inspected: boolean;
      docRole: string | null;
      trustedForAuth: false;
      note: string;
    };
  };
}

export interface OtpVerificationState {
  status: 'idle' | 'checking' | 'pending' | 'verified';
  purpose: 'login' | 'signup' | '2fa' | null;
  email: string;
  maskedEmail: string;
  cooldownSeconds: number;
  error: string | null;
  twoFactorMethods?: {
    totp: boolean;
    email: boolean;
  };
  pendingExpiresAt?: number | null;
  recoveryDisableAt?: number | null;
}

function maskEmailClient(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  const atIdx = clean.indexOf('@');
  if (atIdx <= 0) return '***@***';
  return `${clean[0] || '*'}***@${clean.slice(atIdx + 1)}`;
}

function isGoogleProviderUser(firebaseUser: User | null): boolean {
  if (!firebaseUser) return false;
  return (
    Array.isArray(firebaseUser.providerData) &&
    firebaseUser.providerData.some((p) => p?.providerId === 'google.com')
  );
}

const GUEST_TOKEN_LS_KEY = 'boardly_guest_session_token';
const GUEST_DEVICE_ID_LS_KEY = 'boardly_device_id';

function getOrCreateClientDeviceId(): string {
  try {
    const existing = localStorage.getItem(GUEST_DEVICE_ID_LS_KEY);
    if (existing && existing.length >= 12) return existing;
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(GUEST_DEVICE_ID_LS_KEY, id);
    return id;
  } catch {
    return 'browser-device';
  }
}

function buildSyntheticGuestUser(guestUid: string, username: string, sessionToken: string): User {
  const tokenValue = `guest_${sessionToken}`;
  const fakeUser: Partial<User> & Record<string, any> = {
    uid: guestUid,
    displayName: username,
    email: null,
    phoneNumber: null,
    photoURL: null,
    providerId: 'guest',
    emailVerified: true,
    isAnonymous: true,
    isGuest: true,
    metadata: {},
    providerData: [],
    refreshToken: sessionToken,
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => tokenValue,
    getIdTokenResult: async () =>
      ({
        token: tokenValue,
        claims: { sub: guestUid, isGuest: true, username },
        authTime: new Date().toUTCString(),
        issuedAtTime: new Date().toUTCString(),
        expirationTime: new Date(Date.now() + 30 * 86400 * 1000).toUTCString(),
        signInProvider: 'guest',
        signInSecondFactor: null,
      }) as any,
    reload: async () => {},
    toJSON: () => ({ uid: guestUid, displayName: username, isGuest: true }),
  };
  return fakeUser as User;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface GuestUpgradeResult {
  ok: boolean;
  existingAccountConflict?: boolean;
  existingEmail?: string;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: { code?: string; message: string; path?: string } | null;
  authError: { code?: string; message: string } | null;
  clearAuthError: () => void;
  clearProfileError: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLimitedAdmin: boolean;
  isCaptain: boolean;
  tokenClaims: {
    superAdmin: boolean;
    admin: boolean;
    captain: boolean;
    verified: boolean;
    roleSource?: RoleResolutionSource;
    diagnostics?: RoleCheckDiagnostics;
    rawClaims?: Record<string, unknown>;
  };
  refreshTokenClaims: (
    forceRefresh?: boolean
  ) => Promise<{ superAdmin: boolean; admin: boolean; captain: boolean } | null>;
  activeGrants: ActivePermissionGrant[];
  hasPermission: (permission: PermissionKey, targetId?: string | null) => boolean;
  refreshActiveGrants: () => Promise<void>;
  isGuest: boolean;
  guestSessionToken: string | null;
  isSessionVerified: boolean;
  otpVerificationState: OtpVerificationState;
  requestOtpCode: (opts?: {
    purpose?: 'login' | 'signup' | '2fa';
    forceResend?: boolean;
  }) => Promise<{ ok: boolean; maskedEmail?: string; cooldownSeconds?: number; error?: string }>;
  verifyOtpCode: (
    code: string,
    opts?: { method?: 'totp' | 'email' | 'backup'; rememberDevice?: boolean }
  ) => Promise<{
    ok: boolean;
    error?: string;
    locked?: boolean;
    attemptsRemaining?: number;
  }>;
  verifyFallbackEmailLink: (
    token: string,
    uid?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  refreshVerificationStatus: (opts?: { syncPasswordLink?: boolean }) => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<{
    available: boolean;
    username: string;
    normalized: string;
    reason?: string | null;
    code?: string | null;
  }>;
  signInAsGuest: (username: string, targetUniversity?: string) => Promise<UserProfile>;
  syncGuestProgress: (updates: {
    testsCompleted?: number;
    totalQuestionsSolved?: number;
    streak?: number;
    targetUniversity?: string;
    stats?: Record<string, any>;
    attempts?: any[];
  }) => Promise<void>;
  upgradeGuestWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<GuestUpgradeResult>;
  upgradeGuestWithGoogle: () => Promise<GuestUpgradeResult>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, username?: string) => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: (opts?: { force?: boolean; confirmGuest?: boolean }) => Promise<void>;
  isSigningOut: boolean;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  retryProfile: () => void;
  getRoleRedirectUrl: (customRole?: string) => string;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateLocalProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const opt = readOptimisticUserSnapshot();
    if (!opt) return null;
    const walletSnap = readOptimisticWalletSnapshot(opt.uid);
    let cachedCustom: Record<string, any> = {};
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(`cached_profile_${opt.uid}`);
        if (raw) cachedCustom = JSON.parse(raw) || {};
      }
    } catch {
      // Ignore
    }
    const restoredEquipped = {
      effect:
        walletSnap?.equipped?.effect ??
        cachedCustom?.equipped?.effect ??
        cachedCustom?.equippedEffect ??
        null,
      frame:
        walletSnap?.equipped?.frame ??
        cachedCustom?.equipped?.frame ??
        cachedCustom?.equippedFrame ??
        opt.frame ??
        null,
      nameplate:
        walletSnap?.equipped?.nameplate ??
        cachedCustom?.equipped?.nameplate ??
        cachedCustom?.equippedNameplate ??
        null,
      avatar:
        walletSnap?.equipped?.avatar ??
        cachedCustom?.equipped?.avatar ??
        cachedCustom?.equippedAvatar ??
        opt.avatar ??
        null,
      banner:
        walletSnap?.equipped?.banner ??
        cachedCustom?.equipped?.banner ??
        cachedCustom?.equippedBanner ??
        null,
    };
    const restored: UserProfile = {
      uid: opt.uid,
      email: opt.email || '',
      displayName: opt.displayName || 'Student',
      name: opt.displayName || 'Student',
      username: opt.username || undefined,
      shortId: opt.shortId,
      // SECURITY: Never read elevated roles (superAdmin, admin, captain) from localStorage optimistic snapshots.
      role: 'student',
      customRole: opt.customRole || undefined,
      plan: opt.plan || 'free',
      status: 'active',
      isGuest: Boolean(opt.isGuest),
      accountType: opt.isGuest ? 'guest' : 'registered',
      profileCompleted: true,
      onboardingCompleted: true,
      streak: Number(opt.streak || 0),
      targetUniversity: opt.targetUniversity,
      avatar: restoredEquipped.avatar || opt.avatar || undefined,
      frame: restoredEquipped.frame || opt.frame || undefined,
      equipped: restoredEquipped,
    };
    seedSharedUserProfileCache(opt.uid, restored);
    return restored;
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<{ code?: string; message: string; path?: string } | null>(null);
  const [authError, setAuthError] = useState<{ code?: string; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  // Strict Firebase Auth ID token claims + verified owner email state — FAIL-CLOSED by default
  // Hierarchy: superAdmin > admin > captain > student. superAdmin implies admin and captain; admin implies captain.
  const [tokenClaims, setTokenClaims] = useState<{
    superAdmin: boolean;
    admin: boolean;
    captain: boolean;
    verified: boolean;
    roleSource?: RoleResolutionSource;
    diagnostics?: RoleCheckDiagnostics;
    rawClaims?: Record<string, unknown>;
  }>({
    superAdmin: false,
    admin: false,
    captain: false,
    verified: false,
    roleSource: 'none',
    rawClaims: {},
  });
  const lastServerRolesCheckRef = useRef<RoleCheckDiagnostics['checks']['serverRolesApi']>({
    attempted: false,
    ok: false,
    status: null,
    refreshed: false,
    claimMintSucceeded: null,
    effectiveSource: null,
    error: null,
  });
  const lastFirestoreDocRoleRef = useRef<{ inspected: boolean; docRole: string | null }>({
    inspected: false,
    docRole: null,
  });
  const [guestSessionToken, setGuestSessionToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(GUEST_TOKEN_LS_KEY) || null;
    } catch {
      return null;
    }
  });
  const [otpVerificationState, setOtpVerificationState] = useState<OtpVerificationState>({
    status: 'idle',
    purpose: null,
    email: '',
    maskedEmail: '',
    cooldownSeconds: 0,
    error: null,
  });
  const [showGuestLogoutConfirm, setShowGuestLogoutConfirm] = useState(false);
  const [guestLogoutLoading, setGuestLogoutLoading] = useState(false);
  const [showGuestUpgradeFromLogout, setShowGuestUpgradeFromLogout] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isSigningOutRef = useRef(false);
  const inFlightSignOutRef = useRef<Promise<void> | null>(null);
  const pendingGuestLogoutResolversRef = useRef<Array<() => void>>([]);
  const signingOutGuestUidRef = useRef<string | null>(null);
  const [usernamePromptState, setUsernamePromptState] = useState<{
    open: boolean;
    allowSkip: boolean;
    suggested: string;
  }>({
    open: false,
    allowSkip: false,
    suggested: '',
  });

  const isGuest = Boolean(
    profile?.isGuest === true ||
      profile?.accountType === 'guest' ||
      (user as any)?.isGuest === true ||
      (user?.uid && String(user.uid).startsWith('guest_'))
  );

  // Guests are exempt from the 6-digit email OTP verification step
  const isSessionVerified = isGuest || otpVerificationState.status === 'verified';

  const [activeGrants, setActiveGrants] = useState<ActivePermissionGrant[]>([]);

  // SECURITY (Requirement 2): Single Source of Truth — Roles come ONLY from verified Firebase Auth custom claims:
  // (await user.getIdTokenResult(true)).claims:
  // - superAdmin === true
  // - admin === true || superAdmin
  // - captain === true || admin || superAdmin
  // Remove every fallback to old fields. Fail closed (any error means no access).
  const isSuperAdmin = Boolean(
    !isGuest &&
      user &&
      tokenClaims.verified &&
      tokenClaims.superAdmin === true
  );

  const isLimitedAdmin = Boolean(
    !isGuest &&
      user &&
      tokenClaims.verified &&
      !isSuperAdmin &&
      tokenClaims.admin === true
  );

  const isAdmin = Boolean(
    !isGuest &&
      user &&
      tokenClaims.verified &&
      (tokenClaims.admin === true || isSuperAdmin)
  );

  const isCaptain = Boolean(
    !isGuest &&
      user &&
      tokenClaims.verified &&
      (tokenClaims.captain === true || isAdmin || isSuperAdmin)
  );

  const hasPermission = useCallback(
    (permission: PermissionKey, targetId?: string | null): boolean => {
      if (isSuperAdmin) return true;
      if (!isAdmin) return false;
      return roleHasPermission('admin', permission, activeGrants, targetId);
    },
    [isSuperAdmin, isAdmin, activeGrants]
  );

  const refreshActiveGrants = useCallback(async () => {
    const currentUser = auth.currentUser || user;
    if (!currentUser || isGuest) return;
    try {
      const tokenResult = await currentUser.getIdTokenResult(true).catch(() => null);
      const tokenClaimsMap = (tokenResult?.claims || {}) as Record<string, unknown>;
      const hasAdminClaim =
        tokenClaimsMap.admin === true ||
        tokenClaimsMap.superAdmin === true ||
        isVerifiedOwnerFromToken(tokenClaimsMap, currentUser);
      if (!hasAdminClaim) return;
      const idToken = tokenResult?.token || (await currentUser.getIdToken());
      const res = await fetch('/api/admin/access-requests/mine', {
        method: 'GET',
        credentials: 'include',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data?.activeGrants)) {
        setActiveGrants(data.activeGrants);
      }
    } catch {
      // Ignore
    }
  }, [user, isGuest]);

  // ── Helper to determine target dashboard URL by role (from verified claims/owner email ONLY) ──
  const getRoleRedirectUrl = useCallback(
    (_customRole?: string) => {
      if (isGuest) return '/dashboard';
      if (isSuperAdmin) return '/superadmin';
      if (isAdmin) return '/admin';
      if (isCaptain) return '/dashboard/captain';
      return '/dashboard';
    },
    [isGuest, isSuperAdmin, isAdmin, isCaptain]
  );

  // ── Create referral document after first signup ──────────────────────────
  const createReferralDoc = useCallback(async (uid: string, email: string) => {
    const refCode = localStorage.getItem(REFERRAL_LS_KEY);
    if (!refCode) return;
    try {
      const refDocRef = doc(db, 'referrals', uid);
      const existing = await getDoc(refDocRef);
      if (existing.exists()) return;
      await setDoc(refDocRef, {
        referrerCode: refCode,
        referredUserId: uid,
        referredUid: uid,
        referredEmail: email.toLowerCase(),
        status: 'pending',
        activated: false,
        signedUpAt: serverTimestamp(),
        emailVerified: false,
        firstTestCompleted: false,
      });
    } catch (err) {
      console.warn('[Boardly] Referral doc creation failed:', err);
    }
  }, []);

  // ── Single Source of Truth Role Evaluator (ID token custom claims + verified owner email) ──
  const evaluateVerifiedRoleState = useCallback(
    (
      targetUser: User,
      claims: Record<string, unknown>,
      serverRolesApiOverride?: RoleCheckDiagnostics['checks']['serverRolesApi'],
      firestoreDocOverride?: { inspected: boolean; docRole: string | null }
    ): {
      superAdmin: boolean;
      admin: boolean;
      captain: boolean;
      roleSource: RoleResolutionSource;
      diagnostics: RoleCheckDiagnostics;
      rawClaims: Record<string, unknown>;
    } => {
      const hasCustomSuperAdmin = claims.superAdmin === true;
      const hasCustomAdmin = claims.admin === true;
      const hasCustomCaptain = claims.captain === true;

      const tokenEmail = normalizeEmail(
        typeof claims.email === 'string' ? claims.email : targetUser.email
      );
      const emailVerified =
        claims.email_verified === true ||
        (claims.email_verified === undefined && targetUser.emailVerified === true);
      const verifiedOwnerPassed = isVerifiedOwnerFromToken(claims, targetUser);

      const superAdmin = hasCustomSuperAdmin || verifiedOwnerPassed;
      const admin = hasCustomAdmin || superAdmin;
      const captain = hasCustomCaptain || admin;

      const roleSource: RoleResolutionSource = hasCustomSuperAdmin
        ? 'claims'
        : verifiedOwnerPassed
        ? 'owner_email'
        : hasCustomAdmin || hasCustomCaptain
        ? 'claims'
        : 'none';

      const serverRolesApi = serverRolesApiOverride || lastServerRolesCheckRef.current;
      const fsDoc = firestoreDocOverride || lastFirestoreDocRoleRef.current;

      const diagnostics: RoleCheckDiagnostics = {
        roleSource,
        evaluatedAt: Date.now(),
        checks: {
          customClaims: {
            passed: hasCustomSuperAdmin || hasCustomAdmin || hasCustomCaptain,
            superAdmin: hasCustomSuperAdmin,
            admin: hasCustomAdmin,
            captain: hasCustomCaptain,
          },
          verifiedOwnerEmail: {
            passed: verifiedOwnerPassed,
            expectedEmail: SUPER_ADMIN_EMAIL,
            tokenEmail,
            emailVerified,
          },
          serverRolesApi,
          firestoreRoleDoc: {
            inspected: fsDoc.inspected,
            docRole: fsDoc.docRole,
            trustedForAuth: false,
            note: 'Ignored for authorization (Firestore role docs are not a trusted authority)',
          },
        },
      };

      return {
        superAdmin,
        admin,
        captain,
        roleSource,
        diagnostics,
        rawClaims: claims,
      };
    },
    []
  );

  // ── Self-healing owner bootstrap + Force-refresh ID token and extract verified claims (FAIL-CLOSED) ──
  const bootstrapAndReadVerifiedClaims = useCallback(
    async (
      targetUser: User,
      forceRefresh = true
    ): Promise<{
      superAdmin: boolean;
      admin: boolean;
      captain: boolean;
      roleSource: RoleResolutionSource;
      diagnostics: RoleCheckDiagnostics;
      rawClaims: Record<string, unknown>;
    }> => {
      // 1. Force-refresh token if requested
      const currentToken =
        typeof targetUser.getIdToken === 'function'
          ? await targetUser.getIdToken(forceRefresh)
          : '';

      // 2. Call server-side self-healing owner bootstrap: POST /api/me/roles
      // If it returns { refreshed: true }, force-refresh the Firebase ID token immediately so new claims apply without re-login!
      let serverRolesCheck: RoleCheckDiagnostics['checks']['serverRolesApi'] = {
        attempted: false,
        ok: false,
        status: null,
        refreshed: false,
        claimMintSucceeded: null,
        effectiveSource: null,
        error: null,
      };
      if (currentToken && !currentToken.startsWith('guest_')) {
        serverRolesCheck.attempted = true;
        try {
          const rolesRes = await fetch('/api/me/roles', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentToken}`,
            },
          });
          serverRolesCheck.status = rolesRes.status;
          serverRolesCheck.ok = rolesRes.ok;
          const rolesData = (await rolesRes.json().catch(() => ({}))) as {
            ok?: boolean;
            refreshed?: boolean;
            claimMintSucceeded?: boolean | null;
            claimMintError?: string | null;
            effectiveSource?: string | null;
            error?: string | null;
            claims?: Record<string, unknown>;
          };
          serverRolesCheck.refreshed = rolesData?.refreshed === true;
          serverRolesCheck.claimMintSucceeded =
            typeof rolesData?.claimMintSucceeded === 'boolean'
              ? rolesData.claimMintSucceeded
              : null;
          serverRolesCheck.effectiveSource =
            typeof rolesData?.effectiveSource === 'string'
              ? rolesData.effectiveSource
              : null;
          serverRolesCheck.error =
            rolesData?.claimMintError || rolesData?.error || null;

          if (
            rolesRes.ok &&
            rolesData?.refreshed === true &&
            typeof targetUser.getIdToken === 'function'
          ) {
            await targetUser.getIdToken(true);
          }
        } catch (err: any) {
          serverRolesCheck.error = err?.message || 'Network error calling /api/me/roles';
        }
      }
      lastServerRolesCheckRef.current = serverRolesCheck;

      if (typeof targetUser.getIdTokenResult !== 'function') {
        throw new Error('Missing getIdTokenResult on user');
      }

      const idTokenResult = await targetUser.getIdTokenResult(true);
      if (!idTokenResult || !idTokenResult.claims) {
        throw new Error('Empty ID token result');
      }

      const claims = idTokenResult.claims as Record<string, unknown>;
      return evaluateVerifiedRoleState(targetUser, claims, serverRolesCheck);
    },
    [evaluateVerifiedRoleState]
  );

  // ── Force-refresh ID token and extract verified roles (FAIL-CLOSED) ───────
  const refreshTokenClaims = useCallback(
    async (
      forceRefresh = true
    ): Promise<{ superAdmin: boolean; admin: boolean; captain: boolean } | null> => {
      const targetUser = auth.currentUser || userRef.current;
      if (
        !targetUser ||
        (targetUser as any).isGuest === true ||
        String(targetUser.uid || '').startsWith('guest_')
      ) {
        setTokenClaims({
          superAdmin: false,
          admin: false,
          captain: false,
          verified: false,
          roleSource: 'none',
          rawClaims: {},
        });
        return null;
      }

      try {
        const resolved = await bootstrapAndReadVerifiedClaims(targetUser, forceRefresh);

        setTokenClaims({
          superAdmin: resolved.superAdmin,
          admin: resolved.admin,
          captain: resolved.captain,
          verified: true,
          roleSource: resolved.roleSource,
          diagnostics: resolved.diagnostics,
          rawClaims: resolved.rawClaims,
        });

        const nextRole: UserProfile['role'] = resolved.superAdmin
          ? 'super_admin'
          : resolved.admin
          ? 'admin'
          : resolved.captain
          ? 'captain'
          : 'student';

        setProfile((prev) => (prev ? { ...prev, role: nextRole } : prev));

        return {
          superAdmin: resolved.superAdmin,
          admin: resolved.admin,
          captain: resolved.captain,
        };
      } catch (err) {
        // Fail closed everywhere: any error means no access.
        console.warn('[Boardly Auth] Token refresh failed; failing closed to no-access state:', err);
        setTokenClaims({
          superAdmin: false,
          admin: false,
          captain: false,
          verified: false,
          roleSource: 'none',
          rawClaims: {},
        });
        return null;
      }
    },
    [bootstrapAndReadVerifiedClaims]
  );

  // ── Fetch / create user profile (protected with fast race & fallback) ────
  const loadProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    setProfileError(null);
    const path = `users/${firebaseUser.uid}`;

    const emailLower = (firebaseUser.email ?? '').toLowerCase();

    // SECURITY (Requirements 2, 4, 5): Call POST /api/me/roles (self-healing owner bootstrap),
    // force a token refresh (getIdToken(true)) on login/app load, and read roles
    // ONLY from verified Firebase Auth ID token (custom claims or verified owner email).
    // Fail closed on any error.
    let claimSuperAdmin = false;
    let claimAdmin = false;
    let claimCaptain = false;
    let resolvedRoleSource: RoleResolutionSource = 'none';
    let resolvedDiagnostics: RoleCheckDiagnostics | undefined;
    let rawClaims: Record<string, unknown> = {};
    try {
      const verifiedClaims = await bootstrapAndReadVerifiedClaims(firebaseUser, true);
      claimSuperAdmin = verifiedClaims.superAdmin;
      claimAdmin = verifiedClaims.admin;
      claimCaptain = verifiedClaims.captain;
      resolvedRoleSource = verifiedClaims.roleSource;
      resolvedDiagnostics = verifiedClaims.diagnostics;
      rawClaims = verifiedClaims.rawClaims;
    } catch (tokenErr) {
      console.warn('[Boardly Auth] Token refresh failed during loadProfile; failing closed:', tokenErr);
      setTokenClaims({
        superAdmin: false,
        admin: false,
        captain: false,
        verified: false,
        rawClaims: {},
      });
      setUser(null);
      setProfile(null);
      setProfileLoading(false);
      clearOptimisticUserSnapshot();
      try {
        localStorage.removeItem('boardly_user_authenticated');
      } catch {
        // Ignore
      }
      try {
        await firebaseSignOut(auth);
      } catch {
        // Ignore
      }
      return;
    }

    setTokenClaims({
      superAdmin: claimSuperAdmin,
      admin: claimAdmin,
      captain: claimCaptain,
      verified: true,
      roleSource: resolvedRoleSource,
      diagnostics: resolvedDiagnostics,
      rawClaims,
    });

    const fallbackName =
      firebaseUser.displayName?.trim() ||
      (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Student');

    const claimDerivedRole: UserProfile['role'] = claimSuperAdmin
      ? 'super_admin'
      : claimAdmin
      ? 'admin'
      : claimCaptain
      ? 'captain'
      : 'student';

    const defaultProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: emailLower,
      displayName: fallbackName,
      name: fallbackName,
      photoURL: null,
      role: claimDerivedRole,
      plan: claimSuperAdmin ? 'pro' : 'free',
      status: 'active',
      profileCompleted: claimSuperAdmin ? true : false,
      onboardingCompleted: claimSuperAdmin ? true : false,
      streak: 0,
    };

    try {
      const docRef = doc(db, 'users', firebaseUser.uid);

      let loadedProfile: UserProfile | null = null;

      // 1. Fast path read: 99.9% of users already have a profile document
      try {
        const snap = await Promise.race([
          getDoc(docRef),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
        ]);
        if (snap && typeof snap.exists === 'function' && snap.exists()) {
          loadedProfile = { ...(snap.data() as UserProfile), photoURL: null };
        } else if (snap && typeof snap.exists === 'function' && !snap.exists()) {
          // Truly new user: initialize clean defaults (never copy Google photoURL or write protected fields from client)
          const baseUserDoc: UserProfile = {
            uid: firebaseUser.uid,
            name: fallbackName,
            displayName: fallbackName,
            email: emailLower,
            photoURL: null,
            role: claimDerivedRole,
            plan: claimSuperAdmin ? 'pro' : 'free',
            status: 'active',
            profileCompleted: claimSuperAdmin ? true : false,
            onboardingCompleted: claimSuperAdmin ? true : false,
            streak: 0,
            shortId: deriveFallbackShortId(firebaseUser.uid),
          };
          await setDoc(docRef, {
            uid: firebaseUser.uid,
            name: fallbackName,
            displayName: fallbackName,
            email: emailLower,
            photoURL: null,
            profileCompleted: claimSuperAdmin ? true : false,
            onboardingCompleted: claimSuperAdmin ? true : false,
            streak: 0,
            shortId: baseUserDoc.shortId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          loadedProfile = baseUserDoc;
          createReferralDoc(firebaseUser.uid, firebaseUser.email ?? '').catch(() => {});
          processAmbassadorReferralOnSignup({
            newUid: firebaseUser.uid,
            newEmail: firebaseUser.email ?? '',
            newName: fallbackName,
            newShortId: baseUserDoc.shortId || deriveFallbackShortId(firebaseUser.uid),
          }).catch(() => {});
          ensureUserShortId(firebaseUser.uid, baseUserDoc.shortId).catch(() => {});
        }
      } catch (readErr: unknown) {
        console.warn(`[Boardly] User doc read notice at ${path}:`, readErr);
        const code = (readErr as { code?: string })?.code;
        if (code === 'permission-denied') {
          debugTracker.recordPlanLog({
            action: 'auth_load_profile',
            status: 'permission_denied',
            errorCode: code,
            details: (readErr as Error)?.message,
          });
        }
      }

      if (loadedProfile) {
        // Suspension check
        if (loadedProfile.suspended === true || loadedProfile.isSuspended === true) {
          await firebaseSignOut(auth);
          setTokenClaims({ superAdmin: false, admin: false, captain: false, verified: false });
          setUser(null);
          setProfile(null);
          setProfileLoading(false);
          setProfileError({
            code: 'auth/account-suspended',
            message: 'Your account has been suspended. Contact support@boardly.cfd.',
          });
          return;
        }

        // SECURITY: Never trust client-writable Firestore `role`, `isCaptain`, `isAdmin`, or `superAdmin` fields.
        // Role comes strictly from verified Firebase Auth custom claims (`claimDerivedRole`).
        const silentPatches: Record<string, unknown> = {};
        if (!loadedProfile.displayName || loadedProfile.displayName === 'Unnamed Student') {
          loadedProfile.displayName = fallbackName;
          silentPatches.displayName = fallbackName;
        }
        if (
          !claimSuperAdmin &&
          String(loadedProfile.displayName || '').trim().toLowerCase() === 'shs virtual academy'
        ) {
          loadedProfile.displayName = loadedProfile.username || fallbackName;
          silentPatches.displayName = loadedProfile.displayName;
        }
        const docRoleValue =
          typeof loadedProfile.role === 'string' ? loadedProfile.role : null;
        lastFirestoreDocRoleRef.current = {
          inspected: true,
          docRole: docRoleValue,
        };
        setTokenClaims((prev) =>
          prev.diagnostics
            ? {
                ...prev,
                diagnostics: {
                  ...prev.diagnostics,
                  checks: {
                    ...prev.diagnostics.checks,
                    firestoreRoleDoc: {
                      ...prev.diagnostics.checks.firestoreRoleDoc,
                      inspected: true,
                      docRole: docRoleValue,
                    },
                  },
                },
              }
            : prev
        );

        loadedProfile.role = claimDerivedRole;
        if (Object.keys(silentPatches).length > 0) {
          setDoc(docRef, silentPatches, { merge: true }).catch(() => {});
        }

        setProfile(loadedProfile);
        seedSharedUserProfileCache(firebaseUser.uid, loadedProfile);
        writeOptimisticUserSnapshot({
          uid: firebaseUser.uid,
          email: loadedProfile.email || emailLower,
          displayName: loadedProfile.displayName || fallbackName,
          username: loadedProfile.username || null,
          shortId: loadedProfile.shortId,
          role: 'student',
          customRole: loadedProfile.customRole || null,
          plan: loadedProfile.plan || 'free',
          isGuest: false,
          avatar:
            loadedProfile.equipped?.avatar ||
            (loadedProfile as any).equippedAvatar ||
            loadedProfile.avatar ||
            null,
          frame:
            loadedProfile.equipped?.frame ||
            (loadedProfile as any).equippedFrame ||
            loadedProfile.frame ||
            null,
          streak: Number(loadedProfile.streak || 0),
          targetUniversity: loadedProfile.targetUniversity,
        });
      } else {
        // Doc read timed out or failed — use fallback profile in-memory ONLY.
        // NEVER grant admin on a missing doc or error!
        console.warn(`[Boardly] Profile read timed out or offline at ${path}. Keeping in-memory fallback.`);
        setProfile(defaultProfile);
        seedSharedUserProfileCache(firebaseUser.uid, defaultProfile);
      }
    } catch (err: unknown) {
      console.warn(`[Boardly] Firestore profile read fallback at ${path}:`, err);
      setProfile(defaultProfile);
    } finally {
      setProfileLoading(false);
    }
  }, [createReferralDoc, bootstrapAndReadVerifiedClaims]);

  // ── Request 6-digit OTP code from Worker (`/api/auth/send-code`) ─────────
  const requestOtpCodeForUser = useCallback(
    async (
      firebaseUser: User,
      opts?: { purpose?: 'login' | 'signup' | '2fa'; forceResend?: boolean }
    ): Promise<{ ok: boolean; maskedEmail?: string; cooldownSeconds?: number; error?: string }> => {
      try {
        const idToken = await firebaseUser.getIdToken();
        const sendPurpose = opts?.purpose === '2fa' ? 'login' : opts?.purpose;
        const res = await fetch('/api/auth/send-code', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            purpose: sendPurpose,
            forceResend: Boolean(opts?.forceResend),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          purpose?: 'login' | 'signup';
          maskedEmail?: string;
          cooldownSeconds?: number;
          retryAfterSeconds?: number;
          error?: string;
        };

        const masked = data.maskedEmail || maskEmailClient(firebaseUser.email || '');
        const cooldown = Number(data.cooldownSeconds ?? data.retryAfterSeconds ?? 0);

        if (!res.ok || !data.ok) {
          const errMsg = data.error || 'Could not send verification code. Please try again.';
          setOtpVerificationState((prev) => ({
            ...prev,
            status: 'pending',
            purpose: opts?.purpose || prev.purpose || 'login',
            email: firebaseUser.email || prev.email,
            maskedEmail: masked,
            cooldownSeconds: cooldown > 0 ? cooldown : prev.cooldownSeconds,
            error: errMsg,
          }));
          return {
            ok: false,
            maskedEmail: masked,
            cooldownSeconds: cooldown,
            error: errMsg,
          };
        }

        setOtpVerificationState((prev) => ({
          ...prev,
          status: 'pending',
          purpose: opts?.purpose || prev.purpose || data.purpose || 'login',
          email: firebaseUser.email || '',
          maskedEmail: masked,
          cooldownSeconds: cooldown || 60,
          error: null,
        }));

        return {
          ok: true,
          maskedEmail: masked,
          cooldownSeconds: cooldown || 60,
        };
      } catch {
        const errMsg = 'Network error while sending verification code.';
        setOtpVerificationState((prev) => ({
          ...prev,
          status: 'pending',
          error: errMsg,
        }));
        return { ok: false, error: errMsg };
      }
    },
    []
  );

  const requestOtpCode = useCallback(
    async (opts?: { purpose?: 'login' | 'signup' | '2fa'; forceResend?: boolean }) => {
      const targetUser = auth.currentUser || user;
      if (!targetUser) {
        return { ok: false, error: 'Please sign in first.' };
      }
      return requestOtpCodeForUser(targetUser, opts);
    },
    [user, requestOtpCodeForUser]
  );

  // ── Verify 6-digit OTP or 2FA code via Worker (`/api/auth/verify-code` or `/api/auth/2fa/verify`) ──
  const verifyOtpCode = useCallback(
    async (
      code: string,
      opts?: { method?: 'totp' | 'email' | 'backup'; rememberDevice?: boolean }
    ): Promise<{
      ok: boolean;
      error?: string;
      locked?: boolean;
      attemptsRemaining?: number;
    }> => {
      const targetUser = auth.currentUser || user;
      if (!targetUser) {
        return { ok: false, error: 'Session expired. Please sign in again.' };
      }

      try {
        const idToken = await targetUser.getIdToken();
        const isTwoFactorStep =
          otpVerificationState.purpose === '2fa' || Boolean(opts?.method);
        const endpoint = isTwoFactorStep ? '/api/auth/2fa/verify' : '/api/auth/verify-code';

        const res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            code: code.trim(),
            purpose:
              otpVerificationState.purpose === '2fa'
                ? 'login'
                : otpVerificationState.purpose || undefined,
            method: opts?.method,
            rememberDevice: Boolean(opts?.rememberDevice),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          verified?: boolean;
          trustedDeviceToken?: string | null;
          error?: string;
          locked?: boolean;
          attemptsRemaining?: number;
        };

        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error: data.error || 'Invalid or expired code',
            locked: Boolean(data.locked),
            attemptsRemaining: data.attemptsRemaining,
          };
        }

        if (data.trustedDeviceToken) {
          setStoredTrustedDeviceToken(data.trustedDeviceToken);
        }

        try {
          localStorage.setItem('boardly_user_authenticated', 'true');
        } catch {
          // Ignore storage errors
        }

        setOtpVerificationState((prev) => ({
          ...prev,
          status: 'verified',
          purpose: null,
          cooldownSeconds: 0,
          error: null,
        }));

        try {
          await targetUser.reload();
          await loadProfile(targetUser);
        } catch {
          // Ignore reload error
        }

        return { ok: true };
      } catch {
        return { ok: false, error: 'Invalid or expired code' };
      }
    },
    [user, otpVerificationState.purpose, loadProfile]
  );

  // ── Verify Fallback Email Link (`/api/auth/verify-link`) ─────────────────
  const verifyFallbackEmailLink = useCallback(
    async (token: string, uid?: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const targetUser = auth.currentUser || user;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (targetUser) {
          const idToken = await targetUser.getIdToken().catch(() => '');
          if (idToken) headers.Authorization = `Bearer ${idToken}`;
        }

        const res = await fetch('/api/auth/verify-link', {
          method: 'POST',
          headers,
          body: JSON.stringify({ token, uid }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };

        if (!res.ok || !data.ok) {
          return {
            ok: false,
            error: data.error || 'Invalid or expired verification link.',
          };
        }

        if (targetUser) {
          try {
            localStorage.setItem('boardly_user_authenticated', 'true');
          } catch {
            // Ignore storage errors
          }
          setOtpVerificationState((prev) => ({
            ...prev,
            status: 'verified',
            purpose: null,
            cooldownSeconds: 0,
            error: null,
          }));
          try {
            await targetUser.reload();
            await loadProfile(targetUser);
          } catch {
            // Ignore reload error
          }
        }

        return { ok: true };
      } catch {
        return { ok: false, error: 'Invalid or expired verification link.' };
      }
    },
    [user, loadProfile]
  );

  // Clean up any legacy redirect session markers on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('boardly_auth_redirect_pending');
        sessionStorage.removeItem('boardly_redirect_pending');
      } catch {
        // Ignore storage access errors
      }
    }
  }, []);

  // Keep refs to current user/profile so Firebase onAuthStateChanged(null) never clears an active guest session prematurely
  const userRef = useRef<User | null>(user);
  const profileRef = useRef<UserProfile | null>(profile);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const loadProfileRef = useRef(loadProfile);
  useEffect(() => {
    loadProfileRef.current = loadProfile;
  }, [loadProfile]);

  const requestOtpCodeForUserRef = useRef(requestOtpCodeForUser);
  useEffect(() => {
    requestOtpCodeForUserRef.current = requestOtpCodeForUser;
  }, [requestOtpCodeForUser]);

  // Helper to resolve current user/guest from the unified `/api/auth/me` endpoint
  const resolveServerGuestSession = useCallback(async (): Promise<boolean> => {
    try {
      if (
        isSigningOutRef.current ||
        (typeof window !== 'undefined' && Boolean((window as any).__boardlySigningOut))
      ) {
        return false;
      }

      // Requirement 3: Never auto-create or auto-restore a guest session on sign-out or when
      // no explicit client guest session token exists. Guest mode starts ONLY when the user
      // explicitly taps "Continue as guest".
      const savedGuestToken =
        (typeof window !== 'undefined'
          ? localStorage.getItem(GUEST_TOKEN_LS_KEY) || getStoredGuestSessionToken() || ''
          : '') || '';
      if (!savedGuestToken) {
        return false;
      }

      const headers: Record<string, string> = {
        'X-Guest-Session': savedGuestToken,
      };
      const meRes = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers,
      });
      const meData = (await meRes.json().catch(() => ({}))) as {
        ok?: boolean;
        authenticated?: boolean;
        user?: {
          uid: string;
          username: string | null;
          displayName: string;
          accountType: 'guest' | 'registered';
          plan: string;
          role: string;
          customRole?: string;
          isGuest?: boolean;
          shortId?: string;
          targetUniversity?: string;
          testsCompleted?: number;
          totalQuestionsSolved?: number;
          streak?: number;
        } | null;
        guest?: {
          uid: string;
          username: string;
          displayName: string;
          shortId: string;
          targetUniversity?: string;
          testsCompleted?: number;
          totalQuestionsSolved?: number;
          streak?: number;
          createdAt?: number;
          lastActiveAt?: number;
        } | null;
      };

      const g = meData.guest || (meData.user?.accountType === 'guest' ? meData.user : null);
      if (meRes.ok && meData.authenticated && g && g.uid) {
        if (
          isSigningOutRef.current ||
          signingOutGuestUidRef.current === g.uid ||
          (typeof window !== 'undefined' && Boolean((window as any).__boardlySigningOut))
        ) {
          return false;
        }
        const guestUsername = g.username || g.displayName || 'Guest';
        const guestDisplayName = g.displayName || guestUsername;
        const effectiveToken = savedGuestToken || `${g.uid}.cookie_session`;
        setStoredGuestSessionToken(effectiveToken);
        try {
          localStorage.setItem('boardly_user_authenticated', 'true');
        } catch {
          // Ignore storage error
        }
        let cachedGuestCustom: Record<string, any> = {};
        try {
          const rawCached = localStorage.getItem(`cached_profile_${g.uid}`);
          if (rawCached) {
            cachedGuestCustom = JSON.parse(rawCached) || {};
          }
        } catch {
          // Ignore
        }
        const walletSnap = readOptimisticWalletSnapshot(g.uid);
        const prevSameGuest =
          profileRef.current && profileRef.current.uid === g.uid ? profileRef.current : null;
        const mergedEquipped = {
          ...(cachedGuestCustom.equipped || {}),
          ...(prevSameGuest?.equipped || {}),
          ...(walletSnap?.equipped || {}),
        };

        const synthUser = buildSyntheticGuestUser(g.uid, guestUsername, effectiveToken);
        const guestProfile: UserProfile = {
          ...(prevSameGuest || {}),
          uid: g.uid,
          email: '',
          displayName: prevSameGuest?.displayName || cachedGuestCustom.displayName || guestDisplayName,
          name: prevSameGuest?.name || cachedGuestCustom.name || guestDisplayName,
          username: guestUsername,
          shortId: g.shortId || prevSameGuest?.shortId || 'GUEST',
          role: 'student',
          customRole: 'Guest',
          plan: 'free',
          status: 'active',
          isGuest: true,
          accountType: 'guest',
          profileCompleted: true,
          onboardingCompleted: true,
          targetUniversity:
            prevSameGuest?.targetUniversity ||
            cachedGuestCustom.targetUniversity ||
            g.targetUniversity ||
            'General Prep',
          testsCompleted: Number(g.testsCompleted ?? prevSameGuest?.testsCompleted ?? 0),
          totalQuestionsSolved: Number(
            g.totalQuestionsSolved ?? prevSameGuest?.totalQuestionsSolved ?? 0
          ),
          streak: Number(g.streak ?? prevSameGuest?.streak ?? 0),
          lastActiveAt: (g as any).lastActiveAt || Date.now(),
          ...(Object.keys(mergedEquipped).length > 0 ? { equipped: mergedEquipped } : {}),
          ...(prevSameGuest?.avatarId || cachedGuestCustom.avatarId
            ? { avatarId: prevSameGuest?.avatarId || cachedGuestCustom.avatarId }
            : {}),
          ...(prevSameGuest?.photoURL || cachedGuestCustom.photoURL
            ? { photoURL: prevSameGuest?.photoURL || cachedGuestCustom.photoURL }
            : {}),
        };
        setGuestSessionToken(effectiveToken);
        setUser(synthUser);
        setProfile(guestProfile);
        preloadSecurityAndSettingsForUid(g.uid, true);
        writeOptimisticUserSnapshot({
          uid: g.uid,
          email: '',
          displayName: guestProfile.displayName || guestDisplayName,
          username: guestUsername,
          shortId: guestProfile.shortId,
          role: 'student',
          customRole: 'Guest',
          plan: 'free',
          isGuest: true,
          streak: Number(g.streak || 0),
          targetUniversity: guestProfile.targetUniversity,
        });
        setOtpVerificationState({
          status: 'verified',
          purpose: null,
          email: '',
          maskedEmail: `@${guestUsername}`,
          cooldownSeconds: 0,
          error: null,
        });
        setProfileLoading(false);
        setProfileError(null);
        return true;
      }

      // Requirement 4: If a guest session is expired or invalid, treat it as signed-out:
      // clear it, do not set any error, and return false so the sign-in screen is shown.
      if (meRes.status === 401 || (meRes.ok && meData.authenticated === false)) {
        try {
          localStorage.removeItem(GUEST_TOKEN_LS_KEY);
          localStorage.removeItem('boardly_user_authenticated');
          sessionStorage.removeItem(GUEST_TOKEN_LS_KEY);
        } catch {
          // Ignore
        }
        setStoredGuestSessionToken(null);
        setGuestSessionToken(null);
        clearOptimisticUserSnapshot();
        setAuthError(null);
        setProfileError(null);
        if (userRef.current && (userRef.current as any).isGuest) {
          setUser(null);
          setProfile(null);
        }
        return false;
      }

      // On transient server error, keep any existing in-memory guest session alive unless signing out
      if (!isSigningOutRef.current && userRef.current && (userRef.current as any).isGuest) {
        setProfileLoading(false);
        return true;
      }
      return false;
    } catch {
      // Network failure: do not destroy an already-loaded guest session unless signing out
      if (!isSigningOutRef.current && userRef.current && (userRef.current as any).isGuest) {
        setProfileLoading(false);
        return true;
      }
      return false;
    }
  }, []);

  // Helper to evaluate server-side verification gate (`/api/auth/verification-status`)
  const evaluateUserVerificationGate = useCallback(
    async (
      firebaseUser: User,
      isFreshLogin = false,
      syncPasswordLink = false
    ): Promise<boolean> => {
      setOtpVerificationState((prev) =>
        prev.status === 'pending' && prev.email === (firebaseUser.email || '')
          ? prev
          : {
              status: 'checking',
              purpose: prev.purpose,
              email: firebaseUser.email || '',
              maskedEmail: maskEmailClient(firebaseUser.email || ''),
              cooldownSeconds: prev.cooldownSeconds,
              error: null,
            }
      );

      try {
        const idToken = await firebaseUser.getIdToken(syncPasswordLink);
        const savedTrustedDevice = getStoredTrustedDeviceToken();
        const headers: Record<string, string> = {
          Authorization: `Bearer ${idToken}`,
        };
        if (savedTrustedDevice) {
          headers['X-Trusted-Device'] = savedTrustedDevice;
        }

        const queryParts: string[] = [];
        if (isFreshLogin) queryParts.push('login=1');
        if (syncPasswordLink) queryParts.push('syncPasswordLink=1');
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

        const statusRes = await fetch(`/api/auth/verification-status${queryString}`, {
          credentials: 'include',
          headers,
        });
        const statusData = (await statusRes.json().catch(() => ({}))) as {
          ok?: boolean;
          verified?: boolean;
          emailVerified?: boolean;
          twoFactorEnabled?: boolean;
          totpEnabled?: boolean;
          email2faEnabled?: boolean;
          emailCodeEnabled?: boolean;
          backupCodesRemaining?: number;
          trustedDevicesCount?: number;
          rememberedDevices?: number;
          lastChangedAt?: number | null;
          deviceTrusted?: boolean;
          requiredPurpose?: 'login' | 'signup' | '2fa' | null;
          pendingExpiresAt?: number | null;
          recoveryDisableAt?: number | null;
          hasActiveCode?: boolean;
          maskedEmail?: string;
          cooldownSeconds?: number;
        };

        if (statusRes.ok && statusData.ok !== false) {
          seedSecurityStatusFromServer(firebaseUser.uid, statusData);
        }

        if (statusRes.ok && statusData.verified) {
          try {
            localStorage.setItem('boardly_user_authenticated', 'true');
          } catch {
            // Ignore storage errors
          }
          setOtpVerificationState({
            status: 'verified',
            purpose: null,
            email: firebaseUser.email || '',
            maskedEmail: statusData.maskedEmail || maskEmailClient(firebaseUser.email || ''),
            cooldownSeconds: 0,
            error: null,
          });
          return true;
        }

        try {
          localStorage.removeItem('boardly_user_authenticated');
        } catch {
          // Ignore storage errors
        }

        const requiredPurpose: 'login' | 'signup' | '2fa' =
          statusData.requiredPurpose ||
          (statusData.twoFactorEnabled
            ? '2fa'
            : firebaseUser.emailVerified
            ? 'login'
            : 'signup');

        const totpEnabled = Boolean(statusData.totpEnabled);
        const email2faEnabled = Boolean(statusData.email2faEnabled);

        setOtpVerificationState({
          status: 'pending',
          purpose: requiredPurpose,
          email: firebaseUser.email || '',
          maskedEmail: statusData.maskedEmail || maskEmailClient(firebaseUser.email || ''),
          cooldownSeconds: Number(statusData.cooldownSeconds || 0),
          error: null,
          twoFactorMethods: {
            totp: totpEnabled,
            email: email2faEnabled,
          },
          pendingExpiresAt: statusData.pendingExpiresAt || null,
          recoveryDisableAt: statusData.recoveryDisableAt || null,
        });

        // Automatically send email code when required for one-time signup verification
        // OR when 2FA is active with email 2FA enabled and no TOTP-only preference
        const shouldAutoSendEmail =
          requiredPurpose === 'signup' ||
          (requiredPurpose === '2fa' && email2faEnabled && !totpEnabled);

        if (
          shouldAutoSendEmail &&
          !statusData.hasActiveCode &&
          (!statusData.cooldownSeconds || statusData.cooldownSeconds <= 0)
        ) {
          void requestOtpCodeForUserRef.current(firebaseUser, {
            purpose: requiredPurpose,
            forceResend: false,
          });
        }
        return false;
      } catch {
        // Fallback if network fails
        if (isGoogleProviderUser(firebaseUser) || firebaseUser.emailVerified) {
          setOtpVerificationState({
            status: 'verified',
            purpose: null,
            email: firebaseUser.email || '',
            maskedEmail: maskEmailClient(firebaseUser.email || ''),
            cooldownSeconds: 0,
            error: null,
          });
          return true;
        }
        setOtpVerificationState((prev) => ({
          status: 'pending',
          purpose: prev.purpose || 'signup',
          email: firebaseUser.email || '',
          maskedEmail: maskEmailClient(firebaseUser.email || ''),
          cooldownSeconds: prev.cooldownSeconds,
          error: prev.error,
        }));
        return false;
      }
    },
    []
  );

  const refreshVerificationStatus = useCallback(
    async (opts?: { syncPasswordLink?: boolean }): Promise<boolean> => {
      const targetUser = auth.currentUser || userRef.current;
      if (!targetUser || (targetUser as any).isGuest) return true;
      const ok = await evaluateUserVerificationGate(
        targetUser,
        false,
        Boolean(opts?.syncPasswordLink)
      );
      if (opts?.syncPasswordLink) {
        await targetUser.getIdToken(true).catch(() => {});
      }
      return ok;
    },
    [evaluateUserVerificationGate]
  );

  // ── Auth state listener (Single Source of Truth with `/api/auth/me`) ─────
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      if (
        isSigningOutRef.current ||
        (typeof window !== 'undefined' && Boolean((window as any).__boardlySigningOut))
      ) {
        if (!firebaseUser) {
          setUser(null);
          setProfile(null);
          setProfileLoading(false);
          setProfileError(null);
          setAuthError(null);
        }
        return;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        preloadSecurityAndSettingsForUid(firebaseUser.uid, false);

        // Run verification gate, Firestore profile load, and D1 `/api/auth/me` in parallel instead of a sequential waterfall
        const [, , meCheck] = await Promise.all([
          evaluateUserVerificationGate(firebaseUser, false).catch(() => false),
          loadProfileRef.current(firebaseUser).catch((err) => {
            console.warn('[Boardly Auth] onAuthStateChanged profile load error:', err);
          }),
          (async () => {
            try {
              const idToken = await firebaseUser.getIdToken();
              const meRes = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: { Authorization: `Bearer ${idToken}` },
              });
              const meData = await meRes.json().catch(() => ({}));
              return { ok: meRes.ok, meData, idToken };
            } catch {
              return null;
            }
          })(),
        ]);

        if (!isMounted) return;

        // Apply server-side username, twoFactorStatus, and trusted role from `/api/auth/me`
        if (meCheck?.ok && meCheck.meData?.user) {
          const { meData, idToken } = meCheck;
          const twoFactorPayload = meData.twoFactorStatus || meData.user.twoFactorStatus;
          if (twoFactorPayload) {
            seedSecurityStatusFromServer(firebaseUser.uid, twoFactorPayload);
          }
          const idTokenResult = await firebaseUser.getIdTokenResult(true).catch(() => null);
          if (!idTokenResult || !idTokenResult.claims) {
            // Fail closed if token claims cannot be read
            setTokenClaims({
              superAdmin: false,
              admin: false,
              captain: false,
              verified: false,
              rawClaims: {},
            });
            setUser(null);
            setProfile(null);
            setProfileLoading(false);
            await firebaseSignOut(auth).catch(() => {});
            return;
          }
          const resolvedFromToken = evaluateVerifiedRoleState(
            firebaseUser,
            idTokenResult.claims as Record<string, unknown>
          );
          const hasSuperAdminClaim = resolvedFromToken.superAdmin;
          const hasAdminClaim = resolvedFromToken.admin;
          const hasCaptainClaim = resolvedFromToken.captain;
          setTokenClaims({
            superAdmin: hasSuperAdminClaim,
            admin: hasAdminClaim,
            captain: hasCaptainClaim,
            verified: true,
            roleSource: resolvedFromToken.roleSource,
            diagnostics: resolvedFromToken.diagnostics,
            rawClaims: resolvedFromToken.rawClaims,
          });
          const trustedRole: UserProfile['role'] = hasSuperAdminClaim
            ? 'super_admin'
            : hasAdminClaim
            ? 'admin'
            : hasCaptainClaim
            ? 'captain'
            : 'student';
          if (hasAdminClaim && Array.isArray(meData.activeGrants)) {
            setActiveGrants(meData.activeGrants);
          } else if (hasAdminClaim && !hasSuperAdminClaim) {
            refreshActiveGrants().catch(() => {});
          }
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  ...(meData.user.username ? { username: meData.user.username } : {}),
                  ...(meData.user.plan === 'pro' || meData.user.plan === 'free'
                    ? { plan: meData.user.plan, isPremium: meData.user.plan === 'pro' }
                    : {}),
                  role: trustedRole,
                }
              : prev
          );
          const hasRegUsername = Boolean(
            meData.hasRegisteredUsername || meData.user.hasRegisteredUsername
          );
          if (!hasRegUsername) {
            const existingFsUsername = String(profileRef.current?.username || '').trim();
            if (existingFsUsername && validateUsernameFormat(existingFsUsername).valid) {
              const regRes = await fetch('/api/auth/username-register', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                  uid: firebaseUser.uid,
                  username: existingFsUsername,
                  email: (firebaseUser.email || '').toLowerCase(),
                  accountType: 'registered',
                }),
              }).catch(() => null);
              const regJson = regRes ? await regRes.json().catch(() => ({})) : {};
              if (regRes?.ok && regJson?.ok) {
                setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
              } else {
                const isGoogle = isGoogleProviderUser(firebaseUser);
                const seenKey = `boardly_username_prompt_seen_${firebaseUser.uid}`;
                const alreadySeen =
                  !isGoogle &&
                  typeof window !== 'undefined' &&
                  window.localStorage.getItem(seenKey) === '1';
                if (!alreadySeen) {
                  setUsernamePromptState({
                    open: true,
                    allowSkip: !isGoogle,
                    suggested: '',
                  });
                }
              }
            } else {
              const isGoogle = isGoogleProviderUser(firebaseUser);
              const seenKey = `boardly_username_prompt_seen_${firebaseUser.uid}`;
              const alreadySeen =
                !isGoogle &&
                typeof window !== 'undefined' &&
                window.localStorage.getItem(seenKey) === '1';
              if (!alreadySeen) {
                const baseSuggested = (
                  firebaseUser.displayName ||
                  (firebaseUser.email ? firebaseUser.email.split('@')[0] : '') ||
                  ''
                )
                  .toLowerCase()
                  .replace(/[^a-z0-9._]/g, '_')
                  .replace(/^[._]+|[._]+$/g, '')
                  .slice(0, 16);
                setUsernamePromptState({
                  open: true,
                  allowSkip: !isGoogle,
                  suggested: baseSuggested.length >= 3 ? baseSuggested : '',
                });
              }
            }
          } else {
            setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
          }
        }
      } else {
        // Firebase emitted "no user". NEVER clear user/profile before checking `/api/auth/me`!
        const hasValidGuest = await resolveServerGuestSession();
        if (!isMounted) return;
        if (hasValidGuest) {
          return;
        }

        // Confirmed: neither a Firebase user nor an active guest session
        clearOptimisticUserSnapshot();
        clearSecurityStatusCache();
        try {
          localStorage.removeItem('boardly_user_authenticated');
          localStorage.removeItem(GUEST_TOKEN_LS_KEY);
        } catch {
          // Ignore storage errors
        }
        setStoredGuestSessionToken(null);
        setGuestSessionToken(null);
        setOtpVerificationState({
          status: 'idle',
          purpose: null,
          email: '',
          maskedEmail: '',
          cooldownSeconds: 0,
          error: null,
        });
        setTokenClaims({ superAdmin: false, admin: false, captain: false, verified: false });
        setUser(null);
        setProfile(null);
        setProfileLoading(false);
        setProfileError(null);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [
    retryCount,
    resolveServerGuestSession,
    evaluateUserVerificationGate,
    evaluateVerifiedRoleState,
    refreshActiveGrants,
  ]);

  // ── Requirement 2: Listen for `users/{uid}.claimsUpdatedAt` signal and force token refresh ──
  const lastClaimsUpdatedAtRef = useRef<Record<string, unknown>>({});
  useEffect(() => {
    if (!user || isGuest || !user.uid || String(user.uid).startsWith('guest_')) {
      return;
    }
    const uid = user.uid;
    const userDocRef = doc(db, 'users', uid);
    let isInitialSnapshot = true;

    const unsubscribeClaimsSignal = onSnapshot(
      userDocRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const rawSignal = data?.claimsUpdatedAt;
        const normalizedSignal =
          rawSignal && typeof (rawSignal as any).toMillis === 'function'
            ? (rawSignal as any).toMillis()
            : rawSignal && typeof (rawSignal as any).seconds === 'number'
            ? (rawSignal as any).seconds * 1000
            : rawSignal ?? null;

        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          lastClaimsUpdatedAtRef.current[uid] = normalizedSignal;
          return;
        }

        if (
          normalizedSignal !== null &&
          normalizedSignal !== lastClaimsUpdatedAtRef.current[uid]
        ) {
          lastClaimsUpdatedAtRef.current[uid] = normalizedSignal;
          void refreshTokenClaims(true);
        }
      },
      () => {
        // Ignore listener error; never elevate roles
      }
    );

    return () => {
      unsubscribeClaimsSignal();
    };
  }, [user, isGuest, refreshTokenClaims]);

  // ── Sliding Guest Session Keep-Alive (tab focus + periodic refresh) ──────
  useEffect(() => {
    if (!isGuest) return;

    const refreshGuestSession = () => {
      void resolveServerGuestSession();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshGuestSession();
      }
    };

    const interval = setInterval(refreshGuestSession, 4 * 60 * 1000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isGuest, resolveServerGuestSession]);

  // ── Guest Mode Actions ───────────────────────────────────────────────────
  const checkUsernameAvailability = useCallback(async (rawUsername: string) => {
    try {
      const res = await fetch(
        `/api/auth/username-check?username=${encodeURIComponent(rawUsername.trim())}`,
        { method: 'GET', credentials: 'include' }
      );
      const data = await res.json().catch(() => ({}));
      return {
        available: Boolean(data?.available),
        username: String(data?.username || rawUsername.trim()),
        normalized: String(data?.normalized || rawUsername.trim().toLowerCase()),
        reason: data?.reason || null,
        code: data?.code || null,
      };
    } catch {
      return {
        available: false,
        username: rawUsername.trim(),
        normalized: rawUsername.trim().toLowerCase(),
        reason: 'Could not verify username availability. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }, []);

  const signInAsGuest = useCallback(
    async (username: string, targetUniversity = 'General Prep'): Promise<UserProfile> => {
      setAuthError(null);
      const deviceId = getOrCreateClientDeviceId();
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({
          username: username.trim(),
          deviceId,
          targetUniversity,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.guest) {
        const err: any = new Error(
          data?.error || 'Could not create guest session. Please try another username.'
        );
        err.code = data?.code || 'GUEST_CREATION_FAILED';
        setAuthError({ code: err.code, message: err.message });
        throw err;
      }

      const g = data.guest;
      const sessionToken = String(data.sessionToken || '');
      try {
        if (sessionToken) {
          localStorage.setItem(GUEST_TOKEN_LS_KEY, sessionToken);
        }
        localStorage.setItem('boardly_user_authenticated', 'true');
      } catch {
        // Ignore storage error
      }
      setStoredGuestSessionToken(sessionToken || `${g.uid}.cookie_session`);

      setGuestSessionToken(sessionToken);
      void recordLegalConsentOnServer({
        userId: g.uid,
        accountType: 'guest',
        actionContext: 'guest_signin',
        documentVersion: LEGAL_DOCUMENT_VERSION,
      });
      const synthUser = buildSyntheticGuestUser(g.uid, g.username, sessionToken);
      const guestProfile: UserProfile = {
        uid: g.uid,
        email: '',
        displayName: g.displayName || g.username,
        name: g.displayName || g.username,
        username: g.username,
        shortId: g.shortId || 'GUEST',
        role: 'student',
        customRole: 'Guest',
        plan: 'free',
        status: 'active',
        isGuest: true,
        accountType: 'guest',
        profileCompleted: true,
        onboardingCompleted: true,
        targetUniversity: g.targetUniversity || targetUniversity,
        testsCompleted: Number(g.testsCompleted || 0),
        totalQuestionsSolved: Number(g.totalQuestionsSolved || 0),
        streak: Number(g.streak || 0),
        lastActiveAt: g.lastActiveAt || Date.now(),
      };

      setUser(synthUser);
      setProfile(guestProfile);
      setOtpVerificationState({
        status: 'verified',
        purpose: null,
        email: '',
        maskedEmail: `@${g.username}`,
        cooldownSeconds: 0,
        error: null,
      });
      setProfileLoading(false);
      return guestProfile;
    },
    []
  );

  const syncGuestProgress = useCallback(
    async (updates: {
      testsCompleted?: number;
      totalQuestionsSolved?: number;
      streak?: number;
      targetUniversity?: string;
      stats?: Record<string, any>;
      attempts?: any[];
    }) => {
      if (!isGuest) return;
      try {
        const token = guestSessionToken || localStorage.getItem(GUEST_TOKEN_LS_KEY) || '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['X-Guest-Session'] = token;

        await fetch('/api/auth/guest/sync', {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify(updates),
        });
      } catch {
        // Non-fatal background sync
      }
    },
    [isGuest, guestSessionToken]
  );

  const upgradeGuestWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<GuestUpgradeResult> => {
      if (!isGuest || !profile?.uid) {
        return { ok: false, error: 'No active guest account to upgrade.' };
      }
      setAuthError(null);
      const cleanEmail = email.trim().toLowerCase();
      const guestUid = profile.uid;
      const guestUsername = profile.username || profile.displayName || 'Student';
      const savedGuestToken = guestSessionToken || localStorage.getItem(GUEST_TOKEN_LS_KEY) || '';

      try {
        // 1. Create the Firebase Auth credentials for the email/password
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const newFirebaseUser = credential.user;
        const idToken = await newFirebaseUser.getIdToken();

        // 2. Upgrade the guest account in-place on D1 (`/api/auth/guest/upgrade`)
        const upgRes = await fetch('/api/auth/guest/upgrade', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            ...(savedGuestToken ? { 'X-Guest-Session': savedGuestToken } : {}),
          },
          body: JSON.stringify({
            guestUid,
            guestSessionToken: savedGuestToken,
            newUid: newFirebaseUser.uid,
            email: cleanEmail,
            displayName: displayName?.trim() || guestUsername,
            signInProvider: 'password',
          }),
        });
        const upgData = await upgRes.json().catch(() => ({}));

        if (upgRes.status === 409 || upgData?.code === 'ACCOUNT_ALREADY_EXISTS') {
          return {
            ok: false,
            existingAccountConflict: true,
            existingEmail: cleanEmail,
            error:
              upgData?.error ||
              'An account with this email already exists. Please log in instead.',
          };
        }

        if (!upgRes.ok || !upgData?.ok) {
          return {
            ok: false,
            error: upgData?.error || 'Could not upgrade guest account. Please try again.',
          };
        }

        // 3. Migrate Commons posts, comments, likes, saves & attempts in D1 store
        await fetch('/api/posts/migrate-guest', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestUid,
            newUid: newFirebaseUser.uid,
            username: guestUsername,
          }),
        }).catch(() => {});

        // 4. Write upgraded profile to Firestore preserving username, progress, attempts, and stats
        const preservedName = displayName?.trim() || guestUsername;
        try {
          await firebaseUpdateProfile(newFirebaseUser, { displayName: preservedName });
        } catch {
          // Non-fatal
        }

        let guestCachedCustom: Record<string, any> = {};
        try {
          const raw = localStorage.getItem(`cached_profile_${guestUid}`);
          if (raw) guestCachedCustom = JSON.parse(raw) || {};
        } catch {
          // Ignore
        }
        const guestWalletSnap = readOptimisticWalletSnapshot(guestUid);
        const migratedKobanStyle = migrateGuestKobanStyleToUser(guestUid, newFirebaseUser.uid);
        if (migratedKobanStyle) {
          void fetch('/api/koban-style', {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
              'X-User-Uid': newFirebaseUser.uid,
            },
            body: JSON.stringify(migratedKobanStyle),
          }).catch(() => {});
        }
        const carriedEquipped = {
          ...(guestCachedCustom.equipped || {}),
          ...(profile.equipped || {}),
          ...(guestWalletSnap?.equipped || {}),
        };
        if (guestWalletSnap) {
          writeOptimisticWalletSnapshot(newFirebaseUser.uid, {
            balance: guestWalletSnap.balance,
            equipped: carriedEquipped,
            owned: guestWalletSnap.owned,
          });
        }

        const upgradedProfileDoc: UserProfile = {
          uid: newFirebaseUser.uid,
          email: cleanEmail,
          displayName: preservedName,
          name: preservedName,
          username: guestUsername,
          shortId: upgData.shortId || profile.shortId || deriveFallbackShortId(newFirebaseUser.uid),
          role: 'student',
          plan: 'free',
          status: 'active',
          isGuest: false,
          accountType: 'registered',
          profileCompleted: true,
          onboardingCompleted: true,
          targetUniversity: upgData.targetUniversity || profile.targetUniversity || 'General Prep',
          testsCompleted: Number(upgData.testsCompleted ?? profile.testsCompleted ?? 0),
          totalQuestionsSolved: Number(
            upgData.totalQuestionsSolved ?? profile.totalQuestionsSolved ?? 0
          ),
          streak: Number(upgData.streak ?? profile.streak ?? 0),
          ...(Object.keys(carriedEquipped).length > 0 ? { equipped: carriedEquipped } : {}),
          ...(profile.avatarId || guestCachedCustom.avatarId
            ? { avatarId: profile.avatarId || guestCachedCustom.avatarId }
            : {}),
          ...(profile.photoURL || guestCachedCustom.photoURL
            ? { photoURL: profile.photoURL || guestCachedCustom.photoURL }
            : {}),
        };

        try {
          localStorage.setItem(
            `cached_profile_${newFirebaseUser.uid}`,
            JSON.stringify({ ...guestCachedCustom, ...upgradedProfileDoc })
          );
        } catch {
          // Ignore
        }

        const { role: _r1, plan: _p1, status: _s1, ...safeUpgradedEmailDoc } = upgradedProfileDoc;
        await setDoc(
          doc(db, 'users', newFirebaseUser.uid),
          {
            ...safeUpgradedEmailDoc,
            emailVerified: true,
            upgradedFromGuestUid: guestUid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});

        if (Object.keys(carriedEquipped).length > 0 || (guestWalletSnap?.owned?.length ?? 0) > 0) {
          await setDoc(
            doc(db, 'wallets', newFirebaseUser.uid),
            {
              equipped: carriedEquipped,
              ...(guestWalletSnap?.owned ? { owned: guestWalletSnap.owned } : {}),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }

        await setDoc(
          doc(db, 'publicProfiles', newFirebaseUser.uid),
          {
            uid: newFirebaseUser.uid,
            displayName: preservedName,
            username: guestUsername,
            studentId: upgradedProfileDoc.shortId,
            role: 'student',
            ...(Object.keys(carriedEquipped).length > 0 ? { equipped: carriedEquipped } : {}),
            stats: {
              streak: upgradedProfileDoc.streak || 0,
              testsCompleted: upgradedProfileDoc.testsCompleted || 0,
              totalQuestionsSolved: upgradedProfileDoc.totalQuestionsSolved || 0,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});

        // Carry over guest test attempts into Firestore attempts/{attemptId} for the new registered UID
        if (Array.isArray(upgData.attempts)) {
          for (const rawAtt of upgData.attempts) {
            if (rawAtt && typeof rawAtt === 'object') {
              const attId = String(rawAtt.id || rawAtt.attemptId || '');
              if (attId) {
                await setDoc(
                  doc(db, 'attempts', attId),
                  {
                    ...rawAtt,
                    id: attId,
                    uid: newFirebaseUser.uid,
                    userId: newFirebaseUser.uid,
                    upgradedFromGuestUid: guestUid,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                ).catch(() => {});
              }
            }
          }
        }

        try {
          localStorage.removeItem(GUEST_TOKEN_LS_KEY);
          localStorage.setItem('boardly_user_authenticated', 'true');
        } catch {
          // Ignore
        }
        setStoredGuestSessionToken(null);
        setGuestSessionToken(null);
        setUser(newFirebaseUser);
        setProfile(upgradedProfileDoc);
        setOtpVerificationState({
          status: 'verified',
          purpose: null,
          email: cleanEmail,
          maskedEmail: maskEmailClient(cleanEmail),
          cooldownSeconds: 0,
          error: null,
        });
        return { ok: true };
      } catch (err: any) {
        const code = String(err?.code || '');
        if (code === 'auth/email-already-in-use') {
          return {
            ok: false,
            existingAccountConflict: true,
            existingEmail: cleanEmail,
            error:
              'This email already belongs to another Boardly account. Would you like to log in instead?',
          };
        }
        return {
          ok: false,
          error: err?.message || 'Could not upgrade guest account.',
        };
      }
    },
    [isGuest, profile, guestSessionToken]
  );

  const upgradeGuestWithGoogle = useCallback(async (): Promise<GuestUpgradeResult> => {
    if (!isGuest || !profile?.uid) {
      return { ok: false, error: 'No active guest account to upgrade.' };
    }
    setAuthError(null);
    const guestUid = profile.uid;
    const guestUsername = profile.username || profile.displayName || 'Student';
    const savedGuestToken = guestSessionToken || localStorage.getItem(GUEST_TOKEN_LS_KEY) || '';
    const snapshotGuestProfile = { ...profile };

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const credential = await signInWithPopup(auth, provider);
      const googleUser = credential?.user;
      if (!googleUser) {
        return { ok: false, error: 'Google sign-in was cancelled.' };
      }

      // Check if this Google user already has an existing registered profile in Firestore
      const existingSnap = await getDoc(doc(db, 'users', googleUser.uid)).catch(() => null);
      if (
        existingSnap &&
        typeof existingSnap.exists === 'function' &&
        existingSnap.exists()
      ) {
        const existingData = existingSnap.data();
        if (
          existingData &&
          existingData.onboardingCompleted === true &&
          existingData.upgradedFromGuestUid !== guestUid
        ) {
          // Revert Firebase popup login so guest session is not lost unless they choose to log in
          await firebaseSignOut(auth).catch(() => {});
          const synth = buildSyntheticGuestUser(
            guestUid,
            guestUsername,
            savedGuestToken || `${guestUid}.cookie_session`
          );
          setUser(synth);
          setProfile(snapshotGuestProfile);
          return {
            ok: false,
            existingAccountConflict: true,
            existingEmail: googleUser.email || undefined,
            error:
              'This Google account already belongs to an existing Boardly user. Would you like to log in to that account instead?',
          };
        }
      }

      const idToken = await googleUser.getIdToken();
      const upgRes = await fetch('/api/auth/guest/upgrade', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          ...(savedGuestToken ? { 'X-Guest-Session': savedGuestToken } : {}),
        },
        body: JSON.stringify({
          guestUid,
          guestSessionToken: savedGuestToken,
          newUid: googleUser.uid,
          email: googleUser.email || '',
          displayName: googleUser.displayName || guestUsername,
          signInProvider: 'google.com',
        }),
      });
      const upgData = await upgRes.json().catch(() => ({}));

      if (upgRes.status === 409 || upgData?.code === 'ACCOUNT_ALREADY_EXISTS') {
        await firebaseSignOut(auth).catch(() => {});
        const synth = buildSyntheticGuestUser(
          guestUid,
          guestUsername,
          savedGuestToken || `${guestUid}.cookie_session`
        );
        setUser(synth);
        setProfile(snapshotGuestProfile);
        return {
          ok: false,
          existingAccountConflict: true,
          existingEmail: googleUser.email || undefined,
          error:
            upgData?.error ||
            'This Google account already belongs to another user. Please log in instead.',
        };
      }

      await fetch('/api/posts/migrate-guest', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestUid,
          newUid: googleUser.uid,
          username: guestUsername,
        }),
      }).catch(() => {});

      let guestCachedGoogleCustom: Record<string, any> = {};
      try {
        const raw = localStorage.getItem(`cached_profile_${guestUid}`);
        if (raw) guestCachedGoogleCustom = JSON.parse(raw) || {};
      } catch {
        // Ignore
      }
      const guestGoogleWalletSnap = readOptimisticWalletSnapshot(guestUid);
      const migratedGoogleKobanStyle = migrateGuestKobanStyleToUser(guestUid, googleUser.uid);
      if (migratedGoogleKobanStyle) {
        void fetch('/api/koban-style', {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            'X-User-Uid': googleUser.uid,
          },
          body: JSON.stringify(migratedGoogleKobanStyle),
        }).catch(() => {});
      }
      const carriedGoogleEquipped = {
        ...(guestCachedGoogleCustom.equipped || {}),
        ...(snapshotGuestProfile.equipped || {}),
        ...(guestGoogleWalletSnap?.equipped || {}),
      };
      if (guestGoogleWalletSnap) {
        writeOptimisticWalletSnapshot(googleUser.uid, {
          balance: guestGoogleWalletSnap.balance,
          equipped: carriedGoogleEquipped,
          owned: guestGoogleWalletSnap.owned,
        });
      }

      const upgradedProfileDoc: UserProfile = {
        uid: googleUser.uid,
        email: (googleUser.email || '').toLowerCase(),
        displayName: guestUsername,
        name: googleUser.displayName || guestUsername,
        username: guestUsername,
        photoURL: snapshotGuestProfile.photoURL || guestCachedGoogleCustom.photoURL || null,
        shortId: upgData?.shortId || snapshotGuestProfile.shortId || deriveFallbackShortId(googleUser.uid),
        role: 'student',
        plan: 'free',
        status: 'active',
        isGuest: false,
        accountType: 'registered',
        profileCompleted: true,
        onboardingCompleted: true,
        targetUniversity:
          upgData?.targetUniversity || snapshotGuestProfile.targetUniversity || 'General Prep',
        testsCompleted: Number(
          upgData?.testsCompleted ?? snapshotGuestProfile.testsCompleted ?? 0
        ),
        totalQuestionsSolved: Number(
          upgData?.totalQuestionsSolved ?? snapshotGuestProfile.totalQuestionsSolved ?? 0
        ),
        streak: Number(upgData?.streak ?? snapshotGuestProfile.streak ?? 0),
        ...(Object.keys(carriedGoogleEquipped).length > 0 ? { equipped: carriedGoogleEquipped } : {}),
        ...(snapshotGuestProfile.avatarId || guestCachedGoogleCustom.avatarId
          ? { avatarId: snapshotGuestProfile.avatarId || guestCachedGoogleCustom.avatarId }
          : {}),
      };

      try {
        localStorage.setItem(
          `cached_profile_${googleUser.uid}`,
          JSON.stringify({ ...guestCachedGoogleCustom, ...upgradedProfileDoc })
        );
      } catch {
        // Ignore
      }

      const { role: _r2, plan: _p2, status: _s2, ...safeUpgradedGoogleDoc } = upgradedProfileDoc;
      await setDoc(
        doc(db, 'users', googleUser.uid),
        {
          ...safeUpgradedGoogleDoc,
          emailVerified: true,
          upgradedFromGuestUid: guestUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});

      if (
        Object.keys(carriedGoogleEquipped).length > 0 ||
        (guestGoogleWalletSnap?.owned?.length ?? 0) > 0
      ) {
        await setDoc(
          doc(db, 'wallets', googleUser.uid),
          {
            equipped: carriedGoogleEquipped,
            ...(guestGoogleWalletSnap?.owned ? { owned: guestGoogleWalletSnap.owned } : {}),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }

      await setDoc(
        doc(db, 'publicProfiles', googleUser.uid),
        {
          uid: googleUser.uid,
          displayName: guestUsername,
          username: guestUsername,
          studentId: upgradedProfileDoc.shortId,
          role: 'student',
          ...(Object.keys(carriedGoogleEquipped).length > 0 ? { equipped: carriedGoogleEquipped } : {}),
          stats: {
            streak: upgradedProfileDoc.streak || 0,
            testsCompleted: upgradedProfileDoc.testsCompleted || 0,
            totalQuestionsSolved: upgradedProfileDoc.totalQuestionsSolved || 0,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});

      if (Array.isArray(upgData?.attempts)) {
        for (const rawAtt of upgData.attempts) {
          if (rawAtt && typeof rawAtt === 'object') {
            const attId = String(rawAtt.id || rawAtt.attemptId || '');
            if (attId) {
              await setDoc(
                doc(db, 'attempts', attId),
                {
                  ...rawAtt,
                  id: attId,
                  uid: googleUser.uid,
                  userId: googleUser.uid,
                  upgradedFromGuestUid: guestUid,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ).catch(() => {});
            }
          }
        }
      }

      try {
        localStorage.removeItem(GUEST_TOKEN_LS_KEY);
        localStorage.setItem('boardly_user_authenticated', 'true');
      } catch {
        // Ignore
      }
      setStoredGuestSessionToken(null);
      setGuestSessionToken(null);
      setUser(googleUser);
      setProfile(upgradedProfileDoc);
      setOtpVerificationState({
        status: 'verified',
        purpose: null,
        email: googleUser.email || '',
        maskedEmail: maskEmailClient(googleUser.email || ''),
        cooldownSeconds: 0,
        error: null,
      });
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Could not upgrade guest account with Google.',
      };
    }
  }, [isGuest, profile, guestSessionToken]);

  // ── Auth actions ─────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (identifier: string, password: string) => {
      setAuthError(null);
      const rawIdentifier = identifier.trim();
      const genericMsg = 'Invalid username/email or password';

      // Clear any previous guest token in local storage when explicitly logging into a registered account
      try {
        localStorage.removeItem(GUEST_TOKEN_LS_KEY);
      } catch {
        // Ignore storage errors
      }
      setStoredGuestSessionToken(null);
      setGuestSessionToken(null);

      let loggedInUser: User;

      if (!rawIdentifier.includes('@')) {
        // Username login: resolve username -> email and verify password on the server (`/api/auth/login-username`)
        // without EVER exposing the account's email to the browser!
        const res = await fetch('/api/auth/login-username', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: rawIdentifier,
            password,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !data?.tokenResponse?.idToken) {
          const isRateLimited = res.status === 429 || data?.code === 'RATE_LIMITED';
          const err: any = new Error(
            isRateLimited
              ? data?.error || 'Too many login attempts. Please wait a few minutes and try again.'
              : genericMsg
          );
          err.code = isRateLimited ? 'auth/too-many-requests' : 'auth/invalid-credential';
          setAuthError({ code: err.code, message: err.message });
          throw err;
        }

        const serverTokenResponse = data.tokenResponse;
        const customCredential = {
          providerId: 'password',
          signInMethod: 'password',
          toJSON: () => ({}),
          _getIdTokenResponse: async () => serverTokenResponse,
          _linkToIdToken: async () => serverTokenResponse,
          _reauthenticateWithIdToken: async () => serverTokenResponse,
        };

        try {
          const credential = await signInWithCredential(auth, customCredential as any);
          loggedInUser = credential.user;
        } catch {
          const err: any = new Error(genericMsg);
          err.code = 'auth/invalid-credential';
          setAuthError({ code: err.code, message: err.message });
          throw err;
        }
      } else {
        // Email login
        const cleanEmail = rawIdentifier.toLowerCase();
        try {
          const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
          loggedInUser = credential.user;
        } catch (firebaseErr: any) {
          const fCode = String(firebaseErr?.code || '');
          if (fCode === 'auth/too-many-requests') {
            throw firebaseErr;
          }
          // Enforce identical generic error message for wrong email / wrong password
          const err: any = new Error(genericMsg);
          err.code = 'auth/invalid-credential';
          setAuthError({ code: err.code, message: err.message });
          throw err;
        }
      }

      await evaluateUserVerificationGate(loggedInUser, true);
      await loadProfile(loggedInUser).catch(() => {});
    },
    [evaluateUserVerificationGate, loadProfile]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string, username?: string) => {
      setAuthError(null);

      // 1. Validate & pre-check username before creating Firebase user
      const rawUsername = String(username || '').trim();
      const formatCheck = validateUsernameFormat(rawUsername);
      if (!formatCheck.valid) {
        const err: any = new Error(formatCheck.reason || 'Please enter a valid username.');
        err.code = 'INVALID_USERNAME_FORMAT';
        setAuthError({ code: err.code, message: err.message });
        throw err;
      }

      const preCheck = await checkUsernameAvailability(formatCheck.clean);
      if (!preCheck.available) {
        const err: any = new Error(preCheck.reason || 'This username is already taken.');
        err.code = preCheck.code || 'USERNAME_TAKEN';
        setAuthError({ code: err.code, message: err.message });
        throw err;
      }

      try {
        localStorage.removeItem(GUEST_TOKEN_LS_KEY);
      } catch {
        // Ignore storage errors
      }
      setStoredGuestSessionToken(null);
      setGuestSessionToken(null);

      const cleanEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const { user: newUser } = credential;

      // 2. Atomically reserve the username in D1 `user_usernames` with the new user's UID & email.
      // If reservation fails (e.g. simultaneous signup race condition), roll back by deleting the Firebase user!
      try {
        const idToken = await newUser.getIdToken();
        const regRes = await fetch('/api/auth/username-register', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: newUser.uid,
            username: formatCheck.clean,
            email: cleanEmail,
            accountType: 'registered',
          }),
        });
        const regData = await regRes.json().catch(() => ({}));
        if (!regRes.ok || !regData?.ok) {
          await deleteUser(newUser).catch(() => {});
          await firebaseSignOut(auth).catch(() => {});
          const err: any = new Error(
            regData?.error || 'That username was just taken. Please choose another username.'
          );
          err.code = regData?.code || 'USERNAME_TAKEN';
          setAuthError({ code: err.code, message: err.message });
          throw err;
        }
      } catch (reserveErr: any) {
        if (reserveErr?.code === 'USERNAME_TAKEN' || reserveErr?.code === 'USERNAME_TAKEN_OR_SIMILAR' || reserveErr?.code === 'INVALID_USERNAME_FORMAT') {
          throw reserveErr;
        }
        await deleteUser(newUser).catch(() => {});
        await firebaseSignOut(auth).catch(() => {});
        const err: any = new Error(
          reserveErr?.message || 'Could not reserve username. Please try again.'
        );
        err.code = 'USERNAME_RESERVATION_FAILED';
        setAuthError({ code: err.code, message: err.message });
        throw err;
      }

      try {
        localStorage.removeItem('boardly_user_authenticated');
      } catch {
        // Ignore storage errors
      }

      setOtpVerificationState({
        status: 'pending',
        purpose: 'signup',
        email: cleanEmail,
        maskedEmail: maskEmailClient(cleanEmail),
        cooldownSeconds: 60,
        error: null,
      });

      // Resolve and save displayName immediately
      const resolvedName =
        displayName?.trim() ||
        formatCheck.clean ||
        (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Student');

      try {
        await firebaseUpdateProfile(newUser, { displayName: resolvedName });
      } catch (err) {
        console.warn('Could not update Firebase Auth profile displayName:', err);
      }

      // Clean up any leftover orphan profile records with the same email under an old UID
      try {
        const orphanPubSnap = await getDocs(
          query(collection(db, 'publicProfiles'), where('email', '==', cleanEmail))
        ).catch(() => null);
        if (orphanPubSnap && !orphanPubSnap.empty) {
          for (const d of orphanPubSnap.docs) {
            if (d.id !== newUser.uid) {
              await deleteDoc(doc(db, 'publicProfiles', d.id)).catch(() => {});
              await deleteDoc(doc(db, 'users', d.id)).catch(() => {});
            }
          }
        }
      } catch {
        // Non-fatal orphan cleanup
      }

      // Write the initial user document with username and emailVerified: false
      const userDocRef = doc(db, 'users', newUser.uid);
      await withTimeout(
        setDoc(
          userDocRef,
          {
            uid: newUser.uid,
            name: resolvedName,
            displayName: resolvedName,
            username: formatCheck.clean,
            usernameLower: formatCheck.normalized,
            email: cleanEmail,
            photoURL: null,
            role: 'student',
            plan: 'free',
            status: 'active',
            deleted: false,
            emailVerified: false,
            onboardingCompleted: false,
            legalDocumentVersion: LEGAL_DOCUMENT_VERSION,
            termsAcceptedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        6000
      );

      void recordLegalConsentOnServer({
        userId: newUser.uid,
        accountType: 'registered',
        actionContext: 'email_signup',
        documentVersion: LEGAL_DOCUMENT_VERSION,
      });

      // Send 6-digit verification code + fallback link via Worker + Resend
      await requestOtpCodeForUser(newUser, {
        purpose: 'signup',
        forceResend: false,
      });

      createReferralDoc(newUser.uid, cleanEmail).catch(() => {});
    },
    [checkUsernameAvailability, createReferralDoc, requestOtpCodeForUser]
  );

  // ── Pure popup-only Google sign-in (no redirects, no device branching) ───
  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    try {
      localStorage.removeItem(GUEST_TOKEN_LS_KEY);
    } catch {
      // Ignore storage errors
    }
    setStoredGuestSessionToken(null);
    setGuestSessionToken(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // ONLY signInWithPopup - modern mobile browsers support popup on direct user tap
      const credential = await signInWithPopup(auth, provider);
      if (credential?.user) {
        setUser(credential.user);
        await evaluateUserVerificationGate(credential.user, true);
        // Load profile with timeout; non-fatal if Firestore rules are slow
        try {
          await loadProfile(credential.user);
        } catch (dbErr) {
          console.warn('[Boardly Auth] Profile sync issue during Google sign-in:', dbErr);
        }
        return credential.user;
      }
      return null;
    } catch (popupErr: unknown) {
      const fe = popupErr as { code?: string; message?: string };

      // 1. User intentionally closed or cancelled popup window
      if (
        fe.code === 'auth/popup-closed-by-user' ||
        fe.code === 'auth/cancelled-popup-request'
      ) {
        return null;
      }

      // 2. Popup blocked by browser
      if (fe.code === 'auth/popup-blocked') {
        const errPayload = {
          code: 'auth/popup-blocked',
          message:
            'The sign-in popup was blocked by your browser. Please tap "Continue with Google" again and choose "Allow" when prompted.',
        };
        setAuthError(errPayload);
        throw popupErr;
      }

      // 3. Other Firebase auth error (e.g. auth/unauthorized-domain, auth/network-request-failed)
      const errPayload = {
        code: fe.code || 'auth/popup-failed',
        message: fe.message || 'Google sign-in could not be completed.',
      };
      setAuthError(errPayload);
      throw popupErr;
    }
  }, [loadProfile, evaluateUserVerificationGate]);

  const executeForceSignOut = useCallback(async () => {
    if (inFlightSignOutRef.current) {
      return inFlightSignOutRef.current;
    }

    const doSignOut = async () => {
      isSigningOutRef.current = true;
      setIsSigningOut(true);
      if (typeof window !== 'undefined') {
        (window as any).__boardlySigningOut = true;
      }

      setAuthError(null);
      setProfileError(null);

      const savedGuestToken =
        guestSessionToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem(GUEST_TOKEN_LS_KEY) || getStoredGuestSessionToken() || ''
          : '') ||
        '';
      const currentUid = userRef.current?.uid || profileRef.current?.uid || auth.currentUser?.uid || '';
      const guestUid =
        isGuest || currentUid.startsWith('guest_') ? currentUid : '';

      if (guestUid) {
        signingOutGuestUidRef.current = guestUid;
      }

      // 1. Unsubscribe all Firestore & realtime listeners BEFORE signing out of Firebase
      //    so no listener fires a permission-denied error when auth.currentUser becomes null.
      try {
        teardownSharedUserProfile();
      } catch {
        // Ignore
      }
      try {
        teardownNotificationStore();
      } catch {
        // Ignore
      }
      try {
        teardownEffectivePlanListeners();
      } catch {
        // Ignore
      }

      // 2. Clear all cached user/guest state (localStorage, sessionStorage, SWR/query cache, in-memory state)
      clearOptimisticUserSnapshot();
      clearSecurityStatusCache(currentUid || null);
      invalidateSwrCache();
      setStoredGuestSessionToken(null);

      try {
        if (typeof window !== 'undefined') {
          const preservedTheme = window.localStorage.getItem('boardly-theme');
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (!key || key === 'boardly-theme') continue;
            if (
              key === 'boardly_user_authenticated' ||
              key === GUEST_TOKEN_LS_KEY ||
              key === 'boardly_guest_session_backup_v1' ||
              key === 'boardly_last_known_user_v1' ||
              key === 'boardly_last_known_wallet_v1' ||
              key.startsWith('cached_profile_') ||
              key.startsWith('boardly_user_profile_') ||
              key.startsWith('boardly_swr_v2:') ||
              key.startsWith('boardly_read_notifs_v2_') ||
              key.startsWith('boardly_security_status_') ||
              key.startsWith('boardly_plan_cache_') ||
              key.startsWith('boardly_wallet_') ||
              key.startsWith('firebase:authUser:')
            ) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => window.localStorage.removeItem(k));
          if (preservedTheme) {
            window.localStorage.setItem('boardly-theme', preservedTheme);
          }

          window.sessionStorage.removeItem('boardly_post_login_redirect');
          window.sessionStorage.removeItem(GUEST_TOKEN_LS_KEY);
          window.sessionStorage.removeItem('boardly_guest_session_backup_v1');
          const sessionKeysToRemove: string[] = [];
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const sk = window.sessionStorage.key(i);
            if (
              sk &&
              (sk.startsWith('boardly_') ||
                sk.startsWith('cached_') ||
                sk.startsWith('firebase:'))
            ) {
              sessionKeysToRemove.push(sk);
            }
          }
          sessionKeysToRemove.forEach((sk) => window.sessionStorage.removeItem(sk));
        }
      } catch {
        // Ignore storage errors
      }

      setGuestSessionToken(null);
      setActiveGrants([]);
      setTokenClaims({ superAdmin: false, admin: false, captain: false, verified: false });
      setOtpVerificationState({
        status: 'idle',
        purpose: null,
        email: '',
        maskedEmail: '',
        cooldownSeconds: 0,
        error: null,
      });
      setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
      setShowGuestLogoutConfirm(false);
      setGuestLogoutLoading(false);
      setUser(null);
      setProfile(null);
      setProfileLoading(false);

      // 3. Best-effort server session / cookie revocation AND awaited Firebase signOut with timeouts
      //    Always call /api/auth/guest/logout (even for email/Google/admin users) so any lingering
      //    HttpOnly `boardly_guest_session` cookie is cleared and can never resurrect a guest session.
      try {
        await Promise.all([
          Promise.race([
            fetch('/api/auth/guest/logout', {
              method: 'POST',
              credentials: 'include',
              keepalive: true,
              headers: {
                'Content-Type': 'application/json',
                ...(savedGuestToken ? { 'X-Guest-Session': savedGuestToken } : {}),
              },
              body: JSON.stringify({ uid: guestUid }),
            }).catch(() => null),
            new Promise((resolve) => setTimeout(resolve, 1500)),
          ]),
          Promise.race([
            firebaseSignOut(auth).catch(() => null),
            new Promise((resolve) => setTimeout(resolve, 2500)),
          ]),
        ]);
      } catch {
        // Never allow cleanup errors to block or abort sign-out
      } finally {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('boardly_user_authenticated');
            window.localStorage.removeItem(GUEST_TOKEN_LS_KEY);
            window.localStorage.removeItem('boardly_guest_session_backup_v1');
            window.sessionStorage.removeItem('boardly_post_login_redirect');
            window.sessionStorage.removeItem(GUEST_TOKEN_LS_KEY);
            window.sessionStorage.removeItem('boardly_guest_session_backup_v1');
          }
        } catch {
          // Ignore
        }
        setStoredGuestSessionToken(null);
        setGuestSessionToken(null);
        setUser(null);
        setProfile(null);
        setAuthError(null);
        setProfileError(null);
        if (signingOutGuestUidRef.current === guestUid) {
          signingOutGuestUidRef.current = null;
        }
        isSigningOutRef.current = false;
        setIsSigningOut(false);
        if (typeof window !== 'undefined') {
          (window as any).__boardlySigningOut = false;
        }
      }
    };

    const p = doSignOut().finally(() => {
      inFlightSignOutRef.current = null;
    });
    inFlightSignOutRef.current = p;
    return p;
  }, [guestSessionToken, isGuest]);

  const signOutUser = useCallback(
    async (opts?: { force?: boolean; confirmGuest?: boolean }) => {
      if (isGuest && opts?.confirmGuest === true && !opts?.force) {
        setShowGuestLogoutConfirm(true);
        return new Promise<void>((resolve) => {
          pendingGuestLogoutResolversRef.current.push(resolve);
        });
      }
      await executeForceSignOut();
    },
    [isGuest, executeForceSignOut]
  );

  // Listen for expired/invalid guest session event from API layer and treat as signed-out cleanly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onGuestExpired = () => {
      if (!isSigningOutRef.current) {
        void executeForceSignOut();
      }
    };
    window.addEventListener('boardly:guest-expired', onGuestExpired);
    return () => window.removeEventListener('boardly:guest-expired', onGuestExpired);
  }, [executeForceSignOut]);

  const handleConfirmGuestLogout = useCallback(async () => {
    setGuestLogoutLoading(true);
    setShowGuestLogoutConfirm(false);
    try {
      await executeForceSignOut();
      const resolvers = [...pendingGuestLogoutResolversRef.current];
      pendingGuestLogoutResolversRef.current = [];
      for (const r of resolvers) {
        try {
          r();
        } catch {
          // Ignore
        }
      }
    } finally {
      setGuestLogoutLoading(false);
    }
  }, [executeForceSignOut]);

  const handleCancelGuestLogout = useCallback(() => {
    if (guestLogoutLoading) return;
    setShowGuestLogoutConfirm(false);
    pendingGuestLogoutResolversRef.current = [];
  }, [guestLogoutLoading]);

  const handleCreateAccountFromGuestLogout = useCallback(() => {
    if (guestLogoutLoading) return;
    setShowGuestLogoutConfirm(false);
    pendingGuestLogoutResolversRef.current = [];
    setShowGuestUpgradeFromLogout(true);
  }, [guestLogoutLoading]);

  const sendVerificationEmail = useCallback(async () => {
    if (user && !isGuest) {
      await requestOtpCodeForUser(user, {
        purpose: 'signup',
        forceResend: true,
      });
    }
  }, [user, isGuest, requestOtpCodeForUser]);

  const resetPassword = useCallback(async (email: string) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // Call sendPasswordResetEmail WITHOUT restrictive continueUrl first to avoid
      // Firebase Identity Toolkit internal error -26 (auth/error-code:-26) on auth.boardly.cfd
      await withTimeout(
        sendPasswordResetEmail(auth, cleanEmail),
        12000,
        'Password reset request timed out.'
      );
      return;
    } catch (sdkErr: any) {
      const code = String(sdkErr?.code || '');
      const msg = String(sdkErr?.message || '');

      // If Firebase explicitly reports user-not-found or invalid-email, rethrow immediately
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        throw sdkErr;
      }

      // For auth/error-code:-26, unauthorized-continue-uri, or custom authDomain errors,
      // fallback to the server-side Identity Toolkit endpoint
      if (
        code.includes('-26') ||
        msg.includes('-26') ||
        code.includes('continue-uri') ||
        code === 'auth/internal-error' ||
        code === 'auth/network-request-failed'
      ) {
        const resp = await fetch('/api/auth/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.success) {
          const fallbackErr: any = new Error(
            data?.error || 'Could not send password reset email.'
          );
          fallbackErr.code = data?.code || code || 'auth/error-code:-26';
          throw fallbackErr;
        }
        return;
      }

      throw sdkErr;
    }
  }, []);

  const retryProfile = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const clearProfileError = useCallback(() => {
    setProfileError(null);
  }, []);

  const updateLocalProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : ({ ...updates } as UserProfile)));
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      updateLocalProfile(updates);
      if (isGuest) {
        await syncGuestProgress({
          testsCompleted: updates.testsCompleted,
          totalQuestionsSolved: updates.totalQuestionsSolved,
          streak: updates.streak,
          targetUniversity: updates.targetUniversity || undefined,
        });
        return;
      }
      if (user) {
        if (updates.username) {
          const idToken = await user.getIdToken().catch(() => '');
          fetch('/api/auth/username-register', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              uid: user.uid,
              username: updates.username,
              email: (user.email || profile?.email || '').toLowerCase(),
              accountType: 'registered',
            }),
          }).catch(() => {});
        }
        try {
          const safeUpdates: Record<string, unknown> = { ...updates };
          for (const protectedKey of [
            'plan',
            'tier',
            'kobans',
            'kobanBalance',
            'role',
            'isCaptain',
            'isAmbassador',
            'isAdmin',
            'superAdmin',
            'isSuperAdmin',
            'claimsUpdatedAt',
            'proUntil',
            'paid_until',
            'planExpiresAt',
            'premiumExpiresAt',
            'isPremium',
            'proPlanId',
            'status',
          ]) {
            delete safeUpdates[protectedKey];
          }
          await withTimeout(
            setDoc(doc(db, 'users', user.uid), safeUpdates, { merge: true }),
            6000,
            'Profile update timed out.'
          );
        } catch (e) {
          console.warn('[Boardly] updateProfile error:', e);
        }
      }
    },
    [user, isGuest, profile?.email, updateLocalProfile, syncGuestProgress]
  );

  const handleSaveModalUsername = useCallback(
    async (chosenUsername: string): Promise<{ ok: boolean; error?: string }> => {
      const currentUser = auth.currentUser || user;
      if (!currentUser || isGuest) {
        return { ok: false, error: 'Please sign in first.' };
      }
      const formatCheck = validateUsernameFormat(chosenUsername);
      if (!formatCheck.valid) {
        return { ok: false, error: formatCheck.reason || 'Invalid username format.' };
      }
      try {
        const idToken = await currentUser.getIdToken();
        const res = await fetch('/api/auth/username-register', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: currentUser.uid,
            username: formatCheck.clean,
            email: (currentUser.email || profile?.email || '').toLowerCase(),
            accountType: 'registered',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          return {
            ok: false,
            error: data?.error || 'This username is already taken.',
          };
        }

        updateLocalProfile({ username: formatCheck.clean });
        await setDoc(
          doc(db, 'users', currentUser.uid),
          {
            username: formatCheck.clean,
            usernameLower: formatCheck.normalized,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
        await setDoc(
          doc(db, 'publicProfiles', currentUser.uid),
          {
            uid: currentUser.uid,
            username: formatCheck.clean,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});

        try {
          localStorage.setItem(`boardly_username_prompt_seen_${currentUser.uid}`, '1');
        } catch {
          // Ignore
        }
        setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Could not save username.' };
      }
    },
    [user, isGuest, profile?.email, updateLocalProfile]
  );

  const handleSkipModalUsername = useCallback(() => {
    const currentUid = auth.currentUser?.uid || user?.uid;
    if (currentUid) {
      try {
        localStorage.setItem(`boardly_username_prompt_seen_${currentUid}`, '1');
      } catch {
        // Ignore
      }
    }
    setUsernamePromptState({ open: false, allowSkip: false, suggested: '' });
  }, [user?.uid]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      profileLoading,
      profileError,
      authError,
      clearAuthError,
      clearProfileError,
      isAdmin,
      isSuperAdmin,
      isLimitedAdmin,
      isCaptain,
      tokenClaims,
      refreshTokenClaims,
      activeGrants,
      hasPermission,
      refreshActiveGrants,
      isGuest,
      guestSessionToken,
      isSessionVerified,
      otpVerificationState,
      requestOtpCode,
      verifyOtpCode,
      verifyFallbackEmailLink,
      refreshVerificationStatus,
      checkUsernameAvailability,
      signInAsGuest,
      syncGuestProgress,
      upgradeGuestWithEmail,
      upgradeGuestWithGoogle,
      signIn,
      signUp,
      signInWithGoogle,
      signOutUser,
      isSigningOut,
      sendVerificationEmail,
      resetPassword,
      retryProfile,
      getRoleRedirectUrl,
      updateProfile,
      updateLocalProfile,
    }),
    [
      user,
      profile,
      profileLoading,
      profileError,
      authError,
      clearAuthError,
      clearProfileError,
      isAdmin,
      isSuperAdmin,
      isLimitedAdmin,
      isCaptain,
      tokenClaims,
      refreshTokenClaims,
      activeGrants,
      hasPermission,
      refreshActiveGrants,
      isGuest,
      guestSessionToken,
      isSessionVerified,
      otpVerificationState,
      requestOtpCode,
      verifyOtpCode,
      verifyFallbackEmailLink,
      refreshVerificationStatus,
      checkUsernameAvailability,
      signInAsGuest,
      syncGuestProgress,
      upgradeGuestWithEmail,
      upgradeGuestWithGoogle,
      signIn,
      signUp,
      signInWithGoogle,
      signOutUser,
      isSigningOut,
      sendVerificationEmail,
      resetPassword,
      retryProfile,
      getRoleRedirectUrl,
      updateProfile,
      updateLocalProfile,
    ]
  );

  const shouldRenderUsernameModal = Boolean(
    usernamePromptState.open &&
      !isGuest &&
      user &&
      isSessionVerified &&
      !profileLoading
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {showGuestLogoutConfirm && (
        <Suspense fallback={null}>
          <GuestLogoutConfirmModal
            isOpen={showGuestLogoutConfirm}
            username={profile?.username || profile?.displayName}
            loading={guestLogoutLoading}
            onCancel={handleCancelGuestLogout}
            onCreateAccount={handleCreateAccountFromGuestLogout}
            onConfirmLogout={handleConfirmGuestLogout}
          />
        </Suspense>
      )}
      {showGuestUpgradeFromLogout && (
        <Suspense fallback={null}>
          <GuestUpgradeModal
            isOpen={showGuestUpgradeFromLogout}
            onClose={() => setShowGuestUpgradeFromLogout(false)}
            defaultReason="Create a free account to keep your username, progress, and test attempts permanently."
          />
        </Suspense>
      )}
      {shouldRenderUsernameModal && (
        <Suspense fallback={null}>
          <ChooseUsernameModal
            isOpen={shouldRenderUsernameModal}
            initialSuggestion={usernamePromptState.suggested}
            allowSkip={usernamePromptState.allowSkip}
            onSkip={handleSkipModalUsername}
            onCheckAvailability={checkUsernameAvailability}
            onSaveUsername={handleSaveModalUsername}
          />
        </Suspense>
      )}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

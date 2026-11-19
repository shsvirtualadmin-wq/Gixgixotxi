import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Fingerprint,
  History,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Mail,
  Pencil,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsPage } from './SettingsPage';
import { SettingsGroup } from './SettingsGroup';
import { SettingsRow } from './SettingsRow';
import { SettingsToggleRow } from './SettingsToggleRow';
import { SettingsConfirmSheet, SettingsSheet } from './SettingsSheet';
import { SecuritySettingsSection } from '@/components/profile/SecuritySettingsSection';
import {
  deletePasskey,
  fetchSecurityEvents,
  fetchSecuritySummary,
  isWebAuthnSupported,
  listPasskeys,
  listSessions,
  listTrustedDevices,
  logClientSecurityEvent,
  registerPasskey,
  removeTrustedDevice,
  renamePasskey,
  revokeAllSessions,
  revokeSession,
  type ActiveSessionItem,
  type PasskeyItem,
  type SecurityEventItem,
  type SecuritySummary,
  type TrustedDeviceItem,
} from '@/services/securityCenterService';
import {
  checkDeviceUnlockSupport,
  disableDeviceUnlock,
  enableDeviceUnlock,
  getDeviceUnlockConfig,
} from '@/services/deviceUnlockService';
import { clearCachedAuthAndAdminStorage } from '@/components/dashboard/HamburgerMenuSheet';
import { getDisplayName } from '@/utils/displayName';
import { readSwrCache, writeSwrCache } from '@/utils/userStateSource';

export type SecuritySubView =
  | 'overview'
  | 'passkeys'
  | 'mfa'
  | 'sessions'
  | 'trusted-devices'
  | 'history'
  | 'password';

function formatRelativeTime(ms: number | null | undefined): string {
  if (!ms) return 'Never used';
  const diff = Math.max(0, Date.now() - ms);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const InlineErrorCard: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div
    className="mb-6 flex items-center justify-between gap-3 rounded-[24px] px-5 py-4"
    style={{
      backgroundColor: 'var(--card)',
      border: '1px solid var(--danger-border)',
    }}
    role="alert"
  >
    <div className="flex min-w-0 items-center gap-3">
      <AlertCircle className="h-5 w-5 shrink-0" style={{ color: 'var(--danger)' }} />
      <p className="text-[14px] leading-snug" style={{ color: 'var(--text)' }}>
        {message}
      </p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold cursor-pointer"
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        color: 'var(--accent)',
      }}
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </button>
  </div>
);

const SkeletonRowsCard: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div
    className="mb-6 overflow-hidden rounded-[32px] p-5"
    style={{
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
    }}
    aria-busy="true"
  >
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded-full" style={{ backgroundColor: 'var(--skeleton)' }} />
            <div className="h-3 w-56 rounded-full" style={{ backgroundColor: 'var(--skeleton)' }} />
          </div>
          <div className="h-4 w-12 rounded-full" style={{ backgroundColor: 'var(--skeleton)' }} />
        </div>
      ))}
    </div>
  </div>
);

export interface SecurityCenterPagesProps {
  onBack: () => void;
  scrollContainer?: 'window' | 'self';
  onSummaryChange?: (summary: SecuritySummary | null) => void;
}

export const SecurityCenterPages: React.FC<SecurityCenterPagesProps> = ({
  onBack,
  scrollContainer = 'window',
  onSummaryChange,
}) => {
  const { user, profile, isGuest, signOutUser } = useAuth();
  const [subView, setSubView] = useState<SecuritySubView>('overview');

  const uid = user?.uid || '';

  // Overview summary state (hydrated instantly from SWR cache)
  const [summary, setSummary] = useState<SecuritySummary | null>(() =>
    uid ? readSwrCache<SecuritySummary>(`sec:summary:${uid}`) : null
  );
  const [summaryLoading, setSummaryLoading] = useState<boolean>(() =>
    uid ? !readSwrCache<SecuritySummary>(`sec:summary:${uid}`) : false
  );
  const [summaryRowSpinner, setSummaryRowSpinner] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Device unlock per-device state
  const [unlockSupport, setUnlockSupport] = useState<{ supported: boolean; reason: string }>({
    supported: false,
    reason: 'Checking device capabilities…',
  });
  const [unlockEnabled, setUnlockEnabled] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Danger zone sheets
  const [suspendSheetOpen, setSuspendSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [dangerPassword, setDangerPassword] = useState('');
  const [dangerBusy, setDangerBusy] = useState(false);
  const [dangerError, setDangerError] = useState<string | null>(null);

  // Passkeys sub-view state (SWR cached)
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>(
    () => (uid ? readSwrCache<PasskeyItem[]>(`sec:passkeys:${uid}`) : null) || []
  );
  const [passkeysLoadedOnce, setPasskeysLoadedOnce] = useState<boolean>(() =>
    Boolean(uid && readSwrCache<PasskeyItem[]>(`sec:passkeys:${uid}`))
  );
  const [passkeysLoading, setPasskeysLoading] = useState(false);
  const [passkeysError, setPasskeysError] = useState<string | null>(null);
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [renamingPasskey, setRenamingPasskey] = useState<PasskeyItem | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deletingPasskey, setDeletingPasskey] = useState<PasskeyItem | null>(null);
  const [passkeyBusy, setPasskeyBusy] = useState(false);

  // Active sessions sub-view state (SWR cached)
  const [sessions, setSessions] = useState<ActiveSessionItem[]>(
    () => (uid ? readSwrCache<ActiveSessionItem[]>(`sec:sessions:${uid}`) : null) || []
  );
  const [sessionsLoadedOnce, setSessionsLoadedOnce] = useState<boolean>(() =>
    Boolean(uid && readSwrCache<ActiveSessionItem[]>(`sec:sessions:${uid}`))
  );
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [confirmSession, setConfirmSession] = useState<ActiveSessionItem | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);

  // Trusted devices sub-view state (SWR cached)
  const [trustedDevices, setTrustedDevices] = useState<TrustedDeviceItem[]>(
    () => (uid ? readSwrCache<TrustedDeviceItem[]>(`sec:devices:${uid}`) : null) || []
  );
  const [devicesLoadedOnce, setDevicesLoadedOnce] = useState<boolean>(() =>
    Boolean(uid && readSwrCache<TrustedDeviceItem[]>(`sec:devices:${uid}`))
  );
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [confirmDevice, setConfirmDevice] = useState<TrustedDeviceItem | null>(null);
  const [confirmRemoveAllDevices, setConfirmRemoveAllDevices] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);

  // Security history sub-view state (SWR cached)
  const [events, setEvents] = useState<SecurityEventItem[]>(
    () => (uid ? readSwrCache<SecurityEventItem[]>(`sec:events:${uid}`) : null) || []
  );
  const [eventsLoadedOnce, setEventsLoadedOnce] = useState<boolean>(() =>
    Boolean(uid && readSwrCache<SecurityEventItem[]>(`sec:events:${uid}`))
  );
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsHasMore, setEventsHasMore] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsLoadingMore, setEventsLoadingMore] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Change password sub-view state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const loadSummary = useCallback(async () => {
    if (!user || isGuest) {
      setSummaryLoading(false);
      setSummaryRowSpinner(false);
      return;
    }
    const cached = readSwrCache<SecuritySummary>(`sec:summary:${user.uid}`);
    if (cached) {
      setSummary(cached);
      setSummaryLoading(false);
      setSummaryRowSpinner(false);
    } else {
      setSummaryLoading(true);
      setSummaryRowSpinner(true);
    }
    setSummaryError(null);

    // Cap row spinner visibility at 900ms so no row ever shows a spinner longer than 1s
    const spinnerCap = window.setTimeout(() => {
      setSummaryRowSpinner(false);
    }, 900);

    try {
      const data = await fetchSecuritySummary();
      writeSwrCache(`sec:summary:${user.uid}`, data);
      setSummary(data);
      onSummaryChange?.(data);
    } catch (err: any) {
      setSummaryError(err?.message || 'Could not load security summary.');
    } finally {
      window.clearTimeout(spinnerCap);
      setSummaryLoading(false);
      setSummaryRowSpinner(false);
    }
  }, [user, isGuest, onSummaryChange]);

  // Parallel SWR prefetch on Security overview mount so passkeys, sessions, and trusted devices open instantly
  useEffect(() => {
    if (!user?.uid || isGuest) {
      setSummaryLoading(false);
      return;
    }
    let active = true;
    const targetUid = user.uid;

    const cachedSummary = readSwrCache<SecuritySummary>(`sec:summary:${targetUid}`);
    const cachedPasskeys = readSwrCache<PasskeyItem[]>(`sec:passkeys:${targetUid}`);
    const cachedSessions = readSwrCache<ActiveSessionItem[]>(`sec:sessions:${targetUid}`);
    const cachedDevices = readSwrCache<TrustedDeviceItem[]>(`sec:devices:${targetUid}`);
    if (cachedSummary) {
      setSummary(cachedSummary);
      setSummaryLoading(false);
      setSummaryRowSpinner(false);
    } else {
      setSummaryLoading(true);
      setSummaryRowSpinner(true);
    }
    if (cachedPasskeys) {
      setPasskeys(cachedPasskeys);
      setPasskeysLoadedOnce(true);
    }
    if (cachedSessions) {
      setSessions(cachedSessions);
      setSessionsLoadedOnce(true);
    }
    if (cachedDevices) {
      setTrustedDevices(cachedDevices);
      setDevicesLoadedOnce(true);
    }

    const spinnerCap = window.setTimeout(() => {
      if (active) setSummaryRowSpinner(false);
    }, 900);

    void Promise.allSettled([
      fetchSecuritySummary(),
      listPasskeys(),
      listSessions(),
      listTrustedDevices(),
    ]).then(([sumRes, pkRes, sesRes, devRes]) => {
      window.clearTimeout(spinnerCap);
      if (!active) return;

      if (sumRes.status === 'fulfilled') {
        writeSwrCache(`sec:summary:${targetUid}`, sumRes.value);
        setSummary(sumRes.value);
        onSummaryChange?.(sumRes.value);
        setSummaryError(null);
      } else {
        setSummaryError(sumRes.reason?.message || 'Could not load security summary.');
      }
      setSummaryLoading(false);
      setSummaryRowSpinner(false);

      if (pkRes.status === 'fulfilled') {
        writeSwrCache(`sec:passkeys:${targetUid}`, pkRes.value);
        setPasskeys(pkRes.value);
        setPasskeysLoadedOnce(true);
      }
      if (sesRes.status === 'fulfilled') {
        writeSwrCache(`sec:sessions:${targetUid}`, sesRes.value.sessions);
        setSessions(sesRes.value.sessions);
        setSessionsLoadedOnce(true);
      }
      if (devRes.status === 'fulfilled') {
        writeSwrCache(`sec:devices:${targetUid}`, devRes.value);
        setTrustedDevices(devRes.value);
        setDevicesLoadedOnce(true);
      }
    });

    return () => {
      active = false;
      window.clearTimeout(spinnerCap);
    };
  }, [user?.uid, isGuest, onSummaryChange]);

  useEffect(() => {
    let active = true;
    void checkDeviceUnlockSupport().then((res) => {
      if (active) setUnlockSupport(res);
    });
    setUnlockEnabled(Boolean(getDeviceUnlockConfig(user?.uid)?.enabled));
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const loadPasskeys = useCallback(async () => {
    const hasCached = Boolean(uid && readSwrCache<PasskeyItem[]>(`sec:passkeys:${uid}`));
    if (!hasCached && !passkeysLoadedOnce) setPasskeysLoading(true);
    setPasskeysError(null);
    try {
      const list = await listPasskeys();
      if (uid) writeSwrCache(`sec:passkeys:${uid}`, list);
      setPasskeys(list);
      setPasskeysLoadedOnce(true);
    } catch (err: any) {
      setPasskeysError(err?.message || 'Could not load passkeys.');
    } finally {
      setPasskeysLoading(false);
    }
  }, [uid, passkeysLoadedOnce]);

  const loadSessions = useCallback(async () => {
    const hasCached = Boolean(uid && readSwrCache<ActiveSessionItem[]>(`sec:sessions:${uid}`));
    if (!hasCached && !sessionsLoadedOnce) setSessionsLoading(true);
    setSessionsError(null);
    try {
      const res = await listSessions();
      if (uid) writeSwrCache(`sec:sessions:${uid}`, res.sessions);
      setSessions(res.sessions);
      setSessionsLoadedOnce(true);
    } catch (err: any) {
      setSessionsError(err?.message || 'Could not load active sessions.');
    } finally {
      setSessionsLoading(false);
    }
  }, [uid, sessionsLoadedOnce]);

  const loadTrustedDevices = useCallback(async () => {
    const hasCached = Boolean(uid && readSwrCache<TrustedDeviceItem[]>(`sec:devices:${uid}`));
    if (!hasCached && !devicesLoadedOnce) setDevicesLoading(true);
    setDevicesError(null);
    try {
      const list = await listTrustedDevices();
      if (uid) writeSwrCache(`sec:devices:${uid}`, list);
      setTrustedDevices(list);
      setDevicesLoadedOnce(true);
    } catch (err: any) {
      setDevicesError(err?.message || 'Could not load trusted devices.');
    } finally {
      setDevicesLoading(false);
    }
  }, [uid, devicesLoadedOnce]);

  const loadHistory = useCallback(async (page = 1, append = false) => {
    const hasCached = Boolean(uid && readSwrCache<SecurityEventItem[]>(`sec:events:${uid}`));
    if (append) setEventsLoadingMore(true);
    else if (!hasCached && !eventsLoadedOnce) setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await fetchSecurityEvents(page, 20);
      setEvents((prev) => {
        const next = append ? [...prev, ...res.events] : res.events;
        if (uid && !append) writeSwrCache(`sec:events:${uid}`, next);
        return next;
      });
      setEventsLoadedOnce(true);
      setEventsPage(res.page);
      setEventsHasMore(res.hasMore);
    } catch (err: any) {
      setEventsError(err?.message || 'Could not load security history.');
    } finally {
      setEventsLoading(false);
      setEventsLoadingMore(false);
    }
  }, [uid, eventsLoadedOnce]);

  useEffect(() => {
    if (subView === 'passkeys') void loadPasskeys();
    else if (subView === 'sessions') void loadSessions();
    else if (subView === 'trusted-devices') void loadTrustedDevices();
    else if (subView === 'history') void loadHistory(1, false);
  }, [subView, loadPasskeys, loadSessions, loadTrustedDevices, loadHistory]);

  const handleToggleDeviceUnlock = async (next: boolean) => {
    if (!user?.uid || unlockBusy) return;
    setUnlockBusy(true);
    try {
      if (next) {
        await enableDeviceUnlock(user.uid, getDisplayName(profile, user.email || 'Boardly Student'));
        setUnlockEnabled(true);
        showToast('Device unlock enabled on this device.');
      } else {
        await disableDeviceUnlock(user.uid);
        setUnlockEnabled(false);
        showToast('Device unlock turned off.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not update device unlock.');
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleAddPasskey = async () => {
    if (addingPasskey) return;
    setAddingPasskey(true);
    setPasskeysError(null);
    try {
      const created = await registerPasskey();
      setPasskeys((prev) => [created, ...prev]);
      showToast(`Added passkey "${created.name}".`);
      void loadSummary();
    } catch (err: any) {
      setPasskeysError(err?.message || 'Could not add passkey.');
    } finally {
      setAddingPasskey(false);
    }
  };

  const handleSaveRenamePasskey = async () => {
    if (!renamingPasskey || !renameInput.trim()) return;
    setPasskeyBusy(true);
    try {
      await renamePasskey(renamingPasskey.id, renameInput.trim());
      setPasskeys((prev) =>
        prev.map((p) => (p.id === renamingPasskey.id ? { ...p, name: renameInput.trim() } : p))
      );
      setRenamingPasskey(null);
      showToast('Passkey renamed.');
    } catch (err: any) {
      setPasskeysError(err?.message || 'Could not rename passkey.');
    } finally {
      setPasskeyBusy(false);
    }
  };

  const handleConfirmDeletePasskey = async () => {
    if (!deletingPasskey) return;
    setPasskeyBusy(true);
    try {
      await deletePasskey(deletingPasskey.id);
      setPasskeys((prev) => prev.filter((p) => p.id !== deletingPasskey.id));
      setDeletingPasskey(null);
      showToast('Passkey removed.');
      void loadSummary();
    } catch (err: any) {
      setPasskeysError(err?.message || 'Could not remove passkey.');
    } finally {
      setPasskeyBusy(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!confirmSession) return;
    setSessionBusy(true);
    try {
      const res = await revokeSession(confirmSession.id);
      setConfirmSession(null);
      if (res.revokedCurrent) {
        await signOutUser();
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== confirmSession.id));
      showToast('Session signed out.');
      void loadSummary();
    } catch (err: any) {
      setSessionsError(err?.message || 'Could not sign out session.');
    } finally {
      setSessionBusy(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setSessionBusy(true);
    try {
      await revokeAllSessions(false);
      setConfirmLogoutAll(false);
      await signOutUser();
    } catch (err: any) {
      setSessionsError(err?.message || 'Could not sign out everywhere.');
    } finally {
      setSessionBusy(false);
    }
  };

  const handleRemoveTrustedDevice = async () => {
    if (!confirmDevice) return;
    setDeviceBusy(true);
    try {
      await removeTrustedDevice(confirmDevice.id);
      setTrustedDevices((prev) => prev.filter((d) => d.id !== confirmDevice.id));
      setConfirmDevice(null);
      showToast('Trusted device removed.');
      void loadSummary();
    } catch (err: any) {
      setDevicesError(err?.message || 'Could not remove trusted device.');
    } finally {
      setDeviceBusy(false);
    }
  };

  const handleRemoveAllTrustedDevices = async () => {
    setDeviceBusy(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Please sign in again.');
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch('/api/auth/2fa/devices/revoke-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timer));
      if (!res.ok) throw new Error('Could not remove all trusted devices.');
      setTrustedDevices([]);
      setConfirmRemoveAllDevices(false);
      showToast('All trusted devices removed.');
      void loadSummary();
    } catch (err: any) {
      setDevicesError(err?.message || 'Could not remove all trusted devices.');
    } finally {
      setDeviceBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (!user?.email) {
      setPwError('Password changes are only available for email/password accounts.');
      return;
    }
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwBusy(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      void logClientSecurityEvent('password_changed', 'Password updated in Security settings');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      showToast('Password updated.');
      setSubView('overview');
    } catch (err: any) {
      setPwError(
        err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : err?.message || 'Could not update password.'
      );
    } finally {
      setPwBusy(false);
    }
  };

  const handleSuspendAccount = async () => {
    if (!user) return;
    setDangerBusy(true);
    setDangerError(null);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          isSuspended: true,
          suspendedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      clearCachedAuthAndAdminStorage();
      setSuspendSheetOpen(false);
      await signOutUser();
    } catch (err: any) {
      setDangerError(err?.message || 'Could not suspend account.');
    } finally {
      setDangerBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDangerBusy(true);
    setDangerError(null);
    try {
      const hasPasswordProvider = user.providerData.some((p) => p.providerId === 'password');
      if (hasPasswordProvider && user.email) {
        if (!dangerPassword.trim()) {
          setDangerError('Enter your password to permanently delete your account.');
          setDangerBusy(false);
          return;
        }
        const cred = EmailAuthProvider.credential(user.email, dangerPassword);
        await reauthenticateWithCredential(user, cred);
      }
      await deleteDoc(doc(db, 'users', user.uid)).catch(() => {});
      await deleteDoc(doc(db, 'publicProfiles', user.uid)).catch(() => {});
      await deleteUser(user);
      clearCachedAuthAndAdminStorage();
      setDeleteSheetOpen(false);
    } catch (err: any) {
      setDangerError(
        err?.code === 'auth/requires-recent-login'
          ? 'Please sign out and sign in again before deleting your account.'
          : err?.message || 'Could not delete account.'
      );
    } finally {
      setDangerBusy(false);
    }
  };

  // ── SUB-VIEW: Passkeys & security keys ─────────────────────────────────────
  if (subView === 'passkeys') {
    const webAuthnReady = isWebAuthnSupported();
    return (
      <SettingsPage
        title="Passkeys & security keys"
        onBack={() => setSubView('overview')}
        scrollContainer={scrollContainer}
      >
        {passkeysError && (
          <InlineErrorCard message={passkeysError} onRetry={() => void loadPasskeys()} />
        )}

        <SettingsGroup
          helperText="Passkeys let you sign in with Face ID, Touch ID, Windows Hello, or a hardware security key without typing a password."
        >
          <SettingsRow
            icon={<KeyRound />}
            label={addingPasskey ? 'Creating passkey…' : 'Add a passkey'}
            subtitle={
              webAuthnReady
                ? 'Register this device or a security key'
                : 'Not supported on this browser'
            }
            value={webAuthnReady ? 'Add' : 'Unavailable'}
            actionValue={webAuthnReady}
            chevron="none"
            loading={addingPasskey}
            disabled={!webAuthnReady}
            onClick={() => void handleAddPasskey()}
          />
        </SettingsGroup>

        {passkeysLoading ? (
          <SkeletonRowsCard rows={2} />
        ) : passkeys.length === 0 ? (
          <SettingsGroup label="Your passkeys">
            <SettingsRow
              label="No passkeys added yet"
              subtitle="Add one above for faster, phishing-resistant sign-in."
              chevron="none"
            />
          </SettingsGroup>
        ) : (
          <SettingsGroup label="Your passkeys">
            {passkeys.map((pk) => (
              <SettingsRow
                key={pk.id}
                icon={pk.deviceType === 'platform' ? <Fingerprint /> : <KeyRound />}
                label={pk.name}
                subtitle={`Added ${formatRelativeTime(pk.createdAt)} · Last used ${formatRelativeTime(pk.lastUsedAt)}`}
                chevron="none"
                rightElement={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Rename ${pk.name}`}
                      onClick={() => {
                        setRenamingPasskey(pk);
                        setRenameInput(pk.name);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--settings-row-hover)] cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${pk.name}`}
                      onClick={() => setDeletingPasskey(pk)}
                      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--settings-row-hover)] cursor-pointer"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                }
              />
            ))}
          </SettingsGroup>
        )}

        {/* Rename passkey sheet */}
        <SettingsSheet
          open={Boolean(renamingPasskey)}
          onClose={() => setRenamingPasskey(null)}
          title="Rename passkey"
        >
          <label className="mb-2 block text-[14px]" style={{ color: 'var(--text-muted)' }}>
            Passkey name
          </label>
          <input
            type="text"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            maxLength={60}
            placeholder="e.g. MacBook Pro Touch ID"
            className="mb-4 h-[52px] w-full rounded-full px-5 text-[16px] outline-none placeholder:text-[var(--placeholder)]"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <button
            type="button"
            disabled={passkeyBusy || !renameInput.trim()}
            onClick={() => void handleSaveRenamePasskey()}
            className="flex min-h-[52px] w-full items-center justify-center rounded-full text-[16px] font-semibold text-white disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {passkeyBusy ? 'Saving…' : 'Save name'}
          </button>
        </SettingsSheet>

        {/* Confirm delete passkey sheet */}
        <SettingsConfirmSheet
          open={Boolean(deletingPasskey)}
          onClose={() => setDeletingPasskey(null)}
          title="Remove passkey?"
          description={`You will no longer be able to sign in with "${deletingPasskey?.name || 'this passkey'}".`}
          confirmLabel="Remove passkey"
          tone="danger"
          loading={passkeyBusy}
          onConfirm={handleConfirmDeletePasskey}
        />
      </SettingsPage>
    );
  }

  // ── SUB-VIEW: Multi-factor authentication (TOTP, Email code, Backup codes) ─
  if (subView === 'mfa') {
    return (
      <SettingsPage
        title="Multi-factor authentication"
        onBack={() => {
          setSubView('overview');
          void loadSummary();
        }}
        scrollContainer={scrollContainer}
      >
        <div
          className="rounded-[28px] p-4 sm:p-5"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
        >
          <SecuritySettingsSection />
        </div>
      </SettingsPage>
    );
  }

  // ── SUB-VIEW: Active sessions ──────────────────────────────────────────────
  if (subView === 'sessions') {
    return (
      <SettingsPage
        title="Active sessions"
        onBack={() => setSubView('overview')}
        scrollContainer={scrollContainer}
      >
        {sessionsError && (
          <InlineErrorCard message={sessionsError} onRetry={() => void loadSessions()} />
        )}

        {sessionsLoading ? (
          <SkeletonRowsCard rows={3} />
        ) : sessions.length === 0 ? (
          <SettingsGroup label="Signed-in devices">
            <SettingsRow
              label="No active sessions found"
              subtitle="Your current browser session will appear here shortly."
              chevron="none"
            />
          </SettingsGroup>
        ) : (
          <SettingsGroup
            label="Signed-in devices"
            helperText="Logging out a session immediately revokes its access to Boardly APIs."
          >
            {sessions.map((s) => (
              <SettingsRow
                key={s.id}
                icon={
                  s.os === 'iPhone' || s.os === 'Android' ? <Smartphone /> : <Laptop />
                }
                label={s.deviceLabel}
                subtitle={
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    {s.isCurrent && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent)',
                        }}
                      >
                        This device
                      </span>
                    )}
                    <span>
                      {s.locationHint ? `${s.locationHint} · ` : ''}
                      Active {formatRelativeTime(s.lastSeenAt)}
                    </span>
                  </span>
                }
                chevron="none"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setConfirmSession(s)}
                    className="min-h-[36px] rounded-full px-3 text-[13px] font-medium transition-colors hover:bg-[var(--settings-row-hover)] cursor-pointer"
                    style={{
                      border: '1px solid var(--border)',
                      color: s.isCurrent ? 'var(--danger)' : 'var(--text)',
                    }}
                  >
                    Log out
                  </button>
                }
              />
            ))}
          </SettingsGroup>
        )}

        <SettingsGroup danger>
          <SettingsRow
            icon={<LogOut />}
            label="Log out everywhere"
            subtitle="Sign out of all devices including this one"
            tone="danger"
            chevron="none"
            onClick={() => setConfirmLogoutAll(true)}
          />
        </SettingsGroup>

        <SettingsConfirmSheet
          open={Boolean(confirmSession)}
          onClose={() => setConfirmSession(null)}
          title={confirmSession?.isCurrent ? 'Log out of this device?' : 'Log out session?'}
          description={
            confirmSession?.isCurrent
              ? 'You will be signed out of Boardly on this device right away.'
              : `"${confirmSession?.deviceLabel || 'This device'}" will immediately lose access to your account.`
          }
          confirmLabel="Log out"
          tone="danger"
          loading={sessionBusy}
          onConfirm={handleRevokeSession}
        />

        <SettingsConfirmSheet
          open={confirmLogoutAll}
          onClose={() => setConfirmLogoutAll(false)}
          title="Log out everywhere?"
          description="Every active session and trusted device will be signed out immediately, including this device."
          confirmLabel="Log out everywhere"
          tone="danger"
          loading={sessionBusy}
          onConfirm={handleRevokeAllSessions}
        />
      </SettingsPage>
    );
  }

  // ── SUB-VIEW: Trusted devices ──────────────────────────────────────────────
  if (subView === 'trusted-devices') {
    return (
      <SettingsPage
        title="Trusted devices"
        onBack={() => setSubView('overview')}
        scrollContainer={scrollContainer}
      >
        {devicesError && (
          <InlineErrorCard message={devicesError} onRetry={() => void loadTrustedDevices()} />
        )}

        {devicesLoading ? (
          <SkeletonRowsCard rows={2} />
        ) : trustedDevices.length === 0 ? (
          <SettingsGroup
            label="Remembered devices"
            helperText="When you check 'Remember this device' during two-step verification, it appears here for 30 days."
          >
            <SettingsRow
              label="No trusted devices"
              subtitle="All devices will ask for a verification code when 2FA is on."
              chevron="none"
            />
          </SettingsGroup>
        ) : (
          <>
            <SettingsGroup
              label="Remembered devices"
              helperText="Removing a trusted device means it will need to pass two-step verification again on its next sign-in."
            >
              {trustedDevices.map((d) => (
                <SettingsRow
                  key={d.id}
                  icon={
                    d.os === 'iPhone' || d.os === 'Android' ? <Smartphone /> : <Laptop />
                  }
                  label={d.deviceLabel}
                  subtitle={
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {d.isCurrent && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-soft)',
                            color: 'var(--accent)',
                          }}
                        >
                          This device
                        </span>
                      )}
                      <span>Last used {formatRelativeTime(d.lastUsedAt)}</span>
                    </span>
                  }
                  chevron="none"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setConfirmDevice(d)}
                      className="min-h-[36px] rounded-full px-3 text-[13px] font-medium cursor-pointer"
                      style={{
                        border: '1px solid var(--danger-border)',
                        color: 'var(--danger)',
                      }}
                    >
                      Remove
                    </button>
                  }
                />
              ))}
            </SettingsGroup>

            <SettingsGroup danger>
              <SettingsRow
                icon={<Trash2 />}
                label="Remove all trusted devices"
                tone="danger"
                chevron="none"
                onClick={() => setConfirmRemoveAllDevices(true)}
              />
            </SettingsGroup>
          </>
        )}

        <SettingsConfirmSheet
          open={Boolean(confirmDevice)}
          onClose={() => setConfirmDevice(null)}
          title="Remove trusted device?"
          description={`"${confirmDevice?.deviceLabel || 'This device'}" will need to complete two-step verification on its next sign-in.`}
          confirmLabel="Remove device"
          tone="danger"
          loading={deviceBusy}
          onConfirm={handleRemoveTrustedDevice}
        />

        <SettingsConfirmSheet
          open={confirmRemoveAllDevices}
          onClose={() => setConfirmRemoveAllDevices(false)}
          title="Remove all trusted devices?"
          description="Every remembered device will need to pass two-step verification again."
          confirmLabel="Remove all"
          tone="danger"
          loading={deviceBusy}
          onConfirm={handleRemoveAllTrustedDevices}
        />
      </SettingsPage>
    );
  }

  // ── SUB-VIEW: Security history ─────────────────────────────────────────────
  if (subView === 'history') {
    return (
      <SettingsPage
        title="Security history"
        onBack={() => setSubView('overview')}
        scrollContainer={scrollContainer}
      >
        {eventsError && (
          <InlineErrorCard message={eventsError} onRetry={() => void loadHistory(1, false)} />
        )}

        {eventsLoading ? (
          <SkeletonRowsCard rows={5} />
        ) : events.length === 0 ? (
          <SettingsGroup label="Recent security activity">
            <SettingsRow
              icon={<History />}
              label="No security events yet"
              subtitle="Sign-ins, password updates, passkey changes, and session logouts will appear here."
              chevron="none"
            />
          </SettingsGroup>
        ) : (
          <>
            <SettingsGroup label="Recent security activity">
              {events.map((ev) => (
                <SettingsRow
                  key={ev.id}
                  icon={
                    ev.type === 'failed_sign_in' ? (
                      <ShieldAlert />
                    ) : ev.type.startsWith('passkey') ? (
                      <KeyRound />
                    ) : ev.type.startsWith('two_factor') ? (
                      <ShieldCheck />
                    ) : (
                      <History />
                    )
                  }
                  label={ev.title}
                  subtitle={`${ev.detail ? `${ev.detail} · ` : ''}${formatDateTime(ev.createdAt)}`}
                  chevron="none"
                />
              ))}
            </SettingsGroup>

            {eventsHasMore && (
              <button
                type="button"
                disabled={eventsLoadingMore}
                onClick={() => void loadHistory(eventsPage + 1, true)}
                className="mb-6 flex min-h-[48px] w-full items-center justify-center rounded-full text-[15px] font-medium cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                {eventsLoadingMore ? 'Loading more…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </SettingsPage>
    );
  }

  // ── SUB-VIEW: Change password ──────────────────────────────────────────────
  if (subView === 'password') {
    return (
      <SettingsPage
        title="Change password"
        onBack={() => setSubView('overview')}
        scrollContainer={scrollContainer}
      >
        <form
          onSubmit={handleChangePassword}
          className="rounded-[32px] p-5"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
        >
          {pwError && (
            <div
              role="alert"
              className="mb-4 rounded-2xl px-4 py-3 text-[13px]"
              style={{
                backgroundColor: 'var(--tag-danger-bg)',
                color: 'var(--danger)',
                border: '1px solid var(--danger-border)',
              }}
            >
              {pwError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block pl-2 text-[14px]" style={{ color: 'var(--text-muted)' }}>
                Current password
              </label>
              <input
                type="password"
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                className="h-[50px] w-full rounded-full px-5 text-[15px] outline-none placeholder:text-[var(--placeholder)]"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <div>
              <label className="mb-1.5 block pl-2 text-[14px]" style={{ color: 'var(--text-muted)' }}>
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 8 characters"
                className="h-[50px] w-full rounded-full px-5 text-[15px] outline-none placeholder:text-[var(--placeholder)]"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <div>
              <label className="mb-1.5 block pl-2 text-[14px]" style={{ color: 'var(--text-muted)' }}>
                Confirm new password
              </label>
              <input
                type="password"
                required
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                className="h-[50px] w-full rounded-full px-5 text-[15px] outline-none placeholder:text-[var(--placeholder)]"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={pwBusy}
              className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-full text-[16px] font-semibold text-white disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {pwBusy ? 'Updating password…' : 'Update password'}
            </button>
          </div>
        </form>
      </SettingsPage>
    );
  }

  // ── MAIN VIEW: Security and login ──────────────────────────────────────────
  const hasPasswordProvider = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );
  const twoFa = summary?.twoFactor;

  return (
    <SettingsPage title="Security and login" onBack={onBack} scrollContainer={scrollContainer}>
      {toastMessage && (
        <div
          role="status"
          className="mb-4 rounded-full px-4 py-2.5 text-center text-[14px] font-medium"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {isGuest ? (
        <SettingsGroup label="Guest account">
          <SettingsRow
            icon={<Shield />}
            label="Create a full account for security features"
            subtitle="Passkeys, two-step verification, and session controls require a registered Boardly account."
            chevron="none"
          />
        </SettingsGroup>
      ) : (
        <>
          {summaryError && (
            <InlineErrorCard message={summaryError} onRetry={() => void loadSummary()} />
          )}

          {/* 1. Security recommendations (visual layout only) */}
          {summaryLoading ? (
            <SkeletonRowsCard rows={2} />
          ) : summary && summary.recommendations.length > 0 ? (
            <SettingsGroup label="Security recommendations" radius="compact">
              {summary.recommendations.map((rec, idx) => {
                const isLastRec = idx === summary.recommendations.length - 1;
                const RecIcon =
                  rec.targetSection === 'passkeys'
                    ? KeyRound
                    : rec.targetSection === 'mfa'
                      ? ShieldCheck
                      : Laptop;

                return (
                  <div key={rec.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setSubView(rec.targetSection)}
                      className="flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors cursor-pointer hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)]"
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center"
                        style={{ color: 'var(--text)' }}
                        aria-hidden="true"
                      >
                        <RecIcon className="h-[22px] w-[22px]" />
                      </span>

                      <span className="min-w-0 flex-1 text-left">
                        <span
                          className="block text-[15.5px] font-medium leading-snug break-words"
                          style={{ color: 'var(--text)' }}
                        >
                          {rec.title}
                        </span>
                        <span
                          className="mt-0.5 block text-[13px] leading-snug break-words"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {rec.subtitle}
                        </span>
                      </span>

                      <span className="flex flex-none shrink-0 items-center gap-1.5 whitespace-nowrap">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-amber-400"
                          aria-label="Action recommended"
                        />
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: 'var(--accent-soft)',
                            color: 'var(--accent)',
                          }}
                        >
                          <span>{rec.actionLabel}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                        </span>
                      </span>
                    </button>

                    {!isLastRec && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none h-px"
                        style={{
                          backgroundColor: 'var(--border)',
                          marginLeft: '54px',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </SettingsGroup>
          ) : summary ? (
            <SettingsGroup label="Security recommendations" radius="compact">
              <SettingsRow
                icon={<CheckCircle2 />}
                label="You're all set"
                subtitle="Passkey, two-step verification, and recent sessions look good."
                chevron="none"
              />
            </SettingsGroup>
          ) : null}

          {/* 2. Log in */}
          <SettingsGroup label="Log in">
            <SettingsRow
              icon={<KeyRound />}
              label="Passkeys & security keys"
              value={
                !summary
                  ? summaryRowSpinner
                    ? undefined
                    : '—'
                  : (summary.passkeysCount || 0) === 0
                    ? 'Add'
                    : `${summary.passkeysCount}`
              }
              actionValue={Boolean(summary) && (summary?.passkeysCount || 0) === 0}
              loading={!summary && summaryRowSpinner}
              onClick={() => setSubView('passkeys')}
            />
            {hasPasswordProvider && (
              <SettingsRow
                icon={<Lock />}
                label="Password"
                value="Change"
                onClick={() => setSubView('password')}
              />
            )}
          </SettingsGroup>

          {/* 3. Multi-factor authentication */}
          <SettingsGroup
            label="Multi-factor authentication"
            helperText="Require a second step when signing in on a new device. Keep your backup codes somewhere safe in case you lose access to your authenticator."
          >
            <SettingsRow
              icon={<Smartphone />}
              label="Authenticator app"
              value={twoFa?.totpEnabled ? 'On' : 'Set up'}
              actionValue={!twoFa?.totpEnabled}
              onClick={() => setSubView('mfa')}
            />
            <SettingsRow
              icon={<Mail />}
              label="Email code"
              value={twoFa?.email2faEnabled ? 'On' : 'Off'}
              onClick={() => setSubView('mfa')}
            />
            <SettingsRow
              icon={<Shield />}
              label="Backup codes"
              value={
                twoFa?.twoFactorEnabled
                  ? `${twoFa.backupCodesRemaining} left`
                  : 'Set up'
              }
              actionValue={!twoFa?.twoFactorEnabled}
              onClick={() => setSubView('mfa')}
            />
          </SettingsGroup>

          {/* 4. Sessions & device unlock */}
          <SettingsGroup
            label="Sessions"
            helperText="Review devices signed into your account and devices trusted to skip two-step verification."
          >
            <SettingsRow
              icon={<Laptop />}
              label="Active sessions"
              value={
                !summary
                  ? summaryRowSpinner
                    ? undefined
                    : '—'
                  : String(summary.activeSessionsCount ?? 1)
              }
              loading={!summary && summaryRowSpinner}
              onClick={() => setSubView('sessions')}
            />
            <SettingsRow
              icon={<ShieldCheck />}
              label="Trusted devices"
              value={
                !summary
                  ? summaryRowSpinner
                    ? undefined
                    : '—'
                  : String(summary.trustedDevicesCount ?? 0)
              }
              loading={!summary && summaryRowSpinner}
              onClick={() => setSubView('trusted-devices')}
            />
          </SettingsGroup>

          <SettingsGroup
            helperText={
              unlockSupport.supported
                ? 'Requires your device biometrics or screen PIN when opening Boardly on this device.'
                : unlockSupport.reason
            }
          >
            <SettingsToggleRow
              icon={<Fingerprint />}
              label="Require device unlock"
              checked={unlockEnabled}
              disabled={!unlockSupport.supported}
              loading={unlockBusy}
              onChange={(val) => void handleToggleDeviceUnlock(val)}
            />
          </SettingsGroup>

          {/* 5. Security history */}
          <SettingsGroup>
            <SettingsRow
              icon={<History />}
              label="Security history"
              subtitle="Sign-ins, password changes, passkeys, and sessions"
              onClick={() => setSubView('history')}
            />
          </SettingsGroup>

          {/* 6. Danger zone */}
          <SettingsGroup label="Danger zone" danger>
            <SettingsRow
              icon={<ShieldAlert />}
              label="Suspend account"
              subtitle="Temporarily deactivate your account"
              tone="danger"
              chevron="none"
              onClick={() => {
                setDangerError(null);
                setSuspendSheetOpen(true);
              }}
            />
            <SettingsRow
              icon={<Trash2 />}
              label="Delete account"
              subtitle="Permanently erase your account and data"
              tone="danger"
              chevron="none"
              onClick={() => {
                setDangerError(null);
                setDangerPassword('');
                setDeleteSheetOpen(true);
              }}
            />
          </SettingsGroup>

          {/* Suspend confirmation sheet */}
          <SettingsConfirmSheet
            open={suspendSheetOpen}
            onClose={() => setSuspendSheetOpen(false)}
            title="Suspend your account?"
            description="Your profile will be hidden and you will be signed out until an administrator restores access."
            confirmLabel="Suspend account"
            tone="danger"
            loading={dangerBusy}
            onConfirm={handleSuspendAccount}
          />

          {/* Delete confirmation sheet */}
          <SettingsSheet
            open={deleteSheetOpen}
            onClose={() => setDeleteSheetOpen(false)}
            title="Delete account permanently?"
          >
            <p className="mb-4 text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              This permanently removes your Boardly account, test history, and Kobans balance. This cannot be undone.
            </p>
            {dangerError && (
              <p
                role="alert"
                className="mb-3 rounded-2xl px-3.5 py-2.5 text-[13px]"
                style={{
                  backgroundColor: 'var(--tag-danger-bg)',
                  color: 'var(--danger)',
                }}
              >
                {dangerError}
              </p>
            )}
            {hasPasswordProvider && (
              <input
                type="password"
                value={dangerPassword}
                onChange={(e) => setDangerPassword(e.target.value)}
                placeholder="Confirm with your password"
                className="mb-4 h-[50px] w-full rounded-full px-5 text-[15px] outline-none placeholder:text-[var(--placeholder)]"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            )}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={dangerBusy}
                onClick={() => void handleDeleteAccount()}
                className="flex min-h-[52px] w-full items-center justify-center rounded-full text-[16px] font-semibold text-white disabled:opacity-60 cursor-pointer"
                style={{ backgroundColor: 'var(--danger)' }}
              >
                {dangerBusy ? 'Deleting…' : 'Delete account'}
              </button>
              <button
                type="button"
                disabled={dangerBusy}
                onClick={() => setDeleteSheetOpen(false)}
                className="flex min-h-[52px] w-full items-center justify-center rounded-full text-[16px] font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                Cancel
              </button>
            </div>
          </SettingsSheet>
        </>
      )}
    </SettingsPage>
  );
};

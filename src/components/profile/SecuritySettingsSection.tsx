import { useState, useEffect, useCallback, type FormEvent } from 'react';
import QRCode from 'qrcode';
import {
  Shield,
  Smartphone,
  Mail,
  KeyRound,
  Copy,
  Download,
  Check,
  AlertCircle,
  CheckCircle2,
  X,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { setStoredTrustedDeviceToken } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface TwoFactorStatusData {
  totpEnabled: boolean;
  email2faEnabled: boolean;
  twoFactorEnabled: boolean;
  remainingBackupCodes: number;
  trustedDevicesCount: number;
  recoveryPending: boolean;
  recoveryDisableAt: number | null;
  lastChangedAt: number | null;
  badgeLabel: 'Off' | 'Authenticator' | 'Email code' | 'Both' | 'Recovery pending';
}

const ADMIN_2FA_BANNER_DISMISSED_KEY = 'boardly_admin_2fa_banner_dismissed';

export function SecuritySettingsSection() {
  const { user, isAdmin, isGuest } = useAuth();

  const [status, setStatus] = useState<TwoFactorStatusData>({
    totpEnabled: false,
    email2faEnabled: false,
    twoFactorEnabled: false,
    remainingBackupCodes: 0,
    trustedDevicesCount: 0,
    recoveryPending: false,
    recoveryDisableAt: null,
    lastChangedAt: null,
    badgeLabel: 'Off',
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [adminBannerDismissed, setAdminBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_2FA_BANNER_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  // TOTP Setup Flow state
  const [totpStep, setTotpStep] = useState<'idle' | 'password' | 'qr' | 'backup_codes'>('idle');
  const [totpPassword, setTotpPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [totpQrDataUrl, setTotpQrDataUrl] = useState('');
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);

  // One-time Backup Codes display (shown ONCE right after enabling TOTP or regenerating)
  const [oneTimeBackupCodes, setOneTimeBackupCodes] = useState<string[] | null>(null);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  // Email 2FA Toggle Flow state
  const [emailModalMode, setEmailModalMode] = useState<'enable' | 'disable' | null>(null);
  const [emailPassword, setEmailPassword] = useState('');
  const [emailVerifyCode, setEmailVerifyCode] = useState('');

  // Action Modal state: 'disable_totp' | 'disable_all' | 'regenerate_backup'
  const [actionModal, setActionModal] = useState<
    'disable_totp' | 'disable_all' | 'regenerate_backup' | null
  >(null);
  const [actionPassword, setActionPassword] = useState('');
  const [actionCode, setActionCode] = useState('');

  // Feedback state
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const hasPasswordProvider = Boolean(
    auth.currentUser?.providerData?.some((p) => p.providerId === 'password')
  );
  const isGoogleUser = Boolean(
    auth.currentUser?.providerData?.some((p) => p.providerId === 'google.com')
  );

  const fetch2faStatus = useCallback(async () => {
    if (!auth.currentUser || isGuest) {
      setLoadingStatus(false);
      return;
    }
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/auth/2fa/status', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        const totpOn = Boolean(data.totpEnabled);
        const emailOn = Boolean(data.email2faEnabled);
        const recPending = Boolean(data.recoveryPending);
        const badge =
          data.badgeLabel ||
          (recPending && (totpOn || emailOn)
            ? 'Recovery pending'
            : totpOn && emailOn
            ? 'Both'
            : totpOn
            ? 'Authenticator'
            : emailOn
            ? 'Email code'
            : 'Off');
        setStatus({
          totpEnabled: totpOn,
          email2faEnabled: emailOn,
          twoFactorEnabled: Boolean(data.twoFactorEnabled ?? (totpOn || emailOn)),
          remainingBackupCodes: Number(data.backupCodesRemaining ?? data.remainingBackupCodes ?? 0),
          trustedDevicesCount: Number(data.trustedDevicesCount || 0),
          recoveryPending: recPending,
          recoveryDisableAt: data.recoveryDisableAt || null,
          lastChangedAt: data.lastChangedAt || data.updatedAt || null,
          badgeLabel: badge,
        });
      }
    } catch {
      // Ignore network error on initial load
    } finally {
      setLoadingStatus(false);
    }
  }, [isGuest]);

  useEffect(() => {
    void fetch2faStatus();
  }, [fetch2faStatus]);

  if (!user || isGuest) {
    return null;
  }

  const handleDismissAdminBanner = () => {
    setAdminBannerDismissed(true);
    try {
      localStorage.setItem(ADMIN_2FA_BANNER_DISMISSED_KEY, '1');
    } catch {
      // Ignore storage error
    }
  };

  const ensureFreshGoogleSignInIfNeeded = async (): Promise<string> => {
    if (!auth.currentUser) throw new Error('Not signed in');
    if (!hasPasswordProvider && isGoogleUser) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await reauthenticateWithPopup(auth.currentUser, provider);
      return auth.currentUser.getIdToken(true);
    }
    return auth.currentUser.getIdToken();
  };

  // ── 1. Start Authenticator App (TOTP) Setup ────────────────────────────────
  const handleStartTotpSetup = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);

    try {
      const idToken = await ensureFreshGoogleSignInIfNeeded();
      const res = await fetch('/api/auth/2fa/totp/setup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          currentPassword: totpPassword || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || 'Could not start authenticator setup.');
        return;
      }

      setTotpSecret(data.secret || '');
      setTotpUri(data.otpauthUrl || '');
      const qrSvgDataUrl = await QRCode.toDataURL(data.otpauthUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setTotpQrDataUrl(qrSvgDataUrl);
      setTotpVerifyCode('');
      setTotpStep('qr');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not start authenticator setup.');
    } finally {
      setBusy(false);
    }
  };

  // ── 2. Confirm 6-Digit TOTP Code & Show 10 One-Time Backup Codes ───────────
  const handleEnableTotp = async (e: FormEvent) => {
    e.preventDefault();
    if (totpVerifyCode.trim().length !== 6) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);

    try {
      const idToken = await auth.currentUser!.getIdToken();
      const res = await fetch('/api/auth/2fa/totp/enable', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          code: totpVerifyCode.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || 'Invalid 6-digit authenticator code.');
        return;
      }

      setOneTimeBackupCodes(Array.isArray(data.backupCodes) ? data.backupCodes : []);
      setTotpStep('backup_codes');
      setTotpPassword('');
      setTotpVerifyCode('');
      setSuccessMsg('Authenticator app enabled! Save your 10 one-time backup codes now.');
      await fetch2faStatus();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not enable authenticator app.');
    } finally {
      setBusy(false);
    }
  };

  // ── 3. Toggle Email Code at Login ──────────────────────────────────────────
  const handleSendDisableVerificationEmailCode = async () => {
    if (!auth.currentUser) return;
    setErrorMsg(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ purpose: 'login', forceResend: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setSuccessMsg('A 6-digit verification code has been sent to your email.');
      } else {
        setErrorMsg(data?.error || 'Could not send email verification code.');
      }
    } catch {
      setErrorMsg('Network error sending email code.');
    }
  };

  const handleConfirmEmail2faToggle = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailModalMode) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);

    try {
      const idToken = await ensureFreshGoogleSignInIfNeeded();
      const enabled = emailModalMode === 'enable';
      const res = await fetch('/api/auth/2fa/email/toggle', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          enabled,
          currentPassword: emailPassword || undefined,
          code: enabled ? undefined : emailVerifyCode.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || 'Could not update email two-step verification.');
        return;
      }

      setEmailModalMode(null);
      setEmailPassword('');
      setEmailVerifyCode('');
      setSuccessMsg(
        enabled
          ? 'Email code at login is now turned on.'
          : 'Email code at login has been turned off.'
      );
      await fetch2faStatus();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not update email two-step verification.');
    } finally {
      setBusy(false);
    }
  };

  // ── 4. Disable 2FA or Regenerate Backup Codes (Requires Password + Valid Code) ──
  const handleConfirmProtectedAction = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);

    try {
      const idToken = await ensureFreshGoogleSignInIfNeeded();
      if (actionModal === 'regenerate_backup') {
        const res = await fetch('/api/auth/2fa/backup-codes/regenerate', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            currentPassword: actionPassword || undefined,
            code: actionCode.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          setErrorMsg(data?.error || 'Could not regenerate backup codes.');
          return;
        }
        setOneTimeBackupCodes(Array.isArray(data.backupCodes) ? data.backupCodes : []);
        setTotpStep('backup_codes');
        setActionModal(null);
        setActionPassword('');
        setActionCode('');
        setSuccessMsg('Generated 10 new backup codes. Your previous backup codes are now invalid.');
        await fetch2faStatus();
      } else {
        const target = actionModal === 'disable_totp' ? 'totp' : 'all';
        const res = await fetch('/api/auth/2fa/disable', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            target,
            currentPassword: actionPassword || undefined,
            code: actionCode.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          setErrorMsg(data?.error || 'Could not disable two-step verification.');
          return;
        }
        setActionModal(null);
        setActionPassword('');
        setActionCode('');
        setTotpStep('idle');
        setOneTimeBackupCodes(null);
        setSuccessMsg(
          target === 'totp'
            ? 'Authenticator app has been turned off.'
            : 'Two-step verification has been turned off.'
        );
        await fetch2faStatus();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  // ── 5. Sign Out of All Devices (Revoke Trusted Device Tokens) ──────────────
  const handleRevokeAllDevices = async () => {
    if (!auth.currentUser || busy) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/auth/2fa/devices/revoke-all', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setStoredTrustedDeviceToken(null);
        setSuccessMsg(
          'Signed out of all remembered devices. Every device will require verification on its next login.'
        );
        await fetch2faStatus();
      } else {
        setErrorMsg(data?.error || 'Could not revoke trusted devices.');
      }
    } catch {
      setErrorMsg('Network error while revoking devices.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopySecret = async () => {
    if (!totpSecret) return;
    try {
      await navigator.clipboard.writeText(totpSecret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleCopyBackupCodes = async () => {
    if (!oneTimeBackupCodes?.length) return;
    try {
      await navigator.clipboard.writeText(oneTimeBackupCodes.join('\n'));
      setBackupCodesCopied(true);
      setTimeout(() => setBackupCodesCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleDownloadBackupCodes = () => {
    if (!oneTimeBackupCodes?.length) return;
    const content = [
      'Boardly — One-Time Two-Step Verification Backup Codes',
      `Account: ${user.email || user.uid}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      'Keep these codes in a safe place. Each code can only be used once:',
      '',
      ...oneTimeBackupCodes.map((c, idx) => `${idx + 1}. ${c}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boardly-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="security"
      data-testid="security-settings-section"
      className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={16} className="text-[var(--red)]" />
          <h2 className="text-base font-bold text-[var(--text)] font-heading">
            Security &amp; Two-Step Verification
          </h2>
          <Badge color={status.twoFactorEnabled ? 'green' : 'default'}>
            {loadingStatus ? 'Checking...' : `2FA: ${status.badgeLabel}`}
          </Badge>
        </div>
        {status.lastChangedAt && (
          <span className="text-[11px] font-mono text-[var(--muted)]">
            Last changed: {new Date(status.lastChangedAt).toLocaleDateString('en-GB')}
          </span>
        )}
      </div>

      {/* Gentle, dismissible recommendation banner for Admins & Super Admins ONLY */}
      {isAdmin && !status.twoFactorEnabled && !adminBannerDismissed && (
        <div
          data-testid="admin-2fa-recommendation-banner"
          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200"
        >
          <div className="flex items-center gap-2.5">
            <Shield size={15} className="text-amber-400 shrink-0" />
            <span>Recommended: turn on two-step verification to protect admin access.</span>
          </div>
          <button
            type="button"
            onClick={handleDismissAdminBanner}
            aria-label="Dismiss recommendation"
            className="text-amber-300/80 hover:text-white p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <p className="text-xs text-[var(--muted)] leading-relaxed">
        Add an optional second step when signing in. You can enable an authenticator app (TOTP), an email login code, or both.
      </p>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* One-Time Backup Codes Box (shown ONCE right after TOTP activation or regeneration) */}
      {totpStep === 'backup_codes' && oneTimeBackupCodes && oneTimeBackupCodes.length > 0 && (
        <div
          data-testid="backup-codes-panel"
          className="p-4 rounded-xl bg-[var(--surface-2)] border border-amber-500/40 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-heading flex items-center gap-1.5">
                <KeyRound size={15} className="text-amber-400" />
                <span>Save your 10 one-time backup codes</span>
              </h3>
              <p className="text-[11px] text-amber-300/90 mt-1 leading-relaxed">
                Warning: These backup codes are shown <strong>only once</strong>. Save them in a password manager or download them now. Each code can be used once if you lose your phone.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            {oneTimeBackupCodes.map((code) => (
              <div
                key={code}
                className="text-xs font-mono font-bold text-center py-1.5 px-2 rounded bg-[var(--surface-2)] text-[var(--text)] tracking-wider"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyBackupCodes}
              >
                {backupCodesCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{backupCodesCopied ? 'Copied' : 'Copy codes'}</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownloadBackupCodes}
              >
                <Download size={14} />
                <span>Download .txt</span>
              </Button>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setOneTimeBackupCodes(null);
                setTotpStep('idle');
              }}
            >
              I have saved these codes
            </Button>
          </div>
        </div>
      )}

      {/* Option A: Authenticator App (TOTP, RFC 6238) */}
      <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Smartphone size={15} className="text-[var(--text)]" />
              <span className="text-xs sm:text-sm font-heading font-semibold text-[var(--text)]">
                Authenticator app (TOTP)
              </span>
              <Badge color={status.totpEnabled ? 'green' : 'default'}>
                {status.totpEnabled ? 'Enabled' : 'Off'}
              </Badge>
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Use Google Authenticator, Microsoft Authenticator, or Authy to generate a 6-digit verification code every 30 seconds.
            </p>
            {status.totpEnabled && (
              <p className="text-[11px] font-mono text-[var(--muted)]">
                Remaining one-time backup codes: <strong>{status.remainingBackupCodes}</strong> / 10
              </p>
            )}
          </div>

          {!status.totpEnabled && totpStep === 'idle' && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                if (hasPasswordProvider) {
                  setTotpStep('password');
                } else {
                  void handleStartTotpSetup();
                }
              }}
            >
              Set up authenticator
            </Button>
          )}

          {status.totpEnabled && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setActionPassword('');
                  setActionCode('');
                  setActionModal('regenerate_backup');
                }}
              >
                <RefreshCw size={13} />
                <span>Regenerate backup codes</span>
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setActionPassword('');
                  setActionCode('');
                  setActionModal('disable_totp');
                }}
              >
                Disable
              </Button>
            </div>
          )}
        </div>

        {/* Step 1: Enter Current Password before generating TOTP secret */}
        {totpStep === 'password' && (
          <form onSubmit={handleStartTotpSetup} className="pt-3 border-t border-[var(--border)] space-y-3">
            <div>
              <label className="text-xs font-heading font-semibold text-[var(--text)] block mb-1">
                Confirm your current password
              </label>
              <input
                type="password"
                value={totpPassword}
                onChange={(e) => setTotpPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full h-10 px-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text)]"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTotpStep('idle');
                  setTotpPassword('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={busy || !totpPassword}>
                {busy ? 'Generating key...' : 'Continue'}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Scan QR Code + Copy Base32 Key + Enter 6-Digit Code */}
        {totpStep === 'qr' && (
          <form onSubmit={handleEnableTotp} className="pt-3 border-t border-[var(--border)] space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {totpQrDataUrl && (
                <div className="p-2.5 rounded-xl bg-white border border-[var(--border)] shrink-0">
                  <img
                    src={totpQrDataUrl}
                    alt="Boardly TOTP QR Code"
                    className="w-40 h-40 object-contain"
                  />
                </div>
              )}
              <div className="space-y-2.5 flex-1 min-w-0">
                <p className="text-xs text-[var(--text)] font-medium">
                  1. Scan this QR code in your authenticator app, or copy the setup key below:
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                  <code
                    data-testid="totp-secret-key"
                    className="text-xs font-mono font-bold text-[var(--text)] break-all flex-1"
                  >
                    {totpSecret}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text)] inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {secretCopied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{secretCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] font-mono text-[var(--muted)] break-all">
                  URI: {totpUri}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-heading font-semibold text-[var(--text)] block mb-1">
                2. Enter the 6-digit code from your authenticator app to verify &amp; activate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpVerifyCode}
                  onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  className="w-40 h-10 px-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-mono font-bold tracking-widest text-center text-[var(--text)]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={busy || totpVerifyCode.length !== 6}
                >
                  {busy ? 'Verifying...' : 'Verify & Turn On'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTotpStep('idle');
                    setTotpSecret('');
                    setTotpUri('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Option B: Email Code at Login */}
      <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-[var(--text)]" />
              <span className="text-xs sm:text-sm font-heading font-semibold text-[var(--text)]">
                Email code at login
              </span>
              <Badge color={status.email2faEnabled ? 'green' : 'default'}>
                {status.email2faEnabled ? 'Enabled' : 'Off'}
              </Badge>
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              When on, after entering your password we will email a 6-digit login code to{' '}
              <strong>{user.email}</strong> that must be entered before sign-in completes.
            </p>
          </div>

          {!emailModalMode && (
            <Button
              type="button"
              variant={status.email2faEnabled ? 'danger' : 'primary'}
              size="sm"
              disabled={busy}
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setEmailPassword('');
                setEmailVerifyCode('');
                const nextMode = status.email2faEnabled ? 'disable' : 'enable';
                setEmailModalMode(nextMode);
                if (nextMode === 'disable' && !status.totpEnabled) {
                  void handleSendDisableVerificationEmailCode();
                }
              }}
            >
              {status.email2faEnabled ? 'Turn off email 2FA' : 'Turn on email 2FA'}
            </Button>
          )}
        </div>

        {emailModalMode && (
          <form
            onSubmit={handleConfirmEmail2faToggle}
            className="pt-3 border-t border-[var(--border)] space-y-3"
          >
            {hasPasswordProvider && (
              <div>
                <label className="text-xs font-heading font-semibold text-[var(--text)] block mb-1">
                  Current password
                </label>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text)]"
                />
              </div>
            )}

            {emailModalMode === 'disable' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-heading font-semibold text-[var(--text)]">
                    6-digit verification code (email, authenticator, or backup code)
                  </label>
                  <button
                    type="button"
                    onClick={handleSendDisableVerificationEmailCode}
                    className="text-[11px] font-semibold text-[var(--red)] hover:underline cursor-pointer"
                  >
                    Send email code
                  </button>
                </div>
                <input
                  type="text"
                  value={emailVerifyCode}
                  onChange={(e) => setEmailVerifyCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEmailModalMode(null);
                  setEmailPassword('');
                  setEmailVerifyCode('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={emailModalMode === 'disable' ? 'danger' : 'primary'}
                size="sm"
                disabled={busy}
              >
                {busy
                  ? 'Saving...'
                  : emailModalMode === 'enable'
                  ? 'Confirm & Turn On'
                  : 'Confirm & Turn Off'}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Modal / Inline Form for Disabling TOTP or Regenerating Backup Codes */}
      {actionModal && (
        <form
          onSubmit={handleConfirmProtectedAction}
          className="rounded-xl bg-[var(--surface-2)] border border-[var(--red)]/40 p-4 space-y-3"
        >
          <h3 className="text-xs sm:text-sm font-bold text-[var(--text)] font-heading">
            {actionModal === 'regenerate_backup'
              ? 'Regenerate 10 one-time backup codes'
              : 'Disable authenticator app'}
          </h3>
          <p className="text-[11px] text-[var(--muted)]">
            For security, enter your current password and a valid 6-digit verification code (or backup code).
          </p>

          {hasPasswordProvider && (
            <div>
              <label className="text-xs font-heading font-semibold text-[var(--text)] block mb-1">
                Current password
              </label>
              <input
                type="password"
                value={actionPassword}
                onChange={(e) => setActionPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full h-10 px-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text)]"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-heading font-semibold text-[var(--text)] block mb-1">
              6-digit authenticator code or backup code
            </label>
            <input
              type="text"
              value={actionCode}
              onChange={(e) => setActionCode(e.target.value)}
              placeholder="000000 or ABCD-1234"
              required
              className="w-full h-10 px-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setActionModal(null);
                setActionPassword('');
                setActionCode('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={actionModal === 'regenerate_backup' ? 'primary' : 'danger'}
              size="sm"
              disabled={busy || !actionCode.trim()}
            >
              {busy
                ? 'Processing...'
                : actionModal === 'regenerate_backup'
                ? 'Generate new codes'
                : 'Disable authenticator'}
            </Button>
          </div>
        </form>
      )}

      {/* Trusted Devices & Sign Out of All Devices */}
      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="text-xs sm:text-sm font-heading font-semibold text-[var(--text)]">
            Remembered devices ({status.trustedDevicesCount})
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            Revoke all 30-day remembered devices and require verification on next sign-in everywhere.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={handleRevokeAllDevices}
        >
          <LogOut size={13} />
          <span>Sign out of all devices</span>
        </Button>
      </div>
    </section>
  );
}

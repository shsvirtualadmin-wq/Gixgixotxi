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
import { useSecurityStatus } from '@/hooks/useSecurityStatus';

const ADMIN_2FA_BANNER_DISMISSED_KEY = 'boardly_admin_2fa_banner_dismissed';

export function SecuritySettingsSection() {
  const { user, isAdmin, isGuest } = useAuth();
  const status = useSecurityStatus();
  const { refresh: refreshSecurityStatus, updateStatus } = status;

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

  useEffect(() => {
    if (user?.uid && !isGuest) {
      void refreshSecurityStatus();
    }
  }, [user?.uid, isGuest, refreshSecurityStatus]);

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

      const generatedCodes = Array.isArray(data.backupCodes) ? data.backupCodes : [];
      setOneTimeBackupCodes(generatedCodes);
      setTotpStep('backup_codes');
      setTotpPassword('');
      setTotpVerifyCode('');
      setSuccessMsg('Authenticator app enabled! Save your 10 one-time backup codes now.');
      updateStatus({
        totpEnabled: true,
        backupCodesRemaining: Number(data.backupCodesRemaining ?? generatedCodes.length ?? 10),
        ...(typeof data.emailCodeEnabled === 'boolean'
          ? { emailCodeEnabled: data.emailCodeEnabled }
          : {}),
        ...(typeof data.rememberedDevices === 'number'
          ? { rememberedDevices: data.rememberedDevices }
          : {}),
        lastChangedAt: data.lastChangedAt ?? Date.now(),
      });
      await refreshSecurityStatus();
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
      updateStatus({
        emailCodeEnabled: Boolean(data.emailCodeEnabled ?? data.email2faEnabled ?? enabled),
        ...(typeof data.totpEnabled === 'boolean' ? { totpEnabled: data.totpEnabled } : {}),
        ...(typeof data.backupCodesRemaining === 'number'
          ? { backupCodesRemaining: data.backupCodesRemaining }
          : {}),
        ...(typeof data.rememberedDevices === 'number'
          ? { rememberedDevices: data.rememberedDevices }
          : {}),
        lastChangedAt: data.lastChangedAt ?? Date.now(),
      });
      await refreshSecurityStatus();
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
        const generatedCodes = Array.isArray(data.backupCodes) ? data.backupCodes : [];
        setOneTimeBackupCodes(generatedCodes);
        setTotpStep('backup_codes');
        setActionModal(null);
        setActionPassword('');
        setActionCode('');
        setSuccessMsg('Generated 10 new backup codes. Your previous backup codes are now invalid.');
        updateStatus({
          backupCodesRemaining: Number(data.backupCodesRemaining ?? generatedCodes.length ?? 10),
          lastChangedAt: data.lastChangedAt ?? Date.now(),
        });
        await refreshSecurityStatus();
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
        updateStatus({
          totpEnabled: Boolean(data.totpEnabled ?? false),
          emailCodeEnabled: Boolean(
            data.emailCodeEnabled ??
              data.email2faEnabled ??
              (target === 'all' ? false : status.emailCodeEnabled)
          ),
          backupCodesRemaining: Number(data.backupCodesRemaining ?? 0),
          ...(typeof data.rememberedDevices === 'number'
            ? { rememberedDevices: data.rememberedDevices }
            : {}),
          lastChangedAt: data.lastChangedAt ?? Date.now(),
        });
        await refreshSecurityStatus();
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
        updateStatus({
          rememberedDevices: 0,
          lastChangedAt: data.lastChangedAt ?? Date.now(),
        });
        await refreshSecurityStatus();
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
      className="space-y-5"
    >
      {/* Gentle, dismissible recommendation banner for Admins & Super Admins ONLY */}
      {isAdmin && !status.twoFactorEnabled && !adminBannerDismissed && (
        <div
          data-testid="admin-2fa-recommendation-banner"
          className="stg-card p-3.5 bg-amber-500/10 !border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-200"
        >
          <div className="flex items-center gap-2.5">
            <Shield size={15} className="text-amber-500 shrink-0" />
            <span>Recommended: turn on two-step verification to protect admin access.</span>
          </div>
          <button
            type="button"
            onClick={handleDismissAdminBanner}
            aria-label="Dismiss recommendation"
            className="text-amber-600 dark:text-amber-300 hover:opacity-80 p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl p-3.5 bg-red-500/10 border border-red-500/35 text-[#D71921] dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl p-3.5 bg-emerald-500/10 border border-emerald-500/35 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* One-Time Backup Codes Box (shown ONCE right after TOTP activation or regeneration) */}
      {totpStep === 'backup_codes' && oneTimeBackupCodes && oneTimeBackupCodes.length > 0 && (
        <div
          data-testid="backup-codes-panel"
          className="stg-group"
        >
          <div className="stg-group-label">One-Time Backup Codes</div>
          <div className="stg-card p-4 space-y-3.5 !border-amber-500/40">
            <div>
              <h3 className="text-sm font-bold text-[var(--menu-text)] flex items-center gap-1.5">
                <KeyRound size={15} className="text-amber-500" />
                <span>Save your 10 one-time backup codes</span>
              </h3>
              <p className="text-xs text-[var(--menu-subtext)] mt-1 leading-relaxed">
                Warning: These backup codes are shown <strong>only once</strong>. Save them in a password manager or download them now. Each code can be used once if you lose your phone.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-2xl bg-[var(--menu-bg)] border border-[var(--menu-divider)]">
              {oneTimeBackupCodes.map((code) => (
                <div
                  key={code}
                  className="text-xs font-mono font-bold text-center py-1.5 px-2 rounded-lg bg-[var(--menu-card)] text-[var(--menu-text)] tracking-wider border border-[var(--menu-divider)]"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className="stg-btn-secondary flex-1"
              >
                {backupCodesCopied ? <Check size={15} /> : <Copy size={15} />}
                <span>{backupCodesCopied ? 'Copied' : 'Copy codes'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadBackupCodes}
                className="stg-btn-secondary flex-1"
              >
                <Download size={15} />
                <span>Download .txt</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setOneTimeBackupCodes(null);
                setTotpStep('idle');
              }}
              className="stg-btn-primary"
            >
              I have saved these codes
            </button>
          </div>
        </div>
      )}

      {/* Group: Authenticator App (TOTP, RFC 6238) */}
      <div id="security-totp" className="stg-group">
        <div className="stg-group-label">Two-Step Verification · Authenticator App</div>
        <div className="stg-card">
          <div className="stg-row stg-row--static">
            <div className="stg-row-left">
              <span className="stg-row-icon">
                <Smartphone size={17} />
              </span>
              <div className="min-w-0">
                <div className="stg-row-label">Authenticator app (TOTP)</div>
                {status.totpEnabled && (
                  <div className="text-xs text-[var(--menu-subtext)]">
                    {status.remainingBackupCodes} / 10 backup codes remaining
                  </div>
                )}
              </div>
            </div>
            <div className="stg-row-right">
              <span className="stg-row-value">
                {!status.known ? (
                  <span className="stg-row-value-skeleton" aria-label="Loading" />
                ) : status.totpEnabled ? (
                  'Enabled'
                ) : (
                  'Off'
                )}
              </span>
            </div>
          </div>

          {!status.totpEnabled && totpStep === 'idle' && (
            <button
              type="button"
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
              className="stg-row text-[#D71921] font-semibold"
            >
              <div className="stg-row-left">
                <span className="stg-row-icon !text-[#D71921]">
                  <KeyRound size={17} />
                </span>
                <span className="stg-row-label font-semibold text-[#D71921]">
                  Set up authenticator app
                </span>
              </div>
            </button>
          )}

          {status.totpEnabled && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setActionPassword('');
                  setActionCode('');
                  setActionModal('regenerate_backup');
                }}
                className="stg-row"
              >
                <div className="stg-row-left">
                  <span className="stg-row-icon">
                    <RefreshCw size={16} />
                  </span>
                  <span className="stg-row-label">Regenerate backup codes</span>
                </div>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setActionPassword('');
                  setActionCode('');
                  setActionModal('disable_totp');
                }}
                className="stg-row stg-row--danger"
              >
                <div className="stg-row-left">
                  <span className="stg-row-icon">
                    <X size={16} />
                  </span>
                  <span className="stg-row-label">Disable</span>
                </div>
              </button>
            </>
          )}

          {/* Step 1: Enter Current Password before generating TOTP secret */}
          {totpStep === 'password' && (
            <form onSubmit={handleStartTotpSetup} className="divide-y divide-[var(--menu-divider)] border-t border-[var(--menu-divider)]">
              <div className="stg-row stg-row--static">
                <input
                  type="password"
                  value={totpPassword}
                  onChange={(e) => setTotpPassword(e.target.value)}
                  placeholder="Confirm your current password"
                  required
                  className="stg-input"
                />
              </div>
              <div className="p-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTotpStep('idle');
                    setTotpPassword('');
                  }}
                  className="stg-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !totpPassword}
                  className="stg-btn-primary flex-1"
                >
                  {busy ? 'Generating key...' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Scan QR Code + Copy Base32 Key + Enter 6-Digit Code */}
          {totpStep === 'qr' && (
            <form onSubmit={handleEnableTotp} className="p-4 border-t border-[var(--menu-divider)] space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {totpQrDataUrl && (
                  <div className="p-2.5 rounded-2xl bg-white border border-[var(--menu-divider)] shrink-0">
                    <img
                      src={totpQrDataUrl}
                      alt="Boardly TOTP QR Code"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                )}
                <div className="space-y-2.5 flex-1 min-w-0 w-full">
                  <p className="text-xs text-[var(--menu-text)] font-medium">
                    1. Scan this QR code in your authenticator app, or copy the setup key below:
                  </p>
                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[var(--menu-bg)] border border-[var(--menu-divider)]">
                    <code
                      data-testid="totp-secret-key"
                      className="text-xs font-mono font-bold text-[var(--menu-text)] break-all flex-1"
                    >
                      {totpSecret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="px-3 py-1.5 rounded-full bg-[var(--menu-card)] border border-[var(--menu-divider)] text-xs font-semibold text-[var(--menu-text)] inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {secretCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{secretCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--menu-subtext)] break-all">
                    URI: {totpUri}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--menu-subtext)] block">
                  2. Enter the 6-digit code from your authenticator app to verify &amp; activate
                </label>
                <div className="rounded-2xl bg-[var(--menu-bg)] border border-[var(--menu-divider)] px-4 py-2.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpVerifyCode}
                    onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="stg-input font-mono font-bold tracking-widest text-center"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTotpStep('idle');
                      setTotpSecret('');
                      setTotpUri('');
                    }}
                    className="stg-btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy || totpVerifyCode.length !== 6}
                    className="stg-btn-primary flex-1"
                  >
                    {busy ? 'Verifying...' : 'Verify & Turn On'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
        <p className="stg-footnote">
          Use Google Authenticator, Microsoft Authenticator, or Authy to generate a 6-digit verification code every 30 seconds.
        </p>
      </div>

      {/* Inline Verification Form for Disabling TOTP or Regenerating Backup Codes */}
      {actionModal && (
        <div className="stg-group">
          <div className="stg-group-label">
            {actionModal === 'regenerate_backup'
              ? 'Confirm Backup Code Regeneration'
              : 'Confirm Authenticator Disable'}
          </div>
          <form onSubmit={handleConfirmProtectedAction} className="stg-card divide-y divide-[var(--menu-divider)]">
            {hasPasswordProvider && (
              <div className="stg-row stg-row--static">
                <input
                  type="password"
                  value={actionPassword}
                  onChange={(e) => setActionPassword(e.target.value)}
                  placeholder="Current password"
                  required
                  className="stg-input"
                />
              </div>
            )}

            <div className="stg-row stg-row--static">
              <input
                type="text"
                value={actionCode}
                onChange={(e) => setActionCode(e.target.value)}
                placeholder="6-digit authenticator code or backup code"
                required
                className="stg-input font-mono"
              />
            </div>

            <div className="p-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionModal(null);
                  setActionPassword('');
                  setActionCode('');
                }}
                className="stg-btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !actionCode.trim()}
                className="stg-btn-primary flex-1"
              >
                {busy
                  ? 'Processing...'
                  : actionModal === 'regenerate_backup'
                  ? 'Generate new codes'
                  : 'Disable authenticator'}
              </button>
            </div>
          </form>
          <p className="stg-footnote">
            For security, enter your current password and a valid 6-digit verification code (or backup code).
          </p>
        </div>
      )}

      {/* Group: Email Code at Login */}
      <div id="security-email-2fa" className="stg-group">
        <div className="stg-group-label">Email Verification at Login</div>
        <div className="stg-card">
          <div
            className="stg-row"
            onClick={() => {
              if (busy) return;
              setErrorMsg(null);
              setSuccessMsg(null);
              setEmailPassword('');
              setEmailVerifyCode('');
              if (emailModalMode) {
                setEmailModalMode(null);
                return;
              }
              const nextMode = status.email2faEnabled ? 'disable' : 'enable';
              setEmailModalMode(nextMode);
              if (nextMode === 'disable' && !status.totpEnabled) {
                void handleSendDisableVerificationEmailCode();
              }
            }}
          >
            <div className="stg-row-left">
              <span className="stg-row-icon">
                <Mail size={17} />
              </span>
              <div className="min-w-0">
                <div className="stg-row-label">Email code at login</div>
                <div className="text-xs text-[var(--menu-subtext)]">
                  {status.email2faEnabled ? 'Turn off' : 'Turn on'}
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={status.email2faEnabled}
              aria-label={status.email2faEnabled ? 'Turn off email 2FA' : 'Turn on email 2FA'}
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                setErrorMsg(null);
                setSuccessMsg(null);
                setEmailPassword('');
                setEmailVerifyCode('');
                if (emailModalMode) {
                  setEmailModalMode(null);
                  return;
                }
                const nextMode = status.email2faEnabled ? 'disable' : 'enable';
                setEmailModalMode(nextMode);
                if (nextMode === 'disable' && !status.totpEnabled) {
                  void handleSendDisableVerificationEmailCode();
                }
              }}
              className="stg-switch"
            >
              <span className="stg-switch-thumb" />
            </button>
          </div>

          {emailModalMode && (
            <form
              onSubmit={handleConfirmEmail2faToggle}
              className="divide-y divide-[var(--menu-divider)] border-t border-[var(--menu-divider)]"
            >
              {hasPasswordProvider && (
                <div className="stg-row stg-row--static">
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    className="stg-input"
                  />
                </div>
              )}

              {emailModalMode === 'disable' && (
                <div className="stg-row stg-row--static">
                  <input
                    type="text"
                    value={emailVerifyCode}
                    onChange={(e) => setEmailVerifyCode(e.target.value)}
                    placeholder="Enter 6-digit verification code"
                    required
                    className="stg-input font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSendDisableVerificationEmailCode}
                    className="text-xs font-semibold text-[#D71921] hover:underline cursor-pointer shrink-0"
                  >
                    Resend code
                  </button>
                </div>
              )}

              <div className="p-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmailModalMode(null);
                    setEmailPassword('');
                    setEmailVerifyCode('');
                  }}
                  className="stg-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="stg-btn-primary flex-1"
                >
                  {busy
                    ? 'Saving...'
                    : emailModalMode === 'enable'
                    ? 'Confirm & Turn On'
                    : 'Confirm & Turn Off'}
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="stg-footnote">
          When enabled, we email a 6-digit login code to {user.email} that must be entered before sign-in completes.
        </p>
      </div>

      {/* Group: Remembered Devices */}
      <div id="security-devices" className="stg-group">
        <div className="stg-group-label">Remembered Devices</div>
        <div className="stg-card">
          <div className="stg-row stg-row--static">
            <div className="stg-row-left">
              <span className="stg-row-icon">
                <Shield size={17} />
              </span>
              <span className="stg-row-label">Remembered devices</span>
            </div>
            <div className="stg-row-right">
              <span className="stg-row-value">
                {!status.known ? (
                  <span className="stg-row-value-skeleton" aria-label="Loading" />
                ) : (
                  `${status.rememberedDevices} active`
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handleRevokeAllDevices}
            className="stg-row stg-row--danger"
          >
            <div className="stg-row-left">
              <span className="stg-row-icon">
                <LogOut size={17} />
              </span>
              <span className="stg-row-label">Sign out of all devices</span>
            </div>
          </button>
        </div>
        <p className="stg-footnote">
          Revoke all 30-day remembered devices and require verification on next sign-in everywhere.
          {status.lastChangedAt
            ? ` Last updated ${new Date(status.lastChangedAt).toLocaleDateString('en-GB')}.`
            : ''}
        </p>
      </div>
    </section>
  );
}


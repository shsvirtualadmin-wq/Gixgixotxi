import React, { useEffect, useRef, useState } from 'react';
import { Fingerprint, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDeviceUnlockConfig,
  verifyDeviceUnlock,
} from '../../services/deviceUnlockService';

const RE_LOCK_AFTER_HIDDEN_MS = 5 * 60 * 1000;

export const DeviceUnlockGate: React.FC = () => {
  const { user, signOutUser, isGuest } = useAuth();
  const [locked, setLocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const unlockedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid || isGuest) {
      setLocked(false);
      unlockedUidRef.current = null;
      return;
    }

    const cfg = getDeviceUnlockConfig(user.uid);
    if (cfg?.enabled && unlockedUidRef.current !== user.uid) {
      setLocked(true);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const currentCfg = getDeviceUnlockConfig(user.uid);
        if (
          currentCfg?.enabled &&
          hiddenAtRef.current &&
          Date.now() - hiddenAtRef.current >= RE_LOCK_AFTER_HIDDEN_MS
        ) {
          setLocked(true);
          setError(null);
        }
        hiddenAtRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.uid, isGuest]);

  const handleUnlock = async () => {
    if (!user?.uid || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const ok = await verifyDeviceUnlock(user.uid);
      if (ok) {
        unlockedUidRef.current = user.uid;
        setLocked(false);
      } else {
        setError('Verification did not complete. Please try again.');
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setError('Unlock was cancelled. Tap below to try again.');
      } else {
        setError(err?.message || 'Could not verify your device.');
      }
    } finally {
      setVerifying(false);
    }
  };

  if (!locked) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Unlock Boardly"
    >
      <div
        className="w-full max-w-[380px] rounded-[28px] p-6 text-center"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--accent)',
          }}
        >
          <Lock className="h-7 w-7" />
        </div>
        <h2
          className="text-[20px] font-semibold"
          style={{ color: 'var(--text)' }}
        >
          Boardly is locked
        </h2>
        <p
          className="mt-1.5 text-[14px]"
          style={{ color: 'var(--text-muted)' }}
        >
          Verify with your device biometrics or PIN to continue.
        </p>

        {error && (
          <p
            className="mt-3 rounded-2xl px-3.5 py-2.5 text-[13px]"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              color: 'var(--danger)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleUnlock}
          disabled={verifying}
          className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Fingerprint className="h-5 w-5" />
          {verifying ? 'Verifying…' : 'Unlock device'}
        </button>

        <button
          type="button"
          onClick={() => void signOutUser()}
          className="mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-medium transition-opacity active:opacity-75"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut className="h-4 w-4" />
          Sign out instead
        </button>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import {
  LEGAL_DOCUMENT_VERSION,
  checkUserLegalConsentStatus,
  recordLegalConsentOnServer,
  getLocalConsentAcceptedAt,
} from '@/constants/legalConsent';

/**
 * One-time, non-blocking, dismissible notice shown to existing logged-in users
 * after login when the Terms of Service & Privacy Policy version has been updated.
 * Clicking "OK" records acceptance on the server (`legal_consent_records`) and
 * caches it locally so it does not reappear.
 */
export const LegalUpdateNoticeBanner: React.FC = () => {
  const { user, isGuest, isSessionVerified } = useAuth();
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid || isGuest || !isSessionVerified) {
      setVisible(false);
      return;
    }

    // Immediate synchronous check in localStorage so it never flashes if already accepted
    if (getLocalConsentAcceptedAt(uid, LEGAL_DOCUMENT_VERSION)) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
      const status = await checkUserLegalConsentStatus({
        userId: uid,
        idToken,
        documentVersion: LEGAL_DOCUMENT_VERSION,
      });
      if (!cancelled) {
        setVisible(!status.accepted);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, isGuest, isSessionVerified]);

  if (!visible || !user?.uid) return null;

  const handleAccept = async () => {
    if (submitting) return;
    setSubmitting(true);
    setVisible(false);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
      await recordLegalConsentOnServer({
        userId: user.uid,
        accountType: isGuest ? 'guest' : 'registered',
        actionContext: 'existing_user_notice',
        documentVersion: LEGAL_DOCUMENT_VERSION,
        idToken,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="legal-update-notice-banner"
      className="max-w-5xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-2"
    >
      <div className="px-3.5 py-2.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5 text-xs text-[var(--muted)]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-[var(--red)] shrink-0" />
          <span>
            We updated our{' '}
            <Link to="/terms" className="underline text-[var(--text)] hover:text-[var(--red)] font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline text-[var(--text)] hover:text-[var(--red)] font-medium">
              Privacy Policy
            </Link>
            .
          </span>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          disabled={submitting}
          className="px-3 py-1 rounded-full bg-[#D71921] text-white font-semibold text-[11px] cursor-pointer hover:opacity-90 transition-opacity shrink-0"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default LegalUpdateNoticeBanner;

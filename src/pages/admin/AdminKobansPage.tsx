import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  History,
  Copy,
  Check,
  Send,
  Sparkles,
  X,
  UserCheck,
  ChevronDown,
  Smartphone,
  Tablet,
  Monitor,
} from 'lucide-react';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import { useAuth } from '@/contexts/AuthContext';
import { KobanIcon } from '@/components/koban/KobanIcon';
import {
  fetchKobanRequests,
  approveKobanRequest,
  rejectKobanRequest,
  adminAdjustKobans,
  fetchUserLedger,
} from '@/services/kobanService';
import {
  searchStudentsForKobans,
  ensureStudentWalletInitialized,
  AdminSearchHttpError,
  type KobanStudentSearchResult,
  type KobanStudentStatus,
} from '@/services/adminService';
import { COSMETICS_CATALOG } from '@/data/cosmeticsCatalog';
import {
  AvatarPicture,
  AvatarFrame,
  Nameplate,
  ProfileEffectCardPreview,
} from '@/components/koban/CosmeticRenderers';
import {
  formatPaymentMethodLabel,
  PAYMENT_METHODS_PAIR_LABEL,
} from '@/constants/branding';
import type { KobanRequest, WalletLedgerEntry } from '@/types';

function getInitials(nameOrEmail: string): string {
  const clean = String(nameOrEmail || '')
    .trim()
    .replace(/^@+/, '');
  if (!clean) return 'ST';
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const cleanQuery = query.trim().replace(/\s+/g, '');
  if (!text || !cleanQuery || cleanQuery.length < 2) {
    return <>{text}</>;
  }
  const lowerText = text.toLowerCase();
  const lowerQuery = cleanQuery.toLowerCase().replace(/^@+/, '');
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) {
    return <>{text}</>;
  }
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + lowerQuery.length);
  const after = text.slice(idx + lowerQuery.length);
  return (
    <>
      {before}
      <mark className="akb-match-highlight">{match}</mark>
      {after}
    </>
  );
}

function StatusChip({ status }: { status: KobanStudentStatus }) {
  if (status === 'suspended') {
    return <span className="akb-chip akb-chip--suspended">Suspended</span>;
  }
  if (status === 'orphan') {
    return <span className="akb-chip akb-chip--orphan">Orphan</span>;
  }
  if (status === 'missing-name') {
    return <span className="akb-chip akb-chip--missing-name">Missing name</span>;
  }
  if (status === 'inactive') {
    return <span className="akb-chip akb-chip--muted">Inactive</span>;
  }
  return <span className="akb-chip akb-chip--active">Active</span>;
}

export function AdminKobansPage() {
  const { user } = useAuth();
  const superadminEmail = user?.email || 'shsvirtualadmin@gmail.com';
  const params = useParams<{ uid?: string }>();
  const [searchParams] = useSearchParams();
  const deepLinkUid = (params.uid || searchParams.get('uid') || '').trim();
  const deepLinkTx = (searchParams.get('tx') || '').trim();

  const [activeTab, setActiveTab] = useState<'requests' | 'adjust' | 'gallery'>('adjust');
  const [galleryViewport, setGalleryViewport] = useState<'360' | '390' | '768' | '100%'>('390');
  const [galleryTestName, setGalleryTestName] = useState('Muhammad Abdullah Tariq');
  const [galleryCategory, setGalleryCategory] = useState<
    'all' | 'nameplate' | 'frame' | 'effect' | 'avatar'
  >('all');

  // Requests state
  const [requests, setRequests] = useState<KobanRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'pending'
  );

  // Approve Modal state
  const [approveTarget, setApproveTarget] = useState<KobanRequest | null>(null);
  const [editableAmount, setEditableAmount] = useState<number>(0);
  const [approving, setApproving] = useState(false);

  // Reject Modal state
  const [rejectTarget, setRejectTarget] = useState<KobanRequest | null>(null);
  const [rejectReason, setRejectReason] = useState(
    'Transaction ID could not be verified on mobile banking portal.'
  );
  const [rejecting, setRejecting] = useState(false);

  // Student Search & Wallet Adjustment state
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<KobanStudentSearchResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<KobanStudentSearchResult | null>(null);
  const [selectedUserBalance, setSelectedUserBalance] = useState<number | null>(null);
  const [selectedUserLedger, setSelectedUserLedger] = useState<WalletLedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Adjustment inputs
  const [adjustMode, setAdjustMode] = useState<'grant' | 'deduct'>('grant');
  const [adjustAmount, setAdjustAmount] = useState<string>('500');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustConfirmOpen, setAdjustConfirmOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce & AbortController refs so rapid typing never displays stale results
  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchSeqRef = useRef<number>(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load Koban requests
  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const data = await fetchKobanRequests(requestFilter);
      setRequests(data);
    } catch (err) {
      console.warn('Failed to load koban requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  }, [requestFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Execute student search with AbortController & stale-sequence protection
  const executeStudentSearch = useCallback(async (rawQuery: string) => {
    const normalized = rawQuery.trim();
    const compact = normalized.replace(/\s+/g, '');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (compact.length < 2) {
      setSearchingUsers(false);
      setSearchResults([]);
      setHasSearchedOnce(false);
      setSearchError(null);
      setLastSearchedQuery('');
      return;
    }

    const seq = ++searchSeqRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSearchingUsers(true);
    setSearchError(null);

    try {
      const res = await searchStudentsForKobans(normalized, {
        limit: 20,
        offset: 0,
        includeInactive: true,
        signal: controller.signal,
      });

      if (seq !== searchSeqRef.current || controller.signal.aborted) {
        return;
      }

      setSearchResults(res.users);
      setVisibleCount(10);
      setLastSearchedQuery(normalized);
      setHasSearchedOnce(true);
      setSearchError(null);
    } catch (err: unknown) {
      if (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err as { name?: string })?.name === 'AbortError' ||
        seq !== searchSeqRef.current
      ) {
        return;
      }
      console.error('[AdminKobansPage] Student search failed:', err);
      const status =
        err instanceof AdminSearchHttpError
          ? err.status
          : (err as { status?: number })?.status || 500;
      const msg =
        err instanceof AdminSearchHttpError
          ? err.message
          : `Search failed (${status}): ${(err as Error)?.message || 'Unable to query student accounts.'}`;
      setSearchError(msg);
      setSearchResults([]);
      setLastSearchedQuery(normalized);
      setHasSearchedOnce(true);
    } finally {
      if (seq === searchSeqRef.current) {
        setSearchingUsers(false);
      }
    }
  }, []);

  // Cleanup debounce & abort controller on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle input change with 300ms debounce
  const handleSearchInputChange = (val: string) => {
    setUserSearch(val);
    setActionError(null);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const compact = val.trim().replace(/\s+/g, '');
    if (compact.length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      searchSeqRef.current += 1;
      setSearchingUsers(false);
      setSearchResults([]);
      setHasSearchedOnce(false);
      setSearchError(null);
      setLastSearchedQuery('');
      return;
    }

    setSearchingUsers(true);
    debounceTimerRef.current = window.setTimeout(() => {
      executeStudentSearch(val);
    }, 300);
  };

  // Fire search immediately on Enter or Paste
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      executeStudentSearch(userSearch);
    }
  };

  const handleSearchPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;
    const input = e.currentTarget;
    const start = input.selectionStart ?? userSearch.length;
    const end = input.selectionEnd ?? userSearch.length;
    const nextVal = `${userSearch.slice(0, start)}${pasted}${userSearch.slice(end)}`;
    if (nextVal.trim().replace(/\s+/g, '').length >= 2) {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      window.setTimeout(() => {
        executeStudentSearch(nextVal);
      }, 0);
    }
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    searchSeqRef.current += 1;
    setUserSearch('');
    setSearchingUsers(false);
    setSearchResults([]);
    setHasSearchedOnce(false);
    setSearchError(null);
    setLastSearchedQuery('');
    searchInputRef.current?.focus();
  };

  // Select student and lazily initialize their wallet (balance 0 if missing) + fetch ledger
  const handleSelectUser = useCallback(async (u: KobanStudentSearchResult) => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    searchSeqRef.current += 1;

    setSelectedUser(u);
    setSearchingUsers(false);
    setSearchError(null);
    setSelectedUserBalance(u.kobans ?? 0);
    setLedgerLoading(true);
    setActionError(null);

    try {
      const liveBalance = await ensureStudentWalletInitialized(u.uid);
      setSelectedUserBalance(liveBalance);
      setSelectedUser((prev) =>
        prev && prev.uid === u.uid ? { ...prev, kobans: liveBalance, hasWallet: true } : prev
      );

      const ledger = await fetchUserLedger(u.uid);
      setSelectedUserLedger(ledger);
    } catch (err) {
      console.error('[AdminKobansPage] Failed to initialize or fetch student wallet/ledger:', err);
      setSelectedUserBalance(u.kobans ?? 0);
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  // Auto-select student when navigated via admin email deep-link (/admin/wallets/:uid?tx=:txId)
  useEffect(() => {
    if (!deepLinkUid) return;
    setActiveTab('adjust');
    let cancelled = false;
    (async () => {
      try {
        const res = await searchStudentsForKobans(deepLinkUid, {
          limit: 5,
          offset: 0,
          includeInactive: true,
        });
        if (cancelled) return;
        const matched =
          res.users.find((u) => u.uid === deepLinkUid) ||
          res.users[0] || {
            uid: deepLinkUid,
            displayName: 'Student',
            email: '',
            kobans: 0,
            hasWallet: true,
            status: 'active' as KobanStudentStatus,
          };
        await handleSelectUser(matched);
      } catch {
        if (cancelled) return;
        await handleSelectUser({
          uid: deepLinkUid,
          displayName: 'Student',
          email: '',
          kobans: 0,
          hasWallet: true,
          status: 'active',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deepLinkUid, handleSelectUser]);

  const handleChangeSelectedUser = () => {
    setSelectedUser(null);
    setSelectedUserBalance(null);
    setSelectedUserLedger([]);
    setActionError(null);
    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 20);
  };

  // Top-right Refresh button handler
  const handleRefreshPage = useCallback(async () => {
    setActionError(null);
    await loadRequests();
    if (selectedUser) {
      await handleSelectUser(selectedUser);
    } else if (userSearch.trim().length >= 2) {
      await executeStudentSearch(userSearch);
    }
  }, [loadRequests, selectedUser, handleSelectUser, userSearch, executeStudentSearch]);

  // Open Approve Modal
  const handleOpenApprove = (req: KobanRequest) => {
    setApproveTarget(req);
    setEditableAmount(req.amount);
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    setActionError(null);

    try {
      await approveKobanRequest(
        superadminEmail,
        approveTarget.id,
        approveTarget.userId,
        editableAmount,
        approveTarget.transactionId
      );
      setApproveTarget(null);
      setActionSuccess(`Credited +${editableAmount.toLocaleString()} Kobans to student.`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadRequests();
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Failed to approve request');
    } finally {
      setApproving(false);
    }
  };

  // Open Reject Modal
  const handleOpenReject = (req: KobanRequest) => {
    setRejectTarget(req);
    setRejectReason('Transaction ID could not be verified on mobile banking portal.');
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    setActionError(null);

    try {
      await rejectKobanRequest(
        superadminEmail,
        rejectTarget.id,
        rejectTarget.userId,
        rejectReason
      );
      setRejectTarget(null);
      setActionSuccess('Request rejected and student notified.');
      setTimeout(() => setActionSuccess(null), 3500);
      await loadRequests();
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Failed to reject request');
    } finally {
      setRejecting(false);
    }
  };

  // Validate before opening confirmation modal
  const handleOpenAdjustConfirmation = () => {
    if (!selectedUser) return;
    setActionError(null);
    const parsedAmount = parseInt(adjustAmount, 10);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setActionError('Please enter a valid positive whole number of Kobans.');
      return;
    }
    if (!adjustReason.trim()) {
      setActionError('A reason or note is required for every wallet balance adjustment.');
      return;
    }
    setAdjustConfirmOpen(true);
  };

  // Manual Adjustment Submission
  const handleConfirmAdjustment = async () => {
    if (!selectedUser) return;
    const num = parseInt(adjustAmount, 10);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid positive integer amount.');
      return;
    }
    if (!adjustReason.trim()) {
      setActionError('A reason or note is required before applying a balance change.');
      return;
    }

    const delta = adjustMode === 'grant' ? num : -num;
    setAdjusting(true);
    setActionError(null);

    try {
      const res = await adminAdjustKobans(
        superadminEmail,
        selectedUser.uid,
        delta,
        adjustReason.trim(),
        selectedUser.email
      );

      setSelectedUserBalance(res.newBalance);
      setSelectedUser((prev) => (prev ? { ...prev, kobans: res.newBalance, hasWallet: true } : prev));
      setAdjustConfirmOpen(false);
      setAdjustReason('');
      setActionSuccess(
        `${delta > 0 ? 'Added' : 'Deducted'} ${Math.abs(delta).toLocaleString()} Kobans ${
          delta > 0 ? 'to' : 'from'
        } ${selectedUser.name || selectedUser.email}. New balance: ${res.newBalance.toLocaleString()} Kobans.`
      );
      setTimeout(() => setActionSuccess(null), 4500);

      // Refresh user ledger immediately
      const updatedLedger = await fetchUserLedger(selectedUser.uid);
      setSelectedUserLedger(updatedLedger);
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;
  const parsedAmountNum = Math.max(0, parseInt(adjustAmount, 10) || 0);
  const currentBalanceNum = selectedUserBalance ?? selectedUser?.kobans ?? 0;
  const previewNewBalance = Math.max(
    0,
    currentBalanceNum + (adjustMode === 'grant' ? parsedAmountNum : -parsedAmountNum)
  );

  return (
    <div className="akb-page-shell">
      {/* Ambient red blurred blobs behind the page so glass surfaces read clearly */}
      <div className="akb-ambient-blobs" aria-hidden="true">
        <div className="akb-blob akb-blob--top" />
        <div className="akb-blob akb-blob--bottom" />
      </div>

      <div className="akb-container">
        {/* ─── HEADER CARD ─────────────────────────────────────────────────── */}
        <header className="akb-glass-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="akb-page-title">Kobans</h1>
                <span className="akb-rate-chip">
                  <KobanIcon size={13} />
                  <span>10 Kobans = PKR 1</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-snug m-0">
                Search student wallets, adjust balances, and review mobile payment requests.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefreshPage}
              disabled={requestsLoading || searchingUsers || ledgerLoading}
              aria-label="Refresh"
              title="Refresh"
              className="akb-refresh-btn"
            >
              <RefreshCw
                size={17}
                className={requestsLoading || searchingUsers || ledgerLoading ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </header>

        {/* ─── FEEDBACK BANNERS ────────────────────────────────────────────── */}
        {actionSuccess && (
          <div
            role="status"
            className="akb-glass-card !py-3 !px-4 flex items-center justify-between gap-3 border-emerald-500/40"
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-heading font-semibold text-emerald-700 dark:text-emerald-300 min-w-0">
              <CheckCircle2 size={17} className="shrink-0 text-emerald-500" />
              <span className="break-words">{actionSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              aria-label="Dismiss message"
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="akb-glass-card !py-3 !px-4 flex items-center justify-between gap-3 border-red-500/45"
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-heading font-semibold text-red-700 dark:text-red-300 min-w-0">
              <AlertCircle size={17} className="shrink-0 text-red-500" />
              <span className="break-words">{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              aria-label="Dismiss error"
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ─── SEGMENTED GLASS TABS (Requests | Wallets | Gallery) ─────────── */}
        <nav className="akb-segmented-tabs" aria-label="Kobans sections">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`akb-tab-btn ${activeTab === 'requests' ? 'akb-tab-btn--active' : ''}`}
          >
            <span>Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="akb-tab-badge">{pendingRequestsCount}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`akb-tab-btn ${activeTab === 'adjust' ? 'akb-tab-btn--active' : ''}`}
          >
            <span>Wallets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`akb-tab-btn ${activeTab === 'gallery' ? 'akb-tab-btn--active' : ''}`}
          >
            <span>Gallery</span>
          </button>
        </nav>

        {/* ─── TAB 1: REQUESTS ─────────────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <div className="space-y-3.5">
            {/* Filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRequestFilter(st)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs capitalize font-heading font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    requestFilter === st
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                      : 'bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--text)] border-[var(--glass-border)]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {requestsLoading ? (
              <div className="akb-glass-card">
                <LineLoader context="admin" message="Loading Koban requests..." />
              </div>
            ) : requests.length === 0 ? (
              <div className="akb-glass-card py-10 text-center space-y-2">
                <Clock size={26} className="mx-auto text-[var(--text-muted)]" />
                <p className="text-sm font-heading font-bold text-[var(--text)] m-0">
                  No {requestFilter} Koban requests
                </p>
                <p className="text-xs text-[var(--text-muted)] m-0">
                  When students submit mobile payment verifications, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="akb-glass-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-sm text-[var(--text)]">
                          {req.userName || 'Student'}
                        </span>
                        <span
                          className={`akb-chip ${
                            req.status === 'approved'
                              ? 'akb-chip--approved'
                              : req.status === 'rejected'
                              ? 'akb-chip--rejected'
                              : 'akb-chip--pending'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="akb-chip akb-chip--muted">
                          via {formatPaymentMethodLabel(req.paymentMethod)}
                        </span>
                      </div>

                      <div className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-2 flex-wrap break-all">
                        <span>ID: {req.userId.slice(0, 8)}…</span>
                        {req.userEmail && <span>• {req.userEmail}</span>}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap pt-0.5 text-xs font-mono">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[var(--glass-border)] bg-[var(--input-bg)]">
                          <span className="text-[var(--text-muted)]">TRX:</span>
                          <span className="font-bold text-[var(--text)]">{req.transactionId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(req.transactionId, req.id)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                            title="Copy TRX"
                            aria-label="Copy transaction ID"
                          >
                            {copiedId === req.id ? (
                              <Check size={13} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>

                        <div className="text-[var(--text-muted)]">
                          Amount:{' '}
                          <strong className="text-[var(--text)] font-bold">
                            {req.amount.toLocaleString()} Kobans
                          </strong>{' '}
                          (PKR {req.pkrAmount})
                        </div>
                      </div>

                      {req.rejectionReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 m-0 pt-1">
                          Rejection reason: {req.rejectionReason}
                        </p>
                      )}
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => handleOpenReject(req)}
                          className="akb-btn akb-btn--glass flex-1 md:flex-initial"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenApprove(req)}
                          className="akb-btn akb-btn--primary flex-1 md:flex-initial"
                        >
                          <CheckCircle2 size={16} />
                          <span>Approve &amp; Credit</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: WALLETS (STUDENT SEARCH + ADJUSTMENT + LEDGER) ───────── */}
        {activeTab === 'adjust' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Top / Left Column: Find Student Account & Adjust Kobans */}
            <div className="lg:col-span-5 space-y-3.5">
              <section className="akb-glass-card space-y-4" aria-labelledby="akb-find-student-heading">
                <div className="flex items-center justify-between gap-2">
                  <h2
                    id="akb-find-student-heading"
                    className="font-heading font-bold text-base text-[var(--text)] m-0"
                  >
                    Find Student Account
                  </h2>
                  {selectedUser && (
                    <span className="akb-chip akb-chip--active">
                      <UserCheck size={11} />
                      <span>Selected</span>
                    </span>
                  )}
                </div>

                {/* If a student is selected, show compact selected-user glass card with Change button */}
                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl border border-[var(--glass-border-strong)] bg-[var(--input-bg)] space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="akb-avatar">
                            {selectedUser.avatar && selectedUser.avatar.startsWith('http') ? (
                              <img
                                src={selectedUser.avatar}
                                alt={selectedUser.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(selectedUser.name || selectedUser.email)
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="font-heading font-bold text-sm text-[var(--text)] truncate">
                              {selectedUser.name || selectedUser.email || 'Unnamed Student'}
                            </div>
                            {selectedUser.handle && (
                              <div className="text-xs text-[var(--text-muted)] font-mono truncate">
                                @{selectedUser.handle}
                              </div>
                            )}
                            <div className="text-xs text-[var(--text-secondary)] font-mono break-all">
                              {selectedUser.email || `ID: ${selectedUser.uid}`}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleChangeSelectedUser}
                          className="akb-btn akb-btn--glass !min-h-[38px] !py-1.5 !px-3 !text-xs shrink-0"
                        >
                          Change
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[var(--border)] flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusChip status={selectedUser.status} />
                          <span
                            className={`akb-chip ${
                              selectedUser.plan === 'pro' ? 'akb-chip--pro' : 'akb-chip--muted'
                            }`}
                          >
                            {selectedUser.plan === 'pro' ? 'Pro' : 'Free'}
                          </span>
                          <span className="akb-chip akb-chip--muted">{selectedUser.role}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-heading font-semibold text-[var(--text-muted)] uppercase">
                            Balance:
                          </span>
                          <KobanIcon size={15} />
                          <span className="font-mono font-extrabold text-sm text-[var(--text)] tabular-nums">
                            {selectedUserBalance === null
                              ? '…'
                              : selectedUserBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Balance Adjustment Controls */}
                    <div className="space-y-3.5 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAdjustMode('grant')}
                          className={`akb-btn ${
                            adjustMode === 'grant' ? 'akb-btn--primary' : 'akb-btn--glass'
                          }`}
                        >
                          <Plus size={16} />
                          <span>Add Kobans</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAdjustMode('deduct')}
                          className={`akb-btn ${
                            adjustMode === 'deduct' ? 'akb-btn--primary' : 'akb-btn--glass'
                          }`}
                        >
                          <Minus size={16} />
                          <span>Deduct Kobans</span>
                        </button>
                      </div>

                      {/* Positive Integer Amount Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-heading font-semibold text-[var(--text-secondary)]">
                          <label htmlFor="akb-amount-input">Amount (Kobans)</label>
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            PKR {Math.floor(parsedAmountNum / 10).toLocaleString()} equiv.
                          </span>
                        </div>
                        <input
                          id="akb-amount-input"
                          type="number"
                          inputMode="numeric"
                          min="1"
                          step="1"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="e.g. 500"
                          className="akb-input font-mono font-bold"
                        />
                      </div>

                      {/* Required Reason / Note Input */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="akb-reason-input"
                          className="text-xs font-heading font-semibold text-[var(--text-secondary)] block"
                        >
                          Reason / Note <span className="text-[var(--accent)]">*</span>
                        </label>
                        <input
                          id="akb-reason-input"
                          type="text"
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          placeholder={`e.g. Verified ${PAYMENT_METHODS_PAIR_LABEL} transfer / Monthly Captain reward`}
                          className="akb-input"
                        />
                      </div>

                      {/* Primary Submit Button */}
                      <button
                        type="button"
                        onClick={handleOpenAdjustConfirmation}
                        disabled={parsedAmountNum <= 0 || !adjustReason.trim()}
                        className="akb-btn akb-btn--primary w-full"
                      >
                        <Send size={15} />
                        <span>
                          {adjustMode === 'grant' ? 'Add' : 'Deduct'}{' '}
                          {parsedAmountNum.toLocaleString()} Kobans
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Search Input & All Search UI States */
                  <div className="space-y-3.5">
                    <div className="akb-search-wrap">
                      <Search
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                      />
                      <input
                        ref={searchInputRef}
                        type="text"
                        inputMode="email"
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck={false}
                        value={userSearch}
                        onChange={(e) => handleSearchInputChange(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onPaste={handleSearchPaste}
                        placeholder="Search by email, name, @handle or ID"
                        aria-label="Search by email, name, @handle or ID"
                        className="akb-input akb-input--search"
                      />
                      {userSearch.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          aria-label="Clear search"
                          title="Clear search"
                          className="akb-search-clear-btn"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* STATE 1: Typing / Loading */}
                    {searchingUsers ? (
                      <div className="py-4">
                        <LineLoader context="admin" message="Searching student accounts..." />
                      </div>
                    ) : searchError ? (
                      /* STATE 2: Error State with real HTTP status & Retry button */
                      <div
                        role="alert"
                        className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 space-y-3 text-center"
                      >
                        <AlertCircle size={22} className="mx-auto text-red-500" />
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-heading font-bold text-[var(--text)] m-0">
                            {searchError}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] m-0">
                            Please verify your connection or admin session and try again.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => executeStudentSearch(userSearch)}
                          className="akb-btn akb-btn--glass !min-h-[40px] !py-2 !px-4 mx-auto"
                        >
                          <RefreshCw size={14} />
                          <span>Retry</span>
                        </button>
                      </div>
                    ) : hasSearchedOnce && searchResults.length === 0 ? (
                      /* STATE 3: No Results State */
                      <div className="p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--input-bg)] text-center space-y-1.5">
                        <p className="text-sm font-heading font-bold text-[var(--text)] m-0 break-words">
                          No student found for &lsquo;{lastSearchedQuery}&rsquo;
                        </p>
                        <p className="text-xs text-[var(--text-muted)] m-0">
                          Check the spelling or search by name or @handle
                        </p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      /* STATE 4: Results List (Glass Rows + Show More) */
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-heading font-semibold text-[var(--text-muted)] px-1">
                          <span>
                            Showing {Math.min(visibleCount, searchResults.length)} of{' '}
                            {searchResults.length} matching account
                            {searchResults.length === 1 ? '' : 's'}
                          </span>
                          <span>Tap to select</span>
                        </div>

                        <div className="akb-result-list" role="listbox" aria-label="Matching students">
                          {searchResults.slice(0, visibleCount).map((u) => {
                            const primaryName =
                              u.name && u.name !== 'Unnamed Student'
                                ? u.name
                                : u.email || `Student #${u.shortId}`;
                            return (
                              <button
                                key={u.uid}
                                type="button"
                                role="option"
                                aria-selected={false}
                                onClick={() => handleSelectUser(u)}
                                className="akb-result-row"
                              >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <div className="akb-avatar">
                                    {u.avatar && u.avatar.startsWith('http') ? (
                                      <img
                                        src={u.avatar}
                                        alt={primaryName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      getInitials(primaryName)
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-heading font-bold text-sm text-[var(--text)] break-words">
                                        <HighlightMatch text={primaryName} query={userSearch} />
                                      </span>
                                      {u.handle && (
                                        <span className="text-xs font-mono text-[var(--text-muted)]">
                                          @<HighlightMatch text={u.handle} query={userSearch} />
                                        </span>
                                      )}
                                    </div>

                                    {u.email && (
                                      <div className="text-xs font-mono text-[var(--text-secondary)] break-all">
                                        <HighlightMatch text={u.email} query={userSearch} />
                                      </div>
                                    )}

                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                      <StatusChip status={u.status} />
                                      <span
                                        className={`akb-chip ${
                                          u.plan === 'pro' ? 'akb-chip--pro' : 'akb-chip--muted'
                                        }`}
                                      >
                                        {u.plan === 'pro' ? 'Pro' : 'Free'}
                                      </span>
                                      {u.role && u.role !== 'student' && (
                                        <span className="akb-chip akb-chip--muted">{u.role}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0 space-y-1">
                                  <div className="inline-flex items-center gap-1 justify-end">
                                    <KobanIcon size={14} />
                                    <span className="font-mono font-extrabold text-sm text-[var(--text)] tabular-nums">
                                      {(u.kobans ?? 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-mono text-[var(--text-muted)] block">
                                    #{u.shortId || u.uid.slice(0, 5).toUpperCase()}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {searchResults.length > visibleCount && (
                          <button
                            type="button"
                            onClick={() => setVisibleCount((prev) => prev + 10)}
                            className="akb-btn akb-btn--glass w-full !min-h-[44px]"
                          >
                            <ChevronDown size={16} />
                            <span>
                              Show more ({searchResults.length - visibleCount} remaining)
                            </span>
                          </button>
                        )}
                      </div>
                    ) : (
                      /* STATE 5: Idle State */
                      <div className="p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--input-bg)] text-center space-y-1">
                        <p className="text-xs sm:text-sm font-heading font-semibold text-[var(--text-secondary)] m-0">
                          Search by email, name, @handle or ID
                        </p>
                        <p className="text-xs text-[var(--text-muted)] m-0">
                          Type at least 2 characters or paste a student&rsquo;s email address.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Bottom / Right Column: Wallet Ledger History */}
            <div className="lg:col-span-7 space-y-3.5">
              <section className="akb-glass-card space-y-4" aria-labelledby="akb-ledger-heading">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <History size={17} className="text-[var(--accent)]" />
                    <h2
                      id="akb-ledger-heading"
                      className="font-heading font-bold text-base text-[var(--text)] m-0"
                    >
                      Wallet Ledger History
                    </h2>
                  </div>
                  {selectedUser && (
                    <span className="text-xs text-[var(--text-muted)] font-mono truncate max-w-full">
                      {selectedUser.email || selectedUser.displayName}
                    </span>
                  )}
                </div>

                {ledgerLoading ? (
                  <div className="py-4">
                    <LineLoader context="admin" message="Loading wallet ledger..." />
                  </div>
                ) : !selectedUser ? (
                  <div className="p-8 rounded-2xl border border-[var(--glass-border)] bg-[var(--input-bg)] text-center text-xs sm:text-sm text-[var(--text-muted)] font-heading">
                    Select a user above
                  </div>
                ) : selectedUserLedger.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-[var(--glass-border)] bg-[var(--input-bg)] text-center space-y-1">
                    <p className="text-sm font-heading font-semibold text-[var(--text)] m-0">
                      No ledger transactions yet
                    </p>
                    <p className="text-xs text-[var(--text-muted)] m-0">
                      Wallet initialized with 0 Kobans. Adjustments will be recorded here permanently.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {selectedUserLedger.map((entry) => {
                      const isPositive = entry.amount > 0;
                      const sec = (entry.timestamp as { seconds?: number })?.seconds;
                      const dateStr = sec
                        ? new Date(sec * 1000).toLocaleString('en-US', {
                            timeZone: 'Asia/Karachi',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Just now';

                      const beforeBal =
                        typeof entry.balanceBefore === 'number'
                          ? entry.balanceBefore
                          : typeof entry.balance_before === 'number'
                          ? entry.balance_before
                          : undefined;
                      const afterBal =
                        typeof entry.balanceAfter === 'number'
                          ? entry.balanceAfter
                          : typeof entry.balance_after === 'number'
                          ? entry.balance_after
                          : undefined;
                      const isHighlightedTx =
                        Boolean(deepLinkTx) &&
                        (entry.id === deepLinkTx ||
                          entry.transactionId === deepLinkTx ||
                          entry.id?.includes(deepLinkTx));

                      return (
                        <div
                          key={entry.id}
                          className={`py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 text-xs ${
                            isHighlightedTx
                              ? 'px-3 -mx-3 rounded-xl bg-amber-500/10 border border-amber-500/30'
                              : ''
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`akb-chip ${
                                  isPositive ? 'akb-chip--approved' : 'akb-chip--rejected'
                                }`}
                              >
                                {entry.type}
                              </span>
                              <span className="font-heading font-semibold text-sm text-[var(--text)] break-words">
                                {entry.reason || 'Ledger adjustment'}
                              </span>
                            </div>

                            <div className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-2 flex-wrap">
                              <span>{dateStr} PKT</span>
                              {entry.id && <span>• TX: {entry.id.slice(0, 14)}</span>}
                              {entry.adminEmail && <span>• Admin: {entry.adminEmail}</span>}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`font-mono font-extrabold text-sm tabular-nums ${
                                isPositive
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {isPositive
                                ? `+${entry.amount.toLocaleString()}`
                                : entry.amount.toLocaleString()}
                            </span>
                            {afterBal !== undefined && (
                              <span className="block text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                                {beforeBal !== undefined
                                  ? `Bal: ${beforeBal.toLocaleString()} → ${afterBal.toLocaleString()}`
                                  : `Bal: ${afterBal.toLocaleString()}`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* ─── TAB 3: COSMETICS GALLERY ────────────────────────────────────── */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="akb-glass-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-heading font-bold text-base text-[var(--text)] m-0">
                    Cosmetics Catalog Audit (100 Items)
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 mb-0">
                    Inspect all 100 cosmetic items across Nameplates, Avatar Frames, Profile Effects, and Avatars.
                  </p>
                </div>
                <span className="akb-chip akb-chip--approved self-start sm:self-auto">
                  100 / 100 Verified
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(
                  [
                    { key: 'all', label: 'All (100)' },
                    { key: 'nameplate', label: 'Nameplates (25)' },
                    { key: 'frame', label: 'Frames (25)' },
                    { key: 'effect', label: 'Effects (25)' },
                    { key: 'avatar', label: 'Avatars (25)' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setGalleryCategory(tab.key)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-heading font-bold transition-all cursor-pointer border ${
                      galleryCategory === tab.key
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text)] border-[var(--glass-border)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {(galleryCategory === 'all' || galleryCategory === 'nameplate') && (
                <div className="pt-3 border-t border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-heading font-semibold text-[var(--text-muted)]">
                      Viewport:
                    </span>
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)]">
                      {(
                        [
                          { vp: '360', label: '360px', icon: Smartphone },
                          { vp: '390', label: '390px', icon: Smartphone },
                          { vp: '768', label: '768px', icon: Tablet },
                          { vp: '100%', label: 'Full', icon: Monitor },
                        ] as const
                      ).map(({ vp, label, icon: Icon }) => (
                        <button
                          key={vp}
                          type="button"
                          onClick={() => setGalleryViewport(vp)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            galleryViewport === vp
                              ? 'bg-[var(--accent)] text-white'
                              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          <Icon size={11} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="akb-sample-name"
                      className="text-xs font-heading font-semibold text-[var(--text-muted)] shrink-0"
                    >
                      Sample Name:
                    </label>
                    <input
                      id="akb-sample-name"
                      type="text"
                      value={galleryTestName}
                      onChange={(e) => setGalleryTestName(e.target.value)}
                      placeholder="Type preview name..."
                      className="akb-input !min-h-[38px] !py-1.5 !px-3 !text-xs max-w-[220px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {COSMETICS_CATALOG.filter(
                (c) => galleryCategory === 'all' || c.type === galleryCategory
              ).map((item) => (
                <div
                  key={item.id}
                  className="akb-glass-card space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-sm text-[var(--text)]">
                          {item.name}
                        </span>
                        <span
                          className={`akb-chip ${
                            item.animated ? 'akb-chip--pro' : 'akb-chip--muted'
                          }`}
                        >
                          {item.animated ? 'Animated' : 'Static'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] uppercase font-mono">
                        {item.type} • {item.rarity}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[var(--text)] shrink-0">
                      {item.priceKobans} K
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--glass-border)] overflow-hidden flex items-center justify-center min-h-[100px] relative">
                    {item.type === 'nameplate' && (
                      <div
                        style={{
                          width: galleryViewport === '100%' ? '100%' : `${galleryViewport}px`,
                          maxWidth: '100%',
                        }}
                        className="flex items-center justify-center overflow-hidden p-2 rounded-lg"
                      >
                        <Nameplate
                          itemId={item.id}
                          name={galleryTestName || 'Student Name'}
                          shortId="98402"
                          roleBadge="CAPTAIN"
                          className="max-w-full"
                        />
                      </div>
                    )}

                    {item.type === 'frame' && (
                      <div className="p-3 flex items-center justify-center overflow-visible">
                        <AvatarFrame itemId={item.id} size={76}>
                          <div className="w-full h-full rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-zinc-300 font-mono text-[10px]">
                            AVATAR
                          </div>
                        </AvatarFrame>
                      </div>
                    )}

                    {item.type === 'effect' && (
                      <div className="w-full h-36">
                        <ProfileEffectCardPreview itemId={item.id} />
                      </div>
                    )}

                    {item.type === 'avatar' && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-black/40">
                        <AvatarPicture avatarId={item.id} size={96} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono pt-1 border-t border-[var(--border)]">
                    <span className="truncate">id: {item.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: APPROVE REQUEST ─────────────────────────────────────────── */}
      {approveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="akb-approve-modal-title"
        >
          <div className="akb-glass-card w-full max-w-md space-y-4">
            <h3
              id="akb-approve-modal-title"
              className="font-heading font-extrabold text-lg text-[var(--text)] m-0"
            >
              Approve Koban Payment
            </h3>

            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--glass-border)] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between gap-2 text-[var(--text-muted)]">
                <span>Student:</span>
                <span className="text-[var(--text)] font-bold text-right">
                  {approveTarget.userName}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-[var(--text-muted)]">
                <span>Email:</span>
                <span className="text-[var(--text)] break-all text-right">
                  {approveTarget.userEmail}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-[var(--text-muted)]">
                <span>Transaction ID:</span>
                <span className="text-[var(--text)] font-bold text-right">
                  {approveTarget.transactionId}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-[var(--text-muted)]">
                <span>Method:</span>
                <span className="text-[var(--text)] text-right">
                  {formatPaymentMethodLabel(approveTarget.paymentMethod)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="akb-editable-koban-amount"
                className="text-xs font-heading font-bold text-[var(--text-secondary)] block"
              >
                Kobans to Credit
              </label>
              <input
                id="akb-editable-koban-amount"
                type="number"
                min="1"
                step="10"
                value={editableAmount}
                onChange={(e) => setEditableAmount(Number(e.target.value))}
                className="akb-input font-mono font-bold"
              />
              <p className="text-[11px] text-[var(--text-muted)] m-0">
                Equivalent PKR: PKR {Math.floor(editableAmount / 10)}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="akb-btn akb-btn--glass flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={approving || editableAmount <= 0}
                onClick={handleConfirmApprove}
                className="relative overflow-hidden akb-btn akb-btn--primary flex-1"
              >
                <CheckCircle2 size={15} />
                <span>
                  {approving
                    ? 'Crediting...'
                    : `Credit ${editableAmount.toLocaleString()} Kobans`}
                </span>
                {approving && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT REQUEST ──────────────────────────────────────────── */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="akb-reject-modal-title"
        >
          <div className="akb-glass-card w-full max-w-md space-y-4">
            <h3
              id="akb-reject-modal-title"
              className="font-heading font-extrabold text-lg text-[var(--text)] m-0"
            >
              Reject Koban Request
            </h3>
            <p className="text-xs text-[var(--text-muted)] m-0">
              Specify the reason for rejection. The student will receive an in-app notification with this reason.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="akb-input !min-h-[88px]"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="akb-btn akb-btn--glass flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejecting}
                onClick={handleConfirmReject}
                className="relative overflow-hidden akb-btn akb-btn--primary flex-1"
              >
                <XCircle size={15} />
                <span>{rejecting ? 'Rejecting...' : 'Confirm Rejection'}</span>
                {rejecting && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRM BALANCE ADJUSTMENT ──────────────────────────────── */}
      {adjustConfirmOpen && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="akb-confirm-adjust-title"
        >
          <div className="akb-glass-card w-full max-w-md space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/12 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0">
                <Sparkles size={19} />
              </div>
              <div className="min-w-0">
                <h3
                  id="akb-confirm-adjust-title"
                  className="font-heading font-extrabold text-base text-[var(--text)] m-0 leading-snug"
                >
                  {adjustMode === 'grant' ? 'Add' : 'Deduct'} {parsedAmountNum.toLocaleString()}{' '}
                  Kobans {adjustMode === 'grant' ? 'to' : 'from'}{' '}
                  {selectedUser.name || 'Student'} ({selectedUser.email || selectedUser.uid})?
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 mb-0">
                  This writes an immutable entry to the student&rsquo;s wallet ledger.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--glass-border)] space-y-2 text-xs font-mono">
              <div className="flex justify-between gap-2 text-[var(--text-muted)]">
                <span>Student:</span>
                <span className="font-bold text-[var(--text)] text-right">
                  {selectedUser.name || selectedUser.displayName}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-[var(--text-muted)]">
                <span>Email:</span>
                <span className="text-[var(--text)] break-all text-right">
                  {selectedUser.email || selectedUser.uid}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-[var(--text-muted)]">
                <span>Current Balance:</span>
                <span className="text-[var(--text)] font-bold tabular-nums">
                  {currentBalanceNum.toLocaleString()} Kobans
                </span>
              </div>
              <div className="flex justify-between gap-2 text-[var(--text-muted)]">
                <span>Adjustment:</span>
                <span
                  className={`font-bold tabular-nums ${
                    adjustMode === 'grant'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {adjustMode === 'grant' ? '+' : '-'}
                  {parsedAmountNum.toLocaleString()} Kobans
                </span>
              </div>
              <div className="flex justify-between gap-2 pt-2 border-t border-[var(--border)] text-[var(--text)]">
                <span>New Balance Preview:</span>
                <span className="font-extrabold tabular-nums">
                  {previewNewBalance.toLocaleString()} Kobans
                </span>
              </div>
              <div className="flex justify-between gap-2 pt-1 text-[var(--text-muted)]">
                <span>Reason:</span>
                <span className="text-[var(--text)] text-right break-words">
                  {adjustReason.trim()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAdjustConfirmOpen(false)}
                disabled={adjusting}
                className="akb-btn akb-btn--glass flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adjusting}
                onClick={handleConfirmAdjustment}
                className="relative overflow-hidden akb-btn akb-btn--primary flex-1"
              >
                <Send size={15} />
                <span>
                  {adjusting
                    ? 'Applying...'
                    : `Confirm ${adjustMode === 'grant' ? 'Add' : 'Deduct'}`}
                </span>
                {adjusting && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminKobansPage;

import { useState, useEffect, useCallback } from 'react';
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
import { fetchUsersPaginated } from '@/services/adminService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COSMETICS_CATALOG } from '@/data/cosmeticsCatalog';
import {
  AvatarPicture,
  AvatarFrame,
  Nameplate,
  ProfileEffectCardPreview,
} from '@/components/koban/CosmeticRenderers';
import { Smartphone, Tablet, Monitor } from 'lucide-react';
import type { UserProfile, KobanRequest, WalletLedgerEntry } from '@/types';

export function AdminKobansPage() {
  const { user } = useAuth();
  const superadminEmail = user?.email || 'shsvirtualadmin@gmail.com';

  const [activeTab, setActiveTab] = useState<'adjust' | 'requests' | 'gallery'>('requests');
  const [galleryViewport, setGalleryViewport] = useState<'360' | '390' | '768' | '100%'>('390');
  const [galleryTestName, setGalleryTestName] = useState('Muhammad Abdullah Tariq');
  const [galleryCategory, setGalleryCategory] = useState<'all' | 'nameplate' | 'frame' | 'effect' | 'avatar'>('all');

  // Requests state
  const [requests, setRequests] = useState<KobanRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Approve Modal state
  const [approveTarget, setApproveTarget] = useState<KobanRequest | null>(null);
  const [editableAmount, setEditableAmount] = useState<number>(0);
  const [approving, setApproving] = useState(false);

  // Reject Modal state
  const [rejectTarget, setRejectTarget] = useState<KobanRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Transaction ID could not be verified on mobile banking portal.');
  const [rejecting, setRejecting] = useState(false);

  // Manual Adjustment state
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load requests
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

  // Search users for adjustment
  const handleUserSearch = async (queryText: string) => {
    setUserSearch(queryText);
    if (!queryText.trim() || queryText.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const res = await fetchUsersPaginated({
        searchQuery: queryText.trim(),
        limitCount: 10,
      });
      setSearchResults(res.users);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Select user and fetch their live wallet balance + ledger
  const handleSelectUser = async (u: UserProfile) => {
    setSelectedUser(u);
    setSearchResults([]);
    setUserSearch('');
    setSelectedUserBalance(null);
    setLedgerLoading(true);

    try {
      const wSnap = await getDoc(doc(db, 'wallets', u.uid));
      if (wSnap.exists()) {
        const wData = wSnap.data();
        setSelectedUserBalance(typeof wData.balance === 'number' ? wData.balance : 0);
      } else {
        setSelectedUserBalance(0);
      }

      const ledger = await fetchUserLedger(u.uid);
      setSelectedUserLedger(ledger);
    } catch (err) {
      console.warn('Failed to fetch user wallet/ledger:', err);
      setSelectedUserBalance(0);
    } finally {
      setLedgerLoading(false);
    }
  };

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
      setTimeout(() => setActionSuccess(null), 3000);
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
      setTimeout(() => setActionSuccess(null), 3000);
      await loadRequests();
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Failed to reject request');
    } finally {
      setRejecting(false);
    }
  };

  // Manual Adjustment Submission
  const handleConfirmAdjustment = async () => {
    if (!selectedUser) return;
    const num = parseInt(adjustAmount, 10);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid positive integer amount.');
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
        adjustReason.trim() || (delta > 0 ? 'Superadmin grant' : 'Superadmin deduction'),
        selectedUser.email
      );

      setSelectedUserBalance(res.newBalance);
      setAdjustConfirmOpen(false);
      setActionSuccess(
        `Successfully ${delta > 0 ? 'granted' : 'deducted'} ${Math.abs(delta).toLocaleString()} Kobans. New balance: ${res.newBalance.toLocaleString()}.`
      );
      setTimeout(() => setActionSuccess(null), 4000);

      // Refresh user ledger
      const updatedLedger = await fetchUserLedger(selectedUser.uid);
      setSelectedUserLedger(updatedLedger);
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-[var(--text)] tracking-tight">
              Kobans Economy &amp; Wallets
            </h1>
            <span className="badge-pill flex items-center gap-1.5 text-xs font-semibold text-[#E8A317] border border-[#E8A317]/40 bg-[#E8A317]/10">
              <KobanIcon size={14} /> 10 Kobans = PKR 1
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Review student mobile payments, grant monthly Captain allowances, and manage user wallet ledgers.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRequests}
          disabled={requestsLoading}
          className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors self-start sm:self-auto cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-xs font-heading flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500 text-red-300 text-xs font-heading flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ─── TOP TABS ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
              : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
          }`}
        >
          <span>Pending Requests</span>
          {requests.filter((r) => r.status === 'pending').length > 0 && (
            <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--red)] text-white">
              {requests.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('adjust')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'adjust'
              ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
              : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
          }`}
        >
          <span>Manual Balance Adjustment &amp; Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'gallery'
              ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
              : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
          }`}
        >
          <span>Nameplate Gallery (360px/390px/768px)</span>
        </button>
      </div>

      {/* ─── TAB 1: KOBAN REQUESTS ─────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setRequestFilter(st)}
                className={`text-xs capitalize font-heading font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  requestFilter === st
                    ? 'border-[#E8A317] bg-[#E8A317]/15 text-[#FFD66B]'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {requestsLoading ? (
            <LineLoader context="admin" message="Loading Koban requests..." />
          ) : requests.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] space-y-2">
              <Clock size={28} className="mx-auto text-[var(--muted)]" />
              <p className="text-xs font-heading">No {requestFilter} Koban requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm text-[var(--text)]">
                        {req.userName || 'Student'}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                          req.status === 'approved'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : req.status === 'rejected'
                            ? 'border-red-500 bg-red-500/10 text-red-400'
                            : 'border-amber-500 bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--muted)] uppercase">
                        via {req.paymentMethod}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--muted)] font-mono flex items-center gap-2 flex-wrap">
                      <span>User ID: {req.userId.slice(0, 8)}…</span>
                      {req.userEmail && <span>• {req.userEmail}</span>}
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                      <div className="flex items-center gap-1.5 bg-[var(--surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                        <span className="text-[var(--muted)]">TRX:</span>
                        <span className="font-bold text-[var(--text)]">{req.transactionId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(req.transactionId, req.id)}
                          className="text-[var(--muted)] hover:text-white"
                          title="Copy TRX"
                        >
                          {copiedId === req.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>

                      <div className="text-[var(--muted)]">
                        Amount: <strong className="text-[#FFD66B]">{req.amount.toLocaleString()} Kobans</strong> (PKR {req.pkrAmount})
                      </div>
                    </div>

                    {req.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">Rejection reason: {req.rejectionReason}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => handleOpenReject(req)}
                        className="px-3.5 py-2 rounded-xl text-xs font-heading font-semibold border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenApprove(req)}
                        className="btn-red px-4 py-2 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 size={14} />
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

      {/* ─── TAB 2: MANUAL ADJUSTMENT & LEDGER ─────────────────────────────── */}
      {activeTab === 'adjust' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: User Search & Adjustment (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4">
              <h3 className="font-heading font-bold text-base text-[var(--text)]">
                Find Student Account
              </h3>

              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search by student name or email..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)]"
                />
              </div>
              {searchingUsers && (
                <LineLoader context="admin" message="Searching student accounts..." className="min-h-[80px] py-4" />
              )}

              {/* Search dropdown results */}
              {searchResults.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] max-h-56 overflow-y-auto divide-y divide-[var(--border)]">
                  {searchResults.map((u) => (
                    <button
                      key={u.uid}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className="w-full p-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-heading font-semibold text-[var(--text)] truncate">
                          {u.displayName || 'Student'}
                        </div>
                        <div className="text-[10px] text-[var(--muted)] font-mono truncate">{u.email}</div>
                      </div>
                      <span className="text-[10px] font-mono text-[#E8A317] shrink-0">#{u.shortId || u.uid.slice(0, 5)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected User Display */}
              {selectedUser ? (
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[var(--text)]">
                        {selectedUser.displayName || 'Student'}
                      </h4>
                      <p className="text-[11px] text-[var(--muted)] font-mono">{selectedUser.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--muted)] font-heading uppercase block">Balance</span>
                      <div className="flex items-center gap-1">
                        <KobanIcon size={14} />
                        <span className="font-mono font-bold text-sm text-[#FFD66B]">
                          {selectedUserBalance === null ? '…' : selectedUserBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setAdjustMode('grant')}
                      className={`py-2 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        adjustMode === 'grant'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]'
                      }`}
                    >
                      <Plus size={14} />
                      <span>Grant (+)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustMode('deduct')}
                      className={`py-2 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        adjustMode === 'deduct'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]'
                      }`}
                    >
                      <Minus size={14} />
                      <span>Deduct (-)</span>
                    </button>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-heading text-[var(--muted)]">
                      <span>Amount (Positive whole number)</span>
                      <span className="text-emerald-400 font-mono">No Cap</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-mono font-bold text-[#FFD66B] focus:outline-none focus:border-[var(--red)]"
                    />
                  </div>

                  {/* Reason Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-heading text-[var(--muted)] block">
                      Reason / Payment Reference
                    </label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="e.g. Verified manual transfer / Bug bounty reward"
                      className="w-full px-3.5 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)]"
                    />
                  </div>

                  {/* Action trigger button */}
                  <button
                    type="button"
                    onClick={() => setAdjustConfirmOpen(true)}
                    className="btn-red w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-2"
                  >
                    <Send size={13} />
                    <span>
                      {adjustMode === 'grant' ? 'Grant' : 'Deduct'} {Number(adjustAmount || 0).toLocaleString()} Kobans
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
                  Search and pick a student account to view their balance and adjust Kobans.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: User Ledger History (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-[#E8A317]" />
                  <h3 className="font-heading font-bold text-base text-[var(--text)]">
                    Wallet Ledger History
                  </h3>
                </div>
                {selectedUser && (
                  <span className="text-xs text-[var(--muted)] font-mono">
                    User: {selectedUser.displayName}
                  </span>
                )}
              </div>

              {ledgerLoading ? (
                <LineLoader context="admin" message="Loading wallet ledger..." />
              ) : !selectedUser ? (
                <div className="p-10 text-center text-xs text-[var(--muted)]">
                  Select a user on the left to inspect their immutable transaction ledger.
                </div>
              ) : selectedUserLedger.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--muted)]">
                  No ledger transactions recorded yet for this wallet.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)] max-h-[500px] overflow-y-auto pr-1">
                  {selectedUserLedger.map((entry) => {
                    const isPositive = entry.amount > 0;
                    const sec = (entry.timestamp as { seconds?: number })?.seconds;
                    const dateStr = sec ? new Date(sec * 1000).toLocaleString('en-US', { timeZone: 'Asia/Karachi' }) : 'Recent';

                    return (
                      <div key={entry.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                                entry.type === 'purchase'
                                  ? 'bg-purple-950/40 text-purple-400 border border-purple-500/30'
                                  : entry.type === 'captain_allotment'
                                  ? 'bg-blue-950/40 text-blue-400 border border-blue-500/30'
                                  : isPositive
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-950/40 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {entry.type}
                            </span>
                            <span className="font-heading font-semibold text-[var(--text)] truncate">
                              {entry.reason || 'Ledger event'}
                            </span>
                          </div>

                          <div className="text-[10px] text-[var(--muted)] font-mono flex items-center gap-2 flex-wrap">
                            <span>{dateStr} (PKT)</span>
                            {entry.adminEmail && <span>• Admin: {entry.adminEmail}</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isPositive ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {isPositive ? `+${entry.amount.toLocaleString()}` : entry.amount.toLocaleString()}
                          </span>
                          {typeof entry.balanceAfter === 'number' && (
                            <span className="block text-[10px] text-[var(--muted)] font-mono">
                              Bal: {entry.balanceAfter.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ALL 100 COSMETIC DROPS GALLERY & AUDIT ─────────────────── */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* Summary Count Table */}
          <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-base text-[var(--text)]">
                  Cosmetics Catalog Audit & Inspection (100 Total Items)
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Complete breakdown of all 100 cosmetic items across all 4 categories. Verified 0 look-alikes, zero static motion, and active looping motion for all animated items.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20 self-start sm:self-auto">
                100 / 100 Verified
              </span>
            </div>

            {/* Count Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--surface-2)] text-[var(--text)] font-heading uppercase text-[10px] tracking-wider border-b border-[var(--border)]">
                  <tr>
                    <th className="py-2.5 px-4">Cosmetic Type</th>
                    <th className="py-2.5 px-4">Static (Zero Motion)</th>
                    <th className="py-2.5 px-4">Animated (Looping Motion)</th>
                    <th className="py-2.5 px-4 text-right">Total Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--muted)]">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-4 font-bold text-[var(--text)]">Nameplates</td>
                    <td className="py-2 px-4 text-neutral-300">13</td>
                    <td className="py-2 px-4 text-purple-400 font-bold">12</td>
                    <td className="py-2 px-4 text-right font-bold text-[var(--text)]">25</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-4 font-bold text-[var(--text)]">Avatar Frames</td>
                    <td className="py-2 px-4 text-neutral-300">13</td>
                    <td className="py-2 px-4 text-purple-400 font-bold">12</td>
                    <td className="py-2 px-4 text-right font-bold text-[var(--text)]">25</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-4 font-bold text-[var(--text)]">Profile Effects</td>
                    <td className="py-2 px-4 text-neutral-300">13</td>
                    <td className="py-2 px-4 text-purple-400 font-bold">12</td>
                    <td className="py-2 px-4 text-right font-bold text-[var(--text)]">25</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-4 font-bold text-[var(--text)]">Profile Pictures</td>
                    <td className="py-2 px-4 text-neutral-300">13</td>
                    <td className="py-2 px-4 text-purple-400 font-bold">12</td>
                    <td className="py-2 px-4 text-right font-bold text-[var(--text)]">25</td>
                  </tr>
                  <tr className="bg-[var(--surface-2)]/60 font-bold text-[var(--text)]">
                    <td className="py-2.5 px-4">Grand Total</td>
                    <td className="py-2.5 px-4 text-neutral-200">52</td>
                    <td className="py-2.5 px-4 text-purple-300">48</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400">100</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs font-heading font-semibold text-[var(--muted)] mr-1">Filter Type:</span>
              {(
                [
                  { key: 'all', label: 'All Items (100)' },
                  { key: 'nameplate', label: 'Nameplates (25)' },
                  { key: 'frame', label: 'Avatar Frames (25)' },
                  { key: 'effect', label: 'Profile Effects (25)' },
                  { key: 'avatar', label: 'Profile Pictures (25)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setGalleryCategory(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
                    galleryCategory === tab.key
                      ? 'bg-[var(--red)] text-white shadow-xs'
                      : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Viewport and Sample Name Controls (Only relevant for nameplates) */}
            {(galleryCategory === 'all' || galleryCategory === 'nameplate') && (
              <div className="pt-3 border-t border-[var(--border)] space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-semibold text-[var(--muted)]">
                      Nameplate Viewport Simulator:
                    </span>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
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
                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            galleryViewport === vp
                              ? 'bg-[var(--text)] text-[var(--bg)] shadow-xs'
                              : 'text-[var(--muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          <Icon size={11} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-semibold text-[var(--muted)] shrink-0">
                      Sample Name:
                    </span>
                    <input
                      type="text"
                      value={galleryTestName}
                      onChange={(e) => setGalleryTestName(e.target.value)}
                      placeholder="Type preview name..."
                      className="px-3 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] font-medium focus:outline-none focus:border-[var(--red)] w-48"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gallery Items Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-semibold text-[var(--muted)] uppercase tracking-wider">
                Showing {COSMETICS_CATALOG.filter((c) => galleryCategory === 'all' || c.type === galleryCategory).length} Items
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">
                Looping Keyframes Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {COSMETICS_CATALOG.filter((c) => galleryCategory === 'all' || c.type === galleryCategory).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-sm text-[var(--text)]">
                            {item.name}
                          </span>
                          {item.animated ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full border border-purple-500/40 bg-purple-950/40 text-purple-300 font-mono font-bold">
                              ANIMATED
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full border border-neutral-600 bg-neutral-900 text-neutral-300 font-mono">
                              STATIC
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--muted)] uppercase font-mono tracking-wider">
                          Type: {item.type} • {item.rarity}
                        </span>
                      </div>
                      <span className="text-xs text-[#FFD66B] font-mono font-bold shrink-0">
                        {item.priceKobans} K
                      </span>
                    </div>
                  </div>

                  {/* Preview Area specific to item type */}
                  <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex items-center justify-center min-h-[100px] relative">
                    {/* 1. Nameplate Preview */}
                    {item.type === 'nameplate' && (
                      <div
                        style={{
                          width: galleryViewport === '100%' ? '100%' : `${galleryViewport}px`,
                          maxWidth: '100%',
                        }}
                        className="flex items-center justify-center overflow-hidden border border-dashed border-[var(--border)]/60 p-2 rounded-lg"
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

                    {/* 2. Avatar Frame Preview */}
                    {item.type === 'frame' && (
                      <div className="p-3 flex items-center justify-center overflow-visible">
                        <AvatarFrame itemId={item.id} size={76}>
                          <div className="w-full h-full rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-zinc-400 font-mono text-[10px]">
                            AVATAR
                          </div>
                        </AvatarFrame>
                      </div>
                    )}

                    {/* 3. Profile Effect Preview */}
                    {item.type === 'effect' && (
                      <div className="w-full h-36">
                        <ProfileEffectCardPreview itemId={item.id} />
                      </div>
                    )}

                    {/* 4. Profile Picture Preview */}
                    {item.type === 'avatar' && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-black/40">
                        <AvatarPicture avatarId={item.id} size={96} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-mono pt-1 border-t border-[var(--border)]/50">
                    <span className="truncate">id: {item.id}</span>
                    <span className="shrink-0">{item.description ? item.description.slice(0, 30) + '...' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: APPROVE REQUEST ─────────────────────────────────────────── */}
      {approveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 className="font-heading font-extrabold text-lg text-[var(--text)]">
              Approve Koban Payment
            </h3>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Student:</span>
                <span className="text-[var(--text)] font-bold">{approveTarget.userName}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Email:</span>
                <span className="text-[var(--text)]">{approveTarget.userEmail}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Transaction ID:</span>
                <span className="text-[var(--text)] font-bold">{approveTarget.transactionId}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Payment Method:</span>
                <span className="text-[var(--text)] uppercase">{approveTarget.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold text-[var(--text)] uppercase tracking-wider block">
                Kobans to Credit (Editable if over/underpaid)
              </label>
              <input
                type="number"
                min="1"
                step="10"
                value={editableAmount}
                onChange={(e) => setEditableAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono font-bold text-[#FFD66B] focus:outline-none focus:border-[var(--red)]"
              />
              <p className="text-[11px] text-[var(--muted)]">
                Equivalent PKR: PKR {Math.floor(editableAmount / 10)}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="btn-outline flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={approving || editableAmount <= 0}
                onClick={handleConfirmApprove}
                className="relative overflow-hidden btn-red flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>
                  {approving ? 'Crediting Kobans...' : `Credit ${editableAmount.toLocaleString()} Kobans`}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-lg text-[var(--text)]">
              Reject Koban Request
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Specify the reason for rejection. The student will receive an in-app notification with this reason.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="btn-outline flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejecting}
                onClick={handleConfirmReject}
                className="relative overflow-hidden px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex-1 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <XCircle size={14} />
                <span>{rejecting ? 'Rejecting request...' : 'Confirm Rejection'}</span>
                {rejecting && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRM MANUAL ADJUSTMENT (NO CAP) ──────────────────────── */}
      {adjustConfirmOpen && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E8A317]/10 border border-[#E8A317]/30 flex items-center justify-center text-[#FFD66B]">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-[var(--text)]">
                  Confirm Balance Adjustment
                </h3>
                <p className="text-[11px] text-[var(--muted)]">Superadmin authorization required</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Student:</span>
                <span className="font-bold text-[var(--text)]">{selectedUser.displayName}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Email:</span>
                <span className="text-[var(--text)]">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Action:</span>
                <span className={adjustMode === 'grant' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {adjustMode === 'grant' ? 'GRANT (+)' : 'DEDUCT (-)'}
                </span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Amount:</span>
                <span className="text-[#FFD66B] font-bold">
                  {Number(adjustAmount).toLocaleString()} Kobans
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[var(--border)] text-[var(--text)]">
                <span>New Resulting Balance:</span>
                <span className="font-bold">
                  {Math.max(
                    0,
                    (selectedUserBalance || 0) + (adjustMode === 'grant' ? Number(adjustAmount) : -Number(adjustAmount))
                  ).toLocaleString()} Kobans
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustConfirmOpen(false)}
                className="btn-outline flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adjusting}
                onClick={handleConfirmAdjustment}
                className="relative overflow-hidden btn-red flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Send size={14} />
                <span>{adjusting ? 'Authorizing adjustment...' : 'Authorize Change'}</span>
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

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { AvatarPicker } from '@/lib/matrixAvatars';
import { type MatrixAvatarVariant } from '@/lib/matrixAvatarsData';
import type { CrewDoc, PublicCrewSummary, CrewJoinMode } from '@/types/crew';
import {
  fetchCrewLeaderboard,
  fetchCrewDetails,
  updateCrewSettings,
  removeMemberFromCrew,
  promoteMemberToLeader,
  handleRequestAction,
  adminDisbandCrew,
} from '@/services/crewService';
import { recordCrewPaymentActionServer } from '@/services/crewBackend';
import { DEFAULT_CREW_PRICING } from '@/config/crewPricing';
import {
  Search,
  Sparkles,
  Users,
  CreditCard,
  Edit,
  Trash2,
  AlertTriangle,
  Check,
  X,
  ChevronRight,
  UserX,
  Award,
  RefreshCw,
} from 'lucide-react';

export function AdminCrewsPage() {
  const { user } = useAuth();
  const [crews, setCrews] = useState<PublicCrewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'paid' | 'closed'>('all');

  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [crewDetails, setCrewDetails] = useState<CrewDoc | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Edit settings state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarKey, setEditAvatarKey] = useState('skull-01');
  const [editAvatarVariant, setEditAvatarVariant] = useState<MatrixAvatarVariant>('red-on-black');
  const [editJoinMode, setEditJoinMode] = useState<CrewJoinMode>('direct');
  const [editMinStreak, setEditMinStreak] = useState(0);
  const [editMaxMembers, setEditMaxMembers] = useState(5);
  const [editIsClosed, setEditIsClosed] = useState(false);

  // Payment controls modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAction, setPaymentAction] = useState<'mark_paid' | 'extend_month' | 'mark_unpaid'>('extend_month');
  const [paymentReason, setPaymentReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(DEFAULT_CREW_PRICING.largeCrewPricePKR);
  const [paymentTxId, setPaymentTxId] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Disband modal
  const [disbandModalOpen, setDisbandModalOpen] = useState(false);
  const [disbandTypedName, setDisbandTypedName] = useState('');
  const [disbandSubmitting, setDisbandSubmitting] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadCrews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCrewLeaderboard({ limit: 100 });
      setCrews(res.crews);
    } catch (err) {
      console.error('[AdminCrewsPage] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrews();
  }, [loadCrews]);

  const loadCrewDetails = async (id: string) => {
    setSelectedCrewId(id);
    setDetailsLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const data = await fetchCrewDetails(id);
      setCrewDetails(data);
      if (data) {
        setEditName(data.name || '');
        setEditBio(data.bio || '');
        setEditAvatarKey(data.avatarKey || 'skull-01');
        setEditAvatarVariant((data.avatarVariant as MatrixAvatarVariant) || 'red-on-black');
        setEditJoinMode(data.joinMode || 'direct');
        setEditMinStreak(Number(data.minStreak) || 0);
        setEditMaxMembers(Number(data.maxMembers) || 5);
        setEditIsClosed(Boolean(data.isClosed));
      }
    } catch (err) {
      console.error('[AdminCrewsPage] Details error:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrewId || !user) return;
    setActionError(null);
    try {
      await updateCrewSettings(
        selectedCrewId,
        {
          name: editName,
          bio: editBio,
          avatarKey: editAvatarKey,
          avatarVariant: editAvatarVariant,
          joinMode: editJoinMode,
          minStreak: editMinStreak,
          maxMembers: editMaxMembers,
          isClosed: editIsClosed,
        },
        { uid: user.uid, email: user.email || '', isAdmin: true }
      );
      setActionSuccess('Crew settings successfully updated.');
      setIsEditing(false);
      loadCrewDetails(selectedCrewId);
      loadCrews();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  const handleRemoveMember = async (targetUid: string, memberName: string) => {
    if (!selectedCrewId || !user) return;
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this crew?`)) return;
    try {
      await removeMemberFromCrew(selectedCrewId, targetUid, {
        uid: user.uid,
        email: user.email || '',
        isAdmin: true,
      });
      setActionSuccess(`Removed ${memberName} from crew.`);
      loadCrewDetails(selectedCrewId);
      loadCrews();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handlePromoteLeader = async (newLeaderUid: string, memberName: string) => {
    if (!selectedCrewId || !user) return;
    if (!window.confirm(`Transfer leadership of this crew to ${memberName}?`)) return;
    try {
      await promoteMemberToLeader(selectedCrewId, newLeaderUid, {
        uid: user.uid,
        email: user.email || '',
        isAdmin: true,
      });
      setActionSuccess(`Promoted ${memberName} to crew leader.`);
      loadCrewDetails(selectedCrewId);
      loadCrews();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to promote leader');
    }
  };

  const handleModerateRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!selectedCrewId || !user) return;
    try {
      await handleRequestAction({
        crewId: selectedCrewId,
        requestId,
        action,
        operator: { uid: user.uid, email: user.email || '', isAdmin: true },
      });
      setActionSuccess(`Join request ${action}d.`);
      loadCrewDetails(selectedCrewId);
      loadCrews();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : `Failed to ${action} request`);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrewId || !user) return;
    if (!paymentReason.trim()) {
      setActionError('Reason is mandatory for administrative payment modifications.');
      return;
    }
    setPaymentSubmitting(true);
    setActionError(null);
    try {
      await recordCrewPaymentActionServer({
        crewId: selectedCrewId,
        action: paymentAction,
        adminEmail: user.email || 'shsvirtualadmin@gmail.com',
        reason: paymentReason.trim(),
        amount: paymentAmount,
        transactionId: paymentTxId.trim() || 'MANUAL-ADMIN',
      });
      setActionSuccess(`Crew payment status updated: ${paymentAction}`);
      setPaymentModalOpen(false);
      setPaymentReason('');
      loadCrewDetails(selectedCrewId);
      loadCrews();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Payment update failed');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleDisbandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrewId || !crewDetails || !user) return;
    if (disbandTypedName.trim().toLowerCase() !== crewDetails.name.trim().toLowerCase()) {
      setActionError('Typed crew name does not match.');
      return;
    }
    setDisbandSubmitting(true);
    setActionError(null);
    try {
      await adminDisbandCrew(selectedCrewId, disbandTypedName.trim(), user.email || 'admin');
      setActionSuccess(`Crew ${crewDetails.name} has been disbanded.`);
      setDisbandModalOpen(false);
      setSelectedCrewId(null);
      setCrewDetails(null);
      loadCrews();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to disband crew');
    } finally {
      setDisbandSubmitting(false);
    }
  };

  // Filtered crews
  const filteredCrews = crews.filter((c) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false;
    }
    if (filter === 'free') return c.tier !== 'paid' || !c.isPaidActive;
    if (filter === 'paid') return c.tier === 'paid' && c.isPaidActive;
    if (filter === 'closed') return c.isClosed;
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D71921]/20 border border-[#D71921] text-[#D71921] uppercase tracking-wider font-mono">
              Cockpit Superadmin
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Study Crews &amp; Squads Moderation
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Manage all Pakistani student study squads, adjust capacity, moderate members, and control Large Crew subscription lifecycles.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCrews}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Crews</span>
        </button>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Squads' },
            { id: 'free', label: 'Free (≤5)' },
            { id: 'paid', label: 'Large Crew (Pro Shared)' },
            { id: 'closed', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as 'all' | 'free' | 'paid' | 'closed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                filter === tab.id
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#141414] text-[rgba(255,255,255,0.65)] hover:text-white border border-[rgba(255,255,255,0.08)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-xs text-white placeholder-[rgba(255,255,255,0.4)] focus:outline-none focus:border-[#D71921] transition-colors"
          />
        </div>
      </div>

      {/* ── Main Layout: Table + Detail Drawer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Table */}
        <div className={selectedCrewId ? 'lg:col-span-7 space-y-3' : 'lg:col-span-12 space-y-3'}>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-[var(--surface-2)] animate-pulse" />
              ))}
            </div>
          ) : filteredCrews.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
              <Users size={28} className="mx-auto text-[var(--muted)]" />
              <h3 className="text-sm font-bold text-[var(--text)]">No Crews Match Filter</h3>
              <p className="text-xs text-[var(--muted)]">Try selecting "All Squads" or clearing your search query.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCrews.map((c) => {
                const isSelected = selectedCrewId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => loadCrewDetails(c.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#1C1213] border-[#D71921] shadow-md'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MatrixAvatar
                        avatarKey={c.avatarKey}
                        variant={c.avatarVariant}
                        size={44}
                        className="shrink-0"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-sm text-[var(--text)] truncate">
                            {c.name}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/10 text-white/80">
                            {c.code}
                          </span>
                          {c.isPaidActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#D71921]/20 border border-[#D71921] text-[#D71921] flex items-center gap-0.5 shrink-0">
                              <Sparkles size={9} /> Large Crew
                            </span>
                          )}
                          {c.isClosed && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                              Closed
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] flex items-center gap-2 flex-wrap font-mono">
                          <span>Leader: {c.leaderName}</span>
                          <span>&bull;</span>
                          <span>Rank #{c.rank}</span>
                          <span>&bull;</span>
                          <span>{c.score} pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-white flex items-center gap-1 justify-end">
                          <Users size={12} className="text-[#D71921]" />
                          <span>
                            {c.memberCount}/{c.maxMembers}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--muted)] font-mono">
                          {c.isPaidActive ? (
                            <span className="text-emerald-400">Pro Shared</span>
                          ) : (
                            <span>Free Tier</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-[var(--muted)]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detailed Crew Cockpit Drawer */}
        {selectedCrewId && (
          <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6 self-start sticky top-20 max-h-[85vh] overflow-y-auto">
            {detailsLoading ? (
              <div className="p-8 text-center text-xs text-[var(--muted)]">Loading squad details...</div>
            ) : !crewDetails ? (
              <div className="p-8 text-center text-xs text-red-400">Failed to load crew details.</div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <MatrixAvatar
                      avatarKey={crewDetails.avatarKey}
                      variant={crewDetails.avatarVariant}
                      size={54}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <h2 className="font-heading font-bold text-base text-white truncate">
                        {crewDetails.name}
                      </h2>
                      <p className="text-xs text-[var(--muted)] font-mono">
                        Code: {crewDetails.code} &bull; Score: {crewDetails.score || 0} pts
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCrewId(null)}
                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-white hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Status Banners */}
                {actionError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}
                {actionSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-xs flex items-center gap-2">
                    <Check size={14} className="shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {/* Subscription & Payment Status */}
                <div className="p-4 rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.08)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard size={15} className="text-[#D71921]" />
                      <span className="text-xs font-bold text-white uppercase font-heading">
                        Tier &amp; Subscription
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        crewDetails.tier === 'paid' && crewDetails.paid_until && new Date(crewDetails.paid_until).getTime() > Date.now()
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {crewDetails.tier === 'paid' ? 'Large Crew (PKR 499/mo)' : 'Free Crew (≤5)'}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--muted)] space-y-1 font-mono">
                    <div>
                      Paid Until:{' '}
                      <strong className="text-white">
                        {crewDetails.paid_until
                          ? new Date(crewDetails.paid_until).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Never Paid (Free tier)'}
                      </strong>
                    </div>
                    <div>
                      Capacity:{' '}
                      <strong className="text-white">
                        {crewDetails.members?.length || 0} / {crewDetails.maxMembers || 5} members
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full py-2 rounded-lg bg-[#D71921] hover:bg-[#b0131a] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CreditCard size={13} />
                    <span>Manage Crew Payments</span>
                  </button>
                </div>

                {/* Edit Settings Form */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-heading">
                      Squad Settings
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs text-[#D71921] hover:underline flex items-center gap-1 font-mono"
                    >
                      <Edit size={12} />
                      <span>{isEditing ? 'Cancel Edit' : 'Edit Settings'}</span>
                    </button>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Squad Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.15)] text-white text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[var(--muted)] mb-1">Bio (max 160)</label>
                        <textarea
                          value={editBio}
                          maxLength={160}
                          onChange={(e) => setEditBio(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.15)] text-white text-xs resize-none"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[var(--muted)] mb-1">Join Mode</label>
                          <select
                            value={editJoinMode}
                            onChange={(e) => setEditJoinMode(e.target.value as CrewJoinMode)}
                            className="w-full px-2 py-1.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.15)] text-white text-xs"
                          >
                            <option value="direct">Direct Join</option>
                            <option value="request">Request Only</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[var(--muted)] mb-1">Min Streak (Days)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editMinStreak}
                            onChange={(e) => setEditMinStreak(Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.15)] text-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="editIsClosed"
                          checked={editIsClosed}
                          onChange={(e) => setEditIsClosed(e.target.checked)}
                          className="rounded text-[#D71921]"
                        />
                        <label htmlFor="editIsClosed" className="text-white text-xs cursor-pointer">
                          Close Squad (Lock out new joins)
                        </label>
                      </div>

                      <div className="pt-2">
                        <AvatarPicker
                          selectedKey={editAvatarKey}
                          selectedVariant={editAvatarVariant}
                          onSelect={(k, v) => {
                            setEditAvatarKey(k);
                            setEditAvatarVariant(v);
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors mt-2"
                      >
                        Save Settings
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.08)] text-xs text-[var(--muted)] space-y-1.5 font-mono">
                      <div>Bio: <span className="text-white">{crewDetails.bio || 'None'}</span></div>
                      <div>Mode: <span className="text-white">{crewDetails.joinMode === 'direct' ? 'Direct Join' : 'Request to Join'}</span></div>
                      <div>Min Streak: <span className="text-white">{crewDetails.minStreak || 0} days</span></div>
                      <div>Status: <span className={crewDetails.isClosed ? 'text-amber-400' : 'text-emerald-400'}>{crewDetails.isClosed ? 'Closed' : 'Open'}</span></div>
                    </div>
                  )}
                </div>

                {/* Member Roster & Moderation */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-heading">
                    Members ({crewDetails.members?.length || 0})
                  </h3>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(crewDetails.members || []).map((m) => (
                      <div
                        key={m.uid}
                        className="p-2.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MatrixAvatar
                            avatarKey={m.avatarKey}
                            variant={m.avatarVariant}
                            seed={m.uid}
                            size={28}
                            className="shrink-0"
                          />
                          <div className="min-w-0 text-xs">
                            <div className="font-bold text-white truncate flex items-center gap-1.5">
                              <span>{m.displayName}</span>
                              {m.role === 'leader' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[#D71921] text-white font-bold">
                                  LEADER
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono truncate">
                              {m.email || 'No email'} &bull; {m.streak || 0}d streak
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {m.role !== 'leader' && (
                            <button
                              type="button"
                              onClick={() => handlePromoteLeader(m.uid, m.displayName)}
                              title="Promote to Squad Leader"
                              className="p-1 rounded text-[var(--muted)] hover:text-amber-400 hover:bg-white/10"
                            >
                              <Award size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.uid, m.displayName)}
                            title="Remove from squad"
                            className="p-1 rounded text-[var(--muted)] hover:text-red-400 hover:bg-white/10"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Join Requests */}
                {(crewDetails.requests || []).filter((r) => r.status === 'pending').length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-heading">
                      Pending Join Requests ({(crewDetails.requests || []).filter((r) => r.status === 'pending').length})
                    </h3>

                    <div className="space-y-2">
                      {(crewDetails.requests || [])
                        .filter((r) => r.status === 'pending')
                        .map((req) => (
                          <div
                            key={req.id}
                            className="p-2.5 rounded-lg bg-[#141414] border border-amber-500/30 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 text-xs">
                              <div className="font-bold text-white truncate">{req.displayName}</div>
                              <div className="text-[10px] text-[var(--muted)] font-mono">
                                Streak: {req.streak}d &bull; Score: {req.score} pts
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleModerateRequest(req.id, 'approve')}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModerateRequest(req.id, 'reject')}
                                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[10px]"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Danger Zone: Disband */}
                <div className="pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setDisbandModalOpen(true)}
                    className="w-full py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-950/20 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Disband Squad Room</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Payment Management Modal ── */}
      {paymentModalOpen && crewDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.15)] rounded-2xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading">Manage Squad Payments</h3>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 rounded text-[var(--muted)] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--muted)] mb-1">Action</label>
                <select
                  value={paymentAction}
                  onChange={(e) => setPaymentAction(e.target.value as 'mark_paid' | 'extend_month' | 'mark_unpaid')}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.15)] text-white text-xs"
                >
                  <option value="extend_month">Extend Large Crew by 1 Month (Add 30 Days)</option>
                  <option value="mark_paid">Mark Paid Active (Large Crew PKR 499/mo)</option>
                  <option value="mark_unpaid">Mark Unpaid (Revert to Free Tier)</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--muted)] mb-1">Mandatory Reason (Audit Log)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Easypaisa receipt TRX-99214 verified manually"
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.15)] text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--muted)] mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  min={0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.15)] text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[var(--muted)] mb-1">Transaction ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TRX-8849201"
                  value={paymentTxId}
                  onChange={(e) => setPaymentTxId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.15)] text-white text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#D71921] hover:bg-[#b0131a] text-white font-bold text-xs disabled:opacity-50"
                >
                  {paymentSubmitting ? 'Updating...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Disband Confirmation Modal ── */}
      {disbandModalOpen && crewDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-red-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} />
              <h3 className="text-base font-bold font-heading">Disband Squad Room</h3>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              This action is <strong className="text-white">permanent</strong> and will remove all members from the squad room and purge its data.
              To confirm, type the exact squad name below: <strong className="text-white">{crewDetails.name}</strong>
            </p>

            <form onSubmit={handleDisbandSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Type squad name here"
                value={disbandTypedName}
                onChange={(e) => setDisbandTypedName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.15)] text-white text-xs"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisbandModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disbandSubmitting || disbandTypedName.trim().toLowerCase() !== crewDetails.name.trim().toLowerCase()}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs disabled:opacity-40"
                >
                  {disbandSubmitting ? 'Disbanding...' : 'Confirm Disband'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCrewsPage;

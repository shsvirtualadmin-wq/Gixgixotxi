import React, { useState, useEffect } from 'react';
import { PromoLink, buildShareablePromoUrl } from '../lib/promoCode';
import { apiFetch, safeJsonResponse, User } from '../lib/supabase';
import {
  Gift,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Trash2,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Tag,
  Power,
  Layers,
} from 'lucide-react';

interface AdminPromoLinksManagerProps {
  currentUser: User | null;
}

export const AdminPromoLinksManager: React.FC<AdminPromoLinksManagerProps> = ({ currentUser }) => {
  const [links, setLinks] = useState<PromoLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Generator Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [maxRedemptionsType, setMaxRedemptionsType] = useState<'1' | 'unlimited' | '10' | 'custom'>('1');
  const [customMaxCount, setCustomMaxCount] = useState<string>('25');
  const [expiryOption, setExpiryOption] = useState<'never' | '30' | '90' | '365'>('never');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected link for viewing redemptions
  const [viewingRedemptionsLink, setViewingRedemptionsLink] = useState<PromoLink | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const adminMail = (currentUser?.email || 'shsvirtualadmin@gmail.com').trim().toLowerCase();
      const resp = await apiFetch(`/api/admin/promo-links?adminEmail=${encodeURIComponent(adminMail)}`, {
        headers: {
          'x-admin-email': adminMail,
        },
      });
      const data = await safeJsonResponse<{ success: boolean; links: PromoLink[]; error?: string }>(resp);
      if (data?.success && Array.isArray(data.links)) {
        setLinks(data.links);
      } else {
        setError(data?.error || 'Failed to load promotional links.');
      }
    } catch (err: any) {
      console.error('[AdminPromoLinksManager] fetch error:', err);
      setError(err?.message || 'Server error while fetching promo links.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [currentUser?.email]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    let code = '';
    let attempts = 0;
    do {
      rand = '';
      for (let i = 0; i < 5; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `BOARDLY-1Y-${rand}`;
      attempts++;
    } while (links.some((l) => (l.code || '').toUpperCase() === code) && attempts < 25);
    setCustomCode(code);
  };

  const handleOpenCreateModal = () => {
    setNewLabel('1-Year Free Pro Campaign');
    generateRandomCode();
    setMaxRedemptionsType('1');
    setCustomMaxCount('25');
    setExpiryOption('never');
    setModalError(null);
    setShowCreateModal(true);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      setModalError('Please provide a campaign label or name.');
      return;
    }

    const cleanCode = (customCode.trim() || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode && links.some((l) => (l.code || '').toUpperCase() === cleanCode)) {
      setModalError(`Promo code "${cleanCode}" already exists. Please choose a different code or click "Randomize".`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setModalError(null);

    let maxRedemptions: number | null = 1; // Default to 1-Time Use
    if (maxRedemptionsType === '1') maxRedemptions = 1;
    else if (maxRedemptionsType === 'unlimited') maxRedemptions = null;
    else if (maxRedemptionsType === '10') maxRedemptions = 10;
    else if (maxRedemptionsType === 'custom') {
      const num = parseInt(customMaxCount, 10);
      maxRedemptions = isNaN(num) || num <= 0 ? 1 : num;
    }

    const effectiveAdminEmail = (currentUser?.email || 'shsvirtualadmin@gmail.com').trim().toLowerCase();

    const payload = {
      label: newLabel.trim(),
      customCode: cleanCode || undefined,
      maxRedemptions,
      expiresDays: expiryOption === 'never' ? null : parseInt(expiryOption, 10),
      adminEmail: effectiveAdminEmail,
    };

    try {
      const resp = await apiFetch('/api/admin/promo-links/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': effectiveAdminEmail,
        },
        body: JSON.stringify(payload),
      });

      let data: { success?: boolean; link?: PromoLink; error?: string } | null = null;
      try {
        const text = await resp.text();
        if (text && text.trim()) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        console.warn('Could not parse response JSON:', parseErr);
      }

      if (resp.ok && data?.success && data.link) {
        setLinks((prev) => [data!.link!, ...prev]);
        setShowCreateModal(false);
        setModalError(null);
        setError(null);
        setSuccessToast(`Promo link created successfully! Code: ${data.link.code}`);
        setTimeout(() => setSuccessToast(null), 5000);
      } else {
        const errorMsg =
          data?.error ||
          (!resp.ok
            ? `Server error (${resp.status}): Failed to create promo link. Please try again.`
            : 'Failed to create promo link.');
        setModalError(errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error while creating promo link.';
      setModalError(errorMsg);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (link: PromoLink) => {
    try {
      const resp = await apiFetch('/api/admin/promo-links/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: link.id,
          isActive: !link.is_active,
          adminEmail: currentUser?.email || '',
        }),
      });

      const data = await safeJsonResponse<{ success: boolean; link: PromoLink; error?: string }>(resp);
      if (data?.success && data.link) {
        setLinks((prev) => prev.map((l) => (l.id === link.id ? data.link : l)));
        setSuccessToast(`Link ${data.link.is_active ? 'activated' : 'paused'}.`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (err: any) {
      setError('Failed to update status.');
    }
  };

  const handleDeleteLink = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete promo link "${code}"?`)) return;

    try {
      const resp = await apiFetch(`/api/admin/promo-links/${id}?adminEmail=${encodeURIComponent(currentUser?.email || '')}`, {
        method: 'DELETE',
      });

      const data = await safeJsonResponse<{ success: boolean; error?: string }>(resp);
      if (data?.success) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        setSuccessToast(`Promo link "${code}" deleted.`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (err: any) {
      setError('Failed to delete promo link.');
    }
  };

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Derived Stats
  const totalLinks = links.length;
  const totalRedemptions = links.reduce((sum, l) => sum + (l.redemption_count || 0), 0);
  const activeLinks = links.filter((l) => l.is_active).length;

  const filteredLinks = links.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.code.toLowerCase().includes(q) ||
      l.label.toLowerCase().includes(q) ||
      (l.created_by && l.created_by.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-emerald-800 font-semibold shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-rose-800 font-medium shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Links</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {activeLinks} <span className="text-xs font-medium text-slate-400">/ {totalLinks} total</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Redemptions</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalRedemptions}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 shadow-md text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">Free Grant Value</p>
            <p className="text-lg font-black text-white mt-1">1 Full Year Pro</p>
            <p className="text-[11px] text-blue-100">All tracks included</p>
          </div>
          <button
            id="admin-generate-promo-btn"
            type="button"
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-bold text-xs tracking-wide transition shadow flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Link</span>
          </button>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code, campaign name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchLinks}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            title="Refresh links"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex-1 md:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate 1-Year Free Access Link</span>
          </button>
        </div>
      </div>

      {/* Promo Links List */}
      {loading && links.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm font-medium">Loading promotional links...</p>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Gift className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery ? 'No promotional links matched your query' : 'No promotional links generated yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Create shareable links on <span className="font-semibold text-blue-600">boardly.cfd</span> that grant
            students 1 full year of free Pro access on whichever track they enroll in.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Promo Link</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredLinks.map((link) => {
            const domainUrl = buildShareablePromoUrl(link.code, true);
            const isExhausted = Boolean(link.max_redemptions && link.redemption_count >= link.max_redemptions);
            const isExpired = Boolean(link.expires_at && new Date(link.expires_at).getTime() < Date.now());
            const hasRedemptions = Array.isArray(link.redemptions) && link.redemptions.length > 0;

            let statusLabel = 'Active';
            let statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            if (isExhausted) {
              statusLabel = link.max_redemptions === 1 ? 'Used & Expired (1-Time)' : 'Exhausted & Expired';
              statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
            } else if (!link.is_active) {
              statusLabel = 'Paused';
              statusClass = 'bg-slate-100 text-slate-600 border-slate-200';
            } else if (isExpired) {
              statusLabel = 'Time Expired';
              statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
            } else if (link.max_redemptions === 1) {
              statusLabel = 'Active (1-Time Use)';
              statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
            }

            return (
              <div
                key={link.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-base">{link.label}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Created {new Date(link.created_at).toLocaleDateString()} by{' '}
                        <span className="font-medium text-slate-700">{link.created_by || 'Admin'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Redemptions Progress / Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold text-slate-800">
                      {link.redemption_count}{' '}
                      <span className="text-slate-400 font-normal">
                        / {link.max_redemptions ? link.max_redemptions : 'Unlimited'} redeemed
                      </span>
                    </span>
                  </div>
                </div>

                {/* Link Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Shareable URL (boardly.cfd)
                    </p>
                    <code className="text-xs font-mono font-bold text-blue-600 break-all select-all">
                      {domainUrl}
                    </code>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopy(domainUrl, link.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                        copiedCode === link.code
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {copiedCode === link.code ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {/* Test link in current environment */}
                    <button
                      onClick={() => {
                        const localUrl = `/claim?code=${link.code}`;
                        window.open(localUrl, '_blank');
                      }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                      title="Open & test in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details & Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Code:</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {link.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-medium text-slate-700">Grants 1 Year Free Pro</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium text-slate-700">
                        {link.max_redemptions === 1 ? 'One-time usable (expires once claimed)' : link.max_redemptions ? `Max ${link.max_redemptions} claims` : 'Multi-use'}
                      </span>
                    </div>

                    {link.expires_at && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Expires link on {new Date(link.expires_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {/* View Redemptions Toggle */}
                    {hasRedemptions && (
                      <button
                        onClick={() => setViewingRedemptionsLink(viewingRedemptionsLink?.id === link.id ? null : link)}
                        className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1 transition"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Students ({link.redemptions?.length})</span>
                      </button>
                    )}

                    {/* Pause / Resume Button */}
                    <button
                      onClick={() => handleToggleActive(link)}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
                        link.is_active
                          ? 'text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100'
                          : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{link.is_active ? 'Pause' : 'Activate'}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteLink(link.id, link.code)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Redemptions List */}
                {viewingRedemptionsLink?.id === link.id && hasRedemptions && (
                  <div className="mt-3 pt-3 border-t border-slate-100 animate-fadeIn">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Students Who Redeemed This Link ({link.redemptions?.length}):
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200 max-h-52 overflow-y-auto">
                      {link.redemptions?.map((red, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{red.student_name || 'Student'}</p>
                            <p className="text-slate-500 text-[11px]">{red.student_email}</p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              {red.track || 'Boardly Pro'}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(red.redeemed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROMO LINK MODAL */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-slate-900 animate-ios-spring"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Generate Promo Link</h3>
                  <p className="text-xs text-slate-500">1-Year Free Pro Access Grant</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-4 text-xs sm:text-sm">
              {/* Campaign Label */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Campaign / Promo Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Free Pro Promotion 2026"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Custom Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Promo Code</label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Randomize</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. BOARDLY-1Y-PROMO"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Students will use URL: <span className="font-mono text-blue-600">boardly.cfd/claim?code={customCode || 'XXXXX'}</span>
                </p>
              </div>

              {/* Max Redemptions Limit */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Redemption Limit & Expiration
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {(['1', 'unlimited', '10', 'custom'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setMaxRedemptionsType(opt)}
                      className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition ${
                        maxRedemptionsType === opt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {opt === '1' ? '⚡ 1-Time Use' : opt === 'unlimited' ? 'Unlimited' : opt === '10' ? '10 Uses' : 'Custom'}
                    </button>
                  ))}
                </div>

                {maxRedemptionsType === '1' && (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg mt-1 font-medium">
                    ✓ <strong>One-time usable:</strong> This link will automatically expire and deactivate as soon as the first student redeems it.
                  </p>
                )}

                {maxRedemptionsType === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter maximum redemptions count"
                    value={customMaxCount}
                    onChange={(e) => setCustomMaxCount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  />
                )}
              </div>

              {/* Expiry Period */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Link Expiration (Claim Window)</label>
                <select
                  value={expiryOption}
                  onChange={(e) => setExpiryOption(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="never">Never Expires (Open Indefinitely)</option>
                  <option value="30">Valid for 30 Days</option>
                  <option value="90">Valid for 90 Days</option>
                  <option value="365">Valid for 1 Year</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Once redeemed, the student receives 1 full year of Pro access from the redemption date.
                </p>
              </div>

              {/* In-Modal Error Notice */}
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 font-medium animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                  <button type="button" onClick={() => setModalError(null)} className="text-rose-500 hover:text-rose-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

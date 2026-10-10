import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Edit2,
  Calendar,
  MessageSquare,
  Activity,
  RefreshCw,
  X,
  ChevronDown,
  UserCheck,
  Check,
} from 'lucide-react';

export type PlanTier = 'free' | 'pro' | 'premium';
export type PlanDuration = 'monthly' | '3_months' | '8_months' | '12_months';

interface StudentQuotaUser {
  id: string;
  name: string;
  email: string;
  tier: string;
  tierKey: PlanTier;
  duration: PlanDuration | string;
  dailyDrills: {
    used: number;
    limit: number | string;
    percent: number;
    nearLimit: boolean;
  };
  boardyChats: {
    used: number;
    limit: number | string;
    percent: number;
    nearLimit: boolean;
  };
  status: string;
  lastActive?: string;
}

interface AdminSubscriptionsTabProps {
  currentUserEmail?: string;
  onRefreshData?: () => void;
}

export const AdminSubscriptionsTab: React.FC<AdminSubscriptionsTabProps> = ({
  currentUserEmail = 'shsvirtualadmin@gmail.com',
  onRefreshData,
}) => {
  const [users, setUsers] = useState<StudentQuotaUser[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro' | 'premium'>('all');
  const [quotaAlertOnly, setQuotaAlertOnly] = useState(false);

  // Edit Subscription Modal State
  const [editingStudent, setEditingStudent] = useState<StudentQuotaUser | null>(null);
  const [selectedTier, setSelectedTier] = useState<PlanTier>('pro');
  const [selectedDuration, setSelectedDuration] = useState<PlanDuration>('monthly');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchQuotas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/usage-quotas?adminEmail=${encodeURIComponent(currentUserEmail)}`, {
        headers: {
          'x-admin-email': currentUserEmail,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('[Admin Quotas Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, [currentUserEmail]);

  const handleOpenEdit = (user: StudentQuotaUser) => {
    setEditingStudent(user);
    setSelectedTier(user.tierKey || 'free');
    const dur = (user.duration || 'monthly').toLowerCase().replace(' ', '_');
    if (dur.includes('12') || dur.includes('year')) setSelectedDuration('12_months');
    else if (dur.includes('8')) setSelectedDuration('8_months');
    else if (dur.includes('3')) setSelectedDuration('3_months');
    else setSelectedDuration('monthly');
    setEditNotes('');
  };

  const handleSaveTier = async () => {
    if (!editingStudent) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/subscription/update-tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUserEmail,
        },
        body: JSON.stringify({
          studentId: editingStudent.id,
          studentEmail: editingStudent.email,
          tier: selectedTier,
          duration: selectedDuration,
          notes: editNotes,
          adminEmail: currentUserEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage({ type: 'success', text: data.message || 'Subscription successfully updated!' });
        setEditingStudent(null);
        fetchQuotas();
        if (onRefreshData) onRefreshData();
      } else {
        setToastMessage({ type: 'error', text: data.error || 'Failed to update subscription tier.' });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.message || 'Network error updating subscription.' });
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.tier.toLowerCase().includes(q);

    const matchTier = tierFilter === 'all' || u.tierKey === tierFilter;
    const matchAlert = !quotaAlertOnly || (u.dailyDrills.nearLimit || u.boardyChats.nearLimit);

    return matchSearch && matchTier && matchAlert;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-lg animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Module 2 Header Cards: Usage Quota & Limits Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Free Tier Quotas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Standard
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{summary?.freeCount ?? users.filter(u => u.tierKey === 'free').length}</span>
            <span className="text-xs text-slate-400 font-semibold">students</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Daily Practice Drills:</span>
              <strong className="text-slate-900 font-bold">2 tests / day</strong>
            </div>
            <div className="flex justify-between">
              <span>Boardy AI Chats:</span>
              <strong className="text-slate-900 font-bold">3 questions / day</strong>
            </div>
          </div>
        </div>

        {/* Metric 2: Pro Tier Quotas */}
        <div className="bg-white rounded-2xl border border-violet-200/80 p-5 shadow-sm space-y-3 relative overflow-hidden bg-gradient-to-br from-white via-white to-violet-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Pro (Most Popular)</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              Popular
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-violet-900">{summary?.proCount ?? users.filter(u => u.tierKey === 'pro').length}</span>
            <span className="text-xs text-violet-600 font-semibold">subscribers</span>
          </div>
          <div className="pt-2 border-t border-violet-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Daily Practice Drills:</span>
              <strong className="text-violet-700 font-bold">25 tests / day</strong>
            </div>
            <div className="flex justify-between">
              <span>Boardy AI Chats:</span>
              <strong className="text-violet-700 font-bold">1,500 chats / month</strong>
            </div>
          </div>
        </div>

        {/* Metric 3: Premium Tier Quotas */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 p-5 shadow-sm space-y-3 relative overflow-hidden bg-gradient-to-br from-white via-white to-indigo-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Premium (Top Rank)</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Top Rank
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-900">{summary?.premiumCount ?? users.filter(u => u.tierKey === 'premium').length}</span>
            <span className="text-xs text-indigo-600 font-semibold">subscribers</span>
          </div>
          <div className="pt-2 border-t border-indigo-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Daily Practice Drills:</span>
              <strong className="text-indigo-700 font-bold">Unlimited</strong>
            </div>
            <div className="flex justify-between">
              <span>Boardy AI Chats:</span>
              <strong className="text-indigo-700 font-bold">Unlimited</strong>
            </div>
          </div>
        </div>

        {/* Metric 4: Quota Monitoring Alerts */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Near Limit Alerts</span>
            <div className="p-1 rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900">
              {(summary?.nearLimitDrillsCount || 0) + (summary?.nearLimitChatsCount || 0)}
            </span>
            <span className="text-xs text-amber-700 font-semibold">alerts</span>
          </div>
          <div className="pt-2 border-t border-amber-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Drills &gt;80% Limit:</span>
              <strong className="text-amber-800 font-bold">{summary?.nearLimitDrillsCount || 0} students</strong>
            </div>
            <div className="flex justify-between">
              <span>Chats &gt;80% Limit:</span>
              <strong className="text-amber-800 font-bold">{summary?.nearLimitChatsCount || 0} students</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Module 1: Subscription & User Management Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name, email..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            <button
              onClick={fetchQuotas}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh Quota Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-600' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {/* Filter by Tier */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold text-slate-600">
              <button
                onClick={() => setTierFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  tierFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setTierFilter('free')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  tierFilter === 'free' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setTierFilter('pro')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  tierFilter === 'pro' ? 'bg-white text-violet-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Pro
              </button>
              <button
                onClick={() => setTierFilter('premium')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  tierFilter === 'premium' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Premium
              </button>
            </div>

            {/* Filter alerts button */}
            <button
              onClick={() => setQuotaAlertOnly(!quotaAlertOnly)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                quotaAlertOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Near Quota Only</span>
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Active Plan Tier</th>
                <th className="py-3.5 px-4">Plan Duration</th>
                <th className="py-3.5 px-4">Daily Drills (Today)</th>
                <th className="py-3.5 px-4">Boardy Chats (Monthly)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No student records matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPro = u.tierKey === 'pro';
                  const isPremium = u.tierKey === 'premium';
                  const isFree = u.tierKey === 'free';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>

                      {/* Active Plan Tier */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${
                            isPremium
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                              : isPro
                              ? 'bg-violet-50 border border-violet-200 text-violet-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isPremium && <Sparkles className="w-3 h-3 text-indigo-600" />}
                          {isPro && <Zap className="w-3 h-3 text-violet-600" />}
                          <span>{u.tier}</span>
                        </span>
                      </td>

                      {/* Plan Duration */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="capitalize">{String(u.duration).replace('_', ' ')}</span>
                        </div>
                      </td>

                      {/* Daily Drills Limit & Usage Gauge */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 max-w-[140px]">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-slate-800">
                              {u.dailyDrills.used} / {u.dailyDrills.limit}
                            </span>
                            {u.dailyDrills.nearLimit && (
                              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Near Limit
                              </span>
                            )}
                          </div>
                          {typeof u.dailyDrills.limit === 'number' && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  u.dailyDrills.percent >= 90
                                    ? 'bg-rose-500'
                                    : u.dailyDrills.percent >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-violet-600'
                                }`}
                                style={{ width: `${Math.min(100, u.dailyDrills.percent)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Boardy AI Chats Quota */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 max-w-[140px]">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-slate-800">
                              {u.boardyChats.used} / {u.boardyChats.limit}
                            </span>
                            {u.boardyChats.nearLimit && (
                              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> 80%+
                              </span>
                            )}
                          </div>
                          {typeof u.boardyChats.limit === 'number' && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  u.boardyChats.percent >= 90
                                    ? 'bg-rose-500'
                                    : u.boardyChats.percent >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-indigo-600'
                                }`}
                                style={{ width: `${Math.min(100, u.boardyChats.percent)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-3 py-1.5 rounded-xl border border-violet-200 text-violet-700 hover:bg-violet-50 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Tier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Subscription Tier & Duration Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                  Manage Subscription
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Update Student Tier & Duration
                </h3>
                <p className="text-xs text-slate-500">
                  {editingStudent.name} ({editingStudent.email})
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select One of the Three Exact Plans */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Select Active Subscription Tier
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Free */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('free')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedTier === 'free'
                      ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-black text-slate-900">Free</div>
                  <div className="text-[10px] text-slate-500">Standard</div>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono">2 drills/day</div>
                </button>

                {/* 2. Pro (Most Popular) */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('pro')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedTier === 'pro'
                      ? 'border-violet-600 bg-violet-50/60 ring-2 ring-violet-600/20 shadow-sm'
                      : 'border-slate-200 hover:border-violet-300'
                  }`}
                >
                  <div className="text-xs font-black text-violet-900 flex items-center justify-between">
                    <span>Pro</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                  </div>
                  <div className="text-[10px] text-violet-600 font-semibold">Most Popular</div>
                  <div className="text-[10px] text-violet-500 mt-2 font-mono">25 drills/day</div>
                </button>

                {/* 3. Premium (Top Rank) */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('premium')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedTier === 'premium'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 shadow-sm'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-xs font-black text-indigo-900 flex items-center justify-between">
                    <span>Premium</span>
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold">Top Rank</div>
                  <div className="text-[10px] text-indigo-500 mt-2 font-mono">Unlimited</div>
                </button>
              </div>
            </div>

            {/* Step 2: Select Duration (Monthly, 3 Months, 8 Months, 12 Months) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Subscription Plan Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'monthly', label: 'Monthly' },
                  { key: '3_months', label: '3 Months' },
                  { key: '8_months', label: '8 Months' },
                  { key: '12_months', label: '12 Months' },
                ].map((dur) => (
                  <button
                    key={dur.key}
                    type="button"
                    onClick={() => setSelectedDuration(dur.key as PlanDuration)}
                    className={`py-2 px-2.5 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                      selectedDuration === dur.key
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Admin Note / Justification (Optional)
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="e.g. Approved institutional discount or manual upgrade"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTier}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{saving ? 'Updating...' : 'Save Plan Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

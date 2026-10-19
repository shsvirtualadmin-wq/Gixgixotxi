import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Award,
  Sparkles,
  RefreshCw,
  FileCheck2,
  Copy,
  Check,
  ChevronRight,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import {
  getAllCaptainsAdminData,
  type CaptainAdminSummary,
} from '@/services/referralService';
import { NAKAMA_CAPTAINS_NAME } from '@/constants/branding';
import {
  getCaptainAllotmentStatus,
  grantCaptainMonthlyAllotment,
  grantAllCaptainsMonthlyAllotment,
  getCurrentPktMonth,
} from '@/services/kobanService';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { useAuth } from '@/contexts/AuthContext';

export function AdminCaptainsPage() {
  const { user } = useAuth();
  const superadminEmail = user?.email || 'shsvirtualadmin@gmail.com';

  const [captains, setCaptains] = useState<CaptainAdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCaptain, setSelectedCaptain] = useState<CaptainAdminSummary | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Allotment status state map
  const [allotmentStatuses, setAllotmentStatuses] = useState<
    Record<string, { granted: boolean; date: Date | null; monthLabel: string }>
  >({});
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [grantAllModalOpen, setGrantAllModalOpen] = useState(false);
  const [grantingAll, setGrantingAll] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const { label: currentMonthLabel } = getCurrentPktMonth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCaptainsAdminData();
      setCaptains(data);

      // Load allotment status for all captains
      const statusMap: Record<string, { granted: boolean; date: Date | null; monthLabel: string }> = {};
      await Promise.all(
        data.map(async (c) => {
          const st = await getCaptainAllotmentStatus(c.captainUid);
          statusMap[c.captainUid] = st;
        })
      );
      setAllotmentStatuses(statusMap);
    } catch (err) {
      console.warn('Failed to load captains:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGrantSingle = async (c: CaptainAdminSummary) => {
    setGrantingId(c.captainUid);
    try {
      await grantCaptainMonthlyAllotment(
        superadminEmail,
        c.captainUid,
        c.captainName,
        c.captainEmail
      );
      const updated = await getCaptainAllotmentStatus(c.captainUid);
      setAllotmentStatuses((prev) => ({ ...prev, [c.captainUid]: updated }));
      setBannerNotice(`Granted 5,000 Kobans to ${c.captainName} for ${currentMonthLabel}.`);
      setTimeout(() => setBannerNotice(null), 3500);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to grant allotment');
    } finally {
      setGrantingId(null);
    }
  };

  const handleGrantAll = async () => {
    setGrantingAll(true);
    try {
      const candidates = captains.map((c) => ({
        captainUid: c.captainUid,
        captainName: c.captainName,
        captainEmail: c.captainEmail,
      }));
      const res = await grantAllCaptainsMonthlyAllotment(superadminEmail, candidates);
      setGrantAllModalOpen(false);
      setBannerNotice(
        `Monthly allotment credited to ${res.grantedCount} Captains (${res.skippedCount} already granted/skipped).`
      );
      setTimeout(() => setBannerNotice(null), 4000);
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to grant all allotments');
    } finally {
      setGrantingAll(false);
    }
  };

  const filteredCaptains = captains.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.captainName.toLowerCase().includes(q) ||
      c.captainEmail.toLowerCase().includes(q) ||
      c.captainShortId.toLowerCase().includes(q) ||
      (c.targetUniversity && c.targetUniversity.toLowerCase().includes(q))
    );
  });

  const totalCaptains = captains.length;
  const totalStudentsBrought = captains.reduce((acc, c) => acc + c.totalReferrals, 0);
  const totalBonusWeeks = captains.reduce((acc, c) => acc + c.bonusWeeksEarned, 0);
  const pendingCaptainsCount = captains.filter((c) => !allotmentStatuses[c.captainUid]?.granted).length;

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-[var(--text)] tracking-tight">
              {NAKAMA_CAPTAINS_NAME} &amp; Referrals
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-mono">
              {totalCaptains} {totalCaptains === 1 ? 'Captain' : 'Captains'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Track student ambassadors, referral counts, bonus Pro weeks earned, and monthly leadership Koban allotments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {totalCaptains > 0 && (
            <button
              type="button"
              onClick={() => setGrantAllModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#E8A317]/15 border border-[#E8A317]/40 text-[#FFD66B] hover:bg-[#E8A317]/25 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <KobanIcon size={14} />
              <span>Grant All Captains ({pendingCaptainsCount} pending)</span>
            </button>
          )}

          <Link
            to="/admin/applications"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center gap-1.5 transition-colors"
          >
            <FileCheck2 size={14} />
            <span>Applications</span>
          </Link>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {bannerNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-xs font-heading flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Approved {NAKAMA_CAPTAINS_NAME}</span>
            <Award size={16} className="text-[#D71921]" />
          </div>
          <p className="text-2xl font-bold font-heading text-[var(--text)]">{totalCaptains}</p>
          <p className="text-[11px] text-[var(--muted)]">Active student leaders across Pakistan</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Total Students Referred</span>
            <Users size={16} className="text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-heading text-[var(--text)]">{totalStudentsBrought}</p>
          <p className="text-[11px] text-[var(--muted)]">Each verified candidate counted once</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Total Bonus Pro Access</span>
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-heading text-[var(--text)]">{totalBonusWeeks} wks</p>
          <p className="text-[11px] text-[var(--muted)]">+1 week Pro granted per referred student</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder={`Search ${NAKAMA_CAPTAINS_NAME} by name, email, code or campus...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)]"
          />
        </div>
      </div>

      {/* Captains Table / List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>
      ) : filteredCaptains.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3">
          <Award size={32} className="mx-auto text-[var(--muted)]" />
          <h3 className="font-heading font-bold text-base text-[var(--text)]">No Captains Found</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {search
              ? `No captains match "${search}". Try adjusting your query.`
              : `No approved ${NAKAMA_CAPTAINS_NAME} yet. Review pending nominations under Applications.`}
          </p>
          {!search && (
            <Link to="/admin/applications" className="btn-red text-xs px-4 py-2 rounded-xl font-bold inline-block mt-2">
              Review Nominations
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--muted)] font-heading">
                <tr>
                  <th className="px-4 py-3 font-semibold">Captain</th>
                  <th className="px-4 py-3 font-semibold">Monthly Kobans Allotment</th>
                  <th className="px-4 py-3 font-semibold">Referral Code &amp; ID</th>
                  <th className="px-4 py-3 font-semibold">Campus / Track</th>
                  <th className="px-4 py-3 font-semibold text-center">Referrals</th>
                  <th className="px-4 py-3 font-semibold text-right">Students Brought</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredCaptains.map((c) => {
                  const st = allotmentStatuses[c.captainUid];
                  const isGranted = Boolean(st?.granted);

                  return (
                    <tr key={c.captainUid} className="hover:bg-[var(--surface-hover)] transition-colors">
                      {/* Name & Email */}
                      <td className="px-4 py-3.5">
                        <div className="font-heading font-bold text-sm text-[var(--text)]">
                          {c.captainName}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] font-mono">{c.captainEmail}</div>
                      </td>

                      {/* Monthly Kobans Allotment */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-[var(--text)]">
                            <KobanIcon size={14} />
                            <span>Monthly allotment: 5,000 Kobans</span>
                          </div>
                          <div className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-2 flex-wrap">
                            <span>
                              Status ({currentMonthLabel}):{' '}
                              {isGranted ? (
                                <span className="text-emerald-400 font-bold">
                                  Granted on{' '}
                                  {st?.date?.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    timeZone: 'Asia/Karachi',
                                  })}
                                </span>
                              ) : (
                                <span className="text-amber-400 font-bold">Pending</span>
                              )}
                            </span>

                            {!isGranted && (
                              <button
                                type="button"
                                disabled={grantingId === c.captainUid}
                                onClick={() => handleGrantSingle(c)}
                                className="btn-red text-[11px] px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                              >
                                {grantingId === c.captainUid ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <Sparkles size={11} />
                                )}
                                <span>Grant 5,000 Kobans</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Code & ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--text)]">
                          <span>#{c.captainShortId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.captainUid, c.captainShortId)}
                            className="text-[var(--muted)] hover:text-white transition-colors"
                            title="Copy Short ID"
                          >
                            {copiedId === c.captainUid ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="text-[10px] text-[var(--muted)] font-mono">{c.captainCode}</div>
                      </td>

                      {/* Campus */}
                      <td className="px-4 py-3.5 text-[var(--muted)]">
                        {c.targetUniversity || 'General Campus'}
                      </td>

                      {/* Total Referrals */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-heading font-bold text-sm text-[var(--text)]">
                          {c.totalReferrals}
                        </span>
                        <div className="text-[10px] text-amber-400 font-mono">+{c.bonusWeeksEarned} wks</div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCaptain(c)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Users size={12} />
                          <span>Roster ({c.referredStudents.length})</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grant All Modal */}
      {grantAllModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border)]">
              <div className="w-10 h-10 rounded-2xl bg-[#E8A317]/10 border border-[#E8A317]/30 flex items-center justify-center text-[#FFD66B]">
                <KobanIcon size={24} />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-[var(--text)]">
                  Grant to All Approved Captains
                </h3>
                <p className="text-xs text-[var(--muted)] font-mono">{currentMonthLabel} Allotment</p>
              </div>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              This will grant <strong className="text-[#FFD66B] font-mono">5,000 Kobans</strong> to each approved Nakama Captain who has not yet received their monthly allowance for {currentMonthLabel}.
            </p>

            <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] max-h-48 overflow-y-auto divide-y divide-[var(--border)]">
              <span className="text-[10px] uppercase font-mono text-[var(--muted)] block pb-1">
                Captains to Credit ({pendingCaptainsCount}):
              </span>
              {pendingCaptainsCount === 0 ? (
                <p className="text-xs text-emerald-400 py-2">
                  All approved captains have already received their {currentMonthLabel} allotment!
                </p>
              ) : (
                captains
                  .filter((c) => !allotmentStatuses[c.captainUid]?.granted)
                  .map((c) => (
                    <div key={c.captainUid} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-heading font-semibold text-[var(--text)]">{c.captainName}</span>
                      <span className="font-mono text-[#FFD66B] font-bold">+5,000</span>
                    </div>
                  ))
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGrantAllModalOpen(false)}
                className="btn-outline flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={grantingAll || pendingCaptainsCount === 0}
                onClick={handleGrantAll}
                className="btn-red flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {grantingAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Confirm &amp; Credit All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Drawer / Modal */}
      {selectedCaptain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="font-heading font-bold text-base text-[var(--text)]">
                  {selectedCaptain.captainName}'s Student Roster
                </h3>
                <p className="text-xs text-[var(--muted)] font-mono">
                  Referral code: {selectedCaptain.captainCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaptain(null)}
                className="text-[var(--muted)] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
              {selectedCaptain.referredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--muted)]">
                  No students have used this captain's referral code yet.
                </div>
              ) : (
                selectedCaptain.referredStudents.map((st, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-heading font-semibold text-[var(--text)]">
                        {st.studentName || 'Student'}
                      </div>
                      <div className="text-[10px] text-[var(--muted)] font-mono">{st.studentEmail}</div>
                    </div>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {st.dateJoined ? new Date(st.dateJoined).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedCaptain(null)}
              className="btn-outline w-full py-2.5 rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCaptainsPage;

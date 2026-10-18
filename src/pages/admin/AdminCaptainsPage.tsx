import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Award,
  Sparkles,
  RefreshCw,
  Calendar,
  X,
  FileCheck2,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  getAllCaptainsAdminData,
  type CaptainAdminSummary,
} from '@/services/referralService';
import { NAKAMA_CAPTAINS_NAME } from '@/constants/branding';

export function AdminCaptainsPage() {
  const [captains, setCaptains] = useState<CaptainAdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCaptain, setSelectedCaptain] = useState<CaptainAdminSummary | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCaptainsAdminData();
      setCaptains(data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            Track student ambassadors, referral counts, bonus Pro weeks earned, and complete rosters of students brought.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

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
                  <th className="px-4 py-3 font-semibold">Referral Code &amp; ID</th>
                  <th className="px-4 py-3 font-semibold">Campus / Track</th>
                  <th className="px-4 py-3 font-semibold text-center">Referrals</th>
                  <th className="px-4 py-3 font-semibold text-center">Bonus Time</th>
                  <th className="px-4 py-3 font-semibold text-right">Students Brought</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredCaptains.map((c) => {
                  return (
                    <tr key={c.captainUid} className="hover:bg-[var(--surface-hover)] transition-colors">
                      {/* Name & Email */}
                      <td className="px-4 py-3.5">
                        <div className="font-heading font-bold text-sm text-[var(--text)]">
                          {c.captainName}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] font-mono">{c.captainEmail}</div>
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
                      </td>

                      {/* Bonus Pro Weeks */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-heading font-bold text-xs text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-500/30">
                          +{c.bonusWeeksEarned} wks
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCaptain(c)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Users size={12} />
                          <span>View Roster ({c.referredStudents.length})</span>
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

      {/* Modal: Referred Students Roster */}
      {selectedCaptain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedCaptain(null)}
          />

          <div
            className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl z-10 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[var(--text)] flex items-center gap-2">
                  <span>{selectedCaptain.captainName}'s Student Roster</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-mono">
                    #{selectedCaptain.captainShortId}
                  </span>
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Total referred students: {selectedCaptain.referredStudents.length} &bull; Total Pro bonus earned: +{selectedCaptain.bonusWeeksEarned} weeks
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCaptain(null)}
                className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {selectedCaptain.referredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--muted)]">
                  No registered student referrals recorded yet for this captain.
                </div>
              ) : (
                selectedCaptain.referredStudents.map((st) => (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-[var(--text)] truncate">
                          {st.studentName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]">
                          #{st.studentShortId}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)] flex items-center gap-2 mt-0.5">
                        <span>{st.track}</span>
                        {st.studentEmail && (
                          <>
                            <span>&bull;</span>
                            <span className="font-mono">{st.studentEmail}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-[11px] text-[var(--muted)] shrink-0 flex items-center sm:flex-col sm:items-end gap-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={11} /> {st.dateJoined}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        +1 wk Pro Granted
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[var(--border)] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCaptain(null)}
                className="btn-outline text-xs px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCaptainsPage;

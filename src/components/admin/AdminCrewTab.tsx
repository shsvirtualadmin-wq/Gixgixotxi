import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Check,
  X,
  Building,
  Mail,
  Phone,
  Shield,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  DollarSign,
  PlusCircle,
  RotateCcw,
  History,
} from 'lucide-react';
import {
  CrewApplication,
  fetchCrewApplications,
  approveCrewApplication,
  rejectCrewApplication,
  revokeCrewMemberStatus,
  reapproveCrewMember,
  StudentUserProfile,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  deleteField,
  doc,
  db,
  collection,
  getDocs,
  query,
  where,
  limit,
} from '../../lib/firebase';
import { CREW_TENURE_SIGNUP_TARGET, CREW_INTERNSHIP_SIGNUP_TARGET } from '../../lib/crewLogic';
import { UniversityLogoBadge } from '../UniversityLogoBadge';

interface AdminCrewTabProps {
  adminEmail: string;
}

export const AdminCrewTab: React.FC<AdminCrewTabProps> = ({ adminEmail }) => {
  const [subTab, setSubTab] = useState<'applications' | 'active' | 'revoked'>('applications');
  const [applications, setApplications] = useState<CrewApplication[]>([]);
  const [activeMembers, setActiveMembers] = useState<StudentUserProfile[]>([]);
  const [revokedMembers, setRevokedMembers] = useState<StudentUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Action states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<CrewApplication | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Revoke confirmation modal
  const [revokeConfirmUser, setRevokeConfirmUser] = useState<StudentUserProfile | null>(null);
  const [revokeReasonInput, setRevokeReasonInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch applications
      const apps = await fetchCrewApplications();
      setApplications(apps);

      // 2. Fetch active crew members from users collection
      const usersColl = collection(db, 'users');
      const q = query(usersColl, where('isCrewMember', '==', true), limit(50));
      const snap = await getDocs(q);
      const members = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
      setActiveMembers(members);

      // 3. Fetch revoked crew members from users collection
      const qRevoked = query(usersColl, where('crewStatus', '==', 'revoked'), limit(50));
      const snapRevoked = await getDocs(qRevoked);
      const revoked = snapRevoked.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
      setRevokedMembers(revoked);
    } catch (err) {
      console.error('Failed to load crew data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApprove = async (app: CrewApplication) => {
    setActionInProgress(app.id || 'approving');
    try {
      const res = await approveCrewApplication(app, adminEmail);
      // Requirement 4: Show a clear message to the admin:
      // "Approved and upgraded" or "Approved; Premium will apply when the student signs up"
      const message = res?.message || 'Approved and upgraded';
      setToastMessage(message);
      await loadData();
    } catch (err: any) {
      console.error('Approve error:', err);
      setToastMessage(`Error approving: ${err.message || 'Check connection'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenReject = (app: CrewApplication) => {
    setSelectedApp(app);
    setRejectReasonInput('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedApp || !selectedApp.id) return;
    setActionInProgress(selectedApp.id);
    try {
      await rejectCrewApplication(selectedApp.id, selectedApp.userId, adminEmail, rejectReasonInput.trim());
      setToastMessage(`Rejected application for ${selectedApp.fullName}.`);
      setShowRejectModal(false);
      setSelectedApp(null);
      await loadData();
    } catch (err: any) {
      console.error('Reject error:', err);
      setToastMessage(`Error rejecting: ${err.message || 'Check connection'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeConfirmUser || !revokeConfirmUser.uid) return;
    setActionInProgress(revokeConfirmUser.uid);
    try {
      const reason = revokeReasonInput.trim() || 'Access revoked by administrator';
      await revokeCrewMemberStatus(revokeConfirmUser.uid, adminEmail, reason);
      setToastMessage(`Revoked Crew status for ${revokeConfirmUser.name || 'user'}. Returned to previous plan.`);
      setRevokeConfirmUser(null);
      setRevokeReasonInput('');
      await loadData();
    } catch (err: any) {
      console.error('Revoke error:', err);
      setToastMessage(`Error revoking status: ${err.message || 'Check connection'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReapprove = async (userDoc: StudentUserProfile) => {
    if (!userDoc.uid) return;
    setActionInProgress(userDoc.uid);
    try {
      await reapproveCrewMember(userDoc.uid, adminEmail);
      setToastMessage(`Re-approved Crew Ambassador ${userDoc.name || 'user'}. Restored 30 days of Premium.`);
      await loadData();
    } catch (err: any) {
      console.error('Re-approve error:', err);
      setToastMessage(`Error re-approving: ${err.message || 'Check connection'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePurgeAdminRecords = async () => {
    setActionInProgress('purge-admin');
    try {
      const targetAdminEmail = 'shsvirtualadmin@gmail.com';
      // 1. Delete captain doc
      const qCap = query(collection(db, 'captains'), where('email', '==', targetAdminEmail));
      const capSnap = await getDocs(qCap);
      for (const d of capSnap.docs) {
        await deleteDoc(d.ref);
      }

      // 2. Delete captainApplications & crewApplications
      const qCapApps = query(collection(db, 'captainApplications'), where('email', '==', targetAdminEmail));
      const capAppsSnap = await getDocs(qCapApps);
      for (const d of capAppsSnap.docs) {
        await deleteDoc(d.ref);
      }

      const qCrewApps = query(collection(db, 'crewApplications'), where('email', '==', targetAdminEmail));
      const crewAppsSnap = await getDocs(qCrewApps);
      for (const d of crewAppsSnap.docs) {
        await deleteDoc(d.ref);
      }

      // 3. Reset user document
      const qUser = query(collection(db, 'users'), where('email', '==', targetAdminEmail));
      const userSnap = await getDocs(qUser);
      for (const u of userSnap.docs) {
        await updateDoc(u.ref, {
          role: 'admin',
          roles: ['admin'],
          plan: 'premium',
          isPremium: true,
          isCrewMember: false,
          crewStatus: deleteField(),
          crewReferralCode: deleteField(),
          crewStartDate: deleteField(),
          crewInstitution: deleteField(),
          crewRevokedAt: deleteField(),
          crewRevokeReason: deleteField(),
          isPaidInternshipEligible: false,
          updatedAt: new Date().toISOString(),
        });
      }

      setToastMessage('Successfully purged any admin captain/application documents and reset admin user role.');
      await loadData();
    } catch (err: any) {
      console.error('Purge admin error:', err);
      setToastMessage(`Error purging admin: ${err.message || 'Check connection'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Helper for admins to simulate +1 referral for testing
  const handleSimulateReferral = async (userDoc: StudentUserProfile) => {
    if (!userDoc.uid) return;
    setActionInProgress(userDoc.uid);
    try {
      const current = userDoc.crewReferralsCount || 0;
      const newCount = current + 1;
      const isEligible = newCount >= CREW_INTERNSHIP_SIGNUP_TARGET;
      
      const userRef = doc(db, 'users', userDoc.uid);
      await updateDoc(userRef, {
        crewReferralsCount: newCount,
        crewActiveUsersCount: Math.round(newCount * 0.8),
        isPaidInternshipEligible: isEligible,
        updatedAt: new Date().toISOString(),
      });
      setToastMessage(`Added +1 referral to ${userDoc.name}. Total: ${newCount}`);
      await loadData();
    } catch (err: any) {
      console.error('Simulate referral error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      (app.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.institution || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-black cursor-pointer text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Crew Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve student ambassadors, monitor peer traction, verify paid internship qualifications, and enforce tenure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSubTab('applications')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'applications'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Applications</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSubTab('active')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Active Ambassadors</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                {activeMembers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('revoked')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'revoked'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Revoked</span>
              {revokedMembers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-[10px]">
                  {revokedMembers.length}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePurgeAdminRecords}
            disabled={actionInProgress === 'purge-admin'}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Clean any admin captain/application documents and reset admin role"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Reset Admin Role</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. APPLICATIONS SUB-TAB                                                    */}
      {/* ========================================================================= */}
      {subTab === 'applications' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, email, or institution…"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Cards Grid (Requirement 2: Each card shows all fields, with Approve and Reject buttons) */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              <p className="text-xs font-semibold">Loading Crew applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No applications found matching status "{statusFilter}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApplications.map((app) => {
                const isPending = app.status === 'pending';
                const formattedDate = new Date(app.createdAt).toLocaleString('en-PK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={app.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between text-left"
                  >
                    <div className="space-y-3.5">
                      {/* Top Row: Name, Institution, Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <h4 className="text-base font-black text-[#0d1b3e] dark:text-white tracking-tight">
                            {app.fullName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                            <Building className="w-3.5 h-3.5 shrink-0" />
                            <span>{app.institution}</span>
                          </div>
                        </div>

                        <div>
                          {app.status === 'approved' && (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                              app.pendingPremium
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                              <span>{app.pendingPremium ? 'Approved (Pending Signup)' : 'Approved'}</span>
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                              <X className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                          {app.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <Clock className="w-3.5 h-3.5" /> Pending Review
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contact Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a href={`mailto:${app.email}`} className="hover:text-indigo-600 truncate underline">
                            {app.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a href={`https://wa.me/${app.phone.replace(/\\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-emerald-600 truncate">
                            {app.phone}
                          </a>
                        </div>
                      </div>

                      {/* Promotion Plan */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                          Promotion &amp; Ambassador Strategy
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                          {app.promotionPlan}
                        </p>
                      </div>

                      {/* Rejection Note (if any) */}
                      {app.status === 'rejected' && app.rejectionReason && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
                            Rejection Note
                          </span>
                          <p>{app.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                      <div className="text-[11px] text-slate-400">
                        <span>Applied: {formattedDate}</span>
                        {app.reviewedAt && (
                          <span className="block text-[10px] text-slate-400">
                            Reviewed {new Date(app.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {isPending ? (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            disabled={actionInProgress === app.id}
                            onClick={() => handleOpenReject(app)}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-600 dark:text-slate-300 hover:text-rose-600 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            type="button"
                            disabled={actionInProgress === app.id}
                            onClick={() => handleApprove(app)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve &amp; Grant 30d Premium</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold text-slate-400">
                          {app.status === 'approved'
                            ? (app.pendingPremium ? '✓ Approved; Premium will apply when student signs up' : '✓ Ambassador Active')
                            : 'Status: Rejected'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. ACTIVE CREW AMBASSADORS SUB-TAB (PART 4 REQUIREMENT)                    */}
      {/* ========================================================================= */}
      {subTab === 'active' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Active Crew ambassadors enjoy 30 days of free Premium access on joining. Top performers reaching <strong>{CREW_INTERNSHIP_SIGNUP_TARGET}+ signups</strong> are flagged for Paid Internships.
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Ambassador</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Referral Code</th>
                    <th className="py-3 px-4">Signups</th>
                    <th className="py-3 px-4">Tenure / Days Active</th>
                    <th className="py-3 px-4">Internship Tier</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading active ambassadors…
                      </td>
                    </tr>
                  ) : activeMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No active Crew ambassadors yet. Approve pending applications to add ambassadors.
                      </td>
                    </tr>
                  ) : (
                    activeMembers.map((m) => {
                      const referrals = m.crewReferralsCount || 0;
                      const isInternEligible = referrals >= CREW_INTERNSHIP_SIGNUP_TARGET || m.isPaidInternshipEligible;
                      const startDate = m.crewStartDate ? new Date(m.crewStartDate) : new Date(m.createdAt || Date.now());
                      const daysActive = Math.max(0, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                      const daysRemaining = Math.max(0, Math.ceil(30 - daysActive));

                      return (
                        <tr key={m.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold">
                            <div>{m.name}</div>
                            <div className="text-[11px] font-normal text-slate-400">{m.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <UniversityLogoBadge university={m.crewInstitution || m.targetUniversity || 'General Campus'} size="xs" />
                              <span className="truncate max-w-[180px]">{m.crewInstitution || m.targetUniversity || 'General Campus'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {m.crewReferralCode || 'CREW-AMB'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              {referrals}
                            </span>
                            <span className="text-[10px] text-slate-400 block">signups</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {daysActive} days active
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {daysRemaining > 0 ? `${daysRemaining} days left in trial` : 'Trial period ended'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {/* Flag account for "Paid Internship Eligible" */}
                            {isInternEligible ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs animate-scale-in">
                                <Award className="w-3.5 h-3.5 text-amber-700" />
                                <span>Paid Internship Eligible</span>
                              </span>
                            ) : referrals >= CREW_TENURE_SIGNUP_TARGET ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                <Check className="w-3 h-3" /> 1-Year Locked
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {CREW_TENURE_SIGNUP_TARGET - referrals} needed for 1-yr
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {/* Simulate +1 referral for quick testing */}
                              <button
                                type="button"
                                title="Add +1 referral to test progress"
                                onClick={() => handleSimulateReferral(m)}
                                disabled={actionInProgress === m.uid}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                +1 Referral
                              </button>

                              {/* Requirement: Revoke Access button on each ambassador */}
                              <button
                                type="button"
                                onClick={() => {
                                  setRevokeConfirmUser(m);
                                  setRevokeReasonInput('');
                                }}
                                disabled={actionInProgress === m.uid}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-xs border border-rose-200/80 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Revoke Access</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REVOKED AMBASSADORS SUB-TAB                                             */}
      {/* ========================================================================= */}
      {subTab === 'revoked' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Revoked Crew ambassadors. Access is restricted and referral codes are inactive. Admins can Re-approve ambassadors at any time.
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Ambassador</th>
                    <th className="py-3 px-4">Campus</th>
                    <th className="py-3 px-4">Referral Code</th>
                    <th className="py-3 px-4">Signups (Retained)</th>
                    <th className="py-3 px-4">Date Revoked</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading revoked ambassadors…
                      </td>
                    </tr>
                  ) : revokedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No revoked ambassadors.
                      </td>
                    </tr>
                  ) : (
                    revokedMembers.map((m) => {
                      const revokedDate = m.crewRevokedAt ? new Date(m.crewRevokedAt).toLocaleDateString() : 'N/A';
                      const reason = m.crewRevokeReason || 'Revoked by administrator';

                      return (
                        <tr key={m.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold">
                            <div>{m.name}</div>
                            <div className="text-[11px] font-normal text-slate-400">{m.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <UniversityLogoBadge university={m.crewInstitution || m.targetUniversity || 'General Campus'} size="xs" />
                              <span className="truncate max-w-[180px]">{m.crewInstitution || m.targetUniversity || 'General Campus'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400 line-through">
                            {m.crewReferralCode || 'CREW-AMB'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              {m.crewReferralsCount || 0}
                            </span>
                            <span className="text-[10px] text-slate-400 block">signups record</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {revokedDate}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 text-[11px]">
                              {reason}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleReapprove(m)}
                              disabled={actionInProgress === m.uid}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Re-approve</span>
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
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4 animate-scale-in text-left">
            <h3 className="text-base font-extrabold text-slate-900">
              Reject Application for {selectedApp.fullName}
            </h3>
            <p className="text-xs text-slate-500">
              Provide an optional note explaining why the application was declined:
            </p>
            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="e.g. Current cohort for this campus is already filled; applicant details were incomplete."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedApp(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionInProgress === selectedApp.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE CONFIRMATION MODAL */}
      {revokeConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4 animate-scale-in text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">
                Revoke Ambassador Access?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to revoke Crew status for <strong className="text-slate-900">{revokeConfirmUser.name}</strong> ({revokeConfirmUser.crewInstitution || 'Campus'})?
            </p>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-800 space-y-1">
              <p>• Ambassador dashboard route will live-redirect to student portal (/app) immediately.</p>
              <p>• Only Crew-granted Premium will be reverted; paid plans are never downgraded.</p>
              <p>• Referral code will be marked inactive for new signups (referrals history retained).</p>
              <p>• In-app alert created &amp; official email sent from noreply@boardly.cfd.</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Reason for Revocation (Optional):
              </label>
              <textarea
                rows={2}
                value={revokeReasonInput}
                onChange={(e) => setRevokeReasonInput(e.target.value)}
                placeholder="e.g. Terms non-compliance, inactive semester participation, or requested departure"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRevokeConfirmUser(null);
                  setRevokeReasonInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={actionInProgress === revokeConfirmUser.uid}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

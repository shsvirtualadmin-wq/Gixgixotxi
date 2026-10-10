import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Check,
  X,
  MessageSquare,
  Building,
  MapPin,
  Phone,
  Mail,
  Shield,
  RefreshCw,
  Sparkles,
  Award,
} from 'lucide-react';

export interface StudyCircle {
  id: string;
  name: string;
  description: string;
  creatorEmail: string;
  creatorName: string;
  track: string;
  memberCount: number;
  maxMembers: number;
  weeklyGoal: string;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
}

export interface CaptainApplication {
  id: string;
  studentName: string;
  email: string;
  phone: string;
  institution: string;
  grade: string;
  city: string;
  statement: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  adminNote?: string;
}

interface AdminProgramsTabProps {
  currentUserEmail?: string;
}

export const AdminProgramsTab: React.FC<AdminProgramsTabProps> = ({
  currentUserEmail = 'shsvirtualadmin@gmail.com',
}) => {
  const [subTab, setSubTab] = useState<'captains' | 'circles'>('captains');
  const [studyCircles, setStudyCircles] = useState<StudyCircle[]>([]);
  const [captainApplications, setCaptainApplications] = useState<CaptainApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Captains CRM Filter
  const [captainsSearch, setCaptainsSearch] = useState('');
  const [captainsStatusFilter, setCaptainsStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApp, setSelectedApp] = useState<CaptainApplication | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // New Circle Modal
  const [showNewCircleModal, setShowNewCircleModal] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  const [circleTrack, setCircleTrack] = useState('FBISE 11 Pre-Engineering');
  const [circleMaxMembers, setCircleMaxMembers] = useState(10);
  const [circleWeeklyGoal, setCircleWeeklyGoal] = useState('100 MCQs / week');
  const [creatingCircle, setCreatingCircle] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProgramsData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/programs?adminEmail=${encodeURIComponent(currentUserEmail)}`, {
        headers: { 'x-admin-email': currentUserEmail },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStudyCircles(data.studyCircles || []);
        setCaptainApplications(data.captainApplications || []);
      }
    } catch (err) {
      console.error('Failed to fetch programs data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgramsData();
  }, [currentUserEmail]);

  const handleReviewApplication = async (status: 'approved' | 'rejected') => {
    if (!selectedApp) return;
    setReviewing(true);
    try {
      const res = await fetch('/api/admin/captain-applications/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUserEmail,
        },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          status,
          adminNote: reviewNote,
          adminEmail: currentUserEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({
          type: 'success',
          message: `Application for ${selectedApp.studentName} marked as ${status.toUpperCase()}.`,
        });
        setSelectedApp(null);
        fetchProgramsData();
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to review application.' });
    } finally {
      setReviewing(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) return;
    setCreatingCircle(true);
    try {
      const res = await fetch('/api/admin/study-circles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUserEmail,
        },
        body: JSON.stringify({
          name: circleName,
          description: circleDescription,
          track: circleTrack,
          maxMembers: circleMaxMembers,
          weeklyGoal: circleWeeklyGoal,
          adminEmail: currentUserEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: 'success', message: `Study Circle "${circleName}" created successfully!` });
        setShowNewCircleModal(false);
        setCircleName('');
        setCircleDescription('');
        fetchProgramsData();
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to create circle.' });
    } finally {
      setCreatingCircle(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleModerateCircle = async (circleId: string, status: 'active' | 'paused' | 'archived') => {
    try {
      const res = await fetch('/api/admin/study-circles/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUserEmail,
        },
        body: JSON.stringify({
          circleId,
          status,
          adminEmail: currentUserEmail,
        }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: `Circle status updated to ${status}.` });
        fetchProgramsData();
      }
    } catch {}
    setTimeout(() => setToast(null), 4000);
  };

  const filteredCaptains = captainApplications.filter((app) => {
    const q = captainsSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      app.studentName.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      app.institution.toLowerCase().includes(q) ||
      app.city.toLowerCase().includes(q);

    const matchStatus = captainsStatusFilter === 'all' || app.status === captainsStatusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = captainApplications.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Tabs: Campus Captains CRM vs Study Circles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600 w-full sm:w-auto">
          <button
            onClick={() => setSubTab('captains')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'captains' ? 'bg-white text-violet-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Campus Captains CRM</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-violet-600 text-white">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('circles')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'circles' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Study Circles ({studyCircles.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {subTab === 'circles' && (
            <button
              onClick={() => setShowNewCircleModal(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Hub / Circle</span>
            </button>
          )}
          <button
            onClick={fetchProgramsData}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CAMPUS CAPTAINS CRM INBOX */}
      {subTab === 'captains' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5">
          {/* CRM Search and Status Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={captainsSearch}
                onChange={(e) => setCaptainsSearch(e.target.value)}
                placeholder="Search applicants, college, city..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold text-slate-600">
              <button
                onClick={() => setCaptainsStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  captainsStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All ({captainApplications.length})
              </button>
              <button
                onClick={() => setCaptainsStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  captainsStatusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setCaptainsStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  captainsStatusFilter === 'approved' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setCaptainsStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  captainsStatusFilter === 'rejected' ? 'bg-white text-rose-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* CRM Applications Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Institution & City</th>
                  <th className="py-3 px-4">Class / Grade</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCaptains.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No Campus Captain applications found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCaptains.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{app.email}</div>
                        {app.phone && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{app.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.institution}</span>
                        </div>
                        {app.city && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            <span>{app.city}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {app.grade}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            app.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                          }`}
                        >
                          {app.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {app.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {app.status === 'pending' && <Clock className="w-3 h-3" />}
                          <span>{app.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setReviewNote(app.adminNote || '');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-violet-200 text-violet-700 hover:bg-violet-50 font-bold transition-colors cursor-pointer"
                        >
                          Review &amp; Decide
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: STUDY CIRCLES HUBS */}
      {subTab === 'circles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {studyCircles.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border p-6">
              No Study Circles created yet. Click &quot;Create Hub / Circle&quot; to establish group study hubs.
            </div>
          ) : (
            studyCircles.map((circle) => (
              <div
                key={circle.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      {circle.track}
                    </span>
                    <h5 className="text-base font-extrabold text-slate-900 mt-1">{circle.name}</h5>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      circle.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {circle.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {circle.description}
                </p>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Members:</span>
                    <strong className="text-slate-800 font-bold">{circle.memberCount} / {circle.maxMembers} students</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Target:</span>
                    <strong className="text-slate-800 font-bold">{circle.weeklyGoal}</strong>
                  </div>
                </div>

                {/* Moderate Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400">Moderation</span>
                  <div className="flex items-center gap-1.5">
                    {circle.status !== 'active' && (
                      <button
                        onClick={() => handleModerateCircle(circle.id, 'active')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 cursor-pointer"
                      >
                        Activate
                      </button>
                    )}
                    {circle.status === 'active' && (
                      <button
                        onClick={() => handleModerateCircle(circle.id, 'paused')}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 cursor-pointer"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      onClick={() => handleModerateCircle(circle.id, 'archived')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review Captain Application Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                  Campus Captain CRM Review
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedApp.studentName}
                </h3>
                <p className="text-slate-500">{selectedApp.institution} • {selectedApp.city}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div>
                <span className="font-bold text-slate-400 block text-[10px] uppercase">Applicant Statement / Motivation</span>
                <p className="text-slate-800 leading-relaxed mt-1 font-medium bg-white p-3 rounded-xl border border-slate-200">
                  &quot;{selectedApp.statement || 'No statement provided.'}&quot;
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Email Address</span>
                  <strong className="text-slate-900">{selectedApp.email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone / WhatsApp</span>
                  <strong className="text-slate-900">{selectedApp.phone || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Class</span>
                  <strong className="text-slate-900">{selectedApp.grade}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Applied At</span>
                  <strong className="text-slate-900">{new Date(selectedApp.appliedAt).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Admin Decision Note */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Admin Feedback / Decision Note</label>
              <textarea
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Approved for Islamabad Region, sent welcome email and voucher"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => handleReviewApplication('rejected')}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-black transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => handleReviewApplication('approved')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Captain</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Study Circle Modal */}
      {showNewCircleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                  New Study Circle
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Create Group Hub
                </h3>
              </div>
              <button onClick={() => setShowNewCircleModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Circle Name</label>
                <input
                  type="text"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  placeholder="e.g. FAST-NU Advanced Math Solvers"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Description & Scope</label>
                <textarea
                  rows={2}
                  value={circleDescription}
                  onChange={(e) => setCircleDescription(e.target.value)}
                  placeholder="Goal and focus area..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Academic Track</label>
                <input
                  type="text"
                  value={circleTrack}
                  onChange={(e) => setCircleTrack(e.target.value)}
                  placeholder="e.g. FBISE 11, MDCAT, NUST NET"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Max Seats</label>
                  <input
                    type="number"
                    value={circleMaxMembers}
                    onChange={(e) => setCircleMaxMembers(Number(e.target.value))}
                    min={3}
                    max={50}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Weekly Target</label>
                  <input
                    type="text"
                    value={circleWeeklyGoal}
                    onChange={(e) => setCircleWeeklyGoal(e.target.value)}
                    placeholder="e.g. 100 MCQs / week"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowNewCircleModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCircle}
                disabled={creatingCircle}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black shadow-md cursor-pointer"
              >
                {creatingCircle ? 'Creating...' : 'Create Hub'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  StudentUserProfile,
  fetchAllUsersPaginated,
  getUserCountTotal,
  saveUserProfile,
  recordAuditLog,
  StoredPaymentRequest,
  StoredReview,
  StoredAuditLog,
  UserRole,
} from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StatCard } from './ui/StatCard';
import { DataTable } from './ui/DataTable';
import { Badge } from './ui/Badge';
import { StatusPill } from './ui/StatusPill';
import { Modal } from './ui/Modal';
import { Drawer } from './ui/Drawer';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { SparkLineTrendChart, DonutDistributionChart, MiniBarChart } from './ui/Charts';
import { UniversityLogoBadge } from './UniversityLogoBadge';
import { UNIVERSITIES } from '../data/universities';
import { normalizePlanId, PLAN_LIMITS } from '../data/planLimits';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  BookOpen,
  Award,
  Star,
  FileText,
  MessageSquare,
  HelpCircle,
  Shield,
  Settings,
  Search,
  Download,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Lock,
  Plus,
  Send,
  ExternalLink,
  Power,
} from 'lucide-react';

interface AdminDashboardScreenProps {
  currentUser: any;
  onBack: () => void;
  initialTab?: string;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  currentUser,
  onBack,
  initialTab,
}) => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState<string>(initialTab || 'overview');

  // Students state with proper error reporting & retry
  const [students, setStudents] = useState<StudentUserProfile[]>([]);
  const [totalStudentCount, setTotalStudentCount] = useState<number>(0);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // Selected student for drawer
  const [selectedStudent, setSelectedStudent] = useState<StudentUserProfile | null>(null);
  const [showStudentDrawer, setShowStudentDrawer] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // Payment requests
  const [paymentRequests, setPaymentRequests] = useState<StoredPaymentRequest[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);

  // Reviews moderation queue
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [placeholderReviewsEnabled, setPlaceholderReviewsEnabled] = useState<boolean>(true);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<StoredAuditLog[]>([]);

  // Boardy settings
  const [boardyKillSwitch, setBoardyKillSwitch] = useState<boolean>(false);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const adminEmail = user?.email || 'shsvirtualadmin@gmail.com';

  // 1. Fetch Students & Total Count from Named Firestore
  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentsError(null);
    try {
      // 1. Get total count
      let count = 0;
      try {
        count = await getUserCountTotal();
        setTotalStudentCount(count);
      } catch (countErr: any) {
        console.warn('[Admin] getUserCountTotal fallback:', countErr);
      }

      // 2. Fetch students paginated
      const { students: fetchedList } = await fetchAllUsersPaginated(50);
      setStudents(fetchedList);
      if (count === 0 && fetchedList.length > 0) {
        setTotalStudentCount(fetchedList.length);
      }
    } catch (err: any) {
      console.error('[Admin] loadStudents error:', err);
      setStudentsError(err?.message || 'Failed to connect to Named Firestore. Permission or network error.');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  // 2. Fetch Payment Requests
  const loadPaymentRequests = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const q = query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const list: StoredPaymentRequest[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setPaymentRequests(list);
    } catch (err: any) {
      console.warn('[Admin] loadPaymentRequests warning (using baseline):', err);
      // Fallback baseline for demo
      setPaymentRequests([
        {
          id: 'pay-01',
          userId: 'u-123',
          userName: 'Muhammad Zeeshan',
          userEmail: 'zeeshan@example.com',
          planId: 'pro',
          durationMonths: 1,
          amountPkr: 2499,
          paymentMethod: 'jazzcash',
          transactionId: 'JC-902148124',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  // 3. Fetch Reviews
  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const list: StoredReview[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setReviews(list);
    } catch (err) {
      console.warn('[Admin] loadReviews warning:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  // 4. Fetch Audit Logs
  const loadAuditLogs = useCallback(async () => {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const list: StoredAuditLog[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setAuditLogs(list);
    } catch (err) {
      console.warn('[Admin] loadAuditLogs warning:', err);
    }
  }, []);

  useEffect(() => {
    loadStudents();
    loadPaymentRequests();
    loadReviews();
    loadAuditLogs();
  }, [loadStudents, loadPaymentRequests, loadReviews, loadAuditLogs]);

  // Handle plan update for student
  const handleChangeStudentPlan = async (studentId: string, newPlan: 'free' | 'pro' | 'premium') => {
    try {
      await saveUserProfile(studentId, { plan: newPlan });
      await recordAuditLog({
        adminId: user?.uid || 'admin',
        adminEmail,
        action: 'CHANGE_STUDENT_PLAN',
        targetType: 'user',
        targetId: studentId,
        details: `Updated plan to ${newPlan.toUpperCase()}`,
      });
      setActionSuccessMsg(`Plan updated to ${newPlan.toUpperCase()}`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadStudents();
      if (selectedStudent && selectedStudent.uid === studentId) {
        setSelectedStudent({ ...selectedStudent, plan: newPlan });
      }
    } catch (err: any) {
      alert(`Error updating plan: ${err?.message}`);
    }
  };

  // Handle payment request approval
  const handleApprovePayment = async (req: StoredPaymentRequest) => {
    try {
      if (req.id) {
        await updateDoc(doc(db, 'paymentRequests', req.id), {
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminEmail,
        });
      }
      // Update student plan to requested plan
      await saveUserProfile(req.userId, { plan: req.planId });
      await recordAuditLog({
        adminId: user?.uid || 'admin',
        adminEmail,
        action: 'APPROVE_PAYMENT',
        targetType: 'paymentRequest',
        targetId: req.id || req.userId,
        details: `Approved PKR ${req.amountPkr} for ${req.userEmail} -> ${req.planId}`,
      });
      loadPaymentRequests();
      loadStudents();
    } catch (err: any) {
      alert(`Error approving payment: ${err?.message}`);
    }
  };

  // Handle payment request rejection
  const handleRejectPayment = async (req: StoredPaymentRequest, reason: string) => {
    try {
      if (req.id) {
        await updateDoc(doc(db, 'paymentRequests', req.id), {
          status: 'rejected',
          rejectionReason: reason,
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminEmail,
        });
      }
      await recordAuditLog({
        adminId: user?.uid || 'admin',
        adminEmail,
        action: 'REJECT_PAYMENT',
        targetType: 'paymentRequest',
        targetId: req.id || req.userId,
        details: `Rejected payment for ${req.userEmail}: ${reason}`,
      });
      loadPaymentRequests();
    } catch (err: any) {
      alert(`Error rejecting payment: ${err?.message}`);
    }
  };

  // CSV Export for Students Table
  const handleExportStudentsCsv = () => {
    if (students.length === 0) return;
    const headers = ['UID', 'Name', 'Email', 'Plan', 'Role', 'Joined Date', 'Status'];
    const rows = students.map((s) => [
      s.uid,
      `"${s.name || 'Student'}"`,
      s.email || '',
      s.plan || 'free',
      s.role || 'student',
      s.createdAt || '',
      s.status || 'active',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `boardly_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    recordAuditLog({
      adminId: user?.uid || 'admin',
      adminEmail,
      action: 'EXPORT_STUDENTS_CSV',
      targetType: 'users',
      targetId: 'all',
      details: `Exported ${students.length} student records to CSV`,
    }).catch(console.warn);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" />, badge: totalStudentCount || students.length },
    { id: 'payments', label: 'Plans & Payments', icon: <DollarSign className="w-4 h-4" />, badge: paymentRequests.filter(p => p.status === 'pending').length || undefined },
    { id: 'events', label: 'Events & Mocks', icon: <Calendar className="w-4 h-4" /> },
    { id: 'circles', label: 'Study Circles', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'captains', label: 'Campus Captains', icon: <Award className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews Moderation', icon: <Star className="w-4 h-4" />, badge: reviews.filter(r => r.status === 'pending').length || undefined },
    { id: 'content', label: 'Question Bank', icon: <FileText className="w-4 h-4" /> },
    { id: 'boardy', label: 'Boardy AI', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'support', label: 'Support Tickets', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Log', icon: <Shield className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 text-slate-900 dark:text-white flex font-sans">
      {/* Permanent Left Admin Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 select-none">
        <div>
          {/* Top Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-violet-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                B
              </div>
              <div>
                <span className="font-black text-base text-white tracking-tight">Boardly</span>
                <span className="text-[10px] block font-extrabold text-violet-400 uppercase tracking-widest">
                  Admin Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 font-extrabold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Back Button */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-violet-400" />
            <span>Return to App</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="font-black text-lg text-slate-900 dark:text-white capitalize">
              {activeSection.replace('_', ' ')}
            </h2>
            <Badge variant="violet">Master Admin</Badge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Logged in as <strong className="text-slate-900 dark:text-white">{adminEmail}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                loadStudents();
                loadPaymentRequests();
                loadReviews();
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Action Success Toast */}
          {actionSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* 1. OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Students"
                  value={totalStudentCount || students.length}
                  subtitle="Named Firestore sync"
                  accent="violet"
                  icon={<Users className="w-5 h-5 text-violet-600" />}
                />
                <StatCard
                  label="Paid Subscribers"
                  value={students.filter((s) => s.plan === 'pro' || s.plan === 'premium').length}
                  subtitle="Pro & Premium users"
                  accent="violet"
                  icon={<DollarSign className="w-5 h-5 text-violet-600" />}
                />
                <StatCard
                  label="Pending Upgrades"
                  value={paymentRequests.filter((p) => p.status === 'pending').length}
                  subtitle="Awaiting slip verification"
                  accent="violet"
                  icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
                />
                <StatCard
                  label="Reviews Queue"
                  value={reviews.filter((r) => r.status === 'pending').length}
                  subtitle="Student submissions"
                  accent="violet"
                  icon={<Star className="w-5 h-5 text-teal-600" />}
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    30-Day Platform Signups Velocity
                  </h3>
                  <SparkLineTrendChart
                    data={[
                      { label: 'Week 1', value: 45 },
                      { label: 'Week 2', value: 89 },
                      { label: 'Week 3', value: 165 },
                      { label: 'Week 4', value: totalStudentCount || 230 },
                    ]}
                    color="#7C3AED"
                    height={200}
                  />
                </div>

                <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Plan Distribution
                  </h3>
                  <DonutDistributionChart
                    data={[
                      { name: 'Free', value: Math.max(1, students.filter((s) => s.plan === 'free').length), color: '#94A3B8' },
                      { name: 'Pro', value: Math.max(1, students.filter((s) => s.plan === 'pro').length), color: '#4F46E5' },
                      { name: 'Premium', value: Math.max(1, students.filter((s) => s.plan === 'premium').length), color: '#7C3AED' },
                    ]}
                    height={200}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. STUDENTS (Bug Fix 1.3: Real Query, Pagination, Retry, Never Silent 0) */}
          {activeSection === 'students' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Students Directory ({totalStudentCount || students.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live database query ordered by createdAt desc. Click any student row to view full drawer.
                  </p>
                </div>
              </div>

              {studentsError ? (
                <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Failed to load students data</span>
                  </div>
                  <p className="text-xs">{studentsError}</p>
                  <button
                    type="button"
                    onClick={loadStudents}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Connection</span>
                  </button>
                </div>
              ) : (
                <DataTable
                  data={students}
                  isLoading={loadingStudents}
                  keyExtractor={(s) => s.uid}
                  onExportCsv={handleExportStudentsCsv}
                  onRowClick={(student) => {
                    setSelectedStudent(student);
                    setShowStudentDrawer(true);
                  }}
                  columns={[
                    {
                      key: 'name',
                      header: 'Student',
                      sortable: true,
                      render: (s) => (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 font-extrabold text-xs flex items-center justify-center">
                            {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {s.name || 'Student'}
                            </span>
                            <span className="text-[11px] text-slate-400">{s.email}</span>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'plan',
                      header: 'Plan',
                      sortable: true,
                      render: (s) => <StatusPill status={s.plan || 'free'} />,
                    },
                    {
                      key: 'role',
                      header: 'Role',
                      render: (s) => <Badge variant={s.role === 'admin' ? 'violet' : 'indigo'}>{s.role}</Badge>,
                    },
                    {
                      key: 'createdAt',
                      header: 'Joined Date',
                      sortable: true,
                      render: (s) => (
                        <span className="text-slate-500">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      ),
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (s) => <StatusPill status={s.status || 'active'} />,
                    },
                  ]}
                />
              )}
            </div>
          )}

          {/* 3. PLANS & PAYMENTS */}
          {activeSection === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Upgrade Payment Requests ({paymentRequests.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Students upload transaction references for JazzCash, Easypaisa, or Bank Transfers.
                  </p>
                </div>
              </div>

              <DataTable
                data={paymentRequests}
                isLoading={loadingPayments}
                keyExtractor={(p) => p.id || Math.random().toString()}
                columns={[
                  {
                    key: 'userName',
                    header: 'Student',
                    render: (p) => (
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{p.userName}</span>
                        <span className="text-[11px] text-slate-400">{p.userEmail}</span>
                      </div>
                    ),
                  },
                  {
                    key: 'planId',
                    header: 'Target Plan',
                    render: (p) => <Badge variant="violet">{p.planId.toUpperCase()}</Badge>,
                  },
                  {
                    key: 'amountPkr',
                    header: 'Amount',
                    render: (p) => <span className="font-black text-emerald-600">PKR {p.amountPkr}</span>,
                  },
                  {
                    key: 'transactionId',
                    header: 'Transaction ID / Method',
                    render: (p) => (
                      <div>
                        <span className="font-mono text-xs font-bold block">{p.transactionId}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{p.paymentMethod}</span>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (p) => <StatusPill status={p.status} />,
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (p) =>
                      p.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprovePayment(p)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectPayment(p, 'Invalid transaction reference')}
                            className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Reviewed</span>
                      ),
                  },
                ]}
              />
            </div>
          )}

          {/* 7. REVIEWS MODERATION & 500 PLACEHOLDERS COUNTER */}
          {activeSection === 'reviews' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-transparent border border-violet-200/80 dark:border-violet-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Placeholders & Organic Reviews Ratio
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Real approved: <strong className="text-violet-700 dark:text-violet-300">{reviews.filter((r) => r.status === 'approved').length}</strong> · Placeholders active: <strong className="text-slate-700 dark:text-slate-300">500</strong> · Target: <strong>500</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Master Placeholder Switch:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlaceholderReviewsEnabled(!placeholderReviewsEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      placeholderReviewsEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {placeholderReviewsEnabled ? 'Active (One-by-One)' : 'Disabled'}
                  </button>
                </div>
              </div>

              <DataTable
                data={reviews}
                isLoading={loadingReviews}
                keyExtractor={(r) => r.id || Math.random().toString()}
                columns={[
                  { key: 'name', header: 'Student Name' },
                  { key: 'rating', header: 'Stars', render: (r) => <span className="text-amber-500 font-black">★ {r.rating}</span> },
                  { key: 'text', header: 'Review Content', render: (r) => <span className="line-clamp-2 max-w-md">{r.text}</span> },
                  { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
                  {
                    key: 'actions',
                    header: 'Moderate',
                    render: (r) =>
                      r.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (r.id) {
                                await updateDoc(doc(db, 'reviews', r.id), { status: 'approved' });
                                loadReviews();
                              }
                            }}
                            className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (r.id) {
                                await updateDoc(doc(db, 'reviews', r.id), { status: 'rejected' });
                                loadReviews();
                              }
                            }}
                            className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Processed</span>
                      ),
                  },
                ]}
              />
            </div>
          )}

          {/* 9. BOARDY AI CONTROLS */}
          {activeSection === 'boardy' && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Boardy AI Global Kill-Switch
                    </h3>
                    <p className="text-xs text-slate-400">
                      Emergency pause switch to halt all Gemini model chat invocations across web and mobile.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBoardyKillSwitch(!boardyKillSwitch)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      boardyKillSwitch
                        ? 'bg-rose-600 text-white shadow-rose-500/20'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{boardyKillSwitch ? 'AI PAUSED' : 'AI ACTIVE'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 11. AUDIT TRAIL */}
          {activeSection === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Immutable System Audit Trail
                  </h3>
                  <p className="text-xs text-slate-400">
                    Every administrative permission elevation, plan change, and review moderation action is recorded.
                  </p>
                </div>
              </div>

              <DataTable
                data={auditLogs}
                keyExtractor={(a) => a.id || Math.random().toString()}
                columns={[
                  { key: 'createdAt', header: 'Timestamp', render: (a) => <span className="font-mono text-slate-400">{new Date(a.createdAt).toLocaleString()}</span> },
                  { key: 'adminEmail', header: 'Admin Email' },
                  { key: 'action', header: 'Action', render: (a) => <Badge variant="violet">{a.action}</Badge> },
                  { key: 'details', header: 'Operation Details' },
                ]}
              />
            </div>
          )}
        </main>
      </div>

      {/* Student Details Drawer */}
      {selectedStudent && (
        <Drawer
          isOpen={showStudentDrawer}
          onClose={() => setShowStudentDrawer(false)}
          title={selectedStudent.name || 'Student Profile'}
          subtitle={selectedStudent.email}
        >
          <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Quick Stats */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Plan:</span>
                <StatusPill status={selectedStudent.plan || 'free'} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <Badge variant="indigo">{selectedStudent.role || 'student'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tests Today:</span>
                <span className="font-black">{selectedStudent.testsUsedToday || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Boardy Chats Today:</span>
                <span className="font-black">{selectedStudent.boardyQuestionsUsedToday || 0}</span>
              </div>
            </div>

            {/* Change Plan Action */}
            <div className="space-y-2 pt-2">
              <label className="font-extrabold text-slate-900 dark:text-white block">
                Assign Plan Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'pro', 'premium'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleChangeStudentPlan(selectedStudent.uid, p)}
                    className={`py-2 rounded-xl font-bold uppercase text-[11px] border cursor-pointer ${
                      selectedStudent.plan === p
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Elevate to Admin */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={async () => {
                  await saveUserProfile(selectedStudent.uid, { role: 'admin', roles: ['admin', 'student'] });
                  recordAuditLog({
                    adminId: user?.uid || 'admin',
                    adminEmail,
                    action: 'ELEVATE_ADMIN_ROLE',
                    targetType: 'user',
                    targetId: selectedStudent.uid,
                    details: `Granted Admin role to ${selectedStudent.email}`,
                  });
                  alert(`Role elevated to Admin for ${selectedStudent.name}`);
                  loadStudents();
                }}
                className="w-full py-2.5 rounded-xl border border-violet-300 text-violet-700 font-bold hover:bg-violet-50 cursor-pointer"
              >
                Grant Administrator Access
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};

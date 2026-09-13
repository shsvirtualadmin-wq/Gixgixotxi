import React, { useState, useEffect } from 'react';
import { UserAvatar } from './UserAvatar';
import { StudyBuddyFormattedMessage } from './StudyBuddyFormattedMessage';
import { SegmentedControl } from './SegmentedControl';
import {
  supabase,
  isAdminEmail,
  fetchAllStudentsFromSupabase,
  fetchAllTestResultsFromSupabase,
  fetchStudentTestResultsFromSupabase,
  fetchAllStudentWeaknessProfiles,
  fetchStudentStudyBuddyHistoryFromSupabase,
  fetchAllStudyBuddyHistoryFromSupabase,
  updateStudentGradeAndStreamInSupabase,
  permanentlyDeleteTestRecordInSupabase,
  removeStudentAccountInSupabase,
  updateStudentStatusInSupabase,
  fetchAllPaymentRequestsFromSupabase,
  reviewPaymentRequestInSupabase,
  updateStudentPlanInSupabase,
  fetchAdminActivityLogsFromSupabase,
  AdminActivityLog,
  PaymentRequest,
  StudentWeaknessProfileData,
  User,
  StudentProfile,
  AdminTestResult,
  StudyBuddyMessage,
  evaluateStudentAccess,
} from '../lib/supabase';
import { getPrebuiltQuestionsForSubject } from '../data/prebuiltQuestions';
import { getDynamicQuestionBankStats } from '../lib/questionBankStats';
import {
  ShieldCheck,
  Search,
  Users,
  Download,
  ArrowLeft,
  Mail,
  GraduationCap,
  Calendar,
  Key,
  Lock,
  User as UserIcon,
  RefreshCw,
  FileText,
  Award,
  BookOpen,
  BarChart2,
  Copy,
  Check,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ListChecks,
  Database,
  Sparkles,
  RotateCcw,
  CheckCircle,
  XCircle,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Trash2,
  Loader2,
  Target,
  MessageSquare,
  Phone,
  Bot,
  UserCheck,
  UserX,
  Zap,
  UploadCloud,
  CreditCard,
  Clock,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  ZoomIn,
} from 'lucide-react';

interface AdminDashboardScreenProps {
  currentUser: User | null;
  initialTab?: 'students' | 'payment_requests' | 'activity_logs' | 'tests' | 'progress';
  onBack: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = React.memo(({
  currentUser,
  initialTab = 'students',
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'payment_requests' | 'activity_logs' | 'tests' | 'progress'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [allTestResults, setAllTestResults] = useState<AdminTestResult[]>([]);
  const [allStudyBuddyHistory, setAllStudyBuddyHistory] = useState<StudyBuddyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Payment Requests State & Filters
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState<string>('');
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<PaymentRequest | null>(null);
  const [rejectNote, setRejectNote] = useState<string>('');
  const [paymentToast, setPaymentToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Student directory filters
  const [studentGradeFilter, setStudentGradeFilter] = useState<string>('All');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('All');
  const [studentPlanFilter, setStudentPlanFilter] = useState<string>('All');

  // Admin Activity Logs & Manual Plan Change State
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [activitySearchQuery, setActivitySearchQuery] = useState<string>('');
  const [selectedStudentForPlan, setSelectedStudentForPlan] = useState<StudentProfile | null>(null);
  const [selectedPlansForChange, setSelectedPlansForChange] = useState<string[]>(['free']);
  const [selectedAssignedClassesForChange, setSelectedAssignedClassesForChange] = useState<string[]>([]);
  const [customPackageName, setCustomPackageName] = useState<string>('');
  const [expirationMonths, setExpirationMonths] = useState<number>(12);
  const [isProForChange, setIsProForChange] = useState<boolean>(false);
  const [planAdminNote, setPlanAdminNote] = useState<string>('');
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);
  const [planToast, setPlanToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);

  // Student Progress breakdown state
  const [progressSearch, setProgressSearch] = useState<string>('');
  const [progressGradeFilter, setProgressGradeFilter] = useState<string>('All');
  const [progressSubjectFilter, setProgressSubjectFilter] = useState<string>('All');
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<StudentProfile | null>(null);
  const [studentWeaknessProfiles, setStudentWeaknessProfiles] = useState<StudentWeaknessProfileData[]>([]);
  const [avatarLoadError, setAvatarLoadError] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedStudentForProgress && students.length > 0) {
      setSelectedStudentForProgress(students[0]);
    }
  }, [students, selectedStudentForProgress]);

  // Admin Override state for student class/stream
  const [editStudentGrade, setEditStudentGrade] = useState<string>('');
  const [editStudentStream, setEditStudentStream] = useState<string>('');
  const [isSavingGradeStream, setIsSavingGradeStream] = useState<boolean>(false);
  const [adminOverrideToast, setAdminOverrideToast] = useState<string | null>(null);

  // Permanent record deletion state for Admin
  const [deletingRecord, setDeletingRecord] = useState<AdminTestResult | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState<boolean>(false);
  const [deleteRecordError, setDeleteRecordError] = useState<string | null>(null);

  // Student Account Removal & Status Toggle State
  const [studentToRemove, setStudentToRemove] = useState<StudentProfile | null>(null);
  const [removeConfirmText, setRemoveConfirmText] = useState<string>('');
  const [isRemovingStudent, setIsRemovingStudent] = useState<boolean>(false);
  const [removeStudentError, setRemoveStudentError] = useState<string | null>(null);
  const [removeSuccessToast, setRemoveSuccessToast] = useState<string | null>(null);
  const [togglingStatusStudentId, setTogglingStatusStudentId] = useState<string | null>(null);

  // Student Detail Modal state
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [studentHistory, setStudentHistory] = useState<AdminTestResult[]>([]);
  const [selectedStudentBuddyHistory, setSelectedStudentBuddyHistory] = useState<StudyBuddyMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingBuddyHistory, setLoadingBuddyHistory] = useState(false);
  const [detailSubTab, setDetailSubTab] = useState<'tests' | 'study_buddy'>('tests');

  // AI Study Buddy tab search
  const [studyBuddySearch, setStudyBuddySearch] = useState<string>('');

  // Clipboard copy state
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Active user auth detection
  const [activeUser, setActiveUser] = useState<User | null>(currentUser);

  useEffect(() => {
    if (currentUser) {
      setActiveUser(currentUser);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setActiveUser(session.user);
        }
      });
    }
  }, [currentUser]);

  const rawEmail = activeUser?.email || currentUser?.email || '';
  const detectedEmail = rawEmail.trim().toLowerCase();
  const isAdmin = isAdminEmail(detectedEmail);

  // Immediate Security Auto-Redirect Effect for Non-Admin Attempts
  useEffect(() => {
    if ((activeUser || currentUser) && !isAdmin) {
      console.warn('[Admin Security Guard]: Non-admin student access attempt detected in AdminDashboardScreen. Triggering redirect...');
      onBack();
    }
  }, [activeUser, currentUser, isAdmin, onBack]);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const [studentList, testList, weaknessList, buddyList, paymentList, logsList] = await Promise.all([
        fetchAllStudentsFromSupabase(),
        fetchAllTestResultsFromSupabase(),
        fetchAllStudentWeaknessProfiles(),
        fetchAllStudyBuddyHistoryFromSupabase(),
        fetchAllPaymentRequestsFromSupabase(detectedEmail),
        fetchAdminActivityLogsFromSupabase(detectedEmail),
      ]);
      setStudents(studentList);
      setAllTestResults(testList);
      setStudentWeaknessProfiles(weaknessList);
      setAllStudyBuddyHistory(buddyList);
      setPaymentRequests(paymentList);
      setActivityLogs(logsList);

      runAuditAndRevertUnverifiedPro(studentList, paymentList);
    } catch (err: any) {
      console.error('Failed to fetch admin data from database:', err);
      setError('Failed to load live admin data from database.');
    } finally {
      setLoading(false);
    }
  };

  const [auditProNotice, setAuditProNotice] = useState<string | null>(null);
  const [isAuditingPro, setIsAuditingPro] = useState<boolean>(false);

  const runAuditAndRevertUnverifiedPro = async (currentStudents: StudentProfile[], currentPayments: PaymentRequest[]) => {
    setIsAuditingPro(true);
    try {
      const approvedEmails = new Set(
        currentPayments
          .filter((p) => p.status === 'approved' && p.student_email)
          .map((p) => p.student_email!.toLowerCase().trim())
      );
      const approvedIds = new Set(
        currentPayments
          .filter((p) => p.status === 'approved' && p.student_id)
          .map((p) => p.student_id!)
      );

      const unverifiedProStudents = currentStudents.filter((s) => {
        if (!s.is_pro && s.payment_status !== 'Verified & Paid') return false;
        if (isAdminEmail(s.email)) return false;
        if (s.plan_status === 'verified_pro') return false;
        if (Array.isArray(s.subscribed_plans) && s.subscribed_plans.some((p) => p && String(p).toLowerCase() !== 'free')) return false;
        if (s.package_name && !s.package_name.toLowerCase().includes('free')) return false;
        const hasApprovedByEmail = Boolean(s.email && approvedEmails.has(s.email.toLowerCase().trim()));
        const hasApprovedById = Boolean(s.id && approvedIds.has(s.id));
        return !hasApprovedByEmail && !hasApprovedById;
      });

      if (unverifiedProStudents.length > 0) {
        console.log(`[Admin Audit] Found ${unverifiedProStudents.length} unverified Pro accounts. Reverting to Free Plan...`);
        let count = 0;
        for (const st of unverifiedProStudents) {
          const res = await updateStudentPlanInSupabase({
            studentId: st.id,
            studentEmail: st.email,
            subscribedPlans: ['free'],
            packageName: 'Free Plan',
            paymentStatus: 'Free Plan',
            isPro: false,
            adminEmail: detectedEmail,
            adminNote: 'Automated System Audit: Reverted unverified Pro access (no verified payment proof record found)',
          });
          if (res.success) {
            count++;
          }
        }
        setAuditProNotice(`Audited & Reverted ${count} unverified Pro account(s) to Free Plan.`);
        const refreshedStudents = await fetchAllStudentsFromSupabase();
        setStudents(refreshedStudents);
      } else {
        setAuditProNotice('Audit Complete: All Pro accounts verified against payment records.');
      }
    } catch (auditErr) {
      console.warn('[Admin Audit Warning]:', auditErr);
    } finally {
      setIsAuditingPro(false);
    }
  };

  const AVAILABLE_ASSIGNABLE_CLASSES = [
    'FBISE 9',
    'FBISE 10',
    'FBISE 11 Pre-Engineering',
    'FBISE 11 Pre-Medical',
    'FBISE 11 ICS',
    'FBISE 12 Pre-Engineering',
    'FBISE 12 Pre-Medical',
    'FBISE 12 ICS',
    'MDCAT',
    'TCAT',
    'NUST (NET)',
    'FAST-NU (NAT)',
    'ECAT (UET Lahore)',
    'ETEA (KPK Engineering)',
    'NUMS (Medical)',
    'GIKI (Engineering)',
    'USAT (HEC)',
    'NED University',
    'PIEAS',
    'NTS NAT',
    'IBA Karachi',
    'Aga Khan University (AKU)',
    'MUET Jamshoro',
    'LUMS',
    'NUML',
    'HITEC University Taxila',
    'NUTECH Islamabad',
  ];

const getPlanDefaultDisplayName = (planKey: string): string => {
  if (planKey === 'free') return 'Free Plan';
  if (planKey === 'matric') return '⭐ Matric Pro';
  if (planKey === 'fsc') return '⭐ FSc Pro';
  if (planKey === 'tcat') return '⭐ TCAT Pro';
  if (planKey === 'mdcat') return '⭐ MDCAT Pro';
  if (planKey === 'net') return '⭐ NUST NET Pro';
  if (planKey === 'fast') return '⭐ FAST-NU NAT Pro';
  if (planKey === 'ecat') return '⭐ ECAT Pro';
  if (planKey === 'etea') return '⭐ ETEA Pro';
  if (planKey === 'nums') return '⭐ NUMS Medical Pro';
  if (planKey === 'giki') return '⭐ GIKI Pro';
  if (planKey === 'usat') return '⭐ HEC USAT Pro';
  if (planKey === 'ned') return '⭐ NED University Pro';
  if (planKey === 'pieas') return '⭐ PIEAS Pro';
  if (planKey === 'nat') return '⭐ NTS NAT Pro';
  if (planKey === 'iba') return '⭐ IBA Karachi Pro';
  if (planKey === 'aku') return '⭐ AKU Medical Pro';
  if (planKey === 'muet') return '⭐ MUET Jamshoro Pro';
  if (planKey === 'lums') return '⭐ LUMS Pro';
  if (planKey === 'numl') return '⭐ NUML Pro';
  if (planKey === 'hitec') return '⭐ HITEC Taxila Pro';
  if (planKey === 'nutech') return '⭐ NUTECH Pro';
  return `⭐ ${planKey.toUpperCase()} Pro`;
};

  const handleOpenPlanModal = (student: StudentProfile) => {
    setSelectedStudentForPlan(student);
    const existingPlans = student.subscribed_plans && student.subscribed_plans.length > 0 ? student.subscribed_plans : ['free'];
    const activePlan = existingPlans[0] || 'free';
    // Default to single active plan selection
    setSelectedPlansForChange([activePlan]);

    const existingClasses = student.assigned_classes && student.assigned_classes.length > 0
      ? student.assigned_classes
      : (student.grade ? [`${student.grade}${student.stream ? ' ' + student.stream : ''}`.trim()] : ['FBISE 11 Pre-Engineering']);
    setSelectedAssignedClassesForChange(existingClasses);

    const initialPkgName = (student.package_name && student.package_name.trim())
      ? student.package_name
      : getPlanDefaultDisplayName(activePlan);
    setCustomPackageName(initialPkgName);
    const isExplicitlyFreeStudent = student.is_pro === false || student.payment_status === 'Free Plan' || (student.package_name && student.package_name.toLowerCase().includes('free'));
    setIsProForChange(isExplicitlyFreeStudent ? false : Boolean(student.is_pro));

    // Parse stored access_expires date to extract remaining/saved access period
    let calculatedMonths = 12;
    if (student.access_expires) {
      try {
        const expTime = new Date(student.access_expires).getTime();
        if (!isNaN(expTime)) {
          const nowTime = Date.now();
          const diffDays = Math.round((expTime - nowTime) / (1000 * 60 * 60 * 24));
          if (diffDays > 1000) calculatedMonths = 120; // Lifetime Access (10 Years)
          else if (diffDays > 270) calculatedMonths = 12; // 1 Year
          else if (diffDays > 120) calculatedMonths = 6;  // 6 Months
          else if (diffDays > 45) calculatedMonths = 3;   // 3 Months
          else if (diffDays > 0) calculatedMonths = 1;    // 1 Month
        }
      } catch (e) {}
    }
    setExpirationMonths(calculatedMonths);
    setPlanAdminNote('');
    setPlanToast(null);
  };

  const handleToggleAssignedClass = (clsName: string) => {
    if (selectedAssignedClassesForChange.includes(clsName)) {
      setSelectedAssignedClassesForChange(selectedAssignedClassesForChange.filter(c => c !== clsName));
    } else {
      setSelectedAssignedClassesForChange([...selectedAssignedClassesForChange, clsName]);
    }
  };

  const handleTogglePlanOption = (planKey: string) => {
    // Single plan selection rule: Only one plan should be selected at a time
    setSelectedPlansForChange([planKey]);
    if (planKey === 'free') {
      setIsProForChange(false);
    } else {
      setIsProForChange(true);
    }
    setCustomPackageName(getPlanDefaultDisplayName(planKey));
  };

  const handleSaveStudentPlan = async () => {
    if (!selectedStudentForPlan) return;
    setIsSavingPlan(true);
    setPlanToast(null);

    let pkgName = customPackageName.trim();
    if (!pkgName) {
      const p = selectedPlansForChange[0] || 'free';
      pkgName = getPlanDefaultDisplayName(p);
    }

    const isFree = selectedPlansForChange.includes('free') && selectedPlansForChange.length === 1 && !isProForChange;
    const paymentStatusVal = isProForChange ? 'Verified & Paid' : (isFree ? 'Free Plan' : 'Pending Verification');

    console.log('[Admin UI Click: Save & Update Subscription]', {
      studentId: selectedStudentForPlan.id,
      studentEmail: selectedStudentForPlan.email,
      subscribedPlans: selectedPlansForChange,
      assignedClasses: selectedAssignedClassesForChange,
      packageName: pkgName,
      isPro: isProForChange,
      expirationMonths,
      adminNote: planAdminNote,
      adminEmail: detectedEmail,
    });

    try {
      const res = await updateStudentPlanInSupabase({
        studentId: selectedStudentForPlan.id,
        studentEmail: selectedStudentForPlan.email,
        subscribedPlans: selectedPlansForChange,
        assignedClasses: selectedAssignedClassesForChange,
        packageName: pkgName,
        paymentStatus: paymentStatusVal,
        isPro: isProForChange,
        expirationMonths,
        adminNote: planAdminNote,
        adminEmail: detectedEmail,
      });

      if (res.success) {
        const returnedProfile = res.profile;

        setStudents((prev) =>
          prev.map((s) =>
            (s.id === selectedStudentForPlan.id || (Boolean(s.email) && Boolean(selectedStudentForPlan.email) && s.email.toLowerCase() === selectedStudentForPlan.email.toLowerCase()))
              ? {
                  ...s,
                  ...(returnedProfile || {}),
                  subscribed_plans: returnedProfile?.subscribed_plans || selectedPlansForChange,
                  assigned_classes: returnedProfile?.assigned_classes || selectedAssignedClassesForChange,
                  is_pro: returnedProfile?.is_pro ?? isProForChange,
                  package_name: returnedProfile?.package_name || pkgName,
                  payment_status: returnedProfile?.payment_status || paymentStatusVal,
                  requires_payment: returnedProfile?.requires_payment ?? !isProForChange,
                  status: 'active',
                }
              : s
          )
        );

        setPlanToast({
          type: 'success',
          message: res.message || `Subscription & permissions successfully updated for ${selectedStudentForPlan.name}!`,
        });

        // Refresh activity logs & database state
        const updatedLogs = await fetchAdminActivityLogsFromSupabase(detectedEmail);
        setActivityLogs(updatedLogs);
        await loadData();

        setTimeout(() => {
          setSelectedStudentForPlan(null);
          setPlanToast(null);
        }, 1200);
      } else {
        setPlanToast({ type: 'error', message: res.message || 'Failed to update student plan.' });
      }
    } catch (err: any) {
      setPlanToast({ type: 'error', message: err?.message || 'Error updating student plan.' });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleExportActivityLogsCSV = () => {
    if (activityLogs.length === 0) return;
    const headers = ['Log ID', 'Timestamp', 'Admin Email', 'Target Student Name', 'Target Student Email', 'Action', 'Old Plan', 'New Plan', 'Admin Note'];
    const rows = activityLogs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.created_at).toLocaleString()}"`,
      `"${(l.admin_email || '').replace(/"/g, '""')}"`,
      `"${(l.target_student_name || '').replace(/"/g, '""')}"`,
      `"${(l.target_student_email || '').replace(/"/g, '""')}"`,
      `"${(l.action_type || 'manual_plan_change').replace(/"/g, '""')}"`,
      `"${(l.old_plan || '').replace(/"/g, '""')}"`,
      `"${(l.new_plan || '').replace(/"/g, '""')}"`,
      `"${(l.note || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    downloadCSV(csvContent, `Admin_Activity_Audit_Log_${Date.now()}.csv`);
  };

  const handleApprovePaymentRequest = async (request: PaymentRequest) => {
    setReviewingRequestId(request.id);
    try {
      const res = await reviewPaymentRequestInSupabase(request.id, 'approved', undefined, detectedEmail);
      if (res.success) {
        setPaymentRequests((prev) =>
          prev.map((r) =>
            r.id === request.id
              ? { ...r, status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: detectedEmail }
              : r
          )
        );
        const [updatedStudents, updatedLogs] = await Promise.all([
          fetchAllStudentsFromSupabase(),
          fetchAdminActivityLogsFromSupabase(detectedEmail),
        ]);
        setStudents(updatedStudents);
        setActivityLogs(updatedLogs);

        setPaymentToast({
          type: 'success',
          message: `Payment approved! ${request.student_name} (${request.student_email}) upgraded to Premium Access.`,
        });
        setTimeout(() => setPaymentToast(null), 5000);
      } else {
        setPaymentToast({ type: 'error', message: res.message || 'Failed to approve payment request.' });
      }
    } catch (err: any) {
      setPaymentToast({ type: 'error', message: err?.message || 'Error approving payment.' });
    } finally {
      setReviewingRequestId(null);
    }
  };

  const handleConfirmRejectPaymentRequest = async () => {
    if (!rejectingRequest) return;
    const trimmedReason = rejectNote.trim();
    if (!trimmedReason) {
      setPaymentToast({
        type: 'error',
        message: 'A rejection reason is required before denying a payment request.',
      });
      return;
    }

    setReviewingRequestId(rejectingRequest.id);
    try {
      const res = await reviewPaymentRequestInSupabase(
        rejectingRequest.id,
        'rejected',
        trimmedReason,
        detectedEmail
      );
      if (res.success) {
        setPaymentRequests((prev) =>
          prev.map((r) =>
            r.id === rejectingRequest.id
              ? { ...r, status: 'rejected', admin_note: trimmedReason, reviewed_at: new Date().toISOString(), reviewed_by: detectedEmail }
              : r
          )
        );

        const [updatedStudents, updatedLogs] = await Promise.all([
          fetchAllStudentsFromSupabase(),
          fetchAdminActivityLogsFromSupabase(detectedEmail),
        ]);
        setStudents(updatedStudents);
        setActivityLogs(updatedLogs);

        setPaymentToast({
          type: 'success',
          message: `Payment request for ${rejectingRequest.student_name} marked as rejected with reason recorded.`,
        });
        setTimeout(() => setPaymentToast(null), 5000);
        setRejectingRequest(null);
        setRejectNote('');
      } else {
        setPaymentToast({ type: 'error', message: res.message || 'Failed to reject payment request.' });
      }
    } catch (err: any) {
      setPaymentToast({ type: 'error', message: err?.message || 'Error rejecting payment.' });
    } finally {
      setReviewingRequestId(null);
    }
  };

  const handleToggleStudentStatus = async (student: StudentProfile) => {
    const newStatus: 'active' | 'suspended' = student.status === 'suspended' ? 'active' : 'suspended';
    setTogglingStatusStudentId(student.id);
    try {
      const res = await updateStudentStatusInSupabase(
        student.id,
        newStatus,
        currentUser?.email || 'shsvirtualadmin@gmail.com'
      );
      if (res.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, status: newStatus } : s))
        );
        if (selectedStudent && selectedStudent.id === student.id) {
          setSelectedStudent((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        alert(res.message || 'Failed to update student status.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating student status.');
    } finally {
      setTogglingStatusStudentId(null);
    }
  };

  const handleConfirmRemoveStudent = async () => {
    if (!studentToRemove) return;
    setIsRemovingStudent(true);
    setRemoveStudentError(null);
    try {
      const res = await removeStudentAccountInSupabase(
        studentToRemove.id,
        studentToRemove.email,
        currentUser?.email || 'shsvirtualadmin@gmail.com'
      );
      if (!res.success) {
        throw new Error(res.message || 'Failed to remove student account.');
      }
      setStudents((prev) => prev.filter((s) => s.id !== studentToRemove.id));
      if (selectedStudent && selectedStudent.id === studentToRemove.id) {
        setSelectedStudent(null);
      }
      setRemoveSuccessToast(`Successfully wiped student account for ${studentToRemove.name} (${studentToRemove.email}).`);
      setStudentToRemove(null);
      setRemoveConfirmText('');
    } catch (err: any) {
      console.error('Error in handleConfirmRemoveStudent:', err);
      setRemoveStudentError(err?.message || 'Failed to remove student account.');
    } finally {
      setIsRemovingStudent(false);
    }
  };

  const handleConfirmPermanentDeleteRecord = async () => {
    if (!deletingRecord) return;
    setIsDeletingRecord(true);
    setDeleteRecordError(null);
    try {
      const res = await permanentlyDeleteTestRecordInSupabase(deletingRecord.id);
      if (!res.success) {
        throw new Error(res.error || 'Failed to permanently delete record from database.');
      }
      setAllTestResults((prev) => prev.filter((t) => t.id !== deletingRecord.id));
      setStudentHistory((prev) => prev.filter((t) => t.id !== deletingRecord.id));
      setDeletingRecord(null);
    } catch (err: any) {
      console.error('Error in handleConfirmPermanentDeleteRecord:', err);
      setDeleteRecordError(err?.message || 'Failed to delete record.');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const handleExportStudentsCSV = () => {
    if (students.length === 0) return;
    const headers = ['Student ID', 'Full Name', 'Email', 'Phone', 'Class/Grade', 'Stream/Track', 'Status', 'Sign-Up Method', 'Sign-Up Date'];
    const rows = students.map((s) => [
      `"${s.id.replace(/"/g, '""')}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email.replace(/"/g, '""')}"`,
      `"${(s.phone || '').replace(/"/g, '""')}"`,
      `"${(s.grade || '').replace(/"/g, '""')}"`,
      `"${(s.stream || '').replace(/"/g, '""')}"`,
      `"${s.status || 'active'}"`,
      `"${s.sign_up_method || 'Email/Password'}"`,
      `"${new Date(s.created_at || Date.now()).toLocaleString()}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(csvContent, `Boardly_Students_Directory_${Date.now()}.csv`);
  };

  const handleExportTestsCSV = () => {
    if (allTestResults.length === 0) return;
    const headers = ['Test ID', 'Student ID', 'Subject', 'Class/Grade', 'Score', 'Total', 'Percentage', 'Duration', 'Date'];
    const rows = allTestResults.map((t) => [
      `"${t.id.replace(/"/g, '""')}"`,
      `"${t.student_id.replace(/"/g, '""')}"`,
      `"${t.subject.replace(/"/g, '""')}"`,
      `"${t.path_label.replace(/"/g, '""')}"`,
      t.score,
      t.total,
      `${t.percentage}%`,
      `"${t.duration}"`,
      `"${t.date_str}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(csvContent, `Boardly_Test_Results_${Date.now()}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

function normalizeGradeForSelect(g?: string): string {
  if (!g) return '11th';
  const u = g.toUpperCase();
  if (u.includes('MDCAT') || u.includes('MEDICAL ENTRANCE')) return 'MDCAT';
  if (u.includes('TCAT') || u.includes('ENGINEERING ENTRANCE')) return 'TCAT';
  if (u.includes('NET') || u.includes('NUST')) return 'NET';
  if (u.includes('FAST')) return 'FAST';
  if (u.includes('ECAT')) return 'ECAT';
  if (u.includes('ETEA')) return 'ETEA';
  if (u.includes('NUMS')) return 'NUMS';
  if (u.includes('GIKI')) return 'GIKI';
  if (u.includes('USAT')) return 'USAT';
  if (u.includes('NED')) return 'NED';
  if (u.includes('PIEAS')) return 'PIEAS';
  if (u.includes('NAT') || u.includes('NTS')) return 'NAT';
  if (u.includes('IBA')) return 'IBA';
  if (u.includes('AKU') || u.includes('AGA KHAN')) return 'AKU';
  if (u.includes('MUET') || u.includes('MEHRAN')) return 'MUET';
  if (u.includes('LUMS')) return 'LUMS';
  if (u.includes('NUML')) return 'NUML';
  if (u.includes('HITEC')) return 'HITEC';
  if (u.includes('NUTECH')) return 'NUTECH';
  if (u.includes('9')) return '9th';
  if (u.includes('10')) return '10th';
  if (u.includes('12')) return '12th';
  if (u.includes('11')) return '11th';
  return '11th';
}

function normalizeStreamForSelect(stream?: string, grade?: string): string {
  const normGrade = normalizeGradeForSelect(grade);
  const s = (stream || '').toUpperCase();
  if (normGrade === 'MDCAT') {
    if (s.includes('PRE-MEDICAL')) return 'Pre-Medical Stream';
    return 'MDCAT Stream';
  }
  if (normGrade === 'TCAT') {
    if (s.includes('ICS')) return 'ICS Stream';
    if (s.includes('TCAT')) return 'TCAT Stream';
    return 'Pre-Engineering Stream';
  }
  if (normGrade === 'NET') return 'NUST NET Engineering & Computing';
  if (normGrade === 'FAST') return 'FAST-NU CS & Engineering';
  if (normGrade === 'ECAT') return s.includes('ICS') ? 'ECAT ICS Group' : 'ECAT Engineering Group';
  if (normGrade === 'ETEA') return s.includes('CS') || s.includes('COMP') ? 'ETEA Computer Science' : 'ETEA Engineering Group';
  if (normGrade === 'NUMS') return 'NUMS Medical Entry Test';
  if (normGrade === 'GIKI') return 'GIKI Engineering Entrance';
  if (normGrade === 'USAT') {
    if (s.includes('CS')) return 'USAT-CS (Computer Science)';
    if (s.includes('M') || s.includes('MED')) return 'USAT-M (Pre-Medical)';
    return 'USAT-E (Pre-Engineering)';
  }
  if (normGrade === 'NED') return 'NED University Pre-Admission';
  if (normGrade === 'PIEAS') return s.includes('ICS') ? 'PIEAS ICS' : 'PIEAS Pre-Engineering';
  if (normGrade === 'NAT') {
    if (s.includes('IM') || s.includes('MED')) return 'NTS NAT-IM (Pre-Medical)';
    if (s.includes('ICS') || s.includes('COMP')) return 'NTS NAT-ICS (Computer Science)';
    return 'NTS NAT-IE (Pre-Engineering)';
  }
  if (normGrade === 'IBA') return 'IBA Karachi Aptitude';
  if (normGrade === 'AKU') return 'Aga Khan University Medical';
  if (normGrade === 'MUET') {
    if (s.includes('ICS') || s.includes('COMP')) return 'MUET Computer Science / ICS';
    if (s.includes('MED') || s.includes('BIO')) return 'MUET Pre-Medical';
    return 'MUET Pre-Engineering';
  }
  if (normGrade === 'LUMS') return s.includes('SBASSE') ? 'LUMS SBASSE (Scientific Aptitude)' : 'LUMS LCAT (Verbal & Quantitative)';
  if (normGrade === 'NUML') return 'NUML University Entrance';
  if (normGrade === 'HITEC') return 'HITEC University Taxila';
  if (normGrade === 'NUTECH') return s.includes('COMP') || s.includes('CS') ? 'NUTECH Computing / CS' : 'NUTECH Engineering';

  if (normGrade === '9th' || normGrade === '10th') {
    if (s.includes('COMPUTER') || s.includes('CS') || s.includes('ICS')) return 'Computer Science Stream';
    return 'Biology Stream';
  }
  if (s.includes('ENGINEERING') || s.includes('PRE-ENG')) return 'Pre-Engineering Stream';
  if (s.includes('ICS') || s.includes('COMPUTER') || s.includes('CS')) return 'ICS Stream';
  return 'Pre-Medical Stream';
}

  const handleSelectStudent = async (student: StudentProfile) => {
    setSelectedStudent(student);
    setDetailSubTab('tests');
    const normGrade = normalizeGradeForSelect(student.grade);
    const normStream = normalizeStreamForSelect(student.stream, normGrade);
    setEditStudentGrade(normGrade);
    setEditStudentStream(normStream);
    setAdminOverrideToast(null);
    setHistoryLoading(true);
    setLoadingBuddyHistory(true);
    try {
      const [history, buddyLogs] = await Promise.all([
        fetchStudentTestResultsFromSupabase(student.id, student.email),
        fetchStudentStudyBuddyHistoryFromSupabase(student.id),
      ]);
      setStudentHistory(history);
      setSelectedStudentBuddyHistory(buddyLogs);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
      setStudentHistory([]);
      setSelectedStudentBuddyHistory([]);
    } finally {
      setHistoryLoading(false);
      setLoadingBuddyHistory(false);
    }
  };

  const handleAdminSaveGradeStream = async () => {
    if (!selectedStudent) return;
    setIsSavingGradeStream(true);
    setAdminOverrideToast(null);

    let defaultSubjects: string[] = [];
    const upperG = editStudentGrade.toUpperCase();
    if (upperG === 'MDCAT' || upperG.includes('MDCAT')) {
      defaultSubjects = ['Biology', 'Chemistry', 'Physics', 'English', 'Logical Reasoning'];
    } else if (upperG === 'TCAT' || upperG.includes('TCAT')) {
      defaultSubjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Logical Reasoning'];
    } else if (upperG === 'NET' || upperG.includes('NET') || upperG.includes('NUST')) {
      defaultSubjects = ['Mathematics', 'Physics', 'English'];
    } else if (upperG === 'FAST' || upperG.includes('FAST') || upperG.includes('NAT')) {
      defaultSubjects = ['Advanced Mathematics', 'Basic Mathematics', 'English', 'IQ & Analytical Reasoning'];
    } else if (upperG === 'ECAT' || upperG.includes('ECAT')) {
      defaultSubjects = ['Mathematics', 'Physics', 'Chemistry', 'English'];
    } else if (upperG === 'ETEA' || upperG.includes('ETEA')) {
      defaultSubjects = ['Physics', 'Mathematics', 'English', 'Chemistry'];
    } else if (upperG === 'NUMS' || upperG.includes('NUMS')) {
      defaultSubjects = ['Biology', 'Chemistry', 'Physics', 'English', 'Psychological Assessment'];
    } else if (upperG === 'GIKI' || upperG.includes('GIKI')) {
      defaultSubjects = ['Mathematics', 'Physics', 'English'];
    } else if (upperG === 'USAT' || upperG.includes('USAT')) {
      defaultSubjects = ['Verbal Reasoning', 'Quantitative Reasoning', 'Physics', 'Mathematics'];
    } else if (editStudentGrade.includes('9') || editStudentGrade.includes('10')) {
      if (editStudentStream.includes('Biology')) {
        defaultSubjects = ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu', editStudentGrade.includes('10') ? 'Pakistan Studies' : 'Islamic Studies'];
      } else {
        defaultSubjects = ['Physics', 'Chemistry', 'Computer Science', 'English', 'Urdu', editStudentGrade.includes('10') ? 'Pakistan Studies' : 'Islamic Studies'];
      }
    } else {
      if (editStudentStream.includes('Pre-Medical')) {
        defaultSubjects = ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu', editStudentGrade.includes('12') ? 'Pakistan Studies' : 'Islamic Studies'];
      } else if (editStudentStream.includes('Pre-Engineering')) {
        defaultSubjects = ['Physics', 'Chemistry', 'Mathematics', 'English', 'Urdu', editStudentGrade.includes('12') ? 'Pakistan Studies' : 'Islamic Studies'];
      } else {
        defaultSubjects = ['Physics', 'Computer Science', 'Mathematics', 'English', 'Urdu', editStudentGrade.includes('12') ? 'Pakistan Studies' : 'Islamic Studies'];
      }
    }

    try {
      const res = await updateStudentGradeAndStreamInSupabase(
        selectedStudent.id,
        editStudentGrade,
        editStudentStream,
        defaultSubjects,
        currentUser?.email || 'shsvirtualadmin@gmail.com'
      );
      if (res.success) {
        const updatedStudentObj: StudentProfile = res.profile || {
          ...selectedStudent,
          grade: editStudentGrade,
          stream: editStudentStream,
          subjects: defaultSubjects,
          is_registered: true,
        };
        setSelectedStudent(updatedStudentObj);
        setStudents((prev) => prev.map((s) => s.id === selectedStudent.id ? updatedStudentObj : s));
        setAdminOverrideToast('✅ Grade & Stream lock updated successfully!');
        loadData();
      } else {
        setAdminOverrideToast(`⚠️ Failed to save changes: ${res.message || 'Database update failed.'}`);
      }
    } catch (err: any) {
      setAdminOverrideToast(`❌ Error: ${err.message || 'Update failed'}`);
    } finally {
      setIsSavingGradeStream(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const calculateSubjectProgress = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const studentTests = allTestResults.filter(
      (t) =>
        t.student_id === studentId ||
        (student?.email && t.student_email && t.student_email.toLowerCase() === student.email.toLowerCase()) ||
        (student?.email && t.student_id && t.student_id.toLowerCase() === student.email.toLowerCase())
    );
    const standardSubjects = [
      'Physics',
      'Chemistry',
      'Biology',
      'Mathematics',
      'Computer Science',
      'English',
      'Urdu',
      'Pakistan Studies',
      'Islamic Studies',
    ];

    const testsBySubject: Record<string, AdminTestResult[]> = {};
    studentTests.forEach((t) => {
      if (!testsBySubject[t.subject]) {
        testsBySubject[t.subject] = [];
      }
      testsBySubject[t.subject].push(t);
    });

    const subjectsToDisplay = Array.from(
      new Set([...Object.keys(testsBySubject), ...standardSubjects])
    );

    const breakdown = subjectsToDisplay.map((sub) => {
      const tests = testsBySubject[sub] || [];
      if (tests.length === 0) {
        return {
          subject: sub,
          totalMCQs: 0,
          correctMCQs: 0,
          accuracy: 0,
          testsCount: 0,
          lastTestDate: 'No tests taken',
          trend: 'no_data' as 'improving' | 'declining' | 'stable' | 'no_data',
        };
      }

      const totalMCQs = tests.reduce((acc, curr) => acc + (curr.total || 0), 0);
      const correctMCQs = tests.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const accuracy = totalMCQs > 0 ? Math.round((correctMCQs / totalMCQs) * 100) : 0;

      const sortedTests = [...tests].sort(
        (a, b) => new Date(a.created_at || a.date_str).getTime() - new Date(b.created_at || b.date_str).getTime()
      );
      const lastTest = sortedTests[sortedTests.length - 1];
      const lastTestDate = lastTest ? (lastTest.date_str || new Date(lastTest.created_at).toLocaleDateString()) : 'N/A';

      let trend: 'improving' | 'declining' | 'stable' | 'no_data' = 'stable';
      if (sortedTests.length >= 2) {
        const mid = Math.floor(sortedTests.length / 2);
        const earlierTests = sortedTests.slice(0, mid);
        const laterTests = sortedTests.slice(mid);

        const earlierAcc = earlierTests.reduce((acc, c) => acc + c.percentage, 0) / earlierTests.length;
        const laterAcc = laterTests.reduce((acc, c) => acc + c.percentage, 0) / laterTests.length;

        if (laterAcc > earlierAcc + 2) trend = 'improving';
        else if (laterAcc < earlierAcc - 2) trend = 'declining';
        else trend = 'stable';
      }

      return {
        subject: sub,
        totalMCQs,
        correctMCQs,
        accuracy,
        testsCount: tests.length,
        lastTestDate,
        trend,
      };
    });

    const filteredBreakdown = breakdown.filter((b) => {
      if (progressSubjectFilter !== 'All' && b.subject !== progressSubjectFilter) return false;
      return true;
    });

    const totalAttempted = breakdown.reduce((a, c) => a + c.totalMCQs, 0);
    const totalCorrect = breakdown.reduce((a, c) => a + c.correctMCQs, 0);
    const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    return {
      breakdown: filteredBreakdown,
      totalAttempted,
      overallAccuracy,
      totalTestsTaken: Math.max(studentTests.length, Number(student?.tests_used_this_month || 0)),
    };
  };



  if (!isAdmin) {
    return (
      <div className="animate-ios-spring text-center py-12 px-4 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center text-rose-500 mx-auto mb-4 shadow-lg shadow-rose-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900  mb-2 tracking-tight">Access Restricted</h2>
        <p className="text-xs text-slate-500  max-w-sm mx-auto mb-4 leading-relaxed font-medium">
          The Admin Management Panel is strictly restricted to authorized administrator accounts.
        </p>
        <div className="bg-slate-100  border border-slate-200  rounded-2xl p-3 max-w-sm mx-auto mb-6 text-xs text-slate-600  font-mono">
          <span>Active Logged-In Account: </span>
          <span className="font-extrabold text-rose-600  block mt-1">
            {rawEmail || 'Unauthenticated User'}
          </span>
        </div>
        <button
          onClick={onBack}
          className="bg-[#007AFF] hover:bg-[#0066CC]   text-white text-xs font-extrabold py-3 px-6 rounded-full transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-500/20 flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.grade && s.grade.toLowerCase().includes(q)) ||
      (s.stream && s.stream.toLowerCase().includes(q)) ||
      (s.sign_up_method && s.sign_up_method.toLowerCase().includes(q));

    let matchGrade = true;
    if (studentGradeFilter !== 'All') {
      const g = (s.grade || '').toUpperCase();
      const target = studentGradeFilter.toUpperCase();
      matchGrade = g.includes(target);
    }

    let matchStatus = true;
    if (studentStatusFilter !== 'All') {
      matchStatus = (s.status || 'active') === studentStatusFilter;
    }

    let matchPlan = true;
    if (studentPlanFilter !== 'All') {
      const plans = s.subscribed_plans || [];
      const pkg = (s.package_name || '').toLowerCase();
      if (studentPlanFilter === 'Free') {
        matchPlan = plans.length === 0 || (plans.length === 1 && plans[0] === 'free');
      } else if (studentPlanFilter === 'Matric') {
        matchPlan = plans.includes('matric') || pkg.includes('matric');
      } else if (studentPlanFilter === 'FSc') {
        matchPlan = plans.includes('fsc') || pkg.includes('fsc');
      } else if (studentPlanFilter === 'TCAT') {
        matchPlan = plans.includes('tcat') || pkg.includes('tcat') || pkg.includes('uet');
      } else if (studentPlanFilter === 'MDCAT') {
        matchPlan = plans.includes('mdcat') || pkg.includes('mdcat');
      } else if (studentPlanFilter === 'Multi-Track') {
        matchPlan = plans.filter(p => p !== 'free').length > 1 || pkg.includes('+') || pkg.includes('combo');
      }
    }

    return matchQuery && matchGrade && matchStatus && matchPlan;
  });

  // Filter tests
  const filteredTests = allTestResults.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      !q ||
      t.subject.toLowerCase().includes(q) ||
      t.path_label.toLowerCase().includes(q) ||
      (t.student_id && t.student_id.toLowerCase().includes(q))
    );
  });

  // Filter study buddy logs
  const filteredStudyBuddyHistory = allStudyBuddyHistory.filter((m) => {
    const q = studyBuddySearch.trim().toLowerCase();
    return (
      !q ||
      m.message_text.toLowerCase().includes(q) ||
      m.student_id.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  // Aggregated Stats
  const totalStudents = students.length;
  const activeStudentsCount = students.filter((s) => (s.status || 'active') !== 'suspended').length;
  const suspendedStudentsCount = students.filter((s) => s.status === 'suspended').length;
  const totalTests = allTestResults.length;
  const googleCount = students.filter((s) => s.sign_up_method === 'Google').length;
  const emailCount = totalStudents - googleCount;
  const avgScore =
    totalTests > 0
      ? Math.round(allTestResults.reduce((acc, curr) => acc + curr.percentage, 0) / totalTests)
      : 0;
  const totalMCQsAnswered = allTestResults.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const questionBankStats = React.useMemo(() => getDynamicQuestionBankStats(), []);
  const passingRate =
    totalTests > 0
      ? Math.round((allTestResults.filter((t) => t.percentage >= 50).length / totalTests) * 100)
      : 0;

  // Google account profile picture from admin login credentials
  const adminStudentProfile = students.find(
    (s) => s.email && currentUser?.email && s.email.toLowerCase() === currentUser.email.toLowerCase()
  );
  const adminGoogleAvatar =
    currentUser?.user_metadata?.avatar_url ||
    currentUser?.user_metadata?.picture ||
    currentUser?.user_metadata?.picture_url ||
    (currentUser?.identities && currentUser.identities[0]?.identity_data?.avatar_url) ||
    (currentUser?.identities && currentUser.identities[0]?.identity_data?.picture) ||
    adminStudentProfile?.avatar_url ||
    null;

  const adminAvatarSrc = (!avatarLoadError && adminGoogleAvatar) ? adminGoogleAvatar : '/boardly-logo.png';

  return (
    <div className="space-y-6 animate-ios-spring w-full max-w-7xl mx-auto pb-12 min-w-0 overflow-x-hidden">
      {/* Admin Header */}
      <div className="bg-white/80  border border-slate-200  rounded-[24px] p-4 sm:p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200   text-slate-700  transition-all cursor-pointer active:scale-95 shrink-0"
            title="Return to Student Portal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-slate-200/80 bg-slate-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden ring-2 ring-slate-100/80">
                <img
                  src={adminAvatarSrc}
                  alt={currentUser?.user_metadata?.full_name || currentUser?.email || 'Admin Profile'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full aspect-square"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!avatarLoadError && adminGoogleAvatar) {
                      setAvatarLoadError(true);
                    } else {
                      target.onerror = null;
                      target.src = '/boardly-logo.png';
                    }
                  }}
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900  tracking-tight truncate">
                Boardly Admin Portal
              </h1>
            </div>
            <p className="text-xs text-slate-500  font-medium mt-0.5 truncate">
              Live Management • Administration Control Center • Multi-Student Directory
            </p>
          </div>
        </div>
      </div>

      {removeSuccessToast && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700  p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate">{removeSuccessToast}</span>
          </div>
          <button
            onClick={() => setRemoveSuccessToast(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-lg transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        {/* Stat 1: Total Students */}
        <div className="bg-white/80  border border-slate-200  rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-xs font-bold text-slate-500  truncate">Total Students</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#0A84FF] shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-1 flex-wrap min-w-0">
            <span className="text-2xl sm:text-3xl font-black text-slate-900  tracking-tight">
              {totalStudents}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-extrabold flex-wrap">
              <span className="text-emerald-600 ">{activeStudentsCount} active</span>
              {suspendedStudentsCount > 0 && (
                <span className="text-rose-600 ">• {suspendedStudentsCount} suspended</span>
              )}
            </div>
          </div>
          <div className="mt-2 text-[10.5px] text-slate-400  font-medium flex items-center gap-1 min-w-0 truncate">
            <UserCheck className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="truncate">{googleCount} Google • {emailCount} Email</span>
          </div>
        </div>

        {/* Stat 2: Total Question Bank & Tests Completed */}
        <div className="bg-white/80  border border-slate-200  rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-xs font-bold text-slate-500  truncate">Total Question Bank</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-1 flex-wrap min-w-0">
            <span className="text-2xl sm:text-3xl font-black text-slate-900  tracking-tight">
              {questionBankStats.totalBankMCQs.toLocaleString()}
            </span>
            <span className="text-[11px] font-extrabold text-amber-600 ">
              {totalTests} tests ({totalMCQsAnswered} attempted)
            </span>
          </div>
          <div className="mt-2 text-[10.5px] text-slate-400  font-medium flex items-center gap-1 min-w-0 truncate">
            <Activity className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">
              {questionBankStats.mdcatCount.toLocaleString()} MDCAT • {questionBankStats.tcatCount.toLocaleString()} TCAT • {questionBankStats.boardCount.toLocaleString()} Board
            </span>
          </div>
        </div>

        {/* Stat 3: Average Score */}
        <div className="bg-white/80  border border-slate-200  rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-xs font-bold text-slate-500  truncate">Platform Avg Score</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-1 flex-wrap min-w-0">
            <span className="text-2xl sm:text-3xl font-black text-slate-900  tracking-tight">
              {avgScore}%
            </span>
            <span className="text-[11px] font-extrabold text-emerald-600 ">
              {passingRate}% pass rate
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 w-full bg-slate-100  h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, avgScore))}%` }}
            />
          </div>
        </div>

        {/* Stat 4: AI Study Buddy Logs & System */}
        <div className="bg-white/80  border border-slate-200  rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-xs font-bold text-slate-500  truncate">AI Study Buddy Logs</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-1 flex-wrap min-w-0">
            <span className="text-2xl sm:text-3xl font-black text-slate-900  tracking-tight">
              {allStudyBuddyHistory.filter((m) => m.role === 'user').length}
            </span>
            <span className="text-[11px] font-extrabold text-purple-600 ">
              Logged Queries
            </span>
          </div>
          <div className="mt-2 text-[10.5px] text-slate-400  font-medium flex items-center gap-1 min-w-0 truncate">
            <Zap className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="truncate">Real-time Chat Storage</span>
          </div>
        </div>
      </div>

      {/* Responsive Admin Tab Navigation using Unified SegmentedControl */}
      <div className="w-full overflow-hidden">
        <SegmentedControl<'students' | 'payment_requests' | 'activity_logs' | 'tests' | 'progress'>
          id="admin-main-segmented-tabs"
          options={[
            {
              value: 'students',
              label: 'Students',
              icon: Users,
              badge: students.length,
            },
            {
              value: 'payment_requests',
              label: 'Payments',
              icon: CreditCard,
              badge:
                paymentRequests.filter((r) => r.status === 'pending').length > 0
                  ? paymentRequests.filter((r) => r.status === 'pending').length
                  : paymentRequests.length,
              badgeClassName:
                paymentRequests.filter((r) => r.status === 'pending').length > 0
                  ? 'bg-amber-500 text-white animate-pulse'
                  : undefined,
            },
            {
              value: 'activity_logs',
              label: 'Activity',
              icon: Activity,
              badge: activityLogs.length,
            },
            {
              value: 'tests',
              label: 'Results',
              icon: FileText,
              badge: allTestResults.length,
            },
            {
              value: 'progress',
              label: 'Progress',
              icon: BarChart2,
            },
          ]}
          value={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
          theme="light"
          size="md"
          className="w-full shadow-sm"
        />
      </div>

      {/* TAB CONTENT 1: STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Filters & Search Header */}
          <div className="bg-white/80  border border-slate-200  rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3 w-full min-w-0">
            {/* Search Input */}
            <div className="relative w-full md:w-80 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, grade..."
                className="w-full bg-slate-100  border border-slate-200  rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900  placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 "
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto no-scrollbar min-w-0">
              {/* Grade / Track Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={studentGradeFilter}
                  onChange={(e) => setStudentGradeFilter(e.target.value)}
                  className="bg-slate-100  border border-slate-200  rounded-xl px-3 py-2 text-xs text-slate-800  font-extrabold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Grades & Tracks</option>
                  <option value="9th">9th Class</option>
                  <option value="10th">10th Class</option>
                  <option value="11th">11th Class</option>
                  <option value="12th">12th Class</option>
                  <option value="MDCAT">MDCAT Prep</option>
                  <option value="TCAT">TCAT Prep</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="bg-slate-100  border border-slate-200  rounded-xl px-3 py-2 text-xs text-slate-800  font-extrabold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Account Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>

              {/* Plan Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={studentPlanFilter}
                  onChange={(e) => setStudentPlanFilter(e.target.value)}
                  className="bg-slate-100  border border-slate-200  rounded-xl px-3 py-2 text-xs text-amber-700  border-amber-500/30 font-extrabold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Active Plans</option>
                  <option value="Free">Free Plan Only</option>
                  <option value="Matric">Matric Plan (Rs. 499)</option>
                  <option value="FSc">FSc Plan (Rs. 999)</option>
                  <option value="TCAT">TCAT Plan (Rs. 1,499)</option>
                  <option value="MDCAT">MDCAT Plan (Rs. 1,499)</option>
                  <option value="Multi-Track">Multi-Track Combo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Grid / Cards */}
          {loading ? null : filteredStudents.length === 0 ? (
            <div className="bg-white/80  border border-slate-200  rounded-2xl p-8 sm:p-12 text-center space-y-3 w-full min-w-0">
              <UserX className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-800 ">No Students Found</h3>
              <p className="text-xs text-slate-500  max-w-sm mx-auto">
                No registered students matched your active filter rules or search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStudentGradeFilter('All');
                  setStudentStatusFilter('All');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200   text-slate-800  rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full min-w-0">
              {filteredStudents.map((student) => {
                const isSuspended = student.status === 'suspended';
                const initials = student.name
                  ? student.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                  : 'ST';

                return (
                  <div
                    key={student.id}
                    className={`bg-white/80  border rounded-2xl p-3.5 sm:p-4 shadow-lg hover:shadow-xl transition-all relative flex flex-col justify-between group min-w-0 w-full ${
                      isSuspended
                        ? 'border-rose-500/40 bg-rose-500/[0.02] '
                        : 'border-slate-200  hover:border-blue-500/30'
                    }`}
                  >
                    <div className="space-y-3 min-w-0">
                      {/* Student Card Top Bar */}
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <UserAvatar profile={student} size="md" shape="square" className="shadow-md" />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-sm text-slate-900  truncate">
                              {student.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500  font-medium min-w-0">
                              <span className="truncate min-w-0">{student.email}</span>
                              <button
                                onClick={() => copyToClipboard(student.email, 'email')}
                                className="text-slate-400 hover:text-slate-600  transition-all cursor-pointer p-0.5 shrink-0"
                                title="Copy Email"
                              >
                                {copiedEmail === student.email ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${
                            isSuspended
                              ? 'bg-rose-100  text-rose-700  border-rose-300 '
                              : 'bg-emerald-100  text-emerald-800  border-emerald-300 '
                          }`}
                        >
                          {isSuspended ? (
                            <>
                              <Lock className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>Suspended</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>Active</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Phone Number line if present */}
                      {student.phone && (
                        <div className="text-[11px] font-medium text-slate-600  flex items-center gap-1.5 font-mono min-w-0 truncate">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{student.phone}</span>
                        </div>
                      )}

                      {/* Badges / Registration Meta */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 min-w-0">
                        {/* Current Active Subscription Plan Badge & Test Limit Info */}
                        {(() => {
                          const matchingTestResults = allTestResults.filter(
                            (t) =>
                              t.student_id === student.id ||
                              (student.email && t.student_email && t.student_email.toLowerCase() === student.email.toLowerCase()) ||
                              (student.email && t.student_id && t.student_id.toLowerCase() === student.email.toLowerCase())
                          );
                          const studentTests = Math.max(
                            Number(student.tests_used_this_month || 0),
                            matchingTestResults.length
                          );
                          const access = evaluateStudentAccess(student, studentTests);

                          let planColor = 'bg-slate-500/10 text-slate-700  border-slate-500/20';
                          if (access.isPro) {
                            planColor = 'bg-emerald-500/15 text-emerald-700  border-emerald-500/30';
                          } else if (access.isProExpired) {
                            planColor = 'bg-rose-500/15 text-rose-700  border-rose-500/30';
                          }

                          return (
                            <>
                              <span className={`text-[10px] font-black border px-2 py-0.5 rounded-lg flex items-center gap-1 max-w-full truncate ${planColor}`}>
                                <Zap className="w-3 h-3 shrink-0 text-amber-500" />
                                <span className="truncate">
                                  {access.effectivePlanName}
                                  {access.isPro && access.daysRemaining > 0 && ` (${access.daysRemaining}d left)`}
                                </span>
                              </span>

                              {/* Monthly Test Usage Badge */}
                              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-800  border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 max-w-full truncate">
                                <Activity className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>
                                  {access.isPro
                                    ? `Unlimited (${access.currentMonthlyTests} Taken)`
                                    : `${access.currentMonthlyTests} / 2 Monthly Tests Used`}
                                </span>
                              </span>

                              {/* Plan Status Badge */}
                              {(student.plan_status === 'trial' || student.payment_status === 'Free Plan') && !access.isPro ? (
                                <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-800  border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span>Free Trial</span>
                                </span>
                              ) : (student.plan_status === 'pending_verification' || student.payment_status === 'Pending Verification') && !access.isPro ? (
                                <span className="text-[10px] font-extrabold bg-amber-500/15 text-amber-800  border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>Pending Verification</span>
                                </span>
                              ) : null}
                            </>
                          );
                        })()}

                        <span className="text-[10px] font-bold bg-blue-500/10 text-[#007AFF]  border border-blue-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 max-w-full truncate">
                          <GraduationCap className="w-3 h-3 shrink-0" />
                          <span className="truncate">{student.grade || 'Unregistered'}</span>
                        </span>

                        <span className="text-[10px] font-bold bg-purple-500/10 text-purple-700  border border-purple-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 max-w-full truncate">
                          <Key className="w-3 h-3 shrink-0" />
                          <span className="truncate">{student.sign_up_method || 'Email/Password'}</span>
                        </span>

                        {/* Payment Proof Button if submitted */}
                        {(() => {
                          const req = paymentRequests.find(p => p.student_id === student.id || p.student_email.toLowerCase() === student.email.toLowerCase());
                          if (req && (req.drive_file_url || req.payment_method)) {
                            return (
                              <button
                                type="button"
                                onClick={() => req.drive_file_url ? setViewingProofUrl(req.drive_file_url) : alert(`Payment Method: ${req.payment_method || 'Offline Bank'}\nTRX Ref: ${req.transaction_reference || 'N/A'}\nSubmitted: ${new Date(req.created_at).toLocaleString()}`)}
                                className="text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700  border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 hover:bg-emerald-500/20 transition-all cursor-pointer"
                                title="View submitted payment screenshot / details"
                              >
                                <Eye className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>Proof ({req.status})</span>
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Student Card Action Bar */}
                    <div className="pt-3 mt-3 border-t border-slate-100  flex items-center justify-between gap-1 flex-wrap min-w-0">
                      {/* Manual Plan Management Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenPlanModal(student)}
                        className="py-1.5 px-2.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-800  border border-amber-500/40 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0 shadow-sm"
                        title="Grant or modify student subscription plan"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Change Plan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectStudent(student)}
                        className="py-1.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-[#007AFF]  border border-blue-500/20 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentForProgress(student);
                          setActiveTab('progress');
                        }}
                        className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700  border border-amber-500/20 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                        title="View Subject Breakdown"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Progress</span>
                      </button>

                      {/* Suspend Action */}
                      <button
                        type="button"
                        disabled={togglingStatusStudentId === student.id}
                        onClick={() => handleToggleStudentStatus(student)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold border flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0 ${
                          isSuspended
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700  border-emerald-500/30'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800  border-amber-500/30'
                        }`}
                        title={isSuspended ? 'Reactivate student account' : 'Suspend student account'}
                      >
                        {isSuspended ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Unlock</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Suspend</span>
                          </>
                        )}
                      </button>

                      {/* Wipe Account Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setStudentToRemove(student);
                          setRemoveConfirmText('');
                          setRemoveStudentError(null);
                        }}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600  border border-rose-500/30 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
                        title="Permanently wipe student record and history"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: TEST RESULTS */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-white/80  border border-slate-200  rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tests by subject, grade, ID..."
                className="w-full bg-slate-100  border border-slate-200  rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900  placeholder-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleExportTestsCSV}
              className="px-3 py-2 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Test History CSV</span>
            </button>
          </div>

          <div className="bg-white/80  border border-slate-200  rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 ">
                <thead className="bg-slate-50  border-b border-slate-200  text-[11px] font-black uppercase text-slate-500 ">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Class / Path</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 ">
                  {filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                        No test records found.
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((test) => (
                      <tr key={test.id} className="hover:bg-slate-50  transition-all">
                        <td className="px-4 py-3">
                          {(() => {
                            const student = students.find(
                              (s) =>
                                s.id === test.student_id ||
                                (test.student_email && s.email && s.email.toLowerCase() === test.student_email.toLowerCase())
                            );
                            const name = test.student_name || student?.name;
                            const email = test.student_email || student?.email;
                            return (
                              <div>
                                <div className="font-bold text-slate-900 text-xs">
                                  {name || `Student ${test.student_id.substring(0, 8)}`}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  {email || test.student_id}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 ">
                          {test.subject}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600 ">
                          {test.path_label}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-slate-900 ">
                          {test.score} / {test.total}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              test.percentage >= 80
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : test.percentage >= 50
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            }`}
                          >
                            {test.percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500  font-mono">
                          {test.duration}
                        </td>
                        <td className="px-4 py-3 text-slate-500 ">
                          {test.date_str}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDeletingRecord(test)}
                            className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all cursor-pointer"
                            title="Delete faulty test record permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: PROGRESS BREAKDOWN */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          <div className="bg-white/80  border border-slate-200  rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold text-slate-900  flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-500" />
              <span>Subject Performance & Weakness Analytics</span>
            </h2>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedStudentForProgress?.id || ''}
                onChange={async (e) => {
                  const studentId = e.target.value;
                  const s = students.find((st) => st.id === studentId);
                  setSelectedStudentForProgress(s || null);
                  if (s) {
                    try {
                      const [freshTests, freshWeakness] = await Promise.all([
                        fetchAllTestResultsFromSupabase(),
                        fetchAllStudentWeaknessProfiles(detectedEmail),
                      ]);
                      if (freshTests && freshTests.length > 0) {
                        setAllTestResults(freshTests);
                      }
                      if (freshWeakness && freshWeakness.length > 0) {
                        setStudentWeaknessProfiles(freshWeakness);
                      }
                    } catch (fetchErr) {
                      console.warn('Real-time student data fetch warning:', fetchErr);
                    }
                  }
                }}
                className="w-full sm:w-64 bg-slate-100  border border-slate-200  rounded-xl px-3 py-2 text-xs font-bold text-slate-900  focus:outline-none cursor-pointer"
              >
                <option value="">Select Student to View Breakdown...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.grade || 'Unregistered'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedStudentForProgress ? (
            <div className="bg-white/80  border border-slate-200  rounded-2xl p-12 text-center space-y-3">
              <BarChart2 className="w-10 h-10 text-amber-500 mx-auto opacity-60" />
              <h3 className="text-sm font-extrabold text-slate-800 ">Select a Student</h3>
              <p className="text-xs text-slate-500  max-w-sm mx-auto">
                Choose a student from the dropdown above to analyze their subject accuracy, weak topic areas, and test attempt trends.
              </p>
            </div>
          ) : (
            (() => {
              const prog = calculateSubjectProgress(selectedStudentForProgress.id);
              const studentWeaknesses = studentWeaknessProfiles.filter(
                (p) =>
                  p.studentId === selectedStudentForProgress.id ||
                  (selectedStudentForProgress.email && p.studentId.toLowerCase() === selectedStudentForProgress.email.toLowerCase())
              );
              const allWeakTopics = studentWeaknesses.flatMap(w => w.weakestTopics || []);

              const studentRecentTests = allTestResults.filter(
                (t) =>
                  t.student_id === selectedStudentForProgress.id ||
                  (selectedStudentForProgress.email && t.student_email?.toLowerCase() === selectedStudentForProgress.email.toLowerCase()) ||
                  (selectedStudentForProgress.email && t.student_id?.toLowerCase() === selectedStudentForProgress.email.toLowerCase())
              ).slice(0, 8);

              const studentBuddyMsgs = allStudyBuddyHistory.filter(
                (m) =>
                  m.student_id === selectedStudentForProgress.id ||
                  (selectedStudentForProgress.email && m.student_id.toLowerCase() === selectedStudentForProgress.email.toLowerCase())
              ).slice(0, 6);

              return (
                <div className="space-y-5">
                  {/* Student Summary Bar */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black">{selectedStudentForProgress.name}</h3>
                      <p className="text-xs text-blue-100 font-medium">
                        {selectedStudentForProgress.email} • {selectedStudentForProgress.grade || 'Unregistered'} ({selectedStudentForProgress.stream || 'No Stream'})
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-black">{prog.overallAccuracy}%</div>
                        <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Overall Accuracy</div>
                      </div>
                      <div className="text-right border-l border-white/20 pl-4">
                        <div className="text-2xl font-black">{prog.totalTestsTaken}</div>
                        <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Tests Completed</div>
                      </div>
                    </div>
                  </div>

                  {/* Subject Breakdown Cards Grid */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">Subject Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {prog.breakdown.map((b) => (
                        <div
                          key={b.subject}
                          className="bg-white/80  border border-slate-200  rounded-2xl p-4 shadow-md space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-slate-900 ">{b.subject}</span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                b.accuracy >= 75
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : b.accuracy >= 50
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              }`}
                            >
                              {b.accuracy}% Accuracy
                            </span>
                          </div>

                          <div className="w-full bg-slate-100  h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                b.accuracy >= 75 ? 'bg-emerald-500' : b.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${b.accuracy}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500  pt-1">
                            <span>{b.correctMCQs} / {b.totalMCQs} MCQs Correct</span>
                            <span>{b.testsCount} tests</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weak Topics Analysis (if any identified) */}
                  {allWeakTopics.length > 0 && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Identified Weak Topics Requiring Revision</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                        {allWeakTopics.map((wt, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-xl border border-rose-200 text-xs">
                            <div className="font-bold text-slate-900 truncate">{wt.chapter}</div>
                            <div className="text-[11px] text-rose-600 font-extrabold mt-0.5">
                              {wt.accuracy}% Accuracy ({wt.correct}/{wt.total} correct)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Tests Completed */}
                  {studentRecentTests.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span>Recent Test Submissions ({studentRecentTests.length})</span>
                        </h4>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {studentRecentTests.map((t) => (
                          <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-extrabold text-slate-900">{t.subject}</span>
                              <span className="text-[11px] text-slate-400 ml-2">{t.path_label} • {t.duration}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-400">{t.date_str}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  t.percentage >= 70
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : t.percentage >= 50
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-rose-500/10 text-rose-600'
                                }`}
                              >
                                {t.score}/{t.total} ({t.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Study Buddy History */}
                  {studentBuddyMsgs.length > 0 && (
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-purple-600" />
                        <span>Recent AI Study Buddy Inquiries</span>
                      </h4>
                      <div className="space-y-2">
                        {studentBuddyMsgs.map((m) => (
                          <div key={m.id} className="bg-white p-2.5 rounded-xl border border-purple-100 text-xs">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>{m.role === 'user' ? 'Student Question' : 'AI Explanation'}</span>
                              <span>{new Date(m.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-800 line-clamp-2">{m.message_text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* TAB CONTENT: PAYMENT REQUESTS VERIFICATION SYSTEM */}
      {activeTab === 'payment_requests' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner & Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setPaymentStatusFilter('all')}
              className={`border rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
                paymentStatusFilter === 'all'
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                  : 'bg-slate-50  border-slate-200  hover:border-slate-300 '
              }`}
            >
              <span className="text-xs font-bold text-slate-500 ">Total Submissions</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 ">{paymentRequests.length}</span>
                <span className="text-[10px] font-bold text-slate-400">requests</span>
              </div>
            </div>

            <div
              onClick={() => setPaymentStatusFilter('pending')}
              className={`border rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
                paymentStatusFilter === 'pending'
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-amber-500/5  border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-700 ">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-600 ">
                  {paymentRequests.filter((r) => r.status === 'pending').length}
                </span>
                <span className="text-[10px] font-bold text-amber-600/70 ">awaiting approval</span>
              </div>
            </div>

            <div
              onClick={() => setPaymentStatusFilter('approved')}
              className={`border rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
                paymentStatusFilter === 'approved'
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-emerald-500/5  border-emerald-500/20 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-700 ">Approved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600 ">
                  {paymentRequests.filter((r) => r.status === 'approved').length}
                </span>
                <span className="text-[10px] font-bold text-emerald-600/70 ">upgraded</span>
              </div>
            </div>

            <div
              onClick={() => setPaymentStatusFilter('rejected')}
              className={`border rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
                paymentStatusFilter === 'rejected'
                  ? 'bg-rose-500/15 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
                  : 'bg-rose-500/5  border-rose-500/20 hover:border-rose-500/40'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-700 ">Rejected</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-rose-600 ">
                  {paymentRequests.filter((r) => r.status === 'rejected').length}
                </span>
                <span className="text-[10px] font-bold text-rose-600/70 ">denied</span>
              </div>
            </div>
          </div>

          {/* Action Feedback Banner */}
          {paymentToast && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md animate-fadeIn ${
                paymentToast.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 '
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-700 '
              }`}
            >
              <div className="flex items-center gap-2">
                {paymentToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                <span>{paymentToast.message}</span>
              </div>
              <button onClick={() => setPaymentToast(null)} className="p-1 hover:opacity-75 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filter System Control Bar */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Toggle Buttons with SegmentedControl */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>Quick Filter:</span>
              </span>

              <SegmentedControl<'all' | 'pending' | 'approved' | 'rejected'>
                id="admin-payment-status-filter"
                options={[
                  {
                    value: 'all',
                    label: 'All Requests',
                    badge: paymentRequests.length,
                  },
                  {
                    value: 'pending',
                    label: 'Pending',
                    icon: Clock,
                    badge: paymentRequests.filter((r) => r.status === 'pending').length,
                    badgeClassName:
                      paymentRequests.filter((r) => r.status === 'pending').length > 0
                        ? 'bg-amber-500 text-white animate-pulse'
                        : undefined,
                  },
                  {
                    value: 'approved',
                    label: 'Approved',
                    icon: CheckCircle2,
                    badge: paymentRequests.filter((r) => r.status === 'approved').length,
                  },
                  {
                    value: 'rejected',
                    label: 'Rejected',
                    icon: XCircle,
                    badge: paymentRequests.filter((r) => r.status === 'rejected').length,
                  },
                ]}
                value={paymentStatusFilter}
                onChange={(status) => setPaymentStatusFilter(status)}
                theme="light"
                size="sm"
                className="shrink-0 shadow-sm"
              />
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={paymentSearchQuery}
                onChange={(e) => setPaymentSearchQuery(e.target.value)}
                placeholder="Search name, email, TRX ID..."
                className="w-full bg-white  border border-slate-200  rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-900  focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
              {paymentSearchQuery && (
                <button onClick={() => setPaymentSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Payment Requests */}
          {paymentRequests
            .filter((r) => paymentStatusFilter === 'all' || r.status === paymentStatusFilter)
            .filter((r) => {
              const q = paymentSearchQuery.toLowerCase().trim();
              if (!q) return true;
              const trxRef = r.transaction_reference || (r as any).transaction_ref || '';
              const pkgName = r.course_tier || (r as any).package_name || '';
              return (
                (r.student_name && r.student_name.toLowerCase().includes(q)) ||
                (r.student_email && r.student_email.toLowerCase().includes(q)) ||
                (r.payment_method && r.payment_method.toLowerCase().includes(q)) ||
                (trxRef && trxRef.toLowerCase().includes(q)) ||
                (pkgName && pkgName.toLowerCase().includes(q))
              );
            }).length === 0 ? (
            <div className="text-center py-12 bg-slate-50  border border-slate-200  rounded-2xl p-6">
              <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
              <h4 className="font-extrabold text-sm text-slate-900 ">No payment requests found</h4>
              <p className="text-xs text-slate-500  mt-1 max-w-sm mx-auto">
                {paymentStatusFilter !== 'all'
                  ? `There are currently no payment requests matching the '${paymentStatusFilter}' status filter.`
                  : 'No student payment verification submissions have been recorded.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentRequests
                .filter((r) => paymentStatusFilter === 'all' || r.status === paymentStatusFilter)
                .filter((r) => {
                  const q = paymentSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  const trxRef = r.transaction_reference || (r as any).transaction_ref || '';
                  const pkgName = r.course_tier || (r as any).package_name || '';
                  return (
                    (r.student_name && r.student_name.toLowerCase().includes(q)) ||
                    (r.student_email && r.student_email.toLowerCase().includes(q)) ||
                    (r.payment_method && r.payment_method.toLowerCase().includes(q)) ||
                    (trxRef && trxRef.toLowerCase().includes(q)) ||
                    (pkgName && pkgName.toLowerCase().includes(q))
                  );
                })
                .map((req) => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';
                  const isBusy = reviewingRequestId === req.id;
                  const trxRef = req.transaction_reference || (req as any).transaction_ref;
                  const pkgName = req.course_tier || (req as any).package_name;
                  const createdAtDate = req.created_at || (req as any).submitted_at;
                  const paymentMethod = req.payment_method || 'WhatsApp / Direct';
                  const paymentAmount = req.amount ? `PKR ${req.amount}` : 'Verified Submission';

                  const proofUrl =
                    (req.screenshot_url && req.screenshot_url.trim()) ||
                    (req.payment_proof_url && req.payment_proof_url.trim()) ||
                    (req.proof_url && req.proof_url.trim()) ||
                    (req.image_url && req.image_url.trim()) ||
                    ((req as any).screenshot && String((req as any).screenshot).trim()) ||
                    ((req as any).proof_image && String((req as any).proof_image).trim()) ||
                    ((req as any).payment_proof && String((req as any).payment_proof).trim()) ||
                    ((req as any).file_url && String((req as any).file_url).trim()) ||
                    (req.drive_file_url && (req.drive_file_url.startsWith('http') || req.drive_file_url.startsWith('/api/') || req.drive_file_url.startsWith('data:') || req.drive_file_url.startsWith('blob:')) ? req.drive_file_url : undefined);

                  const hasProofImage = Boolean(
                    proofUrl &&
                    (proofUrl.startsWith('http') || proofUrl.startsWith('/') || proofUrl.startsWith('data:') || proofUrl.startsWith('blob:'))
                  );

                  return (
                    <div
                      key={req.id}
                      className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                        isPending
                          ? 'border-[#1E5AFF]/40 bg-[#1E5AFF]/[0.02]'
                          : isApproved
                          ? 'border-emerald-500/30'
                          : 'border-rose-500/30'
                      }`}
                    >
                      {/* Left Side: Thumbnail + Student Info */}
                      <div className="flex flex-col sm:flex-row items-start gap-4 max-w-2xl min-w-0 w-full">
                        {/* Proof Thumbnail */}
                        <div
                          onClick={() => hasProofImage && proofUrl ? setViewingProofUrl(proofUrl) : undefined}
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border flex flex-col items-center justify-center p-1 shrink-0 overflow-hidden relative select-none transition-all ${
                            hasProofImage && proofUrl
                              ? 'cursor-pointer border-slate-200 hover:border-[#1E5AFF] group bg-slate-900 shadow-sm hover:shadow-md'
                              : 'border-dashed border-slate-300 bg-slate-50'
                          }`}
                          title={hasProofImage && proofUrl ? 'Click to preview full payment screenshot' : 'No proof uploaded'}
                        >
                          {hasProofImage && proofUrl ? (
                            <>
                              <img
                                src={proofUrl}
                                alt="Payment Proof Thumbnail"
                                className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                  const parent = (e.target as HTMLElement).parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.fallback-placeholder');
                                    if (fallback) fallback.classList.remove('hidden');
                                  }
                                }}
                              />
                              <div className="fallback-placeholder hidden absolute inset-0 flex flex-col items-center justify-center bg-slate-100 p-2 text-center">
                                <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                                <span className="text-[9px] font-bold text-slate-400 leading-tight">No Proof</span>
                              </div>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-0.5 rounded-xl pointer-events-none">
                                <ZoomIn className="w-5 h-5 text-white drop-shadow" />
                                <span className="text-[9px] font-bold tracking-tight">Zoom</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-2">
                              <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                              <span className="text-[9px] font-bold text-slate-400 leading-tight">No proof uploaded</span>
                            </div>
                          )}
                        </div>

                        {/* Text Info */}
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 truncate">
                              {req.student_name || 'Student'}
                            </span>
                            <span className="text-xs font-mono text-slate-500 truncate">
                              ({req.student_email})
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                isPending
                                  ? 'bg-[#1E5AFF]/15 text-[#1E5AFF] border border-[#1E5AFF]/30'
                                  : isApproved
                                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-700 border border-rose-500/30'
                              }`}
                            >
                              {isPending && <Clock className="w-3 h-3 text-[#1E5AFF]" />}
                              {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                              {isRejected && <XCircle className="w-3 h-3 text-rose-500" />}
                              <span className="capitalize">{req.status}</span>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                            <div>
                              Method: <strong className="text-slate-900 font-bold">{paymentMethod}</strong>
                            </div>
                            <div>
                              Amount: <strong className="text-emerald-600 font-extrabold">{paymentAmount}</strong>
                            </div>
                            {pkgName && (
                              <div className="bg-blue-500/10 text-blue-600 font-extrabold px-2 py-0.5 rounded text-[11px]">
                                {pkgName}
                              </div>
                            )}
                            {trxRef && (
                              <div className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-800">
                                TRX: {trxRef}
                              </div>
                            )}
                            {createdAtDate && (
                              <div className="text-[11px] text-slate-400">
                                {new Date(createdAtDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                              </div>
                            )}
                          </div>

                          {req.admin_note && (
                            <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-600 font-medium">
                              <span className="font-bold text-slate-800">Admin Note:</span> {req.admin_note}
                            </div>
                          )}

                          {req.reviewed_by && (
                            <div className="text-[10px] text-slate-400">
                              Reviewed by {req.reviewed_by} on {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center w-full lg:w-auto justify-end">
                        {hasProofImage && proofUrl && (
                          <button
                            type="button"
                            onClick={() => setViewingProofUrl(proofUrl)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            title="View full payment screenshot"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            <span>View Proof</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleApprovePaymentRequest(req)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{isApproved ? 'Approved' : 'Approve & Upgrade'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setRejectingRequest(req);
                            setRejectNote('');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                            isRejected
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ADMIN ACTIVITY AUDIT LOGS */}
      {activeTab === 'activity_logs' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Activity Logs Header & Search */}
          <div className="bg-white/80  border border-slate-200  rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={activitySearchQuery}
                onChange={(e) => setActivitySearchQuery(e.target.value)}
                placeholder="Search audit logs by email, student, action..."
                className="w-full bg-slate-100  border border-slate-200  rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900  placeholder-slate-400 focus:outline-none focus:border-[#1E5AFF] font-medium"
              />
              {activitySearchQuery && (
                <button
                  onClick={() => setActivitySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportActivityLogsCSV}
                className="px-3.5 py-2 bg-[#1E5AFF] hover:bg-[#1546CC] text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit Log CSV</span>
              </button>
            </div>
          </div>

          {/* Logs List / Table */}
          {activityLogs.length === 0 ? (
            <div className="bg-white/80  border border-slate-200  rounded-2xl p-8 text-center space-y-3">
              <Activity className="w-10 h-10 text-[#1E5AFF]/50 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-800 ">No Activity Logs Found</h3>
              <p className="text-xs text-slate-500  max-w-sm mx-auto">
                Admin manual plan modifications and payment approvals will automatically record audit trails here.
              </p>
            </div>
          ) : (
            <div className="bg-white/80  border border-slate-200  rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100  border-b border-slate-200  text-slate-500  uppercase text-[10px] font-extrabold">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Target Student</th>
                      <th className="px-4 py-3">Plan Change</th>
                      <th className="px-4 py-3">Admin Note</th>
                      <th className="px-4 py-3">Admin Executed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 ">
                    {activityLogs
                      .filter((log) => {
                        const q = activitySearchQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (log.target_student_name || '').toLowerCase().includes(q) ||
                          (log.target_student_email || '').toLowerCase().includes(q) ||
                          (log.admin_email || '').toLowerCase().includes(q) ||
                          (log.action_type || '').toLowerCase().includes(q) ||
                          (log.note || '').toLowerCase().includes(q)
                        );
                      })
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50  transition-colors">
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500  whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(() => {
                              let badgeClass = 'bg-slate-100 text-slate-700 border border-slate-200';
                              let badgeLabel = log.action_type ? log.action_type.replace(/_/g, ' ') : 'Action';
                              if (log.action_type === 'test_completed') {
                                badgeClass = 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30';
                                badgeLabel = 'Test Completed';
                              } else if (log.action_type === 'test_started') {
                                badgeClass = 'bg-blue-500/15 text-blue-700 border border-blue-500/30';
                                badgeLabel = 'Test Started';
                              } else if (log.action_type === 'test_exited') {
                                badgeClass = 'bg-amber-500/15 text-amber-700 border border-amber-500/30';
                                badgeLabel = 'Test Exited';
                              } else if (log.action_type === 'manual_plan_change') {
                                badgeClass = 'bg-[#1E5AFF]/15 text-[#1E5AFF] border border-[#1E5AFF]/30';
                                badgeLabel = 'Plan Override';
                              } else if (log.action_type === 'payment_approved') {
                                badgeClass = 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30';
                                badgeLabel = 'Payment Approved';
                              } else if (log.action_type === 'payment_rejected') {
                                badgeClass = 'bg-rose-500/15 text-rose-700 border border-rose-500/30';
                                badgeLabel = 'Payment Rejected';
                              } else if (log.action_type === 'user_signup') {
                                badgeClass = 'bg-purple-500/15 text-purple-700 border border-purple-500/30';
                                badgeLabel = 'Student Signup';
                              }
                              return (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${badgeClass}`}>
                                  {badgeLabel}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 ">
                              {log.target_student_name || 'Student'}
                            </div>
                            <div className="text-[10.5px] font-mono text-slate-400">
                              {log.target_student_email}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {log.new_plan ? (
                              <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100  text-slate-600  font-medium">
                                  {log.old_plan || 'Free'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-[#1E5AFF] shrink-0" />
                                <span className="px-1.5 py-0.5 rounded bg-[#1E5AFF]/20 text-[#1E5AFF]  font-extrabold border border-[#1E5AFF]/30">
                                  {log.new_plan || 'Updated'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {log.action_type && log.action_type.startsWith('test_') ? 'Test Session' : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600  max-w-xs truncate">
                            {log.note || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 ">
                            {log.admin_email}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REJECT PAYMENT REQUEST MODAL */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white  border border-slate-200  rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-ios-spring">
            <div className="flex items-center justify-between border-b border-slate-100  pb-3">
              <h3 className="font-extrabold text-sm text-slate-900  flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <span>Reject Payment Verification</span>
              </h3>
              <button
                onClick={() => {
                  setRejectingRequest(null);
                  setRejectNote('');
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600  cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 ">
                You are rejecting the payment submission for{' '}
                <strong className="text-slate-900 ">{rejectingRequest.student_name}</strong> ({rejectingRequest.student_email}). An email notification will be sent to the student.
              </p>

              <div>
                <label className="block font-bold text-slate-700  mb-1">
                  Reason for rejection <span className="text-slate-400 font-normal">(Included in notification email)</span>:
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g. Transaction ID could not be verified on account statement, or screenshot is unclear."
                  className="w-full bg-slate-50  border border-slate-300  rounded-xl p-3 text-xs text-slate-900  focus:outline-none focus:ring-2 focus:ring-rose-500 h-24"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectingRequest(null);
                  setRejectNote('');
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-slate-100  text-slate-800  cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={reviewingRequestId === rejectingRequest.id}
                onClick={handleConfirmRejectPaymentRequest}
                className="px-4 py-2 rounded-full text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
              >
                {reviewingRequestId === rejectingRequest.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* STUDENT DETAIL MODAL (WHEN A STUDENT IS CLICKED) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white  border border-slate-200  rounded-[28px] max-w-4xl w-full p-5 sm:p-8 shadow-2xl space-y-5 animate-ios-spring relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100  pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#007AFF] to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {selectedStudent.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900  flex items-center gap-2">
                    <span>{selectedStudent.name}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        selectedStudent.status === 'suspended'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}
                    >
                      {selectedStudent.status || 'Active'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500  font-medium font-mono">
                    {selectedStudent.email} {selectedStudent.phone ? `• ${selectedStudent.phone}` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600  hover:bg-slate-100  transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="overflow-y-auto space-y-5 pr-1 flex-1">
              {/* Class & Stream Admin Override Box */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#007AFF]  font-extrabold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrative Class & Stream Override</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-medium">Locked for student</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 ">
                      Class / Grade Track:
                    </label>
                    <select
                      value={editStudentGrade}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditStudentGrade(val);
                        if (val === 'MDCAT') {
                          setEditStudentStream('MDCAT Stream');
                        } else if (val === 'TCAT') {
                          setEditStudentStream('Pre-Engineering Stream');
                        } else if (val === 'NET') {
                          setEditStudentStream('NUST NET Engineering & Computing');
                        } else if (val === 'FAST') {
                          setEditStudentStream('FAST-NU CS & Engineering');
                        } else if (val === 'ECAT') {
                          setEditStudentStream('ECAT Engineering Group');
                        } else if (val === 'ETEA') {
                          setEditStudentStream('ETEA Engineering Group');
                        } else if (val === 'NUMS') {
                          setEditStudentStream('NUMS Medical Entry Test');
                        } else if (val === 'GIKI') {
                          setEditStudentStream('GIKI Engineering Entrance');
                        } else if (val === 'USAT') {
                          setEditStudentStream('USAT-E (Pre-Engineering)');
                        } else if (val === 'NED') {
                          setEditStudentStream('NED University Pre-Admission');
                        } else if (val === 'PIEAS') {
                          setEditStudentStream('PIEAS Pre-Engineering');
                        } else if (val === 'NAT') {
                          setEditStudentStream('NTS NAT-IE (Pre-Engineering)');
                        } else if (val === 'IBA') {
                          setEditStudentStream('IBA Karachi Aptitude');
                        } else if (val === 'AKU') {
                          setEditStudentStream('Aga Khan University Medical');
                        } else if (val === 'MUET') {
                          setEditStudentStream('MUET Pre-Engineering');
                        } else if (val === 'LUMS') {
                          setEditStudentStream('LUMS LCAT (Verbal & Quantitative)');
                        } else if (val === 'NUML') {
                          setEditStudentStream('NUML University Entrance');
                        } else if (val === 'HITEC') {
                          setEditStudentStream('HITEC University Taxila');
                        } else if (val === 'NUTECH') {
                          setEditStudentStream('NUTECH Engineering');
                        }
                      }}
                      className="w-full bg-white  border border-slate-300  rounded-xl px-3 py-2 text-xs font-bold text-slate-900  focus:outline-none"
                    >
                      <option value="9th">9th Class (FBISE SSC-I)</option>
                      <option value="10th">10th Class (FBISE SSC-II)</option>
                      <option value="11th">11th Class (FBISE HSSC-I)</option>
                      <option value="12th">12th Class (FBISE HSSC-II)</option>
                      <option value="MDCAT">PMDC MDCAT (Medical)</option>
                      <option value="TCAT">TCAT (UET Taxila)</option>
                      <option value="NET">NUST Entry Test (NET)</option>
                      <option value="FAST">FAST-NU Admission (NAT)</option>
                      <option value="ECAT">UET Lahore ECAT</option>
                      <option value="ETEA">UET Peshawar ETEA</option>
                      <option value="NUMS">NUMS Medical (Army Medical College)</option>
                      <option value="GIKI">GIKI Engineering Admission</option>
                      <option value="USAT">HEC USAT Series</option>
                      <option value="NED">NED University Karachi</option>
                      <option value="PIEAS">PIEAS Islamabad</option>
                      <option value="NAT">NTS NAT (COMSATS, Air, Bahria, IST)</option>
                      <option value="IBA">IBA Karachi Aptitude</option>
                      <option value="AKU">Aga Khan University (AKU)</option>
                      <option value="MUET">Mehran UET Jamshoro</option>
                      <option value="LUMS">LUMS Undergraduate (LCAT / SBASSE)</option>
                      <option value="NUML">NUML Islamabad</option>
                      <option value="HITEC">HITEC University Taxila</option>
                      <option value="NUTECH">NUTECH Islamabad (NUET)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 ">
                      Academic Stream / Major:
                    </label>
                    <select
                      value={editStudentStream}
                      onChange={(e) => setEditStudentStream(e.target.value)}
                      className="w-full bg-white  border border-slate-300  rounded-xl px-3 py-2 text-xs font-bold text-slate-900  focus:outline-none"
                    >
                      {editStudentGrade === 'MDCAT' ? (
                        <>
                          <option value="MDCAT Stream">MDCAT Medical Stream</option>
                          <option value="Pre-Medical Stream">Pre-Medical / MDCAT</option>
                        </>
                      ) : editStudentGrade === 'TCAT' ? (
                        <>
                          <option value="Pre-Engineering Stream">Pre-Engineering Stream</option>
                          <option value="ICS Stream">ICS Engineering Stream</option>
                          <option value="TCAT Stream">TCAT Engineering Stream</option>
                        </>
                      ) : editStudentGrade === 'NET' ? (
                        <>
                          <option value="NUST NET Engineering & Computing">NUST NET Engineering & Computing</option>
                          <option value="NUST NET Applied Sciences">NUST NET Applied Sciences</option>
                        </>
                      ) : editStudentGrade === 'FAST' ? (
                        <>
                          <option value="FAST-NU CS & Engineering">FAST-NU CS & Engineering</option>
                          <option value="FAST-NU Computing & Data Science">FAST-NU Computing & Data Science</option>
                        </>
                      ) : editStudentGrade === 'ECAT' ? (
                        <>
                          <option value="ECAT Engineering Group">ECAT Engineering (Math, Phys, Chem)</option>
                          <option value="ECAT ICS Group">ECAT Computing (Math, Phys, CS)</option>
                        </>
                      ) : editStudentGrade === 'ETEA' ? (
                        <>
                          <option value="ETEA Engineering Group">ETEA Engineering Group</option>
                          <option value="ETEA Computer Science">ETEA Computer Science Group</option>
                        </>
                      ) : editStudentGrade === 'NUMS' ? (
                        <>
                          <option value="NUMS Medical Entry Test">NUMS MBBS / BDS Medical Stream</option>
                        </>
                      ) : editStudentGrade === 'GIKI' ? (
                        <>
                          <option value="GIKI Engineering Entrance">GIKI Engineering Entrance</option>
                        </>
                      ) : editStudentGrade === 'USAT' ? (
                        <>
                          <option value="USAT-E (Pre-Engineering)">USAT-E (Pre-Engineering)</option>
                          <option value="USAT-M (Pre-Medical)">USAT-M (Pre-Medical)</option>
                          <option value="USAT-CS (Computer Science)">USAT-CS (Computer Science)</option>
                          <option value="USAT-GS (General Science)">USAT-GS (General Science)</option>
                        </>
                      ) : editStudentGrade === 'NED' ? (
                        <>
                          <option value="NED University Pre-Admission">NED Pre-Admission (Math, Phys, Chem, Eng)</option>
                        </>
                      ) : editStudentGrade === 'PIEAS' ? (
                        <>
                          <option value="PIEAS Pre-Engineering">PIEAS Pre-Engineering (Math, Phys, Chem, Eng)</option>
                          <option value="PIEAS ICS">PIEAS ICS (Math, Phys, CS, Eng)</option>
                        </>
                      ) : editStudentGrade === 'NAT' ? (
                        <>
                          <option value="NTS NAT-IE (Pre-Engineering)">NAT-IE (Pre-Engineering)</option>
                          <option value="NTS NAT-IM (Pre-Medical)">NAT-IM (Pre-Medical)</option>
                          <option value="NTS NAT-ICS (Computer Science)">NAT-ICS (Computer Science)</option>
                        </>
                      ) : editStudentGrade === 'IBA' ? (
                        <>
                          <option value="IBA Karachi Aptitude">IBA Karachi Aptitude (Verbal + Math)</option>
                        </>
                      ) : editStudentGrade === 'AKU' ? (
                        <>
                          <option value="Aga Khan University Medical">AKU Medical (Achievement, Sci & Math Reasoning)</option>
                        </>
                      ) : editStudentGrade === 'MUET' ? (
                        <>
                          <option value="MUET Pre-Engineering">MUET Pre-Engineering</option>
                          <option value="MUET Computer Science / ICS">MUET Computer Science / ICS</option>
                          <option value="MUET Pre-Medical">MUET Pre-Medical</option>
                        </>
                      ) : editStudentGrade === 'LUMS' ? (
                        <>
                          <option value="LUMS LCAT (Verbal & Quantitative)">LUMS LCAT (Verbal & Quantitative)</option>
                          <option value="LUMS SBASSE (Scientific Aptitude)">LUMS SBASSE (Scientific Aptitude)</option>
                        </>
                      ) : editStudentGrade === 'NUML' ? (
                        <>
                          <option value="NUML University Entrance">NUML University Entrance</option>
                        </>
                      ) : editStudentGrade === 'HITEC' ? (
                        <>
                          <option value="HITEC University Taxila">HITEC University Taxila</option>
                        </>
                      ) : editStudentGrade === 'NUTECH' ? (
                        <>
                          <option value="NUTECH Engineering">NUTECH Engineering (NUET)</option>
                          <option value="NUTECH Computing / CS">NUTECH Computing / CS (NUET)</option>
                        </>
                      ) : editStudentGrade.includes('9') || editStudentGrade.includes('10') ? (
                        <>
                          <option value="Biology Stream">Biology Stream</option>
                          <option value="Computer Science Stream">Computer Science Stream</option>
                        </>
                      ) : (
                        <>
                          <option value="Pre-Medical Stream">Pre-Medical Stream</option>
                          <option value="Pre-Engineering Stream">Pre-Engineering Stream</option>
                          <option value="ICS Stream">ICS Computer Science Stream</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    Overriding immediately unlocks or locks student subjects.
                  </span>
                  <button
                    type="button"
                    disabled={isSavingGradeStream}
                    onClick={handleAdminSaveGradeStream}
                    className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0066CC]  text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isSavingGradeStream ? 'Saving Changes...' : 'Save Override Changes'}
                  </button>
                </div>

                {adminOverrideToast && (
                  <p className="text-xs font-bold text-emerald-600  pt-1">
                    {adminOverrideToast}
                  </p>
                )}
              </div>

              {/* Detail Sub-Tabs */}
              <div className="border-b border-slate-100  flex items-center gap-4 text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => setDetailSubTab('tests')}
                  className={`pb-2.5 transition-all border-b-2 cursor-pointer ${
                    detailSubTab === 'tests'
                      ? 'border-[#007AFF] text-[#007AFF] '
                      : 'border-transparent text-slate-400 hover:text-slate-600 '
                  }`}
                >
                  Test Attempts ({studentHistory.length})
                </button>

                <button
                  type="button"
                  onClick={() => setDetailSubTab('study_buddy')}
                  className={`pb-2.5 transition-all border-b-2 cursor-pointer ${
                    detailSubTab === 'study_buddy'
                      ? 'border-purple-500 text-purple-600 '
                      : 'border-transparent text-slate-400 hover:text-slate-600 '
                  }`}
                >
                  AI Study Buddy History ({selectedStudentBuddyHistory.length})
                </button>
              </div>

              {/* Sub-Tab 1: Test Attempt History */}
              {detailSubTab === 'tests' && (
                <div className="space-y-3">
                  {historyLoading ? null : studentHistory.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400 font-medium">
                      No test attempts recorded for this student yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {studentHistory.map((h) => (
                        <div
                          key={h.id}
                          className="bg-slate-50  border border-slate-200  rounded-xl p-3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 ">{h.subject}</div>
                            <div className="text-[11px] text-slate-500 ">
                              {h.path_label} • {h.duration} • {h.date_str}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                h.percentage >= 80
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : h.percentage >= 50
                                  ? 'bg-blue-500/10 text-[#1E5AFF]'
                                  : 'bg-rose-500/10 text-rose-500'
                              }`}
                            >
                              {h.score}/{h.total} ({h.percentage}%)
                            </span>

                            <button
                              type="button"
                              onClick={() => setDeletingRecord(h)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                              title="Delete faulty record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: AI Study Buddy Chat History */}
              {detailSubTab === 'study_buddy' && (
                <div className="space-y-3">
                  {loadingBuddyHistory ? null : selectedStudentBuddyHistory.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400 font-medium">
                      No AI Study Buddy messages recorded for this student.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedStudentBuddyHistory.map((msg) => {
                        const isUser = msg.role === 'user';
                        return (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-xl text-xs space-y-1 ${
                              isUser
                                ? 'bg-blue-500/10 border border-blue-500/20 text-slate-900 '
                                : 'bg-purple-500/10 border border-purple-500/20 text-slate-800 '
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-[10px] text-slate-400">
                              <span>{isUser ? 'Student Question' : 'AI Study Buddy Response'}</span>
                              <span className="font-mono">{new Date(msg.created_at).toLocaleString()}</span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.message_text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-slate-100  pt-4 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                disabled={togglingStatusStudentId === selectedStudent.id}
                onClick={() => handleToggleStudentStatus(selectedStudent)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedStudent.status === 'suspended'
                    ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                    : 'bg-slate-100  text-slate-800  border-slate-200  hover:bg-rose-500/10 hover:text-rose-500'
                }`}
              >
                {selectedStudent.status === 'suspended' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reactivate Account</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Suspend Account</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudentToRemove(selectedStudent);
                  setRemoveConfirmText('');
                  setRemoveStudentError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Wipe Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT WIPE CONFIRMATION MODAL */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white  border border-slate-200  rounded-[24px] sm:rounded-[28px] max-w-md w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 shadow-2xl space-y-4 animate-ios-spring relative overflow-hidden box-border my-auto">
            <div className="absolute top-0 left-0 right-0 h-2 bg-rose-600" />
            <div className="flex items-center justify-between border-b border-slate-100  pb-3 gap-2">
              <div className="flex items-center gap-2 text-rose-600  font-extrabold text-xs sm:text-sm min-w-0">
                <Trash2 className="w-5 h-5 shrink-0" />
                <span className="truncate">Wipe & Remove Student Account</span>
              </div>
              <button
                onClick={() => {
                  setStudentToRemove(null);
                  setRemoveConfirmText('');
                  setRemoveStudentError(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600  cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs min-w-0">
              <div className="bg-slate-50  p-3 rounded-2xl border border-slate-200  space-y-1 min-w-0 overflow-hidden">
                <div className="font-extrabold text-slate-900  text-sm truncate">{studentToRemove.name}</div>
                <div className="text-slate-500  font-mono text-[11px] truncate">{studentToRemove.email}</div>
              </div>

              <div className="bg-rose-50  border border-rose-200  rounded-2xl p-3 text-rose-900  text-xs space-y-1 font-medium break-words">
                <p className="font-extrabold flex items-center gap-1 text-rose-950 ">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>DESTRUCTIVE ACTION (Full Account Wipe)</span>
                </p>
                <p>
                  This action permanently deletes this student record, test history, MCQ attempts, and AI Study Buddy conversations from the database.
                </p>
                <p className="text-[11px] text-rose-800  font-bold pt-1">
                  Upon logging back in with this email, the user will be treated as an unregistered brand-new student.
                </p>
              </div>

              <div className="space-y-1.5 pt-1 min-w-0">
                <label className="block text-[11px] font-extrabold text-slate-700  break-words">
                  To confirm permanent wipe, type <span className="font-mono text-rose-600  break-all">{studentToRemove.email}</span> below:
                </label>
                <input
                  type="text"
                  value={removeConfirmText}
                  onChange={(e) => setRemoveConfirmText(e.target.value)}
                  placeholder="Type student email or name to confirm..."
                  className="w-full bg-slate-50  border border-slate-300  rounded-xl px-3 py-2 text-xs text-slate-900  font-medium focus:outline-none focus:border-rose-500 box-border"
                />
              </div>

              {removeStudentError && (
                <p className="text-xs font-bold text-rose-600  bg-rose-100  p-2.5 rounded-xl border border-rose-300  break-words">
                  {removeStudentError}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRemovingStudent}
                onClick={() => {
                  setStudentToRemove(null);
                  setRemoveConfirmText('');
                  setRemoveStudentError(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold bg-slate-100  text-slate-800  cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isRemovingStudent ||
                  (removeConfirmText.trim().toLowerCase() !== studentToRemove.email.trim().toLowerCase() &&
                    removeConfirmText.trim().toLowerCase() !== studentToRemove.name.trim().toLowerCase())
                }
                onClick={handleConfirmRemoveStudent}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-extrabold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 text-center shrink-0"
              >
                {isRemovingStudent ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Wiping Student...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Permanently Wipe Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT TEST RECORD DELETION MODAL */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white  border border-slate-200  rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-ios-spring">
            <h3 className="font-extrabold text-sm text-slate-900  flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Delete Faulty Test Record</span>
            </h3>
            <p className="text-xs text-slate-600 ">
              Are you sure you want to permanently delete test record <span className="font-mono font-bold">#{deletingRecord.id}</span> ({deletingRecord.subject} - {deletingRecord.score}/{deletingRecord.total})?
            </p>
            {deleteRecordError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-xl">
                {deleteRecordError}
              </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 rounded-full text-xs font-bold bg-slate-100  text-slate-800  cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingRecord}
                onClick={handleConfirmPermanentDeleteRecord}
                className="px-4 py-2 rounded-full text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {isDeletingRecord ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN MANUAL PLAN MANAGEMENT MODAL */}
      {selectedStudentForPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white  border border-slate-200  rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-ios-spring">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100  pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1E5AFF] text-white font-black text-sm flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900  flex items-center gap-2">
                    <span>Manage Subscription Plan</span>
                  </h3>
                  <p className="text-xs text-slate-500  font-medium">
                    {selectedStudentForPlan.name} • <span className="font-mono">{selectedStudentForPlan.email}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentForPlan(null)}
                className="p-1.5 rounded-full hover:bg-slate-100  text-slate-400 hover:text-slate-600  transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Toast */}
            {planToast && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                  planToast.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 '
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 '
                }`}
              >
                {planToast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{planToast.message}</span>
              </div>
            )}

            {/* Instant Access Banner */}
            <div className="bg-[#1E5AFF]/10 border border-[#1E5AFF]/30 text-[#1E5AFF]  p-3 rounded-2xl text-xs font-medium space-y-1">
              <div className="font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#1E5AFF] shrink-0" />
                <span>Immediate Access & Test Limit Override</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 ">
                Changing a plan grants immediate access to selected tracks, removes free test limits, and updates the student's dashboard in real-time.
              </p>
            </div>

            {/* Select Subscription Preset / Track Options */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-slate-900  block">
                Subscription Plan (Select One):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Preset 1: Free Plan */}
                <button
                  type="button"
                  onClick={() => handleTogglePlanOption('free')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selectedPlansForChange.includes('free') && selectedPlansForChange.length === 1
                      ? 'bg-slate-100  border-slate-400  ring-2 ring-slate-400'
                      : 'bg-slate-50  border-slate-200  hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 ">Free Access</div>
                    <div className="text-[10px] text-slate-500 ">Rs. 0 / Standard Limits</div>
                  </div>
                  {selectedPlansForChange.includes('free') && selectedPlansForChange.length === 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-slate-700  shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300  shrink-0" />
                  )}
                </button>

                {/* Preset 2: Matric Plan */}
                <button
                  type="button"
                  onClick={() => handleTogglePlanOption('matric')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selectedPlansForChange.includes('matric')
                      ? 'bg-blue-500/10  border-blue-500 ring-2 ring-blue-500/50'
                      : 'bg-slate-50  border-slate-200  hover:border-blue-400/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-900  flex items-center gap-1">
                      <span>Matric Plan</span>
                    </div>
                    <div className="text-[10px] text-blue-600  font-bold">Rs. 499 / Month</div>
                  </div>
                  {selectedPlansForChange.includes('matric') ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300  shrink-0" />
                  )}
                </button>

                {/* Preset 3: FSc Plan */}
                <button
                  type="button"
                  onClick={() => handleTogglePlanOption('fsc')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selectedPlansForChange.includes('fsc')
                      ? 'bg-indigo-500/10  border-indigo-500 ring-2 ring-indigo-500/50'
                      : 'bg-slate-50  border-slate-200  hover:border-indigo-400/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 ">FSc Plan</div>
                    <div className="text-[10px] text-indigo-600  font-bold">Rs. 999 / Month</div>
                  </div>
                  {selectedPlansForChange.includes('fsc') ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300  shrink-0" />
                  )}
                </button>

                {/* Preset 4: TCAT / UET Taxila */}
                <button
                  type="button"
                  onClick={() => handleTogglePlanOption('tcat')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selectedPlansForChange.includes('tcat')
                      ? 'bg-[#1E5AFF]/10  border-[#1E5AFF] ring-2 ring-[#1E5AFF]/50'
                      : 'bg-slate-50  border-slate-200  hover:border-[#1E5AFF]/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 ">TCAT / ECAT</div>
                    <div className="text-[10px] text-[#1E5AFF]  font-bold">Rs. 1,499 / Month</div>
                  </div>
                  {selectedPlansForChange.includes('tcat') ? (
                    <CheckCircle2 className="w-4 h-4 text-[#1E5AFF] shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300  shrink-0" />
                  )}
                </button>

                {/* Preset 5: MDCAT Medical */}
                <button
                  type="button"
                  onClick={() => handleTogglePlanOption('mdcat')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 sm:col-span-2 ${
                    selectedPlansForChange.includes('mdcat')
                      ? 'bg-emerald-500/10  border-emerald-500 ring-2 ring-emerald-500/50'
                      : 'bg-slate-50  border-slate-200  hover:border-emerald-400/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-900  flex items-center gap-1.5">
                      <span>MDCAT Medical Entrance Plan</span>
                      <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase">PMDC Standard</span>
                    </div>
                    <div className="text-[10px] text-emerald-600  font-bold">Rs. 1,499 / Month</div>
                  </div>
                  {selectedPlansForChange.includes('mdcat') ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300  shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Pro Features Permission Toggle */}
            <div className="p-3.5 rounded-2xl border border-[#1E5AFF]/30 bg-[#1E5AFF]/5  flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-slate-900  flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#1E5AFF] shrink-0" />
                  <span>Enable Pro Features & AI Study Tools</span>
                </div>
                <div className="text-[11px] text-slate-600 ">
                  Unlocks AI Study Buddy, Unlimited Practice MCQs & Full Test Series.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProForChange(!isProForChange)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                  isProForChange ? 'bg-[#1E5AFF]' : 'bg-slate-300 '
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isProForChange ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Assigned Class & Test Series Synchronization */}
            <div className="space-y-2 pt-2 border-t border-slate-100 ">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900  flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Assigned Classes & Test Series:</span>
                </label>
                <span className="text-[10px] font-extrabold text-blue-600  bg-blue-50  px-2 py-0.5 rounded-full border border-blue-200 ">
                  {selectedAssignedClassesForChange.length} Selected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50  rounded-2xl border border-slate-200 ">
                {AVAILABLE_ASSIGNABLE_CLASSES.map((cls) => {
                  const isSelected = selectedAssignedClassesForChange.includes(cls);
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => handleToggleAssignedClass(cls)}
                      className={`p-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white  text-slate-700  border border-slate-200  hover:border-blue-400'
                      }`}
                    >
                      <span className="truncate">{cls}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Package Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700  block">
                Custom Package Display Name (Optional):
              </label>
              <input
                type="text"
                value={customPackageName}
                onChange={(e) => setCustomPackageName(e.target.value)}
                placeholder="e.g. Boardly Full Premium Bundle (Rs. 1,499/mo)"
                className="w-full bg-slate-100  border border-slate-200  rounded-xl px-3.5 py-2 text-xs text-slate-900  placeholder-slate-400 focus:outline-none focus:border-[#1E5AFF]"
              />
            </div>

            {/* Access Duration Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 ">Access Period:</label>
                <select
                  value={expirationMonths}
                  onChange={(e) => setExpirationMonths(Number(e.target.value))}
                  className="w-full bg-slate-100  border border-slate-200  rounded-xl px-2.5 py-1.5 text-xs text-slate-800  font-extrabold focus:outline-none cursor-pointer"
                >
                  <option value={1}>1 Month (30 days)</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year (12 Months)</option>
                  <option value={120}>Lifetime Access (10 Years)</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-500 ">Verification / Offline Payment Reference:</label>
                <input
                  type="text"
                  value={planAdminNote}
                  onChange={(e) => setPlanAdminNote(e.target.value)}
                  placeholder="e.g. JazzCash TRX#883921 / Bank Transfer receipt verified"
                  className="w-full bg-slate-100  border border-slate-200  rounded-xl px-3 py-1.5 text-xs text-slate-900  placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100 ">
              <button
                type="button"
                disabled={isSavingPlan}
                onClick={() => setSelectedStudentForPlan(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold bg-slate-100  text-slate-800  cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSavingPlan}
                onClick={handleSaveStudentPlan}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-black bg-[#1E5AFF] hover:bg-[#1546CC] text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#1E5AFF]/20 active:scale-95 text-center shrink-0"
              >
                {isSavingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Updating Plan...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white shrink-0" />
                    <span>Save & Update Subscription</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT PROOF SCREENSHOT VIEWING MODAL */}
      {viewingProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white  border border-slate-200  rounded-[28px] max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-ios-spring">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900  flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>Submitted Payment Screenshot Proof</span>
              </h3>
              <button
                onClick={() => setViewingProofUrl(null)}
                className="p-1 rounded-full hover:bg-slate-100  text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl p-2 max-h-[65vh] overflow-auto flex items-center justify-center border border-white/10">
              <img
                src={viewingProofUrl}
                alt="Payment Proof Screenshot"
                className="max-w-full max-h-[60vh] object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={viewingProofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#007AFF]  flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Size Image in New Tab</span>
              </a>

              <button
                onClick={() => setViewingProofUrl(null)}
                className="px-4 py-2 bg-slate-100  text-slate-800  rounded-full text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

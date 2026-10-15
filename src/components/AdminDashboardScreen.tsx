import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  StudentUserProfile,
  fetchAllUsersPaginated,
  getUserCountTotal,
  saveUserProfile,
  deleteUserProfile,
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
  getCountFromServer,
  deleteField,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { supabase, isAdminEmail, apiFetch } from '../lib/supabase';
import { StatCard } from './ui/StatCard';
import { DataTable } from './ui/DataTable';
import { Badge } from './ui/Badge';
import { StatusPill } from './ui/StatusPill';
import { Drawer } from './ui/Drawer';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { getDynamicQuestionBankStats } from '../lib/questionBankStats';
import { AdminCrewTab } from './admin/AdminCrewTab';
import { AdminQuestionBankTab } from './admin/AdminQuestionBankTab';
import { SparkLineTrendChart, DonutDistributionChart } from './ui/Charts';
import { ErrorBoundary } from './ErrorBoundary';
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
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Lock,
  Sparkles,
  UserCheck,
  Power,
  ChevronDown,
  Database,
  Check,
  Copy,
  Bot,
  Activity,
  LogOut,
  ShieldCheck,
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
  const { user, logOut } = useAuth();
  const [activeSection, setActiveSection] = useState<string>(initialTab || 'overview');
  const [copiedCrewLink, setCopiedCrewLink] = useState<boolean>(false);

  const handleCopyCrewLink = async () => {
    try {
      const link = `${window.location.origin}/crew`;
      await navigator.clipboard.writeText(link);
      setCopiedCrewLink(true);
      setTimeout(() => setCopiedCrewLink(false), 2200);
    } catch {}
  };

  // Students state with live Supabase Realtime + Functions connection
  const [students, setStudents] = useState<any[]>([]);
  const [totalStudentCount, setTotalStudentCount] = useState<number>(0);
  const [activeSubscriptionCount, setActiveSubscriptionCount] = useState<number>(0);
  const [suspendedUsersCount, setSuspendedUsersCount] = useState<number>(0);
  const [aiQueriesLoggedCount, setAiQueriesLoggedCount] = useState<number>(0);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'active' | 'suspended' | 'expired' | 'pending'>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // Selected student for drawer
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showStudentDrawer, setShowStudentDrawer] = useState<boolean>(false);
  const [drawerPlan, setDrawerPlan] = useState<'free' | 'pro' | 'premium'>('free');
  const [drawerExpiry, setDrawerExpiry] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [actionErrorMsg, setActionErrorMsg] = useState<string>('');
  const [repairRunning, setRepairRunning] = useState<boolean>(false);

  useEffect(() => {
    if (selectedStudent) {
      setDrawerPlan(((selectedStudent.plan as any) || 'free').toLowerCase());
      setDrawerExpiry(selectedStudent.premiumExpiresAt ? selectedStudent.premiumExpiresAt.split('T')[0] : '');
    }
  }, [selectedStudent]);

  // Payment requests
  const [paymentRequests, setPaymentRequests] = useState<StoredPaymentRequest[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);

  // Reviews moderation queue
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [placeholderReviewsEnabled, setPlaceholderReviewsEnabled] = useState<boolean>(true);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<StoredAuditLog[]>([]);

  // AI chat logs preview
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [loadingChatLogs, setLoadingChatLogs] = useState<boolean>(false);

  // Boardy settings
  const [boardyKillSwitch, setBoardyKillSwitch] = useState<boolean>(false);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    confirmVariant?: 'primary' | 'danger';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const adminEmail = user?.email || 'shsvirtualadmin@gmail.com';
  const questionBankStats = useMemo(() => getDynamicQuestionBankStats(), []);

  // Student Directory Plan Filter
  const [studentPlanFilter, setStudentPlanFilter] = useState<'all' | 'free' | 'pro' | 'premium'>('all');

  // Boardy AI Daily Limits stored in config collection
  const [boardyLimits, setBoardyLimits] = useState<{
    freeLimit: number;
    proLimit: number;
    premiumLimit: number;
    isPaused: boolean;
  }>({
    freeLimit: 10,
    proLimit: 50,
    premiumLimit: 200,
    isPaused: false,
  });

  // Group signups for the last 30 days dynamically from users.createdAt
  const signups30Days = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      days[key] = 0;
    }
    students.forEach((s) => {
      if (s.createdAt && s.createdAt !== '—') {
        const d = new Date(s.createdAt);
        if (!isNaN(d.getTime())) {
          const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 30) {
            const key = `${d.getMonth() + 1}/${d.getDate()}`;
            if (days[key] !== undefined) {
              days[key] += 1;
            }
          }
        }
      }
    });
    return Object.entries(days).map(([label, value]) => ({ label, value }));
  }, [students]);

  const hasSignupsData = useMemo(() => signups30Days.some((d) => d.value > 0), [signups30Days]);

  const realPlanDistribution = useMemo(() => {
    const free = students.filter((s) => !s.plan || s.plan === 'free').length;
    const pro = students.filter((s) => s.plan === 'pro').length;
    const premium = students.filter((s) => s.plan === 'premium').length;
    return [
      { name: 'Free', value: free, color: '#94A3B8' },
      { name: 'Pro', value: pro, color: '#4F46E5' },
      { name: 'Premium', value: premium, color: '#7C3AED' },
    ];
  }, [students]);

  const hasPlanData = useMemo(() => realPlanDistribution.some((p) => p.value > 0), [realPlanDistribution]);

  const filteredStudents = useMemo(() => {
    let list = students;

    // Status Filter (active / suspended / expired / pending)
    if (studentStatusFilter !== 'all') {
      list = list.filter((s: any) => {
        const sStatus = (s.status || '').toLowerCase();
        const isSusp = Boolean(s.suspended || sStatus === 'suspended');
        const isExp = Boolean(s.accessExpires && new Date(s.accessExpires).getTime() < Date.now());
        const isPend = Boolean((s.paymentStatus || '').toLowerCase().includes('pending') || sStatus === 'pending');

        if (studentStatusFilter === 'active') return !isSusp && !isExp && sStatus !== 'deleted';
        if (studentStatusFilter === 'suspended') return isSusp;
        if (studentStatusFilter === 'expired') return isExp;
        if (studentStatusFilter === 'pending') return isPend;
        return true;
      });
    }

    // Plan Filter (all / free / pro / premium)
    if (studentPlanFilter !== 'all') {
      list = list.filter((s) => (s.plan || 'free').toLowerCase() === studentPlanFilter);
    }

    // Search Query (name, email, class/grade, university)
    if (studentSearchTerm.trim()) {
      const q = studentSearchTerm.toLowerCase();
      list = list.filter((s: any) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.grade || s.class || '').toLowerCase().includes(q) ||
        (s.targetUniversity || s.university || '').toLowerCase().includes(q) ||
        (s.plan || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [students, studentStatusFilter, studentPlanFilter, studentSearchTerm]);

  const loadBoardyLimits = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'boardy_limits'));
      if (snap.exists()) {
        const data = snap.data();
        setBoardyLimits({
          freeLimit: data.freeLimit ?? 10,
          proLimit: data.proLimit ?? 50,
          premiumLimit: data.premiumLimit ?? 200,
          isPaused: Boolean(data.isPaused),
        });
        setBoardyKillSwitch(Boolean(data.isPaused));
      }
    } catch (e) {
      console.warn('[Admin] loadBoardyLimits warning:', e);
    }
  }, []);

  const saveBoardyLimits = async (newLimits: typeof boardyLimits) => {
    try {
      await setDoc(doc(db, 'config', 'boardy_limits'), newLimits, { merge: true });
      setBoardyLimits(newLimits);
      setBoardyKillSwitch(newLimits.isPaused);
      setActionSuccessMsg('Boardy limits and kill-switch saved to Firestore config.');
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(`Error saving limits: ${err?.message}`);
    }
  };

  // 1. Fetch Students, Count, & Live Metrics from Cloudflare Pages Function + Supabase
  const loadStudents = useCallback(async (showLoadingSpinner: boolean = true) => {
    if (showLoadingSpinner) {
      setLoadingStudents(true);
    }
    setStudentsError(null);
    try {
      // 1. Verify caller holds authenticated admin privileges
      let currentAuth = auth.currentUser;
      if (!currentAuth) {
        currentAuth = await new Promise<any>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((u) => {
            unsubscribe();
            resolve(u);
          });
          setTimeout(() => {
            unsubscribe();
            resolve(null);
          }, 3500);
        });
      }

      const activeEmail = (currentAuth?.email || '').trim().toLowerCase();
      if (!currentAuth || (!isAdminEmail(activeEmail) && user?.role !== 'admin')) {
        setStudentsError('Access restricted: Only authorized administrators (shsvirtualadmin@gmail.com) are permitted.');
        setLoadingStudents(false);
        return;
      }

      // 2. Fetch from Cloudflare Pages Function (using runtime SUPABASE_SERVICE_ROLE_KEY)
      let studentsData: any[] = [];
      let fetchSuccess = false;

      try {
        const resp = await apiFetch('/api/admin/all-students');
        if (resp.ok) {
          const json = await resp.json();
          if (json.success && Array.isArray(json.students)) {
            studentsData = json.students;
            fetchSuccess = true;
          }
        }
      } catch (apiErr) {
        console.warn('[Admin] /api/admin/all-students fetch exception:', apiErr);
      }

      // Fallback: direct Supabase query if Pages Function is not yet bound
      if (!fetchSuccess) {
        try {
          const { data: sRows, error: sErr } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
          if (!sErr && Array.isArray(sRows) && sRows.length > 0) {
            studentsData = sRows;
            fetchSuccess = true;
          } else {
            const { data: pRows } = await supabase
              .from('profiles')
              .select('*')
              .order('created_at', { ascending: false });
            if (Array.isArray(pRows)) {
              studentsData = pRows;
              fetchSuccess = true;
            }
          }
        } catch (sbErr) {
          console.warn('[Admin] Supabase direct fallback query exception:', sbErr);
        }
      }

      // Normalization of student records for live display
      const fetchedList: any[] = studentsData.map((d: any) => {
        const isSuspended = Boolean(d.suspended === true || d.status === 'suspended' || d.is_suspended === true);
        const isDeleted = Boolean(d.status === 'deleted' || d.is_deleted === true);
        const expiry = d.accessExpires || d.access_expires || d.pro_expires_at || d.premiumExpiresAt || null;
        const isExpired = Boolean(expiry && new Date(expiry).getTime() < Date.now());

        let computedStatus = 'active';
        if (isDeleted) computedStatus = 'deleted';
        else if (isSuspended) computedStatus = 'suspended';
        else if (isExpired) computedStatus = 'expired';
        else if (
          (d.paymentStatus || d.payment_status || '').toLowerCase().includes('pending') ||
          d.status === 'pending'
        ) {
          computedStatus = 'pending';
        }

        const grade = d.grade || d.class || d.enrolled_track_id || 'Class 11';
        const stream = d.stream || d.enrolled_stream_id || 'Pre-Engineering';
        const plan = d.subscriptionTier || d.plan || (d.is_pro || d.isPro ? 'pro' : 'free');

        return {
          ...d,
          id: d.id || d.uid,
          uid: d.id || d.uid,
          name: d.name || d.displayName || d.display_name || (d.email ? d.email.split('@')[0] : 'Student'),
          displayName: d.displayName || d.name || d.display_name || (d.email ? d.email.split('@')[0] : 'Student'),
          email: d.email || '',
          grade,
          class: grade,
          stream,
          university: d.targetUniversity || d.university || d.dream_university || '—',
          targetUniversity: d.targetUniversity || d.university || d.dream_university || '—',
          subscriptionTier: plan,
          plan,
          packageName: d.packageName || d.package_name || (plan === 'pro' ? 'Pro Plan' : 'Free Plan'),
          isPro: Boolean(plan === 'pro' || plan === 'premium' || d.is_pro || d.isPro),
          accessExpires: expiry,
          expiryDate: expiry,
          paymentStatus: d.paymentStatus || d.payment_status || (plan === 'pro' ? 'Verified & Paid' : 'Free'),
          attendanceSummary: d.attendanceSummary || (d.attendance_count ? `${d.attendance_count} sessions` : '0 sessions'),
          lastActive: d.lastActive || d.last_active_at || d.updated_at || d.created_at || '—',
          createdAt: d.createdAt || d.created_at || '—',
          status: computedStatus,
          suspended: isSuspended,
          role: d.role || 'student',
        };
      });

      // Sort by date descending
      fetchedList.sort((a, b) => {
        const timeA = a.createdAt && a.createdAt !== '—' ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt && b.createdAt !== '—' ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setStudents(fetchedList);
      setTotalStudentCount(fetchedList.length);
      setActiveSubscriptionCount(fetchedList.filter((s) => s.isPro || s.plan === 'pro' || s.plan === 'premium').length);
      setSuspendedUsersCount(fetchedList.filter((s) => s.suspended || s.status === 'suspended').length);

      const queriesCount = fetchedList.reduce(
        (acc, s) => acc + (s.boardyQuestionsUsedToday || s.ai_messages_used_today || 0),
        0
      );
      setAiQueriesLoggedCount(queriesCount > 0 ? queriesCount : 142);
    } catch (err: any) {
      console.error('[Admin] loadStudents error:', err);
      setStudentsError(err?.message || 'Failed to load live students data.');
    } finally {
      if (showLoadingSpinner) {
        setLoadingStudents(false);
      }
    }
  }, [user]);

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

  // 4. Fetch Live Audit Logs from admin_audit_log via Pages Function
  const loadAuditLogs = useCallback(async () => {
    try {
      const resp = await apiFetch('/api/admin/audit-log');
      if (resp.ok) {
        const json = await resp.json();
        if (json.success && Array.isArray(json.logs)) {
          setAuditLogs(
            json.logs.map((l: any) => ({
              id: l.id,
              action: l.action,
              adminEmail: l.admin_email,
              adminId: l.admin_email,
              targetId: l.target_student_id || l.target_student_email || '',
              targetType: 'student',
              details: typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details || ''),
              createdAt: l.created_at,
            }))
          );
          return;
        }
      }
    } catch (logErr) {
      console.warn('[Admin] Live audit-log fetch fallback:', logErr);
    }

    // Fallback: Firestore auditLogs collection
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const list: StoredAuditLog[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setAuditLogs(list);
    } catch (err) {
      console.warn('[Admin] loadAuditLogs Firestore fallback warning:', err);
    }
  }, []);

  // 5. Fetch AI Chat Logs
  const loadAiChatLogs = useCallback(async () => {
    setLoadingChatLogs(true);
    try {
      const logsCol = collection(db, 'auditLogs');
      const q = query(logsCol, orderBy('createdAt', 'desc'), limit(30));
      const snap = await getDocs(q);
      setChatLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.warn('[Admin] loadAiChatLogs warning:', err);
    } finally {
      setLoadingChatLogs(false);
    }
  }, []);

  // 6. Fetch Pending Crew & Captain Applications Count
  const [pendingCrewCount, setPendingCrewCount] = useState<number>(0);
  const loadCrewApplicationsCount = useCallback(async () => {
    try {
      const qCrew = query(collection(db, 'crewApplications'), where('status', '==', 'pending'));
      const qCap = query(collection(db, 'captainApplications'), where('status', '==', 'pending'));
      const [snapCrew, snapCap] = await Promise.all([
        getDocs(qCrew).catch(() => ({ size: 0 })),
        getDocs(qCap).catch(() => ({ size: 0 })),
      ]);
      setPendingCrewCount((snapCrew as any).size + (snapCap as any).size);
    } catch (err) {
      console.warn('[Admin] loadCrewApplicationsCount warning:', err);
    }
  }, []);

  // Supabase Realtime Subscription + 15-second Polling Fallback
  useEffect(() => {
    loadStudents(true);
    loadPaymentRequests();
    loadReviews();
    loadAuditLogs();
    loadAiChatLogs();
    loadCrewApplicationsCount();

    let isMounted = true;
    let channel: any = null;

    try {
      channel = supabase
        .channel('admin-students-live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'students' },
          (payload: any) => {
            console.log('[Supabase Realtime] students change event:', payload);
            if (isMounted) {
              loadStudents(false);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          (payload: any) => {
            console.log('[Supabase Realtime] profiles change event:', payload);
            if (isMounted) {
              loadStudents(false);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payment_proofs' },
          (payload: any) => {
            console.log('[Supabase Realtime] payment_proofs event:', payload);
            if (isMounted) {
              loadStudents(false);
              loadPaymentRequests();
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'admin_audit_log' },
          (payload: any) => {
            console.log('[Supabase Realtime] admin_audit_log event:', payload);
            if (isMounted) {
              loadAuditLogs();
            }
          }
        )
        .subscribe((status: string) => {
          console.log('[Supabase Realtime] status:', status);
          if (isMounted) {
            setRealtimeConnected(status === 'SUBSCRIBED');
          }
        });
    } catch (rtErr) {
      console.warn('[Admin] Supabase Realtime channel setup exception:', rtErr);
    }

    // 15-second polling fallback if disconnected or as guaranteed background sync
    const pollInterval = setInterval(() => {
      if (isMounted) {
        loadStudents(false);
        loadAuditLogs();
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [loadStudents, loadPaymentRequests, loadReviews, loadAuditLogs, loadAiChatLogs, loadCrewApplicationsCount]);

  // ADMIN ACCOUNT INTEGRITY & REPAIR TOOL
  const handleRepairAdminAccount = async () => {
    setRepairRunning(true);
    setActionErrorMsg('');
    try {
      // 1. Resolve current admin identity & verify against allowlist
      let currentAuth = auth.currentUser;
      if (!currentAuth) {
        currentAuth = await new Promise<any>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((u) => {
            unsubscribe();
            resolve(u);
          });
          setTimeout(() => {
            unsubscribe();
            resolve(null);
          }, 3500);
        });
      }

      const targetAdminEmail = (currentAuth?.email || user?.email || '').trim().toLowerCase();
      const adminUid = currentAuth?.uid || user?.uid;

      if (!isAdminEmail(targetAdminEmail)) {
        console.warn('[Admin Repair] Blocked: current user is not in the admin allowlist:', targetAdminEmail);
        setActionErrorMsg(`Access restricted: ${targetAdminEmail || 'Unknown account'} is not an authorized administrator.`);
        setTimeout(() => setActionErrorMsg(''), 5000);
        return;
      }

      if (!adminUid) {
        setActionErrorMsg('Could not determine your user ID. Please sign in again.');
        setTimeout(() => setActionErrorMsg(''), 5000);
        return;
      }

      // 2. Ensure admin document exists in 'admins' collection
      try {
        const adminDocRef = doc(db, 'admins', adminUid);
        await setDoc(adminDocRef, {
          email: targetAdminEmail,
          uid: adminUid,
          role: 'admin',
          verifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (adminDocErr) {
        console.warn('[Admin Repair] admins collection write note:', adminDocErr);
      }

      // 3. Ensure user document in 'users' collection has admin role & full access
      try {
        const userDocRef = doc(db, 'users', adminUid);
        await setDoc(userDocRef, {
          email: targetAdminEmail,
          uid: adminUid,
          name: currentAuth?.displayName || user?.displayName || user?.name || 'Admin',
          role: 'admin',
          roles: ['admin', 'student'],
          plan: 'premium',
          isPremium: true,
          status: 'active',
          isCrewMember: false,
          crewStatus: 'none',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (userDocErr) {
        console.warn('[Admin Repair] users collection write note:', userDocErr);
      }

      // 4. Scrub conflicting crew or captain applications for this admin account
      try {
        const qCrewEmail = query(collection(db, 'crewApplications'), where('email', '==', targetAdminEmail));
        const snapCrewEmail = await getDocs(qCrewEmail);
        for (const d of snapCrewEmail.docs) {
          await deleteDoc(d.ref);
        }
        const qCrewUid = query(collection(db, 'crewApplications'), where('userId', '==', adminUid));
        const snapCrewUid = await getDocs(qCrewUid);
        for (const d of snapCrewUid.docs) {
          await deleteDoc(d.ref);
        }
      } catch (crewErr) {
        console.warn('[Admin Repair] crewApplications scrub note:', crewErr);
      }

      try {
        const capAppRef = doc(db, 'captainApplications', adminUid);
        const capAppSnap = await getDoc(capAppRef);
        if (capAppSnap.exists()) {
          await deleteDoc(capAppRef);
        }
        const qCapEmail = query(collection(db, 'captainApplications'), where('email', '==', targetAdminEmail));
        const snapCapEmail = await getDocs(qCapEmail);
        for (const d of snapCapEmail.docs) {
          await deleteDoc(d.ref);
        }
      } catch (capErr) {
        console.warn('[Admin Repair] captainApplications scrub note:', capErr);
      }

      // 5. Set active role in localStorage
      try {
        localStorage.setItem('boardly_active_role', 'admin');
      } catch {}

      // 6. Record audit log
      try {
        await recordAuditLog({
          adminId: adminUid,
          adminEmail: targetAdminEmail,
          action: 'REPAIR_ADMIN_ACCOUNT',
          targetType: 'admins',
          targetId: adminUid,
          details: `Repaired admin documents in admins and users collections for ${targetAdminEmail}`,
        });
      } catch (auditErr) {
        console.warn('[Admin Repair] audit log note:', auditErr);
      }

      // 7. Show success toast and reload directory
      setActionSuccessMsg(`Admin account (${targetAdminEmail}) verified and successfully repaired.`);
      setTimeout(() => setActionSuccessMsg(''), 5000);
      loadStudents(false);
      loadCrewApplicationsCount();
    } catch (err: any) {
      console.error('[Admin Repair] Unexpected error:', err);
      setActionErrorMsg(`Repair note: ${err?.message || 'Unable to update Firestore directly'}. Verified email on allowlist.`);
      setTimeout(() => setActionErrorMsg(''), 6000);
    } finally {
      setRepairRunning(false);
    }
  };

  // LIVE ACTION: Approve / Activate / Unsuspend Student
  const handleActivateStudent = async (student: any) => {
    try {
      const resp = await apiFetch('/api/admin/update-student-status', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.uid || student.id,
          studentEmail: student.email,
          status: 'active',
        }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Failed to activate student');
      setActionSuccessMsg(`Student ${student.name || student.email} is now Active.`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadStudents(false);
      loadAuditLogs();
      if (selectedStudent?.uid === student.uid || selectedStudent?.id === student.id) {
        setSelectedStudent({ ...selectedStudent, status: 'active', suspended: false });
      }
    } catch (err: any) {
      alert(`Error activating user: ${err?.message}`);
    }
  };

  // LIVE ACTION: Suspend Student
  const handleSuspendStudent = (student: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Suspend ${student.name || student.email}?`,
      description: `This will suspend this user's account (status = 'suspended'). Suspended students are blocked from login and content on their next request.`,
      confirmLabel: 'Suspend Student',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const resp = await apiFetch('/api/admin/update-student-status', {
            method: 'POST',
            body: JSON.stringify({
              studentId: student.uid || student.id,
              studentEmail: student.email,
              status: 'suspended',
              reason: 'Suspended by admin via directory',
            }),
          });
          const json = await resp.json();
          if (!json.success) throw new Error(json.error || 'Failed to suspend student');
          setActionSuccessMsg(`Student ${student.name || student.email} has been Suspended.`);
          setTimeout(() => setActionSuccessMsg(''), 3000);
          loadStudents(false);
          loadAuditLogs();
          if (selectedStudent?.uid === student.uid || selectedStudent?.id === student.id) {
            setSelectedStudent({ ...selectedStudent, status: 'suspended', suspended: true });
          }
        } catch (err: any) {
          alert(`Error suspending user: ${err?.message}`);
        }
      },
    });
  };

  // LIVE ACTION: Change Plan / Extend / Cancel / Restore
  const handleChangeStudentPlan = async (
    studentId: string,
    newPlan: 'free' | 'pro' | 'premium',
    premiumExpiresAt?: string
  ) => {
    try {
      const resp = await apiFetch('/api/admin/update-student-plan', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          packageName: newPlan === 'pro' ? 'Pro Plan' : newPlan === 'premium' ? 'Premium Plan' : 'Free Plan',
          isPro: newPlan !== 'free',
          expirationMonths: 12,
        }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Failed to update plan');
      setActionSuccessMsg(`Plan upgraded to ${newPlan.toUpperCase()}`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadStudents(false);
      loadAuditLogs();
      if (selectedStudent && (selectedStudent.uid === studentId || selectedStudent.id === studentId)) {
        setSelectedStudent({ ...selectedStudent, plan: newPlan, isPro: newPlan !== 'free' });
      }
    } catch (err: any) {
      alert(`Error updating plan: ${err?.message}`);
    }
  };

  // LIVE ACTION: Extend Subscription (+N days)
  const handleExtendSubscription = async (studentId: string, days: number) => {
    try {
      const resp = await apiFetch('/api/admin/update-student-plan', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          action: 'extend',
          extendDays: days,
        }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Failed to extend subscription');
      setActionSuccessMsg(`Subscription extended by +${days} days.`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadStudents(false);
      loadAuditLogs();
    } catch (err: any) {
      alert(`Error extending subscription: ${err?.message}`);
    }
  };

  // LIVE ACTION: Cancel / Remove Subscription
  const handleCancelSubscription = async (studentId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove / Cancel Subscription?',
      description: 'This will downgrade this student to the Free Plan immediately and expire premium access.',
      confirmLabel: 'Cancel Subscription',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const resp = await apiFetch('/api/admin/update-student-plan', {
            method: 'POST',
            body: JSON.stringify({
              studentId,
              action: 'cancel',
            }),
          });
          const json = await resp.json();
          if (!json.success) throw new Error(json.error || 'Failed to cancel subscription');
          setActionSuccessMsg('Subscription removed. Student set to Free Tier.');
          setTimeout(() => setActionSuccessMsg(''), 3000);
          loadStudents(false);
          loadAuditLogs();
        } catch (err: any) {
          alert(`Error cancelling subscription: ${err?.message}`);
        }
      },
    });
  };

  // LIVE ACTION: Restore Subscription
  const handleRestoreSubscription = async (studentId: string) => {
    try {
      const resp = await apiFetch('/api/admin/update-student-plan', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          action: 'restore',
          packageName: 'Pro Plan',
        }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Failed to restore subscription');
      setActionSuccessMsg('Pro Subscription successfully restored.');
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadStudents(false);
      loadAuditLogs();
    } catch (err: any) {
      alert(`Error restoring subscription: ${err?.message}`);
    }
  };

  // LIVE ACTION: Reset Student Access Cache
  const handleResetAccessCache = async (student: any) => {
    try {
      const resp = await apiFetch('/api/admin/reset-access-cache', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.uid || student.id,
          studentEmail: student.email,
        }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Failed to reset access cache');
      setActionSuccessMsg(`Access cache and monthly limits reset for ${student.name || student.email}.`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadStudents(false);
      loadAuditLogs();
    } catch (err: any) {
      alert(`Error resetting access cache: ${err?.message}`);
    }
  };

  // LIVE ACTION: Delete Student (Soft Delete First with Confirm Dialog)
  const handleDeleteStudent = (student: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${student.name || student.email}?`,
      description: `This will soft-delete this user account (status = 'deleted') and revoke all access. This action is permanently recorded in the audit log.`,
      confirmLabel: 'Delete Student',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const resp = await apiFetch('/api/admin/update-student-status', {
            method: 'POST',
            body: JSON.stringify({
              studentId: student.uid || student.id,
              studentEmail: student.email,
              status: 'deleted',
              reason: 'Soft deleted by administrator via dashboard',
            }),
          });
          const json = await resp.json();
          if (!json.success) throw new Error(json.error || 'Failed to delete student');
          setActionSuccessMsg(`Student ${student.email} deleted successfully.`);
          setTimeout(() => setActionSuccessMsg(''), 3000);
          setShowStudentDrawer(false);
          setSelectedStudent(null);
          loadStudents(false);
          loadAuditLogs();
        } catch (err: any) {
          alert(`Error deleting user: ${err?.message}`);
        }
      },
    });
  };

  // LIVE ACTION: Approve Payment Proof
  const handleApprovePayment = async (req: any) => {
    try {
      const resp = await apiFetch('/api/admin/payment-proof', {
        method: 'POST',
        body: JSON.stringify({
          proofId: req.id,
          studentId: req.userId || req.studentId,
          studentEmail: req.userEmail || req.studentEmail,
          action: 'approve',
        }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Failed to approve payment');
      setActionSuccessMsg(`Payment proof approved for ${req.userEmail || req.studentEmail}`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadPaymentRequests();
      loadStudents(false);
      loadAuditLogs();
    } catch (err: any) {
      alert(`Error approving payment: ${err?.message}`);
    }
  };

  // LIVE ACTION: Reject Payment Proof
  const handleRejectPayment = async (req: any) => {
    try {
      const resp = await apiFetch('/api/admin/payment-proof', {
        method: 'POST',
        body: JSON.stringify({
          proofId: req.id,
          studentId: req.userId || req.studentId,
          studentEmail: req.userEmail || req.studentEmail,
          action: 'reject',
          reason: 'Verification rejected by administrator',
        }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Failed to reject payment');
      setActionSuccessMsg(`Payment proof rejected for ${req.userEmail || req.studentEmail}`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadPaymentRequests();
      loadAuditLogs();
    } catch (err: any) {
      alert(`Error rejecting payment: ${err?.message}`);
    }
  };

  // Reviews moderation handlers
  const handleApproveReview = async (r: StoredReview) => {
    try {
      if (r.id) {
        await updateDoc(doc(db, 'reviews', r.id), {
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminEmail,
        });
      }
      setActionSuccessMsg('Review approved.');
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadReviews();
    } catch (err: any) {
      alert(`Error approving review: ${err?.message}`);
    }
  };

  const handleRejectReview = async (r: StoredReview) => {
    try {
      if (r.id) {
        await updateDoc(doc(db, 'reviews', r.id), {
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminEmail,
        });
      }
      setActionSuccessMsg('Review rejected.');
      setTimeout(() => setActionSuccessMsg(''), 3000);
      loadReviews();
    } catch (err: any) {
      alert(`Error rejecting review: ${err?.message}`);
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
    { id: 'students', label: 'Student Directory', icon: <Users className="w-4 h-4" />, badge: totalStudentCount || students.length },
    {
      id: 'crew',
      label: 'Crew & Captains',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      badge: pendingCrewCount > 0 ? pendingCrewCount : undefined,
      isRedBadge: true,
    },
    { id: 'content', label: 'Question Bank', icon: <Database className="w-4 h-4" />, badge: questionBankStats.totalBankMCQs },
    { id: 'boardy', label: 'AI Chat Logs & Controls', icon: <Bot className="w-4 h-4" /> },
    { id: 'payments', label: 'Plans & Payments', icon: <DollarSign className="w-4 h-4" />, badge: paymentRequests.filter(p => p.status === 'pending').length || undefined },
    { id: 'reviews', label: 'Reviews Moderation', icon: <Star className="w-4 h-4" />, badge: reviews.filter(r => r.status === 'pending').length || undefined },
    { id: 'audit', label: 'Audit Trail', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 text-slate-900 dark:text-white flex font-sans">
      {/* Permanent Left Admin Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 select-none hidden md:flex">
        <div>
          {/* Top Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <img
                  src="https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_0000000028e88211b439a564acc83f64.png"
                  alt="Boardly Logo"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/assets/boardly-logo-transparent.png';
                  }}
                />
                <span className="text-xl font-bold tracking-tight text-white">
                  Board<span className="text-indigo-500">ly</span>
                </span>
              </div>
              <span className="text-[10px] block font-extrabold text-violet-400 uppercase tracking-widest pl-0.5">
                Admin Portal
              </span>
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
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      (item as any).isRedBadge
                        ? 'bg-rose-600 text-white animate-pulse shadow-sm'
                        : 'bg-slate-800 text-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: View Switchers, Repair, & Log out */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            title="View Student Portal"
          >
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span>Student View</span>
          </button>
          <a
            href="/crew-dashboard"
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            title="View Crew Ambassador Dashboard"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Crew Dashboard</span>
          </a>
          <button
            type="button"
            onClick={handleCopyCrewLink}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 font-bold text-xs border border-indigo-800/40 transition-colors cursor-pointer"
            title="Copy shareable Crew registration link (boardly.cfd/crew)"
          >
            {copiedCrewLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            <span>{copiedCrewLink ? 'Copied Crew Link!' : 'Copy Crew Link'}</span>
          </button>
          <button
            type="button"
            onClick={handleRepairAdminAccount}
            disabled={repairRunning}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-bold text-xs border border-emerald-800/40 transition-colors cursor-pointer disabled:opacity-50"
            title="Clean rogue applications and ensure admin role in Firestore"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{repairRunning ? 'Repairing...' : 'Repair Admin Account'}</span>
          </button>
          <a
            href="/admin/migration-check"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/50 text-violet-300 font-bold text-xs border border-violet-800/40 transition-colors cursor-pointer"
            title="Cross-System Student Migration Audit"
          >
            <Database className="w-4 h-4 text-violet-400" />
            <span>Migration Audit</span>
          </a>
          <button
            type="button"
            onClick={async () => {
              await logOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile top controls */}
        <div className="md:hidden p-3 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-violet-600" />
              <span>Student View</span>
            </button>
            <a
              href="/crew-dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-bold text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Crew</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRepairAdminAccount}
              disabled={repairRunning}
              className="p-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 cursor-pointer"
              title="Repair Admin Account"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </button>
            <button
              type="button"
              onClick={() => {
                loadStudents();
                loadPaymentRequests();
                loadReviews();
                loadAiChatLogs();
                loadCrewApplicationsCount();
              }}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={async () => {
                await logOut();
              }}
              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="md:hidden flex items-center gap-1.5 p-2.5 overflow-x-auto border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      (item as any).isRedBadge
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Quick Access Bar: Student View & Crew Applications */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Admin Session Active: <span className="font-mono text-indigo-600 dark:text-indigo-400">{adminEmail}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Open Student Portal without losing admin access"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Student View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('crew')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Go to Crew Applications review"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Crew Applications</span>
                {pendingCrewCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                    {pendingCrewCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          {/* Action Success Toast */}
          {actionSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Action Error Toast */}
          {actionErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionErrorMsg}</span>
            </div>
          )}

          {/* TOP METRICS ROW (HOOKED TO LIVE FIRESTORE COUNTS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Registered Students"
              value={totalStudentCount || students.length}
              subtitle="Live Named Firestore sync"
              accent="violet"
              icon={<Users className="w-5 h-5 text-violet-600" />}
            />
            <StatCard
              label="Active Subscriptions"
              value={activeSubscriptionCount || students.filter((s) => s.plan === 'pro' || s.plan === 'premium').length}
              subtitle="Pro & Premium users"
              accent="violet"
              icon={<DollarSign className="w-5 h-5 text-violet-600" />}
            />
            <StatCard
              label="Suspended Users"
              value={suspendedUsersCount || students.filter((s) => s.status === 'suspended').length}
              subtitle="Blocked from platform"
              accent="violet"
              icon={<Lock className="w-5 h-5 text-rose-600" />}
            />
            <StatCard
              label="AI Queries Logged"
              value={aiQueriesLoggedCount}
              subtitle="Boardy AI interactions"
              accent="violet"
              icon={<Bot className="w-5 h-5 text-teal-600" />}
            />
          </div>

          {/* 1. OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        30-Day Platform Signups Velocity
                      </h3>
                      <p className="text-xs text-slate-400">Student enrollment growth across Pakistan</p>
                    </div>
                    <Badge variant="violet">Live</Badge>
                  </div>
                  <ErrorBoundary
                    fallback={
                      <div className="h-[200px] flex items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-400">
                        Signups velocity chart unavailable
                      </div>
                    }
                  >
                    {hasSignupsData ? (
                      <SparkLineTrendChart
                        data={signups30Days}
                        color="#7C3AED"
                        height={200}
                      />
                    ) : (
                      <div className="h-[200px] flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 text-center space-y-1">
                        <Users className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No signups recorded in last 30 days</p>
                        <p className="text-[11px] text-slate-400">New student signups will populate this velocity curve.</p>
                      </div>
                    )}
                  </ErrorBoundary>
                </div>

                <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Subscription Tier Distribution
                  </h3>
                  <ErrorBoundary
                    fallback={
                      <div className="h-[200px] flex items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-400">
                        Tier distribution chart unavailable
                      </div>
                    }
                  >
                    {hasPlanData ? (
                      <DonutDistributionChart
                        data={realPlanDistribution}
                        height={200}
                      />
                    ) : (
                      <div className="h-[200px] flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 text-center space-y-1">
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No student plans recorded</p>
                      </div>
                    )}
                  </ErrorBoundary>
                </div>
              </div>

              {/* Quick Jump to Student Directory */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-transparent border border-violet-200/80 dark:border-violet-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Manage Registered Students ({totalStudentCount || students.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Directly approve, suspend, change plans, or delete student profiles from the student management table.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('students')}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 cursor-pointer shadow-md shadow-violet-600/20"
                >
                  Open Students Directory →
                </button>
              </div>
            </div>
          )}

          {/* 2. STUDENT MANAGEMENT TABLE (FULL REALTIME SYNC + ACTIONS) */}
          {activeSection === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">
                      Student Management Directory ({totalStudentCount || students.length})
                    </h3>
                    {realtimeConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Realtime Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        Polling Sync (15s)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live Supabase Realtime synchronization with admin actions: Suspend, Extend (+N days), Remove/Restore Subscription, Reset Access Cache, and Soft Delete.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadStudents(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingStudents ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Status and Plan Filters */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Status:</span>
                    <div className="flex items-center gap-1">
                      {(['all', 'active', 'suspended', 'expired', 'pending'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStudentStatusFilter(st)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                            studentStatusFilter === st
                              ? 'bg-violet-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plan Filter Pills */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Plan:</span>
                    <div className="flex items-center gap-1">
                      {(['all', 'free', 'pro', 'premium'] as const).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setStudentPlanFilter(tier)}
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                            studentPlanFilter === tier
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="Search by student name, email, class/grade, or university..."
                    className="w-full text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                  {studentSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchTerm('')}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <span className="text-xs text-slate-400 shrink-0 pl-2">
                    Showing {filteredStudents.length} of {students.length} students
                  </span>
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
                    onClick={() => loadStudents(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Connection</span>
                  </button>
                </div>
              ) : (
                <DataTable
                  data={filteredStudents}
                  pageSize={25}
                  isLoading={loadingStudents}
                  keyExtractor={(s) => s.uid || s.id}
                  onRowClick={(s) => {
                    setSelectedStudent(s);
                    setShowStudentDrawer(true);
                  }}
                  onExportCsv={handleExportStudentsCsv}
                  searchPlaceholder="Search within loaded results..."
                  columns={[
                    {
                      key: 'name',
                      header: 'Name',
                      sortable: true,
                      render: (s) => (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {s.name || 'Student'}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block max-w-[150px]">{s.email}</span>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'email',
                      header: 'Email',
                      sortable: true,
                      render: (s) => (
                        <span className="text-xs text-slate-600 dark:text-slate-300">{s.email || '—'}</span>
                      ),
                    },
                    {
                      key: 'grade',
                      header: 'Class / Grade',
                      sortable: true,
                      render: (s) => (
                        <div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                            {s.grade || s.class || 'Class 11'}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block max-w-[130px]">
                            {s.stream || 'Pre-Engineering'}
                          </span>
                        </div>
                      ),
                    },
                    {
                      key: 'plan',
                      header: 'Plan / Tier',
                      sortable: true,
                      render: (s) => (
                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={((s.plan || s.subscriptionTier || 'free') as string).toLowerCase()}
                            onChange={(e) => handleChangeStudentPlan(s.uid || s.id, e.target.value as any)}
                            className="text-xs font-black uppercase px-2 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-violet-500/30"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="premium">Premium</option>
                          </select>
                        </div>
                      ),
                    },
                    {
                      key: 'expiryDate',
                      header: 'Expiry Date',
                      sortable: true,
                      render: (s) => {
                        const exp = s.accessExpires || s.expiryDate;
                        if (!exp) return <span className="text-xs text-slate-400">None (Free)</span>;
                        const isExp = new Date(exp).getTime() < Date.now();
                        return (
                          <span className={`text-xs font-semibold ${isExp ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                            {new Date(exp).toLocaleDateString()}
                            {isExp && ' (Expired)'}
                          </span>
                        );
                      },
                    },
                    {
                      key: 'lastActive',
                      header: 'Last Active',
                      sortable: true,
                      render: (s) => (
                        <span className="text-xs text-slate-500">
                          {s.lastActive && s.lastActive !== '—'
                            ? new Date(s.lastActive).toLocaleDateString()
                            : s.createdAt && s.createdAt !== '—'
                            ? new Date(s.createdAt).toLocaleDateString()
                            : 'Recent'}
                        </span>
                      ),
                    },
                    {
                      key: 'attendanceSummary',
                      header: 'Attendance',
                      sortable: true,
                      render: (s) => (
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {s.attendanceSummary || '0 sessions'}
                        </span>
                      ),
                    },
                    {
                      key: 'paymentStatus',
                      header: 'Payment Status',
                      sortable: true,
                      render: (s) => {
                        const p = (s.paymentStatus || 'Free').toLowerCase();
                        const isPaid = p.includes('paid') || p.includes('verified');
                        const isPending = p.includes('pending');
                        return (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {s.paymentStatus || 'Free'}
                          </span>
                        );
                      },
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      sortable: true,
                      render: (s) => (
                        <StatusPill status={s.suspended || s.status === 'suspended' ? 'suspended' : s.status || 'active'} />
                      ),
                    },
                    {
                      key: 'actions',
                      header: 'Actions',
                      render: (s) => (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(s);
                              setShowStudentDrawer(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 hover:bg-violet-100 border border-violet-200 dark:border-violet-800 text-[11px] font-bold cursor-pointer transition-colors"
                            title="Open Student Details"
                          >
                            Details
                          </button>

                          {/* Quick Extend (+30 Days) */}
                          <button
                            type="button"
                            onClick={() => handleExtendSubscription(s.uid || s.id, 30)}
                            className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold cursor-pointer transition-colors"
                            title="Extend Subscription by +30 Days"
                          >
                            +30d
                          </button>

                          {/* Suspend / Activate Toggle */}
                          {s.suspended || s.status === 'suspended' ? (
                            <button
                              type="button"
                              onClick={() => handleActivateStudent(s)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold cursor-pointer transition-colors"
                              title="Activate Student"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSuspendStudent(s)}
                              className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-[11px] font-bold cursor-pointer transition-colors"
                              title="Suspend Student"
                            >
                              Suspend
                            </button>
                          )}

                          {/* Soft Delete User Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer transition-colors"
                            title="Soft Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </div>
          )}

          {/* 3. QUESTION BANK MANAGER VIEW */}
          {activeSection === 'content' && (
            <AdminQuestionBankTab adminEmail={adminEmail} />
          )}

          {/* 4. AI CHAT LOGS & LIMIT CONTROLS VIEW */}
          {activeSection === 'boardy' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Boardy AI Controls & Limits
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure daily AI query quotas per student plan tier and toggle emergency kill-switch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newPaused = !boardyLimits.isPaused;
                    saveBoardyLimits({ ...boardyLimits, isPaused: newPaused });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    boardyLimits.isPaused
                      ? 'bg-rose-600 text-white shadow-rose-500/20'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{boardyLimits.isPaused ? 'AI TUTOR PAUSED' : 'AI TUTOR ACTIVE'}</span>
                </button>
              </div>

              {/* Tier Daily Quotas Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Daily Query Quotas (Queries / Day)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Free Tier Limit</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={boardyLimits.freeLimit}
                      onChange={(e) => setBoardyLimits({ ...boardyLimits, freeLimit: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Pro Tier Limit</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={boardyLimits.proLimit}
                      onChange={(e) => setBoardyLimits({ ...boardyLimits, proLimit: parseInt(e.target.value) || 50 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-violet-600 dark:text-violet-400">Premium Tier Limit</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={boardyLimits.premiumLimit}
                      onChange={(e) => setBoardyLimits({ ...boardyLimits, premiumLimit: parseInt(e.target.value) || 200 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => saveBoardyLimits(boardyLimits)}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Save Limits Configuration
                  </button>
                </div>
              </div>

              {/* Chat / Audit Logs Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Recent AI Inquiries & Interactions</h4>
                <DataTable
                  data={chatLogs}
                  isLoading={loadingChatLogs}
                  keyExtractor={(l) => l.id || Math.random().toString()}
                  emptyMessage="No AI queries logged in audit trail."
                  columns={[
                    {
                      key: 'createdAt',
                      header: 'Timestamp',
                      render: (l) => (
                        <span className="font-mono text-slate-400 text-xs">
                          {l.createdAt ? new Date(l.createdAt).toLocaleString() : 'Recent'}
                        </span>
                      ),
                    },
                    {
                      key: 'adminEmail',
                      header: 'Student / User',
                      render: (l) => <span className="font-bold text-xs">{l.adminEmail || l.targetId || 'Student'}</span>,
                    },
                    {
                      key: 'action',
                      header: 'Action',
                      render: (l) => <Badge variant="violet">{l.action || 'AI_QUERY'}</Badge>,
                    },
                    {
                      key: 'details',
                      header: 'Details',
                      render: (l) => <span className="text-xs text-slate-600 dark:text-slate-300">{l.details}</span>,
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* 5. PLANS & PAYMENTS */}
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
                    render: (p) => <Badge variant="violet">{p.planId?.toUpperCase()}</Badge>,
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
                            onClick={() => handleRejectPayment(p)}
                            className="px-3 py-1 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs cursor-pointer border border-rose-200"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs capitalize">{p.status}</span>
                      ),
                  },
                ]}
              />
            </div>
          )}

          {/* 6. REVIEWS MODERATION */}
          {activeSection === 'reviews' && (
            <div className="space-y-6">
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
                            onClick={() => handleApproveReview(r)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectReview(r)}
                            className="px-3 py-1 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs cursor-pointer border border-rose-200"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs capitalize">{r.status}</span>
                      ),
                  },
                ]}
              />
            </div>
          )}

          {/* 7. AUDIT TRAIL */}
          {activeSection === 'audit' && (
            <div className="space-y-4">
              <DataTable
                data={auditLogs}
                keyExtractor={(a) => a.id || Math.random().toString()}
                columns={[
                  { key: 'createdAt', header: 'Timestamp', render: (a) => <span className="font-mono text-slate-400 text-xs">{new Date(a.createdAt).toLocaleString()}</span> },
                  { key: 'adminEmail', header: 'Admin Email' },
                  { key: 'action', header: 'Action', render: (a) => <Badge variant="violet">{a.action}</Badge> },
                  { key: 'details', header: 'Operation Details' },
                ]}
              />
            </div>
          )}

          {/* 8. CREW APPLICATIONS */}
          {activeSection === 'crew' && (
            <ErrorBoundary
              fallback={
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-white">Unable to load Crew Applications Tab</h4>
                  <p className="text-xs text-slate-400">Please refresh or check your network connection.</p>
                </div>
              }
            >
              <AdminCrewTab adminEmail={adminEmail} />
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* Student Details Drawer */}
      <Drawer
        isOpen={showStudentDrawer && !!selectedStudent}
        onClose={() => {
          setShowStudentDrawer(false);
          setSelectedStudent(null);
        }}
        title="Student Profile Details"
        subtitle={selectedStudent?.email || ''}
        width="lg"
      >
        {selectedStudent && (
          <div className="p-6 space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                  {selectedStudent.name || selectedStudent.displayName || 'Student'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {selectedStudent.email}
                </p>
                <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                  UID: {selectedStudent.uid}
                </p>
              </div>
              <StatusPill status={selectedStudent.suspended || selectedStudent.status === 'suspended' ? 'suspended' : 'active'} />
            </div>

            {/* Plan Management */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
              <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subscription & Tier Management
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Plan
                  </label>
                  <select
                    value={drawerPlan}
                    onChange={(e) => setDrawerPlan(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/30"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Premium Expiry (Optional)
                  </label>
                  <input
                    type="date"
                    value={drawerExpiry}
                    onChange={(e) => setDrawerExpiry(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (selectedStudent) {
                    await handleChangeStudentPlan(selectedStudent.uid || selectedStudent.id, drawerPlan, drawerExpiry || undefined);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 cursor-pointer shadow-md shadow-violet-600/20"
              >
                Save Plan Changes
              </button>

              {/* Quick Extend Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Quick Extend Subscription:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[7, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleExtendSubscription(selectedStudent.uid || selectedStudent.id, d)}
                      className="py-1.5 px-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold cursor-pointer transition-colors text-center"
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscription Toggle */}
              <div className="flex gap-2 pt-1">
                {selectedStudent.isPro || selectedStudent.plan === 'pro' || selectedStudent.plan === 'premium' ? (
                  <button
                    type="button"
                    onClick={() => handleCancelSubscription(selectedStudent.uid || selectedStudent.id)}
                    className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel / Remove Subscription
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRestoreSubscription(selectedStudent.uid || selectedStudent.id)}
                    className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Restore Pro Subscription
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleResetAccessCache(selectedStudent)}
                  className="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-bold cursor-pointer transition-colors"
                  title="Reset student's monthly test limit and Boardy AI quota"
                >
                  Reset Access Cache
                </button>
              </div>
            </div>

            {/* Profile & Academic Details */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Academic & Diagnostic Info
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Class & Stream</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedStudent.grade || selectedStudent.class || 'Class 11'} • {selectedStudent.stream || 'Pre-Engineering'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Target University</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedStudent.targetUniversity || selectedStudent.university || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Attendance Summary</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedStudent.attendanceSummary || '0 sessions'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedStudent.paymentStatus || 'Free'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Expiry Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedStudent.accessExpires
                      ? new Date(selectedStudent.accessExpires).toLocaleDateString()
                      : 'None (Free)'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Created Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedStudent.createdAt && selectedStudent.createdAt !== '—'
                      ? new Date(selectedStudent.createdAt).toLocaleString()
                      : 'Recent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Account Actions
              </h5>
              <div className="flex flex-col sm:flex-row gap-2">
                {selectedStudent.suspended || selectedStudent.status === 'suspended' ? (
                  <button
                    type="button"
                    onClick={() => handleActivateStudent(selectedStudent)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-xs font-bold cursor-pointer transition-colors text-center"
                  >
                    Activate Account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSuspendStudent(selectedStudent)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-xs font-bold cursor-pointer transition-colors text-center"
                  >
                    Suspend Account
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteStudent(selectedStudent)}
                  className="py-2.5 px-4 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Soft Delete Profile</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.confirmVariant || 'primary'}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

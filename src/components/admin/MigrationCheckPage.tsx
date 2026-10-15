import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import supabaseExportData from '../../data/supabase_students_export.json';
import {
  ArrowLeft,
  Users,
  Database,
  Link2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Shield,
  Download,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface LegacySupabaseStudent {
  id: string;
  name: string;
  email: string;
  grade?: string;
  stream?: string;
  target_university?: string;
  plan?: string;
  created_at?: string;
}

export interface FirestoreStudentUser {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  legacy_supabase_uid?: string;
  firebase_auth_linked?: boolean;
  linked?: boolean;
  role?: string;
  plan?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  onboardingCompleted?: boolean;
  [key: string]: any;
}

interface MigrationCheckPageProps {
  onBack: () => void;
}

export const MigrationCheckPage: React.FC<MigrationCheckPageProps> = ({ onBack }) => {
  const { user, isAdmin } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firestoreUsers, setFirestoreUsers] = useState<FirestoreStudentUser[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'imported' | 'not_imported' | 'new_students'>('imported');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [actionErrorMsg, setActionErrorMsg] = useState<string>('');
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const supabaseStudents: LegacySupabaseStudent[] = useMemo(() => {
    return Array.isArray(supabaseExportData) ? (supabaseExportData as LegacySupabaseStudent[]) : [];
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: FirestoreStudentUser[] = snap.docs.map((d) => ({
        id: d.id,
        uid: d.id,
        ...(d.data() as any),
      }));
      setFirestoreUsers(list);
    } catch (err: any) {
      console.error('[MigrationCheck] Failed to fetch Firestore users:', err?.code || 'UNKNOWN', err?.message || err, err);
      setError(err?.message || 'Failed to load Firestore users. Missing or insufficient permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);

  // Lookup map of Firestore users by trimmed lowercase email
  const firestoreByEmail = useMemo(() => {
    const map = new Map<string, FirestoreStudentUser>();
    for (const u of firestoreUsers) {
      const email = (u.email || '').trim().toLowerCase();
      if (email) {
        map.set(email, u);
      }
    }
    return map;
  }, [firestoreUsers]);

  // Table 1: Legacy students imported (Firestore users docs with legacy_supabase_uid)
  const legacyImported = useMemo(() => {
    return firestoreUsers.filter((u) => Boolean(u.legacy_supabase_uid));
  }, [firestoreUsers]);

  // Table 2: Legacy students NOT imported (rows in Supabase export JSON whose email does not match any Firestore users doc)
  const legacyNotImported = useMemo(() => {
    return supabaseStudents.filter((s) => {
      const email = (s.email || '').trim().toLowerCase();
      if (!email) return false;
      return !firestoreByEmail.has(email);
    });
  }, [supabaseStudents, firestoreByEmail]);

  // Table 3: New students (Firestore users docs WITHOUT legacy_supabase_uid)
  const newStudents = useMemo(() => {
    return firestoreUsers.filter((u) => !u.legacy_supabase_uid && u.role !== 'admin');
  }, [firestoreUsers]);

  // Linking handler for unlinked legacy rows
  const handleLinkStudent = async (student: FirestoreStudentUser) => {
    const docId = student.id || student.uid;
    if (!docId) return;

    setLinkingId(docId);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const userRef = doc(db, 'users', docId);
      const email = (student.email || '').trim().toLowerCase();

      await updateDoc(userRef, {
        firebase_auth_linked: true,
        linked: true,
        linked_by_email: email,
        linked_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setActionSuccessMsg(`Successfully linked legacy account for "${student.name || email}" to Firebase Auth.`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      console.error('[MigrationCheck] Link operation failed:', err?.code || 'UNKNOWN', err?.message || err, err);
      setActionErrorMsg(`Failed to link account: ${err?.message || 'Firestore write error'}`);
      setTimeout(() => setActionErrorMsg(''), 5000);
    } finally {
      setLinkingId(null);
    }
  };

  // Import single legacy student into Firestore
  const handleImportLegacyStudent = async (legacy: LegacySupabaseStudent) => {
    const legacyId = legacy.id;
    setLinkingId(legacyId);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const targetDocId = `legacy_${legacyId}`;
      const userRef = doc(db, 'users', targetDocId);
      const nowStr = new Date().toISOString();

      await setDoc(userRef, {
        legacy_supabase_uid: legacyId,
        name: legacy.name || 'Student',
        email: legacy.email.trim().toLowerCase(),
        plan: legacy.plan || 'starter',
        grade: legacy.grade || 'Class 12',
        stream: legacy.stream || 'Pre-Medical',
        targetUniversity: legacy.target_university || '',
        role: 'student',
        roles: ['student'],
        status: 'active',
        firebase_auth_linked: false,
        linked: false,
        createdAt: legacy.created_at || nowStr,
        importedAt: nowStr,
        onboardingCompleted: true,
      }, { merge: true });

      setActionSuccessMsg(`Imported "${legacy.name}" (${legacy.email}) into Firestore.`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      console.error('[MigrationCheck] Import failed:', err?.code || 'UNKNOWN', err?.message || err, err);
      setActionErrorMsg(`Failed to import student: ${err?.message || 'Error writing to Firestore'}`);
      setTimeout(() => setActionErrorMsg(''), 5000);
    } finally {
      setLinkingId(null);
    }
  };

  // Helper to determine whether a legacy row is linked
  const isLinked = (student: FirestoreStudentUser): boolean => {
    if (student.firebase_auth_linked === true || student.linked === true) return true;
    // Check if doc ID is a native Firebase Auth UID (typically 28 alphanumeric chars)
    const id = student.id || student.uid || '';
    if (id && !id.startsWith('legacy_') && !id.startsWith('std-') && id.length >= 20) {
      return true;
    }
    return false;
  };

  // Filtered views by search query
  const filteredImported = useMemo(() => {
    if (!searchTerm.trim()) return legacyImported;
    const q = searchTerm.toLowerCase();
    return legacyImported.filter((u) =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.legacy_supabase_uid || '').toLowerCase().includes(q)
    );
  }, [legacyImported, searchTerm]);

  const filteredNotImported = useMemo(() => {
    if (!searchTerm.trim()) return legacyNotImported;
    const q = searchTerm.toLowerCase();
    return legacyNotImported.filter((s) =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q)
    );
  }, [legacyNotImported, searchTerm]);

  const filteredNewStudents = useMemo(() => {
    if (!searchTerm.trim()) return newStudents;
    const q = searchTerm.toLowerCase();
    return newStudents.filter((u) =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q) ||
      (u.plan || '').toLowerCase().includes(q)
    );
  }, [newStudents, searchTerm]);

  // Export CSV summary
  const handleExportSummaryCsv = () => {
    const headers = ['Category', 'Name', 'Email', 'Legacy Supabase UID', 'Firebase UID', 'Linked Status', 'Plan', 'Created Date'];
    const rows: string[][] = [];

    legacyImported.forEach((u) => {
      rows.push([
        'Legacy Imported',
        `"${u.name || ''}"`,
        u.email || '',
        u.legacy_supabase_uid || '',
        u.id || '',
        isLinked(u) ? 'Yes' : 'No',
        u.plan || 'free',
        u.createdAt || u.created_at || '',
      ]);
    });

    legacyNotImported.forEach((s) => {
      rows.push([
        'Legacy NOT Imported',
        `"${s.name || ''}"`,
        s.email || '',
        s.id || '',
        '—',
        'No',
        s.plan || 'free',
        s.created_at || '',
      ]);
    });

    newStudents.forEach((u) => {
      rows.push([
        'New Native Student',
        `"${u.name || ''}"`,
        u.email || '',
        '—',
        u.id || '',
        'Yes (Native Auth)',
        u.plan || 'free',
        u.createdAt || u.created_at || '',
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `boardly_migration_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Admin access gatekeeper
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Admin Authorization Required</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">
          Access to cross-system student migration audit is restricted to verified platform administrators (shsvirtualadmin@gmail.com).
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 text-slate-900 dark:text-white font-sans">
      {/* Header Bar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Return to Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Student Migration & Cross-System Audit
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  /admin/migration-check
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live comparison between static Supabase export and Named Firestore users collection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSummaryCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
              title="Export complete migration audit to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Toast Notifications */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {actionErrorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Database Query Error</span>
            </div>
            <p>{error}</p>
          </div>
        )}

        {/* 4 Summary Total Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Legacy Imported */}
          <div
            onClick={() => setActiveTab('imported')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer ${
              activeTab === 'imported'
                ? 'bg-violet-50/60 dark:bg-violet-950/30 border-violet-500 shadow-md shadow-violet-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">1. Legacy Imported</span>
              <span className="p-2 rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <Database className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {loading ? '...' : legacyImported.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Firestore docs with <span className="font-mono text-violet-600 dark:text-violet-400">legacy_supabase_uid</span>
              </p>
            </div>
          </div>

          {/* Card 2: Legacy NOT Imported */}
          <div
            onClick={() => setActiveTab('not_imported')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer ${
              activeTab === 'not_imported'
                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">2. Legacy NOT Imported</span>
              <span className="p-2 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {loading ? '...' : legacyNotImported.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                In export JSON, absent from Firestore
              </p>
            </div>
          </div>

          {/* Card 3: New Native Students */}
          <div
            onClick={() => setActiveTab('new_students')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer ${
              activeTab === 'new_students'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">3. New Students</span>
              <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {loading ? '...' : newStudents.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Firestore docs without legacy ID
              </p>
            </div>
          </div>

          {/* Card 4: Supabase Export Baseline */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Export Baseline</span>
              <span className="p-2 rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {supabaseStudents.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Total records in static export JSON
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls & Search Bar */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('imported')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'imported'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              1. Legacy Imported ({legacyImported.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('not_imported')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'not_imported'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              2. NOT Imported ({legacyNotImported.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new_students')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'new_students'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              3. New Students ({newStudents.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or UID..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABLE 1: Legacy students imported */}
        {/* ========================================================================= */}
        {activeTab === 'imported' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Legacy Students Imported into Firestore ({filteredImported.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Students with <span className="font-mono text-violet-600 dark:text-violet-400">legacy_supabase_uid</span>. Unlinked rows can be paired with Firebase Auth by email.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Legacy Supabase UID</th>
                    <th className="py-3 px-4">Linked to Auth UID</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredImported.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        {loading ? 'Loading student records...' : 'No imported legacy students found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredImported.map((student) => {
                      const linked = isLinked(student);
                      const isWorking = linkingId === (student.id || student.uid);

                      return (
                        <tr key={student.id || student.uid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {student.name || 'Student'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {student.email || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {student.legacy_supabase_uid || '—'}
                          </td>
                          <td className="py-3 px-4">
                            {linked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle className="w-3 h-3" />
                                <span>Yes</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <XCircle className="w-3 h-3" />
                                <span>No</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 uppercase text-[10px] font-black">
                            {student.plan || 'Free'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!linked ? (
                              <button
                                type="button"
                                onClick={() => handleLinkStudent(student)}
                                disabled={isWorking}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                <Link2 className="w-3 h-3" />
                                <span>{isWorking ? 'Linking...' : 'Link now'}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Linked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TABLE 2: Legacy students NOT imported */}
        {/* ========================================================================= */}
        {activeTab === 'not_imported' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Legacy Students NOT Imported ({filteredNotImported.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Rows in the static Supabase export JSON whose trimmed lowercase email is missing from Firestore.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Export Email</th>
                    <th className="py-3 px-4">Supabase ID</th>
                    <th className="py-3 px-4">Class & Stream</th>
                    <th className="py-3 px-4">Target University</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredNotImported.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        All legacy students from the export file have been successfully imported into Firestore!
                      </td>
                    </tr>
                  ) : (
                    filteredNotImported.map((legacy) => {
                      const isWorking = linkingId === legacy.id;

                      return (
                        <tr key={legacy.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {legacy.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {legacy.email}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {legacy.id}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {legacy.grade || 'Class 12'} • {legacy.stream || 'Pre-Medical'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {legacy.target_university || '—'}
                          </td>
                          <td className="py-3 px-4 uppercase text-[10px] font-black">
                            {legacy.plan || 'starter'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleImportLegacyStudent(legacy)}
                              disabled={isWorking}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{isWorking ? 'Importing...' : 'Import to Firestore'}</span>
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
        )}

        {/* ========================================================================= */}
        {/* TABLE 3: New students (Firestore users docs without legacy_supabase_uid) */}
        {/* ========================================================================= */}
        {activeTab === 'new_students' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  New Students ({filteredNewStudents.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Firestore users documents registered natively without a <span className="font-mono">legacy_supabase_uid</span>.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Firebase UID</th>
                    <th className="py-3 px-4">Plan / Tier</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredNewStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        {loading ? 'Loading new students...' : 'No native new students recorded.'}
                      </td>
                    </tr>
                  ) : (
                    filteredNewStudents.map((student) => (
                      <tr key={student.id || student.uid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {student.name || 'Student'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {student.email || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                          {student.id || student.uid}
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px] font-black">
                          {student.plan || 'free'}
                        </td>
                        <td className="py-3 px-4 capitalize text-[11px] text-slate-600 dark:text-slate-400">
                          {student.role || 'student'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            student.status === 'suspended'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {student.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {student.createdAt || student.created_at
                            ? new Date(student.createdAt || student.created_at).toLocaleDateString()
                            : 'Recent'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

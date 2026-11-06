import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Upload,
  FileSpreadsheet,
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Compass,
  Copy,
  Check,
  Download,
  Award,
  Users,
  Trophy,
  BarChart3,
  Globe,
  Lock,
  ShieldAlert,
  UserMinus,
  Ban,
  X,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import { useAuth } from '@/contexts/AuthContext';
import {
  parseAmbassadorQuestionsCsv,
  createAmbassadorTest,
  updateAmbassadorTest,
  togglePublishAmbassadorTest,
  getTestsByCaptain,
  getAmbassadorTestById,
  deleteAmbassadorTest,
  getTestResultsForCaptain,
  SAMPLE_CSV_TEMPLATE,
  type AmbassadorCustomTest,
  type AmbassadorTestQuestion,
  type AmbassadorTestAttempt,
} from '@/services/ambassadorTestService';
import {
  getMyCrewD1,
  createCrewD1,
  toggleSuspendCrewMemberD1,
  removeCrewMemberD1,
  type D1Crew,
  type D1CrewMember,
} from '@/services/crewService';
import { NAKAMA_CAPTAIN_SINGULAR } from '@/constants/branding';
import { showApiToast } from '@/lib/api';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import {
  getPublicProfiles,
  getCachedPublicProfile,
  type PublicUserProfileSummary,
} from '@/services/publicProfileService';
import { isAdminAccount } from '@/constants/superAdmin';

const SUBJECT_OPTIONS = [
  'Physics',
  'Mathematics',
  'Chemistry',
  'Biology',
  'English',
  'Computer Science',
  'IQ / Analytical',
  'Full Mock',
];

type CaptainTab = 'tests' | 'results' | 'crew';

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'rank-badge rank-badge--1';
  if (rank === 2) return 'rank-badge rank-badge--2';
  if (rank === 3) return 'rank-badge rank-badge--3';
  return 'rank-badge rank-badge--default';
}

export function AmbassadorDashboardPage() {
  const { user, profile, isAdmin } = useAuth();

  // Active tab: My Tests | Results | Crew
  const [activeTab, setActiveTab] = useState<CaptainTab>('tests');

  // Data state
  const [myTests, setMyTests] = useState<AmbassadorCustomTest[]>([]);
  const [crew, setCrew] = useState<D1Crew | null>(null);
  const [crewMembers, setCrewMembers] = useState<D1CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Results tab state
  const [selectedResultTestId, setSelectedResultTestId] = useState<string>('');
  const [testResults, setTestResults] = useState<AmbassadorTestAttempt[]>([]);
  const [profilesByUid, setProfilesByUid] = useState<Record<string, PublicUserProfileSummary>>({});
  const [loadingResults, setLoadingResults] = useState(false);

  // Create / Edit Test Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [targetQuestionCount, setTargetQuestionCount] = useState<string>('20');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [csvText, setCsvText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<AmbassadorTestQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savingTest, setSavingTest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clampQuestionCount = (raw: string): number => {
    const trimmed = raw.trim();
    if (!trimmed) return 20;
    const parsed = parseInt(trimmed, 10);
    if (!Number.isFinite(parsed)) return 20;
    return Math.max(1, Math.min(200, parsed));
  };

  // Delete confirmation modal state
  const [deleteConfirmTest, setDeleteConfirmTest] = useState<AmbassadorCustomTest | null>(null);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);

  // Crew actions state
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewUniversity, setNewCrewUniversity] = useState('');
  const [creatingCrew, setCreatingCrew] = useState(false);
  const [memberActionUid, setMemberActionUid] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const captainName =
    profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Captain';
  const crewNameDisplay =
    crew?.name || (profile as any)?.crewName || `${captainName}'s Grand Line Crew`;

  const loadCaptainWorkspace = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [testsList, crewBundle] = await Promise.all([
        getTestsByCaptain(user.uid).catch(() => []),
        getMyCrewD1().catch(() => ({ crew: null, members: [] })),
      ]);
      setMyTests(testsList);
      setCrew(crewBundle.crew);
      setCrewMembers(crewBundle.members);
      if (testsList.length > 0 && !selectedResultTestId) {
        setSelectedResultTestId(testsList[0].id);
      }
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to load Captain workspace.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedResultTestId]);

  useEffect(() => {
    loadCaptainWorkspace();
  }, [loadCaptainWorkspace]);

  // Load per-test student results when Results tab or selected test changes
  useEffect(() => {
    if (activeTab !== 'results' || !selectedResultTestId) {
      return;
    }
    let active = true;
    setLoadingResults(true);
    getTestResultsForCaptain(selectedResultTestId)
      .then((rows) => {
        if (active) setTestResults(rows);
      })
      .catch(() => {
        if (active) setTestResults([]);
      })
      .finally(() => {
        if (active) setLoadingResults(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, selectedResultTestId]);

  // Re-parse CSV whenever csvText changes
  useEffect(() => {
    if (!csvText.trim()) {
      if (!editingTestId) {
        setParsedQuestions([]);
      }
      setParseErrors([]);
      return;
    }
    const { questions, errors } = parseAmbassadorQuestionsCsv(csvText);
    setParsedQuestions(questions);
    setParseErrors(errors);
    if (questions.length > 0) {
      setTargetQuestionCount(String(Math.max(1, Math.min(200, questions.length))));
    }
  }, [csvText, editingTestId]);

  // Computed stats for the 4 top stat cards
  const testsCreatedCount = myTests.length;
  const totalAttemptsCount = myTests.reduce((acc, t) => acc + (Number(t.attemptsCount) || 0), 0);
  const averageScorePct = (() => {
    const withAttempts = myTests.filter((t) => (Number(t.attemptsCount) || 0) > 0);
    if (withAttempts.length === 0) return 0;
    const weightedSum = withAttempts.reduce(
      (acc, t) => acc + (Number(t.avgScore) || 0) * (Number(t.attemptsCount) || 1),
      0
    );
    const countSum = withAttempts.reduce((acc, t) => acc + (Number(t.attemptsCount) || 1), 0);
    return countSum > 0 ? Math.round(weightedSum / countSum) : 0;
  })();
  const crewMembersCount =
    crewMembers.filter((m) => m.status === 'active').length || (crew?.memberCount ?? 0);

  const openCreateModal = () => {
    setEditingTestId(null);
    setTitle('');
    setSubject('Physics');
    setTargetQuestionCount('20');
    setVisibility('public');
    setCsvText('');
    setParsedQuestions([]);
    setParseErrors([]);
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEditModal = async (testItem: AmbassadorCustomTest) => {
    setEditingTestId(testItem.id);
    setTitle(testItem.title);
    setSubject(testItem.subject);
    setTargetQuestionCount(String(Math.max(1, Math.min(200, testItem.questionCount || 20))));
    setVisibility(testItem.visibility || 'public');
    setCsvText('');
    setParseErrors([]);
    setSubmitError(null);
    setParsedQuestions(testItem.questions || []);
    setModalOpen(true);

    try {
      const fullTest = await getAmbassadorTestById(testItem.id, true);
      if (fullTest && fullTest.questions.length > 0) {
        setParsedQuestions(fullTest.questions);
        setTargetQuestionCount(String(Math.max(1, Math.min(200, fullTest.questions.length))));
      }
    } catch {
      // keep existing metadata
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boardly_captain_test_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAndPublishTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitError(null);

    if (!title.trim()) {
      const msg = 'Please enter a test title.';
      setSubmitError(msg);
      showApiToast(msg, 'error');
      return;
    }

    const clampedCount = clampQuestionCount(targetQuestionCount);
    setTargetQuestionCount(String(clampedCount));

    const questionsToSave =
      parsedQuestions.length > clampedCount
        ? parsedQuestions.slice(0, clampedCount)
        : parsedQuestions.slice(0, 200);

    if (questionsToSave.length === 0) {
      const msg = 'Please upload or paste at least 1 valid question.';
      setSubmitError(msg);
      showApiToast(msg, 'error');
      return;
    }

    setSavingTest(true);
    try {
      if (editingTestId) {
        await updateAmbassadorTest(editingTestId, {
          title: title.trim(),
          subject,
          visibility,
          status: 'published',
          questions: questionsToSave,
        });
        showApiToast('Test updated successfully.', 'success');
      } else {
        await createAmbassadorTest({
          title: title.trim(),
          subject,
          visibility,
          status: 'published',
          questions: questionsToSave,
          captainUid: user.uid,
          captainName,
          crewName: crewNameDisplay,
        });
        showApiToast(
          `Published "${title.trim()}" (${questionsToSave.length} questions)!`,
          'success'
        );
      }

      setModalOpen(false);
      await loadCaptainWorkspace();
    } catch (err: any) {
      const errorMsg =
        err?.code && !String(err?.message || '').includes(err.code)
          ? `${err?.message || 'Error'} (${err.code})`
          : err?.message || 'Could not save test.';
      setSubmitError(errorMsg);
    } finally {
      setSavingTest(false);
    }
  };

  const handleTogglePublish = async (testItem: AmbassadorCustomTest) => {
    setTogglingPublishId(testItem.id);
    const nextStatus = testItem.status === 'published' ? 'unpublished' : 'published';
    try {
      await togglePublishAmbassadorTest(testItem.id, { status: nextStatus });
      setMyTests((prev) =>
        prev.map((t) =>
          t.id === testItem.id
            ? {
                ...t,
                status: nextStatus,
                isPublic: t.visibility === 'public' && nextStatus === 'published',
              }
            : t
        )
      );
      showApiToast(
        nextStatus === 'published' ? 'Test is now published.' : 'Test unpublished.',
        'success'
      );
    } catch (err: any) {
      showApiToast(err?.message || 'Could not update publish status.', 'error');
    } finally {
      setTogglingPublishId(null);
    }
  };

  const handleConfirmDeleteTest = async () => {
    if (!deleteConfirmTest) return;
    setDeletingTestId(deleteConfirmTest.id);
    try {
      await deleteAmbassadorTest(deleteConfirmTest.id);
      setMyTests((prev) => prev.filter((t) => t.id !== deleteConfirmTest.id));
      if (selectedResultTestId === deleteConfirmTest.id) {
        setSelectedResultTestId('');
      }
      showApiToast('Test deleted.', 'success');
      setDeleteConfirmTest(null);
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to delete test.', 'error');
    } finally {
      setDeletingTestId(null);
    }
  };

  const handleCreateCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewName.trim()) {
      showApiToast('Please enter a crew name.', 'error');
      return;
    }
    setCreatingCrew(true);
    try {
      const created = await createCrewD1({
        name: newCrewName.trim(),
        university: newCrewUniversity.trim(),
        captainName,
        captainEmail: user?.email || '',
      });
      setCrew(created);
      setNewCrewName('');
      setNewCrewUniversity('');
      showApiToast(`Crew "${created.name}" created!`, 'success');
      await loadCaptainWorkspace();
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to create crew.', 'error');
    } finally {
      setCreatingCrew(false);
    }
  };

  const handleToggleSuspendMember = async (member: D1CrewMember) => {
    if (!crew) return;
    setMemberActionUid(member.userUid);
    try {
      const res = await toggleSuspendCrewMemberD1(crew.id, member.userUid);
      setCrewMembers((prev) =>
        prev.map((m) => (m.userUid === member.userUid ? { ...m, status: res.status } : m))
      );
      showApiToast(
        res.status === 'suspended'
          ? `${member.userName} suspended.`
          : `${member.userName} reactivated.`,
        'success'
      );
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to update member status.', 'error');
    } finally {
      setMemberActionUid(null);
    }
  };

  const handleRemoveMember = async (member: D1CrewMember) => {
    if (!crew) return;
    setMemberActionUid(member.userUid);
    try {
      await removeCrewMemberD1(crew.id, member.userUid);
      setCrewMembers((prev) => prev.filter((m) => m.userUid !== member.userUid));
      showApiToast(`${member.userName} removed from crew.`, 'success');
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to remove member.', 'error');
    } finally {
      setMemberActionUid(null);
    }
  };

  const copyCrewCode = () => {
    if (!crew?.code) return;
    navigator.clipboard.writeText(crew.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-5 pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
      {/* ── CAPTAIN HOME HEADER ──────────────────────────────────────────────── */}
      <div className="captain-glass-panel p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D71921]/15 border border-[#D71921]/30 text-[#D71921] text-[11px] font-mono uppercase tracking-wider mb-2">
              <Award size={12} />
              <span>{NAKAMA_CAPTAIN_SINGULAR} Deck</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-[var(--text)] truncate">
              {captainName}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5 truncate">
              Crew: <span className="text-[var(--text)] font-medium">{crewNameDisplay}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              to="/grand-line"
              title="Explore Grand Line"
              aria-label="Explore Grand Line"
              className="captain-glass-card captain-glass-card--interactive min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[var(--text)] inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Compass size={15} className="text-[#D71921] shrink-0" />
              <span>Grand Line</span>
            </Link>

            <button
              type="button"
              onClick={openCreateModal}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D71921] text-white text-xs sm:text-sm font-bold hover:opacity-95 inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <Plus size={16} />
              <span>Create Test</span>
            </button>
          </div>
        </div>

        {/* ── 4 STAT CARDS (Uniform icon color & equal height) ───────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-5 items-stretch">
          <div className="captain-glass-card p-3.5 sm:p-4 min-h-[88px] h-full flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 text-[var(--muted)]">
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">
                Tests created
              </span>
              <span className="w-7 h-7 rounded-lg bg-[#D71921]/12 border border-[#D71921]/25 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={14} className="text-[#D71921]" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-2 font-sans tabular-nums">
              {loading ? '—' : testsCreatedCount}
            </p>
          </div>

          <div className="captain-glass-card p-3.5 sm:p-4 min-h-[88px] h-full flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 text-[var(--muted)]">
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">
                Total attempts
              </span>
              <span className="w-7 h-7 rounded-lg bg-[#D71921]/12 border border-[#D71921]/25 flex items-center justify-center shrink-0">
                <BarChart3 size={14} className="text-[#D71921]" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-2 font-sans tabular-nums">
              {loading ? '—' : totalAttemptsCount}
            </p>
          </div>

          <div className="captain-glass-card p-3.5 sm:p-4 min-h-[88px] h-full flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 text-[var(--muted)]">
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">
                Average score
              </span>
              <span className="w-7 h-7 rounded-lg bg-[#D71921]/12 border border-[#D71921]/25 flex items-center justify-center shrink-0">
                <Trophy size={14} className="text-[#D71921]" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-2 font-sans tabular-nums">
              {loading ? '—' : `${averageScorePct}%`}
            </p>
          </div>

          <div className="captain-glass-card p-3.5 sm:p-4 min-h-[88px] h-full flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 text-[var(--muted)]">
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">
                Crew members
              </span>
              <span className="w-7 h-7 rounded-lg bg-[#D71921]/12 border border-[#D71921]/25 flex items-center justify-center shrink-0">
                <Users size={14} className="text-[#D71921]" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-2 font-sans tabular-nums">
              {loading ? '—' : crewMembersCount}
            </p>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS: My Tests | Results | Crew (Aligned Pill Style) ──── */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'tests', label: 'My Tests', count: testsCreatedCount },
              { id: 'results', label: 'Results', count: totalAttemptsCount },
              { id: 'crew', label: 'Crew', count: crewMembersCount },
            ] as const
          ).map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#D71921] text-white border border-[#D71921] shadow-[0_6px_18px_-4px_rgba(215,25,33,0.45)]'
                    : 'captain-glass-card captain-glass-card--interactive text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                    active
                      ? 'bg-black/25 text-white'
                      : 'bg-black/[0.06] dark:bg-white/[0.08] text-[var(--muted)]'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={loadCaptainWorkspace}
          disabled={loading}
          className="captain-glass-card captain-glass-card--interactive min-h-[44px] min-w-[44px] px-3.5 rounded-full text-[var(--muted)] hover:text-[var(--text)] inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          title="Refresh workspace"
          aria-label="Refresh workspace"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline text-xs font-semibold">Refresh</span>
        </button>
      </div>

      {/* ── TAB 1: MY TESTS ──────────────────────────────────────────────────── */}
      {activeTab === 'tests' && (
        <div className="space-y-3">
          {loading ? (
            <LineLoader context="dashboard" variant="section" />
          ) : myTests.length === 0 ? (
            <div className="captain-glass-panel p-8 text-center">
              <FileSpreadsheet size={32} className="mx-auto text-[var(--muted)] mb-2.5" />
              <p className="text-sm font-bold text-[var(--text)]">No Captain tests created yet</p>
              <p className="text-xs text-[var(--muted)] mt-1 max-w-md mx-auto">
                Click &ldquo;Create Test&rdquo; above to upload questions and publish your first test to the Grand Line.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D71921] text-white text-xs font-bold cursor-pointer"
              >
                <Plus size={14} />
                Create Your First Test
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {myTests.map((t) => {
                const isPublished = t.status === 'published';
                const isPublic = t.visibility === 'public';
                const qCount = Number(t.questionCount) || 0;
                const aCount = Number(t.attemptsCount) || 0;
                return (
                  <div
                    key={t.id}
                    className="captain-glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#D71921]/15 text-[#D71921] text-[10px] font-mono font-semibold uppercase">
                          {t.subject}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
                            isPublic
                              ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-500/15 text-[var(--muted)] border border-zinc-500/30'
                          }`}
                        >
                          {isPublic ? <Globe size={10} /> : <Lock size={10} />}
                          {isPublic ? 'Public' : 'Private'}
                        </span>
                        {!isPublished && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-mono font-semibold">
                            Unpublished
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[var(--text)] break-words">
                        {t.title}
                      </h3>

                      <div className="flex items-center gap-2.5 text-xs text-[var(--muted)] flex-wrap tabular-nums">
                        <span>
                          {qCount} {qCount === 1 ? 'question' : 'questions'}
                        </span>
                        <span>•</span>
                        <span>
                          {aCount} {aCount === 1 ? 'attempt' : 'attempts'}
                        </span>
                        {typeof t.avgScore === 'number' && aCount > 0 && (
                          <>
                            <span>•</span>
                            <span>Avg {Math.round(t.avgScore)}%</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(t)}
                        disabled={togglingPublishId === t.id}
                        className="captain-glass-card captain-glass-card--interactive relative overflow-hidden min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text)] inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>
                          {togglingPublishId === t.id
                            ? 'Saving...'
                            : isPublished
                            ? 'Unpublish'
                            : 'Publish'}
                        </span>
                        {togglingPublishId === t.id && <ButtonLineLoader />}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="captain-glass-card captain-glass-card--interactive min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text)] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedResultTestId(t.id);
                          setActiveTab('results');
                        }}
                        className="captain-glass-card captain-glass-card--interactive min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text)] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <BarChart3 size={13} />
                        <span>Results</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmTest(t)}
                        className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 dark:text-red-400 hover:bg-red-500/20 inline-flex items-center justify-center cursor-pointer"
                        title="Delete Test"
                        aria-label={`Delete test ${t.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: RESULTS ───────────────────────────────────────────────────── */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {myTests.length === 0 ? (
            <div className="captain-glass-panel p-8 text-center">
              <Trophy size={32} className="mx-auto text-[var(--muted)] mb-2.5" />
              <p className="text-sm font-bold text-[var(--text)]">No tests to show results for</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Create and publish a test first so students can attempt it.
              </p>
            </div>
          ) : (
            <>
              {/* Per-test selector list */}
              <div className="captain-glass-panel p-4 sm:p-5 space-y-3">
                <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  SELECT TEST TO VIEW STUDENT RANKINGS
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-stretch">
                  {myTests.map((t) => {
                    const isSelected = selectedResultTestId === t.id;
                    const aCount = Number(t.attemptsCount) || 0;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedResultTestId(t.id)}
                        className={`captain-glass-card min-h-[64px] p-3.5 text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'captain-glass-card--selected text-[var(--text)]'
                            : 'captain-glass-card--interactive text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                            {t.title}
                          </p>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5 tabular-nums truncate">
                            {t.subject} • {aCount} {aCount === 1 ? 'attempt' : 'attempts'}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className={isSelected ? 'text-[#D71921] shrink-0' : 'text-[var(--muted)] shrink-0'}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Per-student scores and ranking */}
              <div className="captain-glass-panel p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    STUDENT SCORES &amp; RANKING
                  </h3>
                  <span className="text-xs text-[var(--muted)] font-mono tabular-nums">
                    {testResults.length} {testResults.length === 1 ? 'submission' : 'submissions'}
                  </span>
                </div>

                {loadingResults ? (
                  <LineLoader context="results" variant="section" />
                ) : testResults.length === 0 ? (
                  <div className="captain-glass-card py-8 px-4 text-center">
                    <Users size={28} className="mx-auto text-[var(--muted)] mb-2" />
                    <p className="text-xs font-semibold text-[var(--text)]">
                      No attempts recorded for this test yet
                    </p>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">
                      Share this test with your crew or on the Grand Line to see student rankings here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {testResults.map((r, index) => {
                      const rank = r.rank ?? index + 1;
                      const mins = Math.floor((r.timeTakenSeconds || 0) / 60);
                      const secs = (r.timeTakenSeconds || 0) % 60;
                      const uid = (r.studentUid || '').trim();
                      const liveProfile = uid ? profilesByUid[uid] : undefined;
                      const displayName =
                        (r.userName || r.studentName || liveProfile?.displayName || '').trim() ||
                        'Student';
                      const isCurrentUser = Boolean(user?.uid && uid && uid === user.uid);
                      const isSuperAdminActor =
                        Boolean(liveProfile?.isSuperAdmin) || isAdminAccount(uid, displayName);

                      return (
                        <div
                          key={r.id || `${rank}-${displayName}-${index}`}
                          className={`ranking-glass-row min-h-[68px] p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 ${
                            isCurrentUser ? 'ranking-glass-row--highlight' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                            <span className={getRankBadgeClass(rank)}>#{rank}</span>
                            <div className="w-[44px] h-[44px] shrink-0 flex items-center justify-center">
                              <BoardlyAvatar
                                uid={uid || `${rank}-${displayName}`}
                                name={displayName}
                                photoURL={liveProfile?.photoURL || r.userAvatar || null}
                                avatar={liveProfile?.avatar || null}
                                equippedAvatarId={liveProfile?.equippedAvatarId || null}
                                customAvatarUrl={liveProfile?.customAvatarUrl || null}
                                equippedFrameId={liveProfile?.equippedFrameId || null}
                                isSuperAdmin={isSuperAdminActor}
                                size={44}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                                  {displayName}
                                </p>
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D71921] text-white shrink-0">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--muted)] font-mono tabular-nums truncate mt-0.5">
                                Time: {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} · {r.percentage}% accuracy
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 whitespace-nowrap tabular-nums pl-2">
                            <p className="text-xs sm:text-sm font-bold text-[var(--text)] font-mono whitespace-nowrap">
                              {r.score}/{r.totalQuestions}
                            </p>
                            <p className="text-[11px] font-bold text-[#D71921] whitespace-nowrap mt-0.5">
                              {r.percentage}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 3: CREW ──────────────────────────────────────────────────────── */}
      {activeTab === 'crew' && (
        <div className="space-y-4">
          {loading ? (
            <LineLoader context="dashboard" variant="section" />
          ) : !crew ? (
            <div className="captain-glass-panel p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D71921]/15 text-[#D71921] flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">
                    Launch Your Nakama Crew
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Create your official crew to invite students, share private or public tests, and manage your roster.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateCrew} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Crew Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCrewName}
                    onChange={(e) => setNewCrewName(e.target.value)}
                    placeholder="e.g. NUST Seeker Squadron"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Target University / Campus (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCrewUniversity}
                    onChange={(e) => setNewCrewUniversity(e.target.value)}
                    placeholder="e.g. NUST / FAST / MDCAT"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingCrew}
                  className="relative overflow-hidden min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D71921] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  <span>{creatingCrew ? 'Creating...' : 'Create Crew'}</span>
                  {creatingCrew && <ButtonLineLoader />}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Crew Summary Card */}
              <div className="captain-glass-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[var(--text)] truncate">{crew.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase ${
                        crew.status === 'suspended'
                          ? 'bg-red-500/15 text-red-500 dark:text-red-400'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {crew.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Invite Code:{' '}
                    <span className="font-mono font-bold text-[var(--text)]">{crew.code}</span>
                    {crew.university ? ` • ${crew.university}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyCrewCode}
                  className="captain-glass-card captain-glass-card--interactive min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text)] inline-flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied Code' : 'Copy Invite Code'}</span>
                </button>
              </div>

              {/* Crew Members List */}
              <div className="captain-glass-panel p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    CREW MEMBERS
                  </h4>
                  <span className="text-xs font-mono text-[var(--muted)] tabular-nums">
                    {crewMembers.length} {crewMembers.length === 1 ? 'member' : 'members'}
                  </span>
                </div>

                {crewMembers.length === 0 ? (
                  <div className="captain-glass-card py-8 px-4 text-center">
                    <Users size={28} className="mx-auto text-[var(--muted)] mb-2" />
                    <p className="text-xs font-semibold text-[var(--text)]">No members yet</p>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">
                      Share invite code <span className="font-mono font-bold">{crew.code}</span> with students to grow your crew.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {crewMembers.map((m) => {
                      const isCaptainRow = m.role === 'captain' || m.userUid === crew.captainUid;
                      const canManage =
                        !isCaptainRow && (crew.captainUid === user?.uid || isAdmin);
                      const isSuspended = m.status === 'suspended';

                      return (
                        <div
                          key={m.id || m.userUid}
                          className="captain-glass-card p-3.5 flex flex-col xs:flex-row xs:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                                {m.userName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase ${
                                  isCaptainRow
                                    ? 'bg-[#D71921]/15 text-[#D71921]'
                                    : 'bg-black/[0.06] dark:bg-white/[0.08] text-[var(--muted)]'
                                }`}
                              >
                                {isCaptainRow ? 'Captain' : 'Member'}
                              </span>
                              {isSuspended && (
                                <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-500 dark:text-red-400 text-[10px] font-mono font-semibold">
                                  Suspended
                                </span>
                              )}
                            </div>
                            {m.userEmail && (
                              <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                                {m.userEmail}
                              </p>
                            )}
                          </div>

                          {canManage && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={memberActionUid === m.userUid}
                                onClick={() => handleToggleSuspendMember(m)}
                                className="captain-glass-card captain-glass-card--interactive min-h-[44px] px-3 py-1.5 rounded-xl text-[11px] font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Ban size={12} />
                                <span>{isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={memberActionUid === m.userUid}
                                onClick={() => handleRemoveMember(m)}
                                className="min-h-[44px] px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-[11px] font-semibold text-red-500 dark:text-red-400 hover:bg-red-500/20 inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <UserMinus size={12} />
                                <span>Remove</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT TEST MODAL (Full-screen sheet on mobile) ──────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl bg-[var(--card)] sm:rounded-2xl border-0 sm:border border-[var(--border)] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                  {editingTestId ? 'Edit Captain Test' : 'Create & Publish Test'}
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Configure test details and import questions
                </p>
              </div>
              <button
                type="button"
                onClick={() => !savingTest && setModalOpen(false)}
                className="p-2 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body */}
            <form
              id="captain-create-test-form"
              onSubmit={handleSaveAndPublishTest}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Test Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NUST NET-4 Physics High-Yield Mock #1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[#D71921]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                  >
                    {SUBJECT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Number of Questions
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={targetQuestionCount}
                    onChange={(e) => setTargetQuestionCount(e.target.value.replace(/\D/g, ''))}
                    onBlur={() =>
                      setTargetQuestionCount(String(clampQuestionCount(targetQuestionCount)))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] font-sans tabular-nums focus:outline-none focus:border-[#D71921]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setVisibility('public')}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        visibility === 'public'
                          ? 'bg-[#D71921] text-white'
                          : 'text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Globe size={12} />
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('private')}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        visibility === 'private'
                          ? 'bg-[#D71921] text-white'
                          : 'text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Lock size={12} />
                      Private
                    </button>
                  </div>
                </div>
              </div>

              {/* CSV Upload or Paste */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-[var(--text)]">
                    Upload or Paste Questions (CSV)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSampleCsv}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={12} />
                      Template
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-[#D71921]/15 border border-[#D71921]/30 text-[11px] font-semibold text-[#D71921] hover:bg-[#D71921]/25 flex items-center gap-1 cursor-pointer"
                    >
                      <Upload size={12} />
                      Choose File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleCsvFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`question,optionA,optionB,optionC,optionD,correctOption,explanation\n"What is the SI unit of force?","Joule","Newton","Watt","Pascal","B","F = ma is measured in Newtons."`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[#D71921]"
                />

                {/* Clear "X questions parsed" status banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={16}
                      className={
                        parsedQuestions.length > 0 ? 'text-emerald-400 shrink-0' : 'text-[var(--muted)] shrink-0'
                      }
                    />
                    <span className="text-xs font-bold text-[var(--text)] tabular-nums">
                      {parsedQuestions.length} {parsedQuestions.length === 1 ? 'question' : 'questions'} parsed
                    </span>
                  </div>
                  {parseErrors.length > 0 && (
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                      <AlertCircle size={13} />
                      {parseErrors.length} row issue{parseErrors.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                {parseErrors.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1 max-h-28 overflow-y-auto">
                    {parseErrors.slice(0, 5).map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span className="break-words">{submitError}</span>
                  </div>
                )}
              </div>
            </form>

            {/* Sticky Safe-Area Footer — never clipped */}
            <div className="px-4 sm:px-6 pt-3 pb-[calc(16px+env(safe-area-inset-bottom,0px))] border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                disabled={savingTest}
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="captain-create-test-form"
                disabled={savingTest || parsedQuestions.length === 0}
                className="relative overflow-hidden px-5 py-2.5 rounded-xl bg-[#D71921] text-white text-xs sm:text-sm font-bold hover:opacity-95 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={15} />
                <span>
                  {savingTest
                    ? 'Saving...'
                    : editingTestId
                    ? 'Save Changes'
                    : 'Create & Publish Test'}
                </span>
                {savingTest && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ────────────────────────────────────────── */}
      {deleteConfirmTest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Delete Test?</h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Are you sure you want to delete{' '}
                  <strong className="text-[var(--text)]">{deleteConfirmTest.title}</strong>? This will also remove all questions and student results for this test.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={Boolean(deletingTestId)}
                onClick={() => setDeleteConfirmTest(null)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(deletingTestId)}
                onClick={handleConfirmDeleteTest}
                className="relative overflow-hidden px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                <span>{deletingTestId ? 'Deleting...' : 'Delete Permanently'}</span>
                {Boolean(deletingTestId) && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AmbassadorDashboardPage;

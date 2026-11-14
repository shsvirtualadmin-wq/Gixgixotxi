import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useBodyScrollLock } from '@/utils/scrollLock';
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
  type PublicUserProfileSummary,
} from '@/services/publicProfileService';
import { isAdminAccount } from '@/constants/superAdmin';
import { ThemePicker } from '@/components/certificates/ThemePicker';
import { finaliseGrandLineTest } from '@/services/certificateService';

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

function getRankSquareClass(rank: number): string {
  if (rank === 1) return 'ncd-rank-square ncd-rank-square--1';
  return 'ncd-rank-square';
}

function getNcdPressHandlers(disabled?: boolean) {
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (disabled) return;
      e.currentTarget.classList.add('is-pressed');
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
  };
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
  const [profilesByUid] = useState<Record<string, PublicUserProfileSummary>>({});
  const [loadingResults, setLoadingResults] = useState(false);

  // Create / Edit Test Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [targetQuestionCount, setTargetQuestionCount] = useState<string>('20');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [certificateThemeId, setCertificateThemeId] = useState<string | null>(null);
  const [finalisingTestId, setFinalisingTestId] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<AmbassadorTestQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savingTest, setSavingTest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sliding tab bar refs & state
  const tabTrackRef = useRef<HTMLDivElement | null>(null);
  const tabBtnRefs = useRef<Record<CaptainTab, HTMLButtonElement | null>>({
    tests: null,
    results: null,
    crew: null,
  });
  const [tabPillMetric, setTabPillMetric] = useState<{ x: number; width: number }>({
    x: 5,
    width: 110,
  });

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

  // Lock background scroll while the Create/Edit Test modal or Delete modal is open
  useBodyScrollLock(modalOpen || Boolean(deleteConfirmTest), 'ambassador-dashboard-modal');
  useEffect(() => {
    const isAnyModalOpen = modalOpen || Boolean(deleteConfirmTest);
    if (!isAnyModalOpen) return;

    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new CustomEvent('boardly:modal-change'));

    return () => {
      document.body.removeAttribute('data-fullscreen-modal-open');
      window.dispatchEvent(new CustomEvent('boardly:modal-change'));
    };
  }, [modalOpen, deleteConfirmTest]);

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

  // Measure sliding tab indicator position
  const updateTabIndicator = useCallback(() => {
    const trackEl = tabTrackRef.current;
    const btnEl = tabBtnRefs.current[activeTab];
    if (!trackEl || !btnEl) return;
    const trackRect = trackEl.getBoundingClientRect();
    const btnRect = btnEl.getBoundingClientRect();
    setTabPillMetric({
      x: Math.round(btnRect.left - trackRect.left),
      width: Math.round(btnRect.width),
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    updateTabIndicator();
  }, [updateTabIndicator, testsCreatedCount, totalAttemptsCount, crewMembersCount]);

  useEffect(() => {
    window.addEventListener('resize', updateTabIndicator);
    return () => window.removeEventListener('resize', updateTabIndicator);
  }, [updateTabIndicator]);

  const openCreateModal = () => {
    setEditingTestId(null);
    setTitle('');
    setSubject('Physics');
    setTargetQuestionCount('20');
    setVisibility('public');
    setCertificateThemeId(null);
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
    setCertificateThemeId(testItem.certificateThemeId || null);
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
          certificateThemeId,
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
          certificateThemeId,
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
    <div className="ncd-root w-full max-w-full min-w-0 overflow-x-hidden space-y-5 pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
      {/* ── 1. HEADER CARD (28px radius, 24px padding) & 2. STAT TILES ────────── */}
      <div className="ncd-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <div className="ncd-chip-red w-fit">
              <Award size={12} />
              <span>{NAKAMA_CAPTAIN_SINGULAR} Deck</span>
            </div>
            <h1
              className="ncd-font-doto tracking-tight leading-none truncate pt-0.5"
              style={{
                fontSize: 'clamp(28px, 6vw, 38px)',
                color: 'var(--cw-text)',
              }}
            >
              {captainName}
            </h1>
            <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--cw-muted)' }}>
              Crew:{' '}
              <span className="font-bold" style={{ color: 'var(--cw-text)' }}>
                {crewNameDisplay}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Link
              to="/grand-line"
              title="Explore Grand Line"
              aria-label="Explore Grand Line"
              {...getNcdPressHandlers()}
              className="ncd-btn ncd-glass min-h-[44px] px-4 py-2.5 text-xs sm:text-sm"
              style={{ color: 'var(--cw-text)' }}
            >
              <Compass size={15} style={{ color: 'var(--cw-red-text)' }} className="shrink-0" />
              <span>Grand Line</span>
            </Link>

            <button
              type="button"
              onClick={openCreateModal}
              {...getNcdPressHandlers()}
              className="ncd-btn ncd-glass-red min-h-[44px] px-5 py-2.5 text-xs sm:text-sm shrink-0"
            >
              <Plus size={16} />
              <span>Create Test</span>
            </button>
          </div>
        </div>

        {/* ── 2. STAT TILES (4 in a row on desktop, 2x2 on mobile) ───────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 items-stretch">
          <div className="ncd-stat-tile min-h-[96px] h-full flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-medium truncate"
                style={{ color: 'var(--cw-muted)' }}
              >
                Tests created
              </span>
              <span className="ncd-stat-icon-badge shrink-0">
                <FileSpreadsheet size={15} />
              </span>
            </div>
            <p
              className="ncd-font-doto text-2xl sm:text-3xl mt-2 tabular-nums leading-none"
              style={{ color: 'var(--cw-text)' }}
            >
              {loading ? '—' : testsCreatedCount}
            </p>
          </div>

          <div className="ncd-stat-tile min-h-[96px] h-full flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-medium truncate"
                style={{ color: 'var(--cw-muted)' }}
              >
                Total attempts
              </span>
              <span className="ncd-stat-icon-badge shrink-0">
                <BarChart3 size={15} />
              </span>
            </div>
            <p
              className="ncd-font-doto text-2xl sm:text-3xl mt-2 tabular-nums leading-none"
              style={{ color: 'var(--cw-text)' }}
            >
              {loading ? '—' : totalAttemptsCount}
            </p>
          </div>

          <div className="ncd-stat-tile min-h-[96px] h-full flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-medium truncate"
                style={{ color: 'var(--cw-muted)' }}
              >
                Average score
              </span>
              <span className="ncd-stat-icon-badge shrink-0">
                <Trophy size={15} />
              </span>
            </div>
            <p
              className="ncd-font-doto text-2xl sm:text-3xl mt-2 tabular-nums leading-none"
              style={{ color: 'var(--cw-text)' }}
            >
              {loading ? '—' : `${averageScorePct}%`}
            </p>
          </div>

          <div className="ncd-stat-tile min-h-[96px] h-full flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-medium truncate"
                style={{ color: 'var(--cw-muted)' }}
              >
                Crew members
              </span>
              <span className="ncd-stat-icon-badge shrink-0">
                <Users size={15} />
              </span>
            </div>
            <p
              className="ncd-font-doto text-2xl sm:text-3xl mt-2 tabular-nums leading-none"
              style={{ color: 'var(--cw-text)' }}
            >
              {loading ? '—' : crewMembersCount}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. TAB BAR: My Tests | Results | Crew + Refresh Glass Pill ───────── */}
      <div className="flex items-center justify-between gap-2.5 pb-1">
        <div
          ref={tabTrackRef}
          role="tablist"
          aria-label="Captain workspace sections"
          className="ncd-tab-track overflow-x-auto no-scrollbar max-w-full"
        >
          {/* Sliding Red Glass Pill */}
          <div
            aria-hidden="true"
            className="ncd-tab-pill"
            style={{
              width: `${tabPillMetric.width}px`,
              translate: `${tabPillMetric.x}px 0`,
            }}
          />

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
                ref={(el) => {
                  tabBtnRefs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.id)}
                {...getNcdPressHandlers()}
                className="ncd-btn relative z-10 min-h-[38px] px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-bold shrink-0"
                style={{
                  color: active ? '#ffffff' : 'var(--cw-muted)',
                }}
              >
                <span>{t.label}</span>
                <span
                  className="ncd-tab-count tabular-nums"
                  style={{
                    backgroundColor: active
                      ? 'rgba(0, 0, 0, 0.24)'
                      : 'var(--cw-card2)',
                    color: active ? '#ffffff' : 'var(--cw-muted)',
                  }}
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
          {...getNcdPressHandlers(loading)}
          className="ncd-btn ncd-glass min-h-[44px] min-w-[44px] px-4 text-xs font-bold shrink-0"
          style={{ color: 'var(--cw-text)' }}
          title="Refresh workspace"
          aria-label="Refresh workspace"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── 4. TAB 1: MY TESTS ───────────────────────────────────────────────── */}
      {activeTab === 'tests' && (
        <div className="space-y-3">
          {loading ? (
            <LineLoader context="dashboard" variant="section" />
          ) : myTests.length === 0 ? (
            <div className="ncd-card text-center py-10">
              <FileSpreadsheet
                size={32}
                className="mx-auto mb-2.5"
                style={{ color: 'var(--cw-muted)' }}
              />
              <p className="text-sm font-bold" style={{ color: 'var(--cw-text)' }}>
                No Captain tests created yet
              </p>
              <p
                className="text-xs mt-1 max-w-md mx-auto"
                style={{ color: 'var(--cw-muted)' }}
              >
                Click &ldquo;Create Test&rdquo; above to upload questions and publish your first test to the Grand Line.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                {...getNcdPressHandlers()}
                className="ncd-btn ncd-glass-red mt-4 min-h-[44px] px-5 py-2.5 text-xs"
              >
                <Plus size={14} />
                <span>Create Your First Test</span>
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
                    className="ncd-test-row flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="ncd-chip-red">{t.subject}</span>

                        <span className={isPublic ? 'ncd-chip-green' : 'ncd-chip-muted'}>
                          {isPublic ? <Globe size={11} /> : <Lock size={11} />}
                          <span>{isPublic ? 'Public' : 'Private'}</span>
                        </span>

                        {!isPublished && (
                          <span className="ncd-chip-gold">Unpublished</span>
                        )}
                      </div>

                      <h3
                        className="text-sm sm:text-base font-bold break-words"
                        style={{ color: 'var(--cw-text)' }}
                      >
                        {t.title}
                      </h3>

                      <div
                        className="flex items-center gap-2 text-xs flex-wrap tabular-nums"
                        style={{ color: 'var(--cw-muted)' }}
                      >
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

                    {/* Actions: glass pill buttons + round red-tinted Delete button; full width on mobile */}
                    <div
                      className="w-full sm:w-auto flex items-center gap-2 flex-wrap shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0"
                      style={{ borderColor: 'var(--cw-line)' }}
                    >
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(t)}
                        disabled={togglingPublishId === t.id}
                        {...getNcdPressHandlers(togglingPublishId === t.id)}
                        className="ncd-btn ncd-glass flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 text-xs relative overflow-hidden"
                        style={{ color: 'var(--cw-text)' }}
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
                        {...getNcdPressHandlers()}
                        className="ncd-btn ncd-glass flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 text-xs"
                        style={{ color: 'var(--cw-text)' }}
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
                        {...getNcdPressHandlers()}
                        className="ncd-btn ncd-glass flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 text-xs"
                        style={{ color: 'var(--cw-text)' }}
                      >
                        <BarChart3 size={13} />
                        <span>Results</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmTest(t)}
                        {...getNcdPressHandlers()}
                        className="ncd-btn ncd-btn-delete shrink-0"
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

      {/* ── 5 & 6. TAB 2: RESULTS & STUDENT SCORES/RANKING ───────────────────── */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {myTests.length === 0 ? (
            <div className="ncd-card text-center py-10">
              <Trophy
                size={32}
                className="mx-auto mb-2.5"
                style={{ color: 'var(--cw-muted)' }}
              />
              <p className="text-sm font-bold" style={{ color: 'var(--cw-text)' }}>
                No tests to show results for
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--cw-muted)' }}>
                Create and publish a test first so students can attempt it.
              </p>
            </div>
          ) : (
            <>
              {/* 5. Results test picker card */}
              <div className="ncd-card space-y-3.5">
                <label
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--cw-muted)' }}
                >
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
                        {...getNcdPressHandlers()}
                        className={`ncd-picker-btn min-h-[64px] flex items-center justify-between gap-3 ${
                          isSelected ? 'is-selected' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs sm:text-sm font-bold truncate"
                            style={{ color: 'var(--cw-text)' }}
                          >
                            {t.title}
                          </p>
                          <p
                            className="text-[11px] mt-0.5 tabular-nums truncate"
                            style={{ color: 'var(--cw-muted)' }}
                          >
                            {t.subject} • {aCount} {aCount === 1 ? 'attempt' : 'attempts'}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="shrink-0"
                          style={{
                            color: isSelected ? 'var(--cw-red-text)' : 'var(--cw-muted)',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Student scores & ranking card */}
              <div className="ncd-card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--cw-muted)' }}
                    >
                      STUDENT SCORES &amp; RANKING
                    </h3>
                    <span
                      className="text-xs font-mono tabular-nums"
                      style={{ color: 'var(--cw-muted)' }}
                    >
                      {testResults.length} {testResults.length === 1 ? 'submission' : 'submissions'}
                    </span>
                  </div>
                  {selectedResultTestId && testResults.length > 0 && (
                    <button
                      type="button"
                      disabled={finalisingTestId === selectedResultTestId}
                      {...getNcdPressHandlers(finalisingTestId === selectedResultTestId)}
                      onClick={async () => {
                        setFinalisingTestId(selectedResultTestId);
                        try {
                          const res = await finaliseGrandLineTest(selectedResultTestId);
                          showApiToast(
                            res.issuedCount > 0
                              ? `Results finalised! Issued ${res.issuedCount} 1st Position Certificate(s).`
                              : 'Results finalised (1st Position Certificate already issued).',
                            'success'
                          );
                          await loadCaptainWorkspace();
                        } catch (err: any) {
                          showApiToast(err?.message || 'Failed to finalise mock results.', 'error');
                        } finally {
                          setFinalisingTestId(null);
                        }
                      }}
                      className="ncd-btn ncd-glass-red min-h-[40px] px-4 py-2 text-xs"
                    >
                      <Award size={14} />
                      <span>
                        {finalisingTestId === selectedResultTestId
                          ? 'Issuing 1st Position Certificate...'
                          : 'Finalise & Issue 1st Position Certificate'}
                      </span>
                    </button>
                  )}
                </div>

                {loadingResults ? (
                  <LineLoader context="results" variant="section" />
                ) : testResults.length === 0 ? (
                  <div className="ncd-empty-box">
                    <Users
                      size={28}
                      className="mx-auto mb-2"
                      style={{ color: 'var(--cw-muted)' }}
                    />
                    <p className="text-xs sm:text-sm font-bold" style={{ color: 'var(--cw-text)' }}>
                      No attempts recorded for this test yet
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--cw-muted)' }}>
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
                          className={`ncd-score-row min-h-[68px] flex items-center justify-between gap-3 ${
                            isCurrentUser ? 'ncd-score-row-me' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className={getRankSquareClass(rank)}>#{rank}</span>
                            <div className="w-[40px] h-[40px] rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                              <BoardlyAvatar
                                uid={uid || `${rank}-${displayName}`}
                                name={displayName}
                                equippedAvatar={
                                  liveProfile?.equippedAvatar ||
                                  liveProfile?.equippedAvatarId ||
                                  liveProfile?.avatar ||
                                  r.userAvatar ||
                                  null
                                }
                                equippedFrameId={liveProfile?.equippedFrameId || null}
                                isSuperAdmin={isSuperAdminActor}
                                size={40}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p
                                  className="text-xs sm:text-sm font-bold truncate"
                                  style={{ color: 'var(--cw-text)' }}
                                >
                                  {displayName}
                                </p>
                                {isCurrentUser && (
                                  <span className="ncd-chip-red !py-0.5 !px-2 !text-[10px]">
                                    You
                                  </span>
                                )}
                              </div>
                              <p
                                className="text-[11px] tabular-nums truncate mt-0.5"
                                style={{ color: 'var(--cw-muted)' }}
                              >
                                Time: {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} · {r.percentage}% accuracy
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 whitespace-nowrap tabular-nums pl-2">
                            <p
                              className="ncd-font-doto text-sm sm:text-base whitespace-nowrap"
                              style={{ color: 'var(--cw-text)' }}
                            >
                              {r.score}/{r.totalQuestions}
                            </p>
                            <p
                              className="text-[11px] font-bold whitespace-nowrap mt-0.5"
                              style={{ color: 'var(--cw-red-text)' }}
                            >
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

      {/* ── 7. TAB 3: CREW ───────────────────────────────────────────────────── */}
      {activeTab === 'crew' && (
        <div className="space-y-4">
          {loading ? (
            <LineLoader context="dashboard" variant="section" />
          ) : !crew ? (
            <div className="ncd-card space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="ncd-stat-icon-badge !w-11 !h-11 !rounded-2xl shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h3
                    className="ncd-font-doto text-lg sm:text-xl"
                    style={{ color: 'var(--cw-text)' }}
                  >
                    Launch Your Nakama Crew
                  </h3>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--cw-muted)' }}>
                    Create your official crew to invite students, share private or public tests, and manage your roster.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateCrew} className="space-y-4 pt-1">
                <div>
                  <label
                    className="block text-xs font-bold mb-1.5"
                    style={{ color: 'var(--cw-text)' }}
                  >
                    Crew Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCrewName}
                    onChange={(e) => setNewCrewName(e.target.value)}
                    placeholder="e.g. NUST Seeker Squadron"
                    className="ncd-input w-full min-h-[46px] px-4 py-2.5 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-bold mb-1.5"
                    style={{ color: 'var(--cw-text)' }}
                  >
                    Target University / Campus (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCrewUniversity}
                    onChange={(e) => setNewCrewUniversity(e.target.value)}
                    placeholder="e.g. NUST / FAST / MDCAT"
                    className="ncd-input w-full min-h-[46px] px-4 py-2.5 text-xs sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingCrew}
                  {...getNcdPressHandlers(creatingCrew)}
                  className="ncd-btn ncd-glass-red relative overflow-hidden min-h-[44px] px-6 py-2.5 text-xs sm:text-sm"
                >
                  <Plus size={15} />
                  <span>{creatingCrew ? 'Creating...' : 'Create Crew'}</span>
                  {creatingCrew && <ButtonLineLoader />}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Crew Summary Card */}
              <div className="ncd-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className="ncd-font-doto text-lg sm:text-xl truncate"
                      style={{ color: 'var(--cw-text)' }}
                    >
                      {crew.name}
                    </h3>
                    <span
                      className={
                        crew.status === 'suspended' ? 'ncd-chip-red' : 'ncd-chip-green'
                      }
                    >
                      {crew.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--cw-muted)' }}>
                    Invite Code:{' '}
                    <span className="font-mono font-bold" style={{ color: 'var(--cw-text)' }}>
                      {crew.code}
                    </span>
                    {crew.university ? ` • ${crew.university}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyCrewCode}
                  {...getNcdPressHandlers()}
                  className="ncd-btn ncd-glass min-h-[42px] px-4 py-2 text-xs self-start sm:self-auto"
                  style={{ color: 'var(--cw-text)' }}
                >
                  {copiedCode ? (
                    <Check size={14} style={{ color: 'var(--cw-green)' }} />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedCode ? 'Copied Code' : 'Copy Invite Code'}</span>
                </button>
              </div>

              {/* Crew Members List */}
              <div className="ncd-card space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--cw-muted)' }}
                  >
                    CREW MEMBERS
                  </h4>
                  <span
                    className="text-xs font-mono tabular-nums"
                    style={{ color: 'var(--cw-muted)' }}
                  >
                    {crewMembers.length} {crewMembers.length === 1 ? 'member' : 'members'}
                  </span>
                </div>

                {crewMembers.length === 0 ? (
                  <div className="ncd-empty-box">
                    <Users
                      size={28}
                      className="mx-auto mb-2"
                      style={{ color: 'var(--cw-muted)' }}
                    />
                    <p className="text-xs sm:text-sm font-bold" style={{ color: 'var(--cw-text)' }}>
                      No members yet
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--cw-muted)' }}>
                      Share invite code{' '}
                      <span className="font-mono font-bold" style={{ color: 'var(--cw-text)' }}>
                        {crew.code}
                      </span>{' '}
                      with students to grow your crew.
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
                          className="ncd-score-row flex flex-col xs:flex-row xs:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-xs sm:text-sm font-bold truncate"
                                style={{ color: 'var(--cw-text)' }}
                              >
                                {m.userName}
                              </span>
                              <span
                                className={
                                  isCaptainRow ? 'ncd-chip-red' : 'ncd-chip-muted'
                                }
                              >
                                {isCaptainRow ? 'Captain' : 'Member'}
                              </span>
                              {isSuspended && (
                                <span className="ncd-chip-red">Suspended</span>
                              )}
                            </div>
                            {m.userEmail && (
                              <p
                                className="text-[11px] truncate mt-0.5"
                                style={{ color: 'var(--cw-muted)' }}
                              >
                                {m.userEmail}
                              </p>
                            )}
                          </div>

                          {canManage && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={memberActionUid === m.userUid}
                                {...getNcdPressHandlers(memberActionUid === m.userUid)}
                                onClick={() => handleToggleSuspendMember(m)}
                                className="ncd-btn ncd-glass min-h-[38px] px-3.5 py-1.5 text-xs"
                                style={{ color: 'var(--cw-gold)' }}
                              >
                                <Ban size={12} />
                                <span>{isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={memberActionUid === m.userUid}
                                {...getNcdPressHandlers(memberActionUid === m.userUid)}
                                onClick={() => handleRemoveMember(m)}
                                className="ncd-btn ncd-btn-delete !w-auto !h-auto min-h-[38px] px-3.5 py-1.5 text-xs"
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

      {/* ── CREATE / EDIT TEST MODAL (Full-screen sheet on mobile, portaled to body) ── */}
      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            data-fullscreen-modal="true"
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            {/* Sibling dimmed/blurred backdrop */}
            <div
              onClick={() => !savingTest && setModalOpen(false)}
              className="fixed inset-0 z-0 bg-black/50 backdrop-blur-md cursor-pointer"
              aria-hidden="true"
            />
            <div
              className="ncd-root relative z-10 w-full h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-[28px] border flex flex-col overflow-hidden"
              style={{
                backgroundColor: 'var(--cw-card)',
                borderColor: 'var(--cw-line)',
              }}
            >
              {/* Modal Header */}
              <div
                className="sticky top-0 z-10 px-4 sm:px-6 py-4 border-b flex items-center justify-between gap-3 shrink-0"
                style={{
                  backgroundColor: 'var(--cw-card)',
                  borderColor: 'var(--cw-line)',
                }}
              >
                <div>
                  <h2
                    className="ncd-font-doto text-base sm:text-lg"
                    style={{ color: 'var(--cw-text)' }}
                  >
                    {editingTestId ? 'Edit Captain Test' : 'Create & Publish Test'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--cw-muted)' }}>
                    Configure test details and import questions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !savingTest && setModalOpen(false)}
                  {...getNcdPressHandlers()}
                  className="ncd-btn ncd-glass w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ color: 'var(--cw-text)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Body */}
              <form
                id="captain-create-test-form"
                onSubmit={handleSaveAndPublishTest}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-24 sm:pb-24 space-y-4"
              >
                <div>
                  <label
                    className="block text-xs font-bold mb-1.5"
                    style={{ color: 'var(--cw-text)' }}
                  >
                    Test Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. NUST NET-4 Physics High-Yield Mock #1"
                    className="ncd-input w-full px-4 py-2.5 text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      className="block text-xs font-bold mb-1.5"
                      style={{ color: 'var(--cw-text)' }}
                    >
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="ncd-input w-full px-4 py-2.5 text-xs sm:text-sm"
                    >
                      {SUBJECT_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold mb-1.5"
                      style={{ color: 'var(--cw-text)' }}
                    >
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
                      className="ncd-input w-full px-4 py-2.5 text-xs sm:text-sm tabular-nums"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold mb-1.5"
                      style={{ color: 'var(--cw-text)' }}
                    >
                      Visibility
                    </label>
                    <div
                      className="grid grid-cols-2 gap-1.5 p-1 rounded-[18px] border"
                      style={{
                        backgroundColor: 'var(--cw-card2)',
                        borderColor: 'var(--cw-line)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setVisibility('public')}
                        {...getNcdPressHandlers()}
                        className={`ncd-btn py-1.5 text-xs ${
                          visibility === 'public' ? 'ncd-glass-red' : ''
                        }`}
                        style={{
                          color: visibility === 'public' ? '#ffffff' : 'var(--cw-muted)',
                        }}
                      >
                        <Globe size={12} />
                        <span>Public</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibility('private')}
                        {...getNcdPressHandlers()}
                        className={`ncd-btn py-1.5 text-xs ${
                          visibility === 'private' ? 'ncd-glass-red' : ''
                        }`}
                        style={{
                          color: visibility === 'private' ? '#ffffff' : 'var(--cw-muted)',
                        }}
                      >
                        <Lock size={12} />
                        <span>Private</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Certificate Design Theme Picker */}
                <div
                  className="pt-3 border-t"
                  style={{ borderColor: 'var(--cw-line)' }}
                >
                  <ThemePicker
                    grandLineId={editingTestId || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'new_mock'}
                    mockTitle={title.trim() || 'Grand Line Mock'}
                    value={certificateThemeId}
                    onChange={(nextThemeId) => setCertificateThemeId(nextThemeId)}
                  />
                </div>

                {/* CSV Upload or Paste */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      className="block text-xs font-bold"
                      style={{ color: 'var(--cw-text)' }}
                    >
                      Upload or Paste Questions (CSV)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadSampleCsv}
                        {...getNcdPressHandlers()}
                        className="ncd-btn ncd-glass px-3 py-1.5 text-[11px]"
                        style={{ color: 'var(--cw-text)' }}
                      >
                        <Download size={12} />
                        <span>Template</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        {...getNcdPressHandlers()}
                        className="ncd-btn ncd-glass-red px-3 py-1.5 text-[11px]"
                      >
                        <Upload size={12} />
                        <span>Choose File</span>
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
                    className="ncd-input w-full px-4 py-2.5 text-xs font-mono"
                  />

                  {/* "X questions parsed" status banner */}
                  <div className="ncd-score-row flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={16}
                        className="shrink-0"
                        style={{
                          color:
                            parsedQuestions.length > 0
                              ? 'var(--cw-green)'
                              : 'var(--cw-muted)',
                        }}
                      />
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: 'var(--cw-text)' }}
                      >
                        {parsedQuestions.length} {parsedQuestions.length === 1 ? 'question' : 'questions'} parsed
                      </span>
                    </div>
                    {parseErrors.length > 0 && (
                      <span
                        className="text-[11px] font-semibold flex items-center gap-1"
                        style={{ color: 'var(--cw-gold)' }}
                      >
                        <AlertCircle size={13} />
                        {parseErrors.length} row issue{parseErrors.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>

                  {parseErrors.length > 0 && (
                    <div className="ncd-score-row text-[11px] space-y-1 max-h-28 overflow-y-auto" style={{ color: 'var(--cw-gold)' }}>
                      {parseErrors.slice(0, 5).map((err, i) => (
                        <p key={i}>• {err}</p>
                      ))}
                    </div>
                  )}

                  {submitError && (
                    <div
                      className="ncd-score-row ncd-score-row-me text-xs flex items-start gap-2"
                      style={{ color: 'var(--cw-red-text)' }}
                    >
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span className="break-words">{submitError}</span>
                    </div>
                  )}
                </div>
              </form>

              {/* Sticky Safe-Area Footer */}
              <div
                className="sticky bottom-0 z-10 px-4 sm:px-6 pt-3 border-t flex items-center justify-end gap-2.5 shrink-0"
                style={{
                  backgroundColor: 'var(--cw-card)',
                  borderColor: 'var(--cw-line)',
                  paddingBottom: 'max(16px, calc(16px + env(safe-area-inset-bottom, 0px)))',
                }}
              >
                <button
                  type="button"
                  disabled={savingTest}
                  {...getNcdPressHandlers(savingTest)}
                  onClick={() => setModalOpen(false)}
                  className="ncd-btn ncd-glass min-h-[44px] px-5 py-2.5 text-xs sm:text-sm"
                  style={{ color: 'var(--cw-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="captain-create-test-form"
                  disabled={savingTest || parsedQuestions.length === 0}
                  {...getNcdPressHandlers(savingTest || parsedQuestions.length === 0)}
                  className="ncd-btn ncd-glass-red relative overflow-hidden min-h-[44px] px-5 py-2.5 text-xs sm:text-sm"
                >
                  <CheckCircle2 size={15} className="shrink-0" />
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
          </div>,
          document.body
        )}

      {/* ── DELETE CONFIRMATION MODAL ────────────────────────────────────────── */}
      {deleteConfirmTest &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            data-fullscreen-modal="true"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div
              onClick={() => !deletingTestId && setDeleteConfirmTest(null)}
              className="fixed inset-0 z-0 bg-black/50 backdrop-blur-md cursor-pointer"
              aria-hidden="true"
            />
            <div className="ncd-root ncd-card relative z-10 w-full max-w-md space-y-4">
              <div className="flex items-start gap-3">
                <div className="ncd-stat-icon-badge !w-10 !h-10 !rounded-xl shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="ncd-font-doto text-base" style={{ color: 'var(--cw-text)' }}>
                    Delete Test?
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--cw-muted)' }}>
                    Are you sure you want to delete{' '}
                    <strong style={{ color: 'var(--cw-text)' }}>{deleteConfirmTest.title}</strong>? This will also remove all questions and student results for this test.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={Boolean(deletingTestId)}
                  {...getNcdPressHandlers(Boolean(deletingTestId))}
                  onClick={() => setDeleteConfirmTest(null)}
                  className="ncd-btn ncd-glass min-h-[42px] px-4 py-2 text-xs"
                  style={{ color: 'var(--cw-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={Boolean(deletingTestId)}
                  {...getNcdPressHandlers(Boolean(deletingTestId))}
                  onClick={handleConfirmDeleteTest}
                  className="ncd-btn ncd-glass-red relative overflow-hidden min-h-[42px] px-4 py-2 text-xs"
                >
                  <Trash2 size={14} />
                  <span>{deletingTestId ? 'Deleting...' : 'Delete Permanently'}</span>
                  {Boolean(deletingTestId) && <ButtonLineLoader />}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default AmbassadorDashboardPage;

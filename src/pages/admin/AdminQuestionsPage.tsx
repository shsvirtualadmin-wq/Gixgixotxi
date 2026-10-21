import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Check,
  Upload,
  Download,
  Sun,
  Moon,
  Flag,
  CheckCircle2,
  Sparkles,
  Database,
  ExternalLink,
  ArrowLeft,
  FolderEdit,
  ChevronRight,
  Lock,
  Unlock,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ENABLE_MULTI_SOURCE_BANK,
  getBankSources,
  getBankSource,
  BANK_SOURCE_CONFIGS,
  isBank1Unlocked,
  isBank2Unlocked,
  isBankUnlocked,
  unlockBankSource,
  lockBankSource,
  subscribeFailingSources,
  subscribeBankSourceHealth,
  checkAllBankSourcesHealth,
  type SourceHealthDiagnostic,
} from '@/config/questionBankSources';
import {
  parseQuestionCompoundId,
  rebuildCountsAndIndex,
  type RebuildCountsResult,
  scanMisfiledQuestions,
  fixMisfiledQuestions,
  type MisfiledQuestionCandidate,
  type FixMisfiledResult,
} from '@/services/multiSourceQuestionBank';
import { MathText, validateMath } from '@/components/ui/MathText';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import { isQuotaExhaustedError } from '@/utils/quota';
import {
  saveQuestion,
  deleteQuestion,
  fetchQuestionKey,
  fetchBankHealth,
  batchUpdateQuestions,
  batchImportQuestions,
  fetchQuestionReports,
  updateQuestionReportStatus,
  getSubjectPoolCollection,
  isSubjectPoolSupported,
  fetchSubjectPoolCounts,
  fetchSubjectTopics,
  fetchPoolQuestionsPaginated,
  saveSubjectPoolQuestion,
  deletePoolQuestion,
  renamePoolTopic,
  moveQuestionsToTopic,
  batchImportPoolQuestions,
  seedInitialMathPool,
  type BankHealthStats,
  type ImportCandidate,
  type PoolTopicCount,
} from '@/services/adminService';
import {
  getAllSubjects,
  getChaptersForSubject,
  formatSubjectName,
  formatChapterName,
  findSubjectSlug,
  computeContentHash,
} from '@/constants/taxonomy';
import type { Question, QuestionReport } from '@/types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

// ─── LATEX TOOLBAR SYMBOLS ────────────────────────────────────────────────────
interface LatexSnippet {
  label: string;
  snippet: string;
  category: 'greek' | 'math' | 'chem' | 'calc';
}

const LATEX_SNIPPETS: LatexSnippet[] = [
  // Math operators & structures
  { label: 'x²', snippet: '$x^2$', category: 'math' },
  { label: 'xₙ', snippet: '$x_n$', category: 'math' },
  { label: 'a/b', snippet: '$\\frac{a}{b}$', category: 'math' },
  { label: '√x', snippet: '$\\sqrt{x}$', category: 'math' },
  { label: '±', snippet: '$\\pm$', category: 'math' },
  { label: '×', snippet: '$\\times$', category: 'math' },
  { label: '÷', snippet: '$\\div$', category: 'math' },
  { label: '≈', snippet: '$\\approx$', category: 'math' },
  { label: '≤', snippet: '$\\le$', category: 'math' },
  { label: '≥', snippet: '$\\ge$', category: 'math' },
  { label: '≠', snippet: '$\\ne$', category: 'math' },
  { label: '∞', snippet: '$\\infty$', category: 'math' },

  // Greek letters
  { label: 'α', snippet: '$\\alpha$', category: 'greek' },
  { label: 'β', snippet: '$\\beta$', category: 'greek' },
  { label: 'θ', snippet: '$\\theta$', category: 'greek' },
  { label: 'π', snippet: '$\\pi$', category: 'greek' },
  { label: 'Δ', snippet: '$\\Delta$', category: 'greek' },
  { label: 'λ', snippet: '$\\lambda$', category: 'greek' },
  { label: 'μ', snippet: '$\\mu$', category: 'greek' },
  { label: 'σ', snippet: '$\\sigma$', category: 'greek' },
  { label: 'ω', snippet: '$\\omega$', category: 'greek' },

  // Calculus & Vectors
  { label: '∫', snippet: '$\\int_{a}^{b} f(x) \\, dx$', category: 'calc' },
  { label: 'd/dx', snippet: '$\\frac{d}{dx}$', category: 'calc' },
  { label: 'lim', snippet: '$\\lim_{x \\to 0}$', category: 'calc' },
  { label: '∑', snippet: '$\\sum_{i=1}^{n}$', category: 'calc' },
  { label: 'v⃗', snippet: '$\\vec{v}$', category: 'calc' },
  { label: '[Matrix]', snippet: '$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$', category: 'calc' },

  // Chemistry \ce{}
  { label: 'H₂O', snippet: '$\\ce{H2O}$', category: 'chem' },
  { label: 'CO₂', snippet: '$\\ce{CO2}$', category: 'chem' },
  { label: '→', snippet: '$\\ce{->}$', category: 'chem' },
  { label: '⇄', snippet: '$\\ce{<=>}$', category: 'chem' },
  { label: 'SO₄²⁻', snippet: '$\\ce{SO4^{2-}}$', category: 'chem' },
  { label: 'CH₃COOH', snippet: '$\\ce{CH3COOH}$', category: 'chem' },
];

export function AdminQuestionsPage() {
  const { user } = useAuth();

  // Active view: 'list' | 'health' | 'reports' | 'import'
  const [activeTab, setActiveTab] = useState<'list' | 'health' | 'reports' | 'import'>('list');

  // Subject Picker state: null means show subject picker first (nothing loads until a subject is chosen)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
  const [subjectCountsLoading, setSubjectCountsLoading] = useState(false);

  // Topic filter state inside chosen subject
  const [topics, setTopics] = useState<PoolTopicCount[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Question list state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AdminDiagnosticError | null>(null);

  // Filters & Search inside chosen subject/topic
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Multi-selection for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Bank Health state
  const [healthStats, setHealthStats] = useState<BankHealthStats | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Reports state
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Rename topic modal state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [topicToRename, setTopicToRename] = useState<string>('');
  const [newTopicNameInput, setNewTopicNameInput] = useState<string>('');
  const [renamingTopic, setRenamingTopic] = useState(false);

  // Move questions to another topic modal state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetMoveTopic, setTargetMoveTopic] = useState<string>('');
  const [targetMoveNewTopic, setTargetMoveNewTopic] = useState<string>('');
  const [movingQuestions, setMovingQuestions] = useState(false);

  // Seeding initial math pool state
  const [seedingMath, setSeedingMath] = useState(false);

  // Edit / Add Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'question' | 'key' | 'preview'>('question');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('dark');
  const [previewShowKey, setPreviewShowKey] = useState(true);
  const [isCustomTopicAdd, setIsCustomTopicAdd] = useState(false);
  const [customTopicNameInput, setCustomTopicNameInput] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<{
    id?: string;
    subject: string;
    chapter: string; // Used as topic/chapter
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'draft' | 'reviewed' | 'published';
    active: boolean;
    q: string;
    options: [string, string, string, string];
    tags: string[];
    source?: string;
    year?: string | number;
    correct: number;
    explain: string;
  } | null>(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [activeFocusedInputRef, setActiveFocusedInputRef] = useState<{
    id: string;
    setter: (val: string) => void;
    currentVal: string;
  } | null>(null);

  // Delete modal state
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  // Import modal / panel state
  const [importSourceType, setImportSourceType] = useState<'csv' | 'json' | 'sheet'>('csv');
  const [importSubject, setImportSubject] = useState<string>('mathematics');
  const [importTopic, setImportTopic] = useState<string>('Calculus & Differentiation');
  const [isCustomImportTopic, setIsCustomImportTopic] = useState(false);
  const [customImportTopicInput, setCustomImportTopicInput] = useState('');
  const [importText, setImportText] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [fetchingSheet, setFetchingSheet] = useState(false);
  const [dryRunCandidates, setDryRunCandidates] = useState<ImportCandidate[]>([]);
  const [dryRunErrors, setDryRunErrors] = useState<string[]>([]);
  const [dryRunDuplicatesCount, setDryRunDuplicatesCount] = useState(0);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; duplicatesSkipped: number } | null>(null);

  // Multi-source bank state (defaults to Beta Bank: bank2)
  const bankSources = useMemo(() => getBankSources(), []);
  const [selectedSaveSource, setSelectedSaveSource] = useState<string>('bank2');
  const [importTargetSource, setImportTargetSource] = useState<string>('bank2');
  const [editingQuestionSourceId, setEditingQuestionSourceId] = useState<string>('bank2');

  // Dedicated auth unlock states per bank (Alpha Bank & Beta Bank)
  const [bankUnlockStates, setBankUnlockStates] = useState<{ [id: string]: boolean }>({
    bank1: isBank1Unlocked(),
    bank2: isBank2Unlocked(),
  });
  const [unlockModalTarget, setUnlockModalTarget] = useState<string | null>(null);
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);

  // Source health failure and diagnostic listeners
  const [failingSources, setFailingSources] = useState<{ id: string; name: string; error?: string; errorCode?: string; operation?: string; lastChecked?: Date }[]>([]);
  const [bankSourceDiagnostics, setBankSourceDiagnostics] = useState<SourceHealthDiagnostic[]>([]);
  const [probingBankHealth, setProbingBankHealth] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [copiedDiagnosticId, setCopiedDiagnosticId] = useState<string | null>(null);

  useEffect(() => {
    const unsubFailing = subscribeFailingSources(setFailingSources);
    const unsubDiag = subscribeBankSourceHealth(setBankSourceDiagnostics);
    return () => {
      unsubFailing();
      unsubDiag();
    };
  }, []);

  const handleProbeBankSources = async () => {
    setProbingBankHealth(true);
    try {
      const results = await checkAllBankSourcesHealth();
      setBankSourceDiagnostics(results);
    } catch (err) {
      console.warn('Bank sources probe error:', err);
    } finally {
      setProbingBankHealth(false);
    }
  };

  // Rebuild counts & index state
  const [isRebuildModalOpen, setIsRebuildModalOpen] = useState(false);
  const [rebuildingCounts, setRebuildingCounts] = useState(false);
  const [rebuildResult, setRebuildResult] = useState<RebuildCountsResult | null>(null);
  const [rebuildError, setRebuildError] = useState<string | null>(null);

  const handleRunRebuild = async () => {
    if (!user?.email) return;
    setRebuildingCounts(true);
    setRebuildError(null);
    try {
      const res = await rebuildCountsAndIndex(user.email);
      setRebuildResult(res);
      await loadSubjectCounts();
      if (selectedSubject) await loadTopics(selectedSubject);
      await loadData();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to rebuild counts & index.';
      setRebuildError(msg);
    } finally {
      setRebuildingCounts(false);
    }
  };

  // Misfiled questions state
  const [isMisfiledModalOpen, setIsMisfiledModalOpen] = useState(false);
  const [scanningMisfiled, setScanningMisfiled] = useState(false);
  const [misfiledCandidates, setMisfiledCandidates] = useState<MisfiledQuestionCandidate[]>([]);
  const [fixingMisfiled, setFixingMisfiled] = useState(false);
  const [fixMisfiledResult, setFixMisfiledResult] = useState<FixMisfiledResult | null>(null);
  const [misfiledError, setMisfiledError] = useState<string | null>(null);

  const handleScanMisfiled = async () => {
    setScanningMisfiled(true);
    setMisfiledError(null);
    setFixMisfiledResult(null);
    try {
      const list = await scanMisfiledQuestions();
      setMisfiledCandidates(list);
    } catch (err: unknown) {
      setMisfiledError((err as { message?: string })?.message || 'Failed to scan misfiled questions');
    } finally {
      setScanningMisfiled(false);
    }
  };

  const handleApplyFixMisfiled = async () => {
    if (!user?.email || misfiledCandidates.length === 0) return;
    setFixingMisfiled(true);
    setMisfiledError(null);
    try {
      const res = await fixMisfiledQuestions(misfiledCandidates, user.email);
      setFixMisfiledResult(res);
      setMisfiledCandidates([]);
      await loadSubjectCounts();
      if (selectedSubject) await loadTopics(selectedSubject);
      await loadData();
    } catch (err: unknown) {
      setMisfiledError((err as { message?: string })?.message || 'Failed to move misfiled questions');
    } finally {
      setFixingMisfiled(false);
    }
  };

  // "Needs review" filter state for questions containing reasoning residue
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);

  const containsReasoningResidue = (explain?: string, text?: string): boolean => {
    const combined = `${explain || ''} ${text || ''}`;
    return /\b(wait|re-evaluating|let's set)\b/i.test(combined);
  };

  const [pageIndex, setPageIndex] = useState(0);

  const subjects = useMemo(() => getAllSubjects(), []);

  // ─── LOAD SUBJECT COUNTS ────────────────────────────────────────────────────
  const loadSubjectCounts = useCallback(async () => {
    setSubjectCountsLoading(true);
    try {
      const counts = await fetchSubjectPoolCounts();
      setSubjectCounts(counts);
    } catch (err) {
      console.warn('Failed to load subject counts:', err);
    } finally {
      setSubjectCountsLoading(false);
    }
  }, []);

  // ─── LOAD TOPICS FOR SELECTED SUBJECT ───────────────────────────────────────
  const loadTopics = useCallback(async (sub: string) => {
    setTopicsLoading(true);
    try {
      const list = await fetchSubjectTopics(sub);
      setTopics(list);
    } catch (err) {
      console.warn('Failed to load topics:', err);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  // ─── LOAD QUESTIONS (ONLY WHEN SUBJECT IS CHOSEN) ───────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedSubject) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPageIndex(0);
    try {
      const res = await fetchPoolQuestionsPaginated({
        subject: selectedSubject,
        topic: selectedTopic !== 'all' ? selectedTopic : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearch,
        limitCount: 20,
        pageIndex: 0,
      });

      setQuestions(res.questions);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('Failed to load questions:', err);
      const e = err as Partial<AdminDiagnosticError>;
      const isQuota = isQuotaExhaustedError(err);
      setError({
        code: isQuota ? 'RESOURCE_EXHAUSTED' : (e?.code || 'QUESTIONS_FETCH_FAILED'),
        message: isQuota
          ? 'Daily database limit reached, try again later'
          : (e?.message || `Failed to load questions for ${selectedSubject}.`),
        collection: isSubjectPoolSupported(selectedSubject) ? getSubjectPoolCollection(selectedSubject) : 'questions',
        operation: 'fetchPoolQuestionsPaginated',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedTopic, debouncedSearch, difficultyFilter, statusFilter]);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const h = await fetchBankHealth();
      setHealthStats(h);
    } catch (err) {
      console.warn('Failed to load bank health:', err);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const rep = await fetchQuestionReports();
      setReports(rep);
    } catch (err) {
      console.warn('Failed to load reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadSubjectCounts();
  }, [user, loadSubjectCounts]);

  useEffect(() => {
    if (!user) return;
    if (selectedSubject) {
      loadTopics(selectedSubject);
    } else {
      setTopics([]);
      setSelectedTopic('all');
    }
  }, [user, selectedSubject, loadTopics]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  useEffect(() => {
    if (activeTab === 'health') loadHealth();
    if (activeTab === 'reports') loadReports();
  }, [activeTab, loadHealth, loadReports]);

  const handleLoadMore = async () => {
    if (loadingMore || !selectedSubject) return;
    if (!ENABLE_MULTI_SOURCE_BANK && !lastDoc) return;
    setLoadingMore(true);
    try {
      const nextIdx = pageIndex + 1;
      const res = await fetchPoolQuestionsPaginated({
        subject: selectedSubject,
        topic: selectedTopic !== 'all' ? selectedTopic : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearch,
        limitCount: 20,
        startAfterDoc: lastDoc,
        pageIndex: nextIdx,
      });
      setQuestions((prev) => [...prev, ...res.questions]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
      setPageIndex(nextIdx);
    } catch (err: unknown) {
      console.warn('Failed to load more questions:', err);
      setLoadingMore(false);
    }
  };

  // ─── ADD / EDIT MODAL ───────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setSelectedSaveSource('bank2');
    setEditingQuestionSourceId('bank2');
    const defaultSub = selectedSubject || 'mathematics';
    const defaultTopic =
      selectedTopic !== 'all' ? selectedTopic : topics[0]?.name || 'Calculus & Differentiation';
    setEditingQuestion({
      id: undefined,
      subject: defaultSub,
      chapter: defaultTopic,
      difficulty: 'medium',
      status: 'published',
      active: true,
      q: '',
      options: ['', '', '', ''],
      tags: ['entrance'],
      source: '',
      year: new Date().getFullYear(),
      correct: 0,
      explain: '',
    });
    setIsCustomTopicAdd(false);
    setCustomTopicNameInput('');
    setModalTab('question');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = async (q: Question) => {
    const qSource = q.sourceId || parseQuestionCompoundId(q.id).sourceId || 'legacy';
    setEditingQuestionSourceId(qSource);
    setSelectedSaveSource(qSource);

    const sub = q.subject || selectedSubject || 'mathematics';
    let correct = typeof q.correct === 'number' ? q.correct : 0;
    let explain = q.explain || q.explanation || '';

    // If key not in question doc, check questionKey
    if (!isSubjectPoolSupported(sub)) {
      const keyData = await fetchQuestionKey(q.id);
      if (keyData) {
        correct = keyData.correct ?? correct;
        explain = keyData.explain || explain;
      }
    }

    const rawOpts = q.options && q.options.length >= 4 ? q.options : ['', '', '', ''];
    const sSlug = findSubjectSlug(sub) || sub;
    const topic = q.topic || q.chapter || 'General Concepts';

    setEditingQuestion({
      id: q.id,
      subject: sSlug,
      chapter: topic,
      difficulty: (q.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard',
      status: (q.status || 'published') as 'draft' | 'reviewed' | 'published',
      active: q.active !== false,
      q: q.q || q.question || q.stem || '',
      options: [rawOpts[0] || '', rawOpts[1] || '', rawOpts[2] || '', rawOpts[3] || ''],
      tags: Array.isArray(q.tags) ? q.tags : ['entrance'],
      source: q.source || '',
      year: q.year || '',
      correct,
      explain,
    });
    setIsCustomTopicAdd(false);
    setCustomTopicNameInput('');
    setModalTab('question');
    setIsEditModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !user?.email) return;

    const targetSource = editingQuestion.id ? editingQuestionSourceId : selectedSaveSource;
    if (ENABLE_MULTI_SOURCE_BANK && (targetSource === 'bank1' || targetSource === 'bank2') && !isBankUnlocked(targetSource)) {
      setUnlockError(null);
      setUnlockModalTarget(targetSource);
      return;
    }

    // Validate math
    const qMathVal = validateMath(editingQuestion.q);
    if (!qMathVal.ok) {
      alert(`Invalid LaTeX in question text:\n${qMathVal.errors.join('\n')}`);
      return;
    }
    for (let i = 0; i < 4; i++) {
      const optVal = validateMath(editingQuestion.options[i]);
      if (!optVal.ok) {
        alert(`Invalid LaTeX in Option ${String.fromCharCode(65 + i)}:\n${optVal.errors.join('\n')}`);
        return;
      }
    }

    const finalTopic = (
      isCustomTopicAdd && customTopicNameInput.trim()
        ? customTopicNameInput.trim()
        : editingQuestion.chapter
    ).trim() || 'General Concepts';

    setSavingQuestion(true);
    try {
      if (ENABLE_MULTI_SOURCE_BANK) {
        await saveSubjectPoolQuestion(
          user.email,
          {
            id: editingQuestion.id,
            subject: editingQuestion.subject,
            topic: finalTopic,
            text: editingQuestion.q,
            options: editingQuestion.options,
            correct: editingQuestion.correct,
            explain: editingQuestion.explain,
            difficulty: editingQuestion.difficulty,
            status: editingQuestion.status,
          },
          targetSource
        );
      } else {
        const isPool = isSubjectPoolSupported(editingQuestion.subject);
        if (isPool) {
          await saveSubjectPoolQuestion(user.email, {
            id: editingQuestion.id,
            subject: editingQuestion.subject,
            topic: finalTopic,
            text: editingQuestion.q,
            options: editingQuestion.options,
            correct: editingQuestion.correct,
            explain: editingQuestion.explain,
            difficulty: editingQuestion.difficulty,
            status: editingQuestion.status,
          });
        } else {
          await saveQuestion(user.email, {
            id: editingQuestion.id,
            subject: editingQuestion.subject,
            chapter: finalTopic,
            difficulty: editingQuestion.difficulty,
            status: editingQuestion.status,
            active: editingQuestion.active,
            q: editingQuestion.q,
            options: editingQuestion.options,
            tags: editingQuestion.tags,
            source: editingQuestion.source,
            year: editingQuestion.year,
            correct: editingQuestion.correct,
            explain: editingQuestion.explain,
          });
        }
      }

      setIsEditModalOpen(false);
      setEditingQuestion(null);
      await loadData();
      if (selectedSubject) await loadTopics(selectedSubject);
      await loadSubjectCounts();
    } catch (err: unknown) {
      console.error('Failed to save question:', err);
      const msg = (err as { message?: string })?.message || 'Could not save question. Please check permissions and database connectivity.';
      alert(msg);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete || !user?.email) return;
    const qSource = questionToDelete.sourceId || parseQuestionCompoundId(questionToDelete.id).sourceId || 'legacy';
    if (ENABLE_MULTI_SOURCE_BANK && (qSource === 'bank1' || qSource === 'bank2') && !isBankUnlocked(qSource)) {
      setUnlockError(null);
      setUnlockModalTarget(qSource);
      return;
    }
    try {
      const sub = questionToDelete.subject || selectedSubject || 'mathematics';
      if (ENABLE_MULTI_SOURCE_BANK || isSubjectPoolSupported(sub)) {
        await deletePoolQuestion(user.email, sub, questionToDelete.id);
      } else {
        await deleteQuestion(user.email, questionToDelete.id);
      }
      setQuestionToDelete(null);
      await loadData();
      if (selectedSubject) await loadTopics(selectedSubject);
      await loadSubjectCounts();
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockEmail.trim() || !unlockPassword) {
      setUnlockError('Please enter both email and password.');
      return;
    }
    const targetId = unlockModalTarget || 'bank2';
    const targetBank = getBankSource(targetId);
    setUnlockLoading(true);
    setUnlockError(null);
    try {
      await unlockBankSource(targetId, unlockEmail.trim(), unlockPassword);
      setBankUnlockStates((prev) => ({ ...prev, [targetId]: true }));
      setUnlockPassword('');
      setUnlockModalTarget(null);
      setBatchSuccessMessage(`${targetBank?.name || targetId} unlocked successfully for this session!`);
      setTimeout(() => setBatchSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setUnlockError(e?.message || `Invalid ${targetBank?.name || 'Bank'} admin credentials. Check your email and password.`);
    } finally {
      setUnlockLoading(false);
    }
  };

  // ─── RENAME TOPIC HANDLER ───────────────────────────────────────────────────
  const handleRenameTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !selectedSubject || !topicToRename || !newTopicNameInput.trim()) return;
    setRenamingTopic(true);
    try {
      const count = await renamePoolTopic(
        user.email,
        selectedSubject,
        topicToRename,
        newTopicNameInput.trim()
      );
      setBatchSuccessMessage(`Renamed topic to "${newTopicNameInput.trim()}" across ${count} questions.`);
      setTimeout(() => setBatchSuccessMessage(null), 4000);
      setIsRenameModalOpen(false);
      const cleanNew = newTopicNameInput.trim();
      setTopicToRename('');
      setNewTopicNameInput('');
      if (selectedTopic === topicToRename) {
        setSelectedTopic(cleanNew);
      }
      await loadTopics(selectedSubject);
      await loadData();
    } catch (err) {
      console.error('Failed to rename topic:', err);
      alert('Could not rename topic. Please try again.');
    } finally {
      setRenamingTopic(false);
    }
  };

  // ─── MOVE QUESTIONS TO TOPIC HANDLER ────────────────────────────────────────
  const handleMoveQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = (targetMoveNewTopic.trim() || targetMoveTopic).trim();
    if (!user?.email || !selectedSubject || selectedIds.size === 0 || !cleanTopic) return;
    setMovingQuestions(true);
    try {
      const count = await moveQuestionsToTopic(
        user.email,
        selectedSubject,
        Array.from(selectedIds),
        cleanTopic
      );
      setBatchSuccessMessage(`Moved ${count} questions to topic "${cleanTopic}".`);
      setTimeout(() => setBatchSuccessMessage(null), 4000);
      setSelectedIds(new Set());
      setIsMoveModalOpen(false);
      setTargetMoveTopic('');
      setTargetMoveNewTopic('');
      await loadTopics(selectedSubject);
      await loadData();
    } catch (err) {
      console.error('Failed to move questions:', err);
      alert('Could not move questions. Please try again.');
    } finally {
      setMovingQuestions(false);
    }
  };

  // ─── SEED INITIAL MATH POOL HANDLER ─────────────────────────────────────────
  const handleSeedMathPool = async () => {
    if (!user?.email) return;
    setSeedingMath(true);
    try {
      const count = await seedInitialMathPool(user.email);
      setBatchSuccessMessage(`Seeded ${count} authentic MCQs into Mathematics pool!`);
      setTimeout(() => setBatchSuccessMessage(null), 4000);
      await loadTopics('mathematics');
      await loadData();
      await loadSubjectCounts();
    } catch (err) {
      console.error('Failed to seed math pool:', err);
    } finally {
      setSeedingMath(false);
    }
  };

  // ─── LATEX TOOLBAR INSERTION ────────────────────────────────────────────────
  const insertLatexSnippet = (snippet: string) => {
    if (!activeFocusedInputRef) return;
    const current = activeFocusedInputRef.currentVal;
    const updated = current ? `${current} ${snippet}` : snippet;
    activeFocusedInputRef.setter(updated);
  };

  const displayedQuestions = useMemo(() => {
    if (!needsReviewOnly) return questions;
    return questions.filter((q) => containsReasoningResidue(q.explain || q.explanation, q.q || q.question));
  }, [questions, needsReviewOnly]);

  // ─── BATCH ACTIONS ──────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.size === displayedQuestions.length && displayedQuestions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedQuestions.map((q) => q.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchPublish = async () => {
    if (selectedIds.size === 0 || !user?.email) return;
    setBatchActionLoading(true);
    try {
      const count = await batchUpdateQuestions(user.email, Array.from(selectedIds), {
        status: 'published',
        active: true,
      });
      setBatchSuccessMessage(`Published ${count} questions successfully.`);
      setSelectedIds(new Set());
      await loadData();
      setTimeout(() => setBatchSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Batch publish error:', err);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchArchive = async () => {
    if (selectedIds.size === 0 || !user?.email) return;
    setBatchActionLoading(true);
    try {
      const count = await batchUpdateQuestions(user.email, Array.from(selectedIds), {
        active: false,
      });
      setBatchSuccessMessage(`Archived ${count} questions.`);
      setSelectedIds(new Set());
      await loadData();
      setTimeout(() => setBatchSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Batch archive error:', err);
    } finally {
      setBatchActionLoading(false);
    }
  };

  // ─── IMPORT SYSTEM (CSV & JSON & GOOGLE SHEETS) ──────────────────────────────
  const downloadCsvTemplate = () => {
    const headers = [
      'subject',
      'chapter',
      'difficulty',
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct',
      'explanation',
      'tags',
      'source',
      'year',
    ];

    const sampleRow = [
      'mathematics',
      'integration-by-parts',
      'medium',
      '"Evaluate $\\int x \\cos(x) \\, dx$."',
      '"$x \\sin(x) + \\cos(x) + C$"',
      '"$x \\sin(x) - \\cos(x) + C$"',
      '"$-x \\cos(x) + \\sin(x) + C$"',
      '"$x^2 \\sin(x) + C$"',
      '0',
      '"Use integration by parts: $\\int u \\, dv = uv - \\int v \\, du$ with $u=x, dv=\\cos(x)dx$."',
      'fast;nust',
      'NUST NET Past Paper',
      '2023',
    ];

    const sampleRow2 = [
      'chemistry',
      'aldehydes-and-ketones',
      'hard',
      '"Which product is obtained from the catalytic oxidation of $\\ce{CH3CH2OH}$?"',
      '"$\\ce{CH3CHO}$"',
      '"$\\ce{CH3COOH}$"',
      '"$\\ce{CH3COCH3}$"',
      '"$\\ce{CH4}$"',
      '0',
      '"Controlled oxidation of ethanol yields acetaldehyde (ethanal) $\\ce{CH3CHO}$."',
      'mdcat;ned',
      'PMDC Official',
      '2024',
    ];

    const csvContent = [headers.join(','), sampleRow.join(','), sampleRow2.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'boardly_mcq_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvText = (text: string): ImportCandidate[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Simple robust CSV parser handling quoted fields with commas
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const header = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    const candidates: ImportCandidate[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseLine(lines[i]);
      if (row.length < 5) continue;

      const getCol = (name: string): string => {
        const idx = header.indexOf(name);
        return idx !== -1 && row[idx] !== undefined ? row[idx] : '';
      };

      const effectiveTopic = (
        isCustomImportTopic && customImportTopicInput.trim()
          ? customImportTopicInput.trim()
          : importTopic
      ).trim() || 'General Concepts';

      const subject = getCol('subject') || importSubject || 'mathematics';
      const chapter = getCol('topic') || getCol('chapter') || effectiveTopic;
      const diff = (getCol('difficulty') || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard';
      const q = getCol('question') || getCol('q');
      const optA = getCol('option_a') || getCol('optiona') || getCol('opt1') || '';
      const optB = getCol('option_b') || getCol('optionb') || getCol('opt2') || '';
      const optC = getCol('option_c') || getCol('optionc') || getCol('opt3') || '';
      const optD = getCol('option_d') || getCol('optiond') || getCol('opt4') || '';
      const rawCorrect = getCol('correct') || getCol('correct_answer') || '0';
      let correctIdx = 0;
      if (/^[0-3]$/.test(rawCorrect)) {
        correctIdx = parseInt(rawCorrect, 10);
      } else if (/^[a-dA-D]$/.test(rawCorrect)) {
        correctIdx = rawCorrect.toUpperCase().charCodeAt(0) - 65;
      }
      const explain = getCol('explanation') || getCol('explain') || '';
      const tags = (getCol('tags') || '').split(/[;,]/).map((t) => t.trim()).filter(Boolean);
      const source = getCol('source') || '';
      const year = getCol('year') || '';

      if (q && optA && optB && optC && optD) {
        candidates.push({
          question: {
            subject,
            chapter,
            difficulty: diff,
            q,
            options: [optA, optB, optC, optD],
            tags: tags.length > 0 ? tags : ['entrance'],
            source,
            year,
            status: 'published',
            active: true,
          },
          key: {
            correct: correctIdx,
            explain,
          },
        });
      }
    }

    return candidates;
  };

  const handleRunDryRun = async () => {
    let candidates: ImportCandidate[] = [];
    setDryRunErrors([]);
    setDryRunDuplicatesCount(0);
    setImportResult(null);

    const effectiveTopic = (
      isCustomImportTopic && customImportTopicInput.trim()
        ? customImportTopicInput.trim()
        : importTopic
    ).trim() || 'General Concepts';

    try {
      if (importSourceType === 'json') {
        const parsed = JSON.parse(importText);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        candidates = list.map((item) => ({
          question: {
            subject: item.subject || importSubject || 'mathematics',
            chapter: item.topic || item.chapter || effectiveTopic,
            difficulty: (item.difficulty || 'medium').toLowerCase(),
            q: item.q || item.question || '',
            options: item.options || ['', '', '', ''],
            tags: item.tags || ['entrance'],
            source: item.source || '',
            year: item.year || '',
            status: 'published',
            active: true,
          },
          key: {
            correct: typeof item.correct === 'number' ? item.correct : 0,
            explain: item.explain || item.explanation || '',
          },
        }));
      } else {
        candidates = parseCsvText(importText);
      }

      // Check math and format errors
      const errors: string[] = [];
      const seenHashes = new Set<string>();
      let dups = 0;

      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        if (!c.question.q) {
          errors.push(`Row ${i + 1}: Missing question text.`);
          continue;
        }
        if (!c.question.options || c.question.options.length !== 4) {
          errors.push(`Row ${i + 1}: Exactly 4 options required.`);
          continue;
        }
        const qVal = validateMath(c.question.q);
        if (!qVal.ok) {
          errors.push(`Row ${i + 1}: Math error in stem: ${qVal.errors[0]}`);
        }
        const h = await computeContentHash(c.question.q, c.question.options);
        if (seenHashes.has(h)) {
          dups++;
        } else {
          seenHashes.add(h);
        }
      }

      setDryRunCandidates(candidates);
      setDryRunErrors(errors);
      setDryRunDuplicatesCount(dups);
    } catch (err: unknown) {
      const e = err as { message: string };
      setDryRunErrors([`Parse error: ${e.message}`]);
    }
  };

  const handleFetchGoogleSheet = async () => {
    if (!sheetUrl.trim()) return;
    setFetchingSheet(true);
    setDryRunErrors([]);
    try {
      // Extract Google Sheet ID
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('Please paste a valid Google Sheets URL (e.g., https://docs.google.com/spreadsheets/d/...)');
      }
      const sheetId = match[1];
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const res = await fetch(exportUrl);
      if (!res.ok) {
        throw new Error('Could not fetch sheet. Please ensure "Anyone with the link can view" is enabled in Google Sheets share settings.');
      }
      const csvText = await res.text();
      setImportText(csvText);
      setImportSourceType('csv');

      // Auto trigger dry run
      const candidates = parseCsvText(csvText);
      setDryRunCandidates(candidates);
    } catch (err: unknown) {
      const e = err as { message: string };
      setDryRunErrors([e.message || 'Failed to fetch Google Sheet.']);
    } finally {
      setFetchingSheet(false);
    }
  };

  const handleExecuteImport = async () => {
    if (dryRunCandidates.length === 0 || !user?.email) return;

    if (ENABLE_MULTI_SOURCE_BANK && (importTargetSource === 'bank1' || importTargetSource === 'bank2') && !isBankUnlocked(importTargetSource)) {
      setUnlockError(null);
      setUnlockModalTarget(importTargetSource);
      return;
    }

    setImportProgress({ current: 0, total: dryRunCandidates.length });
    try {
      const effectiveTopic = (
        isCustomImportTopic && customImportTopicInput.trim()
          ? customImportTopicInput.trim()
          : importTopic
      ).trim() || 'General Concepts';

      const isPool = isSubjectPoolSupported(importSubject);
      if (ENABLE_MULTI_SOURCE_BANK || isPool) {
        const rawItems = dryRunCandidates.map((c) => ({
          subject: c.question.subject || importSubject,
          topic: c.question.chapter || effectiveTopic,
          text: c.question.q,
          options: c.question.options,
          correct: c.key.correct,
          explain: c.key.explain,
          difficulty: c.question.difficulty,
          status: c.question.status || 'published',
        }));

        const res = await batchImportPoolQuestions(
          user.email,
          importSubject,
          effectiveTopic,
          rawItems,
          (done, total) => {
            setImportProgress({ current: done, total });
          },
          ENABLE_MULTI_SOURCE_BANK ? importTargetSource : undefined
        );
        setImportResult({ imported: res.imported, duplicatesSkipped: res.duplicatesSkipped });
      } else {
        const res = await batchImportQuestions(user.email, dryRunCandidates, (done, total) => {
          setImportProgress({ current: done, total });
        });
        setImportResult({ imported: res.imported, duplicatesSkipped: res.duplicatesSkipped });
      }

      await loadData();
      if (selectedSubject) await loadTopics(selectedSubject);
      await loadSubjectCounts();
      if (activeTab === 'health') loadHealth();
    } catch (err) {
      console.error('Import failed:', err);
      alert('Batch import encountered an error during write.');
    } finally {
      setImportProgress(null);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 w-full max-w-full font-sans">
      {/* ─── TOP BAR WITH TABS & ACTIONS ────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Question Bank Manager
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            Canonical MCQ repository with KaTeX formulas, chemical equations (\ce), separate answer keys, and instant imports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {ENABLE_MULTI_SOURCE_BANK && (
            <>
              {/* Alpha Bank Unlock */}
              <button
                type="button"
                onClick={() => {
                  if (bankUnlockStates.bank1) {
                    lockBankSource('bank1').then(() => setBankUnlockStates((prev) => ({ ...prev, bank1: false })));
                  } else {
                    setUnlockError(null);
                    setUnlockModalTarget('bank1');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[12px] border text-[13px] font-heading font-semibold transition-colors cursor-pointer ${
                  bankUnlockStates.bank1
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
                title={bankUnlockStates.bank1 ? 'Alpha Bank editing unlocked. Click to lock session.' : 'Click to unlock Alpha Bank editing for this session'}
              >
                {bankUnlockStates.bank1 ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{bankUnlockStates.bank1 ? 'Alpha Bank Unlocked' : 'Unlock Alpha Bank'}</span>
              </button>

              {/* Beta Bank Unlock */}
              <button
                type="button"
                onClick={() => {
                  if (bankUnlockStates.bank2) {
                    lockBankSource('bank2').then(() => setBankUnlockStates((prev) => ({ ...prev, bank2: false })));
                  } else {
                    setUnlockError(null);
                    setUnlockModalTarget('bank2');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[12px] border text-[13px] font-heading font-semibold transition-colors cursor-pointer ${
                  bankUnlockStates.bank2
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
                title={bankUnlockStates.bank2 ? 'Beta Bank editing unlocked. Click to lock session.' : 'Click to unlock Beta Bank editing for this session'}
              >
                {bankUnlockStates.bank2 ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{bankUnlockStates.bank2 ? 'Beta Bank Unlocked' : 'Unlock Beta Bank'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={15} />
            <span>Add MCQ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border text-[13px] font-heading transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-[var(--text)] bg-[var(--card-2)] text-[var(--text)] font-semibold'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Upload size={14} />
            <span>Import CSV / Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRebuildError(null);
              setIsRebuildModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading font-medium text-[var(--text)] transition-colors cursor-pointer"
            title="Recomputes counts with Firestore count() aggregation, rebuilds question_index for every subject and bank, and writes stats/questionCounts"
          >
            <RefreshCw size={14} className={rebuildingCounts ? 'animate-spin' : ''} />
            <span>Rebuild counts & index</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMisfiledError(null);
              setIsMisfiledModalOpen(true);
              handleScanMisfiled();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading font-medium text-[var(--text)] transition-colors cursor-pointer"
            title="Scan for questions placed in the wrong subject pool and move them with confirmation"
          >
            <FolderEdit size={14} className={scanningMisfiled ? 'animate-spin' : ''} />
            <span>Fix misfiled questions</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── WORKSPACE NAVIGATION CHIPS ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-heading transition-colors ${
            activeTab === 'list'
              ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Database size={14} />
          <span>Questions ({questions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-heading transition-colors ${
            activeTab === 'health'
              ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Sparkles size={14} />
          <span>Bank Health</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-heading transition-colors ${
            activeTab === 'reports'
              ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Flag size={14} />
          <span>Student Reports</span>
          {healthStats?.openReportsCount ? (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--accent)] text-white font-bold">
              {healthStats.openReportsCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Failing source banner (Accessible, theme-tokenized with WCAG AA contrast) */}
      {failingSources.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-[16px] bg-rose-50 border border-rose-200 text-[#991B1B] dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle size={18} className="text-[#B91C1C] dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="leading-relaxed">
              <strong>Bank Source Issue:</strong> Failing source(s):{' '}
              <span className="font-semibold underline decoration-rose-400">
                {failingSources.map((s) => `${s.name}${s.errorCode ? ` [${s.errorCode}]` : ''}`).join(', ')}
              </span>
              . The app continues serving questions from other active sources without interruption.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDiagnosticsOpen(true)}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-[10px] border border-rose-600 dark:border-rose-400 bg-white dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-colors"
          >
            Diagnostics
          </button>
        </div>
      )}

      {batchSuccessMessage && (
        <div className="p-3.5 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{batchSuccessMessage}</span>
        </div>
      )}

      {/* ─── TAB 1: QUESTION LIST & BATCH OPERATIONS ────────────────────────── */}
      {activeTab === 'list' && (
        <div className="space-y-5">
          {/* ─── VIEW 1: SUBJECT PICKER (SHOWN FIRST) ─────────────────────────── */}
          {selectedSubject === null ? (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)]">
                <div className="max-w-2xl">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--accent)]/10 text-[var(--accent)] uppercase tracking-wider">
                    Subject Pools
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[var(--text)] mt-2">
                    Select a Subject Pool
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                    Choose a subject to manage its dedicated questions and topics. Nothing loads into memory until a subject is selected.
                  </p>
                </div>
              </div>

              {/* Subject Cards Grid with Counts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((sub) => {
                  const isPool = isSubjectPoolSupported(sub.slug);
                  const count = subjectCounts[sub.slug] ?? 0;

                  return (
                    <div
                      key={sub.slug}
                      onClick={() => {
                        setSelectedSubject(sub.slug);
                        setSelectedTopic('all');
                      }}
                      className={`p-5 rounded-[22px] border transition-all cursor-pointer group flex flex-col justify-between gap-4 ${
                        isPool
                          ? 'border-[var(--accent)]/60 bg-[var(--surface-2)] hover:border-[var(--accent)] hover:shadow-lg'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--text)] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading font-bold text-base text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                              {sub.name}
                            </h3>
                            {isPool && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)] text-white uppercase tracking-wider shadow-xs">
                                Dedicated Pool
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--muted)] mt-1.5 leading-snug">
                            {isPool
                              ? 'Dedicated standalone collection: questions_mathematics'
                              : `${sub.chapters.length} syllabus topics registered`}
                          </p>
                        </div>

                        <div className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] group-hover:text-[var(--text)] group-hover:border-[var(--text)] transition-colors shrink-0">
                          <ChevronRight size={16} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
                        <span className="text-[var(--muted)]">Total Questions:</span>
                        <span className="font-mono font-bold text-sm text-[var(--text)]">
                          {subjectCountsLoading ? 'Counting...' : count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ─── VIEW 2: INSIDE CHOSEN SUBJECT POOL ───────────────────────────── */
            <div className="space-y-4 animate-fadeIn">
              <AdminDiagnosticBanner
                error={error}
                collectionName={isSubjectPoolSupported(selectedSubject) ? getSubjectPoolCollection(selectedSubject) : 'questions'}
                onRetry={loadData}
                retrying={loading}
              />

              {/* Subject Pool Header with Back Button */}
              <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubject(null);
                        setSelectedTopic('all');
                        setQuestions([]);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-2)] hover:bg-[var(--surface-hover)] text-xs font-heading font-semibold text-[var(--text)] transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Subjects</span>
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold font-heading text-[var(--text)] capitalize">
                          {formatSubjectName(selectedSubject)} Pool
                        </h2>
                        {isSubjectPoolSupported(selectedSubject) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)] text-white uppercase tracking-wider">
                            Dedicated Pool
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--muted)]">
                        {isSubjectPoolSupported(selectedSubject)
                          ? `Collection: ${getSubjectPoolCollection(selectedSubject)}`
                          : 'General Question Bank'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedSubject === 'mathematics' && questions.length === 0 && !loading && (
                      <button
                        type="button"
                        onClick={handleSeedMathPool}
                        disabled={seedingMath}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-heading font-semibold hover:bg-[var(--accent)]/20 transition-all cursor-pointer"
                      >
                        <Sparkles size={13} />
                        <span>{seedingMath ? 'Seeding...' : 'Seed 10 Sample MCQs'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Topic Chips with Counts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                      Filter by Topic ({topics.length} topics):
                    </span>
                    {selectedTopic !== 'all' && (
                      <button
                        type="button"
                        onClick={() => {
                          setTopicToRename(selectedTopic);
                          setNewTopicNameInput(selectedTopic);
                          setIsRenameModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        <FolderEdit size={12} />
                        <span>Rename "{selectedTopic}"</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap max-h-36 overflow-y-auto pr-1">
                    {/* All Topics chip */}
                    <button
                      type="button"
                      onClick={() => setSelectedTopic('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-heading transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedTopic === 'all'
                          ? 'bg-[var(--text)] text-[var(--bg)] font-bold shadow-xs'
                          : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
                      }`}
                    >
                      <span>All Topics</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({topicsLoading ? '...' : topics.reduce((acc, t) => acc + t.count, 0)})
                      </span>
                    </button>

                    {/* Individual topic chips */}
                    {topics.map((t) => {
                      const isChosen = selectedTopic === t.name;
                      return (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setSelectedTopic(t.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-heading transition-all cursor-pointer flex items-center gap-1.5 ${
                            isChosen
                              ? 'bg-[var(--accent)] text-white font-bold shadow-xs'
                              : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
                          }`}
                        >
                          <span>{t.name}</span>
                          <span className="text-[10px] opacity-75 font-mono">({t.count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search & Difficulty & Status Filters */}
                <div className="pt-2 border-t border-[var(--border)] space-y-3">
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)]">
                    <Search size={16} className="text-[var(--muted)] shrink-0" />
                    <input
                      type="text"
                      placeholder={`Search in ${formatSubjectName(selectedSubject)}${selectedTopic !== 'all' ? ` · ${selectedTopic}` : ''}...`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-transparent border-none text-[13px] font-heading text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-[12px] font-heading">
                    {/* Difficulty */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--muted)] text-[11px]">Difficulty:</span>
                      <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="px-2.5 py-1 rounded-[8px] bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)] text-[12px]"
                      >
                        <option value="all">All levels</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--muted)] text-[11px]">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2.5 py-1 rounded-[8px] bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)] text-[12px]"
                      >
                        <option value="all">All statuses</option>
                        <option value="published">Published</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    {/* "Needs review" filter for reasoning artifact detection */}
                    <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)] text-[12px] cursor-pointer hover:border-[var(--brand)] transition-colors select-none" title="Filter questions whose explanation contains 'Wait', 'Re-evaluating' or 'let\'s set'">
                      <input
                        type="checkbox"
                        checked={needsReviewOnly}
                        onChange={(e) => setNeedsReviewOnly(e.target.checked)}
                        className="rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                      />
                      <span className={needsReviewOnly ? 'text-amber-500 font-semibold' : 'text-[var(--text)]'}>
                        Needs review
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={loadData}
                      disabled={loading}
                      className="ml-auto text-[11px] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                      <span>Refresh Filtered</span>
                    </button>
                  </div>
                </div>

                {/* Batch Actions Toolbar when items selected */}
                {selectedIds.size > 0 && (
                  <div className="mt-2 p-3 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
                    <div className="text-[12px] font-heading text-[var(--text)] font-semibold flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-[11px] font-bold">
                        {selectedIds.size}
                      </span>
                      <span>questions selected</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetMoveTopic(topics[0]?.name || 'General Concepts');
                          setTargetMoveNewTopic('');
                          setIsMoveModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-heading font-medium bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] transition-colors cursor-pointer"
                      >
                        <FolderEdit size={13} />
                        <span>Move to Topic</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleBatchPublish}
                        disabled={batchActionLoading}
                        className="px-3 py-1.5 rounded-[10px] text-[12px] font-heading font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                      >
                        Publish selected
                      </button>

                      <button
                        type="button"
                        onClick={handleBatchArchive}
                        disabled={batchActionLoading}
                        className="px-3 py-1.5 rounded-[10px] text-[12px] font-heading font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                      >
                        Archive selected
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        className="px-2 py-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        Deselect all
                      </button>
                    </div>
                  </div>
                )}
              </div>

          {/* Select all row */}
          {displayedQuestions.length > 0 && (
            <div className="flex items-center justify-between px-2 text-[12px] font-heading text-[var(--muted)]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.size === displayedQuestions.length && displayedQuestions.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-[var(--border)] accent-[var(--accent)]"
                />
                <span>Select all visible ({displayedQuestions.length})</span>
              </label>
              <span>
                Showing {displayedQuestions.length} questions
                {needsReviewOnly && ' (filtered for reasoning residue)'}
              </span>
            </div>
          )}

          {/* Question Cards Feed */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3">
                  <div className="h-4 bg-[var(--card-2)] rounded w-1/3" />
                  <div className="h-5 bg-[var(--card-2)] rounded w-3/4" />
                  <div className="h-10 bg-[var(--card-2)] rounded w-full" />
                </div>
              ))
            ) : displayedQuestions.length === 0 ? (
              <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
                <p className="font-heading text-[14px] text-[var(--muted)]">
                  {needsReviewOnly
                    ? 'No questions found with reasoning residue ("Wait", "Re-evaluating", or "let\'s set"). All clean!'
                    : 'No questions found matching your filter criteria.'}
                </p>
              </div>
            ) : (
              displayedQuestions.map((q) => {
                const stem = q.q || q.question || 'Untitled question';
                const options = q.options || [];
                const isSelected = selectedIds.has(q.id);
                const hasReasoningResidue = containsReasoningResidue(q.explain || q.explanation, q.q || q.question);

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-[24px] bg-[var(--card)] border transition-all ${
                      isSelected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)]'
                    } flex flex-col gap-3.5`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(q.id)}
                          className="rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                        />
                        <span className="text-[11px] font-heading px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text)] font-semibold">
                          {formatSubjectName(q.subject)}
                        </span>
                        {q.chapter && (
                          <span className="text-[11px] font-heading px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] truncate max-w-[200px]">
                            {formatChapterName(q.subject, q.chapter)}
                          </span>
                        )}
                        <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                          {q.difficulty}
                        </span>
                        {hasReasoningResidue && (
                          <span
                            className="text-[10px] font-heading px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold flex items-center gap-1"
                            title="Explanation or stem contains reasoning artifact ('Wait', 'Re-evaluating', or 'let\'s set')"
                          >
                            <AlertTriangle size={10} />
                            <span>Needs review</span>
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-heading px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                            q.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {q.status}
                        </span>
                        {q.active === false && (
                          <span className="text-[10px] font-heading px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Archived
                          </span>
                        )}
                        {ENABLE_MULTI_SOURCE_BANK && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--accent)] font-semibold bg-[var(--accent)]/5">
                            {q.sourceId || parseQuestionCompoundId(q.id).sourceId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(q)}
                          className="p-1.5 rounded-[8px] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                          title="Edit question & answer key"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuestionToDelete(q)}
                          className="p-1.5 rounded-[8px] text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--surface-hover)] transition-colors"
                          title="Delete question permanently"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Question Stem with KaTeX */}
                    <div className="text-[14px] text-[var(--text)] font-heading leading-relaxed">
                      <MathText text={stem} />
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {options.map((opt, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-[12px] border border-[var(--border)] bg-transparent text-[var(--text)] text-[13px] font-heading flex items-start gap-2"
                        >
                          <span className="font-heading font-semibold text-[11px] mt-0.5 shrink-0 opacity-70">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <div className="min-w-0 flex-1">
                            <MathText text={opt} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer metadata: ID and contentHash */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)] pt-1 border-t border-[var(--border)]">
                      <span>id: {q.id}</span>
                      {q.contentHash && <span className="truncate max-w-[150px]">hash: {q.contentHash.slice(0, 12)}…</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-6">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] text-sm font-semibold text-[var(--text)] transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Loading more questions…</span>
                  </>
                ) : (
                  <span>Load More (Next 20)</span>
                )}
              </button>
              </div>
            )}
          </div>
        )}
      </div>
    )}

      {/* ─── TAB 2: BANK HEALTH METRICS ──────────────────────────────────────── */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold font-heading text-[var(--text)]">
              Question Bank Health & Balance
            </h2>
            <button
              type="button"
              onClick={loadHealth}
              disabled={healthLoading}
              className="px-3 py-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--card)] text-[12px] font-heading text-[var(--text)] flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={healthLoading ? 'animate-spin' : ''} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* ─── MULTI-SOURCE QUESTION BANK CONNECTIVITY & DIAGNOSTICS (TASK 6) ──── */}
          {ENABLE_MULTI_SOURCE_BANK && (
            <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-[15px] font-bold font-heading text-[var(--text)] flex items-center gap-2">
                    <Database size={16} className="text-[var(--accent)]" />
                    <span>Multi-Source Question Banks Status (Triple-Project Quota)</span>
                  </h3>
                  <p className="text-[12px] text-[var(--muted)]">
                    Real-time connectivity, latency, Firestore permissions, and MCQ counts across Core Bank, Alpha Bank, and Beta Bank.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleProbeBankSources}
                  disabled={probingBankHealth}
                  className="px-3 py-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--card-2)] hover:bg-[var(--surface-hover)] text-[12px] font-heading font-semibold text-[var(--text)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={probingBankHealth ? 'animate-spin' : ''} />
                  <span>{probingBankHealth ? 'Testing Connections…' : 'Probe Bank Sources Now'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bankSourceDiagnostics.map((diag) => {
                  const isHealthy = diag.healthy;
                  let subtitle = 'Core Bank · AI Studio Master Project';
                  if (diag.id === 'bank1') {
                    subtitle = 'Alpha Bank · Extra Daily Quota (boardly-8c0cd)';
                  } else if (diag.id === 'bank2') {
                    subtitle = 'Beta Bank · Default Save Target (boardly-2)';
                  }

                  return (
                    <div
                      key={diag.id}
                      className={`p-4 rounded-[18px] border transition-all flex flex-col justify-between ${
                        isHealthy
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-rose-500/5 border-rose-500/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-bold text-[14px] text-[var(--text)]">
                                {diag.name}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--card-2)] border border-[var(--border)] text-[var(--muted)]">
                                {diag.id}
                              </span>
                            </div>
                            <span className="text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">
                              {subtitle}
                            </span>
                            {!isHealthy && (
                              <div className="mt-1.5 text-xs text-rose-700 dark:text-rose-400 font-medium leading-snug">
                                {diag.errorCode === 'permission-denied'
                                  ? "Couldn't read question counts: permission denied"
                                  : `Couldn't read question counts: ${diag.errorCode || 'error encountered'}`}
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-heading font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5 border ${
                              isHealthy
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isHealthy ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-rose-600 dark:bg-rose-400 animate-pulse'
                              }`}
                            />
                            <span>{isHealthy ? 'Healthy' : 'Failing'}</span>
                          </span>
                        </div>

                        {/* Question Count */}
                        <div className="mt-3.5 p-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between">
                          <span className="text-[11px] font-heading text-[var(--muted)]">Question Count:</span>
                          <span className="font-dot text-[15px] font-bold text-[var(--text)]">
                            {!isHealthy ? (
                              <span className="text-rose-700 dark:text-rose-400 font-sans text-xs font-semibold">
                                Unavailable
                              </span>
                            ) : diag.questionCount !== undefined ? (
                              `${diag.questionCount.toLocaleString()} MCQs`
                            ) : (
                              <span className="text-[var(--muted)] font-sans text-xs">
                                Unavailable
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold ${
                            isHealthy
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {isHealthy ? 'Operational' : 'Isolated'}
                        </span>
                        {diag.latencyMs !== undefined && (
                          <span className="font-mono text-[10px] text-[var(--muted)]">{diag.latencyMs}ms</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {healthStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-4 rounded-[20px] bg-[var(--card)] border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--muted)] uppercase font-semibold">Total Pool</span>
                  <div className="text-[28px] font-dot font-extrabold text-[var(--text)] mt-1">
                    {healthStats.totalQuestions}
                  </div>
                  <span className="text-[11px] text-emerald-400">
                    {healthStats.activeCount} active · {healthStats.inactiveCount} archived
                  </span>
                </div>

                <div className="p-4 rounded-[20px] bg-[var(--card)] border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--muted)] uppercase font-semibold">By Difficulty</span>
                  <div className="text-[13px] font-heading mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-emerald-400">Easy:</span>
                      <span className="font-semibold text-[var(--text)]">{healthStats.byDifficulty.easy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-400">Medium:</span>
                      <span className="font-semibold text-[var(--text)]">{healthStats.byDifficulty.medium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-400">Hard:</span>
                      <span className="font-semibold text-[var(--text)]">{healthStats.byDifficulty.hard}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-[20px] bg-[var(--card)] border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--muted)] uppercase font-semibold">Open Reports</span>
                  <div className="text-[28px] font-dot font-extrabold text-[var(--accent)] mt-1">
                    {healthStats.openReportsCount}
                  </div>
                  <span className="text-[11px] text-[var(--muted)]">Student issue submissions</span>
                </div>

                <div className="p-4 rounded-[20px] bg-[var(--card)] border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--muted)] uppercase font-semibold">Duplicates</span>
                  <div className="text-[28px] font-dot font-extrabold text-[var(--text)] mt-1">
                    {healthStats.duplicatesDetected}
                  </div>
                  <span className="text-[11px] text-emerald-400">Identified via contentHash</span>
                </div>

                <div className={`p-4 rounded-[20px] bg-[var(--card)] border ${healthStats.invalidCorrectCount > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-[var(--border)]'}`}>
                  <span className="text-[11px] text-[var(--muted)] uppercase font-semibold">Key Integrity</span>
                  <div className={`text-[28px] font-dot font-extrabold mt-1 ${healthStats.invalidCorrectCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {healthStats.invalidCorrectCount}
                  </div>
                  <span className="text-[11px] text-[var(--muted)]">
                    {healthStats.invalidCorrectCount > 0
                      ? 'Flagged (hidden from tests)'
                      : 'All keys verified valid'}
                  </span>
                </div>
              </div>

              {healthStats.invalidCorrectCount > 0 && (
                <div className="p-4 rounded-[16px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span>
                      <strong>{healthStats.invalidCorrectCount} MCQ(s) flagged</strong> with missing or invalid correct answers. The test engine automatically hides them from student tests to protect grading accuracy.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-[var(--muted)] font-heading">
              Loading bank health diagnostics…
            </div>
          )}

          {/* Subject Breakdown table */}
          {healthStats && (
            <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-4">
              <h3 className="font-heading font-bold text-[15px] text-[var(--text)]">
                Subject Distribution
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((sub) => {
                  const count = healthStats.bySubject[sub.slug] || 0;
                  return (
                    <div
                      key={sub.slug}
                      className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-heading font-semibold text-[13px] text-[var(--text)]">
                          {sub.name}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">{sub.chapters.length} chapters defined</div>
                      </div>
                      <div className="font-dot text-[20px] font-bold text-[var(--text)]">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: STUDENT ISSUE REPORTS ───────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold font-heading text-[var(--text)]">
              Student Question Reports ({reports.length})
            </h2>
            <button
              type="button"
              onClick={loadReports}
              disabled={reportsLoading}
              className="px-3 py-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--card)] text-[12px] font-heading text-[var(--text)] flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={reportsLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {reportsLoading ? (
            <div className="p-6 text-center text-[var(--muted)] font-heading">
              Loading student reports…
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
              <p className="font-heading text-[14px] text-[var(--muted)]">
                Zero open issue reports. The question bank is in top condition!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-[20px] bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-heading px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-semibold uppercase">
                        {rep.reason}
                      </span>
                      <span className="text-[12px] font-mono text-[var(--muted)]">
                        Question ID: {rep.questionId}
                      </span>
                      <span className="text-[11px] text-[var(--muted)]">
                        by {rep.userEmail || rep.userId}
                      </span>
                    </div>
                    {rep.comment && (
                      <p className="text-[13px] font-heading text-[var(--text)] italic">
                        "{rep.comment}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!user?.email || !rep.id) return;
                        await updateQuestionReportStatus(user.email, rep.id, 'resolved');
                        await loadReports();
                      }}
                      className="px-3 py-1.5 rounded-[10px] text-[12px] font-heading font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!user?.email || !rep.id) return;
                        await updateQuestionReportStatus(user.email, rep.id, 'dismissed');
                        await loadReports();
                      }}
                      className="px-3 py-1.5 rounded-[10px] text-[12px] font-heading font-medium border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: BULK IMPORT MODAL / PANEL ───────────────────────────────── */}
      {activeTab === 'import' && (
        <div className="p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-[18px] font-bold font-heading text-[var(--text)]">
                Bulk Question Ingestion
              </h2>
              <p className="text-[13px] font-heading text-[var(--muted)] mt-0.5">
                Import thousands of entrance MCQs via CSV, JSON, or Google Sheets with duplicate skipping and math validation.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border border-[var(--border)] bg-[var(--card-2)] text-[13px] font-heading text-[var(--text)] hover:border-[var(--text)] transition-colors"
            >
              <Download size={14} />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* Import Source Switcher */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <button
              type="button"
              onClick={() => setImportSourceType('csv')}
              className={`px-3 py-1 rounded-full text-[12px] font-heading ${
                importSourceType === 'csv'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Paste CSV Text
            </button>
            <button
              type="button"
              onClick={() => setImportSourceType('sheet')}
              className={`px-3 py-1 rounded-full text-[12px] font-heading ${
                importSourceType === 'sheet'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Google Sheet URL
            </button>
            <button
              type="button"
              onClick={() => setImportSourceType('json')}
              className={`px-3 py-1 rounded-full text-[12px] font-heading ${
                importSourceType === 'json'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Paste JSON
            </button>
          </div>

          {/* Destination Subject Pool & Fallback Topic Selection */}
          <div className="p-4 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] space-y-3">
            <span className="text-xs font-semibold uppercase text-[var(--muted)] tracking-wider block">
              Destination Subject Pool &amp; Fallback Topic
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                  Target Subject (asks first):
                </label>
                <select
                  value={importSubject}
                  onChange={(e) => {
                    const nextSub = e.target.value;
                    setImportSubject(nextSub);
                    loadTopics(nextSub);
                  }}
                  className="w-full px-3 py-2 rounded-[10px] bg-[var(--card)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name} {isSubjectPoolSupported(s.slug) ? '★ (Dedicated Pool)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-heading text-[var(--muted)]">
                    Default Topic (used if not in row):
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomImportTopic(!isCustomImportTopic)}
                    className="text-[10px] text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                  >
                    {isCustomImportTopic ? 'Pick existing' : '+ Type new topic'}
                  </button>
                </div>

                {isCustomImportTopic ? (
                  <input
                    type="text"
                    value={customImportTopicInput}
                    onChange={(e) => setCustomImportTopicInput(e.target.value)}
                    placeholder="Enter new topic name..."
                    className="w-full px-3 py-2 rounded-[10px] bg-[var(--card)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                  />
                ) : (
                  <select
                    value={importTopic}
                    onChange={(e) => setImportTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] bg-[var(--card)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                  >
                    {topics.length > 0 ? (
                      topics.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.count} MCQs)
                        </option>
                      ))
                    ) : (
                      <option value="General Concepts">General Concepts</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            {ENABLE_MULTI_SOURCE_BANK && (
              <div className="pt-2 border-t border-[var(--border)]">
                <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                  Save to Question Bank Source (defaults to Beta Bank):
                </label>
                <select
                  value={importTargetSource}
                  onChange={(e) => setImportTargetSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-[10px] bg-[var(--card)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                >
                  {bankSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name} {source.id === 'bank2' ? '★ (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-[11px] text-[var(--muted)] italic">
              Note: If your CSV rows contain "subject" or "topic"/"chapter" columns, those row values will be preserved. Otherwise, questions will be saved under the chosen subject pool and topic above. Duplicates are skipped on import.
            </p>
          </div>

          {/* Google Sheet URL form */}
          {importSourceType === 'sheet' && (
            <div className="space-y-3">
              <label className="block text-[12px] font-heading text-[var(--muted)]">
                Google Spreadsheet Share URL (ensure link view access is on):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleFetchGoogleSheet}
                  disabled={fetchingSheet || !sheetUrl}
                  className="px-4 py-2.5 rounded-[12px] bg-[var(--text)] text-[var(--bg)] font-heading text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>{fetchingSheet ? 'Fetching…' : 'Fetch & Parse'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Text Area for CSV or JSON */}
          {importSourceType !== 'sheet' && (
            <div className="space-y-2">
              <label className="block text-[12px] font-heading text-[var(--muted)]">
                Paste your raw {importSourceType.toUpperCase()} content:
              </label>
              <textarea
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={
                  importSourceType === 'csv'
                    ? 'subject,chapter,difficulty,question,option_a,option_b,option_c,option_d,correct,explanation\nmathematics,integration-by-parts,medium,"Evaluate $\\int x dx$","$\\frac{x^2}{2}+C$","$x^2+C$","$x+C$","$2x+C$",0,"Standard power rule."'
                    : '[{"subject": "mathematics", "chapter": "integration-by-parts", "q": "...", "options": ["A","B","C","D"], "correct": 0}]'
                }
                className="w-full p-3 font-mono text-[12px] rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRunDryRun}
                disabled={!importText.trim()}
                className="px-4 py-2 rounded-[12px] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Run Validation & Dry-Run Preview
              </button>
            </div>
          )}

          {/* Dry Run Preview Table */}
          {dryRunCandidates.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[var(--border)] animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-heading font-bold text-[15px] text-[var(--text)]">
                    Dry Run Preview: {dryRunCandidates.length} valid rows found
                  </h3>
                  <p className="text-[12px] text-[var(--muted)]">
                    {dryRunDuplicatesCount > 0 ? (
                      <span className="text-amber-400 font-semibold mr-2">
                        {dryRunDuplicatesCount} duplicates skipped automatically.
                      </span>
                    ) : null}
                    {dryRunErrors.length > 0 ? (
                      <span className="text-rose-400 font-semibold">
                        {dryRunErrors.length} validation errors noted below.
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        All rows passed LaTeX & schema verification!
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importProgress !== null}
                  className="px-5 py-2.5 rounded-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-heading text-[13px] font-bold shadow-lg transition-colors disabled:opacity-50"
                >
                  Commit Batch Import to Database
                </button>
              </div>

              {/* Progress bar during commit */}
              {importProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-heading text-[var(--muted)]">
                    <span>Importing into Firestore in 200-item chunks…</span>
                    <span>
                      {importProgress.current} / {importProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--card-2)] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {importResult && (
                <div className="p-4 rounded-[16px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>
                    Successfully imported {importResult.imported} questions! (
                    {importResult.duplicatesSkipped} duplicates skipped)
                  </span>
                </div>
              )}

              {/* Preview table (first 5) */}
              <div className="overflow-x-auto rounded-[16px] border border-[var(--border)]">
                <table className="w-full text-left text-[12px] font-heading">
                  <thead className="bg-[var(--card-2)] text-[var(--muted)] border-b border-[var(--border)]">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5">Chapter</th>
                      <th className="p-2.5">Diff</th>
                      <th className="p-2.5">Question Stem</th>
                      <th className="p-2.5">Correct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {dryRunCandidates.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                        <td className="p-2.5 font-mono text-[var(--muted)]">{idx + 1}</td>
                        <td className="p-2.5 text-[var(--text)]">{row.question.subject}</td>
                        <td className="p-2.5 text-[var(--muted)]">{row.question.chapter}</td>
                        <td className="p-2.5 text-[var(--muted)]">{row.question.difficulty}</td>
                        <td className="p-2.5 text-[var(--text)] max-w-[280px] truncate">
                          {row.question.q}
                        </td>
                        <td className="p-2.5 text-emerald-400 font-bold">
                          Option {String.fromCharCode(65 + row.key.correct)}
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

      {/* ─── ADD / EDIT / PREVIEW QUESTION MODAL ────────────────────────────── */}
      {isEditModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-[740px] max-h-[92vh] bg-[var(--card)] border border-[var(--border)] rounded-[24px] p-5 sm:p-6 flex flex-col z-10 overflow-hidden shadow-2xl">
            {/* Modal Header with tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalTab('question')}
                  className={`px-3 py-1.5 rounded-[10px] text-[13px] font-heading transition-colors ${
                    modalTab === 'question'
                      ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  1. Question Content
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('key')}
                  className={`px-3 py-1.5 rounded-[10px] text-[13px] font-heading transition-colors ${
                    modalTab === 'key'
                      ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  2. Answer Key & Derivation
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('preview')}
                  className={`px-3 py-1.5 rounded-[10px] text-[13px] font-heading transition-colors ${
                    modalTab === 'preview'
                      ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  3. Student Preview
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* LaTeX Quick Insertion Toolbar */}
            <div className="py-2 px-1 border-b border-[var(--border)] bg-[var(--card-2)] rounded-[12px] my-2 shrink-0 flex items-center gap-1 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase px-2 shrink-0">
                Formula Insert:
              </span>
              {LATEX_SNIPPETS.map((snip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertLatexSnippet(snip.snippet)}
                  className="px-2 py-1 rounded-[6px] text-[11px] font-mono border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] text-[var(--text)] shrink-0 transition-colors"
                  title={`Insert ${snip.snippet}`}
                >
                  {snip.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              {/* TAB 1: QUESTION CONTENT */}
              {modalTab === 'question' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Bank Source Destination Selector (Requirement 7 & 8) */}
                  {ENABLE_MULTI_SOURCE_BANK && (
                    <div className="p-3 rounded-[14px] bg-[var(--card-2)] border border-[var(--border)]">
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        Save to Question Bank Source:
                      </label>
                      {editingQuestion.id ? (
                        <div className="flex items-center justify-between text-[12px] font-heading text-[var(--text)]">
                          <span>
                            Editing existing question on source:{' '}
                            <strong className="text-[var(--accent)]">
                              {bankSources.find((s) => s.id === editingQuestionSourceId)?.name || editingQuestionSourceId}
                            </strong>
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">(Preserves source of origin)</span>
                        </div>
                      ) : (
                        <select
                          value={selectedSaveSource}
                          onChange={(e) => setSelectedSaveSource(e.target.value)}
                          className="w-full px-3 py-2 rounded-[10px] bg-[var(--card)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                        >
                          {bankSources.map((source) => (
                            <option key={source.id} value={source.id}>
                              {source.name} {source.id === 'bank2' ? '★ (Default)' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Subject and Topic (Subject first, then Topic: pick existing or type new) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        1. Subject (select first)
                      </label>
                      <select
                        value={editingQuestion.subject}
                        onChange={(e) => {
                          const s = e.target.value;
                          loadTopics(s);
                          setEditingQuestion({
                            ...editingQuestion,
                            subject: s,
                            chapter: 'General Concepts',
                          });
                        }}
                        className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                      >
                        {subjects.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.name} {isSubjectPoolSupported(s.slug) ? '★ (Dedicated Pool)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-heading text-[var(--muted)]">
                          2. Topic (pick existing or type new)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomTopicAdd(!isCustomTopicAdd)}
                          className="text-[10px] text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                        >
                          {isCustomTopicAdd ? 'Pick existing' : '+ Type new topic'}
                        </button>
                      </div>

                      {isCustomTopicAdd ? (
                        <input
                          type="text"
                          placeholder="Type new topic name..."
                          value={customTopicNameInput}
                          onChange={(e) => setCustomTopicNameInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                        />
                      ) : (
                        <select
                          value={editingQuestion.chapter}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, chapter: e.target.value })}
                          className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                        >
                          {topics.length > 0 ? (
                            topics.map((t) => (
                              <option key={t.name} value={t.name}>
                                {t.name} ({t.count} MCQs)
                              </option>
                            ))
                          ) : (
                            getChaptersForSubject(editingQuestion.subject).map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))
                          )}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Difficulty, Status & Active */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        Difficulty
                      </label>
                      <select
                        value={editingQuestion.difficulty}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                          })
                        }
                        className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        Status
                      </label>
                      <select
                        value={editingQuestion.status}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            status: e.target.value as 'draft' | 'reviewed' | 'published',
                          })
                        }
                        className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                      >
                        <option value="published">Published</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        Active in Bank
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingQuestion({ ...editingQuestion, active: !editingQuestion.active })
                        }
                        className={`w-full py-2 rounded-[12px] border text-[13px] font-heading font-semibold transition-colors ${
                          editingQuestion.active
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {editingQuestion.active ? 'Active' : 'Archived'}
                      </button>
                    </div>
                  </div>

                  {/* Question Stem textarea with live preview & error box */}
                  <div>
                    <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                      Question Stem (plain text, $inline math$, $$display math$$, or $\ce{} chemistry)
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={editingQuestion.q}
                      onFocus={() =>
                        setActiveFocusedInputRef({
                          id: 'q',
                          currentVal: editingQuestion.q,
                          setter: (val) => setEditingQuestion((prev) => (prev ? { ...prev, q: val } : null)),
                        })
                      }
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, q: e.target.value })}
                      placeholder="e.g. Find the general solution of the differential equation $\frac{dy}{dx} = k y$."
                      className="w-full p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                    />

                    {/* Live Preview Box */}
                    {editingQuestion.q && (
                      <div className="mt-1.5 p-3 rounded-[10px] bg-[var(--card)] border border-[var(--border)] text-[13px]">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)] block mb-1">
                          Live Render:
                        </span>
                        <MathText text={editingQuestion.q} />
                      </div>
                    )}
                  </div>

                  {/* 4 Options with KaTeX rendering and focused setter */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-heading text-[var(--muted)]">
                      Options (exactly 4 options):
                    </label>
                    {editingQuestion.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full border border-[var(--border)] text-[11px] font-heading font-bold shrink-0 flex items-center justify-center text-[var(--muted)]">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onFocus={() =>
                            setActiveFocusedInputRef({
                              id: `opt_${idx}`,
                              currentVal: opt,
                              setter: (val) => {
                                setEditingQuestion((prev) => {
                                  if (!prev) return null;
                                  const opts = [...prev.options] as [string, string, string, string];
                                  opts[idx] = val;
                                  return { ...prev, options: opts };
                                });
                              },
                            })
                          }
                          onChange={(e) => {
                            const next = [...editingQuestion.options] as [string, string, string, string];
                            next[idx] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: next });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          className="flex-1 px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Optional Tags, Source, Year */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        Source Exam / Book
                      </label>
                      <input
                        type="text"
                        value={editingQuestion.source || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, source: e.target.value })}
                        placeholder="e.g. NUST NET 2023 Past Papers"
                        className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        value={editingQuestion.year || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, year: e.target.value })}
                        placeholder="e.g. 2024"
                        className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ANSWER KEY & EXPLANATION */}
              {modalTab === 'key' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)]">
                    <span className="text-[11px] text-[var(--muted)] font-semibold uppercase block mb-1">
                      Strict Security Architecture:
                    </span>
                    <p className="text-[12px] font-heading text-[var(--muted)]">
                      The correct answer index and explanation are saved strictly in the restricted <code className="text-emerald-400">questionKeys</code> collection, never sent to clients during test sessions.
                    </p>
                  </div>

                  {/* Correct Option Radio Chips */}
                  <div>
                    <label className="block text-[12px] font-heading text-[var(--muted)] mb-2">
                      Select Correct Answer:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map((idx) => {
                        const isCorrect = editingQuestion.correct === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditingQuestion({ ...editingQuestion, correct: idx })}
                            className={`p-3 rounded-[14px] border text-[13px] font-heading flex items-center justify-between transition-all ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold ring-1 ring-emerald-500'
                                : 'border-[var(--border)] bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]'
                            }`}
                          >
                            <span>Option {String.fromCharCode(65 + idx)}</span>
                            {isCorrect && <Check size={16} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation Derivation */}
                  <div>
                    <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                      Step-by-step Derivation & Shortcut (supports math):
                    </label>
                    <textarea
                      rows={4}
                      value={editingQuestion.explain}
                      onFocus={() =>
                        setActiveFocusedInputRef({
                          id: 'explain',
                          currentVal: editingQuestion.explain,
                          setter: (val) => setEditingQuestion((prev) => (prev ? { ...prev, explain: val } : null)),
                        })
                      }
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, explain: e.target.value })}
                      placeholder="e.g. Using the integration by parts rule $\int u \, dv = uv - \int v \, du$..."
                      className="w-full p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                    />

                    {editingQuestion.explain && (
                      <div className="mt-1.5 p-3 rounded-[10px] bg-[var(--card)] border border-[var(--border)] text-[13px]">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)] block mb-1">
                          Explanation Preview:
                        </span>
                        <MathText text={editingQuestion.explain} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: STUDENT PREVIEW AS CARD */}
              {modalTab === 'preview' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Theme and Show/Hide toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--muted)]">Preview theme:</span>
                      <button
                        type="button"
                        onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
                        className="px-2.5 py-1 rounded-[8px] border border-[var(--border)] text-[12px] font-heading flex items-center gap-1.5 text-[var(--text)]"
                      >
                        {previewTheme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                        <span>{previewTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                      </button>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-heading text-[var(--muted)] select-none">
                      <input
                        type="checkbox"
                        checked={previewShowKey}
                        onChange={(e) => setPreviewShowKey(e.target.checked)}
                        className="rounded border-[var(--border)] accent-[var(--accent)]"
                      />
                      <span>Highlight Answer Key</span>
                    </label>
                  </div>

                  {/* Student View Mock Card */}
                  <div
                    className={`p-6 rounded-[24px] border ${
                      previewTheme === 'light'
                        ? 'bg-[#ffffff] text-[#111111] border-[#e0e0e0]'
                        : 'bg-[#0f0f11] text-[#ededed] border-[#222225]'
                    } space-y-4 shadow-xl`}
                  >
                    <div className="flex items-center justify-between text-[12px] opacity-70">
                      <span>Question 01 of 20</span>
                      <span className="uppercase font-semibold tracking-wider">
                        {formatSubjectName(editingQuestion.subject)} ·{' '}
                        {formatChapterName(editingQuestion.subject, editingQuestion.chapter)}
                      </span>
                    </div>

                    <div className="text-[16px] font-heading font-semibold leading-relaxed">
                      <MathText text={editingQuestion.q || 'Question stem preview will appear here.'} />
                    </div>

                    <div className="space-y-2 pt-2">
                      {editingQuestion.options.map((opt, i) => {
                        const isCorrect = previewShowKey && editingQuestion.correct === i;
                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-[14px] border text-[13px] font-heading flex items-start gap-2.5 transition-colors ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-500/15 font-semibold text-emerald-400'
                                : previewTheme === 'light'
                                ? 'border-[#e0e0e0] bg-[#f7f7f8]'
                                : 'border-[#222225] bg-[#161619]'
                            }`}
                          >
                            <span className="font-bold opacity-75">{String.fromCharCode(65 + i)}.</span>
                            <div className="flex-1">
                              <MathText text={opt || `Option ${String.fromCharCode(65 + i)}`} />
                            </div>
                            {isCorrect && <Check size={16} className="text-emerald-400" />}
                          </div>
                        );
                      })}
                    </div>

                    {previewShowKey && editingQuestion.explain && (
                      <div className="p-3 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-[12px] font-heading space-y-1">
                        <span className="font-bold text-emerald-400 block">Derivation / Solution:</span>
                        <MathText text={editingQuestion.explain} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="px-5 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {savingQuestion ? 'Saving to Database…' : 'Save MCQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE QUESTION MODAL ───────────────────────────────────── */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setQuestionToDelete(null)}
          />
          <div className="relative w-full max-w-[420px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
              Permanently Delete Question?
            </h3>
            <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
              This will erase both the question from the entrance test pool and its answer key. Old student attempts will gracefully render "Question no longer available" without crashing.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-[12px] border border-[var(--red)] bg-[var(--red)] text-white text-[13px] font-heading font-semibold cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RENAME TOPIC MODAL ─────────────────────────────────────────────── */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsRenameModalOpen(false)}
          />
          <div className="relative w-full max-w-[420px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
                Rename Topic
              </h3>
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="font-heading text-[12px] text-[var(--muted)] leading-relaxed">
              Renaming topic <strong>"{topicToRename}"</strong> will update all questions in the{' '}
              <strong className="capitalize">{formatSubjectName(selectedSubject || '')}</strong> pool that currently belong to this topic.
            </p>

            <form onSubmit={handleRenameTopic} className="space-y-4">
              <div>
                <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                  New Topic Name:
                </label>
                <input
                  type="text"
                  required
                  value={newTopicNameInput}
                  onChange={(e) => setNewTopicNameInput(e.target.value)}
                  placeholder="e.g. Sequences, Series & Binomial Theorem"
                  className="w-full px-3 py-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renamingTopic || !newTopicNameInput.trim()}
                  className="px-4 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {renamingTopic ? 'Updating...' : 'Save & Rename'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MOVE QUESTIONS TO TOPIC MODAL ────────────────────────────────────── */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsMoveModalOpen(false)}
          />
          <div className="relative w-full max-w-[440px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
                Move {selectedIds.size} Questions
              </h3>
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="font-heading text-[12px] text-[var(--muted)] leading-relaxed">
              Select the target topic in <strong className="capitalize">{formatSubjectName(selectedSubject || '')}</strong> to move the {selectedIds.size} selected question(s) into.
            </p>

            <form onSubmit={handleMoveQuestions} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-heading text-[var(--muted)]">
                  Target Topic:
                </label>

                {topics.length > 0 && (
                  <select
                    value={targetMoveTopic}
                    onChange={(e) => setTargetMoveTopic(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                  >
                    {topics.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.count} MCQs)
                      </option>
                    ))}
                  </select>
                )}

                <div>
                  <label className="block text-[10px] font-heading text-[var(--muted)] mb-1">
                    Or create a new target topic:
                  </label>
                  <input
                    type="text"
                    value={targetMoveNewTopic}
                    onChange={(e) => setTargetMoveNewTopic(e.target.value)}
                    placeholder="Type new topic name..."
                    className="w-full px-3 py-2 rounded-[10px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={movingQuestions || (!targetMoveTopic && !targetMoveNewTopic.trim())}
                  className="px-4 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {movingQuestions ? 'Moving Questions...' : 'Move Questions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── UNLOCK DEDICATED AUTH MODAL (Alpha Bank / Beta Bank) ────────────────── */}
      {unlockModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setUnlockModalTarget(null)}
          />
          <div className="relative w-full max-w-[440px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl animate-fadeIn">
            {(() => {
              const targetBank = getBankSource(unlockModalTarget);
              const bankName = targetBank?.name || (unlockModalTarget === 'bank1' ? 'Alpha Bank' : 'Beta Bank');
              const projectId =
                BANK_SOURCE_CONFIGS.find((b) => b.id === unlockModalTarget)?.firebaseConfig?.projectId ||
                (unlockModalTarget === 'bank1' ? 'boardly-8c0cd' : 'boardly-2');

              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Lock size={16} />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
                          Unlock {bankName}
                        </h3>
                        <p className="text-[11px] text-[var(--muted)] font-mono">Project: {projectId}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnlockModalTarget(null)}
                      className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p className="font-heading text-[12px] text-[var(--muted)] leading-relaxed">
                    Writing to or editing <strong>{bankName}</strong> requires a separate admin sign-in to its dedicated Firebase Auth instance. This authentication is kept in-memory for this session only; passwords are never stored.
                  </p>

                  {unlockError && (
                    <div className="p-3 rounded-[12px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{unlockError}</span>
                    </div>
                  )}

                  <form onSubmit={handleUnlockSubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        {bankName} Admin Email:
                      </label>
                      <input
                        type="email"
                        required
                        value={unlockEmail}
                        onChange={(e) => setUnlockEmail(e.target.value)}
                        placeholder="admin@boardly.app"
                        className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        {bankName} Admin Password:
                      </label>
                      <input
                        type="password"
                        required
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setUnlockModalTarget(null)}
                        className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={unlockLoading}
                        className="px-4 py-2 rounded-[12px] border border-amber-500/50 bg-amber-500 hover:bg-amber-600 text-black text-[13px] font-heading font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Unlock size={14} />
                        <span>{unlockLoading ? 'Authenticating…' : `Unlock ${bankName}`}</span>
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* ─── REBUILD COUNTS & INDEX MODAL ────────────────────────────────────── */}
      {isRebuildModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[24px] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2">
                  <RefreshCw size={18} className={`text-[var(--accent)] ${rebuildingCounts ? 'animate-spin' : ''}`} />
                  <h3 className="font-heading font-bold text-base text-[var(--text)]">
                    Rebuild Counts & Index
                  </h3>
                </div>
                <p className="font-heading text-xs text-[var(--muted)] mt-1">
                  Recomputes question counts using Firestore <code className="font-mono text-[var(--text)]">count()</code> aggregation (zero full reads), rebuilds <code className="font-mono text-[var(--text)]">question_index/&lt;subject&gt;</code> for every bank and subject, normalizes all topic names, and updates <code className="font-mono text-[var(--text)]">stats/questionCounts</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRebuildModalOpen(false)}
                disabled={rebuildingCounts}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {rebuildError && (
              <div className="p-3.5 rounded-[14px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-heading flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                <span>{rebuildError}</span>
              </div>
            )}

            {rebuildingCounts && (
              <div className="p-6 rounded-[18px] bg-[var(--card-2)] border border-[var(--border)] text-center space-y-3">
                <RefreshCw size={28} className="animate-spin mx-auto text-[var(--accent)]" />
                <p className="font-heading font-semibold text-sm text-[var(--text)]">
                  Recomputing counts & rebuilding indexes...
                </p>
                <p className="font-heading text-xs text-[var(--muted)] max-w-md mx-auto">
                  Performing Firestore count() aggregations across active banks (Core Bank, Alpha Bank, Beta Bank) and syncing stats/questionCounts.
                </p>
              </div>
            )}

            {rebuildResult && !rebuildingCounts && (
              <div className="space-y-4">
                <div className="p-4 rounded-[16px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span className="font-heading text-sm font-semibold">
                    Rebuild completed successfully! Counts and indexes are now in sync.
                  </span>
                </div>

                {/* Total Questions Comparison Card */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)]">
                    <span className="font-heading text-[11px] text-[var(--muted)] uppercase tracking-wider block">
                      Total Questions (Before)
                    </span>
                    <span className="font-dot text-2xl font-bold text-[var(--muted)] mt-1 block">
                      {rebuildResult.before.totalQuestions.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)]">
                    <span className="font-heading text-[11px] text-[var(--muted)] uppercase tracking-wider block">
                      Total Questions (After)
                    </span>
                    <span className="font-dot text-2xl font-bold text-emerald-400 mt-1 block">
                      {rebuildResult.after.totalQuestions.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] col-span-2 sm:col-span-1">
                    <span className="font-heading text-[11px] text-[var(--muted)] uppercase tracking-wider block">
                      Difference
                    </span>
                    <span className="font-dot text-2xl font-bold text-[var(--text)] mt-1 block">
                      {rebuildResult.after.totalQuestions - rebuildResult.before.totalQuestions >= 0 ? '+' : ''}
                      {(rebuildResult.after.totalQuestions - rebuildResult.before.totalQuestions).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Active Banks Breakdown */}
                <div className="p-4 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] space-y-2.5">
                  <h4 className="font-heading font-semibold text-xs text-[var(--text)] uppercase tracking-wider">
                    Bank Sources Breakdown
                  </h4>
                  <div className="space-y-1.5 text-xs font-heading">
                    {Object.keys({ ...rebuildResult.before.bankBreakdown, ...rebuildResult.after.bankBreakdown }).map((bankId) => {
                      const beforeCount = rebuildResult.before.bankBreakdown[bankId] ?? 0;
                      const afterCount = rebuildResult.after.bankBreakdown[bankId] ?? 0;
                      const diff = afterCount - beforeCount;
                      const bankObj = bankSources.find((b) => b.id === bankId);
                      const bankLabel = bankObj ? `${bankObj.name} (${bankId})` : bankId;

                      return (
                        <div key={bankId} className="flex items-center justify-between p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                          <span className="font-medium text-[var(--text)]">{bankLabel}</span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-[var(--muted)]">{beforeCount}</span>
                            <span className="text-[var(--muted)]">→</span>
                            <span className="font-bold text-emerald-400">{afterCount}</span>
                            {diff !== 0 && (
                              <span className="text-[10px] text-emerald-400/80">({diff > 0 ? `+${diff}` : diff})</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subjects Breakdown */}
                <div className="p-4 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] space-y-2.5">
                  <h4 className="font-heading font-semibold text-xs text-[var(--text)] uppercase tracking-wider">
                    Questions by Subject (Sum across all banks)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-heading">
                    {Object.keys({ ...rebuildResult.before.subjectCounts, ...rebuildResult.after.subjectCounts }).map((sub) => {
                      const beforeCount = rebuildResult.before.subjectCounts[sub] ?? 0;
                      const afterCount = rebuildResult.after.subjectCounts[sub] ?? 0;
                      const diff = afterCount - beforeCount;

                      return (
                        <div key={sub} className="flex items-center justify-between p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                          <span className="text-[var(--text)] capitalize">{formatSubjectName(sub)}</span>
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="text-[var(--muted)]">{beforeCount}</span>
                            <span className="text-[var(--muted)]">→</span>
                            <span className="font-bold text-[var(--text)]">{afterCount}</span>
                            {diff !== 0 && (
                              <span className="text-[10px] text-emerald-400">({diff > 0 ? `+${diff}` : diff})</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Details Log */}
                {rebuildResult.details.length > 0 && (
                  <div className="p-3 rounded-[14px] bg-[var(--card-2)] border border-[var(--border)] space-y-1">
                    <span className="font-heading text-[10px] text-[var(--muted)] uppercase tracking-wider block">
                      Execution Log
                    </span>
                    {rebuildResult.details.map((d, i) => (
                      <p key={i} className="font-mono text-[11px] text-[var(--muted)]">
                        • {d}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsRebuildModalOpen(false)}
                disabled={rebuildingCounts}
                className="px-4 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer disabled:opacity-50"
              >
                {rebuildResult ? 'Close' : 'Cancel'}
              </button>
              {!rebuildResult && (
                <button
                  type="button"
                  onClick={handleRunRebuild}
                  disabled={rebuildingCounts}
                  className="px-4 py-2 rounded-[12px] bg-[var(--text)] text-[var(--bg)] font-heading font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw size={14} className={rebuildingCounts ? 'animate-spin' : ''} />
                  <span>{rebuildingCounts ? 'Rebuilding...' : 'Run Rebuild & Sync'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── FIX MISFILED QUESTIONS MODAL ────────────────────────────────────── */}
      {isMisfiledModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[24px] p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2">
                  <FolderEdit size={18} className={`text-[var(--accent)] ${scanningMisfiled || fixingMisfiled ? 'animate-spin' : ''}`} />
                  <h3 className="font-heading font-bold text-base text-[var(--text)]">
                    Fix Misfiled Questions
                  </h3>
                </div>
                <p className="font-heading text-xs text-[var(--muted)] mt-1">
                  Scans question pools across active banks for subject mismatches (e.g. English vocabulary or Physics formulas misfiled into Mathematics). Moves them atomically, updates indexes, and adjusts stats/questionCounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMisfiledModalOpen(false)}
                disabled={scanningMisfiled || fixingMisfiled}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {misfiledError && (
              <div className="p-3.5 rounded-[14px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-heading flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                <span>{misfiledError}</span>
              </div>
            )}

            {scanningMisfiled && (
              <div className="p-8 rounded-[18px] bg-[var(--card-2)] border border-[var(--border)] text-center space-y-3">
                <RefreshCw size={28} className="animate-spin mx-auto text-[var(--accent)]" />
                <p className="font-heading font-semibold text-sm text-[var(--text)]">
                  Scanning question pools across all banks...
                </p>
                <p className="font-heading text-xs text-[var(--muted)] max-w-md mx-auto">
                  Inspecting stems, topics, and explicit metadata to detect misfiled questions across active question sources.
                </p>
              </div>
            )}

            {fixingMisfiled && (
              <div className="p-8 rounded-[18px] bg-[var(--card-2)] border border-[var(--border)] text-center space-y-3">
                <RefreshCw size={28} className="animate-spin mx-auto text-emerald-400" />
                <p className="font-heading font-semibold text-sm text-[var(--text)]">
                  Relocating questions & syncing indices...
                </p>
                <p className="font-heading text-xs text-[var(--muted)] max-w-md mx-auto">
                  Moving documents to canonical collections, updating question_index arrays, and committing stats/questionCounts atomically.
                </p>
              </div>
            )}

            {fixMisfiledResult && !fixingMisfiled && (
              <div className="space-y-4">
                <div className="p-4 rounded-[16px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span className="font-heading text-sm font-semibold">
                    Successfully relocated {fixMisfiledResult.fixedCount} misfiled question{fixMisfiledResult.fixedCount === 1 ? '' : 's'}!
                  </span>
                </div>

                <div className="p-4 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] space-y-2">
                  <h4 className="font-heading font-semibold text-xs text-[var(--text)] uppercase tracking-wider">
                    Relocation Confirmation Summary
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {fixMisfiledResult.fixed.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs font-heading space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-[var(--muted)] truncate">{item.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {formatSubjectName(item.oldSubject)} → {formatSubjectName(item.newSubject)}
                          </span>
                        </div>
                        <p className="text-[var(--text)] font-medium line-clamp-1">"{item.stem}"</p>
                        <p className="text-[11px] text-[var(--muted)]">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!scanningMisfiled && !fixingMisfiled && !fixMisfiledResult && (
              <>
                {misfiledCandidates.length === 0 ? (
                  <div className="p-8 rounded-[18px] bg-[var(--card-2)] border border-[var(--border)] text-center space-y-3">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                    <p className="font-heading font-semibold text-sm text-[var(--text)]">
                      No misfiled questions detected!
                    </p>
                    <p className="font-heading text-xs text-[var(--muted)] max-w-md mx-auto">
                      All questions across your active bank sources are currently filed in their correct subject pools.
                    </p>
                    <button
                      type="button"
                      onClick={handleScanMisfiled}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-heading font-medium text-[var(--text)] cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>Re-scan Question Pools</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-semibold text-[var(--text)]">
                        Detected Misfiled Questions ({misfiledCandidates.length})
                      </span>
                      <span className="text-[11px] font-heading text-amber-500 font-medium">
                        Requires confirmation before moving
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto">
                      {misfiledCandidates.map((c, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-[16px] bg-[var(--card-2)] border border-amber-500/30 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-mono text-[11px] text-[var(--muted)]">{c.id}</span>
                            <div className="flex items-center gap-1.5 text-xs font-heading">
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px]">
                                Current: {formatSubjectName(c.currentPoolSubject)}
                              </span>
                              <span>→</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">
                                Target: {formatSubjectName(c.proposedSubject)}
                              </span>
                            </div>
                          </div>
                          <p className="font-heading text-xs font-medium text-[var(--text)] line-clamp-2">
                            "{c.stem}"
                          </p>
                          <p className="font-heading text-[11px] text-[var(--muted)]">
                            Reason: {c.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsMisfiledModalOpen(false)}
                disabled={scanningMisfiled || fixingMisfiled}
                className="px-4 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer disabled:opacity-50"
              >
                {fixMisfiledResult ? 'Close' : 'Cancel'}
              </button>
              {misfiledCandidates.length > 0 && !fixingMisfiled && !fixMisfiledResult && (
                <button
                  type="button"
                  onClick={handleApplyFixMisfiled}
                  className="px-4 py-2 rounded-[12px] bg-[var(--accent)] hover:opacity-90 text-white font-heading font-semibold text-[13px] transition-opacity cursor-pointer flex items-center gap-2"
                >
                  <FolderEdit size={14} />
                  <span>Confirm and Move ({misfiledCandidates.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── DIAGNOSTICS BOTTOM SHEET / DRAWER ──────────────────────────────── */}
      {isDiagnosticsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsDiagnosticsOpen(false)}
        >
          <div
            className="w-full sm:max-w-xl max-h-[85vh] rounded-t-[24px] sm:rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--text)]">
                    Bank Sources Diagnostics
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Real-time status and failure logs across connected banks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                aria-label="Close diagnostics"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {bankSourceDiagnostics.filter((d) => !d.healthy).length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-semibold text-[var(--text)]">All bank sources are healthy</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    No active connectivity or permission failures recorded.
                  </p>
                </div>
              ) : (
                bankSourceDiagnostics
                  .filter((d) => !d.healthy)
                  .map((diag) => {
                    const formattedTime = diag.lastChecked
                      ? new Date(diag.lastChecked).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'Recently';

                    const detailsPayload = JSON.stringify(
                      {
                        sourceId: diag.id,
                        sourceName: diag.name,
                        operation: diag.operation || 'reading stats/questionCounts',
                        errorCode: diag.errorCode || 'unknown',
                        errorMessage: diag.errorMessage || 'Unknown error',
                        timestamp: diag.lastChecked ? new Date(diag.lastChecked).toISOString() : new Date().toISOString(),
                      },
                      null,
                      2
                    );

                    const isCopied = copiedDiagnosticId === diag.id;

                    return (
                      <div
                        key={diag.id}
                        className="p-4 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-bold text-sm text-[var(--text)]">
                                {diag.name}
                              </span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--card-2)] border border-[var(--border)] text-[var(--muted)]">
                                {diag.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--muted)] mt-0.5">
                              Recorded at {formattedTime}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(detailsPayload);
                              setCopiedDiagnosticId(diag.id);
                              setTimeout(() => setCopiedDiagnosticId(null), 2000);
                            }}
                            className="px-2.5 py-1 rounded-[8px] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <>
                                <Check size={12} className="text-emerald-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy details</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-[var(--muted)]">Operation: </span>
                            <span className="font-mono text-[11px] text-[var(--text)] font-medium">
                              {diag.operation || 'reading stats/questionCounts'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[var(--muted)]">Error: </span>
                            <span className="text-rose-700 dark:text-rose-400 font-sans text-xs font-semibold">
                              {diag.errorMessage || 'Missing or insufficient permissions.'}
                            </span>
                          </div>

                          <div className="mt-2 pt-2 border-t border-[var(--border)]">
                            <span className="text-[10px] uppercase font-mono text-[var(--muted)] block mb-1">
                              Technical Payload:
                            </span>
                            <pre className="p-2.5 rounded-lg bg-[var(--card-2)] border border-[var(--border)] text-[10px] font-mono text-[var(--text)] overflow-x-auto whitespace-pre-wrap break-all">
                              {detailsPayload}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(false)}
                className="w-full py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQuestionsPage;

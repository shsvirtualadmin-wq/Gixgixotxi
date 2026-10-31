import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Plus,
  Upload,
  Trash2,
  Edit3,
  Check,
  X,
  Search,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Link2,
  ArrowUp,
  ArrowDown,
  Eye,
  Flag,
  Activity,
  Building2,
  Layers,
  Download,
  RefreshCw,
  Play,
  FileText,
  Sparkles,
  MoreHorizontal,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  GripVertical,
  HelpCircle,
  Copy,
} from 'lucide-react';
import {
  D1UniversityRow,
  D1McqRow,
  D1McqReportRow,
  PRE_SEEDED_UNIVERSITIES,
} from '../../constants/d1Universities';

function getUniversityInitials(name: string): string {
  const trimmed = String(name || '').trim();
  const preset = PRE_SEEDED_UNIVERSITIES.find(
    (u) => u.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (preset?.shortName) return preset.shortName.slice(0, 4).toUpperCase();
  const words = trimmed.replace(/[()]/g, '').split(/[\s-]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}
import {
  fetchUniversities,
  createUniversity,
  updateUniversity,
  reorderUniversities,
  deleteUniversity,
  fetchMcqs,
  fetchUniversityTopics,
  createMcq,
  updateMcq,
  deleteMcq,
  bulkDeleteMcqs,
  fetchBankHealth,
  fixBankHealthIntegrity,
  moveMcqsToUniversity,
  getUniversityMcqExportUrl,
  fetchMcqReports,
  updateMcqReportStatus,
  convertGoogleSheetToCsvUrl,
  parseImportInput,
  runChunkedMcqImport,
  ParsedImportMcqRow,
  ImportRowError,
  ChunkImportProgress,
  ResumableImportState,
  BankHealthData,
} from '../../services/universityMcqService';
import { MathText, validateMath } from '../../components/ui/MathText';
import { LineLoader, ButtonLineLoader } from '../../components/ui/LineLoader';
import { useAuth } from '../../contexts/AuthContext';

type ActiveTab = 'questions' | 'health' | 'reports';
type BulkSourceTab = 'csv' | 'gsheet' | 'paste';
type BulkWizardStep = 1 | 2 | 3;

const LATEX_SNIPPETS: Array<{ label: string; snippet: string; title: string }> = [
  { label: 'a/b', snippet: '$\\frac{a}{b}$', title: 'Fraction' },
  { label: '√x', snippet: '$\\sqrt{x}$', title: 'Square root' },
  { label: 'x²', snippet: '$x^{2}$', title: 'Superscript' },
  { label: 'xᵢ', snippet: '$x_{i}$', title: 'Subscript' },
  { label: 'H₂O', snippet: '$\\ce{H2O}$', title: 'Chemistry formula (mhchem)' },
  { label: '→', snippet: '$\\ce{->}$', title: 'Reaction arrow' },
  { label: '⇌', snippet: '$\\ce{<=>}$', title: 'Equilibrium arrow' },
  { label: 'Δ', snippet: '$\\Delta$', title: 'Delta' },
  { label: '∫', snippet: '$\\int_{a}^{b}$', title: 'Integral' },
  { label: '∑', snippet: '$\\sum_{i=1}^{n}$', title: 'Summation' },
  { label: 'θ', snippet: '$\\theta$', title: 'Theta' },
  { label: 'π', snippet: '$\\pi$', title: 'Pi' },
];

const COMMON_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Computer Science',
  'Intelligence / IQ',
  'Analytical Reasoning',
  'Quantitative Reasoning',
];

const SAMPLE_CSV_TEMPLATE = `subject,topic,question,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty
Physics,Kinematics,"A projectile is launched at $45^{\\circ}$ with speed $v_0$. What is its horizontal range?",$\\frac{v_0^2}{g}$,$\\frac{v_0^2}{2g}$,$\\frac{2v_0^2}{g}$,$\\frac{v_0}{g}$,A,"At $\\theta = 45^{\\circ}$, $\\sin(2\\theta) = 1$, so $R = \\frac{v_0^2}{g}$.",medium
Chemistry,Stoichiometry,"Identify the oxidizing agent in $\\ce{Zn + CuSO4 -> ZnSO4 + Cu}$.",$\\ce{Zn}$,$\\ce{Cu^{2+}}$,$\\ce{SO4^{2-}}$,$\\ce{Zn^{2+}}$,B,"$\\ce{Cu^{2+}}$ gains electrons and is reduced, so it acts as the oxidizing agent.",easy`;

interface ComboboxFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

const ComboboxField: React.FC<ComboboxFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select or type…',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const normalizedQuery = value.trim().toLowerCase();
  const filtered = useMemo(() => {
    const unique = Array.from(new Set(options.filter(Boolean)));
    if (!normalizedQuery) return unique.slice(0, 12);
    return unique
      .filter((item) => item.toLowerCase().includes(normalizedQuery))
      .slice(0, 12);
  }, [options, normalizedQuery]);

  const exactExists = useMemo(
    () =>
      Boolean(
        normalizedQuery &&
          options.some((item) => item.trim().toLowerCase() === normalizedQuery)
      ),
    [options, normalizedQuery]
  );

  return (
    <div ref={containerRef} className="relative min-w-0">
      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="aqb-input pr-9"
        />
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={`Toggle ${label} suggestions`}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {open && (filtered.length > 0 || value.trim().length > 0) && (
        <div className="aqb-dropdown-menu left-0 right-0 max-h-52 overflow-y-auto mt-1">
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="aqb-dropdown-item justify-between"
            >
              <span className="truncate">{opt}</span>
              {value.trim().toLowerCase() === opt.toLowerCase() && (
                <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />
              )}
            </button>
          ))}
          {value.trim().length > 0 && !exactExists && (
            <button
              type="button"
              onClick={() => {
                onChange(value.trim());
                setOpen(false);
              }}
              className="aqb-dropdown-item text-[var(--accent)] font-bold"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Create new: &ldquo;{value.trim()}&rdquo;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const AdminQuestionsPage: React.FC = () => {
  const { profileLoading, isAdmin } = useAuth();

  // Navigation & Primary Menus
  const [activeTab, setActiveTab] = useState<ActiveTab>('questions');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const overflowMenuRef = useRef<HTMLDivElement | null>(null);

  // Core Data State
  const [universities, setUniversities] = useState<D1UniversityRow[]>([]);
  const [selectedUniId, setSelectedUniId] = useState<string>('uni_fast-nuces');
  const [mcqs, setMcqs] = useState<D1McqRow[]>([]);
  const [totalMcqsForFilter, setTotalMcqsForFilter] = useState<number>(0);
  const [mcqPageOffset, setMcqPageOffset] = useState<number>(0);
  const [loadingMoreMcqs, setLoadingMoreMcqs] = useState(false);
  const [uniTopics, setUniTopics] = useState<
    Array<{ subject: string; total: number; topics: Array<{ topic: string; count: number }> }>
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mcqsLoading, setMcqsLoading] = useState<boolean>(false);

  // Filters & Search (Collapsed by default)
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSheetOpen, setFilterSheetOpen] = useState<boolean>(false);

  // MCQ Card Expansion & Multi-Select
  const [expandedMcqId, setExpandedMcqId] = useState<string | null>(null);
  const [selectedMcqIds, setSelectedMcqIds] = useState<Set<string>>(new Set());

  // Destructive & Move Confirmation Modals
  const [confirmDeleteMcqModal, setConfirmDeleteMcqModal] = useState<{
    ids: string[];
    label: string;
  } | null>(null);
  const [deletingMcqs, setDeletingMcqs] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveTargetUniId, setMoveTargetUniId] = useState<string>('');
  const [movingMcqs, setMovingMcqs] = useState(false);

  // University Switcher & Manager Bottom Sheet
  const [uniSheetOpen, setUniSheetOpen] = useState(false);
  const [uniSheetMode, setUniSheetMode] = useState<'switch' | 'manage'>('switch');
  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const [uniFormModalOpen, setUniFormModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState<D1UniversityRow | null>(null);
  const [uniNameInput, setUniNameInput] = useState('');
  const [uniSlugInput, setUniSlugInput] = useState('');
  const [uniLogoInput, setUniLogoInput] = useState('');
  const [savingUni, setSavingUni] = useState(false);
  const [confirmDeleteUni, setConfirmDeleteUni] = useState<D1UniversityRow | null>(null);
  const [deletingUni, setDeletingUni] = useState(false);

  // Single MCQ Bottom Sheet
  const [mcqModalOpen, setMcqModalOpen] = useState(false);
  const [editingMcq, setEditingMcq] = useState<D1McqRow | null>(null);
  const [mcqTargetUniId, setMcqTargetUniId] = useState<string>('');
  const [mcqUniPickerOpen, setMcqUniPickerOpen] = useState(false);
  const [mcqSubject, setMcqSubject] = useState('Physics');
  const [mcqTopic, setMcqTopic] = useState('Kinematics');
  const [mcqDifficulty, setMcqDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptA, setMcqOptA] = useState('');
  const [mcqOptB, setMcqOptB] = useState('');
  const [mcqOptC, setMcqOptC] = useState('');
  const [mcqOptD, setMcqOptD] = useState('');
  const [mcqCorrect, setMcqCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [mcqExplanation, setMcqExplanation] = useState('');
  const [mcqPreviewOpen, setMcqPreviewOpen] = useState(false);
  const [mcqDirty, setMcqDirty] = useState(false);
  const [savingMcq, setSavingMcq] = useState(false);
  const questionInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Bulk Import 3-Step Wizard Bottom Sheet
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<BulkWizardStep>(1);
  const [bulkSourceTab, setBulkSourceTab] = useState<BulkSourceTab>('csv');
  const [bulkTargetUniId, setBulkTargetUniId] = useState<string>('');
  const [bulkChangingUni, setBulkChangingUni] = useState(false);
  const [bulkDefaultSubject, setBulkDefaultSubject] = useState('Physics');
  const [bulkDefaultTopic, setBulkDefaultTopic] = useState('General');
  const [bulkFormatHintOpen, setBulkFormatHintOpen] = useState(false);
  const [bulkRawInput, setBulkRawInput] = useState('');
  const [bulkCsvFileName, setBulkCsvFileName] = useState('');
  const [gsheetUrl, setGsheetUrl] = useState('');
  const [fetchingSheet, setFetchingSheet] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedImportMcqRow[]>([]);
  const [parseErrors, setParseErrors] = useState<ImportRowError[]>([]);
  const [duplicateRowsCount, setDuplicateRowsCount] = useState<number>(0);
  const [importingChunked, setImportingChunked] = useState(false);
  const [importProgress, setImportProgress] = useState<ChunkImportProgress | null>(null);
  const [resumableState, setResumableState] = useState<ResumableImportState | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Bank Health & Reports State
  const [healthData, setHealthData] = useState<BankHealthData | null>(null);
  const [fixingHealthKey, setFixingHealthKey] = useState<string | null>(null);
  const [reports, setReports] = useState<D1McqReportRow[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'open' | 'resolved' | 'ignored'>('all');

  // Swipe-to-close tracking for Bottom Sheets
  const touchStartYRef = useRef<number | null>(null);

  // Status Banner
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const showBanner = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setBannerMessage({ type, text });
    setTimeout(() => {
      setBannerMessage((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setOverflowMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Derived Selected University
  const selectedUniversity = useMemo(
    () =>
      universities.find((u) => u.id === selectedUniId || u.slug === selectedUniId) ||
      universities[0] ||
      null,
    [universities, selectedUniId]
  );

  const mcqModalUniversity = useMemo(
    () =>
      universities.find((u) => u.id === mcqTargetUniId || u.slug === mcqTargetUniId) ||
      selectedUniversity,
    [universities, mcqTargetUniId, selectedUniversity]
  );

  const bulkModalUniversity = useMemo(
    () =>
      universities.find((u) => u.id === bulkTargetUniId || u.slug === bulkTargetUniId) ||
      selectedUniversity,
    [universities, bulkTargetUniId, selectedUniversity]
  );

  // Load Universities, Health & Reports
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [unis, health, reps] = await Promise.all([
        fetchUniversities(),
        fetchBankHealth(),
        fetchMcqReports(),
      ]);
      setUniversities(unis);
      setHealthData(health);
      setReports(reps);
      if (unis.length > 0 && !unis.some((u) => u.id === selectedUniId)) {
        setSelectedUniId(unis[0].id);
      }
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to load question bank');
    } finally {
      setLoading(false);
    }
  }, [selectedUniId, showBanner]);

  useEffect(() => {
    if (isAdmin) {
      loadInitialData();
    }
  }, [isAdmin, loadInitialData]);

  // Load MCQs & Topics for Selected University
  const loadUniversityMcqs = useCallback(
    async (resetOffset = true) => {
      if (!selectedUniId) return;
      setMcqsLoading(true);
      try {
        const nextOffset = resetOffset ? 0 : mcqPageOffset;
        const [mcqRes, topicsRes] = await Promise.all([
          fetchMcqs({
            university_id: selectedUniId,
            subject: filterSubject !== 'all' ? filterSubject : undefined,
            topic: filterTopic !== 'all' ? filterTopic : undefined,
            difficulty: filterDifficulty !== 'all' ? filterDifficulty : undefined,
            search: searchQuery.trim() || undefined,
            limit: 50,
            offset: nextOffset,
            include_answers: true,
          }),
          fetchUniversityTopics(selectedUniId),
        ]);
        if (resetOffset) {
          setMcqs(mcqRes.mcqs);
          setMcqPageOffset(mcqRes.mcqs.length);
          setSelectedMcqIds(new Set());
        } else {
          setMcqs((prev) => [...prev, ...mcqRes.mcqs]);
          setMcqPageOffset((prev) => prev + mcqRes.mcqs.length);
        }
        setTotalMcqsForFilter(mcqRes.total);
        setUniTopics(topicsRes.subjects || []);
      } catch (err: any) {
        showBanner('error', err?.message || 'Failed to load university MCQs');
      } finally {
        setMcqsLoading(false);
      }
    },
    [selectedUniId, filterSubject, filterTopic, filterDifficulty, searchQuery, mcqPageOffset, showBanner]
  );

  useEffect(() => {
    if (isAdmin && selectedUniId) {
      loadUniversityMcqs(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedUniId, filterSubject, filterTopic, filterDifficulty, searchQuery]);

  const handleLoadMoreMcqs = async () => {
    if (loadingMoreMcqs || mcqs.length >= totalMcqsForFilter) return;
    setLoadingMoreMcqs(true);
    try {
      const mcqRes = await fetchMcqs({
        university_id: selectedUniId,
        subject: filterSubject !== 'all' ? filterSubject : undefined,
        topic: filterTopic !== 'all' ? filterTopic : undefined,
        difficulty: filterDifficulty !== 'all' ? filterDifficulty : undefined,
        search: searchQuery.trim() || undefined,
        limit: 50,
        offset: mcqs.length,
        include_answers: true,
      });
      setMcqs((prev) => [...prev, ...mcqRes.mcqs]);
      setMcqPageOffset((prev) => prev + mcqRes.mcqs.length);
      setTotalMcqsForFilter(mcqRes.total);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to load more questions');
    } finally {
      setLoadingMoreMcqs(false);
    }
  };

  // Safe Close Helpers for Bottom Sheets (Esc, Back button, Swipe-down, Unsaved guard)
  const requestCloseMcqModal = useCallback(() => {
    if (mcqDirty && !savingMcq) {
      const discard = window.confirm('You have unsaved changes in this MCQ. Discard changes?');
      if (!discard) return;
    }
    setMcqModalOpen(false);
    setMcqDirty(false);
    setMcqUniPickerOpen(false);
  }, [mcqDirty, savingMcq]);

  const requestCloseBulkModal = useCallback(() => {
    if (importingChunked) {
      const stop = window.confirm('An import is currently running. Stop and close?');
      if (!stop) return;
      abortControllerRef.current?.abort();
      setImportingChunked(false);
    } else if (bulkRawInput.trim().length > 0 && (!importProgress || importProgress.processedRows === 0)) {
      const discard = window.confirm('Discard your prepared bulk import data?');
      if (!discard) return;
    }
    setBulkModalOpen(false);
  }, [importingChunked, bulkRawInput, importProgress]);

  useEffect(() => {
    const anySheetOpen = mcqModalOpen || bulkModalOpen || uniSheetOpen || filterSheetOpen;
    if (!anySheetOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mcqModalOpen) requestCloseMcqModal();
        else if (bulkModalOpen) requestCloseBulkModal();
        else if (uniSheetOpen) setUniSheetOpen(false);
        else if (filterSheetOpen) setFilterSheetOpen(false);
      }
    };

    const handlePopState = () => {
      if (mcqModalOpen) requestCloseMcqModal();
      else if (bulkModalOpen) requestCloseBulkModal();
      else if (uniSheetOpen) setUniSheetOpen(false);
      else if (filterSheetOpen) setFilterSheetOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [mcqModalOpen, bulkModalOpen, uniSheetOpen, filterSheetOpen, requestCloseMcqModal, requestCloseBulkModal]);

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleSheetTouchEnd = (e: React.TouchEvent, onClose: () => void) => {
    if (touchStartYRef.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    if (endY - touchStartYRef.current > 75) {
      onClose();
    }
    touchStartYRef.current = null;
  };

  // ============================================================================
  // University CRUD & Reordering
  // ============================================================================
  const openAddUniversityModal = () => {
    setEditingUni(null);
    setUniNameInput('');
    setUniSlugInput('');
    setUniLogoInput('');
    setUniFormModalOpen(true);
  };

  const openEditUniversityModal = (uni: D1UniversityRow) => {
    setEditingUni(uni);
    setUniNameInput(uni.name);
    setUniSlugInput(uni.slug);
    setUniLogoInput(uni.logo_url || '');
    setUniFormModalOpen(true);
  };

  const handleSaveUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniNameInput.trim()) return;
    setSavingUni(true);
    try {
      if (editingUni) {
        await updateUniversity(editingUni.id, {
          name: uniNameInput.trim(),
          slug: uniSlugInput.trim() || undefined,
          logo_url: uniLogoInput.trim(),
        });
        showBanner('success', `Updated ${uniNameInput.trim()}`);
      } else {
        const created = await createUniversity({
          name: uniNameInput.trim(),
          slug: uniSlugInput.trim() || undefined,
          logo_url: uniLogoInput.trim(),
          sort_order: universities.length + 1,
        });
        setSelectedUniId(created.id);
        showBanner('success', `Added ${created.name}`);
      }
      setUniFormModalOpen(false);
      await loadInitialData();
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to save university');
    } finally {
      setSavingUni(false);
    }
  };

  const handleMoveUniversity = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= universities.length) return;
    const reordered = [...universities];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setUniversities(reordered);
    try {
      const updated = await reorderUniversities(reordered.map((u) => u.id));
      setUniversities(updated);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to reorder universities');
    }
  };

  const handleConfirmDeleteUniversity = async () => {
    if (!confirmDeleteUni) return;
    setDeletingUni(true);
    try {
      await deleteUniversity(confirmDeleteUni.id);
      showBanner('success', `Deleted ${confirmDeleteUni.name}`);
      setConfirmDeleteUni(null);
      await loadInitialData();
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to delete university');
    } finally {
      setDeletingUni(false);
    }
  };

  // ============================================================================
  // Single MCQ Create / Edit / Delete
  // ============================================================================
  const openAddMcqModal = () => {
    setEditingMcq(null);
    setMcqTargetUniId(selectedUniId);
    setMcqUniPickerOpen(false);
    setMcqSubject(filterSubject !== 'all' ? filterSubject : uniTopics[0]?.subject || 'Physics');
    setMcqTopic(filterTopic !== 'all' ? filterTopic : uniTopics[0]?.topics[0]?.topic || 'General');
    setMcqDifficulty('medium');
    setMcqQuestion('');
    setMcqOptA('');
    setMcqOptB('');
    setMcqOptC('');
    setMcqOptD('');
    setMcqCorrect('A');
    setMcqExplanation('');
    setMcqPreviewOpen(false);
    setMcqDirty(false);
    setMcqModalOpen(true);
  };

  const openEditMcqModal = (mcq: D1McqRow) => {
    setEditingMcq(mcq);
    setMcqTargetUniId(mcq.university_id || selectedUniId);
    setMcqUniPickerOpen(false);
    setMcqSubject(mcq.subject);
    setMcqTopic(mcq.topic);
    setMcqDifficulty(mcq.difficulty || 'medium');
    setMcqQuestion(mcq.question);
    setMcqOptA(mcq.option_a);
    setMcqOptB(mcq.option_b);
    setMcqOptC(mcq.option_c);
    setMcqOptD(mcq.option_d);
    setMcqCorrect(mcq.correct_answer || 'A');
    setMcqExplanation(mcq.explanation || '');
    setMcqPreviewOpen(false);
    setMcqDirty(false);
    setMcqModalOpen(true);
  };

  const insertLatexSnippet = (snippet: string) => {
    const el = questionInputRef.current;
    if (!el) {
      setMcqQuestion((prev) => `${prev} ${snippet}`.trim());
      setMcqDirty(true);
      return;
    }
    const start = el.selectionStart ?? mcqQuestion.length;
    const end = el.selectionEnd ?? mcqQuestion.length;
    const next = mcqQuestion.slice(0, start) + snippet + mcqQuestion.slice(end);
    setMcqQuestion(next);
    setMcqDirty(true);
    setTimeout(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    }, 10);
  };

  const handleSaveMcq = async (addAnother: boolean) => {
    const targetId = mcqTargetUniId || selectedUniId;
    if (!targetId) {
      showBanner('error', 'Please select a target university.');
      return;
    }
    if (!mcqQuestion.trim() || !mcqOptA.trim() || !mcqOptB.trim() || !mcqOptC.trim() || !mcqOptD.trim()) {
      showBanner('error', 'Question and all 4 options (A, B, C, D) are required.');
      return;
    }
    setSavingMcq(true);
    try {
      if (editingMcq) {
        await updateMcq(editingMcq.id, {
          university_id: targetId,
          subject: mcqSubject.trim() || 'General',
          topic: mcqTopic.trim() || 'General',
          difficulty: mcqDifficulty,
          question: mcqQuestion.trim(),
          option_a: mcqOptA.trim(),
          option_b: mcqOptB.trim(),
          option_c: mcqOptC.trim(),
          option_d: mcqOptD.trim(),
          correct_answer: mcqCorrect,
          explanation: mcqExplanation.trim(),
        });
        showBanner('success', `Updated MCQ in ${mcqModalUniversity?.name || targetId}`);
      } else {
        await createMcq({
          university_id: targetId,
          subject: mcqSubject.trim() || 'General',
          topic: mcqTopic.trim() || 'General',
          difficulty: mcqDifficulty,
          question: mcqQuestion.trim(),
          option_a: mcqOptA.trim(),
          option_b: mcqOptB.trim(),
          option_c: mcqOptC.trim(),
          option_d: mcqOptD.trim(),
          correct_answer: mcqCorrect,
          explanation: mcqExplanation.trim(),
        });
        showBanner('success', `Saved MCQ to ${mcqModalUniversity?.name || targetId}`);
      }

      setMcqDirty(false);
      if (addAnother && !editingMcq) {
        setMcqQuestion('');
        setMcqOptA('');
        setMcqOptB('');
        setMcqOptC('');
        setMcqOptD('');
        setMcqExplanation('');
      } else {
        setMcqModalOpen(false);
      }

      await Promise.all([loadInitialData(), loadUniversityMcqs(true)]);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to save MCQ');
    } finally {
      setSavingMcq(false);
    }
  };

  const handleConfirmDeleteMcqs = async () => {
    if (!confirmDeleteMcqModal || confirmDeleteMcqModal.ids.length === 0) return;
    setDeletingMcqs(true);
    try {
      if (confirmDeleteMcqModal.ids.length === 1) {
        await deleteMcq(confirmDeleteMcqModal.ids[0]);
      } else {
        await bulkDeleteMcqs(confirmDeleteMcqModal.ids, selectedUniId);
      }
      showBanner('success', `Deleted ${confirmDeleteMcqModal.ids.length} MCQ(s)`);
      setConfirmDeleteMcqModal(null);
      setSelectedMcqIds(new Set());
      await Promise.all([loadInitialData(), loadUniversityMcqs(true)]);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to delete MCQs');
    } finally {
      setDeletingMcqs(false);
    }
  };

  const handleMoveSelectedMcqs = async () => {
    const ids = Array.from(selectedMcqIds);
    if (!ids.length || !moveTargetUniId) return;
    setMovingMcqs(true);
    try {
      const res = await moveMcqsToUniversity(ids, moveTargetUniId, selectedUniId);
      const destUni = universities.find((u) => u.id === moveTargetUniId);
      showBanner('success', `Moved ${res.movedCount} MCQ(s) to ${destUni?.name || moveTargetUniId}`);
      setMoveModalOpen(false);
      setSelectedMcqIds(new Set());
      await Promise.all([loadInitialData(), loadUniversityMcqs(true)]);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to move MCQs');
    } finally {
      setMovingMcqs(false);
    }
  };

  // ============================================================================
  // Bulk Import Wizard (CSV, Google Sheets, Paste + Chunked Upload)
  // ============================================================================
  const openBulkImportModal = () => {
    setBulkTargetUniId(selectedUniId);
    setBulkChangingUni(false);
    setBulkStep(1);
    setBulkSourceTab('csv');
    setBulkDefaultSubject(filterSubject !== 'all' ? filterSubject : uniTopics[0]?.subject || 'Physics');
    setBulkDefaultTopic(filterTopic !== 'all' ? filterTopic : uniTopics[0]?.topics[0]?.topic || 'General');
    setBulkRawInput('');
    setBulkCsvFileName('');
    setGsheetUrl('');
    setParsedRows([]);
    setParseErrors([]);
    setDuplicateRowsCount(0);
    setImportProgress(null);
    setResumableState(null);
    setBulkModalOpen(true);
  };

  // Re-parse whenever bulkRawInput or defaults change
  useEffect(() => {
    if (!bulkModalOpen) return;
    const { rows, parseErrors: errs } = parseImportInput(
      bulkRawInput,
      bulkDefaultSubject,
      bulkDefaultTopic
    );
    // Deduplicate within parsed batch by normalized question stem
    const seen = new Set<string>();
    const deduped: ParsedImportMcqRow[] = [];
    let dupCount = 0;
    for (const r of rows) {
      const key = r.question.trim().toLowerCase();
      if (seen.has(key)) {
        dupCount++;
      } else {
        seen.add(key);
        deduped.push(r);
      }
    }
    setParsedRows(deduped);
    setParseErrors(errs);
    setDuplicateRowsCount(dupCount);
    setResumableState(null);
    setImportProgress(null);
  }, [bulkRawInput, bulkDefaultSubject, bulkDefaultTopic, bulkModalOpen]);

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setBulkRawInput(String(reader.result || ''));
    };
    reader.readAsText(file);
  };

  const handleFetchGoogleSheet = async () => {
    if (!gsheetUrl.trim()) return;
    setFetchingSheet(true);
    try {
      const csvExportUrl = convertGoogleSheetToCsvUrl(gsheetUrl);
      const res = await fetch(csvExportUrl);
      if (!res.ok) {
        throw new Error(
          `Google Sheets returned ${res.status}. Ensure the sheet is set to "Anyone with the link can view".`
        );
      }
      const csvText = await res.text();
      setBulkRawInput(csvText);
      showBanner('success', 'Fetched Google Sheet rows');
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to fetch Google Sheet CSV');
    } finally {
      setFetchingSheet(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boardly_university_mcqs_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadImportErrorReport = () => {
    const errs = importProgress?.errors?.length ? importProgress.errors : parseErrors;
    if (!errs.length) return;
    const csvLines = [
      'row,error_message',
      ...errs.map((e) => `${e.row},"${String(e.message).replace(/"/g, '""')}"`),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_errors_${bulkModalUniversity?.slug || 'university'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartOrResumeImport = async () => {
    if (parsedRows.length === 0) return;
    const lockedUniversityId = bulkModalUniversity?.id || bulkTargetUniId || selectedUniId;
    if (!lockedUniversityId) {
      showBanner('error', 'No target university selected for import.');
      return;
    }

    setImportingChunked(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const initialState: ResumableImportState =
      resumableState && resumableState.universityId === lockedUniversityId
        ? resumableState
        : {
            universityId: lockedUniversityId,
            defaultSubject: bulkDefaultSubject.trim() || 'General',
            defaultTopic: bulkDefaultTopic.trim() || 'General',
            rows: parsedRows,
            nextRowOffset: 0,
            importedCount: 0,
            failedCount: 0,
            errors: [],
          };

    try {
      const { completed, state } = await runChunkedMcqImport({
        state: initialState,
        chunkSize: 100,
        signal: controller.signal,
        onProgress: (prog, updatedState) => {
          setImportProgress(prog);
          setResumableState(updatedState);
        },
      });

      setResumableState(state);
      if (completed) {
        showBanner(
          'success',
          `Imported ${state.importedCount.toLocaleString()} MCQs into ${
            bulkModalUniversity?.name || lockedUniversityId
          }`
        );
        await Promise.all([loadInitialData(), loadUniversityMcqs(true)]);
      } else {
        showBanner(
          'info',
          `Import paused at ${state.nextRowOffset}/${state.rows.length}. Tap Resume to continue.`
        );
      }
    } catch (err: any) {
      showBanner('error', err?.message || 'Bulk import interrupted');
    } finally {
      setImportingChunked(false);
    }
  };

  // ============================================================================
  // Bank Health Fix & Reports Actions
  // ============================================================================
  const handleFixIntegrityIssue = async (
    issueType: 'all' | 'slug_mismatch' | 'count_drift' | 'orphan_mcqs'
  ) => {
    setFixingHealthKey(issueType);
    try {
      const res = await fixBankHealthIntegrity(issueType, selectedUniId);
      showBanner('success', `Fixed integrity check (${res.fixedCount} item(s) synchronized)`);
      await Promise.all([loadInitialData(), loadUniversityMcqs(true)]);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to run integrity fix');
    } finally {
      setFixingHealthKey(null);
    }
  };

  const handleUpdateReport = async (id: string, status: 'open' | 'resolved' | 'ignored') => {
    try {
      await updateMcqReportStatus(id, status);
      const updated = await fetchMcqReports();
      setReports(updated);
      showBanner('success', `Report marked as ${status}`);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to update report');
    }
  };

  const handleEditReportedQuestion = async (report: D1McqReportRow) => {
    const existing = mcqs.find((m) => m.id === report.mcq_id);
    if (existing) {
      openEditMcqModal(existing);
      return;
    }
    try {
      const res = await fetchMcqs({
        university_id: report.university_id || selectedUniId,
        limit: 200,
        include_answers: true,
      });
      const found = res.mcqs.find((m) => m.id === report.mcq_id);
      if (found) {
        openEditMcqModal(found);
      } else {
        showBanner('info', 'Switched to Questions tab to locate the reported MCQ.');
        if (report.university_id) setSelectedUniId(report.university_id);
        setActiveTab('questions');
      }
    } catch {
      setActiveTab('questions');
    }
  };

  // ============================================================================
  // Computed Summaries & Suggestions
  // ============================================================================
  const liveCount = useMemo(
    () => universities.filter((u) => Number(u.mcq_count || 0) > 0).length,
    [universities]
  );

  const totalBankMcqs = useMemo(
    () =>
      healthData?.totalMcqs ??
      universities.reduce((sum, u) => sum + Number(u.mcq_count || 0), 0),
    [healthData, universities]
  );

  const openReportsCount = useMemo(
    () => reports.filter((r) => r.status === 'open').length,
    [reports]
  );

  const subjectSuggestions = useMemo(() => {
    const fromUni = uniTopics.map((s) => s.subject);
    return Array.from(new Set([...fromUni, ...COMMON_SUBJECTS]));
  }, [uniTopics]);

  const topicSuggestionsForMcqModal = useMemo(() => {
    const matchedSubject = uniTopics.find(
      (s) => s.subject.toLowerCase() === mcqSubject.trim().toLowerCase()
    );
    const list = matchedSubject
      ? matchedSubject.topics.map((t) => t.topic)
      : uniTopics.flatMap((s) => s.topics.map((t) => t.topic));
    return Array.from(new Set(['General', ...list]));
  }, [uniTopics, mcqSubject]);

  const topicSuggestionsForBulkModal = useMemo(() => {
    const matchedSubject = uniTopics.find(
      (s) => s.subject.toLowerCase() === bulkDefaultSubject.trim().toLowerCase()
    );
    const list = matchedSubject
      ? matchedSubject.topics.map((t) => t.topic)
      : uniTopics.flatMap((s) => s.topics.map((t) => t.topic));
    return Array.from(new Set(['General', ...list]));
  }, [uniTopics, bulkDefaultSubject]);

  const availableTopicsForFilter = useMemo(() => {
    if (filterSubject === 'all') {
      return uniTopics.flatMap((s) => s.topics.map((t) => t.topic));
    }
    const found = uniTopics.find((s) => s.subject === filterSubject);
    return found ? found.topics.map((t) => t.topic) : [];
  }, [uniTopics, filterSubject]);

  const totalTopicsInSelectedUni = useMemo(
    () => uniTopics.reduce((acc, s) => acc + s.topics.length, 0),
    [uniTopics]
  );

  const lastImportTimeLabel = useMemo(() => {
    if (!mcqs.length) return 'None yet';
    const latest = mcqs.reduce((acc, m) => {
      if (!m.created_at) return acc;
      return m.created_at > acc ? m.created_at : acc;
    }, '');
    if (!latest) return 'Recent';
    try {
      const d = new Date(latest);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  }, [mcqs]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterSubject !== 'all') count++;
    if (filterTopic !== 'all') count++;
    if (filterDifficulty !== 'all') count++;
    return count;
  }, [filterSubject, filterTopic, filterDifficulty]);

  const filteredUniversitiesInSheet = useMemo(() => {
    const q = uniSearchQuery.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter(
      (u) => u.name.toLowerCase().includes(q) || u.slug.toLowerCase().includes(q)
    );
  }, [universities, uniSearchQuery]);

  const filteredReports = useMemo(() => {
    if (reportFilter === 'all') return reports;
    return reports.filter((r) => r.status === reportFilter);
  }, [reports, reportFilter]);

  const mathCheck = useMemo(
    () =>
      validateMath(
        `${mcqQuestion} ${mcqOptA} ${mcqOptB} ${mcqOptC} ${mcqOptD} ${mcqExplanation}`
      ),
    [mcqQuestion, mcqOptA, mcqOptB, mcqOptC, mcqOptD, mcqExplanation]
  );

  // Strict Role Guard: Confirm admin role first, never flash admin UI to others
  if (profileLoading) {
    return (
      <div className="aqb-page-shell">
        <LineLoader className="w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="aqb-page-shell">
      {/* Ambient red glassmorphism background blobs */}
      <div className="aqb-ambient-blobs" aria-hidden="true">
        <div className="aqb-blob aqb-blob--top" />
        <div className="aqb-blob aqb-blob--bottom" />
      </div>

      {/* Top LineLoader when refreshing */}
      {(loading || mcqsLoading) && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <LineLoader />
        </div>
      )}

      <div className="aqb-container">
        {/* Status Toast Banner */}
        {bannerMessage && (
          <div
            role="status"
            className={`aqb-glass-card px-4 py-3 flex items-center justify-between gap-3 text-sm font-semibold ${
              bannerMessage.type === 'error'
                ? 'border-red-500/40 text-red-700 dark:text-red-300'
                : bannerMessage.type === 'success'
                ? 'border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                : 'text-[var(--text)]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {bannerMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--accent)]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="truncate">{bannerMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Compact Glass Header */}
        <header className="aqb-glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h1 className="aqb-page-title">Question Bank</h1>
            <span className="aqb-admin-chip">Admin</span>
          </div>
          <p className="mt-1 text-[13.5px] text-[var(--text-secondary)] leading-snug">
            Manage MCQs by university.
          </p>
          <p className="mt-2.5 text-xs font-bold tracking-tight text-[var(--text-muted)] tabular-nums">
            {universities.length} universities · {liveCount} live ·{' '}
            {totalBankMcqs.toLocaleString()} MCQs
          </p>
        </header>

        {/* 2. Segmented Glass Tabs + Right-End Refresh Icon Button */}
        <div className="aqb-tabs-row">
          <nav className="aqb-segmented-tabs" aria-label="Question bank sections">
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`aqb-tab-btn ${activeTab === 'questions' ? 'aqb-tab-btn--active' : ''}`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="truncate">Questions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('health')}
              className={`aqb-tab-btn ${activeTab === 'health' ? 'aqb-tab-btn--active' : ''}`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span className="truncate">Health</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`aqb-tab-btn ${activeTab === 'reports' ? 'aqb-tab-btn--active' : ''}`}
            >
              <Flag className="w-4 h-4 shrink-0" />
              <span className="truncate">Reports</span>
              {openReportsCount > 0 && (
                <span className="aqb-tab-badge">{openReportsCount}</span>
              )}
            </button>
          </nav>

          <button
            type="button"
            onClick={() => {
              loadInitialData();
              loadUniversityMcqs(true);
            }}
            aria-label="Refresh question bank"
            title="Refresh question bank"
            className="aqb-icon-btn"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Sticky Primary Action Bar (under tabs) */}
        <div className="aqb-sticky-action-bar">
          {/* Primary Red "Add MCQs" Dropdown Button */}
          <div ref={addMenuRef} className="relative flex-1 min-w-0">
            <button
              type="button"
              onClick={() => {
                setAddMenuOpen((prev) => !prev);
                setOverflowMenuOpen(false);
              }}
              className="aqb-btn aqb-btn--primary w-full justify-between"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Add MCQs</span>
              </span>
              <ChevronDown className="w-4 h-4 shrink-0 opacity-90" />
            </button>

            {addMenuOpen && (
              <div className="aqb-dropdown-menu left-0 right-0">
                <button
                  type="button"
                  onClick={() => {
                    setAddMenuOpen(false);
                    openAddMcqModal();
                  }}
                  className="aqb-dropdown-item"
                >
                  <Plus className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] truncate">Add single MCQ</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      into {selectedUniversity?.name || 'selected university'}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddMenuOpen(false);
                    openBulkImportModal();
                  }}
                  className="aqb-dropdown-item"
                >
                  <Upload className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] truncate">Bulk import</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      CSV, Google Sheet, or Paste
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Secondary "⋯" Overflow Menu */}
          <div ref={overflowMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setOverflowMenuOpen((prev) => !prev);
                setAddMenuOpen(false);
              }}
              aria-label="More question bank actions"
              className="aqb-icon-btn"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {overflowMenuOpen && (
              <div className="aqb-dropdown-menu right-0">
                <button
                  type="button"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    openAddUniversityModal();
                  }}
                  className="aqb-dropdown-item"
                >
                  <Building2 className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                  <span>Add university</span>
                </button>
                <a
                  href={getUniversityMcqExportUrl('json')}
                  download
                  onClick={() => setOverflowMenuOpen(false)}
                  className="aqb-dropdown-item no-underline"
                >
                  <Download className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                  <span>Export backup (JSON)</span>
                </a>
                <a
                  href={getUniversityMcqExportUrl('csv', selectedUniId)}
                  download
                  onClick={() => setOverflowMenuOpen(false)}
                  className="aqb-dropdown-item no-underline"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                  <span>Export current university (CSV)</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    loadInitialData();
                    loadUniversityMcqs(true);
                  }}
                  className="aqb-dropdown-item"
                >
                  <RefreshCw className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                  <span>Refresh</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ====================================================================
            TAB 1: QUESTIONS
            ==================================================================== */}
        {activeTab === 'questions' && (
          <div className="flex flex-col gap-3.5 min-w-0">
            {/* 4. University Picker ("Working in" Glass Card) */}
            {selectedUniversity && (
              <div className="aqb-glass-card aqb-glass-card--selected p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Working in
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`aqb-pill ${
                        selectedUniversity.mcq_count > 0
                          ? 'aqb-pill--live'
                          : 'aqb-pill--coming-soon'
                      }`}
                    >
                      {selectedUniversity.mcq_count > 0 ? 'LIVE' : 'COMING SOON'}
                    </span>
                    <span className="aqb-pill aqb-pill--tag tabular-nums font-bold">
                      {selectedUniversity.mcq_count.toLocaleString()} MCQs
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUniSheetMode('switch');
                    setUniSearchQuery('');
                    setUniSheetOpen(true);
                  }}
                  className="w-full text-left flex items-center justify-between gap-3 py-1.5 rounded-2xl transition active:scale-[0.99] min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--accent)] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {getUniversityInitials(selectedUniversity.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-[var(--text)] truncate">
                        {selectedUniversity.name}
                      </div>
                      <div className="text-xs font-mono text-[var(--text-muted)] truncate">
                        slug: {selectedUniversity.slug}
                      </div>
                    </div>
                  </div>

                  <span className="aqb-btn aqb-btn--glass !min-h-[40px] !px-3 !py-1.5 text-xs shrink-0">
                    Switch
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            )}

            {/* 5. Selected University Panel (Stats + Scoped Actions) */}
            {selectedUniversity && (
              <div className="aqb-glass-card p-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-2xl px-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Total MCQs
                    </div>
                    <div className="text-base font-extrabold text-[var(--text)] tabular-nums mt-0.5">
                      {selectedUniversity.mcq_count.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-2xl px-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Subjects
                    </div>
                    <div className="text-base font-extrabold text-[var(--text)] tabular-nums mt-0.5">
                      {uniTopics.length}
                    </div>
                  </div>
                  <div className="rounded-2xl px-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Topics
                    </div>
                    <div className="text-base font-extrabold text-[var(--text)] tabular-nums mt-0.5">
                      {totalTopicsInSelectedUni}
                    </div>
                  </div>
                  <div className="rounded-2xl px-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Last import
                    </div>
                    <div className="text-sm font-extrabold text-[var(--text)] truncate mt-0.5">
                      {lastImportTimeLabel}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-[var(--border)]">
                  <div className="text-xs font-semibold text-[var(--text-secondary)] truncate">
                    Importing into:{' '}
                    <span className="font-extrabold text-[var(--text)]">
                      {selectedUniversity.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={openAddMcqModal}
                      className="aqb-btn aqb-btn--glass !min-h-[44px] !px-3 text-xs"
                    >
                      <Plus className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span>Add MCQ</span>
                    </button>
                    <button
                      type="button"
                      onClick={openBulkImportModal}
                      className="aqb-btn aqb-btn--glass !min-h-[44px] !px-3 text-xs"
                    >
                      <Upload className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span>Bulk import</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Search & Collapsed Filter Trigger */}
            <div className="aqb-glass-card p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search in ${selectedUniversity?.name || 'university'}…`}
                    className="aqb-input !pl-10 !pr-8"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(true)}
                  className="aqb-btn aqb-btn--glass shrink-0 !px-3.5"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="aqb-tab-badge">{activeFiltersCount}</span>
                  )}
                </button>
              </div>

              {/* Removable Active Filter Chips */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {filterSubject !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterSubject('all');
                        setFilterTopic('all');
                      }}
                      className="aqb-pill aqb-pill--tag hover:border-[var(--accent)]"
                    >
                      <span>Subject: {filterSubject}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {filterTopic !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setFilterTopic('all')}
                      className="aqb-pill aqb-pill--tag hover:border-[var(--accent)]"
                    >
                      <span>Topic: {filterTopic}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {filterDifficulty !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setFilterDifficulty('all')}
                      className="aqb-pill aqb-pill--tag hover:border-[var(--accent)]"
                    >
                      <span>Difficulty: {filterDifficulty}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterSubject('all');
                      setFilterTopic('all');
                      setFilterDifficulty('all');
                    }}
                    className="text-xs font-bold text-[var(--accent)] ml-1 px-1.5 py-0.5"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* 7. MCQ List as Glass Cards (or Glass Empty State) */}
            {mcqs.length === 0 && !mcqsLoading ? (
              <div className="aqb-glass-card p-8 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)] flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-base font-extrabold text-[var(--text)]">
                  No MCQs in {selectedUniversity?.name || 'this university'} yet
                </h2>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
                  {activeFiltersCount > 0 || searchQuery.trim()
                    ? 'No questions matched your active search or filters.'
                    : `Add your first question or import a batch into ${
                        selectedUniversity?.name || 'this university'
                      }. Only universities with 1+ MCQs appear LIVE to students.`}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={openAddMcqModal}
                    className="aqb-btn aqb-btn--primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add first MCQ</span>
                  </button>
                  <button
                    type="button"
                    onClick={openBulkImportModal}
                    className="aqb-btn aqb-btn--glass"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Bulk import</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1 text-xs font-semibold text-[var(--text-muted)]">
                  <span className="tabular-nums">
                    Showing {mcqs.length} of {totalMcqsForFilter.toLocaleString()} MCQs
                  </span>
                  {mcqs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMcqIds.size === mcqs.length) {
                          setSelectedMcqIds(new Set());
                        } else {
                          setSelectedMcqIds(new Set(mcqs.map((m) => m.id)));
                        }
                      }}
                      className="text-xs font-bold text-[var(--accent)] hover:underline"
                    >
                      {selectedMcqIds.size === mcqs.length ? 'Deselect all' : 'Select all'}
                    </button>
                  )}
                </div>

                {mcqs.map((mcq) => {
                  const isSelected = selectedMcqIds.has(mcq.id);
                  const isExpanded = expandedMcqId === mcq.id;
                  const diffClass =
                    mcq.difficulty === 'easy'
                      ? 'aqb-pill--easy'
                      : mcq.difficulty === 'hard'
                      ? 'aqb-pill--hard'
                      : 'aqb-pill--medium';

                  return (
                    <article
                      key={mcq.id}
                      className={`aqb-glass-card p-3.5 sm:p-4 ${
                        isSelected ? 'aqb-glass-card--selected' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <label
                          className="pt-0.5 flex items-center justify-center cursor-pointer shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedMcqIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(mcq.id)) next.delete(mcq.id);
                                else next.add(mcq.id);
                                return next;
                              });
                            }}
                            aria-label="Select question"
                            className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer"
                          />
                        </label>

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setExpandedMcqId((prev) => (prev === mcq.id ? null : mcq.id))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedMcqId((prev) => (prev === mcq.id ? null : mcq.id));
                            }
                          }}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          {/* Tags & Correct Answer Badge */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span className="aqb-pill aqb-pill--tag truncate max-w-[140px]">
                                {mcq.subject}
                              </span>
                              <span className="aqb-pill aqb-pill--tag truncate max-w-[150px]">
                                {mcq.topic}
                              </span>
                              <span className={`aqb-pill ${diffClass}`}>
                                {mcq.difficulty || 'medium'}
                              </span>
                            </div>
                            <span className="aqb-pill aqb-pill--live tabular-nums">
                              Ans: {mcq.correct_answer}
                            </span>
                          </div>

                          {/* 2-Line Question Preview with KaTeX */}
                          <div
                            className={`text-sm font-semibold text-[var(--text)] leading-snug break-words ${
                              isExpanded ? '' : 'line-clamp-2'
                            }`}
                          >
                            <MathText text={mcq.question} />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                            <span>{isExpanded ? 'Tap to collapse' : 'Tap to view options'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Options A-D, Explanation & Actions */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(
                              [
                                ['A', mcq.option_a],
                                ['B', mcq.option_b],
                                ['C', mcq.option_c],
                                ['D', mcq.option_d],
                              ] as const
                            ).map(([letter, text]) => {
                              const isCorrect = mcq.correct_answer === letter;
                              return (
                                <div
                                  key={letter}
                                  className={`rounded-2xl p-2.5 border text-xs flex items-start gap-2 min-w-0 ${
                                    isCorrect
                                      ? 'border-emerald-500/50 bg-emerald-500/10 text-[var(--text)] font-bold'
                                      : 'border-[var(--border)] bg-black/[0.02] dark:bg-white/[0.03] text-[var(--text-secondary)]'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-black/10 dark:bg-white/10 text-[var(--text)]'
                                    }`}
                                  >
                                    {letter}
                                  </span>
                                  <div className="min-w-0 break-words leading-relaxed">
                                    <MathText text={text} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {mcq.explanation ? (
                            <div className="rounded-2xl p-3 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                              <div className="font-bold uppercase tracking-wider text-[10.5px] text-[var(--text-muted)] mb-1">
                                Explanation
                              </div>
                              <div className="leading-relaxed break-words">
                                <MathText text={mcq.explanation} />
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] italic text-[var(--text-muted)]">
                              No explanation provided.
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => openEditMcqModal(mcq)}
                              className="aqb-btn aqb-btn--glass !min-h-[44px] !px-3.5 text-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteMcqModal({
                                  ids: [mcq.id],
                                  label: `this MCQ from ${
                                    selectedUniversity?.name || 'university'
                                  }`,
                                })
                              }
                              className="aqb-btn aqb-btn--danger !min-h-[44px] !px-3.5 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}

                {/* Pagination: Load More after 50 rows */}
                {mcqs.length < totalMcqsForFilter && (
                  <button
                    type="button"
                    disabled={loadingMoreMcqs}
                    onClick={handleLoadMoreMcqs}
                    className="aqb-btn aqb-btn--glass w-full mt-1"
                  >
                    {loadingMoreMcqs ? (
                      <ButtonLineLoader label="Loading more…" />
                    ) : (
                      <span>
                        Load more ({mcqs.length} of {totalMcqsForFilter.toLocaleString()})
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Sticky Multi-Select Action Bar */}
            {selectedMcqIds.size > 0 && (
              <div className="aqb-selection-bar">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[var(--text)] tabular-nums">
                    {selectedMcqIds.size} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMcqIds.size === mcqs.length) {
                        setSelectedMcqIds(new Set());
                      } else {
                        setSelectedMcqIds(new Set(mcqs.map((m) => m.id)));
                      }
                    }}
                    className="text-xs font-bold text-[var(--accent)] underline px-1"
                  >
                    {selectedMcqIds.size === mcqs.length ? 'Clear' : 'Select all'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const firstOther = universities.find((u) => u.id !== selectedUniId);
                      setMoveTargetUniId(firstOther?.id || selectedUniId);
                      setMoveModalOpen(true);
                    }}
                    className="aqb-btn aqb-btn--glass !min-h-[44px] !px-3 text-xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Move to university…</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDeleteMcqModal({
                        ids: Array.from(selectedMcqIds),
                        label: `${selectedMcqIds.size} selected MCQs from ${
                          selectedUniversity?.name || 'university'
                        }`,
                      })
                    }
                    className="aqb-btn aqb-btn--danger !min-h-[44px] !px-3 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 2: BANK HEALTH
            ==================================================================== */}
        {activeTab === 'health' && (
          <div className="flex flex-col gap-3.5">
            {/* 2-Column Grid of Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="aqb-glass-card p-4">
                <div className="text-xs font-bold text-[var(--text-muted)]">
                  Total universities
                </div>
                <div className="text-2xl font-extrabold text-[var(--text)] tabular-nums mt-1">
                  {healthData?.totalUniversities ?? universities.length}
                </div>
              </div>
              <div className="aqb-glass-card p-4">
                <div className="text-xs font-bold text-[var(--text-muted)]">Live</div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                  {healthData?.liveUniversities ?? liveCount}
                </div>
              </div>
              <div className="aqb-glass-card p-4">
                <div className="text-xs font-bold text-[var(--text-muted)]">Coming soon</div>
                <div className="text-2xl font-extrabold text-[var(--text-secondary)] tabular-nums mt-1">
                  {healthData?.comingSoonUniversities ??
                    Math.max(0, universities.length - liveCount)}
                </div>
              </div>
              <div className="aqb-glass-card p-4">
                <div className="text-xs font-bold text-[var(--text-muted)]">Total MCQs</div>
                <div className="text-2xl font-extrabold text-[var(--accent)] tabular-nums mt-1">
                  {totalBankMcqs.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Integrity List with "Fix" Action per Item */}
            <div className="aqb-glass-card p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-[var(--text)]">
                    University Isolation & Integrity Checks
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Verify permanent university binding, slug consistency, and counts.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={fixingHealthKey !== null}
                  onClick={() => handleFixIntegrityIssue('all')}
                  className="aqb-btn aqb-btn--glass !min-h-[40px] !px-3 text-xs shrink-0"
                >
                  {fixingHealthKey === 'all' ? (
                    <ButtonLineLoader label="Fixing…" />
                  ) : (
                    <span>Fix all</span>
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  {
                    key: 'slug_mismatch' as const,
                    title: 'University slug mismatches',
                    desc: 'MCQs where university_slug differs from their parent university_id slug.',
                    count: healthData?.integrity?.slugMismatchCount ?? 0,
                  },
                  {
                    key: 'orphan_mcqs' as const,
                    title: 'Orphan MCQs',
                    desc: 'MCQs with a missing or unrecognized university_id.',
                    count: healthData?.integrity?.missingOrInvalidUniversityIdCount ?? 0,
                  },
                  {
                    key: 'count_drift' as const,
                    title: 'University count drift',
                    desc: 'Universities whose cached mcq_count or is_live flag differs from exact row count.',
                    count: healthData?.integrity?.countMismatchUniversities?.length ?? 0,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl p-3 border border-[var(--border)] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[var(--text)]">
                          {item.title}
                        </span>
                        <span
                          className={`aqb-pill tabular-nums ${
                            item.count === 0 ? 'aqb-pill--live' : 'aqb-pill--hard'
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={fixingHealthKey !== null}
                      onClick={() => handleFixIntegrityIssue(item.key)}
                      className="aqb-btn aqb-btn--glass !min-h-[40px] !px-3 text-xs shrink-0"
                    >
                      {fixingHealthKey === item.key ? (
                        <ButtonLineLoader label="Fixing…" />
                      ) : (
                        <span>Fix</span>
                      )}
                    </button>
                  </div>
                ))}

                {/* Missing Explanations Item */}
                <div className="rounded-2xl p-3 border border-[var(--border)] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[var(--text)]">
                        Missing explanations
                      </span>
                      <span
                        className={`aqb-pill tabular-nums ${
                          (healthData?.missingExplanations ?? 0) === 0
                            ? 'aqb-pill--live'
                            : 'aqb-pill--medium'
                        }`}
                      >
                        {healthData?.missingExplanations ?? 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                      Questions without a written solution explanation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('questions')}
                    className="aqb-btn aqb-btn--glass !min-h-[40px] !px-3 text-xs shrink-0"
                  >
                    <span>Review</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: STUDENT REPORTS
            ==================================================================== */}
        {activeTab === 'reports' && (
          <div className="flex flex-col gap-3">
            <div className="aqb-hscroll-fade">
              {(['all', 'open', 'resolved', 'ignored'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setReportFilter(st)}
                  className={`aqb-btn !min-h-[40px] !px-3.5 text-xs capitalize ${
                    reportFilter === st ? 'aqb-btn--primary' : 'aqb-btn--glass'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredReports.length === 0 ? (
              <div className="aqb-glass-card p-8 text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <div className="text-sm font-extrabold text-[var(--text)]">
                  No {reportFilter !== 'all' ? reportFilter : ''} student reports
                </div>
                <p className="text-xs text-[var(--text-muted)] max-w-xs">
                  When students flag a question for a typo or key issue, it appears here.
                </p>
              </div>
            ) : (
              filteredReports.map((rep) => (
                <div key={rep.id} className="aqb-glass-card p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`aqb-pill ${
                        rep.status === 'open'
                          ? 'aqb-pill--hard'
                          : rep.status === 'resolved'
                          ? 'aqb-pill--live'
                          : 'aqb-pill--coming-soon'
                      }`}
                    >
                      {rep.status}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                      {rep.created_at
                        ? new Date(rep.created_at).toLocaleDateString()
                        : 'Recent'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[var(--accent)]">
                    Reason: {rep.reason}
                  </div>
                  {(rep.question || rep.question_preview) && (
                    <div className="text-xs text-[var(--text)] font-medium line-clamp-2">
                      <MathText text={rep.question || rep.question_preview || ''} />
                    </div>
                  )}
                  {(rep.details || rep.comment) && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      &ldquo;{rep.details || rep.comment}&rdquo;
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => handleEditReportedQuestion(rep)}
                      className="aqb-btn aqb-btn--glass !min-h-[42px] !px-3 text-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit question</span>
                    </button>
                    {rep.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateReport(rep.id, 'resolved')}
                        className="aqb-btn aqb-btn--primary !min-h-[42px] !px-3 text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}
                    {rep.status !== 'ignored' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateReport(rep.id, 'ignored')}
                        className="aqb-btn aqb-btn--glass !min-h-[42px] !px-3 text-xs"
                      >
                        <span>Ignore</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ======================================================================
          BOTTOM SHEET 1: UNIVERSITY SWITCHER & MANAGER
          ====================================================================== */}
      {uniSheetOpen && (
        <div
          className="aqb-sheet-backdrop"
          onClick={() => setUniSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Switch or manage universities"
        >
          <div
            className="aqb-sheet"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={(e) => handleSheetTouchEnd(e, () => setUniSheetOpen(false))}
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>

            <div className="aqb-sheet-header">
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-[var(--text)] truncate">
                  {uniSheetMode === 'switch' ? 'Select University' : 'Manage Universities'}
                </h2>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {universities.length} total · {liveCount} live
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setUniSheetMode((prev) => (prev === 'switch' ? 'manage' : 'switch'))
                  }
                  className="aqb-btn aqb-btn--glass !min-h-[40px] !px-3 text-xs"
                >
                  {uniSheetMode === 'switch' ? 'Manage' : 'Done'}
                </button>
                <button
                  type="button"
                  onClick={() => setUniSheetOpen(false)}
                  aria-label="Close university sheet"
                  className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="aqb-sheet-body flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={uniSearchQuery}
                    onChange={(e) => setUniSearchQuery(e.target.value)}
                    placeholder="Search university name or slug…"
                    className="aqb-input !pl-10"
                  />
                </div>
                {uniSheetMode === 'manage' && (
                  <button
                    type="button"
                    onClick={openAddUniversityModal}
                    className="aqb-btn aqb-btn--primary !px-3.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {uniSheetMode === 'switch' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredUniversitiesInSheet.map((uni) => {
                    const active = uni.id === selectedUniId;
                    return (
                      <button
                        key={uni.id}
                        type="button"
                        onClick={() => {
                          setSelectedUniId(uni.id);
                          setFilterSubject('all');
                          setFilterTopic('all');
                          setUniSheetOpen(false);
                        }}
                        className={`aqb-glass-card p-3.5 text-left flex items-center justify-between gap-2.5 ${
                          active ? 'aqb-glass-card--selected' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-2xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                              active
                                ? 'bg-[var(--accent)] text-white'
                                : 'bg-black/5 dark:bg-white/10 text-[var(--text)]'
                            }`}
                          >
                            {getUniversityInitials(uni.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-[var(--text)] truncate">
                              {uni.name}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] tabular-nums">
                              {uni.mcq_count.toLocaleString()} MCQs
                            </div>
                          </div>
                        </div>
                        <span
                          className={`aqb-pill shrink-0 ${
                            uni.mcq_count > 0 ? 'aqb-pill--live' : 'aqb-pill--coming-soon'
                          }`}
                        >
                          {uni.mcq_count > 0 ? 'LIVE' : 'SOON'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {filteredUniversitiesInSheet.map((uni, idx) => (
                    <div
                      key={uni.id}
                      className="aqb-glass-card p-3.5 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GripVertical className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-[var(--text)] truncate">
                              {uni.name}
                            </div>
                            <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                              {uni.slug} · {uni.mcq_count.toLocaleString()} MCQs
                            </div>
                          </div>
                        </div>
                        <span
                          className={`aqb-pill shrink-0 ${
                            uni.mcq_count > 0 ? 'aqb-pill--live' : 'aqb-pill--coming-soon'
                          }`}
                        >
                          {uni.mcq_count > 0 ? 'LIVE' : 'SOON'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveUniversity(idx, -1)}
                          className="aqb-btn aqb-btn--glass !min-h-[44px] !px-3 text-xs"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>Up</span>
                        </button>
                        <button
                          type="button"
                          disabled={idx === filteredUniversitiesInSheet.length - 1}
                          onClick={() => handleMoveUniversity(idx, 1)}
                          className="aqb-btn aqb-btn--glass !min-h-[44px] !px-3 text-xs"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>Down</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditUniversityModal(uni)}
                          className="aqb-btn aqb-btn--glass !min-h-[44px] !px-3 text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteUni(uni)}
                          className="aqb-btn aqb-btn--danger !min-h-[44px] !px-3 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          BOTTOM SHEET 2: FILTERS SHEET
          ====================================================================== */}
      {filterSheetOpen && (
        <div
          className="aqb-sheet-backdrop"
          onClick={() => setFilterSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Filter questions"
        >
          <div
            className="aqb-sheet aqb-sheet--compact"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={(e) => handleSheetTouchEnd(e, () => setFilterSheetOpen(false))}
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>

            <div className="aqb-sheet-header">
              <h2 className="text-base font-extrabold text-[var(--text)]">Filter MCQs</h2>
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                aria-label="Close filters"
                className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aqb-sheet-body flex flex-col gap-4">
              {/* Subject Chips (Horizontal Scroll Row with Edge Fade) */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Subject
                </div>
                <div className="aqb-hscroll-fade">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterSubject('all');
                      setFilterTopic('all');
                    }}
                    className={`aqb-btn !min-h-[40px] !px-3.5 text-xs ${
                      filterSubject === 'all' ? 'aqb-btn--primary' : 'aqb-btn--glass'
                    }`}
                  >
                    All subjects
                  </button>
                  {uniTopics.map((s) => (
                    <button
                      key={s.subject}
                      type="button"
                      onClick={() => {
                        setFilterSubject(s.subject);
                        setFilterTopic('all');
                      }}
                      className={`aqb-btn !min-h-[40px] !px-3.5 text-xs ${
                        filterSubject === s.subject ? 'aqb-btn--primary' : 'aqb-btn--glass'
                      }`}
                    >
                      <span>{s.subject}</span>
                      <span className="opacity-75 tabular-nums">({s.total})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Segmented Control */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Difficulty
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setFilterDifficulty(diff)}
                      className={`aqb-btn !min-h-[42px] !px-2 text-xs capitalize ${
                        filterDifficulty === diff ? 'aqb-btn--primary' : 'aqb-btn--glass'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Selector */}
              {availableTopicsForFilter.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Topic
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterTopic('all')}
                      className={`aqb-btn !min-h-[38px] !px-3 text-xs ${
                        filterTopic === 'all' ? 'aqb-btn--primary' : 'aqb-btn--glass'
                      }`}
                    >
                      All topics
                    </button>
                    {availableTopicsForFilter.map((topicName) => (
                      <button
                        key={topicName}
                        type="button"
                        onClick={() => setFilterTopic(topicName)}
                        className={`aqb-btn !min-h-[38px] !px-3 text-xs ${
                          filterTopic === topicName ? 'aqb-btn--primary' : 'aqb-btn--glass'
                        }`}
                      >
                        {topicName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={() => {
                  setFilterSubject('all');
                  setFilterTopic('all');
                  setFilterDifficulty('all');
                }}
                className="aqb-btn aqb-btn--glass"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                className="aqb-btn aqb-btn--primary flex-1 sm:flex-initial"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          BOTTOM SHEET 3: ADD / EDIT SINGLE MCQ (~92% HEIGHT)
          ====================================================================== */}
      {mcqModalOpen && (
        <div
          className="aqb-sheet-backdrop"
          onClick={requestCloseMcqModal}
          role="dialog"
          aria-modal="true"
          aria-label={editingMcq ? 'Edit MCQ' : 'Add Single MCQ'}
        >
          <div
            className="aqb-sheet"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={(e) => handleSheetTouchEnd(e, requestCloseMcqModal)}
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>

            <div className="aqb-sheet-header">
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-[var(--text)] truncate">
                  {editingMcq ? 'Edit Question' : 'Add Single MCQ'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    Adding to:
                  </span>
                  <button
                    type="button"
                    onClick={() => setMcqUniPickerOpen((prev) => !prev)}
                    className="aqb-pill aqb-pill--live cursor-pointer"
                  >
                    <span className="truncate max-w-[160px]">
                      {mcqModalUniversity?.name || 'Select university'}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={requestCloseMcqModal}
                aria-label="Close sheet"
                className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aqb-sheet-body flex flex-col gap-4">
              {/* Optional Inline University Switcher */}
              {mcqUniPickerOpen && (
                <div className="aqb-glass-card p-3 flex flex-col gap-2">
                  <div className="text-xs font-bold text-[var(--text-muted)]">
                    Choose target university
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    {universities.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setMcqTargetUniId(u.id);
                          setMcqUniPickerOpen(false);
                          setMcqDirty(true);
                        }}
                        className={`aqb-dropdown-item justify-between ${
                          u.id === (mcqTargetUniId || selectedUniId)
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-bold'
                            : ''
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        {u.id === (mcqTargetUniId || selectedUniId) && (
                          <Check className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject & Topic Comboboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ComboboxField
                  label="Subject"
                  value={mcqSubject}
                  onChange={(val) => {
                    setMcqSubject(val);
                    setMcqDirty(true);
                  }}
                  options={subjectSuggestions}
                  placeholder="e.g. Physics"
                />
                <ComboboxField
                  label="Topic"
                  value={mcqTopic}
                  onChange={(val) => {
                    setMcqTopic(val);
                    setMcqDirty(true);
                  }}
                  options={topicSuggestionsForMcqModal}
                  placeholder="e.g. Kinematics"
                />
              </div>

              {/* 3-Option Segmented Difficulty Control */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setMcqDifficulty(level);
                        setMcqDirty(true);
                      }}
                      className={`aqb-btn !min-h-[44px] capitalize ${
                        mcqDifficulty === level ? 'aqb-btn--primary' : 'aqb-btn--glass'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Stem + Single-Row Horizontally Scrollable Math/Chem Toolbar */}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Question (LaTeX &amp; \ce supported)
                  </label>
                </div>

                <div className="aqb-hscroll-fade mb-2">
                  {LATEX_SNIPPETS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      title={item.title}
                      onClick={() => insertLatexSnippet(item.snippet)}
                      className="aqb-btn aqb-btn--glass !min-h-[36px] !px-2.5 !py-1 text-xs font-mono shrink-0"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={questionInputRef}
                  rows={3}
                  value={mcqQuestion}
                  onChange={(e) => {
                    setMcqQuestion(e.target.value);
                    setMcqDirty(true);
                  }}
                  placeholder="Enter question text… Use $...$ for math or $\ce{...}$ for chemistry."
                  className="aqb-input resize-y min-h-[88px]"
                />
              </div>

              {/* 4 Stacked Option Inputs with Radio Circle to Pick Correct Answer */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Options (Tap circle to mark correct answer)
                  </span>
                  <span className="aqb-pill aqb-pill--live">Correct: {mcqCorrect}</span>
                </div>

                {(
                  [
                    ['A', mcqOptA, setMcqOptA],
                    ['B', mcqOptB, setMcqOptB],
                    ['C', mcqOptC, setMcqOptC],
                    ['D', mcqOptD, setMcqOptD],
                  ] as const
                ).map(([letter, val, setter]) => {
                  const isCorrect = mcqCorrect === letter;
                  return (
                    <div
                      key={letter}
                      className={`flex items-center gap-2.5 p-2 rounded-2xl border transition ${
                        isCorrect
                          ? 'border-emerald-500/60 bg-emerald-500/[0.06]'
                          : 'border-[var(--border)] bg-black/[0.015] dark:bg-white/[0.02]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMcqCorrect(letter);
                          setMcqDirty(true);
                        }}
                        aria-label={`Mark Option ${letter} as correct`}
                        className={`w-9 h-9 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 transition ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-black/10 dark:bg-white/10 text-[var(--text-secondary)]'
                        }`}
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => {
                          setter(e.target.value);
                          setMcqDirty(true);
                        }}
                        placeholder={`Option ${letter}…`}
                        className="aqb-input !min-h-[42px]"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Optional Explanation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Explanation (Optional)
                </label>
                <textarea
                  rows={2}
                  value={mcqExplanation}
                  onChange={(e) => {
                    setMcqExplanation(e.target.value);
                    setMcqDirty(true);
                  }}
                  placeholder="Step-by-step explanation shown after answering…"
                  className="aqb-input resize-y"
                />
              </div>

              {!mathCheck.valid && (
                <div className="rounded-2xl p-3 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
                  LaTeX syntax hint: {mathCheck.error}
                </div>
              )}

              {/* Collapsed-by-Default Preview Toggle */}
              <div className="border-t border-[var(--border)] pt-2">
                <button
                  type="button"
                  onClick={() => setMcqPreviewOpen((prev) => !prev)}
                  className="aqb-btn aqb-btn--glass w-full justify-between !min-h-[44px]"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-bold">
                    <Eye className="w-4 h-4 text-[var(--accent)]" />
                    <span>Preview rendered KaTeX &amp; chemistry</span>
                  </span>
                  {mcqPreviewOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {mcqPreviewOpen && (
                  <div className="mt-2.5 aqb-glass-card p-4 flex flex-col gap-2.5 text-sm">
                    <div className="font-semibold text-[var(--text)] break-words">
                      {mcqQuestion.trim() ? (
                        <MathText text={mcqQuestion} />
                      ) : (
                        <span className="text-[var(--text-muted)] italic">
                          Question preview…
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(
                        [
                          ['A', mcqOptA],
                          ['B', mcqOptB],
                          ['C', mcqOptC],
                          ['D', mcqOptD],
                        ] as const
                      ).map(([letter, opt]) => (
                        <div
                          key={letter}
                          className={`p-2 rounded-xl border ${
                            mcqCorrect === letter
                              ? 'border-emerald-500/50 bg-emerald-500/10 font-bold'
                              : 'border-[var(--border)]'
                          }`}
                        >
                          <span className="mr-1.5 font-extrabold">{letter}.</span>
                          <MathText text={opt || '—'} />
                        </div>
                      ))}
                    </div>
                    {mcqExplanation.trim() && (
                      <div className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                        <MathText text={mcqExplanation} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={requestCloseMcqModal}
                className="aqb-btn aqb-btn--glass"
              >
                Cancel
              </button>
              {!editingMcq && (
                <button
                  type="button"
                  disabled={savingMcq}
                  onClick={() => handleSaveMcq(true)}
                  className="aqb-btn aqb-btn--glass"
                >
                  {savingMcq ? (
                    <ButtonLineLoader label="Saving…" />
                  ) : (
                    <span>Save &amp; add another</span>
                  )}
                </button>
              )}
              <button
                type="button"
                disabled={savingMcq}
                onClick={() => handleSaveMcq(false)}
                className="aqb-btn aqb-btn--primary"
              >
                {savingMcq ? (
                  <ButtonLineLoader label="Saving…" />
                ) : (
                  <span>{editingMcq ? 'Update MCQ' : 'Save MCQ'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          BOTTOM SHEET 4: BULK IMPORT 3-STEP WIZARD (~92% HEIGHT)
          ====================================================================== */}
      {bulkModalOpen && (
        <div
          className="aqb-sheet-backdrop"
          onClick={requestCloseBulkModal}
          role="dialog"
          aria-modal="true"
          aria-label="Bulk Import MCQs"
        >
          <div
            className="aqb-sheet"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={(e) => handleSheetTouchEnd(e, requestCloseBulkModal)}
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>

            <div className="aqb-sheet-header">
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-[var(--text)] truncate">
                  Bulk Import MCQs
                </h2>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  Importing into:{' '}
                  <strong className="text-[var(--text)]">
                    {bulkModalUniversity?.name} ({bulkModalUniversity?.slug})
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={requestCloseBulkModal}
                aria-label="Close bulk import"
                className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3-Step Indicator Bar */}
            <div className="px-4 py-2.5 border-b border-[var(--border)] grid grid-cols-3 gap-2 shrink-0">
              {(
                [
                  [1, '1. Target'],
                  [2, '2. Source'],
                  [3, '3. Import'],
                ] as const
              ).map(([stepNum, label]) => (
                <button
                  key={stepNum}
                  type="button"
                  disabled={importingChunked}
                  onClick={() => setBulkStep(stepNum)}
                  className={`min-h-[38px] rounded-xl text-xs font-extrabold transition ${
                    bulkStep === stepNum
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'bg-black/[0.04] dark:bg-white/[0.05] text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="aqb-sheet-body flex flex-col gap-4">
              {/* STEP 1: TARGET & DEFAULTS */}
              {bulkStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="aqb-glass-card aqb-glass-card--selected p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Locked Target University
                      </span>
                      <span className="aqb-pill aqb-pill--live">Permanent Binding</span>
                    </div>
                    <div className="text-base font-extrabold text-[var(--text)]">
                      Importing into: {bulkModalUniversity?.name} ({bulkModalUniversity?.slug})
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Every imported row is permanently bound to{' '}
                      <code className="font-mono font-bold">{bulkModalUniversity?.id}</code> and
                      never shared with other universities.
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() => setBulkChangingUni((prev) => !prev)}
                        className="aqb-btn aqb-btn--glass !min-h-[40px] !px-3 text-xs"
                      >
                        Change target university…
                      </button>
                    </div>

                    {bulkChangingUni && (
                      <div className="mt-2 pt-2 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                        {universities.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              if (
                                u.id !== bulkTargetUniId &&
                                bulkRawInput.trim().length > 0 &&
                                !window.confirm(
                                  `Switch import target to ${u.name} (${u.slug})?`
                                )
                              ) {
                                return;
                              }
                              setBulkTargetUniId(u.id);
                              setBulkChangingUni(false);
                            }}
                            className={`aqb-dropdown-item justify-between ${
                              u.id === bulkModalUniversity?.id
                                ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-bold'
                                : ''
                            }`}
                          >
                            <span className="truncate">{u.name}</span>
                            <span className="text-[11px] font-mono opacity-75">{u.slug}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ComboboxField
                      label="Default Subject (used when row omits subject)"
                      value={bulkDefaultSubject}
                      onChange={setBulkDefaultSubject}
                      options={subjectSuggestions}
                      placeholder="e.g. Physics"
                    />
                    <ComboboxField
                      label="Default Topic (used when row omits topic)"
                      value={bulkDefaultTopic}
                      onChange={setBulkDefaultTopic}
                      options={topicSuggestionsForBulkModal}
                      placeholder="e.g. Kinematics"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: SOURCE (CSV / GOOGLE SHEET / PASTE) */}
              {bulkStep === 2 && (
                <div className="flex flex-col gap-4">
                  {/* Segmented Source Control */}
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['csv', 'CSV file', FileSpreadsheet],
                        ['gsheet', 'Google Sheet', Link2],
                        ['paste', 'Paste', FileText],
                      ] as const
                    ).map(([key, label, Icon]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setBulkSourceTab(key)}
                        className={`aqb-btn !min-h-[44px] !px-2.5 text-xs ${
                          bulkSourceTab === key ? 'aqb-btn--primary' : 'aqb-btn--glass'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Collapsible Format Hint + Download Template */}
                  <div className="aqb-glass-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkFormatHintOpen((prev) => !prev)}
                        className="flex items-center gap-2 text-xs font-extrabold text-[var(--text)]"
                      >
                        <HelpCircle className="w-4 h-4 text-[var(--accent)]" />
                        <span>Format guide &amp; columns</span>
                        {bulkFormatHintOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadSampleCsv}
                        className="text-xs font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download template</span>
                      </button>
                    </div>

                    {bulkFormatHintOpen && (
                      <div className="mt-2.5 pt-2.5 border-t border-[var(--border)] text-xs text-[var(--text-secondary)] flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <code className="font-mono text-[11px] break-all bg-black/5 dark:bg-white/5 p-2 rounded-xl flex-1">
                            subject,topic,question,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                'subject,topic,question,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty'
                              );
                              showBanner('info', 'Copied CSV header row');
                            }}
                            className="aqb-icon-btn !w-9 !h-9 !min-w-[36px] !min-h-[36px]"
                            title="Copy header row"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Supports CSV, JSON arrays, or Q:/A)/B)/C)/D)/Answer: text blocks.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Source Input Area */}
                  {bulkSourceTab === 'csv' && (
                    <label className="aqb-glass-card p-6 border-dashed flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:border-[var(--accent)]">
                      <Upload className="w-7 h-7 text-[var(--accent)]" />
                      <div className="text-sm font-extrabold text-[var(--text)]">
                        {bulkCsvFileName || 'Tap to choose CSV file'}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        UTF-8 CSV with unlimited rows (imported in 100-row chunks)
                      </div>
                      <input
                        type="file"
                        accept=".csv,text/csv,text/plain"
                        onChange={handleCsvFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  {bulkSourceTab === 'gsheet' && (
                    <div className="flex flex-col gap-2.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Public Google Sheet URL
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={gsheetUrl}
                          onChange={(e) => setGsheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="aqb-input flex-1"
                        />
                        <button
                          type="button"
                          disabled={fetchingSheet || !gsheetUrl.trim()}
                          onClick={handleFetchGoogleSheet}
                          className="aqb-btn aqb-btn--primary shrink-0"
                        >
                          {fetchingSheet ? (
                            <ButtonLineLoader label="Fetching…" />
                          ) : (
                            <span>Fetch Sheet</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {bulkSourceTab === 'paste' && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        Paste CSV, JSON, or Question Blocks
                      </label>
                      <textarea
                        rows={6}
                        value={bulkRawInput}
                        onChange={(e) => setBulkRawInput(e.target.value)}
                        placeholder="Paste CSV rows, JSON array, or Q: ... A) ... B) ... C) ... D) ... Answer: A"
                        className="aqb-input font-mono text-xs resize-y"
                      />
                    </div>
                  )}

                  {/* Parsed Summary (Valid, Invalid, Duplicates + First 5 Rows Preview) */}
                  <div className="aqb-glass-card p-4 flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl p-2 bg-emerald-500/10 border border-emerald-500/30">
                        <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          Valid rows
                        </div>
                        <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
                          {parsedRows.length.toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-xl p-2 bg-red-500/10 border border-red-500/30">
                        <div className="text-[11px] font-bold text-red-800 dark:text-red-300">
                          Invalid rows
                        </div>
                        <div className="text-base font-extrabold text-red-700 dark:text-red-300 tabular-nums">
                          {parseErrors.length.toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-xl p-2 bg-amber-500/10 border border-amber-500/30">
                        <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          Duplicates
                        </div>
                        <div className="text-base font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">
                          {duplicateRowsCount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {parsedRows.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <div className="text-xs font-bold text-[var(--text-muted)]">
                          Preview (first {Math.min(5, parsedRows.length)} rows)
                        </div>
                        {parsedRows.slice(0, 5).map((r) => (
                          <div
                            key={r.rowIndex}
                            className="rounded-xl p-2.5 border border-[var(--border)] bg-black/[0.02] dark:bg-white/[0.02] text-xs flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-[var(--text-muted)] mr-1.5">
                                #{r.rowIndex}
                              </span>
                              <span className="font-semibold text-[var(--text)] line-clamp-1">
                                <MathText text={r.question} />
                              </span>
                              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                {r.subject} · {r.topic}
                              </div>
                            </div>
                            <span className="aqb-pill aqb-pill--live shrink-0">
                              Ans: {r.correct_answer}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & IMPORT */}
              {bulkStep === 3 && (
                <div className="flex flex-col gap-4">
                  <div className="aqb-glass-card aqb-glass-card--selected p-4 flex flex-col gap-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Import Confirmation
                    </div>
                    <div className="text-base font-extrabold text-[var(--text)]">
                      Ready to import {parsedRows.length.toLocaleString()} MCQs into{' '}
                      {bulkModalUniversity?.name} ({bulkModalUniversity?.slug})
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Defaults: <strong>{bulkDefaultSubject}</strong> ·{' '}
                      <strong>{bulkDefaultTopic}</strong>
                    </div>
                  </div>

                  {/* Live Progress Counter & Bar */}
                  {importProgress && (
                    <div className="aqb-glass-card p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span>
                          Processed {importProgress.processedRows.toLocaleString()} /{' '}
                          {importProgress.totalRows.toLocaleString()}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {importProgress.importedCount.toLocaleString()} imported
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] transition-all duration-200"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (importProgress.processedRows /
                                  Math.max(1, importProgress.totalRows)) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span>
                          Chunk {importProgress.currentChunkIndex} of{' '}
                          {importProgress.totalChunks}
                        </span>
                        <span>{importProgress.failedCount} skipped/errors</span>
                      </div>
                    </div>
                  )}

                  {/* Per-Row Error List + Downloadable Report */}
                  {(parseErrors.length > 0 || (importProgress?.errors?.length ?? 0) > 0) && (
                    <div className="aqb-glass-card p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-red-600 dark:text-red-400">
                          Row validation issues (
                          {(importProgress?.errors?.length || parseErrors.length).toLocaleString()}
                          )
                        </span>
                        <button
                          type="button"
                          onClick={handleDownloadImportErrorReport}
                          className="text-xs font-bold text-[var(--accent)] underline"
                        >
                          Download errors CSV
                        </button>
                      </div>
                      <div className="max-h-36 overflow-y-auto flex flex-col gap-1 text-xs">
                        {(importProgress?.errors?.length ? importProgress.errors : parseErrors)
                          .slice(0, 20)
                          .map((err, i) => (
                            <div key={i} className="text-[var(--text-secondary)]">
                              <strong className="font-mono">Row {err.row}:</strong> {err.message}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Bulk Wizard Footer — Button Never Clips */}
            <div className="aqb-sheet-footer">
              {bulkStep > 1 && (
                <button
                  type="button"
                  disabled={importingChunked}
                  onClick={() => setBulkStep((prev) => (prev === 3 ? 2 : 1))}
                  className="aqb-btn aqb-btn--glass"
                >
                  Back
                </button>
              )}

              {bulkStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setBulkStep((prev) => (prev === 1 ? 2 : 3))}
                  className="aqb-btn aqb-btn--primary flex-1 sm:flex-initial !min-h-[52px]"
                >
                  <span>Continue</span>
                </button>
              ) : (
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 min-w-0">
                  {parsedRows.length === 0 && (
                    <span className="text-xs font-semibold text-[var(--text-muted)] text-center sm:text-right">
                      Add valid rows in Step 2 to enable import
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={parsedRows.length === 0 || importingChunked}
                    onClick={handleStartOrResumeImport}
                    className="aqb-btn aqb-btn--primary !min-h-[52px] whitespace-normal text-center leading-tight px-5"
                  >
                    {importingChunked ? (
                      <ButtonLineLoader label="Importing chunks…" />
                    ) : resumableState &&
                      resumableState.nextRowOffset > 0 &&
                      resumableState.nextRowOffset < parsedRows.length ? (
                      <>
                        <Play className="w-4 h-4 shrink-0" />
                        <span>
                          Resume Import ({parsedRows.length - resumableState.nextRowOffset} MCQs)
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 shrink-0" />
                        <span>
                          Import {parsedRows.length.toLocaleString()} MCQs
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          COMPACT DIALOGS: ADD/EDIT UNIVERSITY, MOVE MCQS, DELETE CONFIRMATIONS
          ====================================================================== */}
      {uniFormModalOpen && (
        <div
          className="aqb-sheet-backdrop"
          onClick={() => setUniFormModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveUniversity}
            onClick={(e) => e.stopPropagation()}
            className="aqb-sheet aqb-sheet--compact"
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>
            <div className="aqb-sheet-header">
              <h2 className="text-base font-extrabold text-[var(--text)]">
                {editingUni ? 'Edit University' : 'Add University'}
              </h2>
              <button
                type="button"
                onClick={() => setUniFormModalOpen(false)}
                className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aqb-sheet-body flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  University Name
                </label>
                <input
                  type="text"
                  required
                  value={uniNameInput}
                  onChange={(e) => setUniNameInput(e.target.value)}
                  placeholder="e.g. FAST-NUCES"
                  className="aqb-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Slug (unique key)
                </label>
                <input
                  type="text"
                  value={uniSlugInput}
                  onChange={(e) => setUniSlugInput(e.target.value)}
                  placeholder="e.g. fast-nuces"
                  className="aqb-input font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Logo URL (optional)
                </label>
                <input
                  type="url"
                  value={uniLogoInput}
                  onChange={(e) => setUniLogoInput(e.target.value)}
                  placeholder="https://..."
                  className="aqb-input"
                />
              </div>
            </div>
            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={() => setUniFormModalOpen(false)}
                className="aqb-btn aqb-btn--glass"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingUni}
                className="aqb-btn aqb-btn--primary"
              >
                {savingUni ? <ButtonLineLoader label="Saving…" /> : <span>Save</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Move Selected MCQs to Another University Sheet */}
      {moveModalOpen && (
        <div
          className="aqb-sheet-backdrop"
          onClick={() => setMoveModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="aqb-sheet aqb-sheet--compact"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>
            <div className="aqb-sheet-header">
              <h2 className="text-base font-extrabold text-[var(--text)]">
                Move {selectedMcqIds.size} MCQ(s)
              </h2>
              <button
                type="button"
                onClick={() => setMoveModalOpen(false)}
                className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aqb-sheet-body flex flex-col gap-3">
              <p className="text-xs text-[var(--text-secondary)]">
                Select the destination university. Both universities&apos; MCQ counts and LIVE
                status will be recalculated automatically.
              </p>
              <select
                value={moveTargetUniId}
                onChange={(e) => setMoveTargetUniId(e.target.value)}
                className="aqb-input"
              >
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.slug}) — {u.mcq_count} MCQs
                  </option>
                ))}
              </select>
            </div>
            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={() => setMoveModalOpen(false)}
                className="aqb-btn aqb-btn--glass"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={movingMcqs || !moveTargetUniId}
                onClick={handleMoveSelectedMcqs}
                className="aqb-btn aqb-btn--primary"
              >
                {movingMcqs ? (
                  <ButtonLineLoader label="Moving…" />
                ) : (
                  <span>Confirm Move</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete MCQs Confirmation Sheet */}
      {confirmDeleteMcqModal && (
        <div
          className="aqb-sheet-backdrop"
          onClick={() => setConfirmDeleteMcqModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="aqb-sheet aqb-sheet--compact"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>
            <div className="aqb-sheet-header">
              <h2 className="text-base font-extrabold text-[var(--text)]">Confirm Delete</h2>
              <button
                type="button"
                onClick={() => setConfirmDeleteMcqModal(null)}
                className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aqb-sheet-body">
              <p className="text-sm text-[var(--text-secondary)]">
                Are you sure you want to permanently delete{' '}
                <strong className="text-[var(--text)]">{confirmDeleteMcqModal.label}</strong>?
              </p>
            </div>
            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={() => setConfirmDeleteMcqModal(null)}
                className="aqb-btn aqb-btn--glass"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingMcqs}
                onClick={handleConfirmDeleteMcqs}
                className="aqb-btn aqb-btn--danger"
              >
                {deletingMcqs ? (
                  <ButtonLineLoader label="Deleting…" />
                ) : (
                  <span>Delete ({confirmDeleteMcqModal.ids.length})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete University Confirmation Sheet */}
      {confirmDeleteUni && (
        <div
          className="aqb-sheet-backdrop"
          onClick={() => setConfirmDeleteUni(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="aqb-sheet aqb-sheet--compact"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>
            <div className="aqb-sheet-header">
              <h2 className="text-base font-extrabold text-[var(--text)]">
                Delete {confirmDeleteUni.name}?
              </h2>
              <button
                type="button"
                onClick={() => setConfirmDeleteUni(null)}
                className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aqb-sheet-body">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                This will remove <strong>{confirmDeleteUni.name}</strong> ({confirmDeleteUni.slug})
                and its{' '}
                <strong>{confirmDeleteUni.mcq_count.toLocaleString()} associated MCQs</strong>.
              </p>
            </div>
            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={() => setConfirmDeleteUni(null)}
                className="aqb-btn aqb-btn--glass"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUni}
                onClick={handleConfirmDeleteUniversity}
                className="aqb-btn aqb-btn--danger"
              >
                {deletingUni ? (
                  <ButtonLineLoader label="Deleting…" />
                ) : (
                  <span>Delete university</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestionsPage;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Flag,
  CheckCircle2,
  Database,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  FileText,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Layers,
} from 'lucide-react';
import { MathText, validateMath } from '@/components/ui/MathText';
import { D1UniversityRow, D1McqRow, D1McqReportRow } from '@/constants/d1Universities';
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
  fetchMcqReports,
  updateMcqReportStatus,
  fetchLegacyBankSummary,
  confirmDeleteLegacyAdminBank,
  convertGoogleSheetToCsvUrl,
  parseImportInput,
  runChunkedMcqImport,
  type BankHealthData,
  type LegacyBankSummary,
  type ResumableImportState,
  type ChunkImportProgress,
  type ImportRowError,
} from '@/services/universityMcqService';

interface LatexSnippet {
  label: string;
  snippet: string;
  category: 'math' | 'greek' | 'chem' | 'calc';
}

const LATEX_SNIPPETS: LatexSnippet[] = [
  { label: 'x²', snippet: '$x^2$', category: 'math' },
  { label: 'xₙ', snippet: '$x_n$', category: 'math' },
  { label: 'a/b', snippet: '$\\frac{a}{b}$', category: 'math' },
  { label: '√x', snippet: '$\\sqrt{x}$', category: 'math' },
  { label: '±', snippet: '$\\pm$', category: 'math' },
  { label: '×', snippet: '$\\times$', category: 'math' },
  { label: '≤', snippet: '$\\le$', category: 'math' },
  { label: '≥', snippet: '$\\ge$', category: 'math' },
  { label: '≠', snippet: '$\\ne$', category: 'math' },
  { label: '∞', snippet: '$\\infty$', category: 'math' },
  { label: 'α', snippet: '$\\alpha$', category: 'greek' },
  { label: 'β', snippet: '$\\beta$', category: 'greek' },
  { label: 'θ', snippet: '$\\theta$', category: 'greek' },
  { label: 'π', snippet: '$\\pi$', category: 'greek' },
  { label: 'Δ', snippet: '$\\Delta$', category: 'greek' },
  { label: 'λ', snippet: '$\\lambda$', category: 'greek' },
  { label: '∫', snippet: '$\\int_{a}^{b} f(x)\\,dx$', category: 'calc' },
  { label: 'lim', snippet: '$\\lim_{x \\to 0}$', category: 'calc' },
  { label: '∑', snippet: '$\\sum_{i=1}^{n}$', category: 'calc' },
  { label: '→ (rxn)', snippet: '$\\ce{A + B -> C}$', category: 'chem' },
  { label: '⇌ (eq)', snippet: '$\\ce{A + B <=> C + D}$', category: 'chem' },
  { label: 'H₂O', snippet: '$\\ce{H2O}$', category: 'chem' },
  { label: 'H₂SO₄', snippet: '$\\ce{H2SO4}$', category: 'chem' },
  { label: 'Ion', snippet: '$\\ce{SO4^{2-}}$', category: 'chem' },
];

const DEFAULT_SUBJECT_SUGGESTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'English',
  'Biology',
  'Analytical Reasoning',
  'IQ & Logical Reasoning',
];

const LEGACY_POOL_LABELS: Array<{ slug: string; label: string }> = [
  { slug: 'mathematics', label: 'Mathematics' },
  { slug: 'physics', label: 'Physics' },
  { slug: 'chemistry', label: 'Chemistry' },
  { slug: 'computer-science', label: 'Computer Science' },
  { slug: 'english', label: 'English' },
  { slug: 'biology', label: 'Biology' },
  { slug: 'analytical-reasoning', label: 'Analytical Reasoning' },
];

export function AdminQuestionsPage() {
  // ── Top-level Tabs ──
  const [activeTab, setActiveTab] = useState<'questions' | 'health' | 'reports'>('questions');

  // ── Universities State (D1) ──
  const [universities, setUniversities] = useState<D1UniversityRow[]>([]);
  const [selectedUniId, setSelectedUniId] = useState<string>('');
  const [loadingUnis, setLoadingUnis] = useState<boolean>(true);

  // ── University Manager Modal State ──
  const [uniModalOpen, setUniModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState<D1UniversityRow | null>(null);
  const [uniFormName, setUniFormName] = useState('');
  const [uniFormSlug, setUniFormSlug] = useState('');
  const [uniFormLogo, setUniFormLogo] = useState('');
  const [uniSaving, setUniSaving] = useState(false);

  // ── Filters & Hierarchy State ──
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageIndex, setPageIndex] = useState<number>(0);
  const pageSize = 25;

  // ── Topics tree for selected university ──
  const [uniSubjectsTree, setUniSubjectsTree] = useState<
    Array<{ subject: string; total: number; topics: Array<{ topic: string; count: number }> }>
  >([]);

  // ── MCQs List State (D1) ──
  const [mcqs, setMcqs] = useState<D1McqRow[]>([]);
  const [totalMcqs, setTotalMcqs] = useState<number>(0);
  const [loadingMcqs, setLoadingMcqs] = useState<boolean>(false);
  const [selectedMcqIds, setSelectedMcqIds] = useState<Set<string>>(new Set());

  // ── Single MCQ Add/Edit Modal State ──
  const [mcqModalOpen, setMcqModalOpen] = useState<boolean>(false);
  const [editingMcq, setEditingMcq] = useState<D1McqRow | null>(null);
  const [formUniId, setFormUniId] = useState<string>('');
  const [formSubject, setFormSubject] = useState<string>('Mathematics');
  const [formTopic, setFormTopic] = useState<string>('General');
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [formQuestion, setFormQuestion] = useState<string>('');
  const [formOptionA, setFormOptionA] = useState<string>('');
  const [formOptionB, setFormOptionB] = useState<string>('');
  const [formOptionC, setFormOptionC] = useState<string>('');
  const [formOptionD, setFormOptionD] = useState<string>('');
  const [formCorrect, setFormCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formExplanation, setFormExplanation] = useState<string>('');
  const [savingMcq, setSavingMcq] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<
    'question' | 'option_a' | 'option_b' | 'option_c' | 'option_d' | 'explanation'
  >('question');

  // ── Bulk Import Modal State (Unlimited Chunked D1 Importer) ──
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importSourceType, setImportSourceType] = useState<'csv' | 'gsheet' | 'paste'>('csv');
  const [importUniId, setImportUniId] = useState<string>('');
  const [importSubject, setImportSubject] = useState<string>('Mathematics');
  const [importTopic, setImportTopic] = useState<string>('General');
  const [importSheetUrl, setImportSheetUrl] = useState<string>('');
  const [importRawText, setImportRawText] = useState<string>('');
  const [importFileName, setImportFileName] = useState<string>('');
  const [fetchingSheet, setFetchingSheet] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<ChunkImportProgress | null>(null);
  const [resumableState, setResumableState] = useState<ResumableImportState | null>(null);
  const [importErrorBanner, setImportErrorBanner] = useState<string | null>(null);
  const importAbortRef = useRef<AbortController | null>(null);

  // ── Bank Health & Reports State (D1) ──
  const [healthData, setHealthData] = useState<BankHealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);
  const [reports, setReports] = useState<D1McqReportRow[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);

  // ── Legacy Admin Bank Backup & Confirmed Delete Modal State ──
  const [legacyModalOpen, setLegacyModalOpen] = useState<boolean>(false);
  const [legacySummary, setLegacySummary] = useState<LegacyBankSummary | null>(null);
  const [legacyConfirmChecked, setLegacyConfirmChecked] = useState<boolean>(false);
  const [legacyDeleting, setLegacyDeleting] = useState<boolean>(false);

  // ── Feedback Toast / Notice ──
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // ── Load Universities & Legacy Summary ──
  const loadUniversities = useCallback(async () => {
    setLoadingUnis(true);
    try {
      const list = await fetchUniversities();
      const safeList = Array.isArray(list) ? list : [];
      setUniversities(safeList);
      setSelectedUniId((prev) => {
        if (prev && safeList.some((u) => u.id === prev)) return prev;
        return safeList[0]?.id || '';
      });
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load universities from D1');
    } finally {
      setLoadingUnis(false);
    }
  }, [showToast]);

  const loadLegacySummary = useCallback(async () => {
    try {
      const summary = await fetchLegacyBankSummary();
      setLegacySummary(summary);
    } catch {
      // ignore non-critical summary error
    }
  }, []);

  useEffect(() => {
    loadUniversities();
    loadLegacySummary();
  }, [loadUniversities, loadLegacySummary]);

  // ── Load Topics for Selected University ──
  const loadUniversityTopics = useCallback(async (uniId: string) => {
    if (!uniId) {
      setUniSubjectsTree([]);
      return;
    }
    try {
      const res = await fetchUniversityTopics(uniId);
      setUniSubjectsTree(Array.isArray(res?.subjects) ? res.subjects : []);
    } catch {
      setUniSubjectsTree([]);
    }
  }, []);

  useEffect(() => {
    if (selectedUniId) {
      loadUniversityTopics(selectedUniId);
    }
  }, [selectedUniId, loadUniversityTopics]);

  // ── Load MCQs for Current University + Subject + Topic + Search ──
  const loadMcqs = useCallback(async () => {
    if (!selectedUniId) {
      setMcqs([]);
      setTotalMcqs(0);
      return;
    }
    setLoadingMcqs(true);
    try {
      const res = await fetchMcqs({
        university_id: selectedUniId,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        topic: selectedTopic !== 'all' ? selectedTopic : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        search: searchQuery.trim() || undefined,
        limit: pageSize,
        offset: pageIndex * pageSize,
        include_answers: true,
      });
      const safeMcqs = Array.isArray(res?.mcqs) ? res.mcqs : [];
      setMcqs(safeMcqs);
      setTotalMcqs(typeof res?.total === 'number' ? res.total : safeMcqs.length);
      setSelectedMcqIds(new Set());
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load MCQs from D1');
    } finally {
      setLoadingMcqs(false);
    }
  }, [selectedUniId, selectedSubject, selectedTopic, selectedDifficulty, searchQuery, pageIndex, showToast]);

  useEffect(() => {
    if (activeTab === 'questions') {
      loadMcqs();
    }
  }, [activeTab, loadMcqs]);

  // ── Load Bank Health ──
  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const data = await fetchBankHealth();
      setHealthData(data);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load D1 bank health');
    } finally {
      setLoadingHealth(false);
    }
  }, [showToast]);

  // ── Load Student Reports ──
  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const list = await fetchMcqReports();
      setReports(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load student reports');
    } finally {
      setLoadingReports(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'health') loadHealth();
    if (activeTab === 'reports') loadReports();
  }, [activeTab, loadHealth, loadReports]);

  const currentUni = useMemo(
    () => (Array.isArray(universities) ? universities : []).find((u) => u.id === selectedUniId) || null,
    [universities, selectedUniId]
  );

  const availableSubjects = useMemo(() => {
    const set = new Set<string>(DEFAULT_SUBJECT_SUGGESTIONS);
    (Array.isArray(uniSubjectsTree) ? uniSubjectsTree : []).forEach((s) => {
      if (s?.subject) set.add(s.subject);
    });
    return Array.from(set);
  }, [uniSubjectsTree]);

  const availableTopicsForSelectedSubject = useMemo(() => {
    const safeTree = Array.isArray(uniSubjectsTree) ? uniSubjectsTree : [];
    if (selectedSubject === 'all') {
      const allTopics: Array<{ topic: string; count: number }> = [];
      safeTree.forEach((s) => {
        (Array.isArray(s?.topics) ? s.topics : []).forEach((t) => allTopics.push(t));
      });
      return allTopics;
    }
    const found = safeTree.find(
      (s) => String(s?.subject || '').toLowerCase() === selectedSubject.toLowerCase()
    );
    return found && Array.isArray(found.topics) ? found.topics : [];
  }, [uniSubjectsTree, selectedSubject]);

  // ── University Add / Edit / Reorder / Delete Handlers ──
  const openAddUniversityModal = () => {
    setEditingUni(null);
    setUniFormName('');
    setUniFormSlug('');
    setUniFormLogo('');
    setUniModalOpen(true);
  };

  const openEditUniversityModal = (uni: D1UniversityRow) => {
    setEditingUni(uni);
    setUniFormName(uni.name);
    setUniFormSlug(uni.slug);
    setUniFormLogo(uni.logo_url || '');
    setUniModalOpen(true);
  };

  const handleSaveUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniFormName.trim()) {
      showToast('error', 'University name is required');
      return;
    }
    setUniSaving(true);
    try {
      if (editingUni) {
        const updated = await updateUniversity(editingUni.id, {
          name: uniFormName.trim(),
          slug: uniFormSlug.trim() || undefined,
          logo_url: uniFormLogo.trim(),
        });
        setUniversities((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showToast('success', `Updated ${updated.name}`);
      } else {
        const created = await createUniversity({
          name: uniFormName.trim(),
          slug: uniFormSlug.trim() || undefined,
          logo_url: uniFormLogo.trim(),
          sort_order: universities.length + 1,
        });
        setUniversities((prev) => [...prev, created]);
        setSelectedUniId(created.id);
        showToast('success', `Added university "${created.name}"`);
      }
      setUniModalOpen(false);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save university');
    } finally {
      setUniSaving(false);
    }
  };

  const handleMoveUniversity = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= universities.length) return;
    const copy = [...universities];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    const reorderedIds = copy.map((u) => u.id);
    setUniversities(copy.map((u, i) => ({ ...u, sort_order: i + 1 })));
    try {
      const updated = await reorderUniversities(reorderedIds);
      setUniversities(updated);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to reorder universities');
      loadUniversities();
    }
  };

  const handleDeleteUniversity = async (uni: D1UniversityRow) => {
    try {
      await deleteUniversity(uni.id);
      const next = universities.filter((u) => u.id !== uni.id);
      setUniversities(next);
      if (selectedUniId === uni.id) {
        setSelectedUniId(next[0]?.id || '');
      }
      showToast('success', `Deleted university "${uni.name}" and its MCQs`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete university');
    }
  };

  // ── Single MCQ Add / Edit Handlers ──
  const openAddMcqModal = () => {
    setEditingMcq(null);
    setFormUniId(selectedUniId || universities[0]?.id || '');
    setFormSubject(selectedSubject !== 'all' ? selectedSubject : 'Mathematics');
    setFormTopic(selectedTopic !== 'all' ? selectedTopic : 'General');
    setFormDifficulty('medium');
    setFormQuestion('');
    setFormOptionA('');
    setFormOptionB('');
    setFormOptionC('');
    setFormOptionD('');
    setFormCorrect('A');
    setFormExplanation('');
    setMcqModalOpen(true);
  };

  const openEditMcqModal = (mcq: D1McqRow) => {
    setEditingMcq(mcq);
    setFormUniId(mcq.university_id);
    setFormSubject(mcq.subject);
    setFormTopic(mcq.topic);
    setFormDifficulty(mcq.difficulty || 'medium');
    setFormQuestion(mcq.question);
    setFormOptionA(mcq.option_a);
    setFormOptionB(mcq.option_b);
    setFormOptionC(mcq.option_c);
    setFormOptionD(mcq.option_d);
    setFormCorrect((mcq.correct_answer as 'A' | 'B' | 'C' | 'D') || 'A');
    setFormExplanation(mcq.explanation || '');
    setMcqModalOpen(true);
  };

  const insertLatexSnippet = (snippet: string) => {
    if (activeField === 'question') setFormQuestion((p) => `${p}${snippet}`);
    else if (activeField === 'option_a') setFormOptionA((p) => `${p}${snippet}`);
    else if (activeField === 'option_b') setFormOptionB((p) => `${p}${snippet}`);
    else if (activeField === 'option_c') setFormOptionC((p) => `${p}${snippet}`);
    else if (activeField === 'option_d') setFormOptionD((p) => `${p}${snippet}`);
    else if (activeField === 'explanation') setFormExplanation((p) => `${p}${snippet}`);
  };

  const handleSaveMcq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUniId) {
      showToast('error', 'Please select a university');
      return;
    }
    if (!formQuestion.trim() || !formOptionA.trim() || !formOptionB.trim() || !formOptionC.trim() || !formOptionD.trim()) {
      showToast('error', 'Question and all 4 options (A, B, C, D) are required');
      return;
    }
    setSavingMcq(true);
    try {
      const payload = {
        university_id: formUniId,
        subject: formSubject.trim() || 'General',
        topic: formTopic.trim() || 'General',
        question: formQuestion.trim(),
        option_a: formOptionA.trim(),
        option_b: formOptionB.trim(),
        option_c: formOptionC.trim(),
        option_d: formOptionD.trim(),
        correct_answer: formCorrect,
        explanation: formExplanation.trim(),
        difficulty: formDifficulty,
      };
      if (editingMcq) {
        await updateMcq(editingMcq.id, payload);
        showToast('success', 'MCQ updated in Cloudflare D1');
      } else {
        await createMcq(payload);
        showToast('success', 'MCQ added to Cloudflare D1');
      }
      setMcqModalOpen(false);
      await Promise.all([loadUniversities(), loadUniversityTopics(selectedUniId), loadMcqs()]);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save MCQ');
    } finally {
      setSavingMcq(false);
    }
  };

  const handleDeleteSingleMcq = async (mcqId: string) => {
    try {
      await deleteMcq(mcqId);
      showToast('success', 'Deleted MCQ');
      await Promise.all([loadUniversities(), loadUniversityTopics(selectedUniId), loadMcqs()]);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete MCQ');
    }
  };

  const handleBulkDeleteSelected = async () => {
    const ids = Array.from(selectedMcqIds);
    if (ids.length === 0) return;
    try {
      const deleted = await bulkDeleteMcqs(ids, selectedUniId);
      showToast('success', `Deleted ${deleted} MCQs`);
      setSelectedMcqIds(new Set());
      await Promise.all([loadUniversities(), loadUniversityTopics(selectedUniId), loadMcqs()]);
    } catch (err: any) {
      showToast('error', err?.message || 'Bulk delete failed');
    }
  };

  // ── Unlimited Bulk Import Handlers ──
  const openBulkImportModal = () => {
    setImportUniId(selectedUniId || universities[0]?.id || '');
    setImportSubject(selectedSubject !== 'all' ? selectedSubject : 'Mathematics');
    setImportTopic(selectedTopic !== 'all' ? selectedTopic : 'General');
    setImportProgress(null);
    setResumableState(null);
    setImportErrorBanner(null);
    setImportModalOpen(true);
  };

  const handleCsvFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const text = await file.text();
    setImportRawText(text);
    setResumableState(null);
    setImportProgress(null);
    setImportErrorBanner(null);
  };

  const handleFetchGoogleSheet = async () => {
    if (!importSheetUrl.trim()) {
      setImportErrorBanner('Please paste a Google Sheet link first.');
      return;
    }
    setFetchingSheet(true);
    setImportErrorBanner(null);
    try {
      const csvUrl = convertGoogleSheetToCsvUrl(importSheetUrl);
      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error(
          `Could not fetch Google Sheet (${res.status}). Ensure link sharing is set to "Anyone with the link can view".`
        );
      }
      const csvText = await res.text();
      setImportRawText(csvText);
      setResumableState(null);
      setImportProgress(null);
      showToast('success', 'Loaded rows from Google Sheet. Ready to import!');
    } catch (err: any) {
      setImportErrorBanner(err?.message || 'Failed to fetch Google Sheet CSV');
    } finally {
      setFetchingSheet(false);
    }
  };

  const parsedPreview = useMemo(() => {
    if (!importRawText.trim()) return { rows: [], parseErrors: [] as ImportRowError[] };
    return parseImportInput(importRawText, importSubject, importTopic);
  }, [importRawText, importSubject, importTopic]);

  const startOrResumeImport = async (useExistingResumable: boolean) => {
    if (!importUniId) {
      setImportErrorBanner('Please select a target university.');
      return;
    }

    let stateToRun: ResumableImportState;
    if (useExistingResumable && resumableState) {
      stateToRun = resumableState;
    } else {
      const { rows, parseErrors } = parseImportInput(importRawText, importSubject, importTopic);
      if (rows.length === 0 && parseErrors.length === 0) {
        setImportErrorBanner('No rows found to import. Upload a CSV, fetch a Google Sheet, or paste MCQs.');
        return;
      }
      if (rows.length === 0 && parseErrors.length > 0) {
        setImportProgress({
          importedCount: 0,
          failedCount: parseErrors.length,
          processedRows: 0,
          totalRows: 0,
          currentChunkIndex: 0,
          totalChunks: 0,
          errors: parseErrors,
        });
        setImportErrorBanner(`All ${parseErrors.length} rows had formatting issues. Check the row error report below.`);
        return;
      }
      stateToRun = {
        universityId: importUniId,
        defaultSubject: importSubject.trim() || 'General',
        defaultTopic: importTopic.trim() || 'General',
        rows,
        nextRowOffset: 0,
        importedCount: 0,
        failedCount: parseErrors.length,
        errors: [...parseErrors],
      };
      setResumableState(stateToRun);
    }

    setImporting(true);
    setImportErrorBanner(null);
    const controller = new AbortController();
    importAbortRef.current = controller;

    try {
      const result = await runChunkedMcqImport({
        state: stateToRun,
        chunkSize: 100,
        signal: controller.signal,
        onProgress: (prog, nextState) => {
          setImportProgress(prog);
          setResumableState(nextState);
        },
      });

      setResumableState(result.state);
      await Promise.all([loadUniversities(), loadUniversityTopics(importUniId), loadMcqs()]);

      if (result.completed) {
        showToast(
          'success',
          `Import finished: ${result.state.importedCount} MCQs imported${
            result.state.failedCount > 0 ? ` (${result.state.failedCount} skipped)` : ''
          }`
        );
      }
    } catch (err: any) {
      setImportErrorBanner(
        `Chunk interrupted: ${err?.message || 'Network error'}. Click "Resume Import" to continue from row ${
          (resumableState?.nextRowOffset ?? 0) + 1
        }.`
      );
    } finally {
      setImporting(false);
    }
  };

  // ── Legacy Admin Bank Confirmed Delete Handler ──
  const handleConfirmLegacyDelete = async () => {
    if (!legacyConfirmChecked) return;
    setLegacyDeleting(true);
    try {
      await confirmDeleteLegacyAdminBank();
      await loadLegacySummary();
      showToast('success', 'Old Admin Bank subject-pool MCQs deleted & counts reset to 0.');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete legacy Admin Bank MCQs');
    } finally {
      setLegacyDeleting(false);
    }
  };

  const mathCheckQuestion = useMemo(() => validateMath(formQuestion), [formQuestion]);
  const totalPages = Math.max(1, Math.ceil(totalMcqs / pageSize));

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto pb-16 text-[var(--text)]">
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl border shadow-lg flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-[var(--surface)] border-emerald-500/40 text-emerald-500'
              : 'bg-[var(--surface)] border-[var(--accent)] text-[var(--accent)]'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Top Header Bar ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30">
              Cloudflare D1 · University MCQ Bank
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]">
              Zero Firebase · Admin &amp; Superadmin Only
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            University Question Bank Manager
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Add, edit, or bulk-import unlimited MCQs by University &rarr; Subject &rarr; Topic. Universities with MCQs automatically go LIVE on the student Cockpit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLegacyModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck size={15} className="text-emerald-500" />
            <span>Old Admin Bank Backup &amp; Reset (0)</span>
          </button>

          <button
            type="button"
            onClick={openAddUniversityModal}
            className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 size={15} className="text-[var(--accent)]" />
            <span>Add University</span>
          </button>

          <button
            type="button"
            onClick={openBulkImportModal}
            className="px-4 py-2.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white text-xs font-bold text-[var(--accent)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload size={15} />
            <span>Unlimited Bulk Import</span>
          </button>

          <button
            type="button"
            onClick={openAddMcqModal}
            className="btn-red px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Single MCQ</span>
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs (Questions / Bank Health / Student Reports) ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <Database size={14} />
            <span>University Questions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'health'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <Sparkles size={14} />
            <span>Bank Health (D1)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <Flag size={14} />
            <span>Student Reports</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            loadUniversities();
            if (activeTab === 'questions') loadMcqs();
            if (activeTab === 'health') loadHealth();
            if (activeTab === 'reports') loadReports();
          }}
          className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>Refresh D1</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: UNIVERSITY QUESTIONS
         ===================================================================== */}
      {activeTab === 'questions' && (
        <div className="flex flex-col gap-5">
          {/* ── University Bubbles Strip (All 18+ Pre-Seeded & Custom Universities) ── */}
          <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[var(--accent)]" />
                <h2 className="text-sm font-bold text-[var(--text)]">
                  1. Select University ({universities.length} Total ·{' '}
                  {universities.filter((u) => u.mcq_count > 0).length} LIVE ·{' '}
                  {universities.filter((u) => u.mcq_count === 0).length} Coming Soon)
                </h2>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                Universities with 0 MCQs show as &ldquo;Coming Soon&rdquo; on the Cockpit. Adding MCQs makes them LIVE automatically.
              </span>
            </div>

            {loadingUnis ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                Loading universities from Cloudflare D1...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[310px] overflow-y-auto pr-1">
                {universities.map((uni, idx) => {
                  const isSelected = uni.id === selectedUniId;
                  const isLive = uni.mcq_count > 0;
                  return (
                    <div
                      key={uni.id}
                      onClick={() => {
                        setSelectedUniId(uni.id);
                        setSelectedSubject('all');
                        setSelectedTopic('all');
                        setPageIndex(0);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--surface-muted)]/60 hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[var(--text)] truncate">
                            {uni.name}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                            /{uni.slug}
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase shrink-0 ${
                            isLive
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
                          }`}
                        >
                          {isLive ? 'LIVE' : 'Coming Soon'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]/60">
                        <span className="text-xs font-mono font-bold text-[var(--text)]">
                          {uni.mcq_count} <span className="text-[10px] font-normal text-[var(--text-muted)]">MCQs</span>
                        </span>

                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleMoveUniversity(idx, -1)}
                            disabled={idx === 0}
                            title="Move earlier"
                            className="p-1 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveUniversity(idx, 1)}
                            disabled={idx === universities.length - 1}
                            title="Move later"
                            className="p-1 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditUniversityModal(uni)}
                            title="Rename / edit university"
                            className="p-1 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUniversity(uni)}
                            title="Delete university"
                            className="p-1 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Step 2 & 3: Subject & Topic Filter Bar + Search ── */}
          {currentUni && (
            <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-[var(--text)]">
                    {currentUni.name}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      currentUni.mcq_count > 0
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {currentUni.mcq_count > 0
                      ? `LIVE ON COCKPIT · ${currentUni.mcq_count} MCQs`
                      : 'COMING SOON ON COCKPIT · 0 MCQs'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openBulkImportModal}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={13} className="text-[var(--accent)]" />
                    <span>Bulk Import into {currentUni.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={openAddMcqModal}
                    className="btn-red px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add MCQ to {currentUni.name}</span>
                  </button>
                </div>
              </div>

              {/* Subject Pills */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                  <BookOpen size={13} className="text-[var(--accent)]" />
                  <span>2. Filter by Subject:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubject('all');
                      setSelectedTopic('all');
                      setPageIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      selectedSubject === 'all'
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text)]'
                    }`}
                  >
                    All Subjects ({currentUni.mcq_count})
                  </button>
                  {uniSubjectsTree.map((sub) => (
                    <button
                      key={sub.subject}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(sub.subject);
                        setSelectedTopic('all');
                        setPageIndex(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        selectedSubject === sub.subject
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text)]'
                      }`}
                    >
                      {sub.subject} ({sub.total})
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Pills */}
              {availableTopicsForSelectedSubject.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                    <Layers size={13} className="text-[var(--accent)]" />
                    <span>3. Filter by Topic:</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTopic('all');
                        setPageIndex(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                        selectedTopic === 'all'
                          ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                          : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text)]'
                      }`}
                    >
                      All Topics
                    </button>
                    {availableTopicsForSelectedSubject.map((t) => (
                      <button
                        key={t.topic}
                        type="button"
                        onClick={() => {
                          setSelectedTopic(t.topic);
                          setPageIndex(0);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          selectedTopic === t.topic
                            ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                            : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text)]'
                        }`}
                      >
                        {t.topic} ({t.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search + Difficulty + Bulk Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPageIndex(0);
                      }}
                      placeholder="Search question text, topic, or formula..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text)] placeholder:text-[var(--placeholder)]"
                    />
                  </div>

                  <select
                    value={selectedDifficulty}
                    onChange={(e) => {
                      setSelectedDifficulty(e.target.value);
                      setPageIndex(0);
                    }}
                    className="px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text)]"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {selectedMcqIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDeleteSelected}
                    className="px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Delete Selected ({selectedMcqIds.size})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── MCQs Table / Cards ── */}
          <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={mcqs.length > 0 && selectedMcqIds.size === mcqs.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMcqIds(new Set(mcqs.map((m) => m.id)));
                    } else {
                      setSelectedMcqIds(new Set());
                    }
                  }}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-xs font-bold text-[var(--text)]">
                  Showing {mcqs.length} of {totalMcqs} MCQs
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="font-mono">
                    Page {pageIndex + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageIndex + 1 >= totalPages}
                    onClick={() => setPageIndex((p) => p + 1)}
                    className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {loadingMcqs ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                Loading MCQs from Cloudflare D1...
              </div>
            ) : mcqs.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/40 flex flex-col items-center gap-3">
                <Database size={28} className="text-[var(--text-muted)]" />
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">
                    No MCQs in {currentUni?.name || 'this university'} yet
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md">
                    This university starts empty (0 MCQs) and displays as &ldquo;Coming Soon&rdquo; on the student Cockpit. Add a single MCQ or run a bulk import to make it LIVE.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={openAddMcqModal}
                    className="btn-red px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add First MCQ</span>
                  </button>
                  <button
                    type="button"
                    onClick={openBulkImportModal}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--text)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Bulk Import CSV / Sheet</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {mcqs.map((mcq) => {
                  const isChecked = selectedMcqIds.has(mcq.id);
                  return (
                    <div
                      key={mcq.id}
                      className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setSelectedMcqIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(mcq.id);
                                else next.delete(mcq.id);
                                return next;
                              });
                            }}
                          />
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]">
                            {mcq.subject}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                            {mcq.topic}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                              mcq.difficulty === 'hard'
                                ? 'bg-red-500/15 text-red-500'
                                : mcq.difficulty === 'easy'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-amber-500/15 text-amber-500'
                            }`}
                          >
                            {mcq.difficulty}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            Correct: <strong className="text-emerald-500">{mcq.correct_answer}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditMcqModal(mcq)}
                            className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleMcq(mcq.id)}
                            className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-red-500 hover:border-red-500 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-[var(--text)] leading-relaxed">
                        <MathText text={mcq.question} block />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {(
                          [
                            ['A', mcq.option_a],
                            ['B', mcq.option_b],
                            ['C', mcq.option_c],
                            ['D', mcq.option_d],
                          ] as const
                        ).map(([letter, optText]) => {
                          const isCorrectOpt = mcq.correct_answer === letter;
                          return (
                            <div
                              key={letter}
                              className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                                isCorrectOpt
                                  ? 'border-emerald-500/50 bg-emerald-500/10 text-[var(--text)]'
                                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                                  isCorrectOpt
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'
                                }`}
                              >
                                {letter}
                              </span>
                              <div className="min-w-0 flex-1">
                                <MathText text={optText} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {mcq.explanation && (
                        <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                          <span className="font-mono text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">
                            Explanation:
                          </span>
                          <MathText text={mcq.explanation} block />
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

      {/* =====================================================================
          TAB 2: BANK HEALTH (D1)
         ===================================================================== */}
      {activeTab === 'health' && (
        <div className="flex flex-col gap-5">
          {loadingHealth || !healthData ? (
            <div className="p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
              Loading Cloudflare D1 bank health metrics...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                    Total Universities
                  </span>
                  <strong className="text-2xl font-bold text-[var(--text)] mt-1 block">
                    {healthData.totalUniversities}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                    LIVE Universities
                  </span>
                  <strong className="text-2xl font-bold text-emerald-500 mt-1 block">
                    {healthData.liveUniversities}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                    Coming Soon
                  </span>
                  <strong className="text-2xl font-bold text-[var(--text-secondary)] mt-1 block">
                    {healthData.comingSoonUniversities}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                    Total D1 MCQs
                  </span>
                  <strong className="text-2xl font-bold text-[var(--text)] mt-1 block">
                    {healthData.totalMcqs}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                    Missing Explanations
                  </span>
                  <strong className="text-2xl font-bold text-amber-500 mt-1 block">
                    {healthData.missingExplanations}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                    Open Student Reports
                  </span>
                  <strong className="text-2xl font-bold text-[var(--accent)] mt-1 block">
                    {healthData.openReports}
                  </strong>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text)] mb-3">
                  University MCQ Breakdown (Cloudflare D1)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(healthData.byUniversity || (healthData as any).universities || []).map((u: any) => (
                    <div
                      key={u.id}
                      className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[var(--text)]">{u.name}</div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)]">/{u.slug}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--text)]">
                          {u.mcq_count} MCQs
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                            u.mcq_count > 0
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
                          }`}
                        >
                          {u.mcq_count > 0 ? 'LIVE' : 'Coming Soon'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: STUDENT REPORTS (D1)
         ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[var(--text)]">
            Student Question Reports ({(reports || []).length})
          </h3>
          {loadingReports ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              Loading reports from D1...
            </div>
          ) : (reports || []).length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No student reports submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {(reports || []).map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[var(--accent-soft)] text-[var(--accent)]">
                        {rep.reason}
                      </span>
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        MCQ ID: {rep.mcq_id}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-[var(--border)]">
                        {rep.status}
                      </span>
                    </div>
                    {rep.question && (
                      <div className="text-xs text-[var(--text)]">
                        <MathText text={rep.question} />
                      </div>
                    )}
                    {rep.details && (
                      <p className="text-xs text-[var(--text-secondary)]">Note: {rep.details}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateMcqReportStatus(rep.id, 'resolved');
                        loadReports();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-semibold cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await updateMcqReportStatus(rep.id, 'ignored');
                        loadReports();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-muted)] cursor-pointer"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL 1: ADD / RENAME UNIVERSITY
         ===================================================================== */}
      {uniModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveUniversity}
            className="w-full max-w-md rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--text)]">
                {editingUni ? `Edit ${editingUni.name}` : 'Add University to D1'}
              </h3>
              <button
                type="button"
                onClick={() => setUniModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">
                  University Name *
                </label>
                <input
                  type="text"
                  required
                  value={uniFormName}
                  onChange={(e) => setUniFormName(e.target.value)}
                  placeholder="e.g. FAST-NUCES or Aga Khan University (AKU)"
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">
                  URL Slug (optional, auto-generated if blank)
                </label>
                <input
                  type="text"
                  value={uniFormSlug}
                  onChange={(e) => setUniFormSlug(e.target.value)}
                  placeholder="e.g. fast-nuces"
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">
                  Logo URL (optional)
                </label>
                <input
                  type="text"
                  value={uniFormLogo}
                  onChange={(e) => setUniFormLogo(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setUniModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uniSaving}
                className="btn-red px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                {uniSaving ? 'Saving...' : editingUni ? 'Save Changes' : 'Create University'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: ADD / EDIT SINGLE MCQ (WITH KATEX + \ce{} LIVE PREVIEW)
         ===================================================================== */}
      {mcqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveMcq}
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">
                  {editingMcq ? 'Edit University MCQ (D1)' : 'Add Single University MCQ (D1)'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Supports KaTeX math ($x^2$, \frac&#123;a&#125;&#123;b&#125;) and mhchem chemical equations (\ce&#123;H2SO4&#125;).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMcqModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* University, Subject, Topic, Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">University *</label>
                <select
                  value={formUniId}
                  onChange={(e) => setFormUniId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                >
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">Subject *</label>
                <input
                  type="text"
                  list="d1-subject-suggestions"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                />
                <datalist id="d1-subject-suggestions">
                  {availableSubjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">Topic *</label>
                <input
                  type="text"
                  required
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="e.g. Vectors & 3D"
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">Difficulty *</label>
                <select
                  value={formDifficulty}
                  onChange={(e) => setFormDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* LaTeX & \ce Toolbar */}
            <div className="p-2.5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] mr-1">
                Insert into {activeField}:
              </span>
              {LATEX_SNIPPETS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => insertLatexSnippet(item.snippet)}
                  className="px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[11px] font-mono text-[var(--text)] cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Question Input + Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--text)]">
                    Question Text *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formQuestion}
                    onFocus={() => setActiveField('question')}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    placeholder="Enter question stem (use $...$ for math or \ce{...} for chemistry)"
                    className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                  />
                  {!mathCheckQuestion.valid && (
                    <p className="text-[11px] text-amber-500 mt-1">{mathCheckQuestion.error}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold mb-1 text-[var(--text)]">Option A *</label>
                    <input
                      type="text"
                      required
                      value={formOptionA}
                      onFocus={() => setActiveField('option_a')}
                      onChange={(e) => setFormOptionA(e.target.value)}
                      className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[var(--text)]">Option B *</label>
                    <input
                      type="text"
                      required
                      value={formOptionB}
                      onFocus={() => setActiveField('option_b')}
                      onChange={(e) => setFormOptionB(e.target.value)}
                      className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[var(--text)]">Option C *</label>
                    <input
                      type="text"
                      required
                      value={formOptionC}
                      onFocus={() => setActiveField('option_c')}
                      onChange={(e) => setFormOptionC(e.target.value)}
                      className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[var(--text)]">Option D *</label>
                    <input
                      type="text"
                      required
                      value={formOptionD}
                      onFocus={() => setActiveField('option_d')}
                      onChange={(e) => setFormOptionD(e.target.value)}
                      className="w-full p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-[var(--text)]">
                      Correct Answer *
                    </label>
                    <select
                      value={formCorrect}
                      onChange={(e) => setFormCorrect(e.target.value as 'A' | 'B' | 'C' | 'D')}
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] font-bold"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-[var(--text)]">
                      Explanation (optional)
                    </label>
                    <input
                      type="text"
                      value={formExplanation}
                      onFocus={() => setActiveField('explanation')}
                      onChange={(e) => setFormExplanation(e.target.value)}
                      placeholder="Step-by-step solution..."
                      className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                    />
                  </div>
                </div>
              </div>

              {/* Live KaTeX & \ce Preview */}
              <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] flex flex-col gap-3">
                <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)]">
                  Live Student Preview (KaTeX + \ce)
                </span>
                <div className="text-sm text-[var(--text)] min-h-[48px]">
                  {formQuestion ? (
                    <MathText text={formQuestion} block />
                  ) : (
                    <span className="text-[var(--text-muted)]">Question preview will appear here...</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {(
                    [
                      ['A', formOptionA],
                      ['B', formOptionB],
                      ['C', formOptionC],
                      ['D', formOptionD],
                    ] as const
                  ).map(([ltr, val]) => (
                    <div
                      key={ltr}
                      className={`p-2 rounded-xl border text-xs flex items-center gap-2 ${
                        formCorrect === ltr
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-[var(--border)] bg-[var(--surface)]'
                      }`}
                    >
                      <span className="font-mono font-bold">{ltr}.</span>
                      <MathText text={val || `Option ${ltr}`} />
                    </div>
                  ))}
                </div>
                {formExplanation && (
                  <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs">
                    <strong className="block text-[10px] uppercase font-mono text-[var(--text-muted)] mb-0.5">
                      Explanation:
                    </strong>
                    <MathText text={formExplanation} block />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setMcqModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingMcq}
                className="btn-red px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                {savingMcq ? 'Saving to D1...' : editingMcq ? 'Update MCQ' : 'Save MCQ to D1'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: UNLIMITED BULK IMPORT (CSV / GOOGLE SHEET / PASTED TEXT / JSON)
         ===================================================================== */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[var(--accent)]">
                  Chunked D1 Batch Importer · No Row Limit
                </span>
                <h3 className="text-lg font-bold text-[var(--text)]">
                  Unlimited Bulk Import MCQs
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Import 100, 1,000, or 10,000+ MCQs in one go. Uploads in 100-row chunks with live counter, per-row error reporting, and resumable progress.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (importing && importAbortRef.current) {
                    importAbortRef.current.abort();
                  }
                  setImportModalOpen(false);
                }}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step 1: Select University, Default Subject, Default Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">
                  1. Target University *
                </label>
                <select
                  value={importUniId}
                  onChange={(e) => setImportUniId(e.target.value)}
                  disabled={importing}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] font-semibold"
                >
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.mcq_count} MCQs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">
                  2. Default Subject (used if row omits subject)
                </label>
                <input
                  type="text"
                  list="d1-subject-suggestions"
                  value={importSubject}
                  onChange={(e) => setImportSubject(e.target.value)}
                  disabled={importing}
                  placeholder="e.g. Physics"
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text)]">
                  3. Default Topic (used if row omits topic)
                </label>
                <input
                  type="text"
                  value={importTopic}
                  onChange={(e) => setImportTopic(e.target.value)}
                  disabled={importing}
                  placeholder="e.g. Electromagnetism"
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                />
              </div>
            </div>

            {/* Step 2: Source Selector (CSV File / Google Sheet Link / Paste Text or JSON) */}
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <button
                type="button"
                onClick={() => setImportSourceType('csv')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  importSourceType === 'csv'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                }`}
              >
                <FileSpreadsheet size={14} />
                <span>CSV File Upload</span>
              </button>
              <button
                type="button"
                onClick={() => setImportSourceType('gsheet')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  importSourceType === 'gsheet'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                }`}
              >
                <FileSpreadsheet size={14} />
                <span>Google Sheet Link</span>
              </button>
              <button
                type="button"
                onClick={() => setImportSourceType('paste')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  importSourceType === 'paste'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                }`}
              >
                <FileText size={14} />
                <span>Paste CSV / Text / JSON</span>
              </button>
            </div>

            {importSourceType === 'csv' && (
              <div className="p-4 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-[var(--text)]">
                    Upload CSV file (columns: subject, topic, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty)
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {importFileName
                      ? `Loaded file: ${importFileName} (${parsedPreview.rows.length} valid rows ready)`
                      : 'Supports any file size — 500, 2,000, or 10,000+ rows.'}
                  </p>
                </div>
                <label className="btn-red px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 inline-flex items-center gap-1.5">
                  <Upload size={14} />
                  <span>Choose CSV File</span>
                  <input
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleCsvFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {importSourceType === 'gsheet' && (
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/50 space-y-2.5 text-xs">
                <label className="block font-bold text-[var(--text)]">
                  Paste Google Sheet URL (Share setting: &ldquo;Anyone with the link can view&rdquo;)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={importSheetUrl}
                    onChange={(e) => setImportSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                  />
                  <button
                    type="button"
                    onClick={handleFetchGoogleSheet}
                    disabled={fetchingSheet}
                    className="btn-red px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                  >
                    {fetchingSheet ? 'Fetching Sheet...' : 'Load Sheet'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Raw Data / Paste Area ({parsedPreview.rows.length} valid rows detected
                  {parsedPreview.parseErrors.length > 0
                    ? ` · ${parsedPreview.parseErrors.length} rows with formatting errors`
                    : ''}
                  )
                </label>
                {importRawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setImportRawText('');
                      setImportFileName('');
                      setImportProgress(null);
                      setResumableState(null);
                    }}
                    className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    Clear Input
                  </button>
                )}
              </div>
              <textarea
                rows={6}
                value={importRawText}
                onChange={(e) => {
                  setImportRawText(e.target.value);
                  setResumableState(null);
                }}
                disabled={importing}
                placeholder={`Paste CSV rows, JSON array, or MCQ blocks:\nsubject,topic,question,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty\nPhysics,Kinematics,"A projectile is launched at $45^\\circ$...",10 m,20 m,30 m,40 m,B,"Using range formula $R = \\frac{v^2 \\sin 2\\theta}{g}$",medium`}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
              />
            </div>

            {/* Live Running Counter & Progress Bar */}
            {(importProgress || resumableState) && (
              <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text)]">
                    Imported {importProgress?.importedCount ?? resumableState?.importedCount ?? 0} /{' '}
                    {importProgress?.totalRows ?? resumableState?.rows.length ?? 0} MCQs...
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    Chunk {importProgress?.currentChunkIndex ?? 0} of{' '}
                    {importProgress?.totalChunks ??
                      Math.max(1, Math.ceil((resumableState?.rows.length || 1) / 100))}
                    {(importProgress?.failedCount ?? 0) > 0 && (
                      <span className="text-amber-500 ml-2">
                        · {importProgress?.failedCount} failed rows
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all duration-150"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (((importProgress?.processedRows ?? resumableState?.nextRowOffset ?? 0) /
                            Math.max(1, importProgress?.totalRows ?? resumableState?.rows.length ?? 1)) *
                            100)
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {importErrorBanner && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center justify-between gap-3">
                <span>{importErrorBanner}</span>
                {resumableState &&
                  resumableState.nextRowOffset < resumableState.rows.length &&
                  !importing && (
                    <button
                      type="button"
                      onClick={() => startOrResumeImport(true)}
                      className="btn-red px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Resume Import</span>
                    </button>
                  )}
              </div>
            )}

            {/* Per-Row Error Report */}
            {((Array.isArray(importProgress?.errors) && importProgress.errors.length > 0) ||
              (Array.isArray(parsedPreview.parseErrors) && parsedPreview.parseErrors.length > 0)) && (
              <div className="p-3.5 rounded-2xl bg-[var(--surface-muted)] border border-amber-500/40 max-h-40 overflow-y-auto space-y-1 text-xs">
                <div className="font-bold text-amber-500">
                  Row Error Report (failed rows skipped automatically without stopping import):
                </div>
                {(importProgress?.errors || parsedPreview.parseErrors || []).slice(0, 100).map((err, idx) => (
                  <div key={idx} className="font-mono text-[11px] text-[var(--text-secondary)]">
                    Row #{err.row}: {err.message}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)]">
                Ready to import <strong>{parsedPreview.rows.length}</strong> valid MCQs into{' '}
                <strong>
                  {universities.find((u) => u.id === importUniId)?.name || 'selected university'}
                </strong>
                .
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                {resumableState &&
                resumableState.nextRowOffset > 0 &&
                resumableState.nextRowOffset < resumableState.rows.length &&
                !importing ? (
                  <button
                    type="button"
                    onClick={() => startOrResumeImport(true)}
                    className="btn-red px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>
                      Resume from Row {resumableState.nextRowOffset + 1}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={importing || parsedPreview.rows.length === 0}
                    onClick={() => startOrResumeImport(false)}
                    className="btn-red px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Play size={14} />
                    <span>
                      {importing
                        ? `Importing (${importProgress?.importedCount ?? 0}/${
                            importProgress?.totalRows ?? parsedPreview.rows.length
                          })...`
                        : `Start Chunked Import (${parsedPreview.rows.length} MCQs)`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: OLD ADMIN BANK BACKUP & CONFIRMED DELETE
         ===================================================================== */}
      {legacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                <h3 className="text-base font-bold text-[var(--text)]">
                  Old Admin Subject-Pool Bank Backup &amp; Confirmed Delete
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegacyModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] space-y-2 text-xs">
              <p className="font-bold text-[var(--text)]">
                Scope &amp; Safety Verification:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
                <li>
                  Targets <strong>ONLY</strong> the old Admin Portal Question Bank subject pools (Mathematics, Physics, Chemistry, Computer Science, English, Biology, Analytical Reasoning).
                </li>
                <li>
                  <strong>Captain Dashboard &amp; Grand Line MCQs</strong> (<code>ambassador_tests</code>, Captain question pools, live Grand Line mocks) are <strong>100% untouched</strong>.
                </li>
                <li>
                  Full backup of all <strong>{legacySummary?.backupTotalCount ?? 42}</strong> old Admin Bank subject-pool MCQs is saved and downloadable below in JSON and CSV formats.
                </li>
              </ul>
            </div>

            {/* Download Backup Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="/api/admin/legacy-bank/export?format=json"
                download="legacy_admin_bank_backup.json"
                className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent)] text-xs font-bold text-[var(--text)] inline-flex items-center gap-1.5"
              >
                <Download size={14} className="text-[var(--accent)]" />
                <span>Download JSON Backup ({legacySummary?.backupTotalCount ?? 42} MCQs)</span>
              </a>
              <a
                href="/api/admin/legacy-bank/export?format=csv"
                download="legacy_admin_bank_backup.csv"
                className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent)] text-xs font-bold text-[var(--text)] inline-flex items-center gap-1.5"
              >
                <Download size={14} className="text-emerald-500" />
                <span>Download CSV Backup ({legacySummary?.backupTotalCount ?? 42} MCQs)</span>
              </a>
            </div>

            {/* Old Subject Pool Cards Showing Reset Counts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--text)]">
                  Old Admin Subject Pool Counts (Active Store vs Backup):
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    (legacySummary?.totalToDelete ?? 0) === 0
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}
                >
                  {(legacySummary?.totalToDelete ?? 0) === 0
                    ? 'ALL 7 SUBJECT POOLS RESET TO 0'
                    : `${legacySummary?.totalToDelete} MCQs PENDING DELETE`}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {LEGACY_POOL_LABELS.map((pool) => {
                  const activeCount = legacySummary?.subjectPools?.[pool.slug] ?? 0;
                  const backedUpCount = legacySummary?.backupPools?.[pool.slug] ?? 0;
                  return (
                    <div
                      key={pool.slug}
                      className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50"
                    >
                      <div className="font-semibold text-[var(--text)] truncate">{pool.label}</div>
                      <div className="font-mono text-sm font-bold text-emerald-500 mt-0.5">
                        {activeCount} active
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        (Backed up: {backedUpCount})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirmation Checkbox & Run Button */}
            <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 space-y-3 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legacyConfirmChecked}
                  onChange={(e) => setLegacyConfirmChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[var(--text-secondary)]">
                  I confirm deleting the old Admin Bank subject-pool MCQs ({legacySummary?.totalToDelete ?? 0} remaining active, {legacySummary?.backupTotalCount ?? 42} backed up to JSON/CSV) and resetting the 7 old subject pool counts and index to 0.
                </span>
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLegacyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!legacyConfirmChecked || legacyDeleting}
                  onClick={handleConfirmLegacyDelete}
                  className="btn-red px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>
                    {legacyDeleting
                      ? 'Deleting & Resetting...'
                      : (legacySummary?.totalToDelete ?? 0) === 0
                      ? 'Re-Verify Reset (0 Active)'
                      : `Confirm Delete (${legacySummary?.totalToDelete} MCQs)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQuestionsPage;

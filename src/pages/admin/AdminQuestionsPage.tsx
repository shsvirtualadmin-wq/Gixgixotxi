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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MathText, validateMath } from '@/components/ui/MathText';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import {
  fetchQuestionsPaginated,
  saveQuestion,
  deleteQuestion,
  fetchQuestionKey,
  fetchBankHealth,
  batchUpdateQuestions,
  batchImportQuestions,
  fetchQuestionReports,
  updateQuestionReportStatus,
  type BankHealthStats,
  type ImportCandidate,
} from '@/services/adminService';
import {
  getAllSubjects,
  getChaptersForSubject,
  formatSubjectName,
  formatChapterName,
  findSubjectSlug,
  findChapterSlug,
  addNewChapterToTaxonomy,
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

  // Question list state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AdminDiagnosticError | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [chapterFilter, setChapterFilter] = useState('all');
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

  // Edit / Add Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'question' | 'key' | 'preview'>('question');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('dark');
  const [previewShowKey, setPreviewShowKey] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<{
    id?: string;
    subject: string;
    chapter: string;
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

  // New chapter inline creator inside modal
  const [showNewChapterInput, setShowNewChapterInput] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  // Delete modal state
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  // Import modal / panel state
  const [importSourceType, setImportSourceType] = useState<'csv' | 'json' | 'sheet'>('csv');
  const [importText, setImportText] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [fetchingSheet, setFetchingSheet] = useState(false);
  const [dryRunCandidates, setDryRunCandidates] = useState<ImportCandidate[]>([]);
  const [dryRunErrors, setDryRunErrors] = useState<string[]>([]);
  const [dryRunDuplicatesCount, setDryRunDuplicatesCount] = useState(0);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; duplicatesSkipped: number } | null>(null);

  const subjects = useMemo(() => getAllSubjects(), []);

  // ─── LOAD DATA ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchQuestionsPaginated({
        search,
        subject: subjectFilter,
        difficulty: difficultyFilter,
        limitCount: 50,
      });

      let filtered = res.questions;
      if (chapterFilter !== 'all') {
        filtered = filtered.filter((q) => q.chapter === chapterFilter);
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter((q) => q.status === statusFilter);
      }

      setQuestions(filtered);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('Failed to load questions:', err);
      const e = err as Partial<AdminDiagnosticError>;
      setError({
        code: e?.code || 'QUESTIONS_FETCH_FAILED',
        message: e?.message || 'Failed to load questions from database. Please verify Firestore permissions.',
        collection: e?.collection || 'questions',
        operation: e?.operation || 'fetchQuestionsPaginated',
      });
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter, chapterFilter, difficultyFilter, statusFilter]);

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
    loadData();
  }, [user, loadData]);

  useEffect(() => {
    if (activeTab === 'health') loadHealth();
    if (activeTab === 'reports') loadReports();
  }, [activeTab, loadHealth, loadReports]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchQuestionsPaginated({
        search,
        subject: subjectFilter,
        difficulty: difficultyFilter,
        limitCount: 50,
        startAfterDoc: lastDoc,
      });
      setQuestions((prev) => [...prev, ...res.questions]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('Failed to load more questions:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ─── ADD / EDIT MODAL ───────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    const firstSubject = subjects[0]?.slug || 'mathematics';
    const firstChapter = subjects[0]?.chapters[0]?.slug || 'integration-by-parts';
    setEditingQuestion({
      id: undefined,
      subject: firstSubject,
      chapter: firstChapter,
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
    setModalTab('question');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = async (q: Question) => {
    const keyData = await fetchQuestionKey(q.id);
    const rawOpts = q.options && q.options.length >= 4 ? q.options : ['', '', '', ''];
    const sSlug = findSubjectSlug(q.subject || 'mathematics') || 'mathematics';
    const cSlug = findChapterSlug(sSlug, q.chapter || '') || '';

    setEditingQuestion({
      id: q.id,
      subject: sSlug,
      chapter: cSlug,
      difficulty: (q.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard',
      status: (q.status || 'published') as 'draft' | 'reviewed' | 'published',
      active: q.active !== false,
      q: q.q || q.question || '',
      options: [rawOpts[0] || '', rawOpts[1] || '', rawOpts[2] || '', rawOpts[3] || ''],
      tags: Array.isArray(q.tags) ? q.tags : ['entrance'],
      source: q.source || '',
      year: q.year || '',
      correct: keyData?.correct ?? (typeof q.correct === 'number' ? q.correct : 0),
      explain: keyData?.explain || q.explain || '',
    });
    setModalTab('question');
    setIsEditModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !user?.email) return;

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

    setSavingQuestion(true);
    try {
      await saveQuestion(user.email, {
        id: editingQuestion.id,
        subject: editingQuestion.subject,
        chapter: editingQuestion.chapter,
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

      setIsEditModalOpen(false);
      setEditingQuestion(null);
      await loadData();
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Could not save question. Please check permissions and database connectivity.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete || !user?.email) return;
    try {
      await deleteQuestion(user.email, questionToDelete.id);
      setQuestionToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  // ─── LATEX TOOLBAR INSERTION ────────────────────────────────────────────────
  const insertLatexSnippet = (snippet: string) => {
    if (!activeFocusedInputRef) return;
    const current = activeFocusedInputRef.currentVal;
    const updated = current ? `${current} ${snippet}` : snippet;
    activeFocusedInputRef.setter(updated);
  };

  // ─── ADD CHAPTER INLINE ─────────────────────────────────────────────────────
  const handleCreateNewChapter = async () => {
    if (!newChapterName.trim() || !editingQuestion) return;
    const res = await addNewChapterToTaxonomy(editingQuestion.subject, newChapterName.trim());
    if (res.ok) {
      setEditingQuestion({ ...editingQuestion, chapter: res.slug });
      setShowNewChapterInput(false);
      setNewChapterName('');
    }
  };

  // ─── BATCH ACTIONS ──────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
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

      const subject = getCol('subject') || 'mathematics';
      const chapter = getCol('chapter') || '';
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

    try {
      if (importSourceType === 'json') {
        const parsed = JSON.parse(importText);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        candidates = list.map((item) => ({
          question: {
            subject: item.subject || 'mathematics',
            chapter: item.chapter || '',
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
    setImportProgress({ current: 0, total: dryRunCandidates.length });
    try {
      const res = await batchImportQuestions(user.email, dryRunCandidates, (done, total) => {
        setImportProgress({ current: done, total });
      });
      setImportResult({ imported: res.imported, duplicatesSkipped: res.duplicatesSkipped });
      await loadData();
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
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            <span>Add MCQ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border text-[13px] font-heading transition-colors ${
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
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
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

      {batchSuccessMessage && (
        <div className="p-3.5 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{batchSuccessMessage}</span>
        </div>
      )}

      {/* ─── TAB 1: QUESTION LIST & BATCH OPERATIONS ────────────────────────── */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <AdminDiagnosticBanner
            error={error}
            collectionName="questions"
            onRetry={loadData}
            retrying={loading}
          />

          {/* Search & Multi-Filter bar */}
          <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)]">
              <Search size={16} className="text-[var(--muted)] shrink-0" />
              <input
                type="text"
                placeholder="Search stem, chapter slug, or question ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-[13px] font-heading text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1 text-[12px] font-heading">
              {/* Subject Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[var(--muted)] text-[11px]">Subject:</span>
                <select
                  value={subjectFilter}
                  onChange={(e) => {
                    setSubjectFilter(e.target.value);
                    setChapterFilter('all');
                  }}
                  className="px-2.5 py-1 rounded-[8px] bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)] text-[12px]"
                >
                  <option value="all">All subjects</option>
                  {subjects.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter Filter */}
              {subjectFilter !== 'all' && (
                <div className="flex items-center gap-1">
                  <span className="text-[var(--muted)] text-[11px]">Chapter:</span>
                  <select
                    value={chapterFilter}
                    onChange={(e) => setChapterFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-[8px] bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)] text-[12px]"
                  >
                    <option value="all">All chapters</option>
                    {getChaptersForSubject(subjectFilter).map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Difficulty */}
              <div className="flex items-center gap-1">
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
              <div className="flex items-center gap-1">
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
            </div>

            {/* Batch actions toolbar if items selected */}
            {selectedIds.size > 0 && (
              <div className="mt-2 p-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
                <div className="text-[12px] font-heading text-[var(--text)] font-semibold">
                  {selectedIds.size} questions selected
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBatchPublish}
                    disabled={batchActionLoading}
                    className="px-3 py-1 rounded-[8px] text-[12px] font-heading font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                  >
                    Publish selected
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchArchive}
                    disabled={batchActionLoading}
                    className="px-3 py-1 rounded-[8px] text-[12px] font-heading font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
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
          {questions.length > 0 && (
            <div className="flex items-center justify-between px-2 text-[12px] font-heading text-[var(--muted)]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.size === questions.length && questions.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-[var(--border)] accent-[var(--accent)]"
                />
                <span>Select all visible ({questions.length})</span>
              </label>
              <span>Showing {questions.length} questions</span>
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
            ) : questions.length === 0 ? (
              <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
                <p className="font-heading text-[14px] text-[var(--muted)]">
                  No questions found matching your filter criteria.
                </p>
              </div>
            ) : (
              questions.map((q) => {
                const stem = q.q || q.question || 'Untitled question';
                const options = q.options || [];
                const isSelected = selectedIds.has(q.id);

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
                  <span>Load More (Next 50)</span>
                )}
              </button>
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

          {healthStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                <span className="text-[11px] text-[var(--muted)] uppercase font-semibold">Duplicates Flagged</span>
                <div className="text-[28px] font-dot font-extrabold text-[var(--text)] mt-1">
                  {healthStats.duplicatesDetected}
                </div>
                <span className="text-[11px] text-emerald-400">Identified via contentHash</span>
              </div>
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
                  {/* Subject and Chapter with inline add */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                        Subject
                      </label>
                      <select
                        value={editingQuestion.subject}
                        onChange={(e) => {
                          const s = e.target.value;
                          const chapters = getChaptersForSubject(s);
                          setEditingQuestion({
                            ...editingQuestion,
                            subject: s,
                            chapter: chapters[0]?.slug || '',
                          });
                        }}
                        className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                      >
                        {subjects.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-heading text-[var(--muted)]">
                          Chapter Slug
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowNewChapterInput(!showNewChapterInput)}
                          className="text-[10px] text-[var(--accent)] hover:underline"
                        >
                          + New chapter
                        </button>
                      </div>

                      {showNewChapterInput ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="New chapter name..."
                            value={newChapterName}
                            onChange={(e) => setNewChapterName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-[var(--card-2)] border border-[var(--border)] text-[12px] text-[var(--text)]"
                          />
                          <button
                            type="button"
                            onClick={handleCreateNewChapter}
                            className="px-2.5 py-1.5 rounded-[8px] bg-[var(--text)] text-[var(--bg)] text-[11px] font-bold"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <select
                          value={editingQuestion.chapter}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, chapter: e.target.value })}
                          className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                        >
                          {getChaptersForSubject(editingQuestion.subject).map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name} ({c.slug})
                            </option>
                          ))}
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
                className="px-4 py-2 rounded-[12px] border border-[var(--red)] bg-[var(--red)] text-white text-[13px] font-heading font-semibold"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQuestionsPage;

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Flag,
  Activity,
  Layers,
  Download,
  RefreshCw,
  Play,
  FileText,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Copy,
  BookOpen,
} from 'lucide-react';
import {
  D1FormulaCategoryRow,
  D1FormulaChapterRow,
  D1FormulaItemRow,
  D1FormulaReportRow,
  D1FormulaImportLogRow,
} from '../../constants/formulaVaultSeed';
import {
  fetchFormulaVaultOverview,
  fetchChapterFormulas,
  createFormulaCategory,
  updateFormulaCategory,
  reorderFormulaCategories,
  deleteFormulaCategory,
  createFormulaChapter,
  updateFormulaChapter,
  reorderFormulaChapters,
  deleteFormulaChapter,
  createFormulaItem,
  updateFormulaItem,
  reorderFormulaItems,
  deleteFormulaItem,
  downloadFormulaCsvExport,
  fetchFormulaBankHealth,
  fixFormulaBankHealth,
  fetchFormulaReports,
  updateFormulaReportStatus,
  generateFormulaImportTemplateCsv,
  parseFormulaImportInput,
  runChunkedFormulaImport,
  downloadFormulaImportErrorsCsv,
  FormulaBankHealthData,
  ParsedFormulaImportRow,
  FormulaChunkImportProgress,
} from '../../services/formulaVaultService';
import { convertGoogleSheetToCsvUrl } from '../../services/universityMcqService';
import { MathText, validateMath } from '../../components/ui/MathText';
import { ButtonLineLoader } from '../../components/ui/LineLoader';
import { useBodyScrollLock } from '../../utils/scrollLock';

type PrimaryTab = 'formulas' | 'health' | 'reports';

export const AdminFormulasPage: React.FC = () => {
  // Primary tabs: Formulas | Health | Reports
  const [activeTab, setActiveTab] = useState<PrimaryTab>('formulas');

  // Overview state
  const [categories, setCategories] = useState<D1FormulaCategoryRow[]>([]);
  const [chapters, setChapters] = useState<D1FormulaChapterRow[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [chapterFormulas, setChapterFormulas] = useState<D1FormulaItemRow[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingChapterFormulas, setLoadingChapterFormulas] = useState(false);

  // Filters inside Formulas tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'draft'>('all');

  // Menus
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const overflowMenuRef = useRef<HTMLDivElement | null>(null);

  // Category Switch / Manage Sheet
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [categorySheetMode, setCategorySheetMode] = useState<'switch' | 'manage'>('switch');
  const [catSearchQuery, setCatSearchQuery] = useState('');

  // Category Add/Edit Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<D1FormulaCategoryRow | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catSlugInput, setCatSlugInput] = useState('');
  const [catDescInput, setCatDescInput] = useState('');
  const [catGuestAccessInput, setCatGuestAccessInput] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);

  // Chapter Add/Edit Modal
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<D1FormulaChapterRow | null>(null);
  const [chNoInput, setChNoInput] = useState(1);
  const [chTitleInput, setChTitleInput] = useState('');
  const [chSubtopicsInput, setChSubtopicsInput] = useState('');
  const [chStatusInput, setChStatusInput] = useState<'live' | 'draft'>('live');
  const [savingChapter, setSavingChapter] = useState(false);

  // Formula Add/Edit Modal
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<D1FormulaItemRow | null>(null);
  const [fNoInput, setFNoInput] = useState(1);
  const [fTitleInput, setFTitleInput] = useState('');
  const [fLatexInput, setFLatexInput] = useState('');
  const [fPlainInput, setFPlainInput] = useState('');
  const [fNoteInput, setFNoteInput] = useState('');
  const [fStatusInput, setFStatusInput] = useState<'live' | 'draft'>('live');
  const [fFeaturedInput, setFFeaturedInput] = useState(false);
  const [savingFormula, setSavingFormula] = useState(false);

  // Bulk Import Formulas 3-Step Wizard State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2 | 3>(1);
  const [bulkTargetCatId, setBulkTargetCatId] = useState('');
  const [bulkChangingCat, setBulkChangingCat] = useState(false);
  const [bulkDefaultChapterId, setBulkDefaultChapterId] = useState('');
  const [bulkSourceTab, setBulkSourceTab] = useState<'csv' | 'gsheet' | 'paste'>('csv');
  const [bulkFormatHintOpen, setBulkFormatHintOpen] = useState(false);
  const [bulkCsvFileName, setBulkCsvFileName] = useState('');
  const [bulkRawInput, setBulkRawInput] = useState('');
  const [gsheetUrl, setGsheetUrl] = useState('');
  const [fetchingSheet, setFetchingSheet] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');
  const [importingChunked, setImportingChunked] = useState(false);
  const [importProgress, setImportProgress] = useState<FormulaChunkImportProgress | null>(null);

  // Health & Reports Tabs State
  const [healthData, setHealthData] = useState<FormulaBankHealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [fixingHealth, setFixingHealth] = useState(false);

  const [reports, setReports] = useState<
    Array<
      D1FormulaReportRow & {
        formula_latex?: string;
        formula_no?: number;
        formula_note?: string;
        chapter_title?: string;
        category_name?: string;
      }
    >
  >([]);
  const [importLogs, setImportLogs] = useState<D1FormulaImportLogRow[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'open' | 'resolved' | 'ignored'>('all');
  const [loadingReports, setLoadingReports] = useState(false);

  // Lock body scroll and reset modal scroll container to top whenever any modal/sheet/wizard opens
  const anyModalOpen =
    formulaModalOpen ||
    bulkModalOpen ||
    categorySheetOpen ||
    categoryModalOpen ||
    chapterModalOpen;

  useBodyScrollLock(anyModalOpen, 'admin-formulas-modal');

  useEffect(() => {
    if (!anyModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (formulaModalOpen) setFormulaModalOpen(false);
      else if (chapterModalOpen) setChapterModalOpen(false);
      else if (categoryModalOpen) setCategoryModalOpen(false);
      else if (categorySheetOpen) setCategorySheetOpen(false);
      else if (bulkModalOpen && !importingChunked) setBulkModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const raf = window.requestAnimationFrame(() => {
      document.querySelectorAll('.aqb-sheet-body').forEach((el) => {
        (el as HTMLElement).scrollTop = 0;
      });
    });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(raf);
    };
  }, [
    formulaModalOpen,
    bulkModalOpen,
    bulkStep,
    categorySheetOpen,
    categoryModalOpen,
    chapterModalOpen,
    importingChunked,
    anyModalOpen,
  ]);

  // Feedback Banner
  const [banner, setBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showBanner = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setBanner({ type, message });
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 5000);
    return () => window.clearTimeout(t);
  }, [banner]);

  // Close dropdowns on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setOverflowMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Load overview
  const loadOverview = useCallback(async (forceRefresh = false) => {
    setLoadingInitial(true);
    try {
      const res = await fetchFormulaVaultOverview({
        includeDrafts: true,
        forceRefresh,
      });
      setCategories(res.categories);
      setChapters(res.chapters);

      setSelectedCategoryId((prev) => {
        if (prev && res.categories.some((c) => c.id === prev)) return prev;
        return res.categories[0]?.id || '';
      });
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to load Formula Bank.');
    } finally {
      setLoadingInitial(false);
    }
  }, [showBanner]);

  useEffect(() => {
    loadOverview(false);
  }, [loadOverview]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const categoryChapters = useMemo(
    () =>
      chapters
        .filter((ch) => ch.category_id === (selectedCategory?.id || ''))
        .sort(
          (a, b) =>
            Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
            Number(a.sort_order || 0) - Number(b.sort_order || 0)
        ),
    [chapters, selectedCategory]
  );

  // Keep selectedChapterId synced with selectedCategory
  useEffect(() => {
    if (categoryChapters.length === 0) {
      setSelectedChapterId('');
      setChapterFormulas([]);
      return;
    }
    if (!selectedChapterId || !categoryChapters.some((ch) => ch.id === selectedChapterId)) {
      setSelectedChapterId(categoryChapters[0].id);
    }
  }, [categoryChapters, selectedChapterId]);

  const selectedChapter = useMemo(
    () => categoryChapters.find((ch) => ch.id === selectedChapterId) || categoryChapters[0] || null,
    [categoryChapters, selectedChapterId]
  );

  // Load formulas for selectedChapter
  const loadChapterFormulas = useCallback(
    async (chapterId: string, forceRefresh = false) => {
      if (!chapterId) {
        setChapterFormulas([]);
        return;
      }
      setLoadingChapterFormulas(true);
      try {
        const res = await fetchChapterFormulas(chapterId, {
          includeDrafts: true,
          forceRefresh,
        });
        setChapterFormulas(res.formulas);
      } catch (err: any) {
        showBanner('error', err?.message || 'Failed to load chapter formulas.');
      } finally {
        setLoadingChapterFormulas(false);
      }
    },
    [showBanner]
  );

  useEffect(() => {
    if (selectedChapter?.id) {
      loadChapterFormulas(selectedChapter.id, false);
    } else {
      setChapterFormulas([]);
    }
  }, [selectedChapter?.id, loadChapterFormulas]);

  // Load Health tab when selected
  const loadHealthTab = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const data = await fetchFormulaBankHealth();
      setHealthData(data);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to load health report.');
    } finally {
      setLoadingHealth(false);
    }
  }, [showBanner]);

  useEffect(() => {
    if (activeTab === 'health') {
      loadHealthTab();
    }
  }, [activeTab, loadHealthTab]);

  // Load Reports tab when selected
  const loadReportsTab = useCallback(async () => {
    setLoadingReports(true);
    try {
      const data = await fetchFormulaReports(reportFilter);
      setReports(data.reports);
      setImportLogs(data.importLogs);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to load formula reports.');
    } finally {
      setLoadingReports(false);
    }
  }, [reportFilter, showBanner]);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReportsTab();
    }
  }, [activeTab, loadReportsTab]);

  const filteredFormulas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return chapterFormulas.filter((f) => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (!q) return true;
      return (
        f.formula_latex.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.note.toLowerCase().includes(q) ||
        String(f.formula_no).includes(q)
      );
    });
  }, [chapterFormulas, searchQuery, statusFilter]);

  const totalFormulasAllCategories = useMemo(
    () => categories.reduce((sum, c) => sum + Number(c.formula_count || 0), 0),
    [categories]
  );

  const openReportsCount = useMemo(
    () => reports.filter((r) => r.status === 'open').length,
    [reports]
  );

  const lastImportTimeLabel = useMemo(() => {
    if (!chapterFormulas.length) return 'Ready';
    const latest = chapterFormulas.reduce((acc, f) => {
      if (!f.updated_at) return acc;
      return f.updated_at > acc ? f.updated_at : acc;
    }, '');
    if (!latest) return 'Recent';
    try {
      const d = new Date(latest);
      if (Number.isNaN(d.getTime())) return 'Recent';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  }, [chapterFormulas]);

  // ── Category Handlers ─────────────────────────────────────────────────────
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatNameInput('');
    setCatSlugInput('');
    setCatDescInput('');
    setCatGuestAccessInput(true);
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: D1FormulaCategoryRow) => {
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setCatSlugInput(cat.slug);
    setCatDescInput(cat.description || '');
    setCatGuestAccessInput(cat.guest_access !== 0);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;
    setSavingCategory(true);
    try {
      if (editingCategory) {
        const updated = await updateFormulaCategory(editingCategory.id, {
          name: catNameInput.trim(),
          slug: catSlugInput.trim(),
          description: catDescInput.trim(),
          guest_access: catGuestAccessInput,
        });
        showBanner('success', `Updated category "${updated.name}".`);
      } else {
        const created = await createFormulaCategory({
          name: catNameInput.trim(),
          slug: catSlugInput.trim() || undefined,
          description: catDescInput.trim(),
          guest_access: catGuestAccessInput,
        });
        setSelectedCategoryId(created.id);
        showBanner('success', `Created category "${created.name}".`);
      }
      setCategoryModalOpen(false);
      await loadOverview(true);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to save category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleMoveCategory = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const next = [...categories];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setCategories(next);
    try {
      await reorderFormulaCategories(next.map((c) => c.id));
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to reorder categories.');
      loadOverview(true);
    }
  };

  const handleDeleteCategory = async (cat: D1FormulaCategoryRow) => {
    if (!window.confirm(`Delete category "${cat.name}" and all its chapters and formulas?`)) {
      return;
    }
    try {
      await deleteFormulaCategory(cat.id);
      showBanner('success', `Deleted category "${cat.name}".`);
      await loadOverview(true);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to delete category.');
    }
  };

  // ── Chapter Handlers ──────────────────────────────────────────────────────
  const openAddChapterModal = () => {
    if (!selectedCategory) return;
    const nextNo =
      categoryChapters.reduce((max, ch) => Math.max(max, Number(ch.chapter_no || 0)), 0) + 1;
    setEditingChapter(null);
    setChNoInput(nextNo);
    setChTitleInput('');
    setChSubtopicsInput('');
    setChStatusInput('live');
    setChapterModalOpen(true);
  };

  const openEditChapterModal = (ch: D1FormulaChapterRow) => {
    setEditingChapter(ch);
    setChNoInput(ch.chapter_no);
    setChTitleInput(ch.title);
    setChSubtopicsInput(ch.subtopics);
    setChStatusInput(ch.status === 'draft' ? 'draft' : 'live');
    setChapterModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !chTitleInput.trim()) return;
    setSavingChapter(true);
    try {
      if (editingChapter) {
        const updated = await updateFormulaChapter(editingChapter.id, {
          chapter_no: Number(chNoInput) || 1,
          title: chTitleInput.trim(),
          subtopics: chSubtopicsInput.trim(),
          status: chStatusInput,
        });
        showBanner('success', `Updated chapter "${updated.title}".`);
      } else {
        const created = await createFormulaChapter({
          category_id: selectedCategory.id,
          chapter_no: Number(chNoInput) || 1,
          title: chTitleInput.trim(),
          subtopics: chSubtopicsInput.trim(),
          status: chStatusInput,
        });
        setSelectedChapterId(created.id);
        showBanner('success', `Added chapter "${created.title}".`);
      }
      setChapterModalOpen(false);
      await loadOverview(true);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to save chapter.');
    } finally {
      setSavingChapter(false);
    }
  };

  const handleMoveChapter = async (index: number, direction: -1 | 1) => {
    if (!selectedCategory) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= categoryChapters.length) return;
    const next = [...categoryChapters];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    try {
      await reorderFormulaChapters(
        selectedCategory.id,
        next.map((c) => c.id)
      );
      await loadOverview(true);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to reorder chapters.');
    }
  };

  const handleDeleteChapter = async (ch: D1FormulaChapterRow) => {
    if (!window.confirm(`Delete chapter "${ch.title}" and all ${ch.formula_count} formulas inside it?`)) {
      return;
    }
    try {
      await deleteFormulaChapter(ch.id);
      showBanner('success', `Deleted chapter "${ch.title}".`);
      await loadOverview(true);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to delete chapter.');
    }
  };

  // ── Formula Item Handlers ─────────────────────────────────────────────────
  const openAddFormulaModal = () => {
    if (!selectedChapter) {
      showBanner('info', 'Create or select a chapter first.');
      return;
    }
    const nextNo =
      chapterFormulas.reduce((max, f) => Math.max(max, Number(f.formula_no || 0)), 0) + 1;
    setEditingFormula(null);
    setFNoInput(nextNo);
    setFTitleInput('');
    setFLatexInput('');
    setFPlainInput('');
    setFNoteInput('');
    setFStatusInput('live');
    setFFeaturedInput(false);
    setFormulaModalOpen(true);
  };

  const openEditFormulaModal = (formula: D1FormulaItemRow) => {
    setEditingFormula(formula);
    setFNoInput(formula.formula_no);
    setFTitleInput(formula.title || '');
    setFLatexInput(formula.formula_latex);
    setFPlainInput(formula.formula_plain || '');
    setFNoteInput(formula.note || '');
    setFStatusInput(formula.status === 'draft' ? 'draft' : 'live');
    setFFeaturedInput(formula.is_featured === 1);
    setFormulaModalOpen(true);
  };

  const formulaLatexValidation = useMemo(() => {
    if (!fLatexInput.trim()) return { valid: true };
    return validateMath(fLatexInput.trim());
  }, [fLatexInput]);

  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapter) return;
    if (!fLatexInput.trim()) {
      showBanner('error', 'Formula LaTeX is required.');
      return;
    }
    if (!formulaLatexValidation.valid) {
      showBanner('error', `Invalid LaTeX: ${formulaLatexValidation.error}`);
      return;
    }

    setSavingFormula(true);
    try {
      if (editingFormula) {
        await updateFormulaItem(editingFormula.id, {
          formula_no: Number(fNoInput) || 1,
          title: fTitleInput.trim(),
          formula_latex: fLatexInput.trim(),
          formula_plain: fPlainInput.trim() || fLatexInput.trim(),
          note: fNoteInput.trim(),
          status: fStatusInput,
          is_featured: fFeaturedInput,
        });
        showBanner('success', `Updated Formula #${fNoInput}.`);
      } else {
        await createFormulaItem({
          chapter_id: selectedChapter.id,
          formula_no: Number(fNoInput) || 1,
          title: fTitleInput.trim(),
          formula_latex: fLatexInput.trim(),
          formula_plain: fPlainInput.trim() || fLatexInput.trim(),
          note: fNoteInput.trim(),
          status: fStatusInput,
          is_featured: fFeaturedInput,
        });
        showBanner('success', `Added Formula #${fNoInput} to "${selectedChapter.title}".`);
      }
      setFormulaModalOpen(false);
      await loadOverview(true);
      await loadChapterFormulas(selectedChapter.id, true);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to save formula.');
    } finally {
      setSavingFormula(false);
    }
  };

  const handleToggleFormulaStatus = async (formula: D1FormulaItemRow) => {
    const nextStatus = formula.status === 'live' ? 'draft' : 'live';
    try {
      await updateFormulaItem(formula.id, { status: nextStatus });
      showBanner('success', `Formula #${formula.formula_no} marked as ${nextStatus.toUpperCase()}.`);
      if (selectedChapter) {
        await loadChapterFormulas(selectedChapter.id, true);
      }
      await loadOverview(true);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to update status.');
    }
  };

  const handleMoveFormula = async (index: number, direction: -1 | 1) => {
    if (!selectedChapter) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= chapterFormulas.length) return;
    const next = [...chapterFormulas];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setChapterFormulas(next);
    try {
      await reorderFormulaItems(
        selectedChapter.id,
        next.map((f) => f.id)
      );
      await loadChapterFormulas(selectedChapter.id, true);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to reorder formulas.');
    }
  };

  const handleDeleteFormula = async (formula: D1FormulaItemRow) => {
    if (!window.confirm(`Delete Formula #${formula.formula_no} from "${selectedChapter?.title}"?`)) {
      return;
    }
    try {
      await deleteFormulaItem(formula.id, selectedChapter?.id);
      showBanner('success', `Deleted Formula #${formula.formula_no}.`);
      if (selectedChapter) {
        await loadChapterFormulas(selectedChapter.id, true);
      }
      await loadOverview(true);
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to delete formula.');
    }
  };

  // ── Bulk Import Formulas Wizard Handlers ──────────────────────────────────
  const openBulkImportModal = () => {
    const targetCat = selectedCategory?.id || categories[0]?.id || '';
    setBulkTargetCatId(targetCat);
    const catChs = chapters
      .filter((c) => c.category_id === targetCat)
      .sort(
        (a, b) =>
          Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
      );
    setBulkDefaultChapterId(selectedChapter?.id || catChs[0]?.id || '');
    setBulkChangingCat(false);
    setBulkStep(1);
    setBulkSourceTab('csv');
    setBulkCsvFileName('');
    setBulkRawInput('');
    setGsheetUrl('');
    setDuplicateStrategy('skip');
    setImportProgress(null);
    setBulkModalOpen(true);
  };

  const bulkModalCategory = useMemo(
    () => categories.find((c) => c.id === bulkTargetCatId) || selectedCategory || null,
    [categories, bulkTargetCatId, selectedCategory]
  );

  const bulkCategoryChapters = useMemo(
    () =>
      chapters
        .filter((c) => c.category_id === (bulkModalCategory?.id || ''))
        .sort(
          (a, b) =>
            Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
            Number(a.sort_order || 0) - Number(b.sort_order || 0)
        ),
    [chapters, bulkModalCategory]
  );

  const bulkDefaultChapter = useMemo(
    () => bulkCategoryChapters.find((c) => c.id === bulkDefaultChapterId) || null,
    [bulkCategoryChapters, bulkDefaultChapterId]
  );

  const parsedBulkData = useMemo(() => {
    return parseFormulaImportInput(bulkRawInput, {
      lockedCategoryName: bulkModalCategory?.name || 'Basic Maths',
      defaultChapterTitle: bulkDefaultChapter?.title || '',
      existingChaptersInCategory: bulkCategoryChapters,
      existingFormulasInCategory:
        selectedCategory?.id === bulkModalCategory?.id ? chapterFormulas : [],
    });
  }, [
    bulkRawInput,
    bulkModalCategory,
    bulkDefaultChapter,
    bulkCategoryChapters,
    selectedCategory,
    chapterFormulas,
  ]);

  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkCsvFileName(file.name);
    const text = await file.text();
    setBulkRawInput(text);
  };

  const handleFetchGoogleSheet = async () => {
    const raw = gsheetUrl.trim();
    if (!raw) return;
    setFetchingSheet(true);
    try {
      const csvUrl = convertGoogleSheetToCsvUrl(raw);
      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error('Could not fetch Google Sheet. Make sure link sharing is set to "Anyone with the link".');
      }
      const text = await res.text();
      setBulkRawInput(text);
      showBanner('success', 'Fetched Google Sheet rows.');
    } catch (err: any) {
      showBanner('error', err?.message || 'Failed to fetch Google Sheet.');
    } finally {
      setFetchingSheet(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = generateFormulaImportTemplateCsv(bulkModalCategory?.name || 'Basic Maths');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formula_vault_template_${bulkModalCategory?.slug || 'basic-maths'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartOrRetryChunkImport = async (retryFromChunkIndex?: number) => {
    if (!bulkModalCategory) return;
    const validRows = parsedBulkData.rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showBanner('error', 'No valid formula rows to import.');
      return;
    }

    setImportingChunked(true);
    try {
      const finalProgress = await runChunkedFormulaImport({
        categoryId: bulkModalCategory.id,
        defaultChapterId: bulkDefaultChapterId || undefined,
        duplicateStrategy,
        sourceType: bulkSourceTab,
        fileName: bulkCsvFileName || undefined,
        rawCsvText: bulkSourceTab === 'csv' ? bulkRawInput : undefined,
        rows: validRows,
        startChunkIndex: retryFromChunkIndex ?? 0,
        initialProgress:
          retryFromChunkIndex && importProgress
            ? {
                importedCount: importProgress.importedCount,
                updatedCount: importProgress.updatedCount,
                skippedCount: importProgress.skippedCount,
                failedCount: importProgress.failedCount,
                errors: importProgress.errors,
              }
            : undefined,
        onProgress: (p) => setImportProgress({ ...p }),
      });

      setImportProgress(finalProgress);
      if (finalProgress.failedChunkIndex === null || finalProgress.failedChunkIndex === undefined) {
        const savedRows = finalProgress.importedCount + finalProgress.updatedCount;
        showBanner(
          'success',
          `Saved ${savedRows.toLocaleString()} formulas (${finalProgress.importedCount} imported, ${finalProgress.updatedCount} updated, ${finalProgress.skippedCount} skipped).`
        );
        await loadOverview(true);
        if (selectedChapter?.id) {
          await loadChapterFormulas(selectedChapter.id, true);
        }
      } else {
        showBanner('error', finalProgress.failedChunkMessage || 'A chunk failed during import. Use Retry below.');
      }
    } catch (err: any) {
      showBanner('error', err?.message || 'Bulk import failed.');
    } finally {
      setImportingChunked(false);
    }
  };

  return (
    <div data-admin-page="formulas" className="aqb-page-shell">
      <div className="aqb-container">
        {/* Feedback Banner */}
        {banner && (
          <div
            role="status"
            className={`aqb-glass-card px-4 py-3 flex items-center justify-between gap-3 text-sm font-semibold ${
              banner.type === 'error'
                ? 'border-red-500/40 text-red-700 dark:text-red-300'
                : banner.type === 'success'
                ? 'border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                : 'text-[var(--text)]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {banner.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--accent)]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="break-words">{banner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Compact Glass Header (exact match to Question Bank) */}
        <header className="aqb-glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h1 className="aqb-page-title">Formula Bank</h1>
            <span className="aqb-admin-chip">Admin</span>
          </div>
          <p className="mt-1 text-[13.5px] text-[var(--text-secondary)] leading-snug">
            Manage formula sheets by category &amp; chapter.
          </p>
          <p className="mt-2.5 text-xs font-bold tracking-tight text-[var(--text-muted)] tabular-nums">
            {categories.length} categories · {chapters.length} chapters ·{' '}
            {totalFormulasAllCategories.toLocaleString()} formulas
          </p>
        </header>

        {/* 2. Segmented Glass Tabs + Right-End Refresh Icon Button (exact match to Question Bank) */}
        <div className="aqb-tabs-row">
          <nav className="aqb-segmented-tabs" aria-label="Formula bank sections">
            <button
              type="button"
              onClick={() => setActiveTab('formulas')}
              className={`aqb-tab-btn ${activeTab === 'formulas' ? 'aqb-tab-btn--active' : ''}`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="truncate">Formulas</span>
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
              loadOverview(true);
              if (selectedChapter?.id) loadChapterFormulas(selectedChapter.id, true);
              if (activeTab === 'health') loadHealthTab();
              if (activeTab === 'reports') loadReportsTab();
            }}
            aria-label="Refresh Formula Bank"
            title="Refresh Formula Bank"
            className="aqb-icon-btn"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loadingInitial || loadingChapterFormulas ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>

        {/* 3. Sticky Primary Action Bar: Red "Add formulas" button + "..." overflow menu in one flex row */}
        <div className="aqb-sticky-action-bar flex items-center gap-2 flex-nowrap">
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
                <span className="truncate">Add formulas</span>
              </span>
              <ChevronDown className="w-4 h-4 shrink-0 opacity-90" />
            </button>

            {addMenuOpen && (
              <div className="aqb-dropdown-menu left-0 right-0">
                <button
                  type="button"
                  onClick={() => {
                    setAddMenuOpen(false);
                    openAddFormulaModal();
                  }}
                  className="aqb-dropdown-item"
                >
                  <Plus className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] truncate">Add single formula</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      into {selectedChapter?.title || selectedCategory?.name || 'selected chapter'}
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
                <button
                  type="button"
                  onClick={() => {
                    setAddMenuOpen(false);
                    openAddChapterModal();
                  }}
                  className="aqb-dropdown-item"
                >
                  <BookOpen className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] truncate">Add chapter</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      into {selectedCategory?.name || 'selected category'}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div ref={overflowMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setOverflowMenuOpen((prev) => !prev);
                setAddMenuOpen(false);
              }}
              aria-label="More formula bank actions"
              className="aqb-icon-btn"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {overflowMenuOpen && (
              <div className="aqb-dropdown-menu right-0">
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      openEditCategoryModal(selectedCategory);
                    }}
                    className="aqb-dropdown-item"
                  >
                    <Edit3 className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                    <span>Edit category ({selectedCategory.name})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    openAddCategoryModal();
                  }}
                  className="aqb-dropdown-item"
                >
                  <Plus className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                  <span>Add category</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    setCategorySheetMode('manage');
                    setCategorySheetOpen(true);
                  }}
                  className="aqb-dropdown-item"
                >
                  <Layers className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                  <span>Reorder / Manage categories</span>
                </button>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      downloadFormulaCsvExport({
                        categoryId: selectedCategory.id,
                        filenameHint: `formulas_${selectedCategory.slug}`,
                      });
                    }}
                    className="aqb-dropdown-item"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                    <span>Export category CSV ({selectedCategory.name})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    loadOverview(true);
                    if (selectedChapter?.id) loadChapterFormulas(selectedChapter.id, true);
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
            TAB 1: FORMULAS
            ==================================================================== */}
        {activeTab === 'formulas' && (
          <div className="flex flex-col gap-3.5 min-w-0">
            {/* 4. "Working in" Category Card (exact match to Question Bank) */}
            {selectedCategory && (
              <div className="aqb-glass-card aqb-glass-card--selected p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Working in
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="aqb-pill aqb-pill--live">
                      {selectedCategory.guest_access !== 0 ? 'LIVE' : 'SIGNED-IN ONLY'}
                    </span>
                    <span className="aqb-pill aqb-pill--tag tabular-nums font-bold">
                      {selectedCategory.formula_count.toLocaleString()} formulas
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCategorySheetMode('switch');
                    setCatSearchQuery('');
                    setCategorySheetOpen(true);
                  }}
                  className="w-full text-left flex items-center justify-between gap-3 py-1.5 rounded-2xl transition active:scale-[0.99] min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center font-display text-sm font-black shrink-0">
                      {selectedCategory.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-[var(--text)] truncate">
                        {selectedCategory.name}
                      </div>
                      <div className="text-xs font-mono text-[var(--text-muted)] truncate">
                        slug: {selectedCategory.slug}
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

            {/* 5. Selected Category Panel: 2x2 Stat Grid + Scoped "Add formula" & "Bulk import" Buttons */}
            {selectedCategory && (
              <div className="aqb-glass-card p-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-2xl px-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Total Formulas
                    </div>
                    <div className="text-base font-extrabold text-[var(--text)] tabular-nums mt-0.5">
                      {selectedCategory.formula_count.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-2xl px-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Chapters
                    </div>
                    <div className="text-base font-extrabold text-[var(--text)] tabular-nums mt-0.5">
                      {categoryChapters.length}
                    </div>
                  </div>
                  <div className="rounded-2xl px-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Guest access
                    </div>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                      {selectedCategory.guest_access !== 0 ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="rounded-2xl px-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Last update
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
                      {selectedCategory.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={openAddFormulaModal}
                      className="aqb-btn aqb-btn--glass !min-h-[44px] !px-3 text-xs"
                    >
                      <Plus className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span>Add formula</span>
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

            {/* 6. Responsive Layout: stacked on mobile, 2 cols on tablet, chapters list & chapter details side-by-side on laptop */}
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3.5 items-start min-w-0">
              {/* Left Column on Laptop: Chapters Management List */}
              <div className="w-full lg:col-span-5 aqb-glass-card p-4 flex flex-col gap-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold text-[var(--text)] truncate">
                      Chapters in {selectedCategory?.name} ({categoryChapters.length})
                    </h2>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Select a chapter to manage its formulas, reorder, or export CSV
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddChapterModal}
                    className="aqb-btn aqb-btn--glass !min-h-[38px] !px-3 text-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>New Chapter</span>
                  </button>
                </div>

                {loadingInitial ? (
                  <div className="h-24 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
                ) : categoryChapters.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
                    No chapters in this category yet. Click &ldquo;New Chapter&rdquo; or use Bulk Import.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2">
                    {categoryChapters.map((ch, idx) => {
                      const isSelected = selectedChapter?.id === ch.id;
                      const liveCountForCh =
                        isSelected && !loadingChapterFormulas
                          ? chapterFormulas.length
                          : Number(ch.formula_count || 0);
                      return (
                        <div
                          key={ch.id}
                          onClick={() => setSelectedChapterId(ch.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedChapterId(ch.id);
                            }
                          }}
                          className={`rounded-2xl border p-3 transition cursor-pointer flex flex-wrap items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent)]/[0.06]'
                              : 'border-[var(--border)] bg-black/[0.02] dark:bg-white/[0.02] hover:border-[var(--accent)]/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-display text-xs font-black shrink-0 ${
                                isSelected
                                  ? 'bg-[var(--accent)] text-white'
                                  : 'bg-black/10 dark:bg-white/10 text-[var(--text)]'
                              }`}
                            >
                              {String(ch.chapter_no).padStart(2, '0')}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold text-[var(--text)] truncate">
                                  {ch.chapter_no} {ch.title}
                                </span>
                                <span
                                  className={`aqb-pill ${
                                    ch.status === 'live' ? 'aqb-pill--live' : 'aqb-pill--coming-soon'
                                  }`}
                                >
                                  {ch.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] truncate">
                                {ch.subtopics || 'No subtopics listed'} · {liveCountForCh} formulas
                              </div>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0 ml-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveChapter(idx, -1)}
                              title="Move chapter up"
                              className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px] disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === categoryChapters.length - 1}
                              onClick={() => handleMoveChapter(idx, 1)}
                              title="Move chapter down"
                              className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px] disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                downloadFormulaCsvExport({
                                  chapterId: ch.id,
                                  filenameHint: `chapter_${ch.chapter_no}_${ch.slug}`,
                                })
                              }
                              title="Export chapter CSV"
                              className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px]"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditChapterModal(ch)}
                              title="Edit chapter"
                              className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChapter(ch)}
                              title="Delete chapter"
                              className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px] text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column on Laptop: Formulas List in Selected Chapter */}
              <div className="w-full lg:col-span-7 flex flex-col gap-3 min-w-0">
                {selectedChapter ? (
                  <>
                    <div className="aqb-glass-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                          Active Chapter #{selectedChapter.chapter_no}
                        </div>
                        <h3 className="text-base font-extrabold text-[var(--text)]">
                          {selectedChapter.title} ({filteredFormulas.length} formulas)
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 sm:w-56">
                          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter formulas in chapter..."
                            className="aqb-input !min-h-[38px] !pl-8 !pr-3 !py-1.5 text-xs"
                          />
                        </div>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          className="aqb-input !w-auto !min-h-[38px] !py-1.5 text-xs"
                        >
                          <option value="all">All status</option>
                          <option value="live">Live only</option>
                          <option value="draft">Draft only</option>
                        </select>
                      </div>
                    </div>

                    {loadingChapterFormulas ? (
                      <div className="space-y-2.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-24 animate-pulse aqb-glass-card" />
                        ))}
                      </div>
                    ) : filteredFormulas.length === 0 ? (
                      <div className="aqb-glass-card p-6 text-center">
                        <p className="text-sm font-bold text-[var(--text)]">
                          No formulas match in this chapter
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1 mb-3">
                          Add a formula with live KaTeX preview or import a CSV sheet.
                        </p>
                        <button
                          type="button"
                          onClick={openAddFormulaModal}
                          className="aqb-btn aqb-btn--primary !min-h-[42px] text-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Formula to {selectedChapter.title}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2.5">
                        {filteredFormulas.map((formula, idx) => (
                          <article key={formula.id} className="aqb-glass-card p-3.5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="aqb-pill aqb-pill--admin tabular-nums">
                                  #{formula.formula_no}
                                </span>
                                {formula.title && (
                                  <span className="text-xs font-extrabold text-[var(--text)]">
                                    {formula.title}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleFormulaStatus(formula)}
                                  title="Click to toggle Live / Draft"
                                  className={`aqb-pill cursor-pointer ${
                                    formula.status === 'live'
                                      ? 'aqb-pill--live'
                                      : 'aqb-pill--coming-soon'
                                  }`}
                                >
                                  {formula.status.toUpperCase()}
                                </button>
                                {formula.is_featured === 1 && (
                                  <span className="aqb-pill aqb-pill--tag">
                                    Formula of Day Pool
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveFormula(idx, -1)}
                                  className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px] disabled:opacity-30"
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === filteredFormulas.length - 1}
                                  onClick={() => handleMoveFormula(idx, 1)}
                                  className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px] disabled:opacity-30"
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditFormulaModal(formula)}
                                  className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px]"
                                  title="Edit formula"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFormula(formula)}
                                  className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px] text-red-500"
                                  title="Delete formula"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-[var(--border)] bg-black/[0.02] dark:bg-white/[0.03] px-4 py-3 overflow-x-auto text-sm text-[var(--text)]">
                              <MathText text={`$$${formula.formula_latex}$$`} />
                            </div>

                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                              <span className="truncate">{formula.note || 'No note'}</span>
                              <code className="font-mono text-[11px] opacity-75 truncate max-w-xs">
                                {formula.formula_latex}
                              </code>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="aqb-glass-card p-6 text-center text-xs text-[var(--text-muted)]">
                    Select or create a chapter to view and manage its formulas.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: HEALTH (Broken LaTeX, Empty Chapters, Duplicates)
            ==================================================================== */}
        {activeTab === 'health' && (
          <div className="flex flex-col gap-3.5">
            {loadingHealth || !healthData ? (
              <div className="aqb-glass-card p-6 text-center text-xs text-[var(--text-muted)]">
                Scanning Formula Bank health...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="aqb-glass-card p-3.5">
                    <div className="text-[11px] font-bold text-[var(--text-muted)]">
                      Total Formulas
                    </div>
                    <div className="text-lg font-extrabold text-[var(--text)] tabular-nums mt-0.5">
                      {healthData.totalFormulas.toLocaleString()}
                    </div>
                  </div>
                  <div className="aqb-glass-card p-3.5">
                    <div className="text-[11px] font-bold text-red-600 dark:text-red-400">
                      Broken LaTeX
                    </div>
                    <div className="text-lg font-extrabold text-red-600 dark:text-red-400 tabular-nums mt-0.5">
                      {healthData.brokenFormulasCount}
                    </div>
                  </div>
                  <div className="aqb-glass-card p-3.5">
                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      Empty Chapters
                    </div>
                    <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                      {healthData.emptyChaptersCount}
                    </div>
                  </div>
                  <div className="aqb-glass-card p-3.5">
                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      Duplicates
                    </div>
                    <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                      {healthData.duplicateFormulasCount}
                    </div>
                  </div>
                </div>

                {/* Broken LaTeX Section */}
                <div className="aqb-glass-card p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[var(--text)]">
                      Formulas that fail to render ({healthData.brokenFormulas.length})
                    </h3>
                  </div>
                  {healthData.brokenFormulas.length === 0 ? (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      All formulas pass KaTeX rendering validation.
                    </div>
                  ) : (
                    healthData.brokenFormulas.map((bf) => (
                      <div
                        key={bf.id}
                        className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--text)]">
                            {bf.category_name} · {bf.chapter_title} · #{bf.formula_no}
                          </div>
                          <code className="block font-mono text-[11px] text-red-500 truncate mt-0.5">
                            {bf.formula_latex}
                          </code>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            Error: {bf.error}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditFormulaModal(bf)}
                          className="aqb-btn aqb-btn--glass !min-h-[36px] !px-3 text-xs shrink-0"
                        >
                          Fix LaTeX
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Empty Chapters Section */}
                <div className="aqb-glass-card p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[var(--text)]">
                      Empty Chapters ({healthData.emptyChapters.length})
                    </h3>
                    {healthData.emptyChapters.length > 0 && (
                      <button
                        type="button"
                        disabled={fixingHealth}
                        onClick={async () => {
                          setFixingHealth(true);
                          await fixFormulaBankHealth('delete_empty_chapters');
                          await loadHealthTab();
                          await loadOverview(true);
                          setFixingHealth(false);
                        }}
                        className="aqb-btn aqb-btn--danger !min-h-[36px] !px-3 text-xs"
                      >
                        Delete Empty Chapters
                      </button>
                    )}
                  </div>
                  {healthData.emptyChapters.length === 0 ? (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      Every chapter has active formulas.
                    </div>
                  ) : (
                    healthData.emptyChapters.map((ec) => (
                      <div
                        key={ec.id}
                        className="rounded-2xl border border-[var(--border)] p-3 flex items-center justify-between text-xs"
                      >
                        <span>
                          <strong>{ec.category_name}</strong> · Chapter {ec.chapter_no}: {ec.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(ec.category_id);
                            setSelectedChapterId(ec.id);
                            setActiveTab('formulas');
                          }}
                          className="text-xs font-bold text-[var(--accent)] underline"
                        >
                          Add formulas
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Duplicate Formulas Section */}
                <div className="aqb-glass-card p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[var(--text)]">
                      Duplicates ({healthData.duplicateFormulas.length})
                    </h3>
                    {healthData.duplicateFormulas.length > 0 && (
                      <button
                        type="button"
                        disabled={fixingHealth}
                        onClick={async () => {
                          setFixingHealth(true);
                          await fixFormulaBankHealth('deduplicate');
                          await loadHealthTab();
                          await loadOverview(true);
                          setFixingHealth(false);
                        }}
                        className="aqb-btn aqb-btn--primary !min-h-[36px] !px-3 text-xs"
                      >
                        Auto-Deduplicate
                      </button>
                    )}
                  </div>
                  {healthData.duplicateFormulas.length === 0 ? (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      Zero duplicate formula numbers or duplicate LaTeX rows found.
                    </div>
                  ) : (
                    healthData.duplicateFormulas.map((dup, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--text)]">
                            {dup.category_name} · {dup.chapter_title} · #{dup.formula.formula_no}
                          </div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400">
                            {dup.reason}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditFormulaModal(dup.formula)}
                          className="aqb-btn aqb-btn--glass !min-h-[36px] !px-3 text-xs"
                        >
                          Edit
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 3: REPORTS (Formula Errors Reported by Students)
            ==================================================================== */}
        {activeTab === 'reports' && (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-[var(--text)]">
                Student Formula Error Reports ({reports.length})
              </h2>
              <div className="flex items-center gap-1.5">
                {(['all', 'open', 'resolved', 'ignored'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setReportFilter(st)}
                    className={`aqb-pill cursor-pointer ${
                      reportFilter === st ? 'aqb-pill--admin' : 'aqb-pill--tag'
                    }`}
                  >
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {loadingReports ? (
              <div className="aqb-glass-card p-6 text-center text-xs text-[var(--text-muted)]">
                Loading student reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="aqb-glass-card p-6 text-center text-xs text-[var(--text-muted)]">
                No formula error reports for filter &ldquo;{reportFilter}&rdquo;.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {reports.map((rep) => (
                  <div key={rep.id} className="aqb-glass-card p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[var(--text)]">
                        {rep.category_name} · {rep.chapter_title} · Formula #{rep.formula_no}
                      </span>
                      <span
                        className={`aqb-pill ${
                          rep.status === 'open' ? 'aqb-pill--admin' : 'aqb-pill--live'
                        }`}
                      >
                        {rep.status.toUpperCase()}
                      </span>
                    </div>

                    {rep.formula_latex && (
                      <div className="rounded-xl border border-[var(--border)] bg-black/[0.02] dark:bg-white/[0.03] p-3 overflow-x-auto text-sm">
                        <MathText text={`$$${rep.formula_latex}$$`} />
                      </div>
                    )}

                    <div className="text-xs text-[var(--text-secondary)]">
                      <strong>Reason:</strong> {rep.reason}{' '}
                      {rep.details && <span>— &ldquo;{rep.details}&rdquo;</span>}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await updateFormulaReportStatus(rep.id, 'resolved');
                          loadReportsTab();
                        }}
                        className="aqb-btn aqb-btn--primary !min-h-[36px] !px-3 text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await updateFormulaReportStatus(rep.id, 'ignored');
                          loadReportsTab();
                        }}
                        className="aqb-btn aqb-btn--glass !min-h-[36px] !px-3 text-xs"
                      >
                        <span>Ignore</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent R2 Bulk Import Audit Logs */}
            {importLogs.length > 0 && (
              <div className="aqb-glass-card p-4 flex flex-col gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                  Recent Bulk Imports (R2 + D1 Audit)
                </h3>
                {importLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-[var(--border)] p-2.5 text-xs flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <strong>{log.category_name}</strong> · {log.imported_count} imported,{' '}
                      {log.updated_count} updated, {log.skipped_count} skipped
                    </div>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {log.csv_r2_key ? `R2: ${log.csv_r2_key}` : log.source_type.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================================
          BULK IMPORT FORMULAS 3-STEP WIZARD (Bottom-Sheet Modal)
          ====================================================================== */}
      {bulkModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-fullscreen-modal="true"
          className="aqb-sheet-backdrop"
          onClick={() => !importingChunked && setBulkModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Bulk Import Formulas"
        >
          <div className="aqb-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>
            <div className="aqb-sheet-header">
              <div className="min-w-0">
                <div className="text-base font-extrabold text-[var(--text)]">
                  Bulk Import Formulas
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  Importing into: <strong>{bulkModalCategory?.name}</strong> (
                  {bulkModalCategory?.slug})
                </div>
              </div>
              <button
                type="button"
                disabled={importingChunked}
                onClick={() => setBulkModalOpen(false)}
                className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
                aria-label="Close bulk import wizard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Pills: 1. Target | 2. Source | 3. Import */}
            <div className="px-4 pt-3 flex items-center gap-2">
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
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition ${
                    bulkStep === stepNum
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="aqb-sheet-body">
              {/* STEP 1: TARGET */}
              {bulkStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="aqb-glass-card aqb-glass-card--selected p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Locked Target Category
                      </span>
                      <span className="aqb-pill aqb-pill--admin">Permanent Binding</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center font-display text-xs font-black">
                        {bulkModalCategory?.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-base font-extrabold text-[var(--text)]">
                        Importing into: {bulkModalCategory?.name} ({bulkModalCategory?.slug})
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Every imported row is permanently bound to this category and never shared with
                      other categories.
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() => setBulkChangingCat((prev) => !prev)}
                        className="aqb-btn aqb-btn--glass !min-h-[40px] !px-3 text-xs"
                      >
                        Change target category…
                      </button>
                    </div>

                    {bulkChangingCat && (
                      <div className="mt-2 pt-2 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setBulkTargetCatId(cat.id);
                              const firstCh = chapters
                                .filter((c) => c.category_id === cat.id)
                                .sort(
                                  (a, b) =>
                                    Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
                                    Number(a.sort_order || 0) - Number(b.sort_order || 0)
                                )[0];
                              setBulkDefaultChapterId(firstCh?.id || '');
                              setBulkChangingCat(false);
                            }}
                            className={`aqb-dropdown-item justify-between ${
                              cat.id === bulkModalCategory?.id
                                ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-bold'
                                : ''
                            }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            <span className="text-[11px] font-mono opacity-75">{cat.slug}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Default chapter (used when row omits chapter)
                    </label>
                    <select
                      value={bulkDefaultChapterId}
                      onChange={(e) => setBulkDefaultChapterId(e.target.value)}
                      className="aqb-input"
                    >
                      <option value="">Auto-create from row &ldquo;chapter&rdquo; column</option>
                      {bulkCategoryChapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.chapter_no} {ch.title} ({ch.formula_count} formulas)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: SOURCE (CSV or XLSX file | Google Sheet | Paste) */}
              {bulkStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['csv', 'CSV or XLSX file', FileSpreadsheet],
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

                  {/* Format guide & columns + Download template */}
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
                        onClick={handleDownloadTemplate}
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
                            category,chapter_no,chapter,subtopics,formula_no,formula_latex,note
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                'category,chapter_no,chapter,subtopics,formula_no,formula_latex,note'
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
                          Missing chapters are created automatically inside{' '}
                          <strong>{bulkModalCategory?.name}</strong>. Every{' '}
                          <code>formula_latex</code> row is validated with KaTeX before import.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Source Input Area */}
                  {bulkSourceTab === 'csv' && (
                    <label className="aqb-glass-card p-6 border-dashed flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:border-[var(--accent)]">
                      <Upload className="w-7 h-7 text-[var(--accent)]" />
                      <div className="text-sm font-extrabold text-[var(--text)]">
                        {bulkCsvFileName || 'Tap to choose file'}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        UTF-8 CSV or TSV/XLSX text, unlimited rows, imported in 50-row batches
                      </div>
                      <input
                        type="file"
                        accept=".csv,.tsv,.txt,.xlsx,text/csv,text/plain"
                        onChange={handleBulkFileUpload}
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
                        Paste CSV, JSON, or formula blocks
                      </label>
                      <textarea
                        rows={6}
                        value={bulkRawInput}
                        onChange={(e) => setBulkRawInput(e.target.value)}
                        placeholder="category,chapter_no,chapter,subtopics,formula_no,formula_latex,note"
                        className="aqb-input font-mono text-xs resize-y"
                      />
                    </div>
                  )}

                  {/* Live Counters: Valid rows (green), Invalid rows (red), Duplicates (amber) */}
                  <div className="aqb-glass-card p-4 flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl p-2 bg-emerald-500/10 border border-emerald-500/30">
                        <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          Valid rows
                        </div>
                        <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
                          {parsedBulkData.validCount.toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-xl p-2 bg-red-500/10 border border-red-500/30">
                        <div className="text-[11px] font-bold text-red-800 dark:text-red-300">
                          Invalid rows
                        </div>
                        <div className="text-base font-extrabold text-red-700 dark:text-red-300 tabular-nums">
                          {parsedBulkData.invalidCount.toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-xl p-2 bg-amber-500/10 border border-amber-500/30">
                        <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          Duplicates
                        </div>
                        <div className="text-base font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">
                          {parsedBulkData.duplicateCount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: IMPORT (Preview Table, Duplicate Skip/Update, Progress Bar, Retry, Summary) */}
              {bulkStep === 3 && (
                <div className="flex flex-col gap-4">
                  {/* Duplicate handling choice: Skip or Update */}
                  <div className="aqb-glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold text-[var(--text)]">
                        Duplicate handling ({parsedBulkData.duplicateCount} detected)
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Choose whether to skip existing formula numbers/LaTeX or update them
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDuplicateStrategy('skip')}
                        className={`aqb-btn !min-h-[38px] !px-3.5 text-xs ${
                          duplicateStrategy === 'skip' ? 'aqb-btn--primary' : 'aqb-btn--glass'
                        }`}
                      >
                        Skip duplicates
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateStrategy('update')}
                        className={`aqb-btn !min-h-[38px] !px-3.5 text-xs ${
                          duplicateStrategy === 'update' ? 'aqb-btn--primary' : 'aqb-btn--glass'
                        }`}
                      >
                        Update existing
                      </button>
                    </div>
                  </div>

                  {/* Preview Table of First Rows with Per-Row Errors */}
                  <div className="aqb-glass-card p-4 flex flex-col gap-2.5">
                    <div className="text-xs font-extrabold text-[var(--text)]">
                      Preview (first {Math.min(12, parsedBulkData.rows.length)} of{' '}
                      {parsedBulkData.rows.length} rows)
                    </div>
                    {parsedBulkData.rows.length === 0 ? (
                      <div className="text-xs text-[var(--text-muted)]">
                        No rows loaded yet. Go back to Step 2 to choose a file or paste formulas.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--border)] text-[11px] text-[var(--text-muted)]">
                              <th className="py-2 pr-2">#</th>
                              <th className="py-2 pr-2">Chapter</th>
                              <th className="py-2 pr-2">No.</th>
                              <th className="py-2 pr-2">Formula (KaTeX)</th>
                              <th className="py-2">Status / Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedBulkData.rows.slice(0, 12).map((row: ParsedFormulaImportRow) => (
                              <tr
                                key={row.rowNumber}
                                className="border-b border-[var(--border)]/60 align-top"
                              >
                                <td className="py-2 pr-2 font-mono text-[11px] text-[var(--text-muted)]">
                                  {row.rowNumber}
                                </td>
                                <td className="py-2 pr-2 font-semibold text-[var(--text)]">
                                  {row.chapter || '—'}
                                </td>
                                <td className="py-2 pr-2 font-mono">{row.formula_no}</td>
                                <td className="py-2 pr-2 max-w-[220px] overflow-x-auto">
                                  {row.isValid ? (
                                    <MathText text={`$${row.formula_latex}$`} />
                                  ) : (
                                    <code className="text-red-500 text-[11px]">
                                      {row.formula_latex || '(empty)'}
                                    </code>
                                  )}
                                </td>
                                <td className="py-2">
                                  {!row.isValid ? (
                                    <span className="text-red-600 dark:text-red-400 font-semibold">
                                      {row.error}
                                    </span>
                                  ) : row.isDuplicate ? (
                                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                      {row.duplicateReason} ({duplicateStrategy.toUpperCase()})
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                      Ready
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar by 50-Row Chunk + Retry + Final Summary */}
                  {importProgress && (
                    <div className="aqb-glass-card p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span>
                          Processed {importProgress.processedRows.toLocaleString()} /{' '}
                          {importProgress.totalRows.toLocaleString()} rows
                        </span>
                        <span className="font-mono text-[var(--accent)]">
                          Chunk {importProgress.currentChunkIndex} of {importProgress.totalChunks}
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

                      {/* Final Summary Counters: Imported, Updated, Skipped, Failed */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="rounded-xl p-2 bg-emerald-500/10">
                          <div className="text-[10px] text-[var(--text-muted)]">Imported</div>
                          <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {importProgress.importedCount}
                          </div>
                        </div>
                        <div className="rounded-xl p-2 bg-sky-500/10">
                          <div className="text-[10px] text-[var(--text-muted)]">Updated</div>
                          <div className="font-extrabold text-sky-600 dark:text-sky-400">
                            {importProgress.updatedCount}
                          </div>
                        </div>
                        <div className="rounded-xl p-2 bg-amber-500/10">
                          <div className="text-[10px] text-[var(--text-muted)]">Skipped</div>
                          <div className="font-extrabold text-amber-600 dark:text-amber-400">
                            {importProgress.skippedCount}
                          </div>
                        </div>
                        <div className="rounded-xl p-2 bg-red-500/10">
                          <div className="text-[10px] text-[var(--text-muted)]">Failed</div>
                          <div className="font-extrabold text-red-600 dark:text-red-400">
                            {importProgress.failedCount}
                          </div>
                        </div>
                      </div>

                      {/* Inline Completion Banner showing exact saved row count */}
                      {!importingChunked &&
                        (importProgress.failedChunkIndex === null ||
                          importProgress.failedChunkIndex === undefined) && (
                          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-center justify-between gap-2 text-xs">
                            <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                              Saved{' '}
                              {(
                                importProgress.importedCount + importProgress.updatedCount
                              ).toLocaleString()}{' '}
                              rows to {bulkModalCategory?.name} (
                              {importProgress.importedCount} new, {importProgress.updatedCount}{' '}
                              updated, {importProgress.skippedCount} skipped).
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          </div>
                        )}

                      {/* Retry on Failed Chunk */}
                      {importProgress.failedChunkIndex !== null &&
                        importProgress.failedChunkIndex !== undefined && (
                          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 flex items-center justify-between gap-2 text-xs">
                            <span className="text-red-600 dark:text-red-300 font-semibold">
                              {importProgress.failedChunkMessage || 'Chunk failed'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleStartOrRetryChunkImport(importProgress.failedChunkIndex!)
                              }
                              className="aqb-btn aqb-btn--primary !min-h-[36px] !px-3 text-xs"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Retry Chunk #{importProgress.failedChunkIndex + 1}</span>
                            </button>
                          </div>
                        )}

                      {/* Downloadable Error CSV */}
                      {(importProgress.errors.length > 0 || parsedBulkData.invalidCount > 0) && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-red-500 font-semibold">
                            {importProgress.errors.length + parsedBulkData.invalidCount} row errors
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const combinedErrors = [
                                ...parsedBulkData.rows
                                  .filter((r) => !r.isValid)
                                  .map((r) => ({
                                    rowNumber: r.rowNumber,
                                    reason: r.error || 'Invalid row',
                                  })),
                                ...importProgress.errors,
                              ];
                              downloadFormulaImportErrorsCsv(combinedErrors);
                            }}
                            className="text-xs font-bold text-[var(--accent)] underline inline-flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download error CSV</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Bulk Wizard Footer */}
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
                <button
                  type="button"
                  disabled={parsedBulkData.validCount === 0 || importingChunked}
                  onClick={() => handleStartOrRetryChunkImport(0)}
                  className="aqb-btn aqb-btn--primary flex-1 sm:flex-initial !min-h-[52px] px-5"
                >
                  {importingChunked ? (
                    <ButtonLineLoader label="Importing chunks…" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>
                        Import {parsedBulkData.validCount.toLocaleString()} Formulas
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================================
          CATEGORY SWITCH & MANAGE BOTTOM SHEET
          ====================================================================== */}
      {categorySheetOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-fullscreen-modal="true"
          className="aqb-sheet-backdrop"
          onClick={() => setCategorySheetOpen(false)}
        >
          <div className="aqb-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>
            <div className="aqb-sheet-header">
              <div className="text-base font-extrabold text-[var(--text)]">
                {categorySheetMode === 'switch' ? 'Switch Category' : 'Manage Categories'}
              </div>
              <button
                type="button"
                onClick={() => setCategorySheetOpen(false)}
                className="aqb-icon-btn !w-9 !h-9 !min-w-[36px] !min-h-[36px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aqb-sheet-body">
              <input
                type="search"
                value={catSearchQuery}
                onChange={(e) => setCatSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="aqb-input"
              />
              <div className="flex flex-col gap-2">
                {categories
                  .filter(
                    (c) =>
                      !catSearchQuery.trim() ||
                      c.name.toLowerCase().includes(catSearchQuery.trim().toLowerCase())
                  )
                  .map((cat, idx) => (
                    <div
                      key={cat.id}
                      className={`rounded-2xl border p-3 flex items-center justify-between gap-2 ${
                        cat.id === selectedCategory?.id
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setCategorySheetOpen(false);
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="font-extrabold text-sm text-[var(--text)] truncate">
                          {cat.name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {cat.chapter_count} chapters · {cat.formula_count} formulas
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveCategory(idx, -1)}
                          className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px] disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categories.length - 1}
                          onClick={() => handleMoveCategory(idx, 1)}
                          className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px] disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCategorySheetOpen(false);
                            openEditCategoryModal(cat);
                          }}
                          className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="aqb-icon-btn !w-8 !h-8 !min-w-[32px] !min-h-[32px] text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={() => {
                  setCategorySheetOpen(false);
                  openAddCategoryModal();
                }}
                className="aqb-btn aqb-btn--primary w-full"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================================
          ADD / EDIT CATEGORY MODAL
          ====================================================================== */}
      {categoryModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-fullscreen-modal="true"
          className="aqb-sheet-backdrop"
          onClick={() => setCategoryModalOpen(false)}
        >
          <form
            onSubmit={handleSaveCategory}
            onClick={(e) => e.stopPropagation()}
            className="aqb-sheet"
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>
            <div className="aqb-sheet-header">
              <div className="text-base font-extrabold text-[var(--text)]">
                {editingCategory ? `Edit Category (${editingCategory.name})` : 'Add Category'}
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="aqb-icon-btn !w-9 !h-9 !min-w-[36px] !min-h-[36px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aqb-sheet-body">
              <div>
                <label className="block text-xs font-bold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="e.g. Basic Maths"
                  className="aqb-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Slug (optional)</label>
                <input
                  type="text"
                  value={catSlugInput}
                  onChange={(e) => setCatSlugInput(e.target.value)}
                  placeholder="basic-maths"
                  className="aqb-input font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={catDescInput}
                  onChange={(e) => setCatDescInput(e.target.value)}
                  placeholder="Short description shown under category title"
                  className="aqb-input"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={catGuestAccessInput}
                  onChange={(e) => setCatGuestAccessInput(e.target.checked)}
                />
                <span>Allow guest access without login</span>
              </label>
            </div>
            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="aqb-btn aqb-btn--glass"
              >
                Cancel
              </button>
              <button type="submit" disabled={savingCategory} className="aqb-btn aqb-btn--primary">
                {savingCategory ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ======================================================================
          ADD / EDIT CHAPTER MODAL
          ====================================================================== */}
      {chapterModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-fullscreen-modal="true"
          className="aqb-sheet-backdrop"
          onClick={() => setChapterModalOpen(false)}
        >
          <form
            onSubmit={handleSaveChapter}
            onClick={(e) => e.stopPropagation()}
            className="aqb-sheet"
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>
            <div className="aqb-sheet-header">
              <div className="text-base font-extrabold text-[var(--text)]">
                {editingChapter ? `Edit Chapter (${editingChapter.title})` : 'Add Chapter'}
              </div>
              <button
                type="button"
                onClick={() => setChapterModalOpen(false)}
                className="aqb-icon-btn !w-9 !h-9 !min-w-[36px] !min-h-[36px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aqb-sheet-body">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Chapter No.</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={chNoInput}
                    onChange={(e) => setChNoInput(Number(e.target.value))}
                    className="aqb-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">Chapter Title</label>
                  <input
                    type="text"
                    required
                    value={chTitleInput}
                    onChange={(e) => setChTitleInput(e.target.value)}
                    placeholder="e.g. Percentages"
                    className="aqb-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  Subtopics line (separated by ·)
                </label>
                <input
                  type="text"
                  value={chSubtopicsInput}
                  onChange={(e) => setChSubtopicsInput(e.target.value)}
                  placeholder="Percent Change · Successive Change · Reverse Percentage"
                  className="aqb-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Status</label>
                <select
                  value={chStatusInput}
                  onChange={(e) => setChStatusInput(e.target.value as 'live' | 'draft')}
                  className="aqb-input"
                >
                  <option value="live">Live</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={() => setChapterModalOpen(false)}
                className="aqb-btn aqb-btn--glass"
              >
                Cancel
              </button>
              <button type="submit" disabled={savingChapter} className="aqb-btn aqb-btn--primary">
                {savingChapter ? 'Saving...' : 'Save Chapter'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ======================================================================
          ADD / EDIT FORMULA MODAL (with Live KaTeX Preview)
          ====================================================================== */}
      {formulaModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-fullscreen-modal="true"
          className="aqb-sheet-backdrop"
          onClick={() => setFormulaModalOpen(false)}
        >
          <form
            onSubmit={handleSaveFormula}
            onClick={(e) => e.stopPropagation()}
            className="aqb-sheet"
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>
            <div className="aqb-sheet-header">
              <div>
                <div className="text-base font-extrabold text-[var(--text)]">
                  {editingFormula
                    ? `Edit Formula #${editingFormula.formula_no}`
                    : `Add Formula to ${selectedChapter?.title}`}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Live KaTeX preview &amp; validation
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormulaModalOpen(false)}
                className="aqb-icon-btn !w-9 !h-9 !min-w-[36px] !min-h-[36px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aqb-sheet-body">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Formula No.</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={fNoInput}
                    onChange={(e) => setFNoInput(Number(e.target.value))}
                    className="aqb-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">Formula Title (optional)</label>
                  <input
                    type="text"
                    value={fTitleInput}
                    onChange={(e) => setFTitleInput(e.target.value)}
                    placeholder="e.g. Successive Percentage Change"
                    className="aqb-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Formula LaTeX</label>
                <textarea
                  rows={3}
                  required
                  value={fLatexInput}
                  onChange={(e) => setFLatexInput(e.target.value)}
                  placeholder="\text{Percentage} = \frac{\text{Part}}{\text{Whole}} \times 100\%"
                  className="aqb-input font-mono text-xs"
                />
                {!formulaLatexValidation.valid && (
                  <p className="mt-1 text-xs font-semibold text-red-500">
                    LaTeX Error: {formulaLatexValidation.error}
                  </p>
                )}
              </div>

              {/* Live KaTeX Preview Box */}
              <div className="rounded-2xl border border-[var(--border)] bg-black/[0.03] dark:bg-white/[0.03] p-4">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Live KaTeX Preview
                </div>
                {fLatexInput.trim() ? (
                  <div className="overflow-x-auto text-base text-[var(--text)]">
                    <MathText text={`$$${fLatexInput}$$`} />
                  </div>
                ) : (
                  <div className="text-xs text-[var(--text-muted)] italic">
                    Type LaTeX above to preview rendered math...
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Note / Application</label>
                <input
                  type="text"
                  value={fNoteInput}
                  onChange={(e) => setFNoteInput(e.target.value)}
                  placeholder="Short note explaining variables or usage"
                  className="aqb-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold mb-1">Status</label>
                  <select
                    value={fStatusInput}
                    onChange={(e) => setFStatusInput(e.target.value as 'live' | 'draft')}
                    className="aqb-input"
                  >
                    <option value="live">Live</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer pt-4">
                  <input
                    type="checkbox"
                    checked={fFeaturedInput}
                    onChange={(e) => setFFeaturedInput(e.target.checked)}
                  />
                  <span>Include in &ldquo;Formula of the Day&rdquo; rotation</span>
                </label>
              </div>
            </div>
            <div className="aqb-sheet-footer">
              <button
                type="button"
                onClick={() => setFormulaModalOpen(false)}
                className="aqb-btn aqb-btn--glass"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingFormula || !formulaLatexValidation.valid}
                className="aqb-btn aqb-btn--primary"
              >
                {savingFormula ? 'Saving...' : 'Save Formula'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminFormulasPage;

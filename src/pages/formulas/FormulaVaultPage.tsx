import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Copy,
  Check,
  Download,
  Sparkles,
  Flag,
  Lock,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  D1FormulaCategoryRow,
  D1FormulaChapterRow,
  D1FormulaItemRow,
} from '../../constants/formulaVaultSeed';
import {
  fetchFormulaVaultOverview,
  fetchChapterFormulas,
  searchFormulaVault,
  toggleFormulaBookmark,
  fetchBookmarkedFormulas,
  requestChapterPdfSignedUrl,
  submitFormulaReport,
  FormulaOfTheDayItem,
} from '../../services/formulaVaultService';
import { MathText } from '../../components/ui/MathText';
import { useEffectivePlan } from '../../hooks/useEffectivePlan';

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = String(query || '').trim();
  if (!q || !text) return <>{text}</>;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, idx) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={idx}
            className="rounded px-1 font-semibold bg-[var(--accent-soft)] text-[var(--accent)]"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

function formatFormulaCountBadge(count: number): string {
  const n = Number(count || 0);
  if (n >= 35) return '35+ formulas';
  return `${n} formula${n === 1 ? '' : 's'}`;
}

export const FormulaVaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest, isAdmin, isSuperAdmin } = useAuth();
  const { isUnlimited } = useEffectivePlan();

  const isSignedIn = Boolean(user && !isGuest);
  const isProOrAdmin = Boolean(isUnlimited || isAdmin || isSuperAdmin);

  const [toastBanner, setToastBanner] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastBanner({ message, type });
    },
    []
  );

  useEffect(() => {
    if (!toastBanner) return;
    const t = window.setTimeout(() => setToastBanner(null), 3200);
    return () => window.clearTimeout(t);
  }, [toastBanner]);

  // Overview state
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [categories, setCategories] = useState<D1FormulaCategoryRow[]>([]);
  const [chapters, setChapters] = useState<D1FormulaChapterRow[]>([]);
  const [formulaOfTheDay, setFormulaOfTheDay] = useState<FormulaOfTheDayItem | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Active category & open chapter (only ONE chapter open at a time)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedFormulasList, setSavedFormulasList] = useState<
    Array<D1FormulaItemRow & { chapter_title?: string; chapter_no?: number; category_name?: string }>
  >([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [openChapterId, setOpenChapterId] = useState<string | null>(null);
  const [openChapterFormulas, setOpenChapterFormulas] = useState<D1FormulaItemRow[]>([]);
  const [loadingChapterId, setLoadingChapterId] = useState<string | null>(null);
  const [downloadingPdfChapterId, setDownloadingPdfChapterId] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchMatchedChapters, setSearchMatchedChapters] = useState<D1FormulaChapterRow[]>([]);
  const [searchMatchedFormulas, setSearchMatchedFormulas] = useState<
    Array<D1FormulaItemRow & { chapter_title?: string; chapter_no?: number; category_name?: string }>
  >([]);

  // Enlarged formula modal state
  const [enlargedFormula, setEnlargedFormula] = useState<{
    formula: D1FormulaItemRow;
    chapterTitle: string;
    chapterNo: number;
    categoryName: string;
    pool: D1FormulaItemRow[];
  } | null>(null);
  const [copiedType, setCopiedType] = useState<'latex' | 'plain' | null>(null);

  // Report issue state inside enlarged view
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('incorrect_formula');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Load initial overview
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingOverview(true);
      const data = await fetchFormulaVaultOverview();
      if (!mounted) return;
      setCategories(data.categories);
      setChapters(data.chapters);
      setFormulaOfTheDay(data.formulaOfTheDay);
      setBookmarkedIds(new Set(data.bookmarkedIds));

      if (data.categories.length > 0) {
        const firstCatId = data.categories[0].id;
        setSelectedCategoryId(firstCatId);
        const firstCh = data.chapters.find((c) => c.category_id === firstCatId);
        if (firstCh) {
          setOpenChapterId(firstCh.id);
        }
      }
      setLoadingOverview(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  // Load formulas ONLY for the currently open chapter
  useEffect(() => {
    if (!openChapterId) {
      setOpenChapterFormulas([]);
      return;
    }
    let mounted = true;
    setLoadingChapterId(openChapterId);
    fetchChapterFormulas(openChapterId)
      .then((res) => {
        if (!mounted) return;
        setOpenChapterFormulas(res.formulas);
        setLoadingChapterId(null);
      })
      .catch(() => {
        if (!mounted) return;
        setLoadingChapterId(null);
      });
    return () => {
      mounted = false;
    };
  }, [openChapterId]);

  // Debounce search query
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Execute search when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchMatchedChapters([]);
      setSearchMatchedFormulas([]);
      setSearching(false);
      return;
    }
    let mounted = true;
    setSearching(true);
    searchFormulaVault(debouncedQuery)
      .then((res) => {
        if (!mounted) return;
        setSearchMatchedChapters(res.chapters);
        setSearchMatchedFormulas(res.formulas);
        setSearching(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSearching(false);
      });
    return () => {
      mounted = false;
    };
  }, [debouncedQuery]);

  // Load bookmarked formulas when "Saved" filter is active
  useEffect(() => {
    if (!showSavedOnly || !isSignedIn) return;
    let mounted = true;
    setLoadingSaved(true);
    fetchBookmarkedFormulas()
      .then((items) => {
        if (!mounted) return;
        setSavedFormulasList(items);
        setLoadingSaved(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoadingSaved(false);
      });
    return () => {
      mounted = false;
    };
  }, [showSavedOnly, isSignedIn, bookmarkedIds]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const visibleChapters = useMemo(
    () =>
      chapters
        .filter((ch) => ch.category_id === (activeCategory?.id || ''))
        .sort((a, b) => a.sort_order - b.sort_order || a.chapter_no - b.chapter_no),
    [chapters, activeCategory]
  );

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      setShowSavedOnly(false);
      setSelectedCategoryId(categoryId);
      const firstCh = chapters
        .filter((c) => c.category_id === categoryId)
        .sort((a, b) => a.sort_order - b.sort_order || a.chapter_no - b.chapter_no)[0];
      setOpenChapterId(firstCh ? firstCh.id : null);
    },
    [chapters]
  );

  const handleToggleChapter = useCallback((chapterId: string) => {
    setOpenChapterId((prev) => (prev === chapterId ? null : chapterId));
  }, []);

  const handleOpenEnlarged = useCallback(
    (
      formula: D1FormulaItemRow,
      pool: D1FormulaItemRow[],
      meta?: { chapterTitle?: string; chapterNo?: number; categoryName?: string }
    ) => {
      const ch = chapters.find((c) => c.id === formula.chapter_id);
      const cat = categories.find((c) => c.id === formula.category_id);
      setEnlargedFormula({
        formula,
        chapterTitle: meta?.chapterTitle || ch?.title || 'Chapter',
        chapterNo: meta?.chapterNo || ch?.chapter_no || 1,
        categoryName: meta?.categoryName || cat?.name || 'Formula Vault',
        pool: pool.length > 0 ? pool : [formula],
      });
      setCopiedType(null);
      setReportModalOpen(false);
    },
    [chapters, categories]
  );

  const handlePrevNextFormula = useCallback(
    (direction: -1 | 1) => {
      if (!enlargedFormula) return;
      const { formula, pool } = enlargedFormula;
      const idx = pool.findIndex((f) => f.id === formula.id);
      if (idx === -1 || pool.length <= 1) return;
      const nextIdx = (idx + direction + pool.length) % pool.length;
      const nextFormula = pool[nextIdx];
      const ch = chapters.find((c) => c.id === nextFormula.chapter_id);
      const cat = categories.find((c) => c.id === nextFormula.category_id);
      setEnlargedFormula({
        ...enlargedFormula,
        formula: nextFormula,
        chapterTitle: ch?.title || enlargedFormula.chapterTitle,
        chapterNo: ch?.chapter_no || enlargedFormula.chapterNo,
        categoryName: cat?.name || enlargedFormula.categoryName,
      });
      setCopiedType(null);
      setReportModalOpen(false);
    },
    [enlargedFormula, chapters, categories]
  );

  // Keyboard navigation in enlarged modal
  useEffect(() => {
    if (!enlargedFormula) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEnlargedFormula(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrevNextFormula(-1);
      } else if (e.key === 'ArrowRight') {
        handlePrevNextFormula(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enlargedFormula, handlePrevNextFormula]);

  const handleCopyText = async (text: string, type: 'latex' | 'plain') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      showToast(type === 'latex' ? 'LaTeX copied to clipboard' : 'Plain text copied to clipboard', 'success');
      window.setTimeout(() => setCopiedType(null), 1800);
    } catch {
      showToast('Unable to copy to clipboard', 'error');
    }
  };

  const handleBookmarkClick = async (formulaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isSignedIn) {
      showToast('Sign in to save formulas to your favourites.', 'info');
      return;
    }
    try {
      const res = await toggleFormulaBookmark(formulaId);
      setBookmarkedIds(new Set(res.bookmarkedIds));
      showToast(
        res.bookmarked ? 'Saved to your Formula Vault favourites' : 'Removed from favourites',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Unable to update bookmark', 'error');
    }
  };

  const handleDownloadChapterPdf = async (chapter: D1FormulaChapterRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSignedIn) {
      showToast('Sign in and upgrade to Boardly Pro to download chapter PDFs.', 'info');
      return;
    }
    if (!isProOrAdmin) {
      showToast('Chapter PDF sheets are a Boardly Pro feature.', 'info');
      navigate('/pro');
      return;
    }
    try {
      setDownloadingPdfChapterId(chapter.id);
      const { downloadUrl } = await requestChapterPdfSignedUrl(chapter.id);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Boardly_Chapter_${chapter.chapter_no}_${chapter.slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloading "${chapter.title}" formula sheet PDF`, 'success');
    } catch (err: any) {
      if (err?.requiresPro) {
        showToast('Upgrade to Boardly Pro to download chapter PDFs.', 'info');
        navigate('/pro');
      } else {
        showToast(err?.message || 'Failed to download PDF', 'error');
      }
    } finally {
      setDownloadingPdfChapterId(null);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enlargedFormula) return;
    setSubmittingReport(true);
    try {
      await submitFormulaReport({
        formulaId: enlargedFormula.formula.id,
        reason: reportReason,
        details: reportDetails,
      });
      showToast('Formula issue reported to the Formula Bank team.', 'success');
      setReportModalOpen(false);
      setReportDetails('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-28">
      {/* Sticky Header with Back Button, Title, Search Bar, and Mobile Category Chips */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 pt-3.5 pb-3">
          {/* Top Row: Back button + Title + Saved button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) navigate(-1);
                  else navigate('/dashboard');
                }}
                aria-label="Go back"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] transition-transform active:scale-95 hover:border-[var(--accent)]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] truncate">
                    Formula Vault
                  </h1>
                  <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                    Sheet Library
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] truncate">
                  Complete numbered formula sheets by category &amp; chapter
                </p>
              </div>
            </div>

            {/* Saved Favourites toggle pill */}
            <button
              type="button"
              onClick={() => {
                if (!isSignedIn) {
                  showToast('Sign in to save and view favourite formulas.', 'info');
                  return;
                }
                setShowSavedOnly((prev) => !prev);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 font-mono text-xs font-bold transition-colors ${
                showSavedOnly
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Saved</span>
              {bookmarkedIds.size > 0 && (
                <span className="ml-0.5 rounded-full bg-[var(--surface)]/20 px-1.5 py-0.2 font-display text-[11px]">
                  {bookmarkedIds.size}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search formulas, chapters, or subtopics (e.g. Percentages, Ohm's Law, Master Theorem)..."
              className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-2)] py-2.5 pl-10 pr-10 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile Category Chips (Horizontal Scroll) */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar lg:hidden">
            {loadingOverview
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-8 w-32 shrink-0 animate-pulse rounded-full bg-[var(--surface-2)]"
                  />
                ))
              : categories.map((cat) => {
                  const isActive = !showSavedOnly && activeCategory?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="ml-1.5 font-mono opacity-80">· {cat.chapter_count}</span>
                    </button>
                  );
                })}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 pt-4">
        {/* Toast feedback banner */}
        {toastBanner && (
          <div
            role="status"
            className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text)] shadow-sm"
          >
            <span>{toastBanner.message}</span>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              aria-label="Dismiss notification"
              className="rounded-full p-1 text-[var(--muted)] hover:text-[var(--text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Guest Mode Banner */}
        {!isSignedIn && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="font-medium text-[var(--text)]">
                Guest mode: sign in to save favourites.
              </span>
            </div>
            <Link
              to="/login"
              className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Formula of the Day Card (Compact Extra at Top) */}
        {formulaOfTheDay && !debouncedQuery && !showSavedOnly && (
          <div
            onClick={() =>
              handleOpenEnlarged(formulaOfTheDay, [formulaOfTheDay], {
                chapterTitle: formulaOfTheDay.chapter_title,
                chapterNo: formulaOfTheDay.chapter_no,
                categoryName: formulaOfTheDay.category_name,
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenEnlarged(formulaOfTheDay, [formulaOfTheDay], {
                  chapterTitle: formulaOfTheDay.chapter_title,
                  chapterNo: formulaOfTheDay.chapter_no,
                  categoryName: formulaOfTheDay.category_name,
                });
              }
            }}
            className="mb-5 cursor-pointer rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  <Sparkles className="h-3 w-3" />
                  Formula of the Day
                </span>
                <span className="font-mono text-xs text-[var(--muted)]">
                  {formulaOfTheDay.category_name} ·{' '}
                  {String(formulaOfTheDay.chapter_no).padStart(2, '0')}{' '}
                  {formulaOfTheDay.chapter_title}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[var(--muted)] flex items-center gap-1">
                <Maximize2 className="h-3 w-3" />
                Tap to enlarge
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
              <div className="overflow-x-auto text-sm sm:text-base font-medium text-[var(--text)]">
                <MathText text={`$$${formulaOfTheDay.formula_latex}$$`} />
              </div>
              {formulaOfTheDay.note && (
                <p className="text-xs text-[var(--muted)] sm:max-w-xs sm:text-right">
                  {formulaOfTheDay.note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Desktop Sidebar + Main Column */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Desktop Category Sidebar */}
          <aside className="hidden lg:block sticky top-36 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
                Categories
              </span>
              <span className="font-mono text-[11px] text-[var(--muted)]">
                {categories.length}
              </span>
            </div>
            <div className="space-y-1">
              {loadingOverview
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-10 w-full animate-pulse rounded-2xl bg-[var(--surface-2)]"
                    />
                  ))
                : categories.map((cat) => {
                    const isActive = !showSavedOnly && activeCategory?.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`w-full flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold'
                            : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-xs ${
                            isActive
                              ? 'bg-[var(--surface)]/20 text-[var(--accent-contrast)]'
                              : 'bg-[var(--surface-2)] text-[var(--muted)]'
                          }`}
                        >
                          {cat.chapter_count}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="min-w-0">
            {/* Case 1: Active Search Results */}
            {debouncedQuery ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-[var(--text)]">
                    Search results for &ldquo;{debouncedQuery}&rdquo;
                  </h2>
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {searchMatchedFormulas.length} formulas · {searchMatchedChapters.length} chapters
                  </span>
                </div>

                {searching ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                      />
                    ))}
                  </div>
                ) : searchMatchedChapters.length === 0 && searchMatchedFormulas.length === 0 ? (
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <BookOpen className="mx-auto h-8 w-8 text-[var(--muted)] mb-2" />
                    <p className="font-semibold text-[var(--text)]">No matching formulas found</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Try searching for another keyword like &ldquo;Percentages&rdquo;, &ldquo;Logarithm&rdquo;, or &ldquo;Kinematics&rdquo;.
                    </p>
                  </div>
                ) : (
                  <>
                    {searchMatchedChapters.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                          Matching Chapters
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {searchMatchedChapters.map((ch) => (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => {
                                setSearchQuery('');
                                setDebouncedQuery('');
                                setSelectedCategoryId(ch.category_id);
                                setOpenChapterId(ch.id);
                              }}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-left hover:border-[var(--accent)] transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-display text-sm font-black text-[var(--accent)]">
                                    {String(ch.chapter_no).padStart(2, '0')}
                                  </span>
                                  <span className="font-semibold text-sm text-[var(--text)] truncate">
                                    <HighlightMatch text={ch.title} query={debouncedQuery} />
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs text-[var(--muted)] truncate">
                                  <HighlightMatch text={ch.subtopics} query={debouncedQuery} />
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--muted)]">
                                {formatFormulaCountBadge(ch.formula_count)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchMatchedFormulas.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                          Matching Formulas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {searchMatchedFormulas.map((item) => {
                            const isSaved = bookmarkedIds.has(item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() =>
                                  handleOpenEnlarged(item, searchMatchedFormulas, {
                                    chapterTitle: item.chapter_title,
                                    chapterNo: item.chapter_no,
                                    categoryName: item.category_name,
                                  })
                                }
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleOpenEnlarged(item, searchMatchedFormulas, {
                                      chapterTitle: item.chapter_title,
                                      chapterNo: item.chapter_no,
                                      categoryName: item.category_name,
                                    });
                                  }
                                }}
                                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 transition-colors hover:border-[var(--accent)] cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-[var(--accent)]">
                                    <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-display">
                                      #{item.formula_no}
                                    </span>
                                    <span className="text-[var(--muted)] truncate">
                                      {item.chapter_title}
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleBookmarkClick(item.id, e)}
                                    aria-label="Bookmark formula"
                                    className={`rounded-full p-1 transition-colors ${
                                      isSaved
                                        ? 'text-[var(--accent)]'
                                        : 'text-[var(--muted)] hover:text-[var(--text)]'
                                    }`}
                                  >
                                    <Bookmark
                                      className="h-3.5 w-3.5"
                                      fill={isSaved ? 'currentColor' : 'none'}
                                    />
                                  </button>
                                </div>
                                <div className="my-1 overflow-x-auto py-1 text-sm text-[var(--text)]">
                                  <MathText text={`$$${item.formula_latex}$$`} />
                                </div>
                                {item.note && (
                                  <p className="mt-2 text-xs text-[var(--muted)] line-clamp-2">
                                    <HighlightMatch text={item.note} query={debouncedQuery} />
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : showSavedOnly ? (
              /* Case 2: Saved Favourites View */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[var(--text)]">
                      Saved Favourites
                    </h2>
                    <p className="text-xs text-[var(--muted)]">
                      Your bookmarked formulas across all categories
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSavedOnly(false)}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs text-[var(--text)] hover:border-[var(--accent)]"
                  >
                    Back to chapters
                  </button>
                </div>

                {loadingSaved ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                      />
                    ))}
                  </div>
                ) : savedFormulasList.length === 0 ? (
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <Bookmark className="mx-auto h-8 w-8 text-[var(--muted)] mb-2" />
                    <p className="font-semibold text-[var(--text)]">No saved formulas yet</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Tap any formula and press Bookmark to keep it here for quick revision.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {savedFormulasList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          handleOpenEnlarged(item, savedFormulasList, {
                            chapterTitle: item.chapter_title,
                            chapterNo: item.chapter_no,
                            categoryName: item.category_name,
                          })
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenEnlarged(item, savedFormulasList, {
                              chapterTitle: item.chapter_title,
                              chapterNo: item.chapter_no,
                              categoryName: item.category_name,
                            });
                          }
                        }}
                        className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 transition-colors hover:border-[var(--accent)] cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-[var(--accent)] truncate">
                            <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-display">
                              #{item.formula_no}
                            </span>
                            <span className="text-[var(--muted)] truncate">
                              {item.category_name} · {item.chapter_title}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleBookmarkClick(item.id, e)}
                            aria-label="Remove bookmark"
                            className="rounded-full p-1 text-[var(--accent)]"
                          >
                            <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
                          </button>
                        </div>
                        <div className="my-1 overflow-x-auto py-1 text-sm text-[var(--text)]">
                          <MathText text={`$$${item.formula_latex}$$`} />
                        </div>
                        {item.note && (
                          <p className="mt-2 text-xs text-[var(--muted)] line-clamp-2">
                            {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Case 3: Standard Category > Collapsible Chapter Rows > Formulas Grid */
              <div className="space-y-3">
                {/* Category Header Bar */}
                {activeCategory && (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
                    <div>
                      <h2 className="font-display text-lg sm:text-xl font-black text-[var(--text)]">
                        {activeCategory.name}
                      </h2>
                      {activeCategory.description && (
                        <p className="text-xs text-[var(--muted)]">{activeCategory.description}</p>
                      )}
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 font-mono text-xs text-[var(--muted)]">
                      {visibleChapters.length} chapter{visibleChapters.length === 1 ? '' : 's'} ·{' '}
                      {activeCategory.formula_count} formulas
                    </span>
                  </div>
                )}

                {loadingOverview ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-20 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]"
                      />
                    ))}
                  </div>
                ) : visibleChapters.length === 0 ? (
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <p className="font-semibold text-[var(--text)]">
                      No chapters in this category yet
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Select another category or add chapters in the Admin Formula Bank.
                    </p>
                  </div>
                ) : (
                  visibleChapters.map((chapter) => {
                    const isOpen = openChapterId === chapter.id;
                    const isLoadingThisChapter = loadingChapterId === chapter.id;

                    return (
                      <section
                        key={chapter.id}
                        className={`rounded-3xl border transition-colors overflow-hidden ${
                          isOpen
                            ? 'border-[var(--accent)] bg-[var(--surface)] shadow-sm'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50'
                        }`}
                      >
                        {/* Collapsible Chapter Header Row */}
                        <button
                          type="button"
                          onClick={() => handleToggleChapter(chapter.id)}
                          aria-expanded={isOpen}
                          className="w-full flex items-center justify-between gap-3 px-4 py-4 sm:px-5 text-left"
                        >
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border font-display text-base font-black ${
                                isOpen
                                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                              }`}
                            >
                              {String(chapter.chapter_no).padStart(2, '0')}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-display text-base sm:text-lg font-black text-[var(--text)]">
                                  {chapter.chapter_no} {chapter.title}
                                </span>
                              </div>
                              {chapter.subtopics && (
                                <p className="mt-0.5 text-xs text-[var(--muted)] line-clamp-1">
                                  {chapter.subtopics}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 font-mono text-xs font-semibold text-[var(--muted)]">
                              {formatFormulaCountBadge(chapter.formula_count)}
                            </span>
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                                isOpen
                                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]'
                              }`}
                            >
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                          </div>
                        </button>

                        {/* Open Chapter Body (KaTeX rendered ONLY for the open chapter) */}
                        {isOpen && (
                          <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/40 px-4 py-4 sm:px-5">
                            {/* Action Sub-bar: "Pick a formula to enlarge it" + "Download PDF (Premium)" */}
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono text-xs text-[var(--muted)] flex items-center gap-1.5">
                                <Maximize2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                                Pick a formula to enlarge it
                              </span>

                              <button
                                type="button"
                                onClick={(e) => handleDownloadChapterPdf(chapter, e)}
                                disabled={downloadingPdfChapterId === chapter.id}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors disabled:opacity-60"
                              >
                                {isProOrAdmin ? (
                                  <Download className="h-3.5 w-3.5" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5" />
                                )}
                                <span>
                                  {downloadingPdfChapterId === chapter.id
                                    ? 'Preparing PDF...'
                                    : 'Download PDF (Premium)'}
                                </span>
                              </button>
                            </div>

                            {/* Formulas Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
                            {isLoadingThisChapter ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                                  />
                                ))}
                              </div>
                            ) : openChapterFormulas.length === 0 ? (
                              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-xs text-[var(--muted)]">
                                No formulas published in this chapter yet.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {openChapterFormulas.map((formula) => {
                                  const isSaved = bookmarkedIds.has(formula.id);
                                  return (
                                    <div
                                      key={formula.id}
                                      onClick={() =>
                                        handleOpenEnlarged(formula, openChapterFormulas, {
                                          chapterTitle: chapter.title,
                                          chapterNo: chapter.chapter_no,
                                          categoryName: activeCategory?.name,
                                        })
                                      }
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          handleOpenEnlarged(formula, openChapterFormulas, {
                                            chapterTitle: chapter.title,
                                            chapterNo: chapter.chapter_no,
                                            categoryName: activeCategory?.name,
                                          });
                                        }
                                      }}
                                      className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 transition-colors hover:border-[var(--accent)] cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="inline-flex h-6 min-w-[26px] items-center justify-center rounded-full bg-[var(--surface-2)] px-2 font-display text-xs font-black text-[var(--accent)]">
                                            {formula.formula_no}
                                          </span>
                                          {formula.title && (
                                            <span className="text-xs font-semibold text-[var(--text)] truncate">
                                              {formula.title}
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => handleBookmarkClick(formula.id, e)}
                                          aria-label="Bookmark formula"
                                          className={`rounded-full p-1 transition-colors ${
                                            isSaved
                                              ? 'text-[var(--accent)]'
                                              : 'text-[var(--muted)] opacity-70 group-hover:opacity-100 hover:text-[var(--text)]'
                                          }`}
                                        >
                                          <Bookmark
                                            className="h-3.5 w-3.5"
                                            fill={isSaved ? 'currentColor' : 'none'}
                                          />
                                        </button>
                                      </div>

                                      <div className="my-1 overflow-x-auto py-1.5 text-sm text-[var(--text)]">
                                        <MathText text={`$$${formula.formula_latex}$$`} />
                                      </div>

                                      {formula.note && (
                                        <p className="mt-2 text-[11px] text-[var(--muted)] line-clamp-2">
                                          {formula.note}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    );
                  })
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Enlarged Formula Modal / Bottom Sheet */}
      {enlargedFormula && (
        <div
          data-fullscreen-modal="true"
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setEnlargedFormula(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Top Bar */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 font-display text-xs font-black text-[var(--accent)]">
                    Formula #{enlargedFormula.formula.formula_no}
                  </span>
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {enlargedFormula.categoryName} ·{' '}
                    {String(enlargedFormula.chapterNo).padStart(2, '0')}{' '}
                    {enlargedFormula.chapterTitle}
                  </span>
                </div>
                {enlargedFormula.formula.title && (
                  <h3 className="mt-1 font-display text-lg font-black text-[var(--text)]">
                    {enlargedFormula.formula.title}
                  </h3>
                )}
              </div>

              <button
                type="button"
                onClick={() => setEnlargedFormula(null)}
                aria-label="Close enlarged view"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Large KaTeX Formula Box */}
            <div className="rounded-3xl border border-[var(--accent)]/40 bg-[var(--surface-2)] px-5 py-8 text-center overflow-x-auto">
              <div className="text-lg sm:text-2xl font-semibold text-[var(--text)]">
                <MathText text={`$$${enlargedFormula.formula.formula_latex}$$`} />
              </div>
            </div>

            {/* Formula Note */}
            {enlargedFormula.formula.note && (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-3">
                <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                  Note &amp; Application
                </span>
                <p className="text-sm text-[var(--text)]">{enlargedFormula.formula.note}</p>
              </div>
            )}

            {/* Action Pills: Copy LaTeX, Copy Plain Text, Bookmark, Report */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyText(enlargedFormula.formula.formula_latex, 'latex')}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 font-mono text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]"
              >
                {copiedType === 'latex' ? (
                  <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedType === 'latex' ? 'Copied LaTeX' : 'Copy LaTeX'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    enlargedFormula.formula.plain_text ||
                      enlargedFormula.formula.formula_plain ||
                      enlargedFormula.formula.formula_latex,
                    'plain'
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 font-mono text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]"
              >
                {copiedType === 'plain' ? (
                  <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedType === 'plain' ? 'Copied Text' : 'Copy plain text'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleBookmarkClick(enlargedFormula.formula.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-mono text-xs font-semibold transition-colors ${
                  bookmarkedIds.has(enlargedFormula.formula.id)
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]'
                }`}
              >
                <Bookmark
                  className="h-3.5 w-3.5"
                  fill={bookmarkedIds.has(enlargedFormula.formula.id) ? 'currentColor' : 'none'}
                />
                <span>
                  {bookmarkedIds.has(enlargedFormula.formula.id) ? 'Bookmarked' : 'Bookmark'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReportModalOpen((prev) => !prev)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-mono text-xs text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)]"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>Report issue</span>
              </button>
            </div>

            {/* Collapsible Report Issue Form */}
            {reportModalOpen && (
              <form
                onSubmit={handleSubmitReport}
                className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--text)]">
                    Report a formula error
                  </span>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    Cancel
                  </button>
                </div>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)]"
                >
                  <option value="incorrect_formula">Incorrect formula or symbol</option>
                  <option value="rendering_issue">LaTeX rendering issue</option>
                  <option value="typo_in_note">Typo in note or title</option>
                </select>
                <input
                  type="text"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Optional details (e.g. missing exponent on r)..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-xs font-bold text-[var(--accent-contrast)] disabled:opacity-50"
                  >
                    {submittingReport ? 'Sending...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}

            {/* Previous / Next Navigation Footer */}
            <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => handlePrevNextFormula(-1)}
                disabled={enlargedFormula.pool.length <= 1}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 font-mono text-xs font-bold text-[var(--text)] hover:border-[var(--accent)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <span className="font-mono text-xs text-[var(--muted)]">
                {enlargedFormula.pool.findIndex((f) => f.id === enlargedFormula.formula.id) + 1} of{' '}
                {enlargedFormula.pool.length}
              </span>

              <button
                type="button"
                onClick={() => handlePrevNextFormula(1)}
                disabled={enlargedFormula.pool.length <= 1}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 font-mono text-xs font-bold text-[var(--text)] hover:border-[var(--accent)] disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaVaultPage;
